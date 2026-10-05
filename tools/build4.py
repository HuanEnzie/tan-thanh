"""Round 4 assets: chests, armor, melee variety, cultivation items, shop icons, biomes, bosses, portrait expressions."""
import os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from process import fit, seamless, SPLIT, OUT, RAW

def sp(n): return Image.open(os.path.join(SPLIT, n + '.png'))
def save(im, name, size): fit(im, size).save(os.path.join(OUT, name + '.png'))

# chests: 0 wood, 1 silver, 2 gold, 3 diamond; 'o' = open
for i in range(4):
    save(sp(f'chests_{i}'), f'chest_{i}', 58 + i * 4)
    save(sp(f'chests_{i + 4}'), f'chest_{i}o', 58 + i * 4 + 12)

for r in ['md', 'tt', 'sl']:
    for i in range(4): save(sp(f'{r}_armor_{i}'), f'{r}_ar_{i}', 80)
    ms = [sp(f'{r}_melee_{i}') for i in range(8)]
    if r == 'sl':  # the claw pair was split in two
        a, b = sp('sl_melee_7'), sp('sl_melee_8')
        c = Image.new('RGBA', (a.width + b.width, max(a.height, b.height)))
        c.paste(a, (0, 0)); c.paste(b, (a.width, 0)); ms[7] = c
    for i, m in enumerate(ms): save(m, f'{r}_m_{i}', 80)
    for i in range(4): save(sp(f'{r}_bosses_{i}'), f'{r}_b_{i}', 200)

for i in range(16): save(sp(f'tt_items_{i}'), f'tt_i_{i}', 80)
for i in range(8): save(sp(f'shop_icons_{i}'), f'ui_{i}', 80)

BIO = ['b_snowpine', 'b_ice', 'b_cactus', 'b_skull', 'b_palm', 'b_mushroom', 'b_glowshroom', 'b_crystal',
       'b_lavarock', 'b_swamptree', 'b_reeds', 'b_tomb', 'b_sakura', 'b_bamboo', 'b_maple', 'b_fern']
BSIZE = {'b_snowpine': 170, 'b_ice': 80, 'b_cactus': 90, 'b_skull': 64, 'b_palm': 180, 'b_mushroom': 110, 'b_glowshroom': 70, 'b_crystal': 84,
         'b_lavarock': 70, 'b_swamptree': 170, 'b_reeds': 64, 'b_tomb': 56, 'b_sakura': 190, 'b_bamboo': 120, 'b_maple': 190, 'b_fern': 170}
for i, n in enumerate(BIO):
    save(sp(('biome_a_%d' % i) if i < 8 else ('biome_b_%d' % (i - 8))), n, BSIZE[n])

for t in ['tex_snow', 'tex_swamp', 'tex_ash', 'tex_mycel', 'tex_crystal', 'tex_sakura', 'tex_desert', 'tex_jungle', 'tex_ice', 'tex_lava', 'tex_grave', 'tex_leaves']:
    seamless(t, 256)

for r in ['md', 'tt', 'sl']:
    for i in (1, 2):
        for e in ['happy', 'sad', 'angry', 'blush', 'surprised']:
            im = Image.open(os.path.join(RAW, f'{r}_port{i}_{e}.png')).convert('RGB')
            im.thumbnail((420, 420), Image.LANCZOS)
            im.save(os.path.join(OUT, f'{r}_port{i}_{e}.jpg'), quality=86)
print('ok')
