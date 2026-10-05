import os, json
D = os.path.join(os.path.dirname(__file__), "prompts")
os.makedirs(D, exist_ok=True)

S = ("16-bit pixel art game sprite, strict top-down view seen from directly overhead (bird-eye view, like Hotline Miami), "
     "crisp hard pixel edges, strong readable silhouettes with dark 1px outlines, detailed shading. Isolated on a plain flat "
     "transparent or solid magenta background, no ground, no cast shadow, no text, no watermark, no frame.")
I = ("16-bit pixel art game item icons, front 3/4 view, crisp pixels, dark outline, rich colors. Isolated on a plain flat "
     "solid magenta background, every icon separated by wide gaps, neat grid, all icons similar size. No text, no labels, no grid lines.")
T = ("Seamless tileable square texture for a 16-bit pixel art top-down game, viewed straight from above, flat even lighting, "
     "no perspective, no large objects, no shadows, crisp visible pixels, fills the entire image edge to edge, tiles seamlessly. No text. Square image. ")
PORT = ("16-bit pixel art character portrait, visual novel bust shot from chest up, facing slightly toward viewer, expressive face, "
        "detailed hair and clothing, soft rim light, simple dark vignette background, no text, no watermark, square image. ")
ART = "Epic detailed 16-bit pixel art illustration, wide cinematic landscape 16:9, rich lighting, no text, no letters, no logo, no watermark. "

HERO = (S + " A sprite sheet of ONE character shown 4 times in a single horizontal row, evenly spaced with wide gaps, same size and same "
        "layout as the reference image: seen from directly above, facing RIGHT. Keep the exact same pose layout as the reference "
        "(head and shoulders on the left part, arms and weapon extending to the right). The character: {who}. "
        "Copy 1: {w1}. Copy 2: {w2}. Copy 3: {w3}. Copy 4: {w4}. Landscape 16:9 image.")
ENEMY = (S + " A sprite sheet of 7 different enemies in a horizontal row with wide gaps, each facing RIGHT with arms or weapons reaching "
         "to the right, seen from directly above, same scale as the reference image. 1: {e1}. 2: {e2}. 3: {e3} (huge, twice as big). "
         "4: {e4}. 5: {e5}. 6: {e6}. 7: {e7} (giant boss, three times bigger). Landscape 16:9 image.")
PROPS = S.replace("top-down view seen from directly overhead", "top-down 3/4 view from above") + " A sprite sheet of 12 props arranged in a 4x3 grid with wide gaps: {items}. Square image."
NPC = S + " A sprite sheet of 4 different human characters in a single row with wide gaps, each facing RIGHT, seen from directly above, same scale as the reference: {items}. Landscape 16:9 image."

