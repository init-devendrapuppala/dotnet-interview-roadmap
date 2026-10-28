## Why Problem Details helps APIs

Problem Details defines a standard JSON shape for communicating HTTP errors. In ASP.NET Core, `ProblemDetails` and `ValidationProblemDetails` provide common representations, and modern framework integrations can generate them for supported error paths. A consistent shape simplifies clients and observability, but teams still need stable error semantics and safe information disclosure.

A controller can return a problem response explicitly:

```csharp
[HttpGet("{id:int}")]
public IActionResult Get(int id)
{
    var item = _service.Find(id);
    return item is null
        ? Problem(statusCode: StatusCodes.Status404NotFound,
                  title: "Item not found",
                  type: "https://api.example.com/problems/item-not-found")
        : Ok(item);
}
```

Use appropriate status codes and a stable `type` URI or identifier for machine classification. `title` and `detail` are for clients; do not include stack traces, SQL errors, internal hostnames, tokens, or sensitive identifiers. A correlation/trace ID can help support without exposing diagnostics. Validation responses should identify safe field-level issues, not echo secrets submitted by users.

Global exception middleware and Problem Details are complementary: middleware catches unhandled exceptions, while endpoint code can intentionally return a problem for expected 4xx cases. Framework-generated responses depend on registration, content negotiation, and runtime version; test actual API responses, not just DTO serialization. Ensure a response that has already started is not expected to be rewritten.

Do not use a 200 response with an error object for failed operations. Clients, caches, gateways, and monitoring rely on HTTP status semantics. Likewise, not every failure is a client error: unexpected exceptions should generally remain server errors.

## Stable machine-readable errors

Clients should branch on status and a stable problem `type`, not parse human prose. Treat `title` as a short summary and `detail` as safe, instance-specific explanation where appropriate. An API can add extension members such as a trace identifier or validation metadata, but extensions should be documented and should not include internal exception details. A type URI can identify a class of problem and point to human-readable documentation; it need not expose an internal route.

Use `ValidationProblemDetails` when field-level input errors are appropriate. Keep field names aligned with the public request contract and avoid echoing submitted secrets. For authorization, not-found, conflict, and rate-limit outcomes, choose status and headers consistently with the API's semantics. A 429 may include a retry hint when the server can give a meaningful value. Do not return 200 with a Problem Details-shaped error: HTTP status remains essential to clients and intermediaries.

## Framework integration and testing

`AddProblemDetails` can participate in framework error handling, but it does not automatically turn every arbitrary endpoint result into a problem document. Exception middleware, status-code pages, MVC invalid-model handling, and explicit `Problem()` calls have different paths. Content negotiation and the response-started state also matter. Confirm the target ASP.NET Core version's behavior and exercise actual requests.

Tests should assert status, media type, `type`, and safe detail for expected and unexpected failures. Ensure debug diagnostics are disabled in production, trace identifiers are present where useful, and no stack trace or database message appears. Test an unsupported `Accept` header and a failure after response streaming begins. Keep OpenAPI response metadata synchronized with the emitted problem shapes.

An interview answer should distinguish the standardized response format from exception handling: Problem Details shapes an error response, while middleware or endpoint logic decides when and how that response is produced.

## Related Topics

- [Global error handling](./global-error-handling.md)
- [Exception handling](./exception-handling.md)
- [Web APIs](./web-api.md)
- [Model binding](./model-binding.md)
- [OpenAPI and Swagger](./openapi-swagger.md)