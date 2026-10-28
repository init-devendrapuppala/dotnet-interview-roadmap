# Streams

`Stream` is an abstraction for sequential byte I/O. It exposes read/write operations and capability flags; concrete streams may represent files, memory, network sockets, compression, or wrappers.

```csharp
await using var input = File.OpenRead(path);
await using var output = File.Create(destination);
await input.CopyToAsync(output, cancellationToken);
```

A stream may be non-seekable or read-only, so check capabilities rather than assuming `Length`, `Position`, or seeking works. Reads can return fewer bytes than requested; loop until the desired data has been consumed or end-of-stream is reached. For framed protocols, implement exact-length reads and validate untrusted lengths before allocating.

Streams are disposable resources; disposing a wrapper may also dispose its underlying stream depending on constructor options. Document ownership (`leaveOpen` where available). Async methods avoid blocking while waiting for I/O, but not every implementation guarantees true asynchronous OS operations. Buffer size and pooling should be measured and managed safely.

## Sequential data and ownership
A `Stream` represents byte-oriented input/output and abstracts files, memory, network connections, and other sources. It may be seekable or forward-only, readable or writable; check capability properties rather than assuming. Stream position is mutable state, so concurrent operations on one stream generally require coordination. Dispose streams deterministically, and document whether an API owns a passed stream or merely borrows it.

Read/write operations can return fewer bytes than requested; callers must process the actual count and continue as necessary. Higher-level APIs such as `StreamReader` handle text decoding, while raw streams operate on bytes. Select encodings explicitly for text formats when defaults are not part of the contract. Buffering improves throughput for many small operations but can add memory and latency; avoid stacking redundant buffers without measurement.

Use async methods for I/O-bound operations where the underlying API supports them, and propagate cancellation. `CopyToAsync` can simplify streaming between sources without loading the complete content into memory. A stream may be non-seekable, so do not rewind or reread unless `CanSeek` and position semantics allow it. `Flush` pushes managed buffers downstream but is not universally a durable-storage guarantee.

Interview focus: streams are byte abstractions, not necessarily files or in-memory buffers. Discuss capabilities, partial reads, encoding, async behavior, cancellation, and ownership.
## Related Topics

- [file-io.md](file-io.md)
- [disposable-and-using.md](disposable-and-using.md)
- [async-await.md](async-await.md)
- [span-and-memory.md](span-and-memory.md)