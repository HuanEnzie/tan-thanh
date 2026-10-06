// ===== Per-frame update, rendering, main loop =====
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const lightC = document.createElement('canvas');
const lctx = lightC.getContext('2d');
let VW = 0, VH = 0;

// pre-rendered light sprites (much cheaper than gradients every frame)
function makeGlow(col) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, col.replace('A', '1')); gr.addColorStop(0.5, col.replace('A', '0.55')); gr.addColorStop(1, col.replace('A', '0'));
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return c;
}
const GLOW = {
  cut: makeGlow('rgba(0,0,0,A)'),
  fire: makeGlow('rgba(255,140,40,A)'), cyan: makeGlow('rgba(60,240,255,A)'), magenta: makeGlow('rgba(255,70,220,A)'),
  red: makeGlow('rgba(255,60,50,A)'), blue: makeGlow('rgba(80,140,255,A)'), white: makeGlow('rgba(255,250,230,A)'),
};

function resize() {
  const touch = document.body.classList.contains('touch');
  const cap = G.lowGfx ? 1 : touch ? 1.5 : 2;
  const dpr = Math.min(window.devicePixelRatio || 1, cap);
  VW = Math.max(320, window.innerWidth); VH = Math.max(200, window.innerHeight);
  canvas.width = Math.round(VW * dpr); canvas.height = Math.round(VH * dpr);
  canvas.style.width = VW + 'px'; canvas.style.height = VH + 'px';
  G.dpr = dpr;
  G.zoom = clamp(touch ? Math.min(VW / 620, VH / 350) : Math.min(VW / 880, VH / 500), 0.8, 3) * dpr;
  lightC.width = Math.ceil(canvas.width / 3); lightC.height = Math.ceil(canvas.height / 3);
}
window.addEventListener('resize', resize);

const screenToWorld = (sx, sy) => ({
  x: (sx * G.dpr - canvas.width / 2) / G.zoom + G.camera.x,
  y: (sy * G.dpr - canvas.height / 2) / G.zoom + G.camera.y,
});

