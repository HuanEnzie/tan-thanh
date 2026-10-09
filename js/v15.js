// ===== v15: grades (phẩm cấp) for talents and breakthroughs, innate talents + flaws from the dice, summon controls =====
const GRADE = [
  { k: 0, mult: 0.7, w: 34, col: '#b8b8b8' }, { k: 1, mult: 1, w: 36, col: '#6ee06e' }, { k: 2, mult: 1.4, w: 20, col: '#4da6ff' },
  { k: 3, mult: 1.9, w: 8, col: '#b46bff' }, { k: 4, mult: 2.6, w: 2, col: '#ffd65a' },
];
const GRADE_NAME = {
  md: ['Tồi', 'Khá', 'Tốt', 'Xuất sắc', 'Huyền thoại'], sl: ['Tồi', 'Khá', 'Tốt', 'Xuất sắc', 'Huyền thoại'],
  tt: ['Hạ phẩm', 'Trung phẩm', 'Thượng phẩm', 'Cực phẩm', 'Thiên phẩm'],
};
const gradeName = (g, r) => (GRADE_NAME[r || R3()] || GRADE_NAME.md)[g] || '';
// luck (perk power) leans the roll towards the better grades
function rollGrade(luck = 0, shift = 0, rnd = Math.random) {
  const f = 1 + 0.3 * Math.max(-1, luck);
  const w = GRADE.map((g, i) => g.w * Math.pow(f, i) * (shift ? Math.pow(1 + shift, i) : 1));
  let r = rnd() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; }
  return 1;
}
const gradeTag = g => `<span class="gtag" style="color:${GRADE[g].col};border-color:${GRADE[g].col}">${esc(gradeName(g))}</span>`;
const heroLuck = () => { const P = G.player; return P ? (P.perks.luck || 0) + 0.3 * (P.perks.xp > 0 ? 0 : 0) : 0; };

