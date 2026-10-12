// ===== v21shop (gói M): vật phẩm mới, hàng xoay vòng của thương nhân, Cửa hàng & Thu mua của Hệ thống =====
// Mọi thứ nằm trong một IIFE; chỉ wrap các hàm có sẵn (G.shopStock, UI.buildShop, G.useItem).
(function () {
  // ---------- vật phẩm mới: md = tên gốc trong ITEMS; tt / sl ghi đè trong REALM_ITEMS ----------
  // icon: ảnh vẽ mới i21_<id>_mod (md/sl) hoặc i21_<id>_tt (tt), đọc lúc dùng; chưa nạp được thì dùng icon tạm
  const I21 = { mana_s: ['i_energy', 'tt_i_5'], elixir: ['i_medkit', 'tt_i_0'], bt_pill: ['i_pills', 'tt_i_2'] };
  const i21Icon = id => { const tt = rk(RL.id) === 'tt', name = 'i21_' + id + (tt ? '_tt' : '_mod'); return IMG[name] ? name : I21[id][tt ? 1 : 0]; };
  Object.assign(ITEMS, {
    mana_s:  { name: 'Nước tăng lực xanh', get icon() { return i21Icon('mana_s'); }, kind: 'use', desc: 'Hồi 40% năng lượng tối đa. [dùng]' },
    elixir:  { name: 'Bộ sơ cứu quân y', get icon() { return i21Icon('elixir'); }, kind: 'use', desc: 'Hồi 60% máu tối đa, xóa hiệu ứng làm chậm.' },
    bt_pill: { name: 'Huyết thanh tiến hóa', get icon() { return i21Icon('bt_pill'); }, kind: 'mat', desc: 'Không dùng trực tiếp. Mang theo khi đột phá cảnh giới.' },
  });
  // atlas21 đã đăng ký trong ATLAS6: nạp theo thế giới như các atlas khác (md/sl -> _mod, tt -> _tt)
  const ri21 = realmImages;
  realmImages = function (r) { const out = ri21(r), n = 'atlas21_' + (rk(r) === 'tt' ? 'tt' : 'mod'); if (ATLAS6[n]) out.push(n); return out; };
  Object.assign(REALM_ITEMS.tt, {
    mana_s:  { name: 'Hồi Linh Đan', desc: 'Hồi 40% linh khí tối đa. [dùng]' },
    elixir:  { name: 'Đại Hồi Xuân Đan', desc: 'Hồi 60% máu tối đa, xóa hiệu ứng làm chậm.' },
    bt_pill: { name: 'Thăng Cảnh Đan', desc: 'Không dùng trực tiếp. Mang theo khi thăng cảnh.' },
  });
  Object.assign(REALM_ITEMS.sl, {
    mana_s:  { name: 'Thuốc hồi Mana', desc: 'Hồi 40% Mana tối đa. [dùng]' },
    elixir:  { name: 'Thuốc hồi phục cao cấp', desc: 'Hồi 60% máu tối đa, xóa hiệu ứng làm chậm.' },
    bt_pill: { name: 'Đá Thăng Hạng', desc: 'Không dùng trực tiếp. Mang theo khi thăng hạng.' },
  });
  // giá Lão Phác bán ra ~40% giá mua (cùng tỉ lệ với vật phẩm cũ)
  Object.assign(SELL_PRICE, { elixir: 36, mana_s: 14, bt_pill: 88, bt_a: 12, bt_b: 28 });

  // ---------- hàng của thương nhân ----------
  const BASE21 = { bandage: 20, medkit: 40, pills: 18, elixir: 90, mana_s: 35, food: 14, water: 12, choco: 9, energy: 10,
    grenade: 28, molotov: 30, ammo_pistol: 14, ammo_shell: 18, ammo_rifle: 24,
    scrap: 9, planks: 6, gas: 12, battery: 15, bt_a: 30, bt_b: 70, bt_c: 260,
    scroll: 45, mystery: 150, heart: 260, bt_pill: 220, tmap: 60 };
  const BUNDLE21 = { bandage: 2, food: 2, water: 2, molotov: 2, ammo_pistol: 30, ammo_shell: 12, ammo_rifle: 40 };
  const LIM21 = { heart: 1, mystery: 1, bt_pill: 1, bt_c: 1, tmap: 1, scroll: 2, elixir: 2, bt_b: 2 }; // mặc định 3 món/ngày
  const GROUPS21 = [
    { name: 'Hồi phục', pool: ['bandage', 'medkit', 'pills', 'elixir', 'mana_s'], min: 3, max: 4 },
    { name: 'Ăn uống', pool: ['food', 'water', 'choco', 'energy'], min: 2, max: 3 },
    { name: 'Chiến đấu', pool: ['grenade', 'molotov', 'ammo_pistol', 'ammo_shell', 'ammo_rifle'], min: 2, max: 3 },
    { name: 'Vật liệu', pool: ['scrap', 'planks', 'gas', 'battery', 'bt_a', 'bt_b'], min: 2, max: 3, mat: true },
    { name: 'Đặc biệt', pool: ['scroll', 'mystery', 'heart', 'tmap'], min: 1, max: 2 },
  ];
  const hash21 = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
  const rng21 = seed => () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // mỗi thương nhân (vị trí cố định) có một bộ hàng riêng, đổi theo ngày game; cùng (vị trí, ngày) thì cùng hàng
  const merchKey = a => RL.id + ':' + Math.round(a.x / 16) + ',' + Math.round(a.y / 16);
  function goodsFor(key, day) {
    const rnd = rng21(hash21(key + '|' + day));
    const rint = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
    const pick = (pool, k) => {
      const p = pool.filter(id => ITEMS[id] && BASE21[id] != null), out = [];
      while (out.length < k && p.length) out.push(p.splice(Math.floor(rnd() * p.length), 1)[0]);
      return out;
    };
    const rows = [];
    const add = (id, grp, mat) => rows.push([id, BUNDLE21[id] || (mat ? rint(1, 3) : 1), BASE21[id], LIM21[id] || 3, grp]);
    for (const g of GROUPS21) {
      for (const id of pick(g.pool, rint(g.min, g.max))) add(id, g.name, !!g.mat);
      if (g.mat && ITEMS.bt_c && rnd() < 0.15) add('bt_c', g.name, false);
      if (g.name === 'Đặc biệt' && ITEMS.bt_pill && rnd() < 0.3) add('bt_pill', g.name, false);
    }
    return rows;
  }
  const shopSt = () => (G.v10 ? (G.v10.shop || (G.v10.shop = {})) : {});
  // G.v10.shop[merchKey][id] = số còn lại; G.v10.shopDay[merchKey] = ngày đã reset số đó
  function setGoods(a) {
    const key = merchKey(a), v = G.v10;
    if (v) {
      v.shopDay = v.shopDay || {};
      if (v.shopDay[key] !== G.day) { v.shopDay[key] = G.day; delete shopSt()[key]; }
    }
    SHOP_GOODS.splice(0, SHOP_GOODS.length, ...goodsFor(key, G.day));
  }
  function stockLeft(key, id, lim) {
    const sh = shopSt(); sh[key] = sh[key] || {};
    if (sh[key][id] == null) sh[key][id] = lim;
    return sh[key][id];
  }
  function decorateBuy(a) {
    const box = document.getElementById('shopBody'); if (!box) return;
    const key = merchKey(a), P = G.player;
    let lastGrp = null;
    box.querySelectorAll('[data-buy]').forEach(b => {
      const row = b.closest('.srow'), g = SHOP_GOODS[+b.dataset.buy];
      if (!g || !row) return;
      const [id, n, , lim, grp] = g;
      if (grp !== lastGrp) { row.insertAdjacentHTML('beforebegin', `<div class="m21grp" style="grid-column:1 / -1;color:#ffd23a;margin-top:6px">— ${esc21(grp)} —</div>`); lastGrp = grp; }
      const left = stockLeft(key, id, lim);
      const nm = row.querySelector('.sinfo b');
      if (nm) nm.insertAdjacentHTML('beforeend', ` <small>${left > 0 ? 'còn ' + left : 'hết'}</small>`);
      if (left <= 0) { b.disabled = true; b.textContent = 'HẾT HÀNG'; b.classList.add('dim'); return; }
      b.onclick = () => {
        const now = stockLeft(key, id, lim);
        if (now <= 0) { G.toast('Hàng này đã hết.', 'warn'); return; }
        if (!G.pay(+b.dataset.p)) return;
        if (id === 'heart') G.heartBuys = (G.heartBuys || 0) + 1;
        G.player.inv[id] = (G.player.inv[id] || 0) + n;
        shopSt()[key][id] = now - 1;
        UI.dirty = true; UI.shopSay('buy'); UI.buildShop();
      };
    });
    // trang bị "Hàng hiếm hôm nay": độ hiếm ≥ 3, giảm 20%
    const st = G.shopStock(a), fi = st.findIndex(it => it.uid === (a.stock && a.stock.feat));
    const fb = fi >= 0 ? box.querySelector(`[data-gear="${fi}"]`) : null;
    if (fb) {
      const price = Math.round(Loot.price(st[fi]) * 3 * 0.8), row = fb.closest('.srow');
      fb.dataset.p = price;
      const pe = row && row.querySelector('.price');
      if (pe && pe.lastChild && pe.lastChild.nodeType === 3) pe.lastChild.textContent = price;
      const nm = row && row.querySelector('.sinfo b');
      if (nm) nm.insertAdjacentHTML('beforeend', ' <small style="color:#ffd23a">HÀNG HIẾM −20%</small>');
      fb.classList.toggle('dim', P.gold < price);
    }
  }
  const oBuild = UI.buildShop;
  UI.buildShop = function () {
    const a = this.shopM, buy = !!a && this.shopTab === 'buy';
    if (buy) setGoods(a);
    const r = oBuild.apply(this, arguments);
    if (buy) decorateBuy(a);
    return r;
  };
  // 6 trang bị thường + 1 "Hàng hiếm" (độ hiếm ≥ 3) thay vì 4 trang bị
  const oStock = G.shopStock;
  G.shopStock = function (a) {
    const items = oStock.call(this, a);
    if (a.stock && a.stock.day === this.day && !a.stock.v21) {
      const lvl = Math.max(this.player.level, World.levelAt(a.x, a.y));
      for (let i = 0; i < 2; i++) items.push(Loot.randomGear(lvl, 0.9, 1));
      const feat = Loot.randomGear(lvl, 1.2, 3);
      items.push(feat);
      a.stock.feat = feat.uid; a.stock.v21 = true;
    }
    return items;
  };

  // ---------- dùng vật phẩm mới (G.useItem; v17site.js đã bọc trước đó) ----------
  function useMana() {
    const P = this.player, v = this.v10;
    if (!P || P.dead || !v || !this.has('mana_s')) return;
    const mm = this.maxMana(), before = v.mana == null ? mm : v.mana;
    if (before >= mm) { this.toast(`${manaName()} đang đầy.`, 'info'); return; }
    this.take('mana_s');
    v.mana = Math.min(mm, before + mm * 0.4);
    FX.ring(P.x, P.y, 8, 40, '#7fb0ff', 0.4, 3); Sound.play('sfx_magic', 0.5);
    this.toast(`+${Math.round(v.mana - before)} ${manaName()} (${Math.round(v.mana)}/${mm})`, 'good');
  }
  function useElixir() {
    const P = this.player;
    if (!P || P.dead || !this.has('elixir')) return;
    const slow = P.slowT > 0;
    if (P.hp >= P.maxHp && !slow) { this.toast('Máu đang đầy.', 'info'); return; }
    this.take('elixir');
    const before = P.hp;
    P.hp = Math.min(P.maxHp, P.hp + P.maxHp * 0.6);
    P.slowT = 0;
    FX.pillar(P.x, P.y, '#6dff7a', 1, 30); Sound.play('sfx_heal', 0.6);
    this.toast(`+${Math.round(P.hp - before)} máu${slow ? ', hết làm chậm' : ''}`, 'good');
  }
  const oUse = G.useItem;
  G.useItem = function (id) {
    if (id === 'mana_s') return useMana.call(this);
    if (id === 'elixir') return useElixir.call(this);
    if (id === 'bt_pill') { if (this.has(id)) this.toast(`${itm(id).name}: không dùng trực tiếp, mang theo khi đột phá.`, 'info'); return; }
    return oUse.call(this, id);
  };

  // ---------- Hệ thống: Cửa hàng (mua bằng điểm HT) và Thu mua (bán cho Hệ thống) ----------
  const icon21 = ic => { const im = ic && IMG[ic]; return im ? im.src : ''; };
  const SYS_SHOP21 = [['medkit', 6], ['elixir', 15], ['mana_s', 8], ['scroll', 10], ['bt_pill', 30], ['bt_a', 8], ['bt_b', 20], ['bt_c', 60], ['mystery', 25], ['heart', 80]];
  const SYS_DAILY21 = 3, SELL_PAY21 = 0.6, DECOMP21 = [0, 0, 0, 3, 8, 20];
  const sysDay21 = () => { const sh = shopSt(); if (!sh.sys || sh.sys.day !== today21()) sh.sys = { day: today21(), n: {} }; return sh.sys; };
  const sellVal21 = (each, n) => Math.max(1, Math.round(each * SELL_PAY21 * n));
  const gearVal21 = it => Math.max(1, Math.round(Loot.price(it) * SELL_PAY21));
  const sellable21 = id => !!ITEMS[id] && id !== 'bt_c' && ITEMS[id].kind !== 'quest' && !!(SELL_PRICE[id] || ITEMS[id].kind === 'ammo') && (G.player.inv[id] || 0) > 0;

  function buySys21(id) {
    const row = SYS_SHOP21.find(x => x[0] === id); if (!row) return;
    const st = sysDay21();
    if ((st.n[id] || 0) >= SYS_DAILY21) { SYS.msg(`Hôm nay đã mua đủ ${SYS_DAILY21} lần món này.`, 'warn'); return; }
    if (!G.spPay(row[1])) { SYS.msg(`Không đủ ${spName()} (cần ${row[1]}).`, 'warn'); return; }
    st.n[id] = (st.n[id] || 0) + 1;
    if (id === 'heart') G.heartBuys = (G.heartBuys || 0) + 1;
    G.player.inv[id] = (G.player.inv[id] || 0) + 1; UI.dirty = true;
    SYS.msg(`Đã mua ${itm(id).name}.`, 'info');
    SYS.refresh();
  }
  function sellInv21(id, n) {
    const P = G.player; n = Math.min(n, P.inv[id] || 0); if (n <= 0) return;
    const v = sellVal21(SELL_PRICE[id] || 0.25, n);
    G.take(id, n); G.earn(v);
    SYS.msg(`Đã bán ${n} ${itm(id).name} +${v} ${cur().name}`, 'info'); SYS.refresh();
  }
  function sellGear21(uid, b) {
    const P = G.player, it = P.stash.find(x => x.uid === uid); if (!it) return;
    if (it.rarity >= 3 && !b.dataset.armed) {
      b.dataset.armed = 1; b.textContent = 'CHẮC CHƯA?'; b.classList.add('warn');
      setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = 'BÁN'; b.classList.remove('warn'); } }, 2500);
      return;
    }
    P.stash.splice(P.stash.indexOf(it), 1);
    const v = gearVal21(it); G.earn(v);
    SYS.msg(`Đã bán ${it.name} +${v} ${cur().name}`, 'info'); SYS.refresh();
  }
  function decompose21(uid) {
    const P = G.player, it = P.stash.find(x => x.uid === uid); if (!it) return;
    const sp = DECOMP21[it.rarity] || 0; if (!sp) return;
    P.stash.splice(P.stash.indexOf(it), 1);
    G.spAdd(sp, `phân giải ${it.name}`);
    SYS.refresh();
  }
  function sellCheap21() {
    const P = G.player, list = P.stash.filter(it => it.rarity <= 1); if (!list.length) return;
    let v = 0;
    for (const it of list) { v += gearVal21(it); P.stash.splice(P.stash.indexOf(it), 1); }
    G.earn(v);
    SYS.msg(`Đã bán ${list.length} trang bị thường +${v} ${cur().name}`, 'info'); SYS.refresh();
  }
  SYS.addTab({
    id: 'shop', icon: '🛒', name: 'Cửa hàng', order: 50,
    render(body) {
      const st = sysDay21(), sp = G.sys().sp || 0, spLabel = esc21(spName());
      let h = `<h3>Cửa hàng Hệ thống <small class="muted">— mua bằng ${spLabel}, tối đa ${SYS_DAILY21} lần mỗi món trong ngày</small></h3>`;
      for (const [id, cost] of SYS_SHOP21) {
        const d = itm(id); if (!d) continue;
        const left = SYS_DAILY21 - (st.n[id] || 0), ok = left > 0 && sp >= cost;
        h += `<div class="s21row"><img class="m21ic" src="${icon21(d.icon)}" alt=""><div class="grow"><b>${esc21(d.name)}</b> <span class="muted">${esc21(d.desc || '')}</span><br><small class="muted">Hôm nay còn ${left}/${SYS_DAILY21}</small></div><b>${cost} ${spLabel}</b><button data-m21buy="${id}" ${ok ? '' : 'disabled'}>${left > 0 ? 'MUA' : 'HẾT LƯỢT'}</button></div>`;
      }
      body.innerHTML = h;
      body.querySelectorAll('[data-m21buy]').forEach(b => b.onclick = () => buySys21(b.dataset.m21buy));
    },
  });

  SYS.addTab({
    id: 'sell', icon: '♻', name: 'Thu mua', order: 55,
    render(body) {
      const P = G.player, cn = esc21(cur().name), spLabel = esc21(spName());
      const cheap = P.stash.filter(it => it.rarity <= 1);
      const cheapV = cheap.reduce((s, it) => s + gearVal21(it), 0);
      let h = `<p class="muted">Bán cho Hệ thống với giá ${Math.round(SELL_PAY21 * 100)}% giá Lão Phác, bán được ở bất kỳ đâu. Đồ đang mặc không bán. Trang bị độ hiếm ≥ 3 cần xác nhận hai lần.</p>`;
      h += `<div class="s21row"><div class="grow">Trang bị Thường & Tốt trong túi: <b>${cheap.length}</b> món</div><button data-m21cheap="1" ${cheap.length ? '' : 'disabled'}>BÁN ĐỒ THƯỜNG (+${cheapV} ${cn})</button></div>`;
      h += `<h3>Trang bị trong túi (${P.stash.length}/${G.stashCap()})</h3>`;
      for (const it of P.stash) {
        const r = RARITY[it.rarity], dc = DECOMP21[it.rarity] || 0;
        h += `<div class="s21row"><img class="m21ic" src="${icon21(Loot.iconOf(it))}" alt=""><div class="grow"><b style="color:${r.color}">${esc21(it.name)}</b> <span class="muted">${esc21(r.name)} • Cấp ${it.ilvl}</span></div><b>${gearVal21(it)} ${cn}</b><button data-m21sg="${it.uid}">BÁN</button>${dc ? `<button data-m21dc="${it.uid}">PHÂN GIẢI +${dc} ${spLabel}</button>` : ''}</div>`;
      }
      if (!P.stash.length) h += '<p class="muted">Túi trang bị trống.</p>';
      h += '<h3>Vật phẩm trong túi</h3>';
      const ids = Object.keys(P.inv).filter(sellable21);
      for (const id of ids) {
        const d = itm(id), one = ITEMS[id].kind === 'ammo' ? 10 : 1, each = SELL_PRICE[id] || 0.25;
        h += `<div class="s21row"><img class="m21ic" src="${icon21(d.icon)}" alt=""><div class="grow">${esc21(d.name)} <span class="muted">x${P.inv[id]}</span></div><b>${sellVal21(each, one)} ${cn} / ${one}</b><button data-m21s1="${id}" data-n="${one}">BÁN ${one}</button><button data-m21sa="${id}">BÁN HẾT</button></div>`;
      }
      if (!ids.length) h += '<p class="muted">Không có vật phẩm nào để bán.</p>';
      body.innerHTML = h;
      body.querySelectorAll('[data-m21s1]').forEach(b => b.onclick = () => sellInv21(b.dataset.m21s1, +b.dataset.n));
      body.querySelectorAll('[data-m21sa]').forEach(b => b.onclick = () => sellInv21(b.dataset.m21sa, Infinity));
      body.querySelectorAll('[data-m21sg]').forEach(b => b.onclick = () => sellGear21(+b.dataset.m21sg, b));
      body.querySelectorAll('[data-m21dc]').forEach(b => b.onclick = () => decompose21(+b.dataset.m21dc));
      const ch = body.querySelector('[data-m21cheap]'); if (ch) ch.onclick = sellCheap21;
    },
  });

  const cssEl = document.createElement('style'); cssEl.id = 'v21shop-css';
  cssEl.textContent = '#s21 .m21ic{width:40px;height:40px;object-fit:contain;image-rendering:pixelated;flex:0 0 auto}';
  document.head.appendChild(cssEl);
})();
