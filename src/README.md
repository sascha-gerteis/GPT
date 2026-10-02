# Skill Arcade V6.2 — Final Bug-Fixed Lawyer / External Pilot Demo

This package is a **non-cash product prototype** for legal, payment-provider, engineering and product review.

It contains 11 playable skill mini-games plus the proposed surrounding product flow:

- First-run demo profile onboarding
- Free Practice mode for every game
- $1 / $5 / $20 simulated competitive lobbies
- Simulated matchmaking and cancel-before-start flow
- 5% displayed platform fee
- Top-three displayed prize structure
- Persistent demo wallet
- Wallet transaction ledger
- Match history and receipts
- Match IDs and simulated integrity/audit IDs
- Demo dispute/report flow
- Skill ranks by game
- Live-access preview for age, identity, location and fair-play checks
- Demo daily competition limit
- Session reminder
- 24-hour competitive pause while Practice stays available
- Draft policy screens
- Proposed live funds-flow diagram

## Start

Windows: run `START_ARCADE.bat`.

Or serve this directory with any local HTTP server and open `index.html`.


## Map rotation and replayability

Six replay-heavy titles now rotate real gameplay layouts and avoid the immediately previous map:

- Obstacle Sprint — 8 courses
- Falling Tiles — 4 floor layouts
- Safe Zone — 4 platform layouts
- Wall Dodge — 4 wall-pattern arenas
- Maze Rush — 12 generated maze layouts
- Meteor Dodge — 4 circular arena themes / strike sequences

The selected map is recorded in match history where applicable. Floor Breaker, Knockout, Bomb Tag, Red Light Run and Coin Rush intentionally retain a signature arena/ruleset rather than receiving cosmetic-only fake map variants.

## V6.2 release hardening

- Falling Tiles now always starts with a complete 15×15 floor; rotating variants change deterministic tile timing/pacing rather than loading pre-cut holes.
- Knockout is last-player-standing only; the arena shrinks by elapsed match progression and cannot settle on a hidden timer.
- Bomb Tag is last-player-standing only; the fuse/elimination loop continues until one survivor remains.
- Meteor Dodge retains its circular boundary clamp and reduced strike density.
- `START_ARCADE.bat` now starts the local server before opening the browser.
- `RUN_QA.bat` / `qa_release.py` provide repeatable static release checks.

## Critical limitation

**No real money is accepted, held, transferred, paid out or withdrawable.**

Deposit and Withdraw are intentionally disabled. Eligibility/KYC/geolocation/fair-play checks are visual simulations only. Real-money mode is hard-disabled in `launch-config.js` until a jurisdiction is approved by counsel and the required payment/compliance stack exists. Matchmaking uses local bots and simulated queue states. Game results are local browser results, not authoritative server records.

## Recommended legal review order

1. Run the arcade and enter a Practice match.
2. Enter a simulated $1 competitive lobby and review the pre-entry economics.
3. Complete a match and open its receipt.
4. Review Wallet → transaction ledger.
5. Review Account → eligibility preview, responsible-play controls and policies.
6. Open `LAWYER_REVIEW_PACK.md`.
7. Review `FUNDS_FLOW.md`, `MATCH_OPERATIONS.md`, `AUDIT_AND_INTEGRITY.md`, `DRAFT_POLICY_SUMMARY.md`, and `PRODUCTION_GAPS.md`.

## Games

See `GAME_RULES.md` for the exact 11 game rules and placement logic.

## Launch configuration

See `JURISDICTION_LAUNCH_CONFIG.md` and `launch-config.js`. This package is suitable for product demos, external technical pilots and legal review. It is **not** legal authorization to accept real-money entries in any jurisdiction.
