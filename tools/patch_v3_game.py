"""v3 game logic hooks: currency, armor, chests, merchants, random bosses, gender, sworn siblings."""
import os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
p = os.path.join(ROOT, 'js/game.js')
s = open(p, encoding='utf-8').read()
def sub(a, b, n=1):
    global s
    if a not in s: raise SystemExit('MISSING: ' + a[:90])
    s = s.replace(a, b, n)

# ---- new game / save / load ----
sub("  newGame(realm, seed, hero) {", "  newGame(realm, seed, hero, gender) {")
sub("    Story.init(realm, seed, hero || R.pick(LORE[realm].heroNames));", "    Story.init(realm, seed, hero || R.pick(LORE[realm].heroNames), gender || 'm');")
sub("    P.inv = { ammo_pistol: 30, bandage: 2, food: 1, water: 1 };", "    P.inv = { ammo_pistol: 30, bandage: 2, food: 1, water: 1, scroll: 1 };\n    P.gold = 25;")
sub("relics: P.relics, stash: P.stash,", "relics: P.relics, stash: P.stash, armor: P.armor, gold: P.gold, gearHp: P.gearHp,")
sub("stats: this.stats, ach: this.achieved, delta, explored: [...World.explored].slice(-4000),",
    "stats: this.stats, ach: this.achieved, delta, explored: [...World.explored].slice(-4000), heartBuys: this.heartBuys || 0,")
sub("    try { localStorage.setItem('tt_save_v2', JSON.stringify(data)); } catch (e) {}",
    "    try { localStorage.setItem('tt_save_v2', JSON.stringify(data)); } catch (e) {}\n    return data;")
sub("    Object.assign(this.player, d.p);", "    Object.assign(this.player, d.p);\n    if (!this.player.armor) this.player.armor = { head: null, body: null, legs: null, feet: null };\n    this.player.gold = this.player.gold || 0; this.player.applyGear();\n    this.heartBuys = d.heartBuys || 0;")
sub("const c = this.companions[i]; Object.assign(c, s);", "const c = this.companions[i]; Object.assign(c, s); this.setupBond(c);")
sub("this.comps.map(c => ({ aff: c.aff, stage: c.stage, joined: c.joined, lover: c.lover, scenePending: c.scenePending }))",
    "this.comps.map(c => ({ aff: c.aff, stage: c.stage, joined: c.joined, lover: c.lover, sworn: c.sworn, scenePending: c.scenePending }))") if "this.comps.map" in s else None
sub("comps: this.companions.map(c => ({ aff: c.aff, stage: c.stage, joined: c.joined, lover: c.lover, scenePending: c.scenePending })),",
    "comps: this.companions.map(c => ({ aff: c.aff, stage: c.stage, joined: c.joined, lover: c.lover, sworn: c.sworn, scenePending: c.scenePending })),")

# ---- items / currency ----
sub("""    const it = ITEMS[id];
    if (!it) return;
    P.inv[id] = (P.inv[id] || 0) + n;
    const nm = it.kind === 'ammo' ? RL.ammoNames[['ammo_pistol', 'ammo_shell', 'ammo_rifle'].indexOf(id)] : it.name;
    Floaters.add(P.x, P.y - 22, `+${n} ${nm}`, it.kind === 'ammo' ? '#ffd76a' : '#b8f28a', 9);
    Sound.play('sfx_pickup', 0.3, 1.2);""", """    const it = itm(id);
    if (!it) return;
    if (id === 'key' && !RL.cars) { id = 'gold'; n = 10; }
    if (id === 'gold') { P.gold += n; Floaters.add(P.x, P.y - 22, `+${n} ${cur().name}`, cur().col, 9); Sound.play('sfx_coin', 0.3, 1.3); UI.dirty = true; return; }
    P.inv[id] = (P.inv[id] || 0) + n;
    Floaters.add(P.x, P.y - 22, `+${n} ${it.name}`, it.kind === 'ammo' ? '#ffd76a' : '#b8f28a', 9);
    Sound.play('sfx_pickup', 0.3, 1.2);""")

# ---- gear: armor slots, bigger bag ----
sub("""    } else {
      const empty = P.relics.indexOf(null);""", """    } else if (item.kind === 'armor') {
      const cur = P.armor[item.slot];
      if (!cur || Loot.power(item) > Loot.power(cur) * 1.05) { if (cur) this.stashAdd(cur); P.armor[item.slot] = item; equipped = true; P.applyGear(); }
    } else {
      const empty = P.relics.indexOf(null);""")
