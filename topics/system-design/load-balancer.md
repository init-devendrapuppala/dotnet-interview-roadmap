## Goals and placement

A load balancer distributes requests across healthy instances to improve availability and use capacity. Layer 4 balancing routes TCP/UDP connections; layer 7 balancing can route HTTP using host, path, headers, or application health. Cloud-managed load balancers commonly combine listener, TLS, routing, and health-check functions.

```text
Clients -> DNS / edge -> load balancer -> app instance A
                                      -> app instance B
                                      -> app instance C
```

## Design choices

- **Algorithms:** Round robin is simple; least-connections can help with variable request duration; weighted routing supports unequal capacity and gradual rollout. Choose based on measured workload.
- **Health checks:** Separate liveness (“process can run”) from readiness (“can safely accept traffic”). Aggressive checks can eject healthy instances during a shared dependency outage; checks should be bounded and meaningful.
- **Session state:** Prefer stateless application instances with externalized durable state. Sticky sessions ease legacy migration but hurt failover and balancing; they do not provide durability.
- **Connection behavior:** Configure keep-alive, connection draining, idle timeout, and maximum connections consistently with clients and servers.
- **Zones and locality:** Spread instances across failure domains while considering cross-zone cost and latency.

## Failure modes

Health checks can produce a cascading failure if all instances are removed together. A load balancer does not fix a saturated database or unhealthy downstream. Pair balancing with autoscaling where useful, but avoid relying on scale-out to fix bottlenecks with slow startup or constrained stateful dependencies. Preserve capacity for a zone or instance loss.

For deployments, use gradual traffic shifting, canaries, or blue/green routing with rollback criteria. Drain existing connections before termination. Be cautious with retries at both the load balancer and application layers: they can amplify load and duplicate writes.

## .NET/cloud considerations

ASP.NET Core apps should expose separate readiness/liveness endpoints with bounded checks. Honor forwarded headers only from trusted proxies; otherwise client IP and scheme can be spoofed. Configure Kestrel, proxy, and client timeouts coherently. For HTTP/2 or long-lived WebSockets, verify how the chosen balancer handles connection duration and draining.

## Interview framing

Estimate peak concurrent connections and request rate, clarify whether requests are stateless, define health criteria, and discuss what happens when one zone fails. A single highly available managed balancer can itself be region-scoped; multi-region routing requires a separate failover and data-consistency design.

## Rollout behavior

Health checks must represent readiness, not merely a running process. Drain connections during deployment and keep session affinity only when state cannot yet be externalized; affinity can create uneven load and weakens failure recovery.

## Related Topics

- [API Gateway](api-gateway.md)
- [Scalability](scalability.md)
- [Circuit Breaker](circuit-breaker.md)
- [Microservices](microservices.md)
