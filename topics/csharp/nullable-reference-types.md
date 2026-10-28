# Nullable Reference Types

Nullable reference types (NRT) add compile-time null-state analysis. With nullable context enabled, `string` means the value is expected not to be null, while `string?` permits null. These annotations do not create distinct CLR runtime types or add automatic runtime checks.

```csharp
#nullable enable
public sealed class Customer(string name)
{
    public string Name { get; } = name
        ?? throw new ArgumentNullException(nameof(name));
}
```

The compiler tracks flow through assignments, checks, and attributes, producing warnings when a possibly-null value is used as non-null. A warning indicates a contract mismatch or missing proof; use validation, better annotations, or narrowly justified null-forgiving syntax rather than suppressing warnings broadly.

NRT is especially important at boundaries: JSON deserialization, database values, reflection, interop, and legacy assemblies can violate annotations. Enabling nullable analysis in an established project can surface warnings without changing runtime behavior, so migrate incrementally and fix public API contracts. `T?` for unconstrained generic parameters has nuanced constraints; distinguish nullable value types (`Nullable<T>`) from nullable-reference annotations.

## Static analysis, migration, and boundaries
Nullable reference types (NRT) add compile-time annotations and flow analysis; they do not create new CLR reference types and do not insert runtime validation. `string` expresses a non-null intent in annotated code, while `string?` permits absence. The compiler tracks assignments and branch checks, but reflection, `dynamic`, null-forgiving `!`, and unannotated libraries can bypass certainty.

Enable nullable context deliberately (often project-wide for new code) and treat warnings as actionable design information. When migrating legacy code, annotate public APIs accurately, fix warnings at their source, and use narrow `#nullable` directives only as a transition. Do not silence broad warning sets with `!`; that hides uncertainty. Libraries should annotate public API contracts so callers get useful analysis.

At deserialization, database, network, and interop boundaries, validate actual data even if the declared type is non-null. A nullability annotation is not a substitute for domain validation. `T?` has different meaning for unconstrained generic parameters and value types; nullable value types use `Nullable<T>` representation, whereas nullable reference annotations are metadata/analysis.

Interview misconception: NRT is not a runtime safety system and does not make null impossible. It reduces accidental null flows during compilation. Explain flow-state analysis, external boundaries, and the difference from `Nullable<T>` for value types.
## Related Topics

- [null-handling.md](null-handling.md)
- [system-text-json.md](system-text-json.md)
- [serialization.md](serialization.md)
- [generics.md](generics.md)