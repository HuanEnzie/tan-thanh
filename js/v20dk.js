// ===== v20 dk: twelve Demon Generals (one seal and one relic each), the key, and the Demon King who ignores blows until the set is complete =====
const DEMONS = [
  { n: 'Mộ Phệ', t: 'Tướng Quỷ Tham Lam', relic: 'Ấn Tham Lam', fx: { xp: 0.25 }, text: '+25% kinh nghiệm nhận được', col: '#ffd24a', lore: 'Nuốt cả một thành phố để no, vẫn thấy đói.' },
  { n: 'Xích Viêm', t: 'Tướng Quỷ Cuồng Nộ', relic: 'Ấn Cuồng Nộ', fx: { dmg: 0.10 }, text: '+10% sát thương', col: '#ff5a2a', lore: 'Mỗi nhát chém của hắn là một lời nguyền.' },
  { n: 'Hư Vô', t: 'Tướng Quỷ Hư Vô', relic: 'Ấn Hư Vô', fx: { magic: 0.18 }, text: '+18% sát thương kỹ năng', col: '#9a7bff', lore: 'Đứng giữa khoảng trống, đọc thầm tên kẻ sắp chết.' },
  { n: 'Huyết Mẫu', t: 'Tướng Quỷ Huyết Mạch', relic: 'Ấn Huyết Mạch', fx: { hp: 0.20 }, text: '+20% máu tối đa', col: '#ff3b5a', lore: 'Bể máu dưới chân bà ta không bao giờ cạn.' },
  { n: 'Tật Phong', t: 'Tướng Quỷ Tật Phong', relic: 'Ấn Tật Phong', fx: { spd: 0.10 }, text: '+10% tốc độ chạy', col: '#7dffd8', lore: 'Hắn đến trước cả tiếng gió.' },
  { n: 'Bất Diệt', t: 'Tướng Quỷ Bất Diệt', relic: 'Ấn Bất Diệt', fx: { dr: 0.10 }, text: '−10% sát thương nhận', col: '#b0b8c8', lore: 'Giáp của hắn là xương của những kẻ từng thách thức.' },
  { n: 'Nguyệt Linh', t: 'Tướng Quỷ Nguyệt Linh', relic: 'Ấn Nguyệt Linh', fx: { mana: 0.30 }, text: '+30% mana tối đa', col: '#6bb6ff', lore: 'Mặt trăng vỡ làm đôi, bà ta giữ nửa còn lại.' },
  { n: 'Thực Hồn', t: 'Tướng Quỷ Nuốt Hồn', relic: 'Ấn Nuốt Hồn', fx: { ls: 0.025 }, text: 'hút 2,5% sát thương gây ra thành máu', col: '#c75bff', lore: 'Mỗi nhát đâm trả lại hắn một hơi thở.' },
  { n: 'U Minh', t: 'Tướng Quỷ Bóng Tối', relic: 'Ấn Bóng Tối', fx: { ext: 0.08, sh: 0.15 }, text: '+8% thu phục bóng, bóng +15% sát thương', col: '#7a6bff', lore: 'Cái bóng của hắn không bao giờ chịu nằm yên.' },
  { n: 'Cốt Mẫu', t: 'Tướng Quỷ Sinh Tử', relic: 'Ấn Hồi Sinh', fx: { regen: 0.005 }, text: 'hồi 0,5% máu mỗi giây', col: '#6dff7a', lore: 'Bà ta chôn người sống và đào người chết dậy.' },
  { n: 'Phá Quân', t: 'Tướng Quỷ Phá Giáp', relic: 'Ấn Phá Giáp', fx: { dmg: 0.06, pierce: 0.12 }, text: '+6% sát thương, xuyên một phần miễn nhiễm của Quỷ Vương', col: '#ffa31a', lore: 'Chưa có tấm khiên nào hắn không bẻ gãy.' },
  { n: 'Thiên Hạ', t: 'Tướng Quỷ Đệ Nhất', relic: 'Ấn Chúa Tể', fx: { dmg: 0.05, dr: 0.05, sh: 0.10 }, text: '+5% sát thương, −5% sát thương nhận, bóng +10% sát thương', col: '#ff3b3b', lore: 'Kẻ đứng cạnh ngai vàng, cũng là kẻ gác cổng.' },
];
let KING_NAME = 'QUỶ VƯƠNG BARAN'; // theo thế giới: v21realm.js đặt lại khi G.spawnKing
const DKP = {
  nDead() { let n = 0; for (const k in this.gen) if (this.gen[k]) n++; return n; },
  nRel() { let n = 0; for (const k in this.relics) if (this.relics[k]) n++; return n; },
};
const dkOf = () => { const v = G.v10; if (!v) return null; let d = v.dk; if (!d) d = v.dk = { gen: {}, relics: {}, key: 0, done: 0, found: {}, intro: 0, track: null, kingFound: 0 }; if (Object.getPrototypeOf(d) !== DKP) Object.setPrototypeOf(d, DKP); return d; };

