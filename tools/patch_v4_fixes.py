"""Fixes from the code review (20 items)."""
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

# 1 + 5: story never reads past the last act; sworn siblings don't get the romance ending
load('js/story.js')
sub("  curAct() { return this.finished ? null : this.tpl.acts[this.act]; },", "  curAct() { return this.finished ? null : (this.tpl.acts[this.act] || null); },")
sub("""    if (this.finished) return 'Tự do khám phá — chinh phục các Cổng và tìm bảo vật';
    const a = this.curAct();""", """    const a = this.curAct();
    if (!a) return 'Tự do khám phá — chinh phục các Cổng và tìm bảo vật';""")
sub("  load(d) { this.gender = 'm'; Object.assign(this, d); },", "  load(d) { this.gender = 'm'; Object.assign(this, d); if (!this.finished && this.act >= this.tpl.acts.length) this.finished = true; },")
sub("    const lover = G.companions.find(c => c.lover) || G.companions.filter(c => c.joined).sort((a, b) => b.aff - a.aff)[0];\n    const romance = lover && lover.aff >= 100;",
    "    const lover = G.companions.find(c => c.lover) || G.companions.filter(c => c.joined && c.romance).sort((a, b) => b.aff - a.aff)[0];\n    const romance = !!lover && (lover.lover || lover.aff >= 100);")
save()

load('js/game.js')
# 2: shield relic after load and after the feather is used
sub("    this.player.gold = this.player.gold || 0; this.player.applyGear();", "    this.player.gold = this.player.gold || 0; this.player.applyGear(); this.applyRelics();")
sub("if (feather >= 0) { P.relics[feather] = null; this.toast(", "if (feather >= 0) { P.relics[feather] = null; this.applyRelics(); this.toast(")
# 3: merchants never travel with you
sub("      this.allies = this.allies.filter(a => a.kind !== 'civ');", "      this.allies = this.allies.filter(a => a.kind !== 'civ' && a.kind !== 'merchant');")
s = s.replace("for (const a of this.allies) { a.x = P.x + R.range(-30, 30); a.y = P.y + R.range(10, 40); }", "for (const a of this.allies) if (a.kind !== 'merchant') { a.x = P.x + R.range(-30, 30); a.y = P.y + R.range(10, 40); }")
sub("      for (const a of this.allies) if (a.kind !== 'merchant') { a.x = P.x + R.range(-30, 30); a.y = P.y + R.range(10, 40); }\n      this.allies = this.allies.filter(a => a.kind !== 'civ' && a.kind !== 'merchant');",
    "      this.allies = this.allies.filter(a => a.kind !== 'civ' && a.kind !== 'merchant');\n      for (const a of this.allies) { a.x = P.x + R.range(-30, 30); a.y = P.y + R.range(10, 40); }")
# 4: mini-boss chest sprite matches its tier (and survives save/load, see 9)
sub("      if (z.mini) World.addProp('chest_' + (Math.random() < 0.3 ? 3 : 2), z.x, z.y + 40, { container: 'chest', kind: 'chest', r: 12, data: { tier: Math.random() < 0.3 ? 3 : 2 } });",
    "      if (z.mini) World.keepChest(z.x, z.y + 40, Math.random() < 0.3 ? 3 : 2, 0.5);")
# 7: interact with the nearest ally; reviving beats shopping
sub("""      const d = dist(P.x, P.y, a.x, a.y);
      if (d > (a.kind === 'merchant' ? 60 : 50)) continue;""", """      const d = dist(P.x, P.y, a.x, a.y);
      if (d > (a.kind === 'merchant' ? 60 : 50) || (best && d > bd && !(a.kind === 'comp' && a.downed))) continue;""")
