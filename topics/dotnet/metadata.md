## .NET metadata

Metadata is the structured description carried by CLI assemblies alongside IL. It describes assemblies, modules, types, methods, fields, properties, events, generic parameters, references, and relationships. The runtime and tools use it to resolve types, enforce signatures, load dependencies, support reflection, and connect IL tokens to definitions.

```text
assembly (PE/CLI file)
 ├─ manifest: identity, references, resources
 ├─ metadata tables: types, methods, signatures, ...
 └─ IL method bodies: instructions referencing metadata tokens
```

For example, a method call in IL usually refers to a metadata token describing a method or member reference rather than embedding a raw address. The runtime resolves that reference in the relevant load context. Attributes are represented through metadata and can be consumed by frameworks or reflection. Metadata is not the same as source code: comments and most local naming/source formatting are not required to remain in a normal release assembly, though debug symbols or embedded source can provide additional debugging information.

### Reflection, trimming, and AOT

Reflection reads metadata and can discover or invoke types and members dynamically. This flexibility conflicts with static analysis: a trimmer may not know that a type is used only by a string-based reflection lookup and remove it. Native AOT also needs to determine reachable code and metadata ahead of execution. Prefer statically expressed dependencies, use supported reflection annotations/descriptors where necessary, and test the published trimmed/AOT artifact. A successful ordinary build does not prove that runtime-discovered members survive publishing.

Metadata also underpins dependency and version inspection. Tools such as `dotnet` diagnostics utilities, assembly inspection tools, and reflection-based code can report identity and references; inspect the actual published files when diagnosing load failures, as build output and publish output may differ.

### Tooling and compatibility implications

Metadata is why reflection, serializers, dependency injection containers, test discovery, and many analyzers can discover application structure without source code. That power creates a deployment contract: if a library finds types by scanning assemblies or members by name, it must document and preserve that contract under trimming/AOT. Prefer source generation or explicit registration for high-assurance deployments, and add publish-mode integration tests for dynamic paths.

Changing a public type's namespace, generic arity, member signature, or assembly identity can be a binary compatibility break even if source consumers can be edited to compile again. API compatibility is broader than metadata alone—behavior and serialization matter too—but metadata explains why a previously compiled consumer can fail to bind.

### Guarantees vs implementation details

CLI metadata tables, signatures, and reference semantics are defined by the CLI format. Exact table ordering, compiler-generated names, private implementation records, and which metadata is retained after trimming are not stable application contracts. Do not use generated backing-field names or private metadata structure as a public integration surface.

## Related Topics

- [IL](il.md)
- [Assemblies](assemblies.md)
- [Runtime loading](runtime-loading.md)
- [Native AOT](native-aot.md)
- [Reflection](../csharp/reflection.md)
- [Source generators](../csharp/source-generators.md)
