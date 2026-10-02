(()=>{
'use strict';
const slug=location.pathname.split('/').filter(Boolean).slice(-2,-1)[0]||'';
if(slug==='floor-breaker')return; // Floor Breaker already has bespoke touch movement/look/fire/jump.
const coarse=matchMedia('(pointer:coarse)').matches||innerWidth<900;if(!coarse)return;
const ACTIONS={
  'obstacle-sprint':'JUMP','knockout':'DASH','bomb-tag':'DASH','coin-rush':'DASH','meteor-dodge':'DASH'
};
const action=ACTIONS[slug]||'';
const wrap=document.createElement('div');wrap.className='sa-mobile-controls';wrap.innerHTML=`<div class="sa-stick" aria-label="Movement joystick"><div class="sa-stick-ring"><i></i></div><span>MOVE</span></div>${action?`<button class="sa-action" type="button"><b>${action}</b><small>${slug==='obstacle-sprint'?'SPACE':'ACTION'}</small></button>`:''}`;document.body.appendChild(wrap);
const stick=wrap.querySelector('.sa-stick'),ring=wrap.querySelector('.sa-stick-ring'),knob=ring.querySelector('i');let pid=null,active=new Set();
const send=(code,down)=>window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{code,key:code,bubbles:true}));
function setKey(code,on){if(on&&!active.has(code)){active.add(code);send(code,true)}else if(!on&&active.has(code)){active.delete(code);send(code,false)}}
function clear(){['KeyW','KeyA','KeyS','KeyD'].forEach(k=>setKey(k,false));knob.style.transform='translate(-50%,-50%)'}
function move(e){const r=ring.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,max=r.width*.31;let dx=e.clientX-cx,dy=e.clientY-cy,len=Math.hypot(dx,dy);if(len>max){dx=dx/len*max;dy=dy/len*max}knob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;const nx=dx/max,ny=dy/max,dead=.24;setKey('KeyA',nx<-dead);setKey('KeyD',nx>dead);setKey('KeyW',ny<-dead);setKey('KeyS',ny>dead)}
stick.addEventListener('pointerdown',e=>{e.preventDefault();pid=e.pointerId;stick.setPointerCapture(pid);move(e)});stick.addEventListener('pointermove',e=>{if(e.pointerId===pid){e.preventDefault();move(e)}});stick.addEventListener('pointerup',e=>{if(e.pointerId===pid){pid=null;clear()}});stick.addEventListener('pointercancel',()=>{pid=null;clear()});
const ab=wrap.querySelector('.sa-action');if(ab){const down=e=>{e.preventDefault();send('Space',true);navigator.vibrate?.(12)};const up=e=>{e.preventDefault();send('Space',false)};ab.addEventListener('pointerdown',down);ab.addEventListener('pointerup',up);ab.addEventListener('pointercancel',up);ab.addEventListener('pointerleave',e=>{if(e.buttons)up(e)})}
window.addEventListener('blur',()=>{clear();send('Space',false)});
})();
