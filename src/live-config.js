window.SKILL_ARCADE_LIVE_CONFIG = Object.freeze({
  build: 'V6.6-real-infra-ready',
  environment: 'setup', // setup | testnet | production

  // Backend services. Fill these after deploying /server.
  apiBaseUrl: '',
  websocketUrl: '',

  auth: {
    provider: 'supabase'
  },

  wallet: {
    // embedded = provider-created wallet inside the account UI.
    // external = MetaMask/Rabby/Coinbase Wallet/etc via EIP-1193.
    embeddedProvider: 'unconfigured', // e.g. privy | turnkey | other
    allowEmbedded: true,
    allowExternal: true,
    custodyModel: 'noncustodial-escrow'
  },

  chain: {
    family: 'evm',
    networkName: 'Base Sepolia',
    chainId: 84532,
    mainnetChainId: 8453,
    rpcUrl: '',
    explorerUrl: 'https://sepolia.basescan.org',
    stablecoin: {
      symbol: 'USDC',
      decimals: 6,
      address: '' // deliberately blank until you choose/verify the token contract
    },
    escrowContractAddress: ''
  },

  matchmaking: {
    targetPlayers: 12,
    region: 'global',
    entryTiers: [1, 5, 20]
  },

  // These gates are deliberately OFF. The UI and backend are wired so you can
  // turn them on only after the real providers, contract and compliance checks exist.
  gates: {
    realAccounts: true,
    walletProvisioning: false,
    deposits: false,
    withdrawals: false,
    paidMatchmaking: false,
    cashMode: false
  }
});
