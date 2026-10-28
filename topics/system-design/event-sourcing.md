## Core idea

Event sourcing stores an append-only sequence of domain events as the authoritative history of an aggregate. Current state is derived by replaying events; snapshots may reduce replay cost but are rebuildable optimizations.

```text
command -> load state/version -> decide -> append event(s)
                                      |
                                      +-> projections / integrations
```

Events describe facts that happened (`OrderPlaced`), not commands (`PlaceOrder`) or mutable database rows. Include stable identifiers, aggregate ID, sequence/version, timestamp, and schema version where useful.

## When it is worth the cost

It can help when audit history, temporal reconstruction, domain traceability, or multiple independently useful projections are core requirements. It is not a default replacement for CRUD. Event design, replay, projection maintenance, schema evolution, and operational tooling are substantial long-term commitments.

## Consistency and concurrency

Append events with an expected aggregate version (optimistic concurrency). If another command has advanced the version, reload and re-evaluate rather than blindly retrying stale decisions. Event append is the aggregate's consistency boundary; do not split one invariant across unrelated streams.

Projections commonly update asynchronously, so reads may lag. Expose that contract and use version/checkpoint tracking for read-your-writes needs. Consumers must handle duplicate delivery and recover from poison events. Replaying a projection must not repeat external side effects; isolate integrations via an outbox or a separate idempotent processor.

## Evolution and privacy

Persisted events outlive application deployments. Prefer additive changes, explicit event versions, upcasters, or new event types; test old event fixtures against new code. Renaming a property can break historical deserialization. Deleting a user's data can conflict with immutable history and legal requirements—design privacy, retention, encryption/key destruction, and redaction before adopting the model.

## Aggregate boundary and replay discipline

An event stream is not a general event log for every table mutation. Select an aggregate boundary around invariants that must be decided atomically. Load that stream, rebuild only the state needed to decide the command, append events with an expected version, and retry by reloading and re-evaluating the command after a version conflict. Re-appending a stale event because a transport retry occurred can create an invalid history.

Snapshots reduce replay work but do not replace the stream. Store the stream version covered by the snapshot; on load, validate it and apply subsequent events. A snapshot bug must be recoverable by discarding it and rebuilding from events. Measure stream lengths and replay latency before adding snapshots.

```text
stream version 17 + command
          ↓ decide from reconstructed state
append event with expected version 17
          ↓
success -> version 18; conflict -> reload, re-evaluate
```

## .NET patterns

Store events in a durable database with a uniqueness constraint on `(aggregate_id, version)` and append them transactionally. A relational store can be sufficient at moderate scale; specialized event stores may offer streams and subscriptions. Keep domain event decisions separate from transport serialization. Snapshot only after measuring replay cost, and ensure the snapshot records the exact stream version.

## Interview discussion

Ask which business requirement needs a complete history, how many streams and events are expected, how projections rebuild, and how schema changes and GDPR-style deletion work. Compare event sourcing against a conventional state table plus audit log; the latter is often simpler if reconstruction is not needed.

## Operational reality

Plan stream retention, snapshot invalidation, projector versioning, and a safe replay procedure before adopting event sourcing. The hardest failures are often malformed old events and external side effects during replay, not appending a new event.

## Related Topics

- [CQRS](cqrs.md)
- [Distributed Transactions](distributed-transactions.md)
- [Message Queues](message-queues.md)
- [Saga Pattern](saga-pattern.md)
