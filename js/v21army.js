// ===== v21army: Binh đoàn bóng. Chỉ huy (Thủ lĩnh, Quân vương) nhận một số bóng cấp dưới; mỗi bóng chiếm sức chứa linh hồn
// (mana tối đa) và tốn mana khi ra trận; gọi cả đội/cả binh đoàn có hiệu ứng ARISE; bóng gục hồi sinh lâu hơn; tab "Binh đoàn" trong Hệ thống =====
(function () {
  const ARMY = {
    order: ['normal', 'elite', 'mini', 'boss'],                       // thấp -> cao
    sup: { normal: 'elite', elite: 'mini', mini: 'boss' },            // cấp chỉ huy mà mỗi cấp phục vụ
    subCap: { elite: 4, mini: 2, boss: 2 },                           // số cấp dưới một chỉ huy nhận (theo cấp chỉ huy)
    team: { elite: 'Tiểu đội', mini: 'Đại đội', boss: 'Quân đoàn' }, // đội = chỉ huy + toàn bộ cấp dưới
    load: { normal: 4, elite: 10, mini: 24, boss: 50 },               // sức chứa linh hồn một bóng chiếm
    cost: { normal: 10, elite: 22, mini: 50, boss: 100 },             // mana để gọi một bóng
    upkeep: { normal: 0.12, elite: 0.3, mini: 0.7, boss: 1.4 },       // mana mỗi giây khi ra trận
    revive: { normal: 40, elite: 70, mini: 150, boss: 300 },          // giây trước khi bóng gục được gọi lại
    hp: { normal: 110, elite: 210, mini: 480, boss: 900 },            // chỉ số gốc (ghi vào SH_TIER)
    dmg: { normal: 15, elite: 24, mini: 40, boss: 62 },
    name: {
      normal: { md: 'Xác sống', tt: 'Quỷ tốt', sl: 'Lính' }, elite: { md: 'Xác tinh anh', tt: 'Quỷ tinh', sl: 'Tinh anh' },
      mini: { md: 'Đội trưởng xác', tt: 'Quỷ tướng', sl: 'Thủ lĩnh' }, boss: { md: 'Vua xác', tt: 'Quỷ vương', sl: 'Quân vương' },
    },
    rise: 0.07, riseT: 0.5, pool: 0.9,                                 // ARISE: cách nhau, thời gian trồi lên, vũng tối (giây)
  };
  const MODE_NAME = { fight: 'Chiến đấu', loot: 'Nhặt đồ', wood: 'Đốn gỗ' };
  const ORDER_JOBS = [['gather', 'Thu thập'], ['hunt', 'Săn bắt'], ['herb', 'Hái thuốc'], ['mine', 'Đào mỏ']];
  // weaker shadows: the base stats are edited in place (the stat wrapper below scales them by level)
  for (const t of ARMY.order) Object.assign(SH_TIER[t], { hp: ARMY.hp[t], dmg: ARMY.dmg[t], cost: ARMY.cost[t] });
  let fixedFor = null;   // the G.v10 object the hierarchy was last cleaned for (a new save is cleaned once)
  let movingId = null;   // row of the army tab whose "Chuyển" picker is open (UI only)

  // ---------- state, hierarchy and numbers ----------
  const armySt = () => G.v10.army || (G.v10.army = { quick: null });
  const tierIdx = s => ARMY.order.indexOf(s.tier);
  const tierLabel = t => R21(ARMY.name[t]);
  const teamName = t => ARMY.team[t] || tierLabel(t);
  const below = t => ARMY.order[ARMY.order.indexOf(t) - 1];
  const teamSize = t => (t === 'normal' ? 1 : 1 + ARMY.subCap[t] * teamSize(below(t)));
  const power = s => { const st = G.shStats(s); return st.dmg + st.hp / 10; };
  const byPower = (a, b) => tierIdx(b) - tierIdx(a) || power(b) - power(a);   // cấp cao trước, rồi mạnh trước
  const subsOf = s => G.v10.shadows.filter(q => q.lead === s.id);
  const teamOf = head => { const out = [head]; for (let i = 0; i < out.length; i++) out.push(...subsOf(out[i])); return out; };
  const treeOf = (s, d, out) => { out.push([s, d]); for (const q of subsOf(s).sort(byPower)) treeOf(q, d + 1, out); return out; };
  const canServe = (s, sup) => !!sup && sup.id !== s.id && ARMY.sup[s.tier] === sup.tier && subsOf(sup).length < ARMY.subCap[sup.tier];
  const soulLoad = () => G.v10.shadows.reduce((a, s) => a + (ARMY.load[s.tier] || 0), 0);
  const soulCap = () => G.maxMana();
  const armyLimit = () => { const P = G.player, L = P ? P.level : 1; return 6 + Math.floor(L / 2) + Math.floor(G.attr('int') / 10); };
  const armyAllies = () => G.allies.filter(a => a.kind === 'shadow' && !a.dead);
  const armyUpkeep = () => {
    let d = 0;
    for (const a of armyAllies()) { const s = a.sid != null ? G.shById(a.sid) : null; if (s) d += ARMY.upkeep[s.tier] || 0; }
    return d;
  };
  const quickId = () => {
    const q = armySt().quick, s = q == null ? null : G.shById(q);
    if (q != null && (!s || s.tier === 'normal')) { armySt().quick = null; return null; }
    return s ? s.id : null;
  };
  const quickName = () => { const id = quickId(), s = id == null ? null : G.shById(id); return s ? `${s.nick || s.name} (${teamName(s.tier)})` : 'Tất cả'; };
  // drops links to a missing commander, a wrong tier, or a commander over capacity (the extra ones, latest first)
  const armySanitize = () => {
    const v = G.v10; if (!v || !v.shadows) return;
    const ids = new Map(v.shadows.map(s => [s.id, s]));
    for (const s of v.shadows) if (s.lead != null) { const sup = ids.get(s.lead); if (!sup || ARMY.sup[s.tier] !== sup.tier) delete s.lead; }
    for (const sup of v.shadows) {
      const cap = ARMY.subCap[sup.tier]; if (!cap) continue;
      let k = 0;
      for (const s of v.shadows) if (s.lead === sup.id && ++k > cap) delete s.lead;
    }
  };
  const armyAssign = (s, sup) => {
    if (!s) return false;
    if (!sup) { delete s.lead; return true; }
    if (s.lead === sup.id) return true;
    if (!canServe(s, sup)) return false;
    s.lead = sup.id; return true;
  };
  // quiet a stretch of code that would toast once per member; returns what it tried to say
  const muteToast = fn => { const t0 = G.toast, log = []; G.toast = (m, k) => { log.push([m, k]); }; try { fn(); } finally { G.toast = t0; } return log; };
  const armyGate = () => {
    if (typeof Net !== 'undefined' && Net.active && Net.guest) { G.toast(`Khi vào phòng của bạn bè, ${SM().army} chỉ gọi được ở thế giới của bạn.`, 'info'); return false; }
    return !!G.player && !G.player.dead && isArise() && !!G.v10;
  };

  // ---------- summon: ARISE, team calls ----------
  // the shadows of one call rise one after another: the queue is drained in the tick, never with setTimeout
  function armyRise(batch) {
    const q = G._riseQ || (G._riseQ = []), P = G.player;
    batch.forEach((a, i) => { a.riseWait = true; q.push({ a, at: G.time + i * ARMY.rise }); });
    FX.list.push({ t: 'armypool', x: P.x, y: P.y, dur: ARMY.pool, life: ARMY.pool });
    UI.skillFlash(R21({ sl: 'ARISE!', md: 'KHỐNG THI!', tt: 'NGỰ QUỶ!' }), SM().col);
    Sound.play('sfx_shadow', 0.9);
    Bus21.emit('summon', batch.length);
  }
  // calls the shadows of a list in order (commanders first); every summon is checked by the wrapped G.summonShadow
  function armyCall(list) {
    if (!armyGate()) return 0;
    const batch = G._armyBatch = [];
    let n = 0, lack = false, busy = 0, cd = 0, nAct = 0, max = false;
    try {
      for (const s of list) {
        const r = G.summonShadow(s);
        if (r === 'ok') n++; else if (r === 'mana') lack = true; else if (r === 'busy') busy++; else if (r === 'cd') cd++; else if (r === 'active') nAct++; else if (r === 'max') max = true;
      }
    } finally { G._armyBatch = null; }
    if (batch.length) armyRise(batch);
    const why = [busy && `${busy} đang làm việc`, cd && `${cd} đang hồi sinh`, nAct && `${nAct} đã ra trận`, lack && `hết ${manaName()}`, max && 'đã đủ giới hạn ra trận'].filter(Boolean).join(' • ');
    if (n) G.toast(`${SM().icon} Đã gọi ${n} ${SM().unit}${why ? ' — ' + why : ''}.`, 'quest');
    else G.toast(`${SM().icon} Chưa gọi được ${SM().unit}${why ? ': ' + why : '.'}`, 'warn');
    return n;
  }
  function armySummonUnit(id) {
    const head = G.shById(id); if (!head) return 0;
    return armyCall(teamOf(head).sort(byPower));
  }
  function armyRecallUnit(id, withJobs) {
    const head = G.shById(id); if (!head) return 0;
    let n = 0;
    for (const s of teamOf(head)) {
      if (G.shadowAlly(s)) { G.recallShadow(s); n++; }
      if (withJobs) { s.job = null; s.exp = null; }
    }
    if (n || withJobs) G.toast(`${SM().icon} ${teamName(head.tier)} ${head.nick || head.name} trở về${n ? ` (${n} ${SM().unit} thu hồi)` : ''}.`, 'info');
    return n;
  }
  // "Tự sắp xếp": only empty places are filled, the strongest unit goes under the strongest commander with room
  function armyAutoArrange() {
    armySanitize();
    let n = 0;
    for (const tier of ['mini', 'elite', 'normal']) {
      const sup = ARMY.sup[tier], units = G.v10.shadows.filter(s => s.tier === tier && s.lead == null).sort(byPower);
      const sups = G.v10.shadows.filter(s => s.tier === sup).sort(byPower);
      for (const u of units) { const c = sups.find(x => subsOf(x).length < ARMY.subCap[sup]); if (!c) break; u.lead = c.id; n++; }
    }
    return n;
  }

  // ---------- helpers for the other packages ----------
  Object.assign(G, {
    soulLoad, soulCap, armyLimit, armySanitize, armyAssign, armyAutoArrange, armyRecallUnit, armySummonUnit,
    armyActive() { return armyAllies().length; },
    armyUpkeep,
    armyQuickId: quickId,
    armyQuickName: quickName,
    armyCycleQuick() {
      // Tất cả -> từng chỉ huy (cấp cao trước) -> Tất cả
      const cands = G.v10.shadows.filter(s => s.tier !== 'normal').sort(byPower), cur = quickId();
      const i = cur == null ? -1 : cands.findIndex(s => s.id === cur);
      armySt().quick = i + 1 < cands.length ? cands[i + 1].id : null;
      return armySt().quick;
    },
    armySummonQuick() { const q = quickId(); return q != null ? armySummonUnit(q) : this.summonAll(); },
  });

  // ---------- wrapped summons ----------
  // an army summon is capped by the simultaneous limit; a summon of an extraction (free) is not
  const ss = G.summonShadow;
  G.summonShadow = function (s, free) {
    if (!free && s && !this.shBusy(s) && !this.shadowAlly(s) && !(s.cd > this.time) && armyAllies().length >= armyLimit()) {
      if (this._armyBatch) this._armyMaxHit = true;
      else this.toast(`Đã đạt giới hạn ra trận (${armyAllies().length}/${armyLimit()}). Thu hồi bớt, hoặc tăng cấp / INT.`, 'warn');
      return 'max';
    }
    const batch = this._armyBatch;
    if (!batch) return ss.call(this, s, free);
    // inside a group call the pillar and the burst fire from the rise queue, one shadow at a time
    const pl = FX.pillar, bu = Particles.burst;
    FX.pillar = () => {}; Particles.burst = () => {};
    let r;
    try { r = ss.call(this, s, free); } finally { FX.pillar = pl; Particles.burst = bu; }
    if (r === 'ok') batch.push(this.shadowAlly(s));
    return r;
  };
  // gọi tất cả / phím K / nút BÓNG: nếu có đội nhanh thì gọi đội đó, còn lại là gọi như cũ (Shift+K vẫn hủy triệu hồi)
  const sa = G.summonAll;
  G.summonAll = function (o) {
    if (!isArise() || !this.v10) return sa.call(this, o);
    const q = quickId(), shift = Input.keys.ShiftLeft || Input.keys.ShiftRight;
    if (!o && q != null && !shift) return armySummonUnit(q);
    const batch = this._armyBatch = [];
    this._armyMaxHit = false;
    try { return sa.call(this, o); }
    finally {
      this._armyBatch = null;
      if (this._armyMaxHit) G.toast(`Đã đạt giới hạn ra trận (${armyAllies().length}/${armyLimit()}).`, 'info');
      if (batch.length) armyRise(batch);
    }
  };
  // saving: the capacity of the soul is checked before any mana or corpse is spent
  const ex = G.extractShadow;
  G.extractShadow = function (c) {
    const need = c ? ARMY.load[c.tier] || 0 : 0;
    if (need && soulLoad() + need > soulCap()) {
      G.toast(`Không đủ sức chứa linh hồn (${soulLoad()}/${soulCap()}) — tăng INT/cấp hoặc giải phóng bớt bóng.`, 'warn');
      return;
    }
    return ex.call(this, c);
  };
  // stats: the level and INT curves are reshaped; the ratio keeps every earlier multiplier (realm, dark kingdom, rank)
  const sst = G.shStats;
  G.shStats = function (s) {
    const r = sst.call(this, s), P = this.player, L = P ? P.level : 1, I = this.attr('int');
    r.hp = Math.round(r.hp * (1 + 0.05 * L) / (1 + 0.08 * L));
    r.dmg = Math.round(r.dmg * (1 + 0.035 * L) / (1 + 0.06 * L) * (1 + 0.012 * I) / (1 + 0.02 * I));
    return r;
  };
  const st0 = G.start;
  G.start = function (isNew) { const r = st0.call(this, isNew); armySanitize(); return r; };

  // per frame: the ARISE queue, the upkeep of shadows out, the "−X/s" text
  function armyShedOne() {
    const pick = armyAllies().filter(a => a.sid != null && !a.riseWait)
      .map(a => ({ a, s: G.shById(a.sid) })).filter(e => e.s)
      .sort((x, y) => tierIdx(x.s) - tierIdx(y.s))[0];
    if (!pick) return;
    G.recallShadow(pick.s);
    if (G.time - (G._armyWarnT ?? -99) > 10) {
      G._armyWarnT = G.time;
      G.toast(`${SM().icon} Hết ${manaName()}: ${pick.s.nick || pick.s.name} bị thu hồi.`, 'warn');
    }
  }
  function armyHud(drain) {
    let el = document.getElementById('a21drain');
    if (!el) {
      const row = document.getElementById('mpRow'); if (!row) return;
      row.insertAdjacentHTML('beforeend', '<small id="a21drain"></small>'); el = document.getElementById('a21drain');
    }
    const t = drain > 0 ? `−${drain.toFixed(drain < 1 ? 2 : 1)}/s` : '';
    if (el.textContent !== t) el.textContent = t;
  }
  function armyTick(dt) {
    const v = G.v10, P = G.player;
    if (!v || !P) return;
    if (fixedFor !== v) { fixedFor = v; armySanitize(); }
    const q = G._riseQ;
    while (q && q.length && (q[0].a.dead || G.time >= q[0].at)) {
      const e = q.shift(); if (e.a.dead) continue;
      e.a.riseWait = false; e.a.riseT = 0;
      FX.pillar(e.a.x, e.a.y, SM().col, 0.9, 20); Particles.burst(e.a.x, e.a.y, 12, SM().col, 150);
    }
    for (const a of G.allies) if (a.riseT != null) { a.riseT += dt; if (a.riseT >= ARMY.riseT) a.riseT = null; }
    if (typeof Net !== 'undefined' && Net.active && Net.guest) return;
    const drain = armyUpkeep();
    if (drain > 0 && v.mana != null) {
      v.mana -= drain * dt;
      if (v.mana <= 0) {
        v.mana = 0;
        G._armyDebt = (G._armyDebt || 0) + dt;
        if (G._armyDebt >= 1) { G._armyDebt -= 1; armyShedOne(); }
      } else G._armyDebt = 0;
    } else G._armyDebt = 0;
    if (G.frame % 6 === 0) armyHud(drain);
  }
  const tk = G.v5Tick;
  G.v5Tick = function (dt) { tk.call(this, dt); armyTick(dt); };

  // ---------- the body of a shadow while it rises, and its death ----------
  // a rising shadow is inert and unhurtable; the pool at the feet is drawn with the FX layer
  const au = Ally.prototype.update;
  Ally.prototype.update = function (dt) { if (this.riseWait) return; return au.call(this, dt); };
  const ah = Ally.prototype.hurt;
  Ally.prototype.hurt = function (d) {
    if (this.riseWait) return;
    const s = this.kind === 'shadow' && this.sid != null ? G.shById(this.sid) : null;
    if (!s) return ah.call(this, d);
    const was = this.gone, log = muteToast(() => ah.call(this, d));
    if (!was && this.gone) s.cd = G.time + ARMY.revive[s.tier];
    for (const [t, k] of log) G.toast(!was && this.gone ? t.replace(/hồi phục sau \d+s/, `hồi phục sau ${ARMY.revive[s.tier]}s`) : t, k);
  };
  const ad = Ally.prototype.draw;
  Ally.prototype.draw = function (ctx) {
    if (this.riseWait) return;
    if (this.riseT == null) return ad.call(this, ctx);
    const k = Math.min(1, this.riseT / ARMY.riseT), f0 = this.fade;
    ctx.save(); ctx.translate(0, (1 - k) * 18); this.fade = f0 * k;
    try { ad.call(this, ctx); } finally { this.fade = f0; ctx.restore(); }
  };
  const fd = FX.draw;
  FX.draw = function (ctx) {
    fd.call(this, ctx);
    for (const f of FX.list) {
      if (f.t !== 'armypool') continue;
      const k = 1 - f.life / f.dur, rx = 18 + 80 * k;
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = Math.min(1, (1 - k) * 1.4);
      ctx.fillStyle = 'rgba(14,4,30,0.8)';
      ctx.beginPath(); ctx.ellipse(f.x, f.y + 6, rx, rx * 0.4, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = SM().col; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    }
  };

  // ---------- the army panel of the inventory: a door to the System tab, and the soul warning ----------
  const bs = UI.buildShadows;
  UI.buildShadows = function () {
    bs.call(this);
    const box = document.getElementById('invBody'); if (!box || !G.v10) return;
    const over = soulLoad() > soulCap();
    box.insertAdjacentHTML('afterbegin', `<div class="pbtn"><button id="a21open">⚑ Mở ${esc21(SM().army)} (Hệ thống)</button>${over ? `<small class="a21warn">Sức chứa linh hồn vượt: ${soulLoad()}/${soulCap()}</small>` : ''}</div>`);
    const b = document.getElementById('a21open'); UI.bindBtn(b);
    b.onclick = () => { UI.closePanel(); SYS.open('army'); };
  };

  // ---------- the army tab of the System window ----------
  const SUM_WHY = {
    mana: s => `Không đủ ${manaName()} để gọi ${s.nick || s.name} (cần ${G.shStats(s).cost}).`,
    cd: s => `${s.nick || s.name} đang hồi sinh, còn ${Math.ceil(s.cd - G.time)}s.`,
    busy: s => `${s.nick || s.name} đang làm việc hoặc khám phá.`,
    active: s => `${s.nick || s.name} đã ra trận.`,
    land: s => `${s.nick || s.name} là thủy tộc, chỉ gọi được khi bạn ở dưới nước.`,
  };
  const stateOf = s => {
    const a = G.shadowAlly(s);
    if (a) return a.riseWait ? 'Chuẩn bị trồi lên' : `Ra trận ${MODE_NAME[s.mode || 'loot']} • ${Math.round(a.hp)}/${Math.round(a.maxHp)}`;
    if (s.job) return `⚒ ${SH_JOBS[s.job.kind].name} • mẻ sau ${Math.max(0, Math.ceil(JOB_TIME - (G.time - s.job.t)))}s`;
    if (s.exp) return s.exp.done ? '🧭 Canh nơi khám phá' : '🧭 Đang khám phá';
    if (s.cd > G.time) return `⌛ Hồi sinh ${Math.ceil(s.cd - G.time)}s`;
    return '◌ Sẵn sàng';
  };
  const btn = (a, id, label, cls) => `<button data-a="${a}" data-id="${id}"${cls ? ` class="${cls}"` : ''}>${label}</button>`;
  // the "Chuyển" picker: each commander with room, then "Dự bị" when the unit is in a team now
  function pickerHtml(s) {
    const opts = G.v10.shadows.filter(sup => canServe(s, sup)).sort(byPower).map(sup =>
      `<button data-a="mvto" data-s="${s.id}" data-id="${sup.id}">${esc21(sup.nick || sup.name)} • ${esc21(tierLabel(sup.tier))} ${subsOf(sup).length}/${ARMY.subCap[sup.tier]}</button>`);
    if (s.lead != null) opts.push(`<button data-a="mvres" data-id="${s.id}">Dự bị (tách khỏi đội)</button>`);
    return `<div class="a21pick">Chuyển sang: ${opts.length ? opts.join('') : '<small class="muted">không có chỉ huy còn chỗ</small>'}</div>`;
  }
  function rowHtml(s, d) {
    const T = SH_TIER[s.tier], st = G.shStats(s);
    let h = `<div class="a21r" style="--d:${d};--tc:${T.col}"><span class="nm"><b>${esc21(s.nick || s.name)}</b> <small class="muted">${esc21(tierLabel(s.tier))} • cấp ${st.slv}</small></span><span class="st">${esc21(stateOf(s))}</span><span class="ra">`;
    h += btn('one', s.id, 'Gọi') + btn('rec', s.id, 'Thu hồi');
    if (s.tier !== 'boss') h += btn('mv', s.id, 'Chuyển');
    h += btn('nm', s.id, '✎', 'ren') + '</span></div>';
    if (movingId === s.id) h += pickerHtml(s);
    return h;
  }
  function teamCard(head) {
    const T = SH_TIER[head.tier], mem = teamOf(head), isQ = quickId() === head.id;
    let h = `<div class="a21card" style="--tc:${T.col}"><div class="a21ch"><b>${esc21(teamName(head.tier))}: ${esc21(head.nick || head.name)}</b><small class="muted">${esc21(tierLabel(head.tier))} • ${mem.length}/${teamSize(head.tier)} bóng</small>${isQ ? '<small class="a21star">★ đội nhanh</small>' : ''}</div>`;
    h += `<div class="a21acts">${btn('call', head.id, `${SM().icon} Gọi cả đội`)}${btn('recall', head.id, 'Thu hồi')}${btn('order', head.id, 'Phân công')}${btn('quick', head.id, isQ ? '★ Đội nhanh' : '☆ Đặt làm đội nhanh')}</div>`;
    h += treeOf(head, 0, []).map(([s, d]) => rowHtml(s, d)).join('');
    return h + '</div>';
  }
  function renderTab(body) {
    if (!G.v10) { body.innerHTML = '<p class="muted">Vào thế giới để xem binh đoàn.</p>'; return; }
    armySanitize();
    const v = G.v10, S = SM(), load = soulLoad(), cap = soulCap(), over = load > cap;
    const heads = v.shadows.filter(s => s.tier !== 'normal' && s.lead == null).sort(byPower);
    const reserve = v.shadows.filter(s => s.tier === 'normal' && s.lead == null).sort(byPower);
    let h = `<div class="a21top"><span>Ô lưu <b>${v.shadows.length}/${G.shadowCap()}</b></span><span>Sức chứa linh hồn <b class="${over ? 'bad' : ''}">${load}/${cap}</b></span><span>Ra trận <b>${armyAllies().length}/${armyLimit()}</b></span><span>Duy trì <b>−${armyUpkeep().toFixed(2)}/s</b></span></div>`;
    if (over) h += `<p class="a21warn">Sức chứa đang vượt: chưa thu phục thêm được. Bóng hiện có vẫn ở lại; tăng INT / cấp hoặc thả bớt.</p>`;
    h += `<div class="a21bar"><span>Đội nhanh [K]: <b>${esc21(quickName())}</b></span>${btn('qcyc', 0, '⟳ Đổi')}${btn('qcall', 0, `${S.icon} Gọi đội nhanh`)}${btn('auto', 0, 'Tự sắp xếp')}${btn('dismiss', 0, '✕ Hủy triệu hồi', 'warn')}</div>`;
    if (!v.shadows.length) h += `<p class="muted">Chưa có ${esc21(S.unit)} nào. Hạ kẻ địch, đứng cạnh xác và nhấn [E] để thu phục.</p>`;
    for (const head of heads) h += teamCard(head);
    if (reserve.length) h += `<div class="a21card" style="--tc:#8fb3c9"><div class="a21ch"><b>Dự bị</b><small class="muted">${reserve.length} ${esc21(S.unit)} chưa có chỉ huy</small></div>${reserve.map(s => rowHtml(s, 0)).join('')}</div>`;
    body.innerHTML = h;
    body.querySelectorAll('button[data-a]').forEach(b => { UI.bindBtn(b); b.onclick = () => act(b.dataset.a, +b.dataset.id, +b.dataset.s); });
  }
  // the order menu of a team (the menu opens over the game, so the System window closes first)
  function orderMenu(id) {
    const head = G.shById(id); if (!head) return;
    const opts = ORDER_JOBS.map(([k, lab]) => ({ text: `⚒ ${lab}`, act: () => {
      const h = G.shById(id); if (!h) return;
      const free = teamOf(h).filter(s => !G.shBusy(s));
      muteToast(() => { for (const s of free) G.setJob(s, k); });
      G.toast(`${SM().icon} ${teamName(h.tier)} ${h.nick || h.name}: ${free.length} ${SM().unit} đi ${lab.toLowerCase()}.`, 'info');
    } }));
    for (const [m, lab] of Object.entries(MODE_NAME)) opts.push({ text: `Chế độ ${lab}`, act: () => {
      const h = G.shById(id); if (!h) return;
      for (const s of teamOf(h)) { s.mode = m; const a = G.shadowAlly(s); if (a) { a.chopP = null; a.lootIt = null; } }
      G.toast(`${SM().icon} Cả đội: chế độ ${lab}.`, 'info');
    } });
    if (World.mode === 'over') opts.push({ text: '🧭 Đi khám phá (chỉ chỉ huy)', act: () => {
      const h = G.shById(id); if (!h) return;
      if (G.shBusy(h)) { G.toast(`${h.nick || h.name} đang bận.`, 'warn'); return; }
      UI.exploreSid = h.id; G.state = 'playing'; UI.openPanel('map');
      G.toast('Chạm vào một chỗ trên bản đồ để gửi chỉ huy khám phá. Thành viên ở lại.', 'info');
    } });
    opts.push({ text: 'Gọi cả đội về', act: () => armyRecallUnit(id, true) });
    opts.push({ text: 'Thôi', act: () => {} });
    SYS.close();
    UI.menuDialog({ name: `${teamName(head.tier)} ${head.nick || head.name}`, portrait: null, text: 'Giao việc cho cả đội. Bóng đang bận sẽ không nhận việc mới.', options: opts });
  }
  function act(a, id, sid) {
    const s = G.shById(id);
    switch (a) {
      case 'qcyc': G.armyCycleQuick(); break;
      case 'qcall': G.armySummonQuick(); break;
      case 'auto': { const n = armyAutoArrange(); G.toast(n ? `Tự sắp xếp: ${n} ${SM().unit} vào đội.` : 'Không còn chỗ trống phù hợp.', 'info'); break; }
      case 'dismiss': G.dismissAll(); break;
      case 'call': armySummonUnit(id); break;
      case 'recall': armyRecallUnit(id, false); break;
      case 'order': orderMenu(id); return;
      case 'quick': armySt().quick = id; G.toast(`★ Đội nhanh: ${s ? s.nick || s.name : ''}. Phím [K] gọi đội này.`, 'info'); break;
      case 'one': {
        if (!s) break;
        const r = G.summonShadow(s);
        if (r === 'ok') G.toast(`${SM().icon} ${s.nick || s.name} đã ra trận.`, 'quest');
        else if (SUM_WHY[r]) G.toast(SUM_WHY[r](s), 'warn');
        break;
      }
      case 'rec': if (s) G.recallShadow(s); break;
      case 'mv': movingId = movingId === id ? null : id; break;
      case 'mvto': if (!armyAssign(G.shById(sid), G.shById(id))) G.toast('Chỉ huy này không nhận thêm được.', 'warn'); movingId = null; break;
      case 'mvres': armyAssign(s, null); movingId = null; break;
      case 'nm': if (s) UI.askName(`Đặt tên cho ${s.name}`, s.nick || '', v => { if (v) s.nick = v; else delete s.nick; const al = G.shadowAlly(s); if (al) al.sname = v || s.name; SYS.refresh(); }); return;
    }
    SYS.refresh();
  }
  SYS.addTab({
    id: 'army', icon: '⚑', order: 30, name: () => SM().army,
    render: renderTab,
    badge: () => (G.v10 && soulLoad() > soulCap() ? true : null),
  });

  // ---------- style ----------
  const css = document.createElement('style'); css.id = 'v21army-css';
  css.textContent = `
#a21drain{font-size:15px;color:#e6b8ff;white-space:nowrap;text-shadow:0 0 4px #000}
body.touch #a21drain{font-size:11px}
.a21warn{color:#ff7a7a}
#s21 .a21top{display:flex;flex-wrap:wrap;gap:4px 16px;align-items:center;margin-bottom:6px}
#s21 .a21top b{color:#ffe27a}
#s21 .a21top b.bad{color:#ff7a7a}
#s21 .a21bar,#s21 .a21acts,#s21 .a21r .ra,#s21 .a21pick{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
#s21 .a21bar{margin-bottom:6px}
#s21 .a21card{border:1px solid var(--tc,#4fc3ff);background:rgba(10,20,44,.55);padding:6px 8px;margin:8px 0}
#s21 .a21ch{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;margin-bottom:4px}
#s21 .a21ch b{color:var(--tc,#7fd8ff)}
#s21 .a21star{color:#ffe27a}
#s21 .a21r{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;padding:3px 0 3px calc(var(--d,0) * 22px);border-top:1px dashed rgba(79,195,255,.15)}
#s21 .a21r .nm{flex:1;min-width:150px}
#s21 .a21r .nm b{color:var(--tc,#dff4ff)}
#s21 .a21r .st{color:#8fb3c9;font-size:16px}
#s21 .a21pick{width:100%;padding:4px 0 2px 16px;font-size:16px}
#s21 .a21bar button,#s21 .a21card button{font-size:16px;padding:2px 8px}
#s21 .a21r .ren{padding:2px 6px}
@media (max-height:500px){#s21 .a21r .st{font-size:13px}#s21 .a21bar button,#s21 .a21card button{font-size:13px;padding:1px 6px}}`;
  document.head.appendChild(css);
})();
