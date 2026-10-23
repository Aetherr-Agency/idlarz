"""UI chrome art -> public/pixel/ui/.   python scripts/pixel/generate_ui.py"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image  # noqa: E402
import ui_art  # noqa: E402
from common import upscale  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'public', 'pixel', 'ui')
os.makedirs(OUT, exist_ok=True)

parts = {
    'frame_modal': ui_art.frame_modal(),
    'frame_panel': ui_art.frame_panel(),
    'frame_tip': ui_art.frame_tip(),
    'flask_glass': ui_art.flask_glass(),
    'flask_mask': ui_art.flask_mask(),
    'flask_bubbles': ui_art.flask_bubbles(),
    'medal_base': ui_art.medallion_base(),
    'medal_fill': ui_art.medallion_fill(),
}
for name, img in parts.items():
    img.save(os.path.join(OUT, f'{name}.png'))

# preview sheet: flasks at 5 fill levels + medallion at 3 fills + frames
K = 5
sheet = Image.new('RGBA', (1400, 520), (30, 22, 18, 255))
x = 10
glass, mask = parts['flask_glass'], parts['flask_mask']
for lvl, (c0, c1) in enumerate((((255, 90, 90), (140, 16, 40)), ((100, 170, 255), (28, 46, 150)))):
    liquid = Image.new('RGBA', glass.size, (0, 0, 0, 0))
    top = int(11 + (1 - (0.35 + 0.5 * lvl)) * 40)
    for yy in range(top, glass.size[1]):
        t = (yy - top) / max(1, glass.size[1] - top)
        col = tuple(int(c0[i] + (c1[i] - c0[i]) * t) for i in range(3)) + (255,)
        for xx in range(glass.size[0]):
            if mask.getpixel((xx, yy))[3]:
                liquid.putpixel((xx, yy), col)
    comp = Image.new('RGBA', glass.size, (0, 0, 0, 0))
    comp.alpha_composite(liquid)
    comp.alpha_composite(glass)
    sheet.alpha_composite(upscale(comp, K), (x, 10))
    x += glass.size[0] * K + 20
for fill in (0.15, 0.5, 0.85):
    base, fl = parts['medal_base'].copy(), parts['medal_fill']
    mfill = fl.copy()
    import math
    for yy in range(ui_art.MEDAL):
        for xx in range(ui_art.MEDAL):
            r, a = ui_art._polar(xx, yy)
            if a / 360 > fill:
                mfill.putpixel((xx, yy), (0, 0, 0, 0))
    base.alpha_composite(mfill)
    sheet.alpha_composite(upscale(base, 3), (x, 10))
    x += ui_art.MEDAL * 3 + 10
sheet.save(os.path.join(OUT, 'preview_ui.png'))
print('ui art ->', OUT)
