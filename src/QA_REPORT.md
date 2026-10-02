# QA Report — V6.4 12-Player Gameplay Reboot / Online Beta

## Static release checks completed

- JavaScript syntax checked for platform code, all 11 game scripts, shared character kit and shared mobile controls.
- All 11 game registries use a 12-player standard competition lobby.
- 12-player payout math reconciles to a 95% prize pool after the displayed 5% fee: ratios 6.00 / 3.40 / 2.00.
- Floor Breaker KO events no longer add a hidden cash-like bonus outside the disclosed top-three payout pool.
- Shared third-person character kit is loaded by the non-first-person titles and preserves existing animation aliases.
- All non-first-person games retain a visible YOU marker.
- Shared touch controls synthesize the same movement/action inputs consumed by desktop logic; Floor Breaker keeps its dedicated touch implementation.
- Obstacle Sprint enlarged-map transform scales platforms, rails, gates, pushers, sweepers, checkpoints and paths together.
- Falling Tiles starts every match with the complete 19×19 floor; no map begins with pre-cut holes.
- Safe Zone platform visuals and safe hitboxes were re-aligned after the arena-size increase.
- Wall Dodge wall geometry, gap positions, movement clamp and trigger/remove bounds were updated together for the wider arena.
- Meteor Dodge retains radial arena clamping and uses lower early strike density before escalating.
- Bomb Tag, Knockout, Falling Tiles, Safe Zone, Wall Dodge and Meteor Dodge retain last-survivor settlement behavior rather than hidden timeout settlement.
- Rotating-map helper still excludes the immediately previous map where multiple layouts exist.
- Real-money launch configuration remains disabled in the online-beta build.

## Environment limitation

A headless Chromium screenshot/render pass was attempted in the build environment but timed out with browser/DBus errors. Therefore this report does **not** claim full automated visual-browser QA. Static code/path/syntax/economy checks passed; real-device desktop/mobile playtesting is still required before an external gameplay pilot.

## Still not production-validated by this browser prototype

- authoritative real multiplayer networking,
- production anti-cheat and replay verification,
- reconnect/latency/load behavior at 12 simultaneous real players,
- real KYC / age verification,
- real geolocation,
- payment custody / deposits / withdrawals,
- regulatory classification or jurisdiction approval,
- penetration testing, load testing, observability and incident response.

These items must be completed before enabling any real-money competition.

## V6.5 Mobile / Arcade QA
- Fixed Floor Breaker touch-control visibility conflict caused by the shared polish layer.
- Floor Breaker now clears joystick/fire/key state on elimination, blur and hidden-tab transitions.
- Shared mobile controls only become interactive during gameplay; lobby/result overlays cannot be covered by the joystick layer.
- Shared controls use pointer capture/release, safe-area positioning, visual viewport resize handling and orientation recovery.
- All 10 non-Floor-Breaker games use mobile render caps and game-shell-sized renderer resizing.
- Wall Dodge 12-player formation now uses one collision plane in a wider arena; wall geometry, gaps, clamps and camera were resized together.
- Obstacle Sprint, Maze Rush and Red Light Run no longer terminate the human player's run just because bots fill the first three positions.
- Game and shell copy now uses beta credits, match tiers and podium rewards rather than cash-like dollar presentation.
- `qa_release.py`: PASS (11 games).
- `qa_mobile.py`: PASS (11 games).
- Direct mobile layout render QA: PASS across 22 cases (11 games x portrait/landscape), checking modal overflow and touch-control viewport placement.

### Runtime caveat
This environment blocks normal browser navigation to local/file URLs, so network-loaded Three.js gameplay could not be driven end-to-end here. Mobile HTML/CSS was rendered directly in headless Chromium for layout verification; JavaScript syntax and mobile/game invariants were checked separately. A real-device smoke test remains recommended before a public multiplayer pilot.
