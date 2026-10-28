# Bulk and set-based operations

Bulk work is not one single EF Core feature. Choose between normal tracked `SaveChanges`, EF Core set-based `ExecuteUpdate`/`ExecuteDelete` (available in EF Core 7+ for supported relational scenarios), provider/bulk extensions, and database-native import mechanisms. The deciding tradeoff is often whether the operation needs per-entity domain behavior and change tracking.

## Set-based updates

`ExecuteUpdateAsync` and `ExecuteDeleteAsync` send a set-based database operation without materializing and tracking each affected entity:

```csharp
var affected = await db.Sessions
    .Where(s => s.ExpiresAt < cutoff && !s.IsArchived)
    .ExecuteUpdateAsync(
        setters => setters.SetProperty(s => s.IsArchived, true),
        cancellationToken);
```

This avoids loading rows and calling `SaveChanges` for each entity. It executes immediately, not as a deferred change tracked by the context. Already tracked instances are not automatically synchronized and can become stale. Reload, clear tracking, or use a separate short-lived context where appropriate.

Set-based operations bypass per-entity change tracking and do not invoke overridden `SaveChanges`, `SaveChanges` interceptors, or entity-level behavior that normally occurs while changing tracked entities. Put required invariants in the predicate/update, database constraints, or an explicit application workflow. They also do not automatically perform optimistic concurrency checks; include a concurrency condition in the predicate and inspect affected rows if that is required.

## Large inserts and third-party tools

Normal `AddRange` plus `SaveChanges` can batch commands, with batch sizes and benefits depending on provider/version. It still tracks entities. For very large imports, provider-native tools such as SQL Server bulk copy or a vetted bulk library may be more efficient, but can differ in identity handling, relationships, generated values, triggers, transactions, and concurrency semantics. Test these behaviors explicitly and confirm licensing/support.

## Choose intentionally

- Use tracked changes for domain operations requiring validation, relationship changes, or per-entity decisions.
- Use set-based updates for uniform changes expressible in SQL, after checking context state and concurrency requirements.
- Use bulk ingestion when measurements show standard batching is insufficient and database-specific behavior is acceptable.

Benchmark with realistic data and verify the SQL/transaction boundary. Do not select a bulk API solely because an operation has many rows if it weakens required invariants.

## Operational safeguards

Treat the affected-row count as part of the command result. It can reveal a stale predicate, a concurrent change, or a tenant filter error. Run broad mutations with explicit tenant/soft-delete predicates, an appropriate transaction when they participate in other local work, and a dry-run/count query when operationally warranted. Audit and authorization behavior normally implemented in application code must be deliberately preserved.

## Related Topics

- [Query performance](query-performance.md)
- [Tracking and change detection](change-tracker.md)
- [Transactions](transactions.md)
- [Concurrency](concurrency.md)
- [Dapper vs EF Core](dapper-vs-ef-core.md)
