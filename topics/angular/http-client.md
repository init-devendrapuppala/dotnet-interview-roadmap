# Angular HTTP Client

Angular `HttpClient` provides typed, observable-based HTTP operations and integrates with dependency injection, interceptors, and test utilities. Putting transport calls in focused services keeps components from depending on URL construction and request details. The API remains a trust boundary: client types and validators improve development and usability, but only the server can enforce authoritative validation and authorization.

## Configure and call an API

Standalone applications commonly configure `provideHttpClient()` during bootstrap:

```ts
import { provideHttpClient } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';

bootstrapApplication(AppComponent, {
  providers: [provideHttpClient()],
});
```

An API service can expose typed methods:

```ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Todo {
  id: number;
  title: string;
}

@Injectable({ providedIn: 'root' })
export class TodoApi {
  private readonly http = inject(HttpClient);

  getTodos(): Observable<Todo[]> {
    return this.http.get<Todo[]>('/api/todos');
  }
}
```

The `Todo[]` generic is a compile-time assertion; Angular does not check the JSON shape against the TypeScript interface. Align DTOs with the server contract and validate or map external data at runtime when correctness requires it. OpenAPI generation can reduce drift but does not replace tests or runtime validation.

## Observable execution and request lifecycle

`HttpClient` observables are cold: the request normally starts on subscription. Two independent subscriptions generally produce two requests. Use the `async` pipe for a template consumer or explicitly share a request when multiple consumers truly need the same execution. Sharing also creates cache and lifecycle decisions, so it should not be automatic.

Requests can complete, fail, or be cancelled when their subscription is torn down. Unsubscribing from an in-flight request typically aborts the browser-side request, but cannot guarantee the server did not receive or process it. Avoid using cancellation as rollback for a write. Retrying writes can duplicate effects unless the API is designed to be idempotent.

Represent loading, success, empty, and error states clearly. Catch errors at a layer with enough context to decide recovery, and preserve useful server validation details for the form. A global interceptor may normalize common concerns, but it should not silently swallow errors that the feature needs to display.

## Production concerns

Use environment configuration for API base URLs rather than scattering hostnames through components. Do not embed secrets in browser configuration; anything shipped to the browser is public. CORS is enforced by browsers and configured on the server, not enabled by an Angular client setting. Authentication credentials should be sent only to intended API origins and follow the application's reviewed auth design.

An HTTP generic does not protect against malformed or unexpected responses. Build deliberate request DTOs rather than serializing an entire form object. Handle pagination, timeouts, cancellation, and error contracts according to the API's semantics. The server must validate and authorize each operation even if the UI already checked fields or route access.

**Interview takeaway:** cover configuration through DI, cold observable subscription behavior, typed-but-unvalidated responses, and the difference between aborting a browser request and undoing server work.

## Related Topics

- [Services](./services.md)
- [Interceptors](./interceptors.md)
- [Observables](./observables.md)
- [RxJS](./rxjs.md)
- [Dependency Injection](./dependency-injection.md)
