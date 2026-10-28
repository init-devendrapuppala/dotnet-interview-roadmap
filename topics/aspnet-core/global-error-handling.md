## Why centralize HTTP error translation

Central handling gives callers a consistent response shape and keeps exception details out of production responses. In modern ASP.NET Core, `UseExceptionHandler` can route unhandled exceptions to an error endpoint or configured handler; `AddProblemDetails` can provide Problem Details responses for supported error paths. Exact behavior depends on framework version, content negotiation, status-code handling, and whether a response has already started.

Typical registration:

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddProblemDetails();

var app = builder.Build();
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler();
}
app.UseStatusCodePages();
app.MapControllers();
app.Run();
```

Use the framework documentation for the target runtime because minimal-host defaults and Problem Details integration evolve. Exception middleware must be early enough to observe downstream failures; if the response has already started, it may be too late to replace the status/body. Development diagnostics should not leak into public production responses.

Map known application exceptions deliberately to appropriate status codes and stable machine-readable error types. Do not turn every exception into 400: unexpected server failures remain 500, while validation, not-found, conflict, and authorization failures have distinct semantics. Log once with trace context and safe structured properties. Never send stack traces, internal exception messages, database details, or secrets to clients.

Status-code pages can add bodies to otherwise empty error responses, but should not rewrite responses that already contain a body or interfere with APIs that own their format. Test thrown exceptions and ordinary 4xx responses separately, including JSON/API clients, cancellation, and headers.

## Building a consistent error boundary

Separate expected application outcomes from unexpected exceptions. Validation errors, missing resources, and state conflicts should be mapped intentionally; unexpected failures should remain 5xx responses and trigger diagnostic telemetry. A global handler can catch unhandled exceptions, add a trace identifier, and write a safe Problem Details body. It cannot reliably replace a response once headers or body bytes have already been sent, so streaming endpoints and code that writes incrementally need their own failure semantics.

Register the exception boundary early enough to wrap components that can fail. The development exception page is valuable locally because it includes diagnostics, but it must not be exposed in production. `UseStatusCodePages` serves a different purpose: it can add a body to an otherwise empty 4xx/5xx response, but it does not catch thrown exceptions. Avoid layering several handlers that all rewrite or log the same failure.

Map domain or application exceptions through a deliberate, narrow mapping. Do not infer a 400 from every exception or expose exception messages directly. Keep response `type` and status semantics stable so clients can branch safely. Include only safe details; put stack traces, inner exceptions, and downstream diagnostics in restricted logs. An opaque trace ID connects a client's report to internal logs. Redact tokens, credentials, personal information, and request bodies as appropriate.

## Verification and operational considerations

Test endpoint-returned 4xx errors separately from thrown failures, including malformed JSON, authorization challenge/forbid, not found, and conflicts. Assert content type, status, headers, and body shape. Test when `Accept` headers vary, and verify that custom exception handling does not turn a client disconnect into an error alert. Ensure telemetry records one actionable event with route and trace context but not sensitive payloads.

Global handling is a final safety net, not permission to ignore local recovery. It cannot retry a partially completed transaction safely, decide whether a message should be acknowledged, or undo an external side effect. Those choices belong to the relevant operation. In an interview, describe both the middleware boundary and the fact that HTTP response status can only be changed before the response starts.

## Related Topics

- [Exception handling](./exception-handling.md)
- [Problem Details](./problem-details.md)
- [Middleware](./middleware.md)
- [Logging](./logging.md)
- [Web APIs](./web-api.md)