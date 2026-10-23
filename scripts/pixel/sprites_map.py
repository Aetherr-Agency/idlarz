"""Map sprites: one icon per biome (32x32), the bonus cash bag (24x24) and the XP orb (40x40).
Same ray-cast look as the rest of the set, just smaller canvases for the 48px map tiles."""
import math
from render3d import Scene, Prim, rot, vnoise, between, I3
from materials import MATS
from sprites_resources import coin_tex
import fx


def _scene(scale, origin, size=32):
    return Scene(MATS, size=size, scale=scale, origin=origin)


def _P(sc, kind, c, size, mat, R=I3, tex=None, seed=0):
    sc.add(Prim(kind, c, size, mat, R, tex, seed))


def _pine(sc, x, y, h=1.0, mat='pine', seed=0):
    """Layered fir: trunk + three cones."""
    _P(sc, 'cyl', (x, y, 0.28 * h), (0.11 * h, 0.28 * h), 'bark', I3, None, seed)
    for i, (r, hh, z) in enumerate(((0.78, 0.44, 0.72), (0.6, 0.4, 1.12), (0.42, 0.36, 1.5))):
        _P(sc, 'cone', (x, y, z * h), (r * h, hh * h), mat, I3, None, seed + i)


# ----------------------------------------------------------------- biomes
def forest():
    sc = _scene(10.0, (16, 24))
    _pine(sc, -0.55, 0.45, 0.85, seed=1)
    _pine(sc, 0.65, 0.1, 0.95, seed=4)
    _pine(sc, -0.05, -0.65, 1.1, seed=7)
    img = sc.render()
    return img


def plains():
    sc = _scene(9.4, (16, 24))
    for i, (x, y, h) in enumerate(((-0.7, 0.3, 1.5), (-0.3, -0.2, 1.9), (0.1, 0.35, 1.7), (0.5, -0.1, 2.0),
                                    (0.85, 0.3, 1.45), (-0.05, -0.6, 1.3))):
        _P(sc, 'cyl', (x, y, h / 2), (0.09, h / 2), 'grass', I3, None, i)
        _P(sc, 'ell', (x, y, h + 0.1), (0.14, 0.14, 0.42), 'wheat', I3, None, i)
        _P(sc, 'cone', (x, y, h + 0.62), (0.05, 0.2), 'wheat', I3, None, i)
    for i, (x, y, mat) in enumerate(((-0.95, -0.35, 'blossom'), (0.35, -0.7, 'ruby'))):
        _P(sc, 'cyl', (x, y, 0.35), (0.04, 0.35), 'grass')
        _P(sc, 'ell', (x, y, 0.8), (0.17, 0.17, 0.12), mat)
        _P(sc, 'ell', (x, y, 0.85), (0.07, 0.07, 0.07), 'gold')
    _P(sc, 'ell', (0.0, 0.0, 0.1), (1.35, 1.0, 0.16), 'grass', I3, None, 9)
    return sc.render()


def hills():
    sc = _scene(9.0, (16, 24))
    _P(sc, 'cone', (-0.25, 0.1, 1.0), (1.15, 1.0), 'granite_dk', rot(0, 0, 25), None, 1)
    _P(sc, 'cone', (0.2, 0.9, 1.0 * 0.65), (0.85, 0.65), 'granite_dk', rot(0, 0, 70), None, 2)
    _P(sc, 'cone', (-0.25, 0.1, 1.5), (0.52, 0.5), 'snow', rot(0, 0, 25), None, 3)       # snow cap
    _P(sc, 'ell', (0.85, -0.55, 0.28), (0.4, 0.35, 0.28), 'granite', I3, None, 4)         # boulders
    _P(sc, 'ell', (-0.9, -0.5, 0.2), (0.3, 0.26, 0.2), 'granite', I3, None, 5)
    return sc.render()


