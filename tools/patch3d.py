import os
J = os.path.join(os.path.dirname(__file__), '..', 'js')
p = os.path.join(J, 'play.js'); s = open(p, encoding='utf-8').read()

old = """  P.angle = Math.atan2(m.y - P.y, m.x - P.x);
  let ax = 0, ay = 0;
  if (Input.down('KeyW') || Input.down('ArrowUp')) ay -= 1;
  if (Input.down('KeyS') || Input.down('ArrowDown')) ay += 1;
  if (Input.down('KeyA') || Input.down('ArrowLeft')) ax -= 1;
  if (Input.down('KeyD') || Input.down('ArrowRight')) ax += 1;
  const mv = Math.hypot(ax, ay);
  if (mv) { ax /= mv; ay /= mv; }"""
new = """  let ax = 0, ay = 0;
  if (G.cam3d !== 'top' && R3D.ok) {
    // camera-relative controls for third / first person
    if (Input.down('ArrowLeft')) G.yaw -= dt * 2.6;
    if (Input.down('ArrowRight')) G.yaw += dt * 2.6;
    let f = 0, st = 0;
    if (Input.down('KeyW') || Input.down('ArrowUp')) f += 1;
    if (Input.down('KeyS') || Input.down('ArrowDown')) f -= 1;
    if (Input.down('KeyA')) st -= 1;
    if (Input.down('KeyD')) st += 1;
    const c = Math.cos(G.yaw), sn = Math.sin(G.yaw);
    ax = c * f - sn * st; ay = sn * f + c * st;
    P.angle = aimAssist(G.yaw, G.cam3d === 'fp' ? 0.2 : 0.32);
    Input.mouse.wx = P.x + Math.cos(P.angle) * 260; Input.mouse.wy = P.y + Math.sin(P.angle) * 260;
  } else {
    P.angle = Math.atan2(m.y - P.y, m.x - P.x);
    if (Input.down('KeyW') || Input.down('ArrowUp')) ay -= 1;
    if (Input.down('KeyS') || Input.down('ArrowDown')) ay += 1;
    if (Input.down('KeyA') || Input.down('ArrowLeft')) ax -= 1;
    if (Input.down('KeyD') || Input.down('ArrowRight')) ax += 1;
  }
  const mv = Math.hypot(ax, ay);
  if (mv) { ax /= mv; ay /= mv; }"""
assert old in s; s = s.replace(old, new)

s = s.replace("""function relicTick(dt) {""", open(os.path.join(os.path.dirname(__file__), 'snip_view.js'), encoding='utf-8').read() + """
function relicTick(dt) {""", 1)

s = s.replace("""G.render = function () {
  const P = this.player;""", """G.render = function () {
  if (this.cam3d !== 'top' && R3D.ok && this.player) { R3D.render(); drawOverlay3D(); return; }
  const P = this.player;""")

s = s.replace("""// ---------- main loop ----------""", open(os.path.join(os.path.dirname(__file__), 'snip_overlay.js'), encoding='utf-8').read() + """
// ---------- main loop ----------""", 1)

s = s.replace("""  lightC.width = Math.ceil(canvas.width / 3); lightC.height = Math.ceil(canvas.height / 3);
}""", """  lightC.width = Math.ceil(canvas.width / 3); lightC.height = Math.ceil(canvas.height / 3);
  if (typeof R3D !== 'undefined') R3D.resize();
}""")

old = """window.addEventListener('mousemove', e => { if (!Touch.on) { Input.mouse.x = e.clientX; Input.mouse.y = e.clientY; } });"""
assert old in s
s = s.replace(old, """window.addEventListener('mousemove', e => {
  if (Touch.on) return;
  Input.mouse.x = e.clientX; Input.mouse.y = e.clientY;
  if (G.cam3d !== 'top' && G.state === 'playing') G.yaw += (e.movementX || 0) * (document.pointerLockElement === canvas ? 0.0026 : 0.004);
});""")
s = s.replace("""canvas.addEventListener('mousedown', e => {
  Sound.unlock();""", """canvas.addEventListener('mousedown', e => {
  Sound.unlock();
  if (G.cam3d !== 'top' && !Touch.on && document.pointerLockElement !== canvas && canvas.requestPointerLock) { try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (er) {} }""")
open(p, 'w', encoding='utf-8').write(s)

p = os.path.join(J, 'ui.js'); s = open(p, encoding='utf-8').read()
s = s.replace("""    $('btnFs').onclick = () => Touch.fullscreen();""", """    $('btnFs').onclick = () => Touch.fullscreen();
    $('btnView').onclick = () => G.cycleView();""")
s = s.replace("""    const panels = { KeyC: 'craft', Tab: 'inv', KeyI: 'inv', KeyM: 'map' };""", """    if (code === 'KeyV' && G.state === 'playing') { G.cycleView(); return; }
    const panels = { KeyC: 'craft', Tab: 'inv', KeyI: 'inv', KeyM: 'map' };""")
s = s.replace("""  pause() { if (G.state !== 'playing') return; G.state = 'paused'; this.showScreen('pause'); },""", """  pause() { if (G.state !== 'playing') return; G.state = 'paused'; this.showScreen('pause'); if (document.pointerLockElement) document.exitPointerLock(); },""")
open(p, 'w', encoding='utf-8').write(s)

p = os.path.join(J, '..', 'css', 'v2.css'); s = open(p, encoding='utf-8').read()
if 'game3d' not in s:
    s += """
/* 3D views */
#game3d { position: fixed; inset: 0; width: 100%; height: 100%; display: none; image-rendering: pixelated; }
body.v3d #game3d { display: block; }
body.v3d #vignette { background: radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.45) 100%); }
"""
    open(p, 'w', encoding='utf-8').write(s)
print('patched')