// ---------- player control ----------
function updatePlayer(dt) {
  const P = G.player;
  if (P.dead) return;
  P.hurtT -= dt; P.muzzleT -= dt; P.swingT -= dt; P.energyT -= dt; P.pillsT -= dt; P.dashCd -= dt;
  P.recoil = Math.max(0, P.recoil - dt * 8);
  const belly = Math.pow(0.75, P.perks.belly || 0);
  P.hunger = Math.max(0, P.hunger - dt * (100 / 1100) * belly);
  P.thirst = Math.max(0, P.thirst - dt * (100 / 800) * belly);
  if (P.hunger <= 0 || P.thirst <= 0) { P.hp -= dt * 1.2; if (P.hp <= 0) G.die(); }
  else if (P.hunger > 60 && P.thirst > 60 && P.hurtT < -4) P.hp = Math.min(P.maxHp, P.hp + dt * 0.8);
  if (P.relic('regen')) P.hp = Math.min(P.maxHp, P.hp + P.relic('regen') * dt);
  // shield relic
  P.shieldT -= dt;
  if (P.shieldMax && P.shieldT <= 0) P.shield = Math.min(P.shieldMax, P.shield + dt * 12);
  relicTick(dt);

  let m = screenToWorld(Input.mouse.x, Input.mouse.y);
  Input.mouse.wx = m.x; Input.mouse.wy = m.y;

  if (P.car) {
    P.car.update(dt);
    P.x = P.car.x; P.y = P.car.y;
    if (Input.hit('KeyR')) {
      if (G.has('gas')) { G.take('gas'); P.car.fuel = Math.min(100, P.car.fuel + 50); G.toast('Đổ xăng +50%', 'good'); }
      else G.toast('Không có can xăng.', 'warn');
    }
    return;
  }

  let ax = 0, ay = 0;
  {
    P.angle = Math.atan2(m.y - P.y, m.x - P.x);
    if (Input.down('KeyW') || Input.down('ArrowUp')) ay -= 1;
    if (Input.down('KeyS') || Input.down('ArrowDown')) ay += 1;
    if (Input.down('KeyA') || Input.down('ArrowLeft')) ax -= 1;
    if (Input.down('KeyD') || Input.down('ArrowRight')) ax += 1;
  }
  const mv = Math.hypot(ax, ay);
  if (mv) { ax /= mv; ay /= mv; }
  // dash
  if ((Input.hit('Space') || Input.hit('KeyX')) && P.dashCd <= 0 && P.stamina >= 15) {
    const da = mv ? Math.atan2(ay, ax) : P.angle;
    P.dashDir = da; P.dashT = 0.19 * (1 + (P.perks.dash || 0) * 0.2);
    P.dashCd = 0.85 * (1 - P.relic('cdr') / 100) * Math.pow(0.85, P.perks.dash || 0);
    P.stamina -= 15; P.stamDelay = 0.6;
    Sound.play('sfx_dash', 0.5, R.range(0.95, 1.1));
    Particles.dust(P.x, P.y + 6, 5);
  }
  if (P.dashT > 0) {
    P.dashT -= dt;
    const sp = 560;
    P.vx = Math.cos(P.dashDir) * sp; P.vy = Math.sin(P.dashDir) * sp;
    P.ghostT -= dt;
    if (P.ghostT <= 0) { P.ghostT = 0.025; const w = P.wdef; FX.ghost(w.sprite, P.x, P.y, P.angle, -IMG[w.sprite].height / 4, RL.color, 0.28); }
    if (P.perks.dash) for (const z of G.zgrid.query(P.x, P.y, 30)) if (!z.dead && (z.dashHit || 0) < G.time) { z.dashHit = G.time + 0.3; G.hitEnemy(z, 20 * P.perks.dash * (1 + P.level * 0.05), 0, 0, 'melee'); }
    if (P.relic('thorns') && Math.random() < 0.5) Throws.fires.push({ x: P.x, y: P.y, r: 22, life: 1.2, max: 1.2, friendly: true });
  } else {
    const sprint = (Input.down('ShiftLeft') || Input.down('ShiftRight')) && mv > 0 && P.stamina > 1;
    let speed = 120 * P.speedMul() * (sprint ? 1.55 : 1) * (P.reloading > 0 ? 0.85 : 1) * (P.spin > 0 ? 1.15 : 1);
    if (P.hunger <= 0 || P.thirst <= 0) speed *= 0.85;
    if (sprint && P.energyT <= 0) { P.stamina -= dt * 22; P.stamDelay = 0.9; }
    else { P.stamDelay -= dt; if (P.stamDelay <= 0) P.stamina = Math.min(P.maxStam, P.stamina + dt * (18 + (P.perks.stam || 0) * 6)); }
    P.vx = lerp(P.vx, ax * speed, Math.min(1, dt * 14));
    P.vy = lerp(P.vy, ay * speed, Math.min(1, dt * 14));
    P.sprinting = sprint;
  }
  P.x += (P.vx + P.kx) * dt; P.y += (P.vy + P.ky) * dt;
  P.kx *= Math.max(0, 1 - dt * 9); P.ky *= Math.max(0, 1 - dt * 9);
  World.collideCircle(P, P.r);
  const sp = Math.hypot(P.vx, P.vy);
  P.walkT += dt * sp * 0.075;
  P.stepT -= dt * sp / 120;
  if (P.stepT <= 0 && sp > 20) { P.stepT = P.sprinting ? 0.3 : 0.42; Sound.play('sfx_step', P.sprinting ? 0.22 : 0.12, R.range(0.9, 1.15)); if (P.sprinting) { G.noise(P.x, P.y, 140); Particles.dust(P.x - P.vx * 0.05, P.y - P.vy * 0.05 + 6, 2); } }

  // whirlwind skill
  if (P.spin > 0) {
    P.spin -= dt;
    const pow = (1 + (P.perks.skill || 0) * 0.3) * (1 + P.level * 0.06);
    if (Math.random() < dt * 14) {
      FX.slash(P.x, P.y, G.time * 22, 80, 2.4, 'rgba(255,122,154,0.7)', 0.18, 1);
      for (let i = 0; i < 2; i++) Particles.add({ x: P.x + R.range(-60, 60), y: P.y + R.range(-60, 60), vx: R.range(-40, 40), vy: R.range(-40, 40), life: 0.8, max: 0.8, size: 4, col: '#ffb3c8', drag: 1, glow: true });
    }
    for (const z of G.zgrid.query(P.x, P.y, 90)) if (!z.dead && dist(P.x, P.y, z.x, z.y) < 85 + z.r && (z.spinHit || 0) < G.time) {
      z.spinHit = G.time + 0.18; const a = Math.atan2(z.y - P.y, z.x - P.x);
      G.hitEnemy(z, 32 * pow, Math.cos(a) * 200, Math.sin(a) * 200, 'skill', a, P.equip.melee ? Loot.stats(P.equip.melee) : null);
    }
    if (Math.random() < dt * 6) Sound.play('sfx_sword', 0.35, R.range(1, 1.3));
  }

  // weapon select
  SLOT_ORDER.forEach((s, i) => { if (Input.hit('Digit' + (i + 1))) G.switchWeapon(s); });
  if (Input.wheel) {
    const owned = SLOT_ORDER.filter(s => s === 'melee' || P.equip[s]);
    let i = owned.indexOf(P.weapon);
    i = (i + (Input.wheel > 0 ? 1 : -1) + owned.length) % owned.length;
    G.switchWeapon(owned[i]);
  }
  const w = P.wdef;
  P.cool -= dt;
  const ammoId = AMMO_OF[P.weapon];
  if (P.reloading > 0) {
    P.reloading -= dt;
    if (P.reloading <= 0) {
      const need = w.mag - P.mags[P.weapon];
      const n = Math.min(need, P.inv[ammoId] || 0);
      P.mags[P.weapon] += n; G.take(ammoId, n);
      Sound.play('sfx_click', 0.5, 1.4);
    }
  }
  const startReload = () => {
    if (w.melee || P.reloading > 0 || P.mags[P.weapon] >= w.mag) return;
    if (!G.has(ammoId)) { G.toast(`Hết ${RL.ammoNames[['r1', 'r2', 'r3'].indexOf(P.weapon)]}! Chế tạo bằng [C] hoặc dùng cận chiến [1].`, 'warn'); return; }
    P.reloading = w.reload * Math.pow(0.8, P.perks.reload || 0);
    Sound.play('sfx_reload', 0.6);
  };
  if (Input.hit('KeyR')) startReload();
  const busy = UI.pointerOverUI;
  if (P.spin <= 0) {
    if (w.melee) { if (Input.mouse.down && !busy && P.cool <= 0) meleeAttack(w); }
    else if (Input.mouse.down && !busy && P.cool <= 0 && P.reloading <= 0) {
      if (P.mags[P.weapon] <= 0) {
        if (G.has(ammoId)) startReload();
        else { P.cool = 0.35; Sound.play('sfx_empty', 0.5); if (!P.emptyWarn || G.time - P.emptyWarn > 3) { P.emptyWarn = G.time; G.toast('Hết đạn! Chuyển sang cận chiến [1] hoặc chế tạo [C].', 'warn'); } }
      } else fireGun(w);
    }
  }
  if (Input.mouse.rclicked && P.cool <= 0) meleeAttack(w.melee ? w : (P.equip.melee ? Loot.stats(P.equip.melee) : FISTS), true);

  if (Input.hit('KeyQ')) G.castSkill();
  if (Input.hit('KeyH')) useHeal();
  if (Input.hit('KeyF')) useFood();
  if (Input.hit('KeyL')) { P.flash = !P.flash; Sound.play('sfx_click', 0.5, 1.6); }
  if (Input.hit('KeyG')) throwIt(G.has('grenade') ? 'grenade' : 'molotov');
  if (Input.hit('KeyB')) G.place('barricade');
  if (Input.hit('KeyT')) G.place('trap');
  if (Input.hit('KeyU')) G.useScroll();
}

function relicTick(dt) {
  const P = G.player;
  const th = P.relic('thorns');
  if (th && G.frame % 6 === 0) for (const z of G.zgrid.query(P.x, P.y, 70)) if (!z.dead && dist(P.x, P.y, z.x, z.y) < 70) { G.hitEnemy(z, th * 0.1 * (1 + P.level * 0.04), 0, 0, 'fire'); z.burn = Math.max(z.burn, 1); }
  const tn = P.relic('thunder');
  if (tn) {
    P.thunderT = (P.thunderT || 0) - dt;
    if (P.thunderT <= 0) {
      P.thunderT = 2;
      const zs = G.zgrid.query(P.x, P.y, 320).filter(z => !z.dead);
      if (zs.length) { const z = R.pick(zs); FX.bolt(z.x, z.y - 220, z.x, z.y, '#fff36b'); G.hitEnemy(z, tn * (1 + P.level * 0.05), 0, 0, 'shock'); Sound.at('sfx_electric', z.x, z.y, 0.35); G.flashes.push({ x: z.x, y: z.y, r: 120, life: 0.15, max: 0.15 }); }
    }
  }
  const orb = Math.floor(P.relic('orbit'));
  if (orb && !P.car) for (let i = 0; i < orb; i++) {
    const oa = G.time * 3 + i / orb * TAU, ox = P.x + Math.cos(oa) * 46, oy = P.y + Math.sin(oa) * 46;
    for (const z of G.zgrid.query(ox, oy, 24)) if (!z.dead && dist(ox, oy, z.x, z.y) < z.r + 9 && (z.orbHit || 0) < G.time) { z.orbHit = G.time + 0.35; G.hitEnemy(z, 18 * (1 + P.level * 0.06), Math.cos(oa) * 80, Math.sin(oa) * 80, 'skill', oa); }
  }
}

