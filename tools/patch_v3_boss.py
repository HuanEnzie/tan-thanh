"""v3 bosses: random boss definitions, new attack patterns, upright sprites."""
import os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
p = os.path.join(ROOT, 'js/entities.js')
s = open(p, encoding='utf-8').read()
def sub(a, b, n=1):
    global s
    if a not in s: raise SystemExit('MISSING: ' + a[:90])
    s = s.replace(a, b, n)

sub("""  constructor(arche, x, y, o = {}) {
    const a = ARCHE[arche];
    const idx = ARCHE_ORDER.indexOf(arche);""", """  constructor(arche, x, y, o = {}) {
    const a = ARCHE[arche];
    const idx = ARCHE_ORDER.indexOf(arche);
    const bd = o.bossDef;
    if (bd) o.scale = (o.scale || 1) * (bd.def.scale || 1) * (bd.mod && bd.mod.scale || 1);""")
sub("    if (this.boss) { this.bossT = 3; this.bossState = 'walk'; this.summonT = 10; this.volleyT = 6; this.story = !!o.story; }",
    """    if (this.boss) { this.bossT = 3; this.bossState = 'walk'; this.summonT = 10; this.volleyT = 6; this.story = !!o.story; this.patT = 4; this.pat = ['summon', 'volley', 'charge', 'slam']; this.bcol = RL.projColor; }
    if (bd) {
      this.img = bd.def.img; this.upright = !!bd.def.up; this.pat = bd.def.pat.slice(); this.bcol = bd.def.col; this.el = bd.def.el || null;
      if (bd.mod) { if (bd.mod.extra && !this.pat.includes(bd.mod.extra)) this.pat.push(bd.mod.extra); if (bd.mod.spd) this.spd *= bd.mod.spd; if (bd.mod.armor) this.armorB = bd.mod.armor; }
    }""")

