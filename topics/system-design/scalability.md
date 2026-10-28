## Define the target

Scalability is the ability to handle growth in demand while meeting latency, availability, and cost goals. Start with workload shape: requests per second, read/write mix, payload size, concurrency, peak-to-average ratio, geographic distribution, and SLOs. “Scale to millions” is not a design requirement until translated into measurable capacity and latency.

## Scale-up and scale-out

- **Vertical scale:** Add CPU, memory, or I/O to one instance. Simple and often effective, but has hardware/service limits and a larger failure domain.
- **Horizontal scale:** Add stateless replicas behind a load balancer. Improves throughput and instance-level resilience, but shared databases, caches, and coordination may remain bottlenecks.

```text
Clients -> load balancer -> app replicas -> cache / database / queue
```

Make request-serving processes stateless where practical; store durable state in suitable data stores. Externalizing session state enables scale-out but adds latency and a dependency. Use autoscaling signals such as queue age, CPU, or concurrency with cooldowns and startup-aware thresholds; CPU alone can miss I/O saturation.

## Find the bottleneck before scaling

Measure end-to-end and per-dependency latency, throughput, errors, saturation, queue depth, database wait/lock time, and cache hit rate. Apply Little's Law (`concurrency ≈ throughput × latency`) to reason about in-flight work. Optimize query plans, indexes, payloads, and connection pooling before multiplying application instances against a constrained database.

Partitioning/sharding can expand storage and write capacity, but makes cross-partition queries, transactions, rebalancing, and hot-key handling harder. Replicas can scale reads but add replication lag and do not increase write capacity. Caching reduces repeated reads but introduces freshness and invalidation concerns.

Queues smooth bursts and decouple work, but sustained arrival rate above service rate creates an ever-growing backlog. Apply admission control, bounded queues, quotas, and load shedding. Use bulkheads to keep one slow dependency from consuming every request slot.

## .NET and cloud considerations

Use async I/O for network and database waits; async does not make CPU-bound work faster or eliminate capacity limits. Configure thread-pool, connection-pool, Kestrel, and downstream concurrency based on measurements. Container or instance autoscaling must account for warm-up, health checks, and graceful draining. Multi-region active-active increases availability potential but introduces data conflict and consistency decisions.

## Interview approach

Estimate traffic and storage, draw the request path, identify the first saturated component, and add capacity only where it addresses that bottleneck. Describe the behavior during overload, one-zone loss, cache outage, and a traffic spike. Include cost and operational complexity in the tradeoff.

## Capacity practice

Load test the whole request path, including connection pools and downstream quotas, and rehearse overload behavior. Scaling app replicas is ineffective when database locks, a hot partition, or a shared remote dependency is the saturated component.

## Related Topics

- [Load Balancer](load-balancer.md)
- [Caching](caching.md)
- [Message Queues](message-queues.md)
- [Microservices](microservices.md)
- [Monolith vs Microservices](monolith-vs-microservices.md)
