## Why caching is a correctness decision

Caching reduces repeated computation or I/O, but a cached value is only useful if its freshness and scope are acceptable. First identify what is expensive, who may see the value, and how invalidation works. Never let a shared cache accidentally mix tenant- or user-specific results.

ASP.NET Core offers several distinct layers:

- **Response caching** follows HTTP cache headers and is primarily useful when clients or intermediaries can reuse a response.
- **Output caching** stores server-generated endpoint responses under configured policies and supports server-side invalidation/tagging; it is available in modern ASP.NET Core versions.
- **`IMemoryCache`** is process-local and fast, but each replica has a separate cache and entries disappear on restart.
- **`IDistributedCache`** provides a shared byte-oriented abstraction (often backed by Redis or SQL); serialization, expiration, and stampede control remain application concerns.

Example of basic memory caching:

```csharp
public sealed class CatalogService(IMemoryCache cache, CatalogRepository repository)
{
    public Task<CatalogItem?> GetAsync(int id, CancellationToken cancellationToken) =>
        cache.GetOrCreateAsync($"catalog:{id}", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2);
            return await repository.FindAsync(id, cancellationToken);
        });
}
```

Production code should account for concurrent cache misses, bounded memory, error behavior when the cache is unavailable, and invalidation after writes. A short TTL can limit stale duration but is not transactional consistency. Cache keys should include every dimension affecting the result and avoid embedding sensitive data. For HTTP responses, set `Cache-Control` carefully; `private` and `no-store` matter for personalized or sensitive output.

Measure hit rate, latency, and backend load before and after adding a cache. Caching can move load rather than remove it, and an unbounded or synchronized expiration can create memory pressure or a thundering herd.

## Cache keys, expiration, and invalidation

A cache key is part of the correctness boundary. Include every input that changes the result: tenant, locale, permission scope, query filters, and representation version where applicable. Normalize key formats and avoid storing raw secrets or personal data in keys, because cache keys often appear in diagnostics. A missing dimension can return one user's or tenant's data to another. Hashing a key does not fix a bad isolation model.

Expiration is a bound on staleness, not a complete invalidation strategy. Absolute expiration limits total lifetime; sliding expiration extends a hot entry and can keep it alive indefinitely unless combined with an absolute bound. Invalidation on writes is more current but introduces ordering and failure questions: what if the database commit succeeds and cache deletion fails? A common safe direction is to commit durable state first and invalidate afterward, with a plan for eventual repair. Versioned keys or short TTLs can reduce dependence on perfect invalidation.

Prevent cache stampedes when a popular key expires. `GetOrCreateAsync` alone should not be assumed to provide single-flight protection for every concurrent miss. Consider a per-key lock, request coalescing, stale-while-revalidate, randomized expirations, or a distributed coordination mechanism appropriate to the latency and availability requirements. Locks can themselves become a bottleneck or failure point, so measure before adding complexity.

## Picking the right layer

HTTP response caching is governed by cacheability semantics such as `Cache-Control`, validators, and `Vary`; it can allow browsers and proxies to avoid a request or reuse a response. Output caching is server-side endpoint response reuse controlled by ASP.NET Core policies, useful even where a client cannot cache. Application data caching stores a domain or query result and leaves serialization and HTTP behavior to the endpoint. These layers can coexist, but double-caching complicates invalidation and freshness. Set cache headers carefully for personalized responses; `private` prevents shared intermediaries from caching, while `no-store` is appropriate when storage is not acceptable.

Memory caches are local to a process. They are simple and resilient to a network dependency but each replica has a separate view, and memory pressure needs limits. A distributed cache shares values across instances but adds network latency, serialization, availability, and operational dependency. Cache failures should have an intentional policy: bypass to the source if it can absorb the load, or fail fast if cache availability is essential. Avoid turning a Redis outage into a database overload storm.

Monitor hit/miss rates, entry count and size, eviction, backend latency, and source-system load. Load-test cold start and simultaneous expiration, not only warm-cache steady state. A useful interview response starts with consistency and data isolation, then identifies the layer and invalidation approach, rather than saying simply that caching makes APIs faster.

## Related Topics

- [Rate limiting](./rate-limiting.md)
- [Configuration](./configuration.md)
- [Logging](./logging.md)
- [Caching patterns](../system-design/caching.md)
- [Web APIs](./web-api.md)