"""Round 4 prompts: chests, armor, melee variety, cultivation items, currency, biome textures/props, extra bosses, portrait expressions."""
import os, json
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prompts')
P = {}; REFS = {}

ICON = ("16-bit pixel art game item icons, front 3/4 view, crisp pixels, dark outline, rich colors. "
        "Isolated on a plain flat solid magenta background, every icon separated by wide gaps, neat grid, all icons similar size. "
        "No text, no labels, no numbers, no frames, no grid lines. ")
TOP = ("16-bit pixel art game sprite, strict top-down 3/4 view from above (bird-eye view, like Hotline Miami), crisp hard pixel edges, "
       "strong readable silhouettes with dark 1px outlines, detailed shading. Isolated on a plain flat transparent or solid magenta background, "
       "no ground, no cast shadow, no text, no watermark, no frame. ")
TEX = ("Seamless tileable square texture for a 16-bit pixel art top-down game, viewed straight from above, flat even lighting, no perspective, "
       "no large objects, no shadows, crisp visible pixels, fills the entire image edge to edge, tiles seamlessly. No text. Square image. ")

P['chests'] = TOP + ("A sprite sheet of 8 treasure chests in a 4 columns x 2 rows grid with wide gaps, all the same size, seen from a high 3/4 angle. "
    "Top row CLOSED chests: 1 plain wooden chest with iron bands, 2 silver chest with engraved steel trim, 3 ornate golden chest with red gems, "
    "4 diamond chest made of glowing cyan crystal with white gold trim. Bottom row the SAME four chests OPEN, lid raised, glowing light and treasure spilling out "
    "(wood: few coins; silver: silver light; gold: gold coins and gems; diamond: radiant cyan beam and jewels). Square image.")

ARMOR = {
    'md': 'post-apocalyptic survivor gear: 1 military combat helmet with goggles, 2 tactical kevlar vest with pouches, 3 cargo combat trousers with knee pads, 4 heavy leather combat boots',
    'tt': 'Chinese cultivation xianxia gear: 1 jade and silver hair crown with ribbons, 2 flowing white and azure immortal robe with gold embroidery, 3 silk cultivator trousers with cloud patterns, 4 cloud-stepping boots with jade ornaments',
    'sl': 'dark fantasy hunter gear: 1 black hooded mask with glowing purple eyes, 2 black long coat armor with purple runes, 3 black armored leggings, 4 black armored boots with purple glow',
}
for r, t in ARMOR.items():
    P[f'{r}_armor'] = ICON + f"A 4 columns x 1 row grid of 4 equipment icons, {t}. Landscape image."

MELEE = {
    'md': 'improvised and real melee weapons: 1 combat knife, 2 katana, 3 fire axe, 4 sledgehammer, 5 spear made from a pipe with a blade, 6 farm scythe, 7 big rusty cleaver greatsword, 8 spiked brass knuckles',
    'tt': 'xianxia cultivation melee weapons: 1 jade dagger, 2 slender azure jian sword glowing, 3 crescent battle axe with gold, 4 heavy bronze war hammer with runes, 5 dragon spear with red tassel, 6 dark moon scythe with purple glow, 7 giant heavy broadsword with jade inlay, 8 golden tiger claw gauntlets',
    'sl': 'dark fantasy hunter melee weapons: 1 black dagger with purple glow, 2 knight longsword, 3 orc battle axe, 4 spiked war hammer, 5 knight lance spear, 6 death scythe, 7 huge black greatsword with red runes, 8 demon claw gauntlets',
}
for r, t in MELEE.items():
    P[f'{r}_melee'] = ICON + f"A 4 columns x 2 rows grid of 8 weapon icons, each weapon drawn diagonally pointing up-right, {t}. Square image."

P['tt_items'] = ICON + ("A 4 columns x 4 rows grid of 16 xianxia cultivation consumable icons: 1 porcelain bottle of healing pills with red seal, "
    "2 roll of herbal cloth bandage with green leaves, 3 single glowing golden elixir pill, 4 glowing spirit peach fruit, 5 candied hawthorn on a stick, "
    "6 jade gourd of spring water, 7 cup of steaming spirit tea, 8 red fire talisman paper burning, 9 purple thunder talisman paper with lightning, "
    "10 bundle of spirit wood logs, 11 chunk of raw spirit ore, 12 small clay jar of spirit oil, 13 large glowing blue spirit stone, "
    "14 stack of yellow talisman papers, 15 floating green spirit flame orb, 16 small pile of blue spirit stones. Square image.")

