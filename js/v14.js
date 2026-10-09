// ===== v14: interaction chooser, popup closing, wood (chop / smash / plant / shadow lumberjacks), shadow caps + names =====
var R3_OVERRIDE = null; // set while the creation screen shows a world that is not loaded yet
const R3 = () => { const k = R3_OVERRIDE || (RL ? rk(RL.id) : 'md'); return k === 'tt' || k === 'sl' ? k : 'md'; };
const WOOD_GROW_MS = 4 * 60 * 1000;
const isTree = p => !!p && p.canopy && !p.dead && !p.container && !p.kind.startsWith('sapling');
const isCrate = p => !!p && !p.dead && p.container === 'crate' && !p.drivable && !(p.kind || '').startsWith('chest');
const shName = s => s.nick || s.name;
const PLANT_RT = new WeakMap(); // plant record -> { prop, sb } (never saved)

// ---------- items ----------
ITEMS.sapling = { name: 'Cây non', icon: 'bush', kind: 'use', desc: 'Trồng xuống đất trống: sau khoảng 4 phút (kể cả lúc tắt game) thành cây để chặt gỗ. [F] hoặc bấm vào ô.' };
REALM_ITEMS.tt.sapling = { name: 'Linh Mộc Mầm', desc: 'Trồng xuống đất trống, khoảng 4 phút (kể cả lúc tắt game) sẽ lớn thành linh mộc.' };

