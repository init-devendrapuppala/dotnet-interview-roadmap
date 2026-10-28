# Repositories with EF Core

A repository represents access to a collection or aggregate in an application/domain design. EF Core's `DbContext` already provides repository-like set access (`DbSet<T>`) and unit-of-work behavior (`SaveChanges`). Adding a generic repository that merely forwards every LINQ method to `DbSet` often hides rather than improves the abstraction.

## Why add a repository?

A focused repository can express domain-specific persistence operations, encapsulate aggregate loading rules, isolate a bounded context from infrastructure, or provide an interface at an architectural boundary. For example, `LoadOrderForFulfillment(id)` can communicate required data and policy more clearly than a generic `GetById` plus arbitrary includes.

Avoid repositories that expose `IQueryable<T>` while claiming to fully hide EF Core: callers still compose provider-translated expressions and depend on EF query behavior. Equally, a giant generic repository can become a pass-through API with less flexibility than using `DbContext` directly.

## Be explicit about unit-of-work boundaries

Keep related changes within one context and one `SaveChanges` where practical. Do not create a new context inside each repository method if the use case needs multiple operations to be atomic or share tracked state. Dependency injection should make the scope and transaction owner clear.

Example of a narrow abstraction:

```csharp
public interface IOrderRepository
{
    Task<Order?> GetForFulfillmentAsync(
        int id, CancellationToken cancellationToken);
}

public sealed class EfOrderRepository(OrdersContext db) : IOrderRepository
{
    public Task<Order?> GetForFulfillmentAsync(
        int id, CancellationToken cancellationToken) =>
        db.Orders
            .Include(o => o.Lines)
            .SingleOrDefaultAsync(o => o.Id == id, cancellationToken);
}
```

This assumes `Order`, `OrderLine`, and `OrdersContext` are application types. The repository returns tracked entities so the same scoped context can persist changes; use a DTO/read model for read-only use cases. C# primary constructors require a modern language version; a conventional constructor works on older targets.

## Testing implications

Do not use a repository abstraction merely to mock LINQ translation. Mocking `IQueryable` rarely tests real SQL behavior. Prefer integration tests against the relational provider for queries, constraints, and transactions; test domain behavior separately. If a repository offers meaningful domain operations, its interface can support focused application tests, but it does not replace database integration tests.

## Decision rule

Use `DbContext` directly when it keeps the use case clear. Introduce a repository only when it protects a meaningful boundary or makes aggregate access more expressive; do not create an extra layer merely because an ORM is present.

## Related Topics

- [DbContext](dbcontext.md)
- [Dapper vs EF Core](dapper-vs-ef-core.md)
- [EF Core overview](ef-core-overview.md)
- [Repository pattern](../design-patterns/repository.md)
- [Unit of work](../design-patterns/unit-of-work.md)
