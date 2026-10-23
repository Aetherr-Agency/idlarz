"""Resource + menu icons, 32x32, Diablo-2-ish: dark outline, muted palette, 3/4 iso view."""
import math
from PIL import Image, ImageDraw
from common import hexc as C, canvas, add_outline, shadow, speckle, shaded_ellipse, iso_cube


# ---------------------------------------------------------------- gold
def coin(d, cx, cy, rx=6, ry=3, t=2):
    side, rim, top, hi = C('#8a5a10'), C('#c58a1c'), C('#f0c43c'), C('#fff1a0')
    d.ellipse([cx - rx, cy - ry + t, cx + rx, cy + ry + t], fill=side)
    d.rectangle([cx - rx, cy, cx + rx, cy + t], fill=side)
    d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=rim)
    d.ellipse([cx - rx + 1, cy - ry + 1, cx + rx - 1, cy + ry - 1], fill=top)
    d.ellipse([cx - 2, cy - 1, cx + 2, cy + 1], outline=C('#c58a1c'))
    d.point((cx - rx + 2, cy - 1), fill=hi)
    d.point((cx - rx + 3, cy - 2), fill=hi)


def coin_stack(d, cx, cy, n):
    for i in range(n):
        coin(d, cx + (1 if i % 2 else 0), cy - i * 2)


def gold():
    img, d = canvas()
    shadow(img, [2, 22, 30, 31])
    d = ImageDraw.Draw(img)
    coin_stack(d, 20, 22, 4)
    coin_stack(d, 11, 25, 3)
    coin_stack(d, 22, 27, 2)
    for p in ((7, 14), (26, 11)):
        d.point(p, fill=C('#fff6c0'))
        d.point((p[0] - 1, p[1]), fill=C('#ffe27a'))
        d.point((p[0] + 1, p[1]), fill=C('#ffe27a'))
        d.point((p[0], p[1] - 1), fill=C('#ffe27a'))
        d.point((p[0], p[1] + 1), fill=C('#ffe27a'))
    return add_outline(img)


# ---------------------------------------------------------------- wood
def log(img, x0, y0, length, r):
    """Log lying along the iso axis (2px right per 1px down); end cap faces the viewer."""
    d = ImageDraw.Draw(img)
    bark_hi, bark, bark_lo, bark_dk = C('#8a5a30'), C('#6b4423'), C('#4a2d15'), C('#33200f')
    x1 = x0 + length
    for x in range(x0, x1 + 1):
        yc = y0 + (x - x0) // 2
        for y in range(yc - r, yc + r + 1):
            t = (y - (yc - r)) / (2 * r)
            col = bark_hi if t < 0.22 else bark if t < 0.55 else bark_lo if t < 0.85 else bark_dk
            d.point((x, y), fill=col)
    yc1 = y0 + length // 2
    rx = max(2, int(r * 0.7))
    d.ellipse([x1 - rx, yc1 - r, x1 + rx, yc1 + r], fill=C('#d9ab6a'))
    d.ellipse([x1 - rx + 1, yc1 - r + 1, x1 + rx - 1, yc1 + r - 1], outline=C('#a8793f'))
    d.ellipse([x1 - 1, yc1 - 2, x1 + 1, yc1 + 1], outline=C('#a8793f'))
    d.point((x1, yc1), fill=C('#7a5328'))
    speckle(img, bark, bark_lo, 0.14, seed=x0 + y0)
    speckle(img, bark_hi, bark, 0.18, seed=x0 + y0 + 3)


def wood():
    img, d = canvas()
    shadow(img, [1, 22, 31, 31])
    log(img, 2, 14, 12, 4)    # back-left
    log(img, 10, 10, 12, 4)   # back-right
    log(img, 6, 18, 14, 4)    # front
    log(img, 12, 14, 12, 4)   # front-right
    return add_outline(img)


