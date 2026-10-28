## What a hosted background service is

`IHostedService` participates in host startup and shutdown; `BackgroundService` is a convenient base class for a long-running asynchronous loop. It runs inside the web process, sharing its deployment, memory limits, and failure domain. It is useful for lightweight polling or in-process coordination, but it is not automatically a durable job queue: a restart can interrupt work, and multiple application replicas run multiple copies.

Use cancellation-aware waits and bounded work:

```csharp
public sealed class CleanupWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<CleanupWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(5));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var cleaner = scope.ServiceProvider.GetRequiredService<IExpiredDataCleaner>();
                await cleaner.RunAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Cleanup iteration failed");
            }
        }
    }
}
```

Register with `AddHostedService<CleanupWorker>()`. Hosted services are singleton-lived; create a DI scope for scoped dependencies such as a `DbContext`, and do not capture request-scoped services. Catch failures at the iteration boundary if later iterations should continue, but make retry/backoff and failure visibility explicit. Shutdown cancellation is cooperative; work must honor it and have a bounded completion expectation.

For jobs that must survive process loss, coordinate across replicas, require retries, or need scheduling/visibility, use durable storage and a worker/queue system. Ensure handlers are idempotent because retries and duplicate delivery are normal distributed-system conditions.

## Designing a safe worker loop

The worker's job is usually to coordinate a repeated unit of work, not to contain all business logic. Extract processing into an application service that can be invoked from a hosted worker and tested without starting the web host. A loop should have an explicit cadence, cancellation behavior, retry policy, and outcome telemetry. `PeriodicTimer` avoids accumulating overlapping timer callbacks, but it does not prevent work from taking longer than the interval: ticks are coalesced while the worker is busy. If that timing is unsuitable, model the schedule and backlog explicitly.

The sample's exception handling deliberately catches failures around one iteration. That prevents a transient failure from silently killing an otherwise useful poller, but a catch-all is safe only if the worker records the failure, applies bounded retry/backoff, and knows which errors are terminal. Retrying immediately can create a hot loop and overload a dependency. Cancellation during shutdown should propagate rather than be logged as an application failure. Pass the host token to database and network calls, and do not swallow `OperationCanceledException` unrelated to host shutdown unless the dependency's cancellation semantics are understood.

## Concurrency, replicas, and durability

Every application replica starts its own hosted service. A poller deployed on four replicas can therefore process the same scheduled work four times unless work claiming is coordinated. Options include leasing rows in durable storage, queue visibility/locking semantics, partitioning ownership, or a distributed scheduler. A simple in-memory boolean or `lock` coordinates only one process. Distributed locks also need lease renewal and crash handling; they are not a substitute for idempotent operations.

For queue consumers, agree on when a message is acknowledged. Acknowledge after the result is durable; if the process crashes after saving but before acknowledging, the message can be delivered again. Use idempotency keys, unique constraints, or transactional outbox/inbox patterns to prevent duplicate side effects. Keep concurrency and prefetch bounded by downstream capacity, and define poison-message handling and dead-letter retention. Never assume "exactly once" delivery from a broker alone.

Bound memory and work queues. Unbounded channels can turn a temporary downstream slowdown into process exhaustion. For in-process producer/consumer designs, use a bounded channel with an explicit full mode and cancellation policy; recognize that an in-memory channel loses pending work on process termination. Track queue age/depth, processing duration, retries, and failures, not just whether the worker process is alive.

## Startup, shutdown, and operability

A hosted service can participate in host startup and stopping, but lengthy initialization delays application readiness. Keep initialization bounded or expose readiness only after necessary setup. Graceful shutdown is best effort: the process may receive a termination deadline, be killed, or lose its machine. Stop accepting new work, finish or safely abandon in-flight work within the available window, and rely on durable leases/acknowledgments for recovery.

Do not use a worker loop as a replacement for a durable scheduler when jobs have contractual deadlines, need operator replay, or must continue while the web tier is redeployed. Consider deployment topology: a worker-only process can scale and restart independently from HTTP traffic. A practical interview answer should discuss duplicate delivery, cancellation, scope creation, backoff, visibility, and what happens when the process dies between side effect and acknowledgment—not merely how to derive from `BackgroundService`.

