# CancellationToken

Cancellation in .NET is cooperative. A `CancellationToken` communicates a cancellation request; it does not forcibly stop a thread or unwind arbitrary code. The operation must observe the token and stop safely.

```csharp
public async Task RefreshAsync(CancellationToken cancellationToken)
{
    cancellationToken.ThrowIfCancellationRequested();
    await FetchUpdatesAsync(cancellationToken);
    cancellationToken.ThrowIfCancellationRequested();
    ApplyUpdates();
}
```

Accept and propagate tokens through asynchronous APIs, including I/O and waits when supported. Check at reasonable boundaries in CPU loops, not on every trivial instruction. `CancellationTokenSource` owns cancellation initiation and should be disposed when its lifetime ends; linked sources combine upstream and timeout cancellation. A canceled token is a request/state signal, not proof that no side effects occurred.

Use `OperationCanceledException` (commonly via `ThrowIfCancellationRequested`) and avoid translating cancellation into an ordinary failure unless the API explicitly defines that behavior. Distinguish caller cancellation from an internal timeout when reporting outcomes. Cancellation can race with completion; design operations to be idempotent or safely partial where needed.

## Cooperative cancellation contract
A `CancellationToken` is a notification that an operation should stop; it does not forcibly abort a thread or roll back completed side effects. APIs should accept and propagate the caller's token through each cancellable layer. CPU-bound loops should periodically call `ThrowIfCancellationRequested` at sensible checkpoints rather than checking on every trivial instruction. For I/O, pass the token to the framework API when supported.

Cancellation is represented as an `OperationCanceledException` (commonly `TaskCanceledException` for task APIs) and async callers should generally let it propagate when cancellation is part of the contract. Do not catch it under a broad exception handler and report success. If code translates or handles cancellation, distinguish the requested token and define whether partial work remains. Cancellation after a database write or external request may not undo that effect.

`CancellationTokenSource` owns cancellation signaling and should be disposed when its lifetime ends; linked sources combine scopes and likewise need disposal. Tokens are safe to pass across threads, but cancellation callbacks execute synchronously as cancellation is requested and should be fast/non-blocking. Do not call `Cancel` while holding a lock that callbacks may acquire. A token passed to `Task.Run` can prevent queued work from starting, but it does not interrupt a delegate already running unless the delegate observes it.

A robust API documents which phases honor cancellation and whether cancellation is best-effort. In interviews, emphasize cooperative signaling and propagation rather than saying cancellation “kills” a task.
## Related Topics

- [async-await.md](async-await.md)
- [task.md](task.md)
- [exception-handling.md](exception-handling.md)
- [threading.md](threading.md)