# ---------------------------------------------------------------- stone
def stone():
    img, d = canvas()
    shadow(img, [1, 24, 31, 31])
    d = ImageDraw.Draw(img)
    top, left, right, edge = C('#b9b5aa'), C('#7f7b72'), C('#4d4944'), C('#e4dfd2')
    mortar = C('#2b2926')

    def block(tx, ty):
        iso_cube(d, tx, ty, 8, 7, top, left, right, edge)
        d.line([(tx, ty + 8), (tx, ty + 14)], fill=mortar)           # centre crease
        d.line([(tx - 8, ty + 4 + 7), (tx, ty + 8 + 7)], fill=C('#5d5951'))   # bottom-left edge
        d.line([(tx, ty + 8 + 7), (tx + 8, ty + 4 + 7)], fill=C('#363330'))   # bottom-right edge

    block(10, 17)
    block(10, 10)
    block(21, 15)
    for p in ((6, 22), (7, 23), (14, 26), (24, 25), (26, 22), (13, 15), (7, 16), (23, 20)):
        d.point(p, fill=mortar)
    speckle(img, left, C('#6a655d'), 0.2, 2)
    speckle(img, right, C('#3a3733'), 0.2, 3)
    speckle(img, top, C('#cdc8bb'), 0.14, 4)
    return add_outline(img)


# ---------------------------------------------------------------- coal
def lump(d, cx, cy, s):
    base, face, hi, dk = C('#1d1c22'), C('#34333c'), C('#6f819f'), C('#0d0c10')
    pts = [(cx - s, cy), (cx - int(s * .6), cy - int(s * .8)), (cx + int(s * .3), cy - s),
           (cx + s, cy - int(s * .2)), (cx + int(s * .8), cy + int(s * .6)), (cx - int(s * .2), cy + int(s * .8))]
    d.polygon(pts, fill=base)
    d.polygon([pts[0], pts[1], pts[2], (cx, cy - int(s * .1))], fill=face)
    d.polygon([pts[3], pts[4], pts[5], (cx + int(s * .1), cy + int(s * .1))], fill=dk)
    d.line([pts[1], pts[2]], fill=hi)
    d.point((cx - int(s * .5), cy - int(s * .3)), fill=hi)


def coal():
    img, d = canvas()
    shadow(img, [2, 22, 30, 31])
    d = ImageDraw.Draw(img)
    lump(d, 20, 15, 6)
    lump(d, 11, 19, 6)
    lump(d, 22, 23, 6)
    lump(d, 13, 25, 4)
    lump(d, 17, 10, 4)
    d.point((26, 18), fill=C('#9fb4d9'))
    return add_outline(img)


# ---------------------------------------------------------------- food (wheat sheaf)
def wheat_ear(d, x, y, ang, n=4):
    """Ear of wheat growing from (x, y) in direction `ang` (radians, 0 = up)."""
    dx, dy = math.sin(ang), -math.cos(ang)
    px, py = -dy, dx
    for i in range(n):
        cx, cy = x + dx * (i * 2 + 1), y + dy * (i * 2 + 1)
        for s_, col in ((-1, C('#c9962a')), (1, C('#f3cd55'))):
            gx, gy = round(cx + px * s_ * 1.3), round(cy + py * s_ * 1.3)
            d.point((gx, gy), fill=col)
            d.point((gx + round(dx), gy + round(dy)), fill=col)
        d.point((round(cx), round(cy)), fill=C('#e6b53c'))
    tx, ty = round(x + dx * (n * 2 + 1)), round(y + dy * (n * 2 + 1))
    d.point((tx, ty), fill=C('#f6e39a'))


def food():
    img, d = canvas()
    shadow(img, [5, 26, 27, 31])
    d = ImageDraw.Draw(img)
    base = (16, 27)
    for ang in (-0.42, -0.2, 0.0, 0.2, 0.42):
        r0, r1 = 9, 17
        mid = (round(base[0] + math.sin(ang) * r0), round(base[1] - math.cos(ang) * r0))
        d.line([base, mid], fill=C('#8f8a3a'))
        wheat_ear(d, mid[0], mid[1], ang, 4)
    # binding rope + knot
    d.rectangle([12, 21, 20, 23], fill=C('#8b2f22'))
    d.line([(12, 21), (20, 21)], fill=C('#c4503a'))
    d.line([(12, 23), (20, 23)], fill=C('#5c1d14'))
    d.rectangle([14, 24, 18, 27], fill=C('#a8883a'))
    d.line([(14, 24), (14, 27)], fill=C('#d2b25a'))
    d.point((19, 24), fill=C('#8b2f22'))
    d.point((20, 25), fill=C('#8b2f22'))
    return add_outline(img)


