// ===== Infinite procedural world (superblocks of 32x32 tiles) + dungeon mode =====
const T = { GRASS: 0, ROAD: 1, SIDEWALK: 2, DIRT: 3, WOOD: 4, TILEF: 5, WALL: 6, WATER: 7, SAND: 8, CONC: 9, WINDOW: 10, FIELD: 11, GRAVEL: 12 };
const MINI_COL = {
  0: [52, 78, 38], 1: [52, 52, 56], 2: [120, 120, 118], 3: [110, 84, 52], 4: [120, 84, 50], 5: [150, 150, 150],
  6: [30, 26, 24], 7: [26, 62, 72], 8: [200, 180, 120], 9: [95, 95, 95], 10: [80, 120, 140], 11: [100, 90, 40], 12: [90, 90, 90],
};
const SB = 32;           // superblock size (tiles)
const CH = 8;            // render chunk size (tiles)
const CHPX = CH * TILE;
const SBPX = SB * TILE;

function h3(a, b, c) { // deterministic hash -> [0,1)
  let h = (a * 374761393 + b * 668265263 + c * 1442695041 + World.seed * 2654435761) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const nkey = (x, y) => (x + 50000) * 100000 + (y + 50000);

const World = {
  init(seed) {
    this.seed = seed;
    NOISE_SEED = seed;
    this.mode = 'over';
    this.delta = new Map();
    this.minis = new Map(); this.miniCv = new Map();
    this.explored = new Set();
    this.reset();
  },
  reset() {
    this.sbs = new Map();
    this.propGrid = new Map();
    this.decals = new Map();
    this.cache = new Map();
    this.lights = [];
    this.pending = [];
    this._last = null;
    this._gen = null;
  },
  // ---------- superblock access ----------
  sbOf(tx, ty) {
    const sx = Math.floor(tx / SB), sy = Math.floor(ty / SB);
    const g = this._gen;
    if (g) return (g.sx === sx && g.sy === sy) ? g : null;
    const l = this._last;
    if (l && l.sx === sx && l.sy === sy) return l;
    const sb = this.sbs.get(nkey(sx, sy)) || this.ensure(sx, sy);
    this._last = sb;
    return sb;
  },
  get(tx, ty) {
    const sb = this.sbOf(tx, ty);
    if (!sb) return this.mode === 'dungeon' ? T.WALL : T.GRASS;
    return sb.tiles[(ty - sb.ty0) * SB + (tx - sb.tx0)];
  },
  set(tx, ty, t) {
    const sb = this.sbOf(tx, ty); if (!sb) return;
    sb.tiles[(ty - sb.ty0) * SB + (tx - sb.tx0)] = t;
  },
  setBld(tx, ty, b) { const sb = this.sbOf(tx, ty); if (sb) sb.bld[(ty - sb.ty0) * SB + (tx - sb.tx0)] = b; },
  occAt(tx, ty) { const sb = this.sbOf(tx, ty); return sb ? sb.occ[(ty - sb.ty0) * SB + (tx - sb.tx0)] : 1; },
  setOcc(tx, ty) { const sb = this.sbOf(tx, ty); if (sb) sb.occ[(ty - sb.ty0) * SB + (tx - sb.tx0)] = 1; },
  inb() { return true; },
  isSolidT(t) { return t === T.WALL || t === T.WATER || t === T.WINDOW || t === T.LAVA; },
  isGround(t) { return t === T.GRASS || t === T.DIRT || (t >= 13 && t !== T.ICE && t !== T.LAVA); },
  solidAt(tx, ty) { return this.isSolidT(this.get(tx, ty)); },
  fill(x0, y0, x1, y1, t) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, t); },
  reserve(x0, y0, x1, y1) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.setOcc(x, y); },
  tileAtWorld(x, y) { return this.get(Math.floor(x / TILE), Math.floor(y / TILE)); },
  bldAt(x, y) {
    const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    const sb = this.sbOf(tx, ty); if (!sb) return null;
    const i = sb.bld[(ty - sb.ty0) * SB + (tx - sb.tx0)];
    return i >= 0 ? sb.buildings[i] : null;
  },
  walkable(tx, ty) {
    const sb = this.sbOf(tx, ty); if (!sb) return false;
    return !sb.block[(ty - sb.ty0) * SB + (tx - sb.tx0)];
  },
  free(tx, ty, rad = 0) {
    for (let y = ty - rad; y <= ty + rad; y++) for (let x = tx - rad; x <= tx + rad; x++) {
      const sb = this.sbOf(x, y); if (!sb) return false;
      const i = (y - sb.ty0) * SB + (x - sb.tx0);
      if (sb.occ[i] || this.isSolidT(sb.tiles[i]) || sb.bld[i] >= 0) return false;
    }
    return true;
  },

  ensure(sx, sy) {
    const k = nkey(sx, sy);
    let sb = this.sbs.get(k);
    if (sb) return sb;
    sb = {
      sx, sy, key: k, tx0: sx * SB, ty0: sy * SB,
      tiles: new Uint8Array(SB * SB), bld: new Int16Array(SB * SB).fill(-1), occ: new Uint8Array(SB * SB), block: new Uint8Array(SB * SB), mark: new Uint8Array(SB * SB),
      props: [], buildings: [], spawns: [], zone: 0, lights: [],
    };
    const prevGen = this._gen, prevLast = this._last;
    this._gen = sb;
    srand = mulberry32((h3(sx, sy, 7) * 4294967296) | 0);
    try {
      if (this.mode === 'dungeon') this.genDungeon(sb); else this.genOver(sb);
    } catch (e) { console.error('gen error', sx, sy, e); }
    this._gen = prevGen; this._last = prevLast;
    // finalize
    for (let i = 0; i < SB * SB; i++) if (this.isSolidT(sb.tiles[i])) sb.block[i] = 1;
    const d = this.mode === 'over' ? this.delta.get(k) : null;
    sb.props.forEach((p, idx) => {
      p.id = k + ':' + idx;
      if (d && d.removed && d.removed.has(idx)) { p.dead = true; return; }
      if (d && d.looted && d.looted.has(idx)) { p.looted = true; if (p.container === 'chest') p.img = 'chest_' + p.data.tier + 'o'; }
      this.gridAdd(p);
      this.markBlock(p, 1, sb);
      if (p.light) this.lights.push(p);
    });
    this.sbs.set(k, sb);
    if (!this.minis.has(this.mode + k)) this.buildMini(sb);
    if (!(d && d.cleared)) for (const s of sb.spawns) this.pending.push(s);
    return sb;
  },
  sbDelta(p) {
    const [k, idx] = p.id.split(':');
    let d = this.delta.get(+k); if (!d) this.delta.set(+k, d = { looted: new Set(), removed: new Set() });
    return [d, +idx];
  },
  markLooted(p) { p.looted = true; if (this.mode === 'over' && p.id && !p.placed) { const [d, i] = this.sbDelta(p); d.looted.add(i); } },
  markRemoved(p) { if (this.mode === 'over' && p.id && !p.placed) { const [d, i] = this.sbDelta(p); d.removed.add(i); } },
  markCleared(sb) { if (this.mode !== 'over') return; let d = this.delta.get(sb.key); if (!d) this.delta.set(sb.key, d = { looted: new Set(), removed: new Set() }); d.cleared = true; },

  // keep the area around the player generated, drop far areas
  update(px, py) {
    const sx = Math.floor(px / SBPX), sy = Math.floor(py / SBPX);
    for (let y = sy - 1; y <= sy + 1; y++) for (let x = sx - 1; x <= sx + 1; x++) this.ensure(x, y);
    // generate the outer ring lazily (one per frame)
    for (let y = sy - 2; y <= sy + 2; y++) for (let x = sx - 2; x <= sx + 2; x++) {
      if (!this.sbs.has(nkey(x, y))) { this.ensure(x, y); return; }
    }
    if (G.frame % 30 === 0) {
      for (const [k, sb] of this.sbs) if (Math.abs(sb.sx - sx) > 3 || Math.abs(sb.sy - sy) > 3) this.unload(sb);
    }
  },
  unload(sb) {
    for (const p of sb.props) if (!p.dead) { this.gridRemove(p); }
    this.lights = this.lights.filter(l => l.sb !== sb && !(l.x >= sb.tx0 * TILE && l.x < (sb.tx0 + SB) * TILE && l.y >= sb.ty0 * TILE && l.y < (sb.ty0 + SB) * TILE));
    for (let cy = 0; cy < 4; cy++) for (let cx = 0; cx < 4; cx++) {
      const k = nkey(sb.sx * 4 + cx, sb.sy * 4 + cy);
      this.cache.delete(k); this.decals.delete(k);
    }
    this.sbs.delete(sb.key);
    if (this._last === sb) this._last = null;
  },

  // ---------- zones ----------
  zoneOf(sx, sy) {
    if (this.mode === 'dungeon') return 0;
    if (Math.abs(sx) <= 1 && Math.abs(sy) <= 1) return (sx === 0 && sy === 0) ? 1 : 1;
    const n = fbm(sx / 5 + 100, sy / 5 + 100, 3);
    const near = Math.max(0, 0.12 - Math.hypot(sx, sy) * 0.01);
    const v = n + near;
    return v > 0.6 ? 2 : v > 0.48 ? 1 : 0;
  },
  hasV(sx, sy) { return this.zoneOf(sx, sy) > 0 || this.zoneOf(sx - 1, sy) > 0 || ((sx % 4) + 4) % 4 === 0; },
  hasH(sx, sy) { return this.zoneOf(sx, sy) > 0 || this.zoneOf(sx, sy - 1) > 0 || ((sy % 4) + 4) % 4 === 0; },
  gateRank(sx, sy) {
    const d = Math.hypot(sx, sy) + (h3(sx, sy, 99) - 0.5) * 4;
    return d < 4 ? 'E' : d < 8 ? 'D' : d < 13 ? 'C' : d < 19 ? 'B' : d < 27 ? 'A' : 'S';
  },
  // biome at fractional superblock coordinates
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
  levelAt(x, y) {
    if (this.mode === 'dungeon') return this.dg.level;
    return Math.max(1, Math.floor(1 + Math.hypot(x, y) / TILE / 45));
  },

  // ---------- overworld generation ----------
  genOver(sb) {
    const { sx, sy, tx0, ty0 } = sb;
    const zone = this.zoneOf(sx, sy);
    sb.zone = zone;
    const R = RL;
    // ground
    sb.biome = this.biomeAt(sx + 0.5, sy + 0.5);
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
    }
    // roads along the west / north edges
    const V = this.hasV(sx, sy), H = this.hasH(sx, sy);
    const urban = zone > 0;
    if (V) for (let y = 0; y < SB; y++) for (let k = 0; k < 4; k++) sb.tiles[y * SB + k] = T.ROAD;
    if (H) for (let x = 0; x < SB; x++) for (let k = 0; k < 4; k++) sb.tiles[k * SB + x] = T.ROAD;
    if (V) for (let y = 0; y < SB; y++) if (!(H && y < 4)) sb.mark[y * SB + 2] |= 1;
    if (H) for (let x = 0; x < SB; x++) if (!(V && x < 4)) sb.mark[2 * SB + x] |= 2;
    if (V && H && urban) {
      for (let k = 0; k < 4; k++) { sb.mark[5 * SB + k] |= 4; sb.mark[k * SB + 5] |= 8; }
    }
    // sidewalks / shoulders
    const side = urban ? T.SIDEWALK : T.DIRT;
    if (V) for (let y = 0; y < SB; y++) if (!(H && y < 4) && sb.tiles[y * SB + 4] !== T.WATER) sb.tiles[y * SB + 4] = side;
    if (H) for (let x = 0; x < SB; x++) if (!(V && x < 4) && sb.tiles[4 * SB + x] !== T.WATER) sb.tiles[4 * SB + x] = side;
    if (this.hasV(sx + 1, sy) && urban) for (let y = (H ? 4 : 0); y < SB; y++) sb.tiles[y * SB + 31] = T.SIDEWALK;
    if (this.hasH(sx, sy + 1) && urban) for (let x = (V ? 4 : 0); x < SB; x++) sb.tiles[31 * SB + x] = T.SIDEWALK;
    for (let i = 0; i < SB * SB; i++) if (sb.tiles[i] === T.ROAD) sb.occ[i] = 0;
    // interior
    const ix0 = tx0 + (V ? 5 : 1), iy0 = ty0 + (H ? 5 : 1), ix1 = tx0 + 30, iy1 = ty0 + 30;
    const bk = { x0: ix0, y0: iy0, x1: ix1, y1: iy1 };
    // story / forced points of interest
    const forced = (typeof Story !== 'undefined') ? Story.poiAt(sx, sy) : null;
    if (sx === 0 && sy === 0) { this.genStart(bk); }
    else if (forced) this.genPOI(bk, forced, sb);
    else {
      const r = SR.f();
      const gateP = R.gatesCommon ? 0.09 : 0.045;
      if (r < gateP) this.genPOI(bk, { kind: 'gate', rank: this.gateRank(sx, sy) }, sb);
      else if (r < gateP + 0.05) this.genPOI(bk, { kind: 'cache' }, sb);
      else if (r < gateP + 0.10) this.genPOI(bk, { kind: 'rescue' }, sb);
      else if (r < gateP + 0.13) this.genPOI(bk, { kind: 'camp' }, sb);
      else if (r < gateP + 0.165 && Math.hypot(sx, sy) >= 3) this.genPOI(bk, { kind: 'ruins' }, sb);
      else if (zone === 2) (R.style === 'sect' ? this.genPalace(bk) : this.genTown(bk));
      else if (zone === 1) (R.style === 'cyber' && SR.chance(0.25) ? this.genParking(bk) : SR.chance(0.12) ? this.genPark(bk) : this.genVillage(bk));
      else this.genWild(bk);
    }
    if (sb.pendingTrees) { for (const [x, y, img] of sb.pendingTrees) this.tryTree(x, y, false, [img]); sb.pendingTrees = null; }
    // road clutter
    for (let y = 0; y < SB; y++) for (let x = 0; x < SB; x++) {
      const i = y * SB + x;
      if (sb.tiles[i] !== T.ROAD || sb.occ[i]) continue;
      const gx = tx0 + x, gy = ty0 + y;
      if (SR.chance(urban ? 0.006 : 0.003) && this.free(gx, gy, 1) && R.props.cars.length) {
        const vertical = x < 4 && !(y < 4);
        const rot = (vertical ? Math.PI / 2 : 0) + (SR.chance(0.5) ? Math.PI : 0) + SR.range(-0.35, 0.35);
        const big = SR.chance(0.06) && R.props.big.length;
        const img = big ? SR.pick(R.props.big) : SR.pick(R.props.cars);
        const drivable = !big && R.drivable.includes(img) && SR.chance(0.25);
        this.addProp(img, gx * TILE + 16, gy * TILE + 16, { rot, container: R.cars ? 'car' : 'crate', drivable, fuel: SR.int(10, 60) });
      } else if (SR.chance(urban ? 0.0025 : 0.001) && this.free(gx, gy)) {
        const n = SR.int(1, 3);
        for (let k = 0; k < n; k++) this.addProp(R.props.barrel, gx * TILE + 16 + k * 18, gy * TILE + 16, { r: 9, explosive: true });
      } else if (SR.chance(0.004)) {
        this.addDecal(SR.pick(['pothole', 'blood1', 'blood3', 'scorch']), gx * TILE + 16, gy * TILE + 16, SR.range(0, TAU), SR.range(0.7, 1), 0.8);
      }
    }
    if (urban && R.props.lamp && V) for (let y = 8; y < SB; y += 12) if (this.free(tx0 + 4, ty0 + y)) this.addProp(R.props.lamp, (tx0 + 4) * TILE + 20, (ty0 + y) * TILE, { solid: false, light: 120, lightCol: R.id === 'cy' ? 'cyan' : R.id === 'ct' ? 'red' : null });
  },

  genStart(bk) {
    // a safe house with starter loot
    const cx = Math.floor((bk.x0 + bk.x1) / 2), cy = Math.floor((bk.y0 + bk.y1) / 2);
    const b = this.makeBuilding(cx - 4, cy - 3, cx + 4, cy + 3, { type: 'house', name: 'Nơi trú ẩn', floor: T.WOOD, roof: RL.roofs[1] || RL.roofs[0], doors: ['s'], doorW: 2, rooms: 0, containers: 0 });
    this.container(RL.props.crate[0], cx - 2, cy - 1, 'start1');
    this.container(RL.props.crate[0], cx + 2, cy - 1, 'start2');
    this.container(RL.props.special, cx, cy + 1, 'start3');
    this.startPos = { x: cx * TILE + 16, y: (cy + 1) * TILE + 16 };
    this.shelterPos = this.startPos;
    this.startHouse = b;
    this.addProp('fx_4', cx * TILE + 16, (cy + 6) * TILE, { solid: false, light: 150, kind: 'campfire', lightCol: 'fire' });
    this._gen.spawns.push({ kind: 'merchant', x: (cx + 4) * TILE, y: (cy + 6) * TILE + 8 });
    this.chest(cx - 4, cy + 7, 0);
    for (let k = 0; k < 6; k++) this.tryTree(SR.int(bk.x0, bk.x1), SR.int(bk.y0, bk.y1), true);
  },

  // ---------- props ----------
  addProp(img, x, y, o = {}) {
    const im = IMG[img];
    const w = im ? im.width / 2 : 32, h = im ? im.height / 2 : 32;
    const p = {
      img, x, y, rot: o.rot || 0, w, h,
      solid: o.solid !== false, bullet: o.bullet !== false && o.solid !== false,
      canopy: !!o.canopy, container: o.container || null, looted: false,
      kind: o.kind || img, light: o.light || 0, lightCol: o.lightCol || null, drivable: !!o.drivable, fuel: o.fuel || 0, hp: o.hp || 0,
      circles: [], layer: o.layer ?? 1, alpha: 1, name: o.name, explosive: !!o.explosive, data: o.data || null,
    };
    if (p.solid) {
      if (o.r) p.circles.push({ x, y, r: o.r });
      else {
        const long = Math.max(w, h) * (o.shrink || 0.88), short = Math.min(w, h) * (o.shrink || 0.88);
        const r = short / 2;
        const n = Math.max(1, Math.ceil((long - short) / r) + 1);
        const along = w >= h ? p.rot : p.rot + Math.PI / 2;
        const ca = Math.cos(along), sa = Math.sin(along);
        for (let k = 0; k < n; k++) {
          const t = n === 1 ? 0 : -((long - short) / 2) + (long - short) * k / (n - 1);
          p.circles.push({ x: x + ca * t, y: y + sa * t, r });
        }
      }
    }
    const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    if (this._gen) {
      this._gen.props.push(p);
      const rad = Math.ceil(Math.max(w, h) / 2 / TILE);
      if (p.solid) for (let yy = ty - rad + 1; yy <= ty + rad - 1; yy++) for (let xx = tx - rad + 1; xx <= tx + rad - 1; xx++) this.setOcc(xx, yy);
      this.setOcc(tx, ty);
    } else {
      // runtime prop (barricade, parked car, boss reward...)
      p.placed = true;
      const sb = this.sbOf(tx, ty);
      if (sb) { sb.props.push(p); p.id = sb.key + ':r' + sb.props.length; }
      this.gridAdd(p);
      this.markBlock(p, 1);
      if (p.light) this.lights.push(p);
    }
    return p;
  },
  gridAdd(p) {
    const ext = Math.max(p.w, p.h) / 2 + 4;
    const bx0 = Math.floor((p.x - ext) / 128), bx1 = Math.floor((p.x + ext) / 128);
    const by0 = Math.floor((p.y - ext) / 128), by1 = Math.floor((p.y + ext) / 128);
    p.cells = [];
    for (let by = by0; by <= by1; by++) for (let bx = bx0; bx <= bx1; bx++) {
      const k = nkey(bx, by);
      let a = this.propGrid.get(k); if (!a) this.propGrid.set(k, a = []);
      a.push(p); p.cells.push(k);
    }
  },
  gridRemove(p) {
    for (const k of p.cells || []) { const a = this.propGrid.get(k); if (a) { const i = a.indexOf(p); if (i >= 0) a.splice(i, 1); if (!a.length) this.propGrid.delete(k); } }
    p.cells = [];
  },
  removeProp(p) {
    this.markBlock(p, 0);
    this.gridRemove(p);
    p.dead = true;
    this.markRemoved(p);
    const i = this.lights.indexOf(p); if (i >= 0) this.lights.splice(i, 1);
  },
  propsNear(x, y, r, out = []) {
    out.length = 0;
    const bx0 = Math.floor((x - r) / 128), bx1 = Math.floor((x + r) / 128);
    const by0 = Math.floor((y - r) / 128), by1 = Math.floor((y + r) / 128);
    for (let by = by0; by <= by1; by++) for (let bx = bx0; bx <= bx1; bx++) {
      const a = this.propGrid.get(nkey(bx, by));
      if (a) for (const p of a) if (!p._q || p._q !== this._qn) { p._q = this._qn; out.push(p); }
    }
    this._qn = (this._qn || 0) + 1;
    return out;
  },
  markBlock(p, v, sbHint) {
    if (!p.solid) return;
    for (const c of p.circles) {
      if (c.r < 9) continue;
      const tx = Math.floor(c.x / TILE), ty = Math.floor(c.y / TILE);
      const sb = sbHint && Math.floor(tx / SB) === sbHint.sx && Math.floor(ty / SB) === sbHint.sy ? sbHint : (this._gen ? null : this.sbs.get(nkey(Math.floor(tx / SB), Math.floor(ty / SB))));
      if (!sb) continue;
      const i = (ty - sb.ty0) * SB + (tx - sb.tx0);
      if (!this.isSolidT(sb.tiles[i])) sb.block[i] = v;
    }
  },
  // tier: 0 wood, 1 silver, 2 gold, 3 diamond (rolled up a little at random)
  rollChest(base) { let t = base; if (SR.chance(0.25)) t++; if (SR.chance(0.06)) t++; return clamp(t, 0, 3); },
  chest(tx, ty, tier) { return this.container('chest_' + tier, tx, ty, 'chest', { kind: 'chest', r: 12, data: { tier } }); },
  container(img, tx, ty, kind, o = {}) {
    return this.addProp(img, tx * TILE + 16, ty * TILE + 16, Object.assign({ container: kind }, o));
  },
  tryTree(tx, ty, city, list) {
    if (!this.free(tx, ty, 1)) return;
    const B = this._gen && BIOMES[this._gen.biome];
    const t = SR.pick(list || (B && B.trees && B.trees.length ? B.trees : RL.props.trees));
    this.addProp(t, tx * TILE + 16, ty * TILE + 16, { canopy: true, r: 9, layer: 3, rot: SR.range(0, TAU) });
  },

  // ---------- buildings ----------
  makeBuilding(x0, y0, x1, y1, o) {
    const sb = this._gen;
    const b = { x0, y0, x1, y1, type: o.type, name: o.name || '', roof: o.roof || RL.roofs[0], roofAlpha: 1, seed: SR.int(0, 1e6) };
    const id = sb.buildings.length;
    sb.buildings.push(b);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const edge = x === x0 || x === x1 || y === y0 || y === y1;
      this.set(x, y, edge ? T.WALL : o.floor);
      this.setBld(x, y, id);
    }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const edge = x === x0 || x === x1 || y === y0 || y === y1;
      const corner = (x === x0 || x === x1) && (y === y0 || y === y1);
      if (edge && !corner && SR.chance(o.windows ?? 0.18)) this.set(x, y, T.WINDOW);
    }
    const doorTiles = [];
    const split = (ax, ay, bx, by, depth) => {
      const w = bx - ax + 1, h = by - ay + 1;
      if (depth <= 0 || (w < 9 && h < 9)) return;
      if (w >= h && w >= 9) {
        const sx = SR.int(ax + 3, bx - 3);
        for (let y = ay; y <= by; y++) this.set(sx, y, T.WALL);
        const dy = SR.int(ay, by - 1); this.set(sx, dy, o.floor); this.set(sx, dy + 1, o.floor); doorTiles.push([sx, dy], [sx, dy + 1]);
        split(ax, ay, sx - 1, by, depth - 1); split(sx + 1, ay, bx, by, depth - 1);
      } else if (h >= 9) {
        const sy = SR.int(ay + 3, by - 3);
        for (let x = ax; x <= bx; x++) this.set(x, sy, T.WALL);
        const dx = SR.int(ax, bx - 1); this.set(dx, sy, o.floor); this.set(dx + 1, sy, o.floor); doorTiles.push([dx, sy], [dx + 1, sy]);
        split(ax, ay, bx, sy - 1, depth - 1); split(ax, sy + 1, bx, by, depth - 1);
      }
    };
    split(x0 + 1, y0 + 1, x1 - 1, y1 - 1, o.rooms ?? 1);
    b.doors = [];
    for (const side of o.doors) {
      let dx, dy, horiz;
      const dw = o.doorW || 2;
      if (side === 'n' || side === 's') { dx = SR.int(x0 + 1, x1 - dw); dy = side === 'n' ? y0 : y1; horiz = true; }
      else { dy = SR.int(y0 + 1, y1 - dw); dx = side === 'w' ? x0 : x1; horiz = false; }
      for (let k = 0; k < dw; k++) {
        const tx = horiz ? dx + k : dx, ty = horiz ? dy : dy + k;
        this.set(tx, ty, o.floor); doorTiles.push([tx, ty]);
        const ox = side === 'w' ? tx - 1 : side === 'e' ? tx + 1 : tx, oy = side === 'n' ? ty - 1 : side === 's' ? ty + 1 : ty;
        this.setOcc(ox, oy); if (this.isSolidT(this.get(ox, oy))) this.set(ox, oy, T.SIDEWALK);
        b.doors.push([tx, ty]);
      }
    }
    for (const [tx, ty] of doorTiles) for (let yy = ty - 1; yy <= ty + 1; yy++) for (let xx = tx - 1; xx <= tx + 1; xx++) this.setOcc(xx, yy);
    const want = o.containers ?? 2;
    let placed = 0, tries = 0;
    while (placed < want && tries++ < 200) {
      const tx = SR.int(x0 + 1, x1 - 1), ty = SR.int(y0 + 1, y1 - 1);
      if (this.get(tx, ty) !== o.floor || this.occAt(tx, ty)) continue;
      const nearWall = this.isSolidT(this.get(tx - 1, ty)) || this.isSolidT(this.get(tx + 1, ty)) || this.isSolidT(this.get(tx, ty - 1)) || this.isSolidT(this.get(tx, ty + 1));
      if (!nearWall) continue;
      if (SR.chance(0.07)) { this.chest(tx, ty, this.rollChest(0)); placed++; continue; }
      const spr = typeof o.cimg === 'function' ? o.cimg() : (o.cimg || SR.pick(RL.props.crate));
      this.container(spr, tx, ty, o.loot || 'house');
      placed++;
    }
    b.cx = (x0 + x1 + 1) / 2 * TILE; b.cy = (y0 + y1 + 1) / 2 * TILE;
    return b;
  },
  randomFloorTile(b, deep) {
    for (let i = 0; i < 300; i++) {
      const tx = SR.int(b.x0 + 1, b.x1 - 1), ty = SR.int(b.y0 + 1, b.y1 - 1);
      if (!this.isSolidT(this.get(tx, ty)) && !this.occAt(tx, ty)) {
        if (deep && b.doors.length) {
          const dd = Math.min(...b.doors.map(([dx, dy]) => Math.hypot(dx - tx, dy - ty)));
          if (dd < Math.min(b.x1 - b.x0, b.y1 - b.y0) * 0.6 && i < 250) continue;
        }
        return [tx, ty];
      }
    }
    return [b.x0 + 1, b.y0 + 1];
  },
  houseFloor() { return RL.style === 'cyber' ? T.TILEF : T.WOOD; },

  genTown(bk) {
    const rects = [[bk.x0, bk.y0, bk.x1, bk.y1]];
    const out = [];
    const ancient = RL.style === 'ancient';
    while (rects.length) {
      const [ax, ay, bx, by] = rects.pop();
      const w = bx - ax + 1, h = by - ay + 1;
      const lim = ancient ? 10 : 13;
      if (w > lim && (w >= h || h <= lim) && SR.chance(0.85)) {
        const s = SR.int(ax + 5, bx - 6);
        rects.push([ax, ay, s - 1, by], [s + 2, ay, bx, by]);
        for (let y = ay; y <= by; y++) for (let x = s; x <= s + 1; x++) this.set(x, y, ancient ? T.CONC : T.CONC);
      } else if (h > lim && SR.chance(0.85)) {
        const s = SR.int(ay + 5, by - 6);
        rects.push([ax, ay, bx, s - 1], [ax, s + 2, bx, by]);
        for (let x = ax; x <= bx; x++) for (let y = s; y <= s + 1; y++) this.set(x, y, T.CONC);
      } else out.push([ax, ay, bx, by]);
    }
    for (const [ax, ay, bx, by] of out) {
      if (ancient && SR.chance(0.25)) { // market square
        for (let y = ay; y <= by; y++) for (let x = ax; x <= bx; x++) this.set(x, y, T.CONC);
        for (let k = 0; k < 4; k++) { const tx = SR.int(ax + 1, bx - 1), ty = SR.int(ay + 1, by - 1); if (this.free(tx, ty, 1)) this.container(RL.props.vending[0], tx, ty, 'market'); }
        if (this.free(Math.floor((ax + bx) / 2), Math.floor((ay + by) / 2))) this.addProp(SR.pick(RL.props.decor), Math.floor((ax + bx) / 2) * TILE + 16, Math.floor((ay + by) / 2) * TILE + 16, {});
        continue;
      }
      const doors = [];
      if (ay === bk.y0) doors.push('n'); if (by === bk.y1) doors.push('s');
      if (ax === bk.x0) doors.push('w'); if (bx === bk.x1) doors.push('e');
      if (!doors.length) doors.push('s');
      const t = SR.pick(['office', 'shop', 'apartment', 'store']);
      const names = {
        modern: { office: 'Văn phòng', shop: 'Cửa hàng', apartment: 'Chung cư', store: 'Nhà kho' },
        cyber: { office: 'Tháp tập đoàn', shop: 'Chợ đen', apartment: 'Khu ổ chuột', store: 'Kho dữ liệu' },
        ancient: { office: 'Phủ quan', shop: 'Tiệm thuốc', apartment: 'Nhà dân', store: 'Kho lương' },
        sect: { office: 'Điện', shop: 'Đan phòng', apartment: 'Tĩnh thất', store: 'Tàng kinh các' },
      }[RL.style] || {};
      this.makeBuilding(ax, ay, bx, by, {
        type: t, name: names[t], floor: SR.pick([T.TILEF, T.WOOD]), roof: SR.chance(0.7) ? RL.roofs[0] : RL.roofs[1],
        doors: [SR.pick(doors)].concat(SR.chance(0.4) ? [SR.pick(doors)] : []), rooms: 2, containers: SR.int(2, 4),
        loot: t === 'store' ? 'crate' : t === 'shop' ? 'market' : 'house', cimg: () => SR.chance(0.15) ? RL.props.vending[0] : SR.pick(RL.props.crate),
      });
    }
    for (let y = bk.y0; y <= bk.y1; y++) for (let x = bk.x0; x <= bk.x1; x++) {
      if (this.get(x, y) === T.CONC && !this.occAt(x, y) && SR.chance(0.05)) {
        const k = SR.pick(['bin', 'trash', 'barrel', 'crate', 'decor']);
        if (k === 'barrel') this.addProp(RL.props.barrel, x * TILE + 16, y * TILE + 16, { r: 9, explosive: true });
        else if (k === 'decor') { if (this.free(x, y, 1)) this.addProp(SR.pick(RL.props.decor), x * TILE + 16, y * TILE + 16, {}); }
        else this.addProp(SR.pick(RL.props[k]), x * TILE + 16, y * TILE + 16, { container: k === 'bin' || k === 'trash' ? 'trash' : 'crate' });
      }
    }
    if (SR.chance(0.25)) for (let k = 0; k < 40; k++) { const x = SR.int(bk.x0, bk.x1), y = SR.int(bk.y0, bk.y1); if (this.get(x, y) === T.CONC && this.free(x, y, 1)) { this.merchant(x, y); break; } }
    if (RL.props.lamp) for (let k = 0; k < 2; k++) { const x = SR.int(bk.x0, bk.x1), y = SR.int(bk.y0, bk.y1); if (this.get(x, y) === T.CONC && this.free(x, y)) this.addProp(RL.props.lamp, x * TILE + 16, y * TILE + 16, { solid: false, light: 110, lightCol: RL.id === 'cy' ? 'magenta' : RL.id === 'ct' ? 'red' : null }); }
  },
  genVillage(bk) {
    const lw = Math.floor((bk.x1 - bk.x0 + 1) / 2), lh = Math.floor((bk.y1 - bk.y0 + 1) / 2);
    const ancient = RL.style === 'ancient', sect = RL.style === 'sect';
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      const lx0 = bk.x0 + i * lw, ly0 = bk.y0 + j * lh, lx1 = lx0 + lw - 1, ly1 = ly0 + lh - 1;
      if (SR.chance(ancient ? 0.3 : 0.12)) { // fields / gardens / empty lot
        if (ancient) { for (let y = ly0 + 1; y < ly1; y++) for (let x = lx0 + 1; x < lx1; x++) this.set(x, y, (y % 4 === 0) ? T.WATER : T.FIELD); this.reserve(lx0, ly0, lx1, ly1); if (this.free(lx0, ly0)) this.container(RL.props.trash[0], lx0, ly0, 'trash'); }
        else if (sect) { for (let k = 0; k < 5; k++) { const x = SR.int(lx0 + 1, lx1 - 1), y = SR.int(ly0 + 1, ly1 - 1); if (this.free(x, y)) this.container('tt_p_0', x, y, 'herb', { solid: false }); } }
        else for (let k = 0; k < 3; k++) this.tryTree(SR.int(lx0 + 1, lx1 - 1), SR.int(ly0 + 1, ly1 - 1), true);
        continue;
      }
      const hw = SR.int(6, Math.min(8, lw - 2)), hh = SR.int(5, Math.min(7, lh - 2));
      const hx0 = lx0 + SR.int(1, Math.max(1, lw - hw - 1)), hy0 = j === 0 ? ly0 + 1 : ly1 - hh;
      const door = j === 0 ? 'n' : 's';
      const nm = { modern: 'Nhà dân', cyber: 'Căn hộ ổ chuột', ancient: 'Nhà tranh', sect: 'Tĩnh thất' }[RL.style];
      this.makeBuilding(hx0, hy0, hx0 + hw - 1, hy0 + hh - 1, {
        type: 'house', name: nm, floor: this.houseFloor(), roof: (ancient || sect) ? RL.roofs[0] : (RL.roofs[1] || RL.roofs[0]), doors: [door], doorW: 1, rooms: 1,
        containers: SR.int(1, 3), loot: 'house',
      });
      const fy = j === 0 ? ly1 : ly0;
      if (RL.props.fence) for (let x = lx0; x <= lx1; x++) if (SR.chance(0.75) && this.free(x, fy)) this.addProp(RL.props.fence, x * TILE + 16, fy * TILE + 16, { shrink: 0.7 });
      for (let k = 0; k < 2; k++) this.tryTree(SR.int(lx0 + 1, lx1 - 1), SR.int(ly0 + 1, ly1 - 1), true);
      if (SR.chance(0.35)) {
        const cx = hx0 + hw + 1;
        if (cx < lx1 && this.free(cx, hy0 + 2, 1)) {
          const img = RL.props.cars.length ? SR.pick(RL.props.cars) : SR.pick(RL.props.decor);
          this.addProp(img, cx * TILE + 16, (hy0 + 2) * TILE, { rot: Math.PI / 2, container: RL.cars ? 'car' : 'crate', drivable: RL.drivable.includes(img) && SR.chance(0.3), fuel: SR.int(10, 50) });
        }
      }
      const dy = fy + (j === 0 ? -1 : 1);
      if (SR.chance(0.4) && this.free(lx0 + 1, dy)) this.container(SR.pick(RL.props.trash), lx0 + 1, dy, 'trash');
      if (SR.chance(0.3) && this.free(lx1 - 1, dy)) this.addProp(SR.pick(RL.props.decor), (lx1 - 1) * TILE + 16, dy * TILE + 16, {});
    }
  },
  genPalace(bk) {
    for (let y = bk.y0; y <= bk.y1; y++) for (let x = bk.x0; x <= bk.x1; x++) this.set(x, y, T.CONC);
    const cx = Math.floor((bk.x0 + bk.x1) / 2), cy = Math.floor((bk.y0 + bk.y1) / 2);
    const w = SR.int(7, 9), h = SR.int(5, 7);
    this.makeBuilding(cx - w, cy - h, cx + w, cy + h - 3, { type: 'palace', name: SR.pick(['Đại điện', 'Chính điện', 'Tàng kinh các', 'Luyện đan phòng']), floor: T.TILEF, roof: RL.roofs[0], doors: ['s'], doorW: 3, rooms: 2, containers: 5, loot: 'treasure', cimg: RL.props.special, windows: 0.1 });
    for (const [x, y] of [[cx - w - 2, cy + h], [cx + w + 2, cy + h], [cx - w - 2, cy - h], [cx + w + 2, cy - h]]) if (this.free(x, y)) this.addProp(RL.props.lamp, x * TILE + 16, y * TILE + 16, { light: 120, r: 9 });
    for (let k = 0; k < 6; k++) { const x = SR.int(bk.x0, bk.x1), y = SR.int(bk.y0, bk.y1); if (this.free(x, y, 1)) this.addProp(SR.pick(RL.props.decor), x * TILE + 16, y * TILE + 16, {}); }
    for (let k = 0; k < 6; k++) this.tryTree(SR.int(bk.x0, bk.x1), SR.int(bk.y0, bk.y1), true);
  },
  genPark(bk) {
    for (let y = bk.y0; y <= bk.y1; y++) for (let x = bk.x0; x <= bk.x1; x++) this.set(x, y, T.GRASS);
    const mx = Math.floor((bk.x0 + bk.x1) / 2), my = Math.floor((bk.y0 + bk.y1) / 2);
    for (let x = bk.x0; x <= bk.x1; x++) this.set(x, my, T.DIRT);
    for (let y = bk.y0; y <= bk.y1; y++) this.set(mx, y, T.DIRT);
    for (let k = 0; k < 4; k++) { const tx = mx + SR.int(-3, 3), ty = my + SR.pick([-1, 1]) * 2; if (this.free(tx, ty)) this.addProp(RL.props.bench, tx * TILE + 16, ty * TILE + 16, { shrink: 0.6 }); }
    for (let k = 0; k < 14; k++) this.tryTree(SR.int(bk.x0, bk.x1), SR.int(bk.y0, bk.y1), true);
    if (this.free(mx + 2, my + 2)) this.addProp(RL.props.fire, (mx + 2) * TILE + 16, (my + 2) * TILE + 16, { r: 9, light: 110, kind: 'firebarrel', lightCol: 'fire' });
  },
  genParking(bk) {
    for (let y = bk.y0; y <= bk.y1; y++) for (let x = bk.x0; x <= bk.x1; x++) this.set(x, y, T.ROAD);
    for (let y = bk.y0 + 2; y <= bk.y1 - 2; y += 5) for (let x = bk.x0 + 1; x <= bk.x1 - 1; x += 3) {
      if (SR.chance(0.45) && RL.props.cars.length) {
        const img = SR.pick(RL.props.cars);
        this.addProp(img, x * TILE + 16, y * TILE + 32, { rot: Math.PI / 2 + SR.range(-0.12, 0.12), container: 'car', drivable: RL.drivable.includes(img) && SR.chance(0.25), fuel: SR.int(5, 60) });
      }
    }
  },
  genWild(bk) {
    const st = RL.style;
    if (st === 'ancient' && SR.chance(0.4)) { // rice paddies
      for (let y = bk.y0; y <= bk.y1; y++) for (let x = bk.x0; x <= bk.x1; x++) if (this.get(x, y) !== T.WATER) this.set(x, y, (y % 5 === 0) ? T.DIRT : (x % 7 === 0 ? T.DIRT : T.FIELD));
      for (let k = 0; k < 3; k++) { const x = SR.int(bk.x0, bk.x1), y = SR.int(bk.y0, bk.y1); if (this.free(x, y)) this.container(RL.props.trash[0], x, y, 'trash'); }
      this.reserve(bk.x0, bk.y0, bk.x1, bk.y1);
      return;
    }
    const B = BIOMES[this._gen.biome] || BIOMES.plains;
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
      else if (n > 0.5 && SR.chance((0.08 + (n - 0.5) * 0.6) * B.treeD)) this.tryTree(x, y, false);
      else if (SR.chance(0.006)) this.addProp(SR.pick(RL.props.rocks), x * TILE + 16, y * TILE + 16, { r: 12, rot: SR.range(0, TAU) });
      else if (SR.chance(0.012)) this.addProp(SR.pick([RL.props.bush, RL.props.weeds, RL.props.weeds]), x * TILE + 16, y * TILE + 16, { solid: false, rot: SR.range(0, TAU) });
      else if (st === 'sect' && SR.chance(0.004)) this.container(SR.pick(['tt_p_0', 'tt_p_1']), x, y, 'herb', { solid: false });
      else if (st === 'cyber' && SR.chance(0.003)) this.addProp(RL.props.barrel, x * TILE + 16, y * TILE + 16, { r: 9, explosive: true });
    }
  },

  // ---------- special places ----------
  fort(bk, size) { // walled compound, returns inner rect
    const cx = Math.floor((bk.x0 + bk.x1) / 2), cy = Math.floor((bk.y0 + bk.y1) / 2);
    const x0 = cx - size, y0 = cy - size, x1 = cx + size, y1 = cy + size;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const edge = x === x0 || x === x1 || y === y0 || y === y1;
      this.set(x, y, edge ? T.WALL : T.CONC);
      this.setOcc(x, y);
    }
    // gates on every side
    for (const [gx, gy] of [[cx, y0], [cx, y1], [x0, cy], [x1, cy]]) for (let k = -1; k <= 1; k++) this.set(gx === cx ? gx + k : gx, gy === cy ? gy + k : gy, T.CONC);
    for (const [x, y] of [[x0 + 2, y0 + 2], [x1 - 2, y0 + 2], [x0 + 2, y1 - 2], [x1 - 2, y1 - 2]]) this.addProp(RL.props.lamp || 'lamp', x * TILE + 16, y * TILE + 16, { light: 130, r: 9, lightCol: 'fire' });
    return { cx, cy, x0, y0, x1, y1 };
  },
  merchant(tx, ty) {
    this.setOcc(tx, ty);
    this._gen.spawns.push({ kind: 'merchant', x: tx * TILE + 16, y: ty * TILE + 16 });
    if (RL.props.tent && this.free(tx + 2, ty - 1)) this.addProp(RL.props.tent, (tx + 2) * TILE + 16, (ty - 1) * TILE + 16, { shrink: 0.6 });
  },
  spawnGuards(x, y, n, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = SR.range(0, TAU), d = SR.range(30, o.r || 150);
      this._gen.spawns.push({ kind: 'enemy', arche: SR.pick(o.types || ['walker', 'walker', 'runner', 'armored', 'ranged', 'brute']), x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, elite: SR.chance(o.elite || 0.12), guard: true });
    }
  },
  genPOI(bk, poi, sb) {
    const cx = Math.floor((bk.x0 + bk.x1) / 2), cy = Math.floor((bk.y0 + bk.y1) / 2);
    const px = cx * TILE + 16, py = cy * TILE + 16;
    sb.poi = poi;
    switch (poi.kind) {
      case 'gate': {
        for (let y = cy - 5; y <= cy + 5; y++) for (let x = cx - 5; x <= cx + 5; x++) if (Math.hypot(x - cx, y - cy) < 5.5) this.set(x, y, T.GRAVEL);
        this.reserve(cx - 6, cy - 6, cx + 6, cy + 6);
        const red = poi.rank === 'A' || poi.rank === 'S' || poi.story;
        this.addProp(red ? 'fx_1' : 'fx_0', px, py, { solid: false, layer: 0, kind: 'gate', light: 170, lightCol: red ? 'red' : 'blue', data: { rank: poi.rank, story: !!poi.story, seed: (h3(sb.sx, sb.sy, 5) * 1e9) | 0 } });
        this.spawnGuards(px, py, poi.story ? 6 : 3, { r: 220, elite: 0.2 });
        for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; this.addProp(SR.pick(RL.props.rocks), px + Math.cos(a) * 200, py + Math.sin(a) * 200, { r: 12 }); }
        break;
      }
      case 'cache': {
        const f = this.fort(bk, 7);
        this.chest(f.cx, f.cy, this.rollChest(1));
        for (let k = 0; k < 3; k++) this.container(SR.pick(RL.props.crate), f.cx + SR.int(-4, 4), f.cy + SR.int(-4, 4), 'crate');
        this.spawnGuards(px, py, 7, { r: 160, elite: 0.35 });
        break;
      }
      case 'rescue': {
        for (let y = cy - 4; y <= cy + 4; y++) for (let x = cx - 4; x <= cx + 4; x++) this.set(x, y, T.CONC);
        this.reserve(cx - 5, cy - 5, cx + 5, cy + 5);
        this.addProp('fx_4', px, py + 40, { solid: false, light: 140, kind: 'campfire', lightCol: 'fire' });
        const n = SR.int(1, 3);
        for (let i = 0; i < n; i++) sb.spawns.push({ kind: 'civ', x: px + SR.range(-50, 50), y: py + SR.range(-40, 20), sprite: SR.int(2, 3) });
        this.spawnGuards(px, py, SR.int(6, 10), { r: 260, elite: 0.1 });
        break;
      }
      case 'camp': {
        for (let y = cy - 3; y <= cy + 3; y++) for (let x = cx - 4; x <= cx + 4; x++) if (this.get(x, y) !== T.WATER) this.set(x, y, T.DIRT);
        this.reserve(cx - 5, cy - 4, cx + 5, cy + 4);
        this.addProp('fx_4', px, py, { solid: false, light: 170, kind: 'campfire', lightCol: 'fire' });
        this.addProp('fx_5', px - 60, py - 20, { solid: false, layer: 0 });
        this.addProp(RL.props.tent, px + 70, py - 40, { shrink: 0.65 });
        this.container(SR.pick(RL.props.crate), cx - 3, cy + 2, 'camp');
        this.container(SR.pick(RL.props.crate), cx + 3, cy + 2, 'camp');
        if (SR.chance(0.6)) this.merchant(cx - 1, cy - 2);
        break;
      }
      case 'ruins': {
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
      case 'landmark': {
        const f = this.fort(bk, 6);
        this.addProp('fx_4', px, py, { solid: false, light: 170, kind: 'campfire', lightCol: 'fire' });
        this.addProp(SR.pick(RL.props.decor), px, py - 80, {});
        this.chest(f.cx + 3, f.cy + 3, this.rollChest(1));
        this.spawnGuards(px, py, 4, { r: 200 });
        break;
      }
      case 'artifact': {
        const f = this.fort(bk, 8);
        this.container(RL.props.special, f.cx, f.cy, 'artifact', { name: 'artifact' });
        this.spawnGuards(px, py, 9, { r: 200, elite: 0.3 });
        break;
      }
      case 'captive': {
        const f = this.fort(bk, 8);
        this.addProp('fx_6', px, py, { kind: 'cage', r: 18, data: { comp: poi.comp } });
        this.spawnGuards(px, py, 11, { r: 220, elite: 0.35 });
        break;
      }
      case 'storygate': {
        this.genPOI(bk, { kind: 'gate', rank: poi.rank, story: true }, sb);
        break;
      }
      case 'lair': {
        const f = this.fort(bk, 11);
        sb.spawns.push({ kind: 'boss', x: px, y: py - 40, story: true });
        this.spawnGuards(px, py, 12, { r: 300, elite: 0.4 });
        for (let k = 0; k < 6; k++) this.addProp(RL.props.barrel, (f.x0 + 2 + k * 3) * TILE, (f.y1 - 2) * TILE, { r: 9, explosive: true });
        break;
      }
    }
  },

  // ---------- dungeon ----------
  enterDungeon(dg) {
    this.overMinis = this.overMinis || null;
    this.mode = 'dungeon';
    this.dg = dg;
    this.reset();
    for (const k of [...this.minis.keys()]) if (String(k).startsWith('dungeon')) { this.minis.delete(k); this.miniCv.delete(k); }
    for (const k of [...this.explored]) if (String(k).startsWith('dungeon')) this.explored.delete(k);
    // path from start (0,0) to boss room
    const ang = h3(dg.floor, dg.seed % 997, 3) * TAU;
    const dist = 2 + Math.floor(h3(dg.floor, 1, dg.seed % 991) * 2) + Math.min(1, dg.floor - 1);
    dg.bx = Math.round(Math.cos(ang) * dist); dg.by = Math.round(Math.sin(ang) * dist);
    if (!dg.bx && !dg.by) dg.bx = 3;
    dg.forced = new Set();
    dg.box = { x0: Math.min(0, dg.bx) - 1, x1: Math.max(0, dg.bx) + 1, y0: Math.min(0, dg.by) - 1, y1: Math.max(0, dg.by) + 1 };
    let x = 0, y = 0;
    while (x !== dg.bx) { const nx = x + Math.sign(dg.bx - x); dg.forced.add('e' + Math.min(x, nx) + ',' + y); x = nx; }
    while (y !== dg.by) { const ny = y + Math.sign(dg.by - y); dg.forced.add('s' + x + ',' + Math.min(y, ny)); y = ny; }
  },
  inBox(sx, sy) { const b = this.dg.box; return sx >= b.x0 && sx <= b.x1 && sy >= b.y0 && sy <= b.y1; },
  edgeE(sx, sy) { return this.dg.forced.has('e' + sx + ',' + sy) || (this.inBox(sx, sy) && this.inBox(sx + 1, sy) && h3(sx, sy, 11 + this.dg.floor) < 0.6); },
  edgeS(sx, sy) { return this.dg.forced.has('s' + sx + ',' + sy) || (this.inBox(sx, sy) && this.inBox(sx, sy + 1) && h3(sx, sy, 23 + this.dg.floor) < 0.6); },
  genDungeon(sb) {
    const { sx, sy, tx0, ty0 } = sb;
    const dg = this.dg;
    sb.tiles.fill(T.WALL);
    if (!this.inBox(sx, sy)) return;
    const isStart = sx === 0 && sy === 0, isBoss = sx === dg.bx && sy === dg.by;
    const floor = SR.chance(0.5) ? T.TILEF : T.WOOD;
    const carve = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x >= tx0 + 1 && x < tx0 + SB - 1 || true) this.set(x, y, T.TILEF); };
    const mx = tx0 + 16, my = ty0 + 16;
    let room = null;
    if (isStart || isBoss || SR.chance(0.8)) {
      const w = isBoss ? 11 : SR.int(4, 9), h = isBoss ? 11 : SR.int(4, 9);
      room = { x0: mx - w, y0: my - h, x1: mx + w, y1: my + h };
      carve(room.x0, room.y0, room.x1, room.y1);
    }
    const E = this.edgeE(sx, sy), W = this.edgeE(sx - 1, sy), S = this.edgeS(sx, sy), N = this.edgeS(sx, sy - 1);
    if (E) carve(mx, my - 1, tx0 + SB - 1, my + 1);
    if (W) carve(tx0, my - 1, mx, my + 1);
    if (S) carve(mx - 1, my, mx + 1, ty0 + SB - 1);
    if (N) carve(mx - 1, ty0, mx + 1, my);
    if (!room && !(E || W || S || N)) return;
    if (!room) carve(mx - 2, my - 2, mx + 2, my + 2);
    const D = RL.dungeon;
    // torches along room edges
    if (room) {
      for (const [x, y] of [[room.x0, room.y0], [room.x1, room.y0], [room.x0, room.y1], [room.x1, room.y1]]) this.addProp(D.torch, x * TILE + 16, y * TILE + 16, { light: 150, r: 8, lightCol: 'fire', kind: 'torch' });
      const nd = SR.int(1, 4);
      for (let k = 0; k < nd; k++) { const x = SR.int(room.x0 + 1, room.x1 - 1), y = SR.int(room.y0 + 1, room.y1 - 1); if (this.free(x, y, 1) && Math.hypot(x - mx, y - my) > 2) this.addProp(SR.pick(D.decor), x * TILE + 16, y * TILE + 16, { container: SR.chance(0.4) ? 'crate' : null }); }
      if (SR.chance(0.4) && !isStart) { const x = SR.int(room.x0 + 1, room.x1 - 1), y = SR.int(room.y0 + 1, room.y1 - 1); if (this.free(x, y)) this.chest(x, y, this.rollChest(RANKS.indexOf(dg.rank) >= 3 ? 1 : 0)); }
      if (SR.chance(0.25)) for (let k = 0; k < 3; k++) this.addDecal(SR.pick(['blood1', 'blood2', 'scorch']), SR.int(room.x0, room.x1) * TILE, SR.int(room.y0, room.y1) * TILE, SR.range(0, TAU), 0.8, 0.6);
    }
    if (isStart) {
      this.addProp(RL.id === 'sl' ? 'sl_p_9' : 'fx_0', mx * TILE + 16, (my - 4) * TILE, { solid: false, layer: 0, kind: 'exit', light: 170, lightCol: 'blue' });
      this.startPos = { x: mx * TILE + 16, y: (my + 1) * TILE };
      return;
    }
    if (isBoss) {
      sb.spawns.push({ kind: 'boss', x: mx * TILE, y: my * TILE, dungeon: true });
      return;
    }
    // monsters
    const n = room ? SR.int(2, 5) + Math.floor(dg.floor / 2) : SR.int(0, 2);
    for (let i = 0; i < n; i++) {
      const x = (room ? SR.int(room.x0 + 1, room.x1 - 1) : mx + SR.int(-2, 2)) * TILE + 16;
      const y = (room ? SR.int(room.y0 + 1, room.y1 - 1) : my + SR.int(-2, 2)) * TILE + 16;
      sb.spawns.push({ kind: 'enemy', arche: weighted({ walker: 30, runner: 22, ranged: 14, armored: 12, brute: 6 + dg.floor * 2, exploder: 8 }, SR.f), x, y, elite: SR.chance(0.1 + dg.floor * 0.03), guard: true });
    }
  },

  // ---------- decals ----------
  addDecal(img, x, y, rot = 0, scale = 1, alpha = 1, dark) {
    const im = IMG[img]; if (!im) return;
    const d = { img, x, y, rot, scale, alpha, dark };
    const r = Math.max(im.width, im.height) / 4 * scale;
    const cx0 = Math.floor((x - r) / CHPX), cx1 = Math.floor((x + r) / CHPX), cy0 = Math.floor((y - r) / CHPX), cy1 = Math.floor((y + r) / CHPX);
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      const k = nkey(cx, cy);
      let arr = this.decals.get(k); if (!arr) this.decals.set(k, arr = []);
      arr.push(d); if (arr.length > 70) arr.shift();
      const c = this.cache.get(k);
      if (c) this.drawDecal(c.ctx, d);
    }
  },
  drawDecal(ctx, d) {
    const im = d.dark ? G.darkOf(d.img) : IMG[d.img];
    ctx.save();
    ctx.globalAlpha = d.alpha;
    ctx.translate(d.x, d.y); ctx.rotate(d.rot); ctx.scale(d.scale, d.scale);
    ctx.drawImage(im, -im.width / 4, -im.height / 4, im.width / 2, im.height / 2);
    ctx.restore();
  },
  paintSplat(x, y, color, size) {
    const c = this.cache.get(nkey(Math.floor(x / CHPX), Math.floor(y / CHPX)));
    if (c) { c.ctx.fillStyle = color; c.ctx.fillRect(Math.round(x), Math.round(y), size, size); }
  },

  // ---------- chunk rendering ----------
  getChunk(cx, cy) {
    const k = nkey(cx, cy);
    let c = this.cache.get(k);
    if (c) { c.used = G.frame; return c.canvas; }
    const canvas = document.createElement('canvas');
    const res = G.lowGfx ? 1 : 2;
    canvas.width = canvas.height = CHPX * res;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.scale(res, res);
    ctx.translate(-cx * CHPX, -cy * CHPX);
    this.renderChunk(ctx, cx, cy);
    c = { canvas, ctx, used: G.frame };
    this.cache.set(k, c);
    if (this.cache.size > (G.lowGfx ? 70 : Touch.on ? 34 : 48)) {
      let oldK = null, old = 1e12;
      for (const [kk, v] of this.cache) if (v.used < old) { old = v.used; oldK = kk; }
      this.cache.delete(oldK);
    }
    return canvas;
  },
  pattern(ctx, name) {
    const im = IMG[name] || IMG.tex_grass;
    const p = ctx.createPattern(im, 'repeat');
    p.setTransform(new DOMMatrix().scale(0.5));
    return p;
  },
  texOf(t) {
    if (this.mode === 'dungeon' && (t === T.TILEF || t === T.WOOD)) return RL.dungeon.floor;
    return RL.tex[t] || BIOME_TEX[t] || RL.tex[0];
  },
  renderChunk(ctx, cx, cy) {
    const pats = {};
    const pat = t => pats[t] || (pats[t] = this.pattern(ctx, this.texOf(t)));
    const wallTex = this.mode === 'dungeon' ? RL.dungeon.wall : RL.wall;
    const wallPat = wallTex ? this.pattern(ctx, wallTex) : null;
    const tx0 = cx * CH, ty0 = cy * CH;
    const isWall = t => t === T.WALL || t === T.WINDOW;
    for (let ty = ty0; ty < ty0 + CH; ty++) for (let tx = tx0; tx < tx0 + CH; tx++) {
      const t = this.get(tx, ty);
      const X = tx * TILE, Y = ty * TILE;
      if (isWall(t)) {
        // deep rock (no open neighbour) is drawn as void
        let open = false;
        for (let dy = -1; dy <= 1 && !open; dy++) for (let dx = -1; dx <= 1; dx++) if (!isWall(this.get(tx + dx, ty + dy))) { open = true; break; }
        if (!open) { ctx.fillStyle = '#07080b'; ctx.fillRect(X, Y, TILE, TILE); continue; }
        if (wallPat) {
          ctx.fillStyle = wallPat; ctx.fillRect(X, Y, TILE, TILE);
          ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(X, Y + TILE - 4, TILE, 4);
        } else {
          ctx.fillStyle = '#4a423b'; ctx.fillRect(X, Y, TILE, TILE);
          ctx.fillStyle = '#3a332d';
          for (let r = 0; r < 4; r++) {
            ctx.fillRect(X, Y + r * 8 + 7, TILE, 1);
            const off = (r % 2) * 8;
            ctx.fillRect(X + off + 7, Y + r * 8, 1, 8); ctx.fillRect(X + off + 23, Y + r * 8, 1, 8);
          }
        }
        ctx.fillStyle = 'rgba(255,240,220,0.08)'; ctx.fillRect(X, Y, TILE, 2);
        if (t === T.WINDOW) {
          const horiz = this.isSolidT(this.get(tx - 1, ty)) || this.isSolidT(this.get(tx + 1, ty));
          ctx.fillStyle = '#20343c';
          if (horiz) ctx.fillRect(X + 2, Y + 11, TILE - 4, 10); else ctx.fillRect(X + 11, Y + 2, 10, TILE - 4);
          ctx.fillStyle = RL.id === 'cy' ? 'rgba(255,90,220,0.6)' : 'rgba(140,200,220,0.55)';
          if (horiz) ctx.fillRect(X + 3, Y + 12, TILE - 6, 3); else ctx.fillRect(X + 12, Y + 3, 3, TILE - 6);
        }
        continue;
      }
      ctx.fillStyle = pat(t);
      ctx.fillRect(X, Y, TILE, TILE);
      const h = hash2(tx, ty);
      if (t === T.GRASS || t === T.DIRT) { ctx.fillStyle = h > 0.5 ? `rgba(0,0,0,${(h - 0.5) * 0.18})` : `rgba(255,255,200,${(0.5 - h) * 0.06})`; ctx.fillRect(X, Y, TILE, TILE); }
      if (t === T.FIELD) { ctx.fillStyle = 'rgba(40,30,10,0.3)'; for (let k = 0; k < 4; k++) ctx.fillRect(X, Y + k * 8 + 3, TILE, 2); ctx.fillStyle = 'rgba(110,150,50,0.65)'; for (let k = 0; k < 4; k++) ctx.fillRect(X + (k * 9 + Math.floor(h * 7)) % 30, Y + 5, 2, 20); }
      if (t === T.CONC) { ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(X, Y, TILE, TILE); }
      if (t === T.ROAD || t === T.SIDEWALK) {
        ctx.fillStyle = t === T.ROAD ? '#8c8c88' : 'rgba(0,0,0,0.25)';
        for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
          const n = this.get(tx + dx, ty + dy);
          const curb = t === T.ROAD ? n === T.SIDEWALK : (n === T.GRASS || n === T.DIRT);
          if (!curb) continue;
          if (dy === -1) ctx.fillRect(X, Y, TILE, 2); if (dy === 1) ctx.fillRect(X, Y + TILE - 2, TILE, 2);
          if (dx === -1) ctx.fillRect(X, Y, 2, TILE); if (dx === 1) ctx.fillRect(X + TILE - 2, Y, 2, TILE);
        }
      }
      const up = this.get(tx, ty - 1), left = this.get(tx - 1, ty);
      if (isWall(up)) { ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.fillRect(X, Y, TILE, 7); }
      if (isWall(left)) { ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(X, Y, 5, TILE); }
      const sb = this.sbOf(tx, ty);
      const m = sb ? sb.mark[(ty - sb.ty0) * SB + (tx - sb.tx0)] : 0;
      if (m && this.mode === 'over') {
        ctx.fillStyle = RL.id === 'cy' ? 'rgba(60,240,255,0.7)' : RL.style === 'ancient' || RL.style === 'sect' ? 'rgba(0,0,0,0)' : 'rgba(214,170,40,0.75)';
        if (m & 1) ctx.fillRect(X - 1, Y + 4, 2, 16);
        if (m & 2) ctx.fillRect(X + 4, Y - 1, 16, 2);
        ctx.fillStyle = 'rgba(220,220,210,0.5)';
        if (RL.style === 'modern' || RL.style === 'cyber') {
          if (m & 4) for (let k = 0; k < 4; k++) ctx.fillRect(X + 3 + k * 7, Y + 4, 4, 24);
          if (m & 8) for (let k = 0; k < 4; k++) ctx.fillRect(X + 4, Y + 3 + k * 7, 24, 4);
        }
      }
      if (t === T.WATER) { ctx.fillStyle = 'rgba(0,10,20,0.2)'; ctx.fillRect(X, Y, TILE, TILE); }
    }
    const arr = this.decals.get(nkey(cx, cy));
    if (arr) for (const d of arr) this.drawDecal(ctx, d);
  },

  // ---------- collision ----------
  collideCircle(e, r) {
    const tx0 = Math.floor((e.x - r) / TILE), tx1 = Math.floor((e.x + r) / TILE);
    const ty0 = Math.floor((e.y - r) / TILE), ty1 = Math.floor((e.y + r) / TILE);
    let hit = false;
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      if (!this.solidAt(tx, ty)) continue;
      const nx = clamp(e.x, tx * TILE, tx * TILE + TILE), ny = clamp(e.y, ty * TILE, ty * TILE + TILE);
      const dx = e.x - nx, dy = e.y - ny; const d2 = dx * dx + dy * dy;
      if (d2 < r * r) {
        hit = true;
        if (d2 === 0) {
          const l = e.x - tx * TILE, rr = tx * TILE + TILE - e.x, u = e.y - ty * TILE, dd = ty * TILE + TILE - e.y;
          const mn = Math.min(l, rr, u, dd);
          if (mn === l) e.x -= l + r; else if (mn === rr) e.x += rr + r; else if (mn === u) e.y -= u + r; else e.y += dd + r;
        } else { const d = Math.sqrt(d2); e.x += dx / d * (r - d); e.y += dy / d * (r - d); }
      }
    }
    const near = this.propsNear(e.x, e.y, r + 60, this._tmp || (this._tmp = []));
    for (const p of near) {
      if (!p.solid || p === e.ignoreProp || p.dead) continue;
      for (const c of p.circles) {
        const dx = e.x - c.x, dy = e.y - c.y, rr = r + c.r;
        const d2 = dx * dx + dy * dy;
        if (d2 < rr * rr && d2 > 0.0001) { const d = Math.sqrt(d2); e.x += dx / d * (rr - d); e.y += dy / d * (rr - d); hit = p; }
      }
    }
    return hit;
  },
  los(x0, y0, x1, y1) {
    const d = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.ceil(d / 14);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (this.get(Math.floor((x0 + (x1 - x0) * t) / TILE), Math.floor((y0 + (y1 - y0) * t) / TILE)) === T.WALL) return false;
    }
    return true;
  },

  // ---------- minimap ----------
  getMini(k) {
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
    const dot = (x, y, s, col) => { for (let yy = y; yy < y + s; yy++) for (let xx = x; xx < x + s; xx++) if (xx >= 0 && yy >= 0 && xx < SB && yy < SB) { const i = (yy * SB + xx) * 4; im.data[i] = col[0]; im.data[i + 1] = col[1]; im.data[i + 2] = col[2]; } };
    const dung = this.mode === 'dungeon';
    for (let i = 0; i < SB * SB; i++) {
      let col = MINI_COL[sb.tiles[i]] || [0, 0, 0];
      if (dung) col = sb.tiles[i] === T.WALL ? [10, 10, 14] : [90, 84, 100];
      const bi = sb.bld[i];
      if (bi >= 0 && sb.tiles[i] !== T.WALL && sb.tiles[i] !== T.WINDOW) col = sb.buildings[bi].roof === RL.roofs[1] ? [120, 60, 45] : [85, 85, 95];
      im.data[i * 4] = col[0]; im.data[i * 4 + 1] = col[1]; im.data[i * 4 + 2] = col[2]; im.data[i * 4 + 3] = 255;
    }
    for (const p of sb.props) {
      const x = Math.floor(p.x / TILE) - sb.tx0, y = Math.floor(p.y / TILE) - sb.ty0;
      if (p.canopy) dot(x - 1, y - 1, 3, [30, 60, 25]);
      if (p.kind === 'gate') dot(x - 2, y - 2, 5, p.img === 'fx_1' ? [255, 59, 59] : [77, 166, 255]);
    }
    for (const b of sb.buildings) for (const [x, y] of b.doors || []) dot(x - sb.tx0, y - sb.ty0, 1, [255, 214, 90]);
    if (sb.poi && sb.poi.kind === 'ruins') dot(14, 14, 4, [190, 90, 255]);
    const k = this.mode + sb.key;
    this.minis.set(k, im); this.miniCv.delete(k);
    if (this.minis.size > 5000) this.minis.delete(this.minis.keys().next().value);
  },
};
