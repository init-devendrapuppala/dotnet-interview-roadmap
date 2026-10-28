# Amazon SQS

Amazon Simple Queue Service (SQS) is a managed message queue that buffers work between producers and consumers. Queues decouple request intake from processing capacity: a web API can accept an order event quickly while workers process it independently, and backlog can absorb short bursts. The tradeoff is that work becomes asynchronous, observable state must be managed, and consumers must tolerate redelivery and delayed processing.

## Receive, process, and acknowledge

A consumer receives a message, making it temporarily invisible to other consumers for the visibility timeout. It performs the work and deletes the message to acknowledge successful processing. If the consumer crashes or does not delete before the timeout, the message can become visible again. Set the timeout to cover realistic processing time plus margin; for long tasks, extend visibility where supported or split the work into smaller operations. If the timeout is too short, concurrent duplicate processing can occur. If too long, recovery from a crashed worker is delayed.

Standard queues prioritize throughput and scale, with at-least-once delivery and best-effort ordering. Consumers must expect duplicates and out-of-order work. FIFO queues support ordering within message groups and deduplication features with throughput and integration constraints. A single message group can serialize that group’s processing and become a bottleneck. Select FIFO only when its ordering semantics are needed, then define group IDs that preserve the required sequence without unnecessarily serializing unrelated customers or entities. Queue deduplication does not guarantee exactly-once business side effects across a database and external API.

Queue retention is bounded and configurable; SQS is not an archival system. Configure a dead-letter queue (DLQ) and redrive policy for poison messages, then alarm on DLQ depth and age. Investigate before replaying: a failed message may contain invalid data or may repeat a side effect that partially succeeded. Preserve enough context to identify the failure while avoiding secrets in message bodies.

## Throughput and consumer design

Long polling reduces empty receives and request overhead. Batch receives and deletes improve efficiency, but each message can have a separate success outcome. Configure batch size, concurrency, and visibility timeout together. With Lambda event-source mappings or other managed consumers, understand their batching and partial failure semantics rather than assuming a failed record is isolated automatically.

Use the backlog as a buffer, not an excuse for unbounded delay. Monitor visible message count, age of oldest message, in-flight/not-visible messages, receive/delete rates, DLQ depth, and consumer processing latency. Queue length alone can be misleading: a deep but young backlog may be acceptable, while a small backlog of old work may breach an SLA. Autoscale consumers using backlog per worker, age, or measured processing rate, with a cap that protects downstream databases and APIs. Scale-out needs to be faster than backlog growth but should not overload the system of record.

Common failure patterns include visibility timeout expiry while work continues, a poison message retry loop, too many consumers exhausting database connections, messages expiring before processing, a producer emitting an incompatible schema, and deleting before durable work completes. Design a versioned message contract and a deployment strategy that allows producers and consumers to overlap safely. If a consumer calls a non-idempotent external system and then crashes before delete, redelivery can repeat the action. Use idempotency keys, unique constraints, conditional writes, or an outbox/inbox approach suitable for the transaction boundary.

## Security, .NET, and operations

Use IAM and queue resource policies to constrain producers and consumers, including source-account and source-ARN conditions where supported for service integrations. Encrypt queues where required and grant only necessary KMS key permissions. SQS API traffic uses TLS; do not include passwords, tokens, or unnecessary personal data in messages. Use private service endpoints when network requirements call for them, while verifying endpoint policies and DNS.

With the AWS SDK for .NET, use asynchronous receive, process, and delete operations with cancellation and bounded concurrency. Delete only after durable processing has succeeded. Ensure shutdown stops new receives, lets bounded in-flight work finish, and leaves incomplete messages undeleted. Align SDK request timeouts, application deadlines, visibility timeout, and host termination grace. Handle partial batch successes explicitly. Emit metrics for processing outcome and duration; log message IDs and correlation context without logging sensitive payloads.

For long-running workers, use a hosted service with controlled polling and backoff, or an ECS/EC2 deployment sized to workload. A Lambda event-source mapping can simplify polling but introduces its own concurrency, batch, and error semantics. Monitor consumer health and queue age, not just process liveness. Configure alarms with actionable DLQ/replay runbooks.

SQS cost is generally driven by request volume and payload-related usage, and polling strategy affects API calls. Long polling and batching can reduce empty/request overhead; large payloads need a design such as storing content in S3 and sending a reference. Evaluate delivery latency, retention, visibility, DLQ, and downstream capacity together. An interview-ready design explains why a queue is needed, how duplicates are handled, what the consumer acknowledges, how backlog is drained, and how poison messages are recovered.

## Related Topics

- [SNS](sns.md)
- [Lambda](lambda.md)
- [IAM](iam.md)
- [CloudWatch](cloudwatch.md)
- [S3](s3.md)