// ===== Procedural low-poly 3D models: characters (rigged), weapons, props =====
// Characters face +X. Units = world pixels (a human is ~46 tall).

const GB = {
  parts: [],
  _m: null,
  start() { this.parts = []; return this; },
  mat(x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
  },
  add(geo, color, m) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    g.deleteAttribute && g.deleteAttribute('uv');
    g.applyMatrix4(m);
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3);
    const c = new THREE.Color(color);
    for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.parts.push(g);
    return this;
  },
  box(w, h, d, c, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) { return this.add(new THREE.BoxGeometry(w, h, d), c, this.mat(x, y, z, rx, ry, rz)); },
  cyl(rt, rb, h, seg, c, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) { return this.add(new THREE.CylinderGeometry(rt, rb, h, seg), c, this.mat(x, y, z, rx, ry, rz)); },
  cone(r, h, seg, c, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) { return this.add(new THREE.ConeGeometry(r, h, seg), c, this.mat(x, y, z, rx, ry, rz)); },
  sph(r, c, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, det = 1) { return this.add(new THREE.IcosahedronGeometry(r, det), c, this.mat(x, y, z, 0, 0, 0, sx, sy, sz)); },
  dode(r, c, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) { return this.add(new THREE.DodecahedronGeometry(r, 0), c, this.mat(x, y, z, 0.3, 0.7, 0.2, sx, sy, sz)); },
  torus(r, t, c, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, arc = TAU) { return this.add(new THREE.TorusGeometry(r, t, 5, 14, arc), c, this.mat(x, y, z, rx, ry, rz)); },
  done() {
    let total = 0;
    for (const g of this.parts) total += g.attributes.position.count;
    const pos = new Float32Array(total * 3), col = new Float32Array(total * 3);
    let o = 0;
    for (const g of this.parts) { pos.set(g.attributes.position.array, o * 3); col.set(g.attributes.color.array, o * 3); o += g.attributes.position.count; g.dispose(); }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('color', new THREE.BufferAttribute(col, 3));
    out.computeVertexNormals(); // non-indexed => flat low-poly shading
    out.computeBoundingSphere();
    this.parts = [];
    return out;
  },
};
const shade = (c, k) => { const t = new THREE.Color(c); t.r = Math.min(1, t.r * k); t.g = Math.min(1, t.g * k); t.b = Math.min(1, t.b * k); return t.getHex(); };

// ---------- weapons (point along +X, grip at origin) ----------
function buildWeapon(g, kind, glow) {
  const metal = 0x2a2c30, wood = 0x6a4428;
  switch (kind) {
    case 'pistol': g.box(12, 4, 3, metal, 6, 1, 0).box(3, 7, 3, 0x1a1a1a, 1, -3, 0); if (glow) g.box(6, 1.5, 3.4, glow, 7, 1.5, 0); break;
    case 'shotgun': g.box(30, 3.5, 3, metal, 13, 1, 0).box(10, 4, 4, wood, -4, 0, 0).box(8, 3, 3.6, wood, 14, -1.5, 0); if (glow) g.box(10, 2, 4, glow, 16, 1, 0); break;
    case 'rifle': g.box(28, 4, 3, metal, 12, 1, 0).box(9, 5, 4, wood, -4, -0.5, 0).box(4, 8, 3, 0x1a1a1a, 6, -4, 0, 0, 0, 0.3); if (glow) g.box(16, 1.6, 3.4, glow, 14, 2.5, 0); break;
    case 'bat': g.cyl(1.6, 2.6, 30, 6, wood, 14, 0, 0, 0, 0, Math.PI / 2); for (let i = 0; i < 4; i++) g.box(1, 3, 1, 0xaaaaaa, 22 + i * 2, 2.5 * (i % 2 ? 1 : -1), 0); break;
    case 'katana': g.box(34, 2.4, 0.8, glow || 0xd8e0e8, 19, 0, 0).box(2, 6, 2, 0x3a3a3a, 2, 0, 0).box(7, 2.4, 2.4, 0x1a1a1a, -3, 0, 0); break;
    case 'sword': g.box(30, 3, 0.8, 0xd8dde4, 17, 0, 0).box(2, 9, 2, 0xc8a040, 2, 0, 0).box(7, 2.4, 2.4, 0x4a2a1a, -3, 0, 0); if (glow) g.box(30, 1, 1.2, glow, 17, 0, 0); break;
    case 'dagger': g.box(16, 3, 0.8, glow || 0x8a7aa8, 9, 0, 0).box(2, 6, 2, 0x2a2a2a, 1, 0, 0).box(6, 2, 2, 0x1a1a1a, -3, 0, 0); break;
    case 'crossbow': g.box(22, 3, 3, wood, 9, 0, 0).box(3, 3, 22, 0x4a3a2a, 16, 1, 0).box(14, 1, 1, 0xdddddd, 12, 2, 0); break;
    case 'musket': g.box(34, 3, 3, 0x3a3a3a, 15, 1, 0).box(14, 4, 4, wood, -2, -0.5, 0); break;
    case 'bow': g.torus(14, 1.2, wood, 4, 0, 0, Math.PI / 2, 0, -Math.PI / 2, Math.PI).box(1, 1, 28, 0xeeeeee, -2, 0, 0); break;
    case 'talisman': g.box(3, 1, 10, 0xffd65a, 6, 0, 0, 0, 0, 0).box(3.4, 1.2, 3, 0xc62828, 6, 0, 0); break;
    case 'gourd': g.sph(5, 0x3ab87a, 6, 0, 0).sph(3.6, 0x3ab87a, 12, 0, 0).box(2, 2, 2, 0xc62828, 15, 0, 0); break;
    case 'staff': g.cyl(1.2, 1.2, 40, 5, 0x8a6a3a, 14, 0, 0, 0, 0, Math.PI / 2).sph(4, glow || 0x6bb6ff, 35, 0, 0); break;
    case 'orb': g.sph(5, glow || 0x6b5bff, 6, 0, 0); break;
    case 'flysword': g.box(32, 2.6, 0.8, 0xbff8ff, 18, 0, 0).box(2, 7, 2, 0xffd65a, 2, 0, 0).box(6, 2, 2, 0x2a6a6a, -3, 0, 0); break;
    case 'axe': g.cyl(1.4, 1.4, 34, 5, wood, 15, 0, 0, 0, 0, Math.PI / 2).box(8, 12, 1.5, 0x9a9aa0, 30, 4, 0); break;
    case 'spear': g.cyl(1.1, 1.1, 50, 5, wood, 20, 0, 0, 0, 0, Math.PI / 2).cone(2.4, 8, 4, 0xc8c8d0, 47, 0, 0, 0, 0, -Math.PI / 2); break;
    case 'halberd': g.cyl(1.4, 1.4, 56, 5, 0x2a1a10, 22, 0, 0, 0, 0, Math.PI / 2).box(12, 14, 1.5, 0xc8a040, 46, 4, 0).cone(2.4, 10, 4, 0xc8a040, 54, 0, 0, 0, 0, -Math.PI / 2); break;
    case 'club': g.cyl(2, 5, 28, 6, 0x5a3a20, 13, 0, 0, 0, 0, Math.PI / 2); break;
    case 'greatsword': g.box(48, 5, 1.2, 0x9a2020, 27, 0, 0).box(3, 14, 3, 0x2a0a0a, 2, 0, 0).box(9, 3, 3, 0x1a0a0a, -4, 0, 0); break;
    case 'knife': g.box(10, 2.4, 0.8, 0x8a8a7a, 6, 0, 0).box(5, 2, 2, 0x4a3020, -1, 0, 0); break;
    case 'glaive': g.cyl(1.2, 1.2, 46, 5, 0x3a1a1a, 18, 0, 0, 0, 0, Math.PI / 2).box(14, 6, 1.4, 0xaa3a3a, 42, 2, 0); break;
  }
}
const REALM_WEAPONS = {
  md: { r1: ['pistol'], r2: ['shotgun'], r3: ['rifle'], melee: ['bat'] },
  cy: { r1: ['pistol', 0x3cf0ff], r2: ['shotgun', 0xff4fd8], r3: ['rifle', 0x7dff5a], melee: ['katana', 0xff3b3b] },
  ct: { r1: ['crossbow'], r2: ['musket'], r3: ['bow'], melee: ['sword'] },
  tt: { r1: ['talisman'], r2: ['gourd'], r3: ['staff', 0x6bb6ff], melee: ['flysword'] },
  sl: { r1: ['pistol', 0x6b5bff], r2: ['crossbow'], r3: ['orb', 0x6b5bff], melee: ['dagger', 0xb46bff] },
};

