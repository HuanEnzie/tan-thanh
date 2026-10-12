// ===== v21quest: System quests — daily quest + Penalty Zone, emergency quests, hidden quests with titles, HUD tracker =====
// State lives in G.v10.q (saved). Dungeon-session flags (heal used / shadows summoned) stay in memory only.
// Hooks: G.v5Tick (per frame), G.killEnemy, G.exitDungeon, G.lootProp, G.castMana / G.castSkill / G.startCut,
// G.teleport, G.useScroll, G.hitEnemy, G.hurtPlayer, G.die, G.summonShadow, useHeal (global, play.js), Items.drop.
// Bus21: listens 'search' and 'summon'; emits 'penalty' (true/false).
(function () {
  const PEN_T = 180, PEN_EVERY = 20, PEN_WAIT = 60;          // Penalty Zone: seconds, spawn wave every N s, grace in overworld
  const DAILY_TITLE = { md: 'NHIỆM VỤ SINH TỒN', tt: 'NHIỆM VỤ TU LUYỆN', sl: 'NHIỆM VỤ HẰNG NGÀY' };
  const DAILY_SUB = { md: 'Huấn luyện sinh tồn', tt: 'Tu luyện hằng ngày', sl: 'Chuẩn bị để trở nên mạnh mẽ' };
  const PEN_NAME = { md: 'Vùng Phạt', tt: 'Vùng Thiên Phạt', sl: 'Vùng Phạt' };
  const PEN_HEAD = { md: 'Hình phạt', tt: 'Thiên phạt', sl: 'Hình phạt' };
  const WARN_TXT = 'Nếu không hoàn thành sẽ chịu hình phạt';
  const DAILY_GOAL = { move: 600, gate: 1, loot: 10, skill: 12, dash: 20 };   // one in-game day = 8 min of play
  const DAILY_POOL = ['gate', 'loot', 'skill', 'dash'];
  const MOVE_PX = 32;                                          // 32 px = 1 m
  const EM_T = { kill15: 90, elite: 120, gate: 600 };          // emergency time limits (s)
  const HID_ORDER = ['hunter', 'survivor', 'nomed', 'solo', 'treasure'];
  const HID = {
    hunter: { name: 'Kẻ săn đơn loài', desc: 'Hạ 100 con cùng một loài', goal: 100, pts: 15, title: 'Kẻ săn đơn loài', eff: '+5% sát thương lên loài đã săn' },
    survivor: { name: 'Kẻ sống sót đêm trăng máu', desc: 'Trụ qua trọn một đêm Huyết nguyệt mà không chết', goal: 1, pts: 10, title: 'Kẻ sống sót', eff: '−5% sát thương nhận' },
    nomed: { name: 'Không cần thuốc', desc: () => 'Đóng ' + gate() + ' hạng C trở lên mà không dùng vật phẩm hồi máu trong hầm', goal: 1, pts: 12, title: 'Không cần thuốc', eff: '+10% hồi máu từ vật phẩm' },
    solo: { name: 'Kẻ độc hành', desc: () => 'Đóng 1 ' + gate() + ' mà không gọi bóng nào trong hầm', goal: 1, pts: 12, title: 'Kẻ độc hành', eff: '+8% sát thương khi không có bóng ra trận' },
    treasure: { name: 'Thợ săn kho báu', desc: 'Mở 20 rương', goal: 20, pts: 8, title: 'Thợ săn kho báu', eff: '+10% tiền từ rương' },
  };
  // kills that count as the player's own hand (shadow, DoT and remote hits do not)
  const PLAYER_KILL = { melee: 1, gun: 1, skill: 1, car: 1, shock: 1 };
  const SKILL_SUB = { 'KỸ NĂNG': 1, 'TUYỆT KỸ': 1, 'TRỖI DẬY': 1 };  // startCut subtitles of mana/ultimate skills
  const CSS = `
/* left column under the day bar: story box, daily chip, tutorial card (v22surv) */
#qcol{display:flex;flex-direction:column;gap:6px;width:236px;max-width:46vw;margin-top:8px}
#qcol #objective{position:relative;margin-top:0;padding:4px 30px 5px 8px;border-left:3px solid var(--gold);font-size:20px;line-height:1.05}
#qcol #objective b{font-size:16px;letter-spacing:1px}
#qcol #objText{display:block}
#qcolBtn{position:absolute;top:3px;right:3px;pointer-events:auto;min-width:0;width:24px;height:20px;padding:0;line-height:16px;font:16px var(--font);background:rgba(0,0,0,.4);border:1px solid rgba(255,207,58,.55);color:var(--gold);text-shadow:none;cursor:pointer}
#q21hud{display:block;background:var(--panel);border:1px solid rgba(79,195,255,.45);border-left:3px solid #7fd8ff;padding:3px 8px 4px;color:var(--text);font-size:18px;line-height:1.05;text-align:left;cursor:pointer;pointer-events:auto;user-select:none}
#q21hud .q21h-top{display:flex;align-items:baseline;gap:6px;white-space:nowrap}
#q21hud .q21h-top b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;color:#7fd8ff;font-size:16px;font-weight:normal;letter-spacing:1px}
#q21hud .q21h-n{color:var(--text)}
#q21hud .q21h-bar{height:5px;margin:3px 0 1px;background:rgba(255,255,255,.14);overflow:hidden}
#q21hud .q21h-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#7fd8ff,#6dff9a)}
#q21hud .q21h-st{color:var(--gold);font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#q21hud .q21h-st:empty{display:none}
#q21hud .q21h-st.pen{color:#ff8a8a;font-weight:bold}
#qcol.q-collapsed>:not(#objective){display:none!important}
#qcol.q-collapsed #objText{display:none!important}
#mmlabel{width:190px;text-align:center;font-size:15px;line-height:1.1;color:var(--muted);background:var(--panel);border:1px solid rgba(255,207,58,.25);padding:3px 6px;margin-top:6px;transition:opacity .4s}
#mmlabel.q-hint-off{display:none}
body:not(.touch) #topright{top:72px;width:190px}
body.touch #qcol{width:200px;gap:4px}
body.touch #qcol #objective{padding:3px 22px 3px 6px;font-size:15px;max-width:none;white-space:normal;overflow:visible;text-overflow:clip}
body.touch #qcol #objective b{font-size:12px}
body.touch #qcol #objText{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
body.touch #qcolBtn{width:20px;height:18px;min-width:0;font-size:13px;line-height:13px}
body.touch #q21hud{padding:2px 5px 3px;font-size:14px}
body.touch #q21hud .q21h-top b{font-size:12px}
body.touch #q21hud .q21h-st{font-size:13px}
body.touch #bossbar{width:min(380px,46vw)}
body:has(#bossbar:not(.hidden)) #s21msg{top:72px}
body.touch:has(#bossbar:not(.hidden)) #s21msg{top:90px}
body.touch #bars{top:auto;bottom:calc(8px + env(safe-area-inset-bottom, 0px))}
body.touch #feed{top:auto;bottom:112px}
body.touch #feed .toast:nth-child(n+3){display:none}
#s21msg{width:min(520px,80vw)}
body.touch #s21msg{left:220px;right:112px;width:auto;transform:none}
body.touch #s21msg{gap:4px}body.touch #s21msg .m{font-size:14px;padding:3px 8px;line-height:1.1}body.touch #s21msg .m:nth-last-child(n+3){display:none}
#q21pen{position:fixed;inset:0;pointer-events:none;z-index:35;display:none;animation:q21p 1.4s ease-in-out infinite}
@keyframes q21p{0%,100%{box-shadow:inset 0 0 60px 16px rgba(255,40,40,.35)}50%{box-shadow:inset 0 0 96px 34px rgba(255,40,40,.7)}}
#q21pent{position:fixed;left:50%;bottom:10px;transform:translateX(-50%);z-index:36;display:none;pointer-events:none;background:rgba(40,0,0,.82);border:1px solid #ff5a5a;color:#ffd0d0;padding:3px 12px;font:bold 15px system-ui,sans-serif;border-radius:4px;letter-spacing:1px;white-space:nowrap}
#s21 .q21-win{border:1px solid rgba(160,130,255,.6);background:rgba(24,16,56,.55);padding:8px 12px;margin:8px 0;border-radius:4px}
#s21 .q21-head{color:#c9b8ff;font-size:24px;font-weight:bold;letter-spacing:1px}
#s21 .q21-sub{color:#8fb3c9;font-size:16px}
#s21 .q21-warn{color:#ff9a9a;margin:4px 0}
#s21 .q21-bar{height:6px;background:rgba(255,255,255,.12);border-radius:3px;overflow:hidden;margin-top:3px}
#s21 .q21-bar i{display:block;height:100%;background:linear-gradient(90deg,#7fd8ff,#6dff9a)}
#s21 .q21-done{color:#6dff9a}
#s21 .q21-pen{border-color:#ff5a5a;background:rgba(70,0,0,.5)}`;

  const esc = s => esc21(s);
  const gate = () => (typeof gateName === 'function' ? gateName() : 'Cổng');
  const penName = () => R21(PEN_NAME);
  const itemName = id => (typeof itm === 'function' && itm(id) ? itm(id).name : id);
  const fmtT = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const isGuest = () => typeof Net !== 'undefined' && !!Net.active && !!Net.guest;
  const seedOf = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rngOf = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  // G.v10.q, with every field present (old saves get the defaults)
  const qs = () => {
    const v = G.v10; if (!v) return null;
    const q = v.q || (v.q = {});
    if (q.day === undefined) q.day = '';
    if (q.daily === undefined) q.daily = null;
    if (q.pen === undefined) q.pen = null;
    if (q.em === undefined) q.em = null;
    if (q.emNext === undefined) q.emNext = rint(360, 720);
    if (q.penPending === undefined) q.penPending = 0;
    if (q.penWait === undefined) q.penWait = 0;
    if (q.seq === undefined) q.seq = 0;
    if (q.title === undefined) q.title = '';
    if (!q.titles) q.titles = [];
    if (!q.hid) q.hid = {};
    for (const k of HID_ORDER) if (!q.hid[k]) q.hid[k] = { seen: 0, done: 0, prog: 0, night: 0, dead: 0 };
    return q;
  };

  let dirty = false, pingT = 0, sess = null, lastDg = null, lastPx = null, lastPy = null, lastDash = false, chestOpening = false, dom = null;
  const markDirty = () => { dirty = true; };

  // ---------- daily quest ----------
  function makeDaily(day, P) {
    const rnd = rngOf(seedOf(day)), pool = DAILY_POOL.slice(), picks = [];
    for (let i = 0; i < 2; i++) picks.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    const ids = ['kill', 'move', ...picks];
    return { list: ids.map(id => ({ id, goal: id === 'kill' ? 15 + P.level : DAILY_GOAL[id], prog: 0, done: 0 })), mv: 0, claimed: 0 };
  }
  const dailyName = it => ({ kill: `Tự tay hạ ${it.goal} quái`, move: `Di chuyển ${it.goal} m`, gate: 'Đóng 1 ' + gate(), loot: 'Lục soát 10 vật', skill: 'Dùng kỹ năng 12 lần', dash: 'Lướt 30 lần' })[it.id];
  // a new in-game day (dawn, G.day): judge the previous day. All done but not claimed -> claimed automatically;
  // started but fewer than half the tasks done -> Penalty Zone after 60 s in the open world.
  // Old saves keyed the day by the calendar date ('2026-10-12'); that key simply differs and starts a fresh day.
  const dayKey = () => 'g' + (G.day || 1);
  function checkDay(q, P) {
    const t = dayKey();
    if (q.daily && q.day === t) return;
    if (q.daily && q.day) {
      const L = q.daily.list, done = L.filter(i => i.done).length;
      if (done === L.length && !q.daily.claimed) claimDaily();
      else if (L.some(i => i.prog > 0) && done * 2 < L.length && /^g/.test(q.day)) { q.penPending = 1; q.penWait = 0; }
      SYS.msg('Ngày mới — nhiệm vụ hằng ngày đã được làm mới.', 'quest');
    }
    q.day = t; q.daily = makeDaily(t, P); markDirty();
  }
  const dailyItem = id => { const q = qs(); return q && q.daily ? q.daily.list.find(i => i.id === id) : null; };
  function setDaily(it, v) {
    if (it.done) return;
    it.prog = Math.min(it.goal, Math.floor(v));
    if (it.prog >= it.goal) {
      it.done = 1;
      SYS.msg(`Nhiệm vụ ngày hoàn thành: ${dailyName(it)}`, 'quest');
      const q = qs(); if (q && q.daily && q.daily.list.every(i => i.done)) SYS.msg('Nhiệm vụ ngày đã xong — nhận thưởng trong bảng Nhiệm vụ (phím N)', 'reward');
    }
    markDirty();
  }
  function dAdd(id, n) { if (isGuest()) return; const it = dailyItem(id); if (it) setDaily(it, it.prog + n); }
  function claimDaily() {
    const q = qs(), P = G.player;
    if (!q || !q.daily || !P || q.daily.claimed || !q.daily.list.every(i => i.done)) return;
    q.daily.claimed = 1;
    G.spAdd(10, 'Nhiệm vụ ngày');
    G.give('mystery', 1);
    G.v10.pts = (G.v10.pts || 0) + 1;
    G.addXp(0.15 * G.xpNeed(P.level));
    markDirty();
    SYS.refresh();
  }

  // ---------- hidden quests and titles ----------
  function winHidden(key) {
    const q = qs(), H = q && HID[key] ? q.hid[key] : null, D = HID[key];
    if (!H || H.done) return;
    H.done = 1; H.seen = 1; H.prog = D.goal;
    if (!q.titles.includes(key)) q.titles.push(key);
    SYS.msg(`Nhiệm vụ ẩn: ${D.name} — danh hiệu [${D.title}]`, 'reward');
    G.spAdd(D.pts, 'Nhiệm vụ ẩn ' + D.name);
    markDirty();
  }
  function toggleTitle(key) {
    const q = qs(); if (!q || !q.titles.includes(key)) return;
    q.title = q.title === key ? '' : key;
    SYS.msg(q.title ? `Đang mang danh hiệu: ${HID[key].title}` : 'Đã gỡ danh hiệu', 'info');
    markDirty(); SYS.refresh();
  }
  function countLoot(p) { if (p && p.q21c) return; if (p) p.q21c = 1; dAdd('loot', 1); }
  function countChest() {
    const q = qs(), H = q.hid.treasure; if (isGuest()) return;
    H.seen = 1; if (H.done) return;
    H.prog = Math.min(HID.treasure.goal, H.prog + 1); markDirty();
    if (H.prog >= HID.treasure.goal) winHidden('treasure');
  }

  // ---------- emergency quests ----------
  const emTitle = em => em.type === 'kill15' ? 'Tiêu diệt 15 quái trong 90 s' : em.type === 'elite' ? 'Hạ 1 quái tinh anh trong 120 s' : `Đóng ${gate()} hạng ${em.rank} gần nhất trong 10 phút`;
  const emShort = em => em.type === 'kill15' ? 'Tiêu diệt 15 quái' : em.type === 'elite' ? 'Hạ quái tinh anh' : `Đóng ${gate()} hạng ${em.rank}`;
  function discoveredGates() {
    const gt = G.v10 && G.v10.gt, P = G.player; if (!gt || !P || !gt.list) return [];
    return gt.list.filter(r => r.found && !r.done)
      .map(r => ({ x: r.x, y: r.y, rank: r.rank, d: Math.hypot(r.x - P.x, r.y - P.y) }))
      .sort((a, b) => a.d - b.d);
  }
  // a walkable spot at distance lo..hi px from the player (null if none found)
  function freeSpot(P, lo, hi) {
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2, d = lo + Math.random() * (hi - lo);
      const x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
      if (World.walkable(Math.floor(x / TILE), Math.floor(y / TILE))) return { x, y };
    }
    return null;
  }
  function guideOn(x, y, label) { if (typeof G.guideTo === 'function') { try { G.guideTo(x, y, label); } catch (e) { console.error('[v21 quest guide]', e); } } }
  function guideOff() { if (typeof G.guideClear === 'function') { try { G.guideClear(); } catch (e) { console.error('[v21 quest guide]', e); } } }
  function startEmergency(q, P, force) {
    const gates = discoveredGates(), opts = ['kill15', 'elite'];
    if (gates.length) opts.push('gate');
    const type = force && opts.includes(force) ? force : opts[Math.floor(Math.random() * opts.length)];
    const em = { type, t: EM_T[type], prog: 0, id: ++q.seq, rank: '', x: 0, y: 0, guided: 0 };
    if (type === 'elite') {
      const s = freeSpot(P, 400, 600);
      if (!s) return false;
      const z = G.spawnEnemy(G.pickArche(1), s.x, s.y, { elite: true, state: 'chase', lvl: P.level + 2 });
      z.q21em = em.id;
      em.x = s.x; em.y = s.y; em.guided = 1; guideOn(s.x, s.y, 'Quái tinh anh');
    } else if (type === 'gate') {
      const g = gates[0];
      em.rank = g.rank; em.x = g.x; em.y = g.y; em.guided = 1; guideOn(g.x, g.y, gate() + ' hạng ' + g.rank);
    }
    q.em = em; q.emNext = rint(360, 720);
    SYS.msg(`Nhiệm vụ khẩn cấp: ${emTitle(em)}`, 'quest');
    markDirty();
    return true;
  }
  // mode: 'win' | 'fail' (lose 20% of current EXP, never a level) | 'cancel' (death)
  function emDone(mode) {
    const q = qs(), em = q && q.em, P = G.player; if (!em) return;
    q.em = null; markDirty();
    if (em.guided) guideOff();
    if (mode === 'win') {
      G.spAdd(rint(3, 8), 'Nhiệm vụ khẩn cấp');
      if (P) G.give('gold', 30 + 5 * P.level);
      SYS.msg('Nhiệm vụ khẩn cấp hoàn thành', 'reward');
    } else if (mode === 'fail') {
      if (P) P.xp = Math.floor((P.xp || 0) * 0.8);
      SYS.msg('Nhiệm vụ khẩn cấp thất bại — mất 20% EXP hiện có', 'warn');
    } else SYS.msg('Nhiệm vụ khẩn cấp bị hủy vì bạn đã gục', 'warn');
  }

  // ---------- Penalty Zone ----------
  function startPenalty() {
    const q = qs(); q.penPending = 0; q.penWait = 0; q.pen = { t: PEN_T, nx: 0 };
    markDirty();
    SYS.msg('Hôm qua bạn chưa hoàn thành nhiệm vụ ngày. ' + penName() + ' bắt đầu!', 'warn');
    UI.banner(penName().toUpperCase(), 'Sống sót 180 giây — không thể dịch chuyển', '#ff3b3b');
    Sound.play('sfx_gong', 0.6, 0.8);
    Bus21.emit('penalty', true);
  }
  function endPenalty(ok) {
    const q = qs(); if (!q || !q.pen) return;
    q.pen = null; markDirty();
    Bus21.emit('penalty', false);
    if (ok) { SYS.msg('Bạn đã sống sót khỏi ' + penName(), 'reward'); G.spAdd(5, 'Sống sót ' + penName()); }
    else SYS.msg(penName() + ' kết thúc — bạn đã gục ngã', 'warn');
  }
  function penSpawn(P) {
    const n = rint(6, 10);
    for (let i = 0; i < n; i++) {
      const s = freeSpot(P, 350, 550);
      if (s) G.spawnEnemy(G.pickArche(1), s.x, s.y, { lvl: P.level + 3, state: 'chase' });
    }
  }

  // ---------- HUD tracker and penalty overlay ----------
  // Left column (#qcol, inside #topleft under the day bar): story box (#objective, moved here), daily chip (#q21hud),
  // tutorial card (#v22tut, added by v22surv). The column collapses with the ▾/▸ button; state in localStorage 'tt_qcol'.
  const HINT_SEC = 20;                                        // key-hint line [M] ... shows for 20 s of play; F1 shows it again
  let hintOn = true, hintT = 0, hintPl = null;
  const colOff = () => { try { return localStorage.getItem('tt_qcol') === '1'; } catch (e) { return false; } };
  function colApply() {
    if (!dom) return;
    const c = colOff();
    dom.col.classList.toggle('q-collapsed', c);
    dom.tog.textContent = c ? '▸' : '▾';
    dom.tog.title = c ? 'Mở rộng' : 'Thu gọn';
  }
  function colToggle() {
    const c = !colOff();
    try { localStorage.setItem('tt_qcol', c ? '1' : '0'); } catch (e) {}
    colApply(); layoutLeft();
  }
  function ensureDom() {
    if (dom) return dom;
    const tl = document.getElementById('topleft'), obj = document.getElementById('objective');
    if (!document.body || !tl || !obj || !document.getElementById('topright')) return null;
    const st = document.createElement('style'); st.id = 'v21quest-css'; st.textContent = CSS; document.head.appendChild(st);
    const col = document.createElement('div'); col.id = 'qcol';
    tl.insertBefore(col, obj); col.appendChild(obj);
    const tog = document.createElement('button'); tog.id = 'qcolBtn'; tog.type = 'button'; obj.appendChild(tog);
    const hud = document.createElement('div'); hud.id = 'q21hud';
    hud.innerHTML = '<div class="q21h-top"><b>NHIỆM VỤ NGÀY</b><span class="q21h-n"></span></div><div class="q21h-bar"><i></i></div><div class="q21h-st"></div>';
    col.appendChild(hud);
    const pen = document.createElement('div'); pen.id = 'q21pen'; document.body.appendChild(pen);
    const pent = document.createElement('div'); pent.id = 'q21pent'; document.body.appendChild(pent);
    tog.addEventListener('click', e => { e.stopPropagation(); colToggle(); });
    hud.addEventListener('click', () => SYS.open('quest'));
    window.addEventListener('keydown', e => { if (e.code === 'F1') { e.preventDefault(); hintOn = !hintOn; hintT = 0; const ml = document.getElementById('mmlabel'); if (ml) ml.classList.toggle('q-hint-off', !hintOn); } });
    dom = { col, tog, hud, cnt: hud.querySelector('.q21h-n'), bar: hud.querySelector('.q21h-bar i'), st: hud.querySelector('.q21h-st'), pen, pent,
      feed: document.getElementById('feed') };
    colApply();
    return dom;
  }
  // desktop: the feed (toasts) sits right below the column; touch keeps its CSS place (above the bottom-left bars)
  function layoutLeft() {
    if (!dom) return;
    const tl = document.getElementById('topleft'); if (!tl) return;
    const touch = document.body.classList.contains('touch'), bottom = tl.getBoundingClientRect().bottom;
    if (dom.feed) dom.feed.style.top = touch ? '' : (bottom + 8) + 'px';
  }
  function hudUpdate(q) {
    const d = ensureDom(); if (!d || !q.daily) return;
    const L = q.daily.list, doneN = L.filter(i => i.done).length;
    d.cnt.textContent = `${doneN}/${L.length}` + (q.daily.claimed ? ' ✓' : '');
    d.bar.style.width = (100 * doneN / L.length).toFixed(1) + '%';
    let s = '', warn = false;
    if (q.pen) { s = `⚠ ${penName()} · ${fmtT(q.pen.t)}`; warn = true; }
    else if (q.penPending) { s = `⚠ ${penName()} sắp tới`; warn = true; }
    else if (q.em) s = `⚑ ${emShort(q.em)}${q.em.type === 'kill15' ? ' ' + q.em.prog + '/15' : ''} · ${fmtT(q.em.t)}`;
    if (d.st.textContent !== s) d.st.textContent = s;
    d.st.classList.toggle('pen', warn);
    d.pen.style.display = q.pen ? 'block' : 'none';
    d.pent.style.display = q.pen ? 'block' : 'none';
    if (q.pen) d.pent.textContent = `${penName().toUpperCase()} · ${fmtT(q.pen.t)}`;
    layoutLeft();
  }

  // ---------- System tab ----------
  function renderTab(body) {
    const q = qs(), P = G.player;
    if (!q || !q.daily) { body.innerHTML = '<p class="muted">Đang tải nhiệm vụ…</p>'; return; }
    const L = q.daily.list, all = L.every(i => i.done), claimed = !!q.daily.claimed;
    let h = '';
    if (q.pen) h += `<div class="q21-win q21-pen"><div class="q21-head">${esc(penName().toUpperCase())}</div><div>Còn <b>${fmtT(q.pen.t)}</b> — không thể dịch chuyển hay dùng cuộn. Sống sót để nhận 5 ${esc(spName())}.</div></div>`;
    else if (q.penPending) h += `<div class="q21-win q21-pen"><div class="q21-head">${esc(R21(PEN_HEAD).toUpperCase())}</div><div>Hôm qua bạn chưa hoàn thành nhiệm vụ ngày. ${esc(penName())} bắt đầu sau ${Math.max(0, PEN_WAIT - Math.floor(q.penWait))} giây chơi ở thế giới mở.</div></div>`;
    h += `<div class="q21-win"><div class="q21-head">${esc(R21(DAILY_TITLE))}</div>`;
    h += `<div class="q21-sub">${esc(R21(DAILY_SUB))} · ngày ${esc(String(q.day).replace(/^g/, ''))} · làm mới lúc 6:00 sáng · ${L.filter(i => i.done).length}/${L.length}</div>`;
    h += `<div class="q21-warn">⚠ ${WARN_TXT}</div>`;
    for (const it of L) {
      const pct = Math.min(100, it.prog / it.goal * 100);
      h += `<div class="s21row"><div class="grow">${esc(dailyName(it))}${it.done ? ' <span class="q21-done">✓</span>' : ''}<div class="q21-bar"><i style="width:${pct.toFixed(1)}%"></i></div></div><span class="muted">${it.prog}/${it.goal}</span></div>`;
    }
    h += `<div class="s21row"><div class="grow muted">Thưởng: 10 ${esc(spName())} · ${esc(itemName('mystery'))} ×1 · +1 điểm thuộc tính · 15% EXP cấp</div>`;
    h += claimed ? '<span class="q21-done">Đã nhận</span>' : `<button data-q21="claim" ${all ? '' : 'disabled'}>Nhận thưởng</button>`;
    h += '</div></div>';

    h += '<h3>Nhiệm vụ khẩn cấp</h3>';
    if (q.em) h += `<div class="q21-win"><div class="q21-head">${esc(emTitle(q.em))}</div><div>Tiến độ: ${q.em.type === 'kill15' ? q.em.prog + '/15' : '—'} · còn <b>${fmtT(q.em.t)}</b></div><div class="q21-warn">Thất bại: mất 20% EXP hiện có</div></div>`;
    else h += `<p class="muted">Không có nhiệm vụ khẩn cấp. Nhiệm vụ mới đến sau khoảng ${fmtT(q.emNext)} chơi ở thế giới mở.</p>`;

    h += '<h3>Nhiệm vụ ẩn</h3>';
    for (const k of HID_ORDER) {
      const H = q.hid[k], D = HID[k], shown = !!(H.seen || H.done);
      const pct = Math.min(100, H.prog / D.goal * 100);
      h += `<div class="s21row"><div class="grow">`;
      h += shown ? `<b>${esc(D.name)}</b> — ${esc(typeof D.desc === 'function' ? D.desc() : D.desc)}<div class="q21-bar"><i style="width:${pct.toFixed(1)}%"></i></div><div class="muted">Danh hiệu: ${esc(D.title)} (${esc(D.eff)})</div>` : '<b>???</b><div class="muted">Chưa mở</div>';
      h += `</div><span>${H.done ? '<span class="q21-done">✓</span>' : shown ? `${Math.min(H.prog, D.goal)}/${D.goal}` : '???'}</span></div>`;
    }

    h += '<h3>Danh hiệu</h3>';
    if (!q.titles.length) h += '<p class="muted">Chưa có danh hiệu. Hoàn thành nhiệm vụ ẩn để nhận.</p>';
    for (const k of q.titles) {
      h += `<div class="s21row"><div class="grow"><b>${esc(HID[k].title)}</b> <span class="muted">${esc(HID[k].eff)}</span></div><button data-q21="equip" data-key="${k}">${q.title === k ? 'Đang mang · gỡ' : 'Mang'}</button></div>`;
    }
    body.innerHTML = h;
    body.querySelectorAll('[data-q21]').forEach(b => {
      b.onclick = () => { if (b.dataset.q21 === 'claim') claimDaily(); else toggleTitle(b.dataset.key); };
    });
  }

  SYS.addTab({
    id: 'quest', icon: '✦', name: 'Nhiệm vụ', order: 15,
    render: renderTab,
    badge: () => { const q = qs(); return q && q.daily && !q.daily.claimed && q.daily.list.every(i => i.done) ? 1 : null; },
  });

  // ---------- Bus events ----------
  Bus21.on('search', p => { if (!isGuest()) countLoot(p); });
  Bus21.on('summon', n => { if (sess) sess.summ += n || 1; });

  // ---------- per-frame tick ----------
  const tick = G.v5Tick;
  G.v5Tick = function (dt) {
    tick.call(this, dt);
    if (this.player !== hintPl) { hintPl = this.player; hintOn = true; hintT = 0; }   // a new game shows the key hint again
    if (hintOn) { hintT += dt; if (hintT >= HINT_SEC) hintOn = false; }
    const ml = document.getElementById('mmlabel'); if (ml) ml.classList.toggle('q-hint-off', !hintOn);
    const q = qs(), P = this.player;
    if (!q || !P || isGuest()) return;
    pingT++;
    if (this.frame % 30 === 0 || !q.daily) checkDay(q, P);

    // dungeon session (in memory): a new dungeon object starts a session, leaving the dungeon ends it
    const inD = World.mode === 'dungeon' && !!World.dg;
    if (inD && World.dg !== lastDg) {
      lastDg = World.dg;
      sess = { rank: World.dg.rank, heal: 0, summ: 0 };
      if (RANKS.indexOf(World.dg.rank) >= 2) q.hid.nomed.seen = 1;
      q.hid.solo.seen = 1; markDirty();
    }
    if (!inD && (sess || lastDg)) { sess = null; lastDg = null; }

    // walking distance (not on a car, mount, boat, dash or after a teleport jump) and dash count
    if (!P.dead) {
      if (lastPx !== null && q.daily) {
        const d = Math.hypot(P.x - lastPx, P.y - lastPy);
        if (d > 0 && d < 40 && !P.car && !P.riding && !P.shRide && !P.boat && !(P.dashT > 0)) {
          const dl = q.daily;
          dl.mv = (dl.mv || 0) + d;
          const it = dailyItem('move'), m = Math.floor(dl.mv / MOVE_PX);
          if (it && m > it.prog) setDaily(it, m);
        }
      }
      lastPx = P.x; lastPy = P.y;
      // a dash restarts the dash cooldown; the mage blink zeroes dashT in the same frame, so dashT alone misses it
      const cd = P.dashCd || 0;
      if (lastDash !== false && cd > lastDash + 0.05) dAdd('dash', 1);
      lastDash = cd;
    }

    // blood moon survivor: a night that ends while the player never died
    const S = q.hid.survivor;
    if (G.bloodMoon && !S.night) { S.night = 1; S.dead = 0; S.seen = 1; markDirty(); }
    else if (!G.bloodMoon && S.night) { S.night = 0; if (!S.dead) winHidden('survivor'); markDirty(); }

    // Penalty Zone
    if (q.pen) {
      q.pen.t -= dt;
      if (q.pen.t <= 0) endPenalty(true);
      else if (World.mode === 'over') {
        q.pen.nx -= dt;
        if (q.pen.nx <= 0) { q.pen.nx = PEN_EVERY; penSpawn(P); }
      }
    } else if (q.penPending && World.mode === 'over') {
      q.penWait += dt;
      if (q.penWait >= PEN_WAIT) startPenalty();
    }

    // emergency quests: countdown only in the open world, outside the Penalty Zone
    if (q.em) {
      q.em.t -= dt;
      if (q.em.t <= 0) emDone('fail');
    } else if (World.mode === 'over' && !q.pen) {
      q.emNext -= dt;
      if (q.emNext <= 0 && !startEmergency(q, P)) q.emNext = 15;
    }

    if (pingT % 10 === 0) hudUpdate(q);
    if (dirty && pingT % 6 === 0) { dirty = false; SYS.refresh(); }
    else if (pingT % 60 === 0 && SYS.isOpen() && SYS.cur === 'quest') SYS.refresh();
  };

  // ---------- kills ----------
  const ke = G.killEnemy;
  G.killEnemy = function (z, src) {
    const fresh = !!z && !z.dead;
    ke.call(this, z, src);
    const q = qs();
    if (!q || !fresh || isGuest()) return;
    if (PLAYER_KILL[src] && !this._atk) dAdd('kill', 1);
    if (q.em && q.em.type === 'kill15') { q.em.prog++; if (q.em.prog >= 15) emDone('win'); markDirty(); }
    if (q.em && q.em.type === 'elite' && z.q21em === q.em.id) emDone('win');
    const kc = (G.v10 && G.v10.kc) || {};
    if (z.img && kc[z.img]) {
      const H = q.hid.hunter, n = kc[z.img].n || 0;
      H.seen = 1;
      if (n > H.prog) H.prog = Math.min(HID.hunter.goal, n);
      if (!H.done && n >= HID.hunter.goal) { H.sp = z.img; winHidden('hunter'); }
      markDirty();
    }
  };

  // ---------- dungeon exit: gate closed ----------
  const xd = G.exitDungeon;
  G.exitDungeon = function (...a) {
    const dg = World.dg, q = qs();
    if (dg && dg.cleared && q && !this.transit && !isGuest()) {
      dAdd('gate', 1);
      const ri = RANKS.indexOf(dg.rank);
      if (q.em && q.em.type === 'gate' && dg.rank === q.em.rank) emDone('win');
      if (sess && ri >= 2 && !sess.heal) winHidden('nomed');
      if (sess && !sess.summ) winHidden('solo');
    }
    return xd.apply(this, a);
  };

  // ---------- loot and chests (chests open through openChest, also for mimics) ----------
  const lp = G.lootProp;
  G.lootProp = function (p) {
    const was = !!(p && p.looted), chest = !!(p && p.container === 'chest');
    try { return lp.call(this, p); }
    finally { if (p && p.looted && !was && !chest && !isGuest()) countLoot(p); }
  };
  const oc = G.openChest;
  G.openChest = function (p) {
    const prev = chestOpening; chestOpening = true;
    try { return oc.call(this, p); }
    finally { chestOpening = prev; if (!isGuest()) { countLoot(p); countChest(); } }
  };
  const idrop = Items.drop;
  Items.drop = function (x, y, id, n, ...rest) {
    if (chestOpening && id === 'gold') { const q = qs(); if (q && q.title === 'treasure') n = Math.ceil(n * 1.1); }
    return idrop.call(this, x, y, id, n, ...rest);
  };

  // ---------- skills: count only when mana / energy was actually spent ----------
  let spendDepth = 0;
  const resNow = () => { const P = G.player, v = G.v10; return P && v ? { m: v.mana || 0, e: P.energy || 0 } : null; };
  const spentBetween = (a, b) => !!(a && b && (b.m < a.m - 0.01 || (a.e >= 100 && b.e < a.e - 0.01)));
  const watchSpend = fn => function (...a) {
    if (spendDepth > 0) return fn.apply(this, a);
    const before = resNow(); spendDepth++;
    try { return fn.apply(this, a); }
    finally { spendDepth--; if (spentBetween(before, resNow())) dAdd('skill', 1); }
  };
  G.castMana = watchSpend(G.castMana);
  G.castSkill = watchSpend(G.castSkill);
  // skills run their real effect after a cut-in: watch that callback too
  const sc = G.startCut;
  G.startCut = function (o, fn) {
    if (typeof fn === 'function' && o && SKILL_SUB[o.sub]) return sc.call(this, o, watchSpend(fn));
    return sc.call(this, o, fn);
  };

  // ---------- Penalty Zone bans ----------
  const tp = G.teleport;
  G.teleport = function (t) {
    const q = qs();
    if (q && q.pen) { G.toast(penName() + ': không thể dịch chuyển!', 'warn'); return; }
    return tp.call(this, t);
  };
  const us = G.useScroll;
  G.useScroll = function () {
    const q = qs();
    if (q && q.pen) { G.toast(penName() + ': không thể dùng cuộn truyền tống!', 'warn'); return; }
    return us.call(this);
  };

  // ---------- title effects ----------
  const he = G.hitEnemy;
  G.hitEnemy = function (z, dmg, kx, ky, src, ang, wp) {
    const q = qs();
    if (q && q.title && (src === 'gun' || src === 'melee' || src === 'skill') && z) {
      if (q.title === 'hunter' && z.img && z.img === q.hid.hunter.sp) dmg *= 1.05;
      else if (q.title === 'solo' && !(G.allies || []).some(a => a.kind === 'shadow' && !a.dead)) dmg *= 1.08;
    }
    return he.call(this, z, dmg, kx, ky, src, ang, wp);
  };
  const hp = G.hurtPlayer;
  G.hurtPlayer = function (dmg, src, silent) {
    const q = qs();
    if (q && q.title === 'survivor') dmg *= 0.95;
    return hp.call(this, dmg, src, silent);
  };
  const uh = useHeal;
  useHeal = function (want) {
    const P = G.player, q = qs(), before = P ? P.hp : 0;
    uh.call(this, want);
    if (!P || !q || !(P.hp > before)) return;
    if (sess) sess.heal = 1;
    if (q.title === 'nomed') P.hp = Math.min(P.maxHp, P.hp + (P.hp - before) * 0.1);
  };

  // ---------- shadows used inside a dungeon (for the solo quest) ----------
  const ss = G.summonShadow;
  if (typeof ss === 'function') {
    G.summonShadow = function (...a) { const r = ss.apply(this, a); if (r === 'ok' && sess) sess.summ++; return r; };
  }

  // ---------- death ----------
  const die = G.die;
  G.die = function (...a) {
    const r = die.apply(this, a), P = G.player, q = qs();
    if (P && P.dead && q) {
      if (q.hid.survivor.night) q.hid.survivor.dead = 1;
      if (q.pen) endPenalty(false);
      if (q.em) emDone('cancel');
      markDirty();
    }
    return r;
  };

  // ---------- public helpers and debug ----------
  G.titleName = function () { const q = qs(); return q && q.title && HID[q.title] ? HID[q.title].title : ''; };
  G.q21Debug = function (cmd, arg) {
    const q = qs(), P = G.player;
    if (!q) return null;
    if (cmd === 'penalty') { if (arg === false) endPenalty(false); else if (!q.pen) startPenalty(); }
    else if (cmd === 'pending') { q.penPending = 1; q.penWait = 0; }
    else if (cmd === 'emergency') { if (!q.em && P) startEmergency(q, P, arg); }
    else if (cmd === 'day') { q.day = String(arg || ''); }
    else if (cmd === 'dailyAll') { if (q.daily) for (const it of q.daily.list) setDaily(it, it.goal); }
    else if (cmd === 'hidden') { winHidden(arg); }
    markDirty();
    return { day: q.day, daily: q.daily, pen: q.pen, penPending: q.penPending, penWait: q.penWait, em: q.em, emNext: q.emNext, hid: q.hid, titles: q.titles, title: q.title, sess: sess && { rank: sess.rank, heal: sess.heal, summ: sess.summ }, hudOff: q.hudOff };
  };
})();
