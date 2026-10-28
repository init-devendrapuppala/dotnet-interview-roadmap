# AWS Identity and Access Management (IAM)

AWS Identity and Access Management (IAM) is the authorization system used to decide which principals can perform which actions on AWS resources. It is central to every production design because a workload’s credentials are its effective identity: overly broad permissions turn an application flaw into a larger account compromise, while missing permissions produce confusing runtime failures. IAM is not only a place to attach policies; it includes identity lifecycle, federation, role trust, temporary sessions, resource policies, and the organizational controls surrounding an account.

## Principals, credentials, and role assumption

IAM principals include users, roles, and AWS services. Human access should normally use a workforce identity provider or IAM Identity Center federation, with MFA and centrally managed lifecycle, rather than a collection of long-lived IAM user access keys. Applications and automation should obtain short-lived credentials by assuming a role or through a workload identity integration. Temporary credentials reduce the need to distribute and rotate embedded keys, although they still must be protected while in use.

A role has a trust policy that defines who or what may assume it and a permissions policy that defines what the assumed identity may do. These are separate questions. For example, an ECS task role’s trust relationship allows the relevant ECS task service to assume it; its permissions policy may allow that application to read one S3 prefix. Cross-account access commonly involves a caller being permitted to assume a target-account role and the target role trusting the intended source principal. Review both sides, the session conditions, and external-ID requirements where relevant.

For applications, use the execution environment’s supported identity source: EC2 instance profile, ECS task role, Lambda execution role, or EKS Pod Identity/IRSA as appropriate. The AWS SDK for .NET credential provider chain finds supported credentials for local development and deployed environments. Prefer the runtime role in AWS, avoid static keys in source, environment files, container images, user data, and CI logs, and verify that the role is the one the process actually receives. Local profiles should be scoped to development accounts and should not be copied into production.

## Policy evaluation and least privilege

An identity-based policy grants permissions to a principal. A resource-based policy grants access from the resource side for services that support it. Other controls can further limit effective permissions, including permissions boundaries, session policies, and AWS Organizations service control policies. An applicable explicit deny takes precedence over allows. The presence of an allow in one policy does not prove a request will succeed: resource policies, trust relationships, endpoint policies, organization guardrails, and service-specific authorization can all matter.

Policies describe `Effect`, `Action`, `Resource`, and optional `Condition`. Prefer specific actions and resource ARNs over broad `*` grants. Some APIs do not support resource-level restrictions and require `"Resource": "*"`, so constrain those actions with conditions and separate them from unrelated permissions rather than pretending every action can be scoped to an ARN. Conditions can limit access by principal, account, tags, source network, encryption context, or other supported request context. Confirm that the service actually supplies the condition key you rely on.

Least privilege is iterative. Start with the narrow workload function, test normal and failure flows, inspect CloudTrail and denied-action evidence, and refine policies. Avoid copying a broad managed policy simply to eliminate an error. Policy simulation and IAM Access Analyzer help find issues and possible exposure, but neither proves the complete application works securely. Avoid creating policy sets so complex that no operator can reason about effective access.

Separate identities by responsibility: application runtime, deployment pipeline, operators, and break-glass access should not share one all-powerful role. Protect `iam:PassRole`, role creation, policy attachment, trust-policy modification, and permission-boundary changes. A principal that can create a privileged role and pass it to a service may effectively obtain those permissions. Restrict resource creation to approved roles and conditions, and review privilege-escalation paths during design.

## Security, audit, and operating practice

Use MFA and federation for human access; require phishing-resistant controls where the organization’s identity platform supports them. Keep root-account use exceptional and protect its recovery channels. Eliminate old access keys, rotate any remaining keys with overlap and application validation, and monitor for anomalous use. CloudTrail records API activity and is essential for investigating which principal made a change; configure durable, protected audit retention appropriate to the environment.

Review role trust policies for wildcard principals and missing conditions. Require explicit approved principals and external IDs for third-party access when applicable. Use organization guardrails to prevent dangerous actions across accounts, while preserving a controlled exception process for platform needs. Resource policies should be reviewed for unintended public or cross-account access. IAM Access Analyzer can identify certain external access paths, but findings need ownership and remediation.

