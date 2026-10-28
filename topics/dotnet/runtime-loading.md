## Runtime and assembly loading

Loading is more than finding a DLL. The native app host chooses a runtime, the runtime initializes, and the loader resolves assembly references and types in a particular context. Resolution can be affected by the app’s dependency manifest, runtime configuration, probing paths, load context, and explicit load APIs. A file being present on disk does not guarantee it will be selected or that its dependencies can load.

```text
apphost
  └─ runtimeconfig → select compatible runtime
       └─ deps manifest / load context → locate assembly
            └─ metadata + dependencies → resolve type/method
                 └─ JIT/precompiled code → execute
```

### Runtime selection

Framework-dependent apps require an installed shared framework. The host resolves the requested framework using the app’s runtime configuration and installed runtimes, following configured roll-forward rules. Self-contained apps carry a runtime for a target runtime identifier (RID); the app host launches that copy. Check `dotnet --list-runtimes`, `dotnet --info`, the published `.runtimeconfig.json`, and the actual host executable when investigating “works on my machine” failures. SDK selection (`global.json`) governs CLI tooling, not the runtime automatically chosen by every deployed app.

### AssemblyLoadContext

Modern .NET provides `AssemblyLoadContext` (ALC) as a loading and isolation mechanism, commonly used for plugin systems and unloading. The default context loads the app’s normal dependency graph. A custom context can customize dependency resolution and, when collectible, permit unloading after all references, threads, delegates, and objects from it are gone and collection occurs. Unloading is cooperative/GC-dependent, not an immediate unload call.

Types loaded into different ALCs have distinct runtime identities even if their names match. Share abstractions intentionally (often load the contract assembly in the default context) and define clear plugin dependency policies. ALC is not a security sandbox: use a separate process and OS-level controls for untrusted plugins.

Diagnose resolution with structured logging/loader diagnostics and inspect `*.deps.json`; avoid ad hoc `Assembly.LoadFrom` assumptions. Native dependencies have their own OS loader rules and architecture requirements.

### A disciplined load-failure workflow

First identify whether the failure is runtime selection, managed assembly resolution, native-library resolution, or a missing type/member. Capture the exception's full loader details, the publish manifest, process architecture, and deployment directory. Then reproduce against the published artifact with the same environment variables and working directory. Copying arbitrary DLLs beside an application can hide the real graph problem and create a new type-identity conflict.

Plugin systems deserve explicit contracts: share abstractions from one known context; load implementation dependencies consistently; do not leak plugin types across the boundary; and dispose/unsubscribe all references before requesting collectible-context unload. The design should include a supported upgrade and diagnostics story, not merely a custom load call.

### Guarantees vs implementation details

Runtime configuration, documented ALC behavior, and CLI assembly semantics are supported contracts. Probe order nuances, internal caches, exact error messages, and whether an assembly is eagerly loaded are not stable guarantees. Use documented resolution hooks rather than depending on incidental search order.

## Related Topics

- [CLR](clr.md)
- [Assemblies](assemblies.md)
- [Metadata](metadata.md)
- [Project SDK](project-sdk.md)
- [Native AOT](native-aot.md)
