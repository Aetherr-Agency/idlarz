"""v3 icons: polished pass. Reuses the approved resource icons from icons2 (rendered with rim light +
cleaner dither + sparkles) and adds replacements for the character button, food, farm, level badge and portrait."""
import math
from PIL import Image, ImageDraw
from render3d import Scene, Prim, Material, rot, vnoise, between, place, add, mul, I3, hexc
from common import add_outline
import icons2
from icons2 import MATS as BASE, coin_tex, make_log_tex
import fx

MATS = dict(BASE)
MATS.update({
    'bread': Material(['#46200a', '#7c3c12', '#b2641e', '#da9038', '#f6c56c'], '#3a1708', grain=0.3, grain_scale=3.0, spec=0.02, shiny=18, spec_col='#ffe6a8'),
    'crumb': Material(['#9a6a2c', '#cf9c52', '#eac27c', '#f8dca4', '#fff2d2'], '#3a1708'),
    'barn': Material(['#2a0a0c', '#5e1618', '#962422', '#c8402e', '#ec7c58'], '#1e0608', grain=0.15, grain_scale=3.0),
    'slate': Material(['#1c1618', '#382c2e', '#58453f', '#7c6552', '#a8906e'], '#140e10', grain=0.25, grain_scale=3.0, gain=0.8),
    'cream': Material(['#6a5c4c', '#a89878', '#d4c6a2', '#efe4c4', '#fffaec'], '#3a2c1c'),
    'door': Material(['#1c0f08', '#3a2010', '#5e3a1c', '#85582c', '#ad7e48'], '#140a05', grain=0.3, grain_scale=3.0),
    'skin': Material(['#5a2a1a', '#9a5638', '#d08a5c', '#eeb88a', '#ffe0bc'], '#3a1a10'),
    'beard': Material(['#3a2e28', '#6a5a4e', '#9c8a78', '#cdbfae', '#f2eadc'], '#2a201a', grain=0.3, grain_scale=4.0),
    'fur': Material(['#6a6258', '#a89e90', '#d0c8b8', '#eee8da', '#ffffff'], '#3a342c', grain=0.1),
    'robe': Material(['#2a0a2a', '#5a1650', '#8e2a78', '#bc4a98', '#e888c4'], '#1e061e', grain=0.2, grain_scale=3.0),
    'ruby': Material(['#3a0410', '#7a0e24', '#c0243c', '#ee5a6e', '#ffb8c0'], '#260208', spec=0.06, shiny=20, spec_col='#ffffff'),
})
# a touch more sheen on metals for the polished pass
for _k in ('steel', 'gold'):
    MATS[_k].spec = max(MATS[_k].spec, 0.045)

GOLD_HI = [MATS['gold'].ramp[-1], MATS['gold'].spec_col]


def _P(sc, x, y):
    return add(mul(sc.r, x), mul(sc.u, y))


# ----------------------------------------------------------------- resources (with sparkle)
def sparkle_gold(img, n=2):
    spots = fx.find_highlights(img, GOLD_HI, n=n, min_dist=11)
    for (x, y), r in zip(spots, (3, 2)):
        fx.glint(img, x - 1, y - 1, r)
    return img, spots


def gold():
    img, _ = sparkle_gold(icons2.gold())
    return img


