# Interfaces

An interface defines a contract that unrelated types can implement. A class or struct can implement multiple interfaces, making them useful at dependency boundaries and for capabilities such as disposal or enumeration.

```csharp
public interface IClock
{
    DateTimeOffset UtcNow { get; }
}

public sealed class SystemClock : IClock
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
```

Interfaces support substitution and test doubles, but they are not automatically a good abstraction: keep each contract cohesive and aligned with consumers. Since C# 8, interfaces may provide default implementations and static abstract members; these features do not make an interface equivalent to a stateful base class. An interface cannot declare instance fields.

Changing a public interface can break implementers, so version contracts carefully. Default interface members can ease some evolution but have runtime and dispatch subtleties; they are not a universal compatibility fix. Use dependency injection to supply implementations where the dependency genuinely varies.

## Contracts, evolution, and dispatch
An interface defines a capability contract a type can implement alongside other interfaces. Consumers depending on a narrow interface need not know the concrete class, which can isolate external systems and clarify test seams. But creating an interface for every class can add indirection without value; design around client needs and stable behavior.

C# interfaces can include default implementations and static abstract members in supported language/runtime combinations, but they still cannot own per-instance state like a class. Default interface members can ease interface evolution in some cases, yet they can make dispatch and versioning less obvious; do not use them as a replacement for a well-designed abstraction. Adding a member to a public interface can affect implementers, so library evolution requires care.

A class can implement multiple interfaces but inherit only one class. Interface dispatch is polymorphic when callers use the contract; explicit interface implementation can resolve naming conflicts or hide members from the concrete public surface, though it may surprise users. Interfaces do not promise thread safety, immutability, or performance characteristics unless their contract says so.

Use `IDisposable`, `IAsyncEnumerable<T>`, or collection interfaces to communicate standard capabilities. Prefer the narrowest interface needed (`IReadOnlyList<T>` rather than `IEnumerable<T>` when indexing/count is required) while recognizing read-only interfaces are not deep immutability. In interviews, focus on the consumer contract and substitutability, not “interfaces have no implementation.”
## Related Topics

- [abstraction.md](abstraction.md)
- [abstract-classes.md](abstract-classes.md)
- [composition-vs-inheritance.md](composition-vs-inheritance.md)
- [solid-principles.md](solid-principles.md)