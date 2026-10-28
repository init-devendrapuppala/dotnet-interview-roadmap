## Why bind configuration to options

The options pattern turns related configuration values into a typed object that can be validated and injected. This reduces scattered string lookups and makes dependencies testable. Bind one logical section, validate required values, and fail at startup when invalid configuration would make the service unsafe or unusable.

```csharp
builder.Services.AddOptions<MailOptions>()
    .Bind(builder.Configuration.GetSection("Mail"))
    .Validate(o => o.Port is > 0 and <= 65535, "Mail:Port is invalid")
    .ValidateOnStart();

public sealed class MailOptions
{
    public string Host { get; set; } = "";
    public int Port { get; set; }
}
```

`IOptions<T>` provides a stable value suitable for singleton consumers; `IOptionsSnapshot<T>` is scoped and computes a snapshot per scope; `IOptionsMonitor<T>` supports current values and change notifications when configured providers reload. They are not interchangeable, and snapshot/monitor do not guarantee that the dependent network client can safely reconfigure itself mid-flight.

Use data annotations or custom validation for cross-field rules. For secrets, options are merely a binding mechanism—not a secret store. Keep secret sources controlled, restrict access, and avoid logging entire option objects. Named options help configure multiple instances of the same type, such as several downstream clients.

A common mistake is injecting `IOptionsSnapshot<T>` into a singleton, which violates scope rules. Another is expecting JSON reload to alter an already-created singleton dependency automatically. Decide whether the value is startup-only or dynamic and design the consumer lifecycle accordingly.

## Validation and registration strategy

Configuration binding maps keys into properties; binding by itself does not guarantee that the values make sense. Validate at the startup boundary so an invalid port, endpoint, or security setting fails before traffic is served:

```csharp
builder.Services.AddOptions<StorageOptions>()
    .Bind(builder.Configuration.GetSection("Storage"))
    .ValidateDataAnnotations()
    .Validate(o => Uri.TryCreate(o.Endpoint, UriKind.Absolute, out _),
        "Storage:Endpoint must be an absolute URI")
    .ValidateOnStart();
```

For related options, custom validators can check cross-property invariants, such as a timeout range or the required relationship between endpoint and credentials. Use clear validation errors but never include secret values in them. Register and validate each logical options section once in startup code so consumers do not duplicate binding logic.

## Selecting the options interface

`IOptions<T>` is a singleton-friendly abstraction for a value expected to be fixed after startup. `IOptionsSnapshot<T>` is scoped and computes a value for a scope, commonly one HTTP request; it cannot be injected into a singleton. `IOptionsMonitor<T>` exposes current values and change notifications and can be used by singleton consumers. These abstractions describe how the options value is obtained, not whether the service using it can reconfigure safely.

Named options support multiple configurations of one type—for example, named outbound clients. Prefer typed `HttpClient` registration for HTTP client configuration rather than manually resolving an arbitrary options name in business code. If a monitored value changes, decide how to replace dependent resources atomically and dispose old instances safely. A reload token does not rebuild every singleton automatically.

## Testing and common mistakes

Test valid and invalid configuration, default values, missing required keys, and reload behavior if it is supported. Unit tests can construct options directly, while integration tests ensure actual providers and validation startup run. Avoid mutable static configuration, passing `IConfiguration` deep into every service, or injecting snapshot options into a singleton. Do not log full options objects because they may include credentials.

At interview, explain that the options pattern is typed configuration plus validation and lifetime semantics—not a secret manager. A good answer says which interface fits the consumer lifetime and what happens if configuration changes while requests are in flight.

## Related Topics

- [Configuration](./configuration.md)
- [Dependency injection](./dependency-injection.md)
- [Kestrel](./kestrel.md)
- [Background services](./background-services.md)