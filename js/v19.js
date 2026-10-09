// ===== v19: sea creatures can be saved as shadows (summoned only at sea), and any big enough shadow can be ridden instead of a pet =====
const RIDE_MIN_R = 15; // collision radius needed to carry a rider
const rideK = s => Math.max(1.05, Math.min(2.5, 0.95 + (s.spd || 90) / 100)) * (1 + 0.015 * (G.shStats(s).slv - 1));

Object.assign(G, {
  inSea() { const P = this.player; if (!P || World.mode !== 'over') return false; if (P.boat) return true; const t = World.get(Math.floor(P.x / TILE), Math.floor(P.y / TILE)); return t === T.WATER || t === T.DEEP; },
  rideShadowOf(id) { return id != null ? this.shById(id) : null; },
  canRide(s) { return !!(s && s.ride); },
  // ---------- mounting ----------
  rideShadow(s) {
    const P = this.player;
    if (!s || P.dead || P.car || P.boat) return false;
    if (!s.ride) { this.toast(`${s.nick || s.name} quá nhỏ để cưỡi.`, 'warn'); return false; }
    if (this.shBusy(s)) { this.toast(`${s.nick || s.name} đang bận — gọi về trước.`, 'warn'); return false; }
    if (s.aqua && !this.inSea()) { this.toast('Thủy tộc chỉ cưỡi được khi bạn đang ở dưới nước.', 'warn'); return false; }
    if (!s.aqua && World.mode === 'over' && this.inSea()) { this.toast('Thú cưỡi trên cạn không bơi được.', 'warn'); return false; }
    if (this.player.riding) this.dismount();
    let a = this.shadowAlly(s);
    if (!a) { const r = this.summonShadow(s); if (r !== 'ok') { if (r === 'mana') this.toast(`Không đủ ${manaName()} để gọi ${s.nick || s.name}.`, 'warn'); else if (r === 'cd') this.toast(`${s.nick || s.name} đang hồi phục.`, 'warn'); return false; } a = this.shadowAlly(s); }
    if (!a) return false;
    P.shRide = { id: s.id, k: rideK(s), aqua: !!s.aqua }; P.aqua = !!s.aqua; P._stam0 = P.stamina;
    a.riden = true; a.home = { x: a.x, y: a.y }; a.lootIt = null; a.chopP = null;
    FX.ring(P.x, P.y, 8, 80, SH_TIER[s.tier].col, 0.4, 5); Sound.play('sfx_dash', 0.6, 0.7); Particles.burst(P.x, P.y, 10, SM().col, 120);
    this.toast(`🐎 Cưỡi ${s.nick || s.name}: tốc độ ×${rideK(s).toFixed(1)}, không tốn thể lực. Nhấn Z để xuống.`, 'good');
    UI.dirty = true; return true;
  },
  dismountShadow(silent) {
    const P = this.player; if (!P || !P.shRide) return;
    const id = P.shRide.id, aq = P.shRide.aqua, a = this.allies.find(x => x.sid === id && !x.dead);
    P.shRide = null; P.aqua = !!P.boat;
    if (a) { a.riden = false; a.home = null; a.x = P.x + 24; a.y = P.y + 10; }
    // an aquatic mount leaves you on the nearest bank
    if (aq && !P.boat && World.mode === 'over' && this.inSea()) {
      let best = null, bd = 1e9;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const tx = Math.floor(P.x / TILE) + dx, ty = Math.floor(P.y / TILE) + dy, t = World.get(tx, ty); if (t === T.WATER || t === T.DEEP || World.isSolidT(t) || !World.walkable(tx, ty)) continue; const d = Math.hypot(dx, dy); if (d < bd) { bd = d; best = [tx * TILE + 16, ty * TILE + 16]; } }
      if (best) { P.x = best[0]; P.y = best[1]; }
    }
    if (!silent) this.toast('Bạn xuống khỏi thú cưỡi.', 'info');
    UI.dirty = true;
  },
  setMount(s) { const v = this.v10; v.mountId = v.mountId === s.id ? null : s.id; this.toast(v.mountId ? `🐎 ${s.nick || s.name} là thú cưỡi của bạn — nhấn Z / nút 🐾 để cưỡi (thay cho thú cưng).` : 'Đã bỏ thú cưỡi bóng, Z lại cưỡi thú cưng.', 'info'); UI.dirty = true; },
});

