// ===== v16: the cast — procedurally written people with faces, classes, traits, backstories and a fate towards the hero =====
const REL = {
  friend: { name: { md: 'Bạn bè', tt: 'Đạo hữu', sl: 'Đồng đội' }, col: '#6ee06e', icon: '☺' },
  sworn: { name: { md: 'Anh em kết nghĩa', tt: 'Huynh đệ kết nghĩa', sl: 'Anh em kết nghĩa' }, col: '#ffcf3a', icon: '⚔' },
  sibling: { name: { md: 'Người thân thất lạc', tt: 'Cốt nhục thất lạc', sl: 'Người thân thất lạc' }, col: '#8ad0ff', icon: '⌂' },
  lover: { name: { md: 'Người thương', tt: 'Duyên tình', sl: 'Người thương' }, col: '#ff7aa8', icon: '♥' },
  rival: { name: { md: 'Đối thủ', tt: 'Kình địch', sl: 'Đối thủ' }, col: '#ffa04a', icon: '⚡' },
  enemy: { name: { md: 'Kẻ thù', tt: 'Cừu nhân', sl: 'Kẻ thù' }, col: '#ff5a5a', icon: '☠' },
  mentor: { name: { md: 'Người dẫn đường', tt: 'Sư phụ', sl: 'Tiền bối' }, col: '#c08bff', icon: '✦' },
};
const REL_STAGE_AT = [20, 45, 70, 95];
const relName = (rel, r) => (REL[rel] ? REL[rel].name[r || R3()] : '');
const CAST_N = 16;
const LIKE_POOL = ['flower', 'food', 'water', 'choco', 'pills', 'bandage', 'medkit', 'planks', 'scrap', 'energy', 'battery'];
const CC = () => (typeof CONTENT15 !== 'undefined' ? CONTENT15 : { traits: [], backstory: {}, relations: {} });
const castRealm = () => R3();
const heWord = n => (castRealm() === 'tt' ? (n.g === 'f' ? 'nàng' : 'chàng') : n.g === 'f' ? 'cô ấy' : 'anh ấy');
function cfill(str, n, extra = {}) {
  const L = LORE[(G._crRealm || (RL && RL.id)) || 'md'] || LORE.md;
  const v = Object.assign({ name: n ? n.name : '', he: n ? heWord(n) : '', hero: Story.names ? Story.names.hero : 'bạn', npc: n ? n.name : '', place: L.names.places[0], faction: L.names.factions[0] }, n && n.ctx, extra);
  return String(str).replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? v[k] : m));
}
const traitOf = key => (CC().traits || []).find(t => t.key === key) || { key, name: 'Bí ẩn', desc: '', lines: {} };
const pickR = (a, rnd = Math.random) => a[Math.floor(rnd() * a.length)];

