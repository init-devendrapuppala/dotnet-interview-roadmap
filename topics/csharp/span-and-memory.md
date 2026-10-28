# Span<T> and Memory<T>

`Span<T>` and `ReadOnlySpan<T>` are stack-only, byref-like views over contiguous memory. They can represent slices of arrays, strings, stack-allocated storage, or other valid memory without copying the elements. `Memory<T>` and `ReadOnlyMemory<T>` provide similar views that can be stored in fields and passed across asynchronous boundaries.

```csharp
ReadOnlySpan<char> input = "42,ready";
int comma = input.IndexOf(',');
ReadOnlySpan<char> numberText = input[..comma];
```

A span is a view, not an owner. Assigning or slicing it does not duplicate data, and mutations through another alias can be observed. Bounds checks apply to ordinary span slicing and indexing. A span cannot be boxed, stored in a normal class field, captured by a lambda, or generally cross an `await`/`yield` suspension boundary; its lifetime must not outlive the memory it refers to. `Memory<T>` can cross awaits, but storing the view does not extend ownership of a rented buffer.

## Parsing without intermediate strings

```csharp
static bool TryParsePair(ReadOnlySpan<char> text, out int left, out int right)
{
    left = 0;
    right = 0;
    int separator = text.IndexOf(':');
    return separator >= 0
        && int.TryParse(text[..separator], out left)
        && int.TryParse(text[(separator + 1)..], out right);
}
```

This parses using the framework's default integer parsing rules; protocol formats should choose culture and `NumberStyles` explicitly. The initial assignments ensure every return path assigns both `out` parameters. Slicing avoids substring allocation, but parsing still performs validation, and creating a retained string still allocates.

## Lifetimes and asynchronous APIs

Use `Span<T>` within synchronous operations where its short lifetime is clear. Use `Memory<T>` when an operation must retain a view across an await, and define whether the API borrows, copies, or takes ownership of the underlying storage. A memory view can still point at an array whose owner mutates or returns it to a pool. Do not return or reuse pooled storage while a consumer can access it.

`stackalloc` can efficiently provide small temporary buffers, but keep the size bounded and avoid input-controlled stack allocations that can exhaust the stack. For larger reusable buffers, pooling may lower allocation pressure, at the cost of explicit ownership, clearing, and return obligations. `ArrayPool<T>` and `MemoryPool<T>` contracts should be followed exactly; a rented buffer is not necessarily zero-initialized or exactly the requested size.

## Tradeoffs and interview points

These APIs are valuable in parsers, serializers, and high-throughput I/O when profiling shows intermediate allocations or copies matter. They also add lifetime and aliasing complexity. Start with clear strings or collections, measure CPU and allocation behavior, then apply views to the actual bottleneck. A span is not automatically faster if the code still copies data later, and a view is not thread-safe simply because it is readonly.

Distinguish a view from ownership and from unsafe pointers: span operations retain managed bounds/lifetime checks, while unsafe code transfers more responsibility to the programmer. `ReadOnlySpan<T>` prevents writes through that view, but does not stop another alias from changing the backing array. For APIs used across asynchronous work, verify the owner remains valid through completion and all cancellation/error paths.

When using spans with Unicode text, remember that indexing exposes UTF-16 code units, not complete user-perceived characters. A parser that handles protocol delimiters may correctly operate on code units, while UI cursor movement or truncation often needs text-element-aware logic. Test empty input, missing separators, overflow, and non-ASCII input. Use ordinal semantics for protocol tokens and select parsing culture explicitly so behavior does not change with machine locale.
When returning a span or memory from an API, ensure its backing storage outlives every possible use. Returning a view over a local `stackalloc` buffer is rejected by lifetime rules; returning `Memory<T>` over a pooled array is syntactically possible but requires transferring or retaining the owner. APIs that accept `ReadOnlyMemory<T>` should not assume the caller will keep it unchanged unless the contract requires that. Copy when the data must be retained independently; zero-copy is only correct when ownership and mutation semantics are explicit.
In hot parsers, benchmark with realistic input lengths and malformed data, not only a tiny successful example. Avoid retaining spans or memory views in caches unless their backing storage and owner lifetimes are controlled.
## Related Topics

- [memorypool.md](memorypool.md)
- [arrays.md](arrays.md)
- [strings.md](strings.md)
- [unsafe-code.md](unsafe-code.md)
- [garbage-collection.md](garbage-collection.md)