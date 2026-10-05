import os
ROOT = os.path.join(os.path.dirname(__file__), '..')
def rd(p): return open(os.path.join(ROOT, p), encoding='utf-8').read()
def wr(p, s): open(os.path.join(ROOT, p), 'w', encoding='utf-8').write(s)
def rep(s, old, new, cnt=1):
    assert old in s, old[:80]
    return s.replace(old, new, cnt)

# ---------------- r3d.js ----------------
s = rd('js/r3d.js')
# walls: per-tile heights + glowing windows in model mode
s = rep(s, """    if (walls.length) {
      const im = new THREE.InstancedMesh(this.unitBox, this.wallMat(), walls.length);
      walls.forEach(([gx, gy, win], i) => {
        this.dummy.position.set(gx * TILE + 16, (win ? WALL_H * 0.5 : WALL_H) / 2, gy * TILE + 16);
        this.dummy.rotation.set(0, 0, 0); this.dummy.scale.set(TILE, win ? WALL_H * 0.5 : WALL_H, TILE); this.dummy.updateMatrix();
        im.setMatrixAt(i, this.dummy.matrix);
      });
      group.add(im);
    }""", """    const models = this.modelsActive();
    if (walls.length) {
      const im = new THREE.InstancedMesh(this.unitBox, this.wallMat(), walls.length);
      const wins = [];
      walls.forEach(([gx, gy, win], i) => {
        const H = models ? this.wallHeight(sb, gx, gy) : WALL_H;
        const hh = win && !models ? H * 0.5 : H;
        this.dummy.position.set(gx * TILE + 16, hh / 2, gy * TILE + 16);
        this.dummy.rotation.set(0, 0, 0); this.dummy.scale.set(TILE, hh, TILE); this.dummy.updateMatrix();
        im.setMatrixAt(i, this.dummy.matrix);
        if (win && models) wins.push([gx, gy, H]);
      });
      group.add(im);
      if (wins.length) {
        if (!this.winMat) { this.winMat = new THREE.MeshBasicMaterial({ color: 0x2a3a4a }); this.winMat2 = new THREE.MeshBasicMaterial({ color: 0x2a3a4a }); }
        const lit = wins.filter(w => hash2(w[0], w[1]) < 0.55), dim = wins.filter(w => hash2(w[0], w[1]) >= 0.55);
        for (const [list, mat] of [[lit, this.winMat], [dim, this.winMat2]]) {
          if (!list.length) continue;
          const wm = new THREE.InstancedMesh(this.unitBox, mat, list.length * 2);
          let k = 0;
          for (const [gx, gy, H] of list) for (let f = 0; f < 2 && f * 32 + 18 < H; f++) {
            const horiz = World.get(gx - 1, gy) === T.WALL || World.get(gx + 1, gy) === T.WALL || World.get(gx - 1, gy) === T.WINDOW || World.get(gx + 1, gy) === T.WINDOW;
            this.dummy.position.set(gx * TILE + 16, 20 + f * 32, gy * TILE + 16); this.dummy.rotation.set(0, 0, 0);
            this.dummy.scale.set(horiz ? 20 : 34, 14, horiz ? 34 : 20); this.dummy.updateMatrix(); wm.setMatrixAt(k++, this.dummy.matrix);
          }
          wm.count = k; group.add(wm);
        }
      }
    }""")
s = rep(s, """    for (const b of sb.buildings) {
      const w = (b.x1 - b.x0 + 1) * TILE, h = (b.y1 - b.y0 + 1) * TILE;
      const t = this.texOf(b.roof, true);""", """    for (const b of sb.buildings) {
      const w = (b.x1 - b.x0 + 1) * TILE, h = (b.y1 - b.y0 + 1) * TILE;
      if (models) { const m = this.roofModel(b, this.wallHeight(sb, b.x0, b.y0)); b.mesh3d = m; group.add(m); continue; }
      const t = this.texOf(b.roof, true);""")
