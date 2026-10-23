"""v2 icons, part 2: menu icons, level star, hero. Part 1 (resources) lives in icons2.py."""
import math
from PIL import Image, ImageDraw
from render3d import Scene, Prim, rot, vnoise, between, place, add, mul, I3, hexc
from common import add_outline
from icons2 import MATS, coin_tex, make_log_tex, gold, wood, stone, coal, food, meat


def _P(sc, x, y):
    """Point on the camera plane (x right, y up)."""
    return add(mul(sc.r, x), mul(sc.u, y))


# ----------------------------------------------------------------- crossed swords
def blade_tex(pl, nl, pr):
    if abs(pl[0]) < 0.028:
        return None, -0.32            # fuller (blood groove)
    if abs(pl[0]) > pr.s[0] - 0.035:
        return None, 0.3              # honed edge
    return None, 0.0


def swords():
    sc = Scene(MATS, scale=11.5, origin=(20, 20))
    f = sc.f
    hint = mul(f, -1)
    for k, sgn in enumerate((1, -1)):
        depth = mul(f, -0.3 * k)
        g = add(_P(sc, -0.62 * sgn, -0.95), depth)             # guard centre
        tip = add(_P(sc, 1.2 * sgn, 1.5), depth)
        pom = add(_P(sc, -1.15 * sgn, -1.55), depth)
        mid = add(mul(g, 0.2), mul(tip, 0.8))
        sc.add(between('box', g, mid, (0.15, 0.045), 'steel', blade_tex, hint))
        sc.add(between('box', mid, tip, (0.09, 0.04), 'steel', blade_tex, hint))
        # crossguard: perpendicular to the blade, in the camera plane
        bx, by = (1.2 + 0.62) * sgn, 1.5 + 0.95
        ln = math.hypot(bx, by)
        nx, ny = -by / ln * 0.5, bx / ln * 0.5
        sc.add(between('box', add(g, _P(sc, -nx, -ny)), add(g, _P(sc, nx, ny)), (0.09, 0.09), 'gold', None, hint))
        sc.add(between('cyl', g, pom, (0.1,), 'leather', None, hint))
        sc.add(Prim('ell', pom, (0.2, 0.2, 0.2), 'gold', I3, None, 2))
    return sc.render()


# ----------------------------------------------------------------- coin pouch
def pouch_tex(pl, nl, pr):
    n = vnoise(pl[0] * 3, pl[1] * 3, pl[2] * 3, pr.seed)
    d = (n - 0.5) * 0.35
    if abs(pl[0]) < 0.045 and pl[1] < 0:
        d -= 0.3                      # centre seam
    return None, d


def fold_tex(pl, nl, pr):
    a = math.atan2(pl[1], pl[0])
    return None, 0.2 if int(a * 3.2) % 2 else -0.2


def pouch():
    sc = Scene(MATS, scale=11.5, origin=(20, 33))
    sc.add(Prim('ell', (0.1, 0.1, 0.85), (0.95, 0.95, 0.85), 'leather', I3, pouch_tex, 1))
    sc.add(Prim('ell', (0.1, 0.1, 1.55), (0.5, 0.5, 0.38), 'leather', I3, pouch_tex, 2))
    sc.add(Prim('ell', (0.1, 0.1, 1.95), (0.68, 0.68, 0.24), 'leather', I3, fold_tex, 3))
    sc.add(Prim('cyl', (0.1, 0.1, 1.62), (0.6, 0.1), 'cloth', I3, None, 4))
    sc.add(Prim('ell', (-0.5, -0.38, 1.3), (0.17, 0.17, 0.4), 'cloth', rot(0, 25, 0), None, 5))
    sc.add(Prim('ell', (-0.28, -0.62, 1.25), (0.17, 0.17, 0.36), 'cloth', rot(0, -15, 0), None, 6))
    sc.add(Prim('cyl', (-0.95, -0.7, 0.52), (0.5, 0.1), 'gold', rot(90, 0, -45), coin_tex))
    sc.add(Prim('cyl', (0.55, -1.0, 0.1), (0.5, 0.1), 'gold', rot(0, 0, 25), coin_tex))
    sc.add(Prim('cyl', (0.8, -0.6, 0.3), (0.5, 0.1), 'gold', rot(0, 0, 70), coin_tex))
    return sc.render()


# ----------------------------------------------------------------- pitchfork
def pitchfork():
    sc = Scene(MATS, scale=10.0, origin=(20, 37))
    r = sc.r
    p = lambda k, z: add(mul(r, k), (0, 0, z))
    sc.add(Prim('cyl', (0, 0, 1.55), (0.1, 1.55), 'bark', I3, make_log_tex(5), 5))
    sc.add(Prim('cyl', (0, 0, 2.62), (0.17, 0.2), 'steel', I3, None, 1))
    sc.add(between('box', p(-0.62, 3.0), p(0.62, 3.0), (0.1, 0.1), 'steel', None, (0, 0, 1), 2))
    for k in (-0.55, 0.0, 0.55):
        top = 4.35 if k == 0 else 4.05
        sc.add(between('cyl', p(k, 2.95), p(k, top), (0.095,), 'steel', None, (0, 0, 1), 3))
        sc.add(Prim('ell', p(k, top + 0.02), (0.095, 0.095, 0.2), 'steel', I3, None, 4))
    return sc.render()


