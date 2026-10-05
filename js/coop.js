// ===== Co-op: 2–4 players, peer-to-peer over WebRTC (PeerJS) =====
// The room host runs the world (enemies, bosses, time, dungeons). Every player moves their own hero;
// hits on enemies are sent to the host. Loot is personal: each player rolls their own drops.
const NET_VER = 1;
const NET_PREFIX = 'tanthanh-v1-';
const Net = {
  active: false, host: false, guest: false, peer: null, conns: [], conn: null, code: '', pid: 0, nextPid: 1,
  sendT: 0, ev: [], hq: new Map(), zmap: new Map(), amap: new Map(), nid: 0, nprops: new Map(), allyId: 0,
  applying: false, saveT: 30, lastHitBy: 0, status: '',

  // ---------- library + room ----------
  loadLib() {
    if (window.Peer) return Promise.resolve();
    return new Promise((ok, no) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js';
      s.onload = ok; s.onerror = () => no(new Error('Không tải được thư viện kết nối (cần mạng).'));
      document.head.appendChild(s);
    });
  },
  supported() { return typeof RTCPeerConnection !== 'undefined' && /^https?:$/.test(location.protocol); },
  genCode() { const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let c = ''; for (let i = 0; i < 5; i++) c += A[Math.floor(Math.random() * A.length)]; return c; },
  link() { return location.origin + location.pathname + '#join-' + this.code; },
  msg(t) { this.status = t; const m = $('cMsg'); if (m) m.textContent = t; },

  async hostRoom() {
    if (this.active) return;
    if (!this.supported()) { this.msg('Trình duyệt / trang này không hỗ trợ kết nối trực tiếp. Hãy mở game từ link GitHub Pages hoặc app đã cài.'); return; }
    this.msg('Đang tạo phòng...');
    try { await this.loadLib(); } catch (e) { this.msg(e.message); return; }
    const tryOpen = (n) => {
      this.code = this.genCode();
      const peer = new Peer(NET_PREFIX + this.code, { debug: 0 });
      this.peer = peer;
      peer.on('open', () => {
        this.active = this.host = true; this.guest = false; this.pid = 0; G.remotes = [];
        this.msg('Phòng đã mở! Gửi mã hoặc link cho bạn bè.');
        UI.coopRefresh(); G.toast(`👥 Đã mở phòng ${this.code} — mời bạn bè vào chơi cùng!`, 'quest');
      });
      peer.on('connection', c => this.onIncoming(c));
      peer.on('error', e => { if (e.type === 'unavailable-id' && n < 4) { peer.destroy(); tryOpen(n + 1); } else this.msg('Lỗi kết nối: ' + (e.type || e.message)); });
      peer.on('disconnected', () => { if (this.active && this.host) try { peer.reconnect(); } catch (er) {} });
    };
    tryOpen(0);
  },
  async joinRoom(code, name) {
    code = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length < 4) { this.msg('Nhập mã phòng (5 ký tự).'); return; }
    if (!this.supported()) { this.msg('Trang này chặn kết nối trực tiếp. Hãy mở game từ link GitHub Pages hoặc app đã cài.'); return; }
    this.msg('Đang kết nối tới phòng ' + code + '...');
    try { await this.loadLib(); } catch (e) { this.msg(e.message); return; }
    const peer = new Peer({ debug: 0 });
    this.peer = peer; this.code = code; this.myName = name;
    peer.on('open', () => {
      const c = peer.connect(NET_PREFIX + code, { reliable: true, serialization: 'json' });
      this.conn = c;
      const to = setTimeout(() => { if (!this.active) this.msg('Không vào được phòng. Kiểm tra mã, hoặc mạng đang chặn kết nối trực tiếp.'); }, 12000);
      c.on('open', () => { clearTimeout(to); c.send({ t: 'hello', v: NET_VER, name }); this.msg('Đã kết nối, đang tải thế giới...'); });
      c.on('data', d => this.onGuestData(d));
      c.on('close', () => this.lost('Chủ phòng đã rời đi.'));
      c.on('error', () => this.lost('Mất kết nối với chủ phòng.'));
    });
    peer.on('error', e => this.msg(e.type === 'peer-unavailable' ? 'Không tìm thấy phòng ' + code + ' (phòng đã đóng hoặc sai mã).' : 'Lỗi kết nối: ' + (e.type || e.message)));
  },
  close(silent) {
    if (this.host) for (const c of this.conns) { try { c.send({ t: 'bye' }); } catch (e) {} }
    setTimeout(() => { try { this.peer && this.peer.destroy(); } catch (e) {} }, 300);
    if (this.guest) this.saveChar();
    const wasGuest = this.guest;
    this.active = this.host = this.guest = false; this.conns = []; this.conn = null; G.remotes = [];
    this.zmap.clear(); this.amap.clear(); this.nprops.clear(); World.focus = [];
    if (wasGuest) { G.allies = G.allies.filter(a => !a.net); }
    if (!silent) G.toast('👥 Đã đóng phòng chơi chung.', 'info');
    UI.coopRefresh && UI.coopRefresh();
  },
  lost(why) {
    if (!this.active && !this.guest) { this.msg(why); return; }
    const g = this.guest;
    this.close(true);
    if (g) { UI.toTitle(); setTimeout(() => G.toast('👥 ' + why + ' Nhân vật của bạn đã được lưu.', 'warn'), 300); }
  },

  // ---------- host side ----------
  onIncoming(c) {
    c.on('data', d => this.onHostData(c, d));
    c.on('close', () => this.dropGuest(c));
    c.on('error', () => this.dropGuest(c));
  },
  onHostData(c, d) {
    if (!d || !d.t) return;
    if (d.t === 'hello') {
      if (d.v !== NET_VER) { c.send({ t: 'deny', why: 'Phiên bản game khác nhau — hãy tải lại trang.' }); return; }
      if (this.conns.length >= 3) { c.send({ t: 'deny', why: 'Phòng đã đủ 4 người.' }); return; }
      if (G.state === 'title' || !G.player) { c.send({ t: 'deny', why: 'Chủ phòng chưa vào game.' }); return; }
      c.pid = this.nextPid++; c.known = new Set();
      const P = G.player;
      const r = this.makeRemote(c.pid, String(d.name || 'Bạn').slice(0, 20), P.x + 40, P.y + 20);
      G.remotes.push(r); c.rem = r; this.conns.push(c);
      c.send(this.initPacket(c.pid));
      G.toast(`👥 ${r.name} đã vào phòng!`, 'good'); Sound.play('sfx_heart', 0.5);
      UI.coopRefresh();
      return;
    }
    if (d.t === 'up' && c.rem) this.applyUp(c, d);
  },
  dropGuest(c) {
    const i = this.conns.indexOf(c); if (i < 0) return;
    this.conns.splice(i, 1);
    if (c.rem) { G.remotes = G.remotes.filter(r => r !== c.rem); G.toast(`👥 ${c.rem.name} đã rời phòng.`, 'info'); }
    UI.coopRefresh();
  },
  makeRemote(pid, name, x, y) {
    return {
      kind: 'remote', pid, name, x, y, tx: x, ty: y, angle: 0, r: 11, hp: 100, maxHp: 100, spr: RL.hero[0], dead: false, downed: false, away: false,
      sw: 0, mz: 0, say: null, pet: null, petX: x, petY: y, car: null, lvl: 1,
      hurt(d, src) { if (this.dead || this.away) return; Net.toPid(this.pid, ['hurt', Math.round(d * 10) / 10, src ? src.x | 0 : this.x | 0, src ? src.y | 0 : this.y | 0, src && (src.arche === 'brute' || src.boss) ? 1 : 0]); },
    };
  },
  initPacket(pid) {
    const delta = [];
    for (const [k, d] of World.delta) delta.push([k, [...d.looted], [...d.removed], d.cleared ? 1 : 0]);
    const P = G.player;
    return {
      t: 'init', pid, realm: RL.id, seed: G.seed, story: Story.serialize(), clock: G.clock, day: G.day, mode: World.mode,
      dg: World.mode === 'dungeon' ? { rank: World.dg.rank, floor: World.dg.floor, floors: World.dg.floors, level: World.dg.level, seed: World.dg.seed, story: World.dg.story, cleared: World.dg.cleared } : null,
      overDelta: World.mode === 'dungeon' && G.saveOver ? [...G.saveOver.delta].map(([k, d]) => [k, [...d.looted], [...d.removed], d.cleared ? 1 : 0]) : null,
      delta, ret: G.returnPos || null, x: P.x | 0, y: P.y | 0, host: Story.names.hero,
      props: [...this.nprops.values()].filter(p => !p.dead).map(p => this.propPacket(p)),
    };
  },
  propPacket(p) { return [p.nid, p.img, p.x | 0, p.y | 0, p.netOpts || {}, p.looted ? 1 : 0]; },
  toPid(pid, e) { const c = this.conns.find(c => c.pid === pid); if (c) (c.ev || (c.ev = [])).push(e); },
  bcast(e, except) { if (this.host) { this.ev.push(except != null ? [e, except] : [e, -1]); } else if (this.guest) this.ev.push(e); },
  applyUp(c, d) {
    const r = c.rem, s = d.s;
    if (s) {
      r.tx = s[0]; r.ty = s[1]; r.angle = s[2] / 100; r.spr = s[3]; r.hp = s[4]; r.maxHp = s[5]; r.lvl = s[7];
      const f = s[6]; r.dead = !!(f & 1); if (f & 2) r.sw = 0.2; if (f & 4) r.mz = 0.06;
      r.pet = s[8]; r.away = s[9] !== World.mode + (World.dg ? World.dg.floor : '');
      if (Math.hypot(r.x - r.tx, r.y - r.ty) > 400) { r.x = r.tx; r.y = r.ty; }
    }
    if (d.h) for (const h of d.h) {
      const z = G.zombies.find(o => o.id === h[0]);
      if (!z || z.dead) continue;
      this.lastHitBy = c.pid;
      G.hitEnemy(z, h[1], h[2], h[3], h[5] === 'fire' || h[5] === 'poison' ? h[5] : 'net', null, h[4] && h[4].length ? { aff: h[4] } : null);
    }
    if (d.e) for (const e of d.e) this.applyEvent(e, c);
  },

  // ---------- guest side ----------
  onGuestData(d) {
    if (!d || !d.t) return;
    if (d.t === 'deny') { this.msg('✖ ' + d.why); try { this.peer.destroy(); } catch (e) {} return; }
    if (d.t === 'bye') { this.lost('Chủ phòng đã đóng phòng.'); return; }
    if (d.t === 'init') { this.guestInit(d); return; }
    if (d.t === 'dn' && this.guest && G.player) {
      if (d.s) this.applySnap(d.s);
      if (d.e) for (const e of d.e) this.applyEvent(e, null);
    }
  },
  guestInit(d) {
    this.pid = d.pid; this.hostName = d.host;
    UI.loadRealm(d.realm, () => {
      RL = REALMS[d.realm];
      G.realm = d.realm; G.seed = d.seed;
      World.init(d.seed);
      for (const [k, l, r, c] of d.delta || []) World.delta.set(k, { looted: new Set(l), removed: new Set(r), cleared: !!c });
      Story.load(d.story);
      G.companions = [];
      const ch = this.loadChar(d.realm);
      G.player = new Player(d.x + 40, d.y + 30);
      const P = G.player;
      Object.assign(P, ch.p);
      if (!P.armor) P.armor = { head: null, body: null, legs: null, feet: null };
      P.x = d.x + 40; P.y = d.y + 30; P.dead = false; if (P.hp <= 0) P.hp = P.maxHp * 0.6;
      P.applyGear(); G.applyRelics();
      UID = Math.max(UID, ch.uid || 1) + 100000 * this.pid;
      G.resetRuntime();
      G.stats = ch.stats || { kills: 0, looted: 0, gates: 0, rescued: 0, maxCombo: 0, start: Date.now() };
      G.achieved = ch.ach || {};
      G.heartBuys = ch.heartBuys || 0;
      G.initV4(ch.v4);
      G.clock = d.clock; G.day = d.day; G.time = 0;
      G.returnPos = d.ret;
      this.active = this.guest = true; this.host = false;
      G.remotes = []; this.zmap.clear(); this.amap.clear(); this.nprops.clear();
      if (d.mode === 'dungeon' && d.dg) {
        if (d.overDelta) { World.delta = new Map(); for (const [k, l, r, c] of d.overDelta) World.delta.set(k, { looted: new Set(l), removed: new Set(r), cleared: !!c }); }
        G.saveOver = { delta: World.delta, explored: World.explored, minis: World.minis };
        World.enterDungeon(Object.assign({}, d.dg));
        World.update(16 * TILE, 16 * TILE);
        P.x = World.startPos.x + 30; P.y = World.startPos.y;
      }
      World.update(P.x, P.y);
      for (const pp of d.props || []) this.addNetProp(pp);
      G.camera.x = P.x; G.camera.y = P.y;
      G.updateNight();
      G.start(false);
      Sound.setRealm(RL.id);
      G.toast(`👥 Đã vào thế giới của ${d.host}! Đồ rơi là của riêng bạn — cứ thoải mái nhặt.`, 'quest');
      UI.coopRefresh();
    });
  },
  // the co-op hero is kept per world, separate from your single-player save
  loadChar(realm) {
    let ch = null;
    try { ch = JSON.parse(localStorage.getItem('tt_coop_' + realm)); } catch (e) {}
    if (ch && ch.p) return ch;
    let solo = null;
    try { solo = JSON.parse(localStorage.getItem('tt_save_v2')); } catch (e) {}
    if (solo && solo.realm === realm && solo.p) { const p = Object.assign({}, solo.p); delete p.x; delete p.y; return { p, v4: solo.v4, uid: solo.uid, name: solo.story && solo.story.names.hero, stats: solo.stats, ach: solo.ach, heartBuys: solo.heartBuys }; }
    // brand-new hero for this world
    RL = REALMS[realm];
    const eq = { melee: Loot.weapon('melee', 1, 1, -1), r1: Loot.weapon('r1', 1, 0), r2: null, r3: null };
    return { p: { equip: eq, mags: { r1: Loot.stats(eq.r1).mag, r2: 0, r3: 0 }, weapon: 'r1', inv: { ammo_pistol: 40, bandage: 3, food: 2, water: 2, scroll: 1, ticket: 10 }, gold: 40 }, v4: null };
  },
  saveChar() {
    const P = G.player; if (!P || !this.guest) return;
    const p = {};
    for (const k of ['hp', 'maxHp', 'hunger', 'thirst', 'equip', 'relics', 'stash', 'armor', 'gold', 'gearHp', 'weapon', 'mags', 'inv', 'battery', 'xp', 'level', 'perks', 'maxStam', 'energy']) p[k] = P[k];
    const data = { p, v4: G.v4Save(), uid: UID, name: this.myName, stats: G.stats, ach: G.achieved, heartBuys: G.heartBuys || 0, t: Date.now() };
    data.v4.keep = []; data.v4.pending = [];
    try { localStorage.setItem('tt_coop_' + RL.id, JSON.stringify(data)); } catch (e) {}
  },
  applySnap(s) {
    const P = G.player;
    G.clock = s.c; G.day = s.d; G.raining = !!s.r; G.bloodMoon = !!s.bm; G.meteorT = s.mt ? Math.max(G.meteorT, 1) : 0;
    G.updateNight();
    if (s.g) { const done = s.g.pois; Story.load(Object.assign({}, s.g)); if (done) Story.pois = done; }
    // enemies
    const seen = new Set();
    for (const st of s.zs || []) {
      let z = this.zmap.get(st[0]);
      if (!z) { z = Object.create(Enemy.prototype); this.zmap.set(st[0], z); G.zombies.push(z); }
      Object.assign(z, { id: st[0], img: st[1], name: st[2], lvl: st[3], scale: st[4] / 100, r: st[5], maxHp: st[6], elite: !!st[7], boss: !!st[8], upright: !!st[9], mini: !!st[10], goblin: !!st[11],
        net: true, dead: false, dying: 0, rise: 0, walkT: z.walkT || 0, hitT: 0, lunge: 0, slow: 0, burn: 0, poison: 0, stun: 0, kx: 0, ky: 0, bossState: 'walk', t: ARCHE.walker, x: z.x ?? st[12], y: z.y ?? st[13] });
    }
    for (const q of s.z || []) {
      const z = this.zmap.get(q[0]); if (!z) continue;
      seen.add(q[0]);
      z.tx = q[1]; z.ty = q[2]; z.ta = q[3] / 100;
      if (z.x == null || Math.hypot(z.x - z.tx, z.y - z.ty) > 300) { z.x = z.tx; z.y = z.ty; z.angle = z.ta; }
      if (z.hpNet != null && q[4] < z.hpNet) { z.hitT = 0.09; if (Math.random() < 0.6) Particles.blood(z.x, z.y, R.range(0, TAU), 4, 120); }
      z.hp = z.hpNet = q[4];
      const f = q[5]; z.burn = f & 1 ? 1 : 0; z.slow = f & 2 ? 1 : 0; z.poison = f & 4 ? 2 : 0; z.bossState = f & 8 ? 'windup' : 'walk'; z.state = f & 16 ? 'chase' : 'wander';
    }
    for (let i = G.zombies.length - 1; i >= 0; i--) { const z = G.zombies[i]; if (!seen.has(z.id) && !z.dead) { G.zombies.splice(i, 1); this.zmap.delete(z.id); if (G.boss === z) { G.boss = null; UI.boss(null); } } }
    // allies of the host (companions, shadows, merchants, civilians)
    const aseen = new Set();
    for (const q of s.al || []) {
      aseen.add(q[0]);
      let a = this.amap.get(q[0]);
      if (!a) { a = Object.create(Ally.prototype); Object.assign(a, { net: true, nid: q[0], vx: 0, vy: 0, walkT: 0, hurtT: 0, lunge: 0, fade: 1, scale: 1, r: 11, cool: 0, sayT: 1e9, downed: false, rescued: false, x: q[2], y: q[3] }); this.amap.set(q[0], a); G.allies.push(a); }
      a.kind = q[1]; a.tx = q[2]; a.ty = q[3]; a.angle = q[4] / 100; a.img = q[5]; a.hp = q[6]; a.maxHp = q[7]; a.name = q[8]; a.downed = !!q[9]; a.title = q[10] || '';
      if (q[11] && (!a.say || a.say.text !== q[11])) a.say = { text: q[11], t: 3 };
      a.scale = q[12] ? q[12] / 100 : 1;
    }
    for (const [id, a] of this.amap) if (!aseen.has(id)) { this.amap.delete(id); a.dead = true; }
    G.allies = G.allies.filter(a => !a.dead);
    // other players
    const pseen = new Set();
    for (const q of s.pl || []) {
      pseen.add(q[0]);
      let r = G.remotes.find(o => o.pid === q[0]);
      if (!r) { r = this.makeRemote(q[0], q[7], q[1], q[2]); G.remotes.push(r); }
      r.tx = q[1]; r.ty = q[2]; r.angle = q[3] / 100; r.spr = q[4]; r.hp = q[5]; r.maxHp = q[6]; r.name = q[7];
      const f = q[8]; r.dead = !!(f & 1); if (f & 2) r.sw = 0.2; if (f & 4) r.mz = 0.06;
      r.pet = q[9]; r.car = q[10] || null; r.lvl = q[11];
      if (Math.hypot(r.x - r.tx, r.y - r.ty) > 400) { r.x = r.tx; r.y = r.ty; }
    }
    G.remotes = G.remotes.filter(r => pseen.has(r.pid));
  },

  // ---------- events (both directions) ----------
  findProp(id) {
    if (typeof id === 'string' && id[0] === 'n') return this.nprops.get(+id.slice(1)) || null;
    const [k] = String(id).split(':');
    const sb = World.sbs.get(+k); if (!sb) return null;
    return sb.props.find(p => p.id === id) || null;
  },
  pidOf(p) { if (p.nid) return 'n' + p.nid; return p.id && /^\d+:\d+$/.test(p.id) ? p.id : null; },
  addNetProp(q) {
    const [nid, img, x, y, o, looted] = q;
    if (this.nprops.has(nid)) return;
    this.applying = true;
    const p = World.addProp(img, x, y, Object.assign({}, o));
    this.applying = false;
    p.nid = nid; p.netOpts = o; this.nprops.set(nid, p);
    if (looted) { p.looted = true; if (p.container === 'chest') this.openLook(p); }
    if (o.kind === 'stairs') G.dgTarget = { x, y, label: 'Lối xuống' };
    if (o.kind === 'exit' && World.mode === 'dungeon' && World.dg && World.dg.cleared !== false && G.dgTarget == null) G.dgTarget = { x, y, label: 'Lối ra' };
  },
  openLook(p) { p.img = 'chest_' + p.data.tier + 'o'; const im = IMG[p.img]; if (im) { p.w = im.width / 2; p.h = im.height / 2; } },
  applyEvent(e, c) {
    const P = G.player, ty = e[0];
    switch (ty) {
      case 'shot': {
        Bullets.fire(e[1], e[2], e[3] / 100, { speed: e[6] }, 0, { proj: e[4], col: e[5], speed: e[6], life: e[7], size: e[8], ghost: true });
        if (e[9]) Sound.at(e[9], e[1], e[2], 0.3);
        if (this.host) this.bcast(e, c && c.pid);
        break;
      }
      case 'hb': Bullets.fire(e[1], e[2], e[3] / 100, { speed: e[6] }, e[9], { hostile: true, proj: e[4], col: e[5], speed: e[6], life: e[7], size: e[8] }); break;
      case 'hz': G.hazard(e[1], e[2], e[3], e[4]); break;
      case 'fz': {
        const o = { x: e[2], y: e[3], r: e[4], life: e[5], max: e[6], net: true, ghost: true };
        if (e[1] === 'f') { if (e[7]) o.hostile = true; else o.friendly = true; Throws.fires.push(o); }
        else { o.col = e[8] || '#7cf04a'; o.dps = e[9] || 8; Throws.acids.push(o); }
        if (this.host) this.bcast(e, c && c.pid);
        break;
      }
      case 'boom': {
        G.explodeFx(e[1], e[2], e[3]); Sound.at('sfx_explosion', e[1], e[2], 0.7, R.range(0.9, 1.1));
        const d = dist(e[1], e[2], P.x, P.y);
        G.shake(Math.max(2, 10 - d / 60));
        if (e[5] && this.guest && d < e[3] && !P.dead) G.hurtPlayer(e[4] * 0.5 * (1 - d / e[3]), { x: e[1], y: e[2], arche: 'brute' });
        if (this.host) this.bcast(e, c && c.pid);
        break;
      }
      case 'hurt': if (!P.dead) G.hurtPlayer(e[1], { x: e[2], y: e[3], arche: e[4] ? 'brute' : 'walker' }); break;
      case 'kill': if (this.guest) G.remoteKill(e[1]); break;
      case 'loot': {
        const p = this.findProp(e[1]);
        if (p && !p.looted) {
          this.applying = true; World.markLooted(p); this.applying = false;
          if (p.data && p.data.keep) World.unkeep(p.data.keep);
          if (p.container === 'chest' && p.data && p.data.mimic) { /* the mimic request follows */ }
          else if (p.container === 'chest') { if (dist(p.x, p.y, P.x, P.y) < 700 && !P.dead) { _openChest.call(G, p); G.toast('🎁 Đồng đội mở rương — bạn cũng nhận phần của mình!', 'good'); } else this.openLook(p); }
        }
        if (this.host) this.bcast(e, c && c.pid);
        break;
      }
      case 'rm': {
        const p = this.findProp(e[1]);
        if (p && !p.dead) { this.applying = true; World.removeProp(p); this.applying = false; if (p.explosive) G.explodeFx(p.x, p.y, 60); }
        if (this.host) this.bcast(e, c && c.pid);
        break;
      }
      case 'add': this.addNetProp(e[1]); break;
      case 'dg': this.applyDungeon(e); break;
      case 'chat': {
        const who = this.host ? c && c.rem : G.remotes.find(r => r.pid === e[1]);
        const name = who ? who.name : (e[1] === this.pid ? this.myName : '?');
        if (who) who.say = { text: e[2], t: 4 };
        G.toast(`💬 ${name}: ${e[2]}`, 'info');
        if (this.host) this.bcast(['chat', c ? c.pid : 0, e[2]], c && c.pid);
        break;
      }
      case 'req': if (this.host) this.hostRequest(e, c); break;
      case 'ui': if (e[1] === 'banner') UI.banner(e[2], e[3], e[4]); else if (e[1] === 'toast') G.toast(e[2], e[3]); break;
    }
  },
  hostRequest(e, c) {
    const k = e[1], name = c && c.rem ? c.rem.name : 'Đồng đội';
    if (k === 'gate') { const p = this.findProp(e[2]); if (p && p.kind === 'gate') { G.toast(`👥 ${name} mở Cổng — cả đội tiến vào!`, 'quest'); G.enterGate(p); } }
    else if (k === 'exit') { if (World.mode === 'dungeon') G.exitDungeon(); }
    else if (k === 'stairs') { if (World.mode === 'dungeon') G.descend(); }
    else if (k === 'civ') { const a = G.allies.find(o => o.nid === e[2]); if (a && a.kind === 'civ' && !a.rescued) G.rescueCiv(a); }
    else if (k === 'mimic') { const p = this.findProp(e[2]); if (p && !p.dead) G.mimicAwake(p); }
  },
  applyDungeon(e) {
    const P = G.player, off = 30 * this.pid;
    if (e[1] === 'enter') {
      G.returnPos = e[3];
      UI.fade(() => {
        G.saveOver = { delta: World.delta, explored: World.explored, minis: World.minis };
        World.enterDungeon(Object.assign({}, e[2]));
        G.zombies = []; this.zmap.clear(); G.allies = G.allies.filter(a => !a.net); this.amap.clear(); this.nprops.clear();
        Items.list = []; Bullets.list = []; Throws.fires = []; Throws.acids = []; Throws.traps = []; G.hazards = []; G.dgTarget = null;
        World.update(16 * TILE, 16 * TILE);
        P.x = World.startPos.x + off; P.y = World.startPos.y; P.car = null;
        G.camera.x = P.x; G.camera.y = P.y;
        UI.banner(`CỔNG HẠNG ${e[2].rank}`, `${RL.dungeon.name} • Tầng ${e[2].floor}/${e[2].floors}`, RANK_COLOR[e[2].rank]);
      });
    } else if (e[1] === 'descend') {
      UI.fade(() => {
        const dg = World.dg; dg.floor++; dg.level += 2;
        World.enterDungeon(dg);
        G.zombies = []; this.zmap.clear(); this.nprops.clear(); Items.list = []; Bullets.list = []; Throws.fires = []; Throws.acids = []; G.hazards = []; G.dgTarget = null;
        World.update(16 * TILE, 16 * TILE);
        P.x = World.startPos.x + off; P.y = World.startPos.y;
        G.camera.x = P.x; G.camera.y = P.y;
        UI.banner(`TẦNG ${dg.floor}/${dg.floors}`, RL.dungeon.name, RANK_COLOR[dg.rank]);
      });
    } else if (e[1] === 'exit') {
      UI.fade(() => {
        World.mode = 'over'; G.dgTarget = null;
        World.reset();
        if (G.saveOver) { World.delta = G.saveOver.delta; World.explored = G.saveOver.explored; }
        G.zombies = []; this.zmap.clear(); G.allies = G.allies.filter(a => !a.net); this.amap.clear(); this.nprops.clear();
        Items.list = []; Bullets.list = []; G.hazards = [];
        P.x = e[2].x + off; P.y = e[2].y;
        World.update(P.x, P.y);
        G.camera.x = P.x; G.camera.y = P.y;
        this.saveChar();
      });
    }
  },

  // ---------- per-frame ----------
  queueHit(id, dmg, kx, ky, aff, src) {
    const k = id + '|' + src;
    let h = this.hq.get(k);
    if (!h) { h = [id, 0, 0, 0, aff || [], src]; this.hq.set(k, h); }
    h[1] += dmg; h[2] += kx; h[3] += ky;
  },
  tick(dt) {
    if (!this.active) return;
    const P = G.player;
    // smooth remote players and (for guests) the host's enemies & allies
    for (const r of G.remotes) {
      r.x = lerp(r.x, r.tx, Math.min(1, dt * 12)); r.y = lerp(r.y, r.ty, Math.min(1, dt * 12));
      r.sw -= dt; r.mz -= dt; if (r.say) { r.say.t -= dt; if (r.say.t <= 0) r.say = null; }
      r.petX = lerp(r.petX, r.x - Math.cos(r.angle) * 34, Math.min(1, dt * 4)); r.petY = lerp(r.petY, r.y - Math.sin(r.angle) * 34 - 14, Math.min(1, dt * 4));
    }
    if (this.host) World.focus = G.remotes.filter(r => !r.away).map(r => [Math.floor(r.x / SBPX), Math.floor(r.y / SBPX)]);
    if (this.host) for (const f of World.focus) for (let y = f[1] - 1; y <= f[1] + 1; y++) for (let x = f[0] - 1; x <= f[0] + 1; x++) if (!World.sbs.has(nkey(x, y))) { World.ensure(x, y); break; }
    // co-op knock-out and respawn
    if (P.dead && P.respawnT != null) {
      P.respawnT -= dt;
      if (P.respawnT <= 0) {
        const mate = G.remotes.find(r => !r.dead && !r.away);
        if (mate) { P.x = mate.x + 20; P.y = mate.y + 20; }
        P.dead = false; P.hp = P.maxHp * 0.6; P.hurtT = 2; P.respawnT = null;
        FX.pillar(P.x, P.y, '#7dffd8', 1.2, 40); Sound.play('sfx_heal', 0.7);
        G.toast('Bạn đã hồi sinh!', 'good');
      }
    }
    // network send
    this.sendT -= dt;
    if (this.sendT > 0) return;
    this.sendT = this.host ? 1 / 15 : 1 / 20;
    this.scanFires();
    if (this.host) this.hostSend(); else this.guestSend();
    if (this.guest) { this.saveT -= 1 / 20; if (this.saveT <= 0) { this.saveT = 30; this.saveChar(); } }
  },
  scanFires() {
    for (const f of Throws.fires) if (!f.net) { f.net = true; this.bcast(['fz', 'f', f.x | 0, f.y | 0, f.r, f.life, f.max, f.friendly ? 0 : 1]); }
    if (this.host) for (const a of Throws.acids) if (!a.net) { a.net = true; this.bcast(['fz', 'a', a.x | 0, a.y | 0, a.r, a.life, a.max, 1, a.col, a.dps]); }
  },
  myState() {
    const P = G.player;
    let f = P.dead ? 1 : 0; if (P.swingT > 0) f |= 2; if (P.muzzleT > 0) f |= 4;
    return [P.x | 0, P.y | 0, Math.round(P.angle * 100), P.wdef.sprite, Math.round(P.hp), Math.round(P.maxHp), f, P.level, G.activePet, World.mode + (World.dg ? World.dg.floor : '')];
  },
  guestSend() {
    const msg = { t: 'up', s: this.myState() };
    if (this.hq.size) { msg.h = [...this.hq.values()].map(h => [h[0], Math.round(h[1] * 10) / 10, h[2] | 0, h[3] | 0, h[4], h[5]]); this.hq.clear(); }
    if (this.ev.length) { msg.e = this.ev; this.ev = []; }
    try { this.conn && this.conn.open && this.conn.send(msg); } catch (e) {}
  },
  hostSend() {
    const P = G.player;
    const shared = this.ev; this.ev = [];
    const goal = G.frame % 30 === 0 ? Story.serialize() : null;
    const players = [[0, P.car ? P.car.x | 0 : P.x | 0, P.car ? P.car.y | 0 : P.y | 0, Math.round((P.car ? P.car.angle : P.angle) * 100), P.wdef.sprite, Math.round(P.hp), Math.round(P.maxHp), Story.names.hero, (P.dead ? 1 : 0) | (P.swingT > 0 ? 2 : 0) | (P.muzzleT > 0 ? 4 : 0), G.activePet, P.car ? P.car.img : 0, P.level]];
    for (const r of G.remotes) players.push([r.pid, r.x | 0, r.y | 0, Math.round(r.angle * 100), r.spr, r.hp, r.maxHp, r.name, (r.dead ? 1 : 0) | (r.sw > 0 ? 2 : 0) | (r.mz > 0 ? 4 : 0), r.pet, 0, r.lvl]);
    for (const a of G.allies) if (!a.nid) a.nid = ++this.allyId;
    for (const c of this.conns) {
      if (!c.open || !c.rem) continue;
      const g = c.rem, near = (x, y, R0) => Math.abs(x - g.x) < R0 && Math.abs(y - g.y) < R0;
      const z = [], zs = [], known = new Set();
      for (const o of G.zombies) {
        if (o.dead || !near(o.x, o.y, 1300)) continue;
        known.add(o.id);
        if (!c.known.has(o.id)) zs.push([o.id, o.img, o.name, o.lvl, Math.round(o.scale * 100), Math.round(o.r), Math.round(o.maxHp), o.elite ? 1 : 0, o.boss ? 1 : 0, o.upright ? 1 : 0, o.mini ? 1 : 0, o.goblin ? 1 : 0, o.x | 0, o.y | 0]);
        z.push([o.id, o.x | 0, o.y | 0, Math.round(o.angle * 100), Math.max(0, Math.round(o.hp)), (o.burn > 0 ? 1 : 0) | (o.slow > 0 ? 2 : 0) | (o.poison > 1 ? 4 : 0) | (o.bossState === 'windup' ? 8 : 0) | (o.state === 'chase' ? 16 : 0)]);
      }
      c.known = known;
      const al = [];
      for (const a of G.allies) if (!a.dead && near(a.x, a.y, 1400)) al.push([a.nid, a.kind === 'comp' ? 'npc' : a.kind, a.x | 0, a.y | 0, Math.round(a.angle * 100), a.img, Math.round(a.hp || 0), Math.round(a.maxHp || 1), a.kind === 'comp' ? a.comp.name : a.name || '', a.downed ? 1 : 0, a.title || '', a.say ? a.say.text : 0, Math.round((a.scale || 1) * 100)]);
      const s = { c: Math.round(G.clock * 100) / 100, d: G.day, r: G.raining ? 1 : 0, bm: G.bloodMoon ? 1 : 0, mt: G.meteorT > 0 ? 1 : 0, z, zs, al, pl: players.filter(p => p[0] !== c.pid) };
      if (goal) s.g = goal;
      const ev = [];
      for (const [e, ex] of shared) if (ex !== c.pid) ev.push(e);
      if (c.ev && c.ev.length) { ev.push(...c.ev); c.ev = []; }
      const msg = { t: 'dn', s };
      if (ev.length) msg.e = ev;
      try { c.send(msg); } catch (e) {}
    }
  },
};
G.remotes = [];
World.focus = [];

