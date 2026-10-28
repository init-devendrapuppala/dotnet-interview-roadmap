# Joins

A join combines rows from relations according to a predicate. In relational terms, it can increase, reduce, or preserve row count depending on the relationship and join type. Before writing one, state the grain of each input and expected output. If a parent has many children, joining parent to child produces one row per matching child, not one row per parent.

```sql
SELECT c.CustomerId, o.OrderId
FROM dbo.Customers AS c
LEFT JOIN dbo.Orders AS o
  ON o.CustomerId = c.CustomerId
 AND o.Status = 'Open';
```

An `INNER JOIN` returns matching row pairs and discards unmatched rows. A `LEFT JOIN` retains every left-side row and returns NULLs for right-side columns when no match exists. A `FULL OUTER JOIN` retains unmatched rows from both sides; a `CROSS JOIN` produces every possible pair. An omitted or incomplete join predicate can unintentionally cause a Cartesian multiplication.

### Predicate placement and NULL behavior

For an outer join, a right-side filter in `ON` restricts which rows can match while preserving unmatched left rows. Moving it to `WHERE` filters the joined result after NULL extension, commonly dropping unmatched rows:

```sql
-- Keeps every customer, with only open orders matched.
SELECT c.CustomerId, o.OrderId
FROM dbo.Customers AS c
LEFT JOIN dbo.Orders AS o
  ON o.CustomerId = c.CustomerId
 AND o.Status = 'Open';

-- Only customers with an open order remain.
SELECT c.CustomerId, o.OrderId
FROM dbo.Customers AS c
LEFT JOIN dbo.Orders AS o ON o.CustomerId = c.CustomerId
WHERE o.Status = 'Open';
```

The second query behaves like an inner join for that condition. This is sometimes intended, but should be deliberate. SQL comparisons involving NULL are unknown, not true; `NULL = NULL` does not match. If null-safe matching is required, express it explicitly and consider the resulting access path. In SQL Server, `IS [NOT] NULL` is the appropriate test for nullness.

### Cardinality and correctness

A customer with three orders appears three times after a customer-orders join. When multiple one-to-many relationships are joined, their rows can multiply: two orders and four support cases can produce eight customer-level combinations. This can inflate `SUM` and `COUNT`. Validate uniqueness constraints and foreign keys, group at the intended grain, or aggregate child relations separately before joining. `DISTINCT` can remove some duplicate projections, but may hide an incorrect relationship and incur sort/hash cost.

Join on the complete logical key, not just a convenient column. Composite relationships may require multiple predicates. Mismatched data types, collations, or implicit conversions can make comparisons incorrect or prevent efficient index access. A foreign key supports data integrity, but SQL Server does not automatically create an index on its referencing column; consider that index based on joins, deletes, and updates.

### Physical implementation

The optimizer can implement a logical join with nested loops, hash, or merge operators. Nested loops often work well when the outer input is small and the inner side has a useful index. Hash joins can efficiently match larger unsorted inputs but need memory and may spill. Merge joins need compatible ordered inputs, which can come from indexes or explicit sorts. SQL Server chooses based on cardinality estimates, available access paths, memory, and cost; written join order does not normally dictate the physical algorithm.

An index on join keys can help, but a scan and hash join may be cheaper for a large fraction of a table. Inspect actual plans and row counts, and compare estimated to actual cardinality. Engine syntax and optimizer behavior differ; do not assume one vendor's join hints, NULL semantics, or plan rules transfer unchanged.

### Existence checks and anti-joins

If the question is whether at least one related row exists, `EXISTS` often communicates that intent more clearly than joining and deduplicating:

```sql
SELECT c.CustomerId
FROM dbo.Customers AS c
WHERE EXISTS
(
    SELECT 1
    FROM dbo.Orders AS o
    WHERE o.CustomerId = c.CustomerId
);
```

The optimizer may implement this as a semi-join and stop once a match is established, though the chosen plan depends on estimates and indexes. For rows with no match, `NOT EXISTS` is often safer than `NOT IN` when the subquery can return NULL, because NULL can make `NOT IN` evaluate as unknown. These are semantic choices first; inspect plans after confirming equivalent NULL behavior.

## Related Topics

- [GROUP BY](group-by.md)
- [Indexes](indexes.md)
- [Query execution plans](query-execution-plan.md)
- [Normalization](normalization.md)