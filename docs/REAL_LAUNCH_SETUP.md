# Skill Arcade V6.7 — connection checklist

V6.7 is structured so the product can be connected in layers without rewriting the games.

## 1. Connect Supabase first
1. Create a dedicated Supabase project.
2. Run migrations in order:
   - `supabase/migrations/001_accounts_matchmaking.sql`
   - `supabase/migrations/002_live_wallet_escrow_matchmaking.sql`
3. In Supabase Auth, enable the login methods you want.
4. Add the deployed site to the Auth Site URL / redirect allow-list.
5. Put only the public URL/key in `src/online-config.js`.
6. Put the **service-role key only on the V6.7 server**. Never put it in GitHub Pages or browser JS.

At this point real login + free real-user matchmaking can run without crypto.

## 2. Deploy the live server
Deploy `/server` to a persistent Node host with WebSocket support.

Set:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PUBLIC_ORIGIN`
- `WEBSOCKET_PUBLIC_URL`

Then set these in `src/live-config.js`:
- `apiBaseUrl`
- `websocketUrl`

Keep all money gates false while testing accounts and free queues.

## 3. Connect a wallet provider
V6.7 supports two wallet paths:
- **embedded platform wallet** — created automatically for the user's account on first authenticated wallet access once the provider is enabled; there is no separate Create Wallet step
- **external EVM wallet** — optional MetaMask/Rabby/Coinbase Wallet/etc connection through the browser

For an embedded provider, implement the provider mapping in `server/src/wallet-provider.js` and set the server environment variables. The browser never receives the provider secret.

Never store seed phrases or private keys in Supabase.

## 4. Configure a testnet chain + stablecoin
Start on testnet.

Fill both server environment and `src/live-config.js` with:
- chain ID
- RPC (server only if private/paid)
- stablecoin symbol/decimals/address
- block explorer

Do not copy a token address from a random website. Verify it from the selected chain/token issuer's official documentation before funding anything.

## 5. Deploy the escrow contract on testnet
Use `/contracts`.

The flow is:
1. backend creates/reuses a 24-player on-chain match
2. player wallet approves the stablecoin
3. player calls `joinMatch`
4. server verifies the `EntryLocked` event
5. only funded players count toward the real lobby
6. authoritative server signs the final result hash
7. escrow contract pays the three podium addresses and treasury
8. cancelled/expired matches can be refunded

Do not deploy the contract to mainnet without independent review/audit.

## 6. Enable testnet wallet flows
Only after the previous steps work, change the V6.7 **testnet** gates:
- wallet provisioning
- deposits
- withdrawals
- paid matchmaking

Keep production/mainnet cash mode false.

Test at minimum:
- create two separate accounts on two devices
- confirm a new account receives its embedded wallet automatically
- connect external wallet
- wrong-chain rejection
- deposit detection / confirmation
- failed/reorged transaction handling
- insufficient balance
- match never fills → refund
- 24 users fund same match
- disconnect/reconnect
- duplicate transaction replay
- duplicate result settlement
- payout rounding
- withdrawal failure/retry

## 7. Authoritative game server
The V6.7 Node server includes authenticated WebSocket rooms and only accepts control inputs, not client-authored positions/results.

Before paid launch, each game still needs its simulation moved to the trusted server so the server controls:
- movement and physics
- collisions
- map seed
- eliminations/checkpoints
- finish order
- result hash

Do not settle paid matches from the current browser-only game result.

## 8. Mainnet is a separate launch gate
Before enabling production cash mode, complete the applicable legal/payment/compliance/security work for every allowed jurisdiction. That includes deciding the exact contest classification and the obligations created by accepting/transmitting crypto or operating wallet/escrow infrastructure.

The repo intentionally starts with:
- no approved jurisdictions
- cash mode false
- deposits false
- withdrawals false
- paid matchmaking false
- no stablecoin contract address
- no escrow contract address

Those are launch controls, not missing game code.
