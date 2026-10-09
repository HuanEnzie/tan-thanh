// ===== v11 UI: class picker, class card in Nhân vật, summon army panel with jobs, explore + swap on the map =====
(function () {
  const H = s => esc(String(s));
  const cIcon = (k, r) => { const n = `cls_${rk(r || RL.id)}_${k}`; return IMG[n] ? IMG[n].src : `assets/img/${n}.png`; };

  // ---------- world screen: class picker ----------
  UI.pickedClass = 'warrior';
  const rp = UI.refreshPick;
  UI.refreshPick = function (newName) {
    rp.call(this, newName);
    const r = this.pickedRealm, g = this.pickedGender || 'm';
    let box = $('pickClass');
    if (!box) { $('pickComps').insertAdjacentHTML('beforebegin', '<div id="pickClass"></div>'); box = $('pickClass'); }
    const I = CLASS_INFO[this.pickedClass];
    box.innerHTML = '<div class="pcl">' + CLASS_KEYS.map(k => `<button data-cl="${k}" class="${k === this.pickedClass ? 'on' : ''}" style="--cc:${CLASS_INFO[k].col}"><img src="assets/img/${rk(r)}_cls_${k}_${g}.png" alt="" onerror="this.style.visibility='hidden'"><span>${H(clsName(k, r))}</span></button>`).join('') + '</div>'
      + `<p class="pcd"><b style="color:${I.col}">${H(clsName(this.pickedClass, r))}</b> — ${H(I.pass)}. Lướt: ${H(I.dash)}. Hợp: ${H(I.gear)}.</p>`;
    box.querySelectorAll('[data-cl]').forEach(b => b.onclick = () => { this.pickedClass = b.dataset.cl; Sound.play('sfx_click', 0.35); this.refreshPick(); });
  };

  // ---------- Nhân vật: class card ----------
  const ba = UI.buildAttr;
  UI.buildAttr = function () {
    ba.call(this);
    const c = cls(), box = $('invBody');
    let h = '<div class="clscard">';
    if (c) {
      const I = CLASS_INFO[c], here = G.atBase && G.atBase();
      h += `<img src="${cIcon(c)}" alt=""><div><b style="color:${I.col}">${H(clsName(c))}</b><p>${H(I.pass)}</p><p>Lướt [Space]: ${H(I.dash)}</p><p class="muted">Nên cộng: ${I.build.map(attrName).join(' + ')} • Hợp: ${H(I.gear)} (đồ rơi nghiêng về loại này)</p>`
        + `<button id="clsChange" ${here ? '' : 'disabled'}>Đổi chức nghiệp (${G.classCost()} ${H(cur().name)})${here ? '' : ' — ở căn cứ'}</button></div>`;
    } else h += '<div><b>Chưa chọn chức nghiệp</b><p><button id="clsChange">Chọn chức nghiệp</button></p></div>';
    box.insertAdjacentHTML('afterbegin', h + '</div>');
    const b = $('clsChange'); if (b) { this.bindBtn(b); b.onclick = () => {
      if (!c) { this.closePanel(); G.classMenu(true); return; }
      const cost = G.classCost();
      if (G.player.gold < cost) { G.toast(`Cần ${cost} ${cur().name}.`, 'warn'); return; }
      this.closePanel(); G.player.gold -= cost; G.classMenu(false);
    }; }
  };

  // ---------- summon army panel ----------
  UI.buildShadows = function () {
    const v = G.v10, box = $('invBody'), cap = G.shadowCap(), S = SM();
    const tab = document.querySelector('#inv [data-tab="shadows"]'); if (tab) tab.textContent = S.army;
    let h = `<h3>${H(S.army)} <small>đã lưu ${v.shadows.length}/${cap} • lính tạm tối đa ${G.tempCap()} • ${H(manaName())} ${Math.floor(v.mana)}/${G.maxMana()}</small></h3>`;
    const st = Object.entries(v.stock || {}).filter(([, n]) => n >= 1).map(([id, n]) => `${Math.floor(n)} ${id === 'gold' ? cur().name : itm(id).name}`);
    const nAll = v.shadows.length, sel = v.sumN | 0, busyN = v.shadows.filter(s => G.shBusy(s)).length;
    h += `<div class="shctl"><div class="shn"><span>Số ${H(S.unit)} mỗi lần gọi</span><button id="shMinus" aria-label="Giảm">−</button><b id="shNum">${sel ? sel : 'Tất cả'}</b><button id="shPlus" aria-label="Tăng">+</button></div><button id="shCall">${S.icon} GỌI ${sel ? sel : 'QUÂN RẢNH'} [K]</button><button id="shCallAll" ${busyN ? '' : 'class="ghost"'}>⚑ GỌI TOÀN BỘ${busyN ? ` (+${busyN} đang bận)` : ''}</button><button id="shDismiss" class="warn">✕ HỦY TRIỆU HỒI [Shift+K]</button></div><div class="shbar"><span class="muted">${H(S.skill)}: hạ kẻ địch, đứng cạnh xác (khói màu) nhấn [E] để thu phục; thất bại thì chỉ đứng dậy tạm thời. Mỗi cấp thêm 1 ô lưu và 1 lính tạm. Mỗi loại boss chỉ có một.${st.length ? `<br>📦 Đang giữ: ${H(st.join(', '))} — về căn cứ để nhận.` : ''}</span></div><div class="party10 shl">`;
    const list = v.shadows.slice().sort((a, b) => SH_ORDER.indexOf(a.tier) - SH_ORDER.indexOf(b.tier));
    const MODES = [['fight', '⚔', 'Chiến đấu'], ['loot', '🎒', 'Nhặt đồ'], ['wood', '🪓', 'Đốn gỗ']];
    for (const s of list) {
      const T = SH_TIER[s.tier], ss = G.shStats(s), act = G.shadowAlly(s), cd = s.cd > G.time, mode = s.mode || 'loot';
      let src = ''; try { src = IMG[s.img] ? G.shadowOf(s.img).toDataURL() : ''; } catch (e) {}
      let status, btns = '';
      if (s.job) { const left = Math.max(0, Math.ceil(JOB_TIME - (G.time - s.job.t))); status = `⚒ ${SH_JOBS[s.job.kind].name} • mẻ sau ${left}s`; btns = `<button data-sj="${s.id}">Gọi về</button>`; }
      else if (s.exp) { status = s.exp.done ? '🧭 Đang canh ở nơi khám phá' : `🧭 Đang đi khám phá (${Math.round(Math.min(1, (G.time - s.exp.t0) / s.exp.dur) * 100)}%)`; btns = `<button data-sw="${s.id}">⇄ Hoán đổi</button><button data-sj="${s.id}">Gọi về</button>`; }
      else if (act) { status = `➤ Đang ${mode === 'wood' ? 'đốn gỗ' : mode === 'loot' ? 'nhặt đồ' : 'chiến đấu'} (${Math.round(act.hp)}/${Math.round(act.maxHp)})`; btns = `<button data-sr="${s.id}">Thu hồi</button><button data-sw="${s.id}">⇄ Hoán đổi</button>`; }
      else if (cd) { status = `⌛ Hồi phục ${Math.ceil(s.cd - G.time)}s`; btns = '<button disabled>Triệu hồi</button>'; }
      else { status = '◌ Đang nghỉ'; btns = `<button data-ss="${s.id}">Triệu hồi</button>`; }
      const free = !s.job && !s.exp;
      h += `<div class="pc10 sh ${act ? 'on' : ''}" style="--tc:${T.col}"><img class="spr" src="${src}" alt=""><div class="pci"><b>${H(s.nick || s.name)} <button class="ren" data-sn="${s.id}" aria-label="Đặt tên">✎</button></b><small style="color:${T.col}">${s.nick ? H(s.name) + ' • ' : ''}${T.name} • cấp ${ss.slv} • ${s.kills || 0} mạng</small><div class="pst"><span>Máu ${ss.hp}</span><span>Công ${ss.dmg}</span><span>Gọi ${ss.cost} ${H(manaName())}</span></div><div class="pstat">${status}</div></div>`
        + `<div class="shact"><div class="pbtn">${btns}</div>${free ? `<div class="pbtn modes">${MODES.map(([k, ic, nm]) => `<button class="${mode === k ? 'on' : 'ghost'}" data-sm="${s.id}:${k}">${ic} ${nm}</button>`).join('')}</div><div class="pbtn"><button class="ghost" data-sk="${s.id}">⚒ Làm việc</button><button class="ghost" data-se="${s.id}">🧭 Khám phá</button><button class="ghost" data-sx="${s.id}">Thả</button></div>` : `<div class="pbtn"><button class="ghost" data-sx="${s.id}">Thả</button></div>`}</div></div>`;
    }
    if (!list.length) h += `<p class="muted">Chưa có ${H(S.unit)} nào.</p>`;
    box.innerHTML = h + '</div>';
    box.querySelectorAll('button').forEach(b => this.bindBtn(b));
    const setN = n => { v.sumN = Math.max(0, Math.min(Math.max(1, v.shadows.length), n)); if (v.sumN >= v.shadows.length && v.shadows.length) v.sumN = 0; this.buildInv(); };
    $('shMinus').onclick = () => setN((v.sumN || v.shadows.length) - 1);
    $('shPlus').onclick = () => setN((v.sumN || 0) + 1);
    $('shCall').onclick = () => { G.summonAll({ noShift: true }); this.buildInv(); };
    $('shCallAll').onclick = () => { G.summonAll({ noShift: true, includeBusy: true, n: 1e9 }); this.buildInv(); };
    $('shDismiss').onclick = () => { G.dismissAll(); this.buildInv(); };
    const f = id => G.shById(+id), on = (sel, fn) => box.querySelectorAll(`[${sel}]`).forEach(b => b.onclick = () => fn(f(b.getAttribute(sel)), b));
    on('data-ss', s => { const r = G.summonShadow(s); if (r === 'mana') G.toast(`Không đủ ${manaName()}.`, 'warn'); this.buildInv(); });
    on('data-sr', s => { G.recallShadow(s); this.buildInv(); });
    on('data-sj', s => { s.job = null; s.exp = null; G.toast(`${s.nick || s.name} đã trở về.`, 'info'); this.buildInv(); });
    on('data-sw', s => { this.closePanel(); G.swapShadow(s); });
    box.querySelectorAll('[data-sm]').forEach(b => b.onclick = () => { const [id, m] = b.dataset.sm.split(':'), s = f(id); s.mode = m; const a = G.shadowAlly(s); if (a) { a.chopP = null; a.lootIt = null; } this.buildInv(); });
    on('data-sn', s => this.askName(`Đặt tên cho ${s.name}`, s.nick || '', v2 => { s.nick = v2; const a = G.shadowAlly(s); if (a) a.sname = v2 || s.name; this.buildInv(); }));
    on('data-sk', s => { this.closePanel(); UI.menuDialog({ name: s.nick || s.name, portrait: null, text: `Giao việc cho ${s.nick || s.name}. Cứ ${JOB_TIME}s mang về một mẻ, ${SM().unit} càng mạnh càng nhiều.`, options: Object.entries(SH_JOBS).map(([k, J]) => ({ text: J.name, act: () => G.setJob(s, k) })).concat([{ text: 'Thôi', act: () => {} }]) }); });
    on('data-se', s => { this.exploreSid = s.id; this.closePanel(); G.state = 'playing'; this.openPanel('map'); G.toast(`Chạm vào một chỗ trên bản đồ để gửi ${s.nick || s.name} tới khám phá.`, 'info'); });
    on('data-sx', (s, b) => { if (b.dataset.sure) { G.recallShadow(s); v.shadows.splice(v.shadows.indexOf(s), 1); this.buildInv(); } else { b.dataset.sure = 1; b.textContent = 'Chắc chắn?'; } });
  };

  // ---------- map: explorers + "send to explore here" ----------
  const toWorld = (cx, cy) => {
    const c = $('bigmap'), N = UI.mapZoom, S = c.width / (N * SB), NH = c.height / S / SB;
    const x0 = UI.mapC.x - N * SB / 2, y0 = UI.mapC.y - NH * SB / 2;
    return { x: (cx / S + x0) * TILE, y: (cy / S + y0) * TILE };
  };
  const dbm = UI.drawBigMap;
  UI.drawBigMap = function () {
    dbm.call(this);
    if (World.mode !== 'over' || !this.mapC || !G.v10) return;
    const c = $('bigmap'), g = c.getContext('2d'), K = this.mapK || 1;
    const N = this.mapZoom, S = c.width / (N * SB), NH = c.height / S / SB;
    const x0 = this.mapC.x - N * SB / 2, y0 = this.mapC.y - NH * SB / 2;
    const toM = (wx, wy) => [((wx / TILE) - x0) * S, ((wy / TILE) - y0) * S];
    for (const s of G.v10.shadows) if (s.exp) {
      const [mx, my] = toM(s.exp.x, s.exp.y);
      if (!s.exp.done) { const [tx, ty] = toM(s.exp.tx, s.exp.ty); g.setLineDash([6 * K, 6 * K]); g.strokeStyle = SM().col; g.lineWidth = 2 * K; g.beginPath(); g.moveTo(mx, my); g.lineTo(tx, ty); g.stroke(); g.setLineDash([]); }
      this.mapIcon(g, mx, my, SM().icon, SM().col, 20);
      this.mapHits.push({ x: mx, y: my, tp: { x: s.exp.x, y: s.exp.y, name: `${s.name} — hoán đổi`, kind: 'shadow', sid: s.id } });
    }
    if (this.mapPick) { const [mx, my] = toM(this.mapPick.x, this.mapPick.y); g.strokeStyle = SM().col; g.lineWidth = 2 * K; g.beginPath(); g.arc(mx, my, 12 * K, 0, TAU); g.moveTo(mx - 18 * K, my); g.lineTo(mx + 18 * K, my); g.moveTo(mx, my - 18 * K); g.lineTo(mx, my + 18 * K); g.stroke(); }
    const b = $('mapExplore');
    if (b) { b.hidden = !this.mapPick || World.mode !== 'over'; if (this.mapPick) b.textContent = `${SM().icon} Gửi ${SM().unit} khám phá tới đây`; }
  };
  const pickExplorer = () => {
    const v = G.v10;
    if (UI.exploreSid) { const s = G.shById(UI.exploreSid); UI.exploreSid = null; if (s) return s; }
    const free = v.shadows.filter(s => !s.job && !s.exp && !(s.cd > G.time));
    return free.find(s => !G.shadowAlly(s) && s.tier === 'normal') || free.find(s => !G.shadowAlly(s)) || free[0] || null;
  };
  addEventListener('load', () => {
    const c = $('bigmap');
    c.parentElement.insertAdjacentHTML('beforeend', '<button id="mapExplore" hidden></button>');
    $('mapExplore').onclick = () => {
      const s = pickExplorer();
      if (!s) { G.toast(`Không có ${SM().unit} nào rảnh để đi khám phá.`, 'warn'); return; }
      const p = UI.mapPick; UI.mapPick = null;
      if (G.exploreTo(s, p.x, p.y)) UI.drawBigMap();
    };
    let d0 = null;
    c.addEventListener('pointerdown', e => { d0 = { x: e.clientX, y: e.clientY, n: e.isPrimary }; });
    c.addEventListener('pointerup', e => {
      if (!d0 || Math.hypot(e.clientX - d0.x, e.clientY - d0.y) > 8 || !UI.mapC || World.mode !== 'over') return;
      const r = c.getBoundingClientRect(), cx = (e.clientX - r.left) * c.width / r.width, cy = (e.clientY - r.top) * c.height / r.height;
      setTimeout(() => { UI.mapPick = UI.mapSel ? null : toWorld(cx, cy); UI.drawBigMap(); if (UI.exploreSid && UI.mapPick) $('mapExplore').click(); }, 0);
    });
  });
  // the summon button: tap = call everyone, hold = swap places
  UI.v11Hud = function () {
    const old = $('tShadow'); if (!old || old.dataset.v11) return;
    const b = old.cloneNode(true); old.replaceWith(b); b.dataset.v11 = 1;
    let t = null, held = false;
    const opt = { passive: false };
    b.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); b.classList.add('down'); held = false; t = setTimeout(() => { held = true; if (G.state === 'playing') G.swapQuick(); }, 450); }, opt);
    b.addEventListener('touchend', e => { e.preventDefault(); b.classList.remove('down'); clearTimeout(t); if (!held && G.state === 'playing') G.summonAll(); }, opt);
    b.addEventListener('click', () => { if (G.state === 'playing') G.summonAll(); });
    const lab = $('mmlabel'); if (lab) lab.textContent = lab.textContent.replace(/ • \[X\] Gọi bóng/, '') + (/\[K\]/.test(lab.textContent) ? '' : ' • [K] Gọi quân • [J] Hoán đổi');
  };
  const vh = UI.v10Hud;
  UI.v10Hud = function () {
    vh.call(this); this.v11Hud();
    const b = $('tShadow'); b.hidden = false;
    b.innerHTML = `<span>${{ md: 'XÁC', tt: 'QUỶ', sl: 'BÓNG' }[rk(RL.id)]}</span>`;
    const tab = document.querySelector('#inv [data-tab="shadows"]'); if (tab) tab.textContent = SM().army;
  };
  // the travel list also offers far explorers (swap)
  const op = UI.openPanel;
  UI.openPanel = function (id) { if (id === 'map') this.mapPick = null; return op.call(this, id); };
})();
