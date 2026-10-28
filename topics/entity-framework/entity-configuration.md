# Entity and model configuration

EF Core's model determines how CLR types map to tables, keys, columns, relationships, and database behavior. The model is assembled from conventions, attributes, and Fluent API configuration. Conventions are convenient; explicit configuration is important when a mapping affects schema, data integrity, query plans, or domain semantics.

## Prefer explicit constraints for important invariants

Configure primary/alternate keys, required properties, lengths, precision, indexes, and relationships according to the actual database contract. For example:

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Product>(entity =>
    {
        entity.HasKey(p => p.Id);
        entity.Property(p => p.Name).HasMaxLength(200).IsRequired();
        entity.Property(p => p.Price).HasPrecision(18, 2);
        entity.HasIndex(p => p.Sku).IsUnique();
    });
}
```

The provider maps precision and other facets to database-specific types/DDL. A unique index enforces uniqueness against concurrent writers, unlike application-only validation. Validate the generated migration and actual schema.

Use `IEntityTypeConfiguration<T>` classes to keep large models organized and apply them with `ApplyConfigurationsFromAssembly` when appropriate. Keep configuration discoverable; broad assembly scanning should not accidentally pick up unrelated configuration types.

## Nullability and conversions

CLR nullability, nullable reference type annotations, EF requiredness, and database nullability should agree. Enabling nullable reference types in an existing project can change inferred requiredness and produce migrations; review rather than applying a mass schema change blindly.

Value converters map a model value to a provider value, useful for enums or small value objects. A converter does not automatically provide every database capability—comparison, ordering, query translation, and index semantics depend on representation/provider. Choose a stable persisted representation and test queries using it.

## Keys and inheritance

Keys should be stable and unique. Generated key strategy and schema types are provider-dependent. EF Core supports multiple inheritance mapping strategies with different table/query/join costs; select based on schema and workload rather than class hierarchy aesthetics. Verify SQL and migrations for the chosen strategy.

Avoid treating configuration as only a schema concern: table/column mapping and converters influence translation and materialization. Model changes are typically delivered through reviewed migrations and integration tests.

## Model review

Review generated migrations and representative SQL whenever mapping changes. Conventions are productive, but explicit constraints, lengths, precision, indexes, and delete behavior document production invariants better than relying on a provider default.

## Related Topics

- [Relationships](relationships.md)
- [Migrations](migrations.md)
- [Query performance](query-performance.md)
- [EF Core overview](ef-core-overview.md)
