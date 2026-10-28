# List<T>

`List<T>` is a resizable, indexed collection backed by an array. Index access is O(1); appending is amortized O(1), while insertion/removal in the middle shifts later elements and is O(n).

```csharp
var names = new List<string>(capacity: 100) { "Ada", "Grace" };
names.Add("Katherine");
names.Sort(StringComparer.Ordinal);
```

Capacity is distinct from `Count`: pre-sizing can reduce reallocations when the likely size is known. When capacity is exceeded, the implementation allocates a larger backing array and copies elements; exact growth policy is an implementation detail. Avoid repeatedly calling `ToList()` in a pipeline unless materialization is intentional.

`List<T>` is not thread-safe for concurrent mutation. A `foreach` enumerator is invalidated by structural modifications; do not mutate the list during enumeration. Exposing `IReadOnlyList<T>` limits API operations but does not make the underlying list immutable if another reference can mutate it.

## Growth, capacity, and mutation
`List<T>` wraps a resizable array. Indexed reads and writes are O(1); appending is amortized O(1), with occasional O(n) resize and copy; inserting/removing near the front shifts later elements and is O(n). If a final count is known, setting capacity or constructing with capacity can avoid repeated growth, but do not greatly over-allocate without a reason. `Count` is the number of elements, while `Capacity` is reserved storage.

A list is mutable and not safe for concurrent writes. Enumeration generally detects structural modification and throws rather than offering a snapshot; do not rely on mutating it during `foreach`. If consumers should not modify a returned collection, expose an appropriate read-only interface, immutable copy, or snapshot. `AsReadOnly` wraps the original list, so changes through another reference remain visible; it is not a deep immutable copy.

Use `Find`, `IndexOf`, or a dictionary/set when lookup patterns warrant them; repeatedly searching a list is linear. `Remove` uses equality and may shift data. For stable value identity, design `Equals`/comparer behavior intentionally. LINQ operators over a list can be readable but may allocate iterators or materialized results; in hot paths measure before replacing clear code with manual loops.

Interview comparison: a list provides efficient index access and compact contiguous storage, whereas a linked list provides constant-time insertion only when the node is already known and still pays traversal cost to find that node. Most workloads favor `List<T>` despite the linked list's theoretical local-insertion advantage.
## Related Topics

- [collections-overview.md](collections-overview.md)
- [arrays.md](arrays.md)
- [ienumerable.md](ienumerable.md)
- [concurrent-collections.md](concurrent-collections.md)