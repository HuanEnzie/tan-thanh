// ===== v10: mana + attributes, shadow army (Trỗi Dậy), party orders + random recruits, gate travel + map list, mini-boss respawn =====
const MANA_NAME = { md: 'Năng lượng', tt: 'Linh khí', sl: 'Mana' };
const ATTR_KEYS = ['str', 'vit', 'agi', 'int'];
const ATTR_NAME = {
  md: { str: 'Sức mạnh', vit: 'Thể lực', agi: 'Nhanh nhẹn', int: 'Trí lực' },
  tt: { str: 'Lực đạo', vit: 'Thể phách', agi: 'Thân pháp', int: 'Thần thức' },
  sl: { str: 'Sức mạnh (STR)', vit: 'Thể lực (VIT)', agi: 'Nhanh nhẹn (AGI)', int: 'Trí tuệ (INT)' },
};
const PTS_PER_LVL = 3, MINI_RESPAWN = 480, SHADOW_CD = 25;
// shadow tiers: base stats, summon cost, extraction chance and mana cost
const SH_TIER = {
  normal: { name: 'Lính', col: '#b46bff', hp: 140, dmg: 22, cost: 8, chance: 0.4, mana: 15 },
  elite: { name: 'Tinh anh', col: '#ffe14a', hp: 260, dmg: 32, cost: 14, chance: 0.28, mana: 25 },
  mini: { name: 'Thủ lĩnh', col: '#ff9a2a', hp: 650, dmg: 55, cost: 25, chance: 0.16, mana: 40 },
  boss: { name: 'Quân vương', col: '#ff3b3b', hp: 1200, dmg: 85, cost: 40, chance: 0.09, mana: 60 },
};
const SH_ORDER = ['boss', 'mini', 'elite', 'normal'];
// random recruits
const RC_ROLE = {
  warrior: { hp: 1.4, atk: 1.05, def: 1.6, spd: 145 }, assassin: { hp: 0.95, atk: 1.35, def: 0.9, spd: 165 }, ranger: { hp: 0.95, atk: 1.15, def: 1, spd: 140 },
  healer: { hp: 1, atk: 0.65, def: 1, spd: 135 }, mage: { hp: 0.85, atk: 1.4, def: 0.8, spd: 130 },
};
const OLD_ROLE = { melee: 'warrior', ranged: 'ranger' };
const roleOf = r => OLD_ROLE[r.role] || r.role;
const RC_NAMES = {
  md: { fam: ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Dương', 'Lý'], m: ['Minh', 'Hùng', 'Quân', 'Khoa', 'Bảo', 'Tuấn', 'Long', 'Phát', 'Duy', 'Tài', 'Nam', 'Sơn'], f: ['Lan', 'Vy', 'Trang', 'Ngân', 'Thảo', 'Mai', 'Hà', 'Linh', 'Quỳnh', 'My', 'Yến', 'Nhi'] },
  tt: { fam: ['Lâm', 'Mộ Dung', 'Tiêu', 'Lý', 'Vân', 'Bạch', 'Hàn', 'Diệp', 'Tô', 'Liễu', 'Thượng Quan', 'Đông Phương'], m: ['Phong', 'Thanh Vân', 'Hàn', 'Kiếm Minh', 'Trường Không', 'Dật', 'Viêm', 'Lăng', 'Thiên Hành', 'Bất Phàm', 'Vô Kỵ', 'Trần'], f: ['Tuyết', 'Nguyệt', 'Dao', 'Linh Nhi', 'Thanh Y', 'Uyển', 'Như Yên', 'Mộng', 'Hà', 'Tử Yên', 'Băng', 'Vũ Điệp'] },
  sl: { fam: ['Kim', 'Park', 'Lee', 'Choi', 'Yoon', 'Han', 'Kang', 'Seo', 'Jung', 'Baek', 'Oh', 'Shin'], m: ['Do-hyun', 'Tae-oh', 'Min-jae', 'Seo-jun', 'Ji-ho', 'Woo-jin', 'Hyun-woo', 'Joon', 'Sung-min', 'Dae-ho', 'Ki-tae', 'Yeon-woo'], f: ['Ha-rin', 'Ji-woo', 'Soo-ah', 'Yu-na', 'Seo-yeon', 'Min-ji', 'Hye-jin', 'Ara', 'Eun-bi', 'So-hee', 'Da-eun', 'Ye-rin'] },
};
const RC_LINES = {
  hello: ['Cần thêm người thì cứ gọi tôi.', 'Đi một mình nguy hiểm lắm, cho tôi theo với.', 'Tôi không làm vướng chân đâu.'],
  follow: ['Đi thôi!', 'Tôi theo sau bạn.', 'Rõ, lên đường.'],
  home: ['Tôi về căn cứ chờ nhé.', 'Cần thì gọi, tôi về trước.'],
  hurt: ['Á! Tôi dính đòn rồi!', 'Còn chịu được!', 'Đau quá...'],
  fight: ['Xử nó!', 'Để tôi lo bên này!', 'Cẩn thận phía sau!'],
};
const RANK_COL = { E: '#b0b0b0', D: '#6ee06e', C: '#4da6ff', B: '#b46bff', A: '#ffa31a', S: '#ff4a4a' };

const manaName = () => MANA_NAME[rk(RL.id)];
const attrName = k => ATTR_NAME[rk(RL.id)][k];
// summoning the fallen exists in every world, under its own name
const SUMMON = {
  md: { skill: 'Khống Thi', unit: 'xác sống', army: 'Đội xác sống', col: '#8cff5a', tint: 'rgba(28,66,14,0.74)', eye: 'rgba(255,80,60,0.95)', icon: '☣' },
  tt: { skill: 'Ngự Quỷ', unit: 'quỷ', army: 'Bách Quỷ', col: '#5affd8', tint: 'rgba(16,86,92,0.72)', eye: 'rgba(170,255,240,0.95)', icon: '👻', ghost: true },
  sl: { skill: 'Trỗi Dậy', unit: 'bóng', army: 'Binh đoàn bóng tối', col: '#8a7bff', tint: 'rgba(30,20,70,0.78)', eye: 'rgba(80,140,255,0.9)', icon: '🌑' },
};
const SM = () => SUMMON[rk(RL.id)];
const isArise = () => !!RL;
// classes: stat weights, passives and dash variants live in v11
const CLASS_KEYS = ['warrior', 'assassin', 'ranger', 'mage', 'healer'];
const CLASS_NAME = {
  md: { warrior: 'Chiến Binh', assassin: 'Sát Thủ', ranger: 'Xạ Thủ', mage: 'Kỹ Sư', healer: 'Bác Sĩ' },
  tt: { warrior: 'Kiếm Tu', assassin: 'Thích Khách', ranger: 'Phù Sư', mage: 'Pháp Tu', healer: 'Đan Sư' },
  sl: { warrior: 'Chiến Binh', assassin: 'Sát Thủ', ranger: 'Cung Thủ', mage: 'Pháp Sư', healer: 'Trị Liệu Sư' },
};
// per point: hp from VIT, weapon % from STR, speed % from AGI, mana and skill % from INT
const CLASS_W = {
  warrior: { prim: 'str', hp: 18, str: 0.04, agi: 0.01, mana: 6, skill: 0.03 },
  assassin: { prim: 'agi', hp: 12, str: 0.035, agi: 0.015, mana: 6, skill: 0.03 },
  ranger: { prim: 'str', hp: 12, str: 0.04, agi: 0.012, mana: 6, skill: 0.03 },
  mage: { prim: 'int', hp: 10, str: 0.03, agi: 0.01, mana: 12, skill: 0.05 },
  healer: { prim: 'int', hp: 14, str: 0.03, agi: 0.01, mana: 8, skill: 0.04 },
  none: { prim: null, hp: 12, str: 0.03, agi: 0.01, mana: 6, skill: 0.03 },
};
const clsW = () => CLASS_W[(G.v10 && G.v10.cls) || 'none'] || CLASS_W.none;
const clsName = (k, r) => (CLASS_NAME[rk(r || RL.id)] || CLASS_NAME.md)[k] || '';
const gateKey = (x, y) => Math.round(x / 16) + ',' + Math.round(y / 16);

Object.assign(G, {
  initV10(d) {
    this.v10 = Object.assign({ attr: { str: 0, vit: 0, agi: 0, int: 0 }, pts: null, mana: null, shadows: [], sid: 1, recruits: [], rid: 1, follow: {}, plants: [], sk: {}, miniDead: {}, gates: {}, gatesDone: {}, cands: {}, hello: 0 }, d || {});
    this.v10.attr = Object.assign({ str: 0, vit: 0, agi: 0, int: 0 }, this.v10.attr);
    this.manaCd = 0;
  },
  attr(k) { return (this.v10 && this.v10.attr[k]) || 0; },
  maxMana() { const P = this.player; return Math.round(60 + this.attr('int') * clsW().mana + (P ? P.level : 1) * 2); },
  // ---------- attributes ----------
  addAttr(k, n) {
    const v = this.v10, P = this.player;
    n = Math.min(n, v.pts); if (n <= 0) return;
    v.attr[k] += n; v.pts -= n;
    if (k === 'vit') { const h = clsW().hp * n; P.maxHp += h; P.hp += h; }
    if (k === 'agi') { P.maxStam += 2 * n; }
    UI.dirty = true;
  },
  // ---------- shadows ----------
  shadowCap() { return 3 + Math.floor(this.player.level / 2); },
  shStats(s) {
    const T = SH_TIER[s.tier], P = this.player, slv = 1 + Math.floor(Math.sqrt((s.kills || 0) / 2));
    return { slv, hp: Math.round(T.hp * (1 + 0.08 * P.level) * (1 + 0.08 * (slv - 1))), dmg: Math.round(T.dmg * (1 + 0.06 * P.level) * (1 + 0.06 * (slv - 1)) * (1 + this.attr('int') * 0.02)), cost: T.cost };
  },
  shadowAlly(s) { return this.allies.find(a => a.sid === s.id && !a.dead); },
  extractChance(c) {
    const T = SH_TIER[c.tier];
    return clamp(T.chance + this.attr('int') * 0.003 + (this.player.level - (c.lvl || 1)) * 0.005, 0.03, 0.75);
  },
  summonShadow(s, free) {
    const v = this.v10, P = this.player;
    if (this.shadowAlly(s)) return 'active';
    if (s.cd > this.time) return 'cd';
    const st = this.shStats(s);
    if (!free) { if (v.mana < st.cost) return 'mana'; v.mana -= st.cost; }
    const a = new Ally('shadow', P.x + R.range(-50, 50), P.y + R.range(20, 60), { img: s.img, hp: st.hp, dmg: st.dmg, r: s.r, scale: s.scale });
    a.life = 1e9; a.sid = s.id; a.upright = !!s.upright; a.sname = s.name; a.stier = s.tier;
    this.allies.push(a);
    FX.pillar(a.x, a.y, SM().col, 0.9, 20); Particles.burst(a.x, a.y, 12, SM().col, 150);
    if (SM().ghost) a.fade = 0.82;
    return 'ok';
  },
  summonAll() {
    if (!isArise()) return;
    if (typeof Net !== 'undefined' && Net.active && Net.guest) { this.toast(`Khi vào phòng của bạn bè, ${SM().army} chỉ gọi được ở thế giới của bạn.`, 'info'); return; }
    const v = this.v10, P = this.player;
    if (P.dead) return;
    if (!v.shadows.length) { this.toast(`${SM().army} còn trống. Hạ kẻ địch rồi đứng cạnh xác, nhấn [E] để thu phục.`, 'info'); return; }
    let n = 0, lack = false;
    for (const t of SH_ORDER) for (const s of v.shadows) { if (s.tier !== t) continue; const r = this.summonShadow(s); if (r === 'ok') n++; else if (r === 'mana') lack = true; }
    if (n) { UI.skillFlash(SM().skill.toUpperCase() + '!', SM().col); Sound.play('sfx_shadow', 0.8); this.toast(`${SM().icon} Đã gọi ${n} ${SM().unit}${lack ? ` — hết ${manaName()} cho số còn lại` : ''}.`, 'quest'); }
    else this.toast(lack ? `Không đủ ${manaName()} để gọi ${SM().unit}.` : `Mọi ${SM().unit} rảnh đã ở bên bạn (số còn lại đang hồi phục, làm việc hoặc khám phá).`, 'info');
  },
  recallShadow(s) { const a = this.shadowAlly(s); if (a) { a.recalled = true; a.dead = true; Particles.burst(a.x, a.y, 10, SM().col, 120); } },
  extractShadow(c) {
    const v = this.v10, T = SH_TIER[c.tier], unique = c.tier === 'boss' || c.tier === 'mini';
    if (unique && v.shadows.some(s => s.key === c.key)) { this.toast(`${c.name} đã có trong ${SM().army} — mỗi loại boss chỉ thu phục được một.`, 'info'); return; }
    if (v.shadows.length >= this.shadowCap()) { this.toast(`${SM().army} đã đầy (${v.shadows.length}/${this.shadowCap()}). Lên cấp để chứa thêm, hoặc giải phóng bớt trong Túi đồ > ${SM().army}.`, 'warn'); return; }
    if (v.mana < T.mana) { this.toast(`Cần ${T.mana} ${manaName()} để thu phục.`, 'warn'); return; }
    v.mana -= T.mana;
    const i = this.corpses.indexOf(c); if (i >= 0) this.corpses.splice(i, 1);
    UI.skillFlash(SM().skill.toUpperCase() + '!', SM().col); Sound.play('sfx_shadow', 0.9); FX.pillar(c.x, c.y, SM().col, 1, 22); Particles.burst(c.x, c.y, 16, SM().col, 160);
    if (Math.random() < this.extractChance(c)) {
      const s = { id: v.sid++, name: c.name, tier: c.tier, img: c.img, scale: c.scale || 1, r: c.r || 12, upright: !!c.upright, key: unique ? c.key : null, lvl: c.lvl || 1, kills: 0, cd: 0 };
      v.shadows.push(s);
      const P = this.player, a0 = { x: P.x, y: P.y }; P.x = c.x; P.y = c.y; this.summonShadow(s, true); P.x = a0.x; P.y = a0.y;
      this.toast(`${SM().icon} ${SM().skill} thành công: ${s.name} (${T.name}) • ${v.shadows.length}/${this.shadowCap()}`, 'quest');
    } else {
      const a = new Ally('shadow', c.x, c.y, { img: c.img, hp: T.hp * 0.6, dmg: T.dmg * (1 + this.player.level * 0.05), r: c.r, scale: c.scale });
      a.life = 30; a.upright = !!c.upright; this.allies.push(a);
      this.toast(`${SM().skill} thất bại — ${c.name} chỉ đứng dậy tạm thời rồi sẽ tan biến.`, 'warn');
    }
    UI.dirty = true;
  },
  // ---------- mana skill: the equipped Tế Đàn skill costs mana ([V] / Pháp button) ----------
  skillCost(e) { return 40 + Math.max(0, (this.v6.skills[e] || 1) - 1) * 4; },
  castMana() {
    const P = this.player, v = this.v10, e = this.v6 && this.v6.skEq;
    if (P.dead || P.car) return;
    if (e == null || e < 0 || !this.v6.skills[e]) { this.toast('Chưa trang bị kỹ năng. Nhận kỹ năng ở Tế Đàn (Y), trang bị trong Túi đồ > Kỹ năng.', 'info'); return; }
    if (this.manaCd > this.time) { this.toast(`Kỹ năng đang hồi (${Math.ceil(this.manaCd - this.time)}s).`, 'info'); return; }
    const cost = this.skillCost(e);
    if (v.mana < cost) { this.toast(`Không đủ ${manaName()} (${Math.floor(v.mana)}/${cost}).`, 'warn'); return; }
    if (P.riding) this.dismount();
    v.mana -= cost; this.manaCd = this.time + 4;
    const S = SKILLS[e], en0 = P.energy;
    UI.skillFlash(skName(S), S.col); Sound.play('sfx_skill', 0.8); this.shake(6);
    this.castV6(e);
    if (P.energy === 70 && en0 !== 70) { P.energy = en0; v.mana += cost; this.manaCd = 0; } // no target: refund
  },
  // ---------- party ----------
  maxFollow() { return Math.min(4, 1 + Math.floor(this.player.level / 10)); },
  followCount() { return this.companions.filter((c, i) => c.joined && this.v10.follow[i]).length + this.v10.recruits.filter(r => r.follow).length; },
  rcStats(r) {
    const R0 = RC_ROLE[roleOf(r)], k = 1 + 0.15 * (r.star - 1);
    return { hp: Math.round((130 + r.lvl * 14) * R0.hp * k), atk: Math.round((14 + r.lvl * 2.6) * R0.atk * k), def: Math.round((2 + r.lvl * 0.7) * R0.def), spd: R0.spd };
  },
  makeRecruit(rnd, lvl) {
    const k = rk(RL.id), N = RC_NAMES[k], g = rnd() < 0.5 ? 'm' : 'f';
    const pick = a => a[Math.floor(rnd() * a.length)];
    const role = pick(CLASS_KEYS);
    const u = rnd(), star = u < 0.5 ? 1 : u < 0.8 ? 2 : u < 0.95 ? 3 : 4;
    return { name: pick(N.fam) + ' ' + pick(N[g]), g, role, star, lvl: Math.max(1, lvl), xp: 0, sprite: Math.floor(rnd() * RL.npc.length), follow: false, hurtUntil: 0 };
  },
  rcSprite(r) { const n = `${rk(RL.id)}_cls_${roleOf(r)}_${r.g || 'm'}`; return IMG[n] ? n : RL.npc[r.sprite] || RL.npc[0]; },
  rcClass(r) { return clsName(roleOf(r)); },
  hire(spec, cost) {
    const v = this.v10, P = this.player;
    if (cost && P.gold < cost) { this.toast(`Cần ${cost} ${cur().name}.`, 'warn'); return false; }
    if (cost) P.gold -= cost;
    const r = Object.assign({}, spec, { id: v.rid++ });
    r.follow = this.followCount() < this.maxFollow();
    v.recruits.push(r);
    this.toast(`🤝 ${r.name} (${this.rcClass(r)}) đã gia nhập — ${r.follow ? 'đang đi theo bạn' : 'đã về căn cứ (đội đi theo đã đủ)'}. Quản lý ở Túi đồ > Đồng đội.`, 'love');
    Sound.play('sfx_heart', 0.5);
    UI.dirty = true;
    return true;
  },
  setFollow(kind, i, on) {
    const v = this.v10;
    if (on && this.followCount() >= this.maxFollow()) { this.toast(`Chỉ dẫn theo được ${this.maxFollow()} người (cấp 10, 20, 30 mở thêm chỗ).`, 'warn'); return; }
    if (kind === 'c') v.follow[i] = !!on;
    else { const r = v.recruits.find(x => x.id === i); if (r) { r.follow = !!on; const a = this.allies.find(x => x.rc === r && !x.dead); if (a) a.speak(G.rcLine(r, on ? 'follow' : 'home'), 3); } }
    this.partySync(true);
  },
  // spawn / remove companions and recruits to match their orders
  partySync(now) {
    const P = this.player, v = this.v10, bp = this.v5 && this.v5.basePos;
    const nearBase = !!(bp && World.mode === 'over' && dist(P.x, P.y, bp.x, bp.y) < 1600);
    v.recruits.forEach((r, i) => {
      const hurt = r.hurtUntil > this.time;
      const want = r.follow && !hurt ? 'follow' : nearBase ? 'home' : 'none';
      let a = this.allies.find(x => x.rc && x.rc.id === r.id && !x.dead);
      if (a) a.rc = r;
      if (a && ((want === 'follow' && a.home) || (want === 'home' && !a.home) || want === 'none')) { a.dead = true; a = null; }
      if (!a && want !== 'none') {
        const home = want === 'home', hx = home ? bp.x - 220 + (i % 6) * 80 : P.x + R.range(-50, 50), hy = home ? bp.y + 230 + Math.floor(i / 6) * 50 : P.y + R.range(20, 60);
        const st = this.rcStats(r);
        a = new Ally('merc', hx, hy, { img: G.rcSprite(r) });
        a.rc = r; a.maxHp = a.hp = st.hp; a.dmg = st.atk; a.name = r.name;
        if (home) { a.home = { x: hx, y: hy }; a.hp = a.maxHp; } else a.speak(G.rcLine(r, 'follow'), 2.5);
        this.allies.push(a);
      }
    });
    if (now) this.allies = this.allies.filter(a => !a.dead);
  },
  // shelters keep a few hunters for hire; the roster changes every 3 days
  shelterCands(sh) {
    const v = this.v10, day3 = Math.floor((this.day - 1) / 3);
    let c = v.cands[sh.key];
    if (!c || c.d !== day3) {
      const rnd = mulberry32(((h3(sh.rx, sh.ry, 7300 + day3) * 1e9) | 0) ^ (this.seed | 0));
      const lvl = World.levelAt(sh.x, sh.y);
      c = v.cands[sh.key] = { d: day3, list: [0, 1, 2].map(() => this.makeRecruit(rnd, lvl + Math.floor(rnd() * 3) - 1)), taken: [] };
    }
    return c;
  },
  candCost(r) { return Math.round((40 + r.lvl * 12) * (0.7 + r.star * 0.4)); },
  candMenu(a) {
    const r = a.cand, st = this.rcStats(r), cost = this.candCost(r);
    UI.menuDialog({
      name: `${r.name} • ${this.rcClass(r)} ${'★'.repeat(r.star)}`, portrait: null,
      text: `${R.pick(RC_LINES.hello)}\nCấp ${r.lvl} • Máu ${st.hp} • Công ${st.atk} • Thủ ${st.def} • Tốc ${st.spd}\nThuê: ${cost} ${cur().name} (bạn có ${this.player.gold}).`,
      options: [
        { text: `Chiêu mộ (${cost} ${cur().name})`, act: () => { if (this.hire(r, cost)) { a.dead = true; const c = this.v10.cands[a.ckey]; if (c) c.taken.push(a.ci); } } },
        { text: 'Để sau', act: () => {} },
      ],
    });
  },
  // ---------- teleport destinations ----------
  tpAll() {
    if (World.mode !== 'over') return [];
    const v = this.v10, out = this.tpList().map(t => Object.assign({ icon: t.kind === 'base' ? (typeof baseIconHtml === 'function' ? baseIconHtml() : '⌂') : t.kind === 'statue' ? '✦' : '◆', col: t.kind === 'base' ? '#6dff7a' : t.kind === 'statue' ? '#ffe6a0' : '#7dd8ff' }, t));
    for (const k in v.gates) {
      const g = v.gates[k];
      if (v.gatesDone[gateKey(g.x, g.y)]) continue;
      const [rx, ry] = World.regionOf(Math.floor(g.x / SBPX), Math.floor(g.y / SBPX));
      if (this.regionLocked && this.regionLocked(rx, ry)) continue;
      out.push({ x: g.x, y: g.y + 80, gx: g.x, gy: g.y, name: `Cổng hạng ${g.rank}${g.story ? ' (cốt truyện)' : ''} • ${World.regionInfo(rx, ry).name}`, kind: 'gate', icon: '⛩', col: g.story ? '#ffcf3a' : RANK_COL[g.rank] || '#ccc', rank: g.rank });
    }
    if (this.v6) for (const k in this.v6.sh) {
      const [rx, ry] = k.split(',').map(Number), s = World.v6Sites(rx, ry);
      if (!s.shelter) continue;
      const p = World.siteXY(s.shelter);
      out.push({ x: p.x, y: p.y + 90, name: this.shelterName(rx, ry), kind: 'shelter', icon: '⛺', col: '#6dff7a' });
    }
    return out;
  },
  scanGates(sb) {
    if (!this.v10 || !sb || !sb.props || World.mode !== 'over') return;
    for (const p of sb.props) if (p.kind === 'gate' && p.data && !this.v10.gates[sb.key]) this.v10.gates[sb.key] = { x: Math.round(p.x), y: Math.round(p.y), rank: p.data.rank, story: !!p.data.story };
  },
  // ---------- per-frame ----------
  v10Tick(dt) {
    const P = this.player, v = this.v10; if (!v || !P) return;
    const mm = this.maxMana();
    if (v.mana == null) v.mana = mm;
    const fast = this.atBase && this.atBase() ? 2 : 1;
    v.mana = Math.min(mm, v.mana + dt * (2 + this.attr('int') * 0.1 + P.level * 0.04) * fast);
    if (UI.dialogOpen || G.state !== 'playing') return;
    if (Input.hit('KeyV')) this.castMana();
    if (Input.hit('KeyK')) this.summonAll();
    // in co-op the host simulates every ally, so a guest keeps their party and shadows at home
    if (typeof Net !== 'undefined' && Net.active && Net.guest) return;
    if (this.frame % 20 === 0) this.partySync();
    if (this.frame % 30 === 0 && World.mode === 'over') {
      const sh = this.shelterHere && this.shelterHere();
      if (sh) {
        const c = this.shelterCands(sh);
        c.list.forEach((r, i) => {
          if (c.taken.includes(i) || this.allies.some(a => a.ckey === sh.key && a.ci === i && !a.dead)) return;
          const a = new Ally('cand', sh.x - 120 + i * 120, sh.y + 120, { img: this.rcSprite(r) });
          a.home = { x: a.x, y: a.y }; a.cand = r; a.ckey = sh.key; a.ci = i; a.name = r.name; a.sayT = R.range(3, 12);
          this.allies.push(a);
        });
      }
      for (const a of this.allies) if (a.kind === 'cand' && dist(a.x, a.y, P.x, P.y) > 1800) a.dead = true;
    }
    if (this.frame % 120 === 0) for (const sb of World.sbs.values()) this.scanGates(sb);
  },
});

// ---------- hooks ----------
(function () {
  // state lifecycle
  const ng = G.newGame;
  G.newGame = function (...a) { this.initV10(null); return ng.apply(this, a); };
  const ld = G.load;
  G.load = function (...a) {
    let d = null; try { d = JSON.parse(localStorage.getItem('tt_save_v2')); } catch (e) {}
    this.initV10(d && d.v10);
    return ld.apply(this, a);
  };
  if (typeof Net !== 'undefined') {
    const lch = Net.loadChar;
    Net.loadChar = function (realm) { const c = lch.call(this, realm); G.initV10(c.v10 || null); return c; };
  }
  const st = G.start;
  G.start = function (isNew) {
    st.call(this, isNew);
    const v = this.v10, P = this.player;
    if (v.pts == null) v.pts = (P.level - 1) * PTS_PER_LVL;
    if (v.mana == null) v.mana = this.maxMana();
    UI.v10Hud();
    if (!v.hello) {
      v.hello = 1;
      setTimeout(() => this.toast(`✨ Mới: thanh ${manaName()}, điểm tiềm năng khi lên cấp (Túi đồ > Nhân vật), đồng đội chiêu mộ ở khu trú ẩn ⛺, Cổng hiện trên bản đồ và dịch chuyển được.${isArise() ? ' Đứng cạnh xác kẻ địch, nhấn [E] để thu phục; [K] gọi đội quân.' : ''}`, 'quest'), isNew ? 20000 : 4000);
    }
  };
  const tick = G.v5Tick;
  G.v5Tick = function (dt) { tick.call(this, dt); this.v10Tick(dt); };

  // points on level up
  const ax = G.addXp;
  G.addXp = function (n) {
    const P = this.player, l0 = P.level;
    ax.call(this, n);
    if (this.v10 && P.level > l0) {
      const g = (P.level - l0) * PTS_PER_LVL;
      this.v10.pts = (this.v10.pts || 0) + g;
      setTimeout(() => this.toast(`+${g} điểm tiềm năng — cộng vào chỉ số ở Túi đồ > Nhân vật.`, 'good'), 1200);
    }
  };
  // attribute effects
  const he = G.hitEnemy;
  G.hitEnemy = function (z, dmg, kx, ky, src, ang, wp) {
    if (this.v10) {
      if (src === 'gun' || src === 'melee') dmg *= 1 + this.attr('str') * clsW().str;
      else if (src === 'skill') dmg *= 1 + this.attr('int') * clsW().skill;
    }
    return he.call(this, z, dmg, kx, ky, src, ang, wp);
  };
  const sm = Player.prototype.speedMul;
  Player.prototype.speedMul = function () { return sm.call(this) * (1 + Math.min(0.6, G.attr('agi') * clsW().agi)); };

  // kills: corpse details for shadow extraction, shadow / recruit growth, mini-boss respawn timers
  const ke = G.killEnemy;
  G.killEnemy = function (z, src) {
    const n0 = this.corpses.length;
    ke.call(this, z, src);
    const v = this.v10; if (!v) return;
    const c = this.corpses[this.corpses.length - 1];
    if (c && (this.corpses.length !== n0 || (c.x === z.x && c.y === z.y))) {
      c.name = z.name; c.upright = !!z.upright;
      c.tier = z.boss ? (z.mini && !z.lord ? 'mini' : 'boss') : z.elite ? 'elite' : 'normal';
      c.key = 'b:' + c.tier + ':' + z.img; // one shadow per boss kind (modifiers like Cuồng Bạo / Khổng Lồ don't count)
    }
    if (z.boss && z.mini && !z.lord && z.gid && World.mode === 'over') v.miniDead[z.gid] = this.time + MINI_RESPAWN;
    if (src === 'ally' && this._atk) {
      const a = this._atk;
      if (a.sid) { const s = v.shadows.find(q => q.id === a.sid); if (s) s.kills = (s.kills || 0) + 1; }
    }
    // followers learn from every fight
    for (const a of this.allies) if (a.kind === 'merc' && !a.home && !a.dead && a.rc) {
      const r = a.rc; r.xp += z.xp * 0.35;
      const need = 40 + r.lvl * 30;
      if (r.xp >= need) { r.xp -= need; r.lvl++; const st = this.rcStats(r); a.maxHp = st.hp; a.hp = st.hp; a.dmg = st.atk; a.speak(`Lên cấp ${r.lvl}!`, 2.5); FX.pillar(a.x, a.y, '#ffd65a', 0.7, 18); }
    }
  };
  // mini-bosses come back after a while; region lords and story bosses never do
  const pp = G.processPending;
  G.processPending = function () {
    const v = this.v10;
    if (v && World.pending.length) {
      for (let i = World.pending.length - 1; i >= 0; i--) {
        const s = World.pending[i];
        if (s.kind !== 'boss' || !s.mini || s.lord || s.dungeon) continue;
        if (!s.gid) s.gid = 'M' + (s.seed || (Math.round(s.x) + ':' + Math.round(s.y)));
        if ((v.miniDead[s.gid] || 0) > this.time) World.pending.splice(i, 1);
      }
    }
    return pp.call(this);
  };

  // gates seen on the minimap / map are remembered for fast travel
  const bm = World.buildMini;
  World.buildMini = function (sb) { const r = bm.call(this, sb); G.scanGates(sb); return r; };
  const xd = G.exitDungeon;
  G.exitDungeon = function (...a) {
    if (World.dg && World.dg.cleared && this.gateProp && this.v10) this.v10.gatesDone[gateKey(this.gateProp.x, this.gateProp.y)] = 1;
    return xd.apply(this, a);
  };

  // Q stays the realm ultimate; the Tế Đàn skill moved to [V] (mana)
  const cs = G.castSkill;
  G.castSkill = function () {
    const v6 = this.v6, e = v6 && v6.skEq;
    if (v6) v6.skEq = -1;
    try { return cs.call(this); } finally { if (v6) v6.skEq = e; }
  };
  G.skillName = function () { return RL.skill.name; };

  // interactions: corpses (shadow extraction) and hunters for hire
  const fi = G.findInteract;
  G.findInteract = function () {
    const best = fi.call(this), P = this.player;
    // a fresh corpse wins over whatever is not clearly closer (boss chests drop right on the corpse)
    if (isArise() && this.v10 && !(typeof Net !== 'undefined' && Net.active && Net.guest)) {
      const o = best && (best.prop || best.ally), db = o ? dist(o.x, o.y, P.x, P.y) : 1e9;
      let bc = null, bd = 60;
      for (const c of this.corpses) { if (!c.tier || this.time - c.t > 120 || (this._ixSkip && this._ixSkip.has(c))) continue; const d = dist(c.x, c.y, P.x, P.y); if (d < bd) { bd = d; bc = c; } }
      if (bc && (!best || bd <= db + 8)) { const T = SH_TIER[bc.tier]; return { corpse: bc, kind: 'corpse', label: `${SM().skill} — thu phục ${bc.name} (${T.name}) • ${Math.round(this.extractChance(bc) * 100)}% • ${T.mana} ${manaName()}` }; }
    }
    const o = best && (best.prop || best.ally), db = o ? dist(o.x, o.y, P.x, P.y) : best ? 0 : 1e9;
    for (const a of this.allies) if (a.kind === 'cand' && !a.dead && !(this._ixSkip && this._ixSkip.has(a)) && dist(a.x, a.y, P.x, P.y) < Math.min(55, db)) return { ally: a, kind: 'cand', label: `Trò chuyện: ${a.cand.name} (${this.rcClass(a.cand)} ${'★'.repeat(a.cand.star)})` };
    return best;
  };
  const ia = G.interact;
  G.interact = function (it) {
    if (it && it.kind === 'corpse') return this.extractShadow(it.corpse);
    if (it && it.kind === 'cand') return this.candMenu(it.ally);
    return ia.call(this, it);
  };
  // rescued survivors sometimes ask to join
  const rc = G.rescueCiv;
  G.rescueCiv = function (a) {
    rc.call(this, a);
    if (!this.v10 || Math.random() > 0.35) return;
    const spec = this.makeRecruit(Math.random, World.levelAt(a.x, a.y));
    setTimeout(() => UI.menuDialog({
      name: spec.name, portrait: null,
      text: `Cảm ơn đã cứu tôi! Tôi là ${this.rcClass(spec)} ${'★'.repeat(spec.star)}, cấp ${spec.lvl}. Cho tôi theo bạn nhé?`,
      options: [{ text: 'Nhận vào đội', act: () => this.hire(spec, 0) }, { text: 'Không cần', act: () => {} }],
    }), 900);
  };

  // ---------- allies: hired hunters, saved shadows, hunters for hire ----------
  const au = Ally.prototype.update;
  Ally.prototype.update = function (dt) {
    if (this.kind === 'merc') return mercUpdate(this, dt);
    if (this.kind === 'cand') {
      const P = G.player; this.hurtT -= dt;
      if (this.say) { this.say.t -= dt; if (this.say.t <= 0) this.say = null; }
      this.angle += angDiff(this.angle, Math.atan2(P.y - this.y, P.x - this.x)) * Math.min(1, dt * 3);
      this.sayT -= dt; if (this.sayT <= 0) { this.sayT = R.range(10, 20); if (dist(this.x, this.y, P.x, P.y) < 300) this.speak(R.pick(RC_LINES.hello), 3); }
      return;
    }
    if (this.sid) { G._atk = this; try { return au.call(this, dt); } finally { G._atk = null; } }
    return au.call(this, dt);
  };
  const ah = Ally.prototype.hurt;
  Ally.prototype.hurt = function (d) {
    if (this.kind === 'cand' || (this.kind === 'merc' && this.home)) return;
    if (this.kind === 'merc') {
      if (this.dead) return;
      const st = G.rcStats(this.rc);
      this.hp -= d * 100 / (100 + st.def * 3); this.hurtT = 0.2;
      if (Math.random() < 0.1) this.speak(G.rcLine(this.rc, 'hurt'), 2);
      if (this.hp <= 0) {
        this.dead = true; this.rc.hurtUntil = G.time + 180;
        Particles.burst(this.x, this.y, 12, '#ff6a6a', 120);
        G.toast(`🩸 ${this.rc.name} trọng thương — tự về căn cứ dưỡng thương 3 phút.`, 'warn');
      }
      return;
    }
    ah.call(this, d);
    if (this.sid && this.dead && !this.recalled && !this.gone) {
      this.gone = true;
      const s = G.v10.shadows.find(q => q.id === this.sid);
      if (s) { s.cd = G.time + SHADOW_CD; G.toast(`${SM().icon} ${s.name} tan rã — hồi phục sau ${SHADOW_CD}s.`, 'info'); }
    }
  };
  const ad = Ally.prototype.draw;
  Ally.prototype.draw = function (ctx) {
    if (this.kind === 'shadow' && this.upright) {
      const im = G.shadowOf(this.img); if (!im) return;
      const w = im.width / 2 * this.scale, h = im.height / 2 * this.scale, fl = Math.cos(this.angle) < 0 ? -1 : 1;
      ctx.globalAlpha = Math.max(0, this.fade);
      ctx.save(); ctx.translate(this.x + Math.cos(this.angle) * this.lunge * 6, this.y); ctx.scale(fl, 1);
      ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore(); ctx.globalAlpha = 1;
      if (this.hp < this.maxHp) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(this.x - 16, this.y - h / 2 - 6, 32, 3); ctx.fillStyle = SM().col; ctx.fillRect(this.x - 16, this.y - h / 2 - 6, 32 * Math.max(0, this.hp / this.maxHp), 3); }
    } else ad.call(this, ctx);
    if (this.kind === 'merc' || this.kind === 'cand') {
      const r = this.rc || this.cand;
      ctx.font = '8px VT323, monospace'; ctx.textAlign = 'center'; ctx.fillStyle = this.kind === 'cand' ? '#ffe28a' : '#9fe8ff';
      ctx.fillText(`${this.kind === 'cand' ? '? ' : ''}${r.name} • Lv${r.lvl}`, this.x, this.y - 23);
    }
  };

})();

