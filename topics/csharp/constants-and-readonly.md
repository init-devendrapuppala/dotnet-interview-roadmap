# Constants and Readonly Fields

`const` is a compile-time constant; `readonly` fields can be assigned at declaration or in an instance/static constructor. Both are useful for values that should not be reassigned, but their versioning semantics differ.

```csharp
public sealed class RetrySettings
{
    public const int DefaultAttempts = 3;
    public readonly TimeSpan Timeout;

    public RetrySettings(TimeSpan timeout) => Timeout = timeout;
}
```

Consumers of a public `const` generally inline its value at compile time. If a library changes the constant, already compiled consumers can continue using the old value until rebuilt. Prefer `static readonly` for public values whose value may change between library versions or must be computed at runtime. `readonly` prevents replacing a field reference, not mutating the referenced object.

`static readonly` is shared per type; instance `readonly` belongs to each object. Properties with private setters or init-only setters may communicate API intent more clearly than public fields. `const` is limited to types permitted as compile-time constants (including primitive numeric types, `bool`, `char`, `string`, enums, and `null` for reference types).

## Versioning, initialization, and mutability
A public `const` is embedded into consumer code at compile time. If a library changes that constant, a consumer not rebuilt may continue using the old value. `const` is implicitly static and limited to compile-time constant values. Prefer `static readonly` when the value is computed at runtime or may change between library versions, because consumers read the field at runtime.

An instance `readonly` field can be assigned at its declaration or in an instance constructor; a static one can be assigned at declaration or in a static constructor. Readonly restricts reassignment through the declaring type, not mutation of the referenced object:

```csharp
private readonly List<string> _names = [];
// _names cannot be replaced here, but _names.Add("Ada") is allowed.
```

If callers need read-only access, expose an appropriate interface or immutable snapshot rather than assuming a readonly reference protects contents. Properties often make better public API members than fields because their implementation can evolve without changing call syntax. `init` supports initialization-only assignment but is distinct from a readonly field. Interview misconception: readonly does not mean immutable, and const is not merely another spelling for a non-reassignable field; its compile-time substitution affects binary versioning.
## Related Topics

- [fields.md](fields.md)
- [properties.md](properties.md)
- [variables.md](variables.md)
- [data-types.md](data-types.md)