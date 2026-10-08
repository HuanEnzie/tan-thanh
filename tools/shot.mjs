// Screenshot the game in both renderers for a visual diff.  PPTR=... node tools/shot.mjs <outdir> [realm] [hour]
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PPTR);
const out = process.argv[2], realm = process.argv[3] || 'tt', hour = +(process.argv[4] || 10);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--mute-audio'] });
for (const mode of ['gl0', 'gl1']) {
  const page = await browser.newPage();
  await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('http://localhost:8766/' + (mode === 'gl0' ? '?gl=0' : ''), { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 2500));
  await page.evaluate(async (realm, hour) => {
    let s = 7; Math.random = () => ((s = Math.imul(s ^ (s >>> 15), 1 | s) + 0x6D2B79F5 | 0) >>> 0) / 4294967296;
    await new Promise(r => UI.loadRealm(realm, r));
    G.newGame(realm, 4242, 'Shot', 'm'); G.start(true);
    await new Promise(r => setTimeout(r, 1000));
    G.state = 'playing'; document.querySelectorAll('#dialog').forEach(e => e.hidden = true);
    G.clock = hour;
    Input.keys.KeyD = true; for (let i = 0; i < 150; i++) { G.frame++; G.update(1 / 60); }
    Input.keys.KeyD = false; for (let i = 0; i < 30; i++) { G.frame++; G.update(1 / 60); }
    const P = G.player; for (let i = 0; i < 6; i++) G.spawnEnemy(['runner', 'walker', 'armored'][i % 3], P.x + 120 + i * 30, P.y - 60 + (i % 2) * 120, { state: 'idle' });
    G.toast && 0;
  }, realm, hour);
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: `${out}/${realm}_${hour}_${mode}.png` });
  console.log(mode, errs.slice(0, 5).join(' | ') || 'no errors');
  await page.close();
}
await browser.close();
