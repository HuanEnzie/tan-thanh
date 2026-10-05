// ===== Full 3D model mode for R3D (instanced rigs, model props, sky, 3D effects, viewmodel) =====
Object.assign(R3D, {
  rigs: {},
  initModels() {
    if (this.vcMat) return;
    this.vcMat = new THREE.MeshLambertMaterial({ vertexColors: true });      // plain meshes
    this.vcInstMat = new THREE.MeshLambertMaterial({ vertexColors: true });  // instanced props (no per-instance colour)
    this.rigMat = new THREE.MeshLambertMaterial({ vertexColors: true });     // instanced rigs (per-instance colour)
    this.glowMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    // sky
    const sg = new THREE.SphereGeometry(1600, 18, 12);
    sg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(sg.attributes.position.count * 3), 3));
    this.sky = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
    this.sky.renderOrder = -10;
    this.scene.add(this.sky);
    const sp = new Float32Array(400 * 3);
    for (let i = 0; i < 400; i++) { const a = Math.random() * TAU, b = Math.random() * 1.2 + 0.15; sp[i * 3] = Math.cos(a) * Math.cos(b) * 1500; sp[i * 3 + 1] = Math.sin(b) * 1500; sp[i * 3 + 2] = Math.sin(a) * Math.cos(b) * 1500; }
    const stg = new THREE.BufferGeometry(); stg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.stars = new THREE.Points(stg, new THREE.PointsMaterial({ color: 0xffffff, size: 3, sizeAttenuation: false, transparent: true, fog: false, depthWrite: false }));
    this.scene.add(this.stars);
    this.sunDisc = new THREE.Mesh(new THREE.CircleGeometry(70, 20), new THREE.MeshBasicMaterial({ color: 0xfff2c0, fog: false, transparent: true, depthWrite: false }));
    this.scene.add(this.sunDisc);
    // effects
    this.fxPool = [];
    this.ringGeo = new THREE.RingGeometry(0.86, 1, 40);
    this.arcGeo = new THREE.RingGeometry(0.6, 1, 18, 1, -0.85, 1.7);
    this.pillarGeo = new THREE.CylinderGeometry(1, 1, 1, 12, 1, true);
    this.sphGeo = new THREE.IcosahedronGeometry(1, 1);
    const bm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    this.bulletMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), bm, 400);
    this.bulletMesh.frustumCulled = false; this.bulletMesh.count = 0;
    for (let i = 0; i < 400; i++) this.bulletMesh.setColorAt(i, new THREE.Color(1, 1, 1));
    this.scene.add(this.bulletMesh);
    this.blobMesh = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 12), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false }), 260);
    this.blobMesh.frustumCulled = false; this.blobMesh.count = 0; this.scene.add(this.blobMesh);
    this.boltLines = [];
    // first-person weapons
    this.vm = new THREE.Group();
    this.camera.add(this.vm);
    if (!this.camera.parent) this.scene.add(this.camera);
    this.vmRealm = null;
  },
  modelsActive() { return G.gfx === '3d'; },
  setModelsVisible(on) {
    if (!this.vcMat) return;
    this.sky.visible = this.stars.visible = this.sunDisc.visible = on;
    this.bulletMesh.visible = this.blobMesh.visible = on;
    this.vm.visible = on;
    for (const k in this.rigs) for (const m of this.rigs[k].meshes) m.visible = on;
    this.parts.visible = this.partsN.visible = true;
    this.shots.visible = !on;
  },
  resetModels() {
    for (const k in this.rigs) { for (const m of this.rigs[k].meshes) { this.scene.remove(m); m.geometry.dispose(); } }
    this.rigs = {};
    if (this.vm) { while (this.vm.children.length) this.vm.remove(this.vm.children[0]); this.vmRealm = null; }
  },

  // ---------- instanced rigs ----------
  specFor(e) {
    const C = CHAR[RL.id];
    if (e === G.player) return [RL.id + '_hero', C.hero, true];
    if (e instanceof Enemy) {
      if (e.img === 'z_hazmat') return ['md_hazmat', CHAR.extra.hazmat];
      if (e.img === 'z_nurse') return ['md_nurse', CHAR.extra.nurse];
      const i = Math.max(0, RL.enemies.indexOf(e.img));
      return [RL.id + '_e' + i, C.e[i]];
    }
    if (e.kind === 'shadow') { const i = Math.max(0, RL.enemies.indexOf(e.img)); return [RL.id + '_e' + i, C.e[i]]; }
    const i = Math.max(0, RL.npc.indexOf(e.img));
    return [RL.id + '_n' + i, C.npc[i]];
  },
  rigOf(key, spec, hero) {
    let R = this.rigs[key];
    if (!R) {
      const rig = buildRig(spec, RL.id, hero);
      const cap = hero ? 2 : 90;
      const meshes = rig.parts.map(p => {
        const m = new THREE.InstancedMesh(p.geo, this.rigMat, cap);
        m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        for (let i = 0; i < cap; i++) m.setColorAt(i, new THREE.Color(1, 1, 1));
        m.count = 0; m.frustumCulled = false; this.scene.add(m); return m;
      });
      R = this.rigs[key] = { rig, meshes, n: 0, cap };
    }
    return R;
  },
  drawRig(e, opts, col) {
    const [key, spec, hero] = this.specFor(e);
    if (!spec) return;
    const R = this.rigOf(key, spec, hero);
    if (R.n >= R.cap) return;
    poseRig(R.rig, e, opts);
    if (hero) for (const p of R.rig.parts) if (p.tag) { const on = p.tag === opts.slot; p.holder.scale.setScalar(on ? 1 : 0.0001); }
    if (!hero) R.rig.root.scale.setScalar((spec.scale || 1) * (e.scale || 1));
    R.rig.root.updateMatrixWorld(true);
    const c = this._col || (this._col = new THREE.Color());
    c.setRGB(col[0], col[1], col[2]);
    for (let j = 0; j < R.meshes.length; j++) { R.meshes[j].setMatrixAt(R.n, R.rig.parts[j].holder.matrixWorld); R.meshes[j].setColorAt(R.n, c); }
    R.n++;
    // blob shadow
    if (this.blobN < 260 && !e.dead) {
      const r = (e.r || 11) * (e.scale || 1) * 1.15;
      this.dummy.position.set(e.x, 0.6, e.y); this.dummy.rotation.set(-Math.PI / 2, 0, 0); this.dummy.scale.set(r, r, 1); this.dummy.updateMatrix();
      this.blobMesh.setMatrixAt(this.blobN++, this.dummy.matrix);
    }
  },
  renderRigs(tgt, fp) {
    for (const k in this.rigs) this.rigs[k].n = 0;
    this.blobN = 0;
    const P = G.player;
    for (const z of G.zombies) {
      if (dist(z.x, z.y, tgt.x, tgt.y) > 900) continue;
      const col = z.hitT > 0 ? [2.6, 2.6, 2.6] : z.bossState === 'windup' ? [2.4, 0.6, 0.6] : z.slow > 0 ? [0.7, 0.9, 1.6] : z.burn > 0 ? [1.6, 0.9, 0.6] : z.poison > 1 ? [0.8, 1.4, 0.7] : z.elite ? [1.35, 1.15, 0.6] : [1, 1, 1];
      this.drawRig(z, { moving: Math.min(1, Math.hypot(z.vx, z.vy) / 40 + 0.15), angle: z.angle }, col);
    }
    for (const a of G.allies) {
      const col = a.kind === 'shadow' ? [0.3, 0.25, 0.75] : a.hurtT > 0 ? [2, 0.8, 0.8] : [1, 1, 1];
      if (a.kind === 'civ' && a.fade < 1) col[0] = col[1] = col[2] = a.fade;
      this.drawRig(a, { moving: Math.min(1, Math.hypot(a.vx, a.vy) / 60 + 0.1), angle: a.angle, aim: a.kind === 'comp' && a.cool > 0.2, downed: a.downed, cower: a.kind === 'civ' && !a.rescued }, col);
    }
    if (!fp && !P.car && !P.dead) {
      const w = P.wdef, slot = P.equip[P.weapon] ? P.weapon : 'none';
      let swing = null;
      if (w.melee) { const k = P.swingT > 0 ? 1 - P.swingT / 0.2 : 1; swing = P.swingT > 0 ? Math.PI * 0.9 - k * 1.9 * (P.swingDir > 0 ? 1 : 0.8) : 1.1; }
      if (P.spin > 0) swing = Math.PI / 2;
      this.drawRig(P, { moving: Math.min(1, Math.hypot(P.vx, P.vy) / 60), angle: P.spin > 0 ? G.time * 20 : P.angle, aim: true, swing, recoil: P.recoil, twoHand: P.weapon === 'r2' || P.weapon === 'r3', reload: P.reloading > 0, slot }, P.hurtT > 0.15 ? [2.2, 0.7, 0.7] : P.dashT > 0 ? [1.6, 1.6, 2] : [1, 1, 1]);
    }
    for (const k in this.rigs) {
      const R = this.rigs[k];
      for (const m of R.meshes) {
        m.count = R.n;
        if (!R.n && !R.was) continue;
        m.instanceMatrix.updateRange.offset = 0; m.instanceMatrix.updateRange.count = Math.max(1, R.n) * 16; m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) { m.instanceColor.updateRange.offset = 0; m.instanceColor.updateRange.count = Math.max(1, R.n) * 3; m.instanceColor.needsUpdate = true; }
      }
      R.was = R.n;
    }
    this.blobMesh.count = this.blobN; this.blobMesh.instanceMatrix.updateRange.count = Math.max(1, this.blobN) * 16; this.blobMesh.instanceMatrix.needsUpdate = true;
  },

  // ---------- model props ----------
  buildPropModels(rec, list, img, type) {
    const p0 = list[0];
    let geo = null;
    if (type === 'tree') geo = treeModel(img, p0.w, this.avgColor(img));
    else geo = propModel(img, p0.w, p0.h, this.avgColor(img));
    if (!geo) return false;
    const m = new THREE.InstancedMesh(geo, this.vcInstMat, list.length);
    list.forEach((p, i) => {
      this.dummy.position.set(p.x, 0, p.y); this.dummy.rotation.set(0, -p.rot, 0); this.dummy.scale.set(1, type === 'tree' ? 0.85 + hash2(Math.round(p.x), Math.round(p.y)) * 0.35 : 1, 1); this.dummy.updateMatrix();
      m.setMatrixAt(i, this.dummy.matrix); p.inst3d = { meshes: [m], i };
    });
    rec.group.add(m);
    return true;
  },
  wallHeight(sb, gx, gy) {
    if (World.mode === 'dungeon') return 72;
    const bi = sb.bld[(gy - sb.ty0) * SB + (gx - sb.tx0)];
    if (bi < 0) return 46;
    const b = sb.buildings[bi];
    return b.type === 'house' || b.type === 'shed' ? 52 : b.type === 'palace' ? 70 : b.type === 'office' || b.type === 'apartment' ? (RL.style === 'cyber' ? 120 : 92) : 72;
  },
  roofModel(b, H) {
    const w = (b.x1 - b.x0 + 1) * TILE, h = (b.y1 - b.y0 + 1) * TILE;
    const col = this.avgColor(b.roof);
    const pitched = b.type === 'house' || RL.style === 'ancient' || RL.style === 'sect' || b.type === 'palace';
    const g = GB.start();
    if (pitched) {
      const along = w >= h, L = (along ? w : h) + 12, S = (along ? h : w) + 12;
      const pitch = RL.style === 'ancient' || RL.style === 'sect' ? 0.6 : 0.5;
      const half = S / 2, len = half / Math.cos(pitch), rise = Math.tan(pitch) * half;
      const c1 = shade(col, 1.05), c2 = shade(col, 0.82);
      if (along) { g.box(L, 3, len, c1, 0, rise / 2, -half / 2, pitch, 0, 0); g.box(L, 3, len, c2, 0, rise / 2, half / 2, -pitch, 0, 0); g.box(L + 4, 4, 4, shade(col, 0.6), 0, rise + 1, 0); }
      else { g.box(len, 3, L, c1, -half / 2, rise / 2, 0, 0, 0, -pitch); g.box(len, 3, L, c2, half / 2, rise / 2, 0, 0, 0, pitch); g.box(4, 4, L + 4, shade(col, 0.6), 0, rise + 1, 0); }
      if (RL.style === 'ancient' || RL.style === 'sect') for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.cone(2.6, 10, 4, shade(col, 0.7), sx * (w / 2 + 6), 4, sz * (h / 2 + 6), sz * 0.6, 0, -sx * 0.6);
      // gable walls
      const wc = 0x8a7a6a;
      if (along) for (const sx of [-1, 1]) g.box(2, rise * 0.9, S - 12, wc, sx * (w / 2 - 1), rise * 0.4, 0);
      else for (const sz of [-1, 1]) g.box(S - 12, rise * 0.9, 2, wc, 0, rise * 0.4, sz * (h / 2 - 1));
    } else {
      g.box(w + 4, 3, h + 4, col, 0, 1.5, 0);
      g.box(w + 6, 6, 3, shade(col, 0.7), 0, 4, -h / 2 - 1).box(w + 6, 6, 3, shade(col, 0.7), 0, 4, h / 2 + 1).box(3, 6, h + 6, shade(col, 0.7), -w / 2 - 1, 4, 0).box(3, 6, h + 6, shade(col, 0.7), w / 2 + 1, 4, 0);
      const rnd = mulberry32(b.seed), n = Math.floor(w * h / 12000) + 1;
      for (let i = 0; i < n; i++) {
        const x = (rnd() - 0.5) * (w - 40), z = (rnd() - 0.5) * (h - 40);
        if (rnd() < 0.6) g.box(20, 12, 14, RL.id === 'cy' ? 0x3a3f55 : 0x8d9196, x, 9, z).box(16, 1, 10, RL.id === 'cy' ? 0x3cf0ff : 0x5d6166, x, 15.5, z);
        else g.cyl(5, 5, 10, 8, 0x5a5d62, x, 8, z);
      }
      if (RL.id === 'cy') g.box(w * 0.6, 14, 2, rnd() < 0.5 ? 0xff4fd8 : 0x3cf0ff, 0, 14, -h / 2 + 2);
    }
    const m = new THREE.Mesh(GB.done(), this.vcMat);
    m.position.set(b.x0 * TILE + w / 2, H, b.y0 * TILE + h / 2);
    return m;
  },

  // ---------- sky & atmosphere ----------
  updateSky(cam, dark) {
    const h = G.clock;
    const dun = World.mode === 'dungeon';
    this.sky.visible = !dun; this.stars.visible = !dun; this.sunDisc.visible = !dun;
    if (dun) return;
    this.sky.position.copy(cam.position); this.stars.position.copy(cam.position);
    const t = RL.nightTint;
    const top = new THREE.Color().setRGB(lerp(0.32, t[0] / 255 + 0.02, dark), lerp(0.55, t[1] / 255 + 0.02, dark), lerp(0.9, t[2] / 255 + 0.06, dark));
    let hor = new THREE.Color().setRGB(lerp(0.78, 0.06 + t[0] / 255, dark), lerp(0.85, 0.06 + t[1] / 255, dark), lerp(0.95, 0.1 + t[2] / 255, dark));
    const dusk = (h > 16.5 && h < 20.5) ? Math.sin((h - 16.5) / 4 * Math.PI) : (h > 4.5 && h < 7.5) ? Math.sin((h - 4.5) / 3 * Math.PI) * 0.8 : 0;
    if (dusk > 0) hor.lerp(new THREE.Color(0xff7a3a), dusk * 0.7);
    if (RL.id === 'cy') { top.lerp(new THREE.Color(0x2a0a40), 0.4); hor.lerp(new THREE.Color(0x6a1a6a), 0.25 + dark * 0.2); }
    if (G.raining) { top.lerp(new THREE.Color(0x4a5058), 0.5); hor.lerp(new THREE.Color(0x5a6068), 0.5); }
    const pos = this.sky.geometry.attributes.position, col = this.sky.geometry.attributes.color;
    this.scene.fog.color.copy(hor); this.renderer.setClearColor(hor);
    if ((this.skyT = (this.skyT || 0) + 1) % 20 === 1) {
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i) / 1600; const k = clamp(y * 1.6, 0, 1); col.setXYZ(i, lerp(hor.r, top.r, k), lerp(hor.g, top.g, k), lerp(hor.b, top.b, k)); }
    col.needsUpdate = true;
    }
    this.stars.material.opacity = clamp((dark - 0.4) * 1.6, 0, 0.9) * (G.raining ? 0.2 : 1);
    // sun / moon arc
    const ang = (h / 24) * TAU - Math.PI / 2;
    const night = dark > 0.5;
    const dir = new THREE.Vector3(Math.cos(ang) * 0.6, Math.abs(Math.sin(ang)) * 0.8 + 0.25, -0.5).normalize();
    this.sunDisc.position.copy(cam.position).addScaledVector(dir, 1400);
    this.sunDisc.lookAt(cam.position);
    this.sunDisc.material.color.setHex(night ? (RL.id === 'ct' ? 0xff5040 : 0xe8f0ff) : 0xfff2c0);
    this.sunDisc.scale.setScalar(night ? 0.6 : 1);
    this.sunDisc.material.opacity = G.raining ? 0.2 : 1;
    this.scene.fog.color.copy(hor);
    this.renderer.setClearColor(hor);
    return hor;
  },

  // ---------- effects ----------
  fxMesh(geo, color) {
    let m = this.fxPool.find(f => !f.visible && f.geometry === geo);
    if (!m) { m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); this.fxPool.push(m); this.scene.add(m); }
    m.material.color.set(color); m.visible = true;
    return m;
  },
  renderFx() {
    for (const m of this.fxPool) m.visible = false;
    for (const f of FX.list) {
      const k = 1 - f.life / f.dur;
      const col = (f.col || '#fff').startsWith('rgba') ? f.col.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, 'rgb($1,$2,$3)') : f.col;
      if (f.t === 'slash') {
        const m = this.fxMesh(this.arcGeo, col);
        m.position.set(f.x, 22, f.y); m.rotation.set(-Math.PI / 2, 0, -f.ang); m.scale.set(f.range, f.range * (f.arc / 1.7), 1);
        m.material.opacity = (1 - k) * 0.9;
      } else if (f.t === 'ring') {
        const m = this.fxMesh(this.ringGeo, col);
        const r = lerp(f.r0, f.r1, 1 - (1 - k) * (1 - k));
        m.position.set(f.x, 2, f.y); m.rotation.set(-Math.PI / 2, 0, 0); m.scale.set(r, r, 1); m.material.opacity = 1 - k;
      } else if (f.t === 'pillar') {
        const m = this.fxMesh(this.pillarGeo, col);
        m.position.set(f.x, 130, f.y); m.scale.set(f.w * 0.5, 260, f.w * 0.5); m.material.opacity = Math.sin(k * Math.PI) * 0.6;
      }
    }
    for (const f of G.flashes) {
      const m = this.fxMesh(this.sphGeo, '#ffb050');
      const k = 1 - f.life / f.max;
      m.position.set(f.x, 16, f.y); m.scale.setScalar(f.r * 0.25 * (0.4 + k)); m.material.opacity = (1 - k) * 0.8;
    }
    for (const f of Throws.fires) { const m = this.fxMesh(this.sphGeo, '#ff7a20'); m.position.set(f.x, 4, f.y); m.scale.set(f.r * 0.9, 8 + Math.random() * 6, f.r * 0.9); m.material.opacity = 0.25 * Math.min(1, f.life); }
    for (const it of Items.list) if (it.gear && it.gear.rarity >= 2) { const m = this.fxMesh(this.pillarGeo, RARITY[it.gear.rarity].color); m.position.set(it.x, 50, it.y); m.scale.set(3, 100, 3); m.material.opacity = 0.35 + Math.sin(it.t * 3) * 0.12; }
    // bolts
    let bi = 0;
    for (const f of FX.list) if (f.t === 'bolt') {
      let l = this.boltLines[bi];
      if (!l) { l = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xfff36b, transparent: true })); this.boltLines.push(l); this.scene.add(l); }
      const arr = new Float32Array(f.pts.length * 3);
      f.pts.forEach(([x, y], i) => { arr[i * 3] = x; arr[i * 3 + 1] = 24 + (i % 2) * 6; arr[i * 3 + 2] = y; });
      l.geometry.setAttribute('position', new THREE.BufferAttribute(arr, 3)); l.geometry.attributes.position.needsUpdate = true;
      l.material.opacity = f.life / f.dur; l.visible = true; bi++;
    }
    for (let i = bi; i < this.boltLines.length; i++) this.boltLines[i].visible = false;
    // bullets as glowing streaks
    let n = 0;
    const c = this._bc || (this._bc = new THREE.Color());
    for (const b of Bullets.list) {
      if (n >= 400) break;
      const a = Math.atan2(b.vy, b.vx);
      const big = b.proj === 'orb' || b.proj === 'eshot' || b.proj === 'talisman';
      const len = b.proj === 'wave' ? 8 : b.proj === 'sword' ? 30 : big ? 7 * b.size : 22;
      this.dummy.position.set(b.x, b.proj === 'sword' ? 30 : 24, b.y); this.dummy.rotation.set(0, -a, 0);
      this.dummy.scale.set(len, big ? 7 * b.size : b.proj === 'wave' ? 6 : 2, b.proj === 'wave' ? 46 * b.size : big ? 7 * b.size : 2); this.dummy.updateMatrix();
      this.bulletMesh.setMatrixAt(n, this.dummy.matrix);
      c.set(b.hostile ? b.col : b.proj === 'bullet' ? '#ffe9a0' : b.col); this.bulletMesh.setColorAt(n, c);
      n++;
    }
    for (const o of Throws.list) {
      if (n >= 400) break;
      this.dummy.position.set(o.x, 10 + (o.z || 0), o.y); this.dummy.rotation.set(o.spin, o.spin, 0); this.dummy.scale.set(5, 5, 5); this.dummy.updateMatrix();
      this.bulletMesh.setMatrixAt(n, this.dummy.matrix); c.set(o.kind === 'acid' ? (o.col || '#9be22d') : o.kind === 'grenade' ? '#5a7a3a' : '#ff8a30'); this.bulletMesh.setColorAt(n, c); n++;
    }
    this.bulletMesh.count = n;
    if (n || this._bn) { this.bulletMesh.instanceMatrix.updateRange.count = Math.max(1, n) * 16; this.bulletMesh.instanceMatrix.needsUpdate = true; if (this.bulletMesh.instanceColor) { this.bulletMesh.instanceColor.updateRange.count = Math.max(1, n) * 3; this.bulletMesh.instanceColor.needsUpdate = true; } }
    this._bn = n;
  },

  // ---------- first-person 3D weapon ----------
  updateViewModel(fp) {
    const P = G.player;
    if (this.vmRealm !== RL.id) {
      while (this.vm.children.length) this.vm.remove(this.vm.children[0]);
      this.vmGuns = {};
      const W = REALM_WEAPONS[RL.id];
      for (const slot of SLOT_ORDER) {
        GB.start(); buildWeapon(GB, W[slot][0], W[slot][1]);
        GB.box(5, 5, 5, CHAR[RL.id].hero.skin, -1, -2, 0); // hand
        const m = new THREE.Mesh(GB.done(), this.vcMat);
        m.visible = false; this.vm.add(m); this.vmGuns[slot] = m;
      }
      this.vmRealm = RL.id;
    }
    const show = fp && !P.car && !P.dead;
    for (const s in this.vmGuns) this.vmGuns[s].visible = show && s === P.weapon && !!P.equip[s];
    if (!show) return;
    const g = this.vmGuns[P.weapon]; if (!g) return;
    const sp = Math.min(1, Math.hypot(P.vx, P.vy) / 120);
    const bx = Math.sin(P.walkT * 0.65) * 1.6 * sp, by = Math.abs(Math.cos(P.walkT * 0.65)) * 1.2 * sp;
    const melee = P.wdef.melee;
    // camera space: +x right, +y up, -z forward. Weapon model points along +X -> rotate to -Z.
    g.position.set(9 + bx, -9 - by + (P.reloading > 0 ? -6 : 0), -16 + P.recoil * 3);
    g.rotation.set(0, Math.PI / 2 + 0.08, 0.05);
    g.scale.setScalar(0.55);
    if (melee) {
      const k = P.swingT > 0 ? 1 - P.swingT / 0.2 : 0;
      g.rotation.set(0.3, Math.PI / 2 + 0.25 - Math.sin(k * Math.PI) * 1.3 * P.swingDir, 0.6 - Math.sin(k * Math.PI) * 0.9);
      g.position.x = 8 + bx - Math.sin(k * Math.PI) * 6;
      if (P.spin > 0) g.rotation.y = G.time * 18;
    }
  },
  groundPoint(sx, sy) {
    const v = new THREE.Vector3((sx / VW) * 2 - 1, -(sy / VH) * 2 + 1, 0.5).unproject(this.camera);
    const dir = v.sub(this.camera.position).normalize();
    if (Math.abs(dir.y) < 1e-4) return null;
    const t = (14 - this.camera.position.y) / dir.y;
    if (t < 0) return null;
    return { x: this.camera.position.x + dir.x * t, y: this.camera.position.z + dir.z * t };
  },
});
CHAR.extra = {
  hazmat: HU({ skin: 0x8a9a78, shirt: 0xd8c030, pants: 0xd8c030, hat: 'visor', hatC: 0x2a2a2a, hairStyle: 'bald', posture: 'zombie', blood: true }),
  nurse: HU({ skin: 0x9aa890, shirt: 0xa8d8c0, pants: 0xa8d8c0, hair: 0x5a3a20, hairStyle: 'pony', posture: 'zombie', blood: true }),
};
