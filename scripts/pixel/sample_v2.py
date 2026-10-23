"""Renders the v2 approval sample: python scripts/pixel/sample_v2.py"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image  # noqa: E402
import icons2_b  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'public', 'pixel', 'v2-sample')
os.makedirs(OUT, exist_ok=True)

K = 8
BG = (150, 133, 117, 255)      # tan, same as the reference sheet
imgs = {n: f() for n, f in icons2_b.ICONS.items()}
cell = 40 * K + 40
sheet = Image.new('RGBA', (cell * len(imgs), cell + 120), BG)
for i, (n, im) in enumerate(imgs.items()):
    im.save(os.path.join(OUT, f'{n}.png'))
    sheet.alpha_composite(im.resize((40 * K, 40 * K), Image.NEAREST), (i * cell + 20, 20))
# real-size strip on the game's header colour: 1x and 2x
strip = Image.new('RGBA', (cell * len(imgs), 120), (26, 19, 15, 255))
for i, im in enumerate(imgs.values()):
    strip.alpha_composite(im, (i * cell + 60, 40))
    strip.alpha_composite(im.resize((80, 80), Image.NEAREST), (i * cell + 150, 20))
sheet.alpha_composite(strip, (0, cell))
sheet.save(os.path.join(OUT, 'sample_sheet.png'))
print('ok')
