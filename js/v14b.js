// ===== v14b: talents per world / class (offers, effects), skill mastery progress =====
const PCLS = {
  warrior: { melee: 3, tank: 2.5, crit: 1, speed: 0.8, gun: 0.25, skill: 0.5, mana: 0.5, summon: 0.8, heal: 0.6 },
  assassin: { melee: 2.2, crit: 3, speed: 2, tank: 0.6, gun: 0.5, skill: 0.6, mana: 0.6, summon: 0.7, heal: 0.4 },
  ranger: { gun: 3, crit: 1.8, speed: 1.4, melee: 0.3, tank: 0.8, skill: 0.7, mana: 0.6, summon: 0.8 },
  mage: { skill: 3, mana: 3, summon: 1.4, gun: 0.35, melee: 0.2, crit: 0.8, tank: 0.7, heal: 1 },
  healer: { heal: 3, mana: 1.8, summon: 1.6, tank: 1.3, melee: 0.3, gun: 0.5, skill: 1, crit: 0.4 },
};
const pkIcon = { hp: 'relic_0', speed: 'relic_1', luck: 'relic_7', crit: 'relic_4', armor: 'relic_5', skill: 'relic_8', dash: 'relic_11', charm: 'fx_7', leader: 'relic_2', stam: 'i_choco', belly: 'i_food', vamp: 'blood1' };

// P(id, tags, [md, tt, sl] names, desc(lv), icon, extra)
const PK = (id, tags, nm, desc, icon, o = {}) => Object.assign({
  id, tags, icon, max: o.max || 5,
  get name() { return nm[{ md: 0, tt: 1, sl: 2 }[R3()]]; },
  desc(lv) { return typeof desc === 'function' ? desc(lv) : desc; },
}, o);
const mn = () => (typeof manaName === 'function' ? manaName() : 'mana');

