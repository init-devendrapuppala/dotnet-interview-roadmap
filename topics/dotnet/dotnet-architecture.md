## The .NET platform

“.NET” is a platform, not just the C# language or the CLR. It includes language compilers, a runtime, base libraries, SDK/build tools, package ecosystem, and application frameworks. C# source is only one possible input: F#, Visual Basic, and other CLI-compatible languages can target the same runtime and type system.

```text
source + project + dependencies
              │
        .NET SDK / MSBuild
              │
      compiler → IL + metadata
              │
   publish: app + runtime choice
              │
      host → CLR → execution
```

### Execution model

The compiler emits assemblies containing Common Intermediate Language (CIL/IL), metadata, and optionally resources. At startup, the native host resolves the application and runtime configuration, initializes a runtime, and loads the entry assembly. The CLR resolves types and methods; the JIT compiles methods to machine code as needed, or a precompiled format such as ReadyToRun or Native AOT changes when/how native code is produced. Libraries still provide the common APIs regardless of source language.

This separation matters operationally: a build can succeed while deployment fails because a runtime, native dependency, architecture, configuration value, or package asset is missing. Build, test, publish, and run are distinct stages; validate the published output rather than assuming `dotnet run` models production.

### Deployment choices

Framework-dependent deployment ships the app and expects a compatible shared runtime on the host. It is smaller and benefits from centrally serviced runtimes, but runtime availability/version selection is an operational dependency. Self-contained deployment includes the runtime for a target RID (`dotnet publish -r linux-x64 --self-contained true`); it increases artifact size and requires republishing to pick up runtime fixes. Single-file is a packaging option, not a guarantee of one physical file at execution: native libraries or extracted components may remain. Native AOT compiles ahead of time and has different reflection/dynamic-code constraints.

Containers do not erase these choices: image base, architecture, runtime patching, certificates, globalization data, and native OS libraries remain part of the production contract.

### Guarantees vs implementation details

The CLI type system, IL/metadata format, public API contracts, and specified language/runtime behavior are the stable contracts. JIT heuristics, tiering thresholds, loader data structures, GC implementation details, and exact startup sequence are implementation/version dependent. Do not rely on an observed optimization or undocumented ordering as a correctness guarantee.

For diagnosis, record the SDK and runtime (`dotnet --info`), target framework and RID, deployment mode, and actual artifact. Benchmark Release builds on the target architecture; Debug timings and development-host behavior are poor proxies.

### What an experienced engineer should separate

An interview answer is stronger when it separates the compile-time contract, deployment contract, and runtime behavior. A TFM determines which reference APIs compilation can use; it does not select an OS, package asset, or installed runtime by itself. A RID helps select runtime-specific assets and publish outputs; it is not a security or compatibility guarantee. The host then selects/starts a compatible runtime according to the deployed configuration.

This distinction matters when debugging an apparently contradictory failure: code can compile for `net8.0`, publish for `linux-x64`, and still fail because a native library is missing, the container image lacks required globalization data, or a dynamically accessed member was removed by trimming. Establish the exact SDK, TFM, RID, publish mode, and runtime first; only then reason about source code.

## Related Topics

- [CLR](clr.md)
- [Build process](build-process.md)
- [Publish process](publish-process.md)
- [Native AOT](native-aot.md)
- [ASP.NET Core request pipeline](../aspnet-core/request-pipeline.md)
