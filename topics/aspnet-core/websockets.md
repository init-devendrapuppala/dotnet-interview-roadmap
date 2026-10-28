## Why choose WebSockets

WebSockets provide a persistent, full-duplex connection over a single TCP connection after an HTTP upgrade. They suit interactive, low-latency communication but introduce long-lived connection management, capacity planning, reconnect behavior, and deployment complexity. Use SignalR when its higher-level hubs, transports, and client libraries fit; use raw WebSockets when protocol control is required.

In ASP.NET Core, accept only requests that meet the application's upgrade and security policy:

```csharp
app.UseWebSockets();
app.Map("/ws", async context =>
{
    if (!context.WebSockets.IsWebSocketRequest)
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        return;
    }

    using var socket = await context.WebSockets.AcceptWebSocketAsync();
    var buffer = new byte[4096];
    var result = await socket.ReceiveAsync(
        new ArraySegment<byte>(buffer), context.RequestAborted);
    if (result.MessageType == WebSocketMessageType.Close)
        await socket.CloseAsync(WebSocketCloseStatus.NormalClosure,
            "Closing", CancellationToken.None);
});
```

This abbreviated handler receives only one frame; production code must loop until a complete message, handle fragmented frames, bound message size, and handle close/error states. Authenticate and authorize before accepting, validate the `Origin` where browser clients are involved, and do not treat origin checks as authentication. Browser cookies are sent during the handshake, so CSRF-like cross-site connection concerns matter.

Pass cancellation through I/O, apply idle/connection limits, and coordinate heartbeat, proxy, and load-balancer timeouts. A proxy must forward the upgrade. Deployments need graceful draining; reconnecting clients should use exponential backoff and avoid overwhelming the service. In a multi-instance deployment, sticky sessions may help some transport arrangements but do not distribute application messages; use an appropriate backplane/service when broadcast across replicas is required.

Never assume a WebSocket connection is permanent or that messages are durable. Persist critical events and design reconnect/resynchronization behavior.

## Message loop and resource controls

The abbreviated example only receives one frame and is not a production protocol. A complete handler must continue until a close message or cancellation, handle fragmented messages, enforce a maximum accumulated message size, and distinguish text/binary/close frames. Do not allocate an unbounded buffer based on client input. If the application protocol needs request/response semantics, define message types, validation, error behavior, and protocol versioning explicitly.

WebSockets are persistent connections, so concurrent connection count consumes server and proxy capacity even when traffic is idle. Set sensible keepalive/idle timeouts, heartbeat behavior, per-user connection limits, message-rate limits, and maximum payload size. Backpressure matters: if a slow client cannot consume messages, queue growth can exhaust memory. Prefer bounded queues and a clear drop/disconnect policy rather than unbounded buffering.

## Authentication and deployment boundaries

Authenticate and authorize before accepting the upgrade whenever possible. Validate `Origin` against trusted browser origins to reduce cross-site WebSocket hijacking risk when cookies authenticate the handshake; this is not authentication and non-browser clients can set arbitrary origin headers. Avoid query-string bearer tokens because URLs are commonly logged. Use normal secure credential transport and do not assume authorization at connection time remains valid forever.

Ingress and load balancers must forward the HTTP upgrade and keep the connection open for the expected duration. TLS termination, idle timeouts, connection draining, and rolling deployments need end-to-end testing. A process restart will terminate sockets; clients should reconnect with exponential backoff and jitter, reauthenticate, and resynchronize their state. Sticky sessions route a client's connection to one instance, but do not distribute events across instances; use a backplane or managed service when cross-instance broadcasts are required.

Raw WebSockets give protocol control but require careful handling of transport state, reconnection, and fan-out. SignalR provides a higher-level abstraction, fallback transports, and client libraries, though its deployment and scale-out still need planning. Pick based on protocol requirements, not only on perceived performance. For guaranteed delivery, persist the event or state and let the client recover after reconnect.

## Related Topics

- [SignalR](./signalr.md)
- [Kestrel](./kestrel.md)
- [Authentication](./authentication.md)
- [Rate limiting](./rate-limiting.md)
- [Message queues](../system-design/message-queues.md)