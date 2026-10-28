# Indexes

An index is an additional access structure that can reduce the rows and pages a query must examine. The tradeoff is paid continuously: indexes consume storage and memory, require transaction-log activity, and add work to inserts, deletes, and updates. Good indexing is therefore a workload design problem, not a goal of maximizing index count.

**SQL Server:** Common rowstore indexes are B-trees. A clustered index stores table rows at its leaf level; a nonclustered index stores keys and row locators separately. SQL Server also supports columnstore indexes for analytics, which use a different compression and access model. Do not assume one index type or database engine's behavior describes all others.

### Keys, order, and access paths

A B-tree can efficiently locate a range by its leading key columns. Column order matters because the index is ordered lexicographically. An index on `(CustomerId, CreatedAt)` can support a seek on `CustomerId`, and often on both customer and date; it usually cannot efficiently seek on `CreatedAt` alone because entries are not globally ordered by date. This is the left-prefix concept, not a prohibition against using a later column for residual filtering or scanning.

```sql
CREATE INDEX IX_Orders_Customer_CreatedAt
ON dbo.Orders (CustomerId, CreatedAt DESC)
INCLUDE (Status, TotalAmount);
```

The index may support a customer/date filter and return `Status` and `TotalAmount` without looking up the base row. Key columns contribute search and ordering order; `INCLUDE` columns are leaf-level payload, not seek or sort keys. A covering index can avoid many key lookups, but making it wide increases page count, cache pressure, write amplification, and maintenance. Add only columns that serve measured queries.

Key order should follow predicates and required ordering, not a formula applied blindly. Equality predicates often precede a range predicate when the query workload supports that sequence. Multiple equality predicates may have different selectivity and reuse patterns. Filters, joins, grouping, and ordering all affect the design, as does whether the query returns a small or large fraction of the table. Validate candidate indexes with representative data and actual plans.

### Seek, scan, and selectivity

An index seek is not inherently faster than a scan. If a query returns a large percentage of rows, many random lookups through a nonclustered index may cost more than a sequential scan. A scan can be the correct and efficient plan. Conversely, a selective predicate that reads a few pages may benefit from an index. Evaluate actual logical reads, CPU, elapsed time, memory, and concurrency—not operator names alone.

Selectivity describes how many rows a predicate matches. An index on a low-cardinality status column may be useful when paired with other keys, when a filtered index targets a small subset, or when it supports ordering; its low cardinality does not automatically make it useless. Cardinality estimation relies on statistics, which summarize distributions imperfectly. Skew, correlated columns, stale stats, and parameter values can change plan quality. Adding an index cannot compensate for every estimate problem.

### Sargability and expression design

A searchable predicate gives the optimizer a useful relationship between a column and a search value. Applying a function or incompatible conversion to the indexed column can prevent an efficient seek:

```sql
-- Often prevents an efficient seek on CreatedAt:
WHERE CONVERT(date, CreatedAt) = @OrderDate

-- A half-open range keeps the column unwrapped:
WHERE CreatedAt >= @OrderDate
  AND CreatedAt < DATEADD(day, 1, @OrderDate)
```

The rewrite assumes `@OrderDate` and the column's time-zone/business semantics are appropriate. Avoid converting blindly: data types, time zones, precision, and inclusive/exclusive boundaries matter. Implicit conversions on a column, particularly across join keys, can cause scans or incorrect comparison behavior. Match parameter types to column types in SQL and .NET.

Leading-wildcard searches such as `LIKE '%term'` generally cannot use an ordinary B-tree seek. Full-text search, a different data model, or a separately maintained normalized search column may suit that requirement. Computed-column indexes in SQL Server have determinism, precision, ownership, and session-setting requirements; persisted computed columns have storage costs. Verify the exact rules for the targeted SQL Server version.

### Filtered, unique, and included columns

A filtered index stores only rows satisfying a stable predicate, for example active records or rows awaiting processing. It can reduce storage and maintenance, but the query predicate must let SQL Server prove that qualifying rows are contained in the index. Parameterization and parameter values can affect that proof. Filtered indexes have restrictions on expressions and key definitions; test the actual parameterized query rather than assuming it will use the filter.

