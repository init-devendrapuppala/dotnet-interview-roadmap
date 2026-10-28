# State Management in Angular

State management is the work of deciding where application data lives, who can change it, how derived values are computed, and how views learn about updates. The goal is not to put every value into one global store. A good design keeps state near its owner, makes transitions predictable, and defines what happens when data becomes stale or an operation fails.

## Identify the kind of state first

Different state has different lifetimes and authority:

- **Local UI state** includes an open menu, selected tab, or temporary expansion. It usually belongs in the component that renders it.
- **Form state** includes draft values, dirty/touched status, and validation. It generally belongs to the form, not a global store.
- **Shared client state** is needed by multiple parts of a feature or app, such as a shopping cart count or selected workspace.
- **Server state** is data fetched from an API. It can become stale, fail to load, or need refresh after a mutation.
- **Durable state** must survive reloads or devices. It usually belongs on the server; browser storage is only a client-side cache or preference store.

The browser is not authoritative. Local state cannot enforce a business invariant, permission, or durable transaction. An ASP.NET Core API must validate inputs, authorize each resource operation, and persist the source of truth.

## Start local; lift only when sharing is real

Component fields or signals are the lowest-ceremony choice for state used by one view. If sibling components need the same state, a parent can own it and pass data down through inputs while receiving user intent through outputs. If the state is shared across routes or independent parts of a feature, a service with deliberate provider scope can be appropriate.

Lifting state has a cost: more components depend on it, and its lifetime may become longer. A root service may preserve values across navigation when the feature expected them to reset. A route- or component-scoped service can isolate a workflow but may create a new instance when that boundary is recreated. Decide scope based on ownership and lifecycle, not convenience alone.

## A small signal-based feature store

For modest synchronous shared state, a service can expose read-only signals and methods that define valid updates:

```ts
import { Injectable, computed, signal } from '@angular/core';

interface CartLine {
  productId: number;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartState {
  private readonly linesState = signal<readonly CartLine[]>([]);
  readonly lines = this.linesState.asReadonly();
  readonly itemCount = computed(() =>
    this.linesState().reduce((total, line) => total + line.quantity, 0),
  );

  add(productId: number, quantity = 1): void {
    if (quantity <= 0) return;

    this.linesState.update(lines => {
      const current = lines.find(line => line.productId === productId);
      if (current) {
        return lines.map(line =>
          line.productId === productId
            ? { ...line, quantity: line.quantity + quantity }
            : line,
        );
      }
      return [...lines, { productId, quantity }];
    });
  }
}
```

The example keeps mutation behind methods and derives `itemCount` rather than storing a second value that can drift. It is an in-memory client state only. It does not validate stock, price, or checkout rules; the API must do that. For a small feature, this level of structure may be enough. It is not a miniature replacement for a complete state library.

## When a store or library helps

A dedicated state library can help when many screens coordinate the same state, updates have complex rules, asynchronous effects need consistent error handling, or debugging requires an action history. Reducers/actions make transitions explicit; selectors centralize derivation; effects isolate asynchronous work. The benefits are more uniform flows and better tooling, with tradeoffs in boilerplate, abstractions, and team learning.

Adopt a library to solve a demonstrated coordination problem, not because an application has several components. A local form does not need global actions and reducers. Conversely, duplicating the same mutable state in several services can be harder to maintain than a well-defined feature store. Keep store boundaries aligned with capabilities and avoid one massive global object whose fields have unrelated lifetimes.

## Separate source state from derived state

Store the smallest authoritative client representation that supports the feature. If a cart has line items, derive the item count and total from those lines rather than persisting three independently mutable values. This avoids drift when one update path changes quantity but forgets to update the total. Derived state can be a computed signal or a selector in a store.

There are valid cases for storing a derived snapshot—for example, a server-calculated quote that must be shown exactly as returned—but make its source and refresh policy clear. A server quote is not equivalent to recalculating a price in the browser. The UI can display a cached estimate while the server remains the authority for checkout.

