(()=>{
'use strict';
const cfg=window.SKILL_ARCADE_LIVE_CONFIG||{};
const online=window.SKILL_ARCADE_ONLINE_CONFIG||{};
let sb=null,session=null,wallet=null,summary=null,remoteConfig=null,selectedGame=null,selectedTier=(cfg.matchmaking?.entryTiers||[1])[0];
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const apiConfigured=()=>!!cfg.apiBaseUrl;
const supabaseConfigured=()=>!!(online.supabaseUrl&&online.supabaseAnonKey&&window.supabase?.createClient);
function chainCfg(){const r=remoteConfig?.chain||{};return {...(cfg.chain||{}),chainId:r.id??cfg.chain?.chainId,stablecoin:{...(cfg.chain?.stablecoin||{}),symbol:r.stablecoinSymbol??cfg.chain?.stablecoin?.symbol,decimals:r.stablecoinDecimals??cfg.chain?.stablecoin?.decimals,address:r.stablecoinAddress??cfg.chain?.stablecoin?.address},escrowContractAddress:r.escrowAddress??cfg.chain?.escrowContractAddress}}
const chainConfigured=()=>{const c=chainCfg();return !!(c.chainId&&c.stablecoin?.address&&c.escrowContractAddress)};
const gate=k=>!!(remoteConfig?.gates?.[k]??cfg.gates?.[k]);

function createSupabase(){
  if(!supabaseConfigured())return null;
  if(!sb)sb=window.supabase.createClient(online.supabaseUrl,online.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  return sb;
}
async function refreshSession(){
  const c=createSupabase();
  if(!c){session=null;return null}
  const {data}=await c.auth.getSession();session=data.session||null;return session;
}
async function token(){return (await refreshSession())?.access_token||''}
async function api(path,opts={}){
  if(!apiConfigured())throw new Error('Live API is not connected yet.');
  const t=await token();
  const res=await fetch(String(cfg.apiBaseUrl).replace(/\/$/,'')+path,{...opts,headers:{'content-type':'application/json',...(t?{authorization:`Bearer ${t}`}:{}) ,...(opts.headers||{})}});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.error||data.message||`API ${res.status}`);
  return data;
}
function shortAddress(a){return a&&a.length>12?`${a.slice(0,6)}…${a.slice(-4)}`:(a||'Not created')}
function statusLabel(){
  if(!supabaseConfigured())return 'CONNECT SUPABASE';
  if(!apiConfigured())return 'DEPLOY API';
  if(!chainConfigured())return 'CONNECT CRYPTO';
  if(!gate('cashMode'))return 'TESTNET / LOCKED';
  return 'LIVE';
}
function statusReady(){return supabaseConfigured()&&apiConfigured()&&chainConfigured()}
function ensureHeader(){
  if($('liveInfraBadge'))return;
  const target=document.querySelector('.arcade-beta-strip')||document.querySelector('[data-panel="games"] .page-head>div');if(!target)return;
  const b=document.createElement('span');b.id='liveInfraBadge';b.className='live-infra-badge'+(statusReady()?' ready':'');b.innerHTML=`<i></i><span>${statusLabel()}</span>`;target.appendChild(b);
}
function walletHtml(){
  const addr=wallet?.address||'';
  const bal=summary?.availableFormatted??'—';
  const locked=summary?.lockedFormatted??'—';
  const pending=summary?.pendingFormatted??'—';
  return `<section class="live-wallet-panel" id="liveWalletPanel">
    <div class="live-wallet-head"><div><div class="eyebrow">REAL WALLET INFRASTRUCTURE</div><h2>Platform wallet</h2><p>Embedded or external EVM wallet. Private keys are never stored in Skill Arcade's database.</p></div><span class="live-wallet-state ${statusReady()?'ready':''}">${statusLabel()}</span></div>
    <div class="live-wallet-grid"><article><span>Wallet</span><b id="liveWalletAddress">${esc(shortAddress(addr))}</b></article><article><span>Available</span><b>${esc(bal)} ${esc(chainCfg().stablecoin?.symbol||'USDC')}</b></article><article><span>In matches</span><b>${esc(locked)} ${esc(chainCfg().stablecoin?.symbol||'USDC')}</b></article><article><span>Pending</span><b>${esc(pending)} ${esc(chainCfg().stablecoin?.symbol||'USDC')}</b></article></div>
    <div class="live-wallet-actions"><button class="primary" id="liveCreateWallet">Create platform wallet</button><button id="liveConnectWallet">Connect external wallet</button><button id="liveDeposit" ${gate('deposits')?'':'disabled'}>Deposit</button><button id="liveWithdraw" ${gate('withdrawals')?'':'disabled'}>Withdraw</button><button id="liveRefresh">Refresh</button></div>
    <div class="live-setup-list">
      ${checkRow('Account / Supabase',supabaseConfigured())}
      ${checkRow('Live API / match server',apiConfigured())}
      ${checkRow('Embedded wallet provider',cfg.wallet?.embeddedProvider&&cfg.wallet.embeddedProvider!=='unconfigured')}
      ${checkRow(`${chainCfg().networkName||'EVM chain'} + ${chainCfg().stablecoin?.symbol||'stablecoin'}`,chainConfigured())}
      ${checkRow('Escrow + paid matchmaking gate',gate('paidMatchmaking')&&gate('cashMode'))}
    </div>
    <p id="liveWalletMessage" class="live-note">The code path is ready; funding actions remain locked until the configured provider, chain, escrow contract and launch gates are enabled.</p>
  </section>`;
}
function checkRow(name,ok){return `<div><b>${ok?'✓':'·'}</b><span>${esc(name)}</span><em class="${ok?'ok':''}">${ok?'READY':'SETUP'}</em></div>`}
function mountWallet(){
  const tab=document.querySelector('[data-panel="wallet"]');if(!tab||$('liveWalletPanel'))return;
  tab.classList.add('live-infra-mounted');
  tab.insertAdjacentHTML('afterbegin',walletHtml());
  $('liveCreateWallet').onclick=provisionEmbedded;
  $('liveConnectWallet').onclick=connectExternal;
  $('liveDeposit').onclick=openDeposit;
  $('liveWithdraw').onclick=openWithdraw;
  $('liveRefresh').onclick=loadSummary;
}
function msg(text,kind=''){const n=$('liveWalletMessage');if(!n)return;n.textContent=text;n.className='live-note '+(kind==='error'?'live-error':kind==='success'?'live-success':'')}
async function provisionEmbedded(){
  if(!session)await refreshSession();
  if(!session){document.getElementById('onlineAccountBtn')?.click();return msg('Log in first, then create your platform wallet.','error')}
  if(!gate('walletProvisioning'))return msg('Wallet provisioning is wired but locked. Configure the embedded-wallet provider and enable the walletProvisioning gate.','error');
  try{msg('Creating your platform wallet…');const data=await api('/api/wallet/provision',{method:'POST',body:'{}'});wallet=data.wallet||data;msg('Platform wallet ready.','success');renderWalletData()}catch(e){msg(e.message,'error')}
}
async function connectExternal(){
  if(!window.ethereum)return msg('No injected EVM wallet was found in this browser.','error');
  try{
    const accounts=await window.ethereum.request({method:'eth_requestAccounts'});const address=accounts?.[0];if(!address)throw new Error('Wallet did not return an address.');
    const chainHex=await window.ethereum.request({method:'eth_chainId'});const chainId=parseInt(chainHex,16);
    wallet={type:'external',address,chainId};
    if(apiConfigured()&&session)await api('/api/wallet/link-external',{method:'POST',body:JSON.stringify({address,chainId})});
    msg(`External wallet connected: ${shortAddress(address)}.`, 'success');renderWalletData();
  }catch(e){msg(e.message,'error')}
}
function renderWalletData(){const n=$('liveWalletAddress');if(n)n.textContent=shortAddress(wallet?.address);}
async function loadSummary(){
  if(!session)await refreshSession();
  if(!session)return msg('Log in to load your real wallet.','error');
  if(!apiConfigured())return msg('Deploy the V6.6 server and set apiBaseUrl first.','error');
  try{const data=await api('/api/wallet/summary');wallet=data.wallet||wallet;summary=data.balance||data.summary||data;msg('Wallet status refreshed.','success');mountOrRefreshWallet()}catch(e){msg(e.message,'error')}
}
function mountOrRefreshWallet(){const old=$('liveWalletPanel');if(old)old.remove();mountWallet()}
function ensureModals(){
  if($('liveDepositModal'))return;
  document.body.insertAdjacentHTML('beforeend',`<div id="liveDepositModal" class="modal-backdrop hidden"><section class="info-modal"><button class="close-btn" data-live-close="liveDepositModal">×</button><div class="eyebrow">FUND YOUR WALLET</div><h2>Deposit ${esc(chainCfg().stablecoin?.symbol||'USDC')}</h2><p class="modal-copy">Send only the configured token on the configured network to your own platform wallet address.</p><div id="liveDepositAddress" class="live-deposit-address">Wallet not ready</div><p class="live-note">Network: ${esc(chainCfg().networkName||'Not configured')} · Deposits are credited only after backend verification/confirmations.</p></section></div>
  <div id="liveWithdrawModal" class="modal-backdrop hidden"><section class="info-modal"><button class="close-btn" data-live-close="liveWithdrawModal">×</button><div class="eyebrow">WITHDRAW</div><h2>Send to your wallet</h2><label class="form-field"><span>Destination address</span><input id="liveWithdrawAddress" placeholder="0x…"></label><label class="form-field"><span>Amount (${esc(chainCfg().stablecoin?.symbol||'USDC')})</span><input id="liveWithdrawAmount" type="number" min="0" step="0.01"></label><button id="liveWithdrawSubmit" class="launch-btn">REQUEST WITHDRAWAL</button><p id="liveWithdrawMessage" class="live-note">Requires backend eligibility, wallet provider and withdrawal gate.</p></section></div>
  <div id="liveMatchModal" class="modal-backdrop hidden"><section class="info-modal"><button class="close-btn" data-live-close="liveMatchModal">×</button><div class="eyebrow">REAL MATCH INFRASTRUCTURE</div><h2 id="liveMatchTitle">Join match</h2><p class="modal-copy">12 real players · server-assigned lobby · escrow-funded entry · authoritative result settlement.</p><div id="liveTierList" class="live-modal-grid"></div><div class="live-setup-list" id="liveMatchChecks"></div><button id="liveJoinMatch" class="launch-btn">JOIN REAL MATCH</button><p id="liveMatchMessage" class="live-note">Paid matchmaking remains locked until setup is complete.</p></section></div>`);
  document.querySelectorAll('[data-live-close]').forEach(b=>b.onclick=()=>$(b.dataset.liveClose)?.classList.add('hidden'));
  $('liveWithdrawSubmit').onclick=submitWithdraw;$('liveJoinMatch').onclick=submitLiveMatch;
}
function openDeposit(){ensureModals();if(!wallet?.address)return msg('Create/connect a wallet first.','error');$('liveDepositAddress').textContent=wallet.address;$('liveDepositModal').classList.remove('hidden')}
function openWithdraw(){ensureModals();$('liveWithdrawModal').classList.remove('hidden')}
async function submitWithdraw(){const note=$('liveWithdrawMessage');if(!gate('withdrawals')){note.textContent='Withdrawals are locked by configuration.';return}try{const destination=$('liveWithdrawAddress').value.trim(),amount=+$('liveWithdrawAmount').value;const data=await api('/api/wallet/withdraw',{method:'POST',body:JSON.stringify({destination,amount})});note.textContent=`Withdrawal request ${data.id||'created'}.`}catch(e){note.textContent=e.message;note.classList.add('live-error')}}
function decorateGames(){
  document.querySelectorAll('[data-open-game]').forEach(play=>{
    const card=play.closest('.game-card');const actions=play.closest('.card-actions');if(!card||!actions||card.querySelector('[data-live-game]'))return;
    const slug=play.dataset.openGame;card.classList.add('live-game-card');
    const b=document.createElement('button');b.className='live-match-action';b.type='button';b.dataset.liveGame=slug;b.innerHTML='<span class="live-match-badge">LIVE</span> REAL MATCH';b.onclick=()=>openLiveMatch(slug);actions.insertAdjacentElement('afterend',b);
  });
}
function openLiveMatch(slug){
  ensureModals();selectedGame=slug;selectedTier=(cfg.matchmaking?.entryTiers||[1])[0];
  const title=document.querySelector(`[data-open-game="${CSS.escape(slug)}"]`)?.closest('.game-card')?.querySelector('h2')?.textContent||slug;$('liveMatchTitle').textContent=`${title} · real match`;
  renderTiers();renderMatchChecks();$('liveMatchModal').classList.remove('hidden');
}
function renderTiers(){const list=$('liveTierList');if(!list)return;list.innerHTML=(cfg.matchmaking?.entryTiers||[1,5,20]).map(v=>`<button class="live-tier ${+v===+selectedTier?'active':''}" data-tier="${+v}"><strong>${+v} ${esc(chainCfg().stablecoin?.symbol||'USDC')}</strong><span>12-player entry tier</span></button>`).join('');list.querySelectorAll('[data-tier]').forEach(b=>b.onclick=()=>{selectedTier=+b.dataset.tier;renderTiers()})}
function renderMatchChecks(){const n=$('liveMatchChecks');if(!n)return;const paid=gate('paidMatchmaking')&&gate('cashMode');const rows=paid?[['Logged-in account',!!session],['Wallet address',!!wallet?.address],['API + match server',apiConfigured()],['Chain + stablecoin + escrow',chainConfigured()],['Paid matchmaking enabled',true]]:[['Logged-in account',!!session],['API + match server',apiConfigured()],['Real 12-player queue',true],['Crypto entry mode',false],['Mainnet cash mode',false]];n.innerHTML=rows.map(([a,b])=>checkRow(a,b)).join('');const join=$('liveJoinMatch');if(join)join.textContent=paid?'FUND ENTRY & JOIN':'JOIN FREE REAL QUEUE'}
async function ensureWalletChain(){if(wallet?.type!=='external'||!window.ethereum)return;const current=parseInt(await window.ethereum.request({method:'eth_chainId'}),16);if(current===Number(chainCfg().chainId))return;await window.ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:'0x'+Number(chainCfg().chainId).toString(16)}]})}
async function waitWalletReceipt(hash,timeoutMs=120000){if(!window.ethereum)return;const start=Date.now();while(Date.now()-start<timeoutMs){const r=await window.ethereum.request({method:'eth_getTransactionReceipt',params:[hash]});if(r)return r;await new Promise(r=>setTimeout(r,1200))}throw new Error('Transaction confirmation timed out. Check your wallet/explorer before retrying.')}
async function sendWalletTransaction(tx){if(wallet?.type==='external'){if(!window.ethereum)throw new Error('External wallet is not available.');await ensureWalletChain();const hash=await window.ethereum.request({method:'eth_sendTransaction',params:[tx]});await waitWalletReceipt(hash);return hash}const adapter=window.SkillArcadeEmbeddedWallet;if(adapter?.sendTransaction){const result=await adapter.sendTransaction(tx);return typeof result==='string'?result:result?.hash}throw new Error('Embedded wallet transaction adapter is not connected yet.')}
async function submitLiveMatch(){const note=$('liveMatchMessage');note.className='live-note';await refreshSession();renderMatchChecks();if(!session){note.textContent='Log in first.';return}if(!apiConfigured()){note.textContent='Deploy/connect the V6.6 API server first.';return}const paid=gate('paidMatchmaking')&&gate('cashMode');try{if(!paid){note.textContent='Joining free real-user queue…';const data=await api('/api/matchmaking/join',{method:'POST',body:JSON.stringify({gameSlug:selectedGame,entryAmount:0,currency:'FREE'})});note.textContent=`Real queue joined · ${data.match_id||data.matchId||'match assigned'} · ${data.players||1}/${data.target_players||12} players.`;note.classList.add('live-success');return}if(!wallet?.address)throw new Error('Create or connect a wallet first.');if(!chainConfigured())throw new Error('Chain, stablecoin and escrow addresses are not configured.');note.textContent='Reserving lobby slot and preparing escrow transactions…';const prep=await api('/api/matchmaking/prepare-paid-entry',{method:'POST',body:JSON.stringify({gameSlug:selectedGame,region:cfg.matchmaking?.region||'global',entryAmount:selectedTier,walletAddress:wallet.address})});let joinHash='';for(const tx of prep.transactions||[]){note.textContent=tx.kind==='approve'?'Approve the match token in your wallet…':'Locking your match entry in escrow…';const h=await sendWalletTransaction(tx);if(tx.kind==='join')joinHash=h}if(!joinHash)throw new Error('Escrow join transaction was not created.');note.textContent='Verifying escrow entry…';const joined=await api('/api/matchmaking/confirm-paid-entry',{method:'POST',body:JSON.stringify({reservationId:prep.reservation_id,matchId:prep.match_id,txHash:joinHash,walletAddress:wallet.address})});note.textContent=`Funded queue joined · ${joined.match_id||prep.match_id} · ${joined.players||1}/${joined.target_players||12} funded players.`;note.classList.add('live-success')}catch(e){note.textContent=e.message;note.classList.add('live-error')}}
async function loadPublicConfig(){if(!apiConfigured())return;try{const r=await fetch(String(cfg.apiBaseUrl).replace(/\/$/,'')+'/api/config');if(r.ok)remoteConfig=await r.json()}catch{}}
async function boot(){
  await loadPublicConfig();
  ensureHeader();mountWallet();ensureModals();decorateGames();
  await refreshSession();
  if(sb)sb.auth.onAuthStateChange(async(_e,s)=>{session=s;await loadSummary().catch(()=>{});renderMatchChecks()});
  if(session&&apiConfigured())await loadSummary().catch(()=>{});
  const obs=new MutationObserver(()=>decorateGames());obs.observe(document.documentElement,{subtree:true,childList:true});
}
window.SkillArcadeLive={openWallet:()=>document.querySelector('[data-tab="wallet"]')?.click(),connectExternal,provisionEmbedded,loadSummary};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
