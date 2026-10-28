# AWS Lambda

AWS Lambda runs code in response to events without requiring the application team to manage a fleet of servers. A function has a runtime, handler, architecture, memory and timeout configuration, environment, and execution role. Lambda is useful for event processing, scheduled tasks, lightweight APIs, and workloads whose demand is variable or naturally event-driven. It shifts server provisioning and much of runtime infrastructure operations to AWS, but application teams still own code, dependency behavior, concurrency safety, security, and event semantics.

## Invocation models and event behavior

An invocation can be synchronous, asynchronous, or driven through an event-source mapping. With a synchronous request-response integration, the caller waits for the function’s result and observes errors according to the integration. Asynchronous invocation queues an event internally and may retry failures according to configured behavior. Event-source mappings poll sources such as SQS or streams and invoke the function with batches; checkpointing, partial batch failure handling, ordering, and retry behavior depend on the source. Never assume every trigger has identical delivery or retry semantics.

Events may be duplicated, delayed, or redelivered after a timeout or failure. Make handlers idempotent when they produce side effects: use a durable idempotency key, conditional write, or transactional pattern appropriate to the data store. For batch sources, one poison record can cause repeated batch work unless partial batch responses or another deliberate failure strategy are configured. Route exhausted failures to a dead-letter queue or failure destination where supported, monitor it, and define a replay process. A DLQ is not a fix unless someone can inspect and safely recover messages.

Lambda scales by adding execution environments up to applicable account, function, and event-source limits. Concurrency is the number of simultaneous executions and directly affects downstream pressure. Reserved concurrency can reserve capacity for a function or cap it to protect a database; it can also throttle otherwise valid traffic if set too low. Provisioned concurrency keeps configured capacity initialized to reduce startup latency for suitable workloads, but it costs money while provisioned. Neither setting replaces load testing or a downstream capacity plan.

## Runtime, networking, and security

Cold-start behavior depends on runtime, package, initialization, networking, and concurrency patterns. Keep initialization efficient and reuse safe SDK clients across warm invocations. Do not retain request-specific mutable state in static fields: an execution environment can be reused for later invocations. Set a timeout that bounds work and leaves adequate time for cleanup. If a function is placed in a VPC to reach private resources, plan subnet IP capacity, security groups, DNS, routes, and outbound connectivity. VPC attachment does not automatically provide internet egress; NAT or service endpoints may be needed depending on the destination.

Each function should have a least-privilege execution role, with permissions limited to the exact resources and actions it needs. Restrict who can update code, configuration, layers, and role assignment. Keep secrets in a managed store rather than treating ordinary environment variables as a secret vault, and account for how a rotated value is refreshed by a running execution environment. Encrypt sensitive data and avoid writing credentials or complete sensitive events to logs.

## .NET implementation

Use the supported .NET Lambda runtime and AWS Lambda tooling/package format appropriate for the function. For API request handlers, keep response serialization, authorization, error mapping, and timeout assumptions aligned with the API Gateway integration. For background handlers, treat the event contract as versioned input and validate it before side effects. Use `async` I/O to avoid blocking threads while waiting on AWS or network calls; set per-dependency timeouts shorter than the function’s remaining execution time.

Instantiate clients and immutable configuration outside the handler when safe to reuse, but avoid assuming a warm environment is permanent. Use cancellation tokens and ensure they actually reach downstream operations. If work may exceed the function timeout or needs durable workflow state, use an orchestrator or queue-based design rather than trying to keep one invocation alive. Test both cold and warm execution paths, architecture/runtime compatibility, payload limits, and concurrent requests. The AWS SDK should resolve credentials from the execution role rather than static application keys.

## Reliability, observability, and tradeoffs

Monitor errors, duration percentiles, throttles, concurrent executions, timeouts, event-source age/backlog, and failure destinations. Distinguish handler errors from a dependency timeout and from a trigger’s delivery problem. Structured logs should include request or event correlation identifiers, function version, and sanitized business context. Alarm on user-visible effects and stalled work, not only invocation count. Establish retention and access controls for logs, which may contain event data.

Typical failure modes include a retry storm that multiplies a downstream outage, a function timeout after a side effect but before acknowledgment, exhausted concurrency, a poison message blocking a batch, VPC misconfiguration, and a dependency that is slower than the function’s configured deadline. Use bounded retries, jitter where retries are application-controlled, circuit breakers or concurrency limits when appropriate, and idempotent writes. A successful invocation metric does not guarantee that the business transaction completed as intended.

Lambda pricing is based on requests and execution resources/time, with additional cost for logs, networking, and provisioned capacity. For short or bursty work, it can reduce idle server operations; for a continuously busy or long-running process, containers or EC2 may be a better operational or cost fit. Evaluate latency, concurrency, runtime limits, state requirements, and downstream capacity rather than equating “serverless” with no limits or no operations.

## Related Topics

- [API Gateway](api-gateway.md)
- [SQS](sqs.md)
- [SNS](sns.md)
- [S3](s3.md)
- [IAM](iam.md)
- [CloudWatch](cloudwatch.md)