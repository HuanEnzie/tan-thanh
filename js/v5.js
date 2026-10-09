// ===== v5: regions, statues (map reveal), waypoints (fast travel), spirit orbs, base building, forge, kitchen, bounties =====
const REG = 6; // superblocks per region side
const ST_NAME = { md: 'Đài Phát Sóng', tt: 'Tượng Thần', sl: 'Cột Hệ Thống' };
const WP_NAME = { md: 'Trạm Dịch Chuyển', tt: 'Truyền Tống Trận', sl: 'Cổng Dịch Chuyển' };
const ORB_NAME = { md: 'Lõi Năng Lượng', tt: 'Linh Châu', sl: 'Tinh Thể Mana' };
const ORB_LIGHT = { md: 'cyan', tt: 'fire', sl: 'magenta' };
const HOME_NAME = { md: 'Khu Trú Ẩn', tt: 'Thanh Vân Cốc', sl: 'Quận Khởi Đầu' };
const REGION_NOUN = {
  plains: ['Đồng Bằng', 'Thảo Nguyên', 'Bình Nguyên'], forest: ['Rừng Già', 'Lâm Địa', 'Rừng Sâu'], snow: ['Băng Nguyên', 'Tuyết Lĩnh', 'Hàn Sơn'],
  desert: ['Sa Mạc', 'Hoang Mạc', 'Cồn Cát'], jungle: ['Rừng Mưa', 'Rừng Rậm'], swamp: ['Đầm Lầy', 'Sình Lầy'], autumn: ['Rừng Phong', 'Đồi Lá Đỏ'],
  sakura: ['Đồi Anh Đào', 'Thung Hoa'], mushroom: ['Rừng Nấm', 'Thung Bào Tử'], crystal: ['Thung Pha Lê', 'Mỏ Tinh Thể'], volcano: ['Hỏa Sơn', 'Núi Lửa'], grave: ['Nghĩa Địa', 'U Minh Địa'],
};
const REGION_ADJ = ['Gió Bấc', 'Lặng Im', 'Huyết Sắc', 'Vô Danh', 'Cô Tịch', 'Trăng Khuyết', 'Ánh Bạc', 'Hoàng Hôn', 'Sương Mù', 'Tro Tàn', 'Thiên Thanh', 'Đá Đỏ', 'Ngàn Năm', 'Quạ Đen', 'Bão Cát', 'Lửa Xanh', 'Mộng Ảo', 'Rêu Phong'];
Object.assign(ITEMS, { orb: { name: 'Linh Châu', icon: 'orb_tt', kind: 'mat', desc: 'Dâng lên Tượng Thần để tăng máu, thể lực và nhận vé triệu hồi.' } });

// ---------- region geometry (pure functions of the world seed) ----------
Object.assign(World, {
  regionOf(sx, sy) { return [Math.floor(sx / REG), Math.floor(sy / REG)]; },
  rkey(rx, ry) { return rx + ',' + ry; },
  regionInfo(rx, ry) {
    const k = this.rkey(rx, ry);
    this._rinfo = this._rinfo || new Map();
    let r = this._rinfo.get(k);
    if (r) return r;
    const cx = rx * REG + REG / 2, cy = ry * REG + REG / 2;
    const biome = (rx === 0 && ry === 0) ? 'plains' : this.biomeAt(cx, cy);
    const nouns = REGION_NOUN[biome] || REGION_NOUN.plains;
    const name = (rx === 0 && ry === 0) ? HOME_NAME[rk(RL.id)] : nouns[Math.floor(h3(rx, ry, 501) * nouns.length)] + ' ' + REGION_ADJ[Math.floor(h3(rx, ry, 502) * REGION_ADJ.length)];
    r = { rx, ry, key: k, biome, name, lvl: this.levelAt(cx * SBPX, cy * SBPX) };
    this._rinfo.set(k, r);
    return r;
  },
  // stable: story sites count even after they are done, so statues never move
  siteBlocked(sx, sy) { return (sx === 0 && sy === 0) || (typeof Story !== 'undefined' && Story.pois && Story.pois.some(p => p.sx === sx && p.sy === sy)) || this.wonderAt(sx, sy) != null; },
  statueSB(rx, ry) {
    if (rx === 0 && ry === 0) return [0, 0];
    for (let i = 0; i < 12; i++) {
      const sx = rx * REG + 1 + Math.floor(h3(rx, ry, 300 + i) * (REG - 2)), sy = ry * REG + 1 + Math.floor(h3(rx, ry, 400 + i) * (REG - 2));
      if (!this.siteBlocked(sx, sy)) return [sx, sy];
    }
    return [rx * REG + 2, ry * REG + 2];
  },
  waypointSBs(rx, ry) {
    const st = this.statueSB(rx, ry), out = [];
    for (let i = 0; i < 40 && out.length < 3; i++) {
      const sx = rx * REG + Math.floor(h3(rx, ry, 600 + i) * REG), sy = ry * REG + Math.floor(h3(rx, ry, 700 + i) * REG);
      if (this.siteBlocked(sx, sy) || (sx === st[0] && sy === st[1]) || out.some(o => Math.abs(o[0] - sx) + Math.abs(o[1] - sy) < 2)) continue;
      out.push([sx, sy]);
    }
    return out;
  },
  orbSpots(rx, ry) {
    const out = [];
    for (let i = 0; i < 8; i++) {
      const sx = rx * REG + Math.floor(h3(rx, ry, 800 + i) * REG), sy = ry * REG + Math.floor(h3(rx, ry, 900 + i) * REG);
      if (sx === 0 && sy === 0) continue;
      out.push({ id: this.rkey(rx, ry) + ':' + i, sx, sy, tx: 3 + Math.floor(h3(rx, ry, 1000 + i) * 26), ty: 3 + Math.floor(h3(rx, ry, 1100 + i) * 26) });
    }
    return out;
  },
  // what special site (if any) occupies this superblock
  v5Site(sx, sy) {
    if (this.mode !== 'over') return null;
    const [rx, ry] = this.regionOf(sx, sy);
    const st = this.statueSB(rx, ry);
    if (st[0] === sx && st[1] === sy && !(sx === 0 && sy === 0)) return { kind: 'statue', rx, ry };
    const wps = this.waypointSBs(rx, ry);
    const i = wps.findIndex(w => w[0] === sx && w[1] === sy);
    return i >= 0 ? { kind: 'wp', rx, ry, i } : null;
  },
  // the block's centre tile, same rule genOver uses for the interior
  siteCenter(sx, sy) {
    const V = this.hasV(sx, sy), H = this.hasH(sx, sy), tx0 = sx * SB, ty0 = sy * SB;
    return [Math.floor((tx0 + (V ? 5 : 1) + tx0 + 30) / 2), Math.floor((ty0 + (H ? 5 : 1) + ty0 + 30) / 2)];
  },
  genV5Site(bk, sb) {
    const s = this.v5Site(sb.sx, sb.sy);
    const cx = Math.floor((bk.x0 + bk.x1) / 2), cy = Math.floor((bk.y0 + bk.y1) / 2);
    const R0 = s.kind === 'statue' ? 6 : 4;
    for (let y = cy - R0; y <= cy + R0; y++) for (let x = cx - R0; x <= cx + R0; x++) if (Math.hypot(x - cx, y - cy) < R0 + 0.5 && this.get(x, y) !== T.WATER && this.get(x, y) !== T.LAVA) this.set(x, y, s.kind === 'statue' ? T.GRAVEL : T.CONC);
    this.reserve(cx - R0 - 1, cy - R0 - 1, cx + R0 + 1, cy + R0 + 1);
    sb.poi = { kind: s.kind };
    if (s.kind === 'statue') {
      this.addProp('st_' + rk(RL.id), cx * TILE + 16, cy * TILE, { r: 24, kind: 'statue', data: { rx: s.rx, ry: s.ry }, light: 180, lightCol: 'white' });
      for (const [x, y] of [[cx - 4, cy + 3], [cx + 4, cy + 3]]) this.addProp(RL.props.lamp || 'lamp', x * TILE + 16, y * TILE + 16, { light: 110, r: 8, lightCol: 'fire' });
      this.spawnGuards(cx * TILE, cy * TILE, 5, { r: 260, elite: 0.3 });
    } else {
      this.addProp('wp_' + rk(RL.id), cx * TILE + 16, cy * TILE + 16, { solid: false, layer: 0, kind: 'waypoint', data: { rx: s.rx, ry: s.ry, i: s.i }, light: 130, lightCol: 'cyan' });
      this.spawnGuards(cx * TILE, cy * TILE, 3, { r: 220 });
    }
  },
  // build a minimap tile without keeping the generated block (map reveal)
  genMini(sx, sy) {
    const k = this.mode + nkey(sx, sy);
    if (this.minis.has(k)) return;
    const live = this.sbs.get(nkey(sx, sy));
    if (live) { this.buildMini(live); return; }
    const sb = { sx, sy, key: nkey(sx, sy), tx0: sx * SB, ty0: sy * SB, tiles: new Uint8Array(SB * SB), bio: new Uint8Array(SB * SB), bld: new Int16Array(SB * SB).fill(-1), occ: new Uint8Array(SB * SB), block: new Uint8Array(SB * SB), mark: new Uint8Array(SB * SB), props: [], buildings: [], spawns: [], zone: 0, lights: [] };
    const pg = this._gen, pl = this._last;
    this._gen = sb; this._temp = true;
    srand = mulberry32((h3(sx, sy, 7) * 4294967296) | 0);
    try { this.genOver(sb); } catch (e) { console.warn('mini gen', e); }
    this._gen = pg; this._last = pl; this._temp = false;
    this.buildMini(sb);
  },
});

