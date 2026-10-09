// ===== v11: classes (passives, dash variants, stat weights, gear bias), female heroes, summons in every world + their jobs (loot, work, explore, swap) =====
const CLASS_INFO = {
  warrior: { col: '#ff6a4a', pass: '+20% sát thương cận chiến, chịu ít hơn 12% sát thương', dash: 'Xung phong — lướt húc văng và gây sát thương kẻ địch trên đường', build: ['str', 'vit'], gear: 'vũ khí cận chiến, giáp dày' },
  assassin: { col: '#b46bff', pass: '+15% chí mạng (x2), +10% tốc chạy', dash: 'Ảnh bộ — lướt xa hơn, đòn kế tiếp trong 2 giây gây x2.5 sát thương', build: ['agi', 'str'], gear: 'vũ khí cận chiến nhẹ, đồ chí mạng và tốc độ' },
  ranger: { col: '#6ee06e', pass: '+20% sát thương vũ khí tầm xa', dash: 'Lùi bắn — lướt lùi và bắn một loạt 7 phát hình quạt', build: ['str', 'agi'], gear: 'vũ khí tầm xa' },
  mage: { col: '#4da6ff', pass: '+25% sát thương kỹ năng, mỗi điểm trí tuệ cho gấp đôi mana, kỹ năng Tế Đàn rẻ hơn 25%', dash: 'Thuấn di — dịch chuyển tức thời, đóng băng kẻ địch quanh chỗ cũ', build: ['int'], gear: 'thánh vật, kỹ năng Tế Đàn' },
  healer: { col: '#ffd65a', pass: 'Tự hồi máu, đồng đội và quân triệu hồi được hồi máu, quân triệu hồi +20% máu', dash: 'Hồi xuân — lướt và hồi máu cho bạn cùng đồng đội gần', build: ['int', 'vit'], gear: 'giáp, thánh vật hồi phục' },
};
const SH_JOBS = {
  gather: { name: 'Đốn gỗ, nhặt phế liệu', out: [['planks', 1], ['scrap', 1]] },
  hunt: { name: 'Săn bắt, lấy nước', out: [['food', 1], ['water', 1]] },
  herb: { name: 'Hái thuốc', out: [['bandage', 1], ['pills', 0.5], ['flower', 0.4]] },
  mine: { name: 'Tìm kho báu', gold: 14 },
};
const JOB_TIME = 90, SWAP_MANA = 20, EXPLORE_SPEED = 220;
const SH_POWER = { normal: 1, elite: 1.6, mini: 2.5, boss: 4 };
const cls = () => G.v10 && G.v10.cls;

