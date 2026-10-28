## Why authorization belongs on the server

Authorization checks whether the current principal may perform an operation on a resource. Hiding a button in a client improves usability, not security: every server request must enforce the relevant policy. ASP.NET Core supports endpoint attributes, imperative checks, and policy-based authorization built from requirements and handlers.

Prefer named policies over scattered role-string checks when decisions include multiple claims or business rules:

```csharp
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CanApproveOrders", policy =>
        policy.RequireAuthenticatedUser()
              .RequireClaim("permission", "orders.approve"));
});

app.MapPost("/orders/{id:int}/approve", ApproveOrder)
   .RequireAuthorization("CanApproveOrders");
```

For resource-based decisions (for example, whether a user owns a particular order), load or otherwise establish the resource, then call `IAuthorizationService.AuthorizeAsync(user, resource, policyName)`. A route-level policy cannot safely infer ownership from an untrusted ID. Handlers should be small, deterministic, and testable; avoid fetching the same resource repeatedly in several layers.

Authentication middleware populates the principal; authorization evaluates endpoint metadata and policies. In controller apps, `[Authorize]` can protect a controller/action, while `[AllowAnonymous]` overrides it for deliberate public endpoints. A 401 challenge and a 403 forbid are distinct outcomes, although custom schemes may shape them differently. Be cautious with fallback policies: they can secure newly added endpoints by default, but require explicit anonymous metadata for intended public routes and thorough tests.

Do not assume roles are equivalent to permissions, or that claims remain current forever. Token claims may become stale until expiration; high-impact actions may need server-side state or revocation strategies. Test both allowed and denied cases, including cross-user resource access.

## How policy evaluation works

An endpoint carries authorization metadata, added by attributes, endpoint conventions, or a fallback policy. The authorization middleware obtains the selected endpoint after routing, combines applicable policies, and evaluates requirements against the current principal. A requirement is a small statement of what must be true; one or more authorization handlers decide whether it is satisfied. Multiple requirements in one policy are generally conjunctive: every requirement must succeed. Multiple handlers for the same requirement can provide alternative ways to satisfy it.

```csharp
public sealed record MinimumAgeRequirement(int Age) : IAuthorizationRequirement;

public sealed class MinimumAgeHandler : AuthorizationHandler<MinimumAgeRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        MinimumAgeRequirement requirement)
    {
        var value = context.User.FindFirst("age")?.Value;
        if (int.TryParse(value, out var age) && age >= requirement.Age)
            context.Succeed(requirement);

        return Task.CompletedTask;
    }
}
```

Register requirements and handlers through DI, and keep policy names and requirement types stable enough to test. A handler should not mark an operation successful based on untrusted route or body values alone. Handlers are often called for each authorization evaluation and may be reused according to their DI registration; do not retain request-specific mutable state in fields.

## Resource-based decisions

Many important decisions cannot be answered from endpoint metadata and token claims alone: can this user edit this order, view this document, or approve a payment for this tenant? Load the resource under appropriate constraints, then authorize the actual resource:

```csharp
var order = await orders.FindAsync(id, cancellationToken);
if (order is null)
    return Results.NotFound();

var result = await authorization.AuthorizeAsync(
    user, order, "CanEditOrder");
if (!result.Succeeded)
    return Results.Forbid();
```

The check must occur on every operation that exposes or changes protected data. Hiding an identifier in the UI is not access control. Consider whether returning 404 instead of 403 is appropriate to avoid disclosing resource existence; make that an intentional, consistent policy rather than an accidental side effect. Avoid a check/use race for high-impact writes: authorization and mutation may need to occur in one transaction or use a conditional update so the resource cannot change between the check and commit.

Authorization can be applied declaratively with `[Authorize(Policy = "...")]` or `.RequireAuthorization(...)`, or imperatively through `IAuthorizationService`. Declarative policies are a strong default for coarse access; imperative evaluation is needed when the decision depends on a specific loaded resource. `[AllowAnonymous]` bypasses authorization metadata for a deliberate public endpoint and deserves review, especially under a fallback policy.

## Policy design and composition

Prefer policies that describe capabilities (`orders.approve`) or business conditions to broad role labels when the application must support multiple identity providers or fine-grained permissions. Roles remain useful when they represent a stable organizational concept, but a role should not be confused with ownership of every resource. Claims can be stale during token lifetime, so sensitive permission revocation may require short-lived tokens, server-side lookups, or another revocation design.

