"""Round 21 (v21 art): prompts for the missing furniture, terrain, icon and texture assets.

Every generated image is one sheet of several sprites on flat magenta. build21.py cuts a sheet into
connected components and names the pieces in the order listed here (reading order: rows top to bottom,
left to right). The table below is the contract: sprite names must match KE-HOACH-v21.md section 13.

Each sprite entry is (name, what to draw, target longest side in px). Sizes are native px; the game draws
sprites at half size (world.js addProp: w = im.width / 2), so 64 px native = one 32 px tile.

Run: python tools/make_prompts21.py
Writes tools/prompts/<sheet>.txt, tools/gen21_refs.json and copies the style references to assets/raw/ref21_*.png.
It never calls the image API. Generation: bash tools/gen21.sh. Then: python tools/build21.py.
"""
import os, json
from PIL import Image

H = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(H, '..')
RAW = os.path.join(ROOT, 'assets', 'raw')
PROMPTS = os.path.join(H, 'prompts')

# style references (copied into assets/raw as ref21_<key>.png)
REF_SRC = {
    'props_md': 'assets/raw/props.png',        # md urban props, 3/4 high view
    'sl_props': 'assets/raw/sl_props.png',     # sl dungeon props, same camera and outline weight
    'tt_props': 'assets/raw/tt_props.png',     # tt props, ancient style
    'nature': 'assets/raw/nature.png',         # strict top-down trees and rocks
    'items1': 'assets/raw/items1.png',         # item icons, front 3/4 view
    'tex_ice': 'assets/img/tex_ice.png', 'tex_dirt': 'assets/img/tex_dirt.png',
    'tex_wood': 'assets/img/tex_wood.png', 'tex_tile': 'assets/img/tex_tile.png',
    'tex_sidewalk': 'assets/img/tex_sidewalk.png', 'tex_grass': 'assets/img/tex_grass.png',
}

FURN_MOD = ("16-bit painterly pixel-art game props for a top-down RPG building interior, crisp hard pixels, dark 1px outline, "
            "rich shading, the same art style, camera angle and level of detail as the reference images: seen from a high "
            "three-quarter view from above (top surface clearly visible plus a narrow strip of the front face, like the reference "
            "props), NOT a flat straight-down view and NOT a side view. Modern urban interior furniture (apartment, hospital, office, "
            "supermarket). Chunky readable silhouettes and bold colour blocks, few tiny details, so each object still reads clearly "
            "when shrunk to about 60-100 pixels wide. Each object is a standalone piece with no floor, no rug, no ground shadow, "
            "no people, no text, no labels. Solid flat pure magenta #FF00FF background filling the whole image, no gradient, "
            "every object separated from its neighbours by wide magenta gaps, on a neat grid. ")
FURN_TT = ("16-bit painterly pixel-art game props for a top-down RPG ancient Asian town interior (xianxia style), crisp hard pixels, "
           "dark 1px outline, rich shading, the same art style, camera angle and level of detail as the reference images: seen from a "
           "high three-quarter view from above (top surface clearly visible plus a narrow strip of the front face, like the reference "
           "props), NOT a flat straight-down view and NOT a side view. Carved dark wood, red lacquer, gold and brass fittings, silk, "
           "jade and paper lanterns. Chunky readable silhouettes and bold colour blocks, few tiny details, so each object still reads "
           "clearly when shrunk to about 60-100 pixels wide. Each object is a standalone piece with no floor, no rug, no ground shadow, "
           "no people, no text, no labels. Solid flat pure magenta #FF00FF background filling the whole image, no gradient, every object "
           "separated from its neighbours by wide magenta gaps, on a neat grid. ")
TERR = ("16-bit painterly pixel-art nature and terrain sprites for a top-down RPG overworld, crisp hard pixels, dark 1px outline, rich "
        "shading, the same art style, camera angle and level of detail as the reference images: seen strictly from DIRECTLY ABOVE "
        "(bird's-eye view, like the reference tree and rock sprites). No ground, no cast shadow, no people, no text. Solid flat pure "
        "magenta #FF00FF background, every object separated by wide magenta gaps. ")
ICON = ("16-bit pixel-art game item icons, front three-quarter view like the reference item icons, crisp pixels, dark outline, rich "
        "colours, flat solid magenta #FF00FF background, each icon separated by wide magenta gaps, all icons similar size and footprint. "
        "No text, no labels, no letters, no grid lines. ")
BASE = ("16-bit pixel-art map badge icons, crisp pixels, dark 2px outline, flat solid magenta #FF00FF background, each badge separated "
        "by wide magenta gaps, all three the same size and shape family. No text, no letters, no numbers, no grid lines. ")
