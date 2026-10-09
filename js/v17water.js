// ===== v17 water: swimming (slow, air in deep water, weaker blows), boats, sea creatures that never leave the water =====
const WATER_T = t => t === T.WATER || t === T.DEEP;
const waterAtPx = (x, y) => World.mode === 'over' ? World.get(Math.floor(x / TILE), Math.floor(y / TILE)) : -1;
const SEA = {
  // [name, hp, dmg, speed, radius, scale, shallow ok, deep ok, weight]
  md: ['Lươn đột biến', 'Cua phình độc', 'Sứa độc phát sáng', 'Cá mập xác sống', 'Bạch tuộc khổng lồ', 'Xác chết chết đuối'],
  tt: ['Thủy xà ngọc', 'Cua linh ngọc', 'Sứa đèn ma', 'Giao long non', 'Thanh Hải Long', 'Thủy quỷ chết đuối'],
  sl: ['Lươn vực thẳm', 'Cua giáp hắc', 'Sứa neon', 'Cá mập bóng', 'Leviathan', 'Hiệp sĩ chết đuối'],
};
const SEA_DEF = [
  { hp: 55, dmg: 13, spd: 150, r: 14, sc: 0.52, sh: 1, dp: 1, w: 4, pearl: 0.5 },
  { hp: 150, dmg: 17, spd: 62, r: 18, sc: 0.6, sh: 1, dp: 0, w: 3, pearl: 0.7, armor: 0.3 },
  { hp: 70, dmg: 9, spd: 52, r: 20, sc: 0.58, sh: 0, dp: 1, w: 3, pearl: 0.6, slow: 1 },
  { hp: 190, dmg: 26, spd: 132, r: 24, sc: 0.62, sh: 0, dp: 1, w: 2, pearl: 1 },
  { hp: 1500, dmg: 42, spd: 88, r: 48, sc: 0.56, sh: 0, dp: 1, w: 0, boss: 1 },
  { hp: 120, dmg: 18, spd: 82, r: 16, sc: 0.72, sh: 1, dp: 1, w: 2, pearl: 0.8 },
];

const _ri17 = realmImages;
realmImages = function (r) { const out = _ri17(r); out.push('atlas17_' + rk(r)); return out; };
Player.prototype.swim = true;
Ally.prototype.swim = true;
ITEMS.boat = { name: 'Thuyền gỗ', icon: 'i_planks', kind: 'use', desc: 'Đặt xuống nước gần bờ rồi nhấn [E] để lên thuyền. Đi nhanh trên mặt nước, không cần thở, quái biển sẽ đánh vào thuyền.' };
REALM_ITEMS.tt.boat = { name: 'Linh Chu', desc: 'Đặt xuống nước gần bờ rồi nhấn [E] để lên thuyền. Lướt nhanh trên mặt nước, không cần thở; yêu thú biển sẽ húc vào thuyền.' };
RECIPES.push({ out: 'boat', n: 1, need: { planks: 10, scrap: 3 } });
ITEMS.tmap = { name: 'Bản đồ kho báu', icon: 'ic_4', kind: 'use', desc: 'Chỉ dẫn tới một kho báu chôn giấu. Dùng để đánh dấu vị trí; tới nơi nhấn [E] để đào.' };

