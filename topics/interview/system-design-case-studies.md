# System Design Case Studies for .NET Developers

System design interviews assess whether you can translate requirements into a dependable design and explain its trade-offs. For a four-to-six-year developer, demonstrate sound boundaries, data and failure reasoning, operational awareness, and the ability to scale incrementally. Do not begin by drawing a microservices diagram or selecting cloud products.

## A structured approach

1. **Clarify requirements:** Identify users, core operations, read/write patterns, consistency expectations, latency and availability goals, data retention, security, and likely growth. Separate functional requirements from constraints.
2. **Estimate only what matters:** Use rough request volume, payload size, or retention to reason about bottlenecks. State assumptions; refine them if the interviewer supplies better numbers.
3. **Define API and data model:** Show the main request/event flow, ownership of data, identifiers, and important invariants. Discuss pagination, validation, authorization, and idempotency where relevant.
4. **Choose a simple architecture:** Start with a modular application and a datastore that fits the access pattern. Add queues, caches, replicas, or service boundaries only to address a stated need.
5. **Trace failure paths:** Cover timeouts, retries, duplicate delivery, partial failure, backpressure, and recovery. Make consistency guarantees explicit.
6. **Plan operations and security:** Include observability, deployment/rollback, health/readiness, secrets, access control, and abuse protection.
7. **Review trade-offs:** Name the bottleneck, the metric that would reveal it, and the next change you would make.

## Case study: reliable order submission

**Prompt:** Design an API that accepts orders and eventually sends them to a fulfillment partner.

Clarify whether a customer needs immediate confirmation, whether fulfillment can be delayed, and what duplicate submissions mean. A reasonable initial design is an ASP.NET Core API that authenticates and validates the command, persists the order and an outbox record in one database transaction, then returns an order identifier. A background worker publishes pending outbox messages to a broker; a consumer calls fulfillment and records progress.

Discuss idempotency keys to handle client retries, unique constraints to protect invariants, and at-least-once delivery with idempotent consumers. Acknowledge that an outbox does not make the external partner call atomic with your database. Define states, retry/backoff limits, dead-letter or manual-recovery handling, and user-visible status. Use cancellation and timeouts at boundaries, but do not abandon a committed operation merely because the HTTP client disconnected.

**Evaluation signals:** Clear transaction boundary, honest delivery semantics, duplicate handling, and an operational recovery path.

## Case study: read-heavy product catalog

**Prompt:** Design a catalog API with frequent reads and less frequent updates.

Clarify freshness requirements, filters/sorts, tenant boundaries, and peak traffic. Start with indexed database queries and bounded pagination. Measure query plans and endpoint latency before introducing a cache. If a cache is justified, define key construction, TTL/invalidation strategy, stale-data tolerance, and behavior during cache failure. Avoid caching authorization-sensitive results under an incomplete key. For large datasets, discuss read replicas or search indexing as later options, including eventual-consistency implications.

**Evaluation signals:** Query-driven design, explicit freshness/security assumptions, and cache failure behavior rather than “add Redis.”

## Case study: processing uploaded documents

**Prompt:** Users upload files that must be validated and processed asynchronously.

Cover size limits, content/type validation, authorization, malware-scanning expectations, private storage, and access controls before discussing throughput. Stream rather than buffering large files unnecessarily. Persist upload state and enqueue work safely; make processing idempotent and report progress/failure. Specify retention and deletion behavior. Protect against path traversal and do not trust a client-supplied filename or MIME type.

**Evaluation signals:** Treats the upload boundary as untrusted, accounts for large payloads and partial failures, and includes lifecycle/security controls.

## .NET-specific design considerations

- Keep ASP.NET Core request handlers thin enough to make boundaries testable, without imposing a pattern for its own sake.
- Use `DbContext` with an appropriate scope; avoid concurrent operations on one context.
- Prefer async I/O end to end and propagate cancellation where it is safe.
- Bound queues, concurrency, retries, and request sizes to protect downstream dependencies.
- Use structured logs, metrics, and distributed tracing with correlation; never log secrets or sensitive payloads.
- Apply authentication and authorization at the right boundary and validate inputs independently of trust in upstream callers.

## Evaluation criteria

Interviewers look for requirements discovery, clear diagrams and APIs, coherent data ownership, proportional complexity, resilient failure handling, security, observability, and an ability to evolve the design. They do not expect a single “correct” architecture. State assumptions, invite correction, and adapt when requirements change.

## Related Topics

- [Project discussions](project-discussions.md)
- [Coding questions](coding-questions.md)
- [Debugging scenarios](debugging-scenarios.md)
- [ASP.NET Core Web API](../aspnet-core/web-api.md)
- [ASP.NET Core rate limiting](../aspnet-core/rate-limiting.md)
- [EF Core transactions](../entity-framework/transactions.md)
- [System design message queues](../system-design/message-queues.md)
- [System design scalability](../system-design/scalability.md)