// ===== v17: summon leash (range grows with level), tier auras, the map is free again =====
const SH_ORDER_COL = () => SH_TIER;
Object.assign(G, {
  // how far from you the summons act (fight, fetch loot): 280 px at level 1, +24 px per level
  shLeash() { const L = this.player ? this.player.level : 1; return Math.min(1500, 280 + 24 * L); },
  // how far a summon may be sent exploring, in superblocks: 3 at level 1, +1 per 3 levels
  shExploreMax() { const L = this.player ? this.player.level : 1; return 3 + Math.floor(L / 3); },
  regionLocked() { return false },
});

(function () {
  // summons only fight what is inside the leash and walk back when you outrun them
  const au = Ally.prototype.update;
  Ally.prototype.update = function (dt) {
    if (this.kind === 'shadow' && !this.dead && !this.recalled) {
      const P = G.player, R0 = G.shLeash(), d = dist(this.x, this.y, P.x, P.y);
      this._leash = R0;
      if (d > R0 * 1.25) {
        const a = Math.atan2(P.y - this.y, P.x - this.x), sp = Math.min(520, 200 + (d - R0) * 0.6);
        this.x += Math.cos(a) * sp * dt; this.y += Math.sin(a) * sp * dt; this.angle = a; this.walkT += dt * 14;
        this.lootIt = null; this.chopP = null;
        return;
      }
    }
    return au.call(this, dt);
  };
  const ne = Ally.prototype.nearestEnemy;
  Ally.prototype.nearestEnemy = function (range) {
    if (this.kind !== 'shadow' || !this._leash) return ne.call(this, range);
    const P = G.player; let best = null, bd = range;
    for (const z of G.zgrid.query(this.x, this.y, range)) {
      if (z.dead || z.rise > 0 || dist(z.x, z.y, P.x, P.y) > this._leash) continue;
      const d = dist(this.x, this.y, z.x, z.y);
      if (d < bd && World.los(this.x, this.y, z.x, z.y)) { bd = d; best = z; }
    }
    return best;
  };
  // a coloured ring under every summon: purple soldier, yellow elite, orange chief, red sovereign
  const ad = Ally.prototype.draw;
  Ally.prototype.draw = function (c) {
    if (this.kind === 'shadow' && !this.dead) {
      const t = this.stier || 'normal', T = SH_TIER[t];
      c.globalAlpha = 0.5 + Math.sin(G.time * 5 + this.x) * 0.12; c.strokeStyle = T.col; c.lineWidth = t === 'normal' ? 1.5 : 2.5;
      c.beginPath(); c.ellipse(this.x, this.y + 6, 13 + (t === 'boss' ? 9 : t === 'mini' ? 6 : t === 'elite' ? 3 : 0), 7 + (t === 'boss' ? 4 : t === 'mini' ? 3 : 0), 0, 0, TAU); c.stroke(); c.globalAlpha = 1;
    }
    return ad.call(this, c);
  };
  // exploring is capped by level
  const et = G.exploreTo;
  G.exploreTo = function (s, tx, ty) {
    const P = this.player, d = dist(P.x, P.y, tx, ty), max = this.shExploreMax() * SBPX;
    if (d > max) { this.toast(`Quá xa! ${SM().unit} ở cấp ${P.level} chỉ khám phá được trong ${this.shExploreMax()} ô vùng (~${Math.round(max / TILE)}m). Lên cấp để đi xa hơn.`, 'warn'); return false; }
    return et.call(this, s, tx, ty);
  };
})();
