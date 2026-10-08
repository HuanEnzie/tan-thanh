// ===== v6: story chapters bound to regions (barriers), guarded chests, region lords, survivor shelters,
// breakthrough materials, outfits that follow the body armour, rideable pets, gacha skills, companions who stay home =====
const REGPX = REG * SBPX;
const BARRIER = {
  md: { name: 'Sương Độc', col: '120,240,80', hex: '#7cf04a', msg: 'Sương độc dày đặc — chưa thể đi qua' },
  tt: { name: 'Kết Giới Cổ', col: '125,255,216', hex: '#7dffd8', msg: 'Kết giới cổ xưa chặn lối' },
  sl: { name: 'Kết Giới Hệ Thống', col: '90,168,255', hex: '#5aa8ff', msg: '[HỆ THỐNG] Khu vực chưa được cấp quyền' },
};
const LORD_NAME = { md: 'Thủ Lĩnh Đột Biến', tt: 'Yêu Vương', sl: 'Chúa Tể Cổng' };
const SHELTER_NAME = { md: 'Trại Sống Sót', tt: 'Thôn', sl: 'Tiền Đồn Hội Thợ Săn' };
const ELDER_NAME = { md: 'Trưởng Trại', tt: 'Trưởng Thôn', sl: 'Đội Trưởng Tiền Đồn' };
const BT_NAMES = {
  md: ['Mẫu Virus', 'Huyết Thanh Đột Biến', 'Lõi Tiến Hoá'],
  tt: ['Linh Thảo', 'Yêu Đan', 'Phá Cảnh Đan'],
  sl: ['Mảnh Ma Thạch', 'Lõi Ma Thú', 'Đá Thức Tỉnh'],
};
const BT_DESC = [
  'Nguyên liệu đột phá. Rơi từ tinh anh, lính canh rương, rương Bạc trở lên.',
  'Nguyên liệu đột phá quý. Rơi từ mini-boss, Lãnh chúa vùng, boss, rương Vàng / Kim Cương.',
  'Chìa khoá đột phá đại cảnh giới. Nhận khi xong một chương truyện hoặc hạ Lãnh chúa vùng lần đầu.',
];
Object.assign(ITEMS, {
  bt_a: { name: 'Nguyên liệu đột phá', icon: 'bt_md_a', kind: 'mat', desc: BT_DESC[0] },
  bt_b: { name: 'Nguyên liệu quý', icon: 'bt_md_b', kind: 'mat', desc: BT_DESC[1] },
  bt_c: { name: 'Chìa khoá đột phá', icon: 'bt_md_c', kind: 'mat', desc: BT_DESC[2] },
});
const OUTFIT_NAMES = {
  md: ['Áo Phong Trần', 'Đồ Nhặt Rác', 'Giáp Chiến Thuật', 'Giáp Động Lực Huyền Thoại'],
  tt: ['Đạo Bào', 'Ngoại Môn Đạo Bào', 'Nội Môn Chiến Bào', 'Tiên Y Kim Quang'],
  sl: ['Áo Khoác Thợ Săn', 'Đồ Thợ Săn Tân Binh', 'Giáp Thợ Săn Tinh Anh', 'Giáp Quân Vương Bóng Tối'],
};
const SKILLS = [
  { id: 'meteor', star: 5, col: '#ff7a2a', names: { md: 'Mưa Tên Lửa', tt: 'Thiên Hỏa Lưu Tinh', sl: 'Mưa Thiên Thạch' }, desc: '9 quả cầu lửa dội xuống quanh điểm ngắm' },
  { id: 'frost', star: 4, col: '#8fe0ff', names: { md: 'Bom Băng', tt: 'Huyền Băng Trận', sl: 'Đóng Băng Tuyệt Đối' }, desc: 'Nổ băng quanh bạn, đóng băng kẻ địch 2.5 giây' },
  { id: 'chain', star: 4, col: '#fff36b', names: { md: 'Súng Điện Chuỗi', tt: 'Cửu Thiên Lôi Kiếp', sl: 'Lôi Ấn Chuỗi' }, desc: 'Sét nảy liên tiếp qua 10 kẻ địch' },
  { id: 'hole', star: 5, col: '#b46bff', names: { md: 'Lựu Đạn Trọng Lực', tt: 'Hắc Động Thôn Thiên', sl: 'Kiếp Hư Không' }, desc: 'Hố đen hút kẻ địch vào rồi phát nổ' },
  { id: 'heal', star: 4, col: '#6dff7a', names: { md: 'Kim Tiêm Hồi Phục', tt: 'Hồi Xuân Thuật', sl: 'Ban Phước' }, desc: 'Hồi 50% máu, tạo khiên lớn, hồi máu liên tục 6 giây' },
  { id: 'blades', star: 4, col: '#e0e6ff', names: { md: 'Lưỡi Cưa Xoay', tt: 'Luân Hồi Kiếm Trận', sl: 'Vũ Điệu Song Kiếm' }, desc: '6 lưỡi kiếm xoay quanh bạn trong 10 giây' },
  { id: 'dash', star: 5, col: '#9a7bff', names: { md: 'Lướt Sát Thủ', tt: 'Thuấn Ảnh Sát', sl: 'Bộ Pháp Bóng Ma' }, desc: 'Lướt chém xuyên qua 8 kẻ địch gần nhất, bất tử khi lướt' },
  { id: 'inferno', star: 4, col: '#ff5a2a', names: { md: 'Bom Xăng Hủy Diệt', tt: 'Tam Muội Chân Hỏa', sl: 'Hỏa Ngục' }, desc: 'Vòng lửa thiêu đốt mọi thứ quanh bạn 8 giây' },
];
const skName = s => s.names[rk(RL.id)] || s.names.tt;
const TWIST_TEXT = {
  statue: r => `Đánh thức ${ST_NAME[rk(RL.id)]} ở ${r}`,
  lord: r => `Hạ ${LORD_NAME[rk(RL.id)]} đang chiếm giữ ${r} (biểu tượng ☠ trên bản đồ)`,
  shelter: r => `Đến ${SHELTER_NAME[rk(RL.id)]} ở ${r}, gặp ${ELDER_NAME[rk(RL.id)]} và giúp họ đẩy lùi đợt tấn công`,
  camps: r => `Phá 2 rương bị phong ấn (có lính canh) ở ${r}`,
  orbs: r => `Thu thập 4 ${ORB_NAME[rk(RL.id)]} ở ${r}`,
};
const RUMORS = {
  md: ['Nghe nói {villain} đang gom lũ đột biến ở phương xa. Đừng đi một mình.', 'Rương nào có lính canh thì bên trong toàn đồ tốt — nhưng phải hạ hết bọn canh đã.', 'Sửa được Đài Phát Sóng trên đồi là thấy cả vùng trên bản đồ.', 'Mẫu virus từ lũ tinh anh… bác sĩ bảo dùng nó để cơ thể tiến hoá.', 'Bên kia màn sương độc là gì? Không ai đi rồi trở về cả.', 'Có người thấy {companion} gần đây đấy.'],
  tt: ['Gần đây yêu khí nồng nặc, e là {villain} sắp xuất thế.', 'Muốn phá cảnh thì phải có Yêu Đan và Linh Thảo, kinh nghiệm thôi là chưa đủ.', 'Tượng Thần trong vùng mà thức tỉnh thì linh mạch hiện rõ cả vùng.', 'Kết giới cổ kia do tiền nhân lập ra, chỉ người có duyên mới phá được.', 'Yêu Vương chiếm núi, dân làng không dám lên hái thuốc nữa.', 'Nghe đồn {artifact} ẩn trong vùng này.'],
  sl: ['Hội nói {villain} đứng sau những Cổng Đỏ gần đây.', 'Lõi ma thú từ bọn trùm là thứ giúp thợ săn thức tỉnh lên hạng mới.', 'Cột Hệ Thống mà kích hoạt thì cả khu vực hiện trên bản đồ.', 'Kết giới Hệ Thống chỉ mở khi cậu hoàn thành nhiệm vụ.', 'Chúa Tể Cổng ngoài kia đã nuốt cả một đội hạng B.', 'Cẩn thận rương có lính canh — chúng không bỏ vị trí đâu.'],
};
(function () {
  const _itm = itm;
  itm = function (id) {
    const d = _itm(id);
    if (d && /^bt_[abc]$/.test(id)) { const k = rk(RL.id), j = 'abc'.indexOf(id[3]); d.name = BT_NAMES[k][j]; d.icon = `bt_${k}_${id[3]}`; d.desc = BT_DESC[j]; }
    return d;
  };
  // new sprites ship as a few atlases; loading one slices it into IMG entries under the usual names
  const _ri = realmImages;
  realmImages = function (r) { const out = _ri(r); out.push('atlas6_common', 'atlas6_' + rk(r)); return out; };
  const _li = loadImages;
  loadImages = function (list, onProgress) {
    const atl = [...new Set(list)].filter(n => ATLAS6[n] && !IMG[n]);
    const rest = list.filter(n => !ATLAS6[n]);
    const cut = atl.map(n => new Promise(res => {
      const im = new Image();
      im.onload = () => {
        for (const [k, [x, y, w, h]] of Object.entries(ATLAS6[n])) {
          const c = document.createElement('canvas'); c.width = w; c.height = h;
          c.getContext('2d').drawImage(im, x, y, w, h, 0, 0, w, h);
          try { c.src = c.toDataURL(); } catch (e) { c.src = ''; }
          IMG[k] = c;
        }
        IMG[n] = im; res();
      };
      im.onerror = () => { console.warn('missing atlas', n); res(); };
      im.src = 'assets/img/' + n + '.png';
    }));
    return Promise.all([_li(rest, onProgress)].concat(cut));
  };
})();

