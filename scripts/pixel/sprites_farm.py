"""Farm pen (isometric): a fenced meadow with a barn, trough, hay and a gate, drawn by the same ray-caster and camera as
the animals so everything shares one light. Two layers are produced from one render: 'back' (everything) and 'front'
(just the near fences + props, cut out of the same render) so animals can walk between them.

Ground -> screen:  sx = OX + (x - y) * 0.7071 * SCALE      sy = OY - 0.3536 * (x + y) * SCALE   (feet at z = 0)
The React farm scene uses these same constants (src/components/game/overlays/farm/penGeometry.ts)."""
import math
from render3d import Scene, Prim, rot, vnoise, between, I3
from materials import MATS
from sprites_props import plank_tex, shingle_tex, hay_tex
import fx

W, H = 256, 184
SCALE = 13.0
OX, OY = 128, 124
HX, HY = 7.0, 5.0            # pen half-extents (x, y)
GATE = (-1.0, 1.0)           # gate opening along the near-right fence (y = -HY)


def ground_tex(pl, nl, pr):
    if nl[2] < 0.5:
        return 'soil', 0.0                                    # the cut edge of the turf
    x, y = pl[0], pl[1]
    n = vnoise(x * 1.5, y * 1.5, 0, 3)
    m = vnoise(x * 5.0, y * 5.0, 0, 4)
    d = (m - 0.5) * 0.3 + (n - 0.5) * 0.35
    # trodden dirt: around the trough, the gate and a worn track between gate and barn
    dist_trough = math.hypot((x + 3.3) / 1.5, (y - 1.4) / 1.1)
    dist_gate = math.hypot(x / 1.9, (y + HY - 0.6) / 1.4)
    t = (y + HY) / (HY * 1.4)
    dist_track = abs(x - (t * 4.2 - 0.2)) / 0.75 if y > -HY + 1 and y < 2 else 9
    if min(dist_trough, dist_gate, dist_track) < 1.0 - (m - 0.5) * 0.5:
        return 'soil', d * 0.7
    if m > 0.8:
        return None, d - 0.18                                 # darker tufts
    if m < 0.12:
        return None, d + 0.2                                  # sun-bleached blades
    return None, d


def barn(prims, cx, cy, k=1.3):
    def P(kind, c, size, mat, R=I3, tex=None, seed=0):
        prims.append(Prim(kind, (cx + c[0] * k, cy + c[1] * k, c[2] * k), tuple(s * k for s in size), mat, R, tex, seed))

    P('box', (0, 0, 0.06), (1.35, 0.98, 0.08), 'slate', I3, None, 30)
    P('box', (0, 0, 0.8), (1.25, 0.9, 0.72), 'barn', I3, plank_tex, 1)
    P('box', (0, -0.52, 1.9), (1.45, 0.7, 0.07), 'shingle', rot(38, 0, 0), shingle_tex, 2)
    P('box', (0, 0.52, 1.9), (1.45, 0.7, 0.07), 'shingle', rot(-38, 0, 0), shingle_tex, 3)
    P('box', (0, 0, 2.36), (1.45, 0.08, 0.07), 'cream')
    for z, hw in ((1.64, 0.78), (1.86, 0.56), (2.07, 0.34)):
        P('box', (-1.22, 0, z), (0.05, hw, 0.12), 'barn', I3, plank_tex, 4)
    P('box', (0.35, -0.9, 0.62), (0.64, 0.05, 0.6), 'cream')
    P('box', (0.35, -0.93, 0.62), (0.52, 0.05, 0.52), 'door', I3, plank_tex, 5)
    for (x0, x1) in ((0.0, 0.7), (0.7, 0.0)):
        prims.append(between('box', (cx + x0 * k, cy - 0.97 * k, 0.15 * k), (cx + x1 * k, cy - 0.97 * k, 1.05 * k),
                             (0.04 * k, 0.03 * k), 'cream', None, (0, -1, 0)))
    P('box', (-0.72, -0.9, 1.15), (0.22, 0.04, 0.2), 'cream')
    P('box', (-0.72, -0.93, 1.15), (0.16, 0.04, 0.14), 'dark')
    P('ell', (-0.72, -0.95, 1.05), (0.17, 0.05, 0.08), 'wheat', I3, hay_tex, 6)
    P('box', (-1.25, -0.9, 0.8), (0.05, 0.05, 0.72), 'cream')
    P('box', (1.25, -0.9, 0.8), (0.05, 0.05, 0.72), 'cream')
    P('cyl', (0.3, 0, 2.75), (0.035, 0.38), 'steel', I3, None, 7)
    P('box', (0.3, 0, 3.2), (0.3, 0.02, 0.06), 'gold')
    P('ell', (0.6, 0, 3.2), (0.1, 0.03, 0.1), 'gold')


