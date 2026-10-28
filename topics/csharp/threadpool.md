# Thread Pool

The .NET thread pool provides reusable worker threads for short-running work, including task continuations and many framework callbacks. Reuse avoids creating a new OS thread for every operation, but pool capacity and scheduling are managed by the runtime.

```csharp
await Task.Run(() => CalculateCpuBoundResult(input), cancellationToken);
```

Use `Task.Run` to offload CPU-bound work when moving it off a UI thread or scheduling parallel computation is appropriate. Do not wrap naturally asynchronous network/file I/O in `Task.Run` merely to make it appear asynchronous. Blocking pool threads (sync-over-async, long waits, or unbounded work) can cause thread-pool starvation and high latency.

The token passed to `Task.Run` can prevent queued work from starting, but it does not forcibly interrupt a delegate that is already running; CPU work must observe cancellation cooperatively.

The runtime adjusts worker availability based on workload; exact algorithms and timing are implementation details. Avoid manually creating threads or tuning pool minimums as a first response to latency—measure queueing, blocking, CPU, and I/O. Use dedicated threads only for workloads that genuinely need thread affinity or long-lived blocking behavior. Bound parallelism and observe task failures/cancellation.

## Scheduling, starvation, and diagnostics
The managed thread pool provides reusable worker threads for many task continuations, timers, and framework callbacks. Its worker threads are not one-per-task; scheduling and worker injection are runtime-managed. Do not rely on an exact thread count or adjustment algorithm as a language guarantee. A queued task can wait when workers are busy, and blocking many workers can cause starvation: unrelated requests and continuations suffer latency even if CPU utilization is low.

Avoid sync-over-async, long blocking waits, and unbounded work on pool threads. For blocking APIs that cannot be changed, isolate and bound concurrency rather than creating unlimited `Task.Run` work. Naturally asynchronous I/O releases the worker while waiting. CPU-bound work still competes for processor time; parallelizing it beyond available CPU capacity can reduce throughput.

`ThreadPool.SetMinThreads` changes a process-wide runtime setting and is not a first-line fix. Raising it can increase resource usage and hide the source of blocking. Measure queue length, thread count, request latency, blocked stacks, and CPU utilization with runtime counters/traces. Dedicated threads are justified for long-lived blocking or thread-affine work, not as a generic faster task mechanism.

A cancellation token supplied to `Task.Run` may stop queued work from starting, but cannot terminate a running delegate. That code must cooperate. Prefer bounded channels or worker loops for backpressure and predictable service load. Interview misconception: asynchronous code does not necessarily occupy a pool thread while awaiting; a blocked thread and an incomplete task are different resource states.
## Work items, continuations, and workload shape
The pool has worker threads for executing managed work and I/O completion mechanisms for notifying completed asynchronous I/O; do not model every pending I/O task as a thread sitting idle. `await` can return control while the operation is pending, then schedule a continuation when it completes. `Task.Run` queues delegate work to a pool worker; it is not the same as an OS-thread-per-task strategy. Runtime and platform implementation details affect scheduling, but APIs do not promise a particular worker identity or exact execution time.

Separate workload classes when tuning: CPU-bound work benefits from bounded parallelism near available processor capacity, while I/O-bound work should normally use asynchronous APIs and can have many operations in flight without consuming one thread each. Blocking I/O occupies a worker for the whole wait. Mixing long blocking tasks with short request continuations on the same limited worker resource can inflate tail latency. If unavoidable blocking must be isolated, bound it with a semaphore or dedicated worker/service rather than creating unlimited queued tasks.

A thread-pool worker is not a request boundary. Work queued from a request may outlive that request, its scoped services, or its cancellation token. Do not capture a request-scoped DbContext or mutable request object into detached work. Use a hosted background service or durable queue with explicit ownership, shutdown, retries, and error reporting. Fire-and-forget `Task.Run` in web request code often turns failures into lost logs and uses resources unpredictably.

## Starvation versus saturation
Starvation describes a shortage of available workers to process queued work, commonly because workers are synchronously blocked. CPU saturation means processors are busy doing useful or excessive work. Lock contention means threads are waiting for synchronization. These symptoms need different fixes. More workers may help one blocked workload temporarily, but can worsen CPU scheduling, memory consumption, and downstream overload.

