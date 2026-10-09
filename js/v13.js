// ===== v13: damage numbers from a pre-rendered bitmap font (screen space, above night lighting) + crit bursts =====
// Cheap by design: one glyph texture for every number (batched in WebGL), hits on the same target merge into one
// rising number (longer window on bosses and damage-over-time), a hard cap on live numbers, crit FX rate-limited.
const DmgNum = {
  CH: '0123456789.kM!',
  // fill, outline per style: 0 normal, 1 crit, 2 summons/allies, 3 burn, 4 poison, 5 damage taken
  ST: [['#ffffff', '#1a1a22'], ['#ffe14a', '#b3260a'], ['#cdbdff', '#24164a'], ['#ffa040', '#4a1a00'], ['#9cf05a', '#10340a'], ['#ff5a5a', '#3a0000']],
  CW: 26, CHH: 40, MAX: 56,
  list: [], bursts: [], sheet: null, adv: null, critT: [], shakeT: 0,
  build() {
    const c = this.sheet || (this.sheet = document.createElement('canvas'));
    c.width = this.CW * this.CH.length; c.height = this.CHH * this.ST.length;
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    g.font = '36px VT323, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    this.adv = [...this.CH].map(ch => Math.min(this.CW, Math.ceil(g.measureText(ch).width) + 4));
    this.ST.forEach(([fill, line], r) => {
      for (let i = 0; i < this.CH.length; i++) {
        const x = i * this.CW + this.CW / 2, y = r * this.CHH + this.CHH / 2 + 1;
        g.lineWidth = 6; g.strokeStyle = line; g.strokeText(this.CH[i], x, y);
        g.fillStyle = fill; g.fillText(this.CH[i], x, y);
        if (r === 1) { g.globalAlpha = 0.45; g.fillStyle = '#fff'; g.fillText(this.CH[i], x, y - 3); g.globalAlpha = 1; }
      }
    });
    // 4-point star flash for crits
    const s = this.star || (this.star = document.createElement('canvas')); s.width = s.height = 64;
    const q = s.getContext('2d'), rg = q.createRadialGradient(32, 32, 0, 32, 32, 32);
    rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.25, 'rgba(255,240,170,0.8)'); rg.addColorStop(1, 'rgba(255,170,40,0)');
    q.fillStyle = rg; q.beginPath();
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, r = k % 2 ? 7 : 32; q.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); }
    q.fill();
    if (typeof ctx !== 'undefined' && ctx.dirty) { ctx.dirty(c); ctx.dirty(s); }
  },
  fmt(v) { return v >= 1e6 ? (v / 1e6).toFixed(v >= 1e7 ? 0 : 1) + 'M' : v >= 1e4 ? Math.round(v / 1e3) + 'k' : v >= 1000 ? (v / 1e3).toFixed(1) + 'k' : String(Math.round(v)); },
  hit(z, dmg, crit, src) {
    if (!(dmg > 0)) return;
    const st = src === 'hurt' ? 5 : crit ? 1 : src === 'ally' ? 2 : src === 'fire' ? 3 : src === 'poison' ? 4 : 0;
    // merge window: damage over time and bosses collect hits into one number
    const win = st >= 3 ? 0.6 : z.boss ? 0.32 : 0.1;
    const slot = z._dn || (z._dn = []), e = slot[st];
    if (e && !e.dead && e.age < win) { e.val += dmg; e.pop = 0; e.n++; return; }
    if (this.list.length >= this.MAX) { const o = this.list.shift(); o.dead = true; }
    // bosses and the hero keep their number above them while it collects hits
    const f = z.boss || st === 5 ? z : null;
    const n = { f, x: f ? R.range(-14, 14) : z.x + R.range(-10, 10), y: f ? -(z.r || 12) - 12 : z.y - z.r - 8, val: dmg, st, age: 0, pop: 0, n: 1, life: crit ? 1.05 : st >= 3 ? 0.9 : 0.75, vx: R.range(-18, 18), big: z.boss ? 1.3 : 1, dead: false };
    slot[st] = n; this.list.push(n);
  },
  clear() { for (const e of this.list) e.dead = true; this.list.length = 0; this.bursts.length = 0; },
  crit(z, ang) {
    const t = G.time;
    if (t - (z._cfx || 0) < 0.12) return;
    // at most 6 crit bursts per 0.1 s across the screen
    this.critT = this.critT.filter(x => t - x < 0.1); if (this.critT.length >= 6) return;
    this.critT.push(t); z._cfx = t;
    this.bursts.push({ x: z.x, y: z.y, age: 0, life: 0.22, s: 0.9 + z.r / 28, rot: R.range(0, 1) });
    if (FX.anim) FX.anim('hit', z.x, z.y, { size: 54 + z.r * 2.4, dur: 0.26 });
    FX.ring(z.x, z.y, 6, 30 + z.r * 1.4, '#ffe9a0', 0.22, 3);
    if (t - this.shakeT > 0.15) { this.shakeT = t; G.shake(z.boss ? 3.5 : 2); }
  },
  draw(c) {
    if (!this.list.length && !this.bursts.length) return;
    if (!this.sheet) this.build();
    const dt = Math.min(0.05, G.rdt || 1 / 60), Z = G.zoom, cx = G.camera.x, cy = G.camera.y, W2 = canvas.width / 2, H2 = canvas.height / 2;
    const unit = (G.dpr || 1) * Math.max(0.9, Math.min(1.5, Z / (G.dpr || 1)));
    // crit star flashes
    if (this.bursts.length) {
      c.globalCompositeOperation = 'lighter';
      for (let i = this.bursts.length - 1; i >= 0; i--) {
        const b = this.bursts[i]; b.age += dt;
        if (b.age >= b.life) { this.bursts.splice(i, 1); continue; }
        const k = b.age / b.life, sz = (40 + 70 * k) * b.s * unit, x = (b.x - cx) * Z + W2, y = (b.y - cy) * Z + H2;
        c.globalAlpha = 1 - k * k;
        c.setTransform(1, 0, 0, 1, x, y); c.rotate(b.rot + k * 0.6);
        c.drawImage(this.star, -sz / 2, -sz / 2, sz, sz);
      }
      c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over';
    }
    const S = this.sheet, CW = this.CW, CHH = this.CHH, adv = this.adv, CH = this.CH;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const e = this.list[i];
      e.age += dt; e.pop += dt;
      if (e.age >= e.life + Math.min(0.5, e.n * 0.03)) { e.dead = true; this.list.splice(i, 1); continue; }
      if (e.val < 1) continue;
      const left = e.life + Math.min(0.5, e.n * 0.03) - e.age;
      e.y -= (e.st === 1 ? 26 : 34) * dt; e.x += e.vx * dt; e.vx *= 0.96;
      const base = (e.st === 1 ? 28 : e.st >= 3 && e.st <= 4 ? 14 : e.st === 2 ? 15 : 18) * e.big * (1 + Math.min(0.35, e.n * 0.02));
      const pop = e.pop < 0.14 ? 1 + (0.14 - e.pop) / 0.14 * (e.st === 1 ? 0.9 : 0.45) : 1;
      const h = base * pop * unit, w = h * CW / CHH;
      const txt = this.fmt(e.val) + (e.st === 1 ? '!' : '');
      let tw = 0; for (const ch of txt) tw += adv[CH.indexOf(ch)];
      const wx = e.f ? e.f.x + e.x : e.x, wy = e.f ? e.f.y + e.y : e.y;
      let x = (wx - cx) * Z + W2 - tw * h / CHH / 2, y = (wy - cy) * Z + H2 - h / 2;
      if (e.st === 1 && e.pop < 0.14) { x += R.range(-2, 2) * unit; y += R.range(-2, 2) * unit; }
      c.globalAlpha = Math.min(1, left * 3.5);
      for (const ch of txt) {
        const k = CH.indexOf(ch), a = adv[k] * h / CHH;
        c.drawImage(S, k * CW + (CW - adv[k]) / 2, e.st * CHH, adv[k], CHH, x, y, a, h);
        x += a * 0.92;
      }
    }
    c.globalAlpha = 1;
  },
};

