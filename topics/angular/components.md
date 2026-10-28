# Angular Components

A component combines a TypeScript class, template, and optional styles to define a view and its behavior. Components are the main unit of UI composition: a parent assembles child views, passes data through inputs, and responds to outputs. A good boundary groups UI with one coherent responsibility. Extracting every element into its own component adds navigation and data-flow overhead; keeping an entire feature in one oversized component makes it hard to test and evolve.

## Standalone component and data flow

Standalone components declare the directives, pipes, or components used by their templates in `imports`. Inputs provide data; outputs communicate user intent. This one-way flow is easier to reason about than having a child reach into a parent or mutate unrelated global state:

```ts
import { Component, input, output } from '@angular/core';

interface Order {
  id: number;
  number: string;
}

@Component({
  selector: 'app-order-row',
  standalone: true,
  template: `
    <span>{{ order().number }}</span>
    <button type="button" (click)="open.emit(order().id)">Open</button>
  `,
})
export class OrderRowComponent {
  readonly order = input.required<Order>();
  readonly open = output<number>();
}
```

The parent remains responsible for deciding what opening an order means. Modern signal-based `input()` and `output()` APIs are shown; decorator-based `@Input()` and `@Output()` are also supported and common in existing codebases.

## Lifecycle and derived values

Angular creates a component, sets initial inputs, renders its view, and later destroys it when its containing view is removed. Lifecycle hooks are useful when work depends on a specific stage: `ngOnInit` runs after initial inputs are set, `ngOnChanges` responds to input changes, and `ngOnDestroy` is the teardown boundary for manually owned resources. Prefer deriving a value from an input with a computed signal or a direct template expression instead of copying it into another mutable field that can become stale.

Long-running subscriptions, timers, event listeners, and observers need a clear owner. Use the `async` pipe for template streams and lifecycle-aware teardown for imperative subscriptions. Avoid using `ngDoCheck` as a general place to recalculate state; it can run frequently and makes the data flow hard to inspect.

## Design and production practices

Keep presentation and orchestration in components, while cohesive API access or shared behavior can live in injected services. A component may coordinate requests and decide what to display without owning transport details. Represent loading, empty, error, and success states deliberately. Typed inputs help at compile time, but TypeScript interfaces do not validate API data at runtime.

Use semantic HTML and accessible labels, buttons, and error messages. For repeated content, track items by stable identity (`@for (item of items; track item.id)`) so Angular can reuse the right DOM views after insertion or reordering. Avoid expensive template methods that repeat filtering or allocation on every check; compute or memoize costly derivations and profile before optimizing.

OnPush change detection works well when component inputs and state updates are explicit, but it does not mean the view can only update on an input change. Events in the view, async-pipe emissions, and template-read signal updates also notify Angular. Preserve the component's state contract when changing detection strategy.

**Interview takeaway:** describe a component as a managed view with data flow and lifecycle, not merely a class that generates HTML. Explain how its inputs, outputs, dependencies, and teardown define a maintainable UI boundary.

## Related Topics

- [Angular Architecture](./angular-architecture.md)
- [Change Detection](./change-detection.md)
- [Services](./services.md)
- [Dependency Injection](./dependency-injection.md)
- [Signals](./signals.md)
