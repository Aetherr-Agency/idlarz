"""Seamless pixel-art textures: tileable noise, fog-of-war mist, cracked dark stone."""
import math
import random
from PIL import Image
from common import hexc as C

BAYER = ((0, 8, 2, 10), (12, 4, 14, 6), (3, 11, 1, 9), (15, 7, 13, 5))


def _h(ix, iy, seed):
    h = (ix * 374761393 + iy * 668265263 + seed * 1442695041) & 0xFFFFFFFF
    h = ((h ^ (h >> 13)) * 1274126177) & 0xFFFFFFFF
    return ((h ^ (h >> 16)) & 0xFFFF) / 65535.0


def tnoise(x, y, size, cells, seed=0):
    """Value noise that tiles every `size` px using a cells x cells lattice."""
    fx, fy = (x % size) * cells / size, (y % size) * cells / size
    ix, iy = int(fx), int(fy)
    tx, ty = fx - ix, fy - iy
    tx, ty = tx * tx * (3 - 2 * tx), ty * ty * (3 - 2 * ty)
    out = 0.0
    for dx in (0, 1):
        for dy in (0, 1):
            w = (tx if dx else 1 - tx) * (ty if dy else 1 - ty)
            out += w * _h((ix + dx) % cells, (iy + dy) % cells, seed)
    return out


def _smooth(a, b, v):
    t = max(0.0, min(1.0, (v - a) / (b - a)))
    return t * t * (3 - 2 * t)


def fog_tile(size=256, seed=1, tint=(128, 160, 210), alphas=(0, 14, 30, 50, 74)):
    """Soft drifting mist, quantised + dithered into a few alpha bands (RGBA, transparent where clear)."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    px = img.load()
    k = len(alphas)
    for y in range(size):
        for x in range(size):
            wx = (tnoise(x, y, size, 3, seed + 11) - 0.5) * 70
            wy = (tnoise(x, y, size, 3, seed + 23) - 0.5) * 70
            xs, ys = x + wx, y + wy
            v = (0.34 * tnoise(xs, ys, size, 4, seed)
                 + 0.30 * tnoise(xs, ys, size, 8, seed + 5)
                 + 0.22 * tnoise(xs, ys, size, 16, seed + 9)
                 + 0.14 * tnoise(xs, ys, size, 32, seed + 13))
            m = _smooth(0.44, 0.82, v)
            lvl = int(m * (k - 0.001) + (BAYER[y % 4][x % 4] / 16.0 - 0.5) * 0.9)
            lvl = max(0, min(k - 1, lvl))
            if lvl:
                lift = lvl / (k - 1)
                col = tuple(int(c + (255 - c) * 0.18 * lift) for c in tint)
                px[x, y] = col + (alphas[lvl],)
    return img


def crack_tile(size=96, seed=11):
    """Dark cracked stone: mottled near-black base with branching hairline cracks (tiles seamlessly)."""
    rnd = random.Random(seed)
    base = [C(c) for c in ('#15100c', '#1a130e', '#201812', '#271d16')]
    img = Image.new('RGBA', (size, size), base[1])
    px = img.load()

    def wrapd(a, b):
        d = abs(a - b)
        return min(d, size - d)

    def seeds(n):
        return [(rnd.uniform(0, size), rnd.uniform(0, size)) for _ in range(n)]

    layers = [(seeds(9), 1.7, 0.62, 0), (seeds(22), 1.1, 0.34, 1)]
    crack = {}
    for y in range(size):
        for x in range(size):
            m = 0.6 * tnoise(x, y, size, 6, seed) + 0.4 * tnoise(x, y, size, 12, seed + 3)
            lvl = int(m * 4.0 + (BAYER[y % 4][x % 4] / 16.0 - 0.5) * 0.7)
            px[x, y] = base[max(0, min(3, lvl))]
            if rnd.random() < 0.012:
                px[x, y] = C('#262229')               # cold mineral fleck
            jx = x + (tnoise(x, y, size, 7, seed + 40) - 0.5) * 9
            jy = y + (tnoise(x, y, size, 7, seed + 41) - 0.5) * 9
            for pts, thr, keep, li in layers:
                ds = sorted(((wrapd(jx, p[0]) ** 2 + wrapd(jy, p[1]) ** 2) ** 0.5, i) for i, p in enumerate(pts))
                (d1, i1), (d2, i2) = ds[0], ds[1]
                if d2 - d1 < thr and _h(min(i1, i2), max(i1, i2), seed + 70 + li) < keep:
                    crack[(x, y)] = True
    for (x, y) in crack:
        px[x, y] = C('#050302')
    for (x, y) in crack:                              # lower-right lip catches the light
        nx, ny = (x + 1) % size, (y + 1) % size
        if (nx, ny) not in crack:
            px[nx, ny] = C('#33261b')
    return img
