# Threading and Concurrency

Concurrency means multiple operations make progress during overlapping time; parallelism means work executes simultaneously. .NET applications may use OS threads, thread-pool workers, asynchronous I/O, and continuation scheduling. Correctness requires reasoning about shared state, ordering, and cancellation—not merely adding `Task.Run`.

```csharp
private readonly object _gate = new();
private int _count;

public int IncrementAndRead()
{
    lock (_gate)
        return ++_count;
}
```

Unsynchronized access to shared mutable state can cause races, lost updates, or visibility bugs. Use immutable messages, confinement, locks, atomics, or concurrent collections according to the invariant. A thread-safe collection does not make a multi-operation transaction atomic. Keep lock scopes short and never `await` inside a `lock`; use async-compatible coordination primitives when asynchronous waits are needed.

For I/O-bound work prefer asynchronous APIs instead of dedicating threads to waits. For CPU-bound work, parallelism can improve throughput but may oversubscribe processors or contend on shared resources. Consider bounded concurrency, backpressure, fairness, and shutdown. Test race-sensitive behavior with stress tests and diagnostics, but do not assume a passing test proves absence of races.

## Synchronization and shared state
Threads execute instructions; tasks represent operations and are not synonymous with threads. Multiple tasks can run on one or several threads, and an asynchronous operation may resume on a different thread when no context requires affinity. Race conditions arise when operations on shared mutable state interleave without synchronization. A lock establishes mutual exclusion and memory visibility for code using the same lock; all readers and writers of that invariant must follow the same discipline.

