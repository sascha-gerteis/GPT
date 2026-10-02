# Add-a-Game Contract — Skill Arcade V6.4

Future games should plug into the existing platform rather than inventing their own wallet or account model.

## Required game metadata

Add one registry entry in `platform.js` with:

- stable game key,
- display name / number,
- category,
- player count,
- estimated duration or `Last survivor`,
- one-sentence rule,
- concise controls,
- exact win/placement rule,
- path,
- payout ratios,
- thumbnail path.

## Required game behavior

- Same gameplay tools for every player in the same lobby.
- Clear placement logic.
- Result screen.
- Demo wallet settlement for competitive demo mode.
- Match history entry for competitive demo mode.
- `../match-bridge.js` loaded before `game.js`.
- Support `?entry=1|5|20`.
- Support `?autostart=1` so platform matchmaking can launch directly into the game.
- Practice must work through `?practice=1`; the bridge isolates wallet/history and labels the game as Practice.
- Third-person games must clearly mark the user's avatar with the shared YOU marker convention.

## Production requirements later

A live game must not trust the browser for position, collision, score, placement or settlement. It must emit a server-authoritative result linked to a stable match ID and game version.

## Do not add

- pay-to-win stats,
- purchasable gameplay advantages,
- random paid power-ups,
- hidden payout rules,
- client-authored balances or results.


## Map-pool requirement

If a new title uses multiple layouts, expose a stable map ID/name, choose one map for the entire lobby, avoid immediate repeats when practical, and store the selected map in the match record. Do not create cosmetic-only "maps" that change appearance while leaving misleading collision geometry.


## V6.4 competition standard

New competition games should target the current 12-player lobby standard unless a documented game-specific reason requires a different format. Payout ratios must total 95% of aggregate entry value, mobile controls must be supported, and third-person games should use the shared character/marker/polish layers where compatible.
