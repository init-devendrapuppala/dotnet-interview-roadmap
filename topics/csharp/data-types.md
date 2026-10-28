# C# Data Types

C# is statically typed: the compiler checks that operations are valid for the declared or inferred type. The language has value types (including structs, enums, and built-in numeric types) and reference types (classes, arrays, delegates, interfaces, and strings).

```csharp
int count = 12;
string? label = null; // With nullable reference types enabled.
var total = 19.5m;    // Inferred as decimal, not dynamic.
```

The type determines valid operations, assignment and conversion rules, default values, and semantics such as value copying versus shared object identity. It does not by itself determine whether a value is stored on the stack or heap. Nullable reference annotations are compile-time analysis; they do not create a distinct runtime type or automatically validate external input.

Use `decimal` for base-10 financial calculations when its range and performance suit the domain; use floating-point types for approximate scientific/graphics calculations. Select integer widths and signedness deliberately, and account for overflow behavior and conversions. Public API type choices are compatibility decisions.

## Choosing numeric and nullable types
Type choices affect range, precision, overflow, conversions, and public API compatibility. `int` suits many counts and indexes; `long` covers larger integral ranges. `decimal` has base-10 precision useful for many financial calculations, while `float` and `double` are approximate binary floating-point types often used for scientific, statistical, or graphics work. Choose based on domain range and rounding rules, not a blanket performance slogan.

Integral overflow throws in a checked context and wraps according to language rules in an unchecked context. The compilation context may differ, so use `checked` explicitly when overflow must be detected. Narrowing casts can lose range or precision and should reflect a validated domain constraint.

Nullable value types such as `int?` represent a value or absence. Nullable reference annotations such as `string?` inform static analysis; they do not create a distinct runtime type or validate JSON, database, or external input. Validate data at boundaries. `var` uses static inference from the initializer; it is not dynamic typing. `dynamic` delays member binding until runtime and can turn compile-time mistakes into runtime failures.

An interview answer should separate type semantics from storage: value and reference types differ in copying/identity behavior, but type category alone is not a guarantee of stack or heap placement. Public types communicate constraints to both compilers and API consumers, so conversions and nullability deserve explicit design.
## Related Topics

- [value-types-vs-reference-types.md](value-types-vs-reference-types.md)
- [type-conversion.md](type-conversion.md)
- [nullable-reference-types.md](nullable-reference-types.md)
- [enums.md](enums.md)