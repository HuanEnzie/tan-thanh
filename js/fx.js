// ===== Visual effects: particles, slashes, rings, lightning, afterimages, damage numbers =====
const Particles = {
  list: [], cap: 1200,
  add(p) { if (this.list.length < this.cap) this.list.push(p); return p; },
  blood(x, y, ang, n = 10, spd = 140, cols) {
    cols = cols || RL.blood;
    for (let i = 0; i < n; i++) {
      const a = ang + R.range(-0.8, 0.8), s = R.range(0.3, 1) * spd;
      this.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: R.range(0.25, 0.6), max: 0.6, size: R.int(2, 4), col: R.pick(cols), drag: 5, stain: true });
    }
  },
  gibs(x, y, n, cols) {
    cols = cols || RL.blood;
    for (let i = 0; i < n; i++) { const a = R.range(0, TAU), s = R.range(80, 260); this.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: R.range(0.4, 0.8), max: 0.8, size: R.int(3, 6), col: R.pick(cols), drag: 4, stain: true, spin: true }); }
  },
  sparks(x, y, ang, n = 6, cols) {
    for (let i = 0; i < n; i++) {
      const a = ang + Math.PI + R.range(-0.9, 0.9), s = R.range(120, 340);
      this.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: R.range(0.1, 0.28), max: 0.28, size: 2, col: R.pick(cols || ['#ffd36b', '#fff2b0', '#ff9a3c']), drag: 4, streak: true, glow: true });
    }
  },
  burst(x, y, n, col, spd = 220, size = 3) {
    for (let i = 0; i < n; i++) { const a = R.range(0, TAU), s = R.range(0.3, 1) * spd; this.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: R.range(0.2, 0.5), max: 0.5, size: R.int(size - 1, size + 1), col, drag: 4, glow: true }); }
  },
  smoke(x, y, n = 4, col = 'rgba(60,60,60,') {
    for (let i = 0; i < n; i++) this.add({ x: x + R.range(-6, 6), y: y + R.range(-6, 6), vx: R.range(-15, 15), vy: R.range(-30, -5), life: R.range(0.8, 1.6), max: 1.6, size: R.range(6, 14), smoke: col, drag: 1, grow: 10 });
  },
  dust(x, y, n = 3) {
    for (let i = 0; i < n; i++) this.add({ x: x + R.range(-6, 6), y: y + R.range(-3, 3), vx: R.range(-25, 25), vy: R.range(-25, 5), life: R.range(0.3, 0.6), max: 0.6, size: R.range(3, 6), smoke: 'rgba(150,135,110,', drag: 3, grow: 8 });
  },
  fire(x, y, n = 3) {
    for (let i = 0; i < n; i++) this.add({ x: x + R.range(-8, 8), y: y + R.range(-8, 8), vx: R.range(-10, 10), vy: R.range(-50, -15), life: R.range(0.3, 0.7), max: 0.7, size: R.int(3, 6), col: R.pick(['#ffb02e', '#ff6a00', '#ffd85e', '#e8361c']), drag: 1, glow: true });
  },
  ice(x, y, n = 6) { for (let i = 0; i < n; i++) { const a = R.range(0, TAU), s = R.range(40, 140); this.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: R.range(0.3, 0.6), max: 0.6, size: R.int(2, 4), col: R.pick(['#c8f4ff', '#7fdcff', '#ffffff']), drag: 4, glow: true }); } },
  poison(x, y, n = 3) { for (let i = 0; i < n; i++) this.add({ x: x + R.range(-6, 6), y: y + R.range(-6, 6), vx: R.range(-10, 10), vy: R.range(-30, -10), life: R.range(0.4, 0.8), max: 0.8, size: R.int(2, 4), col: R.pick(['#7cf04a', '#3fbf2a', '#b6ff6a']), drag: 1, glow: true }); },
  shell(x, y, ang) {
    const a = ang + Math.PI / 2 + R.range(-0.3, 0.3);
    this.add({ x, y, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, life: 2, max: 2, size: 2, col: '#c9a23a', drag: 6 });
  },
  debris(x, y, n, col) {
    for (let i = 0; i < n; i++) { const a = R.range(0, TAU), s = R.range(60, 220); this.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: R.range(0.4, 0.9), max: 0.9, size: R.int(2, 4), col: col || R.pick(['#5a4a3a', '#3a3a3a', '#7a6a5a']), drag: 4 }); }
  },
  update(dt) {
    const L = this.list;
    for (let i = L.length - 1; i >= 0; i--) {
      const p = L[i];
      p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      const f = Math.max(0, 1 - p.drag * dt); p.vx *= f; p.vy *= f;
      if (p.grow) p.size += p.grow * dt;
      if (p.life <= 0) {
        if (p.stain && Math.random() < 0.45) World.paintSplat(p.x, p.y, p.col, p.size);
        L[i] = L[L.length - 1]; L.pop();
      }
    }
  },
  draw(ctx) {
    let glowMode = false;
    for (const p of this.list) {
      const a = Math.min(1, p.life / p.max * 1.5);
      if (p.smoke) { if (glowMode) { ctx.globalCompositeOperation = 'source-over'; glowMode = false; } ctx.fillStyle = p.smoke + (a * 0.35).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill(); continue; }
      if (!!p.glow !== glowMode) { ctx.globalCompositeOperation = p.glow ? 'lighter' : 'source-over'; glowMode = !!p.glow; }
      ctx.globalAlpha = a;
      ctx.fillStyle = p.col;
      if (p.streak) {
        ctx.strokeStyle = p.col; ctx.lineWidth = p.size;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03); ctx.stroke();
      } else ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  },
};

