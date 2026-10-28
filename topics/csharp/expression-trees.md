# Expression Trees

An expression tree represents code as data in a tree of `Expression` nodes. Unlike a compiled delegate, a tree can be inspected, transformed, or translated by a provider—for example, an ORM translating a predicate into SQL.

```csharp
Expression<Func<Customer, bool>> active = customer => customer.IsActive;
Func<Customer, bool> compiled = active.Compile();
```

`IQueryable<T>` operators commonly accept expression trees so a provider can inspect the query; `IEnumerable<T>` operators normally accept delegates and execute in process. Not every C# construct can be represented or translated by every provider. Calling `Compile()` executes locally and may defeat server-side translation.

Expression trees are useful for rules, query providers, and dynamic mapping, but they add complexity and can incur construction, compilation, and reflection costs. Understand provider limitations and inspect generated queries for data access. Prefer ordinary delegates when only execution is needed; don't assume an expression tree is automatically faster or safer.

## Code as data and translation limits
An expression tree represents an expression as inspectable nodes, allowing a provider or tool to analyze and translate it rather than immediately execute it. A lambda converted to `Expression<Func<T,bool>>` is therefore different from a `Func<T,bool>` delegate: one is data, the other is executable behavior. LINQ providers use expression trees to translate query operations to another language such as SQL.

The expression-tree API models a supported subset of C# constructs. Not every modern C# syntax or statement-bodied lambda can be represented in the same way, and a provider may support an even smaller subset. A method call that works on `IEnumerable<T>` may fail translation on `IQueryable<T>`. Keep provider-translatable expressions simple and test against the actual provider rather than assuming compilation means successful translation.

Expressions can be inspected, rewritten, combined, or compiled to a delegate. Compilation has cost and may use dynamic code generation depending on runtime/platform; do not compile anew inside a hot loop. For caching compiled expressions, account for captured values and avoid retaining request-scoped state accidentally. Source generation can be a better fit for known compile-time transformations, especially trimming/AOT scenarios.

Interview misconception: expression trees do not automatically optimize code or execute remotely. A consumer chooses how to interpret them. They are useful when code must be represented and analyzed, but direct delegates are simpler when execution is all that is needed.
## Related Topics

- [iqueryable.md](iqueryable.md)
- [linq.md](linq.md)
- [lambda-expressions.md](lambda-expressions.md)
- [reflection.md](reflection.md)