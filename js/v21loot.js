// ===== v21loot: lục bụi cây / đập đá, phát hiện rương (thông báo Hệ thống + bản đồ), mũi tên chỉ đường, nút "Chỉ đường" trên bản đồ =====
// Bus21 events (v21core): 'search'(prop) after any non-chest prop is searched; 'chestFound'(rec) once per chest.
// State: G.v10.loot = { known: { "<loc>:<x>,<y>": {x, y, ax, ay, tier, loc, t} }, guide: {x, y, label, icon, loc, key} | null }
//   loc = 'over' (overworld) or 'dg<floor>' (dungeon floor); ax/ay = a free spot next to the chest, used as the teleport target.
(function () {
  // ---------- searchable plants and rocks ----------
  // One roll per search: an entry of the table, or nothing (weight LOOT_EMPTY).
  LOOT.bush = [['food', 35, 1, 1], ['bandage', 20, 1, 1], ['pills', 10, 1, 1], ['flower', 15, 1, 1]];
  LOOT.rock = [['scrap', 25, 1, 2], ['gold', 15, 4, 10]];
  const LOOT_EMPTY = { bush: 30, rock: 60 };
  const PLANT_LABEL = { bush: 'Lục bụi cây', rock: 'Đập đá' };

  // ---------- state ----------
  const state = () => { const v = G.v10; if (!v) return null; return v.loot || (v.loot = { known: {}, guide: null }); };
  const guest = () => typeof Net !== 'undefined' && Net.active && Net.guest;
  const locOf = () => (World.mode === 'dungeon' && World.dg ? 'dg' + World.dg.floor : 'over');
  const chestKey = (x, y) => locOf() + ':' + Math.round(x) + ',' + Math.round(y);
  function forget(key) {
    const s = state(); if (!s) return;
    delete s.known[key];
    if (s.guide && s.guide.key === key) s.guide = null;
  }

  // ---------- generation: bushes and rocks become searchable ----------
  // Only p.container is set, and only on props that have none. No prop is added or removed,
  // so prop indexes and saved looted marks stay valid.
  function tagSearchable(sb) {
    const P0 = RL.props || {};
    const bush = [P0.bush, 'bush'];
    const barrier = [].concat(P0.barrier || []);
    const rocks = [].concat(P0.rocks || [], 'rock', 'rocks').filter(i => !barrier.includes(i));
    for (const p of sb.props) {
      if (p.container || p.dead || !p.img) continue;
      if (bush.includes(p.img)) p.container = p._auto = 'bush';
      else if (rocks.includes(p.img)) p.container = p._auto = 'rock';
    }
  }
  const ensure0 = World.ensure;
  World.ensure = function (sx, sy) {
    const had = this.sbs.get(nkey(sx, sy));
    const sb = ensure0.call(this, sx, sy);
    if (sb && !had) tagSearchable(sb);
    return sb;
  };
  // a gate still clears trees and rocks around it, as before: hide the new tags while it clears
  const gg0 = World.gateGround;
  World.gateGround = function (sb, rec, gen) {
    const off = sb.props.filter(p => p._auto && p.container === p._auto);
    for (const p of off) p.container = null;
    try { return gg0.call(this, sb, rec, gen); } finally { for (const p of off) p.container = p._auto; }
  };
  // a looted chest is no longer a known chest
  const ml0 = World.markLooted;
  World.markLooted = function (p) { ml0.call(this, p); if (p && p.container === 'chest') forget(chestKey(p.x, p.y)); };

  // ---------- chests: detection, teleport targets, minimap ----------
  const APPROACH = [[2, 0], [-2, 0], [0, 2], [0, -2], [2, 2], [-2, -2], [2, -2], [-2, 2], [3, 0], [-3, 0], [0, 3], [0, -3]];
  // a walkable tile near the chest, so a teleport does not drop the player inside the chest
  function approach(x, y) {
    const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    for (const [dx, dy] of APPROACH) {
      const ax = tx + dx, ay = ty + dy;
      if (World.free(ax, ay) && World.isGround(World.get(ax, ay))) return [ax * TILE + 16, ay * TILE + 16];
    }
    return [Math.round(x), Math.round(y + 48)];
  }
  // every 30 frames: forget opened or vanished chests, then notice new chests in range
  function scan() {
    const P = G.player, s = state();
    if (!P || P.dead || !s || guest()) return;
    const L = locOf();
    for (const k of Object.keys(s.known)) {
      const r = s.known[k];
      if (r.loc !== L || !World.sbs.get(nkey(Math.floor(r.x / SBPX), Math.floor(r.y / SBPX)))) continue;
      const alive = World.propsNear(r.x, r.y, 4, []).some(p => p.container === 'chest' && !p.looted && !p.dead && Math.abs(p.x - r.x) < 2 && Math.abs(p.y - r.y) < 2);
      if (!alive) forget(k);
    }
    const rad = Math.min(900, 420 + 8 * (P.level || 1) + 4 * G.attr('int'));
    for (const p of World.propsNear(P.x, P.y, rad, [])) {
      if (p.container !== 'chest' || p.looted || p.dead) continue;
      const k = chestKey(p.x, p.y);
      if (s.known[k]) continue;
      const tier = clamp((p.data && p.data.tier) || 0, 0, 3), C = CHESTS[tier];
      const [ax, ay] = approach(p.x, p.y);
      const rec = { x: Math.round(p.x), y: Math.round(p.y), ax, ay, tier, loc: L, t: Math.round(G.time) };
      s.known[k] = rec;
      SYS.msg(`Phát hiện ${C.name} cách ${Math.round(dist(P.x, P.y, p.x, p.y) / TILE)}m về hướng ${dirName(p.x - P.x, p.y - P.y)}. Đã đánh dấu trên bản đồ.`, 'quest');
      Bus21.emit('chestFound', rec);
    }
    const keys = Object.keys(s.known);
    if (keys.length > 120) { keys.sort((a, b) => s.known[a].t - s.known[b].t); for (const k of keys.slice(0, keys.length - 120)) forget(k); }
  }
  const vt0 = G.v5Tick;
  G.v5Tick = function (dt) { vt0.call(this, dt); if (G.frame % 30 === 0) scan(); };

  // known overworld chests as teleport points (the ✈ button and the side list use G.tpAll)
  function tps() {
    const s = state(), out = [];
    if (!s || World.mode !== 'over') return out;
    for (const k of Object.keys(s.known)) {
      const r = s.known[k];
      if (r.loc !== 'over') continue;
      const C = CHESTS[r.tier] || CHESTS[0];
      const [rx, ry] = World.regionOf(Math.floor(r.x / SBPX), Math.floor(r.y / SBPX));
      out.push({ x: r.ax, y: r.ay, gx: r.x, gy: r.y, name: `${C.name} • ${World.regionInfo(rx, ry).name}`, kind: 'chest', icon: '📦', col: C.col, ckey: k });
    }
    return out;
  }
  const tpa0 = G.tpAll;
  G.tpAll = function () { const out = tpa0.call(this); if (World.mode === 'over' && G.v10) for (const t of tps()) out.push(t); return out; };

  // gold square on the corner minimap for each known chest in view
  const dm0 = UI.drawMinimap;
  UI.drawMinimap = function () {
    dm0.call(this);
    const s = state(), P0 = G.player;
    if (!s || !P0 || World.mode !== 'over') return;
    const g = this.mmctx, P = P0.car || P0, span = 96, S = 200 / span, ox = P.x / TILE - span / 2, oy = P.y / TILE - span / 2;
    for (const k of Object.keys(s.known)) {
      const r = s.known[k];
      if (r.loc !== 'over') continue;
      const x = (r.x / TILE - ox) * S, y = (r.y / TILE - oy) * S;
      if (x < 5 || y < 5 || x > 195 || y > 195) continue;
      g.fillStyle = '#000'; g.fillRect(x - 4, y - 4, 8, 8);
      g.fillStyle = '#ffd23a'; g.fillRect(x - 3, y - 3, 6, 6);
    }
  };

  // ---------- searching ----------
  function searchPlant(p) {
    const P = G.player, lvl = World.levelAt(p.x, p.y);
    const luck = (P.perks.luck || 0) * 0.35 + P.relic('luck') / 100;
    const table = LOOT[p.container], empty = LOOT_EMPTY[p.container] * (1 - Math.min(0.5, luck));
    World.markLooted(p);
    G.stats.looted++;
    let r = Math.random() * (empty + table.reduce((a, e) => a + e[1], 0)), pick = null;
    for (const e of table) if ((r -= e[1]) < 0) { pick = e; break; }
    if (!pick) { Floaters.add(p.x, p.y - 20, 'Trống rỗng...', '#aaa', 9); return; }
    Items.drop(p.x, p.y, pick[0], R.int(pick[2], pick[3]) + (pick[0] === 'gold' ? Math.floor(lvl / 2) : 0));
  }
  const lp0 = G.lootProp;
  G.lootProp = function (p) {
    if (!p || p.looted) return lp0.call(this, p);
    if (p.container === 'bush' || p.container === 'rock') { searchPlant(p); Bus21.emit('search', p); return; }
    const r = lp0.call(this, p);
    if (p.looted && p.container !== 'chest') Bus21.emit('search', p);
    return r;
  };
  const fi0 = G.findInteract;
  G.findInteract = function () {
    const it = fi0.call(this);
    if (it && it.kind === 'loot' && it.prop && (it.prop.container === 'bush' || it.prop.container === 'rock')) it.label = PLANT_LABEL[it.prop.container];
    return it;
  };
  // searched plants are drawn faded (the sprite at 70% alpha; play.js already adds its dark silhouette)
  const dpi0 = drawPropImg;
  drawPropImg = function (p, ox, oy, shadow) {
    if (shadow || !p.looted || (p.container !== 'bush' && p.container !== 'rock')) return dpi0(p, ox, oy, shadow);
    const a = ctx.globalAlpha; ctx.globalAlpha = a * 0.7;
    try { return dpi0(p, ox, oy, shadow); } finally { ctx.globalAlpha = a; }
  };

  // ---------- guide arrow (screen space, drawn after the event tint) ----------
  function drawGuide() {
    const s = state(), P = G.player;
    if (!s || !s.guide || !P || P.dead || s.guide.loc !== locOf()) return;
    const gd = s.guide, d = dist(P.x, P.y, gd.x, gd.y);
    if (d < 50) { s.guide = null; return; }
    const W = canvas.width, H = canvas.height, k = canvas.clientWidth ? W / canvas.clientWidth : 1;
    const cx = W / 2, cy = H / 2, m = 40 * k;
    const sx = cx + (gd.x - G.camera.x) * G.zoom, sy = cy + (gd.y - G.camera.y) * G.zoom;
    const meters = Math.round(d / TILE), name = gd.label.length > 22 ? gd.label.slice(0, 21) + '…' : gd.label;
    const caption = (x, y) => {
      ctx.font = `${Math.round(18 * k)}px VT323, monospace`;
      ctx.fillStyle = '#000'; ctx.fillText(`${gd.icon} ${meters}m`, x + 1, y + 1);
      ctx.fillStyle = '#ffe27a'; ctx.fillText(`${gd.icon} ${meters}m`, x, y);
      ctx.font = `${Math.round(14 * k)}px VT323, monospace`;
      ctx.fillStyle = '#000'; ctx.fillText(name, x + 1, y + 16 * k + 1);
      ctx.fillStyle = '#fff'; ctx.fillText(name, x, y + 16 * k);
    };
    ctx.save();
    ctx.globalAlpha = 0.75 + 0.25 * Math.sin(G.time * 5);
    ctx.textAlign = 'center';
    if (sx > m && sx < W - m && sy > m && sy < H - m) {
      // target is on screen: a ring on it
      ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 3 * k;
      ctx.beginPath(); ctx.arc(sx, sy, 20 * k, 0, TAU); ctx.stroke();
      caption(sx, sy - 30 * k);
    } else {
      // target is off screen: an arrow on the screen edge, in its direction
      const dx = sx - cx, dy = sy - cy, a = Math.atan2(dy, dx), L = 20 * k;
      const t = Math.min(Math.abs(dx) > 1e-3 ? (cx - m) / Math.abs(dx) : Infinity, Math.abs(dy) > 1e-3 ? (cy - m) / Math.abs(dy) : Infinity);
      const ex = cx + dx * t, ey = cy + dy * t;
      ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2 * k;
      ctx.beginPath();
      ctx.moveTo(ex + Math.cos(a) * L, ey + Math.sin(a) * L);
      ctx.lineTo(ex + Math.cos(a + 2.5) * L * 0.8, ey + Math.sin(a + 2.5) * L * 0.8);
      ctx.lineTo(ex + Math.cos(a - 2.5) * L * 0.8, ey + Math.sin(a - 2.5) * L * 0.8);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      caption(clamp(ex - Math.cos(a) * 3 * L, 80 * k, W - 80 * k), clamp(ey - Math.sin(a) * 3 * L, 44 * k, H - 30 * k));
    }
    ctx.restore();
  }
  const det0 = drawEventTint;
  drawEventTint = function () { det0(); drawGuide(); };

  // ---------- map: the "Chỉ đường" button next to ✈, chest icons ----------
  let wrapEl = null, guideBtn = null;
  function mapDom() {
    if (wrapEl && wrapEl.isConnected) return wrapEl;
    const tp = $('mapTp'); if (!tp || !tp.parentNode) return null;
    wrapEl = document.createElement('div'); wrapEl.id = 'l21-mapact'; wrapEl.hidden = true;
    tp.parentNode.insertBefore(wrapEl, tp);
    wrapEl.appendChild(tp);
    guideBtn = document.createElement('button'); guideBtn.id = 'l21-guide'; guideBtn.hidden = true; guideBtn.textContent = '🧭 CHỈ ĐƯỜNG';
    guideBtn.onclick = () => {
      const sel = UI.mapSel; if (!sel || !sel.tp) return;
      const t = sel.tp; UI.mapSel = null;
      G.guideTo(t.gx ?? t.x, t.gy ?? t.y, t.name, t.icon, t.ckey);
      UI.closePanel();
    };
    wrapEl.appendChild(guideBtn);
    return wrapEl;
  }
  const dbm0 = UI.drawBigMap;
  UI.drawBigMap = function () {
    dbm0.call(this);
    const wrap = mapDom(); if (!wrap) return;
    if (World.mode === 'over' && this.mapC && G.v10) {
      const c = $('bigmap'), g = c.getContext('2d');
      const N = this.mapZoom, S = c.width / (N * SB), NH = c.height / S / SB;
      const x0 = this.mapC.x - N * SB / 2, y0 = this.mapC.y - NH * SB / 2;
      for (const t of tps()) {
        const mx = (t.gx / TILE - x0) * S, my = (t.gy / TILE - y0) * S;
        this.mapIcon(g, mx, my, t.icon, t.col, 15);
        this.mapHits.push({ x: mx, y: my, tp: t });
      }
    }
    const hide = $('mapTp').hidden;
    wrap.hidden = hide; guideBtn.hidden = hide;
  };
  const st = document.createElement('style'); st.id = 'v21loot-css';
  st.textContent = `#l21-mapact{display:flex;flex-wrap:nowrap;gap:8px;justify-content:center;align-items:center;margin:6px auto;max-width:100%}
#l21-mapact[hidden],#l21-guide[hidden]{display:none !important}
#l21-mapact #mapTp{margin:0;font-size:18px;padding:6px 14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60vw;min-width:0}
#l21-guide{min-width:0;font-size:18px;padding:6px 14px;white-space:nowrap;flex:0 0 auto;background:linear-gradient(#5a4410,#2c2006);border-color:#ffd23a}
body.touch #l21-mapact{position:absolute;left:50%;bottom:34px;transform:translateX(-50%);z-index:3;margin:0}
body.touch #l21-mapact #mapTp{position:static;transform:none;left:auto;bottom:auto}`;
  document.head.appendChild(st);

  // ---------- public API ----------
  Object.assign(G, {
    guideTo(x, y, label, icon, key) {
      const s = state(); if (!s) return null;
      s.guide = { x: Math.round(x), y: Math.round(y), label: String(label || 'Mục tiêu'), icon: icon || '🧭', loc: locOf(), key: key || null };
      this.toast('Chỉ đường: ' + s.guide.label, 'info');
      return s.guide;
    },
    guideClear() { const s = state(); if (s) s.guide = null; },
  });
})();
