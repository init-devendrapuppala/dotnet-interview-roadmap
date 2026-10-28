# Amazon ElastiCache

Amazon ElastiCache is a managed service for in-memory data stores, including Valkey, Redis OSS, and Memcached options depending on engine availability and configuration. It is used to reduce repeated work or provide fast ephemeral state—for example, caching database reads, storing short-lived sessions, maintaining counters, or coordinating limited distributed state. Its purpose is performance and offload, not replacing a durable system of record. A design should remain correct if cached data expires, is evicted, or becomes temporarily unavailable.

## Engine choice and data patterns

Choose an engine based on command/data-structure requirements, client compatibility, persistence and replication options, topology, and operational constraints. Memcached is a relatively simple distributed cache for key/value objects and does not provide the same data structures or replication model as Redis-compatible engines. Valkey/Redis-compatible deployments support richer operations, but using them as a database or coordination primitive requires careful analysis of persistence, failover, consistency, and data-loss behavior for the selected configuration.

Cache-aside is a common application pattern: read the cache, query the database on a miss, then populate the cache with a bounded TTL. It reduces load when a key is reused, but the application owns cache population, invalidation, and behavior on errors. Write-through or explicit invalidation can reduce stale windows in some designs but add coupling and failure paths. Define what stale value is acceptable, how keys are versioned, and how cache entries are invalidated after changes. TTLs should reflect the data’s freshness needs; a very long TTL makes stale data harder to reason about, while a very short TTL can eliminate hit-rate benefits.

Prevent stampedes when a popular key expires: many concurrent requests may all query the backing database. Techniques include request coalescing, jittered expiration, serving stale data where safe, and bounded refresh. Protect the database with connection limits, bulkheads, and timeouts because a cache outage can shift load suddenly to the source of truth. Do not cache authorization decisions or sensitive user data without considering isolation, key construction, expiration, and access controls.

## Topology, availability, and scaling

Deployment choices such as replication, Multi-AZ failover, cluster mode, shards, and node families affect throughput, write behavior, memory, recovery, and client routing. Understand which endpoint is appropriate for writes and reads and how clients react to topology changes and failover. Failover can interrupt connections and may involve data-loss or replication-lag tradeoffs; do not assume it is transparent or instantaneous. Test reconnection and retry behavior with the exact engine and client version. Horizontal scaling or resharding may require a client that understands the cluster topology and key-slot behavior.

Memory is the principal capacity constraint, but CPU, network, connection count, request size, and hot-key concentration also matter. Track hit/miss behavior and application latency in addition to infrastructure utilization. Evictions indicate that memory policy and working set do not fit as expected; they may be harmless for disposable cache entries or serious for state the application incorrectly assumes is durable. Unbounded keys, large values, and uneven partitions can make average metrics misleading.

## Security and operations

Place cache resources in private subnets and restrict inbound access to application security groups. Enable encryption in transit and at rest and configure authentication/authorization controls supported by the selected engine and service mode. Require TLS in the client when enabled. Manage credentials through a secret store and rotate them with an application refresh plan. Network isolation is important, but not a substitute for identity and encryption controls. Choose maintenance windows, parameter groups, engine upgrades, snapshots, and backup settings based on the workload’s recovery requirements; caches may not need the same retention as primary databases, but any cache used for durable data must be re-evaluated architecturally.

Monitor memory usage, evictions, CPU, network, connections, hit ratio, replication lag, and failover events alongside application-level cache latency and fallback rate. A healthy node metric does not ensure the application’s client is using the correct endpoint or that the cache is reducing database load. Set alerts on trends that require action and create dashboards for cache hit behavior during traffic peaks. Review parameter changes and version upgrades in a nonproduction environment, as engine defaults and supported commands vary.

## .NET integration and failure behavior

Use a maintained .NET client compatible with the selected engine, TLS/authentication configuration, and topology. Reuse connection multiplexer/client objects as recommended by that library rather than opening a new network connection per request. Set connection, command, and operation timeouts; keep them below the caller’s overall deadline and avoid retry loops that multiply pressure during a failover. Handle transient errors with bounded retries and jitter, and decide whether each call should fail open to the backing data store or fail closed. Fail-open behavior is only safe if the source can withstand the increased load and the cache does not enforce a security boundary.

Test concurrent cold starts, node replacement, DNS changes, network interruption, large values, and hot keys. Measure the .NET application’s fallback concurrency and database connection pool under cache failure. A circuit breaker or bulkhead can limit cascading pressure, but a circuit breaker should not permanently mask recovery; define probe and reset behavior. Do not swallow cache errors silently—emit bounded-cardinality metrics for hit, miss, timeout, and error categories without placing keys or sensitive values in telemetry.

ElastiCache cost includes node capacity, backups/snapshots where configured, transfer, and operational overhead. Right-size using the actual working set and headroom for failover/rebalancing. A cache only improves the system if it reduces expensive work enough to justify the extra service, consistency model, and failure handling. Interview answers should explain which data is safe to cache, its freshness contract, how stampedes are prevented, and what happens when the cache disappears.

## Related Topics

- [RDS](rds.md)
- [VPC](vpc.md)
- [CloudWatch](cloudwatch.md)
- [IAM](iam.md)