## Polling versus queue-driven work

Polling is appropriate when the source of work is naturally queried on a schedule, the work rate is low, and a small delay is acceptable. Choose an interval based on freshness and downstream capacity; polling too frequently wastes database and network resources, while polling too slowly increases work latency. Use an indexed query and bounded batch size, and use a durable checkpoint or lease so replicas do not repeatedly scan and claim the same unprocessed rows. Avoid sleeping with `Thread.Sleep`; asynchronous waits allow the worker to release its thread while idle.

A message queue is often a better fit when producers and consumers should scale independently or work must wait durably while a consumer is unavailable. Understand the broker's delivery and visibility semantics. A consumer should acknowledge only after processing has reached the durability point the business requires. If the operation spans a database and a broker, there is rarely a single atomic transaction; an outbox/inbox design can bridge the boundary. Retries need exponential backoff and jitter, a maximum attempt policy, and a dead-letter path for poison messages. Operators need a safe replay procedure.

## Concurrency and backpressure

Start with bounded sequential processing, then increase concurrency only after measuring the bottleneck. More concurrent tasks may increase throughput but also consume database connections, memory, CPU, and downstream quotas. Limit both the number of workers and the amount prefetched into memory. A queue of tasks is not backpressure if producers can enqueue without limit. When work cannot be accepted, the producer should block, reject, or persist elsewhere according to an explicit policy.

Avoid `async void` and unobserved fire-and-forget tasks. The host cannot await their completion or reliably observe their exceptions. If processing is parallel, keep track of every task and join/cancel them during shutdown. Each parallel operation that uses a `DbContext` needs its own appropriate scope/context; a single context is not safe for concurrent queries.

## Reliability and visibility checklist

For each job, identify the durable source of truth, claim/lease expiry, idempotency key, retry schedule, terminal failure behavior, and maximum processing time. Decide what happens if the worker crashes before a side effect, after it, and before acknowledgment. Make cleanup safe to repeat and avoid relying on process-local timers for contractual schedules. Use UTC for persisted schedules and account for clock skew when multiple machines coordinate.

Expose operational signals such as last successful poll, oldest pending item age, throughput, retries, dead-letter count, and cancellation/shutdown duration. A worker that is alive but permanently stuck is not healthy. Alert on service objectives (for example, backlog age) rather than every transient retry. Keep an operator runbook for paused queues, bad deployments, and replay so recovery does not require editing production data by hand.

Interview prompt: describe how a background consumer behaves if the process dies after saving a record but before acknowledging its message. A sound answer mentions redelivery, idempotency/unique constraints, and durable acknowledgment semantics—not a promise that a loop runs exactly once.

## Work boundaries and testability

Keep the worker adapter responsible for polling, receiving, and lifecycle coordination; put the business operation in a service with explicit inputs and outputs. That separation lets a unit test exercise idempotency and domain outcomes without timing-dependent sleeps. Use a controllable clock or scheduler abstraction for schedule logic, and test that cancellation is observed at waits and I/O boundaries. Host-level tests then verify registration, DI scopes, startup, and shutdown.

Make per-item status observable. A useful processing record may include a stable job ID, attempt number, start/end timestamps, and a safe failure category. Do not log full message bodies by default; they may contain personal data or credentials. Store enough durable information to diagnose/replay a failure under access control. If jobs have user-visible effects, record the operation's durable state before acknowledging the queue item so a client can query the result instead of relying on a transient log.

Be explicit about periodic work after restart. A `PeriodicTimer` starts its cadence when the loop is running; it does not persist the last run or calculate missed scheduled periods. If a cleanup must run once per UTC day, persist the completion boundary or use a durable scheduler. For a best-effort refresh that can wait five minutes after deployment, an in-memory timer is often entirely adequate. Match the complexity to the guarantee the business needs.

## Related Topics

- [Hosted services](./hosted-services.md)
- [Dependency injection](./dependency-injection.md)
- [Health checks](./health-checks.md)
- [Logging](./logging.md)
- [CancellationToken](../csharp/cancellationtoken.md)