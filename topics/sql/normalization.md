# Normalization

Normalization is a way of structuring relational facts so that each fact has a clear place, dependencies are represented correctly, and insert, update, and delete anomalies are reduced. It is not a goal of minimizing the number of repeated characters or mechanically creating one table for every noun. Start from the business dependencies: which attributes identify an entity, which facts depend on which keys, and which facts change together?

### Functional dependencies and normal forms

A functional dependency `A -> B` means that, in the modeled domain, a value of `A` determines exactly one value of `B`. Candidate keys are minimal attributes that identify a row; the primary key is one selected candidate key. The traditional forms build on these ideas:

- **First normal form (1NF):** each cell contains one value from its domain and rows are distinguishable. “Atomic” is domain-relative: a full address may be one value for one application but several independently queried facts for another. Do not store comma-separated child values when they need separate constraints, joins, or updates.
- **Second normal form (2NF):** in 1NF, each non-key attribute depends on the whole of every candidate key, not just a proper subset of a composite key. If `(OrderId, ProductId)` identifies an order line, `ProductName` depends on `ProductId`, not on the full line key.
- **Third normal form (3NF):** in 2NF, non-key attributes do not depend transitively on a candidate key through another non-key attribute. If `EmployeeId -> DepartmentId` and `DepartmentId -> DepartmentName`, the department name is a department fact, not an independent employee fact.
- **Boyce–Codd normal form (BCNF):** every determinant of a nontrivial functional dependency is a candidate key. BCNF addresses some dependency patterns that 3NF permits, though decomposition and dependency preservation still matter.

The practical test is whether one change to a real-world fact requires changing multiple rows. Repeating customer name on every order can cause inconsistent names, require updating all historical rows, or make it impossible to record a customer before an order exists. A `Customers` relation with `Orders.CustomerId` represents the dependency once. A foreign key enforces that referenced customers exist; it does not itself enforce every business rule or create an index on the referencing column in SQL Server.

### Keys, constraints, and SQL Server considerations

Choose primary and alternate keys deliberately. A surrogate key can simplify references, but it does not replace a unique constraint on a real business identifier. Use `NOT NULL`, `UNIQUE`, `CHECK`, and foreign-key constraints to encode rules at the database boundary, where concurrent application instances cannot bypass them accidentally. SQL Server does not automatically index foreign-key columns. Index them when joins, parent deletes, or child updates need it; every index also adds write and storage cost.

NULL means unknown or absent, not a regular value. SQL Server's unique-index behavior permits only one identical NULL key combination in a single-column unique index; for multiple columns, uniqueness applies to the complete key combination. Filtered unique indexes may be appropriate when only known values need uniqueness, but design and test the exact predicate. Required attributes should usually be `NOT NULL` rather than relying on application validation.

Type choice is part of the model. Fixed-scale amounts should use an appropriate `decimal(p,s)`, not approximate floating point; dates should use a date/time type rather than formatted text. Constraints and types prevent invalid states and can aid optimizer reasoning, but they must match domain semantics.

### Denormalization and production tradeoffs

Normalization may require joins, but joins are not inherently expensive or evidence of bad design. SQL Server can join indexed relations efficiently, and duplicated data also costs writes, storage, cache, and consistency checks. Denormalize only to address a measured workload or architectural need, such as a summary table, reporting snapshot, or intentionally duplicated read model. Identify a source of truth, update strategy, staleness tolerance, reconciliation, and failure recovery. A cache or materialized projection often has different freshness semantics from normalized transactional tables.

Do not split a fact across tables if the split breaks atomic updates or makes constraints impossible to express. Conversely, do not use a single wide table with repeated groups just to avoid joins. In interviews, give a concrete functional dependency and anomaly rather than reciting form names. Normalization theory applies across relational engines, but implementation details—NULL uniqueness, constraints, indexes, and optimizer behavior—are vendor-specific.

## Related Topics

- [Joins](joins.md)
- [Indexes](indexes.md)
- [Transactions](transactions.md)
- [Performance tuning](performance-tuning.md)