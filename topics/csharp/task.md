# Task and Task<T>

`Task` represents an asynchronous operation that may complete, fault, or be canceled. `Task<T>` additionally carries a result. A task is a promise of completion, not necessarily a dedicated thread.

```csharp
Task<int> pending = GetCountAsync(cancellationToken);
int count = await pending;
```

Use `Task.CompletedTask` or `Task.FromResult` for synchronous completion paths when appropriate. `Task.WhenAll` waits for all supplied tasks; it does not limit concurrency. `Task.WhenAny` identifies the first completion but does not automatically cancel the remaining work. Always define what happens to sibling operations after one fails.

Await tasks instead of blocking with `.Wait()` or `.Result`, which can cause deadlocks in contexts with a synchronization context and can tie up thread-pool threads. Fire-and-forget tasks need explicit exception observation, cancellation, and shutdown ownership. `Task.Run` queues CPU-bound work to the thread pool; it is usually unnecessary to wrap naturally asynchronous I/O.

Tasks are generally safe to await multiple times, unlike `ValueTask` under its single-consumption constraints. Their completion and memory visibility are coordinated by runtime synchronization, but shared application state still requires proper synchronization.

## Completion, composition, and failure
`Task` represents an operation that may complete later; `Task<T>` also carries a result. It is not necessarily a dedicated thread: an I/O task can remain incomplete while no worker thread is occupied. Awaiting a task observes its completion and rethrows failure at the await point. A task may complete successfully, fault, or be canceled. `Task.WhenAll` waits for all supplied tasks; if any fail, the combined task faults, so inspect its exception/individual tasks when all failures matter. `WhenAny` identifies the first completion but does not cancel the remaining work automatically.

Start independent I/O operations before awaiting to overlap latency, but bound concurrency to protect downstream systems. Calling `Task.Run` around naturally asynchronous I/O adds scheduling overhead and can consume pool capacity. `Task.Run` is for appropriate CPU-bound/off-thread work, not a way to make synchronous blocking APIs scalable. Avoid sync-over-async (`Wait`, `.Result`) because it can deadlock under a synchronization context or block pool threads.

Do not create a `TaskCompletionSource` task without ensuring every path completes, faults, or cancels it; use `RunContinuationsAsynchronously` when completing it under a lock or sensitive callback to avoid running consumer continuations inline. Avoid unobserved fire-and-forget operations; capture and log failures and tie their lifetime to a host/background service. A token is cooperative and does not undo already committed effects. Return the task from async wrappers where possible to avoid extra state machines; use `async` when local try/finally, transformation, or exception handling requires awaiting.
`Task.Delay` represents an asynchronous timer; `Thread.Sleep` blocks the current thread. Use the former in asynchronous workflows and pass cancellation where possible. `Task.Yield` schedules a continuation but is not a general performance fix. Do not use `Task.Run` just to avoid awaiting: observe the returned task and define who owns the work. For a `TaskCompletionSource`, complete it exactly once and use `TrySet*` when competing completion paths are possible. Avoid exposing a task that can be externally completed unless that is part of the API contract.
For bounded fan-out, do not assume `WhenAll` limits how many operations start; it only combines completion of tasks already created. Use a concurrency limiter or bounded worker queue when enumerating a large input. Ensure failures are observed even if a caller returns early, and cancel or drain remaining work according to the operation contract. A task may represent a promise completed by an I/O callback, a timer, or a worker; its abstraction is completion, not a physical thread. This distinction helps explain why an async service can keep many requests in flight without allocating a thread for every wait.
`Task.Delay` represents an asynchronous timer, whereas `Thread.Sleep` blocks the current thread. Use the async form in asynchronous workflows and provide cancellation where needed. `Task.Yield` schedules continuation but is not a general performance fix. For a `TaskCompletionSource`, ensure every path completes, faults, or cancels it; use `TrySet*` when competing completion paths can race and `RunContinuationsAsynchronously` when completing under a lock or sensitive callback. A task represents completion, not a physical thread; that distinction explains how many I/O operations can remain pending without one thread per wait.
## Related Topics

- [async-await.md](async-await.md)
- [valuetask.md](valuetask.md)
- [cancellationtoken.md](cancellationtoken.md)
- [threadpool.md](threadpool.md)