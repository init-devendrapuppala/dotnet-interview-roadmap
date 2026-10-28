# Repository Pattern

Repository presents a collection-like, domain-oriented interface for retrieving and persisting aggregates while separating application/domain code from storage details. It is useful when it clarifies a persistence boundary or isolates complex query behavior; it is not a requirement for every EF Core application. Its original motivation is to make persistence access resemble working with a collection of domain objects and to keep storage-specific mechanics from permeating domain logic. The pattern is most valuable when the interface expresses domain operations and owns meaningful query or aggregate-boundary decisions.

## C# with EF Core

```csharp
public interface IOrderRepository
{
    Task<Order?> FindAsync(Guid id, CancellationToken cancellationToken);
    void Add(Order order);
}

public sealed class EfOrderRepository(AppDbContext db) : IOrderRepository
{
    public Task<Order?> FindAsync(Guid id, CancellationToken cancellationToken) =>
        db.Orders.SingleOrDefaultAsync(
            order => order.Id == id, cancellationToken);

    public void Add(Order order) => db.Orders.Add(order);
}
```

The caller coordinates persistence through the injected `DbContext` or an application unit-of-work abstraction, typically calling `SaveChangesAsync` once the use case is ready. `Order` and `AppDbContext` are application types, and EF Core namespace imports are assumed. The repository deliberately exposes no `IQueryable`; a caller can request a domain object without coupling a higher layer to EF's query provider. The example is incomplete as a standalone project because it depends on an EF Core context and domain model, but its members are valid EF Core APIs.

A repository may return an aggregate root and persist changes to it. It should not casually expose every database operation as a generic CRUD method when domain rules require specific operations, nor should it necessarily own commit behavior. Keeping repository operations and commit boundaries distinct lets a use case coordinate multiple repositories before saving once.

## Tradeoffs and alternatives

- `DbContext`/`DbSet` already provide change tracking, query access, and persistence APIs. A generic `IRepository<T>` that mirrors every EF method can add indirection without hiding EF or protecting domain intent.
- A focused repository can name meaningful operations and constrain queries to aggregate boundaries. Avoid returning `IQueryable` across layers if it lets callers depend on provider-specific translation or compose unbounded queries.
- For read-heavy projections, query handlers or direct projection with EF/Dapper can be simpler than forcing every read through an aggregate repository.
- A repository abstraction is most valuable when it supports a real boundary, domain language, or test seam—not merely because a pattern diagram includes one.
- Repository is not synonymous with a data-access object (DAO): a DAO can expose persistence-centric operations, while a domain repository is commonly shaped around aggregate roots and domain language. Actual usage varies, so describe the contract rather than relying only on names.
- A repository does not automatically make switching databases cheap. Provider differences, transaction behavior, migrations, and query semantics still need to be handled and tested.

Use-case reads sometimes benefit from a separate query path: projecting directly to a DTO avoids materializing a full aggregate when only a report is needed. This is compatible with a repository for aggregate writes; forcing all read and write paths through one abstraction can make both less clear.

## Testing, production pitfalls, and interview notes

Test domain rules without persistence when possible; test EF mappings, query translation, and transaction behavior against a relational provider (often a disposable test database). An in-memory fake may not reproduce SQL constraints or translation. Mocking a repository is useful for application orchestration tests, but does not validate the repository itself. Add integration tests for important filters, ordering, concurrency, and aggregate-loading rules.

Production pitfalls include returning tracked entities beyond their context lifetime, loading too much data, hiding expensive queries behind collection-like names, and making generic repository APIs too broad to enforce domain constraints. Make asynchronous calls cancellable and make paging explicit for potentially large result sets. Define whether a repository returns tracked or no-tracking entities; that choice affects updates and memory. Avoid exposing a context or `IQueryable` indirectly if the goal is to isolate persistence.

In interviews, distinguish repository from DAO and unit of work: repositories organize access to domain objects; unit of work coordinates changes for a persistence operation. State why EF Core's built-in `DbContext` is or is not sufficient for the particular system. A repository is a design option, not a mandatory wrapper around every `DbSet`.

## Related Topics

- [Unit of Work](unit-of-work.md)
- [DbContext](../entity-framework/dbcontext.md)
- [EF Core Overview](../entity-framework/ef-core-overview.md)
- [Dapper vs EF Core](../entity-framework/dapper-vs-ef-core.md)