sub("    let best = null, bd = 52;\n    for (const a of this.allies) {", "    let best = null, bd = 60;\n    for (const a of this.allies) {")
sub("    if (best && best.kind !== 'shop') return best;\n    if (best) bd = Math.min(bd, 30);", "    if (best && best.kind !== 'shop') return best;\n    bd = best ? Math.min(bd, 30) : 52;")
# 8: per-run state resets
sub("  newGame(realm, seed, hero, gender) {\n", "  newGame(realm, seed, hero, gender) {\n    this.heartBuys = 0; this.lastTitle = null; this.biome = this.biomeAmb = null; this.dgTarget = null; this.transit = false;\n")
# 13: crystal mining
sub("give(Math.random() < 0.5 ? 'battery' : 'ammo_rifle', Math.random() < 0.5 ? 1 : R.int(10, 20));", "if (Math.random() < 0.5) give('battery', 1); else give('ammo_rifle', R.int(10, 20));")
# 16: revive cooldown survives reloads
sub("sworn: c.sworn, scenePending: c.scenePending }))", "sworn: c.sworn, scenePending: c.scenePending, reviveDay: c.reviveDay }))")
# 18: no double transitions during the fade
sub("  enterGate(p) {\n    const P = this.player;", "  enterGate(p) {\n    const P = this.player;\n    if (this.transit) return; this.transit = true;")
sub("  descend() {\n    const P = this.player;", "  descend() {\n    const P = this.player;\n    if (this.transit) return; this.transit = true;")
sub("  exitDungeon() {\n    const P = this.player;", "  exitDungeon() {\n    const P = this.player;\n    if (this.transit) return; this.transit = true;")
sub("      const dg = { rank, floor: 1,", "      this.transit = false;\n      const dg = { rank, floor: 1,")
sub("      const dg = World.dg; this.dgTarget = null;", "      this.transit = false;\n      const dg = World.dg; this.dgTarget = null;")
sub("      World.mode = 'over'; this.dgTarget = null;", "      World.mode = 'over'; this.dgTarget = null; this.transit = false;")
# 20: the next floor starts clean
sub("      dg.floor++; dg.level += 2;\n      World.enterDungeon(dg);\n      this.zombies = [];", "      dg.floor++; dg.level += 2;\n      World.enterDungeon(dg);\n      Throws.fires = []; Throws.acids = []; Throws.traps = []; Throws.list = [];\n      this.zombies = [];")
save()

# 6: quick bar and hotbar take clicks
load('css/v2.css')
s += "\n#quick .qslot, #hotbar .hslot { pointer-events: auto; cursor: pointer; }\n"
save()

# 11: regenerated open chests get the open sprite's size
load('js/world.js')
sub("      if (d && d.looted && d.looted.has(idx)) { p.looted = true; if (p.container === 'chest') p.img = 'chest_' + p.data.tier + 'o'; }",
    "      if (d && d.looted && d.looted.has(idx)) { p.looted = true; if (p.container === 'chest') { p.img = 'chest_' + p.data.tier + 'o'; const im = IMG[p.img]; if (im) { p.w = im.width / 2; p.h = im.height / 2; } } }")
save()

# 12: Tu Tiên melee already has sword-wave built in
load('js/loot.js')
sub("    if (slot === 'melee' && RL.weapons.melee.wave && !it.affixes.includes('wave') && rarity >= 2) it.affixes.push('wave');\n", "")
save()

# 14 + 15: keep a typed name; no blushing between sworn siblings
load('js/v3.js')
sub("if (UI.pickedRealm) UI.refreshPick(true); };", "if (UI.pickedRealm) UI.refreshPick(false); };")
# 9 / 10: purchased chests persist; loot that lands after a world change goes to the player
sub("      World.addProp('chest_' + t, x, y, { container: 'chest', kind: 'chest', r: 12, data: { tier: t, bonus: 0.3 } });", "      World.keepChest(x, y, t, 0.3);")
sub("    drops.forEach((f, i) => setTimeout(() => { if (this.player === P && !P.dead) { f(); Particles.burst(p.x, p.y - 4, 5, C.col, 120); } }, 160 + i * 150));",
    """    const token = World.mode + (World.dg ? World.dg.floor : '');
    drops.forEach((f, i) => setTimeout(() => {
      if (this.player !== P || P.dead) return;
      if (token !== World.mode + (World.dg ? World.dg.floor : '')) { p = { x: P.x, y: P.y, data: p.data }; }
      f(p); Particles.burst(p.x, p.y - 4, 5, C.col, 120);
    }, 160 + i * 150));""")
