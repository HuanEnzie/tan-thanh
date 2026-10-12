// ===== v22 FL (package FL): multi-storey buildings, roof styles, damaged roofs =====
// The ground floor is the overworld building itself (its block is generated as before). A building with
// b.floors >= 2 gets one stairs prop 'flup' ("Lên tầng 2") inside its footprint on the ground floor.
// Floor f >= 2 is an 'interior' instance: World.mode = 'interior' and ONE generated block that holds the footprint
// (rock everywhere else). Its superblock key is a negative key K = -(1000000 + n), n = code(x0, y0, f), so
// ensure() stores and looks up its looted/removed props in World.delta[K] like an overworld block does.
// The overworld delta is never swapped. G.save() while inside saves the ground-floor spot G.flRet as the position.
// Stairs: 'fldn' (down) and 'flup' (up) sit on the same two tiles on every upper floor (S = down, U = up).
// Going down from floor 2 returns to the overworld at G.flRet (the spot where you climbed).
// Legacy blocks (World.legacy22), the start house and co-op get no floors and no new roof style.
(function () {
  const LIM = 130000;                                   // |x0|,|y0| below this keep the key code injective
  const TYPE_LOOT = { house: 'house', apartment: 'house', office: 'house', hotel: 'house', highrise: 'house', hospital: 'medical', mall: 'market', restaurant: 'kitchen', palace: 'treasure', shop: 'market', store: 'crate' };
  // [item, count, container loot (null = none), solid]; same item keys as v21world (sprites f21_mod_* / f21_tt_*)
  const FURN_I = {
    house: [['bed', 1, null, 1], ['table', 1, null, 1], ['sofa', 1, null, 1], ['wardrobe', 1, 'armor', 1], ['stove', 1, 'kitchen', 1],
      ['fridge', 1, 'fridge', 1], ['tv', 1, null, 1], ['shelf', 1, 'house', 1], ['plantpot', 1, null, 0]],
    office: [['officedesk', 2, null, 1], ['desk', 1, null, 1], ['cabinet', 2, 'house', 1], ['bookshelf', 1, 'house', 1], ['plantpot', 1, null, 0], ['sofa', 1, null, 1]],
    hospital: [['hbed', 5, null, 1], ['medcab', 2, 'medical', 1], ['ivstand', 2, null, 0], ['desk', 1, null, 1], ['checkout', 1, 'medical', 1], ['cabinet', 1, 'medical', 1]],
    mall: [['checkout', 2, 'market', 1], ['shelf', 4, 'market', 1], ['rack', 2, 'armor', 1], ['mannequin', 2, 'armor', 1], ['vending', 1, 'market', 1], ['plantpot', 2, null, 0]],
    restaurant: [['table', 4, null, 1], ['stove', 1, 'kitchen', 1], ['fridge', 1, 'fridge', 1], ['checkout', 1, 'kitchen', 1], ['plantpot', 1, null, 0]],
    palace: [['table', 2, null, 1], ['cabinet', 2, 'treasure', 1], ['shelf', 1, 'house', 1], ['plantpot', 2, null, 0], ['sofa', 1, null, 1]],
    shop: [['checkout', 1, 'market', 1], ['shelf', 3, 'market', 1], ['vending', 1, 'market', 1], ['plantpot', 1, null, 0]],
    store: [['rack', 2, 'armor', 1], ['shelf', 2, 'crate', 1], ['cabinet', 1, 'crate', 1]],
  };
  FURN_I.apartment = FURN_I.house; FURN_I.hotel = FURN_I.house; FURN_I.highrise = FURN_I.house;
  const FLOOR_I = { hospital: 'tex21_hosp', mall: 'tex21_mall', restaurant: 'tex21_wood2' };
  const ROOF_ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const ROOF_SET = { house: [1, 2, 3], apartment: [4, 5, 6], office: [4, 5, 6], highrise: [4, 5, 6], hotel: [4, 6], hospital: [7, 8], mall: [9, 10], restaurant: [2, 3], palace: [9, 10], shop: [7, 8], store: [8, 9] };
  // minimap colour per roof style (index = roofStyle)
  const ROOF_MINI = [null, [120, 60, 45], [85, 85, 95], [110, 70, 50], [70, 80, 90], [100, 100, 110], [60, 70, 60], [140, 110, 80], [90, 60, 70], [70, 70, 80], [120, 90, 60]];
  // tint over a roof whose texture is not drawn yet, so the styles still differ on screen
  const ROOF_TINT = [null, 'rgba(120,60,30,0.2)', 'rgba(60,60,70,0.2)', 'rgba(110,70,40,0.2)', 'rgba(50,70,90,0.2)', 'rgba(90,90,100,0.2)', 'rgba(50,70,50,0.2)', 'rgba(140,110,70,0.2)', 'rgba(90,50,60,0.2)', 'rgba(40,40,50,0.2)', 'rgba(120,90,50,0.2)'];
  const STAIR_DOT = [255, 200, 80];

  // ---------- pure helpers (same result on every call, so the layout of a floor never changes) ----------
  const furnName = item => 'f21_' + (rk(RL.id) === 'tt' ? 'tt' : 'mod') + '_' + item;
  // the two staircase tiles of a building, as offsets inside its footprint (u, v); the same on every floor
  const stairsOf = b => {
    const W = b.x1 - b.x0 + 1, H = b.y1 - b.y0 + 1;
    if (W < 6 || H < 5 || W > 30 || H > 30) return null;
    const rnd = mulberry32(Math.floor(h3(b.x0, b.y0, 2206) * 4294967296) | 0);
    const cells = [];
    for (let v = 1; v < H - 1; v++) for (let u = 1; u < W - 1; u++) cells.push([u, v]);
    const S = cells[Math.floor(rnd() * cells.length)];
    for (let k = 0; k < 40; k++) {
      const U = cells[Math.floor(rnd() * cells.length)];
      if (Math.max(Math.abs(U[0] - S[0]), Math.abs(U[1] - S[1])) >= 2) return { S, U };
    }
    return null;
  };
  const keyOf = (b, f) => (Math.abs(b.x0) < LIM && Math.abs(b.y0) < LIM && f >= 2 && f < 8)
    ? -(1000000 + ((b.x0 + 131072) * 262144 + (b.y0 + 131072)) * 8 + f) : null;
  // inverse of nkey(sx, sy) = (sx + 50000) * 100000 + (sy + 50000): the block that owns key K
  const sxyOf = K => { const A = Math.floor(K / 100000); return [A - 50000, (K - A * 100000) - 50000]; };
  const floorsFor = b => {
    if (!stairsOf(b) || keyOf(b, 2) == null) return 1;
    const u = h3(b.x0, b.y0, 2201);
    switch (b.type) {
      case 'apartment': case 'office': case 'hotel': case 'highrise': return 3 + Math.floor(u * 4);   // 3..6
      case 'hospital': return u < 0.5 ? 2 : 3;                                                         // 2..3
      case 'mall': case 'palace': case 'restaurant': return 2;
      case 'house': return u < 0.35 ? 2 : 1;
      default: return 1;
    }
  };
  const roofFor = b => { const set = ROOF_SET[b.type] || ROOF_ALL; return set[Math.floor(h3(b.x0, b.y0, 2203) * set.length)]; };
  const roomsOf = b => { const a = (b.x1 - b.x0 + 1) * (b.y1 - b.y0 + 1); return a > 90 ? 3 : a > 40 ? 2 : 1; };
  const roofTex = b => spr22('tex22_roof_' + b.roofStyle, b.roof);
  const upImg = () => spr22('b22_stairs_up', 'fx_2');
  const dnImg = () => spr22('b22_stairs_down', 'fx_2');

  // a free ground-floor tile inside building bi (lowest hash), not in front of a door (door zones are occupied)
  const pickCell = (sb, b, bi) => {
    let best = null, bh = 2;
    for (let y = b.y0 + 1; y < b.y1; y++) for (let x = b.x0 + 1; x < b.x1; x++) {
      const i = (y - sb.ty0) * SB + (x - sb.tx0);
      if (sb.bld[i] !== bi || sb.occ[i]) continue;
      const t = sb.tiles[i];
      if (t !== T.WOOD && t !== T.TILEF) continue;
      const h = h3(x, y, 2207);
      if (h < bh) { bh = h; best = [x, y]; }
    }
    return best;
  };
  // overworld: one 'flup' per multi-storey building, appended after the whole block is generated
  const addOverStairs = sb => {
    sb.buildings.forEach((b, bi) => {
      if (!(b.floors >= 2)) return;
      const cell = pickCell(sb, b, bi);
      if (!cell) return;
      World.addProp(upImg(), cell[0] * TILE + 16, cell[1] * TILE + 16, {
        solid: false, layer: 0, kind: 'flup',
        data: { x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1, seed: b.seed, type: b.type, name: b.name, F: b.floors, ft: sb.tiles[(cell[1] - sb.ty0) * SB + (cell[0] - sb.tx0)] },
      });
    });
  };

  // ---------- one upper floor: the block of the 'interior' mode ----------
  function genInterior(sb) {
    sb.tiles.fill(T.WALL);                                  // everything outside the footprint is rock
    sb.zone = 0; sb.biome = 'plains';                       // no wild/urban rules apply inside a floor
    const I = G.flCur;
    if (!I || World._temp || sb.key !== I.key) return;
    const b = I.b, W = b.x1 - b.x0 + 1, H = b.y1 - b.y0 + 1;
    const x0 = sb.tx0 + Math.floor((SB - W) / 2), y0 = sb.ty0 + Math.floor((SB - H) / 2), x1 = x0 + W - 1, y1 = y0 + H - 1;
    const ft = I.ft, f = I.f;
    const rnd = mulberry32(Math.floor(h3(b.x0, b.y0, 2208 + f) * 4294967296) | 0);
    const ri = (a, c) => a + Math.floor(rnd() * (c - a + 1));
    const at = (x, y) => (y - sb.ty0) * SB + (x - sb.tx0);
    const put = (x, y, t) => { sb.tiles[at(x, y)] = t; };
    // shell: walls, glass windows on the outer walls (as makeBuilding does), floor inside
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const edge = x === x0 || x === x1 || y === y0 || y === y1, corner = (x === x0 || x === x1) && (y === y0 || y === y1);
      put(x, y, edge ? T.WALL : ft);
      if (edge && !corner && rnd() < 0.18) put(x, y, T.WINDOW);
    }
    // rooms: the same split as makeBuilding, every wall keeps a doorway
    const gaps = [];
    const split = (ax, ay, bx, by, depth) => {
      const w = bx - ax + 1, h = by - ay + 1;
      if (depth <= 0 || (w < 9 && h < 9)) return;
      if (w >= h && w >= 9) {
        const sx = ri(ax + 3, bx - 3);
        for (let y = ay; y <= by; y++) put(sx, y, T.WALL);
        const dy = ri(ay, by - 1);
        put(sx, dy, ft); put(sx, dy + 1, ft); gaps.push([sx, dy], [sx, dy + 1]);
        split(ax, ay, sx - 1, by, depth - 1); split(sx + 1, ay, bx, by, depth - 1);
      } else if (h >= 9) {
        const sy = ri(ay + 3, by - 3);
        for (let x = ax; x <= bx; x++) put(x, sy, T.WALL);
        const dx = ri(ax, bx - 1);
        put(dx, sy, ft); put(dx + 1, sy, ft); gaps.push([dx, sy], [dx + 1, sy]);
        split(ax, ay, bx, sy - 1, depth - 1); split(ax, sy + 1, bx, by, depth - 1);
      }
    };
    split(x0 + 1, y0 + 1, x1 - 1, y1 - 1, I.rooms);
    // staircases: carved free on this floor, the same two tiles on every floor
    const sp = stairsOf(b);
    const S = sp ? [x0 + sp.S[0], y0 + sp.S[1]] : null, U = sp ? [x0 + sp.U[0], y0 + sp.U[1]] : null;
    if (sp) { put(S[0], S[1], ft); put(U[0], U[1], ft); }
    sb.flS = S; sb.flU = U;
    // the stairs tile itself stays free; a doorway and its neighbours stay free (aisles)
    const keepClear = (x, y) => [S, U].some(p => p && p[0] === x && p[1] === y) || gaps.some(p => Math.max(Math.abs(p[0] - x), Math.abs(p[1] - y)) <= 1);
    // footprint blocking grid (1 = blocked), shared by loot and furniture
    const blk = new Uint8Array(W * H), bi = (x, y) => (y - y0) * W + (x - x0);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (World.isSolidT(sb.tiles[at(x, y)])) blk[bi(x, y)] = 1;
    const start = S || [x0 + 1, y0 + 1];
    const reachAll = () => {
      let total = 0;
      for (let i = 0; i < W * H; i++) if (!blk[i]) total++;
      const seen = new Uint8Array(W * H), q = [bi(start[0], start[1])];
      seen[q[0]] = 1;
      for (let h = 0; h < q.length; h++) {
        const i = q[h], x = (i % W) + x0, y = Math.floor(i / W) + y0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < x0 || ny < y0 || nx > x1 || ny > y1) continue;
          const j = bi(nx, ny);
          if (blk[j] || seen[j]) continue;
          seen[j] = 1; q.push(j);
        }
      }
      return q.length === total;
    };
    // loot containers against a wall; each is solid (one tile, like the furniture) and kept only if nothing gets cut off
    const kindL = TYPE_LOOT[b.type] || 'house', crates = RL.props.crate;
    const nC = ri(2, 4);
    for (let k = 0, tries = 0; k < nC && tries < 200; tries++) {
      const x = ri(x0 + 1, x1 - 1), y = ri(y0 + 1, y1 - 1);
      if (sb.tiles[at(x, y)] !== ft || sb.occ[at(x, y)] || blk[bi(x, y)] || keepClear(x, y)) continue;
      if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => World.isSolidT(sb.tiles[at(x + dx, y + dy)]))) continue;
      blk[bi(x, y)] = 1;
      if (!reachAll()) { blk[bi(x, y)] = 0; continue; }
      k++;
      if (rnd() < 0.1) World.chest(x, y, rnd() < 0.3 ? 1 : 0);
      else World.container(crates[ri(0, crates.length - 1)], x, y, kindL, { r: 12 });
    }
    // furniture: each solid piece is kept only if every free tile stays reachable from the stairs
    const furnPlace = (x, y, item, cont, solid) => {
      const name = furnName(item), wx = x * TILE + 16, wy = y * TILE + 16;
      const p = World.addProp(name, wx, wy, { solid: false, container: cont || null, kind: 'furn21' });
      p.cull = !IMG[name];                                 // no sprite yet: the slot stays, nothing is drawn or blocked
      if (solid) {
        p.solid = true; p.bullet = true; p.circles = [{ x: wx, y: wy, r: 12 }];
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) World.setOcc(x + dx, y + dy);
      }
    };
    const spec = FURN_I[b.type] || FURN_I.house, list = [];
    for (const [item, n, cont, solid] of spec) for (let k = 0; k < n; k++) list.push([item, cont, solid]);
    for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = list[i]; list[i] = list[j]; list[j] = t; }
    const cands = [];
    for (let y = y0 + 1; y < y1; y++) for (let x = x0 + 1; x < x1; x++) if (sb.tiles[at(x, y)] === ft && !keepClear(x, y)) cands.push([x, y]);
    for (let i = cands.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = cands[i]; cands[i] = cands[j]; cands[j] = t; }
    const limit = Math.max(2, Math.floor((W - 2) * (H - 2) / 7));
    let placed = 0;
    for (const [item, cont, solid] of list) {
      if (placed >= limit) break;
      let spot = null, tries = 0;
      for (const [x, y] of cands) {
        if (sb.occ[at(x, y)] || blk[bi(x, y)]) continue;
        if (!solid) { spot = [x, y]; break; }
        if (++tries > 80) break;
        blk[bi(x, y)] = 1;
        if (reachAll()) { spot = [x, y]; break; }
        blk[bi(x, y)] = 0;
      }
      if (!spot) continue;
      furnPlace(spot[0], spot[1], item, cont, solid); placed++;
    }
    // a lamp beside the down stairs
    if (RL.props.lamp && S) {
      const nb = [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([dx, dy]) => [S[0] + dx, S[1] + dy])
        .find(([x, y]) => x > x0 && x < x1 && y > y0 && y < y1 && !sb.occ[at(x, y)] && !blk[bi(x, y)] && sb.tiles[at(x, y)] === ft);
      if (nb) World.addProp(RL.props.lamp, nb[0] * TILE + 16, nb[1] * TILE + 16, { solid: false, light: 110, lightCol: RL.id === 'cy' ? 'cyan' : RL.id === 'ct' ? 'red' : null });
    }
    // stairs last, so every earlier prop keeps its index
    if (f >= 2 && S) World.addProp(dnImg(), S[0] * TILE + 16, S[1] * TILE + 16, { solid: false, layer: 0, kind: 'fldn', data: { f } });
    if (f < I.F && U) World.addProp(upImg(), U[0] * TILE + 16, U[1] * TILE + 16, { solid: false, layer: 0, kind: 'flup', data: { f } });
  }

  // ---------- generation hooks ----------
  const mb = World.makeBuilding;
  World.makeBuilding = function (x0, y0, x1, y1, o) {
    const b = mb.call(this, x0, y0, x1, y1, o);
    const sb = this._gen;
    if (sb && !(sb.sx === 0 && sb.sy === 0) && !this.isLegacyGen()) {
      if (b.floors === undefined) b.floors = floorsFor(b);      // RU may set it first
      if (b.roofStyle === undefined) b.roofStyle = roofFor(b);
    }
    return b;
  };
  const go = World.genOver;
  World.genOver = function (sb) {
    if (this.mode === 'interior') return genInterior(sb);
    const r = go.call(this, sb);
    if (this.mode === 'over' && !(sb.sx === 0 && sb.sy === 0) && !this.isLegacyGen()) addOverStairs(sb);
    return r;
  };

  // ---------- moving between floors ----------
  function flLabel(p) {
    const P = G.player;
    if (World.mode === 'interior') {
      const I = G.flCur; if (!I) return null;
      if (p.kind === 'flup') return I.f < I.F ? `Lên tầng ${I.f + 1}` : null;
      if (p.kind === 'fldn') return I.f - 1 >= 2 ? `Xuống tầng ${I.f - 1}` : 'Xuống tầng 1';
      return null;
    }
    if (p.kind === 'flup' && p.data) {                       // only from inside the building
      const bb = World.bldAt(P.x, P.y);
      return bb && bb.x0 === p.data.x0 && bb.y0 === p.data.y0 ? 'Lên tầng 2' : null;
    }
    return null;
  }
  // put the player on a free tile next to the stairs (arriving from below: next to S, from above: next to U)
  const arrivalNear = (sb, c) => {
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const x = c[0] + dx, y = c[1] + dy, i = (y - sb.ty0) * SB + (x - sb.tx0);
      if (!sb.block[i]) return { x: x * TILE + 16, y: y * TILE + 16 };
    }
    return { x: c[0] * TILE + 16, y: c[1] * TILE + 16 };
  };
  // enter floor I.f (dir: 'up' arrives at S, 'down' arrives at U)
  function show(I, dir) {
    const P = G.player;
    I.key = keyOf(I.b, I.f);
    I.name = I.b.name || 'Nhà nhiều tầng';
    G.flCur = I;
    World.mode = 'interior'; World.dg = null;
    World.reset();
    G.zombies = []; Items.list = []; G.hazards = []; Bullets.list = []; Throws.fires = []; Throws.acids = []; Throws.traps = []; Throws.list = [];
    if (G.boss) { G.boss = null; UI.boss(null); }
    const [sx, sy] = sxyOf(I.key);
    const sb = World.ensure(sx, sy);
    if (nkey(sx, sy) !== I.key) console.error('[v22 FL] key mismatch', I.key);
    const a = arrivalNear(sb, (dir === 'up' ? sb.flS : sb.flU) || sb.flS || [sb.tx0 + 16, sb.ty0 + 16]);
    P.x = a.x; P.y = a.y; P.car = null;
    World.update(P.x, P.y);
    G.allies = G.allies.filter(a2 => !['civ', 'merchant', 'cast', 'cand', 'villager', 'elder'].includes(a2.kind));   // people who live outside stay outside
    for (const a2 of G.allies) { a2.x = P.x + R.range(-30, 30); a2.y = P.y + R.range(10, 40); }
    // enemies of this floor (only when the zombie package is in): 0-4 in the rooms, away from the arrival point
    if (typeof G.spawnZombie22 === 'function') {
      const cells = [];
      for (let y = sb.ty0; y < sb.ty0 + SB; y++) for (let x = sb.tx0; x < sb.tx0 + SB; x++) {
        const i = (y - sb.ty0) * SB + (x - sb.tx0);
        if (sb.tiles[i] === I.ft && !sb.block[i] && !sb.occ[i] && Math.hypot(x * TILE + 16 - P.x, y * TILE + 16 - P.y) > 96) cells.push([x, y]);
      }
      const n = Math.floor(Math.random() * 5);
      for (let k = 0; k < n && cells.length; k++) {
        const [x, y] = cells.splice(Math.floor(Math.random() * cells.length), 1)[0];
        G.spawnZombie22(x * TILE + 16, y * TILE + 16, { inside: true, lvl: I.lv, floor: I.f, sbk: sb.key });
      }
    }
    G.camera.x = P.x; G.camera.y = P.y; G.flowT = 0;
    UI.banner(`TẦNG ${I.f}/${I.F}`, I.name, '#9fe0ff');
  }
  function climb(p) {
    const P = G.player, d = p.data;
    G.transit = true;
    Sound.play('sfx_portal', 0.5, 1.1);
    G.flRet = { x: P.x, y: P.y };
    const I = { b: { x0: d.x0, y0: d.y0, x1: d.x1, y1: d.y1, seed: d.seed, type: d.type, name: d.name }, F: d.F, ft: d.ft, lv: Math.max(1, World.levelAt(p.x, p.y)), f: 2, rooms: roomsOf(d) };
    UI.fade(() => { G.transit = false; show(I, 'up'); });
  }
  function change(f, dir) {
    if (!G.flCur) return;
    G.transit = true;
    Sound.play('sfx_portal', 0.5, 0.9);
    UI.fade(() => { G.transit = false; show(Object.assign({}, G.flCur, { f }), dir); });
  }
  function leave() {
    G.transit = true;
    Sound.play('sfx_portal', 0.6);
    UI.fade(() => {
      G.transit = false;
      const P = G.player, r = G.flRet || { x: P.x, y: P.y };
      World.mode = 'over'; World.dg = null; World.reset(); G.flCur = null;
      P.x = r.x; P.y = r.y; P.car = null;
      World.update(P.x, P.y);
      G.zombies = []; Items.list = []; G.hazards = []; Bullets.list = []; Throws.fires = []; Throws.acids = []; Throws.traps = [];
      if (G.boss) { G.boss = null; UI.boss(null); }
      for (const a of G.allies) if (a.kind !== 'merchant') { a.x = P.x + R.range(-30, 30); a.y = P.y + R.range(10, 40); }
      G.camera.x = P.x; G.camera.y = P.y; G.flowT = 0;
      G.save();
    });
  }
  function flUse(it) {
    const P = G.player;
    if (!P || P.dead || G.action || G.transit) return;
    if (typeof Net !== 'undefined' && Net.active) { G.toast('Tầng nhà chưa hỗ trợ khi chơi chung.', 'warn'); return; }
    if (P.car || P.boat) { G.toast('Xuống xe hoặc thuyền trước đã.', 'warn'); return; }
    if (World.mode === 'interior') {
      const I = G.flCur; if (!I) return;
      if (it.kind === 'flup') return change(I.f + 1, 'up');
      return I.f - 1 >= 2 ? change(I.f - 1, 'down') : leave();
    }
    if (it.kind === 'flup' && it.prop && it.prop.data) climb(it.prop);
  }

  // ---------- G hooks: interaction, saving, mode-dependent rules ----------
  G.inInterior = function () { return World.mode === 'interior'; };
  const fi = G.findInteract;
  G.findInteract = function () {
    const r = fi.call(this), P = this.player;
    if (!P || P.car || P.dead || (typeof Net !== 'undefined' && Net.active)) return r;
    const skip = this._ixSkip;
    let best = null, bd = 52;
    for (const p of World.propsNear(P.x, P.y, 90)) {
      if (p.dead || (p.kind !== 'flup' && p.kind !== 'fldn') || (skip && skip.has(p))) continue;
      const d = dist(P.x, P.y, p.x, p.y);
      if (d > bd) continue;
      const label = flLabel(p); if (!label) continue;
      best = { prop: p, kind: p.kind, label }; bd = d;
    }
    if (!best) return r;
    const ro = r && (r.prop || r.ally);
    if (ro && dist(P.x, P.y, ro.x, ro.y) <= bd) return r;
    return best;
  };
  const ia = G.interact;
  G.interact = function (it) {
    if (it && (it.kind === 'flup' || it.kind === 'fldn')) return flUse(it);
    return ia.call(this, it);
  };
  const sv = G.save;
  G.save = function () {                                    // inside a floor the saved spot is the ground floor
    if (World.mode !== 'interior' || !G.flRet) return sv.call(this);
    const rp = this.returnPos;
    this.returnPos = { x: G.flRet.x, y: G.flRet.y };
    try { return sv.call(this); } finally { this.returnPos = rp; }
  };
  const vt = G.v5Tick;
  G.v5Tick = function (dt) {                                // autosave every 45 s inside a floor too (play.js only does it outside)
    vt.call(this, dt);
    if (World.mode !== 'interior' || !this.player || this.player.dead || (typeof Net !== 'undefined' && Net.guest)) return;
    this.flSaveT = (this.flSaveT || 45) - dt;
    if (this.flSaveT <= 0) { this.flSaveT = 45; this.save(); }
  };
  const tp = G.teleport;
  G.teleport = function (t) {
    if (World.mode === 'interior') { this.toast('Không thể dịch chuyển khi đang ở trong nhà. Hãy xuống tầng trệt trước.', 'warn'); return; }
    return tp.call(this, t);
  };
  const us = G.useScroll;
  G.useScroll = function () {
    if (World.mode === 'interior') { this.toast('Không thể niệm truyền tống trong nhà. Hãy xuống tầng trệt trước.', 'warn'); return; }
    return us.call(this);
  };
  const sp0 = G.spawnTick;
  G.spawnTick = function (dt) { if (World.mode === 'interior') return; return sp0.call(this, dt); };
  const dk = G.darkness;
  G.darkness = function () { return World.mode === 'interior' ? 0.45 : dk.call(this); };   // indoors: dim, but the rooms stay readable
  const tk = G.timeTick;
  G.timeTick = function (dt) {                              // no rain indoors; the clock keeps running
    if (World.mode !== 'interior') return tk.call(this, dt);
    const rain = this.raining; this.raining = false;
    try { return tk.call(this, dt); } finally { this.raining = rain; }
  };
  const bt = G.biomeTick;                                   // v3 clears the biome ambience off the ground; indoors use the dungeon dust
  G.biomeTick = function () { bt.call(this); if (World.mode === 'interior') this.biomeAmb = 'dust'; };
  const ll = World.levelAt;
  World.levelAt = function (x, y) { if (this.mode === 'interior') return G.flCur ? G.flCur.lv : 1; return ll.call(this, x, y); };
  const to = World.texOf;
  World.texOf = function (t) {
    if (this.mode === 'interior' && (t === T.WOOD || t === T.TILEF) && G.flCur) { const n = FLOOR_I[G.flCur.b.type]; if (n && IMG[n]) return n; }
    return to.call(this, t);
  };
  const bm = World.buildMini;
  World.buildMini = function (sb) {
    bm.call(this, sb);
    const im = this.minis.get(this.mode + sb.key); if (!im) return;
    const d = im.data, paint = (i, c) => { d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; };
    if (this.mode === 'over') for (let i = 0; i < SB * SB; i++) {
      const bi = sb.bld[i], t = sb.tiles[i];
      if (bi < 0 || t === T.WALL || t === T.WINDOW) continue;
      const bb = sb.buildings[bi], c = bb && bb.roofStyle ? ROOF_MINI[bb.roofStyle] : null;
      if (c) paint(i, c);
    }
    for (const p of sb.props) if (p.kind === 'flup' || p.kind === 'fldn') {
      const x = Math.floor(p.x / TILE) - sb.tx0, y = Math.floor(p.y / TILE) - sb.ty0;
      for (let yy = y; yy <= y + 1; yy++) for (let xx = x; xx <= x + 1; xx++) if (xx >= 0 && yy >= 0 && xx < SB && yy < SB) paint(yy * SB + xx, STAIR_DOT);
    }
  };
  // the big map of a floor: its one block, the player and the stairs
  const dbm = UI.drawBigMap;
  UI.drawBigMap = function () {
    if (World.mode !== 'interior' || !G.flCur) return dbm.call(this);
    const c = $('bigmap'), g = c.getContext('2d');
    const cw = c.clientWidth || 800, chh = c.clientHeight || 800, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (Math.abs(c.width - Math.round(cw * dpr)) > 2 || Math.abs(c.height - Math.round(chh * dpr)) > 2) { c.width = Math.round(cw * dpr); c.height = Math.round(chh * dpr); }
    const I = G.flCur, P = G.player, sb = World.sbs.get(I.key);
    g.fillStyle = '#050608'; g.fillRect(0, 0, c.width, c.height);
    const S = Math.min(c.width, c.height) / (SB + 4), ox = (c.width - SB * S) / 2, oy = (c.height - SB * S) / 2;
    const m = World.getMini('interior' + I.key);
    if (m && sb) g.drawImage(m, ox, oy, SB * S, SB * S);
    if (sb) {
      const px = (P.x / TILE - sb.tx0) * S + ox, py = (P.y / TILE - sb.ty0) * S + oy;
      g.fillStyle = '#4dd2ff'; g.beginPath(); g.arc(px, py, 6, 0, TAU); g.fill();
      g.font = '16px VT323, monospace'; g.textAlign = 'center'; g.fillStyle = '#ffe27a';
      if (sb.flU) g.fillText('▲ lên', ox + (sb.flU[0] - sb.tx0 + 0.5) * S, oy + (sb.flU[1] - sb.ty0 + 0.5) * S + 5);
      if (sb.flS && I.f >= 2) g.fillText('▼ xuống', ox + (sb.flS[0] - sb.tx0 + 0.5) * S, oy + (sb.flS[1] - sb.ty0 + 0.5) * S + 5);
    }
    $('mapInfo').textContent = `${I.name} — tầng ${I.f}/${I.F}`;
    $('mapTp').hidden = true;
  };
  const ld = G.load;
  G.load = function () { const r = ld.call(this); this.flCur = null; return r; };   // a loaded save is always the ground floor

  // ---------- roofs: styles, damage, ledges ----------
  const dmgPat = {};
  function roofDmg(b, x, y, w, h) {
    if (!(b.dmg > 0) || !(b.roofAlpha >= 0.02)) return;
    ctx.save();
    ctx.globalAlpha = b.roofAlpha * Math.min(1, b.dmg);
    const im = IMG.tex22_roofdmg;
    if (im) {
      if (!dmgPat.p) { dmgPat.p = ctx.createPattern(im, 'repeat'); dmgPat.p.setTransform(new DOMMatrix().scale(0.5)); }
      ctx.fillStyle = dmgPat.p; ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
    } else {                                                // no art yet: a few holes, the same for the same building
      const rnd = mulberry32(b.seed + 91), n = Math.round(b.dmg * 14);
      for (let i = 0; i < n; i++) {
        const cx = x + 8 + rnd() * (w - 16), cy = y + 8 + rnd() * (h - 16), r = 3 + rnd() * 6;
        ctx.fillStyle = 'rgba(18,10,6,0.85)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,220,160,0.22)'; ctx.beginPath(); ctx.arc(cx + 1, cy - 1, r * 0.45, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  }
  const dr = drawRoof;
  drawRoof = function (b, x, y, w, h) {
    if (!b.roofStyle) { dr(b, x, y, w, h); roofDmg(b, x, y, w, h); return; }
    const keep = b.roof, tex = roofTex(b);
    b.roof = tex;                                          // the base pass draws whatever b.roof names
    try { dr(b, x, y, w, h); } finally { b.roof = keep; }
    if (!(b.roofAlpha >= 0.02)) return;
    ctx.globalAlpha = b.roofAlpha;
    if (!IMG[tex]) { ctx.fillStyle = ROOF_TINT[b.roofStyle]; ctx.fillRect(x - 3, y - 3, w + 6, h + 6); }
    if (b.floors >= 2) {                                   // stepped border: one step per storey above the second
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2;
      ctx.strokeRect(x + 5, y + 5, w - 10, h - 10);
      if (b.floors >= 3) ctx.strokeRect(x + 12, y + 12, w - 24, h - 24);
    }
    ctx.globalAlpha = 1;
    roofDmg(b, x, y, w, h);
  };
})();