// ---------- state ----------
const BASE_DEF = {
  forge:   { name: 'Lò Rèn', img: 'base_forge', desc: L => L ? `Cường hoá trang bị tới +${Math.min(10, L * 2)}` : 'Xây để cường hoá vũ khí, giáp, thánh vật' },
  kitchen: { name: 'Bếp', img: 'base_kitchen', desc: L => L ? `Món ăn buff mạnh ${100 + L * 20}%, kéo dài ${4 + L} phút` : 'Xây để nấu món ăn tăng sức mạnh' },
  garden:  { name: 'Vườn', img: 'base_garden', desc: L => L ? `Cứ 4 phút sinh ${L * 2} vật phẩm (tối đa ${L * 8})` : 'Xây để tự sinh thảo dược, lương thực' },
  storage: { name: 'Kho', img: 'base_storage', desc: L => `Túi trang bị chứa ${30 + L * 10} món` },
  bed:     { name: 'Giường', img: 'base_bed', desc: L => L ? `Ngủ: hồi đầy máu, +${L * 10}% kinh nghiệm trong 10 phút` : 'Xây để ngủ lấy buff kinh nghiệm' },
  board:   { name: 'Bảng Nhiệm Vụ', img: 'base_board', desc: L => `${2 + L} nhiệm vụ mỗi ngày, thưởng x${(1 + L * 0.25).toFixed(2)}` },
};
const BASE_ORDER = ['forge', 'kitchen', 'garden', 'storage', 'bed', 'board'];
const MEALS = [
  { id: 'dmg', name: 'Lẩu Cay Bốc Lửa', desc: k => `+${Math.round(15 * k)}% sát thương`, col: '#ff7a3c' },
  { id: 'spd', name: 'Canh Gió Lốc', desc: k => `+${Math.round(12 * k)}% tốc độ chạy`, col: '#7dffd8' },
  { id: 'regen', name: 'Cháo Sâm Hồi Lực', desc: k => `Hồi ${(2 * k).toFixed(1)} máu/giây`, col: '#6dff7a' },
];
const BOUNTY_TYPES = [
  { t: 'kill', n: L => 25 + L * 3, label: n => `Hạ ${n} kẻ địch` },
  { t: 'elite', n: () => 3, label: n => `Hạ ${n} tinh anh (viền vàng)` },
  { t: 'chest', n: () => 3, label: n => `Mở ${n} rương báu` },
  { t: 'orb', n: () => 2, label: n => `Nhặt ${n} ${ORB_NAME[rk(RL.id)]}` },
  { t: 'boss', n: () => 1, label: () => 'Hạ 1 boss bất kỳ' },
  { t: 'wp', n: () => 1, label: () => 'Mở khoá 1 điểm dịch chuyển hoặc Tượng Thần' },
  { t: 'gate', n: () => 1, label: () => 'Chinh phục 1 Cổng hầm ngục' },
];
Object.assign(G, {
  v5: null,
  initV5(d) {
    d = d || {};
    this.v5 = Object.assign({ st: {}, wp: {}, orb: {}, off: 0, base: { forge: 0, kitchen: 0, garden: 0, storage: 0, bed: 0, board: 0 }, gardenT: Date.now(), bounties: [], bday: 0, buffs: {}, visited: {}, rc: {}, rr: {}, residents: 0, basePos: null }, d);
    this.v5.base = Object.assign({ forge: 0, kitchen: 0, garden: 0, storage: 0, bed: 0, board: 0 }, d.base || {});
    this.v5.st['0,0'] = this.v5.st['0,0'] || { x: 0, y: 0, home: true };
    this.region = null; this.v5gen = [];
  },
  stashCap() { return 30 + (this.v5 ? this.v5.base.storage * 10 : 0); },
  atBase() { const b = this.v5 && this.v5.basePos, P = this.player; return World.mode === 'over' && b && dist(P.x, P.y, b.x, b.y) < 750; },
  buff(id) { const b = this.v5 && this.v5.buffs[id]; return b && b.until > this.time ? b.v : 0; },

  // ---------- region progress ----------
  regionPct(rx, ry) {
    const k = World.rkey(rx, ry), v = this.v5;
    let p = v.st[k] ? 20 : 0;
    p += Math.min(3, Object.keys(v.wp).filter(w => w.startsWith(k + ':')).length) * 10;
    p += Object.keys(v.orb).filter(o => o.startsWith(k + ':')).length * 5;
    p += Math.min(5, v.rc[k] || 0) * 2;
    return Math.min(100, p);
  },
  regionProgress(rx, ry) {
    const k = World.rkey(rx, ry), pct = this.regionPct(rx, ry), rr = this.v5.rr[k] || 0;
    if (pct >= 50 && rr < 1) { this.v5.rr[k] = 1; this.giveTickets(3, `Khám phá 50% ${World.regionInfo(rx, ry).name}`); this.player.gold += 150; }
    if (pct >= 100 && rr < 2) { this.v5.rr[k] = 2; this.giveTickets(6, `Khám phá trọn vẹn ${World.regionInfo(rx, ry).name}!`); this.player.gold += 500; UI.banner('KHÁM PHÁ 100%', World.regionInfo(rx, ry).name, '#ffe6a0'); }
  },
  revealRegion(rx, ry) {
    for (let y = ry * REG; y < ry * REG + REG; y++) for (let x = rx * REG; x < rx * REG + REG; x++) { World.explored.add('over' + nkey(x, y)); this.v5gen.push([x, y]); }
  },
  activateStatue(p) {
    const k = World.rkey(p.data.rx, p.data.ry);
    if (this.v5.st[k]) return;
    this.v5.st[k] = { x: p.x | 0, y: (p.y + 70) | 0 };
    const info = World.regionInfo(p.data.rx, p.data.ry);
    FX.pillar(p.x, p.y, '#ffe6a0', 2.2, 110); FX.ring(p.x, p.y, 20, 420, '#ffe6a0', 1.2, 10); this.shake(6);
    Sound.play('sfx_gong', 0.8); Sound.play('sfx_achievement', 0.6, 0.8);
    UI.banner(ST_NAME[rk(RL.id)].toUpperCase() + ' ĐÃ THỨC TỈNH', `Bản đồ ${info.name} đã hiện ra • Có thể dịch chuyển tới đây`, '#ffe6a0');
    this.revealRegion(p.data.rx, p.data.ry);
    this.giveTickets(2, null); this.addXp(120 + this.player.level * 15);
    this.bountyEvent('wp');
    this.regionProgress(p.data.rx, p.data.ry);
    this.save();
  },
  unlockWaypoint(p) {
    const k = World.rkey(p.data.rx, p.data.ry) + ':' + p.data.i;
    if (this.v5.wp[k]) return;
    this.v5.wp[k] = { x: p.x | 0, y: (p.y + 40) | 0 };
    FX.pillar(p.x, p.y, '#7dc8ff', 1.4, 50); FX.ring(p.x, p.y, 10, 120, '#7dc8ff', 0.6, 6);
    Sound.play('sfx_portal', 0.7, 1.2);
    this.toast(`◆ Đã mở khoá ${WP_NAME[rk(RL.id)]} — mở bản đồ để dịch chuyển bất cứ lúc nào`, 'quest');
    this.addXp(40 + this.player.level * 5);
    this.bountyEvent('wp');
    this.regionProgress(p.data.rx, p.data.ry);
    this.save();
  },
  offerOrbs() {
    const P = this.player, n = P.inv.orb || 0;
    if (!n) return;
    const before = Math.floor(this.v5.off / 5);
    this.v5.off += n; delete P.inv.orb;
    const after = Math.floor(this.v5.off / 5);
    FX.pillar(P.x, P.y, '#ffe6a0', 1.2, 40); Sound.play('sfx_heal', 0.6, 0.8);
    for (let L = before + 1; L <= after; L++) {
      if (L % 2) { P.maxHp += 15; P.hp = P.maxHp; this.toast(`✦ Ân huệ cấp ${L}: +15 máu tối đa`, 'quest'); }
      else { P.maxStam += 15; P.stamina = P.maxStam; this.toast(`✦ Ân huệ cấp ${L}: +15 thể lực tối đa`, 'quest'); }
      this.giveTickets(2, null);
    }
    if (after === before) this.toast(`Đã dâng ${n} ${ORB_NAME[rk(RL.id)]} (${this.v5.off % 5}/5 tới cấp ân huệ tiếp theo)`, 'info');
    UI.dirty = true; this.save();
  },
  statueMenu(p) {
    const P = this.player, n = P.inv.orb || 0, L = Math.floor(this.v5.off / 5);
    const opts = [];
    if (n) opts.push({ text: `Dâng ${n} ${ORB_NAME[rk(RL.id)]}`, act: () => this.offerOrbs() });
    opts.push({ text: 'Mở bản đồ — dịch chuyển', act: () => setTimeout(() => UI.openPanel('map'), 50) });
    if (this.atBase()) opts.push({ text: 'Quản lý căn cứ', act: () => setTimeout(() => UI.openBase('build'), 50) });
    opts.push({ text: 'Rời đi', act: () => {} });
    UI.menuDialog({ name: ST_NAME[rk(RL.id)], portrait: null, text: `Ân huệ cấp ${L} • đã dâng ${this.v5.off} ${ORB_NAME[rk(RL.id)]} (${this.v5.off % 5}/5 tới cấp tiếp). Mỗi cấp: +15 máu hoặc thể lực tối đa và 2 vé triệu hồi.`, options: opts });
  },
  tpList() {
    const out = [], v = this.v5;
    if (v.basePos) out.push({ x: v.basePos.x, y: v.basePos.y + 60, name: 'Căn cứ — ' + HOME_NAME[rk(RL.id)], kind: 'base' });
    for (const k in v.st) { const s = v.st[k]; if (s.home || !s.x) continue; const [rx, ry] = k.split(',').map(Number); out.push({ x: s.x, y: s.y, name: ST_NAME[rk(RL.id)] + ' • ' + World.regionInfo(rx, ry).name, kind: 'statue' }); }
    for (const k in v.wp) { const w = v.wp[k]; const [rx, ry] = k.split(':')[0].split(',').map(Number); out.push({ x: w.x, y: w.y, name: WP_NAME[rk(RL.id)] + ' • ' + World.regionInfo(rx, ry).name, kind: 'wp' }); }
    return out;
  },
  // fast travel drops the old area and loads only the destination
  teleport(tp) {
    const P = this.player;
    if (World.mode !== 'over') { this.toast('Không thể dịch chuyển trong hầm ngục.', 'warn'); return; }
    if (this.zombies.some(z => !z.dead && z.state === 'chase' && dist(z.x, z.y, P.x, P.y) < 220)) { this.toast('Đang bị kẻ địch áp sát — thoát ra trước đã!', 'warn'); return; }
    if (P.car) this.exitCar();
    UI.closePanel();
    Sound.play('sfx_portal', 0.8, 1.1);
    FX.pillar(P.x, P.y, '#7dc8ff', 0.8, 40);
    const [rx, ry] = World.regionOf(Math.floor(tp.x / SBPX), Math.floor(tp.y / SBPX));
    $('loadHint').textContent = 'Đang tải ' + World.regionInfo(rx, ry).name + '...';
    UI.fade(() => {
      World.reset();
      this.zombies = []; Items.list = []; Bullets.list = []; Throws.fires = []; Throws.acids = []; Throws.traps = []; Throws.list = []; this.hazards = []; this.boss = null; UI.boss(null);
      this.allies = this.allies.filter(a => a.kind === 'comp' || a.kind === 'shadow');
      P.x = tp.x; P.y = tp.y; P.vx = P.vy = P.kx = P.ky = 0;
      World.update(P.x, P.y);
      for (const a of this.allies) { a.x = P.x + R.range(-30, 30); a.y = P.y + R.range(10, 40); }
      this.camera.x = P.x; this.camera.y = P.y; this.flowT = 0;
      FX.pillar(P.x, P.y, '#7dc8ff', 1, 40);
      this.save();
    });
  },

  // ---------- bounties ----------
  rollBounties() {
    const v = this.v5, L = v.base.board, lvl = this.player.level;
    const pool = BOUNTY_TYPES.slice(); const out = [];
    while (out.length < 2 + L && pool.length) {
      const b = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      const n = b.n(lvl);
      out.push({ t: b.t, n, c: 0, done: false, claimed: false, gold: Math.round((60 + lvl * 12) * (b.t === 'boss' || b.t === 'gate' ? 2 : 1) * (1 + L * 0.25)), tk: b.t === 'boss' || b.t === 'gate' ? 2 : 1 });
    }
    v.bounties = out; v.bday = this.day;
  },
  bountyEvent(t, n = 1) {
    const v = this.v5; if (!v) return;
    for (const b of v.bounties) if (b.t === t && !b.done) {
      b.c = Math.min(b.n, b.c + n);
      if (b.c >= b.n) { b.done = true; this.toast(`📜 Hoàn thành nhiệm vụ: ${BOUNTY_TYPES.find(x => x.t === b.t).label(b.n)} — về Căn cứ nhận thưởng!`, 'quest'); Sound.play('sfx_achievement', 0.5, 1.3); }
    }
  },
  claimBounty(b) {
    if (!b.done || b.claimed) return;
    if (!this.atBase()) { this.toast('Về Căn cứ (Bảng Nhiệm Vụ) để nhận thưởng.', 'warn'); return; }
    b.claimed = true; this.player.gold += b.gold; this.giveTickets(b.tk, null); this.give('scrap', 3);
    Sound.play('sfx_coin', 0.7);
    if (this.v5.bounties.every(x => x.claimed)) { this.toast('Đã xong mọi nhiệm vụ hôm nay — bảng mới sẽ có vào sáng mai.', 'good'); }
    this.save();
  },

  // ---------- base ----------
  upCost(id, L) { const m = { forge: 1.2, kitchen: 1, garden: 0.9, storage: 0.8, bed: 0.8, board: 1 }[id]; return { gold: Math.round(90 * (L + 1) * (L + 1) * m), scrap: 4 * (L + 1), planks: 3 * (L + 1) }; },
  canPay(c) { const P = this.player; return P.gold >= c.gold && (P.inv.scrap || 0) >= c.scrap && (P.inv.planks || 0) >= c.planks; },
  upgrade(id) {
    const v = this.v5, L = v.base[id];
    if (L >= 5) return;
    if (!this.atBase()) { this.toast('Phải ở Căn cứ mới xây được.', 'warn'); return; }
    const c = this.upCost(id, L);
    if (!this.canPay(c)) { this.toast('Không đủ nguyên liệu.', 'warn'); return; }
    this.player.gold -= c.gold; this.take('scrap', c.scrap); this.take('planks', c.planks);
    v.base[id] = L + 1;
    if (id === 'garden' && L === 0) v.gardenT = Date.now();
    if (id === 'board') { const extra = 2 + v.base.board - v.bounties.length; for (let i = 0; i < extra; i++) { const b = BOUNTY_TYPES[Math.floor(Math.random() * BOUNTY_TYPES.length)]; v.bounties.push({ t: b.t, n: b.n(this.player.level), c: 0, done: false, claimed: false, gold: Math.round((60 + this.player.level * 12) * (1 + v.base.board * 0.25)), tk: 1 }); } }
    const p = World.propsNear(v.basePos.x, v.basePos.y, 600).find(q => q.kind === 'base' && q.data.b === id);
    if (p) { FX.pillar(p.x, p.y, '#ffd65a', 1.4, 50); Particles.burst(p.x, p.y, 30, '#ffd65a', 180); }
    Sound.play('sfx_craft', 0.7); Sound.play('sfx_achievement', 0.5, 1.2);
    this.toast(`🏠 ${BASE_DEF[id].name} lên cấp ${L + 1}!`, 'quest');
    this.save();
  },
  gardenReady() { const L = this.v5.base.garden; if (!L) return 0; return Math.min(L * 8, Math.floor((Date.now() - this.v5.gardenT) / 240000) * L * 2); },
  harvest() {
    const n = this.gardenReady(); if (!n) { this.toast('Vườn chưa có gì để thu hoạch.', 'info'); return; }
    this.v5.gardenT = Date.now();
    const pool = ['food', 'water', 'pills', 'bandage', 'flower', 'food', 'energy', 'choco'];
    const got = {};
    for (let i = 0; i < n; i++) { const id = R.pick(pool); got[id] = (got[id] || 0) + 1; }
    for (const id in got) this.give(id, got[id]);
    if (this.v5.base.garden >= 4 && Math.random() < 0.3) this.giveTickets(1, null);
    Sound.play('sfx_pickup', 0.6); this.save();
  },
  sleep() {
    const L = this.v5.base.bed, P = this.player;
    if (!L) { UI.openBase('build'); return; }
    if (this.zombies.some(z => !z.dead && dist(z.x, z.y, P.x, P.y) < 400)) { this.toast('Không thể ngủ khi kẻ địch ở gần.', 'warn'); return; }
    UI.fade(() => {
      P.hp = P.maxHp; P.stamina = P.maxStam; P.hunger = Math.max(P.hunger, 60); P.thirst = Math.max(P.thirst, 60);
      this.clock = (this.clock + 6) % 24;
      this.v5.buffs.xp = { v: L * 0.1, until: this.time + 600 };
      for (const c of this.companions) if (c.joined && c.ally) c.ally.hp = c.ally.maxHp;
      this.toast(`😴 Ngủ một giấc ngon — +${L * 10}% kinh nghiệm trong 10 phút.`, 'good');
      Sound.play('sfx_heal', 0.6); this.save();
    });
  },
  cook(m) {
    const L = this.v5.base.kitchen, P = this.player;
    if (!L) return;
    if (!this.atBase()) { this.toast('Phải ở Căn cứ mới nấu được.', 'warn'); return; }
    const gold = 25 + P.level * 4;
    if (!this.has('food', 2) || !this.has('water', 1) || P.gold < gold) { this.toast(`Cần 2 ${itm('food').name}, 1 ${itm('water').name} và ${gold} ${cur().name}.`, 'warn'); return; }
    this.take('food', 2); this.take('water', 1); P.gold -= gold;
    const k = 1 + L * 0.2;
    this.v5.buffs[m.id] = { v: k, until: this.time + (4 + L) * 60 };
    Sound.play('sfx_eat', 0.7); FX.ring(P.x, P.y, 8, 50, m.col, 0.5, 4);
    this.toast(`🍲 ${m.name}: ${m.desc(k)} trong ${4 + L} phút`, 'good');
  },
  // forge: +1 … +10
  enhCost(it) { const p = it.plus || 0; return { gold: Math.round((15 + it.ilvl * 2) * [1, 1.5, 2.2, 3.2, 4.5, 6][it.rarity] * Math.pow(p + 1, 1.6)), scrap: p + 1 }; },
  enhChance(it) { return [1, 1, 1, 1, 1, 0.9, 0.8, 0.65, 0.5, 0.4][it.plus || 0] || 0.3; },
  enhance(it) {
    const P = this.player, L = this.v5.base.forge;
    if (!L || !this.atBase()) { this.toast('Cần Lò Rèn ở Căn cứ.', 'warn'); return; }
    const p = it.plus || 0;
    if (p >= Math.min(10, L * 2)) { this.toast('Nâng cấp Lò Rèn để cường hoá cao hơn.', 'info'); return; }
    const c = this.enhCost(it);
    if (P.gold < c.gold || (P.inv.scrap || 0) < c.scrap) { this.toast('Không đủ tiền hoặc ' + itm('scrap').name + '.', 'warn'); return; }
    P.gold -= c.gold; this.take('scrap', c.scrap);
    if (Math.random() < this.enhChance(it)) {
      it.plus = p + 1;
      it.name = it.name.replace(/ \+\d+$/, '') + ' +' + it.plus;
      P.wcache = {}; P.applyGear(); this.applyRelics();
      Sound.play(it.plus >= 7 ? 'sfx_legendary' : 'sfx_craft', 0.7, 1 + it.plus * 0.03);
      this.toast(`⚒ Cường hoá thành công: ${it.name}!`, 'good');
      return true;
    }
    Sound.play('sfx_hit', 0.6, 0.6); this.toast('⚒ Cường hoá thất bại... nguyên liệu đã mất, trang bị vẫn nguyên vẹn.', 'warn');
    return false;
  },

  // ---------- per-frame ----------
  v5Tick(dt) {
    const P = this.player, v = this.v5; if (!v || !P) return;
    if (v.bday !== this.day || !v.bounties.length) { const had = v.bounties.length; this.rollBounties(); if (had) this.toast('📜 Bảng Nhiệm Vụ có nhiệm vụ mới!', 'info'); }
    // map reveal work, a little each frame
    for (let i = 0; i < 2 && this.v5gen.length; i++) { const [x, y] = this.v5gen.shift(); World.genMini(x, y); }
    // kitchen regen
    const rg = this.buff('regen'); if (rg && !P.dead) P.hp = Math.min(P.maxHp, P.hp + 2 * rg * dt);
    if (this.frame % 30 === 0) { const mb = $('tMoreBtn'); if (mb) mb.classList.toggle('note', v.bounties.some(b => b.done && !b.claimed) || this.gardenReady() > 0); }
    if (World.mode !== 'over') return;
    if (this.frame % 10 === 0) {
      const [rx, ry] = World.regionOf(Math.floor(P.x / SBPX), Math.floor(P.y / SBPX)), k = World.rkey(rx, ry);
      if (k !== this.region) {
        const first = !this.region; this.region = k;
        const info = World.regionInfo(rx, ry);
        if (!v.visited[k]) { v.visited[k] = 1; }
        if (!first) UI.banner(info.name.toUpperCase(), `Vùng cấp ~${info.lvl} • Khám phá ${this.regionPct(rx, ry)}%${v.st[k] ? '' : ' • ' + ST_NAME[rk(RL.id)] + ' chưa thức tỉnh'}`, '#cfe8ff');
      }
      // pick up orbs by walking over them
      for (const p of World.propsNear(P.x, P.y, 60, this._oq || (this._oq = []))) if (p.kind === 'orb' && !p.dead && dist(p.x, p.y, P.x, P.y) < 30) {
        World.removeProp(p); v.orb[p.data.id] = 1;
        P.inv.orb = (P.inv.orb || 0) + 1;
        FX.pillar(p.x, p.y, '#ffe6a0', 0.8, 26); Particles.burst(p.x, p.y, 16, '#ffe6a0', 140); Sound.play('sfx_magic', 0.6, 1.5);
        const [orx, ory] = p.data.id.split(':')[0].split(',').map(Number);
        Floaters.add(P.x, P.y - 30, `+1 ${ORB_NAME[rk(RL.id)]} (${Object.keys(v.orb).filter(o => o.startsWith(World.rkey(orx, ory) + ':')).length}/8)`, '#ffe6a0', 11, true);
        this.bountyEvent('orb'); this.regionProgress(orx, ory); UI.dirty = true;
      }
      // residents live at the base
      if (v.basePos && dist(P.x, P.y, v.basePos.x, v.basePos.y) < 1000) {
        const have = this.allies.filter(a => a.kind === 'resident').length, want = Math.min(6, v.residents);
        if (have < want) { const a = new Ally('resident', v.basePos.x + R.range(-160, 160), v.basePos.y + R.range(60, 200), { img: RL.npc[2 + (have % 2)] || RL.npc[0] }); a.home = { x: a.x, y: a.y }; a.sayT = R.range(5, 15); this.allies.push(a); }
      }
    }
  },
});

