# Strings

`string` is an immutable reference type representing UTF-16 code units. Operations that appear to modify a string create a new string value; assignments copy references, not character buffers.

```csharp
string user = "Ada";
string greeting = $"Hello, {user}";
```

Immutability makes strings safe to share, but repeated concatenation in a loop can allocate many intermediate strings. Use `StringBuilder` for incremental construction when measurement or scale warrants it. For parsing, `ReadOnlySpan<char>` can inspect slices without allocating substrings. String indexing and `.Length` operate on UTF-16 code units, not Unicode grapheme clusters; user-perceived characters may span multiple code points.

Choose comparison semantics explicitly: ordinal comparison is usually right for identifiers and protocol tokens; culture-aware comparison is for human language. Normalize only according to a well-defined domain rule. Never assume a string is safe SQL, HTML, shell, or log content—use parameterization and context-appropriate encoding.

## Immutability, comparison, and text handling
`string` is an immutable reference type. Operations that appear to modify text produce a new string, and repeated concatenation can allocate intermediate results. Use interpolation for readable formatting and `StringBuilder` for many incremental appends after profiling. For parsing, `ReadOnlySpan<char>` can inspect slices without allocating substrings.

Comparison semantics matter. Use `StringComparison.Ordinal` or `OrdinalIgnoreCase` for identifiers, protocol tokens, and culture-independent keys; use culture-aware comparison for user-facing linguistic sorting/search when appropriate. Dictionary keys should use a comparer that matches the domain. Do not lowercase strings merely to compare case-insensitively; casing rules can be culture-sensitive and create extra allocations.

Strings are UTF-16 sequences, not necessarily one code unit per user-perceived character. Surrogate pairs and combining marks mean `Length` counts UTF-16 code units, not grapheme clusters. Use text-element-aware APIs when UI behavior requires grapheme semantics. Specify encoding at I/O boundaries; a .NET string is not itself UTF-8 bytes.

String immutability does not make all operations thread-safe with respect to surrounding state or protect secrets from memory inspection. Avoid logging sensitive contents. Interview misconception: string interning is not a general guarantee that equal strings share identity; use value comparison, not reference equality.
## Related Topics

- [stringbuilder.md](stringbuilder.md)
- [span-and-memory.md](span-and-memory.md)
- [null-handling.md](null-handling.md)
- [serialization.md](serialization.md)