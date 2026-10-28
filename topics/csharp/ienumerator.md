# IEnumerator<T>

`IEnumerator<T>` represents the state of a single traversal. `MoveNext()` advances, `Current` returns the current element, and `Dispose()` releases traversal resources when applicable.

```csharp
using var iterator = values.GetEnumerator();
while (iterator.MoveNext())
    Process(iterator.Current);
```

In normal code, `foreach` is preferred: the compiler emits enumeration logic and ensures disposal, including when iteration exits early or throws. `IEnumerator<T>` exposes a mutable cursor, so one enumerator is not generally shared safely across threads. `Current` is only valid when positioned on an element.

Custom enumerators can implement `IEnumerable<T>`/`IEnumerator<T>`, but `yield return` is usually simpler and produces a compiler-generated state machine. Iterator methods are deferred, so exceptions may occur during enumeration rather than when the sequence is created. Keep resources scoped so iterator disposal also cleans them up.

## Enumerator state and disposal
An enumerator is the stateful cursor behind iteration. `MoveNext()` advances and reports whether a current element exists; `Current` is meaningful only in the valid state after a successful move. `Reset` is not generally supported by enumerators and callers should not depend on it. `foreach` obtains the enumerator, advances it, reads `Current`, and disposes it when the enumerator pattern supports disposal, including when the loop exits early.

Implementing an iterator with `yield return` lets the compiler generate the state machine and cleanup path. It is deferred: local code executes as the caller requests elements, and a second enumeration normally creates a fresh iterator, potentially repeating work. `yield break` ends the sequence. Iterator methods cannot yield from a `try` block that has a `catch`, and cannot `yield return` inside `try` with `catch`; `try/finally` can express cleanup around yielded values.

Do not expose a single mutable enumerator instance as a repeatable sequence unless one-shot behavior is explicitly intended. Enumerators are not normally thread-safe; two consumers advancing one enumerator interfere with one another. Resource-backed iterators need careful lifetime design, especially when consumers stop early. Prefer `IEnumerable<T>` and compiler-generated iteration over handwritten enumerators unless custom traversal semantics justify the added state and disposal complexity.

A common interview misconception is that enumeration always means an in-memory collection: an enumerator may represent a generator, database reader, or stream and each move can do meaningful work.
## Related Topics

- [ienumerable.md](ienumerable.md)
- [linq.md](linq.md)
- [disposable-and-using.md](disposable-and-using.md)
- [streams.md](streams.md)