# Relationships and navigation mapping

EF Core relationships connect entity types through foreign keys. A relationship may have a navigation on either or both sides; navigations are an object-model convenience, while the foreign key and database constraints define relational integrity. Conventions infer common patterns, but explicit configuration improves clarity for nonstandard schemas.

## Model the foreign key and lifecycle

For a required one-to-many relationship, the dependent has a non-nullable foreign key. Configure delete behavior intentionally: cascade behavior affects database constraints and what EF does for tracked dependents, and provider/database limits vary. Avoid relying on an assumed default when deleting a principal could remove business data.

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Order>()
        .HasMany(o => o.Lines)
        .WithOne(line => line.Order)
        .HasForeignKey(line => line.OrderId)
        .IsRequired()
        .OnDelete(DeleteBehavior.Cascade);
}
```

This assumes `Order.Lines`, `OrderLine.Order`, and `OrderLine.OrderId` exist. `DeleteBehavior` options include client-side and database-side semantics; verify generated migration and actual FK behavior for the selected provider.

For optional relationships, use a nullable FK and model nullability consistently. One-to-one relationships require a unique dependent FK (or a shared key) to enforce the one-to-one constraint in the database. Many-to-many relationships can use skip navigations and an implicit join entity, or an explicit join entity when the association has payload such as quantity, role, or creation time.

## Navigations and fix-up

Navigation properties do not load related data by themselves. EF relationship fix-up connects entities already tracked with matching keys; it does not fetch missing rows. This distinction matters when interpreting null/empty navigations and serializing entities. Lazy loading requires explicit configuration and has separate performance implications.

Shadow foreign keys can be useful when the domain model should not expose an FK property, but visible FK properties often help disconnected updates and diagnostics. Choose based on domain/API needs rather than assuming one style is universally better.

## Keys, constraints, and migrations

Use stable primary keys and define uniqueness in the database for invariants such as a natural key. Application-side validation alone is subject to races. Index FK columns when query patterns and provider guidance justify them; many databases do not automatically index every FK. Migrations should be reviewed to ensure FK nullability, unique indexes, delete rules, and naming match the intended model.

Relationship changes to disconnected graphs require care: setting a navigation does not always express the desired insert/update/delete intent for every child. Load and reconcile the aggregate or explicitly set entity states based on authorized changes.

## Interview misconception

ORM cascade configuration is not a replacement for business lifecycle design. Decide what deletion means, what must be retained, and whether an operation can touch an unexpectedly large graph. Database constraints remain the final integrity backstop under concurrent writers.

## Related Topics

- [Entity configuration](entity-configuration.md)
- [Loading related data](loading-data.md)
- [Tracking and change detection](change-tracker.md)
- [Migrations](migrations.md)
