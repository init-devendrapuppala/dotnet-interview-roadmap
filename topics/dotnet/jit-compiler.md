## Just-in-time compilation

The JIT converts managed method IL into native instructions for the current process architecture. Compilation is typically triggered when a method is first needed, not when the source is built. This allows runtime-specific code generation and avoids compiling every method, but introduces possible first-use latency and makes startup/performance dependent on runtime policy and workload.

```text
call to uncompiled method
        │
 type/method resolution
        ▼
 JIT compiles IL → native code
        │
        ├─ executes now
        └─ later calls reuse code
```

The JIT can use runtime type information, CPU capabilities, and observed call patterns. Tiered compilation can favor fast compilation initially and optimize hot methods later; dynamic profile-guided optimization (PGO) may specialize code using runtime observations. Inlining and devirtualization can remove call/interface overhead when the runtime can prove an optimization safe. These are optimizations, not semantic guarantees. Code can be recompiled or replaced, and measurements from a cold run can differ greatly from a warmed-up steady state.

### Compilation tradeoffs and deployment modes

JIT compilation trades installation-time specialization for runtime work. It can target the actual process architecture and CPU features, and it can optimize based on execution profiles, but those benefits must be balanced against cold-start latency and memory used for generated code. Server workloads often care about warm steady state; command-line tools and serverless-style workloads may care much more about startup.

ReadyToRun is ahead-of-time code embedded in an otherwise managed deployment; it can reduce initial JIT work, while the runtime can still compile code when appropriate. Native AOT moves more decisions to publish time and constrains dynamic behavior. Neither option is a substitute for measuring application-level latency, memory, and image size on the target environment.

### Performance and diagnosis

Measure Release builds using representative inputs, realistic concurrency, and the same runtime, architecture, and deployment mode as production. Separate cold-start from steady-state measurements; avoid accidentally including compilation only in one compared run. For services, collect startup latency, throughput, allocation/GC, and CPU profiles. Use runtime tracing and supported diagnostics tools rather than relying on undocumented environment switches.

JIT can generate code specialized to a specific runtime/CPU, but may be unavailable or restricted in AOT environments. ReadyToRun can provide precompiled code to reduce startup JIT work, with the runtime able to JIT methods as appropriate. Native AOT shifts compilation to publish time and removes the ordinary JIT dependency, trading flexibility and some runtime capabilities for native deployment characteristics.

### Guarantees vs implementation details

The observable behavior of a program follows language and API contracts; a JIT must preserve that behavior. Compilation timing, code layout, optimization thresholds, tier count, inlining decisions, and PGO strategy are implementation details that change between versions and environments. Do not write correctness logic that depends on a JIT optimization or the timing of compilation.

### Interview misconception

"JIT makes .NET slow on every request" confuses first-use compilation with steady-state execution. Explain that tiering, workload warm-up, deployment mode, and the dominant database/network cost determine the observed result. Never depend on a method being inlined or compiled at a particular time for correctness.

## Related Topics

- [CLR](clr.md)
- [IL](il.md)
- [Publish process](publish-process.md)
- [Native AOT](native-aot.md)
- [Garbage collection](../csharp/garbage-collection.md)