Object.assign(G, {
  // ============ interaction: every target in reach, pick one ============
  ixAll() {
    const out = [], skip = new Set(), P = this.player;
    this._ixSkip = skip;
    try {
      for (let i = 0; i < 10; i++) {
        const it = this.findInteract(); if (!it) break;
        const o = it.ally || it.prop || it.corpse;
        out.push(it);
        if (!o || it.kind === 'exitcar') break;
        skip.add(o);
        // all trees / crates in reach count as one entry
        if (it.kind === 'chop' || it.kind === 'smash') for (const p of World.propsNear(P.x, P.y, 90)) if (it.kind === 'chop' ? isTree(p) : isCrate(p)) skip.add(p);
      }
    } finally { this._ixSkip = null; }
    for (const it of out) { const o = it.ally || it.prop || it.corpse; it._d = o ? dist(P.x, P.y, o.x, o.y) + (it.kind === 'talk' ? 28 : it.kind === 'chop' || it.kind === 'smash' ? 40 : 0) : 0; }
    out.sort((a, b) => a._d - b._d);
    return out;
  },
  ixOpenList(list) {
    const box = document.getElementById('ixList'), P = this.player;
    this.ixOpen = { list, x: P.x, y: P.y };
    box.innerHTML = '<div class="ixh">Chọn việc cần làm <button class="ixx" aria-label="Đóng">✕</button></div>' + list.map((it, i) => `<button class="ixb" data-i="${i}"><b>${i + 1}</b><span>${esc(it.label)}</span></button>`).join('');
    box.hidden = false;
    box.querySelector('.ixx').onclick = () => G.ixClose();
    box.querySelectorAll('.ixb').forEach(b => { UI.bindBtn(b); b.onclick = () => G.ixPick(+b.dataset.i); });
  },
  ixClose() { const box = document.getElementById('ixList'); if (!box || box.hidden) return false; box.hidden = true; this.ixOpen = null; return true; },
  ixPick(i) {
    const o = this.ixOpen; if (!o || !o.list[i]) return;
    const it = o.list[i]; this.ixClose();
    this._ixDirect = true; try { this.interact(it); } finally { this._ixDirect = false; }
  },

  // ============ wood ============
  woodNear() {
    const P = this.player, skip = this._ixSkip;
    let best = null, bd = 1e9, kind = '';
    for (const p of World.propsNear(P.x, P.y, 80, this._wq || (this._wq = []))) {
      if (skip && skip.has(p)) continue;
      const tree = isTree(p), crate = !tree && isCrate(p);
      if (!tree && !crate) continue;
      const c = p.circles[0], d = dist(P.x, P.y, p.x, p.y) - (c ? c.r : 12);
      if (d < (tree ? 30 : 36) && d < bd) { bd = d; best = p; kind = tree ? 'chop' : 'smash'; }
    }
    return best ? { prop: best, kind, label: kind === 'chop' ? '🪓 Chặt cây lấy gỗ' : '🔨 Phá thùng lấy gỗ', _wd: bd } : null;
  },
  chopTime() { const fx = this.pfx ? this.pfx() : { wood: 0 }; const w = this.player.equip.melee, axe = w && Loot.stats(w).mt && Loot.stats(w).mt.id === 'axe'; return 2.6 * (axe ? 0.5 : 1) * Math.max(0.35, 1 - 0.25 * fx.wood); },
  fellTree(p, by) {
    const P = this.player, fx = this.pfx ? this.pfx() : { wood: 0 };
    const dead = /dead|skull|swamp/.test(p.kind || '');
    const n = (dead ? R.int(1, 2) : R.int(3, 5)) + (by ? 0 : fx.wood);
    if (by) Items.drop(p.x, p.y, 'planks', n); else this.give('planks', n);
    if (!by && Math.random() < 0.6) this.give('sapling', 1);
    if (p._pl) { const v = this.v10; const i = v.plants.indexOf(p._pl); if (i >= 0) v.plants.splice(i, 1); PLANT_RT.delete(p._pl); }
    World.removeProp(p);
    Particles.debris(p.x, p.y, 16, '#6b4a2a'); Particles.burst(p.x, p.y, 8, '#4f8a3a', 120);
    Sound.at ? Sound.at('sfx_hit', p.x, p.y, 0.6, 0.6) : Sound.play('sfx_hit', 0.5, 0.6);
    if (by) this.plantAt(p.x, p.y);
    this.shake(2);
  },
  smashCrate(p) {
    const fx = this.pfx ? this.pfx() : { wood: 0 };
    if (!p.looted) this.lootProp(p);
    this.give('planks', R.int(1, 3) + (fx.wood ? 1 : 0));
    World.removeProp(p);
    Particles.debris(p.x, p.y, 12, '#a07a4a'); Sound.play('sfx_hit', 0.5, 0.8); this.shake(2);
  },
  plantAt(x, y) {
    const v = this.v10; if (!v) return null;
    const pool = (RL.props.trees || []).filter(t => !/dead/.test(t));
    const pl = { x, y, t0: Date.now(), img: R.pick(pool.length ? pool : RL.props.trees || ['tree_oak']) };
    v.plants.push(pl);
    return pl;
  },
  plantSapling() {
    const P = this.player, v = this.v10;
    if (World.mode !== 'over') { this.toast('Chỉ trồng được cây ở thế giới bên ngoài.', 'warn'); return; }
    const x = P.x + Math.cos(P.angle) * 34, y = P.y + Math.sin(P.angle) * 34;
    const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    if (!World.free(tx, ty, 0) || !World.isGround(World.get(tx, ty)) || v.plants.some(q => dist(q.x, q.y, x, y) < 36)) { this.toast('Chỗ này không trồng được — hãy tìm một khoảng đất trống.', 'warn'); return; }
    this.take('sapling'); this.plantAt(tx * TILE + 16, ty * TILE + 16);
    Particles.dust(x, y, 6); Sound.play('sfx_pickup', 0.5, 0.8);
    this.toast('🌱 Đã trồng cây non — khoảng 4 phút nữa sẽ thành cây.', 'good');
  },
  // keep planted trees alive in the world as superblocks stream in and out
  plantTick() {
    const P = this.player, v = this.v10; if (!v || World.mode !== 'over') return;
    const now = Date.now();
    for (const pl of v.plants) {
      if (dist(pl.x, pl.y, P.x, P.y) > 1500) continue;
      const sb = World.sbs.get(nkey(Math.floor(pl.x / SBPX), Math.floor(pl.y / SBPX)));
      let rt = PLANT_RT.get(pl);
      if (!sb) { PLANT_RT.delete(pl); continue; }
      const grown = now - pl.t0 >= WOOD_GROW_MS;
      if (rt && rt.sb === sb && !rt.prop.dead && rt.grown === grown) continue;
      if (rt && rt.sb === sb && !rt.prop.dead) World.removeProp(rt.prop);
      const prop = grown
        ? World.addProp(pl.img, pl.x, pl.y, { canopy: true, r: 9, layer: 3, rot: R.range(0, TAU) })
        : World.addProp('bush', pl.x, pl.y, { solid: false, kind: 'sapling' });
      prop._pl = pl; PLANT_RT.set(pl, { prop, sb, grown });
      if (grown) Particles.burst(pl.x, pl.y, 8, '#8fe06a', 100);
    }
  },

  // ============ shadows: slots ============
  tempCap() { const fx = this.pfx ? this.pfx() : { tempSlots: 0 }; return 4 + this.player.level + fx.tempSlots; },
});

