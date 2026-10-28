# IEnumerable<T>

`IEnumerable<T>` represents a sequence that can be iterated synchronously. It says little about storage, size, repeatability, or cost: the source may be an in-memory collection, a generator, or a deferred query.

```csharp
static IEnumerable<int> Positive(IEnumerable<int> values)
{
    foreach (int value in values)
        if (value > 0)
            yield return value;
}
```

A `yield` iterator is deferred: its body runs as the consumer advances the enumerator, and it may run again on a second enumeration. Re-enumerating can repeat I/O, side effects, or expensive work, and some sources are one-shot. Materialize when a stable snapshot or multiple passes are required, while accounting for memory.

Accept `IEnumerable<T>` for streaming input when only enumeration is needed; use `IReadOnlyList<T>` when count/indexing are part of the contract. Dispose enumerators correctly—the `foreach` construct handles this. Avoid modifying a collection during its enumeration unless the collection explicitly supports it.

## Deferred execution, repeatability, and ownership
`IEnumerable<T>` says a caller can request values sequentially; it does not promise a count, indexing, caching, repeatability, or cheap traversal. A generator using `yield` starts executing when enumeration begins and resumes on each `MoveNext`. Disposing the enumerator runs iterator cleanup, and `foreach` handles disposal even on early exit. If a sequence wraps a file or database reader, enumeration may keep that resource open until completion/disposal.

A deferred query may run more than once. Repeating it can redo I/O, observe changed source state, or repeat side effects. Keep LINQ selectors and predicates pure where possible, and materialize with `ToArray`/`ToList` when a stable snapshot or multiple passes are required. Materialization costs memory and eagerly observes failures, so it is not universally better. Do not call `Count()` and then enumerate again on an unknown source if that repeats expensive work; use a collection count when the type contract provides it or materialize once.

Accept `IEnumerable<T>` when the API only needs streaming. Use `IReadOnlyCollection<T>` if count matters and `IReadOnlyList<T>` if indexing matters. Those interfaces communicate operations, not immutability or ownership; callers may still hold a mutable backing collection. Document whether the sequence is consumed once and whether enumeration performs external work.

Interview distinction: deferred execution is a property of particular operators/source implementations, not guaranteed merely because the type is `IEnumerable<T>`.
## Related Topics

- [ienumerator.md](ienumerator.md)
- [linq.md](linq.md)
- [iqueryable.md](iqueryable.md)
- [collections-overview.md](collections-overview.md)