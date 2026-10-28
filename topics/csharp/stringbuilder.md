# StringBuilder

`StringBuilder` provides mutable character-buffer construction and is useful when text is assembled through many incremental appends.

```csharp
var builder = new StringBuilder(capacity: 128);
foreach (string part in parts)
    builder.Append(part).Append(';');
string result = builder.ToString();
```

Repeated `string` concatenation in a loop can create intermediate allocations; a builder can reduce them. For a small, fixed number of interpolated values, normal interpolation is usually clearer and modern runtimes optimize common cases. `StringBuilder` is mutable and not thread-safe, and `ToString()` creates the final immutable string.

Capacity can reduce growth copies when a reasonable estimate is known, but oversized buffers retain memory longer. Builders can be reused cautiously, but pooling adds lifetime and data-clearing concerns. Benchmark the actual workload before replacing readable string operations with a builder.

## Allocation and correct use
Strings are immutable, so repeated concatenation in a loop can allocate many intermediate strings as each result is created. `StringBuilder` maintains a mutable buffer and is useful when appending many pieces before producing one final string. It is not automatically faster for a few concatenations—the compiler/runtime may optimize simple expressions, and builder growth/copying also has cost.

```csharp
var builder = new StringBuilder(capacity: 128);
foreach (var item in items)
    builder.Append(item.Name).Append(':').AppendLine(item.Value);
string report = builder.ToString();
```

Pre-size only when a reasonable output size estimate exists. A builder is mutable and not thread-safe; do not share one across concurrent writers without synchronization. `ToString()` creates the resulting immutable string, so building a huge output still requires memory for that final string. For streaming output, write to a `TextWriter`/stream rather than materializing everything.

For formatting, use interpolation or `string.Create`/span-based APIs where appropriate and measure hot paths. Avoid a `StringBuilder` field reused across requests unless access is synchronized and its retained capacity is bounded; a single exceptionally large result can leave a large buffer retained. Interview misconception: StringBuilder avoids repeated immutable intermediate strings, not all allocations.
## Related Topics

- [strings.md](strings.md)
- [span-and-memory.md](span-and-memory.md)
- [memorypool.md](memorypool.md)
- [garbage-collection.md](garbage-collection.md)