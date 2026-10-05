"""v3 world: biomes, chests, merchants, ruins with random bosses, bounded dungeons, compact minimaps."""
import os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
p = os.path.join(ROOT, 'js/world.js')
s = open(p, encoding='utf-8').read()
def sub(a, b, n=1):
    global s
    if a not in s: raise SystemExit('MISSING: ' + a[:90])
    s = s.replace(a, b, n)

# ---- solid lava, biome textures, ground helper ----
sub("  isSolidT(t) { return t === T.WALL || t === T.WATER || t === T.WINDOW; },",
    "  isSolidT(t) { return t === T.WALL || t === T.WATER || t === T.WINDOW || t === T.LAVA; },\n"
    "  isGround(t) { return t === T.GRASS || t === T.DIRT || (t >= 13 && t !== T.ICE && t !== T.LAVA); },")
sub("    return RL.tex[t] || RL.tex[0];", "    return RL.tex[t] || BIOME_TEX[t] || RL.tex[0];")

# ---- biome lookup ----
sub("  levelAt(x, y) {", """  // biome at fractional superblock coordinates
  biomeAt(fx, fy) {
    if (this.mode === 'dungeon' || Math.hypot(fx, fy) < 2.6) return 'plains';
    const w = fbm(fx / 5 + 900, fy / 5 + 900, 2);
    if (w > 0.69) { const k = fbm(fx / 4 + 1300, fy / 4 + 1300, 2); return k < 0.42 ? 'volcano' : k < 0.5 ? 'grave' : k < 0.58 ? 'mushroom' : 'crystal'; }
    const t = fbm(fx / 7 + 300, fy / 7 + 300, 2), m = fbm(fx / 6 + 700, fy / 6 + 700, 2);
    if (t < 0.35) return 'snow';
    if (t > 0.65) return m < 0.48 ? 'desert' : 'jungle';
    if (m > 0.64) return 'swamp';
    if (m < 0.37) return t < 0.5 ? 'autumn' : 'sakura';
    return m > 0.53 ? 'forest' : 'plains';
  },
  biomeOfPos(x, y) { const sb = this.sbs.get(nkey(Math.floor(x / SBPX), Math.floor(y / SBPX))); return sb && sb.biome || 'plains'; },
  levelAt(x, y) {""")

# ---- ground generation by biome ----
sub("""    for (let y = 0; y < SB; y++) for (let x = 0; x < SB; x++) {
      const gx = tx0 + x, gy = ty0 + y;
      const n = fbm(gx / 16, gy / 16, 3);
      sb.tiles[y * SB + x] = n > 0.66 ? T.DIRT : T.GRASS;
    }
    // lakes in the wild
    if (zone === 0 && fbm(sx / 3 + 40, sy / 3 + 40, 2) > 0.63) {
      const cx = tx0 + 16 + SR.int(-4, 4), cy = ty0 + 16 + SR.int(-4, 4), rr = SR.int(8, 12);
      for (let y = 0; y < SB; y++) for (let x = 0; x < SB; x++) {
        const d = Math.hypot(tx0 + x - cx, ty0 + y - cy) + (fbm((tx0 + x) / 6, (ty0 + y) / 6, 2) - 0.5) * 8;
        if (d < rr) sb.tiles[y * SB + x] = T.WATER; else if (d < rr + 2) sb.tiles[y * SB + x] = T.SAND;
      }
    }""", """    sb.biome = this.biomeAt(sx + 0.5, sy + 0.5);
    const BI = BIOMES[sb.biome];
    for (let y = 0; y < SB; y++) for (let x = 0; x < SB; x++) {
      const gx = tx0 + x, gy = ty0 + y;
      const n = fbm(gx / 16, gy / 16, 3);
      const j = (fbm(gx / 9 + 77, gy / 9 + 77, 2) - 0.5) * 0.6;
      const b = BIOMES[this.biomeAt(gx / SB + j, gy / SB - j)];
      sb.tiles[y * SB + x] = n > 0.66 ? (b.alt ?? (b.ground ?? T.DIRT)) : (b.ground ?? T.GRASS);
    }
    // lakes in the wild (frozen in the snow, lava in the volcano, oasis in the desert)
    if (zone === 0 && fbm(sx / 3 + 40, sy / 3 + 40, 2) > (BI.lakes ?? 0.63)) {
      const cx = tx0 + 16 + SR.int(-4, 4), cy = ty0 + 16 + SR.int(-4, 4), rr = SR.int(8, 12) * (sb.biome === 'desert' ? 0.55 : 1);
      const shore = sb.biome === 'snow' ? T.SNOW : sb.biome === 'volcano' ? T.ASH : sb.biome === 'swamp' ? T.SWAMP : T.SAND;
      for (let y = 0; y < SB; y++) for (let x = 0; x < SB; x++) {
        const d = Math.hypot(tx0 + x - cx, ty0 + y - cy) + (fbm((tx0 + x) / 6, (ty0 + y) / 6, 2) - 0.5) * 8;
        if (d < rr) sb.tiles[y * SB + x] = BI.water ?? T.WATER; else if (d < rr + 2) sb.tiles[y * SB + x] = shore;
      }
      if (BI.oasis) for (let k = 0; k < 5; k++) { const a = SR.range(0, TAU); sb.pendingTrees = (sb.pendingTrees || []).concat([[Math.round(cx + Math.cos(a) * (rr + 2)), Math.round(cy + Math.sin(a) * (rr + 2)), BI.oasis]]); }
    }""")
