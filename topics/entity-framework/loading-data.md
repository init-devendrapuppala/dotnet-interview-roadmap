# Loading related data

EF Core can load related data as part of the original query, in a later explicit query, or (when configured) through lazy-loading proxies. The choice affects round trips, result size, object lifetime, and consistency. A navigation property alone does not mean the related rows were fetched.

## Eager loading

`Include` and `ThenInclude` request related entities in the query:

```csharp
var order = await db.Orders
    .Include(o => o.Lines)
        .ThenInclude(line => line.Product)
    .SingleAsync(o => o.Id == orderId, cancellationToken);
```

For tracked entities, relationship fix-up connects entities already loaded into the context, but fix-up is not a promise to load missing data. Including multiple collection navigations in one SQL query can multiply rows (cartesian expansion). `AsSplitQuery()` may reduce duplication by using multiple commands; it adds round trips and can observe changes between commands absent a suitable transaction/isolation level. Compare actual plans and payload sizes.

## Explicit and lazy loading

Explicit loading makes the database call visible and conditional:

```csharp
var order = await db.Orders.SingleAsync(o => o.Id == orderId, cancellationToken);
await db.Entry(order).Collection(o => o.Lines).LoadAsync(cancellationToken);
```

Lazy loading is not automatic by default. It requires configured proxies with virtual navigations or another supported lazy-loading mechanism. It can hide I/O behind property access and create N+1 round trips, so it is often disabled for APIs and performance-sensitive paths. If used, define and test where navigation access is allowed.

## Select a result shape intentionally

For a read-only screen, projection can avoid loading full entities and irrelevant columns:

```csharp
var details = await db.Orders
    .Where(o => o.Id == orderId)
    .Select(o => new OrderDetails(
        o.Id,
        o.Customer.Name,
        o.Lines.Select(line => new OrderLineDetails(
            line.Product.Name, line.Quantity)).ToList()))
    .SingleAsync(cancellationToken);
```

Nested collection projection translation depends on provider/version and query shape; inspect generated SQL and test against the production provider. Use entity graphs when entity behavior and updates are required, not simply as a default for every read.

## Common pitfalls

- Returning tracked entities from a context that is already tracking the same keys may yield existing in-memory values.
- Serializing entities with lazy loading can trigger database access during serialization and may traverse cycles.
- A collection `Include` does not guarantee efficient pagination over the parent/child shape; paginate parents and design the returned children explicitly.
- Loading related data in separate commands can create a consistency window.

## Consistency and boundaries

Choose an aggregate/read boundary before choosing `Include`. A single graph query can be correct but too large; several queries can be cheaper but observe different points in time. For APIs, return a purpose-built DTO and make command count a testable performance property on important endpoints.

## Related Topics

- [Relationships](relationships.md)
- [Query performance](query-performance.md)
- [Tracking and change detection](change-tracker.md)
- [DbContext](dbcontext.md)