R = {
 "cy": dict(
   who="cyberpunk mercenary woman with short neon-pink hair, black techwear jacket with glowing cyan seams, cybernetic arm",
   w=["holding a compact glowing plasma pistol pointing right", "holding a bulky energy shotgun with glowing coils", "holding a long laser rifle with cyan glow", "gripping a glowing red heat katana held forward to the right"],
   e=["cyborg zombie with exposed wires and glowing red eye implant", "fast skinny android runner, chrome body", "huge heavy combat mech brute with hydraulic arms", "hovering laser drone with red lens", "riot enforcer robot with shield", "small explosive suicide drone glowing orange", "giant spider tank mech boss with plasma cannons"],
   props="1 neon vending machine glowing, 2 server rack crate with blinking lights, 3 toxic green chemical barrel, 4 neon street lamp, 5 sleek hover car magenta, 6 hover car cyan police, 7 cargo container crate small, 8 street food stall with neon umbrella, 9 holographic billboard kiosk, 10 power generator box, 11 metal barricade with hazard stripes, 12 cyber trash bin robot",
   npc="1 young man hacker with VR visor and hoodie, 2 street doctor woman in white coat with neon trim, 3 child in oversized jacket, 4 old mechanic man with goggles",
   tex={"ground": "Dark futuristic metal pavement tiles with thin glowing cyan seams and grime, cyberpunk street.", "road": "Wet black asphalt with faint neon pink and cyan reflections and puddles, no markings.", "floor": "Industrial metal grate floor with diagonal pattern, dark steel.", "roof": "Dark tech building rooftop with metal panels and tiny glowing vents.", "wall": "Top of a thick sci-fi concrete wall with steel plating and a thin neon strip."},
   port=["cyberpunk mercenary woman, neon-pink short hair, cybernetic arm, black techwear, confident smirk, magenta and cyan neon lighting", "cyberpunk netrunner young man, silver undercut hair, glowing tattoo lines, gentle tired eyes, cyan neon lighting"],
   art="A neon-drenched cyberpunk megacity at night in ruins, rain, holographic billboards, flying cars, a lone mercenary on a rooftop overlooking hordes of cyborg zombies, magenta and cyan palette.",
   icons="1 glowing plasma pistol, 2 energy shotgun, 3 laser rifle, 4 red heat katana"),
 "ct": dict(
   who="ancient Vietnamese warrior in dark indigo martial robes with a red sash, hair tied in a topknot, leather bracers",
   w=["holding a wooden crossbow pointing right", "holding an old matchlock musket gun pointing right", "drawing a long wooden bow aiming right", "gripping a straight steel sword held forward to the right"],
   e=["hopping jiangshi vampire corpse in Qing official robes with a yellow paper talisman on forehead, arms stretched forward", "gaunt hungry ghost with long black hair and pale skin, crawling fast", "huge ox-headed demon warrior with an axe", "nine-tailed fox spirit woman casting blue fire", "armored ghost soldier with spear and tattered banner", "floating paper lantern ghost about to explode", "giant ghost king general boss in black armor with flaming eyes and a huge halberd"],
   props="1 large ceramic water jar, 2 wooden supply chest, 3 red paper lantern post, 4 stone guardian lion statue, 5 stone water well, 6 haystack, 7 wooden ox cart, 8 market stall with straw roof, 9 bronze incense burner smoking, 10 clump of bamboo, 11 bamboo fence segment, 12 blossoming plum tree from above",
   npc="1 young scholar in white robes with a fan, 2 village girl in brown ao tu than with a basket, 3 old herbal doctor with a long beard, 4 little boy with a shaved head",
   tex={"ground": "Packed light brown earth village ground with small stones and fallen leaves.", "road": "Old grey cobblestone road, irregular rounded stones.", "floor": "Polished dark wooden temple floor planks.", "roof": "Dark grey-green glazed ceramic Asian roof tiles in curved rows.", "wall": "Top of a thick old red-brown brick and lime plaster wall, ancient."},
   port=["ancient Vietnamese swordswoman, long black hair with a red ribbon, indigo martial robes, determined gentle eyes, lantern light", "young ancient Vietnamese scholar-swordsman, long hair tied up, white and blue robes, calm warm smile, moonlight"],
   art="An ancient Vietnamese imperial capital at night under a blood-red moon, curved tile roofs, red lanterns, a lone swordswoman on a bridge facing hordes of hopping jiangshi corpses and ghosts, mist, red and indigo palette.",
   icons="1 wooden crossbow, 2 matchlock musket, 3 long bow with arrows, 4 straight steel sword"),
 "tt": dict(
   who="young Taoist cultivator in flowing white and pale blue robes with long black hair and a jade hairpin",
   w=["one palm extended to the right throwing a glowing yellow paper talisman", "holding a glowing jade gourd pointing right", "holding a long staff with a glowing blue orb pointing right", "holding a glowing azure flying sword forward to the right"],
   e=["blood-zombie cultivator corpse in torn robes with red veins", "black demon wolf with glowing red eyes running", "giant stone golem guardian covered in moss", "demonic cultivator in black robes casting purple fire", "armored demon soldier with horns and a glaive", "bloated poison blood toad about to burst", "giant nine-headed serpent demon boss, purple and black scales"],
   props="1 glowing spirit herb plant, 2 cluster of blue spirit stone crystals, 3 jade altar with incense, 4 bronze alchemy cauldron with green smoke, 5 ancient stone stele with carvings, 6 ornate treasure chest red and gold, 7 giant lotus leaf on water, 8 pagoda stone lantern glowing, 9 peach blossom tree from above, 10 white pine tree from above, 11 mossy boulder, 12 meditation cushion with a scroll",
   npc="1 young female disciple in pink robes, 2 old sect elder with white beard, 3 boy disciple carrying firewood, 4 wounded swordsman in grey robes",
   tex={"ground": "Lush mystical green grass with tiny white and pink flowers and soft glowing motes.", "road": "White jade marble paving stones path, clean and elegant.", "floor": "Polished light jade green stone floor tiles.", "roof": "Emerald green glazed curved roof tiles of a Chinese sect palace with gold trim.", "wall": "Top of an elegant white plaster palace wall with dark grey tile cap."},
   port=["beautiful immortal cultivator woman with long silver hair, white and azure robes, cold but kind eyes, floating glowing petals", "handsome sword cultivator man with long black hair, black and gold robes, gentle proud smile, lightning sparks"],
   art="A mystical xianxia cultivation world, floating mountains with pagodas, waterfalls, a white-robed cultivator riding a flying sword facing a giant nine-headed demon serpent and a demonic horde, glowing clouds, jade and gold palette.",
   icons="1 yellow paper talisman glowing, 2 jade gourd, 3 staff with blue orb, 4 azure flying sword"),
 "sl": dict(
   who="young male hunter with messy black hair, long black coat, glowing blue eyes, dark aura",
   w=["holding a black pistol pointing right", "holding a dark crossbow pointing right", "both hands casting a swirling dark-blue shadow orb to the right", "gripping a long black dagger with purple glow held forward to the right"],
   e=["green goblin with a rusty knife", "giant black soldier ant with mandibles", "huge orc brute with an iron club", "dark elf mage casting purple magic", "armored skeleton knight with a sword and shield", "bouncing explosive red slime", "giant blood-red armored knight boss with a great sword and glowing eyes"],
   props="1 ornate dungeon treasure chest, 2 wall torch brazier burning, 3 pile of bones and skulls, 4 glowing blue mana crystal cluster, 5 broken stone pillar, 6 iron spike floor trap, 7 dark stone altar with candles, 8 wooden barrel, 9 iron prison cage with a door, 10 swirling blue dungeon gate portal rift, 11 stone stairs going down into darkness, 12 swirling red dangerous gate portal rift",
   npc="1 female healer hunter in white and gold armor, 2 young male tank hunter with a big shield, 3 injured civilian office worker, 4 girl in school uniform",
   tex={"ground": "Dark dungeon cave floor of rough stone slabs with cracks and moss.", "road": "Ancient dungeon stone brick floor, worn, dark grey.", "floor": "Dark purple-grey runic dungeon floor tiles with faint glowing runes.", "roof": "Rough dark cave rock ceiling seen from above, jagged.", "wall": "Top of a massive dark stone dungeon wall, rough blocks."},
   port=["confident female S-rank healer hunter, long blonde hair, white and gold armor, warm bright smile, holy light particles", "stoic young male hunter with black hair and glowing blue eyes, black coat, faint smile, shadow aura"],
   art="A modern city with a giant glowing blue dungeon gate portal tearing open the sky, a lone hunter in a black coat raising an army of shadow soldiers with glowing blue eyes against a horde of monsters, dramatic purple and blue palette.",
   icons="1 black pistol, 2 dark crossbow, 3 shadow orb, 4 black dagger with purple glow"),
}

