// ===== v8: 4-frame animations (walk / run / float) for enemies, bosses, NPCs, heroes + outfits, pets, mounts =====
// Frames are IMG entries named <sprite>_w0..3 (from the atlas9_* atlases). Missing frames fall back to the still sprite.
const animFrame = (base, phase) => { if (!base) return base; const n = base + '_w' + (((phase | 0) % 4 + 4) % 4); return IMG[n] ? n : base; };
const stepPhase = walkT => Math.floor((walkT || 0) / 1.5708);

(function () {
  const _ri = realmImages;
  realmImages = function (r) { const out = _ri(r); out.push('atlas9_' + rk(r), 'atlas9_common'); return out; };

  // enemies + bosses: step frames follow the walk timer (it only advances while moving)
  const ed = Enemy.prototype.draw;
  Enemy.prototype.draw = function (ctx) {
    const base = this.img;
    if (!this.dead && !this.rise) this.img = animFrame(base, stepPhase(this.walkT));
    try { ed.call(this, ctx); } finally { this.img = base; }
  };
  // allies: companions, villagers, residents, merchants, civilians, shadow soldiers
  const ad = Ally.prototype.draw;
  Ally.prototype.draw = function (ctx) {
    const base = this.img;
    if (!this.downed && !this.dead) this.img = animFrame(base, stepPhase(this.walkT));
    try { ad.call(this, ctx); } finally { this.img = base; }
  };
  // hero: the weapon/outfit sprite gets the step frame for this draw only
  const pd = Player.prototype.draw;
  Player.prototype.draw = function (ctx) {
    const moving = Math.hypot(this.vx, this.vy) > 25;
    const w = this.wdef, base = w.sprite;
    const ph = this.riding ? 0 : moving ? stepPhase(this.walkT * 1.6) : 0;
    const fr = animFrame(base, ph);
    // the mount swaps its own image for the run frame
    let mk = null, mim = null;
    if (this.riding && G.activePet != null) { mk = 'mount_' + G.activePet; mim = IMG[mk]; const n = animFrame(mk, moving ? Math.floor(G.time * 10) : 0); if (n !== mk) IMG[mk] = IMG[n]; }
    const keep = IMG[base];
    if (fr !== base) IMG[base] = IMG[fr];
    try { pd.call(this, ctx); } finally { IMG[base] = keep; if (mk) IMG[mk] = mim; }
  };
  // pets float on a gentle 6 fps loop
  const dp = drawPet;
  drawPet = function (ctx) {
    const e = G.petE; if (!e) return dp(ctx);
    const k = 'pet_' + e.i, keep = IMG[k], n = animFrame(k, Math.floor(G.time * 6 + e.i));
    if (n !== k) IMG[k] = IMG[n];
    try { dp(ctx); } finally { IMG[k] = keep; }
  };
})();
