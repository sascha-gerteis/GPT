(()=>{
'use strict';
const cfg=window.SKILL_ARCADE_ONLINE_CONFIG||{};
let client=null,user=null,profile=null,currentMatch=null,channel=null;

function el(tag,attrs={},html=''){
  const n=document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>k==='class'?n.className=v:k.startsWith('data-')?n.setAttribute(k,v):n[k]=v);
  if(html)n.innerHTML=html;
  return n;
}
function configured(){return !!(cfg.enabled&&cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase?.createClient)}
function ensureUi(){
  if(!document.getElementById('onlineCss')){
    const l=el('link',{id:'onlineCss',rel:'stylesheet',href:'online.css'});document.head.appendChild(l);
  }
  const top=document.querySelector('.topbar');
  if(top&&!document.getElementById('onlineAccountBtn')){
    const b=el('button',{id:'onlineAccountBtn',class:'online-account-btn',type:'button'},'<span class="online-dot"></span><b>LOG IN</b>');
    b.onclick=openAuth; top.appendChild(b);
  }
  if(!document.getElementById('onlineAuthModal')){
    document.body.insertAdjacentHTML('beforeend',`
<div id="onlineAuthModal" class="modal-backdrop hidden"><section class="info-modal online-auth-modal">
<button class="close-btn" type="button" data-online-close="onlineAuthModal">×</button>
<div class="eyebrow">REAL ACCOUNT · BETA</div><h2 id="onlineAuthTitle">Log in</h2>
<p class="modal-copy">Use a real account across devices. No real money is enabled.</p>
<div id="onlineConfigWarning" class="online-warning hidden"></div>
<label class="form-field"><span>Username</span><input id="onlineUsername" maxlength="24" placeholder="Player name"></label>
<label class="form-field"><span>Email</span><input id="onlineEmail" type="email" autocomplete="email" placeholder="you@example.com"></label>
<label class="form-field"><span>Password</span><input id="onlinePassword" type="password" autocomplete="current-password" minlength="8" placeholder="8+ characters"></label>
<div class="online-auth-actions"><button id="onlineSignIn" class="launch-btn" type="button">LOG IN</button><button id="onlineSignUp" class="secondary-btn" type="button">CREATE ACCOUNT</button></div>
<button id="onlineSignOut" class="text-button danger-text hidden" type="button">Sign out</button>
<p id="onlineAuthMessage" class="online-message"></p>
</section></div>
<div id="onlineQueueModal" class="modal-backdrop hidden"><section class="info-modal online-queue-modal">
<button class="close-btn" type="button" data-online-close="onlineQueueModal">×</button>
<div class="eyebrow">ONLINE BETA · REAL USERS</div><h2>Obstacle Sprint matchmaking</h2>
<p id="onlineQueueState" class="modal-copy">Joining queue…</p>
<div class="online-queue-meter"><i id="onlineQueueFill"></i></div>
<div id="onlinePlayers" class="online-player-list"></div>
<div class="online-match-meta"><span>Match ID</span><code id="onlineMatchId">—</code></div>
<button id="onlineLeaveQueue" class="secondary-btn full" type="button">LEAVE QUEUE</button>
<div id="onlineReadyBox" class="online-ready hidden"><b>MATCH READY</b><span>All beta players are in the same server-assigned lobby.</span><button id="onlineEnterLobby" class="launch-btn" type="button">CONTINUE</button></div>
<p class="form-note">Phase 1 verifies real login + cross-device matchmaking. The authoritative multiplayer game server is the next layer.</p>
</section></div>`);
    document.querySelectorAll('[data-online-close]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.onlineClose)?.classList.add('hidden'));
    document.getElementById('onlineSignIn').onclick=signIn;
    document.getElementById('onlineSignUp').onclick=signUp;
    document.getElementById('onlineSignOut').onclick=signOut;
    document.getElementById('onlineLeaveQueue').onclick=leaveQueue;
    document.getElementById('onlineEnterLobby').onclick=()=>alert('Real users are matched. The next step is connecting this lobby to the authoritative Obstacle Sprint game server.');
  }
  decorateGameCard();
}
function decorateGameCard(){
  if(window.SKILL_ARCADE_LIVE_CONFIG)return; // V6.6+ live-core owns all-game matchmaking UI.
  const play=document.querySelector('[data-open-game="obstacle-sprint"]');
  if(!play)return;
  const actions=play.closest('.card-actions');
  if(!actions||actions.querySelector('.online-beta-btn'))return;
  const b=el('button',{class:'online-beta-btn',type:'button'},'<span class="online-dot"></span> ONLINE BETA');
  b.onclick=joinOnlineQueue;
  actions.appendChild(b);
  actions.classList.add('has-online');
}
async function boot(){
  ensureUi();
  if(!configured()){
    updateAccountButton();
    return;
  }
  client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const {data}=await client.auth.getSession();
  user=data.session?.user||null;
  if(user)await loadProfile();
  client.auth.onAuthStateChange(async(_event,session)=>{user=session?.user||null;profile=null;if(user)await loadProfile();updateAccountButton();decorateGameCard();});
  updateAccountButton();
}
async function loadProfile(){
  if(!client||!user)return;
  const {data}=await client.from('profiles').select('id,username').eq('id',user.id).maybeSingle();
  profile=data||null;
}
function updateAccountButton(){
  const b=document.getElementById('onlineAccountBtn');if(!b)return;
  const label=b.querySelector('b');
  label.textContent=user?(profile?.username||user.email?.split('@')[0]||'ACCOUNT'):'LOG IN';
  b.classList.toggle('signed-in',!!user);
}
function openAuth(){
  ensureUi();
  document.getElementById('onlineAuthModal').classList.remove('hidden');
  const warn=document.getElementById('onlineConfigWarning');
  if(!configured()){
    warn.classList.remove('hidden');
    warn.innerHTML='<b>Backend not connected yet.</b><span>Connect the Supabase project, run the included migration, then fill <code>src/online-config.js</code>.</span>';
  }else warn.classList.add('hidden');
  document.getElementById('onlineSignOut').classList.toggle('hidden',!user);
  document.getElementById('onlineAuthTitle').textContent=user?'Online account':'Log in';
  document.getElementById('onlineUsername').value=profile?.username||'';
  document.getElementById('onlineEmail').value=user?.email||'';
}
function credentials(){
  return {
    username:document.getElementById('onlineUsername').value.trim(),
    email:document.getElementById('onlineEmail').value.trim(),
    password:document.getElementById('onlinePassword').value
  };
}
function msg(t,err=false){const n=document.getElementById('onlineAuthMessage');n.textContent=t;n.classList.toggle('error',err)}
async function signUp(){
  if(!configured())return msg('Connect Supabase first.',true);
  const {username,email,password}=credentials();
  if(username.length<2)return msg('Choose a username with at least 2 characters.',true);
  if(password.length<8)return msg('Password must be at least 8 characters.',true);
  msg('Creating account…');
  const {data,error}=await client.auth.signUp({email,password,options:{data:{username}}});
  if(error)return msg(error.message,true);
  if(data.session){user=data.user;await loadProfile();updateAccountButton();document.getElementById('onlineAuthModal').classList.add('hidden');}
  else msg('Account created. Check your email if confirmation is enabled.');
}
async function signIn(){
  if(!configured())return msg('Connect Supabase first.',true);
  const {email,password}=credentials();msg('Logging in…');
  const {data,error}=await client.auth.signInWithPassword({email,password});
  if(error)return msg(error.message,true);
  user=data.user;await loadProfile();updateAccountButton();document.getElementById('onlineAuthModal').classList.add('hidden');
}
async function signOut(){
  if(channel&&client)await client.removeChannel(channel);
  currentMatch=null;profile=null;await client?.auth.signOut();document.getElementById('onlineAuthModal').classList.add('hidden');
}
async function joinOnlineQueue(){
  if(!configured()){openAuth();return}
  if(!user){openAuth();msg('Log in before joining the online queue.');return}
  document.getElementById('onlineQueueModal').classList.remove('hidden');
  document.getElementById('onlineQueueState').textContent='Joining shared queue…';
  const {data,error}=await client.rpc('join_matchmaking',{p_game_slug:'obstacle-sprint',p_region:cfg.matchmakingRegion||'global'});
  if(error){document.getElementById('onlineQueueState').textContent=error.message;return}
  currentMatch=data?.match_id||data?.matchId;
  if(!currentMatch){document.getElementById('onlineQueueState').textContent='Queue did not return a match ID.';return}
  await subscribeMatch(currentMatch);await refreshLobby();
}
async function subscribeMatch(matchId){
  if(channel)await client.removeChannel(channel);
  channel=client.channel('skill-match-'+matchId)
    .on('postgres_changes',{event:'*',schema:'public',table:'match_players',filter:'match_id=eq.'+matchId},refreshLobby)
    .on('postgres_changes',{event:'*',schema:'public',table:'matches',filter:'id=eq.'+matchId},refreshLobby)
    .subscribe();
}
async function refreshLobby(){
  if(!client||!currentMatch)return;
  const {data,error}=await client.rpc('get_match_lobby',{p_match_id:currentMatch});
  if(error)return;
  const players=Array.isArray(data?.players)?data.players:[];
  const target=+data?.target_players||+(cfg.targetPlayers||2);
  document.getElementById('onlineQueueState').textContent=data?.status==='ready'? `${players.length} / ${target} · match ready` : `${players.length} / ${target} real players joined`;
  document.getElementById('onlineQueueFill').style.width=Math.min(100,(players.length/target)*100)+'%';
  document.getElementById('onlineMatchId').textContent=data?.match_id||currentMatch;
  document.getElementById('onlinePlayers').innerHTML=players.map(p=>`<div><b>#${p.seat}</b><span>${escapeHtml(p.username||'Player')}</span><em>${p.user_id===user?.id?'YOU':'READY'}</em></div>`).join('');
  document.getElementById('onlineReadyBox').classList.toggle('hidden',data?.status!=='ready');
  document.getElementById('onlineLeaveQueue').disabled=data?.status==='ready';
}
async function leaveQueue(){
  if(!client||!currentMatch)return;
  const {error}=await client.rpc('leave_matchmaking',{p_match_id:currentMatch});
  if(error){document.getElementById('onlineQueueState').textContent=error.message;return}
  if(channel)await client.removeChannel(channel);channel=null;currentMatch=null;document.getElementById('onlineQueueModal').classList.add('hidden');
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
const observer=new MutationObserver(()=>decorateGameCard());
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('DOMContentLoaded',boot);
})();