# ----------------------------------------------------------------- level star (2D, faceted)
def star():
    S = 24
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy, R, r = 11.5, 12.5, 10.6, 4.5
    ramp = [hexc(c) for c in ('#6d3410', '#b26a14', '#e0a020', '#f8d048', '#fff4b0')]
    pts = []
    for i in range(10):
        rad = R if i % 2 == 0 else r
        a = -math.pi / 2 + i * math.pi / 5
        pts.append((cx + rad * math.cos(a), cy + rad * math.sin(a)))
    L = (-0.6, -0.8)
    for i in range(10):
        a, b = pts[i], pts[(i + 1) % 10]
        mx, my = (a[0] + b[0] + cx) / 3 - cx, (a[1] + b[1] + cy) / 3 - cy
        n = math.hypot(mx, my) or 1
        v = 0.5 + 0.5 * ((mx * L[0] + my * L[1]) / n)
        d.polygon([(cx, cy), a, b], fill=ramp[max(0, min(4, int(v * 4.99)))])
    for p in ((8, 6), (9, 5), (8, 7), (11, 9)):
        d.point(p, fill=ramp[4])
    return add_outline(img, hexc('#4a230a'))


# ----------------------------------------------------------------- hero (knight)
def cross_tex(pl, nl, pr):
    if nl[1] < -0.9:
        if abs(pl[0]) < 0.1 and pl[2] > -0.55:
            return 'gold', 0.0
        if abs(pl[2] - 0.2) < 0.1 and abs(pl[0]) < 0.38:
            return 'gold', 0.0
    return None, 0.0


def shield_tex(pl, nl, pr):
    u = (pl[0] / pr.s[0]) ** 2 + (pl[2] / pr.s[2]) ** 2
    if u > 0.58:
        return 'gold', 0.0
    if abs(pl[0]) < 0.07 or abs(pl[2] - 0.05) < 0.07:
        return 'gold', -0.05
    return None, 0.0


def hero():
    sc = Scene(MATS, size=(40, 56), scale=9.0, origin=(20, 52))

    def A(kind, c, size, mat, R=I3, tex=None, seed=0):
        sc.add(place(Prim(kind, c, size, mat, R, tex, seed), -45))

    for sx in (-1, 1):                                            # legs + boots
        A('cyl', (0.45 * sx, 0, 1.25), (0.3, 0.75), 'steel')
        A('ell', (0.45 * sx, -0.14, 0.3), (0.38, 0.6, 0.3), 'leather', I3, None, 2)
    A('box', (0, 0, 2.2), (0.85, 0.48, 0.6), 'cloth', I3, None, 1)    # tabard skirt
    A('box', (0, 0, 2.62), (0.9, 0.52, 0.12), 'leather', I3, None, 3)  # belt
    A('box', (0, -0.54, 2.62), (0.16, 0.05, 0.12), 'gold')
    A('ell', (0, 0, 3.4), (0.95, 0.58, 0.9), 'steel', I3, None, 4)     # breastplate
    A('box', (0, -0.5, 3.1), (0.5, 0.08, 0.85), 'cloth', I3, cross_tex, 5)
    for sx in (-1, 1):                                            # arms, pauldrons, hands
        A('cyl', (1.28 * sx, 0, 2.95), (0.27, 0.62), 'steel')
        A('ell', (1.18 * sx, 0, 3.95), (0.55, 0.52, 0.42), 'steel', I3, None, 6)
        A('ell', (1.3 * sx, -0.1, 2.2), (0.27, 0.27, 0.25), 'leather')
    A('box', (1.3, -0.25, 3.95), (0.1, 0.035, 1.3), 'steel', I3, blade_tex)   # sword
    A('box', (1.3, -0.25, 2.6), (0.38, 0.06, 0.07), 'gold')
    A('ell', (-1.55, -0.5, 2.9), (0.55, 0.15, 0.85), 'blue', I3, shield_tex)   # shield
    A('ell', (0, 0, 4.7), (0.66, 0.64, 0.72), 'steel', I3, None, 7)            # helm
    A('box', (0, -0.6, 4.62), (0.42, 0.06, 0.07), 'dark')
    A('box', (0, -0.58, 4.3), (0.06, 0.06, 0.22), 'dark')
    A('ell', (0, 0.05, 5.4), (0.12, 0.52, 0.38), 'cloth', I3, None, 8)         # plume
    return sc.render()


ICONS = {
    'gold': gold, 'wood': wood, 'stone': stone, 'coal': coal, 'food': food, 'meat': meat,
    'menu_character': swords, 'menu_merchant': pouch, 'menu_farm': pitchfork, 'level_star': star,
    'hero': hero,
}
