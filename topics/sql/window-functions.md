# Window functions

A window function computes a value using a set of rows related to the current row while retaining each input row. This distinguishes it from `GROUP BY`, which collapses rows into one row per group. Windows are useful for ranking, running totals, period comparisons, de-duplication, and group-level values alongside detail.

**SQL Server (T-SQL):** `OVER` defines the window using optional `PARTITION BY`, `ORDER BY`, and, for frame-capable functions, a frame clause.

```sql
SELECT CustomerId, OrderId, CreatedAt, TotalAmount,
       ROW_NUMBER() OVER
           (PARTITION BY CustomerId ORDER BY CreatedAt DESC, OrderId DESC) AS rn,
       SUM(TotalAmount) OVER
           (PARTITION BY CustomerId ORDER BY CreatedAt, OrderId
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS RunningTotal
FROM dbo.Orders;
```

`PARTITION BY` divides rows into independent groups; it does not guarantee their output order. The `ORDER BY` inside `OVER` defines analytic order only. Use an outer `ORDER BY` when consumers require ordered results. If a ranking must have repeatable row numbers, add a unique tie-breaker: ordering solely by a non-unique date allows ties to be assigned in an arbitrary order.

### Ranking, offsets, and frames

`ROW_NUMBER` assigns a unique sequence within each partition. `RANK` gives ties the same rank and leaves gaps afterward (`1, 1, 3`); `DENSE_RANK` gives ties the same rank without gaps (`1, 1, 2`). `LAG` and `LEAD` retrieve a value from a preceding or following row in the ordered partition. These are often clearer than self-joins, but their meaning depends on a complete and correct ordering.

An aggregate window can use a frame to define which ordered rows contribute to each result. In SQL Server, when an aggregate window has `ORDER BY` and no explicit frame, the default is generally `RANGE UNBOUNDED PRECEDING AND CURRENT ROW`. `RANGE` includes peers with equal order values, so all rows with the same date can receive the same cumulative total. For a row-by-row running total, state the intended frame explicitly and use a unique order:

```sql
SUM(TotalAmount) OVER
(
    PARTITION BY CustomerId
    ORDER BY CreatedAt, OrderId
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
) AS RunningTotal
```

`ROWS` counts physical rows in the ordered window; `RANGE` uses peer values. Frame support differs by function and database engine, so confirm the target dialect rather than assuming identical syntax or defaults.

### Common patterns

To select the latest order per customer, calculate a row number in a CTE or derived table, then filter in an outer query. SQL Server does not allow filtering on a window alias in the same query block's `WHERE` because that phase precedes window calculation:

```sql
;WITH RankedOrders AS
(
    SELECT OrderId, CustomerId, CreatedAt,
           ROW_NUMBER() OVER
               (PARTITION BY CustomerId ORDER BY CreatedAt DESC, OrderId DESC) AS rn
    FROM dbo.Orders
)
SELECT OrderId, CustomerId, CreatedAt
FROM RankedOrders
WHERE rn = 1;
```

The same approach can remove duplicates while preserving the chosen row, but define a deterministic rule for which row survives. For a group total next to each detail row, `SUM(...) OVER (PARTITION BY ...)` avoids joining an aggregated subquery back to details.

### Performance and interview pitfalls

Window operators often require sorting and memory. Large partitions, multiple incompatible orderings, or inaccurate cardinality estimates can lead to spills and latency. A supporting index aligned with equality filters, partition keys, and ordering may reduce sorting, but index order, selectivity, writes, and the actual plan all matter. Filter rows before calculating a window only when doing so preserves the intended business result; moving a predicate can change ranks or running totals.

Use `GROUP BY` for one summary row per group; use a window when detail rows must remain. Neither is automatically faster. Inspect actual plans and representative data, and distinguish a window's analytic ordering from final result ordering.

Window functions are evaluated after filtering and grouping in the logical query model, which is why the window alias cannot be used in the same query block's `WHERE`. Use a derived table or CTE to create a query boundary, then filter the calculated value outside. In SQL Server, `QUALIFY` is not available in the same way it is in some other database dialects, so do not copy syntax from another engine without checking.

The functions also differ in how they treat NULL ordering and tie values across database products. If NULL placement is part of the requirement, encode it explicitly in the sort expression where appropriate, and verify SQL Server's behavior. For deterministic pagination or top-per-group logic, include a unique key after the business sort column. Tie-breakers affect results intentionally and should reflect the chosen rule, not be added arbitrarily.

## Related Topics

- [GROUP BY](group-by.md)
- [Indexes](indexes.md)
- [Query execution plans](query-execution-plan.md)
- [CTEs](cte.md)