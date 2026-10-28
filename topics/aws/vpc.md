# Amazon Virtual Private Cloud (VPC)

Amazon Virtual Private Cloud (VPC) provides a logically isolated network for AWS resources. It defines address ranges, subnet placement, routing, and network-level controls that determine how workloads reach one another, AWS services, on-premises environments, and the internet. VPC design is foundational: an incorrect CIDR or route strategy can constrain future growth, while an apparently simple security-group change can expose a whole workload tier. A VPC is not automatically private or secure simply because it is logically isolated.

## Addressing, subnets, and route tables

A VPC has an IPv4 CIDR range and can have IPv6 ranges. Select a sufficiently large, non-overlapping address plan before deployment, accounting for subnets, future services, peering, VPN, and organizational connectivity. Overlapping CIDRs make direct routing between networks difficult and can require translation or redesign. Subnets are created within a single Availability Zone and consume address space; AWS reserves some addresses in each subnet, so a subnet’s nominal capacity is not entirely assignable. VPC-attached services such as ECS tasks, EKS pods, and Lambda ENIs can consume addresses quickly.

Each subnet is associated with a route table. A subnet is conventionally called **public** when its route table provides a path to an internet gateway and its resources have the addressing needed for internet reachability. A subnet is not public merely because it has a public-sounding name, and a route to an internet gateway alone does not give every resource an externally reachable address. Private subnets commonly use a NAT gateway for outbound IPv4 access while lacking a direct inbound internet route. Isolated subnets have no general internet route, though they may still route to internal networks or VPC endpoints.

An internet gateway provides a VPC-level path for eligible internet traffic. A NAT gateway allows private-subnet resources to initiate IPv4 connections outward while preventing unsolicited inbound connections through that path; it is not an application firewall. NAT gateways incur hourly and data-processing charges and create AZ/route design choices. A single NAT gateway can lower fixed cost but makes other AZs dependent on cross-AZ routing and on that gateway’s availability. Per-AZ NAT gateways improve fault isolation but cost more. Decide based on availability requirements and traffic patterns, and monitor bytes, errors, and route behavior.

## Security groups, network ACLs, and endpoints

Security groups are stateful virtual firewalls attached to supported resources/network interfaces. They allow rules for traffic; response traffic for an allowed connection is tracked. Use narrow inbound rules and reference peer security groups where appropriate: for example, let an application tier accept HTTP only from the ALB security group, and let a database accept its port only from the application security group. Security-group rules are not ordered, and an omitted allow means the traffic is not permitted.

Network ACLs are stateless subnet-level filters with ordered allow and deny rules. Because they are stateless, both request and return traffic—including ephemeral ports—must be accounted for. NACLs can provide broad subnet controls but are easier to misconfigure than security groups; they do not replace host, application, or identity authorization. Use them when their subnet-wide filtering capability is intentional and maintainable.

VPC endpoints connect to supported AWS services without requiring the same public internet/NAT path. Gateway endpoints and interface endpoints differ in supported services, routing, DNS, security groups, and billing. Endpoint policies can constrain service access but do not grant IAM permissions on their own. Verify private DNS behavior and ensure the application’s DNS resolver and routes select the expected endpoint. Endpoint availability and quotas must be included in the architecture; do not assume every AWS API or third-party dependency is reachable privately.

## Connectivity and architecture patterns

Internet-facing ALBs are usually placed in public subnets across multiple AZs; application services and databases can remain in private subnets. Internal ALBs serve VPC-connected clients. Use separate subnets for different tiers when that helps route, capacity, or policy management, but do not fragment the address plan so aggressively that scaling becomes impossible. Keep IPv6 behavior explicit: an IPv4 NAT design does not automatically describe IPv6 egress controls.

VPC peering provides private connectivity between two VPCs but is not transitive by default and has route/CIDR constraints. AWS Transit Gateway offers a hub-and-spoke model for many VPCs and networks, at additional cost and operational complexity. Site-to-Site VPN connects over encrypted tunnels across the internet; Direct Connect provides dedicated network connectivity but does not inherently encrypt traffic. These options solve different latency, throughput, topology, and operational needs. Plan DNS resolution, route propagation, security controls, and failure behavior in addition to establishing connectivity.

## Security, reliability, and diagnostics

