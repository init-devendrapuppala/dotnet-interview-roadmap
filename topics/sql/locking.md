# Locking

Locking coordinates concurrent access so transactions do not overwrite or observe changes in ways forbidden by the chosen isolation semantics. It also creates contention: one session may wait for another to release a resource. For interviews and production diagnosis, distinguish **blocking** (a wait on another request) from a **deadlock** (a cycle of waits that the database must break), and distinguish both from slow execution without a lock wait.

**SQL Server (rowstore):** Locks can protect keys, pages, tables, metadata, and other resources. Common data lock modes include shared (`S`) for reads, exclusive (`X`) for modifications, and update (`U`) for certain read-before-write paths. Intent locks (`IS`, `IX`, `IU`) indicate lower-level locks held beneath a resource; they do not mean the whole table is exclusively locked. Compatibility depends on lock mode, resource, and isolation context. SQL Server can also use latches to protect in-memory page structures; a latch wait is not the same as a transaction lock wait.

### Duration, granularity, and escalation

A statement may acquire locks during execution, but write locks and locks required by higher isolation levels commonly remain until transaction completion. A read under ordinary locking `READ COMMITTED` generally releases shared locks as rows are read, while `REPEATABLE READ` retains them to transaction end. Exact behavior depends on isolation, hints, optimized locking/configuration, and statement shape. Long-running transactions can therefore block writers, readers, DDL, or maintenance long after their initial statement.

Lock granularity can be at key/row, page, or table level, among other resources. Finer granularity allows unrelated rows to proceed concurrently but needs more lock-management memory. SQL Server lock escalation can replace many fine-grained locks with a coarser lock to control overhead; it is not accurately described as “always escalates at exactly 5,000 rows.” Memory pressure, partitioning, table settings, and operation details influence it. Escalation can block unrelated work on the larger resource.

Blocking can be correct: one transaction waits so another can complete a consistent change. The goal is not to eliminate every lock but to keep waits short and scope proportional to the operation. A transaction that scans many rows because a predicate lacks an index may touch and lock more resources, increasing blocking risk.

### Enforcing a concurrent invariant

Do not implement “check then write” as two unprotected operations when concurrent sessions can invalidate the check. Put the condition in the write and verify affected rows where practical:

```sql
BEGIN TRANSACTION;

UPDATE dbo.Inventory
SET Quantity = Quantity - 1
WHERE ProductId = @ProductId
  AND Quantity > 0;

IF @@ROWCOUNT <> 1
BEGIN
    ROLLBACK TRANSACTION;
    THROW 50010, 'Item is unavailable.', 1;
END;

COMMIT TRANSACTION;
```

The update is atomic as a statement, and SQL Server coordinates concurrent modifications. A `CHECK (Quantity >= 0)` constraint can provide an additional integrity boundary. If the operation spans multiple rows or tables, define a consistent transaction and isolation strategy, check each outcome, and test competing sessions. A lock hint can be appropriate for a documented protocol, but is not a substitute for defining the invariant.

### Isolation and row versioning

SQL Server's default `READ COMMITTED` normally uses shared locks for reads when `READ_COMMITTED_SNAPSHOT` (RCSI) is off. With RCSI on, a read sees a row-versioned, statement-level consistent view and can avoid many reader/writer blocking patterns. `SNAPSHOT` gives a transaction-level versioned view when enabled, but update conflicts are possible. Row versioning shifts work to the version store; long-running readers can prevent cleanup and consume tempdb or the configured persistent version store. Row versioning does not remove all locks: writers still coordinate, schema locks still apply, and conflicts/validation remain.

Isolation options and implementation differ across database engines. Read the database's isolation settings, not just application code or a connection's assumed defaults. ORMs and connection pools can preserve or reset session settings in provider-specific ways; verify effective settings in the actual deployment.

### Diagnosis and safe design

Start with the blocked request, blocking session, wait type/resource, open transaction, and exact statement. SQL Server DMVs such as `sys.dm_exec_requests`, `sys.dm_os_waiting_tasks`, and transaction DMVs provide live context, while Extended Events can capture blocking or deadlock information. DMVs are snapshots and can change before investigation completes; capture query text, plan, session, and transaction context. Determine whether the blocker is actively doing useful work, idle with an open transaction, or waiting on another resource.

Typical improvements include reducing rows scanned, adding a justified selective index, making the transaction shorter, batching work, acquiring resources in a consistent order, and avoiding remote calls or user pauses inside a transaction. An index can reduce rows visited, but it also adds write paths and may alter lock order; test the actual concurrent workload. Consider whether RCSI is appropriate for the application’s read consistency and version-store capacity.

