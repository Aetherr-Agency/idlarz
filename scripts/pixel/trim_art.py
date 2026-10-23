"""Coloured edge trims that replace the plain dither blend for two special seams:

  shore-land / shore-water   water <-> land. The land tile gets a bay bite (flat water), a foam line and a wet-sand beach;
                             the water tile gets a faint foam halo. Both tiles on a seam share one jittered shoreline
                             (z = distance across the seam, shoreline at z = jitter) so the beach is ragged but continuous.
  curb-yard / curb-castle    a stone kerb on every side of a cobbled yard / castle tile that faces a different ground.

Pieces use the same names as blend_art (n/e/s/w edges, ne/se/sw/nw inner corners); files are pre-scaled to 48x48.
"""
from common import hexc as C
from fog import tnoise
from blend_art import S, VARIANTS, EDGES, CORNERS, PIECES, _threshold
from PIL import Image

WATER = C('#1290d4')
FOAM_LO = C('#7ad4ff')
FOAM = C('#f0fbff')
SAND_WET = C('#c8a868')
SAND = C('#d8bc7c')
SAND_DRY = C('#e6d198')

CURBS = {
    'yard': (C('#2a2016'), C('#a8947a'), C('#6a5640')),     # outline, lit lip, shade
    'castle': (C('#1c0c44'), C('#9a6cf6'), C('#4a22a0')),
}


def _shore_colour(w, thr, land):
    """Colour for position w across the shoreline (w<=0 water side, w>=1 beach side). None = leave the tile's own ground."""
    if w <= -2:
        return WATER if land else None
    if w == -1:
        return FOAM_LO if thr < 0.7 else (WATER if land else None)
    if w == 0:
        return FOAM if thr < 0.85 else FOAM_LO
    if w == 1:
        return SAND_WET
    if w == 2:
        return SAND
    if w == 3:
        return SAND_DRY if thr < 0.5 else None
    return None


def shore(kind, piece, variant=0):
    """kind = 'land' (a land tile whose neighbour is water) or 'water' (a water tile whose neighbour is land)."""
    land = kind == 'land'
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    px = img.load()
    seed = 77 + variant * 19
    for y in range(S):
        for x in range(S):
            if piece in EDGES:
                d, along = {'n': (y, x), 's': (S - 1 - y, x), 'w': (x, y), 'e': (S - 1 - x, y)}[piece]
                z = d if land else -(d + 1)                       # the same coordinate on both sides of the seam
                jit = round((tnoise(along // 2 * 2, 0, S, 5, seed) - 0.5) * 5.5 + 1.2)
                jit = max(-1, min(3, jit))
                w = z - jit
            else:
                cx = S if 'e' in piece else 0
                cy = S if 's' in piece else 0
                r = ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2) ** 0.5
                if land:                                           # a small bay bite in the beach
                    w = int(round(r - 2.6))
                else:                                              # a small beach pebble in the water, ringed with foam
                    w = 1 if r < 2.0 else (3 if r < 3.0 else (0 if r < 4.0 else (-1 if r < 5.0 else -9)))
            col = _shore_colour(w, _threshold(x, y, seed), land)
            if col is not None:
                px[x, y] = col
    return img.resize((S * 2, S * 2), Image.NEAREST)


def curb(kind, piece):
    dark, lip, shade = CURBS[kind]
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    px = img.load()
    for y in range(S):
        for x in range(S):
            if piece in EDGES:
                m = {'n': y, 's': S - 1 - y, 'w': x, 'e': S - 1 - x}[piece]
            else:
                dx = S - 1 - x if 'e' in piece else x
                dy = S - 1 - y if 's' in piece else y
                m = max(dx, dy)
            if m == 0:
                px[x, y] = dark
            elif m == 1:
                px[x, y] = lip
            elif m == 2 and (x + y) % 2 == 0:
                px[x, y] = shade
    return img.resize((S * 2, S * 2), Image.NEAREST)


TRIMS = {}
for _kind in ('land', 'water'):
    for _p in PIECES:
        for _v in range(VARIANTS):
            TRIMS[f'shore-{_kind}_{_p}_{_v}'] = (lambda k=_kind, p=_p, v=_v: shore(k, p, v))
for _kind in CURBS:
    for _p in PIECES:
        TRIMS[f'curb-{_kind}_{_p}_0'] = (lambda k=_kind, p=_p: curb(k, p))