Object.assign(G, {
  o2Max() { return 22 + this.attr('vit') * 0.8 + Math.max(0, (this.player.perks.belly || 0)) * 4; },
  boats() { return this.v10.boats || (this.v10.boats = []); },
  boatNear(x, y, r = 70) { let b = null, bd = r; for (const o of this.boats()) { const d = dist(o.x, o.y, x, y); if (d < bd) { bd = d; b = o; } } return b; },
  placeBoat() {
    const P = this.player;
    if (World.mode !== 'over') { this.toast('Chỉ đặt thuyền được ở thế giới bên ngoài.', 'warn'); return; }
    for (let r = 24; r <= 110; r += 14) for (let k = 0; k < 16; k++) {
      const a = P.angle + (k % 2 ? 1 : -1) * Math.floor(k / 2) * 0.4, x = P.x + Math.cos(a) * r, y = P.y + Math.sin(a) * r;
      if (!WATER_T(waterAtPx(x, y)) || !WATER_T(waterAtPx(x + 22, y)) || !WATER_T(waterAtPx(x - 22, y)) || !WATER_T(waterAtPx(x, y + 22)) || !WATER_T(waterAtPx(x, y - 22))) continue;
      this.take('boat'); const b = { id: Date.now() % 1e9, x, y, ang: a, hp: 160, max: 160 }; this.boats().push(b);
      Particles.burst(x, y, 10, '#bfe6ff', 90); Sound.play('sfx_hit', 0.4, 0.7);
      this.toast('⛵ Thuyền đã hạ thủy — đến gần và nhấn [E] để lên.', 'good'); return;
    }
    this.toast('Cần một chỗ nước đủ rộng ngay trước mặt (đứng sát bờ).', 'warn');
  },
  boardBoat(b) { const P = this.player; P.boat = b; P.aqua = true; P.x = b.x; P.y = b.y; P.dashT = 0; this.toast('⛵ Lên thuyền. Nhấn [E] gần bờ để xuống.', 'info'); },
  leaveBoat(force) {
    const P = this.player, b = P.boat; if (!b) return;
    // nearest land tile within reach
    let best = null, bd = 1e9;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const tx = Math.floor(b.x / TILE) + dx, ty = Math.floor(b.y / TILE) + dy, t = World.get(tx, ty);
      if (WATER_T(t) || World.isSolidT(t) || !World.walkable(tx, ty)) continue;
      const d = Math.hypot(dx, dy); if (d < bd) { bd = d; best = [tx * TILE + 16, ty * TILE + 16]; }
    }
    if (!best && !force) { this.toast('Chưa có bờ gần — thuyền chỉ cập được vào đất liền.', 'warn'); return; }
    P.boat = null; P.aqua = false;
    if (best) { P.x = best[0]; P.y = best[1]; }
    this.toast(best ? 'Bạn lên bờ.' : 'Bạn rơi xuống nước!', 'info');
  },
  // ---------- sea creatures ----------
  seaSpawn(kind, x, y) {
    const D = SEA_DEF[kind], lv = Math.max(1, World.levelAt(x, y) + (D.boss ? 3 : 0));
    const z = this.spawnEnemy('runner', x, y, { lvl: lv, elite: !!D.boss, state: 'wander' });
    const r = rk(RL.id), im = `${r}_sea_${kind}`;
    z.aqua = true; z.sea = kind; z.name = (SEA[r] || SEA.md)[kind]; z.img = IMG[im] ? im : z.img;
    const k = 1 + 0.14 * (lv - 1);
    z.maxHp = z.hp = D.hp * k * (D.boss ? 1 : 1); z.dmg = D.dmg * (1 + 0.06 * (lv - 1)); z.spd = D.spd * R.range(0.92, 1.08); z.r = D.r; z.scale = D.sc; z.xp = (12 + lv * 6) * (D.boss ? 12 : 1) * (kind === 3 ? 2 : 1);
    if (D.armor) z.armorB = D.armor;
    z.t = Object.assign({}, z.t, { knockRes: D.boss ? 0.8 : 0 }); z.sbk = null; z.guard = false;
    z.attackCd = 1; z.wanderT = 0;
    return z;
  },
  seaDirector() {
    const P = this.player, e = P.boat || P;
    if (World.mode !== 'over' || P.dead) return;
    // look for water around: sample a few spots
    const have = this.zombies.filter(z => z.aqua && !z.dead && dist(z.x, z.y, e.x, e.y) < 1300).length;
    const wet = WATER_T(waterAtPx(e.x, e.y));
    const cap = (wet ? 7 : 4) + Math.floor(P.level / 6);
    if (have >= cap) return;
    for (let k = 0; k < 8; k++) {
      const a = R.range(0, TAU), d = R.range(wet ? 260 : 380, wet ? 700 : 900), x = e.x + Math.cos(a) * d, y = e.y + Math.sin(a) * d;
      const t = waterAtPx(x, y); if (!WATER_T(t)) continue;
      // keep monsters out of tiny ponds: they need open water around
      if (![[30, 0], [-30, 0], [0, 30], [0, -30]].every(([dx, dy]) => WATER_T(waterAtPx(x + dx, y + dy)))) continue;
      const deep = t === T.DEEP; const pool = SEA_DEF.map((D, i) => ({ i, w: D.w * (deep ? (D.dp ? 1 : 0) : (D.sh ? 1 : 0)) })).filter(o => o.w > 0);
      if (!pool.length) continue;
      let kind, tot = pool.reduce((s, o) => s + o.w, 0), u = Math.random() * tot; for (const o of pool) { u -= o.w; if (u <= 0) { kind = o.i; break; } }
      // the sea sovereign: rare, deep water, far from shore, one at a time
      if (deep && Math.random() < 0.04 && !this.zombies.some(z => z.sea === 4 && !z.dead) && [[90, 0], [-90, 0], [0, 90], [0, -90]].every(([dx, dy]) => waterAtPx(x + dx, y + dy) === T.DEEP)) kind = 4;
      this.seaSpawn(kind, x, y); return;
    }
  },
});

