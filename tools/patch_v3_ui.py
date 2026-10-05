"""v3 UI: gender pick, expressions, armor slots, per-world item names, minimap markers."""
import os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
P = os.path.join(ROOT, 'js/ui.js')
s = open(P, encoding='utf-8').read()
def sub(a, b, n=1):
    global s
    if a not in s: raise SystemExit('MISSING: ' + a[:90])
    s = s.replace(a, b, n)

# ---- world pick: gender, names, companion roles ----
sub("""    $('heroName').value = R.pick(L.heroNames);
    $('pickComps').innerHTML = L.companions.map((c, i) => `<div class="pc"><img src="assets/img/${REALMS[r].port[i]}.jpg" alt=""><b>${esc(c.name)}</b><span>${esc(c.role)}</span></div>`).join('');""",
"""    this.refreshPick(true);""")
sub("  startWorld() {", """  refreshPick(newName) {
    const r = this.pickedRealm, L = LORE[r], g = this.pickedGender || 'm';
    const names = (HERO_NAMES[r] || HERO_NAMES.md)[g];
    if (newName || !$('heroName').value) $('heroName').value = R.pick(names);
    $('pickComps').innerHTML = L.companions.map((c, i) => {
      const rom = c.gender !== g;
      return `<div class="pc"><img src="assets/img/${REALMS[r].port[i]}.jpg" alt=""><b>${esc(c.name)}</b><span>${esc(c.role)}</span><em class="${rom ? 'rom' : 'bond'}">${rom ? '♥ Có thể thành người thương' : '★ ' + esc(c.bondTitle || 'Kết nghĩa')}</em></div>`;
    }).join('');
  },
  startWorld() {""")
sub("    this.loadRealm(r, () => { G.newGame(r, null, name); G.start(true); });", "    this.loadRealm(r, () => { G.newGame(r, null, name, this.pickedGender || 'm'); G.start(true); });")
sub("    loadImages(COMMON_IMAGES.concat(realmImages(r)), p => this.setLoad(p)).then(() => { G.whiteCache = {}; G.darkCache = {}; G.shadowCache = {}; cb(); });",
    """    loadImages(COMMON_IMAGES.concat(realmImages(r)), p => this.setLoad(p)).then(() => {
      G.whiteCache = {}; G.darkCache = {}; G.shadowCache = {};
      // prefetch portrait expressions and theme the touch buttons for this world
      for (const pt of REALMS[r].port) if (EXPR_PORTS.has(pt)) for (const e of EXPRESSIONS) { const im = new Image(); im.src = `assets/img/${pt}_${e}.jpg`; }
      RL = REALMS[r];
      for (const [k, id] of [['KeyH', 'medkit'], ['KeyF', 'food'], ['KeyG', 'grenade']]) { const b = document.querySelector(`#tbtns [data-k="${k}"] img`); if (b) b.src = IMG[itm(id).icon].src; }
      cb();
    });""")

# ---- dialog portraits follow the expression of each line ----
sub("""    $('dPort').style.display = who === 'npc' && P ? '' : 'none';
    if (P) $('dPort').src = 'assets/img/' + P + '.jpg';""", """    $('dPort').style.display = who === 'npc' && P ? '' : 'none';
    if (P) {
      let pt = P;
      if (who === 'npc' && EXPR_PORTS.has(P)) { const e = line.e || guessExpr(line.text, d.romance !== false); if (e && e !== 'normal') pt = P + '_' + e; }
      const src = 'assets/img/' + pt + '.jpg';
      if (!$('dPort').src.endsWith(src)) { $('dPort').src = src; $('dPort').classList.remove('pop'); void $('dPort').offsetWidth; $('dPort').classList.add('pop'); }
    }""")
sub("    d.lines = d.lines.concat([{ who: 'hero', text: c.text }]).concat(c.reply ? [{ who: 'npc', text: c.reply + (c.aff >= 7 ? '  ♥' : '') }] : []);",
    "    d.lines = d.lines.concat([{ who: 'hero', text: c.text }]).concat(c.reply ? [{ who: 'npc', text: c.reply + (c.aff >= 7 ? (d.romance === false ? '  ★' : '  ♥') : ''), e: c.e }] : []);")

# ---- crafting / quick bar / items: per-world names and icons ----
sub("    const nm = id => ITEMS[id].kind === 'ammo' ? RL.ammoNames[['ammo_pistol', 'ammo_shell', 'ammo_rifle'].indexOf(id)] : ITEMS[id].name;\n    for (const r of RECIPES) {",
    "    const nm = id => itm(id).name;\n    for (const r of RECIPES) {")
