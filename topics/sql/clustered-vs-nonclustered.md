# Clustered vs. nonclustered indexes

**SQL Server:** A clustered index is the table's rowstore B-tree: its leaf level contains the data rows. A table can have at most one clustered index because the same rows cannot have two different clustered leaf organizations. A table without a clustered index is a heap. A nonclustered index is a separate B-tree whose leaf entries contain its key, any included payload, and a row locator that identifies the base row.

```sql
CREATE UNIQUE CLUSTERED INDEX CX_Orders_OrderId
    ON dbo.Orders (OrderId);

CREATE NONCLUSTERED INDEX IX_Orders_Customer_Created
    ON dbo.Orders (CustomerId, CreatedAt DESC)
    INCLUDE (Status, TotalAmount);
```

For a clustered table, a nonclustered index uses the clustered key as its row locator. For a heap, it uses a RID (file, page, slot). A query that finds a nonclustered entry but needs columns absent from the index may perform a key lookup against the clustered index or a RID lookup against a heap. Many lookups can be more expensive than scanning, so covering an important query may help—but wider indexes increase storage and write cost.

### Choosing a clustered key

The clustered key should fit the table's access patterns and operational needs: commonly narrow, stable, unique, and useful for frequently ranged or ordered access. It need not be a surrogate identity by rule. A natural key may be appropriate when narrow and immutable; a random, wide natural key often is not. SQL Server can add a uniqueifier for duplicate values in a nonunique clustered index, but declaring the index unique when the data model requires uniqueness makes the intent explicit and avoids that overhead.

Because the clustered key is propagated into nonclustered indexes, a wide key multiplies storage and can reduce cache efficiency. A changing clustered key also changes row location and can cause maintenance across nonclustered indexes. An increasing identity or sequential key often reduces random page splits, but concentrated inserts at the last page can create latch contention at high concurrency. A random GUID distributes inserts but can cause page splits and larger indexes. Sequential GUIDs, partitioning, fill factor, or alternative key designs each have tradeoffs; measure the write pattern rather than treating one key as universally correct.

### Heaps, order, and plan behavior

A clustered index does not guarantee query result order. Physical layout and B-tree key order are not a SQL result-order contract; use `ORDER BY` for deterministic output. A heap may be appropriate for staging or load-heavy tables with short lifetimes, but forwarded records can occur when an updated row no longer fits on its page. Heap scans, forwarded fetches, and nonclustered RID maintenance can affect reads and updates. Rebuilding or adding a clustered index changes the table structure and may rebuild nonclustered indexes.

Clustered indexes can efficiently support range predicates and ordering that match the leading keys. Nonclustered indexes can offer targeted access paths and can include columns with `INCLUDE`; included columns are leaf payload, not search or ordering keys. SQL Server also has columnstore indexes with different storage and workload characteristics; the rowstore comparison here does not apply to them.

The choice also affects how a nonclustered index is maintained. If a clustered key is updated, the row's locator changes in each nonclustered index; this is one reason to favor a stable clustering key. Nonclustered indexes do not automatically copy every clustered key column as a separately declared key, but the clustered locator is present at the leaf when needed. For a nonunique nonclustered index, SQL Server may add locator columns internally to make entries unique. Inspect actual index definitions and size rather than estimating storage from declared columns alone.

### Deployment and tradeoffs

Creating or changing a clustered index on a large production table can consume substantial transaction log, I/O, CPU, and temporary disk space. It may block readers or writers unless an online operation is supported and selected for the SQL Server version, edition, index type, and operation. Rebuilding can affect plans, statistics, and availability. Review foreign keys, dependent indexes, disk headroom, log backups, maintenance windows, and rollback strategy before deployment.

In interviews, avoid saying “clustered means physically sorted on disk,” “the clustered key is the primary key,” or “a clustered index makes queries ordered.” The accurate SQL Server description is the organization of the rowstore leaf level, with result ordering guaranteed only by `ORDER BY`. Other database engines use different terminology and physical structures.

## Related Topics

- [Indexes](indexes.md)
- [Index fragmentation](index-fragmentation.md)
- [Query execution plans](query-execution-plan.md)
- [Performance tuning](performance-tuning.md)