# Angular HTTP Interceptors

Interceptors wrap `HttpClient` requests and responses with cross-cutting behavior. They are useful for consistent concerns such as adding a correlation ID, attaching credentials to a trusted API origin, or applying a narrow error policy. They reduce repetition, but can make a request's behavior less visible; keep them focused and avoid hiding feature-specific decisions in a global chain.

## Functional interceptor

Functional interceptors are the recommended modern style. Requests are immutable, so clone a request to change headers or parameters:

```ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.accessToken();

  if (!token || !request.url.startsWith('/api/')) {
    return next(request);
  }

  return next(request.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  }));
};
```

In a real application, origin matching should be explicit and robust for absolute URLs too; do not attach a bearer token to arbitrary third-party requests. The example assumes a same-origin API path. Register the interceptor through `provideHttpClient(withInterceptors([authInterceptor]))`. It runs in an injection context, which permits `inject()` at the top level of the function.

## Ordering and responsibilities

Requests pass through the configured chain in order, and responses unwind through it in reverse. Order matters when one interceptor modifies headers another reads, or when retry and logging policies interact. Keep the chain short enough that a developer can reason about it. A feature-specific transformation is often clearer in an API service or feature stream than in a global interceptor.

Interceptors can add correlation metadata, normalize common error shapes, or implement a carefully designed retry. A `401` often indicates unauthenticated and `403` forbidden, but the server contract determines exact behavior. Redirecting every error globally to sign-in can be wrong for public endpoints, expired sessions, and authorization failures.

Retries need special care. A network failure does not always mean the server did not process the request. Retry only bounded, transient failures and only when repeating the operation is safe or the API provides idempotency guarantees. Avoid interceptors that subscribe internally or swallow errors, because they break the observable chain and make callers believe an operation succeeded.

**Interview takeaway:** explain why the behavior is cross-cutting, how cloning and ordering work, and how the implementation avoids leaking credentials or retrying unsafe writes.

## Related Topics

- [HTTP Client](./http-client.md)
- [Dependency Injection](./dependency-injection.md)
- [Guards](./guards.md)
- [Services](./services.md)
- [Observables](./observables.md)
