# `dynamic`

`dynamic` defers member binding and many operations from compile time to runtime. The compiler emits dynamic call-site behavior; the runtime binder resolves members using the actual value and throws runtime exceptions if the operation is invalid.

```csharp
dynamic value = "hello";
Console.WriteLine(value.Length); // Bound at runtime.
```

This differs from `var`: `var` is statically inferred at compile time, while `dynamic` opts out of much compile-time member checking. `dynamic` does not mean “any type” in a type-safe way, and it does not make an object mutable or convert it to another type automatically. It can be useful for COM interop or genuinely dynamic data, but sacrifices refactoring support and moves failures to runtime.

Prefer typed DTOs, generics, pattern matching, or `System.Text.Json` nodes when practical. If dynamic data is unavoidable, validate shape at the boundary, isolate dynamic access, and convert to typed values before core business logic. Benchmark if used in a hot path.

## Runtime binding and when to avoid it
`dynamic` tells the compiler to defer member binding and overload resolution to runtime. Code using a dynamic value compiles without verifying that the member exists; a missing member or incompatible argument then throws a runtime binder exception. Dynamic operations can be useful at boundaries with genuinely dynamic schemas, COM interop, or scripting, but lose refactoring support and compile-time guarantees.

The runtime binder typically relies on runtime type information and performs dynamic dispatch; this is distinct from `var`, which infers a static compile-time type. `dynamic` does not mean “stored as an untyped object” in every sense, nor does it provide automatic conversion safety. A dynamic invocation may box value types or incur binder overhead; cache call sites behavior is runtime implementation detail rather than a performance contract.

For JSON or external data, prefer a typed DTO, `JsonElement`, or explicit parsing/validation unless the shape truly cannot be known. If a third-party contract is dynamic, isolate it behind a narrow adapter and convert validated values to typed application objects early. Do not spread dynamic through core domain layers, where errors become harder to detect and tests must cover runtime binding paths.

Interview distinction: `object` requires casts or pattern matching that are checked by the compiler; `dynamic` defers those operations. `var` still has a fixed static type. Choose runtime flexibility only when it solves a real interoperability problem.
## Related Topics

- [type-conversion.md](type-conversion.md)
- [reflection.md](reflection.md)
- [system-text-json.md](system-text-json.md)
- [generics.md](generics.md)