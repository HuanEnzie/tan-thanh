// ===== v22biome (package BI): more terrain — beach, farmland, red canyon, savanna, tundra, mangrove, bamboo (tt), dead forest (md) =====
// Save rule (v22core): a legacy block (an old save visited it, no -22 record) is generated exactly as before.
//   per-tile hooks (biomeAt, decorate)       -> off while World.isLegacyGen()
//   block passes (beach, mangrove pools)     -> skipped when World.legacy22(sb)
// Far biomes (>= 24 superblocks from the origin, as v21terrain) are chosen per tile from the biome v21 chose plus noise.
// The beach band (1-4 tiles from the sea, zone 0 only) may appear anywhere a sea is (plan section 10, the one exception).
// New tiles take the first free ids from 29 (28 is RUBBLE of v22ruin). Sprites t22_* / tex22_* fall back to older art.
(function () {
  const FAR = 24;
  const KEEP = ['volcano', 'crystal', 'grave', 'mushroom'];        // special places keep their own biome
  const WB = new Set(WONDERS.map(w => w.biome));                    // biomes with a landmark (its slot keeps the biome)
  const rid = () => (typeof RL !== 'undefined' && RL && RL.id) || 'sl';
  const legacyNow = () => typeof World.isLegacyGen === 'function' && World.isLegacyGen();
  const legacyBlock = (sx, sy) => typeof World.legacy22 === 'function' && World.legacy22({ key: nkey(sx, sy) });
  const wonderSlot = (sx, sy) => Math.hypot(sx, sy) >= 4 && h3(sx, sy, 77) <= 0.03;   // same test as v21terrain
  const lazy = (o, k, f) => Object.defineProperty(o, k, { get: f, enumerable: true, configurable: true });

  // ---------- tiles (ids from 29 upward; a taken id is skipped) ----------
  const freeFrom = n => { const used = new Set(Object.values(T)); while (used.has(n)) n++; return n; };
  T.BEACH = freeFrom(29);
  T.FARM = freeFrom(T.BEACH + 1);
  T.PADDY = freeFrom(T.FARM + 1);
  T.REDROCK = freeFrom(T.PADDY + 1);
  T.SAVANNA = freeFrom(T.REDROCK + 1);
  T.TUNDRA = freeFrom(T.SAVANNA + 1);
  const texOr = (...names) => () => names.find(n => IMG[n]) || names[names.length - 1];
  const tex = (tile, art, fallback) => Object.defineProperty(BIOME_TEX, tile, { enumerable: true, configurable: true, get: texOr(art, fallback) });
  tex(T.BEACH, 'tex22_sand', 'tex_sand');
  tex(T.FARM, 'tex22_farm', 'tex_dirt');
  tex(T.PADDY, 'tex22_paddy', 'tex_swamp');
  tex(T.REDROCK, 'tex22_redrock', 'tex_dirt');
  tex(T.SAVANNA, 'tex22_savanna', 'tex_grass');
  tex(T.TUNDRA, 'tex22_tundra', 'tex_snow');
  Object.assign(MINI_COL, {
    [T.BEACH]: [214, 196, 140], [T.FARM]: [128, 118, 56], [T.PADDY]: [70, 112, 60],
    [T.REDROCK]: [150, 80, 54], [T.SAVANNA]: [176, 160, 84], [T.TUNDRA]: [150, 160, 158],
  });

  // ---------- biomes ----------
  const NEW = ['farm', 'redrock', 'savanna', 'tundra', 'mangrove', 'bamboo', 'deadwood'];
  BIOMES.farm = { desc: 'Luống đất và bờ ruộng kéo dài tới chân trời. Lúa chín rụng đầy lối đi', alt: T.DIRT, trees: [], treeD: 0, amb: null };
  lazy(BIOMES.farm, 'name', () => (rid() === 'tt' ? 'Ruộng Lúa Nước' : 'Đồng Ruộng'));
  lazy(BIOMES.farm, 'ground', () => (rid() === 'tt' ? T.PADDY : T.FARM));       // tt: paddy fields, other worlds: furrows
  Object.assign(BIOMES, {
    redrock:  { name: 'Hẻm Núi Đá Đỏ', desc: 'Vách đá đỏ nứt nẻ, cột đá đứng lẻ loi dưới nắng gắt. Xương rồng bám vào khe đá', ground: T.REDROCK, alt: T.DIRT, trees: ['t22_cactus2', 't22_cactus2', 't22_redpillar'], treeD: 0.5, amb: 'sand', tint: 'rgba(200,110,60,0.06)' },
    savanna:  { name: 'Thảo Nguyên', desc: 'Cỏ vàng trải dài đến tận chân trời, vài cây keo nghiêng mình trước gió', ground: T.SAVANNA, alt: T.DIRT, trees: ['t22_acacia', 't22_acacia', 't22_acacia'], treeD: 0.6, amb: null, tint: 'rgba(220,190,90,0.05)' },
    tundra:   { name: 'Đài Nguyên', desc: 'Đất đóng băng quanh năm, bụi cây lùn cố bám sống qua mùa giá lạnh', ground: T.TUNDRA, alt: T.SNOW, water: T.ICE, lakes: 0.8, trees: [], treeD: 0, amb: 'snow', tint: 'rgba(170,190,215,0.06)' },
    mangrove: { name: 'Rừng Ngập Mặn', desc: 'Rễ cây ngập trong nước lợ, sương mù che khuất những vũng nước nông', ground: T.SWAMP, alt: T.LEAVES, lakes: 0.5, trees: ['t22_mangrove', 't22_mangrove', 'b_swamptree'], treeD: 1.4, amb: 'fog', tint: 'rgba(40,90,70,0.08)' },
    bamboo:   { name: 'Rừng Trúc', desc: 'Thân trúc vươn cao, gió lướt qua lá tạo thành tiếng xào xạc không ngớt', ground: T.JUNGLE, alt: T.LEAVES, trees: ['t22_bamboo', 't22_bamboo', 'b_bamboo'], treeD: 2.2, amb: 'leaves', tint: 'rgba(60,110,60,0.06)' },   // tt only (pick22)
    deadwood: { name: 'Rừng Chết', desc: 'Cây khô trơ cành dưới bầu trời xám. Không còn tiếng chim, chỉ còn gió', ground: T.DIRT, alt: T.ASH, trees: ['t22_deadtree', 't22_deadtree', 'tree_dead'], treeD: 1.1, amb: 'fog', tint: 'rgba(70,70,70,0.10)', dark: 0.15 },   // md only (pick22)
  });
  for (const b of NEW) if (!BIOME_IDS.includes(b)) BIOME_IDS.push(b);   // tile biome ids index this list

  // fallback sprites: the t22_* name stays the prop kind, only the drawn image changes (first existing one, checked at generation)
  const SPRITE22 = {
    t22_palm: ['b_palm', 'tree_pine'],
    t22_deadtree: ['tree_dead'],
    t22_wheat: ['b_fern', 'weeds'],
    t22_rice: ['weeds', 'bush'],
    t22_hay: ['rocks', 'rock'],
    t22_redpillar: ['b_lavarock', 'rock'],
    t22_acacia: ['tree_autumn', 'tree_oak'],
    t22_tundrashrub: ['bush', 'weeds'],
    t22_reeds: ['b_reeds', 'weeds'],
    t22_bamboo: ['b_bamboo', 'b_fern'],
    t22_mangrove: ['b_swamptree', 'tree_dead'],
    t22_cactus2: ['b_cactus', 'rocks'],
  };
  const drawName22 = img => { const l = SPRITE22[img]; return IMG[img] ? img : (l.find(n => IMG[n]) || l[l.length - 1]); };
  const addProp0 = World.addProp;
  World.addProp = function (img, x, y, o) {
    if (!SPRITE22[img]) return addProp0.call(this, img, x, y, o);
    return addProp0.call(this, drawName22(img), x, y, Object.assign({ kind: img }, o || {}));
  };

  // ---------- which far tile becomes which new biome ----------
  // rawZone repeats the base zoneOf (world.js) on purpose: the wrapped zoneOf calls biomeAt, so biomeAt cannot call it.
  const rawZone = (sx, sy) => {
    if (Math.abs(sx) <= 1 && Math.abs(sy) <= 1) return 1;
    const n = fbm(sx / 5 + 100, sy / 5 + 100, 3), near = Math.max(0, 0.12 - Math.hypot(sx, sy) * 0.01), v = n + near;
    return v > 0.6 ? 2 : v > 0.48 ? 1 : 0;
  };
  // farmland only in wild blocks that touch a village block ("gần làng"); memo per world seed
  const vilMemo = new Map(); let vilSeed = null;
  const nearVillage = (sx, sy) => {
    if (vilSeed !== World.seed) { vilMemo.clear(); vilSeed = World.seed; }
    const k = nkey(sx, sy); let v = vilMemo.get(k);
    if (v === undefined) {
      let touch = false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && rawZone(sx + dx, sy + dy) >= 1) touch = true;
      v = touch && rawZone(sx, sy) === 0;
      vilMemo.set(k, v);
    }
    return v;
  };
  // thresholds (share of far tiles per type, measured by the census in the test file)
  const T_RED = 0.55, T_SAV = 0.66, T_TUN = 0.57, T_MAN = 0.56, T_BAM = 0.64, T_DEAD = 0.63, T_FARM = 0.48;
  function pick22(fx, fy, b) {
    const f = (s, o) => fbm(fx / s + o, fy / s + o, 2);
    if (b === 'desert' && f(7, 2500) > T_RED) return 'redrock';
    if ((b === 'plains' || b === 'autumn') && f(8, 2600) > T_SAV) return 'savanna';
    if (b === 'snow' && f(8, 2700) > T_TUN) return 'tundra';
    if (b === 'swamp' && f(6, 2800) > T_MAN) return 'mangrove';
    if (rid() === 'tt' && (b === 'forest' || b === 'jungle') && f(7, 2900) > T_BAM) return 'bamboo';
    if (rid() === 'md' && (b === 'forest' || b === 'autumn') && f(7, 3000) > T_DEAD) return 'deadwood';
    if (b === 'plains' && f(6, 3100) > T_FARM && nearVillage(Math.floor(fx), Math.floor(fy))) return 'farm';
    return b;
  }
  const bioAt0 = World.biomeAt;
  World.biomeAt = function (fx, fy) {
    const b = bioAt0.call(this, fx, fy);
    if (this.mode !== 'over' || Math.hypot(fx, fy) < FAR || KEEP.includes(b) || legacyNow()) return b;
    const bx = Math.floor(fx), by = Math.floor(fy);
    if (wonderSlot(bx, by) && WB.has(bioAt0.call(this, bx + 0.5, by + 0.5))) return b;   // keeps the landmark's biome
    return pick22(fx, fy, b);
  };

  // ---------- block passes: beach band and mangrove pools (run after the base generation, not in legacy blocks) ----------
  const BEACH_FROM = new Set([T.GRASS, T.DIRT, T.SAND, T.DESERT, T.JUNGLE, T.LEAVES, T.SAKURA]);
  const RING = 4, GW = SB + 2 * RING;                               // the block plus RING tiles on every side
  function beachPass(sb) {
    const ox = sb.tx0 - RING, oy = sb.ty0 - RING;
    const d = new Int8Array(GW * GW).fill(-1), q = [];
    for (let y = 0; y < GW; y++) for (let x = 0; x < GW; x++) {
      const w = this.waterAt(ox + x, oy + y);                       // waterAt is the sea (1 shallow, 2 deep); lakes and rivers are not
      if (w === 1 || w === 2) { d[y * GW + x] = 0; q.push(y * GW + x); }
    }
    if (!q.length) return;
    for (let h = 0; h < q.length; h++) {                            // 8-neighbour distance from the sea, up to RING
      const c = q[h], cd = d[c]; if (cd >= RING) continue;
      const cx = c % GW, cy = (c - cx) / GW;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= GW || ny >= GW) continue;
        const ni = ny * GW + nx; if (d[ni] !== -1) continue;
        d[ni] = cd + 1; q.push(ni);
      }
    }
    const band = 2 + Math.floor(h3(sb.sx, sb.sy, 311) * 3);         // 2..4 tiles of sand, wobbling by one
    for (let y = 0; y < SB; y++) for (let x = 0; x < SB; x++) {
      const i = y * SB + x, dd = d[(y + RING) * GW + (x + RING)];
      if (dd < 1 || sb.bld[i] >= 0) continue;
      const gx = sb.tx0 + x, gy = sb.ty0 + y;
      const lim = Math.max(1, Math.min(RING, band + Math.round((fbm(gx / 5 + 3400, gy / 5 + 3400, 2) - 0.5) * 3)));
      if (dd > lim || !BEACH_FROM.has(sb.tiles[i])) continue;
      sb.tiles[i] = T.BEACH;
      if (dd >= 2 && SR.chance(0.035) && this.free(gx, gy, 1)) this.addProp('t22_palm', gx * TILE + 16, gy * TILE + 16, { canopy: true, r: 9, layer: 3, rot: SR.range(0, TAU) });
    }
  }
  function poolPass(sb) {                                           // shallow pools inside the mangrove (walkable: the player swims through them)
    const mi = BIOME_IDS.indexOf('mangrove');
    if (mi < 0) return;
    for (let y = 0; y < SB; y++) for (let x = 0; x < SB; x++) {
      const i = y * SB + x;
      if (sb.bio[i] !== mi || sb.tiles[i] !== T.SWAMP) continue;
      if (fbm((sb.tx0 + x) / 4 + 3500, (sb.ty0 + y) / 4 + 3500, 2) > 0.6) sb.tiles[i] = T.WATER;
    }
  }
  const genOver0 = World.genOver;
  World.genOver = function (sb) {
    const legacy = this.legacy22(sb);                               // read before the block is generated
    genOver0.call(this, sb);
    if (this.mode !== 'over' || legacy || sb.poi || sb.site || sb.buildings.length || sb.spawns.length) return;
    poolPass.call(this, sb);
    if (sb.zone === 0) beachPass.call(this, sb);
  };

  // ---------- decorations of the new biomes (genWild calls decorate for a biome covering > 12% of a block) ----------
  function decorate22(bk, biome, f) {
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
    const soft = { solid: false, r: 0 };
    switch (biome) {
      case 'farm':
        if (rid() === 'tt') for (let i = 0; i < k + 1; i++) cluster('t22_rice', SR.int(4, 6), 3, soft);
        else { for (let i = 0; i < k + 1; i++) cluster('t22_wheat', SR.int(4, 6), 3, soft); cluster('t22_hay', SR.int(1, 2), 2.5); }
        break;
      case 'redrock':
        cluster('t22_redpillar', SR.int(1, 2), 2.5);
        for (let i = 0; i < k; i++) cluster('t22_cactus2', SR.int(2, 3), 2);
        break;
      case 'savanna':
        for (let i = 0; i < k; i++) cluster('bush', SR.int(2, 3), 2.5, soft);
        break;
      case 'tundra':
        for (let i = 0; i < k + 1; i++) cluster('t22_tundrashrub', SR.int(2, 3), 2.5, soft);
        cluster('rocks', 2, 2.5);
        break;
      case 'mangrove':
        for (const [x, y] of W.shoreTiles(bk, biome)) if (SR.chance(0.35)) put('t22_reeds', x, y, soft);
        cluster('t22_reeds', 3, 2, soft);
        break;
      case 'bamboo':
        for (let i = 0; i < k + 1; i++) cluster('t22_bamboo', SR.int(3, 5), 2, { r: 7 });
        break;
      case 'deadwood':
        cluster('rocks', 2, 2.5);
        break;
    }
  }
  const decorate0 = World.decorate;
  World.decorate = function (bk, biome, f) {
    return NEW.includes(biome) && !legacyNow() ? decorate22.call(this, bk, biome, f) : decorate0.call(this, bk, biome, f);
  };
})();