State transitions should express domain intent. `addLine`, `removeLine`, or `selectWorkspace` communicates more than exposing a writable signal and letting every consumer mutate internal structure. Encapsulated methods make it possible to preserve client-side consistency, while avoiding a service that exposes arbitrary setters for every field.

## Async data is not just a value

An API result has a lifecycle: it may be idle, loading, successful (including an empty result), or failed. Modelling only `data: T[] | null` often hides whether `null` means “not requested,” “not found,” or “request failed.” Use an explicit status type when the UI needs to distinguish those cases:

```ts
type LoadState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };
```

For request-heavy features, decide:

1. What triggers the first load?
2. Is an old result shown during refresh?
3. Which mutation invalidates or updates the cached result?
4. How are concurrent requests handled?
5. What can be retried safely?

Do not treat `shareReplay` as a cache policy by itself. A cached result requires a lifetime, a refresh strategy, and an error policy. If several consumers subscribe to one cold `HttpClient` observable, sharing may prevent duplicate requests, but replaying indefinitely can display stale data. For writes, client-side cancellation or retry cannot guarantee that server work was undone or executed only once.

When a mutation succeeds, choose whether to update the client cache optimistically or wait for the server response. Optimistic updates can make an interaction feel fast, but they require rollback or reconciliation if the request fails and can temporarily show a state the server rejects. Waiting for confirmation is simpler and safer but can feel slower. Use optimistic behavior for operations with clear reversal semantics and recovery; do not make it the default for financial or permission-sensitive operations.

Avoid stale-response races. A page may start a load for one filter, then start another after the filter changes; if the first response arrives last, it must not overwrite the newer results. In an RxJS flow, `switchMap` is often appropriate for obsolete reads. In a store, attach request identity or scope results to the query key. This is a correctness concern, not merely a performance optimization.

## Signals and RxJS together

Signals are effective for synchronous current state and derived values read by templates. RxJS is effective for asynchronous sequences, cancellation, timing, and combining events. A search box's current query can be held as a signal, while query changes and HTTP requests can be handled with RxJS. Convert between them at a meaningful boundary rather than maintaining two independently writable copies.

Use one source of truth for each value. If both a signal and a subject can update the same list, developers must reason about ordering and consistency. Derived values should generally be computed from the source rather than synchronized through effects or subscriptions.

## Scope, account changes, and durable state

State lifetime should match the user's expectation. A component-level filter can disappear when the view is closed; a root-scoped cart may persist between routes; a selected account should be cleared or reloaded when the authenticated identity changes. Make logout and account-switch behavior explicit, especially for in-memory caches that contain user-specific records. Do not rely on navigating to the sign-in page to implicitly clear every service.

Use the URL for state that should be shareable or survive refresh, such as a search query or page number. Use browser storage only for appropriate client preferences or cache data, and account for versioning, corruption, and stale values. Sensitive credentials and authoritative business data belong elsewhere. Persisting a state snapshot is not the same as making the operation durable on the server.

## Persistence, security, and testing

Persist only the state the user expects to survive. URL query parameters work well for shareable filters and paging. Local storage can retain harmless preferences, but it is accessible to scripts running in the origin and should not be used as a vault for secrets. Do not rely on browser state for authorization or trusted prices.

Test state transitions separately from rendering where possible, then test a few integration paths through the UI. Verify initial, loading, empty, error, refresh, and mutation behavior. For a global store, tests should confirm that actions produce expected state and that async effects handle cancellation and failures. Avoid testing private implementation details at the expense of user-visible behavior.

**Interview takeaway:** begin by classifying state and identifying its owner and lifetime. Explain when local component state is enough, when a service or library adds value, how server data becomes stale, and why the backend remains authoritative.

## Related Topics

- [Signals](./signals.md)
- [Services](./services.md)
- [Observables](./observables.md)
- [RxJS](./rxjs.md)
- [Change Detection](./change-detection.md)