// shapes that live for a moment: slashes, shockwave rings, lightning, afterimages, light pillars
const FX = {
  list: [],
  ring(x, y, r0, r1, col, dur = 0.35, w = 4) { this.list.push({ t: 'ring', x, y, r0, r1, col, dur, life: dur, w }); },
  slash(x, y, ang, range, arc, col, dur = 0.16, dir = 1) { this.list.push({ t: 'slash', x, y, ang, range, arc, col, dur, life: dur, dir }); },
  bolt(x1, y1, x2, y2, col = '#fff36b', dur = 0.18) {
    const pts = []; const n = Math.max(3, Math.floor(dist(x1, y1, x2, y2) / 18));
    for (let i = 0; i <= n; i++) { const t = i / n; pts.push([lerp(x1, x2, t) + (i && i < n ? R.range(-10, 10) : 0), lerp(y1, y2, t) + (i && i < n ? R.range(-10, 10) : 0)]); }
    this.list.push({ t: 'bolt', pts, col, dur, life: dur });
  },
  ghost(img, x, y, ang, px, col, dur = 0.3) { this.list.push({ t: 'ghost', img, x, y, ang, px, col, dur, life: dur }); },
  pillar(x, y, col, dur = 1.2, w = 26) { this.list.push({ t: 'pillar', x, y, col, dur, life: dur, w }); },
  update(dt) { for (let i = this.list.length - 1; i >= 0; i--) { const f = this.list[i]; f.life -= dt; if (f.life <= 0) this.list.splice(i, 1); } },
  draw(ctx) {
    for (const f of this.list) {
      const k = 1 - f.life / f.dur; // 0 -> 1
      if (f.t === 'ring') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = f.col; ctx.globalAlpha = (1 - k) * 0.9; ctx.lineWidth = f.w * (1 - k) + 1;
        ctx.beginPath(); ctx.arc(f.x, f.y, lerp(f.r0, f.r1, 1 - (1 - k) * (1 - k)), 0, TAU); ctx.stroke();
      } else if (f.t === 'slash') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = (1 - k) * 0.95;
        const a0 = f.ang - f.arc / 2, a1 = f.ang + f.arc / 2;
        const sweep = Math.min(1, k * 3);
        const s0 = f.dir > 0 ? a0 : a1 - (a1 - a0) * sweep, s1 = f.dir > 0 ? a0 + (a1 - a0) * sweep : a1;
        ctx.fillStyle = f.col;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.range, s0, s1);
        ctx.arc(f.x, f.y, f.range * 0.62, s1, s0, true);
        ctx.closePath(); ctx.fill();
        ctx.globalAlpha = (1 - k) * 0.6; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.range, s0, s1); ctx.stroke();
      } else if (f.t === 'bolt') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 1 - k;
        for (const [w, c] of [[5, f.col], [2, '#ffffff']]) {
          ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath();
          f.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
        }
      } else if (f.t === 'ghost') {
        const im = G.whiteOf(f.img, f.col);
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - k) * 0.5;
        ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.ang);
        ctx.drawImage(im, f.px, -im.height / 4, im.width / 2, im.height / 2); ctx.restore();
      } else if (f.t === 'pillar') {
        ctx.globalCompositeOperation = 'lighter';
        const a = Math.sin(k * Math.PI);
        const g = ctx.createLinearGradient(f.x, f.y - 260, f.x, f.y);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, f.col);
        ctx.globalAlpha = a * 0.7; ctx.fillStyle = g;
        ctx.fillRect(f.x - f.w / 2, f.y - 260, f.w, 262);
      }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  },
};

