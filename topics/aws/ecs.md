# Amazon ECS

Amazon Elastic Container Service (ECS) is AWS’s managed container orchestrator. It schedules and maintains container workloads without requiring a Kubernetes control plane. ECS is often a strong fit for teams that want containers, service discovery, deployments, and integration with AWS networking and identity but do not need Kubernetes APIs or its ecosystem. As with any orchestrator, ECS does not remove responsibility for application health, image lifecycle, capacity, data, and safe releases.

## Core objects and execution choices

A **task definition** is a versioned blueprint: it specifies one or more containers, image references, CPU and memory settings, ports, environment, logging, health checks, volumes, and IAM roles. A **task** is a running instance of that definition. A **service** maintains a desired number of tasks, coordinates replacement and deployments, and can register targets in an ALB target group. One-off tasks are useful for migrations or scheduled/batch work. Keep task definitions immutable and promote a reviewed image digest through environments rather than relying on a mutable `latest` tag.

Tasks can run on EC2 capacity or AWS Fargate. EC2 capacity offers control over instance families, host agents, placement, and some specialized requirements, but the team must provision, patch, scale, and recover the underlying fleet. Fargate removes host management and charges for requested task resources over runtime, but exposes fewer host-level controls and has its own supported configuration and resource constraints. Compare total cost at realistic utilization: densely packed EC2 may be economical with steady use, while Fargate can be operationally simpler for variable or smaller fleets. Neither is universally cheaper.

A service can place tasks across subnets and Availability Zones. For HTTP workloads, an ALB routes to task IPs or supported target types; the task security group should accept only required traffic, commonly from the ALB security group. With `awsvpc` networking each task gets VPC networking identity and consumes subnet IP capacity, so plan CIDR size and task density. Private tasks need a deliberate egress path for image pulls, AWS APIs, and external dependencies—through NAT, VPC endpoints where supported, or another approved route.

## Identity, configuration, and deployment

Distinguish the **task execution role** from the **task role**. The execution role is used by ECS/Fargate infrastructure to perform actions such as pulling images from ECR and sending logs. The task role is made available to application code for AWS API calls. Give each service a narrow task role; avoid placing application permissions on the execution role or using a broad shared role. The .NET AWS SDK should resolve temporary credentials from the task role, not from keys baked into the image.

Configuration that is not secret can be injected through a controlled deployment mechanism. Secrets should be retrieved or referenced from an appropriate secret store such as Secrets Manager, with access limited to the workload that needs them. Environment variables can be visible through task inspection and should not become an indiscriminate secret channel. Rotate secrets with a plan for tasks to refresh or redeploy; injecting a value at task start does not by itself refresh an already-running process.

ECS deployments replace tasks according to service deployment settings. Rolling deployment limits—minimum healthy and maximum percent—affect both availability and how much extra capacity is required during rollout. Configure container health checks and load-balancer health checks consistently: a container-level check can detect process readiness, while an ALB check tests the target over the request path. If checks are stricter than startup behavior, tasks can be repeatedly killed before becoming ready. Deployment circuit-breaker and rollback options can help, but establish what counts as healthy and verify rollback behavior with the chosen deployment controller and configuration.

## Reliability, scaling, and observability

Treat containers as replaceable. Persist business state in databases, object storage, or other durable services rather than the container writable layer. Use multiple task replicas and failure domains for availability, but account for downstream connection limits and correlated dependencies. A service may maintain its desired count while every task is returning application errors; monitor both scheduler state and user-facing service-level indicators.

Autoscaling can use CPU, memory, or application metrics. For a request-serving service, target tracking works only when the metric tracks capacity demand meaningfully; request count per target or latency may be a better signal in some cases. Scaling is not instantaneous, so set minimum capacity and buffering for startup time. For queue consumers, use backlog and age-of-oldest-message together with processing rate, and cap concurrency to protect databases. Watch for IP exhaustion, placement failures, insufficient EC2 capacity, quota limits, image pull failures, and unhealthy target registration.

Send structured application logs to CloudWatch or the chosen telemetry platform, and include service name, task-definition revision, deployment, and trace/correlation identifiers. Monitor task restarts, stopped-task reasons, deployment failures, resource saturation, target health, and dependency errors. Logs should not contain secrets or unnecessary personal data. A task that exits cleanly may still represent a failed job; capture outcome metrics as well.

