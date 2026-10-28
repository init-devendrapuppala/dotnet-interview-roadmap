## .NET application configuration

Configuration is application input, not a value compiled into the runtime. In .NET apps, configuration providers commonly compose settings from JSON files, environment variables, command-line arguments, secret stores, and custom sources. In ASP.NET Core, the host configures a provider stack and later providers typically override earlier ones; exact defaults depend on the app template/host and should be inspected rather than assumed.

```text
appsettings.json
    ↓ overridden by environment-specific JSON
environment variables
    ↓ overridden by command-line arguments
effective configuration → options/services/application
```

The `IConfiguration` abstraction exposes hierarchical keys, commonly represented with `:` (`Logging:LogLevel:Default`). Environment variables often use `__` to express hierarchy (`Logging__LogLevel__Default`). Strongly typed options bind settings into classes; validate required values at startup so a service fails fast rather than failing on a rarely exercised request. Avoid injecting raw configuration throughout the codebase when a validated options contract is clearer.

### Binding, validation, and reload semantics

Binding is a convenience, not validation. Configuration can be syntactically bindable while semantically unsafe: a timeout can be negative, a URI can point to the wrong host, or mutually exclusive settings can both be present. Bind a narrow section to an options type, validate individual values and cross-property invariants, and use startup validation for settings needed to serve traffic.

`IOptions<T>`, `IOptionsSnapshot<T>`, and `IOptionsMonitor<T>` have different consumption and lifetime semantics. A singleton should not depend on a scoped snapshot. Reloadable providers can notify an options monitor, but changing a value does not automatically make every downstream client safely reconfigure itself. Treat live configuration changes as a designed feature: validate the replacement, make the consumer's update atomic, and log that a non-secret setting changed.

### Environments, secrets, and deployment

Environment names such as `Development`, `Staging`, and `Production` are conventions selected by the host, not security boundaries. `appsettings.Development.json` must not become a repository for production credentials. User Secrets support local development but are not an encrypted production secret store. Use a managed secret service or protected deployment mechanism, constrain access, rotate credentials, and avoid logging resolved secret values.

Container and orchestrator environments make environment variables convenient, but values can leak through process inspection, diagnostics, or logs. Restrict access accordingly. Validate configuration per deployment environment, and distinguish absent, empty, malformed, and defaulted values; silently accepting defaults for a missing connection string can produce confusing operational failures.

Useful practices include a typed options class, binding from a clear section, validation on startup, and tests for each configuration source expected in production. When debugging, log which source/key is missing without exposing secret contents.

### Guarantees vs implementation details

`IConfiguration` and documented provider semantics are supported APIs. Default provider order can vary with host setup and framework templates; custom providers may change it. Make precedence explicit and test effective values rather than relying on an assumed default ordering.

### Production review questions

For each setting, identify the owner, source, default, validation rule, secrecy classification, and reload expectation. Configuration values often appear in process dumps, CI diagnostics, and support bundles; redact by name and avoid treating an environment variable as automatically secret. In a multi-instance deployment, a configuration rollout can be temporarily inconsistent, so settings that alter protocol or schema behavior need compatibility planning.

## Related Topics

- [Project SDK](project-sdk.md)
- [Build process](build-process.md)
- [ASP.NET Core configuration](../aspnet-core/configuration.md)
- [Options pattern](../aspnet-core/options-pattern.md)
- [Secrets Manager](../aws/secrets-manager.md)