sub("    if (P.stash.length > 18) { // auto-salvage the weakest", "    if (P.stash.length > 30) { // auto-salvage the weakest")
sub("    if (item.kind === 'weapon') { if (P.equip[item.slot]) P.stash.push(P.equip[item.slot]); P.equip[item.slot] = item; P.wcache = {}; P.reloading = 0; }\n    else {",
    "    if (item.kind === 'weapon') { if (P.equip[item.slot]) P.stash.push(P.equip[item.slot]); P.equip[item.slot] = item; P.wcache = {}; P.reloading = 0; }\n"
    "    else if (item.kind === 'armor') { if (P.armor[item.slot]) P.stash.push(P.armor[item.slot]); P.armor[item.slot] = item; P.applyGear(); }\n    else {")

# ---- armor reduces damage ----
sub("    if (P.perks.armor) dmg *= Math.pow(0.88, P.perks.armor);",
    "    if (P.perks.armor) dmg *= Math.pow(0.88, P.perks.armor);\n    if (P.armorVal) dmg *= 100 / (100 + P.armorVal);")

# ---- drops: armor in the pool, currency from every kill ----
sub("        const item = Math.random() < 0.25 ? Loot.relic(z.lvl, Loot.rollRarity(bonus)) : Loot.randomWeapon(z.lvl, bonus);",
    "        const item = Loot.randomGear(z.lvl, bonus);")
sub("    if (Math.random() < (z.elite ? 0.8 : 0.14 + luck * 0.1)) {",
    "    if (Math.random() < (z.boss ? 1 : z.elite ? 0.9 : 0.3)) Items.drop(z.x, z.y, 'gold', Math.round((z.boss ? 60 : z.elite ? 12 : 2) * (1 + z.lvl * 0.15) * R.range(0.7, 1.3)));\n"
    "    if (Math.random() < (z.elite ? 0.8 : 0.14 + luck * 0.1)) {")
sub("      Items.drop(z.x, z.y, 'medkit', 2);", "      Items.drop(z.x, z.y, 'medkit', 2);\n      if (z.mini) World.addProp('chest_' + (Math.random() < 0.3 ? 3 : 2), z.x, z.y + 40, { container: 'chest', kind: 'chest', r: 12, data: { tier: Math.random() < 0.3 ? 3 : 2 } });")
sub("    if (Math.random() < 0.6) Items.dropGear(a.x, a.y, Math.random() < 0.3 ? Loot.relic(World.levelAt(a.x, a.y), Loot.rollRarity(0.8)) : Loot.randomWeapon(World.levelAt(a.x, a.y), 0.8));",
    "    if (Math.random() < 0.6) Items.dropGear(a.x, a.y, Loot.randomGear(World.levelAt(a.x, a.y), 0.8));\n    Items.drop(a.x, a.y, 'gold', R.int(10, 25));")

# ---- spawns: merchants, random bosses ----
sub("      else if (s.kind === 'civ') this.allies.push(new Ally('civ', s.x, s.y, { img: RL.npc[s.sprite] }));",
    "      else if (s.kind === 'civ') this.allies.push(new Ally('civ', s.x, s.y, { img: RL.npc[s.sprite] }));\n"
    "      else if (s.kind === 'merchant') { if (!this.allies.some(a => a.kind === 'merchant' && dist(a.x, a.y, s.x, s.y) < 40)) this.spawnMerchant(s.x, s.y); }")
sub("""        const name = s.story ? Story.names.villain : (RL.dungeon.name + ' — ' + RL.enemyNames[6]);
        const z = this.spawnEnemy('boss', s.x, s.y, { lvl, name, story: s.story, hpMul: s.story ? 1.4 : World.mode === 'dungeon' ? 0.55 + World.dg.floor * 0.12 : 1, guard: true });
        z.dungeon = !!s.dungeon;""", """        const rnd = mulberry32((s.seed || ((World.dg && World.dg.seed) || this.seed) + Math.floor(s.x) * 7 + Math.floor(s.y) * 13) | 0);
        const bd = rollBoss(RL.id, rnd);
        const title = (bd.mod ? bd.mod.name + ' ' : '') + bd.def.name;
        const name = s.story ? Story.names.villain + ' — ' + bd.def.name : title;
        const hpMul = (s.story ? 1.4 : s.mini ? 0.5 : World.mode === 'dungeon' ? 0.55 + World.dg.floor * 0.12 : 1) * (bd.mod && bd.mod.hp || 1);
        const z = this.spawnEnemy('boss', s.x, s.y, { lvl: lvl + (s.mini ? 1 : 0), name, story: s.story, hpMul, guard: true, bossDef: bd });
        z.dungeon = !!s.dungeon; z.mini = !!s.mini;
        if (s.mini) { this.toast(`⚠ Phát hiện boss: ${title}`, 'warn'); }""")

