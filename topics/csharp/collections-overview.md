# Collections Overview

Choose a collection by its access and update pattern, not by habit. `List<T>` is a resizable indexed sequence; `Dictionary<TKey,TValue>` maps keys to values; `HashSet<T>` tracks unique values; `Queue<T>` is FIFO; `Stack<T>` is LIFO; and `LinkedList<T>` supports node-based insertion/removal when the node is already known.

```csharp
var counts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
counts["ready"] = counts.GetValueOrDefault("ready") + 1;
```

Generic collections preserve type safety and avoid boxing value types. Most standard mutable collections are **not thread-safe** for concurrent mutation. Synchronize shared access or use types in `System.Collections.Concurrent`; a concurrent collection does not make compound multi-step business operations automatically atomic.

Consider ordering guarantees, comparer semantics, memory overhead, resize behavior, and whether repeated enumeration is expensive. `IReadOnlyList<T>` communicates a narrower API, not deep immutability. For large pipelines, streaming with `IEnumerable<T>` may reduce peak memory; materialize with `ToArray`/`ToList` only when you need a snapshot or repeated access.

## Complexity, semantics, and concurrency
Pick a collection by its dominant operation and semantic contract. `List<T>` offers indexed access and amortized growth; `Dictionary<TKey,TValue>` and `HashSet<T>` rely on hashing and equality; `Queue<T>` is FIFO; `Stack<T>` is LIFO; and `LinkedList<T>` is useful when callers already hold a node and need local insertion/removal. These are typical complexity characteristics, not latency guarantees: hashing, resizing, comparer cost, and memory pressure all matter.

For dictionaries and sets, equality and hash codes must remain consistent while an item is stored. Choose string comparers deliberately—ordinal comparison is usually appropriate for identifiers and protocol keys, while culture-aware ordering is for user-facing text. Pre-size only when a reliable count is known; excess capacity also consumes memory. Enumeration order should only be relied on when the specific API/runtime contract documents it for the target you support.

Most mutable collections do not support concurrent mutation. A concurrent collection protects its documented operations, not a multi-step business invariant such as “check absent, then add and update another structure.” Use atomic APIs such as `GetOrAdd` where appropriate or synchronize the whole invariant. `IReadOnlyList<T>` restricts the interface surface but is not necessarily a snapshot or deeply immutable.

For a pipeline, streaming via `IEnumerable<T>` can lower peak memory, while materializing once can prevent repeated expensive enumeration and create a stable snapshot. Be explicit about this trade-off, especially when source enumeration performs I/O. Use specialized immutable or concurrent types only when their guarantees match the actual access pattern.
## Selection by access pattern
Complexity tables are useful but incomplete. A list usually offers compact storage and fast index access, while insertion/removal in the middle moves elements. A linked list avoids shifting once its node is known but has pointer indirection and expensive search. A dictionary/set has hashing and comparer costs; average lookup is commonly near O(1), not a worst-case guarantee. A queue and stack encode FIFO/LIFO intent and avoid callers implementing ordering rules manually.

Consider memory footprint and locality as well as Big-O. A few dozen elements may perform best in a simple list even if another structure has a better asymptotic operation. For large inputs, measure realistic key distribution, resize cost, and GC pressure. If size is predictable, pre-sizing can reduce growth copies; excessive reservation wastes memory.

Choose snapshot semantics deliberately. Returning `IReadOnlyList<T>` does not prevent the owner from mutating the underlying list. `ToArray` creates a shallow snapshot of references/values, not a deep copy. Immutable collections can simplify sharing but have different update/allocation costs. For concurrent access, prefer single-owner/message-passing patterns where possible; use concurrent collections for their documented atomic operations and synchronize compound invariants.

A useful interview answer compares alternatives against concrete operations: lookup, ordered iteration, range insertion, duplicate policy, concurrency, and lifetime. Explain the cost of the chosen structure and when it becomes a bottleneck rather than reciting complexity alone.
Also distinguish collection interfaces from storage guarantees. `IEnumerable<T>` promises iteration only; `IReadOnlyCollection<T>` adds count; `IReadOnlyList<T>` adds indexing. These interfaces do not imply a snapshot or thread safety. Returning a narrow interface reduces what callers can do but does not prevent mutation through another alias. Use immutable collections or copies when true snapshot semantics are required, and document whether enumeration can trigger I/O or throw partway through.
## Related Topics

- [list.md](list.md)
- [dictionary.md](dictionary.md)
- [hashset.md](hashset.md)
- [concurrent-collections.md](concurrent-collections.md)
- [ienumerable.md](ienumerable.md)