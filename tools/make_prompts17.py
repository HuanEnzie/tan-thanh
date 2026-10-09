"""Round 17: sea creatures + boat per realm (top-down, facing right, magenta background)."""
import os, json
from PIL import Image
H = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(H, 'prompts'); RAW = os.path.join(H, '..', 'assets', 'raw'); IMGD = os.path.join(H, '..', 'assets', 'img')
REF = {'md': ['z_brute', 'z_spitter'], 'tt': ['tt_e_2', 'tt_e_6'], 'sl': ['sl_e_2', 'sl_e_6']}
SET = {
 'md': ("a zombie post-apocalypse world where the sea is polluted and mutated",
        ["a giant mutated eel with sickly green skin, glowing pustules and torn fins (long, S-shaped)", "a bloated mutant crab with rusty-orange shell, one huge claw and bone spikes", "a toxic jellyfish with glowing yellow-green bell and trailing tentacles", "a zombie shark with rotting grey flesh, exposed ribs and red eyes", "a colossal mutated octopus-kraken with oil-black skin, many spread tentacles and a cracked beak (BOSS, the largest)", "a drowned zombie swimmer, bloated blue-grey humanoid swimming with arms stretched forward"],
        "a patched-together small rusty fishing boat with a little outboard motor, planks and tarp, seen from directly above, bow pointing right"),
 'tt': ("a Chinese xianxia world with water spirits and sea demons",
        ["a jade-scaled water-serpent spirit like a slender azure dragon eel with flowing whiskers (long, S-shaped)", "a crab spirit with a jade-green carved shell, golden talisman marks and big pincers", "a ghostly lantern jellyfish spirit with pale blue glowing bell and ribbon-like tentacles", "a young giao-dragon shark with dark blue scales, golden fins and pearl eyes", "a colossal azure sea dragon with a long coiling body, golden mane and antlers (BOSS, the largest)", "a drowned female water-ghost with long black hair floating around, pale robed body swimming forward"],
        "an ornate wooden Chinese junk-style small boat with a folded red sail, lanterns and carved bow, seen from directly above, bow pointing right"),
 'sl': ("a modern monster-hunter world where dimensional gates leak abyssal sea monsters",
        ["an abyssal eel with black skin and glowing violet veins, long S-shaped body", "an armoured crab beast with obsidian shell, purple glowing cracks and huge claws", "a neon jellyfish with electric-blue glowing bell and long luminous tentacles", "a shadow shark with dark violet hide, glowing blue eye and razor fins", "a leviathan sea serpent with huge armoured head and coiled glowing body (BOSS, the largest)", "a drowned armoured knight swimming with glowing purple eyes, seaweed on his armour"],
        "a sleek modern hunter-guild patrol boat with a mounted purple-glow lamp, seen from directly above, bow pointing right"),
}
P, REFS = {}, {}
for r, (world, mons, boat) in SET.items():
    for k, n in enumerate(REF[r]): Image.open(os.path.join(IMGD, n + '.png')).convert('RGBA').save(os.path.join(RAW, f'ref17_{r}_{k}.png'))
    n = f'sea17_{r}'
    P[n] = ("16-bit painterly pixel-art top-down game sprites, crisp hard pixels, dark 1px outline, rich shading, same art style, camera angle and level of detail as the reference images (creatures seen from DIRECTLY ABOVE). "
            f"Solid flat magenta (#ff00ff) background, no shadow, no text. The world is {world}. Draw exactly 7 separate sprites with wide magenta gaps, in 2 rows (first row 4 sprites, second row 3 sprites), all facing RIGHT: "
            + "; ".join(f"{i + 1}) {m}" for i, m in enumerate(mons)) + f"; 7) {boat}. Sprite 5 is clearly larger than the rest. Landscape image.")
    REFS[n] = [f'ref17_{r}_0', f'ref17_{r}_1']
os.makedirs(D, exist_ok=True)
for k, v in P.items(): open(os.path.join(D, k + '.txt'), 'w', encoding='utf-8').write(v)
json.dump(REFS, open(os.path.join(H, 'gen17_refs.json'), 'w'), indent=1)
print(len(P), 'prompts')
