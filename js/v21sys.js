// ===== v21 gói S: Bảng Hệ thống — nút HỆ THỐNG trên HUD, mục ☰ trên điện thoại, tab Trạng thái / Điểm danh / Căn cứ =====
// Nạp sau v21core.js. Toàn bộ nằm trong một IIFE. Chỉ bọc G.v5Tick (badge, ghi chú điểm danh) và UI.openPanel ('system').
// Khóa lưu mới trong G.v10.sys: ci = {last, streak} (điểm danh), newbie (gói tân thủ đã nhận), ciNote (ngày đã nhắc).
(function () {
  const $ = id => document.getElementById(id);
  const hero = () => (typeof Story !== 'undefined' && Story.names && Story.names.hero) || '';

  // ---------- CSS ----------
  const styleEl = document.createElement('style');
  styleEl.id = 'v21sys-css';
  styleEl.textContent = `
#sys21-hud{position:absolute;top:16px;right:16px;z-index:4;pointer-events:auto;cursor:pointer;min-width:0;width:100px;height:46px;padding:2px 4px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;background:linear-gradient(180deg,rgba(8,22,46,.94),rgba(4,12,28,.94));border:2px solid #4fc3ff;border-radius:6px;box-shadow:0 0 12px rgba(79,195,255,.75),inset 0 0 10px rgba(79,195,255,.25);color:#dff4ff;text-shadow:0 0 6px rgba(79,195,255,.9);line-height:1;transform:none}
#sys21-hud:hover,#sys21-hud:focus-visible{background:linear-gradient(180deg,rgba(14,40,80,.96),rgba(6,20,44,.96));border-color:#7fd8ff;box-shadow:0 0 18px rgba(127,216,255,.95),inset 0 0 12px rgba(79,195,255,.35);outline:none;transform:none}
#sys21-hud:active{transform:translateY(1px)}
#sys21-hud .ic{font-size:20px;color:#7fd8ff}
#sys21-hud .lb{font-size:13px;letter-spacing:.5px;white-space:nowrap}
#sys21-hud .dot{position:absolute;top:-7px;right:-7px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:#ff4a4a;color:#fff;font-size:12px;line-height:16px;text-align:center;font-style:normal;text-shadow:none;box-shadow:0 0 6px #ff4a4a}
#sys21-hud .dot[hidden]{display:none}
body.touch #sys21-hud{top:calc(8px + env(safe-area-inset-top,0px));right:calc(220px + env(safe-area-inset-right,0px));min-width:0;width:106px;height:32px;flex-direction:row;gap:5px;padding:0 6px;box-shadow:0 3px 0 #000,0 0 10px rgba(79,195,255,.6)}
body.touch #sys21-hud .ic{font-size:16px}
body.touch #sys21-hud .lb{font-size:12px;letter-spacing:0;white-space:nowrap}
body.touch #sys21-hud .dot{top:-6px;right:-6px}
#s21 .s21b .sys21-b{min-width:0}
#s21 .s21b .sys21-b:disabled{opacity:.4;cursor:default}
#s21 .sys21-card{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin:6px 0 10px}
#s21 .sys21-day{border:1px solid rgba(79,195,255,.3);background:rgba(79,195,255,.06);padding:6px 8px;min-height:56px}
#s21 .sys21-day b{color:#7fd8ff;font-weight:normal}
#s21 .sys21-day small{display:block;color:#bfe9ff;font-size:.8em;line-height:1.15}
#s21 .sys21-day.ok{opacity:.5;border-color:#6dff9a}
#s21 .sys21-day.now{border-color:#ffd24a;box-shadow:0 0 10px rgba(255,210,74,.5)}
#s21 .sys21-big{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px;margin-top:8px}
#s21 .sys21-big button{text-align:left;padding:10px 12px;font-size:19px}
#s21 .sys21-big small{display:block;color:#8fb3c9;font-size:.75em}
#s21 .sys21-bar{flex:0 0 120px;height:10px;background:rgba(0,0,0,.5);border:1px solid rgba(79,195,255,.4)}
#s21 .sys21-bar i{display:block;height:100%;background:linear-gradient(90deg,#2a8ad8,#7fd8ff)}
#s21 .sys21-warn{color:#ff9a9a}
`;
  document.head.appendChild(styleEl);

  // ---------- reward tables ----------
  // Điểm danh: 7 ngày. N1 50 tiền + 2 điểm HT; N2 băng gạc×3; N3 5 điểm HT; N4 hồi xuân đan×2; N5 cuộn×1; N6 nguyên liệu đột phá×2; N7 hộp bí ẩn×1 + 10 điểm HT.
  const CI_DAYS = [
    { gold: 50, sp: 2 },
    { items: [['bandage', 3]] },
    { sp: 5 },
    { items: [['medkit', 2]] },
    { items: [['scroll', 1]] },
    { items: [['bt_a', 2]] },
    { items: [['mystery', 1]], sp: 10 },
  ];
  const NEWBIE = { gold: 100, sp: 5, items: [['bandage', 5], ['medkit', 2], ['scroll', 2]] };
  const BASE_LINKS = [
    ['build', '🔨', 'Công trình', 'xây, nâng cấp căn cứ'],
    ['forge', '⚒', 'Lò rèn', 'rèn, cường hoá trang bị'],
    ['kitchen', '🍲', 'Bếp', 'nấu món hồi sức'],
    ['bounty', '📜', 'Nhiệm vụ treo thưởng', 'nhận việc, nhận thưởng'],
    ['bt', '✦', 'Đột phá', 'vượt bình cảnh cấp'],
  ];

  const rewardText = R => {
    const parts = [];
    if (R.gold) parts.push(`${R.gold} ${cur().name}`);
    for (const [id, n] of R.items || []) parts.push(`${n} ${(itm(id) || {}).name || id}`);
    if (R.sp) parts.push(`${R.sp} ${spName()}`);
    return parts.join(', ');
  };
  const giveReward = R => {
    const P = G.player; if (!P) return;
    if (R.gold) P.gold += R.gold;
    for (const [id, n] of R.items || []) G.give(id, n);
    if (R.sp) G.spAdd(R.sp, false);
  };
  const afterClaim = () => { updBadge(); SYS.refresh(); };

  // ---------- điểm danh ----------
  const ciRec = () => { const s = G.sys(); return s.ci || (s.ci = { last: null, streak: 0 }); };
  // whole days from a to b (YYYY-MM-DD), DST-safe
  const dayNum = (a, b) => {
    const p = s => { const [y, m, d] = String(s).split('-').map(Number); return Date.UTC(y, m - 1, d); };
    return Math.round((p(b) - p(a)) / 864e5);
  };
  // done: today already claimed (day = the day claimed today); otherwise day = the day today's claim gives (1..7)
  // claimed = how many days of the current cycle are already claimed
  const ciState = () => {
    const c = ciRec(), t = today21();
    if (c.last && dayNum(c.last, t) <= 0) return { done: true, day: c.streak || 1, claimed: c.streak || 0 };
    const cont = !!c.last && dayNum(c.last, t) === 1;   // claimed yesterday: continue the cycle
    const claimed = cont && c.streak < 7 ? c.streak : 0; // missed a day or finished a cycle: back to day 1
    return { done: false, day: claimed + 1, claimed };
  };
  const claimDaily = () => {
    const st = ciState();
    if (st.done || !G.player) return;
    const R = CI_DAYS[st.day - 1], c = ciRec();
    c.last = today21(); c.streak = st.day;
    giveReward(R);
    SYS.msg(`Điểm danh ngày ${st.day}: ${rewardText(R)}`, 'reward');
    afterClaim();
  };
  const claimNewbie = () => {
    const s = G.sys();
    if (s.newbie || !G.player) return;
    s.newbie = 1;
    giveReward(NEWBIE);
    SYS.msg(`Gói tân thủ: ${rewardText(NEWBIE)}`, 'reward');
    afterClaim();
  };
  // once per real day, when a game is running and today's check-in is still open
  const dailyNote = () => {
    const s = G.sys();
    if (s.ciNote === today21() || ciState().done) return;
    s.ciNote = today21();
    SYS.msg('Hôm nay chưa điểm danh — mở [N] Hệ thống để nhận thưởng.', 'quest');
  };

  // ---------- tab: Trạng thái (order 10) ----------
  SYS.addTab({
    id: 'status', icon: '👤', name: 'Trạng thái', order: 10,
    badge: () => !!((G.v10 && G.v10.pts > 0) || (G.btBlocked && G.btBlocked())),
    render(body) {
      const P = G.player, v = G.v10 || {};
      if (!P) { body.innerHTML = '<p class="muted">Chưa vào thế giới.</p>'; return; }
      const need = Math.max(1, G.xpNeed(P.level));
      const mmax = Math.max(1, G.maxMana());
      const mana = v.mana == null ? mmax : Math.max(0, Math.floor(v.mana));
      const pts = v.pts || 0;
      const pct = (x, max) => Math.max(0, Math.min(100, Math.round(100 * x / Math.max(1, max))));
      const bar = (x, max) => `<div class="sys21-bar"><i style="width:${pct(x, max)}%"></i></div>`;
      const title = (G.titleName && G.titleName()) || '—';
      const debuff = (G.debuffText && G.debuffText()) || 'Không có';
      let h = `<h3>${esc21(hero() || 'Vô danh')} <span class="muted">${esc21(clsName(v.cls) || '—')} • Cấp ${P.level}</span></h3>`;
      h += `<div class="s21row"><div class="grow">Kinh nghiệm</div>${bar(P.xp, need)}<span>${Math.floor(P.xp)} / ${need}</span></div>`;
      h += `<div class="s21row"><div class="grow">Máu</div>${bar(P.hp, P.maxHp)}<span>${Math.max(0, Math.ceil(P.hp))} / ${P.maxHp}</span></div>`;
      h += `<div class="s21row"><div class="grow">${esc21(manaName())}</div>${bar(mana, mmax)}<span>${mana} / ${mmax}</span></div>`;
      if (G.btBlocked && G.btBlocked()) {
        h += `<div class="s21row sys21-warn"><div class="grow">Đã chạm bình cảnh cấp ${P.level}: cần đột phá để lên tiếp.</div><button class="sys21-b" data-sys21-bt>✦ Đột phá</button></div>`;
      }
      h += `<h3>Thuộc tính <span class="muted">Điểm chưa phân: <b>${pts}</b></span></h3>`;
      for (const k of ATTR_KEYS) {
        h += `<div class="s21row"><div class="grow">${esc21(attrName(k))}</div><span>${G.attr(k)}</span><button class="sys21-b" data-sys21-attr="${k}" ${pts > 0 ? '' : 'disabled'}>+1</button></div>`;
      }
      h += `<div class="s21row"><div class="grow">Danh hiệu</div><span>${esc21(title)}</span></div>`;
      h += `<div class="s21row"><div class="grow">Hiệu ứng</div><span>${esc21(debuff)}</span></div>`;
      body.innerHTML = h;
      body.querySelectorAll('[data-sys21-attr]').forEach(b => { b.onclick = () => { G.addAttr(b.dataset.sys21Attr, 1); SYS.refresh(); }; });
      const bt = body.querySelector('[data-sys21-bt]');
      if (bt) bt.onclick = () => { SYS.close(); UI.openBase('bt'); };
    },
  });

  // ---------- tab: Điểm danh (order 20) ----------
  SYS.addTab({
    id: 'checkin', icon: '📅', name: 'Điểm danh', order: 20,
    badge: () => !ciState().done,
    render(body) {
      const st = ciState(), s = G.sys();
      const cards = CI_DAYS.map((R, i) => {
        const cls = i < st.claimed ? 'ok' : (!st.done && i === st.day - 1 ? 'now' : '');
        return `<div class="sys21-day ${cls}"><b>Ngày ${i + 1}${i === 6 ? ' ★' : ''}</b><small>${esc21(rewardText(R))}</small>${cls === 'ok' ? '<small>✓ đã nhận</small>' : ''}</div>`;
      }).join('');
      body.innerHTML = `
        <h3>Điểm danh hằng ngày — chu kỳ 7 ngày</h3>
        <p class="muted">Hôm nay: ${today21()}. Bỏ lỡ một ngày thì chu kỳ quay về Ngày 1.</p>
        <div class="sys21-card">${cards}</div>
        <div class="s21row"><div class="grow">${st.done ? 'Hôm nay đã điểm danh (Ngày ' + st.day + ').' : 'Hôm nay nhận thưởng Ngày ' + st.day + '.'}</div>
          <button class="sys21-b" data-sys21-ci ${st.done ? 'disabled' : ''}>${st.done ? '✓ Đã điểm danh' : 'Điểm danh ngày ' + st.day}</button></div>
        <h3>Gói tân thủ <span class="muted">nhận một lần</span></h3>
        <div class="s21row"><div class="grow">${esc21(rewardText(NEWBIE))}</div>
          <button class="sys21-b" data-sys21-nb ${s.newbie ? 'disabled' : ''}>${s.newbie ? '✓ Đã nhận' : 'Nhận gói tân thủ'}</button></div>`;
      const ci = body.querySelector('[data-sys21-ci]'); if (ci) ci.onclick = claimDaily;
      const nb = body.querySelector('[data-sys21-nb]'); if (nb) nb.onclick = claimNewbie;
    },
  });

  // ---------- tab: Căn cứ (order 60) ----------
  SYS.addTab({
    id: 'base', icon: '🏠', name: 'Căn cứ', order: 60,
    render(body) {
      const v = G.v5;
      const lv = v && v.base ? BASE_ORDER.reduce((a, b) => a + (v.base[b] || 0), 0) : 0;
      const res = v ? v.residents || 0 : 0;
      body.innerHTML = `
        <h3>Căn cứ — cấp ${lv}/30 • ${res} cư dân</h3>
        <p class="muted">Bấm để mở thẳng mục đó. Xây, rèn, nấu và nhận thưởng phải ở trong căn cứ; đang ở xa thì xem được nhưng phải bấm DỊCH CHUYỂN VỀ CĂN CỨ trong mục đó.</p>
        <div class="sys21-big">${BASE_LINKS.map(([id, ic, name, note]) => `<button class="sys21-b" data-sys21-base="${id}">${ic} ${esc21(name)}<small>${esc21(note)}</small></button>`).join('')}</div>`;
      body.querySelectorAll('[data-sys21-base]').forEach(b => { b.onclick = () => { SYS.close(); UI.openBase(b.dataset.sys21Base); }; });
    },
  });

  // ---------- HUD button (desktop + touch) ----------
  const hb = document.createElement('button');
  hb.id = 'sys21-hud'; hb.type = 'button'; hb.setAttribute('aria-label', 'Hệ thống');
  hb.innerHTML = '<span class="ic">◈</span><span class="lb">HỆ THỐNG</span><i class="dot" hidden>!</i>';
  hb.addEventListener('click', () => SYS.open());
  if ($('hud')) $('hud').appendChild(hb);

  // ---------- ☰ menu entry on phones (touch.js binds [data-a] inside #tmenu at Touch.init, after this file) ----------
  const mb = document.createElement('button');
  mb.dataset.a = 'system';
  mb.innerHTML = '◈<span>Hệ thống</span>';
  if ($('tmore')) $('tmore').insertBefore(mb, $('tmore').firstChild);
  const openPanel0 = UI.openPanel;
  UI.openPanel = function (id) { if (id === 'system') { SYS.open(); return; } return openPanel0.call(this, id); };

  // ---------- badges and per-world labels ----------
  let labelRealm = null;
  const syncLabels = () => {
    if (labelRealm === RL.id) return;
    labelRealm = RL.id;
    hb.querySelector('.lb').textContent = R21({ md: 'HỆ THỐNG', tt: 'THIÊN ĐẠO', sl: 'HỆ THỐNG' });
    mb.querySelector('span').textContent = R21({ md: 'Hệ thống', tt: 'Thiên Đạo', sl: 'Hệ thống' });
  };
  function updBadge() {
    let on = false;
    for (const t of SYS.tabs) { try { if (t.badge && t.badge()) { on = true; break; } } catch (e) { /* a broken badge must not break the HUD */ } }
    hb.querySelector('.dot').hidden = !on;
  }

  // ---------- tick: label sync every frame (cheap), badge every 60 frames, daily note every 30 frames ----------
  const tick0 = G.v5Tick;
  G.v5Tick = function (dt) {
    const r = tick0.call(this, dt);
    syncLabels();
    if (typeof Net !== 'undefined' && Net.active && Net.guest) return r;
    if (this.frame % 60 === 0) updBadge();
    if (this.frame % 30 === 0 && this.state === 'playing' && this.player && !this.player.dead) dailyNote();
    return r;
  };
})();
