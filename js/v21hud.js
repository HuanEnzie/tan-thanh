// ===== v21hud: thanh kỹ năng 4 ô, tab Hệ thống "Kỹ năng", icon căn cứ =====
// Ô 1 luôn là kỹ năng đang dùng [V] (G.v6.skEq); Shift+1..4 và các nút ô 2-4 (cảm ứng) thi triển ô tương ứng.
// Mỗi kỹ năng hồi riêng 4 giây (G.v10.skCd[idx]); thi triển ô không đổi tuyệt kỹ / nút khác.
// Icon căn cứ: window.baseBadge(size) -> canvas, window.drawBaseBadge(g,x,y,size), window.baseIconHtml().
(function () {
  const SLOTS = 4, SKILL_CD = 4, GAP_CD = 0.8;
  const KEY_LBL = ['V', '⇧2', '⇧3', '⇧4'];
  const byId = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- base icon: a shield with a white house (asset gói X may provide IMG.ic_base_<world>) ----------
  const BASE_COL = { md: '#6dff7a', tt: '#ffd25a', sl: '#4fc3ff' };
  const worldK = () => (typeof RL !== 'undefined' && RL ? rk(RL.id) : 'sl');
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = c => Math.round(c * (1 - k)); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
  const badgeCache = {};
  window.baseBadge = function (size) {
    size = Math.max(8, Math.round(size || 24));
    const k = worldK(), im = IMG['ic_base_' + k], key = k + size + (im ? 'i' : 'p');
    if (badgeCache[key]) return badgeCache[key];
    const c = document.createElement('canvas'); c.width = c.height = size * 2;
    const g = c.getContext('2d');
    if (im) g.drawImage(im, 0, 0, c.width, c.height);
    else {
      const u = c.width / 24, col = BASE_COL[k] || BASE_COL.sl;
      g.setTransform(u, 0, 0, u, 0, 0);
      g.beginPath(); g.moveTo(12, 1.5); g.lineTo(21, 4.5); g.lineTo(21, 11.5); g.quadraticCurveTo(21, 19, 12, 22.5); g.quadraticCurveTo(3, 19, 3, 11.5); g.lineTo(3, 4.5); g.closePath();
      const gr = g.createLinearGradient(0, 1, 0, 23); gr.addColorStop(0, col); gr.addColorStop(1, shade(col, 0.5));
      g.fillStyle = gr; g.fill(); g.lineJoin = 'round'; g.lineWidth = 2; g.strokeStyle = '#000'; g.stroke();
      g.beginPath(); g.moveTo(6.5, 11.5); g.lineTo(12, 6); g.lineTo(17.5, 11.5); g.lineTo(15.5, 11.5); g.lineTo(15.5, 17.5); g.lineTo(8.5, 17.5); g.lineTo(8.5, 11.5); g.closePath();
      g.fillStyle = '#fff'; g.fill(); g.lineWidth = 1.5; g.stroke();
      g.fillStyle = '#000'; g.fillRect(10.8, 13.5, 2.4, 4);
    }
    return (badgeCache[key] = c);
  };
  window.drawBaseBadge = function (g, x, y, size) {
    if (x < -20 || y < -20 || x > g.canvas.width + 20 || y > g.canvas.height + 20) return;
    size = Math.max(8, Math.round(size));
    g.drawImage(baseBadge(size), x - size / 2, y - size / 2, size, size);
  };
  const htmlCache = {};
  window.baseIconHtml = function () {
    const k = worldK(), key = k + (IMG['ic_base_' + k] ? 'i' : 'p');
    if (!htmlCache[key]) htmlCache[key] = `<img src="${baseBadge(22).toDataURL()}" alt="" style="width:22px;height:22px;vertical-align:middle">`;
    return htmlCache[key];
  };
  // base mark on the corner minimap (same projection as the minimap itself)
  const dmm = UI.drawMinimap;
  UI.drawMinimap = function () {
    dmm.call(this);
    const v = G.v5, P = G.player && (G.player.car || G.player);
    if (!v || !v.basePos || !P || !this.mmctx || World.mode !== 'over') return;
    const S = 200 / 96, ox = P.x / TILE - 48, oy = P.y / TILE - 48;
    drawBaseBadge(this.mmctx, clamp((v.basePos.x / TILE - ox) * S, 10, 190), clamp((v.basePos.y / TILE - oy) * S, 10, 190), 16);
  };

  // ---------- skill slots ----------
  const ownedSk = () => { const V6 = G.v6; if (!V6 || !V6.skills) return []; return Object.keys(V6.skills).map(Number).filter(i => V6.skills[i]).sort((a, b) => a - b); };
  const skOwned = i => !!(G.v6 && G.v6.skills && G.v6.skills[i]);
  // the four slots; slot 0 always mirrors G.v6.skEq (the skill [V] uses); empty slots 2-4 take owned skills not on the bar yet
  const bar = () => {
    const v = G.v10; if (!v || !G.v6) return [null, null, null, null];
    const b = v.skBar || (v.skBar = [null, null, null, null]);
    const e = G.v6.skEq;
    b[0] = e != null && e >= 0 && skOwned(e) ? e : null;
    for (let j = 1; j < SLOTS; j++) if (b[j] != null && (!skOwned(b[j]) || b[j] === b[0])) b[j] = null;
    for (let j = 1; j < SLOTS; j++) if (b[j] == null) { const c = ownedSk().find(i => !b.includes(i)); if (c != null) b[j] = c; }
    return b;
  };
  // put skill idx into slot; a skill already on the bar moves here and the old occupant takes its place
  const assign = (slot, idx) => {
    const b = bar(), old = b[slot], j = b.indexOf(idx);
    if (j >= 0 && j !== slot) b[j] = old;
    b[slot] = idx;
    G.v6.skEq = b[0] != null ? b[0] : -1;
    bar(); SYS.refresh();
  };
  const cdLeft = i => { const c = G.v10 && G.v10.skCd ? G.v10.skCd[i] || 0 : 0; return Math.max(0, c - G.time); };

  // every successful cast records the 4-second cooldown of its skill, [V] included. The mana skill starts a
  // cut-in (v18) that freezes the world; its real cast runs later from cutFn, so the record is moved there too.
  const cm = G.castMana;
  G.castMana = function () {
    const e = this.v6 ? this.v6.skEq : -1, v = this.v10, m0 = v ? v.mana : 0, c0 = this.cutT;
    const r = cm.call(this);
    if (!v || e == null || e < 0) return r;
    if (this.cutT > 0 && !(c0 > 0) && typeof this.cutFn === 'function') {
      const f = this.cutFn, g = this;
      this.cutFn = function () { const mm = v.mana; f(); if (mm - v.mana >= 1) (v.skCd || (v.skCd = {}))[e] = g.time + SKILL_CD; };
    } else if (m0 - v.mana >= 1) (v.skCd || (v.skCd = {}))[e] = this.time + SKILL_CD;
    return r;
  };
  // cast slot i: own cooldown must be ready; the shared 0.8 s gap is applied only after a successful cast
  G.h21Cast = function (i) {
    const P = this.player, v = this.v10;
    if (!P || !v || !this.v6 || this.state !== 'playing' || UI.dialogOpen || P.dead || P.car || this.cutT > 0) return;
    const idx = bar()[i];
    if (idx == null) { this.toast(`Ô ${i + 1} chưa có kỹ năng. Gắn ở Hệ thống [N] › Kỹ năng.`, 'info'); return; }
    const left = cdLeft(idx);
    if (left > 0) { this.toast(`${skName(SKILLS[idx])} đang hồi (${Math.ceil(left)}s).`, 'info'); return; }
    const e0 = this.v6.skEq, mc0 = this.manaCd, mana0 = v.mana;
    this.v6.skEq = idx; this.manaCd = 0;
    if (Touch.on) Touch.aimNearest(420);
    this.castMana();
    if (this.cutT > 0 && typeof this.cutFn === 'function') {
      // cut-in queued: nothing is spent yet; the real cast reads skEq when the cut ends, so skEq is put back to idx then
      const f = this.cutFn, g = this;
      this.v6.skEq = e0; this.manaCd = mc0;
      g.cutFn = function () {
        g.v6.skEq = idx; g.manaCd = 0;
        const mm = v.mana;
        f();
        if (g.v6.skEq === idx) g.v6.skEq = e0;
        g.manaCd = mm - v.mana >= 1 ? g.time + GAP_CD : mc0;
      };
      return;
    }
    this.v6.skEq = e0;
    this.manaCd = mana0 - v.mana >= 1 ? this.time + GAP_CD : mc0;
  };
  // Shift + digit: take the press before the weapon-select code sees it (play.js updatePlayer reads Digit1-4)
  const upd = G.update;
  G.update = function (dt) {
    if (this.state === 'playing' && !UI.dialogOpen && (Input.keys.ShiftLeft || Input.keys.ShiftRight)) {
      for (let i = 0; i < SLOTS; i++) {
        const code = 'Digit' + (i + 1);
        if (Input.pressed[code]) { delete Input.pressed[code]; this.h21Cast(i); }
      }
    }
    return upd.call(this, dt);
  };

  // ---------- DOM ----------
  const css = document.createElement('style'); css.id = 'v21hud-css';
  css.textContent = `
#h21bar{position:absolute;left:50%;bottom:90px;transform:translateX(-50%);display:flex;align-items:flex-end;gap:6px;pointer-events:auto;z-index:2;white-space:nowrap}
#h21bar button,#h21t .h21ts{position:relative;overflow:hidden;margin:0;min-width:0;padding:2px 3px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;font-family:var(--font);font-size:15px;line-height:1;letter-spacing:0;color:#eadfc6;background:var(--panel);border:2px solid #3a2a1a;box-shadow:0 3px 0 #000;text-shadow:1px 1px 0 #000;cursor:pointer;transform:none;transition:none}
#h21bar button:hover:not(:disabled),#h21bar button:active:not(:disabled){transform:none;background:var(--panel);color:#eadfc6}
#h21bar button:active:not(:disabled){transform:translateY(2px);box-shadow:0 1px 0 #000}
#h21bar .k,#h21t .k{position:absolute;top:1px;left:4px;font-style:normal;font-size:14px;color:var(--gold);pointer-events:none}
#h21bar .nm{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;pointer-events:none}
#h21bar .ic,#h21t .ic{width:28px;height:28px;object-fit:contain;image-rendering:pixelated;pointer-events:none}
#h21bar .cost{position:absolute;top:1px;right:4px;font-size:13px;color:#c9b8ff;pointer-events:none}
#h21bar .cd,#h21t .cd{position:absolute;inset:0;background:rgba(0,0,0,.62);transform-origin:50% 100%;pointer-events:none}
#h21bar .cdt,#h21t .cdt{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:22px;color:#fff;text-shadow:2px 2px 0 #000;pointer-events:none}
#h21bar .h21s{width:76px;height:60px;border-color:var(--rc,#3a2a1a)}
#h21bar .h21s.lack .ic{filter:grayscale(.85) brightness(.55)}
#h21bar .h21s.lack .nm{color:#8a8070}
#h21bar .h21s.empty{border-style:dashed;opacity:.6}
#h21bar .h21q{width:70px;height:60px;border-color:#5a3a22}
#h21bar .h21q.ready{border-color:#ffe27a;box-shadow:0 0 12px rgba(255,226,122,.6),0 3px 0 #000}
#h21bar .h21q .pb{position:absolute;left:0;right:0;bottom:0;height:5px;background:rgba(0,0,0,.7);pointer-events:none}
#h21bar .h21q .pb i{display:block;height:100%;width:0;background:linear-gradient(90deg,#6b5bff,#3cf0ff)}
#h21bar .h21q .cost{font-size:12px;color:#bfe9ff}
#h21bar .h21k{width:104px;border-color:var(--rc,#8a7bff)}
#h21bar .h21k .cost{color:#e0d8ff}
#h21bar .h21j{width:58px}
#h21bar .h21k,#h21bar .h21j{height:60px}
body:not(.touch) #prompt{bottom:164px}
body:not(.touch) #actionbar{bottom:164px}
body:not(.touch) #carhud{bottom:160px}
body.touch #h21bar{display:none}
#h21t{display:none}
body.touch.tplay #h21t{display:block}
#h21t .h21ts{position:fixed;z-index:5;right:calc(250px + env(safe-area-inset-right,0px));width:44px;height:44px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#2a4f9a,#0c1838);border:2px solid #5a7ac8;box-shadow:0 3px 0 #000;font-size:11px;color:#fff;transform:none}
#h21t .h21ts.down{transform:scale(.9)}
#h21t .h21ts.empty{opacity:.4;border-style:dashed}
#h21t .h21ts.lack .ic{filter:grayscale(.85) brightness(.55)}
#h21t .h21ts .ic{width:26px;height:26px}
#h21t .h21ts .k{top:1px;left:50%;transform:translateX(-50%);font-size:11px}
#h21t .h21ts.s2{bottom:calc(88px + env(safe-area-inset-bottom,0px))}
#h21t .h21ts.s3{bottom:calc(138px + env(safe-area-inset-bottom,0px))}
#h21t .h21ts.s4{bottom:calc(188px + env(safe-area-inset-bottom,0px))}`;
  document.head.appendChild(css);

  const refs = el => ({ el, ic: el.querySelector('.ic'), nm: el.querySelector('.nm'), cost: el.querySelector('.cost'), cd: el.querySelector('.cd'), cdt: el.querySelector('.cdt') });
  const setTxt = (el, t) => { if (el && el._t !== t) { el._t = t; el.textContent = t; } };
  const setCls = (el, c, on) => { const k = '_c' + c; if (el[k] !== on) { el[k] = on; el.classList.toggle(c, on); } };
  const setSty = (el, p, v) => { const k = '_s' + p; if (el[k] !== v) { el[k] = v; el.style.setProperty(p, v); } };
  const setSrc = (el, src) => { if (el && el._src !== src) { el._src = src; el.src = src; } };
  const setHid = (el, h) => { if (el && el.hidden !== h) el.hidden = h; };

  let D = null, T = null, qEl, qI, qN, qE, qF, kEl, kN, kC, jEl, hudBar, touchWrap;
  function build() {
    const hud = byId('hud'); if (!hud || byId('h21bar')) return;
    hudBar = document.createElement('div'); hudBar.id = 'h21bar';
    let h = '<button class="h21q" id="h21q" tabindex="-1" title="Tuyệt kỹ [Q]"><i class="k">Q</i><img class="ic" alt=""><span class="nm"></span><span class="cost"></span><span class="pb"><i></i></span></button>';
    for (let i = 0; i < SLOTS; i++) h += `<button class="h21s" tabindex="-1" data-i="${i}"><i class="k">${KEY_LBL[i]}</i><img class="ic" alt=""><span class="nm"></span><span class="cost"></span><span class="cd" hidden></span><span class="cdt"></span></button>`;
    h += '<button class="h21k" id="h21k" tabindex="-1" title="Binh đoàn [K] • chuột phải hoặc giữ: đổi đội nhanh"><i class="k">K</i><span class="nm"></span><span class="cost"></span></button>';
    h += '<button class="h21j" id="h21j" tabindex="-1" title="Đổi chỗ [J]"><i class="k">J</i><span class="nm">Đổi chỗ</span></button>';
    hudBar.innerHTML = h;
    hudBar.addEventListener('mousedown', e => e.preventDefault());
    hud.appendChild(hudBar);
    qEl = byId('h21q'); qI = qEl.querySelector('.ic'); qN = qEl.querySelector('.nm'); qE = qEl.querySelector('.cost'); qF = qEl.querySelector('.pb i');
    D = [...hudBar.querySelectorAll('.h21s')].map(refs);
    D.forEach((r, i) => { r.el.onclick = () => G.h21Cast(i); });
    kEl = byId('h21k'); kN = kEl.querySelector('.nm'); kC = kEl.querySelector('.cost');
    jEl = byId('h21j');
    qEl.onclick = () => { if (G.state === 'playing') G.castSkill(); };
    jEl.onclick = () => { if (G.state === 'playing' && typeof G.swapQuick === 'function') G.swapQuick(); };
    // K: click = summon the army (quick unit when the army module provides it); right click or hold = cycle the quick unit
    const cycleK = () => { if (G.state === 'playing' && typeof G.armyCycleQuick === 'function') G.armyCycleQuick(); };
    let kTimer = 0, kHeld = false;
    kEl.addEventListener('pointerdown', e => { if (e.button !== 0) return; kHeld = false; clearTimeout(kTimer); kTimer = setTimeout(() => { kHeld = true; cycleK(); }, 450); });
    const kCancel = () => clearTimeout(kTimer);
    kEl.addEventListener('pointerup', kCancel); kEl.addEventListener('pointerleave', kCancel);
    kEl.addEventListener('contextmenu', e => { e.preventDefault(); kCancel(); cycleK(); });
    kEl.onclick = () => {
      if (kHeld) { kHeld = false; return; }
      if (G.state !== 'playing') return;
      if (typeof G.armySummonQuick === 'function') G.armySummonQuick(); else G.summonAll();
    };

    // touch: slots 2-4 beside the PHÁP button (slot 1 is #tCast itself)
    touchWrap = document.createElement('div'); touchWrap.id = 'h21t';
    const opt = { passive: false };
    T = [];
    for (let i = 1; i < SLOTS; i++) {
      const b = document.createElement('button'); b.className = `h21ts s${i + 1}`; b.setAttribute('tabindex', '-1');
      b.innerHTML = `<i class="k">${i + 1}</i><img class="ic" alt=""><span class="cd" hidden></span><span class="cdt"></span>`;
      touchWrap.appendChild(b);
      const r = refs(b); T.push(r);
      b.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); b.classList.add('down'); G.h21Cast(i); }, opt);
      const up = e => { e.preventDefault(); b.classList.remove('down'); };
      b.addEventListener('touchend', up, opt); b.addEventListener('touchcancel', up, opt);
      b.onclick = () => G.h21Cast(i);
    }
    document.body.appendChild(touchWrap);
  }

  function paintSlot(r, idx, mana) {
    const empty = idx == null, S = empty ? null : SKILLS[idx];
    const cost = empty ? 0 : G.skillCost(idx), left = empty ? 0 : cdLeft(idx);
    setCls(r.el, 'empty', empty);
    setCls(r.el, 'lack', !empty && mana < cost);
    setSty(r.el, '--rc', empty ? '#3a2a1a' : S.col);
    const src = !empty && IMG['sk_' + idx] ? IMG['sk_' + idx].src : '';
    setSrc(r.ic, src); setHid(r.ic, !src);
    setTxt(r.nm, empty ? 'Trống' : skName(S));
    setTxt(r.cost, empty ? '' : String(cost));
    setHid(r.cd, left <= 0);
    if (left > 0) setSty(r.cd, 'transform', `scaleY(${(left / SKILL_CD).toFixed(3)})`);
    setTxt(r.cdt, left > 0 ? String(Math.ceil(left)) : '');
  }

  function paint() {
    const P = G.player, v = G.v10; if (!P || !v || !D) return;
    const b = bar(), mana = v.mana || 0;
    const e = Math.max(0, Math.min(100, P.energy || 0)), ready = e >= 100;
    setCls(qEl, 'ready', ready);
    setSrc(qI, IMG[ULT_ICON[rk(RL.id)]] ? IMG[ULT_ICON[rk(RL.id)]].src : ''); setHid(qI, !IMG[ULT_ICON[rk(RL.id)]]);
    setTxt(qN, RL && RL.skill ? RL.skill.name : 'Tuyệt kỹ');
    setTxt(qE, ready ? 'SẴN SÀNG' : Math.floor(e) + '%');
    setSty(qF, 'width', e + '%');
    const sm = SM();
    setSty(kEl, '--rc', sm.col);
    setTxt(kN, typeof G.armyQuickName === 'function' ? G.armyQuickName() : sm.army);
    setTxt(kC, String((v.shadows || []).length));
    for (let i = 0; i < SLOTS; i++) paintSlot(D[i], b[i], mana);
    if (T) for (let i = 1; i < SLOTS; i++) paintSlot(T[i - 1], b[i], mana);
  }

  let labelDone = false;
  function fixLabels() {
    if (labelDone) return;
    const ml = byId('mmlabel'); if (!ml || !/\[V\]/.test(ml.textContent)) return;
    labelDone = true;
    if (ml.textContent.includes('[X] Gọi bóng')) ml.textContent = ml.textContent.replace('[X] Gọi bóng', '[K] Gọi binh đoàn');
  }
  const uu = UI.update;
  UI.update = function (dt) {
    uu.call(this, dt);
    fixLabels();
    paint();
  };
  // the attribute page says the army is called with [X] (X is the dash); it is [K]
  const ba = UI.buildAttr;
  UI.buildAttr = function () {
    const r = ba.call(this), box = byId('invBody');
    if (box) box.querySelectorAll('p').forEach(p => { if (p.textContent.includes('[X]')) p.textContent = p.textContent.replace('[X]', '[K]'); });
    return r;
  };

  // ---------- Hệ thống tab: owned skills, assign to slots 1-4 ----------
  SYS.addTab({
    id: 'skills', icon: '⚔', name: 'Kỹ năng', order: 40,
    render(body) {
      const b = bar(), own = ownedSk();
      let h = '<h3>Ô kỹ năng</h3>';
      h += '<p class="muted">Ô 1 là kỹ năng dùng bằng [V] (và ⇧1). Ô 2-4 dùng bằng ⇧2 ⇧3 ⇧4, trên điện thoại là các nút cạnh PHÁP. Mỗi kỹ năng hồi 4 giây. Gắn một kỹ năng vào ô đã có kỹ năng khác thì hai ô đổi chỗ.</p>';
      if (!own.length) h += `<p class="muted">Chưa có kỹ năng Tế Đàn nào — triệu hồi ở ${GACHA_NAME[rk(RL.id)]} để nhận.</p>`;
      for (const i of own) {
        const S = SKILLS[i], slot = b.indexOf(i), m = G.mast ? G.mast('s' + i) : null, img = IMG['sk_' + i];
        h += `<div class="s21row" style="--pc:${S.col}">`
          + `<img src="${img ? img.src : ''}" alt="" width="36" height="36" style="image-rendering:pixelated">`
          + `<div class="grow"><b>${esc(skName(S))}</b> <small class="muted">${'★'.repeat(S.star)} • bậc ${G.v6.skills[i]}/5 • ${G.skillCost(i)} ${esc(manaName())}${m ? ' • thông thạo ' + m.lv + '/10' : ''}</small>`
          + `<div class="muted">${esc(S.desc)}</div></div>`;
        for (let s = 0; s < SLOTS; s++) h += `<button data-sk="${i}" data-slot="${s}" class="${slot === s ? 'on' : ''}">Ô ${s + 1}${slot === s ? ' ✔' : ''}</button>`;
        h += '</div>';
      }
      body.innerHTML = h;
      body.querySelectorAll('[data-slot]').forEach(bt => { bt.onclick = () => assign(+bt.dataset.slot, +bt.dataset.sk); });
    },
  });

  build();
})();
