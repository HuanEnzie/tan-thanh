// ===== v22 gói PA: đỡ đòn (parry) + nhịp vung đòn của quái =====
// Quái đánh gần vung đòn trước (windup): dấu "!" đỏ trên đầu, quái ngả người ra sau. 0.15 s cuối "!" chuyển vàng = lúc đỡ đẹp nhất.
// Chuột phải / nút ĐẨY (vẫn làm hành động xô) mở cửa sổ đỡ P.parryT = 0.24 s, hồi P.parryCd = 0.5 s.
// Đòn hoặc đạn quái trúng người chơi trong cửa sổ được tung đúng một lần:
//   thành công -> không mất máu (boss còn 15%), quái choáng, "Phản đòn" (đòn kế tiếp chí mạng ×2); đạn bị dội ngược;
//   thất bại   -> "Đỡ hụt", nhận đủ sát thương.
// Không đỡ được: slam của boss (có vòng đỏ cảnh báo 0.5 s), vùng nổ/thiên thạch/sóng (hazard truyền nguồn không phải Enemy),
// nọc axit của quái md (Throws), mọi đòn không qua nhịp vung.
// Wrapper luôn gọi bản gốc (composable). Co-op khách: tắt (máy chủ quyết định sát thương).
// Khóa lưu: G.v10.parry = {ok, perfect, fail, tip}. Sự kiện: Bus21.emit('parry', src|null, ok).
(function () {
  const guest = () => typeof Net !== 'undefined' && Net.active && Net.guest;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const WIND = { walker: 0.45, runner: 0.32, brute: 0.62, armored: 0.5, ranged: 0.45, boss: 0.5 };
  const SLAM_TRIG = 80, SLAM_R = 120;   // entities.js:507 slam fires inside 80 px, hurts inside 120 px (511)
  const TIP = 'Quái đang vung đòn! Nhấn chuột phải / nút ĐẨY đúng lúc dấu ! chuyển vàng để ĐỠ.';

  const pst = () => {
    const v = G.v10; if (!v) return { ok: 0, perfect: 0, fail: 0, tip: false };
    return v.parry || (v.parry = { ok: 0, perfect: 0, fail: 0, tip: false });
  };
  const windupOf = z => (z.t.windup || WIND[z.arche] || 0.45) * (z.elite ? 0.85 : 1);

  // one roll per press: the roll closes the window (P.parryT = 0)
  const roll = (P, boss) => {
    const perfect = G.time - (P.parryAt || 0) <= 0.12;
    const agi = G.attr ? G.attr('agi') : 0;
    const p = cl(0.55 + 0.012 * agi + (perfect ? 0.3 : 0) - (boss ? 0.2 : 0), 0.25, 0.95);
    P.parryT = 0;
    return { ok: Math.random() < p, perfect };
  };
  const onSuccess = (P, x, y, ang, perfect, src) => {
    const s = pst(); s.ok++; if (perfect) s.perfect++;
    P.counterT = 1.5;
    G.hitstop = Math.max(G.hitstop || 0, 0.08);
    Particles.sparks(x, y, ang, 8, ['#fff6b0', '#ffffff', '#ffd24a']);
    FX.ring(P.x, P.y, 8, 34, '#ffd24a', 0.25, 4);
    Floaters.add(P.x, P.y - 30, perfect ? 'ĐỠ HOÀN HẢO!' : 'ĐỠ!', '#ffd24a', perfect ? 13 : 11, true);
    Sound.play('sfx_blade_hit', 0.6, perfect ? 1.3 : 1.1);
    Bus21.emit('parry', src || null, true);
  };
  const onFail = (P, src) => {
    pst().fail++;
    Floaters.add(P.x, P.y - 30, 'Đỡ hụt', '#9fb3c8', 10);
    Bus21.emit('parry', src || null, false);
  };

  // ---------- timers, press detection (G.v5Tick runs inside G.update; Input.mouse.rclicked lives until endFrame) ----------
  const tk = G.v5Tick;
  G.v5Tick = function (dt) {
    tk.call(this, dt);
    const P = this.player;
    if (!P || guest()) return;
    if (P.parryT > 0) P.parryT = Math.max(0, P.parryT - dt);
    if (P.parryCd > 0) P.parryCd = Math.max(0, P.parryCd - dt);
    if (P.counterT > 0) P.counterT = Math.max(0, P.counterT - dt);
    if (Input.mouse.rclicked && !P.dead && !P.car && !(P.parryCd > 0)) { P.parryT = 0.24; P.parryAt = this.time; P.parryCd = 0.5; }
  };

  // ---------- boss AI: tag the boss while bossAI runs, so its slam (state walk) and charge hit (state charge) can be told apart ----------
  const bai = Enemy.prototype.bossAI;
  Enemy.prototype.bossAI = function (dt, d, dx, dy, tgt) {
    this._inBossAI = true;
    try { return bai.call(this, dt, d, dx, dy, tgt); } finally { this._inBossAI = false; }
  };

  // ---------- windup: the original melee code strikes only when attackCd <= 0, so we hold attackCd and release it on time ----------
  const eu = Enemy.prototype.update;
  Enemy.prototype.update = function (dt) {
    const P = G.player;
    if (guest() || !P) return eu.call(this, dt);
    if (this.dead) { this.wind = null; return eu.call(this, dt); }
    const hasSlam = !!(this.pat && this.pat.includes('slam'));
    const tgt = this.tgt || P.car || P;
    const d = Math.hypot(tgt.x - this.x, tgt.y - this.y);
    const reach = this.r + (tgt.r || 11) + 6;             // same reach as entities.js:417
    const bossWalk = !!this.boss && this.bossState === 'walk';
    const skip = this.rise > 0 || this.aqua || this.goblin || this.t.explode || tgt !== P || P.dead;   // own attack paths / no telegraph for them
    let W = this.wind;
    if (W && (skip || this.stun > 0 || this.state !== 'chase')) { this.wind = W = null; this.attackCd = 0; }
    if (!W && !skip && this.state === 'chase' && this.stun <= 0 && this.attackCd <= 0) {
      const range = bossWalk && hasSlam ? Math.max(reach, SLAM_TRIG) : reach;
      if (d < range) {
        const w0 = windupOf(this);
        W = this.wind = { t: w0, max: w0, slam: bossWalk && hasSlam && d < SLAM_TRIG };
        const s = pst();
        if (!s.tip) { s.tip = true; SYS.msg(TIP, 'quest'); }
      }
    }
    let struck = false;
    if (W) {
      W.t -= dt;
      this.attackCd = 1;                                  // the original strike waits while winding up
      if (W.t <= 0) {
        this.wind = null; struck = true;
        const slamNow = bossWalk && hasSlam && d < SLAM_TRIG;
        if (d < reach || slamNow) { this.attackCd = 0; this._strikeNow = true; }   // original strikes this frame (slam first for boss)
        else if (d < reach + 12) {                        // target still within 12 px of reach: strike by hand
          this.attackCd = (this.t.rate || 1.0) * (G.timeSlow > 0 ? 3 : 1);
          this.lunge = 1; this._strikeNow = true;
          G.hurtTarget(tgt, this.dmg * (G.night ? 1.12 : 1), this);
          Sound.at(RL.id === 'md' ? 'sfx_zombie_attack' : 'sfx_blade_hit', this.x, this.y, 0.45, R.range(0.9, 1.2));
        } else { this.attackCd = 0; struck = false; }   // the target stepped away: the swing misses
      }
    }
    const r = eu.call(this, dt);
    if (struck && this.attackCd > 0) this.attackCd *= 0.8;   // windup strikes recover 20 % faster
    this._strikeNow = false;
    if (this._parriedCharge) { this._parriedCharge = false; P.kx = 0; P.ky = 0; }
    return r;
  };

  // ---------- telegraph: lean back 3 px, red "!" over the head, red ring for boss slam ----------
  const ed = Enemy.prototype.draw;
  Enemy.prototype.draw = function (ctx) {
    const W = this.wind;
    if (!W || this.dead || this.rise > 0) return ed.call(this, ctx);
    const ax = Math.cos(this.angle) * 3, ay = Math.sin(this.angle) * 3;
    const k = 1 - W.t / W.max;
    ctx.save(); ctx.translate(-ax, -ay); ed.call(this, ctx); ctx.restore();
    if (W.slam) {
      ctx.beginPath(); ctx.arc(this.x, this.y, SLAM_R, 0, TAU);
      ctx.fillStyle = 'rgba(255,40,40,' + (0.05 + 0.1 * k).toFixed(3) + ')'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,40,40,' + (0.45 + 0.45 * k).toFixed(3) + ')'; ctx.lineWidth = 3; ctx.stroke();
    }
    const late = !W.slam && W.t <= 0.15;
    const blink = Math.floor(G.time * 16) % 2 === 0;
    const col = late ? (blink ? '#ffd24a' : '#fff6b0') : '#ff3b3b';
    ctx.save();
    ctx.font = 'bold 22px VT323, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    const mx = this.x - ax, my = this.y - this.r - 22 - ay;
    ctx.strokeText('!', mx, my); ctx.fillStyle = col; ctx.fillText('!', mx, my);
    ctx.restore();
  };

  // ---------- melee & charge hits on the player: one roll inside the window ----------
  const hp = G.hurtPlayer;
  G.hurtPlayer = function (dmg, src, silent) {
    const P = this.player;
    if (!P || !(P.parryT > 0) || silent || P.dead || P.car || P.dashT > 0 || !(src instanceof Enemy) || guest()) return hp.call(this, dmg, src, silent);
    // boss slam: noParry. boss charge impact: parryable. telegraphed melee: parryable. anything else: not.
    const kind = src._inBossAI ? (src.bossState === 'charge' ? 'charge' : null) : (src._strikeNow ? 'melee' : null);
    if (!kind) return hp.call(this, dmg, src, silent);
    const boss = !!src.boss;
    const r = roll(P, boss);
    if (!r.ok) { onFail(P, src); return hp.call(this, dmg, src, silent); }
    const a = Math.atan2(src.y - P.y, src.x - P.x);
    onSuccess(P, P.x + Math.cos(a) * 14, P.y + Math.sin(a) * 14, a, r.perfect, src);
    if (boss) {
      src.stun = Math.max(src.stun || 0, kind === 'charge' ? 1.2 : 0.35);
      if (kind === 'charge') src._parriedCharge = true;
      const pz = (src._poise || []).filter(t => this.time - t < 12); pz.push(this.time);   // poise: 3 parries in 12 s
      if (pz.length >= 3) { src.stun = Math.max(src.stun, 2); pz.length = 0; Floaters.add(src.x, src.y - src.r - 22, 'PHÁ THẾ!', '#ffd24a', 12, true); }
      src._poise = pz;
      return hp.call(this, dmg * 0.15, src, silent);
    }
    src.stun = Math.max(src.stun || 0, src.elite ? 0.9 : 1.2);
  };

  // ---------- hostile bullets: pre-scan before they move, so a bullet inside the hit zone gets its roll ----------
  const bu = Bullets.update;
  Bullets.update = function (dt) {
    const P = G.player;
    if (P && P.parryT > 0 && !P.dead && !P.car && !guest()) {
      for (const b of Bullets.list) {
        if (!(P.parryT > 0)) break;
        if (!b.hostile || b.ghost || b.noParry || b._pRoll) continue;
        const dx = P.x - b.x, dy = P.y - b.y;
        if (Math.hypot(dx, dy) > (P.r || 11) + 4 * (b.size || 1) + 26) continue;
        if (b.vx * dx + b.vy * dy <= 0) continue;          // flying away
        b._pRoll = true;
        const r = roll(P, false);
        if (!r.ok) { onFail(P, null); continue; }
        b.hostile = false; b.vx = -b.vx; b.vy = -b.vy; b.ang = Math.atan2(b.vy, b.vx);
        b.hit = new Set(); b.src = 'gun'; b.life = Math.max(b.life, 0.7); b.col = '#fff6b0';
        onSuccess(P, b.x, b.y, b.ang + Math.PI, r.perfect, null);
      }
    }
    return bu.call(this, dt);
  };

  // ---------- ĐẨY (shove): keeps its damage and swing, but a monster that is winding up is not stunned or pushed back,
  // otherwise every parry press (always at melee range) would cancel the very attack it is meant to parry ----------
  const ma = meleeAttack;
  meleeAttack = function (w, shove) {
    if (!shove || guest()) return ma.call(this, w, shove);
    const held = G.zombies.filter(z => z.wind && !z.dead).map(z => [z, z.stun, z.kx, z.ky]);
    const r = ma.call(this, w, shove);
    for (const [z, s, kx, ky] of held) { z.stun = s; z.kx = kx; z.ky = ky; }
    return r;
  };

  // ---------- "Phản đòn": the next player hit within 1.5 s is a crit x2 ----------
  const he = G.hitEnemy;
  G.hitEnemy = function (z, dmg, kx, ky, src, ang, wp) {
    const P = this.player;
    if (P && P.counterT > 0 && !z.dead && (src === 'gun' || src === 'melee' || src === 'skill')) {
      P.counterT = 0; dmg *= 2; this._xcrit = true;
    }
    return he.call(this, z, dmg, kx, ky, src, ang, wp);
  };
})();
