# Change Detection

Change detection is how Angular keeps a rendered view consistent with application state. A template declares bindings such as `{{ total }}` or `[disabled]="saving"`. When the relevant state changes and Angular is notified, it evaluates bindings and updates affected DOM properties where values differ. Angular does not recreate the whole DOM for every event. Understanding when a view is checked is useful for performance and for diagnosing stale UI, especially in component trees with frequent events or large lists.

## Default and OnPush strategies

With the default change-detection strategy, Angular checks a component subtree during framework-scheduled change-detection passes. In traditional applications, events, asynchronous work observed by Angular, and framework operations commonly trigger such passes. This approach is forgiving because ordinary state changes are usually reflected, but a large tree may perform more binding work than necessary.

`ChangeDetectionStrategy.OnPush` narrows the situations in which a component subtree is checked. Important notifications include a changed bound input, an event handled in that view, an emission consumed by the `async` pipe, a signal read by the template changing, or an explicit framework notification. It is therefore inaccurate to say that OnPush means “run only when an input changes.” It means the view can be skipped until Angular has a reason to check it. OnPush is particularly effective when inputs are treated immutably and updates follow clear paths.

```ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

interface User {
  id: number;
  name: string;
}

@Component({
  selector: 'app-user-name',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<span>{{ user().name }}</span>',
})
export class UserNameComponent {
  readonly user = input.required<User>();
}
```

If a parent mutates `user.name` but keeps the same object reference, the child does not receive a new input value. With an OnPush boundary, relying on that nested mutation can leave the child stale. Prefer replacing the object:

```ts
this.user = { ...this.user, name: 'Asha' };
```

Signals provide another explicit notification mechanism. A template read such as `user()` registers the view as a consumer; updating the signal notifies Angular. But signals do not make a costly computation cheap, nor do they eliminate the need to identify the right state owner.

## View lifecycle and notifications

Angular's view tree includes component views, embedded views created by structural control flow, and child views. A check evaluates bindings in the relevant views and runs applicable lifecycle hooks such as `ngDoCheck` and `ngAfterViewChecked`. Hooks that run during every check can become costly; avoid putting heavy work or state mutation in them. A computed value, observable pipeline, or explicit event handler is usually easier to reason about than repeated work in a check hook.

Change detection is not a general-purpose polling loop. A value changed outside Angular's notification paths might not be reflected until some later event triggers a check. This can occur with third-party callbacks, custom schedulers, or code that runs outside Angular's zone in zone-based applications. In those cases, connect the update to Angular's supported mechanisms—such as updating a template-read signal, using an Angular-aware async primitive, or marking the view for check. The exact integration should match the application's Angular version and zoneless/zone-based configuration.

`ChangeDetectorRef` offers lower-level controls:

- `markForCheck()` marks an OnPush view for a future check. It is generally preferable to forcing synchronous work when a later framework pass is appropriate.
- `detectChanges()` immediately checks a view and its children. It can be useful for tightly controlled integrations, but routine use often hides a broken state-flow or timing assumption.
- `detach()` and `reattach()` let advanced code opt a view out of automatic checks and later restore it. A detached view needs deliberate manual updates and can easily become stale.

Use these APIs only with a clear lifecycle and tested reason. Repeated `detectChanges()` calls can create extra work, make ordering difficult, and obscure the root cause of a stale binding. Do not mutate component state during a check in a way that changes values already checked; Angular's development-mode checks may surface an expression-changed error because the view was not stable for that pass.

## Observable and signal integration

The `async` pipe subscribes to an observable or promise in the template, exposes the latest value, and marks the view for update when a new value arrives. It unsubscribes from an Observable when the view is destroyed or the expression changes; a Promise itself cannot be cancelled, but the pipe stops using its result after the binding changes. This makes its ownership visible and avoids a common class of stale-value and leak problems:

