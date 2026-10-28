# MemoryPool<T>

`MemoryPool<T>` provides reusable memory buffers, typically through `IMemoryOwner<T>`. It can reduce repeated large-buffer allocations in high-throughput I/O, but introduces explicit ownership and lifetime rules.

```csharp
using IMemoryOwner<byte> owner = MemoryPool<byte>.Shared.Rent(4096);
Memory<byte> buffer = owner.Memory;
int bytesUsed = await stream.ReadAsync(buffer, cancellationToken);
Process(buffer.Span[..bytesUsed]);
```

The owner must remain alive while the buffer is in use and must be disposed/returned only after every consumer is finished. A rented buffer can be larger than requested and may contain old data; use only the valid slice and clear sensitive contents when required. Never retain a `Memory<T>` view after returning its owner to the pool.

Pooling reduces allocation pressure only when reuse offsets coordination, clearing, and retention costs. Long-held rented buffers can worsen memory usage, and pooled contents can create data-isolation risks. Prefer simple allocations unless profiling identifies a meaningful buffer-allocation bottleneck.

## Buffer ownership and safe use
`MemoryPool<T>` rents `IMemoryOwner<T>` instances that expose a `Memory<T>` view. Dispose the owner when done to return its buffer to the pool. The owner defines lifetime; a `Memory<T>` slice does not independently keep the rented buffer valid after the owner has been disposed. Do not return or reuse a buffer while an asynchronous operation or consumer may still access it.

Pools can reduce repeated large-buffer allocation and garbage-collection pressure in high-throughput I/O, but introduce ownership complexity and can retain memory for reuse. Pooling small or infrequent buffers may be slower and increase retained working set. Clear sensitive data before release when the pool/API does not guarantee clearing and confidentiality requires it. Never assume a rented buffer is zero-initialized unless the relevant API guarantees that property.

`Memory<T>` can be stored in fields and cross `await`; `Span<T>` is a stack-only `ref struct` and cannot ordinarily be retained across an async suspension. Use the appropriate view for the lifetime needed. Keep slices bounded to the valid region—the rented array may be larger than the requested length. Document whether an API borrows a buffer, takes ownership, or copies it.

For interviews, connect pooling to allocation reduction and explicit ownership. A pool does not make memory free, guarantee a particular buffer size, or permit use-after-return. Prefer standard `ArrayPool<T>`/`MemoryPool<T>` contracts over custom pools unless measured needs justify implementing lifetime-sensitive code.
A safe ownership pattern is to acquire the owner in a `using` scope, pass only the valid slice to an operation, await all consumers, and then dispose. Do not return a `Memory<T>` view from a method after disposing its owner. If an API accepts caller-provided memory, specify whether it copies synchronously or retains it; callers need that fact to manage buffer lifetime. When using `ArrayPool<T>`, return the exact rented array to the same pool and avoid using it afterward.
A pool is not a cache contract for application data. Renting a buffer does not guarantee reuse of the same array, a minimum capacity, zero contents, or exclusive access after return. APIs often expose only a slice of the available buffer; restrict reads and writes to the requested/valid length. Return buffers in `finally`/`using` so exceptions and cancellation do not leak rented capacity. Pooling can trade allocation churn for retained memory, contention, and more complicated cleanup; benchmark end-to-end throughput and resident memory under realistic concurrency. If correctness depends on clearing, perform the clear explicitly or select a documented option that guarantees it.
A pool is not a cache contract for application data. Renting a buffer does not promise reuse of the same array, a minimum capacity, zero contents, or exclusive access after return. APIs often expose a view larger than the requested length; restrict operations to the valid slice. Return the owner in a `using` scope or `finally` so exceptions and cancellation do not leak rented capacity. If confidentiality requires erasure, clear the relevant region before returning it unless the chosen API contract guarantees clearing. Benchmark end-to-end throughput and resident memory under realistic concurrency: pooling may reduce allocations while increasing retained working set or contention.
Coordinate pool ownership with API cancellation carefully: if a method returns a rented buffer to its caller, the caller—not the callee—must own and dispose the returned owner. If work is canceled midway, dispose locally owned buffers in `finally` and never return one while an outstanding write/read may still use it. These explicit ownership rules prevent use-after-return corruption that may appear only under load.
## Related Topics

- [span-and-memory.md](span-and-memory.md)
- [disposable-and-using.md](disposable-and-using.md)
- [streams.md](streams.md)
- [garbage-collection.md](garbage-collection.md)