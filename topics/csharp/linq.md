# LINQ

Language Integrated Query (LINQ) provides composable operators for filtering, projection, ordering, grouping, and aggregation. Query syntax and method syntax compile to the same underlying operator calls in common cases.

```csharp
var totals = orders
    .Where(order => order.IsPaid)
    .Select(order => new { order.Id, Total = order.Lines.Sum(x => x.Amount) })
    .ToArray();
```

For `IEnumerable<T>`, standard operators execute in process. Many are deferred: `Where` and `Select` build a pipeline and run when enumerated; `ToArray`, `ToList`, `Count`, and aggregate operators generally execute immediately. Re-enumerating a deferred query may repeat work or side effects. Keep predicates/selectors pure where possible, and materialize deliberately when a snapshot or multiple passes are needed.

`IQueryable<T>` builds provider-consumable expression trees. A provider may translate only a subset of .NET operations; inspect generated SQL/requests, avoid accidental client evaluation, and project only required data. Query composition can obscure N+1 calls, repeated enumeration, or large materializations. For performance-sensitive code, inspect allocation and execution plans and compare with a clear loop where appropriate.

## Execution, translation, and performance
Method syntax composes operators such as `Where`, `Select`, `OrderBy`, and `GroupBy`; query syntax is compiler syntax that lowers to method calls for supported patterns. Most sequence operators over `IEnumerable<T>` are deferred, while terminal operations such as `ToList`, `ToArray`, `First`, and aggregates execute. `Count` may use a collection count when available, but otherwise enumerates. Re-enumerating a deferred query can redo work or repeat side effects, so materialize intentionally when a snapshot or multiple passes are needed.

Keep predicates and selectors free of side effects. A pipeline can hide expensive repeated enumeration, allocation, or a database N+1 pattern. Use `Any()` for existence rather than `Count() > 0` when the source need not be fully counted. Avoid `ToList()` after every operator; each materialization allocates and breaks streaming. Conversely, do materialize when a query source is one-shot or changing and a stable snapshot is part of correctness.

`IQueryable<T>` represents an expression for a provider to translate, not an in-memory execution plan. A provider supports only some .NET operations and can translate them differently; inspect SQL, parameters, execution plans, and round trips. Project needed columns and avoid accidentally switching to client-side evaluation for large sets. `AsEnumerable()` changes subsequent operators to in-process enumeration but does not itself fetch data until consumption.

LINQ improves composability, not guaranteed speed. In hot loops, benchmark representative data and compare with a clear loop before optimizing. Explain which provider executes a query and when it runs; those are more important than memorizing syntax.
## Database query hygiene
In ORM-backed code, a seemingly concise expression may cause multiple queries, load more columns than needed, or execute client-side. Keep provider execution visible and inspect SQL or HTTP requests during review. Apply filtering, projection, ordering, and paging before materializing. Beware navigation-property access inside a loop, which can create N+1 round trips depending on loading configuration. A projection to an anonymous/DTO shape can reduce transfer and tracking overhead.

The boundary between `IQueryable<T>` and `IEnumerable<T>` is important. `AsEnumerable()` changes subsequent operators to in-process LINQ; it does not automatically materialize, but a later enumeration causes the provider results to stream/fetch and execute client operators. `ToList()` eagerly buffers all results. Use the transition intentionally and consider cancellation/async terminal operators in provider APIs.

For in-memory LINQ, deferred execution means exceptions can occur during enumeration, not where the query variable was declared. An iterator can also observe source mutations between construction and consumption. Avoid keeping a query beyond the context or stream lifetime it depends on. Terminal operators such as `First` have different empty-input behavior from `FirstOrDefault`; choose based on whether emptiness is an error or valid outcome.

Profile allocation, CPU, and database round trips. LINQ is not inherently slow, and a hand-written loop is not automatically faster; optimize the actual bottleneck while preserving query semantics. Test query shape and edge cases such as empty sequences, null elements, and duplicate keys.
When a pipeline has multiple ordering operators, remember that ordering generally requires buffering and can consume memory proportional to the sequence. Grouping similarly materializes groups. Streaming `Where`/`Select` pipelines are often lazy, but terminal operators can force full consumption. For unbounded or very large sequences, choose operators that can produce results incrementally and avoid accidental sorting or grouping. Test both result correctness and query count when a LINQ provider sits behind the query.
## Related Topics

- [ienumerable.md](ienumerable.md)
- [iqueryable.md](iqueryable.md)
- [expression-trees.md](expression-trees.md)
- [lambda-expressions.md](lambda-expressions.md)