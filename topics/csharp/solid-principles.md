# SOLID Principles

SOLID is a set of design heuristics, not a checklist or a guarantee of good design:

- **Single Responsibility:** keep a type focused on one cohesive reason to change.
- **Open/Closed:** extend behavior without repeatedly modifying stable code, often through well-chosen abstractions.
- **Liskov Substitution:** subtypes preserve the promises callers rely on.
- **Interface Segregation:** clients should not depend on operations they do not use.
- **Dependency Inversion:** high-level policy should depend on abstractions rather than volatile low-level details.

For example, injecting an `IClock` can make time-dependent behavior testable without inheriting from the service that uses time. However, adding an interface for every class or forcing every variation point into a plugin system creates needless complexity.

Apply these principles where change, testing, or ownership shows friction. Keep abstractions aligned with stable domain concepts, and measure design by clarity and evolvability—not by the number of interfaces. In interviews, give a concrete before/after and explain tradeoffs rather than reciting definitions.

## Applying principles without ceremony
SOLID is a set of design heuristics, not compiler rules or a mandate to create interfaces everywhere. Single Responsibility asks whether a module has one coherent reason to change, not whether it has only one method. Open/Closed encourages extension without repeatedly editing stable core logic, but a switch over a small, genuinely closed set of cases may be simpler than a plugin hierarchy. Liskov Substitution is about behavioral compatibility of subtypes, not merely matching signatures.

Interface Segregation favors contracts tailored to client needs so consumers do not depend on unrelated operations. Dependency Inversion encourages high-level policy to depend on stable abstractions rather than volatile details; dependency injection is one implementation technique, not the principle itself. Abstractions should be introduced where change or testing benefits justify their maintenance cost.

Apply the principles to a concrete change scenario: what requirement changes, which module absorbs it, what contract protects callers, and what tests establish behavior? Over-applying SOLID can produce many tiny interfaces, factories, and wrappers that increase navigation and indirection. Under-applying can couple business rules directly to databases or external SDKs.

Interview misconception: SOLID does not guarantee good design and does not dictate one architecture. Use it as vocabulary to explain cohesion, substitutability, dependency direction, and the tradeoffs of a proposed design. Prefer the simplest design that can absorb likely changes without speculative frameworks.
## Related Topics

- [abstraction.md](abstraction.md)
- [interfaces.md](interfaces.md)
- [composition-vs-inheritance.md](composition-vs-inheritance.md)
- [polymorphism.md](polymorphism.md)