"""v4: second polish pass requested after seeing the wired header - adventurer portrait + sharper menu icons.
Registered over icons3.ICONS by generate_v3.py."""
import math
from render3d import Scene, Prim, Material, rot, vnoise, between, place, add, mul, I3
import icons3
import fx
from icons3 import MATS, GOLD_HI  # MATS is shared and extended below

MATS.update({
    'tunic': Material(['#4a3a24', '#82683c', '#b89658', '#dcc08a', '#f6e6b8'], '#2e2214', grain=0.15, grain_scale=4.0),
    'trouser': Material(['#141824', '#262e46', '#3c4a6c', '#586c94', '#8ea2cc'], '#0c0f18', grain=0.15, grain_scale=4.0),
    'cap': Material(['#0c2012', '#1a4222', '#2c6a38', '#4a9650', '#86cc82'], '#08160c', grain=0.15, grain_scale=4.0),
    'hair': Material(['#201106', '#42260e', '#6c3f18', '#9a6228', '#c98d44'], '#180c04', grain=0.2, grain_scale=4.0),
    'pleather': Material(['#321809', '#68381a', '#98592a', '#c68a48', '#f0c27c'], '#241006', grain=0.12, grain_scale=3.5, spec=0.02, shiny=14, spec_col='#ffe2a8'),
    'shingle': Material(['#1e1618', '#3c2c30', '#5c4440', '#82665a', '#b09478'], '#140d0f', grain=0.2, grain_scale=3.0, gain=0.9),
})


MATS['skin'].gain = 1.22


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


# ----------------------------------------------------------------- polished menu icons
def helm():
    sc = Scene(MATS, scale=13.0, origin=(20, 37))

    def A(kind, c, size, mat, R=I3, tex=None, seed=0):
        sc.add(place(Prim(kind, c, size, mat, R, tex, seed), -45))

    A('cyl', (0, 0, -0.05), (0.74, 0.25), 'steel', I3, None, 1)                         # gorget
    A('cyl', (0, 0, -0.28), (0.78, 0.05), 'gold')
    A('cyl', (0, 0, 0.62), (0.9, 0.55), 'steel', I3, None, 2)                           # face section
    A('ell', (0, 0, 1.25), (0.93, 0.93, 0.95), 'steel', I3, None, 3)                    # dome
    A('cyl', (0, 0, 1.42), (0.945, 0.06), 'gold')                                       # brow band
    A('box', (0, -0.9, 1.0), (0.66, 0.07, 0.085), 'dark')                               # eye slit
    A('box', (0, -0.9, 0.6), (0.055, 0.07, 0.4), 'dark')                                # vertical slit (T-visor)
    for sx in (-1, 1):
        for z in (0.62, 0.48, 0.34):
            A('box', (0.4 * sx, -0.9, z), (0.055, 0.06, 0.04), 'dark')                  # breath holes
        for x in (0.62, 0.34):
            A('ell', (x * sx, -0.92, 1.42), (0.06, 0.05, 0.06), 'gold')                  # rivets
    A('ell', (0, -0.94, 1.42), (0.07, 0.05, 0.07), 'gold')
    # plume
    A('ell', (0, 0.1, 2.25), (0.14, 0.6, 0.45), 'cloth', rot(-20, 0, 0), None, 6)
    A('ell', (0, 0.5, 2.0), (0.13, 0.5, 0.36), 'cloth', rot(-35, 0, 0), None, 7)
    A('ell', (0, -0.15, 2.4), (0.13, 0.36, 0.3), 'cloth', rot(-5, 0, 0), None, 8)
    A('ell', (0, 0, 2.12), (0.16, 0.16, 0.16), 'gold')
    img = sc.render()
    fx.glint(img, 13, 10, 2)
    return img


def pouch_tex(pl, nl, pr):
    n = vnoise(pl[0] * 3, pl[1] * 3, pl[2] * 3, pr.seed)
    d = (n - 0.5) * 0.22
    if nl[1] < -0.2:
        if abs(pl[0]) < 0.045:
            return None, d - 0.3                                     # centre seam
        if abs(abs(pl[0]) - 0.14) < 0.03 and int(pl[2] * 9) % 2:
            return 'tunic', 0.0                                      # stitching
    return None, d


def pouch():
    sc = Scene(MATS, scale=11.5, origin=(20, 34))
    sc.add(Prim('ell', (0.1, 0.1, 0.85), (0.95, 0.95, 0.85), 'pleather', I3, pouch_tex, 1))
    sc.add(Prim('ell', (0.1, 0.1, 1.5), (0.52, 0.52, 0.4), 'pleather', I3, pouch_tex, 2))
    for k in range(6):                                                # gathered ruffle
        a = math.radians(k * 60 + 15)
        sc.add(Prim('ell', (0.1 + 0.46 * math.cos(a), 0.1 + 0.46 * math.sin(a), 1.98),
                    (0.3, 0.3, 0.26), 'pleather', rot(20 * math.sin(a), -20 * math.cos(a), 0), pouch_tex, 3 + k))
    sc.add(Prim('cyl', (0.1, 0.1, 1.55), (0.62, 0.09), 'cloth', I3, None, 4))         # cord
    sc.add(Prim('ell', (-0.42, -0.42, 1.55), (0.15, 0.15, 0.15), 'cloth', I3, None, 5))  # knot
    sc.add(Prim('ell', (-0.62, -0.52, 1.28), (0.1, 0.1, 0.3), 'cloth', rot(0, 18, 0), None, 6))   # tassels
    sc.add(Prim('ell', (-0.4, -0.7, 1.25), (0.1, 0.1, 0.3), 'cloth', rot(0, -12, 0), None, 7))
    sc.add(Prim('ell', (-0.64, -0.54, 0.98), (0.08, 0.08, 0.08), 'gold'))
    sc.add(Prim('ell', (-0.4, -0.72, 0.95), (0.08, 0.08, 0.08), 'gold'))
    sc.add(Prim('cyl', (0.15, 0.05, 2.15), (0.4, 0.09), 'gold', rot(25, 0, 20), icons3.coin_tex))   # coin peeking out
    sc.add(Prim('cyl', (-0.95, -0.72, 0.52), (0.5, 0.1), 'gold', rot(90, 0, -45), icons3.coin_tex))
    sc.add(Prim('cyl', (0.55, -1.0, 0.1), (0.5, 0.1), 'gold', rot(0, 0, 25), icons3.coin_tex))
    sc.add(Prim('cyl', (0.8, -0.6, 0.3), (0.5, 0.1), 'gold', rot(0, 0, 70), icons3.coin_tex))
    img = sc.render()
    for (x, y), r in zip(fx.find_highlights(img, GOLD_HI, n=2, min_dist=12), (2, 1)):
        fx.glint(img, x - 1, y - 1, r)
    return img


