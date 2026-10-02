# Game Rules — Current Prototype

All listed entry amounts and prizes are demo-only in this build. Top three placements receive the displayed demo prizes.

| # | Game | Players | Core rule | Placement basis |
|---|---|---:|---|---|
| 01 | Floor Breaker | 5 | Shoot destructible floor blocks and avoid falling into lava. | Survival / final placement; current Block Crash-style rule set. |
| 02 | Obstacle Sprint | 8 | Race a 3D obstacle course. Falling returns the player to the latest checkpoint. | Finish order; if necessary, checkpoint/progress. |
| 03 | Knockout | 8 | Dash into opponents and launch them off the shrinking arena. No match timer decides the winner. | Survival / elimination order. |
| 04 | Bomb Tag | 8 | The bomb carrier must touch another player before the fuse expires. The fuse cycle repeats until one survivor remains. | Survival / elimination order. |
| 05 | Falling Tiles | 8 | Every map starts as a complete floor. Tiles disappear only after being stepped on; map variants change deterministic fall timing/pacing. | Survival / elimination order. |
| 06 | Red Light Run | 8 | Move on green and stop on red; moving on red resets progress. | Finish order, then course progress. |
| 07 | Coin Rush | 8 | Collect the most points from coins before the timer ends. | Score, then deterministic tiebreak. |
| 08 | Safe Zone | 8 | Reach the announced safe platform before unsafe platforms drop. Reaction time decreases until one player remains. | Survival / elimination order. |
| 09 | Wall Dodge | 8 | Move through the wall opening. Gaps tighten and walls speed up until one player remains; three hits eliminate a player. | Survival / elimination order. |
| 10 | Maze Rush | 8 | Navigate the maze and reach the exit. | Finish order, then remaining distance/progress. |
| 11 | Meteor Dodge | 8 | Leave telegraphed strike areas before impact. Strike density and speed increase until one player remains; three hits eliminate a player. | Survival / elimination order. |

## Shared competition rules
- Survival games do not settle on a time limit. They continue until elimination determines the final survivor and podium order.
- Lobby size and payout table are fixed before match entry.
- All players receive the same base movement and abilities for a given game.
- No paid stat boosts are intended for cash competition modes.
- Top three placements receive the lobby's stated prizes.
- Current demo bots exist only to make the prototype playable without matchmaking.
- Proposed live product uses real players and server-authoritative outcomes.

## Map / course variation

Variation is selected once for the whole match, never per player. The immediately previous layout is excluded from the next match where the pool contains multiple maps. Current pools:

- Obstacle Sprint: 8 courses
- Falling Tiles: 4 floor layouts
- Safe Zone: 4 platform layouts
- Wall Dodge: 4 wall-pattern arenas
- Maze Rush: 12 maze layouts
- Meteor Dodge: 4 circular arena themes / deterministic strike-sequence variants

The map name is written to the local demo match record for audit/dispute review. Counsel should advise whether an approved cash mode may use a published map pool, whether the selected map must be disclosed before entry, and whether map selection itself should be committed by the server before matchmaking locks.

## Practice mode

Every game also has a free Practice option using the same gameplay mechanics. In this prototype, Practice runs against local bots, does not deduct demo balance, does not pay prizes and does not write a competitive match to history.

## Proposed competitive match lifecycle

1. Player reviews rules and lobby economics.
2. Player joins matchmaking.
3. Player may cancel before the match locks/starts with no entry charged.
4. When the match starts, the entry is committed.
5. The game produces placement under the published rules.
6. Production integrity service would verify the result.
7. Settlement posts prize/fee/refund ledger transactions.
8. Player receives a match receipt and may submit a dispute.
