// ===== Asset loading (per world) + sound (WebAudio with HTMLAudio fallback) =====
const IMG = {};
const COMMON_IMAGES = [
  'p_pistol', 'p_shotgun', 'p_rifle', 'p_bat',
  'car_red', 'car_police', 'car_burnt', 'car_ambulance', 'bus', 'truck',
  'tree_oak', 'tree_pine', 'tree_dead', 'tree_autumn', 'bush', 'rock', 'rocks', 'weeds',
  'barrel', 'crate', 'dumpster', 'trash', 'sandbags', 'barrier', 'firebarrel', 'bench', 'ammocrate', 'fence', 'lamp', 'vending', 'tent',
  'blood1', 'blood2', 'blood3', 'blood4', 'acid', 'scorch', 'corpse', 'pothole',
  'i_pistol', 'i_shotgun', 'i_rifle', 'i_bat', 'i_machete', 'i_ammo_pistol', 'i_ammo_shell', 'i_ammo_rifle',
  'i_medkit', 'i_bandage', 'i_food', 'i_water', 'i_molotov', 'i_grenade', 'i_planks', 'i_scrap', 'i_gas',
  'i_radio', 'i_battery', 'i_key', 'i_energy', 'i_pills', 'i_flashlight', 'i_choco',
  'tex_grass', 'tex_asphalt', 'tex_sidewalk', 'tex_dirt', 'tex_wood', 'tex_tile', 'tex_water', 'tex_roof', 'tex_roof2', 'tex_sand',
  'fx_0', 'fx_1', 'fx_2', 'fx_3', 'fx_4', 'fx_5', 'fx_6', 'fx_7',
  'relic_0', 'relic_1', 'relic_2', 'relic_3', 'relic_4', 'relic_5', 'relic_6', 'relic_7', 'relic_8', 'relic_9', 'relic_10', 'relic_11',
];
const JPG = new Set(['title', 'gameover', 'victory', 'cy_art', 'ct_art', 'tt_art', 'sl_art',
  'md_port1', 'md_port2', 'cy_port1', 'cy_port2', 'ct_port1', 'ct_port2', 'tt_port1', 'tt_port2', 'sl_port1', 'sl_port2']);
const ART_IMAGES = ['title', 'gameover', 'victory'].concat(REALM_ORDER.filter(r => r !== 'md').map(r => r + '_art'));

function loadImages(list, onProgress) {
  const todo = [...new Set(list)].filter(n => !IMG[n]);
  let done = 0;
  if (!todo.length) { onProgress && onProgress(1); return Promise.resolve(); }
  return Promise.all(todo.map(n => new Promise(res => {
    const im = new Image();
    im.onload = () => { IMG[n] = im; done++; onProgress && onProgress(done / todo.length); res(); };
    im.onerror = () => { console.warn('missing image', n); done++; onProgress && onProgress(done / todo.length); res(); };
    im.src = 'assets/img/' + n + (JPG.has(n) ? '.jpg' : '.png');
  })));
}

const SFX_LIST = [
  'sfx_pistol', 'sfx_shotgun', 'sfx_rifle', 'sfx_reload', 'sfx_empty', 'sfx_swing', 'sfx_hit', 'sfx_splat',
  'sfx_zombie1', 'sfx_zombie2', 'sfx_zombie3', 'sfx_zombie_attack', 'sfx_zombie_die', 'sfx_hurt', 'sfx_player_die',
  'sfx_step', 'sfx_pickup', 'sfx_loot', 'sfx_eat', 'sfx_drink', 'sfx_heal', 'sfx_door', 'sfx_glass', 'sfx_explosion',
  'sfx_click', 'sfx_hover', 'sfx_achievement', 'sfx_craft', 'sfx_radio', 'sfx_thunder', 'sfx_alarm',
  'sfx_laser', 'sfx_laser2', 'sfx_energy', 'sfx_sword', 'sfx_sword2', 'sfx_blade_hit', 'sfx_bow', 'sfx_arrow_hit',
  'sfx_magic', 'sfx_magic2', 'sfx_skill', 'sfx_dash', 'sfx_portal', 'sfx_levelup', 'sfx_coin', 'sfx_legendary', 'sfx_heart',
  'sfx_robot', 'sfx_monster', 'sfx_ghost', 'sfx_electric', 'sfx_freeze', 'sfx_fire', 'sfx_gong', 'sfx_bell', 'sfx_shadow', 'sfx_combo',
];

