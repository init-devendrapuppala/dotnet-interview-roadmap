## Why middleware order defines behavior

Middleware is a chain of request delegates. Each component may do work before calling the next delegate, inspect or modify the response afterward, or short-circuit without invoking downstream components. Order therefore affects routing, authentication, error handling, caching, and response headers.

```csharp
var app = builder.Build();
app.UseExceptionHandler();
app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
```

This is a common shape, not a universal recipe: static files, forwarded headers, session, output caching, and endpoint-specific behavior introduce ordering requirements. Exception handling should wrap downstream work. Forwarded headers belong early when trusted proxy information affects HTTPS or client IP. CORS generally runs after routing and before authorization in endpoint-routing apps. Authentication establishes `HttpContext.User`; authorization evaluates endpoint metadata afterward.

Custom middleware can use `RequestDelegate` and be registered with `UseMiddleware<T>()`. Keep it asynchronous, pass `RequestAborted` to downstream I/O, avoid reading/buffering bodies without a clear need, and do not retain `HttpContext` after the request. Middleware instances are typically constructed once and may serve concurrent requests, so avoid mutable per-request instance fields. Use `HttpContext.Items` or scoped services for request-local state.

`Use` composes and can call `next`; `Run` terminates the pipeline; `Map` branches by path. Endpoint routing adds route matching and endpoint execution, allowing middleware to inspect endpoint metadata between `UseRouting` and endpoint execution.

**Interview check:** Middleware runs for all requests reaching its position, while MVC filters apply within MVC execution. Choose based on whether behavior is HTTP-wide or action/result-specific.

## Building custom middleware

Middleware is appropriate when a concern belongs to the HTTP boundary and must work across endpoint styles. A class-based component typically receives the next `RequestDelegate` in its constructor and implements an asynchronous `InvokeAsync` method:

```csharp
using System.Diagnostics;

public sealed class RequestTimingMiddleware(
    RequestDelegate next,
    ILogger<RequestTimingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var started = Stopwatch.GetTimestamp();
        try
        {
            await next(context);
        }
        finally
        {
            logger.LogInformation(
                "HTTP {Method} {Path} returned {StatusCode} in {ElapsedMs} ms",
                context.Request.Method,
                context.Request.Path,
                context.Response.StatusCode,
                Stopwatch.GetElapsedTime(started).TotalMilliseconds);
        }
    }
}
```

Register it with `app.UseMiddleware<RequestTimingMiddleware>()` at the intended point in the pipeline. Constructor-injected dependencies are effectively shared with the middleware instance, so do not inject a scoped service there or put request-specific state in fields. If per-request dependencies are necessary, accept them as parameters to `InvokeAsync` so the framework resolves them in the request scope, or use `HttpContext.RequestServices` only for a narrowly justified case. Prefer `InvokeAsync` injection for clarity.

Middleware must be asynchronous end to end. Avoid `.Result`, `.Wait()`, and blocking I/O, which can starve the thread pool under load. Pass `HttpContext.RequestAborted` to downstream HTTP/database/file work. Do not retain `HttpContext`, `HttpRequest`, or streams after the request completes. If reading a body, understand that it is normally forward-only: buffering consumes memory or disk, can expose sensitive payloads, and may need a rewind before endpoint binding. Prefer not to inspect bodies for generic logging or authorization.

## Composition, branching, and short-circuiting

`Use` wraps the next delegate; code before `await next(context)` is inbound work and code after it is outbound work. If the middleware does not call `next`, it short-circuits and must write a complete response itself. `Run` adds a terminal delegate. `Map` branches the pipeline by path; `MapWhen` branches on a predicate. Branches can change which middleware runs, so ensure critical controls such as exception handling, authentication, and security headers cover intended paths.

The outermost middleware is the first to receive the request and the last to observe the response. This unwind behavior is useful for elapsed-time measurement, response header additions, and cleanup. Exceptions thrown downstream travel back outward until handled. If the response has started, an outer component cannot reliably replace its status or body. Error middleware should therefore be early, and streaming endpoints should define how mid-stream failures are communicated.

Endpoint routing separates matching from endpoint invocation. `UseRouting` selects an endpoint and exposes its metadata; subsequent middleware can inspect that endpoint; mapped endpoint execution runs later. This explains why authorization and endpoint-aware CORS need routing information first. Minimal hosting can insert some middleware automatically, but explicit ordering helps avoid surprises as the application grows.

## Ordering as a correctness and security property

There is no single complete ordering for every application, but a common chain might be:

```text
trusted forwarded headers
→ exception handling
→ HTTPS redirection / security headers
→ routing
→ CORS
→ authentication
→ authorization
→ endpoint-specific middleware
→ endpoint execution
```

