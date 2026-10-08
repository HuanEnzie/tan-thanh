// ===== GL2D: the subset of CanvasRenderingContext2D the game uses, drawn with batched WebGL2 =====
// Sprites are packed into shared atlas pages (one texture per page), solid shapes use a white texel on page 0,
// text is rasterised once per string into a text page, and anything exotic (gradients) falls back to a 2D scratch canvas.
// Off with ?gl=0 or when WebGL2 is missing: the game then gets the normal 2D context.
const GL2D = (function () {
  const PAGE = 2048, MAXPAGES = 4, PACK_MAX = 384, UNITS = 8, MAXV = 6 * 8192, STRIDE = 24;
  const VS = `#version 300 es
in vec2 aP; in vec2 aU; in vec4 aC; in vec4 aX;
uniform vec2 uR; out vec2 vU; out vec4 vC; flat out int vT; out float vG; out float vB;
void main(){ gl_Position = vec4(aP / uR * 2.0 - 1.0, 0, 1); gl_Position.y = -gl_Position.y; vU = aU; vC = aC; vT = int(aX.x * 255.0 + 0.5); vG = aX.y; vB = aX.z * 255.0 / 127.0; }`;
  const FS = `#version 300 es
precision mediump float; in vec2 vU; in vec4 vC; flat in int vT; in float vG; in float vB; out vec4 o;
uniform sampler2D uS[${UNITS}];
void main(){ vec4 t;
${Array.from({ length: UNITS }, (_, i) => `  ${i ? 'else ' : ''}if (vT == ${i}) t = texture(uS[${i}], vU);`).join('\n')}
  if (vG > 0.0) t.rgb = mix(t.rgb, vec3(dot(t.rgb, vec3(0.299, 0.587, 0.114))), vG);
  t.rgb *= vB; o = t * vC; }`;
  const BLEND = { 'source-over': ['ONE', 'ONE_MINUS_SRC_ALPHA'], 'lighter': ['ONE', 'ONE'], 'multiply': ['DST_COLOR', 'ONE_MINUS_SRC_ALPHA'], 'screen': ['ONE', 'ONE_MINUS_SRC_COLOR'], 'destination-out': ['ZERO', 'ONE_MINUS_SRC_ALPHA'] };

  // ---- CSS colour parsing (cached) ----
  const pc = document.createElement('canvas').getContext('2d');
  const colCache = new Map();
  function parseColor(s) {
    let c = colCache.get(s); if (c) return c;
    let m = /^#([0-9a-f]{3,8})$/i.exec(s), r = 0, g = 0, b = 0, a = 1;
    if (!m) { m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i.exec(s); if (m) { r = +m[1]; g = +m[2]; b = +m[3]; a = m[4] == null ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : +m[4]; } }
    else { let h = m[1]; if (h.length <= 4) h = h.split('').map(x => x + x).join(''); r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16); if (h.length === 8) a = parseInt(h.slice(6, 8), 16) / 255; }
    if (!m) { pc.fillStyle = '#000'; pc.fillStyle = s; const n = pc.fillStyle; if (n !== s) return colCache.set(s, parseColor(n)), colCache.get(s); }
    const k = v => Math.max(0, Math.min(1, v || 0));
    c = [k(r / 255), k(g / 255), k(b / 255), k(a)];
    if (colCache.size > 4000) colCache.clear();
    colCache.set(s, c); return c;
  }

  class Grad {
    constructor(kind, args) { this.kind = kind; this.args = args; this.stops = []; }
    addColorStop(o, c) { this.stops.push([o, c]); }
    on(g) { const gr = this.kind === 'l' ? g.createLinearGradient(...this.args) : g.createRadialGradient(...this.args); for (const [o, c] of this.stops) gr.addColorStop(o, c); return gr; }
  }
  class Pat {
    constructor(img, rep) { this.img = img; this.rep = rep; this.m = [1, 0, 0, 1, 0, 0]; }
    setTransform(d) { this.m = d ? [d.a, d.b, d.c, d.d, d.e, d.f] : [1, 0, 0, 1, 0, 0]; }
  }

  class Ctx {
    constructor(canvas, gl) {
      this.canvas = canvas; this.gl = gl; this.frame = 0;
      const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
      const p = this.prog = gl.createProgram();
      gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS));
      gl.bindAttribLocation(p, 0, 'aP'); gl.bindAttribLocation(p, 1, 'aU'); gl.bindAttribLocation(p, 2, 'aC'); gl.bindAttribLocation(p, 3, 'aX');
      gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      gl.useProgram(p);
      this.uR = gl.getUniformLocation(p, 'uR');
      gl.uniform1iv(gl.getUniformLocation(p, 'uS'), Array.from({ length: UNITS }, (_, i) => i));
      this.buf = new ArrayBuffer(MAXV * STRIDE); this.f32 = new Float32Array(this.buf); this.u8 = new Uint8Array(this.buf); this.nv = 0;
      this.vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo); gl.bufferData(gl.ARRAY_BUFFER, this.buf.byteLength, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, STRIDE, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, STRIDE, 8);
      gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, true, STRIDE, 16);
      gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 4, gl.UNSIGNED_BYTE, true, STRIDE, 20);
      gl.enable(gl.BLEND); gl.disable(gl.DEPTH_TEST);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      this.units = []; this.blend = null;
      this.tex = new WeakMap(); this.loose = new Set(); this.pages = []; this.newPage();
      // a 4x4 white block at the top-left of page 0 is the texel for solid fills
      const w = document.createElement('canvas'); w.width = w.height = 4; const wg = w.getContext('2d'); wg.fillStyle = '#fff'; wg.fillRect(0, 0, 4, 4);
      gl.bindTexture(gl.TEXTURE_2D, this.pages[0].t); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, w);
      this.pages[0].x = 6; this.pages[0].rowH = 6;
      this.white = { page: this.pages[0], x: 2, y: 2, w: 0, h: 0, u0: 2 / PAGE, v0: 2 / PAGE };
      // text page (cleared when full)
      this.txt = { t: this.mkTex(PAGE, 1024, true), map: new Map(), x: 0, y: 0, rowH: 0, w: PAGE, h: 1024 };
      this.tc = document.createElement('canvas').getContext('2d', { willReadFrequently: false });
      this.scratch = document.createElement('canvas'); this.sg = this.scratch.getContext('2d', { willReadFrequently: true }); this.draws = 0;
      this.scratchTex = this.mkTex(1, 1, true);
      if (document.fonts) document.fonts.addEventListener('loadingdone', () => this.resetText());
      this.state = this.defState(); this.stack = [];
      this.path = []; this.sub = null;
    }
    defState() { return { m: [1, 0, 0, 1, 0, 0], globalAlpha: 1, globalCompositeOperation: 'source-over', fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, lineCap: 'butt', lineJoin: 'miter', font: '10px sans-serif', textAlign: 'start', textBaseline: 'alphabetic', filter: 'none', imageSmoothingEnabled: true, gray: 0, bright: 1 }; }
    mkTex(w, h, linear) {
      const gl = this.gl, t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      const f = linear ? gl.LINEAR : gl.NEAREST;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      t.lin = !!linear; return t;
    }
    newPage() { const p = { t: this.mkTex(PAGE, PAGE, false), x: 0, y: 0, rowH: 0 }; this.pages.push(p); return p; }
    // ---- textures ----
    entry(img, repeat) {
      let e = this.tex.get(img);
      if (e && (e.dirty || (img._dynamic && e.upFrame !== this.frame))) { this.upload(e, img); e.dirty = false; e.upFrame = this.frame; }
      if (e && (!repeat || e.own)) { e.used = this.frame; return e; }
      const w = img.width | 0, h = img.height | 0; if (!w || !h) return null;
      if (img instanceof HTMLImageElement && !img.complete) return null;
      if (!repeat && w <= PACK_MAX && h <= PACK_MAX && !img._dynamic) {
        for (const p of this.pages) { const s = this.place(p, w + 2, h + 2); if (s) { e = { page: p, x: s[0] + 1, y: s[1] + 1, w, h }; break; } }
        if (!e && this.pages.length < MAXPAGES) { const p = this.newPage(); const s = this.place(p, w + 2, h + 2); e = { page: p, x: s[0] + 1, y: s[1] + 1, w, h }; }
      }
      if (!e) { e = { own: true, t: this.mkTex(w, h, false), w, h, x: 0, y: 0 }; e.page = { t: e.t }; this.loose.add(e); e.src = new WeakRef(img); if (repeat) { const gl = this.gl; gl.bindTexture(gl.TEXTURE_2D, e.t); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT); } }
      const PW = e.own ? w : PAGE;
      e.u0 = e.x / PW; e.v0 = e.y / PW; e.u1 = (e.x + w) / PW; e.v1 = (e.y + h) / (e.own ? h : PAGE);
      if (e.own) e.v0 = 0;
      this.upload(e, img); e.used = e.upFrame = this.frame;
      this.tex.set(img, e); return e;
    }
    place(p, w, h) {
      if (p.x + w > PAGE) { p.x = 0; p.y += p.rowH; p.rowH = 0; }
      if (p.y + h > PAGE) return null;
      const s = [p.x, p.y]; p.x += w; p.rowH = Math.max(p.rowH, h); return s;
    }
    upload(e, img) {
      const gl = this.gl; this.flush();
      gl.bindTexture(gl.TEXTURE_2D, e.page.t);
      if (e.own) {
        if (img.width !== e.w || img.height !== e.h) { e.w = img.width; e.h = img.height; }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      } else gl.texSubImage2D(gl.TEXTURE_2D, 0, e.x, e.y, gl.RGBA, gl.UNSIGNED_BYTE, img);
      this.units.length = 0;
    }
    // call after drawing into a canvas that was already drawn through this context
    dirty(img) { const e = this.tex.get(img); if (e) e.dirty = true; }
    unit(t) {
      let i = this.units.indexOf(t);
      if (i >= 0) return i;
      if (this.units.length >= UNITS) { this.flush(); this.units.length = 0; }
      i = this.units.length; this.units.push(t);
      const gl = this.gl; gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t);
      return i;
    }
    setBlend() {
      const op = BLEND[this.state.globalCompositeOperation] ? this.state.globalCompositeOperation : 'source-over';
      if (op !== this.blend) { this.flush(); this.blend = op; const gl = this.gl, b = BLEND[op]; gl.blendFunc(gl[b[0]], gl[b[1]]); }
    }
    // ---- vertex emit ----
    vert(x, y, u, v, r, g, b, a, t, sm) {
      if (this.nv >= MAXV) this.flush();
      const o = this.nv * 6, f = this.f32, u8 = this.u8, q = o * 4;
      f[o] = x; f[o + 1] = y; f[o + 2] = u; f[o + 3] = v;
      u8[q + 16] = r; u8[q + 17] = g; u8[q + 18] = b; u8[q + 19] = a;
      u8[q + 20] = t; u8[q + 21] = sm; u8[q + 22] = this.state.bright * 127 + 0.5; u8[q + 23] = 0;
      this.nv++;
    }
    quad(e, sx, sy, sw, sh, dx, dy, dw, dh, col) {
      const s = this.state, m = s.m;
      this.setBlend();
      let t = e.page.t;
      if (e.own && t.lin !== s.imageSmoothingEnabled) { const gl = this.gl; this.flush(); gl.bindTexture(gl.TEXTURE_2D, t); const f = s.imageSmoothingEnabled ? gl.LINEAR : gl.NEAREST; gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f); t.lin = s.imageSmoothingEnabled; this.units.length = 0; }
      if (this.nv + 6 > MAXV) this.flush();
      const ti = this.unit(t);
      const PW = e.own ? e.w : PAGE, PH = e.own ? e.h : PAGE;
      const u0 = (e.x + sx) / PW, v0 = (e.y + sy) / PH, u1 = (e.x + sx + sw) / PW, v1 = (e.y + sy + sh) / PH;
      let r, g, b, a;
      const ga = s.globalAlpha;
      if (col) { a = col[3] * ga; r = col[0] * a; g = col[1] * a; b = col[2] * a; } else { r = g = b = a = ga; }
      r = r * 255 + 0.5 | 0; g = g * 255 + 0.5 | 0; b = b * 255 + 0.5 | 0; a = a * 255 + 0.5 | 0;
      if (a <= 0 && this.blend !== 'destination-out') return;
      const x0 = dx, y0 = dy, x1 = dx + dw, y1 = dy + dh;
      const ax = m[0] * x0 + m[2] * y0 + m[4], ay = m[1] * x0 + m[3] * y0 + m[5];
      const bx = m[0] * x1 + m[2] * y0 + m[4], by = m[1] * x1 + m[3] * y0 + m[5];
      const cx = m[0] * x1 + m[2] * y1 + m[4], cy = m[1] * x1 + m[3] * y1 + m[5];
      const ex = m[0] * x0 + m[2] * y1 + m[4], ey = m[1] * x0 + m[3] * y1 + m[5];
      const gr = s.gray * 255 | 0, br = s.bright * 127 + 0.5 | 0;
      const f = this.f32, u8 = this.u8; let o = this.nv * 6;
      const W = (x, y, u, v) => { f[o] = x; f[o + 1] = y; f[o + 2] = u; f[o + 3] = v; const q = o * 4 + 16; u8[q] = r; u8[q + 1] = g; u8[q + 2] = b; u8[q + 3] = a; u8[q + 4] = ti; u8[q + 5] = gr; u8[q + 6] = br; o += 6; };
      W(ax, ay, u0, v0); W(bx, by, u1, v0); W(cx, cy, u1, v1); W(ax, ay, u0, v0); W(cx, cy, u1, v1); W(ex, ey, u0, v1);
      this.nv += 6;
    }
    // triangles in device space with a solid colour (white texel)
    tris(pts, col) {
      this.setBlend();
      const s = this.state, a0 = col[3] * s.globalAlpha; if (a0 <= 0) return;
      const r = col[0] * a0 * 255 + 0.5 | 0, g = col[1] * a0 * 255 + 0.5 | 0, b = col[2] * a0 * 255 + 0.5 | 0, a = a0 * 255 + 0.5 | 0;
      if (this.nv + pts.length / 2 > MAXV) this.flush();
      const ti = this.unit(this.white.page.t), u = this.white.u0, v = this.white.v0;
      for (let i = 0; i < pts.length; i += 2) this.vert(pts[i], pts[i + 1], u, v, r, g, b, a, ti, 0);
    }
    flush() {
      if (!this.nv) return;
      const gl = this.gl;
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.f32, 0, this.nv * 6);
      gl.drawArrays(gl.TRIANGLES, 0, this.nv);
      this.nv = 0; this.draws++;
    }
    beginFrame() {
      const gl = this.gl, c = this.canvas;
      this.frame++; this.draws = 0;
      gl.viewport(0, 0, c.width, c.height); gl.uniform2f(this.uR, c.width, c.height);
      gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      this.units.length = 0; this.blend = null; this.stack.length = 0; this.state = this.defState();
      if (this.frame % 300 === 0) for (const e of this.loose) if (this.frame - e.used > 600 || !e.src.deref()) { gl.deleteTexture(e.t); this.loose.delete(e); const im = e.src.deref(); if (im) this.tex.delete(im); }
    }
    endFrame() { this.flush(); }
    // ---- state ----
    save() { const s = this.state; this.stack.push(Object.assign({}, s, { m: s.m.slice() })); }
    restore() { const s = this.stack.pop(); if (s) this.state = s; }
    get globalAlpha() { return this.state.globalAlpha; } set globalAlpha(v) { if (v >= 0 && v <= 1) this.state.globalAlpha = v; else if (v > 1) this.state.globalAlpha = 1; }
    get globalCompositeOperation() { return this.state.globalCompositeOperation; } set globalCompositeOperation(v) { this.state.globalCompositeOperation = v; }
    get fillStyle() { return this.state.fillStyle; } set fillStyle(v) { this.state.fillStyle = v; }
    get strokeStyle() { return this.state.strokeStyle; } set strokeStyle(v) { this.state.strokeStyle = v; }
    get lineWidth() { return this.state.lineWidth; } set lineWidth(v) { if (v > 0) this.state.lineWidth = v; }
    get lineCap() { return this.state.lineCap; } set lineCap(v) { this.state.lineCap = v; }
    get lineJoin() { return this.state.lineJoin; } set lineJoin(v) { this.state.lineJoin = v; }
    get font() { return this.state.font; } set font(v) { this.state.font = v; }
    get textAlign() { return this.state.textAlign; } set textAlign(v) { this.state.textAlign = v; }
    get textBaseline() { return this.state.textBaseline; } set textBaseline(v) { this.state.textBaseline = v; }
    get imageSmoothingEnabled() { return this.state.imageSmoothingEnabled; } set imageSmoothingEnabled(v) { this.state.imageSmoothingEnabled = !!v; }
    get filter() { return this.state.filter; }
    set filter(v) {
      const s = this.state; s.filter = v; s.gray = 0; s.bright = 1;
      const g = /grayscale\(([\d.]+)\)/.exec(v), b = /brightness\(([\d.]+)\)/.exec(v);
      if (g) s.gray = Math.min(1, +g[1]); if (b) s.bright = Math.min(2, +b[1]);
    }
    // ---- transform ----
    setTransform(a, b, c, d, e, f) { if (typeof a === 'object') { const M = a; a = M.a; b = M.b; c = M.c; d = M.d; e = M.e; f = M.f; } this.state.m = [a, b, c, d, e, f]; }
    resetTransform() { this.state.m = [1, 0, 0, 1, 0, 0]; }
    getTransform() { const m = this.state.m; return new DOMMatrix(m); }
    transform(a, b, c, d, e, f) { const m = this.state.m; this.state.m = [m[0] * a + m[2] * b, m[1] * a + m[3] * b, m[0] * c + m[2] * d, m[1] * c + m[3] * d, m[0] * e + m[2] * f + m[4], m[1] * e + m[3] * f + m[5]]; }
    translate(x, y) { const m = this.state.m; m[4] += m[0] * x + m[2] * y; m[5] += m[1] * x + m[3] * y; }
    scale(x, y) { const m = this.state.m; m[0] *= x; m[1] *= x; m[2] *= y; m[3] *= y; }
    rotate(r) { if (!r) return; const c = Math.cos(r), s = Math.sin(r), m = this.state.m; const a = m[0], b = m[1], cc = m[2], d = m[3]; m[0] = a * c + cc * s; m[1] = b * c + d * s; m[2] = cc * c - a * s; m[3] = d * c - b * s; }
    // ---- images ----
    drawImage(img, a, b, c, d, e, f, g, h) {
      if (!img) return;
      const en = this.entry(img, false); if (!en) return;
      if (c === undefined) this.quad(en, 0, 0, en.w, en.h, a, b, en.w, en.h);
      else if (e === undefined) this.quad(en, 0, 0, en.w, en.h, a, b, c, d);
      else {
        if (c <= 0 || d <= 0) return;
        let sx = a, sy = b, sw = c, sh = d, dx = e, dy = f, dw = g, dh = h;
        if (sx < 0) { dx -= sx * dw / sw; dw += sx * dw / sw; sw += sx; sx = 0; } if (sy < 0) { dy -= sy * dh / sh; dh += sy * dh / sh; sh += sy; sy = 0; }
        if (sx + sw > en.w) { dw *= (en.w - sx) / sw; sw = en.w - sx; } if (sy + sh > en.h) { dh *= (en.h - sy) / sh; sh = en.h - sy; }
        if (sw > 0 && sh > 0) this.quad(en, sx, sy, sw, sh, dx, dy, dw, dh);
      }
    }
    // ---- rects ----
    fillRect(x, y, w, h) {
      const st = this.state.fillStyle;
      if (typeof st === 'string') { const c = parseColor(st); this.quad(this.white, 0, 0, 0, 0, x, y, w, h, c); return; }
      if (st instanceof Pat) { this.patRect(st, x, y, w, h); return; }
      this.beginPath(); this.rect(x, y, w, h); this.fill();
    }
    strokeRect(x, y, w, h) { const p = this.path, s = this.sub; this.beginPath(); this.rect(x, y, w, h); this.stroke(); this.path = p; this.sub = s; }
    clearRect(x, y, w, h) { const s = this.state, o = s.globalCompositeOperation, f = s.fillStyle, a = s.globalAlpha; s.globalCompositeOperation = 'destination-out'; s.fillStyle = '#000'; s.globalAlpha = 1; this.fillRect(x, y, w, h); s.globalCompositeOperation = o; s.fillStyle = f; s.globalAlpha = a; }
    patRect(p, x, y, w, h) {
      const en = this.entry(p.img, true); if (!en) return;
      // the pattern's own matrix maps pattern space to user space; texture coords are its inverse, in image pixels
      const M = p.m, det = M[0] * M[3] - M[1] * M[2]; if (!det) return;
      const inv = (X, Y) => { X -= M[4]; Y -= M[5]; return [(M[3] * X - M[2] * Y) / det / en.w, (-M[1] * X + M[0] * Y) / det / en.h]; };
      const s = this.state, m = s.m; this.setBlend();
      const ti = this.unit(en.page.t), ga = s.globalAlpha * 255 + 0.5 | 0;
      if (this.nv + 6 > MAXV) this.flush();
      const P = [[x, y], [x + w, y], [x + w, y + h], [x, y], [x + w, y + h], [x, y + h]];
      for (const [X, Y] of P) { const uv = inv(X, Y); this.vert(m[0] * X + m[2] * Y + m[4], m[1] * X + m[3] * Y + m[5], uv[0], uv[1], ga, ga, ga, ga, ti, 0); }
    }
    createPattern(img, rep) { return new Pat(img, rep); }
    createLinearGradient(...a) { return new Grad('l', a); }
    createRadialGradient(...a) { return new Grad('r', a); }
    // ---- paths (points are stored in device space, as canvas does) ----
    beginPath() { this.path = []; this.sub = null; }
    tp(x, y) { const m = this.state.m; return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]; }
    moveTo(x, y) { this.sub = this.tp(x, y); this.path.push(this.sub); }
    lineTo(x, y) { if (!this.sub) return this.moveTo(x, y); const p = this.tp(x, y); this.sub.push(p[0], p[1]); }
    closePath() { if (this.sub && this.sub.length > 2) { this.sub.closed = true; const x = this.sub[0], y = this.sub[1]; this.sub = [x, y]; this.path.push(this.sub); } }
    rect(x, y, w, h) { this.moveTo(x, y); this.lineTo(x + w, y); this.lineTo(x + w, y + h); this.lineTo(x, y + h); this.closePath(); }
    arc(x, y, r, a0, a1, ccw) { this.ellipse(x, y, r, r, 0, a0, a1, ccw); }
    ellipse(x, y, rx, ry, rot, a0, a1, ccw) {
      if (rx < 0 || ry < 0) return;
      let sweep = a1 - a0;
      const TAU = Math.PI * 2;
      if (!ccw) { if (sweep >= TAU) sweep = TAU; else { sweep %= TAU; if (sweep < 0) sweep += TAU; } }
      else { if (-sweep >= TAU) sweep = -TAU; else { sweep %= TAU; if (sweep > 0) sweep -= TAU; } }
      const m = this.state.m, sc = Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])) * Math.max(rx, ry);
      const n = Math.max(4, Math.min(48, Math.ceil(Math.abs(sweep) / TAU * Math.max(10, sc * 0.6))));
      const cr = Math.cos(rot), sr = Math.sin(rot);
      for (let i = 0; i <= n; i++) {
        const a = a0 + sweep * i / n, ex = Math.cos(a) * rx, ey = Math.sin(a) * ry;
        const X = x + ex * cr - ey * sr, Y = y + ex * sr + ey * cr;
        if (i === 0 && !this.sub) this.moveTo(X, Y); else this.lineTo(X, Y);
      }
    }
    fill() {
      const st = this.state.fillStyle;
      if (typeof st !== 'string') { this.fallback('fill'); return; }
      const col = parseColor(st), out = [];
      for (const s of this.path) if (s.length >= 6) triangulate(s, out);
      if (out.length) this.tris(out, col);
    }
    stroke() {
      const st = this.state.strokeStyle;
      if (typeof st !== 'string') { this.fallback('stroke'); return; }
      const col = parseColor(st), m = this.state.m;
      const hw = this.state.lineWidth * Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])) / 2, out = [];
      const ext = this.state.lineCap !== 'butt' ? hw : 0;
      for (const s of this.path) {
        const n = s.length / 2 | 0; if (n < 2) continue;
        const seg = (x0, y0, x1, y1) => {
          let dx = x1 - x0, dy = y1 - y0; const l = Math.hypot(dx, dy); if (l < 1e-6) return;
          dx /= l; dy /= l; const nx = -dy * hw, ny = dx * hw;
          x0 -= dx * ext; y0 -= dy * ext; x1 += dx * ext; y1 += dy * ext;
          out.push(x0 + nx, y0 + ny, x1 + nx, y1 + ny, x1 - nx, y1 - ny, x0 + nx, y0 + ny, x1 - nx, y1 - ny, x0 - nx, y0 - ny);
        };
        for (let i = 0; i < n - 1; i++) seg(s[i * 2], s[i * 2 + 1], s[i * 2 + 2], s[i * 2 + 3]);
        if (s.closed) seg(s[n * 2 - 2], s[n * 2 - 1], s[0], s[1]);
      }
      if (out.length) this.tris(out, col);
    }
    clip() {}
    // rasterise the current path with the real 2D API (gradients, odd styles) and draw it as one quad
    fallback(kind) {
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const s of this.path) for (let i = 0; i < s.length; i += 2) { x0 = Math.min(x0, s[i]); x1 = Math.max(x1, s[i]); y0 = Math.min(y0, s[i + 1]); y1 = Math.max(y1, s[i + 1]); }
      const lw = kind === 'stroke' ? this.state.lineWidth * 2 + 2 : 1;
      x0 = Math.floor(Math.max(x0 - lw, 0)); y0 = Math.floor(Math.max(y0 - lw, 0)); x1 = Math.ceil(Math.min(x1 + lw, this.canvas.width)); y1 = Math.ceil(Math.min(y1 + lw, this.canvas.height));
      const w = x1 - x0, h = y1 - y0; if (w <= 0 || h <= 0) return;
      const c = this.scratch, g = this.sg;
      if (c.width < w || c.height < h) { c.width = Math.max(c.width, w); c.height = Math.max(c.height, h); }
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h);
      g.beginPath();
      for (const s of this.path) { for (let i = 0; i < s.length; i += 2) (i ? g.lineTo : g.moveTo).call(g, s[i] - x0, s[i + 1] - y0); if (s.closed) g.closePath(); }
      const m = this.state.m; g.setTransform(m[0], m[1], m[2], m[3], m[4] - x0, m[5] - y0);
      const st = kind === 'fill' ? this.state.fillStyle : this.state.strokeStyle;
      const sty = st instanceof Grad ? st.on(g) : st instanceof Pat ? g.createPattern(st.img, st.rep) : st;
      if (kind === 'fill') { g.fillStyle = sty; g.fill(); } else { g.strokeStyle = sty; g.lineWidth = this.state.lineWidth; g.lineCap = this.state.lineCap; g.stroke(); }
      this.flush();
      const gl = this.gl; gl.bindTexture(gl.TEXTURE_2D, this.scratchTex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, g.getImageData(0, 0, w, h)); this.units.length = 0;
      const e = { page: { t: this.scratchTex }, own: true, x: 0, y: 0, w, h };
      const sm = this.state.m; this.state.m = [1, 0, 0, 1, 0, 0];
      this.quad(e, 0, 0, w, h, x0, y0, w, h);
      this.state.m = sm; this.flush();
    }
    // ---- text ----
    resetText() { this.flush(); this.txt.map.clear(); this.txt.x = this.txt.y = this.txt.rowH = 0; const gl = this.gl; gl.bindTexture(gl.TEXTURE_2D, this.txt.t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.txt.w, this.txt.h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); this.units.length = 0; }
    measureText(t) { this.tc.font = this.state.font; return this.tc.measureText(t); }
    fillText(t, x, y) { this.text(t, x, y, false); }
    strokeText(t, x, y) { this.text(t, x, y, true); }
    text(t, x, y, stroke) {
      t = String(t); if (!t) return;
      const s = this.state, m = s.m;
      const sc = Math.max(0.5, Math.round(Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])) * 2) / 2);
      const style = stroke ? s.strokeStyle : s.fillStyle; if (typeof style !== 'string') return;
      const key = (stroke ? 'S' + s.lineWidth : 'F') + '|' + sc + '|' + s.font + '|' + s.textAlign + s.textBaseline + '|' + style + '|' + t;
      const T = this.txt;
      let e = T.map.get(key);
      if (!e) {
        const font = s.font.replace(/([\d.]+)px/, (_, n) => (+n * sc) + 'px');
        const g = this.tc; g.font = font;
        const mt = g.measureText(t), pad = Math.ceil((stroke ? s.lineWidth * sc : 0) + 2);
        const asc = Math.ceil(mt.actualBoundingBoxAscent || +(/([\d.]+)px/.exec(font) || [0, 10])[1]), dsc = Math.ceil(mt.actualBoundingBoxDescent || 2);
        const w = Math.ceil(mt.width) + pad * 2 + 2, h = asc + dsc + pad * 2;
        if (w > T.w || h > 256) return;
        if (T.x + w > T.w) { T.x = 0; T.y += T.rowH; T.rowH = 0; }
        if (T.y + h > T.h) { this.resetText(); }
        const c = this.scratch; if (c.width < w || c.height < h) { c.width = Math.max(c.width, w); c.height = Math.max(c.height, h); }
        const sg = this.sg; sg.setTransform(1, 0, 0, 1, 0, 0); sg.clearRect(0, 0, w, h); sg.font = font; sg.textAlign = 'left'; sg.textBaseline = 'alphabetic';
        if (stroke) { sg.lineWidth = s.lineWidth * sc; sg.strokeStyle = style; sg.lineJoin = 'round'; sg.strokeText(t, pad, pad + asc); } else { sg.fillStyle = style; sg.fillText(t, pad, pad + asc); }
        const gl = this.gl; this.flush();
        gl.bindTexture(gl.TEXTURE_2D, T.t);
        const id = sg.getImageData(0, 0, w, h);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, T.x, T.y, w, h, gl.RGBA, gl.UNSIGNED_BYTE, id);
        this.units.length = 0;
        const al = s.textAlign, bl = s.textBaseline;
        let ox = al === 'center' ? -mt.width / 2 : (al === 'right' || al === 'end') ? -mt.width : 0;
        const fpx = +(/([\d.]+)px/.exec(font) || [0, 10])[1];
        let oy = bl === 'top' || bl === 'hanging' ? fpx * 0.8 : bl === 'middle' ? fpx * 0.3 : bl === 'bottom' || bl === 'ideographic' ? -fpx * 0.2 : 0;
        e = { x: T.x, y: T.y, w, h, ox: (ox - pad) / sc, oy: (oy - pad - asc) / sc, sc };
        T.map.set(key, e); T.x += w; T.rowH = Math.max(T.rowH, h);
      }
      this.textQuad(T, e, x + e.ox, y + e.oy, e.w / e.sc, e.h / e.sc);
    }
    textQuad(T, e, dx, dy, dw, dh) {
      const s = this.state, m = s.m; this.setBlend();
      if (this.nv + 6 > MAXV) this.flush();
      const ti = this.unit(T.t), ga = s.globalAlpha * 255 + 0.5 | 0; if (!ga) return;
      const u0 = e.x / T.w, v0 = e.y / T.h, u1 = (e.x + e.w) / T.w, v1 = (e.y + e.h) / T.h;
      const P = [[dx, dy, u0, v0], [dx + dw, dy, u1, v0], [dx + dw, dy + dh, u1, v1], [dx, dy, u0, v0], [dx + dw, dy + dh, u1, v1], [dx, dy + dh, u0, v1]];
      for (const [X, Y, U, V] of P) this.vert(m[0] * X + m[2] * Y + m[4], m[1] * X + m[3] * Y + m[5], U, V, ga, ga, ga, ga, ti, 0);
    }
    getImageData() { return new ImageData(1, 1); }
  }

  // ear clipping (convex fast path); pts = flat [x,y,...] in device space, appends triangles to out
  function triangulate(p, out) {
    let n = p.length / 2 | 0;
    if (n > 2 && p[0] === p[n * 2 - 2] && p[1] === p[n * 2 - 1]) n--;
    if (n < 3) return;
    let sign = 0, convex = true;
    for (let i = 0; i < n && convex; i++) {
      const a = i * 2, b = (i + 1) % n * 2, c = (i + 2) % n * 2;
      const cr = (p[b] - p[a]) * (p[c + 1] - p[b + 1]) - (p[b + 1] - p[a + 1]) * (p[c] - p[b]);
      if (Math.abs(cr) < 1e-9) continue;
      if (!sign) sign = Math.sign(cr); else if (Math.sign(cr) !== sign) convex = false;
    }
    if (convex) { for (let i = 1; i < n - 1; i++) out.push(p[0], p[1], p[i * 2], p[i * 2 + 1], p[i * 2 + 2], p[i * 2 + 3]); return; }
    const idx = Array.from({ length: n }, (_, i) => i);
    let area = 0; for (let i = 0; i < n; i++) { const j = (i + 1) % n; area += p[i * 2] * p[j * 2 + 1] - p[j * 2] * p[i * 2 + 1]; }
    const ccw = area > 0;
    const inTri = (px, py, ax, ay, bx, by, cx, cy) => { const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by), d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy), d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay); return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)); };
    let guard = 0;
    while (idx.length > 3 && guard++ < 5000) {
      let cut = false;
      for (let i = 0; i < idx.length; i++) {
        const a = idx[(i + idx.length - 1) % idx.length] * 2, b = idx[i] * 2, c = idx[(i + 1) % idx.length] * 2;
        const cr = (p[b] - p[a]) * (p[c + 1] - p[a + 1]) - (p[b + 1] - p[a + 1]) * (p[c] - p[a]);
        if (ccw ? cr <= 0 : cr >= 0) continue;
        let ok = true;
        for (const k of idx) { const q = k * 2; if (q === a || q === b || q === c) continue; if (inTri(p[q], p[q + 1], p[a], p[a + 1], p[b], p[b + 1], p[c], p[c + 1])) { ok = false; break; } }
        if (!ok) continue;
        out.push(p[a], p[a + 1], p[b], p[b + 1], p[c], p[c + 1]); idx.splice(i, 1); cut = true; break;
      }
      if (!cut) break;
    }
    if (idx.length === 3) out.push(p[idx[0] * 2], p[idx[0] * 2 + 1], p[idx[1] * 2], p[idx[1] * 2 + 1], p[idx[2] * 2], p[idx[2] * 2 + 1]);
  }

  return {
    create(canvas) {
      let pref = null; try { pref = localStorage.getItem('tt_gl'); } catch (e) {}
      if (/[?&]gl=0/.test(location.search) || (pref === '0' && !/[?&]gl=1/.test(location.search))) return null;
      try {
        const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
        if (!gl) return null;
        const c = new Ctx(canvas, gl);
        canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); setTimeout(() => location.reload(), 300); });
        return c;
      } catch (e) { console.warn('GL2D off:', e); return null; }
    },
  };
})();
