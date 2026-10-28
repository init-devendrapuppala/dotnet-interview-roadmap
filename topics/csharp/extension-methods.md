# Extension Methods

An extension method is a static method called with instance-method syntax. It must be declared in a non-nested static class, and its first parameter uses `this`.

```csharp
public static class StringExtensions
{
    public static bool HasText(this string? value) =>
        !string.IsNullOrWhiteSpace(value);
}
```

Extension methods do not add members to the extended type. The compiler resolves them at compile time based on namespaces in scope; an applicable real instance member takes precedence. They cannot access private state unless that state is exposed through the public contract.

Use extensions for cohesive, stateless operations that naturally belong to a type or interface. Avoid broad, ambiguous namespaces and surprising names that imitate built-in members. Since extension syntax can hide the static call, consider discoverability, null behavior, and whether the operation should instead be a method on a type you own.

## API scope and resolution
An extension method is a static method called with instance-style syntax. It does not modify the target type, access its private members, or participate as a virtual override. The compiler resolves extension candidates based on namespaces in scope and applicable static classes; an actual instance member generally takes precedence. Adding a namespace can therefore affect overload resolution, so avoid broad extension namespaces that create ambiguous APIs.

```csharp
public static class StringExtensions
{
    public static bool IsNullOrBlank(this string? value) =>
        string.IsNullOrWhiteSpace(value);
}
```

Keep extensions cohesive, discoverable, and behaviorally unsurprising. Prefer a normal helper when the operation is not naturally associated with the receiver or when extension syntax would conceal expensive work. Extension methods can target interfaces, making them useful for operations shared by many implementations, but should not imitate missing framework members in a way that risks collisions later.

Modern C# extension blocks offer additional syntax in recent language versions, but the longstanding static extension-method model is widely supported. Verify language version and target framework before using newer syntax. Extension methods are resolved at compile time, unlike dynamically bound members, and are not a substitute for polymorphism where behavior must vary by runtime subtype.

Interview trap: an extension method cannot access private fields and does not add a method to the type's runtime metadata. It is syntax over a static method.
## Related Topics

- [methods.md](methods.md)
- [interfaces.md](interfaces.md)
- [linq.md](linq.md)
- [generics.md](generics.md)