def shingle_tex(pl, nl, pr):
    row = int(math.floor(pl[1] * 5.5))
    off = 0.0 if row % 2 else 0.18
    col = int(math.floor((pl[0] + off) * 4.0))
    d = 0.0
    if (pl[1] * 5.5) % 1.0 < 0.2:
        d -= 0.22                                    # row shadow line
    if ((pl[0] + off) * 4.0) % 1.0 < 0.07:
        d -= 0.14                                    # shingle gap
    d += 0.05 * ((row + col) % 3 - 1)
    return None, d


def hay_tex(pl, nl, pr):
    n = vnoise(pl[0] * 5, pl[1] * 5, pl[2] * 5, pr.seed)
    d = -0.2 if int(math.floor(pl[0] * 6)) % 2 else 0.05
    return None, d + (n - 0.5) * 0.3


def barn():
    sc = Scene(MATS, scale=9.6, origin=(19, 33))
    sc.add(Prim('box', (0, 0, 0.06), (1.35, 0.98, 0.08), 'slate', I3, None, 30))          # stone footing
    sc.add(Prim('box', (0, 0, 0.8), (1.25, 0.9, 0.72), 'barn', I3, icons3.plank_tex, 1))
    sc.add(Prim('box', (0, -0.52, 1.9), (1.45, 0.7, 0.07), 'shingle', rot(38, 0, 0), shingle_tex, 2))
    sc.add(Prim('box', (0, 0.52, 1.9), (1.45, 0.7, 0.07), 'shingle', rot(-38, 0, 0), shingle_tex, 3))
    sc.add(Prim('box', (0, 0, 2.36), (1.45, 0.08, 0.07), 'cream'))                         # ridge cap
    for z, hw in ((1.64, 0.78), (1.86, 0.56), (2.07, 0.34)):                                 # stepped gable
        sc.add(Prim('box', (-1.22, 0, z), (0.05, hw, 0.12), 'barn', I3, icons3.plank_tex, 4))
    sc.add(Prim('box', (0.35, -0.9, 0.62), (0.64, 0.05, 0.6), 'cream'))                      # door + frame
    sc.add(Prim('box', (0.35, -0.93, 0.62), (0.52, 0.05, 0.52), 'door', I3, icons3.plank_tex, 5))
    sc.add(between('box', (0.0, -0.97, 0.15), (0.7, -0.97, 1.05), (0.04, 0.03), 'cream', None, (0, -1, 0)))
    sc.add(between('box', (0.7, -0.97, 0.15), (0.0, -0.97, 1.05), (0.04, 0.03), 'cream', None, (0, -1, 0)))
    sc.add(Prim('box', (-0.72, -0.9, 1.15), (0.22, 0.04, 0.2), 'cream'))                     # hay-loft window
    sc.add(Prim('box', (-0.72, -0.93, 1.15), (0.16, 0.04, 0.14), 'dark'))
    sc.add(Prim('ell', (-0.72, -0.95, 1.05), (0.17, 0.05, 0.08), 'wheat', I3, hay_tex, 6))   # straw in the window
    sc.add(Prim('box', (-1.25, -0.9, 0.8), (0.05, 0.05, 0.72), 'cream'))                      # corner trim
    sc.add(Prim('box', (1.25, -0.9, 0.8), (0.05, 0.05, 0.72), 'cream'))
    # weathervane
    sc.add(Prim('cyl', (0.3, 0, 2.75), (0.035, 0.38), 'steel', I3, None, 7))
    sc.add(Prim('ell', (0.3, 0, 3.12), (0.2, 0.05, 0.07), 'gold'))
    sc.add(Prim('ell', (0.3, 0, 2.95), (0.12, 0.04, 0.12), 'gold'))
    # hay bale beside the barn
    sc.add(Prim('box', (1.55, -0.95, 0.3), (0.38, 0.3, 0.3), 'wheat', rot(0, 0, 12), hay_tex, 8))
    sc.add(Prim('box', (1.55, -0.95, 0.3), (0.4, 0.04, 0.32), 'rope', rot(0, 0, 12), None, 9))
    img = sc.render()
    fx.glint(img, 27, 6, 2)
    return img


ICONS = {'menu_character': helm, 'menu_merchant': pouch, 'menu_farm': barn, 'hero': adventurer}