(function () {
  const old = PERKS.slice();
  PERKS.length = 0;
  const add = p => PERKS.push(p);
  // --- engine perks (kept: the game reads these ids) ---
  add(PK('hp', ['tank'], ['Da Thép', 'Kim Cương Thể', 'Thể Chất Cường Hóa'], '+25 máu tối đa và hồi đầy máu.', 'relic_0'));
  add(PK('gun', ['gun'], ['Xạ Thủ', 'Ngự Phù Thuật', 'Thiện Xạ'], () => ({ md: '+15% sát thương súng.', tt: '+15% sát thương phù chú và pháp khí bắn xa.', sl: '+15% sát thương vũ khí tầm xa.' })[R3()], 'i_pistol'));
  add(PK('melee', ['melee'], ['Đồ Tể', 'Kiếm Tâm', 'Chiến Binh Cận Chiến'], '+30% sát thương cận chiến.', 'i_bat'));
  add(PK('reload', ['gun'], ['Tay Nhanh', 'Kết Ấn Nhanh', 'Nạp Nhanh'], () => ({ md: 'Nạp đạn nhanh hơn 20%.', tt: 'Nạp phù chú nhanh hơn 20%.', sl: 'Nạp nhanh hơn 20%.' })[R3()], 'i_ammo_rifle'));
  add(PK('speed', ['speed'], ['Chân Sáo', 'Thân Pháp Phiêu Dật', 'Bước Chân Thợ Săn'], '+8% tốc độ di chuyển.', 'relic_1'));
  add(PK('stam', ['speed', 'tank'], ['Bền Bỉ', 'Khí Huyết Dồi Dào', 'Sức Bền'], '+35% thể lực, hồi nhanh hơn.', 'i_choco'));
  add(PK('luck', ['util'], ['Kẻ Nhặt Rác', 'Thiên Mệnh', 'May Mắn Thợ Săn'], '+35% cơ hội rơi đồ và đồ quý hơn.', 'relic_7'));
  add(PK('thrift', ['gun'], ['Tiết Kiệm', 'Tiết Kiệm Linh Lực', 'Tiết Kiệm Mana'], '20% cơ hội bắn không tốn đạn.', 'i_ammo_pistol'));
  add(PK('vamp', ['melee', 'tank'], ['Khát Máu', 'Huyết Sát Công', 'Hút Máu'], 'Hạ địch bằng cận chiến hồi 5 máu.', 'blood1'));
  add(PK('crit', ['crit'], ['Chí Mạng', 'Phá Giáp Nhãn', 'Nhắm Điểm Yếu'], '+10% tỉ lệ chí mạng.', 'relic_4'));
  add(PK('belly', ['util'], ['Dạ Dày Sắt', 'Tịch Cốc Thuật', 'Thể Trạng Bền'], 'Đói và khát chậm hơn 25%.', 'i_food', { max: 3 }));
  add(PK('pierce', ['gun'], ['Xuyên Phá', 'Xuyên Vân Phù', 'Đạn Xuyên Thấu'], 'Đạn xuyên thêm 1 mục tiêu.', 'i_ammo_shell', { max: 3 }));
  add(PK('boom', ['skill'], ['Chuyên Gia Nổ', 'Lôi Hỏa Tông Sư', 'Pháp Sư Nổ'], '+40% sát thương và phạm vi nổ/lửa.', 'i_grenade'));
  add(PK('armor', ['tank'], ['Giáp Da', 'Hộ Thể Thần Công', 'Giáp Bóng Tối'], 'Giảm 12% sát thương nhận vào.', 'relic_5', { max: 4 }));
  add(PK('skill', ['skill'], ['Chiến Thuật Gia', 'Đạo Pháp Tinh Thông', 'Hệ Thống Cường Hóa'], 'Tuyệt kỹ [Q] mạnh hơn 30%, hồi năng lượng nhanh hơn.', 'relic_8'));
  add(PK('dash', ['speed'], ['Nước Rút', 'Thân Pháp', 'Bộ Pháp Bóng Ma'], 'Lướt xa hơn, hồi nhanh hơn, gây sát thương khi lướt qua.', 'relic_11', { max: 3 }));
  add(PK('charm', ['util'], ['Hòa Đồng', 'Đa Tình', 'Sức Hút Cá Nhân'], 'Độ thân mật với bạn đồng hành tăng nhanh gấp đôi.', 'fx_7', { max: 2 }));
  add(PK('leader', ['summon'], ['Thủ Lĩnh', 'Tông Chủ Phong Thái', 'Chỉ Huy Đội Săn'], 'Đồng đội gây thêm 40% sát thương và trâu hơn.', 'relic_2'));
  // --- new, every world ---
  add(PK('xp', ['util'], ['Học Từ Sinh Tồn', 'Ngộ Tính Siêu Phàm', 'Thăng Cấp Nhanh'], '+12% kinh nghiệm nhận được.', 'ic_15'));
  add(PK('regen', ['tank', 'heal'], ['Cơ Thể Tự Chữa', 'Linh Khí Nuôi Thân', 'Hồi Phục Thợ Săn'], '+0.8 máu mỗi giây khi 4 giây không bị đánh.', 'relic_0'));
  add(PK('critdmg', ['crit'], ['Điểm Yếu Chết Người', 'Phá Cực Nhất Kích', 'Đòn Quyết Định'], 'Sát thương chí mạng +25%.', 'relic_10'));
  add(PK('dodge', ['speed', 'tank'], ['Phản Xạ Nhanh', 'Vân Bộ Lưu Ảnh', 'Bóng Ma Né Tránh'], '+5% cơ hội né hoàn toàn đòn đánh.', 'relic_6', { max: 4 }));
  add(PK('execute', ['crit'], ['Kết Liễu', 'Trảm Hồn', 'Xử Tử'], '+30% sát thương lên kẻ địch dưới 25% máu.', 'relic_9'));
  add(PK('slayer', ['melee', 'gun', 'skill'], ['Thợ Săn Quái Vật', 'Diệt Yêu Sư', 'Sát Thần'], '+20% sát thương lên tinh anh và boss.', 'ic_9'));
  add(PK('combo', ['melee', 'crit'], ['Dồn Dập', 'Liên Hoàn Kích', 'Liên Hoàn'], 'Khi combo từ 10 trở lên: +15% sát thương.', 'ic_14'));
  add(PK('gold', ['util'], ['Tay Buôn', 'Tài Lộc Vượng', 'Thợ Săn Kim Tệ'], '+25% tiền nhặt được.', 'ic_5', { max: 4 }));
  add(PK('forager', ['util'], ['Nhặt Nhạnh', 'Hút Linh Vật', 'Từ Trường'], 'Hút vật phẩm rơi từ xa hơn 40%.', 'ic_11', { max: 3 }));
  add(PK('wood', ['util'], ['Thợ Mộc', 'Mộc Linh Thể', 'Tiều Phu'], 'Chặt cây nhanh hơn 25%, mỗi cây thêm 1 gỗ, phá thùng thêm gỗ.', 'i_planks', { max: 3 }));
  add(PK('medic', ['heal'], ['Y Tá Dã Chiến', 'Đan Sư', 'Pháp Sư Chữa Trị'], '+40% lượng máu hồi từ vật phẩm y tế.', 'i_medkit'));
  add(PK('mana', ['mana'], ['Pin Dự Phòng', 'Linh Căn Thượng Phẩm', 'Mạch Ma Lực'], () => `+20% ${mn()} tối đa, hồi nhanh hơn 20%.`, 'ic_8'));
  add(PK('siphon', ['mana', 'melee'], ['Tái Tạo Năng Lượng', 'Hấp Thu Linh Khí', 'Hút Mana'], () => `Mỗi kẻ địch hạ được hồi 3 ${mn()}.`, 'ic_2'));
  add(PK('summon', ['summon'], ['Chỉ Huy Xác Sống', 'Ngự Quỷ Tông Sư', 'Quân Vương Bóng Tối'], () => `+1 ô lưu ${SM().unit}, +1 lính tạm, quân triệu hồi +12% máu và sát thương.`, 'sk_6'));
  add(PK('extractor', ['summon'], ['Thuần Hóa', 'Câu Hồn Thuật', 'Thu Phục Bậc Thầy'], '+6% tỉ lệ thu phục thành công.', 'sk_3'));
  add(PK('second', ['tank'], ['Cứng Đầu', 'Bất Tử Chi Thân', 'Ý Chí Không Gục'], lv => `Mỗi 150 giây, đòn chí tử không hạ được bạn: hồi ${25 + 10 * lv}% máu.`, 'relic_2', { max: 3 }));
  add(PK('thorns', ['tank', 'melee'], ['Gai Nhọn', 'Phản Chấn Cương Khí', 'Phản Đòn'], 'Kẻ đánh bạn chịu 30% sát thương gây ra.', 'ic_12'));
  add(PK('delver', ['util'], ['Dân Hầm Ngục', 'Thám Hiểm Bí Cảnh', 'Thợ Săn Cổng'], 'Trong hầm ngục / Cổng: +12% sát thương và kinh nghiệm.', 'ic_7'));
  // --- exclusive to one world ---
  add(PK('adren', ['tank', 'speed'], ['Adrenaline', '', ''], 'Dưới 35% máu: +20% tốc chạy và +20% sát thương.', 'sk_7', { realms: ['md'], max: 3 }));
  add(PK('ward', ['tank', 'mana'], ['', 'Hộ Thể Cương Khí', ''], lv => `Tự tạo khiên hấp thụ ${20 + 18 * lv} sát thương, hồi lại sau ${Math.max(10, 22 - 2 * lv)} giây.`, 'sk_1', { realms: ['tt'], max: 4 }));
  add(PK('meditate', ['mana', 'heal'], ['', 'Tĩnh Tâm Thuật', ''], () => `Đứng yên 1.5 giây: hồi thêm máu và ${mn()} mỗi giây.`, 'sk_4', { realms: ['tt'], max: 3 }));
  add(PK('sovereign', ['summon', 'mana'], ['', '', 'Hệ Thống Thức Tỉnh'], 'Nhận ngay 4 điểm tiềm năng để cộng vào chỉ số.', 'ic_15', { realms: ['sl'], max: 3 }));
  // --- major talents (offered at levels 10, 20, 30…) ---
  const maj = (id, o, nm, desc, icon) => add(PK(id, [], nm, desc, icon, Object.assign({ max: 1, major: true }, o)));
  maj('bulwark', { cls: 'warrior' }, ['Pháo Đài Sống', 'Kim Chung Tráo', 'Hiệp Sĩ Bất Khuất'], '+100 máu tối đa, nhận ít hơn 25% sát thương, +10% sát thương cận chiến.', 'relic_5');
  maj('shade', { cls: 'assassin' }, ['Bóng Đêm', 'Ảnh Thích Khách', 'Chúa Tể Bóng Đêm'], '+20% tỉ lệ chí mạng, sát thương chí mạng +50%, +10% tốc chạy.', 'relic_10');
  maj('eagle', { cls: 'ranger' }, ['Mắt Đại Bàng', 'Thiên Nhãn', 'Nhãn Thần'], '+30% sát thương tầm xa, đạn xuyên thêm 1 mục tiêu.', 'relic_4');
  maj('archmage', { cls: 'mage' }, ['Kỹ Sư Thiên Tài', 'Đại Đạo Pháp Tu', 'Đại Pháp Sư'], () => `+40% sát thương kỹ năng, +50% ${mn()} tối đa.`, 'relic_8');
  maj('lifetree', { cls: 'healer' }, ['Bác Sĩ Thiên Tài', 'Đan Thánh', 'Thánh Giả'], '+3 máu mỗi giây, +60% hồi máu từ vật phẩm, khiên 40 khi bắt đầu trận.', 'relic_0');
  maj('king', { realms: ['md'] }, ['Vua Phế Tích', '', ''], '+40% tiền, +30% cơ hội rơi đồ, hút đồ xa hơn.', 'relic_2');
  maj('dao', { realms: ['tt'] }, ['', 'Đắc Đạo', ''], () => `+20% kinh nghiệm, +25% ${mn()}, kỹ năng hồi năng lượng nhanh hơn.`, 'relic_9');
  maj('ruler', { realms: ['sl'] }, ['', '', 'Quân Vương Thức Tỉnh'], () => `+2 ô lưu ${SM().unit}, +2 lính tạm, quân triệu hồi +30% sức mạnh.`, 'sk_6');
  // anything an old save holds that is not above keeps working
  for (const o of old) if (!PERKS.some(p => p.id === o.id)) PERKS.push(o);
})();

const PROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];
const perkLv = id => (G.player && G.player.perks[id]) || 0;

// ---------- numbers from all talents (cached per perk state) ----------
G.pfx = function () {
  const P = this.player; if (!P) return { wood: 0, tempSlots: 0, slots: 0, spow: 1, extract: 0 };
  if (P._pfx) return P._pfx;
  const k = perkLv;
  const f = {
    dmgTaken: Math.pow(0.75, k('bulwark')) * 1,
    critAdd: 0.2 * k('shade'), critDmg: 25 * k('critdmg') + 50 * k('shade'),
    rangedDmg: 1 + 0.3 * k('eagle'), skillDmg: 1 + 0.4 * k('archmage'), meleeDmg: 1 + 0.1 * k('bulwark'),
    execute: 0.3 * k('execute'), slayer: 0.2 * k('slayer'), combo: 0.15 * k('combo'), delver: 0.12 * k('delver'),
    xp: 1 + 0.12 * k('xp') + 0.2 * k('dao') + 0.12 * k('delver') * 0, gold: 1 + 0.25 * k('gold') + 0.4 * k('king'),
    heal: 0.4 * k('medic') + 0.6 * k('lifetree'), regen: 0.8 * k('regen') + 3 * k('lifetree'),
    manaMul: 1 + 0.2 * k('mana') + 0.5 * k('archmage') + 0.25 * k('dao'), manaRegen: 0.2 * k('mana') + 0.15 * k('dao'),
    siphon: 3 * k('siphon'), dodge: 5 * k('dodge'), thorns: 0.3 * k('thorns'),
    forager: 1 + 0.4 * k('forager') + 0.5 * k('king'), wood: k('wood'),
    slots: k('summon') + 2 * k('ruler'), tempSlots: k('summon') + 2 * k('ruler'), spow: 1 + 0.12 * k('summon') + 0.3 * k('ruler'), extract: 0.06 * k('extractor'),
    adren: k('adren'), ward: k('ward'), meditate: k('meditate'), second: k('second'), speed: 0.1 * k('shade'),
    luckBonus: 0.3 * k('king'), pierce: k('eagle'), maxHp: 100 * k('bulwark'),
  };
  P._pfx = f; return f;
};

