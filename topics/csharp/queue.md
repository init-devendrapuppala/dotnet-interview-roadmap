# Queue<T>

`Queue<T>` is a first-in, first-out (FIFO) collection: enqueue at the tail and dequeue from the head. It is useful for work scheduling and breadth-first traversal where arrival order matters.

```csharp
var pending = new Queue<string>();
pending.Enqueue("job-1");
if (pending.TryDequeue(out string? job))
    Process(job);
```

`TryDequeue`/`TryPeek` avoid exceptions when the queue is empty. The standard `Queue<T>` is not safe for concurrent access; `ConcurrentQueue<T>` supports concurrent producers/consumers but does not itself provide backpressure or blocking waits. A queue can grow without bound if producers outpace consumers, so production pipelines need capacity, cancellation, and overload policy.

Do not treat FIFO as a guarantee of processing completion order when work is dispatched concurrently. For bounded producer/consumer pipelines, use an appropriate channel or bounded queue abstraction rather than repeatedly polling.

## FIFO behavior and production concerns
A queue models first-in, first-out processing: `Enqueue` adds at the tail and `Dequeue` removes the oldest item. `TryDequeue` is safer when empty is normal; `Dequeue` throws if no item exists. A `Queue<T>` is an in-memory collection, not a durable job system: process failure loses its contents unless the queue is persisted elsewhere. It is not safe for concurrent access without synchronization.

A queue is useful for breadth-first traversal, local work scheduling, and ordered buffering. It does not by itself provide backpressure, retries, visibility timeouts, dead-letter handling, or exactly-once processing. For producer/consumer concurrency, `System.Threading.Channels` or a concurrent collection can offer appropriate coordination, but choose bounded capacity and cancellation semantics so producers cannot create unbounded memory growth.

Avoid checking `Count` and then dequeuing in a concurrently accessed structure; the state may change between calls. Prefer a single try operation on a concurrent abstraction. When queueing references, ownership remains shared: a producer mutating an item after enqueue can race with a consumer. Use immutable messages or clear ownership transfer rules.

The internal representation and resize strategy are implementation details. Reason about the API's FIFO contract, not assumed storage layout. In interviews, contrast a queue with a stack and explain where FIFO matters, then discuss empty handling and concurrency separately.
## Related Topics

- [collections-overview.md](collections-overview.md)
- [concurrent-collections.md](concurrent-collections.md)
- [threading.md](threading.md)
- [cancellationtoken.md](cancellationtoken.md)