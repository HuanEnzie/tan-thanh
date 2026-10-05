// ===== Core game state & systems =====
const Input = {
  keys: {}, pressed: {}, mouse: { x: 0, y: 0, down: false, rdown: false, clicked: false, rclicked: false }, wheel: 0,
  down(k) { return !!this.keys[k]; },
  hit(k) { return !!this.pressed[k]; },
  endFrame() { this.pressed = {}; this.wheel = 0; this.mouse.clicked = false; this.mouse.rclicked = false; },
};

// loot tables: [item, weight, min, max]
const LOOT = {
  crate: [['planks', 5, 1, 2], ['scrap', 5, 1, 2], ['food', 3, 1, 1], ['water', 3, 1, 1], ['ammo_pistol', 3, 6, 12], ['bandage', 2, 1, 1], ['battery', 1.5, 1, 1], ['ammo_shell', 1.5, 3, 5], ['ammo_rifle', 1.5, 10, 20]],
  trash: [['food', 4, 1, 1], ['water', 3, 1, 1], ['scrap', 4, 1, 2], ['choco', 2, 1, 1], ['bandage', 1.5, 1, 1], ['battery', 1, 1, 1], ['flower', 1, 1, 1]],
  car: [['gas', 4, 1, 1], ['scrap', 4, 1, 2], ['battery', 2, 1, 1], ['ammo_pistol', 2, 4, 10], ['energy', 2, 1, 1], ['choco', 2, 1, 1], ['key', 0.8, 1, 1], ['water', 1.5, 1, 1]],
  market: [['water', 5, 1, 2], ['energy', 4, 1, 2], ['choco', 4, 1, 2], ['food', 4, 1, 2], ['flower', 1.5, 1, 1]],
  ammo: [['ammo_pistol', 4, 10, 18], ['ammo_shell', 3, 4, 8], ['ammo_rifle', 3, 15, 30], ['grenade', 1.5, 1, 1], ['molotov', 1.5, 1, 2]],
  medical: [['bandage', 5, 1, 2], ['medkit', 2.5, 1, 1], ['pills', 3, 1, 1], ['water', 1, 1, 1]],
  house: [['food', 4, 1, 2], ['water', 4, 1, 2], ['bandage', 2, 1, 1], ['ammo_pistol', 2, 5, 10], ['battery', 2, 1, 1], ['planks', 2, 1, 2], ['choco', 2, 1, 1], ['pills', 1, 1, 1], ['key', 0.4, 1, 1], ['ammo_shell', 1, 2, 4], ['flower', 1, 1, 1]],
  camp: [['food', 3, 1, 2], ['water', 3, 1, 2], ['ammo_pistol', 3, 6, 12], ['bandage', 2, 1, 1], ['molotov', 1, 1, 1], ['planks', 2, 1, 2], ['ammo_rifle', 2, 10, 20]],
  herb: [['pills', 4, 1, 2], ['food', 2, 1, 1], ['energy', 2, 1, 1], ['flower', 2, 1, 1], ['medkit', 0.6, 1, 1]],
  treasure: [['ammo_rifle', 3, 15, 30], ['ammo_shell', 3, 5, 10], ['medkit', 2, 1, 1], ['grenade', 2, 1, 2], ['pills', 2, 1, 2]],
};