// ================= innate talents and flaws =================
// perk powers granted per unit of grade multiplier, extra attribute points, and a readable effect line
const TALENT_FX = {
  bone: { perks: { hp: 1, armor: 0.6 }, attr: { vit: 2 }, txt: m => `+${Math.round(25 * m)} máu tối đa, giảm ${Math.round((1 - Math.pow(0.88, 0.6 * m)) * 100)}% sát thương nhận` },
  swift: { perks: { speed: 1, dodge: 1 }, attr: { agi: 2 }, txt: m => `+${Math.round(8 * m)}% tốc chạy, +${Math.round(5 * m)}% né đòn` },
  eye: { perks: { crit: 1, gun: 0.8 }, attr: { agi: 1 }, txt: m => `+${Math.round(10 * m)}% chí mạng, +${Math.round(12 * m)}% sát thương tầm xa` },
  might: { perks: { melee: 1 }, attr: { str: 2 }, txt: m => `+${Math.round(30 * m)}% sát thương cận chiến, +2 sức mạnh` },
  sage: { perks: { xp: 2 }, attr: { int: 1 }, txt: m => `+${Math.round(24 * m)}% kinh nghiệm` },
  mana: { perks: { mana: 2 }, attr: { int: 2 }, txt: m => `+${Math.round(40 * m)}% mana tối đa, hồi nhanh hơn` },
  fortune: { perks: { luck: 1.2, gold: 1 }, txt: m => `+${Math.round(42 * m)}% cơ hội rơi đồ, +${Math.round(25 * m)}% tiền` },
  regen: { perks: { regen: 2 }, attr: { vit: 1 }, txt: m => `hồi +${(1.6 * m).toFixed(1)} máu/giây khi yên ổn` },
  shadow: { perks: { summon: 1.2, extractor: 2 }, attr: { int: 1 }, txt: m => `+${Math.round(12 * m)}% sức mạnh quân triệu hồi, +${Math.round(12 * m)}% tỉ lệ thu phục` },
  ward: { perks: { second: 1, armor: 0.5 }, txt: m => `thoát chết 1 lần mỗi 150s (hồi ${Math.round(35 * m)}% máu)` },
  trade: { perks: { gold: 2.5, luck: 0.5 }, txt: m => `+${Math.round(62 * m)}% tiền kiếm được` },
  craft: { perks: { wood: 1.5, medic: 1.2, forager: 1 }, txt: m => `thuốc hồi +${Math.round(48 * m)}%, thêm gỗ, hút đồ xa +${Math.round(40 * m)}%` },
  lead: { perks: { leader: 1.5, charm: 1 }, txt: m => `đồng đội +${Math.round(60 * m)}% sức mạnh, kết thân nhanh hơn` },
  slayer: { perks: { slayer: 1.5, execute: 0.8 }, txt: m => `+${Math.round(30 * m)}% sát thương lên tinh anh/boss, kết liễu mạnh hơn` },
  fury: { perks: { vamp: 1.5, combo: 1.2 }, txt: m => `hút máu khi đánh cận chiến, combo ≥10 +${Math.round(18 * m)}% sát thương` },
  mind: { perks: { siphon: 1.5, mana: 0.8, regen: 0.5 }, txt: m => `hạ địch hồi ${Math.round(4.5 * m)} mana, tĩnh tâm hồi máu` },
};
const FLAW_FX = {
  frail: { hpMul: 0.12, perks: { armor: -0.6 }, txt: m => `−${Math.round(12 * m)}% máu tối đa, nhận thêm sát thương` },
  slow: { perks: { speed: -0.8 }, txt: m => `−${Math.round(6.4 * m)}% tốc chạy` },
  glutton: { perks: { belly: -1.4 }, txt: m => `đói khát nhanh hơn ${Math.round((Math.pow(1 / 0.75, 1.4 * m) - 1) * 100)}%` },
  unlucky: { perks: { luck: -1.2 }, txt: m => `đồ rơi ít và kém hơn ${Math.round(42 * m)}%` },
  clumsy: { perks: { reload: -1.2, gun: -0.8 }, txt: m => `nạp chậm hơn, −${Math.round(12 * m)}% sát thương tầm xa` },
  weak: { perks: { melee: -1.2 }, txt: m => `−${Math.round(36 * m)}% sát thương cận chiến` },
  dull: { perks: { xp: -1.5 }, txt: m => `−${Math.round(18 * m)}% kinh nghiệm` },
  dark: { night: 0.15, txt: m => `ban đêm gây ít hơn ${Math.round(15 * m)}% sát thương` },
  poor: { perks: { gold: -1.2 }, txt: m => `−${Math.round(30 * m)}% tiền kiếm được` },
  leak: { perks: { mana: -1.5 }, txt: m => `−${Math.round(30 * m)}% mana tối đa` },
  feud: { enemy: true, txt: () => 'một kẻ thù sẽ truy lùng bạn trong thế giới này' },
  lone: { perks: { charm: -0.6 }, txt: m => `kết thân chậm hơn ${Math.round(60 * Math.min(1, m) )}%` },
};
const FLAW_SEV = ['Nhẹ', 'Vừa', 'Nặng', 'Rất nặng', 'Nguyền rủa'];
const NEG_FLOOR = { melee: -2.2, gun: -3, reload: -3, speed: -3.2, armor: -2.2, belly: -3.5, xp: -4, mana: -3, gold: -3, luck: -3, charm: -0.95 };
const NAME_FALLBACK = {
  bone: 'Căn Cốt Vững Chãi', swift: 'Thân Nhẹ Như Yến', eye: 'Nhãn Lực Tinh Tường', might: 'Thần Lực Bẩm Sinh', sage: 'Ngộ Tính Hơn Người', mana: 'Nguồn Năng Lượng Dồi Dào', fortune: 'Vận May Chiếu Mệnh', regen: 'Thân Thể Tự Chữa',
  shadow: 'Bóng Tối Đồng Hành', ward: 'Mệnh Cứng', trade: 'Tài Buôn Bẩm Sinh', craft: 'Đôi Tay Khéo Léo', lead: 'Phong Thái Thủ Lĩnh', slayer: 'Khắc Tinh Kẻ Mạnh', fury: 'Cuồng Nộ', mind: 'Tâm Tĩnh Như Nước',
  frail: 'Thể Chất Yếu Ớt', slow: 'Chân Chậm', glutton: 'Háu Ăn', unlucky: 'Vận Đen', clumsy: 'Vụng Về', weak: 'Tay Yếu', dull: 'Chậm Hiểu', dark: 'Sợ Bóng Tối', poor: 'Nghèo Rớt', leak: 'Mạch Tắc Nghẽn', feud: 'Mang Thù Oán', lone: 'Cô Độc',
};
// the words (name / tag / story) come from the generated content pack
function talentText(kind, key, v) {
  const C = typeof CONTENT15 !== 'undefined' && CONTENT15.talents && CONTENT15.talents[R3()];
  const list = C && C[key];
  const e = list && list[(v || 0) % list.length];
  return e ? { name: e.name, tag: e.tag || '', story: e.story || '' } : { name: NAME_FALLBACK[key] || key, tag: '', story: '' };
}
const APT_PTS = [6, 8, 11, 14, 18];
const APT_TITLE = { md: ['Thể trạng kém', 'Bình thường', 'Khỏe mạnh', 'Thể chất vượt trội', 'Sinh ra để sống sót'], tt: ['Căn cốt hạ đẳng', 'Căn cốt trung đẳng', 'Căn cốt thượng đẳng', 'Căn cốt cực phẩm', 'Thiên linh căn'], sl: ['Tiềm năng thấp', 'Tiềm năng trung bình', 'Tiềm năng cao', 'Tiềm năng kiệt xuất', 'Tiềm năng cấp S'] };
const aptName = g => (APT_TITLE[R3()] || APT_TITLE.md)[g];

