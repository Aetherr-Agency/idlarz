"""Seamless 24x24 ground textures for every biome (shown at 2x = one 48px map tile) and the
"unexplored" cloud tile. Every texture wraps, so neighbouring tiles of one biome read as one field."""
import random
from PIL import Image
from common import hexc as C
from fog import tnoise, BAYER

S = 24


def _canvas(tones, seed, cells=(3, 6), mix=(0.62, 0.38), dither=0.5):
    """Base ground: tileable value noise quantised to the biome's tones with a touch of ordered dither."""
    img = Image.new('RGBA', (S, S))
    px = img.load()
    t = [C(c) for c in tones]
    k = len(t)
    for y in range(S):
        for x in range(S):
            v = mix[0] * tnoise(x, y, S, cells[0], seed) + mix[1] * tnoise(x, y, S, cells[1], seed + 7)
            idx = int(v * k * 1.15 - 0.08 * k + (BAYER[y % 4][x % 4] / 16.0 - 0.5) * dither)
            px[x, y] = t[max(0, min(k - 1, idx))]
    return img, px


def _put(px, x, y, col):
    px[x % S, y % S] = C(col) if isinstance(col, str) else col


def _blob(px, cx, cy, rx, ry, fill, rim=None, shade=None):
    """Small blob; optional lit rim (top-left) and shade (bottom-right)."""
    for dy in range(-ry - 1, ry + 2):
        for dx in range(-rx - 1, rx + 2):
            d = (dx / (rx + 0.5)) ** 2 + (dy / (ry + 0.5)) ** 2
            if d <= 1:
                col = fill
                if shade and (dx + dy > 0) and d > 0.45:
                    col = shade
                if rim and (dx + dy < 0) and d > 0.45:
                    col = rim
                _put(px, cx + dx, cy + dy, col)


def _scatter(rnd, n, margin=0):
    return [(rnd.randrange(S), rnd.randrange(S)) for _ in range(n)]


def forest(seed=1):
    img, px = _canvas(['#0e3a20', '#134a28', '#1a5e32'], seed)
    rnd = random.Random(seed)
    for x, y in _scatter(rnd, 9):
        _put(px, x, y, '#082a16'); _put(px, x + 1, y, '#082a16'); _put(px, x, y + 1, '#082a16')
    for x, y in _scatter(rnd, 18):
        _put(px, x, y, '#2c8a46')
    for x, y in _scatter(rnd, 6):
        _put(px, x, y, '#4aae5e'); _put(px, x - 1, y + 1, '#2c8a46')
    return img


def plains(seed=2):
    img, px = _canvas(['#3d8a2c', '#479a32', '#52ac3a'], seed)
    rnd = random.Random(seed)
    for x, y in _scatter(rnd, 12):                       # grass blades
        _put(px, x, y, '#6cc84a'); _put(px, x, y - 1, '#8ae05a'); _put(px, x + 1, y, '#2f7a24')
    for i, (x, y) in enumerate(_scatter(rnd, 3)):         # flowers
        petal = ['#ffffff', '#ffd0e0', '#ffffff'][i]
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            _put(px, x + dx, y + dy, petal)
        _put(px, x, y, '#ffd83a')
    for x, y in _scatter(rnd, 10):
        _put(px, x, y, '#2f7a24')
    return img


def hills(seed=3):
    img, px = _canvas(['#4e4e58', '#5c5c68', '#6a6a78'], seed)
    rnd = random.Random(seed)
    for x, y in _scatter(rnd, 4):
        _blob(px, x, y, 2, 1, '#8a8a98', '#b0b0c0', '#3a3a44')
    for x, y in _scatter(rnd, 3):
        _blob(px, x, y, 2, 1, '#4a6a3a', None, '#34502a')
    for x, y in _scatter(rnd, 14):
        _put(px, x, y, '#7c7c8a')
    for x, y in _scatter(rnd, 8):
        _put(px, x, y, '#3a3a44')
    return img


def swamp(seed=4):
    img, px = _canvas(['#5c6014', '#6a7018', '#788020'], seed)
    rnd = random.Random(seed)
    for x, y in _scatter(rnd, 3):
        _blob(px, x, y, 3, 2, '#2e4020', '#8a9a30', '#1e2e14')
    for x, y in _scatter(rnd, 7):                        # reeds
        for k in range(3):
            _put(px, x, y - k, '#2a4a1a')
        _put(px, x, y - 3, '#6a4020')
    for x, y in _scatter(rnd, 8):
        _put(px, x, y, '#b8c850')
    for x, y in _scatter(rnd, 10):
        _put(px, x, y, '#4a5010')
    return img


