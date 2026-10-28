# Transactions

A transaction groups database operations into one unit with atomic commit or rollback. ACID describes atomicity, consistency, isolation, and durability, but “consistency” is not an automatic guarantee that every business rule is implemented: constraints and transaction logic must represent the invariants. A transfer that debits one account and credits another is incomplete if either update can commit without the other.

**SQL Server (T-SQL):** Use an explicit transaction when multiple statements must succeed or fail together. Keep the scope as small as correctness allows: open transactions can retain locks, block other sessions, retain row versions, and contribute to transaction-log growth.

```sql
SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    UPDATE dbo.Accounts
    SET Balance = Balance - 25
    WHERE AccountId = 1 AND Balance >= 25;

    IF @@ROWCOUNT <> 1
        THROW 50001, 'Debit was not applied.', 1;

    UPDATE dbo.Accounts
    SET Balance = Balance + 25
    WHERE AccountId = 2;

    IF @@ROWCOUNT <> 1
        THROW 50002, 'Credit was not applied.', 1;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
```

The conditional debit illustrates enforcing an invariant in the write itself rather than first reading a balance and assuming it cannot change. Production code should also decide how to handle same-account transfers, missing destination accounts, and domain-specific failure results. Prefer constraints (for example, `CHECK (Balance >= 0)`) when they can enforce a rule directly, in addition to transaction logic.

### SQL Server error and nesting behavior

`SET XACT_ABORT ON` causes many run-time errors to terminate and roll back the transaction; it is useful for data modifications, but not every error is catchable or behaves identically. `TRY/CATCH` lets code clean up and rethrow. `XACT_STATE()` returns whether there is no active transaction, a committable one, or an uncommittable one that can only be rolled back. Do not issue `COMMIT` from a catch block merely because `@@TRANCOUNT` is nonzero.

SQL Server nested transactions are not independently nested scopes. An inner `BEGIN TRANSACTION` increments `@@TRANCOUNT`; `COMMIT` decrements it but does not make work durable until the outermost commit. A full rollback generally aborts the whole transaction. Savepoints (`SAVE TRANSACTION`) allow partial rollback in supported circumstances, but do not create independent durability and cannot resolve every doomed transaction state.

The transaction boundary determines when locks and log records are retained. A slow external HTTP call, user interaction, or long computation inside a transaction increases contention and failure exposure. Avoid assuming that a database transaction can atomically include an unrelated service; use an explicit distributed transaction design only where supported and appropriate, or design a saga/outbox workflow with idempotent steps.

### .NET transaction lifecycle and retries

With ADO.NET, the connection must remain open and every participating command must use the same `SqlTransaction`. Commit or roll back explicitly and dispose resources reliably. EF Core `SaveChanges` is transactional for many relational providers in common cases, but multiple calls or raw commands may require an explicit transaction; verify provider behavior and enlistment. Do not keep a transaction open while awaiting unrelated network work.

A timeout or lost connection during commit can leave the client uncertain whether the server committed. Retrying blindly can duplicate a payment or order. Use idempotency keys, unique constraints, a durable operation identifier, or a read-after-reconnect reconciliation path. Retrying after a deadlock is different: SQL Server selects a victim and rolls back that transaction, so retry the entire logical unit with bounded backoff.

Transactions may also span multiple resources through distributed transaction coordination, which introduces infrastructure, availability, and operational complexity. Keep the database transaction focused on database invariants whenever possible. Isolation levels and locking determine concurrent visibility and conflicts; transaction atomicity by itself does not prevent lost updates or check-then-write races.

The log is part of transaction durability and recovery, so a long-running or large transaction can prevent log truncation and increase disk consumption. A transaction that performs a large batch may need controlled chunking, but chunking changes atomicity: earlier batches may commit even if a later one fails. Design restartability and checkpoints explicitly rather than calling a batch “atomic” after splitting it. For SQL Server, monitor log utilization and active transaction age during large data changes, and size log capacity and backup cadence for the operation.

Avoid holding a transaction open while waiting on user input or an external dependency. If business workflow spans minutes or services, persist a state transition and use a durable process/outbox instead of reserving database locks for the entire workflow. This preserves a clear atomic boundary around each database state change while allowing recovery and compensation at the workflow level.

## Related Topics

- [Isolation levels](isolation-levels.md)
- [Locking](locking.md)
- [Deadlocks](deadlocks.md)
- [Stored procedures](stored-procedures.md)