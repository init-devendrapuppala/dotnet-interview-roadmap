## Goals and placement

Caching reduces repeated work and latency by keeping reusable data closer to the caller. First identify the expensive operation, reuse pattern, freshness requirement, and acceptable stale-data window. A cache is an optimization, not the authoritative store; the system must have a defined behavior on miss, eviction, and cache outage.

Common layers are browser/CDN, gateway, application memory, and a distributed cache such as Redis. Cache data at the layer that can safely share it. Per-process memory is fast but fragmented across instances; a shared cache improves reuse but introduces a network dependency.

## Cache-aside flow

```text
read(key):
  value = cache.get(key)
  if found: return value
  value = database.get(key)
  cache.set(key, value, ttl)
  return value
```

Cache-aside is easy to adopt, but concurrent misses can stampede the database. Mitigate with request coalescing, bounded jittered TTLs, stale-while-revalidate, or carefully controlled refresh-ahead. For writes, update the source of truth first and then invalidate/update the cache. A crash between those steps can leave stale data, so use short TTLs, versioned keys, or an outbox/event-driven invalidation when the freshness requirement justifies the complexity.

### Consistency model and invalidation choices

A cache cannot provide a stronger read guarantee than its invalidation design. Define the contract in user terms: for example, “catalog data can be stale for 60 seconds” or “a customer sees the newly submitted order in the command response, while the list projection can lag.” Do not describe a TTL as immediate consistency; expiry only limits how long a stored value can remain eligible for reuse.

For cache-aside writes, commit the authoritative store first. Then invalidate the key or publish a durable invalidation event. If the process fails after commit and before invalidation, readers can receive the previous cached value until expiry or recovery. Versioned keys avoid deleting a newly written value but create an explicit cleanup/capacity requirement. Write-through and write-behind designs change the failure boundary and need a durable queue or reconciliation plan; they are not automatic upgrades over cache-aside.

```text
authoritative write commits
        ↓
outbox records invalidation intent
        ↓
publisher invalidates/version-bumps cache key
        ↓
next read repopulates from authoritative data
```

### .NET implementation boundary

Serialize a stable DTO or value, not an EF tracked entity or mutable application object. Include schema/version information when cached values can survive deployment. For `IMemoryCache`, set size limits only after supplying sizes consistently; a size-limited cache ignores entries without a size when the configured cache requires one. For distributed cache entries, use a bounded timeout and failure policy so a cache outage does not exhaust request threads or overwhelm the origin.

Cache keys are security boundaries. A response varying by tenant, role, locale, feature flag, or authorization policy must include every relevant dimension in its key—or must not be shared. Test cross-tenant and permission scenarios alongside hit/miss behavior.

## Decisions and failure modes

- **Key design:** Include tenant, locale, permission scope, and data version when they affect results. Avoid unbounded cardinality and sensitive data in keys.
- **TTL:** Longer TTL improves hit rate but increases staleness. TTL is a safety bound, not a consistency protocol.
- **Negative caching:** Cache “not found” briefly where appropriate; do not turn transient errors into cached absence.
- **Eviction and capacity:** Size for working set, monitor hit ratio/evictions/memory, and use explicit limits. A low hit ratio may signal poor keys or low reuse.
- **Stampede and hot keys:** Add jitter and single-flight per key; partition or replicate exceptionally hot data.
- **Outage:** Decide whether to bypass cache, serve stale data, or shed load. Unbounded cache bypass can overload the database. Apply concurrency limits and fallback behavior.

In .NET, `IMemoryCache` is suitable for local, bounded data. Use a distributed cache abstraction such as `IDistributedCache` where multiple app instances need shared values; it intentionally offers basic operations, so advanced Redis semantics may require a client-specific abstraction. Set absolute or sliding expirations deliberately, use `CancellationToken`, and avoid caching mutable object references in memory. Cache only data whose authorization and invalidation semantics are understood.

## Interview framing

Quantify expected request rate, hit ratio, item size, freshness, and origin capacity. Estimate origin load as `request rate × (1 - hit ratio)`. Explain how deployments, data updates, and cache failures affect correctness—not just performance.

## Production test

Test expiry, invalidation races, cache outage, and authorization-key separation—not only hit behavior. A cache bug can be a data-isolation bug, so never share a key across tenants or permission scopes merely to improve hit rate.

## Related Topics

- [API Gateway](api-gateway.md)
- [Scalability](scalability.md)
- [Microservices](microservices.md)
- [Message Queues](message-queues.md)
