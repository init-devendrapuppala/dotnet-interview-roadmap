# Abstraction

Abstraction exposes the operations a caller needs while hiding implementation details that may change. It is not simply “making a class abstract”: interfaces, public APIs, methods, and module boundaries can all provide abstractions.

```csharp
public interface IInvoiceSender
{
    Task SendAsync(Invoice invoice, CancellationToken cancellationToken);
}
```

The caller can depend on this contract without knowing whether delivery uses SMTP, a queue, or a test double. A useful abstraction captures stable domain intent; an abstraction that mirrors every implementation detail often adds indirection without reducing coupling.

Abstraction supports substitution and testing, but interfaces are not automatically beneficial. Too many tiny wrappers can make behavior hard to trace, while a broad interface can force callers to depend on unrelated operations. Design contracts around client needs, define error and cancellation behavior, and preserve meaningful invariants.

**Interview focus:** distinguish abstraction (what is promised) from encapsulation (how state and implementation are protected). Discuss a concrete dependency that can vary and the boundary that isolates it.

## Turning a need into a boundary
An abstraction is valuable when it gives callers stable domain vocabulary while allowing implementation details to change. Its contract should specify observable outcomes, error behavior, cancellation, and—in asynchronous APIs—whether operations can be retried safely. An interface that simply mirrors a vendor SDK may preserve rather than remove coupling; translate at the boundary when the application should not depend on vendor-specific request or exception types.

Every layer has a cost. Creating an interface for each class with only one implementation and no meaningful boundary can make behavior difficult to trace. Conversely, an external service, clock, filesystem, or policy that varies is a credible seam for substitution and focused tests. Dependency injection is a way to supply implementations, not the definition of abstraction, and a mock does not prove that the real adapter honors the contract.

Distinguish abstraction (what capability is promised) from encapsulation (how representation and invariants are protected) and polymorphism (using different implementations through a shared contract). In an interview, name the concrete change the boundary permits and the coupling or indirection it costs. Design the smallest contract that serves a caller rather than exposing every operation of an underlying implementation.
## Related Topics

- [encapsulation.md](encapsulation.md)
- [interfaces.md](interfaces.md)
- [abstract-classes.md](abstract-classes.md)
- [solid-principles.md](solid-principles.md)