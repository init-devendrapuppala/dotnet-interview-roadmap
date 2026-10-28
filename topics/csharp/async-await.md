# async and await

`async`/`await` lets code express asynchronous operations without blocking a thread while an awaited operation is incomplete. An `async` method typically returns `Task` or `Task<T>`; the compiler generates a state machine that resumes after each incomplete `await`.

```csharp
public async Task<string> LoadAsync(
    HttpClient client, Uri uri, CancellationToken cancellationToken)
{
    using var response = await client.GetAsync(uri, cancellationToken)
        .ConfigureAwait(false);
    response.EnsureSuccessStatusCode();
    return await response.Content.ReadAsStringAsync(cancellationToken)
        .ConfigureAwait(false);
}
```

`await` does not inherently create a thread. It registers a continuation; an operation that completes synchronously may continue inline. Async is most valuable for I/O-bound work. Wrapping synchronous/blocking work in `Task.Run` does not make the underlying operation scalable or truly asynchronous; reserve it mainly for CPU-bound work when offloading is appropriate.

Propagate async through call chains (“async all the way”), return tasks rather than blocking with `.Result`/`.Wait()`, and avoid `async void` except event handlers. Await tasks to observe exceptions. Pass cancellation tokens to cancellable operations and define timeout/retry behavior at the owning boundary. Use `ConfigureAwait(false)` thoughtfully in reusable library code; modern ASP.NET Core generally has no custom synchronization context, while UI apps do. Execution-context flow is separate from synchronization-context capture.

Async methods can allocate state machines and continuations, although compilers/runtimes optimize common synchronous-completion paths. Do not optimize away clarity without measurement. Avoid unbounded fan-out (`Task.WhenAll` over huge input), shared mutable state in continuations, and fire-and-forget work without a lifetime, error-observation, and shutdown strategy.

## State machine and context
The compiler transforms an async method into a state machine that records locals needed after an incomplete await. If the awaited operation is already complete, execution can continue synchronously; `async` does not mean “run on another thread.” Awaiting yields control to the caller rather than blocking the current thread. The awaited `Task` represents completion/failure; the state machine later resumes according to the awaiter's scheduling behavior.

Use naturally asynchronous APIs for I/O. Wrapping network or file I/O in `Task.Run` usually wastes a worker thread. `Task.Run` is useful to offload CPU-bound work from a UI thread or to schedule suitable parallel work, but server-side CPU work still consumes the same processor capacity. A returned `Task` should be observed: unobserved fire-and-forget work loses straightforward error propagation and request lifetime coordination.

Propagate cancellation tokens to the underlying operation; cancellation is cooperative, not forced interruption. `ConfigureAwait(false)` avoids requiring continuation on a captured context, which may help library code and some environments, but modern ASP.NET Core typically has no custom synchronization context. It does not make code thread-safe. Avoid `.Result`/`.Wait()` in async paths because blocking can deadlock in context-bound applications or starve worker threads. Keep methods async only when needed for await/try/finally or return shaping; do not use `async` merely as decoration. Return `Task<T>` for reusable asynchronous results and preserve exceptions by awaiting or returning the task according to the method contract.
## Composition patterns and failure handling
When operations are independent, start them before awaiting so latency overlaps, while limiting concurrency if the remote service or connection pool has finite capacity. `Task.WhenAll` is appropriate when all results are required; if one task faults, other tasks are not automatically canceled, so decide whether to cancel siblings and how to observe every failure. `WhenAny` lets a caller react to the first completion but leaves remaining tasks running until explicitly canceled or awaited.

An async method normally captures the current synchronization context at an await and resumes there when one exists. UI code often needs that affinity to update controls; reusable library code may use `ConfigureAwait(false)` when it does not need the context. ASP.NET Core typically does not install a custom synchronization context, so historical deadlock advice should not be repeated as if every environment behaves identically. Blocking can still consume threads and reduce throughput.

Exception handling follows task completion: an exception in an async method is stored on the returned task and observed when awaited. `async void` is an exception to that composability and should be restricted to event handlers. For background work, retain a task or use a hosted worker abstraction with shutdown and failure reporting.

Avoid unnecessary state machines when a method only returns an existing task and needs no local `await`, but do use `await` when it is needed for `try/finally`, resource lifetime, or result/error transformation. Performance should be measured; readability and correct cancellation/error propagation usually matter more than removing a small allocation.
## Related Topics

- [task.md](task.md)
- [valuetask.md](valuetask.md)
- [cancellationtoken.md](cancellationtoken.md)
- [threading.md](threading.md)
- [exception-handling.md](exception-handling.md)