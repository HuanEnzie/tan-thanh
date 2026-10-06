"""Round 6 prompts: statues, waypoints, base buildings, orbs."""
import os, json
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prompts')
TOP = ("16-bit pixel art game sprite, high top-down 3/4 view (like classic top-down RPGs), crisp hard pixel edges, "
       "strong readable silhouettes with dark 1px outlines, rich detailed shading, vibrant colors. Isolated on a plain flat transparent or solid magenta background, "
       "no ground tiles, no cast shadow, no text, no watermark, no frame. ")
P = {
 'statues': TOP + "A sprite sheet of 6 objects in a 3 columns x 2 rows grid with wide gaps, all similar size. Top row: three tall sacred landmark monuments that reveal the map when activated: "
   "1 post-apocalyptic radio broadcast tower beacon on a concrete base with a big antenna dish and a glowing amber light, "
   "2 serene jade goddess statue on a lotus pedestal holding a glowing orb (Chinese cultivation style), "
   "3 tall black system obelisk with glowing blue hologram runes and a floating crystal on top. "
   "Bottom row: three round teleport waypoint platforms: 4 metal sci-fi teleport pad with yellow hazard stripes and a glowing ring, "
   "5 ancient circular stone teleportation array with glowing jade runes, 6 hexagonal blue hologram system portal pad. Landscape image.",
 'base': TOP + "A sprite sheet of 9 objects in a 3 columns x 3 rows grid with wide gaps, all similar size: "
   "1 blacksmith forge with an anvil, hammer and glowing hot coals, 2 outdoor cooking station with a big steaming pot over fire, "
   "3 small vegetable garden plot with growing crops and a watering can, 4 storage shed with stacked wooden crates and barrels, "
   "5 wooden quest notice board with pinned papers, 6 cozy bedroll and pillow with a lantern, "
   "7 glowing cyan energy orb floating with sparkles, 8 glowing golden spirit orb floating with sparkles, 9 glowing purple mana orb floating with sparkles. Square image.",
}
os.makedirs(D, exist_ok=True)
for k, v in P.items(): open(os.path.join(D, k + '.txt'), 'w', encoding='utf-8').write(v)
json.dump({k: [] for k in P}, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gen6_refs.json'), 'w'), indent=1)
print(len(P))
