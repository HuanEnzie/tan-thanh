// ===== Random gear: weapons (with melee styles), armor, relics — rarity + affixes =====
let UID = 1;
const SLOT_POSE = { r1: 0, r2: 1, r3: 2, melee: 3 };
const Loot = {
  rollRarity(bonus = 0, min = 0) {
    const w = RARITY.map((r, i) => i < min ? 0 : r.w * (1 + bonus * i * 0.6));
    let tot = w.reduce((a, b) => a + b, 0), r = Math.random() * tot;
    for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; }
    return min;
  },
  weapon(slot, ilvl, rarity, mtype) {
    const it = { kind: 'weapon', uid: UID++, slot, realm: RL.id, rarity, ilvl: Math.max(1, ilvl), affixes: [] };
    if (slot === 'melee') {
      if (mtype === undefined) mtype = Math.random() < 0.8 ? R.int(0, MELEE_TYPES.length - 1) : -1;
      if (mtype >= 0) it.mtype = mtype;
    }
    const pool = Object.keys(AFFIXES).filter(k => slot === 'melee' ? !AFFIXES[k].ranged : !AFFIXES[k].melee);
    while (it.affixes.length < RARITY[rarity].affixes) {
      const a = R.pick(pool); if (!it.affixes.includes(a)) it.affixes.push(a);
    }
    it.name = this.nameOf(it);
    return it;
  },
  armor(ilvl, rarity, slot) {
    slot = slot || R.pick(ARMOR_SLOTS);
    const it = { kind: 'armor', uid: UID++, slot, realm: RL.id, rarity, ilvl: Math.max(1, ilvl), affixes: [] };
    it.armor = Math.round(ARMOR_BASE[slot] * RARITY[rarity].mult * (1 + (it.ilvl - 1) * 0.06));
    const keys = Object.keys(ARMOR_AFFIXES).filter(k => k !== 'speed' || slot === 'feet' || rarity >= 3);
    const n = RARITY[rarity].affixes + (slot === 'body' ? 1 : 0);
    while (it.affixes.length < Math.min(n, keys.length)) {
      const k = R.pick(keys); if (it.affixes.some(a => a.k === k)) continue;
      it.affixes.push({ k, v: ARMOR_AFFIXES[k].roll(it.ilvl) * (0.8 + rarity * 0.15) });
    }
    it.name = this.nameOf(it);
    return it;
  },
  randomWeapon(ilvl, bonus) { return this.weapon(R.pick(SLOT_ORDER), ilvl, this.rollRarity(bonus)); },
  // any random piece of gear: weapons, armor and relics
  randomGear(ilvl, bonus = 0, min = 0) {
    const r = this.rollRarity(bonus, min), x = Math.random();
    return x < 0.45 ? this.weapon(R.pick(SLOT_ORDER), ilvl, r) : x < 0.85 ? this.armor(ilvl, r) : this.relic(ilvl, r);
  },
  relic(ilvl, rarity) {
    const type = R.pick(Object.keys(RELICS));
    const d = RELICS[type];
    const v = type === 'revive' ? 1 : type === 'orbit' ? Math.min(6, 1 + Math.floor(rarity / 1.5) + 1) : d.base * (0.7 + rarity * 0.35) * (1 + ilvl * 0.015);
    return { kind: 'relic', uid: UID++, type, rarity, ilvl, value: v, name: d.name, icon: d.icon };
  },
  nameOf(it) {
    const r = rk(it.realm);
    if (it.kind === 'armor') {
      const i = ARMOR_SLOTS.indexOf(it.slot);
      if (it.rarity >= 4) return (it.rarity === 5 ? '✦ ' : '') + ARMOR_LEGEND[r][i];
      const a = it.affixes[0];
      return ARMOR_NAMES[r][i] + (a ? ' ' + ARMOR_AFFIXES[a.k].name : '');
    }
    const W = REALMS[it.realm].weapons[it.slot];
    if (it.rarity >= 4 && it.mtype == null) {
      const L = REALMS[it.realm].legend[it.slot];
      return (it.rarity === 5 ? '✦ ' : '') + L[it.uid % L.length];
    }
    const base = it.mtype != null ? MELEE_NAMES[r][it.mtype] : W.name;
    if (it.rarity >= 4) return (it.rarity === 5 ? '✦ ' : '') + base + ' ' + ['Huyền Thoại', 'Thần Thoại'][it.rarity - 4];
    const a = it.affixes[0];
    return base + (a ? ' ' + AFFIXES[a].name : '');
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
    if (it.mtype != null) {
      const M = MELEE_TYPES[it.mtype];
      s.mt = M; s.icon = `${rk(it.realm)}_m_${it.mtype}`;
      s.dmg *= M.dmg; s.rate *= M.rate; s.range *= M.range; s.arc *= M.arc; s.knock *= M.knock; s.stam *= M.stam;
      s.crit += M.crit || 0;
      if (M.id === 'hammer' || M.id === 'great' || M.id === 'axe') s.sfx = 'sfx_swing';
    }
    if (it.affixes.includes('haste')) s.rate /= 1.25;
    if (it.affixes.includes('multi')) s.extra = 2;
    if (it.affixes.includes('pierce')) s.pierce = (s.pierce || 0) + 2;
    if (it.affixes.includes('giant')) { s.range *= 1.45; s.knock *= 1.3; }
    if (it.affixes.includes('wave') || W.wave) s.wave = true;
    if (s.mag) s.mag = Math.round(s.mag * (1 + it.rarity * 0.12));
    return s;
  },
  power(it) {
    if (!it) return 0;
    if (it.kind === 'relic') return it.rarity * 10 + it.ilvl;
    if (it.kind === 'armor') return it.armor * 3 + it.affixes.length * 12 + it.rarity * 6;
    const s = this.stats(it);
    return s.dmg * (s.pellets || 1) * (1 + (s.extra || 0) * 0.3) / s.rate * (1 + it.affixes.length * 0.18);
  },
  price(it) { return Math.round((8 + it.ilvl * 1.6) * [1, 1.8, 3.4, 6.5, 13, 28][it.rarity]); },
  describe(it) {
    if (it.kind === 'relic') return RELICS[it.type].desc(it.value);
    if (it.kind === 'armor') {
      const lines = [`${ARMOR_SLOT_LABEL[it.slot]} • Giáp ${it.armor} (giảm ${Math.round(it.armor / (it.armor + 100) * 100)}% sát thương)`];
      for (const a of it.affixes) lines.push(`◆ ${ARMOR_AFFIXES[a.k].name}: ${ARMOR_AFFIXES[a.k].desc(a.v)}`);
      return lines.join('\n');
    }
    const s = this.stats(it);
    const lines = [`${s.mt ? s.mt.label + ' • ' : ''}Sát thương ${Math.round(s.dmg)}${s.pellets ? ' x' + s.pellets : ''} • ${(1 / s.rate).toFixed(1)} đòn/giây${s.mag ? ' • băng ' + s.mag : ''}`];
    if (s.mt) {
      const M = s.mt, sp = [];
      if (M.slam) sp.push('đập đất gây chấn động diện rộng');
      if (M.thrust) sp.push('đâm xa, xuyên hàng');
      if (M.leech) sp.push('quét vòng, hút máu');
      if (M.bleed) sp.push('gây chảy máu');
      if (M.stun) sp.push('có thể làm choáng');
      if (M.crit) sp.push('+' + Math.round(M.crit * 100) + '% chí mạng');
      if (M.combo) sp.push('đòn thứ 3 phóng kiếm khí');
      if (sp.length) lines.push('▸ ' + sp.join(', '));
    }
    for (const a of it.affixes) lines.push(`◆ ${AFFIXES[a].name}: ${AFFIXES[a].desc}`);
    return lines.join('\n');
  },
  iconOf(it) {
    if (it.kind === 'relic') return it.icon;
    if (it.kind === 'armor') return `${rk(it.realm)}_ar_${ARMOR_SLOTS.indexOf(it.slot)}`;
    if (it.mtype != null) return `${rk(it.realm)}_m_${it.mtype}`;
    return REALMS[it.realm].weapons[it.slot].icon;
  },
};
