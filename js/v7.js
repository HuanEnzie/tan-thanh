// ===== v7: sprite VFX (animated sheets), projectile sprites, biome monsters, pixel icons + UI frames =====
const ANIM = {
  exp: { dur: 0.55 }, slash: { dur: 0.2 }, hit: { dur: 0.22 }, frost: { dur: 0.6 }, bolt: { dur: 0.35 }, meteor: { dur: 0.6 },
  vortex: { dur: 0.55, loop: true }, heal: { dur: 0.75 }, portal: { dur: 0.9 }, lvl: { dur: 1.0 }, fire: { dur: 0.45, loop: true }, poison: { dur: 0.7, loop: true },
};
const BIOME_MON = { snow: 0, desert: 1, swamp: 2, volcano: 3, forest: 4, jungle: 4, autumn: 4, grave: 5 };
const BIOME_MON_NAMES = {
  md: ['Xác sống băng giá', 'Xác ướp sa mạc', 'Xác sình lầy', 'Xác cháy', 'Xác dây leo', 'Ma xương'],
  tt: ['Tuyết Yêu', 'Kim Hạt Yêu', 'Thuỷ Xà Yêu', 'Hoả Tích Dịch', 'Thụ Yêu', 'Cương Thi'],
  sl: ['Golem Băng', 'Bọ Cạp Giáp', 'Người Thằn Lằn', 'Chó Địa Ngục', 'Nhện Rừng', 'Hiệp Sĩ Xương'],
};
const ULT_ICON = { md: 'ic_0', tt: 'ic_1', sl: 'ic_2' };

// draw one frame of an animation, centred at x,y, `size` = longest side in world px
function drawAnim(ctx, name, k, x, y, size, rot, flip, alpha, add) {
  const A = ANIM[name]; if (!A) return false;
  const i = Math.max(0, Math.min(5, Math.floor(k * 6)));
  const im = IMG[`fx_${name}_${i}`]; if (!im) return false;
  const s = size / Math.max(im.width, im.height), w = im.width * s, h = im.height * s;
  ctx.save();
  if (add ?? A.add) ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha ?? 1;
  ctx.translate(x, y); if (rot) ctx.rotate(rot); if (flip) ctx.scale(1, -1);
  ctx.drawImage(im, -w / 2, -h / 2, w, h);
  ctx.restore();
  return true;
}
const loopK = (name, t) => ((t / ANIM[name].dur) % 1 + 1) % 1;

