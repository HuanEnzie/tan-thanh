"""Round 9: 4-frame animation sheets for every character sprite (enemies, NPCs, bosses, heroes+outfits, pets, mounts).
Each sheet: N rows (one character per row) x 4 columns (frames). Frame 1 = the existing sprite (reference row)."""
import os, json
from PIL import Image
H = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(H, 'prompts'); RAW = os.path.join(H, '..', 'assets', 'raw'); IMGD = os.path.join(H, '..', 'assets', 'img')

ENEMY = {'md': ['z_walker', 'z_runner', 'z_brute', 'z_spitter', 'z_police', 'z_boomer', 'z_hazmat', 'z_nurse'],
         'tt': [f'tt_e_{i}' for i in range(6)], 'sl': [f'sl_e_{i}' for i in range(6)]}
BIG = {'md': ['z_boss'] + [f'md_b_{i}' for i in range(4)], 'tt': ['tt_e_6'] + [f'tt_b_{i}' for i in range(4)], 'sl': ['sl_e_6'] + [f'sl_b_{i}' for i in range(4)]}
HERO = {'md': ['p_pistol', 'p_shotgun', 'p_rifle', 'p_bat'], 'tt': [f'tt_hero_{i}' for i in range(4)], 'sl': [f'sl_hero_{i}' for i in range(4)]}

groups = {}  # sheet name -> {'names': [...], 'kind': ...}
for r in ['md', 'tt', 'sl']:
    small = ENEMY[r] + [f'{r}_bm_{i}' for i in range(6)] + [f'{r}_npc_{i}' for i in range(4)]
    for k in range(0, len(small), 4):
        groups[f'an_{r}_s{k // 4}'] = {'names': small[k:k + 4], 'kind': 'walk'}
    big = BIG[r]
    for k in range(0, len(big), 2):
        groups[f'an_{r}_b{k // 2}'] = {'names': big[k:k + 2], 'kind': 'walk'}
    for t in range(4):
        names = HERO[r] if t == 0 else [f'{r}_o{t}_{i}' for i in range(4)]
        groups[f'an_{r}_h{t}'] = {'names': names, 'kind': 'hero'}
groups['an_pet0'] = {'names': [f'pet_{i}' for i in range(4)], 'kind': 'pet'}
groups['an_pet1'] = {'names': [f'pet_{i}' for i in range(4, 8)], 'kind': 'pet'}
groups['an_mnt0'] = {'names': [f'mount_{i}' for i in range(4)], 'kind': 'mount'}
groups['an_mnt1'] = {'names': [f'mount_{i}' for i in range(4, 8)], 'kind': 'mount'}

ACT = {
    'walk': "a looping 4-frame WALK CYCLE seen from directly above (top-down), body facing RIGHT: legs/arms/tail/wings alternate so the creature clearly moves",
    'hero': "a looping 4-frame WALK CYCLE of the hero seen from directly above (top-down), facing RIGHT, still holding the SAME weapon in the same aiming pose: shoulders sway and the feet/legs step alternately under the body",
    'pet': "a looping 4-frame IDLE FLOAT animation: the pet bobs up and down, blinks once and its ears/wings/tail move slightly",
    'mount': "a looping 4-frame RUN CYCLE seen from directly above (top-down), head pointing RIGHT, the saddle stays on its back: legs/wings/tentacles stride clearly",
}
P, REFS = {}, {}
for g, spec in groups.items():
    ims = [Image.open(os.path.join(IMGD, n + '.png')).convert('RGBA') for n in spec['names']]
    up = 4 if max(max(i.size) for i in ims) < 120 else 2
    ims = [i.resize((i.width * up, i.height * up), Image.NEAREST) for i in ims]
    cw = max(i.width for i in ims) + 80; ch = max(i.height for i in ims) + 60
    ref = Image.new('RGBA', (cw * 4, ch * len(ims)), (255, 0, 255, 255))
    for k, im in enumerate(ims):
        ref.alpha_composite(im, ((cw - im.width) // 2, k * ch + (ch - im.height) // 2))
    ref.convert('RGB').save(os.path.join(RAW, f'ref_{g}.png'))
    n = len(ims)
    P[g] = (f"16-bit pixel art game sprite animation sheet, crisp hard pixels, dark 1px outline, same art style, colors, size and camera as the reference. "
            f"Plain flat solid magenta (#FF00FF) background. The reference shows {n} character{'s' if n > 1 else ''}, one per row, in the first column. "
            f"Produce exactly {n} row{'s' if n > 1 else ''} x 4 columns: row k is {ACT[spec['kind']]}, of the k-th character of the reference. "
            "Column 1 must match the reference sprite exactly (same pose, size, position); columns 2-4 continue the cycle. Keep every frame the SAME size and centred in its own equal cell, "
            "wide magenta gaps between cells, frames never touch, no text, no shadows on the ground.")
    REFS[g] = [f'ref_{g}']
os.makedirs(D, exist_ok=True)
for k, v in P.items():
    open(os.path.join(D, k + '.txt'), 'w', encoding='utf-8').write(v)
json.dump({k: REFS[k] for k in P}, open(os.path.join(H, 'gen9_refs.json'), 'w'), indent=1)
json.dump(groups, open(os.path.join(H, 'anim9_groups.json'), 'w'), indent=1)
print(len(P), 'sheets')