Object.assign(G, {
  // one throw of the dice: aptitude grade, 4 attribute rolls, talents, flaws
  destinyRoll(cls, keep = {}) {
    const rnd = Math.random, pick = a => a[Math.floor(rnd() * a.length)];
    const d = { apt: keep.apt != null ? keep.apt : rollGrade(0, 0), stats: null, talents: keep.talents || null, flaws: keep.flaws || null, origin: keep.origin != null ? keep.origin : Math.floor(rnd() * 100) };
    // attribute points: the aptitude decides the pool, the class decides where most of it goes
    if (!keep.stats) {
      const prim = (CLASS_W[cls] || CLASS_W.none).prim, w = { str: 1, vit: 1, agi: 1, int: 1 };
      if (prim) w[prim] += 1.6; for (const k of (CLASS_INFO[cls] ? CLASS_INFO[cls].build : [])) w[k] += 0.7;
      const s = { str: 0, vit: 0, agi: 0, int: 0 }, keys = Object.keys(w), tot = keys.reduce((a, k) => a + w[k], 0);
      for (let i = 0; i < APT_PTS[d.apt]; i++) { let r = rnd() * tot; for (const k of keys) { r -= w[k]; if (r <= 0) { s[k]++; break; } } }
      d.stats = s;
    } else d.stats = keep.stats;
    if (!d.talents) {
      const n = rnd() < 0.42 ? 2 : 1, ks = Object.keys(TALENT_FX); d.talents = [];
      while (d.talents.length < n) { const k = pick(ks); if (!d.talents.some(t => t.key === k)) d.talents.push({ key: k, v: Math.floor(rnd() * 3), g: rollGrade(0, 0) }); }
    }
    if (!d.flaws) {
      const u = rnd(), n = u < 0.34 ? 0 : u < 0.86 ? 1 : 2, ks = Object.keys(FLAW_FX); d.flaws = [];
      while (d.flaws.length < n) { const k = pick(ks); if (!d.flaws.some(t => t.key === k)) d.flaws.push({ key: k, v: Math.floor(rnd() * 3), g: Math.min(3, rollGrade(-0.6, 0)) }); }
      // a flaw is paid back with extra points
    }
    d.bonus = d.flaws.length * 2;
    return d;
  },
  destinyOrigin(d) {
    const C = typeof CONTENT15 !== 'undefined' && CONTENT15.backstory && CONTENT15.backstory[R3()];
    const L = (LORE[this._crRealm || (RL && RL.id) || 'md'] || LORE.md).names;
    const fill = s => String(s).replace(/\{place\}/g, L ? L.places[d.origin % L.places.length] : 'một nơi xa').replace(/\{faction\}/g, L ? L.factions[(d.origin >> 3) % L.factions.length] : 'một phe');
    return C && C.hero && C.hero.length ? fill(C.hero[d.origin % C.hero.length]) : 'Bạn chỉ nhớ mang máng quá khứ của mình — mọi thứ bắt đầu từ ngày tận thế ập đến.';
  },
  // innate effects → perk powers (negative allowed) + attribute points
  applyDestiny(d) {
    const P = this.player, v = this.v10;
    v.hero = Object.assign(v.hero || {}, { look: d.look || (v.hero && v.hero.look), apt: d.apt, talents: d.talents, flaws: d.flaws, origin: d.origin, stats: d.stats, bonus: d.bonus });
    const add = {}; let hpMul = 1;
    for (const t of d.talents) { const F = TALENT_FX[t.key], m = GRADE[t.g].mult; if (!F) continue; for (const k in F.perks) add[k] = (add[k] || 0) + F.perks[k] * m; }
    for (const t of d.flaws) { const F = FLAW_FX[t.key], m = GRADE[Math.min(4, t.g)].mult; if (!F) continue; for (const k in (F.perks || {})) add[k] = (add[k] || 0) + F.perks[k] * m; if (F.hpMul) hpMul -= F.hpMul * m; }
    P.innate = add;
    for (const k in add) P.perks[k] = Math.max(NEG_FLOOR[k] ?? -9, (P.perks[k] || 0) + add[k]);
    if (!P.pcnt) P.pcnt = {};
    // attributes: dice + talent bonuses (+ 2 points per flaw as compensation)
    const st = Object.assign({}, d.stats);
    for (const t of d.talents) { const F = TALENT_FX[t.key]; if (F && F.attr) for (const k in F.attr) st[k] = (st[k] || 0) + Math.round(F.attr[k] * (GRADE[t.g].mult >= 1.4 ? 1 : 0.5)); }
    const W = clsW();
    for (const k of ATTR_KEYS) { const n = st[k] || 0; v.attr[k] = (v.attr[k] || 0) + n; if (k === 'vit') { P.maxHp += W.hp * n; } if (k === 'agi') P.maxStam += 2 * n; }
    v.pts = (v.pts || 0) + (d.bonus || 0);
    if (hpMul !== 1) P.maxHp = Math.round(P.maxHp * Math.max(0.5, hpMul));
    P.hp = P.maxHp; P.stamina = P.maxStam;
    P._pfx = null;
    P.fxExtra = f => this.heroFx(f);
  },
  // flaws that need more than a perk (night sickness)
  heroFx(f) {
    const h = this.v10 && this.v10.hero; if (!h) return;
    f.night = 0;
    for (const t of h.flaws || []) { const F = FLAW_FX[t.key]; if (F && F.night) f.night += F.night * GRADE[Math.min(4, t.g)].mult; }
  },
  heroTalentList() {
    const h = this.v10 && this.v10.hero; if (!h) return [];
    const out = [];
    for (const t of h.talents || []) { const X = talentText('t', t.key, t.v); out.push({ kind: 'talent', key: t.key, g: t.g, name: X.name, tag: X.tag, story: X.story, fx: TALENT_FX[t.key].txt(GRADE[t.g].mult) }); }
    for (const t of h.flaws || []) { const X = talentText('f', t.key, t.v), g = Math.min(4, t.g); out.push({ kind: 'flaw', key: t.key, g, name: X.name, tag: X.tag, story: X.story, fx: FLAW_FX[t.key].txt(GRADE[g].mult) }); }
    return out;
  },
});

