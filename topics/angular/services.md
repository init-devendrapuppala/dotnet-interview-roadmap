# Angular Services

Angular services are classes for reusable behavior that should not be tied to one view. Common examples include API access, feature workflows, and shared client state. Moving these responsibilities out of components can improve reuse and testing, but a service can become a “god object” if unrelated features accumulate in it. Keep each service cohesive and give its state an intentional lifetime.

## API service example

A focused service can wrap endpoint details and return an Observable to its consumer:

```ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Customer {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerApi {
  private readonly http = inject(HttpClient);

  find(id: number): Observable<Customer> {
    return this.http.get<Customer>(`/api/customers/${id}`);
  }
}
```

This keeps a component from constructing URLs directly and allows HTTP behavior to be tested at the service boundary. The generic type does not validate JSON at runtime. Treat server responses as external data and keep authentication, authorization, and authoritative business rules on the server.

## Scope and responsibility

`providedIn: 'root'` registers a service with the application root injector and allows Angular to tree-shake it when unused. Consumers resolving it from that injector typically share an instance in that application. A provider at component or route scope can create an isolated instance; this is useful for feature state, but it may reset when that boundary is recreated. Do not rely on an accidental root lifetime for temporary user data.

Prefer a service when it owns injected dependencies, coordinates a reusable workflow, or shares state among consumers. A small pure function may be clearer without a service. Avoid putting view formatting, every endpoint, and unrelated global state into one catch-all class. Services should expose operations that reflect the feature's language and lifecycle.

## Testing and pitfalls

Use HTTP testing utilities to check URL, method, parameters, and response behavior without contacting a real server. Use a small fake service when testing a component's presentation states in isolation. Keep side effects out of constructors so creating a service in a test does not unexpectedly start requests or subscriptions.

Common issues include duplicate instances caused by local providers, stale caches with no invalidation policy, leaking long-lived subscriptions from root services, and assuming a TypeScript DTO is runtime validation. Root services that own subscriptions must have deliberate cleanup and app/session lifecycle behavior.

**Interview takeaway:** distinguish services as reusable behavior from the DI mechanism that creates them. Explain why the service exists, its provider scope, how components consume it, and how its effects are tested.

## Related Topics

- [Dependency Injection](./dependency-injection.md)
- [HTTP Client](./http-client.md)
- [Components](./components.md)
- [Observables](./observables.md)
- [Angular Architecture](./angular-architecture.md)
