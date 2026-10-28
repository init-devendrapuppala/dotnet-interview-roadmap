# Query execution plans

A query plan is the optimizer's chosen physical strategy for producing the result described by a SQL statement. The SQL expresses logical operations; the plan describes access methods, join algorithms, filtering, aggregation, sorting, and data movement. A plan is an evidence source for diagnosis—not a scorecard in which one operator name determines whether a query is fast.

**SQL Server:** An estimated plan shows estimated rows and optimizer assumptions without executing the statement. An actual plan adds runtime information for that execution, including actual row counts and warnings where available. In graphical plans, data generally flows from leaf inputs toward the root/result, but read direction can be visually confusing; inspect operator properties and input/output relationships.

### What to inspect

Compare estimated and actual rows at important operators. A major discrepancy can lead to a poor join strategy, inadequate or excessive memory grant, spills to tempdb, or repeated work. Estimates depend on statistics, constraints, parameter values, data correlation, and SQL Server's cardinality estimator. A discrepancy is a clue to investigate, not proof that statistics alone are the cause.

Inspect:

- **Access and predicates:** Is the query reading the expected index/table? Distinguish a seek predicate, which limits index traversal, from a residual predicate evaluated after rows are read. Check for implicit conversions or functions on columns that prevent efficient access.
- **Join strategy and row flow:** A nested loops join may be ideal for a small outer input with indexed lookups, but expensive when that input is unexpectedly large. Hash joins may handle large unsorted inputs but need memory. Merge joins need compatible ordered inputs. Verify input sizes and join cardinality.
- **Lookups and repeated work:** A few key lookups can be cheap; many lookups can dominate reads. A spool may be intentional reuse or protection against repeated work, not necessarily a defect. Examine execution counts and rows.
- **Sorts, aggregates, and memory:** Sort/hash operators can use substantial memory. Spills, excessive grants, or memory grant waits may indicate estimates, query shape, or concurrency issues.
- **Warnings and parallelism:** Review spills, conversions, missing indexes suggestions, and parallelism warnings in context. Parallel plans can reduce elapsed time but consume more CPU and coordination resources; serial plans are not automatically worse.

Neither “Index Seek” nor “Index Scan” is a verdict. A seek may traverse a broad range or fetch many rows; a scan can be optimal when much of a table is needed. The estimated operator cost is a model used for plan choice, not measured elapsed-time attribution. Compare logical reads, CPU, elapsed time, waits, output size, and concurrency.

### Collecting comparable evidence

In SQL Server, `SET STATISTICS IO, TIME ON` reports per-object logical/physical reads and CPU/elapsed timing for a session. Pair it with an actual plan for the exact parameter values and data state:

```sql
SET STATISTICS IO, TIME ON;

SELECT OrderId, CreatedAt
FROM dbo.Orders
WHERE CustomerId = @CustomerId
  AND CreatedAt >= @FromDate;

SET STATISTICS IO, TIME OFF;
```

Use representative parameter values, data volume, and concurrency. The plan can differ by parameter, compile state, schema, compatibility level, statistics, and configuration. Comparing plans from different cache or load conditions without context can be misleading. Actual-plan capture and instrumentation add overhead; be cautious in production and avoid collecting sensitive values unnecessarily.

SQL Server commonly caches plans. Parameter sensitivity can make a plan compiled for a rare value unsuitable for a common value or vice versa. Query Store can retain query/plan/runtime history and help identify regressions; its capture and retention configuration matters. DMVs provide live or cumulative state and may reset or lose entries. Correlate plan changes with query text, parameter distribution, deployment, statistics, and workload.

### From diagnosis to action

First verify semantics and row counts. Then form a specific hypothesis: for example, an implicit conversion prevents a seek, a join estimate is low, or large lookups dominate reads. Change the smallest relevant query, index, statistic, or parameter-handling choice and compare against a baseline. Check the write cost and side effects of any new index.

Do not force a plan or add a hint simply because one captured plan looks bad. A forced plan can age poorly as data and workload change; a hint can mask incorrect assumptions or harm other parameter values. Capture multiple representative executions and monitor after deployment. If elapsed time is high but the plan appears efficient, investigate waits, blocking, resource pressure, network transfer, and application materialization.

Plan formats and operators are engine- and version-specific. In interviews, explain the logical-versus-physical distinction, estimated-versus-actual cardinality, and why seek/scan labels alone are insufficient. Relate the plan to measured reads, CPU, waits, and the real parameter distribution.

## Related Topics

- [Performance tuning](performance-tuning.md)
- [Indexes](indexes.md)
- [CTEs](cte.md)
- [Joins](joins.md)