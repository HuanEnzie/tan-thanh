"""v3 hooks in play.js / game.js / fx.js / ui.js."""
import os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
def load(f):
    global s, P
    P = os.path.join(ROOT, f); s = open(P, encoding='utf-8').read()
def save():
    open(P, 'w', encoding='utf-8', newline='\n').write(s)
def sub(a, b, n=1):
    global s
    if a not in s: raise SystemExit('MISSING in %s: %s' % (P, a[:90]))
    s = s.replace(a, b, n)

# ================= play.js =================
load('js/play.js')
sub("  if (Input.hit('KeyT')) G.place('trap');\n}", "  if (Input.hit('KeyT')) G.place('trap');\n  if (Input.hit('KeyU')) G.useScroll();\n}")
sub("  Floaters.add(P.x, P.y - 24, ITEMS[id].name, '#ffd27a', 9);", "  Floaters.add(P.x, P.y - 24, itm(id).name, '#ffd27a', 9);")
sub("  for (const a of this.allies) a.update(dt);\n  this.allies = this.allies.filter(a => !a.dead);",
    "  for (const a of this.allies) a.update(dt);\n"
    "  // drop civilians / merchants left far behind (they respawn with their area)\n"
    "  this.allies = this.allies.filter(a => !a.dead && !((a.kind === 'civ' || a.kind === 'merchant') && World.mode === 'over' && dist(a.x, a.y, P.x, P.y) > 3600));\n"
    "  this.updateHazards(dt);\n"
    "  if (this.frame % 20 === 0) this.biomeTick();")
sub("    for (let y = sy - 1; y <= sy + 1; y++) for (let x = sx - 1; x <= sx + 1; x++) World.explored.add(World.mode + nkey(x, y));",
    "    for (let y = sy - 1; y <= sy + 1; y++) for (let x = sx - 1; x <= sx + 1; x++) World.explored.add(World.mode + nkey(x, y));\n"
    "    if (World.explored.size > 6000) World.explored = new Set([...World.explored].slice(-4000));")
sub("  Throws.draw(ctx);\n  Items.draw(ctx);", "  Throws.draw(ctx);\n  drawHazards(ctx);\n  Items.draw(ctx);")
sub("  drawLighting(camX, camY);\n  ctx.setTransform(1, 0, 0, 1, 0, 0);", "  drawLighting(camX, camY);\n  ctx.setTransform(1, 0, 0, 1, 0, 0);\n  drawBiomeTint();")
sub("    ctx.fillStyle = 'rgba(255,240,210,0.75)'; ctx.fillText(b.name, x + w / 2, y + h / 2 + 4);\n  }\n  ctx.globalAlpha = 1;\n}",
    "    ctx.fillStyle = 'rgba(255,240,210,0.75)'; ctx.fillText(b.name, x + w / 2, y + h / 2 + 4);\n  }\n  ctx.globalAlpha = 1;\n  drawDoors(b);\n}")
sub("  if (b.roofAlpha < 0.02) return;\n  ctx.globalAlpha = b.roofAlpha;", "  if (b.roofAlpha < 0.02) { drawDoors(b); return; }\n  ctx.globalAlpha = b.roofAlpha;")
sub("  const list = World.mode === 'over' ? Story.targets() : [];", "  const list = World.mode === 'over' ? Story.targets() : G.dungeonTargets();")
sub("  if (p.solid && p.layer > 0) { ctx.globalAlpha = 0.28; drawPropImg(p, 4, 5, true); ctx.globalAlpha = 1; }\n  drawPropImg(p, 0, 0);\n  if (p.container && !p.looted) {",
    "  if (p.container === 'chest' && !p.looted) drawChestAura(p);\n"
    "  if (p.solid && p.layer > 0) { ctx.globalAlpha = 0.28; drawPropImg(p, 4, 5, true); ctx.globalAlpha = 1; }\n  drawPropImg(p, 0, 0);\n"
    "  if (p.container === 'chest') { if (!p.looted && dist(p.x, p.y, G.player.x, G.player.y) < 220) { const C = CHESTS[p.data.tier]; ctx.font = '9px VT323, monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText(C.name, p.x + 1, p.y - p.h / 2 - 5); ctx.fillStyle = C.col; ctx.fillText(C.name, p.x, p.y - p.h / 2 - 6); } return; }\n"
    "  if (p.container && !p.looted) {")

