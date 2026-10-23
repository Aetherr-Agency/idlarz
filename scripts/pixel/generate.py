"""Regenerates every sample PNG into public/pixel/.   python scripts/pixel/generate.py"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image  # noqa: E402
from common import upscale  # noqa: E402
import icons  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'public', 'pixel')
os.makedirs(OUT, exist_ok=True)

built = {}
for name, fn in icons.ICONS.items():
    img = fn()
    img.save(os.path.join(OUT, f'{name}.png'))
    built[name] = img

# contact sheet (x6) so the whole set can be reviewed at a glance
k = 6
cell = 32 * k + 24
sheet = Image.new('RGBA', (cell * len(built), cell), (26, 20, 16, 255))
for i, (name, img) in enumerate(built.items()):
    big = upscale(img, k)
    sheet.alpha_composite(big, (i * cell + 12, 12))
sheet.save(os.path.join(OUT, 'preview_icons.png'))
import chrome  # noqa: E402
import mockup  # noqa: E402

parts = {
    'topbar_bg': chrome.bg_tile(), 'topbar_edge': chrome.edge_strip(),
    'slot_frame': chrome.slot(), 'slot_frame_active': chrome.slot(True),
    'xp_frame': chrome.xp_frame(), 'xp_fill': chrome.xp_fill(), 'divider': chrome.divider(),
}
for name, img in parts.items():
    img.save(os.path.join(OUT, f'{name}.png'))
mockup.build(built, parts, os.path.join(OUT, 'preview_topbar.png'))
print('wrote', len(built), 'icons to', OUT)
