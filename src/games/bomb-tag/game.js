(()=>{
'use strict';
const $=id=>document.getElementById(id);
if(!window.THREE){$('startBtn').disabled=true;$('startBtn').textContent='3D ENGINE FAILED TO LOAD';return;}
const THREE=window.THREE;
const qs=new URLSearchParams(location.search), rawEntry=Number(qs.get('entry'));
const ENTRY=[1,5,20].includes(rawEntry)?rawEntry:1;
const STORAGE='skillArcadeDemoAccountV1',PLAYERS=8,FEE=.05,PAYOUTS=[4.5,2.1,1].map(v=>v*ENTRY),POOL=PLAYERS*ENTRY*(1-FEE),FIXED=1/120;
const keys=new Set(),players=[],eliminated=[];
let state='menu',account=load(),wallet=account.wallet,count=3,elapsed=0,last=performance.now(),acc=0,dashBuffer=0,toastT=0,bombHolder=null,bombFuse=0,passCooldown=0,nextBombDelay=0,explosions=0;
function load(){const f={wallet:25,totalPrizes:0,wins:0,totalMatches:0,matches:[]};try{const d=JSON.parse(localStorage.getItem(STORAGE)||'null');return d?{...f,...d,matches:Array.isArray(d.matches)?d.matches:[]}:f}catch{return f}}
function save(){account.wallet=Math.max(0,wallet);localStorage.setItem(STORAGE,JSON.stringify(account))}
function money(v){return `$${Math.max(0,+v||0).toFixed(2)}`}
function signed(v){return `${v>=0?'+':'-'}$${Math.abs(v).toFixed(2)}`}
function toast(s){$('toast').textContent=s;$('toast').classList.add('show');toastT=1.0}
function updateEconomy(){
  $('entryValue').textContent=money(ENTRY);$('poolValue').textContent=money(POOL);$('p1').textContent=money(PAYOUTS[0]);$('p2').textContent=money(PAYOUTS[1]);$('p3').textContent=money(PAYOUTS[2]);
  $('walletValue').textContent=$('lobbyWallet').textContent=money(wallet);$('startBtn').textContent=wallet>=ENTRY?`ENTER MATCH - ${money(ENTRY)}`:'INSUFFICIENT DEMO BALANCE';$('startBtn').disabled=wallet<ENTRY;
}
const renderer=new THREE.WebGLRenderer({canvas:$('game'),antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.shadowMap.enabled=true;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x1a1024);scene.fog=new THREE.Fog(0x1a1024,28,75);
const camera=new THREE.PerspectiveCamera(55,1,.05,100);camera.position.set(0,14.5,13.8);camera.lookAt(0,0,0);scene.add(camera);
scene.add(new THREE.HemisphereLight(0xd9d2ff,0x2a1537,1.75));const sun=new THREE.DirectionalLight(0xffffff,1.8);sun.position.set(-12,22,-8);sun.castShadow=true;scene.add(sun);
const world=new THREE.Group(),root=new THREE.Group(),fx=new THREE.Group();scene.add(world,root,fx);
const mat=(c,r=.62)=>new THREE.MeshStandardMaterial({color:c,roughness:r});
const floor=new THREE.Mesh(new THREE.CylinderGeometry(8.7,8.7,.55,64),mat(0x564483,.65));floor.position.y=-.28;floor.receiveShadow=true;world.add(floor);
const inner=new THREE.Mesh(new THREE.CylinderGeometry(7.65,7.65,.09,64),mat(0x6f5da0,.72));inner.position.y=.035;inner.receiveShadow=true;world.add(inner);
const border=new THREE.Mesh(new THREE.TorusGeometry(8.3,.13,8,64),new THREE.MeshStandardMaterial({color:0xa98de1,emissive:0x39245d,emissiveIntensity:.8,roughness:.35}));border.rotation.x=Math.PI/2;border.position.y=.16;world.add(border);
const lava=new THREE.Mesh(new THREE.CylinderGeometry(13,13,.45,64),new THREE.MeshStandardMaterial({color:0xff4a18,emissive:0xff2400,emissiveIntensity:1.7,roughness:.45}));lava.position.y=-4.4;world.add(lava);
const colors=[0xffd84e,0xff6e9d,0x60d9b7,0x61c5ff,0xb18cff,0xff8a55,0x82e26f,0x4fc6d9],names=['You','Nova','Mika','Rook','Volt','Pip','Zed','Kira'];
function makePlayer(i){
  const g=new THREE.Group(),bodyMat=mat(colors[i],.55),dark=mat(0x272437,.7),white=mat(0xffffff,.65);
  const body=new THREE.Mesh(new THREE.SphereGeometry(.5,16,12),bodyMat);body.scale.set(.92,1.1,.82);body.position.y=.78;g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.35,16,12),bodyMat);head.position.y=1.35;g.add(head);
  const visor=new THREE.Mesh(new THREE.BoxGeometry(.44,.16,.07),white);visor.position.set(0,1.39,.31);g.add(visor);
  const legGeo=new THREE.CylinderGeometry(.1,.12,.5,8),la=new THREE.Mesh(legGeo,dark),lb=la.clone();la.position.set(-.18,.25,0);lb.position.set(.18,.25,0);g.add(la,lb);
  if(i===0)window.addYouMarker3D?.(THREE,g,{radius:.7,labelY:2.02});
  g.userData={la,lb};return g;
}
const bombGroup=new THREE.Group();const bombCore=new THREE.Mesh(new THREE.SphereGeometry(.27,18,14),new THREE.MeshStandardMaterial({color:0x1a1a21,roughness:.45}));const fuse=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.34,8),new THREE.MeshStandardMaterial({color:0x8b755c,roughness:.8}));fuse.position.set(.12,.34,0);fuse.rotation.z=-.5;const spark=new THREE.Mesh(new THREE.SphereGeometry(.1,10,8),new THREE.MeshBasicMaterial({color:0xff5a45}));spark.position.set(.21,.48,0);bombGroup.add(bombCore,fuse,spark);scene.add(bombGroup);bombGroup.visible=false;
function reset(){
  root.clear();fx.clear();players.length=0;eliminated.length=0;explosions=0;bombHolder=null;bombFuse=0;passCooldown=0;nextBombDelay=0;
  const pts=[[-4.8,3.8],[0,5],[4.8,3.8],[-5.4,0],[5.4,0],[-4.8,-3.8],[0,-5],[4.8,-3.8]];
  for(let i=0;i<PLAYERS;i++){const g=makePlayer(i);root.add(g);players.push({id:i,name:names[i],g,pos:new THREE.Vector3(pts[i][0],.05,pts[i][1]),vel:new THREE.Vector3(),alive:true,bot:i>0,facing:new THREE.Vector2(0,-1),dashCd:0,dashTime:0,passes:0,bombTime:0,skill:i?[.88,.92,.85,.94,.9,.87,.91][i-1]:1})}
}
reset();
function alive(){return players.filter(p=>p.alive)}
function setBomb(p,announce=true){bombHolder=p;bombFuse=Math.max(5.2,9.0-explosions*.45);passCooldown=.65;if(announce){if(p.id===0)toast('YOU HAVE THE BOMB!');else toast(`BOMB ON ${p.name.toUpperCase()}`)}}
function chooseNextBomb(){
  const live=alive();if(live.length<=1)return;
  const start=(account.totalMatches+explosions)%PLAYERS;
  live.sort((a,b)=>a.bombTime-b.bombTime||((a.id-start+PLAYERS)%PLAYERS)-((b.id-start+PLAYERS)%PLAYERS));setBomb(live[0],true);
}
function inputFor(p){
  if(!p.bot){return{x:(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),z:(keys.has('KeyS')?1:0)-(keys.has('KeyW')?1:0),dash:dashBuffer>0}}
  let x=0,z=0;
  const holder=bombHolder&&bombHolder.alive?bombHolder:null;
  if(holder&&holder.id===p.id){
    const target=alive().filter(q=>q.id!==p.id).sort((a,b)=>Math.hypot(a.pos.x-p.pos.x,a.pos.z-p.pos.z)-Math.hypot(b.pos.x-p.pos.x,b.pos.z-p.pos.z))[0];
    if(target){x=target.pos.x-p.pos.x;z=target.pos.z-p.pos.z}
  }else if(holder){
    const dx=p.pos.x-holder.pos.x,dz=p.pos.z-holder.pos.z,d=Math.hypot(dx,dz)||1;
    if(d<5.2){x=dx/d;z=dz/d}else{x=Math.sin(elapsed*.7+p.id*1.7);z=Math.cos(elapsed*.6+p.id*1.3)}
  }else{x=Math.sin(elapsed*.7+p.id);z=Math.cos(elapsed*.5+p.id)}
  const edge=Math.hypot(p.pos.x,p.pos.z);if(edge>6.8){x+=-p.pos.x*.55;z+=-p.pos.z*.55}
  const l=Math.hypot(x,z)||1;x/=l;z/=l;
  let dash=false;if(p.dashCd<=0){if(holder&&holder.id===p.id){const near=alive().filter(q=>q.id!==p.id).some(q=>Math.hypot(q.pos.x-p.pos.x,q.pos.z-p.pos.z)<2.5);dash=near}else if(holder){dash=Math.hypot(holder.pos.x-p.pos.x,holder.pos.z-p.pos.z)<2.4&&bombFuse<4.5}}
  return{x,z,dash};
}
function updatePlayer(p,dt){
  if(!p.alive)return;p.dashCd=Math.max(0,p.dashCd-dt);
  const inp=inputFor(p),len=Math.hypot(inp.x,inp.z);
  if(len>.05){const nx=inp.x/len,nz=inp.z/len;p.facing.set(nx,nz);const speed=4.8*p.skill,blend=1-Math.exp(-12*dt);p.vel.x+=(nx*speed-p.vel.x)*blend;p.vel.z+=(nz*speed-p.vel.z)*blend}else{const drag=Math.exp(-9*dt);p.vel.x*=drag;p.vel.z*=drag}
  if(inp.dash&&p.dashCd<=0){p.dashCd=1.2;p.dashTime=.18;p.vel.x=p.facing.x*9.5;p.vel.z=p.facing.y*9.5;if(!p.bot)dashBuffer=0}
  p.dashTime=Math.max(0,p.dashTime-dt);p.pos.x+=p.vel.x*dt;p.pos.z+=p.vel.z*dt;
  const dist=Math.hypot(p.pos.x,p.pos.z),maxR=7.72;if(dist>maxR){const nx=p.pos.x/dist,nz=p.pos.z/dist;p.pos.x=nx*maxR;p.pos.z=nz*maxR;const outward=p.vel.x*nx+p.vel.z*nz;if(outward>0){p.vel.x-=nx*outward*1.65;p.vel.z-=nz*outward*1.65}}
  p.g.position.copy(p.pos);const face=Math.atan2(p.facing.x,p.facing.y),diff=Math.atan2(Math.sin(face-p.g.rotation.y),Math.cos(face-p.g.rotation.y));p.g.rotation.y+=diff*Math.min(1,dt*12);
  const s=Math.hypot(p.vel.x,p.vel.z),ph=elapsed*9+p.id;p.g.userData.la.rotation.x=Math.sin(ph)*(s>.4?.55:0);p.g.userData.lb.rotation.x=-p.g.userData.la.rotation.x;
}
function transferBomb(from,to){if(!from||!to||from===to||!from.alive||!to.alive||passCooldown>0)return;bombHolder=to;passCooldown=.62;from.passes++;if(from.id===0)toast(`PASSED TO ${to.name.toUpperCase()}!`);else if(to.id===0)toast(`${from.name.toUpperCase()} TAGGED YOU!`)}
function collisions(){
  for(let i=0;i<players.length;i++)for(let j=i+1;j<players.length;j++){
    const a=players[i],b=players[j];if(!a.alive||!b.alive)continue;const dx=b.pos.x-a.pos.x,dz=b.pos.z-a.pos.z,d=Math.hypot(dx,dz);if(d<.9&&d>.001){const nx=dx/d,nz=dz/d,push=(.9-d)*.32;a.pos.x-=nx*push;a.pos.z-=nz*push;b.pos.x+=nx*push;b.pos.z+=nz*push;if(bombHolder===a)transferBomb(a,b);else if(bombHolder===b)transferBomb(b,a)}
  }
}
function explosionFx(p){
  const ring=new THREE.Mesh(new THREE.RingGeometry(.35,2.2,36),new THREE.MeshBasicMaterial({color:0xff5c42,transparent:true,opacity:.9,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(p.pos.x,.12,p.pos.z);ring.userData.life=.55;fx.add(ring);
  for(let i=0;i<18;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.06,6,4),new THREE.MeshBasicMaterial({color:i%2?0xffb13b:0xff4938}));m.position.set(p.pos.x,.7,p.pos.z);const a=i/18*Math.PI*2,sp=2.5+(i%5)*.45;m.userData={life:.6,v:new THREE.Vector3(Math.cos(a)*sp,1.2+(i%4)*.5,Math.sin(a)*sp)};fx.add(m)}
}
function explodeBomb(){
  if(!bombHolder||!bombHolder.alive)return;const p=bombHolder;explosionFx(p);p.alive=false;p.g.visible=false;eliminated.push(p.id);explosions++;if(p.id===0)toast('BOOM - YOU ARE OUT');else toast(`${p.name.toUpperCase()} BLEW UP!`);bombHolder=null;bombGroup.visible=false;nextBombDelay=1.1;
  if(alive().length===3)toast('TOP 3 LOCKED!');if(alive().length<=1)endMatch();
}
function updateFx(dt){
  for(let i=fx.children.length-1;i>=0;i--){const o=fx.children[i];o.userData.life-=dt;if(o.userData.v){o.userData.v.y-=6*dt;o.position.addScaledVector(o.userData.v,dt)}else{o.scale.multiplyScalar(1+dt*4.5);o.material.opacity=Math.max(0,o.userData.life/.55*.9)}if(o.userData.life<=0){fx.remove(o);o.geometry.dispose();o.material.dispose()}}
}
function ranking(){const live=alive().slice().sort((a,b)=>a.bombTime-b.bombTime||b.passes-a.passes);const dead=eliminated.slice().reverse().map(id=>players[id]);return live.concat(dead)}
function board(){
  const r=ranking();$('leaderboard').innerHTML=r.map((p,i)=>`<div class="lb-row ${p.id===0?'you':''} ${bombHolder&&bombHolder.id===p.id?'bomb':''}"><b>${i+1}</b><span>${p.name}</span><span>${!p.alive?'OUT':bombHolder&&bombHolder.id===p.id?'BOMB':'SAFE'}</span></div>`).join('');
  $('aliveValue').textContent=`${alive().length} / ${PLAYERS}`;$('carrierValue').textContent=bombHolder?bombHolder.name.toUpperCase():'--';$('fuseValue').textContent=bombHolder?bombFuse.toFixed(1):'--';
  const youBomb=bombHolder&&bombHolder.id===0&&players[0].alive;document.body.classList.toggle('has-bomb',!!youBomb);$('bombAlert').classList.toggle('hidden',!youBomb);if(youBomb)$('bombAlertTime').textContent=bombFuse.toFixed(1);
}
function result(place){
  const prize=place<=3?PAYOUTS[place-1]:0;wallet+=prize;account.totalPrizes=(account.totalPrizes||0)+prize;if(place===1)account.wins=(account.wins||0)+1;account.totalMatches=(account.totalMatches||0)+1;account.matches=account.matches||[];
  account.matches.unshift({game:'bomb-tag',gameName:'Bomb Tag',place,prize,net:prize-ENTRY,lobby:ENTRY,passes:players[0].passes,bombTime:players[0].bombTime,detail:`${players[0].passes} passes - ${players[0].bombTime.toFixed(1)}s holding bomb`,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})});account.matches=account.matches.slice(0,50);save();
  $('resultPlace').textContent=`#${place}`;$('resultTitle').textContent=place===1?'WINNER':place<=3?'PODIUM FINISH':'ELIMINATED';$('resultReason').textContent=place<=3?'You survived into the paid top three.':'The bomb caught you before the paid places.';
  $('resultEntry').textContent=`-${money(ENTRY)}`;$('resultPrize').textContent=`+${money(prize)}`;$('resultPasses').textContent=String(players[0].passes);$('resultBombTime').textContent=`${players[0].bombTime.toFixed(1)}s`;$('resultNet').textContent=signed(prize-ENTRY);$('resultWallet').textContent=money(wallet);$('playAgainBtn').textContent=wallet>=ENTRY?`PLAY AGAIN - ${money(ENTRY)}`:'BACK TO ARCADE';
  setTimeout(()=>{$('overlay').classList.add('show');$('menuPanel').classList.add('hidden');$('resultPanel').classList.remove('hidden')},300);
}
function endMatch(){if(state==='result'||state==='menu')return;state='result';bombHolder=null;bombGroup.visible=false;document.body.classList.remove('has-bomb');$('bombAlert').classList.add('hidden');$('leaveBtn').classList.add('hidden');const r=ranking(),place=r.findIndex(p=>p.id===0)+1;result(place)}
function begin(){
  if(wallet<ENTRY)return;wallet-=ENTRY;save();updateEconomy();reset();count=3;elapsed=0;state='countdown';$('overlay').classList.remove('show');$('menuPanel').classList.add('hidden');$('resultPanel').classList.add('hidden');$('countdown').classList.remove('hidden');$('countdownNumber').textContent='3';$('leaveBtn').classList.remove('hidden');
}
function leave(){if(!['play','countdown'].includes(state))return;account.totalMatches=(account.totalMatches||0)+1;account.matches=account.matches||[];account.matches.unshift({game:'bomb-tag',gameName:'Bomb Tag',forfeit:true,net:-ENTRY,lobby:ENTRY,detail:'Match left',time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})});save();location.href='../../index.html'}
function step(dt){
  dashBuffer=Math.max(0,dashBuffer-dt);passCooldown=Math.max(0,passCooldown-dt);
  if(state==='countdown'){count-=dt;if(count<=0){state='play';$('countdown').classList.add('hidden');chooseNextBomb();toast('GO!')}else $('countdownNumber').textContent=String(Math.ceil(count))}
  if(state==='play'){
    elapsed+=dt;for(const p of players)updatePlayer(p,dt);collisions();
    if(bombHolder&&bombHolder.alive){bombFuse-=dt;bombHolder.bombTime+=dt;if(bombFuse<=0)explodeBomb()}else if(nextBombDelay>0){nextBombDelay-=dt;if(nextBombDelay<=0&&alive().length>1)chooseNextBomb()}
    if(alive().length<=1)endMatch();
  }
  updateFx(dt);
}
function frame(n){
  const dt=Math.min(.05,(n-last)/1000||0);last=n;acc+=dt;while(acc>=FIXED){step(FIXED);acc-=FIXED}
  if(bombHolder&&bombHolder.alive){bombGroup.visible=true;bombGroup.position.set(bombHolder.pos.x,bombHolder.pos.y+2.05,bombHolder.pos.z);const pulse=1+Math.sin(elapsed*15)*.09;bombGroup.scale.setScalar(pulse);spark.material.color.setHex(bombFuse<2?0xffffff:0xff5a45)}else bombGroup.visible=false;
  if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').classList.remove('show')}
  board();$('walletValue').textContent=money(wallet);renderer.render(scene,camera);requestAnimationFrame(frame);
}
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}
addEventListener('resize',resize);resize();addEventListener('keydown',e=>{keys.add(e.code);if(e.code==='Space'){e.preventDefault();dashBuffer=.15}});addEventListener('keyup',e=>keys.delete(e.code));
$('startBtn').onclick=begin;$('playAgainBtn').onclick=()=>wallet>=ENTRY?begin():location.href='../../index.html';$('leaveBtn').onclick=leave;
document.querySelectorAll('[data-key]').forEach(b=>{const k=b.dataset.key;b.onpointerdown=e=>{e.preventDefault();keys.add(k)};b.onpointerup=b.onpointercancel=b.onpointerleave=()=>keys.delete(k)});$('dashTouch').onpointerdown=e=>{e.preventDefault();dashBuffer=.15};
updateEconomy();board();requestAnimationFrame(frame);
})();
