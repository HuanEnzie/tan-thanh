import os
D = os.path.join(os.path.dirname(__file__), "prompts")
os.makedirs(D, exist_ok=True)

S = ("16-bit pixel art game sprite, strict top-down view seen from directly overhead (bird-eye view, like Hotline Miami "
     "or classic top-down shooters), crisp hard pixel edges, gritty muted post-apocalyptic palette with strong readable "
     "silhouettes and dark 1px outlines. Isolated on a perfectly flat solid pure magenta #FF00FF background filling the whole "
     "image, no ground, no cast shadow, no gradient, no text, no watermark, no frame.")
I = ("16-bit pixel art game item icons, front 3/4 view, crisp pixels, dark outline, gritty post-apocalyptic survival game "
     "inventory style. Isolated on a perfectly flat solid pure magenta #FF00FF background, every icon clearly separated by "
     "wide magenta gaps, arranged in a neat grid, all icons similar size. No text, no labels, no numbers, no frames, no grid lines.")
T = ("Seamless tileable square texture for a 16-bit pixel art top-down game, viewed straight from above, flat even lighting, "
     "no perspective, no objects, no shadows, crisp visible pixels, texture fills the entire image edge to edge, must tile "
     "seamlessly. No text. Square image. ")

P = {
"player": S + """
A sprite sheet of ONE survivor character shown 4 times in a single horizontal row, evenly spaced with wide magenta gaps between them, all the same size. The character: rugged male survivor seen from directly above (we see the top of his head with short dark hair, shoulders with an olive green military jacket, a small brown backpack on his back). Every copy faces RIGHT (toward the right edge of the image). Copy 1: both arms extended to the right holding a black pistol. Copy 2: holding a pump shotgun pointing right. Copy 3: holding an assault rifle pointing right. Copy 4: gripping a wooden baseball bat with nails held forward to the right. Landscape 16:9 image.""",
"zombies": S + """
A sprite sheet of 5 different zombies in a single horizontal row, evenly spaced with wide magenta gaps, every zombie facing RIGHT (toward the right edge) with arms reaching forward to the right, seen from directly above (we see the tops of their heads and shoulders). 1: shambling walker zombie, grey-green rotten skin, torn blue shirt, bloody. 2: skinny fast runner zombie, pale, ragged red hoodie, hunched. 3: huge hulking brute zombie, twice as large, massive muscular shoulders, torn white tank top, exposed flesh. 4: bloated spitter zombie with sickly toxic green glowing pustules and acid dripping. 5: zombie in a dark navy police uniform with a vest. Landscape 16:9 image.""",
"zombies2": S + """
A sprite sheet of 4 more zombies in a single horizontal row, evenly spaced with wide magenta gaps, every one facing RIGHT (toward the right edge) with arms reaching to the right, seen from directly above. 1: exploding boomer zombie, swollen orange-red belly with glowing cracks, about to burst. 2: zombie in a torn yellow hazmat suit. 3: zombie nurse in pale green scrubs, bloodstained. 4: a giant boss zombie mutant, very large, grotesque with bone spikes on its back and purple tumors. Landscape 16:9 image.""",
"items1": I + """
A 4 columns x 3 rows grid of 12 icons, in this order left-to-right, top-to-bottom: black pistol, pump shotgun, assault rifle, wooden baseball bat with nails, machete, small box of pistol ammo, red shotgun shells, rifle magazine, white first aid medkit with red cross, rolled bandage, canned food tin, plastic water bottle. Square image.""",
"items2": I + """
A 4 columns x 3 rows grid of 12 icons, in this order left-to-right, top-to-bottom: molotov cocktail bottle with burning rag, green hand grenade, stack of wooden planks, pile of scrap metal and gears, red gasoline jerry can, electronic radio circuit board part with antenna, battery, rusty key, energy drink can, pill bottle painkillers, flashlight, chocolate bar. Square image.""",
"vehicles": S + """
A sprite sheet of 4 abandoned wrecked cars seen from directly above, all oriented horizontally pointing RIGHT, arranged in a 2x2 grid with wide magenta gaps: 1: rusty red sedan with broken windshield. 2: black-and-white police car with smashed light bar. 3: burnt-out charred car husk, black and rusted. 4: white ambulance with blood smears. Detailed roofs, windows, realistic proportions. Landscape 16:9 image.""",
"vehicles2": S + """
A sprite sheet of 3 big vehicles seen from directly above, all oriented horizontally pointing RIGHT, stacked vertically with wide magenta gaps: 1: long yellow school bus, dirty and abandoned. 2: military green army truck with canvas cover. 3: a military rescue helicopter with rotor blades, olive drab. Landscape 16:9 image.""",
"nature": S + """
A sprite sheet of nature props seen from directly above, arranged in a 4x2 grid with wide magenta gaps: 1: large leafy oak tree canopy, round, dark green. 2: pine tree from above, star shaped, dark green. 3: dead leafless tree with twisted bare branches. 4: autumn tree canopy orange-brown. 5: green bush shrub. 6: grey boulder rock. 7: cluster of small rocks. 8: patch of tall dry grass weeds. Square image.""",
"props": S + """
A sprite sheet of urban apocalypse props seen from directly above, arranged in a 4x3 grid with wide magenta gaps: 1: rusty red oil barrel (round top). 2: wooden supply crate. 3: green metal dumpster with lid. 4: pile of black trash bags. 5: sandbag barricade wall (horizontal). 6: concrete jersey barrier (horizontal). 7: burning fire barrel with flames. 8: wooden park bench. 9: olive green military ammo crate. 10: wooden fence segment, horizontal. 11: street lamp post. 12: broken vending machine. Square image.""",
"decals": """16-bit pixel art game decals, top-down view, crisp pixels. Isolated on a perfectly flat solid pure magenta #FF00FF background, each decal separated by wide magenta gaps, arranged in a 4x2 grid. 1-4: four different dark red blood splatter pools and splashes. 5: green toxic acid puddle. 6: black scorch burn mark. 7: dead zombie corpse lying on the ground, top-down, bloody. 8: cracked asphalt pothole. No text. Square image.""",
"buildings": S + """
A sprite sheet of 3 landmark structures seen from directly above, in a single row with wide magenta gaps: 1: a tall radio transmission tower with red-white lattice and a satellite dish. 2: a helipad: concrete square with a big yellow circle (no letters inside). 3: a military checkpoint tent, olive canvas. Landscape 16:9 image.""",
"tex_grass": T + "Slightly overgrown dark green grass with tiny weeds, post-apocalyptic muted tone.",
"tex_asphalt": T + "Dark grey cracked old asphalt road surface with small cracks and grit, no road markings.",
"tex_sidewalk": T + "Light grey concrete sidewalk paving slabs in a square grid pattern, slightly dirty and cracked.",
"tex_dirt": T + "Brown dry dirt ground with small pebbles.",
"tex_wood": T + "Worn wooden plank floor boards running horizontally, warm brown, scratched.",
"tex_tile": T + "Dirty white and grey checkered ceramic floor tiles with grime.",
"tex_water": T + "Dark murky blue-green water surface with subtle ripples.",
"tex_roof": T + "Building rooftop: grey tar gravel flat roof surface.",
"tex_roof2": T + "Red-brown clay roof shingles in rows.",
"tex_sand": T + "Pale yellow beach sand.",
"title": """Epic 16-bit pixel art key art for a zombie apocalypse survival game title screen. Wide cinematic landscape 16:9. A ruined overgrown city skyline at blood-red sunset, collapsed skyscrapers, smoke columns, abandoned cars on a cracked highway, a lone survivor silhouette with a backpack and rifle standing on top of a wrecked car in the foreground, a massive horde of shambling zombie silhouettes approaching from the distance, crows in the sky, glowing embers. Dramatic rim lighting, rich detailed pixel art, moody orange red purple palette. Leave the upper-middle third of the sky relatively clean and darker for a title logo. No text, no letters, no logo, no watermark.""",
"gameover": """16-bit pixel art illustration, wide 16:9 landscape: dark rainy night, a zombie hand bursting from bloody ground next to a dropped survivor backpack and broken rifle, moonlight, grim muted palette with deep red accents, vignette. No text, no letters, no watermark.""",
"victory": """16-bit pixel art illustration, wide 16:9 landscape: dawn sunrise over a ruined city, a military rescue helicopter flying away into the golden sky with a survivor waving from its open door, zombies left below on rooftops, hopeful warm golden orange palette. No text, no letters, no watermark.""",
}
for k, v in P.items():
    with open(os.path.join(D, k + ".txt"), "w", encoding="utf-8") as f:
        f.write(v.strip())
print(" ".join(P.keys()))