def tundra(seed=5):
    img, px = _canvas(['#3a78c4', '#4a88d2', '#5c9ae0'], seed)
    rnd = random.Random(seed)
    for x, y in _scatter(rnd, 5):
        _blob(px, x, y, 3, 1, '#dff0ff', '#ffffff', '#a8cdf0')
    for x, y in _scatter(rnd, 4):                        # ice cracks
        for k in range(5):
            _put(px, x + k, y + (k // 2), '#2a5ea4')
    for x, y in _scatter(rnd, 10):
        _put(px, x, y, '#ffffff')
    return img


def lake(seed=6):
    img, px = _canvas(['#0a7cc0', '#1290d4', '#1ea4e6'], seed, cells=(3, 6), mix=(0.7, 0.3))
    rnd = random.Random(seed)
    for x, y in _scatter(rnd, 5):                        # waves
        for k in range(4):
            _put(px, x + k, y, '#7ad4ff')
        _put(px, x + 1, y - 1, '#c8f0ff')
    for x, y in _scatter(rnd, 4):
        for k in range(3):
            _put(px, x + k, y, '#0a68a8')
    return img


def grounds(seed=7):
    img, px = _canvas(['#4a2c12', '#583616', '#664018'], seed, cells=(3, 6))
    rnd = random.Random(seed)
    for row in range(4):                                  # furrows
        y = 3 + row * 6
        for x in range(S):
            _put(px, x, y, '#35200c')
            _put(px, x, y + 1, '#7a5028' if (x + row) % 3 else '#8a6034')
    for x, y in _scatter(rnd, 6):
        _put(px, x, y, '#8a7a68')
    return img


def castle(seed=8):
    img, px = _canvas(['#4a1d96', '#5524ae', '#612bc4'], seed, dither=0.3)
    for sy in range(0, S, 12):                            # flagstones
        off = 6 if (sy // 12) % 2 else 0
        for x in range(S):
            _put(px, x, sy, '#2a0e60')
        for sx in range(off, S + off, 12):
            for y in range(sy, sy + 12):
                _put(px, sx, y, '#2a0e60')
            for k in range(1, 6):
                _put(px, sx + k, sy + 1, '#8a5af0')
            _put(px, sx + 1, sy + 2, '#8a5af0')
    return img


def empty(seed=9):
    img, _ = _canvas(['#141414', '#1a1a1a', '#202020'], seed, dither=0.3)
    return img


GROUNDS = {
    'forest': forest, 'plains': plains, 'hills': hills, 'swamp': swamp, 'tundra': tundra,
    'lake': lake, 'grounds': grounds, 'castle': castle, 'empty': empty,
}


# ----------------------------------------------------------------- unexplored: clear drifting clouds
def cloud_tile(size, seed, levels, base=None, edge=None, cells=(2, 4), warp=0.0, edge_from=1):
    """Flat-banded cartoon clouds that tile. levels = [(threshold, colour), ...] ascending; pixels below the first
    threshold get `base` (or stay transparent). `edge` lights the top-left rim of each higher band."""
    grid = [[0] * size for _ in range(size)]
    for y in range(size):
        for x in range(size):
            xs, ys = x, y
            if warp:
                xs += (tnoise(x, y, size, 3, seed + 3) - 0.5) * warp
                ys += (tnoise(x, y, size, 3, seed + 5) - 0.5) * warp
            v = 0.6 * tnoise(xs, ys, size, cells[0], seed) + 0.4 * tnoise(xs, ys, size, cells[1], seed + 9)
            grid[y][x] = sum(1 for th, _ in levels if v >= th)
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    px = img.load()
    for y in range(size):
        for x in range(size):
            lvl = grid[y][x]
            if lvl == 0:
                if base:
                    px[x, y] = base
                continue
            col = levels[lvl - 1][1]
            if edge and lvl >= edge_from and grid[(y - 1) % size][(x - 1) % size] < lvl:
                col = edge
            px[x, y] = col
    return img


def mystery(seed=12):
    """Unexplored-land tile: deep indigo with soft pale clouds drifting through (animated in CSS)."""
    levels = [(0.44, C('#101a44')), (0.54, C('#172662')), (0.64, C('#223a86'))]
    return cloud_tile(S, seed, levels, base=C('#080c20'), edge=C('#3452a0'), cells=(2, 3), warp=3, edge_from=3)


def fog(size=48, seed=3, tint=(120, 150, 200), thresholds=(0.42, 0.50, 0.58), alphas=(14, 28, 46)):
    """Fog of war: puffy flat-banded clouds at low resolution (shown 3x so every pixel is a chunky block).
    Transparent between clouds; two layers of different sizes hide the repeat."""
    levels = [(th, tint + (a,)) for th, a in zip(thresholds, alphas)]
    return cloud_tile(size, seed, levels, base=None, edge=None, cells=(3, 6), warp=3)
