# ADR-005: CQRS with @nestjs/cqrs

**Date:** January 2026  
**Status:** Accepted  
**Author:** Akeem Amuni

---

## Context

The inventory system has two fundamentally different 
categories of operations. Some operations change state — 
creating a purchase order, dispatching a transfer, approving 
a cycle count. Others read state — getting current stock 
levels, retrieving movement history, calculating inventory 
valuation. These two categories have different performance 
characteristics, different consistency requirements, and 
different reasons to change.

Write operations must be correct. A stock balance updated 
incorrectly has financial consequences. An adjustment 
recorded against the wrong warehouse corrupts the audit 
trail. Write operations involve domain validation, 
aggregate state transitions, event publishing, and 
transactional persistence. They are complex by necessity.

Read operations must be fast and flexible. A reporting 
query that joins balances, products, and ledger entries 
across multiple filters does not need to go through the 
same aggregate loading and validation machinery as a 
write. Forcing reads through the same path as writes adds 
latency and complexity without adding correctness.

In a standard service-based architecture, a single service 
class accumulates both read and write methods. Over time 
the service becomes a coordination point for every concern 
that touches a given entity. Testing write logic requires 
understanding read dependencies. Adding a new read 
optimisation risks affecting write behaviour. The 
distinction between what changes state and what does not 
becomes unclear.

---

## Decision

We apply CQRS — Command Query Responsibility Segregation 
— using the `@nestjs/cqrs` module.

Every operation that changes state is expressed as a 
Command. Commands are plain data classes carrying the 
input needed to execute the operation. Each command has 
exactly one handler that loads the relevant aggregate, 
calls the domain method, persists the result, and 
publishes any domain events.

Every operation that reads state is expressed as a Query. 
Queries are plain data classes carrying filter parameters. 
Each query has exactly one handler that reads from the 
appropriate repository and returns a response DTO.

Commands and queries are dispatched through separate buses 
— `CommandBus` and `QueryBus`. Controllers inject both 
buses. They never inject handlers directly. The bus 
connects the controller to the handler without the 
controller knowing which handler will execute or where 
it lives.

Commands return either nothing or a minimal identifier 
— the ID of the created resource. They do not return 
full domain objects. If the controller needs to return 
the created resource in the response, it dispatches a 
subsequent query after the command succeeds.

Query handlers read directly from repositories. They 
do not load aggregates through the domain. They return 
DTOs shaped for the client's needs. For complex reporting 
queries — inventory valuation, movement history with 
filters, low stock alerts — the query handler works 
directly with the data layer without going through 
aggregate boundaries that would add unnecessary overhead.

---

## Consequences

**Positive**

- The intention of every operation is explicit in its 
  name. `ConfirmGoodsReceiptCommand`, 
  `GetInventoryValuationQuery`, `ApproveCycleCountCommand` 
  — reading the command and query list gives a complete 
  picture of what the system can do and what it can answer
- Write logic and read logic are independently testable. 
  Command handler tests assert on aggregate state changes 
  and published events. Query handler tests assert on 
  returned DTOs. Neither requires the other to be present
- Read optimisations do not risk write correctness. A 
  query handler can be rewritten to use a raw SQL query 
  or a materialised view without touching any command 
  handler
- Adding a new operation is always an addition — a new 
  command or query class and a new handler. No existing 
  code is modified. This matches the open-closed principle 
  and makes the addition safe
- The `CommandBus` and `QueryBus` are the only coupling 
  between controllers and handlers. Controllers do not 
  import handlers. If a handler moves, is renamed, or is 
  split, the controller is unaffected

**Negative**

- More files per feature. A single operation requires 
  a command or query class, a handler class, and often 
  a DTO class. For simple CRUD operations this is 
  disproportionate overhead
- The indirection through the bus makes call stacks 
  less immediately traceable in a debugger compared 
  to a direct service call
- The pattern of dispatching a query after a command 
  to return the full resource in an HTTP response adds 
  a second database round trip for every create and 
  update operation. This is a deliberate trade-off — 
  the command returns an ID, the query returns the 
  resource — accepted because the alternative is 
  blurring the command/query boundary

---

## Alternatives Considered

**Standard service classes** — rejected because services 
accumulate both read and write responsibilities over time, 
creating coordination points that are difficult to test 
and reason about independently.

**Full event sourcing** — considered as the natural 
complement to CQRS. Rejected because event sourcing 
rebuilds aggregate state by replaying all historical 
events, which adds significant infrastructure complexity 
— event store, snapshot strategy, replay mechanisms. 
The immutable ledger in this system provides the audit 
and historical query capabilities that motivate event 
sourcing without requiring the full event sourcing 
infrastructure. CQRS without event sourcing is a 
deliberate and well-established choice for systems 
that need command/query separation but do not require 
aggregate state to be rebuilt from events.