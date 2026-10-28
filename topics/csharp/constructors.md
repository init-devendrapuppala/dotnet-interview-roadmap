# Constructors

Constructors establish an object’s invariants. A constructor runs when an instance is created; it has no return type, and its name matches the class. Validate required arguments early and keep construction deterministic.

```csharp
public sealed class UserId
{
    public UserId(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("An identifier is required.", nameof(value));
        Value = value;
    }

    public string Value { get; }
}
```

Use `this(...)` to chain constructors within a type and `base(...)` to select a base constructor. A static constructor runs at most once per type initialization before first use (subject to runtime initialization rules); it is parameterless and cannot be called directly. Instance field initializers execute before the base/instance constructor body according to C# initialization rules.

Avoid complex I/O or publishing `this` from a constructor. Calling virtual members there can dispatch to derived code before derived initialization is complete. For asynchronous setup or fallible external work, construct a valid object first and use an async factory method.

## Initialization order and safe construction
C# specifies initialization order, and in derived construction the base portion is initialized before the derived constructor body. A virtual call from a base constructor can therefore dispatch into an override while derived fields still have default values. Do not call overridable members or publish `this` to another thread/callback before construction completes.

`this(...)` chains constructors in the same type; `base(...)` selects a base constructor. Chaining centralizes validation, while too many optional or ambiguous overloads can make creation hard to understand. Primary constructors reduce syntax for suitable types but do not remove the need to establish invariants. Use parameters for required dependencies and consider named factory methods for distinct creation paths.

Constructors cannot be `async`; do not block on I/O inside one. For asynchronous setup, create a valid object and provide an asynchronous factory or initialization operation with an explicit failure contract. Static constructors are runtime-managed and execute at most once for type initialization; exact initialization timing may be affected by `beforefieldinit` rules for eligible types, so avoid relying on startup side effects occurring at a precise moment. Validate arguments early (for example `ArgumentNullException.ThrowIfNull`) and keep construction deterministic. Never swallow a constructor failure and return a partially initialized object.
## Related Topics

- [classes.md](classes.md)
- [fields.md](fields.md)
- [properties.md](properties.md)
- [abstract-classes.md](abstract-classes.md)