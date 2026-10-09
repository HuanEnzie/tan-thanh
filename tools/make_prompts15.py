"""Round 15: portrait library. 3 worlds x 2 genders x 3 sheets, 12 busts per sheet (4 cols x 3 rows), painted in the style of the existing portraits."""
import os, json, shutil
from PIL import Image
H = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(H, 'prompts'); RAW = os.path.join(H, '..', 'assets', 'raw'); IMGD = os.path.join(H, '..', 'assets', 'img')
os.makedirs(D, exist_ok=True)
for r in ('md', 'tt', 'sl'):
    for i in (1, 2):
        Image.open(os.path.join(IMGD, f'{r}_port{i}.jpg')).convert('RGB').save(os.path.join(RAW, f'ref15_{r}_{i}.png'))
WORLD = {
    'md': ('a zombie post-apocalypse city', 'survivors in worn modern clothes: hoodies, patched military jackets, medic coats, mechanic overalls, scarves, gas masks hanging at the neck, bandages, backpack straps, goggles, dog tags; ragged but characterful; dusty ruined-city or burning-street blurred background in warm orange and dark teal'),
    'tt': ('a Chinese xianxia cultivation world', 'cultivators and wanderers in layered hanfu robes, sect uniforms, scholar robes, hair crowns, jade hairpins, tassels, ribbons, talismans, sword hilts over the shoulder, gourds, healer herb pouches, masks; elegant and poetic; blurred misty mountain, lantern or temple background in deep indigo, gold and jade tones'),
    'sl': ('a modern monster-hunter world with glowing dimensional gates', 'hunters in stylish modern tactical gear: long coats, guild uniforms, armoured jackets, leather, scarves, earpieces, glowing rune accents, mana-tinted eyes; sharp manhwa-hunter fashion; blurred city-night or gate-portal background in violet and electric blue neon'),
}
BATCH = [
    'young adults aged 18 to 28, fresh and energetic or tired',
    'adults aged 29 to 45, experienced, with strong personality, a few with scars or tattoos',
    'a mix of unusual and memorable characters: some elders aged 50 to 70, some with eyepatch / mask / facial paint / heterochromia / dramatic hair colors, plus one or two teenagers aged 15 to 17',
]
P, REFS = {}, {}
for r, (world, wear) in WORLD.items():
    for g, gw in (('m', 'MALE'), ('f', 'FEMALE')):
        for b, batch in enumerate(BATCH):
            n = f'pf15_{r}_{g}_{b}'
            P[n] = (f"Character portrait sheet for a video game set in {world}. Paint exactly 12 DIFFERENT {gw} characters as head-and-shoulders bust portraits, arranged in a grid of 4 columns x 3 rows. "
                    "Each portrait is its own square painting with a thin dark border, all the same size, separated from each other by wide gaps of flat solid magenta (#ff00ff) background. "
                    "Use exactly the same illustration style, painterly pixel-art-anime rendering, dramatic rim lighting and level of detail as the two reference portraits (study their faces, eyes, shading and background treatment). "
                    f"The 12 characters are {batch}. They must look clearly like 12 different people: varied face shapes, noses, eyes, expressions (smiling, serious, smirking, weary, fierce, gentle), hairstyles, hair colors and skin tones, ages. "
                    f"Wardrobe and background fit the world: {wear}. Characters face slightly toward the viewer, eyes visible. No text, no captions, no watermark, no weapons covering faces.")
            REFS[n] = [f'ref15_{r}_1', f'ref15_{r}_2']
for k, v in P.items(): open(os.path.join(D, k + '.txt'), 'w', encoding='utf-8').write(v)
json.dump(REFS, open(os.path.join(H, 'gen15_refs.json'), 'w'), indent=1)
print(len(P), 'prompts')