Object.assign(G, {
  setClass(k) {
    const v = this.v10, P = this.player;
    // switching class refunds every attribute point under the old weights
    const W = clsW();
    P.maxHp -= v.attr.vit * W.hp; P.maxStam -= v.attr.agi * 2;
    v.pts += ATTR_KEYS.reduce((a, s) => a + v.attr[s], 0);
    v.attr = { str: 0, vit: 0, agi: 0, int: 0 };
    P.hp = Math.min(P.hp, P.maxHp);
    v.cls = k;
    FX.pillar(P.x, P.y, CLASS_INFO[k].col, 1.2, 40);
    this.toast(`Chức nghiệp: ${clsName(k)} — ${CLASS_INFO[k].pass}. Nên cộng ${CLASS_INFO[k].build.map(attrName).join(' + ')}.`, 'quest');
    UI.dirty = true;
  },
  classMenu(first) {
    const k = rk(RL.id);
    UI.menuDialog({
      name: 'Chọn chức nghiệp', portrait: null,
      text: first ? 'Mỗi chức nghiệp có cách cộng chỉ số, vũ khí hợp và chiêu lướt riêng. Có thể đổi lại ở căn cứ (mất phí, hoàn điểm).' : 'Đổi chức nghiệp sẽ hoàn lại toàn bộ điểm tiềm năng.',
      options: CLASS_KEYS.map(c => ({ text: `${clsName(c)} — ${CLASS_INFO[c].dash.split(' — ')[0]}`, act: () => this.setClass(c) })).concat(first ? [] : [{ text: 'Thôi', act: () => {} }]),
    });
  },
  // story companions get a class from their role text
  compClass(c) {
    const t = ((c.data && c.data.role) || '').toLowerCase();
    if (/sát thủ|ám|thích khách|trộm|ninja/.test(t)) return 'assassin';
    if (/y |y sĩ|y tá|bác sĩ|dược|đan|trị liệu|thánh nữ|mục sư|chữa/.test(t)) return 'healer';
    if (/pháp|thuật|kỹ sư|hacker|phù|trận|ma /.test(t)) return 'mage';
    if (/kiếm|chiến|võ|đao|thương|vệ|lính|đấu/.test(t)) return 'warrior';
    return 'ranger';
  },
  classCost() { return 200 + this.player.level * 30; },
  // ---------- summons: jobs ----------
  shById(id) { return this.v10.shadows.find(s => s.id === id); },
  shBusy(s) { return !!(s.job || s.exp); },
  setJob(s, kind) {
    this.recallShadow(s); s.exp = null;
    s.job = kind ? { kind, t: this.time } : null;
    if (kind) this.toast(`${SM().icon} ${s.name} đi ${SH_JOBS[kind].name.toLowerCase()} — cứ ${JOB_TIME}s mang về một mẻ, về căn cứ để nhận.`, 'info');
    UI.dirty = true;
  },
  jobTick() {
    const v = this.v10, P = this.player;
    v.stock = v.stock || {};
    for (const s of v.shadows) {
      if (!s.job || this.time - s.job.t < JOB_TIME) continue;
      s.job.t += JOB_TIME;
      const J = SH_JOBS[s.job.kind], pw = SH_POWER[s.tier] * (1 + 0.1 * (this.shStats(s).slv - 1));
      if (J.gold) v.stock.gold = (v.stock.gold || 0) + J.gold * pw * (1 + P.level * 0.05);
      for (const [id, q] of J.out || []) v.stock[id] = (v.stock[id] || 0) + q * pw;
    }
    if (this.atBase && this.atBase() && this.frame % 60 === 0) {
      const got = [];
      for (const id in v.stock) {
        const n = Math.floor(v.stock[id]); if (n < 1) continue;
        v.stock[id] -= n;
        if (id === 'gold') P.gold += n; else this.give(id, n);
        got.push(`${n} ${id === 'gold' ? cur().name : itm(id).name}`);
      }
      if (got.length) this.toast(`${SM().icon} ${SM().army} mang về: ${got.join(', ')}.`, 'good');
    }
  },
  // ---------- summons: exploring ----------
  exploreTo(s, tx, ty) {
    const P = this.player;
    if (World.mode !== 'over') { this.toast('Chỉ khám phá được ở thế giới bên ngoài.', 'warn'); return false; }
    this.recallShadow(s); s.job = null;
    const d = dist(P.x, P.y, tx, ty);
    s.exp = { x0: P.x, y0: P.y, tx, ty, x: P.x, y: P.y, t0: this.time, dur: Math.max(1, d / EXPLORE_SPEED), done: false, sb: null };
    this.toast(`${SM().icon} ${s.name} lên đường khám phá (~${Math.ceil(d / EXPLORE_SPEED)}s). Tới nơi có thể hoán đổi vị trí [J].`, 'quest');
    UI.dirty = true;
    return true;
  },
  exploreTick() {
    this._expQ = this._expQ || [];
    for (const s of this.v10.shadows) {
      const e = s.exp; if (!e || e.done) continue;
      const k = Math.min(1, (this.time - e.t0) / e.dur);
      const x = lerp(e.x0, e.tx, k), y = lerp(e.y0, e.ty, k), sx = Math.floor(x / SBPX), sy = Math.floor(y / SBPX), key = nkey(sx, sy);
      if (key !== e.sb) {
        const [rx, ry] = World.regionOf(sx, sy);
        if (this.regionLocked && this.regionLocked(rx, ry)) { e.done = true; this.toast(`${SM().icon} ${s.name} bị ${BARRIER[rk(RL.id)].name} chặn lại, dừng ở rìa vùng.`, 'warn'); continue; }
        e.sb = key;
        World.explored.add('over' + key); this._expQ.push([sx, sy]);
      }
      e.x = x; e.y = y;
      if (k >= 1) {
        e.done = true;
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { World.explored.add('over' + nkey(sx + a, sy + b)); this._expQ.push([sx + a, sy + b]); }
        this.toast(`${SM().icon} ${s.name} đã tới nơi và mở bản đồ quanh đó. Bấm [J] / nút ⇄ để hoán đổi vị trí.`, 'quest');
      }
    }
    if (this._expQ.length && this.frame % 8 === 0 && World.mode === 'over') { const [x, y] = this._expQ.shift(); try { World.genMini(x, y); } catch (er) {} }
  },
  // ---------- summons: swapping places ----------
  swapShadow(s) {
    const P = this.player, v = this.v10;
    if (!s || P.dead || P.car) return;
    if (v.mana < SWAP_MANA) { this.toast(`Hoán đổi cần ${SWAP_MANA} ${manaName()}.`, 'warn'); return; }
    const a = this.shadowAlly(s);
    if (a && dist(a.x, a.y, P.x, P.y) < 1500) {
      v.mana -= SWAP_MANA;
      const ox = P.x, oy = P.y; P.x = a.x; P.y = a.y; a.x = ox; a.y = oy;
      World.collideCircle(P, P.r);
      FX.pillar(ox, oy, SM().col, 0.8, 26); FX.pillar(P.x, P.y, SM().col, 1, 26); Sound.play('sfx_portal', 0.6, 1.4);
      this.camera.x = P.x; this.camera.y = P.y;
      return;
    }
    if (s.exp) {
      if (World.mode !== 'over') { this.toast('Không thể hoán đổi khi đang ở trong hầm ngục.', 'warn'); return; }
      if (this.zombies.some(z => !z.dead && z.state === 'chase' && dist(z.x, z.y, P.x, P.y) < 220)) { this.toast('Đang bị kẻ địch áp sát — thoát ra trước đã!', 'warn'); return; }
      v.mana -= SWAP_MANA;
      const t = { x: s.exp.x, y: s.exp.y, name: s.name, kind: 'swap' };
      s.exp = null;
      this.teleport(t);
      setTimeout(() => { if (!this.shadowAlly(s)) this.summonShadow(s, true); }, 1600);
      return;
    }
    this.toast(`${s.name} không ở ngoài chiến trường để hoán đổi.`, 'info');
  },
  swapQuick() {
    const v = this.v10, P = this.player;
    const ex = v.shadows.filter(s => s.exp).sort((a, b) => b.exp.t0 - a.exp.t0)[0];
    if (ex) return this.swapShadow(ex);
    let far = null, fd = 120;
    for (const a of this.allies) if (a.sid && !a.dead) { const d = dist(a.x, a.y, P.x, P.y); if (d > fd) { fd = d; far = a; } }
    if (far) return this.swapShadow(this.shById(far.sid));
    this.toast(`Không có ${SM().unit} nào ở xa để hoán đổi. Gửi ${SM().unit} đi khám phá trên bản đồ.`, 'info');
  },
  v11Tick(dt) {
    const P = this.player, v = this.v10; if (!v || !P) return;
    this.jobTick(); this.exploreTick();
    if (G.state !== 'playing' || UI.dialogOpen) return;
    if (Input.hit('KeyJ')) this.swapQuick();
    // class: dash variants start the moment a dash begins
    const c = cls();
    if (P.dashT > 0 && !P._dOn) { P._dOn = true; P._dHit = new Set(); if (c) this.classDash(c); }
    else if (P.dashT <= 0) P._dOn = false;
    if (c === 'warrior' && P.dashT > 0) {
      for (const z of this.zgrid.query(P.x, P.y, 40)) if (!z.dead && !P._dHit.has(z) && dist(z.x, z.y, P.x, P.y) < P.r + z.r + 14) {
        P._dHit.add(z); z.stun = Math.max(z.stun || 0, 0.5);
        this.hitEnemy(z, (22 + P.level * 3) * (1 + this.attr('str') * 0.04), Math.cos(P.dashDir) * 320, Math.sin(P.dashDir) * 320, 'melee', P.dashDir);
      }
    }
    if (c === 'healer') {
      if (P.hp < P.maxHp && !P.dead) P.hp = Math.min(P.maxHp, P.hp + P.maxHp * 0.004 * dt);
      if (this.frame % 30 === 0) for (const a of this.allies) if (!a.dead && !a.home && (a.kind === 'merc' || a.kind === 'comp' || a.kind === 'shadow') && a.hp < a.maxHp && dist(a.x, a.y, P.x, P.y) < 420) a.hp = Math.min(a.maxHp, a.hp + a.maxHp * 0.01 * 30 / 60);
    }
  },
  classDash(c) {
    const P = this.player, col = CLASS_INFO[c].col;
    if (c === 'assassin') { P.dashT *= 1.5; P.backstabT = this.time + 2; Particles.burst(P.x, P.y, 10, col, 140); }
    else if (c === 'ranger') {
      P.dashDir = P.angle + Math.PI;
      const W = RL.weapons.r1, dmg = (16 + P.level * 2.6) * (1 + this.attr('str') * 0.04);
      for (let i = 0; i < 7; i++) { const a = P.angle + (i - 3) * 0.14; Bullets.fire(P.x + Math.cos(a) * 16, P.y + Math.sin(a) * 16, a, { speed: 860, knock: 60, proj: W.proj || 'bullet', color: W.color, affixes: [] }, dmg, { src: 'gun' }); }
      Sound.play(W.sfx || 'sfx_shot', 0.5, 1.1);
    } else if (c === 'mage') {
      const ox = P.x, oy = P.y, ca = Math.cos(P.dashDir), sa = Math.sin(P.dashDir);
      let d = 0; while (d < 220) { const nx = ox + ca * (d + 10), ny = oy + sa * (d + 10); if (World.solidAt(Math.floor(nx / TILE), Math.floor(ny / TILE))) break; d += 10; }
      P.x = ox + ca * d; P.y = oy + sa * d; World.collideCircle(P, P.r); P.dashT = 0; P.vx = P.vy = 0;
      FX.ring(ox, oy, 8, 130, '#bfefff', 0.5, 8); Particles.ice(ox, oy, 16); FX.pillar(P.x, P.y, col, 0.6, 20); Sound.play('sfx_portal', 0.4, 1.6);
      for (const z of this.zgrid.query(ox, oy, 130)) if (!z.dead && dist(z.x, z.y, ox, oy) < 130) { z.slow = 3; if (!z.boss) z.stun = Math.max(z.stun || 0, 0.8); this.hitEnemy(z, (12 + P.level * 2) * (1 + this.attr('int') * 0.05), 0, 0, 'skill'); }
    } else if (c === 'healer') {
      P.hp = Math.min(P.maxHp, P.hp + P.maxHp * 0.1);
      for (const a of this.allies) if (!a.dead && !a.home && (a.kind === 'merc' || a.kind === 'comp' || a.kind === 'shadow') && dist(a.x, a.y, P.x, P.y) < 260) a.hp = Math.min(a.maxHp, a.hp + a.maxHp * 0.15);
      FX.ring(P.x, P.y, 10, 260, '#6dff7a', 0.5, 8); Sound.play('sfx_heal', 0.5, 1.2);
    } else if (c === 'warrior') { Particles.dust(P.x, P.y, 8); P.shield = Math.max(P.shield || 0, 10 + P.level); }
  },
});

