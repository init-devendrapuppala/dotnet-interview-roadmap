# DbContext: scope, lifetime, and unit of work

`DbContext` is EF Core's short-lived unit-of-work coordinator. It holds the model and database services, tracks entities when requested, coordinates identity resolution, and persists pending changes. It is not a connection-permanent session and is **not thread-safe**.

## Choose a lifetime that matches the work

In ASP.NET Core, `AddDbContext<TContext>` registers a scoped context by default, commonly one per request. A request can query and save through the same unit of work. For a hosted service, create a scope or use `IDbContextFactory<TContext>` so each job/operation gets its own context. Do not capture a request-scoped context in a singleton.

```csharp
services.AddDbContext<OrdersContext>(options =>
    options.UseSqlServer(configuration.GetConnectionString("Orders")));

// For background work:
services.AddDbContextFactory<OrdersContext>(options =>
    options.UseSqlServer(configuration.GetConnectionString("Orders")));
```

The options registration is provider-specific; use the provider and connection configuration appropriate to the application. In factory-based code, dispose the created context:

```csharp
await using var db = await factory.CreateDbContextAsync(cancellationToken);
var order = await db.Orders.SingleAsync(o => o.Id == orderId, cancellationToken);
order.MarkPaid();
await db.SaveChangesAsync(cancellationToken);
```

## Why short-lived matters

A context retains tracked entities and original values. Reusing one for a long time can grow memory, keep stale state, make identity conflicts more likely, and blur transaction boundaries. Disposing a context releases its resources; it does not itself commit a transaction. A context can be reused for a small sequence of related operations, but each unit of work should have an explicit start and end.

Never execute concurrent operations on one context, for example `Task.WhenAll` over two queries using the same instance. Use sequential operations or separate contexts when truly independent work can safely run concurrently. Separate contexts also mean separate identity maps and usually separate transactions.

## Change tracking and context reuse

A tracking query returns an entity already tracked with the same key when one exists. It does not necessarily overwrite that tracked entity's current/original values with the newest database values. For current values, reload explicitly or use a fresh context. `AsNoTracking` is useful for read-only results; it does not change the context's thread-safety rules.

For disconnected updates (for example, an HTTP DTO), load the current row and apply allowed changes, or attach a carefully constructed entity and mark only intended properties modified. Blindly calling `Update` on an incoming graph can mark many properties and related entities modified, risking overposting and unintended writes.

## Testing and design

Prefer tests against the production database provider for translation, constraints, and transaction behavior. EF Core's in-memory provider is not relational and does not behave like SQL Server; SQLite in-memory is closer for some tests but still differs from the production provider. Keep context construction injectable and avoid static/global contexts.

## Pooling note

`AddDbContextPool` can reduce context setup cost, but pooling reuses context instances after EF resets its state. Do not store request-specific state on the context or assume external driver/session state is reset. Measure before enabling it, and keep tenant/user data outside pooled context instance fields.

## Related Topics

- [EF Core overview](ef-core-overview.md)
- [Tracking and change detection](change-tracker.md)
- [Transactions](transactions.md)
- [Loading related data](loading-data.md)
- [Async and await](../csharp/async-await.md)
