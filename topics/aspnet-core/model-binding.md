## Why binding is part of the HTTP contract

Model binding converts request data—route values, query strings, headers, form fields, and bodies—into action/handler parameters. Source selection and validation rules affect what clients can send and how invalid input is reported. Be explicit for non-obvious sources, especially in APIs where ambiguity could lead to different behavior after a refactor.

```csharp
[HttpGet("orders/{id:int}")]
public IActionResult Get(
    [FromRoute] int id,
    [FromQuery] int page = 1)
{
    if (page < 1) return BadRequest();
    return Ok(new { id, page });
}
```

In controller APIs with `[ApiController]`, invalid model state can automatically produce a 400 response, and binding-source inference applies in supported cases. Minimal APIs have their own binding and validation behavior, which evolves across framework versions; do not assume controller conventions apply identically. A request body is typically consumed once, so avoid multiple body-bound parameters or middleware that reads the body without enabling/re-winding buffering carefully.

Validation attributes and custom validators can enforce shape and domain-independent constraints, but authorization and business invariants remain separate. Validate numeric ranges, string sizes, collection counts, and nested objects; model binding is not a defense against oversized request bodies or malicious file content. Return useful, stable validation details without exposing implementation internals.

For PATCH or partial updates, distinguish omitted fields from explicit null/default values when the contract requires it; ordinary DTO properties may not preserve that distinction. Use dedicated request DTOs instead of binding persistence entities, preventing over-posting and unintended field updates. Test malformed JSON, missing required values, conversion failures, and boundary cases.

## Binding sources and validation boundaries

Controllers use model binders and input formatters to populate parameters. Route and query values are text that must be converted; headers and form values have their own conventions; JSON bodies are handled by input formatters. `[FromRoute]`, `[FromQuery]`, `[FromHeader]`, `[FromForm]`, `[FromBody]`, and `[FromServices]` make source selection explicit. `[ApiController]` adds useful API conventions such as automatic 400 responses for invalid model state and binding-source inference for supported parameter patterns, but the exact conventions should be verified for the target framework.

Minimal API binding is related but not identical. Route values, query values, services, and body types are inferred according to minimal API rules; custom `BindAsync` or `TryParse` patterns can add binding support. Do not assume MVC model binders, filters, and validation attributes behave exactly the same for every minimal endpoint and framework version. Write an integration test when binding semantics are important to the contract.

Model validation should handle inexpensive shape and format constraints: requiredness, ranges, lengths, and nested object structure. Domain rules (for example, whether a state transition is allowed) belong in an application/domain layer, and authorization is a separate decision. A syntactically valid integer ID does not imply the resource exists or belongs to the caller. Map validation failures into a stable, safe response format.

## Over-posting, partial updates, and body limits

Binding directly to an EF entity can let a caller set properties the endpoint never intended to expose. Define request DTOs containing only allowed fields and explicitly map them to domain operations. This is especially important for fields like tenant ID, account status, owner, price, and role that could alter authorization or business rules. Hidden form fields are still user input.

Partial updates need a contract for omission and null. With ordinary nullable properties, omitted and explicit `null` can collapse to the same value; value types may also default to zero/false. Use a patch document, optional wrapper, or dedicated update semantics when the difference matters, and test it. Avoid accepting arbitrary JSON merge behavior without validating which fields may change.

Binding does not itself protect against a huge body. Configure reverse-proxy, server, form, and application size limits. Use streaming for large payloads, and be aware that middleware reading the request body can interfere with binding. Avoid multiple body-bound parameters and unsafe body buffering.

## Interview and test checklist

Test route/query conversion errors, missing fields, malformed JSON, nested validation, unsupported content types, over-posting attempts, and partial-update omission. Assert the resulting status and error representation. At interview, explain the difference between binding, validation, business rules, and authorization; mention `[ApiController]` behavior without assuming that it applies universally to minimal APIs. A useful request contract is explicit, bounded, and independent of persistence shape.

## Related Topics

- [Web APIs](./web-api.md)
- [Minimal APIs](./minimal-apis.md)
- [Problem Details](./problem-details.md)
- [File upload](./file-upload.md)
- [Routing](./routing.md)