// ---------- region sites: the lord's camp and the survivors' shelter ----------
Object.assign(World, {
  v6Sites(rx, ry) {
    const k = this.rkey(rx, ry);
    this._v6s = this._v6s || new Map();
    let s = this._v6s.get(k);
    if (s) return s;
    const st = this.statueSB(rx, ry), wps = this.waypointSBs(rx, ry);
    const taken = (sx, sy) => this.siteBlocked(sx, sy) || (sx === st[0] && sy === st[1]) || wps.some(w => w[0] === sx && w[1] === sy) || Math.abs(sx) + Math.abs(sy) < 3;
    const find = (seed, avoid) => {
      for (let i = 0; i < 40; i++) {
        const sx = rx * REG + 1 + Math.floor(h3(rx, ry, seed + i) * (REG - 2)), sy = ry * REG + 1 + Math.floor(h3(rx, ry, seed + 100 + i) * (REG - 2));
        if (taken(sx, sy) || (avoid && Math.abs(avoid[0] - sx) + Math.abs(avoid[1] - sy) < 2)) continue;
        return [sx, sy];
      }
      return null;
    };
    const lord = find(1300);
    const shelter = rx === 0 && ry === 0 ? null : find(1500, lord);
    s = { lord, shelter };
    this._v6s.set(k, s);
    return s;
  },
  siteXY(sb) { if (!sb) return null; const [tx, ty] = this.siteCenter(sb[0], sb[1]); return { x: tx * TILE + 16, y: ty * TILE + 16 }; },
  guards6(x, y, n, o) {
    for (let i = 0; i < n; i++) {
      const a = SR.range(0, TAU), d = SR.range(40, o.r || 150);
      this._gen.spawns.push({ kind: 'enemy', arche: SR.pick(o.types || ['walker', 'runner', 'armored', 'ranged', 'brute', 'walker']), x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, elite: SR.chance(o.elite || 0.12), guard: true, gid: o.gid });
    }
  },
  genLord(bk, sb, s) {
    const cx = Math.floor((bk.x0 + bk.x1) / 2), cy = Math.floor((bk.y0 + bk.y1) / 2), key = this.rkey(s.rx, s.ry);
    const px = cx * TILE + 16, py = cy * TILE + 16, dead = G.v6 && G.v6.lord[key];
    for (let y = cy - 7; y <= cy + 7; y++) for (let x = cx - 7; x <= cx + 7; x++) if (Math.hypot(x - cx, y - cy) < 7.5 && this.get(x, y) !== T.WATER && this.get(x, y) !== T.LAVA) this.set(x, y, T.DIRT);
    this.reserve(cx - 8, cy - 8, cx + 8, cy + 8);
    sb.poi = { kind: 'lord' };
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; this.addProp(SR.pick(RL.props.rocks), px + Math.cos(a) * 205, py + Math.sin(a) * 205, { r: 12 }); }
    for (const [dx, dy] of [[-4, -3], [4, -3], [-4, 4], [4, 4]]) this.addProp(RL.props.fire || 'firebarrel', (cx + dx) * TILE + 16, (cy + dy) * TILE + 16, { r: 9, light: 120, lightCol: 'red' });
    this._noGuard = true;
    const ch = this.chest(cx, cy + 4, h3(s.rx, s.ry, 77) < 0.35 ? 3 : 2);
    this._noGuard = false;
    ch.data.mimic = false; ch.data.lordChest = key;
    if (!dead) {
      ch.data.sealed = true; ch.data.gid = 'L' + key;
      sb.spawns.push({ kind: 'boss', x: px, y: py - 20, mini: true, lord: key, gid: 'L' + key, noChest: true, seed: (h3(s.rx, s.ry, 91) * 1e9) | 0 });
      this.guards6(px, py, 6, { r: 200, elite: 0.35, gid: 'L' + key });
    }
  },
  genShelter(bk, sb, s) {
    const cx = Math.floor((bk.x0 + bk.x1) / 2), cy = Math.floor((bk.y0 + bk.y1) / 2), k = rk(RL.id), key = this.rkey(s.rx, s.ry);
    const R0 = 9, floor = k === 'tt' ? T.GRAVEL : T.CONC;
    for (let y = cy - R0; y <= cy + R0; y++) for (let x = cx - R0; x <= cx + R0; x++) this.set(x, y, Math.abs(x - cx) === R0 || Math.abs(y - cy) === R0 ? T.DIRT : floor);
    this.reserve(cx - R0 - 1, cy - R0 - 1, cx + R0 + 1, cy + R0 + 1);
    sb.poi = { kind: 'shelter' };
    const T2 = (x, y) => [x * TILE + 16, y * TILE + 16];
    // palisade with four openings
    const wall = (RL.props.barrier && RL.props.barrier[0]) || RL.props.fence || 'sandbags';
    for (let i = -R0; i <= R0; i += 2) {
      if (Math.abs(i) <= 2) continue;
      for (const [x, y] of [[cx + i, cy - R0], [cx + i, cy + R0], [cx - R0, cy + i], [cx + R0, cy + i]]) this.addProp(wall, ...T2(x, y), { r: 12, shrink: 0.8 });
    }
    for (const [dx, dy] of [[-R0 + 1, -R0 + 1], [R0 - 1, -R0 + 1], [-R0 + 1, R0 - 1], [R0 - 1, R0 - 1]]) this.addProp('sh_tower_' + k, ...T2(cx + dx, cy + dy), { r: 16, kind: 'shtower', light: 120, lightCol: 'fire' });
    this.addProp('sh_gate_' + k, ...T2(cx, cy + R0), { solid: false, layer: 3 });
    this.addProp('sh_hall_' + k, ...T2(cx, cy - 4), { r: 34, kind: 'shhall', data: { key } });
    this.addProp('fx_4', ...T2(cx, cy + 3), { solid: false, light: 170, kind: 'campfire', lightCol: 'fire' });
    if (RL.props.tent) { this.addProp(RL.props.tent, ...T2(cx - 6, cy + 3), { shrink: 0.55 }); this.addProp(RL.props.tent, ...T2(cx + 6, cy + 3), { shrink: 0.55 }); }
    this.container(SR.pick(RL.props.crate), cx - 6, cy - 6, 'camp'); this.container(SR.pick(RL.props.crate), cx + 6, cy - 6, 'camp');
    this.merchant(cx + 4, cy);
    const sid = key + ':';
    sb.spawns.push({ kind: 'elder', x: (cx - 2) * TILE + 16, y: (cy + 1) * TILE + 16, sid: sid + 'e', key, sprite: 1 });
    for (let i = 0; i < 4; i++) sb.spawns.push({ kind: 'villager', x: (cx + SR.int(-6, 6)) * TILE + 16, y: (cy + SR.int(-1, 6)) * TILE + 16, sid: sid + i, sprite: i % 4 });
  },
});

// ---------- story chapters ----------
function v6Chapters(seed) {
  const rnd = mulberry32(seed ^ 0x6a09e667);
  const zone = [[0, 0], [-1, 0], [0, -1], [-1, -1]];
  const used = new Set(zone.map(z => z + ''));
  const nb = r => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [r[0] + a, r[1] + b]);
  const c0 = [];
  for (const z of zone) for (const n of nb(z)) if (!used.has(n + '') && !c0.some(c => c + '' === n + '')) c0.push(n);
  const chain = [c0[Math.floor(rnd() * c0.length)]]; used.add(chain[0] + '');
  const far = n => Math.hypot(n[0] + 0.5, n[1] + 0.5);
  while (chain.length < 4) {
    const last = chain[chain.length - 1];
    let c = nb(last).filter(n => !used.has(n + ''));
    const out = c.filter(n => far(n) >= far(last) - 0.01);
    if (out.length) c = out;
    const pick = c[Math.floor(rnd() * c.length)];
    chain.push(pick); used.add(pick + '');
  }
  const md = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  const tr = [zone.slice().sort((a, b) => md(a, chain[0]) - md(b, chain[0]))[0], chain[0], chain[1], chain[2]];
  const pool = ['statue', 'lord', 'shelter', 'camps', 'orbs'];
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const tw = pool.slice(0, 4);
  // the home region has no shelter
  for (let i = 0; i < 4; i++) if (tw[i] === 'shelter' && tr[i][0] === 0 && tr[i][1] === 0) { const j = (i + 1) % 4; [tw[i], tw[j]] = [tw[j], tw[i]]; }
  return { zone, chain, tr, tw, td: [false, false, false, false], rnd };
}
(function () {
  const si = Story.init;
  Story.init = function (realm, seed, hero, gender) {
    si.call(this, realm, seed, hero, gender);
    const c = v6Chapters(seed), rnd = c.rnd; delete c.rnd;
    const used = new Set(this.pois.filter(p => p.act === 0).map(p => p.sx + ',' + p.sy));
    const spot = ([rx, ry]) => {
      for (let i = 0; i < 60; i++) {
        const sx = rx * REG + 1 + Math.floor(rnd() * (REG - 2)), sy = ry * REG + 1 + Math.floor(rnd() * (REG - 2));
        if (used.has(sx + ',' + sy) || World.wonderAt(sx, sy) != null) continue;
        used.add(sx + ',' + sy); return [sx, sy];
      }
      return [rx * REG + 2, ry * REG + 2];
    };
    for (const p of this.pois) if (p.act >= 1) [p.sx, p.sy] = spot(c.chain[Math.min(3, p.act - 1)]);
    this.v6 = c;
    World._v6s = new Map();
  };
  const ser = Story.serialize;
  Story.serialize = function () { const d = ser.call(this); if (this.v6) d.v6 = this.v6; return d; };
  const ld = Story.load;
  Story.load = function (d) { this.v6 = null; ld.call(this, d); World._v6s = new Map(); };
  // the next region stays sealed until the chapter's trial is done
  Story.pendingTwist = function () {
    const c = this.v6; if (!c || this.finished) return -1;
    const i = this.act - 1;
    return i >= 0 && i < 4 && !c.td[i] ? i : -1;
  };
  const goal = Story.goal;
  Story.goal = function () {
    const i = this.pendingTwist();
    const ch = this.v6 && !this.finished ? `Chương ${Math.min(5, this.act + 1)}/5 • ` : '';
    if (i < 0) return ch + goal.call(this);
    const c = this.v6, rn = r => World.regionInfo(r[0], r[1]).name;
    return `${ch}${BARRIER[rk(RL.id)].name} chặn lối tới ${rn(c.chain[i])}. ${TWIST_TEXT[c.tw[i]](rn(c.tr[i]))}${G.twistProgress ? G.twistProgress(i) : ''}`;
  };
  const tg = Story.targets;
  Story.targets = function () {
    const i = this.pendingTwist();
    if (i < 0) return tg.call(this);
    if (World.mode !== 'over') return [];
    const c = this.v6, [rx, ry] = c.tr[i], t = c.tw[i];
    if (t === 'statue') { const p = World.siteXY(World.statueSB(rx, ry)); return p ? [{ x: p.x, y: p.y, label: ST_NAME[rk(RL.id)] }] : []; }
    const s = World.v6Sites(rx, ry);
    if (t === 'lord' && s.lord) { const p = World.siteXY(s.lord); return [{ x: p.x, y: p.y, label: LORD_NAME[rk(RL.id)] }]; }
    if (t === 'shelter' && s.shelter) { const p = World.siteXY(s.shelter); return [{ x: p.x, y: p.y, label: SHELTER_NAME[rk(RL.id)] }]; }
    return [];
  };
  const comp = Story.complete;
  Story.complete = function () {
    const had = !!this.curAct();
    comp.call(this);
    if (had && this.v6) { G.give('bt_c', 1); G.toast(`🗝 +1 ${itm('bt_c').name} — dùng để đột phá cảnh giới`, 'quest'); }
  };
})();

