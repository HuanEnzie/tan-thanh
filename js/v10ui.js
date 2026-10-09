// ===== v10 UI: mana bar, Pháp / Bóng buttons, Nhân vật / Đồng đội / Bóng tối tabs, roomier map with a travel list =====
(function () {
  const H = s => esc(String(s));

  // ---------- HUD: mana row + touch buttons ----------
  UI.v10Hud = function () {
    if (!$('mpRow')) {
      $('stamRow').insertAdjacentHTML('afterend', '<div class="brow" id="mpRow"><img id="mpIc" alt=""><div class="bar"><div id="mpFill" class="fill mp"></div><span id="mpTxt"></span></div></div>');
      document.body.insertAdjacentHTML('beforeend', '<button id="tCast"><img class="tic" id="tCastIc" alt=""><span>PHÁP</span><i id="tCastCost"></i></button><button id="tShadow"><span>BÓNG</span></button>');
      const opt = { passive: false };
      const bind = (id, fn) => {
        const b = $(id);
        b.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); b.classList.add('down'); fn(); }, opt);
        b.addEventListener('touchend', e => { e.preventDefault(); b.classList.remove('down'); }, opt);
        b.addEventListener('click', fn);
      };
      bind('tCast', () => { if (G.state === 'playing') { if (Touch.on) Touch.aimNearest(420); G.castMana(); } });
      bind('tShadow', () => { if (G.state === 'playing') G.summonAll(); });
      const lab = $('mmlabel'); if (lab && !/\[V\]/.test(lab.textContent)) lab.textContent += ' • [V] Pháp thuật' + (isArise() ? ' • [X] Gọi bóng' : '');
    }
    const ic = IMG['orb_' + rk(RL.id)] || IMG.relic_8; if (ic) $('mpIc').src = ic.src;
    $('tShadow').hidden = !isArise();
  };
  const uu = UI.update;
  UI.update = function (dt) {
    uu.call(this, dt);
    const P = G.player, v = G.v10;
    if (!P || !v || !$('mpRow') || !['playing', 'paused', 'menu', 'levelup', 'dialog'].includes(G.state)) return;
    const mm = G.maxMana(), m = Math.floor(v.mana || 0);
    const W = this._w10 || (this._w10 = {});
    const set = (k, val, fn) => { if (W[k] !== val) { W[k] = val; fn(val); } };
    set('mpw', (Math.round(m / mm * 200) / 2) + '%', x => { $('mpFill').style.width = x; });
    set('mpt', `${m}/${mm}`, x => { $('mpTxt').textContent = x; });
    const e = G.v6 && G.v6.skEq, has = e != null && e >= 0 && G.v6.skills[e];
    const cost = has ? G.skillCost(e) : 0, ready = has && v.mana >= cost && G.manaCd <= G.time;
    set('cic', has ? 'sk_' + e : '', n => { const im = $('tCastIc'); im.hidden = !n; if (n && IMG[n]) im.src = IMG[n].src; });
    set('cc', has ? String(cost) : '', x => { $('tCastCost').textContent = x; });
    set('crd', ready ? 1 : 0, x => $('tCast').classList.toggle('ready', !!x));
  };

  // ---------- inventory tabs ----------
  const bi = UI.buildInv;
  UI.buildInv = function () {
    const tabs = document.querySelector('#inv .tabs');
    const sh = tabs && tabs.querySelector('[data-tab="shadows"]');
    if (sh) sh.hidden = !isArise();
    if (this.invTab === 'shadows' && !isArise()) this.invTab = 'party';
    if (this.invTab === 'party' || this.invTab === 'shadows') {
      document.querySelectorAll('.tabs [data-tab]').forEach(t => t.classList.toggle('on', t.dataset.tab === this.invTab));
      return this.invTab === 'party' ? this.buildParty() : this.buildShadows();
    }
    bi.call(this);
    if (this.invTab === 'stats') this.buildAttr();
  };
  UI.buildAttr = function () {
    const P = G.player, v = G.v10, box = $('invBody');
    const wd = Math.round(G.attr('str') * 3), sd = Math.round(G.attr('int') * 3);
    let h = `<div class="attr10"><h3>Chỉ số tiềm năng <span class="pts ${v.pts ? 'has' : ''}">còn ${v.pts} điểm</span></h3><div class="arows">`;
    const desc = { str: '+3% sát thương vũ khí', vit: '+12 máu tối đa', agi: '+1% tốc chạy, +2 thể lực tối đa', int: `+6 ${manaName()} tối đa, +3% sát thương kỹ năng${isArise() ? ', +0.3% thu phục' : ''}` };
    for (const k of ATTR_KEYS) h += `<div class="arow"><b>${H(attrName(k))}</b><span class="av">${G.attr(k)}</span><small>${H(desc[k])}</small><button data-at="${k}" data-n="1" ${v.pts ? '' : 'disabled'}>+1</button><button data-at="${k}" data-n="5" ${v.pts >= 5 ? '' : 'disabled'}>+5</button></div>`;
    h += `</div><div class="derived"><span>❤ Máu <b>${Math.round(P.maxHp)}</b></span><span>✦ ${H(manaName())} <b>${Math.floor(v.mana)}/${G.maxMana()}</b></span><span>⚔ Vũ khí <b>+${wd}%</b></span><span>✺ Kỹ năng <b>+${sd}%</b></span><span>➶ Tốc chạy <b>×${P.speedMul().toFixed(2)}</b></span><span>⛨ Giáp <b>${P.armorVal}</b></span><span>⚡ Thể lực <b>${Math.round(P.maxStam)}</b></span></div>`;
    h += `<p class="muted">Mỗi lần lên cấp nhận ${PTS_PER_LVL} điểm. ${H(manaName())} hồi theo thời gian (nhanh gấp đôi ở căn cứ), dùng cho kỹ năng Tế Đàn [V]${isArise() ? ', lưu bóng và gọi binh đoàn [X]' : ''}.</p></div>`;
    box.insertAdjacentHTML('afterbegin', h);
    box.querySelectorAll('[data-at]').forEach(b => { this.bindBtn(b); b.onclick = () => { G.addAttr(b.dataset.at, +b.dataset.n); this.buildInv(); }; });
  };
  UI.buildParty = function () {
    const P = G.player, v = G.v10, box = $('invBody');
    let h = `<h3>Đồng đội <small>đang đi theo ${G.followCount()}/${G.maxFollow()} • cấp 10, 20, 30 mở thêm chỗ</small></h3><div class="party10">`;
    const card = (img, port, name, sub, stats, status, btns, cls) => `<div class="pc10 ${cls || ''}">${String(img).startsWith('<') ? img : `<img class="${port ? 'port' : 'spr'}" src="${img}" alt="">`}<div class="pci"><b>${name}</b><small>${sub}</small><div class="pst">${stats}</div><div class="pstat">${status}</div><div class="pbtn">${btns}</div></div></div>`;
    G.companions.forEach((c, i) => {
      if (!c.joined) return;
      const on = !!v.follow[i], hp = Math.round(140 + P.level * 12), atk = Math.round(16 + P.level * 2.2);
      const status = c.ally && c.ally.downed ? '🩸 Gục ngã — đến gần nhấn [E] để cứu' : on ? '➤ Đang đi theo' : '⌂ Ở căn cứ';
      h += card(`assets/img/${c.data.portrait}.jpg`, true, H(c.data.name) + ' <i class="heart">♥</i>', (typeof G.compClass === 'function' ? H(clsName(G.compClass(c))) + ' • ' : '') + H(c.data.role) + ` • thân mật ${Math.round(c.aff)}`, `<span>Cấp ${P.level}</span><span>Máu ${hp}</span><span>Công ${atk}</span>`, status,
        `<button data-cf="${i}" data-on="${on ? 0 : 1}">${on ? '⌂ Về căn cứ' : '➤ Đi theo'}</button>`, on ? 'on' : '');
    });
    for (const r of v.recruits) {
      const st = G.rcStats(r), hurt = r.hurtUntil > G.time, on = r.follow;
      const im = IMG[RL.npc[r.sprite]] || IMG[RL.npc[0]];
      const status = hurt ? `🩸 Dưỡng thương ${Math.ceil((r.hurtUntil - G.time) / 60)} phút` : on ? '➤ Đang đi theo' : '⌂ Ở căn cứ';
      const cn = r.cast ? G.castBy(r.cast) : null;
      h += card(r.look ? Face.html(r.look, RL.id, 'pface') : im ? im.src : '', !!r.look, `${H(r.name)} <i class="star">${'★'.repeat(r.star)}</i>${cn ? ` <i class="rel" style="color:${REL[cn.rel].col}">${REL[cn.rel].icon}</i>` : ''}`, `${H(G.rcClass(r))}${cn ? ' • ' + H(relName(cn.rel)) + ' • ' + H(traitOf(cn.trait).name) : ''} • kinh nghiệm ${Math.floor(r.xp)}/${40 + r.lvl * 30}`,
        `<span>Cấp ${r.lvl}</span><span>Máu ${st.hp}</span><span>Công ${st.atk}</span><span>Thủ ${st.def}</span><span>Tốc ${st.spd}</span>`, status,
        `<button data-rf="${r.id}" data-on="${on ? 0 : 1}">${on ? '⌂ Về căn cứ' : '➤ Đi theo'}</button>${cn ? `<button class="ghost" data-rn="${cn.id}">Hồ sơ</button>` : ''}<button class="ghost" data-rx="${r.id}">${cn ? 'Cho về' : 'Giải tán'}</button>`, on ? 'on' : '');
    }
    if (!v.recruits.length && !G.companions.some(c => c.joined)) h += '<p class="muted">Chưa có đồng đội.</p>';
    h += '</div><p class="muted">Chiêu mộ thêm người ở <b>khu trú ẩn ⛺</b> (danh sách đổi mỗi 3 ngày) hoặc khi giải cứu dân thường. Người ở căn cứ an toàn tuyệt đối; người đi theo cùng chiến đấu, lên cấp theo trận. Trọng thương sẽ tự về căn cứ dưỡng thương.</p>';
    box.innerHTML = h;
    box.querySelectorAll('button').forEach(b => this.bindBtn(b));
    box.querySelectorAll('[data-cf]').forEach(b => b.onclick = () => { G.setFollow('c', +b.dataset.cf, b.dataset.on === '1'); this.buildInv(); });
    box.querySelectorAll('[data-rf]').forEach(b => b.onclick = () => { G.setFollow('r', +b.dataset.rf, b.dataset.on === '1'); this.buildInv(); });
    box.querySelectorAll('[data-rn]').forEach(b => b.onclick = () => { const n = G.castBy(+b.dataset.rn); if (n) UI.openCast(n, true); });
    box.querySelectorAll('[data-rx]').forEach(b => b.onclick = () => {
      if (b.dataset.sure) { const i = v.recruits.findIndex(r => r.id === +b.dataset.rx); if (i >= 0) { const rr = v.recruits[i]; if (rr.cast) { const cn = G.castBy(rr.cast); if (cn) { G.castLeave(cn); this.buildInv(); return; } } const r = v.recruits.splice(i, 1)[0]; G.toast(`${r.name} đã rời đội.`, 'info'); G.partySync(true); } this.buildInv(); }
      else { b.dataset.sure = 1; b.textContent = 'Chắc chắn?'; }
    });
  };
  UI.buildShadows = function () {
    const v = G.v10, box = $('invBody'), cap = G.shadowCap();
    let h = `<h3>Binh đoàn bóng tối <small>${v.shadows.length}/${cap} • ${H(manaName())} ${Math.floor(v.mana)}/${G.maxMana()}</small></h3>`;
    h += `<div class="shbar"><button id="shAll">🌑 GỌI TẤT CẢ [X]</button><span class="muted">Hạ kẻ địch, đứng cạnh xác (có khói tím) và nhấn [E] để lưu bóng. Thất bại thì bóng chỉ trỗi dậy tạm thời. Mỗi boss / mini boss chỉ có một bóng; lính thường trùng thoải mái. Sức chứa tăng theo cấp.</span></div><div class="party10">`;
    const list = v.shadows.slice().sort((a, b) => SH_ORDER.indexOf(a.tier) - SH_ORDER.indexOf(b.tier));
    for (const s of list) {
      const T = SH_TIER[s.tier], st = G.shStats(s), act = G.shadowAlly(s), cd = s.cd > G.time;
      const im = IMG[s.img] ? G.shadowOf(s.img) : null;
      let src = ''; try { src = im ? im.toDataURL() : ''; } catch (e) {}
      const status = act ? `➤ Đang chiến đấu (${Math.round(act.hp)}/${Math.round(act.maxHp)})` : cd ? `⌛ Hồi phục ${Math.ceil(s.cd - G.time)}s` : '◌ Trong bóng tối';
      h += `<div class="pc10 sh ${act ? 'on' : ''}" style="--tc:${T.col}"><img class="spr" src="${src}" alt=""><div class="pci"><b>${H(s.name)}</b><small style="color:${T.col}">${T.name} • bóng cấp ${st.slv} • ${s.kills || 0} mạng</small><div class="pst"><span>Máu ${st.hp}</span><span>Công ${st.dmg}</span><span>Gọi: ${st.cost} ${H(manaName())}</span></div><div class="pstat">${status}</div><div class="pbtn">${act ? `<button data-sr="${s.id}">Thu hồi</button>` : `<button data-ss="${s.id}" ${cd ? 'disabled' : ''}>Triệu hồi</button>`}<button class="ghost" data-sx="${s.id}">Giải phóng</button></div></div></div>`;
    }
    if (!list.length) h += '<p class="muted">Chưa có bóng nào.</p>';
    box.innerHTML = h + '</div>';
    box.querySelectorAll('button').forEach(b => this.bindBtn(b));
    $('shAll').onclick = () => { G.summonAll(); this.buildInv(); };
    const find = id => v.shadows.find(s => s.id === +id);
    box.querySelectorAll('[data-ss]').forEach(b => b.onclick = () => { const r = G.summonShadow(find(b.dataset.ss)); if (r === 'mana') G.toast(`Không đủ ${manaName()}.`, 'warn'); this.buildInv(); });
    box.querySelectorAll('[data-sr]').forEach(b => b.onclick = () => { G.recallShadow(find(b.dataset.sr)); this.buildInv(); });
    box.querySelectorAll('[data-sx]').forEach(b => b.onclick = () => {
      if (b.dataset.sure) { const s = find(b.dataset.sx); G.recallShadow(s); v.shadows.splice(v.shadows.indexOf(s), 1); this.buildInv(); }
      else { b.dataset.sure = 1; b.textContent = 'Chắc chắn?'; }
    });
  };

  // ---------- world: extractable corpses glow purple ----------
  const dvw = drawV6World;
  drawV6World = function () {
    dvw();
    if (!isArise() || !G.v10) return;
    const vw = G.view;
    for (const c of G.corpses) {
      if (!c.tier || G.time - c.t > 120 || !vw || c.x < vw.x0 || c.x > vw.x1 || c.y < vw.y0 || c.y > vw.y1) continue;
      const k = 1 - (G.time - c.t) / 120, tc = SH_TIER[c.tier].col, big = c.tier === 'boss' || c.tier === 'mini', rich = c.tier !== 'normal';
      ctx.globalAlpha = (0.4 + Math.sin(G.time * 4 + c.x) * 0.15) * k;
      ctx.fillStyle = tc;
      ctx.beginPath(); ctx.ellipse(c.x, c.y, (big ? 30 : rich ? 22 : 16) * (c.scale || 1), (big ? 14 : rich ? 10 : 8) * (c.scale || 1), 0, 0, TAU); ctx.fill();
      ctx.globalAlpha *= 0.8; ctx.strokeStyle = tc; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(c.x, c.y, (big ? 36 : rich ? 27 : 20) * (c.scale || 1), (big ? 17 : rich ? 13 : 10) * (c.scale || 1), 0, 0, TAU); ctx.stroke();
      if (Math.random() < (rich ? 0.3 : 0.15)) Particles.add({ x: c.x + R.range(-10, 10), y: c.y, vx: R.range(-6, 6), vy: R.range(-50, -20), life: 0.9, max: 0.9, size: big ? 3 : 2, col: tc, drag: 1, glow: true });
      ctx.globalAlpha = 1;
    }
  };

  // ---------- map: gates + shelters as travel points, side list ----------
  const dbm = UI.drawBigMap;
  UI.drawBigMap = function () {
    dbm.call(this);
    if (World.mode !== 'over' || !this.mapC || !G.v10) return;
    const c = $('bigmap'), g = c.getContext('2d'), K = this.mapK || 1;
    const N = this.mapZoom, S = c.width / (N * SB), NH = c.height / S / SB;
    const x0 = this.mapC.x - N * SB / 2, y0 = this.mapC.y - NH * SB / 2;
    const toM = (wx, wy) => [((wx / TILE) - x0) * S, ((wy / TILE) - y0) * S];
    for (const t of G.tpAll()) {
      if (t.kind !== 'gate' && t.kind !== 'shelter') continue;
      const [mx, my] = toM(t.gx ?? t.x, t.gy ?? t.y - 90);
      if (t.kind === 'gate') { this.mapIcon(g, mx, my, '⛩', t.col, 20); g.font = `bold ${Math.round(11 * K)}px sans-serif`; g.textAlign = 'center'; g.fillStyle = '#000'; g.fillText(t.rank, mx + 11 * K, my + 13 * K); g.fillStyle = t.col; g.fillText(t.rank, mx + 10 * K, my + 12 * K); }
      this.mapHits.push({ x: mx, y: my, tp: t });
    }
    if (this.mapSel) { g.strokeStyle = '#fff'; g.lineWidth = 2 * K; g.beginPath(); g.arc(this.mapSel.mx, this.mapSel.my, 18 * K, 0, TAU); g.stroke(); }
    $('mapInfo').textContent = $('mapInfo').textContent.replace(/chạm .*$/, 'chạm ⛩ ⛺ ◆ ✦ ⌂ hoặc dùng danh sách bên phải để dịch chuyển');
  };
  UI.mapFilter = 'all';
  UI.buildMapList = function () {
    const box = $('mapList'); if (!box) return;
    const P = G.player;
    const F = { all: () => true, base: t => t.kind === 'base' || t.kind === 'statue' || t.kind === 'wp', gate: t => t.kind === 'gate', shelter: t => t.kind === 'shelter' };
    const list = G.tpAll().filter(F[this.mapFilter]).map(t => Object.assign({ d: dist(P.x, P.y, t.x, t.y) }, t)).sort((a, b) => a.d - b.d);
    this.mapList = list;
    document.querySelectorAll('#mapChips [data-mf]').forEach(b => b.classList.toggle('on', b.dataset.mf === this.mapFilter));
    let h = '';
    list.forEach((t, i) => { h += `<div class="mrow" data-mi="${i}"><span class="mic" style="color:${t.col}">${t.icon}</span><div class="mtx"><b>${H(t.name)}</b><small>${Math.round(t.d / TILE)}m</small></div><button data-go="${i}">✈</button></div>`; });
    if (!list.length) h = `<p class="muted">${World.mode !== 'over' ? 'Không dịch chuyển được trong hầm ngục.' : 'Chưa có điểm nào. Thức tỉnh ✦, kích hoạt ◆, khám phá Cổng ⛩ và khu trú ẩn ⛺ để mở.'}</p>`;
    box.innerHTML = h;
    box.querySelectorAll('[data-mi]').forEach(r => r.onclick = e => {
      if (e.target.dataset.go != null) return;
      const t = this.mapList[+r.dataset.mi];
      this.mapC = { x: t.x / TILE, y: (t.y - 80) / TILE }; this.drawBigMap();
      const c = $('bigmap'); this.mapSel = { tp: t, mx: c.width / 2, my: c.height / 2 }; this.drawBigMap();
    });
    box.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { const t = this.mapList[+b.dataset.go]; this.mapSel = null; G.teleport(t); });
  };
  const op = UI.openPanel;
  UI.openPanel = function (id) {
    const r = op.call(this, id);
    if (id === 'map') { this.buildMapList(); requestAnimationFrame(() => this.drawBigMap()); }
    return r;
  };
  // map wiring: filter chips, wheel + pinch zoom
  addEventListener('load', () => {
    const c = $('bigmap');
    document.querySelectorAll('#mapChips [data-mf]').forEach(b => b.onclick = () => { UI.mapFilter = b.dataset.mf; UI.buildMapList(); });
    c.addEventListener('wheel', e => { e.preventDefault(); UI.mapZoom = clamp(UI.mapZoom * (e.deltaY > 0 ? 1.2 : 1 / 1.2), 8, 60); UI.drawBigMap(); }, { passive: false });
    let pin = null;
    const pd = e => Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    c.addEventListener('touchstart', e => { if (e.touches.length === 2) { pin = { d: pd(e), z: UI.mapZoom }; e.stopImmediatePropagation(); e.preventDefault(); } }, { capture: true, passive: false });
    c.addEventListener('touchmove', e => { if (pin && e.touches.length === 2) { UI.mapZoom = clamp(pin.z * pin.d / pd(e), 8, 60); UI.drawBigMap(); e.stopImmediatePropagation(); e.preventDefault(); } }, { capture: true, passive: false });
    c.addEventListener('touchend', e => { if (pin) { if (e.touches.length < 2) pin = null; e.stopImmediatePropagation(); } }, { capture: true, passive: false });
  });
})();
