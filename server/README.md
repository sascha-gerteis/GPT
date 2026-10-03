# Skill Arcade V6.6 live server

This is the trusted backend boundary for real accounts, wallets and real-user matchmaking.

## What it does now
- verifies Supabase bearer sessions server-side
- provisions embedded wallets through a provider adapter
- links external EVM wallets without ever receiving a private key
- exposes wallet summary / withdrawal-request endpoints
- calls the V6.6 matchmaking RPC
- issues one-time WebSocket match tickets
- accepts only player **inputs** over WebSocket (never client-authored positions/results)

## What still must be connected before real funds
1. Supabase URL + service-role key
2. embedded-wallet provider adapter/credentials
3. EVM RPC, stablecoin contract and escrow contract
4. chain indexer/webhook that writes confirmed deposits / escrow events
5. authoritative per-game simulation (the current WebSocket layer is transport/session plumbing)
6. managed result signer / HSM or MPC
7. KYC/age/geolocation/risk service if required by launch jurisdiction
8. security review, smart-contract audit, load testing and incident monitoring

Copy `.env.example` to `.env`, fill testnet values first, then run:

```bash
npm install
npm run check
npm start
```

Do not place private keys in the repository. Production signing should use a managed signer rather than a plaintext `.env` key.