const Floaters = {
  list: [],
  add(x, y, text, col = '#fff', size = 9, big) { if (this.list.length > 80) this.list.shift(); this.list.push({ x, y, text, col, size, life: big ? 1.4 : 1, max: big ? 1.4 : 1, vx: R.range(-14, 14), big }); },
  update(dt) { for (let i = this.list.length - 1; i >= 0; i--) { const f = this.list[i]; f.life -= dt; f.y -= (f.big ? 16 : 30) * dt; f.x += f.vx * dt; if (f.life <= 0) this.list.splice(i, 1); } },
  draw(ctx) {
    ctx.textAlign = 'center';
    for (const f of this.list) {
      const age = f.max - f.life;
      const pop = age < 0.12 ? 1 + (0.12 - age) * 6 : 1;
      ctx.globalAlpha = Math.min(1, f.life * 2.5);
      const sz = Math.round(f.size * pop);
      ctx.font = `${sz}px VT323, monospace`;
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.col; ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  },
};

// floating screen atmosphere per world (ash, rain, petals, motes, mana)
const Ambient = {
  list: [],
  update(dt, W, H) {
    const kind = World.mode === 'dungeon' ? 'dust' : (G.biomeAmb || RL.ambient);
    const want = kind === 'rain' ? 0 : G.lowGfx ? 25 : 55;
    while (this.list.length < want) this.list.push({ x: Math.random() * W, y: Math.random() * H, s: R.range(0.5, 1.5), p: R.range(0, TAU) });
    if (this.list.length > want) this.list.length = want;
    for (const a of this.list) {
      a.p += dt;
      if (kind === 'petals' || kind === 'leaves') { a.x += (30 + Math.sin(a.p) * 20) * a.s * dt * G.dpr; a.y += 40 * a.s * dt * G.dpr; }
      else if (kind === 'snow') { a.x += Math.sin(a.p) * 18 * dt * G.dpr; a.y += 34 * a.s * dt * G.dpr; }
      else if (kind === 'sand') { a.x += 160 * a.s * dt * G.dpr; a.y += Math.sin(a.p * 2) * 10 * dt * G.dpr; }
      else if (kind === 'fog') { a.x += 8 * a.s * dt * G.dpr; }
      else if (kind === 'embers' || kind === 'spores') { a.x += Math.sin(a.p) * 14 * dt * G.dpr; a.y -= (kind === 'embers' ? 40 : 12) * a.s * dt * G.dpr; }
      else if (kind === 'motes' || kind === 'mana') { a.x += Math.sin(a.p * 0.7) * 10 * dt * G.dpr; a.y -= 14 * a.s * dt * G.dpr; }
      else { a.x += (15 + Math.sin(a.p) * 10) * dt * G.dpr; a.y += 12 * a.s * dt * G.dpr; }
      if (a.y > H + 10) a.y = -10; if (a.y < -10) a.y = H + 10; if (a.x > W + 10) a.x = -10; if (a.x < -10) a.x = W + 10;
    }
  },
  draw(ctx) {
    const kind = World.mode === 'dungeon' ? 'dust' : (G.biomeAmb || RL.ambient);
    const d = G.dpr;
    for (const a of this.list) {
      if (kind === 'petals') { ctx.fillStyle = 'rgba(255,170,200,0.75)'; ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.p); ctx.fillRect(-3 * d, -1.5 * d, 6 * d, 3 * d); ctx.restore(); }
      else if (kind === 'motes') { ctx.fillStyle = `rgba(170,255,220,${0.35 + Math.sin(a.p * 3) * 0.25})`; ctx.fillRect(a.x, a.y, 2 * d * a.s, 2 * d * a.s); }
      else if (kind === 'mana') { ctx.fillStyle = `rgba(120,150,255,${0.35 + Math.sin(a.p * 3) * 0.25})`; ctx.fillRect(a.x, a.y, 2 * d * a.s, 2 * d * a.s); }
      else if (kind === 'leaves') { ctx.fillStyle = a.s > 1 ? 'rgba(220,90,30,0.8)' : 'rgba(240,160,40,0.75)'; ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.p * 2); ctx.fillRect(-3 * d, -2 * d, 6 * d, 4 * d); ctx.restore(); }
      else if (kind === 'snow') { ctx.fillStyle = 'rgba(245,250,255,0.85)'; ctx.fillRect(a.x, a.y, 2.5 * d * a.s, 2.5 * d * a.s); }
      else if (kind === 'sand') { ctx.fillStyle = 'rgba(230,170,90,0.35)'; ctx.fillRect(a.x, a.y, 14 * d * a.s, 1.2 * d); }
      else if (kind === 'fog') { ctx.fillStyle = 'rgba(190,210,190,0.05)'; ctx.beginPath(); ctx.arc(a.x, a.y, 70 * d * a.s, 0, TAU); ctx.fill(); }
      else if (kind === 'embers') { ctx.fillStyle = `rgba(255,${120 + Math.floor(Math.sin(a.p * 4) * 60)},40,0.8)`; ctx.fillRect(a.x, a.y, 2 * d, 2 * d); }
      else if (kind === 'spores') { ctx.fillStyle = a.s > 1 ? `rgba(120,255,240,${0.4 + Math.sin(a.p * 3) * 0.3})` : `rgba(220,140,255,${0.4 + Math.sin(a.p * 3) * 0.3})`; ctx.fillRect(a.x, a.y, 2.5 * d, 2.5 * d); }
      else if (kind === 'dust') { ctx.fillStyle = 'rgba(200,190,170,0.25)'; ctx.fillRect(a.x, a.y, 1.5 * d, 1.5 * d); }
      else { ctx.fillStyle = 'rgba(200,190,180,0.3)'; ctx.fillRect(a.x, a.y, 2 * d * a.s, 2 * d * a.s); }
    }
  },
};
