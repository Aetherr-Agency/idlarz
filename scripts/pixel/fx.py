"""Pixel effects: sparkle glints (static + animation frames)."""
from render3d import hexc

WHITE, PALE, WARM = hexc('#ffffff'), hexc('#fff6c4'), hexc('#ffe27a')


def glint(img, x, y, r=3, tint=None):
    """4-point twinkle centred on (x, y). r = arm length in px (0 draws nothing)."""
    if r <= 0:
        return
    tint = tint or PALE
    w, h = img.size

    def put(px, py, col, a=255):
        if 0 <= px < w and 0 <= py < h:
            img.putpixel((px, py), col[:3] + (a,))

    put(x, y, WHITE)
    for i in range(1, r + 1):
        col = WHITE if i == 1 else tint
        a = 255 if i < r else 190
        for dx, dy in ((i, 0), (-i, 0), (0, i), (0, -i)):
            put(x + dx, y + dy, col, a)
    if r >= 2:
        for dx, dy in ((1, 1), (-1, 1), (1, -1), (-1, -1)):
            put(x + dx, y + dy, tint, 200)


def find_highlights(img, colors, n=2, min_dist=10):
    """Brightest spots: pixels matching one of `colors`, topmost first, spread apart."""
    cols = {tuple(c) for c in colors}
    px = img.load()
    cand = [(x, y) for y in range(img.size[1]) for x in range(img.size[0]) if tuple(px[x, y]) in cols]
    cand.sort(key=lambda p: (p[1], p[0]))
    picked = []
    for p in cand:
        if all(abs(p[0] - q[0]) + abs(p[1] - q[1]) >= min_dist for q in picked):
            picked.append(p)
        if len(picked) == n:
            break
    return picked


def shine_frames(base, spots, radii=(0, 1, 2, 3, 2, 1)):
    """Animation frames: the glints swell and fade. Each spot is offset in phase."""
    frames = []
    for i in range(len(radii)):
        f = base.copy()
        for j, (x, y) in enumerate(spots):
            glint(f, x, y, radii[(i + 3 * j) % len(radii)])
        frames.append(f)
    return frames
