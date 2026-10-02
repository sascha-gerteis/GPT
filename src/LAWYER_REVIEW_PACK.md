# Skill Arcade — Lawyer Review Pack

## 1. Purpose of this prototype

Skill Arcade is proposed as a platform of short multiplayer video-game competitions. Players can always use a free Practice mode. The proposed competitive mode would use fixed entry amounts and pre-disclosed placement prizes, with the platform retaining a disclosed fee.

This package is a **demo only**. It does not accept or pay real money.

## 2. Proposed customer flow

1. Create account/profile.
2. Free Practice available without payment.
3. For proposed cash competition access: confirm age eligibility, complete identity/KYC, pass jurisdiction/geolocation checks, and pass fair-play/device checks.
4. Choose a game.
5. Choose Practice or a competitive lobby.
6. Before entry, show:
   - number of players,
   - entry amount,
   - total entries,
   - platform fee,
   - prize pool,
   - exact 1st/2nd/3rd prizes,
   - game rules.
7. Simulated matchmaking fills the lobby.
8. Player may cancel before match lock/start with no entry charged.
9. When match starts, entry is locked/deducted.
10. Authoritative game server determines the result.
11. Result is recorded under a match ID and game version.
12. Settlement distributes prizes and platform fee.
13. Player receives a match receipt and wallet ledger entries.
14. Player may dispute a result through support.
15. Eligible balance may later be withdrawn through the approved payment structure.

## 3. Current demo economics

Default fee shown in the prototype: **5% of aggregate entries**.

Standard competition lobby: **12 players**.

Example — 12-player, $5 lobby:

- Gross entries: $60.00
- Platform fee: $3.00
- Prize pool: $57.00
- 1st: $30.00
- 2nd: $17.00
- 3rd: $10.00

The same 12-player payout ratios are used across the current game catalog: **6.00 / 3.40 / 2.00 × entry**, which totals 95% of aggregate entries. Gameplay statistics such as KOs or blocks destroyed do not create undisclosed cash-like bonuses outside that published pool.

The exact fee and payout model are proposed product terms, not a legal conclusion.

## 4. Game outcome model

The platform currently contains 11 game types using a 12-player standard competition lobby. See `GAME_RULES.md`.

Design principles used in the prototype:

- all players in the same lobby use the same game version,
- no paid stat advantages,
- no loot boxes or purchased random power-ups affecting outcome,
- placements follow published game rules,
- Practice uses the same mechanics but does not affect wallet/history,
- touch and desktop input use the same underlying movement/ability limits,
- competitive entries and prize values are disclosed before entry.

Counsel should assess each game separately if required by the applicable jurisdiction.

## 5. Map-selection / fairness model

Several games use published map pools for replayability. The proposal is that a production server chooses one map before the match begins, locks the map ID into the match record, and gives every player the identical map/version. The current demo avoids immediately repeating the previous map.

Counsel should confirm whether:
- the complete map pool must be published in competition rules,
- the exact map must be disclosed before entry or only before match start,
- server-side random map selection is acceptable for a skill competition, and
- any map-selection method creates a legally relevant element of chance.

## 6. Proposed live controls

- 18+ competitive access.
- Identity/KYC before cash access.
- Jurisdiction and geolocation check before entry.
- AML/sanctions controls as required by the payment/custody structure.
- One-person/one-account controls.
- Server-authoritative game state.
- Anti-cheat and impossible-input detection.
- Collusion/multi-account analysis.
- Locked game build/version per match.
- Match event/replay logging.
- Settlement hold for flagged matches.
- User spending limits, session reminders and competitive pause/self-exclusion pathway.
- Practice remains available when competitive play is paused unless legal/policy requirements say otherwise.

## 7. Proposed disconnect / failure approach

See `MATCH_OPERATIONS.md`.

High-level proposal:

- Cancel matchmaking before match start: no entry charged.
- Voluntary disconnect after start: normally forfeit / game-defined placement.
- Verified server-wide failure before a reliable result exists: no-contest and automatic entry refund.
- Partial infrastructure failure: settlement held for review.
- Suspected cheat/integrity failure: settlement held pending review.

These rules are drafts for counsel review.

## 8. Proposed payment/custody architecture

See `FUNDS_FLOW.md`.

The preferred product architecture is to avoid self-custody unless the final legal/payment structure specifically permits it. A licensed/approved payment or wallet partner should be evaluated for deposits, safeguarded balances and withdrawals.

## 9. Decisions requested from counsel

Please advise separately for every jurisdiction being considered:

1. How are these competitions classified under gambling/gaming/prize-competition laws?
2. Does payment of an entry fee plus skill-based placement prizes require a gambling, gaming, contest, promotional or other licence?
3. Does any particular game mechanic create a material element of chance that changes the classification?
4. Are there restrictions on platform fees or prize structures?
5. Can the operator offer the service from one country while excluding local users and serving approved foreign jurisdictions?
6. What entity/location structure is appropriate?
7. What age threshold applies?
8. What KYC, AML, sanctions, source-of-funds or transaction-monitoring duties apply?
9. Does the wallet/payment flow trigger payment-services, money-transmission, e-money or stored-value regulation?
10. What geolocation standard is required?
11. What responsible-play/self-exclusion controls are mandatory or advisable?
12. What consumer-protection disclosures are required before entry?
13. What refund/disconnect/no-contest rules are required?
14. What records/replay/event logs must be retained, and for how long?
15. What dispute-resolution / complaints process is required?
16. Are advertising or influencer restrictions relevant?
17. What tax treatment applies to operator revenue and player prizes?
18. Which jurisdictions should be explicitly blocked at launch?
19. What wording should replace the draft policies in this package?
20. Which payment providers are legally compatible with the approved structure?

## 10. What must not happen before legal approval

- Do not enable real deposits.
- Do not enable real withdrawals.
- Do not represent the demo KYC/location checks as real verification.
- Do not market real-money availability in unapproved jurisdictions.
- Do not custody player funds without the approved legal/payment structure.
- Do not rely on client-side results or balances for a live service.
