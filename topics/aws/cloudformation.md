# AWS CloudFormation

AWS CloudFormation is an infrastructure-as-code service that provisions and updates AWS resources from declarative templates. Its purpose is to make infrastructure repeatable, reviewable, and recoverable as software delivery evolves. Rather than relying on a console operator to remember every setting, a team can version the desired configuration, review changes, and deploy consistent stacks across accounts and environments. CloudFormation coordinates resource APIs and dependencies; it does not guarantee that every update is non-disruptive or that all external effects can be rolled back.

## Templates, stacks, and lifecycle

A template describes resources, properties, parameters, conditions, mappings, and outputs. A stack is the managed deployment unit created from a template. CloudFormation determines resource dependencies, creates and updates resources, and reports progress through stack events. Parameters supply explicit deployment-time values; outputs expose selected values such as an endpoint. Cross-stack references and exports can be useful, but they create coupling: one stack may be difficult to change or remove while another consumes its export.

Design stack boundaries around lifecycle and ownership. A single enormous stack can slow reviews and make unrelated changes risky; many tiny stacks can create dependency sprawl and difficult coordination. Nested stacks and reusable modules can organize common infrastructure, while StackSets can deploy supported stacks across accounts and Regions. Keep account, Region, environment, and ownership assumptions explicit. Prefer stable identifiers and avoid using stack outputs as an informal application configuration store.

Before applying an update, review a change set to understand additions, modifications, replacements, and removals. A property change may require replacement of a resource; that can briefly interrupt service, change endpoints, or destroy data if retention and migration are not planned. A rollback attempts to restore infrastructure state, not application data or an external action already taken. For stateful databases and buckets, plan backups, retention, migrations, and recovery separately. Use deletion policies and update-replace policies intentionally—retaining a resource can prevent data loss but may also leave resources that require deliberate cleanup.

## Safe delivery and security

Use a controlled CI/CD workflow: validate template syntax and policy, review a change set, require appropriate production approval, and deploy the same versioned artifact through environments with environment-specific inputs. Avoid embedding production credentials in templates, parameters, outputs, or logs. Resolve secrets at runtime from Secrets Manager or another suitable secret store. A CloudFormation execution/service role should have only the permissions needed to provision the stack. Restrict who can update production stacks and who can pass that role; a broad pass-role permission can effectively grant broad infrastructure authority.

Stack policies can protect selected critical resources from updates or deletion initiated through a stack operation, but they are not a replacement for IAM permissions and backups. Use resource policies and IAM boundaries according to your organization’s deployment model. Tag resources for cost allocation, ownership, and operations. Treat template repositories and deployment identities as production security assets because they define the account’s infrastructure.

## Drift, failures, and operations

Drift detection compares supported resource properties with the template and can identify some out-of-band changes. It does not cover every resource property or prove that application behavior matches the intended design. Decide whether emergency console changes should be reconciled into code or reverted. Review stack events and the underlying service’s events when an operation fails; the first failed resource often provides more useful detail than the final rollback message. A failed rollback may leave a stack in a state requiring explicit recovery rather than an immediate retry.

For .NET teams, the AWS SDK for .NET exposes CloudFormation APIs, but routine infrastructure mutation from request-handling application code is usually a poor fit: it mixes runtime permissions and application release cadence with privileged infrastructure changes. Prefer an IaC pipeline, with SDK use reserved for deliberate automation such as an approved deployment controller. Keep application deployment and infrastructure deployment coordinated where schema or endpoint compatibility matters.

Cost is primarily the cost of provisioned resources and related operations, not a reason to provision unused infrastructure. Review replacement behavior, idle resources, quotas, deployment duration, and cross-stack dependencies during design. CloudFormation improves consistency only when templates, permissions, approvals, and recovery procedures are maintained together.

For interview scenarios, explain what the deployment pipeline validates, how a reviewer sees destructive replacements, how production updates are authorized, and what happens when rollback itself fails. Mention that drift detection covers supported properties rather than every possible out-of-band change, and that stack rollback cannot reverse application data mutations. These distinctions show practical understanding beyond template syntax.

## Related Topics

- [IAM](iam.md)
- [VPC](vpc.md)
- [Secrets Manager](secrets-manager.md)
- [CloudWatch](cloudwatch.md)