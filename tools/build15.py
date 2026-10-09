"""Round 15: slice portrait sheets (12 per sheet) into 224px busts and pack 36 per atlas: assets/img/pf_{realm}_{g}.jpg (6x6)."""
import os, sys
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, os.path.dirname(__file__))
from process import key_magenta, RAW, OUT
S = 224


def cells(path):
    im = Image.open(path).convert('RGB')
    a = np.asarray(key_magenta(im))
    m = a[..., 3] > 0
    m = ndimage.binary_opening(m, iterations=3)
    lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=2))
    objs = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if h * w < 20000 or max(h, w) / min(h, w) > 1.6: continue
        objs.append(((sl[0].start + sl[0].stop) / 2, (sl[1].start + sl[1].stop) / 2, h, sl))
    objs.sort(key=lambda o: o[0])
    rows, cur = [], []
    for o in objs:
        if cur and abs(o[0] - np.mean([c[0] for c in cur])) > 0.5 * max(c[2] for c in cur): rows.append(cur); cur = []
        cur.append(o)
    if cur: rows.append(cur)
    out = [o for r in rows for o in sorted(r, key=lambda o: o[1])]
    crops = []
    if len(out) == 12:
        for o in out:
            sl = o[3]; c = im.crop((sl[1].start, sl[0].start, sl[1].stop, sl[0].stop)); crops.append(c)
    else:
        print('!! grid fallback', os.path.basename(path), 'found', len(out))
        w, h = im.size
        for r in range(3):
            for c in range(4): crops.append(im.crop((int(c * w / 4 + w * 0.01), int(r * h / 3 + h * 0.01), int((c + 1) * w / 4 - w * 0.01), int((r + 1) * h / 3 - h * 0.01))))
    res = []
    for c in crops:
        w, h = c.size; t = int(min(w, h) * 0.035)
        c = c.crop((t, t, w - t, h - t)); w, h = c.size; s = min(w, h)
        y0 = int((h - s) * 0.35); c = c.crop(((w - s) // 2, y0, (w - s) // 2 + s, y0 + s))
        res.append(c.resize((S, S), Image.LANCZOS))
    return res


for r in ('md', 'tt', 'sl'):
    for g in 'mf':
        faces = []
        for b in range(3):
            p = os.path.join(RAW, f'pf15_{r}_{g}_{b}.png')
            if os.path.exists(p): faces += cells(p)
        if not faces: continue
        atlas = Image.new('RGB', (S * 6, S * 6), (0, 0, 0))
        for i, f in enumerate(faces[:36]): atlas.paste(f, ((i % 6) * S, (i // 6) * S))
        atlas.save(os.path.join(OUT, f'pf_{r}_{g}.jpg'), quality=84)
        print(r, g, len(faces), 'faces')
