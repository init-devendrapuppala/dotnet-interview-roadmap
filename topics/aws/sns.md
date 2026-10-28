# Amazon SNS

Amazon Simple Notification Service (SNS) is a managed publish/subscribe messaging service. A publisher sends a message to a topic, and SNS fans it out to configured subscriptions such as SQS queues, Lambda functions, HTTP/S endpoints, email, or SMS where supported. The value is publisher/consumer decoupling: the producer need not know each consumer’s implementation or deployment schedule.

## Fan-out and delivery behavior

SNS is notification-oriented; it should not be treated as a durable work queue with independently controlled consumer polling. Standard topics provide high-throughput delivery with best-effort ordering and at-least-once characteristics, so a subscriber may see duplicates and should make side effects idempotent. FIFO topics provide ordering and deduplication features within their supported constraints, but have different throughput and integration considerations. Verify the supported subscription protocols and configuration for the exact workflow.

SNS-to-SQS is a common pattern when each consumer needs its own buffer, retry pace, visibility timeout, and dead-letter handling. Each queue subscription can independently absorb a traffic burst and process messages at its own rate. Use subscription filter policies to route only relevant messages when that reduces unnecessary work, but treat policy changes as production routing changes and test them. Keep event schemas explicit and versioned; pass a durable object reference instead of oversized payloads when appropriate.

## Security, reliability, and .NET

Use topic policies and IAM to constrain who may publish and subscribe. For SNS-to-SQS, ensure the queue resource policy allows only the intended topic to send, and avoid broad cross-account principals. Encrypt topics and queues as required, understanding KMS key permissions for publishers and subscribers. Do not put credentials or sensitive personal data into broadly fanned-out messages.

Configure delivery retries, subscription redrive/dead-letter behavior where supported, and a recovery process for failed deliveries. Delivery semantics vary by endpoint; monitor the relevant publish/delivery failures and queue DLQs rather than assuming a successful publish means every consumer completed its work. A subscriber can be unavailable or throttled after the publisher has succeeded. Use CloudWatch alarms and test replay procedures.

The AWS SDK for .NET can publish to a topic with a workload role. Consumers should validate message type and schema, handle duplicates, and keep handlers idempotent. For HTTP/S subscriptions, validate SNS message authenticity using AWS’s supported signing and certificate-verification process before taking action; do not trust a JSON body solely because it claims to be from SNS. Keep payloads small and log sanitized message identifiers rather than secret contents.

SNS pricing is based on publishing and delivery activity and varies by protocol and region. Fan-out can multiply downstream work and cost: estimate subscription count and traffic, and apply filtering or buffering where suitable. SNS simplifies distribution but does not guarantee application-level ordering, exactly-once side effects, or downstream capacity.

## Related Topics

- [SQS](sqs.md)
- [Lambda](lambda.md)
- [IAM](iam.md)
- [CloudWatch](cloudwatch.md)