# HashSet

`HashSet<T>` stores distinct values according to an equality comparer and supports efficient membership tests and set operations such as union, intersection, and difference.

```csharp
var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
{
    "read", "write"
};
bool canWrite = allowed.Contains("WRITE");
```

Like dictionary keys, elements must keep consistent equality and hash behavior while in the set. Mutating a field used by `GetHashCode`/`Equals` can make an element difficult to find or remove. Use an explicit comparer for strings and other domain keys. The expected average membership complexity is near O(1), but collisions and resizing affect actual cost.

Hash sets are not ordered collections and should not be used when iteration order is part of the output contract. They are mutable and not thread-safe for concurrent writes. For immutable or read-heavy data, consider an immutable set or publish a safely built snapshot.

## Set semantics and equality
`HashSet<T>` stores distinct values according to its equality comparer and is suited to membership tests, deduplication, and set operations such as union, intersection, and difference. Average membership is typically near constant time, though hash quality, comparer cost, collisions, and resize behavior affect performance. If an input sequence is queried repeatedly for membership, building one set can be cheaper than repeatedly scanning a list; account for the set's allocation and construction cost when the sequence is small or used once.

An element must keep stable equality and hash behavior while present. Do not mutate fields used by its hash code after insertion. For custom types, ensure equal values produce equal hash codes; for strings use an explicit comparer when case sensitivity is domain-specific. Equality semantics are part of correctness, not a micro-optimization.

Set operations often return or mutate sets depending on the API. Methods such as `IntersectWith` mutate the receiver; LINQ's `Intersect` returns a deferred sequence. Make this distinction clear to avoid surprising shared-state changes or re-enumeration. `HashSet<T>` is not safe for concurrent writes; use synchronization or a concurrent alternative only if its semantics match the required operations.

A set does not guarantee a meaningful ordering. If deterministic output matters, sort at the presentation boundary. For interviews, compare it with a dictionary: both use hashing, but a set models membership without an associated value. A set's uniqueness is only as good as the comparer supplied.
## Related Topics

- [collections-overview.md](collections-overview.md)
- [dictionary.md](dictionary.md)
- [generics.md](generics.md)
- [concurrent-collections.md](concurrent-collections.md)