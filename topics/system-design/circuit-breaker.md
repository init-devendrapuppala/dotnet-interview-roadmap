## Purpose

A circuit breaker prevents repeated calls to a dependency that is failing or too slow. It gives the dependency time to recover and protects callers from spending resources on calls unlikely to succeed. It complements, rather than replaces, timeouts, bulkheads, and load shedding.

## States and behavior

```text
Closed --failure threshold--> Open --cooldown--> Half-open
   ^                                              |
   +---------------- successful probe ------------+
                    failures -> Open
```

In **closed**, calls pass through and outcomes are measured. In **open**, calls fail fast or use a defined fallback. In **half-open**, a small number of probes test recovery. A breaker should be scoped to the dependency and operation whose behavior is being measured; one global breaker can couple unrelated traffic.

## Configuration and tradeoffs

Choose thresholds from observed latency and error rates, not arbitrary defaults. A rolling window may use failure ratio, minimum throughput, and slow-call duration. A brief single error should not necessarily open a high-volume circuit, while a low-volume operation may need a different policy. Account for the duration of a request and the service's recovery characteristics when choosing the open interval and probe concurrency.

An open breaker rejects work but does not restore service. Define fallback semantics explicitly: cached/stale response, degraded feature, queued command, or clear error. Do not return fabricated success for writes. Avoid retries inside half-open probes and avoid layering retries at multiple levels, which can multiply traffic.

## .NET implementation

In ASP.NET Core, use a resilience pipeline (for example, .NET resilience handlers/Polly) around outbound `HttpClient` calls. Set an overall timeout, propagate cancellation, and use bounded concurrency. Order policies intentionally: timeout, retry for eligible idempotent operations, circuit breaker, and bulkhead behavior must have understood interaction. Respect `Retry-After` where relevant and add jitter to backoff. Register clients through `IHttpClientFactory`; do not create an unbounded new client per request.

Breakers are usually process-local. Across replicas, their observations can differ; this is often acceptable and avoids a central coordination bottleneck. If a system needs global admission control, treat it as a separate distributed rate-limit or load-shedding problem.

## Failure modes and observability

Monitor state transitions, rejected calls, dependency latency, timeouts, and fallback use. A breaker that flaps may have thresholds or cooldowns poorly matched to the traffic. A breaker that never opens may be attached to the wrong exception types. Do not count caller cancellation as dependency failure. Ensure open-circuit behavior remains bounded and does not create retry loops at callers.

## Design review

Set the caller deadline, dependency timeout, retry budget, and fallback before selecting breaker thresholds. The breaker is successful when it keeps the caller healthy during dependency failure, even though it intentionally rejects some requests.

## Related Topics

- [Retry Pattern](retry-pattern.md)
- [API Gateway](api-gateway.md)
- [Message Queues](message-queues.md)
- [Scalability](scalability.md)
