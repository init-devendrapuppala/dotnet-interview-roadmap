# Facade Pattern

Facade gives callers a smaller, task-oriented interface over a subsystem that otherwise requires knowledge of several components and call sequences. Use it to simplify a use case or establish a boundary; it does not require the subsystem itself to be hidden from every caller. It solves a client-coupling problem: if each caller must know which services to invoke, in what order, and how their APIs fit together, the subsystem's internal structure becomes part of every caller. A cohesive facade centralizes that knowledge behind an operation that expresses the caller's goal.

## Structure and C# implementation

A facade accepts or constructs subsystem collaborators and exposes a higher-level operation. It coordinates the flow but should leave specialized responsibilities with their own components. In an application, this may be an application service or use-case handler rather than a type literally named `Facade`.

## C# example

```csharp
public sealed class CheckoutFacade(
    IInventory inventory,
    IPaymentGateway payments,
    IOrderStore orders)
{
    public async Task<Guid> PlaceAsync(
        Cart cart, CancellationToken cancellationToken)
    {
        await inventory.ReserveAsync(cart, cancellationToken);
        var receipt = await payments.ChargeAsync(cart.Total, cancellationToken);
        return await orders.SaveAsync(cart, receipt, cancellationToken);
    }
}
```

The facade owns the application-level sequence, while each dependency retains its own responsibility. Interfaces and domain types are assumed to be defined by the application. A `CancellationToken` is passed to the operations that support cancellation. The example is illustrative, not a complete checkout implementation: the application must define what to do if a reservation succeeds but charging or saving fails.

A useful facade hides orchestration detail, not important business outcomes. Its method should communicate meaningful success, failure, and consistency guarantees. For example, returning a receipt or a typed result may be better than returning only an identifier when a caller must know whether fulfillment was started. Keep authorization at an appropriate boundary and avoid making the facade an accidental shortcut around domain invariants.

## Tradeoffs and alternatives

- A facade reduces coupling for its clients, but can become a “god service” if unrelated workflows accumulate in it. Split by use case or domain capability.
- It is not automatically a transaction coordinator. If reservation, payment, and persistence span independent systems, failures need explicit compensation, idempotency, or a saga; a facade alone cannot make them atomic.
- A mediator routes interactions through a central component, often to decouple senders from handlers. A facade exposes a cohesive API that callers invoke directly.
- An adapter translates an incompatible interface; a facade simplifies a complex one.
- A service layer often organizes application operations and may serve as a facade. The names overlap in real code; explain whether the type is simplifying a subsystem for clients, implementing use cases, or both.
- A facade does not require that underlying APIs become inaccessible. Other clients can use subsystem components directly when they need lower-level control, though a deliberate boundary may make such access private.

## Testing, pitfalls, and interview notes

Unit-test the orchestration: verify the calls and ordering for success and failure paths, using fakes for collaborators. Include failure tests for partial progress, compensation decisions, and idempotent retries when relevant. Integration tests should cover the real database or remote service behavior that mocks cannot establish. Avoid over-mocking implementation details: tests should protect the use-case contract rather than freeze every internal call if order is not meaningful.

Production pitfalls include a facade with too many unrelated dependencies, ambiguous error mapping, and asynchronous work that outlives the request without durable tracking. If the operation touches independent systems, define recovery behavior and observability. A facade should not catch all exceptions and convert them to success-shaped responses; failures need to remain diagnosable.

Make operation identity explicit when callers may retry after a timeout. For example, a checkout facade may accept an idempotency key and pass it to the payment boundary, rather than charging again because the caller cannot tell whether the first response was lost. This policy may be implemented by collaborators, but the public use-case contract should explain the outcome and retry semantics.

In an interview, describe which complexity is hidden, why clients benefit, and what consistency guarantees remain visible. Distinguish local database transaction boundaries from remote effects. Do not claim that putting several calls in one facade makes them atomic.

In an interview, describe which complexity is hidden and what consistency guarantees remain visible to the caller. Do not claim the facade makes multiple services transactional.

## Related Topics

- [Adapter](adapter.md)
- [Mediator](mediator.md)
- [Dependency Injection](../aspnet-core/dependency-injection.md)
- [Saga Pattern](../system-design/saga-pattern.md)