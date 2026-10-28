# Records

Records are reference types (unless declared `record struct`) designed to model data with value-oriented equality. The compiler synthesizes equality members and supports concise construction and `with` copies.

```csharp
public sealed record Customer(string Id, string Name);

var original = new Customer("c-1", "Ada");
var renamed = original with { Name = "Grace" };
```

`with` creates a shallow copy: referenced mutable members remain shared. Records are not deeply immutable merely because positional properties are init-only. Record equality compares component values according to generated/member equality rules, which may be unsuitable for entities whose identity is a database key. Records may be inherited; consider sealing data contracts when inheritance is unnecessary.

Use records for immutable-style messages, DTOs, and values where equality by data is expected. Use classes for identity-oriented entities or where mutation/lifecycle is central. Be deliberate about serialization shape, validation, and equality when adding custom members or inheritance.

## Value equality and non-destructive updates
Records provide concise data-oriented types with synthesized equality, display, and `with` support. A record class remains a reference type: assignment copies a reference, but equality is value-oriented over record state. A record struct is a value type and copies its value. This distinction matters for aliasing, mutation, and performance; “record” does not mean “struct.”

```csharp
public sealed record Customer(string Id, string Name);
var renamed = customer with { Name = "Ada" };
```

`with` creates a shallow copy. If a record property references a mutable collection, both records may reference the same collection. Positional records synthesize properties and deconstruction, but named properties can be clearer for public APIs. Equality members may need customization when domain equality differs from the generated member-by-member behavior.

Records are useful for DTOs, messages, and immutable value-like data. They are not automatically immutable: `record class` properties can have init accessors, but nested objects can mutate; records can also declare mutable properties. Inheritance is supported for record classes with compatibility constraints, but avoid deep record hierarchies where equality behavior becomes confusing.

Do not use records just for shorter syntax if identity-based semantics are important. Interview trap: a record class still allocates as a class and is a reference type even though its equality is value based. Explain assignment behavior, equality, and shallow-copy limitations separately.
## Related Topics

- [record-structs.md](record-structs.md)
- [classes.md](classes.md)
- [anonymous-types.md](anonymous-types.md)
- [tuples.md](tuples.md)