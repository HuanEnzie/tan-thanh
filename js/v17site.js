// ===== v17 sites: towers, shrines, caravans, crypts, lairs, obelisks + treasure maps to dig up =====
const SITE_NAME = {
  tower: { md: 'Tháp canh bỏ hoang', tt: 'Phong hỏa đài', sl: 'Tháp canh Hiệp Hội' },
  shrine: { md: 'Bàn thờ cổ', tt: 'Linh đàn', sl: 'Đài tế Hệ Thống' },
  caravan: { md: 'Đoàn xe bị cướp', tt: 'Thương đội bị phục kích', sl: 'Đoàn xe tiếp tế bị tấn công' },
  crypt: { md: 'Hầm mộ', tt: 'Cổ mộ', sl: 'Ngục tối bị phong ấn' },
  lair: { md: 'Hang ổ', tt: 'Yêu động', sl: 'Hang ổ quái vật' },
  obelisk: { md: 'Bia đá cổ', tt: 'Thạch bia', sl: 'Bia đá Hệ Thống' },
};
const siteName = k => SITE_NAME[k][R3()];
const BLESS = [
  { id: 'dmg', name: 'Sức mạnh', k: 1.5, txt: '+22% sát thương' }, { id: 'spd', name: 'Tốc độ', k: 1.6, txt: '+19% tốc chạy' },
  { id: 'regen', name: 'Hồi phục', k: 2, txt: 'hồi 4 máu/giây' }, { id: 'xp', name: 'Ngộ đạo', k: 3, txt: '+30% kinh nghiệm' },
];

(function () {
  // ---------- generation: some wild blocks become sites ----------
  const gw = World.genWild;
  World.genWild = function (bk) {
    const sb = this._gen;
    if (!sb || this.mode !== 'over' || (sb.wet || 0) > 0.06 || Math.hypot(sb.sx, sb.sy) < 2.2 || SR.f() > 0.4) return gw.call(this, bk);
    const kinds = ['tower', 'shrine', 'caravan', 'crypt', 'lair', 'obelisk'];
    const kind = SR.pick(kinds), cx = Math.floor((bk.x0 + bk.x1) / 2), cy = Math.floor((bk.y0 + bk.y1) / 2), px = cx * TILE + 16, py = cy * TILE + 16;
    gw.call(this, bk); // keep the surrounding wilderness, the site sits on top
    sb.site = kind;
    const clear = r => { for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) if (Math.hypot(x - cx, y - cy) < r + 0.5 && !WATER_T(this.get(x, y)) && !this.isSolidT(this.get(x, y))) this.set(x, y, T.GRAVEL); this.reserve(cx - r - 1, cy - r - 1, cx + r + 1, cy + r + 1); };
    const ring = (n, rad, imgs, o = {}) => { for (let k = 0; k < n; k++) { const a = k / n * TAU + SR.range(-0.1, 0.1); this.addProp(SR.pick(imgs), px + Math.cos(a) * rad, py + Math.sin(a) * rad, o); } };
    switch (kind) {
      case 'tower': {
        clear(6);
        this.addProp('tower', px, py - 20, { r: 34, kind: 'tower' });
        ring(8, 150, [RL.props.barrier && RL.props.barrier[0] || 'sandbags', RL.props.fence || 'sandbags'], { r: 14 });
        this.chest(cx + 2, cy + 4, this.rollChest(1)); this.chest(cx - 3, cy + 4, this.rollChest(0));
        this.spawnGuards(px, py, 7, { r: 220, elite: 0.3, types: ['ranged', 'ranged', 'armored', 'walker', 'runner'] });
        break;
      }
      case 'shrine': {
        clear(5);
        this.addProp('ev_altar', px, py, { r: 26, kind: 'shrine', light: 160, lightCol: 'blue' });
        ring(6, 120, RL.props.rocks, { r: 12 });
        for (let k = 0; k < 4; k++) this.addProp(RL.props.lamp || 'lamp', px + (k % 2 ? 90 : -90), py + (k < 2 ? -70 : 70), { light: 140, r: 9, lightCol: 'blue' });
        break;
      }
      case 'caravan': {
        clear(6);
        for (let k = 0; k < 5; k++) this.container(SR.pick(RL.props.crate), cx + SR.int(-4, 4), cy + SR.int(-3, 3), 'crate');
        for (let k = 0; k < 3; k++) this.addProp(RL.props.barrel, px + SR.range(-120, 120), py + SR.range(-90, 90), { r: 9, explosive: true });
        this.chest(cx, cy + 2, this.rollChest(1));
        this.addProp('fx_5', px - 70, py - 40, { solid: false, layer: 0 });
        this.spawnGuards(px, py, 9, { r: 240, elite: 0.2 });
        break;
      }
      case 'crypt': {
        clear(6);
        this.addProp('fx_1', px, py, { solid: false, layer: 0, kind: 'gate', light: 170, lightCol: 'red', data: { rank: this.gateRank(sb.sx, sb.sy), story: false, crypt: true, seed: (h3(sb.sx, sb.sy, 15) * 1e9) | 0 } });
        for (let k = 0; k < 9; k++) this.addProp(SR.pick(['b_tomb', 'b_tomb', 'rocks']), px + SR.range(-200, 200), py + SR.range(-170, 170), { r: 12 });
        this.spawnGuards(px, py, 5, { r: 230, elite: 0.25, types: ['walker', 'walker', 'brute', 'runner'] });
        break;
      }
      case 'lair': {
        clear(7);
        ring(14, 230, RL.props.rocks, { r: 13 });
        this.chest(cx, cy + 2, this.rollChest(2));
        sb.spawns.push({ kind: 'boss', x: px, y: py - 30, mini: true, seed: (h3(sb.sx, sb.sy, 43) * 1e9) | 0 });
        this.spawnGuards(px, py, 6, { r: 200, elite: 0.35 });
        break;
      }
      case 'obelisk': {
        clear(4);
        this.addProp(SR.pick(RL.props.decor), px, py, { r: 18, kind: 'obelisk', light: 120, lightCol: 'blue' });
        ring(4, 80, RL.props.rocks, { r: 11 });
        this.spawnGuards(px, py, 3, { r: 180, elite: 0.1 });
        break;
      }
    }
  };
  // site icons on the minimap
  const bm = World.buildMini;
  World.buildMini = function (sb) {
    const r = bm.call(this, sb);
    return r;
  };
})();

