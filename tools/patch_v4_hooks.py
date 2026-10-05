"""v4 hooks: save/load, loop, render, wonders in the world, gacha screen, shop sells equipped gear."""
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

# ---------------- ui.js ----------------
load('js/ui.js')
sub("    if (id === 'map') this.drawBigMap();\n    this.showScreen(id);", "    if (id === 'map') this.drawBigMap();\n    if (id === 'gacha') this.buildGacha();\n    this.showScreen(id);")
# big map: wonder markers ("?" = rumour, ★ = found)
sub("    const toM = (wx, wy) => [((wx / TILE) - (psx - 12) * SB) * S, ((wy / TILE) - (psy - 12) * SB) * S];",
    """    const toM = (wx, wy) => [((wx / TILE) - (psx - 12) * SB) * S, ((wy / TILE) - (psy - 12) * SB) * S];
    if (World.mode === 'over') for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const sx = psx - 12 + x, sy = psy - 12 + y, w = World.wonderAt(sx, sy); if (w == null) continue;
      const found = World.explored.has(World.mode + nkey(sx, sy));
      const [mx, my] = [(x + 0.5) * SB * S, (y + 0.5) * SB * S];
      g.font = (found ? 'bold 20px' : 'bold 22px') + ' VT323, monospace'; g.textAlign = 'center';
      g.fillStyle = '#000'; g.fillText(found ? '★' : '?', mx + 1, my + 8);
      g.fillStyle = found ? '#ffe6a0' : '#c8b8ff'; g.fillText(found ? '★' : '?', mx, my + 7);
      if (found) { g.font = '13px VT323, monospace'; g.fillText(WONDERS[w].name, mx, my + 22); }
    }""")
save()

# ---------------- index.html ----------------
load('index.html')
sub('<button data-a="inv">Túi</button>', '<button data-a="inv">Túi</button><button data-a="gacha" class="gbtn">🎴</button>')
sub('<button data-tab="stats">Nhân vật</button></div>', '<button data-tab="pets">Thú cưng</button><button data-tab="codex">Sổ tay</button><button data-tab="stats">Nhân vật</button></div>')
sub('<div id="saveio" class="screen hidden">', '''<div id="gacha" class="screen hidden">
  <div class="panel wide gpanel">
    <button class="close" onclick="UI.closePanel()">✕</button>
    <div class="ghead"><h2 id="gName"></h2><div class="gcur" id="gTickets"></div><div class="gcur" id="gStars"></div></div>
    <div class="gbanner">
      <img src="assets/img/ev_altar.png" alt="" class="galtar">
      <div class="gbtext"><b>Thú cưng 5★ đang xuất hiện</b><div id="gFeat"></div><p id="gPity"></p>
        <p class="muted">Tỉ lệ: 5★ 1.6% (tăng dần từ lượt 45, chắc chắn ở lượt 60) • 4★ 13% (chắc chắn mỗi 10 lượt). Phần thưởng: thú cưng, trang bị Huyền Thoại, rương Kim Cương, tinh thể sinh mệnh…</p></div>
    </div>
    <div class="menu row wrap gbtns"><button id="gPull1">TRIỆU HỒI x1</button><button id="gPull10" class="gold">TRIỆU HỒI x10</button><button id="gTrade">ĐỔI 10 MẢNH SAO → 1 VÉ</button><button id="gBuy"></button></div>
  </div>
  <div id="gAnim" class="ganim" hidden><div class="gsky"></div><div class="gstreak"></div><div class="gflash"></div><div id="gCards"></div><button id="gCont" hidden>TIẾP TỤC ▶</button></div>
</div>

<div id="saveio" class="screen hidden">''')
sub('<script src="js/v3.js"></script>\n', '<script src="js/v3.js"></script>\n<script src="js/v4.js"></script>\n')
sub("          <tr><td>U</td><td>Cuộn truyền tống: về nơi trú ẩn / thoát hầm ngục</td></tr>",
    "          <tr><td>U</td><td>Cuộn truyền tống: về nơi trú ẩn / thoát hầm ngục</td></tr>\n          <tr><td>Y</td><td>Tế Đàn triệu hồi (gacha): thú cưng, trang bị, báu vật</td></tr>")
sub("[Tab] Túi đồ • [U] Truyền tống", "[Tab] Túi đồ • [Y] Triệu hồi")
save()

