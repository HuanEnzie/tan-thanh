// ===== v16 UI: person panel (profile, talk, gifts, relationship actions), weaving screen =====
(function () {
  const H = s => esc(String(s));
  const ST_NAME = ['Người lạ', 'Quen biết', 'Thân thiết', 'Gắn bó', 'Tri kỷ'];
  let cur = null, mode = 'talk', say = '';

  function ensure() {
    if ($('npcp')) return;
    document.body.insertAdjacentHTML('beforeend', `<div id="npcp" class="screen hidden"><div class="panel wide npcp"><button class="close" aria-label="Đóng" onclick="UI.closeCast()">✕</button><div id="npBody"></div></div></div>
      <div id="weave" class="screen hidden"><div class="wv"><h2>DỆT CỐT TRUYỆN</h2><div class="wv-bar"><i id="wvFill"></i></div><div id="wvLog"></div><div id="wvCast"></div><button id="wvGo" hidden>▶ BƯỚC VÀO THẾ GIỚI</button></div></div>`);
  }
  UI.castOpen = false;
  UI.openCast = function (n, fromPanel) {
    ensure(); cur = n; mode = 'talk'; say = '';
    if (n.state === 'unmet') n.state = 'met';
    this.castOpen = true;
    if (G.state === 'playing') G.state = 'menu'; else if (G.state === 'menu') { /* opened from the inventory */ }
    this.castFromPanel = G.state === 'menu' && fromPanel;
    render(); this.showScreen('npcp');
    const l = G.castLine(n, 'greet'); if (l) { say = l; render(); }
  };
  UI.closeCast = function () {
    this.castOpen = false; cur = null;
    if (this.castFromPanel) { this.castFromPanel = false; G.state = 'menu'; this.showScreen('inv'); this.buildInv(); return; }
    if (G.state === 'menu') { G.state = 'playing'; this.showScreen(null); }
  };
  // Esc / ✕ in the shared popup handler
  const ct = UI.closeTop;
  UI.closeTop = function () { if (this.castOpen) { if (mode !== 'talk') { mode = 'talk'; render(); return true; } this.closeCast(); return true; } return ct.call(this); };

  const bioRows = n => {
    const rows = [['origin', 'Xuất thân', 0], ['look', 'Nét riêng', 0], ['wound', 'Biến cố', 20], ['motive', 'Điều thúc đẩy', 40], ['secret', 'Bí mật', 70]];
    return rows.map(([k, t, need]) => n.aff >= need && n.bio[k] ? `<div class="bio"><b>${t}</b><p>${H(n.bio[k])}</p></div>` : `<div class="bio lock"><b>${t}</b><p>🔒 Cần thân thiết hơn (${need}).</p></div>`).join('');
  };
  const linkRows = n => n.links.map(l => {
    const o = G.castBy(l.to); if (!o) return '';
    const known = o.state !== 'unmet';
    const typeName = { sibling: 'Anh chị em', ex: 'Người cũ', rival: 'Đối thủ', mentor: 'Thầy của', student: 'Học trò của', debt: 'Mang ơn', creditor: 'Được mang ơn', lover: 'Người yêu', enemy: 'Hận thù' }[l.type] || l.type;
    return `<div class="lnk">${known ? Face.html(o.look, rk(RL.id), 'mini') : '<div class="fp mini unk">?</div>'}<div><b>${known ? H(o.name) : '???'}</b> <small>${typeName}</small><p>${known && l.tpl ? H(cfill(l.tpl, null, { a: l.type === 'student' || l.type === 'creditor' ? o.name : n.name, b: l.type === 'student' || l.type === 'creditor' ? n.name : o.name })) : 'Bạn chưa biết gì về mối liên hệ này.'}</p></div></div>`;
  }).join('');

  function actions(n) {
    const v = G.v10, joined = v.recruits.some(r => r.cast === n.id), canJoin = n.stage >= (n.rel === 'mentor' ? 3 : 1);
    let b = `<button data-a="talk" class="${mode === 'talk' ? 'on' : ''}">💬 Trò chuyện</button><button data-a="gift" class="${mode === 'gift' ? 'on' : ''}">🎁 Tặng quà</button><button data-a="story" class="${mode === 'story' ? 'on' : ''}">📖 Hồ sơ</button>`;
    if (n.rel === 'sworn' && n.stage >= 3 && !n.flags.oath) b += '<button data-a="oath" class="hot">⚔ Làm lễ kết nghĩa</button>';
    if (n.rel === 'lover' && n.stage >= 4 && !n.flags.lover) b += '<button data-a="confess" class="hot">♥ Tỏ tình</button>';
    if (n.rel === 'rival' && n.stage >= 2 && !n.flags.bond && (n.nextDuel || 0) < G.time) b += '<button data-a="duel" class="hot">⚡ Thách đấu</button>';
    if (n.rel === 'mentor' && n.flags.gift === 2 && !n.flags.gift2) b += '<button data-a="teach" class="hot">✦ Xin chỉ dạy thêm</button>';
    b += joined ? '<button data-a="leave" class="ghost">🏠 Cho về căn cứ</button>' : `<button data-a="join" class="${canJoin ? '' : 'dis'}">🤝 Mời đi cùng${canJoin ? '' : ' (cần thân hơn)'}</button>`;
    return b;
  }
  function giftGrid(n) {
    const P = G.player, ids = Object.keys(P.inv).filter(k => P.inv[k] > 0 && !['quest', 'key'].includes((itm(k) || {}).kind) && k !== 'gold' && k !== 'ticket' && k !== 'orb' && k !== 'artifact' && k !== 'scroll');
    if (!ids.length) return '<p class="muted">Túi trống — chẳng có gì để tặng.</p>';
    return '<p class="muted">Chọn một món để tặng (mỗi người nhận tối đa 3 món mỗi ngày).</p><div class="ggrid">' + ids.map(id => { const it = itm(id); return `<div class="slot" data-gift="${id}"><img src="${IMG[it.icon].src}" alt=""><span class="cnt">${P.inv[id]}</span><div class="tip"><b>${H(it.name)}</b></div></div>`; }).join('') + '</div>';
  }

  function render() {
    const n = cur; if (!n) return;
    const T1 = traitOf(n.trait), T2 = traitOf(n.trait2), R0 = REL[n.rel], tal = G.castTalents ? G.castTalents(n) : [];
    const pct = n.aff;
    const marks = REL_STAGE_AT.map(t => `<s style="left:${t}%"></s>`).join('');
    let h = `<div class="np-top"><div class="np-face">${Face.html(n.look, rk(RL.id), 'big')}<span class="rb" style="background:${R0.col}">${R0.icon} ${H(relName(n.rel))}</span></div>`
      + `<div class="np-info"><h2>${H(n.name)} <small>${n.g === 'f' ? '♀' : '♂'} ${n.age} tuổi</small></h2><p class="sub">${H(clsName(n.cls))} • cấp ~${Math.max(1, G.player.level + n.lvlOff)} • ${gradeTag(Math.min(4, n.apt))}</p>`
      + `<div class="chips"><span class="chip" title="${H(T1.desc)}">${H(T1.name)}</span><span class="chip" title="${H(T2.desc)}">${H(T2.name)}</span>${(n.talents || []).map(t => `<span class="chip t" style="--gc:${GRADE[t.g].col}">${H(talentText('t', t.key, t.v).name)}</span>`).join('')}${(n.flaws || []).map(t => `<span class="chip f">${H(talentText('f', t.key, t.v).name)}</span>`).join('')}</div>`
      + `<div class="aff"><div class="bar"><i style="width:${pct}%;background:${R0.col}"></i>${marks}</div><span>${n.rel === 'enemy' && n.state === 'foe' ? 'Thù hận' : `${ST_NAME[Math.min(4, n.stage)]} • ${Math.round(n.aff)}/100`}</span></div></div></div>`;
    h += `<div class="np-say">${say ? `<q>${H(say)}</q>` : `<i class="muted">${H(G.castLine(n, 'chat') || '...')}</i>`}</div><div class="np-act">${actions(n)}</div><div class="np-sec" id="npSec">`;
    if (mode === 'gift') h += giftGrid(n);
    if (mode === 'story') h += `<h3>Hồ sơ</h3>${bioRows(n)}${tal.length ? '' : ''}<h3>Mối liên hệ</h3>${linkRows(n) || '<p class="muted">Chưa biết.</p>'}<p class="muted">Thích: ${n.aff >= 30 ? n.likes.map(id => H(itm(id).name)).join(', ') : '???'} • Ghét: ${n.aff >= 30 ? H(itm(n.dislike).name) : '???'}</p>`;
    $('npBody').innerHTML = h + '</div>';
    const box = $('npBody');
    box.querySelectorAll('button').forEach(b => { UI.bindBtn && UI.bindBtn(b); });
    box.querySelectorAll('[data-a]').forEach(b => b.onclick = () => act(b.dataset.a));
    box.querySelectorAll('[data-gift]').forEach(el => el.onclick = () => gift(el.dataset.gift));
  }

  function act(a) {
    const n = cur, v = G.v10, P = G.player;
    if (a === 'talk') { mode = 'talk'; talk(n); return; }
    if (a === 'gift') { mode = mode === 'gift' ? 'talk' : 'gift'; render(); return; }
    if (a === 'story') { mode = mode === 'story' ? 'talk' : 'story'; render(); return; }
    if (a === 'join') {
      if (n.stage < (n.rel === 'mentor' ? 3 : 1)) { say = 'Chúng ta chưa đủ thân để cùng lên đường... Hãy trò chuyện thêm đã.'; render(); return; }
      if (G.castJoin(n)) { say = G.relPool('join', n)[0] ? pickR(G.relPool('join', n)) : 'Được, tôi đi cùng bạn.'; render(); }
      return;
    }
    if (a === 'leave') { G.castLeave(n); say = G.relPool('leave', n)[0] ? pickR(G.relPool('leave', n)) : 'Tôi sẽ ở căn cứ chờ bạn.'; render(); return; }
    if (a === 'oath') {
      const ln = G.relPool('oath', n); n.flags.oath = 1; n.flags.bond = 1; v.pts += 3; P.perks.leader = (P.perks.leader || 0) + 0.5; P._pfx = null;
      say = (ln[0] ? pickR(ln) : `Từ nay, ${n.name} và bạn là anh em một nhà.`) + '  (+3 điểm tiềm năng, đồng đội mạnh hơn)'; n.aff = 100; n.stage = 4; Sound.play('sfx_gong', 0.6); FX.pillar(P.x, P.y, REL.sworn.col, 1.2, 40); G.toast(`⚔ Bạn và ${n.name} đã kết nghĩa!`, 'love'); render(); return;
    }
    if (a === 'confess') {
      const ok = Math.random() < 0.55 + n.aff / 400, ln = G.relPool('confess', n);
      if (ok) { n.flags.lover = 1; n.flags.bond = 1; v.pts += 3; P.perks.regen = (P.perks.regen || 0) + 0.5; P._pfx = null; say = (ln[0] ? pickR(ln) : 'Tôi cũng vậy...') + '  (+3 điểm tiềm năng, hồi máu nhanh hơn khi có người thương bên cạnh)'; n.aff = 100; Sound.play('sfx_heart', 0.8); FX.pillar(P.x, P.y, REL.lover.col, 1.4, 44); G.toast(`♥ ${n.name} đã nhận lời!`, 'love'); }
      else { say = 'Cho tôi thêm một chút thời gian... (lời tỏ tình chưa được đáp lại — thử lại sau khi trò chuyện thêm)'; n.aff = Math.max(70, n.aff - 8); n.stage = 3; }
      render(); return;
    }
    if (a === 'duel') {
      UI.closeCast(); setTimeout(() => G.castFoeAppear(n), 300); G.toast(`⚡ ${n.name} nhận lời thách đấu!`, 'warn'); return;
    }
    if (a === 'teach') { n.flags.gift2 = 1; G.castGiftTalent(n); UI.closeCast(); return; }
  }
  function talk(n) {
    if (n.talkDay !== G.day) { n.talkDay = G.day; n.talkN = 0; n.giftN = 0; }
    if ((n.talkCd || 0) > G.time) { say = G.castLine(n, 'chat') || '...'; render(); return; }
    n.talkCd = G.time + 20; n.talkN = (n.talkN || 0) + 1;
    let gain = n.talkN > 4 ? 0 : 2 + Math.floor(Math.random() * 3);
    // relation line from the story pack (stage-appropriate), trait chatter, or gossip about someone they know
    const u = Math.random(); let line = '';
    const rl = G.relLine(n, Math.min(3, n.stage));
    const known = n.links.filter(l => { const o = G.castBy(l.to); return o && o.state !== 'unmet' && l.tpl; });
    if (u < 0.4 && rl.length) line = pickR(rl);
    else if (u < 0.55 && known.length && n.aff >= 25) { const l = pickR(known), o = G.castBy(l.to); line = cfill(l.tpl, null, { a: n.name, b: o.name }); }
    else line = G.castLine(n, 'chat') || G.castLine(n, 'tease');
    say = line || '...';
    if (n.rel === 'rival') gain = Math.max(1, gain - 1);
    if (gain) G.castAff(n, gain);
    else say += '  (hôm nay đã nói chuyện nhiều rồi — hãy tặng quà hoặc đi chơi cùng.)';
    render();
  }
  function gift(id) {
    const n = cur, P = G.player; if (!G.has(id)) return;
    if (n.talkDay !== G.day) { n.talkDay = G.day; n.talkN = 0; n.giftN = 0; }
    if ((n.giftN || 0) >= 3) { say = 'Hôm nay bạn đã tặng nhiều rồi, đừng chiều tôi quá.'; render(); return; }
    G.take(id); n.giftN = (n.giftN || 0) + 1;
    let amt, kind;
    if (n.likes.includes(id)) { amt = 10; kind = 'like'; } else if (n.dislike === id) { amt = -3; kind = 'dislike'; } else { amt = 4; kind = null; }
    const pool = kind ? G.relPool('gift', n) : [];
    const gp = ((CONTENT15.relations || {})[R3()] || {}).gift || {};
    const rl = kind && gp[kind] && gp[kind].length ? cfill(pickR(gp[kind]), n) : '';
    say = (rl || G.castLine(n, kind || 'like') || (amt > 0 ? 'Cảm ơn bạn.' : 'Cái này... tôi không thích lắm.')) + `  (${amt > 0 ? '+' : ''}${amt})`;
    if (amt > 0) G.castAff(n, amt); else n.aff = Math.max(0, n.aff + amt);
    mode = 'talk'; render();
  }
  const pickR = a => a[Math.floor(Math.random() * a.length)];

  // ---------- weaving screen ----------
  UI.weave = function (done) {
    ensure(); this.showScreen('weave');
    const cast = G.castList(), counts = G.castCounts(), r = R3();
    const steps = [
      'Chọn ngày giờ sinh, nơi chôn nhau cắt rốn của nhân vật…',
      `Gieo ${cast.length} số phận vào thế giới…`,
      'Khâu những sợi duyên giữa người với người…',
      'Viết quá khứ cho từng người: nơi sinh, mất mát, bí mật…',
      'Chọn kẻ sẽ yêu bạn, kẻ sẽ hận bạn, kẻ sẽ gọi bạn là huynh đệ…',
      'Sắp lịch những lần chạm mặt định mệnh…',
    ];
    const log = $('wvLog'); log.innerHTML = ''; $('wvCast').innerHTML = ''; $('wvGo').hidden = true; $('wvFill').style.width = '0%';
    let i = 0;
    const tick = () => {
      if (i < steps.length) { log.insertAdjacentHTML('beforeend', `<p>✦ ${H(steps[i])}</p>`); $('wvFill').style.width = Math.round((i + 1) / (steps.length + 1) * 100) + '%'; i++; setTimeout(tick, 520); return; }
      $('wvFill').style.width = '100%';
      $('wvCast').innerHTML = `<div class="wv-faces">${cast.map(n => `<div class="wf">${Face.html(n.look, r, 'mini')}<span>?</span></div>`).join('')}</div>`
        + `<p class="wv-sum">${Object.keys(REL).filter(k => counts[k]).map(k => `<span style="color:${REL[k].col}">${REL[k].icon} ${counts[k]} ${H(relName(k, r))}</span>`).join(' • ')}</p><p class="muted">Họ đang chờ bạn đâu đó trong thế giới này. Ai là ai — bạn phải tự khám phá.</p>`;
      const go = $('wvGo'); go.hidden = false; UI.bindBtn && UI.bindBtn(go); go.onclick = () => { go.onclick = null; done(); };
    };
    setTimeout(tick, 300);
  };
  // new games weave first, then the intro starts
  UI.startWorld = function () {
    const S = UI.createState, r = this.pickedRealm, name = (S.name || '').trim().slice(0, 20) || R.pick(LORE[r].heroNames);
    if (!S.d) { const d = G.destinyRoll(S.cls); S.d = d; }
    if (Touch.on) Touch.fullscreen(true);
    try { localStorage.removeItem('tt_save_v2'); } catch (e) {}
    this.pickedClass = S.cls; this.pickedGender = S.g;
    const d = Object.assign({}, S.d, { look: Object.assign({}, S.look), cls: S.cls });
    this.loadRealm(r, () => {
      R3_OVERRIDE = null; G._crRealm = null; this.pickedDestiny = d; Face.preload(rk(r));
      G.newGame(r, null, name, S.g);
      UI.weave(() => G.start(true));
    });
  };
  // continuing a game: make sure the cast exists and the atlases are warm
  const ld = G.load;
  G.load = function (...a) {
    const r = ld.apply(this, a);
    if (r && this.v10) { Face.preload(rk(RL.id)); if (!this.v10.cast) this.castGenerate(this.seed || 12345); }
    return r;
  };
})();
