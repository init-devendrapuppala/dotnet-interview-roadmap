# Angular Routing

Angular Router turns the URL into application state: it selects which view is active, supplies route and query parameters, and coordinates navigation and history. Good route design makes a feature linkable and refresh-safe. A route configuration is also a code-loading and dependency boundary, so route decisions affect startup cost, state lifetime, and deployment behavior.

## Route configuration and lazy loading

For standalone applications, `provideRouter()` registers the route table. `loadComponent` lazy-loads one standalone component; `loadChildren` can lazy-load a route configuration or an NgModule-based feature. Lazy loading defers downloading and parsing code until navigation requires it. This can improve initial load, but introduces a later network boundary and may not help a feature every user opens immediately.

```ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'orders/list',
    loadComponent: () =>
      import('./orders/order-list.component')
        .then(module => module.OrderListComponent),
  },
  {
    path: 'orders/:id',
    loadComponent: () =>
      import('./orders/order-detail.component')
        .then(module => module.OrderDetailComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'orders/list' },
  { path: '**', redirectTo: 'orders/list' },
];
```

The snippet assumes the referenced components exist. A production application will often show an explicit not-found page rather than redirecting every unknown URL to the list. Put specific routes before broad parameter or wildcard routes so a generic match does not capture a more specific URL; `orders/:id` would otherwise also match the literal segment `list`.

## Route state and navigation

Use path parameters for identity, such as `/orders/42`, and query parameters for optional view state such as search, sorting, or pagination. Query parameters are shareable and survive refresh, which makes them appropriate for filters users may want to bookmark. Validate identifiers and query values: users can enter arbitrary URLs, and route values arrive as strings.

Inject `ActivatedRoute` to read route state. A route parameter may change while Angular reuses the same component, so a one-time snapshot is suitable only when the component is guaranteed to be recreated for a different parameter. For reusable detail views, react to `paramMap` or use router component-input binding when the application has configured it. Treat parameter changes as a new data request and cancel obsolete reads when appropriate.

`RouterLink` should be preferred for ordinary in-app navigation because it preserves router semantics and browser history. Programmatic navigation is appropriate after an action, such as redirecting after a successful create. Preserve relevant query parameters intentionally; preserving every parameter can also carry obsolete or sensitive-looking values into unrelated pages.

Resolvers can fetch data before a route activates. They are useful when the destination cannot render meaningfully without the data, but they delay navigation and need explicit error handling. For most pages, rendering a loading state inside the feature may feel faster and allow the layout to appear immediately. Decide based on user experience rather than using resolvers for every request.

## Guards, providers, and lifecycle

Guards can allow, cancel, or redirect a navigation and are useful for login redirects or unsaved-change warnings. They are client-side navigation controls, not API authorization. The backend must enforce access on each operation. Prefer returning a `UrlTree` or `RedirectCommand` for a redirect rather than starting an unrelated imperative navigation inside a guard.

Route-level providers can scope a feature service to the route injector. This can isolate feature state, but it affects instance identity and cleanup. Understand whether navigation reuses a route or destroys it, and do not assume state resets simply because the URL changed. A root service persists longer and may need explicit cleanup when the user changes account or exits a workflow.

## Production and hosting concerns

Client-side routing requires server fallback behavior. A request to `/orders/42` arrives at the web server before Angular runs. The server must serve the SPA entry point for application routes while allowing API paths to return API responses. Otherwise, clicking a link may work but refreshing or bookmarking the same URL returns 404. If Angular and ASP.NET Core are hosted together, configure fallback routing carefully so it does not swallow `/api` endpoints.

Lazy loading is not access control. Downloaded code can be inspected, and route guards can be bypassed by a user who calls the API directly. Avoid embedding secrets or server authorization rules in route configuration.

**Interview takeaway:** discuss route URL design, parameter updates, lazy-loading tradeoffs, and hosting fallback. Mention that guards shape navigation while the server protects data, and tie route-level providers to feature-state lifetime.

## Related Topics

- [Guards](./guards.md)
- [Components](./components.md)
- [Services](./services.md)
- [Angular Architecture](./angular-architecture.md)
- [Modules](./modules.md)