sub("<img src=\"${IMG[ITEMS[k].icon].src}\" alt=\"\">${esc(nm(k))} ${have}/${n}</span>", "<img src=\"${IMG[itm(k).icon].src}\" alt=\"\">${esc(nm(k))} ${have}/${n}</span>")
sub("row.innerHTML = `<img class=\"ricon\" src=\"${IMG[ITEMS[r.out].icon].src}\" alt=\"\"><div class=\"rinfo\"><b>${esc(nm(r.out))} x${r.n}</b><small>${esc(ITEMS[r.out].desc || '')}</small>",
    "row.innerHTML = `<img class=\"ricon\" src=\"${IMG[itm(r.out).icon].src}\" alt=\"\"><div class=\"rinfo\"><b>${esc(nm(r.out))} x${r.n}</b><small>${esc(itm(r.out).desc || '')}</small>")
sub("    const q = [['medkit', 'H'], ['bandage', 'H'], ['food', 'F'], ['water', 'F'], ['grenade', 'G'], ['molotov', 'G'], ['barricade', 'B'], ['trap', 'T']];",
    "    const q = [['medkit', 'H'], ['bandage', 'H'], ['food', 'F'], ['water', 'F'], ['grenade', 'G'], ['molotov', 'G'], ['barricade', 'B'], ['trap', 'T'], ['scroll', 'U']];")
sub("qh += `<div class=\"qslot ${n ? '' : 'none'}\"><img src=\"${IMG[ITEMS[id].icon].src}\" alt=\"\">",
    "qh += `<div class=\"qslot ${n ? '' : 'none'}\" data-q=\"${id}\"><img src=\"${IMG[itm(id).icon].src}\" alt=\"\">")
sub("""        const it = ITEMS[id];
        const nm = it.kind === 'ammo' ? RL.ammoNames[['ammo_pistol', 'ammo_shell', 'ammo_rifle'].indexOf(id)] : it.name;
        h += `<div class="slot" data-id="${id}"><img src="${IMG[it.icon].src}" alt=""><span class="cnt">${P.inv[id]}</span><div class="tip"><b>${esc(nm)}</b><br>${esc(it.desc || '')}</div></div>`;""",
"""        const it = itm(id);
        h += `<div class="slot" data-id="${id}"><img src="${IMG[it.icon].src}" alt=""><span class="cnt">${P.inv[id]}</span><div class="tip"><b>${esc(it.name)}</b><br>${esc(it.desc || '')}</div></div>`;""")
sub("""        if (['medkit', 'bandage', 'pills'].includes(id)) useHeal();
        if (['food', 'water', 'choco', 'energy'].includes(id)) useFood();
        this.buildInv();""", """        if (id === 'scroll') { this.closePanel(); G.useScroll(); return; }
        G.useItem(id);
        this.buildInv();""")

# ---- gear tab: armor slots + money ----
sub("""      for (let i = 0; i < 3; i++) h += `<div class="geqs">${this.itemHtml(P.relics[i])}<small>Thánh vật ${i + 1}</small></div>`;
      h += '</div><h3>Túi đồ (' + P.stash.length + '/18)</h3><div class="gstash">';""",
"""      for (let i = 0; i < 3; i++) h += `<div class="geqs">${this.itemHtml(P.relics[i])}<small>Thánh vật ${i + 1}</small></div>`;
      for (const sl of ARMOR_SLOTS) h += `<div class="geqs">${this.itemHtml(P.armor[sl])}<small>${ARMOR_SLOT_LABEL[sl]}</small></div>`;
      h += `</div><p class="muted">Giáp: <b>${P.armorVal}</b> (giảm ${Math.round(P.armorVal / (P.armorVal + 100) * 100)}% sát thương) • ${esc(cur().name)}: <b style="color:${cur().col}">${P.gold}</b></p>`;
      h += '<h3>Túi đồ (' + P.stash.length + '/30)</h3><div class="gstash">';""")
sub("    const it = P.stash.find(x => x.uid === uid) || Object.values(P.equip).find(x => x && x.uid === uid) || P.relics.find(x => x && x.uid === uid);",
    "    const it = P.stash.find(x => x.uid === uid) || Object.values(P.equip).find(x => x && x.uid === uid) || Object.values(P.armor).find(x => x && x.uid === uid) || P.relics.find(x => x && x.uid === uid);")
sub("    const cur = it.kind === 'weapon' ? P.equip[it.slot] : null;\n    const cmp = cur && cur !== it",
    "    const cur = it.kind === 'weapon' ? P.equip[it.slot] : it.kind === 'armor' ? P.armor[it.slot] : null;\n    const cmp = cur && cur !== it")
sub("${known ? `<div class=\"affbar\"><i style=\"width:${c.aff}%\"></i></div><span class=\"hearts\">${'♥'.repeat(c.stage)}${'♡'.repeat(5 - c.stage)} ${c.lover ? 'NGƯỜI THƯƠNG' : Math.round(c.aff) + '/100'}</span>",
    "${known ? `<div class=\"affbar\"><i style=\"width:${c.aff}%\"></i></div><span class=\"hearts\">${(c.romance ? '♥' : '★').repeat(c.stage)}${(c.romance ? '♡' : '☆').repeat(5 - c.stage)} ${c.lover ? 'NGƯỜI THƯƠNG' : c.sworn ? esc(c.data.bondTitle || 'TRI KỶ').toUpperCase() : (c.romance ? '' : '(' + esc(c.data.bondTitle || 'tình bạn') + ') ') + Math.round(c.aff) + '/100'}</span>")
