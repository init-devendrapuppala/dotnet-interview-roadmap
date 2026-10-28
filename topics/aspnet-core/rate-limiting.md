## Why limit requests

Rate limiting protects capacity and reduces noisy-neighbor impact; it is not a replacement for authentication, authorization, input validation, or upstream abuse controls. ASP.NET Core provides rate-limiting middleware with fixed-window, sliding-window, token-bucket, and concurrency limiters. Choose based on whether the constraint is request volume over time or simultaneous in-flight work.

```csharp
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("public", limiter =>
    {
        limiter.PermitLimit = 100;
        limiter.Window = TimeSpan.FromMinutes(1);
        limiter.QueueLimit = 0;
    });
});

var app = builder.Build();
app.UseRateLimiter();
app.MapGet("/catalog", () => Results.Ok())
   .RequireRateLimiting("public");
```

In endpoint-routing applications, place the middleware after routing when endpoint-specific policies need endpoint metadata. If partitioning by user, tenant, or API key, derive the key only from authenticated/trusted identity and bound the number of partitions; client-controlled arbitrary keys can exhaust memory. Per-process limits multiply across replicas, so they do not enforce a global quota unless coordinated through a shared system or gateway.

Return a useful 429 response and, where appropriate, a retry hint. Decide whether excess requests queue or fail fast; queues consume memory and increase tail latency. Apply separate limits to expensive operations, login attempts, and bulk endpoints. Rate limiting does not prevent distributed denial of service at the network edge, and should complement gateway/WAF controls.

Measure rejections, queue depth, latency, and resource utilization. Load-test policies with realistic bursts and replica counts. A concurrency limiter is often more relevant than requests-per-minute for long-running or resource-heavy operations.

## Choosing a limiter and partition key

A fixed window is easy to understand and cheap, but permits a burst near the window boundary. A sliding window smooths that boundary by accounting for recent subwindows. A token bucket allows configured bursts while replenishing at a steady rate. A concurrency limiter caps simultaneous work and is often useful when each operation consumes a connection, CPU, or downstream slot for a variable duration. Select the algorithm based on the resource being protected, then validate behavior with burst and sustained-load tests.

Partitioning lets one client or tenant have an independent budget. Use a stable key from authenticated identity or a validated API credential; IP-based partitioning can be affected by NAT, proxies, and spoofed forwarded headers. Anonymous partitions need safe fallback behavior and a bounded cardinality. A new arbitrary partition per request can exhaust memory. Per-process limiters are not global quotas: with N replicas, aggregate allowance can be close to N times the configured limit.

## Placement, responses, and operations

Register named policies in DI, then apply middleware after routing if endpoint-specific metadata is used. Verify the framework version's ordering requirements, especially with automatic minimal-host middleware. Decide how partition rejection is represented and return a clear 429 with a retry value only when meaningful. Queuing may smooth short bursts, but queued requests consume memory and increase tail latency; keep the queue bounded and avoid it for expensive or interactive operations.

Apply different budgets to different resource classes: login attempts, expensive reports, upload endpoints, and general reads have different cost profiles. Rate limiting does not protect network bandwidth before the app, nor does it fully solve distributed denial of service; combine it with gateway/WAF and infrastructure protections. It is also not authorization: a client that stays under its limit may still lack permission to call the route.

Monitor permit/rejection counts, queue depth, latency, and downstream saturation. Tune thresholds using service capacity and customer needs rather than copying a generic "requests per minute" number. Integration tests should cover the selected policy, partition identity, authenticated and anonymous behavior, and expected rejection response. Load tests should account for replica count and autoscaling, since scaling out can change a local per-instance budget.

At interviews, distinguish throughput from concurrency limits and explain why a local in-memory limiter cannot enforce a global quota across servers.

## Related Topics

- [Caching](./caching.md)
- [Authentication](./authentication.md)
- [Kestrel](./kestrel.md)
- [Web APIs](./web-api.md)
- [API gateway](../system-design/api-gateway.md)