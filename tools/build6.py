"""Round 6 assets: statues, waypoints, base buildings, orbs."""
import os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from process import fit, SPLIT, OUT
def sp(n): return Image.open(os.path.join(SPLIT, n + '.png'))
def save(im, name, size): fit(im, size).save(os.path.join(OUT, name + '.png'))
for i, r in enumerate(['md', 'tt', 'sl']):
    save(sp(f'statues_{i}'), f'st_{r}', 210)
    save(sp(f'statues_{i + 3}'), f'wp_{r}', 140)
for i, (n, s) in enumerate([('base_forge', 140), ('base_kitchen', 120), ('base_garden', 130), ('base_storage', 130), ('base_board', 110), ('base_bed', 90), ('orb_md', 44), ('orb_tt', 44), ('orb_sl', 44)]):
    save(sp(f'base_{i}'), n, s)
print('ok')