// ---------- where the lairs are: fixed by the world seed, nearer ones are weaker ----------
const DK = {
  key: null, sites: [], king: null, poi: {},
  calc() {
    const key = World.seed + ':' + ((Story.pois || []).length);
    if (this.key === key) return;
    this.key = key; this.poi = {};
    const base = h3(0, 0, 2001) * TAU, used = new Set((Story.pois || []).map(p => p.sx + ',' + p.sy));
    used.add('0,0');
    const put = (sx, sy) => { while (used.has(sx + ',' + sy)) sx += 1; used.add(sx + ',' + sy); return [sx, sy]; };
    this.sites = [];
    for (let i = 0; i < 12; i++) {
      const ang = base + i / 12 * TAU + (h3(i, 1, 2002) - 0.5) * 0.35, d = 6 + (i % 4) * 3.4 + Math.floor(i / 4) * 1.5 + h3(i, 2, 2003) * 1.2;
      const [sx, sy] = put(Math.round(Math.cos(ang) * d), Math.round(Math.sin(ang) * d));
      this.sites.push({ i, sx, sy, d: Math.hypot(sx, sy) });
      this.poi[sx + ',' + sy] = { kind: 'general', i };
    }
    const ka = base + TAU / 24, [kx, ky] = put(Math.round(Math.cos(ka) * 24), Math.round(Math.sin(ka) * 24));
    this.king = { sx: kx, sy: ky };
    this.poi[kx + ',' + ky] = { kind: 'king' };
  },
  at(sx, sy) { this.calc(); return this.poi[sx + ',' + sy] || null; },
  xy(s) { const [tx, ty] = World.siteCenter(s.sx, s.sy); return { x: tx * TILE + 16, y: ty * TILE + 16 }; },
  level(i) { this.calc(); return Math.round(6 + this.sites[i].d * 1.9); },
};
(function () {
  const si = Story.init, sl = Story.load;
  Story.init = function (...a) { DK.key = null; return si.apply(this, a); };
  Story.load = function (...a) { DK.key = null; return sl.apply(this, a); };
  const pa = Story.poiAt;
  Story.poiAt = function (sx, sy) { const r = pa.call(this, sx, sy); if (r) return r; return World.mode === 'over' ? DK.at(sx, sy) : null; };
  const sk = World.siteBlocked;
  World.siteBlocked = function (sx, sy) { return sk.call(this, sx, sy) || !!DK.at(sx, sy); };
})();

