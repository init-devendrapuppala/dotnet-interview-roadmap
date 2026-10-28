## Why health endpoints need clear semantics

Health checks help orchestrators and operators decide whether an instance can receive traffic or whether a dependency is impaired. Separate **liveness** (is the process functioning enough to keep running?) from **readiness** (should this instance receive new work?). A database outage often makes an instance not ready, but restarting every process because liveness depends on the database can amplify an outage.

ASP.NET Core provides `AddHealthChecks` and `MapHealthChecks`:

```csharp
builder.Services.AddHealthChecks()
    .AddCheck<QueueHealthCheck>("queue", tags: new[] { "ready" });

var app = builder.Build();
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false
});
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});
```

The custom `QueueHealthCheck` should implement `IHealthCheck` and use bounded timeouts. Avoid checks that create significant load, leak exception details, or synchronously block request threads. Liveness may simply confirm the app can respond; readiness may include critical dependencies. Decide what “healthy” means per service and whether optional dependencies should make it degraded rather than unavailable.

Health endpoints can reveal topology and dependency status, so restrict detailed output and access as needed. Keep probes fast and deterministic, and account for startup warm-up and shutdown draining. Configure orchestration thresholds and grace periods to prevent transient failures from causing restart storms. Also use metrics, traces, and alerting: a green probe is not a full service-level health guarantee.

## Probe design and dependency policy

Liveness answers whether the process should keep running; readiness answers whether it should receive new requests. A deadlock or irrecoverable internal state may justify failing liveness. A temporarily unavailable database more often means readiness should fail while the application process remains alive, allowing the dependency to recover without a restart storm. Startup probes or readiness grace periods can prevent orchestration from judging a service before initialization completes.

For each dependency, decide if it is critical to serve any traffic, critical only for a subset of routes, or optional. A single global readiness check may be too blunt: an optional analytics store should not necessarily remove all API capacity. Keep checks bounded, use explicit timeouts, and avoid performing expensive full table scans or queuing side effects. If an external service is degraded, make the result and operational response clear rather than returning an unbounded wait.

Map endpoints separately for liveness and readiness, and make the response format and access policy explicit. Do not expose connection strings, SQL messages, internal addresses, credentials, or a full dependency graph to anonymous callers. Restrict detailed health output to trusted operators. Health probes themselves can be abused if they trigger expensive work; limit frequency and keep probes read-only.

## Integration with operations

Readiness should be wired into load balancer and deployment behavior: when an instance becomes unready, stop sending it new requests and allow existing work to drain. Liveness thresholds should include grace periods and avoid reacting to one transient scheduling pause. During shutdown, report unready before terminating if the platform supports that sequence. Validate the actual probe path and port in the deployed container, not only through a local `TestServer`.

Health checks complement, rather than replace, service-level objectives, metrics, logs, and traces. A dependency can respond to a simple probe while real user requests time out due to saturation. Alert on user-facing latency and error rates, and use health data as a diagnostic or routing signal with clear semantics.

## Related Topics

- [Hosted services](./hosted-services.md)
- [Logging](./logging.md)
- [Kestrel](./kestrel.md)
- [Rate limiting](./rate-limiting.md)
- [ECS](../aws/ecs.md)