TEXT_T = ("Seamless tileable square texture for a 16-bit pixel art top-down game, viewed straight from above, flat even lighting, "
          "no perspective, no objects, no shadows, crisp visible pixels, texture fills the entire image edge to edge, must tile "
          "seamlessly. No text. Square image. ")

# ---- sprite lists: (name, what to draw, target longest side in px) ----
# Modern furniture (shared by md and sl). Names are the contract (v21 section 13), keys in the same order as the tt set.
MOD_FURN = [
    ('f21_mod_bed', 'double bed with a wooden frame, a plaid blanket and two white pillows', 112),
    ('f21_mod_hbed', 'hospital bed with white sheets, metal side rails and an adjustable pillow', 112),
    ('f21_mod_medcab', 'white medicine cabinet with a glass door showing rows of pill bottles', 72),
    ('f21_mod_ivstand', 'IV drip stand: a slim chrome pole with a hook on top and a clear saline bag, on a small round base', 56),
    ('f21_mod_desk', 'small office computer desk with a flat monitor and a keyboard', 96),
    ('f21_mod_table', 'square dining table with a vase of flowers and a bowl of fruit', 80),
    ('f21_mod_stove', 'kitchen gas stove with four burners and a black cooking pot', 72),
    ('f21_mod_fridge', 'tall two-door white refrigerator', 80),
    ('f21_mod_shelf', 'supermarket shelving unit stacked with canned food and cardboard boxes', 88),
    ('f21_mod_rack', 'clothes rail on wheels with hanging shirts and a jacket', 80),
    ('f21_mod_sofa', 'cloth sofa with two cushions and a throw blanket', 96),
    ('f21_mod_wardrobe', 'tall wooden wardrobe with two doors and brass handles', 88),
    ('f21_mod_tv', 'flat-screen TV on a low black media stand, dark glossy screen', 88),
    ('f21_mod_bookshelf', 'tall bookshelf filled with coloured books and binders', 88),
    ('f21_mod_officedesk', 'executive office desk with drawers, a laptop and a coffee mug', 96),
    ('f21_mod_cabinet', 'grey metal filing cabinet with four drawers', 64),
    ('f21_mod_checkout', 'supermarket checkout counter with a cash register and a short conveyor belt', 96),
    ('f21_mod_mannequin', 'fashion mannequin on a round base wearing a jacket', 64),
    ('f21_mod_plantpot', 'large potted green plant in a white ceramic pot', 56),
    ('f21_mod_vending', 'drink vending machine with a glowing front panel, red and blue', 72),
]
# Ancient furniture (tt). Same position as the modern key, so MOD_FURN[i] and TT_FURN[i] share a role.
TT_FURN = [
    ('f21_tt_bed', 'carved dark-wood canopy bed with red silk curtains hanging from a wooden frame', 112),           # giường gỗ màn
    ('f21_tt_hbed', 'acupuncture treatment couch: low wooden bed with a white cloth and a small needle case', 112),  # giường châm cứu
    ('f21_tt_medcab', 'Chinese herbal medicine cabinet: dark wood chest with many tiny drawers and brass pulls', 72),  # tủ thuốc bắc
    ('f21_tt_ivstand', 'round bronze alchemy furnace on three legs with a small smoke vent and glowing red seams', 64),  # lò luyện đan
    ('f21_tt_desk', 'long shop counter of carved dark wood with a brass cash box on top', 96),                      # quầy
    ('f21_tt_table', 'low tea table with two round cushion stools', 80),                                           # bàn thấp + đôn
    ('f21_tt_stove', 'clay earthen stove with a black iron pot on top, brick-red', 72),                            # bếp lò đất
    ('f21_tt_fridge', 'cluster of big glazed clay wine jars with red cloth seals', 64),                            # vò rượu
    ('f21_tt_shelf', 'market stall table with baskets of fruit and bolts of cloth', 88),                           # sạp hàng
    ('f21_tt_rack', 'silk display rack with rolled coloured silk bolts on wooden pegs', 80),                       # giá lụa
    ('f21_tt_sofa', 'tea set on a low square table: teapot, cups and a small incense burner', 88),                 # bộ bàn trà
    ('f21_tt_wardrobe', 'large wooden storage trunk with iron corners and a carved lid', 80),                      # rương gỗ
    ('f21_tt_tv', 'folding paper screen with painted mountain landscape panels in a dark wood frame', 88),         # bình phong
    ('f21_tt_bookshelf', 'scroll bookcase: wooden shelves holding rolled scrolls and bound books', 88),            # giá thư quyển
    ('f21_tt_officedesk', "scholar's writing desk with a brush, an ink stone and an open scroll", 96),             # án thư
    ('f21_tt_cabinet', 'tall lacquered black scroll cabinet with many small drawers and gold fittings', 80),       # tủ quyển
    ('f21_tt_checkout', 'shop counter with a large wooden abacus and an open ledger book', 96),                    # quầy bàn tính
    ('f21_tt_mannequin', 'armour stand holding a lamellar armour set on a wooden frame', 72),                     # giá giáp
    ('f21_tt_plantpot', 'bonsai in a blue ceramic pot with a small pine tree', 56),                                # chậu bonsai
    ('f21_tt_vending', 'tall stone lantern pillar with a glowing red paper lantern on top', 72),                   # cột đèn lồng
]
TERRAIN = [
    ('b21_ice_spire', 'tall jagged pale-cyan ice spire, seen from above with its faceted top and a bright highlight', 96),
    ('b21_ice_crystal', 'cluster of pale-cyan ice crystals rising from frost', 80),
    ('b21_snow_pine', 'snow-covered pine tree canopy, dark green with white snow patches', 96),
    ('b21_snow_rock', 'snow-covered grey boulder with white snow on top', 80),
    ('b21_prim_tree', 'giant ancient primeval tree canopy, dense dark green leaves with a thick twisted trunk visible at the centre', 128),
    ('b21_prim_vine', 'tangled hanging jungle vines and creepers, green with small leaves', 80),
    ('b21_prim_fern', 'large fern plant with radiating green fronds', 80),
    ('b21_prim_log', 'fallen moss-covered tree log lying diagonally, bark and cut rings visible', 96),
    ('b21_herb_bush', 'bush with glowing blue-green spirit herbs and small white flowers', 72),
    ('b21_rail_h', 'horizontal wooden bridge railing segment with two posts', 96),
    ('b21_rail_v', 'vertical wooden bridge railing segment with two posts', 96),
    ('b21_frozen_boulder', 'large boulder encased in thick blue-white ice', 96),
]
ICONS = [
    ('i21_mana_s_mod', 'glowing blue mana tonic in a small glass vial with a silver cap, bright cyan liquid and small sparkles', 80),
    ('i21_elixir_mod', 'white advanced first-aid kit case with a red cross on its lid and a glowing pale-green healing vial in front', 80),
    ('i21_bt_pill_mod', 'glowing faceted cyan-violet rank-up crystal shard inside a transparent serum capsule', 80),
    ('i21_mana_s_tt', 'round jade-green porcelain bottle with a red wax seal and a glowing blue spirit mist', 80),
    ('i21_elixir_tt', 'small red-lacquered pill box with gold trim and a glowing green herb pill beside it', 80),
    ('i21_bt_pill_tt', 'glowing golden alchemy pill with swirling light, resting on a small red silk cushion', 80),
]
BASES = [
    ('ic_base_md', 'rounded shield badge with a bright green #6dff7a rim and dark green fill, a white simple house silhouette with a pitched roof and a door in the centre', 72),
    ('ic_base_tt', 'rounded shield badge with a gold #ffd25a rim and dark bronze fill, a white silhouette of an ancient Chinese roof and gate in the centre', 72),
    ('ic_base_sl', 'rounded shield badge with a bright blue #4fc3ff rim and dark navy fill, a white silhouette of a fortified gate and tower in the centre', 72),
]