function seaUpdate(z, dt) {
  if (z.dead) { z.dying += dt; return; }
  z.hitT -= dt; z.attackCd -= dt; z.thinkT -= dt; z.lunge = Math.max(0, z.lunge - dt * 4); z.slow -= dt;
  if (z.burn > 0) { z.burn -= dt; G.hitEnemy(z, (6 + z.maxHp * 0.02) * dt, 0, 0, 'fire'); }
  if (z.poison > 0) { const p = Math.min(z.poison, dt * z.poison * 0.5 + dt * 4); z.poison -= p; G.hitEnemy(z, p, 0, 0, 'poison'); }
  if (z.dead) return;
  z.kx *= Math.max(0, 1 - dt * 8); z.ky *= Math.max(0, 1 - dt * 8);
  if (z.stun > 0) { z.stun -= dt; z.move(z.kx * dt, z.ky * dt); return; }
  const P = G.player, e = P.boat || P;
  if (z.thinkT <= 0) {
    z.thinkT = 0.25 + Math.random() * 0.15;
    let best = null, bd = 1e9;
    if (!P.dead) { const d = dist(z.x, z.y, e.x, e.y); const reach = WATER_T(waterAtPx(e.x, e.y)) || P.boat ? 620 : 150; if (d < reach) { best = e; bd = d; } }
    for (const a of G.allies) { if (a.dead || a.kind === 'merchant' || a.kind === 'cast' || !WATER_T(waterAtPx(a.x, a.y))) continue; const d = dist(z.x, z.y, a.x, a.y); if (d < Math.min(bd, 420)) { bd = d; best = a; } }
    z.tgt = best; z.state = best ? 'chase' : 'wander';
  }
  let mx = 0, my = 0, speed = z.spd * (z.slow > 0 ? 0.5 : 1) * (G.timeSlow > 0 ? 0.3 : 1);
  const tgt = z.tgt;
  if (z.state === 'chase' && tgt) {
    const dx = tgt.x - z.x, dy = tgt.y - z.y, d = Math.hypot(dx, dy) || 1;
    mx = dx / d; my = dy / d;
    // weave a little so they feel alive
    const w = Math.sin(G.time * 5 + z.id) * 0.35; const cx = mx - my * w, cy = my + mx * w; mx = cx; my = cy;
    const reach = z.r * z.scale + (tgt.r || 11) + 8;
    if (d < reach && z.attackCd <= 0) {
      z.attackCd = z.sea === 4 ? 1.3 : 0.9; z.lunge = 1;
      G.hurtTarget(tgt === P.boat ? P : tgt, z.dmg, z);
      if (z.sea === 2 && tgt === (P.boat || P)) P.slowT = 2;
      FX.ring(tgt.x, tgt.y, 4, 26, 'rgba(230,245,255,0.8)', 0.3, 2); Sound.at('sfx_hit', z.x, z.y, 0.35, 0.8);
    }
    if (d < reach * 0.8) { mx *= 0.1; my *= 0.1; }
  } else {
    z.wanderT -= dt; if (z.wanderT <= 0) { z.wanderT = R.range(1.5, 4); z.wa = Math.random() < 0.3 ? null : R.range(0, TAU); }
    if (z.wa != null) { mx = Math.cos(z.wa); my = Math.sin(z.wa); speed *= 0.35; }
  }
  z.vx = lerp(z.vx, mx * speed, Math.min(1, dt * 5)); z.vy = lerp(z.vy, my * speed, Math.min(1, dt * 5));
  const before = z.x * 0 + 0; z.move((z.vx + z.kx) * dt, (z.vy + z.ky) * dt);
  // a creature that ends up on land (knockback) is pushed back to the water
  if (!WATER_T(waterAtPx(z.x, z.y))) { z.x -= z.vx * dt * 3; z.y -= z.vy * dt * 3; z.vx = z.vy = 0; if (!WATER_T(waterAtPx(z.x, z.y)) && G.frame % 60 === 0) z.hp -= z.maxHp * 0.05; }
  const sp = Math.hypot(z.vx, z.vy); z.walkT += dt * sp * 0.09;
  const face = z.state === 'chase' && tgt ? Math.atan2(tgt.y - z.y, tgt.x - z.x) : (sp > 5 ? Math.atan2(z.vy, z.vx) : z.angle);
  z.angle += angDiff(z.angle, face) * Math.min(1, dt * 7);
  if (G.frame % 20 === 0 && sp > 40) FX.ring(z.x, z.y, 3, 14 * z.scale, 'rgba(220,240,255,0.5)', 0.5, 1.5);
}