const Sound = {
  master: 0.8, sfxVol: 0.8, musicVol: 0.5,
  ctx: null, buffers: {}, loading: {}, pools: {}, music: {}, currentMusic: null, loops: {}, unlocked: false, last: {}, voices: {},
  init() {
    try {
      const s = JSON.parse(localStorage.getItem('tt_audio') || '{}');
      if (s.master != null) { this.master = s.master; this.sfxVol = s.sfx; this.musicVol = s.music; }
    } catch (e) {}
    this.webaudio = location.protocol !== 'file:' && !!(window.AudioContext || window.webkitAudioContext);
  },
  save() { try { localStorage.setItem('tt_audio', JSON.stringify({ master: this.master, sfx: this.sfxVol, music: this.musicVol })); } catch (e) {} },
  unlock() {
    if (!this.ctx && this.webaudio) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.out = this.ctx.createGain(); this.out.connect(this.ctx.destination);
        for (const n of SFX_LIST) this.load(n);
      } catch (e) { this.webaudio = false; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    if (!this.unlocked) {
      this.unlocked = true;
      // iOS: start each music element once inside the gesture
      for (const n in this.music) this.prime(this.music[n].el);
    }
  },
  prime(a) { try { a.muted = true; const p = a.play(); if (p) p.then(() => { a.pause(); a.muted = false; }).catch(() => { a.muted = false; }); } catch (e) {} },
  load(name) {
    if (!this.ctx || this.buffers[name] || this.loading[name]) return;
    this.loading[name] = true;
    fetch('assets/audio/' + name + '.mp3').then(r => r.arrayBuffer()).then(b => new Promise((ok, no) => this.ctx.decodeAudioData(b, ok, no)))
      .then(buf => { this.buffers[name] = buf; }).catch(() => { this.loading[name] = false; });
  },
  htmlPlay(name, vol, rate) {
    let p = this.pools[name];
    if (!p) { p = this.pools[name] = { list: [], i: 0 }; for (let i = 0; i < 3; i++) { const a = new Audio('assets/audio/' + name + '.mp3'); a.preload = 'auto'; p.list.push(a); } }
    const a = p.list[p.i]; p.i = (p.i + 1) % p.list.length;
    try { a.currentTime = 0; a.volume = clamp(vol, 0, 1); a.playbackRate = rate; a.play().catch(() => {}); } catch (e) {}
  },
  play(name, vol = 1, rate = 1) {
    if (!this.unlocked) return;
    const now = performance.now();
    if (now - (this.last[name] || 0) < 40) return;
    this.last[name] = now;
    const v = vol * this.sfxVol * this.master;
    if (v <= 0.005) return;
    if (this.ctx && this.buffers[name]) {
      if ((this.voices[name] || 0) >= 5) return;
      const src = this.ctx.createBufferSource(); src.buffer = this.buffers[name]; src.playbackRate.value = rate;
      const g = this.ctx.createGain(); g.gain.value = v;
      src.connect(g); g.connect(this.out);
      this.voices[name] = (this.voices[name] || 0) + 1;
      src.onended = () => { this.voices[name]--; };
      src.start();
      return;
    }
    if (this.ctx) { this.load(name); return; }
    this.htmlPlay(name, v, rate);
  },
  at(name, x, y, vol = 1, rate) {
    if (!G.player) return this.play(name, vol, rate);
    const d = Math.hypot(x - G.player.x, y - G.player.y);
    const f = Math.max(0, 1 - d / 900);
    if (f > 0.04) this.play(name, vol * f, rate || (0.92 + Math.random() * 0.16));
  },
  loop(name, vol) {
    let l = this.loops[name];
    if (!l) {
      const a = new Audio('assets/audio/' + name + '.mp3'); a.loop = true;
      l = this.loops[name] = { el: a, vol: 0, target: 0 };
      if (this.unlocked) this.prime(a);
    }
    l.target = vol;
  },
  setRealm(r) {
    const R0 = REALMS[r];
    for (const k in R0.music) this.musicEl(R0.music[k]);
    this.musicEl('music_romance'); this.musicEl('music_victory');
  },
  musicEl(name) {
    if (!name) return null;
    let m = this.music[name];
    if (!m) { const a = new Audio('assets/audio/' + name + '.mp3'); a.loop = true; a.preload = 'auto'; a.volume = 0; m = this.music[name] = { el: a, vol: 0 }; if (this.unlocked) this.prime(a); }
    return m;
  },
  setMusic(name) { if (name) this.musicEl(name); this.currentMusic = name; },
  update(dt) {
    if (!this.unlocked) return;
    for (const n in this.music) {
      const m = this.music[n];
      const target = n === this.currentMusic ? 1 : 0;
      m.vol += Math.sign(target - m.vol) * Math.min(Math.abs(target - m.vol), dt * 0.6);
      m.el.volume = clamp(m.vol * this.musicVol * this.master, 0, 1);
      if (m.vol > 0.001 && m.el.paused) m.el.play().catch(() => {});
      if (m.vol <= 0.001 && !m.el.paused) m.el.pause();
    }
    for (const n in this.loops) {
      const l = this.loops[n];
      l.vol += Math.sign(l.target - l.vol) * Math.min(Math.abs(l.target - l.vol), dt * 0.7);
      l.el.volume = clamp(l.vol * this.sfxVol * this.master, 0, 1);
      if (l.vol > 0.001 && l.el.paused) l.el.play().catch(() => {});
      if (l.vol <= 0.001 && !l.el.paused) l.el.pause();
    }
  },
  stopAllLoops() { for (const n in this.loops) this.loops[n].target = 0; },
};