# ---- sheets: one generated image each ----
# rows = sprites per row (top to bottom); dilate = first connected-component dilation to try (build21 falls back to others).
SHEETS = [
    dict(name='furn21_mod_1', style=FURN_MOD, items=MOD_FURN[0:7], rows=[4, 3], dilate=14, refs=['props_md', 'sl_props']),
    dict(name='furn21_mod_2', style=FURN_MOD, items=MOD_FURN[7:14], rows=[4, 3], dilate=14, refs=['props_md', 'sl_props']),
    dict(name='furn21_mod_3', style=FURN_MOD, items=MOD_FURN[14:20], rows=[3, 3], dilate=14, refs=['props_md', 'sl_props']),
    dict(name='furn21_tt_1', style=FURN_TT, items=TT_FURN[0:7], rows=[4, 3], dilate=14, refs=['tt_props', 'sl_props']),
    dict(name='furn21_tt_2', style=FURN_TT, items=TT_FURN[7:14], rows=[4, 3], dilate=14, refs=['tt_props', 'sl_props']),
    dict(name='furn21_tt_3', style=FURN_TT, items=TT_FURN[14:20], rows=[3, 3], dilate=14, refs=['tt_props', 'sl_props']),
    dict(name='terr21_1', style=TERR, items=TERRAIN[0:4], rows=[2, 2], dilate=12, refs=['nature', 'tt_props']),
    dict(name='terr21_2', style=TERR, items=TERRAIN[4:8], rows=[2, 2], dilate=12, refs=['nature', 'tt_props']),
    dict(name='terr21_3', style=TERR, items=TERRAIN[8:12], rows=[2, 2], dilate=12, refs=['nature', 'tt_props']),
    dict(name='icon21_items', style=ICON, items=ICONS, rows=[3, 3], dilate=10, refs=['items1']),
    dict(name='icon21_base', style=BASE, items=BASES, rows=[3], dilate=10, refs=['items1']),
]
# ---- seamless textures: one generated square each, built to 256 px (same size as tex_*) ----
TEXTURES = {
    'tex21_ice': ('Frozen mountain glacier ice: pale cyan-white blue ice with fine white frost lines, faint crevasse cracks and small sparkling highlights.', ['tex_ice']),
    'tex21_cliff': ('Rough dark grey-brown mountain rock face, jagged stone cracks and a few small ice patches, solid cliff wall texture.', ['tex_dirt']),
    'tex21_bridge': ('Weathered wooden bridge deck planks running horizontally, grey-brown wood with iron nails and thin dark gaps between planks.', ['tex_wood']),
    'tex21_hosp': ('Hospital floor: pale mint-white polished vinyl tiles in a square grid with thin grey grout, slightly scuffed.', ['tex_tile']),
    'tex21_mall': ('Shopping mall floor: glossy beige-grey marble tiles in a square grid, polished, with subtle reflections.', ['tex_sidewalk']),
    'tex21_wood2': ('Dark polished wooden floorboards, long planks running horizontally, warm brown finish with fine grain.', ['tex_wood']),
    'tex21_moss': ('Primeval forest floor covered with dense green moss, small ferns and dark damp soil.', ['tex_grass']),
}


