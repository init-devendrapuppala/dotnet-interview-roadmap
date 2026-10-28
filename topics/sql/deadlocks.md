# Deadlocks

# Deadlocks

A deadlock is a cycle of dependencies: each transaction holds a resource another transaction needs, so none can proceed. It is not simply “a query waiting a long time.” A blocking chain can be long or permanent without a cycle; SQL Server's deadlock monitor detects a cycle and chooses one transaction as the victim so the others can continue.

**SQL Server:** The victim normally receives error 1205 and its transaction is rolled back. SQL Server's victim selection considers factors such as rollback cost and deadlock priority; the application must not assume a particular participant will always be chosen. The error indicates a transaction-level failure, not that only the last statement should be repeated.

### Common patterns and prevention

The classic pattern is inconsistent resource order. Transaction A updates account 1 and then account 2; transaction B updates account 2 and then account 1. Each can hold one lock while waiting for the other. Acquiring resources in a consistent order reduces that cycle. Other causes include concurrent updates through different indexes, range locks at stronger isolation, foreign-key checks, triggers, and lock conversions.

Keep transactions focused and short. Avoid user interaction, remote service calls, or long computations while database locks are held. Use selective predicates and indexes to touch fewer rows, but remember indexes create additional structures and write paths; a new index can change access order and introduce a different deadlock rather than cure one. Batch large updates carefully and test them alongside normal traffic. RCSI may reduce certain reader/writer deadlocks but does not prevent writer/writer deadlocks, schema conflicts, or all locking interactions.

Use constraints and atomic updates to enforce invariants instead of reading data and making an unprotected decision. Avoid broad table scans within transactions where a selective access path is appropriate. `NOLOCK` is not a sound fix: it permits dirty and inconsistent reads, still takes schema-stability locks, and does not eliminate all deadlocks.

### Diagnose the cycle, not just the victim

In SQL Server, collect the deadlock graph, commonly through the `xml_deadlock_report` Extended Event captured by the built-in `system_health` session. A graph identifies participating processes, statements, resource owners/waiters, lock modes, indexes or keys, and victim selection. Correlate it with application request IDs, transaction boundaries, parameter values, and query plans. A victim statement alone is not necessarily the root cause; another participant's earlier statement may have established the lock order.

Classify the resource and lock modes, identify the exact competing code paths, then decide whether the remedy is consistent ordering, a narrower access path, shorter transaction scope, changed isolation semantics, or a more explicit concurrency protocol. Validate the fix under competing requests. Deadlock graphs are different from ordinary blocking snapshots; a blocker/waiter chain without a cycle is not a deadlock.

### .NET retries and correctness

Treat error 1205 as a transient failure and retry the **whole logical transaction**, not just the final command. Use a small bounded retry count with backoff and jitter so many clients do not immediately recreate the same collision. Retried work must be safe to repeat or protected by an idempotency key/unique constraint. If the transaction has external side effects, commit them through an appropriate outbox or idempotent workflow; SQL rollback cannot undo an email or HTTP call.

Do not hide exhausted retries. Record the operation/correlation ID, retry count, relevant SQL error, and outcome while avoiding sensitive data in logs. Ensure the connection and transaction are disposed after failure, and create a fresh transaction for each retry. A timeout or broken connection during commit has different ambiguity from a confirmed 1205 rollback; do not blindly retry it as if the server definitely aborted.

Deadlock behavior and tooling are engine-specific. In interviews, distinguish deadlocks from blocking, explain how to inspect a graph, and describe safe transaction-level retry and a concrete prevention strategy rather than recommending `NOLOCK` or an unbounded retry loop.

Prevention is risk reduction rather than an absolute guarantee: triggers, foreign-key checks, background jobs, and new indexes can introduce participants or alter lock order. Reproduce the competing operation pair in a load test when possible and retain the graph as a regression case. Monitor deadlock rate after a schema or query change, since resolving one cycle can expose another contention bottleneck.

## Related Topics

- [Locking](locking.md)
- [Transactions](transactions.md)
- [Isolation levels](isolation-levels.md)
- [Indexes](indexes.md)

## Related Topics

- [Locking](locking.md)
- [Transactions](transactions.md)
- [Isolation levels](isolation-levels.md)
- [Indexes](indexes.md)