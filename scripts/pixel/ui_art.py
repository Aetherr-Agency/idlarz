"""Game-UI art (2D, Pillow): 9-slice frames, HP/MP flask glass + mask + bubbles, XP medallion.
Rendered into public/pixel/ui/ by generate_ui.py."""
import math
import random
from PIL import Image, ImageDraw
from common import hexc as C


# ----------------------------------------------------------------- 9-slice frames
def _corner_rivet(d, cx, cy):
    d.ellipse([cx - 2, cy - 2, cx + 2, cy + 2], fill=C('#c9954a'))
    d.ellipse([cx - 1, cy - 1, cx + 1, cy + 1], fill=C('#8a5f26'))
    d.point((cx - 1, cy - 1), fill=C('#fff0b8'))


def frame_modal(slice_px=12):
    """36x36 source, 12px border. Edges repeat (round) every 12px; corners carry the ornament."""
    S = slice_px * 3
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # bands from the outside in (colour, thickness)
    bands = [('#080504', 1), ('#d9a850', 1), ('#b07c34', 1), ('#7a5224', 1), ('#2b1d0e', 1),
             ('#4a4440', 1), ('#5e5750', 2), ('#3a352f', 1), ('#1c1814', 1), ('#080504', 1)]
    o = 0
    for col, t in bands:
        for k in range(t):
            d.rectangle([o, o, S - 1 - o, S - 1 - o], outline=C(col))
            o += 1
    # clear the centre so only the border survives
    d.rectangle([slice_px, slice_px, S - 1 - slice_px, S - 1 - slice_px], fill=(0, 0, 0, 0))
    # edge ticks (one per 12px cell) - tiny notches in the iron band
    mid = slice_px * 1.5
    for (x, y) in ((mid, 6), (mid, S - 7), (6, mid), (S - 7, mid)):
        d.rectangle([int(x) - 1, int(y) - 1, int(x) + 1, int(y) + 1], fill=C('#2b2520'))
        d.point((int(x) - 1, int(y) - 1), fill=C('#7a6e60'))
    # corner brackets: gold plate + rivet
    for cx, cy, sx, sy in ((0, 0, 1, 1), (S - 1, 0, -1, 1), (0, S - 1, 1, -1), (S - 1, S - 1, -1, -1)):
        pts = [(cx, cy), (cx + sx * 11, cy), (cx + sx * 11, cy + sy * 3), (cx + sx * 3, cy + sy * 3),
               (cx + sx * 3, cy + sy * 11), (cx, cy + sy * 11)]
        d.polygon(pts, fill=C('#b07c34'))
        d.line([pts[0], pts[1]], fill=C('#f0d27a'))
        d.line([pts[0], pts[5]], fill=C('#f0d27a'))
        d.line([pts[2], pts[3]], fill=C('#6a4414'))
        d.line([pts[3], pts[4]], fill=C('#6a4414'))
        d.line([pts[4], pts[5]], fill=C('#6a4414'))
        _corner_rivet(d, cx + sx * 6, cy + sy * 6)
    return img


def frame_panel():
    """12x12 source, 4px border: slim bronze inset for cards/panels."""
    S = 12
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for o, col in enumerate(('#080504', '#7a5224', '#3a2810', '#1a120c')):
        d.rectangle([o, o, S - 1 - o, S - 1 - o], outline=C(col))
    d.rectangle([4, 4, S - 5, S - 5], fill=(0, 0, 0, 0))
    for x, y in ((0, 0), (S - 1, 0), (0, S - 1), (S - 1, S - 1)):
        d.point((x, y), fill=(0, 0, 0, 0))
    for x, y in ((1, 1), (S - 2, 1), (1, S - 2), (S - 2, S - 2)):
        d.point((x, y), fill=C('#d9a850'))
    d.line([(2, 1), (S - 3, 1)], fill=C('#a8783a'))
    d.line([(1, 2), (1, S - 3)], fill=C('#a8783a'))
    return img


