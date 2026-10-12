// ===== v22zombie (package ZB): human-turned zombies with tiers and skills, day scaling, house/road spawner, more gates =====
// Contract for other v22 packages:
//   G.dayMul()                  1 + 0.1*(day-1), capped at 5. Applied to hp, maxHp and dmg of every enemy from G.spawnEnemy.
//   G.spawnZombie22(x, y, opts) a v22 zombie. opts: type (walker | runner | bloat | a skill type | 'king'),
//                               place ('house' | 'road' | 'risen'), still (stands in a house until it notices the player),
//                               sbk, state, rise, tier (0-2), lvl, zone.
//   Zombie fields: zb (true), zbType, zbTier (0 normal, 1 Tinh anh, 2 Thong linh), zbPlace, zbKing, zbS (skill state), still.
//   Basic melee and its wind-up belong to the parry package (PA owns z.wind and reads z.t.windup).
//   Parryable skill impacts (lunge, leap, charge) set src._strikeNow = true for the length of the hit, as PA expects.
//   Talisman and slam hits do not set it, so they cannot be parried. Bullets are rolled by PA unless b.noParry.
//   P.rooted > 0 stops walking (Player.speedMul returns 0). P.slowT is not used.
//   Saved state: G.v10.zb = { tip, wasNight, gnext }.

