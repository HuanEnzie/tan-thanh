"""Round 7 prompts: mounts, outfits, breakthrough materials, skill icons, survivor shelters."""
import os, json
from PIL import Image
H = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(H, 'prompts'); RAW = os.path.join(H, '..', 'assets', 'raw'); IMGD = os.path.join(H, '..', 'assets', 'img')
TOP = ("16-bit pixel art game sprite, high top-down 3/4 view (like classic top-down RPGs), crisp hard pixel edges, "
       "strong readable silhouettes with dark 1px outlines, rich detailed shading, vibrant colors. Isolated on a plain flat solid magenta background, "
       "no ground tiles, no cast shadow, no text, no watermark, no frame. ")
ICON = ("16-bit pixel art game item icons, front 3/4 view, crisp pixels, dark outline, rich colors. "
        "Isolated on a plain flat solid magenta background, every icon separated by wide gaps, neat grid, all icons similar size. No text. ")
P, REFS = {}, {}
P['mounts'] = ("16-bit pixel art game sprites seen from DIRECTLY ABOVE (pure top-down, bird's eye view), every creature facing RIGHT, crisp pixels, dark outline. "
  "Isolated on a plain flat solid magenta background, no shadow, no text. The reference shows 8 cute pets. Draw each of these 8 creatures again as a LARGE rideable mount "
  "with a small saddle on its back, seen from directly above with its head pointing to the right and body stretched horizontally, in the same order in a 4 columns x 2 rows grid with wide gaps, all similar size: "
  "1 fire fox, 2 ice dragon with wings spread, 3 lucky golden cat, 4 glowing pink jellyfish, 5 thunder bird with wings spread, 6 stone golem beast, 7 ghost lantern spirit cloud, 8 crystal fairy beast. Landscape image.")
REFS['mounts'] = ['pets']
OUT = {
 'md': ["a post-apocalyptic scavenger outfit: patched brown leather jacket, olive cargo backpack, red bandana over the face, knee pads",
        "military tactical armor: dark green kevlar plate vest, black combat helmet with goggles, ammo pouches and shoulder pads",
        "a legendary power exoskeleton: sleek dark steel armored suit with glowing orange energy lines, armored helmet and a long crimson cape"],
 'tt': ["an outer-disciple cultivation sect robe: light blue robe with a white sash, simple hair bun",
        "an inner-disciple battle robe: layered white and jade green robe with silver shoulder guards and flowing ribbons",
        "a celestial immortal robe: flowing gold and white robe with glowing runes, a floating golden halo ring behind the head and a long trailing cape"],
 'sl': ["a rookie hunter outfit: dark grey hoodie with a leather chest guard and fingerless gloves",
        "elite hunter armor: black plated armor with purple trim, shoulder plates and a short dark cape",
        "the Shadow Monarch armor: full black spiked plate armor, horned helmet with glowing purple eyes, long tattered dark cape and a faint purple aura"],
}
HERO = {'md': ['p_pistol', 'p_shotgun', 'p_rifle', 'p_bat'], 'tt': [f'tt_hero_{i}' for i in range(4)], 'sl': [f'sl_hero_{i}' for i in range(4)]}
for r, names in HERO.items():
    ims = [Image.open(os.path.join(IMGD, n + '.png')).convert('RGBA') for n in names]
    ims = [im.resize((im.width * 5, im.height * 5), Image.NEAREST) for im in ims]
    cw = max(i.width for i in ims) + 120; ch = max(i.height for i in ims) + 160
    sheet = Image.new('RGBA', (cw * 2, ch * 2), (255, 0, 255, 255))
    for k, im in enumerate(ims):
        x = (k % 2) * cw + (cw - im.width) // 2; y = (k // 2) * ch + (ch - im.height) // 2
        sheet.alpha_composite(im, (x, y))
    sheet.convert('RGB').save(os.path.join(RAW, f'ref_hero_{r}.png'))
    for t, o in enumerate(OUT[r]):
        n = f'outfit_{r}_{t + 1}'
        P[n] = ("16-bit pixel art top-down game sprites, crisp hard pixels, dark outline, solid flat magenta background, no shadow, no text. "
                "The reference image shows 4 sprites of the SAME hero seen from DIRECTLY ABOVE (top-down), facing RIGHT, each holding a different weapon. "
                "Redraw all 4 sprites in exactly the same 2 columns x 2 rows layout with wide gaps, keeping the same top-down camera, same facing direction (right), "
                f"same body pose and the same weapon in each sprite, same proportions, but now the hero wears {o}. Keep each sprite compact and clearly separated. Landscape image.")
        REFS[n] = [f'ref_hero_{r}']
P['bt_items'] = ICON + ("A 3 columns x 3 rows grid of 9 crafting material icons for character breakthrough. Row 1 (post-apocalypse): "
  "1 small glass vial of glowing green virus sample, 2 syringe of glowing red mutation serum, 3 ornate golden evolution core gem with metal frame. "
  "Row 2 (xianxia cultivation): 4 bundle of glowing green spirit herbs tied with red string, 5 glowing crimson demon beast core pearl with dark aura, "
  "6 golden breakthrough elixir pill on an open jade box. Row 3 (hunter fantasy): 7 jagged purple mana crystal shard, 8 glowing blue monster heart core, "
  "9 golden awakening rune stone with glowing symbols. Square image.")
P['skills'] = ("Fantasy action game ability icons, 16-bit pixel art, each icon a square tile with dark rounded border and glowing effect, crisp pixels, no text. "
  "Plain flat solid magenta background around the icons, wide gaps, a 4 columns x 2 rows grid of 8 icons: 1 flaming meteors raining down, 2 icy frost nova snowflake burst, "
  "3 forked chain lightning, 4 swirling black hole purple vortex, 5 green healing bloom with leaves and plus sign, 6 ring of orbiting spinning blades, "
  "7 shadow assassin dash with afterimages, 8 ring of fire inferno. Landscape image.")
P['shelter'] = TOP + ("A sprite sheet of 9 objects in a 3 columns x 3 rows grid with wide gaps, all similar size. Row 1 (post-apocalyptic survivor camp): "
  "1 tall scrap-metal watchtower with a lookout platform and a searchlight, 2 barricade gate made of wrecked cars, sandbags and a chain-link fence door, "
  "3 large survivor mess tent with supply crates and a hanging lantern. Row 2 (ancient chinese mountain village): 4 wooden watchtower pavilion with a red lantern, "
  "5 ornate wooden village gate archway with a tiled roof, 6 small village elder house with curved tiled roof. Row 3 (modern hunter association): "
  "7 metal outpost tower with a blue banner and antenna, 8 security checkpoint gate with a blue force field, 9 field command tent with a glowing hologram table. Square image.")
os.makedirs(D, exist_ok=True)
for k, v in P.items(): open(os.path.join(D, k + '.txt'), 'w', encoding='utf-8').write(v)
json.dump({k: REFS.get(k, []) for k in P}, open(os.path.join(H, 'gen7_refs.json'), 'w'), indent=1)
print(len(P))
