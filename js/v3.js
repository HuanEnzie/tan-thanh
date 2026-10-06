// ===== v3 systems: chests, merchants & shop, boss hazards, biomes, doors, save files =====

// ---------- boss hazards (telegraphed meteors, expanding shock rings) ----------
const _speedMul = Player.prototype.speedMul;
Player.prototype.speedMul = function () { return _speedMul.call(this) * (this.slowT > 0 ? 0.6 : 1); };

Object.assign(G, {
  hazards: [],
  hazard(type, x, y, o) { this.hazards.push(Object.assign({ type, x, y, life: 0 }, o)); },
  updateHazards(dt) {
    const P = this.player;
    P.slowT = (P.slowT || 0) - dt;
    // announce bosses the first time the player comes close
    if (this.frame % 10 === 0) for (const z of this.zombies) if (z.boss && !z.dead && !z.announced && dist(z.x, z.y, P.x, P.y) < 620) {
      z.announced = true; this.boss = z;
      UI.banner(z.name.toUpperCase(), `BOSS • Lv${z.lvl}`, '#ff4a3a'); Sound.play('sfx_gong', 0.6, 0.8); this.shake(6);
    }
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.life += dt;
      if (h.type === 'meteor') {
        if (h.life < h.t) continue;
        this.explodeFx(h.x, h.y, h.r * 0.8);
        Sound.at('sfx_explosion', h.x, h.y, 0.55, R.range(0.8, 1.1));
        this.shake(5);
        if (!P.dead && !P.car && dist(P.x, P.y, h.x, h.y) < h.r + 8) this.hurtPlayer(h.dmg, { x: h.x, y: h.y });
        for (const a of this.allies) if (a.kind === 'comp' && dist(a.x, a.y, h.x, h.y) < h.r) a.hurt(h.dmg * 0.4);
        this.hazards.splice(i, 1);
      } else if (h.type === 'ring') {
        const prev = h.r; h.r += h.speed * dt;
        const d = dist(P.x, P.y, h.x, h.y);
        if (!h.hit && !P.dead && d >= prev - 14 && d <= h.r + 14) {
          h.hit = true;
          const before = P.hp;
          this.hurtPlayer(h.dmg, { x: h.x, y: h.y });
          if (P.hp < before) { if (h.el === 'ice') { P.slowT = 2.2; Particles.ice(P.x, P.y, 10); } if (h.el === 'fire') Throws.fires.push({ x: P.x, y: P.y, r: 30, life: 2, max: 2, hostile: true }); if (h.el === 'poison') Throws.acids.push({ x: P.x, y: P.y, r: 30, life: 3, max: 3, col: '#7cf04a', dps: 8 }); }
        }
        if (h.r >= h.max) this.hazards.splice(i, 1);
      }
    }
  },
});
function drawHazards(ctx) {
  for (const h of G.hazards) {
    if (h.type === 'meteor') {
      const k = Math.min(1, h.life / h.t);
      ctx.globalAlpha = 0.18 + k * 0.22; ctx.fillStyle = h.col;
      ctx.beginPath(); ctx.arc(h.x, h.y, h.r * k, 0, TAU); ctx.fill();
      ctx.globalAlpha = 0.85; ctx.strokeStyle = h.col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.stroke();
      // the falling rock
      const fy = h.y - (1 - k) * 320;
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.9;
      ctx.fillStyle = h.col; ctx.beginPath(); ctx.arc(h.x + (1 - k) * 60, fy, 7 + k * 5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff6d0'; ctx.beginPath(); ctx.arc(h.x + (1 - k) * 60, fy, 3 + k * 3, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    } else if (h.type === 'ring') {
      ctx.globalAlpha = 0.75 * (1 - h.r / h.max * 0.6); ctx.strokeStyle = h.col; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 0.35; ctx.lineWidth = 20; ctx.beginPath(); ctx.arc(h.x, h.y, Math.max(1, h.r - 8), 0, TAU); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

// ---------- merchants, chests, special items ----------
const SHOP_GOODS = [
  ['medkit', 1, 40], ['bandage', 2, 20], ['pills', 1, 18], ['food', 2, 14], ['water', 2, 12], ['energy', 1, 10],
  ['grenade', 1, 28], ['molotov', 2, 30], ['ammo_pistol', 30, 14], ['ammo_shell', 12, 18], ['ammo_rifle', 40, 24],
  ['scroll', 1, 45], ['mystery', 1, 150], ['heart', 1, 260],
];
const CHEST_PRICE = [0, 160, 420, 1100];
const SELL_PRICE = { planks: 2, scrap: 3, gas: 4, battery: 5, flower: 3, food: 4, water: 3, choco: 3, energy: 4, bandage: 6, pills: 7, medkit: 16, grenade: 10, molotov: 8, key: 15, barricade: 4, trap: 3, scroll: 15, mystery: 40 };

Object.assign(G, {
  spawnMerchant(x, y) {
    const L = LORE_SHOP[rk(RL.id)];
    const a = new Ally('merchant', x, y, { img: RL.npc[2] || RL.npc[0] });
    a.name = L.name; a.title = L.title; a.sayT = R.range(1, 4); a.angle = Math.PI / 2;
    this.allies.push(a);
    return a;
  },
  priceMul() { return 1 + (this.player.level - 1) * 0.04; },
  shopStock(a) {
    if (a.stock && a.stock.day === this.day) return a.stock.items;
    const lvl = Math.max(this.player.level, World.levelAt(a.x, a.y));
    const items = [];
    for (let i = 0; i < 4; i++) items.push(Loot.randomGear(lvl, 0.9, 1));
    a.stock = { day: this.day, items };
    return items;
  },
  pay(n) {
    const P = this.player;
    if (P.gold < n) { this.toast(`Không đủ ${cur().name} (cần ${n}).`, 'warn'); Sound.play('sfx_click', 0.4, 0.6); return false; }
    P.gold -= n; Sound.play('sfx_coin', 0.5, 1.1); UI.dirty = true; return true;
  },
  earn(n) { this.player.gold += n; Sound.play('sfx_coin', 0.45, 1.3); UI.dirty = true; },
  openChest(p) {
    if (p.data && p.data.keep) World.unkeep(p.data.keep);
    const tier = clamp(p.data && p.data.tier || 0, 0, 3), C = CHESTS[tier];
    const P = this.player;
    p.img = 'chest_' + tier + 'o';
    const im = IMG[p.img]; if (im) { p.w = im.width / 2; p.h = im.height / 2; }
    p.openT = this.time;
    this.stats.chests = (this.stats.chests || 0) + 1;
    FX.pillar(p.x, p.y, C.col, 1.1 + tier * 0.45, 22 + tier * 14);
    FX.ring(p.x, p.y, 8, 60 + tier * 45, C.col, 0.5, 4 + tier * 2);
    Particles.burst(p.x, p.y - 6, 16 + tier * 16, C.col, 150 + tier * 70);
    this.flashes.push({ x: p.x, y: p.y, r: 90 + tier * 50, life: 0.4, max: 0.4 });
    Sound.play(C.sfx, 0.55 + tier * 0.12);
    if (tier >= 2) { Sound.play('sfx_achievement', 0.45, 1.25); this.hitstop = 0.1; this.shake(4 + tier * 2); }
    if (tier === 3) { this.slowmo = 0.7; UI.banner(C.name.toUpperCase() + '!', 'Kho báu chói loà tuôn ra...', C.col); }
    Floaters.add(p.x, p.y - 34, C.name + '!', C.col, 11 + tier * 2, true);
    const lvl = World.levelAt(p.x, p.y) + (World.mode === 'dungeon' ? 1 : 0);
    const luck = (P.perks.luck || 0) * 0.35 + P.relic('luck') / 100;
    const bonus = (p.data && p.data.bonus || 0) + luck;
    const drops = [];
    const gold = [[6, 16], [22, 45], [60, 110], [170, 320]][tier];
    drops.push(q => Items.drop(q.x, q.y, 'gold', Math.round(R.int(gold[0], gold[1]) * (1 + lvl * 0.08))));
    const nGear = [Math.random() < 0.4 ? 1 : 0, 1 + (Math.random() < 0.35 ? 1 : 0), 2, 3][tier];
    const gb = [0.3, 1, 2, 3.5][tier], minR = [0, 1, 2, 3][tier];
    for (let i = 0; i < nGear; i++) { const mr = tier === 3 && i === 0 && Math.random() < 0.4 ? 4 : minR; drops.push(q => Items.dropGear(q.x, q.y, Loot.randomGear(lvl, gb + bonus, mr))); }
    const cons = [
      [['food', 1], ['water', 1], ['bandage', 1], ['ammo_pistol', 12], ['planks', 2], ['flower', 1]],
      [['medkit', 1], ['ammo_shell', 8], ['ammo_rifle', 20], ['grenade', 1], ['pills', 1], ['energy', 1]],
      [['medkit', 2], ['grenade', 2], ['ammo_rifle', 35], ['scroll', 1], ['pills', 2]],
      [['medkit', 3], ['heart', 1], ['mystery', 1], ['scroll', 1], ['grenade', 3]],
    ][tier];
    for (let i = 0; i < [2, 2, 2, 3][tier]; i++) { const c = R.pick(cons); drops.push(q => Items.drop(q.x, q.y, c[0], c[1])); }
    if (tier >= 2 && Math.random() < 0.25) drops.push(q => Items.drop(q.x, q.y, 'heart', 1));
    const token = World.mode + (World.dg ? World.dg.floor : '');
    drops.forEach((f, i) => setTimeout(() => {
      if (this.player !== P || P.dead) return;
      if (token !== World.mode + (World.dg ? World.dg.floor : '')) { p = { x: P.x, y: P.y, data: p.data }; }
      f(p); Particles.burst(p.x, p.y - 4, 5, C.col, 120);
    }, 160 + i * 150));
  },
  useItem(id) {
    const P = this.player;
    if (!this.has(id)) return;
    if (id === 'scroll') return this.useScroll();
    if (id === 'heart') { this.take(id); P.maxHp += 10; P.hp = Math.min(P.maxHp, P.hp + 10); FX.pillar(P.x, P.y, '#ff3b5a', 1, 30); Sound.play('sfx_heal', 0.6); this.toast(`+10 máu tối đa (${Math.round(P.maxHp)})`, 'good'); return; }
    if (id === 'mystery') { this.take(id); Items.dropGear(P.x, P.y, Loot.randomGear(P.level, 1.3)); FX.ring(P.x, P.y, 6, 60, '#c08bff', 0.4, 5); Sound.play('sfx_coin', 0.5); return; }
    if (['medkit', 'bandage', 'pills'].includes(id)) useHeal(id);
    if (['food', 'water', 'choco', 'energy'].includes(id)) useFood(id);
  },
  useScroll() {
    const P = this.player;
    if (!this.has('scroll')) { this.toast(`Không có ${itm('scroll').name}. Mua ở thương nhân.`, 'warn'); return; }
    if (P.car || P.dead || this.action) return;
    if (this.zombies.some(z => !z.dead && z.state === 'chase' && dist(z.x, z.y, P.x, P.y) < 160)) { this.toast('Kẻ địch quá gần — không thể niệm truyền tống!', 'warn'); return; }
    this.take('scroll');
    FX.pillar(P.x, P.y, '#7dc8ff', 1.2, 36); Sound.play('sfx_portal', 0.7, 1.2);
    if (World.mode === 'dungeon') { this.exitDungeon(); return; }
    UI.fade(() => {
      World.update(16 * TILE, 16 * TILE);
      const s = World.shelterPos || World.startPos || { x: 16 * TILE, y: 16 * TILE };
      P.x = s.x; P.y = s.y + 40;
      World.update(P.x, P.y);
      this.zombies = this.zombies.filter(z => dist(z.x, z.y, P.x, P.y) < 900);
      for (const a of this.allies) if (a.kind === 'comp' || a.kind === 'shadow') { a.x = P.x + R.range(-30, 30); a.y = P.y + R.range(10, 40); }
      this.camera.x = P.x; this.camera.y = P.y; this.flowT = 0;
      this.toast('Đã truyền tống về nơi trú ẩn.', 'good');
    });
  },
  // where to go inside a dungeon: the boss room, then the stairs / exit
  dungeonTargets() {
    const dg = World.dg; if (!dg) return [];
    if (this.dgTarget) return [this.dgTarget];
    if (this.boss && !this.boss.dead) return [{ x: this.boss.x, y: this.boss.y, label: 'Chủ Hầm Ngục' }];
    return [{ x: (dg.bx * SB + 16) * TILE, y: (dg.by * SB + 16) * TILE, label: 'Chủ Hầm Ngục' }];
  },
  biomeTick() {
    if (World.mode !== 'over') { this.biomeAmb = null; this.biome = null; return; }
    const P = this.player.car || this.player;
    const b = World.biomeOfPos(P.x, P.y);
    if (b === this.biome) return;
    const first = !this.biome;
    this.biome = b;
    const B = BIOMES[b];
    this.biomeAmb = B.amb;
    this.biomeFound(b);
    if (!first) { UI.banner(B.name.toUpperCase(), B.desc, '#cfe8ff'); Sound.play('sfx_bell', 0.3, 1.3); }
  },
});

// ---------- drawing helpers used by the renderer ----------
function drawBiomeTint() {
  if (World.mode !== 'over' || !G.biome) return;
  const B = BIOMES[G.biome];
  if (!B.tint) return;
  ctx.fillStyle = B.tint; ctx.fillRect(0, 0, canvas.width, canvas.height);
}
// door markers on top of roofs so entrances are easy to spot
function drawDoors(b) {
  if (!b.doors || !b.doors.length) return;
  const P = G.player;
  const near = dist(P.x, P.y, b.cx, b.cy) < 520;
  const t = G.time;
  for (const [tx, ty] of b.doors) {
    const X = tx * TILE, Y = ty * TILE;
    const out = ty === b.y0 ? [0, -1] : ty === b.y1 ? [0, 1] : tx === b.x0 ? [-1, 0] : [1, 0];
    const horiz = out[1] !== 0;
    ctx.globalAlpha = Math.max(0.55, b.roofAlpha);
    // doorway with a wooden door leaf
    ctx.fillStyle = '#1c120a'; ctx.fillRect(X + 1, Y + 1, 30, 30);
    ctx.fillStyle = '#7a4a22';
    if (horiz) ctx.fillRect(X + 4, Y + (out[1] < 0 ? 4 : 18), 24, 10); else ctx.fillRect(X + (out[0] < 0 ? 4 : 18), Y + 4, 10, 24);
    ctx.strokeStyle = '#e0b060'; ctx.lineWidth = 2; ctx.strokeRect(X + 2, Y + 2, 28, 28);
    // warm light spilling outside
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.25 + Math.sin(t * 3 + tx) * 0.08;
    ctx.drawImage(GLOW.fire, X + 16 + out[0] * 18 - 30, Y + 16 + out[1] * 18 - 30, 60, 60);
    ctx.globalCompositeOperation = 'source-over';
    if (near && b.roofAlpha > 0.4) {
      // bobbing arrow pointing into the doorway
      const bob = Math.sin(t * 5) * 3;
      const ax = X + 16 + out[0] * (30 + bob), ay = Y + 16 + out[1] * (30 + bob);
      ctx.globalAlpha = 0.95; ctx.fillStyle = '#ffd65a'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
      ctx.save(); ctx.translate(ax, ay); ctx.rotate(Math.atan2(-out[1], -out[0]));
      ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(-5, -6); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
}
// glowing aura on unopened chests, scaled by tier
function drawChestAura(p) {
  const tier = p.data ? p.data.tier : 0, C = CHESTS[tier];
  const pulse = 0.5 + Math.sin(G.time * (3 + tier)) * 0.5;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.18 + tier * 0.08 + pulse * 0.12;
  const r = 26 + tier * 10;
  ctx.drawImage(GLOW[tier === 3 ? 'cyan' : tier === 0 ? 'fire' : 'white'] || GLOW.fire, p.x - r, p.y - r, r * 2, r * 2);
  if (tier >= 2) for (let i = 0; i < 2 + tier; i++) {
    const a = G.time * (1.5 + i * 0.3) + i * 2.1, rr = 14 + tier * 4;
    ctx.fillStyle = C.col; ctx.globalAlpha = 0.6 * pulse;
    ctx.fillRect(p.x + Math.cos(a) * rr - 1, p.y + Math.sin(a) * rr * 0.6 - 8 - ((G.time * 20 + i * 9) % 18), 2, 2);
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  // shake while being opened
  const A = G.action;
  if (A && A.prop === p) { p.rot = Math.sin(G.time * 40) * 0.08 * (A.t / A.dur); }
  else if (p.data && p.data.mimic && Math.sin(G.time * 0.9 + p.x * 0.01) > 0.94) p.rot = Math.sin(G.time * 35) * 0.06; // a mimic twitches now and then
  else p.rot = 0;
}

// ---------- shop UI ----------
Object.assign(UI, {
  shopTab: 'buy',
  openShop(a) {
    if (G.state !== 'playing' || G.player.dead) return;
    G.state = 'menu';
    this.shopM = a; this.shopTab = 'buy';
    const L = LORE_SHOP[rk(RL.id)];
    $('shopName').textContent = `${a.name} — ${a.title}`;
    $('shopSay').textContent = '“' + R.pick(L.greet) + '”';
    $('shopPort').src = IMG[a.img] ? IMG[a.img].src : '';
    this.buildShop();
    this.showScreen('shop');
    Sound.play('sfx_coin', 0.4, 0.9);
  },
  shopSay(kind) { const L = LORE_SHOP[rk(RL.id)]; if (L && L[kind]) $('shopSay').textContent = '“' + R.pick(L[kind]) + '”'; },
  buildShop() {
    const P = G.player, a = this.shopM, mul = G.priceMul(), C = cur();
    document.querySelectorAll('#shop [data-stab]').forEach(t => t.classList.toggle('on', t.dataset.stab === this.shopTab));
    $('shopGold').innerHTML = `<img src="${IMG[C.icon].src}" alt=""><b>${P.gold}</b><small>${esc(C.name)}</small>`;
    const coin = n => `<span class="price"><img src="${IMG[C.icon].src}" alt="">${n}</span>`;
    let h = '';
    if (this.shopTab === 'buy') {
      h += '<h3>Hàng hoá</h3><div class="srows">';
      SHOP_GOODS.forEach(([id, n, base], i) => {
        const d = itm(id);
        const price = Math.round(base * (id === 'heart' ? 1 + (G.heartBuys || 0) * 0.5 : mul));
        h += `<div class="srow"><img src="${IMG[d.icon].src}" alt=""><div class="sinfo"><b>${esc(d.name)}${n > 1 ? ' x' + n : ''}</b><small>${esc(d.desc || '')}</small></div>${coin(price)}<button data-buy="${i}" data-p="${price}" ${P.gold < price ? 'class="dim"' : ''}>MUA</button></div>`;
      });
      h += '</div><h3>Rương báu <small>— mua rương sẽ đặt ngay dưới chân bạn</small></h3><div class="srows">';
      for (let t = 1; t <= 3; t++) {
        const price = Math.round(CHEST_PRICE[t] * mul);
        h += `<div class="srow chestrow" style="--rc:${CHESTS[t].col}"><img src="${IMG['chest_' + t].src}" alt=""><div class="sinfo"><b>${CHESTS[t].name}</b><small>${['', '1–2 trang bị (từ Tốt trở lên) + tiền', '2 trang bị Hiếm trở lên + tiền, vật phẩm quý', '3 trang bị Sử Thi trở lên, có thể ra Huyền Thoại'][t]}</small></div>${coin(price)}<button data-chest="${t}" data-p="${price}" ${P.gold < price ? 'class="dim"' : ''}>MUA</button></div>`;
      }
      h += '</div><h3>Trang bị hôm nay</h3><div class="srows">';
      G.shopStock(a).forEach((it, i) => {
        const r = RARITY[it.rarity], price = Loot.price(it) * 3;
        h += `<div class="srow" style="--rc:${r.color}"><img src="${IMG[Loot.iconOf(it)].src}" alt=""><div class="sinfo"><b style="color:${r.color}">${esc(it.name)}</b><small>${r.name} • Cấp ${it.ilvl} • ${esc(Loot.describe(it).split('\n')[0])}</small></div>${coin(price)}<button data-gear="${i}" data-p="${price}" ${P.gold < price ? 'class="dim"' : ''}>MUA</button></div>`;
      });
      if (!G.shopStock(a).length) h += '<p class="muted">Hết hàng — quay lại vào ngày mai.</p>';
      h += '</div>';
    } else {
      const cheap = P.stash.filter(it => it.rarity <= 1);
      h += `<div class="menu row"><button id="sellCheap" ${cheap.length ? '' : 'class="dim"'}>BÁN HẾT ĐỒ THƯỜNG & TỐT (${cheap.length}) — ${cheap.reduce((s, it) => s + Loot.price(it), 0)}</button></div>`;
      const worn = [...SLOT_ORDER.map(s => P.equip[s]), ...ARMOR_SLOTS.map(s => P.armor[s]), ...P.relics].filter(Boolean);
      if (worn.length) {
        h += '<h3>Đang trang bị <small>— bấm BÁN hai lần để xác nhận</small></h3><div class="srows">';
        for (const it of worn) { const r = RARITY[it.rarity]; h += `<div class="srow worn" style="--rc:${r.color}"><img src="${IMG[Loot.iconOf(it)].src}" alt=""><div class="sinfo"><b style="color:${r.color}">${esc(it.name)}</b><small>ĐANG DÙNG • ${r.name} • Cấp ${it.ilvl}</small></div>${coin(Loot.price(it))}<button data-sellw="${it.uid}">BÁN</button></div>`; }
        h += '</div>';
      }
      h += `<h3>Trang bị trong túi (${P.stash.length}/${G.stashCap()})</h3><div class="srows">`;
      P.stash.forEach(it => {
        const r = RARITY[it.rarity];
        h += `<div class="srow" style="--rc:${r.color}"><img src="${IMG[Loot.iconOf(it)].src}" alt=""><div class="sinfo"><b style="color:${r.color}">${esc(it.name)}</b><small>${r.name} • Cấp ${it.ilvl}</small></div>${coin(Loot.price(it))}<button data-sellg="${it.uid}">BÁN</button></div>`;
      });
      if (!P.stash.length) h += '<p class="muted">Túi trang bị trống.</p>';
      h += '</div><h3>Vật phẩm</h3><div class="srows">';
      const ids = Object.keys(P.inv).filter(id => P.inv[id] > 0 && (SELL_PRICE[id] || ITEMS[id].kind === 'ammo'));
      for (const id of ids) {
        const d = itm(id), each = SELL_PRICE[id] || 0.25, n = P.inv[id];
        h += `<div class="srow"><img src="${IMG[d.icon].src}" alt=""><div class="sinfo"><b>${esc(d.name)} <small>x${n}</small></b></div>${coin(each < 1 ? '¼' : each)}<button data-sell1="${id}">BÁN ${ITEMS[id].kind === 'ammo' ? 10 : 1}</button><button data-sellall="${id}">BÁN HẾT</button></div>`;
      }
      if (!ids.length) h += '<p class="muted">Không có gì để bán.</p>';
      h += '</div>';
    }
    const box = $('shopBody'); box.innerHTML = h;
    box.querySelectorAll('button').forEach(b => this.bindBtn(b));
    box.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => {
      const [id, n] = SHOP_GOODS[+b.dataset.buy];
      if (!G.pay(+b.dataset.p)) return;
      if (id === 'heart') G.heartBuys = (G.heartBuys || 0) + 1;
      P.inv[id] = (P.inv[id] || 0) + n; this.shopSay('buy'); this.buildShop();
    });
    box.querySelectorAll('[data-chest]').forEach(b => b.onclick = () => {
      if (!G.pay(+b.dataset.p)) return;
      const t = +b.dataset.chest;
      const x = P.x + Math.cos(P.angle) * 40, y = P.y + Math.sin(P.angle) * 40;
      World.keepChest(x, y, t, 0.3);
      FX.pillar(x, y, CHESTS[t].col, 0.8, 20);
      this.shopSay('buy'); this.closePanel();
      G.toast(`${CHESTS[t].name} đã đặt trước mặt bạn — nhấn [E] để mở!`, 'good');
    });
    box.querySelectorAll('[data-gear]').forEach(b => b.onclick = () => {
      const st = G.shopStock(a), it = st[+b.dataset.gear];
      if (!it || !G.pay(+b.dataset.p)) return;
      st.splice(st.indexOf(it), 1); G.pickGear(it); this.shopSay('buy'); this.buildShop();
    });
    box.querySelectorAll('[data-sellg]').forEach(b => b.onclick = () => {
      const it = P.stash.find(x => x.uid === +b.dataset.sellg); if (!it) return;
      P.stash.splice(P.stash.indexOf(it), 1); G.earn(Loot.price(it)); this.shopSay('sell'); this.buildShop();
    });
    box.querySelectorAll('[data-sellw]').forEach(b => b.onclick = () => {
      if (!b.dataset.armed) { b.dataset.armed = 1; b.textContent = 'CHẮC CHƯA?'; b.classList.add('warn'); setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = 'BÁN'; b.classList.remove('warn'); } }, 2500); return; }
      const uid = +b.dataset.sellw;
      let it = null;
      for (const s of SLOT_ORDER) if (P.equip[s] && P.equip[s].uid === uid) { it = P.equip[s]; P.equip[s] = null; P.wcache = {}; if (P.weapon === s) P.weapon = 'melee'; if (s !== 'melee') { P.inv[AMMO_OF[s]] = (P.inv[AMMO_OF[s]] || 0) + (P.mags[s] || 0); P.mags[s] = 0; } }
      for (const s of ARMOR_SLOTS) if (P.armor[s] && P.armor[s].uid === uid) { it = P.armor[s]; P.armor[s] = null; P.applyGear(); }
      P.relics.forEach((r, i) => { if (r && r.uid === uid) { it = r; P.relics[i] = null; G.applyRelics(); } });
      if (!it) return;
      G.earn(Loot.price(it)); this.shopSay('sell'); this.buildShop();
    });
    const sellItem = (id, n) => {
      n = Math.min(n, P.inv[id] || 0); if (!n) return;
      const v = Math.max(1, Math.round((SELL_PRICE[id] || 0.25) * n));
      G.take(id, n); G.earn(v); this.shopSay('sell'); this.buildShop();
    };
    box.querySelectorAll('[data-sell1]').forEach(b => b.onclick = () => sellItem(b.dataset.sell1, ITEMS[b.dataset.sell1].kind === 'ammo' ? 10 : 1));
    box.querySelectorAll('[data-sellall]').forEach(b => b.onclick = () => sellItem(b.dataset.sellall, P.inv[b.dataset.sellall]));
    const sc = $('sellCheap');
    if (sc) sc.onclick = () => {
      const list = P.stash.filter(it => it.rarity <= 1); if (!list.length) return;
      let v = 0; for (const it of list) { v += Loot.price(it); P.stash.splice(P.stash.indexOf(it), 1); }
      G.earn(v); this.shopSay('sell'); this.buildShop();
    };
  },

  // ---------- save files ----------
  openSaveIO() {
    if (G.player && !G.player.dead && (G.state === 'paused' || G.state === 'playing') && World.mode === 'over') G.save();
    let t = ''; try { t = localStorage.getItem('tt_save_v2') || ''; } catch (e) {}
    $('sioText').value = t;
    $('sioMsg').textContent = t ? `Bản lưu hiện tại: ${G.saveInfo()}` : 'Chưa có bản lưu nào trên máy này. Bạn có thể nạp file đã xuất trước đó.';
    this.showScreen('saveio');
  },
  saveFileName() {
    let d = null; try { d = JSON.parse(localStorage.getItem('tt_save_v2')); } catch (e) {}
    const hero = d && d.story && d.story.names ? d.story.names.hero : 'save';
    const slug = String(hero).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\w]+/g, '_');
    const dt = new Date(), pad = n => String(n).padStart(2, '0');
    return `tanthanh_${d ? d.realm : 'x'}_${slug}_${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}_${pad(dt.getHours())}${pad(dt.getMinutes())}.json`;
  },
  importSave(text) {
    let d;
    try { d = JSON.parse(String(text).trim()); } catch (e) { $('sioMsg').textContent = '✖ Mã lưu không hợp lệ (không đọc được JSON).'; return; }
    if (!d || !d.realm || !REALMS[d.realm] || !d.p || d.seed == null || !d.story) { $('sioMsg').textContent = '✖ File này không phải bản lưu của Tàn Thành.'; return; }
    if (!REALM_ORDER.includes(d.realm)) { $('sioMsg').textContent = `✖ Thế giới "${REALMS[d.realm].name}" đang tạm đóng.`; return; }
    try { localStorage.setItem('tt_save_v2', JSON.stringify(d)); } catch (e) { $('sioMsg').textContent = '✖ Trình duyệt không cho lưu dữ liệu.'; return; }
    $('sioMsg').textContent = '✔ Đã nạp bản lưu: ' + G.saveInfo() + ' — đang mở...';
    Sound.play('sfx_achievement', 0.5);
    setTimeout(() => { this.hud(false); this.continueGame(); }, 500);
  },
});

// ---------- one-time wiring ----------
(function () {
  $('btnSaveIO').onclick = () => UI.openSaveIO();
  $('btnSaveIOT').onclick = () => UI.openSaveIO();
  $('sioDown').onclick = () => {
    const t = $('sioText').value; if (!t) { $('sioMsg').textContent = 'Chưa có dữ liệu để tải.'; return; }
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([t], { type: 'application/json' }));
      a.download = UI.saveFileName();
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      $('sioMsg').textContent = '✔ Đã tạo file ' + a.download + '. Nếu không thấy file tải về, hãy dùng SAO CHÉP MÃ.';
    } catch (e) { $('sioMsg').textContent = 'Không tải được file ở đây — hãy dùng SAO CHÉP MÃ.'; }
  };
  $('sioCopy').onclick = () => {
    const ta = $('sioText'); const t = ta.value; if (!t) return;
    const fallback = () => { ta.focus(); ta.select(); $('sioMsg').textContent = 'Đã bôi đen mã — nhấn Ctrl+C (hoặc giữ để sao chép).'; };
    try { navigator.clipboard.writeText(t).then(() => { $('sioMsg').textContent = '✔ Đã sao chép mã lưu (' + Math.round(t.length / 1024) + ' KB).'; }, fallback); } catch (e) { fallback(); }
  };
  $('sioFile').onchange = e => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { $('sioText').value = r.result; UI.importSave(r.result); };
    r.readAsText(f);
    e.target.value = '';
  };
  $('sioPaste').onclick = () => UI.importSave($('sioText').value);
  document.querySelectorAll('#shop [data-stab]').forEach(t => t.onclick = () => { UI.shopTab = t.dataset.stab; UI.buildShop(); });
  // gender picker on the world screen
  const setG = g => { UI.pickedGender = g; $('gM').classList.toggle('on', g === 'm'); $('gF').classList.toggle('on', g === 'f'); if (UI.pickedRealm) UI.refreshPick(false); };
  $('gM').onclick = () => setG('m'); $('gF').onclick = () => setG('f');
  UI.pickedGender = 'm';
})();
// quick-bar slots are tappable (handy on phones)
$('quick').addEventListener('click', e => { const q = e.target.closest('.qslot'); if (!q || !q.dataset.q || G.state !== 'playing') return; if (q.dataset.q === 'scroll') G.useScroll(); else if (['barricade', 'trap'].includes(q.dataset.q)) G.place(q.dataset.q); else if (['grenade', 'molotov'].includes(q.dataset.q)) throwIt(q.dataset.q); else G.useItem(q.dataset.q); });

