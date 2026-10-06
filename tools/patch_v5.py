"""v5 hooks: regions/statues/waypoints/base in the world, save/load, base + map UI, compact phone layout."""
import os, re
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
def load(f):
    global s, P
    P = os.path.join(ROOT, f); s = open(P, encoding='utf-8').read()
def save():
    open(P, 'w', encoding='utf-8', newline='\n').write(s)
def sub(a, b, n=1):
    global s
    if a not in s: raise SystemExit('MISSING in %s: %s' % (P, a[:90]))
    s = s.replace(a, b, n)

# ---- world: special sites take priority over random content ----
load('js/world.js')
sub("    else if (this.wonderAt(sx, sy) != null) this.genWonder(bk, this.wonderAt(sx, sy), sb);",
    "    else if (this.v5Site && this.v5Site(sx, sy)) this.genV5Site(bk, sb);\n    else if (this.wonderAt(sx, sy) != null) this.genWonder(bk, this.wonderAt(sx, sy), sb);")
save()
load('js/v5.js')
sub("  siteBlocked(sx, sy) { return (sx === 0 && sy === 0) || (typeof Story !== 'undefined' && Story.poiAt(sx, sy)) || this.wonderAt(sx, sy) != null; },",
    "  // stable: story sites count even after they are done, so statues never move\n  siteBlocked(sx, sy) { return (sx === 0 && sy === 0) || (typeof Story !== 'undefined' && Story.pois && Story.pois.some(p => p.sx === sx && p.sy === sy)) || this.wonderAt(sx, sy) != null; },")
# save/load handled in game.js directly
a = s.index("  // save / load\n  const sv = G.save;")
b = s.index("  if (typeof Net !== 'undefined') {\n    const scs = Net.saveChar")
s = s[:a] + s[b:]
sub("    Net.saveChar = function () { scs.call(this); try { const k = 'tt_coop_' + RL.id, d = JSON.parse(localStorage.getItem(k)); if (d) { d.v5 = G.v5; localStorage.setItem(k, JSON.stringify(d)); } } catch (e) {} };\n", "")
sub("    const scs = Net.saveChar, lch = Net.loadChar;", "    const lch = Net.loadChar;")
save()

load('js/game.js')
sub("explored: [...World.explored].slice(-4000), heartBuys: this.heartBuys || 0, v4: this.v4Save(),", "explored: [...World.explored].slice(-4000), heartBuys: this.heartBuys || 0, v4: this.v4Save(), v5: this.v5,")
sub("    RL = REALMS[d.realm];\n    this.seed = d.seed; this.realm = d.realm;", "    RL = REALMS[d.realm];\n    this.initV5(d.v5); this.v5.st['0,0'] = { home: true };\n    if (!d.v5) this.v5Hello = true;\n    this.seed = d.seed; this.realm = d.realm;")
sub("  newGame(realm, seed, hero, gender) {\n", "  newGame(realm, seed, hero, gender) {\n    RL = REALMS[realm]; this.initV5();\n")
save()
load('js/coop.js')
sub("    const data = { p, v4: G.v4Save(), uid: UID,", "    const data = { p, v4: G.v4Save(), v5: G.v5, uid: UID,")
sub("  this.guestV4(dt);\n", "  this.guestV4(dt);\n  this.v5Tick(dt);\n")
save()
load('js/play.js')
sub("  this.v4Tick(dt);", "  this.v4Tick(dt);\n  this.v5Tick(dt);")
save()
load('js/v4.js')
sub("  if (this.v4Gift) {", "  if (this.v5Hello) { this.v5Hello = false; setTimeout(() => this.toast(`🗺 Bản cập nhật: thế giới chia thành Vùng. Tìm ${ST_NAME[rk(RL.id)]} để hiện bản đồ, mở điểm dịch chuyển, xây Căn cứ (phím N / nút ☰)!`, 'quest'), 2500); }\n  if (this.v4Gift) {")
save()
load('js/data2.js')
sub("  if (id === 'ticket') {", "  if (id === 'orb') { d.name = ORB_NAME[rk(RL.id)]; d.icon = 'orb_' + rk(RL.id); }\n  if (id === 'ticket') {")
save()
load('js/realms.js')
sub("  add(['ev_goblin', 'ev_mimic', 'ev_star', 'ev_altar', 'ev_egg', 'tk_' + k]);", "  add(['ev_goblin', 'ev_mimic', 'ev_star', 'ev_altar', 'ev_egg', 'tk_' + k, 'st_' + k, 'wp_' + k, 'orb_' + k, 'base_forge', 'base_kitchen', 'base_garden', 'base_storage', 'base_board', 'base_bed']);")
save()
load('js/ui.js')
sub("h += '<h3>Túi đồ (' + P.stash.length + '/30)</h3><div class=\"gstash\">';", "h += '<h3>Túi đồ (' + P.stash.length + '/' + G.stashCap() + ')</h3><div class=\"gstash\">';")
save()
load('js/v3.js')
sub("<h3>Trang bị trong túi (${P.stash.length}/30)</h3>", "<h3>Trang bị trong túi (${P.stash.length}/${G.stashCap()})</h3>")
save()