// ---------- character specs ----------
const HU = o => Object.assign({ type: 'human', scale: 1, bulk: 1, skin: 0xd8a880, hair: 0x2a2018, hairStyle: 'short', shirt: 0x5a5a5a, pants: 0x3a3a40, shoes: 0x2a2018, posture: 'normal' }, o);
const CHAR = {
  md: {
    e: [
      HU({ skin: 0x8a9a78, shirt: 0x3a5a8a, pants: 0x3a3a40, posture: 'zombie', blood: true }),
      HU({ skin: 0xb8b0a0, shirt: 0x9a2020, hat: 'hood', hatC: 0x8a1a1a, pants: 0x303030, bulk: 0.8, posture: 'zombie', hunch: 0.35, blood: true }),
      HU({ skin: 0xc89a8a, shirt: 0xd8d8d0, pants: 0x4a5a3a, hairStyle: 'bald', bulk: 1.75, scale: 1.55, posture: 'zombie', blood: true }),
      HU({ skin: 0x8ab050, shirt: 0x6a8a3a, pants: 0x4a4a3a, belly: 0x9ac040, pustules: 0xb8ff40, bulk: 1.4, posture: 'zombie', hairStyle: 'bald' }),
      HU({ skin: 0x8a9a80, shirt: 0x1e2a50, vest: 0x202020, hat: 'cap', hatC: 0x1a2244, pants: 0x1a2040, posture: 'zombie' }),
      HU({ skin: 0x9a8070, shirt: 0x5a4a3a, belly: 0xff7a20, bellyGlow: true, bulk: 1.45, posture: 'zombie', hairStyle: 'bald' }),
      HU({ skin: 0xd8a8a0, shirt: 0x6a3a40, pants: 0x3a2a2a, hairStyle: 'bald', bulk: 1.9, scale: 2.6, spikes: 0xe8e0c8, tumors: 0x9a4aa8, posture: 'zombie', blood: true }),
    ],
    hero: HU({ shirt: 0x4a5a2a, pants: 0x3a3a2a, backpack: 0x6a4a2a }),
    npc: [
      HU({ skin: 0xe0b090, shirt: 0xb02a2a, pants: 0x2a2a3a, hair: 0x6a4020, hairStyle: 'pony' }),
      HU({ shirt: 0x4a5a2a, pants: 0x3a3a2a, hat: 'beanie', hatC: 0x6a6a6a }),
      HU({ shirt: 0xd88aa8, pants: 0xd88aa8, hair: 0x5a3a20, hairStyle: 'pony', scale: 0.68 }),
      HU({ shirt: 0x8a6a4a, pants: 0x4a4a4a, hair: 0xcccccc, hairStyle: 'short', hunch: 0.15 }),
    ],
  },
  cy: {
    e: [
      HU({ skin: 0x9aa0a8, shirt: 0x2a2a35, pants: 0x1a1a22, eye: 0xff2020, metalArm: 0x7a8088, posture: 'zombie' }),
      HU({ skin: 0xc8d0d8, shirt: 0xb8c0c8, pants: 0xa8b0b8, hairStyle: 'bald', eye: 0x3cf0ff, bulk: 0.8, hunch: 0.25 }),
      HU({ skin: 0x6a6a5a, shirt: 0x5a5a4a, pants: 0x4a4a3a, hairStyle: 'bald', hat: 'visor', hatC: 0xff3030, bulk: 2, scale: 1.6, shoulder: 0xc8a040 }),
      { type: 'hover', body: 0xd0d0d8, accent: 0x2a2a30, lens: 0xff3030, size: 9, height: 34 },
      HU({ skin: 0x2a3a5a, shirt: 0x2a3a5a, pants: 0x1a2a4a, hat: 'visor', hatC: 0x3cf0ff, hairStyle: 'bald', shield: 0x3a4a6a, bulk: 1.2 }),
      { type: 'hover', body: 0xff8a20, accent: 0x3a2a1a, lens: 0xffe060, size: 6, height: 22 },
      { type: 'spider', body: 0x6a6a70, accent: 0x3a3a40, core: 0xff3030, size: 30, scale: 1.25 },
    ],
    hero: HU({ skin: 0xe8b898, hair: 0xff4fd8, hairStyle: 'spiky', shirt: 0x1a1a22, trim: 0x3cf0ff, pants: 0x14141a, metalArm: 0x8a92a0 }),
    npc: [
      HU({ shirt: 0x3a3a4a, pants: 0x2a2a30, hat: 'visor', hatC: 0x3cf0ff, hair: 0xd0d0d8 }),
      HU({ skin: 0xe8c0a0, shirt: 0xe8e8f0, coat: 0xe8e8f0, trim: 0xff4fd8, pants: 0x2a2a30, hair: 0x1a1a1a, hairStyle: 'pony' }),
      HU({ shirt: 0xe8c040, pants: 0x3a3a50, scale: 0.68 }),
      HU({ shirt: 0x5a4a2a, pants: 0x5a4a2a, hair: 0xaaaaaa, hat: 'goggles', hatC: 0x8a6a3a }),
    ],
  },
  ct: {
    e: [
      HU({ skin: 0xc8d0d8, shirt: 0x2a3060, coat: 0x2a3060, trim: 0xc8a040, pants: 0x1a1a30, hat: 'qing', hatC: 0x1a1a1a, talisman: true, posture: 'hop' }),
      HU({ skin: 0xe0e0e0, shirt: 0xd8d8d0, coat: 0xd8d8d0, pants: 0xd8d8d0, hair: 0x0a0a0a, hairStyle: 'long', bulk: 0.8, hunch: 0.5, posture: 'zombie' }),
      HU({ skin: 0x6a3a2a, shirt: 0x8a2020, pants: 0x3a2020, hat: 'ox', hatC: 0xe8e0c8, hairStyle: 'bald', bulk: 1.8, scale: 1.6, weapon: 'axe' }),
      HU({ skin: 0xf0d8c8, shirt: 0xf0e8e0, coat: 0xf0e8e0, trim: 0xc03030, hair: 0xf0f0f0, hairStyle: 'long', hat: 'foxears', hatC: 0xf0f0f0, tails: 0xf4f0ea, castGlow: 0x4da6ff, posture: 'cast' }),
      HU({ skin: 0x8a9098, shirt: 0x4a4a4a, pants: 0x3a3a3a, hat: 'helmet', hatC: 0x5a4a3a, weapon: 'spear', shoulder: 0x5a4a3a }),
      { type: 'lantern', body: 0xd83a2a, accent: 0x2a1a10, glow: 0xffb040, size: 10, height: 26 },
      HU({ skin: 0x5a5050, shirt: 0x2a2a2a, coat: 0x2a2a2a, trim: 0xc8a040, pants: 0x1a1a1a, hat: 'helmet', hatC: 0xc8a040, eye: 0xff6020, bulk: 1.8, scale: 2.6, cape: 0x9a1a1a, weapon: 'halberd', shoulder: 0xc8a040 }),
    ],
    hero: HU({ skin: 0xe0b090, shirt: 0x2a2a5a, coat: 0x2a2a5a, sash: 0xc02020, pants: 0x1e1e40, hairStyle: 'topknot' }),
    npc: [
      HU({ shirt: 0xf0f0e8, coat: 0xf0f0e8, pants: 0xd8d8d0, hairStyle: 'topknot' }),
      HU({ skin: 0xe8c0a0, shirt: 0x8a5a3a, coat: 0x8a5a3a, pants: 0x3a2a1a, hairStyle: 'long', hair: 0x1a1a1a }),
      HU({ shirt: 0x6a7a5a, coat: 0x6a7a5a, pants: 0x4a4a3a, hair: 0xdddddd, beard: 0xdddddd, hunch: 0.2 }),
      HU({ shirt: 0xb07a40, pants: 0x5a4a2a, hairStyle: 'bald', scale: 0.68 }),
    ],
  },
  tt: {
    e: [
      HU({ skin: 0xc0a090, shirt: 0x8a7060, coat: 0x8a7060, pants: 0x5a4a3a, hair: 0x1a1a1a, hairStyle: 'long', blood: true, posture: 'zombie' }),
      { type: 'quad', body: 0x1a1a1e, accent: 0x2a2a30, eye: 0xff2020, size: 1, scale: 1.15 },
      HU({ skin: 0x7a7a6a, shirt: 0x6a6a5a, pants: 0x5a5a4a, hairStyle: 'bald', moss: 0x4a6a3a, bulk: 2, scale: 1.7, rock: true }),
      HU({ skin: 0xd0c0c8, shirt: 0x1a1a22, coat: 0x1a1a22, trim: 0xb46bff, pants: 0x14141a, hair: 0xe0e0e0, hairStyle: 'long', castGlow: 0xb46bff, posture: 'cast' }),
      HU({ skin: 0x8a3a3a, shirt: 0x5a2a2a, pants: 0x3a1a1a, hat: 'horns', hatC: 0x2a1a1a, weapon: 'glaive', shoulder: 0x3a2a2a, bulk: 1.15 }),
      { type: 'toad', body: 0x8ab040, accent: 0x5a7a2a, glow: 0xc8ff40, size: 12 },
      { type: 'serpent', body: 0x5a2a7a, accent: 0x8a4aaa, eye: 0xffd040, size: 30, scale: 1.8 },
    ],
    hero: HU({ skin: 0xf0d0b8, shirt: 0xe8eef8, coat: 0xe8eef8, trim: 0x9ab8e8, pants: 0xd8e0f0, hairStyle: 'long', hair: 0x101010 }),
    npc: [
      HU({ skin: 0xf0d0b8, shirt: 0xf0a8c0, coat: 0xf0a8c0, pants: 0xe8b8c8, hairStyle: 'long' }),
      HU({ shirt: 0x8a8a90, coat: 0x8a8a90, pants: 0x6a6a70, hair: 0xf0f0f0, beard: 0xf0f0f0, hairStyle: 'topknot' }),
      HU({ shirt: 0xb09060, pants: 0x6a5a3a, scale: 0.7, backpack: 0x8a6a3a }),
      HU({ shirt: 0x7a7a7a, coat: 0x7a7a7a, pants: 0x5a5a5a, hairStyle: 'topknot', blood: true, weapon: 'sword' }),
    ],
  },
  sl: {
    e: [
      HU({ skin: 0x5a8a3a, shirt: 0x6a4a2a, pants: 0x5a3a20, hairStyle: 'bald', ears: 0x5a8a3a, scale: 0.75, weapon: 'knife', hunch: 0.25 }),
      { type: 'ant', body: 0x18181c, accent: 0x3a2a2a, eye: 0xff4040, size: 1, scale: 1.25 },
      HU({ skin: 0x5a7a3a, shirt: 0x6a5030, pants: 0x4a3a20, hairStyle: 'bald', tusks: true, bulk: 1.8, scale: 1.6, weapon: 'club' }),
      HU({ skin: 0x9a8aa8, shirt: 0x3a2050, coat: 0x3a2050, trim: 0xb46bff, pants: 0x2a1840, hair: 0xe8e8f0, hairStyle: 'long', ears: 0x9a8aa8, castGlow: 0xb46bff, posture: 'cast' }),
      HU({ skin: 0xe0d8c0, shirt: 0x5a5a60, pants: 0x4a4a50, hairStyle: 'bald', hat: 'helmet', hatC: 0x5a5a60, skeleton: true, shield: 0x6a6a70, weapon: 'sword' }),
      { type: 'slime', body: 0xd02a2a, accent: 0xff7070, glow: 0xff3030, size: 11 },
      HU({ skin: 0x3a0a0a, shirt: 0x8a1a1a, pants: 0x5a0a0a, hat: 'helmet', hatC: 0x8a1a1a, eye: 0xff2020, bulk: 1.9, scale: 2.6, cape: 0x5a0a0a, weapon: 'greatsword', shoulder: 0x2a0a0a }),
    ],
    hero: HU({ skin: 0xe0b898, shirt: 0x1a1a24, coat: 0x1a1a24, trim: 0x4d6bff, pants: 0x14141c, hairStyle: 'spiky', hair: 0x0a0a10, eye: 0x4da6ff }),
    npc: [
      HU({ skin: 0xf0d0b8, shirt: 0xf0f0f0, coat: 0xf0f0f0, trim: 0xd8b040, pants: 0xe0e0e0, hair: 0xf0d870, hairStyle: 'long' }),
      HU({ shirt: 0x5a6a7a, pants: 0x3a4a5a, shield: 0x8a9aaa, bulk: 1.3, hairStyle: 'short' }),
      HU({ shirt: 0xe8e8e8, pants: 0x2a2a3a, tie: 0x8a2020, hair: 0x2a2a2a }),
      HU({ shirt: 0xf0f0f0, pants: 0x2a3a6a, hair: 0x1a1a1a, hairStyle: 'pony', scale: 0.85, tie: 0xc02040 }),
    ],
  },
};