function fireGun(w) {
  const P = G.player;
  if (!(P.perks.thrift && Math.random() < 0.2 * P.perks.thrift)) P.mags[P.weapon]--;
  P.cool = w.rate; P.muzzleT = 0.05; P.recoil = 1;
  const mp = P.muzzlePos();
  const dmg = w.dmg * (1 + (P.perks.gun || 0) * 0.15);
  const n = (w.pellets || 1) + (w.extra || 0);
  const moving = Math.hypot(P.vx, P.vy) > 30 ? 1.5 : 1;
  for (let i = 0; i < n; i++) {
    let a = P.angle + R.range(-w.spread, w.spread) * moving;
    if (!w.pellets && w.extra) a = P.angle + (i - (n - 1) / 2) * 0.12;
    Bullets.fire(mp.x, mp.y, a, w, dmg, { pierceBonus: P.perks.pierce || 0 });
  }
  if (w.proj === 'bullet') Particles.shell(P.x, P.y, P.angle);
  Particles.smoke(mp.x, mp.y, 1, 'rgba(160,160,160,');
  Sound.play(w.sfx, w.sfx === 'sfx_rifle' ? 0.42 : 0.55, R.range(0.94, 1.06));
  G.shake(w.shake);
  G.noise(P.x, P.y, w.noise);
  P.kx -= Math.cos(P.angle) * w.shake * 6; P.ky -= Math.sin(P.angle) * w.shake * 6;
  if (P.mags[P.weapon] === 0 && G.has(AMMO_OF[P.weapon])) { P.reloading = w.reload * Math.pow(0.8, P.perks.reload || 0); Sound.play('sfx_reload', 0.6); }
  UI.dirty = true;
}

function meleeAttack(w, shove) {
  const P = G.player;
  P.cool = w.rate * (shove ? 1.4 : 1); P.swingT = 0.2; P.swingDir *= -1;
  const tired = P.stamina < w.stam;
  P.stamina = Math.max(0, P.stamina - w.stam); P.stamDelay = 0.6;
  Sound.play(w.sfx || RL.weapons.melee.sfx || 'sfx_swing', 0.45, R.range(0.9, 1.2));
  const dmg = w.dmg * (1 + (P.perks.melee || 0) * 0.3) * (tired ? 0.55 : 1) * (shove ? 0.6 : 1);
  const trail = (w.affixes && w.affixes.length ? AFFIXES[w.affixes[0]].color : w.trail) || '#e8e0c8';
  const M = w.mt || {};
  P.comboN = ((P.comboN || 0) + 1) % 3;
  if (M.thrust) {
    FX.slash(P.x, P.y, P.angle, w.range + 10, 0.32, trail, 0.12, P.swingDir);
    for (let k = 0; k < 6; k++) Particles.add({ x: P.x + Math.cos(P.angle) * (20 + k * w.range / 6), y: P.y + Math.sin(P.angle) * (20 + k * w.range / 6), vx: Math.cos(P.angle) * 60, vy: Math.sin(P.angle) * 60, life: 0.18, max: 0.18, size: 2.5, col: trail, drag: 4, glow: true });
  } else if (M.id === 'scythe') {
    FX.slash(P.x, P.y, P.angle, w.range + 8, Math.min(TAU, w.arc), trail, 0.22, P.swingDir);
    FX.ring(P.x, P.y, w.range * 0.5, w.range + 6, trail, 0.2, 3);
  } else FX.slash(P.x, P.y, P.angle, w.range + 8, w.arc, trail, M.id === 'hammer' || M.id === 'great' ? 0.22 : 0.16, P.swingDir);
  // lunge forward a little
  const lunge = M.id === 'dagger' || M.id === 'fist' ? 170 : M.id === 'spear' ? 200 : M.id === 'hammer' ? 60 : 120;
  P.kx += Math.cos(P.angle) * lunge; P.ky += Math.sin(P.angle) * lunge;
  let hits = 0;
  for (const z of G.zgrid.query(P.x, P.y, w.range + 40)) {
    if (z.dead) continue;
    const d = dist(P.x, P.y, z.x, z.y);
    if (d > w.range + z.r) continue;
    const a = Math.atan2(z.y - P.y, z.x - P.x);
    if (Math.abs(angDiff(P.angle, a)) > w.arc / 2 && d > z.r + 8) continue;
    G.hitEnemy(z, dmg, Math.cos(a) * w.knock * (shove ? 1.5 : 1), Math.sin(a) * w.knock * (shove ? 1.5 : 1), 'melee', a, w);
    if (w.knock > 150 || shove) z.stun = 0.25;
    if (M.bleed && !z.dead) { z.poison += dmg * 0.3; Particles.blood(z.x, z.y, a, 4, 120); }
    if (M.stun && Math.random() < M.stun && !z.boss) { z.stun = 0.7; Floaters.add(z.x, z.y - z.r - 8, 'CHOÁNG', '#fff36b', 8); }
    if (M.leech) P.hp = Math.min(P.maxHp, P.hp + dmg * 0.025);
    hits++;
  }
  if (M.slam && !shove) {
    const sx = P.x + Math.cos(P.angle) * w.range * 0.75, sy = P.y + Math.sin(P.angle) * w.range * 0.75;
    FX.ring(sx, sy, 10, 100, '#ffd08a', 0.35, 8); Particles.debris(sx, sy, 14); Particles.dust(sx, sy, 8);
    World.addDecal('scorch', sx, sy, R.range(0, TAU), 0.7, 0.5);
    G.shake(7); Sound.play('sfx_explosion', 0.35, 1.4);
    for (const z of G.zgrid.query(sx, sy, 100)) { if (z.dead) continue; const d = dist(sx, sy, z.x, z.y); if (d < 95 + z.r) { const a = Math.atan2(z.y - sy, z.x - sx); G.hitEnemy(z, dmg * 0.55, Math.cos(a) * 260, Math.sin(a) * 260, 'melee', a, null); if (!z.boss) z.stun = 0.6; } }
  }
  if (M.combo && P.comboN === 2 && !shove && !w.wave) Bullets.fire(P.x + Math.cos(P.angle) * 20, P.y + Math.sin(P.angle) * 20, P.angle, { speed: 560, knock: 120, affixes: w.affixes }, dmg * 0.8, { proj: 'wave', col: trail, life: 0.45, speed: 560, src: 'melee' });
  if (w.wave && !shove) {
    Bullets.fire(P.x + Math.cos(P.angle) * 20, P.y + Math.sin(P.angle) * 20, P.angle, { speed: 520, knock: 100, affixes: w.affixes }, dmg * 0.7, { proj: 'wave', col: trail, life: 0.5, speed: 520, src: 'melee' });
  }
  if (hits) { Sound.play(RL.id === 'md' ? 'sfx_hit' : 'sfx_blade_hit', 0.55, R.range(0.9, 1.15)); G.shake(2.5 + hits * 0.5); G.hitstop = 0.04; }
}

