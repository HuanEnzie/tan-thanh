"""Build sprites for the 4 new worlds + shared extras into assets/img."""
import os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from process import fit, seamless, SPLIT, RAW, OUT

def sp(name):
    return Image.open(os.path.join(SPLIT, name + '.png'))

def save(img, name, maxdim=None, scale=None):
    if scale is not None:
        out = fit(img, 'x%f' % scale)
    else:
        out = fit(img, maxdim)
    out.save(os.path.join(OUT, name + '.png'))

ENEMY_MAX = [60, 60, 104, 68, 64, 54, 200]
PROP_MAX = {
    'cy': [64, 52, 40, 52, 150, 150, 60, 92, 64, 60, 96, 44],
    'ct': [48, 52, 52, 56, 64, 60, 110, 96, 48, 72, 64, 190],
    'tt': [44, 56, 72, 60, 56, 56, 72, 46, 190, 180, 64, 40],
    'sl': [56, 40, 60, 56, 64, 60, 72, 40, 72, 128, 96, 128],
}
ROT = {'cy_p_4': -90, 'cy_p_5': -90}

for r in ['cy', 'ct', 'tt', 'sl']:
    # heroes: same scale for the 4 poses, body ~26 world px
    h0 = sp(f'{r}_hero_0').size[1]
    s = 52 / h0
    for i in range(4):
        save(sp(f'{r}_hero_{i}'), f'{r}_hero_{i}', scale=s)
    n0 = sp(f'{r}_npc_0').size[1]
    for i in range(4):
        save(sp(f'{r}_npc_{i}'), f'{r}_npc_{i}', scale=52 / n0)
    for i in range(7):
        save(sp(f'{r}_enemies_{i}'), f'{r}_e_{i}', ENEMY_MAX[i])
    for i in range(12):
        im = sp(f'{r}_props_{i}')
        if f'{r}_p_{i}' in ROT:
            im = im.rotate(ROT[f'{r}_p_{i}'], expand=True)
        save(im, f'{r}_p_{i}', PROP_MAX[r][i])
    for i in range(4):
        save(sp(f'{r}_icons_{i}'), f'{r}_w_{i}', 80)
    for k in ['ground', 'road', 'floor', 'roof', 'wall']:
        seamless(f'tex_{r}_{k}', 256)
    for p in ['port1', 'port2']:
        im = Image.open(os.path.join(RAW, f'{r}_{p}.png')).convert('RGB'); im.thumbnail((420, 420)); im.save(os.path.join(OUT, f'{r}_{p}.jpg'), quality=86)
    im = Image.open(os.path.join(RAW, f'{r}_art.png')).convert('RGB'); im.thumbnail((1400, 1400)); im.save(os.path.join(OUT, f'{r}_art.jpg'), quality=84)

n0 = sp('md_npc_0').size[1]
for i in range(4):
    save(sp(f'md_npc_{i}'), f'md_npc_{i}', scale=52 / n0)
for p in ['port1', 'port2']:
    im = Image.open(os.path.join(RAW, f'md_{p}.png')).convert('RGB'); im.thumbnail((420, 420)); im.save(os.path.join(OUT, f'md_{p}.jpg'), quality=86)
for i in range(12):
    save(sp(f'relics_{i}'), f'relic_{i}', 80)
FX = [128, 128, 96, 56, 56, 56, 72, 40]
for i in range(8):
    save(sp(f'fx_misc_{i}'), f'fx_{i}', FX[i])
print('ok')