(function () {
  // ---------- level-up offers ----------
  const weight = (p, c) => {
    if (p.realms && !p.realms.includes(R3())) return 0;
    if (p.major) return p.cls ? (p.cls === c ? 3 : 0) : 2;
    if (perkLv(p.id) >= p.max) return 0;
    if (p.id === 'pierce' && perkLv('pierce') >= 3) return 0;
    const w = PCLS[c] || {};
    let m = 0; for (const t of p.tags) m = Math.max(m, w[t] ?? 1);
    return (p.tags.length ? m : 1) * (perkLv(p.id) ? 1.25 : 1);
  };
  G.offerPerks = function (lvl) {
    const c = this.v10 && this.v10.cls, pool = PERKS.map(p => ({ p, w: weight(p, c) }));
    const picks = [];
    const take = list => { let tot = list.reduce((s, x) => s + x.w, 0); if (tot <= 0) return null; let r = Math.random() * tot; for (const x of list) { r -= x.w; if (r <= 0) return x; } return list[list.length - 1]; };
    if (lvl % 10 === 0) {
      let majors = pool.filter(x => x.p.major && x.w > 0 && perkLv(x.p.id) < 1);
      while (picks.length < 3 && majors.length) { const x = take(majors); picks.push(x.p); majors = majors.filter(y => y !== x); }
    }
    let rest = pool.filter(x => !x.p.major && x.w > 0 && !picks.includes(x.p));
    while (picks.length < 3 && rest.length) { const x = take(rest); picks.push(x.p); rest = rest.filter(y => y !== x); }
    return picks;
  };
  UI.levelUp = function () {
    G.state = 'levelup';
    const P = G.player, lvl = P.level - G.lvlQueue + 1, c = G.v10 && G.v10.cls;
    this.perkPicks = G.offerPerks(lvl);
    $('lvlTitle').textContent = `LÊN CẤP ${lvl}!`;
    $('lvlRank').textContent = G.rankTitle();
    const major = this.perkPicks.some(p => p.major);
    document.querySelector('#levelup p').textContent = major ? `★ Cấp ${lvl}: chọn một THIÊN PHÚ LỚN (1 / 2 / 3)` : 'Chọn một thiên phú (1 / 2 / 3)';
    const box = $('cards'); box.innerHTML = '';
    this.perkPicks.forEach((p, i) => {
      const lv = perkLv(p.id), cd = document.createElement('div');
      const fit = !p.major && c && p.tags.some(t => (PCLS[c] || {})[t] >= 2);
      cd.className = 'card' + (p.major ? ' major' : '');
      cd.innerHTML = `<div class="ck">${i + 1}</div><img src="${IMG[p.icon] ? IMG[p.icon].src : ''}" alt=""><h3>${esc(p.name)}${p.max > 1 ? ' ' + PROMAN[lv + 1] : ''}</h3><p>${esc(p.desc(lv + 1))}</p>${p.major ? '<small class="pk">★ THIÊN PHÚ LỚN</small>' : fit ? `<small class="pk">✔ Hợp ${esc(clsName(c))}</small>` : ''}${p.max > 1 ? `<small class="pk2">Bậc ${lv + 1}/${p.max}</small>` : ''}`;
      cd.onclick = () => this.pickPerk(i);
      cd.onmouseenter = () => Sound.play('sfx_hover', 0.2);
      box.appendChild(cd);
    });
    this.showScreen('levelup');
  };
  const ap = G.applyPerk;
  G.applyPerk = function (id) {
    const P = this.player, v = this.v10;
    ap.call(this, id);
    if (id === 'bulwark') { P.maxHp += 100; P.hp = P.maxHp; }
    if (id === 'sovereign' && v) { v.pts += 4; this.toast('+4 điểm tiềm năng — cộng ở Túi > Nhân vật.', 'quest'); }
    if (id === 'lifetree') P.shield = Math.max(P.shield || 0, 40);
    P._pfx = null;
  };
  // stat sheet: chosen talents with their effect
  const ba = UI.buildAttr;
  UI.buildAttr = function () {
    ba.call(this);
    const P = G.player, list = PERKS.filter(p => P.perks[p.id]);
    let h = `<div class="perk14"><h3>Thiên phú <small>${list.length} đã chọn</small></h3>`;
    if (!list.length) h += '<p class="muted">Chưa có. Mỗi lần lên cấp chọn 1 trong 3; cấp 10, 20, 30… có Thiên phú Lớn.</p>';
    for (const p of list) { const lv = P.perks[p.id]; h += `<div class="pk14 ${p.major ? 'maj' : ''}"><img src="${IMG[p.icon] ? IMG[p.icon].src : ''}" alt=""><div><b>${esc(p.name)}${p.max > 1 ? ' ' + PROMAN[lv] : ''}</b><small>${esc(p.desc(lv))}</small></div></div>`; }
    $('invBody').insertAdjacentHTML('beforeend', h + '</div>');
  };

  // ---------- effects ----------
  const rl = Player.prototype.relic;
  Player.prototype.relic = function (type) {
    const v = rl.call(this, type);
    if (type === 'critdmg') return v + G.pfx().critDmg;
    if (type === 'dodge') return v + G.pfx().dodge;
    return v;
  };
  const he = G.hitEnemy;
  G.hitEnemy = function (z, dmg, kx, ky, src, ang, wp) {
    const P = this.player;
    if (P && z && !z.dead) {
      const f = this.pfx(), mine = src === 'gun' || src === 'melee' || src === 'skill';
      if (src === 'gun') dmg *= f.rangedDmg; else if (src === 'melee') dmg *= f.meleeDmg; else if (src === 'skill') dmg *= f.skillDmg;
      if (mine || src === 'ally') {
        if (f.execute && z.hp < z.maxHp * 0.25) dmg *= 1 + f.execute;
        if (f.slayer && (z.boss || z.elite)) dmg *= 1 + f.slayer;
        if (f.combo && this.combo >= 10) dmg *= 1 + f.combo;
        if (f.delver && World.mode === 'dungeon') dmg *= 1 + f.delver;
        if (f.adren && P.hp < P.maxHp * 0.35) dmg *= 1 + 0.2 * f.adren;
      }
      if (mine && f.critAdd && !this._xcrit && Math.random() < f.critAdd) { dmg *= 2 + P.relic('critdmg') / 100; this._xcrit = true; }
    }
    return he.call(this, z, dmg, kx, ky, src, ang, wp);
  };
  const hp = G.hurtPlayer;
  G.hurtPlayer = function (dmg, src, silent) {
    const P = this.player;
    if (P && !P.dead) {
      const f = this.pfx();
      if (f.dmgTaken < 1) dmg *= f.dmgTaken;
      if (!silent) this._hurtAt = this.time;
      if (f.thorns && src && src.hp != null && !src.dead) this.hitEnemy(src, dmg * f.thorns, 0, 0, 'thorn');
    }
    return hp.call(this, dmg, src, silent);
  };
  const die = G.die;
  G.die = function () {
    const f = this.pfx(), P = this.player;
    if (f.second && (this._secondAt || 0) <= this.time && !P.dead) {
      this._secondAt = this.time + 150;
      P.hp = P.maxHp * (0.25 + 0.1 * f.second); P.hurtT = 2;
      this.explode(P.x, P.y, 150, 120 + P.level * 8, true, true);
      FX.pillar(P.x, P.y, '#ffe38a', 1.4, 56); Sound.play('sfx_skill', 0.7);
      this.toast(`${PERKS.find(p => p.id === 'second').name}: bạn gượng dậy!`, 'quest');
      return;
    }
    return die.call(this);
  };
  const ax = G.addXp;
  G.addXp = function (n) { const f = this.pfx(); return ax.call(this, n * f.xp * (World.mode === 'dungeon' ? 1 + f.delver : 1)); };
  const gm = G.goldMul;
  G.goldMul = function () { return gm.call(this) * this.pfx().gold; };
  const uh = useHeal;
  useHeal = function (want) {
    const P = G.player, h0 = P.hp; uh(want);
    const d = P.hp - h0, f = G.pfx();
    if (d > 0 && f.heal) { const x = Math.min(P.maxHp - P.hp, d * f.heal); if (x > 0) { P.hp += x; Floaters.add(P.x, P.y - 30, `+${Math.round(x)}`, '#8affb0', 9); } }
  };
  const mm = G.maxMana;
  G.maxMana = function () { return Math.round(mm.call(this) * this.pfx().manaMul); };
  const sm = Player.prototype.speedMul;
  Player.prototype.speedMul = function () { const f = G.pfx(); return sm.call(this) * (1 + f.speed) * (f.adren && this.hp < this.maxHp * 0.35 ? 1 + 0.2 * f.adren : 1); };
  const ke = G.killEnemy;
  G.killEnemy = function (z, src) {
    ke.call(this, z, src);
    const f = this.pfx(), v = this.v10;
    if (f.siphon && v && v.mana != null && (src === 'melee' || src === 'gun' || src === 'skill' || src === 'ally')) v.mana = Math.min(this.maxMana(), v.mana + f.siphon);
  };
  // pickup radius
  let mmBase = G.magnetMul || 1;
  Object.defineProperty(G, 'magnetMul', { configurable: true, get() { return mmBase * (this.player ? this.pfx().forager : 1); }, set(v) { mmBase = v; } });
  // per-tick: regeneration, meditation, ward shield, extra mana regen
  const tick = G.v5Tick;
  G.v5Tick = function (dt) {
    tick.call(this, dt);
    const P = this.player; if (!P || P.dead || this.state !== 'playing') return;
    const f = this.pfx(), v = this.v10;
    if (f.regen && P.hp < P.maxHp && this.time - (this._hurtAt || -9) > 4) P.hp = Math.min(P.maxHp, P.hp + f.regen * dt);
    if (f.meditate) {
      const still = Math.hypot(P.vx, P.vy) < 12;
      this._still = still ? (this._still || 0) + dt : 0;
      if (this._still > 1.5) { P.hp = Math.min(P.maxHp, P.hp + 1.2 * f.meditate * dt); if (v && v.mana != null) v.mana = Math.min(this.maxMana(), v.mana + 2.2 * f.meditate * dt); }
    }
    if (f.manaRegen && v && v.mana != null) v.mana = Math.min(this.maxMana(), v.mana + dt * (2 + P.level * 0.04) * f.manaRegen);
    if (f.ward && (P.shield || 0) <= 0 && (this._wardAt || 0) <= this.time) { P.shield = 20 + 18 * f.ward; P.shieldT = 0; this._wardAt = this.time + Math.max(10, 22 - 2 * f.ward); FX.ring(P.x, P.y, 12, 30, '#78c8ff', 0.3, 3); }
  };
})();

