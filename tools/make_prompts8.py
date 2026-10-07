"""Round 8 prompts: animated effects, projectiles, biome monsters, icons, UI frames."""
import os, json
from PIL import Image
H = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(H, 'prompts'); RAW = os.path.join(H, '..', 'assets', 'raw'); IMGD = os.path.join(H, '..', 'assets', 'img')
FXS = ("16-bit pixel art game VFX sprite sheet, crisp hard pixels, vivid glowing colors, no outline on glow. Plain flat solid magenta (#FF00FF) background, "
       "no text, no frame borders, no ground. Exactly 2 rows x 6 columns of animation frames; every frame sits alone in its own equal cell with WIDE magenta gaps, frames never touch. ")


def fx(a, b):
    return FXS + f"Row 1: a 6-frame animation of {a}, from first appearance to fading out. Row 2: a 6-frame animation of {b}, from first appearance to fading out. Landscape image."


P, REFS = {}, {}
P['fx_a'] = fx("a fiery explosion seen from above (small flash, expanding orange-yellow fireball, black smoke ring, embers, dissipating smoke)",
               "a melee slash: a crescent sword-swing arc of white-cyan light curving from top to bottom on the right side, growing then thinning out")
P['fx_b'] = fx("an impact hit spark: a white-yellow star burst with radiating lines, shrinking",
               "a frost nova seen from above: icy blue ring with ice crystal shards bursting outward, frost mist")
P['fx_c'] = fx("a lightning strike from the sky: a vertical jagged electric bolt (tall, thin) hitting the ground with a bright yellow-white flash and sparks",
               "a falling meteor fireball streaking diagonally down-left with a flaming tail, then an orange impact crater flash")
P['fx_d'] = fx("a swirling black hole vortex seen from above: dark purple spiral with a black core and violet sparkles rotating (looping frames)",
               "a green healing bloom: rising green leaves, plus-sign sparkles and a soft green light circle growing upward")
P['fx_e'] = fx("a teleport portal: a tall pillar of cyan-blue light beam with a glowing rune circle on the ground",
               "a golden level-up aura: a golden light column with rising stars, a golden ring on the ground and sparkles")
P['fx_f'] = fx("a ring of fire seen from above: a circle of burning flames flickering (looping frames)",
               "a toxic poison cloud seen from above: bubbling green gas puff with toxic bubbles, swirling (looping frames)")
P['projectiles'] = ("16-bit pixel art game projectile sprites, crisp pixels, glowing, every projectile drawn horizontally pointing RIGHT. Plain flat solid magenta background, wide gaps, "
  "4 columns x 3 rows grid of 12 projectiles: 1 yellow bullet tracer streak, 2 cluster of orange shotgun pellets with smoke trail, 3 green plasma rifle round, 4 cyan energy laser bolt, "
  "5 wooden arrow with feathers, 6 yellow paper fire talisman charm with red runes and flames, 7 glowing jade spirit orb with a swirling trail, 8 blue mana orb with sparkles, "
  "9 flying silver immortal sword with cyan glow, 10 green acid spit glob, 11 dark purple demonic orb, 12 black shadow blade crescent with purple edge. Landscape image.")
