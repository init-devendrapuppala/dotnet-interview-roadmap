# Events

An event exposes a publisher-controlled notification mechanism based on delegates. Subscribers can add or remove handlers, but cannot invoke the event directly from outside its declaring type.

```csharp
public sealed class OrderProcessor
{
    public event EventHandler<OrderCompletedEventArgs>? Completed;

    public void Complete(int orderId) =>
        Completed?.Invoke(this, new(orderId));
}

public sealed class OrderCompletedEventArgs(int orderId) : EventArgs
{
    public int OrderId { get; } = orderId;
}
```

Events are synchronous unless the event contract explicitly uses another design: a slow handler blocks the publisher, and handler exceptions can propagate. Event invocation does not make subscription thread-safe in every surrounding operation. A long-lived publisher can keep subscribers alive through delegate references, so unsubscribe when lifetimes differ; lambdas are difficult to remove unless the delegate was retained.

Use events for in-process notifications with clear lifetime and threading semantics. For asynchronous work, backpressure, durability, or cross-process delivery, use a queue/message abstraction rather than treating events as a broker.

## Subscription lifetime and delivery semantics
An event is a publisher-controlled accessor around delegate subscription. Outside the declaring type, consumers can add or remove handlers but cannot invoke or replace the event. The conventional `EventHandler<TEventArgs>` shape identifies sender and event data, though a domain API can use another delegate when it improves clarity. The null-conditional invocation prevents a null dereference, but it does not make the entire publisher operation atomic with subscription changes.

Events are normally synchronous. Every handler runs on the publisher's calling thread, so slow work adds latency and a handler exception can prevent later handlers from running. If delivery must be durable, retried, bounded, or cross-process, use a queue or messaging system. If it is intentionally asynchronous, define ordering, error reporting, cancellation, and backpressure rather than silently launching unobserved tasks from a handler.

The publisher retains delegates, which retain their target objects. A long-lived publisher can therefore prevent a short-lived subscriber from being collected. Unsubscribe when lifetimes differ, use a disposable subscription token, or use weak-event patterns only when their added complexity is justified. Anonymous handlers are difficult to detach unless the delegate was saved. Thread safety around subscription and publisher state remains the application's responsibility.

An event is not the same as a public delegate field: the event restricts who can invoke it. It also is not a general-purpose observer framework with built-in scheduling or guaranteed delivery. Interview answers should state publisher/subscriber ownership, threading behavior, and cleanup expectations.
## Robust event patterns
A conventional event is a multicast delegate field guarded by `event` accessors, but custom accessors can implement specialized subscription storage or thread-safe add/remove behavior. The publisher should take a local snapshot before invoking when subscriptions can change concurrently; delegate invocation is immutable, so the snapshot avoids a null-check/invoke race. It does not synchronize other mutable publisher state.

```csharp
var handler = Completed;
handler?.Invoke(this, args);
```

This common pattern gives a consistent invocation list for that raise. It still runs handlers synchronously and a handler exception normally aborts later handlers. Decide whether subscriber failures propagate, are isolated and logged, or are reported through another mechanism; do not silently swallow them. If a subscriber is permitted to mutate publisher state during a callback, specify reentrancy expectations.

Event subscriptions are lifetime edges. In UI applications, dispose/unsubscribe when a view or component is removed. In services, consider returning an `IDisposable` subscription handle so callers can deterministically detach. Weak events solve one kind of retention but have more complex behavior and should not be the default. Avoid async void handlers outside framework-required event signatures; catch/report their failures inside the handler and coordinate cancellation/lifetime.

Events suit in-process notifications where publisher and subscriber share a process and synchronous semantics are acceptable. They do not provide persistence, replay, backpressure, distributed delivery, or automatic thread marshaling. Interview answers should state those limits and distinguish an event from a public delegate that anyone could invoke.
An event API should make ordering and reentrancy visible. A handler can subscribe/unsubscribe during a raise, and behavior should be predictable for the current invocation list and later raises. Avoid exposing event payload objects that the publisher will mutate after raising unless handlers are meant to observe shared mutable data. Immutable event data reduces races and makes notifications easier to test. Event naming conventions typically use past tense for completed facts and verbs for requested actions, but semantic clarity matters more than convention.
## Related Topics

- [delegates.md](delegates.md)
- [anonymous-methods.md](anonymous-methods.md)
- [threading.md](threading.md)
- [disposable-and-using.md](disposable-and-using.md)