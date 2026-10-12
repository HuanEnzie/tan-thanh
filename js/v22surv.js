// ===== v22surv: Sinh tồn kiểu Minecraft (chọn chế độ, tay trắng, túi đồ khi chết, hồi sinh tại giường / nơi xuất phát) =====
// Chế độ chọn ở màn tạo nhân vật (#create, thêm bằng DOM). Lưu trong G.v10.surv.mode; save cũ không có = cổ điển.
//   survival: xuất phát tay trắng ở vùng ngẫu nhiên cách gốc 4–9 khối lớn; chết -> Túi đồ (prop 'bag22', nhặt bằng E);
//             hồi sinh tại giường (G.setRespawn) hoặc nơi xuất phát; màn chết không có nút xoá bản lưu.
//   classic:  luật cũ, không đổi.
// API: G.isSurvival(), G.setRespawn(x, y, label), G.respawnPoint() -> {x, y}.
// G._svWant: chế độ cho lần G.start(true) kế tiếp (màn tạo nhân vật đặt; test có thể đặt trực tiếp).
// Trạng thái: G.v10.surv = { mode, spawn, bed, bags: [{id, x, y, inv, gold, gear, t}], seq, dead, lastBag }.
(function () {
  const BAG_MAX = 3, BAG_IMG = 'b_tomb', SV = { pick: 'survival', busy: false };
  const wet = t => t === T.WATER || t === T.DEEP;

  // ---------- trạng thái ----------
  const svRead = () => (G.v10 && G.v10.surv) || null;
  const svState = () => {
    const v = G.v10; if (!v) return null;
    return v.surv || (v.surv = { mode: 'classic', spawn: null, bed: null, bags: [], seq: 0, dead: false, lastBag: 0, tut: [] });
  };
  G.isSurvival = function () { const s = svRead(); return !!s && s.mode === 'survival'; };
  G.respawnPoint = function () {
    const s = svRead();
    if (s && s.bed) return { x: s.bed.x, y: s.bed.y };
    if (s && s.spawn) return { x: s.spawn.x, y: s.spawn.y };
    return World.startPos ? { x: World.startPos.x, y: World.startPos.y } : { x: this.player.x, y: this.player.y };
  };
  G.setRespawn = function (x, y, label) {
    const s = svState(); if (!s) return;
    s.bed = { x: Math.round(x), y: Math.round(y), label: String(label || 'Giường') };
    SYS.msg('Đã đặt điểm hồi sinh: ' + s.bed.label, 'info');
    save();
  };
  // G.save refuses while the player is dead; this writes the state anyway (the save must never be deleted in survival)
  function save() { const P = G.player; if (!P) return; const d = P.dead; P.dead = false; try { G.save(); } finally { P.dead = d; } }

  // ---------- màn tạo nhân vật: hai nút chọn chế độ ----------
  const MODE_TXT = {
    survival: 'Kiểu chơi: Sinh tồn. Tay trắng, không có đồ. Chết thì túi đồ rơi tại chỗ gục; hồi sinh ở giường (nếu có) hoặc nơi xuất phát.',
    expert: 'Kiểu chơi: Sinh tồn chuyên gia. Như Sinh tồn, nhưng quái đánh hơi được bạn từ xa: trát bùn cạnh nước hoặc tẩm xăng [P] để xoá mùi.',
    classic: 'Kiểu chơi: Cổ điển. Luật cũ: bắt đầu với súng, đồ và vật tư. Chết là xoá bản lưu.',
  };
  function syncMode() {
    const box = document.getElementById('sv22Mode'); if (!box) return;
    box.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.svm === SV.pick));
  }
  // two buttons in the footer between "back" and the hint line (the character card has no room on a 812x375 screen)
  function modeBox() {
    if (document.getElementById('sv22Mode')) return;
    const back = document.getElementById('crBack'); if (!back) return;
    const st = document.createElement('style'); st.id = 'v22surv-css';
    st.textContent = `#sv22Mode{display:flex;gap:6px;flex-shrink:0;align-items:center}
#sv22Mode button{min-width:0;font-size:16px;padding:4px 10px;letter-spacing:0;white-space:nowrap;background:rgba(255,255,255,.05)}
@media (max-width:900px){.cr-foot #crHint{flex:1 1 0;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#sv22Mode button{padding:4px 7px}}
#sv22Mode button.on{border-color:#ffd65a;color:#ffe9a0;background:rgba(255,214,90,.14)}`;
    document.head.appendChild(st);
    const box = document.createElement('div'); box.id = 'sv22Mode';
    box.innerHTML = '<button data-svm="survival">⛏ Sinh tồn</button><button data-svm="expert">☠ Chuyên gia</button><button data-svm="classic">⚔ Cổ điển</button>';
    back.insertAdjacentElement('afterend', box);
    box.querySelectorAll('button').forEach(b => {
      UI.bindBtn && UI.bindBtn(b);
      b.title = MODE_TXT[b.dataset.svm];
      b.onclick = () => { SV.pick = b.dataset.svm; syncMode(); };
    });
    syncMode();
  }
  const pw = UI.pickWorld;
  UI.pickWorld = function (r) { const out = pw.call(this, r); modeBox(); syncMode(); return out; };
  const sw = UI.startWorld;
  UI.startWorld = function (...a) { G._svWant = SV.pick; return sw.apply(this, a); };

  // ---------- vị trí ngẫu nhiên và dịch chuyển (theo mẫu G.teleport của v5) ----------
  function findSpawn() {
    for (const maxR of [9, 14]) {
      const ring = [];
      for (let sy = -maxR; sy <= maxR; sy++) for (let sx = -maxR; sx <= maxR; sx++) { const d = Math.hypot(sx, sy); if (d >= 4 && d <= maxR) ring.push([sx, sy]); }
      for (let t = 0; t < 80; t++) {
        const [sx, sy] = ring[Math.floor(Math.random() * ring.length)];
        if (World.zoneOf(sx, sy) > 1) continue;
        const sb = World.ensure(sx, sy);
        if (sb.poi || World.waterAt(sb.tx0 + SB / 2, sb.ty0 + SB / 2) !== 0 || sb.tiles.some(wet)) continue;
        for (let k = 0; k < 200; k++) {
          const tx = sb.tx0 + 2 + Math.floor(Math.random() * (SB - 4)), ty = sb.ty0 + 2 + Math.floor(Math.random() * (SB - 4));
          if (!World.walkable(tx, ty) || wet(World.get(tx, ty)) || !World.free(tx, ty, 1)) continue;
          return { x: tx * TILE + 16, y: ty * TILE + 16 };
        }
      }
    }
    return null;
  }
  function relocate(x, y) {
    const P = G.player;
    World.reset();
    G.zombies = []; Items.list = []; Bullets.list = []; Throws.list = []; Throws.fires = []; Throws.acids = []; Throws.traps = [];
    G.hazards = []; G.boss = null; UI.boss(null);
    G.allies = G.allies.filter(a => a.kind === 'comp' || a.kind === 'shadow');
    P.car = null; P.x = x; P.y = y; P.vx = P.vy = P.kx = P.ky = 0;
    World.update(x, y);
    for (const a of G.allies) { a.x = x + R.range(-30, 30); a.y = y + R.range(10, 40); }
    G.camera.x = x; G.camera.y = y; G.flowT = 0;
    FX.pillar(x, y, '#7dc8ff', 1, 40);
  }

  // ---------- bắt đầu sinh tồn: tay trắng ----------
  function startSurvival() {
    const P = G.player, s = svState();
    const ticket = P.inv.ticket || 0;
    P.inv = ticket ? { ticket } : {};                  // vé gacha giữ lại, còn lại về 0
    for (const k of Object.keys(P.equip)) P.equip[k] = null;
    for (const k of Object.keys(P.armor)) P.armor[k] = null;
    P.relics = [null, null, null]; P.stash = []; P.gold = 0;
    P.mags = { r1: 0, r2: 0, r3: 0 }; P.weapon = 'melee'; P.wcache = {};
    P.applyGear(); G.applyRelics();
    const spot = findSpawn();
    if (spot) relocate(spot.x, spot.y);
    s.spawn = spot ? { x: spot.x, y: spot.y } : { x: P.x, y: P.y };
  }
  const st = G.start;
  G.start = function (isNew) {
    if (isNew) {
      const expert = this._svWant === 'expert';
      const want = this._svWant === 'survival' || expert ? 'survival' : 'classic';
      this._svWant = null;
      const s = svState();
      if (s) { s.mode = want; s.dead = false; s.bags = []; s.bed = null; s.lastBag = 0; s.spawn = null; s.seq = 0; s.tut = []; s.expert = expert; }
      if (want === 'survival' && this.player) {
        startSurvival();
        setTimeout(() => SYS.msg('Bạn tỉnh dậy ở một vùng đất lạ, tay trắng. Hãy thu thập gỗ, đá, sợi cỏ để chế tạo công cụ (C).', 'quest'), 1500);
      }
    }
    const r = st.call(this, isNew);
    const s = svRead();
    // a survival save written while dead: show the death screen again (no new bag, no save deletion)
    if (!isNew && s && s.mode === 'survival' && s.dead && this.player) { this.player.dead = true; this.player.hp = 0; this.state = 'dead'; UI.death(); }
    return r;
  };

  // ---------- chết ----------
  function deathSurvival() {
    const P = G.player, s = svState();
    const gear = [];
    for (const k of Object.keys(P.equip)) if (P.equip[k]) { gear.push(P.equip[k]); P.equip[k] = null; }
    for (const k of Object.keys(P.armor)) if (P.armor[k]) { gear.push(P.armor[k]); P.armor[k] = null; }
    for (const it of P.stash) gear.push(it);
    const inv = P.inv, gold = Math.floor((P.gold || 0) * 0.5);
    const at = World.mode === 'dungeon' && G.returnPos ? G.returnPos : (P.car || P); // chết trong hầm ngục: túi ở cửa Cổng
    P.inv = {}; P.stash = []; P.gold = 0;
    P.mags = { r1: 0, r2: 0, r3: 0 }; P.weapon = 'melee'; P.wcache = {};
    P.applyGear();
    P.xp = Math.floor((P.xp || 0) * 0.7);              // mất 30% EXP của cấp hiện tại
    s.dead = true;
    if (Object.keys(inv).length || gold || gear.length) {
      makeBag({ x: at.x, y: at.y }, { inv, gold, gear });
      SYS.msg('Túi đồ rơi tại nơi gục ngã 💀. Quay lại và bấm E để nhặt.', 'warn');
    } else { s.lastBag = 0; SYS.msg('Bạn không còn gì để rơi.', 'warn'); }
    UI.dirty = true;
    save();
  }
  function makeBag(at, d) {
    const s = svState();
    s.seq = (s.seq || 0) + 1;
    while (s.bags.length >= BAG_MAX) dropBagProp(s.bags.shift().id);   // túi cũ nhất mất
    const b = { id: s.seq, x: Math.round(at.x), y: Math.round(at.y), inv: d.inv, gold: d.gold, gear: d.gear, t: Math.round(G.time || 0) };
    s.bags.push(b); s.lastBag = b.id;
    if (World.mode === 'over') placeBag(b);
    return b;
  }
  const die = G.die;
  G.die = function (...a) {
    const P = this.player;
    if (!P || P.dead || !this.isSurvival() || (typeof Net !== 'undefined' && Net.active)) return die.apply(this, a);
    die.apply(this, a);                                // lông phượng / người yêu / perk hồi sinh chạy trước và giữ người chơi sống
    if (P.dead) deathSurvival();
  };
  const hp = G.hurtPlayer;
  G.hurtPlayer = function (dmg, src, silent) {
    if ((this._svImmuneUntil || 0) > (G.time || 0)) return;   // bất tử 3 s sau khi hồi sinh
    return hp.call(this, dmg, src, silent);
  };

  // ---------- túi đồ: prop runtime (không đi qua chỉ số delta), vẽ lại mỗi khi khối được sinh ----------
  function bagProps(id) {
    const out = [];
    for (const sb of World.sbs.values()) for (const p of sb.props) if (!p.dead && p.data && p.data.bag === id) out.push(p);
    return out;
  }
  function dropBagProp(id) { for (const p of bagProps(id)) World.removeProp(p); }
  function addBagProp(sb, b) {
    if (sb.props.some(p => !p.dead && p.data && p.data.bag === b.id)) return;
    World.addProp(BAG_IMG, b.x, b.y, { solid: false, layer: 0, kind: 'bag22', light: 60, lightCol: 'red', data: { bag: b.id } });
  }
  function placeBag(b) {
    const sb = World.sbs.get(nkey(Math.floor(b.x / TILE / SB), Math.floor(b.y / TILE / SB)));
    if (sb) addBagProp(sb, b);
  }
  const ens = World.ensure;
  World.ensure = function (sx, sy) {
    const fresh = !this.sbs.has(nkey(sx, sy));
    const sb = ens.call(this, sx, sy);
    const s = svRead();
    if (fresh && sb && this.mode === 'over' && s && s.bags.length) {
      for (const b of s.bags) if (Math.floor(b.x / TILE / SB) === sx && Math.floor(b.y / TILE / SB) === sy) addBagProp(sb, b);
    }
    return sb;
  };
  function pickBag(p) {
    const P = G.player, s = svState();
    if (!P || P.dead || !s) return;
    const b = s.bags.find(x => x.id === p.data.bag);
    World.removeProp(p);
    if (!b) return;
    for (const id of Object.keys(b.inv || {})) P.inv[id] = (P.inv[id] || 0) + b.inv[id];
    P.gold = (P.gold || 0) + (b.gold || 0);
    s.bags = s.bags.filter(x => x !== b);
    for (const it of b.gear || []) G.pickGear(it);
    const L = G.v10.loot; if (L && L.guide && L.guide.key === 'bag22:' + b.id) L.guide = null;
    UI.dirty = true; Sound.play('sfx_pickup', 0.6);
    SYS.msg('Đã nhặt lại túi đồ.', 'reward');
    save();
  }
  const fi = G.findInteract;
  G.findInteract = function () {
    const P = this.player;
    if (P && !P.car && !P.dead) {
      let best = null, bd = 44;
      for (const p of World.propsNear(P.x, P.y, 60)) if (p.kind === 'bag22' && !p.dead) { const d = dist(P.x, P.y, p.x, p.y); if (d < bd) { bd = d; best = p; } }
      if (best) return { prop: best, kind: 'bag22', label: 'Nhặt túi đồ 💀' };
    }
    return fi.call(this);
  };
  const ia = G.interact;
  G.interact = function (it) {
    if (it && it.kind === 'bag22') { if (!this.action) pickBag(it.prop); return; }
    return ia.call(this, it);
  };

  // ---------- bản đồ: ✈ và danh sách có túi đồ; chấm 💀 trên minimap ----------
  const tpa = G.tpAll;
  G.tpAll = function () {
    const out = tpa.call(this), s = svRead();
    if (World.mode === 'over' && s && s.bags) for (const b of s.bags) {
      const [rx, ry] = World.regionOf(Math.floor(b.x / SBPX), Math.floor(b.y / SBPX));
      out.push({ x: b.x, y: b.y, name: `Túi đồ 💀 • ${World.regionInfo(rx, ry).name}`, kind: 'bag', icon: '💀', col: '#ff7a7a' });
    }
    return out;
  };
  const dm = UI.drawMinimap;
  UI.drawMinimap = function () {
    dm.call(this);
    const s = svRead();
    if (World.mode !== 'over' || !s || !s.bags.length || !G.player) return;
    const g = this.mmctx, P = G.player.car || G.player, S = 200 / 96, ox = P.x / TILE - 48, oy = P.y / TILE - 48;
    for (const b of s.bags) {
      const px = clamp((b.x / TILE - ox) * S, 9, 191), py = clamp((b.y / TILE - oy) * S, 9, 191);
      g.fillStyle = '#000'; g.beginPath(); g.arc(px, py, 7, 0, TAU); g.fill();
      g.fillStyle = '#ff7a7a'; g.beginPath(); g.arc(px, py, 5.5, 0, TAU); g.fill();
      g.fillStyle = '#000'; g.font = 'bold 8px sans-serif'; g.textAlign = 'center'; g.fillText('☠', px, py + 3);
    }
  };

  // ---------- màn chết: sinh tồn có nút HỒI SINH (không xoá bản lưu); cổ điển giữ nút cũ ----------
  const dth = UI.death;
  UI.death = function (...a) {
    const r = dth.apply(this, a), s = svRead(), b = $('btnRetry');
    const sv = !!(s && s.dead && s.mode === 'survival');
    b.textContent = sv ? '☣ HỒI SINH' : '☣ HÀNH TRÌNH MỚI';
    b.onclick = sv ? () => respawn() : () => { UI.newArmed = true; UI.worldSelect(); };
    return r;
  };

  // ---------- hướng dẫn sinh tồn: 5 bước, mỗi bước hiện đúng một lần; kiểm tra mỗi 60 khung, mỗi lần tối đa 1 bước ----------
  // s.tut = danh sách chỉ số bước đã hiện (lưu cùng G.v10.surv)
  const TUT_STEPS = [
    { text: 'Chặt cây (giữ E cạnh cây) để lấy Gỗ.', ok: P => (P.inv.planks || 0) >= 4 },
    { text: 'Mở Chế tạo (C): làm Que gỗ và Bàn chế tạo.', ok: P => (P.inv.pl_bench || 0) >= 1 },
    { text: 'Nhấn B để đặt Bàn chế tạo, đứng cạnh nó để chế Rìu đá / Cuốc đá (cần Đá từ tảng đá, Sợi cỏ từ bụi cây).',
      ok: P => !!(P.equip.melee && P.equip.melee.tool) || P.stash.some(it => it && it.tool) },
    { text: 'Làm Giường (Gỗ + Vải từ tủ quần áo trong nhà) và đặt điểm hồi sinh.', ok: () => !!(svRead() && svRead().bed) },
    { text: 'Săn quái lấy Lõi quái, đào tinh thể trong Cổng để xây Trận dịch chuyển.', ok: (P, s) => s.tut.includes(3) },
  ];
  function tutorialTick() {
    const P = G.player, s = svRead();
    if (!P || !s || s.mode !== 'survival' || P.dead || (typeof Net !== 'undefined' && Net.guest)) return;
    if (!s.tut) s.tut = [];
    const i = TUT_STEPS.findIndex((st, k) => !s.tut.includes(k) && st.ok(P, s));
    if (i < 0) return;
    s.tut.push(i);
    SYS.msg(TUT_STEPS[i].text, 'quest');
    save();
  }
  const v5t = G.v5Tick;
  G.v5Tick = function (dt) { v5t.call(this, dt); if (this.frame % 60 === 0) tutorialTick(); };

  // ---------- hồi sinh ----------
  function respawn() {
    const P = G.player, s = svRead();
    if (!P || !s || !s.dead || SV.busy) return;
    SV.busy = true;
    const pt = G.respawnPoint(), atBed = !!s.bed;
    P.hp = Math.max(1, Math.round(P.maxHp * 0.6));   // máu 60%
    P.hunger = Math.max(P.hunger, 60); P.thirst = Math.max(P.thirst, 60);
    P.kx = P.ky = 0; P.hurtT = 0;
    const go = () => UI.fade(() => {
      s.dead = false; P.dead = false;
      relocate(pt.x, pt.y);
      G._svImmuneUntil = (G.time || 0) + 3;
      G.start(false);
      SV.busy = false;
      SYS.msg(atBed ? 'Bạn hồi sinh ở giường.' : 'Bạn hồi sinh ở nơi xuất phát.', 'info');
      const b = s.bags.find(x => x.id === s.lastBag);
      if (b && typeof G.guideTo === 'function') G.guideTo(b.x, b.y, 'Túi đồ của bạn', '💀', 'bag22:' + b.id);
      G.save();
      Bus21.emit('respawn');
    });
    if (World.mode === 'dungeon') {          // thoát hầm ngục bằng đường chính thức rồi mới hồi sinh
      G.exitDungeon();
      let n = 0;
      const wait = () => { if ((World.mode === 'over' && !G.transit) || ++n > 80) go(); else setTimeout(wait, 50); };
      setTimeout(wait, 50);
    } else go();
  }
})();
