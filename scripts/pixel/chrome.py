"""Top-bar chrome: stone background, bronze edge, slot frames, XP bar, divider."""
import random
from PIL import Image, ImageDraw
from common import hexc as C, add_outline


def bg_tile():
    """64x56 tileable dark stone slabs."""
    w, h = 64, 56
    img = Image.new('RGBA', (w, h), C('#1a130f'))
    d = ImageDraw.Draw(img)
    rnd = random.Random(7)
    for y in range(h):
        for x in range(w):
            r = rnd.random()
            if r < 0.10:
                img.putpixel((x, y), C('#221a14'))
            elif r < 0.18:
                img.putpixel((x, y), C('#130d0a'))
    for y0, off in ((0, 0), (28, 16)):
        d.line([(0, y0), (w, y0)], fill=C('#0c0806'))
        d.line([(0, y0 + 1), (w, y0 + 1)], fill=C('#2b2119'))
        for x0 in range(off, w + 32, 32):
            xx = x0 % w
            d.line([(xx, y0), (xx, y0 + 27)], fill=C('#0c0806'))
            d.line([((xx + 1) % w, y0 + 2), ((xx + 1) % w, y0 + 26)], fill=C('#261d16'))
    return img


def edge_strip():
    """64x10 bronze + iron lower border with rivets (tiles horizontally)."""
    w, h = 64, 10
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rows = ['#0a0605', '#c9954a', '#9a6a2a', '#6a4418', '#2b1d0e', '#413a33', '#352f2a', '#1c1714', '#0a0605', '#0a0605']
    for y, c in enumerate(rows):
        d.line([(0, y), (w, y)], fill=C(c))
    for x in (8, 40):
        d.rectangle([x - 1, 4, x + 1, 6], fill=C('#5a5048'))
        d.point((x - 1, 4), fill=C('#a89b8a'))
        d.point((x, 4), fill=C('#d8ccb8'))
        d.point((x + 1, 6), fill=C('#26201b'))
    for x in range(0, w, 4):
        d.point((x, 2), fill=C('#b07c34'))
    return img


def slot(active=False, size=40):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    hi = '#f0c860' if active else '#a8783a'
    mid = '#c08a30' if active else '#7a5224'
    lo = '#6a4414' if active else '#3d2a14'
    d.rectangle([0, 0, size - 1, size - 1], fill=C('#0e0a08'))
    d.rectangle([1, 1, size - 2, size - 2], fill=C(mid))
    d.line([(1, 1), (size - 2, 1)], fill=C(hi))
    d.line([(1, 1), (1, size - 2)], fill=C(hi))
    d.line([(1, size - 2), (size - 2, size - 2)], fill=C(lo))
    d.line([(size - 2, 1), (size - 2, size - 2)], fill=C(lo))
    d.rectangle([3, 3, size - 4, size - 4], fill=C('#0e0a08'))
    d.rectangle([4, 4, size - 5, size - 5], fill=C('#3a2410' if active else '#17100b'))
    d.line([(4, 4), (size - 5, 4)], fill=C('#050302'))
    d.line([(4, 4), (4, size - 5)], fill=C('#050302'))
    if active:
        for i in range(5, 9):
            a = 40 - (i - 5) * 9
            d.rectangle([i, i, size - 1 - i, size - 1 - i], outline=(240, 180, 60, a))
    for x, y in ((2, 2), (size - 3, 2), (2, size - 3), (size - 3, size - 3)):
        d.point((x, y), fill=C('#e8d29a'))
    return img


def xp_frame(w=72):
    img = Image.new('RGBA', (w, 10), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w - 1, 9], fill=C('#0e0a08'))
    d.rectangle([1, 1, w - 2, 8], fill=C('#8a5f26'))
    d.line([(1, 1), (w - 2, 1)], fill=C('#d9a850'))
    d.line([(1, 8), (w - 2, 8)], fill=C('#4a3014'))
    d.rectangle([2, 2, w - 3, 7], fill=C('#0e0a08'))
    d.rectangle([3, 3, w - 4, 6], fill=C('#1d1511'))
    for x in (0, w - 1):
        d.point((x, 0), fill=(0, 0, 0, 0))
        d.point((x, 9), fill=(0, 0, 0, 0))
    d.point((1, 1), fill=C('#f0d890'))
    d.point((w - 2, 1), fill=C('#f0d890'))
    return img


def xp_fill():
    img = Image.new('RGBA', (2, 4), (0, 0, 0, 0))
    for y, c in enumerate(['#9be26a', '#5fbf3e', '#3f9a2c', '#2a6e1e']):
        for x in range(2):
            img.putpixel((x, y), C(c))
    return img


def divider(h=56):
    img = Image.new('RGBA', (9, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cy = h // 2
    d.line([(4, 2), (4, cy - 6)], fill=C('#5a3f1c'))
    d.line([(4, cy + 6), (4, h - 3)], fill=C('#5a3f1c'))
    d.line([(5, 2), (5, cy - 6)], fill=C('#1a120a'))
    d.line([(5, cy + 6), (5, h - 3)], fill=C('#1a120a'))
    d.polygon([(4, cy - 5), (8, cy), (4, cy + 5), (0, cy)], fill=C('#8a5f26'))
    d.polygon([(4, cy - 3), (6, cy), (4, cy + 3), (2, cy)], fill=C('#e0b23a'))
    d.point((4, cy - 1), fill=C('#fff0a0'))
    return add_outline(img)
