# Structs

A `struct` is a value type. Assignment and parameter passing copy its value, so structs are most effective when they are small, immutable, and semantically represent a value rather than identity.

```csharp
public readonly struct Point(double x, double y)
{
    public double X { get; } = x;
    public double Y { get; } = y;
}
```

Structs can implement interfaces and contain methods and properties, but cannot inherit from an arbitrary class (all derive from `System.ValueType`). They may be stored inline in arrays or as fields, but can also be boxed, including when converted to `object` or an interface in applicable cases. A large mutable struct can incur costly copies and surprising mutation behavior.

`readonly struct` and `readonly` members communicate immutability and can avoid defensive copies in some contexts; the compiler/runtime implementation details should not replace measurement. Structs have a default zero-initialized value, so invariants must account for `default(T)`. Use a class when shared identity or a larger mutable lifecycle is required.

## Value semantics and defensive design
A struct is a value type and assignment normally copies its fields. This is appropriate for small values whose identity is their contents, but copying a large struct can be expensive and mutable structs can produce confusing behavior when copies diverge. Prefer small, immutable structs; `readonly struct` communicates intent and avoids defensive copying in some readonly contexts, but does not make referenced objects immutable.

Structs have a default value, which may not satisfy domain invariants. Constructors cannot prevent `default(T)` from existing, so design every value type to handle its zero-initialized state or use a class when validity cannot be maintained. `record struct` adds value equality conveniences but has the same value-copy concerns.

Structs can be boxed when converted to `object` or an interface, creating an allocation and copy; generic code can avoid many such cases but not every boundary. A struct containing references copies those references, not the referenced objects. Do not infer stack placement from value-type status: fields may live inside heap objects, arrays, or other storage.

Choose a struct for domain value semantics and suitable size, not merely to avoid GC. Benchmark realistic usage, especially arrays, interface calls, and pass-by-value APIs. Interview answer: explain default values, copying, boxing, and the distinction between value semantics and physical location.
## Related Topics

- [value-types-vs-reference-types.md](value-types-vs-reference-types.md)
- [record-structs.md](record-structs.md)
- [parameter-passing.md](parameter-passing.md)
- [boxing-and-unboxing.md](boxing-and-unboxing.md)