// ---------- installable app (PWA) ----------
const PWA = {
  deferred: null,
  standalone() { return matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; },
  ios() { return /iphone|ipad|ipod/i.test(navigator.userAgent); },
  init() {
    const b = $('btnInstall');
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); this.deferred = e; if (!this.standalone()) b.hidden = false; });
    window.addEventListener('appinstalled', () => { b.hidden = true; this.deferred = null; UI.toast('Đã cài app Tàn Thành! Mở từ màn hình chính để chơi toàn màn hình.', 'good'); });
    if (this.ios() && !this.standalone() && /^https?:$/.test(location.protocol)) b.hidden = false;
    b.onclick = () => {
      if (this.deferred) { this.deferred.prompt(); this.deferred.userChoice.finally(() => { this.deferred = null; }); return; }
      UI.toast(this.ios() ? 'Trên iPhone: bấm nút Chia sẻ ⬆ ở Safari rồi chọn "Thêm vào MH chính".' : 'Mở menu ⋮ của Chrome rồi chọn "Cài đặt ứng dụng" / "Thêm vào màn hình chính".', 'info');
    };
  },
  // called once the service worker is registered
  ready() { $('btnOffline').hidden = false; $('btnOffline').onclick = () => this.cacheAll(); },
  async cacheAll() {
    const b = $('btnOffline');
    if (this.busy) return; this.busy = true;
    const imgs = new Set(COMMON_IMAGES.concat(ART_IMAGES));
    for (const r of REALM_ORDER) for (const n of realmImages(r)) imgs.add(n);
    for (const r of REALM_ORDER) for (const p of REALMS[r].port) { imgs.add(p); if (EXPR_PORTS.has(p)) for (const e of EXPRESSIONS) imgs.add(p + '_' + e); }
    const urls = [...imgs].map(n => 'assets/img/' + n + (JPG.has(n) || /port\d(_|$)/.test(n) ? '.jpg' : '.png'));
    const audio = new Set(SFX_LIST.concat(['sfx_heartbeat', 'amb_rain', 'amb_wind', 'music_menu', 'music_romance', 'music_victory', 'music_dungeon']));
    for (const r of REALM_ORDER) for (const k in REALMS[r].music) audio.add(REALMS[r].music[k]);
    for (const a of audio) urls.push('assets/audio/' + a + '.mp3');
    let done = 0, bad = 0;
    const next = async () => { while (urls.length) { const u = urls.pop(); try { const r = await fetch(u); if (!r.ok) bad++; } catch (e) { bad++; } done++; b.textContent = `📥 ĐANG TẢI... ${done}/${total}`; } };
    const total = urls.length;
    await Promise.all([next(), next(), next(), next()]);
    b.textContent = bad ? `⚠ THIẾU ${bad} FILE — BẤM ĐỂ THỬ LẠI` : '✔ ĐÃ TẢI XONG — CHƠI ĐƯỢC OFFLINE';
    this.busy = false;
  },
};
PWA.init();
