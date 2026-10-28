# Angular Architecture

Angular architecture is the arrangement of UI, state, navigation, and external-system boundaries so that features can change without destabilizing the whole application. The goal is not to maximize the number of layers. It is to make ownership clear: a developer should be able to tell where a value comes from, who may change it, and where a failed API call is handled. Too little structure creates large components that mix rendering, networking, and business rules; too much structure adds indirection without making a real change easier.

## A practical responsibility model

An Angular application commonly has these cooperating parts:

- **Components** own a view and coordinate user interaction. They translate user intent into application actions and present loading, empty, success, and error states. They should not become repositories for every business rule.
- **Services** expose cohesive capabilities, such as a typed API client, a feature workflow, or shared state. Services are ordinary classes managed by Angular's dependency-injection (DI) system.
- **Templates** describe how state is rendered. Binding keeps presentation declarative; stable tracking keys and accessible semantics make repeated and interactive UI more reliable.
- **The router** maps URLs to feature views and can lazy-load code. Route boundaries are useful for navigation and code organization, not for server security.
- **Providers and injectors** define how and where dependencies are created. Scope is part of architecture because it determines whether state is shared or isolated.
- **The server/API** remains authoritative for persistence, validation, business invariants, authentication, and authorization.

For a full-stack application, a useful mental model is:

```text
Browser view -> Angular feature/API service -> HTTP API -> application/domain logic -> database
```

The browser can be modified by its user. A hidden button, typed interface, route guard, or local store must never be treated as a security boundary. The API must validate inputs and authorize each operation independently.

## Organize around features and ownership

Organize code so that related route configuration, components, services, and tests are easy to find. A small application may be clear with a few folders organized by technical type; as the application grows, feature-oriented folders often make changes easier because the files for one capability stay together. This is a tradeoff, not a rule: extracting a package or layer is useful when it enforces a real boundary, but can make a tiny app harder to navigate.

Avoid building a service for every helper function. A pure formatting function may be simpler as a standalone function, while a service is appropriate when behavior needs injected dependencies, shared state, or a test seam. Similarly, do not move all state to one root service just because multiple components exist. Keep view-only state local; lift it when more than one view truly owns or consumes it.

Standalone components declare template dependencies in their own `imports`, which makes the component's requirements visible. NgModules remain supported and useful in existing applications and library ecosystems. New standalone code can coexist with module-based code, so architectural changes should be incremental and preserve provider, routing, and lazy-loading behavior.

## Trace a feature's data flow

Consider an order details screen. The route supplies an order identifier. A feature component reads it and asks an API service for a DTO. The template renders request status and the order when available. A user action calls an API method, and the screen refreshes or updates its state based on the result. Each boundary has a purpose:

1. The URL makes the resource addressable and supports refresh, bookmarks, and browser history.
2. The component owns the screen's presentation state and translates interactions.
3. The API service centralizes endpoint details and exposes typed observables.
4. The server checks authorization and validates the identifier and operation.
5. The response is treated as external input, even if TypeScript gives the request a generic type.

Angular `HttpClient.get<Order>()` does not prove that the server returned an `Order`; the generic is a compile-time assertion. Where data correctness is important, validate at the boundary, use generated contracts, or map the response into an application model. Keep transport DTOs distinct from richer UI state only when that distinction helps; duplicating every type can itself become costly.

## A small standalone bootstrap

The root configuration composes platform-wide facilities. Feature-specific providers can remain closer to their route or component when they should be isolated:

```ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'orders',
    loadComponent: () =>
      import('./orders/orders-page.component').then(m => m.OrdersPageComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'orders' },
];

@Component({
  selector: 'app-root',
  standalone: true,
  template: '<router-outlet />',
  imports: [RouterOutlet],
})
class AppComponent {}

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes), provideHttpClient()],
});
```

Application-wide providers and a component's template imports are separate concerns: configuring the router makes navigation available, while importing `RouterOutlet` makes the outlet directive available in this standalone template.

## Boundaries that help in production

**Lazy loading** can reduce the initial JavaScript needed for routes that are not immediately visited. It trades startup work for later network and parsing work; a feature used on every landing page may not benefit. Measure real navigation and bundle sizes rather than lazily splitting every component.

**Error handling** should preserve context. A component needs enough information to show a useful recovery action, while an API layer can normalize transport errors. A global interceptor is not a good place to silently swallow every error. Distinguish expected outcomes (such as validation failures) from unexpected failures, and log safely without exposing secrets or personal data.

**Testing** should follow boundaries. Test pure transformations as plain functions, API services with HTTP testing tools, and components for user-visible behavior. Avoid tests that duplicate implementation details or require a full application for a small function. DI makes replacements possible, but a seam is valuable only when it is actually used.

**Deployment** is part of architecture. If Angular routes are client-side, the hosting server must return the SPA entry point for valid application paths while keeping `/api` requests routed to the API. Otherwise a route works through in-app navigation but fails after a refresh or bookmark.

## Choosing an architectural change

When a component grows, first identify the responsibility causing the difficulty. Extracting a view component can improve reuse and accessibility; extracting a service can isolate API or state logic; a feature route can define lazy-loading and provider scope. Avoid moving code purely to satisfy a folder convention. Ask whether the new boundary makes ownership, testing, performance, or parallel work clearer.

For a mature codebase, preserve behavior while introducing boundaries. Verify route URLs, lazy chunks, provider instances, error handling, and feature tests. Replacing modules with standalone APIs, introducing a state library, or changing API types is not automatically an improvement if it obscures the application's actual lifecycle.

## Dependency direction and feature boundaries

The dependency direction should keep presentation at the edge and important rules on the server. A component may depend on a feature-facing service; that service can depend on `HttpClient` or a repository-like adapter. Avoid a circular graph in which two feature services call each other and each component must know how both work. When two features need the same capability, consider whether it is genuinely shared or whether one feature should expose a narrower interface.

Feature boundaries also influence teams and releases. A cohesive feature folder can make ownership and tests discoverable, but a directory named `shared` is not automatically a stable abstraction. Shared code tends to become a dependency for many features; changes to it require broader compatibility checks. Keep shared APIs small and avoid exporting internal implementation details merely to reuse one helper.

Cross-cutting concerns belong where their policy is understandable. Authentication headers may belong in an interceptor, but decisions about how a particular page recovers from a validation error belong near that feature. Logging and telemetry can be global, but must avoid recording tokens or sensitive payloads. This balance prevents both repeated boilerplate and an opaque global layer that changes unrelated requests.

## Performance and resilience are architectural choices

Performance is not only a template concern. Bundle boundaries determine what users download, API boundaries determine how many round trips are needed, and state ownership determines how much of the tree receives updates. A page that issues several dependent API requests serially may feel slow even if its components are cheap. Conversely, preloading every lazy feature can erase the startup benefit. Use production measurements and user journeys to choose boundaries.

Resilience likewise crosses layers. The component should communicate whether an operation is pending and what the user can do after failure. The service can normalize transport details, while the API defines stable error contracts. A retry should match operation semantics. If an operation can charge or create data, the server may need idempotency support; a client-side retry alone cannot promise exactly-once behavior.

**Interview takeaway:** explain the direction of dependencies and ownership, not just the names of Angular building blocks. A good design keeps UI concerns in the UI, shares behavior through deliberate DI scopes, leaves authoritative rules on the server, and uses the least structure that keeps those boundaries understandable.

## Related Topics

- [Components](./components.md)
- [Services](./services.md)
- [Dependency Injection](./dependency-injection.md)
- [Routing](./routing.md)
- [Modules](./modules.md)
