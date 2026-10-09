"""Round 11: class outfits for the hero. Per realm x class x gender x tier (a = basic, b = elite): the 4 weapon poses
redrawn in the outfit of that class's NPC sprite. Output sheet k11_{r}_{class}_{g}_{t} (2x2 grid)."""
import os, json
from PIL import Image
H = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(H, 'prompts'); RAW = os.path.join(H, '..', 'assets', 'raw'); IMGD = os.path.join(H, '..', 'assets', 'img')
HERO = {'md': ['p_pistol', 'p_shotgun', 'p_rifle', 'p_bat'], 'tt': [f'tt_hero_{i}' for i in range(4)], 'sl': [f'sl_hero_{i}' for i in range(4)]}
CL = ['warrior', 'assassin', 'ranger', 'mage', 'healer']
ELITE = {
    'md': 'an ELITE upgraded version of that outfit: reinforced armor plates, metal trims, glowing orange accents and a short tattered cape',
    'tt': 'an ELITE immortal version of that outfit: richer layered silk with gold embroidery, glowing runes, floating ribbons and a jade crown ornament',
    'sl': 'an ELITE S-rank version of that outfit: polished dark armor pieces with glowing neon trim, a long cape and a faint aura',
}


def grid(names, cols, out, up=5, padx=120, pady=160):
    ims = [Image.open(os.path.join(IMGD, n + '.png')).convert('RGBA') for n in names]
    ims = [im.resize((im.width * up, im.height * up), Image.NEAREST) for im in ims]
    rows = (len(ims) + cols - 1) // cols
    cw = max(i.width for i in ims) + padx; ch = max(i.height for i in ims) + pady
    sheet = Image.new('RGBA', (cw * cols, ch * rows), (255, 0, 255, 255))
    for k, im in enumerate(ims):
        sheet.alpha_composite(im, ((k % cols) * cw + (cw - im.width) // 2, (k // cols) * ch + (ch - im.height) // 2))
    sheet.convert('RGB').save(os.path.join(RAW, out + '.png'))


P, REFS = {}, {}
for r in HERO:
    for g in 'mf':
        poses = HERO[r] if g == 'm' else [f'{r}_f0_{i}' for i in range(4)]
        rp = f'ref11_pose_{r}_{g}'
        grid(poses, 2, rp)
        for c in CL:
            rc = f'ref11_cls_{r}_{c}_{g}'
            grid([f'{r}_cls_{c}_{g}'], 1, rc, up=7, padx=200, pady=200)
            for t in 'ab':
                n = f'k11_{r}_{c}_{g}_{t}'
                look = 'the outfit, colors, hair and accessories of the character in the SECOND reference' + ('' if t == 'a' else f', but as {ELITE[r]}')
                P[n] = ("16-bit pixel art top-down game sprites, crisp hard pixels, dark 1px outline, rich shading, solid flat magenta background, no shadow, no text. "
                        "The FIRST reference shows 4 sprites of the same hero seen from DIRECTLY ABOVE (top-down), facing RIGHT, each holding a different weapon in a 2x2 grid. "
                        "Redraw those 4 sprites in exactly the same 2 columns x 2 rows layout with wide gaps: same top-down camera, same facing direction (right), "
                        "same body pose, the SAME weapon in each sprite, same size and proportions, same gender and hair length, "
                        f"but now wearing {look}. Keep each sprite compact and clearly separated. Landscape image.")
                REFS[n] = [rp, rc]
os.makedirs(D, exist_ok=True)
for k, v in P.items(): open(os.path.join(D, k + '.txt'), 'w', encoding='utf-8').write(v)
json.dump(REFS, open(os.path.join(H, 'gen11_refs.json'), 'w'), indent=1)
print(len(P), 'prompts')
