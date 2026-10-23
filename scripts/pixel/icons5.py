"""Equipment-slot icons (40x40): head, neck, chest, main hand, off hand, legs, feet, ring."""
import math
from render3d import Scene, Prim, rot, vnoise, between, place, add, mul, I3
import icons3
import icons4  # noqa: F401  (extends the shared MATS with leather/cap/etc.)
import fx
from icons2_b import blade_tex
from icons2 import coin_tex  # noqa: F401
from icons3 import MATS, GOLD_HI


def _P(sc, x, y):
    """Point on the camera plane (x right, y up)."""
    return add(mul(sc.r, x), mul(sc.u, y))


def _scene(scale=12.5, origin=(20, 30)):
    return Scene(MATS, scale=scale, origin=origin)


def _A(sc, kind, c, size, mat, R=I3, tex=None, seed=0, yaw=-45):
    sc.add(place(Prim(kind, c, size, mat, R, tex, seed), yaw))


# ----------------------------------------------------------------- head: kettle hat
def head():
    sc = _scene(13.5, (20, 33))
    _A(sc, 'ell', (0, 0, 0.95), (0.88, 0.88, 0.72), 'steel', I3, None, 1)            # dome
    _A(sc, 'cyl', (0, 0, 0.5), (1.38, 0.07), 'steel', I3, None, 2)                   # wide brim
    _A(sc, 'cyl', (0, 0, 0.62), (0.9, 0.06), 'cloth')                                # red band
    _A(sc, 'cyl', (0, 0, 0.42), (1.4, 0.04), 'gold')                                 # brim edge
    for k in range(10):
        a = math.radians(k * 36)
        _A(sc, 'ell', (1.2 * math.cos(a), 1.2 * math.sin(a), 0.55), (0.07, 0.07, 0.05), 'gold')
    _A(sc, 'ell', (0, 0, 1.62), (0.13, 0.13, 0.13), 'gold')
    _A(sc, 'ell', (0.1, 0.25, 1.35), (0.12, 0.45, 0.22), 'cloth', rot(-30, 0, 0), None, 3)  # small plume
    img = sc.render()
    fx.glint(img, 15, 14, 2)
    return img


# ----------------------------------------------------------------- neck: amulet
def neck():
    sc = _scene(12.0, (20, 20))
    n = 15
    for i in range(n + 1):
        x = -1.3 + 2.6 * i / n
        y = -0.05 + 1.75 * (x / 1.3) ** 2
        sc.add(Prim('ell', _P(sc, x, y), (0.12, 0.12, 0.12), 'gold', I3, None, i))
    c = _P(sc, 0, -0.75)
    f = sc.f
    sc.add(between('cyl', add(c, mul(f, 0.1)), add(c, mul(f, -0.1)), (0.62,), 'gold', None, (0, 0, 1), 30))
    sc.add(between('cyl', add(c, mul(f, 0.0)), add(c, mul(f, -0.22)), (0.5,), 'steel', None, (0, 0, 1), 31))
    sc.add(Prim('ell', add(c, mul(f, -0.3)), (0.36, 0.36, 0.3), 'ruby', I3, None, 32))
    for k in range(6):
        a = math.radians(k * 60 + 30)
        sc.add(Prim('ell', add(c, add(mul(sc.r, 0.5 * math.cos(a)), mul(sc.u, 0.5 * math.sin(a)))),
                    (0.09, 0.09, 0.09), 'gold', I3, None, 40 + k))
    sc.add(Prim('ell', _P(sc, 0, 0.12), (0.14, 0.14, 0.18), 'gold', I3, None, 50))   # bail
    img = sc.render()
    fx.glint(img, 17, 26, 2)
    return img


# ----------------------------------------------------------------- chest: cuirass
def plate_tex(pl, nl, pr):
    d = -0.22 if int(math.floor((pl[2] + 2) * 2.5)) % 3 == 0 else 0.0
    return None, d


