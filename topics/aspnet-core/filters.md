## Why filters exist

Filters are MVC-specific hooks around parts of controller action execution. They are useful for cross-cutting behavior that needs MVC context, but they are not a universal request pipeline: middleware also applies to minimal APIs and non-MVC endpoints. Prefer middleware for broad HTTP concerns (such as correlation or exception boundaries), endpoint filters for minimal API endpoint behavior, and MVC filters when action/result semantics are specifically needed.

MVC filter stages include authorization, resource, action, exception, and result filters. Authorization filters run early; resource filters can wrap much of MVC execution and are useful around model binding; action filters wrap action invocation; exception filters handle exceptions arising in MVC action/result processing but do not replace global middleware for failures earlier or outside MVC. Result filters wrap result execution. Ordering and short-circuiting affect which later stages execute.

An action filter can observe arguments and the result:

```csharp
using System.Diagnostics;

public sealed class TimingFilter(ILogger<TimingFilter> logger) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(
        ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var started = Stopwatch.GetTimestamp();
        await next();
        logger.LogInformation("Action {Action} took {ElapsedMs} ms",
            context.ActionDescriptor.DisplayName,
            Stopwatch.GetElapsedTime(started).TotalMilliseconds);
    }
}
```

Register filters globally, on a controller/action, or through DI as appropriate. Be mindful that filter instance lifetime and mutable state can create cross-request races. Do not use a filter to duplicate authorization checks or swallow exceptions that should be translated centrally. Test short-circuit behavior, ordering, and async execution.

## Pipeline stages and choosing the right hook

The MVC filter pipeline is nested inside endpoint execution. Authorization filters run before resource filters; resource filters wrap much of MVC processing and can short-circuit before model binding; action filters wrap action invocation; exception filters handle eligible exceptions in MVC; result filters wrap result execution. An action filter can inspect action arguments and the action result, but it does not wrap routing, static-file middleware, or minimal API endpoints. Exact ordering combines scope (global, controller, action) and explicit order metadata; do not rely on undocumented registration coincidences.

Select the extension point by the information and coverage required:

| Need | Prefer |
|---|---|
| All HTTP requests, including non-MVC endpoints | Middleware |
| MVC action arguments/results or MVC-specific conventions | MVC filter |
| Minimal API endpoint invocation | Endpoint filter |
| Route matching and endpoint metadata | Endpoint routing conventions/policies |

Authentication and authorization should generally use the framework middleware and policies rather than a custom action filter. Central exception middleware covers failures outside MVC; an exception filter is useful only when MVC-specific exception behavior is genuinely needed. Avoid building a general-purpose logging filter when built-in telemetry already captures the same request.

## Lifetime and correctness

Filters added by type can use DI and lifetime rules; filter attributes themselves are often metadata objects and are not a place to hold per-request mutable state. A filter may execute concurrently across requests depending on how it is registered and instantiated. Keep state local to the invocation, use `HttpContext` carefully, and pass request cancellation to asynchronous work. Filters that short-circuit must set a valid result and should not assume later filters/actions will execute.

An action filter can observe an exception through the executed context, but catching and suppressing it can hide an incomplete operation. Log once and preserve consistent error translation. Timing filters should use a monotonic timestamp source, avoid high-volume per-action info logs, and not treat application-level timing as a substitute for distributed tracing.

For testing, verify the filter's behavior independently where possible and use integration tests for ordering, short-circuiting, DI activation, and interaction with middleware. Interviewers often ask why filters are not interchangeable with middleware: explain that middleware is framework-wide and surrounds endpoint routing/execution, while filters see MVC-specific stages and context. Pick the narrowest hook that actually has the needed semantics.

## Related Topics

- [Middleware](./middleware.md)
- [Request pipeline](./request-pipeline.md)
- [Routing](./routing.md)
- [Minimal APIs](./minimal-apis.md)
- [Global error handling](./global-error-handling.md)