// ================= hooks =================
(function () {
  const nt = G.newGame;
  G.newGame = function (...a) {
    const r = nt.apply(this, a);
    if (this.player) { this.player.pcnt = {}; this.player.pgr = {}; }
    const D = UI.pickedDestiny;
    if (D) { this.applyDestiny(D); UI.pickedDestiny = null; }
    return r;
  };
  // old saves get a count table so grades and caps work
  const afterLoad = function () {
    const P = G.player; if (!P) return;
    if (!P.pcnt) { P.pcnt = {}; for (const k in P.perks) P.pcnt[k] = Math.round(P.perks[k]) || 0; }
    if (!P.pgr) P.pgr = {};
    const h = G.v10 && G.v10.hero;
    if (h) { P.fxExtra = f => G.heroFx(f); }
  };
  const ld = G.load;
  G.load = function (...a) { const r = ld.apply(this, a); if (r) afterLoad(); return r; };
  const lc = G.loadChar;
  if (lc) G.loadChar = function (...a) { const r = lc.apply(this, a); afterLoad(); return r; };
  // talents from the dice never count as chosen ones
  const gm = G.hitEnemy;
  G.hitEnemy = function (z, dmg, kx, ky, src, ang, wp) {
    const P = this.player;
    if (P && z && (src === 'gun' || src === 'melee' || src === 'skill')) {
      const f = this.pfx();
      if (f.night && this.night) dmg *= 1 - Math.min(0.6, f.night);
      const v6 = this.v6; if (v6 && v6.btD) dmg *= 1 + v6.btD;
    }
    return gm.call(this, z, dmg, kx, ky, src, ang, wp);
  };
  // levelling: random grade on every offered card
  const op = G.offerPerks;
  G.offerPerks = function (lvl) {
    const luck = (this.player.perks.luck || 0);
    return op.call(this, lvl).map(p => Object.assign(Object.create(p), { grade: Math.min(4, rollGrade(luck, 0) + (p.major ? 1 : 0)) }));
  };
  UI.pickPerk = function (i) {
    if (G.state !== 'levelup' || !this.perkPicks[i]) return;
    const pk = this.perkPicks[i];
    G.applyPerk(pk.id, GRADE[pk.grade ?? 1].mult, pk.grade ?? 1);
    G.lvlQueue--; G.state = 'playing'; this.showScreen(null);
  };
})();

