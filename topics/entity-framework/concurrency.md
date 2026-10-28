# Optimistic concurrency

Optimistic concurrency assumes conflicts are uncommon and detects a competing update when saving, rather than locking a row for the whole user interaction. It matters when two users read the same value and both try to make decisions from it. A normal `SaveChanges` is not automatically a business-level concurrency check unless the model includes a concurrency token.

## Concurrency tokens

Configure a property as a token so EF includes its original value in the update/delete predicate. If another transaction changed the token, no row matches and EF throws `DbUpdateConcurrencyException`.

```csharp
public sealed class Document
{
    public int Id { get; set; }
    public string Body { get; set; } = "";
    public byte[] Version { get; set; } = [];
}

protected override void OnModelCreating(ModelBuilder modelBuilder) =>
    modelBuilder.Entity<Document>()
        .Property(d => d.Version)
        .IsRowVersion();
```

`IsRowVersion` is provider-specific in effect; SQL Server commonly maps this to its database-generated `rowversion`. For providers without that facility, an application-managed token (for example a GUID) can be configured with `IsConcurrencyToken()` and updated on each write. Generate/update the token consistently.

## Handling a conflict

Do not treat every conflict as a transient error to retry blindly. Decide whether to reject and ask the user to refresh, merge selected fields, or retry a domain operation against newly loaded state. A simplified reload-and-retry policy:

```csharp
try
{
    await db.SaveChangesAsync(cancellationToken);
}
catch (DbUpdateConcurrencyException)
{
    foreach (var entry in db.ChangeTracker.Entries<Document>())
        await entry.ReloadAsync(cancellationToken);

    throw; // Surface conflict; caller chooses an explicit merge/retry policy.
}
```

Reloading overwrites local current values, so preserve intended edits first if implementing a merge. The example deliberately surfaces the conflict instead of silently resubmitting stale data.

For an application-managed token, the database predicate should include the original token and the update must set a new token. Ensure a unique row count expectation. In disconnected APIs, include a token/ETag in the client contract when clients may edit stale representations.

## Concurrency versus transactions

Transactions provide atomicity/isolation for a group of database commands; a concurrency token detects stale writes to particular rows. They solve different problems. A transaction held during a user's think time is generally a poor design. For cross-service workflows, a database transaction cannot by itself make remote effects atomic.

## API contract implication

For HTTP APIs, expose the version as an ETag or explicit token and require it on updates. A `409 Conflict` or `412 Precondition Failed` is usually more honest than silently applying a stale overwrite. Authorization and validation must run again when resolving a conflict; reusing an old DTO blindly is an overposting risk.

## Related Topics

- [Transactions](transactions.md)
- [Tracking and change detection](change-tracker.md)
- [DbContext](dbcontext.md)
- [SQL isolation levels](../sql/isolation-levels.md)
- [SQL locking](../sql/locking.md)
