# Skill Arcade V6.4 — 12-Player Gameplay Reboot / Online Beta

This package is a **non-cash product prototype** for multiplayer engineering, external pilot, legal and payment-provider review.

V6.4 uses **Floor Breaker as the visual/gameplay quality benchmark** and brings the rest of the catalog closer to that standard without enabling real-money play.

## V6.4 gameplay reboot

- Standard competition lobby increased to **12 players** across all 11 games.
- Standard top-three payout ratio is **6.00 / 3.40 / 2.00 × entry**, equal to 95% of aggregate entries after the displayed 5% platform fee.
- Maps/arenas were enlarged to make 12-player matches readable and less cramped.
- Race/score sessions were lengthened where appropriate.
- Shared richer third-person character kit adds different silhouettes/accessories instead of color-only bean avatars.
- Every third-person title retains a clear YOU marker.
- Shared mobile control layer adds an analog-style movement pad plus jump/dash action where required.
- Floor Breaker retains its bespoke first-person touch movement/look/fire/jump controls.
- Shared in-game polish improves HUD contrast, modal hierarchy, mobile safe areas and visual feedback.
- Hidden cash-like KO bonuses were removed; the disclosed top-three pool is the complete demo competition payout.

## Current catalog

- Floor Breaker — 12 players, larger 60×60 destructible floor, longer survival round.
- Obstacle Sprint — 12 players, 8 enlarged courses, ~2–3 minute race window.
- Knockout — 12 players, enlarged shrinking arena, last survivor.
- Bomb Tag — 12 players, larger arena, last survivor.
- Falling Tiles — 12 players, complete 19×19 starting floor, 4 pacing variants, last survivor.
- Red Light Run — 12 players, enlarged/longer course, ~95 second race window.
- Coin Rush — 12 players, larger arena, 90 second score round.
- Safe Zone — 12 players, enlarged platforms, 4 layouts, last survivor.
- Wall Dodge — 12 players, enlarged arenas, 4 lives, escalating walls until one survivor.
- Maze Rush — 12 players, larger 27×27 mazes, 12 layouts, ~2–3 minute race window.
- Meteor Dodge — 12 players, larger circular arena, 4 lives, reduced early strike spam with continuing escalation.

## Online beta

The GitHub version also contains the first real-account/shared-matchmaking layer using Supabase. That beta remains separate from the local-bot game simulation until an authoritative multiplayer game server is connected.

The beta queue may temporarily use a smaller fill target for cross-device engineering tests. **The product competition format documented in this build is 12 players.**

## Critical limitation

**No real money is accepted, held, transferred, paid out or withdrawable.**

Deposit and Withdraw remain disabled. Real-money mode stays hard-disabled until an approved jurisdiction, legal/payment structure, authoritative multiplayer, real KYC/geolocation, security controls and settlement infrastructure exist.

## QA

Run `RUN_QA.bat` or `python qa_release.py` for repeatable static checks. Browser-render automation may depend on the local environment; see `QA_REPORT.md` for what was and was not verified.

## Legal/product review

Start with `LAWYER_REVIEW_PACK.md`, `GAME_RULES.md`, `FUNDS_FLOW.md`, `MATCH_OPERATIONS.md`, `AUDIT_AND_INTEGRITY.md`, `JURISDICTION_LAUNCH_CONFIG.md`, and `PRODUCTION_GAPS.md`.