// ---------- multi-player aware helpers used by the core ----------
G.nearestPlayerDist = function (x, y) {
  const P = this.player;
  let d = P ? dist(x, y, P.x, P.y) : 1e9;
  if (Net.host) for (const r of this.remotes) if (!r.away) d = Math.min(d, dist(x, y, r.x, r.y));
  return d;
};
G.spawnCenter = function () {
  const P = this.player;
  if (!Net.host || !this.remotes.length) return P;
  const opts = [P].concat(this.remotes.filter(r => !r.dead && !r.away));
  return opts[Math.floor(Math.random() * opts.length)];
};

// ---------- the guest's own frame (no enemy AI, no spawning, no story) ----------
G.guestUpdate = function (dt) {
  if (this.slowmo > 0) { this.slowmo -= dt; dt *= 0.35; }
  if (this.hitstop > 0) { this.hitstop -= dt; dt *= 0.15; }
  this.time += dt;
  const P = this.player;
  this.timeSlow -= dt;
  this.comboT -= dt; if (this.comboT <= 0) this.combo = 0;
  this.rain = lerp(this.rain, this.raining ? 1 : 0, dt * 0.3);
  World.update(P.x, P.y); World.pending.length = 0;
  for (let i = this.zombies.length - 1; i >= 0; i--) {
    const z = this.zombies[i];
    if (z.dead) { z.dying += dt; if (z.dying > 0.45) { this.zombies.splice(i, 1); Net.zmap.delete(z.id); } continue; }
    const ox = z.x, oy = z.y;
    z.x = lerp(z.x, z.tx ?? z.x, Math.min(1, dt * 10)); z.y = lerp(z.y, z.ty ?? z.y, Math.min(1, dt * 10));
    z.angle += angDiff(z.angle, z.ta ?? z.angle) * Math.min(1, dt * 10);
    z.walkT += Math.hypot(z.x - ox, z.y - oy) * 0.09; z.hitT -= dt; z.lunge = Math.max(0, z.lunge - dt * 4);
  }
  for (const a of this.allies) if (a.net) { a.x = lerp(a.x, a.tx, Math.min(1, dt * 10)); a.y = lerp(a.y, a.ty, Math.min(1, dt * 10)); a.walkT += dt * 6; if (a.say) { a.say.t -= dt; if (a.say.t <= 0) a.say = null; } }
  this.zgrid.clear();
  for (const z of this.zombies) if (!z.dead) this.zgrid.insert(z);
  if (this.state === 'playing') {
    updatePlayer(dt);
    this.interactTarget = this.findInteract();
    if (Input.hit('KeyE')) this.interact(this.interactTarget);
    this.actionTick(dt);
  }
  for (const a of this.allies) if (!a.net) a.update(dt);
  this.allies = this.allies.filter(a => !a.dead);
  this.updateHazards(dt);
  if (this.frame % 20 === 0) this.biomeTick();
  this.guestV4(dt);
  if (this.boss && (this.boss.dead || dist(this.boss.x, this.boss.y, P.x, P.y) > 900)) UI.boss(null); else if (this.boss) UI.boss(this.boss);
  Bullets.update(dt); Throws.update(dt); Particles.update(dt); Items.update(dt); Floaters.update(dt); FX.update(dt);
  for (let i = this.flashes.length - 1; i >= 0; i--) { this.flashes[i].life -= dt; if (this.flashes[i].life <= 0) this.flashes.splice(i, 1); }
  if (this.frame % 15 === 0) {
    const sx = Math.floor(P.x / SBPX), sy = Math.floor(P.y / SBPX);
    for (let y = sy - 1; y <= sy + 1; y++) for (let x = sx - 1; x <= sx + 1; x++) World.explored.add(World.mode + nkey(x, y));
  }
  let chasing = 0;
  for (const z of this.zombies) if (!z.dead && z.state === 'chase' && dist(z.x, z.y, P.x, P.y) < 500) chasing++;
  const intense = chasing >= 5 || (this.boss && !this.boss.dead && dist(this.boss.x, this.boss.y, P.x, P.y) < 800);
  if (!UI.dialogOpen) Sound.setMusic(intense ? RL.music.combat : World.mode === 'dungeon' ? RL.music.dungeon : this.night ? RL.music.night : RL.music.explore);
  Sound.loop('amb_wind', World.mode === 'dungeon' ? 0.12 : 0.2);
  Sound.loop('amb_rain', this.rain * 0.45);
  Sound.loop('sfx_heartbeat', P.hp < P.maxHp * 0.3 && !P.dead ? 0.6 : 0);
  let lx = (Input.mouse.x - VW / 2) * 0.16, ly = (Input.mouse.y - VH / 2) * 0.16;
  this.camera.x = lerp(this.camera.x, P.x + lx, Math.min(1, dt * 6));
  this.camera.y = lerp(this.camera.y, P.y + ly, Math.min(1, dt * 6));
  this.shakeAmt = Math.max(0, this.shakeAmt - dt * 30);
  if (this.lvlQueue > 0 && this.state === 'playing' && !P.dead && !UI.dialogOpen) UI.levelUp();
};
// pets, gacha chests, wonders and personal shooting stars for a guest
G.guestV4 = function (dt) {
  const P = this.player;
  this.petTick(dt);
  if (this.pendingChests && this.pendingChests.length && this.state === 'playing' && World.mode === 'over') {
    for (const t of this.pendingChests) { const a = R.range(0, TAU); World.addProp('chest_' + t, P.x + Math.cos(a) * 50, P.y + Math.sin(a) * 50, { container: 'chest', kind: 'chest', r: 12, data: { tier: t, bonus: 0.5 } }); }
    this.pendingChests = [];
  }
  if (this.frame % 15 === 0) for (const p of World.propsNear(P.x, P.y, 320, this._wq || (this._wq = []))) if (p.kind === 'wonder' && !p.found && dist(p.x, p.y, P.x, P.y) < 300) this.discoverWonder(p);
  if (this.meteorT > 0 && World.mode === 'over' && Math.random() < dt * 3.5) {
    const a = R.range(0, TAU), d = R.range(80, 520), x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
    this.meteors.push({ x, y, t: 0, land: Math.random() < 0.4 && World.walkable(Math.floor(x / TILE), Math.floor(y / TILE)) });
  }
  for (let i = this.meteors.length - 1; i >= 0; i--) { const m = this.meteors[i]; m.t += dt; if (m.t >= 0.7) { if (m.land) { Items.drop(m.x, m.y, 'star', 1); Particles.burst(m.x, m.y, 10, '#ffe680', 140); } this.meteors.splice(i, 1); } }
};
// a kill confirmed by the host: shared XP, personal loot
G.remoteKill = function (k) {
  const z = Net.zmap.get(k.id);
  if (z && !z.dead) { z.dead = true; z.dying = 0; }
  if (this.boss && this.boss.id === k.id) { this.boss = null; UI.boss(null); }
  Particles.gibs(k.x, k.y, k.boss ? 30 : k.elite ? 14 : 6);
  World.addDecal(R.pick(['blood1', 'blood2', 'blood3']), k.x, k.y, R.range(0, TAU), k.r / 12 * 0.8, 0.85);
  if (k.img) World.addDecal(k.img, k.x, k.y, (k.a || 0) / 100, k.scale || 1, 0.9, true);
  Sound.at(R.chance(0.5) ? (RL.id === 'md' ? 'sfx_zombie_die' : 'sfx_blade_hit') : 'sfx_splat', k.x, k.y, 0.5, k.boss ? 0.5 : R.range(0.85, 1.2));
  this.corpses.push({ img: k.img, arche: k.arche, x: k.x, y: k.y, lvl: k.lvl, r: k.r, scale: k.scale || 1, t: this.time });
  if (this.corpses.length > 30) this.corpses.shift();
  const P = this.player;
  if (P.dead || dist(k.x, k.y, P.x, P.y) > 1500) return;
  const mine = k.by === Net.pid;
  this.stats.kills++;
  if (mine) { this.combo++; this.comboT = 2.6; if (this.combo > this.stats.maxCombo) this.stats.maxCombo = this.combo; if (this.combo % 10 === 0) UI.comboPop(this.combo); P.energy = Math.min(100, P.energy + 3); }
  this.addXp(k.xp * (1 + P.relic('xp') / 100));
  const luck = (P.perks.luck || 0) * 0.35 + P.relic('luck') / 100;
  if (Math.random() < (k.boss ? 1 : k.elite ? 0.4 : 0.025 + luck * 0.02)) for (let i = 0; i < (k.boss ? 3 : 1); i++) Items.dropGear(k.x, k.y, Loot.randomGear(k.lvl, luck + (k.boss ? 2.2 : k.elite ? 0.9 : 0) + (World.mode === 'dungeon' ? 0.5 : 0)));
  if (Math.random() < (k.boss ? 1 : k.elite ? 0.9 : 0.3)) Items.drop(k.x, k.y, 'gold', Math.round((k.boss ? 60 : k.elite ? 12 : 2) * (1 + k.lvl * 0.15) * R.range(0.7, 1.3)));
  if (Math.random() < (k.elite ? 0.8 : 0.14 + luck * 0.1)) { const id = R.pick(['ammo_pistol', 'ammo_pistol', 'ammo_shell', 'ammo_rifle', 'food', 'water', 'scrap', 'bandage']); Items.drop(k.x, k.y, id, id.startsWith('ammo') ? R.int(5, 14) : 1); }
  if (k.boss) { this.achieve('boss'); this.toast(`${k.name} đã gục ngã!`, 'quest'); this.shake(12); this.slowmo = 0.8; if (this.codex) this.codex.bosses[String(k.name).replace(/^(Cuồng Bạo|Thiết Giáp|Khổng Lồ|Hư Ảnh|Bão Tố) /, '')] = 1; this.giveTickets(k.dungeon || k.story ? 2 : 1, null); Items.drop(k.x, k.y, 'medkit', 1); }
  if (k.goblin) { for (let i = 0; i < 10; i++) Items.drop(k.x, k.y, 'gold', R.int(8, 18) + k.lvl); Items.dropGear(k.x, k.y, Loot.randomGear(k.lvl, 1.6, 2)); this.giveTickets(2, null); }
  if (k.mimic != null) _openChest.call(this, { x: k.x, y: k.y, data: { tier: Math.min(3, k.mimic + 1), bonus: 0.6 }, w: 0, h: 0 });
};

