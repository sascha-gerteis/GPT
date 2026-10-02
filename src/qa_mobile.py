from pathlib import Path
import re, subprocess, sys
ROOT=Path(__file__).resolve().parent
issues=[]
def fail(scope,msg): issues.append(f'{scope}: {msg}')

# Every JS file that ships in the game layer must parse.
js_files=list((ROOT/'games').glob('*/game.js'))+[
 ROOT/'games'/'mobile-controls.js',ROOT/'games'/'character-kit.js',ROOT/'games'/'match-bridge.js',ROOT/'games'/'you-marker.js',ROOT/'platform.js',ROOT/'launch-config.js']
for js in sorted(js_files):
    r=subprocess.run(['node','--check',str(js)],capture_output=True,text=True)
    if r.returncode: fail(js.relative_to(ROOT),r.stderr.strip() or 'syntax error')

# Mobile integration invariants for all 11 games.
games=[]
for d in sorted((ROOT/'games').iterdir()):
    if not d.is_dir() or not (d/'game.js').exists(): continue
    games.append(d.name)
    html=(d/'index.html').read_text(errors='ignore')
    js=(d/'game.js').read_text(errors='ignore')
    if 'viewport-fit=cover' not in html: fail(d.name,'missing safe-area viewport-fit=cover')
    if '../arcade-polish.css' not in html: fail(d.name,'missing shared mobile/presentation stylesheet')
    if d.name=='floor-breaker':
        if 'floor-breaker-game' not in html: fail(d.name,'missing Floor Breaker mobile body marker')
        if 'id="touchControls"' not in html: fail(d.name,'missing bespoke touch controls')
        if 'IS_TOUCH' not in js: fail(d.name,'missing robust touch-device detection')
        if 'touchFireHeld' not in js: fail(d.name,'missing hold-to-fire mobile input')
    else:
        for needle in ['../character-kit.js','../mobile-controls.js']:
            if needle not in html: fail(d.name,f'missing {needle}')
        if 'MOBILE_RENDER?' in js and 'const MOBILE_RENDER=' not in js:
            fail(d.name,'mobile render flag referenced but not declared')
        if "querySelector('.game-shell')" not in js:
            fail(d.name,'renderer resize does not use actual game shell')

mc=(ROOT/'games'/'mobile-controls.js').read_text()
for needle in ['is-active','MutationObserver','setPointerCapture','visualViewport','orientationchange','visibilitychange']:
    if needle not in mc: fail('mobile-controls',f'missing {needle}')
css=(ROOT/'games'/'arcade-polish.css').read_text()
for needle in ['body.floor-breaker-game #touchControls.active','touch-action:pan-y','.sa-mobile-controls.is-active','@media(max-width:600px)']:
    if needle not in css: fail('arcade-polish',f'missing {needle}')

# Demo should not look cash-funded before crypto/payment work exists.
for p in sorted((ROOT/'games').glob('*/index.html')):
    txt=p.read_text(errors='ignore')
    if re.search(r'\$\d',txt): fail(p.parent.name,'cash-style dollar amount remains in game HTML')


# V6.5 regression fixes: mobile/fairness/scaling.
wall=(ROOT/'games'/'wall-dodge'/'game.js').read_text()
for needle in ['ARENA_HALF=10.4','x:-8.25+i*1.5,z:6.2','gapW=Math.max(1.65','w.g.position.z>=6.2']:
    if needle not in wall: fail('wall-dodge',f'missing 12-player wall fix: {needle}')
obs=(ROOT/'games'/'obstacle-sprint'/'game.js').read_text()
if 'finishOrder.length>=3)endMatch' in obs: fail('obstacle-sprint','still ends user run when bots fill podium')
maze=(ROOT/'games'/'maze-rush'/'game.js').read_text()
red=(ROOT/'games'/'red-light-run'/'game.js').read_text()
if 'finishers.length>=3&&!players[0].finished' in maze: fail('maze-rush','still ends user run when bots fill podium')
if 'finishers.length>=3&&!players[0].finished' in red: fail('red-light-run','still ends user run when bots fill podium')
fb=(ROOT/'games'/'floor-breaker'/'game.js').read_text()
if "touchFireHeld=false;resetJoystick();keys.clear()" not in fb: fail('floor-breaker','spectating does not clear held mobile input')
platform=(ROOT/'platform.js').read_text()
if '`$${' in platform or re.search(r'<span>\$\$\{v\}',platform): fail('platform','cash-style dollar formatting remains')
for needle in ['PLAY SKILL MATCH','MATCH TIER','Beta credits']:
    if needle not in platform: fail('platform',f'missing arcade copy: {needle}')
if (ROOT/'platform-v65.css').exists() is False: fail('platform','missing V6.5 shell stylesheet')
if (ROOT/'shell-v65.js').exists() is False: fail('platform','missing V6.5 shell copy layer')

print(f'Mobile QA games checked: {len(games)}')
if issues:
    print('FAILED')
    for i in issues: print(' -',i)
    sys.exit(1)
print('PASS: mobile integration/static regression checks passed.')
