# Amazon EC2

Amazon Elastic Compute Cloud (EC2) provides resizable virtual machines in AWS. It is the right abstraction when a workload needs operating-system access, a particular runtime or agent, specialized hardware, predictable process control, or a migration path for software that is not yet a good fit for a managed container or function service. The tradeoff is operational ownership: AWS operates the underlying infrastructure, while the customer remains responsible for guest operating systems, installed software, application processes, and much of capacity and recovery design.

## Instance anatomy and placement

An instance is launched from an Amazon Machine Image (AMI), which supplies the operating system and initial software. Its instance type selects a resource family and size—CPU, memory, network, and sometimes accelerator or storage characteristics. Select based on workload measurements rather than a generic "large server" assumption. Instances run in a subnet in a VPC and use one or more elastic network interfaces. Security groups act as stateful virtual firewalls attached to network interfaces. Metadata is available to the instance; use IMDSv2 and restrict instance metadata access for applications that do not need it.

An instance profile associates an IAM role with the instance so software can obtain temporary credentials. This avoids embedding access keys, but every process that can reach instance credentials may potentially use that role. Do not assign a broad role merely because one maintenance agent needs extra permissions. Keep application permissions narrow, isolate workloads, and consider a separate task or pod identity model when moving to containers.

Storage choice has lifecycle implications. Amazon EBS volumes are network-attached block storage with configurable performance and snapshots; their lifecycle can be independent of the instance, depending on configuration. Instance store is physically attached ephemeral storage and is lost when the instance stops or terminates. Neither should casually become the only copy of business data. Encrypt volumes and snapshots as required, use backups, and test restore workflows. Use S3 or a database for durable data when the access pattern fits.

## Fleet patterns, availability, and scaling

For replaceable web or worker capacity, an Auto Scaling group can maintain desired capacity across multiple Availability Zones and replace instances that fail configured health checks. Pair it with an ALB for HTTP traffic and keep application state external so replacement nodes can start cleanly. A single instance in one AZ is not highly available merely because EC2 is a regional service. Multi-AZ capacity, health checks, deployment strategy, data replication, and a tested recovery process all contribute to availability.

Choose scaling signals that reflect demand and safe capacity: request load, queue backlog, CPU, memory, or a custom application metric may be appropriate depending on the service. Scaling has launch and warm-up delay; it cannot absorb arbitrary instantaneous spikes. Maintain suitable headroom, set instance warmup and cooldown behavior deliberately, and ensure the database or downstream dependency can support the increased concurrency. For queue workers, scale based on backlog and processing rate rather than simply adding instances whenever CPU rises.

Launch Templates capture instance configuration for repeatable fleets. Prefer immutable AMIs and controlled image pipelines over manual changes made independently on long-lived hosts. Rolling refreshes, health checks, and deployment minimum/maximum capacity should be selected to balance rollout speed and service availability. Spot Instances can lower cost for fault-tolerant or interruptible work, but interruption notices are not a substitute for checkpointing and graceful termination. Use On-Demand or other appropriate capacity for workloads that cannot tolerate interruption, and plan for capacity availability and quotas.

## Security, patching, and operations

Put application instances in private subnets unless they truly need direct public reachability. Restrict security-group ingress to necessary peers and ports; use a bastion alternative such as Systems Manager Session Manager where appropriate rather than exposing administrative ports broadly. Patch base AMIs, operating systems, language runtimes, agents, and application dependencies on a defined schedule. Use Systems Manager capabilities where they fit, but verify inventory, patch compliance, and command access are functioning.

Monitor host-level signals and application-level health together. CloudWatch agent or another approved telemetry path may be needed for guest memory, disk, and process metrics; default service metrics do not automatically expose every operating-system signal. Centralize logs, include instance identity and deployment version, and alert on service-level symptoms such as elevated latency, error rate, failed health checks, and queue age. Keep logs free of credentials and sensitive payloads. Validate alarms and recovery steps in a game day.

Operational failure modes include a bad AMI that fails fleet-wide, exhausted subnet IPs, quota or capacity constraints, incorrect security groups, an unhealthy rollout that replaces every node, and an application that depends on local state. Use gradual deployments, automated rollback criteria, and a small blast radius. A successful instance status check proves neither that the application is ready nor that its dependencies are reachable. Define application readiness separately.

