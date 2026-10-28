## Publish: preparing an application for deployment

`dotnet publish` runs the SDK publish targets to produce an application and the selected runtime dependencies in a publish directory. It is the deployment-oriented step; `dotnet build` output is not necessarily complete or configured for production. Publish evaluates target framework, configuration, RID, self-contained choice, trimming, single-file, and AOT settings.

```text
project + restored dependencies
             │
       dotnet publish
             ├─ compile / select assets
             ├─ resolve app + runtime dependencies
             ├─ optional trim / bundle / precompile
             └─ publish directory → package/image → deploy
```

Common patterns:

```powershell
dotnet publish -c Release
dotnet publish -c Release -r linux-x64 --self-contained false
dotnet publish -c Release -r win-x64 --self-contained true
```

Framework-dependent output relies on an installed compatible shared runtime and usually has smaller artifacts; the host’s runtime servicing policy becomes part of operations. Self-contained output includes a runtime for a specific RID and architecture, so it is larger and should be rebuilt/redeployed to take runtime fixes. `PublishSingleFile` changes packaging but does not guarantee that all native files remain inside one file in every mode. ReadyToRun can reduce JIT work; Native AOT compiles native code ahead of execution and imposes compatibility constraints.

Trimming removes code judged unreachable. Reflection, serializers, plugin loading, and other dynamic patterns may hide dependencies from static analysis. Treat trim/AOT warnings as actionable; test the final artifact’s startup and key paths. Build and publish for the actual target OS/architecture and include required native libraries, certificates, time-zone/globalization data, configuration, and secrets management.

### Release and operations

Publish into a clean directory, then test that exact output in an environment representative of production. Record SDK, TFM, RID, runtime/deployment mode, and artifact hash. Avoid deploying `bin` by accident or depending on files present only on a developer machine. In containers, choose a compatible base image and patch/update policy; a self-contained app still depends on OS libraries.

### Release checklist

Check the publish directory for application configuration, static content, native assets, and the expected executable/host before packaging it. Then run a smoke test that exercises startup, a representative dependency path, and graceful shutdown. Health endpoints should distinguish a process that started from one that is ready to accept traffic; avoid exposing secrets in startup diagnostics.

Deployment settings can change the artifact's behavior: a framework-dependent image needs a compatible runtime image; a self-contained image still needs compatible OS libraries; a trimmed or single-file artifact needs functional validation. Promote the tested artifact through environments rather than rerunning an unpinned publish at each stage.

### Guarantees vs implementation details

Documented CLI options and publish properties define intent, while precise output shape and optimization behavior can vary by SDK/runtime. Always validate behavior and contents rather than assuming a flag creates one exact file layout.

## Related Topics

- [Build process](build-process.md)
- [Native AOT](native-aot.md)
- [Runtime loading](runtime-loading.md)
- [Assemblies](assemblies.md)
- [Amazon ECS](../aws/ecs.md)