def swamp():
    sc = _scene(9.4, (16, 24))
    _P(sc, 'cyl', (0, 0.05, 0.1), (1.35, 0.1), 'swamp_water', I3, None, 1)                 # murky pool
    _P(sc, 'cyl', (-0.35, -0.3, 0.24), (0.5, 0.05), 'lily', I3, None, 2)                   # lily pad
    _P(sc, 'ell', (-0.3, -0.35, 0.36), (0.15, 0.15, 0.1), 'blossom')
    _P(sc, 'cyl', (0.45, -0.5, 0.24), (0.34, 0.05), 'lily', I3, None, 3)
    for i, (x, y, h) in enumerate(((0.55, 0.55, 1.7), (0.95, 0.15, 1.4), (-0.7, 0.6, 1.55), (0.2, 0.8, 1.2))):
        _P(sc, 'cyl', (x, y, h / 2), (0.1, h / 2), 'reed', I3, None, i)
        _P(sc, 'ell', (x, y, h + 0.05), (0.11, 0.11, 0.32), 'cattail', I3, None, i)
    return sc.render()


def tundra():
    sc = _scene(9.4, (16, 24))
    _P(sc, 'ell', (0, 0.1, 0.12), (1.35, 1.0, 0.2), 'snow', I3, None, 1)                   # snow drift
    for i, (x, y, h, rx, rz) in enumerate(((0.1, 0.1, 1.6, 20, 10), (-0.7, -0.1, 1.15, -15, 25), (0.8, 0.45, 1.0, 18, -20), (0.45, -0.7, 0.7, -10, 40))):
        _P(sc, 'box', (x, y, 0.2 + h / 2), (0.28, 0.26, h / 2), 'ice', rot(rx, 0, rz), None, i)     # crystals
        _P(sc, 'cone', (x, y, 0.2 + h + 0.2), (0.28, 0.22), 'ice', rot(rx, 0, rz), None, i + 5)
    _P(sc, 'ell', (0.55, -0.55, 0.22), (0.3, 0.25, 0.2), 'snow')
    return sc.render()


def lake():
    sc = _scene(9.4, (16, 24))
    _P(sc, 'cyl', (0, 0, 0.06), (1.55, 0.06), 'sand', I3, None, 1)                          # shore
    _P(sc, 'cyl', (0, 0, 0.16), (1.2, 0.1), 'water', I3, None, 2)                           # water
    _P(sc, 'cyl', (0.35, -0.2, 0.28), (0.34, 0.04), 'lily', I3, None, 3)
    _P(sc, 'ell', (0.35, -0.2, 0.36), (0.1, 0.1, 0.08), 'blossom')
    for i, (x, y, h) in enumerate(((-0.95, 0.75, 1.3), (-0.7, 0.95, 1.0), (1.0, 0.7, 1.15))):
        _P(sc, 'cyl', (x, y, h / 2), (0.1, h / 2), 'reed', I3, None, i)
        _P(sc, 'ell', (x, y, h + 0.04), (0.1, 0.1, 0.28), 'cattail', I3, None, i)
    img = sc.render()
    fx.glint(img, 12, 14, 1)
    return img


def grounds():
    sc = _scene(9.4, (16, 24))
    _P(sc, 'box', (0, 0, 0.12), (1.3, 0.95, 0.12), 'soil', rot(0, 0, 0), None, 1)           # tilled plot
    for i in range(3):                                                                      # furrows + sprouts
        _P(sc, 'box', (0, -0.55 + i * 0.55, 0.28), (1.15, 0.12, 0.07), 'soil', I3, None, 10 + i)
        for j in range(4):
            _P(sc, 'cone', (-0.8 + j * 0.5, -0.55 + i * 0.55, 0.5), (0.09, 0.16), 'grass', I3, None, 30 + i * 4 + j)
    for sx in (-1, 1):                                                                       # stakes + string
        _P(sc, 'cyl', (1.15 * sx, -0.85, 0.7), (0.07, 0.6), 'bark', I3, None, 5)
    sc.add(between('cyl', (-1.15, -0.85, 1.05), (1.15, -0.85, 1.05), (0.025,), 'cream', None, (0, 0, 1)))
    _P(sc, 'cyl', (0.55, 0.45, 0.85), (0.06, 0.75), 'bark', rot(0, 12, 0), None, 6)           # shovel
    _P(sc, 'box', (0.55 + 0.17, 0.45, 0.18), (0.2, 0.05, 0.26), 'steel', rot(0, 12, 0), None, 7)
    return sc.render()


