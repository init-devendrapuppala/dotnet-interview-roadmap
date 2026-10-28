## The decision

A monolith deploys a system as one application; a modular monolith keeps internal modules and ownership boundaries while sharing a deployment and often a database. Microservices deploy separate services with independently owned runtime and data. The choice is about organizational and operational constraints as much as code structure.

## Compare the costs

| Concern | Modular monolith | Microservices |
|---|---|---|
| Calls and transactions | In-process; local ACID is straightforward | Network failures; eventual consistency is common |
| Deployment | One release unit; simpler operations | Independent release possible, but compatibility matters |
| Scaling | Scale the application together | Scale selected services independently |
| Failure isolation | Shared process/resources | Better boundaries if designed and operated well |
| Observability | Usually simpler traces and debugging | Requires distributed tracing, correlation, service ownership |

Neither form guarantees good boundaries or quality. A monolith can be modular and scalable; a distributed system can be tightly coupled and fragile.

## Choose with evidence

Prefer a modular monolith when the product/domain is evolving, the team is small, deployment coordination is acceptable, and there is no measured need for independent scaling or fault isolation. Prefer service extraction when a bounded capability needs an independent release cadence, security boundary, team ownership, or materially different capacity profile—and the organization can operate it.

Do not split solely because the codebase is large. First define module APIs, keep dependencies directional, prevent direct cross-module table access, and measure bottlenecks. A strangler migration can route one capability at a time while the legacy system remains available.

## Migration and failure modes

Extraction adds remote latency, timeouts, partial failure, authentication, data ownership, and eventual consistency. Plan data migration, backfill, dual-read or cutover validation, rollback, event/API compatibility, and observability. Avoid permanent dual writes without an explicit reconciliation design. A shared database during transition may be pragmatic, but treat it as temporary coupling with a retirement plan.

In .NET, one ASP.NET Core application can organize modules as separate projects/assemblies with explicit interfaces and dependency injection. Deploy services separately only when the operational value justifies pipelines, configuration, secrets, health checks, and on-call overhead.

## Interview answer structure

State expected team count, traffic pattern, availability and deployment needs. Choose the simplest architecture meeting them, identify the trigger for later extraction, then explain data and failure boundaries. Avoid claiming microservices are inherently more scalable or a monolith inherently more reliable.

## Interview conclusion

State the reversible next step, not just the final architecture. A modular monolith with tested boundaries is often the most credible answer when requirements are uncertain, because it preserves an extraction path without paying distributed-systems cost prematurely.

## Related Topics

- [Microservices](microservices.md)
- [Scalability](scalability.md)
- [API Gateway](api-gateway.md)
- [Distributed Transactions](distributed-transactions.md)
