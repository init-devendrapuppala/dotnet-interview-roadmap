## The problem

A distributed transaction coordinates changes across independently committed resources, such as a service database and a broker or two service-owned databases. A local ACID transaction cannot atomically cover arbitrary remote systems. Network timeouts also make the outcome ambiguous: the remote side may have committed even if the caller did not receive confirmation.

## Prefer reducing the atomic boundary

First ask whether the operation can be made local by owning related data together, or whether the business can tolerate eventual consistency. Do not reach for two-phase commit before clarifying the invariant and recovery requirement.

For a database-plus-message-broker write, use the **transactional outbox**:

```text
BEGIN DB TRANSACTION
  update business row
  insert outbox row
COMMIT
      |
      v
publisher -> broker -> idempotent consumer
```

The application commits state and intent together; a background worker publishes pending outbox records and marks them sent. Delivery is generally at least once, so consumers deduplicate using a stable message/event ID and make effects idempotent. Use bounded batches, leases or row locking, retries with backoff, dead-letter handling, and monitoring of oldest pending age. Ordering may require partitioning by aggregate key.

For a multi-service business workflow, a saga coordinates local transactions with forward actions and compensations. A compensation is a new business action, not necessarily a perfect rollback: a refund may reverse a charge financially but cannot erase that it occurred. Make steps and compensation idempotent; persist workflow state and define timeouts, operator intervention, and terminal failure handling.

## Outbox delivery protocol

The outbox table is part of the local transaction, not an in-memory list. Give each record a stable ID, aggregate/key for ordering, payload/schema version, creation time, attempt metadata, and completion state. A publisher claims a bounded batch with provider-supported locking or a lease, publishes, and records completion. A crash after publish but before completion produces a duplicate; that is why consumers must deduplicate durable effects by message ID rather than trusting broker delivery count.

Monitor the oldest unpublished outbox record, failure count, publish latency, and backlog. A dead-letter record needs a replay/reconciliation procedure, not only storage. Ordering requirements must be explicit: preserving per-order ordering can be achieved with a partition key or serialized publisher path, while global ordering would sharply reduce parallelism.

## Two-phase commit and tradeoffs

2PC can provide atomic commit when all participants support a compatible coordinator/protocol, but it holds resources while prepared, increases latency, and can block during coordinator failures. It is often unsuitable across independently operated cloud services or public APIs. Use it only when strict atomicity is necessary and the participant set, operations, and failure recovery are controlled.

## .NET implementation notes

Use EF Core transactions for the local database boundary, not as if they enlist arbitrary HTTP calls. Persist outbox data in the same database transaction; publish outside it. A hosted service can poll, but ensure multiple instances coordinate safely and shutdown/cancellation does not lose ownership. Add unique constraints for idempotency keys and use optimistic concurrency tokens for state transitions.

## Interview checklist

State the invariant, consistency window, duplicate behavior, retry policy, and reconciliation process. Describe what happens when the caller times out after a remote commit, when a consumer is offline, and when compensation itself fails.

## Recovery is part of correctness

An outbox needs a reconciliation path: identify unprocessed records, safely retry publication, and audit duplicate consumer effects. Explain this operational loop in interviews; "at least once" without idempotent handling is not a completed design.

## Related Topics

- [Saga Pattern](saga-pattern.md)
- [Message Queues](message-queues.md)
- [Event Sourcing](event-sourcing.md)
- [CQRS](cqrs.md)
