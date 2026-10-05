// ===== Entities =====

// ---------- ground items (consumables + gear) ----------
const Items = {
  list: [],
  drop(x, y, id, n) {
    const a = R.range(0, TAU), s = R.range(30, 90);
    this.list.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, id, n, t: R.range(0, 6), age: 0 });
  },
  dropGear(x, y, item) {
    const a = R.range(0, TAU), s = R.range(40, 110);
    this.list.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, gear: item, t: 0, age: 0 });
    if (item.rarity >= 3) FX.pillar(x, y, RARITY[item.rarity].color, 1.6, 30);
  },
  update(dt) {
    const P = G.player;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const it = this.list[i];
      it.t += dt; it.age += dt;
      it.x += it.vx * dt; it.y += it.vy * dt; it.vx *= 0.9; it.vy *= 0.9;
      if (it.age > 300) { this.list.splice(i, 1); continue; }
      if (P.car || P.dead) continue;
      const d = dist(it.x, it.y, P.x, P.y);
      const mag = it.gear ? 40 : 80;
      if (it.age > 0.5 && d < mag) { it.x += (P.x - it.x) * Math.min(1, dt * 8); it.y += (P.y - it.y) * Math.min(1, dt * 8); }
      if (it.age > 0.5 && d < 18) {
        if (it.gear) G.pickGear(it.gear); else G.give(it.id, it.n, true);
        this.list.splice(i, 1);
      }
    }
  },
  draw(ctx) {
    for (const it of this.list) {
      const v = G.view; if (it.x < v.x0 - 40 || it.x > v.x1 + 40 || it.y < v.y0 - 40 || it.y > v.y1 + 40) continue;
      const bob = Math.sin(it.t * 4) * 2;
      if (it.gear) {
        const col = RARITY[it.gear.rarity].color;
        if (it.gear.rarity >= 2) {
          ctx.globalCompositeOperation = 'lighter';
          const g = ctx.createLinearGradient(it.x, it.y - 90, it.x, it.y);
          g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, col);
          ctx.globalAlpha = 0.35 + Math.sin(it.t * 3) * 0.12; ctx.fillStyle = g; ctx.fillRect(it.x - 5, it.y - 90, 10, 92);
          ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        }
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(it.x, it.y + 6, 12, 5, 0, 0, TAU); ctx.stroke();
        const im = IMG[Loot.iconOf(it.gear)];
        if (im) { const s = 26 / Math.max(im.width, im.height); ctx.drawImage(im, it.x - im.width * s / 2, it.y - im.height * s / 2 + bob - 4, im.width * s, im.height * s); }
        continue;
      }
      const im = IMG[ITEMS[it.id] ? ITEMS[it.id].icon : 'i_scrap'];
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(it.x, it.y + 7, 8, 3, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(255,230,120,${0.15 + Math.sin(it.t * 5) * 0.08})`; ctx.beginPath(); ctx.arc(it.x, it.y + bob, 12, 0, TAU); ctx.fill();
      if (im) { const s = 20 / Math.max(im.width, im.height); ctx.drawImage(im, it.x - im.width * s / 2, it.y - im.height * s / 2 + bob, im.width * s, im.height * s); }
    }
  },
};

// ---------- projectiles ----------
const Bullets = {
  list: [],
  fire(x, y, ang, w, dmg, o = {}) {
    const sp = o.speed || w.speed || 900;
    this.list.push({
      x, y, px: x, py: y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, sp, dmg, life: o.life || w.range || 0.9,
      pierce: (w.pierce || 0) + (o.pierceBonus || 0), knock: w.knock || 50, hit: new Set(), ang, proj: o.proj || w.proj || 'bullet',
      col: o.col || w.color || '#ffe08a', aff: w.affixes || [], homing: o.homing ?? w.homing, bounce: (w.affixes || []).includes('bounce') ? 1 : 0,
      hostile: !!o.hostile, ally: !!o.ally, crit: w.crit || 0, spin: 0, size: o.size || 1, src: o.src || 'gun',
    });
  },
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const b = this.list[i];
      b.life -= dt; b.spin += dt * 14;
      b.px = b.x; b.py = b.y;
      if (b.homing && !b.hostile) {
        let best = null, bd = 260;
        for (const z of G.zgrid.query(b.x, b.y, 260)) { if (z.dead) continue; const d = dist(b.x, b.y, z.x, z.y); if (d < bd) { bd = d; best = z; } }
        if (best) {
          const ta = Math.atan2(best.y - b.y, best.x - b.x);
          const ca = Math.atan2(b.vy, b.vx);
          const na = ca + clamp(angDiff(ca, ta), -7 * dt, 7 * dt);
          b.vx = Math.cos(na) * b.sp; b.vy = Math.sin(na) * b.sp; b.ang = na;
        }
      }
      const steps = Math.ceil(b.sp * dt / 10);
      let dead = b.life <= 0;
      for (let s = 0; s < steps && !dead; s++) {
        const ox = b.x, oy = b.y;
        b.x += b.vx * dt / steps; b.y += b.vy * dt / steps;
        if (World.get(Math.floor(b.x / TILE), Math.floor(b.y / TILE)) === T.WALL) {
          if (b.bounce > 0) {
            b.bounce--;
            const hx = World.get(Math.floor(b.x / TILE), Math.floor(oy / TILE)) === T.WALL;
            if (hx) b.vx = -b.vx; else b.vy = -b.vy;
            b.x = ox; b.y = oy; b.ang = Math.atan2(b.vy, b.vx);
            Particles.sparks(b.x, b.y, b.ang, 3);
            continue;
          }
          if (b.proj !== 'wave') Particles.sparks(b.x, b.y, b.ang, 5, b.proj === 'bullet' ? null : [b.col, '#ffffff']);
          dead = true; break;
        }
        if (b.hostile) {
          for (const t of G.targets()) {
            if (dist(b.x, b.y, t.x, t.y) < (t.r || 11) + 4 * b.size) {
              if (t === G.player || t === G.player.car) G.hurtPlayer(b.dmg, null);
              else t.hurt(b.dmg);
              Particles.burst(b.x, b.y, 6, b.col, 120); dead = true; break;
            }
          }
          continue;
        }
        if (b.proj !== 'wave' && b.proj !== 'sword') {
          const near = World.propsNear(b.x, b.y, 40, Bullets._tmp || (Bullets._tmp = []));
          for (const p of near) {
            if (!p.bullet || p.dead) continue;
            for (const c of p.circles) {
              if ((b.x - c.x) ** 2 + (b.y - c.y) ** 2 < c.r * c.r) {
                dead = true; Particles.sparks(b.x, b.y, b.ang, 4);
                if (p.explosive) { p.hp = (p.hp || 30) - b.dmg; if (p.hp <= 0) G.explodeBarrel(p); }
                else if (p.kind === 'barricade') G.damageBarricade(p, b.dmg * 0.2);
                else if (p.drivable && R.chance(0.1)) G.carAlarm(p);
                break;
              }
            }
            if (dead) break;
          }
          if (dead) break;
        }
        const zs = G.zgrid.query(b.x, b.y, 50);
        for (const z of zs) {
          if (z.dead || b.hit.has(z)) continue;
          const rr = z.r + (b.proj === 'wave' ? 18 : 3) * b.size;
          if ((b.x - z.x) ** 2 + (b.y - z.y) ** 2 < rr * rr) {
            b.hit.add(z);
            G.hitEnemy(z, b.dmg, Math.cos(b.ang) * b.knock, Math.sin(b.ang) * b.knock, b.src, b.ang, b);
            if (b.proj === 'arrow') Sound.at('sfx_arrow_hit', z.x, z.y, 0.35);
            if (b.proj === 'wave' || b.proj === 'sword') continue;
            if (b.pierce-- <= 0) { dead = true; break; }
            b.dmg *= 0.75;
          }
        }
      }
      if (dead) { if (b.proj === 'orb' || b.proj === 'talisman') Particles.burst(b.x, b.y, 8, b.col, 140); this.list[i] = this.list[this.list.length - 1]; this.list.pop(); }
    }
  },
  draw(ctx) {
    ctx.lineCap = 'round';
    for (const b of this.list) {
      const a = Math.atan2(b.vy, b.vx);
      switch (b.proj) {
        case 'laser':
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = b.col; ctx.globalAlpha = 0.45; ctx.lineWidth = 6;
          ctx.beginPath(); ctx.moveTo(b.x - Math.cos(a) * 26, b.y - Math.sin(a) * 26); ctx.lineTo(b.x, b.y); ctx.stroke();
          ctx.globalAlpha = 1; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
          ctx.globalCompositeOperation = 'source-over';
          break;
        case 'arrow':
          ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(b.x - Math.cos(a) * 16, b.y - Math.sin(a) * 16); ctx.lineTo(b.x, b.y); ctx.stroke();
          ctx.fillStyle = b.col; ctx.beginPath(); ctx.moveTo(b.x + Math.cos(a) * 4, b.y + Math.sin(a) * 4); ctx.lineTo(b.x + Math.cos(a + 2.5) * 5, b.y + Math.sin(a + 2.5) * 5); ctx.lineTo(b.x + Math.cos(a - 2.5) * 5, b.y + Math.sin(a - 2.5) * 5); ctx.fill();
          ctx.fillStyle = '#e8e8e8'; ctx.fillRect(b.x - Math.cos(a) * 15 - 2, b.y - Math.sin(a) * 15 - 2, 4, 4);
          break;
        case 'talisman':
          ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.spin);
          ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,190,60,0.5)'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = '#ffd65a'; ctx.fillRect(-5, -8, 10, 16); ctx.fillStyle = '#c62828'; ctx.fillRect(-2, -5, 4, 10);
          ctx.restore();
          break;
        case 'orb': case 'eshot': {
          const r = (b.proj === 'eshot' ? 5 : 6) * b.size;
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = b.col; ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(b.x, b.y, r * 2.2, 0, TAU); ctx.fill();
          ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, TAU); ctx.fill();
          ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(b.x, b.y, r * 0.45, 0, TAU); ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
          break;
        }
        case 'wave':
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = b.col; ctx.globalAlpha = Math.min(1, b.life * 3); ctx.lineWidth = 7;
          ctx.beginPath(); ctx.arc(b.x - Math.cos(a) * 18, b.y - Math.sin(a) * 18, 26 * b.size, a - 1.1, a + 1.1); ctx.stroke();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
          ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
          break;
        case 'sword': {
          ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(a);
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = 'rgba(125,255,216,0.35)'; ctx.fillRect(-34, -4, 34, 8);
          ctx.fillStyle = '#bff8ff'; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-10, -3); ctx.lineTo(-10, 3); ctx.fill();
          ctx.fillStyle = '#ffd65a'; ctx.fillRect(-14, -5, 4, 10);
          ctx.restore(); ctx.globalCompositeOperation = 'source-over';
          break;
        }
        default:
          ctx.strokeStyle = 'rgba(255,220,120,0.35)'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(b.px - b.vx * 0.012, b.py - b.vy * 0.012); ctx.lineTo(b.x, b.y); ctx.stroke();
          ctx.strokeStyle = '#fff6c8'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(b.px, b.py); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
  },
};

// ---------- thrown objects, fires, acid, traps ----------
const Throws = {
  list: [], acids: [], fires: [], traps: [],
  throwItem(kind, x, y, tx, ty) {
    const d = Math.min(360, dist(x, y, tx, ty));
    const a = Math.atan2(ty - y, tx - x);
    let ex = x + Math.cos(a) * d, ey = y + Math.sin(a) * d;
    const steps = Math.ceil(d / 10);
    for (let i = 1; i <= steps; i++) {
      const px = x + Math.cos(a) * d * i / steps, py = y + Math.sin(a) * d * i / steps;
      if (World.get(Math.floor(px / TILE), Math.floor(py / TILE)) === T.WALL) { ex = x + Math.cos(a) * d * (i - 1) / steps; ey = y + Math.sin(a) * d * (i - 1) / steps; break; }
    }
    this.list.push({ kind, x0: x, y0: y, x1: ex, y1: ey, t: 0, dur: 0.35 + d / 900, fuse: kind === 'grenade' ? 1.2 : 0, spin: 0 });
    Sound.play('sfx_swing', 0.6, 1.3);
  },
  spit(z, tx, ty) {
    const d = dist(z.x, z.y, tx, ty);
    this.list.push({ kind: 'acid', x0: z.x, y0: z.y, x1: tx + R.range(-20, 20), y1: ty + R.range(-20, 20), t: 0, dur: 0.3 + d / 500, spin: 0, col: RL.projColor, dmg: z.dmg });
  },
  update(dt) {
    const boom = 1 + (G.player.perks.boom || 0) * 0.4;
    const lvlMul = 1 + G.player.level * 0.05;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const o = this.list[i];
      o.t += dt; o.spin += dt * 12;
      const k = Math.min(1, o.t / o.dur);
      o.x = lerp(o.x0, o.x1, k); o.y = lerp(o.y0, o.y1, k); o.z = Math.sin(Math.PI * k) * (o.kind === 'acid' ? 30 : 46);
      if (o.kind === 'acid' && Math.random() < 0.5) Particles.add({ x: o.x, y: o.y - o.z, vx: 0, vy: 0, life: 0.3, max: 0.3, size: 3, col: o.col, drag: 0 });
      if (o.kind === 'molotov') Particles.fire(o.x, o.y - o.z, 1);
      if (o.kind === 'grenade') o.fuse -= dt;
      if (k >= 1) {
        if (o.kind === 'molotov') {
          Sound.at('sfx_glass', o.x, o.y, 1); Sound.at('sfx_fire', o.x, o.y, 0.7);
          this.fires.push({ x: o.x, y: o.y, r: 72 * boom, life: 7, max: 7, friendly: true });
          World.addDecal('scorch', o.x, o.y, R.range(0, TAU), 1.1 * boom, 0.7);
          G.noise(o.x, o.y, 450);
          this.list.splice(i, 1); continue;
        }
        if (o.kind === 'acid') {
          this.acids.push({ x: o.x, y: o.y, r: 30, life: 4, max: 4, col: o.col, dps: (o.dmg || 10) * 0.9 });
          Particles.burst(o.x, o.y, 10, o.col, 120);
          this.list.splice(i, 1); continue;
        }
        if (o.kind === 'grenade' && o.fuse <= 0) { G.explode(o.x, o.y, 125 * boom, 160 * boom * lvlMul, true); this.list.splice(i, 1); continue; }
      }
    }
    for (let i = this.fires.length - 1; i >= 0; i--) {
      const f = this.fires[i];
      f.life -= dt;
      if (Math.random() < 0.9) for (let k = 0; k < 2; k++) { const a = R.range(0, TAU), r = Math.sqrt(Math.random()) * f.r; Particles.fire(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r, 1); }
      for (const z of G.zgrid.query(f.x, f.y, f.r + 20)) if (!z.dead && dist(z.x, z.y, f.x, f.y) < f.r) { G.hitEnemy(z, 40 * boom * lvlMul * dt, 0, 0, 'fire'); z.burn = 2.5; }
      const P = G.player;
      if (!P.car && !f.friendly && dist(P.x, P.y, f.x, f.y) < f.r) G.hurtPlayer(12 * dt, null, true);
      if (f.life <= 0) this.fires.splice(i, 1);
    }
    for (let i = this.acids.length - 1; i >= 0; i--) {
      const a = this.acids[i]; a.life -= dt;
      const P = G.player;
      if (!P.car && dist(P.x, P.y, a.x, a.y) < a.r) G.hurtPlayer(a.dps * dt, null, true);
      if (a.life <= 0) this.acids.splice(i, 1);
    }
    for (let i = this.traps.length - 1; i >= 0; i--) {
      const t = this.traps[i];
      for (const z of G.zgrid.query(t.x, t.y, 30)) {
        if (!z.dead && dist(z.x, z.y, t.x, t.y) < 18 + z.r && (z.trapT || 0) < G.time) {
          z.trapT = G.time + 1; G.hitEnemy(z, 60 * lvlMul, 0, 0, 'trap'); z.stun = 0.8; t.uses--;
          Sound.at('sfx_blade_hit', t.x, t.y, 0.6);
          if (t.uses <= 0) break;
        }
      }
      if (t.uses <= 0) this.traps.splice(i, 1);
    }
  },
  draw(ctx) {
    for (const t of this.traps) {
      ctx.save(); ctx.translate(t.x, t.y);
      ctx.fillStyle = '#3b2f22'; ctx.fillRect(-12, -12, 24, 24);
      ctx.fillStyle = '#9aa0a6';
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.moveTo(-10 + i * 6, -8 + j * 6 + 3); ctx.lineTo(-7 + i * 6, -8 + j * 6 - 3); ctx.lineTo(-4 + i * 6, -8 + j * 6 + 3); ctx.fill(); }
      ctx.restore();
    }
    for (const a of this.acids) { ctx.globalAlpha = 0.3 * Math.min(1, a.life); ctx.fillStyle = a.col; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
    for (const f of this.fires) {
      const al = Math.min(1, f.life);
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      g.addColorStop(0, `rgba(255,180,40,${0.45 * al})`); g.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.fill();
    }
    for (const o of this.list) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(o.x, o.y + 4, 5, 2, 0, 0, TAU); ctx.fill();
      if (o.kind === 'acid') { ctx.fillStyle = o.col; ctx.beginPath(); ctx.arc(o.x, o.y - o.z, 4, 0, TAU); ctx.fill(); continue; }
      const im = IMG[o.kind === 'grenade' ? 'i_grenade' : 'i_molotov'];
      ctx.save(); ctx.translate(o.x, o.y - o.z); ctx.rotate(o.spin);
      if (im) ctx.drawImage(im, -8, -8, 16, 16 * im.height / im.width);
      ctx.restore();
      if (o.kind === 'grenade' && o.t >= o.dur && Math.floor(o.fuse * 10) % 2 === 0) { ctx.fillStyle = 'rgba(255,40,40,0.8)'; ctx.beginPath(); ctx.arc(o.x, o.y, 3, 0, TAU); ctx.fill(); }
    }
  },
};

class SpatialHash {
  constructor(cell) { this.cell = cell; this.map = new Map(); }
  clear() { this.map.clear(); }
  insert(o) {
    const k = nkey(Math.floor(o.x / this.cell), Math.floor(o.y / this.cell));
    let a = this.map.get(k); if (!a) this.map.set(k, a = []); a.push(o);
  }
  query(x, y, r) {
    const out = []; const c = this.cell;
    const x0 = Math.floor((x - r) / c), x1 = Math.floor((x + r) / c), y0 = Math.floor((y - r) / c), y1 = Math.floor((y + r) / c);
    for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) { const a = this.map.get(nkey(xx, yy)); if (a) for (const o of a) out.push(o); }
    return out;
  }
}

// ---------- enemy ----------
let ZID = 0;
class Enemy {
  constructor(arche, x, y, o = {}) {
    const a = ARCHE[arche];
    const idx = ARCHE_ORDER.indexOf(arche);
    this.id = ZID++;
    this.arche = arche; this.t = a; this.type = arche;
    this.img = (RL.extraEnemies && RL.extraEnemies[arche] && Math.random() < 0.3) ? R.pick(RL.extraEnemies[arche]) : RL.enemies[idx];
    this.name = o.name || RL.enemyNames[idx];
    this.lvl = o.lvl || World.levelAt(x, y) + (G.day ? Math.floor((G.day - 1) / 2) : 0);
    this.elite = !!o.elite && !a.boss; this.boss = !!a.boss;
    const L = this.lvl - 1;
    this.scale = (this.elite ? 1.25 : 1) * (o.scale || 1);
    this.x = x; this.y = y; this.r = a.r * this.scale;
    this.maxHp = this.hp = a.hp * (1 + 0.16 * L) * (this.elite ? 3.2 : 1) * (o.hpMul || 1);
    this.dmg = a.dmg * (1 + 0.07 * L) * (this.elite ? 1.4 : 1);
    this.xp = a.xp * (1 + 0.12 * L) * (this.elite ? 4 : 1);
    this.spd = a.spd * R.range(0.88, 1.12) * (this.elite ? 1.1 : 1);
    this.angle = R.range(0, TAU);
    this.vx = 0; this.vy = 0; this.kx = 0; this.ky = 0;
    this.state = o.state || 'wander'; this.target = null;
    this.wanderT = 0; this.thinkT = R.range(0, 0.3); this.attackCd = 0; this.hitT = 0; this.walkT = R.range(0, 6);
    this.groanT = R.range(3, 14); this.spitCd = R.range(1, 3); this.stun = 0; this.burn = 0; this.poison = 0; this.slow = 0; this.lunge = 0;
    this.guard = !!o.guard; this.horde = !!o.horde; this.rise = o.rise ? 0.5 : 0;
    this.dying = 0;
    if (this.boss) { this.bossT = 3; this.bossState = 'walk'; this.summonT = 10; this.volleyT = 6; this.story = !!o.story; }
  }
  alert(x, y) { if (this.state !== 'chase') { this.state = 'investigate'; this.target = { x: x + R.range(-60, 60), y: y + R.range(-60, 60) }; } }
  update(dt) {
    if (this.dead) { this.dying += dt; return; }
    if (this.rise > 0) { this.rise -= dt; if (Math.random() < 0.3) Particles.dust(this.x, this.y + 6, 1); return; }
    const tgt = this.tgt || G.player.car || G.player;
    const dx = tgt.x - this.x, dy = tgt.y - this.y, d = Math.hypot(dx, dy);
    this.hitT -= dt; this.attackCd -= dt; this.thinkT -= dt; this.lunge = Math.max(0, this.lunge - dt * 4); this.slow -= dt;
    if (this.burn > 0) { this.burn -= dt; G.hitEnemy(this, (6 + this.maxHp * 0.02) * dt, 0, 0, 'fire'); if (Math.random() < 0.3) Particles.fire(this.x, this.y, 1); }
    if (this.poison > 0) { const p = Math.min(this.poison, dt * this.poison * 0.5 + dt * 4); this.poison -= p; G.hitEnemy(this, p, 0, 0, 'poison'); if (Math.random() < 0.2) Particles.poison(this.x, this.y, 1); }
    if (this.dead) return;
    this.kx *= Math.max(0, 1 - dt * 8); this.ky *= Math.max(0, 1 - dt * 8);
    if (this.stun > 0) { this.stun -= dt; this.move(this.kx * dt, this.ky * dt); return; }
    const P = G.player;
    if (this.thinkT <= 0) {
      this.thinkT = 0.2 + Math.random() * 0.15;
      if (P.dead) { this.state = 'wander'; this.tgt = null; }
      else {
        let best = G.player.car || P, bd = dist(this.x, this.y, best.x, best.y);
        for (const a of G.allies) { if (a.downed || a.dead || (a.kind === 'civ' && a.rescued)) continue; const dd = dist(this.x, this.y, a.x, a.y); if (dd < bd - 30) { bd = dd; best = a; } }
        this.tgt = best;
        const sight = G.sightRange() * (this.elite ? 1.3 : 1);
        const sees = bd < sight && (bd < 140 || World.bldAt(best.x, best.y) === World.bldAt(this.x, this.y)) && World.los(this.x, this.y, best.x, best.y);
        if (sees || this.horde || (this.guard && bd < 300) || bd < 70 || this.boss && bd < 600) {
          if (this.state !== 'chase' && bd < 500 && Math.random() < 0.4) Sound.at(G.groanSfx(), this.x, this.y, 0.5);
          this.state = 'chase'; this.lastSeen = { x: best.x, y: best.y }; this.lostT = 0;
        } else if (this.state === 'chase') {
          this.lostT = (this.lostT || 0) + 0.25;
          if (this.lostT > 6 && bd > sight * 1.6) { this.state = 'investigate'; this.target = this.lastSeen || { x: best.x, y: best.y }; }
        }
      }
    }
    this.groanT -= dt;
    if (this.groanT <= 0) { this.groanT = R.range(7, 18); if (d < 550) Sound.at(G.groanSfx(), this.x, this.y, 0.35, this.boss ? 0.6 : this.arche === 'brute' ? 0.75 : R.range(0.85, 1.15)); }

    let mx = 0, my = 0, speed = this.spd * (G.night ? 1.15 : 1) * (this.slow > 0 ? 0.5 : 1) * (G.timeSlow > 0 ? 0.3 : 1);
    if (this.state === 'chase' && !P.dead) {
      let dir = null;
      const tgtP = this.tgt === P || this.tgt === P.car;
      if (d < 600 && (d < 90 || World.bldAt(tgt.x, tgt.y) === World.bldAt(this.x, this.y)) && World.los(this.x, this.y, tgt.x, tgt.y)) dir = [dx / d, dy / d];
      else if (tgtP) dir = G.flowDir(this.x, this.y);
      if (!dir) { const ls = this.lastSeen || tgt; const ddx = ls.x - this.x, ddy = ls.y - this.y, dd = Math.hypot(ddx, ddy) || 1; dir = [ddx / dd, ddy / dd]; }
      mx = dir[0]; my = dir[1];
      if (this.t.ranged) {
        this.spitCd -= dt;
        if (d < 320 && d > 70 && World.los(this.x, this.y, tgt.x, tgt.y)) {
          speed *= 0.25;
          if (this.spitCd <= 0) {
            this.spitCd = R.range(1.8, 2.8) / (this.elite ? 1.5 : 1);
            const a = Math.atan2(dy, dx);
            if (RL.id === 'md') Throws.spit(this, tgt.x, tgt.y);
            else for (let k = 0; k < (this.elite ? 3 : 1); k++) Bullets.fire(this.x, this.y, a + (k - (this.elite ? 1 : 0)) * 0.2, { speed: 330 }, this.dmg, { hostile: true, proj: 'eshot', col: RL.projColor, life: 1.6, speed: 330 });
            Sound.at(RL.id === 'cy' ? 'sfx_laser2' : RL.id === 'md' ? 'sfx_zombie3' : 'sfx_magic2', this.x, this.y, 0.35, 1.2);
            this.lunge = 1;
          }
        }
      }
      if (this.t.explode && d < 42) { G.boomerExplode(this); return; }
      if (this.boss) { const r = this.bossAI(dt, d, dx, dy, tgt); if (r) { mx = r[0]; my = r[1]; speed = r[2]; } }
      const reach = this.r + (tgt.r || 11) + 6;
      if (d < reach && this.attackCd <= 0 && !this.t.explode) {
        this.attackCd = (this.t.rate || 1.0) * (G.timeSlow > 0 ? 3 : 1);
        this.lunge = 1;
        G.hurtTarget(tgt, this.dmg * (G.night ? 1.12 : 1), this);
        Sound.at(RL.id === 'md' ? 'sfx_zombie_attack' : 'sfx_blade_hit', this.x, this.y, 0.45, R.range(0.9, 1.2));
      }
      if (d < reach * 0.85) { mx *= 0.1; my *= 0.1; }
    } else if (this.state === 'investigate' && this.target) {
      const ddx = this.target.x - this.x, ddy = this.target.y - this.y, dd = Math.hypot(ddx, ddy);
      if (dd < 20) { this.state = 'wander'; this.target = null; }
      else { mx = ddx / dd; my = ddy / dd; speed *= 0.75; }
    } else {
      this.wanderT -= dt;
      if (this.wanderT <= 0) { this.wanderT = R.range(1.5, 4); this.wa = Math.random() < 0.4 ? null : R.range(0, TAU); }
      if (this.wa != null) { mx = Math.cos(this.wa); my = Math.sin(this.wa); speed *= 0.3; }
    }
    const near = G.zgrid.query(this.x, this.y, 34);
    let sx = 0, sy = 0;
    for (const o of near) {
      if (o === this || o.dead) continue;
      const ox = this.x - o.x, oy = this.y - o.y, od2 = ox * ox + oy * oy, rr = this.r + o.r;
      if (od2 < rr * rr && od2 > 0.01) { const od = Math.sqrt(od2); sx += ox / od * (rr - od); sy += oy / od * (rr - od); }
    }
    this.vx = lerp(this.vx, mx * speed, Math.min(1, dt * 6));
    this.vy = lerp(this.vy, my * speed, Math.min(1, dt * 6));
    const hit = this.move((this.vx + this.kx) * dt + sx * 0.3, (this.vy + this.ky) * dt + sy * 0.3);
    if (hit && hit.kind === 'barricade' && this.state === 'chase' && this.attackCd <= 0) { this.attackCd = 1; G.damageBarricade(hit, this.dmg); this.lunge = 1; }
    const sp = Math.hypot(this.vx, this.vy);
    this.walkT += dt * sp * 0.09;
    const face = this.state === 'chase' && d < 400 ? Math.atan2(dy, dx) : (sp > 5 ? Math.atan2(this.vy, this.vx) : this.angle);
    this.angle += angDiff(this.angle, face) * Math.min(1, dt * 7);
  }
  move(dx, dy) { this.x += dx; this.y += dy; return World.collideCircle(this, this.r); }
  bossAI(dt, d, dx, dy, tgt) {
    this.bossT -= dt; this.summonT -= dt; this.volleyT -= dt;
    const enr = this.hp < this.maxHp * 0.4;
    if (this.summonT <= 0) {
      this.summonT = enr ? 9 : 13;
      for (let i = 0; i < (enr ? 5 : 3); i++) { const a = R.range(0, TAU); G.spawnEnemy(R.pick(['runner', 'walker', 'armored']), this.x + Math.cos(a) * 70, this.y + Math.sin(a) * 70, { state: 'chase', rise: true, lvl: this.lvl }); }
      Sound.at('sfx_monster', this.x, this.y, 1, 0.8); G.shake(6);
      FX.ring(this.x, this.y, 20, 160, RL.projColor, 0.6, 8);
      Floaters.add(this.x, this.y - 60, R.pick(G.lore().bossTaunts || ['GẦMMM!']), '#ff6060', 11, true);
    }
    if (this.volleyT <= 0 && d < 520) {
      this.volleyT = enr ? 4 : 6.5;
      const n = enr ? 18 : 12;
      for (let i = 0; i < n; i++) Bullets.fire(this.x, this.y, i / n * TAU + G.time, {}, this.dmg * 0.5, { hostile: true, proj: 'eshot', col: RL.projColor, life: 2.2, speed: 230, size: 1.4 });
      FX.ring(this.x, this.y, 10, 90, RL.projColor, 0.4, 6);
      Sound.at('sfx_energy', this.x, this.y, 0.7, 0.7);
    }
    if (this.bossState === 'walk') {
      if (this.bossT <= 0 && d < 440) { this.bossState = 'windup'; this.bossT = enr ? 0.6 : 0.9; this.chargeA = Math.atan2(dy, dx); Sound.at('sfx_monster', this.x, this.y, 0.9, 0.6); }
      if (d < 80 && this.attackCd <= 0) {
        this.attackCd = enr ? 1.6 : 2.2;
        G.shake(10); Sound.at('sfx_explosion', this.x, this.y, 0.6, 0.6);
        Particles.debris(this.x, this.y, 30); FX.ring(this.x, this.y, 20, 130, '#ffcf8a', 0.4, 10);
        if (d < 120) G.hurtTarget(tgt, this.dmg, this);
        return [0, 0, 0];
      }
      return null;
    }
    if (this.bossState === 'windup') {
      this.hitT = 0.05;
      if (this.bossT <= 0) { this.bossState = 'charge'; this.bossT = 0.85; }
      return [0, 0, 0];
    }
    if (this.bossState === 'charge') {
      if (dist(this.x, this.y, tgt.x, tgt.y) < this.r + 22 && !this.chargeHit) { this.chargeHit = true; G.hurtTarget(tgt, this.dmg * 1.2, this); if (tgt === G.player) { G.player.kx = Math.cos(this.chargeA) * 500; G.player.ky = Math.sin(this.chargeA) * 500; } G.shake(12); }
      if (Math.random() < 0.5) Particles.dust(this.x, this.y + 10, 2);
      if (Math.random() < 0.4) FX.ghost(this.img, this.x, this.y, this.angle, -this.imgW() * 0.56, RL.projColor, 0.25);
      if (this.bossT <= 0) { this.bossState = 'walk'; this.bossT = R.range(3, 5); this.chargeHit = false; }
      return [Math.cos(this.chargeA), Math.sin(this.chargeA), 440];
    }
    return null;
  }
  imgW() { const im = IMG[this.img]; return im ? im.width / 2 * this.scale : 30; }
  draw(ctx) {
    const im = IMG[this.img]; if (!im) return;
    const w = im.width / 2 * this.scale, h = im.height / 2 * this.scale;
    let alpha = 1, rot = 0, sc = 1;
    if (this.dead) { const k = Math.min(1, this.dying / 0.4); alpha = 1 - k; rot = k * 1.2; sc = 1 - k * 0.25; }
    if (this.rise > 0) { sc = 1 - this.rise / 0.5; alpha = sc; }
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(this.x + 3, this.y + 4, this.r * 1.1 * sc, this.r * 0.9 * sc, 0, 0, TAU); ctx.fill();
    if (this.elite && !this.dead) { ctx.strokeStyle = `rgba(255,190,40,${0.5 + Math.sin(G.time * 6) * 0.3})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(this.x, this.y, this.r + 6, 0, TAU); ctx.stroke(); }
    if (this.boss && !this.dead) { ctx.strokeStyle = `rgba(255,40,40,${0.4 + Math.sin(G.time * 4) * 0.2})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(this.x, this.y, this.r + 10, 0, TAU); ctx.stroke(); }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);
    const wob = Math.sin(this.walkT) * 0.13;
    ctx.rotate(this.angle + wob + rot);
    const sq = 1 + Math.sin(this.walkT * 2) * 0.05;
    ctx.translate(this.lunge * 7 - (this.hitT > 0 ? 3 : 0), Math.sin(this.walkT) * 1.5);
    ctx.scale(sc * sq, sc / sq);
    ctx.drawImage(im, -w * 0.56, -h / 2, w, h);
    if (this.hitT > 0 || this.bossState === 'windup') {
      ctx.globalAlpha = alpha * (this.bossState === 'windup' ? 0.4 + Math.sin(G.time * 40) * 0.3 : this.boss ? 0.3 : 0.7);
      ctx.drawImage(G.whiteOf(this.img, this.bossState === 'windup' ? '#ff2020' : '#ffffff'), -w * 0.56, -h / 2, w, h);
    } else if (this.slow > 0) { ctx.globalAlpha = 0.35; ctx.drawImage(G.whiteOf(this.img, '#7fdcff'), -w * 0.56, -h / 2, w, h); }
    else if (this.burn > 0) { ctx.globalAlpha = 0.3; ctx.drawImage(G.whiteOf(this.img, '#ff7020'), -w * 0.56, -h / 2, w, h); }
    else if (this.poison > 1) { ctx.globalAlpha = 0.3; ctx.drawImage(G.whiteOf(this.img, '#7cf04a'), -w * 0.56, -h / 2, w, h); }
    ctx.restore();
    if (this.dead) return;
    if ((this.hp < this.maxHp || this.elite) && !this.boss) {
      const bw = Math.max(20, this.r * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(this.x - bw / 2, this.y - this.r - 10, bw, 3);
      ctx.fillStyle = this.elite ? '#ffb020' : '#c62828'; ctx.fillRect(this.x - bw / 2, this.y - this.r - 10, bw * Math.max(0, this.hp / this.maxHp), 3);
      if (this.elite) { ctx.font = '8px VT323, monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffcf3a'; ctx.fillText(`★ ${this.name} Lv${this.lvl}`, this.x, this.y - this.r - 13); }
    }
  }
}

// ---------- allies: companions, shadow soldiers, civilians ----------
class Ally {
  constructor(kind, x, y, o = {}) {
    this.kind = kind; this.x = x; this.y = y; this.angle = 0; this.r = 11;
    this.img = o.img; this.comp = o.comp || null; this.vx = 0; this.vy = 0; this.cool = R.range(0, 0.5); this.walkT = 0;
    const lv = G.player ? G.player.level : 1;
    const lead = G.player ? 1 + (G.player.perks.leader || 0) * 0.4 : 1;
    this.maxHp = this.hp = (kind === 'comp' ? 140 + lv * 12 : kind === 'shadow' ? (o.hp || 120) : 60) * lead;
    this.dmg = (kind === 'comp' ? 16 + lv * 2.2 : (o.dmg || 20)) * lead;
    this.life = kind === 'shadow' ? 60 : 1e9;
    this.scale = o.scale || 1;
    this.say = null; this.sayT = R.range(10, 25); this.hurtT = 0; this.downed = false;
    this.rescued = false; this.fade = 1; this.lunge = 0;
  }
  speak(text, t = 3.5) { this.say = { text, t }; }
  hurt(d) {
    if (this.downed || this.dead) return;
    this.hp -= d; this.hurtT = 0.2;
    if (this.kind === 'comp' && this.hp > 0 && Math.random() < 0.15) this.speak(R.pick(this.comp.hurt), 2);
    if (this.hp <= 0) {
      if (this.kind === 'comp') { this.downed = true; this.hp = 0; G.toast(`${this.comp.name} đã gục ngã! Đến gần và nhấn [E] để cứu.`, 'warn'); }
      else if (this.kind === 'shadow') { this.dead = true; Particles.burst(this.x, this.y, 14, '#6b5bff', 160); }
      else { this.dead = true; if (dist(this.x, this.y, G.player.x, G.player.y) < 600) G.toast('Một người dân đã thiệt mạng...', 'warn'); }
    }
  }
  nearestEnemy(range) {
    let best = null, bd = range;
    for (const z of G.zgrid.query(this.x, this.y, range)) { if (z.dead || z.rise > 0) continue; const d = dist(this.x, this.y, z.x, z.y); if (d < bd && World.los(this.x, this.y, z.x, z.y)) { bd = d; best = z; } }
    return best;
  }
  update(dt) {
    const P = G.player;
    this.hurtT -= dt; this.cool -= dt;
    if (this.say) { this.say.t -= dt; if (this.say.t <= 0) this.say = null; }
    if (this.kind === 'civ') {
      this.walkT += dt * 8;
      if (this.rescued) { this.fade -= dt * 0.35; this.x += this.vx * dt; this.y += this.vy * dt; World.collideCircle(this, this.r); if (this.fade <= 0) this.dead = true; }
      else { this.sayT -= dt; if (this.sayT <= 0) { this.sayT = R.range(5, 9); if (dist(this.x, this.y, P.x, P.y) < 500) this.speak(R.pick(G.lore().civilians.help), 3); } }
      return;
    }
    if (this.downed) return;
    if (this.kind === 'shadow') { this.life -= dt; if (this.life <= 0) { this.dead = true; Particles.burst(this.x, this.y, 12, '#6b5bff', 140); return; } }
    const lead = P.car || P;
    const tgt = this.nearestEnemy(this.kind === 'shadow' ? 420 : 340);
    let mx = 0, my = 0, speed = this.kind === 'shadow' ? 150 : 135;
    const dp = dist(this.x, this.y, lead.x, lead.y);
    if (dp > 700) { this.x = lead.x - 40; this.y = lead.y + 30; }
    if (this.kind === 'shadow' && tgt) {
      const d = dist(this.x, this.y, tgt.x, tgt.y);
      if (d > this.r + tgt.r + 4) { mx = (tgt.x - this.x) / d; my = (tgt.y - this.y) / d; }
      else if (this.cool <= 0) {
        this.cool = 0.7; this.lunge = 1;
        G.hitEnemy(tgt, this.dmg, (tgt.x - this.x) / d * 120, (tgt.y - this.y) / d * 120, 'ally', Math.atan2(tgt.y - this.y, tgt.x - this.x));
        FX.slash(this.x, this.y, Math.atan2(tgt.y - this.y, tgt.x - this.x), 32, 1.6, 'rgba(107,91,255,0.8)', 0.14);
      }
      this.angle = Math.atan2(tgt.y - this.y, tgt.x - this.x);
    } else {
      if (dp > 75) { mx = (lead.x - this.x) / dp; my = (lead.y - this.y) / dp; speed = dp > 200 ? 200 : 140; }
      if (tgt && this.kind === 'comp') {
        this.angle = Math.atan2(tgt.y - this.y, tgt.x - this.x);
        if (this.cool <= 0) {
          this.cool = 0.5;
          const W = RL.weapons.r1;
          Bullets.fire(this.x + Math.cos(this.angle) * 14, this.y + Math.sin(this.angle) * 14, this.angle + R.range(-0.05, 0.05), { speed: 900, knock: 40, proj: W.proj || 'bullet', color: W.color, homing: W.homing }, this.dmg, { ally: true, src: 'ally' });
          Sound.at(W.sfx, this.x, this.y, 0.22, 1.15);
          if (Math.random() < 0.05) this.speak(R.pick(this.comp.combat), 2);
        }
      } else if (Math.hypot(this.vx, this.vy) > 10) this.angle = Math.atan2(this.vy, this.vx);
    }
    this.vx = lerp(this.vx, mx * speed, Math.min(1, dt * 6)); this.vy = lerp(this.vy, my * speed, Math.min(1, dt * 6));
    this.x += this.vx * dt; this.y += this.vy * dt;
    for (const o of G.allies) if (o !== this && !o.downed) { const ox = this.x - o.x, oy = this.y - o.y, d = Math.hypot(ox, oy); if (d < 22 && d > 0.1) { this.x += ox / d * (22 - d) * 0.5; this.y += oy / d * (22 - d) * 0.5; } }
    World.collideCircle(this, this.r);
    this.walkT += dt * Math.hypot(this.vx, this.vy) * 0.08;
    this.lunge = Math.max(0, this.lunge - dt * 5);
    if (this.kind === 'comp') {
      this.sayT -= dt;
      if (this.sayT <= 0) { this.sayT = R.range(25, 50); if (!tgt) this.speak(R.pick(this.comp.banter), 4); }
      if (this.hp < this.maxHp) this.hp = Math.min(this.maxHp, this.hp + dt * 2);
    }
  }
  draw(ctx) {
    const im = this.kind === 'shadow' ? G.shadowOf(this.img) : IMG[this.img]; if (!im) return;
    const w = im.width / 2 * this.scale, h = im.height / 2 * this.scale;
    ctx.globalAlpha = Math.max(0, this.fade);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(this.x + 3, this.y + 4, 11, 9, 0, 0, TAU); ctx.fill();
    if (this.kind === 'comp' && !this.downed) { ctx.strokeStyle = 'rgba(255,120,170,0.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(this.x, this.y, 15, 0, TAU); ctx.stroke(); }
    ctx.save(); ctx.translate(this.x, this.y);
    if (this.downed) { ctx.rotate(1.3); ctx.globalAlpha = 0.6; }
    else ctx.rotate(this.angle + Math.sin(this.walkT) * 0.06 + (this.kind === 'civ' && !this.rescued ? Math.sin(this.walkT * 3) * 0.08 : 0));
    ctx.translate(this.lunge * 6, 0);
    const px = this.kind === 'shadow' ? -w * 0.56 : -h / 2;
    ctx.drawImage(im, px, -h / 2, w, h);
    if (this.hurtT > 0 && this.kind !== 'shadow') { ctx.globalAlpha = 0.6; ctx.drawImage(G.whiteOf(this.img, '#ff4040'), px, -h / 2, w, h); }
    ctx.restore(); ctx.globalAlpha = 1;
    if (this.kind === 'shadow') {
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(80,140,255,0.9)';
      ctx.beginPath(); ctx.arc(this.x + Math.cos(this.angle) * 4, this.y + Math.sin(this.angle) * 4, 2.5, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    if (this.kind !== 'civ' && (this.hp < this.maxHp || this.downed)) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(this.x - 12, this.y - 20, 24, 3);
      ctx.fillStyle = this.kind === 'shadow' ? '#6b5bff' : '#4fd16a'; ctx.fillRect(this.x - 12, this.y - 20, 24 * Math.max(0, this.hp / this.maxHp), 3);
    }
    if (this.kind === 'comp') {
      ctx.font = '8px VT323, monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffb3cf';
      ctx.fillText((G.romanceReady(this.comp) ? '♥! ' : '♥ ') + this.comp.name, this.x, this.y - 23);
    }
    if (this.say) {
      ctx.font = '9px VT323, monospace'; ctx.textAlign = 'center';
      const t = this.say.text.length > 46 ? this.say.text.slice(0, 44) + '…' : this.say.text;
      const tw = ctx.measureText(t).width + 8;
      ctx.globalAlpha = Math.min(1, this.say.t * 2);
      ctx.fillStyle = 'rgba(10,10,14,0.85)'; ctx.fillRect(this.x - tw / 2, this.y - 44, tw, 13);
      ctx.fillStyle = '#ffffff'; ctx.fillText(t, this.x, this.y - 34);
      ctx.globalAlpha = 1;
    }
  }
}

// ---------- player ----------
const FISTS = { melee: true, dmg: 10, rate: 0.36, range: 36, arc: 1.4, knock: 90, stam: 4, sprite: null, name: 'Tay không', affixes: [], crit: 0 };
class Player {
  constructor(x, y) {
    this.x = x; this.y = y; this.r = 11; this.angle = 0;
    this.hp = 100; this.maxHp = 100; this.hunger = 100; this.thirst = 100; this.stamina = 100; this.maxStam = 100;
    this.equip = { melee: null, r1: null, r2: null, r3: null }; this.relics = [null, null, null]; this.stash = [];
    this.weapon = 'melee'; this.mags = { r1: 0, r2: 0, r3: 0 };
    this.inv = {}; this.cool = 0; this.reloading = 0; this.flash = false; this.battery = 100; this.hasFlashlight = true;
    this.xp = 0; this.level = 1; this.perks = {}; this.energy = 0;
    this.hurtT = 0; this.stamDelay = 0; this.energyT = 0; this.pillsT = 0; this.walkT = 0; this.swingT = 0; this.swingDir = 1;
    this.kx = 0; this.ky = 0; this.vx = 0; this.vy = 0; this.car = null; this.muzzleT = 0; this.stepT = 0; this.recoil = 0;
    this.dashT = 0; this.dashCd = 0; this.ghostT = 0; this.shield = 0; this.shieldT = 0; this.spin = 0; this.reviveUsed = false;
    this.wcache = {};
  }
  get wdef() {
    const it = this.equip[this.weapon];
    if (!it) { FISTS.sprite = RL.hero[3]; return FISTS; }
    let c = this.wcache[this.weapon];
    if (!c || c.uid !== it.uid) { c = Loot.stats(it); c.uid = it.uid; this.wcache[this.weapon] = c; }
    return c;
  }
  relic(type) { let v = 0; for (const r of this.relics) if (r && r.type === type) v += r.value; return v; }
  speedMul() { return (1 + (this.perks.speed || 0) * 0.08) * (1 + this.relic('speed') / 100); }
  draw(ctx) {
    if (this.car || this.dead) return;
    const w = this.wdef;
    const im = IMG[w.sprite]; if (!im) return;
    const iw = im.width / 2, ih = im.height / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath(); ctx.ellipse(this.x + 3, this.y + 4, 12, 10, 0, 0, TAU); ctx.fill();
    if (this.shield > 0) { ctx.strokeStyle = `rgba(120,200,255,${0.4 + Math.sin(G.time * 5) * 0.15})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(this.x, this.y, 18, 0, TAU); ctx.stroke(); }
    ctx.save();
    ctx.translate(this.x, this.y);
    let a = this.angle;
    if (w.melee && this.swingT > 0) a += this.swingDir * (Math.sin((1 - this.swingT / 0.2) * Math.PI) * 1.2 - 0.45);
    if (this.spin > 0) a = G.time * 22;
    const sp = Math.hypot(this.vx, this.vy);
    ctx.rotate(a);
    const px = -ih / 2;
    ctx.translate(-this.recoil * 4, 0);
    const bob = Math.sin(this.walkT) * 0.05 * Math.min(1, sp / 100);
    ctx.scale(1 + bob + (this.dashT > 0 ? 0.12 : 0), 1 - bob - (this.dashT > 0 ? 0.08 : 0));
    ctx.drawImage(im, px, -ih / 2, iw, ih);
    if (this.hurtT > 0.15) { ctx.globalAlpha = 0.6; ctx.drawImage(G.whiteOf(w.sprite, '#ff3030'), px, -ih / 2, iw, ih); ctx.globalAlpha = 1; }
    if (this.muzzleT > 0 && !w.melee) {
      const mx = px + iw - 1;
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = w.color || '#fff3b0'; ctx.beginPath(); ctx.arc(mx + 4, 0, 6 + Math.random() * 3, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,170,40,0.8)';
      ctx.beginPath(); ctx.moveTo(mx, -4); ctx.lineTo(mx + 18 + Math.random() * 8, 0); ctx.lineTo(mx, 4); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
    const n = Math.floor(this.relic('orbit'));
    for (let i = 0; i < n; i++) {
      const oa = G.time * 3 + i / n * TAU;
      const ox = this.x + Math.cos(oa) * 46, oy = this.y + Math.sin(oa) * 46;
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,120,200,0.4)'; ctx.beginPath(); ctx.arc(ox, oy, 9, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffd6f0'; ctx.beginPath(); ctx.arc(ox, oy, 4, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  muzzlePos() {
    const im = IMG[this.wdef.sprite];
    const iw = im.width / 2, ih = im.height / 2;
    const off = -ih / 2 + iw;
    return { x: this.x + Math.cos(this.angle) * off + Math.cos(this.angle + Math.PI / 2) * 2, y: this.y + Math.sin(this.angle) * off + Math.sin(this.angle + Math.PI / 2) * 2 };
  }
}

// ---------- drivable vehicle ----------
class Car {
  constructor(prop) {
    this.img = prop.img; this.x = prop.x; this.y = prop.y; this.angle = prop.rot;
    this.speed = 0; this.fuel = prop.fuel; this.hp = prop.hp || 100;
    const im = IMG[this.img]; this.len = im.width / 2; this.wid = im.height / 2;
    this.engineT = 0; this.r = 24;
  }
  circles() {
    const c = Math.cos(this.angle), s = Math.sin(this.angle), q = this.len * 0.3, r = this.wid * 0.46;
    return [{ x: this.x + c * q, y: this.y + s * q, r }, { x: this.x - c * q, y: this.y - s * q, r }, { x: this.x, y: this.y, r }];
  }
  update(dt) {
    const up = Input.down('KeyW') || Input.down('ArrowUp'), dn = Input.down('KeyS') || Input.down('ArrowDown');
    const lf = Input.down('KeyA') || Input.down('ArrowLeft'), rt = Input.down('KeyD') || Input.down('ArrowRight');
    const max = 360, acc = up && this.fuel > 0 ? 320 : 0;
    if (acc) this.speed += acc * dt;
    if (dn) this.speed -= (this.speed > 0 ? 520 : 200) * dt;
    if (Input.down('Space')) this.speed *= Math.max(0, 1 - dt * 4);
    this.speed = clamp(this.speed, -130, max);
    this.speed *= Math.max(0, 1 - dt * (up || dn ? 0.4 : 1.1));
    const steer = (rt ? 1 : 0) - (lf ? 1 : 0);
    const sf = clamp(Math.abs(this.speed) / 120, 0, 1) * Math.sign(this.speed);
    this.angle += steer * 2.6 * sf * dt;
    if (this.fuel > 0) this.fuel = Math.max(0, this.fuel - Math.abs(this.speed) * dt * 0.005);
    this.x += Math.cos(this.angle) * this.speed * dt;
    this.y += Math.sin(this.angle) * this.speed * dt;
    let crash = false;
    for (let it = 0; it < 2; it++) for (const c of this.circles()) {
      const tmp = { x: c.x, y: c.y };
      const hit = World.collideCircle(tmp, c.r);
      if (hit) { crash = crash || hit; this.x += tmp.x - c.x; this.y += tmp.y - c.y; }
    }
    if (crash && Math.abs(this.speed) > 90) {
      const s = Math.abs(this.speed);
      G.damageCar(this, s * 0.05);
      G.shake(Math.min(10, s / 30));
      Sound.play('sfx_hit', Math.min(1, s / 300), 0.6);
      Particles.sparks(this.x + Math.cos(this.angle) * this.len / 2, this.y + Math.sin(this.angle) * this.len / 2, this.angle, 8);
      if (crash.drivable) G.carAlarm(crash);
      this.speed *= -0.25;
    } else if (crash) this.speed *= 0.9;
    if (Math.abs(this.speed) > 150 && Math.random() < 0.5) Particles.dust(this.x - Math.cos(this.angle) * this.len / 2, this.y - Math.sin(this.angle) * this.len / 2, 1);
    for (const c of this.circles()) {
      for (const z of G.zgrid.query(c.x, c.y, c.r + 40)) {
        if (z.dead) continue;
        const dx = z.x - c.x, dy = z.y - c.y, d = Math.hypot(dx, dy), rr = c.r + z.r;
        if (d < rr) {
          const s = Math.abs(this.speed);
          if (s > 70 && (z.carHitT || 0) < G.time) {
            z.carHitT = G.time + 0.4;
            const nx = dx / (d || 1), ny = dy / (d || 1);
            G.hitEnemy(z, s * 0.6 * (1 + G.player.level * 0.05), nx * s * 1.2, ny * s * 1.2, 'car', Math.atan2(ny, nx));
            this.speed *= z.boss ? 0.1 : z.arche === 'brute' ? 0.55 : 0.88;
            G.damageCar(this, z.boss ? 20 : z.arche === 'brute' ? 6 : 1.5);
          } else { z.x += dx / (d || 1) * (rr - d); z.y += dy / (d || 1) * (rr - d); }
        }
      }
    }
    this.engineT -= dt;
    if (this.engineT <= 0 && Math.abs(this.speed) > 20) { this.engineT = 1.2; G.noise(this.x, this.y, 380); }
  }
  draw(ctx) {
    const im = IMG[this.img];
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.save(); ctx.translate(this.x + 4, this.y + 5); ctx.rotate(this.angle);
    ctx.fillRect(-this.len / 2, -this.wid / 2, this.len, this.wid); ctx.restore();
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);
    ctx.drawImage(im, -this.len / 2, -this.wid / 2, this.len, this.wid);
    ctx.restore();
  }
}