// ---------- hooks ----------
(function () {
  // class picked on the world screen; old saves are asked once
  const ng = G.newGame;
  G.newGame = function (...a) { const r = ng.apply(this, a); this.v10.cls = UI.pickedClass || null; return r; };
  const st = G.start;
  G.start = function (isNew) {
    st.call(this, isNew);
    if (!this.v10.cls && !(typeof Net !== 'undefined' && Net.active && Net.guest)) setTimeout(() => { if (!this.v10.cls) this.classMenu(true); }, isNew ? 3500 : 2500);
  };
  const tick = G.v5Tick;
  G.v5Tick = function (dt) { tick.call(this, dt); this.v11Tick(dt); };

  // class passives
  const he = G.hitEnemy;
  G.hitEnemy = function (z, dmg, kx, ky, src, ang, wp) {
    const c = cls(), P = this.player;
    if (c && P && !z.dead) {
      if (c === 'warrior' && src === 'melee') dmg *= 1.2;
      else if (c === 'ranger' && src === 'gun') dmg *= 1.2;
      else if (c === 'mage' && src === 'skill') dmg *= 1.25;
      if (c === 'assassin' && (src === 'melee' || src === 'gun')) {
        if (P.backstabT > this.time) { P.backstabT = 0; dmg *= 2.5; FX.slash(z.x, z.y, ang || 0, 40, 2, 'rgba(190,120,255,0.9)', 0.18); Floaters.add(z.x, z.y - 30, 'ÁM SÁT!', '#d8a8ff', 10); }
        else if (Math.random() < 0.15 + this.attr('agi') * 0.004) dmg *= 2;
      }
    }
    return he.call(this, z, dmg, kx, ky, src, ang, wp);
  };
  const hp = G.hurtPlayer;
  G.hurtPlayer = function (dmg, src, silent) { if (cls() === 'warrior') dmg *= 0.88; return hp.call(this, dmg, src, silent); };
  const sm = Player.prototype.speedMul;
  Player.prototype.speedMul = function () { return sm.call(this) * (cls() === 'assassin' ? 1.1 : 1); };
  const sc = G.skillCost;
  G.skillCost = function (e) { return Math.round(sc.call(this, e) * (cls() === 'mage' ? 0.75 : 1)); };
  // drops lean towards gear that suits the class
  const rg = Loot.randomGear;
  Loot.randomGear = function (ilvl, bonus = 0, min = 0) {
    const c = cls();
    if (c && Math.random() < 0.4) {
      const r = this.rollRarity(bonus, min);
      if (c === 'warrior' || c === 'assassin') return this.weapon('melee', ilvl, r);
      if (c === 'ranger') return this.weapon(R.pick(['r1', 'r2', 'r3']), ilvl, r);
      return Math.random() < 0.5 ? this.relic(ilvl, r) : this.armor(ilvl, r);
    }
    return rg.call(this, ilvl, bonus, min);
  };

  // summons: realm tint (zombies / ghosts / shadows), busy ones stay away, healers make them sturdier
  G.shadowOf = function (img) {
    const k = img + '|' + rk(RL.id);
    let c = this.shadowCache[k];
    if (!c) {
      const im = IMG[img]; c = document.createElement('canvas');
      if (!im) return c;
      c.width = im.width; c.height = im.height;
      const g = c.getContext('2d'); g.drawImage(im, 0, 0);
      g.globalCompositeOperation = 'source-atop'; g.fillStyle = SM().tint; g.fillRect(0, 0, c.width, c.height);
      this.shadowCache[k] = c;
    }
    return c;
  };
  const ss = G.summonShadow;
  G.summonShadow = function (s, free) {
    if (s && this.shBusy(s)) return 'busy';
    const r = ss.call(this, s, free);
    if (r === 'ok' && cls() === 'healer') { const a = this.shadowAlly(s); if (a) { a.maxHp *= 1.2; a.hp = a.maxHp; } }
    return r;
  };
  // swapping with a far explorer reuses fast travel
  const tp = G.teleport;
  G.teleport = function (t) {
    if (t && t.kind === 'shadow') { const s = this.shById(t.sid); if (s) return this.swapShadow(s); }
    return tp.call(this, t);
  };
  const tpa = G.tpAll;
  G.tpAll = function () {
    const out = tpa.call(this);
    if (World.mode === 'over') for (const s of this.v10.shadows) if (s.exp) out.push({ x: s.exp.x, y: s.exp.y, name: `${s.name} ${s.exp.done ? '(đang canh)' : '(đang đi)'} — hoán đổi ${SWAP_MANA} ${manaName()}`, kind: 'shadow', sid: s.id, icon: SM().icon, col: SM().col });
    return out;
  };

  // loot mode: summons not busy fighting run to drops and bring them to you
  const au = Ally.prototype.update;
  Ally.prototype.update = function (dt) {
    // every summon (saved or temporary) picks up drops between fights unless told to only fight
    if (this.kind === 'shadow' && !this.dead) {
      const s = this.sid ? G.shById(this.sid) : null;
      if ((!this.sid || (s && s.mode !== 'fight')) && lootStep(this, dt)) return;
    }
    return au.call(this, dt);
  };

  // female heroes: {realm}_f{tier}_{pose}
  const os = G.outfitSprite;
  G.outfitSprite = function (base, t) {
    const i = RL.hero.indexOf(base);
    // class outfit first (basic for common/uncommon body armour, elite from rare up), then the plain female set
    if (i >= 0 && cls()) { const n = `${rk(RL.id)}_K_${cls()}_${Story.gender === 'f' ? 'f' : 'm'}${(t || 0) >= 2 ? 'b' : 'a'}_${i}`; if (IMG[n]) return n; }
    if (Story.gender === 'f' && i >= 0) { const n = `${rk(RL.id)}_f${t || 0}_${i}`; if (IMG[n]) return n; }
    return os.call(this, base, t);
  };
  const ri = realmImages;
  realmImages = function (r) { const out = ri(r); out.push('atlas10_' + rk(r), 'atlas11_' + rk(r)); return out; };
})();