Object.assign(G, {
  dkState: dkOf,
  dkSiteNear(x, y, r) { DK.calc(); for (const s of DK.sites.concat([DK.king])) { const p = DK.xy(s); if (dist(p.x, p.y, x, y) < r) return true; } return false; },
  dkFx() {
    if (this._dkfx) return this._dkfx;
    const dk = this.dkState(), f = { xp: 0, dmg: 0, magic: 0, hp: 0, spd: 0, dr: 0, mana: 0, ls: 0, ext: 0, sh: 0, regen: 0, pierce: 0 };
    if (dk) for (let i = 0; i < 12; i++) if (dk.relics[i]) for (const k in DEMONS[i].fx) f[k] += DEMONS[i].fx[k];
    return this._dkfx = f;
  },
  // while you stand in the King's hall with all twelve seals, they burn together
  kingBuff() { const dk = this.dkState(); return World.mode === 'dungeon' && World.dg && World.dg.king && dk && dk.nRel() >= 12 ? { dmg: 0.4, dr: 0.25, regen: 0.01 } : null; },
  dkTpList() {
    const dk = this.dkState(), out = []; if (!dk) return out;
    DK.calc();
    for (const s of DK.sites) {
      if (!dk.found[s.i]) continue;
      const D = DEMONS[s.i], p = DK.xy(s), [rx, ry] = World.regionOf(s.sx, s.sy);
      out.push({ x: p.x, y: p.y + 340, gx: p.x, gy: p.y, name: `${dk.gen[s.i] ? '✔ ' : ''}${D.t} ${D.n} • ${World.regionInfo(rx, ry).name}`, kind: 'lair', icon: '☠', col: dk.gen[s.i] ? '#6dff7a' : D.col, rank: dk.gen[s.i] ? '✔' : String(s.i + 1) });
    }
    if (dk.kingFound) { const p = DK.xy(DK.king); out.push({ x: p.x, y: p.y + 400, gx: p.x, gy: p.y, name: 'Cổng Quỷ Vương', kind: 'lair', icon: '♛', col: '#ff4a4a', rank: '♛' }); }
    return out;
  },
  // ---------- generals ----------
  spawnGeneral(s) {
    const dk = this.dkState(), i = s.i; if (!dk || dk.gen[i] || this.zombies.some(z => z.gen === i && !z.dead)) return;
    const D = DEMONS[i], defs = BOSSES[rk(RL.id)], def = Object.assign({}, defs[i % defs.length]);
    def.pat = def.pat.slice(); for (const k of i >= 4 ? ['nova'] : []) if (!def.pat.includes(k)) def.pat.push(k); if (i >= 8 && !def.pat.includes('meteor')) def.pat.push('meteor');
    const mod = i % 3 === 0 ? null : BOSS_MODS[(i * 2 + 1) % BOSS_MODS.length];
    const z = this.spawnEnemy('boss', s.x, s.y, { lvl: DK.level(i), name: `${D.t} ${D.n}`, hpMul: (1.1 + i * 0.08) * (mod && mod.hp || 1), guard: true, bossDef: { def, mod } });
    z.gen = i; z.sbk = s.sbk; z.bcol = D.col; this.boss = z;
    FX.pillar(s.x, s.y, D.col, 1, 60);
  },
  generalDown(z) {
    const dk = this.dkState(), i = z.gen, D = DEMONS[i];
    dk.gen[i] = { x: Math.round(z.x), y: Math.round(z.y) }; dk.found[i] = 1;
    const p = World.addProp('ev_altar', z.x, z.y + 14, { solid: false, layer: 0, kind: 'dkrelic', data: { i }, light: 200, lightCol: 'white' }); if (p) p.placed = true;
    const n = dk.nDead();
    UI.banner(`TƯỚNG QUỶ ${n}/12`, `${D.t} ${D.n} đã gục ngã`, D.col);
    this.toast(`☠ ${D.t} ${D.n} gục ngã (${n}/12). Đến bàn thờ nhận ${D.relic}. Cổng sẽ mở thưa hơn.`, 'quest');
    if (n >= 12) setTimeout(() => this.forgeKey(), 3000);
    this.save();
  },
  takeRelic(i) {
    const dk = this.dkState(), D = DEMONS[i], P = this.player;
    if (dk.relics[i]) return;
    dk.relics[i] = 1; this._dkfx = null;
    if (D.fx.hp) { const add = Math.round(P.maxHp * D.fx.hp); P.maxHp += add; P.hp += add; }
    for (const p of World.propsNear(P.x, P.y, 100)) if (p.kind === 'dkrelic' && p.data.i === i) World.removeProp(p);
    FX.pillar(P.x, P.y, D.col, 1, 50); FX.ring(P.x, P.y, 10, 140, D.col, 0.7, 8); Sound.play('sfx_achievement', 0.8, 0.9);
    UI.skillFlash(D.relic.toUpperCase(), D.col);
    this.toast(`🜲 ${D.relic}: ${D.text} (${dk.nRel()}/12 Ấn)`, 'quest');
    if (dk.nRel() >= 12) setTimeout(() => { UI.banner('MƯỜI HAI ẤN HỢP NHẤT', 'Quỷ Vương không còn miễn nhiễm trước bạn', '#ffd24a'); this.toast('Đủ 12 Ấn! Khi bước vào Điện Quỷ Vương, các Ấn cộng hưởng: +40% sát thương, −25% sát thương nhận.', 'quest'); }, 900);
    UI.dirty = true; this.save();
  },
  forgeKey() {
    const dk = this.dkState(); if (dk.key) return;
    dk.key = 1; dk.kingFound = 1;
    const lines = [
      { who: 'sys', text: 'Mười hai phong ấn cùng vỡ. Mười hai mảnh tàn dư bay lên không trung, xoay quanh bạn rồi dệt thành một vật lạnh buốt trong lòng bàn tay: Chìa Khóa Quỷ Vương.' },
      { who: 'sys', text: R21(SYS_TAG) + ' Cổng Quỷ Vương đã hiện trên bản đồ. Có thể dịch chuyển tới đó.' },
      { who: 'sys', text: `Nhưng hãy nhớ: nếu thiếu Ấn của bất kỳ Tướng Quỷ nào, Quỷ Vương sẽ miễn nhiễm mọi sát thương vật lý lẫn phép thuật. Bạn hiện giữ ${dk.nRel()}/12 Ấn.` },
    ];
    UI.dialog({ lines, title: 'CHÌA KHÓA QUỶ VƯƠNG', cinematic: true });
    this.save();
  },
  kingEnter(p, eg) {
    const dk = this.dkState();
    if (!dk.key) { this.toast(`⛔ Phong ấn Quỷ Vương còn nguyên. Hạ đủ 12 Tướng Quỷ để rèn Chìa Khóa (${dk.nDead()}/12).`, 'warn'); return; }
    const n = dk.nRel();
    UI.menuDialog({
      name: 'Cổng Quỷ Vương', portrait: null,
      text: n >= 12 ? 'Mười hai Ấn trong người bạn rung lên. Quỷ Vương không còn che chắn được nữa — bên trong, các Ấn sẽ cộng hưởng. Bạn đã sẵn sàng?'
        : `Bạn mới giữ ${n}/12 Ấn (còn ${12 - n} chưa nhặt trên bàn thờ của các Tướng Quỷ). Quỷ Vương sẽ MIỄN NHIỄM sát thương vật lý và phép thuật; chỉ một phần rất nhỏ lọt qua. Vẫn vào chứ?`,
      options: [{ text: 'Bước vào', act: () => eg.call(this, p) }, { text: 'Chuẩn bị thêm', act: () => {} }],
    });
  },
  spawnKing(s) {
    if (this.zombies.some(z => z.king && !z.dead)) return;
    const dk = this.dkState(), defs = BOSSES[rk(RL.id)], def = Object.assign({}, defs[defs.length - 1], { name: KING_NAME, scale: 1.55, pat: ['meteor', 'nova', 'charge', 'spiral', 'summon', 'volley', 'slam', 'teleport'] });
    const z = this.spawnEnemy('boss', s.x, s.y, { lvl: 62, name: KING_NAME + (dk.nRel() < 12 ? ' • MIỄN NHIỄM' : ''), hpMul: 3, guard: true, bossDef: { def, mod: null } });
    z.king = true; z.dungeon = true; z.sbk = s.sbk; this.boss = z; z.bcol = '#ff2a2a';
    UI.banner(KING_NAME, dk.nRel() < 12 ? `Thiếu ${12 - dk.nRel()} Ấn — mọi đòn đánh gần như vô hiệu` : 'Mười hai Ấn cộng hưởng', '#ff3b3b');
  },
  kingDown() {
    const dk = this.dkState(); dk.done = 1;
    const lines = [
      { who: 'sys', text: 'Quỷ Vương gục xuống. Mười hai ngọn lửa trên các bàn thờ cùng tắt, và những khe nứt trên bầu trời khép lại, từng cái một.' },
      { who: 'sys', text: R21(SYS_TAG) + ' Dao động ' + manaName().toLowerCase() + ' đã biến mất. Sẽ không còn ' + gateName() + ' nào mở nữa.' },
      { who: 'sys', text: 'Những Cổng còn lại chỉ là hầm ngục bỏ hoang. Thế giới đã được trả lại cho bạn.' },
    ];
    setTimeout(() => UI.dialog({ lines, title: 'QUỶ VƯƠNG GỤC NGÃ', cinematic: true, onDone: () => { UI.victory(false); $('winTitle').textContent = 'QUỶ VƯƠNG ĐÃ GỤC NGÃ'; $('winSub').textContent = 'Mười hai Tướng Quỷ và Quỷ Vương đã bị đánh bại. Cổng không còn mở nữa.'; } }), 4000);
    this.save();
  },
  // the Hunters' Association explains the plan after the first gate you close
  dkAfterGate(tries = 0) {
    const dk = this.dkState(); if (!dk || dk.intro) return;
    if ((this.state !== 'playing' || UI.dialogOpen) && tries < 40) { setTimeout(() => this.dkAfterGate(tries + 1), 2000); return; }
    dk.intro = 1;
    UI.dialog({ title: 'HỘI THỢ SĂN', lines: [
      { who: 'sys', text: 'Cổng đầu tiên đã đóng — nhưng sẽ còn Cổng khác mở ra. Chúng không tự sinh: có mười hai Tướng Quỷ canh giữ mười hai phong ấn, và Quỷ Vương đứng sau tất cả.' },
      { who: 'sys', text: 'Mỗi Tướng Quỷ bị hạ làm Cổng mở thưa đi; mỗi chúa tể vùng bị hạ cũng vậy. Hạ đủ cả mười hai, bạn sẽ rèn được Chìa Khóa mở Cổng Quỷ Vương.' },
      { who: 'sys', text: 'Mỗi Tướng Quỷ giữ một Ấn quyền năng. Hãy nhặt đủ cả mười hai: thiếu Ấn, Quỷ Vương miễn nhiễm mọi sát thương vật lý lẫn phép thuật. Xem tiến độ ở Túi đồ > Sổ tay.' },
    ] });
  },
});

