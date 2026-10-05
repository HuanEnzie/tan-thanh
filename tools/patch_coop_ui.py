"""Co-op UI: lobby screen, chat box, party HUD, render + minimap hooks."""
import os
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

load('index.html')
sub('<button data-a="gacha" class="gbtn">🎴</button>', '<button data-a="gacha" class="gbtn">🎴</button><button data-a="chat">💬</button>')
sub('<div id="feed"></div>', '<div id="feed"></div>\n  <div id="partyHud" hidden></div>')
sub('      <button id="btnInstall" hidden>📲 CÀI ĐẶT APP</button>', '      <button id="btnCoopT">👥 CHƠI CÙNG BẠN BÈ</button>\n      <button id="btnInstall" hidden>📲 CÀI ĐẶT APP</button>')
sub('      <button id="btnSaveIO">💾 LƯU / TẢI FILE</button>', '      <button id="btnCoopP">👥 MỜI BẠN CHƠI CÙNG</button>\n      <button id="btnSaveIO">💾 LƯU / TẢI FILE</button>')
sub('<div id="saveio" class="screen hidden">', '''<div id="coop" class="screen hidden">
  <div class="panel wide coopp">
    <button class="close" onclick="UI.back()">✕</button>
    <h2>👥 CHƠI CÙNG BẠN BÈ</h2>
    <div id="coopHost">
      <p class="muted">Bạn là chủ phòng: bạn bè vào thế giới của bạn, cùng đánh quái, vào Cổng và hạ boss. Kinh nghiệm chia đều, đồ rơi là của riêng từng người. Tối đa 4 người.</p>
      <div class="menu row wrap"><button id="cOpen">📡 MỞ PHÒNG</button><button id="cCopy" hidden>⧉ SAO CHÉP LỜI MỜI</button><button id="cClose" hidden>✖ ĐÓNG PHÒNG</button></div>
      <div class="ccode" id="cCode">-----</div>
      <input id="cLink" readonly>
    </div>
    <div id="coopJoin">
      <p class="muted">Nhập mã phòng bạn bè gửi, hoặc mở link mời. Nhân vật co-op của bạn được lưu riêng theo từng thế giới (lần đầu sẽ mượn nhân vật trong bản lưu nếu cùng thế giới).</p>
      <div class="cform"><label>Tên hiển thị <input id="cName" maxlength="20" autocomplete="off"></label><label>Mã phòng <input id="cJoinCode" maxlength="6" placeholder="VD: K7M2Q" autocomplete="off"></label></div>
      <div class="menu row"><button id="cJoin">▶ VÀO PHÒNG</button></div>
    </div>
    <div id="coopGuest" hidden><div class="menu row"><button id="cLeave">⏏ RỜI PHÒNG</button></div></div>
    <div id="cPlayers" class="cplayers"></div>
    <p id="cMsg" class="cmsg"></p>
    <p class="muted small">Co-op nối trực tiếp giữa các máy (WebRTC): chạy trên bản GitHub Pages hoặc app đã cài, không chạy trong khung xem artifact. Một số mạng công ty / 4G có thể chặn kết nối trực tiếp. Nhấn Enter hoặc nút 💬 để nhắn tin.</p>
  </div>
</div>

<div id="chatBox" hidden><div id="chatPresets"></div><div class="crow"><input id="chatIn" maxlength="60" placeholder="Nhắn cho đồng đội..." autocomplete="off"><button id="chatSend">GỬI</button></div></div>

<div id="saveio" class="screen hidden">''')
sub('<script src="js/v4.js"></script>\n', '<script src="js/v4.js"></script>\n<script src="js/coop.js"></script>\n')
save()

load('js/touch.js')
sub("if (a === 'pause') UI.pause();", "if (a === 'pause') UI.pause(); else if (a === 'chat') UI.chatOpen();")
save()
load('js/coop.js')
sub("  document.querySelectorAll('[data-a=\"chat\"]').forEach(b => b.addEventListener('click', () => UI.chatOpen()));\n", "  if (!Touch.on) document.querySelectorAll('[data-a=\"chat\"]').forEach(b => b.addEventListener('click', () => UI.chatOpen()));\n")
# mimic chests never pay out to the host; a far host still forgets its kept chest
sub("        if (p && !p.looted) {\n          this.applying = true; World.markLooted(p); this.applying = false;\n          if (p.container === 'chest') {",
    "        if (p && !p.looted) {\n          this.applying = true; World.markLooted(p); this.applying = false;\n          if (p.data && p.data.keep) World.unkeep(p.data.keep);\n          if (p.container === 'chest' && p.data && p.data.mimic) { /* the mimic request follows */ }\n          else if (p.container === 'chest') {")
