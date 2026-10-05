"""v4 world: per-tile biome map + structured (clustered) vegetation and decorations."""
import os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
p = os.path.join(ROOT, 'js/world.js')
s = open(p, encoding='utf-8').read()
def sub(a, b, n=1):
    global s
    if a not in s: raise SystemExit('MISSING: ' + a[:90])
    s = s.replace(a, b, n)

# remember the biome of every tile
sub("tiles: new Uint8Array(SB * SB), bld:", "tiles: new Uint8Array(SB * SB), bio: new Uint8Array(SB * SB), bld:")
sub("""      const b = BIOMES[this.biomeAt(gx / SB + j, gy / SB - j)];
      sb.tiles[y * SB + x] = n > 0.66 ? (b.alt ?? (b.ground ?? T.DIRT)) : (b.ground ?? T.GRASS);""",
"""      const bn = this.biomeAt(gx / SB + j, gy / SB - j), b = BIOMES[bn];
      sb.bio[y * SB + x] = BIOME_IDS.indexOf(bn);
      sb.tiles[y * SB + x] = n > 0.66 ? (b.alt ?? (b.ground ?? T.DIRT)) : (b.ground ?? T.GRASS);""")
sub("  biomeOfPos(x, y) {", """  // biome name of a tile (works while generating too)
  bioAt(tx, ty) { const sb = this.sbOf(tx, ty); return sb && sb.bio ? BIOME_IDS[sb.bio[(ty - sb.ty0) * SB + (tx - sb.tx0)]] || 'plains' : 'plains'; },
  biomeOfPos(x, y) {""")

# trees follow the biome of their own tile, not the whole superblock
sub("""    const B = this._gen && BIOMES[this._gen.biome];
    const t = SR.pick(list || (B && B.trees && B.trees.length ? B.trees : RL.props.trees));""",
"""    const B = BIOMES[this.bioAt(tx, ty)];
    const t = SR.pick(list || (B && B.trees && B.trees.length ? B.trees : RL.props.trees));""")