# ---- touch: ☰ menu, base button ----
load('js/touch.js')
sub("if (a === 'pause') UI.pause(); else if (a === 'chat') UI.chatOpen();",
    "if (a === 'more') { const m = document.getElementById('tmore'); m.hidden = !m.hidden; return; }\n        document.getElementById('tmore').hidden = true;\n        if (a === 'pause') UI.pause(); else if (a === 'chat') UI.chatOpen(); else if (a === 'base') UI.openBase(); else if (a === 'gacha') UI.openGacha();")
save()

# ---- markup ----
load('index.html')
a = s.index('<div id="tmenu">'); b = s.index('</div>', s.index('data-k="KeyU"')) + len('</div>')
s = s[:a] + '''<div id="tmenu">
  <button data-a="pause">II</button><button data-a="map">🗺</button><button data-a="inv">🎒</button><button data-a="more" id="tMoreBtn">☰</button>
  <div id="tmore" hidden>
    <button data-a="base">🏠<span>Căn cứ</span></button><button data-a="gacha" class="gbtn">🎴<span>Triệu hồi</span></button><button data-a="craft">⚒<span>Chế tạo</span></button><button data-a="chat">💬<span>Nhắn tin</span></button><button data-a="fs">⛶<span>Toàn màn hình</span></button>
    <button data-k="KeyL" class="ico"><img src="assets/img/i_flashlight.png" alt=""><span>Đèn pin</span></button><button data-k="KeyB" class="ico"><img src="assets/img/i_planks.png" alt=""><span>Rào chắn</span><i></i></button><button data-k="KeyT" class="ico"><img src="assets/img/i_scrap.png" alt=""><span>Bẫy</span><i></i></button><button data-k="KeyU" class="ico"><img src="assets/img/ui_5.png" alt=""><span>Truyền tống</span></button>
  </div>
</div>''' + s[b:]
sub('''    <canvas id="bigmap" width="800" height="800"></canvas>
    <div id="mapInfo" class="muted"></div>''', '''    <div class="mapwrap"><canvas id="bigmap" width="800" height="800"></canvas>
      <div class="mapctl"><button id="mapZin">＋</button><button id="mapZout">－</button><button id="mapMe">◎</button></div></div>
    <button id="mapTp" hidden></button>
    <div id="mapInfo" class="muted"></div>''')
sub('<div id="coop" class="screen hidden">', '''<div id="base" class="screen hidden">
  <div class="panel wide basep">
    <button class="close" onclick="UI.closePanel()">✕</button>
    <div class="bhead"><h2>🏠 CĂN CỨ <small id="bLvl"></small></h2><div id="bRes"></div></div>
    <div class="tabs"><button data-btab="build">Công trình</button><button data-btab="forge">Lò rèn</button><button data-btab="kitchen">Bếp</button><button data-btab="bounty">Nhiệm vụ</button></div>
    <div id="bAway" class="baway" hidden>Bạn đang ở xa Căn cứ — xem được nhưng phải về mới xây, rèn, nấu, nhận thưởng. <button id="bHome">⌂ DỊCH CHUYỂN VỀ CĂN CỨ</button></div>
    <div id="baseBody"></div>
  </div>
</div>

<div id="coop" class="screen hidden">''')
sub('<script src="js/coop.js"></script>\n', '<script src="js/coop.js"></script>\n<script src="js/v5.js"></script>\n')
sub("          <tr><td>Y</td><td>Tế Đàn triệu hồi (gacha): thú cưng, trang bị, báu vật</td></tr>",
    "          <tr><td>Y</td><td>Tế Đàn triệu hồi (gacha): thú cưng, trang bị, báu vật</td></tr>\n          <tr><td>N / M</td><td>Căn cứ / Bản đồ (chạm ◆ ✦ ⌂ để dịch chuyển)</td></tr>")
save()

load('sw.js')
sub("const VERSION = 'tt-v8';", "const VERSION = 'tt-v9';")
sub("'js/v4.js', 'js/coop.js',", "'js/v4.js', 'js/coop.js', 'js/v5.js',")
save()