# ---------------- game.js: save / load / gold / blood moon ----------------
load('js/game.js')
sub("explored: [...World.explored].slice(-4000), heartBuys: this.heartBuys || 0,", "explored: [...World.explored].slice(-4000), heartBuys: this.heartBuys || 0, v4: this.v4Save(),")
sub("    this.heartBuys = d.heartBuys || 0;", "    this.heartBuys = d.heartBuys || 0;\n    this.initV4(d.v4);\n    if (!d.v4) { this.player.inv.ticket = (this.player.inv.ticket || 0) + 10; this.v4Gift = true; }")
sub("    this.achieved = {};\n    this.camera.x = s.x; this.camera.y = s.y;", "    this.achieved = {};\n    this.initV4(); P.inv.ticket = 10;\n    this.camera.x = s.x; this.camera.y = s.y;")
sub("    if (id === 'gold') { P.gold += n;", "    if (id === 'gold') { n = Math.max(1, Math.round(n * this.goldMul())); P.gold += n;")
sub("    target = Math.min(target, this.lowGfx ? 60 : 90);", "    if (this.bloodMoon) target *= 1.8;\n    target = Math.min(target, this.lowGfx ? 70 : this.bloodMoon ? 130 : 90);")
sub("this.spawnEnemy(this.pickArche(s2 ? s2.zone : 0), x, y, { state: 'wander', elite: Math.random() < 0.03 + this.day * 0.004 });",
    "this.spawnEnemy(this.pickArche(s2 ? s2.zone : 0), x, y, { state: this.bloodMoon ? 'chase' : 'wander', elite: Math.random() < 0.03 + this.day * 0.004 + (this.bloodMoon ? 0.1 : 0) });")
# interact with the altar and wonders
sub("      else if (p.kind === 'campfire') { best = { prop: p, kind: 'rest', label: 'Nghỉ ngơi bên lửa trại' }; bd = d; }",
    "      else if (p.kind === 'campfire') { best = { prop: p, kind: 'rest', label: 'Nghỉ ngơi bên lửa trại' }; bd = d; }\n"
    "      else if (p.kind === 'altar') { best = { prop: p, kind: 'altar', label: GACHA_NAME[rk(RL.id)] + ' — triệu hồi' }; bd = d; }\n"
    "      else if (p.kind === 'wonder') { best = { prop: p, kind: 'wonder', label: 'Chiêm ngưỡng ' + WONDERS[p.data.w].name }; bd = d; }")
sub("      case 'shop': return UI.openShop(it.ally);",
    "      case 'shop': return UI.openShop(it.ally);\n      case 'altar': return UI.openGacha();\n      case 'wonder': { const w = WONDERS[it.prop.data.w]; this.discoverWonder(it.prop); return UI.dialog({ title: w.name, lines: [{ who: 'sys', text: w.lore }] }); }")
save()

# ---------------- play.js: loop + render ----------------
load('js/play.js')
sub("  if (this.frame % 20 === 0) this.biomeTick();", "  if (this.frame % 20 === 0) this.biomeTick();\n  this.v4Tick(dt);")
sub("  P.draw(ctx);\n  Bullets.draw(ctx);\n  Particles.draw(ctx);", "  P.draw(ctx);\n  drawPet(ctx);\n  Bullets.draw(ctx);\n  Particles.draw(ctx);\n  drawMeteors(ctx);")
sub("  drawBiomeTint();", "  drawBiomeTint();\n  drawEventTint();")
save()

# ---------------- entities.js: pet magnet + crit ----------------
load('js/entities.js')
sub("      const mag = it.gear ? 40 : 80;", "      const mag = (it.gear ? 40 : 80) * (G.magnetMul || 1);")
save()
load('js/game.js')
sub("      const cc = (P.perks.crit || 0) * 0.1 + (wp && wp.crit || 0) + (P.relic('critdmg') ? 0.05 : 0) + 0.05;",
    "      const cc = (P.perks.crit || 0) * 0.1 + (wp && wp.crit || 0) + (P.relic('critdmg') ? 0.05 : 0) + 0.05 + (P.pab && P.pab.crit || 0);")
save()

# ---------------- story.js: new biome reward hook lives in v3 biomeTick ----------------
load('js/v3.js')
sub("    this.biomeAmb = B.amb;\n", "    this.biomeAmb = B.amb;\n    this.biomeFound(b);\n")
# shop: equipped gear can be sold too (two taps to confirm)
sub("""      h += `<h3>Trang bị trong túi (${P.stash.length}/30)</h3><div class="srows">`;""",
"""      const worn = [...SLOT_ORDER.map(s => P.equip[s]), ...ARMOR_SLOTS.map(s => P.armor[s]), ...P.relics].filter(Boolean);
      if (worn.length) {
        h += '<h3>Đang trang bị <small>— bấm BÁN hai lần để xác nhận</small></h3><div class="srows">';
        for (const it of worn) { const r = RARITY[it.rarity]; h += `<div class="srow worn" style="--rc:${r.color}"><img src="${IMG[Loot.iconOf(it)].src}" alt=""><div class="sinfo"><b style="color:${r.color}">${esc(it.name)}</b><small>ĐANG DÙNG • ${r.name} • Cấp ${it.ilvl}</small></div>${coin(Loot.price(it))}<button data-sellw="${it.uid}">BÁN</button></div>`; }
        h += '</div>';
      }
      h += `<h3>Trang bị trong túi (${P.stash.length}/30)</h3><div class="srows">`;""")
