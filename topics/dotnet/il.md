## Intermediate Language (IL)

IL, formally Common Intermediate Language (CIL), is the instruction set stored in ordinary managed assemblies. A language compiler translates source-level constructs into IL plus metadata; the runtime then executes it through JIT compilation or a suitable precompiled form. IL is not machine code, and it is not necessarily a permanent or verbatim representation of source intent.

```text
C# / F# / VB
    │ language compiler
    ▼
IL instructions + metadata in PE/CLI assembly
    │ runtime/JIT (or ahead-of-time compiler)
    ▼
target machine instructions
```

An IL method body contains instructions such as argument/local loads, calls, branches, and arithmetic. Locals and evaluation-stack types are tracked so the runtime can verify many type-safety properties. The CIL model is stack-based, while JIT backends commonly lower it into an intermediate representation and machine registers. Generic methods and types may retain shared IL and be specialized or shared according to runtime policy.

### Inspection and practical implications

Build a small sample and inspect the assembly with an IL disassembler such as ILDasm or a current third-party IL viewer. `dotnet build -c Release` creates outputs under `bin`; `dotnet publish` may transform or bundle them, so inspect the build output when learning compiler output. Source-level constructs can lower in surprising ways: async methods typically become state machines, iterators produce state machines, and lambdas may become methods/delegate constructions. Exact lowering is compiler-version dependent.

IL enables language interoperability and runtime optimization, but it does not guarantee portability by itself. A program may depend on platform-specific APIs, native libraries, architecture-specific behavior, or unsupported runtime features. Native AOT also begins from managed IL/metadata but compiles the reachable program into native code at publish time, subject to AOT restrictions.

IL can be modified or emitted dynamically in some environments, but runtime code generation is not universally available. Native AOT disallows general dynamic code generation; trimming may remove members used only through reflection unless they are correctly annotated or preserved. Treat IL inspection as a diagnostic technique, not an API contract.

### Guarantees vs implementation details

The CLI/CIL specification defines instruction semantics and metadata contracts. The exact IL emitted for a C# expression, optimization passes, machine-code shape, and whether a method is inlined are not language guarantees. Never depend on observed instruction sequences for correctness; use documented APIs and measure performance on the deployed runtime.

### Why IL matters in production

IL is valuable for diagnosis, not for assuming that source maps one-to-one to executed instructions. Compiler transformations generate state machines for `async` and iterators, closures for captured locals, and helper types for many language features. The JIT may inline, eliminate, or rearrange operations while preserving observable semantics. Inspect IL when clarifying overload resolution, boxing, generated state machines, or an unexpected dependency; use a profiler and native-code view when investigating runtime cost.

Invalid IL is not a normal application-extension mechanism. Verification and runtime behavior depend on the execution environment, and unsafe/native interop can bypass managed guarantees. A library should expose documented APIs rather than require consumers to depend on compiler-generated IL structure.

## Related Topics

- [Metadata](metadata.md)
- [Assemblies](assemblies.md)
- [JIT compiler](jit-compiler.md)
- [Native AOT](native-aot.md)
- [C# async/await](../csharp/async-await.md)
