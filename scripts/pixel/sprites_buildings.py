"""Grounds-tile buildings (40x40): farm, mine, lumber mill, market, blacksmith, workshop.
Each is both the picker icon and the tile graphic once a grounds tile is converted."""
import math
from render3d import Scene, Prim, rot, between, I3
from materials import MATS
import fx


def _scene(scale, origin):
    return Scene(MATS, size=40, scale=scale, origin=origin)


def _P(sc, kind, c, size, mat, R=I3, seed=0):
    sc.add(Prim(kind, c, size, mat, R, None, seed))


def _roof(sc, cx, cy, z, hx, hy, mat, tilt=36, thick=0.07, ridge='cream'):
    """Gable roof with the ridge along x: two sloped slabs + ridge cap."""
    _P(sc, 'box', (cx, cy - hy * 0.55, z), (hx, hy * 0.78, thick), mat, rot(tilt, 0, 0), 1)
    _P(sc, 'box', (cx, cy + hy * 0.55, z), (hx, hy * 0.78, thick), mat, rot(-tilt, 0, 0), 2)
    _P(sc, 'box', (cx, cy, z + hy * 0.55 * math.tan(math.radians(tilt)) * 0.9), (hx, 0.07, 0.07), ridge)


# ----------------------------------------------------------------- farm: thatched cottage, haystack, crops
def farm():
    sc = _scene(9.0, (20, 31))
    _P(sc, 'box', (-0.3, 0.55, 0.6), (0.95, 0.7, 0.6), 'cream', I3, 1)                      # cottage walls
    _P(sc, 'cone', (-0.3, 0.55, 1.1 + 0.55), (1.18, 0.55), 'thatch', I3, 2)                      # thatched roof
    _P(sc, 'box', (0.35, -0.16, 0.45), (0.2, 0.04, 0.38), 'door')                              # door
    _P(sc, 'box', (-0.8, -0.16, 0.7), (0.17, 0.04, 0.15), 'dark')                              # window
    _P(sc, 'box', (0.5, 0.95, 1.55), (0.14, 0.14, 0.4), 'granite', I3, 3)                      # chimney
    _P(sc, 'cone', (1.45, 0.4, 0.62), (0.58, 0.62), 'wheat', I3, 4)                            # haystack
    _P(sc, 'ell', (1.45, 0.4, 1.25), (0.1, 0.1, 0.1), 'wheat')
    for row, y in enumerate((-0.85, -1.5)):                                                    # crop rows
        _P(sc, 'box', (-0.35, y, 0.07), (1.25, 0.2, 0.07), 'soil', I3, 10 + row)
        for i in range(5):
            _P(sc, 'ell', (-1.3 + i * 0.5, y, 0.28), (0.17, 0.17, 0.22), 'grass', I3, 20 + row * 5 + i)
    _P(sc, 'ell', (0.9, -1.5, 0.28), (0.22, 0.22, 0.2), 'cloth')                                # pumpkin-ish
    img = sc.render()
    return img


# ----------------------------------------------------------------- mine: mountain face, timbered tunnel, cart
def mine():
    sc = _scene(8.6, (20, 31))
    _P(sc, 'ell', (0.2, 0.55, 0.45), (1.7, 1.15, 1.05), 'granite_dk', I3, 1)                   # rock mass
    _P(sc, 'ell', (-1.0, 0.8, 0.3), (0.55, 0.5, 0.5), 'granite', I3, 2)
    _P(sc, 'ell', (1.45, 0.9, 0.35), (0.5, 0.45, 0.45), 'granite', I3, 3)
    _P(sc, 'box', (0.2, -0.45, 0.4), (0.5, 0.18, 0.46), 'dark')                                # tunnel mouth
    for sx in (-1, 1):
        _P(sc, 'box', (0.2 + 0.58 * sx, -0.55, 0.5), (0.09, 0.1, 0.58), 'bark', I3, 5)         # timber frame
    _P(sc, 'box', (0.2, -0.55, 1.06), (0.7, 0.1, 0.09), 'bark', I3, 6)
    _P(sc, 'ell', (0.2, -0.66, 0.9), (0.07, 0.07, 0.07), 'glow')                               # lantern
    for sx in (-0.18, 0.18):                                                                    # rails
        _P(sc, 'box', (0.2 + sx, -1.25, 0.04), (0.04, 0.9, 0.04), 'steel')
    for k in range(4):
        _P(sc, 'box', (0.2, -0.85 - k * 0.3, 0.02), (0.3, 0.05, 0.03), 'bark')
    _P(sc, 'box', (0.2, -1.4, 0.3), (0.3, 0.26, 0.17), 'steel', I3, 7)                         # cart
    _P(sc, 'box', (0.2, -1.4, 0.45), (0.33, 0.29, 0.05), 'bark')
    for i, (x, y) in enumerate(((0.05, -1.35), (0.28, -1.45), (0.18, -1.25))):                  # coal load
        _P(sc, 'ell', (x, y, 0.55), (0.15, 0.14, 0.13), 'coal', I3, 30 + i)
    _P(sc, 'cyl', (-0.95, -1.0, 0.45), (0.04, 0.45), 'bark', rot(0, 20, 0))                    # pickaxe
    _P(sc, 'box', (-1.1, -1.0, 0.85), (0.22, 0.04, 0.05), 'steel', rot(0, 20, 0))
    img = sc.render()
    fx.glint(img, 20, 20, 1)
    return img