## .NET hosting, cost, and interview tradeoffs

For .NET, choose a supported runtime and patch it with the OS image. Framework-dependent deployment uses an installed runtime; self-contained deployment packages the runtime with the application but still needs security updates when rebuilt and redeployed. Run ASP.NET Core under a managed service/process supervisor, bind to the expected interface and port, handle termination gracefully, and expose a readiness endpoint. If requests are load-balanced, ensure the service stops accepting new work before shutdown and does not rely on local session state unless that state is deliberately managed.

The AWS SDK for .NET should use the default credential provider chain and the instance role in AWS. Avoid static access keys in configuration files, user data, AMIs, or environment variables. Keep startup scripts and user data free of secrets; user data can be exposed through instance-management paths and should not be treated as secret storage.

EC2 cost includes instance hours, attached storage and snapshots, data transfer, load balancing, and supporting telemetry. Rightsize based on observed utilization, shut down nonproduction fleets when possible, and compare the operational cost of EC2 against Fargate, ECS, or Lambda. EC2 offers control and compatibility, not automatically lower total cost. In an interview, explain which requirement needs VM-level control, how the fleet heals, where durable state lives, how it patches safely, and what metric drives scaling. Those answers reveal whether EC2 is an intentional choice or simply the most familiar one.

## Image pipeline, access, and recovery

Treat an AMI as a versioned release artifact. Build it from a reviewed base, apply OS and runtime updates, run vulnerability and configuration checks, and test application startup before promoting it. Keep image construction separate from production deployment so the same artifact can be promoted and identified during an incident. An instance launch template should capture networking, role, storage encryption, metadata options, and user-data behavior; review user data as code because it executes with host privileges and can expose configuration.

Prefer Systems Manager Session Manager or another audited access path for operations where available, with permissions limited to named operators and managed nodes. Avoid shared SSH keys and public admin ports. Use a break-glass process with logging, approval, and time-bounded access. A privileged operator can change an instance without changing the AMI, so detect and reconcile drift instead of letting undocumented snowflake hosts accumulate.

Recovery planning should distinguish instance recovery from data recovery. An Auto Scaling group can replace an unhealthy stateless node, but it does not restore a corrupted database or recover a deleted EBS volume. Use snapshots and application-consistent backups where required, and test that a restored resource can be attached, decrypted, mounted, and used by the application. For services that depend on local files or session data, either externalize that state or include explicit replication and recovery procedures.

When a fleet fails to launch or serve traffic, inspect the chain in order: Auto Scaling activity and launch errors, account quotas and capacity, subnet IP availability, launch-template version, AMI boot logs, instance/system status checks, IAM profile, security-group rules, target registration, and application readiness. Cloud-init/user-data failures can leave a host running but unusable. Build health checks that remove genuinely unhealthy hosts without causing a replacement storm during a shared dependency outage. Reserve capacity or diversify instance choices if a critical fleet cannot tolerate a single capacity type becoming unavailable.

For stateful legacy applications, explicitly document which directories must survive a restart and how they are backed up. A design that mounts an EBS volume may need AZ-aware recovery, attachment coordination, filesystem checks, and application-level consistency rather than simply relaunching the instance elsewhere. If the application stores session affinity or work queues locally, plan a migration to shared state or a deliberate replication protocol before scaling horizontally. These constraints often explain why a workload remains on EC2 temporarily, but should be visible technical debt with a recovery objective.

Capacity planning should include peak rather than average demand, startup time, deployment surge, and failover headroom. Instance family availability, account quotas, and placement constraints can prevent a desired fleet size from launching during a regional event. Review service quotas before a launch or migration and test the exact instance types and AZs expected. The operating model should also define how to roll back an AMI, replace an unhealthy fleet, and verify a release without relying on an individual operator’s console history.

## Related Topics

- [VPC](vpc.md)
- [ALB](alb.md)
- [ECS](ecs.md)
- [CloudWatch](cloudwatch.md)
- [IAM](iam.md)