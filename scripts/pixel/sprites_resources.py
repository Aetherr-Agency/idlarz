"""Resource sprites (40x40): gold, wood, stone, coal, bread (food), meat."""
import math
from render3d import Scene, Prim, rot, vnoise, between, I3
from materials import MATS
import fx

GOLD_HI = [MATS['gold'].ramp[-1], MATS['gold'].spec_col]


# ----------------------------------------------------------------- shared textures
# ----------------------------------------------------------------- textures
def coin_tex(pl, nl, pr):
    r = math.hypot(pl[0], pl[1]) / pr.s[0]
    if nl[2] > 0.9:                       # top face
        if 0.76 < r < 0.88:
            return None, -0.42           # engraved ring
        if r > 0.9:
            return None, 0.3             # bevel rim light
        if r < 0.36 and (abs(pl[0]) < 0.07 or abs(pl[1]) < 0.07 or r < 0.14):
            return None, -0.35           # tiny cross emblem
        if r < 0.36:
            return None, 0.1
        return None, 0.0
    ang = math.atan2(pl[1], pl[0])       # milled edge
    h = pr.s[1]
    if pl[2] > h - 0.05:
        return None, 0.32                # rim catches the light
    if pl[2] < -h + 0.05:
        return None, -0.35               # underside tucked in shadow
    return None, (-0.05 if int(ang * 8 / math.pi) % 2 else -0.18)


def make_log_tex(seed):
    def tex(pl, nl, pr):
        if abs(nl[2]) > 0.9:             # cut end -> pale wood with rings
            r = math.hypot(pl[0], pl[1]) / pr.s[0]
            ring = int(r * 5.5)
            d = -0.1 if ring % 2 else 0.1
            if r < 0.1:
                d = -0.4
            if r > 0.92:
                return 'bark', 0.0
            # a radial crack
            if abs(math.atan2(pl[1], pl[0]) - 0.6) < 0.05 and 0.12 < r < 0.7:
                d = -0.5
            return 'wood_cut', d
        ang = math.atan2(pl[1], pl[0])
        n = vnoise(ang * 3.0, pl[2] * 1.1, seed, seed)
        d = (n - 0.5) * 0.7
        if n > 0.82:
            d -= 0.4                       # dark bark fissures
        return None, d
    return tex


def stone_tex(pl, nl, pr):
    s = pr.s
    d = 0.0
    ex = [abs(abs(pl[i]) - s[i]) for i in range(3)]
    near = sum(1 for e in ex if e < 0.07)
    if near >= 2:
        d += 0.28                         # chiselled edge catches light
    c = abs(vnoise(pl[0] * 2.4, pl[1] * 2.4, pl[2] * 2.4, pr.seed) - 0.5)
    if c < 0.018:
        d -= 0.5                          # hairline cracks
    return None, d


def coal_tex(pl, nl, pr):
    d = 0.0
    n = vnoise(pl[0] * 3.1, pl[1] * 3.1, pl[2] * 3.1, pr.seed)
    if n > 0.74:
        d += 0.22                         # glassy flecks
    s = pr.s
    if sum(1 for i in range(3) if abs(abs(pl[i]) - s[i]) < 0.09) >= 2:
        d += 0.3                          # chipped edges catch the light
    return None, d


def meat_tex(pl, nl, pr):
    n = vnoise(pl[0] * 2.6, pl[1] * 2.6, pl[2] * 2.6, pr.seed)
    if n > 0.64:
        return 'sear', (n - 0.64) * -0.2 + 0.0
    return None, (n - 0.5) * 0.25


def bone_tex(pl, nl, pr):
    return None, 0.0


# ----------------------------------------------------------------- sprites
def wood():
    sc = Scene(MATS, scale=12.5, origin=(19, 23))
    def log(x, y, z, length, r, yaw, seed):
        sc.add(Prim('cyl', (x, y, z), (r, length / 2), 'bark', rot(90, 0, yaw), make_log_tex(seed), seed))
    log(0.0, 0.52, 0.5, 1.7, 0.5, 90, 3)
    log(0.0, -0.52, 0.5, 1.7, 0.5, 90, 7)
    log(0.1, 0.0, 1.32, 1.7, 0.48, 90, 11)
    return sc.render()


def stone():
    sc = Scene(MATS, scale=12.0, origin=(20, 22))
    def blk(x, y, z, hx, hy, hz, yaw, seed):
        sc.add(Prim('box', (x, y, z), (hx, hy, hz), 'stone', rot(0, 0, yaw), stone_tex, seed))
    blk(-0.6, 0.3, 0.45, 0.75, 0.75, 0.45, 0, 1)
    blk(0.65, -0.25, 0.45, 0.7, 0.7, 0.45, 0, 2)
    blk(0.0, 0.0, 1.35, 0.6, 0.6, 0.45, 8, 3)
    blk(0.35, 0.95, 0.2, 0.3, 0.3, 0.2, 25, 4)
    return sc.render()


