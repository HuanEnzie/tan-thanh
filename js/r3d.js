// ===== 3D renderer (third person / first person) built from the 2D world data =====
const WALL_H = 64;
const R3D = {
  ok: false, built: new Map(), mats: {}, tex: {}, ents: new Map(), avg: {},
  init() {
    if (!window.THREE) return;
    try {
      this.canvas = document.getElementById('game3d');
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, powerPreference: 'high-performance' });
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(70, 16 / 9, 2, 2600);
      this.scene.fog = new THREE.Fog(0x0b0c0e, 300, 1100);
      this.hemi = new THREE.HemisphereLight(0xdfe8ff, 0x3a3020, 1);
      this.scene.add(this.hemi);
      this.sun = new THREE.DirectionalLight(0xffffff, 0.5);
      this.sun.position.set(0.4, 1, 0.3);
      this.scene.add(this.sun);
      this.spot = new THREE.SpotLight(0xfff4dd, 0, 520, 0.5, 0.45, 1);
      this.scene.add(this.spot); this.scene.add(this.spot.target);
      this.pLight = new THREE.PointLight(0xfff0dd, 0, 260, 1.2); this.scene.add(this.pLight);
      this.points = [];
      for (let i = 0; i < 5; i++) { const l = new THREE.PointLight(0xff9a40, 0, 260, 1.4); this.scene.add(l); this.points.push(l); }
      this.dummy = new THREE.Object3D();
      this.unitPlane = new THREE.PlaneGeometry(1, 1);
      this.unitBox = new THREE.BoxGeometry(1, 1, 1);
      this.trunkGeo = new THREE.CylinderGeometry(3.5, 5, 1, 6);
      this.trunkMat = new THREE.MeshLambertMaterial({ color: 0x4a3420 });
      // particles & projectiles
      const mk = (n, size) => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
        g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
        const m = new THREE.PointsMaterial({ size, vertexColors: true, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
        const p = new THREE.Points(g, m); p.frustumCulled = false; this.scene.add(p); return p;
      };
      this.parts = mk(1500, 3); this.partsN = new THREE.Points(this.parts.geometry.clone(), new THREE.PointsMaterial({ size: 2.2, vertexColors: true, sizeAttenuation: true }));
      this.partsN.frustumCulled = false; this.scene.add(this.partsN);
      this.shots = mk(400, 9);
      this.ok = true;
    } catch (e) { console.warn('3D unavailable', e); this.ok = false; }
  },
  resize() {
    if (!this.ok) return;
    const pr = Math.min(window.devicePixelRatio || 1, G.lowGfx ? 1 : document.body.classList.contains('touch') ? 1.25 : 1.75);
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(VW, VH, false);
    this.camera.aspect = VW / VH; this.camera.updateProjectionMatrix();
  },
  reset() {
    if (!this.ok) return;
    for (const k of [...this.built.keys()]) this.dropSB(k);
    for (const [e, m] of this.ents) { this.scene.remove(m); if (m.material && m.userData.own) m.material.dispose(); }
    this.ents.clear();
  },

  // ---------- textures & materials ----------
  texOf(name, repeat) {
    const key = name + (repeat ? '#r' : '');
    let t = this.tex[key];
    if (!t) {
      const im = IMG[name]; if (!im) return null;
      t = new THREE.Texture(im); t.needsUpdate = true;
      t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
      if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
      this.tex[key] = t;
    }
    return t;
  },
  avgColor(name) {
    if (this.avg[name] != null) return this.avg[name];
    const im = IMG[name]; let col = 0x555555;
    if (im) {
      try {
        const c = document.createElement('canvas'); c.width = c.height = 8;
        const g = c.getContext('2d'); g.drawImage(im, 0, 0, 8, 8);
        const d = g.getImageData(0, 0, 8, 8).data; let r = 0, gg = 0, b = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++; }
        if (n) col = (Math.round(r / n * 0.7) << 16) | (Math.round(gg / n * 0.7) << 8) | Math.round(b / n * 0.7);
      } catch (e) { /* tainted canvas from file:// — keep grey */ }
    }
    return (this.avg[name] = col);
  },
  spriteMat(name) {
    const k = 'spr:' + name;
    if (!this.mats[k]) this.mats[k] = new THREE.MeshLambertMaterial({ map: this.texOf(name), transparent: true, alphaTest: 0.45, side: THREE.DoubleSide });
    return this.mats[k];
  },
  boxMats(name) {
    const k = 'box:' + name;
    if (!this.mats[k]) {
      const side = new THREE.MeshLambertMaterial({ color: this.avgColor(name) });
      const top = new THREE.MeshLambertMaterial({ map: this.texOf(name), transparent: true, alphaTest: 0.4 });
      this.mats[k] = [side, side, top, side, side, side];
    }
    return this.mats[k];
  },
  wallMat() {
    const name = World.mode === 'dungeon' ? RL.dungeon.wall : RL.wall;
    const k = 'wall:' + (name || 'brick');
    if (!this.mats[k]) {
      let t;
      if (name) t = this.texOf(name, true);
      else { // procedural brick
        const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
        g.fillStyle = '#5a5048'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#3a332d';
        for (let r = 0; r < 8; r++) { g.fillRect(0, r * 8 + 7, 64, 1); const o = (r % 2) * 8; for (let x = o; x < 64; x += 16) g.fillRect(x + 7, r * 8, 1, 8); }
        t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.NearestFilter;
      }
      t.repeat.set(1, 2);
      this.mats[k] = new THREE.MeshLambertMaterial({ map: t });
    }
    return this.mats[k];
  },

  // ---------- per-superblock static geometry ----------
  propHeight(p) {
    const n = p.img;
    if (/bus|truck/.test(n)) return 46;
    if (/car|_p_4$|_p_5$/.test(n) && n.startsWith('cy')) return 22;
    if (/car_/.test(n)) return 24;
    if (/tent|_p_7$/.test(n)) return 34;
    if (/vending|cy_p_0|cy_p_8|tt_p_4|sl_p_4/.test(n)) return 48;
    if (/dumpster|ammocrate|cy_p_1|cy_p_9|ct_p_6/.test(n)) return 28;
    if (/barrel|cy_p_2|tt_p_3|ct_p_0/.test(n)) return 26;
    if (/fence|ct_p_10|cy_p_10/.test(n)) return 26;
    if (/barrier|sandbags/.test(n)) return 18;
    if (/bench|tt_p_11/.test(n)) return 10;
    if (/rock/.test(n) || n === 'tt_p_10') return 22;
    if (/ct_p_3|tt_p_2/.test(n)) return 38;
    if (/fx_6/.test(n)) return 36;
    return 22;
  },
  buildSB(sb) {
    const group = new THREE.Group();
    const rec = { group, sb, insts: [], dynamic: new Map(), built: 0, groundT: 0 };
    // ground
    const S = G.lowGfx ? 512 : 1024;
    const gc = document.createElement('canvas'); gc.width = gc.height = S;
    rec.gc = gc; this.paintGround(rec);
    const gt = new THREE.CanvasTexture(gc); gt.magFilter = THREE.NearestFilter; gt.minFilter = THREE.LinearFilter;
    rec.gt = gt;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(SBPX, SBPX), new THREE.MeshLambertMaterial({ map: gt }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(sb.tx0 * TILE + SBPX / 2, 0, sb.ty0 * TILE + SBPX / 2);
    group.add(ground);
    // walls (only those touching open space)
    const walls = [];
    const isW = t => t === T.WALL || t === T.WINDOW;
    for (let y = 0; y < SB; y++) for (let x = 0; x < SB; x++) {
      const t = sb.tiles[y * SB + x]; if (!isW(t)) continue;
      const gx = sb.tx0 + x, gy = sb.ty0 + y;
      let open = false;
      for (let dy = -1; dy <= 1 && !open; dy++) for (let dx = -1; dx <= 1; dx++) if (!isW(World.get(gx + dx, gy + dy))) { open = true; break; }
      if (open) walls.push([gx, gy, t === T.WINDOW]);
    }
    const models = this.modelsActive();
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
    }
    // roofs
    for (const b of sb.buildings) {
      const w = (b.x1 - b.x0 + 1) * TILE, h = (b.y1 - b.y0 + 1) * TILE;
      if (models) { const m = this.roofModel(b, this.wallHeight(sb, b.x0, b.y0)); b.mesh3d = m; group.add(m); continue; }
      const t = this.texOf(b.roof, true);
      if (!t) continue;
      const tt = t.clone(); tt.needsUpdate = true; tt.repeat.set(w / 128, h / 128);
      const m = new THREE.Mesh(this.unitPlane, new THREE.MeshLambertMaterial({ map: tt, side: THREE.DoubleSide }));
      m.rotation.x = -Math.PI / 2; m.scale.set(w + 6, h + 6, 1);
      m.position.set(b.x0 * TILE + w / 2, WALL_H + 0.5, b.y0 * TILE + h / 2);
      b.mesh3d = m; group.add(m);
    }
    this.buildProps(rec);
    this.scene.add(group);
    this.built.set(sb.key, rec);
  },
  paintGround(rec) {
    const sb = rec.sb, g = rec.gc.getContext('2d'), s = rec.gc.width / SBPX;
    g.imageSmoothingEnabled = false;
    for (let cy = 0; cy < 4; cy++) for (let cx = 0; cx < 4; cx++) {
      g.setTransform(s, 0, 0, s, -sb.tx0 * TILE * s, -sb.ty0 * TILE * s);
      World.renderChunk(g, sb.sx * 4 + cx, sb.sy * 4 + cy);
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
  },
  buildProps(rec) {
    const sb = rec.sb;
    const groups = new Map();
    const start = rec.built;
    for (let i = start; i < sb.props.length; i++) {
      const p = sb.props[i];
      if (p.dead) continue;
      let type;
      if (p.canopy) type = 'tree';
      else if (p.kind === 'gate' || p.kind === 'exit') type = 'up';
      else if (p.kind === 'lamp' || /lamp|_p_3$|ct_p_2|tt_p_7|sl_p_1/.test(p.img) && p.light) type = 'lamp';
      else if (!p.solid || p.layer === 0) type = 'flat';
      else type = 'box';
      if (type === 'up' || type === 'lamp' || p.placed) { this.addSingle(rec, p, type); continue; }
      const k = type + ':' + p.img;
      let a = groups.get(k); if (!a) groups.set(k, a = []); a.push(p);
    }
    rec.built = sb.props.length;
    for (const [k, list] of groups) {
      const [type, img] = k.split(':');
      if (this.modelsActive() && type !== 'flat' && this.buildPropModels(rec, list, img, type)) continue;
      if (type === 'tree') {
        const can = new THREE.InstancedMesh(this.unitPlane, this.spriteMat(img), list.length);
        const tr = new THREE.InstancedMesh(this.trunkGeo, this.trunkMat, list.length);
        const cross = new THREE.InstancedMesh(this.unitPlane, this.spriteMat(img), list.length * 2);
        list.forEach((p, i) => {
          const hgt = 62 + hash2(Math.round(p.x), Math.round(p.y)) * 18;
          for (let k = 0; k < 2; k++) {
            this.dummy.position.set(p.x, hgt - p.h * 0.22, p.y); this.dummy.rotation.set(0, p.rot + k * Math.PI / 2, 0); this.dummy.scale.set(p.w * 0.8, p.h * 0.62, 1); this.dummy.updateMatrix();
            cross.setMatrixAt(i * 2 + k, this.dummy.matrix);
          }
        });
        rec.group.add(cross);
        list.forEach((p, i) => {
          const hgt = 62 + hash2(Math.round(p.x), Math.round(p.y)) * 18;
          this.dummy.position.set(p.x, hgt, p.y); this.dummy.rotation.set(-Math.PI / 2, 0, -p.rot); this.dummy.scale.set(p.w, p.h, 1); this.dummy.updateMatrix(); can.setMatrixAt(i, this.dummy.matrix);
          this.dummy.position.set(p.x, hgt / 2, p.y); this.dummy.rotation.set(0, 0, 0); this.dummy.scale.set(1, hgt, 1); this.dummy.updateMatrix(); tr.setMatrixAt(i, this.dummy.matrix);
          p.inst3d = { meshes: [can, tr], i, cross, ci: i * 2 };
        });
        rec.group.add(can); rec.group.add(tr);
      } else if (type === 'flat') {
        const m = new THREE.InstancedMesh(this.unitPlane, this.spriteMat(img), list.length);
        list.forEach((p, i) => { this.dummy.position.set(p.x, 1.5 + (i % 3) * 0.2, p.y); this.dummy.rotation.set(-Math.PI / 2, 0, -p.rot); this.dummy.scale.set(p.w, p.h, 1); this.dummy.updateMatrix(); m.setMatrixAt(i, this.dummy.matrix); p.inst3d = { meshes: [m], i }; });
        rec.group.add(m);
      } else {
        const m = new THREE.InstancedMesh(this.unitBox, this.boxMats(img), list.length);
        list.forEach((p, i) => {
          const H = this.propHeight(p);
          this.dummy.position.set(p.x, H / 2, p.y); this.dummy.rotation.set(0, -p.rot, 0); this.dummy.scale.set(p.w * 0.94, H, p.h * 0.94); this.dummy.updateMatrix();
          m.setMatrixAt(i, this.dummy.matrix); p.inst3d = { meshes: [m], i };
        });
        rec.group.add(m);
      }
    }
  },
  addSingle(rec, p, type) {
    let m;
    if (type === 'up' && this.modelsActive()) {
      const col = p.lightCol === 'red' ? 0xff3040 : 0x3a8aff;
      m = new THREE.Group();
      GB.start(); GB.torus(p.w * 0.36, 5, 0x2a2a34, 0, 0, 0); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; GB.box(6, 10, 6, 0x3a3a46, Math.cos(a) * p.w * 0.36, Math.sin(a) * p.w * 0.36, 0, 0, 0, a); }
      const ring = new THREE.Mesh(GB.done(), this.vcMat); m.add(ring);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(p.w * 0.34, 24), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.75, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.add(disc); m.userData.disc = disc;
      m.position.set(p.x, p.w * 0.4, p.y); m.userData.bill = true; m.userData.portal = true;
    } else if (type === 'up') { m = new THREE.Mesh(this.unitPlane, this.spriteMat(p.img)); m.scale.set(p.w, p.h, 1); m.position.set(p.x, p.h / 2, p.y); m.userData.bill = true; }
    else if (type === 'lamp') {
      m = new THREE.Group();
      const pole = new THREE.Mesh(this.trunkGeo, new THREE.MeshLambertMaterial({ color: 0x333338 })); pole.scale.set(0.6, 70, 0.6); pole.position.y = 35; m.add(pole);
      const bulb = new THREE.Mesh(this.unitPlane, this.spriteMat(p.img)); bulb.scale.set(p.w, p.h, 1); bulb.rotation.x = -Math.PI / 2; bulb.position.y = 71; m.add(bulb);
      m.position.set(p.x, 0, p.y);
    } else if (!p.solid || p.layer === 0) { m = new THREE.Mesh(this.unitPlane, this.spriteMat(p.img)); m.rotation.set(-Math.PI / 2, 0, -p.rot); m.scale.set(p.w, p.h, 1); m.position.set(p.x, 1.8, p.y); }
    else { const H = this.propHeight(p); m = new THREE.Mesh(this.unitBox, this.boxMats(p.img)); m.scale.set(p.w * 0.94, H, p.h * 0.94); m.rotation.y = -p.rot; m.position.set(p.x, H / 2, p.y); }
    p.mesh3d = m; rec.group.add(m);
    if (m.userData.bill) rec.dynamic.set(p, m);
  },
  hideProp(p) {
    if (p.mesh3d) { p.mesh3d.visible = false; return; }
    if (p.inst3d) {
      this.dummy.position.set(0, -9999, 0); this.dummy.scale.set(0.001, 0.001, 0.001); this.dummy.updateMatrix();
      for (const m of p.inst3d.meshes) { m.setMatrixAt(p.inst3d.i, this.dummy.matrix); m.instanceMatrix.needsUpdate = true; }
      if (p.inst3d.cross) { for (let k = 0; k < 2; k++) p.inst3d.cross.setMatrixAt(p.inst3d.ci + k, this.dummy.matrix); p.inst3d.cross.instanceMatrix.needsUpdate = true; }
      p.inst3d = null;
    }
  },
  dropSB(k) {
    const rec = this.built.get(k); if (!rec) return;
    this.scene.remove(rec.group);
    rec.group.traverse(o => { if (o.geometry && o.geometry !== this.unitBox && o.geometry !== this.unitPlane && o.geometry !== this.trunkGeo) o.geometry.dispose(); if (o.material && !Array.isArray(o.material) && o.material.map && (o.material.map === rec.gt || o.material.map.repeat.x !== 1)) { o.material.map.dispose(); o.material.dispose(); } });
    for (const b of rec.sb.buildings) b.mesh3d = null;
    for (const p of rec.sb.props) { p.mesh3d = null; p.inst3d = null; }
    this.built.delete(k);
  },
  markDirty(x, y) {
    if (!this.ok || G.cam3d === 'top') return;
    const rec = this.built.get(nkey(Math.floor(x / SBPX), Math.floor(y / SBPX)));
    if (rec) rec.dirty = true;
  },

  // ---------- dynamic entities (billboards) ----------
  frontOf(img) {
    if (!this.fmap || this.fmapRealm !== RL.id) {
      this.fmap = {}; this.fmapRealm = RL.id;
      RL.enemies.forEach((n, i) => this.fmap[n] = RL.id + '_ef_' + i);
      RL.npc.forEach((n, i) => this.fmap[n] = RL.id + '_nf_' + i);
      if (RL.extraEnemies) for (const k in RL.extraEnemies) for (const n of RL.extraEnemies[k]) this.fmap[n] = RL.id + '_ef_0';
    }
    const f = this.fmap[img];
    return f && IMG[f] ? f : null;
  },
  entMesh(e, img) {
    let m = this.ents.get(e);
    if (!m || m.userData.img !== img) {
      if (m) { this.scene.remove(m); m.material.dispose(); }
      const mat = new THREE.MeshLambertMaterial({ map: this.texOf(img), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, emissive: 0x000000 });
      m = new THREE.Mesh(this.unitPlane, mat);
      m.userData = { img, own: true };
      this.scene.add(m); this.ents.set(e, m);
    }
    m.userData.seen = this.frameId;
    return m;
  },
  placeBill(e, img, x, y, hgt, o = {}) {
    const front = this.frontOf(img);
    const use = front || img;
    const im = IMG[use]; if (!im) return;
    const m = this.entMesh(e, use);
    const s = (o.scale || 1);
    let w = im.width / 2 * s, h = im.height / 2 * s;
    if (!front) { w *= 0.9; h *= 0.9; } // top-down fallback
    const yaw = this.yaw;
    m.position.set(x, (o.lift || 0) + h / 2 + (o.bob || 0), y);
    m.rotation.set(o.fall || 0, -yaw - Math.PI / 2, 0, 'YXZ');
    m.scale.set(w, h, 1);
    m.material.opacity = o.alpha ?? 1;
    const base = o.base ?? 0.08;
    m.material.emissive.setRGB(Math.max(base, o.flash || 0), Math.max(base, (o.flash || 0) * (o.flashG ?? 1)), Math.max(base, (o.flash || 0) * (o.flashB ?? 1)));
    m.visible = true;
    return m;
  },

  // ---------- frame ----------
  render() {
    if (!this.ok) return;
    this.frameId = (this.frameId || 0) + 1;
    const P = G.player, tgt = P.car || P;
    const fp = G.cam3d === 'fp';
    const models = this.modelsActive();
    const top = G.cam3d === 'top';
    if (models) this.initModels();
    if (this._modelsOn !== models) { this._modelsOn = models; if (this.vcMat) this.setModelsVisible(models); }
    this.yaw = P.car ? P.car.angle : top ? P.angle : G.yaw;
    // sync world geometry
    const sx = Math.floor(tgt.x / SBPX), sy = Math.floor(tgt.y / SBPX);
    let builtOne = false;
    for (let y = sy - 1; y <= sy + 1; y++) for (let x = sx - 1; x <= sx + 1; x++) {
      const k = nkey(x, y), sb = World.sbs.get(k);
      if (sb && !this.built.has(k) && !builtOne) { this.buildSB(sb); builtOne = true; }
    }
    for (const [k, rec] of this.built) {
      if (!World.sbs.has(k) || World.sbs.get(k) !== rec.sb || Math.abs(rec.sb.sx - sx) > 2 || Math.abs(rec.sb.sy - sy) > 2) { this.dropSB(k); continue; }
      if (rec.built < rec.sb.props.length) this.buildProps(rec);
      if (this.frameId % 20 === 0) for (const p of rec.sb.props) if (p.dead && (p.inst3d || (p.mesh3d && p.mesh3d.visible))) this.hideProp(p);
      if (rec.dirty && G.time - rec.groundT > 1.2) { rec.dirty = false; rec.groundT = G.time; this.paintGround(rec); rec.gt.needsUpdate = true; }
      for (const [p, m] of rec.dynamic) {
        if (m.userData.portal) { m.rotation.set(0, -this.yaw - Math.PI / 2, 0); m.userData.disc.rotation.z = G.time * 2; m.userData.disc.material.opacity = 0.55 + Math.sin(G.time * 3) * 0.2; continue; }
        m.rotation.set(0, -this.yaw - Math.PI / 2, 0); if (p.kind === 'gate' || p.kind === 'exit') m.material.emissive && m.material.emissive.setRGB(0.3, 0.3, 0.4);
      }
    }
    // roofs: hide the one the player stands under (third person only)
    const pb = World.bldAt(tgt.x, tgt.y);
    for (const rec of this.built.values()) for (const b of rec.sb.buildings) if (b.mesh3d) b.mesh3d.visible = !(b === pb && (!fp || models && top));
    // entities
    if (models) this.renderRigs(tgt, fp);
    else for (const z of G.zombies) {
      if (dist(z.x, z.y, tgt.x, tgt.y) > 1100) continue;
      let alpha = 1, fall = 0, sc = z.scale;
      if (z.dead) { const k = Math.min(1, z.dying / 0.4); alpha = 1 - k; fall = -k * 1.4; }
      if (z.rise > 0) sc *= 1 - z.rise / 0.5;
      const flash = z.hitT > 0 ? 0.45 : z.bossState === 'windup' ? 0.6 : z.elite ? 0.12 : 0;
      this.placeBill(z, z.img, z.x, z.y, 0, { scale: sc * (this.frontOf(z.img) ? 1 : 1), alpha, fall, flash, flashG: z.bossState === 'windup' ? 0.1 : z.elite && z.hitT <= 0 ? 0.8 : 1, flashB: z.bossState === 'windup' ? 0.1 : z.elite && z.hitT <= 0 ? 0.1 : 1, bob: Math.abs(Math.sin(z.walkT)) * 2.5 });
    }
    if (!models) for (const a of G.allies) {
      const img = a.kind === 'shadow' ? a.img : a.img;
      const m = this.placeBill(a, img, a.x, a.y, 0, { scale: a.scale, alpha: a.fade, fall: a.downed ? -1.3 : 0, bob: Math.abs(Math.sin(a.walkT)) * 2, flash: a.kind === 'shadow' ? 0.25 : 0, flashG: 0.2, flashB: 1 });
      if (m && a.kind === 'shadow') m.material.color.setRGB(0.35, 0.3, 0.7);
    }
    for (const c of G.cars) {
      let m = this.ents.get(c);
      if (!m) {
        const geo = models ? propModel(c.img, c.len, c.wid, this.avgColor(c.img)) : null;
        if (geo) { m = new THREE.Mesh(geo, this.vcMat); m.userData = { img: c.img, own: false, model: true }; }
        else { m = new THREE.Mesh(this.unitBox, this.boxMats(c.img)); m.scale.set(c.len * 0.94, 24, c.wid * 0.94); m.userData = { img: c.img, own: false }; }
        this.scene.add(m); this.ents.set(c, m);
      }
      m.userData.seen = this.frameId;
      m.position.set(c.x, m.userData.model ? 0 : 12, c.y); m.rotation.set(0, -c.angle, 0); m.visible = true;
    }
    for (const it of Items.list) {
      const icon = it.gear ? Loot.iconOf(it.gear) : (ITEMS[it.id] ? ITEMS[it.id].icon : 'i_scrap');
      const im = IMG[icon]; if (!im) continue;
      const m = this.entMesh(it, icon);
      const s = 16 / Math.max(im.width, im.height);
      m.scale.set(im.width * s, im.height * s, 1);
      m.position.set(it.x, 10 + Math.sin(it.t * 3) * 3, it.y); m.rotation.set(0, -this.yaw - Math.PI / 2 + it.t, 0);
      m.material.emissive.setRGB(0.35, 0.3, 0.15); m.visible = true;
    }
    // player body in third person
    if (models) { const pm = this.ents.get(P); if (pm) pm.visible = false; }
    else if (!fp && !P.car && !P.dead) {
      const back = RL.id + '_hb';
      const img = IMG[back] ? back : P.wdef.sprite;
      const m = this.placeBill(P, img, P.x, P.y, 0, { base: 0.12, flash: P.hurtT > 0.15 ? 0.7 : 0, flashG: 0.1, flashB: 0.1, bob: Math.abs(Math.sin(P.walkT)) * 2 });
      if (m && P.dashT > 0) m.material.opacity = 0.6;
    } else { const m = this.ents.get(P); if (m) m.visible = false; }
    // forget meshes of entities that are gone
    for (const [e, m] of this.ents) if (m.userData.seen !== this.frameId && !(e instanceof Car && G.cars.includes(e))) { this.scene.remove(m); if (m.userData.own) m.material.dispose(); this.ents.delete(e); }
    // particles & projectiles
    this.fillPoints();
    if (models) { this.renderFx(); this.updateViewModel(fp); }
    // lighting
    const dark = G.darkness() * (World.bldAt(tgt.x, tgt.y) ? 1 : 1);
    const tint = World.mode === 'dungeon' ? [3, 3, 8] : RL.nightTint;
    const sky = new THREE.Color(); sky.setRGB(0.55 + tint[0] / 255, 0.6 + tint[1] / 255, 0.7 + tint[2] / 255);
    this.hemi.intensity = clamp(0.88 - dark * 0.9, World.mode === 'dungeon' ? 0.2 : top ? 0.16 : 0.07, 0.88) + G.lightning * 0.8;
    this.sun.intensity = clamp(0.45 - dark * 0.5, 0, 0.45);
    const fogC = new THREE.Color().setRGB((tint[0] / 255) * (1 - dark) + 0.04 + (1 - dark) * 0.42, (tint[1] / 255) + 0.05 + (1 - dark) * 0.45, (tint[2] / 255) + 0.07 + (1 - dark) * 0.5);
    this.scene.fog.color.copy(fogC);
    this.renderer.setClearColor(fogC);
    this.scene.fog.near = fp ? 160 : 320; this.scene.fog.far = (fp ? 760 : 1050) * (G.raining ? 0.8 : 1) * (World.mode === 'dungeon' ? 0.75 : 1);
    // camera
    const cy = Math.cos(this.yaw), sy2 = Math.sin(this.yaw);
    const cam = this.camera;
    if (top) {
      const shx = G.shakeAmt ? R.range(-1, 1) * G.shakeAmt : 0;
      const lx = P.car ? Math.cos(P.car.angle) * P.car.speed * 0.4 : 0, ly = P.car ? Math.sin(P.car.angle) * P.car.speed * 0.4 : 0;
      cam.fov = 50; cam.position.set(tgt.x + lx + shx, 400, tgt.y + ly + 200 + shx); cam.lookAt(tgt.x + lx, 0, tgt.y + ly + 20);
    } else if (fp) {
      const bob = Math.sin(P.walkT * 1.3) * 1.6 * Math.min(1, Math.hypot(P.vx, P.vy) / 100);
      const eye = P.car ? 30 : 30 + bob;
      cam.fov = 74; cam.position.set(tgt.x, eye, tgt.y);
      cam.lookAt(tgt.x + cy * 100, eye - 4 + (G.shakeAmt ? R.range(-1, 1) * G.shakeAmt * 0.4 : 0), tgt.y + sy2 * 100);
    } else {
      const back = P.car ? 190 : 150, up = P.car ? 120 : 105;
      const shx = G.shakeAmt ? R.range(-1, 1) * G.shakeAmt : 0;
      cam.fov = 64; cam.position.set(tgt.x - cy * back + shx, up, tgt.y - sy2 * back + shx);
      cam.lookAt(tgt.x + cy * 90, 18, tgt.y + sy2 * 90);
    }
    cam.updateProjectionMatrix();
    this.scene.fog.near = top ? 520 : this.scene.fog.near; this.scene.fog.far = top ? 1350 : this.scene.fog.far;
    if (models) {
      cam.updateMatrixWorld();
      this.updateSky(cam, dark);
      if (this.winMat) { this.winMat.color.setHex(dark > 0.35 ? (RL.id === 'cy' ? 0xff7ae8 : 0xffcf70) : 0x34495a); this.winMat2.color.setHex(dark > 0.35 ? 0x1a2028 : 0x2a3a4a); }
    }
    // flashlight & nearby lights
    const flashOn = !P.dead && dark > 0.2 && (P.flash || P.car || World.mode === 'dungeon');
    if (top) { this.pLight.position.set(tgt.x, 110, tgt.y); this.pLight.distance = 520; this.pLight.intensity = dark * 1.8; } else { this.pLight.position.set(tgt.x - Math.cos(this.yaw) * 70, 70, tgt.y - Math.sin(this.yaw) * 70); this.pLight.distance = 260; this.pLight.intensity = dark * 0.85; }
    this.spot.intensity = flashOn ? 2.2 : 0;
    this.spot.position.set(tgt.x - cy * 6, 26, tgt.y - sy2 * 6);
    this.spot.target.position.set(tgt.x + cy * 200, 4, tgt.y + sy2 * 200);
    const cand = [];
    for (const l of World.lights) if (!l.dead) { const d = dist(l.x, l.y, tgt.x, tgt.y); if (d < 700) cand.push([d, l.x, l.y, l.lightCol === 'cyan' ? 0x3cf0ff : l.lightCol === 'magenta' ? 0xff46dc : l.lightCol === 'red' ? 0xff4a3a : l.lightCol === 'blue' ? 0x5a8cff : 0xff9a40, 1.6, l.light * 2]); }
    for (const f of Throws.fires) cand.push([dist(f.x, f.y, tgt.x, tgt.y), f.x, f.y, 0xff8a30, 2.4, f.r * 3]);
    for (const f of G.flashes) cand.push([0, f.x, f.y, 0xffd08a, 3 * f.life / f.max, f.r * 1.5]);
    if (P.muzzleT > 0) cand.push([0, P.x, P.y, 0xffe0a0, 2.5, 260]);
    cand.sort((a, b) => a[0] - b[0]);
    const lf = Math.max(0.15, dark);
    this.points.forEach((pl, i) => {
      const c = cand[i];
      if (!c) { pl.intensity = 0; return; }
      pl.position.set(c[1], 40, c[2]); pl.color.setHex(c[3]); pl.intensity = c[4] * lf; pl.distance = c[5];
    });
    this.renderer.render(this.scene, cam);
  },
  colCache: {},
  rgb(col) {
    let c = this.colCache[col];
    if (!c) {
      const t = new THREE.Color();
      try { if (col.startsWith('rgba')) { const m = col.match(/[\d.]+/g); t.setRGB(m[0] / 255, m[1] / 255, m[2] / 255); } else t.set(col); } catch (e) { t.set(0xffffff); }
      c = this.colCache[col] = [t.r, t.g, t.b];
    }
    return c;
  },
  fillPoints() {
    const posG = this.parts.geometry.attributes.position.array, colG = this.parts.geometry.attributes.color.array;
    const posN = this.partsN.geometry.attributes.position.array, colN = this.partsN.geometry.attributes.color.array;
    let ng = 0, nn = 0;
    for (const p of Particles.list) {
      if (p.smoke) continue;
      const a = Math.min(1, p.life / p.max * 1.5);
      const [r, g, b] = this.rgb(p.col);
      const h = p.glow ? 10 + (1 - p.life / p.max) * 14 : 4 + Math.min(10, p.life * 20);
      if (p.glow) { if (ng >= 1500) continue; posG[ng * 3] = p.x; posG[ng * 3 + 1] = h; posG[ng * 3 + 2] = p.y; colG[ng * 3] = r * a; colG[ng * 3 + 1] = g * a; colG[ng * 3 + 2] = b * a; ng++; }
      else { if (nn >= 1500) continue; posN[nn * 3] = p.x; posN[nn * 3 + 1] = h; posN[nn * 3 + 2] = p.y; colN[nn * 3] = r; colN[nn * 3 + 1] = g; colN[nn * 3 + 2] = b; nn++; }
    }
    const up = (geo, n) => { geo.setDrawRange(0, n); for (const k of ['position', 'color']) { const a = geo.attributes[k]; a.updateRange.offset = 0; a.updateRange.count = Math.max(1, n) * 3; a.needsUpdate = true; } };
    up(this.parts.geometry, ng); up(this.partsN.geometry, nn);
    const ps = this.shots.geometry.attributes.position.array, cs = this.shots.geometry.attributes.color.array;
    let n = 0;
    for (const b of Bullets.list) {
      if (n >= 398) break;
      const [r, g, bb] = this.rgb(b.hostile ? b.col : b.proj === 'bullet' ? '#fff0a0' : b.col);
      for (const k of [0, 0.5]) { ps[n * 3] = lerp(b.x, b.px, k); ps[n * 3 + 1] = b.proj === 'sword' ? 34 : 22; ps[n * 3 + 2] = lerp(b.y, b.py, k); cs[n * 3] = r; cs[n * 3 + 1] = g; cs[n * 3 + 2] = bb; n++; }
    }
    for (const o of Throws.list) { if (n >= 399) break; ps[n * 3] = o.x; ps[n * 3 + 1] = 10 + (o.z || 0); ps[n * 3 + 2] = o.y; const c = o.kind === 'acid' ? [0.5, 1, 0.2] : [1, 0.6, 0.2]; cs[n * 3] = c[0]; cs[n * 3 + 1] = c[1]; cs[n * 3 + 2] = c[2]; n++; }
    up(this.shots.geometry, n);
  },
  // world point -> screen (css px) or null when behind the camera
  project(x, h, y) {
    const v = new THREE.Vector3(x, h, y).project(this.camera);
    if (v.z > 1 || v.z < -1) return null;
    return [(v.x + 1) / 2 * VW, (1 - v.y) / 2 * VH];
  },
};