s = s.replace("drops.push(() => Items.drop(p.x, p.y, 'gold',", "drops.push(q => Items.drop(q.x, q.y, 'gold',")
s = s.replace("drops.push(() => Items.dropGear(p.x, p.y, Loot.randomGear(lvl, gb + bonus, mr)));", "drops.push(q => Items.dropGear(q.x, q.y, Loot.randomGear(lvl, gb + bonus, mr)));")
s = s.replace("drops.push(() => Items.drop(p.x, p.y, c[0], c[1]));", "drops.push(q => Items.drop(q.x, q.y, c[0], c[1]));")
s = s.replace("drops.push(() => Items.drop(p.x, p.y, 'heart', 1));", "drops.push(q => Items.drop(q.x, q.y, 'heart', 1));")
sub("  openChest(p) {\n    const tier", "  openChest(p) {\n    if (p.data && p.data.keep) World.unkeep(p.data.keep);\n    const tier")
# 17: the item you tap is the item you use
sub("    if (['medkit', 'bandage', 'pills'].includes(id)) useHeal();\n    if (['food', 'water', 'choco', 'energy'].includes(id)) useFood();",
    "    if (['medkit', 'bandage', 'pills'].includes(id)) useHeal(id);\n    if (['food', 'water', 'choco', 'energy'].includes(id)) useFood(id);")
# 19: offline download counts failures and includes every sound
sub("    const audio = new Set(SFX_LIST.concat(['amb_rain', 'amb_wind',", "    const audio = new Set(SFX_LIST.concat(['sfx_heartbeat', 'amb_rain', 'amb_wind',")
sub("    let done = 0;\n    const next = async () => { while (urls.length) { const u = urls.pop(); try { await fetch(u); } catch (e) {} done++; b.textContent = `📥 ĐANG TẢI... ${done}/${total}`; } };",
    "    let done = 0, bad = 0;\n    const next = async () => { while (urls.length) { const u = urls.pop(); try { const r = await fetch(u); if (!r.ok) bad++; } catch (e) { bad++; } done++; b.textContent = `📥 ĐANG TẢI... ${done}/${total}`; } };")
sub("    b.textContent = '✔ ĐÃ TẢI XONG — CHƠI ĐƯỢC OFFLINE';", "    b.textContent = bad ? `⚠ THIẾU ${bad} FILE — BẤM ĐỂ THỬ LẠI` : '✔ ĐÃ TẢI XONG — CHƠI ĐƯỢC OFFLINE';")
save()

load('js/ui.js')
sub("if (who === 'npc' && EXPR_PORTS.has(P)) { const e = line.e || guessExpr(line.text, d.romance !== false); if (e && e !== 'normal') pt = P + '_' + e; }",
    "if (who === 'npc' && EXPR_PORTS.has(P)) { let e = line.e || guessExpr(line.text, d.romance !== false); if (e === 'blush' && d.romance === false) e = 'happy'; if (e && e !== 'normal') pt = P + '_' + e; }")
sub("    const r = this.pickedRealm, L = LORE[r], g = this.pickedGender || 'm';\n    const names = (HERO_NAMES[r] || HERO_NAMES.md)[g];\n    if (newName || !$('heroName').value) $('heroName').value = R.pick(names);",
    "    const r = this.pickedRealm, L = LORE[r], g = this.pickedGender || 'm';\n    const names = (HERO_NAMES[r] || HERO_NAMES.md)[g];\n    const all = Object.values(HERO_NAMES).flatMap(o => o.m.concat(o.f));\n    if (newName || !$('heroName').value || all.includes($('heroName').value)) $('heroName').value = R.pick(names);")
save()

load('js/play.js')
sub("function useHeal() {\n  const P = G.player;\n  if (P.hp >= P.maxHp) { G.toast('Máu đang đầy.', 'info'); return; }\n  const miss = P.maxHp - P.hp;\n  let id = null;\n  if (miss >= 45",
    "function useHeal(want) {\n  const P = G.player;\n  if (P.hp >= P.maxHp) { G.toast('Máu đang đầy.', 'info'); return; }\n  const miss = P.maxHp - P.hp;\n  let id = want && G.has(want) ? want : null;\n  if (id) {}\n  else if (miss >= 45")
