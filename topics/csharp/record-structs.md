# Record Structs

A `record struct` is a value type with synthesized value-oriented equality and record conveniences such as `with`. Use it for small value-like data where copy semantics are appropriate.

```csharp
public readonly record struct Money(decimal Amount, string Currency);

var subtotal = new Money(12m, "USD");
var adjusted = subtotal with { Amount = 15m };
```

The `readonly` form communicates immutability and prevents ordinary mutation of its fields/properties, though referenced objects can still be mutable. A record struct is copied on assignment and parameter passing; larger values or frequent copies can cost more than references. All structs can have a default value, which may violate intended invariants (for example, a null currency).

Value equality is useful for coordinates, identifiers, and measurements, but define equality and validation carefully for domain values. Prefer a record class when reference identity or large mutable state is needed. A `with` expression copies the struct value; it is not a deep clone of referenced members.

## Value semantics and copying
A `record struct` is a value type with record-style value equality and convenient generated members. It is suitable for small data values whose identity is the combination of their fields, such as coordinates or a compact key. Unlike record classes, record structs are copied on assignment and passed by value unless modifiers change that; large structs can therefore increase copying cost, while readonly structs/`in` parameters may help when measured.

Record structs can be mutable unless declared `readonly`. Mutability plus value copying is surprising: changing one copy does not update another, and a mutable struct used as a dictionary key can violate hash lookup if modified after insertion. Prefer `readonly record struct` for immutable value objects, but remember that referenced members may still point to mutable objects.

The compiler synthesizes equality and formatting based on record members, but this is not deep immutability or domain validation. Primary-constructor syntax is concise; add validation where invariants require it. `with` creates a modified copy, not an in-place mutation, but shallowly copies references.

Choose a record struct only when value semantics are correct and its size/lifetime suit the workload. Do not use it just to avoid GC allocations without measuring; copying and boxing at interface/object boundaries can offset benefits. Interview comparison: record class has reference identity/storage behavior with value equality; record struct has value-copy semantics and value equality.
## Related Topics

- [records.md](records.md)
- [structs.md](structs.md)
- [value-types-vs-reference-types.md](value-types-vs-reference-types.md)
- [tuples.md](tuples.md)