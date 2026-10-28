# Debugging Scenario Preparation for .NET Developers

Debugging rounds evaluate how you reduce uncertainty, protect users, and communicate—not how quickly you guess a root cause. For a mid-level engineer, show a repeatable investigation that moves from symptoms to evidence, safe mitigation, and prevention.

## Investigation framework

1. **Clarify impact:** What is failing, for whom, since when, and how often? Is there data loss, a security concern, or a service-level objective at risk?
2. **Bound the change:** Compare recent deploys, configuration changes, dependency health, traffic patterns, and affected versions. Check whether the issue is isolated or systemic.
3. **Form a testable hypothesis:** Use logs, metrics, traces, dumps, and a minimal reproduction as appropriate. Change one variable at a time.
4. **Mitigate safely:** Prefer reversible action with a clear owner and rollback plan. Preserve evidence and communicate status. Do not conceal symptoms by suppressing errors or blindly restarting repeatedly.
5. **Find the cause:** Follow the failing request through application, runtime, network, and data boundaries. Distinguish a trigger from the underlying defect.
6. **Prevent recurrence:** Add a regression test, telemetry, alert, operational runbook, or design change. Confirm the fix in a representative environment.

State what evidence would disprove your current hypothesis. If a necessary tool or permission is unavailable, say what you would request rather than inventing results.

## Practice scenarios

### API latency increased after a release

**Prompt:** A .NET Web API's p95 latency doubled after deployment, while average latency changed only slightly.

Start by confirming the time window, endpoints, traffic, and error rate. Compare release and runtime metrics, then inspect traces for slow dependencies and database query duration. A long tail can point to a subset of slow requests, pool waits, lock contention, oversized payloads, or a downstream timeout; these are hypotheses, not conclusions. Check whether EF Core query shape or an N+1 pattern changed, using query/trace evidence before rewriting code.

**Good evaluation signals:** Separates percentile behavior from averages, identifies safe rollback or traffic mitigation, and plans to verify user impact after action.

### Intermittent `ObjectDisposedException`

**Prompt:** A background operation occasionally accesses an object after a request has completed.

Ask what object is disposed and which lifetime owns it. Trace task creation, cancellation, and DI scope boundaries. A common pattern to investigate is fire-and-forget work capturing a request-scoped service such as `DbContext`; hosted/background work should have an explicit lifetime and create an appropriate scope. Reproduce with tests or instrumentation, then ensure shutdown and failures are observed rather than silently lost.

**Good evaluation signals:** Does not recommend simply extending every service lifetime; understands scoped lifetime and async task ownership.

### Memory or CPU grows over time

**Prompt:** A worker's memory rises over several hours, or CPU spikes after traffic peaks.

First distinguish managed heap growth from native memory and determine whether usage returns after load subsides. Use runtime counters and a suitable profiler/dump comparison to inspect allocation rate, GC behavior, retained object graphs, and hot paths. Look for unbounded caches/queues, event subscriptions, large buffers, or accidental repeated work. For CPU, sample before optimizing. Validate a targeted change under representative load; do not assert “a leak” from a single memory snapshot.

### Intermittent database failures

**Prompt:** Requests sometimes time out during a busy period.

Correlate application traces, connection-pool metrics, database wait/slow-query evidence, and timeout types. Determine whether the wait is acquiring a connection, executing a query, or waiting on a lock. Check for long-lived `DbContext` use, sync-over-async, unbounded parallel queries, and missing cancellation. Retrying transient failures can help only when the operation is safe to retry and backoff is bounded; retries can worsen overload.

## .NET evidence checklist

- Structured logs include correlation/request identifiers but avoid secrets and sensitive payloads.
- Metrics describe rates, errors, duration percentiles, queue depth, and resource saturation.
- Distributed traces connect inbound requests to outgoing HTTP and data calls.
- Health checks indicate meaningful dependency readiness without turning every transient failure into a restart loop.
- Exception handling preserves the original context and does not convert failure into false success.

## Evaluation criteria

Look for a clear sequence, impact awareness, evidence-driven hypotheses, safe mitigation, understanding of asynchronous and resource lifetimes, and a testable prevention plan. Strong candidates communicate uncertainty precisely: “I would check X because it distinguishes A from B,” rather than claiming a root cause before evidence.

## Related Topics

- [Coding questions](coding-questions.md)
- [Behavioral questions](behavioral-questions.md)
- [ASP.NET Core logging](../aspnet-core/logging.md)
- [ASP.NET Core global error handling](../aspnet-core/global-error-handling.md)
- [EF Core query performance](../entity-framework/query-performance.md)
- [C# async and await](../csharp/async-await.md)