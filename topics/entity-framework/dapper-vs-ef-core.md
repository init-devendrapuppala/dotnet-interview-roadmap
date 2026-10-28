# Dapper vs EF Core

Dapper and EF Core solve overlapping but different amounts of the data-access problem. Dapper maps rows from SQL you write; EF Core maps an object model, translates supported LINQ, tracks changes when requested, and coordinates persistence. Neither removes the need to understand SQL or the database.

## Why choose one or both?

EF Core is a strong default when entity relationships, change tracking, domain-oriented updates, and migrations are useful. It reduces repetitive mapping and persistence code but adds runtime model/query translation behavior to understand. Dapper is attractive when SQL shape must be explicit, for reporting, stored procedures, provider-specific features, or a hot path where measured benefits justify hand-written SQL and mapping.

An application can use both behind a coherent data-access boundary: EF for aggregate updates and Dapper for a read-heavy projection. If they share a transaction, they must use the same connection and transaction. Dapper does not automatically enlist in an EF transaction just because both target the same database.

## Tradeoffs to explain

| Concern | EF Core | Dapper |
|---|---|---|
| Query authoring | LINQ translated by provider; inspect generated SQL | SQL authored directly |
| Updates | Change tracker and `SaveChanges`, or set-based APIs | Explicit SQL statements |
| Mapping | Model conventions/configuration, materialization, relationships | Row-to-object mapping; relationships often need explicit multi-mapping/query design |
| Schema evolution | EF migrations available | Separate migration/schema tooling is typical |
| Performance | Often very capable; tracking/translation and query shape matter | Low mapping overhead, but database/network and query design still dominate |
| Portability | LINQ/provider features vary | SQL dialect differences are explicit |

Do not claim Dapper is always faster or EF is always slower. Compare equivalent projections, SQL, round trips, indexes, materialization, and tracking modes under representative workload. A tracked EF query and a minimal Dapper scalar query are not an apples-to-apples benchmark.

## Practical guidance

For a read-only endpoint, use an EF projection or Dapper query based on complexity and team expertise. For an update requiring invariants and aggregate behavior, load tracked state and save, unless a carefully designed set-based command expresses the operation safely. Parameterize raw SQL; never concatenate untrusted values.

Choosing Dapper means owning more SQL and mapping behavior. Choosing EF means understanding generated SQL, tracker state, provider limitations, and migrations. Keep transaction ownership, error handling, and observability clear regardless of library.

## Production boundary

If both tools are used, standardize connection ownership, telemetry, timeout/cancellation, parameterization, and transaction rules. The mixed approach should be visible in code review; otherwise a fast read path can quietly bypass tenant filters, soft deletes, or observability conventions enforced elsewhere.

## Related Topics

- [EF Core overview](ef-core-overview.md)
- [Query performance](query-performance.md)
- [Bulk operations](bulk-operations.md)
- [Repositories](repositories.md)
- [SQL query execution plans](../sql/query-execution-plan.md)