A fallback policy can require authentication for endpoints that have no explicit metadata, reducing the chance a newly added endpoint is accidentally public. It also changes the default for health probes, documentation, callbacks, and login routes; explicitly designate intended anonymous routes and test them. `DefaultPolicy` controls the behavior when authorization is requested without a named policy; it is not the same as a fallback policy.

Keep handlers focused and avoid doing expensive remote I/O repeatedly. If a policy requires current subscription or tenant state, cache carefully with a defined freshness window or retrieve it once in the application operation. Do not make authorization decisions solely in a reverse proxy or UI when the API can be reached directly. Use least privilege and deny by default for protected operations.

## Failure behavior and interview checks

Authorization generally results in a challenge when the user is not authenticated and a forbid when an authenticated principal fails a policy. The default response is handler-dependent: bearer APIs commonly use 401/403 while cookie applications may redirect for a challenge. An endpoint can be authenticated yet fail resource authorization, so do not equate authentication success with permission.

Test both allowed and denied cases across roles/claims, tenants, ownership boundaries, anonymous requests, and missing resources. Include integration tests for middleware registration and endpoint metadata. At interview, be ready to explain why an `Authorize` attribute cannot by itself prove a user owns a particular row, how `IAuthorizationService` solves resource-based checks, and why client-side checks are only presentation logic.

## Designing permission models

Authorization can combine authentication state, claims, roles, ownership, tenant membership, and resource state. Model the question as a capability or business rule rather than exposing internal role names throughout the application. For example, "may approve this order" can depend on permission, tenant, amount threshold, and current order state. Keep policy names meaningful and centralize the stable pieces, but do not build a generic rule engine unless the domain actually needs one.

Tenant isolation deserves explicit treatment. Resolve the tenant from a trusted source (such as a validated token claim or server-side membership), then constrain resource queries and mutation operations to that tenant. A route parameter like `/tenants/{tenantId}/orders/{id}` is client-controlled input and must be checked against the principal. It is often safer to scope the database query by both tenant and resource ID, so unauthorized rows are never materialized in a way that a later code path might expose. Caches also need tenant and authorization dimensions in their keys; a correct policy applied after an incorrectly shared cached result may still leak data.

Claims are a snapshot of identity-provider state at issuance time. Revoking a permission in a source system may not affect an already-issued bearer token until it expires. For low-risk content, a bounded staleness window may be acceptable; for financial, administrative, or emergency access, check current state or use a short-lived credential/revocation model. Balance freshness against latency and identity-provider dependency availability. Define what the app does if a current-permission lookup times out: protected actions should not be granted by default.

## Handler composition and performance

An authorization handler may support one or more requirement types and can be registered through DI. Handlers should be small, deterministic, and side-effect free wherever possible. Use `context.Succeed(requirement)` only when the requirement is proven; returning without success leaves it unsatisfied. `context.Fail()` can explicitly fail the overall evaluation, while simply not succeeding allows another handler to satisfy the requirement where alternative handlers are intended. Be deliberate about combining requirements and handlers so an "OR" path does not accidentally bypass a mandatory condition.

Avoid network calls in several handlers when one application operation can load the relevant data once and evaluate the resource. If a requirement needs a database lookup, ensure the handler's lifetime and scope are appropriate and avoid doing I/O for anonymous requests when a policy can reject early. A handler's async API does not make unbounded remote work free; pass cancellation where available and apply timeouts. Do not cache authorization results across users or tenants without including identity and resource state in the cache semantics.

## Auditing, denial, and verification

Not every denial should produce a high-severity log. A user trying an ordinary operation without permission may be expected; repeated or anomalous denials may merit a security signal. Audit high-impact actions with actor, target, decision context, and trace reference, while avoiding sensitive claim/token content. Authorization logs should not disclose whether a protected object exists to an untrusted caller.

Tests should cover policy registration, handler success/failure, anonymous challenges, authenticated forbids, resource ownership, cross-tenant access, stale permissions, and behavior when a permission dependency is unavailable. Use fake principals and resources for unit tests, then integration-test endpoint metadata and response behavior. Test newly added endpoints under fallback policy to ensure they are protected unless explicitly public.

Interview note: a policy can decide whether a principal meets a general requirement before an endpoint runs; resource-based authorization is necessary when the answer depends on a particular loaded object. Neither mechanism removes the need to constrain queries and writes to the correct tenant.

## Related Topics

- [Authentication](./authentication.md)
- [JWT](./jwt.md)
- [Cookies](./cookies.md)
- [Minimal APIs](./minimal-apis.md)
- [Web APIs](./web-api.md)