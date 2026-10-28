## NuGet and dependency restore

NuGet is .NET’s package manager and dependency resolver. A package usually contains a `.nuspec` manifest plus assets such as assemblies, analyzers, build props/targets, native libraries, or framework-specific files. A `PackageReference` expresses a dependency in the project; `dotnet restore` resolves the graph for the project’s target frameworks and writes resolved assets to `obj/project.assets.json`. The build consumes that graph.

```text
PackageReference + sources + TFM/RID
                 │
              restore
                 ▼
      dependency graph / assets file
                 │
      compile references + build assets
                 │
          publish-selected assets
```

Version ranges and transitive dependencies affect the final graph. Lock files can make resolution reproducible when enabled and committed; package source mapping and trusted feeds help control where packages come from. A package version, assembly version, and file version are different concepts. `dotnet list package --include-transitive` helps inspect direct and transitive dependencies; `dotnet restore` resolves but does not guarantee every runtime/native asset is deployable on the target.

### Build and supply-chain considerations

Restore may execute package-provided MSBuild targets or analyzers during the build, so packages are code and build inputs—not inert data. Use known feeds, review dependency changes, minimize unnecessary packages, and apply organizational vulnerability checks. Keep credentials out of project files and logs; configure private feeds using approved credential providers or CI secrets.

A package can provide assets under framework-specific folders, runtime-specific folders, or build folders. NuGet selects compatible assets based on TFM/RID and package conventions; wrong asset selection can cause compile or runtime failures. Restore for all required target frameworks and publish for each deployment target in CI. `--no-restore` is safe only when a matching restore has already completed.

### Conflict resolution and operational discipline

The resolved graph, rather than the package references visible in one project, determines what the application runs. Direct dependencies can constrain transitive versions; a package downgrade warning or an unexpected transitive update should be understood, not suppressed. Central version management can reduce drift, but it makes a version change broader and therefore requires application-level validation.

For a reproducible restore, make sources, credentials, lock-file policy, SDK, and package mapping explicit in CI. Clearing caches may help diagnose corrupt local state, but it must not be a normal release mechanism. After an incident, record the resolved version, package source, affected TFM/RID, and the published asset that loaded.

### Guarantees vs implementation details

NuGet’s documented package layout, restore behavior, and version resolution rules are the supported contract. Exact package cache paths, internal resolver implementation, and unspecified feed ordering are not application contracts. Do not edit the global package cache to repair a dependency; restore from declared sources and lock down the intended graph.

## Related Topics

- [Build process](build-process.md)
- [Project SDK](project-sdk.md)
- [Assemblies](assemblies.md)
- [Publish process](publish-process.md)
- [Configuration](configuration.md)