// ---------- rig templates ----------
class Rig {
  constructor() { this.root = new THREE.Object3D(); this.bones = { root: this.root }; this.parts = []; }
  bone(name, parent, x, y, z) { const o = new THREE.Object3D(); o.position.set(x, y, z); this.bones[parent || 'root'].add(o); this.bones[name] = o; return o; }
  part(bone, fn, tag) { GB.start(); fn(GB); const geo = GB.done(); const h = new THREE.Object3D(); this.bones[bone].add(h); this.parts.push({ holder: h, geo, tag }); }
}

function buildHuman(s, realm, isHero) {
  const r = new Rig();
  const B = s.bulk, sc = s.scale;
  const legH = 17, torsoH = 15, hw = 6.5 * B, td = 4.6 * Math.max(0.8, B * 0.9);
  r.root.scale.set(sc, sc, sc);
  r.bone('hips', 'root', 0, legH, 0);
  r.bone('legL', 'hips', 0, 0, -3.4 * Math.min(1.4, B));
  r.bone('legR', 'hips', 0, 0, 3.4 * Math.min(1.4, B));
  r.bone('torso', 'hips', 0, 0, 0);
  r.bone('head', 'torso', 0, torsoH, 0);
  r.bone('armL', 'torso', 0, torsoH - 2, -(hw + 2.4));
  r.bone('armR', 'torso', 0, torsoH - 2, hw + 2.4);
  const legW = 4.6 * Math.min(1.5, B);
  for (const side of ['legL', 'legR']) r.part(side, g => {
    if (s.skeleton) g.box(2.4, legH, 2.4, s.skin, 0, -legH / 2, 0);
    else g.box(legW, legH - 3, legW, s.pants, 0, -legH / 2 + 1.5, 0);
    g.box(legW + 1.6, 3, legW + 0.6, s.shoes, 1, -legH + 1.5, 0);
  });
  r.part('torso', g => {
    if (s.skeleton) { g.box(3, torsoH, 3, s.skin, 0, torsoH / 2, 0); for (let i = 0; i < 4; i++) g.box(td * 0.8, 1.4, hw * 1.7, s.skin, 0, 4 + i * 3, 0); }
    else g.box(td * 1.9, torsoH, hw * 2, s.shirt, 0, torsoH / 2, 0);
    if (s.coat) g.box(td * 2 + 0.6, 10, hw * 2 + 1, s.coat, 0, -2, 0);
    if (s.trim) g.box(td * 2 + 0.8, torsoH - 2, 1.4, s.trim, 0, torsoH / 2, 0);
    if (s.sash) g.box(td * 2 + 0.8, 2.4, hw * 2 + 0.8, s.sash, 0, 2, 0);
    if (s.vest) g.box(td * 2 + 0.8, torsoH - 4, hw * 2 + 0.8, s.vest, 0, torsoH / 2, 0);
    if (s.tie) g.box(0.8, 9, 1.6, s.tie, td + 0.4, torsoH - 6, 0);
    if (s.belly) g.sph(td * 1.3, s.belly, td * 0.6, 5, 0, 1, 0.9, 1.2);
    if (s.pustules) for (let i = 0; i < 6; i++) g.sph(1.6, s.pustules, td * 0.9, 4 + (i % 3) * 4, -5 + i * 2);
    if (s.backpack) g.box(4, 11, hw * 1.6, s.backpack, -td - 2, torsoH / 2 + 1, 0);
    if (s.shoulder) { g.box(td * 2.2, 3, 5, s.shoulder, 0, torsoH, -hw - 1); g.box(td * 2.2, 3, 5, s.shoulder, 0, torsoH, hw + 1); }
    if (s.spikes) for (let i = 0; i < 5; i++) g.cone(1.6, 7, 4, s.spikes, -td - 1, 4 + i * 2.4, -4 + i * 2, 0, 0, Math.PI / 2 + 0.3);
    if (s.tumors) for (let i = 0; i < 4; i++) g.sph(2.4, s.tumors, (i % 2 ? 1 : -1) * td * 0.6, 3 + i * 3, (i - 1.5) * 4);
    if (s.moss) for (let i = 0; i < 5; i++) g.sph(2.2, s.moss, -td + i, torsoH - i * 2.5, (i - 2) * 3, 1, 0.5, 1);
    if (s.cape) g.box(1.2, torsoH + 12, hw * 2.2, s.cape, -td - 1.2, torsoH / 2 - 6, 0, 0, 0, -0.08);
    if (s.tails) for (let i = 0; i < 9; i++) g.cone(2.2, 18, 5, s.tails, -td - 8, 2, (i - 4) * 2.2, 0, 0.0, -Math.PI / 2 + (i - 4) * 0.08);
    if (s.shield) g.box(10, 16, 2, s.shield, 2, torsoH / 2, -hw - 6);
    if (s.blood) for (let i = 0; i < 3; i++) g.box(td * 2 + 0.2, 2, 3, 0x7a0a0a, 0, 3 + i * 4, -3 + i * 3);
    if (s.rock) g.dode(td * 1.4, s.skin, 0, torsoH * 0.6, 0, 1, 1.1, 1.6);
  });
  const headS = 8.6;
  r.part('head', g => {
    if (s.hat === 'ox') { g.box(10, 9, 9, s.skin, 1, 5, 0).box(6, 5, 7, shade(s.skin, 1.3), 6, 3, 0).cone(1.6, 9, 4, s.hatC, 0, 12, -6, 0.6, 0, 0).cone(1.6, 9, 4, s.hatC, 0, 12, 6, -0.6, 0, 0); }
    else if (s.skeleton) { g.box(headS, headS, headS * 0.9, s.skin, 0, headS / 2, 0).box(1, 2, 2, 0x111111, headS / 2, headS / 2 + 1, -2).box(1, 2, 2, 0x111111, headS / 2, headS / 2 + 1, 2); }
    else g.box(headS, headS, headS * 0.95, s.skin, 0, headS / 2 + 0.5, 0);
    const hs = s.hairStyle;
    if (hs !== 'bald' && !s.skeleton) {
      g.box(headS + 0.8, 2.4, headS + 0.6, s.hair, -0.4, headS + 0.6, 0);
      g.box(2, headS * 0.7, headS + 0.6, s.hair, -headS / 2, headS / 2 + 1.5, 0);
      if (hs === 'long') g.box(2.4, 14, headS + 0.4, s.hair, -headS / 2 - 0.6, -2, 0);
      if (hs === 'pony') g.box(3, 9, 3, s.hair, -headS / 2 - 2, 2, 0);
      if (hs === 'topknot') g.sph(2.6, s.hair, -1, headS + 2.6, 0);
      if (hs === 'spiky') for (let i = 0; i < 5; i++) g.cone(1.8, 5, 4, s.hair, -2 + (i % 2) * 2, headS + 2.4, -3 + i * 1.5, 0, 0, 0.5);
    }
    const eye = s.eye || 0x141414;
    if (s.hat !== 'ox') g.box(0.8, 1.4, 1.4, eye, headS / 2 + 0.2, headS / 2 + 1.4, -2).box(0.8, 1.4, 1.4, eye, headS / 2 + 0.2, headS / 2 + 1.4, 2);
    if (s.beard) g.box(3, 5, 6, s.beard, headS / 2 - 0.6, 0, 0);
    if (s.tusks) g.cone(0.8, 3, 4, 0xf0f0e0, headS / 2 + 0.4, 1.6, -2, 0, 0, Math.PI).cone(0.8, 3, 4, 0xf0f0e0, headS / 2 + 0.4, 1.6, 2, 0, 0, Math.PI);
    if (s.ears) { g.cone(1.6, 6, 4, s.ears, 0, headS * 0.6, -headS / 2 - 2, -1.3, 0, 0); g.cone(1.6, 6, 4, s.ears, 0, headS * 0.6, headS / 2 + 2, 1.3, 0, 0); }
    if (s.talisman) g.box(0.6, 7, 3, 0xffd65a, headS / 2 + 0.6, headS / 2 + 1, 0).box(0.7, 3, 1.2, 0xc62828, headS / 2 + 0.8, headS / 2 + 1, 0);
    switch (s.hat) {
      case 'cap': g.box(headS + 1.2, 2.6, headS + 1.2, s.hatC, 0, headS + 1.2, 0).box(4, 0.8, headS, s.hatC, headS / 2 + 1.5, headS + 0.4, 0); break;
      case 'hood': g.box(headS + 2, headS + 2, headS + 2, s.hatC, -1, headS / 2 + 1, 0); g.box(1, headS, headS, s.skin, headS / 2 + 0.5, headS / 2 + 0.5, 0); break;
      case 'beanie': g.box(headS + 1, 3.2, headS + 1, s.hatC, 0, headS + 1, 0); break;
      case 'visor': g.box(1.4, 2.4, headS + 0.6, s.hatC, headS / 2 + 0.4, headS / 2 + 1.5, 0); break;
      case 'goggles': g.box(1.6, 2.4, headS + 0.6, s.hatC, headS / 2 + 0.4, headS / 2 + 2, 0); break;
      case 'qing': g.cyl(headS * 0.75, headS * 0.75, 3, 8, s.hatC, 0, headS + 1.4, 0).sph(1.4, 0xc62828, 0, headS + 3.6, 0); break;
      case 'helmet': g.box(headS + 1.6, headS * 0.6, headS + 1.6, s.hatC, -0.4, headS * 0.85, 0).cone(1.2, 5, 4, s.hatC, -1, headS + 3.6, 0); break;
      case 'horns': g.cone(1.4, 8, 4, s.hatC, 0, headS + 3, -3.2, 0.5, 0, 0).cone(1.4, 8, 4, s.hatC, 0, headS + 3, 3.2, -0.5, 0, 0); break;
      case 'foxears': g.cone(2, 5, 4, s.hatC, 0, headS + 2.4, -3, 0.3, 0, 0).cone(2, 5, 4, s.hatC, 0, headS + 2.4, 3, -0.3, 0, 0); break;
      case 'conical': g.cone(headS * 1.3, 5, 10, 0xc8a870, 0, headS + 2, 0); break;
    }
  });
  const armW = 3.8 * Math.min(1.6, B);
  for (const side of ['armL', 'armR']) r.part(side, g => {
    const metal = s.metalArm && side === 'armL';
    if (s.skeleton) g.box(2.2, 13, 2.2, s.skin, 0, -6.5, 0);
    else g.box(armW, 13, armW, metal ? s.metalArm : (s.coat || s.shirt), 0, -6.5, 0);
    g.box(armW - 0.4, 3, armW - 0.4, metal ? shade(s.metalArm, 1.2) : s.skin, 0, -14, 0);
    if (s.castGlow) g.sph(2.6, s.castGlow, 0, -16.5, 0);
  });
  // held weapons
  const hand = (fn, tag) => r.part('armR', g => { fn(g); }, tag);
  if (isHero) {
    const W = REALM_WEAPONS[realm];
    for (const slot of SLOT_ORDER) hand(g => { GB.parts = []; const tmp = []; buildWeapon(g, W[slot][0], W[slot][1]); for (const p of g.parts) p.applyMatrix4(GB.mat(0, -15, 0, 0, 0, -Math.PI / 2)); }, slot);
  } else if (s.weapon) hand(g => { buildWeapon(g, s.weapon); for (const p of g.parts) p.applyMatrix4(GB.mat(0, -15, 0, 0, 0, -Math.PI / 2)); }, 'weapon');
  r.spec = s; r.kind = 'human'; r.height = (legH + torsoH + headS) * sc;
  return r;
}

