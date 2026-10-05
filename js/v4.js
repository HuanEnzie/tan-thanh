// ===== v4: gacha, pets, wonders, world events (treasure goblin, mimics, meteor shower, blood moon), explorer's journal =====

// ---------- state helpers ----------
Object.assign(G, {
  pets: {}, activePet: null, pity5: 0, pity4: 0, codex: null, bloodMoon: false, meteorT: 0, goblinT: 120,
  initV4(d) {
    d = d || {};
    this.pets = d.pets || {}; this.activePet = d.activePet ?? null;
    this.pity5 = d.pity5 || 0; this.pity4 = d.pity4 || 0;
    this.codex = d.codex || { biomes: {}, wonders: {}, bosses: {}, sites: {} };
    this.bloodMoon = false; this.meteorT = 0; this.meteors = []; this.goblinT = R.range(90, 160);
    this.petE = null; this.applyPet();
    World.keep = (d.keep || []).map(e => Object.assign({}, e)); this.pendingChests = d.pending || [];
  },
  v4Save() { return { pets: this.pets, activePet: this.activePet, pity5: this.pity5, pity4: this.pity4, codex: this.codex, keep: World.keep.map(e => ({ x: e.x, y: e.y, tier: e.tier, bonus: e.bonus })), pending: this.pendingChests || [] }; },
  tickets() { return this.player.inv.ticket || 0; },
  giveTickets(n, why) {
    this.player.inv.ticket = (this.player.inv.ticket || 0) + n;
    const T = TICKET[rk(RL.id)];
    Floaters.add(this.player.x, this.player.y - 34, `+${n} ${T.name}`, '#ffd65a', 11, true);
    if (why) this.toast(`🎴 +${n} ${T.name} — ${why}`, 'quest');
    Sound.play('sfx_coin', 0.5, 0.8);
    UI.dirty = true;
  },
  goldMul() { return (this.activePet === 2 ? 1.3 + (this.pets[2] || 1) * 0.04 : 1) * (this.bloodMoon ? 2 : 1); },

  // ---------- pets ----------
  applyPet() {
    const P = this.player; if (!P) return;
    const i = this.activePet, s = i != null ? (this.pets[i] || 1) : 0;
    P.pab = {};
    if (i === 2) P.pab.luck = 15 + s * 4;
    if (i === 7) { P.pab.crit = 0.1 + s * 0.01; P.pab.energy = 20 + s * 6; }
    this.magnetMul = i === 2 ? 2.4 : 1;
    if (i == null) this.petE = null;
    else if (!this.petE || this.petE.i !== i) this.petE = { i, x: P.x - 30, y: P.y + 20, cd: 1, t: 0, fx: 0 };
  },
  petTick(dt) {
    const e = this.petE, P = this.player; if (!e || P.dead) return;
    const s = this.pets[e.i] || 1, pow = (1 + P.level * 0.08) * (1 + (s - 1) * 0.25);
    e.t += dt; e.cd -= dt; e.fx = Math.max(0, e.fx - dt);
    const lead = P.car || P;
    const tx = lead.x - Math.cos(P.angle) * 34 + Math.sin(e.t * 1.3) * 10, ty = lead.y - Math.sin(P.angle) * 34 - 14 + Math.cos(e.t * 1.7) * 6;
    e.x = lerp(e.x, tx, Math.min(1, dt * 4)); e.y = lerp(e.y, ty, Math.min(1, dt * 4));
    const near = r => { let b = null, bd = r; for (const z of this.zgrid.query(e.x, e.y, r)) { if (z.dead || z.rise > 0) continue; const d = dist(e.x, e.y, z.x, z.y); if (d < bd) { bd = d; b = z; } } return b; };
    switch (e.i) {
      case 0: { const z = near(330); if (z && e.cd <= 0) { e.cd = 1.15 - s * 0.08; e.fx = 0.2; const a = Math.atan2(z.y - e.y, z.x - e.x); Bullets.fire(e.x, e.y, a, { speed: 520, knock: 40, affixes: ['fire'], homing: true }, 14 * pow, { ally: true, proj: 'orb', col: '#ff8a2a', life: 1.2, speed: 520, src: 'ally', homing: true }); Sound.at('sfx_fire', e.x, e.y, 0.25, 1.4); } break; }
      case 1: { const z = near(170); if (z && e.cd <= 0) { e.cd = 4 - s * 0.3; e.fx = 0.6; const a = Math.atan2(z.y - e.y, z.x - e.x); FX.slash(e.x, e.y, a, 170, 0.9, '#bfefff', 0.35, 1); Particles.ice(e.x + Math.cos(a) * 60, e.y + Math.sin(a) * 60, 16); Sound.at('sfx_freeze', e.x, e.y, 0.45); for (const o of this.zgrid.query(e.x, e.y, 180)) { if (o.dead) continue; const d = dist(e.x, e.y, o.x, o.y), aa = Math.atan2(o.y - e.y, o.x - e.x); if (d < 175 && Math.abs(angDiff(a, aa)) < 0.5) { this.hitEnemy(o, 35 * pow, Math.cos(aa) * 80, Math.sin(aa) * 80, 'ally', aa); o.slow = 3; if (!o.boss && Math.random() < 0.3) o.stun = 1.2; } } } break; }
      case 2: { if (e.cd <= 0) { e.cd = 14; if (World.mode === 'over') { Items.drop(e.x, e.y, 'gold', R.int(2, 6) * s); e.fx = 0.4; } } break; }
      case 3: { if (e.cd <= 0) { e.cd = 3.2; if (P.hp < P.maxHp) { const h = P.maxHp * (0.025 + s * 0.006); P.hp = Math.min(P.maxHp, P.hp + h); e.fx = 0.5; Floaters.add(P.x, P.y - 24, '+' + Math.round(h), '#ff9ad8', 9); } if (P.burnT) P.burnT = 0; } break; }
      case 4: { if (e.cd <= 0 && near(380)) { e.cd = 2.6 - s * 0.15; e.fx = 0.3; let from = e, hit = 0; const done = new Set(); for (let k = 0; k < 2 + Math.ceil(s / 2); k++) { let b = null, bd = 380; for (const z of this.zgrid.query(from.x, from.y, 380)) { if (z.dead || done.has(z)) continue; const d = dist(from.x, from.y, z.x, z.y); if (d < bd) { bd = d; b = z; } } if (!b) break; FX.bolt(from.x, from.y, b.x, b.y, '#fff36b'); done.add(b); this.hitEnemy(b, 28 * pow, 0, 0, 'ally'); from = b; hit++; } if (hit) Sound.at('sfx_electric', e.x, e.y, 0.35); } break; }
      case 5: { if (e.cd <= 0) { e.cd = 9 - s * 0.5; const sh = 25 + P.level * 2 + s * 10; P.shield = Math.max(P.shield || 0, sh); P.shieldT = 0; e.fx = 0.6; FX.ring(P.x, P.y, 6, 34, '#9fd18a', 0.4, 4); } break; }
      case 6: { if (G.frame % 10 === 0) for (const z of this.zgrid.query(P.x, P.y, 130 + s * 10)) if (!z.dead && dist(z.x, z.y, P.x, P.y) < 130 + s * 10) z.slow = Math.max(z.slow, 0.4); break; }
      case 7: { if (e.cd <= 0) { e.cd = 10; P.energy = Math.min(100, P.energy + 6 + s * 2); e.fx = 0.5; Particles.burst(e.x, e.y, 8, '#d8a8ff', 80); } break; }
    }
  },

  // ---------- gacha ----------
  pullOne() {
    this.pity5++; this.pity4++;
    const rate5 = this.pity5 >= 60 ? 1 : 0.016 + Math.max(0, this.pity5 - 44) * 0.06;
    const lvl = Math.max(1, this.player.level);
    if (Math.random() < rate5) {
      this.pity5 = 0; this.pity4 = 0;
      const x = Math.random();
      if (x < 0.45) { const pool = PETS.map((p, i) => i).filter(i => PETS[i].star === 5); return this.petReward(R.pick(pool), 5); }
      if (x < 0.85) { const it = Loot.randomGear(lvl, 3, Math.random() < 0.12 ? 5 : 4); return { star: 5, gear: it, name: it.name, icon: Loot.iconOf(it) }; }
      return { star: 5, chest: 3, name: CHESTS[3].name, icon: 'chest_3' };
    }
    if (this.pity4 >= 10 || Math.random() < 0.13) {
      this.pity4 = 0;
      const x = Math.random();
      if (x < 0.35) { const pool = PETS.map((p, i) => i).filter(i => PETS[i].star === 4); return this.petReward(R.pick(pool), 4); }
      if (x < 0.75) { const it = Loot.randomGear(lvl, 2, 3); return { star: 4, gear: it, name: it.name, icon: Loot.iconOf(it) }; }
      if (x < 0.9) return { star: 4, item: 'heart', n: 1, name: itm('heart').name, icon: itm('heart').icon };
      return { star: 4, chest: 2, name: CHESTS[2].name, icon: 'chest_2' };
    }
    const x = Math.random();
    if (x < 0.4) { const n = Math.round(R.int(40, 110) * (1 + lvl * 0.06)); return { star: 3, item: 'gold', n, name: `${n} ${cur().name}`, icon: cur().icon }; }
    if (x < 0.7) { const [id, n] = R.pick([['medkit', 2], ['grenade', 3], ['scroll', 2], ['ammo_rifle', 60], ['pills', 3], ['star', 3]]); return { star: 3, item: id, n, name: `${itm(id).name} x${n}`, icon: itm(id).icon }; }
    const it = Loot.randomGear(lvl, 0.6, 1); return { star: 3, gear: it, name: it.name, icon: Loot.iconOf(it) };
  },
  petReward(i, star) { const dup = !!this.pets[i]; return { star, pet: i, name: PETS[i].name + (dup ? ` (★${Math.min(5, this.pets[i] + 1)})` : ' — MỚI!'), icon: 'pet_' + i, dup }; },
  claim(r) {
    const P = this.player;
    if (r.pet != null) { this.pets[r.pet] = Math.min(5, (this.pets[r.pet] || 0) + 1); if (this.activePet == null) this.activePet = r.pet; this.applyPet(); }
    else if (r.gear) this.pickGear(r.gear);
    else if (r.chest != null) { this.pendingChests = (this.pendingChests || []).concat([r.chest]); }
    else if (r.item === 'gold') P.gold += r.n;
    else if (r.item) P.inv[r.item] = (P.inv[r.item] || 0) + r.n;
    UI.dirty = true;
  },
  pull(n) {
    if (this.tickets() < n) { this.toast(`Cần ${n} ${TICKET[rk(RL.id)].name}.`, 'warn'); return null; }
    this.player.inv.ticket -= n; if (!this.player.inv.ticket) delete this.player.inv.ticket;
    const res = []; for (let i = 0; i < n; i++) res.push(this.pullOne());
    // beginner's luck: the very first 10-pull always contains a pet
    if (n >= 10 && !this.codex.firstPull && !res.some(r => r.pet != null)) { const pool = PETS.map((p, i) => i).filter(i => PETS[i].star === 4); res[res.length - 1] = this.petReward(R.pick(pool), 4); }
    if (n >= 10) this.codex.firstPull = 1;
    for (const r of res) this.claim(r);
    this.save();
    return res;
  },

  // ---------- wonders & journal ----------
  discoverWonder(p) {
    if (p.found) return;
    p.found = true;
    const w = WONDERS[p.data.w], key = p.id || (Math.round(p.x) + ',' + Math.round(p.y));
    if (this.codex.sites[key]) return;
    this.codex.sites[key] = 1;
    const first = !this.codex.wonders[p.data.w];
    this.codex.wonders[p.data.w] = (this.codex.wonders[p.data.w] || 0) + 1;
    Sound.play('sfx_gong', 0.7); Sound.play('sfx_achievement', 0.6, 0.9);
    FX.pillar(p.x, p.y, '#ffe6a0', 2, 90); this.shake(4);
    UI.banner(first ? 'KỲ QUAN MỚI' : 'KỲ QUAN', w.name, '#ffe6a0');
    setTimeout(() => UI.radio([w.lore]), 900);
    this.addXp(150 + this.player.level * 20);
    this.giveTickets(first ? 3 : 1, first ? 'Khám phá ' + w.name : null);
    const nf = Object.keys(this.codex.wonders).length;
    if (first && nf % 4 === 0) this.giveTickets(5, `Đã tìm thấy ${nf}/12 kỳ quan!`);
  },
  biomeFound(b) {
    if (!this.codex || this.codex.biomes[b]) return;
    this.codex.biomes[b] = 1;
    if (b !== 'plains') this.giveTickets(1, 'Vùng đất mới: ' + BIOMES[b].name);
  },

  // ---------- world events ----------
  v4Tick(dt) {
    const P = this.player;
    this.petTick(dt);
    if (this.pendingChests && this.pendingChests.length && this.state === 'playing' && World.mode === 'over') {
      for (const t of this.pendingChests) { const a = R.range(0, TAU); World.keepChest(P.x + Math.cos(a) * 50, P.y + Math.sin(a) * 50, t, 0.5); FX.pillar(P.x + Math.cos(a) * 50, P.y + Math.sin(a) * 50, CHESTS[t].col, 1, 26); }
      this.pendingChests = []; this.toast('Rương báu từ Tế Đàn đã hạ xuống cạnh bạn!', 'good');
    }
    // wonders nearby
    if (this.frame % 15 === 0) for (const p of World.propsNear(P.x, P.y, 320, this._wq || (this._wq = []))) if (p.kind === 'wonder' && !p.found && dist(p.x, p.y, P.x, P.y) < 300) this.discoverWonder(p);
    if (World.mode !== 'over') return;
    // night events: blood moon or meteor shower
    if (this.night !== this._wasNight) {
      this._wasNight = this.night;
      if (this.night && this.day >= 2) {
        const r = Math.random();
        if (r < 0.18) { this.bloodMoon = true; UI.banner('HUYẾT NGUYỆT', 'Trăng máu mọc — quái đông gấp bội, tiền rơi x2', '#ff3b3b'); Sound.play('sfx_gong', 0.8, 0.6); }
        else if (r < 0.5) { this.meteorT = 50; UI.banner('MƯA SAO BĂNG', 'Nhặt Mảnh Sao Băng — 10 mảnh đổi 1 vé triệu hồi', '#ffe680'); Sound.play('sfx_magic', 0.6, 0.7); }
      } else if (!this.night) { if (this.bloodMoon) this.toast('Huyết nguyệt đã lặn.', 'info'); this.bloodMoon = false; }
    }
    if (this.meteorT > 0) {
      this.meteorT -= dt;
      if (Math.random() < dt * 3.5) {
        const a = R.range(0, TAU), d = R.range(80, 520), x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
        this.meteors.push({ x, y, t: 0, land: Math.random() < 0.4 && World.walkable(Math.floor(x / TILE), Math.floor(y / TILE)) });
      }
    }
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i]; m.t += dt;
      if (m.t >= 0.7) { if (m.land) { Items.drop(m.x, m.y, 'star', 1); FX.ring(m.x, m.y, 4, 40, '#ffe680', 0.35, 3); Particles.burst(m.x, m.y, 10, '#ffe680', 140); Sound.at('sfx_explosion', m.x, m.y, 0.15, 1.8); } this.meteors.splice(i, 1); }
    }
    // the treasure goblin
    this.goblinT -= dt;
    if (this.goblinT <= 0) {
      this.goblinT = R.range(150, 260);
      if (!this.zombies.some(z => z.goblin)) {
        for (let k = 0; k < 12; k++) {
          const a = R.range(0, TAU), d = R.range(380, 520), x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
          if (!World.walkable(Math.floor(x / TILE), Math.floor(y / TILE))) continue;
          const z = this.spawnEnemy('runner', x, y, { name: RL.id === 'tt' ? 'Tầm Bảo Yêu' : 'Yêu Tinh Trộm Vàng', hpMul: 9, guard: true });
          z.goblin = true; z.img = 'ev_goblin'; z.upright = true; z.escapeT = 32; z.spd = 118; z.elite = true;
          this.toast('💰 Một Yêu Tinh Trộm Vàng vừa xuất hiện! Hạ nó trước khi nó trốn mất!', 'quest');
          Sound.at('sfx_coin', x, y, 1, 0.7);
          break;
        }
      }
    }
  },
  goblinUpdate(z, dt) {
    const P = this.player;
    z.hitT -= dt; z.slow -= dt; z.escapeT -= dt;
    if (z.burn > 0) { z.burn -= dt; this.hitEnemy(z, (6 + z.maxHp * 0.01) * dt, 0, 0, 'fire'); }
    if (z.dead) return;
    z.kx *= Math.max(0, 1 - dt * 8); z.ky *= Math.max(0, 1 - dt * 8);
    if (z.escapeT <= 0) {
      Particles.burst(z.x, z.y, 30, '#ffd23a', 220); FX.ring(z.x, z.y, 6, 70, '#b46bff', 0.5, 6); Sound.at('sfx_portal', z.x, z.y, 0.8, 1.3);
      z.dead = true; z.dying = 1; this.toast('Yêu Tinh đã chui vào cổng và trốn mất... lần sau nhanh tay hơn!', 'warn'); return;
    }
    if (z.stun > 0) { z.stun -= dt; z.move(z.kx * dt, z.ky * dt); return; }
    const dx = z.x - P.x, dy = z.y - P.y, d = Math.hypot(dx, dy) || 1;
    let ax = dx / d, ay = dy / d;
    z.wob = (z.wob || 0) + dt * 3;
    ax += Math.cos(z.wob) * 0.6; ay += Math.sin(z.wob * 1.3) * 0.6;
    const l = Math.hypot(ax, ay) || 1;
    const sp = z.spd * (d < 260 ? 1.25 : 0.7) * (z.slow > 0 ? 0.5 : 1) * (z.hitT > -0.6 ? 1.35 : 1);
    z.vx = lerp(z.vx, ax / l * sp, Math.min(1, dt * 5)); z.vy = lerp(z.vy, ay / l * sp, Math.min(1, dt * 5));
    const hit = z.move((z.vx + z.kx) * dt, (z.vy + z.ky) * dt);
    if (hit) z.wob += 1.5;
    z.walkT += dt * 10; z.angle = Math.atan2(z.vy, z.vx);
    if (Math.random() < dt * 0.8) Items.drop(z.x, z.y, 'gold', R.int(1, 3));
    if (Math.random() < 0.15) Particles.add({ x: z.x + R.range(-6, 6), y: z.y, vx: R.range(-20, 20), vy: R.range(-50, -20), life: 0.5, max: 0.5, size: 2, col: '#ffd23a', drag: 2, glow: true });
  },
  mimicAwake(p) {
    World.removeProp(p);
    const tier = p.data.tier;
    const z = this.spawnEnemy('brute', p.x, p.y, { name: 'Rương Ăn Thịt', elite: true, hpMul: 0.7 + tier * 0.25, state: 'chase', guard: true });
    z.mimic = tier; z.img = 'ev_mimic'; z.upright = true; z.stun = 0.5; z.spd *= 1.6;
    UI.banner('RƯƠNG ĂN THỊT!', 'Đó không phải rương...', '#ff4a3a');
    Sound.play('sfx_monster', 0.9, 1.3); this.shake(10); this.hitstop = 0.15;
    Particles.burst(p.x, p.y, 20, '#8a0d0d', 200);
  },
});

