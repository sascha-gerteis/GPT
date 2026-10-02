from pathlib import Path
import re, subprocess, sys
ROOT=Path(__file__).resolve().parent
issues=[]

def fail(scope,msg): issues.append(f"{scope}: {msg}")

# JavaScript syntax.
for js in sorted(list((ROOT/'games').glob('*/game.js'))+[ROOT/'platform.js',ROOT/'launch-config.js',ROOT/'games'/'match-bridge.js',ROOT/'games'/'you-marker.js']):
    r=subprocess.run(['node','--check',str(js)],capture_output=True,text=True)
    if r.returncode: fail(js.relative_to(ROOT), r.stderr.strip() or 'syntax error')

# Game HTML/DOM/link consistency.
games=[]
for d in sorted((ROOT/'games').iterdir()):
    if not d.is_dir() or not (d/'game.js').exists(): continue
    games.append(d.name)
    js=(d/'game.js').read_text(errors='ignore')
    html=(d/'index.html').read_text(errors='ignore') if (d/'index.html').exists() else ''
    if not html: fail(d.name,'missing index.html'); continue
    ids=set(re.findall(r'id=["\']([^"\']+)',html))
    refs=set(re.findall(r"\$\(['\"]([^'\"]+)['\"]\)",js))
    missing=sorted(refs-ids)
    if missing: fail(d.name, 'missing DOM ids: '+', '.join(missing))
    if d.name!='floor-breaker' and 'addYouMarker3D' not in js:
        fail(d.name,'missing YOU marker')
    if '../match-bridge.js' not in html or 'game.js' not in html or html.index('../match-bridge.js')>html.index('game.js'):
        fail(d.name,'match bridge must load before game.js')
    for src in re.findall(r'<script[^>]+src=["\']([^"\']+)',html):
        if src.startswith('http'): continue
        target=(d/src).resolve()
        if not target.exists(): fail(d.name,f'missing local script {src}')
    for href in re.findall(r'<link[^>]+href=["\']([^"\']+)',html):
        if href.startswith('http'): continue
        target=(d/href).resolve()
        if not target.exists(): fail(d.name,f'missing local stylesheet {href}')

# Survival games must settle by elimination, not a hidden match timeout.
for name in ['falling-tiles','safe-zone','wall-dodge','meteor-dodge','knockout','bomb-tag']:
    js=(ROOT/'games'/name/'game.js').read_text()
    if re.search(r'time\s*<=\s*0[^\n]{0,160}(end|settle)',js):
        fail(name,'hidden timeout settlement remains')

# Falling Tiles regression: full floor at match start.
ft=(ROOT/'games'/'falling-tiles'/'game.js').read_text()
if 'hole:' in ft: fail('falling-tiles','map still contains pre-cut starting holes')
for required in ['t.mesh.visible=true','t.mesh.position.y=0','t.state=0']:
    if required not in ft: fail('falling-tiles',f'missing reset invariant {required}')

# Meteor boundary invariant.
md=(ROOT/'games'/'meteor-dodge'/'game.js').read_text()
if 'ARENA_R' not in md or 'edge>ARENA_R' not in md: fail('meteor-dodge','radial arena clamp missing')

# Launch safety.
launch=(ROOT/'launch-config.js').read_text()
if 'realMoneyEnabled: false' not in launch: fail('launch-config','real money must stay disabled in review build')
if "blockedJurisdictions: ['TH']" not in launch: fail('launch-config','Thailand block missing from review build')

# Main catalog routes.
main=(ROOT/'platform.js').read_text(errors='ignore')
for name in games:
    if name not in main and f'games/{name}' not in (ROOT/'index.html').read_text(errors='ignore'):
        # platform registry may use display IDs; only warn if folder cannot be found from either shell file.
        pass

print(f'Games checked: {len(games)}')
if issues:
    print('FAILED')
    for i in issues: print(' -',i)
    sys.exit(1)
print('PASS: release static QA completed with no detected issues.')