// ---------- hooks into the existing game ----------
(function () {
  // region names / levels depend on the seed and world: forget them for every new world
  const wi = World.init;
  World.init = function (seed) { wi.call(this, seed); this._rinfo = new Map(); };
  // orbs are placed after a block is generated
  const gen = World.genOver;
  World.genOver = function (sb) {
    gen.call(this, sb);
    if (this.mode !== 'over' || !G.v5) return;
    const [rx, ry] = this.regionOf(sb.sx, sb.sy);
    for (const o of this.orbSpots(rx, ry)) {
      if (o.sx !== sb.sx || o.sy !== sb.sy || G.v5.orb[o.id]) continue;
      let px = null;
      for (let r = 0; r < 6 && !px; r++) for (let dy = -r; dy <= r && !px; dy++) for (let dx = -r; dx <= r; dx++) { const x = sb.tx0 + o.tx + dx, y = sb.ty0 + o.ty + dy; if (this.free(x, y) && this.isGround(this.get(x, y))) { px = [x, y]; break; } }
      if (px) this.addProp('orb_' + rk(RL.id), px[0] * TILE + 16, px[1] * TILE + 16, { solid: false, layer: 2, kind: 'orb', data: { id: o.id }, light: 70, lightCol: ORB_LIGHT[rk(RL.id)] });
    }
  };
  // the base: buildings around the shelter + the home statue
  const gs = World.genStart;
  World.genStart = function (bk) {
    gs.call(this, bk);
    const cx = Math.floor((bk.x0 + bk.x1) / 2), cy = Math.floor((bk.y0 + bk.y1) / 2);
    if (G.v5) G.v5.basePos = { x: cx * TILE + 16, y: cy * TILE + 16 };
    const place = (b, tx, ty, r) => { this.reserve(tx - 1, ty - 1, tx + 1, ty + 1); this.addProp(BASE_DEF[b].img, tx * TILE + 16, ty * TILE + 16, { r, kind: 'base', data: { b } }); };
    place('forge', cx + 8, cy - 2, 22); place('kitchen', cx + 8, cy + 3, 18); place('storage', cx - 8, cy - 2, 20); place('garden', cx - 8, cy + 2, 0);
    place('board', cx + 7, cy + 8, 14); place('bed', cx - 2, cy + 1, 0);
    this.addProp('st_' + rk(RL.id), (cx - 1) * TILE + 16, (cy + 10) * TILE, { r: 24, kind: 'statue', data: { rx: 0, ry: 0, home: true }, light: 170, lightCol: 'white' });
  };
  const dec = World.addDecal;
  World.addDecal = function (...a) { if (this._temp) return; return dec.apply(this, a); };

  // interactions
  const fi = G.findInteract;
  G.findInteract = function () {
    const best = fi.call(this);
    if (best && (best.ally || ['loot', 'gate', 'exit', 'stairs', 'cage'].includes(best.kind))) return best;
    const P = this.player; if (P.car) return best;
    for (const p of World.propsNear(P.x, P.y, 90, this._iq || (this._iq = []))) {
      if (p.dead || (this._ixSkip && this._ixSkip.has(p))) continue;
      const d = dist(P.x, P.y, p.x, p.y);
      if (p.kind === 'statue' && d < 80) { const k = World.rkey(p.data.rx, p.data.ry); return { prop: p, kind: 'statue', label: this.v5.st[k] && !p.data.home || p.data.home ? `${ST_NAME[rk(RL.id)]} — dâng ${ORB_NAME[rk(RL.id)]} / dịch chuyển` : `Đánh thức ${ST_NAME[rk(RL.id)]}` }; }
      if (p.kind === 'waypoint' && d < 60) { const k = World.rkey(p.data.rx, p.data.ry) + ':' + p.data.i; return { prop: p, kind: 'waypoint', label: this.v5.wp[k] ? 'Mở bản đồ dịch chuyển' : `Mở khoá ${WP_NAME[rk(RL.id)]}` }; }
      if (p.kind === 'base' && d < 70) { const b = p.data.b, L = this.v5.base[b]; return { prop: p, kind: 'base', label: L ? `${BASE_DEF[b].name} (cấp ${L})${b === 'garden' && this.gardenReady() ? ' — thu hoạch ' + this.gardenReady() : b === 'bed' ? ' — ngủ' : ''}` : `🔨 Xây ${BASE_DEF[b].name}` }; }
    }
    return best;
  };
  const ia = G.interact;
  G.interact = function (it) {
    if (it && it.kind === 'statue') {
      const p = it.prop, k = World.rkey(p.data.rx, p.data.ry);
      if (!p.data.home && !this.v5.st[k]) {
        if (this.zombies.some(z => !z.dead && dist(z.x, z.y, p.x, p.y) < 260)) { this.toast('Hãy dọn sạch kẻ địch quanh ' + ST_NAME[rk(RL.id)] + ' trước!', 'warn'); return; }
        return this.startAction({ kind: 'statue', prop: p, label: 'Đang đánh thức...', dur: 1.6 });
      }
      return this.statueMenu(p);
    }
    if (it && it.kind === 'waypoint') { const p = it.prop, k = World.rkey(p.data.rx, p.data.ry) + ':' + p.data.i; if (!this.v5.wp[k]) return this.unlockWaypoint(p); return UI.openPanel('map'); }
    if (it && it.kind === 'base') {
      const b = it.prop.data.b, L = this.v5.base[b];
      if (L && b === 'bed') return this.sleep();
      if (L && b === 'garden' && this.gardenReady()) return this.harvest();
      return UI.openBase(L && b === 'forge' ? 'forge' : L && b === 'kitchen' ? 'kitchen' : b === 'board' ? 'bounty' : 'build');
    }
    return ia.call(this, it);
  };
  const at = G.actionTick;
  G.actionTick = function (dt) {
    const a = this.action;
    if (a && a.kind === 'statue') {
      const P = this.player;
      if (dist(P.x, P.y, a.x, a.y) > a.range) { this.action = null; return; }
      a.t += dt; if (Math.random() < 0.4) Particles.add({ x: a.prop.x + R.range(-20, 20), y: a.prop.y + 20, vx: 0, vy: -80, life: 0.6, max: 0.6, size: 3, col: '#ffe6a0', drag: 1, glow: true });
      if (a.t >= a.dur) { this.action = null; this.activateStatue(a.prop); }
      return;
    }
    return at.call(this, dt);
  };

  // progress hooks
  const kill = G.killEnemy;
  G.killEnemy = function (z, src) { kill.call(this, z, src); this.bountyEvent('kill'); if (z.elite) this.bountyEvent('elite'); if (z.boss) this.bountyEvent('boss'); };
  const rk2 = G.remoteKill;
  if (rk2) G.remoteKill = function (k) { rk2.call(this, k); this.bountyEvent('kill'); if (k.elite) this.bountyEvent('elite'); if (k.boss) this.bountyEvent('boss'); };
  const oc = G.openChest;
  G.openChest = function (p) {
    const mimic = p.data && p.data.mimic;
    oc.call(this, p);
    if (mimic || World.mode !== 'over') { if (!mimic) this.bountyEvent('chest'); return; }
    this.bountyEvent('chest');
    const [rx, ry] = World.regionOf(Math.floor(p.x / SBPX), Math.floor(p.y / SBPX)), k = World.rkey(rx, ry);
    this.v5.rc[k] = (this.v5.rc[k] || 0) + 1; this.regionProgress(rx, ry);
  };
  const dbd = G.dungeonBossDown;
  G.dungeonBossDown = function (z) { dbd.call(this, z); if (World.dg && World.dg.cleared) this.bountyEvent('gate'); };
  const rc = G.rescueCiv;
  G.rescueCiv = function (a) { rc.call(this, a); this.v5.residents = Math.min(12, (this.v5.residents || 0) + 1); this.toast('🏠 Người được cứu sẽ đến sống ở Căn cứ của bạn.', 'good'); };
  const ax = G.addXp;
  G.addXp = function (n) { return ax.call(this, n * (1 + this.buff('xp'))); };
  const he = G.hitEnemy;
  G.hitEnemy = function (z, dmg, kx, ky, src, ang, wp) { if (src === 'gun' || src === 'melee' || src === 'skill') dmg *= 1 + 0.15 * this.buff('dmg'); return he.call(this, z, dmg, kx, ky, src, ang, wp); };
  const sm = Player.prototype.speedMul;
  Player.prototype.speedMul = function () { return sm.call(this) * (1 + 0.12 * G.buff('spd')); };
  // enhancement levels feed the numbers
  const st = Loot.stats;
  Loot.stats = function (it) { const s = st.call(this, it); if (s && it.plus) s.dmg *= 1 + it.plus * 0.08; return s; };
  const pw = Loot.power;
  Loot.power = function (it) { return pw.call(this, it) * (1 + ((it && it.plus) || 0) * 0.08); };
  const ag = Player.prototype.applyGear;
  Player.prototype.applyGear = function () { ag.call(this); let extra = 0; for (const s of ARMOR_SLOTS) { const it = this.armor[s]; if (it && it.plus) extra += Math.round(it.armor * it.plus * 0.1); } this.armorVal += extra; };
  const rl = Player.prototype.relic;
  Player.prototype.relic = function (type) { let v = rl.call(this, type); for (const r of this.relics) if (r && r.type === type && r.plus) v += r.value * r.plus * 0.06; return v; };
  const sa = G.stashAdd;
  G.stashAdd = function (item) {
    const P = this.player; P.stash.push(item);
    if (P.stash.length > this.stashCap()) { P.stash.sort((a, b) => Loot.power(b) * (b.rarity + 1) - Loot.power(a) * (a.rarity + 1)); const s = P.stash.pop(); this.give('scrap', 1 + s.rarity); }
  };
  // residents: idle townsfolk who never fight and can't be hurt
  const au = Ally.prototype.update;
  Ally.prototype.update = function (dt) {
    if (this.kind !== 'resident') return au.call(this, dt);
    this.wt = (this.wt || 0) - dt; this.walkT += dt * 4;
    if (this.wt <= 0) { this.wt = R.range(2, 5); const a = R.range(0, TAU); this.goal = { x: this.home.x + Math.cos(a) * R.range(0, 120), y: this.home.y + Math.sin(a) * R.range(0, 80) }; }
    if (this.goal) { const dx = this.goal.x - this.x, dy = this.goal.y - this.y, d = Math.hypot(dx, dy); if (d > 6) { this.x += dx / d * 40 * dt; this.y += dy / d * 40 * dt; this.angle = Math.atan2(dy, dx); World.collideCircle(this, this.r); } }
    this.sayT -= dt; if (this.say) { this.say.t -= dt; if (this.say.t <= 0) this.say = null; }
    if (this.sayT <= 0) { this.sayT = R.range(12, 25); if (dist(this.x, this.y, G.player.x, G.player.y) < 300) this.speak(R.pick(['Cảm ơn đã cứu tôi!', 'Ở đây an toàn thật.', 'Tôi trông vườn giúp bạn nhé.', 'Đi đường cẩn thận!', 'Căn cứ ngày càng đông vui!']), 3); }
  };
  const ah = Ally.prototype.hurt;
  Ally.prototype.hurt = function (d) { if (this.kind === 'resident') return; return ah.call(this, d); };
  if (typeof Net !== 'undefined') {
    const lch = Net.loadChar;
    Net.loadChar = function (realm) { const ch = lch.call(this, realm); G.initV5(ch.v5 ? Object.assign({}, ch.v5, { basePos: null }) : null); return ch; };
  }
  // fewer cursor marks on touch screens
  const dsu = drawScreenUI;
  drawScreenUI = function () { if (Touch.on) { const m = Input.mouse; const ox = m.x; m.x = -9999; dsu(); m.x = ox; return; } dsu(); };
})();

