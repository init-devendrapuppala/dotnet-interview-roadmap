# Discussing Your .NET Projects

Project deep-dives let an interviewer see how you make engineering decisions in real work. At four to six years of experience, be ready to explain a feature or service end to end: the need, your ownership, design choices, implementation, testing, release, and what happened afterward. You can use work, open-source, or substantial personal projects; label them accurately.

## A practical narrative outline

Prepare a five-to-ten-minute overview, then let questions guide detail:

1. **Purpose and users:** What problem did the system solve, and what did success look like?
2. **Context and constraints:** Team shape, broad scale, deadlines, legacy boundaries, reliability or compliance needs. Avoid confidential names and exact metrics you cannot share.
3. **Your role:** What you implemented, decided, reviewed, or operated, versus what the team owned.
4. **Architecture:** Describe the request or event path and the major boundaries. Explain why the design fit the requirements and what alternatives you considered.
5. **Implementation:** Discuss relevant .NET choices—ASP.NET Core pipeline, DI lifetimes, async I/O, data access, messaging, validation, or configuration—as applicable.
6. **Quality and operations:** Explain tests, deployment/rollback, logs/metrics/traces, and how failures were handled.
7. **Outcome and learning:** State the result honestly, how it was observed, and one trade-off or improvement you would make now.

A verbal diagram is useful: “The client calls the API; the handler validates and stores the command; an outbox publishes an event; a worker processes it…” Name only components that genuinely existed. Explain boundaries and failure behavior rather than listing fashionable technologies.

## Likely follow-up prompts

- “What was the hardest technical decision, and what alternatives did you reject?”
- “Where did data validation and authorization happen?”
- “What happens if the database commits but message delivery fails?”
- “How did you handle duplicate requests or retries?”
- “How did you know the query or endpoint was slow?”
- “What did you personally change after observing production behavior?”
- “If traffic or team size grew, what would you change first?”

For each answer, state the requirement first, then the mechanism and its trade-off. For example, an outbox can coordinate durable state changes and eventual publication, but it introduces dispatch, idempotency, and operational concerns. Do not claim exactly-once processing when the actual design provides at-least-once delivery plus deduplication.

## Show technical depth without overclaiming

Be precise about the .NET version and hosting/runtime context if relevant. Explain why a service lifetime was chosen, how cancellation flowed, whether LINQ was executed in the database or in memory, and what a retry policy did to load. If you do not remember a detail, separate remembered facts from what you would verify. A thoughtful correction is better than defending an inaccurate statement.

Protect confidentiality. Generalize customer identity and proprietary architecture, and use ranges or qualitative scale only when permitted. Do not expose credentials, internal endpoints, source code, or incident details that could identify a customer or compromise a system.

## Evaluation criteria

Strong project discussions show ownership calibrated to reality, coherent architecture, meaningful trade-offs, awareness of failure and operations, measurable or otherwise credible outcomes, and reflection. Interviewers may probe beyond your prepared story; consistency between your explanation and resume matters more than breadth of named technologies.

## Preparation worksheet

For two projects, write one sentence for each: user problem, your contribution, key design decision, failure mode, quality signal, outcome, and learning. Practice explaining a simple diagram from memory. Then ask a peer to challenge assumptions and identify where the explanation is vague.

## Related Topics

- [Behavioral questions](behavioral-questions.md)
- [System design case studies](system-design-case-studies.md)
- [Debugging scenarios](debugging-scenarios.md)
- [ASP.NET Core dependency injection](../aspnet-core/dependency-injection.md)
- [EF Core transactions](../entity-framework/transactions.md)
- [System design microservices](../system-design/microservices.md)