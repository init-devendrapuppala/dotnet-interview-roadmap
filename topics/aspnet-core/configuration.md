## Why configuration is layered

Configuration separates deploy-time choices from compiled code. ASP.NET Core's default builder loads providers in a defined precedence order, commonly including JSON files, environment-specific JSON, user secrets in Development, environment variables, and command-line arguments. Later providers override earlier keys. Environment variables commonly use `__` to represent `:` in hierarchical keys, such as `ConnectionStrings__Main`.

Bind related values to options and validate them at startup:

```csharp
builder.Services.AddOptions<PaymentsOptions>()
    .Bind(builder.Configuration.GetSection("Payments"))
    .Validate(o => Uri.TryCreate(o.BaseUrl, UriKind.Absolute, out _),
        "Payments:BaseUrl must be an absolute URI")
    .ValidateOnStart();

public sealed class PaymentsOptions
{
    public string BaseUrl { get; set; } = "";
}
```

Use `IOptions<T>` for values expected to remain fixed for the process lifetime, `IOptionsSnapshot<T>` for scoped recomputation (typically per request), and `IOptionsMonitor<T>` when consumers need change notifications. Provider support and reload behavior vary; a configuration reload does not guarantee every dependent component can safely change live.

Keep secrets out of source, logs, checked-in settings, and error messages. Local user secrets are a development convenience, not a production secret store. Use an appropriately managed secret provider with access controls and rotation. Treat configuration values as untrusted input: validate URLs, sizes, timeouts, and feature switches just as deliberately as request data.

**Interview check:** Environment variables do not always have highest precedence if the app adds custom providers later. Inspect provider registration order rather than relying on a slogan. Configuration is generally read at startup unless a consumer explicitly supports reload.

## Provider precedence and deployment behavior

The configuration system composes providers into one key-value view. The default builder adds conventional sources, but the effective order can be changed by adding or clearing sources. In the default setup, later providers override earlier values. A value in a mounted secret, environment variable, or command-line argument may therefore override a checked-in JSON default without changing the file. When investigating a misconfiguration, inspect the actual environment and provider order rather than looking only at `appsettings.json`.

Hierarchical keys use `:` in configuration APIs; environment variables conventionally use double underscore because a colon is not portable in every shell. For example, `Logging__LogLevel__Default` maps to `Logging:LogLevel:Default`. Arrays and indexed sections can also be represented, but are easy to override incompletely. Make deployment variable names explicit and validate required settings at startup.

## Safe configuration lifecycle

Configuration values cross a trust boundary. Parse and validate connection strings, URLs, certificate paths, timeout values, upload limits, and feature flags. A syntactically valid value can still be dangerous—for example, an untrusted callback URL can cause server-side requests. Fail fast for invalid critical settings, and provide actionable errors without echoing credential material.

Use the development user-secrets mechanism only for local development; it is not encrypted production storage or a deployment secret-management system. Production secrets should be stored in an appropriately managed provider with identity-based access, auditing, and rotation. Keep logs and exception messages from serializing whole configuration objects. Limit who can read deployment variables and process environments, since secrets injected as environment variables may be visible to privileged operators or diagnostics.

Reload support does not mean all consumers update safely. A file provider may signal a change, and `IOptionsMonitor<T>` may expose a new object, yet a database connection pool or singleton client may retain old settings. Define which values are dynamic and how consumers safely swap resources. Test both initial load and reload behavior, including invalid updates and provider outages. Configuration should make operational variation possible without becoming a hidden source of unvalidated runtime behavior.

## Related Topics

- [Options pattern](./options-pattern.md)
- [Dependency injection](./dependency-injection.md)
- [Kestrel](./kestrel.md)
- [Secrets Manager](../aws/secrets-manager.md)
- [Logging](./logging.md)