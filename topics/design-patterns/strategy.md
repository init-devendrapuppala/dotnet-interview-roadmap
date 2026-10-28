# Strategy Pattern

Strategy encapsulates interchangeable algorithms behind a common contract so a caller can select behavior without a growing conditional or tightly coupled implementation. It is useful when alternatives vary independently or are selected by configuration, input, or runtime context. Its motivation is to isolate a dimension of change: if pricing rules change independently from order orchestration, strategy keeps the workflow stable while a policy is added or replaced. It also makes each algorithm independently testable.

## C# example

```csharp
public interface IShippingCost
{
    decimal Calculate(Order order);
}

public sealed class StandardShipping : IShippingCost
{
    public decimal Calculate(Order order) => 5m;
}

public sealed class ExpressShipping : IShippingCost
{
    public decimal Calculate(Order order) => order.Total >= 100m ? 0m : 15m;
}
```

An application service can receive the chosen `IShippingCost` through DI, or resolve among registered strategies using an explicit key/registry when the choice depends on the order. The caller should select a policy using domain input; it should not inspect concrete classes to make the algorithm work. The sample strategies implement the same contract and assume an application `Order` type with a `decimal Total` property. A consuming use case can accept a strategy in its constructor for a fixed policy, or accept a small selector when policy selection is part of the workflow.

For runtime selection, avoid a long switch scattered among controllers. A registry can map stable business keys to registered implementations, but it should reject duplicate and unknown keys clearly. If each strategy has different required inputs or outputs, forcing them behind one overly generic interface may obscure rather than simplify the design. Keep the shared contract meaningful.

## Tradeoffs and alternatives

- A `switch` is perfectly reasonable for a small, stable set of trivial cases. Strategy becomes useful as behavior grows, varies, or needs independent testing.
- Strategy is usually selected by a caller or registry. State pattern changes behavior as an object's state transitions; the two can look alike but model different decisions.
- Factory focuses on object creation/selection; Strategy focuses on interchangeable behavior. A factory may choose which strategy to supply.
- Avoid one class per trivial expression, duplicated selection logic, or a strategy interface whose implementations do not share meaningful behavior.
- Template Method varies steps in an algorithm through inheritance; Strategy varies a whole behavior through composition. Prefer Strategy when runtime substitution or independent objects are useful, and Template Method when an invariant sequence with a few subclass hooks is the actual model.
- A policy object or delegate can implement the same idea with less ceremony for a small algorithm. A named strategy class is preferable when the behavior needs dependencies, configuration, reuse, or focused tests.

Strategies may be stateless and safely registered as singletons, but do not assume that lifetime if they hold mutable per-operation data. Pass input as method arguments and return results rather than storing request state on a shared strategy. Selection belongs at a clear boundary so business behavior does not accidentally depend on implementation names or DI registration order.

## Testing, pitfalls, and interview notes

Test each algorithm with boundary inputs, then test the selection policy separately. Inject a fake strategy to test the consuming use case independently. For a keyed registry, test duplicate/missing keys and configuration so runtime selection cannot silently choose the wrong implementation. Include domain boundaries such as free-shipping thresholds, invalid values, rounding, and currency rules.

Production pitfalls include selection based on untrusted input without validation, hidden default strategies, implementations with inconsistent semantics, and registration errors that only surface on specific traffic. Define deterministic fallback behavior only when the domain requires it, and log the selected policy without exposing sensitive data. Configuration changes should have well-defined rollout behavior.

Algorithms that affect money or eligibility should be deterministic and explicit about rounding, time zones, and policy version. If a customer's order must retain the pricing rule used at quote time, persist that decision or its version rather than recomputing under a later strategy. Strategy isolates the algorithm, but does not by itself solve policy rollout or historical reproducibility.

In an interview, state what varies, who selects it, and why composition is clearer than conditionals or inheritance for that variation. Explain when a simple switch or delegate would be enough; patterns are tools for managing change, not a requirement to create a class for every branch.

## Related Topics

- [Factory](factory.md)
- [Dependency Injection](../aspnet-core/dependency-injection.md)
- [Interfaces](../csharp/interfaces.md)
- [Polymorphism](../csharp/polymorphism.md)