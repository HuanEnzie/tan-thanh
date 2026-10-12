// ===== v21prog: progression & difficulty =====
// 1. New EXP curve (G.xpNeed).
// 2. Shadows / allies that land the killing blow give only 35% EXP (flag G._xpAlly around killEnemy).
// 3. Breakthrough can fail -> backlash ("Phản phệ"): current-level EXP resets to 0, max HP and max mana
//    are -30% for 600 game-seconds. State: G.v10.prog = { fails, deb: { until, dHp } | null }.
// 4. Priced teleport: free when standing within 160 px of a base / statue / waypoint, otherwise 1 scroll.
// 5. Healing potions scale with max HP; grenades and molotovs scale with level (x1.6 vs bosses);
//    passive regeneration is halved while a chasing enemy is within 400 px.
(function () {
  const ALLY_XP = 0.35, DEB_LEN = 600, DEB_PCT = 0.3, CHASE_R = 400, TP_R = 160, TP_SAFE = 220;
  const BOOM_LVL = 0.07, BOOM_BOSS = 1.6;
  const HEAL21 = { medkit: [65, 0.30], bandage: [22, 0.10], pills: [12, 0.06] }; // [flat base, fraction of max HP]
  const OLD_BT = 'Mỗi lần đột phá: +20 máu, +5 thể lực, +4% sát thương vĩnh viễn.';
  const NEW_BT = 'Mỗi lần đột phá: phẩm cấp rút ngẫu nhiên quyết định mức tăng (xem bên dưới). Có thể thất bại.';

  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const mmss = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const prog = () => {
    const v = G.v10; if (!v) return { fails: 0, deb: null };
    return v.prog || (v.prog = { fails: 0, deb: null });
  };
  const guest = () => typeof Net !== 'undefined' && Net.active && Net.guest;
  const chaseNear = P => !!G.zgrid && G.zgrid.query(P.x, P.y, CHASE_R).some(z => !z.dead && z.state === 'chase' && dist(z.x, z.y, P.x, P.y) < CHASE_R);
  const pillMax = () => (typeof ITEMS !== 'undefined' && ITEMS.bt_pill) ? cl(G.player.inv.bt_pill || 0, 0, 2) : 0;
  const pillsUse = () => cl(UI.btPills | 0, 0, pillMax());
  // the catalyst is only used when the player still has one after the required ones are paid (v15 logic)
  const boostOn = q => !!UI.btBoost && G.has('bt_c', (q.c || 0) + 1);
  const debName21 = () => R21({ sl: 'Phản phệ', tt: 'Tẩu hỏa', md: 'Đào thải' });
  const blockMsg21 = () => R21({ sl: 'Kinh mạch chưa hồi phục', tt: 'Kinh mạch chưa hồi phục', md: 'Cơ thể chưa hồi phục' });
  const tpFree21 = () => {
    const P = G.player;
    if (World.mode !== 'over' || !P || !G.v5) return true;
    return G.tpList().some(t => dist(P.x, P.y, t.x, t.y) <= TP_R);
  };
  const flash21 = () => {
    let el = document.getElementById('p21flash');
    if (!el) { el = document.createElement('div'); el.id = 'p21flash'; document.body.appendChild(el); }
    el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
  };
  const badge21 = () => {
    let el = document.getElementById('p21deb');
    if (!el) {
      const row = document.getElementById('hpRow'); if (!row) return;
      el = document.createElement('span'); el.id = 'p21deb'; el.className = 'p21deb'; row.appendChild(el);
    }
    const txt = G.debuffText();
    el.style.display = txt ? '' : 'none'; el.textContent = txt;
  };

  const st = document.createElement('style'); st.id = 'v21prog-css';
  st.textContent = `
#p21flash{position:fixed;inset:0;pointer-events:none;opacity:0;z-index:35;background:radial-gradient(ellipse at center,rgba(255,40,40,0) 35%,rgba(255,30,30,.6) 100%)}
#p21flash.go{animation:p21fl .9s ease-out 1 both}
@keyframes p21fl{0%{opacity:1}100%{opacity:0}}
.p21deb{margin-left:6px;padding:0 6px;font-size:14px;line-height:18px;color:#fff;background:#8f1d17;border:1px solid #000;border-radius:3px;white-space:nowrap;box-shadow:0 0 6px rgba(255,60,60,.7)}
.p21bt{margin:8px 0;padding:8px 10px;border:1px solid rgba(255,90,90,.4);background:rgba(60,0,0,.25)}
.p21bt .p21rate b{color:#ffe27a}
.p21bt .p21warn{color:#ff7a7a}
@media (max-height:500px){.p21deb{font-size:11px;line-height:14px}}`;
  document.head.appendChild(st);

  // ---------- 1. EXP curve ----------
  G.xpNeed = function (l) { return Math.round(80 + 40 * l + 6 * Math.pow(l, 2.35)); };

  // ---------- 2. shadow / ally kills give 35% EXP ----------
  const ke = G.killEnemy;
  G.killEnemy = function (z, src) {
    if (src !== 'ally') return ke.call(this, z, src);
    const was = this._xpAlly; this._xpAlly = true;
    try { return ke.call(this, z, src); } finally { this._xpAlly = was; }
  };
  const ax = G.addXp;
  G.addXp = function (n) { return ax.call(this, this._xpAlly ? n * ALLY_XP : n); };

  // ---------- 3. breakthrough: odds, failure and backlash ----------
  G.btChance21 = function (boost, pills, t) {
    if (t == null) t = this.player.level / 5;
    let p = cl(0.88 - 0.07 * (t - 1), 0.35, 0.95);
    if (boost) p += 0.12;
    p += 0.10 * cl(pills | 0, 0, 2);
    p += Math.min(0.30, 0.06 * prog().fails);
    p += 0.003 * this.attr('int');
    return Math.min(0.97, p);
  };
  G.debuffText = function () { const d = prog().deb; return d ? debName21() + ' ' + mmss(d.until - this.time) : ''; };

  const btO = G.breakthrough;
  G.breakthrough = function () {
    const P = this.player, pg = prog();
    if (!this.btBlocked() || !this.btWhere()) return btO.call(this);   // original explains why
    if (pg.deb) { SYS.msg(`${blockMsg21()} — còn ${mmss(pg.deb.until - this.time)}.`, 'warn'); return; }
    const q = this.btReq(P.level / 5);
    if (!this.has('bt_a', q.a) || !this.has('bt_b', q.b) || (q.c && !this.has('bt_c', q.c)) || P.gold < q.gold) return btO.call(this);
    const boost = boostOn(q), pills = pillsUse();
    if (Math.random() < this.btChance21(boost, pills)) {
      if (pills) this.take('bt_pill', pills);
      UI.btPills = 0;
      const bt0 = this.v6.bt;
      btO.call(this);
      if (this.v6.bt > bt0) { pg.fails = 0; Bus21.emit('bt', true); }
      return;
    }
    // failure: pay the price, lose the level's EXP, get the backlash
    if (pills) this.take('bt_pill', pills);
    if (boost) this.take('bt_c', 1);
    this.take('bt_a', q.a);
    if (q.b >= 2) this.take('bt_b', Math.floor(q.b / 2));
    if (q.c) this.take('bt_c', q.c);
    P.gold -= q.gold; UI.btPills = 0;
    P.xp = 0; pg.fails++;
    const dHp = Math.round(P.maxHp * DEB_PCT);
    P.maxHp -= dHp; P.hp = Math.min(P.hp, P.maxHp);
    pg.deb = { until: this.time + DEB_LEN, dHp };
    UI.dirty = true;
    this.shake(14); flash21();
    FX.pillar(P.x, P.y, '#ff5a5a', 1.2, 40); Sound.play('sfx_hurt', 0.9, 0.6);
    Floaters.add(P.x, P.y - 30, debName21().toUpperCase(), '#ff6a6a', 14);
    SYS.msg(R21({ sl: 'THĂNG CẤP THẤT BẠI — Phản phệ ma lực', tt: 'ĐỘT PHÁ THẤT BẠI — Tẩu hỏa nhập ma', md: 'TIẾN HÓA THẤT BẠI — Cơ thể đào thải' }), 'warn');
    SYS.msg(`Máu & ${manaName()} tối đa −30% trong 10 phút. EXP cấp hiện tại về 0.`, 'warn');
    Bus21.emit('bt', false);
    this.save();
  };

  // max mana -30% while the backlash lasts
  const mmO = G.maxMana;
  G.maxMana = function () { const m = mmO.call(this); return prog().deb ? Math.round(m * (1 - DEB_PCT)) : m; };

  // breakthrough tab: odds, catalyst-aware, pill selector, backlash rules
  const bbO = UI.buildBase;
  UI.buildBase = function () {
    bbO.call(this);
    if (this.baseTab !== 'bt') return;
    const ui = this, box = $('baseBody'), go = $('btGo');
    if (!box || !go) return;
    const P = G.player, pg = prog(), blocked = G.btBlocked();
    box.querySelectorAll('.bthead p').forEach(p => { if (p.innerHTML.includes(OLD_BT)) p.innerHTML = p.innerHTML.replace(OLD_BT, NEW_BT); });
    const t = blocked ? P.level / 5 : (Math.ceil(P.level / 5) || 1), q = G.btReq(t);
    const pills = pillsUse(), boost = boostOn(q), hasPill = typeof ITEMS !== 'undefined' && !!ITEMS.bt_pill;
    const pc = Math.round(G.btChance21(boost, pills, t) * 100);
    let h = `<div class="p21bt"><p class="p21rate">Tỉ lệ thành công: <b>${pc}%</b>`;
    if (pg.fails) h += ` <small class="muted">• thất bại liên tiếp ${pg.fails} (+${Math.min(30, 6 * pg.fails)}%)</small>`;
    h += '</p>';
    if (hasPill) {
      h += `<p>Dùng ${esc21(itm('bt_pill').name)}: <select id="p21pill">`;
      for (let i = 0; i <= pillMax(); i++) h += `<option value="${i}"${i === pills ? ' selected' : ''}>${i} viên (+${i * 10}%)</option>`;
      h += `</select> <small class="muted">đang có ${P.inv.bt_pill || 0}</small></p>`;
    }
    h += `<p class="muted">Thất bại: mất toàn bộ ${esc21(itm('bt_a').name)} cần, nửa số ${esc21(itm('bt_b').name)}, toàn bộ tiền${q.c ? ', ' + esc21(itm('bt_c').name) : ''}; EXP cấp hiện tại về 0; trong 10 phút máu & ${esc21(manaName())} tối đa −30%.</p>`;
    if (pg.deb) h += `<p class="p21warn">${esc21(blockMsg21())} — ${esc21(debName21())} còn ${mmss(pg.deb.until - G.time)}</p>`;
    h += '</div>';
    const anchor = go.closest('.menu') || go;
    anchor.insertAdjacentHTML('beforebegin', h);
    const sel = $('p21pill');
    if (sel) sel.onchange = () => { ui.btPills = +sel.value; ui.buildBase(); };
  };

  // the v6 banner promised fixed stats; the grade (v15) decides them now
  const bnO = UI.banner;
  UI.banner = function (title, sub, col) {
    if (title === 'ĐỘT PHÁ THÀNH CÔNG' && sub) sub = String(sub).replace(' • +20 máu, +4% sát thương vĩnh viễn', '');
    return bnO.call(this, title, sub, col);
  };

  // ---------- 4. priced teleport ----------
  const tpO = G.teleport;
  G.teleport = function (t) {
    const P = this.player;
    // swaps with explorers (v11) pay mana; refused cases are left to the original (it explains why)
    if (!t || t.kind === 'shadow' || t.kind === 'swap' || World.mode !== 'over' || !P || P.dead) return tpO.call(this, t);
    if (this.zombies.some(z => !z.dead && z.state === 'chase' && dist(z.x, z.y, P.x, P.y) < TP_SAFE)) return tpO.call(this, t);
    if (tpFree21()) return tpO.call(this, t);
    const sc = itm('scroll').name, rr = rk(RL.id);
    if (!this.has('scroll')) {
      SYS.msg(`Chỉ dịch chuyển miễn phí khi đứng cạnh ${HOME_NAME[rr]}, ${ST_NAME[rr]} hoặc ${WP_NAME[rr]}. Cần 1 ${sc} để dịch chuyển từ đây.`, 'warn');
      return;
    }
    this.take('scroll');
    return tpO.call(this, t);
  };
  G.tpCostText = function (tp) {
    if (!tp || tp.kind === 'shadow' || tp.kind === 'swap' || World.mode !== 'over') return '';
    return tpFree21() ? '' : 'tốn 1 ' + itm('scroll').name;
  };
  const dbmO = UI.drawBigMap;
  UI.drawBigMap = function () {
    dbmO.call(this);
    if (this.mapSel && this.mapSel.tp) {
      const c = G.tpCostText(this.mapSel.tp);
      if (c) $('mapTp').textContent = '✈ DỊCH CHUYỂN: ' + this.mapSel.tp.name + ' (' + c + ')';
    }
  };

  // ---------- 5a. healing potions: flat part + share of max HP ----------
  useHeal = function (want) {
    const P = G.player;
    if (P.hp >= P.maxHp) { G.toast('Máu đang đầy.', 'info'); return; }
    const miss = P.maxHp - P.hp;
    let id = want && HEAL21[want] && G.has(want) ? want : null;
    if (!id) {
      if (miss >= 45 && G.has('medkit')) id = 'medkit';
      else if (G.has('bandage')) id = 'bandage';
      else if (G.has('medkit')) id = 'medkit';
      else if (G.has('pills')) id = 'pills';
    }
    if (!id) { G.toast('Không có đồ y tế!', 'warn'); return; }
    G.take(id);
    const [base, pct] = HEAL21[id];
    const h0 = P.hp;
    P.hp = Math.min(P.maxHp, P.hp + base * (1 + P.level * 0.03) + pct * P.maxHp);
    const gained = P.hp - h0;
    // medic perk bonus (v14b wraps the old useHeal the same way)
    const f = G.pfx ? G.pfx() : null;
    if (f && f.heal && gained > 0) {
      const x = Math.min(P.maxHp - P.hp, gained * f.heal);
      if (x > 0) { P.hp += x; Floaters.add(P.x, P.y - 30, `+${Math.round(x)}`, '#8affb0', 9); }
    }
    if (id === 'pills') P.pillsT = 30;
    Floaters.add(P.x, P.y - 24, '+' + Math.round(P.hp - h0) + ' HP', '#6dff7a', 11);
    FX.ring(P.x, P.y, 8, 40, '#6dff7a', 0.4, 3);
    Sound.play('sfx_heal', 0.6);
  };

  // ---------- 5b. grenades / molotovs: scale with level, x1.6 vs bosses ----------
  const thO = Throws.update;
  Throws.update = function (dt) {
    const was = G._thrown21; G._thrown21 = true;
    try { return thO.call(this, dt); } finally { G._thrown21 = was; }
  };
  const hitO = G.hitEnemy;
  G.hitEnemy = function (z, dmg, kx, ky, src, ang, wp) {
    if (G._thrown21 && (src === 'explosion' || src === 'fire')) {
      dmg *= (1 + BOOM_LVL * (this.player.level - 1)) * ((z.boss || z.mini || z.lord) ? BOOM_BOSS : 1);
    }
    return hitO.call(this, z, dmg, kx, ky, src, ang, wp);
  };

  // ---------- 5c. passive regeneration halved while chased ----------
  // updatePlayer holds the relic regen and the hunger/thirst regen; the regen amount is predicted
  // (same conditions as play.js) and half of it is taken back, never below the HP before the frame.
  const upO = updatePlayer;
  updatePlayer = function (dt) {
    const P = G.player;
    let cut = 0;
    if (P && !guest() && chaseNear(P)) {
      const belly = Math.pow(0.75, P.perks.belly || 0);
      let nat = (P.relic('regen') || 0) * dt;
      if (P.hunger - dt * (100 / 1100) * belly > 60 && P.thirst - dt * (100 / 800) * belly > 60 && P.hurtT - dt < -4) nat += 0.8 * dt;
      cut = nat * 0.5;
    }
    const pre = P ? P.hp : 0;
    const r = upO.call(this, dt);
    if (cut > 0) { const gain = P.hp - pre; if (gain > 0) P.hp -= Math.min(cut, gain); }
    return r;
  };

  // per-tick: regeneration from buffs/perks in the v5Tick chain, backlash expiry, HUD badge
  const tkO = G.v5Tick;
  G.v5Tick = function (dt) {
    const P = this.player;
    const near = !!P && !guest() && chaseNear(P), pre = P ? P.hp : 0;
    tkO.call(this, dt);
    if (!P || guest()) return;   // co-op guests skip new ticks
    if (near && !P.dead) { const gain = P.hp - pre; if (gain > 0) P.hp = pre + gain * 0.5; }
    const pg = prog();
    if (pg.deb && this.time >= pg.deb.until) {
      P.maxHp += pg.deb.dHp; pg.deb = null;
      SYS.msg(R21({ sl: `Phản phệ đã tan. Máu và ${manaName()} tối đa đã hồi lại.`, tt: `Kinh mạch đã thông. ${manaName()} và máu tối đa đã hồi lại.`, md: `Cơ thể đã hồi phục. Máu và ${manaName()} tối đa đã trở lại.` }), 'info');
    }
    if (this.frame % 10 === 0) badge21();
  };
})();