# props: try model builders first
s = rep(s, """    for (const [k, list] of groups) {
      const [type, img] = k.split(':');
      if (type === 'tree') {""", """    for (const [k, list] of groups) {
      const [type, img] = k.split(':');
      if (this.modelsActive() && type !== 'flat' && this.buildPropModels(rec, list, img, type)) continue;
      if (type === 'tree') {""")
s = rep(s, """  addSingle(rec, p, type) {
    let m;
    if (type === 'up') {""", """  addSingle(rec, p, type) {
    let m;
    if (type === 'up' && this.modelsActive()) {
      const col = p.lightCol === 'red' ? 0xff3040 : 0x3a8aff;
      m = new THREE.Group();
      GB.start(); GB.torus(p.w * 0.36, 5, 0x2a2a34, 0, 0, 0); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; GB.box(6, 10, 6, 0x3a3a46, Math.cos(a) * p.w * 0.36, Math.sin(a) * p.w * 0.36, 0, 0, 0, a); }
      const ring = new THREE.Mesh(GB.done(), this.vcMat); m.add(ring);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(p.w * 0.34, 24), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.75, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.add(disc); m.userData.disc = disc;
      m.position.set(p.x, p.w * 0.4, p.y); m.userData.bill = true; m.userData.portal = true;
    } else if (type === 'up') {""")
s = rep(s, """      for (const [p, m] of rec.dynamic) { m.rotation.set(0, -this.yaw - Math.PI / 2, 0); if (p.kind === 'gate' || p.kind === 'exit') m.material.emissive && m.material.emissive.setRGB(0.3, 0.3, 0.4); }""", """      for (const [p, m] of rec.dynamic) {
        if (m.userData.portal) { m.rotation.set(0, -this.yaw - Math.PI / 2, 0); m.userData.disc.rotation.z = G.time * 2; m.userData.disc.material.opacity = 0.55 + Math.sin(G.time * 3) * 0.2; continue; }
        m.rotation.set(0, -this.yaw - Math.PI / 2, 0); if (p.kind === 'gate' || p.kind === 'exit') m.material.emissive && m.material.emissive.setRGB(0.3, 0.3, 0.4);
      }""")
# render: models branch for entities, camera top mode, sky
s = rep(s, """    const fp = G.cam3d === 'fp';
    this.yaw = P.car ? P.car.angle : G.yaw;""", """    const fp = G.cam3d === 'fp';
    const models = this.modelsActive();
    const top = G.cam3d === 'top';
    if (models) this.initModels();
    if (this._modelsOn !== models) { this._modelsOn = models; if (this.vcMat) this.setModelsVisible(models); }
    this.yaw = P.car ? P.car.angle : top ? P.angle : G.yaw;""")
s = rep(s, """    // entities
    for (const z of G.zombies) {""", """    // entities
    if (models) this.renderRigs(tgt, fp);
    else for (const z of G.zombies) {""")
s = rep(s, """    for (const a of G.allies) {
      const img = a.kind === 'shadow' ? a.img : a.img;""", """    if (!models) for (const a of G.allies) {
      const img = a.kind === 'shadow' ? a.img : a.img;""")
s = rep(s, """      if (!m) { const H = 24; m = new THREE.Mesh(this.unitBox, this.boxMats(c.img)); m.scale.set(c.len * 0.94, H, c.wid * 0.94); m.userData = { img: c.img, own: false }; this.scene.add(m); this.ents.set(c, m); }
      m.userData.seen = this.frameId;
      m.position.set(c.x, 12, c.y); m.rotation.set(0, -c.angle, 0); m.visible = true;""", """      if (!m) {
        const geo = models ? propModel(c.img, c.len, c.wid, this.avgColor(c.img)) : null;
        if (geo) { m = new THREE.Mesh(geo, this.vcMat); m.userData = { img: c.img, own: false, model: true }; }
        else { m = new THREE.Mesh(this.unitBox, this.boxMats(c.img)); m.scale.set(c.len * 0.94, 24, c.wid * 0.94); m.userData = { img: c.img, own: false }; }
        this.scene.add(m); this.ents.set(c, m);
      }
      m.userData.seen = this.frameId;
      m.position.set(c.x, m.userData.model ? 0 : 12, c.y); m.rotation.set(0, -c.angle, 0); m.visible = true;""")
