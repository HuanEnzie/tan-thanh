"""Round 5 assets: pets, wonders, event sprites, gacha tickets."""
import os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from process import fit, SPLIT, OUT
def sp(n): return Image.open(os.path.join(SPLIT, n + '.png'))
def save(im, name, size): fit(im, size).save(os.path.join(OUT, name + '.png'))
for i in range(8): save(sp(f'pets_{i}'), f'pet_{i}', 72)
for i in range(6): save(sp(f'wonders_a_{i}'), f'w_{i}', 560)
for i in range(6): save(sp(f'wonders_b_{i}'), f'w_{i + 6}', 560)
for i, (n, s) in enumerate([('ev_goblin', 92), ('ev_mimic', 70), ('ev_star', 64), ('tk_md', 80), ('tk_tt', 80), ('tk_sl', 80), ('ev_altar', 150), ('ev_egg', 80)]):
    save(sp(f'events_{i}'), n, s)
print('ok')