(function () {
  // ---------- the chooser itself ----------
  const box = document.createElement('div'); box.id = 'ixList'; box.hidden = true; document.body.appendChild(box);
  const fi = G.findInteract;
  G.findInteract = function () {
    const best = fi.call(this), P = this.player;
    if (P.car) return best;
    const w = this.woodNear();
    let r = best;
    if (w) {
      const o = best && (best.ally || best.prop || best.corpse), d0 = o ? dist(P.x, P.y, o.x, o.y) - 10 : 1e9;
      if (!best || w._wd + 10 < d0) r = w;
    }
    if (r && !this._ixSkip && this.ixN > 1) r.label += `  (+${this.ixN - 1} khác)`;
    return r;
  };
  const ia = G.interact;
  G.interact = function (it) {
    if (!it || this.action) return;
    if (this._ixDirect) {
      if (it.kind === 'chop') return this.startAction({ kind: 'chop', prop: it.prop, label: 'Đang chặt cây...', dur: this.chopTime(), range: 70 });
      if (it.kind === 'smash') return this.smashCrate(it.prop);
      return ia.call(this, it);
    }
    if (this.ixOpen) { this.ixClose(); return; }
    const list = this.player.car ? [it] : this.ixAll();
    if (list.length >= 2) { this.ixOpenList(list); return; }
    this._ixDirect = true; try { return this.interact(list[0] || it); } finally { this._ixDirect = false; }
  };
  const at = G.actionTick;
  G.actionTick = function (dt) {
    const a = this.action;
    at.call(this, dt);
    if (a && a.kind === 'chop') {
      if (this.action === a) { if (this.frame % 22 === 0) { Particles.debris(a.prop.x, a.prop.y, 3, '#6b4a2a'); Sound.play('sfx_hit', 0.22, 0.6 + Math.random() * 0.2); this.shake(0.8); } }
      else if (a.t >= a.dur && !a.prop.dead) this.fellTree(a.prop, null);
    }
  };
  const ui = G.useItem;
  G.useItem = function (id) { if (id === 'sapling') { if (this.has(id)) this.plantSapling(); return; } return ui.call(this, id); };
  const tick = G.v5Tick;
  G.v5Tick = function (dt) {
    tick.call(this, dt);
    if (this.ixOpen) {
      const P = this.player;
      if (P.dead || this.state !== 'playing' || dist(P.x, P.y, this.ixOpen.x, this.ixOpen.y) > 150) this.ixClose();
    }
    if (this.frame % 8 === 0 && this.state === 'playing') { const n = this.ixAll().length; this.ixN = n; }
    if (this.frame % 40 === 0) this.plantTick();
  };
  // digits pick an entry while the list is open (and never swap weapons then)
  window.addEventListener('keydown', e => {
    if (!G.ixOpen || (e.target && e.target.tagName === 'INPUT')) return;
    const m = /^Digit([1-9])$/.exec(e.code);
    if (m) { Input.pressed[e.code] = false; G.ixPick(+m[1] - 1); }
  });

  // ---------- melee smashes crates ----------
  const ma = meleeAttack;
  meleeAttack = function (w, shove) {
    ma(w, shove);
    const P = G.player;
    for (const p of World.propsNear(P.x, P.y, (w.range || 54) + 30, G._wq2 || (G._wq2 = []))) {
      if (!isCrate(p)) continue;
      const d = dist(P.x, P.y, p.x, p.y), a = Math.atan2(p.y - P.y, p.x - P.x);
      if (d > (w.range || 54) + 18 || (Math.abs(angDiff(P.angle, a)) > (w.arc || 1.5) / 2 + 0.3 && d > 24)) continue;
      p._hp = (p._hp == null ? 3 : p._hp) - 1;
      Particles.debris(p.x, p.y, 4, '#a07a4a'); Sound.play('sfx_hit', 0.3, 1.1);
      if (p._hp <= 0) G.smashCrate(p);
    }
  };

  // ---------- shadow lumberjacks ----------
  const au = Ally.prototype.update;
  Ally.prototype.update = function (dt) {
    if (this.kind === 'shadow' && this.sid && !this.dead) {
      const s = G.shById(this.sid);
      if (s && s.mode === 'wood' && chopStep(this, dt)) return;
    }
    return au.call(this, dt);
  };

  // ---------- shadow slots: 3 saved + 1 per level; temporary summons 5 + 1 per level ----------
  G.shadowCap = function () { const fx = this.pfx ? this.pfx() : { slots: 0 }; return this.player.level + 2 + fx.slots; };
  const ec = G.extractChance;
  G.extractChance = function (c) { const fx = this.pfx ? this.pfx() : { extract: 0 }; return clamp(ec.call(this, c) + fx.extract, 0.03, 0.8); };
  const ss = G.shStats;
  G.shStats = function (s) { const r = ss.call(this, s), fx = this.pfx ? this.pfx() : { spow: 1 }; r.hp = Math.round(r.hp * fx.spow); r.dmg = Math.round(r.dmg * fx.spow); return r; };

  // ---------- names above saved shadows ----------
  const ad = Ally.prototype.draw;
  Ally.prototype.draw = function (c) {
    ad.call(this, c);
    if (this.kind !== 'shadow' || !this.sid) return;
    const s = G.shById(this.sid); if (!s) return;
    const T = SH_TIER[s.tier], txt = shName(s);
    c.font = '11px VT323, monospace'; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,0.85)';
    const y = this.y - (this.upright ? 36 : 26) - (this.hp < this.maxHp ? 4 : 0);
    c.strokeText(txt, this.x, y); c.fillStyle = s.nick ? '#ffffff' : T.col; c.fillText(txt, this.x, y);
  };
})();

