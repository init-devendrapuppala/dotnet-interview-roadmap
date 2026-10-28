# Polymorphism

Polymorphism lets code operate on a common contract while runtime types provide different behavior. With virtual dispatch, an override is selected based on the object’s runtime type, not the variable’s declared base type.

```csharp
public abstract class Exporter
{
    public abstract string Export();
}

public sealed class JsonExporter : Exporter
{
    public override string Export() => "{}";
}

Exporter exporter = new JsonExporter();
Console.WriteLine(exporter.Export()); // JsonExporter implementation
```

Interfaces provide polymorphism across otherwise unrelated types. Generics also enable parametric polymorphism while retaining compile-time type information. Overloading is a different mechanism: it is resolved at compile time from argument types. `new` member hiding is also not overriding.

Polymorphism can remove repetitive type checks, but dynamic dispatch has some tracing cost and can obscure behavior if hierarchies are overly broad. Keep contracts explicit, honor substitutability, and prefer composition when behavior changes independently. Benchmark before attributing meaningful performance impact to virtual dispatch.

## Dispatch and substitutability
Polymorphism allows callers to use different implementations through a common base or interface contract. With virtual methods, the runtime type selects the override; interface calls likewise dispatch to an implementation. A method marked `new` hides a base member rather than overriding it, so behavior depends on the static type used to call it. Prefer `override` for intentional runtime substitution.

Polymorphism is useful when implementations vary behind a stable operation, such as storage providers or payment strategies. It requires a trustworthy contract: each implementation should preserve expected preconditions, results, side effects, and failures. A subtype that rejects valid base inputs breaks substitutability even if its method signature matches. Keep virtual extension surfaces small and avoid deep hierarchy chains whose behavior is difficult to trace.

An interface or abstract base can be combined with composition to model different responsibilities. Do not introduce polymorphism for a handful of fixed cases if a clear switch expression is simpler. Conversely, repeated type checks scattered across callers can indicate behavior belongs in a polymorphic implementation. Avoid `dynamic` when a compile-time contract is available.

Interview misconception: inheritance alone does not guarantee polymorphic dispatch; methods must participate in virtual/interface dispatch. Explain which contract callers depend on, how the runtime selects behavior, and what substitutability means.
## Related Topics

- [inheritance.md](inheritance.md)
- [interfaces.md](interfaces.md)
- [abstract-classes.md](abstract-classes.md)
- [composition-vs-inheritance.md](composition-vs-inheritance.md)