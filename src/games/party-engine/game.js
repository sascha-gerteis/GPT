(()=>{
'use strict';
const qs=new URLSearchParams(location.search),mode=qs.get('mode')||'laser-grid',entry=Math.max(0,Number(qs.get('entry'))||1);
const TOKEN=String(window.SKILL_ARCADE_LIVE_CONFIG?.chain?.stablecoin?.symbol||'USDC').toUpperCase();
const C={
'laser-grid':{n:'Laser Grid',type:'survival',rule:'Dodge sweeping laser lines. Three hits and you are out.',round:210,action:'DASH'},
'king-hill':{n:'King of the Hill',type:'hill',rule:'Hold the moving control zone longer than everyone else.',round:220,action:'DASH'},
'rising-lava':{n:'Rising Lava',type:'race',rule:'Race through procedural checkpoints before the danger line catches you.',round:240,action:'BOOST'},
'target-blitz':{n:'Target Blitz',type:'score',rule:'Reach and clear targets faster than the other players.',round:180,action:'BURST'},
'color-collapse':{n:'Color Collapse',type:'collapse',rule:'Reach the highlighted safe tile before the arena collapses.',round:240,action:'DASH'},
'push-arena':{n:'Push Arena',type:'arena',rule:'Dash into opponents and knock them out of the arena.',round:300,action:'DASH'},
'checkpoint-rush':{n:'Checkpoint Rush',type:'score',rule:'Race between procedural checkpoints. Most captures wins.',round:210,action:'BOOST'},
'moving-maze':{n:'Moving Maze',type:'maze',rule:'Find the exit while sections of the maze keep shifting.',round:260,action:'SCAN'},
'hook-race':{n:'Hook Race',type:'race',rule:'Use momentum boosts to clear a long procedural obstacle race.',round:260,action:'HOOK'},
'floor-is-lava':{n:'Floor Is Lava',type:'collapse',rule:'Move between safe islands as the rest of the arena becomes dangerous.',round:260,action:'DASH'},
'dodgeball-arena':{n:'Dodgeball Arena',type:'score',rule:'Tag opponents with skill shots while avoiding incoming balls.',round:210,action:'THROW'},
'reaction-gates':{n:'Reaction Gates',type:'race',rule:'Choose the correct opening and sprint through randomized gates.',round:230,action:'BOOST'},
'gravity-flip':{n:'Gravity Flip',type:'race',rule:'Flip through alternating lanes and race to the finish.',round:240,action:'FLIP'},
'ice-run':{n:'Ice Run',type:'race',rule:'Master slippery momentum through a procedural race course.',round:240,action:'BRAKE'},
'platform-panic':{n:'Platform Panic',type:'collapse',rule:'Platforms vanish in procedural waves until one player remains.',round:280,action:'DASH'},
'cannon-run':{n:'Cannon Run',type:'survival',rule:'Read randomized cannon lanes and survive the barrage.',round:240,action:'DASH'},
'shadow-sprint':{n:'Shadow Sprint',type:'race',rule:'Memorize the procedural route, then race across disappearing paths.',round:250,action:'REVEAL'},
'zone-capture':{n:'Zone Capture',type:'hill',rule:'Capture moving zones and hold them against the field.',round:230,action:'DASH'},
'speed-climb':{n:'Speed Climb',type:'race',rule:'Climb through a generated checkpoint route with minimal mistakes.',round:260,action:'BOOST'},
'one-shot':{n:'One Shot',type:'score',rule:'Precision matters: tag opponents with a single recharging shot.',round:220,action:'FIRE'}
};
const cfg=C[mode]||C['laser-grid'],canvas=document.getElementById('game'),ctx=canvas.getContext('2d'),overlay=document.getElementById('overlay'),result=document.getElementById('result'),startBtn=document.getElementById('startBtn'),againBtn=document.getElementById('againBtn');
document.title=cfg.n+' · Skill Arcade';document.getElementById('title').textContent=cfg.n.toUpperCase();document.getElementById('rule').textContent=cfg.rule;document.getElementById('hudMode').textContent=cfg.n;document.getElementById('roundFact').textContent=Math.round(cfg.round/60)+' min';document.getElementById('action').textContent=cfg.action;startBtn.textContent='PLAY · '+entry.toFixed(2)+' '+TOKEN;
const PLAYERS=24,NAMES=window.SkillArcadeProcedural?.PLAYER_NAMES||Array.from({length:24},(_,i)=>i?'Player '+(i+1):'You'),STORAGE='skillArcadeDemoAccountV1',FEE=.05,PAYOUT=[12,6.8,4].map(x=>x*entry);
let W=1,H=1,state='menu',last=performance.now(),elapsed=0,time=cfg.round,seed=0,R=Math.random,players=[],walls=[],zones=[],targets=[],hazards=[],goal={x:0,y:0,r:28},safeIndex=0,phase=0,nextEvent=0,actionLatch=false,keys=new Set(),joy={x:0,y:0},mapLabel='';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),rand=(a,b)=>a+(b-a)*R();
function load(){try{return {...{wallet:25,totalPrizes:0,wins:0,totalMatches:0,matches:[]},...JSON.parse(localStorage.getItem(STORAGE)||'{}')}}catch{return{wallet:25,totalPrizes:0,wins:0,totalMatches:0,matches:[]}}}
function save(a){try{localStorage.setItem(STORAGE,JSON.stringify(a))}catch{}}
function resize(){const d=Math.min(devicePixelRatio||1,1.5),r=canvas.getBoundingClientRect();W=Math.max(320,r.width);H=Math.max(320,r.height);canvas.width=Math.round(W*d);canvas.height=Math.round(H*d);ctx.setTransform(d,0,0,d,0,0)}
addEventListener('resize',resize);resize();
function newMap(){
 seed=window.SkillArcadeProcedural?.nextSeed(mode)||((Date.now()^Math.random()*1e9)>>>0);R=window.SkillArcadeProcedural?.rng(seed)||Math.random;mapLabel='SEED '+String(seed>>>0).slice(-6);walls=[];zones=[];targets=[];hazards=[];phase=0;nextEvent=2;
 const m=48;for(let i=0;i<14;i++){const w=rand(30,85),h=rand(24,70),x=rand(m,W-m-w),y=rand(m,H-m-h);walls.push({x,y,w,h,shift:rand(-1,1)})}
 for(let i=0;i<6;i++)zones.push({x:rand(90,W-90),y:rand(90,H-90),r:rand(38,68),c:i});
 for(let i=0;i<16;i++)targets.push({x:rand(50,W-50),y:rand(50,H-50),r:11,alive:true,v:i%5?1:3});
 goal={x:rand(70,W-70),y:rand(70,H-70),r:36};
 safeIndex=Math.floor(R()*zones.length);
}
function spawn(){
 players=[];const cx=W/2,cy=H/2,rad=Math.min(W,H)*.28;
 for(let i=0;i<PLAYERS;i++){const a=i/PLAYERS*Math.PI*2,p={id:i,name:NAMES[i]||'Player '+(i+1),x:cx+Math.cos(a)*rad,y:cy+Math.sin(a)*rad,vx:0,vy:0,r:9,alive:true,lives:3,score:0,outAt:0,finished:false,finish:0,action:0,trail:[],color:`hsl(${(i*47+48)%360} 76% 62%)`};players.push(p)}
}
function blocked(x,y,r=9){if(x<r||y<r||x>W-r||y>H-r)return true;return walls.some(o=>x+r>o.x&&x-r<o.x+o.w&&y+r>o.y&&y-r<o.y+o.h)}
function input(p){
 if(p.id===0){return{x:(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0)+joy.x,y:(keys.has('KeyS')?1:0)-(keys.has('KeyW')?1:0)+joy.y,action:keys.has('Space')||actionLatch}}
 let tx=goal.x,ty=goal.y;
 if(cfg.type==='hill') {const z=zones[safeIndex];tx=z.x;ty=z.y}
 if(cfg.type==='collapse'){const z=zones[safeIndex];tx=z.x;ty=z.y}
 if(cfg.type==='score'){const t=targets.filter(t=>t.alive).sort((a,b)=>(a.x-p.x)**2+(a.y-p.y)**2-((b.x-p.x)**2+(b.y-p.y)**2))[0];if(t){tx=t.x;ty=t.y}}
 if(cfg.type==='arena'){const q=players.filter(q=>q.alive&&q.id!==p.id).sort((a,b)=>dist(a,p)-dist(b,p))[0];if(q){tx=q.x;ty=q.y}}
 let dx=tx-p.x,dy=ty-p.y,l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;
 return{x:dx+Math.sin(elapsed*.7+p.id)*.12,y:dy+Math.cos(elapsed*.5+p.id)*.12,action:p.action<=0&&((Math.floor(elapsed*2)+p.id)%7===0)}
}
function kill(p){if(!p.alive)return;p.lives--;if(p.lives>0){p.x=W/2+rand(-30,30);p.y=H/2+rand(-30,30);p.vx=p.vy=0;return}p.alive=false;p.outAt=elapsed}
function physics(p,dt){
 if(!p.alive||p.finished)return;const a=input(p),l=Math.hypot(a.x,a.y),ice=mode==='ice-run',accel=ice?3.2:9.5,max=ice?175:145,drag=ice?.992:Math.exp(-7*dt);
 if(l>.08){p.vx+=(a.x/l*max-p.vx)*Math.min(1,accel*dt);p.vy+=(a.y/l*max-p.vy)*Math.min(1,accel*dt)}else{p.vx*=drag;p.vy*=drag}
 p.action=Math.max(0,p.action-dt);
 if(a.action&&p.action<=0){p.action=mode==='one-shot'?1.8:1.05;if(['arena','survival','collapse','hill'].includes(cfg.type)){const q=players.filter(q=>q.alive&&q.id!==p.id).sort((x,y)=>dist(x,p)-dist(y,p))[0];if(q&&dist(q,p)<75){const dx=q.x-p.x,dy=q.y-p.y,ll=Math.hypot(dx,dy)||1;q.vx+=dx/ll*220;q.vy+=dy/ll*220;if(mode==='one-shot')kill(q)}}p.vx*=1.75;p.vy*=1.75}
 let nx=p.x+p.vx*dt,ny=p.y+p.vy*dt;if(!blocked(nx,p.y,p.r))p.x=nx;else p.vx*=-.28;if(!blocked(p.x,ny,p.r))p.y=ny;else p.vy*=-.28;
 p.x=clamp(p.x,p.r,W-p.r);p.y=clamp(p.y,p.r,H-p.r);p.trail.push([p.x,p.y]);if(p.trail.length>10)p.trail.shift();
}
function modeStep(dt){
 nextEvent-=dt;
 if(cfg.type==='survival'){
   if(nextEvent<=0){nextEvent=Math.max(.6,1.55-elapsed*.003);const vertical=R()>.5;hazards.push({vertical,p:vertical?rand(20,W-20):rand(20,H-20),t:1.05,w:10})}
   for(const h of hazards){h.t-=dt;if(h.t<.18&&h.t>0){for(const p of players)if(p.alive){const d=h.vertical?Math.abs(p.x-h.p):Math.abs(p.y-h.p);if(d<h.w+p.r&&!p._hit){p._hit=true;kill(p)}}}if(h.t<=0)for(const p of players)p._hit=false}
   hazards=hazards.filter(h=>h.t>-.05);
 }
 if(cfg.type==='hill'){if(nextEvent<=0){nextEvent=7;safeIndex=(safeIndex+1+Math.floor(R()*(zones.length-1)))%zones.length}const z=zones[safeIndex];for(const p of players)if(p.alive&&dist(p,z)<z.r)p.score+=dt}
 if(cfg.type==='collapse'){if(nextEvent<=0){phase++;nextEvent=Math.max(2.2,5-phase*.08);safeIndex=Math.floor(R()*zones.length);if(phase>1){for(const p of players)if(p.alive&&dist(p,zones[(safeIndex+zones.length-1)%zones.length])>zones[(safeIndex+zones.length-1)%zones.length].r*1.45)kill(p)}}}
 if(cfg.type==='score'){for(const p of players)if(p.alive)for(const t of targets)if(t.alive&&dist(p,t)<p.r+t.r){t.alive=false;p.score+=t.v;setTimeout(()=>{t.x=rand(30,W-30);t.y=rand(30,H-30);t.alive=true},450)}} 
 if(cfg.type==='race'){goal.x=W*.5+Math.sin(elapsed*.31+seed)*W*.28;goal.y=Math.max(42,H-42-(elapsed/(cfg.round*.82))*(H-84));for(const p of players)if(!p.finished&&dist(p,goal)<goal.r){p.score++;goal.y=Math.max(42,goal.y-45);goal.x=rand(60,W-60);if(p.score>=12){p.finished=true;p.finish=elapsed}}}
 if(cfg.type==='maze'){if(nextEvent<=0){nextEvent=5;const o=walls[Math.floor(R()*walls.length)];if(o){o.x=clamp(o.x+o.shift*35,10,W-o.w-10);o.shift*=-1}}goal.x=W-52;goal.y=52;for(const p of players)if(!p.finished&&dist(p,goal)<goal.r){p.finished=true;p.finish=elapsed}}
 if(cfg.type==='arena'){for(let i=0;i<players.length;i++)for(let j=i+1;j<players.length;j++){const a=players[i],b=players[j];if(!a.alive||!b.alive)continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<a.r+b.r&&d>.01){const nx=dx/d,ny=dy/d,push=(a.r+b.r-d)*5;a.vx-=nx*push;b.vx+=nx*push;a.vy-=ny*push;b.vy+=ny*push}}for(const p of players)if(p.alive&&(p.x<4||p.x>W-4||p.y<4||p.y>H-4))kill(p)}
}
function ranking(){return players.slice().sort((a,b)=>{if(cfg.type==='race'||cfg.type==='maze'){if(a.finished!==b.finished)return a.finished?-1:1;if(a.finished)return a.finish-b.finish;return b.score-a.score}if(['survival','collapse','arena'].includes(cfg.type)){if(a.alive!==b.alive)return a.alive?-1:1;if(a.lives!==b.lives)return b.lives-a.lives;return b.outAt-a.outAt}return b.score-a.score||b.lives-a.lives})}
function finish(reason){if(state!=='play')return;state='result';const rank=ranking(),place=rank.findIndex(p=>p.id===0)+1,prize=place<=3?PAYOUT[place-1]:0,a=load();a.wallet=Math.max(0,(+a.wallet||0)+prize);a.totalPrizes=(+a.totalPrizes||0)+prize;a.totalMatches=(+a.totalMatches||0)+1;if(place===1)a.wins=(+a.wins||0)+1;a.matches=Array.isArray(a.matches)?a.matches:[];a.matches.unshift({game:mode,gameName:cfg.n,place,prize,net:prize-entry,lobby:entry,mapName:mapLabel,detail:reason});a.matches=a.matches.slice(0,50);save(a);document.getElementById('resultTitle').textContent='#'+place+' · '+(place<=3?'PODIUM':'FINISHED');document.getElementById('resultText').textContent=reason+' · '+(prize?('Won '+prize.toFixed(2)+' '+TOKEN):'No podium payout')+'.';result.classList.remove('hidden')}
function start(){const a=load();if((+a.wallet||0)+1e-9<entry){startBtn.textContent='NOT ENOUGH '+TOKEN;return}a.wallet=(+a.wallet||0)-entry;save(a);newMap();spawn();elapsed=0;time=cfg.round;state='play';overlay.classList.add('hidden');result.classList.add('hidden')}
startBtn.addEventListener('click',start);againBtn.addEventListener('click',start);
addEventListener('keydown',e=>{keys.add(e.code);if(e.code==='Space')e.preventDefault()});addEventListener('keyup',e=>keys.delete(e.code));
const stick=document.getElementById('stick'),knob=document.getElementById('knob'),action=document.getElementById('action');let pid=null;
function moveJoy(e){const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,max=r.width*.32;let dx=e.clientX-cx,dy=e.clientY-cy,l=Math.hypot(dx,dy);if(l>max){dx=dx/l*max;dy=dy/l*max}joy.x=dx/max;joy.y=dy/max;knob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`}
stick.addEventListener('pointerdown',e=>{pid=e.pointerId;stick.setPointerCapture(pid);moveJoy(e)});stick.addEventListener('pointermove',e=>{if(e.pointerId===pid)moveJoy(e)});for(const ev of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(ev,e=>{if(pid===null||e.pointerId===pid){pid=null;joy.x=joy.y=0;knob.style.transform='translate(-50%,-50%)'}});
action.addEventListener('pointerdown',e=>{e.preventDefault();actionLatch=true});for(const ev of ['pointerup','pointercancel','lostpointercapture'])action.addEventListener(ev,()=>actionLatch=false);
function draw(){
 ctx.clearRect(0,0,W,H);ctx.fillStyle='#13243a';ctx.fillRect(0,0,W,H);
 ctx.strokeStyle='rgba(255,255,255,.045)';ctx.lineWidth=1;for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
 for(const o of walls){ctx.fillStyle='rgba(65,89,119,.92)';ctx.fillRect(o.x,o.y,o.w,o.h)}
 if(['hill','collapse'].includes(cfg.type)){zones.forEach((z,i)=>{ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,Math.PI*2);ctx.fillStyle=i===safeIndex?'rgba(101,224,189,.28)':'rgba(255,255,255,.04)';ctx.fill();ctx.strokeStyle=i===safeIndex?'#65e0bd':'rgba(255,255,255,.1)';ctx.stroke()})}
 if(['score'].includes(cfg.type)){for(const t of targets)if(t.alive){ctx.beginPath();ctx.arc(t.x,t.y,t.r+(t.v>1?4:0),0,Math.PI*2);ctx.fillStyle=t.v>1?'#ffd15b':'#65e0bd';ctx.fill()}}
 if(['race','maze'].includes(cfg.type)){ctx.beginPath();ctx.arc(goal.x,goal.y,goal.r,0,Math.PI*2);ctx.strokeStyle='#65e0bd';ctx.lineWidth=4;ctx.stroke()}
 for(const h of hazards){ctx.strokeStyle=h.t>.18?'rgba(255,89,104,.35)':'#ff5968';ctx.lineWidth=h.w;ctx.beginPath();if(h.vertical){ctx.moveTo(h.p,0);ctx.lineTo(h.p,H)}else{ctx.moveTo(0,h.p);ctx.lineTo(W,h.p)}ctx.stroke()}
 for(const p of players){if(!p.alive)continue;ctx.globalAlpha=.22;ctx.strokeStyle=p.color;ctx.beginPath();for(let i=0;i<p.trail.length;i++){const q=p.trail[i];i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])}ctx.stroke();ctx.globalAlpha=1;ctx.beginPath();ctx.arc(p.x,p.y,p.r+(p.id===0?2:0),0,Math.PI*2);ctx.fillStyle=p.color;ctx.fill();if(p.id===0){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#fff';ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.fillText('YOU',p.x,p.y-16)}}
 const rank=ranking(),place=rank.findIndex(p=>p.id===0)+1;document.getElementById('hudYou').textContent='#'+place+' · '+(players[0]?.score||0);document.getElementById('hudStatus').textContent=Math.ceil(time)+'s · '+mapLabel;
}
function tick(now){const dt=Math.min(.04,(now-last)/1000||0);last=now;if(state==='play'){elapsed+=dt;time=Math.max(0,time-dt);for(const p of players)physics(p,dt);modeStep(dt);actionLatch=false;const live=players.filter(p=>p.alive);if(time<=0||(['survival','collapse','arena'].includes(cfg.type)&&live.length<=1)||((cfg.type==='race'||cfg.type==='maze')&&players[0]?.finished))finish(time<=0?'Time expired':'Round objective complete')}draw();requestAnimationFrame(tick)}
newMap();spawn();draw();requestAnimationFrame(tick);
})();