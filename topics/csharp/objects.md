# Objects

An object is a runtime instance of a type. A class instance has identity and state; a reference variable can refer to that instance, and multiple variables can alias the same object.

```csharp
var first = new List<string> { "a" };
var second = first;
second.Add("b");
Console.WriteLine(first.Count); // 2
```

All types ultimately relate to `object`/`System.Object` in the type system. `ToString`, `Equals`, and `GetHashCode` have default behaviors that may be inappropriate for domain equality or dictionary keys; override them consistently or implement `IEquatable<T>`. Never mutate fields participating in a hash key’s equality while it is stored in a hash-based collection.

The CLR manages object memory, but garbage collection does not manage external resources such as file handles or sockets—those require deterministic disposal. Avoid treating `null` assignment as immediate deallocation. Object lifetime is based on reachability and runtime/JIT liveness, not merely lexical scope.

## Identity, equality, and lifetime
An object is an instance with state and behavior; a variable referring to a class instance holds a reference. Copying that reference creates an alias, so both variables can observe mutations. Decide whether a domain type's equality means identity or value equality. Classes use reference identity by default unless equality is overridden; records provide value-oriented equality conventions, but a record containing mutable references is not deeply immutable.

Construction should establish invariants, and methods should preserve them. Do not expose mutable internals unless ownership is clear. If an object owns unmanaged or disposable resources, implement an appropriate deterministic lifetime contract and ensure callers understand who disposes it. Garbage collection handles managed memory reclamation, not prompt closure of file handles or sockets.

Thread safety is a separate contract. An immutable object is easier to share, but immutability may be shallow; a mutable object needs synchronization or single-owner access when shared. Avoid publishing partially initialized objects. Object storage location is not fixed solely by the type syntax—do not claim every object always resides on the heap or every local on the stack.

Interview answer: explain reference copying versus object copying, identity versus value equality, and resource lifetime as separate ideas. Those distinctions are more useful than equating “object” with a specific memory region.
## Related Topics

- [classes.md](classes.md)
- [value-types-vs-reference-types.md](value-types-vs-reference-types.md)
- [garbage-collection.md](garbage-collection.md)
- [disposable-and-using.md](disposable-and-using.md)