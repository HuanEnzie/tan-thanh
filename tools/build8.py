"""Round 8 assets: animated FX frames (grid-sliced, shared anchor per animation), projectiles, biome monsters, icons, UI frames."""
import os, sys, json, subprocess
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from process import fit, key_magenta, SPLIT, OUT, RAW

H = os.path.dirname(os.path.abspath(__file__))


def rgba(name):
    im = Image.open(os.path.join(RAW, name + '.png')).convert('RGBA')
    return key_magenta(im)


FX = {'fx_a': ['exp', 'slash'], 'fx_b': ['hit', 'frost'], 'fx_c': ['bolt', 'meteor'], 'fx_d': ['vortex', 'heal'],
      'fx_e': ['portal', 'lvl'], 'fx_f': ['fire', 'poison']}
meta = {}
for sheet, anims in FX.items():
    im = rgba(sheet)
    a = np.asarray(im)
    Hh, W = a.shape[:2]
    for row, name in enumerate(anims):
        y0, y1 = row * Hh // 2, (row + 1) * Hh // 2
        cells = [a[y0:y1, c * W // 6:(c + 1) * W // 6] for c in range(6)]
        # one union box for the whole row (relative to each cell) so every frame keeps the same anchor
        box = None
        for c in cells:
            ys, xs = np.nonzero(c[..., 3] > 16)
            if len(xs) == 0:
                continue
            b = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
            box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
        bw, bh = box[2] - box[0], box[3] - box[1]
        s = 160 / max(bw, bh)
        for i, c in enumerate(cells):
            fr = Image.fromarray(c[box[1]:box[3], box[0]:box[2]].copy(), 'RGBA')
            fr = fr.resize((max(1, round(bw * s)), max(1, round(bh * s))), Image.LANCZOS)
            fr.save(os.path.join(OUT, f'fx_{name}_{i}.png'))
        meta[name] = [round(bw * s), round(bh * s)]
print('fx', meta)


def split(sheet, dil):
    subprocess.run([sys.executable, os.path.join(H, 'process.py'), 'split', sheet, str(dil)], check=True, capture_output=True)
    n = 0
    while os.path.exists(os.path.join(SPLIT, f'{sheet}_{n}.png')):
        n += 1
    return n


def sp(n): return Image.open(os.path.join(SPLIT, n + '.png')).convert('RGBA')


counts = {}
for sheet, dil in [('projectiles', 8), ('mon_md', 8), ('mon_tt', 8), ('mon_sl', 8), ('icons', 4), ('ui_kit', 4)]:
    counts[sheet] = split(sheet, dil)
print('counts', counts)
assert counts['projectiles'] == 12 and counts['icons'] == 16 and counts['ui_kit'] == 3, counts
for i in range(12):
    fit(sp(f'projectiles_{i}'), 72).save(os.path.join(OUT, f'pj_{i}.png'))
for r in ['md', 'tt', 'sl']:
    assert counts[f'mon_{r}'] == 6, (r, counts[f'mon_{r}'])
    for i in range(6):
        fit(sp(f'mon_{r}_{i}'), 74).save(os.path.join(OUT, f'{r}_bm_{i}.png'))
for i in range(16):
    fit(sp(f'icons_{i}'), 72).save(os.path.join(OUT, f'ic_{i}.png'))
# UI: keep the panel big enough for crisp border-image slicing
ui = sorted([sp(f'ui_kit_{i}') for i in range(3)], key=lambda im: -im.width * im.height)
panel = ui[0]
rest = sorted(ui[1:], key=lambda im: im.height, reverse=True)  # button is taller than the bar
fit(panel, 384).save(os.path.join(OUT, 'ui_panel.png'))
fit(rest[0], 320).save(os.path.join(OUT, 'ui_btn.png'))
fit(rest[1], 400).save(os.path.join(OUT, 'ui_bar.png'))
for n in ['ui_panel', 'ui_btn', 'ui_bar']:
    print(n, Image.open(os.path.join(OUT, n + '.png')).size)
json.dump(meta, open(os.path.join(H, 'fx_meta.json'), 'w'))