// ================= breakthrough grades =================
const BT_TAB = { hp: [14, 20, 30, 42, 60], stam: [3, 5, 7, 9, 12], pts: [2, 3, 5, 8, 12], mana: [4, 6, 10, 15, 22], dmg: [0.03, 0.04, 0.055, 0.07, 0.1] };
(function () {
  const bt = G.breakthrough;
  G.btStage = function () { return Math.floor((this.player.level - 1) / 5); };
  G.btChance = function (boost) {
    const apt = (this.v10.hero && this.v10.hero.apt) || 1;
    const shift = 0.12 * (apt - 1) + (boost ? 0.9 : 0);
    const w = GRADE.map((g, i) => g.w * Math.pow(1 + shift, i) * Math.pow(1 + 0.3 * (this.player.perks.luck || 0), i));
    const t = w.reduce((a, b) => a + b, 0);
    return w.map(x => x / t);
  };
  G.breakthrough = function () {
    const v6 = this.v6, P = this.player, bt0 = v6 && v6.bt, boost = !!UI.btBoost && this.has('bt_c', 1);
    const mats0 = { c: P.inv.bt_c || 0 };
    // the catalyst is spent only when the breakthrough succeeds
    const r = bt.call(this);
    if (!v6 || v6.bt <= bt0) return r;
    let useC = boost && (this.has('bt_c', 1));
    if (useC) this.take('bt_c', 1);
    const chance = this.btChance(useC), u = Math.random();
    let g = 0, acc = 0; for (let i = 0; i < chance.length; i++) { acc += chance[i]; if (u <= acc) { g = i; break; } g = i; }
    const t = v6.bt; (v6.btG || (v6.btG = {}))[t] = g;
    P.maxHp += BT_TAB.hp[g] - 20; P.hp = P.maxHp; P.maxStam += BT_TAB.stam[g] - 5; P.stamina = P.maxStam;
    this.v10.pts += BT_TAB.pts[g];
    v6.btM = (v6.btM || 0) + BT_TAB.mana[g];
    v6.btD = (v6.btD || 0) + BT_TAB.dmg[g] - 0.04;
    P._pfx = null;
    setTimeout(() => {
      UI.banner(`${gradeName(g).toUpperCase()}!`, `${this.rankTitle()} • +${BT_TAB.hp[g]} máu, +${BT_TAB.pts[g]} điểm tiềm năng, +${BT_TAB.mana[g]} ${manaName()}`, GRADE[g].col);
      if (g >= 3) { FX.pillar(P.x, P.y, GRADE[g].col, 3, 120); Sound.play('sfx_legendary', 0.9); }
    }, 1400);
    this.save();
    return r;
  };
  const mm = G.maxMana;
  G.maxMana = function () { return mm.call(this) + ((this.v6 && this.v6.btM) || 0); };
  const rt = G.rankTitle;
  G.rankTitle = function () {
    const base = rt.call(this), st = Math.floor((this.player.level - 1) / 5), v6 = this.v6;
    const h = this.v10 && this.v10.hero;
    const g = st === 0 ? (h ? h.apt : null) : v6 && v6.btG ? v6.btG[st] : null;
    if (g == null) return base;
    return R3() === 'tt' ? `${gradeName(g)} ${base}` : `${base} ✦${gradeName(g)}`;
  };
})();

