"""Round 22 (v22 art): cut the sheets from make_prompts22.SHEETS into named sprites, pack the atlases
assets/img/atlas22_{mod,tt,common}.png (one PNG per group; a group is split into _1, _2, ... only when it would be
taller than 4096 px or bigger than 8 MB), copy the seamless textures to assets/img/tex22_*.png (256 px; tex22_roofdmg
keeps its alpha channel), and write js/atlas22.js.

js/atlas22.js registers ATLAS6 entries (sliced by the v6.js loader like atlas21) and hooks realmImages:
  md, sl -> the mod atlases + the common atlases ; tt -> the tt atlases + the common atlases ; tex22_* loose files for every realm.
Only what was built gets registered, so a missing sheet means nothing is requested and nothing warns.
With no sheets in assets/raw the JS is an empty stub that still parses.

python tools/build22.py
"""
import os, sys, io, json, glob
import numpy as np
from PIL import Image
from scipy import ndimage

H = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, H)
import process
from process import key_magenta, fit, seamless
from make_prompts22 import SHEETS, TEXTURES, group_of

RAW, OUT = process.RAW, process.OUT
JS_OUT = os.path.join(H, '..', 'js', 'atlas22.js')
ATLAS_W = 2048          # px per atlas row (limit 4096)
MAX_H = 4096            # px, tallest atlas before a group is split
MAX_BYTES = 8 * 1024 * 1024
MIN_AREA = 1500         # raw px; smaller specks are dropped


def parts(sheet, dilate):
    """Connected components of one magenta sheet, trimmed and in reading order (rows by centre y, then x)."""
    a = np.asarray(key_magenta(Image.open(os.path.join(RAW, sheet + '.png')))).copy()
    a[..., 3] = np.where(a[..., 3] >= 128, 255, 0)
    m = a[..., 3] > 0
    lab, _ = ndimage.label(ndimage.binary_dilation(m, iterations=dilate))
    objs = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        keep = (lab[sl] == i + 1) & m[sl]
        if keep.sum() < MIN_AREA:
            continue
        ys, xs = np.nonzero(keep)
        y0, y1 = ys.min() + sl[0].start, ys.max() + sl[0].start + 1
        x0, x1 = xs.min() + sl[1].start, xs.max() + sl[1].start + 1
        crop = a[y0:y1, x0:x1].copy()
        crop[..., 3] = np.where((lab[y0:y1, x0:x1] == i + 1) & (crop[..., 3] > 0), 255, 0)
        objs.append(((y0 + y1) / 2, (x0 + x1) / 2, y1 - y0, Image.fromarray(crop)))
    objs.sort(key=lambda o: o[0])
    rows, cur = [], []
    for o in objs:
        if cur and abs(o[0] - np.mean([c[0] for c in cur])) > 0.45 * max(c[2] for c in cur):
            rows.append(cur)
            cur = []
        cur.append(o)
    if cur:
        rows.append(cur)
    return [o[3] for r in rows for o in sorted(r, key=lambda o: o[1])]


def slice_sheet(sh):
    """Try the sheet's own dilation first, then the fallbacks, until the piece count matches the table."""
    want = len(sh['items'])
    tries = [sh['dilate']] + [d for d in (16, 14, 12, 10, 8, 6, 5, 4) if d != sh['dilate']]
    found = []
    for d in tries:
        found = parts(sh['name'], d)
        if len(found) == want:
            return found
    print('!!', sh['name'], 'found', len(found), 'pieces, expected', want, '(no dilation matched; sheet skipped)')
    return None


def pack(sprites):
    """Shelf-pack (name, image) pairs into one ATLAS_W wide sheet; returns (image, {name: [x, y, w, h]})."""
    x = y = rowh = 0
    pos = {}
    for n, im in sorted(sprites, key=lambda t: -t[1].height):
        if x + im.width > ATLAS_W:
            x, y, rowh = 0, y + rowh + 2, 0
        pos[n] = [x, y, im.width, im.height]
        x += im.width + 2
        rowh = max(rowh, im.height)
    sheet = Image.new('RGBA', (ATLAS_W, y + rowh))
    for n, im in sprites:
        sheet.paste(im, (pos[n][0], pos[n][1]))
    return sheet, pos


def encode(im):
    buf = io.BytesIO()
    im.save(buf, 'PNG', optimize=True)
    return buf.getvalue()


def pack_bins(sprites):
    """Pack one group; halve it (recursively) while the atlas is too tall or too big. Returns [(pos, png_bytes)]."""
    sheet, pos = pack(sprites)
    data = encode(sheet)
    if (sheet.height <= MAX_H and len(data) <= MAX_BYTES) or len(sprites) == 1:
        return [(pos, data)]
    mid = len(sprites) // 2
    return pack_bins(sprites[:mid]) + pack_bins(sprites[mid:])