// ---------- wrappers around the existing game (host broadcasts, guest redirects) ----------
(function () {
  const upd = G.update;
  G.update = function (dt) { if (Net.guest) this.guestUpdate(dt); else upd.call(this, dt); Net.tick(dt); };

  const hit = G.hitEnemy;
  G.hitEnemy = function (z, dmg, kx, ky, src, ang, wp) {
    if (!Net.guest || !z.net) return hit.call(this, z, dmg, kx, ky, src, ang, wp);
    if (z.dead) return false;
    const P = this.player;
    let crit = false;
    if (src === 'gun' || src === 'melee' || src === 'skill') {
      const cc = (P.perks.crit || 0) * 0.1 + (wp && wp.crit || 0) + (P.relic('critdmg') ? 0.05 : 0) + 0.05 + (P.pab && P.pab.crit || 0);
      if (Math.random() < cc) { dmg *= 2 + P.relic('critdmg') / 100; crit = true; }
    }
    const aff = wp && (wp.aff || wp.affixes) || [];
    Net.queueHit(z.id, dmg, kx * (1 - (z.boss ? 1 : 0)), ky * (1 - (z.boss ? 1 : 0)), aff, src === 'fire' || src === 'poison' ? src : 'net');
    if (src !== 'fire' && src !== 'poison') {
      z.hitT = 0.09;
      const a = ang != null ? ang : Math.atan2(ky, kx);
      Particles.blood(z.x, z.y, a, crit ? 12 : 6, crit ? 220 : 150);
      if (crit) Particles.sparks(z.x, z.y, a + Math.PI, 6, ['#fff6b0', '#ffffff']);
      if (dmg >= 1) Floaters.add(z.x + R.range(-6, 6), z.y - z.r - 6, Math.round(dmg) + (crit ? '!' : ''), crit ? '#ffdd33' : '#ffffff', crit ? 13 : 8);
      P.energy = Math.min(100, P.energy + dmg * 0.05 * (1 + P.relic('energy') / 100 + (P.perks.skill || 0) * 0.3) / Math.max(1, z.lvl * 0.25));
      if ((src === 'melee' || src === 'gun') && aff.includes('vamp')) P.hp = Math.min(P.maxHp, P.hp + dmg * 0.04);
    }
    return false;
  };

  const kill = G.killEnemy;
  G.killEnemy = function (z, src) {
    kill.call(this, z, src);
    if (Net.host) Net.bcast(['kill', { id: z.id, xp: z.xp, lvl: z.lvl, x: z.x | 0, y: z.y | 0, elite: z.elite, boss: z.boss, mini: z.mini, goblin: z.goblin, mimic: z.mimic, story: z.story, dungeon: z.dungeon, name: z.name, r: z.r, img: z.img, scale: z.scale, a: Math.round(z.angle * 100), arche: z.arche, by: src === 'net' ? Net.lastHitBy : 0 }]);
  };

  const fire = Bullets.fire;
  Bullets.fire = function (x, y, ang, w, dmg, o = {}) {
    fire.call(this, x, y, ang, w, dmg, o);
    if (!Net.active || o.ghost || Net.applying) return;
    const b = this.list[this.list.length - 1];
    const pk = [Math.round(x), Math.round(y), Math.round(ang * 100), b.proj, b.col, Math.round(b.sp), Math.round(b.life * 100) / 100, b.size];
    if (o.hostile) { if (Net.host) Net.bcast(['hb', ...pk, Math.round(dmg)]); }
    else if (o.src !== 'ally' || Net.host) Net.bcast(['shot', ...pk, 0]);
  };

  const hz = G.hazard;
  G.hazard = function (type, x, y, o) { hz.call(this, type, x, y, o); if (Net.host) Net.bcast(['hz', type, x | 0, y | 0, o]); };

  const ex = G.explode;
  G.explode = function (x, y, r, dmg, fromPlayer, quiet) { ex.call(this, x, y, r, dmg, fromPlayer, quiet); if (Net.active) Net.bcast(['boom', x | 0, y | 0, r | 0, Math.round(dmg), Net.host && !fromPlayer ? 1 : 0]); };

  const add = World.addProp;
  World.addProp = function (img, x, y, o = {}) {
    const p = add.call(this, img, x, y, o);
    if (Net.host && !this._gen && !Net.applying) {
      p.nid = ++Net.nid; p.netOpts = JSON.parse(JSON.stringify(Object.assign({}, o, { data: o.data && o.data.keep ? Object.assign({}, o.data, { keep: undefined }) : o.data })));
      Net.nprops.set(p.nid, p);
      Net.bcast(['add', Net.propPacket(p)]);
    }
    return p;
  };
  const looted = World.markLooted;
  World.markLooted = function (p) { looted.call(this, p); if (Net.active && !Net.applying) { const id = Net.pidOf(p); if (id) Net.bcast(['loot', id]); } };
  const removed = World.removeProp;
  World.removeProp = function (p) { removed.call(this, p); if (Net.active && !Net.applying) { const id = Net.pidOf(p); if (id) Net.bcast(['rm', id]); } };

  const mimic = G.mimicAwake;
  G.mimicAwake = function (p) {
    if (!Net.guest) return mimic.call(this, p);
    const id = Net.pidOf(p);
    if (id) Net.ev.push(['req', 'mimic', id]);
    Net.applying = true; World.removeProp(p); Net.applying = false;
    UI.banner('RƯƠNG ĂN THỊT!', 'Đó không phải rương...', '#ff4a3a'); this.shake(8);
  };

  // dungeon transitions run for the whole party
  const eg = G.enterGate, ds = G.descend, xd = G.exitDungeon;
  G.enterGate = function (p) {
    if (Net.guest) { const id = Net.pidOf(p); if (id) Net.ev.push(['req', 'gate', id]); this.toast('Đang gọi cả đội vào Cổng...', 'info'); return; }
    if (this.transit) return;
    eg.call(this, p);
    if (Net.host) setTimeout(() => { if (World.mode === 'dungeon') { const d = World.dg; Net.bcast(['dg', 'enter', { rank: d.rank, floor: d.floor, floors: d.floors, level: d.level, seed: d.seed, story: d.story }, this.returnPos]); for (const r of this.remotes) { r.x = r.tx = this.player.x + 30; r.y = r.ty = this.player.y; } } }, 480);
  };
  G.descend = function () {
    if (Net.guest) { Net.ev.push(['req', 'stairs']); return; }
    if (this.transit) return;
    ds.call(this);
    if (Net.host) Net.bcast(['dg', 'descend']);
  };
  G.exitDungeon = function () {
    if (Net.guest) { Net.ev.push(['req', 'exit']); this.toast('Đang đưa cả đội ra khỏi Cổng...', 'info'); return; }
    if (this.transit) return;
    xd.call(this);
    if (Net.host) Net.bcast(['dg', 'exit', this.returnPos]);
  };

  const inter = G.interact;
  G.interact = function (it) {
    if (Net.guest && it) {
      if (it.kind === 'civ') { const near = this.zombies.some(z => !z.dead && dist(z.x, z.y, it.ally.x, it.ally.y) < 220); if (near) { this.toast('Hãy tiêu diệt kẻ địch xung quanh trước!', 'warn'); return; } Net.ev.push(['req', 'civ', it.ally.nid]); it.ally.rescued = true; this.addXp(60 + this.player.level * 8); Items.drop(it.ally.x, it.ally.y, 'gold', R.int(10, 25)); return; }
      if (['car', 'talk', 'revive', 'cage'].includes(it.kind)) { this.toast('Việc này chỉ chủ phòng làm được.', 'info'); return; }
    }
    return inter.call(this, it);
  };

  const die = G.die;
  G.die = function () {
    if (!Net.active) return die.call(this);
    const P = this.player;
    const canRevive = P.relics.some(r => r && r.type === 'revive') || this.companions.some(c => (c.lover || c.sworn) && c.ally && !c.ally.downed && (c.reviveDay || 0) !== this.day);
    if (canRevive) return die.call(this);
    P.dead = true; P.hp = 0; P.respawnT = 10;
    Sound.play('sfx_player_die', 0.8); Particles.blood(P.x, P.y, 0, 30, 200);
    this.toast('Bạn đã gục ngã! Hồi sinh cạnh đồng đội sau 10 giây...', 'warn');
  };

  const sv = G.save;
  G.save = function () { if (Net.guest) { Net.saveChar(); return; } return sv.call(this); };

  const tt = UI.toTitle;
  UI.toTitle = function () { if (Net.active) Net.close(true); return tt.call(this); };
})();