// ================= summon controls =================
(function () {
  G.shadowFree = function () { return this.v10.shadows.filter(s => !this.shBusy(s)); };
  G.summonAll = function (o = {}) {
    if (!isArise()) return;
    if (typeof Net !== 'undefined' && Net.active && Net.guest) { this.toast(`Khi vào phòng của bạn bè, ${SM().army} chỉ gọi được ở thế giới của bạn.`, 'info'); return; }
    if (!o.noShift && (Input.keys.ShiftLeft || Input.keys.ShiftRight)) return this.dismissAll();
    const v = this.v10, P = this.player;
    if (P.dead) return;
    if (!v.shadows.length) { this.toast(`${SM().army} còn trống. Hạ kẻ địch rồi đứng cạnh xác, nhấn [E] để thu phục.`, 'info'); return; }
    const limit = o.n != null ? o.n : (v.sumN | 0) || 1e9;
    let n = 0, lack = false, busy = 0, fresh = 0;
    for (const t of SH_ORDER) for (const s of v.shadows) {
      if (s.tier !== t || n >= limit) continue;
      if (this.shBusy(s)) { if (!o.includeBusy) { busy++; continue; } s.job = null; s.exp = null; }
      const r = this.summonShadow(s);
      if (r === 'ok') { n++; fresh++; } else if (r === 'mana') lack = true; else if (r === 'active') n++;
    }
    if (fresh) { UI.skillFlash(SM().skill.toUpperCase() + '!', SM().col); Sound.play('sfx_shadow', 0.8); this.toast(`${SM().icon} Đã gọi ${fresh} ${SM().unit}${lack ? ` — hết ${manaName()} cho số còn lại` : ''}${busy ? ` • ${busy} đang làm việc` : ''}.`, 'quest'); }
    else this.toast(lack ? `Không đủ ${manaName()} để gọi ${SM().unit}.` : busy ? `${busy} ${SM().unit} đang làm việc / khám phá — dùng nút "Gọi toàn bộ" để gọi cả họ về.` : `Mọi ${SM().unit} rảnh đã ở bên bạn.`, 'info');
  };
  G.dismissAll = function () {
    let n = 0;
    for (const a of this.allies) if (a.kind === 'shadow' && !a.dead) { if (a.sid) a.recalled = true; a.dead = true; Particles.burst(a.x, a.y, 10, SM().col, 120); n++; }
    if (n) { Sound.play('sfx_shadow', 0.4, 1.4); this.toast(`Đã hủy triệu hồi ${n} ${SM().unit}.`, 'info'); }
    else this.toast(`Không có ${SM().unit} nào đang được triệu hồi.`, 'info');
    UI.dirty = true;
  };
  G.activeSummons = function () { let n = 0; for (const a of this.allies) if (a.kind === 'shadow' && !a.dead) n++; return n; };
  // HUD: a small cancel button beside the summon button
  window.addEventListener('load', () => {
    document.body.insertAdjacentHTML('beforeend', '<button id="tDismiss" hidden aria-label="Hủy triệu hồi"><span>✕</span></button>');
    const b = document.getElementById('tDismiss');
    const go = e => { e.preventDefault(); e.stopPropagation(); if (G.state === 'playing') G.dismissAll(); };
    b.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); b.classList.add('down'); }, { passive: false });
    b.addEventListener('touchend', e => { b.classList.remove('down'); go(e); }, { passive: false });
    b.addEventListener('click', go);
  });
  const tk = G.v5Tick;
  G.v5Tick = function (dt) {
    tk.call(this, dt);
    if (this.frame % 15 === 0) { const b = document.getElementById('tDismiss'); if (b) b.hidden = !(this.state === 'playing' && this.activeSummons() > 0); }
  };
})();

