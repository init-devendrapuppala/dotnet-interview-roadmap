## Why use a queue

A queue decouples a producer from a consumer in time and capacity. It absorbs bursts, supports asynchronous work, and can retry transient failures. It does not remove work or guarantee success: queue depth and age can grow without bound if consumer capacity is below arrival rate.

```text
API -> durable queue -> workers -> database / external API
          |                 |
      backlog/retention   retries / DLQ
```

## Semantics to specify

Distinguish a work queue (one competing consumer should handle a message) from pub/sub (multiple subscribers each need a copy). Clarify delivery guarantees, ordering scope, acknowledgment behavior, visibility/lease timeout, retention, maximum message size, and dead-letter behavior. Most systems provide at-least-once delivery; consumers must be idempotent.

Use a stable operation or message ID. For a database effect, record the ID with a uniqueness constraint in the same transaction as the effect. Acknowledge only after durable processing. If the worker crashes after the side effect but before acknowledgment, redelivery is expected. For external side effects, use the provider's idempotency key if available or maintain a durable workflow state.

## Capacity and failure handling

Estimate arrival rate, processing time, and concurrency. Workers can process faster by scaling out only until a downstream resource saturates. Apply bounded concurrency and queue quotas; monitor oldest message age, depth, retry rate, and DLQ. A rising age often matters more than raw depth.

Use exponential backoff with jitter for transient failures; do not instantly requeue poison messages. Set a retry limit and quarantine/dead-letter after it, with alerting and a replay procedure. Avoid infinite retry loops. A delayed queue or scheduler may be better for future work.

Ordering constrains parallelism. Partition or session messages by key if per-entity order is required, and design recovery so one poison message does not block unrelated work. Messages should carry durable identifiers and schema versions, not secrets or fragile in-memory references.

## .NET implementation

Use a hosted worker (`BackgroundService`) with cancellation, graceful shutdown, bounded prefetch, and explicit exception handling. Separate transport DTOs from domain models and validate message versions. Use an outbox to atomically persist intent with a database update; the publisher may send duplicates, so consumers still need idempotency.

## Choosing a broker

Compare operational fit and required semantics: cloud queue services often simplify task dispatch and DLQ, while Kafka is a durable partitioned log suited to replay and high-throughput fan-out. Broker choice should follow ordering, retention, replay, throughput, latency, and operational requirements—not popularity.

## Capacity reasoning

Queue depth alone is not a capacity target. Compare arrival rate with successful service rate and watch oldest-message age. When load is sustained above capacity, decide which work to reject, defer, or shed; a queue only postpones that decision.

## Related Topics

- [Kafka](kafka.md)
- [RabbitMQ](rabbitmq.md)
- [Distributed Transactions](distributed-transactions.md)
- [Saga Pattern](saga-pattern.md)
- [Scalability](scalability.md)
