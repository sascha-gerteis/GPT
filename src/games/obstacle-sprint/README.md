# Obstacle Sprint - Game 02

12-player deterministic obstacle race for the Skill Arcade demo.

- 150 second maximum round.
- First three finishers fill the podium and settle the match.
- If time expires first, finished racers rank first and the remaining racers rank by checkpoint/course progress.
- Falling respawns the player at the most recent checkpoint.
- Identical movement capability for all players.
- Fixed obstacle cycles; no random power-ups.
- Uses the shared beta-credit profile and CR 1 / CR 5 / CR 20 lobby tiers.

## V2.1 gameplay polish

- Distinct 3D racers with accessories, faces, animated limbs, and a YOU marker.
- Chase camera moved closer and centered directly behind the controlled racer.
- More forgiving movement acceleration/braking and reduced player-to-player shoving.
- Jump buffer and coyote-time support for easier platform jumps.
- Sweeper collision now matches the visible bar height/width; visibly jumping over it is safe.
- Moving gate and pusher collision bounds now match their rendered geometry much more closely.

Launch from the root `START_ARCADE.bat`.
