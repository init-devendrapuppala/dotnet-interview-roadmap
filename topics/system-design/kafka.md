## What Kafka provides

Kafka is a distributed append-only log organized into topics and partitions. Producers append records; consumers read at their own pace and track offsets. Partitions provide parallelism and ordering within a partition—not a total order across a topic.

```text
topic: orders
  partition 0: ... -> offset 41 -> offset 42
  partition 1: ... -> offset 18 -> offset 19
consumer group: partitions assigned among members
```

Choose a partition key that preserves required ordering, often an aggregate or tenant ID. A hot key limits parallelism. More partitions increase throughput potential but also affect broker metadata, file handles, rebalances, and operational cost.

## Delivery and processing

Consumers generally process at least once: they may commit an offset after work succeeds, but a crash between the side effect and offset commit can cause redelivery. Make effects idempotent with message IDs, unique constraints, or version checks. Commit offsets only after durable processing. “Exactly once” features cover constrained Kafka read/process/write paths; they do not automatically make arbitrary database or HTTP side effects exactly once.

Use consumer groups for competing parallel workers; each partition is assigned to one member in a group at a time. Rebalances temporarily interrupt work. Keep processing bounded, handle shutdown safely, and monitor lag and rebalance frequency. Define retention/compaction based on replay needs, data size, and privacy requirements.

## Reliability and operations

Set replication and minimum in-sync replica policies according to durability needs. Acknowledgment settings trade write latency against loss risk. Replication is not backup: accidental deletion or corruption may replicate. Plan capacity, broker and disk monitoring, quotas, schema compatibility, and disaster recovery.

Dead-lettering is not automatic: decide whether malformed or poison records block a partition, are quarantined, or can be skipped with an auditable record. Preserve ordering when retries occur; a retry topic can reorder events. Schema Registry or equivalent compatibility checks help coordinate producers and consumers.

## .NET usage

Use a maintained Kafka client and configure producer idempotence/acks deliberately. Avoid synchronous blocking in ASP.NET request paths. For database updates plus publish, use an outbox publisher rather than assuming a database transaction includes Kafka. Pass cancellation tokens, batch responsibly, and size producer/consumer concurrency to downstream capacity.

## When to choose Kafka

Kafka is strong for durable event streams, high-throughput fan-out, replay, and independent consumers. A traditional queue may be simpler for task dispatch with per-message acknowledgment, delay, and dead-letter workflows. Compare operational expertise and message semantics, not just benchmark throughput.

## Consumer design check

Commit an offset only after the intended durable effect, and make that effect idempotent by event ID/key. Track consumer lag by partition and age, not a single aggregate number; a hot partition can breach a user-facing freshness objective while total lag looks acceptable.

## Offset, ordering, and recovery

An offset is a consumer group's progress marker, not proof that every downstream side effect happened once. Commit after the durable local effect, or combine a local write with an idempotency record so a redelivery becomes a no-op. Committing first can lose work after a crash; committing after processing can repeat work. The design must choose repeatable processing and make it safe.

Ordering exists only inside a partition. Use an aggregate key when events for that aggregate must remain ordered, and design a hot-key strategy because one busy key cannot be processed in parallel without changing ordering semantics. Retention enables replay, but replaying an integration must not send duplicate external effects; separate projection/rebuild consumers from effectful consumers or make those effects idempotent.

## Related Topics

- [Message Queues](message-queues.md)
- [Distributed Transactions](distributed-transactions.md)
- [Event Sourcing](event-sourcing.md)
- [Scalability](scalability.md)