// ---------- state ----------
Object.assign(G, {
  v6: null,
  initV6(d, save) {
    d = d || {};
    const lvl = save && save.p ? save.p.level || 1 : 1;
    this.v6 = Object.assign({ bt: Math.floor((lvl - 1) / 5), clr: {}, lord: {}, def: {}, defDay: {}, gc: {}, sh: {}, skills: {}, skEq: -1, outfit: 0, rideTip: 0 }, d);
    this.v6def = null; this.v6fx = { holes: [], bladesT: 0, infT: 0, regenT: 0 }; this.v6safe = null; this.btNoteT = -99;
    if (this.player) this.player.riding = false;
  },
  v6Save() { return this.v6; },
  // ---------- region lock ----------
  regionLocked(rx, ry) {
    const c = Story.v6; if (!c || Story.finished) return false;
    if (c.zone.some(z => z[0] === rx && z[1] === ry)) return false;
    const i = c.chain.findIndex(z => z[0] === rx && z[1] === ry);
    if (i < 0) return true;
    return !(Story.act >= i + 1 && c.td[i]);
  },
  twistDone(i) {
    const c = Story.v6, [rx, ry] = c.tr[i], k = World.rkey(rx, ry), v = this.v6;
    switch (c.tw[i]) {
      case 'statue': return !!this.v5.st[k];
      case 'lord': return !!v.lord[k] || !World.v6Sites(rx, ry).lord;
      case 'shelter': return !!v.def[k] || !World.v6Sites(rx, ry).shelter;
      case 'camps': return (v.gc[k] || 0) >= 2;
      case 'orbs': return Object.keys(this.v5.orb).filter(o => o.startsWith(k + ':')).length >= 4;
    }
    return true;
  },
  twistProgress(i) {
    const c = Story.v6, k = World.rkey(c.tr[i][0], c.tr[i][1]);
    if (c.tw[i] === 'camps') return ` (${Math.min(2, this.v6.gc[k] || 0)}/2)`;
    if (c.tw[i] === 'orbs') return ` (${Math.min(4, Object.keys(this.v5.orb).filter(o => o.startsWith(k + ':')).length)}/4)`;
    return '';
  },
  // ---------- breakthrough ----------
  btBlocked() { const P = this.player; return !!(this.v6 && P && P.level % 5 === 0 && this.v6.bt < P.level / 5); },
  btReq(t) { return { a: 3 + 2 * t, b: t, c: t >= 2 ? 1 : 0, gold: 40 * t * t + 60 * t }; },
  btNotify() {
    if (this.time - this.btNoteT < 45) return;
    this.btNoteT = this.time;
    const t = this.player.level / 5, q = this.btReq(t);
    this.toast(`⚠ BÌNH CẢNH! Đã chạm đỉnh ${this.rankTitle()}. Cần ${q.a} ${itm('bt_a').name}, ${q.b} ${itm('bt_b').name}${q.c ? `, ${q.c} ${itm('bt_c').name}` : ''} để đột phá (Căn cứ › Đột phá hoặc tại ${ST_NAME[rk(RL.id)]}).`, 'quest');
  },
  btWhere() { return this.atBase() || (this.statueT || -99) > this.time; },
  breakthrough() {
    const P = this.player;
    if (!this.btBlocked()) return;
    if (!this.btWhere()) { this.toast(`Phải ở Căn cứ hoặc cạnh ${ST_NAME[rk(RL.id)]} đã thức tỉnh để đột phá.`, 'warn'); return; }
    const t = P.level / 5, q = this.btReq(t);
    if (!this.has('bt_a', q.a) || !this.has('bt_b', q.b) || (q.c && !this.has('bt_c', q.c)) || P.gold < q.gold) { this.toast('Chưa đủ nguyên liệu đột phá.', 'warn'); return; }
    this.take('bt_a', q.a); this.take('bt_b', q.b); if (q.c) this.take('bt_c', q.c); P.gold -= q.gold;
    const before = this.rankTitle();
    this.v6.bt = t;
    P.maxHp += 20; P.hp = P.maxHp; P.maxStam += 5; P.stamina = P.maxStam;
    UI.closePanel && UI.closePanel();
    FX.pillar(P.x, P.y, '#ffe6a0', 3, 140); FX.ring(P.x, P.y, 20, 520, '#ffe6a0', 1.4, 14); this.shake(10);
    for (let i = 0; i < 60; i++) Particles.add({ x: P.x, y: P.y, vx: R.range(-200, 200), vy: R.range(-260, -40), life: 1.6, max: 1.6, size: 4, col: '#ffe6a0', drag: 1, glow: true });
    Sound.play('sfx_gong', 0.9); Sound.play('sfx_legendary', 0.8);
    P.xp = Math.max(P.xp, this.xpNeed(P.level));
    this.addXp(0);
    UI.banner('ĐỘT PHÁ THÀNH CÔNG', `${before} → ${this.rankTitle()} • +20 máu, +4% sát thương vĩnh viễn`, '#ffe6a0');
    this.save();
  },
  // ---------- outfits follow the body armour ----------
  outfitTier(P) { const b = P.armor && P.armor.body; if (!b) return 0; return b.rarity >= 4 ? 3 : b.rarity === 3 ? 2 : b.rarity === 2 ? 1 : 0; },
  outfitSprite(base, t) {
    if (!t) return base;
    const k = rk(RL.id), i = RL.hero.indexOf(base);
    if (i < 0) return base;
    const n = `${k}_o${t}_${i}`;
    return IMG[n] ? n : base;
  },
  // ---------- mounts ----------
  mountSpeed() { return 1.55 + (this.pets[this.activePet] || 1) * 0.05; },
  toggleMount() {
    const P = this.player;
    if (!P || P.dead || P.car) return;
    if (P.riding) { this.dismount(); return; }
    if (this.activePet == null) { this.toast(`Chưa có thú cưng để cưỡi — triệu hồi ở ${GACHA_NAME[rk(RL.id)]} (🎴).`, 'warn'); return; }
    P.riding = true; P.rideA = P.angle;
    FX.ring(P.x, P.y, 8, 70, PETS[this.activePet].col, 0.4, 5); Sound.play('sfx_dash', 0.6, 0.8);
    if (!this.v6.rideTip) { this.v6.rideTip = 1; this.toast(`🐾 Cưỡi ${PETS[this.activePet].name}: +${Math.round((this.mountSpeed() - 1) * 100)}% tốc độ. Tấn công sẽ tự xuống. Nhấn Z / nút 🐾 để xuống.`, 'good'); }
  },
  dismount() { const P = this.player; if (!P || !P.riding) return; P.riding = false; Particles.burst(P.x, P.y, 8, '#d8c9a8', 80); },
  // ---------- drops ----------
  v6Kill(z) {
    const x = z.x, y = z.y, D = (id, n) => { if (n > 0) Items.drop(x, y, id, n); };
    if (z.lord) {
      const first = !this.v6.lord[z.lord];
      this.v6.lord[z.lord] = 1;
      D('bt_b', 2); D('bt_a', R.int(3, 5)); if (first) D('bt_c', 1);
      for (let i = 0; i < 8; i++) Items.drop(x, y, 'gold', R.int(10, 20) + z.lvl * 2);
      const [rx, ry] = z.lord.split(',').map(Number);
      UI.banner(LORD_NAME[rk(RL.id)].toUpperCase() + ' ĐÃ BỊ HẠ', World.regionInfo(rx, ry).name + (first ? ` • +1 ${itm('bt_c').name}` : ''), '#ff8a5a');
      this.giveTickets(first ? 3 : 1, null);
      this.save();
      return;
    }
    if (z.boss || z.mini) { D('bt_b', z.mini ? 1 : 2); D('bt_a', R.int(2, 4)); if (World.mode === 'dungeon' && !z.mini && Math.random() < 0.3) D('bt_c', 1); return; }
    if (z.elite) { if (Math.random() < 0.4) D('bt_a', 1); return; }
    if (z.gid) { if (Math.random() < 0.25) D('bt_a', 1); return; }
    if (Math.random() < 0.012) D('bt_a', 1);
  },
  // ---------- shelters ----------
  shelterHere() {
    const P = this.player; if (World.mode !== 'over') return null;
    const [rx, ry] = World.regionOf(Math.floor(P.x / SBPX), Math.floor(P.y / SBPX));
    const s = World.v6Sites(rx, ry); if (!s.shelter) return null;
    const p = World.siteXY(s.shelter), key = World.rkey(rx, ry);
    return { x: p.x, y: p.y, key, rx, ry, name: this.shelterName(rx, ry) };
  },
  shelterName(rx, ry) { return SHELTER_NAME[rk(RL.id)] + ' ' + REGION_ADJ[Math.floor(h3(rx, ry, 1700) * REGION_ADJ.length)]; },
  shelterMenu(a) {
    const sh = this.shelterHere(), k = rk(RL.id); if (!sh) return;
    const P = this.player, opts = [];
    const pt = Story.pendingTwist(), c = Story.v6;
    const quest = pt >= 0 && c.tw[pt] === 'shelter' && c.tr[pt][0] === sh.rx && c.tr[pt][1] === sh.ry;
    const canDef = !this.v6def && (quest || this.v6.defDay[sh.key] !== this.day);
    if (canDef) opts.push({ text: quest ? '⚔ Giúp phòng thủ (nhiệm vụ chương)' : '⚔ Phòng thủ khu trú ẩn (thưởng mỗi ngày)', act: () => this.startDefense(sh) });
    opts.push({ text: 'Nghỉ ngơi — hồi đầy máu và thể lực', act: () => { if ((this.restT || -99) > this.time) { this.toast('Vừa nghỉ xong, chờ thêm một lát.', 'info'); return; } this.restT = this.time + 90; P.hp = P.maxHp; P.stamina = P.maxStam; P.hunger = Math.max(P.hunger, 70); P.thirst = Math.max(P.thirst, 70); Sound.play('sfx_heal', 0.6); this.toast('Đã nghỉ ngơi ở ' + sh.name + '.', 'good'); } });
    if (this.has('bt_a', 6)) opts.push({ text: `Đổi 6 ${itm('bt_a').name} → 1 ${itm('bt_b').name}`, act: () => { this.take('bt_a', 6); this.give('bt_b', 1); Sound.play('sfx_craft', 0.6); this.toast(`Đã đổi được 1 ${itm('bt_b').name}.`, 'good'); } });
    opts.push({ text: 'Rời đi', act: () => {} });
    const line = Story.fmt(R.pick(RUMORS[k]));
    UI.menuDialog({ name: `${ELDER_NAME[k]} • ${sh.name}`, portrait: null, text: `"${line}"${quest ? ' — Lũ quái đang kéo tới, xin hãy giúp chúng tôi!' : ''}`, options: opts });
  },
  startDefense(sh) {
    if (typeof Net !== 'undefined' && Net.guest) { this.toast('Chỉ chủ phòng mới bắt đầu được trận phòng thủ.', 'warn'); return; }
    this.v6def = { key: sh.key, x: sh.x, y: sh.y, wave: 0, t: 3, live: false, name: sh.name };
    UI.banner('PHÒNG THỦ', sh.name + ' • 3 đợt tấn công', '#ff8a5a');
    Sound.play('sfx_alarm', 0.6);
  },
  defenseTick(dt) {
    const d = this.v6def; if (!d) return;
    const P = this.player;
    if (World.mode !== 'over' || P.dead || dist(P.x, P.y, d.x, d.y) > 1500) { this.v6def = null; this.toast('Bạn đã rời khu trú ẩn — trận phòng thủ thất bại.', 'warn'); for (const z of this.zombies) if (z.def) z.def = false; return; }
    if (d.live) {
      if (!this.zombies.some(z => z.def && !z.dead)) {
        d.live = false; d.wave++; d.t = 4;
        if (d.wave >= 3) {
          this.v6def = null; this.v6.def[d.key] = 1; this.v6.defDay[d.key] = this.day;
          UI.banner('ĐÃ BẢO VỆ ' + d.name.toUpperCase(), 'Dân làng biết ơn bạn!', '#6dff7a');
          Items.drop(d.x, d.y, 'bt_b', 1); Items.drop(d.x, d.y, 'bt_a', 3); for (let i = 0; i < 6; i++) Items.drop(d.x, d.y, 'gold', R.int(10, 18) + P.level);
          this.giveTickets(1, null); Sound.play('sfx_achievement', 0.7); this.save();
        } else this.toast(`Đợt ${d.wave}/3 đã bị đẩy lùi! Đợt kế tiếp sắp tới...`, 'good');
      }
      return;
    }
    d.t -= dt;
    if (d.t > 0) return;
    d.live = true;
    const n = 6 + d.wave * 4 + Math.floor(P.level / 4);
    const a0 = R.range(0, TAU);
    for (let i = 0; i < n; i++) {
      const a = a0 + R.range(-0.9, 0.9), r = R.range(620, 760);
      const z = this.spawnEnemy(this.pickArche(1), d.x + Math.cos(a) * r, d.y + Math.sin(a) * r, { state: 'chase', elite: Math.random() < 0.12 + d.wave * 0.06 });
      z.def = true; z.guard = true;
    }
    if (d.wave === 2) { const a = a0; const z = this.spawnEnemy('brute', d.x + Math.cos(a) * 700, d.y + Math.sin(a) * 700, { state: 'chase', elite: true }); z.def = true; z.guard = true; }
    UI.banner(`ĐỢT ${d.wave + 1}/3`, 'Kẻ địch đang tràn tới ' + d.name, '#ff5a3a');
    Sound.play('sfx_gong', 0.6, 0.8);
  },
  spawnCustom(s) {
    if (s.kind !== 'elder' && s.kind !== 'villager') return;
    if (this.allies.some(a => a.sid === s.sid)) return;
    const a = new Ally(s.kind, s.x, s.y, { img: RL.npc[s.sprite] || RL.npc[0] });
    a.sid = s.sid; a.home = { x: s.x, y: s.y }; a.sayT = R.range(4, 14); a.key = s.key;
    if (s.kind === 'elder') a.name = ELDER_NAME[rk(RL.id)];
    this.allies.push(a);
  },

  // ---------- gacha skills ----------
  skillName() { const e = this.v6 && this.v6.skEq; return e != null && e >= 0 && this.v6.skills[e] ? skName(SKILLS[e]) : RL.skill.name; },
  castV6(i) {
    const P = this.player, S = SKILLS[i], st = this.v6.skills[i] || 1;
    const pow = (1 + (P.perks.skill || 0) * 0.3) * (1 + P.level * 0.06) * (1 + (st - 1) * 0.15);
    const ax = Input.mouse.wx ?? P.x + Math.cos(P.angle) * 200, ay = Input.mouse.wy ?? P.y + Math.sin(P.angle) * 200;
    const near = (x, y, r) => this.zgrid.query(x, y, r).filter(z => !z.dead && dist(x, y, z.x, z.y) < r);
    switch (S.id) {
      case 'meteor': {
        const tx = Touch.on ? P.x + Math.cos(P.angle) * 180 : ax, ty = Touch.on ? P.y + Math.sin(P.angle) * 180 : ay;
        for (let k = 0; k < 9; k++) setTimeout(() => {
          const a = R.range(0, TAU), r = R.range(0, 170), x = tx + Math.cos(a) * r, y = ty + Math.sin(a) * r;
          this.meteors = this.meteors || []; this.meteors.push({ x, y, t: 0.45, big: true });
          setTimeout(() => { this.explode(x, y, 95, 115 * pow, true); FX.ring(x, y, 6, 90, '#ff7a2a', 0.4, 6); }, 420);
        }, k * 130);
        break;
      }
      case 'frost': {
        FX.ring(P.x, P.y, 10, 290, '#bfefff', 0.7, 12); Particles.ice(P.x, P.y, 40); Sound.play('sfx_freeze', 0.8);
        for (const z of near(P.x, P.y, 290)) { const a = Math.atan2(z.y - P.y, z.x - P.x); this.hitEnemy(z, 75 * pow, Math.cos(a) * 120, Math.sin(a) * 120, 'skill', a); z.slow = 5; if (!z.boss) z.stun = 2.5; else z.slow = 3; }
        break;
      }
      case 'chain': {
        let from = P, hit = 0; const done = new Set();
        for (let k = 0; k < 10; k++) {
          let b = null, bd = 420;
          for (const z of this.zgrid.query(from.x, from.y, 420)) { if (z.dead || done.has(z)) continue; const d = dist(from.x, from.y, z.x, z.y); if (d < bd) { bd = d; b = z; } }
          if (!b) break;
          FX.bolt(from.x, from.y, b.x, b.y, '#fff36b'); done.add(b); this.hitEnemy(b, 85 * pow, 0, 0, 'skill'); b.stun = Math.max(b.stun || 0, 0.6); from = b; hit++;
        }
        Sound.play('sfx_electric', 0.8);
        if (!hit) { this.toast('Không có kẻ địch nào trong tầm.', 'info'); P.energy = 70; }
        break;
      }
      case 'hole': {
        const x = Touch.on ? P.x + Math.cos(P.angle) * 170 : ax, y = Touch.on ? P.y + Math.sin(P.angle) * 170 : ay;
        this.v6fx.holes.push({ x, y, t: 2.4, max: 2.4, pow });
        Sound.play('sfx_shadow', 0.8);
        break;
      }
      case 'heal': {
        P.hp = Math.min(P.maxHp, P.hp + P.maxHp * 0.5); P.shield = Math.max(P.shield || 0, 60 + P.level * 4); P.shieldT = 0; P.burnT = 0;
        this.v6fx.regenT = 6; FX.pillar(P.x, P.y, '#6dff7a', 1.4, 50); Sound.play('sfx_heal', 0.8);
        break;
      }
      case 'blades': this.v6fx.bladesT = 10; this.v6fx.bladePow = pow; Sound.play('sfx_sword2', 0.7); break;
      case 'dash': {
        const list = near(P.x, P.y, 420).sort((a, b) => dist(P.x, P.y, a.x, a.y) - dist(P.x, P.y, b.x, b.y)).slice(0, 8);
        if (!list.length) { this.toast('Không có kẻ địch nào trong tầm.', 'info'); P.energy = 70; break; }
        P.ghostT = Math.max(P.ghostT || 0, list.length * 0.09 + 0.4); P.hurtT = Math.max(P.hurtT, 0.6);
        list.forEach((z, k) => setTimeout(() => {
          if (P.dead) return;
          const ox = P.x, oy = P.y, a = Math.atan2(z.y - oy, z.x - ox);
          P.x = z.x - Math.cos(a) * 26; P.y = z.y - Math.sin(a) * 26; World.collideCircle(P, P.r); P.angle = a;
          FX.slash(P.x, P.y, a, 46, 1.8, 'rgba(154,123,255,0.9)', 0.16);
          for (let j = 0; j < 6; j++) Particles.add({ x: lerp(ox, P.x, j / 6), y: lerp(oy, P.y, j / 6), vx: 0, vy: 0, life: 0.35, max: 0.35, size: 5, col: '#9a7bff', drag: 1, glow: true });
          if (!z.dead) this.hitEnemy(z, 95 * pow, Math.cos(a) * 160, Math.sin(a) * 160, 'skill', a);
          Sound.play('sfx_sword', 0.4, 1.3);
        }, k * 85));
        break;
      }
      case 'inferno': this.v6fx.infT = 8; this.v6fx.infPow = pow; Sound.play('sfx_fire', 0.8); break;
    }
  },
  v6fxTick(dt) {
    const F = this.v6fx, P = this.player;
    for (const h of F.holes) {
      h.t -= dt;
      for (const z of this.zgrid.query(h.x, h.y, 280)) {
        if (z.dead) continue;
        const d = dist(h.x, h.y, z.x, z.y); if (d > 280 || d < 4) continue;
        const k = (z.boss ? 40 : 190) * dt;
        z.x += (h.x - z.x) / d * k; z.y += (h.y - z.y) / d * k;
        if (this.frame % 12 === 0) this.hitEnemy(z, 9 * h.pow, 0, 0, 'skill');
      }
      if (Math.random() < 0.6) { const a = R.range(0, TAU); Particles.add({ x: h.x + Math.cos(a) * 120, y: h.y + Math.sin(a) * 120, vx: -Math.cos(a) * 200, vy: -Math.sin(a) * 200, life: 0.55, max: 0.55, size: 3, col: '#b46bff', drag: 1, glow: true }); }
      if (h.t <= 0) { this.explode(h.x, h.y, 170, 170 * h.pow, true); FX.ring(h.x, h.y, 10, 200, '#b46bff', 0.6, 10); }
    }
    F.holes = F.holes.filter(h => h.t > 0);
    if (F.regenT > 0) { F.regenT -= dt; P.hp = Math.min(P.maxHp, P.hp + P.maxHp * 0.03 * dt); }
    if (F.bladesT > 0) {
      F.bladesT -= dt;
      for (let i = 0; i < 6; i++) {
        const a = this.time * 5 + i / 6 * TAU, x = P.x + Math.cos(a) * 72, y = P.y + Math.sin(a) * 72;
        for (const z of this.zgrid.query(x, y, 26)) if (!z.dead && dist(x, y, z.x, z.y) < z.r + 14 && (z.bladeHit || 0) < this.time) { z.bladeHit = this.time + 0.3; this.hitEnemy(z, 26 * F.bladePow, Math.cos(a) * 90, Math.sin(a) * 90, 'skill', a); }
      }
    }
    if (F.infT > 0) {
      F.infT -= dt;
      if (this.frame % 8 === 0) for (const z of this.zgrid.query(P.x, P.y, 150)) if (!z.dead && dist(P.x, P.y, z.x, z.y) < 150) { this.hitEnemy(z, 12 * F.infPow, 0, 0, 'skill'); z.burnT = Math.max(z.burnT || 0, 1.5); }
      if (Math.random() < 0.8) { const a = R.range(0, TAU), r = R.range(60, 145); Particles.add({ x: P.x + Math.cos(a) * r, y: P.y + Math.sin(a) * r, vx: R.range(-10, 10), vy: R.range(-90, -40), life: 0.5, max: 0.5, size: 4, col: R.pick(['#ff5a2a', '#ffb02e', '#ffd65a']), drag: 1, glow: true }); }
    }
  },

  // ---------- per frame ----------
  v6Tick(dt) {
    const P = this.player, v = this.v6; if (!v || !P) return;
    const guest = typeof Net !== 'undefined' && Net.guest;
    this.v6fxTick(dt);
    // mount: smooth heading, dust, auto-dismount on attack
    if (P.riding) {
      const sp = Math.hypot(P.vx, P.vy);
      if (sp > 25) P.rideA += angDiff(P.rideA, Math.atan2(P.vy, P.vx)) * Math.min(1, dt * 8);
      if (sp > 120 && Math.random() < dt * 14) Particles.add({ x: P.x - Math.cos(P.rideA) * 24 + R.range(-6, 6), y: P.y - Math.sin(P.rideA) * 24 + R.range(-6, 6), vx: R.range(-15, 15), vy: R.range(-25, -5), life: 0.5, max: 0.5, size: 3, col: 'rgba(200,190,160,0.6)', drag: 2 });
      if (P.car || P.dead || this.activePet == null || (this.state === 'playing' && (Input.mouse.down || Touch.fire || Input.mouse.rclicked))) this.dismount();
    }
    // outfit change notice
    if (this.frame % 30 === 0) { const t = this.outfitTier(P); if (t !== v.outfit) { const up = t > v.outfit; v.outfit = t; if (up && this.state === 'playing') { FX.pillar(P.x, P.y, '#ffe6a0', 0.9, 34); this.toast(`✨ Ngoại hình mới: ${OUTFIT_NAMES[rk(RL.id)][t]}`, 'good'); } } }
    this.defenseTick(dt);
    if (World.mode !== 'over') return;
    // region barrier
    const ent = P.car || P;
    const [rx, ry] = World.regionOf(Math.floor(ent.x / SBPX), Math.floor(ent.y / SBPX));
    if (this.regionLocked(rx, ry) && !P.dead) {
      const s = this.v6safe;
      if (s) { ent.x = s.x; ent.y = s.y; if (ent.speed) ent.speed = 0; P.vx = P.vy = 0; }
      if ((this.barT || -99) < this.time) {
        this.barT = this.time + 3;
        const B = BARRIER[rk(RL.id)], pt = Story.pendingTwist();
        this.toast(`⛔ ${B.msg}. ${pt >= 0 ? 'Hoàn thành thử thách chương này để mở lối.' : 'Theo cốt truyện để mở dần từng vùng.'}`, 'warn');
      }
    } else this.v6safe = { x: ent.x, y: ent.y };
    if (this.frame % 15 === 0) {
      // trials of the current chapter
      const pt = Story.pendingTwist();
      if (pt >= 0 && !guest && this.twistDone(pt)) {
        Story.v6.td[pt] = true;
        const c = Story.v6, n = World.regionInfo(c.chain[pt][0], c.chain[pt][1]).name;
        UI.banner(BARRIER[rk(RL.id)].name.toUpperCase() + ' TAN BIẾN', `Lối vào ${n} đã mở`, BARRIER[rk(RL.id)].hex);
        Sound.play('sfx_portal', 0.8, 0.8); Sound.play('sfx_achievement', 0.6);
        setTimeout(() => this.toast('NHIỆM VỤ: ' + Story.goal(), 'quest'), 1600);
        this.save();
      }
      // guarded chests open up when their guards are gone
      for (const p of World.propsNear(P.x, P.y, 460, this._gq || (this._gq = []))) {
        if (!p.data || !p.data.sealed || p.looted) continue;
        if (dist(p.x, p.y, P.x, P.y) > 420) continue;
        if (this.zombies.some(z => z.gid === p.data.gid && !z.dead)) continue;
        p.data.sealed = false; v.clr[p.data.gid] = 1;
        FX.pillar(p.x, p.y, CHESTS[p.data.tier].col, 1.2, 40); Particles.burst(p.x, p.y, 24, '#ffe6a0', 160); Sound.play('sfx_achievement', 0.5, 1.4);
        this.toast(`🔓 ${CHESTS[p.data.tier].name} đã được giải phong ấn!`, 'good');
      }
      // shelters: discovery
      const sh = this.shelterHere();
      if (sh && !v.sh[sh.key] && dist(P.x, P.y, sh.x, sh.y) < 520) { v.sh[sh.key] = 1; UI.banner(sh.name.toUpperCase(), 'Khu trú ẩn của những người còn sống • an toàn, có thương nhân', '#6dff7a'); Sound.play('sfx_bell', 0.6); }
      this._sh = sh;
    }
    // shelter watchtowers shoot enemies
    const sh = this._sh;
    if (sh && !guest && dist(P.x, P.y, sh.x, sh.y) < 1500) {
      this.towerT = (this.towerT || 0) - dt;
      if (this.towerT <= 0) {
        this.towerT = 0.45;
        const W = RL.weapons.r1, R9 = 8 * TILE;
        for (const [dx, dy] of [[-R9, -R9], [R9, -R9], [-R9, R9], [R9, R9]]) {
          const tx = sh.x + dx, ty = sh.y + dy - 30;
          let b = null, bd = 470;
          for (const z of this.zgrid.query(tx, ty, 470)) { if (z.dead || z.rise > 0) continue; const d = dist(tx, ty, z.x, z.y); if (d < bd) { bd = d; b = z; } }
          if (!b) continue;
          const a = Math.atan2(b.y - ty, b.x - tx);
          Bullets.fire(tx, ty, a, { speed: 900, knock: 30, proj: W.proj || 'bullet', color: W.color, homing: W.homing }, 16 + P.level * 2.5, { ally: true, src: 'ally' });
          Sound.at(W.sfx, tx, ty, 0.15, 1.2);
        }
      }
    }
    // companions live at the base
    if (!guest && this.frame % 20 === 0) {
      const bp = this.v5 && this.v5.basePos, home = !!(bp && dist(P.x, P.y, bp.x, bp.y) < 1600);
      this.companions.forEach((c, i) => {
        if (!c.joined) return;
        if (c.ally && c.ally.leaving) return;
        if (this.v10 && this.v10.follow[i]) {
          if (c.ally && c.ally.home) { const j = this.allies.indexOf(c.ally); if (j >= 0) this.allies.splice(j, 1); c.ally = null; }
          if (!c.ally) { const a = new Ally('comp', P.x + R.range(-40, 40), P.y + R.range(20, 50), { img: c.data.sprite, comp: Object.assign(c.data, { ref: c }) }); c.ally = a; this.allies.push(a); }
          return;
        }
        if (c.ally && (!home || !c.ally.home)) { const j = this.allies.indexOf(c.ally); if (j >= 0) this.allies.splice(j, 1); c.ally = null; }
        if (home && !c.ally) {
          const hx = bp.x + (i ? 110 : -110), hy = bp.y + 150;
          const a = new Ally('comp', hx, hy, { img: c.data.sprite, comp: Object.assign(c.data, { ref: c }) });
          a.home = { x: hx, y: hy }; c.ally = a; this.allies.push(a);
        }
      });
    }
  },
});