Use a private dedicated lock object and keep the critical section short. Never lock on `this`, a `Type`, or a publicly accessible object because unrelated code can contend or deadlock on it. Do not await while holding a `lock` (C# `lock` requires synchronous scope); use async coordination primitives such as `SemaphoreSlim.WaitAsync` when asynchronous exclusion is actually needed. Avoid calling unknown callbacks under a lock and define lock ordering if multiple locks exist.

`volatile` is not a general substitute for locking: it provides restricted visibility/order guarantees and does not make compound read-modify-write operations atomic. Interlocked operations are appropriate for simple atomic counters/flags. Immutable messages and ownership transfer can often reduce synchronization needs.

Deadlocks require a cycle of waits; thread-pool starvation is different—workers are blocked so queued continuations take longer to run. Diagnose contention, blocking, CPU saturation, and queue delay separately. For production, prefer bounded work, cancellation, and measured synchronization rather than increasing thread counts blindly. Interview answers should explain safety and liveness: mutual exclusion prevents races, while lock ordering and short waits help avoid deadlock and starvation.
## Choosing concurrency primitives
Choose a primitive based on the invariant and the waiting model. `lock`/`Monitor` protects a synchronous critical section; `Interlocked` handles simple atomic reads/updates; `SemaphoreSlim` limits concurrent access and supports async waits; `ReaderWriterLockSlim` can help read-heavy workloads only when measurements justify its complexity. Channels coordinate producers and consumers with buffering/backpressure. Concurrent collections protect individual operations but not transactions across several operations.

```csharp
private readonly SemaphoreSlim _gate = new(1, 1);

public async Task UpdateAsync(CancellationToken token)
{
    await _gate.WaitAsync(token);
    try { await UpdateBackingStoreAsync(token); }
    finally { _gate.Release(); }
}
```

This serializes the whole async operation, which may be necessary for a shared resource but can limit throughput. Ensure every acquired permit is released in `finally`, including cancellation and exceptions. A lock cannot be held across `await`; choosing a semaphore creates asynchronous wait behavior but does not make the protected object thread-safe for callers that bypass the gate.

## Deadlock, starvation, and cancellation
Deadlock is a cycle of dependencies, such as thread A holding lock 1 while waiting for lock 2 and thread B holding lock 2 while waiting for lock 1. Establish a global lock order and avoid blocking on callbacks or tasks that may need a held lock. Reentrant monitors can allow the same thread to reacquire a lock but do not prevent cross-thread deadlocks. Starvation differs: work waits indefinitely because scheduling or resource access repeatedly favors others, while pool starvation usually reflects all workers being blocked.

Cancellation should be cooperative and must not leave invariants half-updated. Define safe cancellation points and whether an operation can have committed effects before reporting cancellation. Cancellation callbacks can run synchronously; do not invoke cancellation while holding a lock if a callback might acquire it. Do not assume canceling a token interrupts blocking code that does not observe it.

## Shared-state design and operations
Prefer immutability, thread confinement, and message passing before fine-grained locking. These approaches reduce the number of interleavings to reason about. If mutable state is shared, identify the invariant (not just individual fields), guard all reads and writes consistently, and keep locks private. Compound operations like increment-if-below-limit must be atomic as a unit; a thread-safe collection does not make the whole workflow atomic.

`volatile` ensures specific visibility/order behavior for supported fields but does not make `counter++` atomic. `Interlocked.Increment` is appropriate for a counter, while a more complex state transition may require compare-exchange loops or a lock. Lock-free algorithms are difficult to prove and may suffer from livelock or ABA-style problems; use tested library primitives unless specialized evidence supports custom code.

Thread safety is a property of a documented API contract, not simply of a class having a lock somewhere. Clarify whether concurrent reads, writes, disposal, and callbacks are supported. Test stress cases, but do not treat a passing stress test as proof that all races are impossible.

## Production diagnosis
Capture CPU and thread data under representative load. High CPU suggests computation or excessive parallelism; many waiting threads suggest blocking or lock contention; rising queued work with slow completions suggests saturation or backpressure failure. Measure lock wait/hold times and identify whether downstream I/O dominates. Thread count alone cannot identify root cause.

Do not create a new thread per short operation. Threads consume stack and scheduler resources; `Task` uses scheduling abstractions, while naturally asynchronous I/O usually does not occupy a worker during the wait. Dedicated threads are appropriate for long-lived thread-affine or blocking work, but require lifecycle management. In interviews, discuss safety (no races), liveness (progress), and throughput separately, and distinguish C# guarantees from runtime scheduling details.
## Testing interleavings and invariants
Concurrency bugs often depend on timing, so deterministic unit tests that assert one schedule are insufficient. Keep state transitions small and test invariants under concurrent load, use barriers/latches rather than arbitrary sleeps to coordinate tests, and run race-focused tooling where available. Stress testing can reveal defects but cannot prove their absence. Keep the synchronization policy documented beside the state it protects.

Treat disposal, cancellation, and shutdown as concurrent operations too. A service may be disposed while a callback is running; define whether shutdown waits for active operations, rejects new work, or cancels pending work. Do not dispose a semaphore or cancellation source while consumers may still use it. Background work should be joined or supervised so exceptions and completion are observable.

The `lock` statement provides mutual exclusion and memory visibility only for accesses using that same lock. `volatile` is for limited visibility/order scenarios and does not make compound operations atomic. `Interlocked.CompareExchange` can implement lock-free state transitions, but correctness requires reasoning about ABA, retry loops, and memory ordering; prefer a lock if the critical section is not a measured bottleneck. “Lock-free” is not synonymous with faster under contention.

Deadlock, starvation, and livelock are distinct liveness failures: deadlock has a cycle of waits; starvation denies a participant progress; livelock continues reacting without completing useful work. Diagnostics and mitigations differ. In production, collect wait duration, stack traces, CPU and queue metrics; do not infer the cause merely from high thread count.
## Parallel execution versus asynchronous waiting
Concurrency means multiple operations make progress over overlapping time; parallelism means multiple computations execute simultaneously on separate processors. Async I/O improves scalability by freeing threads while waiting, but it does not make CPU-bound algorithms run faster. Parallel loops can increase CPU throughput for independent work but add partitioning/synchronization overhead and can oversubscribe processors. Choose based on whether the bottleneck is waiting or computation.

Thread affinity is uncommon in server code but matters for UI controls, certain native APIs, and dedicated event-loop threads. Do not assume continuations resume on the same thread unless a synchronization context or API explicitly guarantees affinity. If a library requires affinity, marshal to the owning dispatcher rather than relying on incidental thread identity.

A shared mutable object can be safe if access is serialized, but synchronization can reduce throughput and create tail latency. Prefer immutable snapshots or partitioned state when practical. If using per-key locks or concurrent maps, define cleanup and ensure the locking identity is stable. Use diagnostics to compare lock contention against the cost of a simpler single lock; premature fine-grained locking increases deadlock risk.
When evaluating a proposed fix, ask which guarantee it supplies: mutual exclusion, atomicity, ordering, visibility, or cancellation. A lock may provide several of these for cooperating code, while `volatile` provides only limited ordering/visibility and does not make compound updates atomic. Cancellation is a cooperative request, not a synchronization primitive. Explicitly document the protected invariant and the lock or owner that governs it. This makes reviews and future refactoring safer than relying on a generic label such as “thread-safe.”
## Related Topics

- [task.md](task.md)
- [threadpool.md](threadpool.md)
- [lock.md](lock.md)
- [concurrent-collections.md](concurrent-collections.md)
- [cancellationtoken.md](cancellationtoken.md)