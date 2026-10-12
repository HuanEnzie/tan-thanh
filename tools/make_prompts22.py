"""Round 22 (v22 art): prompts for the monsters, zombies, Demon Generals, mechanic props, ruins, player buildings,
item and crystal icons, crystal nodes, furniture, terrain sprites, and roof/ground textures.

Every generated image is one sheet of 3-8 sprites on flat magenta, or one seamless texture. build22.py cuts a sheet
into connected components and names the pieces in the order listed here (reading order: rows top to bottom, left
to right). The tables below are the contract: sprite names must match KE-HOACH-v22.md section 14 exactly
(190 sprites on sheets + 19 textures = 209 names).

Camera conventions, copied from the existing game art:
  creatures and zombies  straight top-down, head and front limbs pointing RIGHT (the game rotates them by heading)
  bosses, generals, kings upright 3/4 standing figures facing the viewer (drawn unrotated, like md_b_0 / sl_b_0)
  furniture and buildings high three-quarter view from above (like props.png and atlas21_mod)
  ground debris, nodes, terrain  straight top-down (like car_burnt.png and nature.png)
  item and crystal icons front three-quarter view (like items1.png)

Run: python tools/make_prompts22.py
Writes tools/prompts/<sheet>.txt, tools/gen22_refs.json, copies the style refs to assets/raw/ref22_*.png and
builds two composite refs (ref22_chars.png = top-down creatures, ref22_bosses.png = upright bosses).
It never calls the image API. Generation: bash tools/gen22.sh. Then: python tools/build22.py.
"""
import os, json, math
from PIL import Image

H = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(H, '..')
RAW = os.path.join(ROOT, 'assets', 'raw')
PROMPTS = os.path.join(H, 'prompts')

# ---- style references: copied into assets/raw as ref22_<key>.png ----
REF_SRC = {
    'props_md': 'assets/raw/props.png',        # md urban props, high 3/4 view
    'sl_props': 'assets/raw/sl_props.png',     # sl dungeon props, same camera and outline weight
    'tt_props': 'assets/raw/tt_props.png',     # tt props, ancient style
    'nature': 'assets/raw/nature.png',         # strict top-down trees, rocks and the reference car wreck
    'items1': 'assets/raw/items1.png',         # item icons, front 3/4 view
    'tex_roof': 'assets/img/tex_roof.png', 'tex_roof2': 'assets/img/tex_roof2.png',
    'tex_tt_roof': 'assets/img/tex_tt_roof.png',
    'tex_dirt': 'assets/img/tex_dirt.png', 'tex_grass': 'assets/img/tex_grass.png',
    'tex_ice': 'assets/img/tex_ice.png', 'tex_sidewalk': 'assets/img/tex_sidewalk.png',
}
# composites built from existing game sprites (made by main(), no API)
COMPOSITE = {
    # top-down creatures, every one with its head pointing right (z_walker, z_runner, sl_e_0, tt_e_1)
    'chars': ['assets/img/z_walker.png', 'assets/img/z_runner.png', 'assets/img/sl_e_0.png', 'assets/img/tt_e_1.png'],
    # upright humanoid boss figures (md_b_0, sl_b_0, sl_b_1, sl_b_3; the tt and beast bosses are drawn top-down)
    'bosses': ['assets/img/md_b_0.png', 'assets/img/sl_b_0.png', 'assets/img/sl_b_1.png', 'assets/img/sl_b_3.png'],
}

# ---- style texts (shared wording with round 21 where the look is the same) ----
CREATURE = ("16-bit painterly pixel-art creature sprites for a top-down RPG, crisp hard pixels, dark 1px outline, rich shading, "
            "the same art style, camera angle and level of detail as the reference images: every creature is seen STRAIGHT FROM ABOVE "
            "(bird's-eye view, like the reference zombie sprites; never a side view, never a front view, never a 3/4 view), lying flat "
            "or crouching low in a crawling, leaping, lunging or standing pose, with its head and front limbs pointing to the RIGHT edge "
            "of its own frame and its body trailing to the left. Chunky readable silhouette, bold colour blocks, few tiny details. Each "
            "creature is a standalone piece with no ground, no cast shadow, no text, no labels. Solid flat pure magenta #FF00FF background, "
            "every creature separated from its neighbours by wide magenta gaps. ")
BOSS = ("16-bit painterly pixel-art boss monster sprites for a top-down RPG, crisp hard pixels, dark 1px outline, rich shading, the "
        "same art style, camera angle and level of detail as the reference boss images: each figure STANDS UPRIGHT on the ground and "
        "faces the viewer, seen from a high three-quarter angle (head and shoulders clearly visible, front of the body toward the camera), "
        "NOT a top-down view and NOT a side view. Tall imposing full-body dark-fantasy figure filling most of its frame height, bold "
        "silhouette, dark dramatic palette with glowing accents. Each figure is a standalone piece with no ground, no shadow on the ground, "
        "no text, no labels. Solid flat pure magenta #FF00FF background, wide magenta gaps between figures. ")
