# RxJS for Angular Developers

RxJS is the library Angular uses to represent and compose Observable streams. It is most valuable when an application must coordinate events over time: form changes, HTTP responses, navigation, timers, or live updates. An operator chain can make concurrency and cancellation explicit, but a chain that is difficult to explain is not automatically better than ordinary code. Choose operators by the behavior the feature needs and make subscription ownership clear.

## Building a stream

Most RxJS code starts with a source (`valueChanges`, an HTTP call, or an event stream), applies operators with `pipe`, and ends at a consumer such as the `async` pipe or a lifecycle-bound subscription. Operators transform values without changing the source's type of responsibility. Keep streams named after their meaning rather than after their implementation:

```ts
import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { SearchApi } from './search-api';

@Component({
  selector: 'app-search-panel',
  standalone: true,
  imports: [AsyncPipe, ReactiveFormsModule],
  template: `
    <input [formControl]="query" aria-label="Search">
    @for (result of results$ | async; track result.id) {
      <p>{{ result.label }}</p>
    }
  `,
})
export class SearchPanel {
  private readonly searchApi = inject(SearchApi);
  readonly query = new FormControl('', { nonNullable: true });

  readonly results$ = this.query.valueChanges.pipe(
    map(term => term.trim()),
    debounceTime(250),
    distinctUntilChanged(),
    switchMap(term => this.searchApi.search(term).pipe(
      catchError(() => of([])),
    )),
    startWith([]),
  );
}
```

The example assumes `SearchApi.search()` returns an observable array whose items have `id` and `label` fields; the actual API type should define those fields. Its empty array conflates initial loading, failure, and “no matches.” Production UI should model request state explicitly (for example a discriminated union containing `loading`, `success`, or `error`) so these states are not confused.

## Higher-order mapping and concurrency

An operator such as `switchMap` maps each source value to an inner Observable and manages the inner subscriptions. The four common flattening operators express different product semantics:

- **`switchMap`** cancels the previous inner subscription when a new source value arrives. Search-as-you-type is a common fit because an old result is no longer relevant after the query changes.
- **`concatMap`** queues inner work and processes it sequentially. This suits ordered writes where each request must run after the previous one, but a slow request can build a queue.
- **`mergeMap`** allows concurrent inner work. It is useful when results are independent; bound concurrency when a high-volume source could overwhelm a server.
- **`exhaustMap`** ignores new source values while an inner request is active. This can prevent repeated submit clicks from starting overlapping requests, but is wrong when later values must be retained.

These are not interchangeable performance tricks. Pick based on what a user action means. If each save must complete in order, `switchMap` may cancel a write from the browser even though the server could still process it. If only the newest search matters, `concatMap` can show outdated results long after the query changed.

## Cancellation and stale results

The RxJS subscription model lets `switchMap` stop listening to an obsolete request. For Angular `HttpClient`, unsubscription normally aborts an in-flight browser request. It cannot guarantee that the server did not receive or process the request. For read-only searches this is typically a useful optimization; for mutations, cancellation does not provide transactional rollback.

Avoid manually subscribing to an inner observable inside `map`. That creates a nested subscription whose lifetime and errors are disconnected from the outer stream. Higher-order operators preserve composition, cancellation, and error handling:

```ts
// Prefer this:
const order$ = orderId$.pipe(
  switchMap(id => this.orderApi.getById(id)),
);
```

When combining several sources, choose according to when values are required. `combineLatest` emits after each source has emitted at least once and then whenever any source changes. `forkJoin` waits for all finite sources to complete and emits their last values once; it is suitable for parallel one-shot HTTP requests, not for never-ending streams. `withLatestFrom` samples other streams only when its primary source emits, which is useful when an action should use the current form value.

## Error placement and retry behavior

`catchError` replaces a failed stream with another observable. Its placement determines whether a whole interaction ends or only one request fails. Inside `switchMap`, it can turn one failed search into a recoverable result while keeping the query stream alive. Outside the flattening operator, it may replace the entire query stream, which often means later keystrokes no longer trigger requests.

