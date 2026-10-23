"""Farm animals (40x40): chicken, pig, cow, deer. Each stands along the x axis, head toward -x
(screen lower-left), so the camera sees the head end and the -y flank in the usual 3/4 view."""
import math
from render3d import Scene, Prim, rot, vnoise, between, I3
from materials import MATS


def _P(sc, kind, c, size, mat, R=I3, tex=None, seed=0):
    sc.add(Prim(kind, c, size, mat, R, tex, seed))


def _eye(sc, x, y, z, r=0.06):
    _P(sc, 'ell', (x, y, z), (r, r * 0.8, r), 'dark')


# ----------------------------------------------------------------- chicken
def feather_tex(pl, nl, pr):
    d = -0.14 if int(math.floor(pl[0] * 6)) % 2 else 0.04
    return None, d + (vnoise(pl[0] * 5, pl[1] * 5, pl[2] * 5, pr.seed) - 0.5) * 0.25


def chicken():
    sc = Scene(MATS, scale=17.0, origin=(20, 33))
    _P(sc, 'ell', (0.05, 0, 0.82), (0.66, 0.48, 0.5), 'feather', I3, feather_tex, 1)        # body
    _P(sc, 'ell', (-0.42, 0, 0.95), (0.38, 0.42, 0.44), 'feather', I3, None, 2)              # breast
    for k in (-1, 0, 1):                                                                       # tail fan
        _P(sc, 'ell', (0.74, k * 0.11, 1.08 + 0.03 * (1 - abs(k))), (0.32, 0.06, 0.22), 'feather',
           rot(0, -34, 10 * k), None, 3 + k)
    _P(sc, 'ell', (0.1, -0.4, 0.88), (0.4, 0.1, 0.28), 'hide', rot(0, 8, 0), feather_tex, 7)   # wing
    _P(sc, 'ell', (-0.52, 0, 1.28), (0.2, 0.2, 0.32), 'feather', I3, None, 8)                # neck
    _P(sc, 'ell', (-0.64, 0, 1.52), (0.25, 0.22, 0.26), 'feather', I3, None, 9)              # head
    for dx, dz in ((0, 0.28), (0.1, 0.22), (-0.1, 0.22)):                                      # comb
        _P(sc, 'ell', (-0.64 + dx, 0, 1.76 + dz - 0.2), (0.07, 0.05, 0.1), 'cloth')
    _P(sc, 'ell', (-0.9, 0, 1.46), (0.12, 0.08, 0.06), 'beak')                                 # beak
    _P(sc, 'ell', (-0.8, 0, 1.32), (0.05, 0.05, 0.1), 'cloth')                                 # wattle
    _eye(sc, -0.76, -0.2, 1.56, 0.05)
    for sy in (-1, 1):                                                                         # legs + feet
        _P(sc, 'cyl', (-0.02, 0.18 * sy, 0.27), (0.045, 0.27), 'beak')
        _P(sc, 'ell', (-0.1, 0.18 * sy, 0.03), (0.17, 0.07, 0.03), 'beak')
    img = sc.render()
    return img


# ----------------------------------------------------------------- pig
def pig():
    sc = Scene(MATS, scale=13.5, origin=(20, 32))
    _P(sc, 'ell', (0.12, 0, 0.86), (1.0, 0.62, 0.62), 'pig', I3, None, 1)                    # body
    _P(sc, 'ell', (-0.92, 0, 0.98), (0.5, 0.45, 0.47), 'pig', I3, None, 2)                   # head
    _P(sc, 'cyl', (-1.4, 0, 0.9), (0.22, 0.1), 'snout', rot(0, 90, 0), None, 3)              # snout
    for sy in (-1, 1):
        _P(sc, 'ell', (-1.51, 0.08 * sy, 0.92), (0.03, 0.04, 0.05), 'dark')                  # nostrils
        _P(sc, 'ell', (-0.85, 0.34 * sy, 1.38), (0.17, 0.08, 0.2), 'pig', rot(0, 0, 18 * sy), None, 4)  # ears
    _eye(sc, -1.18, -0.4, 1.1, 0.06)
    for x in (-0.55, 0.7):                                                                     # legs + hooves
        for sy in (-1, 1):
            _P(sc, 'cyl', (x, 0.36 * sy, 0.28), (0.14, 0.28), 'pig', I3, None, 5)
            _P(sc, 'ell', (x, 0.36 * sy, 0.04), (0.16, 0.16, 0.05), 'dark')
    for i in range(3):                                                                         # curly tail
        a = i * 1.1
        _P(sc, 'ell', (1.12 + 0.07 * math.cos(a), 0.0, 1.08 + 0.1 * i), (0.07, 0.07, 0.07), 'snout')
    img = sc.render()
    return img


# ----------------------------------------------------------------- cow
def cow_tex(pl, nl, pr):
    n = vnoise(pl[0] * 1.5 + 3, pl[1] * 1.5, pl[2] * 1.5, pr.seed)
    if n > 0.57:
        return 'patch', 0.0
    return None, 0.0


