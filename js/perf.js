// ===== FPS meter: Settings > Hiện FPS, ?fps=1 in the URL, or F3: frame rate, main-thread work and the renderer =====
const PerfMeter = (function () {
  let on = /[?&]fps=1/.test(location.search), el = null;
  try { if (localStorage.getItem('tt_fps') === '1') on = true; } catch (e) {}
  const iv = [], work = []; let last = 0, t0 = 0, acc = 0;
  const show = () => {
    if (!el) { el = document.createElement('div'); el.id = 'fpsMeter'; el.style.cssText = 'position:fixed;left:50%;top:4px;transform:translateX(-50%);z-index:99;font:12px monospace;color:#9f9;background:rgba(0,0,0,.65);padding:2px 8px;border-radius:4px;pointer-events:none'; document.body.appendChild(el); }
    el.hidden = !on;
  };
  const wrap = (o, k) => { const f = o[k]; o[k] = function (...a) { if (!on) return f.apply(this, a); const s = performance.now(); try { return f.apply(this, a); } finally { acc += performance.now() - s; } }; };
  wrap(G, 'update'); wrap(G, 'render'); wrap(UI, 'update');
  const tick = now => {
    if (on) {
      if (last) { iv.push(now - last); work.push(acc); if (iv.length > 90) { iv.shift(); work.shift(); } }
      acc = 0;
      if (now - t0 > 500 && iv.length) {
        t0 = now; show();
        const avg = iv.reduce((a, b) => a + b, 0) / iv.length, s = iv.slice().sort((a, b) => a - b), p95 = s[Math.floor(s.length * 0.95)];
        const w = work.reduce((a, b) => a + b, 0) / work.length;
        el.textContent = `${ctx.beginFrame ? 'WebGL' : '2D'} ${(1000 / avg).toFixed(0)} fps • chậm nhất ${p95.toFixed(0)} ms • JS ${w.toFixed(1)} ms${ctx.draws != null ? ' • ' + ctx.draws + ' lệnh vẽ' : ''}`;
      }
    }
    last = now; requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  window.addEventListener('keydown', e => { if (e.code === 'F3') { on = !on; show(); e.preventDefault(); } });
  if (on) addEventListener('load', show);
  return { on: () => on, set(v) { on = !!v; show(); try { localStorage.setItem('tt_fps', on ? '1' : ''); } catch (e) {} } };
})();
