# Anonymous Types

Anonymous types let the compiler create an immutable, unnamed reference type with inferred, read-only properties. They are useful for short-lived projections, especially in LINQ.

```csharp
var summary = orders.Select(order => new
{
    order.Id,
    Total = order.Lines.Sum(line => line.Quantity * line.UnitPrice)
});
```

The compiler gives anonymous types structural equality within the same assembly when their property names, types, and order match. Properties cannot be reassigned, but referenced objects may still be mutable. They are local implementation details: their generated type cannot be named in a public method signature or conveniently used across assembly boundaries. For public data contracts, prefer a named class, record, or DTO.

Anonymous types do not by themselves make a query deferred or materialized; the surrounding LINQ operator determines execution. Be aware that projecting large object graphs or retaining closures can keep data alive longer than intended.

## Projection behavior and limits
The compiler synthesizes a sealed reference type from an anonymous-object initializer. Inferred property names come from member access; name computed expressions explicitly when needed. The generated properties cannot be reassigned, but immutability is shallow: a property may point to a mutable collection or entity. Equality follows the generated type's property-value semantics and is not a deep comparison of arbitrary object graphs.

Anonymous values are excellent for local LINQ projections, grouping keys, and short-lived internal shapes. They cannot be named in source signatures, so public APIs, durable domain values, and serialization contracts should use a named DTO, record, or class. Returning one as `object` or `dynamic` hides its type rather than making it a good public contract.

A projection does not itself determine when values are created. With deferred `IEnumerable<T>` operators, the selector runs as the consumer enumerates; `ToArray` or `ToList` materializes the results. Re-enumeration may create the values again and repeat upstream work. Project only the fields needed by a consumer to limit allocation and database payload. Anonymous types differ from tuples: they are generated reference types with named properties, while tuples are value types with positional/named fields and different API characteristics.
## Related Topics

- [linq.md](linq.md)
- [records.md](records.md)
- [tuples.md](tuples.md)
- [iqueryable.md](iqueryable.md)