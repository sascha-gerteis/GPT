(()=>{
'use strict';

const coarse=()=>window.matchMedia('(hover:none),(pointer:coarse)').matches;

function bindTilt(card){
  if(card.dataset.saTiltBound==='1') return;
  card.dataset.saTiltBound='1';
  card.addEventListener('pointermove',e=>{
    if(coarse()) return;
    const r=card.getBoundingClientRect();
    const x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));
    const y=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));
    const ry=(x-.5)*8;
    const rx=(.5-y)*6;
    card.style.setProperty('--rx',rx.toFixed(2)+'deg');
    card.style.setProperty('--ry',ry.toFixed(2)+'deg');
    card.style.setProperty('--mx',(x*100).toFixed(1)+'%');
    card.style.setProperty('--my',(y*100).toFixed(1)+'%');
  });
  card.addEventListener('pointerleave',()=>{
    card.style.setProperty('--rx','0deg');
    card.style.setProperty('--ry','0deg');
    card.style.setProperty('--mx','50%');
    card.style.setProperty('--my','50%');
  });
}

function bindAll(){
  document.querySelectorAll('.game-card').forEach(bindTilt);
}

function boot(){
  bindAll();
  const grid=document.getElementById('gameGrid');
  if(grid){
    new MutationObserver(bindAll).observe(grid,{childList:true,subtree:true});
  }
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
else boot();
})();