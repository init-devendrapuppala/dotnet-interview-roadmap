# Anonymous Methods

An anonymous method is an inline delegate expression introduced with the `delegate` keyword. It can capture variables from its enclosing scope, but modern code usually uses a lambda for the same purpose.

```csharp
Func<int, int> addOffset = delegate (int value)
{
    return value + 3;
};

Console.WriteLine(addOffset(4)); // 7
```

Anonymous methods can omit a parameter list when the delegate’s parameters are unused, a capability not generally available with an ordinary lambda parameter list. Both forms create delegate instances and can close over local variables. Captured variables live as long as the closure needs them, which can extend object lifetimes; capture a value intentionally rather than assuming a snapshot.

Use the form most readable in context. Lambdas integrate better with expression trees and modern APIs. Avoid using either form to obscure control flow in long callbacks; extract named methods when behavior deserves independent testing or reuse.

## Closures, lifetime, and alternatives
A delegate created from an anonymous method may capture an outer local. The closure captures the variable, not a snapshot of its current value, so later changes can affect callback behavior. A retained delegate can also keep captured objects—and possibly a larger object graph—alive longer than expected.

```csharp
int threshold = 10;
Predicate<int> isLarge = delegate (int value) { return value > threshold; };
threshold = 20;
Console.WriteLine(isLarge(15)); // False: it reads the captured variable.
```

This matters in loops and long-lived subscriptions. Copy a value to a local if a snapshot is intended, and avoid capturing `this` in a callback stored by a longer-lived service unless that lifetime is deliberate. Keep callbacks short; extract a named method when behavior deserves independent testing or reuse.

Lambdas are the usual modern spelling and can be converted to expression trees when an API asks for `Expression<TDelegate>`; anonymous methods have the niche ability to omit a parameter list when parameters are unused. Both forms produce delegate-compatible behavior and neither implies asynchronous or parallel execution. Interview answers should mention delegate typing and closure lifetime, not treat anonymous syntax as a separate runtime execution model.
## Related Topics

- [delegates.md](delegates.md)
- [lambda-expressions.md](lambda-expressions.md)
- [events.md](events.md)