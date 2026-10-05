// ===== Random storyline, companions, romance =====
const Story = {
  init(realm, seed, hero) {
    const L = LORE[realm];
    const rnd = mulberry32(seed ^ 0x5f3759df);
    const pick = a => a[Math.floor(rnd() * a.length)];
    this.realm = realm;
    this.tplIdx = Math.floor(rnd() * L.stories.length);
    this.compIdx = rnd() < 0.5 ? 0 : 1;
    this.names = {
      hero, villain: pick(L.names.villains), artifact: pick(L.names.artifacts), place: pick(L.names.places), faction: pick(L.names.factions),
      companion: L.companions[this.compIdx].name, friend: L.companions[1 - this.compIdx].name,
    };
    this.act = 0; this.count = 0; this.finished = false;
    // place story locations around the start, in superblock units
    const ang0 = rnd() * TAU;
    const at = (d, a) => ({ sx: Math.round(Math.cos(a) * d), sy: Math.round(Math.sin(a) * d) });
    const gateRank = { md: 'C', cy: 'C', ct: 'C', tt: 'C', sl: 'B' }[realm];
    this.pois = [];
    const p0 = at(3, ang0); this.pois.push(Object.assign(p0, { kind: 'landmark', act: 0 }));
    for (let i = 0; i < 3; i++) { const p = at(4 + i * 2 + Math.floor(rnd() * 2), ang0 + 1.2 + i * 1.6 + rnd() * 0.5); this.pois.push(Object.assign(p, { kind: 'artifact', act: 1 })); }
    const p2 = at(8 + Math.floor(rnd() * 3), ang0 + Math.PI + rnd() * 0.6); this.pois.push(Object.assign(p2, { kind: 'captive', act: 2, comp: this.compIdx }));
    const p3 = at(9 + Math.floor(rnd() * 3), ang0 + Math.PI / 2 + rnd() * 0.6); this.pois.push(Object.assign(p3, { kind: 'storygate', act: 3, rank: gateRank }));
    const p4 = at(13 + Math.floor(rnd() * 3), ang0 - Math.PI / 2 + rnd() * 0.6); this.pois.push(Object.assign(p4, { kind: 'lair', act: 4 }));
    // de-duplicate cells
    const seen = new Set();
    for (const p of this.pois) { while (seen.has(p.sx + ',' + p.sy) || (Math.abs(p.sx) <= 1 && Math.abs(p.sy) <= 1)) p.sx += 1; seen.add(p.sx + ',' + p.sy); }
  },
  get tpl() { return LORE[this.realm].stories[this.tplIdx]; },
  get L() { return LORE[this.realm]; },
  fmt(s) { return String(s).replace(/\{(\w+)\}/g, (m, k) => this.names[k] != null ? this.names[k] : m); },
  poiAt(sx, sy) {
    if (!this.pois || World.mode !== 'over') return null;
    for (const p of this.pois) if (p.sx === sx && p.sy === sy && !p.done) return p;
    return null;
  },
  curAct() { return this.finished ? null : this.tpl.acts[this.act]; },
  goal() {
    if (this.finished) return 'Tự do khám phá — chinh phục các Cổng và tìm bảo vật';
    const a = this.curAct();
    let g = this.fmt(a.goal);
    if (a.type === 'collect') g += ` (${this.count}/3)`;
    return g;
  },
  targets() {
    if (this.finished || World.mode !== 'over') return [];
    return this.pois.filter(p => p.act === this.act && !p.done).map(p => {
      // precise spot if generated, otherwise the superblock centre
      return { x: (p.sx * SB + 18) * TILE, y: (p.sy * SB + 18) * TILE, label: { landmark: 'Mục tiêu', artifact: this.names.artifact, captive: this.names.companion, storygate: 'Cổng', lair: this.names.villain }[p.kind] };
    });
  },
  begin() {
    const lines = this.tpl.intro.map(t => ({ who: 'sys', text: this.fmt(t) }));
    UI.dialog({ lines, title: this.fmt(this.tpl.title), cinematic: true, onDone: () => this.startAct() });
  },
  startAct() {
    const a = this.curAct(); if (!a) return;
    UI.radio(a.start.map(t => this.fmt(t)));
    G.toast('NHIỆM VỤ: ' + this.goal(), 'quest');
  },
  complete() {
    const a = this.curAct(); if (!a) return;
    for (const p of this.pois) if (p.act === this.act) p.done = true;
    Sound.play('sfx_achievement', 0.7);
    G.addXp(200 * (this.act + 1));
    this.act++; this.count = 0;
    UI.radio(a.done.map(t => this.fmt(t)), () => {
      if (this.act >= this.tpl.acts.length) this.finish();
      else this.startAct();
    });
    G.save();
  },
  tick() {
    const a = this.curAct(); if (!a || World.mode !== 'over') return;
    const P = G.player.car || G.player;
    if (a.type === 'explore') {
      const p = this.pois.find(q => q.act === this.act);
      const x = (p.sx * SB + 18) * TILE, y = (p.sy * SB + 18) * TILE;
      if (dist(P.x, P.y, x, y) < 260) {
        // the second companion is waiting at the landmark
        const c = G.companions[1 - this.compIdx];
        if (c && !c.joined) G.recruit(c, x, y + 40);
        this.complete();
      }
    }
  },
  onArtifact() {
    if (this.curAct() && this.curAct().type === 'collect') { this.count++; G.toast(`${this.names.artifact} (${this.count}/3)`, 'quest'); if (this.count >= 3) this.complete(); }
    else G.give('scrap', 3);
  },
  onRescue() { if (this.curAct() && this.curAct().type === 'rescue') this.complete(); },
  onGate(story) { if (story && this.curAct() && this.curAct().type === 'gate') this.complete(); },
  onBoss(story) { if (story && this.curAct() && this.curAct().type === 'boss') this.complete(); },
  finish() {
    this.finished = true;
    G.achieve('story');
    const lover = G.companions.find(c => c.lover) || G.companions.filter(c => c.joined).sort((a, b) => b.aff - a.aff)[0];
    const romance = lover && lover.aff >= 100;
    const names = Object.assign({}, this.names);
    if (romance) this.names.companion = lover.data.name;
    const lines = (romance ? this.tpl.endings.romance : this.tpl.endings.normal).map(t => ({ who: 'sys', text: this.fmt(t) }));
    this.names = names;
    if (romance) Sound.setMusic('music_romance'); else Sound.setMusic('music_victory');
    UI.dialog({ lines, title: romance ? 'KẾT THÚC: TRÁI TIM TÌM THẤY NHAU' : 'KẾT THÚC', cinematic: true, portrait: romance ? lover.data.portrait : null, onDone: () => UI.victory(romance, lover) });
  },
  serialize() { return { realm: this.realm, tplIdx: this.tplIdx, compIdx: this.compIdx, names: this.names, act: this.act, count: this.count, finished: this.finished, pois: this.pois }; },
  load(d) { Object.assign(this, d); },
};