// ---------- the lairs and the King's door in the world ----------
Object.assign(World, {
  genGeneral(bk, poi, sb) {
    const cx = Math.floor((bk.x0 + bk.x1) / 2), cy = Math.floor((bk.y0 + bk.y1) / 2), px = cx * TILE + 16, py = cy * TILE + 16, i = poi.i, dk = G.dkState(), dead = !!(dk && dk.gen[i]), D = DEMONS[i];
    sb.poi = poi;
    const R0 = 13;
    for (let y = cy - R0; y <= cy + R0; y++) for (let x = cx - R0; x <= cx + R0; x++) { const d = Math.hypot(x - cx, y - cy); if (d < R0 + 0.5) this.set(x, y, d < 5 ? T.CONC : d < 11 ? T.ASH : T.GRAVEL); }
    this.reserve(cx - R0 - 1, cy - R0 - 1, cx + R0 + 1, cy + R0 + 1);
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + 0.2; this.addProp(RL.props.fire || 'firebarrel', px + Math.cos(a) * 9.5 * TILE, py + Math.sin(a) * 9.5 * TILE, { r: 9, light: 130, lightCol: dead ? 'cyan' : 'red' }); }
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; this.addProp(SR.pick(RL.props.rocks), px + Math.cos(a) * 12.4 * TILE, py + Math.sin(a) * 12.4 * TILE, { r: 12 }); }
    this.addProp(dead ? 'fx_0' : 'fx_1', px, py + 130, { solid: false, layer: 0, kind: 'dkseal', light: 220, lightCol: dead ? 'cyan' : 'red', data: { i } }).placed = true;
    if (!dead) {
      sb.spawns.push({ kind: 'general', i, x: px, y: py - 20 });
      for (let k = 0; k < 12; k++) { const a = SR.range(0, TAU), d = SR.range(60, 340); sb.spawns.push({ kind: 'dkguard', i, arche: SR.pick(['walker', 'runner', 'armored', 'ranged', 'brute', 'brute']), x: px + Math.cos(a) * d, y: py + Math.sin(a) * d, elite: SR.chance(0.5) }); }
    } else if (!dk.relics[i]) this.addProp('ev_altar', px, py, { solid: false, layer: 0, kind: 'dkrelic', data: { i }, light: 200, lightCol: 'white' }).placed = true;
  },
  genKingSite(bk, poi, sb) {
    const cx = Math.floor((bk.x0 + bk.x1) / 2), cy = Math.floor((bk.y0 + bk.y1) / 2), px = cx * TILE + 16, py = cy * TILE + 16, dk = G.dkState();
    sb.poi = poi;
    const R0 = 15;
    for (let y = cy - R0; y <= cy + R0; y++) for (let x = cx - R0; x <= cx + R0; x++) { const d = Math.hypot(x - cx, y - cy); if (d < R0 + 0.5) this.set(x, y, d < 6 ? T.CONC : d < 13 ? T.ASH : T.GRAVEL); }
    this.reserve(cx - R0 - 1, cy - R0 - 1, cx + R0 + 1, cy + R0 + 1);
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, lit = dk && dk.gen[k]; this.addProp(RL.props.fire || 'firebarrel', px + Math.cos(a) * 11.5 * TILE, py + Math.sin(a) * 11.5 * TILE, { r: 9, light: lit ? 150 : 90, lightCol: lit ? 'cyan' : 'red' }); }
    if (!(dk && dk.done)) this.gateProp({ id: 'K', x: px, y: py, rank: 'S', seed: (h3(poi.kind.length, 3, 2010) * 1e9) | 0, king: true, floors: 1, level: 62 });
  },
});
(function () {
  const gp = World.genPOI;
  World.genPOI = function (bk, poi, sb) {
    if (poi.kind === 'general') return this.genGeneral(bk, poi, sb);
    if (poi.kind === 'king') return this.genKingSite(bk, poi, sb);
    return gp.call(this, bk, poi, sb);
  };
  const pp = G.processPending;
  G.processPending = function () {
    for (let k = World.pending.length - 1; k >= 0; k--) {
      const s = World.pending[k];
      if (s.kind === 'general') { World.pending.splice(k, 1); this.spawnGeneral(s); }
      else if (s.kind === 'dkguard') { World.pending.splice(k, 1); const z = this.spawnEnemy(s.arche, s.x, s.y, { elite: s.elite, guard: true, lvl: Math.max(2, DK.level(s.i) - 4) }); z.sbk = s.sbk; }
      else if (s.kind === 'boss' && s.dungeon && World.dg && World.dg.king) { World.pending.splice(k, 1); this.spawnKing(s); }
    }
    return pp.call(this);
  };
  const ke = G.killEnemy;
  G.killEnemy = function (z, src) {
    ke.call(this, z, src);
    if (z.gen != null) { const c = this.corpses[this.corpses.length - 1]; if (c && c.x === z.x && c.y === z.y && c.key) c.key += ':g' + z.gen; this.generalDown(z); }
  };
  // relics lie on the altar until you take them
  const fi = G.findInteract;
  G.findInteract = function () {
    const P = this.player;
    for (const p of World.propsNear(P.x, P.y, 70)) {
      if (p.kind !== 'dkrelic' || p.dead || (this._ixSkip && this._ixSkip.has(p)) || dist(p.x, p.y, P.x, P.y) > 64) continue;
      const D = DEMONS[p.data.i]; return { prop: p, kind: 'dkrelic', label: `Nhận ${D.relic} — ${D.text}` };
    }
    return fi.call(this);
  };
  const ia = G.interact;
  G.interact = function (it) { if (it && it.kind === 'dkrelic') return this.takeRelic(it.prop.data.i); return ia.call(this, it); };

  // ---------- what the relics do ----------
  const he = G.hitEnemy;
  G.hitEnemy = function (z, dmg, kx, ky, src, ang, wp) {
    const dk = this.v10 && this.v10.dk ? this.dkState() : null;
    if (dk && src !== 'ally') {
      const f = this.dkFx(), kb = this.kingBuff();
      dmg *= 1 + (src === 'skill' ? f.magic + f.dmg * 0.5 : f.dmg) + (kb ? kb.dmg : 0);
      if (f.ls > 0 && !z.dead) { const P = this.player; P.hp = Math.min(P.maxHp, P.hp + Math.min(dmg * f.ls, P.maxHp * 0.02)); }
    }
    if (z.king && src !== 'ally') {
      const n = this.dkState().nRel();
      if (n < 12) {
        dmg *= 0.01 + 0.05 * (n / 12) + this.dkFx().pierce;
        if (!z._imT || this.time - z._imT > 0.9) { z._imT = this.time; Floaters.add(z.x, z.y - z.r - 22, 'MIỄN NHIỄM', '#c8d0ff', 12, true); }
      }
    }
    return he.call(this, z, dmg, kx, ky, src, ang, wp);
  };
  const hp0 = G.hurtPlayer;
  G.hurtPlayer = function (dmg, src, silent) {
    if (this.v10 && this.v10.dk) { const kb = this.kingBuff(); dmg *= Math.max(0.3, 1 - this.dkFx().dr - (kb ? kb.dr : 0)); }
    return hp0.call(this, dmg, src, silent);
  };
  const sm = Player.prototype.speedMul;
  Player.prototype.speedMul = function () { return sm.call(this) * (1 + (G.v10 && G.v10.dk ? G.dkFx().spd : 0)); };
  const mm = G.maxMana;
  G.maxMana = function () { return Math.round(mm.call(this) * (1 + (this.v10 && this.v10.dk ? this.dkFx().mana : 0))); };
  const ax = G.addXp;
  G.addXp = function (n) { return ax.call(this, this.v10 && this.v10.dk ? n * (1 + this.dkFx().xp) : n); };
  const ec = G.extractChance;
  G.extractChance = function (c) { return Math.min(0.85, ec.call(this, c) + (this.v10 && this.v10.dk ? this.dkFx().ext : 0)); };
  const ss = G.shStats;
  G.shStats = function (s) { const r = ss.call(this, s); if (this.v10 && this.v10.dk) r.dmg = Math.round(r.dmg * (1 + this.dkFx().sh)); return r; };
  const ni = G.initV10;
  G.initV10 = function (d) { this._dkfx = null; return ni.call(this, d); };

  // ---------- per frame: discovery, regeneration ----------
  const tk = G.v5Tick;
  G.v5Tick = function (dt) {
    tk.call(this, dt);
    const dk = this.v10 && this.dkState(), P = this.player;
    if (!dk || this.state !== 'playing') return;
    const f = this.dkFx(), kb = this.kingBuff(), rg = f.regen + (kb ? kb.regen : 0);
    if (rg > 0 && !P.dead && P.hp < P.maxHp) P.hp = Math.min(P.maxHp, P.hp + P.maxHp * rg * dt);
    if (World.mode === 'over' && this.frame % 15 === 0 && !(typeof Net !== 'undefined' && Net.active)) {
      DK.calc();
      for (const s of DK.sites) if (!dk.found[s.i]) { const p = DK.xy(s); if (dist(P.x, P.y, p.x, p.y) < 700) { dk.found[s.i] = 1; this.toast(`☠ Phát hiện nơi ẩn náu của ${DEMONS[s.i].t} ${DEMONS[s.i].n} (Lv ${DK.level(s.i)}) — đã ghi lên bản đồ.`, 'quest'); Sound.play('sfx_gong', 0.5, 0.7); } }
      if (!dk.kingFound) { const p = DK.xy(DK.king); if (dist(P.x, P.y, p.x, p.y) < 900) { dk.kingFound = 1; this.toast('♛ Một cánh cổng đen khổng lồ — Cổng Quỷ Vương. Phong ấn vẫn còn nguyên.', 'quest'); } }
    }
  };

  // ---------- goal line and arrow ----------
  const sg = Story.goal;
  Story.goal = function () {
    const dk = G.v10 && G.dkState();
    if (dk && (this.finished || !this.curAct())) return dk.done ? 'Quỷ Vương đã gục — tự do khám phá' : dk.key ? 'Vào Cổng Quỷ Vương và đánh bại Quỷ Vương' : `Hạ 12 Tướng Quỷ (${dk.nDead()}/12) — xem Túi đồ > Sổ tay`;
    return sg.call(this);
  };
  const tg = Story.targets;
  Story.targets = function () {
    const out = tg.call(this), dk = G.v10 && G.dkState();
    if (dk && World.mode === 'over' && dk.track != null && !dk.gen[dk.track]) { DK.calc(); const s = DK.sites[dk.track]; if (s) { const p = DK.xy(s); out.push({ x: p.x, y: p.y, label: DEMONS[s.i].n }); } }
    return out;
  };

  // ---------- drawing: relic altar label ----------
  const dp = drawProp;
  drawProp = function (p) {
    dp(p);
    if (p.kind === 'dkrelic' && !p.dead) {
      const D = DEMONS[p.data.i], y = p.y - 34 + Math.sin(G.time * 3) * 3;
      ctx.globalAlpha = 0.35 + 0.2 * Math.sin(G.time * 4); ctx.drawImage(GLOW.white, p.x - 40, p.y - 52, 80, 70); ctx.globalAlpha = 1;
      ctx.font = '11px VT323, monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText('▼ ' + D.relic, p.x + 1, y + 1); ctx.fillStyle = D.col; ctx.fillText('▼ ' + D.relic, p.x, y);
    }
  };
})();

