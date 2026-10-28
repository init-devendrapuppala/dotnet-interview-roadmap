# Factory Pattern

“Factory” is an umbrella term for moving object creation behind a method or abstraction. It is useful when creation involves selection, configuration, validation, or dependencies that callers should not construct themselves. It is not automatically the right answer for a simple `new`. The motivation is to keep construction policy out of callers. If many clients duplicate a rule for choosing a parser, payment method, or transport, a change to that rule must be repeated and may become inconsistent. A factory gives that decision one owner.

## Simple factory in C#

## Simple factory in C#

```csharp
public interface IFileParser
{
    Task<Document> ParseAsync(Stream input, CancellationToken cancellationToken);
}

public sealed class FileParserFactory(
    CsvParser csv,
    JsonParser json)
{
    public IFileParser For(string format) => format.ToLowerInvariant() switch
    {
        "csv" => csv,
        "json" => json,
        _ => throw new NotSupportedException($"Unsupported format: {format}")
    };
}
```

This is a simple factory: a concrete class chooses an implementation. The sample assumes `Document`, `CsvParser`, and `JsonParser` are application types, that both parsers implement `IFileParser`, and that their dependencies are registered and supplied through DI. In a real API, normalize and validate the format at the boundary, and decide whether an unsupported format is an exception, a validation result, or a fallback. If formats are registered dynamically, use a keyed service or a registry rather than expanding a switch indefinitely. A registry should validate duplicate and missing keys during startup when possible, not discover configuration mistakes only after traffic arrives.

## Distinguish the names

- **Simple factory** is an everyday idiom, not a formal GoF pattern.
- **Factory Method** lets subclasses or implementations decide which product to create through an overridable/abstract creation method.
- **Abstract Factory** creates a family of related products without exposing their concrete classes, useful when a whole set of compatible implementations varies together.

Do not use these terms interchangeably in an interview. For ASP.NET Core services, DI often already performs construction; a factory remains useful when the choice is runtime- or input-dependent.

A factory and a strategy can work together but answer different questions: a factory chooses or creates an implementation, while a strategy represents interchangeable behavior after it has been selected. A builder is focused on assembling a complex product through steps. DI construction is normally configuration-time wiring; a runtime factory is justified when the application must choose among valid options based on a request or domain state.

Do not let factories become a second dependency-injection container. Avoid APIs such as `Create(Type)` returning arbitrary objects or factories that resolve unrelated services by string. Prefer narrow return types and explicit selection criteria. If creation requires substantial validation or side effects, separate those concerns so a method named `Create` does not conceal unexpected network access.

## Tradeoffs, testing, and production pitfalls

A factory centralizes selection and can prevent invalid construction, but can also duplicate the container or become a large conditional. Prefer explicit registration and a small selection policy. A simple `new` is clearer when a single concrete object has no meaningful variation and callers already own the construction decision. Introduce a factory for a demonstrated seam, not as ceremony around every constructor call.

Test each supported selection, unsupported input, and that the returned implementation satisfies the expected contract. Inject factory dependencies so unit tests can substitute fakes; integration-test actual parser registration and configuration. If only one implementation exists and construction is straightforward, constructor injection is usually clearer. Tests should also cover any fallback or precedence rule, since accidental default selection can silently route work to the wrong provider.

Production concerns include unbounded caching of created instances, incorrect lifetime reuse, and inconsistent selection logic across entry points. Clarify whether the factory returns a shared DI-managed service or creates a new disposable instance. If each product owns resources, define who disposes it. Runtime configuration changes should either be supported explicitly or require restart; avoid half-updated registries.

Selection should be deterministic for a given input and configuration. If a default implementation is intentional, make that choice visible in code and telemetry; silently choosing the first registration can turn order-dependent configuration into production behavior. When factories create disposable products, favor a clear ownership contract such as a factory-created scope or an explicit disposal interface rather than returning an object whose lifetime is ambiguous.

In interviews, state the variation point, who chooses the product, and whether the term refers to a simple factory, Factory Method, or Abstract Factory. Explain why DI alone does or does not meet the use case and how unsupported choices are surfaced.

## Related Topics

- [Builder](builder.md)
- [Strategy](strategy.md)
- [Dependency Injection](../aspnet-core/dependency-injection.md)