const G = {
  state: 'loading', frame: 0, time: 0, zombies: [], allies: [], zgrid: new SpatialHash(64),
  camera: { x: 0, y: 0 }, zoom: 2, shakeAmt: 0, whiteCache: {}, darkCache: {}, shadowCache: {},
  cars: [], achieved: {}, lvlQueue: 0, flashes: [], corpses: [], companions: [], combo: 0, comboT: 0,

  lore() { return LORE[RL.id]; },
  groanSfx() { return { md: R.pick(['sfx_zombie1', 'sfx_zombie2', 'sfx_zombie3']), cy: 'sfx_robot', ct: R.pick(['sfx_ghost', 'sfx_zombie2']), tt: R.pick(['sfx_monster', 'sfx_zombie3']), sl: R.pick(['sfx_monster', 'sfx_zombie1']) }[RL.id]; },

  // ---------- setup ----------
  newGame(realm, seed, hero) {
    RL = REALMS[realm];
    seed = seed || (Math.random() * 1e9) | 0;
    this.seed = seed; this.realm = realm;
    World.init(seed);
    Story.init(realm, seed, hero || R.pick(LORE[realm].heroNames));
    this.setupCompanions();
    World.update(16 * TILE, 16 * TILE);
    const s = World.startPos;
    this.player = new Player(s.x, s.y);
    const P = this.player;
    P.equip.melee = Loot.weapon('melee', 1, 1);
    P.equip.r1 = Loot.weapon('r1', 1, 0);
    P.mags.r1 = Loot.stats(P.equip.r1).mag;
    P.weapon = 'r1';
    P.inv = { ammo_pistol: 30, bandage: 2, food: 1, water: 1 };
    this.resetRuntime();
    this.clock = 8; this.day = 1; this.time = 0;
    this.stats = { kills: 0, looted: 0, gates: 0, rescued: 0, maxCombo: 0, start: Date.now() };
    this.achieved = {};
    this.camera.x = s.x; this.camera.y = s.y;
  },
  resetRuntime() {
    this.zombies = []; this.allies = []; this.cars = []; this.corpses = [];
    Particles.list = []; Bullets.list = []; Items.list = []; Throws.list = []; Throws.fires = []; Throws.acids = []; Throws.traps = []; Floaters.list = []; FX.list = [];
    this.night = false; this.rain = 0; this.rainT = 20; this.raining = false; this.lightning = 0;
    this.spawnT = 2; this.flowT = 0; this.saveT = 30; this.action = null; this.timeSlow = 0; this.combo = 0; this.comboT = 0;
    this.boss = null; this.flashes = [];
    UI.dirty = true;
  },
  start(isNew) {
    this.state = 'playing';
    UI.showScreen(null);
    UI.hud(true);
    Sound.setRealm(RL.id);
    if (isNew) Story.begin();
  },

  // ---------- save / load ----------
  save() {
    const P = this.player;
    if (!P || P.dead || this.state === 'won') return;
    const over = World.mode === 'over';
    const pos = over ? (P.car ? { x: P.car.x, y: P.car.y } : { x: P.x, y: P.y }) : this.returnPos;
    const delta = [];
    for (const [k, d] of World.delta) delta.push([k, [...d.looted], [...d.removed], d.cleared ? 1 : 0]);
    const data = {
      v: 2, realm: RL.id, seed: this.seed, clock: this.clock, day: this.day, time: this.time, uid: UID,
      p: { x: pos.x, y: pos.y, hp: P.hp, maxHp: P.maxHp, hunger: P.hunger, thirst: P.thirst, equip: P.equip, relics: P.relics, stash: P.stash, weapon: P.weapon, mags: P.mags, inv: P.inv, battery: P.battery, xp: P.xp, level: P.level, perks: P.perks, maxStam: P.maxStam, energy: P.energy },
      story: Story.serialize(), comps: this.companions.map(c => ({ aff: c.aff, stage: c.stage, joined: c.joined, lover: c.lover, scenePending: c.scenePending })),
      stats: this.stats, ach: this.achieved, delta, explored: [...World.explored].slice(-4000),
    };
    try { localStorage.setItem('tt_save_v2', JSON.stringify(data)); } catch (e) {}
  },
  hasSave() { try { return !!localStorage.getItem('tt_save_v2'); } catch (e) { return false; } },
  saveInfo() { try { const d = JSON.parse(localStorage.getItem('tt_save_v2')); return d ? `${REALMS[d.realm].name} • ${d.story.names.hero} • Cấp ${d.p.level} • Ngày ${d.day}` : ''; } catch (e) { return ''; } },
  load() {
    let d;
    try { d = JSON.parse(localStorage.getItem('tt_save_v2')); } catch (e) { return false; }
    if (!d) return false;
    RL = REALMS[d.realm];
    this.seed = d.seed; this.realm = d.realm;
    World.init(d.seed);
    for (const [k, l, r, c] of d.delta || []) World.delta.set(k, { looted: new Set(l), removed: new Set(r), cleared: !!c });
    for (const k of d.explored || []) World.explored.add(k);
    Story.load(d.story);
    this.setupCompanions();
    World.update(d.p.x, d.p.y);
    this.player = new Player(d.p.x, d.p.y);
    Object.assign(this.player, d.p);
    UID = Math.max(UID, d.uid || 1);
    this.resetRuntime();
    this.clock = d.clock; this.day = d.day; this.time = d.time;
    this.stats = d.stats; this.achieved = d.ach || {};
    d.comps.forEach((s, i) => {
      const c = this.companions[i]; Object.assign(c, s);
      if (c.joined) { c.joined = false; const a = new Ally('comp', d.p.x + 30 * (i ? 1 : -1), d.p.y + 30, { img: c.data.sprite, comp: Object.assign(c.data, { ref: c }) }); c.ally = a; c.joined = true; this.allies.push(a); }
    });
    this.camera.x = d.p.x; this.camera.y = d.p.y;
    this.updateNight();
    return true;
  },

  // ---------- image helpers ----------
  whiteOf(img, color) {
    const k = img + color;
    let c = this.whiteCache[k];
    if (!c) {
      const im = IMG[img]; if (!im) return document.createElement('canvas');
      c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
      const g = c.getContext('2d'); g.drawImage(im, 0, 0);
      g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
      this.whiteCache[k] = c;
    }
    return c;
  },
  darkOf(img) {
    let c = this.darkCache[img];
    if (!c) {
      const im = IMG[img];
      c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
      const g = c.getContext('2d'); g.drawImage(im, 0, 0);
      g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(20,10,10,0.55)'; g.fillRect(0, 0, c.width, c.height);
      this.darkCache[img] = c;
    }
    return c;
  },
  shadowOf(img) {
    let c = this.shadowCache[img];
    if (!c) {
      const im = IMG[img];
      c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
      const g = c.getContext('2d'); g.drawImage(im, 0, 0);
      g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(30,20,70,0.78)'; g.fillRect(0, 0, c.width, c.height);
      this.shadowCache[img] = c;
    }
    return c;
  },
  shake(a) { this.shakeAmt = Math.max(this.shakeAmt, a); },
  toast(msg, type) { UI.toast(msg, type); },
  achieve(id) {
    if (this.achieved[id]) return;
    this.achieved[id] = true;
    UI.achievement(ACHIEVEMENTS[id]);
    Sound.play('sfx_achievement', 0.6);
  },
  noise(x, y, r) { for (const z of this.zgrid.query(x, y, r)) if (!z.dead && dist(x, y, z.x, z.y) < r) z.alert(x, y); },
  sightRange() {
    const P = this.player;
    let s = this.night ? 220 : 340;
    if (World.mode === 'dungeon') s = 280;
    if (this.night && P.flash) s += 100;
    if (P.car) s *= 1.3;
    if (this.raining) s *= 0.85;
    return s;
  },
  targets() {
    const P = this.player;
    const out = [P.car || P];
    for (const a of this.allies) if (!a.downed && !a.dead && !(a.kind === 'civ' && a.rescued)) out.push(a);
    return out;
  },
  hurtTarget(t, dmg, src) {
    const P = this.player;
    if (t === P) this.hurtPlayer(dmg, src);
    else if (t === P.car) this.damageCar(P.car, dmg * 0.6);
    else if (t.hurt) t.hurt(dmg);
  },

  // ---------- inventory & gear ----------
  give(id, n, fromGround) {
    const P = this.player;
    const it = ITEMS[id];
    if (!it) return;
    P.inv[id] = (P.inv[id] || 0) + n;
    const nm = it.kind === 'ammo' ? RL.ammoNames[['ammo_pistol', 'ammo_shell', 'ammo_rifle'].indexOf(id)] : it.name;
    Floaters.add(P.x, P.y - 22, `+${n} ${nm}`, it.kind === 'ammo' ? '#ffd76a' : '#b8f28a', 9);
    Sound.play('sfx_pickup', 0.3, 1.2);
    UI.dirty = true;
  },
  has(id, n = 1) { return (this.player.inv[id] || 0) >= n; },
  take(id, n = 1) { this.player.inv[id] -= n; if (this.player.inv[id] <= 0) delete this.player.inv[id]; UI.dirty = true; },
  pickGear(item) {
    const P = this.player;
    const col = RARITY[item.rarity].color;
    Sound.play(item.rarity >= 4 ? 'sfx_legendary' : item.rarity >= 2 ? 'sfx_coin' : 'sfx_pickup', item.rarity >= 4 ? 0.8 : 0.5);
    if (item.rarity >= 4) { this.achieve('legend'); this.shake(4); FX.ring(P.x, P.y, 10, 120, col, 0.6, 6); }
    if (item.rarity >= 5) this.achieve('myth');
    let equipped = false;
    if (item.kind === 'weapon') {
      const cur = P.equip[item.slot];
      if (!cur || Loot.power(item) > Loot.power(cur) * 1.05) {
        if (cur) this.stashAdd(cur);
        P.equip[item.slot] = item; equipped = true;
        if (item.slot !== 'melee' && P.mags[item.slot] === 0) P.mags[item.slot] = Math.min(Loot.stats(item).mag, P.inv[AMMO_OF[item.slot]] || 0), P.mags[item.slot] && this.take(AMMO_OF[item.slot], P.mags[item.slot]);
        P.wcache = {};
      }
    } else {
      const empty = P.relics.indexOf(null);
      if (empty >= 0) { P.relics[empty] = item; equipped = true; this.applyRelics(); }
      else {
        let wi = 0; P.relics.forEach((r, i) => { if (Loot.power(r) < Loot.power(P.relics[wi])) wi = i; });
        if (Loot.power(item) > Loot.power(P.relics[wi])) { this.stashAdd(P.relics[wi]); P.relics[wi] = item; equipped = true; this.applyRelics(); }
      }
    }
    if (!equipped) this.stashAdd(item);
    UI.lootCard(item, equipped);
    UI.dirty = true;
  },
  stashAdd(item) {
    const P = this.player;
    P.stash.push(item);
    if (P.stash.length > 18) { // auto-salvage the weakest
      P.stash.sort((a, b) => Loot.power(b) * (b.rarity + 1) - Loot.power(a) * (a.rarity + 1));
      const s = P.stash.pop(); this.give('scrap', 1 + s.rarity);
    }
  },
  equipItem(item) {
    const P = this.player;
    const i = P.stash.indexOf(item); if (i < 0) return;
    P.stash.splice(i, 1);
    if (item.kind === 'weapon') { if (P.equip[item.slot]) P.stash.push(P.equip[item.slot]); P.equip[item.slot] = item; P.wcache = {}; P.reloading = 0; }
    else { let slot = P.relics.indexOf(null); if (slot < 0) slot = 0; if (P.relics[slot]) P.stash.push(P.relics[slot]); P.relics[slot] = item; this.applyRelics(); }
    Sound.play('sfx_reload', 0.5);
    UI.dirty = true;
  },
  salvage(item) {
    const P = this.player;
    const i = P.stash.indexOf(item); if (i < 0) return;
    P.stash.splice(i, 1);
    this.give('scrap', 1 + item.rarity * 2);
    this.addXp(5 + item.rarity * 15 + item.ilvl);
    Sound.play('sfx_craft', 0.5);
  },
  applyRelics() { const P = this.player; P.shieldMax = P.relic('shield'); },
  switchWeapon(slot) {
    const P = this.player;
    if (P.weapon === slot) return;
    if (slot !== 'melee' && !P.equip[slot]) return;
    P.weapon = slot; P.reloading = 0; P.cool = 0.2;
    Sound.play('sfx_click', 0.4);
    UI.dirty = true;
  },

  // ---------- combat ----------
  hitEnemy(z, dmg, kx, ky, src, ang, wp) {
    if (z.dead) return false;
    const P = this.player;
    let crit = false;
    if (src === 'gun' || src === 'melee' || src === 'skill') {
      const cc = (P.perks.crit || 0) * 0.1 + (wp && wp.crit || 0) + (P.relic('critdmg') ? 0.05 : 0) + 0.05;
      if (Math.random() < cc) { dmg *= 2 + P.relic('critdmg') / 100; crit = true; }
    }
    if (z.t.armor && src !== 'fire' && src !== 'poison') dmg *= 1 - z.t.armor;
    z.hp -= dmg;
    if (src !== 'fire' && src !== 'poison') z.hitT = 0.09;
    const kr = 1 - (z.t.knockRes || 0);
    z.kx += kx * kr; z.ky += ky * kr;
    if (src !== 'fire' && src !== 'poison' && src !== 'trap') {
      const a = ang != null ? ang : Math.atan2(ky, kx);
      Particles.blood(z.x, z.y, a, src === 'car' ? 18 : crit ? 12 : 6, crit ? 220 : 150);
      if (crit) Particles.sparks(z.x, z.y, a + Math.PI, 6, ['#fff6b0', '#ffffff']);
      if (Math.random() < 0.12) World.addDecal(R.pick(['blood1', 'blood2', 'blood3', 'blood4']), z.x + R.range(-8, 8), z.y + R.range(-8, 8), R.range(0, TAU), R.range(0.3, 0.55), 0.85);
      // gain skill energy
      P.energy = Math.min(100, P.energy + dmg * 0.05 * (1 + P.relic('energy') / 100 + (P.perks.skill || 0) * 0.3) / Math.max(1, z.lvl * 0.25));
    }
    // weapon affix procs
    const aff = wp && (wp.aff || wp.affixes);
    if (aff && aff.length && src !== 'fire' && src !== 'poison') this.procs(z, dmg, aff);
    if (src === 'melee' || src === 'gun') { const v = aff && aff.includes('vamp'); if (v) P.hp = Math.min(P.maxHp, P.hp + dmg * 0.04); }
    if (dmg >= 1 && src !== 'fire' && src !== 'poison') Floaters.add(z.x + R.range(-6, 6), z.y - z.r - 6, Math.round(dmg) + (crit ? '!' : ''), crit ? '#ffdd33' : src === 'ally' ? '#b9a8ff' : '#ffffff', crit ? 13 : 8);
    else if (dmg >= 3 && Math.random() < 0.3) Floaters.add(z.x, z.y - z.r, Math.round(dmg), src === 'fire' ? '#ff9a3c' : '#7cf04a', 7);
    if (z.state !== 'chase') { z.state = 'chase'; z.lastSeen = { x: P.x, y: P.y }; }
    if (z.hp <= 0) { this.killEnemy(z, src); return true; }
    return false;
  },
  procs(z, dmg, aff) {
    if (aff.includes('fire') && Math.random() < 0.5) { z.burn = 3; Particles.fire(z.x, z.y, 3); }
    if (aff.includes('ice')) { z.slow = 2; if (Math.random() < 0.12 && !z.boss) { z.stun = 1; Particles.ice(z.x, z.y, 10); Sound.at('sfx_freeze', z.x, z.y, 0.3); } else Particles.ice(z.x, z.y, 3); }
    if (aff.includes('poison')) z.poison += dmg * 0.35;
    if (aff.includes('shock') && Math.random() < 0.45) {
      let from = z; const hit = new Set([z]);
      for (let k = 0; k < 3; k++) {
        let nx = null, nd = 150;
        for (const o of this.zgrid.query(from.x, from.y, 150)) { if (o.dead || hit.has(o)) continue; const d = dist(from.x, from.y, o.x, o.y); if (d < nd) { nd = d; nx = o; } }
        if (!nx) break;
        FX.bolt(from.x, from.y, nx.x, nx.y, '#fff36b');
        hit.add(nx); this.hitEnemy(nx, dmg * 0.45, 0, 0, 'shock', null, null);
        from = nx;
      }
      if (hit.size > 1) Sound.at('sfx_electric', z.x, z.y, 0.3);
    }
    if (aff.includes('explosive') && Math.random() < 0.2) this.explode(z.x, z.y, 60, dmg * 0.8, true, true);
  },
  killEnemy(z, src) {
    z.dead = true; z.dying = 0;
    const P = this.player;
    this.stats.kills++;
    if (this.stats.kills === 1) this.achieve('firstKill');
    if (this.stats.kills === 100) this.achieve('kill100');
    if (this.stats.kills === 500) this.achieve('kill500');
    if (src === 'melee' && P.perks.vamp) P.hp = Math.min(P.maxHp, P.hp + 5 * P.perks.vamp);
    this.combo++; this.comboT = 2.6;
    if (this.combo > this.stats.maxCombo) this.stats.maxCombo = this.combo;
    if (this.combo === 25) this.achieve('combo25');
    if (this.combo % 10 === 0) { Sound.play('sfx_combo', 0.5, 1 + Math.min(0.6, this.combo / 100)); UI.comboPop(this.combo); }
    this.addXp(z.xp * (1 + Math.min(1, this.combo * 0.02)) * (1 + P.relic('xp') / 100));
    P.energy = Math.min(100, P.energy + 3 * (1 + P.relic('energy') / 100));
    for (const c of this.companions) if (c.joined && c.ally && !c.ally.downed && dist(c.ally.x, c.ally.y, P.x, P.y) < 400 && Math.random() < 0.12) this.addAff(c, 1);
    Sound.at(R.chance(0.5) ? (RL.id === 'md' ? 'sfx_zombie_die' : 'sfx_blade_hit') : 'sfx_splat', z.x, z.y, 0.55, z.boss ? 0.5 : R.range(0.85, 1.2));
    Particles.gibs(z.x, z.y, z.boss ? 30 : z.elite ? 14 : 6);
    World.addDecal(R.pick(['blood1', 'blood2', 'blood3']), z.x, z.y, R.range(0, TAU), z.r / 12 * 0.8, 0.85);
    World.addDecal(z.img, z.x, z.y, z.angle + R.range(-0.5, 0.5), z.scale, 0.9, true);
    this.corpses.push({ img: z.img, arche: z.arche, x: z.x, y: z.y, lvl: z.lvl, r: z.r, scale: z.scale, t: this.time });
    if (this.corpses.length > 30) this.corpses.shift();
    // drops
    const luck = (P.perks.luck || 0) * 0.35 + P.relic('luck') / 100;
    const gearChance = z.boss ? 1 : z.elite ? 0.4 : 0.025 + luck * 0.02;
    if (Math.random() < gearChance) {
      const n = z.boss ? 3 : 1;
      for (let i = 0; i < n; i++) {
        const bonus = luck + (z.boss ? 2.2 : z.elite ? 0.9 : 0) + (World.mode === 'dungeon' ? 0.5 : 0);
        const item = Math.random() < 0.25 ? Loot.relic(z.lvl, Loot.rollRarity(bonus)) : Loot.randomWeapon(z.lvl, bonus);
        Items.dropGear(z.x, z.y, item);
      }
    }
    if (Math.random() < (z.elite ? 0.8 : 0.14 + luck * 0.1)) {
      const id = R.pick(['ammo_pistol', 'ammo_pistol', 'ammo_shell', 'ammo_rifle', 'food', 'water', 'scrap', 'bandage']);
      Items.drop(z.x, z.y, id, id.startsWith('ammo') ? R.int(5, 14) : 1);
    }
    if (z.boss) {
      this.achieve('boss');
      this.shake(16); this.hitstop = 0.25; this.slowmo = 1.2;
      for (let i = 0; i < 3; i++) setTimeout(() => this.explodeFx(z.x + R.range(-40, 40), z.y + R.range(-40, 40), 60), i * 200);
      Items.drop(z.x, z.y, 'medkit', 2);
      this.toast(`${z.name} đã gục ngã!`, 'quest');
      if (this.boss === z) { this.boss = null; UI.boss(null); }
      if (z.story) Story.onBoss(true);
      if (z.dungeon) this.dungeonBossDown(z);
    }
  },
  hurtPlayer(dmg, src, silent) {
    const P = this.player;
    if (P.dead || this.state !== 'playing') return;
    if (P.car) { this.damageCar(P.car, dmg * 0.5); return; }
    if (P.dashT > 0 || P.spin > 0 && !silent) return;
    if (!silent && Math.random() < P.relic('dodge') / 100) { Floaters.add(P.x, P.y - 20, 'NÉ!', '#9affff', 10); return; }
    if (P.perks.armor) dmg *= Math.pow(0.88, P.perks.armor);
    if (P.pillsT > 0) dmg *= 0.7;
    P.shieldT = 5;
    if (P.shield > 0) { const a = Math.min(P.shield, dmg); P.shield -= a; dmg -= a; if (dmg <= 0) { FX.ring(P.x, P.y, 14, 26, '#78c8ff', 0.2, 3); return; } }
    P.hp -= dmg;
    if (!silent || P.hurtT <= 0) {
      P.hurtT = 0.35;
      UI.flashDamage(Math.min(1, dmg / 25));
      if (!silent) { Sound.play('sfx_hurt', 0.6, R.range(0.9, 1.1)); this.shake(4); Particles.blood(P.x, P.y, src ? Math.atan2(P.y - src.y, P.x - src.x) : 0, 8); }
    }
    if (src) { const a = Math.atan2(P.y - src.y, P.x - src.x); const k = src.arche === 'brute' || src.boss ? 380 : 120; P.kx += Math.cos(a) * k; P.ky += Math.sin(a) * k; }
    // companion heals when the player is in trouble
    if (P.hp < P.maxHp * 0.35) for (const c of this.companions) if (c.joined && c.stage >= 2 && c.ally && !c.ally.downed && (c.healT || 0) < this.time) {
      c.healT = this.time + 60; P.hp = Math.min(P.maxHp, P.hp + 35);
      c.ally.speak(R.pick(c.data.combat), 2); FX.ring(P.x, P.y, 10, 60, '#6dff7a', 0.5, 4); Floaters.add(P.x, P.y - 26, '+35 ♥', '#ff8ab8', 11);
    }
    if (P.hp <= 0) this.die();
  },
  die() {
    const P = this.player;
    // phoenix feather or a lover saves you once
    const feather = P.relics.findIndex(r => r && r.type === 'revive');
    const lover = this.companions.find(c => c.lover && c.ally && !c.ally.downed && (c.reviveDay || 0) !== this.day);
    if (feather >= 0 || lover) {
      if (feather >= 0) { P.relics[feather] = null; this.toast('Lông Phượng Hoàng bùng cháy — bạn hồi sinh!', 'quest'); }
      else { lover.reviveDay = this.day; this.toast(`${lover.data.name} ôm lấy bạn: "Đừng bỏ em/anh lại!" — bạn hồi sinh!`, 'love'); }
      P.hp = P.maxHp * 0.6; P.hurtT = 2; this.explode(P.x, P.y, 160, 200 + P.level * 10, true, true);
      FX.pillar(P.x, P.y, '#ffd65a', 1.5, 60); Sound.play('sfx_skill', 0.8);
      return;
    }
    P.dead = true; P.hp = 0;
    Sound.play('sfx_player_die', 0.9);
    Sound.setMusic(null);
    World.addDecal('blood1', P.x, P.y, 0, 1, 1);
    Particles.blood(P.x, P.y, 0, 40, 200);
    try { localStorage.removeItem('tt_save_v2'); } catch (e) {}
    setTimeout(() => { this.state = 'dead'; UI.death(); }, 2200);
  },
  explodeFx(x, y, r) {
    for (let i = 0; i < 26; i++) Particles.fire(x + R.range(-r / 3, r / 3), y + R.range(-r / 3, r / 3), 1);
    Particles.smoke(x, y, 10, 'rgba(40,40,40,');
    Particles.debris(x, y, 18);
    Particles.burst(x, y, 22, '#ffb02e', 420, 4);
    FX.ring(x, y, r * 0.2, r * 1.3, '#ffd08a', 0.4, 10);
    this.flashes.push({ x, y, r: r * 2.6, life: 0.35, max: 0.35 });
    World.addDecal('scorch', x, y, R.range(0, TAU), r / 60, 0.85);
  },
  explode(x, y, r, dmg, fromPlayer, quiet) {
    this.explodeFx(x, y, r);
    Sound.at('sfx_explosion', x, y, quiet ? 0.5 : 1, R.range(0.9, 1.1));
    this.shake(Math.max(3, (quiet ? 6 : 14) - dist(x, y, this.player.x, this.player.y) / 60));
    if (!quiet) this.noise(x, y, 800);
    for (const z of this.zgrid.query(x, y, r + 30)) {
      const d = dist(x, y, z.x, z.y);
      if (d < r + z.r && !z.dead) {
        const f = 1 - d / (r + z.r) * 0.6;
        const a = Math.atan2(z.y - y, z.x - x);
        this.hitEnemy(z, dmg * f, Math.cos(a) * 420 * f, Math.sin(a) * 420 * f, 'explosion', a);
        if (!z.boss) z.stun = 0.4; z.burn = 1.5;
      }
    }
    const P = this.player;
    const pd = dist(x, y, P.x, P.y);
    if (pd < r && !fromPlayer) this.hurtPlayer(dmg * 0.5 * (1 - pd / r), { x, y, arche: 'brute' });
    else if (pd < r * 0.6 && fromPlayer && !quiet) this.hurtPlayer(dmg * 0.08, null, true);
    for (const p of World.propsNear(x, y, r)) {
      if (p.dead) continue;
      if (p.explosive && dist(x, y, p.x, p.y) < r) setTimeout(() => this.explodeBarrel(p), 120);
      if (p.kind === 'barricade' && dist(x, y, p.x, p.y) < r) this.damageBarricade(p, dmg);
    }
    for (const c of this.cars) if (dist(c.x, c.y, x, y) < r) this.damageCar(c, dmg * 0.2);
  },
  explodeBarrel(p) {
    if (p.dead) return;
    World.removeProp(p);
    const boom = 1 + (this.player.perks.boom || 0) * 0.4;
    this.explode(p.x, p.y, 110 * boom, (120 + this.player.level * 12) * boom, true);
    Throws.fires.push({ x: p.x, y: p.y, r: 55, life: 5, max: 5 });
  },
  boomerExplode(z) {
    if (z.dead) return;
    this.killEnemy(z, 'explosion');
    this.explode(z.x, z.y, 95, z.dmg * 0 + 30 + z.lvl * 4, false);
    Particles.blood(z.x, z.y, 0, 40, 260);
  },
  damageBarricade(p, dmg) {
    p.hp -= dmg;
    Particles.debris(p.x, p.y, 3, '#7a5a3a');
    if (p.hp <= 0) { World.removeProp(p); Sound.at('sfx_hit', p.x, p.y, 0.9, 0.6); Particles.debris(p.x, p.y, 16, '#7a5a3a'); this.flowT = 0; }
  },
  damageCar(car, dmg) {
    car.hp -= dmg;
    if (car.hp < 30 && Math.random() < 0.3) Particles.smoke(car.x, car.y, 1);
    if (car.hp <= 0) {
      const P = this.player;
      if (P.car === car) this.exitCar(true);
      const i = this.cars.indexOf(car); if (i >= 0) this.cars.splice(i, 1);
      this.explode(car.x, car.y, 130, 120, true);
    }
  },
  carAlarm(p) {
    if (p.alarmT && p.alarmT > this.time) return;
    p.alarmT = this.time + 14;
    Sound.at('sfx_alarm', p.x, p.y, 0.9);
    this.noise(p.x, p.y, 750);
    this.toast('Còi báo động vang lên! Kẻ địch đang kéo tới...', 'warn');
  },

  addXp(n) {
    const P = this.player;
    P.xp += n;
    while (P.xp >= this.xpNeed(P.level)) {
      P.xp -= this.xpNeed(P.level);
      P.level++;
      P.maxHp += 4; P.hp = Math.min(P.maxHp, P.hp + 20);
      this.lvlQueue++;
      FX.pillar(P.x, P.y, '#ffd65a', 1.4, 44); FX.ring(P.x, P.y, 10, 140, '#ffd65a', 0.6, 8);
      Sound.play('sfx_levelup', 0.7);
      const title = this.rankTitle();
      if (title !== this.lastTitle) { if (this.lastTitle) this.toast(`Đột phá cảnh giới: ${title}!`, 'quest'); this.lastTitle = title; }
    }
    UI.dirty = true;
  },
  rankTitle() { const T0 = LORE[RL.id].levelTitles; return T0[Math.min(T0.length - 1, Math.floor((this.player.level - 1) / 5))]; },
  xpNeed(l) { return Math.round(80 + (l - 1) * 60 + Math.pow(l, 1.7) * 5); },
  applyPerk(id) {
    const P = this.player;
    P.perks[id] = (P.perks[id] || 0) + 1;
    if (id === 'hp') { P.maxHp += 25; P.hp = P.maxHp; }
    if (id === 'stam') { P.maxStam = Math.round(P.maxStam * 1.35); P.stamina = P.maxStam; }
    Sound.play('sfx_achievement', 0.5, 1.2);
    UI.dirty = true;
  },

  // ---------- spawning ----------
  spawnEnemy(arche, x, y, o) {
    const z = new Enemy(arche, x, y, o);
    this.zombies.push(z);
    return z;
  },
  pickArche(zone) {
    const d = this.day;
    const t = zone === 2 ? { walker: 44, runner: 18, armored: 10, ranged: 9, brute: 4 + d, exploder: 7 + d * 0.5 }
      : zone === 1 ? { walker: 55, runner: 18, ranged: 7, brute: 3 + d * 0.7, exploder: 6 + d * 0.5, armored: 4 }
        : { walker: 60, runner: 24, brute: 3 + d * 0.5, ranged: 6, armored: 3 };
    if (this.night) t.runner *= 1.8;
    return weighted(t);
  },
  processPending() {
    while (World.pending.length) {
      const s = World.pending.shift();
      if (s.kind === 'enemy') this.spawnEnemy(s.arche, s.x, s.y, { elite: s.elite, guard: s.guard });
      else if (s.kind === 'civ') this.allies.push(new Ally('civ', s.x, s.y, { img: RL.npc[s.sprite] }));
      else if (s.kind === 'boss') {
        if (s.story && !(Story.curAct() && Story.curAct().type === 'boss')) continue;
        const lvl = World.levelAt(s.x, s.y) + (s.story ? 3 : 0);
        const name = s.story ? Story.names.villain : (RL.dungeon.name + ' — ' + RL.enemyNames[6]);
        const z = this.spawnEnemy('boss', s.x, s.y, { lvl, name, story: s.story, hpMul: s.story ? 1.4 : World.mode === 'dungeon' ? 0.55 + World.dg.floor * 0.12 : 1, guard: true });
        z.dungeon = !!s.dungeon;
        this.boss = z;
      }
    }
  },
  spawnTick(dt) {
    if (World.mode === 'dungeon') return;
    this.spawnT -= dt;
    if (this.spawnT > 0) return;
    const P = this.player;
    const sb = World.sbOf(Math.floor(P.x / TILE), Math.floor(P.y / TILE));
    const zone = sb ? sb.zone : 0;
    let target = [12, 22, 30][zone] * (this.night ? 1.6 : 1) * (1 + (this.day - 1) * 0.08);
    target = Math.min(target, this.lowGfx ? 60 : 90);
    this.spawnT = 0.5;
    const count = this.zombies.reduce((n, z) => n + (!z.guard ? 1 : 0), 0);
    if (count >= target) return;
    for (let tries = 0; tries < 10; tries++) {
      const a = R.range(0, TAU), d = R.range(560, 880);
      const x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
      const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
      if (!World.sbs.has(nkey(Math.floor(tx / SB), Math.floor(ty / SB)))) continue;
      if (!World.walkable(tx, ty)) continue;
      const b = World.bldAt(x, y); if (b && b === World.bldAt(P.x, P.y)) continue;
      const s2 = World.sbOf(tx, ty);
      this.spawnEnemy(this.pickArche(s2 ? s2.zone : 0), x, y, { state: 'wander', elite: Math.random() < 0.03 + this.day * 0.004 });
      if (this.night && Math.random() < 0.3) for (let k = 0; k < 2; k++) this.spawnEnemy(R.chance(0.6) ? 'walker' : 'runner', x + R.range(-30, 30), y + R.range(-30, 30), {});
      break;
    }
  },

  // ---------- flow field ----------
  FW: 64,
  computeFlow() {
    const P = this.player.car || this.player;
    const FW = this.FW;
    const ptx = Math.floor(P.x / TILE), pty = Math.floor(P.y / TILE);
    this.fx0 = ptx - FW / 2; this.fy0 = pty - FW / 2;
    if (!this.flow) { this.flow = new Int16Array(FW * FW); this.fq = new Int32Array(FW * FW); }
    const f = this.flow; f.fill(-1);
    const q = this.fq; let qh = 0, qt = 0;
    const s = (pty - this.fy0) * FW + (ptx - this.fx0);
    f[s] = 0; q[qt++] = s;
    while (qh < qt) {
      const c = q[qh++];
      const cx = c % FW, cy = (c / FW) | 0;
      const cd = f[c];
      for (let k = 0; k < 4; k++) {
        const nx = cx + (k === 0 ? 1 : k === 1 ? -1 : 0), ny = cy + (k === 2 ? 1 : k === 3 ? -1 : 0);
        if (nx < 0 || ny < 0 || nx >= FW || ny >= FW) continue;
        const n = ny * FW + nx;
        if (f[n] >= 0) continue;
        if (!World.walkable(nx + this.fx0, ny + this.fy0)) { f[n] = 32000; continue; }
        f[n] = cd + 1; q[qt++] = n;
      }
    }
  },
  flowDir(x, y) {
    if (!this.flow) return null;
    const FW = this.FW;
    const tx = Math.floor(x / TILE) - this.fx0, ty = Math.floor(y / TILE) - this.fy0;
    if (tx < 1 || ty < 1 || tx >= FW - 1 || ty >= FW - 1) return null;
    const f = this.flow;
    const here = f[ty * FW + tx];
    let best = here < 0 || here >= 32000 ? 1e9 : here, bx = 0, by = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const v = f[(ty + dy) * FW + tx + dx];
      if (v < 0 || v >= 32000) continue;
      if (dx && dy) { const a = f[ty * FW + tx + dx], b = f[(ty + dy) * FW + tx]; if (a < 0 || a >= 32000 || b < 0 || b >= 32000) continue; }
      const vv = v + (dx && dy ? 0.4 : 0);
      if (vv < best) { best = vv; bx = dx; by = dy; }
    }
    if (!bx && !by) return null;
    const cx = (tx + this.fx0 + bx) * TILE + 16, cy = (ty + this.fy0 + by) * TILE + 16;
    const ddx = cx - x, ddy = cy - y, d = Math.hypot(ddx, ddy) || 1;
    return [ddx / d, ddy / d];
  },

  // ---------- day / night ----------
  updateNight() {
    const h = this.clock;
    const was = this.night;
    this.night = h >= 20 || h < 5;
    if (!was && this.night && this.state === 'playing' && World.mode === 'over') { this.toast('Màn đêm buông xuống... kẻ địch trở nên hung hãn hơn.', 'warn'); this.player.flash = true; }
  },
  darkness() {
    if (World.mode === 'dungeon') return 0.84;
    const h = this.clock;
    let d;
    if (h >= 7 && h < 18) d = 0;
    else if (h >= 18 && h < 20.5) d = (h - 18) / 2.5 * 0.88;
    else if (h >= 5 && h < 7) d = 0.88 - (h - 5) / 2 * 0.88;
    else d = 0.88;
    d = Math.max(d, RL.alwaysNightish || 0);
    if (this.raining) d = Math.max(d, 0.25 + d * 0.1);
    return clamp(d, 0, 0.9);
  },
  timeTick(dt) {
    if (World.mode === 'dungeon') { this.rain = lerp(this.rain, 0, dt); return; }
    const prevH = this.clock;
    this.clock += dt / 20;
    if (this.clock >= 24) this.clock -= 24;
    if (prevH < 6 && this.clock >= 6) { this.day++; this.toast(`☀ BÌNH MINH — NGÀY ${this.day}`, 'quest'); this.save(); }
    this.updateNight();
    this.rainT -= dt;
    if (this.rainT <= 0) { this.rainT = R.range(40, 120); this.raining = Math.random() < (RL.ambient === 'rain' ? 0.6 : this.raining ? 0.35 : 0.2); }
    this.rain = lerp(this.rain, this.raining ? 1 : 0, dt * 0.3);
    if (this.raining && this.night && Math.random() < dt * 0.04) { this.lightning = 1; setTimeout(() => Sound.play('sfx_thunder', 0.7), R.int(200, 1200)); }
    this.lightning = Math.max(0, this.lightning - dt * 2.5);
    if (Math.random() < dt / 70) { const ev = this.lore().events; if (ev) this.toast(R.pick(ev), 'info'); }
  },

  // ---------- interaction ----------
  findInteract() {
    const P = this.player;
    if (P.car) return { label: 'Xuống xe', kind: 'exitcar' };
    let best = null, bd = 52;
    for (const a of this.allies) {
      const d = dist(P.x, P.y, a.x, a.y);
      if (d > 50) continue;
      if (a.kind === 'comp') { best = { ally: a, kind: a.downed ? 'revive' : 'talk', label: a.downed ? `Cứu ${a.comp.name}` : (a.comp.ref.scenePending ? `♥ Trò chuyện với ${a.comp.name}` : `${a.comp.name} ♥${Math.round(a.comp.ref.aff)}`) }; bd = d; }
      else if (a.kind === 'civ' && !a.rescued) { best = { ally: a, kind: 'civ', label: 'Giải cứu người dân' }; bd = d; }
    }
    if (best) return best;
    for (const p of World.propsNear(P.x, P.y, 90)) {
      if (p.dead) continue;
      let d = 1e9;
      for (const c of p.circles.length ? p.circles : [{ x: p.x, y: p.y, r: Math.min(p.w, p.h) * 0.4 }]) d = Math.min(d, dist(P.x, P.y, c.x, c.y) - c.r);
      if (d > bd) continue;
      if (p.kind === 'gate') { const lv = Math.max(RANK_LVL[p.data.rank], World.levelAt(p.x, p.y)); best = { prop: p, kind: 'gate', label: `Vào Cổng hạng ${p.data.rank}${p.data.story ? ' (cốt truyện)' : ''} • quái ~Lv${lv}${lv > P.level + 5 ? ' ⚠ RẤT NGUY HIỂM' : ''}` }; bd = d; }
      else if (p.kind === 'exit') { best = { prop: p, kind: 'exit', label: 'Rời hầm ngục' }; bd = d; }
      else if (p.kind === 'stairs') { best = { prop: p, kind: 'stairs', label: `Xuống tầng ${World.dg.floor + 1}` }; bd = d; }
      else if (p.kind === 'cage') { best = { prop: p, kind: 'cage', label: `Phá lồng giải cứu ${Story.names.companion}` }; bd = d; }
      else if (p.kind === 'campfire') { best = { prop: p, kind: 'rest', label: 'Nghỉ ngơi bên lửa trại' }; bd = d; }
      else if (p.drivable) { best = { prop: p, kind: 'car', label: this.has('key') ? `Lái xe (xăng ${Math.round(p.fuel)}%)` : 'Lái xe (cần Bộ câu điện)' }; bd = d; }
      else if (p.container && !p.looted) { best = { prop: p, kind: 'loot', label: 'Lục soát' + (p.container === 'artifact' ? ': ' + Story.names.artifact : p.container === 'vault' || p.container === 'dchest' ? ' rương báu' : '') }; bd = d; }
    }
    return best;
  },
  interact(it) {
    if (!it || this.action) return;
    const P = this.player;
    switch (it.kind) {
      case 'exitcar': return this.exitCar();
      case 'car':
        if (!this.has('key')) { this.toast('Cần "Bộ câu điện xe" để khởi động.', 'warn'); if (it.prop.container && !it.prop.looted) this.startAction({ kind: 'loot', prop: it.prop, label: 'Lục soát xe', dur: 1 }); return; }
        return this.enterCar(it.prop);
      case 'loot': return this.startAction({ kind: 'loot', prop: it.prop, label: it.label, dur: ['vault', 'artifact', 'dchest', 'boss'].includes(it.prop.container) ? 1.4 : 0.8 });
      case 'gate': return this.enterGate(it.prop);
      case 'exit': return this.exitDungeon(false);
      case 'stairs': return this.descend();
      case 'talk': return this.companionMenu(it.ally.comp.ref);
      case 'revive': return this.startAction({ kind: 'revive', ally: it.ally, label: `Đang cứu ${it.ally.comp.name}...`, dur: 2 });
      case 'civ': {
        const near = this.zombies.some(z => !z.dead && dist(z.x, z.y, it.ally.x, it.ally.y) < 220);
        if (near) { this.toast('Hãy tiêu diệt kẻ địch xung quanh trước!', 'warn'); return; }
        return this.rescueCiv(it.ally);
      }
      case 'cage': {
        if (!(Story.curAct() && Story.curAct().type === 'rescue')) { this.toast('Chiếc lồng bị phong ấn... chưa phải lúc.', 'info'); return; }
        const near = this.zombies.some(z => !z.dead && dist(z.x, z.y, it.prop.x, it.prop.y) < 260);
        if (near) { this.toast('Quân canh vẫn còn! Hạ hết chúng trước.', 'warn'); return; }
        return this.startAction({ kind: 'cage', prop: it.prop, label: 'Đang phá lồng...', dur: 2.5 });
      }
      case 'rest': {
        const near = this.zombies.some(z => !z.dead && dist(z.x, z.y, P.x, P.y) < 400);
        if (near) { this.toast('Không thể nghỉ khi kẻ địch ở gần.', 'warn'); return; }
        P.hp = Math.min(P.maxHp, P.hp + P.maxHp * 0.4); P.stamina = P.maxStam;
        this.clock = (this.clock + 2) % 24;
        for (const c of this.companions) if (c.joined && c.ally) { c.ally.hp = c.ally.maxHp; if (!c.scenePending) this.addAff(c, 3); }
        this.save(); Sound.play('sfx_heal', 0.6);
        this.toast('Bạn nghỉ ngơi bên lửa trại. Máu hồi phục, game đã được lưu.', 'good');
        const c = this.companions.find(c => c.joined && c.scenePending);
        if (c) setTimeout(() => this.playScene(c), 400);
        return;
      }
    }
  },
  startAction(a) {
    const P = this.player;
    a.t = 0; a.x = a.x ?? P.x; a.y = a.y ?? P.y; a.range = a.range || 60;
    this.action = a;
    if (a.kind === 'loot') Sound.play('sfx_loot', 0.5, R.range(1, 1.3));
  },
  actionTick(dt) {
    const a = this.action; if (!a) return;
    const P = this.player;
    if (dist(P.x, P.y, a.x, a.y) > a.range || P.car) { this.action = null; return; }
    a.t += dt;
    if (a.t >= a.dur) {
      this.action = null;
      if (a.kind === 'loot') this.lootProp(a.prop);
      if (a.kind === 'revive') { a.ally.downed = false; a.ally.hp = a.ally.maxHp * 0.5; this.addAff(a.ally.comp.ref, 4); a.ally.speak(R.pick(a.ally.comp.gift), 3); }
      if (a.kind === 'cage') {
        World.removeProp(a.prop); Particles.debris(a.prop.x, a.prop.y, 20, '#888');
        Sound.play('sfx_hit', 0.8, 0.7);
        const c = this.companions[Story.compIdx];
        if (!c.joined) this.recruit(c, a.prop.x, a.prop.y);
        this.addAff(c, 15);
        Story.onRescue();
      }
    }
  },
  rescueCiv(a) {
    a.rescued = true;
    const P = this.player;
    const ang = Math.atan2(a.y - P.y, a.x - P.x);
    a.vx = Math.cos(ang) * 60; a.vy = Math.sin(ang) * 60;
    a.speak(R.pick(this.lore().civilians.thanks), 4);
    this.stats.rescued++; this.achieve('rescue');
    this.addXp(60 + P.level * 8);
    if (Math.random() < 0.6) Items.dropGear(a.x, a.y, Math.random() < 0.3 ? Loot.relic(World.levelAt(a.x, a.y), Loot.rollRarity(0.8)) : Loot.randomWeapon(World.levelAt(a.x, a.y), 0.8));
    Items.drop(a.x, a.y, R.pick(['medkit', 'food', 'water', 'flower']), 1);
    Sound.play('sfx_heart', 0.5);
    for (const c of this.companions) if (c.joined) this.addAff(c, 2);
  },
  lootProp(p) {
    if (p.looted) return;
    World.markLooted(p);
    this.stats.looted++;
    const P = this.player;
    const give = (id, n) => Items.drop(p.x, p.y, id, n);
    const lvl = World.levelAt(p.x, p.y);
    const luck = (P.perks.luck || 0) * 0.35 + P.relic('luck') / 100;
    const gear = (bonus, n = 1) => { for (let i = 0; i < n; i++) Items.dropGear(p.x, p.y, Math.random() < 0.3 ? Loot.relic(lvl, Loot.rollRarity(bonus + luck)) : Loot.randomWeapon(lvl, bonus + luck)); };
    const kind = p.container;
    if (kind === 'start1') { Items.dropGear(p.x, p.y, Loot.weapon('r2', 1, 1)); give('ammo_shell', 12); give('food', 1); }
    else if (kind === 'start2') { give('water', 2); give('bandage', 2); give('flower', 1); Items.dropGear(p.x, p.y, Loot.relic(1, 1)); }
    else if (kind === 'start3') { Items.dropGear(p.x, p.y, Loot.weapon('r3', 1, 2)); give('ammo_rifle', 40); give('molotov', 2); give('key', 1); give('planks', 2); }
    else if (kind === 'artifact') { Story.onArtifact(); gear(1.5, 1); this.shake(3); }
    else if (kind === 'vault') { gear(1.6, 2); give(R.pick(['medkit', 'grenade', 'ammo_rifle']), 2); }
    else if (kind === 'dchest') { gear(1 + RANKS.indexOf(World.dg.rank) * 0.3, 1 + (Math.random() < 0.4 ? 1 : 0)); give(R.pick(['ammo_pistol', 'ammo_shell', 'ammo_rifle']), R.int(10, 25)); }
    else if (kind === 'boss') { gear(2.5 + RANKS.indexOf(World.dg.rank) * 0.4, 3); give('medkit', 2); give('grenade', 2); }
    else {
      const table = LOOT[kind] || LOOT.crate;
      let rolls = R.int(1, 2) + (Math.random() < luck ? 1 : 0);
      if (Math.random() < 0.15 && !luck) rolls = 0;
      if (Math.random() < 0.05 + luck * 0.05) gear(0.2);
      if (rolls <= 0) { Floaters.add(p.x, p.y - 20, 'Trống rỗng...', '#aaa', 9); return; }
      for (let i = 0; i < rolls; i++) {
        const tbl = {}; table.forEach((e, k) => tbl[k] = e[1]);
        const e = table[+weighted(tbl)];
        give(e[0], R.int(e[2], e[3]));
      }
    }
  },

  // ---------- gates & dungeons ----------
  enterGate(p) {
    const P = this.player;
    this.returnPos = { x: p.x, y: p.y + 70 };
    this.gateProp = p;
    const rank = p.data.rank;
    Sound.play('sfx_portal', 0.8);
    UI.fade(() => {
      const dg = { rank, floor: 1, floors: RANK_FLOORS[rank], level: Math.max(RANK_LVL[rank], World.levelAt(p.x, p.y)), seed: p.data.seed, story: p.data.story };
      this.saveOver = { delta: World.delta, explored: World.explored, minis: World.minis };
      World.enterDungeon(dg);
      this.zombies = []; this.cars = []; Items.list = []; Bullets.list = []; Throws.fires = []; Throws.acids = []; Throws.traps = [];
      World.update(16 * TILE, 16 * TILE);
      P.x = World.startPos.x; P.y = World.startPos.y; P.car = null;
      for (const a of this.allies) { a.x = P.x + R.range(-30, 30); a.y = P.y + R.range(10, 40); }
      this.allies = this.allies.filter(a => a.kind !== 'civ');
      this.camera.x = P.x; this.camera.y = P.y;
      this.flowT = 0;
      UI.banner(`CỔNG HẠNG ${rank}`, `${RL.dungeon.name} • Tầng 1/${dg.floors} • Cấp quái ~${dg.level}`, RANK_COLOR[rank]);
      if (RL.id === 'sl') UI.radio(['[HỆ THỐNG] Bạn đã tiến vào Cổng hạng ' + rank + '.', '[HỆ THỐNG] Nhiệm vụ: tiêu diệt Chủ Hầm Ngục ở tầng cuối.']);
    });
  },
  descend() {
    const P = this.player;
    Sound.play('sfx_portal', 0.6, 0.8);
    UI.fade(() => {
      const dg = World.dg;
      dg.floor++; dg.level += 2;
      World.enterDungeon(dg);
      this.zombies = []; Items.list = []; Bullets.list = [];
      World.update(16 * TILE, 16 * TILE);
      P.x = World.startPos.x; P.y = World.startPos.y;
      for (const a of this.allies) { a.x = P.x + R.range(-30, 30); a.y = P.y + R.range(10, 40); }
      this.camera.x = P.x; this.camera.y = P.y; this.flowT = 0;
      UI.banner(`TẦNG ${dg.floor}/${dg.floors}`, RL.dungeon.name, RANK_COLOR[dg.rank]);
    });
  },
  dungeonBossDown(z) {
    const dg = World.dg;
    if (dg.floor < dg.floors) {
      World.addProp('fx_2', z.x, z.y, { solid: false, layer: 0, kind: 'stairs', light: 120 });
      this.toast('Lối xuống tầng tiếp theo đã mở!', 'quest');
    } else {
      World.addProp(RL.id === 'sl' ? 'sl_p_9' : 'fx_0', z.x, z.y - 60, { solid: false, layer: 0, kind: 'exit', light: 170, lightCol: 'blue' });
      World.addProp('fx_3', z.x, z.y + 30, { container: 'boss', r: 14 });
      dg.cleared = true;
      this.stats.gates++;
      this.achieve('gate'); if (dg.rank === 'S') this.achieve('gateS');
      this.addXp(300 * (RANKS.indexOf(dg.rank) + 1));
      UI.banner('CỔNG ĐÃ BỊ CHINH PHỤC', 'Mở rương báu rồi rời hầm ngục', RANK_COLOR[dg.rank]);
    }
  },
  exitDungeon() {
    const P = this.player;
    const cleared = World.dg && World.dg.cleared, story = World.dg && World.dg.story;
    Sound.play('sfx_portal', 0.7);
    UI.fade(() => {
      World.mode = 'over';
      World.reset();
      World.delta = this.saveOver.delta; World.explored = this.saveOver.explored;
      if (cleared && this.gateProp) World.markRemoved(this.gateProp);
      this.zombies = []; Items.list = []; Bullets.list = [];
      P.x = this.returnPos.x; P.y = this.returnPos.y;
      World.update(P.x, P.y);
      if (cleared && this.gateProp) { const g = World.propsNear(P.x, P.y - 70, 40).find(p => p.kind === 'gate'); if (g) World.removeProp(g); }
      for (const a of this.allies) { a.x = P.x + R.range(-30, 30); a.y = P.y + R.range(10, 40); }
      this.camera.x = P.x; this.camera.y = P.y; this.flowT = 0;
      if (cleared) Story.onGate(story);
      this.save();
    });
  },

  // ---------- vehicles ----------
  enterCar(p) {
    const P = this.player;
    World.removeProp(p);
    const car = new Car(p);
    this.cars.push(car);
    P.car = car;
    this.action = null;
    this.achieve('driver');
    Sound.play('sfx_door', 0.8);
    this.toast('W/S: ga/phanh • A/D: lái • R: đổ xăng • E: xuống xe', 'info');
  },
  exitCar(forced) {
    const P = this.player, car = P.car;
    if (!car) return;
    P.car = null;
    const side = car.angle + Math.PI / 2;
    for (const s of [1, -1, 2, -2]) {
      P.x = car.x + Math.cos(side) * (car.wid / 2 + 16) * Math.sign(s) * (Math.abs(s) > 1 ? 1.6 : 1);
      P.y = car.y + Math.sin(side) * (car.wid / 2 + 16) * Math.sign(s) * (Math.abs(s) > 1 ? 1.6 : 1);
      if (!World.solidAt(Math.floor(P.x / TILE), Math.floor(P.y / TILE))) break;
    }
    World.collideCircle(P, P.r);
    if (!forced) {
      const i = this.cars.indexOf(car); if (i >= 0) this.cars.splice(i, 1);
      const np = World.addProp(car.img, car.x, car.y, { rot: car.angle, drivable: true, fuel: car.fuel, hp: car.hp, container: 'car' });
      np.looted = true;
      Sound.play('sfx_door', 0.7);
    }
  },

  // ---------- crafting / placing ----------
  canCraft(r) { for (const k in r.need) if (!this.has(k, r.need[k])) return false; return true; },
  craft(r) {
    if (!this.canCraft(r)) return;
    for (const k in r.need) this.take(k, r.need[k]);
    this.player.inv[r.out] = (this.player.inv[r.out] || 0) + r.n;
    Sound.play('sfx_craft', 0.6);
    this.toast(`Chế tạo: ${ITEMS[r.out].name} x${r.n}`, 'good');
    UI.dirty = true;
  },
  place(kind) {
    const P = this.player;
    if (P.car || !this.has(kind)) { if (!this.has(kind)) this.toast(`Không có ${ITEMS[kind].name}. Chế tạo bằng [C].`, 'warn'); return; }
    const x = P.x + Math.cos(P.angle) * 34, y = P.y + Math.sin(P.angle) * 34;
    if (World.solidAt(Math.floor(x / TILE), Math.floor(y / TILE))) { this.toast('Không đặt được ở đây.', 'warn'); return; }
    this.take(kind);
    if (kind === 'barricade') { World.addProp(RL.props.fence || 'fence', x, y, { rot: P.angle + Math.PI / 2, kind: 'barricade', hp: 160 + P.level * 10, shrink: 0.8 }); this.flowT = 0; }
    else Throws.traps.push({ x, y, uses: 6 });
    Sound.play('sfx_craft', 0.6, 1.3);
  },

  // ---------- ultimate skills ----------
  castSkill() {
    const P = this.player;
    if (P.energy < 100 || P.car || P.dead) { if (P.energy < 100) this.toast(`Năng lượng chưa đầy (${Math.floor(P.energy)}%). Gây sát thương để nạp.`, 'info'); return; }
    P.energy = 0;
    const pow = (1 + (P.perks.skill || 0) * 0.3) * (1 + P.level * 0.06);
    const sk = RL.skill;
    UI.skillFlash(sk.name, sk.color);
    Sound.play('sfx_skill', 0.8);
    this.shake(6);
    const ax = Input.mouse.wx ?? P.x + Math.cos(P.angle) * 200, ay = Input.mouse.wy ?? P.y + Math.sin(P.angle) * 200;
    switch (sk.id) {
      case 'airstrike': {
        const a = P.angle;
        for (let i = 0; i < 8; i++) setTimeout(() => {
          const x = P.x + Math.cos(a) * (90 + i * 60) + R.range(-25, 25), y = P.y + Math.sin(a) * (90 + i * 60) + R.range(-25, 25);
          this.explode(x, y, 100, 120 * pow, true);
        }, 300 + i * 120);
        this.toast('Pháo kích đang tới!', 'warn');
        break;
      }
      case 'overclock': {
        this.timeSlow = 5;
        FX.ring(P.x, P.y, 20, 320, '#3cf0ff', 0.7, 12);
        Sound.play('sfx_electric', 0.8);
        for (const z of this.zgrid.query(P.x, P.y, 320)) if (!z.dead && dist(P.x, P.y, z.x, z.y) < 320) { FX.bolt(P.x, P.y, z.x, z.y, '#3cf0ff'); this.hitEnemy(z, 90 * pow, 0, 0, 'skill'); z.stun = 1.5; }
        break;
      }
      case 'whirl': {
        P.spin = 2.6;
        Sound.play('sfx_sword2', 0.7);
        break;
      }
      case 'swords': {
        const n = 26;
        for (let i = 0; i < n; i++) setTimeout(() => {
          const a = i / n * TAU + R.range(-0.2, 0.2);
          Bullets.fire(P.x + Math.cos(a) * 40, P.y + Math.sin(a) * 40, a, { speed: 620, knock: 80, homing: true }, 55 * pow, { proj: 'sword', homing: true, life: 1.6, speed: 620, src: 'skill' });
          if (i % 4 === 0) Sound.play('sfx_sword', 0.4, 1.3);
        }, i * 40);
        FX.ring(P.x, P.y, 10, 200, '#7dffd8', 0.8, 8);
        break;
      }
      case 'arise': {
        const pool = this.corpses.filter(c => dist(c.x, c.y, P.x, P.y) < 500).slice(-(5 + Math.floor(P.level / 6)));
        if (!pool.length) { this.toast('Không có xác kẻ địch nào gần đây để hồi sinh...', 'info'); P.energy = 60; return; }
        UI.skillFlash('TRỖI DẬY!', '#6b5bff');
        Sound.play('sfx_shadow', 0.9);
        for (const c of pool) {
          this.corpses.splice(this.corpses.indexOf(c), 1);
          const big = c.arche === 'brute' || c.arche === 'boss';
          const a = new Ally('shadow', c.x, c.y, { img: c.img, hp: (big ? 400 : 140) * pow, dmg: (big ? 50 : 22) * pow, r: c.r, scale: c.scale });
          this.allies.push(a);
          FX.pillar(c.x, c.y, '#6b5bff', 1, 22); Particles.burst(c.x, c.y, 16, '#6b5bff', 160);
        }
        this.toast(`${pool.length} binh lính bóng tối đã trỗi dậy!`, 'quest');
        break;
      }
    }
  },
};