(function () {
  // ---------- assets ----------
  const _ri = realmImages;
  realmImages = function (r) { const out = _ri(r); out.push('atlas8_fx', 'atlas8_common', 'atlas8_' + rk(r)); return out; };

  // ---------- FX: animated sprites ----------
  FX.anim = function (name, x, y, o = {}) {
    if (!ANIM[name] || !IMG[`fx_${name}_0`]) return false;
    if (this.list.length > 220) return false;
    const dur = o.dur || ANIM[name].dur;
    this.list.push({ t: 'anim', name, x, y, size: o.size || 100, rot: o.rot || 0, flip: !!o.flip, dur, life: dur, add: o.add, alpha: o.alpha ?? 1, follow: o.follow || null, oy: o.oy || 0 });
    return true;
  };
  const fd = FX.draw;
  FX.draw = function (ctx) {
    fd.call(this, ctx);
    for (const f of this.list) {
      if (f.t !== 'anim') continue;
      const k = 1 - f.life / f.dur;
      const x = f.follow ? f.follow.x : f.x, y = (f.follow ? f.follow.y : f.y) + f.oy;
      drawAnim(ctx, f.name, k, x, y, f.size, f.rot, f.flip, f.alpha, f.add);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  };
  // melee arcs → the slash sheet (crescent on the right, sweeping top→bottom)
  const fslash = FX.slash;
  FX.slash = function (x, y, ang, range, arc, col, dur = 0.16, dir = 1) {
    if (!IMG.fx_slash_0) return fslash.call(this, x, y, ang, range, arc, col, dur, dir);
    const r = range * 0.62;
    this.anim('slash', x + Math.cos(ang) * r, y + Math.sin(ang) * r, { size: Math.max(60, range * 1.35), rot: ang, flip: dir < 0, dur: Math.max(0.16, dur * 1.2) });
    if (col && !/^#?(fff|ffffff|cfe8ff|bfefff|d8c9a8)/i.test(String(col).replace('rgba', ''))) fslash.call(this, x, y, ang, range, arc * 0.8, col, dur * 0.8, dir);
  };
  const fbolt = FX.bolt;
  FX.bolt = function (x1, y1, x2, y2, col, dur) { fbolt.call(this, x1, y1, x2, y2, col, dur); this.anim('bolt', x2, y2 - 46, { size: 120 }); };
  const fpil = FX.pillar;
  FX.pillar = function (x, y, col, dur = 1.2, w = 26) {
    const c = String(col).toLowerCase();
    if (/ffe6a0|ffd65a/.test(c) && this.anim('lvl', x, y - 64, { size: Math.max(150, w * 3.2), dur: Math.min(1.4, Math.max(0.8, dur)) })) return;
    if (/7dc8ff|7dd8ff/.test(c) && this.anim('portal', x, y - 64, { size: Math.max(150, w * 3.4), dur: Math.min(1.2, Math.max(0.7, dur)) })) return;
    return fpil.call(this, x, y, col, dur, w);
  };

  // explosions, hits, skills
  const ex = G.explode;
  G.explode = function (x, y, r, dmg, fromPlayer, quiet) {
    const res = ex.call(this, x, y, r, dmg, fromPlayer, quiet);
    FX.anim('exp', x, y - r * 0.12, { size: Math.max(90, r * 2.2) });
    return res;
  };
  let hitN = 0, hitT = 0;
  const he = G.hitEnemy;
  G.hitEnemy = function (z, dmg, kx, ky, src, ang, wp) {
    const r = he.call(this, z, dmg, kx, ky, src, ang, wp);
    if (this.time - hitT > 0.05) { hitT = this.time; hitN = 0; }
    if (z && hitN++ < 4 && src !== 'net') FX.anim('hit', z.x + R.range(-6, 6), z.y + R.range(-8, 4), { size: z.boss ? 70 : 44 });
    return r;
  };
  const cv = G.castV6;
  if (cv) G.castV6 = function (i) {
    const id = SKILLS[i].id, P = this.player;
    if (id === 'frost') FX.anim('frost', P.x, P.y, { size: 560, dur: 0.7, alpha: 0.9 });
    if (id === 'heal') FX.anim('heal', P.x, P.y - 40, { size: 190, follow: null });
    return cv.call(this, i);
  };
  // meteors (skill + meteor shower): the sheet animates the fall and the impact
  const dm = drawMeteors;
  drawMeteors = function (ctx) {
    if (!IMG.fx_meteor_0) return dm(ctx);
    for (const m of G.meteors || []) {
      const k = 1 - Math.max(0, m.t) / 0.7;
      drawAnim(ctx, 'meteor', Math.min(0.49, k * 0.5), m.x + 26, m.y - 70, m.big ? 170 : 120);
    }
  };
  // poison pools
  const td = Throws.draw;
  Throws.draw = function (ctx) {
    td.call(this, ctx);
    if (!IMG.fx_poison_0) return;
    for (const a of this.acids) drawAnim(ctx, 'poison', loopK('poison', G.time + a.x * 0.001), a.x, a.y, a.r * 2.4, 0, false, Math.min(0.7, a.life / Math.max(0.01, a.max) + 0.15));
  };

  // ---------- projectiles ----------
  const PJ = { bullet: 'pj_0', laser: 'pj_3', arrow: 'pj_4', talisman: 'pj_5', sword: 'pj_8' };
  const pjOf = b => {
    if (b.proj === 'eshot') return rk(RL.id) === 'md' ? 'pj_9' : 'pj_10';
    if (b.proj === 'orb') { const c = String(b.col || '').toLowerCase(); return /5affc8|7dffd8/.test(c) ? 'pj_6' : /6bb6ff|3cf0ff/.test(c) ? 'pj_7' : /6b5bff|b46bff/.test(c) ? 'pj_10' : null; }
    return PJ[b.proj] || null;
  };
  const LEN = { pj_0: 30, pj_3: 40, pj_4: 30, pj_5: 26, pj_6: 30, pj_7: 28, pj_8: 42, pj_9: 26, pj_10: 30 };
  const bd = Bullets.draw;
  Bullets.draw = function (ctx) {
    const all = this.list, rest = [];
    for (const b of all) {
      const n = pjOf(b), im = n && IMG[n];
      if (!im) { rest.push(b); continue; }
      const a = Math.atan2(b.vy, b.vx), L = (LEN[n] || 30) * (b.size || 1) * (b.proj === 'eshot' ? 1.1 : 1);
      const s = L / im.width, w = im.width * s, h = im.height * s;
      if (b.proj === 'orb' || b.proj === 'eshot' || b.proj === 'talisman') {
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35;
        const gl = GLOW[b.proj === 'eshot' ? 'red' : b.proj === 'talisman' ? 'fire' : 'cyan'] || GLOW.white;
        ctx.drawImage(gl, b.x - L * 0.7, b.y - L * 0.7, L * 1.4, L * 1.4);
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      }
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(a);
      ctx.drawImage(im, -w * 0.75, -h / 2, w, h);
      ctx.restore();
    }
    if (rest.length) { this.list = rest; try { bd.call(this, ctx); } finally { this.list = all; } }
  };

  // ---------- biome monsters ----------
  const se = G.spawnEnemy;
  G.spawnEnemy = function (arche, x, y, o) {
    const z = se.call(this, arche, x, y, o);
    if (World.mode === 'over' && !z.boss && !(o && o.bossDef) && ['walker', 'runner', 'armored', 'ranged', 'brute'].includes(arche) && Math.random() < 0.55) {
      const b = World.bioAt ? World.bioAt(Math.floor(x / TILE), Math.floor(y / TILE)) : null;
      const i = BIOME_MON[b];
      const k = rk(RL.id), img = `${k}_bm_${i}`;
      if (i != null && IMG[img]) { z.img = img; z.name = BIOME_MON_NAMES[k][i]; if (arche === 'brute') z.scale = (z.scale || 1) * 1.35; }
    }
    return z;
  };

  // ---------- icons on the phone HUD ----------
  const ICON_OF = { pause: 'ic_3', map: 'ic_4', inv: 'ic_5', more: 'ic_6', base: 'ic_7', gacha: 'ic_8', craft: 'ic_9', chat: 'ic_10', fs: 'ic_11' };
  let iconsDone = false;
  const applyIcons = () => {
    if (iconsDone || !IMG.ic_3 || !IMG.ic_3.src) return;
    iconsDone = true;
    document.querySelectorAll('#tmenu [data-a]').forEach(b => {
      const n = ICON_OF[b.dataset.a]; if (!n || !IMG[n]) return;
      const span = b.querySelector('span');
      const label = span ? span.outerHTML : '';
      b.innerHTML = `<img class="tic" src="${IMG[n].src}" alt="">${label}`;
      b.classList.add('hasic');
    });
    const dash = document.getElementById('tDash');
    if (dash && IMG.ic_14) dash.insertAdjacentHTML('afterbegin', `<img class="tic" src="${IMG.ic_14.src}" alt="">`);
    const sk = document.getElementById('tSkill');
    if (sk) sk.insertAdjacentHTML('afterbegin', '<img class="tic" id="tSkillIc" alt="">');
  };
  setInterval(() => {
    applyIcons();
    const ic = document.getElementById('tSkillIc');
    if (ic && G.v6 && RL) {
      const n = ULT_ICON[rk(RL.id)];
      const src = IMG[n] && IMG[n].src; if (src && ic.src !== src) ic.src = src;
    }
  }, 500);
})();

// skill visuals that live in v6's world-space pass: vortex + ring of fire
(function () {
  const dv = drawV6World;
  drawV6World = function () {
    const F = G.v6fx, P = G.player;
    if (F && IMG.fx_vortex_0) {
      const holes = F.holes; F.holes = [];
      const inf = F.infT; F.infT = 0;
      dv();
      F.holes = holes; F.infT = inf;
      for (const h of holes) { const k = 1 - h.t / h.max; drawAnim(ctx, 'vortex', loopK('vortex', G.time), h.x, h.y, 150 + k * 140, G.time * 2, false, 0.95, false); }
      if (inf > 0 && P) for (let j = 0; j < 2; j++) drawAnim(ctx, 'fire', loopK('fire', G.time + j * 0.2), P.x, P.y, 300 - j * 60, j * 0.8, false, 0.9);
      return;
    }
    dv();
  };
})();
