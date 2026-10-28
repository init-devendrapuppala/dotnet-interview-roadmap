# `lock`

`lock` provides mutual exclusion: only one thread at a time can execute a protected region using the same lock object. In modern C#, `lock` compiles to monitor-based enter/exit with release guaranteed even when an exception occurs.

```csharp
private readonly object _gate = new();
private Dictionary<string, int> _counts = new();

public void Record(string key)
{
    lock (_gate)
        _counts[key] = _counts.GetValueOrDefault(key) + 1;
}
```

Lock on a private stable object (or use an appropriate `System.Threading.Lock` in supported modern C#/.NET targets), not on `this`, a public type, or a string that other code can share. Keep critical sections short; establish a consistent lock ordering to avoid deadlocks. Do not `await` inside a `lock` statement because the monitor is thread-affine; use `SemaphoreSlim.WaitAsync` or another async coordination primitive when needed.

A lock protects only code that uses the same lock. It does not make returned mutable references safe after leaving the critical section. `volatile` is not a substitute for a lock around compound operations. Measure contention and consider immutable snapshots or concurrent collections where they better fit.

## Lock scope and memory visibility
`lock` uses a monitor to provide mutual exclusion for code locking the same object. It also supplies memory-ordering guarantees so changes made in a critical section are visible to a later thread acquiring that lock. The guarantee only works if every access to the shared invariant uses that synchronization; locking one code path does not protect an unguarded reader.

Always lock a private object such as `private readonly object _gate = new();`, not `this`, a public field, or a `Type` object. Keep the scope as small as correctness permits; expensive I/O inside a lock increases contention and can cause lock convoying. Avoid invoking arbitrary callbacks while holding it because callback code may re-enter or acquire locks in a conflicting order. C# monitors are reentrant for the owning thread, but reentrancy does not make complicated lock graphs safe.

A `lock` block releases the monitor even when an exception exits the block. It cannot contain `await`; for asynchronous mutual exclusion use `SemaphoreSlim.WaitAsync` with `try/finally` release, and understand that this is a semaphore rather than a monitor. Do not use `volatile` to replace a lock when a multi-step invariant needs atomicity. Use `Interlocked` for suitable individual atomic operations.

Deadlock is commonly caused by inconsistent lock order or waiting for work that needs the held lock. Define a global order for multiple locks and never wait synchronously for asynchronous work inside a critical section. For interviews, distinguish mutual exclusion from deadlock avoidance and from lock-free programming; a lock is often the clearest correct solution.
## Related Topics

- [threading.md](threading.md)
- [concurrent-collections.md](concurrent-collections.md)
- [task.md](task.md)
- [cancellationtoken.md](cancellationtoken.md)