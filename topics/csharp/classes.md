# Classes

A class defines a reference type: instances have identity, can be mutated through references, and are reclaimed by the garbage collector when unreachable. A class can hold state, provide behavior, implement interfaces, and derive from one base class.

```csharp
public sealed class RetryPolicy
{
    public RetryPolicy(int maxAttempts)
    {
        if (maxAttempts < 1) throw new ArgumentOutOfRangeException(nameof(maxAttempts));
        MaxAttempts = maxAttempts;
    }

    public int MaxAttempts { get; }
}
```

Prefer a clear invariant-preserving API over exposing fields. Use `sealed` when extension is not part of the design, and use immutable state where practical to reduce synchronization and aliasing problems. `new` creates an instance (unless a target-typed or factory form is used); it does not mean every local variable is itself the object or that the object necessarily remains live until lexical scope ends.

Classes are appropriate when reference identity, shared mutable state, inheritance, or a larger object lifecycle is meaningful. For small immutable data with value semantics, consider a struct or record after evaluating copying costs and semantics.

## Object lifecycle and API design
A class reference has identity and may be aliased: assigning the variable copies the reference, so mutations through one alias can be observed through another. This is why mutable objects need clear ownership and thread-safety contracts. Encapsulate state behind operations that preserve invariants instead of exposing a mutable collection directly. `init` restricts ordinary assignment after initialization but does not make an object's referenced data deeply immutable.

Use constructors for required state and validation. Avoid publishing `this` before construction completes and avoid virtual members unless overriding is a deliberate extension point. `sealed` communicates that inheritance is unsupported; it is not automatically a performance optimization. A class is appropriate when identity, shared mutable state, object lifecycle, or polymorphism is meaningful. For value semantics, consider a record or struct based on copying, mutability, and inheritance needs—not on the simplistic rule that small objects belong on the stack.

A type declaration alone does not determine a particular physical storage location. In practice, design reviews should ask who owns an instance, whether mutations are observable, how it is disposed if it owns resources, and what concurrent access is safe. Keep static mutable state rare because its process-wide lifetime and synchronization can surprise callers. Prefer small, explicit public APIs that preserve invariants and make invalid states difficult to represent.
## Related Topics

- [objects.md](objects.md)
- [constructors.md](constructors.md)
- [fields.md](fields.md)
- [properties.md](properties.md)
- [records.md](records.md)