# boss AI: gate the classic moves by pattern and add the new ones
sub("""  bossAI(dt, d, dx, dy, tgt) {
    this.bossT -= dt; this.summonT -= dt; this.volleyT -= dt;
    const enr = this.hp < this.maxHp * 0.4;
    if (this.summonT <= 0) {""", """  bossAI(dt, d, dx, dy, tgt) {
    this.bossT -= dt; this.summonT -= dt; this.volleyT -= dt; this.patT -= dt;
    const enr = this.hp < this.maxHp * 0.4;
    const has = k => this.pat.includes(k);
    const col = this.bcol;
    if (!this.enraged && enr) { this.enraged = true; Floaters.add(this.x, this.y - 70, 'CUỒNG NỘ!', '#ff3b3b', 14, true); FX.ring(this.x, this.y, 20, 220, '#ff3b3b', 0.6, 10); G.shake(10); }
    // trail of fire / poison behind a walking boss
    if (has('trail') && Math.random() < dt * 6) { if (this.el === 'poison') Throws.acids.push({ x: this.x, y: this.y, r: 26, life: 4, max: 4 }); else Throws.fires.push({ x: this.x, y: this.y, r: 26, life: 3, max: 3, hostile: true }); }
    // rotating bullet stream
    if (this.spiralT > 0) {
      this.spiralT -= dt; this.spiralCd = (this.spiralCd || 0) - dt;
      if (this.spiralCd <= 0) { this.spiralCd = enr ? 0.06 : 0.09; this.spA = (this.spA || 0) + 0.38; for (let k = 0; k < 3; k++) Bullets.fire(this.x, this.y, this.spA + k * TAU / 3, {}, this.dmg * 0.4, { hostile: true, proj: 'eshot', col, life: 2.4, speed: 210, size: 1.2 }); }
      return [0, 0, 0];
    }
    if (this.patT <= 0 && d < 560) {
      const special = this.pat.filter(k => ['spiral', 'meteor', 'nova', 'teleport', 'shotgun'].includes(k));
      this.patT = (enr ? 3.2 : 4.6) + Math.random() * 1.5;
      const k = special.length ? R.pick(special) : null;
      if (k === 'spiral') { this.spiralT = enr ? 2.6 : 1.9; Sound.at('sfx_energy', this.x, this.y, 0.7, 0.6); }
      else if (k === 'meteor') {
        const n = enr ? 7 : 4;
        for (let i = 0; i < n; i++) { const a = R.range(0, TAU), r = i === 0 ? 0 : R.range(40, 190); G.hazard('meteor', tgt.x + Math.cos(a) * r, tgt.y + Math.sin(a) * r, { r: 62, t: 1.1 + i * 0.12, dmg: this.dmg * 1.1, col: this.el === 'ice' ? '#9fe6ff' : this.el === 'shock' ? '#fff36b' : '#ff7a2a' }); }
        Floaters.add(this.x, this.y - 60, R.pick(G.lore().bossTaunts || ['GẦMMM!']), '#ff6060', 11, true);
      }
      else if (k === 'nova') { G.hazard('ring', this.x, this.y, { r: 0, max: enr ? 330 : 260, t: 0, speed: 230, dmg: this.dmg * 0.9, col, el: this.el }); Sound.at('sfx_explosion', this.x, this.y, 0.6, 0.5); G.shake(6); }
      else if (k === 'teleport') {
        Particles.burst(this.x, this.y, 22, col, 200);
        const a = Math.atan2(dy, dx) + Math.PI + R.range(-0.6, 0.6);
        const nx = tgt.x + Math.cos(a) * 90, ny = tgt.y + Math.sin(a) * 90;
        if (World.walkable(Math.floor(nx / TILE), Math.floor(ny / TILE))) { this.x = nx; this.y = ny; }
        Particles.burst(this.x, this.y, 22, col, 200); FX.ring(this.x, this.y, 10, 90, col, 0.35, 6);
        Sound.at('sfx_portal', this.x, this.y, 0.6, 1.4);
        this.bossState = 'windup'; this.bossT = 0.55; this.chargeA = Math.atan2(tgt.y - this.y, tgt.x - this.x);
      }
      else if (k === 'shotgun') {
        const a0 = Math.atan2(dy, dx), n = enr ? 11 : 7;
        for (let i = 0; i < n; i++) Bullets.fire(this.x, this.y, a0 + (i - (n - 1) / 2) * 0.13, {}, this.dmg * 0.55, { hostile: true, proj: 'eshot', col, life: 1.8, speed: 340, size: 1.3 });
        Sound.at('sfx_shotgun', this.x, this.y, 0.6, 0.7);
      }
    }
    if (has('summon') && this.summonT <= 0) {""")
sub("""      Floaters.add(this.x, this.y - 60, R.pick(G.lore().bossTaunts || ['GẦMMM!']), '#ff6060', 11, true);
    }
    if (this.volleyT <= 0 && d < 520) {""", """      Floaters.add(this.x, this.y - 60, R.pick(G.lore().bossTaunts || ['GẦMMM!']), '#ff6060', 11, true);
    }
    if (has('volley') && this.volleyT <= 0 && d < 520) {""")
sub("      for (let i = 0; i < n; i++) Bullets.fire(this.x, this.y, i / n * TAU + G.time, {}, this.dmg * 0.5, { hostile: true, proj: 'eshot', col: RL.projColor, life: 2.2, speed: 230, size: 1.4 });\n      FX.ring(this.x, this.y, 10, 90, RL.projColor, 0.4, 6);",
    "      for (let i = 0; i < n; i++) Bullets.fire(this.x, this.y, i / n * TAU + G.time, {}, this.dmg * 0.5, { hostile: true, proj: 'eshot', col, life: 2.2, speed: 230, size: 1.4 });\n      FX.ring(this.x, this.y, 10, 90, col, 0.4, 6);")
