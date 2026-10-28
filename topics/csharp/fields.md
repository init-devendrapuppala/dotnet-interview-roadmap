# Fields

A field is storage directly associated with a type or instance. Use private fields to hold implementation state, and expose behavior or properties when callers need access.

```csharp
public sealed class Cache
{
    private readonly Dictionary<string, string> _entries = new(StringComparer.Ordinal);
    public int Count => _entries.Count;
}
```

Instance fields are per object; `static` fields are shared by the type. Fields receive default values automatically, while local variables must be definitely assigned before use. `readonly` restricts reassignment after construction, but does not make an object referenced by the field immutable. `const` values are compile-time constants and can be inlined by consumers.

Public mutable fields make it difficult to validate changes, preserve invariants, or change representation compatibly. Prefer properties or methods for public APIs. For shared mutable static fields, define synchronization and initialization explicitly; `static` alone does not make access thread-safe.

## State representation and accessibility
A field stores state directly. Keep fields private or otherwise narrowly scoped so callers cannot bypass invariants; public fields also make future encapsulation changes harder without source compatibility impact. Properties provide a stable access point for validation, computed values, and API evolution. Use `readonly` when a reference/value should not be reassigned after construction, remembering a readonly reference can still point to mutable data.

Static fields are shared per closed constructed generic type and live for the process/type lifetime. Mutable static state creates cross-request coupling and concurrency concerns; immutable static data or carefully synchronized caches are safer. `const` fields are compile-time substitutions and differ in versioning behavior from `static readonly` fields. `volatile` applies to certain field types and memory access patterns, but is not a substitute for synchronization of compound state.

Field initializers run as part of object initialization before constructor bodies, with base/derived ordering that matters when constructors call virtual members. Avoid initializing fields with expensive work or side effects that make construction unpredictable. For nullable reference fields, initialize or annotate intent under nullable analysis rather than suppressing warnings without a reason.

Use a backing field when property logic needs storage; auto-properties are clearer for simple values. Interview distinction: fields represent storage, properties represent a member access contract—even when an auto-property compiler generates a backing field.
## Related Topics

- [properties.md](properties.md)
- [constants-and-readonly.md](constants-and-readonly.md)
- [encapsulation.md](encapsulation.md)
- [classes.md](classes.md)