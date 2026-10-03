(()=>{
'use strict';
const qs=new URLSearchParams(location.search);
const PLAYER_NAMES=['You','Nova','Mika','Rook','Volt','Pip','Zed','Kira','Atlas','Echo','Juno','Blaze','Orbit','Pixel','Dash','Luna','Kai','Remy','Sora','Axel','Nix','Tori','Jet','Mochi'];
function hash32(value){let h=2166136261>>>0;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0}return h>>>0}
function mix(a,b){let x=(a^Math.imul((b>>>0)+0x9e3779b9,0x85ebca6b))>>>0;x^=x>>>16;x=Math.imul(x,0x7feb352d)>>>0;x^=x>>>15;x=Math.imul(x,0x846ca68b)>>>0;x^=x>>>16;return x>>>0}
function entropy(){if(globalThis.crypto?.getRandomValues){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]>>>0}return ((Date.now()^Math.floor(performance.now()*1000)^Math.floor(Math.random()*0xffffffff))>>>0)}
function baseSeed(slug='game'){const explicit=qs.get('mapSeed')||qs.get('seed')||qs.get('matchSeed')||qs.get('match');return explicit?hash32(slug+':'+explicit):mix(hash32(slug),entropy())}
const counters=new Map();
function nextSeed(slug='game'){const n=(counters.get(slug)||0)+1;counters.set(slug,n);const explicit=qs.get('mapSeed')||qs.get('seed')||qs.get('matchSeed')||qs.get('match');return explicit?mix(baseSeed(slug),n-1):mix(baseSeed(slug),mix(entropy(),n))}
function rng(seed){let s=seed>>>0;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296)}
function randInt(r,min,max){return Math.floor(r()*(max-min+1))+min}
function choice(r,list){return list[Math.min(list.length-1,Math.floor(r()*list.length))]}
function shuffle(r,list){const out=list.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
function playerName(i){return PLAYER_NAMES[i]||`Player ${i+1}`}
function pick(slug,maps){if(!Array.isArray(maps)||!maps.length)return null;const seed=nextSeed(slug),r=rng(seed),key='skillArcadeLastMap:'+slug;let last=-1;try{last=Number(sessionStorage.getItem(key))}catch{}const choices=maps.map((_,i)=>i).filter(i=>maps.length<2||i!==last);const index=choice(r,choices);try{sessionStorage.setItem(key,String(index))}catch{}const source=maps[index];return {...source,seed,mapSeed:seed,procedural:true}}
window.SkillArcadeProcedural={hash32,mix,nextSeed,rng,randInt,choice,shuffle,playerName,PLAYER_NAMES};
window.SkillArcadeMaps={...(window.SkillArcadeMaps||{}),pick};
})();