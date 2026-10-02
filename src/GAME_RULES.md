# Game Rules — V6.4 Online-Beta Reboot

All listed entry amounts and prizes are demo-only in this build. Standard demo competition lobbies now use **12 players** with a fixed 5% platform fee and a 95% top-three prize pool.

For the standard 12-player table, payout ratios are **6.00 / 3.40 / 2.00 × entry**. At a $1 demo entry that is $12.00 gross, $0.60 fee, $11.40 prize pool, and $6.00 / $3.40 / $2.00 displayed prizes.

| # | Game | Players | Core rule | Placement basis |
|---|---|---:|---|---|
| 01 | Floor Breaker | 12 | Shoot destructible floor blocks and avoid falling into lava. | Survival / final placement; current Block Crash-style rule set. |
| 02 | Obstacle Sprint | 12 | Race a larger 3D obstacle course. Falling returns the player to the latest checkpoint. | Finish order; if necessary, checkpoint/progress. |
| 03 | Knockout | 12 | Dash into opponents and launch them off the shrinking arena. No match timer decides the winner. | Survival / elimination order. |
| 04 | Bomb Tag | 12 | The bomb carrier must touch another player before the fuse expires. The fuse cycle repeats until one survivor remains. | Survival / elimination order. |
| 05 | Falling Tiles | 12 | Every map starts as a complete 19×19 floor. Tiles disappear only after being stepped on; variants change deterministic fall pacing. | Survival / elimination order. |
| 06 | Red Light Run | 12 | Move on green and stop on red across the enlarged course; moving on red resets progress. | Finish order, then course progress. |
| 07 | Coin Rush | 12 | Collect the most points across the larger arena during the 90-second round. | Score, then deterministic tiebreak. |
| 08 | Safe Zone | 12 | Reach the announced safe platform before unsafe platforms drop. Reaction time decreases until one player remains. | Survival / elimination order. |
| 09 | Wall Dodge | 12 | Move through the wall opening. Gaps tighten and walls speed up until one player remains; four hits eliminate a player. | Survival / elimination order. |
| 10 | Maze Rush | 12 | Navigate the larger maze and reach the exit. | Finish order, then remaining distance/progress. |
| 11 | Meteor Dodge | 12 | Leave telegraphed strike areas before impact. Strike density and speed increase until one player remains; four hits eliminate a player. | Survival / elimination order. |

## Shared competition rules
- Standard demo competition lobbies use 12 players.
- Elimination-survival titles (Knockout, Bomb Tag, Falling Tiles, Safe Zone, Wall Dodge and Meteor Dodge) do not settle on a time limit; elimination determines the final survivor and podium order. Floor Breaker retains its disclosed longer round clock and ranks remaining players under its published Block Crash-style rule when that clock expires.
- Race and score games may use a disclosed round limit where the game rule requires it.
- Lobby size and payout table are fixed and disclosed before match entry.
- All players receive the same base movement and abilities for a given game.
- No paid stat boosts are intended for cash competition modes.
- Top three placements receive the lobby's stated prizes.
- KOs, blocks destroyed, coins and similar gameplay statistics do **not** create hidden cash bonuses outside the displayed prize pool.
- Current demo bots exist only to make the prototype playable without full production matchmaking.
- Proposed live product uses real players and server-authoritative outcomes.

## Character and input standard

The V6.4 reboot adds a shared character system to the third-person games. Characters have distinct colors, silhouettes and accessories rather than color-only bean avatars. The controlled character retains a clear YOU marker.

Desktop uses the published keyboard controls. Touch devices receive a shared analog-style movement pad and context action button where the game has jump/dash. Floor Breaker retains its dedicated touch movement/look/fire/jump controls because it uses first-person aiming.

## Map / course variation

Variation is selected once for the whole match, never per player. The immediately previous layout is excluded from the next match where the pool contains multiple maps. Current pools:

- Obstacle Sprint: 8 enlarged courses
- Falling Tiles: 4 full-floor pacing layouts
- Safe Zone: 4 enlarged platform layouts
- Wall Dodge: 4 enlarged wall-pattern arenas
- Maze Rush: 12 enlarged maze layouts
- Meteor Dodge: 4 enlarged circular arena / deterministic strike variants

The map name is written to the demo match record where applicable. A production server should choose and lock the map ID/version for every player before the match starts.

## Practice mode

Every game also has a free Practice option using the same gameplay mechanics. In this prototype, Practice runs against local bots, does not deduct demo balance, does not pay prizes and does not write a competitive match to history.

## Proposed competitive match lifecycle

1. Player reviews rules and lobby economics.
2. Player joins matchmaking.
3. Player may cancel before the match locks/starts with no entry charged.
4. When the match starts, the entry is committed.
5. The game produces placement under the published rules.
6. Production integrity service verifies the result.
7. Settlement posts prize/fee/refund ledger transactions.
8. Player receives a match receipt and may submit a dispute.