// ---- appearance / sprites ----
function castSprite(n) {
  const r = rk(RL.id), base = `${r}_cls_${n.cls}_${n.g}`;
  if (!IMG[base]) return RL.npc[0];
  return G.tintSprite(base, n.hue, n.sat || 1, n.lum || 1);
}
Object.assign(G, {
  castList() { return (this.v10 && this.v10.cast && this.v10.cast.list) || []; },
  castBy(id) { return this.castList().find(n => n.id === id); },
  castPortrait(n) { return Face.dataUrl ? Face.dataUrl(n.look, castRealm()) : ''; },

  // ================= generation =================
  castGenerate(seed) {
    const rnd = mulberry32(((seed | 0) ^ 0x7a31c5) >>> 0), r = castRealm(), N = RC_NAMES[r], hero = this.v10.hero || {};
    const L = LORE[RL.id], hg = Story.gender === 'f' ? 'f' : 'm', heroFam = String(Story.names.hero).split(' ')[0];
    const flaws = (hero.flaws || []).map(f => f.key);
    // fate table: who is each person to the hero
    const rels = ['lover', hg === 'm' ? 'lover' : 'lover', 'sworn', 'sworn', 'sibling', 'rival', 'rival', 'enemy', 'enemy', 'mentor', 'friend', 'friend', 'friend', 'friend', 'friend', 'friend'].slice(0, CAST_N);
    if (flaws.includes('feud')) rels[rels.indexOf('friend')] = 'enemy';
    // shuffle (keeps the table, changes who is who)
    for (let i = rels.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [rels[i], rels[j]] = [rels[j], rels[i]]; }
    const used = new Set(), usedNames = new Set(), list = [];
    const dtraits = (CC().traits || []).map(t => t.key);
    for (let i = 0; i < CAST_N; i++) {
      const rel = rels[i];
      const g = rel === 'lover' ? (hg === 'm' ? 'f' : 'm') : rnd() < 0.5 ? 'm' : 'f';
      const elder = rel === 'mentor', band = elder ? 2 : rel === 'sibling' || rel === 'rival' ? (rnd() < 0.5 ? 0 : 1) : Math.floor(rnd() * 3);
      let idx, tries = 0; do { idx = band * 12 + Math.floor(rnd() * 12); } while (used.has(g + idx) && tries++ < 30);
      used.add(g + idx);
      let name, t2 = 0; do { name = (rel === 'sibling' ? heroFam : pickR(N.fam, rnd)) + ' ' + pickR(N[g], rnd); } while (usedNames.has(name) && t2++ < 30);
      usedNames.add(name);
      const cls = pickR(CLASS_KEYS, rnd), apt = Math.min(4, Math.floor(rnd() * rnd() * 5 + (rel === 'mentor' ? 2 : 0)));
      const place = pickR(L.names.places, rnd), faction = pickR(L.names.factions, rnd);
      const n = {
        id: i + 1, name, g, rel, cls, apt, age: elder ? 52 + Math.floor(rnd() * 20) : band === 0 ? 18 + Math.floor(rnd() * 10) : band === 1 ? 29 + Math.floor(rnd() * 16) : 17 + Math.floor(rnd() * 8),
        look: { g, i: idx, m: rnd() < 0.5 ? 1 : 0 }, trait: pickR(dtraits, rnd), trait2: pickR(dtraits, rnd), hue: Math.floor(rnd() * 12) * 30, sat: 0.85 + rnd() * 0.4, lum: 0.9 + rnd() * 0.25,
        likes: [pickR(LIKE_POOL, rnd), pickR(LIKE_POOL, rnd)], dislike: pickR(LIKE_POOL, rnd),
        ctx: { place, faction }, meetLv: 1 + Math.floor(i * 1.5 + rnd() * 2) + (rel === 'enemy' ? 2 : 0), lvlOff: Math.floor(rnd() * 3) - 1,
        aff: rel === 'enemy' ? 0 : rel === 'sibling' ? 10 : 0, stage: 0, state: 'unmet', links: [], flags: {}, talkDay: -1, talkCd: 0, giftDay: -1, giftN: 0,
        talents: [{ key: pickR(Object.keys(TALENT_FX), rnd), v: Math.floor(rnd() * 3), g: Math.min(4, apt) }], flaws: rnd() < 0.5 ? [{ key: pickR(Object.keys(FLAW_FX).filter(k => k !== 'feud'), rnd), v: Math.floor(rnd() * 3), g: Math.min(3, Math.floor(rnd() * 2)) }] : [],
      };
      const B = (CC().backstory || {})[r] || {};
      const bp = k => (B[k] && B[k].length ? cfill(pickR(B[k], rnd), n) : '');
      n.bio = { origin: bp('origin'), wound: bp('wound'), motive: bp('motive'), secret: bp('secret'), look: bp('look') };
      if (n.talents[0].key === n.flaws[0]?.key) n.flaws = [];
      list.push(n);
    }
    // links between people: siblings share a surname, the rest are written from the link templates
    const LK = ((CC().relations || {})[r] || {}).links || {};
    const types = Object.keys(LK);
    const addLink = (a, b, type) => { if (a === b || a.links.some(l => l.to === b.id) || b.links.some(l => l.to === a.id)) return; const tpl = LK[type] && LK[type].length ? pickR(LK[type], rnd) : ''; a.links.push({ to: b.id, type, tpl }); b.links.push({ to: a.id, type: type === 'mentor' ? 'student' : type === 'debt' ? 'creditor' : type, tpl }); };
    const pool = list.filter(n => n.rel !== 'sibling');
    for (let k = 0; k < 8 && types.length; k++) { const a = pickR(pool, rnd), b = pickR(pool, rnd), tp = pickR(types, rnd); if (tp === 'lover' && a.g === b.g && rnd() < 0.7) continue; addLink(a, b, tp); }
    // two of them are siblings of each other
    const sibs = pool.filter(n => n.rel === 'friend' || n.rel === 'rival'); if (sibs.length >= 2) { const [a, b] = [sibs[0], sibs[1]]; b.name = a.name.split(' ')[0] + ' ' + b.name.split(' ').slice(1).join(' '); addLink(a, b, 'sibling'); }
    this.v10.cast = { list, seed, nextEnc: this.time + 90, evt: 0 };
    return list;
  },
  castCounts() { const c = {}; for (const n of this.castList()) c[n.rel] = (c[n.rel] || 0) + 1; return c; },

  // ================= dialogue =================
  castLine(n, kind) { const t = traitOf(n.trait), a = t.lines && t.lines[kind]; return a && a.length ? cfill(pickR(a), n) : ''; },
  rcLine(r, kind) {
    const n = r && r.cast ? this.castBy(r.cast) : null;
    if (n) { const l = this.castLine(n, kind === 'follow' ? 'greet' : kind); if (l) return l; }
    return R.pick(RC_LINES[kind] || RC_LINES.hello);
  },
  relLine(n, stage) {
    const R0 = ((CC().relations || {})[castRealm()] || {}).rel || {}, a = R0[n.rel] && R0[n.rel][Math.min(3, stage)];
    return a && a.length ? a.map(s => cfill(s, n)) : [];
  },
  relPool(key, n) { const a = ((CC().relations || {})[castRealm()] || {})[key]; return Array.isArray(a) ? a.map(s => cfill(s, n)) : []; },
  say(n, lines, opts = {}) {
    const P = this.castPortrait(n);
    UI.dialog(Object.assign({ lines: lines.filter(Boolean).map(t => ({ who: 'npc', text: t })), name: n.name, portrait: P || null, romance: false }, opts));
  },

  // ================= affinity and stages =================
  castAff(n, amt, quiet) {
    if (n.rel === 'enemy' && n.state === 'foe') return;
    const before = n.aff;
    n.aff = clamp(n.aff + amt, 0, 100);
    if (!quiet && n.aff > before + 0.4) Floaters.add(this.player.x, this.player.y - 36, `${REL[n.rel].icon} ${n.name} +${Math.round(n.aff - before)}`, REL[n.rel].col, 9);
    let st = 0; REL_STAGE_AT.forEach((t, i) => { if (n.aff >= t) st = i + 1; });
    st = Math.min(4, st);
    if (st > n.stage) { n.stage = st; n.pendingScene = st; }
  },
  // story beat when a stage is reached: lines from the generated pack + the mechanical reward
  castScene(n) {
    const st = n.pendingScene; if (!st) return false; n.pendingScene = 0;
    const lines = this.relLine(n, Math.min(3, st - 1));
    const P = this.player, v = this.v10, fx = [];
    const pts = k => { v.pts += k; fx.push(`+${k} điểm tiềm năng`); };
    if (n.rel === 'friend') { if (st === 4) { pts(2); n.flags.bond = 1; fx.push('trở thành tri kỷ: sức mạnh khi đi cùng +10%'); } else if (st === 2) fx.push('có thể mời đi cùng'); }
    if (n.rel === 'sworn') { if (st === 3) fx.push('có thể làm lễ KẾT NGHĨA'); }
    if (n.rel === 'sibling') { if (st === 4) { P.maxHp += 20; P.hp += 20; pts(2); n.flags.bond = 1; fx.push('+20 máu tối đa (tình thân)'); } }
    if (n.rel === 'lover') { if (st === 4) fx.push('có thể TỎ TÌNH'); }
    if (n.rel === 'rival') { if (st === 2) fx.push('có thể THÁCH ĐẤU'); if (st === 4) { n.flags.bond = 1; fx.push('hóa kình địch thành bạn: sức mạnh khi đi cùng +10%'); } }
    if (n.rel === 'mentor') { if (st === 2) pts(2); if (st === 3) pts(3); if (st === 4) { fx.push('truyền lại một thiên phú'); n.flags.gift = 1; } }
    const title = `${REL[n.rel].icon} ${relName(n.rel)} — ${['', 'Quen biết', 'Thân thiết', 'Gắn bó', 'Tri kỷ'][st] || ''}`;
    this.say(n, lines.slice(0, 3), { title, onDone: () => { if (fx.length) this.toast(`${n.name}: ${fx.join(' • ')}`, 'love'); Sound.play('sfx_heart', 0.5); if (n.flags.gift === 1) { n.flags.gift = 2; this.castGiftTalent(n); } } });
    return true;
  },
  castGiftTalent(n) { this.lvlQueue++; this.state = 'levelup'; UI.levelUp(); this.toast(`${n.name} truyền cho bạn một thiên phú — hãy chọn.`, 'quest'); },
  castBond(n) { return n.flags.bond ? 1.1 : 1; },

  // ================= encounters =================
  castSpawnNear(n, x, y) {
    const a = new Ally('cast', x, y, { img: castSprite(n) });
    a.cid = n.id; a.name = n.name; a.home = { x, y }; a.sayT = R.range(6, 14);
    this.allies.push(a); n.at = { x: Math.round(x), y: Math.round(y) };
    return a;
  },
  castAlly(n) { return this.allies.find(a => a.kind === 'cast' && a.cid === n.id && !a.dead); },
  castFreeSpot(px, py, d0, d1) {
    for (let k = 0; k < 14; k++) {
      const a = R.range(0, TAU), d = R.range(d0, d1), x = px + Math.cos(a) * d, y = py + Math.sin(a) * d;
      const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
      if (World.walkable(tx, ty) && World.free(tx, ty, 1)) return { x, y };
    }
    return null;
  },
  // first meeting: they appear a few steps ahead and introduce themselves
  castMeet(n) {
    const P = this.player, pos = this.castFreeSpot(P.x, P.y, 230, 380); if (!pos) return false;
    n.state = 'met'; n.metDay = this.day;
    const lines = [];
    const gl = this.castLine(n, 'greet'); if (gl) lines.push(gl);
    lines.push(n.bio.origin || `Tôi là ${n.name}.`);
    const mood = { friend: n.bio.look, sworn: n.bio.motive, sibling: n.bio.look, lover: n.bio.look, rival: n.bio.motive, mentor: n.bio.motive }[n.rel];
    if (mood) lines.push(mood);
    const a = this.castSpawnNear(n, pos.x, pos.y);
    FX.pillar(pos.x, pos.y, REL[n.rel].col, 0.9, 20);
    Sound.play('sfx_heart', 0.35, 1.3);
    this.toast(`${REL[n.rel].icon} Một người lạ phía trước: ${n.name}.`, 'love');
    setTimeout(() => { if (this.state === 'playing') this.say(n, lines.slice(0, 3), { title: `${REL[n.rel].icon} Gặp gỡ` }); }, 1200);
    return true;
  },
  castRespawnMet() {
    const P = this.player; if (World.mode !== 'over') return;
    for (const n of this.castList()) {
      if (n.state !== 'met' || !n.at || this.castAlly(n)) continue;
      if (dist(n.at.x, n.at.y, P.x, P.y) < 1100) this.castSpawnNear(n, n.at.x, n.at.y);
    }
    for (const a of this.allies) if (a.kind === 'cast' && dist(a.x, a.y, P.x, P.y) > 2000) a.dead = true;
  },
  castDirector() {
    const v = this.v10, P = this.player; if (!v.cast || World.mode !== 'over' || P.dead || this.state !== 'playing' || UI.dialogOpen) return;
    if (this.time < (v.cast.nextEnc || 0)) return;
    if (this.zombies.some(z => !z.dead && z.state === 'chase' && dist(z.x, z.y, P.x, P.y) < 500)) return;
    // an enemy who got away comes back stronger
    const back = this.castList().find(n => n.state === 'foe' && !this.zombies.some(z => z.cast === n.id && !z.dead));
    if (back && Math.random() < 0.5 && P.level >= back.meetLv) { back.stage = Math.min(3, back.stage + 1); v.cast.nextEnc = this.time + R.range(110, 190); this.castFoeAppear(back); return; }
    const next = this.castList().find(n => n.state === 'unmet' && P.level >= n.meetLv);
    if (!next) { v.cast.nextEnc = this.time + 60; return; }
    v.cast.nextEnc = this.time + R.range(110, 190);
    if (next.rel === 'enemy') this.castFoeAppear(next); else this.castMeet(next);
  },

  // ================= enemies and duels =================
  castFoeAppear(n) {
    const P = this.player, pos = this.castFreeSpot(P.x, P.y, 420, 620); if (!pos) { this.v10.cast.nextEnc = this.time + 20; return; }
    const duel = n.rel === 'rival', lvl = Math.max(1, P.level + 1 + n.stage + n.lvlOff);
    const z = this.spawnEnemy(n.cls === 'warrior' ? 'brute' : 'runner', pos.x, pos.y, { elite: true, lvl, state: 'chase' });
    z.name = `${n.name} (${relName(n.rel)})`; z.cast = n.id; z.duel = duel; z.img = castSprite(n); z.scale = 1.1;
    z.maxHp = z.hp = z.maxHp * (1 + 0.25 * n.stage); z.xp *= 1.5;
    z.lastSeen = { x: P.x, y: P.y }; z.target = null;
    n.state = n.state === 'unmet' ? 'foe' : n.state; n.foeId = z.id;
    FX.pillar(pos.x, pos.y, REL[n.rel].col, 1, 26); Sound.play('sfx_gong', 0.4, 0.8);
    const line = this.relPool(duel ? 'duel' : 'ambush', n);
    this.toast(`${REL[n.rel].icon} ${n.name} xuất hiện!`, 'warn');
    if (line.length) setTimeout(() => { if (this.state === 'playing') this.say(n, [pickR(line)], { title: `${REL[n.rel].icon} ${relName(n.rel)}` }); }, 600);
    z._cfStart = this.time;
  },
  // the first lethal blow ends the fight instead
  castYield(z) {
    const n = this.castBy(z.cast); if (!n) return false;
    z.yielded = true; z.hp = Math.max(1, z.maxHp * 0.18); z.stun = 999; z.state = 'idle';
    const kill = () => { z.stun = 0; z.yielded = false; z._noYield = true; z.cast = null; this.killEnemy(z, 'melee'); };
    const done = (key, extra) => { z.dead = true; Particles.burst(z.x, z.y, 14, REL[n.rel].col, 160); const i = this.zombies.indexOf(z); if (i >= 0) this.zombies.splice(i, 1); if (extra) extra(); };
    if (n.rel === 'rival') {
      const l = this.relPool('duel', n);
      UI.menuDialog({ name: n.name, portrait: this.castPortrait(n) || null, text: `${n.name} thở dốc, giơ tay xin dừng: "${R.pick(['Đủ rồi — ngươi thắng.', 'Được... lần này tôi chịu.', 'Mạnh thật. Lần sau tôi sẽ không thua đâu.'])}"`, options: [{ text: 'Kết thúc tỉ thí (+thân thiết)', act: () => done('duel', () => { n.state = 'met'; n.at = { x: z.x, y: z.y }; this.castAff(n, 28); this.addXp(30 + n.stage * 20); n.nextDuel = this.time + 120; }) }] });
    } else {
      const lines = this.relPool('mercy', n);
      UI.menuDialog({ name: n.name, portrait: this.castPortrait(n) || null, text: `${n.name} quỵ xuống, ôm vết thương. ${lines.length ? '"' + pickR(lines) + '"' : ''}`, options: [
        { text: `Tha mạng (kết thúc ân oán)`, act: () => done('spare', () => { n.rel = 'friend'; n.state = 'met'; n.at = { x: z.x, y: z.y }; n.aff = 35; n.stage = 2; n.flags.spared = 1; n.flags.redeemed = 1; this.toast(`${n.name} nhìn bạn rất lâu rồi lặng lẽ rời đi. Ân oán đã tan.`, 'love'); this.addXp(60); }) },
        { text: 'Kết liễu', act: () => { n.state = 'dead'; kill(); this.toast(`${n.name} đã ngã xuống. Món nợ máu được trả.`, 'warn'); } },
      ] });
    }
    return true;
  },
  // ================= joining the party =================
  castJoin(n) {
    const v = this.v10;
    if (v.recruits.some(r => r.cast === n.id)) return false;
    const spec = { name: n.name, g: n.g, role: n.cls, star: Math.min(4, 1 + Math.floor(n.apt / 1.5) + (n.flags.bond ? 1 : 0)), lvl: Math.max(1, this.player.level + n.lvlOff), xp: 0, sprite: 0, cast: n.id, look: n.look, spr: castSprite(n), follow: false, hurtUntil: 0 };
    const ok = this.hire(spec, 0); if (!ok) return false;
    n.state = 'joined'; const a = this.castAlly(n); if (a) { a.dead = true; }
    return true;
  },
  castLeave(n) { const v = this.v10, i = v.recruits.findIndex(r => r.cast === n.id); if (i >= 0) { const r = v.recruits[i]; const a = this.allies.find(x => x.rc === r && !x.dead); if (a) a.dead = true; v.recruits.splice(i, 1); } n.state = 'met'; const bp = this.v5 && this.v5.basePos; n.at = bp ? { x: bp.x - 160 + n.id * 28, y: bp.y + 240 } : { x: this.player.x, y: this.player.y }; },
});