MON = {
    'md': ("post-apocalyptic zombies", ["a frozen zombie in a torn parka covered in ice and frost (snow)", "a mummified desert zombie wrapped in sand-crusted bandages (desert)",
            "a bloated toxic swamp zombie dripping green slime (swamp)", "a charred burning zombie with glowing embers in its cracks (volcano)",
            "a zombie overgrown with thorny vines and moss (forest)", "a skeletal ghoul with glowing red eyes in a ragged shroud (graveyard)"]),
    'tt': ("xianxia demon beasts and evil spirits", ["a white snow yeti spirit beast with frost breath (snow)", "a giant golden sand scorpion demon (desert)",
            "a green water serpent demon with fins (swamp)", "a fire salamander demon with flaming spines (volcano)",
            "a walking treant tree spirit with glowing green eyes (forest)", "a Chinese jiangshi hopping vampire in Qing dynasty robes with a paper talisman on the forehead (graveyard)"]),
    'sl': ("dungeon-gate fantasy monsters", ["an ice golem made of blue crystal blocks (snow)", "a giant armored desert scorpion with a glowing stinger (desert)",
            "a lizardman warrior with a spear (swamp)", "a fire hellhound with a burning mane (volcano)",
            "a giant forest spider with green markings (forest)", "an undead skeleton knight with a rusty sword and shield (graveyard)"]),
}
REFN = {'md': ['z_walker', 'z_runner', 'z_brute', 'z_spitter'], 'tt': [f'tt_e_{i}' for i in range(4)], 'sl': [f'sl_e_{i}' for i in range(4)]}
for r, names in REFN.items():
    ims = [Image.open(os.path.join(IMGD, n + '.png')).convert('RGBA') for n in names]
    ims = [im.resize((im.width * 4, im.height * 4), Image.NEAREST) for im in ims]
    cw = max(i.width for i in ims) + 100; ch = max(i.height for i in ims) + 100
    sheet = Image.new('RGBA', (cw * 4, ch), (255, 0, 255, 255))
    for k, im in enumerate(ims):
        sheet.alpha_composite(im, (k * cw + (cw - im.width) // 2, (ch - im.height) // 2))
    sheet.convert('RGB').save(os.path.join(RAW, f'ref_enemy_{r}.png'))
    theme, mons = MON[r]
    P[f'mon_{r}'] = ("16-bit pixel art top-down game monster sprites in EXACTLY the same style, scale, camera and shading as the reference image (seen from directly above, body facing RIGHT, "
                     "dark 1px outline, gritty detailed shading). Plain flat solid magenta background, wide gaps, 3 columns x 2 rows grid of 6 NEW monsters, each about the size of the reference creatures: "
                     + "; ".join(f"{i + 1} {m}" for i, m in enumerate(mons)) + f". Theme: {theme}. Landscape image.")
    REFS[f'mon_{r}'] = [f'ref_enemy_{r}']
P['icons'] = ("16-bit pixel art game UI icons, front view, crisp pixels, dark outline, gold and warm accents, each icon on a dark rounded-square badge. Plain flat solid magenta background, wide gaps, "
              "4 columns x 4 rows grid of 16 icons: 1 air strike (jets dropping bombs), 2 ten thousand flying swords raining down, 3 shadow soldiers rising from purple mist, 4 pause button, "
              "5 folded world map with a red pin, 6 leather backpack, 7 three-line menu scroll, 8 small house with a flag (home base), 9 glowing summoning altar with a star card, 10 anvil and hammer (crafting), "
              "11 speech bubble (chat), 12 four-corner expand arrows (fullscreen), 13 gear (settings), 14 quest scroll with a seal, 15 winged boot (dash), 16 radiant star burst (ultimate skill). Square image.")
P['ui_kit'] = ("16-bit pixel art game UI elements for a dark fantasy RPG HUD, crisp pixels, dark charcoal metal with bronze-gold trim and small corner ornaments. Plain flat solid magenta background, wide gaps. "
               "Top: one large SQUARE window panel frame, perfectly symmetrical, uniform border thickness about 1/12 of its width on all four sides, ornate gold corners, the inside is plain dark charcoal (#15131A). "
               "Bottom-left: one wide horizontal rounded button, dark with gold rim, empty (no text). Bottom-right: one long thin horizontal health-bar frame, empty dark slot inside with gold rim. Square image.")
os.makedirs(D, exist_ok=True)
for k, v in P.items():
    open(os.path.join(D, k + '.txt'), 'w', encoding='utf-8').write(v)
json.dump({k: REFS.get(k, []) for k in P}, open(os.path.join(H, 'gen8_refs.json'), 'w'), indent=1)
print(len(P), list(P))
