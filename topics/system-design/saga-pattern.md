## Purpose

A saga coordinates a business transaction across services when a single ACID transaction cannot cover all participants. Each step commits locally; if a later step cannot complete, the workflow may run compensating actions. A saga provides eventual workflow completion, not instantaneous atomic rollback.

Example: reserve inventory, authorize payment, then arrange shipment. If shipment setup fails, release inventory and void/refund payment where possible. Compensation is a new business action and may itself fail; it cannot always erase an external effect.

## Orchestration and choreography

- **Orchestration:** A durable coordinator records workflow state and commands each participant. It makes flow and timeout behavior explicit but introduces a coordinator to operate.
- **Choreography:** Services react to events and emit follow-up events. It reduces central control but can make the full workflow and cyclic dependencies difficult to understand.

Choose based on workflow complexity, number of participants, audit needs, and team ownership. Do not use choreography merely to avoid a small, well-defined coordinator.

## Reliability design

Persist saga state, current step, identifiers, attempts, and outcome. Every command and compensation should be idempotent, correlated to a saga ID, and safe under duplicate delivery. Use an outbox for state changes and event publication. Define timeouts, retry limits, compensation order, terminal states, manual intervention, and reconciliation for ambiguous external outcomes.

```text
Start -> Reserve inventory -> Charge payment -> Create shipment
           | failure              | failure
           v                       v
        Abort                  Refund + release
```

A timeout can mean a participant completed but the response was lost. Query by idempotency/correlation key or reconcile before issuing a potentially harmful compensation. Late events must be checked against the saga's current state; they must not resurrect a completed workflow.

## State machine, timeouts, and compensation

Model permitted states and transitions explicitly. A durable coordinator records the command ID sent to each participant, the response/event ID observed, its deadline, and the next safe action. This turns a restart into a recoverable state lookup instead of a lost in-memory continuation. A participant accepts the same command ID repeatedly and returns the prior outcome after it has completed the action.

Compensation follows business policy, not reverse SQL order. Inventory release may be safe after payment authorization fails; refunding a settled payment can require a separate financial workflow and human review. Define terminal states such as completed, compensated, cancelled before action, and failed-needing-intervention. A timeout leads to status lookup or reconciliation before compensation when completion is ambiguous.

```text
Pending -> InventoryReserved -> PaymentAuthorized -> Completed
   │              │                  │
   └── timeout/rejection -> reconcile -> compensate or continue
```

## .NET implementation

Represent a saga as explicit persisted state, not a long-lived in-memory method. Background workers or a workflow engine can resume work after restart. ASP.NET Core endpoints should return an accepted/workflow identifier for long-running processes rather than holding an HTTP request open. Use database transactions for each service's local step, cancellation for bounded operations, and structured traces across messages.

## Interview checks

Identify the business invariant, which steps are reversible, how duplicates and timeouts are handled, and whether users can observe intermediate states. State how stuck sagas are found, retried, compensated, or escalated to an operator.

## Operational ownership

Give each saga a searchable ID, state history, deadline, and operator action. A workflow that only succeeds in the happy path is not a saga design; its reliability is defined by duplicate messages, timeout ambiguity, and manual recovery.

## Related Topics

- [Distributed Transactions](distributed-transactions.md)
- [Message Queues](message-queues.md)
- [Event Sourcing](event-sourcing.md)
- [Microservices](microservices.md)
