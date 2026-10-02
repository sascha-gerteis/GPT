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
