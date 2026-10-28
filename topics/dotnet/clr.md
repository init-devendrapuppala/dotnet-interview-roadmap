## Common Language Runtime (CLR)

The CLR is the managed execution environment used by .NET. It supplies services such as type loading, method execution, garbage collection, exception handling, threading integration, and interoperation. It is not the C# compiler, and “managed” does not mean that every resource or operation is automatically safe: native handles, pinned memory, unsafe code, and external resources still need deliberate ownership.

```text
app host
  └─ selects/starts runtime
       ├─ loads assemblies and resolves types
       ├─ JIT or precompiled native code executes methods
       ├─ GC tracks managed object references
       └─ exceptions, threads, interop, base libraries
```

### Startup and execution

The app host reads deployment configuration and locates the requested runtime for framework-dependent apps, or starts the bundled runtime for self-contained apps. The runtime initializes, loads the entry assembly, and resolves dependencies as types/methods are needed. A method may be compiled by the JIT on first use; subsequent calls can use generated native code. Modern runtimes may use tiered compilation: quick initial code can later be replaced with more optimized code informed by execution. Some methods may use ReadyToRun code, while Native AOT apps use ahead-of-time compiled code and do not start a conventional JIT compiler.

The CLR provides managed exceptions, but an exception crossing a native boundary, a process-level crash, or stack exhaustion has additional constraints. The GC reclaims unreachable managed objects; it does not promptly reclaim every object, guarantee finalizer timing, or close arbitrary operating-system resources at a predictable instant. Implement `IDisposable`/`IAsyncDisposable` and deterministic ownership for such resources.

### Memory management: the interview-relevant model

Managed allocation creates objects in a GC-managed heap; references make an object reachable from roots such as stacks, static fields, handles, and runtime-owned references. During a collection, the GC identifies reachable objects and reclaims unreachable ones. The generational design targets the observed pattern that many allocated objects become unreachable quickly: new allocations begin in generation 0, survivors can be promoted, and generation 2 collection is more disruptive because it examines longer-lived state. These are performance mechanisms, not a resource-lifetime API.

Large allocations, pinned buffers, high allocation rates, finalizable objects, and long-lived object graphs need measurement because they change collection cost and memory pressure. `GC.Collect()` does not fix a leak or create deterministic cleanup; it requests a collection and can move work onto a request path. When a service has allocation or pause problems, capture allocation, GC, CPU, and request traces first. Then reduce unnecessary allocation, bound retained data, pool only when profiling demonstrates benefit, and fix ownership that keeps objects reachable.

```text
request creates DTOs / buffers
           ↓
reachable references remain → object stays live
           ↓
reference removed → a later collection can reclaim memory
           ↓
Dispose/DisposeAsync closes external resource immediately by contract
```

### Type safety, exceptions, and interop

The runtime enforces managed type and memory-safety rules for supported managed code, but unsafe code, native interop, corrupted process state, and operating-system resources have additional failure modes. P/Invoke marshaling and native library loading are explicit ABI boundaries: architecture, calling convention, ownership, encoding, and error reporting must match the native contract. Do not treat a managed wrapper as proof that a native handle is safe to share or dispose concurrently.

Exception handling unwinds managed frames until a matching handler executes. `finally` is the mechanism for deterministic cleanup during normal managed unwinding; it is not a guarantee that cleanup runs after process termination or power loss. A database or remote operation may have completed before an exception or timeout reaches the caller, so retry policy belongs to an idempotency and reconciliation design, not an exception catch block alone.

### Managed execution, memory, and failure boundaries

The runtime owns managed memory, but it does not make every allocation cheap or harmless. Generational collection makes short-lived allocations efficient in common cases; long-lived objects, large allocations, pinning, finalization, and allocation rate can still affect latency and throughput. Treat a GC pause or high allocation rate as a measured performance concern, not something solved by calling `GC.Collect`.

The runtime also supplies the managed thread pool and async I/O integration used by much of the base library. `async` releases a waiting thread; it does not create a new thread or make CPU-bound work free. Blocking on asynchronous work can reduce available worker threads and create starvation under load. Thread scheduling and pool heuristics are implementation details, so diagnose with traces/counters rather than hard-coding assumptions about thread counts.

At a process boundary, a managed exception is an error signal, not a transaction rollback across external effects. A database commit, file write, or remote request may have completed before a later exception is observed. Define idempotency and recovery around those effects. Use `finally`/`await using` for deterministic cleanup, and reserve finalizers for narrowly necessary unmanaged-resource safety nets.

### Isolation and operations

Modern .NET uses `AssemblyLoadContext` for assembly loading and isolation scenarios. It is not equivalent to a security sandbox or process boundary. If code is untrusted, use an operating-system/container/process security boundary. Multiple runtime versions can be installed side by side, but the selected runtime depends on app configuration, available frameworks, and roll-forward policy.

Inspect the environment with `dotnet --info`, `dotnet --list-runtimes`, and (for a deployed app) its `.runtimeconfig.json`. A host’s installed SDK is not necessarily the runtime used by an app. Set runtime patching and container-image update practices intentionally; framework-dependent applications can pick up an installed servicing runtime, while self-contained apps generally need a rebuilt and redeployed artifact to receive runtime updates.

### Guarantees vs implementation details

Public APIs, documented runtime configuration, and CLI/runtime specifications define supported behavior. Internal GC algorithms, exact JIT policy, thread scheduling, object layout, and loader caches are implementation details and can change. Diagnose with supported counters, traces, and dumps rather than inferring correctness from internal behavior.

### Interview misconceptions

- **"The CLR is the .NET SDK."** The SDK builds; the runtime executes a deployed application.
- **"GC means no resource cleanup is needed."** GC only manages managed memory reachability. Dispose sockets, streams, database contexts, and native handles deterministically.
- **"A managed exception means nothing changed."** External or partially completed effects require explicit recovery design.
- **"The CLR is only a garbage collector."** It also supplies loading, execution, type-system, exception, interop, and runtime diagnostic services.
- **"Objects are freed when a method returns."** Reachability, not lexical scope, determines managed-memory reclamation.

## Related Topics

- [JIT compiler](jit-compiler.md)
- [Runtime loading](runtime-loading.md)
- [Assemblies](assemblies.md)
- [Garbage collection](../csharp/garbage-collection.md)
- [Native AOT](native-aot.md)
