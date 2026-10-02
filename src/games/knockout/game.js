(()=>{
'use strict';
const $=id=>document.getElementById(id);
if(!window.THREE){$('startBtn').disabled=true;$('startBtn').textContent='3D ENGINE FAILED TO LOAD';return;}
const THREE=window.THREE;
const qs=new URLSearchParams(location.search), rawEntry=Number(qs.get('entry'));
const ENTRY=[1,5,20].includes(rawEntry)?rawEntry:1;
const STORAGE='skillArcadeDemoAccountV1', PLAYERS=8, FEE=.05;
const PAYOUTS=[4.5,2.1,1].map(v=>v*ENTRY), POOL=PLAYERS*ENTRY*(1-FEE), FIXED=1/120;
const keys=new Set(), players=[], eliminated=[];
let state='menu',account=load(),wallet=account.wallet,count=3,elapsed=0,last=performance.now(),acc=0,dashBuffer=0,toastT=0;
function load(){const f={wallet:25,totalPrizes:0,wins:0,totalMatches:0,matches:[]};try{const d=JSON.parse(localStorage.getItem(STORAGE)||'null');return d?{...f,...d,matches:Array.isArray(d.matches)?d.matches:[]}:f}catch{return f}}
function save(){account.wallet=Math.max(0,wallet);localStorage.setItem(STORAGE,JSON.stringify(account))}
function money(v){return `$${Math.max(0,+v||0).toFixed(2)}`}
function signed(v){return `${v>=0?'+':'-'}$${Math.abs(v).toFixed(2)}`}
function toast(s){$('toast').textContent=s;$('toast').classList.add('show');toastT=1.05}
function updateEconomy(){
  $('entryValue').textContent=money(ENTRY);$('poolValue').textContent=money(POOL);
  $('p1').textContent=money(PAYOUTS[0]);$('p2').textContent=money(PAYOUTS[1]);$('p3').textContent=money(PAYOUTS[2]);
  $('walletValue').textContent=$('lobbyWallet').textContent=money(wallet);
  $('startBtn').textContent=wallet>=ENTRY?`ENTER MATCH - ${money(ENTRY)}`:'INSUFFICIENT DEMO BALANCE';$('startBtn').disabled=wallet<ENTRY;
}
const renderer=new THREE.WebGLRenderer({canvas:$('game'),antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.shadowMap.enabled=true;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x201749);scene.fog=new THREE.Fog(0x201749,30,90);
const camera=new THREE.PerspectiveCamera(56,1,.05,120);camera.position.set(0,14.5,13.5);camera.lookAt(0,0,0);scene.add(camera);
scene.add(new THREE.HemisphereLight(0xbddcff,0x2d1943,1.7));
const sun=new THREE.DirectionalLight(0xffffff,2);sun.position.set(-15,25,-14);sun.castShadow=true;scene.add(sun);
const world=new THREE.Group(),root=new THREE.Group(),fx=new THREE.Group();scene.add(world,root,fx);
const mat=(c,r=.65)=>new THREE.MeshStandardMaterial({color:c,roughness:r});
const floorM=mat(0x6351a6),floor2=mat(0x493d82),coreM=mat(0x2f6f7d),lavaM=new THREE.MeshStandardMaterial({color:0xff4d16,emissive:0xff2100,emissiveIntensity:1.5,roughness:.4});
function box(w,h,d,x,y,z,m){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;world.add(o);return o}
box(32,.6,32,0,-5,0,lavaM);box(7.6,.55,7.6,0,-.25,0,coreM);
const mid=[],outer=[];
for(const [arr,half,inner,m] of [[mid,5.5,3.8,floor2],[outer,7.5,5.5,floorM]]){
  const w=half-inner;
  arr.push(box(w,.55,half*2,-(inner+w/2),-.25,0,m),box(w,.55,half*2,(inner+w/2),-.25,0,m),box(inner*2,.55,w,0,-.25,-(inner+w/2),m),box(inner*2,.55,w,0,-.25,(inner+w/2),m));
}
const colors=[0xffd84e,0xff6e9d,0x60d9b7,0x61c5ff,0xb18cff,0xff8a55,0x82e26f,0x4fc6d9],names=['You','Nova','Mika','Rook','Volt','Pip','Zed','Kira'];
function model(i){
  const g=new THREE.Group(),b=mat(colors[i],.55),d=mat(0x243142,.7),w=mat(0xffffff,.7);
  const body=new THREE.Mesh(new THREE.SphereGeometry(.5,16,12),b);body.scale.set(.9,1.08,.78);body.position.y=.78;g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.35,16,12),b);head.position.y=1.35;g.add(head);
  const visor=new THREE.Mesh(new THREE.BoxGeometry(.42,.16,.07),w);visor.position.set(0,1.39,.31);g.add(visor);
  const legGeo=new THREE.CylinderGeometry(.1,.12,.5,8),la=new THREE.Mesh(legGeo,d),lb=la.clone();la.position.set(-.18,.25,0);lb.position.set(.18,.25,0);g.add(la,lb);
  if(i===0)window.addYouMarker3D?.(THREE,g,{radius:.68,labelY:2.02});
  g.userData={la,lb};return g;
}
function reset(){
  root.clear();fx.clear();players.length=0;eliminated.length=0;
  const pts=[[-4.6,4.6],[0,4.9],[4.6,4.6],[-4.9,0],[4.9,0],[-4.6,-4.6],[0,-4.9],[4.6,-4.6]];
  for(let i=0;i<PLAYERS;i++){
    const g=model(i);root.add(g);
    players.push({id:i,name:names[i],g,pos:new THREE.Vector3(pts[i][0],.05,pts[i][1]),vel:new THREE.Vector3(),alive:true,dashCd:0,dashTime:0,stun:0,facing:new THREE.Vector2(0,-1),lastHit:null,lastHitT:0,kos:0,hitCd:0,bot:i>0,skill:i?[.86,.9,.82,.94,.88,.91,.85][i-1]:1});
  }
}
reset();
function arenaHalf(){return elapsed<25?7.5:elapsed<50?5.5:3.8}
function updateRings(){const dropOuter=elapsed>=25,dropMid=elapsed>=50;for(const m of outer)m.position.y+=((dropOuter?-5:-.25)-m.position.y)*.08;for(const m of mid)m.position.y+=((dropMid?-5:-.25)-m.position.y)*.08}
function inputFor(p){
  if(!p.bot){
    const x=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0);
    const z=(keys.has('KeyS')?1:0)-(keys.has('KeyW')?1:0);
    return{x,z,dash:dashBuffer>0};
  }
  const live=players.filter(q=>q.alive&&q.id!==p.id);
  const target=live.sort((a,b)=>Math.hypot(a.pos.x-p.pos.x,a.pos.z-p.pos.z)-Math.hypot(b.pos.x-p.pos.x,b.pos.z-p.pos.z))[0];
  let x=0,z=0;
  if(target){x=target.pos.x-p.pos.x;z=target.pos.z-p.pos.z;const l=Math.hypot(x,z)||1;x/=l;z/=l}
  const h=arenaHalf(),edge=Math.max(Math.abs(p.pos.x),Math.abs(p.pos.z));
  if(edge>h-1.3){x+=-p.pos.x*.9;z+=-p.pos.z*.9}
  const near=target?Math.hypot(target.pos.x-p.pos.x,target.pos.z-p.pos.z):99;
  return{x,z,dash:p.dashCd<=0&&near<2.0&&Math.sin(elapsed*2.2+p.id)>.25};
}
function pulse(p){
  const ring=new THREE.Mesh(new THREE.RingGeometry(.45,1.05,24),new THREE.MeshBasicMaterial({color:p.id===0?0xffef8a:colors[p.id],transparent:true,opacity:.65,side:THREE.DoubleSide}));
  ring.rotation.x=-Math.PI/2;ring.position.set(p.pos.x,.08,p.pos.z);ring.userData.life=.22;fx.add(ring);
}
function knock(victim,attacker,power){
  if(victim.hitCd>0||!victim.alive)return;
  victim.hitCd=.28;victim.stun=.42;
  let dx=victim.pos.x-attacker.pos.x,dz=victim.pos.z-attacker.pos.z,l=Math.hypot(dx,dz)||1;
  victim.vel.x=dx/l*power;victim.vel.z=dz/l*power;victim.vel.y=Math.max(victim.vel.y,3.1);
  victim.lastHit=attacker.id;victim.lastHitT=2.4;pulse(victim);
}
function updatePlayer(p,dt){
  if(!p.alive)return;
  p.dashCd=Math.max(0,p.dashCd-dt);p.hitCd=Math.max(0,p.hitCd-dt);p.stun=Math.max(0,p.stun-dt);p.lastHitT=Math.max(0,p.lastHitT-dt);
  const inp=p.stun>0?{x:0,z:0,dash:false}:inputFor(p),len=Math.hypot(inp.x,inp.z);
  if(len>.05){
    const nx=inp.x/len,nz=inp.z/len;p.facing.set(nx,nz);
    const sp=4.9*p.skill,blend=1-Math.exp(-13*dt);
    p.vel.x+=(nx*sp-p.vel.x)*blend;p.vel.z+=(nz*sp-p.vel.z)*blend;
  }else{
    const drag=Math.exp(-(p.stun>0?1.5:9)*dt);p.vel.x*=drag;p.vel.z*=drag;
  }
  if(inp.dash&&p.dashCd<=0){
    p.dashCd=.95;p.dashTime=.27;p.vel.x=p.facing.x*13.6;p.vel.z=p.facing.y*13.6;pulse(p);if(!p.bot)dashBuffer=0;
  }
  p.dashTime=Math.max(0,p.dashTime-dt);p.vel.y-=18*dt;p.pos.addScaledVector(p.vel,dt);
  if(p.pos.y<=.05&&Math.max(Math.abs(p.pos.x),Math.abs(p.pos.z))<=arenaHalf()){p.pos.y=.05;p.vel.y=0}
  else if(Math.max(Math.abs(p.pos.x),Math.abs(p.pos.z))>arenaHalf()+.12)p.vel.y-=12*dt;
  if(p.pos.y<-4){
    p.alive=false;eliminated.push(p.id);p.g.visible=false;
    if(p.lastHitT>0&&p.lastHit!==null){players[p.lastHit].kos++;if(p.id===0||p.lastHit===0)toast(p.lastHit===0?'KNOCKOUT!':`${players[p.lastHit].name} knocked you out`)}
    if(alive().length<=1)endMatch('last');
  }
  p.g.position.copy(p.pos);
  const face=Math.atan2(p.facing.x,p.facing.y),diff=Math.atan2(Math.sin(face-p.g.rotation.y),Math.cos(face-p.g.rotation.y));p.g.rotation.y+=diff*Math.min(1,dt*12);
  const s=Math.hypot(p.vel.x,p.vel.z),ph=elapsed*9+p.id;p.g.userData.la.rotation.x=Math.sin(ph)*(s>.4?.55:0);p.g.userData.lb.rotation.x=-p.g.userData.la.rotation.x;
}
function collisions(){
  for(let i=0;i<players.length;i++)for(let j=i+1;j<players.length;j++){
    const a=players[i],b=players[j];if(!a.alive||!b.alive)continue;
    const dx=b.pos.x-a.pos.x,dz=b.pos.z-a.pos.z,d=Math.hypot(dx,dz);if(d>=1.05||d<.001)continue;
    if(a.dashTime>0)knock(b,a,15.5);if(b.dashTime>0)knock(a,b,15.5);
    const nx=dx/d,nz=dz/d,push=(1.05-d)*.24;
    a.pos.x-=nx*push;a.pos.z-=nz*push;b.pos.x+=nx*push;b.pos.z+=nz*push;
  }
}
function alive(){return players.filter(p=>p.alive)}
function finalRanking(){const a=alive().slice().sort((x,y)=>y.kos-x.kos||Math.hypot(x.pos.x,x.pos.z)-Math.hypot(y.pos.x,y.pos.z));const dead=eliminated.slice().reverse().map(id=>players[id]);return a.concat(dead)}
function renderBoard(){
  const r=finalRanking();
  $('leaderboard').innerHTML=r.map((p,i)=>`<div class="lb-row ${p.id===0?'you':''}"><b>${i+1}</b><span>${p.name}</span><span>${p.alive?`${p.kos} KO`:'OUT'}</span></div>`).join('');
  $('aliveValue').textContent=`${alive().length} / ${PLAYERS}`;
  $('dashValue').textContent=players[0].alive?(players[0].dashCd<=0?'READY':players[0].dashCd.toFixed(1)):'OUT';
}
function updateFx(dt){for(let i=fx.children.length-1;i>=0;i--){const o=fx.children[i];o.userData.life-=dt;o.scale.multiplyScalar(1+dt*5);o.material.opacity=Math.max(0,o.userData.life/.22*.65);if(o.userData.life<=0){fx.remove(o);o.geometry.dispose();o.material.dispose()}}}
function showResult(place){
  const prize=place<=3?PAYOUTS[place-1]:0;wallet+=prize;account.totalPrizes=(account.totalPrizes||0)+prize;if(place===1)account.wins=(account.wins||0)+1;account.totalMatches=(account.totalMatches||0)+1;
  account.matches=account.matches||[];account.matches.unshift({game:'knockout',gameName:'Knockout',place,prize,net:prize-ENTRY,lobby:ENTRY,kos:players[0].kos,detail:`${players[0].kos} KOs - Last standing`,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})});account.matches=account.matches.slice(0,50);save();
  $('resultPlace').textContent=`#${place}`;$('resultTitle').textContent=place===1?'WINNER':place<=3?'PODIUM FINISH':'ELIMINATED';$('resultReason').textContent=place<=3?'You finished in the paid top three.':'You finished outside the paid places.';
  $('resultEntry').textContent=`-${money(ENTRY)}`;$('resultPrize').textContent=`+${money(prize)}`;$('resultKos').textContent=String(players[0].kos);$('resultNet').textContent=signed(prize-ENTRY);$('resultWallet').textContent=money(wallet);
  $('playAgainBtn').textContent=wallet>=ENTRY?`PLAY AGAIN - ${money(ENTRY)}`:'BACK TO ARCADE';
  setTimeout(()=>{$('overlay').classList.add('show');$('menuPanel').classList.add('hidden');$('resultPanel').classList.remove('hidden')},300);
}
function endMatch(){if(state==='result'||state==='menu')return;state='result';const r=finalRanking(),place=r.findIndex(p=>p.id===0)+1;$('leaveBtn').classList.add('hidden');showResult(place)}
function begin(){if(wallet<ENTRY)return;wallet-=ENTRY;save();updateEconomy();reset();count=3;elapsed=0;state='countdown';$('overlay').classList.remove('show');$('menuPanel').classList.add('hidden');$('resultPanel').classList.add('hidden');$('countdown').classList.remove('hidden');$('countdownNumber').textContent='3';$('leaveBtn').classList.remove('hidden');toast('DASH INTO PLAYERS TO KNOCK THEM OUT')}
function forfeit(){if(!['play','countdown'].includes(state))return;account.totalMatches=(account.totalMatches||0)+1;account.matches=account.matches||[];account.matches.unshift({game:'knockout',gameName:'Knockout',forfeit:true,net:-ENTRY,lobby:ENTRY,detail:'Match left',time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})});save();location.href='../../index.html'}
function step(dt){
  dashBuffer=Math.max(0,dashBuffer-dt);
  if(state==='countdown'){count-=dt;if(count<=0){state='play';$('countdown').classList.add('hidden');toast('GO!')}else $('countdownNumber').textContent=String(Math.ceil(count))}
  if(state==='play'){elapsed+=dt;updateRings();for(const p of players)updatePlayer(p,dt);collisions();if(alive().length<=1)endMatch()}
  updateFx(dt);
}
function frame(n){
  const dt=Math.min(.05,(n-last)/1000||0);last=n;acc+=dt;while(acc>=FIXED){step(FIXED);acc-=FIXED}
  if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').classList.remove('show')}
  renderBoard();$('timeValue').textContent=elapsed<25?'FULL':elapsed<50?'SMALLER':'FINAL';$('walletValue').textContent=money(wallet);renderer.render(scene,camera);requestAnimationFrame(frame);
}
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}
addEventListener('resize',resize);resize();
addEventListener('keydown',e=>{keys.add(e.code);if(e.code==='Space'){e.preventDefault();dashBuffer=.15}});addEventListener('keyup',e=>keys.delete(e.code));
$('startBtn').onclick=begin;$('playAgainBtn').onclick=()=>wallet>=ENTRY?begin():location.href='../../index.html';$('leaveBtn').onclick=forfeit;
document.querySelectorAll('[data-key]').forEach(b=>{const k=b.dataset.key;b.onpointerdown=e=>{e.preventDefault();keys.add(k)};b.onpointerup=b.onpointercancel=b.onpointerleave=()=>keys.delete(k)});
$('dashTouch').onpointerdown=e=>{e.preventDefault();dashBuffer=.15};
updateEconomy();renderBoard();requestAnimationFrame(frame);
})();