// ---------- companion helpers on G ----------
Object.assign(G, {
  setupCompanions() {
    const L = LORE[RL.id];
    this.companions = L.companions.map((d, i) => ({
      idx: i, aff: 0, stage: 0, joined: false, lover: false, scenePending: false, talkT: 0,
      data: Object.assign({}, d, { name: d.name, portrait: RL.port[i] || d.portrait, sprite: RL.npc[RL.compSprite[i]] }),
    }));
  },
  recruit(c, x, y) {
    c.joined = true;
    const a = new Ally('comp', x, y, { img: c.data.sprite, comp: Object.assign(c.data, { ref: c }) });
    c.ally = a;
    this.allies.push(a);
    this.addAff(c, 5);
    Sound.play('sfx_heart', 0.6);
    UI.dialog({ lines: c.data.meet.map(l => ({ who: l.who, text: Story.fmt(l.text) })), name: c.data.name, portrait: c.data.portrait, onDone: () => this.toast(`${c.data.name} đã gia nhập đội! Đến gần và nhấn [E] để trò chuyện.`, 'good') });
  },
  addAff(c, n) {
    if (!c || c.aff >= 100 && c.lover) return;
    const before = c.aff;
    c.aff = clamp(c.aff + n * (1 + (this.player.perks.charm || 0)), 0, 100);
    const next = (c.stage + 1) * 20;
    if (c.stage < 5 && c.aff >= next && !c.scenePending) {
      c.scenePending = true;
      this.toast(`♥ ${c.data.name} muốn nói chuyện riêng với bạn... (đến gần, nhấn E)`, 'love');
      Sound.play('sfx_heart', 0.5);
    }
    if (Math.floor(before / 10) !== Math.floor(c.aff / 10) && n > 0 && c.ally) Floaters.add(c.ally.x, c.ally.y - 30, '♥', '#ff8ab8', 14, true);
    UI.dirty = true;
  },
  romanceReady(comp) { return comp && comp.ref && comp.ref.scenePending; },
  playScene(c) {
    const sc = c.data.stages[c.stage];
    if (!sc) { c.scenePending = false; return; }
    const prev = Sound.currentMusic;
    Sound.setMusic('music_romance');
    UI.dialog({
      title: '♥ ' + Story.fmt(sc.title), name: c.data.name, portrait: c.data.portrait,
      lines: sc.lines.map(l => ({ who: l.who, text: Story.fmt(l.text) })),
      choices: sc.choices.map(ch => ({ text: Story.fmt(ch.text), reply: Story.fmt(ch.reply), aff: ch.aff })),
      onChoice: ch => { c.aff = clamp(c.aff + Math.min(0, ch.aff), 0, 100); if (ch.aff > 0) c.bonus = (c.bonus || 0) + ch.aff; },
      onDone: () => {
        c.stage++; c.scenePending = false;
        if (c.bonus) { this.addAff(c, c.bonus); c.bonus = 0; }
        if (c.stage >= 5) {
          c.lover = true; c.aff = 100;
          this.achieve('love');
          this.toast(`♥ ${c.data.name} và ${Story.names.hero} đã thuộc về nhau. (Người thương sẽ hồi sinh bạn 1 lần mỗi ngày)`, 'love');
          if (c.ally) { for (let i = 0; i < 20; i++) Particles.add({ x: c.ally.x, y: c.ally.y, vx: R.range(-60, 60), vy: R.range(-120, -30), life: 1.5, max: 1.5, size: 4, col: '#ff8ab8', drag: 1, glow: true }); }
        } else if (c.stage >= 2) this.toast(`${c.data.name} giờ sẽ hồi máu cho bạn khi bạn nguy kịch.`, 'love');
        Sound.setMusic(prev);
        this.save();
      },
    });
  },
  companionMenu(c) {
    if (c.scenePending) { this.playScene(c); return; }
    const opts = [];
    opts.push({ text: 'Trò chuyện', act: () => {
      const line = R.pick(c.data.banter);
      UI.dialog({ name: c.data.name, portrait: c.data.portrait, lines: [{ who: 'npc', text: Story.fmt(line) }] });
      if (this.time - c.talkT > 60) { c.talkT = this.time; this.addAff(c, 2); }
    } });
    const gifts = ['flower', 'choco', 'food', 'water', 'energy', 'bandage', 'medkit', 'pills', 'battery'].filter(id => this.has(id));
    for (const id of gifts.slice(0, 4)) {
      const liked = (c.data.likes || []).includes(id);
      opts.push({ text: `Tặng ${ITEMS[id].name}${liked ? ' ♥' : ''}`, act: () => {
        this.take(id);
        this.addAff(c, liked ? 10 : 3);
        UI.dialog({ name: c.data.name, portrait: c.data.portrait, lines: [{ who: 'npc', text: Story.fmt(R.pick(c.data.gift)) }] });
        Sound.play('sfx_heart', 0.5);
      } });
    }
    opts.push({ text: 'Đi thôi', act: () => {} });
    UI.menuDialog({ name: c.data.name, portrait: c.data.portrait, text: `Độ thân mật: ${Math.round(c.aff)}/100 ${'♥'.repeat(c.stage)}${'♡'.repeat(5 - c.stage)}`, options: opts });
  },
});
