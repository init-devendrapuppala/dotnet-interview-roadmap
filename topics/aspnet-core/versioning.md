## API versioning as contract evolution

Versioning is a compatibility policy, not merely a route prefix. First decide whether a change is backward-compatible for existing clients. Adding an optional field is often safe; changing a field's meaning, removing it, or changing required behavior may break consumers even if the URL stays the same.

Common identifiers include URL segments, query parameters, headers, and media types. URL segments are visible and easy to route/cache but duplicate resource paths across versions. Headers/media types keep URLs stable but are easier to omit in clients and can complicate caches and documentation. Be consistent and document how clients select a version, how unsupported versions fail, and how long old versions remain available.

Keep application/domain behavior shared where possible and isolate version-specific request/response mapping at the boundary. Do not expose persistence entities as versioned contracts. Generate and test a separate OpenAPI contract per supported version when clients depend on generated documentation. Include compatibility tests and monitor usage before retiring a version.

The `Asp.Versioning` libraries can implement API version selection for ASP.NET Core, but package APIs and integration differ by framework generation; verify installation and configuration for the project's target version. Version selection should be explicit enough to avoid silently routing a request to an unintended contract. Report deprecation or sunset information only in a way clients can act on, and provide migration guidance.

**Interview check:** Versioning does not excuse breaking changes or eliminate the need for compatibility testing. A new endpoint can sometimes evolve the contract more safely than duplicating an entire API version.

## Evolving contracts deliberately

Write a compatibility policy before an incompatible change is urgent. Identify the supported versions, minimum support window, deprecation process, and the signal clients receive when a version is nearing retirement. Measure version use through safe telemetry, not by guessing from deployment age. Publish migration examples and give consumers a realistic test period.

Keep transport contracts independent from internal entities. A version adapter can map an older request into a current application operation and map the result back to a version-specific response. This reduces duplicated business logic while preserving stable client semantics. However, sharing code should not force versions with genuinely different workflows into a confusing conditional-laden handler. Version-specific behavior should be explicit and testable.

## Compatibility testing and common misconceptions

Test supported, unsupported, missing, deprecated, and retired versions. Check both route selection and generated schema; an endpoint can route correctly while documenting the wrong representation. Add consumer-driven contract tests for critical clients and run schema compatibility checks in CI. Record the versioning convention in OpenAPI and client setup so headers or media-type values are not silently omitted.

An additive field is often compatible only if clients ignore unknown fields and the server does not begin depending on the client to send it. Changing a field's meaning can be breaking even if its JSON type stays identical. Keeping `/v1` in the path does not guarantee backward compatibility; server behavior can still change. Conversely, not every new capability needs a new major version: an optional field, a new resource, or a separately negotiated feature may suffice.

At interviews, distinguish API contract versioning from assembly, database, and deployment versioning. The central goal is controlled evolution for independent consumers, with a plan for supporting and retiring contracts.

## Related Topics

- [API versioning](./api-versioning.md)
- [OpenAPI and Swagger](./openapi-swagger.md)
- [Web APIs](./web-api.md)
- [Routing](./routing.md)