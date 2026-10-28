# Attributes

Attributes attach declarative metadata to program elements. They are represented by attribute classes and can be inspected at compile time (by tools) or runtime (through reflection).

```csharp
[AttributeUsage(AttributeTargets.Property, AllowMultiple = false)]
public sealed class SensitiveAttribute : Attribute
{
}

public sealed class User
{
    [Sensitive]
    public string Email { get; init; } = "";
}
```

Attribute arguments are restricted to permitted compile-time constants, `Type`, enums, and arrays of supported values. Creating or retrieving attribute instances through reflection can execute constructors; for metadata-only inspection, APIs such as `CustomAttributeData` avoid instantiating the attributes. Attributes themselves do not cause behavior automatically—frameworks or code must interpret them.

Use attributes for cross-cutting metadata consumed by analyzers, serializers, validation frameworks, or runtime infrastructure. Avoid using reflection-based attributes as a substitute for explicit business logic when compile-time types or direct calls are clearer. Consider trimming/AOT compatibility for reflection-driven discovery.

## Attribute design and runtime cost
An attribute is metadata; it has no effect unless a compiler tool, framework, or application code consumes it. Keep attribute data declarative and stable. Constructor parameters and named arguments are limited to metadata-compatible values such as constants, enums, `Type`, and arrays of supported values; do not expect to pass arbitrary runtime objects or services.

`AttributeUsage` controls valid targets, duplicate instances, and inheritance behavior. Metadata is attached to specific program elements: an attribute on a property is not automatically equivalent to an attribute on its backing field or accessor. Inspect the target that the consuming framework actually reads. Framework-specific conventions may add behavior, but the C# language itself does not make an arbitrary attribute validate or authorize a call.

Reflection APIs that instantiate attributes can run their constructors. `CustomAttributeData` permits metadata inspection without creating attribute instances, which is useful for tooling and avoids unexpected constructor effects. Reflection-driven scanning can increase startup cost and complicate trimming or Native AOT, where metadata needed at runtime may not be preserved. Explicit registration or source generators can be better when discovery must be compile-time safe. Interview answer: attributes declare facts; a consumer is responsible for interpreting them.
## Related Topics

- [reflection.md](reflection.md)
- [system-text-json.md](system-text-json.md)
- [source-generators.md](source-generators.md)
- [serialization.md](serialization.md)