def fence_run(back, front, axis, fixed, lo, hi, near, gap=None, step=1.75):
    """Posts + two rails along one edge. axis 'x' runs along x at y=fixed; 'y' runs along y at x=fixed."""
    out = front if near else back
    n = max(1, round((hi - lo) / step))
    pts = [lo + (hi - lo) * i / n for i in range(n + 1)]

    def at(t, z):
        return (t, fixed, z) if axis == 'x' else (fixed, t, z)

    for i, t in enumerate(pts):
        if gap and gap[0] < t < gap[1]:
            continue
        out.append(Prim('box', at(t, 0.55), (0.1, 0.1, 0.55), 'plank', I3, None, 100 + i))
        out.append(Prim('box', at(t, 1.13), (0.12, 0.12, 0.05), 'wood_cut', I3, None, 120 + i))
    for z in (0.42, 0.86):
        segs = [(lo, hi)] if not gap else [(lo, gap[0]), (gap[1], hi)]
        for a, b in segs:
            if b - a < 0.1:
                continue
            p0, p1 = at(a, z), at(b, z)
            out.append(between('box', p0, p1, (0.045, 0.07), 'plank', None, (0, 0, 1), 140 + int(z * 10)))


def build():
    back, front = [], []
    # --- ground
    back.append(Prim('box', (0, 0, -0.14), (HX + 0.25, HY + 0.25, 0.14), 'grass', I3, ground_tex, 1))
    # --- fences: far edges go behind the animals, the two near edges in front
    fence_run(back, front, 'x', HY, -HX, HX, near=False)                       # far-left edge (y = +HY)
    fence_run(back, front, 'y', HX, -HY, HY, near=False)                       # far-right edge (x = +HX)
    fence_run(back, front, 'y', -HX, -HY, HY, near=True)                       # near-left edge (x = -HX)
    fence_run(back, front, 'x', -HY, -HX, HX, near=True, gap=GATE)             # near-right edge, with a gate
    # gate: two taller posts + planks
    for gx in GATE:
        front.append(Prim('box', (gx, -HY, 0.7), (0.14, 0.14, 0.7), 'bark', I3, None, 160))
        front.append(Prim('box', (gx, -HY, 1.45), (0.17, 0.17, 0.07), 'wood_cut', I3, None, 161))
    for z in (0.34, 0.7, 1.06):
        front.append(Prim('box', (0, -HY - 0.05, z), (GATE[1] - 0.12, 0.04, 0.07), 'wood_cut', I3, None, 170))
    front.append(between('box', (GATE[0] + 0.1, -HY - 0.05, 0.3), (GATE[1] - 0.1, -HY - 0.05, 1.1), (0.04, 0.03), 'wood_cut',
                         None, (0, -1, 0), 171))
    # --- barn in the far corner + props
    barn(back, 4.1, 2.3, 1.3)
    # trough (water) + hay feeder
    back.append(Prim('box', (-3.3, 1.4, 0.3), (0.95, 0.38, 0.28), 'plank', I3, plank_tex, 20))
    back.append(Prim('box', (-3.3, 1.4, 0.5), (0.8, 0.26, 0.1), 'water', I3, None, 21))
    for sx in (-1, 1):
        back.append(Prim('box', (-3.3 + 0.8 * sx, 1.4, 0.18), (0.08, 0.34, 0.18), 'bark', I3, None, 22))
    # hay bales + loose hay
    for i, (x, y, rz) in enumerate(((-5.2, 2.7, 15), (-4.3, 3.3, -20), (-5.0, 3.6, 70))):
        back.append(Prim('cyl', (x, y, 0.42), (0.5, 0.5), 'wheat', rot(90, 0, rz), hay_tex, 30 + i))
    back.append(Prim('ell', (-4.7, 3.0, 0.9), (0.38, 0.38, 0.28), 'wheat', I3, hay_tex, 33))
    back.append(Prim('cyl', (-4.6, -3.4, 0.4), (0.5, 0.5), 'wheat', rot(90, 0, 40), hay_tex, 34))
    front.append(Prim('cyl', (-5.9, -4.0, 0.4), (0.46, 0.46), 'wheat', rot(90, 0, -35), hay_tex, 35))
    # bucket, stones, bushes, flowers
    back.append(Prim('cyl', (-1.9, 2.2, 0.26), (0.2, 0.26), 'steel', I3, None, 40))
    back.append(Prim('ell', (-1.9, 2.2, 0.5), (0.18, 0.18, 0.04), 'water', I3, None, 41))
    for i, (x, y, r) in enumerate(((1.2, 3.8, 0.4), (1.7, 3.5, 0.28), (6.3, -1.2, 0.4), (6.0, -0.5, 0.26))):
        back.append(Prim('ell', (x, y, r * 0.5), (r, r * 0.85, r * 0.6), 'granite', I3, None, 50 + i))
    for i, (x, y, r) in enumerate(((-6.2, 4.2, 0.7), (-5.4, 4.5, 0.55), (6.4, 4.3, 0.6), (6.5, -4.2, 0.65), (-6.5, 1.0, 0.45))):
        back.append(Prim('ell', (x, y, r * 0.8), (r, r, r * 0.85), 'pine', I3, None, 60 + i))
    for i, (x, y, col) in enumerate(((1.4, -2.2, 'blossom'), (1.9, -1.6, 'wheat'), (-1.3, -2.8, 'wheat'), (3.3, -3.6, 'blossom'),
                                     (5.6, 0.8, 'wheat'), (0.6, 2.6, 'blossom'), (-2.4, -1.0, 'wheat'), (2.6, -0.9, 'blossom'))):
        back.append(Prim('ell', (x, y, 0.2), (0.07, 0.07, 0.1), col, I3, None, 70 + i))
        back.append(Prim('cyl', (x, y, 0.08), (0.02, 0.1), 'reed', I3, None, 80 + i))
    # signpost by the gate (front)
    front.append(Prim('cyl', (1.9, -HY - 0.5, 0.65), (0.06, 0.65), 'bark', I3, None, 90))
    front.append(Prim('box', (1.9, -HY - 0.5, 1.2), (0.38, 0.03, 0.17), 'plank', I3, plank_tex, 91))
    front.append(Prim('ell', (1.9, -HY - 0.56, 1.2), (0.1, 0.02, 0.06), 'wheat'))
    return back, front


def _scene(prims):
    sc = Scene(MATS, size=(W, H), scale=SCALE, origin=(OX, OY))
    sc.add(*prims)
    return sc


_CACHE = {}


def layers():
    if not _CACHE:
        back, front = build()
        full = _scene(back + front).render()
        only_front = _scene(front).render()
        mask = only_front.getchannel('A').point(lambda a: 255 if a else 0)
        from PIL import Image
        fr = Image.new('RGBA', full.size, (0, 0, 0, 0))
        fr.paste(full, (0, 0), mask)
        _CACHE['back'], _CACHE['front'] = full, fr
    return _CACHE


SPRITES = {
    'farm_back': lambda: layers()['back'],
    'farm_front': lambda: layers()['front'],
}
