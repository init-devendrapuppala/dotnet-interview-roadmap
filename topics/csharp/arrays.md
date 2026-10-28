# Arrays

An array is a fixed-length, zero-based sequence whose elements all have the same type. The array object has a fixed number of slots after creation, though reference-type elements can point to mutable objects.

```csharp
string[] names = ["Ada", "Grace"]; // C# 12 collection expression
names[0] = "Katherine";
Console.WriteLine(names.Length); // 2
```

Arrays provide constant-time indexed access and are contiguous in the managed representation for efficient traversal. They are reference types; assigning an array variable copies the reference, so both variables see element changes. Multidimensional rectangular arrays and jagged arrays (`T[][]`) have different layouts and access patterns. Jagged arrays allow rows of varying length.

An array cannot grow. Use `List<T>` when size changes are needed, or `Span<T>`/`Memory<T>` when APIs need a view over a contiguous region without copying. Avoid repeatedly allocating temporary arrays in hot paths without measuring; pooling can help large reusable buffers but adds ownership and return-to-pool obligations.

## Bounds, layout, and API choices
Array length is fixed after allocation, while elements may be reassigned. Indexing is bounds checked and an invalid index throws `IndexOutOfRangeException`. For reference-type arrays, slots hold references; assigning an array variable copies the reference, not the elements. Rectangular `T[,]` arrays have a single rectangular shape, while jagged `T[][]` contains independent arrays that may vary in length or be null.

Arrays are useful for known-size buffers and interop. A `Span<T>` slice is a view over existing storage; calling `ToArray()` copies. C# 12 collection expressions such as `[1, 2, 3]` are target-typed syntax, and the target determines the resulting collection—it does not promise identical allocation behavior for every target.

Reference-type arrays are covariant: a `string[]` may be viewed as `object[]`, but storing a non-string then fails at runtime with `ArrayTypeMismatchException`. Mutable generic collections are invariant and avoid this particular hazard. Use `List<T>` when size changes; use spans for synchronous borrowed slices and `Memory<T>` when a view must be stored across async boundaries. Pooling can reduce repeated large allocations but creates ownership, clearing, and return obligations. Measure before optimizing ordinary array use.
## Related Topics

- [list.md](list.md)
- [collections-overview.md](collections-overview.md)
- [span-and-memory.md](span-and-memory.md)
- [value-types-vs-reference-types.md](value-types-vs-reference-types.md)