# Concurrent Collections

`System.Collections.Concurrent` provides thread-safe collections for shared producer/consumer or concurrent-update scenarios, including `ConcurrentDictionary<TKey,TValue>`, `ConcurrentQueue<T>`, `ConcurrentStack<T>`, and `BlockingCollection<T>` (the latter is a higher-level blocking wrapper).

```csharp
var cache = new ConcurrentDictionary<string, int>();
int value = cache.GetOrAdd("attempts", _ => 0);
```

Individual collection operations have concurrency guarantees, but a sequence such as “check then update” is not automatically one atomic transaction. Use `TryAdd`, `TryUpdate`, `AddOrUpdate`, or `GetOrAdd` for the intended operation. For `GetOrAdd`/`AddOrUpdate`, delegate factories may execute more than once under contention; keep them side-effect-free or make effects idempotent.

Concurrent enumeration is generally safe from collection corruption, but often represents a moment-in-time or weakly consistent view rather than a locked snapshot; consult the type contract. Thread safety has throughput and allocation costs. A lock around a normal collection may be simpler and faster under low contention. Do not confuse thread-safe access with correctness of the larger workflow.

## Atomic operations are not transactions
Types such as `ConcurrentDictionary<TKey,TValue>`, `ConcurrentQueue<T>`, and `ConcurrentBag<T>` coordinate their documented operations so callers can use them concurrently without wrapping every individual access in a lock. Their choice depends on semantics: dictionary maps keys, queue is FIFO, and bag is an unordered collection optimized for concurrent add/take patterns. A concurrent collection is not a durable queue and does not guarantee that a multi-step business workflow is atomic.

Prefer compound APIs such as `TryAdd`, `TryUpdate`, or `GetOrAdd` over separate check-then-act calls. Factory delegates passed to concurrent dictionary methods may run more than once under contention even if only one value wins, so keep them side-effect-free or make repeated execution safe. If an invariant spans a collection and another field or collection, use a lock or redesign the state as one atomic value.

Enumeration often provides a moment-in-time or weakly consistent view according to the specific type's documented contract; do not assume it is a locked immutable snapshot. Concurrent operations can also have more allocation and coordination overhead than a normal collection. Use the ordinary collection with clear external synchronization when contention is low and the access pattern is simple.

Measure contention and throughput under realistic load. Interview answer: thread-safe operations prevent internal corruption, but do not imply lock-free implementation, deterministic ordering, or atomicity across arbitrary sequences. Choose a type based on its exact documented methods and consistency behavior.
## Related Topics

- [collections-overview.md](collections-overview.md)
- [dictionary.md](dictionary.md)
- [lock.md](lock.md)
- [threading.md](threading.md)