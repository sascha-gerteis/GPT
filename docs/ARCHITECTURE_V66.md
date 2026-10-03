# V6.6 architecture

```text
Browser / GitHub Pages
  ├─ Supabase Auth session
  ├─ embedded-wallet UI adapter OR external EVM wallet
  ├─ free matchmaking / funded-entry requests
  └─ WebSocket control inputs only
             │
             ▼
V6.6 Node server
  ├─ verifies Supabase JWT/user
  ├─ wallet-provider adapter
  ├─ chain / escrow verifier
  ├─ 12-player matchmaker
  ├─ one-time game-server tickets
  └─ authoritative game server boundary
             │
      ┌──────┴────────┐
      ▼               ▼
Supabase          EVM chain
  ├ profiles        ├ user wallets
  ├ wallet refs     ├ stablecoin
  ├ deposits        └ SkillArcadeEscrow
  ├ withdrawals
  ├ reservations
  ├ matches
  ├ results
  └ security events
```

## Trust boundaries
- Browser is untrusted.
- Client localStorage is never a money ledger.
- Supabase anon key may be public; service-role key may not.
- Wallet private keys are owned/secured by the wallet provider or user's external wallet, never by the Skill Arcade database.
- Only server/indexer code verifies on-chain deposits and escrow events.
- Only authoritative server results may be signed for settlement.
- Smart contract verifies the configured result signer before payout.
