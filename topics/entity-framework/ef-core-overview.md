# EF Core: runtime model and tradeoffs

Entity Framework Core (EF Core) is an object-relational mapper (ORM): it maps a .NET model to a relational schema, translates LINQ expression trees into provider-specific commands, and materializes results as CLR objects. It is not a transparent in-memory database. Query shape, mapping, provider capabilities, and database behavior all affect what actually runs.

## What happens at runtime

At startup or first use, EF Core builds a model from conventions, data annotations, and the Fluent API. The model describes entity types, keys, relationships, conversions, and database objects. A `DbContext` uses that model and a provider (such as SQL Server or PostgreSQL) to coordinate queries and writes.

For a LINQ query, EF Core inspects the expression tree, translates the translatable parts to SQL, sends a command through the provider, then reads rows and materializes results. With tracking enabled, materialized entities are also registered in the context's change tracker. A later `SaveChanges` detects changes (unless configured otherwise), generates insert/update/delete commands, and executes them. Exact SQL and batching behavior depend on provider and version.

```csharp
var activeOrders = await db.Orders
    .Where(o => o.Status == OrderStatus.Open)
    .OrderBy(o => o.CreatedAt)
    .Select(o => new OrderSummary(o.Id, o.Customer.Name, o.Total))
    .ToListAsync(cancellationToken);
```

### Query pipeline: expression to result

EF Core does not execute the body of an arbitrary C# predicate inside the database. It captures the LINQ query as an expression tree, recognizes operations supported by the active provider, creates a provider command, sends it with parameters, and materializes returned rows. Code that must run after materialization belongs in an explicit client-side boundary; placing it in a server predicate produces a translation failure when EF Core cannot translate it. Translation is a provider and version contract, so validate important queries on the same provider used in production.

```text
IQueryable<Order>
    ↓ compose expression tree (no database call yet)
provider translation and parameterization
    ↓
database command + query plan
    ↓
data reader rows
    ↓
materialization → optional identity resolution/tracking → result
```

Terminal operations such as `ToListAsync`, `SingleAsync`, and `ExecuteUpdateAsync` trigger work. A navigation accessed on a materialized entity does not independently guarantee that related data was fetched; loading behavior depends on the query and configured lazy-loading mechanism. Inspect `ToQueryString()` and database-side telemetry during diagnosis, but do not log sensitive parameter values in production by default.

### Write pipeline and database constraints

For tracked entities, `SaveChanges` detects state changes, orders commands according to relationship requirements, and executes provider-generated commands. A relational provider executes one `SaveChanges` transactionally when it supports transactions; an explicit outer transaction changes the boundary. Database constraints remain authoritative under concurrency: EF validation or a prior query cannot prevent another writer from changing data before the command executes.

Model configuration is a persistence contract. Key generation, column precision, nullability, conversions, indexes, delete behavior, concurrency tokens, and SQL translation all affect correctness. For example, a money value needs an intentional decimal precision; relying on a provider's default can cause rounding or migration differences. Review generated migrations and SQL when a model change affects data or a hot query.

### Production decisions

Use a short-lived context per unit of work, projections for read endpoints, and tracking only when the application needs entity state for an update. A context is not a cross-request cache and is not thread-safe. For bulk or set-based work, define authorization, tenant predicates, audit effects, concurrency behavior, and tracker synchronization because set-based APIs bypass normal per-entity change processing.

Test translation, constraints, transaction behavior, and migrations against the production database engine. EF Core's in-memory provider is not a relational-database substitute; SQLite can validate some relational behavior but has different SQL and type semantics from SQL Server, PostgreSQL, and other providers.

The projection limits returned data; EF translates the navigation access to a join when supported by the model/provider. Inspect generated SQL and the database execution plan rather than assuming a particular query shape.

## Why use it—and when not to

EF Core is productive when the application works with a domain-shaped object graph, benefits from change tracking, and needs provider-portable query and persistence code. Mappings, relationship fix-up, parameterization, and migrations can reduce repetitive plumbing.

The abstraction has costs: query translation can be surprising, generated SQL still needs database expertise, tracking consumes memory and CPU, and provider-specific features may not be portable. A hand-written SQL query, Dapper, or a bulk library can be a better fit for a specialized report or high-volume operation. Choosing EF Core does not eliminate the need to understand indexes, isolation, constraints, or query plans.

## Interview tradeoffs to explain

- **Use the right result shape.** A read-only API often benefits from a DTO projection and `AsNoTracking`; an aggregate update often benefits from tracked entities and `SaveChanges`.
- **Keep context scope bounded.** `DbContext` represents a unit of work and is not thread-safe. In web applications, a scoped context per request is common, but background jobs and long-running workflows should create appropriately short-lived units of work.
- **Keep database work observable.** Log commands safely, measure query count and duration, and inspect plans for slow queries. Avoid logging sensitive parameter values indiscriminately.
- **Treat portability as a tested property.** LINQ is not a promise that every provider supports identical translations or SQL features.

Do not assume lazy loading is enabled: it requires suitable configuration/proxies or another mechanism. Do not assume `IQueryable` always becomes efficient SQL: translation, query shape, and database schema matter.

## Interview framing

Describe EF Core as a translation and unit-of-work layer, not a database abstraction that removes relational concerns. A strong answer follows one query through translation, command execution, materialization, tracking, and save behavior, then names the provider/version as a variable to test.

## Related Topics

- [DbContext](dbcontext.md)
- [Query performance](query-performance.md)
- [Tracking and change detection](change-tracker.md)
- [Loading related data](loading-data.md)
- [Dapper vs EF Core](dapper-vs-ef-core.md)