sub("<p class=\"muted\">Thích: ${(c.data.likes || []).map(id => ITEMS[id] ? ITEMS[id].name : id).join(', ')}</p>",
    "<p class=\"muted\">Thích: ${(c.data.likes || []).map(id => itm(id) ? itm(id).name : id).join(', ')}</p>")
sub("cp += `<div class=\"cpm ${c.ally.downed ? 'down' : ''} ${c.scenePending ? 'love' : ''}\"><img src=\"assets/img/${c.data.portrait}.jpg\" alt=\"\"><div><b>${esc(c.data.name)}</b><div class=\"cphp\"><i style=\"width:${c.ally.hp / c.ally.maxHp * 100}%\"></i></div><span>${'♥'.repeat(c.stage)}${'♡'.repeat(5 - c.stage)}</span></div></div>`;",
    "cp += `<div class=\"cpm ${c.ally.downed ? 'down' : ''} ${c.scenePending ? 'love' : ''}\"><img src=\"assets/img/${c.data.portrait}.jpg\" alt=\"\"><div><b>${esc(c.data.name)}</b><div class=\"cphp\"><i style=\"width:${c.ally.hp / c.ally.maxHp * 100}%\"></i></div><span>${(c.romance ? '♥' : '★').repeat(c.stage)}${(c.romance ? '♡' : '☆').repeat(5 - c.stage)}</span></div></div>`;")

# ---- minimap: merchants and nearby chests ----
sub("    for (const a of G.allies) { const [x, y] = toM(a.x, a.y); g.fillStyle = a.kind === 'comp' ? '#ff8ab8' : a.kind === 'shadow' ? '#8a7bff' : '#6dff7a'; g.fillRect(x - 1.5, y - 1.5, 3, 3); }",
    """    for (const a of G.allies) { const [x, y] = toM(a.x, a.y); if (a.kind === 'merchant') { g.fillStyle = '#ffd23a'; g.font = 'bold 11px sans-serif'; g.textAlign = 'center'; g.fillText('$', clamp(x, 6, 194), clamp(y, 10, 196)); continue; } g.fillStyle = a.kind === 'comp' ? '#ff8ab8' : a.kind === 'shadow' ? '#8a7bff' : '#6dff7a'; g.fillRect(x - 1.5, y - 1.5, 3, 3); }
    if (G.frame % 30 === 0 || !this.chestMarks) this.chestMarks = World.propsNear(P.x, P.y, 1500, []).filter(p => p.container === 'chest' && !p.looted && !p.dead);
    for (const p of this.chestMarks) { if (p.looted) continue; const [x, y] = toM(p.x, p.y); if (x < 0 || y < 0 || x > 200 || y > 200) continue; g.fillStyle = CHESTS[p.data.tier].col; g.strokeStyle = '#000'; g.lineWidth = 1; g.fillRect(x - 2.5, y - 2, 5, 4); g.strokeRect(x - 2.5, y - 2, 5, 4); }""")
open(P, 'w', encoding='utf-8', newline='\n').write(s)

# recruit lines carry their expressions
P = os.path.join(ROOT, 'js/story.js'); s = open(P, encoding='utf-8').read()
sub("    UI.dialog({ lines: c.data.meet.map(l => ({ who: l.who, text: Story.fmt(l.text) })), name: c.data.name, portrait: c.data.portrait,",
    "    UI.dialog({ lines: c.data.meet.map((l, i) => ({ who: l.who, text: Story.fmt(l.text), e: c.data.meetExpr && c.data.meetExpr[i] })), name: c.data.name, portrait: c.data.portrait, romance: c.romance,")
open(P, 'w', encoding='utf-8', newline='\n').write(s)

# images every world needs
P = os.path.join(ROOT, 'js/realms.js'); s = open(P, encoding='utf-8').read()
sub("  add(r + '_hb');\n", "") if "add(r + '_hb');" in s else None
sub("  return [...s];\n}", """  const k = rk(r);
  for (let i = 0; i < 4; i++) { add(k + '_ar_' + i); add(k + '_b_' + i); }
  for (let i = 0; i < 8; i++) add(k + '_m_' + i);
  if (r === 'tt') for (let i = 0; i < 16; i++) add('tt_i_' + i);
  for (const b of BOSSES[k]) add(b.img);
  add(BIOME_IMAGES); add(Object.values(BIOME_TEX));
  for (let i = 0; i < 4; i++) { add('chest_' + i); add('chest_' + i + 'o'); }
  for (let i = 0; i < 8; i++) add('ui_' + i);
  return [...s];
}""")
open(P, 'w', encoding='utf-8', newline='\n').write(s)
print('ui ok')
