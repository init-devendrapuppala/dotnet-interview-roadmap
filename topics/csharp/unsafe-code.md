# Unsafe Code

Unsafe C# permits pointer operations and other low-level memory access inside an `unsafe` context. It can be necessary for interop, specialized data layouts, or measured hot paths, but bypasses many runtime safety checks.

```csharp
unsafe static int ReadFirst(int* values) => values[0];
```

Pointer arithmetic, pinning, and lifetime errors can cause memory corruption or process crashes. Managed objects may move during garbage collection; pinning prevents movement for a period but can fragment the heap if held too long. Use `fixed` to pin only for a bounded operation, and verify lengths, alignment, and ownership at the boundary.

Prefer safe abstractions (`Span<T>`, `Memory<T>`, `MemoryMarshal` where appropriate, and interop marshalling) unless profiling or platform constraints justify unsafe code. Unsafe code still runs under the CLR; it is not equivalent to native code without runtime constraints. Review carefully and test across target architectures/runtimes.

## Safety boundaries and verification
`unsafe` enables pointer operations and fixed-address access that bypass some managed safety guarantees. It is used for interop, specialized low-level algorithms, and APIs requiring precise memory access—not as a general performance switch. Keep unsafe regions minimal, isolate pointer arithmetic, and document the ownership and lifetime assumptions that make each access valid.

The `fixed` statement pins a managed object for a limited scope so a pointer remains stable while native code uses it. Pinning objects too long can interfere with GC compaction and harm performance. Native pointers can be null, invalid, or outlive the buffer; validate lengths, ownership, and lifetime at the boundary. `stackalloc` should use a small bounded size and never trust unbounded input to fit the stack.

Unsafe code can corrupt memory or cause process crashes instead of managed exceptions. Prefer `Span<T>`, `Memory<T>`, `SafeHandle`, and established interop APIs where they satisfy the need. Benchmark first: JIT/runtime optimizations can make unsafe code slower or no faster, while the review burden is higher. Test boundary sizes, alignment assumptions, and release builds on supported architectures.

Interview misconception: unsafe does not disable the garbage collector or guarantee speed. It opts into pointer capabilities and requires the developer to prove safety invariants the compiler can no longer enforce.
## Related Topics

- [span-and-memory.md](span-and-memory.md)
- [memorypool.md](memorypool.md)
- [reflection.md](reflection.md)
- [garbage-collection.md](garbage-collection.md)