def frame_tip():
    """12x12 source, 4px border: brighter gold tooltip frame with accent corners."""
    S = 12
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for o, col in enumerate(('#050302', '#c08a30', '#5a3c14', '#120c08')):
        d.rectangle([o, o, S - 1 - o, S - 1 - o], outline=C(col))
    d.rectangle([4, 4, S - 5, S - 5], fill=(0, 0, 0, 0))
    for x, y in ((0, 0), (S - 1, 0), (0, S - 1), (S - 1, S - 1)):
        d.point((x, y), fill=(0, 0, 0, 0))
    for (x, y), (dx, dy) in (((1, 1), (1, 0)), ((S - 2, 1), (-1, 0)), ((1, S - 2), (1, 0)), ((S - 2, S - 2), (-1, 0))):
        d.point((x, y), fill=C('#fff0b8'))
        d.point((x + dx, y), fill=C('#f0d27a'))
    return img


# ----------------------------------------------------------------- flask (HP / MP)
FLASK_W, FLASK_H = 40, 56


def _shape(r_bulb, neck_half, cx=20, cy=37):
    """Point-in-flask test: round bulb + shoulder + neck."""
    def inside(x, y):
        if (x - cx) ** 2 + (y - cy) ** 2 <= r_bulb ** 2:
            return True
        if y <= 24 and abs(x - cx) <= neck_half and y >= 8:
            return True
        # shoulder: smooth taper from neck to the bulb
        if 22 <= y <= 28:
            t = (y - 22) / 6.0
            if abs(x - cx) <= neck_half + t * (r_bulb - neck_half) * 0.85 and (x - cx) ** 2 + (y - cy) ** 2 <= (r_bulb + 3) ** 2:
                return True
        return False
    return inside


def flask_mask():
    """White where liquid may appear (the glass interior)."""
    img = Image.new('RGBA', (FLASK_W, FLASK_H), (0, 0, 0, 0))
    inside = _shape(12.5, 4)
    for y in range(FLASK_H):
        for x in range(FLASK_W):
            if inside(x + 0.5, y + 0.5) and y >= 11:
                img.putpixel((x, y), (255, 255, 255, 255))
    return img


