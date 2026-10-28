# Unit of Work Pattern

Unit of Work coordinates changes made during one business operation and commits them together, commonly tracking modified objects and persisting them in one transaction. It helps keep a use case's persistence boundary explicit; it does not make unrelated external systems part of the same atomic transaction. Its motivation is to avoid each repository independently committing partial state. A use case can make several related changes, then persist them as one database operation so the database does not observe an unintended intermediate state.

## EF Core in practice

EF Core's `DbContext` already acts as a unit of work: it tracks changes and `SaveChangesAsync` persists them. For example:

```csharp
public sealed class RenameOrderHandler(AppDbContext db)
{
    public async Task Handle(
        Guid id, string newName, CancellationToken cancellationToken)
    {
        var order = await db.Orders.SingleAsync(
            x => x.Id == id, cancellationToken);
        order.Rename(newName);
        await db.SaveChangesAsync(cancellationToken);
    }
}
```

A single `SaveChanges` call is transactional when the provider supports transactions, but multi-step workflows may need an explicit transaction. Exact guarantees depend on provider and configuration. `DbContext` tracks entity changes in memory; `SaveChangesAsync` writes pending changes. An explicit transaction can cover multiple saves or operations that must commit together, but it should be kept short and used only when the provider supports the required semantics.

In a multi-repository use case, those repositories can share the same scoped context so changes are coordinated by one unit of work. For example, load an order, change its status, add an audit entity, and then save once. If repositories each create their own context and commit independently, a method called `IUnitOfWork` around them does not magically combine their transactions.

## When to add an abstraction

An `IUnitOfWork.SaveChangesAsync` can be useful when the application deliberately hides EF Core or coordinates multiple repositories around one persistence boundary. Avoid wrapping `DbContext` mechanically: duplicating its methods and lifetime can obscure rather than clarify behavior.

Repositories describe access to domain objects; unit of work coordinates pending changes and commit. They are often used together but are distinct concepts. A unit of work is also not a distributed transaction: when a database update must coordinate with message publication or a remote API, consider an outbox, idempotent messaging, or a saga.

Alternatives include an explicit database transaction around a service method, or relying on the ORM's natural context lifetime and `SaveChanges`. For a single operation with one `DbContext`, introducing an additional abstraction may not add value. For systems with multiple stores, define whether they can share a transaction; otherwise model partial failure and recovery rather than pretending there is one atomic commit.

## Testing, production pitfalls, and tradeoffs

Unit-test domain behavior separately from commits. Integration-test that changes are persisted together and that failures roll back as intended using the real relational provider. A mocked `SaveChangesAsync` cannot verify database atomicity. Include tests for concurrency tokens and constraints when concurrent requests may update the same records.

Do not keep a unit of work alive across unrelated requests or long-running user interactions. In ASP.NET Core, a scoped `DbContext` commonly aligns its lifetime with a request/use case, but background processing should create and dispose scopes deliberately.

Production pitfalls include excessively long transactions that hold locks, treating an in-memory change tracker as durable before commit, sharing one context concurrently across threads, and assuming a database transaction includes HTTP calls or broker publication. Define rollback behavior and cancellation handling. After a failed save, the context may still contain tracked state; retry logic should understand whether it reuses or discards that context. Keep retries bounded and account for optimistic concurrency failures.

Transaction isolation also shapes what a unit of work guarantees under concurrent use. A single atomic save does not automatically prevent lost updates or stale reads; use concurrency tokens, constraints, or an isolation level that matches the invariant. Keep the transaction as narrow as practical, and do not hold it open while waiting on user input or a slow remote service.

In interviews, define the atomic boundary, identify which component tracks pending changes, and explain what is and is not covered by the transaction. Contrast repository (data-access interface) with unit of work (coordinated commit). Mention an outbox or saga when a database change must lead to external messaging or service work.

## Related Topics

- [Repository](repository.md)
- [DbContext](../entity-framework/dbcontext.md)
- [Transactions](../entity-framework/transactions.md)
- [Distributed Transactions](../system-design/distributed-transactions.md)
- [Saga Pattern](../system-design/saga-pattern.md)