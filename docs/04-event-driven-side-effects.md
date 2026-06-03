# ADR-004: Event-Driven Side Effects

**Date:** January 2026  
**Status:** Accepted  
**Author:** Akeem Amuni

---

## Context

Several operations in the inventory system have consequences that extend beyond the primary operation itself. When goods are received against a purchase order, the stock balance must increase and a ledger entry must be written. When a transfer is dispatched, the source warehouse balance must decrease. When a cycle count is approved, balances must be corrected for every line with a variance. When any downward movement occurs, the system must check whether the balance has dropped below the reorder point and create or resolve a stock alert accordingly.

The naive implementation is to put all of this inside the command handler directly, receive goods, update balance, write ledger entry, check reorder point, create alert, all in sequence inside one method. This works at small scale but creates several problems as the system grows.

First, the command handler accumulates responsibilities that do not belong to it. Confirming a goods receipt is a receiving concern. Updating a stock balance is an inventory concern. Creating a stock alert is an alerting concern. Mixing them 
means a change to alerting logic requires modifying the receiving handler.

Second, the side effects are tightly coupled to the trigger. If the business later needs a new consequence when goods are received, updating a procurement forecast, notifying a supplier portal, triggering a replenishment order, the receiving handler must be modified every time. Over time it becomes a coordination point that every team touches.

Third, in a distributed system or a system that will eventually become distributed, side effects that cross service boundaries cannot be executed synchronously inside a command handler without creating tight coupling between services.

---

## Decision

We separate side effects from commands using domain events.

Command handlers execute the primary operation, load the aggregate, call the domain method, persist the updated aggregate. After persisting successfully, the handler publishes a domain event describing what happened. The event is a plain data class carrying everything downstream handlers need to react.

Side effect handlers subscribe to domain events and execute their specific consequence independently. The `StockBalanceUpdateHandler` subscribes to all movement events and handles ledger writes and balance updates. The low-stock alert check is merged into the same handler, running against the already-updated in-memory balance immediately after the balance is applied, inside the same database transaction, eliminating the race condition that would occur if a separate handler read the balance from the database after the first handler had written it but before the transaction was visible.

The event is only published after the primary persistence succeeds. If the command handler fails before publishing, no side effects fire and no partial stateexists. 
The ordering is:
- Load aggregate
- Call domain method: Aggregate validates and updates state
- Persist aggregate: If this fails, stop here
- Publish domain event: Only fires if persistence succeeded
- Side effect handlers react asynchronously

This ordering guarantees the aggregate is always in a consistent state before any side effect occurs.

---

## Consequences

**Positive**

- Command handlers have a single clear responsibility, execute the primary operation and publish an event. They do not accumulate side effect logic over time
- New side effects are additions not modifications. A new handler that subscribes to `StockReceivedEvent` can be added without touching the receiving command handler or any existing handler
- Side effects are independently testable. The balance update handler can be tested by constructing an event directly and asserting on the database state, no need to execute the full command pipeline
- The same event contracts that drive in-process handlers drive Kafka topics. When the system integrates with external services like procurement, finance, notifications, they subscribe to the same events without the inventory module knowing they exist
- The dual-transport design means the event-driven architecture works in development with zero infrastructure (EventEmitter) and in production with full persistence and replay capability (Kafka)

**Negative**

- Asynchronous side effects mean the HTTP response returns before balance updates are visible. For the vast majority of use cases this is acceptable, a goods receipt confirmation does not need to wait for the balance update before returning. For use cases that require immediate consistency, this requires careful consideration
- Debugging event-driven flows requires tracing across multiple handlers rather than following a single call stack. Structured logging with correlation IDs mitigates this but adds setup overhead
- The race condition between two handlers listening to the same event, one updating the balance, one checking the reorder point against the database, required merging them into a single handler. This is the correct solution but it means the clean separation of concerns between balance updates and alerting is achieved at the code organisation level rather than the handler level

---

## Alternatives Considered

**Synchronous side effects inside command handlers:** Rejected because it couples unrelated concerns and creates a handler that grows without bound as the system adds features. Every new consequence of a stock movement would require modifying the movement handler.

**Two separate handlers for balance updates and alert checks:** Considered and rejected due to the race condition. When both handlers subscribe to the same event and run concurrently, the alert handler may read the pre-update balance from the database before the balance handler has committed its transaction. Merging them into one handler and running the alert check against the in-memory balance solves this without sacrificing the architectural intent.

**Process manager / saga pattern:** Considered for orchestrating the multi-step consequences of events. Rejected as over-engineering for the current scope. The side effects in this system are simple and do not require compensating transactions or complex state machines. The saga pattern adds significant complexity that is only justified when side effects can fail independently and require rollback coordination.