sub("    // road clutter\n", "    if (sb.pendingTrees) { for (const [x, y, img] of sb.pendingTrees) this.tryTree(x, y, false, [img]); sb.pendingTrees = null; }\n    // road clutter\n")

# ---- POI choice: ruins with a random boss ----
sub("      else if (r < gateP + 0.13) this.genPOI(bk, { kind: 'camp' }, sb);",
    "      else if (r < gateP + 0.13) this.genPOI(bk, { kind: 'camp' }, sb);\n      else if (r < gateP + 0.165) this.genPOI(bk, { kind: 'ruins' }, sb);")

# ---- start: merchant next to the shelter ----
sub("    this.addProp('fx_4', cx * TILE + 16, (cy + 6) * TILE, { solid: false, light: 150, kind: 'campfire', lightCol: 'fire' });",
    "    this.addProp('fx_4', cx * TILE + 16, (cy + 6) * TILE, { solid: false, light: 150, kind: 'campfire', lightCol: 'fire' });\n"
    "    this._gen.spawns.push({ kind: 'merchant', x: (cx + 4) * TILE, y: (cy + 6) * TILE + 8 });\n"
    "    this.chest(cx - 4, cy + 7, 0);")

# ---- tree picks follow the biome ----
sub("""  tryTree(tx, ty, city) {
    if (!this.free(tx, ty, 1)) return;
    const t = SR.pick(RL.props.trees);""", """  tryTree(tx, ty, city, list) {
    if (!this.free(tx, ty, 1)) return;
    const B = this._gen && BIOMES[this._gen.biome];
    const t = SR.pick(list || (B && B.trees && B.trees.length ? B.trees : RL.props.trees));""")

# ---- chest helper ----
sub("  container(img, tx, ty, kind, o = {}) {", """  // tier: 0 wood, 1 silver, 2 gold, 3 diamond (rolled up a little at random)
  rollChest(base) { let t = base; if (SR.chance(0.25)) t++; if (SR.chance(0.06)) t++; return clamp(t, 0, 3); },
  chest(tx, ty, tier) { return this.container('chest_' + tier, tx, ty, 'chest', { kind: 'chest', r: 12, data: { tier } }); },
  container(img, tx, ty, kind, o = {}) {""")

# houses sometimes hide a chest
sub("      const spr = typeof o.cimg === 'function' ? o.cimg() : (o.cimg || SR.pick(RL.props.crate));\n      this.container(spr, tx, ty, o.loot || 'house');",
    "      if (SR.chance(0.07)) { this.chest(tx, ty, this.rollChest(0)); placed++; continue; }\n"
    "      const spr = typeof o.cimg === 'function' ? o.cimg() : (o.cimg || SR.pick(RL.props.crate));\n      this.container(spr, tx, ty, o.loot || 'house');")

