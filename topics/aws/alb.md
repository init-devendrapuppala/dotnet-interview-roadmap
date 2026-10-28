# Application Load Balancer (ALB)

An Application Load Balancer is a regional, Layer 7 load balancer for HTTP and HTTPS. Its purpose is not merely to distribute connections: it understands HTTP requests and can select a target group using host names, paths, headers, query strings, source addresses, or methods. This lets several applications share an entry point and supports gradual routing changes without putting routing logic in each client. An ALB is a common front door for ASP.NET Core services on EC2 or ECS, but it does not replace application authorization, validation, or resilience.

## Request path and routing

Clients connect to a listener on a configured port and protocol. The listener evaluates ordered rules, then forwards a matching request to a target group or applies a redirect/fixed response. A target group defines the target type (for example, instance, IP address, or Lambda), protocol and port, health checks, and attributes such as deregistration delay. Targets can be registered directly or managed by an integration such as ECS. For example, `api.example.com/orders/*` could route to an Orders service while `api.example.com/catalog/*` routes to a separate service.

ALB nodes are provisioned across the enabled Availability Zones in a VPC. For an internet-facing load balancer, select public subnets in multiple AZs; application targets can remain in private subnets. Internal ALBs are reachable only through VPC-connected paths. ALB can terminate TLS using an ACM certificate and a configured security policy. The hop from ALB to target is separately configured; encrypt that leg too when the threat model or compliance requirements call for it. ALB is HTTP-aware, not a generic TCP/UDP proxy; use a Network Load Balancer when Layer 4 behavior or protocols are needed.

## Health, deployments, and .NET

Health checks determine whether a target is eligible for new routing. Make the check represent readiness to serve the relevant traffic, and avoid a dependency check that marks every replica unhealthy during a shared downstream outage. Health-check success is not proof that real requests work, so retain application-level probes and SLO monitoring. During deployment or scale-in, deregistration delay and application shutdown settings should allow in-flight requests to finish. A long delay can slow rollouts; a short delay can terminate active work.

For ASP.NET Core behind ALB, configure Kestrel and the hosting environment deliberately. Forwarded headers can restore original scheme, host, or client address, but trust only known proxy sources and configure trusted networks/hops; blindly accepting forwarded headers enables spoofing. Align application request limits, keep-alive behavior, and timeouts with the ALB and upstream client. Test readiness checks through the production routing path, not only on localhost.

## Security, operations, and tradeoffs

Attach a dedicated security group to the ALB and allow target security groups to accept application traffic from that ALB security group rather than from arbitrary internet ranges. Use least-privilege listener and certificate management, restrict administrative access, and consider AWS WAF for web threat filtering. Access logs in S3 help answer request-level questions; CloudWatch metrics and alarms expose target health, request counts, latency, and HTTP error patterns. Correlate load-balancer errors with application logs because a 5xx can originate at either layer.

ALB is managed and removes the burden of operating proxy nodes, but incurs hourly and capacity-related charges and adds a network hop. Review utilization and routing rules, avoid excessive duplicate load balancers where shared routing is appropriate, and account for cross-AZ traffic and downstream bottlenecks. Multi-AZ placement improves resilience only when targets, dependencies, and deployment practices also support it. ALB health checks can remove unhealthy targets but do not repair an application or guarantee failover for every failure mode.

## Related Topics

- [VPC](vpc.md)
- [ECS](ecs.md)
- [EC2](ec2.md)
- [API Gateway](api-gateway.md)
- [CloudWatch](cloudwatch.md)
