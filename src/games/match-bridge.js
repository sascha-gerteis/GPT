(()=>{
  'use strict';
  const qs=new URLSearchParams(location.search);
  const practice=qs.get('practice')==='1';
  const autoStart=qs.get('autostart')==='1';
  const ACCOUNT_KEY='skillArcadeDemoAccountV1';
  const MAP_PREFIX='skillArcadeLastMapV3:';
  window.SkillArcadeMaps={
    pick(gameId,variants){
      const list=Array.isArray(variants)?variants.filter(Boolean):[];
      if(!list.length)return null;
      let last=null;try{last=localStorage.getItem(MAP_PREFIX+gameId)}catch{}
      const pool=list.length>1?list.filter(v=>(v.id||v.name)!==last):list;
      const chosen=pool[Math.floor(Math.random()*pool.length)]||list[0];
      try{localStorage.setItem(MAP_PREFIX+gameId,String(chosen.id||chosen.name||'map'))}catch{}
      return chosen;
    }
  };
  const rawGet=Storage.prototype.getItem;
  const rawSet=Storage.prototype.setItem;
  const rawRemove=Storage.prototype.removeItem;
  let actualAccountRaw=null;
  let shadowRaw=null;
  try{actualAccountRaw=rawGet.call(localStorage,ACCOUNT_KEY)}catch{}

  if(practice){
    let base={wallet:25,totalPrizes:0,wins:0,totalMatches:0,matches:[]};
    try{if(actualAccountRaw)base={...base,...JSON.parse(actualAccountRaw)}}catch{}
    base={...base,wallet:9999,matches:Array.isArray(base.matches)?base.matches:[]};
    shadowRaw=JSON.stringify(base);
    Storage.prototype.getItem=function(k){
      if(this===localStorage&&k===ACCOUNT_KEY)return shadowRaw;
      return rawGet.call(this,k);
    };
    Storage.prototype.setItem=function(k,v){
      if(this===localStorage&&k===ACCOUNT_KEY){shadowRaw=String(v);return;}
      return rawSet.call(this,k,v);
    };
    Storage.prototype.removeItem=function(k){
      if(this===localStorage&&k===ACCOUNT_KEY){shadowRaw=null;return;}
      return rawRemove.call(this,k);
    };
  } else {
    Storage.prototype.setItem=function(k,v){
      if(this===localStorage&&k===ACCOUNT_KEY){
        try{
          const prev=actualAccountRaw?JSON.parse(actualAccountRaw):{};
          const incoming=JSON.parse(String(v));
          const merged={...prev,...incoming};
          if(prev.profile&&!incoming.profile)merged.profile=prev.profile;
          const out=JSON.stringify(merged);
          actualAccountRaw=out;
          return rawSet.call(this,k,out);
        }catch{}
      }
      return rawSet.call(this,k,v);
    };
  }

  function actualBalance(){
    try{const s=actualAccountRaw||rawGet.call(localStorage,ACCOUNT_KEY);const d=s?JSON.parse(s):null;return Number.isFinite(+d?.wallet)?Math.max(0,+d.wallet):25}catch{return 25}
  }
  const money=v=>`$${Number(v||0).toFixed(2)}`;

  function practicePaint(){
    if(!practice)return;
    const ids=['entryValue','resultEntry'];
    ids.forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=id==='resultEntry'?'CR 0.00':'FREE'});
    ['poolValue','p1','p2','p3','resultPrize','resultNet'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='—'});
    ['walletValue','lobbyWallet','resultWallet'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=money(actualBalance())});
    const ribbon=document.querySelector('.demo-ribbon');if(ribbon)ribbon.textContent='PRACTICE · FREE · NO PRIZES';
    document.querySelectorAll('.demo-badge').forEach(el=>el.textContent='PRACTICE');
    const start=document.getElementById('startBtn');if(start&&!start.disabled)start.textContent='START PRACTICE';
    const again=document.getElementById('playAgainBtn');if(again)again.textContent='PLAY AGAIN · FREE';
    const msg=[...document.querySelectorAll('small')].find(el=>/entry is deducted|Demo entry/i.test(el.textContent||''));if(msg)msg.textContent='Practice matches do not change your demo wallet or history.';
  }

  let autoClicked=false;
  function tryAuto(){
    if(!autoStart||autoClicked)return;
    const btn=document.getElementById('startBtn');
    if(btn&&!btn.disabled&&btn.offsetParent!==null){autoClicked=true;setTimeout(()=>btn.click(),180)}
  }

  const label=document.createElement('div');
  label.setAttribute('aria-hidden','true');
  label.style.cssText='position:fixed;left:12px;bottom:12px;z-index:99999;padding:6px 9px;border-radius:999px;background:rgba(8,10,20,.76);border:1px solid rgba(255,255,255,.16);color:#fff;font:800 9px/1 system-ui;letter-spacing:.08em;backdrop-filter:blur(8px);pointer-events:none';
  label.textContent=practice?'PRACTICE MODE':'MATCH DEMO';
  document.addEventListener('DOMContentLoaded',()=>{document.body.appendChild(label);practicePaint();tryAuto()});
  const timer=setInterval(()=>{practicePaint();tryAuto()},250);
  window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
})();
