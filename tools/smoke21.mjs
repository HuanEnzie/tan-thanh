// Headless smoke test for v21 work.  Needs the dev server on :8766 (python tools/devserver.py 8766).
//   PPTR=... node tools/smoke21.mjs [realm=sl] [testfile.js] [frames=600]
// Starts a fresh game in <realm>, simulates <frames> frames with a walking player and a few enemies,
// then (optionally) evaluates <testfile.js> inside the page: the file body runs as an async function and
// whatever it returns is printed as JSON. Prints every page error / console.error with its source line.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PPTR || (process.env.LOCALAPPDATA + '/npm-cache/_npx/110f701c48e68d66/node_modules/puppeteer-core'));
const realm = process.argv[2] || 'sl', testFile = process.argv[3], frames = +(process.argv[4] || 600);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 812, height: 375, deviceScaleFactor: 1 });
// ONLY=army,sys  -> every other js/v21<name>.js is served empty (v21core always loads), so a half-written
// module from a parallel task cannot break your test. Unset = load all v21 modules.
// v22 tokens are written with their prefix: ONLY=v21,22parry  (v21 = every v21 module; 22core always loads).
const only = process.env.ONLY ? ['core', '22core', ...process.env.ONLY.split(',')] : null;
if (only) {
  await page.setRequestInterception(true);
  page.on('request', rq => {
    const m = rq.url().match(/\/js\/v(21|22)(\w+)\.js/);
    const id = m ? (m[1] === '22' ? '22' + m[2] : m[2]) : null;
    const keep = !m || only.includes(id) || (m[1] === '21' && only.includes('v21'));
    if (!keep) rq.respond({ status: 200, contentType: 'application/javascript', body: '' });
    else rq.continue();
  });
}
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR ' + (e.stack || e.message).split('\n').slice(0, 3).join(' @ ')));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text() + ' ' + JSON.stringify(m.location() || {})); });
await page.goto('http://localhost:8766/?gl=0', { waitUntil: 'load' });
await new Promise(r => setTimeout(r, 2500));
const res = await page.evaluate(async (realm, frames, body) => {
  const out = {};
  try {
    let s = 7; Math.random = () => ((s = Math.imul(s ^ (s >>> 15), 1 | s) + 0x6D2B79F5 | 0) >>> 0) / 4294967296;
    await new Promise(r => UI.loadRealm(realm, r));
    G.newGame(realm, 4242, 'Smoke', 'm'); G.start(true);
    await new Promise(r => setTimeout(r, 800));
    G.state = 'playing'; document.querySelectorAll('#dialog,#weave,#create').forEach(e => e.hidden = true); UI.dialogOpen = false;
    window.sim = (n, keys) => { for (const k of keys || []) Input.keys[k] = true; for (let i = 0; i < n; i++) { G.frame++; G.update(1 / 60); if (i % 10 === 0) { G.render(); UI.update(); } for (const k in Input.pressed) Input.pressed[k] = false; } for (const k of keys || []) Input.keys[k] = false; };
    const P = G.player;
    for (let i = 0; i < 5; i++) G.spawnEnemy(['runner', 'walker', 'armored'][i % 3], P.x + 140 + i * 30, P.y - 60 + (i % 2) * 120, { state: 'idle' });
    sim(Math.floor(frames / 2), ['KeyD']); sim(Math.ceil(frames / 2));
    out.player = { lvl: P.level, hp: Math.round(P.hp), x: Math.round(P.x), y: Math.round(P.y), dead: !!P.dead };
    if (body) { const fn = new (Object.getPrototypeOf(async function () {}).constructor)(body); out.test = await fn(); }
  } catch (e) { out.error = (e.stack || String(e)).split('\n').slice(0, 4).join(' @ '); }
  return out;
}, realm, frames, testFile ? fs.readFileSync(testFile, 'utf8') : null);
console.log(JSON.stringify(res, null, 1));
console.log(errs.length ? 'ERRORS:\n' + [...new Set(errs)].slice(0, 25).join('\n') : 'no page errors');
await browser.close();
