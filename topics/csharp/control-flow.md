# Control Flow

Control-flow statements determine which code runs, in what order, and how execution leaves a region. The core choices are conditional branches (`if`, `switch`), iteration (`for`, `foreach`, `while`, `do`), and transfers (`return`, `break`, `continue`, `throw`, and `goto`). Good control flow makes invariants, boundary conditions, and termination visible to the next reader.

## Choosing a branch

Use `if` when a condition is naturally Boolean or a few conditions combine into one decision. A `switch` statement or expression is useful when one input selects among alternatives; switch expressions make the result explicit and require handling all possible inputs, either with explicit arms or a deliberate discard arm.

```csharp
static string Describe(object? value) => value switch
{
    null => "missing",
    string { Length: 0 } => "empty",
    string text => $"text ({text.Length} characters)",
    int number when number >= 0 => "non-negative number",
    int => "negative number",
    _ => "other"
};
```

Pattern matching combines a type test, binding, and optional guard. It can reduce nested casts and make a state machine readable, but a long switch with overlapping guards can be harder to reason about than small named methods. Keep the order and fallback behavior intentional.

## Loops and transfers

Choose a `foreach` when consuming a sequence, a `for` when the index or step is part of the algorithm, and `while` when the condition controls an unknown number of iterations. `do` runs its body at least once, which is occasionally the exact requirement but is easy to misuse. `break` exits the nearest loop or switch; `continue` advances the nearest loop. A `return` exits the method, often avoiding an extra nesting level.

```csharp
foreach (var item in items)
{
    if (!item.IsValid)
        continue;

    Process(item);
}
```

`foreach` is based on an enumerator pattern, not exclusively on `IEnumerable<T>`. For disposable enumerators, the generated code ensures disposal even when the loop exits early. `await foreach` consumes `IAsyncEnumerable<T>` and can await asynchronous movement between elements; cancellation must be supported by the source/API (commonly via a cancellation token).

## Production and interview considerations

Check empty input, off-by-one conditions, integer overflow in counters, and whether state changes can prevent termination. Avoid work inside loop conditions if it repeats an expensive computation. For collection mutation, know whether the collection permits it during enumeration; many standard collections invalidate an active enumerator and throw rather than silently produce a defined result.

LINQ can express a pure filter/projection succinctly, but explicit loops are often clearer for side effects, complex early exits, or allocation-sensitive hot paths. Exceptions should represent exceptional failures, not ordinary branch selection. Avoid deeply nested conditionals by using guard clauses or extracting a method, while preserving the order of checks if they have side effects.

An interview answer should distinguish language behavior from style: `break` and `continue` have defined lexical targets; the compiler's implementation of a loop is not a promise about performance. Measure before replacing clear code with a lower-level construct.

## Related Topics

- [pattern-matching.md](pattern-matching.md)
- [arrays.md](arrays.md)
- [ienumerable.md](ienumerable.md)
- [exception-handling.md](exception-handling.md)
