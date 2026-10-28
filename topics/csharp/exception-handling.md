# Exception Handling

Exceptions report failures that ordinary return values do not conveniently represent. Use `try`/`catch` to recover, translate at a meaningful boundary, or add context; use `finally` and `using` for cleanup.

```csharp
try
{
    await SaveAsync(cancellationToken);
}
catch (IOException ex)
{
    throw new ApplicationException("Could not save the report.", ex);
}
```

Catch the narrowest expected exception and preserve the original as `InnerException` when wrapping. A broad catch that logs and continues can hide data loss or leave state inconsistent. `throw;` preserves the original stack; `throw ex;` resets the throw location. Avoid exceptions for routine control flow and avoid empty catches.

Exceptions can cross async boundaries through the returned task and are observed when awaited; `async void` exceptions have different propagation and should be limited to event handlers. Do not expose implementation-specific exceptions indiscriminately from a public API. Log once at the boundary that has actionable context to avoid duplicate, noisy records.

## Catch boundaries and preserving failures
Use `try`/`catch` where the program can recover, add meaningful context, translate an implementation exception to a stable API contract, or perform a cleanup that is not already guaranteed by `using`. Catch the most specific exception that can be handled. A broad catch that returns a default can turn data corruption, cancellation, and programming errors into apparent success.

Use `throw;` inside a catch to rethrow while preserving the original stack. `throw ex;` resets the visible throw site and usually harms diagnosis. When wrapping, supply the original exception as `InnerException`. Do not catch `OperationCanceledException` as an ordinary error when cancellation should propagate. `finally` runs during normal exception unwinding, but process termination and some catastrophic failures cannot be handled reliably.

Exceptions are for exceptional failure, not routine loop control or expected “not found” cases when a result type expresses them better. Do not expose secrets in exception messages or logs. Cleanup exceptions can mask an earlier failure; use APIs and patterns that make ownership clear and test failure paths. Avoid throwing from destructors/finalizers.

Interview answer: distinguish catching from handling. A catch is useful only if it can safely act; otherwise let the failure propagate to a boundary with enough context. Explain stack preservation and inner exceptions rather than claiming exceptions should never be used for performance reasons.
## Related Topics

- [custom-exceptions.md](custom-exceptions.md)
- [async-await.md](async-await.md)
- [disposable-and-using.md](disposable-and-using.md)
- [cancellationtoken.md](cancellationtoken.md)