def chest():
    sc = _scene(12.5, (20, 35))
    _A(sc, 'ell', (0, 0, 1.2), (1.0, 0.62, 1.0), 'steel', I3, plate_tex, 1)          # breastplate
    _A(sc, 'box', (0, -0.58, 0.8), (0.5, 0.06, 0.75), 'cloth')                       # tabard panel
    _A(sc, 'box', (0, -0.62, 0.9), (0.08, 0.04, 0.5), 'gold')
    _A(sc, 'box', (0, -0.62, 1.05), (0.3, 0.04, 0.07), 'gold')
    _A(sc, 'cyl', (0, 0, 0.3), (0.8, 0.09), 'pleather')                              # belt
    _A(sc, 'box', (0, -0.8, 0.3), (0.13, 0.04, 0.09), 'gold')
    for sx in (-1, 1):
        _A(sc, 'ell', (1.1 * sx, 0, 1.95), (0.58, 0.52, 0.42), 'steel', I3, None, 2)  # pauldrons
        _A(sc, 'ell', (1.1 * sx, -0.3, 1.9), (0.1, 0.06, 0.1), 'gold')
        _A(sc, 'cyl', (0.45 * sx, -0.2, 1.65), (0.09, 0.2), 'leather')              # straps
    _A(sc, 'cyl', (0, 0, 1.95), (0.55, 0.12), 'steel')                               # gorget ring
    _A(sc, 'cyl', (0, 0, 2.08), (0.56, 0.04), 'gold')
    img = sc.render()
    fx.glint(img, 13, 10, 2)
    return img


# ----------------------------------------------------------------- main hand: sword
def mainhand():
    sc = _scene(12.0, (20, 20))
    hint = mul(sc.f, -1)
    g = _P(sc, -0.85, -0.95)
    tip = _P(sc, 1.45, 1.6)
    pom = _P(sc, -1.45, -1.55)
    mid = add(mul(g, 0.12), mul(tip, 0.88))
    sc.add(between('box', g, mid, (0.17, 0.05), 'steel', blade_tex, hint))
    sc.add(between('box', mid, tip, (0.1, 0.045), 'steel', blade_tex, hint))
    bx, by = (1.45 + 0.85), (1.6 + 0.95)
    ln = math.hypot(bx, by)
    nx, ny = -by / ln * 0.62, bx / ln * 0.62
    sc.add(between('box', add(g, _P(sc, -nx, -ny)), add(g, _P(sc, nx, ny)), (0.1, 0.1), 'gold', None, hint))
    sc.add(Prim('ell', add(g, _P(sc, 0, 0)), (0.2, 0.2, 0.2), 'ruby', I3, None, 9))
    sc.add(between('cyl', g, pom, (0.11,), 'leather', None, hint))
    sc.add(Prim('ell', pom, (0.24, 0.24, 0.24), 'gold', I3, None, 2))
    img = sc.render()
    fx.glint(img, 33, 6, 2)
    return img


# ----------------------------------------------------------------- off hand: round shield
def shield_face_tex(pl, nl, pr):
    d = -0.15 if int(math.floor(pl[0] * 3.4)) % 2 else 0.04
    return None, d


def offhand():
    sc = _scene(12.0, (20, 20))
    f = sc.f
    c = _P(sc, 0, 0)
    hint = (0, 0, 1)
    sc.add(between('cyl', add(c, mul(f, 0.2)), add(c, mul(f, -0.2)), (1.4,), 'steel', None, hint, 1))      # rim
    sc.add(between('cyl', add(c, mul(f, 0.2)), add(c, mul(f, -0.3)), (1.22,), 'bark', shield_face_tex, hint, 2))
    for sgn in (0,):
        sc.add(between('box', add(_P(sc, -1.18, 0), mul(f, 0.42)), add(_P(sc, 1.18, 0), mul(f, 0.42)), (0.13, 0.05), 'cloth', None, mul(f, -1), 3))
        sc.add(between('box', add(_P(sc, 0, -1.18), mul(f, 0.42)), add(_P(sc, 0, 1.18), mul(f, 0.42)), (0.13, 0.05), 'cloth', None, mul(f, -1), 4))
    sc.add(Prim('ell', add(c, mul(f, -0.62)), (0.42, 0.42, 0.42), 'steel', I3, None, 5))                # boss
    sc.add(Prim('ell', add(c, mul(f, -0.82)), (0.12, 0.12, 0.12), 'gold', I3, None, 6))
    for k in range(8):
        a = math.radians(k * 45 + 22)
        sc.add(Prim('ell', add(add(c, mul(f, -0.4)), add(mul(sc.r, 1.12 * math.cos(a)), mul(sc.u, 1.12 * math.sin(a)))),
                    (0.09, 0.09, 0.09), 'gold', I3, None, 10 + k))
    img = sc.render()
    fx.glint(img, 10, 8, 2)
    return img