P = {}
for k, r in R.items():
    P[f"{k}_hero"] = (HERO.format(who=r["who"], w1=r["w"][0], w2=r["w"][1], w3=r["w"][2], w4=r["w"][3]), "player")
    e = r["e"]
    P[f"{k}_enemies"] = (ENEMY.format(e1=e[0], e2=e[1], e3=e[2], e4=e[3], e5=e[4], e6=e[5], e7=e[6]), "zombies")
    P[f"{k}_props"] = (PROPS.format(items=r["props"]), None)
    P[f"{k}_npc"] = (NPC.format(items=r["npc"]), "player")
    for t, d in r["tex"].items():
        P[f"tex_{k}_{t}"] = (T + d, None)
    P[f"{k}_port1"] = (PORT + r["port"][0], None)
    P[f"{k}_port2"] = (PORT + r["port"][1], None)
    P[f"{k}_art"] = (ART + r["art"], None)
    P[f"{k}_icons"] = (I + " A 4 columns x 1 row grid of 4 weapon icons: " + r["icons"] + ". Landscape image.", None)
# modern additions
P["md_npc"] = (NPC.format(items="1 female paramedic survivor with a red jacket and ponytail, 2 male ex-soldier survivor with a beanie, 3 little girl holding a teddy bear, 4 old man in a cardigan"), "player")
P["md_port1"] = (PORT + "female paramedic survivor, brown ponytail, red jacket with dirt and a bandage on cheek, brave tired smile, warm firelight, post-apocalyptic", None)
P["md_port2"] = (PORT + "male ex-soldier survivor with short beard and grey beanie, olive jacket, kind protective eyes, warm firelight, post-apocalyptic", None)
P["relics"] = (I + " A 4 columns x 3 rows grid of 12 magical relic accessories: glowing red heart amulet, winged boots, golden crown with gem, ring with blue flame, skull talisman with purple glow, ancient bronze mirror, feather of a phoenix, jade pendant, cybernetic chip glowing, lightning bracer, shadow cloak clasp, hourglass with sand. Square image.", None)
P["fx_misc"] = (S + " A sprite sheet of 8 objects in a 4x2 grid with wide gaps: 1 swirling blue magic portal rift seen from above, 2 swirling red portal rift, 3 stone stairs going down seen from above, 4 glowing golden treasure chest, 5 campfire with logs burning seen from above, 6 sleeping bag bedroll, 7 iron cage with prisoner inside seen from above, 8 glowing pink heart crystal. Square image.", None)

meta = {}
for k, (prompt, ref) in P.items():
    with open(os.path.join(D, k + ".txt"), "w", encoding="utf-8") as f:
        f.write(prompt)
    meta[k] = ref
json.dump(meta, open(os.path.join(os.path.dirname(__file__), "gen2_refs.json"), "w"), indent=1)
print(len(P))
