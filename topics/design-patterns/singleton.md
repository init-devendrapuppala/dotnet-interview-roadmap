# Singleton Pattern

Singleton ensures that an application uses one shared instance and provides a global access point. In modern .NET, prefer expressing the intended lifetime in dependency injection rather than implementing a hand-rolled static singleton. It solves the problem of coordinating access to a shared resource or stateful service, but the global-access part creates tight coupling and makes replacement difficult. The classic pattern combines one-instance control with access through a static property; .NET dependency injection can provide shared lifetime without requiring every consumer to reach for a global.

## ASP.NET Core example

```csharp
public interface IClock
{
    DateTimeOffset UtcNow { get; }
}

public sealed class SystemClock : IClock
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}

builder.Services.AddSingleton<IClock, SystemClock>();
```

The registration assumes `builder` is the ASP.NET Core `WebApplicationBuilder` in `Program.cs` and the dependency-injection namespace is imported. The container creates one `IClock` instance per service provider. This is appropriate for a stateless or safely shared component. It does **not** make mutable state thread-safe. A singleton must also not capture a scoped dependency such as a request-scoped `DbContext`; that creates an invalid lifetime relationship and can leak request state. In ASP.NET Core, resolve services from the application's built provider; avoid building a second provider during registration, since it creates a separate set of singleton instances and breaks expected lifetime sharing.

The singleton lifetime is per root service provider, not an absolute process-wide guarantee. Applications with multiple hosts, test providers, or isolated scopes may construct more than one instance. If a singleton needs scoped work, create a scope through `IServiceScopeFactory` for a bounded operation and dispose it; do not retain the scoped service after that scope ends.

## Tradeoffs and alternatives

- Use singleton lifetime for genuinely shared, expensive, immutable, or thread-safe services. Use scoped lifetime for per-request work and transient for short-lived stateless services where appropriate.
- A static singleton hides dependencies and makes replacement, configuration, and tests harder. Constructor injection keeps dependencies visible.
- The classic lazy singleton involves concerns such as thread-safe initialization, test isolation, and process-wide state. DI containers handle instance creation and lifetime management without making the type itself global.
- “One instance” means one per service-provider/container, not necessarily one for the entire process if the application builds multiple providers.
- Do not choose singleton just to reduce allocations; measure and confirm its state and lifetime semantics first.
- A static class is suitable for stateless utility functions when global configuration and substitutability are not needed. It is not an alternative for a service that requires injected dependencies or controlled lifetime.
- A cache may be singleton because it is shared, but its capacity, eviction, synchronization, and tenant boundaries still need design. Sharing an object does not mean its mutable state is safe or appropriate to share.

The singleton can simplify shared identity, but it introduces contention, hidden global state, and long-lived retention. Large caches or event subscriptions can retain data and objects for the entire process. If each request or tenant needs isolation, singleton lifetime can be a correctness and privacy bug rather than an optimization.

## Testing, production pitfalls, and interview notes

Test singleton services for concurrent access when they mutate state. Test lifetime registration in a small integration test where it matters, and avoid test-order dependence caused by shared mutable state. Ensure tests can replace the registration or construct the service explicitly. For mutable shared state, tests should exercise synchronization and lifecycle behavior rather than relying solely on sequential unit tests.

Production pitfalls include capturing scoped dependencies, unsynchronized collections, unsafe lazy initialization, mutable static configuration, and registering a request-specific service as singleton. In .NET, DI handles safe creation of a registered singleton, but not safe concurrent use of the instance. Use immutable state or appropriate synchronization, and avoid holding per-user or per-request data on a shared service. Monitor retained memory for long-lived caches and subscriptions.

Configuration objects registered as singletons are often safest when bound once and treated as immutable snapshots. If options must reload, use the framework's monitored options mechanism rather than mutating arbitrary shared fields without synchronization. Also consider graceful shutdown: a singleton that owns connections or background resources should implement an appropriate disposal interface so the host can release it.

In an interview, distinguish DI-managed singleton lifetime from a static global and explain whether uniqueness is per container or process. Discuss concurrent access and dependency lifetimes before claiming it is safe. Use singleton only when shared identity or state is part of the design, not as a default optimization.

## Related Topics

- [Dependency Injection](../aspnet-core/dependency-injection.md)
- [Services](../angular/services.md)
- [Threading](../csharp/threading.md)
- [Lock](../csharp/lock.md)