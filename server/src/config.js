const bool=(v,d=false)=>v==null?d:/^(1|true|yes|on)$/i.test(String(v));
const num=(v,d)=>Number.isFinite(+v)?+v:d;
export const config=Object.freeze({
  port:num(process.env.PORT,8787),
  publicOrigin:process.env.PUBLIC_ORIGIN||'http://localhost:8080',
  supabaseUrl:process.env.SUPABASE_URL||'',
  supabaseServiceRoleKey:process.env.SUPABASE_SERVICE_ROLE_KEY||'',
  environment:process.env.ENVIRONMENT||'setup',
  gates:{
    cashMode:bool(process.env.CASH_MODE_ENABLED),
    walletProvisioning:bool(process.env.WALLET_PROVISIONING_ENABLED),
    deposits:bool(process.env.DEPOSITS_ENABLED),
    withdrawals:bool(process.env.WITHDRAWALS_ENABLED),
    paidMatchmaking:bool(process.env.PAID_MATCHMAKING_ENABLED)
  },
  embeddedWallet:{provider:process.env.EMBEDDED_WALLET_PROVIDER||'unconfigured',apiUrl:process.env.EMBEDDED_WALLET_API_URL||'',apiKey:process.env.EMBEDDED_WALLET_API_KEY||''},
  chain:{
    id:num(process.env.CHAIN_ID,84532),rpcUrl:process.env.CHAIN_RPC_URL||'',stablecoinSymbol:process.env.STABLECOIN_SYMBOL||'USDC',stablecoinDecimals:num(process.env.STABLECOIN_DECIMALS,6),stablecoinAddress:process.env.STABLECOIN_ADDRESS||'',escrowAddress:process.env.ESCROW_CONTRACT_ADDRESS||''
  }
});
export function publicConfig(){return {environment:config.environment,gates:config.gates,wallet:{embeddedProvider:config.embeddedWallet.provider},chain:{id:config.chain.id,networkName:process.env.CHAIN_NETWORK_NAME||'',stablecoinSymbol:config.chain.stablecoinSymbol,stablecoinDecimals:config.chain.stablecoinDecimals,stablecoinAddress:config.chain.stablecoinAddress,escrowAddress:config.chain.escrowAddress}}}
