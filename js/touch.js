// ===== Touch controls (phones / tablets) =====
const Touch = {
  on: false, L: null, R: null, moveDir: null,
  init() {
    const coarse = ('ontouchstart' in window) || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
    if (!coarse) return;
    this.on = true;
    document.body.classList.add('touch');
    const layer = document.getElementById('touchLayer');
    const opt = { passive: false };
    layer.addEventListener('touchstart', e => this.start(e), opt);
    layer.addEventListener('touchmove', e => this.move(e), opt);
    layer.addEventListener('touchend', e => this.end(e), opt);
    layer.addEventListener('touchcancel', e => this.end(e), opt);
    // action buttons: hold = key down
    document.querySelectorAll('#tbtns [data-k], #tmenu [data-k]').forEach(b => {
      const k = b.dataset.k;
      b.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); Input.pressed[k] = true; Input.keys[k] = true; b.classList.add('down'); Sound.unlock(); }, opt);
      const up = e => { e.preventDefault(); Input.keys[k] = false; b.classList.remove('down'); };
      b.addEventListener('touchend', up, opt); b.addEventListener('touchcancel', up, opt);
    });
    document.querySelectorAll('#tmenu [data-a]').forEach(b => {
      b.addEventListener('touchstart', e => {
        e.preventDefault(); e.stopPropagation();
        const a = b.dataset.a;
        if (a === 'pause') UI.pause(); else if (a === 'chat') UI.chatOpen(); else if (a === 'fs') this.fullscreen(); else UI.openPanel(a);
      }, opt);
    });
    // attack button: hold to shoot / swing, auto-aims at the nearest zombie
    const fire = document.getElementById('tFire');
    fire.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); this.fire = true; fire.classList.add('down'); Sound.unlock(); }, opt);
    const fireUp = e => { e.preventDefault(); this.fire = false; fire.classList.remove('down'); Input.mouse.down = false; };
    fire.addEventListener('touchend', fireUp, opt); fire.addEventListener('touchcancel', fireUp, opt);
    // dash + ultimate skill
    const dash = document.getElementById('tDash');
    dash.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); Input.pressed.Space = true; dash.classList.add('down'); }, opt);
    dash.addEventListener('touchend', e => { e.preventDefault(); dash.classList.remove('down'); }, opt);
    const sk = document.getElementById('tSkill');
    sk.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); this.aimNearest(400); Input.pressed.KeyQ = true; sk.classList.add('down'); }, opt);
    sk.addEventListener('touchend', e => { e.preventDefault(); sk.classList.remove('down'); }, opt);
    // shove / quick melee
    const mel = document.getElementById('tMelee');
    mel.addEventListener('touchstart', e => {
      e.preventDefault(); e.stopPropagation(); mel.classList.add('down');
      this.aimNearest(110);
      Input.mouse.rclicked = true;
    }, opt);
    mel.addEventListener('touchend', e => { e.preventDefault(); mel.classList.remove('down'); }, opt);
    const loop = () => { this.tick(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    setInterval(() => this.badges(), 300);
    resize();
  },
  stick(t) {
    return { id: t.identifier, x0: t.clientX, y0: t.clientY, dx: 0, dy: 0, m: 0 };
  },
  start(e) {
    e.preventDefault();
    Sound.unlock();
    for (const t of e.changedTouches) {
      if (t.clientX < window.innerWidth * 0.45 && !this.L) this.L = this.stick(t);
      else if (t.clientX >= window.innerWidth * 0.45 && !this.R) this.R = this.stick(t);
    }
    this.draw();
  },
  move(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      for (const s of [this.L, this.R]) {
        if (!s || s.id !== t.identifier) continue;
        let dx = t.clientX - s.x0, dy = t.clientY - s.y0;
        const d = Math.hypot(dx, dy), max = 55;
        if (d > max) { s.x0 += dx * (1 - max / d); s.y0 += dy * (1 - max / d); dx = t.clientX - s.x0; dy = t.clientY - s.y0; }
        s.dx = dx / max; s.dy = dy / max; s.m = Math.min(1, Math.hypot(s.dx, s.dy));
      }
    }
    this.draw();
  },
  end(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (this.L && this.L.id === t.identifier) { this.L = null; for (const k of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft']) Input.keys[k] = false; }
      if (this.R && this.R.id === t.identifier) { this.R = null; Input.mouse.down = false; }
    }
    this.draw();
  },
  playerScreen() {
    const P = G.player;
    return { x: (P.x - G.camera.x) * G.zoom / G.dpr + VW / 2, y: (P.y - G.camera.y) * G.zoom / G.dpr + VH / 2 };
  },
  // point the aim at the closest visible zombie; returns true when one was found
  aimNearest(range) {
    const P = G.player; if (!P || P.car) return false;
    let best = null, bd = range;
    for (const z of G.zombies) {
      if (z.dead) continue;
      const d = dist(P.x, P.y, z.x, z.y) - z.r;
      if (d < bd && World.los(P.x, P.y, z.x, z.y)) { bd = d; best = z; }
    }
    if (!best) return false;
    const ps = this.playerScreen();
    Input.mouse.x = ps.x + (best.x - P.x) * G.zoom / G.dpr;
    Input.mouse.y = ps.y + (best.y - P.y) * G.zoom / G.dpr;
    return true;
  },
  tick() {
    if (!this.on) return;
    const playing = G.state === 'playing';
    document.body.classList.toggle('tplay', playing);
    if (!playing || !G.player) return;
    const P = G.player;
    const ps = this.playerScreen();
    const L = this.L, R = this.R;
    if (L && L.m > 0.2) {
      Input.keys.KeyW = L.dy < -0.38; Input.keys.KeyS = L.dy > 0.38;
      Input.keys.KeyA = L.dx < -0.38; Input.keys.KeyD = L.dx > 0.38;
      Input.keys.ShiftLeft = L.m > 0.97;
    } else if (L) { Input.keys.KeyW = Input.keys.KeyS = Input.keys.KeyA = Input.keys.KeyD = Input.keys.ShiftLeft = false; }
    let aimed = false;
    if (R && R.m > 0.2) {
      const a = Math.atan2(R.dy, R.dx);
      Input.mouse.x = ps.x + Math.cos(a) * 170; Input.mouse.y = ps.y + Math.sin(a) * 170;
      aimed = true;
    } else if (this.fire) {
      aimed = this.aimNearest(P.wdef.melee ? 120 : 430);
    }
    if (!aimed) {
      if (L && L.m > 0.2) { Input.mouse.x = ps.x + L.dx / L.m * 120; Input.mouse.y = ps.y + L.dy / L.m * 120; }
      else {
        // keep aim offset relative to the player so the camera does not drift
        const ox = Input.mouse.x - ps.x, oy = Input.mouse.y - ps.y, d = Math.hypot(ox, oy) || 1;
        Input.mouse.x = ps.x + ox / d * 120; Input.mouse.y = ps.y + oy / d * 120;
      }
    }
    Input.mouse.down = this.fire || !!(R && R.m > 0.55);
    const eb = document.querySelector('#tbtns [data-k="KeyE"]');
    if (eb) eb.classList.toggle('ready', !!G.interactTarget);
  },
  fullscreen(enterOnly) {
    const d = document, el = d.documentElement;
    const isFs = d.fullscreenElement || d.webkitFullscreenElement;
    try {
      if (isFs) { if (!enterOnly) (d.exitFullscreen || d.webkitExitFullscreen).call(d); return; }
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (!req) throw new Error('no fullscreen');
      const lock = () => { try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} };
      const pr = req.call(el, { navigationUI: 'hide' });
      if (pr && pr.then) pr.then(lock).catch(() => { if (!enterOnly) this.fsFail(); }); else lock();
    } catch (e) { if (!enterOnly) this.fsFail(); }
  },
  fsFail() {
    const h = document.getElementById('fsHint');
    h.textContent = 'Trình duyệt này không cho phép toàn màn hình (thường gặp trên iPhone). Hãy xoay ngang máy; trên Chrome có thể chọn ⋮ → Thêm vào màn hình chính.';
    h.hidden = false;
    clearTimeout(this.fsT); this.fsT = setTimeout(() => { h.hidden = true; }, 6000);
  },
  draw() {
    for (const [s, id] of [[this.L, 'joyL'], [this.R, 'joyR']]) {
      const el = document.getElementById(id);
      if (!s) { el.style.display = 'none'; continue; }
      el.style.display = 'block';
      el.style.left = s.x0 + 'px'; el.style.top = s.y0 + 'px';
      el.firstElementChild.style.transform = `translate(${s.dx * 55}px, ${s.dy * 55}px)`;
    }
  },
  badges() {
    if (!G.player) return;
    const inv = G.player.inv;
    const set = (k, n) => { const b = document.querySelector(`#tbtns [data-k="${k}"] i`); if (b) b.textContent = n || ''; };
    set('KeyH', (inv.medkit || 0) + (inv.bandage || 0) + (inv.pills || 0));
    set('KeyF', (inv.food || 0) + (inv.water || 0) + (inv.choco || 0) + (inv.energy || 0));
    set('KeyG', (inv.grenade || 0) + (inv.molotov || 0));
    const skb = document.getElementById('tSkill');
    if (skb) { const en = Math.floor(G.player.energy); skb.style.setProperty('--en', en + '%'); skb.classList.toggle('full', en >= 100); }
    for (const k of ['KeyB', 'KeyT']) { const b = document.querySelector(`#tmenu [data-k="${k}"] i`); if (b) b.textContent = (k === 'KeyB' ? inv.barricade : inv.trap) || ''; }
    const w = G.player.wdef;
    const lbl = document.getElementById('tFireLbl'), img = document.getElementById('tFireImg');
    const t = w.melee ? 'CHÉM' : RL.id === 'tt' ? 'PHÁP' : 'BẮN';
    if (lbl.textContent !== t) lbl.textContent = t;
    const ic = w.icon || RL.weapons.melee.icon;
    const src = IMG[ic] ? IMG[ic].src : '';
    if (img.getAttribute('src') !== src) img.setAttribute('src', src);
  },
};
