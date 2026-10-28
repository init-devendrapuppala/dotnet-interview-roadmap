# Observer Pattern

Observer establishes a one-to-many dependency: a publisher notifies subscribers when something happens, without knowing their concrete types. Use it for in-process notifications where subscribers need to react independently. The motivation is to avoid hard-coding every interested component into the publisher: adding a subscriber should not require changing the publisher's knowledge of the system. The pattern does not prescribe asynchronous execution, delivery guarantees, or persistence; those are separate design decisions.

## C# example

```csharp
public sealed class OrderPlacedEventArgs(Guid orderId) : EventArgs
{
    public Guid OrderId { get; } = orderId;
}

public sealed class OrderService
{
    public event EventHandler<OrderPlacedEventArgs>? OrderPlaced;

    public void Complete(Guid orderId) =>
        OrderPlaced?.Invoke(this, new OrderPlacedEventArgs(orderId));
}
```

Subscribers use `service.OrderPlaced += HandleOrderPlaced` and must unsubscribe when their lifetime ends if the publisher can outlive them. In UI applications, framework-specific weak-event mechanisms may help with long-lived publishers. A subscriber can be attached with a named handler and later removed using the same delegate. The publisher and subscribers communicate through event data rather than concrete subscriber types.

This standard C# event is synchronous. Invoking it calls handlers on the publisher's thread, and the publisher does not continue until each returns. If the event represents a state change, decide whether it is raised before or after state is committed and whether subscriber failure can affect the operation. For required workflows, a direct method call with a result may express the dependency more accurately.

## Tradeoffs and distinctions

- C# events are synchronous: a slow handler delays the publisher, and a thrown handler can interrupt invocation. Decide explicitly whether subscribers are allowed to fail the initiating operation.
- For asynchronous or cross-process work, use a queue or event bus with defined delivery, retry, and durability semantics. `async void` event handlers do not provide reliable coordination.
- Observer describes notification to subscribers. Mediator centralizes component interactions; a mediator may offer notification fan-out, but it is not inherently distributed.
- Avoid using events for required control flow that callers must await or for state changes that should be transactionally persisted.
- .NET's `IObservable<T>`/`IObserver<T>` provide a subscription abstraction with completion and error signals, whereas C# events are a simpler delegate-based notification mechanism. Choose based on lifecycle and stream semantics rather than treating them as identical.

An event can also create ordering and lifetime ambiguity. Multicast delegate invocation follows subscription order in common C# usage, but application correctness should not depend on incidental order unless the contract explicitly defines it. If independent subscribers need isolation, invoke them through a deliberate dispatcher or queue instead of assuming ordinary events isolate exceptions.

## Testing and production pitfalls

Test that the event is raised with the correct data and that subscribers react as intended. Ensure tests unsubscribe or create short-lived publishers to prevent state leaking between tests. For background subscribers, test retry and failure handling at the messaging boundary rather than assuming ordinary C# events provide it. Include tests for repeated subscription if duplicate handling would be harmful, and for events not being raised when an operation fails before completion.

Production pitfalls include a long-lived publisher retaining subscribers and preventing garbage collection, handlers throwing unexpectedly, slow handlers increasing request latency, and subscribers performing unobserved asynchronous work. Dispose subscriptions or provide an explicit subscription token for long-lived relationships. Do not use `async void` merely to make an event handler asynchronous: callers cannot await completion and exceptions may escape normal handling. For durable work, persist an event/outbox record or publish through a reliable messaging system.

Document whether the notification is advisory or part of a required contract. Advisory observers can often fail independently; required participants should usually be represented by explicit awaited calls or durable messages with visible failure handling.

Consider concurrency too: a publisher may raise notifications from multiple threads unless its contract says otherwise, so subscribers that mutate shared state must synchronize it. Avoid changing subscriber lists while invoking if the event library or custom publisher does not safely support that lifecycle. Establish whether payload data is an immutable snapshot or a mutable object shared among handlers; mutable shared event data can produce order-dependent behavior.

In an interview, identify publisher, subscriber, event data, and delivery model. State whether subscribers are allowed to influence the publisher's operation. Use observer for decoupled in-process reactions, not as a substitute for transactional workflow orchestration.

## Related Topics

- [Mediator](mediator.md)
- [Events](../csharp/events.md)
- [Delegates](../csharp/delegates.md)
- [Message Queues](../system-design/message-queues.md)