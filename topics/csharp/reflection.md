# Reflection

Reflection inspects and interacts with runtime metadata: types, members, attributes, assemblies, and generic constructions. It supports serializers, dependency injection, plugin systems, and diagnostics.

```csharp
Type type = typeof(Customer);
foreach (var property in type.GetProperties())
    Console.WriteLine($"{property.Name}: {property.PropertyType}");
```

Reflection can fail at runtime due to missing members, access restrictions, invalid conversions, or trimming. Repeated discovery/invocation can be slower than direct calls; cache metadata or compiled accessors only when measurement justifies it. Reflection over private members couples code to implementation details and can break under refactoring.

Modern deployment matters: trimming and Native AOT may remove metadata or restrict dynamic code generation. Mark requirements with appropriate annotations and verify published artifacts. Prefer interfaces, generics, source generation, or explicit registration for known types. Treat plugin assemblies and reflected input as untrusted; reflection is not a security boundary.

## Discovery, invocation, and trimming
Reflection can inspect metadata at runtime, locate types and members, create instances, or invoke methods. It is useful for serializers, dependency discovery, plugin systems, and diagnostics, but it moves some errors from compile time to runtime and commonly costs more than direct calls. Cache discovered metadata when repeated lookup is measured as significant; avoid building a general reflection framework when explicit registration is simpler.

Reflection invocation is sensitive to overload resolution, accessibility, generic construction, and runtime exceptions (often wrapped in `TargetInvocationException`). Prefer strongly typed delegates or generated code for hot repeated calls. Reflection-based attribute instantiation can execute constructors; use metadata APIs where instantiation is unnecessary.

Trimming and Native AOT can remove metadata/code not statically visible to the linker. Runtime discovery must communicate preservation requirements through supported annotations/descriptors or be replaced with source-generated registration. Test the published trimmed/AOT artifact, not only a development build. Dynamically loading types also raises assembly compatibility and trust concerns; do not treat reflection as a security boundary.

An interview answer should distinguish `Type` metadata inspection from dynamic dispatch, and explain the tradeoff between extensibility and compile-time guarantees. Reflection itself is supported by .NET, but which members remain available after trimming depends on build-time analysis and annotations. Keep reflection at boundaries, validate discovered types, and produce actionable errors when a plugin or configuration is invalid.
## Safer and faster runtime discovery
Reflection is often most expensive when metadata discovery and invocation are repeated in a hot path. Resolve `Type`/`MethodInfo` once and cache an appropriate typed delegate when possible. Cache keys must account for constructed generic types, assembly load contexts, and collectible plugins; a global static cache can prevent an unloadable assembly context from being collected. Prefer bounded, lifecycle-aware caches.

Use explicit allowlists when selecting types or members from configuration. Reflection can bypass ordinary source-level visibility assumptions, but it is not a security sandbox: executing a discovered plugin runs that code with the process's privileges. Validate plugin identity, version, expected interface, and trust at a system boundary. Catch and report activation failures with type/assembly context while preserving inner exceptions.

Reflection is also affected by trimming and AOT. APIs such as `Type.GetType`, member-name strings, and attribute scanning may be invisible to static analysis. Use linker annotations or descriptors as required by the target, and test the published artifact. Source generation or direct factories can provide better startup predictability and compile-time feedback when the set of types is known.

Use reflection when extensibility or metadata-driven behavior warrants its complexity; otherwise explicit code is easier to refactor and diagnose. Interview answer: it trades static guarantees for runtime flexibility, with lookup/invocation cost and deployment metadata constraints. Distinguish metadata inspection from arbitrary code execution and never infer trust from successful type discovery.
Prefer reflection APIs with explicit binding flags and expected signatures; broad searches across inherited/public/non-public members can select unintended overloads. Validate parameter and return types before invocation, and report a clear configuration error rather than allowing a later invalid cast. When invoking a method reflectively, unwrap `TargetInvocationException` only when rethrowing or translating the underlying failure and preserve its stack/context. Caching must not retain disposable plugin load contexts indefinitely.
Use reflection deliberately at the application boundary and convert dynamic metadata into validated typed descriptors as early as possible. Centralize discovery so errors include the expected contract and discovered assembly, rather than scattering string-based lookups through business logic. For plugin systems, define versioning and unloading behavior, since references to types, delegates, or metadata can keep an assembly load context alive. Reflection broadens deployment and lifecycle concerns in addition to runtime cost.
## Related Topics

- [attributes.md](attributes.md)
- [source-generators.md](source-generators.md)
- [dynamic.md](dynamic.md)
- [expression-trees.md](expression-trees.md)