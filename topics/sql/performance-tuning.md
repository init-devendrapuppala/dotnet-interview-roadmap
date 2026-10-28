# SQL performance tuning

SQL performance tuning is a measurement-driven process: identify an observed service-level problem, isolate the responsible workload, form a hypothesis, change one relevant factor, and verify that the result improves without harming correctness or other workloads. It is not “add an index,” “avoid scans,” or “rewrite every query.” A query can be fast in isolation and still be harmful at scale because it runs too frequently, holds locks too long, returns too much data, or consumes shared memory and I/O.

### Start with a useful baseline

Define the user-visible symptom: latency percentile, throughput, timeout rate, or resource saturation. Compare normal and degraded intervals. Capture query identity, parameters, execution frequency, row counts, elapsed time, CPU, logical and physical reads, waits, blocking, and concurrency. Check whether the workload changed (deployment, data growth, traffic, statistics, configuration, or plan) before changing SQL.

In SQL Server, Query Store retains query, plan, and runtime history subject to its configuration and retention policies; it is useful for finding regressions and comparing plans. DMVs provide live or cumulative observations but many counters reset after restart, failover, or cache eviction. Extended Events can capture targeted runtime events and deadlock details; broad high-volume collection can itself add overhead. Database-wide wait statistics are clues, not proof: interpret them against the affected query and interval.

Use representative parameter values, data distributions, concurrency, and row counts. A benchmark against a tiny development database can hide scans, spills, locking behavior, or parameter sensitivity. Establish a repeatable comparison and include application/network time where users experience it.

### Examine the statement and plan

For SQL Server, combine an actual execution plan with targeted `SET STATISTICS IO, TIME ON` in a controlled environment. Actual plans show runtime row counts and warnings for a particular execution, while estimated plans show optimizer assumptions without executing the statement. Neither alone explains all latency: waits, client transfer, compilation, and queueing can dominate.

Look for estimated-versus-actual row discrepancies, repeated scans, high lookup counts, residual predicates, implicit conversions, large sorts or hashes, spills to tempdb, excessive memory grants, and unexpected parallelism. A scan is correct when many rows are needed; a seek can still read a huge range or return costly lookups. Operator percentages are optimizer cost estimates, not measured elapsed-time attribution. Compare logical reads, CPU, elapsed time, result size, and impact under concurrent load.

```sql
SET STATISTICS IO, TIME ON;

SELECT OrderId, CreatedAt, TotalAmount
FROM dbo.Orders
WHERE CustomerId = @CustomerId
  AND CreatedAt >= @FromDate;

SET STATISTICS IO, TIME OFF;
```

In production, avoid indiscriminately enabling verbose instrumentation for every session. Collect a targeted plan and carefully correlate it with the same query and parameter values. Actual-plan capture and tracing have overhead and may expose sensitive literals or data.

### Correctness and query shape first

Verify the query returns the correct rows before tuning it. Joins at an incorrect grain can inflate aggregates; missing tie-breakers can make pagination unstable; moving an outer-join predicate can change results. Return only required columns and rows, but do not alter semantics merely to reduce work. Filter as early as correctness permits, avoid accidental Cartesian joins, and use set-based operations where they replace excessive per-row round trips.

Sargable predicates and compatible data types help index access. Avoid wrapping an indexed column in a function when a correct range predicate can express the same condition. Match parameter types to column types in SQL Server and .NET to avoid implicit conversion. Use constraints to encode uniqueness and relationships so the engine and application share integrity rules. `TOP` without a meaningful `ORDER BY` does not identify a stable subset.

### Index and statistics changes

Design indexes from observed predicates, joins, grouping, and ordering. Composite key order matters; included columns may avoid lookups but widen the index. Every additional index costs writes, log, storage, cache, backups, and maintenance. Check whether an existing index can serve the query and whether its selectivity supports the proposed access path. Measure write-heavy effects as well as read latency.

Statistics describe distributions and help the optimizer estimate row counts. Stale or limited statistics, skew, correlations, and changes in data volume can produce poor estimates. SQL Server update behavior, sampling, auto-statistics, compatibility level, and cardinality estimator version affect results. Updating stats may improve a plan, but can also trigger a new plan choice and regression; capture baseline and test. Rebuilding indexes simply to refresh statistics is often unnecessarily expensive.

### Parameter sensitivity and plan stability