# ---- interaction: shop, chests ----
sub("      else if (a.kind === 'civ' && !a.rescued) { best = { ally: a, kind: 'civ', label: 'Giải cứu người dân' }; bd = d; }",
    "      else if (a.kind === 'civ' && !a.rescued) { best = { ally: a, kind: 'civ', label: 'Giải cứu người dân' }; bd = d; }\n"
    "      else if (a.kind === 'merchant') { best = { ally: a, kind: 'shop', label: `Giao dịch với ${a.name}` }; bd = d; }")
sub("    for (const a of this.allies) {\n      const d = dist(P.x, P.y, a.x, a.y);\n      if (d > 50) continue;",
    "    for (const a of this.allies) {\n      const d = dist(P.x, P.y, a.x, a.y);\n      if (d > (a.kind === 'merchant' ? 60 : 50)) continue;")
sub("      else if (p.container && !p.looted) { best = { prop: p, kind: 'loot', label: 'Lục soát' +",
    "      else if (p.container === 'chest' && !p.looted) { best = { prop: p, kind: 'loot', label: 'Mở ' + CHESTS[p.data.tier].name }; bd = d; }\n"
    "      else if (p.container && !p.looted) { best = { prop: p, kind: 'loot', label: (p.container === 'crystal' ? 'Khai thác' : p.container === 'grave' ? 'Đào mộ' : 'Lục soát') +")
sub("      case 'loot': return this.startAction({ kind: 'loot', prop: it.prop, label: it.label, dur: ['vault', 'artifact', 'dchest', 'boss'].includes(it.prop.container) ? 1.4 : 0.8 });",
    "      case 'loot': return this.startAction({ kind: 'loot', prop: it.prop, label: it.label, dur: it.prop.container === 'chest' ? CHESTS[it.prop.data.tier].time : ['vault', 'artifact', 'dchest', 'boss'].includes(it.prop.container) ? 1.4 : 0.8 });\n"
    "      case 'shop': return UI.openShop(it.ally);")

# ---- looting: chests, crystals, graves ----
sub("    const kind = p.container;\n    if (kind === 'start1')",
    "    const kind = p.container;\n"
    "    if (kind === 'chest') { this.openChest(p); return; }\n"
    "    if (kind === 'crystal') { give('gold', R.int(15, 35) + lvl * 2); give(Math.random() < 0.5 ? 'battery' : 'ammo_rifle', Math.random() < 0.5 ? 1 : R.int(10, 20)); if (Math.random() < 0.12) gear(0.8); Particles.burst(p.x, p.y, 16, '#b07bff', 160); Sound.play('sfx_freeze', 0.5, 1.4); return; }\n"
    "    if (kind === 'grave') {\n"
    "      if (Math.random() < 0.4) { const z = this.spawnEnemy(R.pick(['walker', 'armored', 'runner']), p.x + R.range(-20, 20), p.y + 26, { state: 'chase', rise: true, elite: Math.random() < 0.2 }); Sound.at(this.groanSfx(), z.x, z.y, 0.8); this.toast('Có thứ gì đó trồi lên từ mộ!', 'warn'); }\n"
    "      give('gold', R.int(8, 25)); if (Math.random() < 0.18) gear(0.6); else give(R.pick(['bandage', 'pills', 'flower', 'scrap']), 1); return;\n"
    "    }\n"
    "    if (kind === 'start1')")
sub("    const gear = (bonus, n = 1) => { for (let i = 0; i < n; i++) Items.dropGear(p.x, p.y, Math.random() < 0.3 ? Loot.relic(lvl, Loot.rollRarity(bonus + luck)) : Loot.randomWeapon(lvl, bonus + luck)); };",
    "    const gear = (bonus, n = 1) => { for (let i = 0; i < n; i++) Items.dropGear(p.x, p.y, Loot.randomGear(lvl, bonus + luck)); };")