# ----------------------------------------------------------------- coal / food / meat
def coal():
    sc = Scene(MATS, scale=12.5, origin=(20, 24))
    def chunk(x, y, z, hx, hy, hz, ax, ay, az, seed):
        sc.add(Prim('box', (x, y, z), (hx, hy, hz), 'coal', rot(ax, ay, az), coal_tex, seed))
    sc.add(Prim('ell', (0.45, 0.45, 0.7), (0.78, 0.7, 0.7), 'coal', rot(10, 0, 30), coal_tex, 1))
    sc.add(Prim('ell', (-0.1, -0.5, 0.35), (0.5, 0.45, 0.38), 'coal', rot(0, 0, 20), coal_tex, 8))
    chunk(-0.55, 0.15, 0.5, 0.55, 0.5, 0.5, -20, 15, 70, 2)
    chunk(0.35, -0.55, 0.45, 0.5, 0.45, 0.42, 25, -18, 10, 3)
    chunk(-0.1, 0.75, 1.15, 0.38, 0.36, 0.34, 30, 10, 20, 5)
    chunk(1.05, -0.2, 0.25, 0.26, 0.24, 0.24, 15, 20, 40, 6)
    return sc.render()


def meat():
    sc = Scene(MATS, scale=12.0, origin=(21, 22))
    # bone (lower-left) with two-lobed knuckle
    sc.add(between('cyl', (-0.5, 0.0, 0.7), (-1.55, -0.2, 0.2), (0.17,), 'bone', bone_tex))
    sc.add(Prim('ell', (-1.65, 0.0, 0.18), (0.3, 0.28, 0.27), 'bone', rot(0, 0, 0), bone_tex, 3))
    sc.add(Prim('ell', (-1.62, -0.42, 0.14), (0.28, 0.26, 0.26), 'bone', rot(0, 0, 0), bone_tex, 4))
    # meat: tapered body (two overlapping ellipsoids) + knobby top
    sc.add(Prim('ell', (-0.25, 0.0, 0.85), (0.62, 0.55, 0.55), 'meat', rot(0, 0, 0), meat_tex, 1))
    sc.add(Prim('ell', (0.5, 0.05, 1.05), (0.95, 0.85, 0.85), 'meat', rot(0, 0, 0), meat_tex, 2))
    return sc.render()


# ----------------------------------------------------------------- icons
def _gold_base():
    sc = Scene(MATS)
    def stack(x, y, n, r=0.55, seed=0):
        for i in range(n):
            j = ((seed * 7 + i * 5) % 7 - 3) * 0.018
            sc.add(Prim('cyl', (x + j, y - j, 0.1 + i * 0.2), (r, 0.1), 'gold',
                        rot(0, 0, 23 * (i + seed)), coin_tex))
    stack(0.4, 0.45, 5, seed=1)
    stack(-0.6, 0.15, 3, seed=2)
    stack(0.2, -0.75, 2, r=0.52, seed=4)
    # coin standing on edge, facing the camera
    sc.add(Prim('cyl', (-0.95, -0.55, 0.52), (0.52, 0.1), 'gold', rot(90, 0, -45), coin_tex))
    # loose coins on the ground
    sc.add(Prim('cyl', (-0.2, -0.9, 0.1), (0.5, 0.1), 'gold', rot(0, 0, 40), coin_tex))
    return sc.render()


def sparkle_gold(img, n=2):
    """Twinkle glints on the brightest coin highlights. Returns (image, spots)."""
    spots = fx.find_highlights(img, GOLD_HI, n=n, min_dist=11)
    for (x, y), r in zip(spots, (3, 2)):
        fx.glint(img, x - 1, y - 1, r)
    return img, spots


def gold():
    img, _ = sparkle_gold(_gold_base())
    return img


def gold_base():
    return _gold_base()


# ----------------------------------------------------------------- food: bread
def loaf_tex(pl, nl, pr):
    if pl[2] > 0.08 and abs(pl[1]) < 0.42:
        if ((pl[0] * 1.1 + pl[1] * 1.5) % 1.0) < 0.3:
            return 'crumb', 0.0            # diagonal scores show the soft crumb
    n = vnoise(pl[0] * 4, pl[1] * 4, pl[2] * 4, pr.seed)
    return None, (0.3 if n > 0.78 else 0.0)  # flour dusting


def boule_tex(pl, nl, pr):
    if pl[2] > 0.18 and (abs(pl[0]) < 0.11 or abs(pl[1]) < 0.11):
        return 'crumb', 0.0                 # cross-cut
    n = vnoise(pl[0] * 4, pl[1] * 4, pl[2] * 4, pr.seed)
    return None, (0.3 if n > 0.8 else 0.0)


def bread():
    sc = Scene(MATS, scale=12.0, origin=(20, 30))
    sc.add(Prim('ell', (0.35, 0.55, 0.5), (1.55, 0.5, 0.46), 'bread', rot(0, 0, 14), loaf_tex, 1))   # baguette
    sc.add(Prim('ell', (-0.15, -0.8, 0.6), (0.82, 0.82, 0.6), 'bread', rot(0, 0, 25), boule_tex, 2))  # boule
    for p in ((-1.15, -0.1), (0.7, -1.1), (1.45, -0.35)):
        sc.add(Prim('ell', (p[0], p[1], 0.06), (0.09, 0.09, 0.06), 'crumb', I3, None, 4))
    return sc.render()
