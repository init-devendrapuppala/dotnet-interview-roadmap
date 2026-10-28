## Why hosted services live with the host

`IHostedService` participates in the generic host lifecycle: startup occurs as the host starts, and `StopAsync` is called during graceful shutdown when possible. `BackgroundService` runs asynchronous work in `ExecuteAsync`. This is useful for consumers, periodic maintenance, and lightweight schedulers colocated with the app, but process memory is not durable and every replica runs its own service instance.

Register a service through DI:

```csharp
builder.Services.AddHostedService<QueueConsumer>();
```

Hosted service instances are effectively singleton-lived. Do not inject a scoped `DbContext` directly; create an `IServiceScope` per unit of work and dispose it. Honor the supplied cancellation token during reads, waits, and downstream calls. `StopAsync` has a bounded shutdown window; do not assume deployments wait indefinitely, and do not block shutdown on unbounded work.

For a queue consumer, define delivery semantics explicitly. At-least-once delivery means handlers should be idempotent and acknowledge only after durable processing. Bound concurrency and queue prefetch so work does not overwhelm dependencies; add retry limits, backoff, dead-lettering, and observable failure counts. Catch exceptions at the right boundary—an uncaught exception from a `BackgroundService` can affect host behavior according to runtime configuration, so decide whether to stop, retry, or continue and alert accordingly.

For work requiring durable scheduling, cross-instance coordination, strong retry visibility, or independence from web deployment, a dedicated worker or managed queue is usually a better fit. A distributed lock may coordinate replicas, but lock expiry and process pauses still require safe idempotent behavior.

## Lifecycle and execution model

The generic host owns the hosted-service lifecycle. At startup it calls each service's start operation; when the host stops, it requests cancellation and invokes the service's stop operation within a configured shutdown window. `BackgroundService` adapts this model by starting `ExecuteAsync` as the long-running task. It should represent the service's lifetime, not a fire-and-forget task that outlives the host. Startup ordering should not be used as an undocumented dependency mechanism between workers; if one worker needs another to be ready, expose readiness or coordinate explicitly.

Long-running initialization inside `ExecuteAsync` can delay service readiness or fail startup depending on the host/runtime behavior. Keep startup work bounded and decide what readiness means while warm-up occurs. If initialization is critical, make failure visible and prevent traffic from reaching an unready instance. Avoid blocking constructors or synchronously waiting on asynchronous work, which can slow host startup and create thread starvation.

The stopping token is cooperative. A worker must pass it into `PeriodicTimer`, channel reads, broker receives, database calls, and HTTP calls. It should stop accepting new work, then finish, checkpoint, or safely abandon in-flight work before the deadline. Shutdown is not guaranteed: container termination, machine loss, or process crash may bypass it. Durable work must therefore be recoverable independently of `StopAsync`.

## Scope, concurrency, and ownership

The hosted-service object is created by DI as a long-lived service. It must not capture request-scoped services or retain a `DbContext` for the worker's lifetime. Create and dispose an async DI scope per bounded unit of work. Avoid retaining `HttpContext`, scoped options snapshots, or request data between iterations. A service's fields can be accessed by multiple callbacks if the implementation starts multiple loops, so either design for concurrency or serialize work intentionally.

If several hosted services are registered, each is a separate lifecycle participant; registration order is not a robust coordination protocol. For parallel processing, use bounded concurrency and cancellation-aware coordination. A bounded `Channel<T>` can provide in-process backpressure, but pending items are lost on process death. Durable queues or databases are needed when accepted work must survive restart.

## Failure policy and deployment

Uncaught exceptions from `BackgroundService` can affect host behavior according to runtime version and configured `HostOptions.BackgroundServiceExceptionBehavior`. Choose a policy explicitly: terminate and let orchestration restart when the worker is essential and state is recoverable, or catch at a well-defined iteration boundary for transient faults with bounded retry/backoff. Do not catch and ignore exceptions. Track worker heartbeat, last-success time, queue age, failure count, and shutdown completion; an HTTP health check can report that essential background work is stalled.

Every replica starts its own worker, so scheduled work can run multiple times. Use database leases, queue ownership, partitioning, or a dedicated scheduler if single-owner behavior is required. Even with coordination, design handlers to be idempotent, since a process can crash between committing a side effect and acknowledging a message. Bound retry counts, dead-letter poison messages, and provide operator visibility/replay.