PROP = ("16-bit painterly pixel-art game props for a top-down RPG, crisp hard pixels, dark 1px outline, rich shading, the same art "
        "style, camera angle and level of detail as the reference images: seen from a high three-quarter view from above (top surface "
        "clearly visible plus a narrow strip of the front face, like the reference props), NOT a flat straight-down view and NOT a side "
        "view. Chunky readable silhouettes and bold colour blocks, few tiny details, so each object still reads clearly when shrunk to "
        "about 60-100 pixels wide. Each object is a standalone piece with no floor, no rug, no ground shadow, no people, no text, no "
        "labels. Solid flat pure magenta #FF00FF background filling the whole image, no gradient, every object separated from its "
        "neighbours by wide magenta gaps, on a neat grid. ")
PROP_MD = PROP + "Setting: modern city and countryside, urban wear and grime. "
PROP_TT = PROP + "Setting: ancient Chinese town (xianxia), carved dark wood, red lacquer, gold and brass fittings, silk, jade and paper lanterns. "
PROP_SL = PROP + "Setting: dark fantasy dungeon, iron, bone, dark leather and glowing runes. "
MIXED = ("Some objects in this sheet lie on the ground and are seen STRAIGHT FROM ABOVE (bird's-eye view); the others stand upright "
         "and use the high three-quarter view. The camera rule of each object is given in its own description. ")
TOPDOWN_GROUND = ("16-bit painterly pixel-art ground debris sprites for a top-down RPG, crisp hard pixels, dark 1px outline, rich shading, "
                  "the same art style and camera angle as the reference car wreck sprite: every object is seen STRAIGHT FROM ABOVE "
                  "(bird's-eye view, no side view, no 3/4 view), lying on the ground. Scorched, burnt, broken and dusty. No cast shadow, "
                  "no people, no text, no labels. Solid flat pure magenta #FF00FF background, every object separated by wide magenta gaps. ")
TOPDOWN_NODE = ("16-bit painterly pixel-art mana crystal ore nodes for a top-down RPG dungeon, crisp hard pixels, dark 1px outline, rich "
                "shading, the same camera angle as the reference rock sprites: seen strictly from DIRECTLY ABOVE (bird's-eye view). No "
                "ground, no cast shadow, no people, no text. Solid flat pure magenta #FF00FF background, every node separated by wide "
                "magenta gaps. ")
TERR = ("16-bit painterly pixel-art nature and terrain sprites for a top-down RPG overworld, crisp hard pixels, dark 1px outline, rich "
        "shading, the same art style, camera angle and level of detail as the reference images: seen strictly from DIRECTLY ABOVE "
        "(bird's-eye view, like the reference tree and rock sprites). No ground, no cast shadow, no people, no text. Solid flat pure "
        "magenta #FF00FF background, every object separated by wide magenta gaps. ")
ICON = ("16-bit pixel-art game item icons, front three-quarter view like the reference item icons, crisp pixels, dark outline, rich "
        "colours, flat solid magenta #FF00FF background, each icon separated by wide magenta gaps, all icons similar size and footprint. "
        "No text, no labels, no letters, no grid lines. ")
TEXT_T = ("Seamless tileable square texture for a 16-bit pixel art top-down game, viewed straight from above, flat even lighting, "
          "no perspective, no objects, no shadows, crisp visible pixels, texture fills the entire image edge to edge, must tile "
          "seamlessly. No text. Square image. ")
OVERLAY_T = ("Square 16-bit pixel-art damage overlay for a top-down roof texture, seen straight from above. The background is flat solid "
             "pure magenta #FF00FF and covers most of the image. Drawn on top of it, crisp pixels, only the damage marks: ")

# ---- style per sheet ----
ST_MON_MD = CREATURE + "Setting: modern city mutants, torn clothes, mutated flesh, urban debris. "
ST_MON_SL = CREATURE + "Setting: dark fantasy dungeon monsters, rusted iron, bone, dark leather and glowing runes. "
ST_MON_TT = CREATURE + "Setting: ancient Chinese xianxia monsters, hemp, lacquer, paper talismans, jade and stone. "
ST_ZOM_MOD = CREATURE + "Setting: modern undead, decayed grey-green skin, torn modern clothing, dark blood. "
ST_ZOM_SL = CREATURE + "Setting: dark fantasy undead hunters, rusted chainmail and plate, decayed skin, dark blood. "
ST_ZOM_TT = CREATURE + "Setting: ancient Chinese undead, torn hemp and silk robes, decayed skin, paper talismans. "

