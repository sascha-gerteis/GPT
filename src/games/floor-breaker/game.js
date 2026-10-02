(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const canvas = $('game');
  const shell = $('gameShell');
  const overlay = $('overlay');
  const menuPanel = $('menuPanel');
  const resultPanel = $('resultPanel');
  const startBtn = $('startBtn');
  const playAgainBtn = $('playAgainBtn');
  const exitBtn = $('exitBtn');
  const leaveBtn = $('leaveBtn');
  const soundBtn = $('soundBtn');
  const walletCard = $('walletCard');
  const walletValue = $('walletValue');
  const walletPop = $('walletPop');
  const timeValue = $('timeValue');
  const aliveValue = $('aliveValue');
  const blocksValue = $('blocksValue');
  const koValue = $('koValue');
  const standingsEl = $('standings');
  const eventFeed = $('eventFeed');
  const matchStateBadge = $('matchStateBadge');
  const countdownEl = $('countdown');
  const countdownNumber = $('countdownNumber');
  const countdownLabel = $('countdownLabel');
  const spectatorBar = $('spectatorBar');
  const spectateName = $('spectateName');
  const spectatePrev = $('spectatePrev');
  const spectateNext = $('spectateNext');
  const newMatchSpectate = $('newMatchSpectate');
  const exitSpectate = $('exitSpectate');
  const crosshair = $('crosshair');
  const toastEl = $('toast');
  const touchControls = $('touchControls');
  const joystick = $('joystick');
  const joystickKnob = $('joystickKnob');
  const jumpTouch = $('jumpTouch');
  const fireTouch = $('fireTouch');
  const winnerName = $('winnerName');
  const lobbyWalletBalance = $('lobbyWalletBalance');
  const lobbyWon = $('lobbyWon');
  const lobbyMatches = $('lobbyMatches');
  const lobbyWins = $('lobbyWins');
  const resetDemoBtn = $('resetDemoBtn');
  const recentMatches = $('recentMatches');
  const historyCount = $('historyCount');
  const entryMessage = $('entryMessage');
  const grossPoolValue = $('grossPoolValue');
  const feeValue = $('feeValue');
  const prizePoolValue = $('prizePoolValue');
  const payout1Value = $('payout1Value');
  const payout2Value = $('payout2Value');
  const payout3Value = $('payout3Value');
  const resultNet = $('resultNet');
  const entryPriceValue = $('entryPriceValue');
  const resultFee = $('resultFee');

  if (!window.THREE) {
    startBtn.disabled = true;
    startBtn.textContent = '3D ENGINE FAILED TO LOAD';
    menuPanel.querySelector('p').textContent = 'This build needs an internet connection so the Three.js engine can load. Reopen while online.';
    return;
  }

  const THREE = window.THREE;
  const IS_TOUCH = matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 0 || innerWidth < 900;

  const query = new URLSearchParams(location.search);
  const requestedEntry = Number(query.get('entry'));
  const LOBBY_ENTRY = [1,5,20].includes(requestedEntry) ? requestedEntry : 1;

  // Block Crash-inspired setup: one dense floor, twelve players, lava, last alive wins.
  const PLAYERS = 12;
  const COLS = 60;
  const ROWS = 60;
  const TILE = 0.82;
  const TILE_H = 0.30;
  const BOARD_W = COLS * TILE;
  const BOARD_D = ROWS * TILE;
  const FLOOR_Y = 0;
  const FLOOR_TOP = FLOOR_Y + TILE_H * 0.5;
  const LAVA_Y = -5.4;
  const KILL_Y = -4.85;
  const ROUND_SECONDS = 330;
  const ENTRY_FEE = LOBBY_ENTRY;
  const KO_REWARD = 0; // KOs are a skill stat; all competition money stays inside the displayed top-three prize pool.
  const PRIZES = [6.00, 3.40, 2.00].map(v => v * ENTRY_FEE);
  const DEMO_START_BALANCE = 25.00;
  const STORAGE_KEY = 'skillArcadeDemoAccountV1';
  const GRAVITY = 21.5;
  const MAX_SPEED = 5.9;
  const GROUND_ACCEL = 38;
  const AIR_ACCEL = 9;
  const PLAYER_RADIUS = 0.48;
  const PLAYER_HEIGHT = 1.72;
  const JUMP_VY = 6.15;
  const FIXED_DT = 1 / 120;
  const ROCKET_SPEED = 24;
  const ROCKET_COOLDOWN = 0.72;
  const ROCKET_LIFE = 2.6;
  const BLAST_RADIUS = 1.70;
  const ROCKET_JUMP_RADIUS = 1.65;
  const ROCKET_JUMP_VY = 8.8;
  const ROCKET_JUMP_COOLDOWN = 0.90;
  const ROCKET_JUMP_GROUND_WINDOW = 0.26;
  const NAMES = ['You','Nova','Mika','Rook','Volt','Pip','Zed','Kira','Atlas','Echo','Juno','Blaze'];
  const COLORS = [0xffd84e,0xff5f83,0x55d6b0,0x53c8ff,0x9f7cff,0xff8a4f,0x77dd67,0x42d1d6,0xffb347,0xe66cff,0x6f8cff,0xff6b57];
  const BASE_TILE = new THREE.Color(0x3a83bd);
  const CRACKED_TILE = new THREE.Color(0xc07a3c);
  const DAMAGED_TILE = new THREE.Color(0xe9a24f);
  const DEAD_TILE = new THREE.Color(0x07131a);

  function loadDemoAccount() {
    const fallback = { wallet: DEMO_START_BALANCE, totalPrizes: 0, wins: 0, totalMatches: 0, matches: [] };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      const data = JSON.parse(raw);
      return {
        wallet: Number.isFinite(Number(data.wallet)) ? Math.max(0, Number(data.wallet)) : fallback.wallet,
        totalPrizes: Number.isFinite(Number(data.totalPrizes)) ? Math.max(0, Number(data.totalPrizes)) : 0,
        wins: Number.isFinite(Number(data.wins)) ? Math.max(0, Number(data.wins)) : 0,
        totalMatches: Number.isFinite(Number(data.totalMatches)) ? Math.max(0, Number(data.totalMatches)) : (Array.isArray(data.matches) ? data.matches.length : 0),
        matches: Array.isArray(data.matches) ? data.matches.slice(0, 10) : []
      };
    } catch (_) { return fallback; }
  }
  let account = loadDemoAccount();
  function saveDemoAccount() {
    account.wallet = Math.max(0, wallet);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(account)); } catch (_) {}
  }

  let state = 'menu';
  let wallet = account.wallet;
  let walletShown = wallet;
  let roundTime = ROUND_SECONDS;
  let countdownTime = 3;
  let elapsed = 0;
  let lastFrame = performance.now();
  let accumulator = 0;
  let eliminationCounter = 0;
  let endLocked = false;
  let spectateId = null;
  let soundEnabled = true;
  let audioCtx = null;
  let toastTimer = 0;
  let uiTimer = 0;
  let cameraShake = 0;
  let activeMatchRecorded = true;
  let lookYaw = 0;
  let lookPitch = -0.13;
  let pointerLocked = false;
  let jumpRequested = false;
  let fireRequested = false;
  let joystickPointer = null;
  let touchLookPointer = null;
  let touchFireHeld = false;
  let touchLookLast = null;
  const touchMove = { x: 0, z: 0 };

  const keys = new Set();
  const players = [];
  const tiles = [];
  const projectiles = [];
  const effects = [];
  const feed = [];
  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  const tmpM = new THREE.Matrix4();
  const tmpQ = new THREE.Quaternion();
  const tmpS = new THREE.Vector3(1, 1, 1);
  const raycaster = new THREE.Raycaster();

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, IS_TOUCH ? 1.30 : 1.7));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1b28);
  scene.fog = new THREE.FogExp2(0x0b1b28, 0.014);

  const camera = new THREE.PerspectiveCamera(78, 16 / 9, 0.04, 160);
  scene.add(camera);

  const arenaRoot = new THREE.Group();
  const playerRoot = new THREE.Group();
  const effectRoot = new THREE.Group();
  scene.add(arenaRoot, playerRoot, effectRoot);

  const hemi = new THREE.HemisphereLight(0xb7ddff, 0x17202a, 1.45);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2.0);
  sun.position.set(-16, 28, 14);
  sun.castShadow = true;
  sun.shadow.mapSize.set(IS_TOUCH ? 1024 : 2048, IS_TOUCH ? 1024 : 2048);
  sun.shadow.camera.left = -28;
  sun.shadow.camera.right = 28;
  sun.shadow.camera.top = 28;
  sun.shadow.camera.bottom = -28;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 80;
  scene.add(sun);

  const lavaUniforms = { uTime: { value: 0 } };
  const lavaMaterial = new THREE.ShaderMaterial({
    uniforms: lavaUniforms,
    side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform float uTime;varying vec2 vUv;void main(){vec2 p=vUv*vec2(35.,35.);float a=sin(p.x*1.17+uTime*1.5);float b=sin(p.y*1.38-uTime*1.15);float c=sin((p.x+p.y)*.72+uTime*.9);float h=(a+b+c)/3.;float v=smoothstep(-.1,.75,h);vec3 c1=vec3(.20,.008,.001);vec3 c2=vec3(1.,.12,0.);vec3 c3=vec3(1.,.72,.08);vec3 col=mix(c1,c2,v);col=mix(col,c3,smoothstep(.55,.92,h));gl_FragColor=vec4(col,1.);}`
  });
  const lava = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), lavaMaterial);
  lava.rotation.x = -Math.PI / 2;
  lava.position.y = LAVA_Y;
  scene.add(lava);
  const lavaLight = new THREE.PointLight(0xff4c12, 2.8, 75, 1.5);
  lavaLight.position.set(0, LAVA_Y + 0.7, 0);
  scene.add(lavaLight);

  // Coliseum-style scenery that never affects gameplay/collision.
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x30404c, roughness: 0.78, metalness: 0.03 });
  const darkStone = new THREE.MeshStandardMaterial({ color: 0x1d2b35, roughness: 0.82 });
  function addScenery() {
    const wallH = 2.9;
    const wallT = 1.1;
    const y = 1.15;
    const n = new THREE.Mesh(new THREE.BoxGeometry(BOARD_W + 5, wallH, wallT), stoneMat);
    const s = n.clone();
    const e = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, BOARD_D + 5), stoneMat);
    const w = e.clone();
    n.position.set(0, y, -BOARD_D / 2 - 3.4);
    s.position.set(0, y, BOARD_D / 2 + 3.4);
    e.position.set(BOARD_W / 2 + 3.4, y, 0);
    w.position.set(-BOARD_W / 2 - 3.4, y, 0);
    arenaRoot.add(n, s, e, w);
    const pillarGeo = new THREE.BoxGeometry(2.2, 5.4, 2.2);
    for (const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]]) {
      const p = new THREE.Mesh(pillarGeo, darkStone);
      p.position.set(x*(BOARD_W/2+2.0), 2.1, z*(BOARD_D/2+2.0));
      p.castShadow = true;
      arenaRoot.add(p);
    }
  }
  addScenery();

  const viewWeapon = new THREE.Group();
  const gunDark = new THREE.MeshStandardMaterial({ color: 0x23323d, roughness: 0.36, metalness: 0.52 });
  const gunMid = new THREE.MeshStandardMaterial({ color: 0x496071, roughness: 0.38, metalness: 0.28 });
  const gunGold = new THREE.MeshStandardMaterial({ color: 0xffca45, roughness: 0.35, metalness: 0.18, emissive: 0x603800, emissiveIntensity: 0.32 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xeab08b, roughness: 0.72 });
  const gb = new THREE.Mesh(new THREE.BoxGeometry(.21,.21,.76), gunDark); gb.position.z = -.05;
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(.15,.15,.48), gunMid); barrel.position.z = -.62;
  const muzzle = new THREE.Mesh(new THREE.BoxGeometry(.22,.22,.18), gunGold); muzzle.position.z = -.92;
  const grip = new THREE.Mesh(new THREE.BoxGeometry(.15,.33,.16), gunDark); grip.position.set(0,-.25,.11);
  const hand = new THREE.Mesh(new THREE.BoxGeometry(.25,.22,.29), skin); hand.position.set(.01,-.38,.11);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(.23,.23,.50), skin); arm.position.set(.17,-.43,.31); arm.rotation.y = -.15;
  viewWeapon.add(gb, barrel, muzzle, grip, hand, arm);
  viewWeapon.position.set(.49,-.37,-.74);
  viewWeapon.rotation.set(-.04,-.035,0);
  viewWeapon.userData.base = viewWeapon.position.clone();
  viewWeapon.userData.recoil = 0;
  viewWeapon.visible = false;
  camera.add(viewWeapon);

  let floorMesh = null;
  const tileGeo = new THREE.BoxGeometry(TILE * .94, TILE_H, TILE * .94);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .64, metalness: .04, vertexColors: true });

  function money(v) { return `CR ${Math.max(0, v).toFixed(2)}`; }
  function signedMoney(v) { return `${v >= 0 ? '+' : '−'}CR ${Math.abs(v).toFixed(2)}`; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function updateEconomyLabels() {
    const gross = PLAYERS * ENTRY_FEE;
    const prizePool = PRIZES.reduce((sum, value) => sum + value, 0);
    const fee = Math.max(0, gross - prizePool);
    const feePct = gross > 0 ? (fee / gross) * 100 : 0;
    if (entryPriceValue) entryPriceValue.textContent = money(ENTRY_FEE);
    if (grossPoolValue) grossPoolValue.textContent = money(gross);
    if (feeValue) feeValue.textContent = `−${money(fee)} · ${feePct.toFixed(0)}%`;
    if (prizePoolValue) prizePoolValue.textContent = money(prizePool);
    if (payout1Value) payout1Value.textContent = money(PRIZES[0] || 0);
    if (payout2Value) payout2Value.textContent = money(PRIZES[1] || 0);
    if (payout3Value) payout3Value.textContent = money(PRIZES[2] || 0);
    if (resultFee) resultFee.textContent = `${feePct.toFixed(0)}% total pool fee`;
  }

  function renderRecentMatches() {
    if (!recentMatches || !historyCount) return;
    const matches = (account.matches || []).filter(m => !m.game || m.game === 'floor-breaker');
    historyCount.textContent = `${matches.length} PLAYED`;
    if (!matches.length) {
      recentMatches.innerHTML = '<div class="history-empty">Completed matches will appear here.</div>';
      return;
    }
    recentMatches.innerHTML = matches.slice(0, 6).map(m => {
      const placeLabel = m.forfeit ? 'LEFT' : `#${m.place}`;
      const placeClass = !m.forfeit && m.place === 1 ? 'win' : '';
      const net = Number(m.net) || 0;
      return `<div class="history-row"><div class="history-place ${placeClass}">${placeLabel}</div><div class="history-info"><b>${m.forfeit ? 'Match left early' : (m.place === 1 ? 'Victory' : `Finished #${m.place}`)}</b><span>${m.blocks || 0} blocks · ${m.kos || 0} KOs · ${m.time || ''}</span></div><div class="history-net ${net >= 0 ? 'positive' : 'negative'}">${signedMoney(net)}</div></div>`;
    }).join('');
  }

  function updateLobbyAccount() {
    if (lobbyWalletBalance) lobbyWalletBalance.textContent = money(wallet);
    if (lobbyWon) lobbyWon.textContent = money(account.totalPrizes || 0);
    if (lobbyMatches) lobbyMatches.textContent = String(account.totalMatches || 0);
    if (lobbyWins) lobbyWins.textContent = String(account.wins || 0);
    const canEnter = wallet + 1e-9 >= ENTRY_FEE;
    if (startBtn) {
      startBtn.disabled = !canEnter;
      startBtn.textContent = canEnter ? `PLAY MATCH · ${money(ENTRY_FEE)}` : 'NOT ENOUGH BETA CREDITS';
    }
    if (playAgainBtn) {
      playAgainBtn.disabled = !canEnter;
      playAgainBtn.textContent = canEnter ? `PLAY AGAIN · ${money(ENTRY_FEE)}` : 'BACK TO LOBBY';
    }
    if (entryMessage) entryMessage.textContent = canEnter ? `${money(ENTRY_FEE)} demo entry is deducted when the match starts.` : 'Reset the demo balance to continue testing. Real deposits remain disabled.';
    renderRecentMatches();
  }

  function recordMatch(place, prize, earnings, blocks, kos, forfeit=false) {
    if (activeMatchRecorded) return;
    activeMatchRecorded = true;
    const net = (Number(prize) || 0) + (Number(earnings) || 0) - ENTRY_FEE;
    if (!forfeit) {
      account.totalPrizes = (account.totalPrizes || 0) + (Number(prize) || 0);
      if (place === 1) account.wins = (account.wins || 0) + 1;
    }
    account.totalMatches = (account.totalMatches || 0) + 1;
    account.matches = account.matches || [];
    account.matches.unshift({
      place: forfeit ? null : place,
      prize: Number(prize) || 0,
      earnings: Number(earnings) || 0,
      blocks: Number(blocks) || 0,
      kos: Number(kos) || 0,
      net,
      forfeit: !!forfeit,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      game: 'floor-breaker',
      gameName: 'Floor Breaker',
      lobby: ENTRY_FEE
    });
    account.matches = account.matches.slice(0, 10);
    saveDemoAccount();
    updateLobbyAccount();
  }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function lerpFactor(speed, dt) { return 1 - Math.exp(-speed * dt); }
  function formatTime(s) { const n = Math.max(0, Math.ceil(s)); return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`; }
  function idx(c, r) { return r * COLS + c; }
  function inGrid(c, r) { return c >= 0 && c < COLS && r >= 0 && r < ROWS; }
  function cellCenterX(c) { return -BOARD_W/2 + (c+.5)*TILE; }
  function cellCenterZ(r) { return -BOARD_D/2 + (r+.5)*TILE; }
  function cellFromWorld(x,z) { return { c:Math.floor((x+BOARD_W/2)/TILE), r:Math.floor((z+BOARD_D/2)/TILE) }; }
  function tileAtCell(c,r) { return inGrid(c,r) ? tiles[idx(c,r)] : null; }

  function clearGroup(group) { while (group.children.length) group.remove(group.children[0]); }

  function ensureAudio() {
    if (!soundEnabled) return null;
    if (!audioCtx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) audioCtx = new AC(); }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
    return audioCtx;
  }
  function tone(freq,dur,type='sine',gain=.02,endFreq=null,delay=0) {
    const ac=ensureAudio(); if(!ac) return;
    const now=ac.currentTime+delay, o=ac.createOscillator(), g=ac.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,now);if(endFreq)o.frequency.exponentialRampToValueAtTime(Math.max(30,endFreq),now+dur);
    g.gain.setValueAtTime(gain,now);g.gain.exponentialRampToValueAtTime(.0001,now+dur);o.connect(g).connect(ac.destination);o.start(now);o.stop(now+dur);
  }
  function sfx(name) {
    if(!soundEnabled)return;
    if(name==='shoot')tone(190,.07,'square',.014,95);
    if(name==='boom'){tone(105,.13,'sawtooth',.024,45);tone(280,.05,'square',.01,95)}
    if(name==='count')tone(430,.07,'square',.012,360);
    if(name==='go'){tone(640,.09,'sine',.02,920);tone(920,.12,'sine',.015,1200,.07)}
    if(name==='coin'){tone(690,.08,'sine',.021,900);tone(920,.08,'sine',.014,1180,.05)}
    if(name==='ko'){tone(170,.18,'square',.024,65);tone(540,.12,'sine',.014,780,.07)}
    if(name==='win'){tone(523,.12,'sine',.022,659);tone(659,.12,'sine',.022,784,.11);tone(784,.18,'sine',.022,1046,.22)}
  }

  function addFeed(html,type='') {
    feed.unshift({html,type}); if(feed.length>5)feed.length=5;
    eventFeed.innerHTML = feed.map(e=>`<div class="feed-item ${e.type}">${e.html}</div>`).join('');
  }
  function showToast(text,toneName='') {
    toastEl.textContent=text;toastEl.className=`toast show ${toneName}`;toastTimer=1.25;
  }
  function creditWallet(amount,label) {
    wallet += amount;
    saveDemoAccount();
    updateLobbyAccount();
    walletPop.textContent=`+${money(amount)}`;
    walletPop.classList.remove('show');walletCard.classList.remove('flash');void walletPop.offsetWidth;
    walletPop.classList.add('show');walletCard.classList.add('flash');setTimeout(()=>walletCard.classList.remove('flash'),450);
    if(label)showToast(`${label} +${money(amount)}`,'reward');sfx('coin');
  }

  function setTileVisual(tile) {
    if(!floorMesh || !tile) return;
    const c = tile.hp <= 0 ? DEAD_TILE : tile.hp === 1 ? CRACKED_TILE : BASE_TILE;
    floorMesh.setColorAt(tile.id, c);
    const scale = tile.hp <= 0 ? .001 : 1;
    tmpS.set(scale, scale, scale);
    tmp.set(cellCenterX(tile.c), tile.hp<=0 ? -30 : FLOOR_Y, cellCenterZ(tile.r));
    tmpM.compose(tmp, tmpQ, tmpS);
    floorMesh.setMatrixAt(tile.id,tmpM);
    floorMesh.instanceMatrix.needsUpdate=true;
    if(floorMesh.instanceColor) floorMesh.instanceColor.needsUpdate=true;
  }

  function buildFloor() {
    if(floorMesh) arenaRoot.remove(floorMesh);
    tiles.length=0;
    floorMesh = new THREE.InstancedMesh(tileGeo, floorMat, COLS*ROWS);
    floorMesh.castShadow=true;floorMesh.receiveShadow=true;
    let id=0;
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
      const t={id,c,r,hp:2,lastHitBy:null,lastHitAt:-999};tiles.push(t);
      tmp.set(cellCenterX(c),FLOOR_Y,cellCenterZ(r));tmpS.set(1,1,1);tmpM.compose(tmp,tmpQ,tmpS);
      floorMesh.setMatrixAt(id,tmpM);floorMesh.setColorAt(id,BASE_TILE);id++;
    }
    floorMesh.instanceMatrix.needsUpdate=true;if(floorMesh.instanceColor)floorMesh.instanceColor.needsUpdate=true;
    arenaRoot.add(floorMesh);
  }

  function makePlayerMesh(p) {
    const g=new THREE.Group();
    const mat=new THREE.MeshStandardMaterial({color:p.color,roughness:.48,metalness:.08});
    const dark=new THREE.MeshStandardMaterial({color:0x14212a,roughness:.5,metalness:.22});
    const body=new THREE.Mesh(new THREE.BoxGeometry(.62,.82,.40),mat);body.position.y=.62;body.castShadow=true;
    const head=new THREE.Mesh(new THREE.BoxGeometry(.52,.52,.52),mat);head.position.y=1.28;head.castShadow=true;
    const visor=new THREE.Mesh(new THREE.BoxGeometry(.38,.15,.05),dark);visor.position.set(0,1.31,-.285);
    const leg1=new THREE.Mesh(new THREE.BoxGeometry(.22,.48,.24),mat);leg1.position.set(-.18,.20,0);
    const leg2=leg1.clone();leg2.position.x=.18;
    const launcher=new THREE.Mesh(new THREE.BoxGeometry(.16,.16,.72),dark);launcher.position.set(.43,.84,-.30);
    g.add(body,head,visor,leg1,leg2,launcher);g.position.set(p.x,p.y,p.z);p.group=g;playerRoot.add(g);
  }

  function resetArena() {
    clearGroup(playerRoot);clearGroup(effectRoot);projectiles.length=0;effects.length=0;players.length=0;feed.length=0;
    eliminationCounter=0;spectateId=null;endLocked=false;lookYaw=0;lookPitch=-.13;cameraShake=0;viewWeapon.userData.recoil=0;
    buildFloor();
    const spawnR=Math.min(BOARD_W,BOARD_D)*.31,spawns=Array.from({length:PLAYERS},(_,i)=>{const a=i/PLAYERS*Math.PI*2-.35;return[Math.cos(a)*spawnR,Math.sin(a)*spawnR]});
    for(let i=0;i<PLAYERS;i++){
      const p={id:i,name:NAMES[i],color:COLORS[i],x:spawns[i][0],z:spawns[i][1],y:FLOOR_TOP,vx:0,vz:0,vy:0,alive:true,grounded:true,lastGroundedAt:0,rocketJumpCd:0,rocketJumpedThisAir:false,shootCd:rand(.5,1.1),blocks:0,kos:0,earnings:0,survival:0,elimOrder:null,lastDamageBy:null,lastDamageAt:-999,lastForceBy:null,lastForceAt:-999,facingX:0,facingZ:-1,aiThink:rand(.15,.4),aiShoot:rand(1.0,1.8),aiMoveX:0,aiMoveZ:0,aiTargetId:null,lavaWarned:false};
      players.push(p);makePlayerMesh(p);
    }
    addFeed('<b>Match ready.</b> Dense block floor loaded.','');
    updateUI(true);
  }

  function supportAt(x,z) {
    // Capsule footprint support instead of a single center tile. This is the key fix
    // that prevents one destroyed block from instantly dropping a player.
    const minC=Math.floor((x-PLAYER_RADIUS+BOARD_W/2)/TILE)-1;
    const maxC=Math.floor((x+PLAYER_RADIUS+BOARD_W/2)/TILE)+1;
    const minR=Math.floor((z-PLAYER_RADIUS+BOARD_D/2)/TILE)-1;
    const maxR=Math.floor((z+PLAYER_RADIUS+BOARD_D/2)/TILE)+1;
    let supports=0;
    for(let r=minR;r<=maxR;r++)for(let c=minC;c<=maxC;c++){
      const t=tileAtCell(c,r);if(!t||t.hp<=0)continue;
      const cx=cellCenterX(c),cz=cellCenterZ(r),half=TILE*.47;
      const closestX=clamp(x,cx-half,cx+half),closestZ=clamp(z,cz-half,cz+half);
      const dx=x-closestX,dz=z-closestZ;
      if(dx*dx+dz*dz<=PLAYER_RADIUS*PLAYER_RADIUS) supports++;
    }
    return supports;
  }

  function isSafeAhead(x,z) { return supportAt(x,z)>=1; }

  function damageTile(c,r,amount,ownerId) {
    const t=tileAtCell(c,r);if(!t||t.hp<=0)return false;
    t.lastHitBy=ownerId;t.lastHitAt=elapsed;
    const before=t.hp;t.hp=Math.max(0,t.hp-amount);setTileVisual(t);
    if(before>0&&t.hp===0){
      const owner=players[ownerId];if(owner){owner.blocks++;}
      spawnDebris(cellCenterX(c),cellCenterZ(r),0x4b8fbd,3);
      return true;
    }
    return false;
  }

  function blastFloor(pos,ownerId) {
    const minC=Math.floor((pos.x-BLAST_RADIUS+BOARD_W/2)/TILE)-1;
    const maxC=Math.floor((pos.x+BLAST_RADIUS+BOARD_W/2)/TILE)+1;
    const minR=Math.floor((pos.z-BLAST_RADIUS+BOARD_D/2)/TILE)-1;
    const maxR=Math.floor((pos.z+BLAST_RADIUS+BOARD_D/2)/TILE)+1;
    for(let r=minR;r<=maxR;r++)for(let c=minC;c<=maxC;c++){
      const t=tileAtCell(c,r);if(!t||t.hp<=0)continue;
      const d=Math.hypot(cellCenterX(c)-pos.x,cellCenterZ(r)-pos.z);
      if(d>BLAST_RADIUS)continue;
      const amount=d<.55?2:1;
      damageTile(c,r,amount,ownerId);
    }
  }

  function spawnDebris(x,z,color,count=6) {
    for(let i=0;i<count;i++){
      const m=new THREE.Mesh(new THREE.BoxGeometry(rand(.08,.19),rand(.06,.15),rand(.08,.19)),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9}));
      m.position.set(x+rand(-.3,.3),FLOOR_TOP+.05,z+rand(-.3,.3));effectRoot.add(m);
      effects.push({mesh:m,vx:rand(-2,2),vy:rand(.8,3),vz:rand(-2,2),life:rand(.35,.7),spin:rand(-8,8),kind:'debris'});
    }
  }
  function spawnExplosion(pos) {
    cameraShake=Math.max(cameraShake,.11);
    const flash=new THREE.Mesh(new THREE.SphereGeometry(.15,8,6),new THREE.MeshBasicMaterial({color:0xffc64b,transparent:true,opacity:.9}));
    flash.position.copy(pos);effectRoot.add(flash);effects.push({mesh:flash,vx:0,vy:0,vz:0,life:.22,spin:0,kind:'flash',scale:1});
    for(let i=0;i<9;i++){
      const m=new THREE.Mesh(new THREE.SphereGeometry(.04,5,4),new THREE.MeshBasicMaterial({color:0xff8f2c,transparent:true,opacity:.85}));
      m.position.copy(pos);effectRoot.add(m);const a=rand(0,Math.PI*2);
      effects.push({mesh:m,vx:Math.cos(a)*rand(1,4),vy:rand(.5,2.4),vz:Math.sin(a)*rand(1,4),life:rand(.2,.45),spin:0,kind:'particle'});
    }
  }

  function fireRocket(p,dir) {
    if(!p||!p.alive||p.shootCd>0)return false;
    p.shootCd=ROCKET_COOLDOWN;
    const d=dir.clone().normalize();
    p.facingX=d.x;p.facingZ=d.z;
    const start=new THREE.Vector3(p.x,p.y+1.23,p.z).addScaledVector(d,.38);
    const mesh=new THREE.Group();
    const body=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.34,7),gunDark);body.rotation.x=Math.PI/2;
    const nose=new THREE.Mesh(new THREE.ConeGeometry(.085,.16,7),gunGold);nose.rotation.x=-Math.PI/2;nose.position.z=-.25;
    mesh.add(body,nose);mesh.position.copy(start);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,-1),d);effectRoot.add(mesh);
    projectiles.push({mesh,pos:start.clone(),prev:start.clone(),vel:d.multiplyScalar(ROCKET_SPEED),ownerId:p.id,life:ROCKET_LIFE});
    if(p.id===0)viewWeapon.userData.recoil=1;sfx('shoot');return true;
  }

  function explodeAt(pos,ownerId,hitFloor=true) {
    if(hitFloor) blastFloor(pos,ownerId);
    for(const p of players){
      if(!p.alive)continue;
      const dx=p.x-pos.x,dz=p.z-pos.z,dy=(p.y+.3)-pos.y;
      const dist=Math.sqrt(dx*dx+dz*dz+dy*dy);if(dist>2.7)continue;
      const factor=1-dist/2.7;
      const h=Math.hypot(dx,dz)||1,nx=dx/h,nz=dz/h;
      if(p.id===ownerId){
        const nearGround=p.grounded||(elapsed-p.lastGroundedAt<ROCKET_JUMP_GROUND_WINDOW);
        if(nearGround&&!p.rocketJumpedThisAir&&p.rocketJumpCd<=0&&dist<=ROCKET_JUMP_RADIUS){
          p.grounded=false;p.rocketJumpedThisAir=true;p.rocketJumpCd=ROCKET_JUMP_COOLDOWN;
          p.vy=Math.max(p.vy,ROCKET_JUMP_VY);p.vx+=nx*(2.0+factor*2.4);p.vz+=nz*(2.0+factor*2.4);
          if(p.id===0)showToast('ROCKET JUMP!','reward');
        } else {
          p.vx+=nx*factor*.65;p.vz+=nz*factor*.65;
        }
      } else {
        const strength=factor*3.4;p.vx+=nx*strength;p.vz+=nz*strength;
        if(dist<1.6&&p.grounded){p.grounded=false;p.vy=Math.max(p.vy,1.2+strength*.18);}
        p.lastForceBy=ownerId;p.lastForceAt=elapsed;
      }
    }
    spawnExplosion(pos);sfx('boom');
  }

  function updateProjectiles(dt) {
    for(let i=projectiles.length-1;i>=0;i--){
      const q=projectiles[i];q.life-=dt;q.prev.copy(q.pos);q.pos.addScaledVector(q.vel,dt);q.mesh.position.copy(q.pos);
      let done=false;
      // Hit a live block when crossing the floor plane.
      if(q.prev.y>FLOOR_TOP&&q.pos.y<=FLOOR_TOP){
        const t=.0001+(q.prev.y-FLOOR_TOP)/(q.prev.y-q.pos.y);
        const hx=q.prev.x+(q.pos.x-q.prev.x)*t,hz=q.prev.z+(q.pos.z-q.prev.z)*t;
        const {c,r}=cellFromWorld(hx,hz),tile=tileAtCell(c,r);
        if(tile&&tile.hp>0){const p=new THREE.Vector3(hx,FLOOR_TOP+.03,hz);explodeAt(p,q.ownerId,true);done=true;}
      }
      // Outer arena wall - allows emergency wall rocket-jumps without leaving the map.
      if(!done&&(Math.abs(q.pos.x)>BOARD_W/2+.15||Math.abs(q.pos.z)>BOARD_D/2+.15)){
        q.pos.x=clamp(q.pos.x,-BOARD_W/2-.15,BOARD_W/2+.15);q.pos.z=clamp(q.pos.z,-BOARD_D/2-.15,BOARD_D/2+.15);
        explodeAt(q.pos.clone(),q.ownerId,false);done=true;
      }
      if(q.pos.y<LAVA_Y||q.life<=0)done=true;
      if(done){effectRoot.remove(q.mesh);projectiles.splice(i,1);}
    }
  }

  function culpritForFall(p) {
    if(p.lastForceBy!=null&&p.lastForceBy!==p.id&&elapsed-p.lastForceAt<2.2)return p.lastForceBy;
    const {c,r}=cellFromWorld(p.x,p.z);let best=null,bestAt=-999;
    for(let rr=r-1;rr<=r+1;rr++)for(let cc=c-1;cc<=c+1;cc++){
      const t=tileAtCell(cc,rr);if(t&&t.lastHitBy!=null&&t.lastHitBy!==p.id&&elapsed-t.lastHitAt<5&&t.lastHitAt>bestAt){best=t.lastHitBy;bestAt=t.lastHitAt;}
    }
    return best;
  }

  function eliminatePlayer(p) {
    if(!p.alive)return;
    p.alive=false;p.grounded=false;p.elimOrder=++eliminationCounter;p.group.visible=false;
    const culprit=p.lastDamageBy;
    if(culprit!=null&&culprit!==p.id&&players[culprit]){
      players[culprit].kos++;
      addFeed(`<b>${players[culprit].name}</b> dropped <b>${p.name}</b> into lava. <b>KO</b>`,'ko');
    } else addFeed(`<b>${p.name}</b> fell into the lava.`,'ko');
    sfx('ko');
    const alive=players.filter(x=>x.alive);
    if(alive.length<=1){finishMatch(alive.length===1?`${alive[0].name} is the last player standing.`:'No player survived.');return;}
    if(p.id===0)enterSpectating();
    if(spectateId===p.id)selectSpectator(1);
  }

  function handleVertical(p,dt) {
    if(p.grounded){
      if(supportAt(p.x,p.z)>=1){p.y=FLOOR_TOP;p.vy=0;p.lastGroundedAt=elapsed;p.rocketJumpedThisAir=false;p.lavaWarned=false;}
      else {p.grounded=false;p.vy=Math.min(p.vy,-.08);p.lastDamageBy=culpritForFall(p);if(p.id===0)showToast('FALLING!','danger');}
    }
    if(!p.grounded){
      const prevY=p.y;p.vy-=GRAVITY*dt;p.y+=p.vy*dt;
      if(p.vy<=0&&prevY>=FLOOR_TOP&&p.y<=FLOOR_TOP&&supportAt(p.x,p.z)>=1){p.y=FLOOR_TOP;p.vy=0;p.grounded=true;p.lastGroundedAt=elapsed;p.rocketJumpedThisAir=false;p.lastDamageBy=null;p.lastForceBy=null;return;}
      if(p.id===0&&p.y<-2.1&&!p.lavaWarned){p.lavaWarned=true;showToast('LAVA!','danger');}
      if(p.y<KILL_Y)eliminatePlayer(p);
    }
  }

  function getPlayerInput() {
    const coarse=IS_TOUCH;
    if(coarse){let x=touchMove.x,z=touchMove.z;const len=Math.hypot(x,z);if(len>1){x/=len;z/=len;}const fx=Math.sin(lookYaw),fz=-Math.cos(lookYaw),rx=Math.cos(lookYaw),rz=Math.sin(lookYaw);return{x:fx*(-z)+rx*x,z:fz*(-z)+rz*x};}
    let f=0,s=0;if(keys.has('KeyW'))f+=1;if(keys.has('KeyS'))f-=1;if(keys.has('KeyD'))s+=1;if(keys.has('KeyA'))s-=1;const len=Math.hypot(f,s);if(len>1){f/=len;s/=len;}
    const fx=Math.sin(lookYaw),fz=-Math.cos(lookYaw),rx=Math.cos(lookYaw),rz=Math.sin(lookYaw);return{x:fx*f+rx*s,z:fz*f+rz*s};
  }

  function updateBotDecision(p,dt) {
    p.aiThink-=dt;p.aiShoot-=dt;
    const opp=players.filter(q=>q.alive&&q.id!==p.id);
    if(p.aiThink<=0){
      p.aiThink=rand(.20,.42);let target=null,best=Infinity;
      for(const q of opp){const d=(q.x-p.x)**2+(q.z-p.z)**2;if(d<best){best=d;target=q;}}
      p.aiTargetId=target?target.id:null;
      let dx=rand(-1,1),dz=rand(-1,1);
      if(target){const tx=target.x-p.x,tz=target.z-p.z,l=Math.hypot(tx,tz)||1,side=Math.random()<.5?-1:1;dx=tx/l*.25+(-tz/l)*side*.95;dz=tz/l*.25+(tx/l)*side*.95;}
      if(Math.abs(p.x)>BOARD_W/2-4)dx+=-Math.sign(p.x)*1.4;if(Math.abs(p.z)>BOARD_D/2-4)dz+=-Math.sign(p.z)*1.4;
      let l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
      if(!isSafeAhead(p.x+dx*1.4,p.z+dz*1.4)){dx=-p.x;dz=-p.z;l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;if(p.grounded&&Math.random()<.25){p.grounded=false;p.vy=JUMP_VY;}}
      p.aiMoveX=dx;p.aiMoveZ=dz;
    }
    if(p.aiShoot<=0&&opp.length&&state==='playing'){
      p.aiShoot=rand(.85,1.35);
      const target=players[p.aiTargetId]&&players[p.aiTargetId].alive?players[p.aiTargetId]:opp[0];
      if(target){const aim=new THREE.Vector3(target.x+target.vx*.18+rand(-.72,.72),FLOOR_TOP,target.z+target.vz*.18+rand(-.72,.72)).sub(new THREE.Vector3(p.x,p.y+1.2,p.z)).normalize();fireRocket(p,aim);}
    }
    return{x:p.aiMoveX,z:p.aiMoveZ};
  }

  function updatePlayer(p,dt) {
    if(!p.alive)return;
    p.survival+=dt;p.shootCd=Math.max(0,p.shootCd-dt);p.rocketJumpCd=Math.max(0,p.rocketJumpCd-dt);if(p.grounded)p.lastGroundedAt=elapsed;
    let input={x:0,z:0};
    if(p.id===0){if(state==='playing')input=getPlayerInput();}
    else if(state==='playing'||state==='spectating')input=updateBotDecision(p,dt);
    if(input.x||input.z){const accel=p.grounded?GROUND_ACCEL:AIR_ACCEL;p.vx+=input.x*accel*dt;p.vz+=input.z*accel*dt;const sp=Math.hypot(p.vx,p.vz);if(sp>MAX_SPEED){p.vx=p.vx/sp*MAX_SPEED;p.vz=p.vz/sp*MAX_SPEED;}if(p.id!==0){p.facingX+=(input.x-p.facingX)*lerpFactor(8,dt);p.facingZ+=(input.z-p.facingZ)*lerpFactor(8,dt);}}
    else {const f=Math.exp(-(p.grounded?12:1.6)*dt);p.vx*=f;p.vz*=f;}
    if(p.id===0){p.facingX=Math.sin(lookYaw);p.facingZ=-Math.cos(lookYaw);}
    if(p.id===0&&state==='playing'&&jumpRequested&&p.grounded){p.grounded=false;p.vy=JUMP_VY;}
    p.x+=p.vx*dt;p.z+=p.vz*dt;
    // Invisible outer boundary like an enclosed arena; only holes should kill you.
    const limX=BOARD_W/2-PLAYER_RADIUS*.9,limZ=BOARD_D/2-PLAYER_RADIUS*.9;
    if(p.x<-limX){p.x=-limX;p.vx=Math.max(0,p.vx)}if(p.x>limX){p.x=limX;p.vx=Math.min(0,p.vx)}if(p.z<-limZ){p.z=-limZ;p.vz=Math.max(0,p.vz)}if(p.z>limZ){p.z=limZ;p.vz=Math.min(0,p.vz)}
    handleVertical(p,dt);
    if(!p.alive)return;
    p.group.position.set(p.x,p.y,p.z);const fl=Math.hypot(p.facingX,p.facingZ);if(fl>.05)p.group.rotation.y=Math.atan2(p.facingX,p.facingZ);
  }

  function resolvePlayerCollisions() {
    for(let i=0;i<players.length;i++){const a=players[i];if(!a.alive)continue;for(let j=i+1;j<players.length;j++){const b=players[j];if(!b.alive||Math.abs(a.y-b.y)>1.0)continue;const dx=b.x-a.x,dz=b.z-a.z,d2=dx*dx+dz*dz,minD=PLAYER_RADIUS*2;if(d2>.0001&&d2<minD*minD){const d=Math.sqrt(d2),o=minD-d,nx=dx/d,nz=dz/d;a.x-=nx*o*.5;a.z-=nz*o*.5;b.x+=nx*o*.5;b.z+=nz*o*.5;}}}
  }

  function updateEffects(dt) {
    for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life-=dt;if(e.life<=0){effectRoot.remove(e.mesh);effects.splice(i,1);continue;}if(e.kind==='flash'){e.scale+=dt*9;e.mesh.scale.setScalar(e.scale);e.mesh.material.opacity=Math.max(0,e.life/.22);}else{e.vy-=GRAVITY*.35*dt;e.mesh.position.x+=e.vx*dt;e.mesh.position.y+=e.vy*dt;e.mesh.position.z+=e.vz*dt;e.mesh.rotation.x+=e.spin*dt;e.mesh.rotation.z+=e.spin*.7*dt;if('opacity'in e.mesh.material)e.mesh.material.opacity=clamp(e.life*2.3,0,1);}}
  }

  function updateMatch(dt) {
    if(!(state==='playing'||state==='spectating'))return;
    elapsed+=dt;roundTime-=dt;
    for(const p of players)updatePlayer(p,dt);
    jumpRequested=false;
    resolvePlayerCollisions();updateProjectiles(dt);updateEffects(dt);
    if((fireRequested||touchFireHeld)&&state==='playing'){fireRequested=false;firePlayerRocket();}
    const alive=players.filter(p=>p.alive);
    if(alive.length<=1&&!endLocked){finishMatch(alive.length===1?`${alive[0].name} is the last player standing.`:'No player survived.');return;}
    if(roundTime<=0&&!endLocked){
      const survivors=alive.slice().sort((a,b)=>b.blocks-a.blocks||b.kos-a.kos||b.survival-a.survival);
      finishMatch(survivors.length?`Time expired. ${survivors[0].name} wins on block score.`:'Time expired.');
    }
  }

  function getRanking() {
    return players.slice().sort((a,b)=>{
      if(a.alive!==b.alive)return a.alive?-1:1;
      if(a.alive&&b.alive)return b.blocks-a.blocks||b.kos-a.kos||b.survival-a.survival;
      return (b.elimOrder||0)-(a.elimOrder||0);
    });
  }

  function enterSpectating() {
    state='spectating';const alive=players.filter(p=>p.alive);spectateId=alive[0]?.id??null;spectatorBar.classList.remove('hidden');crosshair.classList.add('hidden');touchControls.classList.remove('active');touchControls.setAttribute('aria-hidden','true');touchFireHeld=false;resetJoystick();keys.clear();if(document.pointerLockElement===canvas&&document.exitPointerLock)document.exitPointerLock();updateSpectatorUI();addFeed('<b>You are out.</b> Spectating remaining players.','');
  }
  function selectSpectator(step) {const alive=players.filter(p=>p.alive);if(!alive.length){spectateId=null;return;}let i=alive.findIndex(p=>p.id===spectateId);if(i<0)i=0;i=(i+step+alive.length)%alive.length;spectateId=alive[i].id;updateSpectatorUI();}
  function updateSpectatorUI(){const p=players[spectateId];spectateName.textContent=p&&p.alive?`${p.name} · ${p.blocks} BLOCKS`:'SEARCHING…';}

  function finishMatch(reason) {
    if(endLocked||state==='results'||state==='menu')return;endLocked=true;state='results';
    spectatorBar.classList.add('hidden');touchControls.classList.remove('active');touchControls.setAttribute('aria-hidden','true');crosshair.classList.add('hidden');leaveBtn.classList.add('hidden');if(document.pointerLockElement===canvas&&document.exitPointerLock)document.exitPointerLock();
    const ranking=getRanking(),you=players[0],winner=ranking[0],place=Math.max(1,ranking.findIndex(p=>p.id===0)+1),prize=place<=PRIZES.length?PRIZES[place-1]:0;
    if(prize>0)creditWallet(prize,`#${place} PRIZE`);
    const net = you.earnings + prize - ENTRY_FEE;
    winnerName.textContent=`WINNER: ${winner?winner.name.toUpperCase():'—'}`;
    $('resultPlace').textContent=`#${place}`;
    $('resultTitle').textContent=place===1?'VICTORY':place<=3?'PODIUM FINISH':'MATCH OVER';
    $('resultReason').textContent=reason;
    $('resultBlocks').textContent=String(you.blocks);
    $('resultAction').textContent=`+${money(you.earnings)}`;
    $('resultPrize').textContent=`+${money(prize)}`;
    $('resultWallet').textContent=money(wallet);
    if (resultNet) {
      resultNet.textContent = signedMoney(net);
      resultNet.style.color = net >= 0 ? '#8df1b4' : '#ff9aa4';
    }
    recordMatch(place,prize,you.earnings,you.blocks,you.kos,false);
    menuPanel.classList.add('hidden');resultPanel.classList.remove('hidden');overlay.classList.add('show');addFeed(`<b>Match complete.</b> ${reason}`,'');if(place===1)sfx('win');updateUI(true);updateLobbyAccount();
  }

  function startMatch() {
    if (wallet + 1e-9 < ENTRY_FEE) { updateLobbyAccount(); showToast('RESET DEMO ACCOUNT TO PLAY','danger'); return; }
    ensureAudio();wallet-=ENTRY_FEE;saveDemoAccount();updateLobbyAccount();activeMatchRecorded=false;fireRequested=false;jumpRequested=false;resetArena();roundTime=ROUND_SECONDS;countdownTime=3;elapsed=0;accumulator=0;state='countdown';endLocked=false;
    menuPanel.classList.remove('hidden');resultPanel.classList.add('hidden');overlay.classList.remove('show');countdownEl.classList.remove('hidden');countdownLabel.textContent='MATCH STARTS IN';countdownNumber.textContent='3';leaveBtn.classList.remove('hidden');spectatorBar.classList.add('hidden');
    if(IS_TOUCH){touchControls.classList.add('active');touchControls.setAttribute('aria-hidden','false');}else{crosshair.classList.remove('hidden');try{const r=canvas.requestPointerLock&&canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(_){}}
    addFeed('<b>3 second countdown.</b> Bots cannot fire until GO.','');sfx('count');updateUI(true);
  }

  function returnToLobby() {
    if(document.pointerLockElement===canvas&&document.exitPointerLock)document.exitPointerLock();state='menu';keys.clear();touchMove.x=0;touchMove.z=0;resetJoystick();spectatorBar.classList.add('hidden');touchControls.classList.remove('active');touchControls.setAttribute('aria-hidden','true');countdownEl.classList.add('hidden');crosshair.classList.add('hidden');leaveBtn.classList.add('hidden');resultPanel.classList.add('hidden');menuPanel.classList.remove('hidden');overlay.classList.add('show');matchStateBadge.textContent='LOBBY';updateLobbyAccount();
  }
  function recordActiveForfeit(){if(activeMatchRecorded)return;const you=players[0];recordMatch(null,0,you?.earnings||0,you?.blocks||0,you?.kos||0,true);}
  function forfeitMatch(){if(state==='playing'||state==='spectating'||state==='countdown'){recordActiveForfeit();returnToLobby();}}
  function abandonAndStartNew(){if(state==='playing'||state==='spectating'||state==='countdown')recordActiveForfeit();startMatch();}

  function updateCountdown(dt) {
    if(state!=='countdown')return;const before=Math.ceil(countdownTime);countdownTime-=dt;const after=Math.max(0,Math.ceil(countdownTime));if(after!==before&&after>0)sfx('count');
    if(countdownTime<=0){state='playing';countdownEl.classList.add('hidden');addFeed('<b>GO!</b> Break the floor under opponents.','reward');showToast('GO!','reward');sfx('go');}
    else{countdownNumber.textContent=String(after||1);countdownLabel.textContent='MATCH STARTS IN';}
  }

  function firePlayerRocket() {
    const p=players[0];if(!p||!p.alive||state!=='playing')return;
    const cp=Math.cos(lookPitch);const dir=new THREE.Vector3(Math.sin(lookYaw)*cp,Math.sin(lookPitch),-Math.cos(lookYaw)*cp);fireRocket(p,dir);
  }

  function cameraSubject(){if(state==='spectating'){const p=players[spectateId];if(p&&p.alive)return p;}const you=players[0];if(you&&you.alive)return you;return players.find(p=>p.alive)||you||null;}
  function updateCamera(dt) {
    const p=cameraSubject();
    if(state==='menu'){viewWeapon.visible=false;const t=performance.now()*.00007,tmpPos=new THREE.Vector3(Math.sin(t)*28,20,Math.cos(t)*28);camera.position.lerp(tmpPos,lerpFactor(1.4,dt));camera.lookAt(0,0,0);return;}
    if(!p)return;const first=!IS_TOUCH&&p.id===0&&p.alive&&(state==='playing'||state==='countdown');viewWeapon.visible=first;const you=players[0];if(you&&you.alive)you.group.visible=!first;
    if(first){camera.position.set(p.x,p.y+1.46,p.z);const cp=Math.cos(lookPitch);tmp2.set(camera.position.x+Math.sin(lookYaw)*cp*20,camera.position.y+Math.sin(lookPitch)*20,camera.position.z-Math.cos(lookYaw)*cp*20);if(cameraShake>.001){camera.position.x+=rand(-cameraShake,cameraShake);camera.position.y+=rand(-cameraShake*.35,cameraShake*.35);camera.position.z+=rand(-cameraShake,cameraShake);cameraShake*=Math.exp(-15*dt);}camera.lookAt(tmp2);const speed=Math.hypot(p.vx,p.vz),bob=p.grounded?Math.sin(elapsed*10.5)*Math.min(.015,speed*.0024):0,recoil=viewWeapon.userData.recoil||0;viewWeapon.userData.recoil=Math.max(0,recoil-dt*8);const kick=recoil*recoil,base=viewWeapon.userData.base;viewWeapon.position.set(base.x+bob*.4,base.y+Math.abs(bob)-kick*.03,base.z+kick*.15);viewWeapon.rotation.x=-.04+kick*.12;return;}
    const fx=p.facingX,fz=p.facingZ,l=Math.hypot(fx,fz)||1,nx=fx/l,nz=fz/l;tmp.set(p.x-nx*6.0,p.y+4.8,p.z-nz*6.0);camera.position.lerp(tmp,lerpFactor(7,dt));tmp2.set(p.x,p.y+.6,p.z);camera.lookAt(tmp2);
  }

  function updateWallet(dt){const d=wallet-walletShown;if(Math.abs(d)<.001)walletShown=wallet;else walletShown+=d*lerpFactor(9,dt);walletValue.textContent=money(walletShown);}
  function updateUI(force=false) {
    if(!players.length)return;const you=players[0];timeValue.textContent=formatTime(roundTime);aliveValue.textContent=String(players.filter(p=>p.alive).length);blocksValue.textContent=String(you.blocks);koValue.textContent=String(you.kos);matchStateBadge.textContent=state==='countdown'?'STARTING':state==='playing'?'LIVE':state==='spectating'?'SPECTATING':state==='results'?'FINISHED':'LOBBY';
    const ranking=getRanking();standingsEl.innerHTML=ranking.map((p,i)=>`<div class="standing ${p.id===0?'me':''} ${p.alive?'':'dead'}"><div class="rank">#${i+1}</div><div class="pname"><i style="background:#${p.color.toString(16).padStart(6,'0')}"></i>${p.name}</div><div class="pmeta"><b>${p.alive?'IN':'OUT'}</b> · ${p.blocks}</div></div>`).join('');if(state==='spectating')updateSpectatorUI();if(force&&feed.length)eventFeed.innerHTML=feed.map(e=>`<div class="feed-item ${e.type}">${e.html}</div>`).join('');
  }

  function resizeRenderer(){const w=Math.max(1,shell.clientWidth),h=Math.max(1,shell.clientHeight),pw=Math.floor(w*Math.min(devicePixelRatio||1,1.7)),ph=Math.floor(h*Math.min(devicePixelRatio||1,1.7));if(canvas.width!==pw||canvas.height!==ph){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}}
  function resetJoystick(){joystickPointer=null;touchMove.x=0;touchMove.z=0;joystickKnob.style.transform='translate(-50%,-50%)';}
  function updateJoystick(ev){const r=joystick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,max=r.width*.34;let dx=ev.clientX-cx,dy=ev.clientY-cy,l=Math.hypot(dx,dy);if(l>max){dx=dx/l*max;dy=dy/l*max;}joystickKnob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;touchMove.x=dx/max;touchMove.z=dy/max;}

  function loop(now){const frameDt=clamp((now-lastFrame)/1000,0,.05);lastFrame=now;resizeRenderer();updateCountdown(frameDt);accumulator+=frameDt;while(accumulator>=FIXED_DT){updateMatch(FIXED_DT);accumulator-=FIXED_DT;}if(!(state==='playing'||state==='spectating'))updateEffects(frameDt);lavaUniforms.uTime.value=now*.001;lavaLight.intensity=2.6+Math.sin(now*.0028)*.25;updateCamera(frameDt);updateWallet(frameDt);if(toastTimer>0){toastTimer-=frameDt;if(toastTimer<=0)toastEl.className='toast';}uiTimer-=frameDt;if(uiTimer<=0){uiTimer=.1;updateUI();}renderer.render(scene,camera);requestAnimationFrame(loop);}

  startBtn.addEventListener('click',startMatch);playAgainBtn.addEventListener('click',()=>{if(playAgainBtn.disabled)return;startMatch();});exitBtn.addEventListener('click',returnToLobby);leaveBtn.addEventListener('click',forfeitMatch);newMatchSpectate.addEventListener('click',abandonAndStartNew);exitSpectate.addEventListener('click',()=>{recordActiveForfeit();returnToLobby();});spectatePrev.addEventListener('click',()=>selectSpectator(-1));spectateNext.addEventListener('click',()=>selectSpectator(1));
  resetDemoBtn.addEventListener('click',()=>{wallet=DEMO_START_BALANCE;walletShown=wallet;saveDemoAccount();updateLobbyAccount();showToast('BETA CREDITS RESET','reward');});
  soundBtn.addEventListener('click',()=>{soundEnabled=!soundEnabled;soundBtn.textContent=soundEnabled?'SOUND ON':'SOUND OFF';if(soundEnabled){ensureAudio();tone(590,.08,'sine',.018,760);}});

  window.addEventListener('keydown',ev=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(ev.code)&&state==='playing')ev.preventDefault();if(ev.code==='Escape'){if(document.pointerLockElement===canvas){document.exitPointerLock();return;}if(state==='spectating'||state==='results')returnToLobby();else if(state==='playing'||state==='countdown')forfeitMatch();return;}keys.add(ev.code);if(ev.code==='Space'&&!ev.repeat&&state==='playing')jumpRequested=true;});
  window.addEventListener('keyup',ev=>keys.delete(ev.code));window.addEventListener('blur',()=>keys.clear());
  document.addEventListener('pointerlockchange',()=>{pointerLocked=document.pointerLockElement===canvas;if(!IS_TOUCH&&(state==='playing'||state==='countdown'))crosshair.classList.remove('hidden');});
  document.addEventListener('mousemove',ev=>{if(!pointerLocked||!(state==='playing'||state==='countdown'))return;lookYaw+=ev.movementX*.00225;lookPitch=clamp(lookPitch-ev.movementY*.00205,-1.45,1.30);});
  canvas.addEventListener('pointerdown',ev=>{if(state!=='playing')return;ensureAudio();if(IS_TOUCH){if(ev.clientX>innerWidth*.34){touchLookPointer=ev.pointerId;touchLookLast={x:ev.clientX,y:ev.clientY};canvas.setPointerCapture(ev.pointerId);}return;}if(document.pointerLockElement!==canvas){canvas.requestPointerLock?.();return;}fireRequested=true;});
  canvas.addEventListener('pointermove',ev=>{if(ev.pointerId!==touchLookPointer||!touchLookLast)return;const dx=ev.clientX-touchLookLast.x,dy=ev.clientY-touchLookLast.y;lookYaw+=dx*.008;lookPitch=clamp(lookPitch-dy*.007,-1.35,1.15);touchLookLast={x:ev.clientX,y:ev.clientY};});
  canvas.addEventListener('pointerup',ev=>{if(ev.pointerId===touchLookPointer){touchLookPointer=null;touchLookLast=null;}});canvas.addEventListener('pointercancel',()=>{touchLookPointer=null;touchLookLast=null;});canvas.addEventListener('contextmenu',ev=>ev.preventDefault());
  joystick.addEventListener('pointerdown',ev=>{if(state!=='playing')return;ev.preventDefault();ev.stopPropagation();joystickPointer=ev.pointerId;joystick.setPointerCapture(ev.pointerId);updateJoystick(ev);});joystick.addEventListener('pointermove',ev=>{if(ev.pointerId===joystickPointer){ev.preventDefault();updateJoystick(ev);}});joystick.addEventListener('pointerup',ev=>{if(ev.pointerId===joystickPointer)resetJoystick();});joystick.addEventListener('pointercancel',resetJoystick);
  jumpTouch.addEventListener('pointerdown',ev=>{ev.preventDefault();ev.stopPropagation();if(state==='playing')jumpRequested=true;});fireTouch.addEventListener('pointerdown',ev=>{ev.preventDefault();ev.stopPropagation();if(state==='playing'){touchFireHeld=true;fireRequested=true;fireTouch.setPointerCapture?.(ev.pointerId);}});for(const evt of ['pointerup','pointercancel','lostpointercapture'])fireTouch.addEventListener(evt,()=>{touchFireHeld=false;});

  const ro=new ResizeObserver(resizeRenderer);ro.observe(shell);window.visualViewport?.addEventListener('resize',resizeRenderer,{passive:true});window.addEventListener('orientationchange',()=>setTimeout(resizeRenderer,120),{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();touchFireHeld=false;resetJoystick();}});
  if(new URLSearchParams(location.search).has('qa'))window.__FB_QA={state:()=>state,alive:()=>players.filter(p=>p.alive).length,kill:id=>{const p=players[id];if(p)eliminatePlayer(p);},support:(x,z)=>supportAt(x,z),blocks:()=>players[0]?.blocks??0,wallet:()=>wallet};

  updateEconomyLabels();updateLobbyAccount();resetArena();updateUI(true);requestAnimationFrame(loop);
})();
