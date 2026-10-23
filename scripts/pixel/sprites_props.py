"""Prop sprites: menu-button icons (helm, coin pouch, barn) and the level gem."""
import math
from PIL import Image, ImageDraw
from render3d import Scene, Prim, rot, vnoise, between, place, I3, hexc
from common import add_outline
from materials import MATS
from sprites_resources import coin_tex, GOLD_HI
import fx


# ----------------------------------------------------------------- farm button: barn
def plank_tex(pl, nl, pr):
    axis = pl[0] if abs(nl[1]) > 0.5 else pl[1]
    d = -0.16 if int(math.floor(axis * 5)) % 2 else 0.04
    return None, d


# ----------------------------------------------------------------- level badge: amethyst gem (2D facets)
def gem():
    img = Image.new('RGBA', (24, 24), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    ramp = [hexc(c) for c in ('#2a1060', '#4b24a0', '#7a46d8', '#b48cf0', '#f0e0ff')]
    G = [(2, 9), (7, 9), (12, 9), (17, 9), (22, 9)]
    T1, T2, P = (7, 3), (17, 3), (12, 22)
    facets = [
        ([G[0], T1, G[1]], 2), ([T1, G[1], G[2]], 3), ([T1, T2, G[2]], 4),
        ([T2, G[2], G[3]], 3), ([T2, G[3], G[4]], 1),
        ([G[0], G[1], P], 1), ([G[1], G[2], P], 2), ([G[2], G[3], P], 1), ([G[3], G[4], P], 0),
    ]
    for pts, i in facets:
        d.polygon(pts, fill=ramp[i])
    d.line([G[0], G[4]], fill=ramp[0])
    d.line([T1, T2], fill=ramp[4])
    d.line([G[0], T1], fill=ramp[3])
    img = add_outline(img, hexc('#1a0a44'))
    fx.glint(img, 7, 6, 2)
    fx.glint(img, 17, 13, 1)
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
    sc.add(Prim('cyl', (0.15, 0.05, 2.15), (0.4, 0.09), 'gold', rot(25, 0, 20), coin_tex))   # coin peeking out
    sc.add(Prim('cyl', (-0.95, -0.72, 0.52), (0.5, 0.1), 'gold', rot(90, 0, -45), coin_tex))
    sc.add(Prim('cyl', (0.55, -1.0, 0.1), (0.5, 0.1), 'gold', rot(0, 0, 25), coin_tex))
    sc.add(Prim('cyl', (0.8, -0.6, 0.3), (0.5, 0.1), 'gold', rot(0, 0, 70), coin_tex))
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
    sc.add(Prim('box', (0, 0, 0.8), (1.25, 0.9, 0.72), 'barn', I3, plank_tex, 1))
    sc.add(Prim('box', (0, -0.52, 1.9), (1.45, 0.7, 0.07), 'shingle', rot(38, 0, 0), shingle_tex, 2))
    sc.add(Prim('box', (0, 0.52, 1.9), (1.45, 0.7, 0.07), 'shingle', rot(-38, 0, 0), shingle_tex, 3))
    sc.add(Prim('box', (0, 0, 2.36), (1.45, 0.08, 0.07), 'cream'))                         # ridge cap
    for z, hw in ((1.64, 0.78), (1.86, 0.56), (2.07, 0.34)):                                 # stepped gable
        sc.add(Prim('box', (-1.22, 0, z), (0.05, hw, 0.12), 'barn', I3, plank_tex, 4))
    sc.add(Prim('box', (0.35, -0.9, 0.62), (0.64, 0.05, 0.6), 'cream'))                      # door + frame
    sc.add(Prim('box', (0.35, -0.93, 0.62), (0.52, 0.05, 0.52), 'door', I3, plank_tex, 5))
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
