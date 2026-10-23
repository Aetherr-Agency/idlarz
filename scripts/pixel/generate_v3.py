"""Polished v3 set -> public/pixel/v3/.   python scripts/pixel/generate_v3.py [name ...]

Renders with rim light + cleaner dither (render3d.DEFAULTS), sparkles on gold/gems, plus a gold shine
sprite-sheet for animation."""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import render3d  # noqa: E402

render3d.DEFAULTS.update(rim=True, dither=0.2)

from PIL import Image  # noqa: E402
import icons3  # noqa: E402
import icons4  # noqa: E402

icons3.ICONS.update(icons4.ICONS)   # second polish pass overrides the matching v3 entries
import fx  # noqa: E402
import icons2  # noqa: E402
from common import upscale  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'public', 'pixel', 'v3')
os.makedirs(OUT, exist_ok=True)

only = sys.argv[1:]
icons = {n: f() for n, f in icons3.ICONS.items() if not only or n in only}
for n, im in icons.items():
    im.save(os.path.join(OUT, f'{n}.png'))

# animation: gold glints swell and fade (6 frames, horizontal strip, 40x40 each)
if 'gold' in icons:
    base = icons2.gold()
    spots = fx.find_highlights(base, icons3.GOLD_HI, n=2, min_dist=11)
    frames = fx.shine_frames(base, [(x - 1, y - 1) for x, y in spots])
    strip = Image.new('RGBA', (40 * len(frames), 40), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        strip.alpha_composite(f, (i * 40, 0))
    strip.save(os.path.join(OUT, 'gold_shine_sheet.png'))

K, COLS, PAD = 6, 4, 16
cw = 56 * K + PAD
rows = -(-len(icons) // COLS)
sheet = Image.new('RGBA', (cw * COLS, cw * rows + 110), (150, 133, 117, 255))
for i, (n, im) in enumerate(icons.items()):
    big = upscale(im, K)
    sheet.alpha_composite(big, ((i % COLS) * cw + (cw - big.size[0]) // 2, (i // COLS) * cw + (cw - big.size[1]) // 2))
strip = Image.new('RGBA', (sheet.size[0], 110), (26, 19, 15, 255))
x = 16
for im in icons.values():
    strip.alpha_composite(im, (x, 35))
    x += im.size[0] + 14
sheet.alpha_composite(strip, (0, cw * rows))
sheet.save(os.path.join(OUT, 'preview_v3.png'))

import fog  # noqa: E402
import mockup_v2  # noqa: E402

if not only:
    # fog-of-war mist layers (256px tiles, drawn at 2x and drifted in CSS)
    fog.fog_tile(seed=1).save(os.path.join(OUT, 'fog_a.png'))
    fog.fog_tile(seed=7, tint=(112, 168, 188)).save(os.path.join(OUT, 'fog_b.png'))
parts = mockup_v2.chrome_parts()
for name, img in parts.items():
    img.save(os.path.join(OUT, f'{name}.png'))
if not only:
    mockup_v2.build(icons, parts, os.path.join(OUT, 'preview_topbar_v3.png'))
print('rendered', ', '.join(icons))