Object.assign(G, {
  tmaps() { return this.v10.tmaps || (this.v10.tmaps = []); },
  // reading a map picks a hidden spot 3–7 zones away
  useMap() {
    const P = this.player;
    if (World.mode !== 'over') { this.toast('Chỉ đọc được bản đồ kho báu ở thế giới bên ngoài.', 'warn'); return; }
    for (let k = 0; k < 30; k++) {
      const a = R.range(0, TAU), d = R.range(3, 7) * SBPX, x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
      const gx = Math.floor(x / TILE), gy = Math.floor(y / TILE);
      if (World.waterAt(gx, gy) || World.zoneOf(Math.floor(gx / SB), Math.floor(gy / SB)) !== 0) continue;
      this.take('tmap');
      const m = { id: Date.now() % 1e9, x: Math.round(x), y: Math.round(y), tier: Math.min(3, 1 + Math.floor(Math.random() * 1.5 + World.levelAt(x, y) / 12)), found: false };
      this.tmaps().push(m);
      const dir = ['Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc', 'Bắc', 'Đông Bắc'][Math.round(((a % TAU) + TAU) % TAU / (TAU / 8)) % 8];
      this.toast(`🗺 Kho báu ở hướng ${dir}, cách khoảng ${Math.round(d / TILE)}m — xem mũi tên chỉ đường và Bản đồ [M].`, 'quest'); Sound.play('sfx_achievement', 0.5, 1.2);
      return;
    }
    this.toast('Bản đồ nhòe nét, chẳng đọc ra gì... thử lại ở chỗ khác.', 'warn');
  },
  digSpot(x, y, r = 70) { for (const m of this.tmaps()) if (!m.found && dist(m.x, m.y, x, y) < r) return m; return null; },
  digReward(m) {
    const P = this.player, lv = Math.max(P.level, World.levelAt(m.x, m.y)), luck = (P.perks.luck || 0) * 0.35 + 0.5 + m.tier * 0.5;
    m.found = true;
    FX.pillar(m.x, m.y, '#ffd65a', 1.6, 40); Sound.play('sfx_legendary', 0.6); this.shake(4);
    for (let i = 0; i < 1 + m.tier; i++) Items.dropGear(m.x + R.range(-40, 40), m.y + R.range(-40, 40), Loot.randomGear(lv, luck + m.tier * 0.4));
    Items.drop(m.x, m.y, 'gold', Math.round((60 + lv * 14) * (1 + m.tier * 0.7)));
    for (const id of ['medkit', 'pills', 'bt_a']) if (Math.random() < 0.6) Items.drop(m.x + R.range(-30, 30), m.y + R.range(-30, 30), id, R.int(1, 3));
    this.toast(`💰 Bạn đào được kho báu (hạng ${['', 'thường', 'quý', 'cổ vật'][m.tier]})!`, 'quest');
    // buried treasure is rarely left alone
    if (Math.random() < 0.4) { this.toast('⚠ Lính canh mộ trỗi dậy!', 'warn'); for (let i = 0; i < 3 + m.tier; i++) this.spawnEnemy(R.pick(['runner', 'armored', 'brute']), m.x + R.range(-120, 120), m.y + R.range(-120, 120), { lvl: lv, elite: i === 0, state: 'chase' }); }
  },
  blessing(p) {
    const B = R.pick(BLESS); this.v5.buffs[B.id] = { v: B.k, until: this.time + 480 };
    const P = this.player; P.hp = Math.min(P.maxHp, P.hp + P.maxHp * 0.35); if (this.v10) this.v10.mana = Math.min(this.maxMana(), this.v10.mana + 40);
    FX.pillar(p.x, p.y, '#9fd8ff', 1.4, 44); FX.ring(p.x, p.y, 10, 160, '#9fd8ff', 0.7, 6); Sound.play('sfx_heal', 0.7);
    this.toast(`✨ ${siteName('shrine')} ban phước: ${B.name} (${B.txt}) trong 8 phút, hồi 35% máu.`, 'quest');
  },
});

