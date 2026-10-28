# Amazon RDS

Amazon Relational Database Service (RDS) provides managed relational database instances and deployment options for supported engines. It handles infrastructure tasks such as provisioning, storage integration, backups, maintenance, and monitoring features so teams can focus more on schema, queries, and application behavior. RDS is suitable when the application benefits from SQL, relational constraints, and transactions but the team does not want to operate the entire database host stack. “Managed” does not mean the database is self-tuning, infinitely scalable, or free of recovery and upgrade responsibilities.

## Engine, deployment, and data design

Choose an engine and version based on application compatibility, required SQL features, driver support, operational expertise, licensing, and lifecycle policy. The relational model is valuable for enforcing invariants close to data and for joining related entities; design schema and indexes around actual query patterns. Review storage type, IOPS/throughput needs where configurable, instance family, maximum connections, and growth projections. CPU may appear low while latency is dominated by locks, storage waits, poor query plans, or connection saturation.

Multi-AZ deployment options improve availability through standby or replicated configurations depending on engine and selected mode. A standby used for failover is not automatically a read-scaling endpoint. Read replicas serve different purposes, commonly read scaling or replication use cases, and can have lag, promotion, consistency, and engine-specific limitations. Confirm exact semantics for the chosen engine and deployment mode rather than applying a generic assumption. Applications must reconnect after endpoint changes and tolerate failover interruptions.

RDS automated backups and snapshots support recovery, and point-in-time recovery can restore to a selected time within the configured backup window where supported. Recovery creates a database restore target; it is not an instantaneous undo and may require DNS/configuration cutover, validation, and data reconciliation. Define recovery point objective and recovery time objective, retain backups appropriately, and regularly perform restore exercises. A backup that has never been restored is an unverified assumption.

## Networking, security, and lifecycle

Place the database in private subnets and use a dedicated security group with inbound access only from application workloads that need it. A private endpoint is not authorization: network access, database authentication, and database grants all matter. Avoid public exposure unless an explicitly reviewed architecture requires it. Require TLS for application connections where supported and configure client certificate/hostname validation correctly. Encrypt storage and backups according to policy, and protect the KMS key permissions and lifecycle.

Store credentials in Secrets Manager or an approved credential system, not in source, images, or ordinary configuration. Rotation requires coordination: applications may hold pooled connections using the old secret, so provide refresh and reconnection behavior. IAM database authentication can reduce password handling for supported engines and use cases, but assess token lifetime, driver behavior, connection pooling, and operational complexity before adopting it. Restrict administrative database access and use separate application identities with least-privilege database grants.

Plan maintenance windows, engine upgrades, parameter groups, certificate updates, and deprecated-version support. Test upgrades against realistic schema and query workloads. Schema changes should use an expand/migrate/contract approach when old and new application versions overlap. A deployment rollback does not automatically reverse a destructive database migration.

## .NET connections and reliability

Use EF Core or a provider/driver compatible with the chosen engine. Keep a bounded connection pool and tune maximum connections in concert with RDS capacity and application replica count. Autoscaling application instances can multiply open database connections quickly. Use command timeouts and cancellation, and monitor pool exhaustion separately from database maximum connections. Avoid holding transactions open while waiting on remote services or doing user interaction.

Transient retries are appropriate only for errors known to be transient and operations that can safely be retried. A client timeout can occur after the database committed a write but before the client received the response; blindly retrying may duplicate the operation. Use idempotency keys, unique constraints, transaction design, or reconciliation for uncertain outcomes. Retry at one well-defined layer with bounded attempts and backoff rather than stacking retries in the SDK, ORM, and web controller.

Monitor CPU, freeable memory, storage capacity, I/O performance, connections, query latency, deadlocks, replica lag, failover, backup completion, and application-level request outcomes. Enable enhanced observability features selectively and control retention/cost. Use query plans and database-native diagnostics to find slow queries; instance scaling can hide rather than fix an inefficient query.

For .NET services, keep database calls asynchronous where supported, avoid synchronous blocking under load, and size thread pools and connection pools based on measurement. EF Core `DbContext` should have an appropriate request/job scope and must not be shared concurrently. Use migrations as reviewed deployment artifacts rather than allowing every application replica to race to modify production schema at startup.

## Cost and production tradeoffs

RDS costs include database compute, storage, I/O options, backups beyond included allowances, data transfer, and optional monitoring or replicas. Right-size using utilization and latency evidence, but retain recovery headroom and understand the performance impact of scaling changes. Read replicas may improve read capacity but add cost and consistency complexity; caching may reduce reads but shifts responsibility to invalidation and stale-data handling. For workloads exceeding service limits or requiring deeper host-level control, compare other deployment models while including their operational burden.

Production readiness means knowing who owns schema changes, credentials, backups, patch windows, failover, capacity, and query incidents. Interview explanations should distinguish Multi-AZ availability from read scaling, describe how .NET reconnects and manages pools, and state how an actual restore is tested.

## Related Topics

- [VPC](vpc.md)
- [Secrets Manager](secrets-manager.md)
- [CloudWatch](cloudwatch.md)
- [ElastiCache](elasticache.md)
- [IAM](iam.md)