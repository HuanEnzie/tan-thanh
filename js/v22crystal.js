// ===== v22crystal (gói CY): tinh thể mana hạng E–S =====
// Tinh thể nằm trong các phòng của Cổng (mỏ 2–4 lần khai thác). Người chơi (E), bóng ở chế độ "Khai thác"
// (đào 3,5 s/viên, đưa thẳng vào túi người chơi) và đồng đội (bật ở tab Đồng đội) đều khai thác được.
// Đổi tinh thể lấy tiền ở tab Hệ thống "Tinh thể" (thương nhân trả ×0,9). Thế giới tt: EXP giết quái ×0,3,
// hấp thụ tinh thể để tu luyện. Lên hạng ở cấp 10/20/30/40/50 cần tinh thể đúng hạng mới.
// State: G.v10.cy = { dep: { 'seed.tầng.x.y': lượt còn lại }, mine: { 'c:<chỉ số đồng đội>' | 'r:<id>': 1 } }
(function () {
  const RK = ['E', 'D', 'C', 'B', 'A', 'S'];
  const rIdx = r => RK.indexOf(r);
  const TT_GRADE = { E: 'Hạ Phẩm', D: 'Trung Phẩm', C: 'Thượng Phẩm', B: 'Cực Phẩm', A: 'Tinh Phách', S: 'Hỗn Độn Tinh Phách' };
  const PRICE = { E: 6, D: 18, C: 50, B: 130, A: 340, S: 900 };          // giá đổi ở tab Hệ thống (× đơn vị tiền thế giới)
  const MERCH = 0.9;                                                     // thương nhân mua với giá × 0,9
  const EXP = [40, 140, 450, 1400, 4200, 12000];                          // EXP hấp thụ (tt), theo hạng
  const TOOL = { E: 0, D: 0, C: 2, B: 2, A: 3, S: 3 };                    // toolTier('mine') tối thiểu
  const RANKUP = { 10: { r: 'D', n: 5 }, 20: { r: 'C', n: 5 }, 30: { r: 'B', n: 5 }, 40: { r: 'A', n: 5 }, 50: { r: 'S', n: 3 } };
  const MINE_T = 2.2, MINE_SH = 3.5, ALLY_LEASH = 420, ALLY_CALM = 300, SHADOW_CALM = 200, KILL_EXP = 0.3;
  const TEAM = { elite: 'Tiểu đội', mini: 'Đại đội', boss: 'Quân đoàn' };   // như ARMY.team (v21army)
  const cyId = r => 'cry_' + r;
  const cyName = r => itm(cyId(r)).name;
  const style = () => (RL.id === 'tt' ? 'tt' : 'mod');
  const cySt = () => G.v10.cy || (G.v10.cy = { dep: {}, mine: {} });
  const rankOfLevel = L => (L >= 50 ? 'S' : L >= 40 ? 'A' : L >= 30 ? 'B' : L >= 20 ? 'C' : L >= 10 ? 'D' : 'E');
  const toolTier = () => (typeof G.toolTier === 'function' ? G.toolTier('mine') : 0) || 0;
  const toolMul = () => (typeof G.toolMul === 'function' ? G.toolMul('mine') : 1) || 1;
  const canMine = r => toolTier() >= TOOL[r];
  const coop = () => typeof Net !== 'undefined' && Net.active && Net.guest;

  // ---------- vật phẩm (tên theo thế giới; icon i22_cry_<hạng>_<mod|tt>, chưa có ảnh thì dùng ui_6) ----------
  const NAME = { md: r => 'Lõi năng lượng cấp ' + r, sl: r => 'Tinh thể mana hạng ' + r, tt: r => 'Linh Thạch ' + TT_GRADE[r] };
  const DESC = 'Lên hạng (cấp 10, 20, 30, 40, 50) cần tinh thể đúng hạng. Đổi tiền ở Hệ thống › Tinh thể.';
  const DESC_TT = 'Hấp thụ để tu luyện [dùng]. Lên hạng cần tinh thể đúng hạng. Đổi tiền ở Hệ thống › Linh thạch.';
  for (const r of RK) {
    ITEMS[cyId(r)] = { name: NAME.sl(r), get icon() { return spr22('i22_cry_' + r + '_' + style(), 'ui_6'); }, kind: 'mat', desc: DESC };
    SELL_PRICE[cyId(r)] = Math.round(PRICE[r] * MERCH);      // thương nhân (v3) trả ×0,9
  }
  for (const w of ['md', 'sl', 'tt']) {
    REALM_ITEMS[w] = REALM_ITEMS[w] || {};
    for (const r of RK) REALM_ITEMS[w][cyId(r)] = { name: NAME[w](r), desc: w === 'tt' ? DESC_TT : DESC };
  }

  // ---------- hạng người chơi: theo cấp (1–9 E, 10–19 D, … 50+ S) ----------
  G.playerRank = function () { return rankOfLevel(this.player ? this.player.level : 1); };

  // ---------- mỏ trong Cổng: 1–3 khối mỗi phòng, theo seed của cổng (không dùng SR để không đổi thế giới cũ) ----------
  const gd = World.genDungeon;
  World.genDungeon = function (sb) {
    gd.call(this, sb);
    const dg = this.dg;
    if (!dg || rIdx(dg.rank) < 0) return;
    if ((sb.sx === 0 && sb.sy === 0) || (sb.sx === dg.bx && sb.sy === dg.by)) return;   // đầu cổng và hang Chủ
    const mx = sb.tx0 + 16, my = sb.ty0 + 16;
    // phòng: ô (±3, ±3) quanh tâm đều là sàn hầm (đường hầm chỉ rộng 3 ô theo một trục)
    const floorT = t => t === T.TILEF || t === T.WOOD;
    if (!floorT(this.get(mx + 3, my + 3)) || !floorT(this.get(mx - 3, my - 3))) return;
    const hh = (k, j) => h3(sb.sx * 8 + j, sb.sy * 8 + k, (dg.seed | 0) * 37 + dg.floor * 1009 + 17);
    const n = 1 + Math.floor(hh(0, 0) * 3), dep = G.v10 ? cySt().dep : {};
    const base = rIdx(dg.rank);
    for (let k = 0; k < n; k++) {
      const tx = mx + Math.floor(hh(k, 1) * 9) - 4, ty = my + Math.floor(hh(k, 2) * 9) - 4;
      if (!this.free(tx, ty, 1)) continue;
      const u = hh(k, 3), ri = Math.max(0, Math.min(5, u < 0.75 ? base : u < 0.87 ? base + 1 : base - 1)), r = RK[ri];
      const uses = 2 + Math.floor(hh(k, 4) * 3), key = dg.seed + '.' + dg.floor + '.' + tx + '.' + ty;
      const left = dep[key] != null ? dep[key] : uses;
      const p = this.addProp(spr22('n22_cry_' + r + '_' + style(), 'b_crystal'), tx * TILE + 16, ty * TILE + 16,
        { solid: true, container: 'cry22', kind: 'cry22', light: 50, lightCol: 'cyan', data: { rank: r, left, uses, key } });
      if (left <= 0) p.cull = true;                  // đã khai thác cạn ở lần trước
    }
  };

  // một lần khai thác: người chơi 1–2 viên, bóng/đồng đội 1 viên; hết lượt thì mỏ biến mất
  function cyDig(p, who) {
    const d = p.data, r = d.rank;
    const n = who === 'player' ? 1 + (Math.random() < 0.5 ? 1 : 0) : 1;
    d.left -= 1;
    G.give(cyId(r), n);
    if (G.v10) cySt().dep[d.key] = d.left;
    Particles.burst(p.x, p.y, 12, '#8fe9ff', 130); Sound.play('sfx_freeze', 0.4, 1.5);
    if (d.left <= 0) { World.removeProp(p); G.toast('Mỏ tinh thể đã cạn.', 'info'); }
    Bus21.emit('mine', r);
  }

  // ---------- người chơi: nhấn E ở mỏ = khai thác (cần cuốc đủ tốt) ----------
  const fi = G.findInteract;
  G.findInteract = function () {
    const it = fi.call(this);
    if (it && it.kind === 'loot' && it.prop && it.prop.kind === 'cry22') {
      const d = it.prop.data;
      it.label = `Khai thác tinh thể hạng ${d.rank} (còn ${d.left} lần)${canMine(d.rank) ? '' : ' • cần cuốc tốt hơn'}`;
    }
    return it;
  };
  const ia = G.interact;
  G.interact = function (it) {
    if (it && it.kind === 'loot' && it.prop && it.prop.kind === 'cry22' && !this.action) {
      const p = it.prop, r = p.data.rank;
      if (!canMine(r)) { this.toast(`Cần cuốc tốt hơn để khai thác tinh thể hạng ${r}.`, 'warn'); return; }
      return this.startAction({ kind: 'loot', prop: p, label: 'Khai thác tinh thể', dur: MINE_T / toolMul() });
    }
    return ia.call(this, it);
  };
  const lp = G.lootProp;
  G.lootProp = function (p) {
    if (p && p.kind === 'cry22') { if (!p.dead && p.data.left > 0) cyDig(p, 'player'); return; }
    return lp.call(this, p);
  };

  // ---------- bóng và đồng đội: một bước của việc khai thác (false = để AI thường hành động) ----------
  function mineStep(a, dt, leash, calm) {
    const P = G.player;
    if (a.aqua || a.nearestEnemy(calm)) { a.mineP = null; a.mineT = 0; return false; }
    let p = a.mineP;
    if (!p || p.dead || p.data.left <= 0) {
      p = a.mineP = null; a.mineT = 0;
      a.mineScan = (a.mineScan || 0) - dt;
      if (a.mineScan > 0) return false;
      a.mineScan = 0.6;
      let bd = 1e9;
      for (const q of World.propsNear(a.x, a.y, 620, a._cyq || (a._cyq = []))) {
        if (q.kind !== 'cry22' || q.dead || q.data.left <= 0 || !canMine(q.data.rank)) continue;
        if (dist(q.x, q.y, P.x, P.y) > leash) continue;
        if (q._by && q._by !== a && !q._by.dead) continue;
        const d = dist(q.x, q.y, a.x, a.y); if (d < bd) { bd = d; p = q; }
      }
      if (!p) return false;
      p._by = a; a.mineP = p;
    }
    const dx = p.x - a.x, dy = p.y - a.y, d = Math.hypot(dx, dy);
    a.hurtT -= dt; a.cool -= dt; a.angle = Math.atan2(dy, dx);
    if (d > 34) {
      a.vx = lerp(a.vx, dx / d * 230, Math.min(1, dt * 6)); a.vy = lerp(a.vy, dy / d * 230, Math.min(1, dt * 6));
      a.x += a.vx * dt; a.y += a.vy * dt; a.walkT += dt * Math.hypot(a.vx, a.vy) * 0.08;
      return true;
    }
    const t0 = a.mineT || 0;
    a.mineT = t0 + dt; a.vx = a.vy = 0;
    a.lunge = Math.max(a.lunge || 0, Math.sin(a.mineT * 12) > 0.6 ? 0.5 : 0);
    if (Math.floor(a.mineT / 0.6) !== Math.floor(t0 / 0.6)) Particles.debris(p.x, p.y, 3, '#8fe9ff');
    if (a.mineT >= MINE_SH) { a.mineT = 0; a.mineP = null; if (!p.dead && p.data.left > 0 && canMine(p.data.rank)) cyDig(p, 'ally'); }
    return true;
  }
  const cyAllyKey = a => {
    if (a.kind === 'comp' && a.comp && a.comp.ref) { const i = G.companions.indexOf(a.comp.ref); return i >= 0 ? 'c:' + i : null; }
    if (a.kind === 'merc' && a.rc) return 'r:' + a.rc.id;
    return null;
  };
  const cyAllyOn = a => { const k = cyAllyKey(a); return !!(k && G.v10 && cySt().mine[k]) && !a.home; };
  const au = Ally.prototype.update;
  Ally.prototype.update = function (dt) {
    if (!this.dead && !this.riseWait && World.mode === 'dungeon' && !coop()) {
      if (this.kind === 'shadow' && this.sid) {
        const s = G.shById(this.sid);
        if (s && s.mode === 'mine' && mineStep(this, dt, G.shLeash(), SHADOW_CALM)) return;
      } else if (cyAllyOn(this) && mineStep(this, dt, ALLY_LEASH, ALLY_CALM)) return;
    }
    return au.call(this, dt);
  };

  // ---------- Binh đoàn bóng: chế độ "Khai thác" cho từng bóng và cho cả đội ----------
  function cyShadowMine(s) {
    s.mode = 'mine';
    const a = G.shadowAlly(s); if (a) { a.mineP = null; a.mineT = 0; a.chopP = null; a.lootIt = null; }
  }
  // the head plus everyone under it (lead chain), as the team card shows them
  function cyTeamMine(id) {
    const head = G.shById(id); if (!head || !G.v10) return;
    const mem = [head];
    for (let i = 0; i < mem.length; i++) for (const q of G.v10.shadows) if (q.lead === mem[i].id) mem.push(q);
    for (const s of mem) cyShadowMine(s);
    G.toast(`⛏ ${TEAM[head.tier] || 'Đội'} ${head.nick || head.name}: ${mem.length} bóng khai thác tinh thể.`, 'info');
  }
  // Binh đoàn (v11ui): nút "Khai thác" cạnh các chế độ của từng bóng; chữ "chiến đấu" trên dòng trạng thái đổi thành "khai thác"
  const bsh = UI.buildShadows;
  UI.buildShadows = function () {
    bsh.call(this);
    const box = document.getElementById('invBody'); if (!box || !G.v10) return;
    box.querySelectorAll('[data-sm]').forEach(b => {
      const cont = b.parentElement; if (!cont || cont.querySelector('[data-cy-sm]')) return;
      const s = G.shById(+b.dataset.sm.split(':')[0]); if (!s) return;
      cont.insertAdjacentHTML('beforeend', `<button class="${s.mode === 'mine' ? 'on' : 'ghost'}" data-cy-sm="${s.id}">⛏ Khai thác</button>`);
      const nb = cont.lastElementChild; UI.bindBtn(nb);
      nb.onclick = () => { cyShadowMine(s); UI.buildInv(); };
      const card = nb.closest('.pc10'), ps = card && card.querySelector('.pstat');
      if (ps && s.mode === 'mine' && G.shadowAlly(s)) ps.textContent = ps.textContent.replace('chiến đấu', 'khai thác');
    });
  };
  // tab Binh đoàn (v21army): nút "Khai thác" trên mỗi đội; "Ra trận undefined" (chế độ mới chưa có tên) -> "Ra trận Khai thác"
  const armyTab = SYS.tabs.find(t => t.id === 'army');
  if (armyTab) {
    const r0 = armyTab.render;
    armyTab.render = function (body) {
      r0.call(this, body);
      if (!G.v10) return;
      body.querySelectorAll('.a21r').forEach(row => {
        const b = row.querySelector('[data-id]'), s = b && G.shById(+b.dataset.id), st = row.querySelector('.st');
        if (s && s.mode === 'mine' && st && st.textContent.includes('undefined')) st.textContent = st.textContent.replace('undefined', 'Khai thác');
      });
      body.querySelectorAll('.a21card').forEach(card => {
        const ob = card.querySelector('[data-a="order"]'), acts = card.querySelector('.a21acts');
        const head = ob && G.shById(+ob.dataset.id);
        if (!head || !acts) return;
        acts.insertAdjacentHTML('beforeend', `<button data-cy-team="${head.id}">⛏ Khai thác</button>`);
        const nb = acts.lastElementChild; UI.bindBtn(nb);
        nb.onclick = () => { cyTeamMine(head.id); SYS.refresh(); };
      });
    };
  }
  // menu "Phân công" của đội (v21army): thêm "Chế độ Khai thác" trước "Gọi cả đội về"
  const md = UI.menuDialog;
  UI.menuDialog = function (o) {
    if (o && Array.isArray(o.options) && G.v10 && o.options.some(x => x.text === 'Gọi cả đội về')) {
      const head = G.v10.shadows.find(s => s.tier !== 'normal' && s.lead == null && `${TEAM[s.tier]} ${s.nick || s.name}` === o.name);
      if (head) { const i = o.options.findIndex(x => x.text === 'Gọi cả đội về'); o.options.splice(i, 0, { text: 'Chế độ Khai thác', act: () => cyTeamMine(head.id) }); }
    }
    return md.call(this, o);
  };

  // ---------- Đồng đội (v10ui, tab Đồng đội): nút "Khai thác" trên thẻ mỗi người đi theo ----------
  const bp = UI.buildParty;
  UI.buildParty = function () {
    bp.call(this);
    const box = document.getElementById('invBody'); if (!box || !G.v10) return;
    box.querySelectorAll('[data-cf],[data-rf]').forEach(b => {
      const key = b.dataset.cf != null ? 'c:' + b.dataset.cf : 'r:' + b.dataset.rf, pb = b.parentElement;
      if (!pb || pb.querySelector('[data-cy-mine]')) return;
      const on = !!cySt().mine[key];
      pb.insertAdjacentHTML('beforeend', `<button class="${on ? 'on' : 'ghost'}" data-cy-mine="${key}">⛏ ${on ? 'Đang khai thác' : 'Khai thác'}</button>`);
      const nb = pb.lastElementChild; UI.bindBtn(nb);
      nb.onclick = () => {
        if (cySt().mine[key]) delete cySt().mine[key]; else cySt().mine[key] = 1;
        G.toast(cySt().mine[key] ? '⛏ Đồng đội sẽ tự khai thác tinh thể gần đó khi không có quái trong 300 px.' : 'Đồng đội ngừng khai thác.', 'info');
        UI.buildInv();
      };
    });
  };

  // ---------- tu tiên (tt): EXP giết quái ×0,3 ----------
  const ke = G.killEnemy;
  G.killEnemy = function (z, src) {
    if (RL.id !== 'tt') return ke.call(this, z, src);
    const was = this._cyKill; this._cyKill = true;
    try { return ke.call(this, z, src); } finally { this._cyKill = was; }
  };
  const ax = G.addXp;
  G.addXp = function (n) { return ax.call(this, RL.id === 'tt' && this._cyKill ? n * KILL_EXP : n); };

  // ---------- tu tiên (tt): hấp thụ tinh thể (kênh 1 giây) ----------
  G.cyAbsorb = function (r) {
    if (RL.id !== 'tt' || !this.player || this.player.dead) return;
    if (G.state === 'menu' && UI.closePanel) UI.closePanel();
    if (!this.has(cyId(r))) { this.toast(`Không có ${cyName(r)}.`, 'warn'); return; }
    if (this.action) { this.toast('Đang làm việc khác.', 'info'); return; }
    if (rIdx(r) > rIdx(this.playerRank()) + 1) { this.toast(`Kinh mạch không chịu nổi ${cyName(r)} — cần đạt hạng ${RK[rIdx(r) - 1]} trước.`, 'warn'); return; }
    this.startAction({ kind: 'cy22', rank: r, label: `Hấp thụ ${cyName(r)}`, dur: 1 });
  };
  const at = G.actionTick;
  G.actionTick = function (dt) {
    const a = this.action;
    const r = at.call(this, dt);
    if (a && a.kind === 'cy22' && this.action !== a && a.t >= a.dur) {
      const P = this.player;
      if (!this.has(cyId(a.rank))) { this.toast('Không còn tinh thể để hấp thụ.', 'warn'); return r; }
      this.take(cyId(a.rank), 1);
      const exp = Math.round(EXP[rIdx(a.rank)] * (1 + 0.02 * this.attr('int')));
      this.addXp(exp);
      FX.ring(P.x, P.y, 10, 120, '#8fe9ff', 0.6, 6); Particles.burst(P.x, P.y, 14, '#8fe9ff', 120);
      this.toast(`Hấp thụ ${cyName(a.rank)}: +${exp} kinh nghiệm.`, 'good');
    }
    return r;
  };
  const uiItem = G.useItem;
  G.useItem = function (id) {
    const m = /^cry_([EDCBAS])$/.exec(id);
    if (!m) return uiItem.call(this, id);
    if (RL.id === 'tt') return this.cyAbsorb(m[1]);
    this.toast(`${cyName(m[1])}: lên hạng hoặc đổi tiền ở Hệ thống › Tinh thể.`, 'info');
  };

  // ---------- Hệ thống "Thu mua": tinh thể chỉ bán qua tab Tinh thể (bỏ các dòng của thu mua) ----------
  const sellTab = SYS.tabs.find(t => t.id === 'sell');
  if (sellTab) {
    const r0 = sellTab.render;
    sellTab.render = function (body) {
      r0.call(this, body);
      body.querySelectorAll('[data-m21s1^="cry_"],[data-m21sa^="cry_"]').forEach(b => { const row = b.closest('.s21row'); if (row) row.remove(); });
    };
  }

  // ---------- đổi tinh thể lấy tiền + bảng lên hạng + tu tiên (tab Hệ thống "Tinh thể", order 52) ----------
  G.cySell = function (r, all) {
    const P = this.player, have = P.inv[cyId(r)] || 0; if (!have) return;
    const n = all ? have : 1, v = PRICE[r] * n;
    this.take(cyId(r), n); this.earn(v);
    SYS.msg(`Đã đổi ${n} ${cyName(r)} +${v} ${cur().name}`, 'info');
    SYS.refresh();
  };
  const icon = d => (d && d.icon && IMG[d.icon] ? IMG[d.icon].src : '');
  SYS.addTab({
    id: 'cry', icon: '💎', order: 52, name: () => R21({ sl: 'Tinh thể', md: 'Lõi năng lượng', tt: 'Linh thạch' }),
    render(body) {
      const P = G.player;
      if (!P) { body.innerHTML = '<p class="muted">Vào thế giới để xem tinh thể.</p>'; return; }
      const cn = esc21(cur().name), tt = RL.id === 'tt', rk = G.playerRank();
      let h = `<p class="muted">Đổi tinh thể lấy ${cn}. Thương nhân mua thấp hơn 10%. Hạng hiện tại: <b>${rk}</b>.</p><h3>Tinh thể trong túi</h3>`;
      for (const r of RK) {
        const have = P.inv[cyId(r)] || 0, it = itm(cyId(r)), can = have && rIdx(r) <= rIdx(rk) + 1;
        h += `<div class="s21row"><img class="m21ic" src="${icon(it)}" alt=""><div class="grow"><b>${esc21(it.name)}</b> <span class="muted">x${have}</span><br><small class="muted">Hạng ${r} • ${PRICE[r]} ${cn}/viên${tt ? ` • hấp thụ gốc ${EXP[rIdx(r)]} EXP` : ''}</small></div>`;
        h += `<button data-cy-sell="${r}" data-all="0" ${have ? '' : 'disabled'}>ĐỔI 1</button><button data-cy-sell="${r}" data-all="1" ${have ? '' : 'disabled'}>ĐỔI HẾT</button>`;
        if (tt) h += `<button data-cy-abs="${r}" ${can ? '' : 'disabled'}>HẤP THỤ</button>`;
        h += '</div>';
      }
      h += '<h3>Lên hạng (cấp 10 / 20 / 30 / 40 / 50)</h3>';
      for (const lv of Object.keys(RANKUP)) {
        const q = RANKUP[lv], have = P.inv[cyId(q.r)] || 0;
        h += `<div class="s21row"><div class="grow">Cấp ${lv} → hạng ${q.r}</div><b class="${have >= q.n ? 'ok' : ''}">${have}/${q.n} ${esc21(cyName(q.r))}</b></div>`;
      }
      if (tt) h += `<h3>Tu tiên</h3><p class="muted">Giết quái chỉ cho 30% kinh nghiệm. Hấp thụ (1 giây): E 40 • D 140 • C 450 • B 1400 • A 4200 • S 12000 × (1 + 0,02 INT). Chỉ hấp thụ hạng ≤ hạng hiện tại + 1.</p>`;
      body.innerHTML = h;
      body.querySelectorAll('[data-cy-sell]').forEach(b => { b.onclick = () => G.cySell(b.dataset.cySell, b.dataset.all === '1'); });
      body.querySelectorAll('[data-cy-abs]').forEach(b => { b.onclick = () => { SYS.close(); G.cyAbsorb(b.dataset.cyAbs); }; });
    },
  });

  // ---------- lên hạng: cần tinh thể đúng hạng ở cấp 10/20/30/40/50, trừ khi thử (thành công hay thất bại) ----------
  const btP = G.breakthrough;
  G.breakthrough = function () {
    const P = this.player, need = RANKUP[P.level], pg = this.v10 && this.v10.prog;
    if (!need || !this.btBlocked() || !this.btWhere() || (pg && pg.deb)) return btP.call(this);
    const have = P.inv[cyId(need.r)] || 0;
    if (have < need.n) { SYS.msg(`Lên hạng ${need.r} cần ${need.n} ${cyName(need.r)} (đang có ${have}).`, 'warn'); return; }
    const bt0 = this.v6.bt, f0 = pg ? pg.fails : 0;
    btP.call(this);
    const pg2 = this.v10.prog, attempted = this.v6.bt > bt0 || (!!pg2 && pg2.fails > f0);
    if (attempted) { this.take(cyId(need.r), need.n); UI.dirty = true; }
  };
  const bb = UI.buildBase;
  UI.buildBase = function () {
    bb.call(this);
    if (this.baseTab !== 'bt' || !G.player || !G.btBlocked()) return;
    const need = RANKUP[G.player.level], go = document.getElementById('btGo');
    if (!need || !go) return;
    const have = G.player.inv[cyId(need.r)] || 0, anchor = go.closest('.menu') || go;
    anchor.insertAdjacentHTML('beforebegin', `<div class="cy22bt"><p>Lên hạng <b>${need.r}</b> cần <b>${need.n} ${esc21(cyName(need.r))}</b> — đang có <b class="${have >= need.n ? 'ok' : 'no'}">${have}</b>. Tinh thể bị tiêu hao khi đột phá, dù thành công hay thất bại.</p></div>`);
  };

  // ---------- Trạng thái: hạng hiện tại ----------
  const stTab = SYS.tabs.find(t => t.id === 'status');
  if (stTab) {
    const r0 = stTab.render;
    stTab.render = function (body) {
      r0.call(this, body);
      if (!G.player) return;
      body.insertAdjacentHTML('afterbegin', `<div class="s21row"><div class="grow">${esc21(R21({ sl: 'Thợ săn hạng', md: 'Cấp sinh tồn', tt: 'Cảnh giới' }))}</div><b>${G.playerRank()}</b></div>`);
    };
  }

  const css = document.createElement('style'); css.id = 'v22crystal-css';
  css.textContent = `.cy22bt{margin:8px 0;padding:8px 10px;border:1px solid rgba(109,200,255,.4);background:rgba(0,30,60,.25)}
.cy22bt .ok,#s21 .s21row .ok{color:#6dff9a}.cy22bt .no{color:#ff7a7a}`;
  document.head.appendChild(css);
})();