def flask_glass():
    """Outline, glass thickness, highlights, lip and cork. Interior stays transparent."""
    img = Image.new('RGBA', (FLASK_W, FLASK_H), (0, 0, 0, 0))
    px = img.load()
    outer = _shape(15.5, 6.5)
    inner = _shape(12.5, 4)
    for y in range(FLASK_H):
        for x in range(FLASK_W):
            o, i = outer(x + 0.5, y + 0.5), inner(x + 0.5, y + 0.5)
            if o and not i and y >= 9:
                # glass wall: bright on the upper-left, darker lower-right
                lit = (x + y) < 58
                px[x, y] = C('#cfe6f4', 200) if lit else C('#6a8aa0', 200)
    d = ImageDraw.Draw(img)
    # dark outline around the whole bottle
    out = img.copy()
    op = out.load()
    for y in range(FLASK_H):
        for x in range(FLASK_W):
            if px[x, y][3] == 0 and not inner(x + 0.5, y + 0.5):
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < FLASK_W and 0 <= ny < FLASK_H and px[nx, ny][3] > 150:
                        op[x, y] = C('#10202c')
                        break
    img = out
    d = ImageDraw.Draw(img)
    # lip
    d.rectangle([13, 8, 27, 10], fill=C('#8fb0c4'))
    d.line([(13, 8), (27, 8)], fill=C('#e8f6ff'))
    d.rectangle([12, 7, 28, 7], fill=C('#10202c'))
    d.rectangle([12, 11, 28, 11], fill=C('#10202c'))
    # cork
    d.rectangle([16, 1, 24, 7], fill=C('#8a5a30'))
    d.rectangle([16, 1, 24, 2], fill=C('#c08a50'))
    d.rectangle([16, 6, 24, 7], fill=C('#5a3a1c'))
    d.line([(15, 1), (15, 7)], fill=C('#2a1608'))
    d.line([(25, 1), (25, 7)], fill=C('#2a1608'))
    d.line([(16, 0), (24, 0)], fill=C('#2a1608'))
    for p in ((18, 3), (21, 4), (19, 5)):
        d.point(p, fill=C('#6a4220'))
    # glass shine: arc streaks on the left, a spark on the shoulder
    for y in range(28, 46):
        d.point((9 + (46 - y) // 9, y), fill=(255, 255, 255, 150))
    d.line([(10, 30), (12, 28)], fill=(255, 255, 255, 190))
    d.point((18, 14), fill=(255, 255, 255, 170))
    d.point((18, 15), fill=(255, 255, 255, 170))
    d.point((31, 44), fill=(255, 255, 255, 80))
    return img


def flask_bubbles(h=24):
    """Tileable (vertically) bubble strip; animate background-position-y upward."""
    img = Image.new('RGBA', (FLASK_W, h), (0, 0, 0, 0))
    rnd = random.Random(5)
    d = ImageDraw.Draw(img)
    for _ in range(9):
        x, y = rnd.randint(6, FLASK_W - 8), rnd.randint(0, h - 1)
        r = rnd.choice((1, 1, 2))
        if r == 1:
            d.rectangle([x, y, x + 1, y + 1], fill=(255, 255, 255, 120))
        else:
            d.ellipse([x, y, x + 3, y + 3], outline=(255, 255, 255, 150))
            d.point((x + 1, y + 1), fill=(255, 255, 255, 220))
    return img


# ----------------------------------------------------------------- XP medallion
MEDAL = 80
SEGMENTS = 40


def _polar(x, y, c=39.5):
    dx, dy = x + 0.5 - (c + 0.5), y + 0.5 - (c + 0.5)
    r = math.hypot(dx, dy)
    a = (math.degrees(math.atan2(dx, -dy)) + 360) % 360      # 0 = top, clockwise
    return r, a


def medallion_base():
    img = Image.new('RGBA', (MEDAL, MEDAL), (0, 0, 0, 0))
    px = img.load()
    for y in range(MEDAL):
        for x in range(MEDAL):
            r, a = _polar(x, y)
            lit = math.cos(math.radians(a - 315))              # light from the upper-left
            col = None
            if r <= 39.5:
                if r > 36.5:                                    # outer bronze ring
                    t = (r - 36.5) / 3.0
                    base = ['#f0d27a', '#c9954a', '#9a6a2a', '#5a3a14'][min(3, int(t * 4))]
                    col = base if lit > -0.2 or t > 0.6 else '#6a4414'
                    if r > 39.0:
                        col = '#080504'
                elif r > 35.5:
                    col = '#0c0806'
                elif r > 27.5:                                  # empty XP band (segments)
                    seg = (a % (360 / SEGMENTS)) / (360 / SEGMENTS)
                    if seg < 0.16 or seg > 0.84:
                        col = '#0c0806'
                    else:
                        col = '#2a3a3c' if r < 33.5 else '#3c5254'
                        if r > 34.8:
                            col = '#4c6668'
                        if r < 28.6:
                            col = '#1a2628'
                elif r > 25.5:
                    col = '#080504' if r > 26.5 else '#8a5f26'
                else:                                           # centre disc
                    t = r / 25.5
                    col = ['#242e4c', '#1c2540', '#151c34', '#0e1426'][min(3, int(t * 4))]
                    if lit > 0.55 and r > 14:
                        col = '#2c3860'
            if col:
                px[x, y] = C(col)
    # studs on the outer ring
    d = ImageDraw.Draw(img)
    for k in range(8):
        a = math.radians(k * 45)
        cx, cy = 39.5 + 37.8 * math.sin(a), 39.5 - 37.8 * math.cos(a)
        d.ellipse([cx - 1.6, cy - 1.6, cx + 1.6, cy + 1.6], fill=C('#fff0b8') if k % 2 == 0 else C('#ee5a6e'))
        d.point((int(cx), int(cy)), fill=C('#ffffff'))
    # shine on the centre disc
    for i in range(10):
        d.point((16 + i, 30 - i // 2 - (i * i) // 40), fill=(255, 255, 255, 40))
    return img


def medallion_fill():
    img = Image.new('RGBA', (MEDAL, MEDAL), (0, 0, 0, 0))
    px = img.load()
    for y in range(MEDAL):
        for x in range(MEDAL):
            r, a = _polar(x, y)
            if 27.5 < r <= 35.5:
                seg = (a % (360 / SEGMENTS)) / (360 / SEGMENTS)
                if 0.16 <= seg <= 0.84:
                    if r > 34.6:
                        col = '#d8ffb0'
                    elif r > 31.5:
                        col = '#7ee04a'
                    elif r > 29.0:
                        col = '#3fae2c'
                    else:
                        col = '#237a1e'
                    px[x, y] = C(col)
    return img