# merchants in towns / camps / villages
sub("    if (RL.props.lamp) for (let k = 0; k < 2; k++) { const x = SR.int(bk.x0, bk.x1), y = SR.int(bk.y0, bk.y1); if (this.get(x, y) === T.CONC && this.free(x, y)) this.addProp(RL.props.lamp,",
    "    if (SR.chance(0.25)) for (let k = 0; k < 40; k++) { const x = SR.int(bk.x0, bk.x1), y = SR.int(bk.y0, bk.y1); if (this.get(x, y) === T.CONC && this.free(x, y, 1)) { this.merchant(x, y); break; } }\n"
    "    if (RL.props.lamp) for (let k = 0; k < 2; k++) { const x = SR.int(bk.x0, bk.x1), y = SR.int(bk.y0, bk.y1); if (this.get(x, y) === T.CONC && this.free(x, y)) this.addProp(RL.props.lamp,")
sub("  spawnGuards(x, y, n, o = {}) {", """  merchant(tx, ty) {
    this.setOcc(tx, ty);
    this._gen.spawns.push({ kind: 'merchant', x: tx * TILE + 16, y: ty * TILE + 16 });
    if (RL.props.tent && this.free(tx + 2, ty - 1)) this.addProp(RL.props.tent, (tx + 2) * TILE + 16, (ty - 1) * TILE + 16, { shrink: 0.6 });
  },
  spawnGuards(x, y, n, o = {}) {""")
sub("        this.container(SR.pick(RL.props.crate), cx - 3, cy + 2, 'camp');\n        this.container(SR.pick(RL.props.crate), cx + 3, cy + 2, 'camp');",
    "        this.container(SR.pick(RL.props.crate), cx - 3, cy + 2, 'camp');\n        this.container(SR.pick(RL.props.crate), cx + 3, cy + 2, 'camp');\n"
    "        if (SR.chance(0.6)) this.merchant(cx - 1, cy - 2);")

# forts: chests instead of plain vaults
sub("        this.container(RL.props.special, f.cx, f.cy, 'vault', { name: 'vault' });", "        this.chest(f.cx, f.cy, this.rollChest(1));")
sub("        this.container(RL.props.special, f.cx + 3, f.cy + 3, 'vault');", "        this.chest(f.cx + 3, f.cy + 3, this.rollChest(1));")

# ruins POI
sub("      case 'landmark': {", """      case 'ruins': {
        const S = 9, x0 = cx - S, y0 = cy - S, x1 = cx + S, y1 = cy + S;
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          const edge = x === x0 || x === x1 || y === y0 || y === y1;
          const gap = Math.abs(x - cx) <= 1 || Math.abs(y - cy) <= 1;
          this.set(x, y, edge && !gap && SR.chance(0.72) ? T.WALL : T.GRAVEL);
          if (!edge && (x - x0) % 6 === 3 && (y - y0) % 6 === 3 && Math.hypot(x - cx, y - cy) > 3) this.set(x, y, T.WALL);
        }
        this.reserve(x0 - 1, y0 - 1, x1 + 1, y1 + 1);
        for (const [x, y] of [[x0 + 2, y0 + 2], [x1 - 2, y0 + 2], [x0 + 2, y1 - 2], [x1 - 2, y1 - 2]]) this.addProp(RL.props.lamp || 'lamp', x * TILE + 16, y * TILE + 16, { light: 140, r: 9, lightCol: 'fire' });
        this.chest(cx, cy + 3, this.rollChest(2));
        sb.spawns.push({ kind: 'boss', x: px, y: py - 30, mini: true, seed: (h3(sb.sx, sb.sy, 41) * 1e9) | 0 });
        this.spawnGuards(px, py, 6, { r: 200, elite: 0.25 });
        for (let k = 0; k < 6; k++) this.addDecal(SR.pick(['blood1', 'scorch', 'blood3']), SR.int(x0, x1) * TILE, SR.int(y0, y1) * TILE, SR.range(0, TAU), 0.9, 0.6);
        break;
      }
      case 'landmark': {""")

