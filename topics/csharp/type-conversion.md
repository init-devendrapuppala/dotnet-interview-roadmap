# Type Conversion

C# conversions may be implicit (safe under the language’s rules) or explicit (the caller acknowledges a possible loss or failure). Numeric widening is often implicit; narrowing, parsing, and many reference downcasts require explicit handling.

```csharp
long total = 42;                 // implicit int-to-long
int rounded = checked((int)total);
if (int.TryParse(input, out int parsed))
    Console.WriteLine(parsed);
```

An explicit cast can overflow, truncate, or throw depending on source/target types and checked context. Reference casts can throw `InvalidCastException`; `is` patterns and `as` (for reference/nullable targets) provide alternatives when failure is expected. `Convert` and `Parse` have different null, rounding, and culture semantics; `TryParse` is generally preferable for untrusted input.

Specify culture for user-facing or persisted numeric/date text as appropriate (`InvariantCulture` for culture-independent formats). Avoid converting through `object` when generics can preserve types and avoid boxing. Conversion design is part of validation: successful parsing does not imply the value is valid for the domain.

## Safe, explicit, and user-defined conversions
An implicit conversion is intended to be safe and unsurprising for all values in its source domain. Explicit casts signal that information may be lost or runtime validation may fail. Numeric widening can still lose precision (for example integral-to-floating conversions for sufficiently large values), while narrowing can overflow or truncate depending on context and checked behavior. Validate domain ranges before converting external input.

`Convert` methods, parsing APIs, and casts have different behaviors for null, format errors, and overflow. Prefer `TryParse` for expected invalid textual input, and specify culture for user or protocol formats deliberately. `as` returns null for an incompatible reference conversion; it does not perform numeric conversion. Pattern matching is often clearer when testing a runtime type.

User-defined implicit conversions should be rare because they can hide work or ambiguity; explicit conversion operators make intent visible when a meaningful domain transformation exists. Avoid conversions with surprising side effects. Generic APIs should use constraints and typed contracts rather than repeated `object` casts.

Interview answer: distinguish compile-time conversion applicability from runtime success, and explain precision/range and overflow. A cast does not validate that a value is semantically acceptable merely because the conversion compiles.
## Related Topics

- [data-types.md](data-types.md)
- [operators.md](operators.md)
- [boxing-and-unboxing.md](boxing-and-unboxing.md)
- [enums.md](enums.md)