# ----------------------------------------------------------------- bonus cash bag (24x24)
def cash_bag():
    sc = _scene(8.6, (12, 20), size=24)
    _P(sc, 'ell', (0, 0, 0.8), (0.95, 0.9, 0.82), 'pleather', I3, None, 1)                   # sack
    _P(sc, 'ell', (0, 0, 1.45), (0.5, 0.5, 0.4), 'pleather', I3, None, 2)                    # neck
    for k in range(5):                                                                        # ruffle
        a = math.radians(k * 72 + 20)
        _P(sc, 'ell', (0.42 * math.cos(a), 0.42 * math.sin(a), 1.85), (0.26, 0.26, 0.24), 'pleather',
           rot(20 * math.sin(a), -20 * math.cos(a), 0), None, 3 + k)
    _P(sc, 'cyl', (0, 0, 1.5), (0.58, 0.09), 'cloth')                                         # tie
    f = sc.f
    c = (-0.35, -0.35, 0.8)
    sc.add(between('cyl', (c[0] + f[0] * 0.1, c[1] + f[1] * 0.1, c[2] + f[2] * 0.1 + 0.25),
                   (c[0] - f[0] * 0.2, c[1] - f[1] * 0.2, c[2] - f[2] * 0.2 + 0.25), (0.5,), 'gold', None, (0, 0, 1)))
    _P(sc, 'cyl', (0.2, 0.1, 2.1), (0.36, 0.08), 'gold', rot(25, 0, 20), coin_tex)           # coin peeking out
    img = sc.render()
    fx.glint(img, 3, 3, 2)
    return img


# ----------------------------------------------------------------- XP orb (40x40)
def xp_orb():
    sc = Scene(MATS, scale=12.5, origin=(20, 21))
    _P(sc, 'ell', (0, 0, 0.9), (1.15, 1.15, 1.15), 'xp', I3, None, 1)
    _P(sc, 'ell', (-0.22, -0.3, 1.25), (0.46, 0.4, 0.46), 'xp', I3, None, 2)                  # inner glow
    for k, (dx, dz) in enumerate(((0.95, 0.85), (-0.85, 1.2))):                                # orbiting sparks
        _P(sc, 'ell', (dx, -0.9, dz + 0.6), (0.1, 0.1, 0.1), 'xp', I3, None, 5 + k)
    img = sc.render()
    fx.glint(img, 11, 10, 3)
    fx.glint(img, 31, 30, 1)
    return img


# ----------------------------------------------------------------- "?" mark for unexplored land (12x16)
def unknown_mark():
    from PIL import Image
    from common import add_outline, hexc
    rows = ['..####..', '.######.', '##....##', '##....##', '.....##.', '....##..', '...##...', '...##...',
            '........', '...##...', '...##...']
    img = Image.new('RGBA', (12, 16), (0, 0, 0, 0))
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch == '#':
                lit = x + y < 7
                img.putpixel((x + 2, y + 2), hexc('#f0f6ff') if lit else hexc('#a8c0f0'))
    img = add_outline(img, hexc('#1a2866'))
    for x, y in ((1, 1), (10, 3), (2, 13)):
        img.putpixel((x, y), hexc('#cfe0ff'))
    return img


SPRITES = {
    'unknown': unknown_mark,
    'biome_forest': forest, 'biome_plains': plains, 'biome_hills': hills, 'biome_swamp': swamp,
    'biome_tundra': tundra, 'biome_lake': lake, 'biome_grounds': grounds,
    'cash_bag': cash_bag, 'xp': xp_orb,
}
