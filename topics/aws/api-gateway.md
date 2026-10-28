# Amazon API Gateway

Amazon API Gateway is a managed entry point for HTTP APIs, REST APIs, and WebSocket APIs. It provides public or private API endpoints and handles gateway concerns such as routing, stages, authorization integration, quotas/throttling, and access logging. It is useful when clients need a stable API boundary that can evolve independently of backend implementations. It does not make a backend secure or reliable by itself: application-level authorization, validation, idempotency, and capacity planning still matter.

## API types and request flow

Choose the API type based on required features rather than assuming one is universally best:

- **HTTP APIs** provide a streamlined feature set for common HTTP routing and authorization use cases and are often a cost-conscious choice.
- **REST APIs** provide additional capabilities and configuration options, including usage plans and API keys for metering/identifying usage (not as a substitute for authentication), request validation and transformation features, and broader gateway customization.
- **WebSocket APIs** maintain connections and route connect, message, and disconnect events. Applications must account for connection lifecycle, stale connections, and asynchronous delivery of backend responses.

An API route can invoke Lambda, forward to an HTTP endpoint, or use a supported AWS service integration. A private integration can reach VPC resources through a VPC link when supported for the API type and target. An ALB may be a good internal application router behind a gateway; the gateway and ALB have different roles and add separate configuration, latency, limits, and cost. Understand each hop's timeout and payload constraints. Stage configuration, deployments, custom domains, certificates, and DNS are part of the production design—not merely console setup.

## Security and application design

Select an authorization model appropriate to callers. IAM authorization fits AWS principals; JWT authorizers suit supported identity providers; Lambda authorizers allow custom checks but add execution, latency, and failure dependencies. Do not rely on API keys to authenticate users. Apply least privilege to any integration role and use resource policies or private endpoints to restrict who can invoke an API where appropriate. Terminate client traffic with TLS and use a managed certificate for custom domains. Consider AWS WAF and throttling to reduce unwanted traffic, while recognizing that gateway throttles are protective limits rather than a capacity guarantee.

Validate input at the boundary, but repeat essential validation and authorization in the application because backend routes may have other callers. Avoid logging authorization headers, secrets, or sensitive request/response bodies. Access logs should contain a correlation identifier and selected non-sensitive request context. Carefully set CORS: browser policy is not server-side access control.

For .NET backends, an ASP.NET Core API may be behind an HTTP integration, a VPC link, or an ALB. Configure forwarded headers only from trusted proxies, preserve correlation context, and align gateway, load balancer, Kestrel, and client timeouts. Avoid designing a synchronous chain whose total worst-case latency exceeds the gateway's integration limit; long-running work is often better accepted quickly and processed asynchronously. Lambda integrations using .NET need realistic cold-start and concurrency testing, and should not rely on an invocation finishing after the configured timeout.

## Reliability, scaling, and operations

Deployments are associated with stages; keep stage variables, access logging, throttles, and canary/deployment choices explicit and repeatable. Use separate environments or accounts where isolation is needed. A gateway cannot make a failing integration healthy: monitor gateway 4xx/5xx, latency, throttling, and integration errors alongside backend saturation and errors. A high 4xx rate may represent client input, authorization failures, or a routing mismatch; diagnose using structured access logs rather than treating every 4xx as a server incident. Set alarms against service objectives and verify the logging destination and retention.

Gateway-managed scaling does not remove quotas, integration concurrency limits, database connection limits, or downstream capacity constraints. Load test representative request sizes, bursts, authorization behavior, and cold-start patterns. Use caching only when response semantics permit it, and define invalidation and authorization behavior carefully so one caller cannot receive another caller's data. Consider cost from requests, data transfer, caching, logging, and backend invocations at expected and burst traffic levels.

Plan for throttling, dependency timeouts, retries, and duplicate requests. A caller that retries after a timeout may cause the same operation to execute twice even if the gateway returns an error. For state-changing operations, design idempotency keys and durable deduplication in the application. Test deployment rollback and API contract compatibility, including old clients, before changing routes or transformations.

## Related Topics

- [ALB](alb.md)
- [Lambda](lambda.md)
- [IAM](iam.md)
- [CloudWatch](cloudwatch.md)
- [VPC](vpc.md)
