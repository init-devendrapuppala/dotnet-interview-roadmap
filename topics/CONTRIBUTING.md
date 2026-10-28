# Contributing Topic Content

This directory is an interview-preparation knowledge base for developers with roughly four to six years of .NET experience. Contributions should help a reader reason about real implementation choices, runtime behavior, and production tradeoffs—not merely memorize definitions.

## Content guidelines

- Keep the existing directory structure and topic filenames. Link to other topics with relative Markdown links that match the files currently in the repository.
- Explain why a concept matters before showing how to use it.
- Scale the depth to the topic. Keep focused language features concise; give runtime, performance, security, and architecture topics enough context to explain behavior and tradeoffs.
- Prefer precise explanations, small diagrams, and practical examples. Code should be valid for the language and framework version stated or implied.
- Distinguish language guarantees and documented framework behavior from implementation details. Do not state uncertain claims as facts.
- Include operational concerns and common interview misconceptions where they add useful context.
- End each topic with a `## Related Topics` section containing only links to existing Markdown files.
- Avoid duplicating material that is already explained well elsewhere; add a link or explain the distinct angle instead.

## Reviewing changes

Before submitting, check that Markdown renders cleanly, code examples are internally consistent, and every relative link resolves from the file containing it. Keep changes focused on the relevant topic and preserve neighboring content.

## Related Topics

- [Topic index](README.md)
- [C# value and reference types](csharp/value-types-vs-reference-types.md)
- [ASP.NET Core request pipeline](aspnet-core/request-pipeline.md)