function lootStep(a, dt) {
  const P = G.player;
  if (a.nearestEnemy(180)) { a.lootIt = null; return false; }
  let it = a.lootIt;
  if (!it || Items.list.indexOf(it) < 0) {
    it = null; let bd = 800;
    for (const o of Items.list) { if (o._by && o._by !== a && !o._by.dead) continue; const d = dist(o.x, o.y, P.x, P.y); if (o.age > 0.4 && d < bd && dist(o.x, o.y, a.x, a.y) < 900) { bd = d; it = o; } }
    a.lootIt = it; if (it) it._by = a;
  }
  if (!it) return false;
  const dx = it.x - a.x, dy = it.y - a.y, d = Math.hypot(dx, dy);
  a.hurtT -= dt; a.cool -= dt;
  if (d < 18) {
    const i = Items.list.indexOf(it); if (i >= 0) Items.list.splice(i, 1);
    if (it.gear) G.pickGear(it.gear); else G.give(it.id, it.n, true);
    Particles.burst(a.x, a.y, 6, SM().col, 90); a.lootIt = null;
    return true;
  }
  a.angle = Math.atan2(dy, dx);
  a.vx = lerp(a.vx, dx / d * 240, Math.min(1, dt * 6)); a.vy = lerp(a.vy, dy / d * 240, Math.min(1, dt * 6));
  // summons drift through walls while fetching, so they never get stuck behind a building
  a.x += a.vx * dt; a.y += a.vy * dt;
  a.walkT += dt * Math.hypot(a.vx, a.vy) * 0.08;
  return true;
}
