# Stack<T>

`Stack<T>` is a last-in, first-out (LIFO) collection. `Push` adds an item; `Pop` removes the most recently pushed item. It is useful for depth-first traversal, undo histories, and nested work.

```csharp
var path = new Stack<string>();
path.Push("root");
if (path.TryPeek(out string? current))
    Console.WriteLine(current);
```

Use `TryPop` and `TryPeek` when an empty stack is an expected condition; `Pop` and `Peek` throw when empty. The standard collection is not thread-safe. A recursive algorithm may use the call stack implicitly, but an explicit `Stack<T>` can avoid deep recursion limits and make traversal state controllable.

A stack collection is not the same as the runtime call stack: it is an ordinary managed collection object. Do not assume its storage location or performance from its name. For concurrent access, synchronize or choose an appropriate concurrent structure.

## Stack collection versus call stack
`Stack<T>` is a generic LIFO collection: the most recently pushed item is popped first. `TryPop` and `TryPeek` avoid exceptions when empty; `Pop` and `Peek` throw when no element is available. It is useful for depth-first traversal, undo histories, parsing, and explicit work stacks. It is not the same thing as the call stack used by method execution, nor does using `Stack<T>` imply values are stored on the machine stack.

A stack collection is typically array-backed and grows as needed, but exact capacity strategy is an implementation detail. It is not thread-safe for concurrent mutation. If multiple workers access a shared stack, synchronize or choose a coordination abstraction with suitable semantics. Do not use it for FIFO processing; `Queue<T>` is the corresponding FIFO collection.

For algorithms, ensure pushes cannot grow without bound from untrusted input. Prefer iterative traversal with an explicit stack when recursion depth might exhaust the call stack, while recognizing that the explicit collection still consumes memory. Define what happens when duplicate work items are pushed and whether traversal order matters.

Interview misconception: stack data structure is an ordering policy, not a guaranteed memory location. Explain LIFO behavior, empty handling, and the algorithmic use case separately from the runtime call stack.
## Related Topics

- [collections-overview.md](collections-overview.md)
- [queue.md](queue.md)
- [threading.md](threading.md)
- [generics.md](generics.md)