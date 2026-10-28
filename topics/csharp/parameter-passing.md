# Parameter Passing

C# passes arguments by value by default. For a reference-type argument, the copied value is a reference: a method may mutate the referenced object, but reassigning its parameter does not reassign the caller’s variable.

```csharp
static void AddItem(List<int> items) => items.Add(1);
static void Replace(List<int> items) => items = [];
```

`ref` passes a variable by reference for both value and reference types; `out` requires the callee to assign it before returning; `in` passes a readonly reference (commonly useful for large structs). These modifiers impose call-site and implementation constraints; they are not general performance improvements for small values.

Use return values or result types where possible because they make data flow clearer. `params` supports a variable number of arguments and may allocate an array depending on call and compiler/runtime features. Optional arguments are baked into compiled call sites, so changing a default value does not update already compiled consumers. Avoid passing mutable state broadly when a narrower API would suffice.

## Value, reference, and alias semantics
C# passes arguments by value by default: the method receives a copy of the argument. For a value type that copy is the value; for a class it is a copy of the reference, so the callee can mutate the referenced object but cannot reassign the caller's variable. This distinction is the source of the common misconception that “reference types are passed by reference.”

`ref` passes a variable by reference so the method can read and assign the caller's storage; the caller must initialize it. `out` requires the method to assign it before returning. `in` passes a readonly reference (commonly useful for large structs), but does not guarantee zero cost or make referenced objects immutable. Use these modifiers sparingly because they complicate call sites and aliasing.

```csharp
static void Replace(ref string value) => value = "new";
static void Rename(Person person) => person.Name = "Ada";
```

The first can replace the caller's variable; the second changes the object reached through the copied reference. Async methods, iterators, and lambdas have restrictions on ref-like parameters and lifetimes; APIs using `Span<T>` must respect ref-struct constraints.

Prefer ordinary by-value parameters for clarity. Use `out` for established patterns such as `TryParse`; use `ref` only when caller storage mutation is intentional, and `in` after measuring or when API semantics clearly require readonly aliasing. Interview answers should distinguish variable assignment from object mutation.
## Related Topics

- [value-types-vs-reference-types.md](value-types-vs-reference-types.md)
- [methods.md](methods.md)
- [structs.md](structs.md)
- [arrays.md](arrays.md)