# Abstract Classes

An abstract class is a class that cannot be instantiated directly and may contain both implemented and abstract members. Use it when related types share state or implementation but some behavior must be supplied by each concrete subtype.

```csharp
public abstract class PaymentMethod
{
    protected PaymentMethod(string accountId) => AccountId = accountId;
    protected string AccountId { get; }
    public abstract Task ChargeAsync(decimal amount, CancellationToken cancellationToken);
    public virtual string DisplayName => GetType().Name;
}

public sealed class CardPayment(string accountId) : PaymentMethod(accountId)
{
    public override Task ChargeAsync(decimal amount, CancellationToken cancellationToken)
        => Task.CompletedTask; // Replace with provider integration.
}
```

An abstract member has no implementation and must be overridden by a non-abstract derived type. Abstract classes can have constructors, fields, access modifiers, and virtual members; interfaces primarily describe a contract and allow a type to implement multiple contracts. A class can inherit only one base class, so a deep hierarchy can constrain future design.

Do not use inheritance merely to share a few utility methods. Prefer composition when behavior varies independently or a subtype is not safely substitutable for its base. Keep base invariants explicit and avoid calling overridable members from constructors, before the derived part is initialized.

**Interview focus:** explain when shared state and a template method justify an abstract base, and when an interface plus injected collaborators is less coupled.

## Designing a base class
A useful abstract base owns a stable invariant or shared algorithm, not merely a few convenient helpers. A template method can keep ordering under base-class control while leaving one meaningful step abstract. This is appropriate when every implementation must follow the same lifecycle; it couples subclasses to that lifecycle and the base API, so keep protected extension points narrow. Adding an abstract member is a source-breaking change for external subclasses.

An abstract class may have state, constructors, access modifiers, and concrete methods, but C# allows only one base class. Interfaces allow multiple contracts and can now provide default members, so the interview shorthand “base class for code reuse, interface for contract” is incomplete. Decide based on state ownership, invariant enforcement, versioning, and substitutability. Derived implementations must honor the base's preconditions, postconditions, and failure semantics. Never invoke overridable members in a constructor: virtual dispatch could reach derived code before its fields are initialized. Prefer composition when behavior varies independently.
## Related Topics

- [abstraction.md](abstraction.md)
- [interfaces.md](interfaces.md)
- [composition-vs-inheritance.md](composition-vs-inheritance.md)
- [polymorphism.md](polymorphism.md)