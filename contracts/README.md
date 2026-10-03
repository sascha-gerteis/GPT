# Skill Arcade escrow contract

**Not deployed. Do not send funds to this repository or to any placeholder address.**

The contract is the intended non-custodial match-entry boundary:
1. trusted matchmaker creates a match on-chain
2. players approve the configured stablecoin and call `joinMatch`
3. once the configured player count is funded, the match locks
4. the authoritative game server produces a result hash + signed podium
5. anyone can relay `settleMatch`; only the configured result-signer signature is accepted
6. podium payments are 50%, 28.33%, 16.67% of gross; treasury receives the remaining 5% plus integer rounding remainder
7. cancelled/expired matches are refundable by participants

Before any mainnet use:
- deploy/test on testnet
- add automated contract tests
- independent smart-contract audit
- confirm stablecoin/chain addresses from official sources
- use managed/HSM/MPC keys for matchmaker and result signer
- configure multisig/admin controls and incident pause process
- have counsel/payment/compliance reviewers approve the jurisdiction and funds flow

No user private keys belong in Supabase, GitHub, `.env` committed files, or the game client.
