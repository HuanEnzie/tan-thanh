"""Front-view enemy/NPC sprites and back-view heroes for the 3D views."""
import os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from process import fit, SPLIT, OUT

def sp(n): return Image.open(os.path.join(SPLIT, n + '.png'))

def enemy_list(r):
    if r != 'tt':
        return [sp(f'{r}_efront_{i}') for i in range(7)]
    # tt sheet: golem (index 2) merged with the caster to its right -> cut at the emptiest column
    ims = [sp(f'tt_efront_{i}') for i in range(6)]
    m = ims[2]
    a = np.asarray(m)[..., 3].astype(int)
    w = a.shape[1]
    cols = a.sum(0)
    lo, hi = int(w * 0.55), int(w * 0.85)
    cut = lo + int(np.argmin(cols[lo:hi]))
    golem = m.crop((0, 0, cut, m.size[1]))
    caster = m.crop((cut, 0, w, m.size[1]))
    bb = caster.getbbox(); caster = caster.crop(bb)
    bb = golem.getbbox(); golem = golem.crop(bb)
    return [ims[0], ims[1], golem, caster, ims[3], ims[4], ims[5]]

for r in ['md', 'cy', 'ct', 'tt', 'sl']:
    ims = enemy_list(r)
    s = 76 / ims[0].size[1]
    for i, im in enumerate(ims):
        k = s * (1.7 if i == 6 else 1.15 if i == 2 else 1)
        fit(im, 'x%f' % k).save(os.path.join(OUT, f'{r}_ef_{i}.png'))
    n0 = sp(f'{r}_nfront_0').size[1]
    for i in range(4):
        fit(sp(f'{r}_nfront_{i}'), 'x%f' % (76 / n0)).save(os.path.join(OUT, f'{r}_nf_{i}.png'))
    hb = sp(f'{r}_hback_0')
    fit(hb, 'x%f' % (84 / hb.size[1])).save(os.path.join(OUT, f'{r}_hb.png'))
print('ok')