// ---------- drawing: statues, waypoints, orbs, base buildings ----------
(function () {
  const dp = drawProp;
  drawProp = function (p) {
    const v = G.view;
    if (!v || p.x + p.w < v.x0 - 40 || p.x - p.w > v.x1 + 40 || p.y + p.h < v.y0 - 40 || p.y - p.h > v.y1 + 40) return;
    if (p.kind === 'orb') {
      const b = Math.sin(G.time * 3 + p.x) * 4;
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 + Math.sin(G.time * 4 + p.y) * 0.15;
      ctx.drawImage(GLOW[ORB_LIGHT[rk(RL.id)]] || GLOW.white, p.x - 24, p.y - 24 + b, 48, 48);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      const im = IMG[p.img]; if (im) ctx.drawImage(im, p.x - p.w / 2, p.y - p.h / 2 + b, p.w, p.h);
      return;
    }
    if (p.kind === 'statue' || p.kind === 'waypoint') {
      const k = p.kind === 'statue' ? World.rkey(p.data.rx, p.data.ry) : World.rkey(p.data.rx, p.data.ry) + ':' + p.data.i;
      const on = p.kind === 'statue' ? (p.data.home || G.v5.st[k]) : G.v5.wp[k];
      if (on) {
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.28 + Math.sin(G.time * 2) * 0.1;
        const r = p.kind === 'statue' ? 90 : 60;
        ctx.drawImage(p.kind === 'statue' ? GLOW.white : GLOW.cyan, p.x - r, p.y - r * 0.6, r * 2, r * 2 * 0.8);
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      }
      if (on) dp(p); else { ctx.save(); ctx.filter = 'grayscale(0.85) brightness(0.65)'; dp(p); ctx.restore(); }
      if (dist(p.x, p.y, G.player.x, G.player.y) < 260) {
        ctx.font = '10px VT323, monospace'; ctx.textAlign = 'center';
        const t = p.kind === 'statue' ? (on ? '✦ ' : '? ') + ST_NAME[rk(RL.id)] : (on ? '◆ ' : '◇ ') + WP_NAME[rk(RL.id)];
        ctx.fillStyle = '#000'; ctx.fillText(t, p.x + 1, p.y - p.h / 2 - 5); ctx.fillStyle = on ? '#ffe6a0' : '#b8b8c8'; ctx.fillText(t, p.x, p.y - p.h / 2 - 6);
      }
      return;
    }
    if (p.kind === 'base') {
      const L = G.v5.base[p.data.b];
      if (!L) { ctx.globalAlpha = 0.42; dp(p); ctx.globalAlpha = 1; } else dp(p);
      if (dist(p.x, p.y, G.player.x, G.player.y) < 230) {
        ctx.font = '10px VT323, monospace'; ctx.textAlign = 'center';
        const t = L ? `${BASE_DEF[p.data.b].name} Lv${L}` : `🔨 ${BASE_DEF[p.data.b].name}`;
        ctx.fillStyle = '#000'; ctx.fillText(t, p.x + 1, p.y - p.h / 2 - 5); ctx.fillStyle = L ? '#ffd65a' : '#aaa'; ctx.fillText(t, p.x, p.y - p.h / 2 - 6);
      }
      if (p.data.b === 'garden' && G.gardenReady()) { ctx.fillStyle = '#6dff7a'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', p.x, p.y - p.h / 2 - 16 + Math.sin(G.time * 5) * 3); }
      if (p.data.b === 'board' && G.v5.bounties.some(b => b.done && !b.claimed)) { ctx.fillStyle = '#ffd65a'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', p.x, p.y - p.h / 2 - 16 + Math.sin(G.time * 5) * 3); }
      return;
    }
    dp(p);
  };
})();

// ---------- world map with fog, regions and fast travel ----------
Object.assign(UI, {
  mapZoom: 24, mapC: null, mapSel: null, mapHits: [],
  drawBigMap() {
    const c = $('bigmap'), g = c.getContext('2d');
    const P = G.player.car || G.player;
    const cw = c.clientWidth || 800, chh = c.clientHeight || 800, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (Math.abs(c.width - Math.round(cw * dpr)) > 2 || Math.abs(c.height - Math.round(chh * dpr)) > 2) { c.width = Math.round(cw * dpr); c.height = Math.round(chh * dpr); }
    const K = c.width / cw; // text scale
    this.mapK = K;
    if (World.mode === 'dungeon') { this.drawDungeonMap(c, g); return; }
    if (!this.mapC) this.mapC = { x: P.x / TILE, y: P.y / TILE };
    const N = this.mapZoom, S = c.width / (N * SB), NH = c.height / S / SB;
    const x0 = this.mapC.x - N * SB / 2, y0 = this.mapC.y - NH * SB / 2;
    const toM = (wx, wy) => [((wx / TILE) - x0) * S, ((wy / TILE) - y0) * S];
    g.fillStyle = '#07080c'; g.fillRect(0, 0, c.width, c.height);
    g.imageSmoothingEnabled = false;
    const sx0 = Math.floor(x0 / SB), sy0 = Math.floor(y0 / SB), v = G.v5;
    for (let sy = sy0; sy <= sy0 + Math.ceil(NH) + 1; sy++) for (let sx = sx0; sx <= sx0 + N + 1; sx++) {
      const [rx, ry] = World.regionOf(sx, sy), lit = !!v.st[World.rkey(rx, ry)];
      const k = 'over' + nkey(sx, sy), seen = World.explored.has(k);
      const px = (sx * SB - x0) * S, py = (sy * SB - y0) * S, w = SB * S + 0.5;
      if (lit || seen) {
        const m = World.getMini(k);
        if (m) { g.globalAlpha = lit ? 1 : 0.55; g.drawImage(m, px, py, w, w); g.globalAlpha = 1; }
        else if (lit) { if (!G.v5gen.some(q => q[0] === sx && q[1] === sy)) G.v5gen.push([sx, sy]); g.fillStyle = '#1a1e26'; g.fillRect(px, py, w, w); }
      } else { g.fillStyle = (sx + sy) % 2 ? '#0d1016' : '#0b0d13'; g.fillRect(px, py, w, w); }
    }
    // region borders, names, completion
    const rx0 = Math.floor(sx0 / REG) - 1, ry0 = Math.floor(sy0 / REG) - 1;
    this.mapHits = [];
    g.textAlign = 'center';
    for (let ry = ry0; ry <= ry0 + Math.ceil(NH / REG) + 2; ry++) for (let rx = rx0; rx <= rx0 + Math.ceil(N / REG) + 2; rx++) {
      const k = World.rkey(rx, ry), lit = !!v.st[k], vis = lit || v.visited[k];
      const px = (rx * REG * SB - x0) * S, py = (ry * REG * SB - y0) * S, w = REG * SB * S;
      g.strokeStyle = lit ? 'rgba(255,230,160,0.35)' : 'rgba(255,255,255,0.08)'; g.lineWidth = 1; g.strokeRect(px, py, w, w);
      if (!lit) { g.fillStyle = 'rgba(8,10,16,0.55)'; g.fillRect(px, py, w, w); }
      const info = World.regionInfo(rx, ry);
      if (vis && N <= 36) { g.font = `${Math.round(16 * K)}px VT323, monospace`; g.fillStyle = 'rgba(0,0,0,0.7)'; g.fillText(`${info.name} • ${G.regionPct(rx, ry)}%`, px + w / 2 + K, py + 17 * K); g.fillStyle = lit ? '#ffe6a0' : '#9aa0b0'; g.fillText(`${info.name} • ${G.regionPct(rx, ry)}%`, px + w / 2, py + 16 * K); }
      // the statue is always hinted for visited regions and neighbours of lit ones
      const near = vis || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => v.st[World.rkey(rx + a, ry + b)]);
      if (near && !(rx === 0 && ry === 0)) {
        const [ssx, ssy] = World.statueSB(rx, ry), [tx, ty] = World.siteCenter(ssx, ssy);
        const [mx, my] = toM(tx * TILE, ty * TILE);
        this.mapIcon(g, mx, my, lit ? '✦' : '?', lit ? '#ffe6a0' : '#8a90a0', 20);
        if (lit && v.st[k].x) this.mapHits.push({ x: mx, y: my, tp: G.tpList().find(t => t.kind === 'statue' && Math.abs(t.x - v.st[k].x) < 5) });
      }
      if (lit) for (const [i, [wsx, wsy]] of World.waypointSBs(rx, ry).entries()) {
        const wk = k + ':' + i, on = v.wp[wk], [tx, ty] = World.siteCenter(wsx, wsy), [mx, my] = toM(tx * TILE, ty * TILE);
        this.mapIcon(g, mx, my, on ? '◆' : '◇', on ? '#7dd8ff' : '#6a7080', 18);
        if (on) this.mapHits.push({ x: mx, y: my, tp: G.tpList().find(t => t.kind === 'wp' && Math.abs(t.x - on.x) < 5 && Math.abs(t.y - on.y) < 5) });
      }
    }
    if (v.basePos) { const [mx, my] = toM(v.basePos.x, v.basePos.y); this.mapIcon(g, mx, my, '⌂', '#6dff7a', 24); this.mapHits.push({ x: mx, y: my, tp: G.tpList().find(t => t.kind === 'base') }); }
    for (const t of Story.targets()) { const [x, y] = toM(t.x, t.y); g.strokeStyle = '#ffcf3a'; g.lineWidth = 3; g.beginPath(); g.arc(clamp(x, 10, c.width - 10), clamp(y, 10, c.height - 10), 9, 0, TAU); g.stroke(); }
    const [px, py] = toM(P.x, P.y);
    g.save(); g.translate(px, py); g.scale(K, K); g.rotate(G.player.car ? G.player.car.angle : G.player.angle);
    g.fillStyle = '#4dd2ff'; g.strokeStyle = '#000'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(11, 0); g.lineTo(-7, -8); g.lineTo(-3, 0); g.lineTo(-7, 8); g.closePath(); g.fill(); g.stroke(); g.restore();
    for (const r of G.remotes || []) { const [x, y] = toM(r.x, r.y); g.fillStyle = '#4dffe0'; g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill(); }
    if (this.mapSel) { g.strokeStyle = '#fff'; g.lineWidth = 2 * K; g.beginPath(); g.arc(this.mapSel.mx, this.mapSel.my, 16 * K, 0, TAU); g.stroke(); }
    const [crx, cry] = World.regionOf(Math.floor(P.x / SBPX), Math.floor(P.y / SBPX)), ci = World.regionInfo(crx, cry);
    $('mapInfo').textContent = `${ci.name} • vùng cấp ~${ci.lvl} • khám phá ${G.regionPct(crx, cry)}% • ${ST_NAME[rk(RL.id)]}: ${v.st[ci.key] ? 'đã thức tỉnh' : 'chưa thức tỉnh'} • kéo để xem, chạm ◆ / ✦ / ⌂ để dịch chuyển`;
    $('mapTp').hidden = !this.mapSel;
    if (this.mapSel) $('mapTp').textContent = '✈ DỊCH CHUYỂN: ' + this.mapSel.tp.name;
  },
  mapIcon(g, x, y, ch, col, size) {
    if (x < -20 || y < -20 || x > g.canvas.width + 20 || y > g.canvas.height + 20) return;
    size *= this.mapK || 1;
    g.font = `bold ${size}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#000'; g.fillText(ch, x + 1.5, y + 1.5); g.fillStyle = col; g.fillText(ch, x, y);
    g.textBaseline = 'alphabetic';
  },
  drawDungeonMap(c, g) {
    const P = G.player, N = 12, S = c.width / (N * SB);
    const psx = Math.floor(P.x / SBPX), psy = Math.floor(P.y / SBPX);
    g.fillStyle = '#050608'; g.fillRect(0, 0, c.width, c.height);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const k = 'dungeon' + nkey(psx - 6 + x, psy - 6 + y); if (!World.explored.has(k)) continue; const m = World.getMini(k); if (m) g.drawImage(m, x * SB * S, y * SB * S, SB * S + 0.5, SB * S + 0.5); }
    const [px, py] = [((P.x / TILE) - (psx - 6) * SB) * S, ((P.y / TILE) - (psy - 6) * SB) * S];
    g.fillStyle = '#4dd2ff'; g.beginPath(); g.arc(px, py, 6, 0, TAU); g.fill();
    $('mapInfo').textContent = `${RL.dungeon.name} — Cổng hạng ${World.dg.rank}, tầng ${World.dg.floor}/${World.dg.floors}`;
    $('mapTp').hidden = true;
  },

  // ---------- base screen ----------
  baseTab: 'build',
  openBase(tab) {
    if (!['playing', 'paused', 'menu'].includes(G.state) || G.player.dead) return;
    G.state = 'menu'; this.baseTab = tab || this.baseTab;
    this.buildBase(); this.showScreen('base');
  },
  buildBase() {
    const P = G.player, v = G.v5, here = G.atBase();
    document.querySelectorAll('#base [data-btab]').forEach(t => t.classList.toggle('on', t.dataset.btab === this.baseTab));
    const lv = BASE_ORDER.reduce((s, b) => s + v.base[b], 0);
    $('bLvl').textContent = `cấp ${lv}/30 • ${v.residents} cư dân`;
    $('bRes').innerHTML = `<span><img src="${IMG[cur().icon].src}">${P.gold}</span><span><img src="${IMG[itm('scrap').icon].src}">${P.inv.scrap || 0}</span><span><img src="${IMG[itm('planks').icon].src}">${P.inv.planks || 0}</span><span><img src="${IMG['orb_' + rk(RL.id)].src}">${P.inv.orb || 0}</span>`;
    $('bAway').hidden = here;
    let h = '';
    const coin = (n, ok) => `<b class="${ok ? '' : 'bad'}">${n}</b>`;
    if (this.baseTab === 'build') {
      h += '<div class="bcards">';
      for (const id of BASE_ORDER) {
        const L = v.base[id], D = BASE_DEF[id], c = L < 5 ? G.upCost(id, L) : null;
        h += `<div class="bcard ${L ? '' : 'none'}"><img src="${IMG[D.img].src}" alt=""><div class="binfo"><b>${D.name} <small>${L ? 'cấp ' + L + '/5' : 'chưa xây'}</small></b><p>${esc(D.desc(L))}</p>${L < 5 ? `<p class="next">▸ Cấp ${L + 1}: ${esc(D.desc(L + 1))}</p><p class="cost">${coin(c.gold, P.gold >= c.gold)} ${esc(cur().name)} • ${coin(c.scrap, (P.inv.scrap || 0) >= c.scrap)} ${esc(itm('scrap').name)} • ${coin(c.planks, (P.inv.planks || 0) >= c.planks)} ${esc(itm('planks').name)}</p>` : '<p class="next">✔ Đã tối đa</p>'}</div>${L < 5 ? `<button data-up="${id}" ${here && G.canPay(c) ? '' : 'class="dim"'}>${L ? 'NÂNG CẤP' : 'XÂY'}</button>` : ''}${id === 'garden' && L ? `<button data-harvest ${G.gardenReady() && here ? '' : 'class="dim"'}>THU (${G.gardenReady()})</button>` : ''}${id === 'bed' && L ? `<button data-sleep ${here ? '' : 'class="dim"'}>NGỦ</button>` : ''}</div>`;
      }
      h += '</div><p class="muted">Cứu dân thường để họ về sống ở Căn cứ. Nguyên liệu: tiền, ' + esc(itm('scrap').name) + ' (phân giải đồ thừa), ' + esc(itm('planks').name) + ' (lục soát thùng, nhà).</p>';
    } else if (this.baseTab === 'forge') {
      const L = v.base.forge;
      if (!L) h += '<p class="muted">Xây Lò Rèn (tab Công trình) để cường hoá trang bị.</p>';
      else {
        h += `<p class="muted">Cường hoá tối đa +${Math.min(10, L * 2)}. Mỗi cấp +8% sát thương (vũ khí), +10% giáp, +6% hiệu lực thánh vật. Từ +5 có tỉ lệ thất bại (chỉ mất nguyên liệu).</p><div class="srows">`;
        const items = [...SLOT_ORDER.map(s => P.equip[s]), ...ARMOR_SLOTS.map(s => P.armor[s]), ...P.relics, ...P.stash].filter(Boolean);
        for (const it of items) {
          const c = G.enhCost(it), r = RARITY[it.rarity], maxed = (it.plus || 0) >= Math.min(10, L * 2);
          const worn = P.stash.indexOf(it) < 0;
          h += `<div class="srow" style="--rc:${r.color}"><img src="${IMG[Loot.iconOf(it)].src}" alt=""><div class="sinfo"><b style="color:${r.color}">${esc(it.name)}</b><small>${worn ? 'ĐANG DÙNG • ' : ''}${r.name} • ${maxed ? 'đã tối đa ở cấp lò này' : `+${(it.plus || 0) + 1}: ${c.gold} ${esc(cur().name)}, ${c.scrap} ${esc(itm('scrap').name)} • ${Math.round(G.enhChance(it) * 100)}%`}</small></div><button data-enh="${it.uid}" ${maxed || !here ? 'class="dim"' : ''}>⚒</button></div>`;
        }
        h += '</div>';
      }
    } else if (this.baseTab === 'kitchen') {
      const L = v.base.kitchen, k = 1 + L * 0.2;
      if (!L) h += '<p class="muted">Xây Bếp (tab Công trình) để nấu món ăn tăng sức mạnh.</p>';
      else {
        h += `<p class="muted">Mỗi món cần 2 ${esc(itm('food').name)}, 1 ${esc(itm('water').name)} và ${25 + P.level * 4} ${esc(cur().name)}. Có thể ăn cả ba món cùng lúc.</p><div class="srows">`;
        for (const m of MEALS) { const left = v.buffs[m.id] && v.buffs[m.id].until > G.time ? Math.ceil((v.buffs[m.id].until - G.time) / 60) : 0; h += `<div class="srow" style="--rc:${m.col}"><div class="sinfo"><b style="color:${m.col}">🍲 ${m.name}</b><small>${m.desc(k)} • ${4 + L} phút${left ? ` • còn ${left} phút` : ''}</small></div><button data-cook="${m.id}" ${here ? '' : 'class="dim"'}>NẤU</button></div>`; }
        h += '</div>';
      }
    } else {
      h += `<p class="muted">Nhiệm vụ đổi mới mỗi sáng. Hoàn thành ở bất cứ đâu, nhận thưởng tại Căn cứ.</p><div class="srows">`;
      for (const [i, b] of v.bounties.entries()) {
        const T0 = BOUNTY_TYPES.find(x => x.t === b.t);
        h += `<div class="srow ${b.claimed ? 'claimed' : ''}"><div class="sinfo"><b>📜 ${esc(T0.label(b.n))}</b><small>${b.c}/${b.n} • thưởng ${b.gold} ${esc(cur().name)}, ${b.tk} vé, 3 ${esc(itm('scrap').name)}</small><i class="bprog"><u style="width:${b.c / b.n * 100}%"></u></i></div>${b.claimed ? '<span class="muted">✔</span>' : `<button data-claim="${i}" ${b.done && here ? '' : 'class="dim"'}>NHẬN</button>`}</div>`;
      }
      h += '</div>';
    }
    const box = $('baseBody'); box.innerHTML = h;
    box.querySelectorAll('button').forEach(b => this.bindBtn(b));
    box.querySelectorAll('[data-up]').forEach(b => b.onclick = () => { G.upgrade(b.dataset.up); this.buildBase(); });
    box.querySelectorAll('[data-harvest]').forEach(b => b.onclick = () => { G.harvest(); this.buildBase(); });
    box.querySelectorAll('[data-sleep]').forEach(b => b.onclick = () => { this.closePanel(); G.sleep(); });
    box.querySelectorAll('[data-enh]').forEach(b => b.onclick = () => { const all = [...Object.values(P.equip), ...Object.values(P.armor), ...P.relics, ...P.stash].filter(Boolean); const it = all.find(x => x.uid === +b.dataset.enh); if (it) { G.enhance(it); this.buildBase(); UI.dirty = true; } });
    box.querySelectorAll('[data-cook]').forEach(b => b.onclick = () => { G.cook(MEALS.find(m => m.id === b.dataset.cook)); this.buildBase(); });
    box.querySelectorAll('[data-claim]').forEach(b => b.onclick = () => { G.claimBounty(v.bounties[+b.dataset.claim]); this.buildBase(); });
  },
});

// ---------- one-time wiring ----------
(function () {
  const c = $('bigmap');
  let drag = null;
  const pos = e => { const r = c.getBoundingClientRect(); const p = e.touches ? e.touches[0] || e.changedTouches[0] : e; return [(p.clientX - r.left) * c.width / r.width, (p.clientY - r.top) * c.height / r.height]; };
  const down = e => { const [x, y] = pos(e); drag = { x, y, mx: UI.mapC ? UI.mapC.x : 0, my: UI.mapC ? UI.mapC.y : 0, moved: false }; e.preventDefault(); };
  const move = e => { if (!drag || !UI.mapC) return; const [x, y] = pos(e); const S = c.width / (UI.mapZoom * SB); if (Math.hypot(x - drag.x, y - drag.y) > 6) drag.moved = true; UI.mapC.x = drag.mx - (x - drag.x) / S; UI.mapC.y = drag.my - (y - drag.y) / S; UI.drawBigMap(); e.preventDefault(); };
  const up = e => {
    if (!drag) return;
    if (!drag.moved) { const [x, y] = pos(e); let best = null, bd = 40 * (UI.mapK || 1); for (const h of UI.mapHits) { if (!h.tp) continue; const d = Math.hypot(h.x - x, h.y - y); if (d < bd) { bd = d; best = h; } } UI.mapSel = best ? { tp: best.tp, mx: best.x, my: best.y } : null; UI.drawBigMap(); }
    drag = null;
  };
  c.addEventListener('mousedown', down); window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  c.addEventListener('touchstart', down, { passive: false }); c.addEventListener('touchmove', move, { passive: false }); c.addEventListener('touchend', up, { passive: false });
  $('mapTp').onclick = () => { if (UI.mapSel) { const t = UI.mapSel.tp; UI.mapSel = null; G.teleport(t); } };
  $('mapZin').onclick = () => { UI.mapZoom = Math.max(12, UI.mapZoom - 6); UI.drawBigMap(); };
  $('mapZout').onclick = () => { UI.mapZoom = Math.min(48, UI.mapZoom + 12); UI.drawBigMap(); };
  $('mapMe').onclick = () => { UI.mapC = null; UI.mapSel = null; UI.drawBigMap(); };
  // keep the map live while it is open (reveal work + icons)
  setInterval(() => { if (UI.screen === 'map' && G.v5gen && G.v5gen.length) { for (let i = 0; i < 6 && G.v5gen.length; i++) { const [x, y] = G.v5gen.shift(); World.genMini(x, y); } UI.drawBigMap(); } }, 60);
  const op = UI.openPanel;
  UI.openPanel = function (id) { if (id === 'map') { this.mapC = null; this.mapSel = null; } if (id === 'base') { this.openBase(); return; } return op.call(this, id); };
  document.querySelectorAll('#base [data-btab]').forEach(t => t.onclick = () => { UI.baseTab = t.dataset.btab; UI.buildBase(); });
  $('bHome').onclick = () => { const t = G.tpList().find(x => x.kind === 'base'); if (t) G.teleport(t); };
  window.addEventListener('keydown', e => { if (e.code === 'KeyN' && G.state === 'playing') UI.openBase(); });
  // ☰ more-menu on phones
  const more = $('tmore');
  document.querySelectorAll('#tmore [data-a], #tmore [data-k]').forEach(b => b.addEventListener('touchend', () => setTimeout(() => { more.hidden = true; }, 60)));
})();