sub("function useFood() {\n  const P = G.player;\n  const drink = P.thirst <= P.hunger;\n  const order = drink ? ['water', 'energy', 'food', 'choco'] : ['food', 'choco', 'water', 'energy'];\n  const id = order.find(i => G.has(i));",
    "function useFood(want) {\n  const P = G.player;\n  const drink = P.thirst <= P.hunger;\n  const order = drink ? ['water', 'energy', 'food', 'choco'] : ['food', 'choco', 'water', 'energy'];\n  const id = want && G.has(want) ? want : order.find(i => G.has(i));")
save()

load('sw.js')
sub("  const net = fetch(req).then(res => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; }).catch(() => hit);",
    "  const net = fetch(req).then(res => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; }).catch(() => hit || Response.error());")
sub("const VERSION = 'tt-v4';", "const VERSION = 'tt-v5';")
sub("'js/fx.js', 'js/loot.js', 'js/entities.js', 'js/game.js', 'js/story.js', 'js/ui.js', 'js/play.js', 'js/touch.js', 'js/v3.js',",
    "'js/fx.js', 'js/loot.js', 'js/entities.js', 'js/game.js', 'js/story.js', 'js/ui.js', 'js/play.js', 'js/touch.js', 'js/v3.js', 'js/v4.js',")
save()

# 9: chests placed at runtime (bought, gacha, mini-boss) are remembered across unloads and saves
load('js/v4.js')
s += """
// ---------- chests that must survive unloading and saving ----------
Object.assign(World, {
  keep: [],
  keepChest(x, y, tier, bonus) {
    if (this.mode !== 'over') { const p = this.addProp('chest_' + tier, x, y, { container: 'chest', kind: 'chest', r: 12, data: { tier, bonus } }); return p; }
    const e = { x, y, tier, bonus: bonus || 0 };
    this.keep.push(e); this.placeKept(e);
    return e.prop;
  },
  placeKept(e) {
    if (e.prop || this.mode !== 'over' || this._gen || !this.sbs.has(nkey(Math.floor(e.x / SBPX), Math.floor(e.y / SBPX)))) return;
    e.prop = this.addProp('chest_' + e.tier, e.x, e.y, { container: 'chest', kind: 'chest', r: 12, data: { tier: e.tier, bonus: e.bonus, keep: e } });
  },
  unkeep(e) { const i = this.keep.indexOf(e); if (i >= 0) this.keep.splice(i, 1); },
});
const _wUpdate = World.update, _wUnload = World.unload, _wReset = World.reset;
World.update = function (px, py) { _wUpdate.call(this, px, py); if (this.keep.length && G.frame % 15 === 0) for (const e of this.keep) if (!e.prop) this.placeKept(e); };
World.unload = function (sb) { for (const e of this.keep) if (e.prop && Math.floor(e.x / SBPX) === sb.sx && Math.floor(e.y / SBPX) === sb.sy) e.prop = null; _wUnload.call(this, sb); };
World.reset = function () { for (const e of this.keep || []) e.prop = null; _wReset.call(this); };
"""
sub("  v4Save() { return { pets: this.pets, activePet: this.activePet, pity5: this.pity5, pity4: this.pity4, codex: this.codex }; },",
    "  v4Save() { return { pets: this.pets, activePet: this.activePet, pity5: this.pity5, pity4: this.pity4, codex: this.codex, keep: World.keep.map(e => ({ x: e.x, y: e.y, tier: e.tier, bonus: e.bonus })), pending: this.pendingChests || [] }; },")
sub("    this.petE = null; this.applyPet();\n  },", "    this.petE = null; this.applyPet();\n    World.keep = (d.keep || []).map(e => Object.assign({}, e)); this.pendingChests = d.pending || [];\n  },")
sub("    if (this.pendingChests && this.pendingChests.length && this.state === 'playing') {\n      for (const t of this.pendingChests) { const a = R.range(0, TAU); World.addProp('chest_' + t, P.x + Math.cos(a) * 50, P.y + Math.sin(a) * 50, { container: 'chest', kind: 'chest', r: 12, data: { tier: t, bonus: 0.5 } });",
    "    if (this.pendingChests && this.pendingChests.length && this.state === 'playing' && World.mode === 'over') {\n      for (const t of this.pendingChests) { const a = R.range(0, TAU); World.keepChest(P.x + Math.cos(a) * 50, P.y + Math.sin(a) * 50, t, 0.5);")
save()
print('fixes ok')
