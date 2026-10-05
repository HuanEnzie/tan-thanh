"""Remove the 3D renderer and view modes: the game becomes pure 2D pixel."""
import re, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
def rd(p): return open(os.path.join(ROOT, p), encoding='utf-8').read()
def wr(p, s): open(os.path.join(ROOT, p), 'w', encoding='utf-8', newline='\n').write(s)
def sub(s, a, b, count=1):
    if a not in s: raise SystemExit('MISSING: ' + a[:80])
    return s.replace(a, b, count)

# ---------- play.js ----------
s = rd('js/play.js')
s = sub(s, "  if (typeof R3D !== 'undefined') R3D.resize();\n", '')
s = sub(s, "  if (G.gfx === '3d' && G.cam3d === 'top' && R3D.ok && R3D.camera) { const gp = R3D.groundPoint(Input.mouse.x, Input.mouse.y); if (gp) m = gp; }\n", '')
i = s.index("  if (G.cam3d !== 'top' && R3D.ok) {")
j = s.index("  } else {\n    P.angle = Math.atan2(m.y - P.y, m.x - P.x);")
s = s[:i] + "  {\n" + s[j + len("  } else {\n"):]
# aimAssist + view/gfx toggles
i = s.index('function aimAssist(yaw, cone) {'); j = s.index('function relicTick(dt) {')
s = s[:i] + s[j:]
s = sub(s, "  if ((this.cam3d !== 'top' || this.gfx === '3d') && R3D.ok && this.player) { R3D.render(); drawOverlay3D(); return; }\n", '')
i = s.index('function drawOverlay3D() {'); j = s.index('let last = performance.now();')
s = s[:i] + s[j:]
s = sub(s, "  if (G.cam3d !== 'top' && G.state === 'playing') G.yaw += (e.movementX || 0) * (document.pointerLockElement === canvas ? 0.0026 : 0.004);\n", '')
s = sub(s, "  if (G.cam3d !== 'top' && !Touch.on && document.pointerLockElement !== canvas && canvas.requestPointerLock) { try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (er) {} }\n", '')
assert 'R3D' not in s and 'cam3d' not in s, [l for l in s.split('\n') if 'R3D' in l or 'cam3d' in l]
wr('js/play.js', s)

# ---------- touch.js ----------
s = rd('js/touch.js')
s = sub(s, "else if (a === 'view') G.cycleView(); else if (a === 'gfx') G.toggleGfx(); ", '')
s = sub(s, "    if (G.gfx === '3d' && G.cam3d === 'top' && R3D.ok && R3D.camera) { const t = P.car || P; const sc = R3D.project(t.x, 20, t.y); if (sc) return { x: sc[0], y: sc[1] }; }\n", '')
i = s.index("    if (G.cam3d !== 'top') {"); j = s.index("    let aimed = false;")
s = s[:i] + s[j:]
assert 'R3D' not in s and 'cam3d' not in s
wr('js/touch.js', s)

# ---------- ui.js ----------
s = rd('js/ui.js')
s = sub(s, "    $('btnView').onclick = () => G.cycleView();\n    $('btnGfx').onclick = () => G.toggleGfx();\n    $('btnGfxT').onclick = () => G.toggleGfx();\n", '')
s = sub(s, " if (document.pointerLockElement) document.exitPointerLock();", '')
s = sub(s, "    if (code === 'KeyV' && G.state === 'playing') { G.cycleView(); return; }\n    if (code === 'KeyK' && G.state === 'playing') { G.toggleGfx(); return; }\n", '')
wr('js/ui.js', s)

# ---------- world.js ----------
s = rd('js/world.js')
s = sub(s, "    if (typeof R3D !== 'undefined') R3D.reset();\n", '')
s = sub(s, "    if (!this._gen && typeof R3D !== 'undefined') R3D.markDirty(x, y);\n", '')
wr('js/world.js', s)

# ---------- index.html ----------
s = rd('index.html')
s = re.sub(r'<script src="https://cdnjs\.cloudflare\.com/ajax/libs/three\.js[^"]*"></script>\s*', '', s)
for f in ['r3d', 'models3d', 'r3d_models']:
    s = re.sub(r'<script src="js/%s\.js[^"]*"></script>\s*' % f, '', s)
s = sub(s, '<button data-a="gfx" id="tGfx">3D</button><button data-a="view" id="tView">👁</button>', '')
s = re.sub(r'<button[^>]*id="btnGfxT"[^>]*>.*?</button>\s*', '', s)
s = re.sub(r'<button[^>]*id="btnGfx"[^>]*>.*?</button>\s*', '', s)
s = re.sub(r'<button[^>]*id="btnView"[^>]*>.*?</button>\s*', '', s)
s = re.sub(r'<canvas id="game3d"[^>]*></canvas>\s*', '', s)
wr('index.html', s)
print('ok')