function buildQuad(s) { // wolf
  const r = new Rig(); const b = s.body;
  r.bone('body', 'root', 0, 13, 0);
  r.bone('head', 'body', 12, 3, 0);
  r.bone('tail', 'body', -12, 2, 0);
  const legs = [['lf', 8, -4], ['rf', 8, 4], ['lb', -8, -4], ['rb', -8, 4]];
  for (const [n, x, z] of legs) r.bone(n, 'body', x, -2, z);
  r.part('body', g => g.box(26, 10, 10, b, 0, 0, 0).box(10, 4, 11, s.accent, 4, 5, 0));
  r.part('head', g => g.box(10, 8, 8, b, 3, 1, 0).box(7, 4, 5, b, 10, -1, 0).cone(1.6, 5, 4, b, 0, 7, -3).cone(1.6, 5, 4, b, 0, 7, 3).box(1, 1.4, 1.4, s.eye, 8, 3, -2.4).box(1, 1.4, 1.4, s.eye, 8, 3, 2.4).box(4, 1, 4, 0xf0f0f0, 12, -3, 0));
  r.part('tail', g => g.box(12, 3, 3, b, -6, 2, 0, 0, 0, 0.4));
  for (const [n] of legs) r.part(n, g => g.box(3.6, 12, 3.6, b, 0, -6, 0));
  r.kind = 'quad'; r.legs = legs.map(l => l[0]); r.height = 22; r.spec = s;
  return r;
}
function buildAnt(s) {
  const r = new Rig();
  r.bone('body', 'root', 0, 10, 0); r.bone('head', 'body', 13, 2, 0);
  const legs = [];
  for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) { const n = 'l' + i + sd; legs.push(n); r.bone(n, 'body', 4 - i * 5, -1, sd * 5); }
  r.part('body', g => g.sph(6, s.body, 4, 0, 0, 1.2, 0.8, 0.9).sph(8, s.body, -9, 2, 0, 1.4, 0.9, 1).sph(2, s.accent, -9, 8, 0));
  r.part('head', g => g.sph(5, s.body, 2, 0, 0).cone(1.2, 8, 4, s.accent, 8, -1, -3, 0, 0.4, -Math.PI / 2).cone(1.2, 8, 4, s.accent, 8, -1, 3, 0, -0.4, -Math.PI / 2).box(1, 1.4, 1.4, s.eye, 6, 2, -2.4).box(1, 1.4, 1.4, s.eye, 6, 2, 2.4).box(1, 10, 1, s.body, 2, 7, -2, 0.3, 0, -0.4).box(1, 10, 1, s.body, 2, 7, 2, -0.3, 0, -0.4));
  for (const n of legs) { const sd = n.endsWith('-1') ? -1 : 1; r.part(n, g => g.box(1.6, 1.6, 12, s.body, 0, -2, sd * 6, sd * 0.5, 0, 0)); }
  r.kind = 'ant'; r.legs = legs; r.height = 18; r.spec = s;
  return r;
}
function buildHover(s, kind) {
  const r = new Rig();
  r.bone('body', 'root', 0, s.height, 0);
  if (kind === 'lantern') r.part('body', g => g.cyl(s.size * 0.8, s.size * 0.8, s.size * 1.8, 8, s.body, 0, 0, 0).cyl(s.size * 0.5, s.size * 0.6, 2, 8, s.accent, 0, s.size, 0).cyl(s.size * 0.6, s.size * 0.5, 2, 8, s.accent, 0, -s.size, 0).sph(s.size * 0.45, s.glow, 2, 0, 0).box(2, 3, 2, 0x111111, s.size * 0.75, 2, -2.5).box(2, 3, 2, 0x111111, s.size * 0.75, 2, 2.5).box(2, 1.5, 5, 0x111111, s.size * 0.78, -2.5, 0));
  else r.part('body', g => g.sph(s.size, s.body, 0, 0, 0, 1, 0.8, 1).torus(s.size * 1.1, 1.2, s.accent, 0, 0, 0, Math.PI / 2, 0, 0).sph(s.size * 0.4, s.lens, s.size * 0.85, 0, 0).box(2, 2, s.size * 3, s.accent, -2, s.size * 0.7, 0));
  r.kind = 'hover'; r.height = s.height + s.size; r.spec = s;
  return r;
}
function buildBlob(s, kind) {
  const r = new Rig();
  r.bone('body', 'root', 0, s.size * 0.8, 0);
  if (kind === 'toad') r.part('body', g => { g.sph(s.size, s.body, 0, 0, 0, 1.2, 0.8, 1.1); for (let i = 0; i < 6; i++) g.sph(2, s.glow, Math.cos(i) * s.size * 0.7, s.size * 0.5, Math.sin(i * 1.7) * s.size * 0.6); g.box(4, 2, 4, 0xffe040, s.size, 2, -4).box(4, 2, 4, 0xffe040, s.size, 2, 4).box(5, 4, 4, s.accent, 4, -s.size * 0.6, -s.size).box(5, 4, 4, s.accent, 4, -s.size * 0.6, s.size); });
  else r.part('body', g => g.sph(s.size, s.body, 0, 0, 0, 1, 0.8, 1, 2).sph(s.size * 0.5, s.accent, 2, s.size * 0.3, 0, 1, 0.7, 1).box(1.4, 3, 2, 0x111111, s.size * 0.9, 2, -3).box(1.4, 3, 2, 0x111111, s.size * 0.9, 2, 3));
  r.kind = 'blob'; r.height = s.size * 1.6; r.spec = s;
  return r;
}
function buildSpider(s) {
  const r = new Rig();
  r.bone('body', 'root', 0, 26, 0);
  const legs = [];
  for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) { const n = 'l' + i + sd; legs.push(n); r.bone(n, 'body', 14 - i * 9, 0, sd * 14); }
  r.part('body', g => g.sph(22, s.body, 0, 0, 0, 1.3, 0.6, 1.1).sph(8, s.core, 22, 2, 0).box(30, 6, 6, s.accent, 22, 8, -12).box(30, 6, 6, s.accent, 22, 8, 12).cyl(2.4, 2.4, 14, 6, 0x3cf0ff, 38, 8, -12, 0, 0, Math.PI / 2).cyl(2.4, 2.4, 14, 6, 0x3cf0ff, 38, 8, 12, 0, 0, Math.PI / 2));
  for (const n of legs) { const sd = n.endsWith('-1') ? -1 : 1; r.part(n, g => g.box(4, 4, 26, s.accent, 0, 6, sd * 13, sd * -0.5, 0, 0).box(4, 30, 4, s.body, 0, -8, sd * 26)); }
  r.kind = 'spider'; r.legs = legs; r.height = 52; r.spec = s;
  return r;
}
function buildSerpent(s) {
  const r = new Rig();
  r.bone('body', 'root', 0, 0, 0);
  r.part('body', g => { for (let i = 0; i < 4; i++) g.torus(26 - i * 5, 7 - i * 0.6, i % 2 ? s.accent : s.body, 0, 6 + i * 10, 0, Math.PI / 2, 0, 0); });
  r.necks = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 1.4 - Math.PI * 0.7;
    const n = 'n' + i;
    r.bone(n, 'body', Math.cos(a) * 10, 40, Math.sin(a) * 16);
    r.bone('h' + i, n, 0, 34, 0);
    r.part(n, g => g.cyl(3.2, 4.4, 36, 6, s.body, 0, 17, 0));
    r.part('h' + i, g => g.box(12, 7, 8, s.accent, 4, 2, 0).box(1.2, 1.6, 1.6, s.eye, 9, 4, -2.6).box(1.2, 1.6, 1.6, s.eye, 9, 4, 2.6).cone(1, 5, 4, 0xf0f0e0, 6, 6, 0, 0, 0, -0.6));
    r.necks.push({ n, a });
  }
  r.kind = 'serpent'; r.height = 90; r.spec = s;
  return r;
}
function buildRig(spec, realm, isHero) {
  switch (spec.type) {
    case 'human': return buildHuman(spec, realm, isHero);
    case 'quad': return buildQuad(spec);
    case 'ant': return buildAnt(spec);
    case 'hover': return buildHover(spec, 'drone');
    case 'lantern': return buildHover(spec, 'lantern');
    case 'toad': return buildBlob(spec, 'toad');
    case 'slime': return buildBlob(spec, 'slime');
    case 'spider': return buildSpider(spec);
    case 'serpent': return buildSerpent(spec);
  }
}

