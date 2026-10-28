## Kestrel's role

Kestrel is ASP.NET Core's cross-platform web server. It accepts HTTP connections and feeds requests into the ASP.NET Core pipeline. In production it may be internet-facing, or sit behind a reverse proxy/load balancer that handles TLS termination, routing, or edge protections. The deployment topology determines which layer owns certificates, connection limits, request limits, and forwarded metadata.

Configure listener endpoints and limits for the application’s actual environment; avoid binding broadly or exposing a management port unintentionally. Request-size limits and timeouts should be coordinated with proxy limits so the application does not buffer or process work the edge rejects. Test HTTP/1.1, HTTP/2, and HTTP/3 only where supported and enabled by the deployment infrastructure.

When behind a trusted proxy, forwarded headers can communicate the original client address and scheme. Configure known proxies/networks and run forwarded-header middleware early enough. Trusting arbitrary `X-Forwarded-*` values lets clients spoof origin/IP information, potentially bypassing redirect, logging, or security assumptions. Forwarded headers do not themselves make a connection secure.

Operational practices:

- Keep the runtime and hosting packages patched; restrict TLS to approved protocols/ciphers at the correct termination point.
- Set bounded connection/request timeouts and concurrency/resource limits based on workload and client behavior.
- Observe connection failures, request duration, status codes, and resource pressure; use health endpoints without exposing internals.
- Verify graceful shutdown and load-balancer draining under deployment.

Kestrel is not the whole hosting architecture. IIS, HTTP.sys, containers, ingress controllers, and cloud load balancers can alter which server is used and which limits apply. Confirm effective settings instead of assuming a local profile matches production.

## Binding, limits, and proxy boundaries

Kestrel endpoints can be configured through application configuration, code, environment variables, or hosting integration; the effective source depends on the deployment. Bind only the interfaces and ports the service needs. In a container, binding to an appropriate interface is necessary for traffic from outside the container, while exposing a host port is a separate deployment decision. Do not assume a local development launch profile controls the production listener.

Limits should be considered end to end. A reverse proxy may reject a body before Kestrel sees it, while a more permissive edge can forward a request Kestrel or the application rejects. Coordinate maximum body sizes, request-header limits, connection limits, and timeouts with legitimate client behavior. Timeouts that are too generous permit slow-client resource exhaustion; overly short values break long uploads and streaming. Measure and load-test expected traffic rather than selecting limits by guesswork.

When TLS terminates at a trusted proxy, forwarded headers may carry original scheme, host, or client IP. Configure the known proxy/network list and place `UseForwardedHeaders` early enough for redirects and authentication to observe the corrected scheme. Never treat arbitrary `X-Forwarded-For` or `X-Forwarded-Proto` as authoritative; clients can forge them if the proxy trust boundary is not configured. Do not infer end-user identity from an IP address.

## Production operations

Kestrel is integrated with the host's graceful-shutdown behavior. The load balancer should stop routing new work before process termination, while the app completes bounded in-flight requests. Long-lived WebSocket, SignalR, and streaming connections need specific drain and reconnect behavior. Configure health endpoints and server limits in concert with orchestration; a liveness failure caused by one saturated dependency can cause cascading restarts.

Use supported TLS termination and patch the runtime. Observe connection counts, request duration, status codes, queueing, thread-pool pressure, and memory. A reverse proxy can provide edge protection, but Kestrel still needs sane resource limits because internal traffic and misconfigured gateways exist. Test the real ingress protocol, HTTP version negotiation, forwarded metadata, upload behavior, and shutdown in a production-like topology.

## Related Topics

- [Request pipeline](./request-pipeline.md)
- [Middleware](./middleware.md)
- [Health checks](./health-checks.md)
- [Configuration](./configuration.md)
- [Load balancers](../system-design/load-balancer.md)