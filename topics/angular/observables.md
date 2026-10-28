# Observables in Angular

An Observable represents a sequence of values that may arrive over time. That sequence may be synchronous or asynchronous, finite or ongoing, and it may emit zero, one, or many values before completing or failing. Angular uses RxJS Observables for HTTP, reactive forms, router events, and many integration points. The key production question is not only “what value is emitted?” but also “who subscribes, how long does the work live, and what happens when nobody needs it anymore?”

## Observable lifecycle and execution

An observable describes a producer; subscribing connects a consumer to it. When subscribed, the consumer can receive `next` values, an `error`, or a `complete` notification. Error and completion are terminal: after either one, that subscription receives no more values. Unsubscription stops the consumer's interest and may cancel producer work if the producer supports teardown.

Cold observables generally start their work independently for each subscription. Angular `HttpClient` observables are cold: each subscription normally sends a new request. For example, subscribing once in a component and once again in a template can cause duplicate requests if the two consumers subscribe to the same unshared HTTP observable. Hot observables, such as a shared event source or a subject, can emit regardless of a particular subscriber. “Observable” itself does not mean hot, asynchronous, or cancellable; those properties depend on the producer and operators involved.

This distinction also explains why Observables are not merely Promises. A Promise represents one eventual result and its standard API has no consumer unsubscription mechanism. An Observable can represent repeated events, can be lazy, and can compose cancellation and transformation. For a single HTTP result a Promise-like shape may appear sufficient, but Angular's observable API integrates naturally with cancellation, retries, event streams, and templates.

## Prefer view-owned subscription

The `async` pipe is a good default for values rendered in a template. It subscribes, exposes the latest value, notifies the view when values arrive, and unsubscribes when the view is destroyed or when the bound observable changes:

```ts
import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { CustomerApi } from './customer-api';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    @if (customers$ | async; as customers) {
      @for (customer of customers; track customer.id) {
        <p>{{ customer.name }}</p>
      }
    } @else {
      <p>Loading customers…</p>
    }
  `,
})
export class CustomerListComponent {
  private readonly api = inject(CustomerApi);
  readonly customers$ = this.api.list();
}
```

In real screens, a bare `else` here may not distinguish an initial loading state from an emitted empty array. Model request state explicitly when that distinction matters. The central benefit of the pipe is clear ownership: the view consumes a stream and Angular handles its subscription lifetime.

Imperative subscriptions are reasonable when values trigger an action that does not belong in rendering, but their lifecycle must be controlled. In current Angular, `takeUntilDestroyed()` is a convenient way to complete a component-owned stream when its injection context is destroyed:

```ts
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-query-input',
  standalone: true,
  template: '<input [formControl]="query">',
})
export class QueryInputComponent {
  private readonly destroyRef = inject(DestroyRef);
  readonly query = new FormControl('', { nonNullable: true });

  constructor() {
    this.query.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => console.log('Query changed:', value));
  }
}
```

The explicit `DestroyRef` is useful when the operator is called outside a constructor or another injection context. Do not accumulate subscriptions manually in arrays unless the lifecycle truly needs custom control. A one-shot HTTP observable normally completes after its response, but that is not a reason to ignore ownership: a request may remain active while the view is destroyed, and event streams, intervals, sockets, and subjects can live indefinitely.

## Errors, completion, and sharing

Handle errors at the boundary that has enough context to recover. A component may show a retry action; an API layer may map transport details into a consistent result; an interceptor may apply a narrow cross-cutting policy. If a `catchError` is placed outside a long-lived stream, one failed request can replace and terminate that stream. In a search stream, handling an individual request inside `switchMap` allows later query changes to continue working.

Sharing is a deliberate behavior decision. Operators such as `share` or `shareReplay` can prevent multiple consumers from independently running a cold source, but they also affect when the source starts and stops and whether old values remain available to later subscribers. A replayed HTTP result can become stale, and a retained subscription may keep work alive. Decide who invalidates cached data and whether errors or completion should be replayed; do not apply `shareReplay(1)` as a magic cache decorator.

Unsubscribing from `HttpClient` can abort the client-side request while it is in flight. It does not roll back a write that the server already received or prove that server processing stopped. Cancellation is a resource and UI behavior, not a transaction guarantee. For writes, design server operations to handle retries and duplicates safely where needed.

## Observable versus signal

Signals model synchronous state as a current value with tracked dependencies. Observables model a stream of events over time. A component's current selected tab may fit a signal; keystrokes, websocket messages, or a changing search query are naturally streams. Both can coexist: convert at a clear boundary when a template wants signal-style state or an async process needs RxJS operators. Avoid repeated round-trips that make it unclear which representation is authoritative.

Observables make asynchronous work composable but can obscure behavior when chains grow too clever. Name meaningful streams (for example `results$`, `saveState$`) and document non-obvious cancellation or sharing choices. Prefer explicit loading/error/success states over relying on a silent `undefined` that has several possible meanings.

## Interview points and common traps

- An Observable is not necessarily asynchronous or hot.
- `subscribe()` is the point at which a cold source often starts, not merely a way to read a value already computed.
- Multiple subscriptions can duplicate cold-source work.
- The `async` pipe manages both view notification and teardown.
- Unsubscription means the consumer no longer observes; it does not guarantee external work was undone.
- Completion and error are terminal notifications.
- Sharing and replay change lifecycle and cache semantics; they are not free optimizations.

**Interview takeaway:** explain the producer, subscription owner, teardown behavior, and error path. That demonstrates production understanding more clearly than simply listing Observable operators.

## Related Topics

- [RxJS](./rxjs.md)
- [HTTP Client](./http-client.md)
- [Change Detection](./change-detection.md)
- [Signals](./signals.md)
- [State Management](./state-management.md)