(function () {
  const ui = G.useItem;
  G.useItem = function (id) { if (id === 'tmap') { if (this.has(id)) this.useMap(); return; } return ui.call(this, id); };
  // loot: chests sometimes hold a map; big fights too
  const lp = G.lootProp;
  G.lootProp = function (p) { const r = lp.call(this, p); if (p && p.container === 'chest' && Math.random() < 0.07 + (p.data ? p.data.tier * 0.04 : 0)) this.give('tmap', 1); return r; };

  // ---------- interactions ----------
  const fi = G.findInteract;
  G.findInteract = function () {
    const best = fi.call(this), P = this.player;
    if (P.car || P.boat || World.mode !== 'over') return best;
    const o = best && (best.prop || best.ally || best.corpse), db = o ? dist(o.x, o.y, P.x, P.y) : best ? 0 : 1e9, skip = this._ixSkip;
    for (const p of World.propsNear(P.x, P.y, 90, this._sq || (this._sq = []))) {
      if (p.dead || (skip && skip.has(p))) continue;
      const d = dist(P.x, P.y, p.x, p.y) - (p.circles[0] ? p.circles[0].r : 10);
      if (d > 38 || d > db) continue;
      if (p.kind === 'shrine') return { prop: p, kind: 'shrine', label: p.looted ? `${siteName('shrine')} đã cạn linh lực` : `🙏 Cầu nguyện tại ${siteName('shrine')}` };
      if (p.kind === 'obelisk') return { prop: p, kind: 'obelisk', label: p.looted ? `${siteName('obelisk')} (đã giải mã)` : `📜 Giải mã ${siteName('obelisk')}` };
    }
    const m = this.digSpot(P.x, P.y, 56);
    if (m) { const dd = dist(m.x, m.y, P.x, P.y); if (dd < db) return { kind: 'dig', label: '⛏ Đào kho báu', map: m, ally: { x: m.x, y: m.y } }; }
    return best;
  };
  const ia = G.interact;
  G.interact = function (it) {
    if (it && it.kind === 'shrine') { if (it.prop.looted) { this.toast('Linh lực nơi đây đã cạn, hãy tìm đền khác.', 'info'); return; } World.markLooted(it.prop); this.blessing(it.prop); return; }
    if (it && it.kind === 'obelisk') {
      if (it.prop.looted) { this.toast('Bạn đã giải mã tấm bia này rồi.', 'info'); return; }
      World.markLooted(it.prop); this.give('tmap', 1); this.addXp(40); Sound.play('sfx_magic', 0.5);
      this.toast(`📜 ${siteName('obelisk')} hé lộ một bản đồ kho báu!`, 'quest'); return;
    }
    if (it && it.kind === 'dig') return this.startAction({ kind: 'dig', label: 'Đang đào...', dur: 4, range: 70, map: it.map });
    return ia.call(this, it);
  };
  const at = G.actionTick;
  G.actionTick = function (dt) {
    const a = this.action; at.call(this, dt);
    if (a && a.kind === 'dig') {
      if (this.action === a) { if (this.frame % 14 === 0) { Particles.dust(a.map.x, a.map.y, 4); Sound.play('sfx_step', 0.25, 0.6); } }
      else if (a.t >= a.dur && !a.map.found) this.digReward(a.map);
    }
  };
  // arrows to every unfound map
  const st = Story.targets;
  Story.targets = function () {
    const out = st.call(this) || [];
    if (G.v10 && World.mode === 'over') for (const m of G.v10.tmaps || []) if (!m.found) out.push({ x: m.x, y: m.y, label: 'Kho báu' });
    return out;
  };
  // buried spot: a dirt mound with an X, drawn under everything that moves
  const idr = Items.draw;
  Items.draw = function (c) {
    idr.call(this, c);
    if (World.mode !== 'over' || !G.v10 || !G.v10.tmaps) return;
    const v = G.view;
    for (const m of G.v10.tmaps) {
      if (m.found || !v || m.x < v.x0 - 40 || m.x > v.x1 + 40 || m.y < v.y0 - 40 || m.y > v.y1 + 40 || dist(m.x, m.y, G.player.x, G.player.y) > 380) continue;
      c.fillStyle = 'rgba(70,46,24,0.85)'; c.beginPath(); c.ellipse(m.x, m.y + 3, 17, 9, 0, 0, TAU); c.fill();
      c.strokeStyle = '#e8c85a'; c.lineWidth = 3; c.beginPath(); c.moveTo(m.x - 8, m.y - 5); c.lineTo(m.x + 8, m.y + 9); c.moveTo(m.x + 8, m.y - 5); c.lineTo(m.x - 8, m.y + 9); c.stroke();
      c.globalAlpha = 0.5 + Math.sin(G.time * 4) * 0.3; c.fillStyle = '#ffd65a'; c.beginPath(); c.arc(m.x, m.y - 8 - Math.sin(G.time * 3) * 3, 2.5, 0, TAU); c.fill(); c.globalAlpha = 1;
    }
  };
  // map overlay: ✖ for each map, site names near the player are shown by the minimap labels
  const dbm = UI.drawBigMap;
  UI.drawBigMap = function () {
    dbm.call(this);
    if (World.mode !== 'over' || !this.mapC || !G.v10) return;
    const c = $('bigmap'), g = c.getContext('2d'), K = this.mapK || 1, N = this.mapZoom, S = c.width / (N * SB), NH = c.height / S / SB;
    const x0 = this.mapC.x - N * SB / 2, y0 = this.mapC.y - NH * SB / 2;
    for (const m of G.v10.tmaps || []) { if (m.found) continue; const mx = ((m.x / TILE) - x0) * S, my = ((m.y / TILE) - y0) * S; this.mapIcon(g, mx, my, '✖', '#ffd65a', 20); }
  };
})();
