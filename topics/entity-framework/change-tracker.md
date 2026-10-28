# Change tracker and entity states

EF Core's change tracker maintains entity state and snapshots for a `DbContext` unit of work. `SaveChanges` uses that state to decide which database commands to issue. Understanding it prevents accidental full-graph writes and explains why context lifetime matters.

## States and identity

Tracked entities generally have one of these states:

- `Added`: insert on save.
- `Unchanged`: no detected changes.
- `Modified`: update modified properties.
- `Deleted`: delete on save.
- `Detached`: not tracked by this context.

Within a context, EF Core maintains identity resolution: one tracked instance per entity key. Querying the same key again typically returns the existing tracked instance rather than a second copy. This makes relationship fix-up coherent but can surprise code expecting a fresh database snapshot.

By default, change detection compares current values with stored original values when needed, including during `SaveChanges`. Snapshot tracking is common, but notifications and other strategies are available. Large tracked graphs add CPU and memory overhead; disabling automatic detection is an optimization that requires deliberate manual detection/marking and careful correctness testing.

## Read-only versus update work

Use no-tracking queries for read-only work to avoid populating the tracker:

```csharp
var summaries = await db.Orders
    .AsNoTracking()
    .Where(o => o.CustomerId == customerId)
    .Select(o => new OrderSummary(o.Id, o.Total))
    .ToListAsync(cancellationToken);
```

For a domain update, load and change a tracked entity, then save:

```csharp
var order = await db.Orders.SingleAsync(o => o.Id == id, cancellationToken);
order.MarkShipped();
await db.SaveChangesAsync(cancellationToken);
```

`AsNoTrackingWithIdentityResolution` can deduplicate repeated entity keys in a query result without retaining those entities in the context's normal tracker. It still incurs identity-resolution work and is not a substitute for choosing a suitable projection.

## Disconnected entities and safe updates

When an entity comes from outside the context, it is disconnected. `Attach` generally starts it as unchanged; `Update` can mark the entity and reachable graph modified, which may write more than intended. Safer API handling is usually: load the row, authorize it, map an allow-listed set of DTO fields onto it, and save. For efficient disconnected updates, set state/property flags explicitly and ensure keys and concurrency tokens are correct.

To inspect tracker behavior during debugging:

```csharp
var debugView = db.ChangeTracker.DebugView.LongView;
```

Do not keep a context alive merely to preserve tracked objects. Re-query or explicitly reload when freshness is required; tracking is a unit-of-work mechanism, not a general cache.

## Interview misconception

Tracking is neither a cache nor a default performance bug. It is useful when the unit of work needs identity resolution and persistence; it is wasteful for a projection-only read. The important design choice is context scope and query shape, verified by command counts and allocations.

## Related Topics

- [DbContext](dbcontext.md)
- [Loading related data](loading-data.md)
- [Concurrency](concurrency.md)
- [Bulk operations](bulk-operations.md)
- [EF Core overview](ef-core-overview.md)
