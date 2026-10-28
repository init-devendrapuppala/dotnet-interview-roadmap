# Lambda Expressions

A lambda is an inline function expression, commonly used for delegates, event handlers, and LINQ selectors or predicates. It can be converted to a delegate or, in compatible contexts, an expression tree.

```csharp
Func<int, int> square = value => value * value;
var labels = values.Select(value => $"item-{value}");
```

Lambdas may capture variables from an enclosing scope. The captured variable is shared, not copied at each lambda creation; closures can therefore extend lifetimes and introduce races if accessed concurrently. Static lambdas (`static value => ...`) cannot capture locals, making accidental captures impossible and sometimes reducing allocation opportunities.

A lambda in an `IEnumerable<T>` query is generally executable code; for `IQueryable<T>`, it is usually represented as an expression tree and translated by a provider. Target type matters for overload resolution and inference. Keep complex logic in named methods when it improves debugging, reuse, or testability.

## Delegate versus expression-tree conversion
A lambda is anonymous function syntax. Its target context determines whether it becomes a delegate, an expression tree, or another supported target type. A lambda converted to `Func<T,bool>` is executable code; one converted to `Expression<Func<T,bool>>` is represented as data for inspection or provider translation. These are not interchangeable, and statement-bodied lambdas generally cannot be represented in expression trees in the same way as expression-bodied lambdas.

Closures capture outer variables, not snapshots. A callback can therefore observe later mutation and keep captured objects alive. In loops or long-lived subscriptions, capture intended values carefully and detach handlers when needed. A static lambda (where supported) cannot capture locals or `this`, making accidental retention impossible and documenting independence.

Use lambdas for short transformations, predicates, and callbacks. Extract a named method when behavior is complex, reused, requires a meaningful name, or deserves direct tests. LINQ query providers may support only a subset of lambda constructs; compilation does not guarantee translation to SQL or another provider language. Avoid side effects in deferred query lambdas because reevaluation can repeat them.

A lambda itself does not create a thread or make work asynchronous. It may incur delegate/closure allocations depending on capture and compiler/runtime optimizations; measure in hot paths instead of assuming syntax cost. Interview focus: target typing, closure semantics, and whether the target is executable delegate or expression data.
## Related Topics

- [delegates.md](delegates.md)
- [anonymous-methods.md](anonymous-methods.md)
- [linq.md](linq.md)
- [expression-trees.md](expression-trees.md)