// ---------- drawing other players ----------
function drawRemotes(ctx) {
  for (const r of G.remotes) {
    if (r.away) continue;
    if (r.car && IMG[r.car]) {
      const im = IMG[r.car];
      ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(r.angle); ctx.drawImage(im, -im.width / 4, -im.height / 4, im.width / 2, im.height / 2); ctx.restore();
    } else {
      const im = IMG[r.spr] || IMG[RL.hero[0]];
      if (!im) continue;
      const iw = im.width / 2, ih = im.height / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.beginPath(); ctx.ellipse(r.x + 3, r.y + 4, 12, 10, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(77,255,224,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(r.x, r.y, 16, 0, TAU); ctx.stroke();
      ctx.save(); ctx.translate(r.x, r.y);
      if (r.dead) { ctx.globalAlpha = 0.45; ctx.rotate(1.3); }
      else ctx.rotate(r.angle + (r.sw > 0 ? Math.sin((1 - r.sw / 0.2) * Math.PI) * 1.2 - 0.45 : 0));
      ctx.drawImage(im, -ih / 2, -ih / 2, iw, ih);
      if (r.mz > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(-ih / 2 + iw + 4, 0, 6, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
      ctx.restore(); ctx.globalAlpha = 1;
      if (r.pet != null && IMG['pet_' + r.pet] && !r.dead) { const pi = IMG['pet_' + r.pet]; const b = Math.sin(G.time * 3 + r.pid) * 3; ctx.drawImage(pi, r.petX - pi.width / 4, r.petY - pi.height / 4 + b, pi.width / 2, pi.height / 2); }
    }
    // name tag and health
    ctx.font = '10px VT323, monospace'; ctx.textAlign = 'center';
    const label = `${r.name} • Lv${r.lvl || 1}${r.dead ? ' (gục ngã)' : ''}`;
    ctx.fillStyle = '#000'; ctx.fillText(label, r.x + 1, r.y - 27); ctx.fillStyle = '#4dffe0'; ctx.fillText(label, r.x, r.y - 28);
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(r.x - 14, r.y - 24, 28, 3);
    ctx.fillStyle = '#6dff7a'; ctx.fillRect(r.x - 14, r.y - 24, 28 * clamp(r.hp / (r.maxHp || 1), 0, 1), 3);
    if (r.say) {
      ctx.font = '10px VT323, monospace';
      const w = ctx.measureText(r.say.text).width + 10;
      ctx.fillStyle = 'rgba(10,20,24,0.85)'; ctx.fillRect(r.x - w / 2, r.y - 50, w, 14);
      ctx.fillStyle = '#e8fffa'; ctx.fillText(r.say.text, r.x, r.y - 40);
    }
  }
}

// ---------- lobby, chat and party HUD ----------
const CHAT_PRESETS = ['Lại đây!', 'Cứu với!', 'Có rương ở đây!', 'Đi thôi!', 'Cẩn thận boss!', 'Cảm ơn nha ♥'];
Object.assign(UI, {
  openCoop() {
    if (G.state === 'playing') { G.state = 'paused'; }
    this.coopRefresh();
    this.showScreen('coop');
  },
  coopRefresh() {
    if (!$('coop')) return;
    const inGame = G.player && G.state !== 'title' && G.state !== 'loading';
    $('coopHost').hidden = !inGame || Net.guest;
    $('coopJoin').hidden = inGame && !Net.guest;
    $('coopGuest').hidden = !Net.guest;
    $('cCode').textContent = Net.host ? Net.code : '-----';
    $('cLink').value = Net.host ? Net.link() : '';
    $('cOpen').hidden = Net.host; $('cCopy').hidden = !Net.host; $('cClose').hidden = !Net.host;
    const names = [`👑 ${Net.host || !Net.active ? (Story.names && Story.names.hero || 'Bạn') : (Net.hostName || 'Chủ phòng')}`].concat(G.remotes.filter(r => Net.host || r.pid !== 0).map(r => '👤 ' + r.name));
    $('cPlayers').innerHTML = Net.active ? names.map(n => `<span>${esc(n)}</span>`).join('') : '';
    $('cMsg').textContent = Net.status;
    if (!$('cName').value) { let n = ''; try { const s = JSON.parse(localStorage.getItem('tt_save_v2')); n = s && s.story && s.story.names.hero || ''; } catch (e) {} $('cName').value = n || 'Lữ khách'; }
    this.partyHud();
  },
  partyHud() {
    const el = $('partyHud'); if (!el) return;
    if (!Net.active || !G.player) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = `<b>👥 ${Net.host ? 'PHÒNG ' + Net.code : 'ĐANG CHƠI CÙNG'}</b>` + G.remotes.map(r => `<div class="pm ${r.dead ? 'dead' : ''}"><span>${esc(r.name)}</span><i><u style="width:${clamp(r.hp / (r.maxHp || 1), 0, 1) * 100}%"></u></i></div>`).join('');
  },
  chatOpen() {
    if (!Net.active) { this.toast('Mở phòng hoặc vào phòng bạn bè để trò chuyện.', 'info'); return; }
    const b = $('chatBox'); b.hidden = !b.hidden;
    if (!b.hidden) setTimeout(() => $('chatIn').focus(), 50);
  },
  chatSend(text) {
    text = String(text || '').trim().slice(0, 60); if (!text || !Net.active) return;
    G.player.say = { text, t: 4 };
    G.toast(`💬 Bạn: ${text}`, 'info');
    Net.bcast(['chat', Net.pid, text]);
    $('chatBox').hidden = true; $('chatIn').value = '';
  },
});
(function () {
  $('btnCoopT').onclick = () => UI.openCoop();
  $('btnCoopP').onclick = () => UI.openCoop();
  $('cOpen').onclick = () => Net.hostRoom();
  $('cClose').onclick = () => { Net.close(); UI.coopRefresh(); };
  $('cCopy').onclick = () => {
    const t = `Vào chơi Tàn Thành cùng mình! Mã phòng: ${Net.code}\n${Net.link()}`;
    const done = () => Net.msg('✔ Đã sao chép lời mời — gửi cho bạn bè qua Zalo/Messenger.');
    try { navigator.clipboard.writeText(t).then(done, () => { $('cLink').select(); }); } catch (e) { $('cLink').select(); }
  };
  $('cJoin').onclick = () => Net.joinRoom($('cJoinCode').value, ($('cName').value || 'Lữ khách').trim().slice(0, 20));
  $('cLeave').onclick = () => { Net.close(true); UI.toTitle(); };
  $('chatPresets').innerHTML = CHAT_PRESETS.map(t => `<button>${esc(t)}</button>`).join('');
  $('chatPresets').querySelectorAll('button').forEach(b => b.onclick = () => UI.chatSend(b.textContent));
  $('chatSend').onclick = () => UI.chatSend($('chatIn').value);
  $('chatIn').addEventListener('keydown', e => { if (e.key === 'Enter') UI.chatSend($('chatIn').value); e.stopPropagation(); });
  if (!Touch.on) document.querySelectorAll('[data-a="chat"]').forEach(b => b.addEventListener('click', () => UI.chatOpen()));
  window.addEventListener('keydown', e => { if (e.code === 'Enter' && G.state === 'playing' && Net.active && document.activeElement !== $('chatIn')) UI.chatOpen(); });
  setInterval(() => UI.partyHud(), 500);
  // invitation links: #join-CODE opens the join screen
  const m = /#join-([A-Za-z0-9]{4,6})/.exec(location.hash);
  if (m) {
    $('cJoinCode').value = m[1].toUpperCase();
    const et = UI.enterTitle;
    UI.enterTitle = function () { et.call(this); setTimeout(() => UI.openCoop(), 200); };
  }
})();

function drawSelfSay(ctx) {
  const P = G.player; if (!P || !P.say) return;
  P.say.t -= G.rdt || 0.016; if (P.say.t <= 0) { P.say = null; return; }
  ctx.font = '10px VT323, monospace'; ctx.textAlign = 'center';
  const w = ctx.measureText(P.say.text).width + 10;
  ctx.fillStyle = 'rgba(10,20,24,0.85)'; ctx.fillRect(P.x - w / 2, P.y - 44, w, 14);
  ctx.fillStyle = '#fffbe0'; ctx.fillText(P.say.text, P.x, P.y - 34);
}
(function () {
  const mm = UI.drawMinimap;
  UI.drawMinimap = function () {
    mm.call(this);
    if (!Net.active || !G.remotes.length) return;
    const g = this.mmctx, P = G.player.car || G.player, S = 200 / 96;
    const ox = P.x / TILE - 48, oy = P.y / TILE - 48;
    for (const r of G.remotes) {
      if (r.away) continue;
      const x = clamp((r.x / TILE - ox) * S, 5, 195), y = clamp((r.y / TILE - oy) * S, 5, 195);
      g.fillStyle = r.dead ? '#777' : '#4dffe0'; g.strokeStyle = '#000'; g.lineWidth = 1.5;
      g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fill(); g.stroke();
    }
  };
})();
