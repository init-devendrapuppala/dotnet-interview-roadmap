# System.Text.Json

`System.Text.Json` is the built-in JSON library for .NET. `JsonSerializer` can serialize to strings or UTF-8 bytes and deserialize into typed models.

```csharp
var options = new JsonSerializerOptions(JsonSerializerDefaults.Web)
{
    PropertyNameCaseInsensitive = true
};
byte[] json = JsonSerializer.SerializeToUtf8Bytes(message, options);
Message? value = JsonSerializer.Deserialize<Message>(json, options);
```

Configure options deliberately: naming policies, converters, number handling, unknown members, and null behavior affect wire compatibility. Reuse options rather than constructing them for every operation. Use `Utf8JsonReader`/`Utf8JsonWriter` or streaming APIs for large payloads to avoid unnecessary full-string allocations.

Deserialization does not guarantee domain validity; validate required data and size limits. Avoid permissive polymorphic deserialization of arbitrary type names. Source generation can reduce reflection and support trimming/AOT; test the actual published configuration. Error messages may contain input details, so avoid logging raw sensitive payloads.

## Configuration, contracts, and validation
`System.Text.Json` provides JSON serialization/deserialization with options controlling naming, converters, null handling, enums, polymorphism, and reference behavior. Establish shared `JsonSerializerOptions` or generated contexts rather than creating inconsistent settings at many call sites. Serializer behavior is part of the wire contract; changing naming policies or ignoring defaults can break consumers.

Use DTOs to decouple JSON shape from domain entities. Deserialization success only means the JSON could be mapped; validate required values, ranges, and cross-field rules afterward. Unknown-member handling should reflect compatibility needs: tolerate additive fields for forward compatibility or reject them when strict validation is essential. Avoid unrestricted polymorphic type resolution from untrusted input.

For high-throughput or trimmed/AOT applications, source-generated `JsonSerializerContext` can improve metadata availability and reduce reflection dependence. Test the actual published configuration, including converters and polymorphism. `JsonDocument` and `JsonElement` are useful for dynamic shapes but have lifetime and ownership considerations; clone data needed beyond the document lifetime. Stream large payloads to control memory.

Interview focus: JSON serialization is not a persistence/versioning strategy by itself. Explain explicit contracts, security validation, options consistency, and when source generation is appropriate.
## Related Topics

- [serialization.md](serialization.md)
- [records.md](records.md)
- [attributes.md](attributes.md)
- [source-generators.md](source-generators.md)