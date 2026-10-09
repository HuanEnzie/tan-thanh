"""Round 11b: slice 4-frame animation sheets into <sprite>_w0..3 frames, scaled so frame 0 matches the existing sprite.
Frames are found as connected components, grouped into rows (by y) and columns (by x); a grid split is the fallback."""
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, os.path.dirname(__file__))
from process import key_magenta, RAW, OUT

H = os.path.dirname(os.path.abspath(__file__))
groups = json.load(open(os.path.join(H, 'anim11_groups.json')))
report = {}


def components(a, n_rows):
    m = a[..., 3] > 60
    lab, k = ndimage.label(ndimage.binary_dilation(m, iterations=7))
    boxes = []
    for sl in ndimage.find_objects(lab):
        if sl is None:
            continue
        y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
        if (y1 - y0) * (x1 - x0) < 900:
            continue
        sub = m[y0:y1, x0:x1]
        ys, xs = np.nonzero(sub)
        boxes.append((x0 + xs.min(), y0 + ys.min(), x0 + xs.max() + 1, y0 + ys.max() + 1))
    if len(boxes) != n_rows * 4:
        return None
    boxes.sort(key=lambda b: (b[1] + b[3]) / 2)
    rows = [sorted(boxes[i * 4:(i + 1) * 4], key=lambda b: b[0]) for i in range(n_rows)]
    return rows


def grid(a, n_rows):
    Hh, W = a.shape[:2]
    rows = []
    for r in range(n_rows):
        row = []
        for c in range(4):
            x0, x1, y0, y1 = c * W // 4, (c + 1) * W // 4, r * Hh // n_rows, (r + 1) * Hh // n_rows
            ys, xs = np.nonzero(a[y0:y1, x0:x1, 3] > 60)
            if len(xs) == 0:
                return None
            row.append((x0 + xs.min(), y0 + ys.min(), x0 + xs.max() + 1, y0 + ys.max() + 1))
        rows.append(row)
    return rows


for g, spec in groups.items():
    path = os.path.join(RAW, g + '.png')
    if not os.path.exists(path):
        report[g] = 'missing'
        continue
    a = np.asarray(key_magenta(Image.open(path).convert('RGBA')))
    n = len(spec['names'])
    rows = components(a, n)
    how = 'cc'
    if rows is None:
        rows, how = grid(a, n), 'grid'
    if rows is None:
        report[g] = 'fail'
        continue
    for name, row in zip(spec['names'], rows):
        orig = Image.open(os.path.join(IMGD := os.path.join(H, '..', 'assets', 'img'), name + '.png'))
        f0 = row[0]
        s = (orig.width / (f0[2] - f0[0]) + orig.height / (f0[3] - f0[1])) / 2
        mw = max(b[2] - b[0] for b in row); mh = max(b[3] - b[1] for b in row)
        for i, b in enumerate(row):
            if spec['kind'] == 'hero':  # heroes are drawn from their left edge: keep the left edge, centre vertically
                x0 = b[0]; cy = (b[1] + b[3]) / 2
                box = (x0, int(cy - mh / 2), x0 + mw, int(cy - mh / 2) + mh)
            else:
                cx, cy = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2
                box = (int(cx - mw / 2), int(cy - mh / 2), int(cx - mw / 2) + mw, int(cy - mh / 2) + mh)
            pad = np.zeros((mh, mw, 4), np.uint8)
            sx0, sy0, sx1, sy1 = max(0, box[0]), max(0, box[1]), min(a.shape[1], box[2]), min(a.shape[0], box[3])
            pad[sy0 - box[1]:sy1 - box[1], sx0 - box[0]:sx1 - box[0]] = a[sy0:sy1, sx0:sx1]
            # keep only pixels that belong to this frame's own box (neighbouring frames can leak into the padding)
            mask = np.zeros((mh, mw), bool)
            mask[max(0, b[1] - box[1]):b[3] - box[1], max(0, b[0] - box[0]):b[2] - box[0]] = True
            pad[~mask] = 0
            fr = Image.fromarray(pad, 'RGBA').resize((max(1, round(mw * s)), max(1, round(mh * s))), Image.LANCZOS)
            al = np.asarray(fr).copy(); al[..., 3] = np.where(al[..., 3] > 110, 255, 0)
            Image.fromarray(al, 'RGBA').save(os.path.join(OUT, f'{name}_w{i}.png'))
    report[g] = how
print(json.dumps(report, indent=0))