sub("      for (let i = 0; i < rolls; i++) {\n        const tbl = {}; table.forEach((e, k) => tbl[k] = e[1]);",
    "      if (Math.random() < 0.35) give('gold', R.int(2, 8) + Math.floor(lvl / 2));\n      for (let i = 0; i < rolls; i++) {\n        const tbl = {}; table.forEach((e, k) => tbl[k] = e[1]);")

# ---- dungeon reward is a real chest ----
sub("      World.addProp('fx_3', z.x, z.y + 30, { container: 'boss', r: 14 });",
    "      const tier = RANKS.indexOf(dg.rank) >= 2 ? 3 : 2;\n      World.addProp('chest_' + tier, z.x, z.y + 30, { container: 'chest', kind: 'chest', r: 12, data: { tier, bonus: RANKS.indexOf(dg.rank) * 0.4 } });")

# ---- sworn siblings revive too ----
sub("    const lover = this.companions.find(c => c.lover && c.ally && !c.ally.downed && (c.reviveDay || 0) !== this.day);",
    "    const lover = this.companions.find(c => (c.lover || c.sworn) && c.ally && !c.ally.downed && (c.reviveDay || 0) !== this.day);")
sub("      else { lover.reviveDay = this.day; this.toast(`${lover.data.name} ôm lấy bạn: \"Đừng bỏ em/anh lại!\" — bạn hồi sinh!`, 'love'); }",
    "      else { lover.reviveDay = this.day; this.toast(lover.lover ? `${lover.data.name} ôm lấy bạn: \"Đừng bỏ lại tôi!\" — bạn hồi sinh!` : `${lover.data.name} kéo bạn dậy: \"Đã kết nghĩa thì không được chết trước!\" — bạn hồi sinh!`, 'love'); }")

# ---- item names through itm() ----
sub("    this.toast(`Chế tạo: ${ITEMS[r.out].name} x${r.n}`, 'good');", "    this.toast(`Chế tạo: ${itm(r.out).name} x${r.n}`, 'good');")
sub("this.toast(`Không có ${ITEMS[kind].name}. Chế tạo bằng [C].`, 'warn');", "this.toast(`Không có ${itm(kind).name}. Chế tạo bằng [C].`, 'warn');")
open(p, 'w', encoding='utf-8', newline='\n').write(s)

# ---- story.js: gender + friendship track ----
p = os.path.join(ROOT, 'js/story.js')
s = open(p, encoding='utf-8').read()
sub("  init(realm, seed, hero) {", "  init(realm, seed, hero, gender) {")
sub("    this.act = 0; this.count = 0; this.finished = false;", "    this.act = 0; this.count = 0; this.finished = false; this.gender = gender || 'm';")
sub("  serialize() { return { realm: this.realm,", "  serialize() { return { gender: this.gender, realm: this.realm,")
sub("  load(d) { Object.assign(this, d); },", "  load(d) { this.gender = 'm'; Object.assign(this, d); },")
sub("""      data: Object.assign({}, d, { name: d.name, portrait: RL.port[i] || d.portrait, sprite: RL.npc[RL.compSprite[i]] }),
    }));""", """      data: Object.assign({}, d, { name: d.name, portrait: RL.port[i] || d.portrait, sprite: RL.npc[RL.compSprite[i]] }),
    }));
    this.companions.forEach(c => this.setupBond(c));
  },
  // same gender as the hero -> sworn-sibling friendship instead of romance
  setupBond(c) {
    const d = LORE[RL.id].companions[c.idx];
    c.romance = d.gender !== (Story.gender || 'm');
    if (!c.romance && d.bond) { c.data.stages = d.bond; c.data.stagesExpr = null; c.data.stagesReplyExpr = null; }
    else { c.data.stages = d.stages; c.data.stagesExpr = d.stagesExpr; c.data.stagesReplyExpr = d.stagesReplyExpr; }""")
sub("""      this.toast(`♥ ${c.data.name} muốn nói chuyện riêng với bạn... (đến gần, nhấn E)`, 'love');""",
    """      this.toast(`${c.romance ? '♥' : '★'} ${c.data.name} muốn nói chuyện riêng với bạn... (đến gần, nhấn E)`, 'love');""")
sub("""    if (Math.floor(before / 10) !== Math.floor(c.aff / 10) && n > 0 && c.ally) Floaters.add(c.ally.x, c.ally.y - 30, '♥', '#ff8ab8', 14, true);""",
    """    if (Math.floor(before / 10) !== Math.floor(c.aff / 10) && n > 0 && c.ally) Floaters.add(c.ally.x, c.ally.y - 30, c.romance ? '♥' : '★', c.romance ? '#ff8ab8' : '#ffd23a', 14, true);""")