def group_of(name):
    """Which atlas a sprite is packed into: mod (md+sl), tt, or common (every realm)."""
    if name.startswith(('ic_base_', 'b21_', 'tex21_')): return 'common'
    if name.startswith('f21_tt_') or name.endswith('_tt'): return 'tt'
    if name.startswith('f21_mod_') or name.endswith('_mod'): return 'mod'
    return 'common'


def sheet_prompt(sh):
    items, rows = sh['items'], sh['rows']
    assert sum(rows) == len(items), sh['name']
    layout = ', '.join(f'{c} in row {i + 1}' for i, c in enumerate(rows))
    body = '; '.join(f'{i + 1}) {desc}' for i, (_, desc, _) in enumerate(items))
    return (sh['style'] + f"Draw exactly {len(items)} separate sprites arranged in {len(rows)} row(s) ({layout}), reading left to right, "
            f"top to bottom, in this order: {body}. Square image.")


def main():
    os.makedirs(PROMPTS, exist_ok=True)
    refs_json, count = {}, 0
    for sh in SHEETS:
        p = sheet_prompt(sh)
        open(os.path.join(PROMPTS, sh['name'] + '.txt'), 'w', encoding='utf-8').write(p)
        refs_json[sh['name']] = ['ref21_' + k for k in sh['refs']]
        count += len(sh['items'])
        print(f"{sh['name']:<16} {len(sh['items'])} sprites  rows={sh['rows']}  refs={sh['refs']}  prompt={len(p)} chars")
    for name, (desc, refs) in TEXTURES.items():
        p = TEXT_T + desc
        open(os.path.join(PROMPTS, name + '.txt'), 'w', encoding='utf-8').write(p)
        refs_json[name] = ['ref21_' + k for k in refs]
        print(f"{name:<16} 1 texture   refs={refs}  prompt={len(p)} chars")
    used = {k for sh in SHEETS for k in sh['refs']} | {k for _, r in TEXTURES.values() for k in r}
    os.makedirs(RAW, exist_ok=True)
    for k in sorted(used):
        Image.open(os.path.join(ROOT, REF_SRC[k])).convert('RGBA').save(os.path.join(RAW, 'ref21_' + k + '.png'))
    json.dump(refs_json, open(os.path.join(H, 'gen21_refs.json'), 'w', encoding='utf-8'), indent=1)
    print(f"{len(SHEETS)} sheets + {len(TEXTURES)} textures = {len(SHEETS) + len(TEXTURES)} images, "
          f"{count} sprites on sheets, {len(used)} style refs copied")


if __name__ == '__main__':
    main()