# ---- melee styles ----
sub("""  const trail = (w.affixes && w.affixes.length ? AFFIXES[w.affixes[0]].color : w.trail) || '#e8e0c8';
  FX.slash(P.x, P.y, P.angle, w.range + 8, w.arc, trail, 0.16, P.swingDir);
  // lunge forward a little
  P.kx += Math.cos(P.angle) * 120; P.ky += Math.sin(P.angle) * 120;""", """  const trail = (w.affixes && w.affixes.length ? AFFIXES[w.affixes[0]].color : w.trail) || '#e8e0c8';
  const M = w.mt || {};
  P.comboN = ((P.comboN || 0) + 1) % 3;
  if (M.thrust) {
    FX.slash(P.x, P.y, P.angle, w.range + 10, 0.32, trail, 0.12, P.swingDir);
    for (let k = 0; k < 6; k++) Particles.add({ x: P.x + Math.cos(P.angle) * (20 + k * w.range / 6), y: P.y + Math.sin(P.angle) * (20 + k * w.range / 6), vx: Math.cos(P.angle) * 60, vy: Math.sin(P.angle) * 60, life: 0.18, max: 0.18, size: 2.5, col: trail, drag: 4, glow: true });
  } else if (M.id === 'scythe') {
    FX.slash(P.x, P.y, P.angle, w.range + 8, Math.min(TAU, w.arc), trail, 0.22, P.swingDir);
    FX.ring(P.x, P.y, w.range * 0.5, w.range + 6, trail, 0.2, 3);
  } else FX.slash(P.x, P.y, P.angle, w.range + 8, w.arc, trail, M.id === 'hammer' || M.id === 'great' ? 0.22 : 0.16, P.swingDir);
  // lunge forward a little
  const lunge = M.id === 'dagger' || M.id === 'fist' ? 170 : M.id === 'spear' ? 200 : M.id === 'hammer' ? 60 : 120;
  P.kx += Math.cos(P.angle) * lunge; P.ky += Math.sin(P.angle) * lunge;""")
sub("""    G.hitEnemy(z, dmg, Math.cos(a) * w.knock * (shove ? 1.5 : 1), Math.sin(a) * w.knock * (shove ? 1.5 : 1), 'melee', a, w);
    if (w.knock > 150 || shove) z.stun = 0.25;
    hits++;
  }""", """    G.hitEnemy(z, dmg, Math.cos(a) * w.knock * (shove ? 1.5 : 1), Math.sin(a) * w.knock * (shove ? 1.5 : 1), 'melee', a, w);
    if (w.knock > 150 || shove) z.stun = 0.25;
    if (M.bleed && !z.dead) { z.poison += dmg * 0.3; Particles.blood(z.x, z.y, a, 4, 120); }
    if (M.stun && Math.random() < M.stun && !z.boss) { z.stun = 0.7; Floaters.add(z.x, z.y - z.r - 8, 'CHOÁNG', '#fff36b', 8); }
    if (M.leech) P.hp = Math.min(P.maxHp, P.hp + dmg * 0.025);
    hits++;
  }
  if (M.slam && !shove) {
    const sx = P.x + Math.cos(P.angle) * w.range * 0.75, sy = P.y + Math.sin(P.angle) * w.range * 0.75;
    FX.ring(sx, sy, 10, 100, '#ffd08a', 0.35, 8); Particles.debris(sx, sy, 14); Particles.dust(sx, sy, 8);
    World.addDecal('scorch', sx, sy, R.range(0, TAU), 0.7, 0.5);
    G.shake(7); Sound.play('sfx_explosion', 0.35, 1.4);
    for (const z of G.zgrid.query(sx, sy, 100)) { if (z.dead) continue; const d = dist(sx, sy, z.x, z.y); if (d < 95 + z.r) { const a = Math.atan2(z.y - sy, z.x - sx); G.hitEnemy(z, dmg * 0.55, Math.cos(a) * 260, Math.sin(a) * 260, 'melee', a, null); if (!z.boss) z.stun = 0.6; } }
  }
  if (M.combo && P.comboN === 2 && !shove && !w.wave) Bullets.fire(P.x + Math.cos(P.angle) * 20, P.y + Math.sin(P.angle) * 20, P.angle, { speed: 560, knock: 120, affixes: w.affixes }, dmg * 0.8, { proj: 'wave', col: trail, life: 0.45, speed: 560, src: 'melee' });""")
save()

# ================= game.js =================
load('js/game.js')
s = s.replace("Items.list = [];", "Items.list = []; this.hazards = [];")
sub("    d = Math.max(d, RL.alwaysNightish || 0);", "    d = Math.max(d, RL.alwaysNightish || 0);\n    if (this.biome && BIOMES[this.biome].dark) d = Math.max(d, BIOMES[this.biome].dark);")
sub("      World.addProp('fx_2', z.x, z.y, { solid: false, layer: 0, kind: 'stairs', light: 120 });",
    "      World.addProp('fx_2', z.x, z.y, { solid: false, layer: 0, kind: 'stairs', light: 120 });\n      this.dgTarget = { x: z.x, y: z.y, label: 'Lối xuống' };")