Testing should cover cancellation during waits and processing, failure/retry behavior, scoped dependency disposal, duplicate delivery, and the host's shutdown window. Use host-level tests for lifecycle integration and unit tests for the extracted work processor. In interviews, explain that a hosted service is an in-process lifecycle abstraction—not a durable job system—and discuss what happens during deployment, scale-out, and an abrupt crash.

## Choosing the hosting abstraction

Implement `IHostedService` directly when work is event-oriented or startup and stop hooks are the primary need. Derive from `BackgroundService` when the service owns an asynchronous loop. A plain `IHostedService` can start a separately tracked task, but it must observe and await that task during shutdown; otherwise exceptions and lifetime become detached from the host. Do not start untracked work with `Task.Run` in a constructor or startup method.

`StartAsync` should generally be quick and non-blocking so it does not hold up the whole host. A long-running loop belongs in `ExecuteAsync`. If a service performs warm-up before it can process work, represent that state so readiness checks can prevent premature traffic. When multiple components depend on startup order, model the dependency explicitly rather than relying on registration order. A hosted service is not automatically an ASP.NET request; it has no `HttpContext` and should not impersonate a request scope.

## Scheduling and time

`PeriodicTimer` is useful for a simple fixed cadence within one process, but it is not a durable calendar scheduler. It does not automatically coordinate replicas, persist missed occurrences, or guarantee an exact wall-clock schedule. Decide whether missed ticks should be skipped, caught up, or coalesced. For calendar tasks, account for daylight-saving changes, time zones, UTC storage, and clock drift. Persist the next run or use a scheduler/queue when timing must survive restart or be observable and replayable.

Do not run a long job synchronously in a timer callback without defining overlap behavior. If a prior iteration is still running, either wait (sequential processing), reject/coalesce the next run, or explicitly permit bounded parallel executions. Overlap can duplicate destructive cleanup or exceed downstream capacity. Make job actions idempotent and use leases or a scheduler's distributed coordination when multiple replicas must not perform the same occurrence.

## Reliability, scaling, and observability

Treat shutdown as a deadline, not a guarantee of completion. The host can request graceful stop, but orchestration may terminate the process at a fixed deadline. Stop receiving new queue messages, cancel waiting operations, and finish or checkpoint bounded work. Durable acknowledgment/lease semantics must make interrupted work visible for retry. A worker's shutdown hook should not wait forever for a hung dependency.

Hosted services scale with the process. Scaling the web application also scales every worker, which can increase queue consumers or duplicate scheduled work unexpectedly. Sometimes this is desired; sometimes a dedicated worker deployment with independent replica count is simpler. Measure queue depth/age and consumer throughput before increasing replicas, and use broker/database limits to protect downstream systems.

Use structured logs with job or message IDs (not credentials), metrics for success/failure/retry rates, and tracing for work that spans services. Provide a last-success timestamp and backlog-age signal so health checks or alerts can detect a stuck worker. Avoid reporting process liveness as proof that the background job is making progress. Test service lifecycle with a real host, including start, cancellation, exceptions, and stop timeout.

In interviews, contrast `IHostedService` and `BackgroundService`, explain scoped DI inside a singleton worker, and describe how duplicate work is handled. The key distinction is that the host provides lifecycle coordination, not persistence, scheduling guarantees, distributed locking, or exactly-once processing.

## Practical review and interview checklist

Before deploying a hosted worker, verify the host exception policy for the target runtime, container termination grace period, and readiness behavior. Confirm that a queue consumer stops receiving before shutdown, does not acknowledge incomplete work, and can restart from durable state. Confirm scheduled work is not accidentally multiplied by replicas. Exercise a deployment while a long item is in flight and observe whether it finishes, retries, or is safely resumed.

For in-process work, bound any channel, batch, and parallelism. A bounded channel should have an intentional full mode: waiting can propagate backpressure to producers, while dropping items is appropriate only for disposable telemetry or latest-value updates. If enqueueing represents an accepted business command, persist it before returning success to the caller. A channel can decouple tasks within one process, but cannot provide durable acceptance.

Typical interview follow-ups ask what happens if `ExecuteAsync` throws, whether a `DbContext` can be injected directly, how stop cancellation works, or whether one worker runs per application. Answer with runtime-configurable exception behavior, per-operation scopes, cooperative deadlines, and one instance per process/replica. Add the crucial caveat that a host lifecycle does not guarantee job durability or exactly-once execution.

## Related Topics

- [Background services](./background-services.md)
- [Dependency injection](./dependency-injection.md)
- [Health checks](./health-checks.md)
- [Logging](./logging.md)
- [Message queues](../system-design/message-queues.md)