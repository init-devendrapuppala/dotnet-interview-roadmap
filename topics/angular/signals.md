# Angular Signals

Signals are Angular's reactive primitives for synchronous state. They make it explicit which values a view or computation reads, and Angular can notify consumers when those values change. Signals are useful for current UI state and derived values, but they do not replace every Observable: RxJS remains strong for asynchronous sequences, cancellation, and operator composition.

## Writable and computed state

A writable signal stores a value. Read it by calling it, and update it with `set()` or `update()`. A computed signal derives a value from other signals and is lazy and memoized until a dependency changes:

```ts
import { Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `
    <p>Count: {{ count() }}; doubled: {{ doubled() }}</p>
    <button type="button" (click)="increment()">Add</button>
  `,
})
export class CounterComponent {
  readonly count = signal(0);
  readonly doubled = computed(() => this.count() * 2);

  increment(): void {
    this.count.update(value => value + 1);
  }
}
```

`doubled` should be computed rather than stored and manually synchronized with `count`. Duplicate state creates ordering bugs: one update path may forget to update the second value.

## Dependency tracking and mutation

When a signal is read during a template or computed evaluation, that consumer tracks the signal. Updating it notifies relevant consumers. For objects and arrays, prefer replacing the value or using an update that returns a new structure. Mutating a nested property without updating the signal does not notify consumers:

```ts
interface Profile { name: string; }
const profile = signal<Profile>({ name: 'Mina' });

profile.update(current => ({ ...current, name: 'Ravi' }));
```

Signal equality and update behavior should be understood for the data shape in use; mutating an existing reference and returning it may not produce the notification the view needs. Keep writes behind methods when a feature has invariants to preserve.

## Effects and interoperability

Effects run side effects when tracked signal dependencies change. They are appropriate for connecting state to an external side effect, such as synchronizing a preference with browser storage, but are generally not the right way to copy one signal into another. Use `computed` for derivation. Effects require lifecycle awareness and should not create feedback loops that repeatedly write to the signal they read.

Signals can interoperate with RxJS through Angular's interop utilities when a boundary needs both models. Use streams for events such as form changes, HTTP responses, websockets, and cancellation; use signals for current state read directly by a view. Avoid repeated conversions or independently writable copies that create two sources of truth.

Signal reads in templates integrate with Angular change detection and can work well with OnPush components. Signals do not mean that Angular no longer performs view updates, and they do not make expensive computations free. Keep derived work bounded and profile a real performance issue before optimizing.

**Interview takeaway:** explain how signal reads establish dependencies, why computed values avoid duplicated state, and when RxJS is a better fit for asynchronous event sequences.

## Related Topics

- [Change Detection](./change-detection.md)
- [Components](./components.md)
- [Observables](./observables.md)
- [RxJS](./rxjs.md)
- [State Management](./state-management.md)
