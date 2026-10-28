## Why structured logs matter

Logs are operational events, not just formatted strings. ASP.NET Core uses `ILogger<T>` with providers configured through logging extensions; structured properties make events filterable across services. Prefer message templates with named fields rather than interpolated strings:

```csharp
logger.LogInformation("Order {OrderId} accepted for customer {CustomerId}",
    orderId, customerId);
```

Use levels consistently: Trace/Debug for diagnostics, Information for meaningful lifecycle events, Warning for recoverable anomalies, Error for failed operations, and Critical for severe service-wide conditions. Avoid logging every successful request at high volume when access logs/metrics already cover it. Log exceptions once at the boundary that has enough context to act, and include the exception object so stack information is retained.

Treat logs as sensitive data. Never log passwords, access tokens, full authorization headers, secrets, or unnecessary personal data. Apply retention, access controls, and redaction. Avoid using high-cardinality values (request IDs, user IDs) as metric labels; they can be useful log fields, but not unbounded dimensions in metrics.

For production diagnosis, correlate logs with distributed traces and metrics. Propagate trace context across services, include trace/span identifiers through supported logging integration, and ensure health checks and background workers also produce actionable telemetry. Console output is convenient in containers when the platform collects it; choose providers/exporters that match deployment and cost constraints.

Do not treat logs as durable audit records unless the system specifically guarantees integrity, retention, access, and completeness. Security/audit events may require a separate pipeline and policies. Logging failures should not normally crash request handling, but silently losing all telemetry can also conceal outages—monitor the telemetry path.

## Logging practices in ASP.NET Core

Use dependency-injected `ILogger<T>` so events carry a category that identifies the component. Structured message templates preserve named values as fields; interpolated strings are rendered too early for many providers to index them consistently. Keep templates stable and make event properties useful for querying. Do not build a log event for every loop iteration or successful low-value operation; high volume increases cost and can obscure failures.

Scopes attach shared context to a group of events. A request can carry a correlation or tenant identifier through a logging scope, but only include data that is safe and bounded. ASP.NET Core's request logging and tracing integrations can correlate events with trace identifiers; propagate W3C trace context across supported service boundaries. Use logs for individual narratives, metrics for aggregate rates/latencies, and traces for causality across multiple calls.

## Levels, redaction, and retention

Choose severity by operational action, not by whether an exception exists. Warning indicates an unexpected but handled condition; Error indicates an operation failed and needs attention; Critical should be reserved for service-wide or severe failures. Expected validation failures usually belong in metrics or low-level telemetry rather than one Error event per request. Log an exception once at a boundary with actionable context and preserve the exception object; avoid duplicate logging in each layer.

Logs can contain sensitive data even when code does not explicitly log secrets: request URLs, headers, exception messages, SQL parameters, and third-party SDK events may include them. Redact access tokens, cookies, passwords, connection strings, payment details, and unnecessary personal data. Apply access control, retention, encryption, and deletion policies to the collection system. Do not use logs as an audit source unless the audit pipeline is designed for integrity, completeness, and non-repudiation.

## Performance and diagnostics

Prefer source-generated logging for exceptionally hot paths if profiling shows formatting/allocation costs matter; first reduce unnecessary event volume. Avoid high-cardinality metric labels such as raw user IDs, request IDs, or full URLs. They may be suitable as carefully protected log fields, but can explode metrics storage. Sampling and filtering should preserve enough error and slow-request detail to diagnose incidents.

Monitor exporter/provider health and dropped-event counts. A synchronous remote log sink on the request path can add latency or cause failures; prefer resilient asynchronous collection with bounded buffers and a documented loss policy. Validate log output in deployment, including structured fields and trace correlation. In interviews, explain how logs differ from metrics/traces, why templates matter, and how to prevent logging credentials while retaining useful incident context.

## Related Topics

- [Exception handling](./exception-handling.md)
- [Global error handling](./global-error-handling.md)
- [Health checks](./health-checks.md)
- [Hosted services](./hosted-services.md)
- [Configuration](./configuration.md)