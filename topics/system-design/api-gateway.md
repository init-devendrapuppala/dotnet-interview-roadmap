## Purpose and goals

An API gateway is the client-facing entry point for a set of backend services. It can provide a stable public API while routing requests, authenticating callers, enforcing quotas, and applying cross-cutting policies. It is most useful when those concerns would otherwise be duplicated across many clients or services.

Start a design by identifying client types, traffic volume, latency budget, and the responsibilities that truly belong at the edge. A gateway should not become the owner of business workflows or a shared database-backed “god service.”

## Typical request path

```text
Client -> DNS / load balancer -> Gateway -> service discovery -> service
                                  |             |
                           auth, limits     timeouts, traces
```

Common responsibilities include TLS termination, path or host routing, token validation, request-size limits, rate limiting, correlation IDs, and protocol translation. Aggregation (one client request calling several services) may be appropriate for a client-specific backend-for-frontend, but it couples that endpoint to downstream availability and latency.

## Design and tradeoffs

- **Routing:** Prefer explicit, versioned routes. Avoid exposing internal topology or allowing arbitrary destinations.
- **Authentication:** Validate issuer, audience, signature, expiry, and scopes at the edge; services should still enforce authorization for sensitive operations. A forwarded identity must be protected from spoofing.
- **Rate limits:** Choose a key (user, tenant, API key, or IP) and a policy (fixed/sliding window, token bucket). A per-instance in-memory limit is not globally accurate; a shared store adds latency and failure modes.
- **Resilience:** Bound request and response sizes, set per-hop timeouts, propagate cancellation, and avoid automatic retries of non-idempotent operations.
- **Availability:** The gateway is a critical dependency. Run multiple stateless instances across failure domains and keep configuration rollout safe. Decide whether a failed policy dependency (for example, a remote quota store) fails open or closed based on risk.

In ASP.NET Core, a gateway can be implemented with a dedicated proxy such as YARP, or with a small edge API. Keep route configuration, secrets, and certificates outside source code. Use `HttpClientFactory` for downstream calls and propagate trace context. Do not treat gateway authorization as a substitute for service-level checks.

## Failure modes and interview checks

Ask what happens when a downstream service is slow, discovery is stale, a token issuer is unavailable, or a new route configuration is invalid. A gateway should enforce an overall deadline shorter than the client deadline, return useful status codes, and expose per-route latency/error metrics. Aggregation endpoints need partial-failure semantics: fail the whole response, return a partial result, or use cached data—make that an explicit contract.

Discuss whether a gateway is necessary at the current scale. A reverse proxy can centralize policy, but it also adds a hop, operational ownership, and a potential bottleneck. Use separate gateways or BFFs when client needs and security boundaries differ.

## Operational contract

Version routes and policy changes, validate configuration before rollout, and canary changes with per-route metrics. The gateway should preserve a request ID/trace context and reject malformed or oversized input early. It is an enforcement point, not the source of truth for downstream authorization.

## Related Topics

- [Load Balancer](load-balancer.md)
- [Circuit Breaker](circuit-breaker.md)
- [Caching](caching.md)
- [Microservices](microservices.md)
- [Scalability](scalability.md)