IAM failures often appear as `AccessDenied` in an application with little context. Diagnose the exact caller identity, action, resource ARN, Region, and request context. Check whether the request is made by the task role or an unexpected credential source; then review identity policy, trust policy, resource policy, boundary/session policy, service control policy, and endpoint policy. A deny can also be caused by a missing KMS permission or a resource encryption policy, not only the primary service action.

For .NET services, keep permission scope visible in infrastructure code and tests. Do not silently fall back to developer credentials in a deployed workload if role credentials fail. Avoid printing credential-provider diagnostics or tokens into application logs. Make permission failures observable with sanitized structured logs and alarms on repeated authorization failures, but do not expose internal account details to end users.

IAM itself does not add a per-request fee, but poor access design has significant incident and operational cost. The practical interview answer should name the principal, explain how credentials are obtained, identify the allowed actions and resource scope, describe any resource-based policy, and discuss how access is audited and revoked. “The app has an IAM role” is not enough; the role’s trust and permissions are both part of the security boundary.

## Policy structure and practical review

Prefer one policy per workload responsibility or a small set of clear statements rather than an opaque policy with unrelated permissions. Separate read and write operations when the application’s behavior allows it. Use tags and policy conditions for scalable account governance only when the resource service supports the required tag and request context consistently. Avoid wildcarding account IDs, role names, or actions as a shortcut for multi-account deployment; use parameterized but constrained deployment roles and verify rendered policies before release.

The `NotAction` and `NotResource` elements can express deny/allow boundaries, but they are difficult to reason about and may grant more than intended as AWS adds services or actions. Use them only when the policy model is well understood and reviewed. Explicit denies are useful for guardrails such as preventing public bucket policies or unencrypted resource creation, but an overly broad deny can break platform operations. Document the reason, scope, and exception path for each organization-level control.

Role sessions can carry session policies, tags, and source identity depending on how they are assumed. These features can support attribution and attribute-based controls, but only if callers populate and downstream policies enforce them correctly. Set session duration based on operational need and security posture; a shorter session limits exposure but does not replace credential protection. For cross-account roles, constrain the trusted account and principal, use an external ID for third-party access when applicable, and log source identity where supported.

## Testing and response

Test authorization as part of deployment and integration testing. Exercise both expected access and deliberate denial: an application should read its own secret, fail to read another service’s secret, and fail to publish to an unapproved queue. Policy simulation is useful for targeted questions, but actual service authorization can depend on resource policies, service-specific conditions, endpoint policies, and context unavailable to a simulator. Use a nonproduction account to verify the real SDK call path and role credentials.

During an incident, identify the exact principal and request before changing permissions. CloudTrail events, application logs, SDK request IDs, and the denied action/resource help distinguish a policy error from a missing resource or KMS key permission. Avoid responding to an `AccessDenied` by attaching administrator access. If credentials are suspected compromised, disable/revoke the source, restrict trust, rotate dependent secrets, and review CloudTrail for use; preserve audit evidence and restore only the minimum permissions required.

Build a regular review cadence for unused roles, stale access keys, trust relationships, high-risk permissions, and public resource policies. IAM Access Analyzer can help identify external access and generate policy recommendations, while last-accessed data can inform review; neither should be interpreted as a complete proof that a permission is unused or safe to remove. A staged removal with monitoring is safer than an untested bulk cleanup.

For a .NET team, make the expected role identity visible in deployment diagnostics without exposing credentials. A startup check can report the account and role identity after resolving credentials, and a deployment test can exercise a harmless read against the intended resource. This catches accidental use of a local profile, wrong account, or missing role before customer traffic does.

## Related Topics

- [ECS](ecs.md)
- [EC2](ec2.md)
- [Lambda](lambda.md)
- [EKS](eks.md)
- [Secrets Manager](secrets-manager.md)
- [CloudFormation](cloudformation.md)