(function () {
  DmgNum.build();
  if (document.fonts && document.fonts.load) document.fonts.load('36px VT323').then(() => DmgNum.build()).catch(() => {});
  // damage the player takes, in red over the hero
  const hp = G.hurtPlayer;
  G.hurtPlayer = function (dmg, src, silent) {
    const P = this.player, h0 = P && P.hp;
    const r = hp.call(this, dmg, src, silent);
    if (P && !silent && h0 - P.hp >= 1) DmgNum.hit(P, h0 - P.hp, false, 'hurt');
    return r;
  };
  // draw after the night lighting and tints so numbers stay readable
  const det = drawEventTint;
  drawEventTint = function () { det(); DmgNum.draw(ctx); };
  // Floaters: keep one font per size and scale the pop with the transform (no new text textures every frame)
  Floaters.draw = function (c) {
    c.textAlign = 'center';
    for (const f of this.list) {
      const age = f.max - f.life, pop = age < 0.12 ? 1 + (0.12 - age) * 6 : 1;
      c.globalAlpha = Math.min(1, f.life * 2.5);
      c.font = `${f.size}px VT323, monospace`;
      if (pop !== 1) { c.save(); c.translate(f.x, f.y); c.scale(pop, pop); c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,0.85)'; c.strokeText(f.text, 0, 0); c.fillStyle = f.col; c.fillText(f.text, 0, 0); c.restore(); }
      else { c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,0.85)'; c.strokeText(f.text, f.x, f.y); c.fillStyle = f.col; c.fillText(f.text, f.x, f.y); }
    }
    c.globalAlpha = 1;
  };
  const reset = G.newGame;
  G.newGame = function () { DmgNum.clear(); return reset.apply(this, arguments); };
})();
