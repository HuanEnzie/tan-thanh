// Frame-rate benchmark on a phone-sized viewport with CPU throttling, in real Chrome (GPU on).
//   PPTR=<puppeteer-core path> node tools/bench.mjs [url] [cpuRate] [realm]
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PPTR);
const url = process.argv[2] || 'http://localhost:8766/';
const rate = +(process.argv[3] || 4);
const realm = process.argv[4] || 'tt';

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new',
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--mute-audio', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
});
const page = await browser.newPage();
await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
page.on('pageerror', e => console.log('pageerror', e.message));
await page.goto(url, { waitUntil: 'load' });
await new Promise(r => setTimeout(r, 2500));
const gpu = await page.evaluate(() => { const g = document.createElement('canvas').getContext('webgl'); const d = g && g.getExtension('WEBGL_debug_renderer_info'); return d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'none'; });
await page.evaluate(async realm => {
  await new Promise(r => UI.loadRealm(realm, r));
  G.newGame(realm, 12345, 'Bench', 'm'); G.start(true);
  await new Promise(r => setTimeout(r, 1200));
  G.state = 'playing'; document.querySelectorAll('.dialog,#dialog').forEach(e => e.hidden = true);
}, realm);
if (process.argv[5]) await page.evaluate(process.argv[5]);
const cdp = await page.createCDPSession();
await cdp.send('Emulation.setCPUThrottlingRate', { rate });
await cdp.send('Performance.enable');
const metric = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
const m0 = await metric();
await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start');
const res = await page.evaluate(async () => {
  const T = {}; const wrap = (o, k, l) => { const f = o[k]; o[k] = function (...a) { const t = performance.now(); try { return f.apply(this, a); } finally { T[l] = (T[l] || 0) + performance.now() - t; } }; };
  wrap(G, 'update', 'update'); wrap(G, 'render', 'render'); wrap(UI, 'update', 'ui');
  const out = [];
  const phase = async (label, ms, setup) => {
    setup && setup();
    for (const k in T) T[k] = 0;
    const iv = []; let last = performance.now(); const t0 = last;
    await new Promise(r => { const f = now => { iv.push(now - last); last = now; if (now - t0 < ms) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); });
    iv.shift(); iv.sort((a, b) => a - b);
    const n = iv.length, avg = iv.reduce((a, b) => a + b, 0) / n;
    out.push({ label, fps: +(1000 / avg).toFixed(1), p95: +iv[Math.floor(n * 0.95)].toFixed(1), update: +(T.update / n).toFixed(2), render: +(T.render / n).toFixed(2), ui: +(T.ui / n).toFixed(2), zombies: G.zombies.filter(z => !z.far).length });
  };
  await phase('idle', 3000);
  await phase('walk', 6000, () => { Input.keys.KeyD = true; });
  await phase('fight', 6000, () => { Input.keys.KeyD = false; Input.keys.KeyW = true; Input.mouse.down = true; const P = G.player; for (let i = 0; i < 25; i++) { const a = i / 25 * 6.283; G.spawnEnemy(['runner','walker','armored'][i % 3], P.x + Math.cos(a) * 300, P.y + Math.sin(a) * 300, { state: 'chase' }); } });
  return out;
});
const m1 = await metric();
const { profile } = await cdp.send('Profiler.stop');
{ const self = {}, byId = new Map(profile.nodes.map(n => [n.id, n])), dt = {};
  for (let i = 0; i < profile.samples.length; i++) dt[profile.samples[i]] = (dt[profile.samples[i]] || 0) + (profile.timeDeltas[i] || 0);
  let tot = 0; for (const n of profile.nodes) { const c = n.callFrame, k = (c.functionName || '(anon)') + ' ' + (c.url.split('/').pop() || '') + ':' + c.lineNumber; self[k] = (self[k] || 0) + (dt[n.id] || 0); tot += dt[n.id] || 0; }
  if (!process.env.QUIET) console.log(Object.entries(self).sort((a, b) => b[1] - a[1]).slice(0, 30).map(([k, v]) => (v / tot * 100).toFixed(1).padStart(5) + '%  ' + k).join(String.fromCharCode(10))); }
const secs = m1.Timestamp - m0.Timestamp, pct = k => +((m1[k] - m0[k]) / secs * 100).toFixed(1);
const busy = { script: pct('ScriptDuration'), style: pct('RecalcStyleDuration'), layout: pct('LayoutDuration'), task: pct('TaskDuration'), heapMB: +(m1.JSHeapUsedSize / 1048576).toFixed(0) };
console.log(JSON.stringify({ gpu, rate, busy, canvas: await page.evaluate(() => [canvas.width, canvas.height]), res }, null, 1));
await browser.close();
