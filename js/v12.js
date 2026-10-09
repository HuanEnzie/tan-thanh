// ===== v12: kill mastery per monster kind (100 / 500 / 1000 kills), class weapon proficiency (hit chance + damage), misses =====
const MASTERY = [
  { n: 100, title: 'Thợ săn', dmg: 0.2, def: 0 },
  { n: 500, title: 'Kẻ diệt', dmg: 0.35, def: 0.1 },
  { n: 1000, title: 'Khắc tinh', dmg: 0.5, def: 0.2 },
];
const ROMAN = ['', 'I', 'II', 'III'];
// weapon families
const WCAT = ['gun', 'bow', 'magic', 'light', 'blade', 'heavy'];
const WCAT_NAME = { gun: 'Súng', bow: 'Cung, nỏ', magic: 'Pháp khí (phù, cầu, trượng)', light: 'Dao găm, quyền', blade: 'Kiếm, thương, lưỡi hái', heavy: 'Rìu, búa, đại kiếm' };
const MCAT = { dagger: 'light', fist: 'light', sword: 'blade', spear: 'blade', scythe: 'blade', axe: 'heavy', hammer: 'heavy', great: 'heavy' };
// [hit chance, damage multiplier] per class and weapon family
const PROF = {
  none: { gun: [0.92, 1], bow: [0.92, 1], magic: [0.92, 1], light: [0.95, 1], blade: [0.95, 1], heavy: [0.93, 1] },
  warrior: { gun: [0.85, 0.9], bow: [0.8, 0.85], magic: [0.7, 0.75], light: [0.95, 0.95], blade: [0.98, 1.05], heavy: [0.97, 1.1] },
  assassin: { gun: [0.85, 0.95], bow: [0.88, 0.95], magic: [0.7, 0.75], light: [1, 1.15], blade: [0.97, 1.05], heavy: [0.82, 0.8] },
  ranger: { gun: [1, 1.05], bow: [1, 1.1], magic: [0.8, 0.85], light: [0.9, 0.9], blade: [0.88, 0.9], heavy: [0.8, 0.8] },
  mage: { gun: [0.5, 0.8], bow: [0.55, 0.8], magic: [1, 1.15], light: [0.7, 0.6], blade: [0.68, 0.6], heavy: [0.6, 0.55] },
  healer: { gun: [0.7, 0.85], bow: [0.72, 0.85], magic: [0.95, 1.05], light: [0.85, 0.8], blade: [0.82, 0.8], heavy: [0.85, 0.9] },
};
const projCat = p => p === 'arrow' ? 'bow' : (p === 'orb' || p === 'talisman' || p === 'wave' || p === 'sword') ? 'magic' : 'gun';
const H = s => esc(String(s));
const wcatOf = w => !w ? null : w.melee ? (w.mt ? MCAT[w.mt.id] || 'blade' : w === FISTS ? 'light' : 'blade') : projCat(w.proj);

Object.assign(G, {
  kc() { const v = this.v10; return v ? (v.kc || (v.kc = {})) : {}; },
  masteryTier(img) { const e = img && this.kc()[img]; if (!e) return 0; let t = 0; for (const M of MASTERY) if (e.n >= M.n) t++; return t; },
  prof(cat) { return (PROF[cls()] || PROF.none)[cat] || [1, 1]; },
  // final hit chance against z with a weapon family
  hitChance(cat, z) {
    const c = cls();
    if (c === 'ranger' && (cat === 'gun' || cat === 'bow')) return 1;
    let h = this.prof(cat)[0] + this.attr('agi') * 0.003;
    if (z && z.boss) h -= 0.05; else if (z && z.elite) h -= 0.02;
    return clamp(h, 0.05, 1);
  },
  v12Tick() {
    const P = this.player; if (!P || P.dead) return;
    const cat = wcatOf(P.wdef);
    if (cat && cat !== this._wcat) {
      const first = this._wcat === undefined; this._wcat = cat;
      const [h, d] = this.prof(cat);
      if (!first && cls() && (h < 0.8 || d < 0.8)) this.toast(`${clsName(cls())} không quen dùng ${WCAT_NAME[cat].toLowerCase()}: trúng ${Math.round(this.hitChance(cat) * 100)}%, sát thương ${Math.round(d * 100)}%.`, 'warn');
    }
  },
});

