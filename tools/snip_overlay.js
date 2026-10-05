// ---------- overlay for the 3D views ----------
function drawOverlay3D() {
  const P = G.player, d = G.dpr, W = canvas.width, H = canvas.height;
  const fp = G.cam3d === 'fp';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.textAlign = 'center';
  const tgt = P.car || P;
  for (const z of G.zombies) {
    if (z.dead) continue;
    const dd = dist(z.x, z.y, tgt.x, tgt.y);
    if (dd > 650 || !(z.hp < z.maxHp || z.elite || z.boss)) continue;
    const im = IMG[R3D.frontOf(z.img) || z.img];
    const hh = im ? im.height / 2 * z.scale : 40;
    const sc = R3D.project(z.x, hh + 6, z.y); if (!sc) continue;
    const k = clamp(260 / Math.max(60, dd), 0.5, 2);
    const bw = (z.boss ? 0 : 34 * k) * d, x = sc[0] * d, y = sc[1] * d;
    if (bw) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x - bw / 2, y, bw, 4 * d); ctx.fillStyle = z.elite ? '#ffb020' : '#e03030'; ctx.fillRect(x - bw / 2, y, bw * Math.max(0, z.hp / z.maxHp), 4 * d); }
    if (z.elite) { ctx.font = `${Math.round(12 * k * d)}px VT323, monospace`; ctx.fillStyle = '#ffcf3a'; ctx.fillText(`★ ${z.name} Lv${z.lvl}`, x, y - 4 * d); }
  }
  for (const a of G.allies) {
    if (a.kind !== 'comp' && !a.say) continue;
    const sc = R3D.project(a.x, 46, a.y); if (!sc) continue;
    const x = sc[0] * d, y = sc[1] * d;
    ctx.font = `${13 * d}px VT323, monospace`;
    if (a.kind === 'comp') { ctx.fillStyle = '#ffb3cf'; ctx.fillText((G.romanceReady(a.comp) ? '♥! ' : '♥ ') + a.comp.name, x, y); }
    if (a.say) {
      const t = a.say.text.length > 46 ? a.say.text.slice(0, 44) + '…' : a.say.text;
      const tw = ctx.measureText(t).width + 10 * d;
      ctx.fillStyle = 'rgba(10,10,14,0.85)'; ctx.fillRect(x - tw / 2, y - 30 * d, tw, 17 * d);
      ctx.fillStyle = '#fff'; ctx.fillText(t, x, y - 17 * d);
    }
  }
  for (const f of Floaters.list) {
    const sc = R3D.project(f.x, 36 + (f.max - f.life) * 28, f.y); if (!sc) continue;
    const k = clamp(260 / Math.max(60, dist(f.x, f.y, tgt.x, tgt.y)), 0.7, 1.8);
    ctx.globalAlpha = Math.min(1, f.life * 2.5);
    ctx.font = `${Math.round(f.size * 1.5 * k * d)}px VT323, monospace`;
    ctx.lineWidth = 3 * d; ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.strokeText(f.text, sc[0] * d, sc[1] * d);
    ctx.fillStyle = f.col; ctx.fillText(f.text, sc[0] * d, sc[1] * d);
  }
  ctx.globalAlpha = 1;
  // compass with objectives
  const yaw = P.car ? P.car.angle : G.yaw;
  const cw = Math.min(420 * d, W * 0.42), cx = W / 2, cy = 46 * d;
  ctx.fillStyle = 'rgba(10,8,8,0.55)'; ctx.fillRect(cx - cw / 2, cy - 12 * d, cw, 24 * d);
  ctx.font = `${16 * d}px VT323, monospace`;
  const mark = (ang, text, col) => {
    const df = angDiff(yaw, ang); if (Math.abs(df) > Math.PI / 2) return;
    ctx.fillStyle = col; ctx.fillText(text, cx + df / (Math.PI / 2) * cw / 2, cy + 5 * d);
  };
  mark(-Math.PI / 2, 'B', '#ddd'); mark(0, 'Đ', '#aaa'); mark(Math.PI / 2, 'N', '#aaa'); mark(Math.PI, 'T', '#aaa');
  G.curTargets = World.mode === 'over' ? Story.targets() : [];
  for (const t of G.curTargets) mark(Math.atan2(t.y - tgt.y, t.x - tgt.x), '◆ ' + Math.round(dist(tgt.x, tgt.y, t.x, t.y) / TILE) + 'm', '#ffcf3a');
  for (const c of G.companions) if (c.ally && c.ally.downed) mark(Math.atan2(c.ally.y - tgt.y, c.ally.x - tgt.x), '✚', '#ff6b6b');
  ctx.fillStyle = '#ffcf3a'; ctx.fillRect(cx - d, cy - 14 * d, 2 * d, 6 * d);
  if (P.car || P.dead) return;
  // crosshair
  let chx = W / 2, chy = H / 2;
  if (!fp) { const sc = R3D.project(P.x + Math.cos(P.angle) * 220, 22, P.y + Math.sin(P.angle) * 220); if (sc) { chx = sc[0] * d; chy = sc[1] * d; } }
  const locked = Math.abs(angDiff(P.angle, G.yaw)) > 0.001;
  ctx.strokeStyle = locked ? '#ff5a5a' : 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2 * d;
  ctx.beginPath(); ctx.arc(chx, chy, (locked ? 9 : 6) * d, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.fillRect(chx - d, chy - d, 2 * d, 2 * d);
  if (P.reloading > 0) { const w = P.wdef; const k = 1 - P.reloading / (w.reload * Math.pow(0.8, P.perks.reload || 0)); ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 3 * d; ctx.beginPath(); ctx.arc(chx, chy, 18 * d, -Math.PI / 2, -Math.PI / 2 + k * TAU); ctx.stroke(); }
  if (fp) drawViewModel(W, H, d);
}
function drawViewModel(W, H, d) {
  const P = G.player, w = P.wdef;
  const icon = IMG[w.icon || RL.weapons.melee.icon]; if (!icon) return;
  const size = Math.min(W, H) * 0.42;
  const sp = Math.min(1, Math.hypot(P.vx, P.vy) / 120);
  const bx = Math.sin(P.walkT * 0.65) * 14 * d * sp, by = Math.abs(Math.cos(P.walkT * 0.65)) * 10 * d * sp;
  let rot = -0.35, ox = W * 0.66 + bx, oy = H - size * 0.42 + by + P.recoil * 26 * d + (P.reloading > 0 ? size * 0.35 : 0);
  if (w.melee && P.swingT > 0) { const k = 1 - P.swingT / 0.2; rot += (P.swingDir > 0 ? -1 : 1) * Math.sin(k * Math.PI) * 1.1; ox -= Math.sin(k * Math.PI) * size * 0.3; }
  if (P.spin > 0) rot = G.time * 18;
  ctx.save(); ctx.translate(ox, oy); ctx.rotate(rot);
  ctx.imageSmoothingEnabled = false;
  const s = size / Math.max(icon.width, icon.height);
  ctx.drawImage(icon, -icon.width * s / 2, -icon.height * s / 2, icon.width * s, icon.height * s);
  if (P.muzzleT > 0 && !w.melee) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = w.color || '#ffd27a';
    ctx.beginPath(); ctx.arc(icon.width * s * 0.48, -icon.height * s * 0.18, size * 0.12 + Math.random() * size * 0.05, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
}
