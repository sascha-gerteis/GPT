# Proposed Audit & Match Integrity Design

The browser demo displays simulated Match IDs and audit IDs. Production must replace this with server-generated records.

## Per-match record

- match ID,
- game ID,
- game build/version hash,
- lobby/entry tier,
- player IDs,
- server region,
- authoritative start/end timestamps,
- validated input/event stream or replay record,
- disconnect/reconnect events,
- final placement,
- integrity/risk flags,
- settlement status,
- wallet transaction IDs.

## Authority model

The client sends inputs. It must not decide:

- its own position,
- collisions,
- eliminations,
- score,
- placement,
- prize,
- wallet balance.

Those outputs should be generated/validated by authoritative services.

## Anti-cheat controls to evaluate

- impossible speed/acceleration checks,
- input-rate limits,
- tamper detection,
- bot/automation signals,
- device/account linkage,
- multi-account detection,
- collusion graph analysis,
- repeated opponent/fund-transfer patterns,
- abnormal win-rate/rating patterns,
- replay/event review tools.

## Settlement integrity

A result should settle only after:

1. game server signs/finalizes placement,
2. integrity service accepts or marks it for review,
3. settlement service posts ledger entries idempotently,
4. receipt is generated from settled ledger/result data.


## Map / ruleset integrity

Every production match record should also include:

- map pool version,
- selected map ID and human-readable map name,
- selection timestamp,
- server-side selection seed or commitment if randomness is used,
- exact collision/physics ruleset version,
- checksum/hash of the map definition served to every participant.

This allows a disputed result to be replayed against the exact layout used in the match.
