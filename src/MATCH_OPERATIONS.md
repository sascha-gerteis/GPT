# Draft Match Operations, Disconnects & Refunds

## Match states

1. `LOBBY_OPEN`
2. `MATCHMAKING`
3. `READY_LOCKED`
4. `STARTED`
5. `RESULT_PENDING`
6. `SETTLED`

Exceptional states:

- `NO_CONTEST`
- `INTEGRITY_REVIEW`
- `REFUND_PENDING`
- `REFUNDED`

## Before start

A player may cancel during matchmaking before `READY_LOCKED` without a charge.

## After start

### Player voluntarily disconnects

Default proposal: the match continues and the player receives the placement/forfeit treatment defined by the game rules. No automatic refund.

### Individual network failure

Default proposal: reconnect grace may be supported where technically fair. If reconnect is not possible, normal game placement applies unless the platform can prove an operator-side failure affected that player.

### Platform-wide/server failure

If a trustworthy result cannot be produced, set the match to `NO_CONTEST` and refund all entries.

### Partial operator infrastructure failure

Hold settlement under `INTEGRITY_REVIEW`. Do not automatically pay or refund until event logs show whether a fair result can be reconstructed.

### Suspected cheating/collusion

Hold affected settlement and preserve inputs/event logs/replay/security signals for review.

## Refund ledger

Refunds must be separate ledger transactions linked to the original entry and match ID. Never silently edit or delete the original entry record.

## Counsel decisions required

- required reconnect window,
- mandatory refund situations,
- maximum review time,
- complaints/escalation timeline,
- whether undisputed prizes can settle while another participant is under review,
- disclosure wording required before entry.
