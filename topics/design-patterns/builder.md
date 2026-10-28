# Builder Pattern

Builder separates the construction of an object from its representation. It is useful when an object has many optional settings, construction has meaningful validation, or a sequence of steps should be readable. It avoids constructors with many positional arguments and prevents partially configured objects from escaping. The central motivation is to give callers a clear construction API while keeping the resulting object in a valid state. A builder is not automatically needed just because a type has several properties.

## Structure and C# implementation

A builder owns intermediate construction state and exposes operations that configure it. A final `Build` operation validates the accumulated state and produces the object, preferably immutable. The classic GoF form can include a director that invokes a prescribed sequence of steps; many C# APIs use a fluent builder directly.

## C# example

```csharp
public sealed record Email(string To, string Subject, string Body);

public sealed class EmailBuilder
{
    private string? _to;
    private string _subject = "(no subject)";
    private string _body = "";

    public EmailBuilder To(string value) { _to = value; return this; }
    public EmailBuilder Subject(string value) { _subject = value; return this; }
    public EmailBuilder Body(string value) { _body = value; return this; }

    public Email Build()
    {
        if (string.IsNullOrWhiteSpace(_to))
            throw new InvalidOperationException("A recipient is required.");
        return new Email(_to, _subject, _body);
    }
}
```

Usage:

```csharp
var email = new EmailBuilder()
    .To("ops@example.com")
    .Subject("Alert")
    .Body("Service restored.")
    .Build();
```

The builder owns temporary mutable state; the resulting value is immutable. Required values are not necessarily best represented by fluent optional setters. If `To` is mandatory and other fields are optional, another design can encode the required value in the builder constructor or use a static factory with required parameters. This makes invalid intermediate states harder to represent. For objects requiring a sequence of operations, a builder can expose named steps; if order matters, document and enforce it rather than relying on callers to remember invisible rules.

Builders also appear in framework configuration APIs, such as `WebApplication.CreateBuilder(args)`. Those APIs assemble a graph of options and services and are not necessarily evidence that each domain value merits a custom builder.

## Tradeoffs and alternatives

- A positional record, object initializer, or constructor with a few well-named parameters is simpler for small objects.
- `required` members and `init` properties can express construction requirements without a separate builder, though they may not enforce cross-property invariants as naturally.
- A builder adds types and mutable intermediate state. Do not create one for every DTO or use one just to make a one-line constructor look fluent.
- The GoF Builder often varies the final representation through a director; many modern C# builders are fluent convenience APIs. Explain which problem the specific builder addresses.
- A factory focuses on choosing or creating a product, often based on a selection or dependency. A builder focuses on assembling one product through configurable steps; the two can be combined when creation requires both selection and complex configuration.
- An object initializer exposes setters directly and can leave an object partially configured. It is concise when that state is acceptable and invariants are simple; a builder is more useful when validation or a controlled construction sequence matters.

## Testing and production pitfalls

Test a successful build, missing required values, invalid combinations, boundary values, and any order-dependent behavior. Since the produced object is immutable, downstream tests can usually construct it directly rather than exercising the builder for every test fixture. Keep validation in one authoritative place rather than duplicating it in each fluent setter.

Watch for builders reused across requests or threads: their mutable state makes that unsafe unless deliberately synchronized. Prefer one short-lived builder per construction. Avoid leaking the builder itself into application operations, retaining external resources in it, or turning it into a general-purpose service locator. A fluent setter should not perform surprising I/O; construction should remain predictable.

For APIs where the order of steps matters, a staged or step builder can expose a different interface after each required step, making invalid order harder to express. This increases generic types and complexity, so reserve it for public APIs where misuse is likely and costly. For internal code, a required constructor parameter plus a validating `Build` method is often a more maintainable compromise.

For interview discussion, describe which complexity is removed from callers, where invariants are checked, and whether the builder is a convenience API or a representation-independent construction process. Explain why a constructor, record, or initializer would be less clear in that particular case. Fluent syntax alone is not a sufficient reason.

## Related Topics

- [Factory](factory.md)
- [Records](../csharp/records.md)
- [Constructors](../csharp/constructors.md)