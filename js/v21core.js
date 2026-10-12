// ===== v21 core: the System window (tab registry), System notices, System Points, a tiny event bus =====
// Every v21 module builds on this file. Contract:
//   R21({md, tt, sl})          -> the entry for the current world (falls back to sl)
//   SYS.addTab({id, icon, name, order, render(body), badge()})   register a tab of the System window
//   SYS.open(id?) / SYS.close() / SYS.isOpen() / SYS.refresh()
//   SYS.msg(text, kind)        System notice popup; kind: 'info' | 'quest' | 'warn' | 'reward'
//   G.sys()                    persistent System state (lives in G.v10.sys, saved with the game)
//   G.spAdd(n, why) / G.spPay(n) -> bool     System Points (Điểm Hệ Thống)
//   Bus21.on(evt, fn) / Bus21.emit(evt, ...args)   cross-module events (see v21 plan for the event list)
const R21 = t => (t[rk(RL.id)] !== undefined ? t[rk(RL.id)] : t.sl);
const SYS_TITLE = { md: 'HỆ THỐNG SINH TỒN', tt: 'THIÊN ĐẠO HỆ THỐNG', sl: 'HỆ THỐNG' };
const SYS_TAG = { md: '[HỆ THỐNG]', tt: '[THIÊN ĐẠO]', sl: '[HỆ THỐNG]' };
const SP_NAME = { md: 'Điểm Sinh Tồn', tt: 'Điểm Thiên Đạo', sl: 'Điểm Hệ Thống' };
const spName = () => R21(SP_NAME);
// the gate word per world: "Cổng hạng E" (sl), "Ổ dịch hạng E" (md), "Bí cảnh hạng E" (tt)
const GATE_NAME = { md: 'Ổ dịch', tt: 'Bí cảnh', sl: 'Cổng' };
const gateName = () => R21(GATE_NAME);
const today21 = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const esc21 = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const Bus21 = {
  h: {},
  on(e, f) { (this.h[e] = this.h[e] || []).push(f); },
  emit(e, ...a) { for (const f of this.h[e] || []) { try { f(...a); } catch (err) { console.error('[v21 bus] ' + e, err); } } },
};

Object.assign(G, {
  sys() { const v = this.v10; if (!v) return { sp: 0 }; return v.sys || (v.sys = { sp: 0 }); },
  spAdd(n, why) {
    n = Math.round(n); if (!n) return;
    const s = this.sys(); s.sp = (s.sp || 0) + n;
    if (why !== false) SYS.msg(`+${n} ${spName()}${why ? ' — ' + why : ''}`, 'reward');
    SYS.refresh();
  },
  spPay(n) { const s = this.sys(); if ((s.sp || 0) < n) return false; s.sp -= n; SYS.refresh(); return true; },
});

