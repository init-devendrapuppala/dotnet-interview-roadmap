# Composition vs Inheritance

Inheritance models an “is-a” relationship and allows a subtype to be used where its base is expected. Composition builds behavior from collaborators and models “has-a” or “uses-a.” Prefer composition when behavior should vary independently or be replaced at runtime.

```csharp
public interface IClock
{
    DateTimeOffset UtcNow { get; }
}

public sealed class ExpiryService(IClock clock)
{
    public bool IsExpired(DateTimeOffset expiresAt) => clock.UtcNow >= expiresAt;
}
```

Here, a test clock can replace system time without subclassing `ExpiryService`. Inheritance can be appropriate when a stable base owns an invariant and derived types honor the base contract. It can also provide a template method where a controlled step varies. Risks include fragile base classes, surprising virtual dispatch, tight coupling, and a single-inheritance limit.

Do not replace every inheritance relationship mechanically: composition adds collaborators and may be needless for a true subtype. Check substitutability (including edge cases and exceptions), keep APIs small, and avoid constructor calls to overridable members.

## Substitutability and independent variation
Inheritance is a behavioral promise: code that accepts a base type should work correctly when given any derived type. A subtype that strengthens preconditions, changes expected exceptions, or weakens postconditions may compile but violate substitutability. Inheriting solely to reuse a helper therefore couples callers to a base contract and can create fragile base-class behavior.

Composition delegates a responsibility to a collaborator, making independently varying policies replaceable and often easier to test. It adds wiring and object relationships, however, so interfaces for every private helper can create needless indirection. Choose the simplest design that isolates a real axis of change.

```csharp
public sealed class TaxCalculator(ITaxRateProvider rates)
{
    public decimal Calculate(decimal net, string region) => net * rates.GetRate(region);
}
```

This keeps calculation behavior in one place while allowing the rate source to vary. Inheritance is appropriate for a true subtype or a stable template method whose invariant is owned by the base. In either design, keep extension points narrow and do not call overridable methods from constructors. “Favor composition” is a useful default, not a rule forbidding inheritance; an interview answer should discuss coupling, substitutability, and independent variation.
## Related Topics

- [inheritance.md](inheritance.md)
- [abstract-classes.md](abstract-classes.md)
- [interfaces.md](interfaces.md)
- [solid-principles.md](solid-principles.md)