// ===== v21terrain: far wild terrain (gói B2) — Núi Băng, Núi Tuyết, Rừng Nguyên Sinh, đại dương =====
// Everything here lives far from the start. Nothing changes within 3 regions (18 superblocks) of the origin,
// so the old player area keeps exactly the tiles v20 generated.
//   biomes   icepeak (Núi Băng), snowmt (Núi Tuyết), primeval (Rừng Nguyên Sinh): World.biomeAt is wrapped and only
//            replaces biomes at >= 24 superblocks (4 regions) from the origin.
//   tiles    T.CLIFF (solid rock ridges, with passes) and T.MOSS (forest floor). Ids are taken from the free range at load.
//   sea      ocean basins: World.waterAt adds deep water, a shallow rim and a few islands in 1 of 7 regions that are
//            >= 4 regions away. Those regions are forced to zone 0 (no towns in the sea).
//   sprites  b21_* names are drawn with the first existing sprite of SPRITE21 while the art is missing (checked when a
//            block is generated, so a later atlas21 registration takes over for new blocks).
//   v22 (package BI): every hook here is off for a legacy block (World.isLegacyGen / World.legacy22), and cliffs never
//            cover a road, a bridge deck or a building.
(function () {
  const FAR = 24;                                              // superblocks from the origin (4 regions of 6)
  const NEW_BIOMES = ['icepeak', 'snowmt', 'primeval'];
  const KEEP = ['volcano', 'crystal', 'grave', 'mushroom'];     // special places keep their own biome
  const TEMPERATE = ['plains', 'autumn', 'sakura', 'swamp'];
  // shares of far blocks (measured on 30972 block centres): icepeak ~7%, snowmt ~7%, primeval ~8%
  const A_PEAK = 0.59;      // snow + high noise -> icepeak
  const A_TEMP = 0.65;      // temperate land + very high noise -> snowmt
  const P_PRIMEVAL = 0.575; // forest / jungle + noise -> primeval
  const WB = new Set(WONDERS.map(w => w.biome));               // biomes that have a landmark
  // the game may place a landmark in this block (same test as wonderAt, before the zone and story checks): such a block keeps its biome
  const wonderSlot = (sx, sy) => Math.hypot(sx, sy) >= 4 && h3(sx, sy, 77) <= 0.03;
  // v22 legacy guard (World.isLegacyGen / World.legacy22, v22core): every change below is off for a block an old save visited (R1)
  const legacyNow = () => typeof World.isLegacyGen === 'function' && World.isLegacyGen();            // the block being generated
  const legacyBlock = (sx, sy) => typeof World.legacy22 === 'function' && World.legacy22({ key: nkey(sx, sy) });

  // ---------- tiles, biomes, colours, textures ----------
  const freeId = n => { const used = new Set(Object.values(T)); while (used.has(n)) n++; return n; };
  T.CLIFF = freeId(26);
  T.MOSS = freeId(T.CLIFF + 1);
  Object.assign(BIOMES, {
    icepeak:  { name: 'Núi Băng', desc: 'Đỉnh băng vĩnh cửu. Vách đá trơn như gương, gió buốt đến tận xương', ground: T.SNOW, alt: T.ICE, trees: [], treeD: 0, amb: 'snow', tint: 'rgba(170,210,255,0.08)', lakes: 2 },
    snowmt:   { name: 'Núi Tuyết', desc: 'Sống núi phủ tuyết trải dài. Chỉ vài đèo hẹp là lối đi qua', ground: T.SNOW, alt: T.DIRT, trees: ['b21_snow_pine', 'b21_snow_pine', 'b_snowpine'], treeD: 1.3, amb: 'snow', tint: 'rgba(190,210,235,0.05)', lakes: 2 },
    primeval: { name: 'Rừng Nguyên Sinh', desc: 'Cổ thụ che kín trời, dây leo chằng chịt. Nơi chưa từng có bước chân người', ground: T.MOSS, alt: T.LEAVES, trees: ['b21_prim_tree', 'b21_prim_tree', 'tree_oak'], treeD: 3.4, amb: 'fog', tint: 'rgba(30,70,40,0.10)', dark: 0.2, lakes: 2 },
  });
  for (const b of NEW_BIOMES) if (!BIOME_IDS.includes(b)) BIOME_IDS.push(b);   // tile biome ids index this list
  // the first existing image wins; the getters are read at draw time, so a later tex21_* file takes over by itself
  const texOr = (...names) => () => names.find(n => IMG[n]) || names[names.length - 1];
  Object.defineProperty(BIOME_TEX, T.CLIFF, { enumerable: true, configurable: true, get: texOr('tex21_cliff', 'tex_sl_wall', 'tex_dirt') });
  Object.defineProperty(BIOME_TEX, T.MOSS, { enumerable: true, configurable: true, get: texOr('tex21_moss', 'tex_leaves') });
  MINI_COL[T.CLIFF] = [78, 84, 96];
  MINI_COL[T.MOSS] = [46, 78, 42];

  // fallback sprites: the b21_* name stays on the prop (kind), only the drawn image changes
  const SPRITE21 = {
    b21_ice_spire: ['b_crystal', 'b_ice', 'rock'],
    b21_ice_crystal: ['b_crystal', 'rocks'],
    b21_frozen_boulder: ['rock', 'rocks'],
    b21_snow_pine: ['b_snowpine', 'tree_pine'],
    b21_snow_rock: ['rocks', 'rock'],
    b21_prim_tree: ['tree_oak', 'b_palm', 'tree_pine'],
    b21_prim_vine: ['b_fern', 'weeds'],
    b21_prim_fern: ['b_fern', 'weeds'],
    b21_prim_log: ['tree_dead'],
    b21_herb_bush: ['bush', 'weeds'],
  };
  const drawName = img => { const l = SPRITE21[img]; return !l || IMG[img] ? img : (l.find(n => IMG[n]) || img); };

  // ---------- regions and basins (a region is REG x REG superblocks, the same REG as v5) ----------
  const basinRegion = (rx, ry) => Math.hypot(rx, ry) >= 4 && Math.floor(h3(rx, ry, 2102) * 7) === 0;
  const basinOf = (sx, sy) => basinRegion(Math.floor(sx / REG), Math.floor(sy / REG));
  // a block is sea-free if it is not wild (zone, special biome, story site, wonder, v5 site) — same tests genOver uses
  const memo = new Map();
  const wildBlock = (sx, sy) => {
    const n = typeof Story !== 'undefined' && Story.pois ? Story.pois.length : 0, k = sx * 1000003 + sy;
    const m = memo.get(k); if (m && m.n === n) return m.ok;
    const ok = World.zoneOf(sx, sy) === 0 && !KEEP.includes(World.biomeAt(sx + 0.5, sy + 0.5)) &&
      !(World.siteBlocked(sx, sy) || World.v5Site(sx, sy) || World.wonderAt(sx, sy) != null);
    memo.set(k, { n, ok }); return ok;
  };

  // ---------- biome choice (far away only; a landmark block keeps its original biome) ----------
  const bioAt0 = World.biomeAt;
  World.biomeAt = function (fx, fy) {
    const b = bioAt0.call(this, fx, fy);
    if (this.mode !== 'over' || Math.hypot(fx, fy) < FAR || KEEP.includes(b) || legacyNow()) return b;
    const bx = Math.floor(fx), by = Math.floor(fy);
    if (wonderSlot(bx, by) && WB.has(bioAt0.call(this, bx + 0.5, by + 0.5))) return b;
    if (b === 'snow') return fbm(fx / 9 + 4100, fy / 9 + 4100, 3) > A_PEAK ? 'icepeak' : b;
    if (b === 'forest' || b === 'jungle') return fbm(fx / 8 + 6100, fy / 8 + 6100, 2) > P_PRIMEVAL ? 'primeval' : b;
    if (TEMPERATE.includes(b) && fbm(fx / 9 + 4100, fy / 9 + 4100, 3) > A_TEMP) return 'snowmt';
    return b;
  };
  const zoneOf0 = World.zoneOf;
  World.zoneOf = function (sx, sy) {
    const z = zoneOf0.call(this, sx, sy);
    // a legacy block also reads its neighbours' zones (roads), so while it is generated every zone is the base one
    if (!z || this.mode !== 'over' || Math.hypot(sx, sy) < FAR || legacyNow() || legacyBlock(sx, sy)) return z;
    // no towns out there: basin regions and new biomes are wild (a landmark block keeps its own zone)
    if (basinOf(sx, sy) && !wonderSlot(sx, sy)) return 0;
    if (NEW_BIOMES.includes(this.biomeAt(sx + 0.5, sy + 0.5))) return 0;
    return z;
  };

  // ---------- rock: solid, not ground (no props on it) ----------
  const solid0 = World.isSolidT;
  World.isSolidT = function (t) { return t === T.CLIFF || solid0.call(this, t); };
  const ground0 = World.isGround;
  World.isGround = function (t) { return t !== T.CLIFF && ground0.call(this, t); };

  // ---------- ocean basins ----------
  const water0 = World.waterAt;
  World.waterAt = function (gx, gy) {
    const w = water0.call(this, gx, gy);
    if (w || this.mode !== 'over' || legacyNow()) return w;
    const sx = Math.floor(gx / SB), sy = Math.floor(gy / SB), rx = Math.floor(sx / REG), ry = Math.floor(sy / REG);
    if (!basinRegion(rx, ry) || !wildBlock(sx, sy)) return 0;
    const x0 = rx * REG * SB, y0 = ry * REG * SB, W = REG * SB;
    const edge = Math.min(gx - x0, x0 + W - 1 - gx, gy - y0, y0 + W - 1 - gy);   // tiles from the region border
    const d = edge + (fbm(gx / 26 + 8800, gy / 26 + 8800, 3) - 0.5) * 36;        // wobbly coastline
    if (d < 8) return 0;                                                          // beach strip: land
    if (d > 10 && fbm(gx / 20 + 9100, gy / 20 + 9100, 3) > 0.68) return 0;       // a few islands
    return d < 14 ? 1 : 2;                                                        // shallow rim, deep water
  };

  // ---------- mountain rock: ridges with passes, cut into the finished block ----------
  const ridge = (gx, gy, b) => {
    const s = b === 'icepeak' ? 15 : 21, n = fbm(gx / s + 8100, gy / s + 8100, 3);
    return Math.abs(2 * n - 1) < (b === 'icepeak' ? 0.09 : 0.07);
  };
  const pass = (gx, gy) => fbm(gx / 5 + 8300, gy / 5 + 8300, 2) > 0.6;
  function cliffs(sb) {
    // blocks with a story site, buildings or spawns keep their layout
    if (sb.poi || sb.site || sb.buildings.length || sb.spawns.length) return;
    let any = false;
    for (let y = 0; y < SB; y++) for (let x = 0; x < SB; x++) {
      const i = y * SB + x, b = BIOME_IDS[sb.bio[i]];
      if (b !== 'icepeak' && b !== 'snowmt') continue;
      const t = sb.tiles[i];
      // R2: a rock ridge never covers a road, a bridge deck (T.BRIDGE, v21world) or a building
      if (t === T.ROAD || t === T.SIDEWALK || t === T.BRIDGE || t === T.ICE || t === T.WATER || t === T.DEEP || t === T.WALL || t === T.WINDOW || sb.bld[i] >= 0) continue;
      const gx = sb.tx0 + x, gy = sb.ty0 + y;
      if (ridge(gx, gy, b) && !pass(gx, gy)) { sb.tiles[i] = T.CLIFF; any = true; }
    }
    if (!any) return;
    // a rock ridge takes whatever was standing on it
    for (let k = sb.props.length - 1; k >= 0; k--) {
      const p = sb.props[k], x = Math.floor(p.x / TILE) - sb.tx0, y = Math.floor(p.y / TILE) - sb.ty0;
      if (x >= 0 && y >= 0 && x < SB && y < SB && sb.tiles[y * SB + x] === T.CLIFF) sb.props.splice(k, 1);
    }
  }
  const genOver0 = World.genOver;
  World.genOver = function (sb) {
    genOver0.call(this, sb);
    if (this.mode !== 'over' || legacyBlock(sb.sx, sb.sy)) return;
    const hi = BIOME_IDS.indexOf('icepeak'), sn = BIOME_IDS.indexOf('snowmt');
    for (let i = 0; i < SB * SB; i++) if (sb.bio[i] === hi || sb.bio[i] === sn) { cliffs(sb); return; }
  };

  // ---------- decorations of the new biomes (called by genWild for biomes covering > 12% of a block) ----------
  function decorate21(bk, biome, f) {
    const W = this;
    const rx = () => SR.int(bk.x0 + 3, bk.x1 - 3), ry = () => SR.int(bk.y0 + 3, bk.y1 - 3);
    const put = (img, tx, ty, o) => {
      if (!W.free(tx, ty) || !W.isGround(W.get(tx, ty)) || W.bioAt(tx, ty) !== biome) return null;
      return W.addProp(img, tx * TILE + 16, ty * TILE + 16, Object.assign({ r: 11, rot: SR.range(-0.25, 0.25) }, o));
    };
    const cluster = (img, n, r, o) => {
      const cx = rx(), cy = ry(); let c = 0;
      for (let i = 0; i < n * 3 && c < n; i++) { const a = SR.range(0, TAU), d = SR.range(0, r); if (put(img, Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d), o)) c++; }
    };
    const k = f > 0.5 ? 2 : 1;
    switch (biome) {
      case 'icepeak':
        for (let i = 0; i < k + 1; i++) cluster('b21_ice_spire', SR.int(2, 3), 2.2);
        for (let i = 0; i < k; i++) cluster('b21_ice_crystal', SR.int(2, 4), 2, { container: 'crystal', light: 60, lightCol: 'cyan' });
        cluster('b21_frozen_boulder', 2, 2.5);
        break;
      case 'snowmt':
        cluster('b21_snow_rock', SR.int(2, 4), 2.5);
        break;
      case 'primeval':
        for (let i = 0; i < k + 1; i++) cluster('b21_prim_fern', SR.int(3, 5), 2.5, { solid: false, r: 0 });
        cluster('b21_prim_vine', SR.int(2, 4), 2, { solid: false, r: 0 });
        for (let i = 0; i < k; i++) cluster('b21_prim_log', 2, 2.5, { rot: SR.range(0, TAU) });
        cluster('b21_herb_bush', 2, 2, { container: 'bush', solid: false, r: 0 });
        break;
    }
  }
  const decorate0 = World.decorate;
  World.decorate = function (bk, biome, f) {
    return NEW_BIOMES.includes(biome) && !legacyNow() ? decorate21.call(this, bk, biome, f) : decorate0.call(this, bk, biome, f);
  };

  // ---------- sprites: fallback names, decided when the prop is made ----------
  const addProp0 = World.addProp;
  World.addProp = function (img, x, y, o) {
    if (!SPRITE21[img]) return addProp0.call(this, img, x, y, o);
    return addProp0.call(this, drawName(img), x, y, Object.assign({ kind: img }, o || {}));
  };

  // ---------- rock texture: a cliff face, a shadow under each edge and a few cracks (drawn over the tile texture) ----------
  const renderChunk0 = World.renderChunk;
  World.renderChunk = function (ctx, cx, cy) {
    renderChunk0.call(this, ctx, cx, cy);
    const tx0 = cx * CH, ty0 = cy * CH, rock = (x, y) => this.get(x, y) === T.CLIFF;
    for (let ty = ty0; ty < ty0 + CH; ty++) for (let tx = tx0; tx < tx0 + CH; tx++) {
      if (!rock(tx, ty)) continue;
      const X = tx * TILE, Y = ty * TILE, h = hash2(tx, ty);
      ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(X, Y, TILE, TILE);
      if (!rock(tx, ty + 1)) { ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(X, Y + TILE - 6, TILE, 6); }
      if (!rock(tx, ty - 1)) { ctx.fillStyle = 'rgba(225,240,255,0.35)'; ctx.fillRect(X, Y, TILE, 2); }
      ctx.fillStyle = 'rgba(15,22,34,0.45)';
      ctx.fillRect(X + Math.floor(h * 20) + 3, Y + 4, 1, 9);
      ctx.fillRect(X + Math.floor(h * 20) + 4, Y + 12, 4, 1);
    }
  };
})();
