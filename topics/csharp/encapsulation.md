# Encapsulation

Encapsulation keeps an object’s state and implementation behind a controlled API. Its purpose is not merely to hide fields; it is to preserve invariants and make invalid states harder to represent.

```csharp
public sealed class InventoryItem
{
    public int Quantity { get; private set; }

    public void Remove(int amount)
    {
        if (amount <= 0 || amount > Quantity)
            throw new ArgumentOutOfRangeException(nameof(amount));
        Quantity -= amount;
    }
}
```

The caller cannot arbitrarily set a negative quantity, so validation lives at the boundary that owns the rule. Access modifiers (`private`, `protected`, `internal`, `public`, and combinations such as `protected internal`) define visibility; properties and methods provide deliberate operations.

Over-encapsulation can make simple data cumbersome, while public mutable state makes future changes risky and can create thread-safety problems. Expose read-only views when appropriate, but remember that an interface or read-only wrapper may still expose mutable elements. Document invariants, avoid leaking internal collections, and keep each type responsible for rules it can enforce.

## Protecting invariants
Encapsulation keeps representation private and exposes operations that preserve an object's rules. A private field alone is not enough if a public property returns a mutable list or an API lets callers set fields into inconsistent combinations. Prefer methods and properties that make allowed state transitions explicit. Immutable types make invariants easier to maintain because state does not change after construction, though immutability may be shallow when references point to mutable objects.

Encapsulation is not synonymous with hiding all implementation details or making every member private. Public APIs should expose the concepts callers need, and internal implementation can remain testable through behavior rather than reflection. Avoid “anemic” designs where state is public and all validation is scattered among callers; equally, avoid giant objects that own unrelated responsibilities.

When evolving a library, properties and methods offer room to change validation or storage without breaking callers that depend on a public field. `init` limits assignment during object initialization but does not make collections read-only. Expose read-only interfaces or immutable snapshots when callers should observe but not mutate a collection, and be aware that a read-only wrapper over mutable backing data is still live.

Interview answer: encapsulation establishes a boundary around state and behavior; abstraction defines a useful contract. Explain which invariant is protected and what invalid state the API prevents.
## Related Topics

- [classes.md](classes.md)
- [fields.md](fields.md)
- [properties.md](properties.md)
- [abstraction.md](abstraction.md)