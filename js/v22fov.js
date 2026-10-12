// ===== v22fov: tầm nhìn hình nón, giác quan nguy hiểm, jumpscare khi vào nhà, hai cài đặt =====
// Contract:
//   G.canSee(x, y)     -> true when the point is in view (always true while the view setting is off)
//   G.fovCfg           {on, scare}; saved in localStorage tt_fov / tt_scare ('0' = off, default on)
//   G.fovSet(key, on)  key 'on' (tầm nhìn) | 'scare' (jumpscare); saves and syncs the checkboxes in #settings
//   G.fovStat()        debug counters
// Hooks (all wrappers, nothing else is edited):
//   drawLighting          one overlay: darkness + view cone and ring cut with destination-out on lightC (1/3 res).
//                         With the view off it is the original function. No gradient on the main ctx (GL2D has no clip()).
//   Enemy.prototype.draw  not drawn when G.canSee is false (they still hit you from behind).
//   UI.drawMinimap, Touch.aimNearest   G.zombies is swapped for the call: only visible enemies appear / get aimed.
//   G.v5Tick              danger sense (a chasing enemy within 140 px that you cannot see) and the jumpscare.
(function () {
  const TAU2 = Math.PI * 2;
  const HALF = 55 * Math.PI / 180, FHALF = 26 * Math.PI / 180;      // cone ±55°, flashlight ±26°
  const RANGE_DAY = 520, RANGE_NIGHT = 320, RANGE_FLASH = 440;
  const SEE_ALLY = { shadow: 1, comp: 1, merc: 1 };                  // allies that carry a 150 px view
  const ALLY_R = 150, BODY_R = 64;
  const ls = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v !== '0'; } catch (e) { return d; } };
  const CFG = { on: ls('tt_fov', true), scare: ls('tt_scare', true) };
  G.fovCfg = CFG;
  const ST = {
    hidden: 0, scares: 0, rushes: 0, ambush: 0, lastScare: -1e9, init: false, lastB: null, lastFl: '',
    senseK: 0, senseDir: null, beatT: 0, edges: { t: -1, b: -1, l: -1, r: -1 }, rush: [], flashEl: null,
  };
  const EL = {};
  G.fovStat = () => ({ hidden: ST.hidden, scares: ST.scares, rushes: ST.rushes, ambush: ST.ambush, senseK: +ST.senseK.toFixed(3), senseDir: ST.senseDir, lastScare: ST.lastScare });

  const wrapA = a => { while (a > Math.PI) a -= TAU2; while (a < -Math.PI) a += TAU2; return a; };

  // the viewpoint for this moment: the car when driving, else the player
  function vis() {
    const P = G.player, car = P.car || null;
    const dk = G.darkness();
    const night = World.mode === 'dungeon' || !!G.night || dk >= 0.6;
    return {
      x: car ? car.x : P.x, y: car ? car.y : P.y, ang: car ? car.angle : P.angle,
      flash: !car && !!P.flash, night, range: night ? RANGE_NIGHT : RANGE_DAY,
    };
  }
  // in the cone (or the flashlight beam) and with no wall between; the 64 px ring is always in view
  function inView(v, x, y) {
    const dx = x - v.x, dy = y - v.y, d = Math.hypot(dx, dy);
    if (d < BODY_R) return true;
    const da = Math.abs(wrapA(Math.atan2(dy, dx) - v.ang));
    const ok = (da <= HALF && d <= v.range) || (v.flash && da <= FHALF && d <= RANGE_FLASH);
    return ok && World.los(v.x, v.y, x, y);
  }

  G.canSee = function (x, y) {
    if (!CFG.on) return true;
    const P = G.player; if (!P) return true;
    if (inView(vis(), x, y)) return true;
    for (const a of G.allies) {
      if (a.dead || a.downed || a.home || !SEE_ALLY[a.kind]) continue;
      if (dist(a.x, a.y, x, y) < ALLY_R && World.los(a.x, a.y, x, y)) return true;
    }
    for (const r of G.remotes || []) {
      if (r.dead || r.away) continue;
      if (dist(r.x, r.y, x, y) < ALLY_R && World.los(r.x, r.y, x, y)) return true;
    }
    return false;
  };

  // ---------- one overlay: darkness, with the view cut out of it ----------
  // outside the view: 0.55 by day, 0.85 at night (or the normal darkness if that is higher);
  // inside the view: the normal darkness, and at night at most 0.5 so the cone reads as lit.
  function fvLighting(camX, camY) {
    const P = G.player, v = vis();
    let dk = G.darkness();
    if (!P.car && World.bldAt(P.x, P.y)) dk = Math.max(dk, 0.45);
    dk = Math.max(0, dk - G.lightning * 0.8);
    const outD = Math.max(dk, v.night ? 0.85 : 0.55);
    const inD = v.night ? Math.min(dk, 0.5) : dk;
    const L = lctx, Z = G.zoom / 3, W3 = lightC.width, H3 = lightC.height;
    const toS = (x, y) => [(x - camX) * Z + W3 / 2, (y - camY) * Z + H3 / 2];
    L.globalCompositeOperation = 'source-over';
    L.clearRect(0, 0, W3, H3);
    const t = World.mode === 'dungeon' ? [3, 3, 8] : RL.nightTint;
    L.fillStyle = `rgba(${t[0]},${t[1]},${t[2]},${outD})`;
    L.fillRect(0, 0, W3, H3);
    L.globalCompositeOperation = 'destination-out';
    const glow = (x, y, r, a = 1) => {
      const [sx, sy] = toS(x, y); const rr = r * Z;
      if (sx < -rr || sy < -rr || sx > W3 + rr || sy > H3 + rr) return;
      L.globalAlpha = a; L.drawImage(GLOW.cut, sx - rr, sy - rr, rr * 2, rr * 2);
    };
    // the view: a cone stopped by walls, the ring around the body and the ring of each shadow/teammate, one path
    if (outD - inD > 0.01) {
      const [sx, sy] = toS(v.x, v.y);
      L.beginPath(); L.moveTo(sx, sy);
      const N = 36;
      for (let i = 0; i <= N; i++) {
        const aa = v.ang - HALF + 2 * HALF * i / N, ca = Math.cos(aa), sa = Math.sin(aa);
        let d = 0;
        while (d < v.range) {
          const nd = Math.min(v.range, d + 12);
          if (World.get(Math.floor((v.x + ca * nd) / TILE), Math.floor((v.y + sa * nd) / TILE)) === T.WALL) break;
          d = nd;
        }
        const [px, py] = toS(v.x + ca * d, v.y + sa * d); L.lineTo(px, py);
      }
      L.closePath();
      L.moveTo(sx + BODY_R * Z, sy); L.arc(sx, sy, BODY_R * Z, 0, TAU2);
      for (const a of G.allies) {
        if (a.dead || a.downed || a.home || !SEE_ALLY[a.kind]) continue;
        const [ax, ay] = toS(a.x, a.y), rr = ALLY_R * Z;
        if (ax < -rr || ay < -rr || ax > W3 + rr || ay > H3 + rr) continue;
        L.moveTo(ax + rr, ay); L.arc(ax, ay, rr, 0, TAU2);
      }
      L.globalAlpha = 1 - inD / outD; L.fill();
    }
    // the lights of the old lighting: only when the scene is dark (same gate as before, so day stays clear)
    if (dk >= 0.02) {
      // ray-cast like the flashlight (play.js drawLighting cone): walls and the own building stop it
      const cone = (x, y, ang, r, half, a = 1) => {
        const [sx, sy] = toS(x, y); const rr = r * Z;
        L.save(); L.beginPath(); L.moveTo(sx, sy);
        const myB = World.bldAt(x, y), N = 40;
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
      if (P.car) { const c = P.car; cone(c.x + Math.cos(c.angle) * c.len / 2, c.y + Math.sin(c.angle) * c.len / 2, c.angle, 440, 0.34, 1); }
      else if (P.flash) cone(P.x, P.y, P.angle, RANGE_FLASH, FHALF, 1);
      if (P.muzzleT > 0) glow(P.x, P.y, 220, 0.9);
      for (const l of World.lights) if (!l.dead) glow(l.x, l.y, l.light * 1.4 * (l.lightCol === 'fire' ? 0.9 + Math.random() * 0.15 : 1), 0.95);
      for (const f of Throws.fires) glow(f.x, f.y, f.r * 2.4, Math.min(1, f.life));
      for (const f of G.flashes) glow(f.x, f.y, f.r, f.life / f.max);
      for (const a of G.allies) if (a.kind === 'comp') glow(a.x, a.y, 70, 0.5);
      for (const b of Bullets.list) if (b.proj !== 'bullet') glow(b.x, b.y, 50, 0.6);
      for (const z of G.zombies) if (z.burn > 0 || z.boss) glow(z.x, z.y, z.boss ? 90 : 50, 0.5);
    }
    L.globalAlpha = 1; L.globalCompositeOperation = 'source-over';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(lightC, 0, 0, canvas.width, canvas.height);
    // the early return of the original leaves smoothing off for the rest of the frame; keep that state on the day path
    if (dk < 0.02) ctx.imageSmoothingEnabled = false;
    if (dk >= 0.02 && World.mode === 'over') {
      const h = G.clock;
      let tint = 0;
      if (h > 16.5 && h < 20.5) tint = Math.sin((h - 16.5) / 4 * Math.PI);
      if (h > 4.5 && h < 7.5) tint = Math.sin((h - 4.5) / 3 * Math.PI) * 0.8;
      if (tint > 0) { ctx.fillStyle = `rgba(255,110,40,${tint * 0.12})`; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    }
  }
  const dlOrig = drawLighting;
  drawLighting = function (camX, camY) { return CFG.on ? fvLighting(camX, camY) : dlOrig(camX, camY); };

  // ---------- hide what is out of view ----------
  const ed = Enemy.prototype.draw;
  Enemy.prototype.draw = function (ctx) {
    if (CFG.on && !G.canSee(this.x, this.y)) { ST.hidden++; return; }
    return ed.call(this, ctx);
  };
  // minimap dots and touch auto-aim only see what the player can see
  const seenOnly = fn => function (...a) {
    if (!CFG.on) return fn.apply(this, a);
    const all = G.zombies;
    G.zombies = all.filter(z => !z.dead && G.canSee(z.x, z.y));
    try { return fn.apply(this, a); } finally { G.zombies = all; }
  };
  UI.drawMinimap = seenOnly(UI.drawMinimap);
  Touch.aimNearest = seenOnly(Touch.aimNearest);

  // ---------- danger sense and jumpscare ----------
  const EDGE = { t: 'fvE_t', b: 'fvE_b', l: 'fvE_l', r: 'fvE_r' };
  // four soft red bars on the screen edges, on the side the unseen chaser is on; opacity is set only when it changes
  function senseSet(k, a) {
    ST.senseK = k; ST.senseDir = a;
    const c = a == null ? 0 : Math.cos(a), s = a == null ? 0 : Math.sin(a);
    const v = { r: k * Math.max(0, c), l: k * Math.max(0, -c), b: k * Math.max(0, s), t: k * Math.max(0, -s) };
    for (const key of ['t', 'b', 'l', 'r']) {
      const o = Math.round(Math.min(0.6, v[key] * 0.9) * 50) / 50;
      if (o === ST.edges[key]) continue;
      ST.edges[key] = o; if (EL[key]) EL[key].style.opacity = o;
    }
  }
  function senseUpdate(dt, P) {
    let best = null, bd = 140;
    for (const z of G.zombies) {
      if (z.dead || z.state !== 'chase') continue;
      const d = dist(z.x, z.y, P.x, P.y);
      if (d < bd && !G.canSee(z.x, z.y)) { bd = d; best = z; }
    }
    if (!best) { senseSet(0, null); ST.beatT = 0; return; }
    const near = 1 - bd / 140, k = 0.35 + 0.5 * near;
    senseSet(k, Math.atan2(best.y - P.y, best.x - P.x));
    ST.beatT -= dt;
    if (ST.beatT <= 0) { ST.beatT = 1.05 - 0.5 * near; Sound.play('sfx_heart', 0.1 + 0.3 * k, 1); }
  }
  function rush(z, P) {
    z.state = 'chase'; z.lastSeen = { x: P.x, y: P.y }; z.lostT = 0;
    if (ST.rush.some(r => r.z === z)) return;
    ST.rush.push({ z, base: z.spd, t: 0.5 }); z.spd = z.spd * 2.2; ST.rushes++;
  }
  function rushTick(dt) {
    for (let i = ST.rush.length - 1; i >= 0; i--) {
      const r = ST.rush[i]; r.t -= dt;
      if (r.t <= 0 || r.z.dead) { if (!r.z.dead) r.z.spd = r.base; ST.rush.splice(i, 1); }
    }
  }
  function flashOn() {
    const el = ST.flashEl; if (!el) return;
    el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
  }
  // B: the house (overworld) or null on an upper floor, where the ambush spot must be in the same room (LOS)
  function ambush(B, P) {
    const fl = B ? null : G.flCur;
    for (let k = 0; k < 14; k++) {
      const a = Math.random() * TAU2, r = 26 + Math.random() * 18;
      const x = P.x + Math.cos(a) * r, y = P.y + Math.sin(a) * r;
      const spot = B ? World.bldAt(x, y) === B : World.los(P.x, P.y, x, y);
      if (!spot || !World.walkable(Math.floor(x / TILE), Math.floor(y / TILE))) continue;
      const opts = fl ? { state: 'chase', rise: true, inside: true, lvl: fl.lv, floor: fl.f, sbk: fl.key } : { state: 'chase', rise: true };
      const z = typeof G.spawnZombie22 === 'function' ? G.spawnZombie22(x, y, opts) : G.spawnEnemy(R.pick(['walker', 'runner']), x, y, { state: 'chase', rise: true });
      ST.ambush++;
      if (z && typeof z === 'object') rush(z, P);
      return;
    }
  }
  // entering a house (B) or a new upper floor (B null, every enemy counts) with an enemy 180 px away that the player has not seen
  function scareAt(B, P) {
    const near = [];
    for (const z of G.zombies) {
      if (z.dead || dist(z.x, z.y, P.x, P.y) > 180) continue;
      if (B && World.bldAt(z.x, z.y) !== B) continue;
      if (!G.canSee(z.x, z.y)) near.push(z);
    }
    if (!near.length) return;
    ST.lastScare = G.time; ST.scares++;
    G.hitstop = Math.max(G.hitstop || 0, 0.12);
    G.shake(9);
    try { Sfx18.play('scare'); } catch (e) {}
    flashOn();
    for (const z of near) rush(z, P);
    if (Math.random() < 0.25) ambush(B, P);
    Bus21.emit('scare');
  }
  const baseBld = () => { const bp = G.v5 && G.v5.basePos; return bp ? World.bldAt(bp.x, bp.y) : null; };
  function fvTick(dt) {
    rushTick(dt);
    const P = G.player; if (!P) return;
    const coop = typeof Net !== 'undefined' && Net.active && Net.guest;
    const playing = G.state === 'playing' && !P.dead && !coop;
    if (World.mode === 'interior' && G.flCur) {
      // upper floors (v22floors) have no building record, so a new floor is the entry event; lastB is kept
      // so that walking back down into the same ground-floor house is not an entry
      const flk = G.flCur.key + '#' + G.flCur.f;
      const entered = ST.init && flk !== ST.lastFl;
      ST.init = true; ST.lastFl = flk;
      if (playing && CFG.scare && entered && G.time - ST.lastScare >= 60) scareAt(null, P);
    } else {
      // overworld: entering a house (the building under the player changes)
      ST.lastFl = '';
      const B = P.car || P.dead ? null : World.bldAt(P.x, P.y);
      const entered = ST.init && B && B !== ST.lastB;
      ST.init = true; ST.lastB = B;
      if (playing && CFG.scare && entered && B !== baseBld() && B.name !== 'Nơi trú ẩn' && G.time - ST.lastScare >= 60) scareAt(B, P);
    }
    if (playing && CFG.on) senseUpdate(dt, P); else senseSet(0, null);
  }
  const tk = G.v5Tick;
  G.v5Tick = function (dt) { tk.call(this, dt); fvTick(dt); };

  // ---------- settings ----------
  G.fovSet = function (key, on) {
    on = !!on;
    if (key === 'on') CFG.on = on; else if (key === 'scare') CFG.scare = on; else return;
    try { localStorage.setItem(key === 'on' ? 'tt_fov' : 'tt_scare', on ? '1' : '0'); } catch (e) {}
    const cb = document.getElementById(key === 'on' ? 'optFov' : 'optScare'); if (cb) cb.checked = on;
    if (!CFG.on) senseSet(0, null);
  };
  function build() {
    if (document.getElementById('v22fov-css')) return;
    const st = document.createElement('style'); st.id = 'v22fov-css';
    st.textContent = `
#fvE_t,#fvE_b,#fvE_l,#fvE_r{position:fixed;pointer-events:none;opacity:0;z-index:24}
#fvE_t{top:0;left:0;right:0;height:24%;background:linear-gradient(rgba(255,28,28,.8),rgba(255,28,28,0))}
#fvE_b{bottom:0;left:0;right:0;height:24%;background:linear-gradient(rgba(255,28,28,0),rgba(255,28,28,.8))}
#fvE_l{top:0;bottom:0;left:0;width:20%;background:linear-gradient(90deg,rgba(255,28,28,.8),rgba(255,28,28,0))}
#fvE_r{top:0;bottom:0;right:0;width:20%;background:linear-gradient(270deg,rgba(255,28,28,.8),rgba(255,28,28,0))}
#fvFlash{position:fixed;left:0;top:0;right:0;bottom:0;pointer-events:none;opacity:0;z-index:25}
#fvFlash.go{animation:fvFl .55s ease-out both}
@keyframes fvFl{0%{opacity:.9;background:#fff}30%{opacity:.75;background:#ff2a2a}100%{opacity:0;background:#ff2a2a}}`;
    document.head.appendChild(st);
    for (const k of ['t', 'b', 'l', 'r']) { const d = document.createElement('div'); d.id = EDGE[k]; document.body.appendChild(d); EL[k] = d; }
    const fe = document.createElement('div'); fe.id = 'fvFlash'; document.body.appendChild(fe); ST.flashEl = fe;
    const panel = document.querySelector('#settings .panel');
    if (panel && !document.getElementById('optFov')) {
      const before = document.getElementById('btnOffline') || panel.querySelector('button.back');
      const row = (text, id, on, key) => {
        const l = document.createElement('label'); l.innerHTML = `${text} <input type="checkbox" id="${id}">`;
        const cb = l.querySelector('input'); cb.checked = on; cb.onchange = e => G.fovSet(key, e.target.checked);
        panel.insertBefore(l, before);
      };
      row('Tầm nhìn hình nón (không thấy quái ngoài nón)', 'optFov', CFG.on, 'on');
      row('Jumpscare khi vào nhà', 'optScare', CFG.scare, 'scare');
    }
  }
  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
})();
