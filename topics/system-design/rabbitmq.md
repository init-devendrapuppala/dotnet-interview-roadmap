## Model and use cases

RabbitMQ is a broker commonly used for task queues and routed messaging. Producers publish to exchanges; bindings route messages to queues; consumers receive and acknowledge them. Exchanges include direct, topic, fanout, and headers patterns. A durable queue plus persistent messages and publisher confirms improves survival across broker restarts, subject to the broker's replication and storage configuration.

```text
Producer -> exchange --binding--> queue -> consumer
                         \-------> queue -> consumer
```

Choose routing keys and queue topology from delivery needs. Competing consumers share a queue; separate queues provide independent subscriber copies. Queue ordering is not a substitute for a domain-wide ordering guarantee, especially with concurrent consumers and redelivery.

## Delivery and reliability

Use publisher confirms to learn whether the broker accepted a publish, and handle unroutable messages explicitly (mandatory publish/alternate exchange). A consumer should acknowledge only after durable work. If it crashes after a side effect and before ack, the message can be delivered again; use idempotency keys or deduplication.

Quorum queues can improve replicated durability but cost resources and have different operational constraints. Configure prefetch to bound in-flight work and prevent one consumer from monopolizing messages. Set message TTL, queue length limits, retry policy, and dead-letter exchange intentionally. Avoid immediate requeue loops; use delayed retry/backoff and alert on DLQ growth.

## Failure modes and scaling

Monitor queue depth and oldest-message age, publish/confirm latency, unacked deliveries, redeliveries, consumer utilization, disk/memory alarms, and cluster health. Queues can buffer bursts, but if production continuously exceeds consumption, backlog and latency grow until retention or capacity limits are reached. Scale consumers only within downstream capacity.

RabbitMQ is generally suited to routed work distribution and request/task messaging. It is not a replacement for a replayable, long-retention event log when consumers need to independently rewind history; compare Kafka for that pattern.

## .NET implementation

Use a maintained AMQP client, long-lived connections/channels where recommended by the client, and asynchronous APIs. Handle reconnects without duplicating uncontrolled publishers. Use a hosted consumer with graceful cancellation, bounded concurrency, explicit ack/nack policy, and telemetry. A database outbox is useful when a business transaction must reliably trigger a publish.

## Delivery contract

Document whether each queue is work distribution or event fan-out, who owns retry/DLQ replay, and the idempotency key. Broker acknowledgement is not confirmation that an application side effect happened exactly once.

## Topology and acknowledgement decisions

Name exchanges, routing keys, queues, retry queues, and dead-letter exchanges as part of a versioned contract. A consumer acknowledges only after its durable work succeeds. If it crashes after that work but before acknowledgement, RabbitMQ can redeliver; the consumer therefore stores or checks an idempotency key before repeating a non-idempotent effect.

Prefetch is a concurrency control, not a throughput magic number. Set it from handler latency, memory, and downstream capacity, then observe unacknowledged messages and oldest-message age. During shutdown, stop accepting new delivery, finish or requeue bounded in-flight work according to the handler's safety contract, and close channels after acknowledgements are settled.

## Related Topics

- [Message Queues](message-queues.md)
- [Kafka](kafka.md)
- [Distributed Transactions](distributed-transactions.md)
- [Saga Pattern](saga-pattern.md)
