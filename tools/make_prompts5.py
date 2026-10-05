"""Round 5 prompts: pets, wonders, events, gacha."""
import os, json
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prompts')
TOP = ("16-bit pixel art game sprite, high top-down 3/4 view (like classic top-down RPGs), crisp hard pixel edges, "
       "strong readable silhouettes with dark 1px outlines, rich detailed shading, vibrant colors. Isolated on a plain flat transparent or solid magenta background, "
       "no ground, no cast shadow, no text, no watermark, no frame. ")
P = {
 'pets': TOP + "A sprite sheet of 8 cute small companion pets in a 4 columns x 2 rows grid with wide gaps, all similar size, chibi proportions, each clearly different: "
   "1 tiny fire fox spirit with flaming tails, 2 baby blue ice dragon with small wings, 3 golden lucky cat holding a coin, 4 glowing pink jellyfish of light floating, "
   "5 small thunder bird crackling with lightning, 6 mini mossy stone golem, 7 cute ghost holding a lantern, 8 tiny crystal fairy with sparkling wings. Square image.",
 'wonders_a': TOP + "A sprite sheet of 6 huge landmark structures in a 3 columns x 2 rows grid with wide gaps, each a big impressive set piece seen from high above: "
   "1 giant frozen dragon skeleton half-buried in snow and ice, 2 ancient sand pyramid with a sphinx statue, 3 colossal ancient world tree with glowing blue roots, "
   "4 tall glowing purple crystal spire cluster, 5 black obsidian altar with glowing lava runes and fire braziers, 6 giant red torii gate shrine with cherry blossom petals. Landscape image.",
 'wonders_b': TOP + "A sprite sheet of 6 huge landmark structures in a 3 columns x 2 rows grid with wide gaps, each a big impressive set piece seen from high above: "
   "1 giant mushroom cottage house with glowing windows, 2 sunken stone temple ruin in swamp water covered with vines, 3 giant overgrown stone head statue in the jungle, "
   "4 haunted gothic mausoleum with gargoyles and green ghost light, 5 red wooden pagoda shrine among autumn maple leaves, 6 ancient circle of standing stones with glowing blue runes. Landscape image.",
 'events': TOP + "A sprite sheet of 8 objects in a 4 columns x 2 rows grid with wide gaps: 1 sneaky green treasure goblin running while carrying a huge overflowing sack of gold coins, "
   "2 mimic treasure chest monster with sharp teeth and long tongue, 3 glowing falling star fragment crystal (golden), 4 golden supply voucher card with a star emblem, "
   "5 green jade fate talisman token with golden runes, 6 glowing blue hologram system ticket with a crown emblem, 7 ornate mystical summoning altar with a floating glowing orb and stars, "
   "8 mysterious glowing pet egg with swirling patterns. Square image.",
}
os.makedirs(D, exist_ok=True)
for k, v in P.items(): open(os.path.join(D, k + '.txt'), 'w', encoding='utf-8').write(v)
json.dump({k: [] for k in P}, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gen5_refs.json'), 'w'), indent=1)
print(len(P))
