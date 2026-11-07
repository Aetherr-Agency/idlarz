"""Cuts the props of the two Blight / Battlefield reference sheets (art_style_reference/biomes/) into small map sprites.

    python scripts/pixel/cut_biome_refs.py

Each sprite is a labelled component of a sheet (background keyed out), shrunk by an exact integer factor with a block
*mode* (the most common colour of each block, so no new colours appear and nothing is smoothed; rule 3 of
art_style_reference/README.md), with the sheet's soft drop shadow removed (our props have none). Outputs go to
scripts/pixel/assets/biomes/<name>.png (committed). The numbers are the component indices of this script's own scan order
(left to right, top to bottom); `python cut_biome_refs.py --sheet` writes a numbered contact sheet to check them.
"""
import os
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
SHEETS = os.path.join(HERE, '..', '..', 'art_style_reference', 'biomes')
OUT = os.path.join(HERE, 'assets', 'biomes')
BG = np.array([188, 199, 193])
SHADOW = np.array([158, 110, 90])          # the tan drop shadow under the Blight sheet's props

# name: (sheet, component index, shrink factor)
CUTS = {
    # Battlefield (graveyard and bone sheet)
    'tomb_0': ('AEcKbU', 37, 3), 'tomb_1': ('AEcKbU', 43, 3), 'tomb_2': ('AEcKbU', 38, 3), 'tomb_3': ('AEcKbU', 44, 3),
    'tomb_4': ('AEcKbU', 33, 3), 'tomb_5': ('AEcKbU', 34, 3), 'tomb_6': ('AEcKbU', 36, 3), 'tomb_7': ('AEcKbU', 40, 3),
    'skulls': ('AEcKbU', 7, 3), 'skull': ('AEcKbU', 9, 3), 'skull_pile': ('AEcKbU', 11, 4), 'horned_skull': ('AEcKbU', 13, 4),
    'ribs': ('AEcKbU', 10, 4), 'ribs_half': ('AEcKbU', 1, 3), 'bones': ('AEcKbU', 19, 3), 'bone_a': ('AEcKbU', 4, 3),
    'bone_b': ('AEcKbU', 6, 3), 'bone_c': ('AEcKbU', 8, 3), 'jaw': ('AEcKbU', 3, 3), 'bird_bones': ('AEcKbU', 16, 3),
    'pale_tree_0': ('AEcKbU', 18, 5), 'pale_tree_1': ('AEcKbU', 21, 4), 'pale_stump': ('AEcKbU', 26, 4),
    'hand_green': ('AEcKbU', 24, 3), 'hand_blue': ('AEcKbU', 23, 3), 'hand_flesh': ('AEcKbU', 22, 4),
    'crypt_s': ('AEcKbU', 30, 4), 'crypt_m': ('AEcKbU', 28, 5),
    # Blight (flesh and vein sheet) and the dark dead trees of the other sheet
    'eyes_l': ('ixzlDW', 27, 4), 'eyes_m': ('ixzlDW', 28, 4), 'eyes_s': ('ixzlDW', 30, 3), 'eyes_xs': ('ixzlDW', 31, 3), 'eyes_xxs': ('ixzlDW', 32, 3),
    'vrock_l': ('ixzlDW', 13, 4), 'vrock_m': ('ixzlDW', 16, 4), 'vrock_s': ('ixzlDW', 19, 3), 'vrock_xs': ('ixzlDW', 21, 3), 'vrock_xxs': ('ixzlDW', 23, 3),
    'brock_0': ('ixzlDW', 0, 3), 'brock_1': ('ixzlDW', 3, 3), 'brock_2': ('ixzlDW', 5, 3), 'brock_3': ('ixzlDW', 8, 4), 'brock_4': ('ixzlDW', 9, 3),
    'brock_spiky': ('ixzlDW', 1, 4), 'brock_spiky_l': ('ixzlDW', 2, 4),
    'circle': ('ixzlDW', 4, 5), 'ruin': ('ixzlDW', 6, 5), 'arch': ('ixzlDW', 7, 5),
    'vbones_0': ('ixzlDW', 12, 3), 'vbones_1': ('ixzlDW', 10, 3), 'vbones_2': ('ixzlDW', 22, 3), 'vbones_3': ('ixzlDW', 14, 3), 'vskull': ('ixzlDW', 17, 3),
    'tendril': ('ixzlDW', 33, 5),
    'dark_tree_0': ('AEcKbU', 29, 5), 'dark_tree_1': ('AEcKbU', 31, 4),
}


def components(name):
    im = Image.open(os.path.join(SHEETS, name + '.jpg')).convert('RGB')
    a = np.asarray(im).astype(int)
    fg = np.abs(a - BG).sum(axis=2) > 40
    d = np.asarray(Image.fromarray((fg * 255).astype('uint8')).filter(ImageFilter.MaxFilter(11))) > 0
    H, W = d.shape
    lab = np.zeros((H, W), int)
    boxes, n = [], 0
    for y in range(H):
        for x in range(W):
            if d[y, x] and not lab[y, x]:
                n += 1
                q = deque([(y, x)])
                lab[y, x] = n
                x0 = x1 = x
                y0 = y1 = y
                cnt = 0
                while q:
                    cy, cx = q.popleft()
                    cnt += 1
                    x0, x1, y0, y1 = min(x0, cx), max(x1, cx), min(y0, cy), max(y1, cy)
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < H and 0 <= nx < W and d[ny, nx] and not lab[ny, nx]:
                            lab[ny, nx] = n
                            q.append((ny, nx))
                if cnt > 150:
                    boxes.append((n, x0, y0, x1 + 1, y1 + 1))
    return im, fg, lab, boxes


def crop(im, fg, lab, box, unshadow):
    n, x0, y0, x1, y1 = box
    a = np.asarray(im.crop((x0, y0, x1, y1))).astype(int)
    keep = fg[y0:y1, x0:x1] & (lab[y0:y1, x0:x1] == n)
    if unshadow:
        keep &= np.abs(a - SHADOW).sum(axis=2) > 48
    out = np.zeros(a.shape[:2] + (4,), 'uint8')
    out[..., :3] = a
    out[..., 3] = keep * 255
    return out


def shrink(a, f):
    h, w = a.shape[0] // f, a.shape[1] // f
    out = np.zeros((h, w, 4), 'uint8')
    for y in range(h):
        for x in range(w):
            blk = a[y * f:(y + 1) * f, x * f:(x + 1) * f].reshape(-1, 4)
            fg = blk[blk[:, 3] > 0]
            if len(fg) * 2 >= len(blk):
                vals, cnt = np.unique(fg[:, :3], axis=0, return_counts=True)
                out[y, x, :3] = vals[cnt.argmax()]
                out[y, x, 3] = 255
    img = Image.fromarray(out, 'RGBA')
    bb = img.getchannel('A').getbbox()
    return img.crop(bb) if bb else img


def main():
    os.makedirs(OUT, exist_ok=True)
    scans = {s: components(s) for s in sorted({v[0] for v in CUTS.values()})}
    for name, (sheet, idx, f) in CUTS.items():
        im, fg, lab, boxes = scans[sheet]
        shrink(crop(im, fg, lab, boxes[idx], sheet == 'ixzlDW'), f).save(os.path.join(OUT, name + '.png'))
    print(f'{len(CUTS)} sprites -> {OUT}')


if __name__ == '__main__':
    main()