```ts
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CustomerApi } from './customer-api';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (customers$ | async; as customers) {
      @for (customer of customers; track customer.id) {
        <p>{{ customer.name }}</p>
      }
    }
  `,
})
export class CustomersComponent {
  private readonly api = inject(CustomerApi);
  readonly customers$ = this.api.list();
}
```

In modern templates, `@for (...; track customer.id)` lets Angular associate existing views with stable records. Tracking by array index can show incorrect row state after insertion or reordering. Tracking by a unique, stable key reduces unnecessary DOM work and preserves the right row identity. If records do not have a stable identifier, choose an appropriate key or understand the cost of recreating rows.

An observable subscription in TypeScript does not automatically make updates visible in every configuration. Prefer the async pipe or lifecycle-aware APIs such as `takeUntilDestroyed()` for subscriptions owned by a component. If using a manual subscription, make the notification and teardown behavior explicit. Similarly, a signal read in a template is tracked; a signal used only in arbitrary untracked code does not automatically establish a template dependency.

## Performance habits that scale

1. **Measure before optimizing.** Profile change-detection time and rendering behavior with realistic data. A theoretical check may not be the bottleneck; network latency, layout, or a large image may dominate.
2. **Reduce work at the source.** Keep state local where possible, derive values rather than copying them, and avoid recalculating expensive results on every template evaluation.
3. **Use OnPush deliberately.** It works best with immutable inputs, signals, and observable bindings. Mutability is not forbidden, but it makes notification harder to reason about.
4. **Use stable list keys.** This avoids unnecessary view recreation and preserves focus, child component state, and DOM identity.
5. **Keep templates cheap.** A method call in a template may be evaluated whenever its view is checked. A trivial getter is not automatically a problem, but expensive filtering, sorting, or allocation belongs in an appropriately memoized/derived computation.
6. **Avoid redundant notifications.** Debounce high-frequency input where it matches user expectations; do not throttle updates so aggressively that the UI becomes incorrect.
7. **Check lifecycle work.** Subscriptions, timers, observers, and external callbacks must be cleaned up or scoped to the view's lifetime.

Avoid adding `OnPush` mechanically without checking all update paths. For example, a legacy service may mutate a shared object without emitting a new value; changing the component strategy can expose that hidden coupling. Conversely, default strategy is not inherently slow. The meaningful question is how much work the application performs per notification and whether the view can be skipped safely.

## Lists, templates, and rendering cost

For a list, Angular must decide whether to reuse an existing embedded view or create and destroy one. A stable key provides identity across refreshes even if the server returns new object instances:

```html
@for (product of products; track product.id) {
  <app-product-row [product]="product" />
} @empty {
  <p>No products found.</p>
}
```

Tracking by object identity can recreate every row if a refreshed response contains new object instances. Tracking by index can associate a row's local state with the wrong record after a reorder or deletion. A stable business identifier is usually best, provided it is unique within the rendered collection. Avoid using a non-unique key, which can cause incorrect reuse.

Also distinguish change detection from browser rendering cost. A view can be checked without a visible DOM change; a DOM update can then cause layout or paint work that is expensive for reasons outside Angular's binding evaluation. Large images, complex CSS, and thousands of rendered rows may dominate. Virtual scrolling, pagination, or reducing template complexity may help more than a change-detection setting.

## Testing stale-view problems systematically

When a UI appears stale, trace the state transition instead of adding a forced check immediately:

1. Confirm the value actually changed and identify whether it was replaced or mutated in place.
2. Confirm the template reads that exact value, rather than a copied field that was not updated.
3. Determine whether the view is default or OnPush and whether Angular received a notification.
4. Check whether an observable subscription is still active and whether the emission reaches the view.
5. Check integration code that may run outside Angular's normal scheduling context.
6. Add a focused test that changes the state and asserts the resulting DOM.

This sequence separates a data bug from a scheduling bug. In unit tests, use Angular's normal fixture change-detection APIs deliberately; manually calling detection in the test can hide that a real application path does not notify the view. For third-party libraries, a small adapter can translate callbacks into signals or another Angular-aware path, keeping framework-specific scheduling at the integration boundary.

## Zone-based and zoneless applications

Historically, Zone.js helped Angular know when asynchronous browser work might need a change-detection pass. Modern Angular supports zoneless configurations and continues evolving how views are notified. Code should therefore rely on explicit Angular notification mechanisms—template events, signals, async bindings, and documented integration APIs—instead of assuming that every arbitrary callback triggers a global check. For third-party libraries, verify compatibility with the application's actual zone-based or zoneless setup and Angular version.

Do not treat zones as a substitute for state ownership. A zone-triggered pass cannot make a mutated object produce a new immutable input reference, nor can it fix an observable that was never subscribed. Explicit state updates are easier to test and less sensitive to scheduling details.

## Interview misconceptions

- **“OnPush checks only changed inputs.”** Events, async-pipe emissions, signal updates, and explicit notifications can also schedule checks.
- **“Angular redraws the page.”** It evaluates bindings and updates relevant DOM values; existing elements are generally reused.
- **“Signals replace change detection.”** Signals notify Angular about dependencies and help schedule targeted updates; Angular still has to update views.
- **“Manual detection fixes any stale UI.”** It may hide an integration problem. First identify what changed, how Angular is notified, and which view owns the binding.

**Interview takeaway:** describe the trigger, the affected view, and the state-update pattern. A strong answer distinguishes default scheduling from OnPush skipping, explains immutable references and template subscriptions, then recommends profiling before applying low-level APIs.

## Related Topics

- [Components](./components.md)
- [Signals](./signals.md)
- [Observables](./observables.md)
- [RxJS](./rxjs.md)
- [State Management](./state-management.md)
