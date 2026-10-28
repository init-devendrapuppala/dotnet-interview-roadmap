# IDisposable, IAsyncDisposable, and `using`

Garbage collection reclaims managed memory, but it does not provide timely release of files, sockets, handles, transactions, or other scarce resources. `IDisposable` expresses deterministic cleanup; `using` ensures `Dispose` runs even on exceptions.

```csharp
using var reader = File.OpenText(path);
string? firstLine = reader.ReadLine();
```

For asynchronously released resources, implement/use `IAsyncDisposable` and `await using`. If a type owns another disposable, it should dispose that resource and document ownership. Do not dispose borrowed resources unless the contract transfers ownership. The dispose pattern is relevant when a type owns unmanaged resources or subclasses a disposable base; a finalizer is only a nondeterministic safety net and should not be added for ordinary managed fields.

Disposal may not be idempotent unless the type promises it. A disposed object must not be used concurrently by another operation; coordinate lifetime and cancellation in async flows. `using` does not change garbage collection of the object—it controls resource release. Prefer safe handles for unmanaged OS handles and avoid finalizer complexity where possible.

## Ownership and asynchronous cleanup
`IDisposable` models deterministic release of resources such as file handles, sockets, timers, or ownership wrappers. It is not primarily a way to force garbage collection: the GC reclaims managed memory, while external resources can be exhausted before collection happens. `using`/`using var` ensures `Dispose` runs on normal exit, `return`, or exception. A class that owns disposable fields should generally dispose them; a class that merely borrows a dependency should not dispose it unless ownership is explicitly transferred.

Use `await using` for `IAsyncDisposable` resources whose cleanup is asynchronous. Disposal can fail, so define how cleanup exceptions interact with an existing operation failure. Avoid disposing a resource while another task may still use it. A disposed object should not be reused, and ownership should be clear in API documentation.

The full dispose pattern is appropriate for types that own unmanaged resources directly and may need a finalizer; it is unnecessary boilerplate for every wrapper around managed `IDisposable` objects. Prefer `SafeHandle` for native handles. A finalizer runs nondeterministically and should not be used as the normal cleanup path. `GC.SuppressFinalize` is relevant when a type has a finalizer and deterministic disposal has completed.

Interview misconception: `using` is syntactic cleanup around `try/finally`; it does not guarantee a finalizer runs immediately or make a resource safe for concurrent use.
## Related Topics

- [streams.md](streams.md)
- [file-io.md](file-io.md)
- [memorypool.md](memorypool.md)
- [garbage-collection.md](garbage-collection.md)
- [async-await.md](async-await.md)