## Why routing is more than path matching

Endpoint routing matches an incoming request to an endpoint using route templates, HTTP methods, constraints, and endpoint metadata. It also makes metadata available to middleware—for example, authorization and CORS policies—before endpoint execution. Route design is part of the public API contract, so avoid ambiguous templates and unstable identifiers.

```csharp
app.MapGet("/orders/{id:int}", (int id) => Results.Ok(new { id }))
   .WithName("GetOrder")
   .RequireAuthorization();
```

Constraints such as `:int` help disambiguate matches; they are not input validation for every business rule. Use explicit HTTP method mappings, stable route names where URL generation matters, and meaningful status codes for unmatched routes versus method mismatches. Attribute routing on controllers and route groups in minimal APIs organize endpoints differently but both participate in endpoint routing.

Middleware ordering matters: call `UseRouting` before middleware that inspects endpoint metadata, then execute mapped endpoints after required middleware. In modern minimal-host apps, some middleware may be inserted automatically, but explicit ordering is clearer when adding CORS/authentication or custom components. Verify effective behavior in integration tests.

Keep route templates resource-oriented and avoid leaking internal database keys if they are sensitive or changeable. Model binding converts matched route values but cannot authorize access. Validate IDs, then apply resource-based authorization. Test overlapping routes, optional segments, constraints, trailing slash behavior, and generated links.

## Endpoint metadata and URL generation

Endpoint routing separates route matching from endpoint execution. Once an endpoint is selected, metadata can drive authorization, CORS, rate limiting, OpenAPI, and other middleware behavior. Metadata can be attached through attributes, endpoint conventions, route groups, or endpoint builder methods. Be cautious when combining group-level and endpoint-level metadata: determine whether the framework combines, replaces, or evaluates values in the relevant feature instead of assuming that a child endpoint overrides everything.

Named routes/endpoints support link generation without hard-coding path strings. This is useful when route templates may evolve, but names must be unique and consistently applied. Controller attribute routes and minimal API maps are different authoring styles over the same endpoint-routing infrastructure. Use constraints to disambiguate templates and reject invalid route shapes early; still validate business rules after binding.

## Route design and testing

Choose resource-oriented paths and explicit HTTP methods. Avoid ambiguous optional segments and catch-all patterns that make future routes difficult to add. Do not treat a numeric or GUID constraint as authorization, and avoid exposing internal identifiers if their disclosure has business implications. Route matching determines which handler is selected; it does not prove that the caller may access the associated data.

Test overlapping paths, constraints, encoded characters, optional values, casing/trailing-slash behavior required by the app, named-link generation, and unsupported methods. Integration tests should exercise middleware order so endpoint metadata reaches authorization and CORS. For a route that should be public or private, test both anonymous and authenticated calls. A 404 can be deliberate to conceal resource existence, but the choice should be consistent.

Interview note: endpoint routing is not only URL parsing; metadata selected during routing enables middleware to make endpoint-specific decisions before the handler runs. Routing and model binding are separate: routing chooses a route and extracts values, while binding converts values into typed parameters.

## Related Topics

- [Request pipeline](./request-pipeline.md)
- [Middleware](./middleware.md)
- [Model binding](./model-binding.md)
- [Minimal APIs](./minimal-apis.md)
- [Authorization](./authorization.md)