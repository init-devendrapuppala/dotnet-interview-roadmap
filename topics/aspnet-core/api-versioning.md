## Why API versioning matters

Versioning lets a server evolve without silently changing the contract existing clients depend on. It is not a substitute for backward-compatible design: additive optional fields are often compatible, while changing meaning, requiredness, or response shape can break consumers. Keep the number of supported versions bounded and publish a deprecation and retirement policy.

## Common approaches

An API can identify a version in the URL (`/api/v2/orders`), a query string, a request header, or a media type. URLs are easy to inspect, cache, and route, at the cost of version appearing in the resource path. Headers/media types keep resource URLs stable but are less visible and require clients and tooling to preserve negotiation metadata. Pick one convention deliberately; supporting several increases testing and documentation work.

With the `Asp.Versioning.Http` package, a minimal API can opt in to explicit versions (package APIs can vary by major version):

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services
    .AddApiVersioning(options =>
    {
        options.DefaultApiVersion = new ApiVersion(1, 0);
        options.AssumeDefaultVersionWhenUnspecified = false;
        options.ReportApiVersions = true;
    })
    .AddApiExplorer();

var app = builder.Build();
var v1 = app.NewVersionedApi();
v1.MapGet("/orders", () => Results.Ok(Array.Empty<string>()))
    .MapToApiVersion(1.0);
app.Run();
```

Confirm package-specific registration and endpoint conventions against the version in the project. Test route selection, unsupported/missing versions, generated OpenAPI documents, and behavior during deprecation. Versioning is at the contract boundary; it need not imply duplicated business logic—shared application services can serve multiple representations.

**Interview check:** A new optional response property does not automatically require a new API version. Ask whether existing clients can safely ignore it and whether its semantics preserve the old contract.

## Choosing and operating a versioning strategy

The right scheme depends on the clients and infrastructure, not on fashion. A URL version (`/api/v2/orders`) is explicit in logs, browser tools, caches, and gateway rules; the cost is that version identifiers become part of resource URLs. A query parameter is easy for ad hoc clients but often needs extra cache-key care. Header or media-type versioning keeps URLs stable, but debugging, client generation, and cache variation require more discipline. Whichever scheme is selected, define a default policy deliberately. Silently treating a missing version as the newest can turn an older client request into a breaking change.

Version boundaries belong at the transport contract. Keep application operations shared where their semantics are shared, then adapt version-specific DTOs at the endpoint boundary:

```csharp
public sealed record OrderV1Response(int Id, string Status);
public sealed record OrderV2Response(int Id, string Status, DateTimeOffset CreatedAt);

// Each versioned endpoint can map a shared application result to its own DTO.
```

Do not fork the entire domain model just because a response contract differs. Conversely, do not force old and new clients through one DTO when the meaning or required workflow has changed. Explicit mapping keeps persistence changes from accidentally changing public contracts.

## Compatibility, deprecation, and testing

Compatibility is more than adding a route. Verify route selection for a missing, supported, unsupported, and retired version; test that the correct response schema and authorization policy are selected. Version-specific OpenAPI documents should represent the contract clients actually use. Contract tests can compare generated schemas or exercise representative consumer scenarios in CI.

Decide how long to support each version, how clients will be warned, and how usage will be measured before launch. Deprecation and sunset headers can help only if consumers and intermediaries see them; pair them with migration instructions and a published date. Remove old versions only after communicating and verifying remaining use. Do not promise indefinite compatibility if the team cannot maintain it.

At interviews, distinguish versioning a public contract from versioning an internal deployment or database schema. They solve different compatibility problems. A new endpoint, an additive response field, or a feature negotiation can sometimes be safer than a new major API version, while a changed business meaning may require a new contract even when the JSON shape is unchanged.

## Related Topics

- [Versioning overview](./versioning.md)
- [Web APIs](./web-api.md)
- [OpenAPI and Swagger](./openapi-swagger.md)
- [Routing](./routing.md)