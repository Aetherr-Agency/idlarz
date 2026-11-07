"""Big comparison map of the five dev biomes next to the shipped ones, drawn by the same terrain logic the game uses.

    python scripts/pixel/terrain_dev_preview.py          # previews/dev-biomes-map.png (+ labelled and close-up versions)
"""
import os
import sys
import terrain_dev                                         # registers the dev biomes first
from PIL import Image, ImageDraw
import terrain_build as build
import terrain_preview as prev
from terrain_field import hash32, CELL

NAMES = dict(prev.NAMES, J='jungle', D='fields', O='orchard', X='blight', V='battlefield')
W, H = 76, 50
# biome seeds (x, y): nearest seed wins, with a little hashed noise so the borders wobble. Placed so the decided conflicts never touch:
# blight x lake/coast/orchard, battlefield x swamp, jungle x tundra, tundra x swamp/coast, hills x coast.
SEEDS = [
    ('T', 8, 8), ('H', 26, 6), ('X', 48, 7), ('V', 66, 9), ('P', 40, 20), ('P', 8, 22), ('F', 22, 24), ('D', 52, 26), ('O', 66, 28),
    ('J', 22, 41), ('L', 7, 41), ('S', 71, 43), ('H', 44, 43), ('P', 56, 44), ('F', 34, 34),
]
LABELS = {'T': 'Tundra', 'H': 'Hills', 'X': 'BLIGHT', 'V': 'BATTLEFIELD', 'P': 'Plains', 'F': 'Forest', 'D': 'FIELDS', 'O': 'ORCHARD',
          'J': 'JUNGLE', 'L': 'Lake', 'S': 'Swamp'}


def layout():
    rows = []
    for y in range(H):
        row = ''
        for x in range(W):
            u, v = (x + 0.5) / W, (y + 0.5) / H
            n = (hash32(x, y, 900) % 100) / 100 - 0.5
            if ((u - 0.5) / 0.495) ** 2 + ((v - 0.5) / 0.485) ** 2 + n * 0.08 > 1:
                row += '.'
                continue
            best = min(SEEDS, key=lambda s: (s[1] - x) ** 2 + (s[2] - y) ** 2 + (hash32(x, y, s[1] * 31 + s[2]) % 100) * 0.5)
            row += best[0]
        rows.append(row)
    g = [list(r) for r in rows]
    for y in range(H):                                     # a beach round the lake (never beside blight, hills or tundra: the rules forbid it)
        for x in range(W):
            if rows[y][x] in 'PFJ' and any(0 <= x + dx < W and 0 <= y + dy < H and rows[y + dy][x + dx] == 'L' for dx in range(-2, 3) for dy in range(-2, 3)):
                g[y][x] = 'B'
    return [''.join(r) for r in g]


def main():
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'previews')
    os.makedirs(out, exist_ok=True)
    m, images, _ = build.manifest()
    prev.NAMES.update(NAMES)
    rows = layout()
    world = prev.render_world(rows, m, images)
    world.save(os.path.join(out, 'dev-biomes-map.png'))
    lab = world.copy()
    d = ImageDraw.Draw(lab)
    for key, x, y in SEEDS:
        txt = LABELS[key]
        px, py = x * CELL, y * CELL
        d.rectangle((px - 4, py - 2, px + 9 * len(txt) + 4, py + 14), fill=(0, 0, 0, 170))
        d.text((px, py), txt, fill=(255, 235, 120, 255))
    lab.save(os.path.join(out, 'dev-biomes-map-labelled.png'))
    print('map', world.size, '->', out)
    # close-ups at 2x: the centre of each new biome
    for key, name in (('J', 'jungle'), ('D', 'fields'), ('O', 'orchard'), ('X', 'blight'), ('V', 'battlefield')):
        sx, sy = next((x, y) for k, x, y in SEEDS if k == key)
        box = (max(0, (sx - 8) * CELL), max(0, (sy - 6) * CELL), min(world.size[0], (sx + 8) * CELL), min(world.size[1], (sy + 6) * CELL))
        c = world.crop(box)
        c.resize((c.size[0] * 2, c.size[1] * 2), Image.NEAREST).save(os.path.join(out, f'dev-closeup-{name}.png'))


if __name__ == '__main__':
    main()