def cow():
    sc = Scene(MATS, scale=11.5, origin=(21, 31))
    _P(sc, 'ell', (0.12, 0, 1.22), (1.18, 0.64, 0.7), 'hide', I3, cow_tex, 11)                # body
    _P(sc, 'ell', (-0.95, 0, 1.38), (0.5, 0.42, 0.45), 'hide', I3, cow_tex, 12)              # neck
    _P(sc, 'ell', (-1.38, 0, 1.42), (0.42, 0.4, 0.42), 'hide', I3, cow_tex, 13)              # head
    _P(sc, 'ell', (-1.74, 0, 1.28), (0.22, 0.3, 0.2), 'snout')                                 # muzzle
    _P(sc, 'ell', (-1.9, 0, 1.3), (0.05, 0.12, 0.08), 'dark')
    for sy in (-1, 1):
        _P(sc, 'cyl', (-1.3, 0.3 * sy, 1.9), (0.06, 0.2), 'cream', rot(28 * sy, 0, 0), None, 14)  # horns
        _P(sc, 'ell', (-1.28, 0.52 * sy, 1.62), (0.2, 0.1, 0.08), 'hide', rot(0, 0, 20 * sy), None, 15)  # ears
    _eye(sc, -1.58, -0.3, 1.5, 0.06)
    for x in (-0.8, 0.95):                                                                     # legs
        for sy in (-1, 1):
            _P(sc, 'cyl', (x, 0.4 * sy, 0.55), (0.16, 0.55), 'hide', I3, None, 16)
            _P(sc, 'cyl', (x, 0.4 * sy, 0.09), (0.17, 0.09), 'dark')                          # hooves
    _P(sc, 'ell', (0.5, 0, 0.62), (0.24, 0.22, 0.16), 'snout')                                 # udder
    _P(sc, 'cyl', (1.33, 0, 1.0), (0.04, 0.5), 'hide', rot(0, -12, 0), None, 17)             # tail
    _P(sc, 'ell', (1.4, 0, 0.5), (0.1, 0.1, 0.16), 'patch')
    img = sc.render()
    return img


# ----------------------------------------------------------------- deer
def fawn_tex(pl, nl, pr):
    n = vnoise(pl[0] * 3.2, pl[1] * 3.2, pl[2] * 3.2, pr.seed)
    if n > 0.74 and nl[1] < 0.3:
        return 'spots', 0.0                     # dappled flank
    return None, (n - 0.5) * 0.2


def deer():
    sc = Scene(MATS, scale=12.0, origin=(21, 36))
    _P(sc, 'ell', (0.12, 0, 1.5), (0.98, 0.42, 0.5), 'fawn', I3, fawn_tex, 21)                # body
    _P(sc, 'ell', (-0.5, 0, 1.52), (0.5, 0.36, 0.46), 'hide', I3, None, 22)                  # pale chest
    _P(sc, 'ell', (-0.88, 0, 2.0), (0.26, 0.24, 0.55), 'fawn', rot(0, -28, 0), None, 23)     # neck
    _P(sc, 'ell', (-1.2, 0, 2.5), (0.34, 0.2, 0.2), 'fawn', rot(0, -18, 0), None, 24)        # head
    _P(sc, 'ell', (-1.5, 0, 2.43), (0.07, 0.08, 0.07), 'dark')                                 # nose
    _eye(sc, -1.3, -0.17, 2.56, 0.045)
    for s in (-1, 1):
        _P(sc, 'ell', (-1.0, 0.2 * s, 2.7), (0.12, 0.06, 0.2), 'fawn', rot(0, 0, 25 * s), None, 25)   # ears
        # antlers: main beam + two tines
        for a, b in (((-1.02, 0.1 * s, 2.66), (-0.9, 0.3 * s, 3.3)),
                     ((-0.95, 0.2 * s, 2.95), (-1.18, 0.32 * s, 3.25)),
                     ((-0.91, 0.27 * s, 3.18), (-0.7, 0.38 * s, 3.52))):
            sc.add(between('cyl', a, b, (0.05,), 'bone', None, (0, 0, 1)))
    for x in (-0.58, 0.8):                                                                     # legs
        for sy in (-1, 1):
            _P(sc, 'cyl', (x, 0.26 * sy, 0.72), (0.085, 0.74), 'fawn', I3, None, 26)
            _P(sc, 'cyl', (x, 0.26 * sy, 0.08), (0.09, 0.08), 'dark')
    _P(sc, 'ell', (1.08, 0, 1.72), (0.12, 0.1, 0.18), 'hide', rot(0, -25, 0), None, 27)      # tail
    img = sc.render()
    return img


SPRITES = {
    'animal_chicken': chicken,
    'animal_pig': pig,
    'animal_cow': cow,
    'animal_deer': deer,
}