# ---------------------------------------------------------------- meat (roast leg)
def _drop(cx, cy, rx, ry, ang, taper):
    """Polygon of a tilted teardrop (narrow end toward -x before rotation)."""
    pts = []
    for i in range(36):
        t = i * math.pi / 18
        x, y = math.cos(t) * rx, math.sin(t) * ry
        k = 1 - taper * (1 - (x / rx + 1) / 2) ** 1.5      # squeeze the narrow end
        y *= k
        pts.append((round(cx + x * math.cos(ang) - y * math.sin(ang)),
                    round(cy + x * math.sin(ang) + y * math.cos(ang))))
    return pts


def meat():
    img, d = canvas()
    shadow(img, [3, 25, 29, 31])
    d = ImageDraw.Draw(img)
    bone, bone_dk = C('#eadfc4'), C('#b5a888')
    d.line([(10, 20), (5, 25)], fill=bone, width=3)
    d.line([(11, 21), (6, 26)], fill=bone_dk)
    d.ellipse([2, 22, 7, 27], fill=bone)
    d.ellipse([4, 25, 9, 30], fill=bone)
    d.point((3, 23), fill=C('#fff8e4'))
    d.point((5, 26), fill=C('#fff8e4'))
    d.polygon(_drop(19, 12, 11, 9, math.radians(140), 0.0), fill=C('#5a1d12'))
    d.polygon(_drop(18, 11, 10, 8, math.radians(140), 0.0), fill=C('#8f3720'))
    d.polygon(_drop(17, 10, 8, 6, math.radians(140), 0.0), fill=C('#c25a35'))
    d.polygon(_drop(16, 9, 5, 3, math.radians(140), 0.0), fill=C('#e0814f'))
    for p in ((20, 9), (21, 10), (22, 11), (23, 7), (24, 8), (18, 13), (19, 14)):
        d.point(p, fill=C('#6b2415'))
    d.point((13, 7), fill=C('#ffd9ae'))
    d.point((14, 6), fill=C('#ffd9ae'))
    return add_outline(img)


# ---------------------------------------------------------------- menu icons
def swords():
    img, d = canvas()
    for sgn in (1, -1):
        a = (5 if sgn == 1 else 26, 5)
        b = (26 if sgn == 1 else 5, 26)
        d.line([a, b], fill=C('#8f98a6'), width=3)
        d.line([(a[0], a[1] + 1), (b[0], b[1] - 1)], fill=C('#dfe6f0'))
    # crossguards + grips
    d.line([(17, 21), (23, 15)], fill=C('#b8862a'), width=2)
    d.line([(14, 21), (8, 15)], fill=C('#b8862a'), width=2)
    d.line([(24, 24), (27, 27)], fill=C('#5c3a1c'), width=2)
    d.line([(7, 24), (4, 27)], fill=C('#5c3a1c'), width=2)
    d.point((28, 28), fill=C('#e0b23a'))
    d.point((3, 28), fill=C('#e0b23a'))
    return add_outline(img)


def pouch():
    img, d = canvas()
    shadow(img, [4, 25, 28, 31])
    d = ImageDraw.Draw(img)
    shaded_ellipse(img, [6, 11, 26, 29], [
        (C('#4a2d15'), 0, 0, 0, 0),
        (C('#7a5230'), -1, -1, -3, -3),
        (C('#a8743f'), -3, -3, -9, -8),
    ])
    d = ImageDraw.Draw(img)
    d.polygon([(11, 12), (21, 12), (23, 7), (19, 9), (16, 5), (13, 9), (9, 7)], fill=C('#7a5230'))
    d.line([(10, 12), (22, 12)], fill=C('#8b2f22'), width=2)
    d.point((11, 11), fill=C('#c4503a'))
    d.line([(16, 13), (13, 17)], fill=C('#8b2f22'))
    d.line([(16, 13), (19, 17)], fill=C('#8b2f22'))
    # coin on the pouch
    d.ellipse([14, 20, 22, 26], fill=C('#c58a1c'))
    d.ellipse([15, 21, 21, 25], fill=C('#f0c43c'))
    d.point((16, 22), fill=C('#fff1a0'))
    return add_outline(img)


