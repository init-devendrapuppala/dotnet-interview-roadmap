## Why exception handling is layered

An exception represents an unexpected failure, not a routine branch. Catch an exception where the code can add context, recover, translate to a meaningful application result, or perform a required cleanup. Catching broadly just to log and continue can hide partial failure; allowing unhandled exceptions to escape can terminate a request or, depending on host behavior, threaten process availability.

At the HTTP boundary, use centralized exception handling to produce a stable response and log diagnostic details. Do not return stack traces, SQL messages, paths, or secrets to callers in production. Preserve the original exception as an inner exception when translating it, and avoid logging the same exception at every layer. Cancellation is expected control flow: do not report client-aborted requests as application errors without considering the cancellation token and host behavior.

For expected outcomes such as validation failure, not-found, or conflict, return explicit results rather than throwing and catching exceptions as normal flow. For genuinely exceptional failures, log with structured fields and a correlation/trace identifier, while keeping personally identifiable and credential data out of logs.

```csharp
try
{
    await service.ProcessAsync(id, cancellationToken);
}
catch (ExpectedDomainException ex)
{
    logger.LogInformation("Order {OrderId} could not be processed: {Reason}",
        id, ex.Message);
    throw;
}
```

This example logs context and rethrows; typically the HTTP exception handler should map the domain failure consistently, and one layer should own error logging. Never use `throw ex;` when rethrowing because it resets the stack trace; use `throw;`.

## Where to catch and what to return

Choose a catch boundary based on what can be done meaningfully. A repository may add operation context while preserving the original exception; an application service may translate an expected domain outcome; an HTTP exception handler may map known failures to stable status codes. Catching an exception only to log and rethrow at every layer creates duplicate events and noisy alerts. If a layer cannot recover, translate, or add useful context, let the exception propagate to the boundary that can.

Expected outcomes should usually be represented explicitly. A missing row, invalid user input, or version conflict is part of the application contract and often should not be implemented as throwing an exception for every normal request. On the other hand, catching `Exception` and returning a success-looking result hides partial writes and makes retries unsafe. Preserve failure semantics so callers, telemetry, and orchestration can react correctly.

When translating a low-level exception, retain it as the inner exception and avoid leaking its details to the client. A database provider's message may include schema, query, or connection information. Public API responses should be stable and safe; diagnostic logs should be access-controlled, structured, and redacted. A trace ID or correlation identifier helps connect an error response to internal telemetry without disclosing a stack trace.

## Cancellation and cleanup

`OperationCanceledException` is not always an application fault. A browser may disconnect, a request may time out, or the host may be shutting down. Pass cancellation tokens to asynchronous I/O and avoid converting expected cancellation into a 500 or an error alert. Do not suppress arbitrary cancellation: identify the token and operation semantics, since a downstream timeout may require a different response than host shutdown.

Use `finally`, `using`, and `await using` for cleanup that must occur whether an operation succeeds or fails. Cleanup code should not mask the original exception; if cleanup can fail, decide how both failures are recorded. For database transactions, ensure rollback/commit behavior is handled by the relevant abstraction rather than broadly catching and continuing with an uncertain transaction state.

## Practical review checklist

At code review, ask: Is this failure expected? Is retry safe? Is enough context logged once? Does the public status accurately describe the outcome? Can sensitive details escape? Does cancellation stop the expensive work? Does a catch accidentally continue after a partial side effect? Avoid exception-driven loops for ordinary branching and avoid using exceptions as a control-flow mechanism across layers.

In interviews, a strong answer distinguishes exception propagation from response translation, explains why `throw;` preserves the stack, and describes the one boundary responsible for HTTP error mapping. Error handling is part of system reliability: the goal is not to catch every exception locally, but to preserve truth, visibility, and safe recovery.

## Related Topics

- [Global error handling](./global-error-handling.md)
- [Problem Details](./problem-details.md)
- [Logging](./logging.md)
- [Web APIs](./web-api.md)
- [C# exception handling](../csharp/exception-handling.md)