# ----------------------------------------------------------------- lumber mill: shed, saw blade, log pile
def lumbermill():
    sc = _scene(8.6, (20, 31))
    _P(sc, 'box', (0.1, 0.5, 0.7), (1.1, 0.8, 0.7), 'plank', I3, 1)                            # shed
    _roof(sc, 0.1, 0.5, 1.55, 1.3, 0.8, 'shingle', tilt=30)
    _P(sc, 'box', (0.3, -0.31, 0.45), (0.3, 0.04, 0.4), 'door')
    # circular saw on the left face
    sc.add(between('cyl', (-1.1, 0.5, 0.9), (-1.2, 0.5, 0.9), (0.5,), 'steel', None, (0, 0, 1)))
    for k in range(10):
        a = math.radians(k * 36)
        _P(sc, 'box', (-1.21, 0.5 + 0.52 * math.cos(a), 0.9 + 0.52 * math.sin(a)), (0.035, 0.07, 0.07), 'steel', rot(k * 36, 0, 0))
    _P(sc, 'ell', (-1.24, 0.5, 0.9), (0.09, 0.09, 0.09), 'gold')
    for i, (y, z) in enumerate(((-1.35, 0.27), (-0.85, 0.27), (-1.1, 0.7))):                    # log pile (axis along x)
        _P(sc, 'cyl', (1.15, y, z), (0.25, 0.55), 'bark', rot(90, 0, 90), i)
    _P(sc, 'cyl', (-0.4, -1.2, 0.22), (0.27, 0.22), 'wood_cut')                                # stump + axe
    _P(sc, 'cyl', (-0.4, -1.2, 0.85), (0.04, 0.4), 'bark', rot(0, 25, 0))
    _P(sc, 'box', (-0.28, -1.2, 1.08), (0.17, 0.03, 0.12), 'steel', rot(0, 25, 0))
    return sc.render()


# ----------------------------------------------------------------- market: striped stall, counter, goods
def market():
    sc = _scene(8.8, (20, 31))
    _P(sc, 'box', (0, 0, 0.38), (1.2, 0.5, 0.38), 'plank', I3, 1)                              # counter
    for sx, sy in ((-1.2, -0.55), (1.2, -0.55), (-1.2, 0.55), (1.2, 0.55)):                    # posts
        _P(sc, 'cyl', (sx, sy, 0.95), (0.07, 0.95), 'bark', I3, 2)
    for i in range(7):                                                                          # striped awning
        _P(sc, 'box', (-1.2 + i * 0.4, 0.0, 1.95), (0.2, 0.72, 0.05), 'cloth' if i % 2 == 0 else 'cream',
           rot(14, 0, 0), None if False else 0)
    for i in range(7):
        _P(sc, 'box', (-1.2 + i * 0.4, -0.62, 1.78), (0.2, 0.08, 0.2), 'cloth' if i % 2 == 0 else 'cream')   # scalloped valance
    for i, (x, mat) in enumerate(((-0.8, 'ruby'), (-0.55, 'cloth'), (-0.3, 'ruby'), (-0.68, 'cloth'))):   # fruit
        _P(sc, 'ell', (x, -0.1 + (i % 2) * 0.2, 0.9), (0.17, 0.17, 0.17), mat, I3, 5 + i)
    for i, x in enumerate((0.1, 0.45)):                                                         # melons
        _P(sc, 'ell', (x, 0.0, 0.92), (0.22, 0.2, 0.2), 'grass', I3, 9 + i)
    for k in range(4):                                                                          # coin stack
        _P(sc, 'cyl', (0.95, -0.1, 0.8 + k * 0.1), (0.2, 0.05), 'gold', I3, 12 + k)
    _P(sc, 'box', (1.65, -0.7, 0.3), (0.3, 0.28, 0.3), 'plank', I3, 3)                          # crate
    _P(sc, 'ell', (1.65, -0.7, 0.72), (0.2, 0.2, 0.17), 'ruby')
    sc.add(between('cyl', (-1.2, -0.55, 1.6), (-1.2, -0.95, 1.6), (0.03,), 'steel', None, (0, 0, 1)))
    _P(sc, 'box', (-1.2, -1.0, 1.35), (0.04, 0.3, 0.2), 'plank')                                # hanging sign
    _P(sc, 'cyl', (-1.2, -1.0, 1.35), (0.14, 0.04), 'gold', rot(0, 90, 0))
    img = sc.render()
    fx.glint(img, 13, 22, 1)
    return img


