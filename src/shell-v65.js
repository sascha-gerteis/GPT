(()=>{
'use strict';
function setText(id,text){const el=document.getElementById(id);if(el)el.textContent=text}
function replaceText(selector,from,to){document.querySelectorAll(selector).forEach(el=>{if(el.textContent.trim()===from)el.textContent=to})}
function boot(){
  document.title='Skill Arcade · Online Beta';
  const brand=document.querySelector('.brand em');if(brand)brand.textContent='BETA';
  const hb=document.querySelector('#walletButton span');if(hb)hb.textContent='Arcade credits';
  replaceText('.nav-btn','Wallet','Credits');
  const head=document.querySelector('[data-panel="games"] .page-head');
  if(head){
    const eye=head.querySelector('.eyebrow');if(eye)eye.textContent='12-PLAYER SKILL ARCADE';
    const h=head.querySelector('h1');if(h)h.textContent='Pick a game. Chase the podium.';
    const p=head.querySelector('p');if(p)p.textContent='Fast skill games built for mobile and desktop. Practice free or use beta credits in simulated skill-match tiers.';
    const note=head.querySelector('.demo-note');if(note)note.innerHTML='<b>ONLINE BETA</b><span>No cash value</span>';
    if(!head.querySelector('.arcade-beta-strip')){
      const strip=document.createElement('div');strip.className='arcade-beta-strip';strip.innerHTML='<span>12-player games</span><span>Mobile + desktop</span><span>Real accounts beta</span><span>Practice free</span>';head.querySelector('div')?.appendChild(strip);
    }
  }
  replaceText('.wallet-hero .eyebrow','DEMO WALLET','ARCADE CREDITS');
  const walletCopy=document.querySelector('.wallet-hero p');if(walletCopy)walletCopy.textContent='Test credits for beta skill matches. They have no cash value and cannot be deposited or withdrawn.';
  replaceText('.wallet-demo-pill','DEMO ONLY','BETA · NO CASH');
  replaceText('.choose-label','COMPETITIVE DEMO LOBBY','CHOOSE MATCH TIER');
  replaceText('.payout-title','TOP 3 PRIZES','PODIUM REWARDS');
  replaceText('.economics span','Total entries','Match credits');
  replaceText('.economics span','Prize pool','Podium pool');
  replaceText('.modal-balance span','DEMO BALANCE','BETA CREDITS');
  replaceText('.queue-checks span','Demo wallet','Beta credits');
  document.querySelectorAll('.footer>span').forEach(x=>x.textContent='Skill Arcade · Online Beta');
  document.querySelectorAll('.footer>b').forEach(x=>x.textContent='BETA CREDITS · NO REAL MONEY');
  setText('historyPlayed',document.getElementById('historyPlayed')?.textContent||'0 played');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