s = rep(s, """    if (!fp && !P.car && !P.dead) {
      const back = RL.id + '_hb';""", """    if (models) { const pm = this.ents.get(P); if (pm) pm.visible = false; }
    else if (!fp && !P.car && !P.dead) {
      const back = RL.id + '_hb';""")
s = rep(s, """    // particles & projectiles
    this.fillPoints();""", """    // particles & projectiles
    this.fillPoints();
    if (models) { this.renderFx(); this.updateViewModel(fp); }""")
s = rep(s, """    if (fp) {
      const bob = Math.sin(P.walkT * 1.3) * 1.6 * Math.min(1, Math.hypot(P.vx, P.vy) / 100);""", """    if (top) {
      const shx = G.shakeAmt ? R.range(-1, 1) * G.shakeAmt : 0;
      const lx = P.car ? Math.cos(P.car.angle) * P.car.speed * 0.4 : 0, ly = P.car ? Math.sin(P.car.angle) * P.car.speed * 0.4 : 0;
      cam.fov = 50; cam.position.set(tgt.x + lx + shx, 470, tgt.y + ly + 230 + shx); cam.lookAt(tgt.x + lx, 0, tgt.y + ly + 20);
    } else if (fp) {
      const bob = Math.sin(P.walkT * 1.3) * 1.6 * Math.min(1, Math.hypot(P.vx, P.vy) / 100);""")
s = rep(s, """    cam.updateProjectionMatrix();""", """    cam.updateProjectionMatrix();
    this.scene.fog.near = top ? 520 : this.scene.fog.near; this.scene.fog.far = top ? 1350 : this.scene.fog.far;
    if (models) {
      cam.updateMatrixWorld();
      this.updateSky(cam, dark);
      if (this.winMat) { this.winMat.color.setHex(dark > 0.35 ? (RL.id === 'cy' ? 0xff7ae8 : 0xffcf70) : 0x34495a); this.winMat2.color.setHex(dark > 0.35 ? 0x1a2028 : 0x2a3a4a); }
    }""")
s = rep(s, """    for (const b of rec_never__ if false""" if False else """    const pb = World.bldAt(tgt.x, tgt.y);
    for (const rec of this.built.values()) for (const b of rec.sb.buildings) if (b.mesh3d) b.mesh3d.visible = !(b === pb && !fp);""", """    const pb = World.bldAt(tgt.x, tgt.y);
    for (const rec of this.built.values()) for (const b of rec.sb.buildings) if (b.mesh3d) b.mesh3d.visible = !(b === pb && (!fp || models && top));""")
wr('js/r3d.js', s)

# ---------------- play.js ----------------
s = rd('js/play.js')
s = rep(s, """  const m = screenToWorld(Input.mouse.x, Input.mouse.y);
  Input.mouse.wx = m.x; Input.mouse.wy = m.y;""", """  let m = screenToWorld(Input.mouse.x, Input.mouse.y);
  if (G.gfx === '3d' && G.cam3d === 'top' && R3D.ok && R3D.camera) { const gp = R3D.groundPoint(Input.mouse.x, Input.mouse.y); if (gp) m = gp; }
  Input.mouse.wx = m.x; Input.mouse.wy = m.y;""")
s = rep(s, """  if (this.cam3d !== 'top' && R3D.ok && this.player) { R3D.render(); drawOverlay3D(); return; }""", """  if ((this.cam3d !== 'top' || this.gfx === '3d') && R3D.ok && this.player) { R3D.render(); drawOverlay3D(); return; }""")
s = rep(s, """  if (G.cam3d !== 'top' && R3D.ok) {
    // camera-relative controls for third / first person""", """  if (G.cam3d !== 'top' && R3D.ok) {
    // camera-relative controls for third / first person (both 2D-billboard and 3D-model graphics)""")
