// ===== v18: ultimate cut-ins — freeze, hero portrait slides in, skill name across the screen, shouted voice line, synthesized sound =====
const CUT_STYLE = { airstrike: 'fire', swords: 'blade', arise: 'dark', whirl: 'blade', overclock: 'lightning', meteor: 'fire', frost: 'ice', chain: 'lightning', hole: 'void', heal: 'heal', blades: 'blade', dash: 'dash', inferno: 'fire' };

// ---------- synthesized sound (no files) ----------
const Sfx18 = (() => {
  let nb = null;
  const noiseBuf = c => nb || (nb = (() => { const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; })());
  function play(style) {
    const c = Sound.ctx; if (!c || !Sound.out || !Sound.unlocked) return;
    const vol = Sound.master * Sound.sfxVol, t0 = c.currentTime + 0.01, out = c.createGain(); out.gain.value = vol * 0.8; out.connect(Sound.out);
    const tone = (type, f0, f1, at, dur, v, lp) => {
      const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t0 + at); o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + at + dur);
      g.gain.setValueAtTime(0.0001, t0 + at); g.gain.exponentialRampToValueAtTime(v, t0 + at + Math.min(0.06, dur * 0.3)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
      let n = o; if (lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); n = f; }
      n.connect(g); g.connect(out); o.start(t0 + at); o.stop(t0 + at + dur + 0.05);
    };
    const noise = (ftype, f0, f1, at, dur, v) => {
      const s = c.createBufferSource(); s.buffer = noiseBuf(c); const f = c.createBiquadFilter(); f.type = ftype; f.frequency.setValueAtTime(f0, t0 + at); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + at + dur); f.Q.value = 1.2;
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0 + at); g.gain.exponentialRampToValueAtTime(v, t0 + at + dur * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
      s.connect(f); f.connect(g); g.connect(out); s.start(t0 + at, Math.random()); s.stop(t0 + at + dur + 0.05);
    };
    switch (style) {
      case 'dark':
        tone('sine', 48, 38, 0, 1.5, 0.9); tone('sawtooth', 110, 98, 0.05, 1.4, 0.22, 420); tone('sawtooth', 164.8, 146, 0.1, 1.3, 0.16, 520); tone('sawtooth', 233, 207, 0.15, 1.2, 0.12, 600);
        noise('bandpass', 180, 2600, 0, 0.55, 0.5); noise('lowpass', 2400, 120, 0.55, 0.7, 0.9); tone('sine', 62, 24, 0.55, 0.9, 1);
        noise('bandpass', 3200, 2800, 0.1, 1.2, 0.08); break;
      case 'fire': tone('sine', 90, 28, 0, 0.7, 1); noise('lowpass', 1800, 150, 0, 0.8, 0.9); noise('highpass', 3500, 900, 0.1, 0.6, 0.25); tone('sawtooth', 140, 600, 0, 0.35, 0.15, 900); break;
      case 'blade': for (let i = 0; i < 4; i++) { tone('sawtooth', 2400 + i * 500, 7000, i * 0.09, 0.2, 0.12, 9000); noise('highpass', 3000, 9000, i * 0.09, 0.16, 0.25); } noise('bandpass', 400, 5000, 0, 0.5, 0.3); tone('sine', 70, 40, 0.35, 0.5, 0.6); break;
      case 'ice': for (let i = 0; i < 7; i++) tone('sine', 1500 + Math.random() * 3500, 900, i * 0.06, 0.6, 0.09); noise('highpass', 5000, 7000, 0, 0.6, 0.18); tone('sine', 110, 50, 0.25, 0.6, 0.5); break;
      case 'lightning': noise('highpass', 1800, 6000, 0, 0.12, 1); noise('bandpass', 900, 200, 0.02, 0.5, 0.7); tone('sawtooth', 220, 40, 0, 0.5, 0.35, 700); tone('sine', 60, 30, 0.1, 0.6, 0.7); break;
      case 'heal': [523, 659, 784, 1047, 1319].forEach((f, i) => tone('sine', f, f * 1.01, i * 0.09, 0.9, 0.1)); tone('sine', 262, 262, 0, 1.1, 0.12); break;
      case 'void': tone('sine', 900, 60, 0, 1.0, 0.4); noise('lowpass', 3000, 90, 0, 1.0, 0.7); tone('sine', 55, 30, 0.7, 0.7, 0.9); break;
      case 'dash': noise('bandpass', 600, 6000, 0, 0.28, 0.6); tone('sine', 300, 1200, 0, 0.2, 0.2); break;
      default: tone('sine', 120, 40, 0, 0.6, 0.7);
    }
  }
  return { play };
})();

