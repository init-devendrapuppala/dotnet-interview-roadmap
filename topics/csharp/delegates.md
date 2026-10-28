# Delegates

A delegate is a type-safe reference to one or more methods with a compatible signature. It enables callbacks, strategies, and event handlers without requiring inheritance.

```csharp
Func<int, int, int> add = (left, right) => left + right;
Action<string> log = message => Console.WriteLine(message);
```

`Func<>` represents a function with a return value; `Action<>` represents a `void` operation; `Predicate<T>` is a legacy-style Boolean test. Delegates can be combined with `+=` and removed with `-=`, invoking an invocation list in order. An exception from a handler stops normal multicast invocation unless explicitly isolated.

Closures may capture variables and extend their lifetimes. Avoid capturing mutable loop state unexpectedly or retaining large object graphs in long-lived callbacks. Delegate equality and removal depend on method/target identity semantics; retaining a handler delegate is safer for later unsubscription. Use custom delegate types when names or `ref`/`in`/`out` signatures improve API clarity.

## Invocation, variance, and API choices
A delegate type includes its parameter and return types, plus ref-kind and generic variance rules. Assignment is type checked, so incompatible signatures cannot be invoked accidentally. `Func<T,...>` and `Action<T...>` are convenient for private callbacks; a named delegate can make a public API's intent clearer or express a signature that built-ins cannot, such as `ref` parameters. Variance lets certain reference-type delegate conversions be safe: a method accepting a less-derived input can serve a delegate expecting a more-derived input (contravariance), and a more-derived return can satisfy a less-derived result (covariance). Value types do not participate in this variance conversion.

A multicast delegate invokes handlers in its invocation list synchronously and in order. A handler exception normally stops later handlers. Its return value, if any, is the value of the last handler, which is why multicast delegates are most useful for `void` notifications rather than combining independent results. `GetInvocationList` is available when a publisher must isolate each handler's failure, but doing so changes error semantics and should be deliberate.

Closures capture variables and can extend object lifetimes; inspect captures in long-lived callbacks. Delegate combination/removal uses delegate equality (method and target), not an arbitrary identifier. Store the exact handler when later removal is required. Delegate invocation is not inherently asynchronous, thread-safe state management, or a guarantee of no allocation; measure hot callback paths rather than assuming. Use a delegate for a callback/strategy and an event when subscribers should be able to add/remove handlers but not raise the notification themselves.
## Designing callback contracts
Delegates are useful when a caller supplies a behavior: predicates, sorting comparers, retry policies, and completion callbacks. Prefer a named delegate or interface when the operation has domain meaning, needs multiple members/state, or needs a richer contract than a raw `Func`. A `Func` communicates shape but not important semantics such as whether the callback can be invoked multiple times, concurrently, or after the call returns.

Closures can accidentally retain request-scoped services in long-lived objects. Avoid storing callbacks beyond their intended lifetime, and do not assume captured locals are immutable snapshots. A callback may be invoked from a different thread unless the API explicitly guarantees affinity; document this and avoid unsynchronized access to captured state. For high-throughput APIs, benchmark delegate invocation and capturing versus non-capturing call sites rather than assuming allocation characteristics from syntax alone.

Multicast invocation has subtle result/error behavior: handlers run synchronously in invocation-list order, a `void` delegate simply notifies, and the last handler's return value is the combined result for a returning delegate. A thrown exception normally interrupts the list. If all subscribers must receive notification despite failures, the publisher can enumerate and isolate each handler, but it should surface failures through a deliberate policy.

Compared with an interface, a delegate is lightweight for one operation and easy to pass inline; an interface is better for cohesive stateful capability or multiple related operations. Choose by contract and lifecycle, not by a claim that delegates are always faster.
For an API that stores a callback, document whether it is called zero, one, or many times, whether it can be called concurrently, and whether it may be invoked after the original call returns. These details determine whether captured state can be mutated safely and how long it remains alive. Do not retain callbacks past a request unless that lifetime is intentional. When adapting a delegate to another API, preserve cancellation and exception propagation rather than silently discarding returned tasks.
## Related Topics

- [lambda-expressions.md](lambda-expressions.md)
- [anonymous-methods.md](anonymous-methods.md)
- [events.md](events.md)
- [generics.md](generics.md)