# Stored procedures

**SQL Server (T-SQL):** A stored procedure is a named server-side entry point for statements and control flow. It can provide a stable interface, encapsulate permissions, centralize data operations, and reduce application/database round trips. It is not inherently faster than parameterized SQL from a .NET client: both may use cached plans, and the same schema, query shape, estimates, and workload determine execution cost.

```sql
CREATE OR ALTER PROCEDURE dbo.GetOrdersForCustomer
    @CustomerId int,
    @FromDate date
AS
BEGIN
    SET NOCOUNT ON;

    SELECT OrderId, CreatedAt, TotalAmount
    FROM dbo.Orders
    WHERE CustomerId = @CustomerId
      AND CreatedAt >= @FromDate;
END;
```

`CREATE OR ALTER` is available in supported SQL Server versions; deployment scripts must account for the minimum supported version. Use explicit schemas, stable parameter types, and intentional result shapes. Application code should consume named columns rather than depend on column position or accidental extra result sets. A query result has no guaranteed row order unless its `SELECT` includes `ORDER BY`.

### Security and dynamic SQL

Grant an application execution rights to needed procedures rather than broad table permissions when that fits the security design. SQL Server ownership chaining can allow access through a procedure without granting callers direct table rights, but dynamic SQL and cross-database execution can change permission behavior. Test the actual principal and deployment model.

Use parameters for values. Parameterization prevents values from becoming executable SQL and also improves plan reuse. Identifiers—table names, sort directions, and column names—cannot be supplied as ordinary parameters. If dynamic SQL is genuinely needed, use a strict allow-list for identifier choices, quote validated identifiers with `QUOTENAME`, and pass data values through `sp_executesql` parameters. Never concatenate untrusted input into executable text.

### Plans, errors, and transaction ownership

SQL Server may cache plans for procedure statements. When parameter values have skewed distributions, a plan compiled for one value can be poor for another (parameter sensitivity/sniffing). Diagnose with Query Store, actual plans, and representative values before changing the procedure. `OPTION (RECOMPILE)`, dynamic SQL, or other mitigations have compile and cache tradeoffs; none is a universal fix.

`SET NOCOUNT ON` suppresses per-statement row-count messages and is commonly used for application-facing procedures. Procedures do not create an automatic transaction boundary. Define whether the caller or procedure owns the transaction, what happens on error, and how nested calls participate. SQL Server's nested `BEGIN TRANSACTION` increments `@@TRANCOUNT`; an inner `COMMIT` only decrements the count, while a full `ROLLBACK` generally rolls back the outer transaction unless a savepoint is used. Use `TRY/CATCH`, `XACT_STATE()`, and `THROW` where appropriate, and ensure the calling connection does not retain an unexpected open transaction.

### Calling from .NET

With ADO.NET, set `CommandType.StoredProcedure`, supply typed `SqlParameter` values, and pass the same `SqlTransaction` to each command participating in the transaction. Parameter size, precision, and scale should match column definitions; mismatches can cause implicit conversions or poor plans. Dapper and EF Core provide different mapping and execution APIs, but do not alter SQL Server's locking, transaction, or optimizer semantics. Return clear status through result sets, output parameters, or return codes instead of relying on provider-specific message behavior.

A procedure can reduce round trips by batching related work, but excessive server-side control flow can obscure ownership and complicate testing. Keep logic observable, test permissions and concurrency, and measure client-to-server latency as well as query execution. Other engines have different procedural languages, plan caching, permissions, and exception semantics.

Procedures can return multiple result sets, output parameters, and a return status, but these interfaces should be deliberate and documented. A SQL Server procedure return code is conventionally an integer status, not a substitute for returning a query's data. Avoid returning debug result sets or relying on row-count messages as an API contract. When evolving a procedure, consider compatibility with deployed client versions and schema-bound consumers.

Deployment should be repeatable and transactional where appropriate: create or alter the procedure through versioned migrations, grant permissions explicitly, and test under the same execution principal used by the application. Avoid embedding environment-specific credentials or database names in procedure bodies. If a procedure calls another procedure, document who owns the transaction and how errors propagate so a caller can safely handle partial outcomes.

## Related Topics

- [Transactions](transactions.md)
- [Performance tuning](performance-tuning.md)
- [Query execution plans](query-execution-plan.md)
- [Indexes](indexes.md)