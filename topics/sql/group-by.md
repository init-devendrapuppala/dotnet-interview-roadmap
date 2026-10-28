# GROUP BY and aggregation

`GROUP BY` turns input rows into groups that share the same values for the grouping expressions. An aggregate computes a summary for each group, so the output grain changes: one row per distinct grouping key rather than one row per input row. This is the central modeling question in an interview: what does one output row represent, and did a join or filter change that grain before aggregation?

**SQL Server (T-SQL):** A selected expression must be part of the grouping key or be aggregated. SQL Server does not allow an ungrouped descriptive column simply because it is functionally dependent on a primary key in the query.

```sql
SELECT CustomerId,
       COUNT_BIG(*) AS OrderCount,
       SUM(TotalAmount) AS Revenue
FROM dbo.Orders
WHERE CreatedAt >= '20260101'
GROUP BY CustomerId
HAVING SUM(TotalAmount) >= 1000;
```

The logical sequence matters. `FROM` and joins establish the input rows; `WHERE` filters rows before grouping; `GROUP BY` forms groups; `HAVING` filters completed groups; then projection and ordering produce output. A predicate on an aggregate belongs in `HAVING`, whereas ordinary row predicates should generally be in `WHERE` to avoid aggregating rows that will be discarded. The optimizer may transform operations when semantics allow, so this is a logical explanation, not a guarantee of physical operator order.

### NULLs and aggregate behavior

`COUNT(*)` counts rows, including rows whose columns are `NULL`. `COUNT(expression)` counts only non-NULL values. `COUNT(DISTINCT expression)` counts distinct non-NULL values. Most SQL aggregate functions ignore NULL inputs; `SUM` over no non-NULL values is NULL, not zero. `COALESCE(SUM(...), 0)` is appropriate only if the business definition treats “no amount” as zero. SQL's three-valued logic also matters in filters: `WHERE Column <> 5` excludes NULL rows because the comparison is unknown.

Be alert for fan-out before aggregation. If joining a customer to orders and order items, the order's amount can be repeated once per item. Summing after the join then overstates revenue. Aggregate at the right grain before joining, use a semantically correct relationship, or calculate a measure from the correct entity. Adding `DISTINCT` to mask duplicate rows does not repair the model and can require costly sorting or hashing.

### Grouping sets and execution tradeoffs

SQL Server supports `ROLLUP`, `CUBE`, and `GROUPING SETS` for subtotal and multi-dimensional reports. For example, `GROUP BY GROUPING SETS ((Region, Product), (Region), ())` returns detail, regional subtotal, and grand total. Subtotal columns are represented as NULL, which may collide with a genuine source NULL; use `GROUPING(Column)` or `GROUPING_ID` to identify generated subtotal values.

Aggregation may use a hash aggregate or a stream aggregate. A stream aggregate needs input ordered by grouping keys and may benefit from an appropriate index or sort; a hash aggregate uses memory and can spill when estimates or grants are inadequate. Neither plan shape is universally better. `COUNT(DISTINCT ...)` and many grouping sets can increase CPU and memory. Inspect actual rows, reads, and spill warnings on representative data.

If detail rows must remain visible alongside a per-group total or rank, a window function may express the requirement more directly; unlike `GROUP BY`, it retains each row. Grouping and aggregate syntax varies by engine, so label SQL Server-specific extensions rather than assuming identical dialect behavior.

## Related Topics

- [Joins](joins.md)
- [Window functions](window-functions.md)
- [Query execution plans](query-execution-plan.md)
- [Indexes](indexes.md)