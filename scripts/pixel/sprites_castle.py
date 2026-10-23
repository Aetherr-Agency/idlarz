"""Castle sprites, one per upgrade level (1-6). Each level is a little bigger and grander than the last:
  1 timber-roofed keep (32px)    2 keep + tower (32px)       3 keep + two towers, battlements (40px)
  4 walled courtyard (48px)      5 fortress, banners (56px)  6 grand castle: gold roofs, glowing windows,
                                                               crystal spire (72px, overflows its tile, animated)
The max level is also rendered as a 4-frame sheet (flags wave, crystal pulses)."""
import math
from PIL import Image
from render3d import Scene, Prim, rot, between, I3
from materials import MATS
import fx

SIZES = {1: 32, 2: 32, 3: 40, 4: 48, 5: 56, 6: 72}
WALL = 'wallstone'


def _P(sc, kind, c, size, mat, R=I3, seed=0):
    sc.add(Prim(kind, c, size, mat, R, None, seed))


def _tower(sc, x, y, r, h, roof_h, roof='barn', seed=0, windows=True, glow=False):
    _P(sc, 'cyl', (x, y, h / 2), (r, h / 2), WALL, I3, seed)
    _P(sc, 'cone', (x, y, h + roof_h / 2), (r * 1.3, roof_h / 2), roof, I3, seed + 1)
    if windows:
        _P(sc, 'box', (x + r * 0.55, y - r * 0.82, h * 0.62), (0.05, 0.04, 0.12), 'glow' if glow else 'dark')
        _P(sc, 'box', (x - r * 0.82, y - r * 0.55, h * 0.62), (0.04, 0.05, 0.12), 'glow' if glow else 'dark')


def _flag(sc, x, y, z, length=0.45, tilt=0.0, mat='flag', pole=0.6):
    sc.add(between('cyl', (x, y, z), (x, y, z + pole), (0.03,), 'steel', None, (0, 0, 1)))
    _P(sc, 'box', (x + length / 2, y, z + pole - 0.12), (length / 2, 0.025, 0.12), mat, rot(0, tilt, 0))


def _crenels(sc, x0, x1, y, z, along='x', n=5, size=0.12, mat=WALL):
    for i in range(n):
        t = x0 + (x1 - x0) * i / (n - 1)
        c = (t, y, z) if along == 'x' else (y, t, z)
        _P(sc, 'box', c, (size, size, size), mat)


def _door(sc, x, y, z, w=0.3, h=0.42):
    _P(sc, 'box', (x, y, z), (w, 0.05, h), 'door')
    _P(sc, 'ell', (x, y, z + h), (w, 0.05, 0.2), 'door')


def _wall_ring(sc, hx, hy, h, thick=0.2, mat=WALL):
    _P(sc, 'box', (0, -hy, h / 2), (hx, thick, h / 2), mat)       # front-right wall
    _P(sc, 'box', (0, hy, h / 2), (hx, thick, h / 2), mat)
    _P(sc, 'box', (-hx, 0, h / 2), (thick, hy, h / 2), mat)       # front-left wall
    _P(sc, 'box', (hx, 0, h / 2), (thick, hy, h / 2), mat)