`NOLOCK`/`READ UNCOMMITTED` is not a general concurrency fix. It permits dirty reads and can return missing, duplicated, or internally inconsistent results during data movement; schema-stability locks still apply and DDL can block it. Hints such as `UPDLOCK`, `HOLDLOCK`, `ROWLOCK`, and `TABLOCK` change semantics or resource choices, and can introduce deadlocks or worse throughput. Use them only when their precise behavior is needed, document the protocol, and validate under concurrency.

For .NET services, keep connection and transaction scopes short, dispose promptly, and do not hold a database transaction while awaiting another service. A blocked request also occupies application threads, connections, and pool capacity, so observe both SQL waits and application saturation. Lock behavior is specific to engine, isolation, table structure, and configuration; avoid claims that all databases use SQL Server's lock modes or scheduling.

### Lock hints and common misconceptions

`UPDLOCK` asks SQL Server to use update locks for reads, which can avoid some shared-to-exclusive conversion races in a deliberate read-then-write protocol. It may serialize competing readers earlier and must be applied consistently to the relevant access. `HOLDLOCK` is equivalent to serializable semantics for the referenced table in that statement's transaction context, including possible key-range protection. `ROWLOCK` is a request, not an absolute guarantee that every operation uses row locks or avoids escalation. Hints can interact with isolation level, indexes, optimized locking, and plan choices; document why one is needed and test parallel code paths.

`NOLOCK` is often recommended as a “blocking fix,” but it changes correctness: a query can read an uncommitted value that is rolled back, miss rows, read rows more than once, or observe internally inconsistent data. It can still wait for schema modification locks because it takes schema stability locks. If a reader/writer block is the issue, consider whether RCSI or `SNAPSHOT` preserves the required consistency with acceptable version-store capacity rather than returning unreliable data.

Do not assume a “row lock” equals one logical application row or that all locks have the same lifetime. A nonclustered index key lock protects an index entry; one update may touch several indexes and foreign-key resources. A transaction can wait on metadata or schema locks even when no obvious row is being modified. Lock escalation is a resource-management decision, not an automatic sign of a defective query; repeatedly disabling escalation can exhaust lock memory or worsen performance.

### Diagnosing blockers in SQL Server

A useful capture ties together the waiting request, blocker, resource, SQL text, transaction age, and application session. `sys.dm_exec_requests` and `sys.dm_os_waiting_tasks` can show current waits; `sys.dm_tran_locks` describes granted and waiting locks; `sys.dm_exec_sessions` and `sys.dm_exec_connections` supply session context. Permissions and DMV contents vary by SQL Server version/configuration. A DMV snapshot is transient, and blindly killing a blocker can roll back a large transaction and create additional log and blocking work.

When diagnosing a recurring issue, capture blocked-process reports or targeted Extended Events when appropriate. Keep collection bounded and avoid collecting broad, high-volume events indefinitely. Correlate timestamps with application traces so that a SQL session maps to the request, endpoint, and command. A request may be blocked by another blocked request, so follow the chain to the head blocker rather than treating the first waiter as the cause.

Look at the plan for the blocked statement as well as the blocker. An unselective scan can increase lock footprint; a plan change may introduce a different access order; a lookup or foreign-key validation may wait on another index. But do not conclude that a missing index is the cause solely because one is suggested. A narrower index may improve throughput, while increasing write lock work and producing a new deadlock sequence. Validate the entire workload, not just a single execution in isolation.

### Production response and tradeoffs

During an incident, identify whether the wait is expected serialization, a long transaction, an idle open transaction, a deadlock, or a broader resource bottleneck. If a blocker must be terminated, understand rollback duration and business impact. For long-term remediation, reduce transaction duration and rows touched, define consistent access order, batch large maintenance operations, and separate remote work from the database critical section. If moving reads to row versioning, size and monitor the version store and test update conflicts and application semantics.

In SQL Server, locks protect correctness but are only one of several concurrency mechanisms. Latches, transaction log waits, worker exhaustion, and network backpressure can produce similar user symptoms. A good interview answer explains resource, scope, isolation, and duration; distinguishes blocking from deadlock; and weighs correctness against throughput. Never claim that adding `NOLOCK`, forcing row locks, or raising timeouts removes the underlying contention.

## Related Topics

- [Isolation levels](isolation-levels.md)
- [Transactions](transactions.md)
- [Deadlocks](deadlocks.md)
- [Indexes](indexes.md)