(function () {
  // ---------- what a corpse remembers ----------
  const ke = G.killEnemy;
  G.killEnemy = function (z, src) {
    ke.call(this, z, src);
    const c = this.corpses[this.corpses.length - 1];
    if (c && c.x === z.x && c.y === z.y) { c.aqua = !!z.aqua; c.sea = z.sea; c.spd = Math.round(z.spd || 60); c.rr = z.r || 12; }
  };
  // ---------- saving it ----------
  const ex = G.extractShadow;
  G.extractShadow = function (c) {
    const n0 = this.v10.shadows.length, a0 = this.allies.length, r = ex.call(this, c);
    const s = this.v10.shadows.length > n0 ? this.v10.shadows[this.v10.shadows.length - 1] : null;
    if (s) { s.aqua = !!c.aqua; s.sea = c.sea; s.spd = c.spd || 60; s.rr = c.rr || 12; s.ride = s.rr >= RIDE_MIN_R; if (s.ride) this.toast(`🐎 ${s.name} đủ lớn để cưỡi (×${rideK(s).toFixed(1)} tốc độ).`, 'info'); if (s.aqua) this.toast('🌊 Bóng thủy tộc chỉ gọi được khi bạn ở dưới nước hoặc trên thuyền.', 'info'); }
    for (let i = a0; i < this.allies.length; i++) { const a = this.allies[i]; if (a.kind === 'shadow') a.aqua = !!c.aqua; }
    return r;
  };
  // ---------- summoning ----------
  const ss = G.summonShadow;
  G.summonShadow = function (s, free) {
    if (s && s.aqua && !free && !this.inSea()) { this._landN = (this._landN || 0) + 1; return 'land'; }
    const r = ss.call(this, s, free);
    if (r === 'ok' && s.aqua) { const a = this.shadowAlly(s); if (a) a.aqua = true; }
    return r;
  };
  const sa = G.summonAll;
  G.summonAll = function (o) {
    this._landN = 0; const r = sa.call(this, o);
    if (this._landN) this.toast(`🌊 ${this._landN} bóng thủy tộc chỉ gọi được khi bạn ở dưới nước.`, 'info');
    return r;
  };
  const au = Ally.prototype.update;
  Ally.prototype.update = function (dt) {
    if (this.riden) { const P = G.player; this.x = P.x; this.y = P.y; this.angle = P.angle; this.walkT += dt * Math.hypot(P.vx || 0, P.vy || 0) * 0.08; this.life = 1e9; return; }
    return au.call(this, dt);
  };
  const ah = Ally.prototype.hurt;
  Ally.prototype.hurt = function (d) { if (this.riden) return; return ah.call(this, d); };

  // ---------- per frame ----------
  const tk = G.v5Tick;
  G.v5Tick = function (dt) {
    const P = this.player;
    const st0 = P && P.shRide ? P._stam0 : null;
    tk.call(this, dt);
    if (!P || !this.v10 || P.dead) return;
    // aquatic shadows sink back when you leave the water
    if (this.frame % 20 === 0 && !this.inSea()) for (const a of this.allies) if (a.kind === 'shadow' && a.aqua && !a.dead && !a.recalled && !a.riden) { a.recalled = true; a.dead = true; Particles.burst(a.x, a.y, 8, '#6fd0ff', 100); this._seaMsg = (this._seaMsg || 0) + 1; if (this._seaMsg % 4 === 1) this.toast('🌊 Bóng thủy tộc lặn xuống nước — quay lại biển để gọi.', 'info'); }
    if (P.shRide) {
      const s = this.shById(P.shRide.id), a = this.allies.find(x => x.sid === P.shRide.id && !x.dead);
      if (!s || !a) { this.dismountShadow(true); this.toast('Thú cưỡi đã biến mất.', 'warn'); return; }
      if (World.mode === 'dungeon' && s.aqua) { this.dismountShadow(true); return; }
      if (!P.shRide.aqua && World.mode === 'over' && this.inSea()) { this.dismountShadow(true); this.toast('Thú cưỡi trên cạn không bơi được — bạn rơi xuống nước!', 'warn'); return; }
      // riding costs no stamina
      if (st0 != null && P.stamina < st0) P.stamina = st0;
      P._stam0 = P.stamina;
      P.inWater = false; P.deep = false;
      if (this.frame % 14 === 0 && Math.hypot(P.vx || 0, P.vy || 0) > 40) { if (P.shRide.aqua) FX.ring(P.x, P.y + 6, 3, 24, 'rgba(235,248,255,0.7)', 0.5, 2); else Particles.dust(P.x, P.y + 6, 2); }
    }
    if (this.v10.mountId != null && !this.shById(this.v10.mountId)) this.v10.mountId = null;
  };
  // ---------- speed ----------
  const sm = Player.prototype.speedMul;
  Player.prototype.speedMul = function () {
    if (this.shRide) { const w = sm.call(this); const t = World.mode === 'over' ? World.get(Math.floor(this.x / TILE), Math.floor(this.y / TILE)) : -1; const pen = t === T.DEEP ? 0.5 : t === T.WATER ? 0.72 : 1; return w / (this.shRide.aqua ? pen : 1) * this.shRide.k; }
    return sm.call(this);
  };
  // ---------- the rider sits a little higher ----------
  const pd = Player.prototype.draw;
  Player.prototype.draw = function (c) {
    if (this.shRide && !this.dead) { const y0 = this.y; this.y -= 7; try { pd.call(this, c); } finally { this.y = y0; } return; }
    return pd.call(this, c);
  };
  // ---------- Z / the touch button: shadow mount first, pet otherwise ----------
  const tm = G.toggleMount;
  G.toggleMount = function () {
    const P = this.player; if (!P || P.dead || P.car) return;
    if (P.shRide) { this.dismountShadow(); return; }
    const v = this.v10, s = v && v.mountId != null ? this.shById(v.mountId) : null;
    if (s) { this.rideShadow(s); return; }
    return tm.call(this);
  };
  // attacks no longer drop you from a pet only; a ridden shadow stays under you
  setInterval(() => {
    const mb = document.getElementById('tMount'); if (!mb || !G.player || !G.v10) return;
    const s = G.v10.mountId != null ? G.shById(G.v10.mountId) : null;
    if (s) { mb.hidden = false; const im = mb.querySelector('img'); try { if (im && IMG[s.img]) { const u = G.shadowOf(s.img).toDataURL(); if (im.dataset.sh !== u) { im.src = u; im.dataset.sh = u; } } } catch (e) {} mb.classList.toggle('on', !!G.player.shRide); }
    else if (G.player.shRide) mb.classList.add('on');
  }, 450);
  // ---------- the panel ----------
  const bs = UI.buildShadows;
  UI.buildShadows = function () {
    bs.call(this);
    const box = $('invBody'), H = s => esc(String(s));
    box.querySelectorAll('[data-sx]').forEach(x => {
      const s = G.shById(+x.getAttribute('data-sx')); if (!s) return;
      const pci = x.closest('.pc10').querySelector('.pci'), act = x.closest('.shact');
      if (s.aqua) {
        pci.querySelector('b').insertAdjacentHTML('afterend', '<small class="aq">🌊 Thủy tộc — chỉ gọi được khi bạn ở dưới nước / trên thuyền</small>');
        const ps = x.closest('.pc10').querySelector('.pstat'); if (ps) ps.textContent = ps.textContent.replace(/nhặt đồ|đốn gỗ/, 'chiến đấu dưới nước');
        act.querySelectorAll('[data-sk],[data-se]').forEach(b => b.remove());
        act.querySelectorAll('[data-sm$=":loot"],[data-sm$=":wood"]').forEach(b => b.remove());
      }
      let row = '';
      if (s.ride) {
        const mine = G.v10.mountId === s.id, riding = G.player.shRide && G.player.shRide.id === s.id;
        row = `<div class="pbtn rid"><button data-rd="${s.id}" class="${riding ? 'on' : ''}">🐎 ${riding ? 'Đang cưỡi — xuống' : 'Cưỡi ngay'} (×${rideK(s).toFixed(1)})</button><button data-rm="${s.id}" class="${mine ? 'on' : 'ghost'}">${mine ? '★ Thú cưỡi chính (Z)' : '☆ Đặt làm thú cưỡi (Z)'}</button></div>`;
      } else row = `<div class="pbtn rid"><small class="muted">Quá nhỏ để cưỡi</small></div>`;
      act.insertAdjacentHTML('afterbegin', row);
    });
    box.querySelectorAll('[data-rd]').forEach(b => { UI.bindBtn && UI.bindBtn(b); b.onclick = () => { const s = G.shById(+b.dataset.rd); if (G.player.shRide && G.player.shRide.id === s.id) G.dismountShadow(); else { UI.closePanel(); G.rideShadow(s); } UI.dirty = true; }; });
    box.querySelectorAll('[data-rm]').forEach(b => { UI.bindBtn && UI.bindBtn(b); b.onclick = () => { G.setMount(G.shById(+b.dataset.rm)); UI.buildInv(); }; });
  };
})();
