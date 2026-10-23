"""Renders the full v2 icon set into public/pixel/v2/.   python scripts/pixel/generate_v2.py [name ...]"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image  # noqa: E402
import icons2_b  # noqa: E402
from common import upscale  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'public', 'pixel', 'v2')
os.makedirs(OUT, exist_ok=True)

only = sys.argv[1:]
icons = {n: f() for n, f in icons2_b.ICONS.items() if not only or n in only}
for n, im in icons.items():
    im.save(os.path.join(OUT, f'{n}.png'))

# contact sheet: grid at 6x on the reference's tan, plus a real-size row on the header colour
K, COLS, PAD = 6, 4, 16
cw = 56 * K + PAD
rows = -(-len(icons) // COLS)
sheet = Image.new('RGBA', (cw * COLS, cw * rows + 110), (150, 133, 117, 255))
for i, (n, im) in enumerate(icons.items()):
    big = upscale(im, K)
    x = (i % COLS) * cw + (cw - big.size[0]) // 2
    y = (i // COLS) * cw + (cw - big.size[1]) // 2
    sheet.alpha_composite(big, (x, y))
strip = Image.new('RGBA', (sheet.size[0], 110), (26, 19, 15, 255))
x = 16
for im in icons.values():
    strip.alpha_composite(im, (x, 35))
    x += im.size[0] + 14
sheet.alpha_composite(strip, (0, cw * rows))
sheet.save(os.path.join(OUT, 'preview_v2.png'))
print('rendered', ', '.join(icons))

# chrome (resized for 40px icons) + full top-bar mockup
import mockup_v2  # noqa: E402
parts = mockup_v2.chrome_parts()
for name, img in parts.items():
    img.save(os.path.join(OUT, f'{name}.png'))
if not only:
    mockup_v2.build(icons, parts, os.path.join(OUT, 'preview_topbar_v2.png'))
    print('mockup written')
