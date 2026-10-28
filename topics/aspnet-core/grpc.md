## Why choose gRPC

gRPC uses HTTP/2, Protocol Buffers, generated client/server contracts, and strongly typed service methods. It is a good fit for efficient service-to-service communication, streaming, and environments where clients can use generated stubs. It is not automatically the best public browser API: browser support and infrastructure constraints may require gRPC-Web or a JSON/HTTP API, and contract evolution needs discipline.

An RPC service derives from generated code and is mapped into the ASP.NET Core endpoint pipeline:

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddGrpc();
var app = builder.Build();
app.MapGrpcService<GreeterService>();
app.Run();
```

The actual service implementation derives from the generated base class and returns protobuf messages. Keep `.proto` files as versioned contracts; add fields with new field numbers and never reuse removed field numbers. Use deadlines/timeouts and propagate cancellation. A client timeout does not guarantee server work instantly stops, so service code should observe the cancellation token and make side effects safe under retries.

gRPC status codes communicate RPC outcomes and are not identical to HTTP status semantics. Use interceptors for cross-cutting concerns such as tracing, but keep authorization explicit and enforce it on the server. Secure transport with TLS, authenticate calls, and do not assume internal network placement is a trust boundary. Observe latency, status codes, payload sizes, and streaming resource usage.

Operationally, verify that load balancers, proxies, service meshes, and ingress support HTTP/2 end-to-end where required. Streaming calls occupy connections and can be long-lived; apply limits and graceful shutdown handling. Use gRPC-Web only where its supported transport semantics meet client needs.

## RPC shapes and contract evolution

Protobuf service definitions express unary calls and client-, server-, or bidirectional-streaming calls. Unary RPCs are straightforward request/response operations; streams can reduce repeated setup and support incremental delivery, but keep connections and server resources occupied. Define message schemas around stable business contracts rather than mirroring database tables. Add optional fields using new field numbers, reserve removed field numbers and names, and never reuse a field number because old serialized data may still contain it.

Generated code gives compile-time types, but it does not eliminate semantic versioning. A new field may be wire-compatible yet still change client behavior if defaults are interpreted differently. Document enum evolution and unknown values; consumers should handle values they do not recognize. Keep `.proto` files under source control and use compatibility checks when schema changes are reviewed.

## Deadlines, errors, and security

Every client call should have a deadline appropriate to the operation. Propagate deadlines and cancellation through server code so downstream work can stop when the caller no longer needs it. A timeout does not prove a side effect did not happen: callers may retry after the server committed work but before the response arrived. Use idempotency keys or idempotent operations where retries can duplicate changes.

Use gRPC status codes to communicate contract-level outcomes; do not leak exception messages or stack traces as status details. Apply authentication and authorization to services and methods. TLS provides transport protection, while identity and policy determine who may invoke a method. Interceptors are useful for shared telemetry or correlation, but should not become an opaque substitute for explicit access policy.

Operational testing should include load balancer HTTP/2 support, maximum message sizes, concurrent streams, deadlines, cancellation, graceful shutdown, and behavior when a dependency slows. A production gRPC service should expose metrics and traces by method and status without high-cardinality user identifiers. For browser consumers, compare gRPC-Web and a conventional HTTP API based on client support, streaming requirements, and gateway constraints.

## Related Topics

- [Web APIs](./web-api.md)
- [Kestrel](./kestrel.md)
- [Authentication](./authentication.md)
- [OpenAPI and Swagger](./openapi-swagger.md)
- [WebSockets](./websockets.md)