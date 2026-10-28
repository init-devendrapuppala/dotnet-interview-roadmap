# LinkedList<T>

`LinkedList<T>` is a doubly linked list. Given a node, insertion or removal of adjacent nodes is O(1); finding a value is O(n), and indexed access is not supported.

```csharp
var recent = new LinkedList<string>();
LinkedListNode<string> first = recent.AddFirst("first");
recent.AddAfter(first, "second");
recent.Remove(first);
```

Each node carries links and an item, so memory overhead and cache locality are usually worse than a contiguous `List<T>`. Use a linked list when stable node handles and frequent insertion/removal at known positions matter—not simply because insertions are needed. Searching for the insertion point may dominate the operation.

Nodes belong to one list at a time; removal invalidates their membership. The collection is not thread-safe, and enumerators are typically invalidated by mutation. Measure real workload behavior before choosing this structure; in many application workloads a `List<T>` or queue is simpler and faster.

## When node-based storage is worthwhile
`LinkedList<T>` is a doubly linked list. Once a `LinkedListNode<T>` is known, insertion or removal around it is O(1); finding a value or index still requires O(n) traversal. Each node also carries links and object overhead, so it commonly uses more memory and has poorer locality than the contiguous backing storage of `List<T>`. The theoretical constant-time insertion is useful only when the node is already available and the access pattern actually needs it.

A node belongs to one list at a time; removing or moving it must follow the collection API's ownership rules. Keep node references private if clients should not mutate collection structure. Enumeration is not a stable snapshot, and concurrent access requires synchronization. Do not choose this collection merely because insertion/removal is frequent—an array-backed queue or list may outperform it due to cache locality and simpler allocation behavior.

For workloads that repeatedly locate items by key and then update order, a dictionary from key to node plus a linked list can implement an LRU cache. That design's correctness depends on keeping both structures synchronized and handling eviction atomically. Use a library implementation where possible rather than introducing that invariant casually.

Interview misconception: insertion is not O(1) if the node must first be found. Compare complete operations, memory overhead, and cache behavior, not only the complexity of one local pointer update.
## Related Topics

- [collections-overview.md](collections-overview.md)
- [list.md](list.md)
- [queue.md](queue.md)
- [ienumerable.md](ienumerable.md)