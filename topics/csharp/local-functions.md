# Local Functions

A local function is a named function declared inside a method or another function. It can improve readability by naming a helper whose scope should remain local.

```csharp
static IEnumerable<int> Positive(IEnumerable<int> values)
{
    return Filter(values);

    static IEnumerable<int> Filter(IEnumerable<int> source)
    {
        foreach (int value in source)
            if (value > 0) yield return value;
    }
}
```

Local functions can be static (no capture) or capture enclosing variables. Unlike a lambda assigned to a delegate, a local function is directly callable by name and can be recursive. Iterator and async local functions are supported; as with other iterators/async methods, execution and exceptions may be deferred until enumeration or awaiting.

Choose a local function over a lambda when a helper needs a name, multiple statements, recursion, or a clear local declaration. Use `static` when no capture is intended. Do not bury substantial business logic inside a method merely to avoid creating a separate type.

## Scope and capture behavior
A local function is declared inside a method and can be called within that lexical scope. It can be static (when supported) to prevent capturing local variables or `this`. Local functions are useful for naming a private step near its only caller, sharing logic among branches, and expressing recursive helpers without adding a type-level member.

Local functions can be recursive and can be iterators or async methods. Unlike a lambda assigned to a delegate, a local function can often be called directly without needing to create a delegate; converting it to a delegate can still allocate depending on capture and runtime optimization. Captured state extends lifetime in ways similar to closures, so static local functions can make non-capture explicit.

Use a private method when behavior is reused across methods, needs independent access/testing, or deserves a stable type-level API. Avoid deeply nested helpers that make control flow harder to follow. Local functions can be declared after their call site, which helps keep guard logic near the main flow, but excessive forward references can hinder readability.

Interview distinction: a local function is a named function scoped within another member; a lambda is an expression typically converted to a delegate or expression tree. Choose based on naming, recursion, capture, and target requirements rather than presumed performance.
## Related Topics

- [methods.md](methods.md)
- [lambda-expressions.md](lambda-expressions.md)
- [ienumerable.md](ienumerable.md)
- [async-await.md](async-await.md)