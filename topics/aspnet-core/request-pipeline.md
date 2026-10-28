## A request's path through ASP.NET Core

The host starts the server (commonly Kestrel), creates an `HttpContext` for each request, and invokes the configured middleware pipeline. Middleware can inspect or short-circuit requests, then endpoint routing selects a matching endpoint and endpoint execution runs its handler. In an MVC endpoint, model binding, filters, action execution, result execution, and serialization happen within that endpoint. The response then unwinds back through middleware in reverse order.

A typical arrangement is:

```csharp
app.UseExceptionHandler();
app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
```

The exact order depends on features. Error handling should wrap downstream components; routing must happen before endpoint-specific CORS or authorization metadata is used; authentication establishes the principal before authorization. Forwarded headers, static files, session, antiforgery, and response caching each have ordering constraints. Consult the framework guidance for the target hosting model rather than memorizing one universal sequence.

Short-circuiting middleware means later components and endpoints never execute. If a body has been consumed or a response started, later code cannot necessarily re-read or replace it. The request-aborted token signals client disconnection; pass it to downstream asynchronous I/O. Do not retain `HttpContext` beyond request lifetime.

**Interview check:** Filters are nested inside MVC execution, not around every ASP.NET Core request. Middleware is the broader HTTP pipeline; endpoint filters are tied to endpoint invocation.

## Detailed request lifecycle

The host configures the server and application before accepting traffic. A server such as Kestrel parses an incoming connection/request and creates an `HttpContext`; the pipeline then executes a sequence of delegates for that context. The same pipeline instance serves many requests, which is why middleware must not store request state in mutable instance fields.

Endpoint routing generally has two conceptual phases. Routing middleware matches the request's method, path, host, and constraints to an endpoint and attaches its metadata. Middleware after routing can inspect that endpoint—for example, authorization can read its policy metadata. Endpoint execution eventually invokes the selected delegate or MVC endpoint. If no route matches, endpoint execution can produce a 404. A 405 may be returned when a path exists but does not support the requested method, depending on endpoint setup.

For an MVC controller endpoint, endpoint execution enters MVC's internal pipeline. Model binding reads route/query/header/form/body values into parameters and models. Validation runs; filters can short-circuit or wrap action execution; the action runs; result execution serializes or otherwise writes the response. A minimal API handler has its own parameter binding and endpoint-filter behavior rather than MVC's action/filter stages. Middleware outside endpoint execution sees both styles.

The response then unwinds through middleware in reverse order. A component can inspect the resulting status, add headers if the response has not started, measure elapsed time, release resources, or log outcomes. Exceptions travel outward in the same nested call structure and can be handled by an earlier exception boundary. Once headers or response bytes have been committed, a handler generally cannot replace the response with a fresh error document.

```text
Client request
  ↓
Server / HttpContext creation
  ↓
middleware A → middleware B → routing metadata → auth → endpoint
  ↑                                             controller/action or handler
  └── response / exception unwinds in reverse order
```

## Why order matters

Middleware order determines both which code executes and what information is available at that point. Forwarded headers from a known proxy must be applied before HTTPS redirection and logging rely on the original scheme/address. Exception handling must be outside components whose exceptions it should translate. Routing must select an endpoint before middleware reads its metadata. Authentication should create the principal before authorization evaluates it. CORS handling needs to be placed where it can answer preflights and apply endpoint policy. These are framework interactions, not arbitrary style preferences.

`Use` components form a nested chain and may invoke the next delegate zero or one times; calling it twice can execute downstream endpoints twice and is almost always a bug. `Run` terminates the chain. `Map` branches by path, while conditional branches execute only when their predicate matches. A short-circuit can be intentional (for example, static file delivery or a deliberate rejection) but means later authentication, logging, or headers will not run unless those concerns wrap the branch.

The endpoint order in a minimal-host application may be partly inferred or inserted by framework conventions. Adding middleware such as CORS, authentication, session, output caching, or rate limiting can change what explicit ordering is needed. Inspect the target runtime's behavior and write an integration test instead of relying on the assumption that every `app.Map...` call means the same thing as executing the endpoint immediately at that line.

## Request data, cancellation, and boundaries

