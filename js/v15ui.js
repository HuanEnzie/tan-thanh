// ===== v15 UI: character creation (look, class, dice destiny) + recoloured sprites =====
(function () {
  const H = s => esc(String(s));
  const cIcon = (k, r) => { const n = `cls_${rk(r || RL.id)}_${k}`; return IMG[n] ? IMG[n].src : `assets/img/${n}.png`; };
  // ---------- hue-rotated copies of world sprites ----------
  G.tintSprite = function (base, hue, sat = 1, lum = 1) {
    if (!base || !IMG[base]) return base;
    const key = `${base}~${hue | 0}_${Math.round(sat * 10)}_${Math.round(lum * 10)}`;
    if (IMG[key]) return key;
    const a = hue * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    const m = [0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
      0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.140, 0.072 - c * 0.072 - s * 0.283,
      0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072];
    const one = n => {
      const src = IMG[n]; if (!src) return null;
      const cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height;
      const x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(src, 0, 0);
      const im = x.getImageData(0, 0, cv.width, cv.height), d = im.data;
      for (let i = 0; i < d.length; i += 4) {
        if (!d[i + 3]) continue;
        let r = d[i], g = d[i + 1], b = d[i + 2];
        let R2 = m[0] * r + m[1] * g + m[2] * b, G2 = m[3] * r + m[4] * g + m[5] * b, B2 = m[6] * r + m[7] * g + m[8] * b;
        const l = 0.3 * R2 + 0.59 * G2 + 0.11 * B2;
        R2 = (l + (R2 - l) * sat) * lum; G2 = (l + (G2 - l) * sat) * lum; B2 = (l + (B2 - l) * sat) * lum;
        d[i] = Math.max(0, Math.min(255, R2)); d[i + 1] = Math.max(0, Math.min(255, G2)); d[i + 2] = Math.max(0, Math.min(255, B2));
      }
      x.putImageData(im, 0, 0);
      return cv;
    };
    IMG[key] = one(base);
    for (let i = 0; i < 4; i++) { const f = one(`${base}_w${i}`); if (f) IMG[`${key}_w${i}`] = f; }
    return key;
  };

  // ---------- creation state ----------
  const S = { realm: 'md', step: 0, name: '', g: 'm', look: null, cls: 'warrior', d: null, locks: {}, rerolls: 8 };
  UI.createState = S;
  const STEPS = ['① Diện mạo', '② Chức nghiệp', '③ Thiên mệnh'];

  function buildShell() {
    if ($('create')) return;
    document.body.insertAdjacentHTML('beforeend', `<div id="create" class="screen hidden"><div class="cr-wrap">
      <div class="cr-head"><h2 id="crTitle"></h2><div class="cr-steps" id="crSteps"></div></div>
      <div class="cr-body"><aside class="cr-card"><div id="crPort"></div><b id="crName"></b><div id="crSum"></div></aside><section id="crMain"></section></div>
      <div class="cr-foot"><button id="crBack">◀ QUAY LẠI</button><span id="crHint" class="muted"></span><button id="crNext">TIẾP ▶</button></div>
    </div></div>`);
    $('crBack').onclick = () => { if (S.step > 0) { S.step--; render(); } else { R3_OVERRIDE = null; G._crRealm = null; UI.showScreen('worlds'); } };
    $('crNext').onclick = () => { if (S.step < 2) { S.step++; if (S.step === 2 && !S.d) rollDestiny(true); render(); } else UI.startWorld(); };
    for (const b of document.querySelectorAll('#create button')) UI.bindBtn && UI.bindBtn(b);
  }

  UI.pickWorld = function (r) {
    buildShell();
    S.realm = rk(r); S.rid = r; R3_OVERRIDE = S.realm; G._crRealm = r; S.step = 0; S.rerolls = 8; S.locks = {}; S.d = null;
    this.pickedRealm = r;
    S.g = this.pickedGender || 'm'; S.cls = this.pickedClass || 'warrior';
    S.look = Face.random(S.g, S.realm);
    const names = (HERO_NAMES[r] || HERO_NAMES.md)[S.g]; S.name = R.pick(names);
    render();
    this.showScreen('create');
    Sound.play('sfx_gong', 0.5);
  };

  function setGender(g) {
    if (S.g === g) return; S.g = g; S.look.g = g;
    const names = (HERO_NAMES[S.rid] || HERO_NAMES.md)[g]; const all = Object.values(HERO_NAMES).flatMap(o => o.m.concat(o.f));
    if (all.includes(S.name)) S.name = R.pick(names);
    S.look = Face.random(g, S.realm); UI.pickedGender = g;
  }
  function rollDestiny(all) {
    const keep = {};
    if (!all) {
      if (S.locks.apt && S.d) { keep.apt = S.d.apt; keep.stats = S.d.stats; }
      if (S.locks.origin && S.d) keep.origin = S.d.origin;
    }
    const old = S.d, nd = G.destinyRoll(S.cls, keep);
    if (old && !all) {
      const keepList = (list, locks, key) => { const kept = list.filter((t, i) => locks[key + i]); return kept; };
      const kt = keepList(old.talents, S.locks, 't'), kf = keepList(old.flaws, S.locks, 'f');
      if (kt.length) { const out = kt.slice(); const want = kt.length === old.talents.length ? kt.length : Math.max(kt.length, nd.talents.length); for (const t of nd.talents) if (out.length < want && !out.some(o => o.key === t.key)) out.push(t); nd.talents = out; }
      if (kf.length) { const out = kf.slice(); const want = kf.length === old.flaws.length ? kf.length : Math.max(kf.length, nd.flaws.length); for (const t of nd.flaws) if (out.length < want && !out.some(o => o.key === t.key)) out.push(t); nd.flaws = out; }
      // locks follow the kept entries to their new slots
      const L = {}; if (S.locks.apt) L.apt = 1; if (S.locks.origin) L.origin = 1; nd.talents.forEach((t, i) => { if (kt.includes(t)) L['t' + i] = 1; }); nd.flaws.forEach((t, i) => { if (kf.includes(t)) L['f' + i] = 1; }); S.locks = L;
      nd.bonus = nd.flaws.length * 2;
    } else S.locks = {};
    S.d = nd;
  }

  function sumHtml() {
    const d = S.d;
    let h = `<small>${H(clsName(S.cls, S.realm))} • ${S.g === 'm' ? 'Nam' : 'Nữ'}</small>`;
    if (d) h += `<div class="cr-chips">${gradeTag(d.apt)}${d.talents.map(t => `<span class="chip t" style="--gc:${GRADE[t.g].col}">${H(talentText('t', t.key, t.v).name)}</span>`).join('')}${d.flaws.map(t => `<span class="chip f">${H(talentText('f', t.key, t.v).name)}</span>`).join('')}</div>`;
    return h;
  }

  function render() {
    buildShell();
    $('crTitle').textContent = 'TẠO NHÂN VẬT — ' + LORE[S.rid].name;
    $('crSteps').innerHTML = STEPS.map((t, i) => `<button class="${i === S.step ? 'on' : ''} ${i < S.step ? 'done' : ''}" data-st="${i}">${t}</button>`).join('');
    $('crSteps').querySelectorAll('button').forEach(b => { UI.bindBtn && UI.bindBtn(b); b.onclick = () => { const n = +b.dataset.st; if (n === 2 && !S.d) rollDestiny(true); S.step = n; render(); }; });
    $('crPort').innerHTML = Face.html(S.look, S.realm, 'big');
    $('crName').textContent = S.name || '—';
    $('crSum').innerHTML = sumHtml();
    $('crBack').textContent = S.step === 0 ? '◀ ĐỔI THẾ GIỚI' : '◀ QUAY LẠI';
    $('crNext').textContent = S.step === 2 ? '▶ BẮT ĐẦU HÀNH TRÌNH' : 'TIẾP ▶';
    $('crHint').textContent = ['Chọn tên và tạo khuôn mặt riêng cho bạn.', 'Mỗi chức nghiệp có kỹ năng, vũ khí và cách cộng chỉ số riêng.', `Gieo xúc xắc để định đoạt căn cơ — còn ${S.rerolls} lần gieo. Bấm 🔒 để giữ lại thứ bạn ưng ý.`][S.step];
    const m = $('crMain');
    if (S.step === 0) stepLook(m); else if (S.step === 1) stepClass(m); else stepDestiny(m);
    for (const b of document.querySelectorAll('#create button')) UI.bindBtn && UI.bindBtn(b);
  }

  function stepLook(m) {
    const L = S.look;
    let h = `<div class="cr-row"><label for="crIn">Tên</label><input id="crIn" maxlength="20" value="${H(S.name)}" autocomplete="off"><button id="crDiceName" title="Tên ngẫu nhiên">🎲</button>
      <div class="gender"><button data-g="m" class="${S.g === 'm' ? 'on' : ''}">♂ NAM</button><button data-g="f" class="${S.g === 'f' ? 'on' : ''}">♀ NỮ</button></div><button id="crDiceLook" class="wide">🎲 NGẪU NHIÊN</button></div>
      <p class="muted">Chọn một gương mặt (cuộn để xem hết ${Face.N} gương mặt). Bấm "⇋" để lật ảnh.</p><div class="cr-gal">`;
    for (let i = 0; i < Face.N; i++) h += `<button class="gal ${L.i === i ? 'on' : ''}" data-i="${i}">${Face.html({ g: S.g, i, m: 0 }, S.realm)}</button>`;
    m.innerHTML = h + '</div><div class="cr-row"><button id="crFlip">⇋ LẬT ẢNH</button></div>';
    $('crIn').oninput = e => { S.name = e.target.value; $('crName').textContent = S.name || '—'; };
    $('crIn').addEventListener('keydown', e => e.stopPropagation());
    $('crDiceName').onclick = () => { S.name = R.pick((HERO_NAMES[S.rid] || HERO_NAMES.md)[S.g]); render(); };
    $('crDiceLook').onclick = () => { S.look = Face.random(S.g, S.realm); render(); };
    $('crFlip').onclick = () => { S.look.m = S.look.m ? 0 : 1; render(); };
    m.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { setGender(b.dataset.g); render(); });
    m.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { S.look = { g: S.g, i: +b.dataset.i, m: S.look.m }; $('crPort').innerHTML = Face.html(S.look, S.realm, 'big'); m.querySelectorAll('.gal').forEach(x => x.classList.toggle('on', x === b)); });
  }

  function stepClass(m) {
    let h = '<div class="cr-classes">';
    for (const k of CLASS_KEYS) {
      const I = CLASS_INFO[k], on = k === S.cls;
      h += `<div class="cr-cls ${on ? 'on' : ''}" data-cl="${k}" style="--cc:${I.col}"><img src="assets/img/${S.realm}_cls_${k}_${S.g}.png" alt=""><div><b style="color:${I.col}">${H(clsName(k, S.realm))}</b><p>${H(I.pass)}.</p><p class="d"><u>Lướt:</u> ${H(I.dash)}.</p><p class="d"><u>Cộng chỉ số:</u> ${I.build.map(k => ATTR_NAME[S.realm][k]).join(' + ')} • <u>Hợp:</u> ${H(I.gear)}.</p></div></div>`;
    }
    m.innerHTML = h + '</div>';
    m.querySelectorAll('[data-cl]').forEach(b => b.onclick = () => { if (S.cls !== b.dataset.cl) { S.cls = b.dataset.cl; UI.pickedClass = S.cls; S.d = null; Sound.play('sfx_click', 0.35); render(); } });
  }

  function statBars(d) {
    const mx = Math.max(6, ...Object.values(d.stats));
    return ATTR_KEYS.map(k => `<div class="sb"><span>${H(ATTR_NAME[S.realm][k])}</span><i style="width:${Math.round(d.stats[k] / mx * 100)}%"></i><b>${d.stats[k]}</b></div>`).join('');
  }
  function stepDestiny(m) {
    if (!S.d) rollDestiny(true);
    const d = S.d, lock = (k, on) => `<button class="lk ${on ? 'on' : ''}" data-lk="${k}" aria-label="Khóa">${on ? '🔒' : '🔓'}</button>`;
    let h = `<div class="cr-dice"><button id="crRoll" ${S.rerolls ? '' : 'disabled'}>🎲 GIEO XÚC XẮC <small>(còn ${S.rerolls})</small></button><span class="muted">Mỗi lần gieo đổi mọi thứ chưa khóa. Khuyết điểm không phải lúc nào cũng tệ: mỗi cái đền thêm 2 điểm tiềm năng.</span></div><div class="cr-res">`;
    h += `<div class="dc apt" style="--gc:${GRADE[d.apt].col}">${lock('apt', S.locks.apt)}<h4>${gradeTag(d.apt)} ${H(aptName(d.apt))}</h4><div class="sbs">${statBars(d)}</div><small>${APT_PTS[d.apt]} điểm chia cho 4 chỉ số, nghiêng về ${H(clsName(S.cls, S.realm))}.${d.bonus ? ` +${d.bonus} điểm tự do (đền khuyết điểm).` : ''}</small></div>`;
    d.talents.forEach((t, i) => { const X = talentText('t', t.key, t.v); h += `<div class="dc tal" style="--gc:${GRADE[t.g].col}">${lock('t' + i, S.locks['t' + i])}<h4>${gradeTag(t.g)} ${H(X.name)}</h4><p class="fx">${H(TALENT_FX[t.key].txt(GRADE[t.g].mult))}</p><p class="st">${H(X.story)}</p></div>`; });
    if (!d.flaws.length) h += '<div class="dc fla none"><h4>Không có khuyết điểm</h4><p class="st">Số phận hôm nay hào phóng — bạn khởi đầu không mang gánh nặng nào.</p></div>';
    d.flaws.forEach((t, i) => { const X = talentText('f', t.key, t.v), g = Math.min(4, t.g); h += `<div class="dc fla" style="--gc:#d8685a">${lock('f' + i, S.locks['f' + i])}<h4><span class="gtag" style="color:#ff9a8a;border-color:#ff9a8a">${FLAW_SEV[g]}</span> ${H(X.name)}</h4><p class="fx">${H(FLAW_FX[t.key].txt(GRADE[g].mult))}</p><p class="st">${H(X.story)}</p></div>`; });
    h += `<div class="dc org">${lock('origin', S.locks.origin)}<h4>Thân thế</h4><p class="st">${H(G.destinyOrigin(d))}</p></div></div>`;
    m.innerHTML = h;
    $('crRoll').onclick = () => { if (!S.rerolls) return; S.rerolls--; Sound.play('sfx_coin', 0.5, 1.4); rollDestiny(false); render(); };
    m.querySelectorAll('[data-lk]').forEach(b => b.onclick = () => { S.locks[b.dataset.lk] = !S.locks[b.dataset.lk]; render(); });
  }

  UI.startWorld = function () {
    const r = this.pickedRealm, name = (S.name || '').trim().slice(0, 20) || R.pick(LORE[r].heroNames);
    if (!S.d) rollDestiny(true);
    if (Touch.on) Touch.fullscreen(true);
    try { localStorage.removeItem('tt_save_v2'); } catch (e) {}
    this.pickedClass = S.cls; this.pickedGender = S.g;
    const d = Object.assign({}, S.d, { look: Object.assign({}, S.look), cls: S.cls });
    this.loadRealm(r, () => { R3_OVERRIDE = null; G._crRealm = null; this.pickedDestiny = d; G.newGame(r, null, name, S.g); G.start(true); });
  };
  UI.refreshPick = function () {}; // the old world-pick panel is gone
})();
