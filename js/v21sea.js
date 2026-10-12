// ===== v21 package W: sea monsters come only out of Sea Gates =====
// A Sea Gate is an ordinary gate (v20) set on deep water. Its monsters are sea creatures (v17) drawn from a rank table.
// Solo overworld: the random sea director is off, so the sea is empty except around sea gates.
(function () {
  const KINDS = { E: [0, 1], D: [0, 1, 5], C: [0, 2, 5], B: [2, 3, 5], A: [2, 3, 5], S: [3, 2] };   // SEA_DEF indices per rank
  const gateWord = () => (typeof gateName === 'function' ? gateName() : R21({ sl: 'Cổng', md: 'Ổ dịch', tt: 'Bí cảnh' }));
  const word = () => gateWord() + ' Biển';                              // sl "Cổng Biển", md "Ổ dịch Biển", tt "Bí cảnh Biển"
  const noun = () => R21({ sl: 'Thủy quái', md: 'Quái biển', tt: 'Thủy yêu' });
  const recOf = (p) => {
    if (!p || p.dead || p.kind !== 'gate' || !p.data || p.data.king) return null;
    const g = gtState(), r = g && g.list.find(q => q.id === p.data.gid);
    return r && r.sea ? r : null;
  };
  const recAt = (x, y) => { const g = gtState(); return g ? g.list.find(r => r.sea && Math.abs(r.x - x) < 8 && Math.abs(r.y - y) < 8) || null : null; };
  // nearest sea gate prop within r px of (x, y)
  const gateNear = (x, y, r) => { for (const p of World.propsNear(x, y, r + 40)) if (dist(p.x, p.y, x, y) <= r && recOf(p)) return p; return null; };

  // share of water among 24 random real tiles within 1500 px of the player (unloaded tiles read as grass)
  function waterShare() {
    const P = G.player;
    let n = 0;
    for (let k = 0; k < 24; k++) {
      const a = R.range(0, TAU), d = 1500 * Math.sqrt(Math.random());
      if (WATER_T(World.get(Math.floor((P.x + Math.cos(a) * d) / TILE), Math.floor((P.y + Math.sin(a) * d) / TILE)))) n++;
    }
    return n / 24;
  }
  // share of gate openings that try the sea first: 65% when the player is among water, else 30%
  const seaChance = () => (waterShare() >= 0.15 ? 0.65 : 0.30);

  // a spot on deep water: the centre is DEEP, the 5x5 around it is all water, no building, away from other gates
  // candidates are read from the loaded superblocks (World.sbs), 120 tries, ring 650-2200 px around the player
  function place(rank) {
    const P = G.player, I = rankI(rank), g = gtState(), minD = 650, maxD = 2200;
    for (let k = 0; k < 120; k++) {
      const d = Math.sqrt(minD * minD + Math.random() * (maxD * maxD - minD * minD)), a = R.range(0, TAU);
      const x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d, tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
      const sx = Math.floor(tx / SB), sy = Math.floor(ty / SB), sb = World.sbs.get(nkey(sx, sy));
      if (!sb || sb.poi || (sx === 0 && sy === 0)) continue;
      if (I >= 2 ? sb.zone > 0 : sb.zone > 1) continue;
      const lx = tx - sb.tx0, ly = ty - sb.ty0;
      if (lx < 2 || ly < 2 || lx > SB - 3 || ly > SB - 3) continue;   // the whole 5x5 lies inside this block
      const cx = tx * TILE + 16, cy = ty * TILE + 16;
      if (g.list.some(r => !r.done && dist(r.x, r.y, cx, cy) < 800)) continue;
      if (G.dkSiteNear && G.dkSiteNear(cx, cy, 900)) continue;
      if (sb.tiles[ly * SB + lx] !== T.DEEP) continue;
      let ok = true;
      for (let j = -2; j <= 2 && ok; j++) for (let i = -2; i <= 2; i++) {
        const idx = (ly + j) * SB + (lx + i);
        if (!WATER_T(sb.tiles[idx]) || sb.bld[idx] >= 0) { ok = false; break; }
      }
      if (ok) return { x: cx, y: cy, sb };
    }
    return null;
  }

  // a sea creature with the gate's level (v17 seaSpawn takes its level from the spot instead)
  function spawn(kind, x, y, lv) {
    const D = SEA_DEF[kind], r = rk(RL.id), im = `${r}_sea_${kind}`;
    const z = G.spawnEnemy('runner', x, y, { lvl: lv, elite: !!D.boss, state: 'wander', rise: true });
    z.aqua = true; z.sea = kind; z.name = (SEA[r] || SEA.md)[kind]; z.img = IMG[im] ? im : z.img;
    const k = 1 + 0.14 * (lv - 1);
    z.maxHp = z.hp = D.hp * k; z.dmg = D.dmg * (1 + 0.06 * (lv - 1)); z.spd = D.spd * R.range(0.92, 1.08);
    z.r = D.r; z.scale = D.sc; z.xp = (12 + lv * 6) * (D.boss ? 12 : 1) * (kind === 3 ? 2 : 1);
    if (D.armor) z.armorB = D.armor;
    z.t = Object.assign({}, z.t, { knockRes: D.boss ? 0.8 : 0 }); z.sbk = null; z.guard = false;
    z.attackCd = 1; z.wanderT = 0;
    return z;
  }

  // 1. no random sea monsters in solo overworld (co-op keeps the old director)
  const sd = G.seaDirector;
  G.seaDirector = function () { if (World.mode === 'over' && !coopOn()) return; return sd.call(this); };

  // 2. sea gates: an opening tries a spot on deep water first (65% among water, else 30%); the usual notice is replaced by a sea one
  // forceSea (set only by the guarantee in 4) asks for a sea gate and never falls back to land
  let forceSea = false;
  const gp = G.gatePlace;
  G.gatePlace = function (rank) {
    const st = this._sea21;
    if (st && !st.pos) { const s = place(rank); if (s) { st.pos = s; return s; } if (st.force) return null; }
    return gp.call(this, rank);
  };
  const sp = G.spawnGate;
  G.spawnGate = function (forceRank) {
    if (coopOn()) return sp.call(this, forceRank);
    if (!forceSea && Math.random() >= seaChance()) return sp.call(this, forceRank);
    const st = { pos: null, force: forceSea };
    this._sea21 = st;
    // notices raised inside the call are held back only once a sea spot was found
    const held = [[this, 'toast'], [UI, 'radio'], [SYS, 'msg']].filter(([o, k]) => typeof o[k] === 'function').map(([o, k]) => {
      const f = o[k]; o[k] = function (...a) { if (!st.pos) return f.apply(this, a); }; return [o, k, f];
    });
    let ok = false;
    try { ok = sp.call(this, forceRank); }
    finally { for (const [o, k, f] of held) o[k] = f; this._sea21 = null; }
    if (ok && st.pos) {
      const g = gtState(), rec = g.list[g.list.length - 1];
      if (rec && rec.x === st.pos.x && rec.y === st.pos.y) {
        rec.sea = 1;
        const gp2 = World.propsNear(rec.x, rec.y, 8).find(q => q.kind === 'gate' && q.data && q.data.gid === rec.id);
        if (gp2) gp2.lightCol = 'cyan';
        const P = this.player, dx = rec.x - P.x, dy = rec.y - P.y, dm = Math.round(Math.hypot(dx, dy) / TILE);
        SYS.msg(`${word()} hạng ${rec.rank} vừa mở ở hướng ${dirName(dx, dy)}, cách khoảng ${dm}m trên mặt biển. ${noun()} sẽ tràn ra từ mặt nước cho tới khi có người đóng ${gateWord()}.`, 'warn');
      }
    }
    return ok;
  };
  // the sea gate's light is jade-blue; it keeps that light when its block loads again
  const wgp = World.gateProp;
  World.gateProp = function (rec) { const p = wgp.call(this, rec); if (rec.sea && p) p.lightCol = 'cyan'; return p; };

  // 3. monsters of a sea gate: sea creatures from the rank table, leviathan rarely from S
  const gm = G.gateMonster;
  G.gateMonster = function (r) {
    if (!r.sea) return gm.call(this, r);
    const a = R.range(0, TAU), rr = R.range(18, 56);
    let x = r.x + Math.cos(a) * rr, y = r.y + Math.sin(a) * rr;
    if (!WATER_T(waterAtPx(x, y))) { x = r.x; y = r.y; }
    let kind = R.pick(KINDS[r.rank] || [0]);
    if (r.rank === 'S' && Math.random() < 0.1 && !this.zombies.some(z => z.sea === 4 && !z.dead)) kind = 4;
    const lv = Math.max(Math.round(RANK_LVL[r.rank] * 0.85), World.levelAt(r.x, r.y));
    const z = spawn(kind, x, y, lv);
    z.gateId = r.id; z.gh = { x: r.x, y: r.y };
    Particles.burst(x, y, 6, RANK_COLOR[r.rank], 90);
    return z;
  };

  // 4. getting in: E works while swimming or on a boat within 60 px; a boat is left behind on the way in
  const fi = G.findInteract;
  G.findInteract = function () {
    const P = this.player;
    const near = P && World.mode === 'over' && (P.boat || P.inWater) ? gateNear(P.x, P.y, 60) : null;
    const item = () => {
      const r = recOf(near), lv = Math.max(RANK_LVL[r.rank], World.levelAt(near.x, near.y));
      return { prop: near, kind: 'gate', label: `Vào ${word()} hạng ${r.rank} • quái ~Lv${lv}${lv > P.level + 5 ? ' ⚠ RẤT NGUY HIỂM' : ''}` };
    };
    if (near && P.boat) return item();
    const it = fi.call(this);
    if (!it && near) return item();
    if (it && it.kind === 'gate' && it.prop && recOf(it.prop)) it.label = it.label.replace(/^Vào .*? hạng /, 'Vào ' + word() + ' hạng ');
    return it;
  };
  // the boat is left behind only when the gate is really entered (the nearby-list chooser may still cancel)
  const eg = G.enterGate;
  G.enterGate = function (p) {
    const P = this.player;
    if (P && P.boat && !this.transit) { P.boat = null; P.aqua = false; }
    return eg.call(this, p);
  };
  // 5. guarantee: 30 s swimming or on a boat opens a sea gate when none is within 2000 px.
  // Time on land counts against it: 60 s on land in a row clears the wet time.
  const clock = { sw: 0, ld: 0, retry: 0 };
  function openSea() {
    const P = G.player, g = gtState();
    if (!g || g.list.some(r => r.sea && !r.done && dist(r.x, r.y, P.x, P.y) <= 2000)) return false;
    const press = G.gatePressure();
    if (press <= 0) return false;
    // v20's open-gate cap; one extra gate is allowed for the sea when the cap is full and no sea gate is open
    const open = g.list.filter(r => !r.done && !r.static).length;
    const cap = Math.max(1, Math.round(clamp(2 + Math.floor(P.level / 8), 2, 5) * press));
    if (open > cap || (open === cap && g.list.some(r => r.sea && !r.done))) return false;
    forceSea = true;
    try { return G.spawnGate(); } finally { forceSea = false; }
  }
  const gt = G.gateTick;
  G.gateTick = function (dt) {
    const P = this.player;
    if (P && !P.dead && World.mode === 'over' && this.state === 'playing' && !coopOn()) {
      if (P.boat || P.inWater) { clock.sw += dt; clock.ld = 0; }
      else { clock.ld += dt; if (clock.ld >= 60) clock.sw = 0; }
      if (clock.sw >= 30 && this.time >= clock.retry) { if (openSea()) clock.sw = 0; else clock.retry = this.time + 5; }
    }
    return gt.call(this, dt);
  };

  // the map names sea gates as such
  const ta = G.tpAll;
  G.tpAll = function () {
    const out = ta.call(this);
    for (const t of out) if (t.kind === 'gate' && t.gx != null && t.name && recAt(t.gx, t.gy)) t.name = t.name.replace(/^.*? hạng /, word() + ' hạng ');
    return out;
  };
})();
