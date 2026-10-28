## Goals and constraints

Microservices split a system into independently deployable services aligned to business capabilities. They can support team autonomy, selective scaling, and independent release cadence. They also turn in-process calls into network calls and add operational costs: discovery, observability, security, deployment coordination, and distributed data consistency.

Begin with domain boundaries, ownership, change frequency, scaling needs, team structure, and availability objectives. Avoid choosing service boundaries by technical layer (for example, separate “database service” and “business logic service”) or splitting every entity into its own service.

## Service design

Each service should own its data and expose behavior through an explicit API or event contract. Shared databases create hidden coupling and coordinated schema changes. Cross-service queries can use an API composition layer or asynchronously maintained read model; each has latency, freshness, and failure tradeoffs.

```text
Client -> edge/BFF -> Orders service -> Orders DB
                    -> Inventory service -> Inventory DB
                           <- events / queue ->
```

Use synchronous calls for immediate decisions when the latency and availability dependency is acceptable. Use asynchronous messaging for decoupling and workflows that tolerate eventual consistency. Avoid long synchronous chains: if each dependency has availability `p`, a serial path has approximate availability equal to the product of those probabilities.

## Reliability and data

Set deadlines per hop, propagate cancellation and trace context, and use bounded retries only for safe/idempotent operations. Add circuit breakers and bulkheads where they prevent resource exhaustion; they do not replace capacity planning. For database-plus-event publication, use the transactional outbox. For multi-service workflows, model explicit saga states and compensations.

Version APIs and event schemas compatibly; deploy consumers that tolerate old and new messages during rollout. Build correlation IDs, structured logs, metrics, and distributed traces into the platform. Define service ownership, on-call, SLOs, secrets, and failure runbooks before scaling the number of services.

## Request budgets and ownership boundaries

An interservice call has a caller deadline, a smaller dependency timeout, bounded retry time, and a fallback decision. Propagate the remaining deadline rather than giving every hop a full independent timeout; otherwise a serial request chain can exceed the client contract and retain work after the caller has gone away. Retrying a non-idempotent operation requires an idempotency contract, not just a HTTP retry handler.

Data ownership means one service owns writes and schema evolution for a capability. Other services consume a versioned API or event, not its tables. A reporting requirement does not justify direct cross-service database joins; build an owned read model or define an API-composition contract.

## .NET considerations

ASP.NET Core services can share approved platform libraries for telemetry, authentication, and resilience, but avoid a shared domain library that forces lockstep deployments. Use `IHttpClientFactory`, health checks, options validation, and hosted workers appropriately. Containerize only when it meets deployment and operational needs; containers do not create isolation or resilience automatically.

## Tradeoffs and evolution

A modular monolith with clear module boundaries is often a better starting point: transactions are simpler, debugging is easier, and one deployment is operationally cheaper. Extract a module when there is a concrete independent scaling, deployment, ownership, or fault-isolation need. Extraction should preserve domain ownership and include migration, observability, and rollback plans.

## Extraction standard

Before extraction, assign data ownership, SLOs, alerts, dashboards, migration/rollback ownership, and an API/event compatibility policy. Without these, a service boundary is mostly a new network hop rather than useful autonomy.

## Related Topics

- [Monolith vs Microservices](monolith-vs-microservices.md)
- [API Gateway](api-gateway.md)
- [Distributed Transactions](distributed-transactions.md)
- [Message Queues](message-queues.md)
- [Scalability](scalability.md)