# ---- wild: biome trees, decorations, harvestables and a hidden chest ----
sub("""    for (let y = bk.y0; y <= bk.y1; y++) for (let x = bk.x0; x <= bk.x1; x++) {
      if (this.occAt(x, y)) continue;
      const t = this.get(x, y);
      if (t !== T.GRASS && t !== T.DIRT) continue;
      const n = fbm(x / 13 + 50, y / 13 + 50, 3);
      if (n > 0.5 && SR.chance(0.08 + (n - 0.5) * 0.6)) this.tryTree(x, y, false);""", """    const B = BIOMES[this._gen.biome] || BIOMES.plains;
    if (SR.chance(0.14)) for (let k = 0; k < 30; k++) { const x = SR.int(bk.x0 + 2, bk.x1 - 2), y = SR.int(bk.y0 + 2, bk.y1 - 2); if (this.isGround(this.get(x, y)) && this.free(x, y, 1)) { this.chest(x, y, this.rollChest(0)); break; } }
    for (let y = bk.y0; y <= bk.y1; y++) for (let x = bk.x0; x <= bk.x1; x++) {
      if (this.occAt(x, y)) continue;
      const t = this.get(x, y);
      if (!this.isGround(t)) continue;
      const n = fbm(x / 13 + 50, y / 13 + 50, 3);
      if (B.deco && SR.chance(0.012)) {
        const img = SR.pick(B.deco), lk = B.loot && B.loot[img];
        if (this.free(x, y)) this.addProp(img, x * TILE + 16, y * TILE + 16, { r: img === 'b_reeds' || img === 'b_glowshroom' ? 0 : 11, solid: img !== 'b_reeds' && img !== 'b_glowshroom', container: lk || null, light: img === 'b_glowshroom' || img === 'b_crystal' || img === 'b_lavarock' ? 70 : 0, lightCol: img === 'b_lavarock' ? 'fire' : img === 'b_glowshroom' ? 'cyan' : img === 'b_crystal' ? 'magenta' : null });
      }
      else if (n > 0.5 && SR.chance((0.08 + (n - 0.5) * 0.6) * B.treeD)) this.tryTree(x, y, false);""")

# ---- bounded dungeons ----
sub("    const dist = 3 + Math.floor(h3(dg.floor, 1, dg.seed % 991) * 2) + Math.min(2, dg.floor - 1);",
    "    const dist = 2 + Math.floor(h3(dg.floor, 1, dg.seed % 991) * 2) + Math.min(1, dg.floor - 1);")
sub("    dg.forced = new Set();", "    dg.forced = new Set();\n    dg.box = { x0: Math.min(0, dg.bx) - 1, x1: Math.max(0, dg.bx) + 1, y0: Math.min(0, dg.by) - 1, y1: Math.max(0, dg.by) + 1 };")
sub("  edgeE(sx, sy) { return this.dg.forced.has('e' + sx + ',' + sy) || h3(sx, sy, 11 + this.dg.floor) < 0.6; },\n  edgeS(sx, sy) { return this.dg.forced.has('s' + sx + ',' + sy) || h3(sx, sy, 23 + this.dg.floor) < 0.6; },",
    "  inBox(sx, sy) { const b = this.dg.box; return sx >= b.x0 && sx <= b.x1 && sy >= b.y0 && sy <= b.y1; },\n"
    "  edgeE(sx, sy) { return this.dg.forced.has('e' + sx + ',' + sy) || (this.inBox(sx, sy) && this.inBox(sx + 1, sy) && h3(sx, sy, 11 + this.dg.floor) < 0.6); },\n"
    "  edgeS(sx, sy) { return this.dg.forced.has('s' + sx + ',' + sy) || (this.inBox(sx, sy) && this.inBox(sx, sy + 1) && h3(sx, sy, 23 + this.dg.floor) < 0.6); },")
sub("    sb.tiles.fill(T.WALL);\n    const isStart", "    sb.tiles.fill(T.WALL);\n    if (!this.inBox(sx, sy)) return;\n    const isStart")
sub("    if (isStart || isBoss || SR.chance(0.72)) {", "    if (isStart || isBoss || SR.chance(0.8)) {")
sub("      if (SR.chance(0.35) && !isStart) { const x = SR.int(room.x0 + 1, room.x1 - 1), y = SR.int(room.y0 + 1, room.y1 - 1); if (this.free(x, y)) this.container(RL.id === 'sl' ? 'sl_p_0' : 'fx_3', x, y, 'dchest'); }",
    "      if (SR.chance(0.4) && !isStart) { const x = SR.int(room.x0 + 1, room.x1 - 1), y = SR.int(room.y0 + 1, room.y1 - 1); if (this.free(x, y)) this.chest(x, y, this.rollChest(RANKS.indexOf(dg.rank) >= 3 ? 1 : 0)); }")

