# Inventory entity detail fixtures

Captured live from `GET /inventory/{entity_type}/{uid}` on 2026-08-10.
Owner/commander/pilot identities, crew lists and infotext are scrubbed.

| Fixture | Demonstrates |
| --- | --- |
| `ship-idle.json` | baseline ship, no actions |
| `ship-sublight-travel.json` | SublightTravelAction |
| `facility-mining.json` | MiningAction, running |
| `station-multi-action.json` | two actions; production has no status/delay |
| `station-producing.json` | EntityProductionAction with producing.entity |
| `npc.json` | race, gender, level, skills |
| `planet.json` | planetaryStats, deposits |
| `facility-mining-paused.json` | MiningAction, paused |
| `creature.json` | hp + skills, no hull/shield |
| `material.json` | quantity, no creationdate |
| `item.json` | minimal entity |
| `droid.json` | droid baseline |
| `city.json` | buildings, layout |
| `vehicle.json` | vehicle baseline |
| `ship-asteroid-mining.json` | AsteroidMiningSoloAction (5th action type) |
| `station-asteroid-deposits.json` | asteroid station: deposits but no actions |
| `ship-cargo-delay.json` | CargoDelayAction (6th action type, timer-only) |
| `facility-producing-batch.json` | EntityProductionAction, 12 entities in one action |
| `facility-mining-deposits.json` | facility deposits have no x/y |
| `facility-construction.json` | FacilityConstructionAction (7th type); truncated facilityincome |
| `facility-unpowered.json` | ispowered=No, poweredby absent |
| `ship-asteroid-prospecting.json` | AsteroidProspectingAction (8th type) |
| `npc-producing.json` | EntityProductionAction on an NPC: no quantity/workers/producing |
| `npc-mining-worker.json` | MiningAction on an NPC worker; shares action id with the facility |
| `droid-mining.json` | MiningAction on a droid, stripped variant |
| `item-cargo-container.json` | cargo container: entitytype/maxuses/remaininguses inside cargo |
| `facility-powergen.json` | power generator: energyremaining, no ispowered/poweredby |
| `facility-powered-consumer.json` | consumer: ispowered=Yes, poweredby -> the generator above |
