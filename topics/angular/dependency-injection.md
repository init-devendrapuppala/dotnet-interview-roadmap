# Dependency Injection

Dependency injection (DI) is how Angular creates and supplies collaborators to components, directives, pipes, and services. A class declares what it needs; Angular resolves those dependencies from providers registered in an injector hierarchy. This reduces direct coupling to constructors of concrete collaborators and gives tests a practical replacement seam. The tradeoff is that object creation and scope are less visible than `new SomeClass()`, so provider placement must be understood rather than guessed.

## Tokens and providers

At runtime Angular needs a token to look up a dependency. A class is commonly its own token. An interface cannot serve as one because TypeScript erases interfaces when code is compiled. Use an `InjectionToken` for interface-like configuration or a non-class contract:

```ts
import { InjectionToken, inject } from '@angular/core';

export interface AppConfig {
  apiBaseUrl: string;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('app.config');

export function apiBaseUrl(): string {
  return inject(APP_CONFIG).apiBaseUrl;
}
```

Provide a value during application setup, then inject it where needed. A `useValue` provider works for immutable configuration; `useClass`, `useFactory`, and `useExisting` express other forms of construction or aliasing. Prefer the least complex provider that makes ownership explicit.

```ts
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

interface Product {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class ProductApi {
  private readonly http = inject(HttpClient);

  list(): Observable<Product[]> {
    return this.http.get<Product[]>('/api/products');
  }
}
```

`ProductApi` is registered with the root injector. `HttpClient` must also be provided, typically with `provideHttpClient()` in application providers. The generic result type informs TypeScript; it does not validate JSON at runtime.

## Hierarchical scope and instance identity

Angular's injectors form a hierarchy. When a token is requested, resolution searches from the requesting context through ancestor injectors until a provider is found. If a provider is registered at the application root, consumers resolving it from that injector typically share one instance within that application. If a component registers the same service, that component subtree gets its own instance, which may shadow the root provider. A route can also establish a provider boundary.

This scope is useful when a feature needs isolated state. For example, a multi-step checkout component could own state that should disappear when that feature is destroyed. It is also a common source of production confusion: navigating away and recreating the component may create a fresh instance, while a root-scoped service may retain state across routes. “Singleton” therefore means singleton relative to a particular injector/provider arrangement, not a process-wide singleton across browser tabs, Angular applications, or separate environment injectors.

Before adding a provider, ask:

1. Should all application features share this instance?
2. Should each route or component subtree have independent state?
3. What lifecycle should clear the data?
4. Could another provider accidentally shadow this one?

Do not use a root provider merely because it is easy. Root-scoped state can accidentally retain user-specific data after logout or leak one feature's state into another session if cleanup is missing.

## Injection APIs and constructor behavior

Angular supports constructor injection and the `inject()` function. `inject()` is useful for field initializers, functional guards, and functional interceptors. It must run in an Angular injection context; calling it from an arbitrary helper function or later callback fails because there is no active context. Pass dependencies explicitly to plain functions, or call `inject()` from a supported context.

Constructors and field initializers should generally establish dependencies and lightweight state, not start complex asynchronous workflows. Doing side effects during construction makes instance creation surprising, can complicate tests, and may repeat work if provider scope creates multiple instances. Prefer explicit methods, lifecycle hooks when tied to view lifecycle, or a clearly owned effect.

## Replacing providers in tests

DI allows a test to substitute a fake API or configuration token. This improves determinism and avoids network calls when testing UI behavior. For API services that use `HttpClient`, Angular's HTTP testing utilities are often more useful than mocking every request method manually. Test the behavior at the boundary that matters: component rendering, service request construction, or a pure mapping function.

Avoid over-mocking the injector until the test no longer verifies real behavior. A component integration test can keep the actual service and replace only the HTTP backend. Conversely, testing an isolated view may use a small fake service to make states reproducible. DI is an enabler for these choices, not a reason to build a generic plugin framework for every class.

## Common pitfalls

- **Interface provider missing at runtime:** TypeScript interfaces disappear. Use a class token or `InjectionToken`.
- **Unexpected duplicate state:** a local provider creates an instance that shadows the root service.
- **Wrong lifetime:** root state persists longer than the feature or logged-in session that owns it.
- **Invalid `inject()` call:** inject is only valid in an injection context, not arbitrary asynchronous callbacks.
- **Side effects during creation:** provider instantiation unexpectedly starts requests or subscriptions.
- **Assuming root means globally unique:** each Angular application has its own injector and instances.

**Interview takeaway:** explain the token, provider location, injector hierarchy, and expected lifetime. A strong answer ties DI scope to feature-state ownership and testing rather than only describing constructor syntax.

## Related Topics

- [Services](./services.md)
- [Angular Architecture](./angular-architecture.md)
- [Components](./components.md)
- [Modules](./modules.md)
- [HTTP Client](./http-client.md)
