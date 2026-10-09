"""Artifact-only (writes artifact_pub.html + js/bundle.js, both git-ignored): concatenate every <script src="js/*.js"> of artifact.html (in order) into js/bundle.js and point artifact.html at it.
Keeps the artifact under its 512-file cap. Run after editing index.html / artifact.html scripts. Prints the list of js files to delete from the artifact."""
import re, os, sys
H = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
a = open(os.path.join(H, 'artifact.html'), encoding='utf-8').read()
tags = re.findall(r'<script src="(js/[^"]+\.js)"></script>', a)
if 'js/bundle.js' in tags: tags.remove('js/bundle.js')
if not tags: print('already bundled'); sys.exit()
out = []
for t in tags:
    out.append(f'/* ===== {t} ===== */\n' + open(os.path.join(H, t), encoding='utf-8').read().rstrip() + '\n;\n')
open(os.path.join(H, 'js', 'bundle.js'), 'w', encoding='utf-8').write(''.join(out))
first = a.index(f'<script src="{tags[0]}"></script>')
for t in tags: a = a.replace(f'<script src="{t}"></script>\n', '').replace(f'<script src="{t}"></script>', '')
a = a[:first] + '<script src="js/bundle.js"></script>\n' + a[first:]
open(os.path.join(H, 'artifact_pub.html'), 'w', encoding='utf-8').write(a)
print(len(tags), 'files bundled;', 'delete from artifact:', ' '.join(tags))