# ---- finalize: opened chests stay open ----
sub("      if (d && d.looted && d.looted.has(idx)) p.looted = true;",
    "      if (d && d.looted && d.looted.has(idx)) { p.looted = true; if (p.container === 'chest') p.img = 'chest_' + p.data.tier + 'o'; }")

# ---- compact minimaps: ImageData per superblock + small canvas LRU ----
sub("""  buildMini(sb) {
    const c = document.createElement('canvas'); c.width = SB; c.height = SB;
    const g = c.getContext('2d');
    const im = g.createImageData(SB, SB);""", """  getMini(k) {
    const id = this.minis.get(k); if (!id) return null;
    let c = this.miniCv.get(k);
    if (c) { this.miniCv.delete(k); this.miniCv.set(k, c); return c; }
    c = this.miniCv.size >= 160 ? this.miniCv.get(this.miniCv.keys().next().value) : null;
    if (c) this.miniCv.delete(this.miniCv.keys().next().value);
    else { c = document.createElement('canvas'); c.width = SB; c.height = SB; }
    c.getContext('2d').putImageData(id, 0, 0);
    this.miniCv.set(k, c);
    return c;
  },
  buildMini(sb) {
    const im = new ImageData(SB, SB);
    const dot = (x, y, s, col) => { for (let yy = y; yy < y + s; yy++) for (let xx = x; xx < x + s; xx++) if (xx >= 0 && yy >= 0 && xx < SB && yy < SB) { const i = (yy * SB + xx) * 4; im.data[i] = col[0]; im.data[i + 1] = col[1]; im.data[i + 2] = col[2]; } };""")
sub("""    g.putImageData(im, 0, 0);
    for (const p of sb.props) {
      if (p.canopy) { g.fillStyle = 'rgba(30,60,25,0.9)'; g.fillRect(Math.floor(p.x / TILE) - sb.tx0 - 1, Math.floor(p.y / TILE) - sb.ty0 - 1, 3, 3); }
      if (p.kind === 'gate') { g.fillStyle = p.img === 'fx_1' ? '#ff3b3b' : '#4da6ff'; g.fillRect(Math.floor(p.x / TILE) - sb.tx0 - 2, Math.floor(p.y / TILE) - sb.ty0 - 2, 5, 5); }
    }
    this.minis.set(this.mode + sb.key, c);
    if (this.minis.size > 3000) this.minis.delete(this.minis.keys().next().value);""", """    for (const p of sb.props) {
      const x = Math.floor(p.x / TILE) - sb.tx0, y = Math.floor(p.y / TILE) - sb.ty0;
      if (p.canopy) dot(x - 1, y - 1, 3, [30, 60, 25]);
      if (p.kind === 'gate') dot(x - 2, y - 2, 5, p.img === 'fx_1' ? [255, 59, 59] : [77, 166, 255]);
    }
    for (const b of sb.buildings) for (const [x, y] of b.doors || []) dot(x - sb.tx0, y - sb.ty0, 1, [255, 214, 90]);
    if (sb.poi && sb.poi.kind === 'ruins') dot(14, 14, 4, [190, 90, 255]);
    const k = this.mode + sb.key;
    this.minis.set(k, im); this.miniCv.delete(k);
    if (this.minis.size > 5000) this.minis.delete(this.minis.keys().next().value);""")
sub("    this.minis = new Map();", "    this.minis = new Map(); this.miniCv = new Map();")
sub("    for (const k of [...this.minis.keys()]) if (String(k).startsWith('dungeon')) this.minis.delete(k);",
    "    for (const k of [...this.minis.keys()]) if (String(k).startsWith('dungeon')) { this.minis.delete(k); this.miniCv.delete(k); }")

# ---- smaller chunk cache (each chunk is a 512px canvas) ----
sub("    if (this.cache.size > (G.lowGfx ? 110 : 80)) {", "    if (this.cache.size > (G.lowGfx ? 70 : Touch.on ? 34 : 48)) {")
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('world ok')
