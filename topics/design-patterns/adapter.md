# Adapter Pattern

The Adapter pattern lets a client that expects one contract use a component that exposes an incompatible contract. The mismatch may be in method names, data shapes, units, error conventions, or a vendor-specific API. Without an adapter, these differences spread through business code: callers learn about provider types, tests need provider setup, and changing the integration becomes a cross-cutting edit. An adapter keeps translation at the boundary and presents an application-owned contract inward.

## Structure and C# implementation

An object adapter uses composition: it implements the target interface and holds the adaptee that has the incompatible API. The client depends only on the target interface.

```csharp
public interface IExchangeRateProvider
{
    Task<decimal> GetUsdToEurAsync(CancellationToken cancellationToken);
}

public sealed class VendorRatesClient
{
    public Task<double> ReadRateAsync(
        string sourceCurrency, string targetCurrency,
        CancellationToken cancellationToken) =>
        Task.FromResult(0.92); // Represents a vendor SDK call.
}

public sealed class VendorRatesAdapter(VendorRatesClient client)
    : IExchangeRateProvider
{
    public async Task<decimal> GetUsdToEurAsync(
        CancellationToken cancellationToken)
    {
        var rate = await client.ReadRateAsync(
            "USD", "EUR", cancellationToken);

        if (double.IsNaN(rate) || double.IsInfinity(rate) || rate <= 0)
            throw new InvalidOperationException("The provider returned an invalid rate.");

        return (decimal)rate;
    }
}
```

In a real integration, handle provider-specific exceptions and response validation deliberately; the sample only illustrates a contract conversion. The target interface belongs to the application, not the vendor package. Inject `IExchangeRateProvider` into the use case, and register `VendorRatesAdapter` at the composition root. This lets application code avoid vendor-specific types and makes substitution explicit.

An adapter should translate semantics, not just syntax. For example, if a provider returns temperatures in Fahrenheit while the application models Celsius, the adapter converts the unit and documents rounding. If errors differ, it can map known provider failures to application-level outcomes while preserving unexpected failures. It should not silently invent success for data it cannot interpret.

## Consequences, alternatives, and distinctions

Composition is generally preferable to inheriting from an SDK class: it avoids inheriting its public surface and lifecycle, and permits wrapping sealed types. Inheritance-based class adapters exist where the library design requires them, but couple the adapter to the adaptee's implementation and may be impossible when the target and adaptee types do not fit C#'s single-class-inheritance model.

An adapter is different from adjacent patterns:

- A **decorator** keeps the same contract and adds or modifies behavior, such as metrics or caching. An adapter changes the contract seen by its client.
- A **facade** gives a simpler entry point to a subsystem, which may contain several collaborators. It need not make an incompatible API conform to an existing target.
- A **proxy** controls access to an object while typically presenting the same contract; a proxy may defer creation or enforce access policy.

The abstraction has a cost. A one-line rename for an internal type may not justify a separate layer. Conversely, exposing a provider's request and response types in a core interface defeats much of the boundary. Keep translation focused; retries, caching, and circuit breaking usually belong in explicit policies or decorators rather than being hidden in a conversion type.

## Testing and production pitfalls

Unit-test translation with a fake or stub of the adaptee: verify request mapping, successful response conversion, malformed responses, cancellation, and known error mapping. The application use case can be tested against a fake `IExchangeRateProvider`, independently from the vendor SDK. Keep an integration test for assumptions that only the actual provider can confirm, such as serialization, authentication, rate limits, and SDK behavior.

Production risks include semantic mismatches that compile but are wrong: local versus UTC time, decimal versus floating-point precision, inclusive versus exclusive pagination, or provider-specific “not found” errors. Define the contract precisely and validate inputs and outputs at the boundary. Preserve cancellation and avoid catching broad exceptions unless translating them is intentional. Log useful context without logging secrets or sensitive payloads.

When an external contract evolves, keep version-specific handling behind the adapter where possible. If two vendor API versions coexist during a migration, separate adapters can implement the same application interface while configuration chooses between them. This avoids leaking version checks through use cases. Monitor mapped failures and unexpected response shapes so translation defects are visible before they become silent data-quality problems.

In an interview, identify the client-side target interface, the incompatible adaptee, and the exact conversion performed. Explain where it is registered and how tests can replace it. Do not claim that every third-party dependency needs an adapter; use one when it creates a real boundary, contains meaningful translation, or improves substitution and testability.

## Related Topics

- [Decorator](decorator.md)
- [Facade](facade.md)
- [Dependency Injection](../aspnet-core/dependency-injection.md)
- [Composition vs Inheritance](../csharp/composition-vs-inheritance.md)