Security controls include private networking where feasible, minimal task and execution roles, controlled ECR access, vulnerability scanning, immutable artifacts, encrypted data paths where required, and ingress limited by security groups. Restrict who can register task definitions and pass roles: the ability to launch a task with another role can become privilege escalation. Use image digests for reproducibility, scan dependencies and base images, and keep base images patched.

## .NET container considerations

Build a small, reproducible .NET image with a supported runtime and a non-root user when compatible with the application. Bind ASP.NET Core to the interface and port expected by the task and target group; container port mappings, service discovery, and listener rules must agree. Configure readiness separately from liveness, and ensure the readiness route does not create an expensive dependency cascade. On shutdown, handle SIGTERM, stop accepting new requests, allow in-flight operations a bounded completion window, and ensure the grace period aligns with ALB deregistration and ECS stop behavior.

Use asynchronous I/O, bounded worker concurrency, and explicit request/dependency timeouts. Avoid treating the CPU and memory limit as a tuning detail: .NET garbage collection and thread-pool behavior respond to container limits, and an undersized limit can cause latency or out-of-memory termination. Profile in a representative container, not only on a developer machine. Make startup failures visible and avoid crash loops caused by transient dependencies without a backoff or readiness strategy.

## Cost and interview tradeoffs

Costs include Fargate task resources or EC2 host capacity, ECR storage and transfer, load balancers, logging, networking, and data transfer. Right-size task requests, remove abandoned services and images according to retention policy, and understand the tradeoff between lower idle capacity and slower scale-out. ECS can simplify container operations, but does not mean “no operations”: teams still own deployment safety, images, task roles, network paths, capacity, and incident response. In an interview, explain why ECS rather than EC2-only or EKS fits, how a task obtains AWS permissions, how a rollout is protected, and how the service behaves when its database or AZ is impaired.

## Task lifecycle and incident diagnosis

The scheduler’s view of a task and the application’s view of readiness are distinct. A task may be in a running state while failing requests, or stopped with a useful stopped reason such as an image pull, resource, or entrypoint error. Include task-definition revision and deployment ID in logs so an operator can compare healthy and failing revisions. During a rollout, verify capacity for both the old and new tasks, target registration, container health, and ALB health before increasing deployment speed. Avoid changing image, IAM role, networking, and resource sizing simultaneously unless rollback is well understood.

Capacity-provider strategies can distribute tasks across configured capacity providers, including EC2 Auto Scaling capacity and Fargate options. They are a placement mechanism, not a guarantee that a specific capacity type will be immediately available. For EC2-backed services, monitor both service desired/running counts and the underlying cluster’s available CPU, memory, and placement constraints. A task may fail to place even when aggregate CPU looks sufficient because resources are fragmented or a placement constraint cannot be met. For Fargate, account for supported sizes, quotas, subnet address availability, and startup delay.

Plan task shutdown and draining across the entire request path. ECS sends stop signals and eventually terminates the task; ALB target deregistration and application grace periods should give in-flight work a bounded chance to finish. A long-running request or consumer operation can still be interrupted, so use idempotent work units and durable checkpoints where appropriate. Ensure deployment configuration allows enough spare capacity to meet the service objective while replacing tasks.

## Platform choices and governance

Use separate task definitions and roles for distinct trust boundaries rather than one general-purpose task that can read every secret and bucket. Restrict who can call `RunTask`, update a service, register a privileged task definition, or pass a task role. A pipeline that can change the image but also choose arbitrary roles effectively has more authority than its image-publishing task suggests. Maintain an inventory of public listeners, role assignments, secrets, and task-definition revisions.

Decide how configuration and secrets reach tasks, how image tags are promoted, how logs are retained, and who owns base-image patching. Keep nonsecret configuration outside the image so deployments can vary safely, but version interface contracts and environment settings. Establish service-level dashboards for desired versus running tasks, deployment success, target health, latency, request errors, and downstream limits. This helps differentiate orchestration failures from application failures and makes incident response actionable.

## Related Topics

- [ALB](alb.md)
- [VPC](vpc.md)
- [IAM](iam.md)
- [CloudWatch](cloudwatch.md)
- [Secrets Manager](secrets-manager.md)
- [EKS](eks.md)