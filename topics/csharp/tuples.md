# Tuples

Value tuples (`(T1, T2)`) provide lightweight grouping of a few values without declaring a named type. Tuple element names improve readability but are not part of the runtime tuple type identity.

```csharp
static (bool Found, int Index) Find(IReadOnlyList<string> values, string target)
{
    int index = -1;
    for (int i = 0; i < values.Count; i++)
    {
        if (values[i] == target)
        {
            index = i;
            break;
        }
    }
    return (index >= 0, index);
}
```

Deconstruction can unpack a tuple into locals, and tuple equality compares corresponding elements when the types support equality. `System.ValueTuple` is a value type, so assignment copies the tuple; referenced elements inside it may still be shared. Avoid deeply nested or wide tuples in public APIs: the meaning of `(int, int, string)` is less clear than a named record or result type.

Use tuples for local multi-value results and concise projections. Prefer named domain types when values have invariants, behavior, serialization requirements, or a long-lived public contract.

## Choosing tuple shapes
Value tuples (`(int Id, string Name)`) are lightweight value types useful for returning a small related set of values locally or from a method. Names improve readability at the source level, but tuple element names are not part of runtime type identity; compatible tuple types can be assigned despite differing names, and names may be lost in some contexts. Avoid exposing large or long-lived public contracts as unnamed tuples because intent and versioning become unclear.

```csharp
static (bool Found, int Index) Find(IReadOnlyList<string> values, string target)
{
    int index = values.IndexOf(target);
    return (index >= 0, index);
}
```

Tuple assignment can deconstruct values, and `with` expressions are not the general tuple update mechanism. A tuple is mutable, so a copied tuple diverges from its source; reference-valued elements still refer to shared objects. Returning a tuple does not create an immutable DTO. For durable contracts use a named record/class with explicit semantics.

Tuples differ from anonymous types: tuples are value types with positional fields, whereas anonymous types are compiler-generated reference types with read-only named properties and generated equality. Choose according to scope, API clarity, and equality needs. Interview misconception: tuple element names are primarily compile-time metadata and do not create distinct types.
## Related Topics

- [records.md](records.md)
- [record-structs.md](record-structs.md)
- [anonymous-types.md](anonymous-types.md)
- [methods.md](methods.md)