# ---- item tables: (name, what to draw, target longest side in px) ----
MON_MD = [
    ('m22_md_leaper', 'a crouched mutant zombie about to pounce, long arms spread, claws out, torn city clothes', 64),
    ('m22_md_shielder', 'a riot-police zombie holding a large clear riot shield forward, tattered police uniform', 72),
    ('m22_md_burrower', 'a sewer zombie half-buried in mud, only its head and clawing arms showing, slimy and grimy', 64),
    ('m22_md_summoner', 'a screaming zombie with a wide open mouth and both arms raised, torn jacket, faint shock rings', 64),
    ('m22_md_charger', 'a hulking zombie with a welded steel plate on its chest and its head lowered to charge', 80),
    ('m22_md_healer', 'a mutant nurse zombie in torn scrubs with glowing green IV bags and syringes on its belt', 64),
]
MON_SL = [
    ('m22_sl_leaper', 'a crouched dark-fantasy beast with a spiked back, poised to leap, long claws', 64),
    ('m22_sl_shielder', 'an armoured knight holding a large tower shield forward, helmet and chainmail', 72),
    ('m22_sl_burrower', 'a rock worm burrowing, a segmented stone-plated worm body emerging from loose earth, only the front visible', 64),
    ('m22_sl_summoner', 'a dark mage with a crooked staff topped with a glowing purple orb, hooded robe, summoning sparks', 64),
    ('m22_sl_charger', 'a bull demon with curved horns lowered to charge, heavy muscular body, iron nose ring', 80),
    ('m22_sl_healer', 'a dark priest in a tattered hooded robe, glowing green healing runes on its hands, holding a bone censer', 64),
]
MON_TT = [
    ('m22_tt_leaper', 'a black wolf demon crouched low to pounce, bristling fur, glowing red eyes, long claws', 64),
    ('m22_tt_shielder', 'a stone-armoured guard with a large round bronze-and-stone shield held forward', 72),
    ('m22_tt_burrower', 'an earth dragon serpent with rock scales burrowing, dirt and pebbles flying around its body', 64),
    ('m22_tt_summoner', 'a small horned child demon in a red robe holding a paper talisman, glowing sigils around it', 64),
    ('m22_tt_charger', 'a massive brown bear-like brute lowered to charge, armoured hide with iron rings', 80),
    ('m22_tt_healer', 'a toad immortal with a glowing green spirit aura, pale robes and a poison sac on its throat', 64),
]
ZOM_MOD = [
    ('z22_mod_office', 'a zombie office worker in a torn grey business suit with a loose tie and a torn shirt', 64),
    ('z22_mod_nurse', 'a zombie nurse in torn white scrubs with a blood-stained cap, arms reaching', 64),
    ('z22_mod_police', 'a zombie police officer in a torn blue uniform with a badge and a torn belt', 64),
    ('z22_mod_soldier', 'a zombie soldier in torn olive camouflage with a dented helmet and an empty rifle strap', 68),
    ('z22_mod_worker', 'a zombie construction worker in torn orange overalls with a yellow hard hat', 68),
    ('z22_mod_bloat', 'a bloated gas-swollen zombie with a huge distended belly, purple-green skin and cracked veins', 80),
    ('z22_md_screamer', 'a zombie with a wide open screaming mouth and throat cords showing, arms raised, torn hoodie', 72),
    ('z22_md_mutant', 'a huge mutated zombie with extra muscular arms, fleshy growths and a split skull, the biggest of the group', 96),
]
ZOM_SL = [
    ('z22_sl_hsword', 'an undead hunter in rusted chainmail wielding a long sword, arm raised to slash', 68),
    ('z22_sl_hmage', 'an undead hunter mage in a torn hooded cloak, a floating green magic orb in one hand', 68),
    ('z22_sl_htank', 'an undead hunter in heavy rusted plate armour with a massive shield, stomping forward', 80),
]
ZOM_TT = [
    ('z22_tt_villager', 'a zombie villager in a torn grey hemp robe with a bamboo hat fallen off', 60),
    ('z22_tt_guard', 'an undead palace guard in torn lamellar armour holding a long spear', 68),
    ('z22_tt_sword', 'an undead swordsman in a tattered blue robe with a glowing sword-qi aura trailing from its blade', 64),
    ('z22_tt_talisman', 'an undead priest with yellow paper talismans stuck on its forehead and robe, arms outstretched', 64),
    ('z22_tt_elder', 'an undead old cultivator with a long white beard in tattered grey robes, hunched, claws out', 68),
]
KINGS = [  # boss size, upright; each one drawn in its own world's look
    ('z22_md_king', 'modern zombie king: a huge rotten former executive in a torn grey suit with a rusted metal crown, loose tie, bloodied, massive arms', 200),
    ('z22_sl_king', 'dark fantasy zombie king: a towering undead king in tattered black-and-gold royal armour, rotting cape, rusted crown, glowing green eyes', 200),
    ('z22_tt_king', 'ancient Chinese zombie emperor: a rotting emperor in tattered golden dragon robes, a jade crown with paper talismans hanging from it, pale-green glowing eyes, a cursed sword', 200),
]
GENERALS = [  # Demon Generals; each design shows its section-3 mechanic (dg22_0..11 = DEMONS order)
    ('dg22_0', 'grave-sprout demon gardener: a gaunt hunched demon with a grave-soil mound body, pale green sprouts and mushrooms growing from its shoulders and horns, a seed sack at its belt and a rusty spade in one hand', 200),
    ('dg22_1', 'fire demon: obsidian armour with glowing molten orange cracks, flames rising from its shoulders, a flaming greatsword and ember-bright eyes', 200),
    ('dg22_2', 'void illusion demon: a half-faded translucent body wrapped in dark violet mist, floating broken mirror shards around it, hollow glowing eyes and a flickering outline', 200),
    ('dg22_3', 'blood mother demoness: pale skin with dark blood veins, red blood-soaked robes dripping, a crown of blood-red thorns and a shallow pool of blood at her feet', 200),
    ('dg22_4', 'gale demon: a lean crouched figure with a tattered cloak streaming in swirling wind lines, twin curved blades and motion trails of wind around its body', 200),
    ('dg22_5', 'undying armoured demon: a skeletal knight of bone and black iron plates, a bone tower shield with carved runes, a cracked skull helm with an undying green glow in its eye sockets', 200),
    ('dg22_6', 'moon ghost demon: a pale translucent spirit with a silver crescent moon halo behind its head, flowing ghostly robes and a broken moon fragment held in one hand, soft silver glow', 200),
    ('dg22_7', 'soul eater demon: a gaunt dark body with many small spectral mouths on its chest and arms, pale soul wisps being pulled into its clawed hands', 200),
    ('dg22_8', 'nether shadow demon: a figure of dark smoke and violet-red nether flame, shadow tendrils trailing, a jagged dark obelisk crown, glowing red eyes, its outline melting into shadow', 200),
    ('dg22_9', 'bone mother demon: an open ribcage holding pale cracked eggs, bone spines along its back, egg sacs hanging from its arms and a skull crown', 200),
    ('dg22_10', 'reflective-armour warlord: heavy polished mirror-like metal plates that catch the light, a massive war hammer, a fierce horned helmet and a red war banner on its back', 200),
    ('dg22_11', 'thunder lord demon: golden-black armour with arcs of crackling lightning over its body and halberd, a crown of lightning and a dark storm cloud behind its head', 200),
]
MECH = [
    ('mp22_sprout', 'grave sprout: a small mound of dark grave soil with a glowing fleshy green sprout and tiny leaves, a weathered tombstone beside it', 80),
    ('mp22_mirror', 'cursed standing mirror: an ornate tall oval mirror in a black iron frame with violet mist glowing inside the glass', 96),
    ('mp22_pylon', 'dark obelisk pylon: a tall black stone pillar with glowing red-violet runes and a dark crystal on top', 96),
    ('mp22_totem', 'undying totem: a carved stone idol with a skull face, iron chains hanging from it, faint green glow in its eye sockets', 96),
    ('mp22_brazier', 'bronze incense brazier on three legs with a cold blue-white flame burning on top', 72),
    ('mp22_urn', 'large blue-glazed clay water urn with a wooden lid and a few droplets of water on its rim', 80),
    ('mp22_egg', 'large pale cracked bone egg with dark veins and a faint glow inside, resting in a nest of small bones', 72),
    ('mp22_shard', 'lightning conductor: a tall iron pole topped with a blue-white crystal shard crackling with small lightning arcs', 96),
]
RUIN_MOD_TD = [  # seen straight from above
    ('r22_mod_rubble1', 'a small pile of grey concrete rubble and broken bricks', 72),
    ('r22_mod_rubble2', 'a larger heap of broken concrete slabs with rebar sticking out', 88),
    ('r22_mod_rubble3', 'scattered shattered bricks, dust and a sharp shard of glass', 72),
    ('r22_mod_carwreck1', 'a burnt-out car wreck with scorched paint, seen from directly above like the reference car', 128),
    ('r22_mod_carwreck2', 'a crushed sedan wreck with its doors hanging open, seen straight from above', 128),
    ('r22_mod_bus', 'an overturned city bus lying on its side, seen straight from above', 150),
    ('r22_mod_pole', 'a fallen electric utility pole lying on the ground with broken cables', 120),
    ('r22_mod_crater', 'a blast crater: a round dark pit with a cracked grey rim and scorched earth', 110),
]
RUIN_MOD_3Q = [  # upright, high three-quarter view
    ('r22_mod_wallh', 'a horizontal broken concrete wall segment with a jagged top edge and exposed rebar', 112),
    ('r22_mod_wallv', 'a vertical broken brick wall segment with a jagged top and a hole in it', 112),
    ('r22_mod_trash', 'a pile of torn black garbage bags and cardboard boxes', 80),
    ('r22_mod_sofa', 'an old torn brown sofa with a broken cushion', 96),
]
RUIN_TT = [  # mixed sheet
    ('r22_tt_rubble', 'a heap of broken grey roof tiles and bricks, seen straight from above', 80),
    ('r22_tt_pillar', 'a broken temple pillar of red lacquered wood, snapped with splinters, upright (high three-quarter view)', 96),
    ('r22_tt_lantern', 'a toppled stone lantern lying on the ground, cracked, seen straight from above', 72),
    ('r22_tt_cart', 'a broken wooden ox cart with one wheel off, upright (high three-quarter view)', 112),
    ('r22_tt_roofdebris', 'a pile of fallen green glazed roof tiles and broken ridge ornaments, seen straight from above', 96),
    ('r22_tt_stones', 'scattered carved stone slabs and foundation stones, seen straight from above', 88),
]
BLD_MOD_1 = [  # upright survival blocks
    ('b22_mod_wall_wood', 'a square wooden plank wall block with horizontal planks and nails, a single wall section', 64),
    ('b22_mod_wall_stone', 'a square grey stone block wall section with mortar lines', 64),
    ('b22_mod_wall_metal', 'a square riveted steel plate wall section with a hazard stripe', 64),
    ('b22_mod_door', 'a closed wooden door panel set in a frame, a brass handle', 96),
    ('b22_mod_bed', 'a simple survival bed made of wood and cloth with a pillow and a blanket', 96),
    ('b22_mod_chest', 'a wooden storage chest with iron bands and a lock', 64),
]
BLD_MOD_2 = [  # mixed
    ('b22_mod_bench', 'a sturdy wooden crafting workbench with hand tools hanging from it', 80),
    ('b22_mod_furnace', 'a stone furnace with an opening glowing orange', 72),
    ('b22_mod_tparray', 'a glowing rune circle on the ground, seen straight from above', 96),
    ('b22_mod_defarray', 'a defense array: a circular metal turret ring with a crystal centre, seen straight from above', 96),
]
BLD_TT_1 = [
    ('b22_tt_wall_wood', 'a square carved dark wood wall panel with a lattice pattern, a single wall section', 64),
    ('b22_tt_wall_stone', 'a square grey stone brick wall section with mortar lines', 64),
    ('b22_tt_wall_metal', 'a square bronze-plated wall section with gold rivets', 64),
    ('b22_tt_door', 'a closed red lacquered double door panel with brass rings', 96),
    ('b22_tt_bed', 'a wooden kang bed with a straw mat and a folded quilt', 96),
    ('b22_tt_chest', 'a lacquered wooden trunk with brass corners', 64),
]
BLD_TT_2 = [  # mixed
    ('b22_tt_bench', 'a carpenter workbench with saws and chisels laid on it', 80),
    ('b22_tt_furnace', 'a clay alchemy furnace with a red glow from its opening', 72),
    ('b22_tt_tparray', 'a glowing gold rune circle on the ground, seen straight from above', 96),
    ('b22_tt_defarray', 'a bronze formation disk with a jade centre, seen straight from above', 96),
]
BLD_COMMON = [  # mixed, shared by every realm
    ('b22_campfire', 'a ring of stones with logs and a small fire burning in the middle, high three-quarter view', 80),
    ('b22_torch', 'a wooden torch with a bright flame on top, upright', 48),
    ('b22_fence', 'a wooden fence segment with two posts and two rails, upright', 64),
    ('b22_spikes', 'a cluster of sharpened wooden stakes pointing up, upright', 56),
    ('b22_stairs_up', 'a wooden staircase going up, high three-quarter view', 80),
    ('b22_stairs_down', 'a wooden staircase going down, high three-quarter view', 80),
    ('b22_floor_wood', 'a square wooden floor plank tile with grain and nail heads, seen straight from above', 64),
]
ICON_1 = [
    ('i22_club', 'a wooden club with a knotted head', 80),
    ('i22_axe_stone', 'a stone-headed axe with a wooden handle and rope binding', 80),
    ('i22_pick_stone', 'a stone pickaxe with a wooden handle and rope binding', 80),
    ('i22_pick_iron', 'an iron pickaxe with a wooden handle', 80),
    ('i22_pick_crystal', 'a pickaxe with a glowing crystal head', 80),
    ('i22_spear_stone', 'a stone-tipped spear with a long wooden shaft', 80),
]
ICON_2 = [
    ('i22_sword_iron', 'an iron sword with a leather-wrapped grip', 80),
    ('i22_axe_iron', 'an iron axe with a sharp blade on a wooden handle', 80),
    ('i22_torch', 'a wooden torch with a bright flame on top', 80),
    ('i22_fiber', 'a small bundle of green plant fibres tied with twine', 80),
    ('i22_stone', 'a chunk of grey river stone', 80),
    ('i22_flint', 'a sharp dark flint stone with a sparkling edge', 80),
]
ICON_3 = [
    ('i22_ore_iron', 'a rough iron ore rock with rusty orange veins', 80),
    ('i22_ingot', 'an iron ingot bar, grey-silver metal', 80),
    ('i22_stick', 'a straight wooden stick', 80),
    ('i22_leather', 'a folded piece of brown animal leather hide', 80),
    ('i22_bone', 'a clean bone with rounded ends', 80),
    ('i22_cloth', 'a folded roll of coarse cloth', 80),
]
ICON_4 = [
    ('i22_mcore', 'a glowing monster core, a round gem with a pulsing inner light', 80),
    ('i22_rope', 'a coil of hemp rope', 80),
    ('i22_armor_leather', 'a leather chest armour vest with laces', 80),
    ('i22_armor_iron', 'an iron chest plate armour with rivets', 80),
    ('i22_helm_leather', 'a leather helmet cap with straps', 80),
    ('i22_food_cooked', 'a roasted meat drumstick with a bone handle', 80),
]
RANKS = [('E', 'dull grey'), ('D', 'green'), ('C', 'blue'), ('B', 'purple'), ('A', 'orange'), ('S', 'red')]
CRY_MOD_ICONS = [(f'i22_cry_{r}_mod', f'rank {r} energy core cell: a sealed metal housing holding a glowing {c} energy core with sparks', 80) for r, c in RANKS]
CRY_TT_ICONS = [(f'i22_cry_{r}_tt', f'rank {r} spirit stone: a polished oval {c} lingshi stone in a bronze ring with a faint glow', 80) for r, c in RANKS]
CRY_MOD_NODES = [(f'n22_cry_{r}_mod', f'a rock outcrop with a cluster of {c} glowing energy crystals growing out of it', 72) for r, c in RANKS]
CRY_TT_NODES = [(f'n22_cry_{r}_tt', f'a rock outcrop with a cluster of {c} spirit crystals growing out of it', 72) for r, c in RANKS]
FURN_MOD = [
    ('f22_mod_gaspump', 'a red and white fuel pump with a digital display and a hose', 96),
    ('f22_mod_schooldesk', 'a school desk with an attached chair and an open notebook', 88),
    ('f22_mod_blackboard', 'a green chalkboard on a wooden stand with a chalk tray', 96),
    ('f22_mod_policecar', 'a black and white police car with a light bar on its roof', 144),
    ('f22_mod_firetruck', 'a red fire truck with a ladder on its roof', 144),
    ('f22_mod_forklift', 'a yellow forklift with its mast and forks', 112),
    ('f22_mod_pallets', 'a stack of wooden shipping pallets with cardboard boxes', 96),
    ('f22_mod_machine', 'an industrial factory machine with gears and pipes', 96),
    ('f22_mod_pews', 'a pair of church pews, long wooden benches', 96),
    ('f22_mod_altar', 'a small church altar with a white cloth and candles', 88),
    ('f22_mod_locker', 'a tall steel locker with a dented door', 80),
    ('f22_mod_cellbars', 'a prison cell gate section: iron bars in a steel frame', 96),
    ('f22_mod_vault', 'a bank steel vault with a round wheel door', 96),
    ('f22_mod_cinemaseats', 'a row of red cinema seats', 96),
    ('f22_mod_silo', 'a tall grain silo with a domed top', 144),
    ('f22_mod_tractor', 'a green farm tractor with large rear wheels', 128),
    ('f22_mod_bunkbed', 'a metal bunk bed with two levels', 88),
    ('f22_mod_sandbags', 'a stack of sandbags', 80),
]
FURN_TT = [
    ('f22_tt_dummy', 'a wooden training dummy with wrapped arms', 96),
    ('f22_tt_weaponrack', 'a wooden weapon rack holding spears and swords', 96),
    ('f22_tt_anvil', "a blacksmith's iron anvil on a wooden stump", 80),
    ('f22_tt_drum', 'a large red war drum on a carved wooden stand', 80),
    ('f22_tt_buddha', 'a small golden buddha statue on a carved shrine pedestal', 80),
    ('f22_tt_incense', 'a tall bronze incense burner with burning incense sticks', 72),
    ('f22_tt_cart', 'a wooden hand cart stacked with rice sacks', 96),
    ('f22_tt_scrollrack', 'a wall rack holding bundles of scrolls', 88),
    ('f22_tt_teatable', 'a low tea table with a teapot and cups', 80),
    ('f22_tt_herbbasket', 'a wicker basket of dried herbs and roots', 64),
]
TERR22 = [
    ('t22_palm', 'a tropical palm tree canopy with long green fronds radiating outward', 112),
    ('t22_deadtree', 'a dead bare tree with grey branches spreading out', 112),
    ('t22_wheat', 'a small patch of golden wheat stalks', 80),
    ('t22_rice', 'a patch of green rice plants with a faint water shimmer', 80),
    ('t22_hay', 'a round hay bale with golden straw', 64),
    ('t22_redpillar', 'a red sandstone rock pillar with cracks, a rounded cross-section', 80),
    ('t22_acacia', 'an acacia tree canopy with a flat umbrella-shaped crown', 112),
    ('t22_tundrashrub', 'a low tundra shrub with frosted grey-green leaves', 64),
    ('t22_reeds', 'a clump of tall marsh reeds', 80),
    ('t22_bamboo', 'a clump of green bamboo stalks', 96),
    ('t22_mangrove', 'a mangrove tree canopy with tangled aerial roots around its base', 112),
    ('t22_cactus2', 'a round desert cactus with spines', 64),
]