(function () {
  const eu = Enemy.prototype.update;
  Enemy.prototype.update = function (dt) { if (this.aqua) return seaUpdate(this, dt); return eu.call(this, dt); };

  // ---------- the hero in the water ----------
  const sm = Player.prototype.speedMul;
  Player.prototype.speedMul = function () {
    let m = sm.call(this);
    if (this.boat) return m * 1.75;
    if (this.slowT > 0) m *= 0.6;
    const t = World.mode === 'over' ? World.get(Math.floor(this.x / TILE), Math.floor(this.y / TILE)) : -1;
    if (t === T.DEEP) m *= 0.5; else if (t === T.WATER) m *= 0.72;
    return m;
  };
  const he = G.hitEnemy;
  G.hitEnemy = function (z, dmg, kx, ky, src, ang, wp) {
    const P = this.player;
    if (P && P.inWater && !P.boat && (src === 'gun' || src === 'melee' || src === 'skill')) dmg *= P.deep ? 0.55 : 0.85;
    if (z && z.sea != null && z.boss) dmg *= 1;
    return he.call(this, z, dmg, kx, ky, src, ang, wp);
  };
  const hp = G.hurtPlayer;
  G.hurtPlayer = function (dmg, src, silent) {
    const P = this.player;
    if (P && P.boat && !silent) {
      const b = P.boat; b.hp -= dmg * 0.8; dmg *= 0.25;
      if (b.hp <= 0) { const i = this.boats().indexOf(b); if (i >= 0) this.boats().splice(i, 1); this.leaveBoat(true); Particles.debris(b.x, b.y, 24, '#8a5a2a'); this.toast('💥 Thuyền vỡ tan!', 'warn'); }
    }
    return hp.call(this, dmg, src, silent);
  };
  // ---------- per-frame ----------
  const tk = G.v5Tick;
  G.v5Tick = function (dt) {
    tk.call(this, dt);
    const P = this.player; if (!P || P.dead || !this.v10) return;
    const over = World.mode === 'over', t = over ? World.get(Math.floor(P.x / TILE), Math.floor(P.y / TILE)) : -1;
    P.inWater = over && WATER_T(t) && !P.boat && !P.shRide; P.deep = P.inWater && t === T.DEEP;
    if (P.slowT > 0) P.slowT -= dt;
    // keep the boat under the hero
    if (P.boat) {
      const b = P.boat; b.x = P.x; b.y = P.y;
      const sp = Math.hypot(P.vx || 0, P.vy || 0); if (sp > 20) b.ang += angDiff(b.ang, Math.atan2(P.vy, P.vx)) * Math.min(1, dt * 5);
      if (!WATER_T(t) && over) this.leaveBoat(true);
      if (this.frame % 14 === 0 && sp > 40) FX.ring(b.x - Math.cos(b.ang) * 14, b.y - Math.sin(b.ang) * 14, 3, 22, 'rgba(235,248,255,0.7)', 0.6, 2);
    }
    // air
    P.o2max = this.o2Max(); if (P.o2 == null) P.o2 = P.o2max;
    if (P.deep) { P.o2 -= dt; if (P.o2 <= 0) { P.o2 = 0; this.hurtPlayer(P.maxHp * 0.07 * dt * 4, null, true); if (this.frame % 150 === 0) this.toast('🫧 Hết hơi! Hãy ngoi lên bờ hoặc vùng nước nông.', 'warn'); } }
    else P.o2 = Math.min(P.o2max, P.o2 + dt * 7);
    const bar = document.getElementById('o2bar');
    if (bar) { const show = P.deep || P.o2 < P.o2max - 0.5; bar.hidden = !show; if (show) { bar.firstElementChild.style.width = Math.round(P.o2 / P.o2max * 100) + '%'; bar.classList.toggle('low', P.o2 < 6); } }
    if (P.inWater && this.frame % 18 === 0 && Math.hypot(P.vx || 0, P.vy || 0) > 20) FX.ring(P.x, P.y + 6, 3, 18, 'rgba(235,248,255,0.7)', 0.55, 2);
    if (this.frame % 45 === 0) this.seaDirector();
    if (this.frame % 600 === 0) { const L = this.boats(); for (let i = L.length - 1; i >= 0; i--) if (dist(L[i].x, L[i].y, P.x, P.y) > 9000) L.splice(i, 1); }
  };
  // the hero looks submerged: translucent water over the body, only a head above deep water
  const pd = Player.prototype.draw;
  Player.prototype.draw = function (c) {
    pd.call(this, c);
    if (this.inWater && !this.boat) {
      c.globalAlpha = this.deep ? 0.6 : 0.4; c.fillStyle = this.deep ? '#0a2c5a' : '#2a6aa0';
      c.beginPath(); c.ellipse(this.x, this.y + 3, 17, 14, 0, 0, TAU); c.fill();
      c.globalAlpha = 0.7; c.strokeStyle = 'rgba(230,245,255,0.8)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(this.x, this.y + 4, 17 + Math.sin(G.time * 5) * 1.5, 13, 0, 0, TAU); c.stroke(); c.globalAlpha = 1;
    }
  };
  // boats are drawn under everything else that moves
  const idr = Items.draw;
  Items.draw = function (c) {
    idr.call(this, c);
    if (World.mode !== 'over' || !G.v10) return;
    const v = G.view, r = rk(RL.id);
    for (const b of G.boats()) {
      if (!v || b.x < v.x0 - 80 || b.x > v.x1 + 80 || b.y < v.y0 - 80 || b.y > v.y1 + 80) continue;
      const im = IMG[`${r}_boat`], bob = Math.sin(G.time * 2 + b.id) * 1.2;
      c.save(); c.translate(b.x, b.y + bob); c.rotate(b.ang);
      if (im) { const w = im.width / 2 * 0.9, h = im.height / 2 * 0.9; c.drawImage(im, -w / 2, -h / 2, w, h); }
      else { c.fillStyle = '#7a4a22'; c.beginPath(); c.ellipse(0, 0, 26, 12, 0, 0, TAU); c.fill(); c.fillStyle = '#a8703a'; c.beginPath(); c.ellipse(0, 0, 21, 8, 0, 0, TAU); c.fill(); }
      c.restore();
      if (b.hp < b.max) { c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(b.x - 16, b.y - 24, 32, 3); c.fillStyle = '#7ad0ff'; c.fillRect(b.x - 16, b.y - 24, 32 * Math.max(0, b.hp / b.max), 3); }
    }
  };
  // ---------- interact: board / leave / craft hint ----------
  const fi = G.findInteract;
  G.findInteract = function () {
    const P = this.player;
    if (P.boat) return { kind: 'unboat', label: '⛵ Xuống thuyền (cập bờ)', ally: null };
    const best = fi.call(this);
    if (World.mode === 'over' && this.v10) {
      const b = this.boatNear(P.x, P.y, 60);
      if (b && !(this._ixSkip && this._ixSkip.has(b))) {
        const o = best && (best.prop || best.ally || best.corpse), db = o ? dist(o.x, o.y, P.x, P.y) : 1e9;
        if (!best || dist(b.x, b.y, P.x, P.y) < db) return { kind: 'boat', boat: b, label: '⛵ Lên thuyền', prop: b };
      }
    }
    return best;
  };
  const ia = G.interact;
  G.interact = function (it) {
    if (it && it.kind === 'unboat') return this.leaveBoat(false);
    if (it && it.kind === 'boat') return this.boardBoat(it.boat);
    return ia.call(this, it);
  };
  const ui = G.useItem;
  G.useItem = function (id) { if (id === 'boat') { if (this.has(id)) this.placeBoat(); return; } return ui.call(this, id); };
  // dashing off a boat is not allowed; guns are fine
  const nt = G.newGame;
  G.newGame = function () { const r = nt.apply(this, arguments); if (this.player) { this.player.boat = null; this.player.aqua = false; this.player.o2 = null; } return r; };
  // drops: pearls, a chance of a treasure map from the big ones
  const ke = G.killEnemy;
  G.killEnemy = function (z, src) {
    ke.call(this, z, src);
    if (z.sea == null) return;
    const D = SEA_DEF[z.sea]; if (Math.random() < (D.pearl || 0.4)) Items.drop(z.x, z.y, 'gold', R.int(6, 18) * (D.boss ? 8 : 1) * (1 + z.lvl * 0.1));
    if (D.boss) { for (let i = 0; i < 3; i++) Items.dropGear(z.x + R.range(-30, 30), z.y + R.range(-30, 30), Loot.randomGear(z.lvl, 2.2)); Items.drop(z.x, z.y, 'tmap', 1); this.toast(`${z.name} đã chìm xuống đáy biển!`, 'quest'); }
    else if (Math.random() < 0.04) Items.drop(z.x, z.y, 'tmap', 1);
    if (Math.random() < 0.12) Items.drop(z.x, z.y, 'planks', R.int(1, 3));
  };
  // oxygen bar in the HUD
  window.addEventListener('load', () => {
    document.body.insertAdjacentHTML('beforeend', '<div id="o2bar" hidden><i></i><span>🫧 Hơi thở</span></div>');
  });
})();