sub("    const sellItem = (id, n) => {", """    box.querySelectorAll('[data-sellw]').forEach(b => b.onclick = () => {
      if (!b.dataset.armed) { b.dataset.armed = 1; b.textContent = 'CHẮC CHƯA?'; b.classList.add('warn'); setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = 'BÁN'; b.classList.remove('warn'); } }, 2500); return; }
      const uid = +b.dataset.sellw;
      let it = null;
      for (const s of SLOT_ORDER) if (P.equip[s] && P.equip[s].uid === uid) { it = P.equip[s]; P.equip[s] = null; P.wcache = {}; if (P.weapon === s) P.weapon = 'melee'; if (s !== 'melee') { P.inv[AMMO_OF[s]] = (P.inv[AMMO_OF[s]] || 0) + (P.mags[s] || 0); P.mags[s] = 0; } }
      for (const s of ARMOR_SLOTS) if (P.armor[s] && P.armor[s].uid === uid) { it = P.armor[s]; P.armor[s] = null; P.applyGear(); }
      P.relics.forEach((r, i) => { if (r && r.uid === uid) { it = r; P.relics[i] = null; G.applyRelics(); } });
      if (!it) return;
      G.earn(Loot.price(it)); this.shopSay('sell'); this.buildShop();
    });
    const sellItem = (id, n) => {""")
save()

# ---------------- data2.js: ticket names per world ----------------
load('js/data2.js')
sub("  if (id === 'gold') { d.name = cur().name; d.icon = cur().icon; }", "  if (id === 'gold') { d.name = cur().name; d.icon = cur().icon; }\n  if (id === 'ticket') { const t = TICKET[rk(RL.id)]; d.name = t.name; d.icon = t.icon; }")
save()

# ---------------- realms.js: images ----------------
load('js/realms.js')
sub("  for (let i = 0; i < 8; i++) add('ui_' + i);\n", "  for (let i = 0; i < 8; i++) { add('ui_' + i); add('pet_' + i); }\n  for (let i = 0; i < 12; i++) add('w_' + i);\n  add(['ev_goblin', 'ev_mimic', 'ev_star', 'ev_altar', 'ev_egg', 'tk_' + k]);\n")
save()

# ---------------- world.js: wonders + altar + mimics ----------------
load('js/world.js')
sub("  biomeOfPos(x, y) {", """  // a landmark sits in about 1 of 20 wild blocks, computable without generating the block
  wonderAt(sx, sy) {
    if (this.mode !== 'over' || Math.hypot(sx, sy) < 4 || this.zoneOf(sx, sy) !== 0) return null;
    if (h3(sx, sy, 77) > 0.05) return null;
    if (typeof Story !== 'undefined' && Story.poiAt(sx, sy)) return null;
    const b = this.biomeAt(sx + 0.5, sy + 0.5);
    const i = WONDERS.findIndex(w => w.biome === b);
    return i >= 0 ? i : null;
  },
  genWonder(bk, w, sb) {
    const cx = Math.floor((bk.x0 + bk.x1) / 2), cy = Math.floor((bk.y0 + bk.y1) / 2);
    sb.poi = { kind: 'wonder', w };
    this.reserve(cx - 9, cy - 9, cx + 9, cy + 10);
    this.addProp(WONDERS[w].img, cx * TILE + 16, cy * TILE, { r: 78, kind: 'wonder', data: { w }, light: 220, lightCol: 'white' });
    this.chest(cx, cy + 6, this.rollChest(2));
    this.spawnGuards(cx * TILE, (cy + 6) * TILE, 5, { r: 240, elite: 0.35 });
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; this.tryTree(Math.round(cx + Math.cos(a) * 11), Math.round(cy + Math.sin(a) * 11), false); }
  },
  biomeOfPos(x, y) {""")
sub("    else if (forced) this.genPOI(bk, forced, sb);\n    else {",
    "    else if (forced) this.genPOI(bk, forced, sb);\n    else if (this.wonderAt(sx, sy) != null) this.genWonder(bk, this.wonderAt(sx, sy), sb);\n    else {")
sub("    this._gen.spawns.push({ kind: 'merchant', x: (cx + 4) * TILE, y: (cy + 6) * TILE + 8 });",
    "    this._gen.spawns.push({ kind: 'merchant', x: (cx + 4) * TILE, y: (cy + 6) * TILE + 8 });\n"
    "    this.addProp('ev_altar', (cx - 7) * TILE, (cy + 5) * TILE, { r: 22, kind: 'altar', light: 140, lightCol: 'magenta' });")
sub("  chest(tx, ty, tier) { return this.container('chest_' + tier, tx, ty, 'chest', { kind: 'chest', r: 12, data: { tier } }); },",
    "  chest(tx, ty, tier) { return this.container('chest_' + tier, tx, ty, 'chest', { kind: 'chest', r: 12, data: { tier, mimic: tier >= 1 && SR.chance(0.08) } }); },")
# minimap marker for wonders
sub("    if (sb.poi && sb.poi.kind === 'ruins') dot(14, 14, 4, [190, 90, 255]);", "    if (sb.poi && sb.poi.kind === 'ruins') dot(14, 14, 4, [190, 90, 255]);\n    if (sb.poi && sb.poi.kind === 'wonder') dot(13, 13, 6, [255, 230, 160]);")
save()
print('hooks ok')
