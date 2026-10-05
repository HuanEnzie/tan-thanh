"""Asset pipeline: chroma-key magenta sheets, split into sprites, build tileable textures.

python process.py split <sheet> [dilate]   -> raw/split/<sheet>_<i>.png + raw/split/<sheet>__index.png
python process.py build                    -> assets/img/*.png from MAP below
"""
import os, sys, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets")
RAW = os.path.join(ROOT, "raw")
SPLIT = os.path.join(RAW, "split")
OUT = os.path.join(ROOT, "img")
os.makedirs(SPLIT, exist_ok=True)
os.makedirs(OUT, exist_ok=True)


def key_magenta(im):
    a = np.asarray(im.convert("RGBA")).astype(np.int32)
    if (a[..., 3] < 20).mean() > 0.05:  # already transparent
        out = a.astype(np.uint8).copy()
        m = ndimage.binary_opening(out[..., 3] > 100, iterations=1)
        out[..., 3] = np.where(m, 255, 0)
        return Image.fromarray(out, "RGBA")
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    # background = vivid magenta-ish
    bg = (r > 140) & (b > 140) & (g < 120) & (np.abs(r - b) < 90) & ((r + b) / 2 - g > 70)
    # soft fringe: pinkish pixels touching bg
    near = ndimage.binary_dilation(bg, iterations=2)
    fringe = near & ~bg & (r - g > 40) & (b - g > 40)
    bg = bg | fringe
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    # remove specks
    m = alpha > 0
    m = ndimage.binary_opening(m, iterations=1)
    out = a.astype(np.uint8).copy()
    out[..., 3] = np.where(m, 255, 0)
    # despill remaining edge pixels
    edge = m & ndimage.binary_dilation(~m, iterations=1)
    rr, gg, bb = out[..., 0].astype(int), out[..., 1].astype(int), out[..., 2].astype(int)
    spill = edge & (rr - gg > 30) & (bb - gg > 30)
    avg = ((rr + gg + bb) // 3 * 0.6).astype(np.uint8)
    for c in range(3):
        out[..., c] = np.where(spill, avg, out[..., c])
    return Image.fromarray(out, "RGBA")


def split(sheet, dilate=10, min_area=1500):
    im = key_magenta(Image.open(os.path.join(RAW, sheet + ".png")))
    a = np.asarray(im)
    m = a[..., 3] > 0
    md = ndimage.binary_dilation(m, iterations=dilate)
    lab, n = ndimage.label(md)
    objs = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        sub = (lab[sl] == i + 1) & m[sl]
        area = sub.sum()
        if area < min_area:
            continue
        ys, xs = np.nonzero(sub)
        y0, y1, x0, x1 = ys.min() + sl[0].start, ys.max() + sl[0].start + 1, xs.min() + sl[1].start, xs.max() + sl[1].start + 1
        crop = a[y0:y1, x0:x1].copy()
        keep = (lab[y0:y1, x0:x1] == i + 1)
        crop[..., 3] = np.where(keep & (crop[..., 3] > 0), 255, 0)
        objs.append(((y0 + y1) / 2, (x0 + x1) / 2, (x0, y0, x1, y1), crop))
    # sort into rows
    objs.sort(key=lambda o: o[0])
    rows, cur = [], []
    for o in objs:
        if cur and abs(o[0] - np.mean([c[0] for c in cur])) > 0.5 * max(c[2][3] - c[2][1] for c in cur):
            rows.append(cur); cur = []
        cur.append(o)
    if cur: rows.append(cur)
    ordered = [o for r in rows for o in sorted(r, key=lambda o: o[1])]
    for f in os.listdir(SPLIT):
        if f.startswith(sheet + "_"):
            os.remove(os.path.join(SPLIT, f))
    idx = im.convert("RGB").copy()
    bgc = Image.new("RGB", im.size, (40, 40, 48))
    bgc.paste(im, (0, 0), im)
    d = ImageDraw.Draw(bgc)
    for k, o in enumerate(ordered):
        Image.fromarray(o[3], "RGBA").save(os.path.join(SPLIT, f"{sheet}_{k}.png"))
        x0, y0, x1, y1 = o[2]
        d.rectangle([x0, y0, x1, y1], outline=(0, 255, 0), width=3)
        d.text((x0 + 6, y0 + 4), str(k), fill=(255, 255, 0), font=ImageFont.load_default(size=48))
    bgc.thumbnail((1200, 1200))
    bgc.save(os.path.join(SPLIT, f"{sheet}__index.png"))
    print(sheet, "->", len(ordered), "sprites", [o[3].shape[1::-1] for o in ordered])


def fit(img, maxdim):
    w, h = img.size
    s = float(maxdim[1:]) if isinstance(maxdim, str) else maxdim / max(w, h)
    nw, nh = max(1, round(w * s)), max(1, round(h * s))
    # premultiplied box downscale then hard alpha
    a = np.asarray(img).astype(np.float32)
    pm = a.copy(); pm[..., :3] *= a[..., 3:4] / 255
    small = Image.fromarray(pm.astype(np.uint8), "RGBA").resize((nw, nh), Image.BOX)
    s = np.asarray(small).astype(np.float32)
    al = s[..., 3:4]
    rgb = np.where(al > 0, s[..., :3] * 255 / np.maximum(al, 1), 0)
    out = np.concatenate([np.clip(rgb, 0, 255), np.where(al > 110, 255, 0)], axis=2).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def seamless(name, size=128, crop=0.86):
    im = Image.open(os.path.join(RAW, name + ".png")).convert("RGB")
    w, h = im.size
    c = int(min(w, h) * crop)
    im = im.crop(((w - c) // 2, (h - c) // 2, (w - c) // 2 + c, (h - c) // 2 + c)).resize((512, 512), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32)
    rolled = np.roll(np.roll(a, 256, 0), 256, 1)
    y, x = np.mgrid[0:512, 0:512]
    d = np.maximum(np.abs(x - 255.5), np.abs(y - 255.5)) / 256  # 0 center .. 1 edge
    wgt = np.clip((0.95 - d) / 0.35, 0, 1)[..., None]
    out = a * wgt + rolled * (1 - wgt)
    Image.fromarray(out.astype(np.uint8)).resize((size, size), Image.BOX).save(os.path.join(OUT, name + ".png"))


def build():
    cfg = json.load(open(os.path.join(os.path.dirname(__file__), "map.json"), encoding="utf-8"))
    for name, (src, maxdim) in cfg["sprites"].items():
        img = Image.open(os.path.join(SPLIT, src + ".png"))
        flip = name.endswith("@flip")
        name = name.replace("@flip", "")
        if flip:
            img = img.transpose(Image.FLIP_LEFT_RIGHT)
        rot = cfg.get("rotate", {}).get(name)
        if rot:
            img = img.rotate(rot, expand=True)
        fit(img, maxdim).save(os.path.join(OUT, name + ".png"))
    for name, size in cfg["textures"].items():
        seamless(name, size)
    for name, w in cfg["art"].items():
        im = Image.open(os.path.join(RAW, name + ".png")).convert("RGB")
        im.thumbnail((w, w))
        im.save(os.path.join(OUT, name + ".jpg"), quality=88)
    print("built", len(cfg["sprites"]), "sprites")


if __name__ == "__main__":
    if sys.argv[1] == "split":
        split(sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 10)
    else:
        build()
