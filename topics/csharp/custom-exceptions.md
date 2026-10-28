# Custom Exceptions

Create a custom exception when callers can reasonably handle a distinct failure category or need structured failure data—not merely to rename an existing exception.

```csharp
public sealed class OrderNotFoundException : Exception
{
    public OrderNotFoundException(string orderId)
        : base($"Order '{orderId}' was not found.") => OrderId = orderId;

    public string OrderId { get; }
}
```

Modern exception serialization requirements differ from older .NET Framework guidance; do not add legacy serialization constructors automatically to a current .NET application. Keep exception messages useful for diagnostics, but avoid placing secrets or sensitive user data in them. Prefer standard exception types for standard failures and include an inner exception when wrapping preserves diagnostic context.

Exceptions are expensive relative to normal branching and should represent exceptional failures, not routine “not found” or validation results when those are expected. Catch only where recovery, translation, or cleanup is possible. Public libraries should document meaningful exception conditions and avoid exposing unstable implementation details.

## Exception contract and handling
Define a custom exception when callers can take a distinct action based on that failure or when domain-specific context materially improves diagnosis. Avoid one exception type per method without a semantic distinction. Choose a meaningful base category, expose stable structured data as properties when it is useful to callers, and do not place secrets or sensitive user data in messages.

When translating a lower-level failure, retain it as `InnerException`. Catch only where code can recover, add useful context, or translate to a contract-level error. `throw;` preserves the caught exception's stack; `throw ex;` resets the visible throw site. Catch-all handlers that suppress failures or return success-shaped defaults make production incidents harder to diagnose.

```csharp
try { await repository.SaveAsync(order, token); }
catch (DbException ex) { throw new OrderStoreException(order.Id, ex); }
```

If “not found” is routine, a nullable or explicit result may be clearer than an exception; if it violates a required invariant, an exception can be appropriate. Exceptions are not a substitute for ordinary branching, but performance alone does not determine API semantics. Current .NET applications should not acquire legacy serialization boilerplate by habit; add it only if the supported target and contract require it. Document meaningful public exception conditions and test types/data and recovery behavior rather than brittle message text.
## Related Topics

- [exception-handling.md](exception-handling.md)
- [methods.md](methods.md)
- [serialization.md](serialization.md)
- [null-handling.md](null-handling.md)