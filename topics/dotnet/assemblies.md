## .NET assemblies

An assembly is the unit the CLI runtime and tooling use to package managed code, metadata, resources, and identity. In ordinary .NET builds it is a PE-format file with a CLI header and may have a `.dll` or `.exe` extension. An assembly can define many types and namespaces; a namespace is a source-level naming convention, not a physical or loading boundary. One project can produce several assemblies, and several projects can contribute types to a single application.

```text
MyApp.dll (PE/CLI image)
├─ manifest: identity, references, files/resources
├─ metadata: type and member definitions/signatures
├─ IL: method bodies (unless absent or replaced)
└─ optional resources and debug-symbol association
```

### Identity, versions, and references

The assembly manifest identifies the assembly and records references to other assemblies. Identity can include a simple name, version, culture, and public-key information. A strong-named assembly carries a cryptographic signature associated with its identity. Strong naming is not a security sandbox, a guarantee that code is trustworthy, or a promise of API compatibility. Modern .NET applications should not assume the .NET Framework's historical machine-wide GAC binding model; deployment and application dependency metadata normally govern which files are available.

Several different version numbers are easy to conflate:

- **Package version** identifies a NuGet package release and participates in restore.
- **Assembly version** is part of assembly identity and can be used in binding/loading decisions.
- **File version** is Windows file metadata, often used by diagnostics and installers.
- **Informational version** is descriptive product/build metadata and may include a commit identifier.

They need not match. Changing a package version does not automatically imply a particular assembly-version policy, and assembly version alone does not establish semantic-version compatibility.

### From build output to a running type

The compiler emits one or more assemblies from source, generated code, references, and resources. A normal app deployment is not necessarily just its entry DLL: the host may also need `.deps.json`, `.runtimeconfig.json`, referenced assemblies, native libraries, configuration, and a compatible runtime. `dotnet publish` selects and stages deployment assets; trimming, bundling, ReadyToRun, and Native AOT can change what files are present or how code is executed.

At runtime, references are resolved in a loading context. In modern .NET, `AssemblyLoadContext` supports custom resolution and plugin scenarios. Type identity is more than namespace plus type name: the defining assembly and loading context matter. Two plugins can load distinct copies of a contract assembly and then fail casts even when their types have identical names. A reliable plugin design shares contract types from a common context and defines explicit dependency-resolution rules. An assembly load context does not isolate malicious code; use process and OS boundaries for security.

Useful inspection and deployment commands include:

```powershell
dotnet build -c Release
dotnet publish -c Release -r win-x64 --self-contained false
dotnet --list-runtimes
```

Inspect the *published* directory when diagnosing a production-only load failure. The build directory may contain files that publishing trims, bundles, or selects differently.

### Boundaries, operations, and interview checks

An assembly is a deployment and metadata unit, but not necessarily a security, process, or independently versioned service boundary. Assemblies loaded in one process share that process's failure and resource boundaries. A library DLL also normally has no standalone app host; it is loaded by a host application.

Ask “what does assembly version control?” A strong answer distinguishes package restore from runtime identity and notes that the exact binding strategy differs between .NET Framework and modern .NET. Ask “does strong naming secure a plugin?” It does not. Ask “why can same-named plugin types fail assignment?” Their defining assembly/load-context identities can differ. These answers show a useful level of understanding for production work.

### Guarantees versus implementation details

The CLI/PE format and documented assembly identity and loading APIs are contracts. Exact compiler-generated names, internal loader caches, binding implementation, file layout, and which methods are precompiled are implementation details. Use documented APIs and inspect actual artifacts rather than relying on a particular tool's internal display or an observed load order.

## Related Topics

- [Metadata](metadata.md)
- [Runtime loading](runtime-loading.md)
- [NuGet](nuget.md)
- [Publish process](publish-process.md)
- [Reflection](../csharp/reflection.md)