P['shop_icons'] = ICON + ("A 4 columns x 2 rows grid of 8 icons: 1 pile of shiny gold coins, 2 pile of glowing blue spirit stones, 3 cluster of purple mana crystals, "
    "4 ornate golden key, 5 wrapped mystery loot box with question mark glow (no letters), 6 rolled magic scroll with a portal swirl, 7 red heart crystal, 8 merchant scale balance. Landscape image.")

TEXS = {
    'tex_snow': 'Fresh white snow with soft blue shadows, footprints-free, tiny sparkles and a few small pebbles.',
    'tex_swamp': 'Murky dark green swamp mud with puddles of dark water, moss and small reeds.',
    'tex_ash': 'Volcanic black ash ground with dark grey cinders and a few thin glowing orange cracks.',
    'tex_mycel': 'Purple mushroom mycelium ground with tiny glowing cyan spores and small mushrooms.',
    'tex_crystal': 'Dark blue rocky cave ground with small embedded glowing violet and cyan crystal shards.',
    'tex_sakura': 'Soft green grass covered with fallen pink cherry blossom petals.',
    'tex_desert': 'Warm orange desert sand with wind ripples and tiny stones.',
    'tex_jungle': 'Dense dark jungle undergrowth with large leaves, ferns and roots.',
    'tex_ice': 'Frozen lake ice, pale cyan with white cracks and frost.',
    'tex_lava': 'Molten glowing lava flow, bright orange and yellow with dark crust plates.',
    'tex_grave': 'Graveyard ground: dark dead grass, grey dirt, scattered bones and dry leaves.',
    'tex_leaves': 'Forest floor covered with orange, red and brown autumn leaves and twigs.',
}
for k, t in TEXS.items():
    P[k] = TEX + t

P['biome_a'] = TOP + ("A sprite sheet of 8 nature props seen from above in a 4x2 grid with wide gaps: 1 snowy pine tree, 2 big block of blue ice crystal, "
    "3 green saguaro cactus, 4 bleached animal skull with dry bush, 5 palm tree crown, 6 giant red mushroom with white spots, "
    "7 cluster of glowing blue mushrooms, 8 cluster of big purple crystals glowing. Square image.")
P['biome_b'] = TOP + ("A sprite sheet of 8 nature props seen from above in a 4x2 grid with wide gaps: 1 black volcanic rock with glowing lava cracks, "
    "2 dead twisted swamp tree with hanging moss, 3 cluster of reeds and lily pads, 4 old cracked tombstone with a cross, 5 pink cherry blossom tree canopy, "
    "6 green bamboo cluster, 7 red maple tree canopy, 8 giant jungle fern tree. Square image.")

BOSS = {
    'md': '1: hulking tank zombie with rusty metal plates bolted on, 2: giant mutant spider-woman zombie with long legs, 3: burning firefighter zombie engulfed in flames with an axe, 4: mad scientist necromancer in a bloody lab coat with green syringes',
    'tt': '1: flaming phoenix demon with spread fire wings, 2: white nine-tailed ice fox spirit, 3: blood demon lord in crimson armor with a giant blade, 4: giant thunder tortoise with a crackling shell',
    'sl': '1: ice elf king with a frost crown and spear, 2: skeletal lich in purple robes with a staff, 3: giant ant queen with wings and claws, 4: horned demon king with a flaming sword',
}
for r, t in BOSS.items():
    P[f'{r}_bosses'] = TOP + ("A sprite sheet of 4 different giant boss monsters in a horizontal row with wide gaps, each facing RIGHT, seen from directly above, "
        f"big menacing silhouettes, all similar size. {t}. Landscape 16:9 image.")

EXPR = {
    'happy': 'a bright warm happy smile, eyes slightly closed with joy',
    'sad': 'a sad expression, teary glistening eyes, eyebrows raised in the middle, small frown',
    'angry': 'an angry expression, furrowed brows, clenched teeth, fierce glare',
    'blush': 'a shy flustered expression, strong pink blush on the cheeks, looking slightly away, small embarrassed smile',
    'surprised': 'a shocked surprised expression, wide eyes, open mouth',
}
for r in ['md', 'tt', 'sl']:
    for i in (1, 2):
        for e, t in EXPR.items():
            n = f'{r}_port{i}_{e}'
            P[n] = ("Same character as the reference image, identical art style, identical pixel art rendering, same hair, same outfit, same framing, same background and lighting. "
                    f"Change ONLY the facial expression and slight head pose to: {t}. Square image, no text.")
            REFS[n] = [f'{r}_port{i}']

os.makedirs(D, exist_ok=True)
for k, v in P.items():
    open(os.path.join(D, k + '.txt'), 'w', encoding='utf-8').write(v)
    REFS.setdefault(k, [])
json.dump(REFS, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gen4_refs.json'), 'w'), indent=1)
print(len(P), 'prompts')
