"""Round 7 assets: mounts, outfits, breakthrough materials, skill icons, shelter buildings."""
import os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from process import fit, SPLIT, OUT
def sp(n): return Image.open(os.path.join(SPLIT, n + '.png')).convert('RGBA')
def save(im, name, size): fit(im, size).save(os.path.join(OUT, name + '.png'))
for i in range(8): save(sp(f'mounts_{i}'), f'mount_{i}', 150)
for i, r in enumerate(['md', 'tt', 'sl']):
    for j, k in enumerate('abc'): save(sp(f'bt_items_{i * 3 + j}'), f'bt_{r}_{k}', 64)
for i in range(8): save(sp(f'skills_{i}'), f'sk_{i}', 64)
for i, r in enumerate(['md', 'tt', 'sl']):
    save(sp(f'shelter_{i * 3}'), f'sh_tower_{r}', 210)
    save(sp(f'shelter_{i * 3 + 1}'), f'sh_gate_{r}', 250)
    save(sp(f'shelter_{i * 3 + 2}'), f'sh_hall_{r}', 240)
for r in ['md', 'tt', 'sl']:
    for t in (1, 2, 3):
        for k in range(4):
            im = sp(f'outfit_{r}_{t}_{k}'); bb = im.getbbox(); im = im.crop(bb)
            H = 52 if t < 3 else 56
            fit(im, 's%.5f' % (H / im.height)).save(os.path.join(OUT, f'{r}_o{t}_{k}.png'))
print('ok')
