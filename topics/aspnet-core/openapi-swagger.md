## Why describe the API contract

OpenAPI is a machine-readable description of an HTTP API: paths, operations, parameters, schemas, responses, and security requirements. Swagger commonly refers to the ecosystem of tooling that can display or exercise an OpenAPI document. Generated documentation improves discoverability and client generation, but it does not prove that runtime behavior matches the contract.

In modern ASP.NET Core, OpenAPI generation can come from built-in services or packages such as Swashbuckle/NSwag. The exact setup depends on target framework and chosen tool. A common package-based pattern is:

```csharp
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
```

Expose documentation according to deployment policy; an internal API may still need authentication or network controls in production. Do not mistake hiding Swagger UI for securing endpoints. Document authentication schemes, versioning, error responses, pagination, and constraints. Add accurate response metadata and descriptions, especially when an endpoint returns multiple outcomes.

Review generated documents in CI for breaking changes and test representative requests against the running application. Generation may miss polymorphism, custom serialization conventions, minimal API result unions, or runtime authorization rules unless configured. Keep docs aligned with deployed versions; stale docs are worse than none for client integrations.

Generated client code is coupled to schema and generator choices. Treat it as a build artifact or checked-in contract according to team policy, and review changes rather than assuming regeneration is harmless.

## Contract quality and security metadata

OpenAPI is most useful when it describes what clients can actually rely on. Specify request and response schemas, required fields, formats, pagination parameters, relevant status codes, and authentication schemes. A generated document may not infer every union response, validation error, polymorphic type, or endpoint convention. Add explicit metadata where inference is incomplete, then inspect the emitted document rather than assuming annotations had the intended effect.

Do not treat Swagger UI as the API itself. Protecting or disabling the UI does not protect API routes; conversely, exposing an OpenAPI document can reveal endpoint names and schemas but does not automatically grant access. Apply API authorization at runtime. If documentation is public, ensure it does not contain internal hostnames, secrets, or operational details. If it is internal, use network/access controls appropriate to the environment.

## Versioning and change management

For versioned APIs, generate a document per supported contract and ensure endpoint metadata is associated with the right version. Generated client code depends on both schema and generator configuration, so a change can alter generated method names or nullable types even when the server still works. Pin generator versions, review diffs, and communicate breaking changes. CI can compare OpenAPI documents and fail on incompatible changes, but compatibility tooling must be configured for the client's real expectations.

Use integration tests that start the application and retrieve the document. Check that the document is valid, routes exist, auth requirements are present, error responses are documented, and sensitive endpoints are not accidentally described as anonymous. A smoke test against representative requests confirms runtime behavior; a schema snapshot alone does not ensure the server matches documentation.

Interview note: OpenAPI is a contract description, not runtime validation or authorization. Swagger UI is one viewer/tooling option. Discuss how generation fits into CI, how the document changes with API versioning, and how you would prevent docs from silently drifting from behavior.

## Related Topics

- [Web APIs](./web-api.md)
- [API versioning](./api-versioning.md)
- [Versioning overview](./versioning.md)
- [Minimal APIs](./minimal-apis.md)
- [Problem Details](./problem-details.md)