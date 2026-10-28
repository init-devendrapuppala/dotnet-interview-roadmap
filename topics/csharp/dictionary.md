# Dictionary

`Dictionary<TKey,TValue>` stores key/value pairs and is typically the right choice for frequent lookup by key. Lookup, insertion, and removal are usually near constant-time on average, but this is an implementation/performance expectation rather than a language guarantee.

```csharp
var scores = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
{
    ["Ada"] = 98
};

if (scores.TryGetValue("ada", out int score))
    Console.WriteLine(score);
```

Keys must have stable equality and hash-code behavior while stored. A mutable key whose hash changes can become effectively unreachable. Choose a comparer deliberately—especially for strings—and do not assume culture-sensitive comparison is appropriate for identifiers. `TryGetValue` avoids separate lookup and missing-key exceptions.

Capacity can be pre-sized when counts are known, avoiding some resizes. Enumeration order should not be treated as a durable contract unless the documented target runtime guarantees it for your use case. `Dictionary` is not safe for concurrent writes; use synchronization or `ConcurrentDictionary` when needed.

## Key correctness and common patterns
A dictionary lookup uses a comparer to determine equality and hashing. Equal keys must have equal hash codes, and key behavior must remain stable while stored. A mutable key that changes fields used by its hash can become inaccessible because its new hash maps to another bucket. Prefer immutable key types. For strings, pass an explicit comparer when the domain requires case-insensitive or ordinal behavior instead of depending on a culture-sensitive default.

`TryGetValue` expresses the common missing-key branch without exception-driven control flow. `GetValueOrDefault` is convenient when a default value has unambiguous meaning; it can blur “missing” with a stored default otherwise. `TryAdd` or `GetOrAdd` can express insertion intent. In ordinary `Dictionary`, `GetOrAdd` is not available; `ConcurrentDictionary` provides atomic operations with its own delegate execution semantics. Avoid `ContainsKey` followed by indexer retrieval when a single lookup suffices.

Lookup/insertion are typically near O(1) average, but adversarial collisions, expensive comparers, resizing, and memory allocation affect real cost. Set initial capacity when input size is known reasonably well. Do not treat iteration order as a cross-runtime or serialization contract unless the documented target explicitly guarantees what your application needs. Never mutate a dictionary concurrently without synchronization. `ConcurrentDictionary` handles individual operations, not arbitrary compound updates.

Interview misconception: dictionary keys are not compared only by reference, and hash codes are not unique IDs. Equality decides key equivalence; hash code narrows candidates. A correct custom key must implement both consistently.
## Related Topics

- [collections-overview.md](collections-overview.md)
- [hashset.md](hashset.md)
- [concurrent-collections.md](concurrent-collections.md)
- [generics.md](generics.md)