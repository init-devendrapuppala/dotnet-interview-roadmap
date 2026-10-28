# Query performance and translation

EF Core translates LINQ expression trees, not arbitrary C# code, into provider-specific database queries. Performance work starts by understanding the SQL and execution plan—not by replacing LINQ on intuition. Translation support and generated SQL can differ across EF Core and provider versions.

## Reduce work at the database boundary

Project only the required fields, filter before materialization, and bound result size. A DTO projection avoids materializing full entities and their tracking state:

```csharp
var page = await db.Orders
    .Where(o => o.CustomerId == customerId)
    .OrderByDescending(o => o.CreatedAt)
    .ThenByDescending(o => o.Id)
    .Select(o => new OrderRow(o.Id, o.CreatedAt, o.Total))
    .Take(pageSize)
    .ToListAsync(cancellationToken);
```

An appropriate index for the filter/order may be important; validate it using the actual database execution plan and data distribution. Large `Skip` offsets can become expensive; keyset pagination may be preferable when the UI can continue from the last sort key.

Avoid pulling a large table into memory before filtering. `AsEnumerable`/`ToList` switches subsequent operators to client-side processing. EF Core generally throws when a non-translatable expression appears in a server-side filter (rather than silently evaluating the whole predicate on the client), but top-level projection may permit client evaluation of part of the result. Check query logs when unsure.

## Diagnose query shape

Look for N+1 patterns, unexpectedly repeated round trips, excessive columns, cartesian row multiplication from joining multiple collections, and parameter or plan issues. Enable EF command logging in a safe environment and inspect `ToQueryString()` during diagnosis. Treat both as diagnostic aids: actual execution, transaction context, and parameter values matter, and sensitive data should not be logged indiscriminately.

`Include` can be appropriate for an entity graph but may produce a large joined result. Split queries can reduce cartesian expansion by issuing multiple SQL statements; they trade that for additional round trips and potentially different consistency observations unless transaction isolation addresses it. Projection is often clearer for read models.

Use no-tracking queries for read-only entity results; use projection when possible. Compiled queries may shave EF overhead for hot stable shapes, but usually come after measuring database and network costs.

## Parameters and dynamic filtering

Keep values parameterized. EF normally parameterizes captured values in LINQ. For optional filters, build a small number of explicit query shapes or compose expression predicates; avoid concatenating untrusted SQL. When using raw SQL, parameterize values and verify identifier handling separately because identifiers cannot generally be passed as ordinary value parameters.

## Practical workflow

1. Reproduce with representative data and measure latency, allocations, rows, and command count.
2. Capture SQL; inspect its plan and index use in the target database.
3. Reduce returned rows/columns and fix query shape or schema as indicated.
4. Re-run under comparable conditions and cover semantics with tests.

## Production guardrails

Set command timeouts and cancellation according to the endpoint budget, but do not use a larger timeout as a query fix. Add metrics for command duration/count and rows where feasible; regressions are easier to catch when a known endpoint has a bounded query shape and representative integration test.

## Related Topics

- [Compiled queries](compiled-queries.md)
- [Loading related data](loading-data.md)
- [Tracking and change detection](change-tracker.md)
- [SQL indexes](../sql/indexes.md)
- [Query execution plans](../sql/query-execution-plan.md)
- [SQL pagination](../sql/pagination.md)
