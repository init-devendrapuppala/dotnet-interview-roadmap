## Native AOT

Native AOT compiles a managed application to native machine code at publish time. Instead of starting a conventional JIT compiler and compiling methods during execution, the published program contains native code for a target platform/architecture. Publishing is target-specific; a Windows x64 artifact is not a portable Linux artifact.

```text
source → IL + metadata → static analysis/linking → native compiler
                                                   │
                                                   ▼
                                    native executable + required files
```

It can improve startup and reduce runtime requirements, and can simplify deployment where installing a shared .NET runtime is undesirable. It is not automatically smaller or faster: native code can increase artifact size, and performance depends on workload, architecture, and publish options. Measure cold start, steady-state throughput, memory, and image size on the real target.

### Compatibility constraints

AOT requires the compiler to know the reachable code and required metadata. Unbounded reflection, runtime code generation (`Reflection.Emit`), dynamic assembly loading, and patterns that hide type usage can be unsupported or require annotations/descriptors. Trimming is integral to the static reachability problem; review analyzer warnings and explicitly preserve necessary members. Some libraries or native interop patterns may not support AOT.

Use an explicit RID and publish/test the artifact:

```powershell
dotnet publish -c Release -r linux-x64 -p:PublishAot=true
```

Compilation may require platform toolchains and native development dependencies. CI should build for every supported RID, run integration tests against the published executable, and retain linker/AOT warnings. A successful ordinary JIT build is not evidence that AOT publishing or runtime behavior will work.

Native AOT does not mean “no runtime code”: the binary still includes runtime support needed for managed semantics, GC, exceptions, and libraries. It also does not remove OS-level dependencies, configuration, file permissions, certificates, globalization considerations, or native library compatibility. Updates generally require publishing and deploying a new binary.

### Deployment and compatibility boundary

Native AOT is a target-specific publish mode. Test the exact operating system, architecture, native dependencies, globalization settings, and container base image used in production. A publish that succeeds on a developer workstation has not validated a target that uses a different native toolchain or library set.

Reflection and dynamic loading require an explicit contract under AOT. If a serializer, plugin host, or DI convention discovers members dynamically, make the reachable types/members visible to the toolchain through supported annotations, descriptors, or source generation, then test the published executable. Do not preserve arbitrary metadata simply to silence a warning; identify the runtime operation that needs it.

### Adoption and verification

Choose AOT for a measured deployment objective—such as cold start, a constrained environment, or avoiding a separately installed runtime—not as a default performance switch. Inventory dynamic features early: reflection-based serializers, DI scanning, proxy generation, plugin discovery, expression compilation, and native libraries are common sources of publish warnings or behavioral differences.

Keep a CI lane that publishes the exact RID and runs representative startup, serialization, database, and integration paths. Capture AOT/trimming warnings as artifacts and treat newly introduced warnings as changes needing review. Debug the publish directory, not only `bin/Release`: publish transformations can remove metadata or alter loading behavior.

### Guarantees vs implementation details

Supported Native AOT APIs, annotations, and documented constraints are the compatibility contract. Exact linker decisions, generated machine code, file size, startup improvement, and internal runtime implementation can vary by SDK and target. Treat warnings as design feedback and benchmark instead of assuming universal gains.

## Related Topics

- [Publish process](publish-process.md)
- [JIT compiler](jit-compiler.md)
- [Metadata](metadata.md)
- [Runtime loading](runtime-loading.md)
- [Assemblies](assemblies.md)
