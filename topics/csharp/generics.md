# Generics

Generics parameterize types and methods while retaining compile-time type safety. They avoid object casts and commonly avoid boxing for value types compared with object-based APIs.

```csharp
static T FirstOrDefault<T>(IReadOnlyList<T> items, T fallback) =>
    items.Count == 0 ? fallback : items[0];
```

Constraints express requirements: `where T : class`, `struct`, `notnull`, `new()`, a base class, or an interface. Constraints improve API guarantees but should be no stronger than required. Generic variance (`out` covariance and `in` contravariance) applies to interfaces and delegates under specific reference-type rules, not arbitrary mutable generic classes.

The CLR uses reified generic types. Runtime/JIT implementation may share generated code for some reference-type instantiations and specialize value-type instantiations; exact code sharing is an implementation detail. Avoid assuming generics always eliminate all allocation or cost. They provide type-safe abstractions; boxing can still occur at interface/object boundaries.

## Constraints, variance, and runtime model
A constraint documents and enforces the operations a generic implementation needs. Examples include `where T : IDisposable` to call `Dispose`, `where T : class` or `struct` for category-specific behavior, `notnull` for static nullability intent, `new()` for a public parameterless constructor, and interface/base constraints. Add only necessary constraints: they reduce which types callers can use. Constraints do not create a runtime validation mechanism for nullable external data.

Variance is supported on generic interfaces and delegates with `out` (producer/covariant) or `in` (consumer/contravariant), subject to safe-position rules and reference-type conversions. A mutable `IList<T>` cannot be covariant because a caller could insert the wrong derived value. Generic classes are not declared variant. `IEnumerable<string>` can be used as `IEnumerable<object>`, but `List<string>` cannot be treated as `List<object>`.

The CLR retains generic type information (reified generics), enabling runtime type safety and reflection over constructed types. JIT code sharing and specialization strategies vary by runtime and type argument; they are implementation details, so do not claim every instantiation gets its own machine code or every generic call is allocation-free. Generics avoid object casts and often boxing for value types, but boxing can still happen at object/interface boundaries or in APIs that require it.

Design reusable methods and containers around the smallest type contract needed. Prefer constraints over `typeof(T)` branches and `dynamic` when possible. Avoid exposing generic abstractions with constraints clients cannot satisfy. Tests should include reference and value types if both are supported, plus boundary cases such as nullability and comparer behavior.
## Practical API design and pitfalls
Generic APIs work best when their type parameter represents a real relationship between inputs and outputs. A generic `Map<TSource, TResult>` says output type varies with source and selector; a method with a type parameter used only once may not provide meaningful reuse. Constraints should make required operations available without over-constraining callers. For example, prefer a comparer parameter over requiring `T : IComparable<T>` if callers need custom ordering.

Generic static fields are associated with each closed constructed type: `Cache<string>` and `Cache<int>` have distinct static state. This can be useful for typed caches but can surprise when designing global counters or registries. Reflection can inspect constructed generic types, but open generic definitions (such as `List<>`) are not instantiable until type arguments are supplied.

Avoid using `default(T)` to mean “not found” when that value can be valid (zero, false, or null); use `Try` patterns or a result type. Nullable annotations for unconstrained generic parameters require careful interpretation. `where T : notnull` constrains static nullability intent, whereas runtime data can still violate assumptions.

A sound interview example explains why a generic implementation is safer than `object`: compile-time validation, fewer casts, and often no boxing at value-type use sites. It should also acknowledge costs: a generic abstraction can be over-generalized, constraints shape the API, and runtime code sharing/specialization is an implementation choice rather than a language promise. Benchmark allocations across actual call boundaries when performance matters.
Generic APIs should also account for variance and nullability in their tests. Covariant outputs are useful for read-only producers; contravariant inputs are useful for consumers such as comparers and handlers. Do not mark an interface variant if callers can mutate values through it. Test API usage with derived/reference types and structs where supported, and ensure default values do not collide with “missing” sentinels. Source generators and serializers may need explicit handling of closed generic types, particularly when trimming limits runtime discovery.
## Related Topics

- [collections-overview.md](collections-overview.md)
- [interfaces.md](interfaces.md)
- [delegates.md](delegates.md)
- [boxing-and-unboxing.md](boxing-and-unboxing.md)