# ----------------------------------------------------------------- character button: great helm
def helm():
    sc = Scene(MATS, scale=12.5, origin=(20, 36))

    def A(kind, c, size, mat, R=I3, tex=None, seed=0):
        sc.add(place(Prim(kind, c, size, mat, R, tex, seed), -45))

    A('cyl', (0, 0, -0.05), (0.74, 0.25), 'steel', I3, None, 1)                  # gorget
    A('cyl', (0, 0, 0.62), (0.9, 0.55), 'steel', I3, None, 2)                    # face section
    A('ell', (0, 0, 1.25), (0.93, 0.93, 0.95), 'steel', I3, None, 3)             # dome
    A('cyl', (0, 0, 1.42), (0.945, 0.06), 'gold')                                # brow band
    A('box', (0, -0.9, 1.02), (0.62, 0.07, 0.07), 'dark')                        # eye slit
    A('box', (0, -0.93, 0.62), (0.07, 0.07, 0.5), 'steel', I3, None, 4)          # nasal ridge
    for sx in (-1, 1):
        for k, z in enumerate((0.55, 0.4, 0.25)):
            A('box', (0.3 * sx, -0.9, z), (0.055, 0.06, 0.04), 'dark')           # breath holes
        A('ell', (0.55 * sx, -0.91, 1.42), (0.07, 0.05, 0.07), 'gold')           # rivets
    A('ell', (0, 0.1, 2.22), (0.13, 0.55, 0.42), 'cloth', rot(-20, 0, 0), None, 5)   # plume
    A('ell', (0, 0.45, 2.0), (0.12, 0.45, 0.34), 'cloth', rot(-35, 0, 0), None, 6)
    A('ell', (0, 0, 2.12), (0.15, 0.15, 0.15), 'gold')
    img = sc.render()
    fx.glint(img, 13, 9, 2)
    return img


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


# ----------------------------------------------------------------- farm button: barn
def plank_tex(pl, nl, pr):
    axis = pl[0] if abs(nl[1]) > 0.5 else pl[1]
    d = -0.16 if int(math.floor(axis * 5)) % 2 else 0.04
    return None, d


def barn():
    sc = Scene(MATS, scale=9.8, origin=(20, 32))
    sc.add(Prim('box', (0, 0, 0.75), (1.25, 0.9, 0.75), 'barn', I3, plank_tex, 1))
    # roof slabs (ridge along x)
    sc.add(Prim('box', (0, -0.52, 1.88), (1.42, 0.7, 0.07), 'slate', rot(38, 0, 0), None, 2))
    sc.add(Prim('box', (0, 0.52, 1.88), (1.42, 0.7, 0.07), 'slate', rot(-38, 0, 0), None, 3))
    sc.add(Prim('box', (0, 0, 2.32), (1.42, 0.07, 0.07), 'cream'))                       # ridge cap
    # stepped gable on the left end
    for z, hw in ((1.62, 0.78), (1.84, 0.56), (2.05, 0.34)):
        sc.add(Prim('box', (-1.22, 0, z), (0.05, hw, 0.12), 'barn', I3, plank_tex, 4))
    # door with cream frame and braces
    sc.add(Prim('box', (0.35, -0.9, 0.58), (0.62, 0.05, 0.58), 'cream'))
    sc.add(Prim('box', (0.35, -0.93, 0.58), (0.5, 0.05, 0.5), 'door', I3, plank_tex, 5))
    sc.add(between('box', (0.0, -0.97, 0.15), (0.7, -0.97, 1.0), (0.04, 0.03), 'cream', None, (0, -1, 0)))
    sc.add(between('box', (0.7, -0.97, 0.15), (0.0, -0.97, 1.0), (0.04, 0.03), 'cream', None, (0, -1, 0)))
    # hay-loft window
    sc.add(Prim('box', (-0.7, -0.9, 1.1), (0.2, 0.04, 0.17), 'cream'))
    sc.add(Prim('box', (-0.7, -0.93, 1.1), (0.15, 0.04, 0.12), 'dark'))
    # corner trim
    sc.add(Prim('box', (-1.25, -0.9, 0.75), (0.05, 0.05, 0.75), 'cream'))
    sc.add(Prim('box', (1.25, -0.9, 0.75), (0.05, 0.05, 0.75), 'cream'))
    return sc.render()


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


# ----------------------------------------------------------------- portrait: crowned lord
def fur_tex(pl, nl, pr):
    n = vnoise(pl[0] * 5, pl[1] * 5, pl[2] * 5, pr.seed)
    if n > 0.8:
        return 'dark', 0.2            # ermine tails
    return None, 0.0


