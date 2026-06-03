# ADR-006: Kafka as Optional Event Transport

**Date:** January 2026  
**Status:** Accepted  
**Author:** Akeem Amuni

---

## Context

The inventory system publishes domain events as side 
effects of stock movements. In the initial implementation 
these events are handled in-process using NestJS 
EventEmitter — a simple, zero-infrastructure event bus 
that works within a single Node.js process.

However the system is designed for eventual integration 
into a larger ERP. In that context, inventory events 
need to be consumable by external modules — a finance 
module that tracks cost of goods, a procurement module 
that auto-raises purchase orders on low stock, a 
notification service that alerts warehouse managers. 
These modules may run as separate services. An in-process 
event bus cannot cross service boundaries.

Additionally, in-process events are not persistent. If 
the application crashes between publishing an event and 
the handler completing its work, the event is lost. For 
an inventory system where every stock movement has 
financial consequences, silent event loss is a serious 
risk.

Kafka addresses both problems — it is a distributed 
event streaming platform that persists events to disk, 
supports multiple independent consumer groups, and 
allows events to be replayed from any point in time. 
But Kafka introduces operational complexity — it requires 
ZooKeeper or KRaft, it consumes significant memory, and 
it adds latency compared to in-process event handling. 
Requiring Kafka for local development and testing would 
slow down the development workflow significantly.

---

## Decision

We implement Kafka as an optional event transport 
activated by a single environment variable — 
`KAFKA_ENABLED=true`.

The event publishing system is built behind an 
`IEventPublisher` interface — a port in the hexagonal 
architecture sense. Two adapters implement this port:

`EventEmitterPublisher` — uses NestJS EventEmitter, 
works in-process, requires no external infrastructure, 
is registered by default when `KAFKA_ENABLED` is absent 
or false.

`KafkaPublisher` — uses `@nestjs/microservices` Kafka 
client, connects to an external Kafka broker, publishes 
events to named topics, is registered when 
`KAFKA_ENABLED=true`.

The selection happens at module initialisation in the 
NestJS dependency injection container via a factory 
provider. The application code — command handlers, 
domain event publishers — only knows about 
`IEventPublisher`. It never knows which transport is 
active. Switching transports requires changing one 
environment variable and restarting the application.

Kafka topic naming follows a consistent convention — 
`inventory.{event_name_in_snake_case}`. 
`StockReceivedEvent` publishes to 
`inventory.stock_received`. This convention is enforced 
programmatically by the `KafkaPublisher.resolveTopic()` 
method which derives the topic name from the event 
class name at runtime — no hardcoded topic strings 
anywhere in the codebase.

For Kafka consumers, the same handler classes that 
handle EventEmitter events are extended by Kafka-specific 
handler classes that use `@EventPattern` decorators 
pointing to the same topic names. The Kafka handler 
delegates to the parent handler's execute method — the 
business logic lives once in the base handler, the 
Kafka handler only adds the correct NestJS microservice 
decorator.

A custom `@KafkaPayload` parameter decorator replaces 
`@Payload` from `@nestjs/microservices`. This is 
necessary because `@Payload` relies on `reflect-metadata` 
for type resolution, which is stripped during the Nx 
build pipeline. The custom decorator explicitly receives 
the DTO class as a constructor argument, transforms the 
raw Kafka message using `class-transformer`, and 
validates using `class-validator` — with no dependency 
on metadata emission.

---

## Consequences

**Positive**

- Local development and testing use EventEmitter — zero 
  Kafka infrastructure required, fast test execution, 
  no Docker memory overhead from ZooKeeper and Kafka 
  broker
- Production uses Kafka — events are persistent, 
  replayable, and consumable by any subscribing service 
  without the inventory module knowing they exist
- The transport abstraction means the inventory module 
  is independently deployable in both configurations 
  without code changes
- Kafka topic contracts are the integration boundary 
  for the larger ERP. Any future module — procurement, 
  finance, notifications — subscribes to inventory 
  topics without requiring changes to the inventory 
  module
- Events published to Kafka survive application crashes 
  and can be replayed from any offset, providing 
  at-least-once delivery guarantees for financially 
  consequential stock movements

**Negative**

- Kafka operational complexity is real. A production 
  Kafka cluster requires careful configuration of 
  replication, retention, consumer group management, 
  and monitoring. This is accepted as a deployment 
  concern, not an application concern
- The `@EventPattern` decorator on Kafka consumer 
  handlers relies on metadata that can be stripped 
  by the Nx build pipeline. The custom `@KafkaPayload` 
  decorator mitigates the payload issue but the 
  pattern registration itself requires that 
  `emitDecoratorMetadata` is preserved through the 
  build — this is enforced in the SWC configuration 
  and verified in CI
- At-least-once delivery means handlers must be 
  idempotent — processing the same event twice must 
  produce the same result as processing it once. 
  The immutable ledger partially satisfies this — 
  duplicate ledger entries would be visible — but 
  full idempotency requires deduplication logic that 
  is noted as a future improvement

---

## Alternatives Considered

**RabbitMQ** — considered as the message broker. 
Rejected because RabbitMQ is optimised for task queues 
and request-reply patterns — messages are consumed and 
deleted. Inventory domain events are facts that happened. 
They should be persistent, replayable, and consumable 
by multiple independent subscribers simultaneously. 
Kafka's log-based storage model is the correct fit for 
domain event streams.

**Always-on Kafka (no EventEmitter fallback)** — 
rejected because it would require every developer and 
every CI run to have a running Kafka broker. The 
operational overhead is not justified for the development 
workflow. The transport abstraction achieves production 
capability without development complexity.

**Redis Pub/Sub** — considered for its simplicity. 
Rejected because Redis Pub/Sub does not persist messages. 
If no consumer is listening when an event is published, 
the event is lost. For inventory events with financial 
consequences, message loss is not acceptable in 
production.