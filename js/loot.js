// ===== Random gear: weapons with rarity + affixes, relics =====
let UID = 1;
const SLOT_POSE = { r1: 0, r2: 1, r3: 2, melee: 3 };
const Loot = {
  rollRarity(bonus = 0) {
    const w = RARITY.map((r, i) => r.w * (1 + bonus * i * 0.6));
    let tot = w.reduce((a, b) => a + b, 0), r = Math.random() * tot;
    for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; }
    return 0;
  },
  weapon(slot, ilvl, rarity) {
    const it = { kind: 'weapon', uid: UID++, slot, realm: RL.id, rarity, ilvl: Math.max(1, ilvl), affixes: [] };
    const pool = Object.keys(AFFIXES).filter(k => slot === 'melee' ? !AFFIXES[k].ranged : !AFFIXES[k].melee);
    if (slot === 'melee' && RL.weapons.melee.wave && !it.affixes.includes('wave') && rarity >= 2) it.affixes.push('wave');
    while (it.affixes.length < RARITY[rarity].affixes) {
      const a = R.pick(pool); if (!it.affixes.includes(a)) it.affixes.push(a);
    }
    it.name = this.nameOf(it);
    return it;
  },
  randomWeapon(ilvl, bonus) { return this.weapon(R.pick(SLOT_ORDER), ilvl, this.rollRarity(bonus)); },
  relic(ilvl, rarity) {
    const type = R.pick(Object.keys(RELICS));
    const d = RELICS[type];
    const v = type === 'revive' ? 1 : type === 'orbit' ? Math.min(6, 1 + Math.floor(rarity / 1.5) + 1) : d.base * (0.7 + rarity * 0.35) * (1 + ilvl * 0.015);
    return { kind: 'relic', uid: UID++, type, rarity, ilvl, value: v, name: d.name, icon: d.icon };
  },
  nameOf(it) {
    const W = REALMS[it.realm].weapons[it.slot];
    if (it.rarity >= 4) {
      const L = REALMS[it.realm].legend[it.slot];
      const nm = L[it.uid % L.length];
      return (it.rarity === 5 ? '✦ ' : '') + nm;
    }
    const a = it.affixes[0];
    return W.name + (a ? ' ' + AFFIXES[a].name : '');
  },
  // derived combat numbers for an equipped weapon item
  stats(it) {
    if (!it) return null;
    const b = BASE[it.slot];
    const R0 = RARITY[it.rarity];
    const W = REALMS[it.realm].weapons[it.slot];
    const lv = 1 + (it.ilvl - 1) * 0.085;
    const s = Object.assign({}, b);
    s.dmg = b.dmg * R0.mult * lv;
    s.name = it.name; s.icon = W.icon; s.proj = W.proj || 'bullet'; s.color = W.color; s.sfx = W.sfx; s.trail = W.trail;
    s.sprite = REALMS[it.realm].hero[SLOT_POSE[it.slot]];
    s.affixes = it.affixes; s.homing = W.homing || it.affixes.includes('homing');
    s.crit = it.affixes.includes('crit') ? 0.15 : 0;
    if (it.affixes.includes('haste')) s.rate /= 1.25;
    if (it.affixes.includes('multi')) s.extra = 2;
    if (it.affixes.includes('pierce')) s.pierce = (s.pierce || 0) + 2;
    if (it.affixes.includes('giant')) { s.range *= 1.45; s.knock *= 1.3; }
    if (it.affixes.includes('wave') || W.wave) s.wave = true;
    if (s.mag) s.mag = Math.round(s.mag * (1 + it.rarity * 0.12));
    return s;
  },
  power(it) {
    if (it.kind === 'relic') return it.rarity * 10 + it.ilvl;
    const s = this.stats(it);
    return s.dmg * (s.pellets || 1) * (1 + (s.extra || 0) * 0.3) / s.rate * (1 + it.affixes.length * 0.18);
  },
  describe(it) {
    if (it.kind === 'relic') return RELICS[it.type].desc(it.value);
    const s = this.stats(it);
    const lines = [`Sát thương ${Math.round(s.dmg)}${s.pellets ? ' x' + s.pellets : ''} • ${(1 / s.rate).toFixed(1)} đòn/giây${s.mag ? ' • băng ' + s.mag : ''}`];
    for (const a of it.affixes) lines.push(`◆ ${AFFIXES[a].name}: ${AFFIXES[a].desc}`);
    return lines.join('\n');
  },
  iconOf(it) { return it.kind === 'relic' ? it.icon : REALMS[it.realm].weapons[it.slot].icon; },
};