def lord():
    sc = Scene(MATS, size=(40, 56), scale=9.0, origin=(20, 52))

    def A(kind, c, size, mat, R=I3, tex=None, seed=0):
        sc.add(place(Prim(kind, c, size, mat, R, tex, seed), -45))

    for sx in (-1, 1):
        A('ell', (0.45 * sx, -0.4, 0.28), (0.4, 0.55, 0.26), 'leather', I3, None, 2)      # boots
    A('ell', (0, 0, 1.2), (1.15, 0.85, 1.15), 'robe', I3, None, 1)                          # robe skirt
    A('ell', (0, 0, 2.7), (0.9, 0.62, 0.95), 'robe', I3, None, 2)                           # torso
    A('cyl', (0, 0, 2.05), (0.84, 0.08), 'gold')                                            # belt
    A('box', (0, -0.84, 2.05), (0.15, 0.04, 0.12), 'ruby')
    A('ell', (0, 0, 3.5), (1.0, 0.72, 0.3), 'fur', I3, fur_tex, 3)                          # ermine collar
    for sx in (-1, 1):                                                                       # sleeves + hands
        A('ell', (1.05 * sx, 0, 2.75), (0.32, 0.32, 0.72), 'robe', rot(0, 12 * sx, 0), None, 4)
        A('ell', (1.18 * sx, -0.1, 2.05), (0.34, 0.34, 0.13), 'fur', I3, fur_tex, 5)        # fur cuffs
        A('ell', (1.2 * sx, -0.15, 1.88), (0.22, 0.22, 0.2), 'skin')
    # sceptre in right hand
    A('cyl', (1.2, -0.15, 2.6), (0.07, 1.05), 'gold')
    A('ell', (1.2, -0.15, 3.78), (0.25, 0.25, 0.25), 'gold')
    A('ell', (1.2, -0.38, 3.8), (0.07, 0.06, 0.07), 'ruby')
    # head
    A('ell', (0, 0.12, 4.28), (0.62, 0.55, 0.45), 'beard', I3, None, 6)                     # hair behind
    A('ell', (0, 0, 4.18), (0.53, 0.5, 0.58), 'skin')
    A('ell', (0, -0.22, 3.78), (0.52, 0.36, 0.5), 'beard', I3, None, 7)                     # beard
    A('ell', (0, -0.48, 3.98), (0.27, 0.1, 0.07), 'beard', I3, None, 8)                     # moustache
    A('ell', (0, -0.5, 4.1), (0.1, 0.11, 0.1), 'skin')                                      # nose
    for sx in (-1, 1):
        A('ell', (0.2 * sx, -0.47, 4.3), (0.075, 0.05, 0.075), 'dark')                       # eyes
        A('ell', (0.2 * sx, -0.46, 4.4), (0.13, 0.05, 0.04), 'beard')                        # brows
    # crown
    A('cyl', (0, 0, 4.78), (0.58, 0.17), 'gold')
    for k in range(5):
        a = math.radians(-90 + k * 72 + 36 - 72 * 2) if False else math.radians(k * 72 + 18)
        A('box', (0.55 * math.cos(a), 0.55 * math.sin(a), 5.12), (0.09, 0.09, 0.2), 'gold')
        A('ell', (0.55 * math.cos(a), 0.55 * math.sin(a), 5.36), (0.08, 0.08, 0.08), 'ruby')
    A('ell', (0, -0.58, 4.8), (0.1, 0.05, 0.1), 'ruby')
    img = sc.render()
    return img


ICONS = {
    'gold': gold, 'wood': icons2.wood, 'stone': icons2.stone, 'coal': icons2.coal, 'food': bread,
    'meat': icons2.meat,
    'menu_character': helm, 'menu_merchant': None, 'menu_farm': barn, 'level_star': gem, 'hero': lord,
}


def pouch():
    import icons2_b
    img = icons2_b.pouch()
    spots = fx.find_highlights(img, GOLD_HI, n=1, min_dist=12)
    for x, y in spots:
        fx.glint(img, x - 1, y - 1, 2)
    return img


ICONS['menu_merchant'] = pouch