def rows_of(n):
    """Rows for a sheet of n sprites: one row up to 3, otherwise two rows (longer row first)."""
    return [n] if n <= 3 else [(n + 1) // 2, n // 2]


def sheet(name, style, items, refs, dilate):
    assert 3 <= len(items) <= 8, name
    return dict(name=name, style=style, items=items, rows=rows_of(len(items)), dilate=dilate, refs=refs)


# ---- sheets: one generated image each (order = generation order; the first one starts the server) ----
SHEETS = [
    sheet('mon22_md', ST_MON_MD, MON_MD, ['chars', 'props_md'], 16),
    sheet('mon22_sl', ST_MON_SL, MON_SL, ['chars', 'sl_props'], 16),
    sheet('mon22_tt', ST_MON_TT, MON_TT, ['chars', 'tt_props'], 16),
    sheet('zom22_mod', ST_ZOM_MOD, ZOM_MOD, ['chars', 'props_md'], 16),
    sheet('zom22_sl', ST_ZOM_SL, ZOM_SL, ['chars', 'sl_props'], 16),
    sheet('zom22_tt', ST_ZOM_TT, ZOM_TT, ['chars', 'tt_props'], 16),
    sheet('boss22_dg_1', BOSS, GENERALS[0:6], ['bosses', 'sl_props'], 14),
    sheet('boss22_dg_2', BOSS, GENERALS[6:12], ['bosses', 'sl_props'], 14),
    sheet('boss22_king', BOSS, KINGS, ['bosses', 'tt_props', 'sl_props'], 14),
    sheet('mech22', PROP_SL, MECH, ['sl_props', 'props_md'], 12),
    sheet('ruin22_mod_1', TOPDOWN_GROUND, RUIN_MOD_TD, ['nature', 'props_md'], 12),
    sheet('ruin22_mod_2', PROP_MD, RUIN_MOD_3Q, ['props_md', 'sl_props'], 12),
    sheet('ruin22_tt', PROP_TT + MIXED, RUIN_TT, ['tt_props', 'nature'], 12),
    sheet('bld22_mod_1', PROP_MD, BLD_MOD_1, ['props_md', 'sl_props'], 12),
    sheet('bld22_mod_2', PROP_MD + MIXED, BLD_MOD_2, ['props_md', 'nature'], 12),
    sheet('bld22_tt_1', PROP_TT, BLD_TT_1, ['tt_props', 'sl_props'], 12),
    sheet('bld22_tt_2', PROP_TT + MIXED, BLD_TT_2, ['tt_props', 'nature'], 12),
    sheet('bld22_common', PROP_SL + MIXED, BLD_COMMON, ['sl_props', 'nature'], 12),
    sheet('icon22_1', ICON, ICON_1, ['items1'], 10),
    sheet('icon22_2', ICON, ICON_2, ['items1'], 10),
    sheet('icon22_3', ICON, ICON_3, ['items1'], 10),
    sheet('icon22_4', ICON, ICON_4, ['items1'], 10),
    sheet('icon22_cry_mod', ICON, CRY_MOD_ICONS, ['items1'], 10),
    sheet('icon22_cry_tt', ICON, CRY_TT_ICONS, ['items1'], 10),
    sheet('node22_mod', TOPDOWN_NODE, CRY_MOD_NODES, ['nature', 'props_md'], 12),
    sheet('node22_tt', TOPDOWN_NODE, CRY_TT_NODES, ['nature', 'tt_props'], 12),
    sheet('furn22_mod_1', PROP_MD, FURN_MOD[0:6], ['props_md', 'sl_props'], 14),
    sheet('furn22_mod_2', PROP_MD, FURN_MOD[6:12], ['props_md', 'sl_props'], 14),
    sheet('furn22_mod_3', PROP_MD, FURN_MOD[12:18], ['props_md', 'sl_props'], 14),
    sheet('furn22_tt_1', PROP_TT, FURN_TT[0:5], ['tt_props', 'sl_props'], 14),
    sheet('furn22_tt_2', PROP_TT, FURN_TT[5:10], ['tt_props', 'sl_props'], 14),
    sheet('ter22_1', TERR, TERR22[0:6], ['nature', 'tt_props'], 12),
    sheet('ter22_2', TERR, TERR22[6:12], ['nature', 'tt_props'], 12),
]

# ---- seamless textures: one generated square each, built to 256 px (same size as tex21_*) ----
# value: (what to draw, style refs, kind); kind 'tile' = opaque, 'overlay' = magenta keyed to alpha (roofdmg only)
TEXTURES = {
    'tex22_roof_1': ('Grey asphalt shingle roof: overlapping rectangular grey shingles in neat staggered rows, subtle weathering.', ['tex_roof'], 'tile'),
    'tex22_roof_2': ('Blue corrugated metal roof sheet: parallel ridges of blue painted steel, a few scratches, seen from above.', ['tex_roof'], 'tile'),
    'tex22_roof_3': ('Red clay roof tiles: rows of curved red clay barrel tiles, seen from above.', ['tex_roof2'], 'tile'),
    'tex22_roof_4': ('Green painted roof tiles: rows of overlapping green roofing tiles, seen from above.', ['tex_roof2'], 'tile'),
    'tex22_roof_5': ('Flat concrete rooftop: grey concrete slab with small square vent boxes and a seam grid, seen from above.', ['tex_roof'], 'tile'),
    'tex22_roof_6': ('Rusty corrugated iron roof: wavy parallel ridges of grey galvanised metal with orange-brown rust patches.', ['tex_roof'], 'tile'),
    'tex22_roof_7': ('Black asphalt shingle roof: dark overlapping shingles with a faint tar sheen, seen from above.', ['tex_roof'], 'tile'),
    'tex22_roof_8': ('Ancient green glazed roof tiles: rows of plain jade-green glazed imbricated tiles with fine highlights.', ['tex_tt_roof'], 'tile'),
    'tex22_roof_9': ('Imperial golden glazed roof tiles: rows of yellow-gold glazed tiles with bright highlights, seen from above.', ['tex_tt_roof'], 'tile'),
    'tex22_roof_10': ('Grey slate roof: rows of dark grey slate tiles with uneven edges, seen from above.', ['tex_roof'], 'tile'),
    'tex22_roofdmg': ('Scattered black holes punched through the roof, broken and missing tile edges with pale splintered edges, and charred dark brown scorch marks along a few edges. The damage is spread across the whole image so it tiles seamlessly. No text.', ['tex_roof'], 'overlay'),
    'tex22_sand': ('Beach sand: pale golden sand with small ripples and tiny pebbles, seen from above.', ['tex_dirt'], 'tile'),
    'tex22_farm': ('Farmland: tilled brown soil in parallel furrow rows with green sprouts along the edges, seen from above.', ['tex_dirt'], 'tile'),
    'tex22_paddy': ('Rice paddy field: flooded terraced mud with green rice shoots and reflective water patches, seen from above.', ['tex_grass'], 'tile'),
    'tex22_redrock': ('Red sandstone canyon floor: cracked red-orange rock with fine striations, seen from above.', ['tex_dirt'], 'tile'),
    'tex22_savanna': ('Savanna grassland: dry golden-yellow grass tufts with brown patches, seen from above.', ['tex_grass'], 'tile'),
    'tex22_tundra': ('Tundra ground: frozen grey-green moss and pale frost patches with small rocks, seen from above.', ['tex_ice'], 'tile'),
    'tex22_asphalt': ('Road asphalt: dark grey asphalt with fine aggregate speckles and faint worn lane paint, seen from above.', ['tex_sidewalk'], 'tile'),
    'tex22_rubble': ('Broken ground: cracked grey concrete chunks with scattered dust and gravel, seen from above.', ['tex_dirt'], 'tile'),
}
EXPECT_SPRITES, EXPECT_TEXTURES = 190, 19


def group_of(name):
    """Which atlas a sprite is packed into: mod (md+sl), tt, or common (every realm)."""
    if name.startswith(('dg22_', 'mp22_', 't22_')): return 'common'
    if name.endswith('_tt') or '_tt_' in name: return 'tt'
    if name.endswith('_mod') or '_mod_' in name or '_md_' in name or '_sl_' in name: return 'mod'
    return 'common'  # b22_ shared, i22_ shared (no style in the name)


def sheet_prompt(sh):
    items, rows = sh['items'], sh['rows']
    assert sum(rows) == len(items), sh['name']
    layout = ', '.join(f'{c} in row {i + 1}' for i, c in enumerate(rows))
    body = '; '.join(f'{i + 1}) {desc}' for i, (_, desc, _) in enumerate(items))
    return (sh['style'] + f"Draw exactly {len(items)} separate sprites arranged in {len(rows)} row(s) ({layout}), reading left to right, "
            f"top to bottom, in this order: {body}. Square image.")


def texture_prompt(desc, kind):
    return (OVERLAY_T if kind == 'overlay' else TEXT_T) + desc


def composite(files, height, out):
    """Lay existing sprites side by side at one height on magenta (a style reference for gpt-img)."""
    ims = []
    for f in files:
        im = Image.open(os.path.join(ROOT, f)).convert('RGBA')
        w = max(1, round(im.width * height / im.height))
        ims.append(im.convert('RGBa').resize((w, height), Image.LANCZOS).convert('RGBA'))
    gap = 60
    canvas = Image.new('RGBA', (sum(i.width for i in ims) + gap * (len(ims) + 1), height + 2 * gap), (255, 0, 255, 255))
    x = gap
    for im in ims:
        canvas.alpha_composite(im, (x, gap))
        x += im.width + gap
    canvas.convert('RGB').save(out)
    return canvas.size


def main():
    os.makedirs(PROMPTS, exist_ok=True)
    os.makedirs(RAW, exist_ok=True)
    names = [it[0] for sh in SHEETS for it in sh['items']]
    assert len(names) == len(set(names)) == EXPECT_SPRITES, (len(names), len(set(names)))
    assert len(TEXTURES) == EXPECT_TEXTURES, len(TEXTURES)
    refs_json, count = {}, 0
    for sh in SHEETS:
        p = sheet_prompt(sh)
        open(os.path.join(PROMPTS, sh['name'] + '.txt'), 'w', encoding='utf-8').write(p)
        refs_json[sh['name']] = ['ref22_' + k for k in sh['refs']]
        count += len(sh['items'])
        print(f"{sh['name']:<15} {len(sh['items'])} sprites  rows={sh['rows']}  refs={sh['refs']}  dilate={sh['dilate']}  prompt={len(p)} chars")
    for name, (desc, refs, kind) in TEXTURES.items():
        p = texture_prompt(desc, kind)
        open(os.path.join(PROMPTS, name + '.txt'), 'w', encoding='utf-8').write(p)
        refs_json[name] = ['ref22_' + k for k in refs]
        print(f"{name:<15} 1 texture ({kind})  refs={refs}  prompt={len(p)} chars")
    used = {k for sh in SHEETS for k in sh['refs']} | {k for _, r, _ in TEXTURES.values() for k in r}
    for k in sorted(used):
        if k in COMPOSITE: continue
        Image.open(os.path.join(ROOT, REF_SRC[k])).convert('RGBA').save(os.path.join(RAW, 'ref22_' + k + '.png'))
    for k, files in COMPOSITE.items():
        size = composite(files, 300 if k == 'bosses' else 240, os.path.join(RAW, 'ref22_' + k + '.png'))
        print(f"composite ref22_{k}.png {size}")
    json.dump(refs_json, open(os.path.join(H, 'gen22_refs.json'), 'w', encoding='utf-8'), indent=1)
    print(f"{len(SHEETS)} sheets + {len(TEXTURES)} textures = {len(SHEETS) + len(TEXTURES)} images, "
          f"{count} sprites on sheets, {len(used)} style refs")
    print(f"contract: {count} sprites + {len(TEXTURES)} textures = {count + len(TEXTURES)} names")


if __name__ == '__main__':
    main()