// ---------- posing ----------
function poseRig(r, e, o) {
  const B = r.bones;
  const t = e.walkT || 0;
  const spd = o.moving ?? 1;
  B.root.position.set(e.x, 0, e.y);
  B.root.rotation.set(0, -(o.angle ?? e.angle ?? 0), 0);
  let fall = 0, sink = 0;
  if (e.dead) { const k = Math.min(1, (e.dying || 0) / 0.45); fall = k * 1.45; sink = k * 4; }
  if (o.downed) fall = 1.45;
  if (e.rise > 0) sink = (e.rise / 0.5) * r.height;
  const base = r.root.scale.x;
  r.root.position.y = -sink;
  B.root.rotation.z = fall; // falls backwards
  const lunge = e.lunge || 0, hit = e.hitT > 0 ? 1 : 0;
  if (r.kind === 'human') {
    const s = r.spec;
    const sw = Math.sin(t) * 0.75 * spd;
    let hop = 0;
    if (s.posture === 'hop') { hop = Math.abs(Math.sin(t * 0.8)) * 9 * spd; B.legL.rotation.z = B.legR.rotation.z = 0; }
    else { B.legL.rotation.z = sw; B.legR.rotation.z = -sw; }
    B.hips.position.y = 17 + hop + Math.abs(Math.cos(t)) * 0.8 * spd;
    B.torso.rotation.z = -(s.hunch || 0) - lunge * 0.25 + hit * 0.2;
    B.head.rotation.z = (s.hunch || 0) * 0.6;
    B.head.rotation.y = Math.sin(t * 0.37) * 0.15;
    const zombie = s.posture === 'zombie' || s.posture === 'hop';
    if (o.aim) { // player / armed ally aiming
      B.armR.rotation.set(0, 0, Math.PI / 2 - (o.recoil || 0) * 0.3);
      B.armL.rotation.set(o.twoHand ? 0.5 : 0, 0, o.twoHand ? Math.PI / 2 - 0.1 : -sw * 0.6);
      if (o.swing != null) { B.armR.rotation.set(0, 0, o.swing); }
      if (o.reload) B.armR.rotation.z = 0.8;
    } else if (zombie) {
      const reach = Math.PI / 2 + Math.sin(t * 0.5) * 0.12 + lunge * 0.35;
      B.armL.rotation.set(0.12, 0, reach); B.armR.rotation.set(-0.12, 0, reach + Math.sin(t * 0.6) * 0.1);
    } else if (s.posture === 'cast') {
      const c = 1.2 + lunge * 0.5 + Math.sin(t * 0.7) * 0.1;
      B.armL.rotation.set(0.3, 0, c); B.armR.rotation.set(-0.3, 0, c);
    } else if (s.weapon) {
      B.armR.rotation.set(0, 0, 0.9 + lunge * 1.4 - Math.sin(lunge * Math.PI) * 2.4);
      B.armL.rotation.set(0, 0, sw * 0.7);
    } else { B.armL.rotation.set(0, 0, sw * 0.8); B.armR.rotation.set(0, 0, -sw * 0.8); }
    if (o.cower) { B.armL.rotation.set(0.6, 0, 2.6); B.armR.rotation.set(-0.6, 0, 2.6); B.torso.rotation.z = -0.5; }
  } else if (r.kind === 'quad' || r.kind === 'ant' || r.kind === 'spider') {
    const legs = r.legs;
    legs.forEach((n, i) => { const ph = (i % 2 ? 1 : -1) * ((i >> 1) % 2 ? 1 : -1); B[n].rotation.z = Math.sin(t * 1.2) * 0.6 * ph * spd; if (r.kind !== 'quad') B[n].rotation.x = Math.cos(t * 1.2) * 0.2 * ph * spd; });
    B.body.position.y = (r.kind === 'spider' ? 26 : r.kind === 'ant' ? 10 : 13) + Math.abs(Math.sin(t * 1.2)) * 1.5;
    if (B.head) B.head.rotation.z = -lunge * 0.5 + Math.sin(t * 0.5) * 0.1;
    if (B.tail) B.tail.rotation.y = Math.sin(t * 2) * 0.5;
    B.body.rotation.z = -lunge * 0.2;
  } else if (r.kind === 'hover') {
    B.body.position.y = r.spec.height + Math.sin((e.walkT || 0) * 0.4 + (e.id || 0)) * 3;
    B.body.rotation.z = -lunge * 0.4 + Math.sin(t * 0.3) * 0.1; B.body.rotation.x = Math.sin(t * 0.23) * 0.15;
  } else if (r.kind === 'blob') {
    const sq = Math.sin(t * 1.4);
    B.body.position.y = r.spec.size * 0.8 + Math.max(0, sq) * 6;
    B.body.scale.set(1 + sq * 0.12 + lunge * 0.2, 1 - sq * 0.15, 1 + sq * 0.12);
  } else if (r.kind === 'serpent') {
    r.necks.forEach((nk, i) => { B[nk.n].rotation.set(-Math.sin(nk.a) * 0.75 + Math.sin(t * 0.3 + i) * 0.15, 0, -0.25 - Math.cos(nk.a) * 0.15 + Math.sin(t * 0.4 + i * 0.7) * 0.18 - lunge * 0.5); B['h' + i].rotation.z = -0.9 + Math.sin(t + i) * 0.25; });
  }
}