// wrap core hooks without touching their bodies
const _enemyUpdate = Enemy.prototype.update;
Enemy.prototype.update = function (dt) { if (this.goblin && !this.dead) return G.goblinUpdate(this, dt); return _enemyUpdate.call(this, dt); };
const _killEnemy = G.killEnemy;
G.killEnemy = function (z, src) {
  _killEnemy.call(this, z, src);
  if (z.goblin) {
    this.toast('💰 Hạ gục Yêu Tinh Trộm Vàng! Kho báu tuôn ra!', 'quest'); this.slowmo = 0.6; this.shake(8);
    for (let i = 0; i < 14; i++) setTimeout(() => Items.drop(z.x, z.y, 'gold', R.int(8, 18) + z.lvl), i * 70);
    for (let i = 0; i < 2; i++) Items.dropGear(z.x, z.y, Loot.randomGear(z.lvl, 1.6, 2));
    this.giveTickets(2, null);
    FX.pillar(z.x, z.y, '#ffd23a', 1.4, 40);
  }
  if (z.mimic != null) this.openChest({ x: z.x, y: z.y, data: { tier: Math.min(3, z.mimic + 1), bonus: 0.6 }, w: 0, h: 0 });
  if (z.boss) { this.codex.bosses[z.name.replace(/^(Cuồng Bạo|Thiết Giáp|Khổng Lồ|Hư Ảnh|Bão Tố) /, '')] = 1; this.giveTickets(z.dungeon || z.story ? 2 : 1, null); }
};
const _openChest = G.openChest;
G.openChest = function (p) {
  if (p.data && p.data.mimic) { p.data.mimic = false; return this.mimicAwake(p); }
  _openChest.call(this, p);
  const t = p.data ? p.data.tier : 0;
  if (t >= 3 || (t === 2 && Math.random() < 0.35)) setTimeout(() => this.giveTickets(1, null), 700);
};
const _relic = Player.prototype.relic;
Player.prototype.relic = function (type) { return _relic.call(this, type) + (this.pab && this.pab[type] || 0); };
const _sight = G.sightRange;
G.sightRange = function () { return _sight.call(this) + (this.activePet === 6 ? 90 : 0); };

