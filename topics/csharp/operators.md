# Operators

Operators perform arithmetic, comparison, logical, assignment, and other operations. Their precedence and associativity determine grouping, but explicit parentheses often improve readability.

```csharp
int? configuredLimit = null;
int limit = configuredLimit ?? 100;
bool eligible = account is { IsActive: true, Balance: > 0 };
```

`&&` and `||` short-circuit; `&` and `|` on booleans evaluate both operands. Integer arithmetic can overflow; in a checked context overflow throws for integral operations, while unchecked behavior wraps for many integral operations. Floating-point comparisons need care because of rounding and `NaN`.

C# permits operator overloading for selected operators, but overloaded behavior should remain intuitive and consistent with equality/hash semantics. Use `is` and pattern operators to test shape/type without unsafe casts. Avoid clever compound expressions in business logic if they obscure null behavior, evaluation order, or side effects.

## Evaluation and overload behavior
Operators such as arithmetic, comparison, logical, null-coalescing, and conditional operators have defined precedence and evaluation rules. Parenthesize non-obvious expressions rather than depending on readers to reconstruct precedence. `&&` and `||` short-circuit; `&` and `|` evaluate both operands for Boolean values and also serve bitwise operations. `??` evaluates its right side only when the left side is null, while `?:` selects one of two expressions.

User-defined operator overloads should preserve expected mathematical or domain behavior. Keep symmetry and equality consistent; overloading a familiar operator with surprising side effects makes code harder to maintain. `==` can have type-specific behavior and may differ from `ReferenceEquals`; understand the type's equality contract. Nullable lifting and conversions can affect overload resolution.

Checked arithmetic can detect integral overflow; do not assume every arithmetic operation is checked by default. Floating-point comparisons need tolerance decisions when approximate values are involved. Avoid implicit conversions that silently lose precision or create ambiguous overloads.

Interview misconception: operator overloading does not change operator precedence, and overloads do not apply to every operand type automatically. The compiler resolves a candidate based on static types and conversion rules; dynamic operands defer some binding to runtime. Use operators when they make a type's natural operations clearer, not merely to shorten syntax.
## Related Topics

- [pattern-matching.md](pattern-matching.md)
- [type-conversion.md](type-conversion.md)
- [null-handling.md](null-handling.md)
- [data-types.md](data-types.md)