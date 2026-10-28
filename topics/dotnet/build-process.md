## The .NET build process

`dotnet build` asks the selected .NET SDK to evaluate an MSBuild project and execute the targets needed to produce build outputs. “Build” therefore means more than invoking the C# compiler: it includes project evaluation, dependency-graph preparation, source/resource generation, analyzers, compilation, and output copying. The result is intended for development, testing, or a later publish step; it is not automatically a complete deployment bundle.

```text
global.json / installed SDK
          │
MSBuild evaluation: imports, properties, items, conditions
          │
restore (if needed) → obj/project.assets.json
          │
build targets → generators/resources/analyzers → compiler
          │
intermediate and final outputs (usually obj/ and bin/)
          │
test / publish / package / deploy are separate decisions
```

### SDK, MSBuild, and compiler responsibilities

The `dotnet` command is the CLI front end. It selects an SDK, and the SDK supplies MSBuild, targets/tasks, compiler tooling, and conventions. MSBuild evaluates project files and imported `.props`/`.targets`, then executes a target graph. The C# compiler (Roslyn) consumes source files, references, compiler options, analyzers, and generated source; it emits a managed assembly with IL and metadata, usually accompanied by symbols. The compiler does not independently decide the whole application deployment. Targets handle project references, resource compilation, generated assembly attributes, analyzers/source generators, and output staging around that compilation.

A project SDK such as `Microsoft.NET.Sdk.Web` contributes defaults and targets. `TargetFramework` selects a compile-time API surface; `TargetFrameworks` causes builds for multiple frameworks. A Runtime Identifier (RID) such as `linux-x64` selects platform-specific assets and is not another target framework. `Debug` and `Release` are configurations whose actual properties depend on project settings; the labels alone do not guarantee a specific optimization or debugging policy.

### Restore and compilation are related but distinct

NuGet restore resolves direct and transitive dependencies for the declared framework(s), and sometimes RID-specific assets. It writes the resolved graph and assets to `obj/project.assets.json`. The build consumes that graph to select references and other package assets. `dotnet build` normally restores when required; `dotnet build --no-restore` deliberately skips that step and is appropriate when CI has already restored the same project inputs. It is not a general “faster build” switch if the assets file is stale or absent.

Generated files in `obj` are intermediate products, not source-of-truth. `bin` contains outputs arranged by configuration and framework (and sometimes RID), but exact layouts can vary with SDK and project settings. Removing `bin` and `obj` can eliminate stale intermediate state, yet repeated cleanup should not replace finding a missing input, incorrect incremental dependency, or machine-specific build step.

### Incrementality, determinism, and multi-targeting

MSBuild uses declared inputs/outputs and target conditions to skip work it judges up to date. Correct incremental behavior depends on custom targets accurately declaring their inputs, outputs, and dependencies. A target that reads an undeclared file may appear to work on a clean build and then remain stale on an incremental build. Generated code should be deterministic where practical and should not rely on local machine paths, current time, or untracked environmental state.

For reproducible CI, align the SDK (a `global.json` can constrain CLI SDK selection), package sources, build properties, and environment. Use package lock files when the repository's restore strategy calls for them. A pinned SDK does not freeze operating-system toolchains, native dependencies, or every external service; record those inputs when they affect artifacts. Upgrading an SDK can change compiler/analyzer behavior, generated code, warnings, and publish targets even if the TFM is unchanged.

For multi-targeting, the project is evaluated and built for each target framework. Conditional properties, package asset selection, generated code, and APIs can differ between targets. RID-specific assets add another dimension. A passing build for one TFM/RID does not establish compatibility for the others, so test the combinations the product actually supports.

### Diagnose the graph rather than guessing

Useful commands for a project are:

```powershell
dotnet --info
dotnet restore
dotnet build -c Release
dotnet build --no-restore -v:minimal
dotnet build -v:diag
```

For difficult MSBuild behavior, create a binary log with supported MSBuild logging options, then inspect evaluated properties, target/task execution, and skipped targets using an appropriate viewer. Diagnostic output can include paths, environment values, package-source information, and sometimes secrets inadvertently passed through properties; protect it like operational data. To investigate a build, first establish the selected SDK, configuration, TFM/RID, and evaluated property value, then find the target that consumes it.

When an output is unexpectedly missing, distinguish evaluation from execution: confirm the item/property exists after evaluation, check whether a condition excluded the target, inspect target inputs/outputs and incremental skips, and verify whether a later target overwrote or removed the output. This is more useful than assuming a source file was not compiled. If a generated file is involved, inspect the generated artifact under `obj` and the target/analyzer that produced it; generated file names and paths are usually not a public interface.

### CI and deployment implications

A successful compile proves that the selected compiler accepted the configured inputs. It does not prove tests pass, the correct package assets were restored, the production runtime exists, native dependencies load, or the published application starts. A robust pipeline makes stages explicit: restore, build, test, publish, then smoke-test the exact publish directory or container that will be deployed. Where possible, promote the tested artifact instead of rebuilding it differently at release time.

For a RID-dependent deployment, publish and exercise that RID's artifact rather than assuming a framework-only build covers it. Avoid deploying a developer's entire `bin` directory or relying on local files absent from the deployment package. A build may pass while a publish step reports trimming/AOT warnings or selects a different set of assets, so validate the output of the final transformation.

### Common interview misconceptions

- **“MSBuild is the C# compiler.”** MSBuild orchestrates; the compiler is one tool invoked by SDK targets.
- **“Restore downloads only direct references.”** It resolves a full graph and selects framework/runtime/build assets.
- **“Build output is deployable.”** It may omit or not configure runtime, native, and publish-time assets.
- **“A clean rebuild is the permanent fix.”** It may hide stale state without correcting undeclared inputs or non-determinism.
- **“`global.json` selects the app's production runtime.”** It controls SDK selection for CLI operations in scope, not the deployed runtime by itself.

### Guarantees versus implementation details

MSBuild evaluation/target semantics, documented SDK properties, compiler options, and CLI command behavior are supported interfaces. The SDK's private target graph, exact generated filenames, output folder details not documented as contracts, and optimization/incremental heuristics can change. Extend builds through documented hooks and validate SDK upgrades in CI instead of depending on incidental target ordering.

## Related Topics

- [Project SDK](project-sdk.md)
- [NuGet](nuget.md)
- [Publish process](publish-process.md)
- [IL](il.md)
- [Configuration](configuration.md)