# overlay: compass only in tp/fp, crosshair follows mouse in 3D top view, 2D viewmodel only without models
s = rep(s, """  // compass with objectives
  const yaw = P.car ? P.car.angle : G.yaw;""", """  if (G.cam3d === 'top') { drawTop3DOverlay(W, H, d); return; }
  // compass with objectives
  const yaw = P.car ? P.car.angle : G.yaw;""")
s = rep(s, """  if (fp) drawViewModel(W, H, d);
}""", """  if (fp && G.gfx !== '3d') drawViewModel(W, H, d);
}
function drawTop3DOverlay(W, H, d) {
  const P = G.player;
  G.curTargets = World.mode === 'over' ? Story.targets() : [];
  // objective arrows around the screen edge
  for (const t of G.curTargets) {
    const sc = R3D.project(t.x, 10, t.y);
    let x, y, inside = false;
    if (sc) { x = sc[0] * d; y = sc[1] * d; inside = x > 60 * d && x < W - 60 * d && y > 60 * d && y < H - 60 * d; }
    if (inside) continue;
    const a = Math.atan2(t.y - P.y, t.x - P.x);
    const m = 60 * d;
    const k = Math.min((W / 2 - m) / Math.abs(Math.cos(a) || 1e-3), (H / 2 - m) / Math.abs(Math.sin(a) || 1e-3));
    const ax = W / 2 + Math.cos(a) * k, ay = H / 2 + Math.sin(a) * k;
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(a);
    ctx.fillStyle = '#ffcf3a'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2 * d;
    ctx.beginPath(); ctx.moveTo(16 * d, 0); ctx.lineTo(-8 * d, -11 * d); ctx.lineTo(-3 * d, 0); ctx.lineTo(-8 * d, 11 * d); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.font = `${15 * d}px VT323, monospace`; ctx.fillStyle = '#ffcf3a'; ctx.textAlign = 'center';
    ctx.fillText((t.label ? t.label + ' ' : '') + Math.round(dist(P.x, P.y, t.x, t.y) / TILE) + 'm', ax - Math.cos(a) * 30 * d, ay - Math.sin(a) * 30 * d + 4 * d);
  }
  if (!P.car && !P.dead && !Touch.on) {
    const mx = Input.mouse.x * d, my = Input.mouse.y * d;
    ctx.strokeStyle = P.reloading > 0 ? '#ffb347' : '#f2f2f2'; ctx.lineWidth = 2 * d;
    ctx.beginPath(); ctx.arc(mx, my, 8 * d, 0, TAU); ctx.moveTo(mx - 14 * d, my); ctx.lineTo(mx - 4 * d, my); ctx.moveTo(mx + 4 * d, my); ctx.lineTo(mx + 14 * d, my); ctx.moveTo(mx, my - 14 * d); ctx.lineTo(mx, my - 4 * d); ctx.moveTo(mx, my + 4 * d); ctx.lineTo(mx, my + 14 * d); ctx.stroke();
  }
}""")
s = rep(s, """G.cycleView = function () {""", """G.setGfx = function (g) {
  if (g === '3d' && !R3D.ok) { this.toast('Trình duyệt này không hỗ trợ 3D (WebGL).', 'warn'); g = '2d'; }
  this.gfx = g;
  try { localStorage.setItem('tt_gfx', g); } catch (e) {}
  document.body.classList.toggle('v3d', g === '3d' || this.cam3d !== 'top');
  const b = document.getElementById('btnGfx'); if (b) b.textContent = '🎮 ĐỒ HOẠ: ' + (g === '3d' ? '3D' : '2D PIXEL');
  const t = document.getElementById('tGfx'); if (t) t.textContent = g === '3d' ? '3D' : '2D';
  if (R3D.ok) { R3D.reset(); }
  resize();
};
G.toggleGfx = function () { this.setGfx(this.gfx === '3d' ? '2d' : '3d'); this.toast(this.gfx === '3d' ? 'Đồ hoạ 3D — nhấn V để đổi góc nhìn' : 'Đồ hoạ 2D pixel', 'info'); Sound.play('sfx_click', 0.5); };
G.cycleView = function () {""")
s = rep(s, """  document.body.classList.toggle('v3d', v !== 'top');""", """  document.body.classList.toggle('v3d', v !== 'top' || this.gfx === '3d');""")
s = rep(s, """  this.toast({ top: 'Góc nhìn: TỪ TRÊN XUỐNG',""", """  this.toast({ top: this.gfx === '3d' ? 'Góc nhìn: TỪ TRÊN (3D)' : 'Góc nhìn: TỪ TRÊN XUỐNG',""")
wr('js/play.js', s)

