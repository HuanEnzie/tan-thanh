"""Round 11: slice class outfit sheets into {realm}_K_{class}_{g}{a|b}_{pose}, sized like the plain hero pose."""
import os, sys
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, os.path.dirname(__file__))
from process import key_magenta, fit, RAW, OUT
CLASSES = ['warrior', 'assassin', 'ranger', 'mage', 'healer']
HERO = {'md': ['p_pistol', 'p_shotgun', 'p_rifle', 'p_bat'], 'tt': [f'tt_hero_{i}' for i in range(4)], 'sl': [f'sl_hero_{i}' for i in range(4)]}


def parts(sheet, want, dilate=10):
    """Components in reading order; faint glow (alpha < 128) is dropped first so auras don't become opaque blobs."""
    a = np.asarray(key_magenta(Image.open(os.path.join(RAW, sheet + '.png')))).copy()
    a[..., 3] = np.where(a[..., 3] >= 128, 255, 0)
    m = a[..., 3] > 0
    lab, _ = ndimage.label(ndimage.binary_dilation(m, iterations=dilate))
    objs = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        keep = (lab[sl] == i + 1) & m[sl]
        if keep.sum() < 1500:
            continue
        ys, xs = np.nonzero(keep)
        y0, y1, x0, x1 = ys.min() + sl[0].start, ys.max() + sl[0].start + 1, xs.min() + sl[1].start, xs.max() + sl[1].start + 1
        crop = a[y0:y1, x0:x1].copy()
        crop[..., 3] = np.where((lab[y0:y1, x0:x1] == i + 1) & (crop[..., 3] > 0), 255, 0)
        objs.append(((y0 + y1) / 2, (x0 + x1) / 2, y1 - y0, Image.fromarray(crop, 'RGBA')))
    objs.sort(key=lambda o: o[0])
    rows, cur = [], []
    for o in objs:
        if cur and abs(o[0] - np.mean([c[0] for c in cur])) > 0.5 * max(c[2] for c in cur):
            rows.append(cur); cur = []
        cur.append(o)
    if cur: rows.append(cur)
    out = [o[3] for r in rows for o in sorted(r, key=lambda o: o[1])]
    if len(out) != want:
        print('!!', sheet, 'found', len(out), 'expected', want)
    return out


bad = []
for r, base in HERO.items():
    for g in 'mf':
        for c in CLASSES:
            for t in 'ab':
                sheet = f'k11_{r}_{c}_{g}_{t}'
                if not os.path.exists(os.path.join(RAW, sheet + '.png')): bad.append(sheet + ' (missing)'); continue
                ps = parts(sheet, 4, 26 if r == 'tt' else 10)
                if len(ps) != 4: bad.append(sheet); continue
                for k, im in enumerate(ps):
                    ref = Image.open(os.path.join(OUT, (base[k] if g == 'm' else f'{r}_f0_{k}') + '.png'))
                    fit(im, 's%.5f' % (ref.height / im.height)).save(os.path.join(OUT, f'{r}_K_{c}_{g}{t}_{k}.png'))
print('bad:', bad)
