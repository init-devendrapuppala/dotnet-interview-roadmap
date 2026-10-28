## Why use SignalR

SignalR supports real-time server-to-client communication and can fall back among transports such as WebSockets, Server-Sent Events, and long polling as client/server capabilities allow. Hubs provide a higher-level RPC-style programming model; they are not durable message queues and do not guarantee that disconnected clients receive every event.

```csharp
builder.Services.AddSignalR();
var app = builder.Build();
app.MapHub<NotificationsHub>("/hubs/notifications")
   .RequireAuthorization();
app.Run();

public sealed class NotificationsHub : Hub
{
    public Task JoinOrder(string orderId) =>
        Groups.AddToGroupAsync(Context.ConnectionId, $"order:{orderId}");
}
```

Authorize hubs and, where needed, individual hub methods. Validate client-supplied group names and resource access; a group is a routing convenience, not an authorization boundary. Protect state-changing hub calls from abuse with validation and rate/capacity controls. Avoid storing connection state only in process memory if multiple replicas are used.

Scale-out requires a supported backplane or managed SignalR service so messages reach connections on other instances. A backplane distributes messages; it does not make application state durable. Proxies and load balancers must support the chosen transport, and WebSockets may require correct upgrade forwarding and connection timeouts. Long-lived connections affect capacity and graceful deployment; clients should reconnect with backoff and refresh credentials safely.

Use SignalR for transient updates; if a notification must not be lost, persist it and let clients recover through an API or durable event mechanism. Monitor connection count, transport selection, reconnects, and delivery latency.

## Hub execution and connection state

A hub is a transient interaction abstraction, not a long-lived per-user object. Do not store durable state in hub instance fields; a hub instance may be created for invocations and can run on different servers. Use `Context.ConnectionId` for a connection-specific operation and `IHubContext<T>` from application services or hosted workers to send messages outside a hub invocation. Groups are useful for routing to related connections, but membership is generally transient and must be restored after reconnect.

Authorize hub connections and individual methods when their permissions differ. A connection authenticated at establishment can remain connected after account permissions change, so consider token expiration, revalidation, or disconnect policy for sensitive systems. Do not trust a client-provided group name or resource identifier: verify that principal may join or receive updates for that resource. Group membership is not a security boundary by itself.

## Delivery, scale, and client behavior

SignalR provides real-time delivery to connected clients but is not a durable queue. Disconnected clients can miss messages. For important updates, persist an event/state change and let clients reconnect, fetch current state, and resume from a cursor or sequence where appropriate. Design clients to handle duplicate/out-of-order updates if the business workflow can produce them.

In a multi-instance deployment, use a supported scale-out option such as a backplane or managed SignalR service so messages reach connections on other instances. A backplane distributes transport messages; it does not make application state durable or guarantee exactly-once delivery. Confirm proxy support for the selected transport and understand whether sticky sessions are required by the specific deployment arrangement. Plan for long-lived connections when scaling, draining, and deploying. Reconnect policies should use backoff and jitter to avoid a reconnect storm.

Observe active connections, transport fallback, reconnect rate, send failures, and message latency. Limit message size and invocation frequency, validate all client input, and propagate cancellation. A useful interview response covers hub lifecycle, groups versus authorization, scale-out, and why a disconnected user cannot rely on a transient push message as their only source of truth.

## Related Topics

- [WebSockets](./websockets.md)
- [Authentication](./authentication.md)
- [Authorization](./authorization.md)
- [Kestrel](./kestrel.md)
- [Message queues](../system-design/message-queues.md)