Use explicit ingress and egress paths, least-open security-group rules, centralized account guardrails, and controlled administrative access. Private-subnet placement is not a security guarantee: broad egress can still permit exfiltration or access to unintended services. Apply IAM least privilege separately from network controls; both can be required for a request. Consider VPC Flow Logs for traffic metadata and investigation, understanding that they are not packet capture and do not necessarily reveal application-level causes. Restrict access to flow logs and set retention according to need.

Common failures include subnet IP exhaustion, incorrect route-table association, asymmetric routing, missing NAT routes, blocked ephemeral return traffic in NACLs, DNS misconfiguration, overlapping CIDRs, incorrect security-group references, endpoint policies that omit required actions, and AZ concentration of a shared egress path. When diagnosing, verify DNS resolution, source/destination addresses and ports, route selection, security groups on both ends, NACL rules, endpoint/NAT path, and application listener behavior. Test from the same subnet, security groups, and DNS environment as the failing workload.

Availability requires redundancy for network paths and the services using them. Deploy across AZs when the workload supports it, consider per-AZ egress for critical systems, monitor NAT and endpoint metrics, and test AZ impairment behavior. A healthy VPC does not imply a healthy application; correlate network signals with ALB, container, database, and application telemetry.

## .NET and AWS workload considerations

For .NET apps on EC2, ECS, EKS, or Lambda, verify access to AWS APIs used by the SDK, package repositories, external APIs, identity endpoints, and telemetry services. A workload in private subnets may need NAT or a service-specific VPC endpoint for an API; missing egress often first appears as SDK timeouts. Avoid granting broad outbound access merely to make startup succeed. Use DNS and route configuration that matches deployment, and keep connection and request timeouts bounded.

Lambda VPC attachment enables access to private resources but changes networking and address consumption considerations; it does not automatically grant internet access. ECS tasks and EKS pods can allocate VPC addresses based on their network mode and CNI behavior, so include peak task/pod scale in subnet capacity planning. A scale-out event that exhausts IP addresses can leave workloads unable to start even when compute is available.

Costs include NAT gateway hours and data processing, interface endpoint hours/data, cross-AZ and data transfer, Transit Gateway attachments/processing, and logging. Use endpoints selectively: they may reduce NAT transfer cost or improve path control, but multiple endpoint interfaces have their own cost. Interview explanations should distinguish routing from security, public/private subnet definition, SG from NACL behavior, and the availability/cost implications of egress architecture.

## Design and change management

Treat CIDR allocation and route ownership as shared platform design, not a local application detail. Reserve ranges for future AZs, endpoint interfaces, growth in pod/task counts, and connectivity to corporate or partner networks. Record which team owns each route table, security group, endpoint policy, and DNS zone. Prefer reusable infrastructure modules with explicit inputs over undocumented console edits. Before changing routes, model the source, destination, next hop, and return path; a route can affect more workloads than the resource that motivated the change.

Separate network controls by trust boundary, but avoid relying on subnet placement as the only isolation mechanism. Use security groups to describe permitted peer-to-peer paths and IAM to control API actions; an application request often needs both. Consider egress filtering or controlled proxy patterns when the workload must not reach arbitrary destinations. Review flow logs and DNS logs where useful, but remember that flow metadata is not the same as a complete packet-level record and may not identify an application-layer cause.

Plan DNS explicitly for private hosted zones, hybrid resolution, and VPC endpoints. A service may have a correct route but still fail because it resolves a public name or stale address. Conversely, private DNS can redirect a standard AWS service name to an endpoint that does not have the needed policy or connectivity. Test name resolution from the actual runtime and confirm which resolver answers each query. Account for split-horizon DNS and record ownership across accounts.

During a migration or AZ incident, validate that traffic can fail over through all dependent layers: load balancer subnets, application tasks, database paths, egress, and DNS. Cross-AZ routing can preserve service but add cost or create a hidden single-AZ dependency. Periodically test loss of a NAT path, endpoint, or application subnet in a controlled environment. For critical services, document alternate routing and recovery rather than assuming AWS will transparently reroute every customer-managed path.

## Related Topics

- [EC2](ec2.md)
- [ALB](alb.md)
- [ECS](ecs.md)
- [EKS](eks.md)
- [RDS](rds.md)
- [IAM](iam.md)
- [CloudWatch](cloudwatch.md)