def build(level, phase=0):
    size = SIZES[level]
    flag_tilt = (-14, 0, 14, 0)[phase % 4]
    pulse = (1.0, 1.1, 1.0, 0.92)[phase % 4]

    if level == 1:
        sc = Scene(MATS, size=size, scale=11.0, origin=(16, 24))
        _P(sc, 'box', (0, 0, 0.6), (0.9, 0.7, 0.6), WALL, I3, 1)
        _P(sc, 'cone', (0, 0, 1.75), (1.28, 0.55), 'barn', I3, 2)
        _door(sc, 0, -0.7, 0.4, 0.26, 0.38)
        _P(sc, 'box', (0.5, -0.7, 0.75), (0.1, 0.04, 0.12), 'dark')
        _flag(sc, 0, 0, 2.28, 0.38, flag_tilt, pole=0.5)

    elif level == 2:
        sc = Scene(MATS, size=size, scale=9.2, origin=(16, 25))
        _P(sc, 'box', (-0.3, 0, 0.75), (1.0, 0.8, 0.75), WALL, I3, 1)
        _crenels(sc, -1.0, 0.3, -0.62, 1.62, 'x', 4, 0.13)
        _tower(sc, 0.95, 0.0, 0.46, 1.5, 0.8, seed=3)
        _door(sc, -0.3, -0.8, 0.4, 0.3, 0.4)
        _P(sc, 'box', (-0.85, -0.8, 0.95), (0.1, 0.04, 0.14), 'dark')
        _flag(sc, 0.95, 0.0, 2.3, 0.4, flag_tilt, pole=0.55)

    elif level == 3:
        sc = Scene(MATS, size=size, scale=9.0, origin=(20, 31))
        _P(sc, 'box', (0, 0, 0.9), (1.1, 0.85, 0.9), WALL, I3, 1)
        _crenels(sc, -1.0, 1.0, -0.7, 1.95, 'x', 5, 0.13)
        _tower(sc, -1.4, 0.0, 0.46, 1.9, 0.85, seed=3)
        _tower(sc, 1.4, 0.0, 0.46, 1.5, 0.8, seed=6)
        _door(sc, 0, -0.85, 0.46, 0.34, 0.46)
        for sx in (-0.65, 0.65):
            _P(sc, 'box', (sx, -0.85, 1.15), (0.1, 0.04, 0.16), 'dark')
        _flag(sc, -1.4, 0.0, 2.75, 0.42, flag_tilt, pole=0.6)
        _flag(sc, 1.4, 0.0, 2.3, 0.38, -flag_tilt, pole=0.5)

    elif level == 4:
        sc = Scene(MATS, size=size, scale=9.0, origin=(24, 36))
        _wall_ring(sc, 1.7, 1.4, 0.7, 0.16)
        for sx, sy in ((-1.7, -1.4), (1.7, -1.4), (-1.7, 1.4), (1.7, 1.4)):
            _tower(sc, sx, sy, 0.42, 1.3, 0.75, seed=int(sx * 3 + sy), windows=sy < 0)
        _P(sc, 'box', (0.1, 0.1, 1.0), (0.8, 0.65, 1.0), WALL, I3, 9)                 # keep
        _P(sc, 'cone', (0.1, 0.1, 2.55), (1.1, 0.55), 'barn', I3, 10)
        _P(sc, 'box', (0, -1.4, 0.7), (0.5, 0.3, 0.7), WALL, I3, 11)                   # gatehouse
        _door(sc, 0, -1.72, 0.4, 0.3, 0.4)
        _flag(sc, 0.1, 0.1, 3.1, 0.42, flag_tilt, pole=0.55)
        _flag(sc, -1.7, -1.4, 2.05, 0.35, -flag_tilt, pole=0.5)

    elif level == 5:
        sc = Scene(MATS, size=size, scale=8.0, origin=(28, 43))
        _wall_ring(sc, 2.0, 1.6, 0.8, 0.18)
        for sx, sy in ((-2.0, -1.6), (2.0, -1.6), (-2.0, 1.6), (2.0, 1.6)):
            _tower(sc, sx, sy, 0.46, 1.7, 0.9, seed=int(sx * 3 + sy), windows=sy < 0)
        _P(sc, 'box', (0.1, 0.1, 1.2), (0.95, 0.75, 1.2), WALL, I3, 9)                  # keep
        _tower(sc, 0.1, 0.1, 0.55, 3.0, 1.1, seed=12, windows=False)                      # central tower
        for k, z in enumerate((1.0, 1.6)):
            _P(sc, 'box', (0.1 - 0.5 + k * 0.5, -0.65, z), (0.1, 0.04, 0.16), 'glow')
        _P(sc, 'box', (0, -1.6, 0.75), (0.55, 0.32, 0.75), WALL, I3, 11)
        _door(sc, 0, -1.94, 0.42, 0.32, 0.44)
        _P(sc, 'box', (0.1, 0.1, 1.6), (1.0, 0.8, 0.08), 'gold')                        # gold trim band
        _flag(sc, 0.1, 0.1, 4.1, 0.5, flag_tilt, pole=0.7)
        for sx in (-2.0, 2.0):
            _flag(sc, sx, -1.6, 2.6, 0.4, flag_tilt * (1 if sx > 0 else -1), pole=0.5)

    else:   # level 6: grand castle
        sc = Scene(MATS, size=size, scale=7.5, origin=(36, 57))
        _wall_ring(sc, 2.4, 1.9, 0.9, 0.2)
        for sx, sy in ((-2.4, -1.9), (2.4, -1.9), (-2.4, 1.9), (2.4, 1.9)):
            _tower(sc, sx, sy, 0.5, 2.0, 1.0, roof='gold', seed=int(sx * 3 + sy), glow=sy < 0)
        for sx in (-1.2, 1.2):                                                           # flanking towers
            _tower(sc, sx, 0.4, 0.46, 2.5, 0.95, roof='gold', seed=int(sx * 5), glow=True)
        _P(sc, 'box', (0.0, 0.2, 1.4), (0.95, 0.8, 1.4), WALL, I3, 9)                   # keep
        _P(sc, 'box', (0.0, 0.2, 1.9), (1.02, 0.86, 0.09), 'gold')                      # gold bands
        _P(sc, 'box', (0.0, 0.2, 0.9), (1.02, 0.86, 0.06), 'gold')
        _tower(sc, 0.0, 0.2, 0.62, 3.5, 1.5, roof='gold', seed=12, windows=False)        # grand spire
        for k, z in enumerate((1.2, 2.0, 2.9)):
            _P(sc, 'box', (-0.5 + k * 0.5, -0.62, z), (0.1, 0.04, 0.18), 'glow')
        _P(sc, 'box', (0, -1.9, 0.85), (0.6, 0.34, 0.85), WALL, I3, 11)                 # gatehouse
        _P(sc, 'box', (0, -1.9, 1.75), (0.66, 0.4, 0.07), 'gold')
        _door(sc, 0, -2.26, 0.5, 0.36, 0.5)
        r = 0.34 * pulse                                                                  # crystal
        _P(sc, 'ell', (0.0, 0.2, 6.15 + 0.3), (r, r, r * 1.5), 'crystal', I3, 30)
        _P(sc, 'cone', (0.0, 0.2, 5.5), (0.12, 0.2), 'gold', I3, 31)
        for sx, sy in ((-2.4, -1.9), (2.4, -1.9)):
            _flag(sc, sx, sy, 3.0, 0.5, flag_tilt * (1 if sx > 0 else -1), pole=0.6)
        for sx in (-1.2, 1.2):
            _flag(sc, sx, 0.4, 3.45, 0.42, -flag_tilt * (1 if sx > 0 else -1), pole=0.5)
        sc.add(between('cyl', (0.0, 0.2, 5.8), (0.0, 0.2, 5.5), (0.03,), 'gold', None, (0, 0, 1)))

    img = sc.render()
    if level == 6:
        sparks = ((33, 7, (3, 2, 1, 2)[phase % 4]), (45, 14, (1, 3, 2, 1)[phase % 4]), (24, 18, (2, 1, 3, 2)[phase % 4]))
        for x, y, r in sparks:
            fx.glint(img, x, y, r)
    elif level >= 4:
        fx.glint(img, size // 2 + 2, 3 if level == 4 else 4, 1)
    return img


def sheet_max():
    """4-frame animation for the max level (72x72 each, side by side)."""
    sheet = Image.new('RGBA', (SIZES[6] * 4, SIZES[6]), (0, 0, 0, 0))
    for i in range(4):
        sheet.alpha_composite(build(6, i), (i * SIZES[6], 0))
    return sheet


SPRITES = {f'castle_{lv}': (lambda lv=lv: build(lv, 0)) for lv in range(1, 7)}