// ---------- the journal page ----------
Object.assign(G, {
  dkHtml() {
    const dk = this.dkState(), P = this.player; DK.calc();
    const kb = h => `<span class="dkb ${h[0]}">${h[1]}</span>`;
    let h = `<div class="dkp"><h3 class="sec">☠ Phong ấn Quỷ Vương</h3>`;
    h += `<p class="dkintro">Cổng không tự sinh ra: mười hai Tướng Quỷ giữ mười hai phong ấn, Quỷ Vương đứng sau tất cả. Mỗi Tướng Quỷ gục ngã làm Cổng thưa đi; hạ đủ 12 để rèn Chìa Khóa mở Cổng Quỷ Vương. Mỗi tướng giữ một Ấn — <b>thiếu Ấn, Quỷ Vương miễn nhiễm sát thương vật lý lẫn phép thuật.</b></p>`;
    const press = Math.round(this.gatePressure() * 100), lords = Object.keys((this.v6 && this.v6.lord) || {}).length;
    h += `<div class="dkbar"><div><b>${dk.nDead()}/12</b><small>Tướng Quỷ đã hạ</small></div><div><b>${dk.nRel()}/12</b><small>Ấn đã nhặt</small></div><div><b>${lords}</b><small>Chúa tể vùng đã hạ</small></div><div><b>${press}%</b><small>Tần suất Cổng</small></div></div>`;
    h += `<div class="dkking ${dk.key ? 'open' : ''}"><b>♛ Cổng Quỷ Vương</b> — ${dk.done ? 'Quỷ Vương đã gục ngã.' : dk.key ? (dk.nRel() >= 12 ? 'Đã có Chìa Khóa và đủ 12 Ấn: sẵn sàng.' : `Đã có Chìa Khóa nhưng mới ${dk.nRel()}/12 Ấn: Quỷ Vương sẽ miễn nhiễm.`) : 'Phong ấn còn nguyên (cần hạ đủ 12 Tướng Quỷ).'}</div>`;
    h += '<div class="dkl">';
    for (const s of DK.sites) {
      const D = DEMONS[s.i], dead = !!dk.gen[s.i], rel = !!dk.relics[s.i], found = !!dk.found[s.i], p = DK.xy(s);
      const dx = p.x - P.x, dy = p.y - P.y, where = found ? `${World.regionInfo(...World.regionOf(s.sx, s.sy)).name} • Lv ${DK.level(s.i)}` : `Hướng ${dirName(dx, dy)}, cách khoảng ${Math.round(Math.hypot(dx, dy) / TILE / 50) * 50}m`;
      h += `<div class="dkr ${dead ? 'dead' : ''}" style="--c:${D.col}"><span class="dki">${dead ? (rel ? '✔' : '✦') : '☠'}</span><div class="dkt"><b>${found || dead ? H(D.t + ' ' + D.n) : 'Tướng Quỷ #' + (s.i + 1) + ' • chưa rõ danh tính'}</b><small>${H(where)}</small><small class="dkrel">${rel ? `${H(D.relic)}: ${H(D.text)}` : dead ? `Ấn chưa nhặt — quay lại bàn thờ để nhận ${H(D.relic)}` : `Giữ ${H(D.relic)} (${H(D.text)})`}</small></div>${dead ? '' : `<button data-dkt="${s.i}" class="${dk.track === s.i ? 'on' : ''}">${dk.track === s.i ? '📍 Đang theo dõi' : '📍 Theo dõi'}</button>`}</div>`;
    }
    h += '</div></div>';
    return h;
  },
});
(function () {
  const bi = UI.buildInv;
  UI.buildInv = function () {
    const r = bi.call(this);
    if (this.invTab === 'codex' && G.v10) {
      const box = $('invBody');
      if (box) {
        box.insertAdjacentHTML('afterbegin', G.dkHtml());
        box.querySelectorAll('[data-dkt]').forEach(b => b.onclick = () => { const dk = G.dkState(), i = +b.dataset.dkt; dk.track = dk.track === i ? null : i; UI.buildInv(); });
      }
    }
    return r;
  };
  // the big map also shows lairs
  const dbm = UI.drawBigMap;
  UI.drawBigMap = function () {
    dbm.call(this);
    if (World.mode !== 'over' || !this.mapC || !G.v10 || !G.dkTpList) return;
    const c = $('bigmap'), g = c.getContext('2d'), K = this.mapK || 1;
    const N = this.mapZoom, S = c.width / (N * SB), NH = c.height / S / SB;
    const x0 = this.mapC.x - N * SB / 2, y0 = this.mapC.y - NH * SB / 2;
    for (const t of G.dkTpList()) {
      const mx = ((t.gx / TILE) - x0) * S, my = ((t.gy / TILE) - y0) * S;
      this.mapIcon(g, mx, my, t.icon, t.col, 20);
      this.mapHits.push({ x: mx, y: my, tp: t });
    }
  };
})();