function useHeal(want) {
  const P = G.player;
  if (P.hp >= P.maxHp) { G.toast('Máu đang đầy.', 'info'); return; }
  const miss = P.maxHp - P.hp;
  let id = want && G.has(want) ? want : null;
  if (id) {}
  else if (miss >= 45 && G.has('medkit')) id = 'medkit';
  else if (G.has('bandage')) id = 'bandage';
  else if (G.has('medkit')) id = 'medkit';
  else if (G.has('pills')) id = 'pills';
  if (!id) { G.toast('Không có đồ y tế!', 'warn'); return; }
  G.take(id);
  const amt = { medkit: 65, bandage: 22, pills: 12 }[id] * (1 + P.level * 0.03);
  P.hp = Math.min(P.maxHp, P.hp + amt);
  if (id === 'pills') P.pillsT = 30;
  Floaters.add(P.x, P.y - 24, '+' + Math.round(amt) + ' HP', '#6dff7a', 11);
  FX.ring(P.x, P.y, 8, 40, '#6dff7a', 0.4, 3);
  Sound.play('sfx_heal', 0.6);
}
function useFood(want) {
  const P = G.player;
  const drink = P.thirst <= P.hunger;
  const order = drink ? ['water', 'energy', 'food', 'choco'] : ['food', 'choco', 'water', 'energy'];
  const id = want && G.has(want) ? want : order.find(i => G.has(i));
  if (!id) { G.toast('Không có đồ ăn/uống!', 'warn'); return; }
  G.take(id);
  if (id === 'water') P.thirst = Math.min(100, P.thirst + 50);
  if (id === 'energy') { P.thirst = Math.min(100, P.thirst + 20); P.energyT = 25; P.stamina = P.maxStam; }
  if (id === 'food') P.hunger = Math.min(100, P.hunger + 45);
  if (id === 'choco') { P.hunger = Math.min(100, P.hunger + 18); P.stamina = P.maxStam; }
  Sound.play(id === 'water' || id === 'energy' ? 'sfx_drink' : 'sfx_eat', 0.6);
  Floaters.add(P.x, P.y - 24, itm(id).name, '#ffd27a', 9);
}
function throwIt(kind) {
  const P = G.player;
  if (!G.has(kind)) { G.toast('Không có lựu đạn hay bom xăng. Chế tạo bằng [C].', 'warn'); return; }
  if (P.cool > 0 || P.car) return;
  G.take(kind);
  P.cool = 0.35; P.swingT = 0.2;
  Throws.throwItem(kind, P.x, P.y, Input.mouse.wx, Input.mouse.wy);
}

// ---------- main update ----------
G.update = function (dt) {
  if (this.slowmo > 0) { this.slowmo -= dt; dt *= 0.35; }
  if (this.hitstop > 0) { this.hitstop -= dt; dt *= 0.15; }
  this.time += dt;
  const P = this.player;
  this.timeSlow -= dt;
  this.comboT -= dt; if (this.comboT <= 0) this.combo = 0;
  this.timeTick(dt);
  World.update(P.x, P.y);
  this.processPending();
  this.zgrid.clear();
  for (const z of this.zombies) if (!z.dead) this.zgrid.insert(z);
  if (this.state === 'playing') {
    updatePlayer(dt);
    this.interactTarget = this.findInteract();
    if (Input.hit('KeyE')) this.interact(this.interactTarget);
    this.actionTick(dt);
  }
  this.flowT -= dt;
  if (this.flowT <= 0) { this.flowT = 0.3; this.computeFlow(); }
  for (const z of this.zombies) z.update(dt);
  for (let i = this.zombies.length - 1; i >= 0; i--) {
    const z = this.zombies[i];
    if (z.dead) { if (z.dying > 0.45) this.zombies.splice(i, 1); continue; }
    const d = this.nearestPlayerDist ? this.nearestPlayerDist(z.x, z.y) : dist(z.x, z.y, P.x, P.y);
    if (World.mode === 'over' && ((d > 1500 && !z.guard) || (d > 2400 && !z.story))) { if (z === this.boss) { this.boss = null; UI.boss(null); } this.zombies.splice(i, 1); }
  }
  for (const a of this.allies) a.update(dt);
  // drop civilians / merchants left far behind (they respawn with their area)
  this.allies = this.allies.filter(a => !a.dead && !((a.kind === 'civ' || a.kind === 'merchant') && World.mode === 'over' && (this.nearestPlayerDist ? this.nearestPlayerDist(a.x, a.y) : dist(a.x, a.y, P.x, P.y)) > 3600));
  this.updateHazards(dt);
  if (this.frame % 20 === 0) this.biomeTick();
  this.v4Tick(dt);
  this.v5Tick(dt);
  if (this.boss && (this.boss.dead || dist(this.boss.x, this.boss.y, P.x, P.y) > 900)) UI.boss(null); else if (this.boss) UI.boss(this.boss);
  this.spawnTick(dt);
  Bullets.update(dt);
  Throws.update(dt);
  Particles.update(dt);
  Items.update(dt);
  Floaters.update(dt);
  FX.update(dt);
  for (let i = this.flashes.length - 1; i >= 0; i--) { this.flashes[i].life -= dt; if (this.flashes[i].life <= 0) this.flashes.splice(i, 1); }
  if (this.frame % 5 === 0) for (const l of World.lights) if (l.kind === 'firebarrel' || l.kind === 'campfire' || l.kind === 'torch') if (dist(l.x, l.y, P.x, P.y) < 600) Particles.fire(l.x, l.y - 4, 1);
  Story.tick();
  if (this.frame % 15 === 0) {
    const sx = Math.floor(P.x / SBPX), sy = Math.floor(P.y / SBPX);
    for (let y = sy - 1; y <= sy + 1; y++) for (let x = sx - 1; x <= sx + 1; x++) World.explored.add(World.mode + nkey(x, y));
    if (World.explored.size > 6000) World.explored = new Set([...World.explored].slice(-4000));
    if (World.mode === 'over' && Math.hypot(P.x, P.y) > 32000) this.achieve('far');
  }
  this.saveT -= dt;
  if (this.saveT <= 0 && World.mode === 'over') { this.saveT = 45; this.save(); }
  // music
  let chasing = 0;
  for (const z of this.zombies) if (!z.dead && z.state === 'chase' && dist(z.x, z.y, P.x, P.y) < 500) chasing++;
  const intense = chasing >= 5 || (this.boss && !this.boss.dead && dist(this.boss.x, this.boss.y, P.x, P.y) < 800);
  if (!UI.dialogOpen) Sound.setMusic(P.dead ? null : intense ? RL.music.combat : World.mode === 'dungeon' ? RL.music.dungeon : this.night ? RL.music.night : RL.music.explore);
  Sound.loop('amb_wind', World.mode === 'dungeon' ? 0.12 : 0.2);
  Sound.loop('amb_rain', this.rain * 0.45);
  Sound.loop('sfx_heartbeat', P.hp < P.maxHp * 0.3 && !P.dead ? 0.6 : 0);
  // camera
  const tgt = P.car || P;
  let lx, ly;
  if (P.car) { lx = Math.cos(P.car.angle) * P.car.speed * 0.45; ly = Math.sin(P.car.angle) * P.car.speed * 0.45; }
  else { lx = (Input.mouse.x - VW / 2) * 0.16; ly = (Input.mouse.y - VH / 2) * 0.16; }
  this.camera.x = lerp(this.camera.x, tgt.x + lx, Math.min(1, dt * 6));
  this.camera.y = lerp(this.camera.y, tgt.y + ly, Math.min(1, dt * 6));
  this.shakeAmt = Math.max(0, this.shakeAmt - dt * 30);
  if (this.lvlQueue > 0 && this.state === 'playing' && !P.dead && !UI.dialogOpen) UI.levelUp();
};

