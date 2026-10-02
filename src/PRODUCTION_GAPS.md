# Production Gaps — Required Before Any Real-Money Launch

The demo intentionally does **not** implement the following production systems.

## Legal / compliance

- approved jurisdiction matrix,
- licences/registrations/contest approvals where required,
- final terms and competition rules,
- final privacy notice,
- final responsible-play/self-exclusion process,
- complaints/dispute SLA,
- tax treatment.

## Identity / eligibility

- age verification,
- KYC identity verification,
- sanctions/PEP/AML controls as applicable,
- real geolocation / anti-spoofing,
- jurisdiction blocking.

## Payments

- approved deposit rails,
- approved withdrawal rails,
- custody/safeguarding structure,
- double-entry wallet ledger,
- reconciliation,
- chargeback/reversal handling,
- transaction monitoring.

## Game infrastructure

- real multiplayer networking,
- authoritative game servers,
- deterministic / version-locked match builds,
- scalable matchmaking,
- reconnect handling,
- no-contest/refund engine,
- idempotent settlement service.

## Fair play

- anti-cheat,
- bot detection,
- device/account risk,
- collusion detection,
- replay/event logging,
- integrity-review tooling.

## Operations

- customer support system,
- dispute case management,
- fraud/integrity admin console,
- audit logging,
- monitoring/alerting,
- incident response,
- backups/disaster recovery.

## Current prototype substitutions

- bots instead of real remote players,
- localStorage instead of a backend database/ledger,
- simulated matchmaking,
- simulated eligibility checks,
- simulated match verification/audit IDs,
- local demo support tickets,
- disabled real deposits/withdrawals.


## Jurisdiction gating before any real-money launch

`launch-config.js` intentionally has `realMoneyEnabled: false` and no approved jurisdictions. Before cash mode can be enabled, production must replace the local demo checks with authoritative age/KYC/location/payment/fair-play services and counsel must approve an explicit jurisdiction allowlist. Thailand is explicitly blocked in the prototype configuration and should remain blocked unless Thai counsel later gives specific written approval for the final structure.
