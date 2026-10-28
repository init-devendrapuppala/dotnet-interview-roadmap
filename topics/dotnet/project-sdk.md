## Project SDK and project files

A `.csproj` normally begins with an SDK declaration such as `<Project Sdk="Microsoft.NET.Sdk">`. The SDK imports the targets and default conventions needed to build; it is a toolchain choice, not merely a label. `Microsoft.NET.Sdk.Web` adds web-app conventions, while other SDKs can add platform-specific behavior. SDK resolution uses the CLI/tool installation and can be constrained by `global.json`.

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
</Project>
```

MSBuild evaluates properties (single values), items (collections such as source files and package references), and imported targets. Defaults include source globbing and conventional output paths; explicit includes/excludes or custom targets can alter them. Properties can be set in project files, imported props/targets, command-line global properties, and environment-derived configuration, with precedence rules that matter when diagnosing unexpected builds.

`TargetFramework` selects one framework; `TargetFrameworks` enables multi-targeting. A target framework moniker (TFM) expresses the compile-time API surface. Runtime Identifier (RID), such as `linux-x64`, selects platform-specific assets/output and is not interchangeable with a TFM. Use `dotnet --list-sdks`, `dotnet --info`, `dotnet build -v:diag`, and MSBuild property inspection to understand which SDK and values are active.

### Operational consequences

Adding a package reference, target, generator, or custom import changes the build graph and potentially supply-chain exposure. Prefer explicit, reviewed configuration over machine-specific absolute paths. Central package management and shared `.props` files can standardize versions, but evaluate the effective project properties rather than assuming inheritance. A `global.json` controls SDK selection for CLI operations within its scope; it does not install an SDK and does not specify the runtime version an app uses in production.

Use the SDK version tested by CI and upgrade deliberately. Different SDKs can alter analyzers, compiler defaults, generated code, restore, and publish behavior even when the TFM remains unchanged.

### Evaluation pitfalls

MSBuild is declarative but evaluation is ordered: imports and conditions can make the same property appear to have different values in different projects or target frameworks. Do not infer the effective configuration from one XML fragment. Inspect a preprocessed project or diagnostic build when a property is surprising, especially with `Directory.Build.props`, `Directory.Build.targets`, central package files, or multi-targeting conditions.

Keep custom build logic narrow and declare inputs and outputs. A target that observes an undeclared environment variable or generated file may be correct in a clean build yet stale in an incremental one. This is an interview-relevant production failure mode: it is usually a build-graph defect, not a compiler defect.

### Guarantees vs implementation details

MSBuild evaluation rules, documented SDK properties, TFMs, and RIDs are supported concepts. SDK defaults and target implementation can evolve. Avoid depending on private targets or accidental property precedence; use documented extension points and regression-test custom build targets.

## Related Topics

- [Build process](build-process.md)
- [NuGet](nuget.md)
- [Publish process](publish-process.md)
- [Configuration](configuration.md)
- [Runtime loading](runtime-loading.md)
