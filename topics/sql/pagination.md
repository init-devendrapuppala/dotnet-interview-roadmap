# Pagination

Pagination returns a bounded slice of an ordered result. It is an API and data-consistency decision as much as a query-syntax choice: determine whether callers need arbitrary page jumps, efficient sequential navigation, or a stable view while data changes.

**SQL Server (T-SQL):** `OFFSET/FETCH` requires `ORDER BY`. The ordering should be unique and deterministic; append a unique key when the primary sort column can tie.

```sql
SELECT OrderId, CreatedAt, TotalAmount
FROM dbo.Orders
ORDER BY CreatedAt DESC, OrderId DESC
OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
```

Offset pagination fits page-number interfaces and supports jumping directly to later pages. It has two important costs. First, the engine may need to locate and discard all preceding rows, so work generally grows with the offset even if the requested page is small. Second, inserts or deletes before the current boundary can shift later pages between requests, yielding duplicates or omissions. A repeatable order solves nondeterministic ties, but does not freeze a changing dataset.

Validate `@Offset` and `@PageSize` as nonnegative, bounded values at the application/API boundary. A huge page size or offset can consume substantial database and network resources. An index that starts with filters and then matches sort keys may avoid a large sort and help locate the page; verify whether the actual plan reads the expected number of rows.

### Keyset (seek) pagination

For next/previous navigation, keyset pagination remembers the last sort key and asks for rows beyond it. For descending `(CreatedAt, OrderId)` order:

```sql
SELECT TOP (@PageSize) OrderId, CreatedAt, TotalAmount
FROM dbo.Orders
WHERE CreatedAt < @LastCreatedAt
   OR (CreatedAt = @LastCreatedAt AND OrderId < @LastOrderId)
ORDER BY CreatedAt DESC, OrderId DESC;
```

The unique tie-breaker is essential; without it, rows sharing a timestamp can be skipped or repeated. A matching index such as `(CreatedAt DESC, OrderId DESC)` can support a seek and ordered read. The disjunction may be transformed differently depending on SQL Server version and plan; compare plans and consider equivalent lexicographic predicates carefully. Preserve exact data types and sort directions between requests.

Keyset paging often has more stable cost for deep navigation and is less affected by rows inserted before the cursor. It cannot naturally jump to page 500 without a cursor, and changes to sort keys can still move rows across the cursor. Deletions can make fewer rows appear; this is normally acceptable for a live feed but not for a report requiring a frozen result.

### Consistency and application design

Separate HTTP requests do not share one database transaction. If a workflow requires identical membership across pages, define a stable boundary (for example, capture a maximum key/time) or materialize the result; a snapshot transaction works only while the same database transaction remains open and is usually unsuitable across long user sessions. Long transactions retain locks or row versions and consume resources. Encode cursor values safely and validate them, but use SQL parameters for values rather than concatenating them into SQL.

Pagination syntax and optimizer behavior vary by engine. Do not equate SQL Server `OFFSET/FETCH`, `TOP`, or keyset patterns with every database dialect. Interview answers should discuss ordering, data changes, indexes, and the difference between random access and sequential traversal—not just syntax.

## Related Topics

- [Indexes](indexes.md)
- [Query execution plans](query-execution-plan.md)
- [Isolation levels](isolation-levels.md)
- [Performance tuning](performance-tuning.md)