// ---------- spoken lines ----------
Sound.voice = function (key, text, lang) {
  const g = (typeof Story !== 'undefined' && Story.gender === 'f') ? 'f' : 'm', K = `${key}_${g}`;
  const V = typeof VOICE17 !== 'undefined' ? VOICE17[K] : null;
  if (this.ctx && this.out && this.unlocked) {
    if (V && this.voiceBuf) {
      const s = this.ctx.createBufferSource(), gn = this.ctx.createGain(); s.buffer = this.voiceBuf; gn.gain.value = Math.min(1, this.master * (this.sfxVol + 0.3));
      s.connect(gn); gn.connect(this.out); s.start(0, V[0], V[1] + 0.05); return true;
    }
    if (V && !this.voiceLoading) { this.voiceLoading = true; fetch('assets/audio/voice17.mp3').then(r => r.arrayBuffer()).then(b => new Promise((ok, no) => this.ctx.decodeAudioData(b, ok, no))).then(buf => { this.voiceBuf = buf; }).catch(() => { this.voiceLoading = false; }); }
  }
  // not loaded yet (or no clip): the browser voice shouts it instead
  try { if (text && window.speechSynthesis) { const u = new SpeechSynthesisUtterance(text); u.lang = lang || 'vi-VN'; u.pitch = 0.3; u.rate = 0.85; u.volume = Math.min(1, this.master); speechSynthesis.cancel(); speechSynthesis.speak(u); return true; } } catch (e) {}
  return false;
};

// ---------- the cut-in ----------
UI.cutin = function (o) {
  let el = document.getElementById('cutin');
  if (!el) { document.body.insertAdjacentHTML('beforeend', '<div id="cutin"></div>'); el = document.getElementById('cutin'); }
  const dur = o.dur || 1.15, hero = o.hero !== false, look = G.heroLook ? G.heroLook() : null;
  const title = String(o.title || '').toUpperCase();
  el.style.setProperty('--c', o.col || '#ffd65a'); el.style.setProperty('--d', dur + 's');
  el.className = 'on ' + (o.cls || '');
  el.innerHTML = `<div class="ci-dim"></div><div class="ci-lines"></div><div class="ci-band"></div>`
    + (hero && look ? `<div class="ci-hero">${Face.html(look, RL.id, 'ci-face')}</div>` : '')
    + `<div class="ci-title">${o.cls === 'arise' ? [...title].map((c, i) => `<span style="animation-delay:${i * 0.04}s">${esc(c)}</span>`).join('') : esc(title)}</div><div class="ci-sub">${esc(o.sub || '')}</div><div class="ci-ring"></div><div class="ci-flash"></div>`;
  clearTimeout(UI._ciT); UI._ciT = setTimeout(() => { el.className = ''; el.innerHTML = ''; }, dur * 1000 + 80);
};

