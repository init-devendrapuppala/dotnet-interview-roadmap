# Amazon CloudWatch

Amazon CloudWatch is AWS’s native observability service for metrics, logs, alarms, dashboards, and related event-driven operations. Its purpose is to help teams detect abnormal behavior, investigate incidents, and understand resource utilization without operating a separate monitoring stack for every AWS service. CloudWatch is not a single telemetry format or a substitute for good instrumentation: service metrics, application logs, traces, and alerting each answer different operational questions.

## Metrics, logs, alarms, and dashboards

Metrics are time-series measurements identified by a namespace, metric name, and dimensions. Many AWS services publish standard metrics automatically; application metrics require instrumentation or an agent/collector. Dimensions let you slice a measurement by bounded attributes such as service, environment, or operation class. Avoid high-cardinality values such as request IDs or user IDs: they can generate large numbers of unique time series, increase cost, and make alarms difficult to interpret. Custom metrics and high-resolution measurements are useful when their decision value justifies their ingestion and retention cost.

CloudWatch Logs organizes events in log groups and streams. Set retention explicitly instead of assuming logs are kept forever. Logs Insights supports interactive queries and aggregations over retained data; it is valuable during incident response but not always the right long-term analytics or compliance archive. Subscription filters can forward matching events to supported destinations for processing, but delivery, permissions, quotas, and downstream failure behavior need operational review.

Alarms evaluate a metric or metric-math expression over periods and can notify or trigger supported actions. Set the period, evaluation count, threshold, and missing-data treatment according to the signal. Missing data can mean the service is idle, telemetry is broken, or a component is unavailable; one default does not fit every alarm. Dashboards help responders see related signals together, but a dashboard is useful only if it presents the service’s user-visible health and key dependencies rather than every available metric.

## .NET instrumentation and security

For .NET services, emit structured logs with stable field names, severity, service/environment identifiers, and a correlation or trace ID. Record useful context such as operation, dependency outcome, and duration, while excluding credentials, access tokens, sensitive personal information, and unnecessarily complete payloads. Use OpenTelemetry-compatible instrumentation where distributed traces and standard metrics are required, and configure an explicit exporter or collector path. Logs alone do not automatically become traces, and trace context must be propagated across HTTP, messaging, and background work.

Choose how the application ships telemetry—such as a CloudWatch agent or a supported OpenTelemetry collector/export path—based on runtime, hosting model, and operational ownership. Batch and buffer where appropriate to reduce API overhead, but size buffers and shutdown flush behavior so process termination does not silently lose important data. Grant workloads only the permissions needed to publish or read their telemetry. Restrict log-group access, use encryption where required, and review cross-account access and export policies.

## Alerting, reliability, and cost

Alert on actionable service-level indicators: availability, latency, error rate, saturation, and queue age are usually more useful than isolated CPU thresholds. Pair each paging alarm with an owner and response procedure. Tune thresholds using real baselines, test alarm actions, and review false positives; excessive noisy alarms train teams to ignore the signal. Use composite alarms or grouping where they reduce duplicate pages without hiding independent failures.

CloudWatch operates across Regions and accounts with service-specific scope and feature differences. When centralizing telemetry, account for cross-account permissions, data movement, retention, and regional outages. Monitor ingestion throttling and failures as well as the workload itself. A logging outage should not take down request processing; applications should fail safely when telemetry delivery is impaired.

Costs can arise from metric ingestion and storage, log ingestion and retention, queries, dashboards, alarms, and data transfer or exports. Control cost by filtering noisy logs at source, choosing retention by operational/compliance need, avoiding unbounded dimensions, and reviewing query patterns. Do not solve cost by removing the telemetry needed to diagnose an outage. Establish a minimum useful set of metrics, logs, traces, and tested alarms, then expand based on operational evidence.

For incident readiness, verify telemetry from a deployed instance or task rather than only testing local output. Confirm that clocks are sensible, trace context survives queue and HTTP boundaries, log groups receive events, and alarm notifications reach the on-call channel. Document which dashboard is authoritative for each service objective and rehearse a query against a known failure example. The ability to produce a chart is less valuable than the ability to identify ownership and next action.

## Related Topics

- [ALB](alb.md)
- [Lambda](lambda.md)
- [ECS](ecs.md)
- [SQS](sqs.md)
- [VPC](vpc.md)