"""Round 10 prompts: female hero (4 outfit tiers x 4 weapon poses per realm), class NPCs (5 classes x 2 genders per realm), class emblems."""
import os, json
from PIL import Image
H = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(H, 'prompts'); RAW = os.path.join(H, '..', 'assets', 'raw'); IMGD = os.path.join(H, '..', 'assets', 'img')
HERO = {'md': ['p_pistol', 'p_shotgun', 'p_rifle', 'p_bat'], 'tt': [f'tt_hero_{i}' for i in range(4)], 'sl': [f'sl_hero_{i}' for i in range(4)]}
P, REFS = {}, {}

def grid(names, cols, out, up=5, padx=120, pady=160):
    ims = [Image.open(os.path.join(IMGD, n + '.png')).convert('RGBA') for n in names]
    ims = [im.resize((im.width * up, im.height * up), Image.NEAREST) for im in ims]
    rows = (len(ims) + cols - 1) // cols
    cw = max(i.width for i in ims) + padx; ch = max(i.height for i in ims) + pady
    sheet = Image.new('RGBA', (cw * cols, ch * rows), (255, 0, 255, 255))
    for k, im in enumerate(ims):
        sheet.alpha_composite(im, ((k % cols) * cw + (cw - im.width) // 2, (k // cols) * ch + (ch - im.height) // 2))
    sheet.convert('RGB').save(os.path.join(RAW, out + '.png'))

FEM = {
    'md': "a young woman survivor with a long dark ponytail falling down her back and a few loose strands, slimmer shoulders",
    'tt': "a young female cultivator with very long flowing black hair spreading behind her, a jade hairpin and a small hair bun with ribbons, slimmer shoulders",
    'sl': "a young female hunter with long dark hair tied in a high ponytail, slimmer shoulders",
}
for r, base in HERO.items():
    for t in range(4):
        names = base if t == 0 else [f'{r}_o{t}_{i}' for i in range(4)]
        ref = f'ref_f_{r}_{t}'
        grid(names, 2, ref)
        n = f'fem_{r}_{t}'
        P[n] = ("16-bit pixel art top-down game sprites, crisp hard pixels, dark 1px outline, solid flat magenta background, no shadow, no text. "
                "The reference image shows 4 sprites of the SAME male hero seen from DIRECTLY ABOVE (top-down), facing RIGHT, each holding a different weapon. "
                "Redraw all 4 sprites in exactly the same 2 columns x 2 rows layout with wide gaps, keeping the same top-down camera, same facing direction (right), "
                "same body pose, the SAME weapon in each sprite, the SAME outfit, colors and armor, same size and proportions, "
                f"but the hero is now {FEM[r]} (the hair must be clearly visible from above). Keep each sprite compact and clearly separated. Landscape image.")
        REFS[n] = [ref]

# classes: warrior, assassin, ranger, mage, healer
CLS = {
    'md': ["WARRIOR: heavy survivor brute in scrap-metal shoulder armor holding a big fire axe",
           "ASSASSIN: lean figure in a black hooded jacket with a face mask holding two combat knives",
           "MARKSMAN: soldier in a desert camo vest and cap holding a long sniper rifle",
           "ENGINEER: technician in an orange jumpsuit with a tool belt and a glowing blue tesla gauntlet / shock baton",
           "MEDIC: field doctor in a white coat with a red cross armband and a medical backpack holding a syringe gun"],
    'tt': ["SWORD CULTIVATOR: warrior in white and silver battle robe holding a long glowing jian sword",
           "SHADOW ASSASSIN: figure in a black and dark purple tight robe with a face veil holding twin daggers",
           "TALISMAN MASTER: cultivator in a yellow and red robe holding a fan of glowing paper talismans",
           "SPELL CULTIVATOR: mage in a deep blue star-patterned robe holding a long staff topped with a floating fire orb",
           "ALCHEMIST HEALER: healer in a pale green robe carrying a small bronze pill cauldron and a gourd at the waist"],
    'sl': ["WARRIOR hunter in heavy steel plate armor with a large shield and a broadsword",
           "ASSASSIN hunter in a black leather bodysuit and scarf holding two curved daggers with purple glow",
           "ARCHER hunter in a green and brown ranger cloak drawing a big longbow",
           "MAGE hunter in a navy blue long coat holding a crystal staff with blue magic",
           "HEALER hunter in white and gold priest garments holding a holy staff with a golden light"],
}
GEN = {'m': 'male', 'f': 'female (long hair clearly visible from above)'}
for r in CLS:
    for g in 'mf':
        ref = f'ref_cls_{r}'
        grid([f'{r}_npc_0', f'{r}_npc_1', HERO[r][0], HERO[r][3]], 4, ref, up=4, padx=100, pady=120)
        n = f'cls_{r}_{g}'
        P[n] = ("16-bit pixel art top-down game character sprites, crisp hard pixels, dark 1px outline, rich shading, same art style, camera and scale as the reference "
                "(characters seen from DIRECTLY ABOVE, head at the centre, facing RIGHT). Solid flat magenta background, no shadow, no text. "
                f"Draw exactly 5 different {GEN[g]} characters in one row with wide magenta gaps, all the same size, each facing right holding their weapon to the right: "
                + "; ".join(f"{k + 1}) {d}" for k, d in enumerate(CLS[r])) + ". Wide landscape image.")
        REFS[n] = [ref]

P['cls_icons'] = ("Fantasy RPG class emblem icons, 16-bit pixel art, each icon a round shield-like badge with a dark border and a glowing symbol, crisp pixels, no text. "
    "Plain flat solid magenta background around the icons, wide gaps, a 5 columns x 3 rows grid of 15 icons, all the same size. "
    "Columns (same in every row): 1 WARRIOR crossed axe and shield (red), 2 ASSASSIN dagger and crescent moon (purple), 3 RANGER crosshair or bow and arrow (green), "
    "4 MAGE glowing orb and star (blue), 5 HEALER cross with leaves and light (gold). "
    "Row 1 post-apocalypse style (rusty metal, hazard stripes, the ranger icon is a rifle crosshair, the mage icon a lightning tesla coil, the healer icon a red medical cross). "
    "Row 2 ancient chinese xianxia style (jade and gold, the ranger icon is a glowing paper talisman, the healer icon a pill cauldron). "
    "Row 3 modern hunter fantasy style (steel and neon purple). Landscape image.")
REFS['cls_icons'] = []

os.makedirs(D, exist_ok=True)
for k, v in P.items(): open(os.path.join(D, k + '.txt'), 'w', encoding='utf-8').write(v)
json.dump({k: REFS.get(k, []) for k in P}, open(os.path.join(H, 'gen10_refs.json'), 'w'), indent=1)
print(len(P), 'prompts')