`HttpContext` is request-scoped and should not escape into background work. Extract immutable values needed for deferred processing and persist or enqueue them explicitly. The request-aborted token indicates that the client or server no longer needs the response; pass it to downstream asynchronous work where safe. Cancellation may happen after a write has committed, so cancellation is not a transaction rollback guarantee.

Request bodies are normally forward-only streams. Middleware that reads them can prevent model binding or endpoint code from reading them again. Buffering and rewinding are available for deliberate cases, but buffering large or attacker-controlled bodies can consume memory and disk and can create privacy risks. Apply limits at proxy, server, and application layers; choose a streaming design when payloads are large. Response buffering has similar memory and latency tradeoffs and can interfere with streaming.

The pipeline is a transport boundary, not a place to put every business concern. Middleware is useful for cross-cutting HTTP behavior; filters and endpoint filters operate at more specialized endpoint stages; application services should own domain operations. Keeping these layers separate helps unit testing while integration tests verify the assembled pipeline.

## Common interview checks

Be able to distinguish the server, middleware, routing, endpoint execution, MVC filters, model binding, action/handler, and response unwinding. Explain that filters are not global to all endpoint types, that authentication is not an authorization requirement, and that status/body rewriting may fail after the response starts. Given a middleware ordering problem, reason from required data and scope rather than reciting a universal list. Also discuss short-circuit behavior, cancellation, and why per-request state cannot live in a shared middleware field.

## Middleware as nested control flow

It helps to picture the pipeline as nested asynchronous calls rather than a list of independent events. If component A calls `next`, which calls B, which calls the endpoint, the endpoint's work completes first. B then resumes after its `await next`, followed by A. This is why a timing or response-observation middleware can record both pre-endpoint and post-endpoint state. If B short-circuits, the endpoint and any later component do not run, while A still resumes after B returns.

The same nesting explains exception behavior. An exception thrown in the endpoint unwinds through downstream middleware; only an earlier component with a handling boundary can observe it. A component that performs work before calling next can itself fail before endpoint routing. An exception handler registered after that component cannot catch the earlier failure. Once the server has sent headers, an exception handler cannot substitute an ordinary JSON error body; streamed protocols need their own error signaling.

## What belongs at each stage

Keep the server's responsibilities distinct from application middleware. Kestrel accepts and parses connections; middleware composes HTTP processing; endpoint routing selects a target; model binding translates transport data; filters apply MVC-specific interception; the endpoint/application service performs the operation; serialization writes the response. This distinction helps locate bugs: an unmatched route is not an authorization denial, a binding failure is not a domain validation rule, and a 500 response is not proof that the action ran.

Place a concern where it has the necessary context and the right coverage. Protocol headers and request correlation are HTTP-level concerns. Coarse endpoint access belongs in authorization policies. Object ownership checks need the loaded resource and belong in an application operation using authorization services. DTO validation is near request binding; business invariants belong deeper in the application/domain layer. This placement minimizes duplicated checks and avoids making every endpoint depend on expensive generic infrastructure.

## Testing the assembled pipeline

Unit tests for middleware or handlers cannot prove the application's actual registration order. Use host-level integration tests to make requests through the configured app and assert status, headers, body, selected endpoint behavior, and auth results. Include a request that short-circuits, one that reaches an endpoint, a thrown exception, and a request that is intentionally anonymous. For streaming or body-reading behavior, test cancellation and size limits as well.

When diagnosing a production issue, trace one request from ingress through the selected endpoint and back to the response. Record the deployment's proxy and hosting topology, because forwarded headers and TLS termination can change what the app observes. Use distributed trace context and structured logs, but do not log raw bodies or credentials. Verify the actual runtime/version ordering rules if the application relies on framework-inserted middleware.

An interview answer should connect each stage to a concrete responsibility and explain what can short-circuit, where endpoint metadata becomes available, and how the response unwinds. The goal is to reason from framework flow, not memorize an ordering checklist that may omit static files, session, anti-forgery, or endpoint-specific components.

## Related Topics

- [Middleware](./middleware.md)
- [Routing](./routing.md)
- [Filters](./filters.md)
- [Kestrel](./kestrel.md)
- [Minimal APIs](./minimal-apis.md)