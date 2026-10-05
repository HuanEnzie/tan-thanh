function aimAssist(yaw, cone) {
  const P = G.player;
  let best = null, bs = 1e9;
  for (const z of G.zgrid.query(P.x, P.y, 640)) {
    if (z.dead || z.rise > 0) continue;
    const a = Math.atan2(z.y - P.y, z.x - P.x), d = dist(P.x, P.y, z.x, z.y);
    const df = Math.abs(angDiff(yaw, a));
    if (df > cone || d > 640) continue;
    const score = df * 300 + d;
    if (score < bs && World.los(P.x, P.y, z.x, z.y)) { bs = score; best = a; }
  }
  return best == null ? yaw : best;
}
G.setView = function (v) {
  if (v !== 'top' && !R3D.ok) v = 'top';
  this.cam3d = v;
  document.body.classList.toggle('v3d', v !== 'top');
  try { localStorage.setItem('tt_view', v); } catch (e) {}
  const label = { top: 'TỪ TRÊN', tp: 'GÓC 3', fp: 'GÓC 1' }[v];
  const b = document.getElementById('btnView'); if (b) b.textContent = '👁 GÓC NHÌN: ' + label;
  if (this.player && v !== 'top') this.yaw = this.player.angle;
  resize();
};
G.cycleView = function () {
  if (!R3D.ok) { this.toast('Trình duyệt này không hỗ trợ 3D (WebGL) hoặc chưa tải được thư viện 3D.', 'warn'); return; }
  const next = { top: 'tp', tp: 'fp', fp: 'top' }[this.cam3d] || 'top';
  this.setView(next);
  this.toast({ top: 'Góc nhìn: TỪ TRÊN XUỐNG', tp: 'Góc nhìn: GÓC 3 — rê chuột hoặc cần phải để xoay', fp: 'Góc nhìn: GÓC 1 — rê chuột hoặc cần phải để xoay' }[next], 'info');
  Sound.play('sfx_click', 0.5);
};