# your own chat bubble + minimap markers for the party
s += """
function drawSelfSay(ctx) {
  const P = G.player; if (!P || !P.say) return;
  P.say.t -= G.rdt || 0.016; if (P.say.t <= 0) { P.say = null; return; }
  ctx.font = '10px VT323, monospace'; ctx.textAlign = 'center';
  const w = ctx.measureText(P.say.text).width + 10;
  ctx.fillStyle = 'rgba(10,20,24,0.85)'; ctx.fillRect(P.x - w / 2, P.y - 44, w, 14);
  ctx.fillStyle = '#fffbe0'; ctx.fillText(P.say.text, P.x, P.y - 34);
}
(function () {
  const mm = UI.drawMinimap;
  UI.drawMinimap = function () {
    mm.call(this);
    if (!Net.active || !G.remotes.length) return;
    const g = this.mmctx, P = G.player.car || G.player, S = 200 / 96;
    const ox = P.x / TILE - 48, oy = P.y / TILE - 48;
    for (const r of G.remotes) {
      if (r.away) continue;
      const x = clamp((r.x / TILE - ox) * S, 5, 195), y = clamp((r.y / TILE - oy) * S, 5, 195);
      g.fillStyle = r.dead ? '#777' : '#4dffe0'; g.strokeStyle = '#000'; g.lineWidth = 1.5;
      g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fill(); g.stroke();
    }
  };
})();
"""
save()

load('js/play.js')
sub("  P.draw(ctx);\n  drawPet(ctx);", "  P.draw(ctx);\n  drawPet(ctx);\n  if (typeof drawRemotes === 'function') { drawRemotes(ctx); drawSelfSay(ctx); }")
save()

load('sw.js')
sub("const VERSION = 'tt-v5';", "const VERSION = 'tt-v6';")
sub("'js/v3.js', 'js/v4.js',", "'js/v3.js', 'js/v4.js', 'js/coop.js',")
save()

load('css/v2.css')
s += """
/* ---------- co-op ---------- */
.coopp { max-width: 720px; }
.ccode { font-size: 64px; letter-spacing: 12px; text-align: center; color: #4dffe0; text-shadow: 0 0 18px rgba(77,255,224,0.6); margin: 6px 0; }
#cLink { width: 100%; background: rgba(0,0,0,0.5); color: #9fd; border: 1px solid var(--edge); font-family: monospace; font-size: 13px; padding: 4px; user-select: text; }
.cform { display: flex; gap: 12px; flex-wrap: wrap; }
.cform label { display: flex; flex-direction: column; font-size: 18px; color: var(--muted); flex: 1; min-width: 160px; }
.cform input { font-family: var(--font); font-size: 26px; padding: 4px 8px; background: rgba(0,0,0,0.6); color: var(--text); border: 2px solid var(--edge); text-transform: none; }
#cJoinCode { text-transform: uppercase; letter-spacing: 6px; color: #4dffe0; }
.cplayers { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0; font-size: 20px; }
.cplayers span { background: rgba(77,255,224,0.12); border: 1px solid #2a8a7a; padding: 2px 10px; }
.cmsg { color: #ffe6a0; font-size: 19px; min-height: 22px; }
.small { font-size: 15px; }
#coop .menu button { min-width: 0; font-size: 22px; }
#partyHud { position: absolute; top: 8px; left: 50%; transform: translateX(-50%); background: var(--panel); border: 1px solid #2a8a7a; padding: 2px 10px; font-size: 15px; display: flex; gap: 10px; align-items: center; }
#partyHud b { color: #4dffe0; font-weight: normal; }
#partyHud .pm { display: flex; flex-direction: column; line-height: 1; }
#partyHud .pm i { display: block; width: 60px; height: 4px; background: rgba(0,0,0,0.6); }
#partyHud .pm u { display: block; height: 100%; background: #6dff7a; }
#partyHud .pm.dead span { color: #888; text-decoration: line-through; }
#chatBox { position: fixed; left: 50%; bottom: 120px; transform: translateX(-50%); z-index: 30; background: var(--panel); border: 2px solid #2a8a7a; padding: 8px; width: min(520px, 92vw); }
#chatPresets { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
#chatPresets button, #chatBox .crow button { min-width: 0 !important; font-size: 17px; padding: 2px 8px; letter-spacing: 0; }
#chatBox .crow { display: flex; gap: 6px; }
#chatIn { flex: 1; min-width: 0; font-family: var(--font); font-size: 20px; padding: 2px 6px; background: rgba(0,0,0,0.6); color: var(--text); border: 1px solid var(--edge); }
body.touch #partyHud { top: calc(4px + env(safe-area-inset-top, 0px)); font-size: 12px; }
"""
save()
print('coop ui ok')