const SYS = {
  tabs: [], cur: null, built: false,
  addTab(def) {
    this.tabs = this.tabs.filter(t => t.id !== def.id);
    this.tabs.push(Object.assign({ order: 50, icon: '◆' }, def));
    this.tabs.sort((a, b) => a.order - b.order);
    if (this.isOpen()) this.render();
  },
  build() {
    if (this.built) return; this.built = true;
    const st = document.createElement('style'); st.id = 'v21core-css';
    st.textContent = `
#s21 .s21p{position:relative;width:min(1000px,96vw);max-height:94vh;display:flex;flex-direction:column;background:linear-gradient(180deg,rgba(8,18,40,.97),rgba(4,10,24,.97));border:2px solid #4fc3ff;box-shadow:0 0 0 2px #000,0 0 26px rgba(79,195,255,.45),inset 0 0 30px rgba(79,195,255,.12);color:#dff4ff;font-size:20px}
#s21 .s21h{display:flex;align-items:center;gap:14px;padding:10px 18px 6px;border-bottom:1px solid rgba(79,195,255,.35)}
#s21 .s21h h2{margin:0;font-size:34px;letter-spacing:4px;color:#7fd8ff;text-shadow:0 0 10px rgba(79,195,255,.8)}
#s21 .s21h .s21cur{margin-left:auto;font-size:19px;color:#bfe9ff;white-space:nowrap}
#s21 .s21h .s21cur b{color:#ffe27a}
#s21 .s21x{position:static;margin-left:8px;min-width:0;width:auto;padding:2px 12px;font-size:22px;line-height:1}
#s21 .s21t{display:flex;gap:6px;padding:8px 14px;overflow-x:auto;border-bottom:1px solid rgba(79,195,255,.2);flex-shrink:0}
#s21 .s21t button{flex:0 0 auto;min-width:0;width:auto;letter-spacing:1px;white-space:nowrap;font-size:19px;padding:6px 12px;background:rgba(79,195,255,.08);border:1px solid rgba(79,195,255,.35);color:#bfe9ff;position:relative}
#s21 .s21t button.on{background:rgba(79,195,255,.28);color:#fff;border-color:#7fd8ff;box-shadow:0 0 8px rgba(79,195,255,.6)}
#s21 .s21t button i.dot{position:absolute;top:-4px;right:-4px;min-width:14px;height:14px;border-radius:7px;background:#ff4a4a;font-style:normal;font-size:11px;line-height:14px;padding:0 3px;color:#fff}
#s21 .s21b{padding:12px 18px 16px;overflow:auto;flex:1;min-height:120px}
#s21 .s21b h3{color:#7fd8ff;font-size:24px;margin:10px 0 6px}
#s21 .s21b .s21row{display:flex;align-items:center;gap:10px;padding:6px 8px;border-bottom:1px solid rgba(79,195,255,.12)}
#s21 .s21b .s21row > .grow{flex:1;min-width:0}
#s21 .s21b button{font-size:18px;padding:4px 10px;min-width:0;width:auto;letter-spacing:1px}
#s21 .s21b .muted{color:#8fb3c9}
#s21msg{position:fixed;top:56px;left:50%;transform:translateX(-50%);z-index:40;display:flex;flex-direction:column;gap:6px;pointer-events:none;width:min(560px,80vw)}
#s21msg .m{background:rgba(6,16,36,.94);border:1px solid #4fc3ff;box-shadow:0 0 14px rgba(79,195,255,.5);color:#e6f7ff;padding:6px 12px;font-size:19px;line-height:1.15;animation:s21in .25s ease-out both}
#s21msg .m b{color:#7fd8ff;margin-right:6px;letter-spacing:1px}
#s21msg .m.quest{border-color:#ffd24a;box-shadow:0 0 14px rgba(255,210,74,.45)} #s21msg .m.quest b{color:#ffd24a}
#s21msg .m.warn{border-color:#ff5a5a;box-shadow:0 0 14px rgba(255,90,90,.5)} #s21msg .m.warn b{color:#ff7a7a}
#s21msg .m.reward{border-color:#6dff9a;box-shadow:0 0 14px rgba(109,255,154,.45)} #s21msg .m.reward b{color:#6dff9a}
#s21msg .m.out{opacity:0;transition:opacity .4s}
@keyframes s21in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
@media (max-height:500px){#s21 .s21p{font-size:16px;max-height:98vh}#s21 .s21h{padding:4px 10px}#s21 .s21h h2{font-size:24px}#s21 .s21t{padding:4px 8px}#s21 .s21t button{font-size:15px;padding:3px 8px}#s21 .s21b{padding:6px 10px}#s21 .s21b h3{font-size:19px}#s21 .s21b button{font-size:15px;padding:3px 7px}#s21msg{top:40px}#s21msg .m{font-size:15px;padding:4px 9px}}`;
    document.head.appendChild(st);
    const sc = document.createElement('div'); sc.id = 's21'; sc.className = 'screen hidden';
    sc.innerHTML = '<div class="s21p"><div class="s21h"><h2></h2><div class="s21cur"></div><button class="s21x" aria-label="Đóng">✕</button></div><div class="s21t"></div><div class="s21b"></div></div>';
    document.body.appendChild(sc);
    sc.querySelector('.s21x').onclick = () => this.close();
    sc.addEventListener('pointerdown', e => { if (e.target === sc) this.close(); });
    const m = document.createElement('div'); m.id = 's21msg'; document.body.appendChild(m);
  },
  open(id) {
    if (!['playing', 'paused', 'menu'].includes(G.state) || !G.player || G.player.dead) return;
    this.build();
    G.state = 'menu';
    if (id) this.cur = id;
    if (!this.tabs.some(t => t.id === this.cur)) this.cur = this.tabs.length ? this.tabs[0].id : null;
    this.render(); UI.showScreen('s21');
    Sound.play('sfx_click', 0.35, 1.4);
  },
  close() { if (this.isOpen()) UI.closePanel(); },
  isOpen() { return UI.screen === 's21'; },
  refresh() { if (this.isOpen()) this.render(); },
  render() {
    const sc = document.getElementById('s21'); if (!sc) return;
    const P = G.player;
    sc.querySelector('h2').textContent = R21(SYS_TITLE);
    sc.querySelector('.s21cur').innerHTML = `${esc21(spName())}: <b>${G.sys().sp || 0}</b> &nbsp; ${esc21(cur().name)}: <b>${P ? P.gold || 0 : 0}</b>`;
    const strip = sc.querySelector('.s21t'); strip.innerHTML = '';
    for (const t of this.tabs) {
      const b = document.createElement('button'); b.className = t.id === this.cur ? 'on' : '';
      let badge = null; try { badge = t.badge ? t.badge() : null; } catch (e) { badge = null; }
      b.innerHTML = `${t.icon} ${esc21(typeof t.name === 'function' ? t.name() : t.name)}${badge ? `<i class="dot">${badge === true ? '!' : esc21(badge)}</i>` : ''}`;
      b.onclick = () => { this.cur = t.id; this.render(); };
      strip.appendChild(b);
    }
    const body = sc.querySelector('.s21b'), tab = this.tabs.find(t => t.id === this.cur);
    const keep = body.dataset.tab === this.cur ? body.scrollTop : 0;
    body.innerHTML = ''; body.dataset.tab = this.cur || '';
    if (tab) { try { tab.render(body); } catch (e) { console.error('[v21 SYS tab ' + tab.id + ']', e); body.innerHTML = '<p class="muted">Lỗi hiển thị mục này.</p>'; } }
    body.scrollTop = keep;
  },
  msg(text, kind) {
    this.build();
    const box = document.getElementById('s21msg'); if (!box) return;
    const d = document.createElement('div'); d.className = 'm ' + (kind || 'info');
    d.innerHTML = `<b>${esc21(R21(SYS_TAG))}</b>${esc21(text)}`;
    box.appendChild(d);
    while (box.children.length > 3) box.removeChild(box.firstChild);
    const life = 3800 + Math.min(4000, String(text).length * 35);
    setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 450); }, life);
    if (kind === 'warn') Sound.play('sfx_hurt', 0.25, 0.7); else Sound.play('sfx_achievement', 0.3, 1.5);
  },
};

// [N] opens the System everywhere (it used to open the base screen, which is now one tab of the System)
window.addEventListener('keydown', e => {
  if (e.code !== 'KeyN' || e.repeat || (e.target && /INPUT|TEXTAREA/.test(e.target.tagName))) return;
  if (G.state === 'playing') { SYS.open(); e.stopImmediatePropagation(); }
  else if (G.state === 'menu' && SYS.isOpen()) { SYS.close(); e.stopImmediatePropagation(); }
}, true);
