"""Biome edge-blend masks + a mock-map preview that composes them exactly like the game does.

A tile that borders a different ground draws a strip of the NEIGHBOUR's own ground texture through one of these
masks (CSS mask-image over a background-image). The mask is white where the neighbour "invades": ordered-dither
coverage that is 50% at the seam and fades to nothing ~8 art px in, so two meeting biomes interleave pixel by pixel.
Edge depth is jittered along the seam so it never reads as a ruler line.

Pieces: n/e/s/w = neighbour on that side differs; ne/se/sw/nw = only the diagonal neighbour differs (inner corner).
VARIANTS jitter patterns exist so long borders don't repeat; the game picks one per seam from the seam coordinates.
"""
import random
from PIL import Image
from common import hexc as C
from fog import tnoise, BAYER
import ground_art

S = 24            # art px per tile edge (a tile is shown at 2x = 48px)
DEPTH = 8         # art px the blend reaches into the tile
VARIANTS = 3
EDGES = ('n', 'e', 's', 'w')
CORNERS = ('ne', 'se', 'sw', 'nw')
PIECES = EDGES + CORNERS


def _threshold(x, y, rnd_seed):
    """Bayer with a little noise so the dither doesn't read as crosshatch."""
    r = random.Random(x * 7349 + y * 1913 + rnd_seed * 104729).random()
    return 0.72 * (BAYER[y % 4][x % 4] + 0.5) / 16.0 + 0.28 * r


