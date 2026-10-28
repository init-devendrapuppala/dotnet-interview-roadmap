# Angular NgModules

An NgModule groups declarations, imports, exports, and providers. It was historically the main unit for organizing Angular applications and remains supported in existing codebases and library integrations. Standalone components reduce the need for feature modules in new applications, but NgModules are not removed or inherently obsolete. The important task is to understand which model a codebase uses and preserve its behavior when changing it.

## A traditional feature module

An NgModule declares non-standalone components and imports the features used by those declarations:

```ts
import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';

@Component({
  selector: 'app-legacy-orders',
  standalone: false,
  template: '<h1>Orders</h1>',
})
export class LegacyOrdersComponent {}

@NgModule({
  declarations: [LegacyOrdersComponent],
  imports: [CommonModule],
  exports: [LegacyOrdersComponent],
})
export class OrdersModule {}
```

`declarations` identifies components, directives, and pipes owned by that module. `imports` makes exported declarations from other modules available. `exports` exposes declarations for consumers that import this module. Providers configure DI and their scope depends on where/how the module is loaded; do not assume every provider is universally single-instance.

## Standalone and module interoperability

A standalone component declares its own template dependencies in its `imports` and can be bootstrapped with `bootstrapApplication`. Standalone and module-based APIs can interoperate, which allows gradual migration. A shared module can still be useful in a legacy codebase, but broad “shared” modules that export many unrelated things hide dependencies and can increase coupling.

Lazy loading works with both models: a route can load an NgModule-based feature or standalone route/component configuration. Provider placement and route boundaries still matter. Before migrating, check whether a module provides services, configures initializers, or participates in lazy loading. Moving providers to the root can accidentally change instance identity and retain feature state longer than intended.

## When modules remain useful

NgModules may be the simplest choice when maintaining a mature application, consuming a library that expects module integration, or applying a well-understood module-level configuration. Standalone APIs often make dependencies more visible at the component or route level and reduce wrapper boilerplate. Neither choice guarantees better architecture by itself; feature ownership and injector scope matter more than syntax.

For an incremental migration, convert a bounded feature and verify its routes, provider instances, lazy chunk behavior, and tests. Avoid a broad rewrite driven only by the idea that modules are old. Preserve application behavior and team understanding as primary criteria.

**Interview takeaway:** describe declarations/imports/exports/providers, explain standalone interoperability, and clarify that provider scope and lazy loading can change during migration.

## Related Topics

- [Angular Architecture](./angular-architecture.md)
- [Components](./components.md)
- [Dependency Injection](./dependency-injection.md)
- [Routing](./routing.md)
- [Services](./services.md)