// ---------- hooks ----------
(function () {
  const wi = World.init;
  World.init = function (seed) { wi.call(this, seed); this._v6s = new Map(); };
  const vs = World.v5Site;
  World.v5Site = function (sx, sy) {
    const r = vs.call(this, sx, sy); if (r || this.mode !== 'over') return r;
    const [rx, ry] = this.regionOf(sx, sy), s = this.v6Sites(rx, ry);
    if (s.lord && s.lord[0] === sx && s.lord[1] === sy) return { kind: 'lord', rx, ry };
    if (s.shelter && s.shelter[0] === sx && s.shelter[1] === sy) return { kind: 'shelter', rx, ry };
    return null;
  };
  const gvs = World.genV5Site;
  World.genV5Site = function (bk, sb) {
    const s = this.v5Site(sb.sx, sb.sy);
    if (s && s.kind === 'lord') return this.genLord(bk, sb, s);
    if (s && s.kind === 'shelter') return this.genShelter(bk, sb, s);
    return gvs.call(this, bk, sb);
  };
  // outdoor chests get guards; gold and diamond ones a mini-boss too
  const ch = World.chest;
  World.chest = function (tx, ty, tier) {
    const p = ch.call(this, tx, ty, tier);
    const sb = this._gen;
    if (!p || this.mode !== 'over' || this._noGuard || !sb || !sb.bld || p.data.mimic) return p;
    const li = (ty - sb.ty0) * SB + (tx - sb.tx0);
    if (li < 0 || li >= SB * SB || sb.bld[li] >= 0) return p;
    const gid = 'c' + tx + ',' + ty;
    p.data.guarded = true;
    if (G.v6 && G.v6.clr[gid]) return p;
    p.data.sealed = true; p.data.gid = gid;
    const x = tx * TILE + 16, y = ty * TILE + 16;
    this.guards6(x, y, [3, 4, 5, 6][tier], { r: 170, elite: [0.08, 0.2, 0.35, 0.5][tier], gid });
    if (tier >= 3 || (tier === 2 && SR.chance(0.5))) sb.spawns.push({ kind: 'boss', x: x + 50, y: y - 40, mini: true, gid, noChest: true, seed: (h3(tx, ty, 61) * 1e9) | 0 });
    if (RL.props.fire && this.free(tx + 2, ty + 1)) this.addProp(RL.props.fire, (tx + 2) * TILE + 16, (ty + 1) * TILE + 16, { r: 9, light: 90, lightCol: 'fire' });
    return p;
  };
  for (const fn of ['genStart', 'genPOI', 'genWonder', 'genV5Site']) {
    const f = World[fn]; if (!f) continue;
    World[fn] = function (...a) { const o = this._noGuard; this._noGuard = true; try { return f.apply(this, a); } finally { this._noGuard = o; } };
  }

  // new games and loads
  const ng = G.newGame;
  G.newGame = function (...a) { this.initV6(null, null); return ng.apply(this, a); };
  const ld = G.load;
  G.load = function (...a) {
    let d = null; try { d = JSON.parse(localStorage.getItem('tt_save_v2')); } catch (e) {}
    this.initV6(d && d.v6, d);
    const ok = ld.apply(this, a);
    if (ok && d && !d.v6) this.v6Hello = true;
    return ok;
  };
  const st = G.start;
  G.start = function (isNew) {
    st.call(this, isNew);
    if (isNew && Story.v6) setTimeout(() => this.toast(`📖 Mỗi chương truyện mở một vùng mới. ${BARRIER[rk(RL.id)].name} chặn những vùng chưa tới lượt.`, 'quest'), 14000);
    if (this.v6Hello) { this.v6Hello = false; setTimeout(() => this.toast('✨ Bản cập nhật: rương có lính canh, Lãnh chúa vùng ☠, khu trú ẩn, đột phá cần nguyên liệu, cưỡi thú cưng (Z), kỹ năng từ Tế Đàn. Chơi mới để trải nghiệm cốt truyện mở theo vùng!', 'quest'), 4000); }
  };
  if (typeof Net !== 'undefined') {
    const lch = Net.loadChar;
    Net.loadChar = function (realm) { const c = lch.call(this, realm); G.initV6(c.v6 || null, c); return c; };
  }
  const tick = G.v5Tick;
  G.v5Tick = function (dt) { tick.call(this, dt); this.v6Tick(dt); };

  // kills, chests, bounties
  const kill = G.killEnemy;
  G.killEnemy = function (z, src) { kill.call(this, z, src); this.v6Kill(z); };
  const rk2 = G.remoteKill;
  if (rk2) G.remoteKill = function (k) { rk2.call(this, k); this.v6Kill(k); };
  const oc = G.openChest;
  G.openChest = function (p) {
    const guarded = p.data && p.data.guarded, t = p.data ? p.data.tier : 0, mimic = p.data && p.data.mimic;
    oc.call(this, p);
    if (mimic) return;
    const D = (id, n) => { if (n > 0) Items.drop(p.x, p.y, id, n); };
    D('bt_a', [R.int(0, 1), R.int(1, 2), R.int(2, 3), R.int(3, 5)][t] || 0);
    if (t === 3) D('bt_b', R.int(1, 2)); else if (t === 2 && Math.random() < 0.4) D('bt_b', 1);
    if (t === 3 && Math.random() < 0.15) D('bt_c', 1);
    if (guarded && World.mode === 'over') { const [rx, ry] = World.regionOf(Math.floor(p.x / SBPX), Math.floor(p.y / SBPX)), k = World.rkey(rx, ry); this.v6.gc[k] = (this.v6.gc[k] || 0) + 1; }
  };
  const cb = G.claimBounty;
  G.claimBounty = function (b) { const was = b.claimed; cb.call(this, b); if (!was && b.claimed) this.give('bt_a', 2); };
  // breakthroughs add a little damage each
  const he = G.hitEnemy;
  G.hitEnemy = function (z, dmg, kx, ky, src, ang, wp) { if (this.v6 && (src === 'gun' || src === 'melee' || src === 'skill')) dmg *= 1 + 0.04 * this.v6.bt; return he.call(this, z, dmg, kx, ky, src, ang, wp); };
  // skills from the gacha replace the realm ultimate
  const cs = G.castSkill;
  G.castSkill = function () {
    const P = this.player;
    if (P.riding) this.dismount();
    const e = this.v6 && this.v6.skEq;
    if (e == null || e < 0 || !this.v6.skills[e]) return cs.call(this);
    if (P.energy < 100 || P.car || P.dead) { if (P.energy < 100) this.toast(`Năng lượng chưa đầy (${Math.floor(P.energy)}%). Gây sát thương để nạp.`, 'info'); return; }
    P.energy = 0;
    const S = SKILLS[e];
    UI.skillFlash(skName(S), S.col); Sound.play('sfx_skill', 0.8); this.shake(6);
    this.castV6(e);
  };
  const po = G.pullOne;
  G.pullOne = function () {
    const r = po.call(this);
    if (r.pet == null && ((r.star === 5 && Math.random() < 0.4) || (r.star === 4 && Math.random() < 0.3))) {
      const pool = SKILLS.map((s, i) => i).filter(i => SKILLS[i].star === r.star);
      const i = R.pick(pool), dup = !!this.v6.skills[i];
      return { star: r.star, skill: i, name: skName(SKILLS[i]) + (dup ? ` (★${Math.min(5, this.v6.skills[i] + 1)})` : ' — MỚI!'), icon: 'sk_' + i };
    }
    return r;
  };
  const cl = G.claim;
  G.claim = function (r) {
    if (r.skill != null) { const first = !Object.keys(this.v6.skills).length; this.v6.skills[r.skill] = Math.min(5, (this.v6.skills[r.skill] || 0) + 1); if (first) setTimeout(() => this.toast('📜 Kỹ năng mới! Trang bị ở Túi › Kỹ năng để thay tuyệt kỹ [Q].', 'quest'), 2500); UI.dirty = true; return; }
    return cl.call(this, r);
  };
  // pets: no abilities while being ridden
  const pt = G.petTick;
  G.petTick = function (dt) { const e = this.petE, P = this.player; if (e && P && P.riding) { e.x = P.x; e.y = P.y; e.t += dt; return; } return pt.call(this, dt); };
  const dpet = drawPet;
  drawPet = function (ctx) { if (G.player && G.player.riding) return; dpet(ctx); };
  const sm = Player.prototype.speedMul;
  Player.prototype.speedMul = function () { return sm.call(this) * (this.riding ? G.mountSpeed() : 1); };
  // outfit sprite follows the body armour
  const wd = Object.getOwnPropertyDescriptor(Player.prototype, 'wdef');
  Object.defineProperty(Player.prototype, 'wdef', {
    configurable: true,
    get() {
      const c = wd.get.call(this);
      if (!/_o\d_\d$/.test(c.sprite)) c._base = c.sprite;
      c.sprite = G.outfitSprite(c._base || c.sprite, G.outfitTier(this));
      return c;
    },
  });
  const pd = Player.prototype.draw;
  Player.prototype.draw = function (ctx) {
    if (this.riding && !this.car && !this.dead && G.activePet != null) {
      const im = IMG['mount_' + G.activePet];
      if (im) {
        const w = im.width / 2, h = im.height / 2, bob = Math.sin(this.walkT * 1.3) * 1.5 * Math.min(1, Math.hypot(this.vx, this.vy) / 100);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(this.x + 4, this.y + 6, w * 0.45, h * 0.32, this.rideA, 0, TAU); ctx.fill();
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rideA); ctx.scale(1 + bob * 0.02, 1 - bob * 0.02);
        ctx.drawImage(im, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
    }
    pd.call(this, ctx);
  };

  // companions: recruited in the field, then they head home to the base
  const rec = G.recruit;
  G.recruit = function (c, x, y) {
    rec.call(this, c, x, y);
    const bp = this.v5 && this.v5.basePos;
    if (c.ally && !(bp && dist(x, y, bp.x, bp.y) < 1600)) c.ally.leaving = true;
  };
  const au = Ally.prototype.update;
  Ally.prototype.update = function (dt) {
    const P = G.player;
    if (this.kind === 'comp' && this.leaving) {
      this.hurtT -= dt; if (this.say) { this.say.t -= dt; if (this.say.t <= 0) this.say = null; }
      if (UI.dialogOpen) return;
      if (!this.leftT) { this.leftT = 1; this.speak(`Tôi về ${HOME_NAME[rk(RL.id)]} chờ bạn nhé!`, 3); }
      const a = Math.atan2(this.y - P.y, this.x - P.x);
      this.x += Math.cos(a) * 70 * dt; this.y += Math.sin(a) * 70 * dt; this.angle = a; this.walkT += dt * 6;
      this.fade -= dt * 0.4;
      if (this.fade <= 0) {
        this.dead = true; if (this.comp && this.comp.ref) this.comp.ref.ally = null;
        G.toast(`🏠 ${this.comp.name} đã về Căn cứ. Về ${HOME_NAME[rk(RL.id)]} để trò chuyện, tặng quà.`, 'love');
      }
      return;
    }
    if ((this.kind === 'comp' && this.home) || this.kind === 'villager' || this.kind === 'elder') {
      if (dist(this.x, this.y, P.x, P.y) > 1800) return;
      this.hurtT -= dt; this.cool -= dt;
      if (this.say) { this.say.t -= dt; if (this.say.t <= 0) this.say = null; }
      if (this.kind !== 'elder') {
        this.wt = (this.wt || 0) - dt;
        if (this.wt <= 0) { this.wt = R.range(2, 6); const a = R.range(0, TAU); this.goal = { x: this.home.x + Math.cos(a) * R.range(0, 100), y: this.home.y + Math.sin(a) * R.range(0, 70) }; }
        if (this.goal) { const dx = this.goal.x - this.x, dy = this.goal.y - this.y, d = Math.hypot(dx, dy); if (d > 6) { this.x += dx / d * 42 * dt; this.y += dy / d * 42 * dt; this.angle = Math.atan2(dy, dx); this.walkT += dt * 5; World.collideCircle(this, this.r); } }
      } else this.angle += angDiff(this.angle, Math.atan2(P.y - this.y, P.x - this.x)) * Math.min(1, dt * 3);
      if (dist(this.x, this.y, this.home.x, this.home.y) > 500) { this.x = this.home.x; this.y = this.home.y; }
      if (this.kind === 'comp') {
        const tgt = this.nearestEnemy(300);
        if (tgt) {
          this.angle = Math.atan2(tgt.y - this.y, tgt.x - this.x);
          if (this.cool <= 0) { this.cool = 0.5; const W = RL.weapons.r1; Bullets.fire(this.x + Math.cos(this.angle) * 14, this.y + Math.sin(this.angle) * 14, this.angle, { speed: 900, knock: 40, proj: W.proj || 'bullet', color: W.color, homing: W.homing }, this.dmg, { ally: true, src: 'ally' }); Sound.at(W.sfx, this.x, this.y, 0.2, 1.15); }
        }
        if (this.hp < this.maxHp) this.hp = Math.min(this.maxHp, this.hp + dt * 5);
      }
      this.sayT -= dt;
      if (this.sayT <= 0) {
        this.sayT = R.range(14, 28);
        if (dist(this.x, this.y, P.x, P.y) < 320) {
          if (this.kind === 'comp') this.speak(Story.fmt(R.pick(this.comp.banter)), 4);
          else if (this.kind === 'elder') this.speak('Lại đây, ta có chuyện muốn nói.', 3);
          else this.speak(R.pick(['Có tường rào rồi, ngủ yên hơn hẳn.', 'Cảm ơn đã ghé qua!', 'Lính gác trên tháp bắn giỏi lắm.', 'Ngoài kia nguy hiểm, nghỉ chút đã.', 'Mua gì thì ghé chỗ thương nhân nhé.', 'Hy vọng ngày mai bình yên.']), 3);
        }
      }
      return;
    }
    return au.call(this, dt);
  };
  const ah = Ally.prototype.hurt;
  Ally.prototype.hurt = function (d) { if (this.kind === 'villager' || this.kind === 'elder' || (this.kind === 'comp' && (this.home || this.leaving))) return; return ah.call(this, d); };
  const ad = Ally.prototype.draw;
  Ally.prototype.draw = function (ctx) {
    ad.call(this, ctx);
    if (this.kind === 'elder' && dist(this.x, this.y, G.player.x, G.player.y) < 300) {
      ctx.font = '9px VT323, monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = '#000'; ctx.fillText('★ ' + this.name, this.x + 1, this.y - 23); ctx.fillStyle = '#ffe6a0'; ctx.fillText('★ ' + this.name, this.x, this.y - 24);
    }
  };

  // interactions: elders, villagers, sealed chests, breakthrough at statues
  const fi = G.findInteract;
  G.findInteract = function () {
    const best = fi.call(this);
    if (best && best.kind === 'loot' && best.prop && best.prop.data && best.prop.data.sealed) {
      const n = this.zombies.filter(z => z.gid === best.prop.data.gid && !z.dead).length;
      best.label = `🔒 Rương bị phong ấn${n ? ` — còn ${n} lính canh` : ''}`;
    }
    const P = this.player;
    if (best && best.kind !== 'loot') return best;
    for (const a of this.allies) {
      if ((a.kind !== 'elder' && a.kind !== 'villager') || a.dead) continue;
      if (dist(a.x, a.y, P.x, P.y) < 50) return { ally: a, kind: a.kind, label: a.kind === 'elder' ? `Nói chuyện với ${a.name}` : 'Trò chuyện' };
    }
    return best;
  };
  const ia = G.interact;
  G.interact = function (it) {
    if (it && it.kind === 'loot' && it.prop && it.prop.data && it.prop.data.sealed) { this.toast('🔒 Rương bị phong ấn — hạ hết lính canh xung quanh để mở.', 'warn'); Sound.play('sfx_empty', 0.5); return; }
    if (it && it.kind === 'elder') return this.shelterMenu(it.ally);
    if (it && it.kind === 'villager') { it.ally.speak(Story.fmt(R.pick(RUMORS[rk(RL.id)])), 4); return; }
    return ia.call(this, it);
  };
  const sm2 = G.statueMenu;
  G.statueMenu = function (p) {
    this.statueT = this.time + 60;
    if (this.btBlocked()) {
      const opts = [{ text: '✦ Đột phá cảnh giới', act: () => setTimeout(() => UI.openBase('bt'), 50) }, { text: 'Mục khác...', act: () => setTimeout(() => sm2.call(this, p), 50) }];
      UI.menuDialog({ name: ST_NAME[rk(RL.id)], portrait: null, text: `Bạn đã chạm bình cảnh của ${this.rankTitle()}. ${ST_NAME[rk(RL.id)]} có thể giúp bạn đột phá.`, options: opts });
      return;
    }
    return sm2.call(this, p);
  };
  // drawing: sealed chests, lord camp markers, shelters
  const dp = drawProp;
  drawProp = function (p) {
    if (p.kind === 'chest' && p.data && p.data.sealed) {
      const v = G.view;
      if (v && p.x > v.x0 - 60 && p.x < v.x1 + 60 && p.y > v.y0 - 60 && p.y < v.y1 + 60) {
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 + Math.sin(G.time * 4) * 0.12;
        ctx.drawImage(GLOW.red || GLOW.fire, p.x - 34, p.y - 30, 68, 60);
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
        dp(p);
        ctx.strokeStyle = 'rgba(40,30,30,0.9)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(p.x - 14, p.y - 10); ctx.lineTo(p.x + 14, p.y + 8); ctx.moveTo(p.x + 14, p.y - 10); ctx.lineTo(p.x - 14, p.y + 8); ctx.stroke();
        ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🔒', p.x, p.y - 18 + Math.sin(G.time * 3) * 2);
        return;
      }
    }
    dp(p);
  };
  // barriers on locked regions + skill effects, drawn in world space
  const dob = drawObjective;
  drawObjective = function () {
    drawV6World();
    dob();
  };
})();

function drawV6World() {
  const v = G.view, P = G.player; if (!v || !P) return;
  const F = G.v6fx;
  if (F) {
    for (const h of F.holes) {
      const k = 1 - h.t / h.max, r = 30 + k * 40;
      ctx.fillStyle = 'rgba(10,0,20,0.85)'; ctx.beginPath(); ctx.arc(h.x, h.y, r, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5; ctx.drawImage(GLOW.magenta || GLOW.white, h.x - r * 3, h.y - r * 3, r * 6, r * 6); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#b46bff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(h.x, h.y, r + 4 + Math.sin(G.time * 20) * 2, 0, TAU); ctx.stroke();
    }
    if (F.bladesT > 0) for (let i = 0; i < 6; i++) {
      const a = G.time * 5 + i / 6 * TAU, x = P.x + Math.cos(a) * 72, y = P.y + Math.sin(a) * 72;
      ctx.save(); ctx.translate(x, y); ctx.rotate(G.time * 18);
      ctx.fillStyle = '#e0e6ff'; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(4, 0); ctx.lineTo(0, 12); ctx.lineTo(-4, 0); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    if (F.infT > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 + Math.random() * 0.1; ctx.drawImage(GLOW.fire, P.x - 170, P.y - 170, 340, 340); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
  }
  if (World.mode !== 'over' || !Story.v6 || Story.finished) return;
  const B = BARRIER[rk(RL.id)];
  const rx0 = Math.floor(v.x0 / REGPX), rx1 = Math.floor(v.x1 / REGPX), ry0 = Math.floor(v.y0 / REGPX), ry1 = Math.floor(v.y1 / REGPX);
  for (let ry = ry0; ry <= ry1; ry++) for (let rx = rx0; rx <= rx1; rx++) {
    if (!G.regionLocked(rx, ry)) continue;
    const x0 = Math.max(v.x0, rx * REGPX), y0 = Math.max(v.y0, ry * REGPX), x1 = Math.min(v.x1, (rx + 1) * REGPX), y1 = Math.min(v.y1, (ry + 1) * REGPX);
    const pulse = 0.5 + Math.sin(G.time * 2) * 0.15;
    ctx.fillStyle = `rgba(${B.col},${0.13 * pulse + 0.06})`; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    // glowing walls on the edges that face open land
    const edge = (ax, ay, bx, by, nx, ny) => {
      const g = ctx.createLinearGradient(ax, ay, ax + nx * 70, ay + ny * 70);
      g.addColorStop(0, `rgba(${B.col},${0.75 * pulse + 0.2})`); g.addColorStop(1, `rgba(${B.col},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(Math.min(ax, bx, ax + nx * 70), Math.min(ay, by, ay + ny * 70), Math.abs(bx - ax) + Math.abs(nx * 70), Math.abs(by - ay) + Math.abs(ny * 70));
    };
    const L = rx * REGPX, Rr = (rx + 1) * REGPX, Tt = ry * REGPX, Bb = (ry + 1) * REGPX;
    if (!G.regionLocked(rx - 1, ry) && L >= v.x0 - 80) edge(L, y0, L, y1, 1, 0);
    if (!G.regionLocked(rx + 1, ry) && Rr <= v.x1 + 80) edge(Rr, y0, Rr, y1, -1, 0);
    if (!G.regionLocked(rx, ry - 1) && Tt >= v.y0 - 80) edge(x0, Tt, x1, Tt, 0, 1);
    if (!G.regionLocked(rx, ry + 1) && Bb <= v.y1 + 80) edge(x0, Bb, x1, Bb, 0, -1);
    // drifting motes
    for (let i = 0; i < 10; i++) {
      const sx = x0 + ((h3(rx, ry, i) * 9999 + G.time * 20 * (i % 3 + 1)) % Math.max(1, x1 - x0)), sy = y0 + ((h3(ry, rx, i) * 9999 + G.time * 12) % Math.max(1, y1 - y0));
      ctx.fillStyle = `rgba(${B.col},0.5)`; ctx.fillRect(sx, sy, 3, 3);
    }
    const cxp = clamp(P.x, x0 + 60, x1 - 60), cyp = clamp(P.y, y0 + 40, y1 - 40);
    if (dist(cxp, cyp, P.x, P.y) < 420) {
      ctx.font = '12px VT323, monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = '#000'; ctx.fillText('⛔ ' + B.name.toUpperCase(), cxp + 1, cyp + 1); ctx.fillStyle = B.hex; ctx.fillText('⛔ ' + B.name.toUpperCase(), cxp, cyp);
    }
  }
}

// ---------- UI: map overlay, base breakthrough tab, skills tab, HUD bits ----------
(function () {
  const dbm = UI.drawBigMap;
  UI.drawBigMap = function () {
    dbm.call(this);
    if (World.mode !== 'over' || !this.mapC) return;
    const c = $('bigmap'), g = c.getContext('2d'), K = this.mapK || 1;
    const N = this.mapZoom, S = c.width / (N * SB), NH = c.height / S / SB;
    const x0 = this.mapC.x - N * SB / 2, y0 = this.mapC.y - NH * SB / 2;
    const toM = (wx, wy) => [((wx / TILE) - x0) * S, ((wy / TILE) - y0) * S];
    const rx0 = Math.floor(x0 / SB / REG) - 1, ry0 = Math.floor(y0 / SB / REG) - 1, B = BARRIER[rk(RL.id)], v5 = G.v5, v6 = G.v6;
    for (let ry = ry0; ry <= ry0 + Math.ceil(NH / REG) + 2; ry++) for (let rx = rx0; rx <= rx0 + Math.ceil(N / REG) + 2; rx++) {
      const px = (rx * REG * SB - x0) * S, py = (ry * REG * SB - y0) * S, w = REG * SB * S, k = World.rkey(rx, ry);
      if (G.regionLocked(rx, ry)) {
        g.fillStyle = `rgba(${B.col},0.16)`; g.fillRect(px, py, w, w);
        g.strokeStyle = `rgba(${B.col},0.5)`; g.lineWidth = 2 * K; g.strokeRect(px + K, py + K, w - 2 * K, w - 2 * K);
        UI.mapIcon(g, px + w / 2, py + w / 2, '🔒', B.hex, 22);
        continue;
      }
      const lit = !!v5.st[k], vis = lit || v5.visited[k];
      const s = World.v6Sites(rx, ry);
      if (s.lord && (lit || vis)) { const p = World.siteXY(s.lord), [mx, my] = toM(p.x, p.y); UI.mapIcon(g, mx, my, '☠', v6.lord[k] ? '#666' : '#ff6a4a', 18); }
      if (s.shelter && (lit || v6.sh[k])) { const p = World.siteXY(s.shelter), [mx, my] = toM(p.x, p.y); UI.mapIcon(g, mx, my, '⛺', '#6dff7a', 18); }
    }
    const pt = Story.pendingTwist();
    if (pt >= 0) $('mapInfo').textContent = '📖 ' + Story.goal();
  };

  const bb = UI.buildBase;
  UI.buildBase = function () {
    bb.call(this);
    if (this.baseTab !== 'bt') return;
    const P = G.player, here = G.btWhere(), blocked = G.btBlocked();
    const t = blocked ? P.level / 5 : Math.ceil(P.level / 5) || 1, q = G.btReq(t);
    const T0 = LORE[RL.id].levelTitles, next = T0[Math.min(T0.length - 1, t)];
    const row = (id, n) => { const have = P.inv[id] || 0, it = itm(id); return `<div class="srow" style="--rc:${have >= n ? '#6dff7a' : '#ff6a5a'}"><img src="${IMG[it.icon] ? IMG[it.icon].src : ''}" alt=""><div class="sinfo"><b>${esc(it.name)}</b><small>${esc(it.desc)}</small></div><span class="btn6 ${have >= n ? 'ok' : 'bad'}">${have}/${n}</span></div>`; };
    let h = `<div class="bthead"><b>${esc(G.rankTitle())}</b> → <b class="gold">${esc(next)}</b><p class="muted">${blocked ? `Đã chạm bình cảnh ở cấp ${P.level}. Kinh nghiệm không tăng thêm cho tới khi đột phá.` : `Cảnh giới tiếp theo mở ở cấp ${t * 5}. Hãy gom nguyên liệu trước.`} Mỗi lần đột phá: +20 máu, +5 thể lực, +4% sát thương vĩnh viễn.</p></div><div class="srows">`;
    h += row('bt_a', q.a) + row('bt_b', q.b) + (q.c ? row('bt_c', q.c) : '');
    h += `<div class="srow" style="--rc:${P.gold >= q.gold ? '#6dff7a' : '#ff6a5a'}"><img src="${IMG[cur().icon].src}" alt=""><div class="sinfo"><b>${esc(cur().name)}</b><small>Chi phí bế quan</small></div><span class="btn6 ${P.gold >= q.gold ? 'ok' : 'bad'}">${P.gold}/${q.gold}</span></div></div>`;
    h += `<div class="menu row"><button id="btGo" ${blocked && here ? '' : 'class="dim"'}>✦ ĐỘT PHÁ</button></div>`;
    if (!here) h += `<p class="muted">Về Căn cứ hoặc đứng cạnh ${ST_NAME[rk(RL.id)]} đã thức tỉnh để đột phá.</p>`;
    h += `<p class="muted">Nguồn nguyên liệu: tinh anh, rương bị phong ấn (có lính canh), Lãnh chúa vùng ☠, phòng thủ khu trú ẩn ⛺, boss hầm ngục, nhiệm vụ ở Bảng Nhiệm Vụ. ${esc(SHELTER_NAME[rk(RL.id)])} đổi 6 ${esc(itm('bt_a').name)} lấy 1 ${esc(itm('bt_b').name)}.</p>`;
    const box = $('baseBody'); box.innerHTML = h;
    const go = $('btGo'); this.bindBtn(go); go.onclick = () => { G.breakthrough(); if (G.state === 'menu') this.buildBase(); };
  };

  const bi = UI.buildInv;
  UI.buildInv = function () {
    if (this.invTab !== 'skills') return bi.call(this);
    document.querySelectorAll('.tabs [data-tab]').forEach(t => t.classList.toggle('on', t.dataset.tab === 'skills'));
    const v = G.v6, eq = v.skEq;
    let h = '<div class="petgrid">';
    h += `<div class="petc ${eq < 0 ? 'on' : ''}" style="--pc:${RL.skill.color}"><b>${esc(RL.skill.name)}</b><span class="pst">Tuyệt kỹ gốc</span><small>${esc(RL.skill.desc)}</small><button data-sk="-1">${eq < 0 ? 'ĐANG DÙNG' : 'DÙNG'}</button></div>`;
    SKILLS.forEach((s, i) => {
      const st = v.skills[i];
      h += `<div class="petc ${st ? '' : 'locked'} ${eq === i ? 'on' : ''}" style="--pc:${s.col}"><img src="${IMG['sk_' + i].src}" alt=""><b>${st ? esc(skName(s)) : '???'}</b><span class="pst">${'★'.repeat(s.star)}${st ? ` • Bậc ${st}/5` : ''}</span><small>${esc(s.desc)}${st ? ` • +${(st - 1) * 15}% sức mạnh` : ''}</small>${st ? `<button data-sk="${i}">${eq === i ? 'ĐANG DÙNG' : 'DÙNG'}</button>` : `<small class="muted">Triệu hồi ở ${esc(GACHA_NAME[rk(RL.id)])}</small>`}</div>`;
    });
    $('invBody').innerHTML = h + '</div><p class="muted">Kỹ năng được trang bị dùng bằng [V] / nút PHÁP, tốn mana (linh khí / năng lượng); [Q] vẫn là tuyệt kỹ. Trùng kỹ năng sẽ tăng bậc (tối đa 5), mỗi bậc +15% sức mạnh.</p>';
    $('invBody').querySelectorAll('[data-sk]').forEach(b => { this.bindBtn(b); b.onclick = () => { v.skEq = +b.dataset.sk; UI.dirty = true; this.buildInv(); }; });
  };
  const bp = UI.buildPets;
  UI.buildPets = function (box) {
    bp.call(this, box);
    box.insertAdjacentHTML('beforeend', `<p class="muted">🐾 Toạ kỵ: thú cưng đang đi theo có thể cưỡi — phím Z hoặc nút 🐾, tốc độ +${Math.round(((G.activePet != null ? G.mountSpeed() : 1.6) - 1) * 100)}%. Tấn công sẽ tự xuống.</p>`);
  };
  const rg = UI.revealGacha;
  UI.revealGacha = function (res, best) {
    rg.call(this, res, best);
    const cards = $('gCards').children;
    res.forEach((r, i) => { if (r.skill != null && cards[i]) cards[i].insertAdjacentHTML('beforeend', `<i style="color:${SKILLS[r.skill].col}">KỸ NĂNG</i>`); });
  };
  const bg = UI.buildGacha;
  UI.buildGacha = function () {
    bg.call(this);
    $('gFeat').insertAdjacentHTML('beforeend', SKILLS.map((s, i) => s.star === 5 ? `<div class="gfp"><img src="${IMG['sk_' + i].src}" alt=""><span>${esc(skName(s))}</span></div>` : '').join(''));
  };
  // mount key + touch button
  window.addEventListener('keydown', e => { if (e.code === 'KeyZ' && G.state === 'playing' && !e.repeat) G.toggleMount(); });
  const mb = $('tMount');
  if (mb) mb.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); G.toggleMount(); mb.classList.add('down'); setTimeout(() => mb.classList.remove('down'), 150); }, { passive: false });
  setInterval(() => {
    if (!mb || !G.player) return;
    const im = mb.querySelector('img'), src = G.activePet != null && IMG['pet_' + G.activePet] ? IMG['pet_' + G.activePet].src : '';
    if (im && src && im.src !== src) im.src = src;
    mb.classList.toggle('on', !!G.player.riding);
    mb.hidden = G.activePet == null;
  }, 400);
})();
