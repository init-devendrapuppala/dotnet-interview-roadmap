# Compiled queries

EF Core caches query compilation by query shape. A normal LINQ query still needs expression processing and cache lookup, but repeated executions of the same shape do **not** necessarily recompile SQL each time. Explicit compiled queries can reduce EF-side overhead in very hot, stable query paths; they do not make a slow SQL plan fast or reduce database/network work.

## When explicit compilation helps

Consider it only after profiling shows query-compilation overhead is material and the same query shape runs frequently. First address larger costs: round trips, row count, projection, indexes, and database plan quality. A benchmark should include realistic concurrency and the actual provider; microbenchmarks alone can overstate gains.

`EF.CompileQuery` and `EF.CompileAsyncQuery` create reusable delegates. A simple async example:

```csharp
private static readonly Func<OrdersContext, int, IAsyncEnumerable<OrderSummary>>
    OpenOrdersForCustomer =
        EF.CompileAsyncQuery(
            (OrdersContext db, int customerId) =>
                db.Orders
                    .Where(o => o.CustomerId == customerId &&
                                o.Status == OrderStatus.Open)
                    .OrderBy(o => o.CreatedAt)
                    .Select(o => new OrderSummary(o.Id, o.Total)));

// In an async method:
var results = new List<OrderSummary>();
await foreach (var item in OpenOrdersForCustomer(db, customerId)
                   .WithCancellation(cancellationToken))
{
    results.Add(item);
}
```

This assumes `OrdersContext`, `Order`, `OrderStatus`, and `OrderSummary` are defined by the application. The compiled delegate accepts a context, so it can be used with different context instances that share the compatible model. Materialization/tracking behavior still depends on the query and context.

## Constraints and maintenance

Compiled queries are best for a fixed expression shape with scalar parameters. They are less suitable when the query must dynamically add predicates, choose arbitrary projections, or vary structural parts of the expression. Build separate delegates for a small number of known shapes, or use ordinary LINQ for dynamic search. Do not capture a context or per-request service in a static delegate; pass runtime values as parameters.

The code becomes less flexible and needs benchmark evidence and tests. Provider or EF Core upgrades can change performance characteristics, so remeasure. Compiled queries should be an optimization, not a workaround for unbounded result sets, N+1 queries, missing indexes, or excessive tracking.

## Verification

Keep delegates static and parameterized, then benchmark an ordinary query and the compiled form against the same database and warm-up conditions. Compiled-query use should be local, documented, and removable if provider or EF upgrades eliminate its benefit.

## Related Topics

- [Query performance](query-performance.md)
- [DbContext](dbcontext.md)
- [Tracking and change detection](change-tracker.md)
- [EF Core overview](ef-core-overview.md)
