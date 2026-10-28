# Methods

Methods package behavior behind a name and a signature. A signature includes the method name, generic arity, and parameter types/modifiers (return type alone does not distinguish overloads).

```csharp
public static decimal CalculateTotal(IEnumerable<decimal> prices)
{
    ArgumentNullException.ThrowIfNull(prices);
    return prices.Sum();
}
```

Overload resolution is compile-time and chooses the best applicable member based on argument types and conversions. Optional and named arguments improve call-site clarity but can complicate API versioning when defaults change. Use `async Task`/`Task<T>` for asynchronous operations rather than `async void` except event handlers; expose cancellation when callers need to stop work.

Keep methods cohesive and make side effects visible in names/contracts. Generic methods can express type-safe reusable behavior; avoid excessive overloads or hidden work that surprises callers. For public APIs, document exceptions, nullability, ownership, and whether returned sequences are lazy.

## Contracts, overloading, and async APIs
A method's signature and behavior form a contract: parameter meaning, return semantics, mutation, exceptions, and cancellation should be clear. Avoid overloads that become ambiguous with optional or `null` arguments. Use distinct names or options objects when overload selection is unclear. Keep methods cohesive and return values that callers can reliably interpret; avoid mutating input collections unless documented.

C# passes arguments by value by default. For reference-type parameters the copied value is a reference, so a method can mutate the referenced object but reassigning its local parameter does not replace the caller's variable. `ref`, `out`, and `in` change that contract and should be used only when needed. Generic methods can provide reusable type-safe behavior; constraints should express only required capabilities.

Async methods typically return `Task`/`Task<T>` and propagate cancellation tokens. Avoid `async void` except event-handler signatures because callers cannot await or observe exceptions. Return a task directly when no local await/cleanup/exception transformation is needed. Avoid blocking on returned tasks.

Public method changes can be source and binary compatibility concerns, especially in libraries. Validate inputs at boundaries, use standard argument exceptions, and document expected failure modes. In interviews, explain method dispatch (`virtual`/interface), parameter passing, and task semantics separately; method syntax alone does not determine thread use or allocation.
## Related Topics

- [parameter-passing.md](parameter-passing.md)
- [generics.md](generics.md)
- [async-await.md](async-await.md)
- [exception-handling.md](exception-handling.md)