(function () {
  const ZB_CAP = 60;                 // alive roaming zombies (house + road) at once in the overworld
  const ZB_NEAR = 1300;              // density targets count the roaming zombies within this range of the player
  const TIER = [
    { name: '', hp: 1, dmg: 1, sc: 1, xp: 1, col: '#e6e6e6' },
    { name: 'Tinh anh ', hp: 2.0, dmg: 1.25, sc: 1.12, xp: 2.2, col: '#7fd8ff' },
    { name: 'Thống lĩnh ', hp: 3.6, dmg: 1.5, sc: 1.25, xp: 4, col: '#c77dff' },
  ];
  const KING_COL = '#ff5050';
  // skill kinds: range band to start a wind-up, wind-up seconds, cooldown band
  const KIND = {
    lunge:  { rmin: 80,  rmax: 250, wind: 0.5, cd: [3.5, 5.5] },
    leap:   { rmin: 90,  rmax: 300, wind: 0.6, cd: [4, 6] },
    charge: { rmin: 140, rmax: 320, wind: 0.6, cd: [4.5, 6] },
    fire:   { rmin: 110, rmax: 360, wind: 0.6, cd: [2.6, 3.4] },
    qi:     { rmin: 120, rmax: 380, wind: 0.45, cd: [2.2, 3.0] },
    gun:    { rmin: 140, rmax: 420, wind: 0.3, cd: [2.4, 3.2] },
    slam:   { rmin: 50,  rmax: 170, wind: 0.9, cd: [4.5, 6] },
    talis:  { rmin: 120, rmax: 320, wind: 0.8, cd: [4, 6] },
    scream: { rmin: 0,   rmax: 420, wind: 0.4, cd: [10, 14] },
  };
  // per realm: sprite names (z22_*), the base arche (stats/AI), skill, and display names
  const ZB = {
    md: {
      walker:  { arche: 'walker', imgs: ['z22_mod_office', 'z22_mod_nurse', 'z22_mod_police', 'z22_mod_worker'], names: ['Xác văn phòng', 'Xác y tá', 'Xác cảnh sát', 'Xác công nhân'] },
      runner:  { arche: 'runner', imgs: [], names: [] },
      bloat:   { arche: 'exploder', imgs: ['z22_mod_bloat'], names: ['Xác phình'] },
      soldier: { arche: 'ranged', off: true, skill: 'gun', imgs: ['z22_mod_soldier'], names: ['Lính Thây Ma'] },
      screamer:{ arche: 'walker', skill: 'scream', imgs: ['z22_md_screamer'], names: ['Thây Ma La Hét'] },
      mutant:  { arche: 'brute', skill: 'charge', imgs: ['z22_md_mutant'], names: ['Đột Biến'] },
    },
    tt: {
      walker:  { arche: 'walker', imgs: ['z22_tt_villager', 'z22_tt_guard'], names: ['Dân làng xác', 'Lính canh xác'] },
      runner:  { arche: 'runner', imgs: [], names: [] },
      bloat:   { arche: 'exploder', imgs: [], names: [] },
      sword:   { arche: 'ranged', off: true, skill: 'qi', imgs: ['z22_tt_sword'], names: ['Kiếm Thi'] },
      talisman:{ arche: 'walker', skill: 'talis', imgs: ['z22_tt_talisman'], names: ['Phù Thi'] },
      elder:   { arche: 'armored', skill: 'leap', imgs: ['z22_tt_elder'], names: ['Cương Thi Trưởng Lão'] },
    },
    sl: {
      walker:  { arche: 'walker', imgs: [], names: [] },
      runner:  { arche: 'runner', imgs: [], names: [] },
      bloat:   { arche: 'exploder', imgs: [], names: [] },
      hsword:  { arche: 'runner', skill: 'lunge', imgs: ['z22_sl_hsword'], names: ['Thợ Săn Kiếm'] },
      hmage:   { arche: 'ranged', off: true, skill: 'fire', imgs: ['z22_sl_hmage'], names: ['Thợ Săn Pháp Sư'] },
      htank:   { arche: 'armored', skill: 'slam', imgs: ['z22_sl_htank'], names: ['Thợ Săn Giáp'] },
    },
  };
  const SKILL_P = [0.03, 0.10, 0.22];   // share of skill types by zone 0/1/2 (times dayF)
  const dayF = d => Math.min(2, 0.6 + 0.1 * (d - 1));

  const zbState = () => { const v = G.v10; if (!v) return { tip: 0, wasNight: false, gnext: 0 }; return v.zb || (v.zb = { tip: 0, wasNight: false, gnext: 0 }); };
  const zbGuest = () => typeof Net !== 'undefined' && Net.active && Net.guest;
  const zoneAt = (x, y) => { const sb = World.sbs.get(nkey(Math.floor(x / SBPX), Math.floor(y / SBPX))); return sb && sb.zone != null ? sb.zone : 0; };
  const inView = (x, y) => { const v = G.view; return !!v && x > v.x0 - 40 && x < v.x1 + 40 && y > v.y0 - 40 && y < v.y1 + 40; };
  const zbAlive = () => { let n = 0; for (const z of G.zombies) if (z.zb && !z.dead && !z.still) n++; return n; };
  const risers = [];                    // people killed by monsters, standing up in 3 s (not saved)
  let spT = 0;                          // spawner timer

  // ---------- day scaling (every enemy) ----------
  Object.assign(G, {
    dayMul() { return Math.min(5, 1 + 0.1 * ((this.day || 1) - 1)); },
  });
  const se = G.spawnEnemy;
  G.spawnEnemy = function (arche, x, y, o) {
    o = Object.assign({}, o || {});
    if (o.lvl == null) o.lvl = World.levelAt(x, y);        // the day term of the old constructor is replaced by the stats below
    const z = se.call(this, arche, x, y, o);
    const day = this.day || 1, m = G.dayMul();
    z.maxHp *= m; z.hp *= m; z.dmg *= m; z.xp *= 1 + 0.05 * (day - 1);
    return z;
  };

  // ---------- gates: more of them, the cap grows with level ----------
  const gt = G.gateTick;
  G.gateTick = function (dt) {
    const g = gtState(), P = this.player, zb = zbState();
    if (g && World.mode === 'over' && !P.dead && this.state === 'playing' && !coopOn() && this.frame % 30 === 0) {
      if (isFinite(g.next) && g.next > zb.gnext) zb.gnext = g.next;       // exitDungeon pushes g.next back: respect it
      const press = this.gatePressure();
      if (press > 0 && this.time >= zb.gnext) {
        const open = g.list.filter(r => !r.done && !r.static).length;
        const cap = Math.max(1, Math.round(clamp(3 + Math.floor(P.level / 6), 3, 8) * press));
        if (open < cap) zb.gnext = this.time + (this.spawnGate() ? R.range(35, 80) / Math.max(0.25, press) : 8);
        else zb.gnext = this.time + 20;
      }
    }
    // the v20 schedule (cap 2-5, every 55-120 s) is switched off here: g.next is parked while it runs
    const saved = g ? g.next : 0;
    if (g) g.next = Infinity;
    try { return gt.call(this, dt); } finally { if (g) g.next = saved; }
  };

  // ---------- zombie factory ----------
  const zbRollTier = zone => {
    const day = G.day || 1, f = dayF(day);
    const p2 = [0, 0.02, 0.05][zone] * (day >= 3 ? f : 0);
    const p1 = [0.03, 0.07, 0.12][zone] * f;
    const r = Math.random();
    return r < p2 ? 2 : r < p2 + p1 ? 1 : 0;
  };
  const zbPickType = (realm, zone) => {
    const D = ZB[realm];
    if (Math.random() < SKILL_P[zone] * dayF(G.day || 1)) {
      const ks = Object.keys(D).filter(k => D[k].skill);
      return ks[Math.floor(Math.random() * ks.length)];
    }
    const r = Math.random();
    return r < 0.62 ? 'walker' : r < 0.88 ? 'runner' : 'bloat';
  };
  Object.assign(G, {
    spawnZombie22(x, y, opts) {
      opts = opts || {};
      const id = RL.id, realm = ZB[id] ? id : 'sl';
      const zone = opts.zone != null ? opts.zone : zoneAt(x, y);
      const king = opts.type === 'king';
      const type = king ? 'king' : opts.type || zbPickType(realm, zone);
      const def = king ? null : ZB[realm][type];
      if (!king && !def) return null;
      const arche = king ? 'boss' : def.arche;
      const idx = ARCHE_ORDER.indexOf(arche);
      const base = RL.enemies[idx];
      const k = def && def.imgs.length ? Math.floor(Math.random() * def.imgs.length) : 0;
      const img = king ? spr22('z22_' + realm + '_king', base) : def.imgs.length ? spr22(def.imgs[k], base) : base;
      const tier = king ? 0 : opts.tier != null ? opts.tier : zbRollTier(zone);
      const baseName = king ? 'Thây Ma Vương' : ((def.names[k] || def.names[0]) || RL.enemyNames[idx]);
      const z = this.spawnEnemy(arche, x, y, { lvl: opts.lvl || World.levelAt(x, y), state: opts.state || 'wander', rise: !!opts.rise, name: baseName, hpMul: king ? 0.45 : 1 });
      z.img = img;
      z.undead = true;                                          // craft package: bone drops from undead
      if (king) z.upright = true;                               // the king is a 3/4 sprite: drawn upright like the bosses
      z.zb = true; z.zbType = type; z.zbTier = tier; z.zbPlace = opts.place || 'road';
      if (opts.sbk != null) z.sbk = opts.sbk;
      if (opts.still) z.still = true;
      if (king) z.zbKing = true;
      if (def) {
        if (def.off) z.t = Object.assign({}, z.t, { ranged: false });        // shooters: the shot below replaces the base shot
        if (def.skill) z.zbS = { k: 'ready', kind: def.skill, t: 0, cd: R.range(1, 3), n: 0, np: false };
      }
      const T = TIER[tier];
      if (tier) { z.maxHp *= T.hp; z.hp *= T.hp; z.dmg *= T.dmg; z.scale *= T.sc; z.r *= T.sc; z.xp *= T.xp; }
      return z;
    },
  });

  // a random loaded spot 450-900 px from P: 'road' (ROAD/SIDEWALK/BRIDGE outside buildings) or 'house' (a floor tile of a building that is not the player's)
  const zbSample = (P, kind, rmin, rmax) => {
    const pb = World.bldAt(P.x, P.y);
    for (let k = 0; k < 16; k++) {
      const a = R.range(0, TAU), d = R.range(rmin, rmax);
      const x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
      const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
      const sb = World.sbs.get(nkey(Math.floor(tx / SB), Math.floor(ty / SB)));
      if (!sb || sb.zone == null) continue;
      const i = (ty - sb.ty0) * SB + (tx - sb.tx0), bi = sb.bld[i], t = sb.tiles[i];
      if (!World.walkable(tx, ty)) continue;
      if (kind === 'house') {
        if (bi < 0 || sb.zone < 1 || sb.poi) continue;
        const b = sb.buildings[bi];
        if (!b || b === pb || tx <= b.x0 || tx >= b.x1 || ty <= b.y0 || ty >= b.y1) continue;
      } else if (bi >= 0 || (t !== T.ROAD && t !== T.SIDEWALK && t !== T.BRIDGE)) continue;
      if (inView(x, y)) continue;
      return { x: tx * TILE + 16, y: ty * TILE + 16, sb };
    }
    return null;
  };

  // ---------- skills: wind-up at range, act, then rest ----------
  const zbStrike = (z, dmg, np, ls, parryable) => {
    const P = G.player; if (!P || P.dead) return;
    const before = P.hp;
    z.noParry = !!np;
    z._strikeNow = !!parryable;
    try { G.hurtTarget(P, dmg, z); } finally { z.noParry = false; z._strikeNow = false; }
    const dealt = before - P.hp;
    if (ls && dealt > 0 && !z.dead) z.hp = Math.min(z.maxHp, z.hp + dealt * ls);
  };
  const rest = (z, S) => { const K = KIND[S.kind]; S.k = 'ready'; S.cd = R.range(K.cd[0], K.cd[1]); S.n++; };
  const dashTo = (z, S, P, spd, t, dmg, ls) => {
    const dx = P.x - z.x, dy = P.y - z.y, d = Math.hypot(dx, dy) || 1;
    S.k = 'dash'; S.t = t; S.spd = spd; S.dx = dx / d; S.dy = dy / d; S.dmg = dmg; S.ls = ls; S.hit = 0; S.pa = true;   // dash impacts are parryable
    z.lunge = 1;
  };
  const shoot = (z, dmg, proj, col, speed, life, sfx) => {
    const P = G.player, a = Math.atan2(P.y - z.y, P.x - z.x);
    Bullets.fire(z.x, z.y, a, { speed }, dmg, { hostile: true, proj, col, life, speed });
    Sound.at(sfx, z.x, z.y, 0.35, R.range(0.9, 1.2));
  };
  const ACT = {
    lunge: (z, S, P) => dashTo(z, S, P, 640, 0.2, z.dmg * 1.5, 0),
    leap: (z, S, P) => dashTo(z, S, P, 460, 0.36, z.dmg * 1.3, 0.35),
    charge: (z, S, P) => dashTo(z, S, P, 440, 0.45, z.dmg * 1.5, 0),
    fire: (z, S) => { shoot(z, z.dmg * 1.2, 'eshot', '#ff7a2a', 300, 1.8, 'sfx_magic2'); rest(z, S); },
    qi: (z, S) => { shoot(z, z.dmg * 1.1, 'wave', '#cfe8ff', 420, 1.4, 'sfx_sword2'); rest(z, S); },
    gun: (z, S) => { shoot(z, z.dmg, 'eshot', '#ffe08a', 620, 1.2, 'sfx_pistol'); rest(z, S); },
    slam: (z, S, P) => {
      FX.ring(z.x, z.y, 14, 150, '#c9a36b', 0.5, 5);
      Particles.dust(z.x, z.y, 10);
      Sound.at('sfx_explosion', z.x, z.y, 0.45, 0.7);
      G.shake(6);
      if (dist(z.x, z.y, P.x, P.y) < 150 + (P.r || 11)) zbStrike(z, z.dmg * 1.5, true, 0);
      rest(z, S);
    },
    talis: (z, S, P) => {
      if (dist(P.x, P.y, S.gx, S.gy) < 40) {
        if (!(P.dashT > 0)) P.rooted = 0.6;
        zbStrike(z, z.dmg * 0.8, true, 0);
        Floaters.add(P.x, P.y - 24, 'ĐỊNH THÂN!', '#ffd65a', 11, true);
      } else Floaters.add(P.x, P.y - 24, 'NÉ ĐƯỢC!', '#9affff', 10);
      rest(z, S);
    },
    scream: (z, S, P) => {
      FX.ring(z.x, z.y, 10, 280, '#b46bff', 0.45, 3);
      Sound.at('sfx_zombie3', z.x, z.y, 0.7, 0.8);
      for (const o of G.zgrid.query(z.x, z.y, 520)) {
        if (o === z || o.dead || o.boss || o.rise > 0) continue;
        if (o.state !== 'chase') { o.state = 'chase'; o.tgt = P; o.lastSeen = { x: P.x, y: P.y }; o.lostT = 0; o.still = false; }
      }
      for (let k = 0; k < 2 && zbAlive() < ZB_CAP; k++) G.spawnZombie22(z.x + R.range(-40, 40), z.y + R.range(-40, 40), { type: 'walker', place: z.zbPlace, state: 'chase', zone: zoneAt(z.x, z.y) });
      rest(z, S);
    },
  };
  const zbTrigger = (z, S, dt, P) => {
    S.cd -= dt;
    if (S.cd > 0 || z.state !== 'chase' || z.tgt !== P) return;
    const K = KIND[S.kind], dx = P.x - z.x, dy = P.y - z.y, d = Math.hypot(dx, dy);
    if (d < K.rmin || d > K.rmax || !World.los(z.x, z.y, P.x, P.y)) return;
    S.k = 'wind'; S.t = K.wind; S.gx = P.x; S.gy = P.y;
    z.wind = null;                 // PA's own windup must not strike during this skill
  };
  const zbRun = (z, S, dt) => {
    const P = G.player;
    if (S.k === 'wind') {
      S.t -= dt; z.angle = Math.atan2(P.y - z.y, P.x - z.x);
      if (S.t <= 0) ACT[S.kind](z, S, P);
      return;
    }
    if (S.k === 'dash') {
      S.t -= dt;
      const hit = z.move(S.dx * S.spd * dt, S.dy * S.spd * dt);
      z.angle = Math.atan2(S.dy, S.dx);
      if (!S.hit && dist(z.x, z.y, P.x, P.y) < z.r + (P.r || 11) + 8) { S.hit = 1; zbStrike(z, S.dmg, false, S.ls, S.pa); S.t = 0; }
      if (hit || S.t <= 0) rest(z, S);
    }
  };

  // ---------- zombie AI wrapper ----------
  const eu = Enemy.prototype.update;
  Enemy.prototype.update = function (dt) {
    if (!this.zb || this.dead || this.rise > 0 || zbGuest()) return eu.call(this, dt);
    const P = G.player;
    if (this.still) { if (this.state === 'chase') this.still = false; else { this.state = 'wander'; this.target = null; this.wa = null; this.wanderT = 99; } }
    const S = this.zbS;
    if (!S || !P || P.dead || P.car) return eu.call(this, dt);
    if (S.k === 'ready') {
      if (this.stun > 0) S.cd = 1; else zbTrigger(this, S, dt, P);
      if (S.k === 'ready') return eu.call(this, dt);
    } else if (this.stun > 0) { S.k = 'ready'; S.cd = 1; return eu.call(this, dt); }
    // wind-up or dash: the base update runs for burn/poison/stun, but it may not hit or move the zombie
    const x0 = this.x, y0 = this.y;
    this.attackCd = Math.max(this.attackCd, 0.1);
    eu.call(this, dt);
    this.x = x0; this.y = y0;
    if (this.dead) return;
    zbRun(this, S, dt);
  };

  // a shield for the Thợ Săn Giáp while it chases: half damage (slam is its only skill kind)
  const he = G.hitEnemy;
  G.hitEnemy = function (z, dmg, kx, ky, src, ang, wp) {
    if (z.zb && z.zbS && z.zbS.kind === 'slam' && z.zbS.k === 'ready' && z.state === 'chase') dmg *= 0.5;
    return he.call(this, z, dmg, kx, ky, src, ang, wp);
  };

  // ---------- drawing: wind-up marks, tier-coloured names ----------
  const ed = Enemy.prototype.draw;
  Enemy.prototype.draw = function (ctx) {
    ed.call(this, ctx);
    if (!this.zb || this.dead || this.rise > 0) return;
    ctx.globalAlpha = 1;
    const S = this.zbS, P = G.player;
    if (S && S.k === 'wind') {
      const pulse = 0.5 + 0.5 * Math.sin(G.time * 14);
      if (S.kind === 'talis') { ctx.strokeStyle = `rgba(255,70,70,${0.4 + pulse * 0.4})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(S.gx, S.gy, 40, 0, TAU); ctx.stroke(); }
      if (S.kind === 'slam') { ctx.strokeStyle = `rgba(255,70,70,${0.3 + pulse * 0.3})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(this.x, this.y, 150, 0, TAU); ctx.stroke(); }
      ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = S.t < 0.15 ? '#ffd24a' : '#ff3b3b';
      ctx.fillText('!', this.x, this.y - this.r - 16);
    }
    if (P && (this.zbTier > 0 || this.zbS || this.zbKing) && dist(this.x, this.y, P.x, P.y) < 260) {
      const label = (this.zbKing ? '' : TIER[this.zbTier || 0].name) + this.name + ' Lv' + this.lvl;
      ctx.font = '9px VT323, monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillText(label, this.x + 1, this.y - this.r - 21);
      ctx.fillStyle = this.zbKing ? KING_COL : TIER[this.zbTier || 0].col; ctx.fillText(label, this.x, this.y - this.r - 22);
    }
  };

  // ---------- civilians killed by monsters stand up as zombies after 3 s ----------
  const ah = Ally.prototype.hurt;
  Ally.prototype.hurt = function (d, src) {
    const was = this.dead;
    ah.call(this, d, src);
    if (!was && this.dead && (this.kind === 'civ' || this.kind === 'villager' || this.kind === 'elder') && !zbGuest()) {
      risers.push({ t: G.time + 3, x: this.x, y: this.y });
      const zb = zbState();
      if (!zb.tip) { zb.tip = 1; SYS.msg('Người dân bị quái giết sẽ đứng dậy thành thây ma sau 3 giây. Hãy cứu họ trước khi quái kịp hạ gục.', 'warn'); }
    }
  };

  // ---------- the spawner (overworld) and the night boss ----------
  Object.assign(G, {
    zbTick(dt) {
      const P = this.player; if (!P) return;
      if (P.rooted > 0 && this.state === 'playing') P.rooted = Math.max(0, P.rooted - dt);
      if (World.mode !== 'over') { risers.length = 0; return; }
      if (P.dead || this.state !== 'playing' || zbGuest()) return;
      for (let i = risers.length - 1; i >= 0; i--) {
        const r = risers[i];
        if (this.time >= r.t) { risers.splice(i, 1); this.spawnZombie22(r.x, r.y, { type: 'walker', place: 'risen', state: 'chase', rise: true, zone: zoneAt(r.x, r.y) }); }
      }
      const zb = zbState(), nightNow = !!this.night, zone = zoneAt(P.x, P.y), day = this.day || 1;
      if (nightNow && !zb.wasNight) {
        zb.wasNight = true;                                    // one roll per night
        if (day >= 3 && zone === 2 && Math.random() < 0.35 && !this.zombies.some(z => z.zbKing && !z.dead)) {
          const p = zbSample(P, 'road', 650, 900);
          if (p) { this.spawnZombie22(p.x, p.y, { type: 'king', place: 'road' }); UI.banner('THÂY MA VƯƠNG', 'Đêm nay một Thây Ma Vương lang thang trong vùng hiểm...', '#ff4a3a'); Sound.play('sfx_gong', 0.6, 0.8); }
        }
      } else if (!nightNow) zb.wasNight = false;
      spT -= dt; if (spT > 0) return;
      spT = 0.6;
      // blocks loaded before the player existed (or far away at load): house zombies once, when the block is near
      for (const sb of World.sbs.values()) {
        if (sb._zbS || dist(sb.tx0 * TILE + SBPX / 2, sb.ty0 * TILE + SBPX / 2, P.x, P.y) > 1400) continue;
        sb._zbS = 1;
        if (sb.poi || !(sb.zone >= 1) || World.legacy22(sb)) continue;
        zbPlaceStill(sb, P);
      }
      // roaming zombies: density by the player's zone; roads at night x1.6, houses in daytime x1.3
      const D = [3, 8, 14][zone], dT = 1 + 0.05 * (day - 1);
      const roadT = D * dT * (nightNow ? 1.6 : 1);
      const houseT = zone >= 1 ? D * dT * (nightNow ? 1 : 1.3) : 0;
      if (zbAlive() >= ZB_CAP) return;
      let nr = 0, nh = 0;
      for (const z of this.zombies) if (z.zb && !z.dead && !z.still && dist(z.x, z.y, P.x, P.y) < ZB_NEAR) { if (z.zbPlace === 'road') nr++; else if (z.zbPlace === 'house') nh++; }
      let budget = 2;
      if (nr < roadT) { const p = zbSample(P, 'road', 450, 900); if (p) { this.spawnZombie22(p.x, p.y, { place: 'road', zone: p.sb.zone }); budget--; } }
      if (budget > 0 && nh < houseT) { const p = zbSample(P, 'house', 450, 900); if (p) this.spawnZombie22(p.x, p.y, { place: 'house', zone: p.sb.zone, sbk: p.sb.key }); }
    },
  });
  const vt = G.v5Tick;
  G.v5Tick = function (dt) { vt.call(this, dt); this.zbTick(dt); };

  // ---------- houses of the zone 1-2 overworld hold 0-3 still zombies (jumpscare spots for the FV package) ----------
  // Runs once per block: from genOver when a player exists, else from the spawner tick (the starting blocks load before the player).
  const zbPlaceStill = (sb, P) => {
    // only raw arrays here: genOver runs before the block is registered in World.sbs
    const pbx = Math.floor(P.x / TILE), pby = Math.floor(P.y / TILE);
    const pIn = pbx >= sb.tx0 && pbx < sb.tx0 + SB && pby >= sb.ty0 && pby < sb.ty0 + SB;
    sb.buildings.forEach((b, bi) => {
      if (b.x1 - b.x0 < 3 || b.y1 - b.y0 < 3 || Math.random() < 0.5) return;
      if (pIn && sb.bld[(pby - sb.ty0) * SB + (pbx - sb.tx0)] === bi) return;
      const n = R.int(1, 3);
      for (let k = 0; k < n; k++) {
        const tx = R.int(b.x0 + 1, b.x1 - 1), ty = R.int(b.y0 + 1, b.y1 - 1);
        const i = (ty - sb.ty0) * SB + (tx - sb.tx0);
        if (sb.bld[i] !== bi || World.isSolidT(sb.tiles[i])) continue;
        G.spawnZombie22(tx * TILE + 16, ty * TILE + 16, { place: 'house', still: true, sbk: sb.key, zone: sb.zone });
      }
    });
  };
  const go = World.genOver;
  World.genOver = function (sb) {
    const r = go.call(this, sb);
    if (this._temp || this.mode !== 'over' || this.legacy22(sb) || sb.poi || !(sb.zone >= 1) || zbGuest() || !G.player) return r;
    sb._zbS = 1;
    zbPlaceStill(sb, G.player);
    return r;
  };

  // ---------- the player cannot walk while rooted (talisman) ----------
  const sm = Player.prototype.speedMul;
  Player.prototype.speedMul = function () { return this.rooted > 0 ? 0 : sm.call(this); };

  // ---------- HUD: the day label shows the monster multiplier ----------
  const uu = UI.update;
  UI.update = function (dt) {
    const r = uu.call(this, dt);
    if (World.mode === 'over' && G.day && ['playing', 'paused', 'menu', 'levelup', 'dialog'].includes(G.state)) {
      const el = document.getElementById('dayN'), want = 'NGÀY ' + G.day + ' • Quái ×' + G.dayMul().toFixed(1);
      if (el && el.textContent !== want) el.textContent = want;
    }
    return r;
  };
})();
