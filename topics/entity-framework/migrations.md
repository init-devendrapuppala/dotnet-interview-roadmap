# EF Core migrations and schema deployment

Migrations record model changes as ordered schema operations. They help evolve a database with application code, but they are not a substitute for reviewing deployment risk. A migration is generated from the current model compared with the model snapshot; generation can miss intent, especially for renames and data transformations.

## Development workflow

Typical commands (replace `App` with the project containing the context and startup configuration):

```powershell
dotnet ef migrations add AddOrderStatus --project .\src\App\App.csproj --startup-project .\src\App\App.csproj
dotnet ef migrations script --project .\src\App\App.csproj --startup-project .\src\App\App.csproj
```

Review the migration and generated SQL. A rename may be scaffolded as drop-and-add, which can lose data; use an explicit rename operation when appropriate. For a populated table, plan backfills, defaults, nullability transitions, index creation, and deployment sequencing. Changes that lock a large table need a provider-specific rollout strategy.

## Production deployment

Prefer deploying reviewed SQL scripts or an appropriate migration bundle through the release process rather than having every application instance mutate production schema at startup. This separates permissions and timing, supports approval/auditing, and reduces races between instances. EF tooling/runtime options and provider capabilities vary by version; validate the exact approach in CI and staging.

A common safe sequence for an incompatible change is expand-and-contract: add a backward-compatible column/schema, deploy code that can work during transition, backfill, switch reads/writes, and remove obsolete schema only after old code is gone. Keep migrations ordered and apply each once; coordinate deployment tooling so multiple instances do not race.

## Model and database drift

The model snapshot represents the last migration's model, not an always-live reflection of production. Validate the schema separately and keep the migration assembly, provider, and application model aligned. Never edit an already-applied migration casually; add a forward migration to correct deployed state. Seed data APIs are suited to model-managed reference data, not arbitrary business data lifecycle.

## Operational checks

Back up and rehearse recovery for consequential schema changes. Measure migration duration and locks against production-like data, make application and schema versions compatible during rollout, and retain a clear rollback/forward-fix procedure. A migration that succeeds on an empty database has not proven its production safety.

## Related Topics

- [Entity configuration](entity-configuration.md)
- [Relationships](relationships.md)
- [Transactions](transactions.md)
- [SQL indexes](../sql/indexes.md)
