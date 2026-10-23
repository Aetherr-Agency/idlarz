"""Shared helpers for the pixel-art generators (Pillow, no anti-aliasing)."""
import random
from PIL import Image, ImageDraw

OUTLINE = (14, 10, 8, 255)


def hexc(h, a=255):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (a,)


def canvas(w=32, h=32):
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


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


def shadow(img, box, alpha=95):
    """Soft ground shadow (translucent ellipse) - drawn before the object."""
    layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).ellipse(box, fill=(0, 0, 0, alpha))
    img.alpha_composite(layer)


def speckle(img, target, repl, prob, seed=1):
    """Randomly swap pixels of colour `target` for `repl` (cheap grain / texture)."""
    rnd = random.Random(seed)
    px = img.load()
    for y in range(img.size[1]):
        for x in range(img.size[0]):
            if px[x, y] == target and rnd.random() < prob:
                px[x, y] = repl


def shaded_ellipse(img, box, layers):
    """Ellipse filled by a stack of offset ellipses clipped to the base shape.

    layers = [(colour, dx0, dy0, dx1, dy1), ...] - offsets applied to `box`.
    The first layer is the base (offsets ignored).
    """
    mask = Image.new('L', img.size, 0)
    ImageDraw.Draw(mask).ellipse(box, fill=255)
    for colour, dx0, dy0, dx1, dy1 in layers:
        layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
        b = [box[0] + dx0, box[1] + dy0, box[2] + dx1, box[3] + dy1]
        ImageDraw.Draw(layer).ellipse(b, fill=colour)
        clipped = Image.new('RGBA', img.size, (0, 0, 0, 0))
        clipped.paste(layer, (0, 0), mask)
        img.alpha_composite(clipped)


def iso_cube(d, tx, ty, hw, sh, top, left, right, edge=None):
    """Isometric block. (tx, ty) = top vertex, hw = half width, sh = side height."""
    hh = hw // 2
    d.polygon([(tx, ty), (tx + hw, ty + hh), (tx, ty + hw), (tx - hw, ty + hh)], fill=top)
    d.polygon([(tx - hw, ty + hh), (tx, ty + hw), (tx, ty + hw + sh), (tx - hw, ty + hh + sh)], fill=left)
    d.polygon([(tx + hw, ty + hh), (tx, ty + hw), (tx, ty + hw + sh), (tx + hw, ty + hh + sh)], fill=right)
    if edge:
        # lit top-left edges
        d.line([(tx - hw, ty + hh), (tx, ty)], fill=edge)
        d.line([(tx, ty), (tx + hw, ty + hh)], fill=edge)


def upscale(img, k):
    return img.resize((img.size[0] * k, img.size[1] * k), Image.NEAREST)