A classic risk is sync-over-async: a worker blocks waiting for a task whose continuation is queued to the same pool. In some contexts this creates a deadlock; elsewhere it can cause starvation and latency without a strict deadlock. Avoid `.Result`, `.Wait()`, and blocking waits across async boundaries. Keep work asynchronous end to end and propagate cancellation. A custom scheduler or `LongRunning` task option may use a dedicated thread under some task schedulers, but that is not a universal thread-pool tuning mechanism and behavior depends on scheduler.

`ThreadPool.SetMinThreads` changes a process-level setting and can cause more threads to be created sooner. It does not create permanent dedicated workers or increase CPU capacity. Increase it only after evidence shows worker injection delay is the bottleneck and after load testing the side effects. Exact adjustment heuristics are runtime implementation details and can change between .NET versions.

## Diagnosing latency
Look at more than thread count. Useful evidence includes queue length, worker and completion-port thread counts, CPU usage, request latency percentiles, blocked stack traces, lock contention, allocation/GC, and downstream service latency. A high worker count can be a symptom of blocking rather than a solution. Compare behavior under realistic concurrency and capture traces around the incident; averages hide starvation's long-tail effect.

Use runtime counters and tracing tools available for the target .NET runtime (for example `dotnet-counters` and `dotnet-trace`) to correlate queued work and thread growth. Inspect stacks to identify synchronous waits, locks, and blocking I/O. Instrument work-item duration and queue wait separately where application architecture permits. Avoid instrumenting every tiny item with expensive logging, which can perturb the workload.

For bounded background processing, channels or a queue plus a fixed number of consumers can provide explicit backpressure. A bounded channel can make producers wait or reject work once capacity is reached, keeping memory and downstream load controlled. Define what shutdown does to queued and active work, and ensure cancellation is observed. A concurrent collection alone does not provide these lifecycle semantics.

Interview misconception: the thread pool is not an unlimited supply of threads and `async` is not a way to increase CPU throughput. It is a reusable scheduler for work; scalability comes from avoiding unnecessary blocking and controlling concurrency. Distinguish documented API behavior from implementation heuristics, and tune only from measurements.
## Backpressure and capacity planning
For a service consuming work faster than a downstream dependency can complete it, an unbounded queue converts overload into memory growth and increasingly stale work. Put a limit on outstanding operations and define whether producers wait, reject, or shed low-priority work. A bounded `Channel<T>` with a fixed number of consumers can encode this explicitly; each consumer should honor cancellation and report failures. Capacity should be selected from measured latency and memory budgets, not guessed from a thread count.

Avoid launching one `Task.Run` per item in a large input list. That queues all work at once, increases allocations and queue delay, and can overwhelm remote systems even though the pool reuses workers. Use a bounded parallelism mechanism (such as `Parallel.ForEachAsync` where appropriate) or a bounded worker pipeline. Ensure result ordering requirements do not require buffering every completion. CPU-bound parallelism should be limited to available processing capacity; I/O concurrency should be limited by dependencies and service quotas.

Do not treat thread-pool minimums, `TaskCreationOptions.LongRunning`, or `TaskScheduler` changes as generic tuning knobs. They change scheduling characteristics and can shift the bottleneck elsewhere. A dedicated thread is appropriate when an API requires a stable thread identity or a long-lived blocking loop; give it a shutdown protocol and exception handling. Measure queue wait, task duration, dependency latency, and resource saturation before choosing.
## Choosing execution mechanisms
Use `Task.Run` for work that should execute as scheduled CPU work, especially when protecting a UI thread; it does not create additional CPU capacity. For data-parallel CPU loops, `Parallel` APIs can coordinate bounded parallelism and cancellation, but nested parallelism and oversubscription can reduce throughput. For asynchronous network calls, start the async API directly and await it. For sustained background consumption, a hosted service plus bounded channel makes the worker count and shutdown policy explicit.

Thread-pool callbacks should be short enough to return promptly or should await asynchronous operations rather than synchronously block. Timer callbacks can overlap if the callback takes longer than its period, depending on the timer API; guard against concurrent reentry or use a loop with explicit delay/cancellation. Capture exceptions from background work and connect them to application health/logging. A pool worker is a shared process resource: work that monopolizes it can delay unrelated framework continuations.

There is no universally correct pool size. Workload mix, processor count, blocking behavior, runtime version, and downstream limits matter. Validate changes with load tests and tail-latency measurements on the deployed runtime/OS. The runtime's scheduling algorithm is not a stable application contract, so application code should depend on completion and cancellation semantics rather than thread identity or exact scheduling time.
## Related Topics

- [task.md](task.md)
- [async-await.md](async-await.md)
- [threading.md](threading.md)
- [valuetask.md](valuetask.md)