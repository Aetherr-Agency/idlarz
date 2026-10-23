"""Shared pixel helpers (no anti-aliasing anywhere)."""
from PIL import Image

OUTLINE = (14, 10, 8, 255)


def hexc(h, a=255):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (a,)


def add_outline(img, color=OUTLINE):
    """1px outline around every (mostly) opaque pixel. Soft shadow pixels are ignored."""
    w, h = img.size
    src = img.load()
    out = img.copy()
    dst = out.load()
    for y in range(h):
        for x in range(w):
            if src[x, y][3] > 200:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and src[nx, ny][3] > 200:
                    dst[x, y] = color
                    break
    return out


def upscale(img, k):
    return img.resize((img.size[0] * k, img.size[1] * k), Image.NEAREST)
