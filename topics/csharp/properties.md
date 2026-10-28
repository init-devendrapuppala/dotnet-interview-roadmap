# Properties

Properties expose a value through `get` and optionally `set` or `init` accessors. They look like fields at the call site but compile to accessor methods, allowing validation or computed behavior.

```csharp
public sealed class Percentage
{
    private decimal _value;
    public decimal Value
    {
        get => _value;
        init => _value = value is >= 0 and <= 100
            ? value
            : throw new ArgumentOutOfRangeException(nameof(value));
    }
}
```

Auto-properties are concise when no custom logic is needed. A `private set` limits mutation to the type; `init` permits assignment during object initialization and construction, supporting immutable-style APIs. A getter is not guaranteed to be free of side effects, but callers generally expect property access to be inexpensive and predictable.

Avoid expensive I/O or surprising mutation in accessors. A `readonly` property does not necessarily mean the returned object is immutable. Use methods for operations with significant work or side effects. Public property changes affect serialization and binary/source compatibility, so treat them as part of the API.

## Encapsulation and initialization
A property exposes get/set accessors with field-like syntax. It may validate, compute, or control mutation, but callers should not assume access is cheap if the implementation performs work. Auto-properties are clear for simple storage. A private setter, `init` accessor, or getter-only property can narrow mutation while preserving a useful API. `init` limits assignment through object initialization; it does not deeply freeze referenced values.

```csharp
public sealed class Account
{
    public decimal Balance { get; private set; }
    public void Deposit(decimal amount)
    {
        if (amount <= 0) throw new ArgumentOutOfRangeException(nameof(amount));
        Balance += amount;
    }
}
```

This keeps the invariant at the mutation boundary. Avoid public setters when updates must maintain relationships among multiple fields. A read-only collection property may still expose a mutable object or live wrapper; return an immutable snapshot when consumers require stable data. `required` members help express initialization requirements at compile time but do not validate runtime/deserialized input.

Properties can be virtual or abstract where polymorphic access is meaningful, though virtual dispatch from constructors carries the same initialization hazard as methods. Use a field for internal storage, not as the default public contract: properties can evolve without changing call syntax. Interview distinction: properties are accessor methods in the language model, not guaranteed plain fields; style analyzers and frameworks may also treat them specially.
## Related Topics

- [fields.md](fields.md)
- [encapsulation.md](encapsulation.md)
- [records.md](records.md)
- [constructors.md](constructors.md)