Retry is not universally safe. A transient network error on a GET may justify a bounded retry with delay. Retrying a payment or create operation can duplicate effects unless the API uses idempotency keys or otherwise protects the operation. Set limits, avoid retrying permanent client errors, and provide visible feedback when retrying is not automatic. `finalize` is useful for cleanup that must happen on completion, error, or unsubscription, but remember that it runs for cancellation too.

## Sharing and caching

Each subscription to a cold source can repeat its work. A template with multiple independent `async` subscriptions to the same HTTP observable may issue multiple requests. Prefer one template subscription (using `@if (data$ | async; as data)`) or share the stream when multiple consumers truly need the same execution.

`shareReplay` can multicast and replay a recent value, but it does not define a complete cache policy. Think about when the source is subscribed, whether it stays connected without consumers, how errors are handled, whether data goes stale, and how refresh invalidates the value. A simple feature service may explicitly expose a refresh trigger rather than retain a response forever. Test these lifecycle choices instead of assuming replay is harmless.

## Teardown and Angular lifecycle

The `async` pipe is a strong default for template consumption: Angular subscribes, updates the view, and unsubscribes with the view. For imperative effects tied to a component, use `takeUntilDestroyed()` or another explicit teardown strategy. Long-lived sources such as `interval`, DOM events, subjects, and sockets must not outlive the UI that owns them unless they are intentionally service-scoped.

Avoid creating a new cold stream in a template expression on every check. Create it once as a class property or derive it from a stable source. Likewise, do not assume an HTTP observable is shared merely because it is stored in a field.

## Testing operator behavior

Test behavior that matters to the user rather than asserting an exact operator chain. For a search stream, verify that a later query supersedes an earlier slow response and that one failed request does not prevent a later query from working. For a save flow, verify whether repeated clicks are queued, ignored, or allowed concurrently according to the product rule. Angular's HTTP testing utilities can assert requests and flush results; RxJS scheduler-based testing tools can make time-dependent debounce behavior deterministic.

Keep tests aligned with the actual lifecycle. A test that subscribes twice may intentionally make two requests for a cold source; if the feature intends one request, test the sharing boundary explicitly. When using fake timers or virtual schedulers, avoid mixing real timer assumptions with virtual time in the same assertion. Name streams and isolate transformation functions when a complex pipeline is easier to test in smaller pieces.

## Readability and maintainability

An operator chain becomes difficult when it mixes input normalization, request selection, side effects, error conversion, caching, and UI status in one expression. Break out a named operator or helper when it clarifies a reusable rule. Avoid custom abstractions for one obvious `map`; abstraction is useful when it carries meaning, not merely because the chain has several lines.

Keep side effects at clear boundaries. `tap` can log, update a metric, or trigger a narrow side effect, but it should not secretly transform the value or own a second copy of state. Prefer the stream's output to describe data and status, and let the component render it. For imperative effects, bind subscription teardown to the component or service lifecycle.

## Subjects and event ownership

A `Subject` is both an observer and an observable, so callers can push values into a stream. A `BehaviorSubject` also retains and immediately emits its latest value to new subscribers. These are useful for bridging external events or exposing a service-owned stream, but exposing a writable subject lets every consumer publish arbitrary state changes. Keep the subject private and expose only `asObservable()` or a read-only abstraction when the service owns updates. Do not call `error()` for an ordinary request failure: an errored subject is terminal and cannot represent later successful updates. Model errors as values or recover inside the request stream instead.

## Choosing RxJS or signals

Signals represent current synchronous state and computed relationships; RxJS represents event sequences and asynchronous composition. A form's current value may be state, while changes to that form over time are an event stream. Use RxJS when cancellation, concurrency, timing, or combining streams is central. Use signals when the principal need is a current value read by a template. Interop helpers can bridge them, but choose one authoritative owner rather than maintaining duplicate signal and observable versions of the same state.

**Interview takeaway:** describe why the selected flattening operator matches the business rule, where errors are recovered, who owns the subscription, and what cancellation does—and does not—guarantee. This shows more than memorizing operator names.

## Related Topics

- [Observables](./observables.md)
- [HTTP Client](./http-client.md)
- [Forms](./forms.md)
- [State Management](./state-management.md)
- [Signals](./signals.md)