// ---------- static props ----------
function propModel(img, w, h, col) {
  const c = col, d = shade(col, 0.7), l = shade(col, 1.25);
  const g = GB.start();
  const n = img;
  const L = Math.max(w, h), S = Math.min(w, h);
  const has = re => re.test(n);
  if (has(/^car_|cy_p_4|cy_p_5/)) {
    const hover = n.startsWith('cy');
    g.box(L * 0.95, 10, S * 0.86, c, 0, hover ? 12 : 9, 0).box(L * 0.5, 9, S * 0.74, d, -L * 0.06, hover ? 21 : 18, 0).box(L * 0.18, 7, S * 0.7, 0x1a2a3a, L * 0.2, hover ? 20 : 17, 0, 0, 0, 0.5);
    if (hover) { g.box(L * 0.8, 2, S * 0.9, n === 'cy_p_4' ? 0xff4fd8 : 0x3cf0ff, 0, 5, 0); }
    else for (const [x, z] of [[0.32, 0.43], [-0.32, 0.43], [0.32, -0.43], [-0.32, -0.43]]) g.cyl(5, 5, 3, 8, 0x111111, L * x, 5, S * z, Math.PI / 2, 0, 0);
    if (n === 'car_police') g.box(4, 3, S * 0.5, 0x2050ff, -L * 0.06, 24, -4).box(4, 3, S * 0.4, 0xff2020, -L * 0.06, 24, 6);
    if (n === 'car_burnt') g.box(L * 0.95, 1, S * 0.86, 0x1a1a1a, 0, 14.6, 0);
    return GB.done();
  }
  if (has(/^(bus|truck)$/)) { g.box(L * 0.97, 30, S * 0.86, c, 0, 20, 0).box(L * 0.9, 6, S * 0.88, 0x2a3a4a, 0, 26, 0); for (let i = -2; i <= 2; i++) g.cyl(6, 6, S * 0.9, 8, 0x111111, i * L * 0.18, 6, 0, Math.PI / 2, 0, 0); return GB.done(); }
  if (has(/ct_p_6/)) { g.box(L * 0.6, 8, S * 0.8, c, -L * 0.1, 12, 0).cyl(8, 8, S, 8, 0x4a3018, -L * 0.1, 8, 0, Math.PI / 2, 0, 0).box(L * 0.5, 2, 2, 0x6a4428, L * 0.3, 10, -S * 0.3).box(L * 0.5, 2, 2, 0x6a4428, L * 0.3, 10, S * 0.3); return GB.done(); }
  if (has(/barrel|cy_p_2|sl_p_7|firebarrel/)) { g.cyl(S * 0.42, S * 0.42, 24, 10, c, 0, 12, 0).torus(S * 0.42, 1, d, 0, 6, 0, Math.PI / 2).torus(S * 0.42, 1, d, 0, 18, 0, Math.PI / 2); if (n === 'firebarrel') g.sph(5, 0xff8a20, 0, 25, 0); return GB.done(); }
  if (has(/ct_p_0/)) { g.sph(S * 0.45, c, 0, 12, 0, 1, 1.1, 1).cyl(S * 0.3, S * 0.25, 6, 10, l, 0, 24, 0); return GB.done(); }
  if (has(/tt_p_3|ct_p_8/)) { g.sph(S * 0.42, 0x8a6a2a, 0, 12, 0, 1, 0.8, 1).cyl(S * 0.45, S * 0.38, 4, 10, 0x6a4a1a, 0, 20, 0); for (let i = 0; i < 3; i++) g.cyl(1.5, 1.5, 8, 4, 0x5a3a10, Math.cos(i * 2.1) * S * 0.3, 3, Math.sin(i * 2.1) * S * 0.3); g.sph(4, n === 'tt_p_3' ? 0x5aff8a : 0xffd0a0, 0, 23, 0); return GB.done(); }
  if (has(/^(crate|ammocrate)$|cy_p_6|ct_p_1|tt_p_5|sl_p_0|fx_3|cy_p_1/)) {
    const H = n === 'cy_p_1' ? 30 : 20;
    g.box(w * 0.9, H, h * 0.9, c, 0, H / 2, 0).box(w * 0.94, 2, h * 0.94, d, 0, H * 0.25, 0).box(w * 0.94, 2, h * 0.94, d, 0, H * 0.8, 0);
    if (/tt_p_5|sl_p_0|fx_3|ct_p_1/.test(n)) g.box(w * 0.95, 5, h * 0.95, d, 0, H + 2, 0).box(3, 4, 3, 0xffd65a, w * 0.46, H * 0.7, 0);
    if (n === 'cy_p_1') for (let i = 0; i < 4; i++) g.box(1, 1, h * 0.7, i % 2 ? 0x3cf0ff : 0x7dff5a, w * 0.46, 6 + i * 6, 0);
    return GB.done();
  }
  if (has(/dumpster|cy_p_11/)) { g.box(w * 0.92, 24, h * 0.9, c, 0, 12, 0).box(w * 0.96, 3, h * 0.96, d, -1, 25, 0); if (n === 'cy_p_11') g.box(2, 3, 8, 0x3cf0ff, w * 0.46, 18, 0); return GB.done(); }
  if (n === 'trash' || n === 'ct_p_5') { if (n === 'ct_p_5') g.cone(S * 0.5, 30, 8, 0xd8b050, 0, 15, 0); else for (let i = 0; i < 4; i++) g.sph(S * 0.24, 0x1a1a1c, Math.cos(i * 1.6) * S * 0.2, 7 + (i % 2) * 5, Math.sin(i * 1.6) * S * 0.2, 1, 0.8, 1); return GB.done(); }
  if (has(/fence|ct_p_10|cy_p_10/)) { const metal = n === 'cy_p_10'; g.box(L * 0.95, metal ? 18 : 3, metal ? 3 : 2, c, 0, metal ? 9 : 16, 0); if (!metal) { g.box(L * 0.95, 3, 2, c, 0, 8, 0); for (let i = -1; i <= 1; i++) g.box(3, 22, 3, d, i * L * 0.42, 11, 0); } else g.box(L * 0.9, 4, 3.4, 0xe8c020, 0, 12, 0); if (h > w) return rotGeo(GB.done()); return GB.done(); }
  if (n === 'sandbags') { for (let r0 = 0; r0 < 2; r0++) for (let i = 0; i < 4; i++) g.sph(L * 0.14, 0xa89a6a, (i - 1.5 + r0 * 0.5) * L * 0.23, 5 + r0 * 8, 0, 1.4, 0.6, 1.1); return GB.done(); }
  if (n === 'barrier') { g.box(L * 0.95, 8, S * 0.8, 0xb8b8b0, 0, 4, 0).box(L * 0.95, 10, S * 0.45, 0xa8a8a0, 0, 13, 0); return GB.done(); }
  if (has(/bench|tt_p_11/)) { g.box(L * 0.9, 2, S * 0.7, c, 0, 9, 0).box(L * 0.9, 8, 2, c, 0, 14, -S * 0.3); for (const x of [-0.4, 0.4]) g.box(2, 9, S * 0.6, d, x * L, 4.5, 0); return GB.done(); }
  if (has(/vending|cy_p_0|cy_p_8|cy_p_9/)) { g.box(w * 0.85, 46, h * 0.85, c, 0, 23, 0).box(1, 30, h * 0.6, n === 'vending' ? 0x6ac8ff : 0xff4fd8, w * 0.43, 28, 0); return GB.done(); }
  if (has(/^tent$|cy_p_7|ct_p_7/)) { const stall = n !== 'tent'; if (stall) { g.box(w * 0.8, 14, h * 0.6, 0x6a4a2a, 0, 7, 0); g.cone(L * 0.6, 14, 4, n === 'cy_p_7' ? 0xff4fd8 : 0xc8a050, 0, 34, 0, 0, Math.PI / 4, 0); for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) g.cyl(1, 1, 30, 4, 0x3a2a1a, x * w * 0.35, 15, z * h * 0.3); } else g.cone(L * 0.55, 34, 4, c, 0, 17, 0, 0, Math.PI / 4, 0); return GB.done(); }
  if (has(/rock|tt_p_10/)) { if (n === 'rocks') for (let i = 0; i < 4; i++) g.dode(S * 0.2, i % 2 ? c : l, Math.cos(i * 2) * S * 0.25, 4, Math.sin(i * 2) * S * 0.25); else g.dode(S * 0.45, c, 0, S * 0.3, 0, 1, 0.75, 1); return GB.done(); }
  if (has(/ct_p_3/)) { g.box(16, 6, 16, 0x8a8a8a, 0, 3, 0).sph(8, 0x9a9a9a, 0, 14, 0, 1, 1.2, 0.9).sph(5, 0x9a9a9a, 4, 24, 0); return GB.done(); }
  if (has(/ct_p_4/)) { g.cyl(S * 0.42, S * 0.42, 12, 10, 0x8a8a80, 0, 6, 0).cyl(S * 0.3, S * 0.3, 12.5, 10, 0x1a3a4a, 0, 6.5, 0).box(2, 30, 2, 0x5a3a1a, -S * 0.4, 15, 0).box(2, 30, 2, 0x5a3a1a, S * 0.4, 15, 0).box(S * 0.9, 3, 4, 0x6a4a2a, 0, 30, 0); return GB.done(); }
  if (has(/tt_p_2|sl_p_6/)) { g.box(w * 0.85, 18, h * 0.6, c, 0, 9, 0).box(w * 0.9, 3, h * 0.65, l, 0, 19, 0).cyl(1, 1, 6, 4, 0xffe0a0, 0, 23, 0); return GB.done(); }
  if (has(/tt_p_4|sl_p_4/)) { g.box(S * 0.6, 46, S * 0.4, c, 0, 23, 0).box(S * 0.75, 4, S * 0.55, d, 0, 2, 0); return GB.done(); }
  if (has(/tt_p_1|sl_p_3/)) { for (let i = 0; i < 5; i++) g.cone(3 + i % 2 * 2, 14 + i * 3, 5, i % 2 ? 0x6ac8ff : 0x3a8aff, Math.cos(i * 1.3) * 6, 7 + i, Math.sin(i * 1.3) * 6, Math.cos(i) * 0.3, 0, Math.sin(i) * 0.3); return GB.done(); }
  if (has(/tt_p_0/)) { for (let i = 0; i < 6; i++) g.cone(1.5, 12, 4, 0x3aa86a, Math.cos(i) * 4, 6, Math.sin(i) * 4, Math.cos(i) * 0.5, 0, Math.sin(i) * 0.5); g.sph(2.5, 0x9affff, 0, 12, 0); return GB.done(); }
  if (has(/sl_p_2/)) { for (let i = 0; i < 4; i++) g.box(12, 2, 2, 0xe0d8c0, Math.cos(i) * 5, 1 + i, Math.sin(i * 2) * 5, 0, i, 0); g.sph(4, 0xe8e0d0, 0, 4, 0); return GB.done(); }
  if (has(/fx_6|sl_p_8/)) { g.box(w * 0.85, 2, h * 0.85, 0x3a3a3a, 0, 1, 0).box(w * 0.85, 2, h * 0.85, 0x3a3a3a, 0, 34, 0); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.cyl(0.8, 0.8, 34, 4, 0x5a5a5a, Math.cos(a) * w * 0.42, 17, Math.sin(a) * h * 0.42); } return GB.done(); }
  if (has(/tt_p_6/)) { g.cyl(S * 0.45, S * 0.45, 1, 12, 0x3a8a3a, 0, 1, 0).sph(4, 0xf0a0c0, 0, 4, 0); return GB.done(); }
  return null;
}
function rotGeo(geo) { geo.applyMatrix4(GB.mat(0, 0, 0, 0, Math.PI / 2, 0)); return geo; }
// trees: canopy / trunk built per tree type
function treeModel(img, w, col) {
  const g = GB.start();
  const R0 = w * 0.42;
  if (/pine|tt_p_9/.test(img)) { g.cyl(3, 4.5, 30, 6, 0x4a3420, 0, 15, 0); const c = img === 'tt_p_9' ? 0x6a8a7a : shade(col, 0.9); for (let i = 0; i < 4; i++) g.cone(R0 * (1 - i * 0.2), 30, 7, i % 2 ? c : shade(c, 1.15), 0, 34 + i * 16, 0); if (img === 'tt_p_9') for (let i = 0; i < 6; i++) g.sph(4, 0xf0f0f0, Math.cos(i) * R0 * 0.5, 40 + i * 6, Math.sin(i) * R0 * 0.5, 1, 0.5, 1); }
  else if (/dead/.test(img)) { g.cyl(2.4, 4, 50, 5, 0x3a2a1e, 0, 25, 0); for (let i = 0; i < 5; i++) { const a = i * 1.3; g.cyl(0.8, 1.6, 26, 4, 0x3a2a1e, Math.cos(a) * 8, 44 + i * 3, Math.sin(a) * 8, Math.sin(a) * 0.9, 0, Math.cos(a) * 0.9); } }
  else if (/ct_p_9/.test(img)) { for (let i = 0; i < 6; i++) { const x = Math.cos(i * 2.3) * 6, z = Math.sin(i * 2.3) * 6; g.cyl(1.4, 1.6, 60 + i * 4, 5, 0x6a9a3a, x, 30 + i * 2, z); g.cone(4, 14, 4, 0x4a8a2a, x, 64 + i * 4, z); } }
  else {
    g.cyl(3.4, 5, 40, 6, 0x4a3420, 0, 20, 0);
    const pink = /ct_p_11|tt_p_8/.test(img), autumn = /autumn/.test(img);
    const base = pink ? 0xf0a0c0 : autumn ? 0xd07a2a : shade(col, 1);
    for (let i = 0; i < 7; i++) { const a = i * 0.9; const rr = i ? R0 * 0.55 : 0; g.dode(R0 * (i ? 0.55 : 0.75), i % 2 ? base : shade(base, 1.18), Math.cos(a) * rr, 48 + (i ? 6 : 10) + (i % 3) * 4, Math.sin(a) * rr); }
  }
  return GB.done();
}