(function () {
  // misses, class weapon proficiency and mastery bonus
  const he = G.hitEnemy;
  G.hitEnemy = function (z, dmg, kx, ky, src, ang, wp) {
    if (z && !z.dead && wp && !this._atk) {
      const mine = src === 'melee' || (src === 'gun' && wp.hit && !wp.ally && !wp.hostile);
      if (mine) {
        const cat = src === 'melee' ? (wp.mt ? MCAT[wp.mt.id] || 'blade' : wp === FISTS ? 'light' : 'blade') : projCat(wp.proj);
        if (Math.random() >= this.hitChance(cat, z)) {
          Floaters.add(z.x, z.y - z.r - 6, 'TRƯỢT', '#9aa3b5', 8);
          // a missed bullet flies on instead of stopping on the target
          if (wp.hit) { wp.pierce = (wp.pierce || 0) + 1; wp.dmg /= 0.75; }
          z.alert && z.alert(this.player.x, this.player.y);
          return false;
        }
        dmg *= this.prof(cat)[1];
      }
    }
    const t = z && this.masteryTier(z.img);
    if (t) dmg *= 1 + MASTERY[t - 1].dmg;
    return he.call(this, z, dmg, kx, ky, src, ang, wp);
  };
  const hp = G.hurtPlayer;
  G.hurtPlayer = function (dmg, src, silent) {
    const t = src && src.img ? this.masteryTier(src.img) : 0;
    if (t) dmg *= 1 - MASTERY[t - 1].def;
    return hp.call(this, dmg, src, silent);
  };
  // kill counts per monster kind
  const ke = G.killEnemy;
  G.killEnemy = function (z, src) {
    ke.call(this, z, src);
    if (!this.v10 || !z || !z.img) return;
    const kc = this.kc(), e = kc[z.img] || (kc[z.img] = { n: 0, name: z.name });
    if (!z.boss || !e.name) e.name = z.name;
    e.n++;
    const M = MASTERY.find(m => m.n === e.n);
    if (M) {
      const t = MASTERY.indexOf(M) + 1;
      UI.achievement(`${M.title} ${e.name} ${ROMAN[t]} — hạ ${M.n} ${e.name}: +${Math.round(M.dmg * 100)}% sát thương lên loài này${M.def ? `, chịu ít hơn ${Math.round(M.def * 100)}% sát thương từ chúng` : ''}`);
      Sound.play('sfx_achievement', 0.6);
      const P = this.player; FX.pillar(P.x, P.y, '#ffd65a', 1, 26);
    }
  };
  // rangers barely spread their shots
  const fg = fireGun;
  fireGun = function (w) { return fg(cls() === 'ranger' ? Object.assign({}, w, { spread: (w.spread || 0) * 0.35 }) : w); };
  const tick = G.v5Tick;
  G.v5Tick = function (dt) { tick.call(this, dt); if (this.frame % 20 === 0) this.v12Tick(); };

  // ---------- UI: Thành tựu tab, proficiency table in Nhân vật ----------
  const THUMB = {};
  const thumb = img => { const im = IMG[img]; return im ? (im.src || (im.toDataURL ? im.toDataURL() : '')) : ''; };
  const bi = UI.buildInv;
  UI.buildInv = function () {
    if (this.invTab !== 'feats') return bi.call(this);
    document.querySelectorAll('.tabs [data-tab]').forEach(t => t.classList.toggle('on', t.dataset.tab === 'feats'));
    const box = $('invBody'), kc = G.kc();
    const list = Object.entries(kc).sort((a, b) => b[1].n - a[1].n);
    const got = list.reduce((s, [img]) => s + G.masteryTier(img), 0);
    let h = `<h3>Thành tựu săn quái <small>${list.length} loài • ${got} danh hiệu</small></h3><p class="muted">Hạ cùng một loài ${MASTERY.map((m, i) => `${m.n} con: <b>${m.title} ${ROMAN[i + 1]}</b> (+${Math.round(m.dmg * 100)}% sát thương${m.def ? `, −${Math.round(m.def * 100)}% sát thương nhận` : ''})`).join(' • ')}. Quân triệu hồi và đồng đội hạ cũng được tính.</p><div class="feat12">`;
    for (const [img, e] of list) {
      const t = G.masteryTier(img), nx = MASTERY[t];
      const lo = t ? MASTERY[t - 1].n : 0, pc = nx ? Math.min(100, (e.n - lo) / (nx.n - lo) * 100) : 100;
      h += `<div class="ft ${t ? 't' + t : ''}"><img src="${thumb(img)}" alt=""><div><b>${H(e.name)}</b>${t ? ` <span class="badge">${MASTERY[t - 1].title} ${ROMAN[t]}</span>` : ''}<small>${e.n} mạng${nx ? ` • còn ${nx.n - e.n} tới ${nx.title} ${ROMAN[t + 1]}` : ' • đã tối đa'}${t ? ` • +${Math.round(MASTERY[t - 1].dmg * 100)}% sát thương` : ''}</small><i style="width:${pc}%"></i></div></div>`;
    }
    if (!list.length) h += '<p class="muted">Chưa hạ con nào. Ra ngoài săn thôi!</p>';
    h += '</div><h3>Cột mốc</h3><div class="feat12 ach">';
    for (const [id, txt] of Object.entries(ACHIEVEMENTS)) h += `<div class="ft ${G.achieved && G.achieved[id] ? 't1' : 'lock'}"><div><b>${G.achieved && G.achieved[id] ? '🏆' : '🔒'} ${H(String(txt).split(' — ')[0])}</b><small>${H(String(txt).split(' — ')[1] || '')}</small></div></div>`;
    box.innerHTML = h + '</div>';
  };
  const ba = UI.buildAttr;
  UI.buildAttr = function () {
    ba.call(this);
    const cur = wcatOf(G.player.wdef), c = cls();
    let h = `<div class="prof12"><h3>Độ thạo vũ khí <small>${c ? H(clsName(c)) : 'chưa có chức nghiệp'} • nhanh nhẹn +0.3% trúng mỗi điểm</small></h3><div class="pg">`;
    for (const k of WCAT) {
      const [, d] = G.prof(k), hc = Math.round(G.hitChance(k) * 100);
      h += `<div class="${k === cur ? 'cur' : ''} ${hc < 80 || d < 0.8 ? 'bad' : hc >= 100 || d > 1.04 ? 'good' : ''}"><b>${H(WCAT_NAME[k])}</b><span>Trúng ${hc}%</span><span>Sát thương ${Math.round(d * 100)}%</span></div>`;
    }
    h += '</div><p class="muted">Đánh trượt thì không gây sát thương (đạn bay tiếp). Boss né nhiều hơn một chút.</p></div>';
    const card = $('invBody').querySelector('.clscard');
    if (card) card.insertAdjacentHTML('afterend', h); else $('invBody').insertAdjacentHTML('afterbegin', h);
  };
})();
