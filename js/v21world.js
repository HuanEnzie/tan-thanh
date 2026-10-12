// ===== v21world (package B1): hospital, shopping mall, restaurant, furniture inside buildings, bridges =====
// Save rule: props are indexed by their order in the block, and saved looted/removed marks use that index.
//  - A "legacy" block (World.delta has it, B1 never generated it) keeps the old generation exactly.
//  - Any other block is generated with B1. B1 only ever appends props while the base generation runs
//    (inside makeBuilding), so the orbs (v5) and gates (v20) appended later never shift an index B1 uses.
//  - Furniture is always created; when its sprite is not loaded the prop is dead (p.cull), so the prop list
//    does not depend on which sprites exist, and the furniture comes alive once the sprite is there.
//  - B1 writes the blocks it changed into World.delta[B21_KEY].looted. That entry is saved and synced with
//    the delta, so a regenerated block keeps the same layout after it has received loot marks.
//  - Bridges are tile changes (ROAD -> BRIDGE) plus a draw-only rail overlay, so they add no props.
(function () {
  const B21_KEY = -21;   // World.delta slot; block keys are always positive, so this cannot clash
  Object.assign(T, { BRIDGE: 40 });                      // 40, not the next free id, so a sequential id from another package cannot collide
  Object.assign(MINI_COL, { 40: [118, 96, 64] });
  LOOT.fridge = [['food', 5, 1, 2], ['water', 5, 1, 2], ['choco', 1, 1, 1], ['energy', 1.5, 1, 1]];
  LOOT.kitchen = [['food', 4, 1, 2], ['water', 3, 1, 2], ['gas', 2, 1, 1], ['scrap', 1, 1, 1], ['planks', 1, 1, 1]];
  for (const id of ['mana_s', 'elixir']) if (ITEMS[id] && !LOOT.medical.some(e => e[0] === id)) LOOT.medical.push([id, 1.5, 1, 1]);

  const isWaterT = t => t === T.WATER || t === T.DEEP || t === T.LAVA;
  // the record of blocks generated with B1 (created on first write)
  const recOf = create => {
    let d = World.delta.get(B21_KEY);
    if (!d && create) World.delta.set(B21_KEY, d = { looted: new Set(), removed: new Set(), cleared: false });
    return d ? d.looted : null;
  };

  // ---------- new buildings ----------
  const SPECIAL = {
    hospital: { w: 16, h: 11, floor: T.TILEF, roof: 1, doors: ['s', 'n'], doorW: 2, rooms: 2, containers: 3, loot: 'medical',
      name: () => R21({ md: 'Bệnh viện', sl: 'Bệnh viện Hiệp hội', tt: 'Y Quán' }) },
    mall: { w: 24, h: 18, floor: T.TILEF, roof: 0, doors: ['s', 'w', 'e'], doorW: 3, rooms: 3, containers: 6, loot: 'market',
      name: () => R21({ md: 'Trung tâm thương mại', sl: 'Trung tâm thương mại', tt: 'Thương Hội' }) },
    restaurant: { w: 12, h: 8, floor: T.WOOD, roof: 1, doors: ['s'], doorW: 2, rooms: 1, containers: 2, loot: 'kitchen',
      name: () => R21({ md: 'Quán ăn', sl: 'Quán ăn', tt: 'Tửu Lâu' }) },
  };
  // which special building (if any) replaces the town/village of a block; pure hash, no SR draw
  const specialFor = sb => {
    if (sb.sx === 0 && sb.sy === 0) return null;
    const u = h3(sb.sx, sb.sy, 2101);
    if (sb.zone === 2) return u < 0.08 ? 'hospital' : u < 0.14 ? 'mall' : u < 0.24 ? 'restaurant' : null;
    if (sb.zone === 1) return u < 0.10 ? 'restaurant' : null;
    return null;
  };
  // true when the special building was built; false leaves the old generator to run untouched
  const buildSpecial = (sb, kind, bk) => {
    const S = SPECIAL[kind];
    // centred in the block; the spare width is split evenly, so a 24-wide mall in a 26-wide block keeps 1 tile of yard
    const x0 = bk.x0 + Math.floor((bk.x1 - bk.x0 + 1 - S.w) / 2), y0 = bk.y0 + Math.floor((bk.y1 - bk.y0 + 1 - S.h) / 2);
    const x1 = x0 + S.w - 1, y1 = y0 + S.h - 1;
    if (x0 - 1 < bk.x0 || y0 - 1 < bk.y0 || x1 + 1 > bk.x1 || y1 + 1 > bk.y1) return false; // one tile of yard for the doors
    for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) if (isWaterT(World.get(x, y))) return false;
    for (let y = bk.y0; y <= bk.y1; y++) for (let x = bk.x0; x <= bk.x1; x++) if (!isWaterT(World.get(x, y))) World.set(x, y, T.CONC);
    World.makeBuilding(x0, y0, x1, y1, { type: kind, name: S.name(), floor: S.floor, roof: RL.roofs[S.roof] || RL.roofs[0],
      doors: S.doors, doorW: S.doorW, rooms: S.rooms, containers: S.containers, loot: S.loot });
    sb._b21c = true;
    return true;
  };
  for (const name of ['genTown', 'genVillage', 'genPalace']) {
    const g = World[name];
    World[name] = function (bk) {
      const sb = this._gen, kind = sb && sb._b21 ? specialFor(sb) : null;
      if (kind && buildSpecial(sb, kind, bk)) return;
      return g.call(this, bk);
    };
  }

  // ---------- furniture ----------
  // [item, count, container loot (null = none), solid]. Item keys follow the sprite contract (plan section 13).
  const FURN = {
    house: [['bed', 1, null, 1], ['table', 1, null, 1], ['sofa', 1, null, 1], ['wardrobe', 1, 'armor', 1], ['stove', 1, 'kitchen', 1],
      ['fridge', 1, 'fridge', 1], ['tv', 1, null, 1], ['shelf', 1, 'house', 1], ['plantpot', 1, null, 0]],
    office: [['officedesk', 2, null, 1], ['desk', 1, null, 1], ['cabinet', 2, 'house', 1], ['bookshelf', 1, 'house', 1], ['plantpot', 1, null, 0], ['sofa', 1, null, 1]],
    shop: [['checkout', 1, 'market', 1], ['shelf', 3, 'market', 1], ['vending', 1, 'market', 1], ['plantpot', 1, null, 0]],
    store: [['rack', 2, 'armor', 1], ['shelf', 2, 'crate', 1], ['cabinet', 1, 'crate', 1]],
    palace: [['table', 2, null, 1], ['cabinet', 2, 'treasure', 1], ['shelf', 1, 'house', 1], ['plantpot', 2, null, 0], ['sofa', 1, null, 1]],
    hospital: [['hbed', 5, null, 1], ['medcab', 2, 'medical', 1], ['ivstand', 2, null, 0], ['desk', 1, null, 1], ['checkout', 1, 'medical', 1], ['cabinet', 1, 'medical', 1]],
    mall: [['checkout', 2, 'market', 1], ['shelf', 4, 'market', 1], ['rack', 2, 'armor', 1], ['mannequin', 2, 'armor', 1], ['vending', 1, 'market', 1], ['plantpot', 2, null, 0]],
    restaurant: [['table', 4, null, 1], ['stove', 1, 'kitchen', 1], ['fridge', 1, 'fridge', 1], ['checkout', 1, 'kitchen', 1], ['plantpot', 1, null, 0]],
  };
  FURN.apartment = FURN.house;
  const furnSprite = item => 'f21_' + (rk(RL.id) === 'tt' ? 'tt' : 'mod') + '_' + item;
  const placeFurn = (sb, item, tx, ty, cont, solid) => {
    const name = furnSprite(item), wx = tx * TILE + 16, wy = ty * TILE + 16;
    const p = World.addProp(name, wx, wy, { solid: false, container: cont || null, kind: 'furn21' });
    p.cull = !IMG[name];                       // no sprite yet: the slot stays (indexes stay), nothing is drawn or blocked
    if (solid) {
      p.solid = true; p.bullet = true; p.circles = [{ x: wx, y: wy, r: 12 }];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) World.setOcc(tx + dx, ty + dy); // keep aisles open
    }
    return p;
  };
  // Blocking is judged from the props (not from the sprites), so the layout is the same with or without art.
  // Walkable = not a solid tile and not under a solid prop circle (the same rule markBlock uses, r >= 9).
  const bldGrid = (sb, b) => {
    const W = b.x1 - b.x0 + 1, H = b.y1 - b.y0 + 1, blk = new Uint8Array(W * H);
    for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) if (World.isSolidT(World.get(x, y))) blk[(y - b.y0) * W + (x - b.x0)] = 1;
    for (const p of sb.props) {
      if (!p.solid || !p.circles) continue;
      for (const c of p.circles) {
        if (c.r < 9) continue;
        const tx = Math.floor(c.x / TILE), ty = Math.floor(c.y / TILE);
        if (tx >= b.x0 && tx <= b.x1 && ty >= b.y0 && ty <= b.y1) blk[(ty - b.y0) * W + (tx - b.x0)] = 1;
      }
    }
    return { W, H, blk };
  };
  // interior walkable tiles that the doors can no longer reach
  const unreached = (b, g) => {
    const { W, H, blk } = g, seen = new Uint8Array(W * H), q = [];
    for (const [dx, dy] of b.doors) { const i = (dy - b.y0) * W + (dx - b.x0); if (!blk[i] && !seen[i]) { seen[i] = 1; q.push(i); } }
    for (let h = 0; h < q.length; h++) {
      const i = q[h], x = i % W, y = (i - x) / W;
      for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + ax, ny = y + ay; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx; if (blk[j] || seen[j]) continue;
        seen[j] = 1; q.push(j);
      }
    }
    let bad = 0;
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; if (!blk[i] && !seen[i]) bad++; }
    return bad;
  };
  // hash only (no SR draw), so temporary generation for the minimap stays identical to the live one
  const furnish = (sb, b) => {
    const spec = FURN[b.type]; if (!spec) return false;
    const id = sb.buildings.indexOf(b);
    const cand = [];
    for (let y = b.y0 + 1; y < b.y1; y++) for (let x = b.x0 + 1; x < b.x1; x++) {
      const i = (y - sb.ty0) * SB + (x - sb.tx0);
      if (sb.bld[i] !== id || sb.occ[i] || World.isSolidT(sb.tiles[i])) continue;
      if (b.doors.some(([dx, dy]) => Math.abs(dx - x) <= 1 && Math.abs(dy - y) <= 1)) continue; // tile in front of each door stays free
      cand.push([h3(x, y, 2111 + id), x, y]);
    }
    cand.sort((p, q) => p[0] - q[0]);
    const list = [];
    for (const [item, n, cont, solid] of spec) for (let k = 0; k < n; k++) list.push([item, cont, solid]);
    const order = list.map((e, k) => [h3(k, id, 2131), e]).sort((p, q) => p[0] - q[0]).map(p => p[1]);
    const area = (b.x1 - b.x0 - 1) * (b.y1 - b.y0 - 1), limit = Math.max(2, Math.floor(area / 7));
    const g = bldGrid(sb, b), W = g.W;
    let bad = unreached(b, g), placed = 0, tries = 0;
    for (const [item, cont, solid] of order) {
      if (placed >= limit) break;
      let got = null;
      for (let ci = 0; ci < cand.length && !got && tries < 240; ci++) {
        const [, x, y] = cand[ci];
        const k = (y - b.y0) * W + (x - b.x0);
        if (sb.occ[(y - sb.ty0) * SB + (x - sb.tx0)] || g.blk[k]) continue;
        if (!solid) { got = [x, y]; break; }            // decor does not block, nothing to check
        tries++;
        g.blk[k] = 1;                                   // a solid item is kept only if no walkable tile gets cut off
        const bad2 = unreached(b, g);
        if (bad2 <= bad) { got = [x, y]; bad = bad2; } else g.blk[k] = 0;
      }
      if (!got) continue;
      placeFurn(sb, item, got[0], got[1], cont, solid); placed++;
    }
    return placed > 0;
  };
  const mb = World.makeBuilding;
  World.makeBuilding = function (x0, y0, x1, y1, o) {
    const b = mb.call(this, x0, y0, x1, y1, o);
    const sb = this._gen;
    if (sb && sb._b21 && !(sb.sx === 0 && sb.sy === 0) && furnish(sb, b)) sb._b21c = true; // the start house stays as it is
    return b;
  };
  // wardrobes and racks: a cupboard's loot, plus a chance of a piece of gear
  (function () {
    const lp = G.lootProp;
    G.lootProp = function (p) {
      if (p.container !== 'armor' || p.looted) return lp.call(this, p);
      p.container = 'house';                   // same loot path and events as a cupboard
      try { lp.call(this, p); } finally { p.container = 'armor'; }
      if (p.looted && Math.random() < 0.5) Items.dropGear(p.x, p.y, Loot.randomGear(World.levelAt(p.x, p.y), 0.2));
    };
  })();

  // ---------- generation wrapper: legacy check, bridges, record ----------
  (function () {
    const go = World.genOver;
    World.genOver = function (sb) {
      const rec = recOf(false);
      sb._b21 = !(World.delta.has(sb.key) && !(rec && rec.has(sb.key)));   // legacy block: nothing below runs
      sb._b21c = false;
      go.call(this, sb);
      if (!sb._b21) return;
      // A road over a river becomes a bridge deck. The sea/river pass in genOver paints water only for zone 0
      // blocks outside the list below (same condition as genOver), so a road tile counts as a crossing only if
      // that pass painted it. A crossing is one run of such tiles along the road; runs longer than 14 stay road.
      const V = this.hasV(sb.sx, sb.sy), H = this.hasH(sb.sx, sb.sy);
      const wetPass = sb.zone === 0 && !['volcano', 'crystal', 'mushroom', 'grave'].includes(sb.biome);
      const cand = new Uint8Array(SB * SB), take = new Uint8Array(SB * SB), LIMIT = 14;
      if (wetPass) for (let y = 0; y < SB; y++) for (let x = 0; x < SB; x++) {
        if (sb.tiles[y * SB + x] === T.ROAD && this.waterAt(sb.tx0 + x, sb.ty0 + y) !== 0) cand[y * SB + x] = 1;
      }
      if (V) for (let x = 0; x < 4; x++) for (let y = 0; y < SB;) {       // north-south runs on the vertical strip
        if (!cand[y * SB + x]) { y++; continue; }
        let e = y; while (e + 1 < SB && cand[(e + 1) * SB + x]) e++;
        if (e - y + 1 <= LIMIT) for (let k = y; k <= e; k++) take[k * SB + x] = 1;
        y = e + 1;
      }
      if (H) for (let y = 0; y < 4; y++) for (let x = 0; x < SB;) {       // east-west runs on the horizontal strip
        if (!cand[y * SB + x]) { x++; continue; }
        let e = x; while (e + 1 < SB && cand[y * SB + e + 1]) e++;
        if (e - x + 1 <= LIMIT) for (let k = x; k <= e; k++) take[y * SB + k] = 1;
        x = e + 1;
      }
      for (let i = 0; i < SB * SB; i++) if (take[i]) { sb.tiles[i] = T.BRIDGE; sb._b21c = true; }
      if (sb._b21c && !this._temp) recOf(true).add(sb.key);
    };
  })();

  // ---------- bridge look ----------
  (function () {
    const to = World.texOf;
    World.texOf = function (t) {
      if (t !== T.BRIDGE) return to.call(this, t);
      return IMG.tex21_bridge ? 'tex21_bridge' : to.call(this, T.ROAD);   // no texture yet: drawn like the road
    };
    const deck = t => t === T.BRIDGE || t === T.ROAD;
    const drawRails = (ctx, X, Y, vertical, a, b) => {
      const im = IMG[vertical ? 'b21_rail_v' : 'b21_rail_h'];
      if (im) {                                  // segments at their own size (half the pixel size, as props use)
        const w = im.width / 2, h = im.height / 2;
        if (vertical) {
          if (a) ctx.drawImage(im, X + 1, Y + TILE / 2 - h / 2, w, h);
          if (b) ctx.drawImage(im, X + TILE - w - 1, Y + TILE / 2 - h / 2, w, h);
        } else {
          if (a) ctx.drawImage(im, X + TILE / 2 - w / 2, Y + 1, w, h);
          if (b) ctx.drawImage(im, X + TILE / 2 - w / 2, Y + TILE - h - 1, w, h);
        }
        return;
      }
      ctx.fillStyle = '#5b4a34';
      if (vertical) { if (a) ctx.fillRect(X, Y, 3, TILE); if (b) ctx.fillRect(X + TILE - 3, Y, 3, TILE); }
      else { if (a) ctx.fillRect(X, Y, TILE, 3); if (b) ctx.fillRect(X, Y + TILE - 3, TILE, 3); }
    };
    // floors of the new buildings: drawn over the base floor when the texture is loaded (tile ids unchanged)
    const FLOOR_TEX = { hospital: 'tex21_hosp', mall: 'tex21_mall', restaurant: 'tex21_wood2' };
    const isWall = t => t === T.WALL || t === T.WINDOW;
    const rc = World.renderChunk;
    World.renderChunk = function (ctx, cx, cy) {
      rc.call(this, ctx, cx, cy);
      const pats = {};
      for (let ty = cy * CH; ty < cy * CH + CH; ty++) for (let tx = cx * CH; tx < cx * CH + CH; tx++) {
        const t = this.get(tx, ty), X = tx * TILE, Y = ty * TILE;
        if (t === T.BRIDGE) {
          const up = deck(this.get(tx, ty - 1)), dn = deck(this.get(tx, ty + 1));
          const lf = deck(this.get(tx - 1, ty)), rt = deck(this.get(tx + 1, ty));
          if (up && dn && (!lf || !rt)) drawRails(ctx, X, Y, true, !lf, !rt);
          else if (lf && rt && (!up || !dn)) drawRails(ctx, X, Y, false, !up, !dn);
          continue;
        }
        if (isWall(t)) continue;
        const sb = this.sbOf(tx, ty); if (!sb) continue;
        const bi = sb.bld[(ty - sb.ty0) * SB + (tx - sb.tx0)];
        if (bi < 0) continue;
        const tex = FLOOR_TEX[sb.buildings[bi].type];
        if (!tex || !IMG[tex]) continue;                  // no art yet: the base floor stays
        ctx.fillStyle = pats[tex] || (pats[tex] = this.pattern(ctx, tex));
        ctx.fillRect(X, Y, TILE, TILE);
        // the wall shading the base pass drew is covered by the new floor: draw it again
        if (isWall(this.get(tx, ty - 1))) { ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.fillRect(X, Y, TILE, 7); }
        if (isWall(this.get(tx - 1, ty))) { ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(X, Y, 5, TILE); }
      }
    };
  })();
})();