// =============== skill mastery: progress bars for every skill ===============
const MAST_AT = [0, 6, 16, 32, 54, 82, 118, 164, 220, 290];
const mastLv = xp => { let l = 1; for (let i = 1; i < MAST_AT.length; i++) if (xp >= MAST_AT[i]) l = i + 1; return l; };
const MAST_BONUS = 0.04;
G.mast = function (key) { const s = this.v10 && this.v10.sk; const xp = (s && s[key]) || 0, lv = mastLv(xp); return { xp, lv, from: MAST_AT[lv - 1], to: MAST_AT[lv] ?? null, bonus: (lv - 1) * MAST_BONUS }; };
G.mastAdd = function (key, n, name) {
  const v = this.v10; if (!v) return;
  const b = this.mast(key).lv; v.sk[key] = (v.sk[key] || 0) + n;
  const a = this.mast(key);
  if (a.lv > b) { this.toast(`✦ ${name} đạt Thông thạo ${a.lv}/${MAST_AT.length}: sức mạnh +${Math.round(a.bonus * 100)}%`, 'quest'); const P = this.player; FX.pillar(P.x, P.y, '#9fe8ff', 1, 30); Sound.play('sfx_achievement', 0.5, 1.2); }
};
(function () {
  const withBonus = (key, fn) => {
    const P = G.player, ex = G.mast(key).bonus / 0.3, was = P.perks.skill || 0;
    P.perks.skill = was + ex;
    try { return fn(); } finally { if (was) P.perks.skill = was; else delete P.perks.skill; }
  };
  const cv = G.castV6;
  G.castV6 = function (i) { const r = withBonus('s' + i, () => cv.call(this, i)); this.mastAdd('s' + i, 1, skName(SKILLS[i])); return r; };
  const cs = G.castSkill;
  G.castSkill = function () {
    const P = this.player, e0 = P.energy;
    const r = withBonus('ult', () => cs.call(this));
    if (e0 >= 100 && P.energy < e0 - 40) this.mastAdd('ult', 3, RL.skill.name);
    return r;
  };
  // progress shown on the Skills tab
  const bi = UI.buildInv;
  UI.buildInv = function () {
    bi.call(this);
    if (this.invTab !== 'skills') return;
    const cards = $('invBody').querySelectorAll('.petc');
    const bar = key => { const m = G.mast(key); return `<div class="mast"><span>Thông thạo ${m.lv}/${MAST_AT.length}${m.bonus ? ` • +${Math.round(m.bonus * 100)}% sức mạnh` : ''}</span><i style="width:${m.to == null ? 100 : Math.round((m.xp - m.from) / (m.to - m.from) * 100)}%"></i><small>${m.to == null ? 'Đã đạt tối đa' : `${m.xp - m.from}/${m.to - m.from} lần dùng tới cấp sau`}</small></div>`; };
    if (cards[0]) cards[0].insertAdjacentHTML('beforeend', bar('ult'));
    SKILLS.forEach((s, i) => { const c = cards[i + 1]; if (c && G.v6.skills[i]) c.insertAdjacentHTML('beforeend', bar('s' + i)); });
    $('invBody').insertAdjacentHTML('beforeend', '<p class="muted">Thông thạo: mỗi lần dùng kỹ năng được 1 điểm (tuyệt kỹ [Q] được 3 điểm), tối đa 10 cấp, mỗi cấp +4% sức mạnh. Bậc ★ chỉ tăng khi triệu hồi trúng kỹ năng trùng.</p>');
  };
})();
