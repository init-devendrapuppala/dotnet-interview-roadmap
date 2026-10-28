## Designing an ASP.NET Core Web API

A Web API is an HTTP contract: status codes, headers, request/response schemas, authentication requirements, and compatibility all matter. Controllers and minimal APIs both use endpoint routing and can share middleware, DI, serialization, and authorization. Choose the programming model that suits the application's conventions and team; neither is inherently faster or more secure without measuring the actual workload.

Keep transport DTOs separate from persistence entities. Bind only expected fields, validate input, and enforce authorization for every operation—including object-level ownership checks. Use correct status semantics: for example, 201 with a `Location` for a created resource when appropriate, 400 for invalid input, 401/403 for auth failures, 404 when not found, and 409 for conflicting state. Avoid returning 200 with embedded error details.

Design pagination and limits into collection endpoints. Stable ordering and cursor/keyset pagination can be more reliable than large offsets for frequently changing datasets. Apply request-size limits, timeouts, rate limits, and cancellation propagation. A client disconnect should not leave unnecessary database or downstream work running.

Centralize exception translation, emit Problem Details consistently, and document contracts with OpenAPI. Use idempotency keys or explicit concurrency controls for operations where retries can duplicate side effects. Do not assume HTTP retries are safe for non-idempotent methods. For security, use TLS, validate tokens/cookies correctly, configure CORS only for browser needs, and avoid exposing internal exception data.

Test at several levels: unit-test business decisions, integration-test routing/serialization/auth/middleware, and contract-test important consumers. Monitor latency percentiles, error rates, dependency health, and saturation. Logs help explain individual requests; metrics and traces reveal aggregate and cross-service behavior.

## Contract and operation design

Design endpoints around resource identity and operations clients understand. Use stable status semantics and headers: creation commonly returns 201 with a location, long-running work may return 202 with a status resource, and a conditional update can use ETags or another concurrency token to prevent lost writes. Pagination needs a maximum page size and stable ordering. Cursor/keyset pagination often behaves better than large offsets on frequently changing data, though it requires a suitable sort key and cursor contract.

Retries are unavoidable in distributed clients, but they can repeat a side effect after a timeout even when the server committed it. Make idempotent operations safe to retry; for non-idempotent creates or payments, define idempotency keys and deduplication semantics. Use optimistic concurrency for updates where concurrent writers matter. Do not assume a POST is safe because the client sends it only once.

Treat request data as untrusted. Bind into request DTOs, cap collection and body sizes, validate formats and domain constraints, and authorize the target resource after identifying it. Use cancellation tokens for database and downstream calls but understand that cancellation is not rollback. For browser consumers, CORS is only a browser read policy, not endpoint protection; configure it narrowly and keep auth/authorization on the server.

## Maintainability and verification

Keep controller or minimal endpoint code focused on HTTP concerns and delegate application decisions. Return stable Problem Details for errors and document endpoints with OpenAPI. Version contracts deliberately and review compatibility. Integration tests should cover routing, serialization, validation, authentication, authorization, error mapping, and cancellation-related behavior. Unit tests cover domain decisions; contract tests protect important consumers.

Operationally, define request timeouts, rate limits, payload limits, and dependency budgets. Monitor percentiles (not only average latency), error rates, saturation, and dependency failures. Trace cross-service calls and use logs with trace context for diagnosis. An API can pass its health check while producing poor customer outcomes, so relate operational telemetry to service-level objectives.

At interviews, explain why DTOs prevent over-posting, why authorization must include object-level ownership, how to make retries safe, and why status codes and OpenAPI are part of the client contract rather than implementation details.

## Related Topics

- [Minimal APIs](./minimal-apis.md)
- [Routing](./routing.md)
- [Model binding](./model-binding.md)
- [Authentication](./authentication.md)
- [Problem Details](./problem-details.md)
- [API versioning](./api-versioning.md)
- [Rate limiting](./rate-limiting.md)