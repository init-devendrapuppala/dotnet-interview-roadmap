## Why lifetimes affect correctness

The built-in container constructs services and disposes container-owned instances. The common lifetimes are transient (new instance per resolution), scoped (one instance per scope, normally one HTTP request), and singleton (one instance for the root container). A lifetime is a reuse and ownership rule, not a thread-safety guarantee.

Typical registrations:

```csharp
builder.Services.AddTransient<IEmailFormatter, EmailFormatter>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddSingleton<IClock, SystemClock>();
```

Do not inject a scoped service into a singleton: it can be captured beyond its intended scope and lead to stale state or disposed dependencies. A singleton must be safe for concurrent calls. Hosted services are singleton-lived; create scopes with `IServiceScopeFactory` when processing scoped dependencies. `DbContext` is normally scoped because it represents a short unit of work and is not thread-safe.

Constructor injection exposes dependencies and supports testing. Avoid resolving arbitrary services from `IServiceProvider` inside application code (“service locator”), though factories and scope creation are legitimate infrastructure use cases. Register one implementation per interface deliberately: multiple registrations resolve differently depending on whether a single service or `IEnumerable<T>` is requested. The built-in container intentionally keeps advanced features limited; a third-party container should solve a concrete requirement, not be added by default.

Disposal follows ownership: instances created by the container are disposed with their scope/provider. Do not manually dispose injected services, and avoid registering the same disposable instance in ways that create ambiguous ownership.

**Interview check:** Scoped does not mean “one instance per thread,” and transient does not mean “new instance on every method call”; resolution boundaries determine creation.

## How resolution and scopes work

The service collection is a registration recipe built before the host starts. The provider creates instances when a service is first resolved, and scopes define where scoped instances are reused and disposed. In a normal HTTP request, ASP.NET Core creates a request scope; all resolutions of a given scoped registration within that scope share the same instance. A new request receives a different scoped instance. Transients are created each time the container resolves them, while singletons are shared from the root provider. These are creation/reuse rules, not guarantees that an implementation is stateless or thread-safe.

Constructor injection makes required dependencies visible and lets the container validate object graphs. Prefer asking for the narrow interface a component needs:

```csharp
public sealed class OrderService(
    IOrderRepository repository,
    IClock clock,
    ILogger<OrderService> logger) : IOrderService
{
    public async Task<Order?> GetAsync(int id, CancellationToken cancellationToken)
    {
        logger.LogDebug("Loading order {OrderId}", id);
        return await repository.FindAsync(id, cancellationToken);
    }
}
```

The service should not fetch arbitrary services from `IServiceProvider` to hide dependencies. Service location makes the object graph invisible, complicates tests, and can conceal a lifetime error. Factories, plugin activation, and creating an explicit scope in infrastructure are legitimate cases; keep them at clear boundaries and make the required dependencies apparent.

## Choosing lifetimes and avoiding captive dependencies

Use transient for lightweight, stateless components when a new instance per resolution is useful. Use scoped for work tied to a request or unit of work, notably Entity Framework Core `DbContext`, which is not thread-safe. Use singleton for genuinely shared, immutable or concurrency-safe state. A singleton should not capture scoped state such as a `DbContext`; that captive dependency effectively survives beyond its intended scope and may serve stale data or fail after disposal. The development scope validator can help surface invalid graphs; do not rely on it as the only defense.

A singleton that needs scoped work should inject `IServiceScopeFactory`, create and dispose a scope for each bounded operation, then resolve the scoped service inside that scope. This is common in a hosted worker. Do not retain the scope or scoped service between iterations. A singleton can safely depend on a transient service only if the transient's dependencies and behavior are safe for the singleton's long lifetime; transience does not magically make captured mutable state safe.

No lifetime makes an implementation thread-safe. A singleton may be called concurrently by requests and background tasks. Scoped objects can also be used concurrently if application code deliberately fans out work within one request, which is particularly dangerous for a `DbContext`. Do not run parallel EF operations on the same context. Prefer separate scopes/contexts for truly parallel units of work and coordinate transaction semantics intentionally.

## Registration, factories, and disposal

Registration choices affect resolution. With multiple registrations of one service type, resolving a single service generally selects the last registration, while `IEnumerable<T>` exposes all registrations. Use `TryAdd`/`TryAddEnumerable` where an extension should provide defaults without overriding application choices. Keyed services are available in modern frameworks for multiple named implementations; verify the target version and avoid keys as an uncontrolled string convention.

