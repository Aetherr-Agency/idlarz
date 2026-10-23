"""v2 icons - detailed, reference-style (see reference/STYLE.md). Each returns a 40x40 RGBA image."""
import math
from render3d import Scene, Prim, Material, rot, vnoise, between, place, mv, add, mul

MATS = {
    'gold': Material(['#4b230d', '#8e4a12', '#cf8a1a', '#f5c640', '#fff3a8'], '#3a1708', spec=0.035, shiny=40, spec_col='#fffbe0'),
    'bark': Material(['#2b170e', '#52301a', '#7e4c27', '#a8723e', '#cc9a5c'], '#25120a', grain=0.45, grain_scale=3.2),
    'wood_cut': Material(['#8a5426', '#bd8546', '#dfae6e', '#f2d094', '#fdebbf'], '#3b2010', grain=0.1, grain_scale=4),
    'coal': Material(['#07060e', '#13112a', '#211f3c', '#33385f', '#7088c8'], '#05040a', grain=0.2, grain_scale=3.0, spec=0.04, shiny=30, spec_col='#d8e8ff', gamma=1.5, gain=0.7),
    'wheat': Material(['#6b4710', '#a97a1a', '#dba824', '#f4d25a', '#fff3ac'], '#47290a', grain=0.1),
    'stalk': Material(['#4a4a1c', '#7a7a2a', '#a8a53c', '#d0ca64', '#f0eca4'], '#3a2c0e'),
    'rope': Material(['#32090a', '#6a1a16', '#a2302a', '#cc5240', '#f08c70'], '#240606'),
    'twine': Material(['#4a3416', '#7a5a28', '#a88444', '#d0aa66', '#efd7a0'], '#2e1d0a'),
    'meat': Material(['#3c0d10', '#7c1e1c', '#b93a26', '#e4693a', '#ffb888'], '#2c0808', spec=0.05, shiny=22, spec_col='#fff0d0'),
    'sear': Material(['#240f08', '#4a2610', '#774016', '#a8632a', '#d48d46'], '#2c0808', spec=0.03, shiny=22, spec_col='#ffe0b0'),
    'steel': Material(['#262b3c', '#474f68', '#7480a0', '#aab8d0', '#eaf2fc'], '#1a1d2c', spec=0.04, shiny=28, spec_col='#ffffff', gamma=1.1),
    'leather': Material(['#2c170c', '#58301a', '#845030', '#ae7a4c', '#d4a672'], '#22110a', grain=0.35, grain_scale=3.5),
    'cloth': Material(['#2e0a12', '#6a1620', '#a02a2e', '#cf4a3c', '#f4806a'], '#220810', grain=0.2, grain_scale=4),
    'blue': Material(['#0e1a3a', '#1e3a74', '#2f5cae', '#5a8ad8', '#a8c8f8'], '#0a1230', spec=0.03, shiny=20),
    'dark': Material(['#050408', '#0a0810', '#120f1c', '#1c1830', '#2a2444'], '#050408'),
    'bone': Material(['#74644f', '#b0a086', '#d9cbac', '#f0e6cc', '#fffaee'], '#3a2c20'),
    'steel': Material(['#262b3c', '#474f68', '#7480a0', '#aab8d0', '#eaf2fc'], '#1a1d2c', spec=0.04, shiny=28, spec_col='#ffffff', gamma=1.1),
    'leather': Material(['#2c170c', '#58301a', '#845030', '#ae7a4c', '#d4a672'], '#22110a', grain=0.35, grain_scale=3.5),
    'cloth': Material(['#2e0a12', '#6a1620', '#a02a2e', '#cf4a3c', '#f4806a'], '#220810', grain=0.2, grain_scale=4),
    'blue': Material(['#0e1a3a', '#1e3a74', '#2f5cae', '#5a8ad8', '#a8c8f8'], '#0a1230', spec=0.03, shiny=20),
    'dark': Material(['#050408', '#0a0810', '#120f1c', '#1c1830', '#2a2444'], '#050408'),
    'stone': Material(['#33282b', '#625249', '#8f7f70', '#bdae95', '#e6dbbc'], '#2a1d1a', grain=0.3, grain_scale=3.0, spec=0.012, shiny=20, spec_col='#f2edd8', gamma=1.55),
}


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


# ----------------------------------------------------------------- icons
def gold():
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


def coal_tex(pl, nl, pr):
    d = 0.0
    n = vnoise(pl[0] * 3.1, pl[1] * 3.1, pl[2] * 3.1, pr.seed)
    if n > 0.74:
        d += 0.22                         # glassy flecks
    s = pr.s
    if sum(1 for i in range(3) if abs(abs(pl[i]) - s[i]) < 0.09) >= 2:
        d += 0.3                          # chipped edges catch the light
    return None, d


def food():
    sc = Scene(MATS, scale=9.6, origin=(20, 38))
    import math as m
    def stalk(az, tilt, length, seed):
        R = rot(tilt, 0, az)
        axis = mv(R, (0, 0, 1))
        base = (0.0, 0.0, 0.0)
        c = add(base, mul(axis, length / 2))
        sc.add(Prim('cyl', c, (0.11, length / 2), 'stalk', R, None, seed))
        top = add(base, mul(axis, length))
        ec = add(top, mul(axis, 0.5))
        sc.add(Prim('ell', ec, (0.25, 0.25, 0.66), 'wheat', R, ear_tex, seed))
        sc.add(Prim('cyl', add(ec, mul(axis, 0.78)), (0.025, 0.28), 'wheat', R, None, seed))
    for az, tilt, ln, sd in ((200, 20, 2.3, 1), (20, 21, 2.35, 2), (110, 19, 2.3, 3), (290, 18, 2.3, 4),
                              (60, 9, 2.55, 5), (245, 9, 2.5, 6), (155, 4, 2.7, 7)):
        stalk(az, tilt, ln, sd)
    # binding
    sc.add(Prim('cyl', (0, 0, 0.95), (0.46, 0.1), 'rope', rot(0, 0, 0), None, 9))
    sc.add(Prim('cyl', (0, 0, 0.7), (0.4, 0.08), 'rope', rot(0, 0, 0), None, 9))
    # cut stalk ends
    sc.add(Prim('cyl', (0, 0, 0.3), (0.3, 0.3), 'twine', rot(0, 0, 0), None, 4))
    return sc.render()


def ear_tex(pl, nl, pr):
    import math as m
    a = m.atan2(pl[1], pl[0])
    band = int((pl[2] + 1.0) * 4.4)
    side = int((a + m.pi) * 2.2)
    d = 0.22 if (band + side) % 2 else -0.22          # grain kernels
    if band % 3 == 0:
        d -= 0.1
    return None, d


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


def meat_tex(pl, nl, pr):
    n = vnoise(pl[0] * 2.6, pl[1] * 2.6, pl[2] * 2.6, pr.seed)
    if n > 0.64:
        return 'sear', (n - 0.64) * -0.2 + 0.0
    return None, (n - 0.5) * 0.25


def bone_tex(pl, nl, pr):
    return None, 0.0


