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
#s21{background:radial-gradient(ellipse at center,rgba(6,22,48,.18),rgba(0,3,10,.6))}
#s21 .s21p{position:relative;overflow:hidden;display:grid;grid-template-columns:186px minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);width:min(1000px,92vw);height:min(700px,92vh);color:#dff4ff;font-size:20px;letter-spacing:.3px;border:1px solid rgba(127,216,255,.75);background:linear-gradient(#7fd8ff,#7fd8ff) left top/22px 2px no-repeat,linear-gradient(#7fd8ff,#7fd8ff) left top/2px 22px no-repeat,linear-gradient(#7fd8ff,#7fd8ff) right top/22px 2px no-repeat,linear-gradient(#7fd8ff,#7fd8ff) right top/2px 22px no-repeat,linear-gradient(#7fd8ff,#7fd8ff) left bottom/22px 2px no-repeat,linear-gradient(#7fd8ff,#7fd8ff) left bottom/2px 22px no-repeat,linear-gradient(#7fd8ff,#7fd8ff) right bottom/22px 2px no-repeat,linear-gradient(#7fd8ff,#7fd8ff) right bottom/2px 22px no-repeat,linear-gradient(90deg,rgba(79,195,255,.07) 1px,transparent 1px) 0 0/32px 32px,linear-gradient(rgba(79,195,255,.07) 1px,transparent 1px) 0 0/32px 32px,repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 3px),linear-gradient(180deg,rgba(9,24,50,.94),rgba(3,9,22,.96));box-shadow:0 0 0 1px #000,0 0 26px rgba(79,195,255,.45),inset 0 0 40px rgba(79,195,255,.12);animation:s21mat .2s cubic-bezier(.2,.85,.25,1) both}
#s21 .s21p::after{content:'';position:absolute;inset:0;z-index:3;pointer-events:none;background:linear-gradient(transparent,rgba(127,216,255,.22),transparent) 0 -70px/100% 70px no-repeat;animation:s21scan .5s ease-out both}
@keyframes s21mat{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}
@keyframes s21scan{from{background-position:0 -70px}to{background-position:0 100%}}
#s21 .s21h{grid-column:1/-1;grid-row:1;display:flex;align-items:center;gap:12px;padding:10px 16px 8px 14px;border-bottom:1px solid rgba(79,195,255,.45);box-shadow:0 8px 14px -12px rgba(79,195,255,.9)}
#s21 .s21em{flex:0 0 auto;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-style:normal;border:2px solid #7fd8ff;background:rgba(79,195,255,.14);box-shadow:0 0 10px rgba(127,216,255,.8),inset 0 0 6px rgba(127,216,255,.5);transform:rotate(45deg)}
#s21 .s21em span{transform:rotate(-45deg);color:#fff;font-size:20px;line-height:1;text-shadow:0 0 6px #7fd8ff}
#s21 .s21h h2{position:relative;margin:0;padding:2px 26px 1px 16px;font-size:32px;line-height:1.1;font-weight:normal;letter-spacing:4px;white-space:nowrap;color:#eafaff;text-shadow:0 0 10px rgba(79,195,255,.9);background:linear-gradient(90deg,rgba(79,195,255,.42),rgba(79,195,255,.1) 80%,rgba(79,195,255,0));clip-path:polygon(0 0,100% 0,calc(100% - 16px) 100%,0 100%)}
#s21 .s21h h2::before{content:'[ ';color:#4fc3ff}
#s21 .s21h h2::after{content:' ]';color:#4fc3ff}
#s21 .s21cur{margin-left:auto;display:flex;align-items:center;gap:8px;white-space:nowrap;font-size:19px;color:#bfe9ff}
#s21 .s21chip{display:inline-flex;align-items:center;gap:6px;padding:1px 10px 1px 8px;line-height:1.15;border:1px solid rgba(79,195,255,.45);background:linear-gradient(90deg,rgba(79,195,255,.18),rgba(79,195,255,.04))}
#s21 .s21chip i{font-style:normal;font-size:15px;color:#7fd8ff}
#s21 .s21chip b{font-weight:normal;color:#fff;text-shadow:0 0 6px #7fd8ff}
#s21 .s21chip.gold{border-color:rgba(255,210,74,.55);background:linear-gradient(90deg,rgba(255,210,74,.18),rgba(255,210,74,.04))}
#s21 .s21chip.gold i{color:#ffd24a}
#s21 .s21chip.gold b{color:#ffe27a;text-shadow:0 0 6px #ffc83a}
#s21 .s21x{position:static;margin:0;min-width:0;width:34px;height:34px;padding:0;flex:0 0 auto;display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1;color:#bfe9ff;background:rgba(79,195,255,.1);border:1px solid #4fc3ff;box-shadow:0 0 8px rgba(79,195,255,.5),inset 0 0 8px rgba(79,195,255,.2);text-shadow:none;transform:none}
#s21 .s21x:hover:not(:disabled){color:#fff;background:rgba(79,195,255,.28);border-color:#bfefff;box-shadow:0 0 14px #7fd8ff,inset 0 0 10px rgba(127,216,255,.45);transform:none}
#s21 .s21t{grid-column:1;grid-row:2;display:flex;flex-direction:column;align-items:stretch;gap:4px;padding:10px 0;min-height:0;overflow-y:auto;overflow-x:hidden;border-right:1px solid rgba(79,195,255,.3);scrollbar-width:none;-ms-overflow-style:none}
#s21 .s21t::-webkit-scrollbar{display:none}
#s21 .s21t button{position:relative;display:flex;align-items:center;gap:10px;width:100%;min-width:0;margin:0;padding:5px 12px 5px 14px;font-size:19px;letter-spacing:.3px;line-height:1.1;text-align:left;white-space:nowrap;color:#8fb3c9;background:linear-gradient(90deg,rgba(79,195,255,.05),rgba(79,195,255,0));border:0;box-shadow:none;text-shadow:none;transform:none}
#s21 .s21t button:hover:not(:disabled){color:#eaf9ff;background:linear-gradient(90deg,rgba(79,195,255,.2),rgba(79,195,255,.03));transform:none}
#s21 .s21t button::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:transparent}
#s21 .s21t button.on{color:#fff;background:linear-gradient(90deg,rgba(79,195,255,.38),rgba(79,195,255,.04));text-shadow:0 0 8px #7fd8ff}
#s21 .s21t button.on::before{background:#7fd8ff;box-shadow:0 0 10px #7fd8ff,0 0 3px #fff}
#s21 .ti{flex:0 0 30px;width:30px;height:30px;display:grid;place-items:center;font-size:18px;line-height:1;border:1px solid rgba(79,195,255,.35);background:rgba(3,10,24,.7)}
#s21 .s21t button.on .ti{border-color:#7fd8ff;box-shadow:0 0 8px rgba(127,216,255,.7),inset 0 0 6px rgba(127,216,255,.4)}
#s21 .tl{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis}
#s21 .s21t button i.dot{position:absolute;top:50%;right:8px;margin-top:-8px;min-width:16px;height:16px;padding:0 2px;background:#ff3b3b;color:#fff;font-style:normal;font-size:12px;line-height:16px;text-align:center;text-shadow:none;clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}
#s21 .s21b{grid-column:2;grid-row:2;min-width:0;min-height:0;padding:4px 18px 16px;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:rgba(127,216,255,.6) rgba(79,195,255,.06)}
#s21 .s21b::-webkit-scrollbar{width:6px}
#s21 .s21b::-webkit-scrollbar-track{background:rgba(79,195,255,.05)}
#s21 .s21b::-webkit-scrollbar-thumb{background:linear-gradient(#a8ecff,#2a8ad8);box-shadow:0 0 6px #4fc3ff}
#s21 .s21b p{margin:6px 0;line-height:1.2}
#s21 .s21b h3{position:relative;margin:16px 0 8px;padding:0 0 5px 20px;font-size:24px;font-weight:normal;line-height:1.1;letter-spacing:1px;color:#7fd8ff;text-shadow:0 0 8px rgba(79,195,255,.7);border-bottom:1px solid rgba(79,195,255,.5);box-shadow:0 8px 10px -10px rgba(79,195,255,.95)}
#s21 .s21b h3:first-child{margin-top:4px}
#s21 .s21b h3::before{content:'◆';position:absolute;left:1px;top:0;font-size:14px;color:#4fc3ff;text-shadow:0 0 8px #4fc3ff}
#s21 .s21b h3 .muted{font-size:.7em;letter-spacing:0;color:#8fb3c9;text-shadow:none}
#s21 .s21b .s21row{display:flex;align-items:center;gap:12px;margin:0 0 6px;padding:7px 12px;background:linear-gradient(90deg,rgba(79,195,255,.11),rgba(79,195,255,.025) 70%,rgba(79,195,255,.01));border:1px solid rgba(79,195,255,.22);box-shadow:inset 3px 0 0 rgba(79,195,255,.6)}
#s21 .s21b .s21row:hover{border-color:rgba(127,216,255,.5)}
#s21 .s21b .s21row > :not(.grow){flex:0 0 auto}
#s21 .s21b .s21row > .grow{flex:1 1 auto;min-width:0}
#s21 .s21b .s21row > span:last-child:not(.muted){color:#fff;white-space:nowrap;text-shadow:0 0 6px rgba(127,216,255,.6)}
#s21 .s21b button{position:relative;isolation:isolate;--c:9px;min-width:0;width:auto;margin:0;padding:6px 16px;white-space:nowrap;font-size:19px;letter-spacing:2px;line-height:1.1;color:#f0fbff;text-shadow:0 0 6px rgba(127,216,255,.9);background:#7fd8ff;border:0;box-shadow:none;transform:none;clip-path:polygon(var(--c) 0,calc(100% - var(--c)) 0,100% var(--c),100% calc(100% - var(--c)),calc(100% - var(--c)) 100%,var(--c) 100%,0 calc(100% - var(--c)),0 var(--c))}
#s21 .s21b button::after{content:'';position:absolute;inset:1px;z-index:-1;background:linear-gradient(180deg,#2c8fd4,#11406f);clip-path:polygon(calc(var(--c) - 1px) 0,calc(100% - var(--c) + 1px) 0,100% calc(var(--c) - 1px),100% calc(100% - var(--c) + 1px),calc(100% - var(--c) + 1px) 100%,calc(var(--c) - 1px) 100%,0 calc(100% - var(--c) + 1px),0 calc(var(--c) - 1px))}
#s21 .s21b button:hover:not(:disabled){background:#eaffff;transform:none;color:#fff}
#s21 .s21b button:hover:not(:disabled)::after{background:linear-gradient(180deg,#3aa6ee,#1a5e9c);box-shadow:inset 0 0 14px rgba(127,216,255,.85)}
#s21 .s21b button:active:not(:disabled){transform:translateY(1px)}
#s21 .s21b button:active:not(:disabled)::after{background:linear-gradient(180deg,#0f3a66,#1d6aa8)}
#s21 .s21b button.on::after{background:linear-gradient(180deg,#3aa6ee,#1a5e9c);box-shadow:inset 0 0 12px rgba(127,216,255,.6)}
#s21 .s21b button.ghost{background:#4f7088}
#s21 .s21b button.ghost::after{background:linear-gradient(180deg,#1b2a38,#0c141c)}
#s21 .s21b button.warn{background:#ff7a7a}
#s21 .s21b button.warn::after{background:linear-gradient(180deg,#6a1818,#2e0a0a)}
#s21 .s21b button:disabled{opacity:.5;cursor:not-allowed;background:#4d6a7e;text-shadow:none}
#s21 .s21b button:disabled::after{background:linear-gradient(180deg,#1b2a38,#0c141c)}
#s21 .sys21-bar{flex:0 0 150px;height:12px;padding:1px;background:#020a14;border:1px solid rgba(79,195,255,.55);box-shadow:inset 0 0 6px #000,0 0 6px rgba(79,195,255,.2)}
#s21 .sys21-bar i{display:block;height:100%;background:repeating-linear-gradient(90deg,transparent 0 7px,#020a14 7px 9px),linear-gradient(90deg,#1b6fb0,#7fd8ff);box-shadow:0 0 8px rgba(127,216,255,.85)}
#s21 .q21-bar{height:8px;margin-top:5px;padding:1px;background:#020a14;border:1px solid rgba(79,195,255,.4);border-radius:0;overflow:hidden}
#s21 .q21-bar i{background:repeating-linear-gradient(90deg,transparent 0 7px,#020a14 7px 9px),linear-gradient(90deg,#5ab8e8,#7fd8ff 70%,#6dff9a);box-shadow:0 0 8px rgba(127,216,255,.7)}
#s21 .q21-win{border-radius:0;box-shadow:inset 0 0 16px rgba(120,90,255,.12),inset 3px 0 0 rgba(160,130,255,.7)}
#s21 .q21-pen{box-shadow:inset 0 0 16px rgba(255,60,60,.14),inset 3px 0 0 rgba(255,90,90,.8)}
#s21 .a21card{box-shadow:inset 3px 0 0 var(--tc,#4fc3ff)}
#s21 .sys21-card{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin:8px 0 12px}
#s21 .sys21-day{padding:7px 9px;min-height:64px;background:linear-gradient(180deg,rgba(79,195,255,.13),rgba(79,195,255,.03));border:1px solid rgba(79,195,255,.32)}
#s21 .sys21-day.ok{opacity:.55;border-color:rgba(109,255,154,.6)}
#s21 .sys21-day.now{border-color:#ffd24a;box-shadow:inset 0 0 14px rgba(255,210,74,.22),0 0 10px rgba(255,210,74,.5)}
#s21 .sys21-big{margin-top:10px;gap:10px}
#s21 .sys21-big button{display:block;padding:12px 14px 10px;text-align:left;font-size:20px;white-space:normal;letter-spacing:1px}
#s21 .sys21-big small{display:block;color:#d6f1ff;font-size:.72em;letter-spacing:0;line-height:1.15;opacity:.85}
#s21 .sys21-warn{color:#ff9a9a}
@media (max-width:639px),(max-height:500px){
#s21 .s21p{grid-template-columns:minmax(0,1fr);grid-template-rows:auto auto minmax(0,1fr);width:min(96vw,1000px);height:92vh;font-size:17px}
#s21 .s21h{gap:8px;padding:4px 10px 4px 10px}
#s21 .s21em{width:19px;height:19px;border-width:1px}
#s21 .s21em span{font-size:14px}
#s21 .s21h h2{font-size:24px;letter-spacing:2px;padding:0 14px 0 10px;clip-path:polygon(0 0,100% 0,calc(100% - 10px) 100%,0 100%)}
#s21 .s21cur{gap:5px;font-size:15px}
#s21 .s21chip{gap:4px;padding:0 6px}
#s21 .s21chip i{font-size:11px}
#s21 .s21x{width:28px;height:28px;font-size:14px}
#s21 .s21t{grid-column:1;grid-row:2;flex-direction:row;align-items:stretch;gap:2px;padding:3px 6px;border-right:0;border-bottom:1px solid rgba(79,195,255,.3);overflow-x:auto;overflow-y:hidden;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}
#s21 .s21t button{flex:0 0 auto;width:auto;min-width:60px;flex-direction:column;justify-content:center;gap:1px;padding:3px 5px 4px;font-size:14px;letter-spacing:0;text-align:center;scroll-snap-align:start;background:none}
#s21 .s21t button:hover:not(:disabled){background:rgba(79,195,255,.12)}
#s21 .s21t button.on{background:linear-gradient(180deg,rgba(79,195,255,.34),rgba(79,195,255,.04))}
#s21 .s21t button::before{top:auto;left:12%;right:12%;bottom:-1px;width:auto;height:2px}
#s21 .s21t button.on::before{background:#7fd8ff;box-shadow:0 0 8px #7fd8ff}
#s21 .ti{flex-basis:24px;width:24px;height:24px;font-size:15px}
#s21 .tl{max-width:66px;font-size:14px;white-space:nowrap}
#s21 .s21t button i.dot{top:1px;right:3px;margin-top:0;min-width:14px;height:14px;font-size:10px;line-height:14px}
#s21 .s21b{grid-column:1;grid-row:3;padding:4px 10px 10px}
#s21 .s21b h3{font-size:19px;margin:10px 0 5px;padding-left:18px}
#s21 .s21b h3::before{font-size:12px}
#s21 .s21b .s21row{padding:4px 8px;gap:8px;margin-bottom:4px}
#s21 .s21b button{font-size:16px;padding:4px 12px;letter-spacing:1px}
#s21 .sys21-bar{flex-basis:90px;height:10px}
#s21 .sys21-big button{padding:6px 10px 5px;font-size:16px}
#s21 .sys21-big small{font-size:.9em}
#s21 .sys21-card{grid-template-columns:repeat(auto-fill,minmax(110px,1fr))}
}
@media (prefers-reduced-motion:reduce){#s21 .s21p,#s21 .s21p::after{animation:none}}
#s21msg{position:fixed;top:56px;left:50%;transform:translateX(-50%);z-index:40;display:flex;flex-direction:column;gap:6px;pointer-events:none;width:min(560px,80vw)}
#s21msg .m{background:linear-gradient(90deg,rgba(9,26,56,.96),rgba(4,12,28,.9));border:0;border-left:3px solid #7fd8ff;box-shadow:0 0 14px rgba(79,195,255,.45),inset 0 0 12px rgba(79,195,255,.08);color:#e6f7ff;padding:6px 12px 6px 10px;font-size:19px;line-height:1.15;animation:s21in .25s ease-out both}
#s21msg .m b{display:inline-block;margin-right:8px;padding:0 6px;letter-spacing:1px;color:#02101f;background:#7fd8ff;clip-path:polygon(5px 0,100% 0,calc(100% - 5px) 100%,0 100%)}
#s21msg .m.quest{border-left-color:#ffd24a;box-shadow:0 0 14px rgba(255,210,74,.4),inset 0 0 12px rgba(255,210,74,.07)} #s21msg .m.quest b{background:#ffd24a}
#s21msg .m.warn{border-left-color:#ff5a5a;box-shadow:0 0 14px rgba(255,90,90,.45),inset 0 0 12px rgba(255,90,90,.07)} #s21msg .m.warn b{background:#ff6a6a;color:#fff}
#s21msg .m.reward{border-left-color:#6dff9a;box-shadow:0 0 14px rgba(109,255,154,.4),inset 0 0 12px rgba(109,255,154,.07)} #s21msg .m.reward b{background:#6dff9a}
#s21msg .m.out{opacity:0;transition:opacity .4s}
@keyframes s21in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
`;
    document.head.appendChild(st);
    const sc = document.createElement('div'); sc.id = 's21'; sc.className = 'screen hidden';
    sc.innerHTML = '<div class="s21p"><div class="s21h"><i class="s21em"><span>!</span></i><h2></h2><div class="s21cur"></div><button class="s21x" aria-label="Đóng">✕</button></div><div class="s21t"></div><div class="s21b"></div></div>';
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
    sc.querySelector('.s21cur').innerHTML = `<span class="s21chip"><i>◈</i>${esc21(spName())}<b>${G.sys().sp || 0}</b></span><span class="s21chip gold"><i>◉</i>${esc21(cur().name)}<b>${P ? P.gold || 0 : 0}</b></span>`;
    const strip = sc.querySelector('.s21t'); strip.innerHTML = '';
    for (const t of this.tabs) {
      const b = document.createElement('button'); b.className = t.id === this.cur ? 'on' : '';
      let badge = null; try { badge = t.badge ? t.badge() : null; } catch (e) { badge = null; }
      b.innerHTML = `<span class="ti">${t.icon}</span><span class="tl">${esc21(typeof t.name === 'function' ? t.name() : t.name)}</span>${badge ? `<i class="dot">${badge === true ? '!' : esc21(badge)}</i>` : ''}`;
      b.title = typeof t.name === 'function' ? t.name() : t.name;
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
