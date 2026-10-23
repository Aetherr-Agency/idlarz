"""Composes the full top bar (same layout/values as the current game header) at 2x."""
from PIL import Image, ImageDraw, ImageFont
from common import hexc as C, upscale

K = 2
FONT_B = r'C:\Windows\Fonts\georgiab.ttf'
FONT = r'C:\Windows\Fonts\georgia.ttf'

RESOURCES = [
    ('gold', '15.10K', '2.24/s', 470), ('wood', '21.63K', '2.61/s', 614),
    ('stone', '11.46K', '1.46/s', 758), ('coal', '19.93K', '2.25/s', 902),
    ('food', '15.03K', '2.03/s', 1046), ('meat', '0', '0/s', 1210),
]


def build(icons, parts, path, width=1293, height=88):
    bar = Image.new('RGBA', (width, height), C('#0a0605'))
    tile, edge = parts['topbar_bg'], parts['topbar_edge']
    for x in range(0, width, tile.size[0]):
        for y in range(0, height - 10, tile.size[1]):
            bar.alpha_composite(tile, (x, y))
    # slight vignette so the middle reads darker than the ends
    shade = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shade)
    for y in range(height - 10):
        sd.line([(0, y), (width, y)], fill=(0, 0, 0, 40 + int(40 * y / height)))
    bar.alpha_composite(shade)
    for x in range(0, width, edge.size[0]):
        bar.alpha_composite(edge, (x, height - 10))

    big = upscale(bar, K)
    d = ImageDraw.Draw(big)

    def put(img, x, y):
        big.alpha_composite(upscale(img, K), (x * K, y * K))

    f_name = ImageFont.truetype(FONT_B, 15 * K)
    f_val = ImageFont.truetype(FONT_B, 17 * K)
    f_rate = ImageFont.truetype(FONT, 12 * K)

    # character block
    put(parts['slot_frame'], 16, 18)
    put(icons['hero'], 24, 20)
    d.text((66 * K, 16 * K), 'Insane', font=f_name, fill=C('#ecdcb4'))
    put(icons['level_star'], 124, 17)
    put(parts['xp_frame'], 66, 42)
    fill = parts['xp_fill'].resize((int((72 - 6) * 0.3) * 1, 4), Image.NEAREST)
    put(fill.resize((fill.size[0], 4), Image.NEAREST), 69, 45)

    # menu buttons
    for i, (key, active) in enumerate((('menu_character', False), ('menu_merchant', True), ('menu_farm', False))):
        x = 168 + i * 48
        put(parts['slot_frame_active' if active else 'slot_frame'], x, 24)
        put(icons[key], x + 4, 28)

    put(parts['divider'], 424, 16)

    for key, val, rate, x in RESOURCES:
        put(icons[key], x, 24)
        d.text(((x + 42) * K, 20 * K), val, font=f_val, fill=C('#f1e6c8'))
        col = C('#6fcf4c') if rate != '0/s' else C('#8a8070')
        d.text(((x + 42) * K, 45 * K), rate, font=f_rate, fill=col)

    big.save(path)