# ----------------------------------------------------------------- legs: greaves
def legs():
    sc = _scene(12.0, (20, 36))
    _A(sc, 'ell', (0, 0, 2.1), (0.86, 0.5, 0.55), 'trouser', I3, None, 1)           # hips
    _A(sc, 'cyl', (0, 0, 2.5), (0.8, 0.1), 'pleather')                               # belt
    _A(sc, 'box', (0, -0.8, 2.5), (0.14, 0.04, 0.1), 'gold')
    for sx in (-1, 1):
        _A(sc, 'cyl', (0.5 * sx, 0, 1.2), (0.42, 0.9), 'trouser', I3, None, 2)        # thighs
        _A(sc, 'ell', (0.5 * sx, -0.3, 1.25), (0.5, 0.36, 0.34), 'steel', I3, None, 3)  # knee cops
        _A(sc, 'cyl', (0.5 * sx, 0, 0.3), (0.34, 0.4), 'steel', I3, None, 4)          # shin guards
        _A(sc, 'cyl', (0.5 * sx, 0, 0.62), (0.37, 0.05), 'gold')
    img = sc.render()
    fx.glint(img, 13, 18, 2)
    return img


# ----------------------------------------------------------------- feet: boots
def feet():
    sc = _scene(12.5, (20, 33))
    for sx, dy in ((-1, 0.0), (1, 0.35)):
        x = 0.62 * sx
        _A(sc, 'cyl', (x, 0.1 + dy, 1.15), (0.4, 0.75), 'leather', I3, None, 1)       # shaft
        _A(sc, 'cyl', (x, 0.1 + dy, 1.82), (0.45, 0.1), 'pleather')                    # cuff
        _A(sc, 'ell', (x, -0.38 + dy, 0.34), (0.46, 0.82, 0.34), 'leather', I3, None, 2)  # foot
        _A(sc, 'box', (x, -0.38 + dy, 0.06), (0.5, 0.9, 0.08), 'dark')                # sole
        _A(sc, 'box', (x, -0.35 + dy, 0.9), (0.12, 0.06, 0.14), 'gold')              # buckle
        _A(sc, 'ell', (x - 0.08, -0.78 + dy, 0.5), (0.1, 0.06, 0.07), 'pleather')
    img = sc.render()
    fx.glint(img, 24, 14, 1)
    return img


# ----------------------------------------------------------------- ring
def ring():
    sc = _scene(13.0, (20, 24))
    n = 20
    for i in range(n):
        a = 2 * math.pi * i / n
        sc.add(Prim('ell', _P(sc, 0.85 * math.cos(a), 0.85 * math.sin(a) - 0.25), (0.2, 0.2, 0.2), 'gold', I3, None, i))
    sc.add(Prim('ell', _P(sc, 0, 0.9), (0.45, 0.45, 0.4), 'gold', I3, None, 40))              # setting
    sc.add(Prim('ell', add(_P(sc, 0, 0.92), mul(sc.f, -0.3)), (0.36, 0.36, 0.3), 'ruby', I3, None, 41))
    for k in range(4):
        a = math.radians(45 + 90 * k)
        sc.add(Prim('ell', add(_P(sc, 0.4 * math.cos(a), 0.92 + 0.4 * math.sin(a)), mul(sc.f, -0.2)), (0.1, 0.1, 0.1), 'gold', I3, None, 50 + k))
    img = sc.render()
    fx.glint(img, 17, 6, 2)
    return img