// one chop step for a shadow lumberjack; false = let the normal AI (fight / loot) act
function chopStep(a, dt) {
  const P = G.player;
  if (World.mode !== 'over' || a.nearestEnemy(200)) { a.chopP = null; return false; }
  // loose drops are fetched first (the loot step handles them)
  for (const o of Items.list) if (o.age > 0.4 && dist(o.x, o.y, a.x, a.y) < 700 && (!o._by || o._by === a || o._by.dead)) { a.chopP = null; return false; }
  let p = a.chopP;
  if (!p || p.dead) {
    p = a.chopP = null; a.chopT = 0;
    a.chopScan = (a.chopScan || 0) - dt;
    if (a.chopScan > 0) return false;
    a.chopScan = 0.6;
    let bd = 1e9;
    for (const q of World.propsNear(a.x, a.y, 620, a._cq || (a._cq = []))) {
      if (!isTree(q) || dist(q.x, q.y, P.x, P.y) > 760) continue;
      if (q._by && q._by !== a && !q._by.dead) continue;
      const d = dist(q.x, q.y, a.x, a.y); if (d < bd) { bd = d; p = q; }
    }
    if (!p) return false;
    p._by = a; a.chopP = p;
  }
  const dx = p.x - a.x, dy = p.y - a.y, d = Math.hypot(dx, dy);
  a.hurtT -= dt; a.cool -= dt; a.angle = Math.atan2(dy, dx);
  if (d > 30) {
    a.vx = lerp(a.vx, dx / d * 230, Math.min(1, dt * 6)); a.vy = lerp(a.vy, dy / d * 230, Math.min(1, dt * 6));
    a.x += a.vx * dt; a.y += a.vy * dt; a.walkT += dt * Math.hypot(a.vx, a.vy) * 0.08;
    return true;
  }
  a.chopT = (a.chopT || 0) + dt; a.lunge = Math.max(a.lunge || 0, Math.sin(a.chopT * 12) > 0.6 ? 0.5 : 0);
  a.vx = a.vy = 0;
  if (Math.floor(a.chopT * 2.4) !== Math.floor((a.chopT - dt) * 2.4)) { Particles.debris(p.x, p.y, 3, '#6b4a2a'); Sound.play('sfx_hit', 0.12, 0.6 + Math.random() * 0.2); }
  if (a.chopT >= 4.2) { a.chopP = null; a.chopT = 0; if (!p.dead) G.fellTree(p, a); }
  return true;
}