def mask(piece, variant=0, depth=DEPTH, cell=2):
    """24x24 alpha mask (white = neighbour shows through). The dither works on cell x cell blocks so the
    transition reads as chunky pixel-art clumps instead of single-pixel noise."""
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    px = img.load()
    seed = 31 + variant * 17 + (EDGES.index(piece) if piece in EDGES else 5 + CORNERS.index(piece))
    h = (cell - 1) / 2.0
    for y in range(S):
        for x in range(S):
            qx, qy = x // cell, y // cell                      # block coords
            mx, my = qx * cell + h, qy * cell + h              # block centre in px
            if piece in EDGES:
                d, along = {'n': (my, mx), 's': (S - 1 - my, mx), 'w': (mx, my), 'e': (S - 1 - mx, my)}[piece]
                # the seam shifts toward one side on n/w and the opposite on s/e, so the two tiles sharing it agree
                jit = round((tnoise(int(along) // cell * cell, 0, S, 4, seed - (EDGES.index(piece) if piece in EDGES else 0)) - 0.5) * 5)
                eff = d - (jit if piece in ('n', 'w') else -jit)
                f = 0.5 if eff < 0 else 0.5 * (1 - (eff + 0.5) / depth)
            else:
                cx = S if 'e' in piece else 0
                cy = S if 's' in piece else 0
                r = ((mx + 0.5 - cx) ** 2 + (my + 0.5 - cy) ** 2) ** 0.5
                f = 0.5 * (1 - r / (depth * 0.9))
            if f > _threshold(qx, qy, seed):
                px[x, y] = (255, 255, 255, 255)
    return img


def _scaled(piece, variant):
    return mask(piece, variant).resize((S * 2, S * 2), Image.NEAREST)   # 48x48: no browser scaling needed


MASKS = {f'blend_{p}_{v}': (lambda p=p, v=v: _scaled(p, v)) for p in PIECES for v in range(VARIANTS)}


# ------------------------------------------------------------------ mock map (mirrors Tile.tsx / biomeBlend.ts)
OWN = {c: ground_art.GROUNDS[n] for c, n in (
    ('F', 'forest'), ('P', 'plains'), ('H', 'hills'), ('S', 'swamp'), ('T', 'tundra'),
    ('L', 'lake'), ('G', 'grounds'), ('Y', 'yard'), ('C', 'castle'))}

LAYOUT = [
    'FFFPPHHTTT',
    'FFPPPHHTLT',
    'SFPCPYHLLT',
    'SSPPGGHLLT',
    'SSLPGYHHTT',
    'LLLPGGFFFT',
    'LLLLSSFFFF',
]

DIAG = {'ne': (1, -1), 'se': (1, 1), 'sw': (-1, 1), 'nw': (-1, -1)}
SIDE = {'n': (0, -1), 'e': (1, 0), 's': (0, 1), 'w': (-1, 0)}
CORNER_SIDES = {'ne': ('n', 'e'), 'se': ('s', 'e'), 'sw': ('s', 'w'), 'nw': ('n', 'w')}


CURBED = ('Y', 'C')
KIND = {'Y': 'yard', 'C': 'castle'}


def blend_pieces(grid, x, y, rim=None):
    """[(piece, ground)] for tile (x, y); mirrors getBlendPieces in biomeBlend.ts. grid[y][x] is a ground letter,
    or None when not owned. ground is a texture letter ('M' = clouds, only when rim) or 'shore-land' / 'shore-water'
    / 'curb-yard' / 'curb-castle'. Yards and the castle get kerbs instead of blends; lake<->land get a shoreline."""
    h, w = len(grid), len(grid[0])

    def at(cx, cy):
        return grid[cy][cx] if 0 <= cx < w and 0 <= cy < h else None

    def inside(cx, cy):
        return 0 <= cx < w and 0 <= cy < h

    me = grid[y][x]
    out = []
    for p, (dx, dy) in SIDE.items():
        if not inside(x + dx, y + dy):
            continue
        nb = at(x + dx, y + dy)
        if me in CURBED:
            if nb != me:
                out.append((p, 'curb-' + KIND[me]))
        elif nb is None:
            if rim:
                out.append((p, 'M'))
        elif nb != me and nb not in CURBED:
            out.append((p, _pair(me, nb)))
    for p, (dx, dy) in DIAG.items():
        a, b = CORNER_SIDES[p]
        if at(x + SIDE[a][0], y + SIDE[a][1]) != me or at(x + SIDE[b][0], y + SIDE[b][1]) != me:
            continue
        nb = at(x + dx, y + dy)
        if nb is None or nb == me:
            continue
        if me in CURBED:
            out.append((p, 'curb-' + KIND[me]))
        elif nb not in CURBED:
            out.append((p, _pair(me, nb)))
    return out


def _pair(me, nb):
    if (me == 'L') != (nb == 'L'):
        return 'shore-water' if me == 'L' else 'shore-land'
    return nb


def variant_for(x, y, piece):
    """One variant per SEAM so both tiles sharing it pick the same jitter (keyed on the lower/right tile)."""
    if piece == 'n':
        return (x * 7 + y * 13) % VARIANTS
    if piece == 's':
        return (x * 7 + (y + 1) * 13) % VARIANTS
    if piece == 'w':
        return (x * 11 + y * 5) % VARIANTS
    if piece == 'e':
        return ((x + 1) * 11 + y * 5) % VARIANTS
    return (x * 3 + y * 5) % VARIANTS


def _paste_masked(dst, src, m, ox, oy):
    sp, mp, dp = src.load(), m.load(), dst.load()
    for yy in range(src.size[1]):
        for xx in range(src.size[0]):
            if mp[xx, yy][3]:
                dp[ox + xx, oy + yy] = sp[xx, yy]


def mock_map(blend=True, rim=False, k=3):
    """Compose the layout like the game: ground texture per tile, optional edge blends, bevel only where it should be.
    Ring of unexplored (mystery) tiles around the land. k = mock px per art px."""
    rows = len(LAYOUT)
    cols = len(LAYOUT[0])
    land = [[c for c in row] for row in LAYOUT]
    pad = 1
    W, H = cols + 2 * pad, rows + 2 * pad
    owned = [[None] * W for _ in range(H)]
    for y in range(rows):
        for x in range(cols):
            owned[y + pad][x + pad] = land[y][x]
    textures = {c: fn() for c, fn in OWN.items()}
    textures['M'] = ground_art.mystery()
    out = Image.new('RGBA', (W * S, H * S), (8, 10, 24, 255))
    for y in range(H):
        for x in range(W):
            g = owned[y][x]
            tex = textures[g] if g else textures['M']
            out.paste(tex, (x * S, y * S))
    if blend:
        for y in range(H):
            for x in range(W):
                if not owned[y][x]:
                    continue
                for piece, src in blend_pieces(owned, x, y, rim='M' if rim else None):
                    v = variant_for(x, y, piece)
                    if src.startswith(('shore-', 'curb-')):
                        import trim_art
                        key = f'{src}_{piece}_{0 if src.startswith("curb") else v}'
                        trim = trim_art.TRIMS[key]().resize((S, S), Image.NEAREST)
                        out.alpha_composite(trim, (x * S, y * S))
                    else:
                        _paste_masked(out, textures[src], mask(piece, v), x * S, y * S)
    big = out.resize((out.size[0] * k, out.size[1] * k), Image.NEAREST)
    px = big.load()
    t = S * k
    # bevel like .tile-owned: 1px light top-left, dark bottom-right; with blending on it is kept only on land/fog edges
    for y in range(H):
        for x in range(W):
            if not owned[y][x]:
                continue

            def free(cx, cy):
                return not (0 <= cx < W and 0 <= cy < H and owned[cy][cx])

            for i in range(t):
                if not blend or free(x, y - 1):
                    px[x * t + i, y * t] = _mix(px[x * t + i, y * t], (255, 255, 255), 0.14)
                if not blend or free(x - 1, y):
                    px[x * t, y * t + i] = _mix(px[x * t, y * t + i], (255, 255, 255), 0.14)
                if not blend or free(x, y + 1):
                    px[x * t + i, y * t + t - 1] = _mix(px[x * t + i, y * t + t - 1], (0, 0, 0), 0.45)
                if not blend or free(x + 1, y):
                    px[x * t + t - 1, y * t + i] = _mix(px[x * t + t - 1, y * t + i], (0, 0, 0), 0.45)
    return big


def _mix(c, o, a):
    return tuple(int(c[i] * (1 - a) + o[i] * a) for i in range(3)) + (255,)


def preview_sheet(rim=False, k=3):
    a = mock_map(blend=False, rim=False, k=k)
    b = mock_map(blend=True, rim=rim, k=k)
    sheet = Image.new('RGBA', (a.size[0] * 2 + 36, a.size[1] + 24), (22, 16, 14, 255))
    sheet.alpha_composite(a, (12, 12))
    sheet.alpha_composite(b, (a.size[0] + 24, 12))
    return sheet