// ---------- breakthrough tab: odds of every grade, optional catalyst ----------
(function () {
  const bb = UI.buildBase;
  UI.buildBase = function () {
    bb.call(this);
    if (this.baseTab !== 'bt') return;
    const box = $('baseBody'), ch = G.btChance(!!UI.btBoost && G.has('bt_c', 1)), hasC = G.has('bt_c', 1);
    let h = '<div class="bt15"><h3>Phẩm cấp đột phá <small>quyết định mức tăng chỉ số</small></h3><div class="btg">';
    ch.forEach((p, i) => { h += `<div style="--gc:${GRADE[i].col}"><b>${esc(gradeName(i))}</b><i style="width:${Math.max(3, Math.round(p * 100))}%"></i><span>${(p * 100).toFixed(p < 0.1 ? 1 : 0)}%</span><small>+${BT_TAB.hp[i]} máu • +${BT_TAB.pts[i]} điểm • +${BT_TAB.mana[i]} ${esc(manaName())} • +${Math.round(BT_TAB.dmg[i] * 100)}% sát thương</small></div>`; });
    h += `</div><label class="btc ${hasC ? '' : 'dis'}"><input type="checkbox" id="btBoost" ${UI.btBoost && hasC ? 'checked' : ''} ${hasC ? '' : 'disabled'}> Dâng thêm 1 ${esc(itm('bt_c').name)} làm chất xúc tác (có ${G.player.inv.bt_c || 0}) — đẩy xác suất sang phẩm cấp cao</label>`;
    const hist = [], v6 = G.v6, hero = G.v10.hero;
    if (hero) hist.push(`${esc(LORE[RL.id].levelTitles[0])}: ${gradeTag(hero.apt)}`);
    if (v6 && v6.btG) for (const k of Object.keys(v6.btG).sort((a, b) => a - b)) hist.push(`${esc(LORE[RL.id].levelTitles[Math.min(9, +k)])}: ${gradeTag(v6.btG[k])}`);
    if (hist.length) h += `<p class="muted">Các cảnh giới đã qua — ${hist.join(' • ')}</p>`;
    box.insertAdjacentHTML('beforeend', h + '</div>');
    const c = $('btBoost'); if (c) c.onchange = () => { UI.btBoost = c.checked; UI.buildBase(); };
  };
})();
