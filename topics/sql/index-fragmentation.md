# Index fragmentation

**SQL Server:** Fragmentation describes physical page layout in a rowstore index; it is not a universal score for query health. Logical fragmentation measures how often the next leaf page in key order is not the next page physically allocated. Page density (sometimes called page fullness) describes how much usable space is occupied. These are related but distinct. Low density can mean more pages read and less useful data in memory; logical order tends to matter most for large range scans when storage I/O and read-ahead are relevant.

Neither metric alone proves that rebuilding an index will improve a workload. A small index has few pages to save, a point lookup may read only a few pages, and a scan of a large share of the table may remain a scan regardless of fragmentation. Conversely, lowering density through a rebuild can make an index larger and increase cache and I/O demand. Page splits and fragmentation may reflect a write pattern, fill factor, or key design; maintenance treats symptoms and can reintroduce the same layout over time.

### Measuring before maintenance

`sys.dm_db_index_physical_stats` reports physical characteristics. Scope the request to the database and object/index of interest; `DETAILED` examines more pages and can add I/O, so a broad detailed scan across a large production database is not free. `LIMITED` is cheaper but reports less detail. Evaluate page count, index usage, range-scan frequency, page density, read latency, update volume, and query plans together. The `sys.dm_db_index_usage_stats` counters reset after events such as a service restart and are not by themselves a long-term workload history.

The commonly repeated fragmentation percentage thresholds for reorganizing or rebuilding are rules of thumb, not engine guarantees. Hardware, index size, workload, SQL Server version, storage layout, and availability constraints all affect whether maintenance pays off. Also inspect statistics freshness: stale or unrepresentative statistics can produce bad estimates even on a perfectly ordered index.

### Reorganize versus rebuild

`ALTER INDEX ... REORGANIZE` is an incremental leaf-level operation and is online in SQL Server, but it still consumes CPU and I/O and holds locks. It does not rebuild upper index levels or refresh statistics in the same way a rebuild does. `ALTER INDEX ... REBUILD` recreates the index and updates its index statistics as part of the operation, but can use substantial CPU, I/O, transaction log, and temporary space. Availability and blocking behavior depend on index type, SQL Server version/edition, and options such as online operation; online does not mean resource-free or contention-free.

```sql
ALTER INDEX IX_Orders_Customer_Created
ON dbo.Orders REORGANIZE;
```

For a rebuild, estimate space and log capacity, ensure log backups can run as expected, and review whether the operation can complete within the maintenance window. Rebuilds can change plans by changing statistics or plan cache conditions; plan review after maintenance may be warranted. Partitioned indexes may allow targeted work, but partition operations have their own restrictions and alignment requirements.

### Production strategy and misconceptions

Build a maintenance policy from observed workload and operational objectives, not a fixed job that rebuilds every index nightly. Skip tiny or unused indexes where the cost is unjustified; use appropriate statistics updates when that addresses an estimation issue. Monitor waits, blocking, log use, tempdb, and query performance after a change. Rebuilding an index does not repair non-sargable predicates, missing access paths, parameter sensitivity, a poor schema, or excessive application round trips.

SQL Server's page-level metrics and maintenance commands are vendor-specific. Other database systems use different storage engines, maintenance operations, and visibility rules. In an interview, explain which workload benefits from compact ordered pages and why the maintenance itself has resource and availability costs rather than treating a percentage threshold as a universal law.

When considering page density, remember that free space can be intentional. A lower fill factor may reduce split frequency for random inserts into a hot index, but it increases the number of pages scanned and the memory footprint. It is not a one-time permanent reservation: after a rebuild, subsequent inserts can consume that free space and the workload may fragment the index again. Choose fill factor per index only when page-split pressure is measured, not as a database-wide default. Also distinguish logical fragmentation from page splits; they are related but not identical metrics.

For partitioned tables, rebuilding only affected partitions can reduce maintenance scope and avoid rewriting cold historical data. Confirm partition alignment, locking impact, and whether the operation is supported for the specific index. On modern storage, sequential reads may still be fast despite logical fragmentation, while random I/O and memory pressure may be more consequential. Measure query reads and latency rather than assuming a lower percentage directly translates to improvement.

## Related Topics

- [Indexes](indexes.md)
- [Clustered vs. nonclustered indexes](clustered-vs-nonclustered.md)
- [Query execution plans](query-execution-plan.md)
- [Performance tuning](performance-tuning.md)