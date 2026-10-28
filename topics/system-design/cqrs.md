## What CQRS means

Command Query Responsibility Segregation separates operations that change state (commands) from operations that read state (queries). It does not require separate services, databases, or event sourcing. In a simple application, separate handlers and models within one deployment can clarify validation and intent without adding distributed-system complexity.

```text
Command -> validate / authorize -> write model -> transaction
                                         |
                                      event/outbox
                                         v
Query   <- read model / projection <- asynchronous handler
```

## When it helps

Consider CQRS when write rules are complex, read shapes differ substantially from the normalized write model, read traffic needs independent scaling, or a projection can make expensive queries predictable. It is less attractive for ordinary CRUD with modest load: two models and synchronization paths increase code, operations, and failure modes.

## Consistency and reliability

If query projections update asynchronously, users may briefly read stale data. Set and communicate a freshness objective; support read-your-writes where needed (for example, return the command result, query the primary briefly, or wait for a projection version). Do not promise strong consistency from an eventually consistent projection.

For reliable updates, commit the write and an outbox record in the same database transaction. A background publisher delivers the event at least once; consumers must be idempotent. Projection handlers should tolerate duplicates, reordering where possible, and replay. Track lag, failed messages, and projection checkpoints. Rebuild projections from a durable event/log source or source-of-truth data, with a plan for schema evolution.

Separate read and write stores only when the operational benefits justify replication lag, data duplication, backup/recovery complexity, and extra deployment dependencies. Define how read-model rebuilds avoid serving partial results—such as building a new version and switching aliases atomically.

## Projection lifecycle and read-your-writes

Every projection needs an identity, checkpoint, input contract, and rebuild procedure. Persist enough progress to resume after a crash, make each update idempotent, and publish lag as a first-class metric. A projection that uses an event ID or monotonic source position can ignore a duplicate safely; it still needs a documented strategy for reordering when the transport does not guarantee the order its business rule needs.

Read-your-writes is separate from eventual consistency. A command endpoint can return the changed representation, a client can poll a command status/version, or selected reads can temporarily read the write store. Pick one contract and state its latency boundary.

```text
command accepted -> durable write version 42
                    ↓ outbox/event
projection checkpoint advances to 42
                    ↓
read model can serve version 42
```

## .NET design

Handlers can be organized with application-layer interfaces (often mediated through a dispatcher), but a mediator library is optional. Commands should carry intent and authorization context; queries should avoid hidden mutation. Keep transactions at an explicit boundary, use optimistic concurrency for conflicting updates, and propagate cancellation. A command handler should not publish directly to a broker before committing its database transaction.

## Interview discussion

Clarify whether CQRS is a code organization pattern or a physically distributed architecture in the proposed design. Estimate read/write ratio, query complexity, staleness tolerance, and recovery needs before choosing separate stores. Explain what happens when the projector is down and how operators catch it up safely.

## Decision test

Do not split stores because reads and writes have different class names. Adopt asynchronous projections only when their read shape, scale, or isolation benefit exceeds the cost of lag monitoring, replay, schema evolution, and support for stale reads.

## Related Topics

- [Event Sourcing](event-sourcing.md)
- [Distributed Transactions](distributed-transactions.md)
- [Message Queues](message-queues.md)
- [Microservices](microservices.md)
