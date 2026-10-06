// ===== DOM user interface =====
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const UI = {
  dirty: true, pointerOverUI: false, screen: null, dialogOpen: false, dq: [], invTab: 'gear',

  init() {
    this.mm = $('minimap'); this.mmctx = this.mm.getContext('2d');
    document.querySelectorAll('button').forEach(b => this.bindBtn(b));
    $('btnNew').onclick = () => this.worldSelect();
    $('btnContinue').onclick = () => this.continueGame();
    $('btnHelp').onclick = () => this.showScreen('help');
    $('btnSettings').onclick = () => this.showScreen('settings');
    $('btnResume').onclick = () => this.resume();
    $('btnPauseHelp').onclick = () => this.showScreen('help');
    $('btnPauseSettings').onclick = () => this.showScreen('settings');
    $('btnQuit').onclick = () => { G.save(); this.toTitle(); };
    $('btnDeathMenu').onclick = () => this.toTitle();
    $('btnRetry').onclick = () => { this.newArmed = true; this.worldSelect(); };
    $('btnWinMenu').onclick = () => this.toTitle();
    $('btnWinGo').onclick = () => { G.state = 'playing'; this.showScreen(null); this.hud(true); };
    $('btnFs').onclick = () => Touch.fullscreen();
    $('btnPauseFs').onclick = () => Touch.fullscreen();
    $('btnStart').onclick = () => this.startWorld();
    $('btnWorldBack').onclick = () => this.showScreen('title');
    $('lowGfx').checked = !!G.lowGfx;
    $('lowGfx').onchange = e => { G.lowGfx = e.target.checked; try { localStorage.setItem('tt_low', G.lowGfx ? '1' : ''); } catch (er) {} if (World.cache) World.cache.clear(); resize(); };
    document.querySelectorAll('.back').forEach(b => b.onclick = () => this.back());
    for (const k of ['master', 'music', 'sfx']) {
      const el = $('vol_' + k);
      el.value = Math.round((k === 'master' ? Sound.master : k === 'music' ? Sound.musicVol : Sound.sfxVol) * 100);
      el.oninput = () => { const v = el.value / 100; if (k === 'master') Sound.master = v; else if (k === 'music') Sound.musicVol = v; else Sound.sfxVol = v; Sound.save(); };
    }
    $('hotbar').addEventListener('click', e => { const h = e.target.closest('.hslot'); if (h) G.switchWeapon(h.dataset.w); });
    $('dialog').addEventListener('click', e => { if (!e.target.closest('.dchoice')) this.dialogNext(); });
    document.querySelectorAll('.tabs [data-tab]').forEach(t => t.onclick = () => { this.invTab = t.dataset.tab; this.buildInv(); });
  },
  bindBtn(b) {
    b.addEventListener('mouseenter', () => Sound.play('sfx_hover', 0.2));
    b.addEventListener('click', () => Sound.play('sfx_click', 0.35));
  },
  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    this.screen = id;
    if (id) $(id).classList.remove('hidden');
    document.body.classList.toggle('cursor', !!id);
  },
  back() {
    if (G.state === 'title') this.showScreen('title');
    else if (G.state === 'paused') this.showScreen('pause');
    else this.showScreen(null);
  },
  hud(show) { $('hud').classList.toggle('hidden', !show); },
  toTitle() {
    G.state = 'title';
    this.hud(false);
    this.dialogOpen = false; this.dq = []; $('dialog').classList.add('hidden'); $('radio').classList.add('hidden');
    $('btnContinue').style.display = G.hasSave() ? '' : 'none';
    $('saveInfo').textContent = G.hasSave() ? G.saveInfo() : '';
    this.showScreen('title');
    Sound.setMusic('music_menu');
    Sound.stopAllLoops();
  },
  // ---------- world select ----------
  worldSelect() {
    if (G.hasSave() && !this.newArmed) {
      this.newArmed = true; $('btnNew').textContent = '⚠ BẤM LẦN NỮA: XOÁ BẢN LƯU';
      setTimeout(() => { this.newArmed = false; $('btnNew').textContent = '☣ CHƠI MỚI'; }, 3500);
      return;
    }
    this.newArmed = false; $('btnNew').textContent = '☣ CHƠI MỚI';
    G.state = 'title'; this.hud(false);
    const box = $('worldCards'); box.innerHTML = '';
    REALM_ORDER.forEach(r => {
      const R0 = REALMS[r], L = LORE[r];
      const c = document.createElement('div');
      c.className = 'wcard'; c.style.setProperty('--wc', R0.color);
      c.innerHTML = `<div class="wimg" style="background-image:url(assets/img/${R0.art}.jpg)"></div><div class="wbody"><h3>${esc(L.name)}</h3><b>${esc(L.tagline)}</b><p>${esc(L.desc)}</p></div>`;
      c.onclick = () => this.pickWorld(r);
      c.onmouseenter = () => Sound.play('sfx_hover', 0.2);
      box.appendChild(c);
    });
    $('worldPick').classList.add('hidden'); $('worldCards').classList.remove('hidden');
    this.showScreen('worlds');
  },
  pickWorld(r) {
    this.pickedRealm = r;
    const L = LORE[r];
    $('pickName').textContent = L.name;
    $('pickArt').style.backgroundImage = `url(assets/img/${REALMS[r].art}.jpg)`;
    this.refreshPick(true);
    $('worldCards').classList.add('hidden'); $('worldPick').classList.remove('hidden');
    Sound.play('sfx_gong', 0.5);
  },
  refreshPick(newName) {
    const r = this.pickedRealm, L = LORE[r], g = this.pickedGender || 'm';
    const names = (HERO_NAMES[r] || HERO_NAMES.md)[g];
    const all = Object.values(HERO_NAMES).flatMap(o => o.m.concat(o.f));
    if (newName || !$('heroName').value || all.includes($('heroName').value)) $('heroName').value = R.pick(names);
    $('pickComps').innerHTML = L.companions.map((c, i) => {
      const rom = c.gender !== g;
      return `<div class="pc"><img src="assets/img/${REALMS[r].port[i]}.jpg" alt=""><b>${esc(c.name)}</b><span>${esc(c.role)}</span><em class="${rom ? 'rom' : 'bond'}">${rom ? '♥ Có thể thành người thương' : '★ ' + esc(c.bondTitle || 'Kết nghĩa')}</em></div>`;
    }).join('');
  },
  startWorld() {
    const r = this.pickedRealm;
    const name = ($('heroName').value || '').trim().slice(0, 20) || R.pick(LORE[r].heroNames);
    if (Touch.on) Touch.fullscreen(true);
    try { localStorage.removeItem('tt_save_v2'); } catch (e) {}
    this.loadRealm(r, () => { G.newGame(r, null, name, this.pickedGender || 'm'); G.start(true); });
  },
  continueGame() {
    let d; try { d = JSON.parse(localStorage.getItem('tt_save_v2')); } catch (e) {}
    if (!d) return;
    if (Touch.on) Touch.fullscreen(true);
    this.loadRealm(d.realm, () => { if (G.load()) G.start(false); });
  },
  loadRealm(r, cb) {
    this.showScreen('loading');
    G.state = 'loading';
    $('loadHint').textContent = 'Đang mở cánh cổng tới ' + LORE[r].name + '...';
    $('loadHint').classList.remove('blink');
    Sound.setRealm(r);
    loadImages(COMMON_IMAGES.concat(realmImages(r)), p => this.setLoad(p)).then(() => {
      G.whiteCache = {}; G.darkCache = {}; G.shadowCache = {};
      // prefetch portrait expressions and theme the touch buttons for this world
      for (const pt of REALMS[r].port) if (EXPR_PORTS.has(pt)) for (const e of EXPRESSIONS) { const im = new Image(); im.src = `assets/img/${pt}_${e}.jpg`; }
      RL = REALMS[r];
      for (const [k, id] of [['KeyH', 'medkit'], ['KeyF', 'food'], ['KeyG', 'grenade']]) { const b = document.querySelector(`#tbtns [data-k="${k}"] img`); if (b) b.src = IMG[itm(id).icon].src; }
      cb();
    });
  },

  pause() { if (G.state !== 'playing') return; G.state = 'paused'; this.showScreen('pause'); },
  resume() { G.state = 'playing'; this.showScreen(null); },
  openPanel(id) {
    if (G.state !== 'playing' || G.player.dead) return;
    G.state = 'menu';
    if (id === 'craft') this.buildCraft();
    if (id === 'inv') this.buildInv();
    if (id === 'map') this.drawBigMap();
    if (id === 'gacha') this.buildGacha();
    this.showScreen(id);
  },
  closePanel() { if (G.state === 'menu') { G.state = 'playing'; this.showScreen(null); } },
  key(code) {
    if (G.state === 'loading' && this.ready && !this.entered) { this.enterTitle(); return; }
    if (G.state === 'dialog') { if (code === 'Space' || code === 'Enter' || code === 'KeyE') this.dialogNext(); if (/^Digit[1-9]$/.test(code)) this.pickChoice(+code.slice(5) - 1); return; }
    if (code === 'Escape') {
      if (G.state === 'playing') this.pause();
      else if (G.state === 'paused') { if (this.screen === 'pause') this.resume(); else this.showScreen('pause'); }
      else if (G.state === 'menu') this.closePanel();
      else if (G.state === 'title' && this.screen !== 'title') this.showScreen('title');
      return;
    }
    if (G.state === 'levelup' && /^Digit[123]$/.test(code)) { this.pickPerk(+code.slice(5) - 1); return; }
    const panels = { KeyC: 'craft', Tab: 'inv', KeyI: 'inv', KeyM: 'map' };
    if (panels[code]) {
      if (G.state === 'playing') this.openPanel(panels[code]);
      else if (G.state === 'menu') { if (this.screen === panels[code]) this.closePanel(); else { G.state = 'playing'; this.openPanel(panels[code]); } }
    }
  },

  // ---------- notifications ----------
  toast(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = msg;
    $('feed').prepend(el);
    while ($('feed').children.length > 5) $('feed').lastChild.remove();
    setTimeout(() => el.classList.add('fade'), 4500);
    setTimeout(() => el.remove(), 5200);
  },
  achievement(text) {
    const el = $('ach');
    el.innerHTML = `<div class="ach-t">🏆 THÀNH TỰU</div><div>${esc(text)}</div>`;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  },
  flashDamage(a) {
    const el = $('dmg');
    el.style.opacity = Math.min(0.85, 0.35 + a);
    clearTimeout(this.dmgT); this.dmgT = setTimeout(() => el.style.opacity = 0, 120);
  },
  boss(z) {
    if (this.bossZ === z) return;
    this.bossZ = z;
    $('bossbar').classList.toggle('hidden', !z);
    if (z) $('bossname').textContent = `${z.name} — Lv${z.lvl}`;
  },
  comboPop(n) {
    const el = $('combo'); el.textContent = 'x' + n + ' COMBO';
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  },
  skillFlash(name, col) {
    const el = $('skillflash'); el.textContent = name; el.style.color = col;
    el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
  },
  banner(title, sub, col) {
    const el = $('banner'); el.innerHTML = `<h2 style="color:${col}">${esc(title)}</h2><p>${esc(sub)}</p>`;
    el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
  },
  fade(cb) {
    const f = $('fader'); f.classList.add('on');
    setTimeout(() => { try { cb(); } catch (e) { console.error(e); } setTimeout(() => f.classList.remove('on'), 80); }, 420);
  },
  lootCard(item, equipped) {
    if (item.rarity < 2) { G.toast(`Nhặt: ${item.name}${equipped ? ' (đã trang bị)' : ''}`, 'good'); return; }
    const el = $('lootcard');
    const r = RARITY[item.rarity];
    el.style.setProperty('--rc', r.color);
    el.innerHTML = `<div class="lc-r">${r.name.toUpperCase()}</div><img src="${IMG[Loot.iconOf(item)].src}" alt=""><b>${esc(item.name)}</b><small>Cấp ${item.ilvl}${equipped ? ' • ĐÃ TRANG BỊ' : ' • vào túi đồ'}</small><p>${esc(Loot.describe(item)).replace(/\n/g, '<br>')}</p>`;
    el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
  },
  radio(lines, cb) {
    const box = $('radio'), txt = $('radioText');
    $('radioHead').textContent = RL.radio;
    box.classList.remove('hidden');
    Sound.play(RL.id === 'ct' || RL.id === 'tt' || RL.id === 'sl' ? 'sfx_bell' : 'sfx_radio', 0.45);
    let i = 0;
    clearInterval(this.radioI); clearTimeout(this.radioT);
    const next = () => {
      if (i >= lines.length) { this.radioT = setTimeout(() => { box.classList.add('hidden'); if (cb) cb(); }, 2200); return; }
      const line = lines[i++];
      let k = 0;
      txt.textContent = '';
      clearInterval(this.radioI);
      this.radioI = setInterval(() => {
        txt.textContent = line.slice(0, ++k);
        if (k >= line.length) { clearInterval(this.radioI); this.radioT = setTimeout(next, 1400 + line.length * 18); }
      }, 24);
    };
    next();
  },

  // ---------- visual-novel dialog ----------
  dialog(opts) {
    if (this.dialogOpen) { this.dq.push(opts); return; }
    this.dialogOpen = true;
    this.d = Object.assign({ i: 0 }, opts);
    this.prevState = G.state;
    G.state = 'dialog';
    const D = $('dialog');
    D.classList.remove('hidden');
    D.classList.toggle('cine', !!opts.cinematic);
    $('dTitle').textContent = opts.title || '';
    $('dTitle').style.display = opts.title ? '' : 'none';
    $('dChoices').innerHTML = '';
    document.body.classList.add('cursor');
    this.dialogShow();
  },
  dialogShow() {
    const d = this.d;
    const line = d.lines[d.i];
    if (!line) { this.dialogEnd(); return; }
    const who = line.who || 'sys';
    const P = d.portrait;
    $('dPort').style.display = who === 'npc' && P ? '' : 'none';
    if (P) {
      let pt = P;
      if (who === 'npc' && EXPR_PORTS.has(P)) { let e = line.e || guessExpr(line.text, d.romance !== false); if (e === 'blush' && d.romance === false) e = 'happy'; if (e && e !== 'normal') pt = P + '_' + e; }
      const src = 'assets/img/' + pt + '.jpg';
      if (!$('dPort').src.endsWith(src)) { $('dPort').src = src; $('dPort').classList.remove('pop'); void $('dPort').offsetWidth; $('dPort').classList.add('pop'); }
    }
    $('dName').textContent = who === 'npc' ? (d.name || '') : who === 'hero' ? Story.names.hero : '';
    $('dName').style.display = who === 'sys' ? 'none' : '';
    $('dText').className = 'dtext ' + who;
    clearInterval(this.dT);
    let k = 0; const t = line.text; this.typing = true;
    $('dText').textContent = '';
    this.dT = setInterval(() => { $('dText').textContent = t.slice(0, ++k); if (k >= t.length) { clearInterval(this.dT); this.typing = false; } }, 20);
    const last = d.i === d.lines.length - 1;
    $('dHint').textContent = d.choices && last ? '' : '▼';
    if (d.choices && last) this.showChoices();
  },
  showChoices() {
    const d = this.d;
    $('dChoices').innerHTML = d.choices.map((c, i) => `<button class="dchoice" data-i="${i}">${i + 1}. ${esc(c.text)}</button>`).join('');
    $('dChoices').querySelectorAll('.dchoice').forEach(b => { this.bindBtn(b); b.onclick = e => { e.stopPropagation(); this.pickChoice(+b.dataset.i); }; });
  },
  pickChoice(i) {
    const d = this.d; if (!d || !d.choices || d.i !== d.lines.length - 1) return;
    const c = d.choices[i]; if (!c) return;
    if (d.onChoice) d.onChoice(c);
    $('dChoices').innerHTML = '';
    d.choices = null;
    if (d.menu) { this.dialogEnd(); return; }
    if (c.aff > 0) Sound.play('sfx_heart', 0.5);
    d.lines = d.lines.concat([{ who: 'hero', text: c.text }]).concat(c.reply ? [{ who: 'npc', text: c.reply + (c.aff >= 7 ? (d.romance === false ? '  ★' : '  ♥') : ''), e: c.e }] : []);
    d.i++; this.dialogShow();
  },
  dialogNext() {
    const d = this.d; if (!d) return;
    if (this.typing) { clearInterval(this.dT); $('dText').textContent = d.lines[d.i].text; this.typing = false; return; }
    if (d.choices && d.i === d.lines.length - 1) return;
    d.i++;
    this.dialogShow();
  },
  dialogEnd() {
    const d = this.d;
    $('dialog').classList.add('hidden');
    this.dialogOpen = false; this.d = null;
    G.state = ['title', 'won'].includes(this.prevState) ? this.prevState : 'playing';
    document.body.classList.remove('cursor');
    if (d && d.onDone) d.onDone();
    if (this.dq.length && !this.dialogOpen) this.dialog(this.dq.shift());
  },
  menuDialog(o) {
    let act = null;
    this.dialog({ menu: true, name: o.name, portrait: o.portrait, lines: [{ who: 'npc', text: o.text }], choices: o.options.map(op => ({ text: op.text, act: op.act })), onChoice: c => { act = c.act; }, onDone: () => { if (act) act(); } });
  },

  // ---------- level up ----------
  levelUp() {
    G.state = 'levelup';
    const P = G.player;
    const pool = PERKS.filter(p => !(p.id === 'pierce' && (P.perks.pierce || 0) >= 3));
    const picks = [];
    while (picks.length < 3) { const p = R.pick(pool); if (!picks.includes(p)) picks.push(p); }
    this.perkPicks = picks;
    $('lvlTitle').textContent = `LÊN CẤP ${P.level - G.lvlQueue + 1}!`;
    $('lvlRank').textContent = G.rankTitle();
    const box = $('cards'); box.innerHTML = '';
    picks.forEach((p, i) => {
      const c = document.createElement('div');
      c.className = 'card';
      const lv = P.perks[p.id] || 0;
      c.innerHTML = `<div class="ck">${i + 1}</div><img src="${IMG[p.icon] ? IMG[p.icon].src : ''}" alt=""><h3>${esc(p.name)}${lv ? ' ' + 'I'.repeat(lv + 1) : ''}</h3><p>${esc(p.desc)}</p>`;
      c.onclick = () => this.pickPerk(i);
      c.onmouseenter = () => Sound.play('sfx_hover', 0.2);
      box.appendChild(c);
    });
    this.showScreen('levelup');
  },
  pickPerk(i) {
    if (G.state !== 'levelup' || !this.perkPicks[i]) return;
    G.applyPerk(this.perkPicks[i].id);
    G.lvlQueue--;
    G.state = 'playing';
    this.showScreen(null);
  },

  // ---------- panels ----------
  buildCraft() {
    const box = $('craftList'); box.innerHTML = '';
    const nm = id => itm(id).name;
    for (const r of RECIPES) {
      const ok = G.canCraft(r);
      const row = document.createElement('div');
      row.className = 'recipe' + (ok ? '' : ' no');
      const needs = Object.entries(r.need).map(([k, n]) => {
        const have = G.player.inv[k] || 0;
        return `<span class="need ${have >= n ? 'ok' : 'bad'}"><img src="${IMG[itm(k).icon].src}" alt="">${esc(nm(k))} ${have}/${n}</span>`;
      }).join('');
      row.innerHTML = `<img class="ricon" src="${IMG[itm(r.out).icon].src}" alt=""><div class="rinfo"><b>${esc(nm(r.out))} x${r.n}</b><small>${esc(itm(r.out).desc || '')}</small><div>${needs}</div></div><button ${ok ? '' : 'disabled'}>CHẾ TẠO</button>`;
      const btn = row.querySelector('button');
      this.bindBtn(btn);
      btn.onclick = () => { G.craft(r); this.buildCraft(); };
      box.appendChild(row);
    }
  },
  itemHtml(it) {
    if (!it) return '<div class="gslot empty"></div>';
    const r = RARITY[it.rarity];
    return `<div class="gslot" style="--rc:${r.color}" data-uid="${it.uid}"><img src="${IMG[Loot.iconOf(it)].src}" alt=""><span class="gl">Lv${it.ilvl}</span></div>`;
  },
  buildInv() {
    const P = G.player;
    document.querySelectorAll('.tabs [data-tab]').forEach(t => t.classList.toggle('on', t.dataset.tab === this.invTab));
    const box = $('invBody');
    const tab = this.invTab;
    if (tab === 'gear') {
      const slotNames = { melee: 'Cận chiến', r1: RL.weapons.r1.name, r2: RL.weapons.r2.name, r3: RL.weapons.r3.name };
      let h = '<h3>Đang trang bị</h3><div class="gequip">';
      for (const s of SLOT_ORDER) h += `<div class="geqs">${this.itemHtml(P.equip[s])}<small>${esc(slotNames[s])}</small></div>`;
      for (let i = 0; i < 3; i++) h += `<div class="geqs">${this.itemHtml(P.relics[i])}<small>Thánh vật ${i + 1}</small></div>`;
      for (const sl of ARMOR_SLOTS) h += `<div class="geqs">${this.itemHtml(P.armor[sl])}<small>${ARMOR_SLOT_LABEL[sl]}</small></div>`;
      h += `</div><p class="muted">Giáp: <b>${P.armorVal}</b> (giảm ${Math.round(P.armorVal / (P.armorVal + 100) * 100)}% sát thương) • ${esc(cur().name)}: <b style="color:${cur().col}">${P.gold}</b></p>`;
      h += '<h3>Túi đồ (' + P.stash.length + '/' + G.stashCap() + ')</h3><div class="gstash">';
      for (const it of P.stash) h += this.itemHtml(it);
      if (!P.stash.length) h += '<p class="muted">Chưa có trang bị dự phòng. Hạ tinh anh, boss và mở rương báu để nhận đồ.</p>';
      h += '</div><div id="gdetail" class="gdetail"><p class="muted">Chạm vào một món đồ để xem chi tiết.</p></div>';
      box.innerHTML = h;
      box.querySelectorAll('.gslot[data-uid]').forEach(el => el.onclick = () => this.showDetail(+el.dataset.uid));
    } else if (tab === 'items') {
      const ids = Object.keys(P.inv).filter(k => P.inv[k] > 0);
      let h = '<div class="ggrid">';
      for (const id of ids) {
        const it = itm(id);
        h += `<div class="slot" data-id="${id}"><img src="${IMG[it.icon].src}" alt=""><span class="cnt">${P.inv[id]}</span><div class="tip"><b>${esc(it.name)}</b><br>${esc(it.desc || '')}</div></div>`;
      }
      if (!ids.length) h += '<p class="muted">Túi trống. Lục soát thùng, xe, tủ đồ [E].</p>';
      box.innerHTML = h + '</div>';
      box.querySelectorAll('.slot').forEach(el => el.onclick = () => {
        const id = el.dataset.id;
        if (id === 'scroll') { this.closePanel(); G.useScroll(); return; }
        G.useItem(id);
        this.buildInv();
      });
    } else if (tab === 'comp') {
      let h = '<div class="comps">';
      for (const c of G.companions) {
        const known = c.joined;
        h += `<div class="compc ${known ? '' : 'locked'}"><img src="assets/img/${c.data.portrait}.jpg" alt=""><div><b>${known ? esc(c.data.name) : '???'}</b><small>${known ? esc(c.data.role) : 'Chưa gặp'}</small>${known ? `<div class="affbar"><i style="width:${c.aff}%"></i></div><span class="hearts">${(c.romance ? '♥' : '★').repeat(c.stage)}${(c.romance ? '♡' : '☆').repeat(5 - c.stage)} ${c.lover ? 'NGƯỜI THƯƠNG' : c.sworn ? esc(c.data.bondTitle || 'TRI KỶ').toUpperCase() : (c.romance ? '' : '(' + esc(c.data.bondTitle || 'tình bạn') + ') ') + Math.round(c.aff) + '/100'}</span><p>${esc(c.data.personality)}</p><p class="muted">Thích: ${(c.data.likes || []).map(id => itm(id) ? itm(id).name : id).join(', ')}</p>` : ''}</div></div>`;
      }
      box.innerHTML = h + '</div><p class="muted">Tăng thân mật: chiến đấu cùng nhau, tặng quà họ thích, nghỉ bên lửa trại, chọn lời thoại chân thành. Đạt mốc ♥ sẽ mở cảnh tâm sự.</p>';
    } else {
      const perks = Object.entries(P.perks).map(([k, n]) => `<li>${esc(PERKS.find(p => p.id === k).name)}${n > 1 ? ' x' + n : ''}</li>`).join('') || '<li>Chưa có</li>';
      box.innerHTML = `<div class="stats2"><div><h3>${esc(Story.names.hero)} — ${esc(G.rankTitle())}</h3><p>Cấp ${P.level} • Máu ${Math.round(P.maxHp)} • Ngày ${G.day}</p><p>Hạ địch: ${G.stats.kills} • Combo cao nhất: x${G.stats.maxCombo} • Cổng đã chinh phục: ${G.stats.gates} • Đã cứu: ${G.stats.rescued}</p><p>Kỹ năng tối thượng [Q]: <b>${esc(G.skillName())}</b>${G.v6 && G.v6.skEq >= 0 ? '' : ' — ' + esc(RL.skill.desc)} • Trang phục: <b>${esc(OUTFIT_NAMES[rk(RL.id)][G.outfitTier(P)])}</b> (theo độ hiếm giáp thân)</p></div><div><h3>Thiên phú</h3><ul>${perks}</ul></div></div>`;
    }
  },
  showDetail(uid) {
    const P = G.player;
    const it = P.stash.find(x => x.uid === uid) || Object.values(P.equip).find(x => x && x.uid === uid) || Object.values(P.armor).find(x => x && x.uid === uid) || P.relics.find(x => x && x.uid === uid);
    if (!it) return;
    const inStash = P.stash.includes(it);
    const r = RARITY[it.rarity];
    const cur = it.kind === 'weapon' ? P.equip[it.slot] : it.kind === 'armor' ? P.armor[it.slot] : null;
    const cmp = cur && cur !== it ? ` <small>(${Loot.power(it) > Loot.power(cur) ? '▲ mạnh hơn' : '▼ yếu hơn'} đồ đang dùng)</small>` : '';
    $('gdetail').innerHTML = `<div class="gd" style="--rc:${r.color}"><img src="${IMG[Loot.iconOf(it)].src}" alt=""><div><b style="color:${r.color}">${esc(it.name)}</b> <small>${r.name} • Cấp ${it.ilvl}</small>${cmp}<p>${esc(Loot.describe(it)).replace(/\n/g, '<br>')}</p>${inStash ? '<button id="bEq">TRANG BỊ</button> <button id="bSal">PHÂN GIẢI</button>' : ''}</div></div>`;
    if (inStash) {
      $('bEq').onclick = () => { G.equipItem(it); this.buildInv(); };
      $('bSal').onclick = () => { G.salvage(it); this.buildInv(); };
      this.bindBtn($('bEq')); this.bindBtn($('bSal'));
    }
  },
  drawBigMap() {
    const c = $('bigmap'), g = c.getContext('2d');
    const P = G.player.car || G.player;
    const N = 25, S = c.width / (N * SB);
    const psx = Math.floor(P.x / SBPX), psy = Math.floor(P.y / SBPX);
    g.fillStyle = '#050608'; g.fillRect(0, 0, c.width, c.height);
    g.imageSmoothingEnabled = false;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const k = World.mode + nkey(psx - 12 + x, psy - 12 + y);
      if (!World.explored.has(k)) continue;
      const m = World.getMini(k); if (!m) continue;
      g.drawImage(m, x * SB * S, y * SB * S, SB * S + 0.5, SB * S + 0.5);
    }
    const toM = (wx, wy) => [((wx / TILE) - (psx - 12) * SB) * S, ((wy / TILE) - (psy - 12) * SB) * S];
    if (World.mode === 'over') for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const sx = psx - 12 + x, sy = psy - 12 + y, w = World.wonderAt(sx, sy); if (w == null) continue;
      const found = World.explored.has(World.mode + nkey(sx, sy));
      const [mx, my] = [(x + 0.5) * SB * S, (y + 0.5) * SB * S];
      g.font = (found ? 'bold 20px' : 'bold 22px') + ' VT323, monospace'; g.textAlign = 'center';
      g.fillStyle = '#000'; g.fillText(found ? '★' : '?', mx + 1, my + 8);
      g.fillStyle = found ? '#ffe6a0' : '#c8b8ff'; g.fillText(found ? '★' : '?', mx, my + 7);
      if (found) { g.font = '13px VT323, monospace'; g.fillText(WONDERS[w].name, mx, my + 22); }
    }
    g.font = '16px VT323, monospace'; g.textAlign = 'center';
    for (const t of World.mode === 'over' ? Story.targets() : []) {
      const [x, y] = toM(t.x, t.y);
      const cx = clamp(x, 10, c.width - 10), cy = clamp(y, 24, c.height - 10);
      g.strokeStyle = '#ffcf3a'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 9, 0, TAU); g.stroke();
      g.fillStyle = '#ffcf3a'; g.fillText(t.label || '', clamp(x, 50, c.width - 50), cy - 14);
    }
    if (World.mode === 'over') { const [hx, hy] = toM(16 * TILE, 16 * TILE); g.fillStyle = '#6dff7a'; g.fillText('⌂ Nơi trú ẩn', hx, hy + 5); }
    const [px, py] = toM(P.x, P.y);
    g.save(); g.translate(px, py); g.rotate(G.player.car ? G.player.car.angle : G.player.angle);
    g.fillStyle = '#4dd2ff'; g.strokeStyle = '#000'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(10, 0); g.lineTo(-7, -7); g.lineTo(-3, 0); g.lineTo(-7, 7); g.closePath(); g.fill(); g.stroke();
    g.restore();
    $('mapInfo').textContent = World.mode === 'dungeon' ? `${RL.dungeon.name} — Cổng hạng ${World.dg.rank}, tầng ${World.dg.floor}/${World.dg.floors}` : `Cách nơi trú ẩn ${Math.round(Math.hypot(P.x - 16 * TILE, P.y - 16 * TILE) / TILE)}m • Cấp vùng ${World.levelAt(P.x, P.y)} • Càng đi xa, quái càng mạnh và đồ càng quý`;
  },

  // ---------- death / victory ----------
  statsHtml() {
    const s = G.stats, P = G.player;
    return `<div class="st"><b>${P.level}</b><span>${esc(G.rankTitle())}</span></div><div class="st"><b>${s.kills}</b><span>kẻ địch đã hạ</span></div><div class="st"><b>${G.day}</b><span>ngày sống sót</span></div><div class="st"><b>x${s.maxCombo}</b><span>combo cao nhất</span></div><div class="st"><b>${s.gates}</b><span>cổng chinh phục</span></div><div class="st"><b>${Object.keys(G.achieved).length}/${Object.keys(ACHIEVEMENTS).length}</b><span>thành tựu</span></div>`;
  },
  death() {
    this.hud(false);
    $('deathStats').innerHTML = this.statsHtml();
    $('deathLine').textContent = Story.fmt(R.pick(G.lore().deathLines));
    this.showScreen('death');
  },
  victory(romance, lover) {
    G.state = 'won';
    this.hud(false);
    $('winStats').innerHTML = this.statsHtml();
    $('winTitle').textContent = romance ? 'TÌNH YÊU VÀ CHIẾN THẮNG' : 'TRUYỀN THUYẾT HOÀN THÀNH';
    $('winSub').textContent = romance ? `${Story.names.hero} và ${lover.data.name} đã cùng nhau viết nên kết thúc của riêng mình.` : Story.fmt(Story.tpl.title);
    $('winArt').style.backgroundImage = `url(assets/img/${RL.id === 'md' ? 'victory' : RL.art}.jpg)`;
    $('winPort').style.display = romance ? '' : 'none';
    if (romance) $('winPort').src = 'assets/img/' + lover.data.portrait + '.jpg';
    this.showScreen('victory');
    Sound.play('sfx_achievement', 0.9);
  },

  // ---------- per-frame HUD ----------
  update(dt) {
    if (!['playing', 'paused', 'menu', 'levelup', 'dialog'].includes(G.state)) return;
    const P = G.player;
    const bar = (id, v, max) => { $(id).style.width = clamp(v / max * 100, 0, 100) + '%'; };
    bar('hpFill', P.hp, P.maxHp); $('hpTxt').textContent = Math.ceil(Math.max(0, P.hp)) + '/' + Math.round(P.maxHp) + (P.shield > 1 ? ' +' + Math.round(P.shield) : '');
    bar('foodFill', P.hunger, 100); $('foodTxt').textContent = Math.ceil(P.hunger);
    bar('waterFill', P.thirst, 100); $('waterTxt').textContent = Math.ceil(P.thirst);
    bar('stamFill', P.stamina, P.maxStam); $('stamTxt').textContent = Math.ceil(P.stamina);
    bar('enFill', P.energy, 100); $('enTxt').textContent = P.energy >= 100 ? G.skillName() + ' [Q]' : Math.floor(P.energy) + '%';
    $('enRow').classList.toggle('ready', P.energy >= 100);
    $('bars').classList.toggle('lowhp', P.hp < P.maxHp * 0.3);
    const h = Math.floor(G.clock), mi = Math.floor((G.clock - h) * 60);
    $('clock').textContent = World.mode === 'dungeon' ? `Tầng ${World.dg.floor}/${World.dg.floors}` : String(h).padStart(2, '0') + ':' + String(mi).padStart(2, '0');
    $('dayN').textContent = World.mode === 'dungeon' ? 'CỔNG ' + World.dg.rank : 'NGÀY ' + G.day;
    $('dayicon').textContent = World.mode === 'dungeon' ? '⛩' : G.night ? '☾' : (G.clock < 7 || G.clock > 18) ? '◐' : '☀';
    $('weather').textContent = G.raining && World.mode === 'over' ? '☂' : '';
    const goal = World.mode === 'dungeon' ? (World.dg.cleared ? 'Mở rương báu và rời Cổng' : 'Tìm và tiêu diệt Chủ Hầm Ngục') : Story.goal();
    if ($('objText').textContent !== goal) { $('objText').textContent = goal; $('objective').classList.remove('pulse'); void $('objective').offsetWidth; $('objective').classList.add('pulse'); }
    $('xpfill').style.width = (P.xp / G.xpNeed(P.level) * 100) + '%';
    $('lvl').textContent = `CẤP ${P.level} • ${G.rankTitle()}${G.btBlocked && G.btBlocked() ? ' • BÌNH CẢNH' : ''}`;
    $('kills').textContent = '☠ ' + G.stats.kills;
    $('combo').style.opacity = G.combo >= 5 ? 1 : 0;
    if (G.combo >= 5) $('combo').textContent = 'x' + G.combo + ' COMBO';
    const it = G.interactTarget, pr = $('prompt');
    if (G.action) pr.style.display = 'none';
    else if (it && !P.dead) { pr.style.display = 'block'; pr.innerHTML = `<span class="key">E</span> ${esc(it.label)}`; }
    else pr.style.display = 'none';
    const ab = $('actionbar');
    if (G.action) { ab.style.display = 'block'; $('actionfill').style.width = (G.action.t / G.action.dur * 100) + '%'; $('actionlabel').textContent = G.action.label; }
    else ab.style.display = 'none';
    const ch = $('carhud');
    if (P.car) { ch.style.display = 'block'; ch.innerHTML = `${Math.round(Math.abs(P.car.speed) * 0.4)} km/h<div class="mini"><span>XĂNG</span><i style="width:${P.car.fuel}%;background:#e6b422"></i></div><div class="mini"><span>XE</span><i style="width:${Math.max(0, P.car.hp)}%;background:#c62828"></i></div>`; }
    else ch.style.display = 'none';
    if (this.bossZ) $('bossfill').style.width = Math.max(0, this.bossZ.hp / this.bossZ.maxHp * 100) + '%';
    if (G.frame % 10 === 0 || this.dirty) {
      const sig = P.weapon + JSON.stringify(P.inv) + JSON.stringify(P.mags) + Object.values(P.equip).map(e => e ? e.uid : 0).join() + (P.reloading > 0) + G.companions.map(c => c.joined + ':' + Math.round(c.aff) + ':' + c.scenePending + (c.ally ? Math.round(c.ally.hp / 10) + '' + c.ally.downed : '')).join();
      if (sig !== this.lastSig || this.dirty) { this.lastSig = sig; this.dirty = false; this.buildHotbar(); }
    }
    if (G.frame % 3 === 0) this.drawMinimap();
  },
  buildHotbar() {
    const P = G.player;
    let html = '';
    SLOT_ORDER.forEach((s, i) => {
      const it = P.equip[s];
      if (!it && s !== 'melee') return;
      const ammo = s !== 'melee' ? `<span class="ammo ${P.mags[s] === 0 ? 'empty' : ''}">${P.reloading > 0 && P.weapon === s ? '...' : P.mags[s]}<small>/${P.inv[AMMO_OF[s]] || 0}</small></span>` : '';
      const icon = it ? `<img src="${IMG[Loot.iconOf(it)].src}" alt="">` : '<span class="fist">✊</span>';
      const col = it ? RARITY[it.rarity].color : '#555';
      html += `<div class="hslot ${P.weapon === s ? 'active' : ''}" data-w="${s}" style="--rc:${col}" title="${esc(it ? it.name : 'Tay không')}"><span class="hk">${i + 1}</span>${icon}${ammo}</div>`;
    });
    $('hotbar').innerHTML = html;
    const q = [['medkit', 'H'], ['bandage', 'H'], ['food', 'F'], ['water', 'F'], ['grenade', 'G'], ['molotov', 'G'], ['barricade', 'B'], ['trap', 'T'], ['scroll', 'U']];
    let qh = '';
    for (const [id, k] of q) { const n = P.inv[id] || 0; qh += `<div class="qslot ${n ? '' : 'none'}" data-q="${id}"><img src="${IMG[itm(id).icon].src}" alt=""><span class="cnt">${n}</span><span class="qk">${k}</span></div>`; }
    $('quick').innerHTML = qh;
    let cp = '';
    for (const c of G.companions) if (c.joined && c.ally) {
      cp += `<div class="cpm ${c.ally.downed ? 'down' : ''} ${c.scenePending ? 'love' : ''}"><img src="assets/img/${c.data.portrait}.jpg" alt=""><div><b>${esc(c.data.name)}</b><div class="cphp"><i style="width:${c.ally.hp / c.ally.maxHp * 100}%"></i></div><span>${(c.romance ? '♥' : '★').repeat(c.stage)}${(c.romance ? '♡' : '☆').repeat(5 - c.stage)}</span></div></div>`;
    }
    $('comphud').innerHTML = cp;
  },
  drawMinimap() {
    const g = this.mmctx, P = G.player.car || G.player;
    const span = 96, S = 200 / span;
    const ox = P.x / TILE - span / 2, oy = P.y / TILE - span / 2;
    g.fillStyle = '#050608'; g.fillRect(0, 0, 200, 200);
    g.imageSmoothingEnabled = false;
    const sx0 = Math.floor(ox / SB), sy0 = Math.floor(oy / SB);
    for (let sy = sy0; sy <= sy0 + 3; sy++) for (let sx = sx0; sx <= sx0 + 3; sx++) {
      const k = World.mode + nkey(sx, sy);
      if (!World.explored.has(k)) continue;
      const m = World.getMini(k); if (!m) continue;
      g.drawImage(m, (sx * SB - ox) * S, (sy * SB - oy) * S, SB * S + 0.5, SB * S + 0.5);
    }
    const toM = (x, y) => [(x / TILE - ox) * S, (y / TILE - oy) * S];
    for (const z of G.zombies) {
      if (z.dead || (dist(z.x, z.y, P.x, P.y) > 520 && !z.boss)) continue;
      const [x, y] = toM(z.x, z.y);
      g.fillStyle = z.boss ? '#ff3b3b' : z.elite ? '#ffb020' : '#ff5a5a';
      g.fillRect(x - 1.5, y - 1.5, z.boss ? 6 : 3, z.boss ? 6 : 3);
    }
    for (const a of G.allies) { const [x, y] = toM(a.x, a.y); if (a.kind === 'merchant') { g.fillStyle = '#ffd23a'; g.font = 'bold 11px sans-serif'; g.textAlign = 'center'; g.fillText('$', clamp(x, 6, 194), clamp(y, 10, 196)); continue; } g.fillStyle = a.kind === 'comp' ? '#ff8ab8' : a.kind === 'shadow' ? '#8a7bff' : '#6dff7a'; g.fillRect(x - 1.5, y - 1.5, 3, 3); }
    if (G.frame % 30 === 0 || !this.chestMarks) this.chestMarks = World.propsNear(P.x, P.y, 1500, []).filter(p => p.container === 'chest' && !p.looted && !p.dead);
    for (const p of this.chestMarks) { if (p.looted) continue; const [x, y] = toM(p.x, p.y); if (x < 0 || y < 0 || x > 200 || y > 200) continue; g.fillStyle = CHESTS[p.data.tier].col; g.strokeStyle = '#000'; g.lineWidth = 1; g.fillRect(x - 2.5, y - 2, 5, 4); g.strokeRect(x - 2.5, y - 2, 5, 4); }
    for (const t of G.curTargets || []) {
      let [x, y] = toM(t.x, t.y);
      x = clamp(x, 6, 194); y = clamp(y, 6, 194);
      g.fillStyle = '#ffcf3a'; g.strokeStyle = '#000';
      g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x + 5, y); g.lineTo(x, y + 6); g.lineTo(x - 5, y); g.closePath(); g.fill(); g.stroke();
    }
    g.save(); g.translate(100, 100); g.rotate(G.player.car ? G.player.car.angle : G.player.angle);
    g.fillStyle = '#4dd2ff'; g.strokeStyle = '#000'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(7, 0); g.lineTo(-5, -5); g.lineTo(-2, 0); g.lineTo(-5, 5); g.closePath(); g.fill(); g.stroke();
    g.restore();
  },

  // ---------- boot ----------
  setLoad(p) { $('loadFill').style.width = Math.round(p * 100) + '%'; },
  loaded() {
    this.ready = true;
    $('loadHint').textContent = 'NHẤN PHÍM BẤT KỲ HOẶC CHẠM ĐỂ BẮT ĐẦU';
    $('loadHint').classList.add('blink');
    $('loading').onclick = () => { if (!this.entered) this.enterTitle(); };
  },
  enterTitle() {
    this.entered = true;
    Sound.unlock();
    this.toTitle();
  },
};