// ---------- drawing ----------
function drawPet(ctx) {
  const e = G.petE; if (!e || G.player.dead) return;
  const im = IMG['pet_' + e.i]; if (!im) return;
  const P = PETS[e.i];
  const w = im.width / 2, h = im.height / 2, bob = Math.sin(e.t * 3) * 3;
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(e.x, e.y + 18, 9, 4, 0, 0, TAU); ctx.fill();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.25 + e.fx * 0.8; ctx.drawImage(GLOW.white, e.x - 26, e.y - 26 + bob, 52, 52);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.save(); ctx.translate(e.x, e.y + bob);
  if (Math.cos(G.player.angle) < 0) ctx.scale(-1, 1);
  const sc = 1 + e.fx * 0.4;
  ctx.drawImage(im, -w / 2 * sc, -h / 2 * sc, w * sc, h * sc);
  ctx.restore();
  if (e.i === 6) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.18; ctx.drawImage(GLOW.white, e.x - 120, e.y - 120, 240, 240); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
}
function drawMeteors(ctx) {
  for (const m of G.meteors || []) {
    const k = m.t / 0.7, sx = m.x + (1 - k) * 260, sy = m.y - (1 - k) * 420;
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(sx + 70, sy - 110, sx, sy);
    g.addColorStop(0, 'rgba(255,230,128,0)'); g.addColorStop(1, 'rgba(255,240,180,0.9)');
    ctx.strokeStyle = g; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx + 70, sy - 110); ctx.lineTo(sx, sy); ctx.stroke();
    ctx.fillStyle = '#fff6d0'; ctx.beginPath(); ctx.arc(sx, sy, 3, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
}
function drawEventTint() {
  if (G.bloodMoon && World.mode === 'over') { ctx.fillStyle = `rgba(150,0,10,${0.16 + Math.sin(G.time) * 0.03})`; ctx.fillRect(0, 0, canvas.width, canvas.height); }
}

// ---------- gacha UI ----------
Object.assign(UI, {
  openGacha() {
    if (!['playing', 'paused', 'menu'].includes(G.state) || G.player.dead) return;
    G.state = 'menu';
    this.buildGacha();
    this.showScreen('gacha');
    Sound.play('sfx_magic', 0.5, 0.8);
  },
  buildGacha() {
    const P = G.player, T = TICKET[rk(RL.id)];
    $('gName').textContent = GACHA_NAME[rk(RL.id)];
    $('gTickets').innerHTML = `<img src="${IMG[T.icon].src}" alt=""><b>${G.tickets()}</b><small>${esc(T.name)}</small>`;
    $('gStars').innerHTML = `<img src="${IMG.ev_star.src}" alt=""><b>${P.inv.star || 0}</b><small>Mảnh Sao Băng</small>`;
    $('gPity').textContent = `Bảo hiểm: chắc chắn ra 5★ trong ${60 - G.pity5} lượt nữa • 4★ trong ${10 - G.pity4} lượt`;
    $('gFeat').innerHTML = PETS.map((p, i) => p.star === 5 ? `<div class="gfp"><img src="${IMG['pet_' + i].src}" alt=""><span>${esc(p.name)}</span></div>` : '').join('');
    $('gPull1').disabled = G.tickets() < 1; $('gPull10').disabled = G.tickets() < 10;
    $('gTrade').disabled = (P.inv.star || 0) < 10;
    $('gBuy').innerHTML = `MUA 1 VÉ — ${Math.round(180 * G.priceMul())} ${esc(cur().name)}`;
    $('gBuy').disabled = P.gold < Math.round(180 * G.priceMul());
  },
  // shooting star in the colour of the best result, then cards flip one by one
  playGacha(res) {
    if (!res) return;
    const best = Math.max(...res.map(r => r.star));
    const col = best === 5 ? '#ffcf4a' : best === 4 ? '#c07bff' : '#6fb8ff';
    const A = $('gAnim'); A.hidden = false; A.style.setProperty('--sc', col);
    A.className = 'ganim s' + best;
    $('gCards').innerHTML = ''; $('gCont').hidden = true;
    Sound.play('sfx_portal', 0.6, 0.7);
    this.gTimer = setTimeout(() => this.revealGacha(res, best), 1700);
    A.onclick = () => { if (!this.gRevealed) { clearTimeout(this.gTimer); this.revealGacha(res, best); } };
  },
  revealGacha(res, best) {
    this.gRevealed = true;
    $('gAnim').className = 'ganim s' + best + ' rev';
    Sound.play(best === 5 ? 'sfx_legendary' : best === 4 ? 'sfx_achievement' : 'sfx_coin', 0.8);
    $('gCards').innerHTML = res.map((r, i) => `<div class="gcard st${r.star}" style="animation-delay:${i * 0.12}s"><div class="gst">${'★'.repeat(r.star)}</div><img src="${IMG[r.icon] ? IMG[r.icon].src : ''}" alt=""><b>${esc(r.name)}</b>${r.pet != null ? '<i>THÚ CƯNG</i>' : r.gear ? `<i style="color:${RARITY[r.gear.rarity].color}">${RARITY[r.gear.rarity].name}</i>` : ''}</div>`).join('');
    setTimeout(() => { $('gCont').hidden = false; }, 300 + res.length * 120);
  },
  closeGachaAnim() { $('gAnim').hidden = true; this.gRevealed = false; this.buildGacha(); },

  // ---------- pets & journal tabs in the bag ----------
  buildPets(box) {
    let h = '<div class="petgrid">';
    PETS.forEach((p, i) => {
      const s = G.pets[i];
      h += `<div class="petc ${s ? '' : 'locked'} ${G.activePet === i ? 'on' : ''}" style="--pc:${p.col}"><img src="${IMG['pet_' + i].src}" alt=""><b>${s ? esc(p.name) : '???'}</b><span class="pst">${'★'.repeat(p.star)}${s ? ` • Bậc ${s}/5` : ''}</span><small>${s ? esc(p.desc) : 'Triệu hồi ở ' + esc(GACHA_NAME[rk(RL.id)])}</small>${s ? `<button data-pet="${i}">${G.activePet === i ? 'ĐANG ĐI CÙNG' : 'MANG THEO'}</button>` : ''}</div>`;
    });
    box.innerHTML = h + '</div><p class="muted">Triệu hồi trùng thú cưng sẽ tăng bậc (tối đa 5), thú càng mạnh. Mở Tế Đàn bằng nút 🎴 hoặc phím Y.</p>';
    box.querySelectorAll('[data-pet]').forEach(b => { this.bindBtn(b); b.onclick = () => { const i = +b.dataset.pet; G.activePet = G.activePet === i ? null : i; G.applyPet(); this.buildInv(); }; });
  },
  buildCodex(box) {
    const C = G.codex;
    const nb = Object.keys(C.biomes).length, nw = Object.keys(C.wonders).length, np = Object.keys(G.pets).length, nbo = Object.keys(C.bosses).length;
    let h = `<div class="cxsum"><span>Vùng đất <b>${nb}/12</b></span><span>Kỳ quan <b>${nw}/12</b></span><span>Thú cưng <b>${np}/8</b></span><span>Boss đã hạ <b>${nbo}</b></span><span>Rương đã mở <b>${G.stats.chests || 0}</b></span></div>`;
    h += '<h3>Vùng đất</h3><div class="cxgrid">';
    for (const b of BIOME_IDS) { const f = C.biomes[b]; h += `<div class="cxb ${f ? '' : 'locked'}"><img src="${IMG[BIOMES[b].ground != null ? BIOME_TEX[BIOMES[b].ground] : RL.tex[0]].src}" alt=""><span>${f ? esc(BIOMES[b].name) : '???'}</span></div>`; }
    h += '</div><h3>Kỳ quan</h3><div class="cxgrid">';
    WONDERS.forEach((w, i) => { const f = C.wonders[i]; h += `<div class="cxw ${f ? '' : 'locked'}"><img src="${IMG[w.img].src}" alt=""><span>${f ? esc(w.name) : '??? (' + esc(BIOMES[w.biome].name) + ')'}</span></div>`; });
    h += '</div>';
    if (nbo) h += `<h3>Boss đã hạ</h3><p class="muted">${Object.keys(C.bosses).map(esc).join(' • ')}</p>`;
    box.innerHTML = h + '<p class="muted">Mỗi vùng đất mới tặng 1 vé, mỗi kỳ quan mới tặng 3 vé, cứ 4 kỳ quan thưởng thêm 5 vé. Trên bản đồ lớn, dấu ? là tin đồn về kỳ quan chưa khám phá.</p>';
  },
});
const _buildInv = UI.buildInv;
UI.buildInv = function () {
  if (this.invTab === 'pets' || this.invTab === 'codex') {
    document.querySelectorAll('.tabs [data-tab]').forEach(t => t.classList.toggle('on', t.dataset.tab === this.invTab));
    if (this.invTab === 'pets') this.buildPets($('invBody')); else this.buildCodex($('invBody'));
    return;
  }
  _buildInv.call(this);
};

(function () {
  $('gPull1').onclick = () => UI.playGacha(G.pull(1));
  $('gPull10').onclick = () => UI.playGacha(G.pull(10));
  $('gTrade').onclick = () => { const P = G.player; if ((P.inv.star || 0) < 10) return; P.inv.star -= 10; if (!P.inv.star) delete P.inv.star; P.inv.ticket = (P.inv.ticket || 0) + 1; Sound.play('sfx_coin', 0.6); UI.buildGacha(); };
  $('gBuy').onclick = () => { if (G.pay(Math.round(180 * G.priceMul()))) { G.player.inv.ticket = (G.player.inv.ticket || 0) + 1; UI.buildGacha(); } };
  $('gCont').onclick = e => { e.stopPropagation(); UI.closeGachaAnim(); };
  document.querySelectorAll('[data-a="gacha"]').forEach(b => b.addEventListener('click', () => UI.openGacha()));
  window.addEventListener('keydown', e => { if (e.code === 'KeyY' && G.state === 'playing') UI.openGacha(); });
})();
const _start = G.start;
G.start = function (isNew) {
  _start.call(this, isNew);
  const T = TICKET[rk(RL.id)];
  if (isNew) setTimeout(() => this.toast(`🎴 Bạn có 10 ${T.name}! Mở ${GACHA_NAME[rk(RL.id)]} bằng nút 🎴 hoặc phím Y.`, 'quest'), 9000);
  if (this.v4Gift) { this.v4Gift = false; setTimeout(() => this.toast(`🎁 Quà cập nhật: 10 ${T.name}, thú cưng, kỳ quan và sự kiện mới đang chờ bạn!`, 'quest'), 1500); }
};

// ---------- chests that must survive unloading and saving ----------
Object.assign(World, {
  keep: [],
  keepChest(x, y, tier, bonus) {
    if (this.mode !== 'over') { const p = this.addProp('chest_' + tier, x, y, { container: 'chest', kind: 'chest', r: 12, data: { tier, bonus } }); return p; }
    const e = { x, y, tier, bonus: bonus || 0 };
    this.keep.push(e); this.placeKept(e);
    return e.prop;
  },
  placeKept(e) {
    if (e.prop || this.mode !== 'over' || this._gen || !this.sbs.has(nkey(Math.floor(e.x / SBPX), Math.floor(e.y / SBPX)))) return;
    e.prop = this.addProp('chest_' + e.tier, e.x, e.y, { container: 'chest', kind: 'chest', r: 12, data: { tier: e.tier, bonus: e.bonus, keep: e } });
  },
  unkeep(e) { const i = this.keep.indexOf(e); if (i >= 0) this.keep.splice(i, 1); },
});
const _wUpdate = World.update, _wUnload = World.unload, _wReset = World.reset;
World.update = function (px, py) { _wUpdate.call(this, px, py); if (this.keep.length && G.frame % 15 === 0) for (const e of this.keep) if (!e.prop) this.placeKept(e); };
World.unload = function (sb) { for (const e of this.keep) if (e.prop && Math.floor(e.x / SBPX) === sb.sx && Math.floor(e.y / SBPX) === sb.sy) e.prop = null; _wUnload.call(this, sb); };
World.reset = function () { for (const e of this.keep || []) e.prop = null; _wReset.call(this); };
// a new or loaded game starts with an empty list before the world is generated
const _newGame = G.newGame, _load = G.load;
G.newGame = function (...a) { World.keep = []; this.pendingChests = []; return _newGame.apply(this, a); };
G.load = function (...a) { World.keep = []; this.pendingChests = []; return _load.apply(this, a); };
