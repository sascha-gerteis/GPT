# Proposed Live Funds Flow

This is a design proposal for counsel/payment-provider review, not the currently implemented demo.

```text
PLAYER
  |
  v
APPROVED PAYMENT / WALLET PARTNER
  |
  v
SAFEGUARDED / APPROVED PLAYER BALANCE
  |
  | player enters an eligible lobby
  v
MATCH ENTRY LOCK
  |
  v
SERVER-AUTHORITATIVE MATCH
  |
  v
SERVER-VERIFIED RESULT + MATCH ID
  |
  +--------------------+
  |                    |
  v                    v
95% PRIZE POOL      5% PLATFORM FEE
  |
  v
PLAYER AVAILABLE BALANCE
  |
  v
APPROVED WITHDRAWAL RAIL
```

## Ledger requirements

A production ledger should be append-only / double-entry and reconcile:

- deposits,
- withdrawals,
- entry locks,
- entry releases/refunds,
- prize settlements,
- fee settlements,
- adjustments,
- chargebacks/reversals,
- frozen/pending balances.

Every wallet transaction should reference a stable user ID and, when relevant, a match ID.

## Open legal/payment question

The exact entity that legally holds player funds, and whether the operator ever touches or controls those funds, must be resolved before implementation.
