// ===== v20: gates open over time and leak monsters, discovered-only gate list, dungeon floors that remember, empty shadows, dry ground under sites =====
const GT_CLEAR = { E: 80, D: 140, C: 210, B: 290, A: 370, S: 470 };   // px around a gate cleared of trees and rocks
const GT_FREE = { E: 3, D: 5, C: 8, B: 11, A: 13, S: 15 };            // tiles around a gate without a building
const GT_CAP = { E: 5, D: 7, C: 9, B: 11, A: 13, S: 16 };             // monsters alive from one gate
const GT_POOL = {
  E: { walker: 60, runner: 26, ranged: 8, armored: 4, brute: 2 },
  D: { walker: 46, runner: 26, ranged: 10, armored: 8, brute: 7, exploder: 3 },
  C: { walker: 34, runner: 24, ranged: 12, armored: 12, brute: 12, exploder: 6 },
  B: { walker: 24, runner: 22, ranged: 14, armored: 16, brute: 16, exploder: 8 },
  A: { walker: 16, runner: 20, ranged: 16, armored: 20, brute: 20, exploder: 8 },
  S: { walker: 8, runner: 16, ranged: 18, armored: 24, brute: 26, exploder: 8 },
};
const DIRS8 = ['Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc', 'Bắc', 'Đông Bắc'];
const dirName = (dx, dy) => DIRS8[((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8];
const gtState = () => { const v = G.v10; if (!v) return null; return v.gt || (v.gt = { list: [], id: 1, next: 12, closed: 0 }); };
const rankI = r => RANKS.indexOf(r);
const coopOn = () => typeof Net !== 'undefined' && Net.active;

// ---------- the ground and props around a gate (same code at generation time and when the gate opens) ----------
Object.assign(World, {
  gateGround(sb, rec, gen) {
    const I = rankI(rec.rank), tx = Math.floor(rec.x / TILE), ty = Math.floor(rec.y / TILE), R0 = 3 + I;
    const x0 = sb.tx0, y0 = sb.ty0;
    for (let y = Math.max(y0, ty - R0); y <= Math.min(y0 + SB - 1, ty + R0); y++) for (let x = Math.max(x0, tx - R0); x <= Math.min(x0 + SB - 1, tx + R0); x++) {
      if (Math.hypot(x - tx, y - ty) > R0 + 0.3) continue;
      const i = (y - y0) * SB + (x - x0), t = sb.tiles[i];
      if (this.isSolidT(t) || t === T.ROAD || t === T.SIDEWALK || sb.bld[i] >= 0) continue;
      sb.tiles[i] = I >= 4 ? T.ASH : T.GRAVEL;
    }
    const cr = GT_CLEAR[rec.rank];
    for (const p of sb.props) {
      if (p.dead || p.kind === 'gate' || p.container || p.kind === 'chest' || dist(p.x, p.y, rec.x, rec.y) > cr) continue;
      if (gen) p.cull = true; else this.removeProp(p);
    }
    if (!gen) {
      for (let cy = Math.floor((rec.y - cr) / CHPX); cy <= Math.floor((rec.y + cr) / CHPX); cy++) for (let cx = Math.floor((rec.x - cr) / CHPX); cx <= Math.floor((rec.x + cr) / CHPX); cx++) this.cache.delete(nkey(cx, cy));
    }
  },
  gateProp(rec) {
    const I = rankI(rec.rank), red = I >= 4 || rec.king;
    const p = this.addProp(red ? 'fx_1' : 'fx_0', rec.x, rec.y, { solid: false, layer: 0, kind: 'gate', light: 150 + I * 25 + (rec.king ? 80 : 0), lightCol: red ? 'red' : 'blue', data: { rank: rec.rank, story: !!rec.story, seed: rec.seed, gid: rec.id, king: !!rec.king, floors: rec.floors, level: rec.level } });
    const s = (0.78 + I * 0.15) * (rec.king ? 1.5 : 1); p.w *= s; p.h *= s; p.placed = true;
    return p;
  },
  gateInstall(sb, rec) { this.gateGround(sb, rec, true); this.gateProp(rec); },
  // lakes and lava inside a site block would leave its statue on an island: dry them
  dryBlock(sb) {
    const B = BIOMES[sb.biome] || {}, ground = B.ground ?? T.GRASS;
    for (let y = 0; y < SB; y++) for (let x = 0; x < SB; x++) {
      const i = y * SB + x, t = sb.tiles[i];
      if (t === T.LAVA) sb.tiles[i] = T.ASH;
      else if ((t === T.WATER || t === T.DEEP) && !this.waterAt(sb.tx0 + x, sb.ty0 + y)) sb.tiles[i] = ground;
    }
  },
});
(function () {
  const go = World.genOver;
  World.genOver = function (sb) {
    go.call(this, sb);
    if (sb.poi) this.dryBlock(sb);
    if (this._temp || !G.v10 || !G.v10.gt) return;
    for (const rec of G.v10.gt.list) if (!rec.done && Math.floor(rec.x / SBPX) === sb.sx && Math.floor(rec.y / SBPX) === sb.sy) this.gateInstall(sb, rec);
  };
})();

// ---------- gate director ----------
Object.assign(G, {
  gatePressure() {
    const dk = this.dkState ? this.dkState() : null;
    if (dk && dk.done) return 0;
    const lords = Object.keys((this.v6 && this.v6.lord) || {}).length, gens = dk ? dk.nDead() : 0;
    return Math.max(0.2, 1 - 0.04 * lords - 0.05 * gens);
  },
  gateSpotOK(tx, ty, r) {
    const step = r > 6 ? 2 : 1;
    for (let y = ty - r; y <= ty + r; y += step) for (let x = tx - r; x <= tx + r; x += step) {
      const sb = World.sbs.get(nkey(Math.floor(x / SB), Math.floor(y / SB))); if (!sb) return false;
      const i = (y - sb.ty0) * SB + (x - sb.tx0), t = sb.tiles[i];
      if (sb.bld[i] >= 0 || t === T.WALL || t === T.WINDOW || t === T.WATER || t === T.DEEP || t === T.LAVA) return false;
      if (Math.hypot(x - tx, y - ty) < 3 && (sb.occ[i] || t === T.ROAD || t === T.SIDEWALK || t === T.ICE)) return false;
    }
    return true;
  },
  gatePlace(rank) {
    const P = this.player, I = rankI(rank), g = gtState(), free = GT_FREE[rank], R0 = 3 + I;
    const minD = I >= 3 ? 1100 : 650, maxD = 1500 + I * 380;
    for (let k = 0; k < 70; k++) {
      const a = R.range(0, TAU), d = R.range(minD, maxD);
      const x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d, tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
      const sx = Math.floor(tx / SB), sy = Math.floor(ty / SB), sb = World.sbs.get(nkey(sx, sy)); if (!sb) continue;
      if (sb.poi || (sx === 0 && sy === 0) || sb.wet > 0.05) continue;
      if (I >= 2 ? sb.zone > 0 : sb.zone > 1) continue;
      const lx = tx - sb.tx0, ly = ty - sb.ty0; if (lx < R0 + 1 || ly < R0 + 1 || lx > SB - R0 - 2 || ly > SB - R0 - 2) continue;
      if (g.list.some(r => !r.done && dist(r.x, r.y, x, y) < 800)) continue;
      if (this.dkSiteNear && this.dkSiteNear(x, y, 900)) continue;
      if (!this.gateSpotOK(tx, ty, free)) continue;
      return { x: tx * TILE + 16, y: ty * TILE + 16, sb };
    }
    return null;
  },
  spawnGate(forceRank) {
    const P = this.player, g = gtState();
    const target = clamp(P.level / 8 - 0.2, 0, 5);
    const w = RANKS.map((r, i) => Math.exp(-Math.pow(i - target, 2) / 1.6) + (i === 0 ? 0.12 : 0));
    let pos = null, rank = forceRank;
    for (let tries = 0; tries < 6 && !pos; tries++) {
      if (!forceRank) { let u = Math.random() * w.reduce((a, b) => a + b, 0); rank = RANKS[0]; for (let i = 0; i < w.length; i++) { u -= w[i]; if (u <= 0) { rank = RANKS[i]; break; } } if (tries >= 3) rank = RANKS[Math.max(0, rankI(rank) - tries + 2)]; }
      pos = this.gatePlace(rank);
    }
    if (!pos) return false;
    const rec = { id: g.id++, x: pos.x, y: pos.y, rank, seed: (Math.random() * 1e9) | 0, t0: this.time, found: 0 };
    g.list.push(rec);
    World.gateGround(pos.sb, rec, false);
    World.gateProp(rec);
    FX.pillar(rec.x, rec.y, RANK_COLOR[rank], 0.9, 60); Sound.at && Sound.at('sfx_portal', rec.x, rec.y, 0.5, 0.8);
    const dx = rec.x - P.x, dy = rec.y - P.y, dm = Math.round(Math.hypot(dx, dy) / TILE);
    const msg = `Phát hiện dao động ${manaName().toLowerCase()}: ${gateName()} hạng ${rank} vừa mở ở hướng ${dirName(dx, dy)}, cách khoảng ${dm}m. Quái sẽ tràn ra từ đó cho tới khi có người đóng ${gateName()}.`;
    SYS.msg(msg, 'warn');
    return true;
  },
  gateMonster(r) {
    const I = rankI(r.rank), a = R.range(0, TAU), rr = R.range(18, 56);
    let x = r.x + Math.cos(a) * rr, y = r.y + Math.sin(a) * rr;
    if (!World.walkable(Math.floor(x / TILE), Math.floor(y / TILE))) { x = r.x; y = r.y; }
    const lvl = Math.max(Math.round(RANK_LVL[r.rank] * 0.85), World.levelAt(r.x, r.y));
    const z = this.spawnEnemy(weighted(GT_POOL[r.rank]), x, y, { lvl, elite: Math.random() < 0.04 + I * 0.05, state: 'wander', rise: true });
    z.gateId = r.id; z.gh = { x: r.x, y: r.y }; z.guard = false;
    Particles.burst(x, y, 6, RANK_COLOR[r.rank], 90);
    return z;
  },
  gateTick(dt) {
    const P = this.player, g = gtState();
    if (!g || World.mode !== 'over' || P.dead || this.state !== 'playing' || coopOn()) return;
    // discovery: a gate only appears on the map once you have been close to it
    if (this.frame % 15 === 0) {
      for (const r of g.list) if (!r.found && !r.done && dist(P.x, P.y, r.x, r.y) < 640) { r.found = 1; this.toast(`⛩ Đã phát hiện Cổng hạng ${r.rank} — đã ghi lên bản đồ.`, 'quest'); Sound.play('sfx_achievement', 0.4, 1.3); }
      // gates that exist from the story or a site register themselves the same way
      for (const p of World.propsNear(P.x, P.y, 640)) {
        if (p.kind !== 'gate' || p.dead || !p.data || p.data.gid || p.data.king || this.v10.gatesDone[gateKey(p.x, p.y)]) continue;
        if (!g.list.some(r => Math.abs(r.x - p.x) < 8 && Math.abs(r.y - p.y) < 8)) { g.list.push({ id: g.id++, x: Math.round(p.x), y: Math.round(p.y), rank: p.data.rank, seed: p.data.seed, t0: this.time, found: 1, static: 1, story: !!p.data.story }); this.toast(`⛩ Đã phát hiện Cổng hạng ${p.data.rank}${p.data.story ? ' (cốt truyện)' : ''}.`, 'quest'); }
      }
    }
    // new gates open now and then; fewer the more of the world's bosses have fallen
    const press = this.gatePressure();
    if (press > 0 && this.time >= g.next && this.frame % 30 === 0) {
      const open = g.list.filter(r => !r.done && !r.static).length, cap = Math.max(1, Math.round(clamp(2 + Math.floor(P.level / 8), 2, 5) * press));
      if (open < cap) g.next = this.time + (this.spawnGate() ? R.range(55, 120) / Math.max(0.25, press) : 8);
      else g.next = this.time + 20;
    }
    // every open gate near you keeps pushing monsters out
    for (const r of g.list) {
      if (r.done || r.static && r.story || press <= 0) continue;
      const d = dist(P.x, P.y, r.x, r.y); if (d > 1250) continue;
      r.emit = (r.emit == null ? R.range(1.5, 3.5) : r.emit) - dt;
      if (r.emit > 0) continue;
      const I = rankI(r.rank), age = this.time - r.t0;
      const cap = Math.round((GT_CAP[r.rank] + Math.min(6, age / 150)) * (this.night ? 1.25 : 1) * (this.bloodMoon ? 1.6 : 1));
      r.emit = R.range(3.5, 7) * (1.3 - Math.min(0.6, age / 900)) / (this.night ? 1.3 : 1);
      let alive = 0; for (const z of this.zombies) if (z.gateId === r.id && !z.dead) alive++;
      if (alive >= cap) continue;
      const n = Math.min(cap - alive, 1 + (Math.random() < 0.3 + I * 0.08 ? 1 : 0) + (Math.random() < 0.1 ? 2 : 0));
      for (let k = 0; k < n; k++) this.gateMonster(r);
      if (d < 800 && this.time - (r.warn || -99) > 90) { r.warn = this.time; this.toast(`⛩ Cổng hạng ${r.rank} đang tuôn quái ra!`, 'warn'); }
    }
  },
});
(function () {
  // monsters from a gate stay near it until they notice you
  const eu = Enemy.prototype.update;
  Enemy.prototype.update = function (dt) {
    if (this.gh && !this.dead && this.state === 'wander') { const dx = this.gh.x - this.x, dy = this.gh.y - this.y; if (dx * dx + dy * dy > 480 * 480) { this.wa = Math.atan2(dy, dx); this.wanderT = 1.2; } }
    return eu.call(this, dt);
  };
  // the old random streets-full-of-zombies spawner is gone in solo play: monsters now come out of gates
  const st = G.spawnTick;
  G.spawnTick = function (dt) { if (World.mode === 'over' && !coopOn()) return; return st.call(this, dt); };
  const tk = G.v5Tick;
  G.v5Tick = function (dt) { tk.call(this, dt); if (!(coopOn() && Net.guest)) this.gateTick(dt); };
  // gates are listed on the map only after you have found them
  G.scanGates = function () {};
  const ta = G.tpAll;
  G.tpAll = function () {
    const out = ta.call(this).filter(t => t.kind !== 'gate');
    if (World.mode !== 'over') return out;
    const g = gtState();
    for (const r of g.list) {
      if (!r.found || r.done) continue;
      const [rx, ry] = World.regionOf(Math.floor(r.x / SBPX), Math.floor(r.y / SBPX));
      out.push({ x: r.x, y: r.y + 80, gx: r.x, gy: r.y, name: `Cổng hạng ${r.rank}${r.story ? ' (cốt truyện)' : ''} • ${World.regionInfo(rx, ry).name}`, kind: 'gate', icon: '⛩', col: r.story ? '#ffcf3a' : RANK_COL[r.rank] || '#ccc', rank: r.rank });
    }
    if (this.dkTpList) for (const t of this.dkTpList()) out.push(t);
    return out;
  };
  // when a cleared gate closes, a new one opens somewhere else a little later
  const xd = G.exitDungeon;
  G.exitDungeon = function (...a) {
    const dg = World.dg, rec = this.gateRec, g = gtState();
    if (dg && dg.cleared && g && !dg.king) {
      if (rec) { rec.done = 1; const i = g.list.indexOf(rec); if (i >= 0) g.list.splice(i, 1); }
      g.closed++; g.next = Math.max(g.next, this.time + R.range(70, 160));
      setTimeout(() => { this.toast(`⛩ Cổng hạng ${dg.rank} đã đóng. Cổng mới có thể mở ở nơi khác sau ít phút.`, 'quest'); if (this.dkAfterGate) this.dkAfterGate(); }, 1500);
    }
    return xd.apply(this, a);
  };
  const eg = G.enterGate;
  G.enterGate = function (p) {
    const g = gtState(), d = p.data || {};
    this.gateRec = g ? (d.gid ? g.list.find(r => r.id === d.gid) : g.list.find(r => Math.abs(r.x - p.x) < 8 && Math.abs(r.y - p.y) < 8)) || null : null;
    if (d.king && this.kingEnter) return this.kingEnter(p, eg);
    return eg.call(this, p);
  };
  // interaction label: ranks and warnings
  const fi = G.findInteract;
  G.findInteract = function () {
    const it = fi.call(this);
    if (it && it.kind === 'gate' && it.prop.data && it.prop.data.king) it.label = 'Cổng Quỷ Vương — nơi phong ấn cuối cùng ' + (this.dkState().key ? '(đã có Chìa khóa)' : '(còn phong ấn)');
    return it;
  };
  // portals grow with their rank and glow in its colour
  const dp = drawProp;
  drawProp = function (p) {
    if (p.kind === 'gate' && p.data && p.data.rank && IMG[p.img]) {
      const v = G.view;
      if (!(p.x + 420 < v.x0 || p.x - 420 > v.x1 || p.y + 420 < v.y0 || p.y - 420 > v.y1)) {
        const I = rankI(p.data.rank), r = 80 + I * 26 + (p.data.king ? 130 : 0);
        ctx.globalAlpha = 0.22 + 0.1 * Math.sin(G.time * 2.4 + p.x);
        ctx.drawImage(GLOW[I >= 4 || p.data.king ? 'red' : 'blue'], p.x - r, p.y - r * 0.9, r * 2, r * 1.8); ctx.globalAlpha = 1;
      }
    }
    dp(p);
    if (p.kind === 'gate' && p.data && p.data.king) { ctx.font = '14px VT323, monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText('CỔNG QUỶ VƯƠNG', p.x + 1, p.y - p.h / 2 - 20); ctx.fillStyle = '#ff5050'; ctx.fillText('CỔNG QUỶ VƯƠNG', p.x, p.y - p.h / 2 - 21); }
  };
})();

// ---------- a dungeon remembers what happened on a floor while you are inside ----------
(function () {
  const dbd = G.dungeonBossDown;
  G.dungeonBossDown = function (z) {
    const dg = World.dg;
    if (dg) { dg.flo = dg.flo || {}; dg.flo[dg.floor] = { x: Math.round(z.x), y: Math.round(z.y), last: dg.floor >= dg.floors }; }
    dbd.call(this, z);
    if (z.king && this.kingDown) this.kingDown(z);
  };
  const gd = World.genDungeon;
  World.genDungeon = function (sb) {
    gd.call(this, sb);
    const dg = this.dg, f = dg && dg.flo && dg.flo[dg.floor];
    if (!f || sb.sx !== dg.bx || sb.sy !== dg.by) return;
    sb.spawns = sb.spawns.filter(s => !(s.kind === 'boss' && s.dungeon));
    if (!f.last) { this.addProp('fx_2', f.x, f.y, { solid: false, layer: 0, kind: 'stairs', light: 120 }).placed = true; return; }
    this.addProp(RL.id === 'sl' ? 'sl_p_9' : 'fx_0', f.x, f.y - 60, { solid: false, layer: 0, kind: 'exit', light: 170, lightCol: 'blue' }).placed = true;
    if (!f.taken) { const tier = rankI(dg.rank) >= 2 ? 3 : 2; this.addProp('chest_' + tier, f.x, f.y + 30, { container: 'chest', kind: 'chest', r: 12, data: { tier, bonus: rankI(dg.rank) * 0.4 } }).placed = true; }
  };
  const ml = World.markLooted;
  World.markLooted = function (p) {
    ml.call(this, p);
    if (this.mode === 'dungeon' && this.dg && this.dg.flo && p.kind === 'chest' && p.data && p.data.bonus != null) { const f = this.dg.flo[this.dg.floor]; if (f) f.taken = 1; }
  };
  // a room you cleared stays cleared when you walk back
  const ul = World.unload;
  World.unload = function (sb) {
    if (this.mode === 'dungeon' && this.dg && !G.zombies.some(z => z.sbk === sb.key && !z.dead)) this.markCleared(sb);
    return ul.call(this, sb);
  };
})();

// ---------- some corpses have no shadow left to raise ----------
const HOLLOW = { normal: 0.30, elite: 0.20, mini: 0.12, boss: 0.06 };
(function () {
  const ke = G.killEnemy;
  G.killEnemy = function (z, src) {
    ke.call(this, z, src);
    const c = this.corpses[this.corpses.length - 1];
    if (!c || c.x !== z.x || c.y !== z.y || !c.tier || z.gen != null || z.king) return;
    if (Math.random() < (HOLLOW[c.tier] || 0)) {
      c.hollow = c.tier; c.tier = null;
      if (c.hollow !== 'normal') Floaters.add(z.x, z.y - 22, 'Bóng đã tan', '#9aa0b8', 9, true);
    }
  };
})();

// ---------- found gates and lairs on the corner minimap ----------
(function () {
  const dm = UI.drawMinimap;
  UI.drawMinimap = function () {
    dm.call(this);
    if (World.mode !== 'over' || !G.v10 || !G.player) return;
    const g = this.mmctx, P = G.player.car || G.player, S = 200 / 96, ox = P.x / TILE - 48, oy = P.y / TILE - 48;
    const mark = (x, y, col, txt) => {
      const px = clamp((x / TILE - ox) * S, 9, 191), py = clamp((y / TILE - oy) * S, 9, 191);
      g.fillStyle = '#000'; g.beginPath(); g.arc(px, py, 7, 0, TAU); g.fill();
      g.fillStyle = col; g.beginPath(); g.arc(px, py, 5.5, 0, TAU); g.fill();
      g.fillStyle = '#000'; g.font = 'bold 8px sans-serif'; g.textAlign = 'center'; g.fillText(txt, px, py + 3);
    };
    const gt = G.v10.gt; if (gt) for (const r of gt.list) if (r.found && !r.done) mark(r.x, r.y, RANK_COL[r.rank] || '#ccc', r.rank);
    if (G.dkTpList) for (const t of G.dkTpList()) if (t.rank !== '✔') mark(t.gx, t.gy, t.col, t.rank === '♛' ? '♛' : '☠');
  };
})();

// ---------- leaving a gate early keeps your floor; the exit asks first ----------
(function () {
  G._runs = {};
  const ed = World.enterDungeon;
  World.enterDungeon = function (dg) {
    const r = ed.call(this, dg), rec = G.gateRec;
    if (rec && !dg.king) { rec.floor = dg.floor; G._runs[rec.id] = dg; }
    return r;
  };
  const ia = G.interact;
  G.interact = function (it) {
    if (it && it.kind === 'exit' && World.mode === 'dungeon' && World.dg && !World.dg.cleared && !this._exitOK) {
      const dg = World.dg;
      UI.menuDialog({ name: 'Rời hầm ngục?', portrait: null, text: `Cổng hạng ${dg.rank} chưa đóng. Nếu rời đi, lần sau bạn vào lại sẽ tiếp tục từ tầng ${dg.floor}/${dg.floors}${this.gateRec ? '' : ' (hầm ngục này không nhớ tiến độ)'}. Quái từ Cổng vẫn tiếp tục tràn ra ngoài.`, options: [{ text: 'Rời đi', act: () => { this._exitOK = true; try { ia.call(this, it); } finally { this._exitOK = false; } } }, { text: 'Ở lại', act: () => {} }] });
      return;
    }
    return ia.call(this, it);
  };
})();

// ---------- shadows are an army, not a boss killer: bosses shrug most of it off and hit them harder ----------
const ALLY_VS = { boss: 0.28, mini: 0.4, top: 0.2, elite: 0.8 };   // share of damage from shadows / allies that lands
const BOSS_VS_ALLY = { boss: 1.7, mini: 1.4 };                       // how much harder bosses hit shadows and allies
(function () {
  const he = G.hitEnemy;
  G.hitEnemy = function (z, dmg, kx, ky, src, ang, wp) {
    if (src === 'ally') dmg *= z.king || z.gen != null ? ALLY_VS.top : z.boss ? (z.mini || z.lord ? ALLY_VS.mini : ALLY_VS.boss) : z.elite ? ALLY_VS.elite : 1;
    return he.call(this, z, dmg, kx, ky, src, ang, wp);
  };
  const ht = G.hurtTarget;
  G.hurtTarget = function (t, dmg, src) {
    if (t && t.kind && src && src.boss && t !== this.player) dmg *= src.mini || src.lord ? BOSS_VS_ALLY.mini : BOSS_VS_ALLY.boss;
    return ht.call(this, t, dmg, src);
  };
})();
