window.SKILL_ARCADE_LIVE_CONFIG = Object.freeze({
  build: 'V6.6-real-infra-ready',
  environment: 'setup',
  apiBaseUrl: '',
  websocketUrl: '',
  auth: { provider: 'supabase' },
  wallet: {
    embeddedProvider: 'unconfigured',
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
    stablecoin: { symbol: 'USDC', decimals: 6, address: '' },
    escrowContractAddress: ''
  },
  matchmaking: { targetPlayers: 12, region: 'global', entryTiers: [1,5,20] },
  gates: {
    realAccounts: true,
    walletProvisioning: false,
    deposits: false,
    withdrawals: false,
    paidMatchmaking: false,
    cashMode: false
  }
});