# structured wilderness
a = s.index("    const B = BIOMES[this._gen.biome] || BIOMES.plains;\n    if (SR.chance(0.14))")
b = s.index("  // ---------- special places ----------")
s = s[:a] + """    if (SR.chance(0.14)) for (let k = 0; k < 30; k++) { const x = SR.int(bk.x0 + 2, bk.x1 - 2), y = SR.int(bk.y0 + 2, bk.y1 - 2); if (this.isGround(this.get(x, y)) && this.free(x, y, 1)) { this.chest(x, y, this.rollChest(0)); break; } }
    // which biomes share this block, and how much of it
    const share = {};
    for (let y = bk.y0; y <= bk.y1; y++) for (let x = bk.x0; x <= bk.x1; x++) { const b = this.bioAt(x, y); share[b] = (share[b] || 0) + 1; }
    const area = (bk.x1 - bk.x0 + 1) * (bk.y1 - bk.y0 + 1);
    for (const b in share) if (share[b] / area > 0.12) this.decorate(bk, b, share[b] / area);
    // trees grow in clumps with clearings between them
    for (let y = bk.y0; y <= bk.y1; y++) for (let x = bk.x0; x <= bk.x1; x++) {
      if (this.occAt(x, y) || !this.isGround(this.get(x, y))) continue;
      const B = BIOMES[this.bioAt(x, y)];
      const n = fbm(x / 9 + 50, y / 9 + 50, 3);
      if (n > 0.55 && SR.chance((0.1 + (n - 0.55) * 1.4) * B.treeD)) {
        this.tryTree(x, y, false);
        // undergrowth around the edge of a clump
        if (SR.chance(0.25)) { const ax = x + SR.pick([-2, 2]), ay = y + SR.int(-1, 1); if (this.free(ax, ay) && this.isGround(this.get(ax, ay))) this.addProp(SR.pick([RL.props.bush, RL.props.weeds]), ax * TILE + 16, ay * TILE + 16, { solid: false, rot: SR.range(0, TAU) }); }
      }
      else if (st === 'sect' && n < 0.4 && SR.chance(0.003)) this.container(SR.pick(['tt_p_0', 'tt_p_1']), x, y, 'herb', { solid: false });
      else if (st === 'cyber' && SR.chance(0.002)) this.addProp(RL.props.barrel, x * TILE + 16, y * TILE + 16, { r: 9, explosive: true });
    }
    // a few rock piles instead of lone pebbles everywhere
    for (let k = 0; k < SR.int(0, 2); k++) {
      const cx = SR.int(bk.x0 + 2, bk.x1 - 2), cy = SR.int(bk.y0 + 2, bk.y1 - 2);
      for (let i = 0; i < SR.int(2, 4); i++) { const x = cx + SR.int(-1, 1), y = cy + SR.int(-1, 1); if (this.free(x, y) && this.isGround(this.get(x, y))) this.addProp(SR.pick(RL.props.rocks), x * TILE + 16, y * TILE + 16, { r: 11, rot: SR.range(0, TAU) }); }
    }
  },
  // place one decorative prop if the tile belongs to the biome and is free
  deco(img, tx, ty, biome, B) {
    if (!this.free(tx, ty) || !this.isGround(this.get(tx, ty)) || this.bioAt(tx, ty) !== biome) return null;
    const soft = img === 'b_reeds' || img === 'b_glowshroom';
    const lk = B.loot && B.loot[img];
    return this.addProp(img, tx * TILE + 16, ty * TILE + 16, { r: soft ? 0 : 11, solid: !soft, container: lk || null, rot: img === 'b_tomb' ? 0 : SR.range(-0.25, 0.25),
      light: img === 'b_glowshroom' || img === 'b_crystal' || img === 'b_lavarock' ? 70 : 0, lightCol: img === 'b_lavarock' ? 'fire' : img === 'b_glowshroom' ? 'cyan' : img === 'b_crystal' ? 'magenta' : null });
  },
  // tiles next to water / ice / lava
  shoreTiles(bk, biome) {
    const out = [];
    for (let y = bk.y0; y <= bk.y1; y++) for (let x = bk.x0; x <= bk.x1; x++) {
      if (this.bioAt(x, y) !== biome || !this.isGround(this.get(x, y))) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const t = this.get(x + dx, y + dy); if (t === T.WATER || t === T.ICE || t === T.LAVA) { out.push([x, y]); break; } }
    }
    return out;
  },
  // structured layouts per biome: graveyards in rows, fairy rings, crystal clusters, shorelines
  decorate(bk, biome, f) {
    const B = BIOMES[biome];
    const rx = () => SR.int(bk.x0 + 3, bk.x1 - 3), ry = () => SR.int(bk.y0 + 3, bk.y1 - 3);
    const cluster = (img, n, r) => { const cx = rx(), cy = ry(); let c = 0; for (let i = 0; i < n * 3 && c < n; i++) { const a = SR.range(0, TAU), d = SR.range(0, r); if (this.deco(img, Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d), biome, B)) c++; } return [cx, cy]; };
    const shore = (img, chance) => { for (const [x, y] of this.shoreTiles(bk, biome)) if (SR.chance(chance)) this.deco(img, x, y, biome, B); };
    switch (biome) {
      case 'grave': {
        // fenced plots with tombstones in neat rows
        for (let k = 0; k < (f > 0.5 ? 2 : 1); k++) {
          const w = SR.int(5, 8), h = SR.int(4, 6), x0 = SR.int(bk.x0 + 1, Math.max(bk.x0 + 1, bk.x1 - w - 1)), y0 = SR.int(bk.y0 + 1, Math.max(bk.y0 + 1, bk.y1 - h - 1));
          if (this.bioAt(x0 + (w >> 1), y0 + (h >> 1)) !== biome) continue;
          for (let y = y0; y <= y0 + h; y += 2) for (let x = x0; x <= x0 + w; x += 2) if (SR.chance(0.8)) this.deco('b_tomb', x, y, biome, B);
          if (SR.chance(0.5)) this.chest(x0 + w + 1 <= bk.x1 ? x0 + w + 1 : x0 - 1, y0 + h, this.rollChest(0));
          for (const [x, y] of [[x0 - 1, y0 - 1], [x0 + w + 1, y0 - 1]]) this.tryTree(x, y, false, ['tree_dead']);
        }
        break;
      }
      case 'mushroom': {
        // fairy rings of glowing mushrooms around a giant cap
        for (let k = 0; k < (f > 0.5 ? 2 : 1); k++) {
          const cx = rx(), cy = ry(), r = SR.range(2.6, 3.6);
          if (this.bioAt(cx, cy) !== biome) continue;
          this.tryTree(cx, cy, false, ['b_mushroom']);
          const n = 9;
          for (let i = 0; i < n; i++) { const a = i / n * TAU; this.deco('b_glowshroom', Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), biome, B); }
        }
        cluster('b_glowshroom', 4, 2);
        break;
      }
      case 'crystal': for (let k = 0; k < Math.round(1 + f * 3); k++) cluster('b_crystal', SR.int(3, 6), 2.2); cluster('rocks', 3, 2); break;
      case 'swamp': shore('b_reeds', 0.35); cluster('b_reeds', 5, 3); break;
      case 'snow': shore('b_ice', 0.12); cluster('b_ice', 3, 2); break;
      case 'volcano': shore('b_lavarock', 0.2); for (let k = 0; k < 2; k++) cluster('b_lavarock', 3, 2); break;
      case 'desert': for (let k = 0; k < Math.round(1 + f * 2); k++) cluster('b_cactus', SR.int(2, 3), 2); if (SR.chance(0.6)) cluster('b_skull', 1, 1); break;
      case 'sakura': for (let k = 0; k < 2; k++) cluster('b_bamboo', SR.int(4, 7), 2); break;
      case 'jungle': for (let k = 0; k < 3; k++) cluster('bush', SR.int(3, 5), 2); break;
    }
  },

""" + s[b:]
# remove the old leading line that used B before (genWild header keeps `const st = RL.style;`)
open(p, 'w', encoding='utf-8', newline='\n').write(s)

p = os.path.join(ROOT, 'js/data2.js')
s = open(p, encoding='utf-8').read()
sub("const BIOME_IMAGES = [", "const BIOME_IDS = Object.keys(BIOMES);\nconst BIOME_IMAGES = [")
# trees vs decorations: bamboo/cactus are decorations placed in clusters now
sub("trees: ['b_sakura', 'b_sakura', 'b_bamboo'], treeD: 1.4", "trees: ['b_sakura'], treeD: 1.1")
sub("trees: ['b_cactus'], treeD: 0.5", "trees: ['tree_dead'], treeD: 0.15")
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('ok')