sub("      FX.ring(this.x, this.y, 20, 160, RL.projColor, 0.6, 8);", "      FX.ring(this.x, this.y, 20, 160, col, 0.6, 8);")
sub("      if (this.bossT <= 0 && d < 440) { this.bossState = 'windup';", "      if (has('charge') && this.bossT <= 0 && d < 440) { this.bossState = 'windup';")
sub("      if (d < 80 && this.attackCd <= 0) {\n        this.attackCd = enr ? 1.6 : 2.2;",
    "      if (has('slam') && d < 80 && this.attackCd <= 0) {\n        this.attackCd = enr ? 1.6 : 2.2;")
sub("      if (Math.random() < 0.4) FX.ghost(this.img, this.x, this.y, this.angle, -this.imgW() * 0.56, RL.projColor, 0.25);",
    "      if (Math.random() < 0.4) FX.ghost(this.img, this.x, this.y, this.upright ? 0 : this.angle, -this.imgW() * (this.upright ? 0.5 : 0.56), col, 0.25);")

# upright sprites (the new 3/4-view bosses) are mirrored instead of rotated
sub("""    const wob = Math.sin(this.walkT) * 0.13;
    ctx.rotate(this.angle + wob + rot);""", """    const wob = Math.sin(this.walkT) * 0.13;
    if (this.upright) { ctx.rotate(wob * 0.35 + rot); if (Math.cos(this.angle) < 0) ctx.scale(-1, 1); }
    else ctx.rotate(this.angle + wob + rot);""")
sub("    ctx.drawImage(im, -w * 0.56, -h / 2, w, h);\n    if (this.hitT > 0 || this.bossState === 'windup') {",
    "    const ox = this.upright ? -w / 2 : -w * 0.56;\n    ctx.drawImage(im, ox, -h / 2, w, h);\n    if (this.hitT > 0 || this.bossState === 'windup') {")
sub("      ctx.drawImage(G.whiteOf(this.img, this.bossState === 'windup' ? '#ff2020' : '#ffffff'), -w * 0.56, -h / 2, w, h);\n    } else if (this.slow > 0) { ctx.globalAlpha = 0.35; ctx.drawImage(G.whiteOf(this.img, '#7fdcff'), -w * 0.56, -h / 2, w, h); }\n    else if (this.burn > 0) { ctx.globalAlpha = 0.3; ctx.drawImage(G.whiteOf(this.img, '#ff7020'), -w * 0.56, -h / 2, w, h); }\n    else if (this.poison > 1) { ctx.globalAlpha = 0.3; ctx.drawImage(G.whiteOf(this.img, '#7cf04a'), -w * 0.56, -h / 2, w, h); }",
    "      ctx.drawImage(G.whiteOf(this.img, this.bossState === 'windup' ? '#ff2020' : '#ffffff'), ox, -h / 2, w, h);\n    } else if (this.slow > 0) { ctx.globalAlpha = 0.35; ctx.drawImage(G.whiteOf(this.img, '#7fdcff'), ox, -h / 2, w, h); }\n    else if (this.burn > 0) { ctx.globalAlpha = 0.3; ctx.drawImage(G.whiteOf(this.img, '#ff7020'), ox, -h / 2, w, h); }\n    else if (this.poison > 1) { ctx.globalAlpha = 0.3; ctx.drawImage(G.whiteOf(this.img, '#7cf04a'), ox, -h / 2, w, h); }")
open(p, 'w', encoding='utf-8', newline='\n').write(s)

p = os.path.join(ROOT, 'js/game.js')
s = open(p, encoding='utf-8').read()
sub("    if (z.t.armor && src !== 'fire' && src !== 'poison') dmg *= 1 - z.t.armor;",
    "    const zar = (z.t.armor || 0) + (z.armorB || 0);\n    if (zar && src !== 'fire' && src !== 'poison') dmg *= 1 - zar;")
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('boss ok')
