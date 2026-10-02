(()=>{
'use strict';
const slug=location.pathname.split('/').filter(Boolean).slice(-2,-1)[0]||'';
if(slug==='floor-breaker')return; // bespoke movement/look/fire/jump lives in Floor Breaker.
const mobileLike=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0||innerWidth<900;if(!mobileLike)return;
const ACTIONS={'obstacle-sprint':'JUMP','knockout':'DASH','bomb-tag':'DASH','coin-rush':'DASH','meteor-dodge':'DASH'};
const action=ACTIONS[slug]||'';
const wrap=document.createElement('div');wrap.className='sa-mobile-controls';wrap.setAttribute('aria-hidden','true');wrap.innerHTML=`<div class="sa-stick" aria-label="Movement joystick"><div class="sa-stick-ring"><i></i></div><span>MOVE</span></div>${action?`<button class="sa-action" type="button" aria-label="${action}"><b>${action}</b><small>ACTION</small></button>`:''}`;document.body.appendChild(wrap);
const tip=document.createElement('div');tip.className='sa-mobile-tip';tip.textContent=action?'Left thumb moves · right button '+action.toLowerCase():'Drag the left stick to move';document.body.appendChild(tip);
const stick=wrap.querySelector('.sa-stick'),ring=wrap.querySelector('.sa-stick-ring'),knob=ring.querySelector('i');let pid=null,actionPid=null,active=new Set(),tipTimer=0;
const send=(code,down)=>window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{code,key:code,bubbles:true,cancelable:true}));
function setKey(code,on){if(on&&!active.has(code)){active.add(code);send(code,true)}else if(!on&&active.has(code)){active.delete(code);send(code,false)}}
function clear(){['KeyW','KeyA','KeyS','KeyD'].forEach(k=>setKey(k,false));knob.style.transform='translate(-50%,-50%)'}
function releaseAction(){if(actionPid!==null){actionPid=null;send('Space',false)}}
function move(e){const r=ring.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,max=r.width*.33;let dx=e.clientX-cx,dy=e.clientY-cy,len=Math.hypot(dx,dy);if(len>max){dx=dx/len*max;dy=dy/len*max}knob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;const nx=dx/max,ny=dy/max,dead=.18;setKey('KeyA',nx<-dead);setKey('KeyD',nx>dead);setKey('KeyW',ny<-dead);setKey('KeyS',ny>dead)}
stick.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();pid=e.pointerId;stick.setPointerCapture?.(pid);move(e)});stick.addEventListener('pointermove',e=>{if(e.pointerId===pid){e.preventDefault();move(e)}});for(const ev of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(ev,e=>{if(pid===null||e.pointerId===pid){pid=null;clear()}});
const ab=wrap.querySelector('.sa-action');if(ab){ab.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();actionPid=e.pointerId;ab.setPointerCapture?.(actionPid);send('Space',true);navigator.vibrate?.(10)});for(const ev of ['pointerup','pointercancel','lostpointercapture'])ab.addEventListener(ev,e=>{if(actionPid===null||e.pointerId===actionPid)releaseAction()})}
function gameplayVisible(){const overlay=document.getElementById('overlay');return !overlay||!overlay.classList.contains('show')}
function syncVisibility(){const on=gameplayVisible();wrap.classList.toggle('is-active',on);wrap.setAttribute('aria-hidden',on?'false':'true');if(!on){clear();releaseAction();tip.classList.remove('show');return}tip.classList.add('show');clearTimeout(tipTimer);tipTimer=setTimeout(()=>tip.classList.remove('show'),2600)}
const overlay=document.getElementById('overlay');if(overlay)new MutationObserver(syncVisibility).observe(overlay,{attributes:true,attributeFilter:['class']});syncVisibility();
function viewportChanged(){requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')))}
window.visualViewport?.addEventListener('resize',viewportChanged,{passive:true});window.visualViewport?.addEventListener('scroll',viewportChanged,{passive:true});window.addEventListener('orientationchange',()=>setTimeout(viewportChanged,120),{passive:true});
window.addEventListener('blur',()=>{clear();releaseAction()});document.addEventListener('visibilitychange',()=>{if(document.hidden){clear();releaseAction()}});
})();
