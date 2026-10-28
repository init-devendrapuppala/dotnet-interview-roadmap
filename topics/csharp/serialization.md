# Serialization

Serialization converts data into a representation for storage or transport; deserialization reconstructs data. The format and serializer define compatibility, type handling, encoding, and failure behavior.

```csharp
byte[] payload = JsonSerializer.SerializeToUtf8Bytes(
    new StatusMessage("ready"));
StatusMessage? restored =
    JsonSerializer.Deserialize<StatusMessage>(payload);
```

Treat serialized input as untrusted. Validate required fields, limits, and domain invariants after decoding; syntactically valid data is not necessarily valid business data. Avoid unsafe polymorphic type activation and restrict allowed derived types. Be explicit about versioning, naming, null/default behavior, and whether unknown fields are ignored or rejected.

Serialization shape is a public contract: renaming members, changing enum values, or changing nullability can break consumers. Prefer stable DTOs over serializing internal domain objects. Source-generated serializers can improve startup and trimming/AOT compatibility; reflection-based behavior may need metadata preservation.

## Contract, compatibility, and trust
Serialization converts data between an object model and a representation such as JSON, XML, or binary. Decide whether the contract is an internal persistence format, public API, or message schema; each has different compatibility requirements. Renaming a property, changing enum encoding, or changing null/default handling can break consumers even if the C# type still compiles. Use explicit DTOs rather than serializing internal domain objects whose shape changes with implementation.

Deserialization consumes untrusted data. Validate ranges, required relationships, and authorization-relevant values after parsing; a successful parse is not proof of valid business input. Avoid unsafe legacy serializers that instantiate arbitrary types from input. Limit payload size/depth and handle malformed or unknown fields according to the contract. Do not log sensitive serialized content indiscriminately.

Version schemas deliberately, define how unknown fields and enum values behave, and test compatibility with representative old/new payloads. Serializer settings can alter casing, null omission, polymorphism, reference handling, and date formats; make these explicit. Streaming can reduce peak memory for large payloads, while buffering simplifies processing but retains the full document.

Interview answer: distinguish serialization format from domain validation and persistence. Explain backward compatibility and untrusted input. Never assume a serialized CLR object is a stable wire contract unless it was designed and tested as one.
## Related Topics

- [system-text-json.md](system-text-json.md)
- [records.md](records.md)
- [attributes.md](attributes.md)
- [reflection.md](reflection.md)