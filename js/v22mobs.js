// ===== v22 MB: six new monster kinds, two boss variants per world, boss mods Hồi Sinh / Phân Thân =====
// Data is added in place: ARCHE + ARCHE_ORDER (indices 7..12, ARCHE[kind].windup = melee windup for PA), REALMS[*].enemies / enemyNames,
// GT_POOL, BOSSES, BOSS_MODS, G.pickArche.
// Ordinary melee belongs to PA (v22parry.js): it owns z.wind, the "!" telegraph and the parry roll (src._strikeNow).
// Special moves (leaper pounce, charger charge) keep their state in z.m22s, draw their own telegraph, and set _strikeNow only
// on the impact hurt call. Burrower eruption passes a plain noParry source (PA ignores non-Enemy sources).
// "Hack mode": while a kind moves by its own rules, z.stun is kept just above zero so the base update returns early.
// Real stuns (parry, wall) take over and the base handles them.
// Sprites: m22_<realm>_<kind> comes from the atlas (picked at spawn). Realm lists keep only old sprites, so nothing is requested loose.
(function () {
  const KINDS = ['leaper', 'shielder', 'burrower', 'summoner', 'charger', 'healer']; // = ARCHE_ORDER 7..12

  // ---------- data ----------
  Object.assign(ARCHE, {
    leaper:   { hp: 40,  spd: 70, dmg: 12, r: 12, xp: 22, rate: 1.0, windup: 0.4 },
    shielder: { hp: 110, spd: 36, dmg: 12, r: 14, xp: 30, knockRes: 0.5, rate: 1.1, windup: 0.6 },
    burrower: { hp: 90,  spd: 48, dmg: 16, r: 14, xp: 30, rate: 1.0, windup: 0.5 },
    summoner: { hp: 55,  spd: 30, dmg: 4,  r: 12, xp: 30, rate: 1.0, windup: 0.4 },
    charger:  { hp: 170, spd: 40, dmg: 22, r: 18, xp: 42, knockRes: 0.8, rate: 1.2, windup: 0.5 },
    healer:   { hp: 60,  spd: 36, dmg: 4,  r: 12, xp: 28, rate: 1.0, windup: 0.4 },
  });
  for (const k of KINDS) ARCHE_ORDER.push(k);

  const M22_NAMES = {
    md: { leaper: 'Thây Ma Vồ', shielder: 'Cảnh Sát Khiên Chống Bạo', burrower: 'Thây Ma Cống Ngầm', summoner: 'Thây Ma La Hét', charger: 'Thây Ma Xe Ủi', healer: 'Thây Ma Y Tá Đột Biến' },
    tt: { leaper: 'Hắc Lang Vương', shielder: 'Thạch Giáp Vệ', burrower: 'Địa Long', summoner: 'Quỷ Đồng Tử', charger: 'Bạo Hùng', healer: 'Độc Thiềm Tiên' },
    sl: { leaper: 'Thú Ma Nhảy', shielder: 'Kỵ Sĩ Khiên', burrower: 'Giun Đá', summoner: 'Pháp Sư Triệu Hồi', charger: 'Ngưu Ma', healer: 'Tư Tế Bóng Tối' },
  };
  const M22_FB = { leaper: 1, shielder: 4, burrower: 0, summoner: 3, charger: 2, healer: 0 };   // old sprite of the same world (index in enemies)
  // realm lists get the old sprite; the m22_ sprite is looked up in IMG at spawn (atlas), so no loose PNG is ever requested
  for (const rid of Object.keys(REALMS)) {
    const RR = REALMS[rid], nm = M22_NAMES[rid] || M22_NAMES.sl;
    for (const k of KINDS) { RR.enemies.push(RR.enemies[M22_FB[k]]); RR.enemyNames.push(nm[k]); }
  }

  const M22_COL = { leaper: '#ff9a3c', shielder: '#9ad8ff', burrower: '#c08a4a', summoner: '#b46bff', charger: '#ff4a4a', healer: '#6dff9a' };
  const M22_TINT = {
    leaper: 'hue-rotate(-35deg) saturate(1.5) brightness(1.1)', shielder: 'hue-rotate(185deg) saturate(0.5) brightness(1.15)',
    burrower: 'sepia(0.7) saturate(1.4) brightness(0.85)', summoner: 'hue-rotate(240deg) saturate(1.6)',
    charger: 'hue-rotate(-20deg) saturate(1.8)', healer: 'hue-rotate(95deg) saturate(1.4) brightness(1.1)',
  };
  const M22_BLOCK = new Set(['gun', 'melee', 'skill', 'ally', 'car']);                                       // hits a shield can stop
  // loot tags read by other packages (craft: leather from beasts, bone from undead)
  const M22_FLAG = {
    md: { leaper: 'undead', burrower: 'undead', summoner: 'undead', charger: 'undead', healer: 'undead' },
    tt: { leaper: 'beast', burrower: 'beast', charger: 'beast' },
    sl: { leaper: 'beast', burrower: 'beast', charger: 'beast' },
  };

  // cost table: kinds that appear per gate rank (summoner / healer from C)
  const GT_ADD = {
    D: { leaper: 6, shielder: 3 },
    C: { leaper: 6, shielder: 6, burrower: 4, charger: 5, summoner: 3, healer: 3 },
    B: { leaper: 6, shielder: 8, burrower: 5, charger: 8, summoner: 5, healer: 5 },
    A: { leaper: 6, shielder: 10, burrower: 5, charger: 10, summoner: 6, healer: 6 },
    S: { leaper: 6, shielder: 12, burrower: 6, charger: 12, summoner: 7, healer: 7 },
  };
  for (const r of Object.keys(GT_ADD)) Object.assign(GT_POOL[r], GT_ADD[r]);

  // boss variants: a v22 sprite (picked at spawn through m22), scaled up, with their own pattern
  const bossVariant = (rid, kind, pat, name, col, scale) => ({ img: REALMS[rid].enemies[M22_FB[kind]], m22: kind, name, pat, col, scale });
  BOSSES.md.push(bossVariant('md', 'charger', ['charge', 'slam', 'summon', 'volley'], 'Xe Ủi Thây Vương', '#ff7a3c', 1.3));
  BOSSES.md.push(bossVariant('md', 'summoner', ['summon', 'volley', 'teleport', 'nova'], 'La Hét Thây Vương', '#b46bff', 1.2));
  BOSSES.tt.push(bossVariant('tt', 'charger', ['charge', 'slam', 'trail', 'meteor'], 'Bạo Hùng Vương', '#ff3b5a', 1.3));
  BOSSES.tt.push(bossVariant('tt', 'summoner', ['summon', 'spiral', 'teleport', 'shotgun'], 'Quỷ Đồng Tử Chúa', '#b46bff', 1.2));
  BOSSES.sl.push(bossVariant('sl', 'charger', ['charge', 'slam', 'nova', 'summon'], 'Ngưu Ma Vương', '#ff4a4a', 1.3));
  BOSSES.sl.push(bossVariant('sl', 'summoner', ['summon', 'spiral', 'teleport', 'meteor'], 'Pháp Sư Triệu Hồi Tối Thượng', '#6b5bff', 1.2));
  // the mod's extra pattern name is pushed into boss.pat by the Enemy ctor; the behaviour lives below
  BOSS_MODS.push({ id: 'revive', name: 'Hồi Sinh', extra: 'revive' }, { id: 'split', name: 'Phân Thân', extra: 'split' });

  // ---------- helpers ----------
  const turnTo = (a, b, k) => a + angDiff(a, b) * Math.min(1, k);
  // hack mode: the base update returns early on stun, we move the enemy ourselves
  const hackOn = (z, dt) => { z.m22hack = true; z.m22hs = dt + 0.05; z.stun = z.m22hs; };
  // leaving hack mode: keep a real stun (set by a parry or a wall), and let the base melee wait a moment
  const hackOff = z => { if (z.m22hack) { z.m22hack = false; if (z.stun < 0.1) z.stun = 0; if (!(z.attackCd >= 0.35)) z.attackCd = 0.35; } };
  // a parryable strike: PA reads _strikeNow on the source
  const strike = (z, tgt, dmg) => { z._strikeNow = true; try { G.hurtTarget(tgt, dmg, z); } finally { z._strikeNow = false; } };
  // what a kind does while the player is near, unless it is in a special move: nothing, PA handles ordinary melee

  // ---------- leaper: circles the target, then pounces 220 px (windup 0.55 s, ground ring, parryable impact) ----------
  function leaperTick(z, s, dt, tgt, dx, dy, d) {
    const aware = z.state === 'chase' && d < 420;
    const ux = dx / d, uy = dy / d;
    switch (s.ph || 'idle') {
      case 'idle':
        hackOff(z);
        if (aware && s.cd <= 0 && d < 300 && World.los(z.x, z.y, tgt.x, tgt.y)) { s.ph = 'orbit'; s.ot = R.range(1.2, 2); s.og = 0; }
        return;
      case 'orbit': {
        if (!aware) { s.ph = 'idle'; s.cd = 1.5; hackOff(z); return; }
        hackOn(z, dt);
        s.ot -= dt; s.og += dt;
        const rad = Math.max(-120, Math.min(120, (d - 215) * 2.2));
        z.move((-uy * s.side * 140 + ux * rad) * dt, (ux * s.side * 140 + uy * rad) * dt);
        z.walkT += dt * 1.6;
        z.angle = turnTo(z.angle, Math.atan2(dy, dx), dt * 8);
        if (s.ot <= 0 && d >= 186 && d <= 244) {
          // 220 px, or just past the target when it stands closer (so the landing is not inside a wall behind it)
          const ang = Math.atan2(dy, dx), L = Math.min(220, d + 12), lx = z.x + Math.cos(ang) * L, ly = z.y + Math.sin(ang) * L;
          if (World.walkable(Math.floor(lx / TILE), Math.floor(ly / TILE)) && World.los(z.x, z.y, lx, ly)) {
            s.ph = 'wind'; s.t = 0.55; s.ang = ang; s.lx = lx; s.ly = ly;
          } else s.ot = 0.4; // landing spot is blocked: keep circling and try again
        } else if (s.og > 4) { s.ph = 'idle'; s.cd = 2; hackOff(z); }
        return;
      }
      case 'wind':
        hackOn(z, dt); s.t -= dt;
        z.angle = turnTo(z.angle, s.ang, dt * 10);
        if (s.t <= 0) { s.ph = 'fly'; s.ft = 0; s.sx = z.x; s.sy = z.y; z.lunge = 1; Sound.at('sfx_monster', z.x, z.y, 0.6, 1.3); }
        return;
      case 'fly': {
        hackOn(z, dt);
        s.ft += dt;
        const k = Math.min(1, s.ft / 0.35);
        const hit = z.move(s.sx + (s.lx - s.sx) * k - z.x, s.sy + (s.ly - s.sy) * k - z.y);
        s.air = Math.sin(Math.PI * k) * 26;
        if (k >= 1 || (hit && k > 0.15)) pounceLand(z, s, tgt);
        return;
      }
      default: // 'land'
        hackOn(z, dt); s.t -= dt;
        if (s.t <= 0) { s.ph = 'idle'; s.cd = R.range(4, 5.5); hackOff(z); }
    }
  }
  function pounceLand(z, s, tgt) {
    s.ph = 'land'; s.t = 0.6; s.air = 0;
    FX.ring(z.x, z.y, 8, 44, M22_COL.leaper, 0.35, 4); Particles.debris(z.x, z.y, 8); G.shake(3);
    if (dist(z.x, z.y, tgt.x, tgt.y) < z.r + (tgt.r || 11) + 16) strike(z, tgt, z.dmg * 1.5);
  }

  // ---------- shielder: a shield in front blocks 80% of direct hits; the shield turns slowly, so a flank works ----------
  function shielderTick(z, s, dt, tgt, dx, dy) {
    hackOff(z);
    const want = z.state === 'chase' ? Math.atan2(dy, dx) : z.angle;
    s.sh = turnTo(s.sh != null ? s.sh : z.angle, want, dt * 2.2);
    if (s.shBreak > 0) s.shBreak -= dt;
  }

  // ---------- burrower: digs (invisible, untouchable), surfaces under the player, cracks for 0.8 s, then erupts (no parry) ----------
  function burrowerTick(z, s, dt, tgt, dx, dy, d) {
    if (s.ph === 'dig') {
      hackOn(z, dt); s.t -= dt;
      z.move(dx / d * 190 * dt, dy / d * 190 * dt);
      z.angle = Math.atan2(dy, dx); z.walkT += dt * 4;
      if (d < 46 || s.t <= 0) {
        s.ph = 'crack'; s.ct = 0.8;
        if (dist(z.x, z.y, tgt.x, tgt.y) < 300) Floaters.add(z.x, z.y - 30, 'NỨT ĐẤT!', M22_COL.burrower, 10, true);
      }
      return;
    }
    if (s.ph === 'crack') {
      hackOn(z, dt); s.ct -= dt;
      if (s.ct <= 0) {
        s.ph = 'surface'; s.under = false; s.cd = R.range(6, 8); hackOff(z);
        FX.ring(z.x, z.y, 10, 72, M22_COL.burrower, 0.4, 6); Particles.debris(z.x, z.y, 22); G.shake(9);
        Sound.at('sfx_explosion', z.x, z.y, 0.5, 0.8);
        if (dist(z.x, z.y, tgt.x, tgt.y) < 50) G.hurtTarget(tgt, z.dmg * 1.4, { x: z.x, y: z.y, arche: 'burrower', noParry: true });
      }
      return;
    }
    // surface (also the spawn state 'idle')
    s.ph = 'surface';
    hackOff(z);
    if (z.state === 'chase' && s.cd <= 0 && d > 110 && d < 300 && World.los(z.x, z.y, tgt.x, tgt.y)) {
      s.ph = 'dig'; s.t = 1.6; s.under = true; z.attackCd = 0;
    }
  }

  // ---------- keep a distance: back away inside `near`, close in beyond `far`, sidestep between ----------
  function keepDist(z, s, dt, dx, dy, d, near, far, sp) {
    hackOn(z, dt);
    const ux = dx / d, uy = dy / d;
    let vx, vy, k = sp;
    if (d < near) { vx = -ux; vy = -uy; k = sp * 1.3; }
    else if (d > far) { vx = ux; vy = uy; }
    else { vx = -uy * s.side * 0.5; vy = ux * s.side * 0.5; k = sp * 0.5; }
    z.move(vx * k * dt, vy * k * dt);
    z.walkT += dt * k * 0.09;
    z.angle = turnTo(z.angle, Math.atan2(dy, dx), dt * 8);
  }

  // ---------- summoner: keeps its distance, every 8 s calls 2 walkers (level -2), at most 4 alive ----------
  function summonerTick(z, s, dt, tgt, dx, dy, d) {
    if (z.state !== 'chase' || d > 420) { hackOff(z); return; }
    keepDist(z, s, dt, dx, dy, d, 230, 330, 46);
    if (s.sc <= 0 && d < 520) summon(z, s);
  }
  function summon(z, s) {
    s.sc = 8;
    s.kids = (s.kids || []).filter(k => !k.dead && k.hp > 0);
    if (s.kids.length >= 4) return;
    s.made = (s.made || 0) + 2;
    FX.ring(z.x, z.y, 12, 70, M22_COL.summoner, 0.5, 4);
    Sound.at('sfx_ghost', z.x, z.y, 0.5, 1.1);
    for (let i = 0; i < 2; i++) {
      const a = R.range(0, TAU);
      s.kids.push(G.spawnEnemy('walker', z.x + Math.cos(a) * 46, z.y + Math.sin(a) * 46, { lvl: Math.max(1, z.lvl - 2), state: 'chase', rise: true }));
    }
    if (dist(z.x, z.y, G.player.x, G.player.y) < 600) Floaters.add(z.x, z.y - 40, 'TRIỆU HỒI!', M22_COL.summoner, 11, true);
  }

  // ---------- healer: heals every monster (not bosses) within 180 px at 4% max hp per second; runs from the player ----------
  function healerTick(z, s, dt, tgt, dx, dy, d) {
    if (z.state === 'chase' && d < 420) keepDist(z, s, dt, dx, dy, d, 260, 400, 52);
    else hackOff(z);
    let any = false;
    for (const o of G.zgrid.query(z.x, z.y, 180)) {
      if (o === z || o.dead || o.boss || o.hp <= 0 || o.hp >= o.maxHp) continue;
      if (dist(z.x, z.y, o.x, o.y) > 180) continue;
      o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.04 * dt); any = true;
      if (Math.random() < dt * 3) Particles.burst(o.x, o.y - o.r, 1, M22_COL.healer, 30, 2);
    }
    s.heal = any ? 0.3 : Math.max(0, (s.heal || 0) - dt);
  }

  // ---------- charger: windup 0.7 s (own telegraph), charges straight; the impact is parryable; a wall stops it, stun 2 s ----------
  function chargerTick(z, s, dt, tgt, dx, dy, d) {
    switch (s.ph || 'idle') {
      case 'idle':
        hackOff(z);
        if (z.state === 'chase' && s.cd <= 0 && d > 70 && d < 300 && World.los(z.x, z.y, tgt.x, tgt.y)) {
          s.ph = 'wind'; s.t = 0.7; s.ang = Math.atan2(dy, dx);
        }
        return;
      case 'wind':
        hackOn(z, dt); s.t -= dt;
        z.angle = turnTo(z.angle, s.ang, dt * 10);
        if (s.t <= 0) { s.ph = 'charge'; s.t = 0.65; s.hit = false; z.lunge = 1; Sound.at('sfx_monster', z.x, z.y, 0.7, 0.9); G.shake(3); }
        return;
      case 'charge': {
        hackOn(z, dt); s.t -= dt; z.walkT += dt * 5;
        const hit = z.move(Math.cos(s.ang) * 430 * dt, Math.sin(s.ang) * 430 * dt);
        if (!s.hit && dist(z.x, z.y, tgt.x, tgt.y) < z.r + (tgt.r || 11) + 6) {
          s.hit = true; strike(z, tgt, z.dmg * 1.3);
          if (tgt === G.player) { G.player.kx += Math.cos(s.ang) * 380; G.player.ky += Math.sin(s.ang) * 380; }
          G.shake(8); s.ph = 'idle'; s.cd = 4.5; hackOff(z);
        } else if (hit) wallCrash(z, s);
        else if (s.t <= 0) { s.ph = 'idle'; s.cd = 3.5; hackOff(z); }
        return;
      }
    }
  }
  function wallCrash(z, s) {
    s.ph = 'idle'; s.cd = 6; hackOff(z);
    z.stun = 2; // a real stun: the base update takes over
    Floaters.add(z.x, z.y - z.r - 12, 'ĐÂM TƯỜNG!', '#ffd24a', 11, true);
    G.shake(7); Particles.debris(z.x, z.y, 14);
  }

  // one frame of a kind's own rules; the base update (and PA for ordinary melee) runs after this
  function tickKind(z, dt) {
    const P = G.player, s = z.m22s;
    if (!s) return;
    s.cd -= dt; s.sc -= dt;
    if (z.m22hack && z.stun > z.m22hs + 0.02) { // a real stun (parry, wall) took over: drop the current action
      z.m22hack = false; s.ph = 'idle'; s.cd = 1.5; s.air = 0;
    }
    if (z.stun > 0 && !z.m22hack) return;
    const tgt = z.tgt && !z.tgt.dead ? z.tgt : (P.car || P);
    const dx = tgt.x - z.x, dy = tgt.y - z.y, d = Math.hypot(dx, dy) || 0.001;
    switch (z.m22) {
      case 'leaper': leaperTick(z, s, dt, tgt, dx, dy, d); break;
      case 'shielder': shielderTick(z, s, dt, tgt, dx, dy); break;
      case 'burrower': burrowerTick(z, s, dt, tgt, dx, dy, d); break;
      case 'summoner': summonerTick(z, s, dt, tgt, dx, dy, d); break;
      case 'charger': chargerTick(z, s, dt, tgt, dx, dy, d); break;
      case 'healer': healerTick(z, s, dt, tgt, dx, dy, d); break;
    }
  }

  // ---------- boss mods ----------
  // Phân Thân: below half hp the boss splits into two smaller brutes; it keeps 60% of its hp
  function splitBoss(z) {
    z.m22split = true; z.hp *= 0.6;
    for (const sg of [-1, 1]) {
      const a = z.angle + sg * 1.4;
      const c = G.spawnEnemy('brute', z.x + Math.cos(a) * 48, z.y + Math.sin(a) * 48, { lvl: z.lvl, state: 'chase', rise: true });
      c.img = z.img; c.m22fb = z.m22fb; c.m22tint = z.m22tint; c.beast = z.beast; c.undead = z.undead; c.scale = 0.55; c.r = ARCHE.brute.r * 0.55;
      c.maxHp = c.hp = Math.max(30, z.maxHp * 0.12);
    }
    Floaters.add(z.x, z.y - 60, 'PHÂN THÂN!', '#ffd24a', 13, true); FX.ring(z.x, z.y, 20, 180, '#ffd24a', 0.5, 6); G.shake(8);
  }

  // ---------- sprite choice: the m22_ sprite of this world from the atlas; otherwise the old sprite already in z.img ----------
  function resolveSprite(z, kind) {
    z.m22tint = kind;
    const want = 'm22_' + RL.id + '_' + kind;
    if (IMG[want]) z.img = want; else z.m22fb = true;
  }

  // ---------- wrappers ----------
  const se = G.spawnEnemy;
  G.spawnEnemy = function (arche, x, y, o) {
    const z = se.call(this, arche, x, y, o);
    let kind = null;
    if (KINDS.includes(arche)) {
      kind = arche; z.m22 = arche;
      z.m22s = { ph: 'idle', cd: R.range(2, 5), sc: R.range(2, 4), side: Math.random() < 0.5 ? -1 : 1, t: 0 };
    } else if (o && o.bossDef && o.bossDef.def && o.bossDef.def.m22) kind = o.bossDef.def.m22;
    if (kind) {
      const f = M22_FLAG[RL.id] && M22_FLAG[RL.id][kind];
      if (f) z[f] = true;
      resolveSprite(z, kind);
    }
    return z;
  };

  const eu = Enemy.prototype.update;
  Enemy.prototype.update = function (dt) {
    if (this.dead || this.rise > 0 || (typeof Net !== 'undefined' && Net.active && Net.guest)) return eu.call(this, dt);
    if (this.boss && this.pat && !this.m22split && this.pat.includes('split') && this.hp < this.maxHp * 0.5) splitBoss(this);
    if (this.m22 && this.m22s && G.player && !G.player.dead) tickKind(this, dt);
    else if (this.m22hack) this.m22hack = false;
    return eu.call(this, dt);
  };

  const ed = Enemy.prototype.draw;
  function drawBang(ctx, z, x, y, left) {
    const im = IMG[z.img], hh = im ? im.height / 2 * z.scale : z.r * 2;
    ctx.save();
    ctx.textAlign = 'center'; ctx.font = 'bold 24px sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.fillStyle = left < 0.15 && Math.floor(G.time * 14) % 2 ? '#ffd24a' : '#ff3b3b';
    ctx.strokeText('!', x, y - hh / 2 - 6); ctx.fillText('!', x, y - hh / 2 - 6);
    ctx.restore();
  }
  function drawPounceWarn(ctx, s) {
    const k = Math.min(1, Math.max(0, 1 - s.t / 0.55));
    ctx.save();
    ctx.globalAlpha = 0.22 + k * 0.4; ctx.fillStyle = '#ff5a3c';
    ctx.beginPath(); ctx.arc(s.lx, s.ly, 36, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.9; ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 3; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.arc(s.lx, s.ly, 36, 0, TAU); ctx.stroke();
    ctx.restore();
  }
  function drawCrack(ctx, z, s) {
    const k = Math.max(0, s.ct / 0.8);
    ctx.save();
    ctx.globalAlpha = 0.55 + Math.sin(G.time * 18) * 0.25;
    ctx.strokeStyle = '#ff9a3c'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(z.x, z.y, 50 * (0.6 + 0.4 * k), 0, TAU); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + 0.4; ctx.moveTo(z.x + Math.cos(a) * 10, z.y + Math.sin(a) * 10); ctx.lineTo(z.x + Math.cos(a) * 50, z.y + Math.sin(a) * 50); }
    ctx.stroke(); ctx.restore();
  }
  Enemy.prototype.draw = function (ctx) {
    const k = this.m22, s = this.m22s, tint = this.m22tint;
    if ((!k && !this.m22fb) || this.dead || this.rise > 0) return ed.call(this, ctx);
    if (s && s.under) { if (s.ph === 'crack') drawCrack(ctx, this, s); return; }   // burrowed: not drawn
    const x0 = this.x, y0 = this.y;
    if (k) { // ground ring in the kind colour
      ctx.save(); ctx.globalAlpha = 0.45 + Math.sin(G.time * 5 + this.id) * 0.15; ctx.strokeStyle = M22_COL[k]; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x0, y0 + this.r * 0.6, this.r * 1.35, this.r * 0.8, 0, 0, TAU); ctx.stroke(); ctx.restore();
    }
    if (k === 'leaper' && s && s.ph === 'wind') drawPounceWarn(ctx, s);
    if (k === 'charger' && s && s.ph === 'wind') { ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = '#ff4a4a'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + Math.cos(s.ang) * 140, y0 + Math.sin(s.ang) * 140); ctx.stroke(); ctx.restore(); }
    // a bob while walking (new sprites have no walk frames), the leaper lifts in the air; PA draws its own lean for ordinary windups
    let oy = 0;
    if (s && s.air) oy -= s.air;
    if (Math.hypot(this.vx, this.vy) > 8) oy -= Math.abs(Math.sin(this.walkT)) * 2.5;
    this.y = y0 + oy;
    const f = this.m22fb && tint ? M22_TINT[tint] : null;
    if (f) ctx.filter = f;
    try { ed.call(this, ctx); }
    finally { if (f) ctx.filter = 'none'; this.x = x0; this.y = y0; }
    if (k === 'shielder' && s) {
      const a = s.sh != null ? s.sh : this.angle;
      ctx.save(); ctx.strokeStyle = s.shBreak > 0 ? 'rgba(255,120,120,0.5)' : 'rgba(154,216,255,0.85)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(x0, y0, this.r + 9, a - 1.0, a + 1.0); ctx.stroke(); ctx.restore();
    }
    if (k === 'healer' && s && s.heal > 0) {
      ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = M22_COL.healer; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x0, y0, this.r + 8 + Math.sin(G.time * 10) * 2, 0, TAU); ctx.stroke(); ctx.restore();
    }
    if (k === 'charger' && s && s.ph === 'wind') drawBang(ctx, this, x0, y0, s.t);
  };

  // revive (boss mod): the first death restores half hp
  const ke = G.killEnemy;
  G.killEnemy = function (z, src) {
    if (z.boss && z.pat && z.pat.includes('revive') && !z.m22revived) {
      z.m22revived = true; z.hp = z.maxHp * 0.5; z.stun = 0;
      Floaters.add(z.x, z.y - 70, 'HỒI SINH!', '#6dff9a', 14, true);
      FX.pillar(z.x, z.y, '#6dff9a', 1.2, 40); FX.ring(z.x, z.y, 20, 200, '#6dff9a', 0.6, 6);
      G.shake(10); Sound.at('sfx_magic', z.x, z.y, 0.8, 0.7);
      return;
    }
    return ke.call(this, z, src);
  };

  // shield: a direct hit from the front arc (~65 degrees) deals 20%; a broken shield (parried) deals full damage for 2 s
  const he = G.hitEnemy;
  G.hitEnemy = function (z, dmg, kx, ky, src, ang, wp) {
    const s = z && z.m22s;
    if (s && s.under) return false; // burrowed: untouchable
    if (s && z.m22 === 'shielder' && !(s.shBreak > 0) && M22_BLOCK.has(src)) {
      const P = this.player, a = s.sh != null ? s.sh : z.angle;
      const px = P.x - z.x, py = P.y - z.y, pd = Math.hypot(px, py) || 1;
      if ((px * Math.cos(a) + py * Math.sin(a)) / pd > 0.42) {
        dmg *= 0.2;
        if (G.time >= (s.blockAt || 0)) { s.blockAt = G.time + 0.3; Floaters.add(z.x, z.y - z.r - 10, 'CHẶN!', '#9ad8ff', 10); }
        Particles.sparks(z.x + Math.cos(a) * (z.r + 4), z.y + Math.sin(a) * (z.r + 4), a, 4, ['#9ad8ff', '#ffffff']);
      }
    }
    return he.call(this, z, dmg, kx, ky, src, ang, wp);
  };

  // a parried shielder loses its shield for 2 s (PA emits 'parry' (src, ok))
  Bus21.on('parry', (z, ok) => {
    const s = z && z.m22s;
    if (ok && s && z.m22 === 'shielder') { s.shBreak = 2; Floaters.add(z.x, z.y - z.r - 14, 'VỠ THẾ!', '#9ad8ff', 11, true); }
  });

  // field spawns: the new kinds also come out of the normal spawn table (summoner / healer from day 3)
  const pa = G.pickArche;
  G.pickArche = function (zone) {
    const base = pa.call(this, zone);
    const p = zone === 2 ? 0.16 : zone === 1 ? 0.12 : 0.08;
    if (Math.random() >= p) return base;
    const t = { leaper: 4, shielder: 3, burrower: 2, charger: 2 };
    if (this.day >= 3) { t.summoner = 2; t.healer = 2; }
    return weighted(t);
  };
})();
