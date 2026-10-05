"""Core hooks so the simulation can serve several players (co-op)."""
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

# ---- entities: ghost (visual-only) bullets and fires; enemies also hunt remote players ----
load('js/entities.js')
sub("hostile: !!o.hostile, ally: !!o.ally, crit: w.crit || 0, spin: 0, size: o.size || 1, src: o.src || 'gun',",
    "hostile: !!o.hostile, ally: !!o.ally, crit: w.crit || 0, spin: 0, size: o.size || 1, src: o.src || 'gun', ghost: !!o.ghost,")
sub("        if (b.hostile) {\n          for (const t of G.targets()) {", "        if (b.ghost) continue;\n        if (b.hostile) {\n          for (const t of G.targets()) {")
sub("      if (!f.hostile) for (const z of G.zgrid.query(f.x, f.y, f.r + 20))", "      if (!f.hostile && !f.ghost) for (const z of G.zgrid.query(f.x, f.y, f.r + 20))")
sub("""      if (P.dead) { this.state = 'wander'; this.tgt = null; }
      else {
        let best = G.player.car || P, bd = dist(this.x, this.y, best.x, best.y);""",
"""      const rem = G.remotes || [];
      if (P.dead && !rem.some(r => !r.dead && !r.away)) { this.state = 'wander'; this.tgt = null; }
      else {
        let best = P.dead ? null : (G.player.car || P), bd = best ? dist(this.x, this.y, best.x, best.y) : 1e9;
        for (const r of rem) { if (r.dead || r.away) continue; const dd = dist(this.x, this.y, r.x, r.y); if (dd < bd - 30) { bd = dd; best = r; } }""")
sub("    if (this.state === 'chase' && !P.dead) {", "    if (this.state === 'chase' && !tgt.dead) {")
save()

# ---- game: hurt carries its source; guests' hits don't feed the host's skill energy; spawn around any player ----
load('js/game.js')
sub("    else if (t.hurt) t.hurt(dmg);", "    else if (t.hurt) t.hurt(dmg, src);")
sub("      P.energy = Math.min(100, P.energy + dmg * 0.05", "      if (src !== 'net') P.energy = Math.min(100, P.energy + dmg * 0.05")
sub("""    if (this.spawnT > 0) return;
    const P = this.player;
    const sb = World.sbOf(Math.floor(P.x / TILE), Math.floor(P.y / TILE));""", """    if (this.spawnT > 0) return;
    const P = this.spawnCenter ? this.spawnCenter() : this.player;
    const sb = World.sbOf(Math.floor(P.x / TILE), Math.floor(P.y / TILE));""")
save()

# ---- play: despawn by the nearest player; host keeps simulating while its menus are open ----
load('js/play.js')
sub("    const d = dist(z.x, z.y, P.x, P.y);\n    if (World.mode === 'over' && ((d > 1500",
    "    const d = this.nearestPlayerDist ? this.nearestPlayerDist(z.x, z.y) : dist(z.x, z.y, P.x, P.y);\n    if (World.mode === 'over' && ((d > 1500")
sub("World.mode === 'over' && dist(a.x, a.y, P.x, P.y) > 3600));", "World.mode === 'over' && (this.nearestPlayerDist ? this.nearestPlayerDist(a.x, a.y) : dist(a.x, a.y, P.x, P.y)) > 3600));")
sub("""  updatePlayer(dt);
  this.interactTarget = this.findInteract();
  if (Input.hit('KeyE')) this.interact(this.interactTarget);
  this.actionTick(dt);""", """  if (this.state === 'playing') {
    updatePlayer(dt);
    this.interactTarget = this.findInteract();
    if (Input.hit('KeyE')) this.interact(this.interactTarget);
    this.actionTick(dt);
  }""")
sub("  if (G.state === 'playing') G.update(dt);", "  if (G.state === 'playing' || (typeof Net !== 'undefined' && Net.active && G.player && ['paused', 'menu', 'dialog', 'levelup'].includes(G.state))) G.update(dt);")
save()

# ---- world: keep the areas around every player loaded ----
load('js/world.js')
sub("      for (const [k, sb] of this.sbs) if (Math.abs(sb.sx - sx) > 3 || Math.abs(sb.sy - sy) > 3) this.unload(sb);",
    "      for (const [k, sb] of this.sbs) if ((Math.abs(sb.sx - sx) > 3 || Math.abs(sb.sy - sy) > 3) && !(this.focus || []).some(f => Math.abs(sb.sx - f[0]) <= 2 && Math.abs(sb.sy - f[1]) <= 2)) this.unload(sb);")
save()
print('core ok')
