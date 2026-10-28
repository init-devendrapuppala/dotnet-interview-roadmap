# Transactions and atomic work

EF Core uses the database transaction mechanisms available through its provider. Transactions provide atomicity for a set of commands; they do not automatically make business workflows atomic across services or protect against every stale-read problem.

## `SaveChanges` behavior

For relational providers that support transactions, a single `SaveChanges` call is normally executed transactionally: either its changes commit together or the operation fails. If an explicit transaction is already active, EF executes within it. Non-relational providers and provider-specific operations can differ, so confirm the behavior of the chosen provider.

Use an explicit transaction when multiple database operations must commit or roll back as one unit:

```csharp
await using var transaction =
    await db.Database.BeginTransactionAsync(cancellationToken);

try
{
    db.Orders.Add(order);
    await db.SaveChangesAsync(cancellationToken);

    var reserved = await db.Inventory
        .Where(i => i.ProductId == productId && i.Available >= quantity)
        .ExecuteUpdateAsync(
            setters => setters.SetProperty(i => i.Available, i => i.Available - quantity),
            cancellationToken);

    if (reserved != 1)
        throw new InvalidOperationException("Insufficient inventory.");

    await transaction.CommitAsync(cancellationToken);
}
catch
{
    await transaction.RollbackAsync(cancellationToken);
    throw;
}
```

This illustrates transaction scope, not a complete inventory reservation: production code must inspect affected rows and handle insufficient stock. Both operations must use the same context/connection/transaction. A set-based update bypasses tracked entity state.

When `SaveChanges` runs inside an existing transaction, EF may create a savepoint where supported. Provider features can affect this; for example, SQL Server MARS prevents EF from creating savepoints. Test failure/recovery behavior with the target provider.

## Isolation, retries, and external effects

Choose isolation based on invariants and contention, not as a global fix for races. Higher isolation can increase blocking or deadlocks. An optimistic concurrency token may be more appropriate for detecting stale updates. If retrying transient failures with an execution strategy, ensure the entire transaction is executed through the strategy's supported pattern; a manually opened transaction may conflict with automatic retries.

Do not call a payment API or publish a message inside a database transaction expecting distributed atomicity. A crash can occur between the external effect and commit. Use an outbox/saga or another explicit coordination design when consistency across systems matters.

## Multiple contexts

To share a transaction across contexts, they must share the same relational connection and transaction, using provider-supported APIs. This is advanced coordination; a single context/unit of work is simpler when possible. A transaction does not make `DbContext` thread-safe.

## Failure handling

Log transaction failures with an operation/correlation ID, not sensitive parameter values. Deadlocks and transient errors need bounded, idempotent retry at the proper unit of work; constraint violations generally need a business response. Verify rollback behavior against the real provider rather than assuming in-memory test behavior.

## Related Topics

- [Concurrency](concurrency.md)
- [Bulk operations](bulk-operations.md)
- [DbContext](dbcontext.md)
- [SQL transactions](../sql/transactions.md)
- [SQL isolation levels](../sql/isolation-levels.md)
- [Distributed transactions](../system-design/distributed-transactions.md)
