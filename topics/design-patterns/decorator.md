# Decorator Pattern

Decorator adds behavior to an object while preserving its interface. It is useful for optional, composable concerns such as logging, caching, metrics, or authorization without changing the wrapped implementation or creating subclasses for every combination. The problem it addresses is cross-cutting variation: if each implementation duplicates logging or every feature combination becomes a subclass, changes become hard to maintain. A decorator composes those behaviors at runtime around the core implementation.

## Structure and C# implementation

A decorator implements the same abstraction as the object it wraps, receives an instance of that abstraction, and delegates calls while adding a clearly scoped responsibility. Since wrappers can themselves be wrapped, several can be composed.

## C# example

```csharp
public interface IReceiptSender
{
    Task SendAsync(string address, string body, CancellationToken cancellationToken);
}

public sealed class LoggingReceiptSender(
    IReceiptSender inner,
    ILogger<LoggingReceiptSender> logger) : IReceiptSender
{
    public async Task SendAsync(
        string address, string body, CancellationToken cancellationToken)
    {
        logger.LogInformation("Sending receipt to {Address}", address);
        await inner.SendAsync(address, body, cancellationToken);
    }
}
```

Register the concrete sender, then wrap it with the decorator (manually or with a DI decoration feature). Keep the same abstraction at the boundary, and pass cancellation through. The example assumes `IReceiptSender` is defined as shown and that `ILogger<T>` from `Microsoft.Extensions.Logging` is available. Register the logger and sender in the application's dependency-injection container. A decorator should preserve the wrapped contract, including exception and result semantics, unless its purpose explicitly changes them. A cache, for example, intentionally changes when the inner component is called, so its cache key, expiration, and invalidation semantics must be part of the design.

Construction is commonly configured by an IoC container, but it can also be explicit:

```csharp
IReceiptSender sender =
    new LoggingReceiptSender(new SmtpReceiptSender(), logger);
```

This makes ordering visible, though manual construction becomes awkward with many services. Avoid resolving arbitrary services from a container inside the decorator; constructor injection keeps dependencies testable.

## Tradeoffs and alternatives

- Compared with inheritance, decorators compose at runtime and avoid subclasses such as `CachedLoggedAuthorizedSender`.
- Compared with an adapter, a decorator normally keeps the same interface and adds behavior; an adapter translates to a different interface.
- Middleware is a pipeline-oriented form of composition for HTTP or message processing. Use it when the framework's pipeline model is the natural fit.
- Ordering matters: caching outside metrics may measure cache hits differently than metrics outside caching. Make registration order explicit and test it.
- Avoid hidden side effects, repeated wrappers with unclear ownership, and decorators that become large policy engines.
- A proxy also implements the same interface and controls access, but its intent is often lifecycle, access, or remote/local representation rather than behavior composition. The boundary can overlap: a caching proxy may be implemented with decorator structure.
- Decorators incur extra types, allocations, and call indirection. For a single fixed policy or a small stable implementation, an explicit method may be easier to understand.

## Testing, pitfalls, and interview notes

Unit-test the decorator with a fake inner implementation: assert delegation, added behavior, and propagation of results, exceptions, and cancellation. For logging or metrics, verify observable behavior without coupling every test to incidental message text. For caching, test hits, misses, expiration, key correctness, concurrency, and invalidation. Test wrapper ordering explicitly when the order changes semantics. Integration-test container registration, because a correct decorator type that is never wired into production provides no behavior.

Production pitfalls include accidentally decorating a decorator (recursive registration), applying a wrapper twice, swallowing exceptions, changing cancellation semantics, or logging sensitive arguments. Ensure DI configuration resolves the inner concrete implementation rather than the same decorated abstraction. Async decorators should await and return the inner task correctly; they should not use `async void` or block on `.Result`. A retry decorator must know whether the operation is safe to repeat and should respect deadlines and cancellation.

For concurrent services, consider whether added state is thread-safe. A cache decorator may be called by many requests simultaneously, and naive “check then populate” logic can trigger a cache stampede. A metrics decorator should avoid high-cardinality labels, and a logging decorator should not emit credentials or entire payloads. Treat operational side effects as production code with resource and privacy constraints.

In an interview, name the concern being added, what the wrapper does before and after delegation, and how order affects behavior. Avoid describing decorators as free or universally preferable: use them when independently composable behavior and a stable contract justify the additional indirection.

## Related Topics

- [Adapter](adapter.md)
- [Facade](facade.md)
- [Dependency Injection](../aspnet-core/dependency-injection.md)
- [Middleware](../aspnet-core/middleware.md)