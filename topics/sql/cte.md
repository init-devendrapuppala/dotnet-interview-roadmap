# Common table expressions (CTEs)

A common table expression gives a name to a query expression for one immediately following statement. It is useful for decomposing a complex query into readable steps, expressing recursion, or separating a window calculation from a filter. A CTE is not a table variable, temporary table, or promise that intermediate rows are computed and stored once.

**SQL Server (T-SQL):** A CTE can precede one `SELECT`, `INSERT`, `UPDATE`, `DELETE`, or `MERGE`. A semicolon before `WITH` safely terminates a preceding statement. Columns can be named in the CTE header, but the names and count must match its projection.

```sql
;WITH RecentOrders AS
(
    SELECT OrderId, CustomerId, CreatedAt, TotalAmount
    FROM dbo.Orders
    WHERE CreatedAt >= DATEADD(day, -30, SYSUTCDATETIME())
)
SELECT CustomerId, COUNT_BIG(*) AS OrderCount, SUM(TotalAmount) AS Revenue
FROM RecentOrders
GROUP BY CustomerId;
```

In SQL Server, a nonrecursive CTE is commonly expanded into the surrounding query during optimization. The optimizer can push predicates through it, reorder operations, and choose a plan based on the full statement. This can be beneficial, but referencing a CTE several times does not guarantee shared computation; the plan may repeat work. Compare the actual plan and logical reads. A temporary table can be preferable when an intermediate result is reused, should be indexed, or benefits from its own statistics. It also introduces tempdb work, extra statements, and a boundary that may limit optimization.

CTEs improve organization, not necessarily execution speed. They do not inherently fix a poor join, force a particular evaluation order, or cache a result. In SQL Server, CTE scope is limited to the single statement immediately after its definition; use a temp table or table variable for later statements. Table variables and temp tables have different statistics and optimization characteristics, so choose based on measured needs and SQL Server version.

### Recursive CTEs

A recursive CTE combines an anchor query with a recursive member using `UNION ALL`. The anchor selects starting rows; each recursive iteration consumes rows from the prior iteration and produces the next level. SQL Server stops when an iteration produces no rows or the recursion limit is reached.

```sql
;WITH OrgTree AS
(
    SELECT EmployeeId, ManagerId, 0 AS Depth
    FROM dbo.Employees
    WHERE EmployeeId = @RootEmployeeId

    UNION ALL

    SELECT e.EmployeeId, e.ManagerId, t.Depth + 1
    FROM dbo.Employees AS e
    JOIN OrgTree AS t ON e.ManagerId = t.EmployeeId
)
SELECT EmployeeId, ManagerId, Depth
FROM OrgTree
OPTION (MAXRECURSION 100);
```

The recursive join needs an appropriate index on the relationship key (here, `ManagerId`). Ensure termination and guard against cycles: a cycle can revisit nodes repeatedly until the limit or resource exhaustion. SQL Server's default recursion limit is 100; `MAXRECURSION n` sets another positive limit and `0` removes the limit, which is not a safety mechanism. Hierarchy depth and cycle-handling requirements should be explicit.

CTE syntax, recursion rules, and optimization behavior vary among database engines. In interviews, distinguish readability and recursion from materialization: a CTE is a query expression, and the execution plan—not its syntax—determines physical work.

## Related Topics

- [Query execution plans](query-execution-plan.md)
- [Indexes](indexes.md)
- [Performance tuning](performance-tuning.md)
- [Window functions](window-functions.md)
