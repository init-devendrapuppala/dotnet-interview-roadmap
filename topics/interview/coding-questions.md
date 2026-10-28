# Coding Interview Preparation for .NET Developers

For a four-to-six-year .NET engineer, a coding round tests more than syntax. Interviewers want a correct, explainable solution, sensible complexity, safe handling of edge cases, and code that another developer could maintain. Clarify requirements before choosing a data structure or writing framework-specific code.

## A repeatable solving framework

1. **Clarify:** Ask about input size, ordering, duplicates, null/empty input, invalid values, and whether mutation is allowed. Confirm the expected result and error behavior.
2. **Model:** Restate the problem, identify invariants, and walk through a small example, including a boundary case.
3. **Choose:** Explain a straightforward approach first. Compare alternatives by time and space complexity; state assumptions.
4. **Implement:** Use clear names and small methods. In C#, choose collection types for their behavior (`Dictionary<TKey,TValue>` for keyed lookup, `HashSet<T>` for membership) rather than habit.
5. **Verify:** Trace a normal case, an edge case, and a failure case. State complexity and what tests you would add.

If requirements are ambiguous, make a reasonable assumption aloud and invite correction. If stuck, describe the invariant or a simpler working approach rather than silently switching strategies.

## Realistic practice prompts

### Deduplicate while preserving first-seen order

Given a sequence of identifiers, return each identifier once in encounter order. Discuss whether equality is ordinal/case-sensitive and how nulls are treated. A `HashSet<T>` can track membership while a list captures order; expected time is linear under normal hash behavior, with additional space proportional to unique values. Test empty input, repeated values, and identifiers differing only by case.

**What is evaluated:** Correct equality semantics, preservation of order, and a clear complexity explanation—not clever syntax.

### Aggregate events by key

Given events with a category and amount, compute totals per category while ignoring or rejecting invalid records according to an explicit rule. Use a dictionary and consider overflow, decimal versus floating-point money, missing categories, and deterministic output requirements. Keep parsing/validation distinct from aggregation if it improves clarity.

**What is evaluated:** Domain assumptions, robust edge cases, and not hiding invalid data with arbitrary defaults.

### Merge time intervals

Given intervals, merge overlapping ranges. Clarify whether touching endpoints count as overlap and whether zero-length or reversed intervals are valid. Sort by start, then scan while maintaining the current merged interval. Explain the sort-dominated `O(n log n)` time and output space.

**What is evaluated:** Stated interval convention, sorting correctness, and tests for nested, touching, disjoint, and single intervals.

### Asynchronous fan-out

Given a set of independent I/O operations, collect results while respecting a concurrency limit and cancellation. Discuss why unbounded `Task.WhenAll` can overload a dependency, how cancellation is propagated, and how per-operation failures should be represented. Do not use `Task.Run` as a substitute for asynchronous I/O. Avoid blocking on tasks with `.Result` or `.Wait()`.

**What is evaluated:** Understanding of async control flow, bounded work, cancellation, and failure semantics—not familiarity with a particular helper library.

## C# and test habits

- Prefer explicit contracts and guard clauses where they make invalid states clear.
- Use `TryGetValue` for dictionary lookup when absence is expected; avoid repeated lookups.
- Be careful with deferred LINQ execution and repeated enumeration. Materialize only when needed.
- Do not catch exceptions just to return a misleading success value; handle only where recovery or useful context is possible.
- Add tests around behavior and boundaries. A focused test name should communicate scenario and expected result.

## Evaluation rubric

| Area | Strong signal |
|---|---|
| Correctness | Handles stated cases and surfaces assumptions |
| Reasoning | Explains invariant and compares a viable alternative |
| Complexity | Gives defensible time/space bounds |
| C# fluency | Uses standard collections and async APIs appropriately |
| Maintainability | Names concepts clearly and avoids unnecessary abstraction |
| Verification | Walks through edge cases and proposes targeted tests |

Interview exercises vary. If code execution or an IDE is available, use it to validate a hypothesis, not to skip explaining it. If not, trace state carefully and narrate checks before claiming the solution is complete.

## Related Topics

- [Debugging scenarios](debugging-scenarios.md)
- [System design case studies](system-design-case-studies.md)
- [C# collections overview](../csharp/collections-overview.md)
- [C# async and await](../csharp/async-await.md)
- [C# LINQ](../csharp/linq.md)
- [C# exception handling](../csharp/exception-handling.md)