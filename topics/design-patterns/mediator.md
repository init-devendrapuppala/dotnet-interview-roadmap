# Mediator Pattern

Mediator centralizes communication between components so they do not hold direct references to one another. A common application form sends a request to one handler; another form coordinates notifications among multiple handlers. It can reduce coupling in a feature-oriented application, but adds indirection and is not the same as publishing a domain event. The original motivation is to prevent a web of peer-to-peer references: with many components, each may otherwise know and coordinate with many others. A mediator gives the participants a central collaboration point. In application code, request dispatch can also provide a consistent place for validation, tracing, or authorization behaviors.

## Structure and C# implementation

With a mediator library such as MediatR, a request and handler can look like:

```csharp
public sealed record GetOrder(Guid Id) : IRequest<OrderDto?>;

public sealed class GetOrderHandler(IOrderRepository orders)
    : IRequestHandler<GetOrder, OrderDto?>
{
    public async Task<OrderDto?> Handle(
        GetOrder request, CancellationToken cancellationToken)
    {
        var order = await orders.FindAsync(request.Id, cancellationToken);
        return order is null ? null : OrderDto.From(order);
    }
}
```

The caller depends on the mediator contract and sends a request; DI resolves the handler. This example uses the common `IRequest<T>` / `IRequestHandler<TRequest,TResponse>` API from MediatR; the package and appropriate `using` directives must be included by the application. The handler itself is framework-independent apart from those contracts. Middleware/behaviors can implement cross-cutting request concerns, but business rules should remain explicit in the handler or domain model.

A notification is a different message shape: it may have zero or several handlers and generally has no single response. Whether notification handling is synchronous, ordered, or fail-fast depends on the library and configuration. For required work whose outcome must be known by the caller, a single request/response is often clearer than a notification.

## Distinguish overlapping patterns

- A request/response mediator normally routes one request to one handler. A message bus may deliver messages across processes and typically has durability and delivery semantics a mediator does not provide.
- Observer/pub-sub broadcasts to subscribers. Mediator coordinates component interactions through a central point; some libraries also support notifications, so identify the actual semantics.
- CQRS separates command and query models. Using a mediator to dispatch both does not, by itself, make an application CQRS.
- A facade offers a task-oriented API that coordinates a subsystem. A mediator routes messages to handlers; using it can make the caller unaware of handler types but introduces dispatch indirection.
- A domain event represents a meaningful fact in the domain, such as an order being placed. A mediator notification is a delivery mechanism and should not be assumed to have domain-event persistence or transactional guarantees.

The mediator pattern does not prescribe one library. A small application can implement a narrow dispatcher, but reflection, registration, pipeline ordering, and diagnostics can make a home-grown general framework more expensive than using direct method calls. A library may also complicate debugging because the call path is indirect.

## Tradeoffs, testing, and production pitfalls

Handlers are easy to unit-test when dependencies are explicit. Test request validation, business outcomes, cancellation, and failure behavior. Test pipeline behaviors separately and add integration coverage for handler registration; missing registrations often appear only at runtime. Include one test through the mediator pipeline when ordering or behavior composition is important; a direct handler test cannot prove that the correct behaviors are registered.

Mediator can make simple calls harder to trace and encourage one handler per trivial operation. Use it where decoupled dispatch, pipeline behaviors, or feature boundaries provide value—not as a mandatory wrapper around every method. Avoid handlers that become untestable service locators or pass large mutable request objects shared by concurrent handlers. Keep request data explicit and avoid hiding transactions in an unexplained global behavior. A behavior that opens a transaction must define boundaries and coordinate correctly with retries.

Observability should preserve the request-to-handler relationship. Correlate logs and traces across pipeline behaviors, record useful operation names, and avoid logging sensitive request payloads by default. When adding validation or authorization behaviors, establish their ordering and ensure failure responses are consistent; an implicit pipeline order can otherwise make behavior differ between environments.

In an interview, clarify whether the example is request/response or notification fan-out, how handlers are discovered, and what remains in the domain model. Explain why an in-process mediator is not a durable queue and when direct calls would be simpler.

## Related Topics

- [Observer](observer.md)
- [Repository](repository.md)
- [CQRS](../system-design/cqrs.md)
- [Dependency Injection](../aspnet-core/dependency-injection.md)