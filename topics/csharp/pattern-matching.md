# Pattern Matching

Pattern matching tests a value’s shape and can bind parts of it. It makes type tests, null checks, and conditional extraction concise while keeping casts guarded.

```csharp
static string Describe(object? value) => value switch
{
    null => "missing",
    string { Length: 0 } => "empty text",
    string text => $"text ({text.Length})",
    int number when number > 0 => $"positive: {number}",
    _ => "other"
};
```

C# includes constant, type, relational, property, positional, list, `var`, and discard patterns, plus `and`/`or`/`not` combinators. A `switch` expression must be exhaustive according to compiler analysis; a discard arm provides a fallback but may hide newly added cases. Guards (`when`) should remain side-effect-free because evaluation order matters.

Patterns improve readability when alternatives are naturally a decision table. Avoid deeply nested patterns that make business rules hard to audit. Pattern matching does not validate untrusted data beyond the tested conditions, and nullable annotations are still compile-time analysis.

## Patterns as readable tests
Pattern matching combines a test with optional value extraction. Type, constant, relational, property, list, and positional patterns can make input validation and dispatch explicit. A `when` guard handles conditions beyond the pattern. Switch expressions are useful when every input should map to a result; use a deliberate discard arm only when unknown values really share a valid fallback. For enums or closed states, explicit arms make newly added cases easier to review.

```csharp
static string Classify(object? value) => value switch
{
    null => "missing",
    string { Length: 0 } => "empty",
    string text => $"text:{text.Length}",
    int number when number > 0 => "positive",
    _ => "other"
};
```

Property patterns do not validate nested external data beyond the checks they perform. A pattern variable is definitely assigned only in the branch where the pattern succeeds. Be careful with overlapping patterns and order: a broad earlier arm can make a later one unreachable. Pattern matching is evaluated according to language rules, but do not assume it eliminates allocations or calls property getters only once in every possible pattern arrangement; avoid side-effecting getters.

Use patterns to simplify safe type tests and state-based branching, not to cram complex business logic into one switch. Extract named predicates when they carry domain meaning. Interview misconception: pattern matching is not equivalent to dynamic dispatch or a runtime reflection scan; it is compiler-supported tests over values and types.
## Related Topics

- [control-flow.md](control-flow.md)
- [enums.md](enums.md)
- [null-handling.md](null-handling.md)
- [records.md](records.md)