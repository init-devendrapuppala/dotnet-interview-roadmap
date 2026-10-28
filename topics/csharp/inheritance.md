# Inheritance

Inheritance lets a class extend one base class and reuse or specialize its behavior. It enables runtime polymorphism when callers use a base type and virtual members dispatch to an override.

```csharp
public abstract class Document
{
    public abstract string Render();
}

public sealed class PlainTextDocument(string text) : Document
{
    public override string Render() => text;
}
```

Only class inheritance is single-base in C#; a type can implement many interfaces. A derived class should preserve the promises of its base, including preconditions, postconditions, and meaningful error behavior. Violating substitutability produces fragile callers that need subtype checks.

Mark extension points `virtual` intentionally and override with `override`; `new` hides a member rather than overriding it. Base constructors run before the derived constructor body, so avoid virtual dispatch from constructors. Prefer composition when the relationship is not truly “is-a” or when behavior needs independent replacement.

## Virtual dispatch and contract stability
A derived class inherits accessible members and can override virtual or abstract behavior. Dispatch is based on the runtime type for virtual members; `new` hides a member rather than overriding it, so calls through base and derived references may differ. Use `override` when behavior is intentionally polymorphic and mark leaf types `sealed` when external derivation is not supported.

A base class is an API commitment. Protected members and virtual methods become extension points that are difficult to change without breaking consumers. Keep virtual surface small, document invariants, and avoid calling virtual methods from constructors. A derived class must preserve the base contract: changing expected behavior or throwing in new cases can break substitutability even when the compiler accepts it.

C# supports single class inheritance and multiple interface implementations. Prefer composition for behavior that should vary independently or be replaced at runtime; inheritance is useful for a true subtype or a stable template method. Avoid deep hierarchies where behavior emerges from many override layers. Test base behavior with representative derived types and ensure overrides cooperate with base cleanup/validation.

Interview misconception: inheritance is not automatically code reuse or polymorphism. Polymorphism requires a call through an appropriate virtual/interface contract; a `new` hidden member does not provide virtual dispatch.
## Related Topics

- [polymorphism.md](polymorphism.md)
- [abstract-classes.md](abstract-classes.md)
- [interfaces.md](interfaces.md)
- [composition-vs-inheritance.md](composition-vs-inheritance.md)