# ---------------- touch.js: player screen pos in 3D top view ----------------
s = rd('js/touch.js')
s = rep(s, """  playerScreen() {
    const P = G.player;""", """  playerScreen() {
    const P = G.player;
    if (G.gfx === '3d' && G.cam3d === 'top' && R3D.ok && R3D.camera) { const t = P.car || P; const sc = R3D.project(t.x, 20, t.y); if (sc) return { x: sc[0], y: sc[1] }; }""")
s = rep(s, """else if (a === 'view') G.cycleView();""", """else if (a === 'view') G.cycleView(); else if (a === 'gfx') G.toggleGfx();""")
wr('js/touch.js', s)

# ---------------- ui.js / index.html ----------------
s = rd('js/ui.js')
s = rep(s, """    $('btnView').onclick = () => G.cycleView();""", """    $('btnView').onclick = () => G.cycleView();
    $('btnGfx').onclick = () => G.toggleGfx();
    $('btnGfxT').onclick = () => G.toggleGfx();""")
s = rep(s, """    if (code === 'KeyV' && G.state === 'playing') { G.cycleView(); return; }""", """    if (code === 'KeyV' && G.state === 'playing') { G.cycleView(); return; }
    if (code === 'KeyK' && G.state === 'playing') { G.toggleGfx(); return; }""")
wr('js/ui.js', s)

s = rd('index.html')
s = rep(s, """<script src="js/r3d.js"></script>""", """<script src="js/r3d.js"></script>
<script src="js/models3d.js"></script>
<script src="js/r3d_models.js"></script>""")
s = rep(s, """<button data-a="view" id="tView">👁</button>""", """<button data-a="gfx" id="tGfx">3D</button><button data-a="view" id="tView">👁</button>""")
s = rep(s, """      <button id="btnView">👁 GÓC NHÌN: TỪ TRÊN</button>""", """      <button id="btnGfx">🎮 ĐỒ HOẠ: 3D</button>
      <button id="btnView">👁 GÓC NHÌN: TỪ TRÊN</button>""")
s = rep(s, """      <button id="btnSettings">♪ CÀI ĐẶT</button>
      <button id="btnFs">⛶ TOÀN MÀN HÌNH</button>""", """      <button id="btnGfxT">🎮 ĐỒ HOẠ: 3D</button>
      <button id="btnSettings">♪ CÀI ĐẶT</button>
      <button id="btnFs">⛶ TOÀN MÀN HÌNH</button>""")
s = rep(s, """          <tr><td>V</td><td>Đổi góc nhìn: từ trên → góc 3 → góc 1 (rê chuột để xoay)</td></tr>""", """          <tr><td>V</td><td>Đổi góc nhìn: từ trên → góc 3 → góc 1 (rê chuột để xoay)</td></tr>
          <tr><td>K</td><td>Đổi đồ hoạ 2D pixel ↔ 3D</td></tr>""")
s = rep(s, """  try { G.lowGfx = !!localStorage.getItem('tt_low'); G.cam3d = localStorage.getItem('tt_view') || 'top'; } catch (e) { G.cam3d = 'top'; }""", """  try { G.lowGfx = !!localStorage.getItem('tt_low'); G.cam3d = localStorage.getItem('tt_view') || 'top'; G.gfx = localStorage.getItem('tt_gfx') || '3d'; } catch (e) { G.cam3d = 'top'; G.gfx = '3d'; }""")
s = rep(s, """  G.setView(G.cam3d);""", """  G.setView(G.cam3d);
  G.setGfx(G.gfx);""")
wr('index.html', s)
print('ok')