def seamless_rgba(name, size=256, crop=0.86):
    """Like process.seamless, but keeps alpha: magenta is keyed out first and the blend runs on premultiplied colour."""
    im = key_magenta(Image.open(os.path.join(RAW, name + '.png')))
    w, h = im.size
    c = int(min(w, h) * crop)
    im = im.crop(((w - c) // 2, (h - c) // 2, (w - c) // 2 + c, (h - c) // 2 + c)).resize((512, 512), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32)
    a[..., :3] *= a[..., 3:4] / 255
    rolled = np.roll(np.roll(a, 256, 0), 256, 1)
    y, x = np.mgrid[0:512, 0:512]
    d = np.maximum(np.abs(x - 255.5), np.abs(y - 255.5)) / 256
    wgt = np.clip((0.95 - d) / 0.35, 0, 1)[..., None]
    out = np.clip(a * wgt + rolled * (1 - wgt), 0, 255).astype(np.uint8)
    o = np.asarray(Image.fromarray(out).resize((size, size), Image.BOX)).astype(np.float32)
    al = o[..., 3:4]
    rgb = np.where(al > 0, o[..., :3] * 255 / np.maximum(al, 1), 0)
    res = np.concatenate([np.clip(rgb, 0, 255), al], axis=2).astype(np.uint8)
    Image.fromarray(res).save(os.path.join(OUT, name + '.png'), optimize=True)


def write_js(atlases, bins, tex):
    lines = [
        '// atlas22: generated by tools/build22.py (round 22: monsters, zombies, Demon Generals, mechanic props, ruins,',
        '// buildings, icons, crystals, furniture, terrain, textures)',
        '// An atlas is registered only after its PNG was built, and a texture only if its PNG exists,',
        '// so an empty or partial build loads cleanly: nothing is requested and nothing warns.',
        f'Object.assign(ATLAS6, {json.dumps(atlases, separators=(",", ":"))});',
        '(function () {',
        f'  const TEX22 = {json.dumps(tex)};',
        f'  const GRP22 = {json.dumps(bins, separators=(",", ":"))};',
        '  const _ri22 = realmImages;',
        '  realmImages = function (r) {',
        '    const out = _ri22(r);',
        "    for (const a of (rk(r) === 'tt' ? GRP22.tt : GRP22.mod).concat(GRP22.common)) if (ATLAS6[a] !== undefined) out.push(a);",
        '    for (const t of TEX22) out.push(t);',
        '    return out;',
        '  };',
        '})();',
    ]
    open(JS_OUT, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')


def main():
    groups = {'mod': [], 'tt': [], 'common': []}
    built = set()
    for sh in SHEETS:
        if not os.path.exists(os.path.join(RAW, sh['name'] + '.png')):
            print('skip (not generated yet):', sh['name'])
            continue
        ps = slice_sheet(sh)
        if ps is None:
            continue
        for (n, _, size), im in zip(sh['items'], ps):
            groups[group_of(n)].append((n, fit(im, size)))
            built.add(n)
        print('ok', sh['name'], len(ps), 'sprites')
    atlases, bins = {}, {g: [] for g in groups}
    for g, sprites in groups.items():
        if not sprites:
            continue
        parts_ = pack_bins(sprites)
        for k, (pos, data) in enumerate(parts_):
            name = f'atlas22_{g}' if len(parts_) == 1 else f'atlas22_{g}_{k + 1}'
            open(os.path.join(OUT, name + '.png'), 'wb').write(data)
            atlases[name] = pos
            bins[g].append(name)
            w, hh = max(p[0] + p[2] for p in pos.values()), max(p[1] + p[3] for p in pos.values())
            print(f'{name}.png {w}x{hh} {len(pos)} sprites {len(data) // 1024} KB')
    for f in glob.glob(os.path.join(OUT, 'atlas22_*.png')):  # drop atlases of an earlier build that no longer exist
        if os.path.basename(f)[:-4] not in atlases:
            os.remove(f)
            print('removed stale', os.path.basename(f))
    tex = []
    for t, (_, _, kind) in TEXTURES.items():
        if os.path.exists(os.path.join(RAW, t + '.png')):
            if kind == 'overlay':
                seamless_rgba(t, 256)
            else:
                seamless(t, 256)
            tex.append(t)
            print('texture', t, '-> 256 px' + (' (alpha)' if kind == 'overlay' else ''))
    write_js(atlases, bins, tex)
    expected = [it[0] for sh in SHEETS for it in sh['items']]
    missing = [n for n in expected if n not in built]
    print(f'js/atlas22.js: {len(atlases)} atlases, {len(tex)} textures registered')
    print(f'sprites built {len(built)}/{len(expected)}; textures {len(tex)}/{len(TEXTURES)}')
    if missing:
        print('missing sprites:', ' '.join(missing))


if __name__ == '__main__':
    main()
