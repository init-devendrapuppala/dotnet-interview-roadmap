## Purpose and safe scope

Retries can mask transient failures such as brief network interruption or throttling. They do not make an operation reliable by themselves, and they can amplify an outage. A retry is safe only when the operation is idempotent or protected by a durable idempotency key. A timeout does not prove that the server did not commit.

## Policy

Set a finite attempt count and an overall deadline. Use exponential backoff with jitter to avoid synchronized retry bursts:

```text
delay = random(0, min(maxDelay, baseDelay * 2^attempt))
```

Honor server guidance such as `Retry-After`; classify transient versus permanent failures. Do not retry validation/authentication errors, most 4xx responses, or an operation after its caller deadline. Consider retry budgets so retries remain a small share of total traffic.

## Layering and failure modes

Retries at a gateway, service, SDK, and database driver can multiply attempts. Assign a clear owner for retry policy and count total worst-case attempts. Retry only the failed unit of work; do not repeat an entire workflow after a partially completed side effect. For asynchronous consumers, broker redelivery is already a retry mechanism—coordinate it with application-level attempts.

Retries can worsen overload, hide slow dependencies, and extend resource occupancy. Combine short timeouts, bounded concurrency/bulkheads, circuit breakers, and load shedding where appropriate. A retry storm often appears as increasing latency, queue depth, and request volume during a dependency outage.

## .NET guidance

For outbound HTTP, use `IHttpClientFactory` and a configured resilience pipeline in .NET. Define timeout and retry behavior per dependency and operation, propagate `CancellationToken`, and avoid retrying non-idempotent POSTs without an idempotency contract. A caller cancellation should normally stop further attempts. Instrument attempts separately from logical requests.

## Interview checks

Ask what errors are retryable, how the operation handles ambiguous completion, what the maximum elapsed time is, and how retry traffic is bounded. For a payment or order command, use a client-supplied or generated idempotency key stored with the result, so a safe retry returns the prior outcome rather than performing the action twice.

## Quantify the cost

State maximum attempts and elapsed time, including retries at lower layers. For an idempotent operation, store the key and final outcome durably enough that a retry after a timeout can return the original result rather than repeat a side effect.

## Related Topics

- [Circuit Breaker](circuit-breaker.md)
- [Message Queues](message-queues.md)
- [API Gateway](api-gateway.md)
- [Distributed Transactions](distributed-transactions.md)
