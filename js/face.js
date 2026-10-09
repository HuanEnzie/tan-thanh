// ===== Face: portrait library (painted busts packed in assets/img/pf_{realm}_{gender}.jpg, 6x6 each) =====
const Face = (() => {
  const COLS = 6, N = 36;
  const rk3 = r => (r === 'tt' || r === 'sl' ? r : 'md');
  const pos = i => { const c = i % COLS, r = Math.floor(i / COLS); return `${c / (COLS - 1) * 100}% ${r / (COLS - 1) * 100}%`; };
  const url = (realm, g) => `assets/img/pf_${rk3(realm)}_${g === 'f' ? 'f' : 'm'}.jpg`;
  function random(g, realm, rnd = Math.random, avoid = null) {
    g = g || (rnd() < 0.5 ? 'm' : 'f');
    let i = Math.floor(rnd() * N), tries = 0;
    while (avoid && avoid.has(g + i) && tries++ < 40) i = Math.floor(rnd() * N);
    return { g, i, m: rnd() < 0.5 ? 1 : 0 };
  }
  // one portrait as a square element; the same person can appear mirrored
  const html = (L, realm, cls = '') => `<div class="fp ${cls}" style="background-image:url(${url(realm, L.g)});background-position:${pos(L.i % N)}${L.m ? ';transform:scaleX(-1)' : ''}"></div>`;
  // a canvas copy (for drawing in the game world HUD)
  const cache = {};
  function draw(ctx, L, realm, x, y, size) {
    const u = url(realm, L.g); let im = cache[u];
    if (!im) { im = cache[u] = new Image(); im.src = u; }
    if (!im.complete || !im.naturalWidth) return false;
    const s = im.naturalWidth / COLS, c = (L.i % N) % COLS, r = Math.floor((L.i % N) / COLS);
    ctx.drawImage(im, c * s, r * s, s, s, x, y, size, size); return true;
  }
  return { COLS, N, random, html, url, pos, draw };
})();
