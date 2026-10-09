// ===== v15 sheet: one "Nhân vật" page (portrait, sprite, equipment, skills, stats, talents, origin) + fewer inventory tabs =====
(function () {
  const H = s => esc(String(s));
  // run a builder that writes into #invBody, but into a scratch element instead
  function into(fn) {
    const real = $('invBody'), tmp = document.createElement('div');
    real.id = 'invBodyX'; tmp.id = 'invBody'; document.body.appendChild(tmp); tmp.hidden = true;
    try { fn(); } finally { tmp.id = ''; tmp.remove(); real.id = 'invBody'; }
    return tmp;
  }
  const tabBuild = (inst, tab) => into(() => { const t = inst.invTab; inst.invTab = tab; try { prev.call(inst); } finally { inst.invTab = t; } });
  const prev = UI.buildInv;

  // ---------- hero look ----------
  G.heroLook = function () {
    const h = this.v10 && this.v10.hero;
    if (h && h.look) return h.look;
    // old saves: a stable portrait from the name
    let n = 0; for (const c of String(Story.names.hero)) n = (n * 31 + c.charCodeAt(0)) >>> 0;
    const look = { g: Story.gender === 'f' ? 'f' : 'm', i: n % Face.N, m: 0 };
    if (this.v10) { this.v10.hero = this.v10.hero || {}; this.v10.hero.look = look; }
    return look;
  };
  const heroSpriteUrl = () => {
    const P = G.player, n = P.wdef && P.wdef.sprite ? P.wdef.sprite : RL.hero[0];
    const im = IMG[n]; if (!im) return '';
    return im.src || (im.toDataURL ? im.toDataURL() : '');
  };
  const SLOT_NAMES = () => ({ melee: 'Cận chiến', r1: RL.weapons.r1.name, r2: RL.weapons.r2.name, r3: RL.weapons.r3.name });

  function sheet() {
    const P = G.player, v = G.v10, c = v.cls, I = c ? CLASS_INFO[c] : null, look = G.heroLook();
    const need = G.xpNeed(P.level), grade = v.hero ? v.hero.apt : null;
    let h = `<div class="sh15"><div class="sh-top"><div class="sh-port">${Face.html(look, RL.id, 'big')}<div class="sh-spr"><img src="${heroSpriteUrl()}" alt=""></div></div>`
      + `<div class="sh-info"><h2>${H(Story.names.hero)} <small>${Story.gender === 'f' ? '♀' : '♂'}</small></h2>`
      + `<p class="rank">${H(G.rankTitle())} • Cấp ${P.level}${c ? ` • <b style="color:${I.col}">${H(clsName(c))}</b>` : ''}</p>`
      + `<div class="sh-bars"><div class="b"><i style="width:${Math.min(100, P.xp / need * 100)}%;background:#ffd65a"></i><span>EXP ${Math.floor(P.xp)}/${need}</span></div><div class="b"><i style="width:${P.hp / P.maxHp * 100}%;background:#e0483a"></i><span>❤ ${Math.round(P.hp)}/${Math.round(P.maxHp)}</span></div><div class="b"><i style="width:${v.mana / G.maxMana() * 100}%;background:#4da6ff"></i><span>✦ ${Math.floor(v.mana)}/${G.maxMana()} ${H(manaName())}</span></div></div>`
      + `<p class="meta">${grade != null ? `${gradeTag(grade)} ${H(aptName(grade))} • ` : ''}Ngày ${G.day} • ${H(cur().name)} <b style="color:${cur().col}">${P.gold}</b> • Giáp <b>${P.armorVal}</b></p></div></div>`;
    // origin + innate talents
    const list = G.heroTalentList();
    if (v.hero && v.hero.origin != null) h += `<div class="sh-sec"><h3>Thân thế & thiên mệnh</h3><p class="org">${H(G.destinyOrigin(v.hero))}</p><div class="sh-tal">${list.map(t => `<div class="dc ${t.kind === 'flaw' ? 'fla' : 'tal'}" style="--gc:${t.kind === 'flaw' ? '#d8685a' : GRADE[t.g].col}"><h4>${t.kind === 'flaw' ? `<span class="gtag" style="color:#ff9a8a;border-color:#ff9a8a">${FLAW_SEV[t.g]}</span>` : gradeTag(t.g)} ${H(t.name)}</h4><p class="fx">${H(t.fx)}</p><p class="st">${H(t.story)}</p></div>`).join('') || '<p class="muted">Không có thiên phú hay khuyết điểm bẩm sinh.</p>'}</div></div>`;
    // equipment
    const sn = SLOT_NAMES();
    h += '<div class="sh-sec"><h3>Trang bị</h3><div class="gequip">';
    for (const s of SLOT_ORDER) h += `<div class="geqs">${UI.itemHtml(P.equip[s])}<small>${H(sn[s])}</small></div>`;
    for (let i = 0; i < 3; i++) h += `<div class="geqs">${UI.itemHtml(P.relics[i])}<small>Thánh vật ${i + 1}</small></div>`;
    for (const sl of ARMOR_SLOTS) h += `<div class="geqs">${UI.itemHtml(P.armor[sl])}<small>${ARMOR_SLOT_LABEL[sl]}</small></div>`;
    h += '</div><div id="gdetail" class="gdetail"><p class="muted">Chạm vào một món đồ để xem chi tiết, thay hoặc tháo.</p></div></div>';
    // skills
    h += '<div class="sh-sec"><h3>Kỹ năng</h3><div class="sh-sk">';
    const mast = k => { const m = G.mast(k); return `<div class="mast"><span>Thông thạo ${m.lv}/10${m.bonus ? ` • +${Math.round(m.bonus * 100)}%` : ''}</span><i style="width:${m.to == null ? 100 : Math.round((m.xp - m.from) / (m.to - m.from) * 100)}%"></i></div>`; };
    h += `<div class="sk on ult"><img src="${IMG[ULT_ICON[rk(RL.id)]] ? IMG[ULT_ICON[rk(RL.id)]].src : ''}" alt=""><div><b>${H(RL.skill.name)} <small>[Q] tuyệt kỹ</small></b><p>${H(RL.skill.desc)}</p>${mast('ult')}</div></div>`;
    if (I) h += `<div class="sk on"><div class="ic" style="color:${I.col}">⚡</div><div><b>${H(clsName(c))} <small>[Space] lướt</small></b><p>${H(I.dash)}. ${H(I.pass)}.</p></div></div>`;
    const eq = G.v6.skEq;
    SKILLS.forEach((s, i) => { if (!G.v6.skills[i]) return; h += `<div class="sk ${eq === i ? 'on' : ''}" data-sk="${i}" style="--pc:${s.col}"><img src="${IMG['sk_' + i].src}" alt=""><div><b>${H(skName(s))} <small>${'★'.repeat(s.star)} bậc ${G.v6.skills[i]}/5 ${eq === i ? '• ĐANG DÙNG [V]' : '• bấm để dùng [V]'}</small></b><p>${H(s.desc)}</p>${mast('s' + i)}</div></div>`; });
    if (!Object.keys(G.v6.skills).length) h += `<p class="muted">Chưa có kỹ năng Tế Đàn nào — triệu hồi ở ${H(GACHA_NAME[rk(RL.id)])} để nhận.</p>`;
    h += '</div></div>';
    return h + '<div id="shAttr"></div></div>';
  }

  function build() {
    const box = $('invBody');
    box.innerHTML = sheet();
    box.querySelectorAll('.gslot[data-uid]').forEach(el => el.onclick = () => UI.showDetail(+el.dataset.uid));
    box.querySelectorAll('[data-sk]').forEach(el => el.onclick = () => { G.v6.skEq = G.v6.skEq === +el.dataset.sk ? -1 : +el.dataset.sk; UI.dirty = true; UI.buildInv(); });
    // attributes, class card, weapon proficiency, chosen talents: the existing builders, placed under the sheet
    const t = into(() => UI.buildAttr());
    const dst = $('shAttr'); while (t.firstChild) dst.appendChild(t.firstChild);
    // the buttons inside were bound by the builders; rebind generic sounds
    dst.querySelectorAll('button').forEach(b => UI.bindBtn && UI.bindBtn(b));
  }

  UI.buildInv = function () {
    const tabs = document.querySelector('#inv .tabs');
    // legacy tab names open their new home
    const MAP = { items: 'gear', comp: 'party', pets: 'party', skills: 'stats', feats: 'codex' };
    if (MAP[this.invTab]) this.invTab = MAP[this.invTab];
    if (!this.invTab || this.invTab === 'stats' && false) this.invTab = 'stats';
    if (tabs && !tabs.dataset.v15) {
      tabs.dataset.v15 = 1;
      const order = ['stats', 'gear', 'party', 'shadows', 'codex'], label = { stats: 'Nhân vật', gear: 'Túi đồ', party: 'Đội ngũ', codex: 'Sổ tay' };
      tabs.querySelectorAll('[data-tab]').forEach(b => { const k = b.dataset.tab, i = order.indexOf(k); if (i < 0) b.hidden = true; else { b.style.order = i; if (label[k]) b.textContent = label[k]; } });
    }
    const tab = this.invTab, mark = () => document.querySelectorAll('.tabs [data-tab]').forEach(t => t.classList.toggle('on', t.dataset.tab === tab));
    mark();
    if (tab === 'stats') return build();
    if (tab === 'gear') {
      prev.call(this);
      const box = $('invBody'), t = tabBuild(this, 'items');
      box.insertAdjacentHTML('beforeend', '<h3 class="sec">Vật phẩm</h3>'); while (t.firstChild) box.appendChild(t.firstChild);
      mark(); return;
    }
    if (tab === 'party') {
      const box = $('invBody'); box.innerHTML = '';
      const sec = (title, el) => { box.insertAdjacentHTML('beforeend', `<h3 class="sec">${title}</h3>`); while (el.firstChild) box.appendChild(el.firstChild); };
      sec('Đồng hành định mệnh ♥', tabBuild(this, 'comp'));
      sec('Đồng đội', tabBuild(this, 'party'));
      sec('Thú cưng', tabBuild(this, 'pets'));
      mark(); return;
    }
    if (tab === 'codex') {
      prev.call(this);
      const box = $('invBody'), t = tabBuild(this, 'feats');
      box.insertAdjacentHTML('beforeend', '<h3 class="sec">Thành tựu</h3>'); while (t.firstChild) box.appendChild(t.firstChild);
      mark(); return;
    }
    return prev.call(this);
  };
  // the inventory opens on the character sheet
  const op = UI.openPanel;
  UI.openPanel = function (id) { if (id === 'inv' && !this._invOpened) { this.invTab = 'stats'; } return op.call(this, id); };
})();
