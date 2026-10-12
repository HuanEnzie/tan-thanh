// ===== v22stealth: khom lưng, quái chỉ thấy phía trước, cắt đuôi được, Sinh tồn chuyên gia (quái đánh hơi; bùn / xăng xoá mùi) =====
// Hooks called from Enemy.update (entities.js), each with a fallback to the old rule when this file is not loaded:
//   G.sightFor(z, tgt)            sight range of one enemy toward its target (facing cone, crouch)
//   G.nearSense(z, tgt)           "touching distance" that always triggers a chase (70 px before)
//   G.chaseLost(z, tgt, bd, sight) true -> the chaser gives up and goes to look where it last saw the target
//   G.canTrack(z)                 false -> no path-finding to the player (it only walks to lastSeen)
// State: G.player.crouch (not saved), G.player.scentT / scentK ('mud' | 'gas'), G.v10.surv.expert (saved).
// Keys: CapsLock (Ctrl too in the installed app) = khom / đứng, P = xoá mùi (bùn cạnh nước, hoặc 1 Can xăng). Touch: nút KHOM, nút MÙI (chế độ chuyên gia).
(function () {
  const CONE = 65 * Math.PI / 180;            // enemies that are not chasing see ±65° in front
  const REAR = 0.3, CROUCH_SEE = 0.5, CROUCH_CHASE = 0.7, INVEST = 0.8;
  const LOSE_T = 2.5, TRACK_T = 0.6;           // seconds out of sight before giving up / before losing the path
  const STEP_NOISE = 75, CROUCH_SPD = 0.5;
  const SCENT_DAY = 260, SCENT_NIGHT = 340, MUD_T = 150, GAS_T = 300;
  const TAU2 = Math.PI * 2;
  const wrapA = a => { while (a > Math.PI) a -= TAU2; while (a < -Math.PI) a += TAU2; return a; };
  const isP = t => { const P = G.player; return !!t && !!P && (t === P || t === P.car); };
  const guest = () => typeof Net !== 'undefined' && Net.active && Net.guest;
  const ST = { stepT: 0, sniffT: 0, el: null, btn: null, sbtn: null, last: '', noticed: 0 };

  G.isExpert = function () { const s = G.v10 && G.v10.surv; return !!s && s.mode === 'survival' && !!s.expert; };
  const scented = () => { const P = G.player; return G.isExpert() && !(P.scentT > 0) && !P.car; };
  G.scentRange = function () {
    if (!scented()) return 0;
    return (this.night ? SCENT_NIGHT : SCENT_DAY) * (this.raining ? 0.6 : 1);
  };

  // ---------- quái nhìn / nghe / đánh hơi ----------
  G.sightFor = function (z, tgt) {
    const base = this.sightRange();
    if (!isP(tgt)) return base;
    const P = this.player, cr = P.crouch && !P.car;
    if (z.state === 'chase') return base * (cr ? CROUCH_CHASE : 1);
    const off = Math.abs(wrapA(Math.atan2(tgt.y - z.y, tgt.x - z.x) - (z.angle || 0)));
    let s = base * (off <= CONE ? 1 : REAR);
    if (z.state === 'investigate') s = Math.max(s, base * INVEST);
    return s * (cr ? CROUCH_SEE : 1);
  };
  G.nearSense = function (z, tgt) {
    if (!isP(tgt) || z.state === 'chase' || z.boss) return 70;
    return this.player.crouch ? 30 : 55;
  };
  G.chaseLost = function (z, tgt, bd, sight) {
    if (!isP(tgt) || z.boss || z.horde || z.guard) return z.lostT > 6 && bd > sight * 1.6;
    const sr = this.scentRange();
    if (sr && bd < sr * 1.5) { z.lostT = 0; return false; }          // expert: it follows your smell
    if (z.lostT >= LOSE_T) {
      const ls = z.lastSeen || { x: tgt.x, y: tgt.y };
      z.lastSeen = { x: ls.x + R.range(-50, 50), y: ls.y + R.range(-50, 50) };
      return true;
    }
    return false;
  };
  G.canTrack = function (z) {
    if (z.boss || z.horde || z.guard) return true;
    if (this.scentRange()) return true;
    return !((z.lostT || 0) > TRACK_T);
  };

  // when a chaser gives up, show it
  const eu = Enemy.prototype.update;
  Enemy.prototype.update = function (dt) {
    const was = this.state;
    const r = eu.call(this, dt);
    if (was === 'chase' && this.state === 'investigate' && isP(this.tgt)) { this._stLostAt = G.time; ST.lost = (ST.lost || 0) + 1; }
    if (was !== 'chase' && this.state === 'chase') this._stSeenAt = G.time;
    return r;
  };

  // "?" over an enemy that searches, "!" for a moment when one notices you
  const ed = Enemy.prototype.draw;
  Enemy.prototype.draw = function (ctx) {
    const r = ed.call(this, ctx);
    if (this.dead || this.rise > 0 || this.boss) return r;
    if (G.fovCfg && G.fovCfg.on && G.canSee && !G.canSee(this.x, this.y)) return r;
    let t = null, col = '#ffd65a';
    if (this.state === 'chase' && G.time - (this._stSeenAt || -9) < 1.2) { t = '!'; col = '#ff4a3a'; }
    else if (this.state === 'investigate') t = '?';
    if (t) {
      ctx.textAlign = 'center'; ctx.font = '22px VT323, monospace';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      const y = this.y - (this.r || 12) - 14 + Math.sin(G.time * 6) * 1.5;
      ctx.strokeText(t, this.x, y); ctx.fillStyle = col; ctx.fillText(t, this.x, y);
    }
    return r;
  };

  // ---------- khom lưng ----------
  const sm = Player.prototype.speedMul;
  Player.prototype.speedMul = function () { return sm.call(this) * (this.crouch ? CROUCH_SPD : 1); };
  const pd = Player.prototype.draw;
  Player.prototype.draw = function (ctx) {
    if (!this.crouch || this.car) return pd.call(this, ctx);
    ctx.save();
    ctx.translate(this.x, this.y); ctx.scale(0.84, 0.84); ctx.translate(-this.x, -this.y);
    ctx.globalAlpha = 0.82;
    try { return pd.call(this, ctx); } finally { ctx.restore(); ctx.globalAlpha = 1; }
  };
  G.setCrouch = function (on) {
    const P = this.player; if (!P || P.dead) return;
    on = !!on && !P.car && !P.boat;
    if (!!P.crouch === on) return;
    P.crouch = on;
    this.toast(on ? 'Khom lưng [CapsLock]: đi chậm, không gây tiếng động, quái khó thấy hơn.' : 'Đứng dậy.', 'info');
    hud(true);
  };

  // ---------- xoá mùi: bùn (cạnh nước, ruộng, bùn đất khi mưa) hoặc xăng ----------
  const MUDDY = () => [T.WATER, T.PADDY, T.FARM].filter(v => v != null);
  function nearMud(P) {
    const tx = Math.floor(P.x / TILE), ty = Math.floor(P.y / TILE), M = MUDDY();
    for (let y = ty - 2; y <= ty + 2; y++) for (let x = tx - 2; x <= tx + 2; x++) {
      const t = World.get(x, y);
      if (M.includes(t) || (G.raining && (t === T.DIRT || t === T.FIELD))) return true;
    }
    return false;
  }
  G.maskScent = function (how) {
    const P = this.player; if (!P || P.dead) return false;
    if (how !== 'gas' && nearMud(P)) {
      P.scentT = MUD_T; P.scentK = 'mud';
      Particles.dust(P.x, P.y, 10); Sound.play('sfx_step', 0.5, 0.6);
      this.toast(`Trát bùn lên người: quái không ngửi thấy mùi trong ${MUD_T / 60 | 0} phút ${MUD_T % 60} giây. Mưa làm trôi bùn nhanh hơn.`, 'good');
    } else if (this.has('gas')) {
      this.take('gas');
      P.scentT = GAS_T; P.scentK = 'gas';
      Sound.play('sfx_step', 0.5, 1.4);
      this.toast(`Tẩm xăng lên người: át mùi trong ${GAS_T / 60} phút. Cẩn thận: lửa gây sát thương gấp đôi!`, 'warn');
    } else {
      this.toast('Cần đứng cạnh nước / ruộng / bùn, hoặc có Can xăng.', 'warn');
      return false;
    }
    hud(true);
    return true;
  };
  const oUse = G.useItem;
  G.useItem = function (id) { if (id === 'gas' && this.isExpert()) { if (this.has(id)) this.maskScent('gas'); return; } return oUse.call(this, id); };
  // ---------- ám sát: đòn cận chiến khi đang khom vào quái chưa phát hiện ----------
  const oHit = G.hitEnemy;
  G.hitEnemy = function (z, dmg, kx, ky, src, ...a) {
    const P = this.player;
    if (P && P.crouch && src === 'melee' && z && !z.dead && !z.boss && z.state !== 'chase') {
      dmg *= 2.5;
      Floaters.add(z.x, z.y - 22, 'ÁM SÁT', '#d9a0ff', 11, true);
    }
    return oHit.call(this, z, dmg, kx, ky, src, ...a);
  };

  // ---------- mỗi khung hình ----------
  function tick(dt) {
    const P = G.player; if (!P || G.state !== 'playing') return;
    if (P.dead) { P.crouch = false; return; }
    if (P.crouch && (P.car || P.boat || P.sprinting || P.riding)) { P.crouch = false; hud(true); }
    if (P.scentT > 0) { P.scentT -= dt * (G.raining && P.scentK === 'mud' ? 3 : 1); if (P.scentT <= 0) { P.scentT = 0; P.scentK = null; if (G.isExpert()) G.toast('Mùi cơ thể đã trở lại — quái lại đánh hơi được.', 'warn'); } }
    // xăng trên người: đứng trong lửa đau gấp đôi (lửa thường gây 12/giây)
    if (P.scentK === 'gas' && P.scentT > 0 && !P.car && typeof Throws !== 'undefined' && Throws.fires && Throws.fires.some(f => !f.friendly && dist(P.x, P.y, f.x, f.y) < f.r)) G.hurtPlayer(12 * dt, null, true);
    if (guest()) { hud(); return; }
    // tiếng bước chân khi đi thường (chạy đã có tiếng 140 px trong play.js)
    const sp = Math.hypot(P.vx, P.vy);
    ST.stepT -= dt;
    if (ST.stepT <= 0 && sp > 25 && !P.crouch && !P.sprinting && !P.car) { ST.stepT = 0.45; G.noise(P.x, P.y, STEP_NOISE); }
    // chuyên gia: quái quanh đó đánh hơi
    ST.sniffT -= dt;
    if (ST.sniffT <= 0) {
      ST.sniffT = 0.5;
      const sr = G.scentRange();
      if (sr) for (const z of G.zgrid.query(P.x, P.y, sr)) {
        if (z.dead || z.boss || z.state === 'chase' || z.sea || z.rise > 0) continue;
        const d = dist(z.x, z.y, P.x, P.y); if (d > sr) continue;
        if (d < sr * 0.45) { z.state = 'chase'; z.tgt = P; z.lastSeen = { x: P.x, y: P.y }; z.lostT = 0; z._stSeenAt = G.time; }
        else if (z.state !== 'investigate' || Math.random() < 0.3) { z.state = 'investigate'; z.target = { x: P.x + R.range(-40, 40), y: P.y + R.range(-40, 40) }; }
      }
    }
    hud();
  }
  const tk = G.v5Tick;
  G.v5Tick = function (dt) { tk.call(this, dt); tick(dt); };

  // ---------- HUD ----------
  function hud(force) {
    if (!ST.el) return;
    const P = G.player; if (!P) return;
    if (!force && G.frame % 15) return;
    let chasing = 0, search = 0;
    for (const z of G.zombies) {
      if (z.dead || dist(z.x, z.y, P.x, P.y) > 600) continue;
      if (z.state === 'chase' && isP(z.tgt)) chasing++; else if (z.state === 'investigate') search++;
    }
    const ex = G.isExpert();
    let s = P.crouch ? '▼ Khom' : '▲ Đứng';
    s += chasing ? ` · <b class="r">Bị truy (${chasing})</b>` : search ? ` · <b class="y">Quái đang tìm (${search})</b>` : ' · <b class="g">Chưa lộ</b>';
    if (ex) s += P.scentT > 0 ? ` · ${P.scentK === 'gas' ? '⛽' : '🟫'} ${Math.ceil(P.scentT)}s` : ' · <b class="r">👃 Có mùi</b>';
    if (s !== ST.last) { ST.last = s; ST.el.innerHTML = s; }
    const show = G.state === 'playing' && !P.dead;
    ST.el.style.display = show ? '' : 'none';
    if (ST.btn) ST.btn.classList.toggle('on', !!P.crouch);
    if (ST.sbtn) ST.sbtn.style.display = show && ex ? '' : 'none';
  }
  function build() {
    if (document.getElementById('st22')) return;
    const css = document.createElement('style'); css.id = 'v22stealth-css';
    css.textContent = `#st22{position:fixed;left:50%;bottom:calc(6px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:6;pointer-events:none;padding:2px 10px;border-radius:5px;background:rgba(6,8,12,.7);border:1px solid rgba(255,255,255,.18);color:#e8e4da;font:16px VT323,monospace;white-space:nowrap}
#st22 .r{color:#ff6a5a;font-weight:normal}#st22 .y{color:#ffd65a;font-weight:normal}#st22 .g{color:#8be08b;font-weight:normal}
#tCrouch,#tScent{display:none}
body.touch.tplay #tCrouch,body.touch.tplay #tScent{display:flex;position:fixed;z-index:5;align-items:center;justify-content:center;padding:0;min-width:0;border-radius:50%;letter-spacing:0;font-size:12px;box-shadow:0 3px 0 #000;width:46px;height:46px;background:radial-gradient(circle at 40% 35%,#3a3450,#14101e);border:2px solid #9a86d8;color:#efe8ff}
#tCrouch{right:calc(252px + env(safe-area-inset-right,0px));bottom:calc(14px + env(safe-area-inset-bottom,0px))}
#tScent{right:calc(304px + env(safe-area-inset-right,0px));bottom:calc(14px + env(safe-area-inset-bottom,0px));border-color:#b08850;background:radial-gradient(circle at 40% 35%,#5a4426,#1e150a)}
#tCrouch.on{background:radial-gradient(circle at 40% 35%,#7a5ad8,#2a1a50);border-color:#d9c8ff}
body.touch #st22{bottom:calc(64px + env(safe-area-inset-bottom,0px));font-size:14px}`;
    document.head.appendChild(css);
    const el = document.createElement('div'); el.id = 'st22'; el.style.display = 'none'; document.body.appendChild(el); ST.el = el;
    const mk = (id, txt, fn) => {
      const b = document.createElement('button'); b.id = id; b.innerHTML = txt; document.body.appendChild(b);
      b.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); fn(); }, { passive: false });
      b.addEventListener('click', e => { e.preventDefault(); fn(); });
      return b;
    };
    ST.btn = mk('tCrouch', 'KHOM', () => G.setCrouch(!G.player.crouch));
    ST.sbtn = mk('tScent', 'MÙI', () => G.maskScent());
    // cài đặt: chế độ chuyên gia (chỉ trong Sinh tồn)
    const panel = document.querySelector('#settings .panel');
    if (panel && !document.getElementById('optExpert')) {
      const before = document.getElementById('btnOffline') || panel.querySelector('button.back');
      const l = document.createElement('label');
      l.innerHTML = 'Sinh tồn chuyên gia (quái đánh hơi, cần bùn / xăng) <input type="checkbox" id="optExpert">';
      const cb = l.querySelector('input');
      cb.onchange = e => {
        const s = G.v10 && G.v10.surv;
        if (!s || s.mode !== 'survival') { e.target.checked = false; G.toast('Chỉ dùng được trong chế độ Sinh tồn.', 'warn'); return; }
        s.expert = !!e.target.checked;
        G.toast(s.expert ? 'Sinh tồn chuyên gia: quái đánh hơi được bạn. Trát bùn hoặc tẩm xăng [P] để xoá mùi.' : 'Đã tắt Sinh tồn chuyên gia.', s.expert ? 'warn' : 'info');
        hud(true);
      };
      panel.insertBefore(l, before);
      const sync = () => { cb.checked = G.isExpert(); };
      new MutationObserver(sync).observe(document.getElementById('settings'), { attributes: true, attributeFilter: ['hidden', 'class', 'style'] });
    }
  }
  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);

  window.addEventListener('keydown', e => {
    if (G.state !== 'playing' || e.repeat || UI.dialogOpen) return;
    const tag = e.target && e.target.tagName; if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    // CapsLock everywhere; Ctrl only in the installed app (in a browser tab Ctrl+W closes the page)
    const app = typeof PWA !== 'undefined' && PWA.standalone();
    if (e.code === 'CapsLock' || (app && (e.code === 'ControlLeft' || e.code === 'ControlRight'))) G.setCrouch(!G.player.crouch);
    else if (e.code === 'KeyP' && G.isExpert()) G.maskScent();
  });
  // browser tab: ask before closing while playing (Ctrl+W, closing the tab by mistake); the game is saved first
  window.addEventListener('beforeunload', e => {
    if (window.noLeaveGuard || G.state !== 'playing' || (typeof PWA !== 'undefined' && PWA.standalone())) return;
    try { G.save(); } catch (err) {}
    e.preventDefault(); e.returnValue = '';
  });
  G.stealthStat = () => ({ crouch: !!(G.player && G.player.crouch), lost: ST.lost || 0, expert: G.isExpert(), scent: G.scentRange() });
})();