# ----------------------------------------------------------------- merchant portrait (40x56)
def merchant_portrait():
    sc = Scene(MATS, size=(40, 56), scale=9.0, origin=(20, 52))
    # big pack + bedroll behind
    _A(sc, 'ell', (0, 0.85, 2.7), (0.95, 0.6, 1.15), 'pleather', I3, None, 1)
    _A(sc, 'cyl', (0, 0.75, 3.95), (0.34, 0.95), 'cloth', rot(0, 90, 0), None, 2)
    _A(sc, 'ell', (0.75, 0.8, 1.7), (0.4, 0.3, 0.42), 'leather', I3, None, 3)
    # boots + robe
    for sx in (-1, 1):
        _A(sc, 'ell', (0.45 * sx, -0.4, 0.28), (0.4, 0.55, 0.26), 'leather', I3, None, 4)
    _A(sc, 'ell', (0, 0, 1.35), (1.12, 0.88, 1.2), 'cap', I3, None, 5)
    _A(sc, 'ell', (0, 0, 2.75), (0.9, 0.62, 0.95), 'cap', I3, None, 6)
    _A(sc, 'box', (0, -0.62, 2.0), (0.6, 0.07, 1.0), 'tunic', I3, None, 7)            # apron
    _A(sc, 'cyl', (0, 0, 2.15), (0.86, 0.08), 'pleather')                              # belt
    _A(sc, 'ell', (-0.72, -0.3, 2.0), (0.28, 0.22, 0.32), 'pleather', I3, None, 8)     # coin purse
    _A(sc, 'ell', (-0.72, -0.4, 2.35), (0.1, 0.1, 0.07), 'cloth')
    # sleeves + hands, right hand lifts a coin
    for sx in (-1, 1):
        _A(sc, 'ell', (1.05 * sx, 0, 2.8), (0.3, 0.3, 0.6), 'cap', rot(0, 8 * sx, 0), None, 9)
    _A(sc, 'ell', (-1.15, -0.1, 2.0), (0.22, 0.22, 0.2), 'skin')
    _A(sc, 'ell', (1.2, -0.25, 3.45), (0.22, 0.22, 0.2), 'skin')
    _A(sc, 'cyl', (1.2, -0.35, 3.95), (0.34, 0.07), 'gold', rot(90, 0, 0), icons3.coin_tex)
    # head: big nose, grey beard, eyes
    _A(sc, 'ell', (0, 0, 4.15), (0.58, 0.54, 0.62), 'skin')
    _A(sc, 'ell', (0, -0.58, 4.05), (0.15, 0.17, 0.15), 'skin')
    _A(sc, 'ell', (0, -0.18, 3.6), (0.5, 0.4, 0.5), 'beard', I3, None, 10)
    _A(sc, 'ell', (0, -0.5, 3.88), (0.3, 0.1, 0.08), 'beard', I3, None, 11)
    for sx in (-1, 1):
        _A(sc, 'ell', (0.23 * sx, -0.5, 4.25), (0.08, 0.05, 0.08), 'dark')
        _A(sc, 'ell', (0.23 * sx, -0.48, 4.4), (0.15, 0.06, 0.04), 'beard')
    # wide-brim hat with a feather
    _A(sc, 'cyl', (0, 0, 4.78), (0.98, 0.06), 'leather', I3, None, 12)
    _A(sc, 'ell', (0, 0, 5.06), (0.62, 0.6, 0.4), 'leather', I3, None, 13)
    _A(sc, 'cyl', (0, 0, 4.92), (0.64, 0.07), 'cloth')
    _A(sc, 'ell', (0.5, -0.1, 5.26), (0.07, 0.42, 0.17), 'gold', rot(0, 25, 0), None, 14)
    img = sc.render()
    fx.glint(img, 31, 12, 2)
    return img


ICONS = {
    'equip_head': head, 'equip_neck': neck, 'equip_chest': chest, 'equip_mainHand': mainhand,
    'equip_offHand': offhand, 'equip_legs': legs, 'equip_feet': feet, 'equip_ring': ring,
    'merchant_portrait': merchant_portrait,
}
