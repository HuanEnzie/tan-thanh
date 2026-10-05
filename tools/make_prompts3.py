import os, json
D = os.path.join(os.path.dirname(__file__), "prompts")
BASE = ("16-bit pixel art game sprites in classic side-scroller / Doom-like billboard style: FRONT VIEW, the characters face the viewer, "
        "full body standing upright, feet at the bottom on one shared baseline, crisp pixels, dark outlines, rich shading. "
        "Plain transparent background, no ground, no shadow, no text, no frame. ")
EN = {
    'md': "the 7 undead from the reference images, in this order left to right: 1 shambling walker zombie in torn blue shirt, 2 skinny fast runner zombie in red hoodie, 3 huge hulking brute zombie in torn white tank top (twice as big), 4 bloated green spitter zombie with glowing pustules, 5 zombie police officer in navy uniform and vest, 6 swollen exploding zombie with glowing orange belly, 7 giant mutant boss with bone spikes and purple tumors (three times bigger)",
    'cy': "the 7 enemies from the reference image, same order: 1 cyborg zombie with red eye implant, 2 skinny chrome android runner, 3 huge combat mech with hydraulic arms (twice as big), 4 hovering red-lens laser drone, 5 riot enforcer robot with shield, 6 small orange suicide drone, 7 giant spider tank mech boss (three times bigger)",
    'ct': "the 7 enemies from the reference image, same order: 1 hopping jiangshi corpse in Qing official robes with yellow talisman on forehead and arms stretched forward, 2 gaunt hungry ghost with long black hair, 3 huge ox-headed demon with an axe (twice as big), 4 nine-tailed fox spirit woman with blue fire, 5 armored ghost soldier with spear, 6 floating paper lantern ghost, 7 giant ghost king general in black armor with halberd (three times bigger)",
    'tt': "the 7 enemies from the reference image, same order: 1 blood-zombie cultivator in torn robes, 2 black demon wolf with red eyes (four legs, side-ish front view), 3 giant moss stone golem (twice as big), 4 demonic cultivator in black robes casting purple fire, 5 horned armored demon soldier with glaive, 6 bloated poison toad, 7 giant nine-headed purple serpent demon boss (three times bigger)",
    'sl': "the 7 enemies from the reference image, same order: 1 green goblin with rusty knife, 2 giant black soldier ant, 3 huge orc brute with iron club (twice as big), 4 dark elf mage casting purple magic, 5 armored skeleton knight with sword and shield, 6 bouncing red slime, 7 giant blood-red armored knight boss with a great sword (three times bigger)",
}
NPC = {
    'md': "1 female paramedic in red jacket with ponytail, 2 male ex-soldier in olive jacket and grey beanie, 3 little girl holding a teddy bear, 4 old man in a cardigan",
    'cy': "1 young male hacker with VR visor and hoodie, 2 street doctor woman in white coat with neon trim, 3 child in oversized jacket, 4 old mechanic with goggles",
    'ct': "1 young scholar in white robes with a fan, 2 village girl in brown ao tu than with a basket, 3 old herbal doctor with a long beard, 4 little boy with a shaved head",
    'tt': "1 young female disciple in pink robes, 2 old sect elder with white beard, 3 boy disciple carrying firewood, 4 wounded swordsman in grey robes",
    'sl': "1 female healer hunter in white and gold armor, 2 young male tank hunter with a big shield, 3 injured office worker, 4 girl in school uniform",
}
HERO = {
    'md': "rugged male survivor with short dark hair, olive green military jacket and brown backpack",
    'cy': "cyberpunk mercenary woman with short neon-pink hair, black techwear jacket with glowing cyan seams and a cybernetic arm",
    'ct': "ancient Vietnamese warrior in dark indigo martial robes with a red sash and topknot",
    'tt': "young Taoist cultivator in flowing white and pale blue robes with long black hair",
    'sl': "young hunter with messy black hair in a long black coat with a dark aura",
}
REF = {'md': ['zombies', 'zombies2'], 'cy': ['cy_enemies'], 'ct': ['ct_enemies'], 'tt': ['tt_enemies'], 'sl': ['sl_enemies']}
NREF = {'md': 'md_npc', 'cy': 'cy_npc', 'ct': 'ct_npc', 'tt': 'tt_npc', 'sl': 'sl_npc'}
HREF = {'md': 'player', 'cy': 'cy_hero', 'ct': 'ct_hero', 'tt': 'tt_hero', 'sl': 'sl_hero'}
meta = {}
for r in EN:
    k = f'{r}_efront'
    open(os.path.join(D, k + '.txt'), 'w', encoding='utf-8').write(BASE + "A single horizontal row with wide gaps showing " + EN[r] + ". Keep the same designs and colors as the reference. Landscape 16:9 image.")
    meta[k] = REF[r]
    k = f'{r}_nfront'
    open(os.path.join(D, k + '.txt'), 'w', encoding='utf-8').write(BASE + "A single horizontal row with wide gaps showing 4 humans: " + NPC[r] + ". Same people as the reference image (which shows them from above). Landscape 16:9 image.")
    meta[k] = [NREF[r]]
    k = f'{r}_hback'
    open(os.path.join(D, k + '.txt'), 'w', encoding='utf-8').write(BASE.replace("FRONT VIEW, the characters face the viewer", "BACK VIEW, the character is seen from directly BEHIND, facing away from the viewer") + "ONE character only: " + HERO[r] + ", the same person as in the reference image (shown from above there). Seen from behind, standing, holding a weapon in front so only a little of it shows at the side. Portrait 2:3 image.")
    meta[k] = [HREF[r]]
json.dump(meta, open(os.path.join(os.path.dirname(__file__), 'gen3_refs.json'), 'w'), indent=1)
print(len(meta))