sub("      World.addProp(RL.id === 'sl' ? 'sl_p_9' : 'fx_0', z.x, z.y - 60, { solid: false, layer: 0, kind: 'exit', light: 170, lightCol: 'blue' });",
    "      World.addProp(RL.id === 'sl' ? 'sl_p_9' : 'fx_0', z.x, z.y - 60, { solid: false, layer: 0, kind: 'exit', light: 170, lightCol: 'blue' });\n      this.dgTarget = { x: z.x, y: z.y - 60, label: 'Lối ra' };")
sub("      const dg = { rank, floor: 1,", "      this.dgTarget = null;\n      const dg = { rank, floor: 1,")
sub("      const dg = World.dg;\n      dg.floor++; dg.level += 2;", "      const dg = World.dg; this.dgTarget = null;\n      dg.floor++; dg.level += 2;")
sub("      World.mode = 'over';\n      World.reset();", "      World.mode = 'over'; this.dgTarget = null;\n      World.reset();")
save()

# ================= world.js: remember the shelter =================
load('js/world.js')
sub("    this.startPos = { x: cx * TILE + 16, y: (cy + 1) * TILE + 16 };\n    this.startHouse = b;",
    "    this.startPos = { x: cx * TILE + 16, y: (cy + 1) * TILE + 16 };\n    this.shelterPos = this.startPos;\n    this.startHouse = b;")
save()

# ================= fx.js: biome ambience =================
load('js/fx.js')
s = s.replace("const kind = World.mode === 'dungeon' ? 'dust' : RL.ambient;", "const kind = World.mode === 'dungeon' ? 'dust' : (G.biomeAmb || RL.ambient);")
sub("      if (kind === 'petals') { a.x += (30 + Math.sin(a.p) * 20) * a.s * dt * G.dpr; a.y += 40 * a.s * dt * G.dpr; }",
    "      if (kind === 'petals' || kind === 'leaves') { a.x += (30 + Math.sin(a.p) * 20) * a.s * dt * G.dpr; a.y += 40 * a.s * dt * G.dpr; }\n"
    "      else if (kind === 'snow') { a.x += Math.sin(a.p) * 18 * dt * G.dpr; a.y += 34 * a.s * dt * G.dpr; }\n"
    "      else if (kind === 'sand') { a.x += 160 * a.s * dt * G.dpr; a.y += Math.sin(a.p * 2) * 10 * dt * G.dpr; }\n"
    "      else if (kind === 'fog') { a.x += 8 * a.s * dt * G.dpr; }\n"
    "      else if (kind === 'embers' || kind === 'spores') { a.x += Math.sin(a.p) * 14 * dt * G.dpr; a.y -= (kind === 'embers' ? 40 : 12) * a.s * dt * G.dpr; }")
sub("      else if (kind === 'dust') {",
    "      else if (kind === 'leaves') { ctx.fillStyle = a.s > 1 ? 'rgba(220,90,30,0.8)' : 'rgba(240,160,40,0.75)'; ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.p * 2); ctx.fillRect(-3 * d, -2 * d, 6 * d, 4 * d); ctx.restore(); }\n"
    "      else if (kind === 'snow') { ctx.fillStyle = 'rgba(245,250,255,0.85)'; ctx.fillRect(a.x, a.y, 2.5 * d * a.s, 2.5 * d * a.s); }\n"
    "      else if (kind === 'sand') { ctx.fillStyle = 'rgba(230,170,90,0.35)'; ctx.fillRect(a.x, a.y, 14 * d * a.s, 1.2 * d); }\n"
    "      else if (kind === 'fog') { ctx.fillStyle = 'rgba(190,210,190,0.05)'; ctx.beginPath(); ctx.arc(a.x, a.y, 70 * d * a.s, 0, TAU); ctx.fill(); }\n"
    "      else if (kind === 'embers') { ctx.fillStyle = `rgba(255,${120 + Math.floor(Math.sin(a.p * 4) * 60)},40,0.8)`; ctx.fillRect(a.x, a.y, 2 * d, 2 * d); }\n"
    "      else if (kind === 'spores') { ctx.fillStyle = a.s > 1 ? `rgba(120,255,240,${0.4 + Math.sin(a.p * 3) * 0.3})` : `rgba(220,140,255,${0.4 + Math.sin(a.p * 3) * 0.3})`; ctx.fillRect(a.x, a.y, 2.5 * d, 2.5 * d); }\n"
    "      else if (kind === 'dust') {")
save()
print('play ok')