# ---- styles: base screen, map controls, compact phone HUD ----
load('css/v2.css')
s += """
/* ---------- v5: base, map, phone layout ---------- */
.basep { max-width: 960px; }
.bhead { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding-right: 40px; }
.bhead h2 { margin: 0; flex: 1; min-width: 0; }
.bhead h2 small { font-size: 18px; color: var(--muted); }
#bRes { display: flex; gap: 12px; font-size: 20px; color: var(--gold); }
#bRes span { display: flex; align-items: center; gap: 3px; }
#bRes img { width: 22px; height: 22px; object-fit: contain; image-rendering: pixelated; }
.baway { background: rgba(80,40,10,0.5); border: 1px solid #a07030; padding: 6px 10px; margin: 6px 0; font-size: 17px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.baway button { min-width: 0 !important; font-size: 18px; padding: 2px 10px; }
.bcards { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 8px; }
.bcard { display: flex; gap: 8px; align-items: flex-start; background: rgba(0,0,0,0.45); border: 2px solid #6a5020; padding: 8px; flex-wrap: wrap; }
.bcard.none { border-style: dashed; opacity: 0.85; }
.bcard > img { width: 64px; height: 64px; object-fit: contain; image-rendering: pixelated; }
.bcard .binfo { flex: 1; min-width: 150px; line-height: 1.05; }
.bcard .binfo b { font-weight: normal; font-size: 21px; color: var(--gold); }
.bcard .binfo small { color: var(--muted); font-size: 15px; }
.bcard p { margin: 3px 0; font-size: 15px; }
.bcard .next { color: #9fd; }
.bcard .cost b { font-weight: normal; color: var(--gold); }
.bcard .cost b.bad { color: #ff7a6a; }
.bcard button, #base .srow button { min-width: 0 !important; font-size: 17px; padding: 2px 10px; }
.bcard button.dim, #base button.dim { opacity: 0.4; }
.bprog { display: block; height: 5px; background: rgba(0,0,0,0.6); margin-top: 3px; }
.bprog u { display: block; height: 100%; background: linear-gradient(90deg, #ffcf3a, #ffe6a0); }
.srow.claimed { opacity: 0.5; }
.mapwrap { position: relative; display: inline-block; max-width: 100%; }
.mapwrap canvas { touch-action: none; cursor: grab; }
.mapctl { position: absolute; right: 8px; top: 8px; display: flex; flex-direction: column; gap: 6px; }
.mapctl button { min-width: 0 !important; width: 40px; height: 40px; padding: 0; font-size: 22px; }
#mapTp { min-width: 0; font-size: 22px; margin: 6px auto; display: block; background: linear-gradient(#1e5a8a, #0c2a44); border-color: #7dd8ff; }
#tmore { position: absolute; top: 40px; right: 0; display: grid; grid-template-columns: repeat(3, 84px); gap: 6px; background: var(--panel); border: 2px solid var(--edge); padding: 8px; }
#tmore button { height: 60px; width: 84px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 22px; padding: 2px; }
#tmore button span { font-size: 13px; color: var(--muted); line-height: 1; margin-top: 2px; }
#tmore button img { width: 26px; height: 26px; }
#tMoreBtn.note { border-color: var(--gold); box-shadow: 0 0 10px rgba(255,207,58,0.7); }
/* compact phone HUD: nothing overlaps the minimap or each other */
body.touch #tmenu button { font-size: 18px; height: 34px; min-width: 38px; padding: 0 8px; }
body.touch.tplay #tbtns { display: grid; grid-template-columns: repeat(2, 40px); gap: 6px; top: calc(46px + env(safe-area-inset-top, 0px)); bottom: auto; right: calc(112px + env(safe-area-inset-right, 0px)); }
body.touch #tbtns button { width: 40px; height: 40px; font-size: 18px; }
body.touch #tbtns button span { display: none; }
body.touch #tbtns button img { width: 24px; height: 24px; }
body.touch.tplay #tbtns button.big { position: fixed; width: 56px; height: 56px; font-size: 24px; right: calc(186px + env(safe-area-inset-right, 0px)); bottom: calc(70px + env(safe-area-inset-bottom, 0px)); top: auto; }
body.touch.tplay #tbtns button.big span { display: block; font-size: 11px; }
body.touch #topright { top: calc(46px + env(safe-area-inset-top, 0px)); }
body.touch #minimap { width: 96px; height: 96px; }
body.touch #objective { max-width: 34vw; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
body.touch #bars { top: calc(86px + env(safe-area-inset-top, 0px)); padding: 3px 5px; gap: 2px; }
body.touch .brow .bar { width: 74px; height: 7px; }
body.touch .brow img { width: 11px; height: 11px; }
body.touch .brow .bar span { display: none; }
body.touch #radio { top: calc(44px + env(safe-area-inset-top, 0px)); width: min(380px, 46vw); }
body.touch #radioText { font-size: 14px; }
body.touch #feed { max-width: 34vw; bottom: 64px; }
body.touch #feed .toast:nth-child(n+4) { display: none; }
body.touch .toast { font-size: 13px; line-height: 1.1; }
body.touch #banner h2 { font-size: 26px; }
body.touch #comphud { display: none; }
body.touch #bigmap { width: min(70vh, 74vw); height: min(70vh, 74vw); }
body.touch .basep, body.touch .gpanel { padding: 8px 10px; }
@media (max-height: 420px) { body.touch #tmore { grid-template-columns: repeat(5, 74px); } body.touch #tmore button { width: 74px; height: 54px; } }
"""
save()
print('v5 ok')