sub("""  addAff(c, n) {
    if (!c || c.aff >= 100 && c.lover) return;""", """  addAff(c, n) {
    if (!c || c.aff >= 100 && (c.lover || c.sworn)) return;""")
sub("""      title: '♥ ' + Story.fmt(sc.title), name: c.data.name, portrait: c.data.portrait,
      lines: sc.lines.map(l => ({ who: l.who, text: Story.fmt(l.text) })),
      choices: sc.choices.map(ch => ({ text: Story.fmt(ch.text), reply: Story.fmt(ch.reply), aff: ch.aff })),""",
    """      title: (c.romance ? '♥ ' : '★ ') + Story.fmt(sc.title), name: c.data.name, portrait: c.data.portrait, romance: c.romance,
      lines: sc.lines.map((l, i) => ({ who: l.who, text: Story.fmt(l.text), e: l.e || (c.data.stagesExpr && c.data.stagesExpr[c.stage] && c.data.stagesExpr[c.stage][i]) })),
      choices: sc.choices.map((ch, i) => ({ text: Story.fmt(ch.text), reply: Story.fmt(ch.reply), aff: ch.aff, e: ch.e || (c.data.stagesReplyExpr && c.data.stagesReplyExpr[c.stage] && c.data.stagesReplyExpr[c.stage][i]) })),""")
sub("""        if (c.stage >= 5) {
          c.lover = true; c.aff = 100;""", """        if (c.stage >= 5 && !c.romance) {
          c.sworn = true; c.aff = 100;
          this.toast('★ ' + String(c.data.bondDone || '{name} và {hero} đã kết nghĩa. (Tri kỷ sẽ hồi sinh bạn 1 lần mỗi ngày)').replace('{name}', c.data.name).replace('{hero}', Story.names.hero), 'love');
          if (c.ally) for (let i = 0; i < 20; i++) Particles.add({ x: c.ally.x, y: c.ally.y, vx: R.range(-60, 60), vy: R.range(-120, -30), life: 1.5, max: 1.5, size: 4, col: '#ffd23a', drag: 1, glow: true });
        } else if (c.stage >= 5) {
          c.lover = true; c.aff = 100;""")
sub("      UI.dialog({ name: c.data.name, portrait: c.data.portrait, lines: [{ who: 'npc', text: Story.fmt(line) }] });",
    "      UI.dialog({ name: c.data.name, portrait: c.data.portrait, romance: c.romance, lines: [{ who: 'npc', text: Story.fmt(line) }] });")
sub("    const gifts = ['flower', 'choco', 'food', 'water', 'energy', 'bandage', 'medkit', 'pills', 'battery'].filter(id => this.has(id));",
    "    const gifts = ['flower', 'choco', 'food', 'water', 'energy', 'bandage', 'medkit', 'pills', 'battery'].filter(id => this.has(id));\n    const heart = c.romance ? '♥' : '★', hollow = c.romance ? '♡' : '☆';")
sub("      opts.push({ text: `Tặng ${ITEMS[id].name}${liked ? ' ♥' : ''}`, act: () => {",
    "      opts.push({ text: `Tặng ${itm(id).name}${liked ? ' ' + heart : ''}`, act: () => {")
sub("        UI.dialog({ name: c.data.name, portrait: c.data.portrait, lines: [{ who: 'npc', text: Story.fmt(R.pick(c.data.gift)) }] });",
    "        UI.dialog({ name: c.data.name, portrait: c.data.portrait, lines: [{ who: 'npc', text: Story.fmt(R.pick(c.data.gift)), e: c.romance && liked ? 'blush' : 'happy' }] });")
sub("    UI.menuDialog({ name: c.data.name, portrait: c.data.portrait, text: `Độ thân mật: ${Math.round(c.aff)}/100 ${'♥'.repeat(c.stage)}${'♡'.repeat(5 - c.stage)}`, options: opts });",
    "    UI.menuDialog({ name: c.data.name, portrait: c.data.portrait, text: `${c.romance ? 'Độ thân mật' : 'Tình nghĩa ' + (c.data.bondTitle ? '(' + c.data.bondTitle + ')' : '')}: ${Math.round(c.aff)}/100 ${heart.repeat(c.stage)}${hollow.repeat(5 - c.stage)}`, options: opts });")
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('game+story ok')
