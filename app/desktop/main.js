const { app, BrowserWindow, protocol, shell } = require('electron');
const path = require('path');
const fs = require('fs');

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
]);

const wwwFolder = path.join(__dirname, 'www');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.woff2': 'font/woff2', '.ttf': 'font/ttf' }; // filled by `npm run sync`

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    backgroundColor: '#0b0c0e',
    autoHideMenuBar: true,
    title: 'Tàn Thành: Vạn Giới',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });

  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('app://')) {
      event.preventDefault();
      if (url.startsWith('http://') || url.startsWith('https://')) {
        shell.openExternal(url);
      }
    }
  });

  win.loadURL('app://game/index.html');
  // TT_SMOKE=1: start a game, print what the page reports, then quit (used to test builds)
  if (process.env.TT_SMOKE) win.webContents.once('did-finish-load', () => setTimeout(async () => {
    const r = await win.webContents.executeJavaScript(`new Promise(ok => UI.loadRealm('tt', () => { G.newGame('tt', 1, 'Smoke', 'm'); G.start(true); setTimeout(() => ok(JSON.stringify({ renderer: ctx.beginFrame ? 'webgl' : '2d', state: G.state, imgs: Object.keys(IMG).length, frame: G.frame })), 1500); }))`).catch(e => 'error ' + e.message);
    console.log('SMOKE', r); app.quit();
  }, 2500));
}

// the default user agent embeds productName ("Tàn Thành…"); non-Latin characters there break protocol.handle requests
app.userAgentFallback = app.userAgentFallback.replace(/[^\x20-\x7e]+/g, '');

app.whenReady().then(() => {
  protocol.handle('app', (request) => {
    try {
      const url = new URL(request.url);
      let pathname = decodeURIComponent(url.pathname);
      if (!pathname || pathname === '/') {
        pathname = '/index.html';
      }

      const relativePath = path.normalize(pathname).replace(/^[/\\]+/, '');
      const resolvedPath = path.resolve(wwwFolder, relativePath);

      const relativeToWww = path.relative(wwwFolder, resolvedPath);
      if (relativeToWww.startsWith('..') || path.isAbsolute(relativeToWww)) {
        return new Response('Forbidden', { status: 403 });
      }

      let filePath = resolvedPath;
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      if (!fs.existsSync(filePath)) {
        return new Response('Not Found', { status: 404 });
      }

      // read the file ourselves: net.fetch(file://) fails on paths with non-Latin characters (e.g. "Huân")
      return fs.promises.readFile(filePath).then(buf => new Response(buf, { headers: { 'content-type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' } }));
    } catch {
      return new Response('Bad Request', { status: 400 });
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
