// ===== v22craft: thu thập (cây, bụi, đá, tủ, quái), công cụ, trạm chế tạo, công thức (gói CR) =====
// Bọc: G.chopTime, G.fellTree (v14); G.startAction, G.lootProp, G.killEnemy, G.canCraft, G.craft, G.useItem (game/v3/v21);
//      Loot.stats, Loot.iconOf (loot.js). Thay UI.buildCraft (ui.js:347); bọc UI.showScreen để xóa UI.craftStation khi rời mục chế tạo.
// Công cụ = vũ khí cận chiến có w.tool = {id, chop, mine, dm}. Phải cầm ở ô melee mới dùng được (không cầm gì = tay không, cấp 0).
// G.toolTier(kind): cấp 0..3 (0 = tay không).  G.toolMul(kind): TỐC ĐỘ (lớn hơn = nhanh hơn).
// Tay không / vũ khí thường: chặt 0.4 (×2.5 thời gian), đào đá 0.5 (×2) CHỈ khi G.isSurvival() là true; chế độ cổ điển = 1 (như cũ). Công cụ luôn có tác dụng.
// G.nearStation(kind, r): có trạm kind gần (G.buildNear(kind, r) nếu gói xây dựng đã có), hoặc đang mở đúng trạm đó (UI.craftStation).
(function () {
  const ST_R = 120;
  const STATION = { bench: 'Bàn chế tạo', furnace: 'Lò nung' };
  // tốc độ theo cấp [tay không, cấp 1, cấp 2, cấp 3]. Rìu rơi từ quái giữ như v14 (xem G.toolMul).
  const SPD = { chop: [0.4, 1, 1 / 0.6, 1 / 0.4], mine: [0.5, 1, 1 / 0.7, 2] };
  // công cụ: chop/mine = cấp; dm = hệ số sát thương (thấp hơn đồ rơi cùng cấp); mt = kiểu vũ khí cận chiến (MELEE_TYPES)
  const TOOLS = {
    club:         { name: 'Gậy gỗ', mt: 'hammer', chop: 1, mine: 0, dm: 0.55, icon: 'i22_club', fb: 'i_planks' },
    axe_stone:    { name: 'Rìu đá', mt: 'axe', chop: 2, mine: 0, dm: 0.6, icon: 'i22_axe_stone', fb: 'i_scrap' },
    pick_stone:   { name: 'Cuốc đá', mt: 'spear', chop: 0, mine: 1, dm: 0.55, icon: 'i22_pick_stone', fb: 'i_scrap' },
    spear_stone:  { name: 'Giáo đá', mt: 'spear', chop: 0, mine: 0, dm: 0.65, icon: 'i22_spear_stone', fb: 'i_scrap' },
    axe_iron:     { name: 'Rìu sắt', mt: 'axe', chop: 3, mine: 0, dm: 0.7, icon: 'i22_axe_iron', fb: 'i_scrap' },
    pick_iron:    { name: 'Cuốc sắt', mt: 'spear', chop: 0, mine: 2, dm: 0.7, icon: 'i22_pick_iron', fb: 'i_scrap' },
    sword_iron:   { name: 'Kiếm sắt', mt: 'sword', chop: 0, mine: 0, dm: 0.85, icon: 'i22_sword_iron', fb: 'i_scrap' },
    pick_crystal: { name: 'Cuốc tinh thể', mt: 'spear', chop: 0, mine: 3, dm: 0.8, icon: 'i22_pick_crystal', fb: 'i_scrap' },
  };
  // giáp chế tạo: không ngẫu nhiên, không hiệu ứng phụ (armor = giá trị giáp cố định)
  const ARMORS = {
    leather_body: { name: 'Giáp da', slot: 'body', armor: 12, icon: 'i22_armor_leather' },
    leather_head: { name: 'Mũ da', slot: 'head', armor: 6, icon: 'i22_helm_leather' },
    iron_body:    { name: 'Giáp sắt', slot: 'body', armor: 16, icon: 'i22_armor_iron' },
  };

  // icon đọc lúc dùng (IMG nạp bất đồng bộ): i22_* khi đã có, không thì icon cũ
  const withIcon = (def, key, fb) => { Object.defineProperty(def, 'icon', { get: () => spr22(key, fb), enumerable: true, configurable: true }); return def; };
  const itmName = id => { const d = itm(id); return d ? d.name : id; };

  // ---------- vật phẩm mới ----------
  const MATS = [
    ['stick', 'Que gỗ', 'Nguyên liệu rào, đuốc và công cụ.', 'i22_stick', 'i_planks'],
    ['fiber', 'Sợi cỏ', 'Lấy từ bụi cây. Dùng làm dây và đuốc.', 'i22_fiber', 'i_planks'],
    ['stone', 'Đá', 'Vật liệu xây và chế tạo.', 'i22_stone', 'i_scrap'],
    ['flint', 'Đá lửa', 'Mũi nhọn cho giáo và chông.', 'i22_flint', 'i_scrap'],
    ['ore_iron', 'Quặng sắt', 'Nung trong Lò nung để có thỏi sắt.', 'i22_ore_iron', 'i_scrap'],
    ['ingot', 'Thỏi sắt', 'Vật liệu công cụ và giáp sắt.', 'i22_ingot', 'i_scrap'],
    ['leather', 'Da thú', 'Lấy từ thú và quái. Chế giáp da.', 'i22_leather', 'i_scrap'],
    ['bone', 'Xương', 'Lấy từ thây ma và xương quái.', 'i22_bone', 'i_scrap'],
    ['cloth', 'Vải', 'Lấy từ tủ quần áo. Dùng cho giường.', 'i22_cloth', 'i_scrap'],
    ['mcore', 'Lõi quái', 'Lấy từ quái tinh anh và thủ lĩnh.', 'i22_mcore', 'i_scrap'],
    ['rope', 'Dây thừng', 'Dùng cho công cụ bằng đá.', 'i22_rope', 'i_planks'],
  ];
  for (const [id, name, desc, key, fb] of MATS) ITEMS[id] = withIcon({ name, kind: 'mat', desc }, key, fb);
  ITEMS.food_cooked = withIcon({ name: 'Thịt nướng', kind: 'use', desc: 'No +60, hồi 10 máu. Nấu ở Lò nung.' }, 'i22_food_cooked', 'i_food');
  REALM_ITEMS.tt.ore_iron = { name: 'Huyền thiết khoáng' };
  REALM_ITEMS.tt.ingot = { name: 'Huyền thiết' };
  REALM_ITEMS.tt.mcore = { name: 'Yêu đan vụn' };
  REALM_ITEMS.sl.mcore = { name: 'Lõi ma thú' };

  // công cụ (vũ khí cận chiến) và giáp: chỉ hiện trong công thức/nhãn; không bao giờ nằm trong P.inv
  for (const id in TOOLS) {
    const T = TOOLS[id], what = [T.chop ? `chặt cây cấp ${T.chop}` : '', T.mine ? `đào đá cấp ${T.mine}` : ''].filter(Boolean).join(', ');
    ITEMS['tl_' + id] = withIcon({ name: T.name, kind: 'tool', desc: what ? `Công cụ: ${what}. Cầm ở ô vũ khí cận chiến.` : 'Vũ khí cận chiến, không phải công cụ.' }, T.icon, T.fb);
  }
  for (const id in ARMORS) {
    const A = ARMORS[id];
    ITEMS['ar_' + id] = withIcon({ name: A.name, kind: 'gear', desc: `${ARMOR_SLOT_LABEL[A.slot]} • Giáp ${A.armor}. Mặc ở ô trang bị.` }, A.icon, 'i_scrap');
  }

  // vật đặt được (gói BD xử lý đặt): icon b22_* theo thế giới (md/sl dùng mod, tt dùng tt)
  const PL_DESC = 'Vật đặt được: mở chế độ xây [B] rồi chọn trong thanh dưới.';
  const PL_WORLD = [
    ['pl_bench', 'Bàn chế tạo', 'bench', 'i_planks'],
    ['pl_furnace', 'Lò nung', 'furnace', 'i_scrap'],
    ['pl_chest', 'Rương', 'chest', 'i_planks'],
    ['pl_bed', 'Giường', 'bed', 'i_planks'],
    ['pl_door', 'Cửa', 'door', 'i_planks'],
    ['pl_wall_wood', 'Tường gỗ', 'wall_wood', 'i_planks'],
    ['pl_wall_stone', 'Tường đá', 'wall_stone', 'i_scrap'],
    ['pl_wall_metal', 'Tường kim loại', 'wall_metal', 'i_scrap'],
    ['pl_tparray', 'Trận dịch chuyển', 'tparray', 'i_scrap'],
    ['pl_defarray', 'Trận phòng thủ', 'defarray', 'i_scrap'],
  ];
  for (const [id, name, k, fb] of PL_WORLD) {
    ITEMS[id] = withIcon({ name, kind: 'place', desc: PL_DESC }, 'b22_mod_' + k, fb);
    REALM_ITEMS.tt[id] = withIcon({}, 'b22_tt_' + k, fb);
  }
  const PL_PLAIN = [
    ['pl_floor', 'Sàn gỗ', 'b22_floor_wood', 'i_planks'],
    ['pl_torch', 'Đuốc', 'b22_torch', 'i_planks'],
    ['pl_campfire', 'Lửa trại', 'b22_campfire', 'i_planks'],
    ['pl_fence', 'Hàng rào', 'b22_fence', 'i_planks'],
    ['pl_spikes', 'Chông', 'b22_spikes', 'i_scrap'],
  ];
  for (const [id, name, key, fb] of PL_PLAIN) ITEMS[id] = withIcon({ name, kind: 'place', desc: PL_DESC }, key, fb);

  // ---------- công thức: tay (mọi nơi) / bàn chế tạo (st 'bench') / lò nung (st 'furnace') ----------
  RECIPES.push(
    { out: 'stick', n: 4, need: { planks: 1 } },
    { out: 'pl_torch', n: 2, need: { stick: 1, fiber: 1 } },
    { out: 'rope', n: 1, need: { fiber: 3 } },
    { out: 'pl_bench', n: 1, need: { planks: 4 } },
    { out: 'tl_club', n: 1, need: { planks: 2, stick: 1 }, tool: 'club' },
    { out: 'pl_campfire', n: 1, need: { stone: 3, stick: 2 } },
    { out: 'tl_axe_stone', n: 1, need: { stone: 3, stick: 2, rope: 1 }, st: 'bench', tool: 'axe_stone' },
    { out: 'tl_pick_stone', n: 1, need: { stone: 3, stick: 2, rope: 1 }, st: 'bench', tool: 'pick_stone' },
    { out: 'tl_spear_stone', n: 1, need: { flint: 1, stick: 2, rope: 1 }, st: 'bench', tool: 'spear_stone' },
    { out: 'pl_furnace', n: 1, need: { stone: 8 }, st: 'bench' },
    { out: 'pl_chest', n: 1, need: { planks: 8 }, st: 'bench' },
    { out: 'pl_bed', n: 1, need: { planks: 3, cloth: 3 }, st: 'bench' },
    { out: 'pl_door', n: 1, need: { planks: 6 }, st: 'bench' },
    { out: 'pl_wall_wood', n: 2, need: { planks: 4 }, st: 'bench' },
    { out: 'pl_wall_stone', n: 2, need: { stone: 4 }, st: 'bench' },
    { out: 'pl_floor', n: 4, need: { planks: 2 }, st: 'bench' },
    { out: 'pl_fence', n: 3, need: { stick: 4 }, st: 'bench' },
    { out: 'pl_spikes', n: 1, need: { stick: 3, flint: 1 }, st: 'bench' },
    { out: 'ar_leather_body', n: 1, need: { leather: 6 }, st: 'bench', armor: 'leather_body' },
    { out: 'ar_leather_head', n: 1, need: { leather: 4 }, st: 'bench', armor: 'leather_head' },
    { out: 'tl_axe_iron', n: 1, need: { ingot: 3, stick: 2 }, st: 'bench', tool: 'axe_iron' },
    { out: 'tl_pick_iron', n: 1, need: { ingot: 3, stick: 2 }, st: 'bench', tool: 'pick_iron' },
    { out: 'tl_sword_iron', n: 1, need: { ingot: 4, stick: 1 }, st: 'bench', tool: 'sword_iron' },
    { out: 'ar_iron_body', n: 1, need: { ingot: 8, leather: 2 }, st: 'bench', armor: 'iron_body' },
    { out: 'pl_wall_metal', n: 2, need: { ingot: 2 }, st: 'bench' },
    { out: 'tl_pick_crystal', n: 1, need: { ingot: 2, cry_B: 3, stick: 2 }, st: 'bench', tool: 'pick_crystal' },
    { out: 'pl_tparray', n: 1, need: { mcore: 3, cry_C: 3, stone: 20, ingot: 4 }, st: 'bench' },
    { out: 'pl_defarray', n: 1, need: { mcore: 2, cry_D: 4, ingot: 6, stone: 10 }, st: 'bench' },
    { out: 'ingot', n: 1, need: { ore_iron: 1, planks: 1 }, st: 'furnace' },
    { out: 'food_cooked', n: 1, need: { food: 1, planks: 1 }, st: 'furnace' },
  );

  // ---------- công cụ đang cầm: cấp, tốc độ, trạm ----------
  const held = () => (G.player && G.player.equip ? G.player.equip.melee : null);
  // rìu rơi từ quái (không phải công cụ chế tạo): chặt nhanh gấp đôi, như v14
  const isDropAxe = w => !!w && !w.tool && w.mtype != null && !!MELEE_TYPES[w.mtype] && MELEE_TYPES[w.mtype].id === 'axe';
  G.toolTier = function (kind) {
    const w = held(); if (!w) return 0;
    if (w.tool) return w.tool[kind] || 0;
    return kind === 'chop' && isDropAxe(w) ? 2 : 0;
  };
  // chế độ sinh tồn (G.isSurvival) mới phạt tay không; cổ điển giữ tốc độ cũ
  const surv = () => typeof G.isSurvival === 'function' && !!G.isSurvival();
  G.toolMul = function (kind) {
    if (kind === 'chop' && isDropAxe(held())) return 2;
    const t = Math.min(3, G.toolTier(kind));
    if (t === 0) return surv() ? (SPD[kind] || SPD.mine)[0] : 1;
    return (SPD[kind] || SPD.mine)[t];
  };
  G.nearStation = function (kind, r) {
    if (typeof G.buildNear === 'function') { let b = null; try { b = G.buildNear(kind, r || ST_R); } catch (e) { b = null; } if (b) return true; }
    return UI.craftStation === kind;
  };

  // ---------- thu thập: chặt cây, bụi, đá, tủ ----------
  const ct0 = G.chopTime;
  G.chopTime = function () { const fx = this.pfx ? this.pfx() : { wood: 0 }; return 2.6 / G.toolMul('chop') * Math.max(0.35, 1 - 0.25 * fx.wood); };
  const ft0 = G.fellTree;
  G.fellTree = function (p, by) { ft0.call(this, p, by); if (!by) this.give('stick', R.int(1, 2)); };
  const sa0 = G.startAction;
  G.startAction = function (a) { if (a && a.kind === 'loot' && a.prop && a.prop.container === 'rock') a.dur = a.dur / G.toolMul('mine'); return sa0.call(this, a); };
  const lp0 = G.lootProp;
  G.lootProp = function (p) {
    if (!p || p.looted) return lp0.call(this, p);
    if (p.container === 'bush') {
      const r = lp0.call(this, p);
      if (p.looted && Math.random() < 0.45) Items.drop(p.x, p.y, 'fiber', 1);
      return r;
    }
    if (p.container === 'rock') {
      const tool = G.toolTier('mine'), r = lp0.call(this, p);
      if (p.looted) {
        // tay không chỉ 1 đá, nhưng chỉ ở chế độ sinh tồn; cổ điển giữ 2-4 như cũ
        Items.drop(p.x, p.y, 'stone', tool || !surv() ? R.int(2, 4) : 1);
        if (Math.random() < 0.2) Items.drop(p.x, p.y, 'flint', 1);
        if (tool >= 1 && Math.random() < 0.15) Items.drop(p.x, p.y, 'ore_iron', 1);
      }
      return r;
    }
    if (p.container === 'armor') {   // tủ quần áo (v21world): thêm vải
      const r = lp0.call(this, p);
      if (p.looted && Math.random() < 0.6) Items.drop(p.x, p.y, 'cloth', R.int(1, 2));
      return r;
    }
    return lp0.call(this, p);
  };

  // ---------- rơi từ quái: xương, da, lõi quái ----------
  const BEAST = ['runner', 'brute'], UNDEAD = ['walker', 'armored', 'exploder', 'ranged'];
  function dropCraft(z) {
    const x = z.x, y = z.y;
    if (z.boss) { Items.drop(x, y, 'mcore', z.mini ? 1 : 3); return; }   // thủ lĩnh ×3, tiểu thủ lĩnh 100%
    const beast = !!z.beast || BEAST.includes(z.arche);
    const undead = !!z.undead || UNDEAD.includes(z.arche);
    if (undead && !beast && Math.random() < 0.35) Items.drop(x, y, 'bone', 1);
    if (beast && Math.random() < 0.30) Items.drop(x, y, 'leather', 1);
    if (z.elite && Math.random() < 0.25) Items.drop(x, y, 'mcore', 1);
  }
  const ke0 = G.killEnemy;
  G.killEnemy = function (z, src) {
    const r = ke0.call(this, z, src);
    if (z && !z._cr22) { z._cr22 = true; dropCraft(z); }
    return r;
  };

  // ---------- chế tạo: trạm, công cụ, giáp ----------
  const imgSrc = k => { const im = IMG[k] || IMG.i_scrap; return im ? im.src : ''; };
  function makeTool(id) {
    const T = TOOLS[id], w = Loot.weapon('melee', 1, 0, MELEE_TYPES.findIndex(m => m.id === T.mt));
    w.name = itmName('tl_' + id);
    w.tool = { id, chop: T.chop, mine: T.mine, dm: T.dm };
    w.craftIcon = T.icon;
    return w;
  }
  function makeArmor(id) {
    const A = ARMORS[id], a = Loot.armor(1, 0, A.slot);
    a.affixes = []; a.armor = A.armor; a.name = itmName('ar_' + id); a.craftIcon = A.icon;
    return a;
  }
  const can0 = G.canCraft;
  G.canCraft = function (r) { if (r.st && !G.nearStation(r.st, ST_R)) return false; return can0.call(this, r); };
  const cr0 = G.craft;
  G.craft = function (r) {
    if (!this.canCraft(r)) return;
    if (!r.tool && !r.armor) { cr0.call(this, r); Bus21.emit('craft', r.out, r.n); return; }
    if (this.player.stash.length >= this.stashCap()) { this.toast('Túi đồ đầy, hãy bỏ bớt trang bị trước khi chế tạo.', 'warn'); return; }
    for (const k in r.need) this.take(k, r.need[k]);
    this.stashAdd(r.tool ? makeTool(r.tool) : makeArmor(r.armor));
    Sound.play('sfx_craft', 0.6);
    this.toast(`Chế tạo: ${itmName(r.out)}`, 'good');
    UI.dirty = true;
    Bus21.emit('craft', r.out, 1);
  };
  const ui0 = G.useItem;
  G.useItem = function (id) {
    if (id !== 'food_cooked') return ui0.call(this, id);
    if (!this.has(id)) return;
    const P = this.player;
    this.take(id);
    P.hunger = Math.min(100, P.hunger + 60); P.hp = Math.min(P.maxHp, P.hp + 10);
    Sound.play('sfx_heal', 0.4);
    this.toast('Thịt nướng: no +60, hồi 10 máu.', 'good');
  };

  // ---------- vũ khí công cụ: sát thương thấp hơn, icon riêng ----------
  const st0 = Loot.stats;
  Loot.stats = function (it) { const s = st0.call(this, it); if (s && it && it.tool) s.dmg *= it.tool.dm; return s; };
  const io0 = Loot.iconOf;
  Loot.iconOf = function (it) { if (it && it.craftIcon && IMG[it.craftIcon]) return it.craftIcon; return io0.call(this, it); };

  // ---------- giao diện C: nhóm theo trạm; mở trạm chỉ hiện đúng trạm ----------
  function recipeRow(r) {
    const it = itm(r.out), stOk = !r.st || G.nearStation(r.st, ST_R), ok = G.canCraft(r);
    const row = document.createElement('div');
    row.className = 'recipe' + (ok ? '' : ' no');
    const needs = Object.entries(r.need).map(([k, n]) => {
      const have = G.player.inv[k] || 0, ik = itm(k);
      return `<span class="need ${have >= n ? 'ok' : 'bad'}"><img src="${imgSrc(ik ? ik.icon : 'i_scrap')}" alt="">${esc(ik ? ik.name : k)} ${have}/${n}</span>`;
    }).join('');
    const lock = stOk ? '' : `<small class="cr22-lock">Cần ${STATION[r.st]} gần đó</small>`;
    row.innerHTML = `<img class="ricon" src="${imgSrc(it ? it.icon : 'i_scrap')}" alt=""><div class="rinfo"><b>${esc(it ? it.name : r.out)} x${r.n}</b><small>${esc(it && it.desc || '')}</small>${lock}<div>${needs}</div></div><button ${ok ? '' : 'disabled'}>CHẾ TẠO</button>`;
    const btn = row.querySelector('button');
    this.bindBtn(btn);
    btn.onclick = () => { G.craft(r); this.buildCraft(); };
    return row;
  }
  UI.buildCraft = function () {
    const box = $('craftList'); if (!box) return;
    box.innerHTML = '';
    const only = this.craftStation || null;
    for (const st of only ? [only] : [null, 'bench', 'furnace']) {
      const list = RECIPES.filter(r => (r.st || null) === st);
      if (!list.length) continue;
      const h = document.createElement('div'); h.className = 'cr22-h';
      h.textContent = st ? STATION[st] + (G.nearStation(st, ST_R) ? '' : ' (chưa đứng gần)') : 'Tay (mọi nơi)';
      box.appendChild(h);
      for (const r of list) box.appendChild(recipeRow.call(this, r));
    }
  };
  // rời mục chế tạo thì quên trạm đang mở (lần mở sau bằng phím C là chế tạo tay)
  const ss0 = UI.showScreen;
  UI.showScreen = function (id) { if (id !== 'craft') this.craftStation = null; return ss0.call(this, id); };

  const st = document.createElement('style'); st.id = 'v22craft-css';
  st.textContent = `.cr22-h{margin:12px 0 4px;padding:4px 8px;font-size:22px;color:#f3d98b;border-left:3px solid #c9a24a;background:rgba(201,162,74,.10)}
.cr22-lock{display:block;color:#ff9a7a;font-size:16px}`;
  document.head.appendChild(st);
})();