function mercUpdate(a, dt) {
  const P = G.player, r = a.rc, st = G.rcStats(r), role = roleOf(r), melee = role === 'warrior' || role === 'assassin';
  a.hurtT -= dt; a.cool -= dt;
  if (a.say) { a.say.t -= dt; if (a.say.t <= 0) a.say = null; }
  if (a.home) {
    if (dist(a.x, a.y, P.x, P.y) > 1800) return;
    a.wt = (a.wt || 0) - dt;
    if (a.wt <= 0) { a.wt = R.range(2, 6); const g = R.range(0, TAU); a.goal = { x: a.home.x + Math.cos(g) * R.range(0, 70), y: a.home.y + Math.sin(g) * R.range(0, 50) }; }
    if (a.goal) { const dx = a.goal.x - a.x, dy = a.goal.y - a.y, d = Math.hypot(dx, dy); if (d > 6) { a.x += dx / d * 40 * dt; a.y += dy / d * 40 * dt; a.angle = Math.atan2(dy, dx); a.walkT += dt * 5; } }
    a.hp = a.maxHp;
    return;
  }
  const lead = P.car || P, dp = dist(a.x, a.y, lead.x, lead.y);
  if (dp > 700) { a.x = lead.x - 40 + R.range(-20, 20); a.y = lead.y + 30; }
  const tgt = a.nearestEnemy(melee ? 380 : 340);
  let mx = 0, my = 0, speed = st.spd;
  const follow = () => { if (dp > 85) { mx = (lead.x - a.x) / dp; my = (lead.y - a.y) / dp; speed = dp > 220 ? st.spd + 60 : st.spd; } };
  if (tgt) {
    const d = dist(a.x, a.y, tgt.x, tgt.y), ang = Math.atan2(tgt.y - a.y, tgt.x - a.x);
    a.angle = ang;
    if (melee) {
      if (d > a.r + tgt.r + 6) { mx = (tgt.x - a.x) / d; my = (tgt.y - a.y) / d; }
      else if (a.cool <= 0) {
        a.cool = role === 'assassin' ? 0.42 : 0.6; a.lunge = 1;
        const crit = role === 'assassin' && Math.random() < 0.3;
        G._atk = a; G.hitEnemy(tgt, st.atk * (crit ? 2 : 1), Math.cos(ang) * 110, Math.sin(ang) * 110, 'ally', ang); G._atk = null;
        FX.slash(a.x, a.y, ang, 30, 1.5, 'rgba(255,230,180,0.85)', 0.14); Sound.at('sfx_blade_hit', a.x, a.y, 0.25, 1.1);
      }
    } else {
      follow();
      if (a.cool <= 0) {
        if (role === 'mage') {
          a.cool = 1.3;
          FX.bolt(a.x, a.y, tgt.x, tgt.y, RL.projColor || '#9fd8ff'); FX.ring(tgt.x, tgt.y, 6, 70, RL.projColor || '#9fd8ff', 0.35, 5);
          for (const z of G.zgrid.query(tgt.x, tgt.y, 70)) if (!z.dead && dist(z.x, z.y, tgt.x, tgt.y) < 70) G.hitEnemy(z, st.atk, 0, 0, 'ally');
          Sound.at('sfx_electric', a.x, a.y, 0.2, 1.3);
        } else {
          a.cool = role === 'healer' ? 1.1 : 0.5;
          const W = RL.weapons.r1;
          Bullets.fire(a.x + Math.cos(ang) * 14, a.y + Math.sin(ang) * 14, ang + R.range(-0.05, 0.05), { speed: 900, knock: 40, proj: W.proj || 'bullet', color: W.color, homing: W.homing }, st.atk, { ally: true, src: 'ally' });
          Sound.at(W.sfx, a.x, a.y, 0.18, 1.15);
        }
      }
    }
    if (Math.random() < dt * 0.04) a.speak(G.rcLine(a.rc, 'fight'), 2);
  } else { follow(); if (Math.hypot(a.vx, a.vy) > 10) a.angle = Math.atan2(a.vy, a.vx); }
  // healers mend the player and the party
  if (role === 'healer') {
    a.healT = (a.healT || 0) - dt;
    if (a.healT <= 0) {
      a.healT = 2.2;
      let best = P.hp < P.maxHp * 0.92 && !P.dead ? P : null, bk = best ? P.hp / P.maxHp : 1;
      for (const o of G.allies) if ((o.kind === 'merc' || o.kind === 'comp') && !o.dead && !o.home && o.hp < o.maxHp && o.hp / o.maxHp < bk) { best = o; bk = o.hp / o.maxHp; }
      if (best && dist(best.x, best.y, a.x, a.y) < 360) {
        const amt = st.atk * 1.4;
        best.hp = Math.min(best.maxHp, best.hp + amt);
        FX.pillar(best.x, best.y, '#6dff7a', 0.5, 14); Floaters.add(best.x, best.y - 18, '+' + Math.round(amt), '#6dff7a', 8);
      }
    }
  }
  a.vx = lerp(a.vx, mx * speed, Math.min(1, dt * 6)); a.vy = lerp(a.vy, my * speed, Math.min(1, dt * 6));
  a.x += a.vx * dt; a.y += a.vy * dt;
  for (const o of G.allies) if (o !== a && !o.downed && !o.home) { const ox = a.x - o.x, oy = a.y - o.y, d = Math.hypot(ox, oy); if (d < 22 && d > 0.1) { a.x += ox / d * (22 - d) * 0.5; a.y += oy / d * (22 - d) * 0.5; } }
  World.collideCircle(a, a.r);
  a.walkT += dt * Math.hypot(a.vx, a.vy) * 0.08;
  a.lunge = Math.max(0, a.lunge - dt * 5);
  if (a.hp < a.maxHp) a.hp = Math.min(a.maxHp, a.hp + dt * 2);
}
