# Enums

An enum defines a named set of constants backed by an integral type (by default, `int`). It improves readability and constrains intent, but values can still be cast from arbitrary integers at runtime.

```csharp
public enum JobState : byte
{
    Pending = 1,
    Running = 2,
    Finished = 3
}
```

Use explicit numeric values when values are serialized, persisted, or part of a public contract; do not casually reorder or renumber them. An enum defaults to zero, so consider defining a meaningful `Unknown`/`None` zero member. Validate data from external sources, since a cast such as `(JobState)255` is possible.

`[Flags]` enums represent bit fields and should use distinct powers of two; combine/test them with bitwise operators or `HasFlag` (the latter may have overhead depending on runtime). Avoid flag combinations when states are mutually exclusive. Adding enum values can affect exhaustive switches and consumers that assume only known values.

## Underlying values, flags, and compatibility
An enum is a distinct value type with named constants and an integral underlying type (default `int`). Its values are not automatically restricted to the declared names: casts, deserialization, or corrupted data can produce an unnamed numeric value. Validate external numeric input when only defined values are allowed. Changing or reusing numeric values in a persisted or public contract can break compatibility, so assign stable values when they cross boundaries.

Use `[Flags]` when values represent independent bit options, usually with powers of two. Combine and test with bitwise operators; use `HasFlag` only if its clarity suits the path, and note it expresses the same mask relationship as `(value & option) == option`. Zero should normally mean “no flags.” Do not apply `[Flags]` to mutually exclusive choices.

Enums improve readability and type-checking compared with arbitrary integers, but cannot carry associated per-value data. Avoid using enum ordinals as database keys unless that mapping is deliberately stable. `Enum.Parse` can throw for invalid text, while `TryParse` offers safer handling; parsing can still accept numeric strings that are not named constants, so check `Enum.IsDefined` if the contract requires named values (with care for flags combinations).

Interview misconception: an enum is not a class with singleton instances. It is a value type backed by an integral value. Use a class or discriminated-style model when alternatives require different data or behavior.
## Related Topics

- [data-types.md](data-types.md)
- [constants-and-readonly.md](constants-and-readonly.md)
- [pattern-matching.md](pattern-matching.md)
- [serialization.md](serialization.md)