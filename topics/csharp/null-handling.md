# Null Handling

`null` means a reference does not refer to an object (and is also available for nullable value types). Treat nullability as an API contract: decide whether null is allowed, validate at boundaries, and use flow-aware syntax to express intent.

```csharp
string? input = ReadInput();
string display = input ?? "(none)";
int length = input?.Length ?? 0;
```

The null-conditional operator (`?.`) short-circuits member access; `??` supplies a fallback; `??=` assigns only if the left side is null. The null-forgiving operator (`!`) suppresses compiler warnings but performs no runtime check, so it should be backed by a real invariant. Dereferencing null otherwise throws `NullReferenceException`.

Do not catch `NullReferenceException` as normal control flow. Validate external data and method arguments at boundaries, and prefer explicit result types when “not found” is a meaningful outcome. Nullable reference types improve static analysis but do not prevent null values from reflection, deserialization, interop, or older code.

## Expressing absence safely
Null can mean missing, unknown, not applicable, or an optional relationship; distinguish these meanings in the API instead of relying on accidental `NullReferenceException`. With nullable reference types enabled, `T?` tells the compiler that absence is possible and `T` communicates a non-null intent. These annotations are static analysis, not runtime checks, so validate data from external sources, deserialization, database columns, or legacy code.

Use `?.` for safe member access, `??` to provide a deliberate default, and `??=` for lazy assignment when mutating state is intended. A null-forgiving `!` silences analysis only; it does not check or change the value. Overuse can turn a useful warning into a runtime failure. Prefer guard clauses and boundary validation when null would violate an invariant.

Choose return shape carefully: nullable return for one optional value, empty collection for “zero results,” and a result type when success/failure needs richer explanation. Do not return `null` and an empty collection interchangeably unless callers have defined semantics. Optional parameters are not always equivalent to nullable values: one is call-site omission, the other is a runtime value state.

Avoid null checks scattered across every internal method by establishing invariants at object/API boundaries. For collections of nullable items, annotate element nullability (`IEnumerable<string?>`) separately from whether the collection itself may be null. Interview misconception: nullable reference types do not change CLR runtime representation or prevent null from arriving.
## Related Topics

- [nullable-reference-types.md](nullable-reference-types.md)
- [exception-handling.md](exception-handling.md)
- [pattern-matching.md](pattern-matching.md)
- [properties.md](properties.md)