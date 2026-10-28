# IQueryable<T>

`IQueryable<T>` represents a query as an expression tree plus a provider. Operators usually extend that tree; execution occurs when a terminal operation enumerates or materializes it.

```csharp
IQueryable<Customer> query = db.Customers
    .Where(customer => customer.IsActive);
var names = await query.Select(customer => customer.Name).ToListAsync();
```

The provider decides how the expression is executed—often translated to SQL or a remote query. A lambda accepted by `IQueryable` is typically captured as an expression tree, unlike the delegate used by `IEnumerable`. Translation support varies; a method that works in memory may fail translation or cause client-side evaluation.

Keep query construction separate from execution when useful, but avoid returning an `IQueryable` across layers without clear ownership of its context, lifetime, and translation contract. Materialize before disposing a database context. Watch for N+1 requests, over-fetching, unbounded results, and accidental repeated execution. Do not assume `IQueryable` is always remote or faster.

## Provider execution and query boundaries
`IQueryable<T>` exposes an expression tree plus a query provider. Operators usually build a larger expression rather than immediately running it. Enumeration or a terminal operator asks the provider to execute; the provider may translate the expression to SQL, a remote API, or another execution strategy. The same C# expression can therefore have provider-specific behavior and supported operator limits.

Keep provider queries within the provider-aware portion of the pipeline. Calling `AsEnumerable()` changes later LINQ operators to `IEnumerable<T>` and executes them in-process when enumerated; it can unintentionally pull a large result set into memory. Project only required fields and apply filtering/paging before crossing that boundary. Inspect generated commands and query plans for N+1 behavior, client evaluation, and parameterization. Avoid assuming a LINQ query is one database round trip.

Expression trees represent code as data; they are not simply delegates. A provider may reject arbitrary method calls or translate their semantics differently, so test important queries against the actual provider/database. Deferred query objects may outlive a DbContext or other source resource and then fail when executed; materialize within the valid lifetime when needed.

Use `IQueryable<T>` at provider-aware composition boundaries, not as a universal return type for application APIs. Returning it can let callers change execution and resource lifetime in unexpected ways. `IEnumerable<T>` signals in-process iteration; `IQueryable<T>` signals provider-controlled interpretation. This distinction is a frequent interview focus.
## Related Topics

- [linq.md](linq.md)
- [ienumerable.md](ienumerable.md)
- [expression-trees.md](expression-trees.md)
- [serialization.md](serialization.md)