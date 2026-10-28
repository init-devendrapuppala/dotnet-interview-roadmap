## Why minimal APIs are useful

Minimal APIs provide endpoint routing and HTTP features without requiring controller classes. They reduce ceremony for focused services and make endpoint composition explicit; they do not remove the need for validation, authorization, error handling, or clean boundaries. Controllers may still be a better fit for large MVC applications, conventions, or teams that benefit from their established structure.

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddScoped<IOrderService, OrderService>();
var app = builder.Build();

app.MapGet("/orders/{id:int}", async (
    int id, IOrderService orders, CancellationToken cancellationToken) =>
{
    var order = await orders.FindAsync(id, cancellationToken);
    return order is null
        ? (IResult)Results.NotFound()
        : Results.Ok(order);
})
.RequireAuthorization();

app.Run();
```

Parameters can be bound from route, query, headers, body, or DI according to framework binding rules and explicit attributes. A complex body parameter is typically deserialized from JSON; avoid ambiguous multiple body reads. Use endpoint filters for endpoint-level cross-cutting behavior, not as a replacement for middleware that applies globally.

Apply authorization with endpoint metadata or policies; validate input and return deliberate status codes. Group related endpoints with `MapGroup` to share prefixes, tags, filters, and policies. Generated OpenAPI metadata depends on types and annotations; verify the document, especially for union results, validation errors, and auth requirements.

Minimal syntax can still hide a large handler if business logic is embedded in lambdas. Keep endpoints as transport adapters that invoke application services. Test through `WebApplicationFactory`/integration tests where practical, because unit testing a delegate alone does not verify routing, middleware, serialization, or auth.

## Organizing endpoints as the API grows

Minimal API is a programming model, not an instruction to put every operation in `Program.cs`. Use route groups to give related endpoints a prefix and shared conventions:

```csharp
var orders = app.MapGroup("/api/orders")
    .RequireAuthorization()
    .WithTags("Orders");

orders.MapGet("/{id:int}", GetOrder);
orders.MapPost("/", CreateOrder);
```

Groups can apply authorization, filters, names, and metadata consistently. Be careful when a nested group or endpoint overrides metadata; review the final endpoint contract. Extract endpoint-mapping methods or modules by feature so application startup remains readable, while keeping each handler thin and moving business decisions to injected services.

Typed result unions can describe multiple outcomes and improve generated OpenAPI metadata, but verify the generated schema and status responses with the framework/package version in use. Use explicit `Produces` metadata where inference is incomplete. Parameter binding rules infer route/query/services/body sources based on parameter shape and registrations; explicit attributes can make public contracts easier to review. Only one parameter should normally consume the request body because the body is not inherently replayable.

## Validation, security, and testing

Minimal APIs do not imply automatic validation or authorization for every endpoint. Validate boundary input, apply request limits, use DTOs rather than persistence entities, and enforce object-level access after loading the resource. Attach policies consistently through groups or named endpoint conventions. Do not rely on obscurity, route constraints, or frontend validation as security controls.

Unit tests can invoke application services and pure mapping logic. Integration tests using `WebApplicationFactory` verify route templates, middleware ordering, model binding, JSON serialization, authorization, and Problem Details responses in a running test host. Include negative cases: anonymous callers, malformed JSON, unknown IDs, invalid ranges, and conflicting state. Keep OpenAPI generation under test when client code relies on it.

At interviews, distinguish reduced ceremony from reduced architecture. Minimal APIs and controllers share core ASP.NET Core infrastructure; choosing minimal endpoints does not remove DI, routing, filters (though MVC filters do not apply), binding, or middleware. The best endpoint style is the one the team can keep consistent and maintain as the surface grows.

## Related Topics

- [Web APIs](./web-api.md)
- [Routing](./routing.md)
- [Model binding](./model-binding.md)
- [Filters](./filters.md)
- [OpenAPI and Swagger](./openapi-swagger.md)