// ================= popups: always a way to close them =================
(function () {
  // dialog: a ✕ whenever it can be dismissed without losing a choice
  const D = document.getElementById('dialog');
  const x = document.createElement('button'); x.id = 'dClose'; x.className = 'closex'; x.textContent = '✕'; x.setAttribute('aria-label', 'Đóng'); D.appendChild(x);
  x.onclick = e => { e.stopPropagation(); UI.dialogSkip(); };
  UI.dialogSkip = function () {
    const d = this.d; if (!d) return false;
    if (d.choices && !d.menu && d.i === d.lines.length - 1) return false;
    clearInterval(this.dT); this.typing = false; this.dialogEnd(); return true;
  };
  const ds = UI.dialogShow;
  UI.dialogShow = function () {
    ds.call(this);
    const d = this.d; x.hidden = !d || (!!d.choices && !d.menu && d.i === d.lines.length - 1) || !!d.cinematic;
  };
  // gacha reveal overlay
  const A = document.getElementById('gAnim');
  const gx = document.createElement('button'); gx.className = 'closex'; gx.textContent = '✕'; gx.setAttribute('aria-label', 'Đóng'); A.appendChild(gx);
  gx.onclick = e => { e.stopPropagation(); UI.closeTop(); };

  // Esc / ✕: close the innermost popup first; only then does Esc mean pause
  UI.closeTop = function () {
    if (G.ixClose()) return true;
    if (this.askBox && !this.askBox.hidden) { this.askClose(); return true; }
    if (this.dialogOpen) return this.dialogSkip();
    const A = document.getElementById('gAnim');
    if (A && !A.hidden) { clearTimeout(this.gTimer); this.closeGachaAnim(); return true; }
    if (G.state === 'menu' && this.mapPick) { this.mapPick = null; this.exploreSid = null; return true; }
    return false;
  };
  const key = UI.key;
  UI.key = function (code) {
    if (code === 'Escape' && this.closeTop()) return;
    return key.call(this, code);
  };

  // ---------- small text prompt (the artifact sandbox has no prompt()) ----------
  const q = document.createElement('div'); q.id = 'askBox'; q.hidden = true;
  q.innerHTML = '<div class="askp"><button class="closex" aria-label="Đóng">✕</button><h3 id="askT"></h3><input id="askIn" maxlength="14" autocomplete="off" spellcheck="false"><div class="askb"><button id="askOk">LƯU</button><button id="askNo" class="ghost">HỦY</button></div></div>';
  document.body.appendChild(q);
  UI.askBox = q;
  UI.askName = function (title, cur, cb) {
    this.askCb = cb; $('askT').textContent = title; const i = $('askIn'); i.value = cur || ''; q.hidden = false; setTimeout(() => { i.focus(); i.select(); }, 30);
  };
  UI.askClose = function () { q.hidden = true; this.askCb = null; };
  $('askOk').onclick = () => { const cb = UI.askCb, v = $('askIn').value.trim().slice(0, 14); UI.askClose(); if (cb) cb(v); };
  $('askNo').onclick = q.querySelector('.closex').onclick = () => UI.askClose();
  $('askIn').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') $('askOk').click(); if (e.key === 'Escape') UI.askClose(); });
  for (const b of q.querySelectorAll('button')) UI.bindBtn && UI.bindBtn(b);
})();