(function () {
  // ---------- ally kind 'cast': stands where they were met ----------
  const au = Ally.prototype.update;
  Ally.prototype.update = function (dt) {
    if (this.kind === 'cast') {
      const P = G.player, n = G.castBy(this.cid); this.hurtT -= dt;
      if (this.say) { this.say.t -= dt; if (this.say.t <= 0) this.say = null; }
      this.angle += angDiff(this.angle, Math.atan2(P.y - this.y, P.x - this.x)) * Math.min(1, dt * 3);
      this.sayT -= dt;
      if (this.sayT <= 0) { this.sayT = R.range(14, 28); if (n && dist(this.x, this.y, P.x, P.y) < 320) this.speak(G.castLine(n, 'greet') || R.pick(RC_LINES.hello), 3); }
      return;
    }
    return au.call(this, dt);
  };
  const ah = Ally.prototype.hurt;
  Ally.prototype.hurt = function (d) { if (this.kind === 'cast') return; return ah.call(this, d); };
  // name + relation colour above them
  const ad = Ally.prototype.draw;
  Ally.prototype.draw = function (c) {
    ad.call(this, c);
    if (this.kind !== 'cast') return;
    const n = G.castBy(this.cid); if (!n) return;
    c.font = '11px VT323, monospace'; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,0.85)';
    const t = `${REL[n.rel].icon} ${n.name}`; c.strokeText(t, this.x, this.y - 24); c.fillStyle = REL[n.rel].col; c.fillText(t, this.x, this.y - 24);
  };

  // ---------- interactions ----------
  const fi = G.findInteract;
  G.findInteract = function () {
    const best = fi.call(this), P = this.player;
    if (P.car) return best;
    const o = best && (best.prop || best.ally || best.corpse), db = o ? dist(o.x, o.y, P.x, P.y) : best ? 0 : 1e9;
    for (const a of this.allies) {
      if (a.kind !== 'cast' || a.dead || (this._ixSkip && this._ixSkip.has(a))) continue;
      const n = this.castBy(a.cid); if (!n) continue;
      if (dist(a.x, a.y, P.x, P.y) < Math.min(60, db + 6)) return { ally: a, kind: 'cast', label: `${REL[n.rel].icon} ${n.name} • ${relName(n.rel)}` };
    }
    return best;
  };
  const ia = G.interact;
  G.interact = function (it) {
    if (it && it.kind === 'cast') { const n = this.castBy(it.ally.cid); if (n) return UI.openCast(n); }
    return ia.call(this, it);
  };

  // ---------- fights that end in a yield ----------
  const ke = G.killEnemy;
  G.killEnemy = function (z, src) {
    if (z.cast && !z.yielded && !z._noYield) { if (this.castYield(z)) return; }
    return ke.call(this, z, src);
  };

  // ---------- recruits show their face and speak in character ----------
  const rs = G.rcSprite;
  G.rcSprite = function (r) { return r.spr && IMG[r.spr] ? r.spr : rs.call(this, r); };

  // ---------- world generation and per-frame work ----------
  const nt = G.newGame;
  G.newGame = function (realm, seed, hero, gender) {
    const r = nt.apply(this, arguments);
    if (this.v10 && !this.v10.cast) { this.castGenerate(this.seed || Math.floor(Math.random() * 1e9)); }
    return r;
  };
  const tk = G.v5Tick;
  G.v5Tick = function (dt) {
    tk.call(this, dt);
    if (!this.v10 || !this.v10.cast || this.state !== 'playing') return;
    if (this.frame % 90 === 0) this.castRespawnMet();
    if (this.frame % 120 === 0) this.castDirector();
    // rivals ask for a rematch now and then
    if (this.frame % 600 === 0) for (const n of this.castList()) if (n.rel === 'rival' && n.state === 'met' && n.stage >= 2 && (n.nextDuel || 0) < this.time && n.flags && !n.flags.bond) { const a = this.castAlly(n); if (a && dist(a.x, a.y, this.player.x, this.player.y) < 500) a.speak(R.pick(this.relPool('duel', n)) || 'Đấu lại không?', 4); }
    // a stage scene plays as soon as the menu is closed
    for (const n of this.castList()) if (n.pendingScene && !UI.dialogOpen && !UI.castOpen) { this.castScene(n); break; }
  };
})();

// the story starts with who the hero is: origin, talents and flaws
(function () {
  const sb = Story.begin;
  Story.begin = function () {
    const h = G.v10 && G.v10.hero;
    if (h && h.origin != null && !h.introShown) {
      h.introShown = 1;
      const lines = [{ who: 'sys', text: G.destinyOrigin(h) }];
      for (const t of G.heroTalentList()) if (t.story) lines.push({ who: 'sys', text: `${t.kind === 'flaw' ? '▼' : '▲'} ${t.name} — ${t.story}` });
      return UI.dialog({ lines, title: `${Story.names.hero} — thân thế`, cinematic: true, onDone: () => sb.call(this) });
    }
    return sb.call(this);
  };
})();