Forwarded headers must be trusted and applied before code that depends on the original scheme/IP. Exception handling should wrap downstream components. Routing precedes middleware that reads endpoint metadata. CORS is commonly placed after routing and before authorization in endpoint-routing apps. Authentication establishes `HttpContext.User` before authorization evaluates it. Static files are often served before authorization only when they are intentionally public; private files need protected endpoints. Session, antiforgery, response caching, output caching, and rate limiting each have framework-specific ordering constraints—check the target runtime documentation and test the actual endpoint flow.

Ordering mistakes may look like framework errors but can be security bugs. An authorization policy placed before routing may have no selected endpoint metadata. A broad static-file handler before authorization may expose files. An error handler placed after a component cannot catch exceptions from that earlier component. Add integration tests for critical public/private routes and verify middleware behavior in the deployed hosting model.

## Choosing middleware versus other hooks

Use middleware for cross-cutting HTTP concerns independent of MVC: correlation, exception boundaries, security headers, or protocol-level transformations. Use MVC filters when behavior requires MVC action arguments/results or specific MVC stages. Use endpoint filters for minimal API endpoint invocation behavior. Use authorization policies for access decisions rather than custom middleware that reimplements identity and endpoint metadata. Use a delegating HTTP handler for outbound `HttpClient` calls; inbound middleware does not automatically instrument or secure outbound traffic.

Keep custom components narrow. A generic middleware that knows domain rules, queries a database, and rewrites endpoint responses couples transport infrastructure to application logic. Put domain decisions in testable services and keep middleware responsible for HTTP adaptation. When profiling, account for the per-request cost of every component, allocations, logging, and body buffering. Middleware is invoked frequently, so avoid expensive work on every request when it can be scoped to relevant endpoints.

## Testing and interview questions

Unit-test component behavior for continuation, short-circuit, response modifications, exceptions, and cancellation. Integration tests are needed for actual registration order, endpoint metadata, authentication, and serialization. Test both a successful path and paths deliberately excluded from a branch. Confirm the middleware does not log secrets or leak internal exception details.

Common interview prompts ask for the difference between `Use`, `Run`, and `Map`; why middleware is singleton-like; where authentication belongs; or what happens when `next` is not called. A strong answer describes the delegate nesting and reverse response unwind, connects ordering to endpoint metadata, and identifies when filters or endpoint filters are more suitable. Middleware is a composition mechanism—not a guarantee that every request passes every component; short-circuits and branches are part of its behavior.

## Exception, response, and body behavior

Middleware can catch exceptions from downstream delegates, but a centralized exception handler is usually preferable to bespoke `try/catch` logic in every component. If custom middleware does catch, it should distinguish expected cancellation from failure, log once with trace context, avoid returning internal details, and only write a response if it has not started. A component that catches and suppresses an exception can make the request appear successful despite a partial operation; preserve the failure or translate it through an explicit contract.

Response headers should be set before the response starts. For a streamed response, a middleware can wrap or observe the body only with care; buffering the full response may destroy streaming benefits and create memory pressure. Body logging is particularly risky: it may capture credentials, personal information, or large payloads, and reading the request stream can prevent downstream binding. If a compliance or diagnostic requirement truly needs body inspection, constrain paths, redact data, cap sizes, and test that the body is rewound correctly.

Use the request's `TraceIdentifier` or distributed trace context for correlation rather than inventing unrelated IDs at every layer. If middleware creates a correlation ID from a header, validate its length and character set, and do not trust it as a security identity. The value is useful for joining telemetry, not granting permission.

## Performance and resilience implications

Every middleware component adds work to the hot request path. Keep constructors cheap, avoid per-request reflection or expensive configuration reads, and allocate only what is needed. Use framework-provided features when they solve the concern consistently. An external call in middleware—for example, querying a user service on every request—can become a hidden dependency for all routes and a source of latency amplification. Prefer endpoint-aware policies or application-level services where the scope is narrower.

If a middleware uses a channel or background worker for telemetry, bound the buffer and define the full-buffer behavior. Unbounded asynchronous logging merely defers an outage into memory exhaustion. Do not start a fire-and-forget task with captured request objects; the request may finish and its context may be disposed. Copy the minimal data required into an immutable message and enqueue it through a durable mechanism if loss is unacceptable.

Review branches and static file ordering with a threat model. Public static files commonly bypass endpoint authorization by design; private downloads should go through a protected endpoint. Middleware that bypasses authentication for a health path should match exactly the intended endpoint, not a broad string prefix that can be spoofed. Route-aware metadata and exact policy configuration are safer than ad hoc path tests.

When presenting a middleware design in an interview, explain which requests it covers, where it is registered, which services it depends on, how it behaves on cancellation and exceptions, and what it does if the response starts. Those operational details distinguish a correct composition from a snippet that works only on the happy path.

## Related Topics

- [Request pipeline](./request-pipeline.md)
- [Routing](./routing.md)
- [Filters](./filters.md)
- [Global error handling](./global-error-handling.md)
- [CORS](./cors.md)