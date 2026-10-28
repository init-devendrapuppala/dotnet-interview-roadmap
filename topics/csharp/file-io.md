# File I/O

.NET file APIs support synchronous and asynchronous access through `File`, `FileStream`, `StreamReader`, and `StreamWriter`. Choose async APIs for I/O-bound work in scalable server applications so a waiting operation does not occupy a worker thread.

```csharp
await using var stream = new FileStream(
    path, FileMode.Open, FileAccess.Read, FileShare.Read,
    bufferSize: 64 * 1024, useAsync: true);
using var reader = new StreamReader(stream);
string? line;
while ((line = await reader.ReadLineAsync(cancellationToken)) is not null)
    Process(line);
```

Always define file mode, access, sharing, encoding, and cancellation behavior deliberately. File operations can fail due to permissions, locks, paths, disk exhaustion, or transient conditions; do not assume existence checks eliminate races. Dispose streams deterministically. Avoid loading entire large files into memory without a size bound.

Async file APIs do not guarantee that the operating system performs every step asynchronously on every platform. Use buffering appropriately and measure. Treat paths and file content as untrusted input; enforce directory boundaries and validate size/format when processing uploads.

## Async I/O, buffering, and resource lifetime
File APIs involve external resources and can fail due to permissions, paths, sharing, disk capacity, or concurrent changes. Validate user-controlled paths according to the application's security boundary; do not assume combining a root and untrusted relative path prevents traversal. Use `Path` APIs rather than manual separator concatenation, and consider atomic replacement patterns when partial writes would corrupt important data.

Use `using`/`await using` to dispose streams deterministically. Async stream methods avoid blocking a worker while the OS operation is pending, but do not guarantee the operation is faster or that every underlying filesystem is truly asynchronous. Pass cancellation tokens where supported. Buffering and `File.ReadAllText` are convenient for bounded files; stream large content to avoid loading the entire payload into memory. For text, specify or understand encoding and handle malformed input deliberately.

Concurrent readers/writers need an explicit sharing and consistency policy. A stream's position is mutable state; do not concurrently read/write one stream without synchronization and an API contract designed for it. Flush behavior differs between managed buffers and durable storage; a successful write call is not a universal guarantee against power loss.

Interview answer: explain asynchronous I/O versus `Task.Run`, resource ownership, encoding, and memory tradeoffs. Catch expected I/O exceptions at the boundary that can recover or report useful context; do not hide them behind a blanket catch.
## Related Topics

- [streams.md](streams.md)
- [disposable-and-using.md](disposable-and-using.md)
- [async-await.md](async-await.md)
- [cancellationtoken.md](cancellationtoken.md)