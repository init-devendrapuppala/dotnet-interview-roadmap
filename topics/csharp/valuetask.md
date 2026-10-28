# ValueTask<T>

`ValueTask<T>` can represent a result that is available synchronously without necessarily allocating a separate `Task<T>`. It is useful for performance-sensitive APIs where synchronous completion is common and measurement shows task allocation matters.

```csharp
public ValueTask<int> GetCachedCountAsync()
    => ValueTask.FromResult(_cache.Count);
```

Unlike `Task<T>`, a `ValueTask<T>` is a value type that may wrap a result, a task, or an `IValueTaskSource<T>`. Unless the API explicitly supports it, consume it once and await it directly; do not cache it, await it multiple times, or call `.AsTask()` repeatedly. Converting to a task may allocate.

The extra usage constraints can make callers and implementations more complex. Prefer `Task<T>` by default for general APIs, composition, and repeated observation. Choose `ValueTask<T>` only when profiling demonstrates benefit and the contract clearly communicates consumption rules. Do not assume it eliminates all allocations or is inherently faster.

## Allocation tradeoffs and consumption rules
`ValueTask<T>` can avoid allocating a separate `Task<T>` when an operation frequently completes synchronously or returns a reusable result source. This is a specialized optimization, not a faster default. It is a struct wrapper and should generally be awaited once; repeatedly awaiting, calling `.AsTask()`, or storing/copying it carelessly can defeat the optimization or violate `IValueTaskSource<T>` consumption rules. Check the API contract before treating it like a reusable task.

Use `Task<T>` for most public asynchronous APIs because it composes naturally with `WhenAll`, can be awaited multiple times, and has straightforward caching/completion semantics. Consider `ValueTask<T>` only after profiling shows task allocation matters and the common completion path is synchronous. Benchmark on the actual runtime and workload, including wrapper copies and callers that need task composition.

`async` methods returning `ValueTask<T>` can still allocate a state machine when they suspend; the return type alone does not eliminate all allocation. Avoid returning it from a broad API solely because it sounds lower-level. Converting to `Task` with `AsTask()` may allocate or wrap a source, and the conversion should happen at most once where required.

Interview misconception: ValueTask is not a general replacement for Task and does not make work run synchronously. Its purpose is an allocation tradeoff for particular APIs, purchased with stricter consumption semantics and more complex callers.
## Related Topics

- [task.md](task.md)
- [async-await.md](async-await.md)
- [generics.md](generics.md)
- [threadpool.md](threadpool.md)