def pitchfork():
    img, d = canvas()
    d.line([(16, 12), (16, 29)], fill=C('#7a5230'), width=2)
    d.line([(15, 14), (15, 28)], fill=C('#a8743f'))
    d.line([(8, 6), (8, 13)], fill=C('#a7b0bd'), width=2)
    d.line([(16, 4), (16, 13)], fill=C('#c8d0da'), width=2)
    d.line([(24, 6), (24, 13)], fill=C('#a7b0bd'), width=2)
    d.rectangle([7, 12, 25, 14], fill=C('#8b95a3'))
    d.line([(7, 12), (25, 12)], fill=C('#dfe6f0'))
    d.point((16, 3), fill=C('#e8eef6'))
    d.point((8, 5), fill=C('#e8eef6'))
    d.point((24, 5), fill=C('#e8eef6'))
    return add_outline(img)


def star():
    img, d = canvas(16, 16)
    pts = []
    for i in range(10):
        r = 7 if i % 2 == 0 else 3
        a = -math.pi / 2 + i * math.pi / 5
        pts.append((8 + r * math.cos(a), 8.5 + r * math.sin(a)))
    d.polygon(pts, fill=C('#e8b32c'))
    d.polygon([(8, 2), (9, 6), (8, 8), (7, 6)], fill=C('#fff0a0'))
    return add_outline(img)


def hero():
    """24x36 knight portrait - steel, red tabard, gold cross."""
    img, d = canvas(24, 36)
    shadow(img, [2, 31, 22, 36])
    d = ImageDraw.Draw(img)
    steel_hi, steel, steel_lo = C('#c3cad6'), C('#8a93a1'), C('#575e6a')
    red, red_hi, red_lo = C('#9a2424'), C('#c23a2e'), C('#5e1414')
    gold = C('#e0b23a')
    # boots + greaves
    for x in (7, 14):
        d.rectangle([x, 28, x + 3, 33], fill=C('#4a2d15'))
        d.rectangle([x - 1, 32, x + 3, 33], fill=C('#33200f'))
        d.rectangle([x, 22, x + 3, 28], fill=steel)
        d.line([(x, 22), (x, 28)], fill=steel_hi)
    # tabard
    d.polygon([(6, 13), (18, 13), (19, 27), (5, 27)], fill=red)
    d.line([(6, 13), (5, 27)], fill=red_hi)
    d.line([(18, 14), (19, 27)], fill=red_lo)
    d.rectangle([5, 22, 19, 23], fill=C('#5c3a1c'))
    d.rectangle([11, 22, 12, 23], fill=gold)
    d.rectangle([11, 15, 12, 20], fill=gold)
    d.rectangle([9, 17, 14, 18], fill=gold)
    # arms + pauldrons
    d.rectangle([2, 15, 5, 23], fill=steel_lo)
    d.rectangle([19, 15, 22, 23], fill=steel_lo)
    d.ellipse([1, 11, 8, 17], fill=steel)
    d.ellipse([16, 11, 23, 17], fill=steel)
    d.line([(2, 12), (5, 11)], fill=steel_hi)
    d.line([(17, 12), (20, 11)], fill=steel_hi)
    # sword in right hand
    d.line([(22, 4), (22, 22)], fill=C('#dfe6f0'))
    d.line([(20, 21), (24, 21)], fill=gold)
    d.point((22, 3), fill=C('#ffffff'))
    # helm + visor + plume
    d.ellipse([7, 1, 17, 12], fill=steel)
    d.rectangle([7, 7, 17, 12], fill=steel)
    d.line([(8, 3), (8, 11)], fill=steel_hi)
    d.rectangle([9, 6, 15, 7], fill=C('#0e0a08'))
    d.line([(12, 2), (12, 11)], fill=steel_lo)
    d.line([(10, 10), (14, 10)], fill=C('#0e0a08'))
    d.polygon([(10, 1), (14, 1), (16, -1), (12, -2)], fill=red_hi)
    return add_outline(img)


ICONS = {
    'gold': gold, 'wood': wood, 'stone': stone, 'coal': coal, 'food': food, 'meat': meat,
    'menu_character': swords, 'menu_merchant': pouch, 'menu_farm': pitchfork, 'level_star': star,
    'hero': hero,
}
