// ===== v22build (BD): building. Walls, doors, beds, chests, benches, furnaces, torches, campfires, spikes, floors,
// teleport arrays and defense arrays. Every piece is a record in G.v10.build.list (saved with the game). While its
// superblock is loaded the record is realised as a runtime prop (placed:true), the same way v14 plantTick does it.
// API: G.buildNear(type, r) -> nearest record of that type within r px (overworld only) or null.
//      Bus21.emit('build', rec) after each placement.
// Keys: B (or the hammer button) toggles build mode; E or left click places; [ ] cycle items; B or Esc leave.
// Dismantle (tháo dỡ): Delete or the ⛏ button on the bar switches build mode to dismantle; hold E or left click on a
// piece for 0.6 s to take it down. Refund: the placeable item (x1) while the piece is at least half intact; below 50% hp
// half of its recipe materials (main material at least 1). A chest gives its contents to the bag; a respawn bed clears
// the respawn point (G.v10.surv.bed).
(function () {
  const RT = new Map();                 // rec.id -> { sb, prop, open, shotT }   runtime only, never saved
  const BD = { on: false, sel: 0, tg: null, sig: '', bar: null, openRec: null, tip: false, dis: false, dh: null, dtg: null };
  const DIS_T = 0.6;                    // seconds to hold on a piece before it comes down
  const RANKS = ['E', 'D', 'C', 'B', 'A', 'S'];
  const ORDER = ['wall_wood', 'wall_stone', 'wall_metal', 'door', 'fence', 'barricade', 'bed', 'chest', 'bench', 'furnace',
    'defarray', 'tparray', 'torch', 'campfire', 'spikes', 'floor', 'trap'];
  // item: placeable item id in P.inv. spr: sprite b22_<mod|tt>_<spr>; shared: sprite b22_<shared>.
  // fb: fallback sprites from the common art (used while the new art is missing).
  const BT = {
    wall_wood:  { item: 'pl_wall_wood',  name: 'Tường gỗ',         spr: 'wall_wood',  fb: ['fence', 'barrier'],     solid: true, wall: true, hp: 220, r: 15 },
    wall_stone: { item: 'pl_wall_stone', name: 'Tường đá',         spr: 'wall_stone', fb: ['barrier', 'sandbags'],  solid: true, wall: true, hp: 520, r: 15 },
    wall_metal: { item: 'pl_wall_metal', name: 'Tường kim loại',   spr: 'wall_metal', fb: ['barrier'],              solid: true, wall: true, hp: 1000, r: 15 },
    door:       { item: 'pl_door',       name: 'Cửa',              spr: 'door',       fb: ['fence'],                solid: true, wall: true, hp: 200, r: 15 },
    fence:      { item: 'pl_fence',      name: 'Hàng rào',         shared: 'fence',   fb: ['fence'],                solid: true, wall: true, hp: 120, r: 14 },
    barricade:  { item: 'barricade',     name: 'Rào chắn',         fb: ['fence'],                                    solid: true, wall: true, hp: 160, r: 14 },
    bed:        { item: 'pl_bed',        name: 'Giường',           spr: 'bed',        fb: ['bench'],                solid: true, r: 13 },
    chest:      { item: 'pl_chest',      name: 'Rương',            spr: 'chest',      fb: ['crate'],                solid: true, r: 13 },
    bench:      { item: 'pl_bench',      name: 'Bàn chế tạo',      spr: 'bench',      fb: ['bench'],                solid: true, r: 14 },
    furnace:    { item: 'pl_furnace',    name: 'Lò nung',          spr: 'furnace',    fb: ['barrel'],               solid: true, r: 13 },
    defarray:   { item: 'pl_defarray',   name: 'Trận phòng thủ',   spr: 'defarray',   fb: ['lamp'],                 solid: true, r: 14 },
    tparray:    { item: 'pl_tparray',    name: 'Trận dịch chuyển', spr: 'tparray',    fb: ['tent'],                 solid: false, layer: 1 },
    torch:      { item: 'pl_torch',      name: 'Đuốc',             shared: 'torch',    fb: ['lamp'],                 solid: false, light: 130 },
    campfire:   { item: 'pl_campfire',   name: 'Lửa trại',         shared: 'campfire', fb: ['fx_4'],                 solid: false, light: 150 },
    spikes:     { item: 'pl_spikes',     name: 'Chông',            shared: 'spikes',   fb: ['rocks'],                solid: false, hp: 40 },
    floor:      { item: 'pl_floor',      name: 'Sàn gỗ',           shared: 'floor_wood', fb: ['weeds'],              solid: false, layer: 0 },
  };
  const MARK = { bed: '🛏', defarray: '⚔', tparray: '✦' };
  const MARK_COL = { bed: '#ffb3e0', defarray: '#ff8080', tparray: '#c9a7ff' };

  // ---------- small helpers ----------
  const BUILD = () => {
    if (!G.v10) return null;
    return G.v10.build || (G.v10.build = { list: [], nid: 1 });
  };
  const guest = () => typeof Net !== 'undefined' && !!Net.active && !!Net.guest;
  const clampI = (i, n) => (n ? Math.max(0, Math.min(n - 1, i)) : 0);
  const bkey = () => (RL && RL.id === 'tt' ? 'tt' : 'mod');
  const itemName = id => { const d = itm(id); return d && d.name ? d.name : id; };
  const itemIcon = id => { const d = itm(id); return d && d.icon && IMG[d.icon] ? d.icon : null; };
  const typeName = t => (BT[t] ? BT[t].name : itemName(t));
  const sbAt = (tx, ty) => World.sbs.get(nkey(Math.floor(tx / SB), Math.floor(ty / SB)));
  function spriteFor(t) {
    const d = BT[t]; if (!d) return 'fence';
    const c = d.shared ? ['b22_' + d.shared] : d.spr ? ['b22_' + bkey() + '_' + d.spr] : [];
    c.push(...d.fb);
    return c.find(n => IMG[n]) || c[c.length - 1];
  }
  function avail() {
    const P = G.player, out = [];
    if (!P || !P.inv) return out;
    for (const t of ORDER) {
      const item = t === 'trap' ? 'trap' : BT[t].item;
      const n = P.inv[item] || 0;
      if (n > 0) out.push({ t, item, n });
    }
    return out;
  }

  // ---------- placement rules ----------
  function check(tx, ty, t, far) {
    if (guest()) return 'Khách không xây được.';
    if (World.mode !== 'over') return 'Chỉ xây được ở thế giới bên ngoài.';
    if (far) return 'Quá xa: đưa chuột gần hơn (trong 4 ô).';
    if (!sbAt(tx, ty)) return 'Khu vực này chưa tải xong.';
    if (World.isSolidT(World.get(tx, ty))) return 'Ô này là đất rắn hoặc nước.';
    const cx = tx * TILE + 16, cy = ty * TILE + 16;
    if (World.bldAt(cx, cy)) return 'Không xây bên trong công trình.';
    const v = BUILD();
    if (v && v.list.some(r => r.tx === tx && r.ty === ty)) return 'Ô này đã có vật.';
    if (t === 'trap' || !BT[t].solid) return null;
    const P = G.player;
    if (rectDist(P.x, P.y, tx * TILE, ty * TILE) < (P.r || 11)) return 'Bạn đang đứng ở đó, lùi ra một chút.';
    for (const p of World.propsNear(cx, cy, 40, [])) {
      if (p.dead || !p.solid) continue;
      for (const c of p.circles) if (dist(cx, cy, c.x, c.y) < c.r + 14) return 'Ô này đã có vật cản.';
    }
    if (G.zgrid.query(cx, cy, 30).some(z => !z.dead && dist(z.x, z.y, cx, cy) < 14 + z.r)) return 'Có quái ở ô này.';
    return null;
  }
  // the target tile: in front of the player on touch (P.angle), under the mouse within 4 tiles on desktop
  // ---------- target tile ----------
  const rectDist = (px, py, x0, y0) => {
    const dx = Math.max(x0 - px, 0, px - (x0 + TILE)), dy = Math.max(y0 - py, 0, py - (y0 + TILE));
    return Math.hypot(dx, dy);
  };
  // last movement direction (kept every frame, also outside build mode)
  function trackMove(P) {
    const sp = Math.hypot(P.vx || 0, P.vy || 0);
    if (sp > 10) BD.lastMove = [P.vx / sp, P.vy / sp];
  }
  // touch aim: the right stick when it is held, otherwise the last movement direction
  function touchDir() {
    const P = G.player;
    if (Touch.R && Touch.R.m > 0.2) return [Math.cos(P.angle), Math.sin(P.angle)];
    if (BD.lastMove) return BD.lastMove;
    return [Math.cos(P.angle), Math.sin(P.angle)];
  }
  // touch target: about 1.7 tiles ahead (54 px); a tile that touches the player body or holds the player is skipped
  function touchTile() {
    const P = G.player, dir = touchDir(), ptx = Math.floor(P.x / TILE), pty = Math.floor(P.y / TILE);
    let d = 54, tx = 0, ty = 0;
    for (let k = 0; k < 4; k++) {
      tx = Math.floor((P.x + dir[0] * d) / TILE); ty = Math.floor((P.y + dir[1] * d) / TILE);
      if (tx === ptx && ty === pty) { d += TILE; continue; }
      if (rectDist(P.x, P.y, tx * TILE, ty * TILE) < (P.r || 11)) { d += TILE; continue; }
      break;
    }
    return { tx, ty };
  }
  // the aim tile { tx, ty, far }: far = the mouse is more than 4 tiles away (desktop only)
  function aim() {
    const P = G.player;
    if (Touch.on) return Object.assign({ far: false }, touchTile());
    const cx = Input.mouse.wx ?? P.x + Math.cos(P.angle) * 34, cy = Input.mouse.wy ?? P.y + Math.sin(P.angle) * 34;
    return { tx: Math.floor(cx / TILE), ty: Math.floor(cy / TILE), far: dist(P.x, P.y, cx, cy) > 4 * TILE };
  }
  function target(t) {
    const { tx, ty, far } = aim();
    const why = check(tx, ty, t, far);
    return { tx, ty, cx: tx * TILE + 16, cy: ty * TILE + 16, ok: !why, why: why || '' };
  }

  // ---------- records -> runtime props ----------
  function realise(rec) {
    const d = BT[rec.t], x = rec.tx * TILE + 16, y = rec.ty * TILE + 16;
    let o;
    if (rec.t === 'door' && rec.open) o = { solid: false, kind: 'bd_door_open', layer: 1 };
    else if (d.wall) o = { solid: true, r: d.r, kind: 'barricade', hp: rec.hp };
    else if (d.solid) o = { solid: true, r: d.r, kind: 'bd_' + rec.t };
    else o = { solid: false, kind: 'bd_' + rec.t, layer: d.layer ?? 1, light: d.light || 0, lightCol: d.light ? 'fire' : null };
    const p = World.addProp(spriteFor(rec.t), x, y, o);
    p.bdRec = rec;
    return p;
  }
  // 'gone' when the piece was destroyed in the world (its record is then removed by the caller)
  function syncRec(rec, sb) {
    const rt = RT.get(rec.id);
    if (rt && rt.sb === sb) {
      if (rt.prop.dead) { if (rt.prop.bdRec === rec) return 'gone'; }
      else if (rt.prop.bdRec === rec && rt.open === !!rec.open) {
        if (rt.prop.kind === 'barricade') rec.hp = rt.prop.hp;
        return rt;
      } else World.removeProp(rt.prop);
    }
    const nrt = { sb, prop: realise(rec), open: !!rec.open, shotT: 0 };
    RT.set(rec.id, nrt);
    return nrt;
  }
  function syncAll() {
    const v = BUILD(); if (!v) return;
    for (let i = v.list.length - 1; i >= 0; i--) {
      const rec = v.list[i], sb = sbAt(rec.tx, rec.ty);
      if (!sb) continue;
      if (syncRec(rec, sb) === 'gone') removeRec(rec, 'broken');
    }
  }
  // what a dismantled piece gives back: its placeable item (x1) while it is at least half intact (or has no hp);
  // below 50% hp, half of the recipe materials per piece (rounded down, main material at least 1)
  function refundOf(rec) {
    const d = BT[rec.t];
    const R = d.hp && rec.hp != null && rec.hp / d.hp < 0.5 ? RECIPES.find(r => r.out === d.item) : null;
    if (!R) return [[d.item, 1]];
    return Object.keys(R.need).map((k, i) => [k, Math.max(i ? 0 : 1, Math.floor(Math.ceil(R.need[k] / R.n) / 2))]).filter(p => p[1] > 0);
  }
  // remove a record and its prop; why: 'dismantle' (refund, chest contents to the bag), 'broken' / 'worn' (lost)
  function removeRec(rec, why) {
    const v = BUILD(); if (!v) return;
    const i = v.list.indexOf(rec); if (i < 0) return;
    const rt = RT.get(rec.id);
    if (rt && !rt.prop.dead && World.sbs.get(rt.sb.key) === rt.sb) World.removeProp(rt.prop);
    RT.delete(rec.id);
    v.list.splice(i, 1);
    const x = rec.tx * TILE + 16, y = rec.ty * TILE + 16, P = G.player, S = G.v10 && G.v10.surv;
    if (rec.t === 'bed' && S && S.bed && S.bed.x === Math.round(x) && S.bed.y === Math.round(y)) {
      S.bed = null;
      SYS.msg('Điểm hồi sinh ở chiếc giường này đã bị xoá. Hồi sinh tại nơi xuất phát.', 'warn');
    }
    if (why === 'dismantle') {
      const got = {}, parts = [];
      if (rec.inv) for (const id in rec.inv) if (rec.inv[id] > 0) got[id] = (got[id] || 0) + rec.inv[id];
      for (const [id, n] of refundOf(rec)) got[id] = (got[id] || 0) + n;
      for (const id in got) {
        P.inv[id] = (P.inv[id] || 0) + got[id];
        parts.push(got[id] + ' ' + itemName(id));
        Floaters.add(x, y - 14 - parts.length * 9, '+' + got[id] + ' ' + itemName(id), '#b8f28a', 9);
      }
      UI.dirty = true;
      G.toast('Đã tháo ' + BT[rec.t].name + '. Nhận lại: ' + parts.join(', ') + '.', 'good');
    } else if (rec.inv) for (const id in rec.inv) if (rec.inv[id] > 0) Items.drop(x, y, id, rec.inv[id]);
    Particles.debris(x, y, 10, '#8a6a4a');
    if (why === 'broken') G.toast(BT[rec.t].name + ' của bạn đã bị phá.', 'warn');
    if (why === 'worn') G.toast(BT[rec.t].name + ' đã mòn hết.', 'info');
    G.save();
  }

  // ---------- per-frame effects of realised pieces ----------
  function spikeHit(rec, p) {
    const P = G.player;
    for (const z of G.zgrid.query(p.x, p.y, 30)) {
      if (z.dead || z.rise > 0 || (z.spkT || 0) > G.time) continue;
      if (dist(z.x, z.y, p.x, p.y) > 14 + z.r) continue;
      z.spkT = G.time + 0.6;
      G.hitEnemy(z, 25 + 3 * P.level, 0, 0, 'trap');
      Particles.debris(p.x, p.y, 2, '#9aa0a6');
      rec.hp -= 1;
      if (rec.hp <= 0) return true;
    }
    return false;
  }
  function defense(rec, p, rt, dt) {
    if (!(rec.fuel > 0)) return;
    rec.fuel = Math.max(0, rec.fuel - dt);
    rt.shotT -= dt;
    if (rt.shotT > 0) return;
    rt.shotT = 0.6;
    const ox = p.x, oy = p.y - 30;
    let best = null, bd = 420;
    for (const z of G.zgrid.query(ox, oy, 420)) {
      if (z.dead || z.rise > 0) continue;
      const d = dist(ox, oy, z.x, z.y);
      if (d < bd) { bd = d; best = z; }
    }
    if (!best) return;
    const W = RL.weapons.r1, a = Math.atan2(best.y - oy, best.x - ox);
    Bullets.fire(ox, oy, a, { speed: 900, knock: 30, proj: W.proj || 'bullet', color: W.color, homing: W.homing }, 18 + G.player.level * 3, { ally: true, src: 'ally' });
    Sound.at(W.sfx, ox, oy, 0.15, 1.2);
  }
  function effects(dt) {
    const P = G.player, v = BUILD();
    if (!v || !P || P.dead) return;
    let warm = false, worn = null;
    for (const rec of v.list) {
      const rt = RT.get(rec.id);
      if (!rt || rt.prop.dead || World.sbs.get(rt.sb.key) !== rt.sb) continue;
      const p = rt.prop;
      if (rec.t === 'campfire') {
        if (!warm && !P.car && dist(P.x, P.y, p.x, p.y) < 90 && P.hurtT < -4) { warm = true; P.hp = Math.min(P.maxHp, P.hp + P.maxHp * 0.012 * dt); }
      } else if (rec.t === 'spikes') { if (spikeHit(rec, p)) (worn || (worn = [])).push(rec); }
      else if (rec.t === 'defarray') defense(rec, p, rt, dt);
    }
    if (worn) for (const rec of worn) removeRec(rec, 'worn');
  }

  // ---------- interaction ----------
  function labelOf(rec) {
    const d = BT[rec.t];
    if (rec.t === 'tparray') return 'Trận dịch chuyển' + (rec.name ? ' • ' + rec.name : '');
    if (rec.t === 'defarray') return 'Trận phòng thủ' + (rec.fuel > 0 ? ' • còn ' + Math.ceil(rec.fuel) + ' s' : ' • cần tinh thể');
    if (rec.t === 'door') return rec.open ? 'Cửa (đang mở)' : 'Cửa (đang đóng)';
    if (rec.t === 'bed' || rec.t === 'chest' || rec.t === 'bench' || rec.t === 'furnace' || rec.t === 'campfire') return d.name;
    return 'Tháo dỡ ' + d.name + ' (giữ E)';
  }
  function bdFind(g) {
    const P = g.player, v = BUILD(); if (!P || !v || World.mode !== 'over' || P.car || guest()) return null;
    const skip = g._ixSkip;
    let best = null, bd = 46;
    for (const p of World.propsNear(P.x, P.y, 70, [])) {
      if (p.dead || !p.bdRec || (skip && skip.has(p))) continue;
      let d = 1e9;
      for (const c of p.circles.length ? p.circles : [{ x: p.x, y: p.y, r: 12 }]) d = Math.min(d, dist(P.x, P.y, c.x, c.y) - c.r);
      if (d < bd) { bd = d; best = p; }
    }
    return best ? { prop: best, rec: best.bdRec, kind: 'bd22', label: labelOf(best.bdRec) } : null;
  }
  function menu(title, text, opts) { UI.menuDialog({ name: title, portrait: null, text, options: opts }); }
  // hold = true: the action stops when E is released (direct press); menu choices pass false
  function startDis(p, rec, hold) {
    if (G.action) return;
    G.startAction({ kind: 'bd22', bd22: true, hold: !!hold, prop: p, rec, x: p.x, y: p.y, range: 80, dur: 1.2,
      label: 'Đang tháo dỡ ' + BT[rec.t].name + '...', fn: () => removeRec(rec, 'dismantle') });
  }
  function bedSleep() {
    const P = G.player;
    if (G.zombies.some(z => !z.dead && dist(z.x, z.y, P.x, P.y) < 400)) { G.toast('Không thể ngủ khi kẻ địch ở gần.', 'warn'); return; }
    UI.fade(() => {
      P.hp = P.maxHp; P.stamina = P.maxStam; P.hunger = Math.max(P.hunger, 60); P.thirst = Math.max(P.thirst, 60);
      G.clock = (G.clock + 6) % 24;
      G.toast('Bạn ngủ một giấc ngon: đầy máu và thể lực.', 'good');
      Sound.play('sfx_heal', 0.6); G.save();
    });
  }
  function setSpawn(rec) {
    if (typeof G.setRespawn !== 'function') { G.toast('Chức năng điểm hồi sinh chưa mở.', 'warn'); return; }
    G.setRespawn(rec.tx * TILE + 16, rec.ty * TILE + 16, 'Giường');
  }
  function craftAt(st) {
    UI.craftStation = st;
    setTimeout(() => UI.openPanel('craft'), 30);
  }
  function toggleDoor(rec) {
    const P = G.player;
    if (rec.open && dist(P.x, P.y, rec.tx * TILE + 16, rec.ty * TILE + 16) < 16 + (P.r || 11)) { G.toast('Có người đứng trong ô cửa, bước ra trước đã.', 'warn'); return; }
    rec.open = !rec.open;
    const sb = sbAt(rec.tx, rec.ty); if (sb) syncRec(rec, sb);
    Sound.play('sfx_click', 0.5, rec.open ? 1.2 : 0.8);
    G.save();
  }
  function cook() {
    if (!G.has('food')) { G.toast('Cần 1 Lương thực để nướng.', 'warn'); return; }
    if (!itm('food_cooked')) { G.toast('Chưa biết cách nướng thịt.', 'info'); return; }
    G.take('food', 1); G.give('food_cooked', 1); G.save();
  }
  function loadCrystal(rec) {
    const P = G.player;
    let best = null, bi = 99;
    for (const id in P.inv) {
      if (!/^cry_[EDCBAS]$/.test(id) || P.inv[id] <= 0) continue;
      const i = RANKS.indexOf(id.slice(4));
      if (i < bi) { bi = i; best = id; }
    }
    if (!best) { G.toast('Cần tinh thể (cry_*) để nạp trận phòng thủ.', 'warn'); return; }
    G.take(best, 1);
    rec.fuel = (rec.fuel || 0) + (bi + 1) * 120;
    G.toast(`Đã nạp tinh thể hạng ${RANKS[bi]}: trận hoạt động thêm ${(bi + 1) * 120} giây.`, 'good');
    G.save();
  }
  function rename(rec) {
    UI.askName('Đặt tên trận dịch chuyển', rec.name || '', v => { if (v) rec.name = v; else delete rec.name; G.save(); });
  }
  function bdDo(it) {
    const p = it.prop, rec = it.rec;
    if (!p || p.dead || !rec) return;
    const dOpt = { text: 'Tháo dỡ (đứng yên 1.2 giây)', act: () => startDis(p, rec, false) };
    switch (rec.t) {
      case 'bed': return menu('Giường', 'Bạn muốn làm gì với chiếc giường này?', [
        { text: 'Ngủ (đầy máu, qua 6 giờ)', act: bedSleep }, { text: 'Đặt làm điểm hồi sinh', act: () => setSpawn(rec) }, dOpt]);
      case 'chest': return menu('Rương', 'Một chiếc rương gỗ.', [{ text: 'Mở rương: cất hoặc lấy đồ', act: () => openChest(rec) }, dOpt]);
      case 'bench': return menu('Bàn chế tạo', 'Chế tạo đồ tại đây.', [{ text: 'Chế tạo', act: () => craftAt('bench') }, dOpt]);
      case 'furnace': return menu('Lò nung', 'Nung chảy quặng, nấu ăn.', [{ text: 'Chế tạo / nung', act: () => craftAt('furnace') }, dOpt]);
      case 'door': return menu('Cửa', rec.open ? 'Cửa đang mở.' : 'Cửa đang đóng, chặn đường kẻ địch.', [
        { text: rec.open ? 'Đóng cửa' : 'Mở cửa', act: () => toggleDoor(rec) }, dOpt]);
      case 'campfire': {
        const opts = [];
        if (G.has('food') && itm('food_cooked')) opts.push({ text: 'Nướng 1 Lương thực', act: cook });
        opts.push(dOpt);
        return menu('Lửa trại', 'Đứng gần lửa để hồi máu chậm.', opts);
      }
      case 'tparray': return menu('Trận dịch chuyển', 'Mở bản đồ để chọn nơi đến. Đứng gần trận thì dịch chuyển miễn phí.', [
        { text: 'Dịch chuyển (mở bản đồ)', act: () => setTimeout(() => UI.openPanel('map'), 30) },
        { text: 'Đổi tên trận', act: () => rename(rec) }, dOpt]);
      case 'defarray': return menu('Trận phòng thủ', 'Còn ' + Math.ceil(rec.fuel || 0) + ' giây hoạt động. Bắn quái trong 420 px.', [
        { text: 'Nạp tinh thể (cry_*)', act: () => loadCrystal(rec) }, dOpt]);
      default: return startDis(p, rec, true);
    }
  }

  // ---------- chest transfer panel (System style, fits 812x375) ----------
  function ensureChestDom() {
    if (document.getElementById('bd22')) return;
    const el = document.createElement('div');
    el.id = 'bd22'; el.className = 'screen hidden';
    el.innerHTML = '<div class="bd22p"><div class="bd22h"><h2>Rương</h2><span class="cap"></span><button class="x" aria-label="Đóng">✕</button></div>' +
      '<div class="bd22cols"><div class="bd22col"><h3>Túi đồ của bạn</h3><div class="list" data-s="in"></div></div>' +
      '<div class="bd22col"><h3>Trong rương</h3><div class="list" data-s="out"></div></div></div></div>';
    document.body.appendChild(el);
    el.querySelector('.x').onclick = () => UI.closePanel();
    el.addEventListener('pointerdown', e => { if (e.target === el) UI.closePanel(); });
    el.addEventListener('click', e => {
      const b = e.target.closest ? e.target.closest('button[data-id]') : null;
      if (b) moveItem(b.dataset.id, b.dataset.d, b.dataset.all === '1');
    });
  }
  function rowsOf(ids, src, dir) {
    if (!ids.length) return '<p class="muted">Trống</p>';
    return ids.map(id => `<div class="bd22r"><span class="nm">${esc21(itemName(id))}</span><b>x${src[id]}</b>` +
      `<button data-id="${esc21(id)}" data-d="${dir}" data-all="0">1</button><button data-id="${esc21(id)}" data-d="${dir}" data-all="1">Hết</button></div>`).join('');
  }
  function renderChest() {
    const rec = BD.openRec, el = document.getElementById('bd22'), P = G.player;
    if (!rec || !el || !P) return;
    const ids = Object.keys(rec.inv).sort();
    el.querySelector('.cap').textContent = ids.length + ' / 30 loại';
    const have = Object.keys(P.inv).filter(id => id !== 'gold' && P.inv[id] > 0).sort();
    el.querySelector('[data-s="in"]').innerHTML = rowsOf(have, P.inv, 'in');
    el.querySelector('[data-s="out"]').innerHTML = rowsOf(ids, rec.inv, 'out');
  }
  function moveItem(id, dir, all) {
    const rec = BD.openRec, P = G.player;
    if (!rec || !P) return;
    if (dir === 'in') {
      const have = P.inv[id] || 0; if (!have) return;
      if (!rec.inv[id] && Object.keys(rec.inv).length >= 30) { G.toast('Rương đã đủ 30 loại đồ.', 'warn'); return; }
      const n = all ? have : 1;
      G.take(id, n); rec.inv[id] = (rec.inv[id] || 0) + n;
    } else {
      const have = rec.inv[id] || 0; if (!have) return;
      const n = all ? have : 1;
      rec.inv[id] -= n; if (rec.inv[id] <= 0) delete rec.inv[id];
      P.inv[id] = (P.inv[id] || 0) + n; UI.dirty = true;
    }
    renderChest();
  }
  function openChest(rec) {
    ensureChestDom();
    rec.inv = rec.inv || {};
    BD.openRec = rec; G.state = 'menu'; UI.showScreen('bd22'); renderChest();
  }

  // ---------- build mode: target, placement, bar ----------
  function place(tg) {
    const av = avail();
    if (!av.length) { G.toast('Chưa có vật đặt được. Chế tạo bằng [C].', 'warn'); return; }
    if (!tg || !tg.ok) { G.toast(tg ? tg.why : 'Đưa chuột vào ô cần đặt.', 'warn'); return; }
    const cur = av[clampI(BD.sel, av.length)], P = G.player;
    if (cur.t === 'trap') {
      Throws.traps.push({ x: tg.cx, y: tg.cy, uses: 6 });
      G.take('trap', 1);
    } else {
      const v = BUILD(), d = BT[cur.t];
      const rec = { id: 'b' + v.nid++, t: cur.t, tx: tg.tx, ty: tg.ty };
      if (d.hp) rec.hp = d.hp;
      if (cur.t === 'barricade') rec.hp = 160 + P.level * 10;
      if (cur.t === 'chest') rec.inv = {};
      if (cur.t === 'defarray') rec.fuel = 0;
      if (cur.t === 'door') rec.open = false;
      v.list.push(rec);
      G.take(cur.item, 1);
      const sb = sbAt(tg.tx, tg.ty); if (sb) syncRec(rec, sb);
      Bus21.emit('build', rec);
    }
    Sound.play('sfx_craft', 0.6, 1.3);
    Particles.dust(tg.cx, tg.cy, 6);
    G.save(); BD.sig = ''; renderBar();
  }
  function ensureBar() {
    if (BD.bar) return BD.bar;
    const b = document.createElement('div');
    b.id = 'bd22bar'; b.hidden = true;
    b.addEventListener('click', e => {
      if (e.target.closest && e.target.closest('button[data-dis]')) { setDis(!BD.dis); return; }
      const btn = e.target.closest ? e.target.closest('button[data-i]') : null;
      if (!btn) return;
      BD.sel = +btn.dataset.i; BD.sig = ''; renderBar();
    });
    document.body.appendChild(b);
    BD.bar = b; return b;
  }
  // touch: the bar starts right of the left panels and stops before the HUD button, the menu and the minimap
  function placeBar() {
    const b = BD.bar; if (!b) return;
    if (!document.body.classList.contains('touch')) { b.style.left = ''; b.style.width = ''; return; }
    const box = sel => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 ? r : null; };
    const tl = box('#topleft'), sys = box('#sys21-hud'), menu = box('#tmenu'), mm = box('#minimap');
    const left = Math.max(290, Math.round(tl ? tl.right + 8 : 290));
    let right = window.innerWidth - 8;
    for (const r of [sys, menu, mm]) if (r && r.top < 150 && r.left > left) right = Math.min(right, r.left - 8);
    b.style.left = left + 'px'; b.style.width = Math.max(140, right - left) + 'px';
  }
  function renderBar() {
    if (!BD.on) return;
    const b = ensureBar(), av = avail();
    placeBar();
    BD.sel = clampI(BD.sel, av.length);
    const tg = BD.tg, dt = BD.dtg;
    const cur = av[BD.sel], name = cur ? typeName(cur.t) : '';
    const hint = BD.dis ? disHint(dt)
      : !av.length ? '' : tg && !tg.ok ? tg.why
      : Touch.on ? name + ' · E: đặt · ⛏: tháo · B: thoát' : name + ' — chuột trái / E: đặt · [ ] đổi · Delete: tháo dỡ · B / Esc: thoát';
    const sig = av.map(a => a.t + a.n).join() + '|' + BD.sel + '|' + hint + '|' + BD.dis;
    if (sig === BD.sig) return;
    BD.sig = sig;
    const row = av.length ? av.map((a, i) => {
      const ic = itemIcon(a.item) || spriteFor(a.t), im = IMG[ic];
      return `<button data-i="${i}" class="${i === BD.sel && !BD.dis ? 'on' : ''}" title="${esc21(typeName(a.t))}">` +
        `${im ? `<img src="${im.src}" alt="">` : ''}<span>${esc21(a.t === 'trap' ? itemName('trap') : typeName(a.t))}</span><i>${a.n}</i></button>`;
    }).join('') : '<span class="none">Chưa có vật đặt được. Chế tạo bằng [C].</span>';
    const dis = `<button data-dis="1" class="${BD.dis ? 'on' : ''}" title="Tháo dỡ công trình (Delete)"><b class="ic">⛏</b><span>Tháo dỡ</span></button>`;
    b.innerHTML = `<div class="row">${row}${dis}</div><div class="hint">${esc21(hint)}</div>`;
  }
  function setOn(on) {
    if (on === BD.on) return;
    if (on) {
      const P = G.player;
      if (G.state !== 'playing' || !P || P.dead) { G.toast('Chỉ xây khi đang chơi.', 'warn'); return; }
      BD.on = true; BD.sel = clampI(BD.sel, avail().length); BD.sig = '';
      ensureBar().hidden = false; renderBar();
      if (!BD.tip) { BD.tip = true; G.toast('Chế độ xây: E hoặc chuột trái để đặt. [ ] đổi vật. Delete (hoặc ⛏ trên thanh) để tháo dỡ. B hoặc Esc để thoát.', 'info'); }
    } else {
      BD.on = false; BD.tg = null; BD.dis = false; BD.dh = null; BD.dtg = null;
      if (BD.bar) BD.bar.hidden = true;
    }
    const eb = document.querySelector('#tbtns [data-k="KeyE"] span');
    if (eb) eb.textContent = BD.on ? 'Đặt' : 'Dùng';
    Sound.play('sfx_click', 0.4, on ? 1.2 : 0.9);
  }
  // ---------- dismantle mode: aim at a piece, hold E or the left button for 0.6 s ----------
  function setDis(on) {
    if (on === BD.dis || (on && !BD.on)) return;
    if (on && guest()) { G.toast('Khách không tháo dỡ được.', 'warn'); return; }
    BD.dis = on; BD.dh = null; BD.dtg = null; BD.tg = null;
    const eb = document.querySelector('#tbtns [data-k="KeyE"] span');
    if (eb) eb.textContent = on ? 'Tháo' : 'Đặt';
    Sound.play('sfx_click', 0.4, on ? 0.9 : 1.1);
    renderBar();
  }
  function disHint(dt) {
    const nm = dt && dt.rec ? typeName(dt.rec.t) : '';
    if (Touch.on) return nm ? 'Giữ E: tháo ' + nm + ' · ⛏: thoát' : 'Hướng vào công trình để tháo · ⛏: thoát';
    return nm ? nm + ' — giữ E / chuột trái 0.6 giây để tháo · Delete: thoát' : 'Đưa chuột vào công trình để tháo · Delete / B: thoát';
  }
  function disFrame(g, dt) {
    const a = aim(), v = BUILD();
    const rec = !a.far && v ? v.list.find(r => r.tx === a.tx && r.ty === a.ty) || null : null;
    const was = BD.dtg && BD.dtg.rec;
    BD.dtg = a.far ? null : { tx: a.tx, ty: a.ty, rec };
    if (was !== rec) renderBar();                    // the hint names the piece under the aim
    const held = Input.down('KeyE') || (!Touch.on && Input.mouse.down && !UI.pointerOverUI);
    if (!held || !rec) { BD.dh = null; return; }
    if (BD.dh && BD.dh.wait) return;                 // a piece was just taken: release the button first
    if (!BD.dh || BD.dh.rec !== rec) BD.dh = { rec, t: 0, wait: false };
    BD.dh.t += dt;
    if (BD.dh.t < DIS_T) return;
    BD.dh = { rec: null, t: 0, wait: true };
    removeRec(rec, 'dismantle');
    Sound.play('sfx_craft', 0.6, 0.8);
    Particles.dust(rec.tx * TILE + 16, rec.ty * TILE + 16, 6);
    renderBar();
  }
  function drawDis(ctx) {
    const t = BD.dtg; if (!t) return;
    const x = t.tx * TILE, y = t.ty * TILE, rec = t.rec;
    ctx.save();
    ctx.fillStyle = rec ? 'rgba(255,60,60,0.28)' : 'rgba(255,255,255,0.06)';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.strokeStyle = rec ? '#ff3b3b' : 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
    if (rec && BD.dh && BD.dh.rec === rec) {          // progress ring above the piece
      const f = Math.min(1, BD.dh.t / DIS_T), cx = x + TILE / 2, cy = y - 8;
      ctx.lineWidth = 3; ctx.strokeStyle = '#ffd27a';
      ctx.beginPath(); ctx.arc(cx, cy, 7, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  function buildFrame(g, dt) {
    const P = g.player;
    P.cool = Math.max(P.cool || 0, 0.12);            // no shooting or swinging while building
    if (P.car) { BD.tg = null; BD.dtg = null; BD.dh = null; return; }
    if (Input.hit('Delete')) setDis(!BD.dis);
    if (BD.dis) { disFrame(g, dt); if (g.frame % 15 === 0) renderBar(); return; }
    const av = avail();
    if (Input.hit('BracketRight') && av.length) BD.sel = (BD.sel + 1) % av.length;
    if (Input.hit('BracketLeft') && av.length) BD.sel = (BD.sel - 1 + av.length) % av.length;
    if ((Input.hit('BracketRight') || Input.hit('BracketLeft')) && av.length) renderBar();
    BD.tg = av.length ? target(av[clampI(BD.sel, av.length)].t) : null;
    if (g.frame % 15 === 0) renderBar();
    const want = Input.hit('KeyE') || (!Touch.on && Input.mouse.clicked && !UI.pointerOverUI);
    if (want) place(BD.tg);
  }
  function drawGhost(ctx) {
    const P = G.player;
    if (!BD.on || G.state !== 'playing' || !P) return;
    if (BD.dis) return drawDis(ctx);
    if (!BD.tg) return;
    const av = avail(); if (!av.length) return;
    const cur = av[clampI(BD.sel, av.length)], tg = BD.tg;
    ctx.save();
    ctx.fillStyle = tg.ok ? 'rgba(109,255,154,0.22)' : 'rgba(255,90,90,0.25)';
    ctx.fillRect(tg.tx * TILE, tg.ty * TILE, TILE, TILE);
    if (cur.t !== 'trap') {
      const im = IMG[spriteFor(cur.t)];
      if (im) { ctx.globalAlpha = 0.6; ctx.drawImage(im, tg.cx - im.width / 4, tg.cy - im.height / 4, im.width / 2, im.height / 2); ctx.globalAlpha = 1; }
    }
    if (cur.t === 'defarray') { ctx.strokeStyle = 'rgba(255,120,120,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(tg.cx, tg.cy, 420, 0, Math.PI * 2); ctx.stroke(); }
    ctx.strokeStyle = tg.ok ? '#6dff9a' : '#ff5a5a'; ctx.lineWidth = 2;
    ctx.strokeRect(tg.tx * TILE + 1, tg.ty * TILE + 1, TILE - 2, TILE - 2);
    ctx.restore();
  }

  // ---------- public API ----------
  G.buildNear = function (type, r) {
    const P = this.player, v = BUILD();
    if (!P || !v || World.mode !== 'over') return null;
    let best = null, bd = r ?? 1e9;
    for (const rec of v.list) {
      if (rec.t !== type) continue;
      const d = dist(P.x, P.y, rec.tx * TILE + 16, rec.ty * TILE + 16);
      if (d <= bd) { bd = d; best = rec; }
    }
    return best;
  };

  // ---------- hooks into the existing game ----------
  // B: the old barricade key now toggles build mode (touch menu and HUD button send KeyB too)
  const place0 = G.place;
  G.place = function (kind) {
    if (kind === 'barricade') { setOn(!BD.on); return; }
    return place0.call(this, kind);
  };
  const upd0 = G.update;
  G.update = function (dt) {
    if (this.player) trackMove(this.player);
    if (BD.on && this.state === 'playing' && this.player && !this.player.dead) buildFrame(this, dt);
    return upd0.call(this, dt);
  };
  const ia0 = G.interact;
  G.interact = function (it) {
    if (BD.on) return;                                  // in build mode E places instead
    if (it && it.kind === 'bd22' && this._ixDirect && !this.action) return bdDo(it);
    return ia0.call(this, it);
  };
  const fi0 = G.findInteract;
  G.findInteract = function () {
    const r = fi0.call(this);
    return r || bdFind(this);
  };
  const at0 = G.actionTick;
  G.actionTick = function (dt) {
    const a = this.action;
    if (a && a.bd22 && a.hold && !Input.down('KeyE')) { this.action = null; return; }
    at0.call(this, dt);
    if (a && a.bd22 && this.action !== a && a.t >= a.dur && !a.done) { a.done = true; a.fn(); }
  };
  const vt0 = G.v5Tick;
  G.v5Tick = function (dt) {
    vt0.call(this, dt);
    if (guest() || World.mode !== 'over' || !this.player || this.player.dead) return;
    if (this.frame % 4 === 0) syncAll();
    effects(dt);
  };
  const tl0 = G.tpList;
  G.tpList = function () {
    const out = tl0.call(this), v = BUILD();
    if (v && World.mode === 'over') {
      let n = 0;
      for (const rec of v.list) if (rec.t === 'tparray') {
        n++;
        out.push({ x: rec.tx * TILE + 16, y: rec.ty * TILE + 16, name: rec.name || 'Trận dịch chuyển #' + n, kind: 'array', icon: '✦', col: '#c9a7ff', bdId: rec.id });
      }
    }
    return out;
  };
  // a new or loaded game starts outside build mode and with no open chest
  for (const name of ['newGame', 'load']) {
    const f0 = G[name];
    if (typeof f0 !== 'function') continue;
    G[name] = function () {
      BD.on = false; BD.tg = null; BD.openRec = null; BD.dis = false; BD.dh = null; BD.dtg = null;
      if (BD.bar) BD.bar.hidden = true;
      return f0.apply(this, arguments);
    };
  }
  const td0 = Throws.draw;
  Throws.draw = function (ctx) { td0.call(this, ctx); drawGhost(ctx); };
  const key0 = UI.key;
  UI.key = function (code) {
    if (code === 'Escape' && BD.on && G.state === 'playing') { if (BD.dis) setDis(false); else setOn(false); return; }
    return key0.call(this, code);
  };
  const cp0 = UI.closePanel;
  UI.closePanel = function () {
    const wasChest = UI.screen === 'bd22', wasCraft = UI.screen === 'craft';
    cp0.call(this);
    if (wasChest) { BD.openRec = null; G.save(); }
    if (wasCraft) UI.craftStation = null;
  };
  // map: beds, defense arrays and teleport arrays
  const dmm0 = UI.drawMinimap;
  UI.drawMinimap = function () {
    dmm0.call(this);
    const v = BUILD(), P0 = G.player;
    if (!v || !P0 || World.mode !== 'over' || !this.mmctx) return;
    const g = this.mmctx, P = P0.car || P0, span = 96, S = 200 / span, ox = P.x / TILE - span / 2, oy = P.y / TILE - span / 2;
    g.font = '12px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const rec of v.list) {
      const ic = MARK[rec.t]; if (!ic) continue;
      const x = (rec.tx + 0.5 - ox) * S, y = (rec.ty + 0.5 - oy) * S;
      if (x < 8 || y < 8 || x > 192 || y > 192) continue;
      g.fillStyle = '#000'; g.fillText(ic, x + 1, y + 1);
      g.fillStyle = MARK_COL[rec.t]; g.fillText(ic, x, y);
    }
    g.textAlign = 'start'; g.textBaseline = 'alphabetic';
  };
  const dbm0 = UI.drawBigMap;
  UI.drawBigMap = function () {
    dbm0.call(this);
    const v = BUILD();
    if (!v || World.mode !== 'over' || !this.mapC) return;
    const c = document.getElementById('bigmap'); if (!c) return;
    const g = c.getContext('2d'), K = this.mapK || 1;
    const N = this.mapZoom, S = c.width / (N * SB), NH = c.height / S / SB;
    const x0 = this.mapC.x - N * SB / 2, y0 = this.mapC.y - NH * SB / 2;
    let n = 0;
    for (const rec of v.list) {
      if (rec.t === 'tparray') n++;
      const ic = MARK[rec.t]; if (!ic) continue;
      const mx = (rec.tx + 0.5 - x0) * S, my = (rec.ty + 0.5 - y0) * S;
      this.mapIcon(g, mx, my, ic, MARK_COL[rec.t], 16 * K);
      if (rec.t === 'tparray' && this.mapHits) this.mapHits.push({ x: mx, y: my, tp: { x: rec.tx * TILE + 16, y: rec.ty * TILE + 16, name: rec.name || 'Trận dịch chuyển #' + n, kind: 'array', icon: '✦', col: '#c9a7ff' } });
    }
  };

  // ---------- styles and the touch wiring (runs at load; touch.js binds #tbtns [data-k] later in boot) ----------
  (function css() {
    const st = document.createElement('style'); st.id = 'v22build-css';
    st.textContent = `
#bd22bar{position:fixed;left:50%;bottom:64px;transform:translateX(-50%);z-index:9;display:flex;flex-direction:column;align-items:center;gap:2px;max-width:96vw;padding:4px 6px;background:rgba(10,8,6,.82);border:1px solid #d9a441;border-radius:6px;box-shadow:0 0 12px rgba(217,164,65,.35);color:#f4e6c8;font-size:14px;pointer-events:auto}
#bd22bar[hidden]{display:none}
body.touch #bd22bar{top:4px;bottom:auto;transform:none;align-items:stretch;max-width:none}
body.touch #bd22bar .row{flex-wrap:wrap;justify-content:flex-start;max-height:132px;overflow-x:hidden;overflow-y:auto;max-width:none}
body.touch #bd22bar button{width:40px;height:40px;font-size:9px}
body.touch #bd22bar button span{display:none}
body.touch #bd22bar button img{width:18px;height:18px}
body.touch #bd22bar .hint{font-size:11px;overflow:hidden;text-overflow:ellipsis;max-width:100%}
#bd22bar .row{display:flex;gap:4px;overflow-x:auto;max-width:94vw;padding:2px}
#bd22bar button{position:relative;flex:0 0 auto;width:50px;height:50px;padding:2px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;background:rgba(40,28,14,.92);border:1px solid #8a6a3a;border-radius:4px;color:#f4e6c8;font-size:10px;line-height:1.05;letter-spacing:0;min-width:0;cursor:pointer}
#bd22bar button.on{border-color:#ffd27a;box-shadow:0 0 8px rgba(255,210,122,.7);background:rgba(90,60,20,.95)}
#bd22bar button img{width:22px;height:22px;object-fit:contain;image-rendering:pixelated;pointer-events:none}
#bd22bar button .ic{font-size:20px;line-height:1;font-weight:normal;pointer-events:none}
#bd22bar button.on[data-dis]{border-color:#ff7a7a;box-shadow:0 0 8px rgba(255,90,90,.7)}
#bd22bar button span{max-width:46px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;pointer-events:none}
#bd22bar button i{position:absolute;top:-5px;right:-4px;font-style:normal;font-size:11px;background:#000;border-radius:6px;padding:0 3px;color:#ffd27a}
#bd22bar .hint{font-size:12px;color:#c8b48a;white-space:nowrap}
#bd22bar .none{font-size:13px;color:#ffb3a0;white-space:nowrap}
#bd22{z-index:12;background:rgba(0,0,0,.55)}
#bd22 .bd22p{position:relative;width:min(640px,96vw);max-height:94vh;display:flex;flex-direction:column;background:linear-gradient(180deg,rgba(24,18,10,.97),rgba(12,8,4,.97));border:2px solid #d9a441;box-shadow:0 0 0 2px #000,0 0 22px rgba(217,164,65,.35);color:#f4e6c8;font-size:17px}
#bd22 .bd22h{display:flex;align-items:center;gap:10px;padding:6px 12px;border-bottom:1px solid rgba(217,164,65,.35)}
#bd22 .bd22h h2{margin:0;font-size:24px;letter-spacing:2px;color:#ffd27a}
#bd22 .bd22h .cap{margin-left:auto;font-size:15px;color:#c8b48a;white-space:nowrap}
#bd22 .bd22h .x{position:static;min-width:0;width:auto;padding:2px 10px;font-size:20px;line-height:1}
#bd22 .bd22cols{display:flex;gap:8px;padding:8px 10px;min-height:0;overflow:hidden}
#bd22 .bd22col{flex:1;min-width:0;display:flex;flex-direction:column}
#bd22 .bd22col h3{margin:2px 0 4px;font-size:16px;color:#ffd27a}
#bd22 .list{overflow:auto;max-height:52vh}
#bd22 .bd22r{display:flex;align-items:center;gap:6px;padding:3px 4px;border-bottom:1px solid rgba(217,164,65,.15)}
#bd22 .bd22r .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#bd22 .bd22r b{color:#ffe27a;font-weight:normal}
#bd22 button{font-size:15px;padding:2px 8px;min-width:0;width:auto;letter-spacing:0}
#bd22 .muted{color:#c8b48a}
@media (max-height:500px){#bd22 .bd22p{font-size:14px}#bd22 .list{max-height:60vh}#bd22 .bd22h h2{font-size:19px}#bd22 button{font-size:13px;padding:1px 6px}}`;
    document.head.appendChild(st);
    const tb = document.getElementById('tbtns');
    if (tb && !tb.querySelector('[data-bd22]')) {
      const b = document.createElement('button');
      b.dataset.k = 'KeyB'; b.dataset.bd22 = '1';
      b.innerHTML = '🔨<span>Xây</span>';
      tb.insertBefore(b, tb.querySelector('#tMount'));
    }
    const kb = document.querySelector('#tmenu [data-k="KeyB"] span');
    if (kb) kb.textContent = 'Xây dựng';
  })();
})();