SQL Server commonly caches execution plans. A plan compiled using an atypical parameter value can perform poorly for another value when data is skewed. Diagnose by comparing plans and runtime for representative parameters; Query Store can reveal plan changes over time. Possible mitigations include better indexes/statistics, statement-level recompilation, parameterized dynamic SQL, or query design that separates significantly different cases. Each has tradeoffs: recompilation consumes CPU, dynamic SQL affects cache behavior, and plan forcing can become stale as data changes. Avoid treating `OPTION (RECOMPILE)`, local variables, or disabling parameter sniffing as universal remedies.

### Application and .NET workload effects

An N+1 pattern can issue hundreds of individually cheap queries; round-trip latency then dominates. Batching or a set-based query may help, but can enlarge result sets or transaction scope. Unbounded reads increase server, network, allocation, and serialization work. In .NET, distinguish SQL execution from connection acquisition, network transfer, driver buffering, object materialization, serialization, and downstream processing. Measure end to end using tracing/metrics, and correlate with database-side query identity and timings.

Connection pool exhaustion, long-lived readers, excessive parallel queries, and transactions held during remote calls can look like “slow SQL.” Use async APIs appropriately, dispose connections/readers, bound concurrency and result sizes, and avoid holding a transaction while awaiting unrelated services. Efficient code in a single request can still overload the database when multiplied across concurrent requests.

### Change management and interview reasoning

Change one thing at a time where practical, benchmark against a baseline, include concurrency and realistic data, and verify result equivalence. Roll out risky index, schema, compatibility, or plan changes with a rollback path and monitoring. Watch for regressions in other queries and write latency. Hints can constrain the optimizer and may help only when the underlying reason is understood; they are not a substitute for diagnosis.

In an interview, explain the sequence: reproduce and measure, inspect query and plan, validate estimates and data shape, make a minimal hypothesis-driven change, and measure system impact. Mention the application layer, not just SQL text. SQL Server-specific tools such as Query Store, wait types, and plan operators have vendor/version/configuration details; do not generalize them to all engines.

### Common production symptoms and focused investigations

**High CPU** can come from repeated executions, expensive scalar expressions, large joins/aggregations, compilation, or inefficient plans. First identify which statements consume CPU over the interval and how often they run. Reducing one query's CPU by 20 percent may matter less than eliminating thousands of unnecessary executions. Avoid prematurely blaming a scalar function or parallelism without comparing execution statistics and plan shape.

**High logical reads** indicate many page accesses through the buffer pool, not necessarily physical disk reads. Check whether the query touches more rows than needed, performs repeated lookups, scans due to predicate shape, or repeatedly executes through an N+1 pattern. A suitable index may lower reads but can increase writes and cache footprint. **High physical reads or read latency** may reflect cache misses, storage pressure, an oversized working set, or concurrent I/O; adding an index without understanding the bottleneck may worsen total I/O.

**High duration with low CPU** often means waiting: locks, storage, memory grants, worker scheduling, network, or client consumption. Find the wait and its scope. If requests queue for a connection, database execution may not have started; if a result is streamed slowly, the client can prolong resource usage. Do not equate elapsed time with CPU time. In SQL Server, wait types must be interpreted with the query, server load, and version; a single top wait across the whole instance is not enough to diagnose one endpoint.

**Sudden regression after deployment** suggests a changed plan, changed query, new parameter distribution, data growth, updated statistics, compatibility-level change, or workload shift. Compare Query Store history and the deployment timeline. A plan regression can sometimes be mitigated by temporarily restoring a known plan, but plan forcing should be monitored and revisited. If the underlying data or indexes changed, the former plan may cease to be appropriate.

### A safe feedback loop

Before making a change, state a falsifiable hypothesis and success criterion. For example: “This query reads most of the index because a conversion is applied to the date column; a half-open date range should reduce logical reads while returning the same rows.” Check correctness for boundaries, NULLs, duplicates, and time zones; compare plans and IO/time; then replay at realistic concurrency. If results improve in one parameter case but regress in another, the change did not solve the whole workload. Consider separate paths only when their added complexity is justified.

Use deployment guardrails: canary or staged release, alerts on latency and resource consumption, a known rollback, and a review of database-side effects such as index build duration and log growth. Keep the evidence—query identity, parameter class, plan/version, baseline, and outcome—so future tuning is not a fresh guess. This disciplined loop is more reliable than applying generic “top 10 SQL tips.”

## Related Topics

- [Query execution plans](query-execution-plan.md)
- [Indexes](indexes.md)
- [Index fragmentation](index-fragmentation.md)
- [Pagination](pagination.md)