"""Character portraits (40x56): the adventurer (player) and the merchant."""
from render3d import Scene, Prim, rot, vnoise, place, I3
from materials import MATS
from sprites_resources import coin_tex
import fx


def _A(sc, kind, c, size, mat, R=I3, tex=None, seed=0, yaw=-45):
    """Add a primitive in figure space (front = -y) turned to face the camera."""
    sc.add(place(Prim(kind, c, size, mat, R, tex, seed), yaw))


# ----------------------------------------------------------------- adventurer portrait
def vest_tex(pl, nl, pr):
    if nl[1] < -0.4 and pl[2] > -0.5:
        hw = 0.04 + 0.2 * (pl[2] + 0.5) / 1.3
        if abs(pl[0]) < hw:
            return 'tunic', 0.0         # shirt showing in the open vest
    n = vnoise(pl[0] * 4, pl[1] * 4, pl[2] * 4, pr.seed)
    return None, (n - 0.5) * 0.3


def staff_tex(pl, nl, pr):
    n = vnoise(pl[0] * 6, pl[1] * 6, pl[2] * 1.4, pr.seed)
    return None, (n - 0.5) * 0.55


def adventurer():
    sc = Scene(MATS, size=(40, 56), scale=9.0, origin=(20, 52))

    def A(kind, c, size, mat, R=I3, tex=None, seed=0):
        sc.add(place(Prim(kind, c, size, mat, R, tex, seed), -45))

    # bedroll + pack behind the shoulders
    A('ell', (0, 0.6, 3.1), (0.7, 0.4, 0.8), 'pleather', I3, None, 3)
    A('cyl', (0, 0.45, 4.05), (0.3, 0.85), 'cap', rot(0, 90, 0), None, 4)
    A('cyl', (0.55, 0.45, 4.05), (0.32, 0.07), 'pleather', rot(0, 90, 0), None, 5)
    A('cyl', (-0.55, 0.45, 4.05), (0.32, 0.07), 'pleather', rot(0, 90, 0), None, 5)
    # legs + boots
    for sx in (-1, 1):
        A('cyl', (0.4 * sx, 0, 1.25), (0.28, 0.72), 'trouser', I3, None, 2)
        A('ell', (0.4 * sx, -0.14, 0.3), (0.4, 0.62, 0.33), 'leather', I3, None, 6)
        A('cyl', (0.4 * sx, 0, 0.72), (0.34, 0.09), 'leather', I3, None, 7)         # boot cuff
    # torso: shirt + open leather vest
    A('ell', (0, 0, 2.85), (0.8, 0.52, 0.8), 'tunic', I3, None, 8)
    A('ell', (0, 0, 2.9), (0.86, 0.57, 0.68), 'leather', I3, vest_tex, 9)
    A('cyl', (0, 0, 2.3), (0.84, 0.08), 'pleather', I3, None, 10)                      # belt
    A('box', (0, -0.84, 2.3), (0.13, 0.04, 0.1), 'gold')
    A('ell', (0.8, -0.2, 2.1), (0.26, 0.2, 0.3), 'pleather', I3, None, 11)              # hip pouch
    A('box', (-0.42, -0.52, 2.95), (0.045, 0.04, 0.58), 'pleather', I3, None, 12)        # pack straps
    A('box', (0.42, -0.52, 2.95), (0.045, 0.04, 0.58), 'pleather', I3, None, 12)
    A('cyl', (0, 0, 3.58), (0.52, 0.09), 'cloth', I3, None, 13)                        # neckerchief
    # arms: rolled sleeves, bare forearms, hands
    for sx in (-1, 1):
        A('ell', (1.02 * sx, 0, 2.95), (0.3, 0.3, 0.55), 'tunic', rot(0, 10 * sx, 0), None, 14)
        A('ell', (1.12 * sx, -0.05, 2.3), (0.25, 0.25, 0.42), 'skin', rot(0, 8 * sx, 0))
        A('ell', (1.16 * sx, -0.12, 1.88), (0.21, 0.21, 0.2), 'skin')
    # walking staff
    A('cyl', (1.16, -0.12, 2.15), (0.085, 2.15), 'bark', I3, staff_tex, 15)
    A('ell', (1.16, -0.12, 4.38), (0.17, 0.17, 0.17), 'bark', I3, staff_tex, 16)
    # head (big and friendly)
    A('ell', (0, 0.12, 4.5), (0.64, 0.56, 0.5), 'hair', I3, None, 17)
    A('ell', (0, 0, 4.38), (0.6, 0.56, 0.64), 'skin')
    A('ell', (0, -0.55, 4.28), (0.11, 0.12, 0.11), 'skin')                              # nose
    A('ell', (0, -0.54, 4.02), (0.17, 0.05, 0.035), 'dark')                             # mouth
    for sx in (-1, 1):
        A('ell', (0.23 * sx, -0.5, 4.5), (0.085, 0.05, 0.085), 'dark')
        A('ell', (0.23 * sx, -0.5, 4.64), (0.14, 0.05, 0.035), 'hair')
        A('ell', (0.6 * sx, 0.0, 4.35), (0.07, 0.1, 0.15), 'skin')                       # ears
    A('ell', (0, -0.36, 4.84), (0.52, 0.26, 0.2), 'hair', I3, None, 19)                 # fringe
    # feathered cap
    A('cyl', (0, 0, 4.86), (0.76, 0.05), 'cap', I3, None, 20)
    A('ell', (0, 0.02, 5.08), (0.6, 0.58, 0.36), 'cap', I3, None, 21)
    A('cyl', (0, 0, 4.98), (0.62, 0.07), 'pleather', I3, None, 22)
    A('ell', (-0.56, -0.08, 5.2), (0.07, 0.42, 0.17), 'cloth', rot(0, -25, 0), None, 23)  # red feather
    img = sc.render()
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
    _A(sc, 'cyl', (1.2, -0.35, 3.95), (0.34, 0.07), 'gold', rot(90, 0, 0), coin_tex)
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
