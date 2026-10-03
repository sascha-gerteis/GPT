import {config} from './config.js';

// Provider adapter contract. Replace only this file when choosing Privy/Turnkey/etc.
// Skill Arcade stores the resulting wallet address/provider id, never seed phrases.
export async function provisionEmbeddedWallet({userId,email}){
  if(!config.gates.walletProvisioning)throw Object.assign(new Error('wallet_provisioning_disabled'),{status:409});
  const p=config.embeddedWallet;
  if(!p.provider||p.provider==='unconfigured')throw Object.assign(new Error('embedded_wallet_provider_not_configured'),{status:503});
  if(!p.apiUrl||!p.apiKey)throw Object.assign(new Error('embedded_wallet_provider_credentials_missing'),{status:503});

  // Generic adapter endpoint. Once a provider is chosen, map this request/response
  // to that provider's official API rather than exposing provider secrets in the browser.
  const r=await fetch(p.apiUrl.replace(/\/$/,'')+'/wallets',{method:'POST',headers:{authorization:`Bearer ${p.apiKey}`,'content-type':'application/json'},body:JSON.stringify({externalUserId:userId,email,chainFamily:'evm'})});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw Object.assign(new Error(data.error||data.message||'wallet_provider_error'),{status:502});
  const address=data.address||data.wallet?.address;const providerWalletId=data.id||data.wallet?.id;
  if(!address)throw Object.assign(new Error('wallet_provider_returned_no_address'),{status:502});
  return {address,providerWalletId,provider:p.provider};
}

export async function requestEmbeddedTransfer(){
  // Deliberately not implemented generically: provider signing/delegation differs.
  throw Object.assign(new Error('embedded_transfer_adapter_not_configured'),{status:503});
}