// ---------- rendering ----------
G.render = function () {
  const P = this.player;
  const Z = this.zoom;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#07080b'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const sx = (Math.random() - 0.5) * this.shakeAmt * 2, sy = (Math.random() - 0.5) * this.shakeAmt * 2;
  const camX = this.camera.x + sx, camY = this.camera.y + sy;
  ctx.setTransform(Z, 0, 0, Z, Math.round(canvas.width / 2 - camX * Z), Math.round(canvas.height / 2 - camY * Z));
  ctx.imageSmoothingEnabled = false;
  const hw = canvas.width / 2 / Z, hh = canvas.height / 2 / Z;
  const vx0 = camX - hw, vy0 = camY - hh, vx1 = camX + hw, vy1 = camY + hh;
  this.view = { x0: vx0, y0: vy0, x1: vx1, y1: vy1 };
  const cx0 = Math.floor(vx0 / CHPX), cx1 = Math.floor(vx1 / CHPX), cy0 = Math.floor(vy0 / CHPX), cy1 = Math.floor(vy1 / CHPX);
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
    if (!World.sbs.has(nkey(Math.floor(cx / 4), Math.floor(cy / 4)))) continue;
    ctx.drawImage(World.getChunk(cx, cy), cx * CHPX, cy * CHPX, CHPX, CHPX);
  }
  // buildings in view
  const pb = P.car ? null : World.bldAt(P.x, P.y);
  const vis = [];
  for (const sb of World.sbs.values()) {
    const bx = sb.tx0 * TILE, by = sb.ty0 * TILE;
    if (bx > vx1 || by > vy1 || bx + SBPX < vx0 || by + SBPX < vy0) continue;
    for (const b of sb.buildings) {
      const x = b.x0 * TILE, y = b.y0 * TILE, w = (b.x1 - b.x0 + 1) * TILE, h = (b.y1 - b.y0 + 1) * TILE;
      if (x > vx1 + 20 || y > vy1 + 20 || x + w < vx0 - 20 || y + h < vy0 - 20) continue;
      b.roofAlpha = lerp(b.roofAlpha, pb === b ? 0 : 1, Math.min(1, this.rdt * 8));
      vis.push([b, x, y, w, h]);
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  for (const [b, x, y, w, h] of vis) { ctx.globalAlpha = b.roofAlpha; ctx.fillRect(x + 10, y + 12, w, h); }
  ctx.globalAlpha = 1;
  const props = World.propsNear((vx0 + vx1) / 2, (vy0 + vy1) / 2, Math.max(hw, hh) + 120, this._pv || (this._pv = []));
  const canopies = [];
  props.sort((a, b) => a.layer - b.layer);
  for (const p of props) { if (p.dead) continue; if (p.canopy) { canopies.push(p); continue; } drawProp(p); }
  Throws.draw(ctx);
  drawHazards(ctx);
  Items.draw(ctx);
  for (const c of this.cars) c.draw(ctx);
  for (const z of this.zombies) if (z.x > vx0 - 100 && z.x < vx1 + 100 && z.y > vy0 - 100 && z.y < vy1 + 100) z.draw(ctx);
  for (const a of this.allies) a.draw(ctx);
  FX.draw(ctx);
  P.draw(ctx);
  drawPet(ctx);
  if (typeof drawRemotes === 'function') { drawRemotes(ctx); drawSelfSay(ctx); }
  Bullets.draw(ctx);
  Particles.draw(ctx);
  drawMeteors(ctx);
  for (const p of canopies) {
    const under = dist(p.x, p.y, P.x, P.y) < p.w * 0.45;
    p.alpha = lerp(p.alpha, under ? 0.35 : 1, Math.min(1, this.rdt * 6));
    ctx.globalAlpha = 0.25 * p.alpha; drawPropImg(p, 8, 10, true);
    ctx.globalAlpha = p.alpha; drawPropImg(p, 0, 0);
    ctx.globalAlpha = 1;
  }
  for (const [b, x, y, w, h] of vis) drawRoof(b, x, y, w, h);
  drawObjective();
  Floaters.draw(ctx);
  // colored light glows
  ctx.globalCompositeOperation = 'lighter';
  for (const l of World.lights) {
    if (l.x < vx0 - 200 || l.x > vx1 + 200 || l.y < vy0 - 200 || l.y > vy1 + 200) continue;
    const g = GLOW[l.lightCol || (l.kind === 'firebarrel' ? 'fire' : '')]; if (!g) continue;
    const r = l.light * (l.lightCol === 'fire' ? 0.85 + Math.random() * 0.1 : 1);
    ctx.globalAlpha = 0.22; ctx.drawImage(g, l.x - r, l.y - r, r * 2, r * 2);
  }
  for (const f of Throws.fires) { const r = f.r * 1.6; ctx.globalAlpha = 0.25 * Math.min(1, f.life); ctx.drawImage(GLOW.fire, f.x - r, f.y - r, r * 2, r * 2); }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  drawLighting(camX, camY);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawBiomeTint();
  drawEventTint();
  if (this.timeSlow > 0) { ctx.fillStyle = 'rgba(40,220,255,0.08)'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  Ambient.update(this.rdt, canvas.width, canvas.height);
  Ambient.draw(ctx);
  drawWeather();
  drawScreenUI();
};

function drawPropImg(p, ox, oy, shadow) {
  const im = shadow ? G.whiteOf(p.img, '#000') : IMG[p.img]; if (!im) return;
  ctx.save(); ctx.translate(p.x + ox, p.y + oy); ctx.rotate(p.rot);
  ctx.drawImage(im, -p.w / 2, -p.h / 2, p.w, p.h);
  ctx.restore();
}
function drawProp(p) {
  const v = G.view;
  if (p.x + p.w < v.x0 || p.x - p.w > v.x1 || p.y + p.h < v.y0 || p.y - p.h > v.y1) return;
  if (!IMG[p.img]) return;
  if (p.kind === 'gate' || p.kind === 'exit') { // spinning portal
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(G.time * 1.2);
    const s = 1 + Math.sin(G.time * 3) * 0.04;
    ctx.drawImage(IMG[p.img], -p.w / 2 * s, -p.h / 2 * s, p.w * s, p.h * s); ctx.restore();
    if (p.data) {
      ctx.font = '12px VT323, monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = '#000'; ctx.fillText(`CỔNG HẠNG ${p.data.rank}`, p.x + 1, p.y - p.h / 2 - 5);
      ctx.fillStyle = RANK_COLOR[p.data.rank]; ctx.fillText(`CỔNG HẠNG ${p.data.rank}`, p.x, p.y - p.h / 2 - 6);
    }
    return;
  }
  if (p.container === 'chest' && !p.looted) drawChestAura(p);
  if (p.solid && p.layer > 0) { ctx.globalAlpha = 0.28; drawPropImg(p, 4, 5, true); ctx.globalAlpha = 1; }
  drawPropImg(p, 0, 0);
  if (p.container === 'chest') { if (!p.looted && dist(p.x, p.y, G.player.x, G.player.y) < 220) { const C = CHESTS[p.data.tier]; ctx.font = '9px VT323, monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText(C.name, p.x + 1, p.y - p.h / 2 - 5); ctx.fillStyle = C.col; ctx.fillText(C.name, p.x, p.y - p.h / 2 - 6); } return; }
  if (p.container && !p.looted) {
    const special = ['artifact', 'vault', 'dchest', 'boss'].includes(p.container);
    if (dist(p.x, p.y, G.player.x, G.player.y) < 160 || special) {
      ctx.globalAlpha = 0.18 + Math.sin(G.time * 5) * 0.12;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.drawImage(G.whiteOf(p.img, special ? '#ffd65a' : '#ffe9a0'), -p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore(); ctx.globalAlpha = 1;
    }
    if (p.container === 'artifact') { ctx.fillStyle = `rgba(255,214,90,${0.6 + Math.sin(G.time * 4) * 0.3})`; ctx.font = '10px VT323, monospace'; ctx.textAlign = 'center'; ctx.fillText('▼ ' + Story.names.artifact, p.x, p.y - 22 + Math.sin(G.time * 3) * 2); }
  } else if (p.container && p.looted && !p.drivable) { ctx.globalAlpha = 0.25; drawPropImg(p, 0, 0, true); ctx.globalAlpha = 1; }
  if (p.kind === 'cage') { ctx.fillStyle = `rgba(255,140,190,${0.6 + Math.sin(G.time * 4) * 0.3})`; ctx.font = '10px VT323, monospace'; ctx.textAlign = 'center'; ctx.fillText('♥ ' + Story.names.companion, p.x, p.y - 30); }
  if (p.drivable && dist(p.x, p.y, G.player.x, G.player.y) < 200) { ctx.fillStyle = `rgba(120,200,255,${0.6 + Math.sin(G.time * 4) * 0.3})`; ctx.font = '9px VT323, monospace'; ctx.textAlign = 'center'; ctx.fillText('🔑 XE CHẠY ĐƯỢC', p.x, p.y - p.h / 2 - 6); }
  if (p.kind === 'barricade') { ctx.fillStyle = '#000'; ctx.fillRect(p.x - 12, p.y - 16, 24, 3); ctx.fillStyle = '#c8a050'; ctx.fillRect(p.x - 12, p.y - 16, 24 * p.hp / (160 + G.player.level * 10), 3); }
}
const ROOF_PATS = {};
function drawRoof(b, x, y, w, h) {
  if (b.roofAlpha < 0.02) { drawDoors(b); return; }
  ctx.globalAlpha = b.roofAlpha;
  if (!ROOF_PATS[b.roof]) { ROOF_PATS[b.roof] = ctx.createPattern(IMG[b.roof] || IMG.tex_roof, 'repeat'); ROOF_PATS[b.roof].setTransform(new DOMMatrix().scale(0.5)); }
  ctx.fillStyle = ROOF_PATS[b.roof];
  ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  const tints = ['rgba(90,60,30,0.18)', 'rgba(30,50,70,0.18)', 'rgba(60,70,40,0.16)', 'rgba(0,0,0,0.15)', 'rgba(120,100,80,0.12)', 'rgba(0,0,0,0)'];
  ctx.fillStyle = tints[b.seed % tints.length]; ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 4; ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);
  ctx.strokeStyle = RL.id === 'cy' ? 'rgba(255,79,216,0.5)' : 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
  if (b.roof !== RL.roofs[0] || RL.style === 'ancient' || RL.style === 'sect') { ctx.fillStyle = 'rgba(0,0,0,0.25)'; if (w > h) ctx.fillRect(x, y + h / 2 - 2, w, 4); else ctx.fillRect(x + w / 2 - 2, y, 4, h); }
  const rnd = mulberry32(b.seed);
  const n = Math.floor(w * h / 9000) + 1;
  if (RL.style === 'modern' || RL.style === 'cyber') for (let i = 0; i < n; i++) {
    const ux = x + 12 + rnd() * (w - 44), uy = y + 12 + rnd() * (h - 36);
    if (rnd() < 0.6) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(ux + 3, uy + 3, 22, 16); ctx.fillStyle = RL.id === 'cy' ? '#3a3f55' : '#8d9196'; ctx.fillRect(ux, uy, 22, 16); ctx.fillStyle = RL.id === 'cy' ? '#3cf0ff' : '#5d6166'; for (let k = 0; k < 4; k++) ctx.fillRect(ux + 3 + k * 5, uy + 3, 3, 10); }
    else { ctx.fillStyle = '#4a4d52'; ctx.beginPath(); ctx.arc(ux + 6, uy + 6, 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a2c30'; ctx.beginPath(); ctx.arc(ux + 6, uy + 6, 3, 0, TAU); ctx.fill(); }
  }
  if (b.name && b.roofAlpha > 0.5 && w > 160 && G.player && dist(G.player.x, G.player.y, x + w / 2, y + h / 2) < 420) {
    ctx.font = '14px VT323, monospace'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillText(b.name, x + w / 2 + 1, y + h / 2 + 5);
    ctx.fillStyle = 'rgba(255,240,210,0.75)'; ctx.fillText(b.name, x + w / 2, y + h / 2 + 4);
  }
  ctx.globalAlpha = 1;
  drawDoors(b);
}
function drawObjective() {
  const list = World.mode === 'over' ? Story.targets() : G.dungeonTargets();
  G.curTargets = list;
  for (const t of list) {
    const v = G.view;
    if (t.x > v.x0 && t.x < v.x1 && t.y > v.y0 && t.y < v.y1) {
      const by = Math.sin(G.time * 4) * 4;
      ctx.fillStyle = '#ffcf3a';
      ctx.beginPath(); ctx.moveTo(t.x, t.y - 30 + by); ctx.lineTo(t.x - 7, t.y - 44 + by); ctx.lineTo(t.x + 7, t.y - 44 + by); ctx.fill();
    }
  }
}

function drawLighting(camX, camY) {
  const P = G.player;
  let dark = G.darkness();
  const inside = !P.car && World.bldAt(P.x, P.y);
  if (inside) dark = Math.max(dark, 0.45);
  dark = Math.max(0, dark - G.lightning * 0.8);
  if (dark < 0.02) return;
  const L = lctx, Z = G.zoom / 3;
  const W3 = lightC.width, H3 = lightC.height;
  const toS = (x, y) => [(x - camX) * Z + W3 / 2, (y - camY) * Z + H3 / 2];
  L.globalCompositeOperation = 'source-over';
  L.clearRect(0, 0, W3, H3);
  const t = World.mode === 'dungeon' ? [3, 3, 8] : RL.nightTint;
  L.fillStyle = `rgba(${t[0]},${t[1]},${t[2]},${dark})`;
  L.fillRect(0, 0, W3, H3);
  L.globalCompositeOperation = 'destination-out';
  const glow = (x, y, r, a = 1) => {
    const [sx, sy] = toS(x, y); const rr = r * Z;
    if (sx < -rr || sy < -rr || sx > W3 + rr || sy > H3 + rr) return;
    L.globalAlpha = a; L.drawImage(GLOW.cut, sx - rr, sy - rr, rr * 2, rr * 2);
  };
  const cone = (x, y, ang, r, half, a = 1) => {
    const [sx, sy] = toS(x, y); const rr = r * Z;
    L.save(); L.beginPath(); L.moveTo(sx, sy);
    const myB = World.bldAt(x, y);
    const N = 40;
    for (let i = 0; i <= N; i++) {
      const aa = ang - half + 2 * half * i / N, ca = Math.cos(aa), sa = Math.sin(aa);
      let d = 0;
      while (d < r) {
        d += 9;
        const wx = x + ca * d, wy = y + sa * d;
        if (World.get(Math.floor(wx / TILE), Math.floor(wy / TILE)) === T.WALL) { const b = World.bldAt(wx, wy); if (!b || b === myB) { d += 8; break; } }
      }
      d = Math.min(d, r);
      const [px, py] = toS(x + ca * d, y + sa * d); L.lineTo(px, py);
    }
    L.closePath(); L.clip();
    L.globalAlpha = a; L.drawImage(GLOW.cut, sx - rr, sy - rr, rr * 2, rr * 2); L.drawImage(GLOW.cut, sx - rr * 0.6, sy - rr * 0.6, rr * 1.2, rr * 1.2);
    L.restore();
  };
  const tgt = P.car || P;
  glow(tgt.x, tgt.y, P.car ? 130 : 120, 0.9);
  if (P.car) {
    const c = P.car;
    cone(c.x + Math.cos(c.angle) * c.len / 2, c.y + Math.sin(c.angle) * c.len / 2, c.angle, 440, 0.34, 1);
  } else if (P.flash) cone(P.x, P.y, P.angle, 370, 0.45, 1);
  if (P.muzzleT > 0) glow(P.x, P.y, 220, 0.9);
  for (const l of World.lights) if (!l.dead) glow(l.x, l.y, l.light * 1.4 * (l.lightCol === 'fire' ? 0.9 + Math.random() * 0.15 : 1), 0.95);
  for (const f of Throws.fires) glow(f.x, f.y, f.r * 2.4, Math.min(1, f.life));
  for (const f of G.flashes) glow(f.x, f.y, f.r, f.life / f.max);
  for (const a of G.allies) if (a.kind === 'comp') glow(a.x, a.y, 70, 0.5);
  for (const b of Bullets.list) if (b.proj !== 'bullet') glow(b.x, b.y, 50, 0.6);
  for (const z of G.zombies) if (z.burn > 0 || z.boss) glow(z.x, z.y, z.boss ? 90 : 50, 0.5);
  L.globalAlpha = 1;
  L.globalCompositeOperation = 'source-over';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(lightC, 0, 0, canvas.width, canvas.height);
  if (World.mode === 'over') {
    const h = G.clock;
    let tint = 0;
    if (h > 16.5 && h < 20.5) tint = Math.sin((h - 16.5) / 4 * Math.PI);
    if (h > 4.5 && h < 7.5) tint = Math.sin((h - 4.5) / 3 * Math.PI) * 0.8;
    if (tint > 0) { ctx.fillStyle = `rgba(255,110,40,${tint * 0.12})`; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  }
}

const rainDrops = [];
function drawWeather() {
  const W = canvas.width, H = canvas.height;
  if (G.rain > 0.02 && World.mode === 'over') {
    while (rainDrops.length < (G.lowGfx ? 140 : 280)) rainDrops.push({ x: Math.random() * W, y: Math.random() * H, s: R.range(0.7, 1.3) });
    ctx.strokeStyle = RL.id === 'cy' ? 'rgba(160,200,255,0.35)' : 'rgba(170,190,220,0.32)'; ctx.lineWidth = 1 * G.dpr;
    ctx.beginPath();
    const n = Math.floor(rainDrops.length * G.rain);
    for (let i = 0; i < n; i++) {
      const d = rainDrops[i];
      d.x -= 120 * G.rdt * d.s * G.dpr; d.y += 900 * G.rdt * d.s * G.dpr;
      if (d.y > H) { d.y = -20; d.x = Math.random() * (W + 200); }
      if (d.x < -20) d.x += W + 40;
      ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + 4 * G.dpr, d.y - 16 * d.s * G.dpr);
    }
    ctx.stroke();
    ctx.fillStyle = `rgba(20,30,45,${G.rain * 0.15})`; ctx.fillRect(0, 0, W, H);
  }
  if (G.lightning > 0) { ctx.fillStyle = `rgba(220,230,255,${G.lightning * 0.35})`; ctx.fillRect(0, 0, W, H); }
}

function drawScreenUI() {
  const P = G.player;
  const W = canvas.width, H = canvas.height, d = G.dpr;
  for (const t of G.curTargets || []) {
    const sx = (t.x - G.camera.x) * G.zoom + W / 2, sy = (t.y - G.camera.y) * G.zoom + H / 2;
    const m = 60 * d;
    if (sx > m && sx < W - m && sy > m && sy < H - m) continue;
    const a = Math.atan2(sy - H / 2, sx - W / 2);
    const k = Math.min((W / 2 - m) / Math.abs(Math.cos(a) || 1e-3), (H / 2 - m) / Math.abs(Math.sin(a) || 1e-3));
    const ax = W / 2 + Math.cos(a) * k, ay = H / 2 + Math.sin(a) * k;
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(a);
    ctx.fillStyle = '#ffcf3a'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2 * d;
    ctx.beginPath(); ctx.moveTo(16 * d, 0); ctx.lineTo(-8 * d, -11 * d); ctx.lineTo(-3 * d, 0); ctx.lineTo(-8 * d, 11 * d); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.font = `${15 * d}px VT323, monospace`; ctx.textAlign = 'center';
    const label = (t.label ? t.label + ' ' : '') + Math.round(dist(P.x, P.y, t.x, t.y) / TILE) + 'm';
    ctx.fillStyle = '#000'; ctx.fillText(label, ax - Math.cos(a) * 30 * d + d, ay - Math.sin(a) * 30 * d + 5 * d);
    ctx.fillStyle = '#ffcf3a'; ctx.fillText(label, ax - Math.cos(a) * 30 * d, ay - Math.sin(a) * 30 * d + 4 * d);
  }
  if (!P.car && !P.dead && G.state === 'playing') {
    const mx = Input.mouse.x * d, my = Input.mouse.y * d;
    const w = P.wdef;
    const spread = w.melee ? 6 : 6 + (w.spread || 0) * 120 * (Math.hypot(P.vx, P.vy) > 30 ? 1.5 : 1) + P.recoil * 6;
    const cross = () => {
      ctx.beginPath();
      ctx.moveTo(mx - spread * d - 6 * d, my); ctx.lineTo(mx - spread * d, my);
      ctx.moveTo(mx + spread * d + 6 * d, my); ctx.lineTo(mx + spread * d, my);
      ctx.moveTo(mx, my - spread * d - 6 * d); ctx.lineTo(mx, my - spread * d);
      ctx.moveTo(mx, my + spread * d + 6 * d); ctx.lineTo(mx, my + spread * d);
      ctx.stroke();
    };
    ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 4 * d; cross();
    ctx.strokeStyle = P.reloading > 0 ? '#ffb347' : '#f2f2f2'; ctx.lineWidth = 2 * d; cross();
    if (P.reloading > 0) {
      const k = 1 - P.reloading / (w.reload * Math.pow(0.8, P.perks.reload || 0));
      ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 3 * d;
      ctx.beginPath(); ctx.arc(mx, my, 18 * d, -Math.PI / 2, -Math.PI / 2 + k * TAU); ctx.stroke();
    }
  }
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  G.rdt = dt;
  G.frame++;
  if (G.state === 'playing' || (typeof Net !== 'undefined' && Net.active && G.player && ['paused', 'menu', 'dialog', 'levelup'].includes(G.state))) G.update(dt);
  if (G.player && ['playing', 'paused', 'menu', 'levelup', 'dead', 'dialog'].includes(G.state)) {
    if (G.state === 'dead' || G.state === 'dialog') { Particles.update(dt); FX.update(dt); }
    G.render();
    UI.update(dt);
  }
  Sound.update(dt);
  Input.endFrame();
  requestAnimationFrame(loop);
}

// ---------- input ----------
window.addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') return;
  if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (!Input.keys[e.code]) Input.pressed[e.code] = true;
  Input.keys[e.code] = true;
  Sound.unlock();
  UI.key(e.code);
});
window.addEventListener('keyup', e => { Input.keys[e.code] = false; });
window.addEventListener('blur', () => { Input.keys = {}; Input.mouse.down = false; if (G.state === 'playing') UI.pause(); });
window.addEventListener('mousemove', e => {
  if (Touch.on) return;
  Input.mouse.x = e.clientX; Input.mouse.y = e.clientY;
});
canvas.addEventListener('mousedown', e => {
  Sound.unlock();
  if (e.button === 0) { Input.mouse.down = true; Input.mouse.clicked = true; }
  if (e.button === 2) { Input.mouse.rdown = true; Input.mouse.rclicked = true; }
});
window.addEventListener('mouseup', e => { if (e.button === 0) Input.mouse.down = false; if (e.button === 2) Input.mouse.rdown = false; });
window.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('wheel', e => { Input.wheel = Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
