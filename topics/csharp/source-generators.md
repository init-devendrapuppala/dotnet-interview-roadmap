# Source Generators

Source generators are compiler extensions that inspect a compilation and add source code during compilation. They can remove repetitive code, create serializers or registries, and provide diagnostics while preserving generated code as ordinary compiled code.

An incremental generator uses the Roslyn incremental pipeline to process inputs in stages and cache unaffected results between IDE/build updates. A generator does not rewrite user source; it contributes additional syntax trees. Generated output can be inspected in build/IDE tooling to diagnose behavior.

Generators trade runtime reflection or handwritten repetition for build-time complexity. Keep input processing deterministic, avoid depending on filesystem or machine-specific state where possible, and report actionable diagnostics for unsupported input. Generated APIs need stable naming and collision handling. Test generators with representative compilations, including malformed input and nullable contexts. Runtime availability and trimming behavior depend on emitted code; generators can improve AOT compatibility but do not guarantee it.

## Compile-time discovery and constraints
A source generator runs during compilation and can inspect syntax/semantic information to emit additional source. It can replace runtime reflection or repetitive handwritten code when the shape is knowable at build time—for example strongly typed serializers, registration tables, or logging helpers. Generated code is compiled with the project, so many errors become compile-time diagnostics rather than runtime discovery failures.

Generators should be deterministic, fast, and robust against incomplete IDE syntax while a user is typing. Report actionable diagnostics instead of throwing on invalid input. Avoid depending on unspecified file ordering or machine-local environment. Incremental generators are designed to cache work based on inputs; structure pipelines to avoid invalidating all outputs for small changes. Inspect generated files when debugging, and ensure generated names/accessibility do not collide with user code.

A generator is not the same as an analyzer: generators add source; analyzers diagnose and optionally provide fixes. Both must target supported compiler APIs and language versions. Generated code can affect build times and public API shape, so document configuration and test clean builds, IDE behavior, and packaging. For libraries, consider consumers' compiler/runtime requirements.

Interview distinction: runtime reflection discovers metadata after deployment; generation moves known work to build time but adds compiler tooling and build complexity. Source generation does not automatically make a design faster or AOT-safe unless the generated path removes the relevant dynamic behavior.
## Related Topics

- [attributes.md](attributes.md)
- [reflection.md](reflection.md)
- [generics.md](generics.md)
- [serialization.md](serialization.md)