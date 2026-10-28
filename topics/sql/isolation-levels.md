# Isolation levels

Isolation defines what a transaction can observe while other transactions read and modify data, and when concurrent writes conflict. It controls phenomena such as dirty reads, nonrepeatable reads, and phantoms, but the names do not guarantee identical implementation across engines. **The following behavior is specifically SQL Server.** Check the database's configured options and effective connection setting; an ORM's transaction boundary alone does not tell you the isolation semantics.

### SQL Server levels

- **READ UNCOMMITTED:** permits reading uncommitted changes. A transaction can observe values later rolled back, and concurrent page movement can yield missing, duplicate, or inconsistent rows. The `NOLOCK` table hint requests similar read semantics for that table; it is not “no locks.”
- **READ COMMITTED:** SQL Server's default isolation level. With `READ_COMMITTED_SNAPSHOT` off, reads generally use shared locks and can block behind writers. With RCSI on, each statement reads a committed row-versioned view as of statement start, reducing many reader/writer waits.
- **REPEATABLE READ:** shared locks on rows read are retained to transaction completion, preventing those rows from being changed and reread differently. It does not generally prevent new qualifying rows (phantoms) from appearing in a later predicate read.
- **SERIALIZABLE:** provides the strongest standard level by protecting qualifying key ranges as needed, preventing phantoms for the transaction. Range locks and longer duration can significantly increase blocking and deadlock risk; useful indexes affect how narrowly ranges can be protected.
- **SNAPSHOT:** when enabled for the database and selected for the transaction, reads see a transaction-level row-versioned view. If another transaction changes a row this transaction later tries to update, SQL Server can raise an update conflict; application logic must handle it.

RCSI and `SNAPSHOT` both use row versions but are not interchangeable. RCSI gives a consistent snapshot per statement, so two statements in one transaction may see different committed states. `SNAPSHOT` gives one versioned view for the transaction. They reduce some reader/writer blocking, but do not remove writer coordination, schema locks, or every form of blocking.

### Configuring SQL Server and using SNAPSHOT

`SNAPSHOT` requires database-level enablement, typically performed by an administrator during an appropriate change window:

```sql
ALTER DATABASE MyDatabase
SET ALLOW_SNAPSHOT_ISOLATION ON;
```

Changing database options can wait for active sessions and should be planned operationally. Once enabled, a transaction can select snapshot isolation:

```sql
SET TRANSACTION ISOLATION LEVEL SNAPSHOT;
BEGIN TRANSACTION;

SELECT Balance
FROM dbo.Accounts
WHERE AccountId = @AccountId;

-- Perform related reads and writes in this transaction.
COMMIT TRANSACTION;
```

Applications need error handling and a retry or user-facing conflict policy for update conflicts. The isolation setting is session-scoped until changed or the connection is reset; with connection pooling, verify provider behavior and avoid leaking unexpected settings between logical requests.

Row versions consume version-store resources. Depending on SQL Server configuration and version, versions are stored in tempdb or a persistent version store. Long-running transactions can retain old versions, increasing space use and delaying cleanup. Monitor the relevant store and transaction duration; switching to row versioning is not a zero-cost way to eliminate blocking.

### Anomalies and concurrency design

A dirty read sees another transaction's uncommitted write. A nonrepeatable read occurs when a row read twice changes between reads. A phantom is a new or removed row matching a repeated predicate. A lost update or write skew can arise when application logic reads a condition, computes a change, and later writes based on stale assumptions. Isolation-level labels do not replace understanding the invariant and transaction pattern.

For example, “read inventory, then decrement if positive” can race if two requests both observe one remaining unit. A conditional `UPDATE ... WHERE Quantity > 0` plus affected-row validation, backed by an appropriate constraint, often expresses the invariant more directly. Other multi-row rules may need serializable range protection, explicit locking, version checks, or an optimistic concurrency token. Choose based on correctness and measured concurrency rather than simply selecting the weakest level for speed.

In SQL Server, ordinary `READ COMMITTED` does not mean a transaction sees one stable database-wide snapshot across all statements. Conversely, `SERIALIZABLE` does not make an application correct if the operations do not encompass the full business invariant. SQL Server's lock and row-version details differ from PostgreSQL, Oracle, MySQL, and other engines. In interviews, name the exact isolation semantics, scope (statement versus transaction), conflict behavior, and resource tradeoff.

## Related Topics

- [Transactions](transactions.md)
- [Locking](locking.md)
- [Deadlocks](deadlocks.md)
- [Performance tuning](performance-tuning.md)