Factories can defer construction or select an implementation, but should not become hidden service locators. A factory resolving scoped services from the root provider is still a lifetime bug. The built-in container owns and disposes instances it creates; do not manually dispose injected dependencies. For externally created instances, ownership differs—read registration semantics carefully and ensure exactly one component is responsible for disposal. Async-disposable services need an async-capable scope/provider disposal path, which request and async scopes support.

Avoid building a second root provider during startup with `BuildServiceProvider()`. Doing so creates duplicate singleton graphs, splits options/logging state, and confuses disposal. Configure services through the host's registration APIs and resolve them only after the final provider is built. Keep registration modules organized but avoid circular dependencies disguised by interfaces; a cycle usually signals that responsibilities need redesign.

## Testing and interview reasoning

Test a service by injecting fakes for its declared collaborators, not by mocking the container. Use integration tests for registration wiring, options validation, scopes, and disposal behavior. Enable scope validation in development and tests. When diagnosing an object that unexpectedly persists, trace the resolution scope and any singleton that captured it.

Interviewers often ask what a lifetime means, whether a transient is always new, why `DbContext` is scoped, or why singleton-to-scoped injection is unsafe. Explain the resolution boundary and ownership—not just a memorized table. Also distinguish DI lifetime from request lifetime: a scoped service is per scope, and applications can create scopes outside HTTP requests. A DI container manages construction and disposal, not transaction boundaries, thread synchronization, or authorization.

## Factories, composition, and test seams

The composition root is the place to choose concrete implementations. Application code should depend on abstractions it owns, not on the DI container. For a finite choice among implementations, use a small factory or strategy registration that makes the selection explicit. Avoid resolving arbitrary service types by strings throughout the application; it makes missing registrations runtime surprises and hides dependencies from constructors. The built-in container supports common constructor injection and open generic registrations, but it is intentionally simpler than some third-party containers.

Do not call `BuildServiceProvider()` while configuring services. That creates a second root provider with its own singleton instances, options, logging graph, and disposal lifecycle. If configuration depends on another registered service, use the framework's factory overloads such as `AddOptions(...).Configure<Dependency>(...)` or the supported service-registration factory. Resolve services after the host has built its final provider.

Use constructor injection as a test seam: unit-test business behavior by providing a fake repository, clock, or external client. Do not mock `IServiceProvider` to test a class that should instead declare its direct dependencies. Integration tests should build the actual host and verify important registrations, including that options validation runs and disposable services are released. For testing scopes, create an explicit `IServiceScope` and resolve services inside it rather than resolving scoped dependencies from the root provider.

## Open generics, decorators, and external instances

Open generic registrations let one implementation handle families such as `IRepository<T>` and `Repository<T>`. They are convenient but should be covered by tests for the types the app actually uses; generic constraints and nested registrations can fail only when a specific closed type is resolved. Decorators can add cross-cutting behavior, but the built-in container does not provide every advanced decoration feature directly. Use explicit composition or a container extension only where the additional capability is justified.

Registration of an instance created outside DI has different ownership semantics from a factory-created service. If the application owns creation and disposal, do not assume the provider will clean it up. If the provider creates it, let the appropriate scope/provider dispose it. Avoid registering the same disposable object under multiple service types unless ownership and duplicate disposal behavior are well understood. Prefer one owning registration and map other interfaces to it intentionally.

## Diagnostic questions for interviews

When asked how to choose a lifetime, first identify the scope of the state and who shares it. Ask whether concurrent requests can call the instance, whether it depends on scoped work, and who disposes it. When a service is unexpectedly reused, trace how it is registered and resolved rather than assuming "transient" means one per HTTP request. When a singleton needs scoped work, create a scope per operation. Finally, separate DI's responsibilities—construction, reuse, and disposal—from application concerns such as thread-safety, transactions, and authorization.

## When a third-party container is justified

The built-in container is sufficient for most ASP.NET Core applications. Consider an alternative only for a concrete feature gap—such as a required advanced decorator, module scanning convention, or specialized child-container behavior—and verify integration and disposal semantics. Container features can make composition concise but may also hide registrations and increase debugging/runtime complexity. Keep service registration understandable to the whole team.

## Related Topics

- [Options pattern](./options-pattern.md)
- [Hosted services](./hosted-services.md)
- [Background services](./background-services.md)
- [C# interfaces](../csharp/interfaces.md)
- [C# disposable and using](../csharp/disposable-and-using.md)