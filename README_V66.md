# Skill Arcade V6.6 — real infrastructure ready

This patch adds the connection-ready architecture for:
- real Supabase accounts
- 12-player real-user queues for all games
- embedded platform wallets
- external EVM wallets
- stablecoin deposits/withdrawal records
- testnet escrow-funded match entries
- one-time authenticated WebSocket match tickets
- authoritative-server boundary
- server-signed result settlement contract

It intentionally does **not** enable mainnet real-money play by itself. See `docs/REAL_LAUNCH_SETUP.md`.