// ---------- freeze the world while it plays, then run the real effect ----------
Object.assign(G, {
  cutT: 0, cutFn: null, cutMax: 1,
  startCut(o, fn) {
    if (this.cutT > 0) { fn(); return; }
    this.cutT = o.dur || 1.0; this.cutMax = this.cutT; this.cutFn = fn;
    UI.cutin(o); if (o.sfx) Sfx18.play(o.sfx); if (o.voice) Sound.voice(o.voice, o.say, o.lang);
    this.shake(3);
  },
});
(function () {
  const up = G.update;
  G.update = function (dt) {
    if (this.cutT > 0) {
      this.cutT -= dt;
      if (this.cutT <= 0) { const f = this.cutFn; this.cutFn = null; this.cutT = 0; if (f) f(); }
      return;
    }
    return up.call(this, dt);
  };
  // small camera push while the cut-in runs
  const rd = G.render;
  G.render = function () {
    if (this.cutT > 0) { const k = 1 - this.cutT / this.cutMax, z0 = this.zoom; this.zoom = z0 * (1 + 0.07 * Math.sin(Math.min(1, k * 1.6) * Math.PI * 0.5)); try { return rd.call(this); } finally { this.zoom = z0; } }
    return rd.call(this);
  };

  // the voice clips load as soon as sound is unlocked, so the first cast is already spoken
  const tk = G.v5Tick;
  G.v5Tick = function (dt) {
    tk.call(this, dt);
    if (this.frame % 120 === 0 && Sound.ctx && Sound.out && !Sound.voiceBuf && !Sound.voiceLoading) { Sound.voiceLoading = true; fetch('assets/audio/voice17.mp3').then(r => r.arrayBuffer()).then(b => new Promise((ok, no) => Sound.ctx.decodeAudioData(b, ok, no))).then(buf => { Sound.voiceBuf = buf; }).catch(() => { Sound.voiceLoading = false; }); }
  };
  const ULT_SUB = 'TUYỆT KỸ';
  // ultimate [Q]
  const cs = G.castSkill;
  G.castSkill = function () {
    const P = this.player, sk = RL.skill, r = rk(RL.id);
    const ready = P.energy >= 100 && !P.car && !P.dead && this.state === 'playing' && !(typeof Net !== 'undefined' && Net.active && Net.guest);
    const noCorpse = sk.id === 'arise' && !this.corpses.some(c => dist(c.x, c.y, P.x, P.y) < 500);
    if (!ready || noCorpse || this.cutT > 0) return cs.call(this);
    const arise = sk.id === 'arise';
    this.startCut({ title: arise ? 'ARISE' : sk.name, sub: arise ? 'TRỖI DẬY' : ULT_SUB, col: sk.color, cls: arise ? 'arise' : '', dur: arise ? 1.45 : 1.15, sfx: CUT_STYLE[sk.id] || 'fire', voice: 'u_' + r, say: arise ? 'Arise' : sk.name, lang: arise ? 'en-US' : 'vi-VN' }, () => {
      cs.call(this);
      if (arise) { // the soldiers rise in waves
        const p = this.player; for (let i = 0; i < 3; i++) setTimeout(() => { FX.ring(p.x, p.y, 10, 160 + i * 90, '#8a7bff', 0.8, 8); Particles.burst(p.x, p.y, 18, '#6b5bff', 220); }, i * 140);
        FX.pillar(p.x, p.y, '#6b5bff', 1.8, 70); this.shake(8);
      }
    });
  };
  // mana skills [V]
  const cm = G.castMana;
  G.castMana = function () {
    const P = this.player, v = this.v10, e = this.v6 && this.v6.skEq, r = rk(RL.id);
    const ok = !P.dead && !P.car && e != null && e >= 0 && this.v6.skills[e] && this.manaCd <= this.time && v.mana >= this.skillCost(e) && this.cutT <= 0 && !(typeof Net !== 'undefined' && Net.active && Net.guest);
    if (!ok) return cm.call(this);
    const S = SKILLS[e];
    // needs a target direction for some skills: the original handles refunds, so only play when it will run
    this.startCut({ title: skName(S), sub: 'KỸ NĂNG', col: S.col, dur: 0.7, hero: false, sfx: CUT_STYLE[S.id] || 'fire', voice: `${S.id}_${r}`, say: skName(S) }, () => cm.call(this));
  };
})();
