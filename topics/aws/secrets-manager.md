# AWS Secrets Manager

AWS Secrets Manager stores sensitive values such as database credentials, API tokens, and private configuration. Its purpose is to keep secrets out of source code, container images, and ordinary deployment settings while providing access control, encryption, auditability, and optional rotation workflows. Encryption does not itself grant or deny access; IAM, resource policies, and KMS key permissions remain part of the security boundary.

## Secret lifecycle

A secret can store a string or structured value, often as JSON for a username/password pair. Define a stable schema and a versioning plan so consumers know how to parse changes. Secrets Manager can rotate credentials through configured rotation workflows, often using Lambda for supported patterns. Rotation is not automatic merely because a secret exists: configure, test, monitor, and maintain the rotation process. Some credentials require coordinated updates at both the source system and the secret, and rotation can fail partway through.

Applications commonly cache retrieved values to avoid an API call for every request. Give the cache a bounded refresh interval, define behavior if refresh fails, and make sure a consumer eventually observes the new version. A process that caches credentials forever may fail after rotation; one that retrieves on every operation can add latency, cost, and throttling risk. Consider a short overlap or staged credential rotation when the underlying system supports it.

## .NET, security, and operations

Grant each workload access only to the required secret ARN and necessary KMS key actions. Restrict principals that can read, update, delete, or change rotation settings; the ability to alter a secret can be as sensitive as reading it. Use the workload’s temporary role credentials with the AWS SDK for .NET. Keep secret values out of logs, exception messages, traces, health endpoints, crash dumps, and telemetry. Private connectivity may require a VPC endpoint and correct DNS/route configuration; verify access from the same network context as the production workload.

In .NET, retrieve a secret at startup or through a supported cache with a deliberate refresh policy. If secret rotation changes a database password, pooled connections may continue using old authentication until they are reopened; coordinate cache refresh, pool clearing or connection replacement, and server-side overlap behavior. Handle throttling and transient service errors without retry storms, and do not silently continue indefinitely with a stale value when that compromises security or availability.

Secrets Manager has per-secret and API-call costs, so caching is usually sensible for hot reads. Monitor access failures, rotation status, and unusual reads using audit data such as CloudTrail. Test both successful rotation and a failed rotation/recovery scenario. Never assume that encryption at rest alone protects a secret from a principal with permission to retrieve it.

## Related Topics

- [IAM](iam.md)
- [RDS](rds.md)
- [ECS](ecs.md)
- [Lambda](lambda.md)
- [CloudFormation](cloudformation.md)