Use a unique constraint or unique index to enforce a real uniqueness rule. This is both a correctness guarantee under concurrent writes and useful metadata to the optimizer. SQL Server implements a unique constraint with a unique index. A filtered unique index can express conditional uniqueness, such as one active row per entity, if its filter exactly represents the rule. Remember vendor-specific NULL behavior and specify the desired treatment.

### Write costs, design, and maintenance

Every additional index must be maintained as indexed values or row locators change. Wide keys, overlapping indexes, and indexes with frequently updated included columns can make write-heavy workloads slower, enlarge backups, increase log volume, and evict useful data from memory. Indexes can also increase lock/latch activity and deployment or maintenance time. Foreign-key columns are not automatically indexed in SQL Server; choose an index when join or referential actions need one.

Review overlap before adding another index. One broader index can sometimes replace multiple narrower ones, but may be too large or have the wrong leading key. Conversely, a narrowly filtered index can be valuable for a high-volume hot subset. Use Query Store, index usage DMVs, plan evidence, and workload measurements. Usage counters reset and should be interpreted with uptime and workload history; do not drop an index merely because a short observation window shows no reads.

Index rebuild/reorganize decisions are covered separately: fragmentation percentage alone does not determine value. Statistics maintenance, partitioning, fill factor, online operations, and compression each have costs and constraints. Test changes with production-like data and write/read concurrency; measure before and after and monitor regressions.

### A practical design sequence

Start from the slow statement and its actual execution plan, not from a generic column list. Record predicates, join keys, requested ordering/grouping, projected columns, frequency, selectivity, and modification rate. Check existing indexes and statistics first. Propose a key that supports the most valuable predicates and ordering, then consider only the smallest set of included columns needed to avoid expensive lookups. A covering index is not automatically best if it substantially increases the size and maintenance burden.

For multi-column indexes, test the leading key against the full workload. If `CustomerId` equality is common and date is a range, `(CustomerId, CreatedAt)` is a candidate; if most queries filter only by date, that same index may not be the best access path. A single “universal” index rarely supports every predicate combination efficiently. Parameterized queries also matter: a filtered index on `Status = 'Pending'` may be usable for a literal predicate, while a parameterized status may prevent the optimizer from proving at compile time that the query is covered. Verify under the application's parameterization and actual plan.

SQL Server index options such as `FILLFACTOR`, compression, partitioning, and online rebuild change space use, write cost, and operational behavior. Fill factor can reserve free space for future inserts but does not permanently prevent page splits, and a lower density increases pages read. Compression can reduce I/O and memory footprint at additional CPU cost. Partitioning can ease targeted maintenance and data lifecycle operations, but does not automatically make a query faster; predicates and partition alignment determine whether partition elimination is possible. Evaluate these options with real workload measurements and supported-version/edition limits.

For analytical workloads, a columnstore index stores data in compressed column segments and can accelerate scans and aggregations over many rows. It is not a drop-in replacement for rowstore point lookups or high-frequency single-row updates; SQL Server supports different clustered/nonclustered columnstore designs and batch-mode behavior depending on version and workload. Choose based on access pattern, load cadence, and query plan evidence.

Deployment planning is part of index design. Building an index on a large table may block access or consume significant log, CPU, I/O, and disk. Online index operations have version, edition, index-type, and operation restrictions and still use resources and locks. Check space for the new structure and sort work, log growth, replication/availability impact, maintenance windows, and rollback options before deploying. A technically useful index that cannot be created safely in production is not a complete design.

### Interview approach

Explain the query pattern first: predicates, joins, output columns, ordering, expected selectivity, and update frequency. Then propose the smallest supporting index and describe its tradeoffs. State that composite order matters, `INCLUDE` covers output rather than searching it, unique constraints protect integrity, and an optimizer may choose a scan over a seek. Never promise that adding an index or seeing an index seek makes a query fast. SQL Server details such as filtered indexes, clustered row locators, and statistics behavior are dialect/engine-specific; other relational systems use different structures and optimizer rules.

## Related Topics

- [Clustered vs. nonclustered indexes](clustered-vs-nonclustered.md)
- [Index fragmentation](index-fragmentation.md)
- [Query execution plans](query-execution-plan.md)
- [Performance tuning](performance-tuning.md)