# ----------------------------------------------------------------- blacksmith: stone forge, anvil, smoke
def blacksmith():
    sc = _scene(8.8, (20, 31))
    _P(sc, 'box', (0.1, 0.5, 0.75), (1.1, 0.8, 0.75), 'granite', I3, 1)                         # forge house
    _roof(sc, 0.1, 0.5, 1.7, 1.3, 0.8, 'slate_blue', tilt=30)
    _P(sc, 'box', (0.95, 0.9, 1.7), (0.24, 0.24, 0.8), 'granite_dk', I3, 3)                    # chimney
    for i, (dz, r) in enumerate(((2.75, 0.2), (3.2, 0.26), (3.7, 0.3))):                       # smoke
        _P(sc, 'ell', (0.95 + 0.12 * i, 0.9, dz), (r, r, r * 0.8), 'smoke', I3, 40 + i)
    _P(sc, 'box', (0.15, -0.3, 0.5), (0.45, 0.05, 0.32), 'dark')                                # forge mouth
    _P(sc, 'box', (0.15, -0.34, 0.42), (0.34, 0.04, 0.2), 'glow')                              # fire
    _P(sc, 'box', (0.15, -0.31, 0.88), (0.55, 0.06, 0.07), 'granite_dk')
    _P(sc, 'box', (-0.85, -1.0, 0.25), (0.22, 0.17, 0.25), 'granite_dk', I3, 6)                # anvil
    _P(sc, 'box', (-0.85, -1.0, 0.55), (0.4, 0.2, 0.1), 'steel', I3, 7)
    _P(sc, 'cone', (-1.35, -1.0, 0.55), (0.12, 0.2), 'steel', rot(0, 90, 0))
    _P(sc, 'cyl', (-0.55, -1.45, 0.14), (0.04, 0.4), 'bark', rot(90, 0, 40))                   # hammer
    _P(sc, 'box', (-0.35, -1.58, 0.2), (0.14, 0.09, 0.09), 'steel', rot(0, 0, 40))
    img = sc.render()
    fx.glint(img, 17, 27, 1)
    return img


# ----------------------------------------------------------------- workshop: gear house, XP orb
def workshop():
    sc = _scene(8.8, (20, 31))
    _P(sc, 'box', (0.1, 0.5, 0.75), (1.1, 0.8, 0.75), 'plank', I3, 1)                           # house
    _roof(sc, 0.1, 0.5, 1.7, 1.3, 0.8, 'slate_blue', tilt=30)
    _P(sc, 'box', (0.8, 0.9, 1.75), (0.2, 0.2, 0.7), 'granite', I3, 3)                         # chimney
    _P(sc, 'box', (-0.5, -0.3, 0.45), (0.3, 0.04, 0.4), 'door')
    # big gear on the left face
    gy, gz = 0.5, 0.85
    sc.add(between('cyl', (-1.05, gy, gz), (-1.25, gy, gz), (0.5,), 'gold', None, (0, 0, 1)))
    for k in range(8):
        a = math.radians(k * 45)
        _P(sc, 'box', (-1.25, gy + 0.56 * math.cos(a), gz + 0.56 * math.sin(a)), (0.05, 0.1, 0.1), 'gold', rot(k * 45, 0, 0))
    _P(sc, 'ell', (-1.3, gy, gz), (0.1, 0.16, 0.16), 'steel')
    for i, (x, y) in enumerate(((-1.05, -0.9), (-0.55, -1.2))):                                  # bench + tools
        _P(sc, 'box', (x, y, 0.25), (0.35, 0.22, 0.25), 'plank', I3, 8 + i)
    _P(sc, 'cyl', (-0.55, -1.2, 0.58), (0.12, 0.05), 'steel')
    _P(sc, 'ell', (0.8, 0.9, 3.0), (0.34, 0.34, 0.34), 'xp', I3, 20)                            # XP orb above the chimney
    _P(sc, 'ell', (0.72, 0.82, 3.1), (0.16, 0.14, 0.16), 'xp', I3, 21)
    img = sc.render()
    fx.glint(img, 25, 6, 2)
    return img


SPRITES = {
    'building_farm': farm, 'building_mine': mine, 'building_lumbermill': lumbermill,
    'building_market': market, 'building_blacksmith': blacksmith, 'building_workshop': workshop,
}
