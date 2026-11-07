"""Sprites of the dev biomes (terrain_dev.py): jungle, fields, orchard, blight and the small drawn Battlefield pieces.
Same rules as terrain_props.py: 1 px outline in a darker tone of the sprite's own colour, light from the top left, no ground shadows."""
from math import cos, sin, pi
from PIL import Image
import terrain_props as P
from terrain_props import _sprite, _outline, _disc, _line, _put, oak
from common import hexc as C
from terrain_field import hash32

# ------------------------------------------------------------------ palettes (the five tones oak() and tree_shape() read)
JUNGLE = dict(outline='#07302c', dark='#0f4a44', mid='#1a7a68', light='#38b090', hi='#7ee8c0')
APPLE = dict(outline='#1c4a1c', dark='#3a7a2a', mid='#52a03a', light='#78c254', hi='#a4e078')
CHERRY = dict(outline='#6a2a4a', dark='#c4708e', mid='#e49ab4', light='#f6c0d2', hi='#fff0f4')
WHITE = dict(outline='#4a6a4a', dark='#8ab070', mid='#c4dcb0', light='#eaf4e0', hi='#ffffff')
PEACH = dict(outline='#8a4a3a', dark='#e08a6a', mid='#f4b090', light='#fcd4b8', hi='#fff0e4')
LILAC = dict(outline='#5a3a7a', dark='#a080c8', mid='#c8a8e8', light='#e4d0f8', hi='#fff4ff')


def _rows(*rows):
    w = max(len(r) for r in rows)
    return [r.ljust(w, '.') for r in rows]


def _bare(rows, colors):
    return P._bare(_rows(*rows), colors)


def canvas(w, h):
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    return img, img.load()


# ------------------------------------------------------------------ trees of any shape
def _canopy(px, w, h, cx, cy, lumps, pal, seed, s=1.0):
    mid, dark, light, hi = C(pal['mid']), C(pal['dark']), C(pal['light']), C(pal['hi'])
    for lx, ly, r in lumps:
        rr = max(3, int(r * s))

        def pick(dx, dy, d, rr=rr, lx=lx, ly=ly):
            t = (dx + dy) / (2.0 * rr)
            n = hash32(dx + lx * 3, dy + ly * 5, seed + 11) % 11
            if t > 0.32 and d > 0.45:
                return dark if n else mid
            if t < -0.3 and d < 0.85:
                return hi if n < 2 else light
            return light if n == 0 else dark if n == 1 and t > -0.1 else mid
        _disc(px, w, h, cx + int(lx * s), cy + int(ly * s), rr, rr, pick)


def _trunk(px, w, h, cx, y0, y1, wd):
    for y in range(y0, y1):
        for x in range(cx - wd // 2, cx - wd // 2 + wd):
            _put(px, w, h, x, y, C(P.TRUNK_D if x >= cx - wd // 2 + wd - 1 and wd > 1 else P.TRUNK))
    _put(px, w, h, cx - wd // 2 - 1, y1 - 1, C(P.TRUNK_D))
    _put(px, w, h, cx - wd // 2 + wd, y1 - 1, C(P.TRUNK_D))


# kind: (w, h, canopy centre y, trunk top y, trunk width, lumps)
SHAPES = {
    'round':    (40, 44, 18, 28, 4, [(0, -11, 9), (-8, -6, 8), (8, -6, 8), (0, -3, 11), (-9, 2, 7), (9, 2, 7), (0, 4, 8)]),
    'tall':     (26, 50, 20, 34, 3, [(0, -15, 6), (-3, -10, 7), (3, -9, 7), (0, -3, 9), (-2, 3, 8), (3, 5, 7)]),
    'umbrella': (50, 44, 15, 20, 4, [(-15, -1, 7), (-8, -6, 8), (2, -9, 9), (11, -6, 8), (16, 0, 7), (0, 0, 10), (-6, 3, 7), (8, 3, 7)]),
    'cone':     (26, 46, 21, 36, 3, [(0, -17, 4), (0, -12, 6), (0, -6, 8), (0, 1, 10), (0, 7, 9)]),
    'weeping':  (42, 48, 17, 30, 4, [(0, -11, 9), (-9, -5, 8), (9, -5, 8), (0, -2, 11), (-11, 3, 6), (11, 3, 6)]),
    'gnarled':  (42, 44, 17, 24, 6, [(-10, -4, 9), (9, -7, 9), (0, -12, 8), (0, 1, 9), (-12, 4, 6), (12, 3, 6)]),
    'sapling':  (18, 26, 9, 14, 2, [(0, -2, 6), (-3, 2, 4), (3, 2, 4)]),
}


def tree_shape(kind, seed, pal, dots=(), scale=1.0):
    w, h, cy, ty, tw, lumps = SHAPES[kind]
    img, px = canvas(w, h)
    cx = w // 2
    _trunk(px, w, h, cx, ty, h - 2, tw)
    if kind == 'gnarled':                                      # a limb reaching into the canopy
        _line(px, w, h, cx, ty + 2, cx - 8, ty - 6, C(P.TRUNK_D), 2)
        _line(px, w, h, cx, ty + 4, cx + 8, ty - 4, C(P.TRUNK_D), 2)
    if kind == 'umbrella':                                     # a forked trunk under the flat canopy
        _line(px, w, h, cx, ty + 2, cx - 9, ty - 4, C(P.TRUNK), 2)
        _line(px, w, h, cx, ty + 2, cx + 9, ty - 4, C(P.TRUNK_D), 2)
    _canopy(px, w, h, cx, cy, lumps, pal, seed, scale)
    if kind == 'weeping':                                      # hanging strands under the canopy
        for x in range(cx - 13, cx + 14, 3):
            top = next((y for y in range(h - 2, cy, -1) if px[x, y][3]), None)
            if top is None:
                continue
            for k in range(4 + hash32(x, 0, seed) % 5):
                _put(px, w, h, x, top + 1 + k, C(pal['light']) if k % 2 == 0 else C(pal['mid']))
    if dots:
        for y in range(h):
            for x in range(w):
                if px[x, y][3] and px[x, y][:3] in (C(pal['mid'])[:3], C(pal['light'])[:3]) and hash32(x, y, seed + 71) % 8 == 0:
                    px[x, y] = C(dots[hash32(x, y, 5) % len(dots)])
    return _outline(img, pal['outline'])


# ------------------------------------------------------------------ jungle
def jungle_tree(seed):
    img = oak(seed, 1.15 if seed % 2 else 1.0, JUNGLE)
    px = img.load()
    for y in range(8, img.size[1] - 12):                       # hanging vines under the canopy
        for x in range(img.size[0]):
            if px[x, y][3] == 0 and hash32(x, 0, seed + 3) % 7 == 0 and px[x, y - 1][3]:
                for k in range(3 + hash32(x, 1, seed) % 3):
                    if y + k < img.size[1] and px[x, y + k][3] == 0:
                        px[x, y + k] = C('#2a9a7a') if k % 2 == 0 else C('#126a52')
    return img


def _frond(px, w, h, x, y, ang, length, droop, col, hi):
    for i in range(int(length * 2)):
        t = i / (length * 2)
        fx = x + cos(ang) * length * t
        fy = y + sin(ang) * length * t + droop * t * t * length
        _put(px, w, h, round(fx), round(fy), C(hi if t < 0.55 and sin(ang) < 0.3 else col))
        if t < 0.5:
            _put(px, w, h, round(fx), round(fy) + 1, C(col))


def jungle_palm(seed):
    w, h = 34, 44
    img, px = canvas(w, h)
    lean = (seed % 3 - 1) * 3
    tx, ty = 17 + lean, 14
    for y in range(ty, h - 2):                                 # a slightly bent, ringed trunk
        t = (y - ty) / (h - 2 - ty)
        x = round(tx - lean * t + sin(t * 3) * 1.5)
        for k in range(2):
            _put(px, w, h, x + k, y, C('#8a6a44' if k == 0 else '#5e4630'))
        if y % 4 == 0:
            _put(px, w, h, x, y, C('#6a4e32'))
    for a in (-170, -145, -115, -65, -35, -10):
        _frond(px, w, h, tx, ty, a * pi / 180, 13, 0.9, '#1f9a78', '#7ae8c0')
    _put(px, w, h, tx - 1, ty + 1, C('#8a5a30'))
    _put(px, w, h, tx + 1, ty + 1, C('#8a5a30'))
    return _outline(img, '#07302c')


def tree_fern():
    w, h = 26, 26
    img, px = canvas(w, h)
    for y in range(10, h - 2):
        for x in (12, 13):
            _put(px, w, h, x, y, C('#6a4a32' if x == 12 else '#4a3220'))
    for a in (-175, -150, -120, -90, -60, -30, -5):
        _frond(px, w, h, 13, 9, a * pi / 180, 10, 0.5, '#26a07a', '#6ae8b4')
    return _outline(img, '#07302c')


def bamboo(seed):
    w, h = 22, 34
    img, px = canvas(w, h)
    for i, (sx, sh) in enumerate([(5, 24 + seed * 3), (10, 31), (15, 22 + seed * 2), (8, 17), (13, 15)]):
        for y in range(h - 2 - sh, h - 2):
            _put(px, w, h, sx, y, C('#86c860'))
            _put(px, w, h, sx + 1, y, C('#4e8e3c'))
            if (h - 2 - y) % 6 == 0:
                _put(px, w, h, sx, y, C('#3a6e2c'))
                _put(px, w, h, sx + 1, y, C('#3a6e2c'))
        top = h - 2 - sh
        for k, (dx, dy) in enumerate(((-3, 1), (3, 0), (-2, 3), (4, 2))):
            _line(px, w, h, sx, top + 2, sx + dx, top + dy, C('#5ab850'))
    return _outline(img, '#1c4a20')


def banyan():
    w, h = 50, 46
    img, px = canvas(w, h)
    cx = w // 2
    for rx in (-15, -8, 8, 15):                                # aerial roots dropping from the canopy
        for y in range(22, h - 2):
            _put(px, w, h, cx + rx + (1 if y % 7 < 3 else 0), y, C('#7a5a3a'))
            _put(px, w, h, cx + rx + 1 + (1 if y % 7 < 3 else 0), y, C('#4e3622'))
    _trunk(px, w, h, cx, 20, h - 2, 5)
    _canopy(px, w, h, cx, 14, [(-17, 1, 8), (-9, -6, 9), (0, -9, 10), (10, -6, 9), (17, 1, 8), (0, 0, 11), (-8, 4, 7), (9, 4, 7)], JUNGLE, 9)
    return _outline(img, JUNGLE['outline'])


def banana():
    return _sprite(_rows('l....ll....l.', 'll..lmml..ll..', 'mml.lmmml.lmm.', '.mmllmmmmlmm..', '..mmmmmmmmm...', '...mmmdmmm....', '....mmsmm.....', '.....sds......', '.....sss......'),
                   dict(l='#7af0b8', m='#26a07a', d='#126a52', s='#9a7a44'), '#07302c')


def fern_giant():
    return _sprite(_rows('...g.....g.....', '.g..gg.g.gg..g.', '..gg.ggggg.gg..', 'g.ggggggggggg.g', '.ggghgdgdghgg..', '..gg..ddd..gg..', '......ddd......'),
                   dict(g='#26a07a', h='#7ae8c0', d='#126a52'), '#07302c')


def orchid_bush():
    return _sprite(_rows('..lll.p...', '.lmmlppl..', 'lmmmmmlp.p', 'mmpmmmmmmp', 'mmmmdmmmdd', '.dddddddd.'), dict(l='#38b090', m='#1a7a68', d='#0f4a44', p='#e08ad0'), '#07302c')


def hardwood_log():
    return _sprite(['.bbbbbbbbbbb.', 'rrbbbbbbbbbbb', 'rlrbdddddddb.', '.rrbbbbbbbbb.'], dict(b='#7a3a2a', d='#562618', r='#d8b090', l='#7a3a2a'), '#2c1008')


def roots(kind):
    w, h = 30, 12
    img, px = canvas(w, h)
    cx, cy = 15, 4
    for i in range(6 + kind * 2):
        ang = (i / (6 + kind * 2)) * pi + (hash32(i, kind, 5) % 5 - 2) * 0.12 - pi * 1.0
        ang = pi - (i / (5 + kind * 2)) * pi * 1.0
        length = 9 + hash32(i, kind, 3) % 6
        for step in range(length):
            t = step / length
            x = cx + cos(ang) * step * 1.4 + sin(step * 0.6 + i) * 0.6
            y = cy + sin(ang) * step * 0.45 + step * 0.15 + 2 * t
            for k in range(2 if t < 0.5 else 1):
                _put(px, w, h, round(x), round(y) + k, C('#a88050') if k == 0 else C('#6a4a2a'))
    for x, y in ((14, 3), (17, 4), (12, 5)):
        _put(px, w, h, x, y, C('#3e9a60'))
    return _outline(img, '#2e1e12')


def bird_of_paradise():
    return _sprite(_rows('....oo.....', '...oooo.bb.', '..ooyoo.bbb', '...ooo.bb..', '....g..b...', '..g.g.g....', '...ggg.....', '....g......'),
                   dict(o='#f08a2a', y='#ffd84a', b='#4a7ae8', g='#26a07a'), '#5a2a10')


def hibiscus():
    return _sprite(_rows('..rr.....', '.rrrr.lll', 'lrykrllml', 'mlrrlmmmm', 'mmmmmmdmd', '.dddddd..'), dict(r='#e83a4a', y='#ffd84a', k='#a82030', l='#38b090', m='#1a7a68', d='#0f4a44'), '#07302c')


def orchid_tall():
    return _sprite(_rows('.p...', 'pwp..', '.p.p.', '..pwp', '.p.p.', '..g..', '..g..', '.gg..', '..g..'), dict(p='#e870d0', w='#fff0fa', g='#26a07a'), '#4a1a44')


def giant_lily():
    return _sprite(_rows('...pp.pp...', '..ppwpwpp..', '.ggpppppgg.', 'gggggyggggg', '.ggggggggg.'), dict(p='#f08ac8', w='#fff0fa', y='#ffe060', g='#26a07a'), '#07302c')


def exotic_tiny(kind=0):
    petal = ['#e83a4a', '#f08a2a', '#e870d0', '#ffd84a'][kind]
    return _bare(['.p.', 'php', '.g.'], dict(p=petal, h='#fff0a0', g='#26a07a'))


def leaf_litter():
    return _bare(['gg.g', '.gg.'], dict(g='#0c2e22'))


# ------------------------------------------------------------------ fields
def scarecrow():
    return _sprite(_rows('....bbb......', '...bbbbb.....', '....fff......', '....fkf......', 'wwwwrrrwwwww.', '..y.rrr.y....', '....rrr......', '....rrr......', '.....w.......', '.....w.......', '.....w.......', '.....w.......'),
                   dict(b='#7a5030', f='#e8c08a', k='#3a2a1a', w='#8a6a3a', r='#b8483a', y='#e8c050'), '#3c2a16')


def scarecrow_flipped():
    return scarecrow().transpose(Image.FLIP_LEFT_RIGHT)


def haystack():
    return _sprite(_rows('....yyyyyy....', '..yyyyyyyyyy..', '.yyyhyyyyhyyy.', 'yyyyyyyyyyyyyy', 'yhyyyyyhyyyyhy', 'dyyyyyyyyyyyyd', 'ddyyyyyyyyyydd', '.dddddddddddd.'),
                   dict(y='#e0b84a', h='#f4dc80', d='#b48a30'), '#6a4a1a')


def hay_bale():
    return _sprite(_rows('.yyyyyyyy.', 'yhyhyyyyhy', 'yyyyyyyyyy', 'ydddddddyy', '.dddddddd.'), dict(y='#e0b84a', h='#f4dc80', d='#b48a30'), '#6a4a1a')


def wheat():
    return _sprite(_rows('.y..y..y.', 'yhy.yhy.y', '.y..y..yh', '.g.yg.yg.', '.g..g..g.', 'gg.ggg.gg'), dict(y='#e8c24a', h='#fbe890', g='#7a9a3a'), '#8a6a20')


def fence_broken(grey=False):
    wood, dark = ('#8a8070', '#5e564a') if grey else ('#9a7040', '#6a4a28')
    return _sprite(_rows('w.......w..w', 'w.rrrrr.w..w', 'w.......w..w', 'w.rrrr..w.rw', 'wd......wd.w', 'ww......ww.w'), dict(w=wood, r=wood, d=dark), '#2c2014')


def barn_ruin():
    return _sprite(_rows('....rrrrrrrr....', '..rrrrrrrrrrrr..', '.rrrrk.rrrrrrrr.', 'rrrrkk..rrrrrrrr', 'wwwwwwwwwwwwwwww', 'wdwwdwwdwwdwwdww', 'wdwwdwkkkkdwwdw.', 'wdwwdwkkkkdwwd..', 'wdwwdwkkkkdwdd..'),
                   dict(r='#a8483a', k='#2a1a14', w='#c8805a', d='#8a5030'), '#3a1a10')


def hedge():
    return _sprite(_rows('..lll.lll...', '.lmmmlmmml..', 'lmmmmmmmmml.', 'mmmdmmmmdmmm', '.dddddddddd.'), dict(l='#7ac058', m='#4a9a3a', d='#2e7a2c'), '#1e4a1c')


def windmill():
    w, h = 40, 46
    img, px = canvas(w, h)
    cx = 20
    for y in range(16, h - 2):                                 # tapering plastered tower
        half = 6 + (y - 16) // 5
        for x in range(cx - half, cx + half + 1):
            shade = x > cx + half // 2
            _put(px, w, h, x, y, C('#b8a888' if shade else '#e8dcc0'))
        if (y - 16) % 6 == 5:
            for x in range(cx - half, cx + half + 1):
                _put(px, w, h, x, y, C('#a09070'))
    for y in range(h - 9, h - 2):                              # door
        for x in range(cx - 2, cx + 3):
            _put(px, w, h, x, y, C('#6a4a2a'))
    for y in range(8, 17):                                     # red cap
        half = max(0, (y - 8) * 8 // 9 + 1)
        for x in range(cx - half, cx + half + 1):
            _put(px, w, h, x, y, C('#b8483a' if x <= cx + 2 else '#8a3028'))
    for ang in (45, 135, 225, 315):                            # sails
        a = ang * pi / 180
        for t in range(2, 15):
            sx, sy = cx + cos(a) * t, 12 + sin(a) * t
            _put(px, w, h, round(sx), round(sy), C('#9a7448'))
            if t > 5:
                _put(px, w, h, round(sx + cos(a + pi / 2) * 2), round(sy + sin(a + pi / 2) * 2), C('#f0e6d0'))
                _put(px, w, h, round(sx + cos(a + pi / 2)), round(sy + sin(a + pi / 2)), C('#e0d4b8'))
    _put(px, w, h, cx, 12, C('#4a3220'))
    return _outline(img, '#3a2a1a')


def hay_cart():
    return _sprite(_rows('...yyyyyyyyyy.......', '..yhyyyyhyyyyy......', '.yyyyyyyyyyyyyy.....', 'bbbbbbbbbbbbbbbb.pp.', 'bddddddddddddddb.p..', '.bbbbbbbbbbbbbb.p...',
                         '..kkk......kkk.p....', '.kkwkk....kkwkk.....', '..kkk......kkk......'),
                   dict(y='#e0b84a', h='#f4dc80', b='#a07848', d='#6e4e2e', k='#4a3a2a', w='#c8a878', p='#8a6a3a'), '#2a1e10')


def wheelbarrow():
    return _sprite(_rows('..bbbbbbb.....', '.bddddddb.p..', 'bbbbbbbbb.p..', '.bbbbbbb.p...', '...kkk.p.....', '..kwwk.......', '...kkk.......'),
                   dict(b='#a07848', d='#6e4e2e', k='#4a3a2a', w='#c8a878', p='#8a6a3a'), '#2a1e10')


def sacks():
    return _sprite(_rows('..t.....t..', '.sss...sss.', 'sssss.sssss', 'sdsss.ssdss', 'sssssssssss', '.ddddddddd.'), dict(s='#d8c89a', d='#a89868', t='#8a6a3a'), '#4a3c20')


def barrel():
    return _sprite(_rows('.bbbbb.', 'hhhhhhh', 'bbbbbbd', 'bbbbbbd', 'hhhhhhh', '.bddbd.'), dict(b='#a07848', d='#6e4e2e', h='#6a6a70'), '#2a1e10')


def farm_well():
    return _sprite(_rows('..rrrrrrrr..', '.rrrrrrrrrr.', '..p......p..', '..p..bb..p..', '..p..bb..p..', '.gggggggggg.', 'gsgsgsgsgsgs', 'gggggggggggg'),
                   dict(r='#b8483a', p='#8a6a3a', b='#6e4e2e', g='#a8a49a', s='#7a766c'), '#3a2a1a')


def trough():
    return _sprite(_rows('wwwwwwwwwwww', 'wbbbbbbbbbbw', 'wbbbbbbbbbbw', '.wwwwwwwwww.', '.w........w.'), dict(w='#a07848', b='#4a8ac8'), '#2a1e10')


def hen():
    return _bare(['..r..', '.www.', 'wwwwy', '.ww..', '.o.o.'], dict(r='#d6432e', w='#f4f0e6', y='#f0b030', o='#d8903a'))


def poppy():
    return _bare(['.r.', 'rkr', '.g.', '.g.'], dict(r='#d6432e', k='#2a1a14', g='#6a8a30'))


def cornflower():
    return _bare(['.b.', 'bpb', '.g.', '.g.'], dict(b='#6a8ae8', p='#f4f0d8', g='#6a8a30'))


# ------------------------------------------------------------------ orchard
def beehive():
    return _sprite(_rows('...yyyy...', '..yyhyyy..', '.dddddddd.', '..yyyyhy..', '.dddddddd.', '..yyyyyy..', '.dddddddd.', '...w..w...', '...w..w...'),
                   dict(y='#f0c040', h='#fff0a0', d='#c08a20', w='#8a6a3a'), '#5a3a10')


def flower_bed():
    return _sprite(_rows('.gpgwgygpg.', 'gpgwgygpgwg', 'gwgygpgwgyg', '.ggggggggg.'), dict(g='#4a9a3a', p='#f08aaa', w='#fff6f0', y='#f4d84a'), '#2a5a22')


def tulips():
    return _sprite(_rows('r.y.p.r.y', 'rry.pp.rr', '.g.g.g.g.', '.g.g.g.g.', 'ggggggggg'), dict(r='#e83a4a', y='#f4d84a', p='#f08ac0', g='#4a9a3a'), '#2a5a22')


def daisies():
    return _sprite(_rows('.w..w..w.', 'wyw.wyw.w', '.w.gwg.wy', '.g.g.g.w.', 'gggggggg.'), dict(w='#ffffff', y='#f4d84a', g='#4a9a3a'), '#2a5a22')


def blossom_bush():
    return _sprite(_rows('..lwl....', '.lmmwml..', 'lmwmmmwl.', 'mmmmwmmmd', '.dddddd..'), dict(l='#8cc860', m='#5aa03c', d='#3a7a2a', w='#fff0f6'), '#2a5a22')


def apple_crate():
    return _sprite(_rows('.r.r.r.r.', 'rrrrrrrrr', 'wwwwwwwww', 'wdwdwdwdw', 'wwwwwwwww'), dict(r='#d8402e', w='#b08850', d='#7a5a30'), '#3c2a16')


def ladder():
    return _sprite(_rows('w..w', 'wrrw', 'w..w', 'wrrw', 'w..w', 'wrrw', 'w..w', 'wrrw', 'w..w'), dict(w='#a07848', r='#7a5a30'), '#3c2a16')


def picket():
    return _sprite(_rows('w.w.w.w.w.w', 'wwwwwwwwwww', 'w.w.w.w.w.w', 'wwwwwwwwwww', 'w.w.w.w.w.w'), dict(w='#f4f0e6'), '#8a8470')


def petals():
    return _bare(['p.w', '.p.', 'w.p'], dict(p='#f8c8d8', w='#fff0f4'))


def fallen_apple(kind=0):
    return _bare(['.g', 'rr', 'rr'] if kind else ['rr', 'rr'], dict(r='#d8402e', g='#4a9a3a'))


def clover():
    return _bare(['.g.g.', 'gwgwg', '.g.g.'], dict(g='#5aa03c', w='#fff6f0'))


def fallen_branch():
    return _bare(['b.p.b.', '.bbbbbb', 'p.b.p..'], dict(b='#7a5636', p='#f8c8d8'))


# ------------------------------------------------------------------ blight: violet spore wasteland
def spore_shroom(kind):
    w, h = [(18, 18), (24, 26), (32, 36)][kind]
    img, px = canvas(w, h)
    cx = w // 2
    cap_ry, cap_rx = [6, 8, 11][kind], w // 2 - 2
    cap_cy = cap_ry + 1
    sw = [3, 4, 6][kind]
    for y in range(cap_cy, h - 2):
        for x in range(cx - sw // 2, cx - sw // 2 + sw):
            _put(px, w, h, x, y, C('#e6d6f4' if x < cx else '#b49ccc'))
    for dx in (-sw // 2 - 1, sw // 2 + 1):
        _put(px, w, h, cx + dx, h - 3, C('#b49ccc'))

    def pick(dx, dy, d):
        t = (dx + dy) / (cap_rx * 2.0)
        if dy > cap_ry * 0.45:
            return C('#4a2478')
        if t < -0.22 and d < 0.92:
            return C('#e0a0f4')
        if t > 0.28:
            return C('#7a38b0')
        return C('#a858d8')
    _disc(px, w, h, cx, cap_cy, cap_rx, cap_ry, pick)
    for i in range(2 + kind * 2):
        sx = cx - cap_rx // 2 + hash32(i, kind, 7) % max(1, cap_rx)
        sy = cap_cy - 1 - hash32(i, kind, 9) % max(1, cap_ry // 2 + 1)
        _put(px, w, h, sx, sy, C('#ffc8f8'))
        if kind:
            _put(px, w, h, sx + 1, sy, C('#f090e8'))
    return _outline(img, '#2a1048')


def _crystal(px, w, h, bx, by, cw, ch, lean=0):
    for yy in range(ch):
        frac = yy / ch
        half = cw / 2 if frac < 0.68 else cw / 2 * (1 - (frac - 0.68) / 0.32)
        c = bx + lean * frac
        for x in range(round(c - half), round(c + half)):
            rel = (x - (c - half)) / max(1.0, 2 * half)
            col = '#e6baff' if rel < 0.3 else '#b274e6' if rel < 0.62 else '#7a40b8' if rel < 0.88 else '#56288a'
            _put(px, w, h, x, by - yy, C(col))
    _put(px, w, h, round(bx + lean), by - ch, C('#fff0ff'))


def crystals(kind):
    w, h = 30, 28
    img, px = canvas(w, h)
    specs = [[(15, 25, 8, 18, 1), (8, 25, 6, 11, -2), (22, 25, 6, 9, 2)],
             [(12, 25, 7, 14, -1), (20, 25, 8, 20, 1), (5, 25, 5, 8, -2), (26, 25, 4, 7, 1)],
             [(15, 25, 10, 22, 0), (7, 25, 6, 13, -3), (23, 25, 6, 12, 3), (11, 25, 4, 8, -1), (19, 25, 4, 7, 1)]][kind]
    for bx, by, cw, ch, lean in sorted(specs, key=lambda s: s[3]):
        _crystal(px, w, h, bx, by, cw, ch, lean)
    return _outline(img, '#2a1058')


def bramble(seed):
    w, h = 34, 22
    img, px = canvas(w, h)
    arcs = [(4, 17, 9, 0, 22, 12), (14, 18, 17, 2, 30, 9), (24, 18, 28, 4, 12, 8)]
    for i, (x0, y0, cx, cy, x1, y1) in enumerate(arcs):
        n = 30
        for k in range(n + 1):
            t = k / n
            x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1
            y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1
            _put(px, w, h, round(x), round(y), C('#6a38a0'))
            _put(px, w, h, round(x), round(y) + 1, C('#3a1858'))
            if k % 4 == 2:
                _put(px, w, h, round(x), round(y) - 2, C('#f060d8'))
    return _outline(img, '#1c0838')


def tentacle(seed):
    w, h = 20, 32
    img, px = canvas(w, h)
    for step in range(30):
        t = step / 30
        y = h - 3 - step
        x = 10 + sin(t * 5 + seed) * (3 + t * 3) + (t ** 3) * (6 if seed else -6)
        wd = 4 if t < 0.35 else 3 if t < 0.7 else 2
        for k in range(wd):
            _put(px, w, h, round(x) + k - 1, y, C('#c078e0') if k == 0 else C('#8a3ab0') if k < wd - 1 else C('#5a2480'))
        if step % 5 == 3:
            _put(px, w, h, round(x), y, C('#f4d0fa'))
    return _outline(img, '#2a1048')


def pod(kind):
    w, h = [(14, 15), (20, 22)][kind]
    img, px = canvas(w, h)
    cx, cy = w // 2, h // 2 - 1
    rx, ry = w // 2 - 2, h // 2 - 2

    def pick(dx, dy, d):
        if d > 0.8:
            return C('#9a50c8')
        if dx + dy < -rx * 0.5 and d < 0.7:
            return C('#f0d0fa')
        if dx * 0.6 - dy * 0.4 > rx * 0.1 and d < 0.55:
            return C('#6a2290')                                 # the shape curled up inside
        return C('#d08ae8')
    _disc(px, w, h, cx, cy, rx, ry, pick)
    _put(px, w, h, cx - rx // 2, cy - ry // 2, C('#ffffff'))
    for dx in (-3, 0, 3):
        _put(px, w, h, cx + dx, h - 2, C('#4a2468'))
        _put(px, w, h, cx + dx + (1 if dx >= 0 else -1), h - 2, C('#4a2468'))
    return _outline(img, '#2a1048')


def twisted_tree(seed):
    w, h = 38, 46
    img, px = canvas(w, h)
    bark, lit, dark = C('#5a3480'), C('#8a5ab8'), C('#341a52')

    def branch(x, y, ang, length, thick, depth):
        x1, y1 = x + cos(ang) * length, y + sin(ang) * length
        for k in range(thick):
            _line(px, w, h, x + k, y, x1 + k, y1, lit if k == 0 and thick > 1 else bark if k < thick - 1 or thick == 1 else dark)
        if depth > 0 and length > 4:
            r = hash32(int(x), int(y), seed + depth)
            branch(x1, y1, ang - 0.6 - (r % 3) * 0.14, length * 0.72, max(1, thick - 1), depth - 1)
            branch(x1, y1, ang + 0.55 + (r // 3 % 3) * 0.14, length * 0.66, max(1, thick - 1), depth - 1)
        elif length <= 6:                                     # a glowing crystal at the tip
            _put(px, w, h, round(x1), round(y1), C('#f0b8ff'))
            _put(px, w, h, round(x1), round(y1) - 1, C('#ffffff'))
    branch(18, h - 3, -pi / 2 + (seed % 3 - 1) * 0.15, 17, 4, 3)
    for dx in (-4, -3, 3, 4):
        _put(px, w, h, 18 + dx, h - 3, dark)
    return _outline(img, '#1c0838')


def glow_spore():
    return _bare(['.w.', 'wpw', '.w.'], dict(w='#fff0ff', p='#e890f0'))


def mini_shroom(kind):
    cap = ['#c070e0', '#e890f0'][kind]
    return _bare(['.cc.', 'cccc', '.s..', '.s..'], dict(c=cap, s='#e6d6f4'))


def shard():
    return _bare(['.l.', 'lml', 'lmd', 'mmd'], dict(l='#e6baff', m='#b274e6', d='#7a40b8'))


# ------------------------------------------------------------------ battlefield (drawn pieces; the rest are cuts)
def sword_in_ground():
    return _sprite(_rows('...s...', '...s...', '...s...', '...s...', '...s...', '...s...', '...s...', '..ggg..', '...h...', '...h...', '...d...'), dict(s='#d0d4d8', g='#b89a48', h='#6a4a2a', d='#4a3a2a'), '#34383e')


def banner():
    return _sprite(_rows('wwwwwwww.......', 'wrrrrrrrrr.....', 'wrrrgrrrrrrr..', 'wrrgggrrrrrrr.', 'wrrrgrrrrrrr..', 'wrrrrrrrr.rr..', 'wrrrrrr...rr..', 'wrrrr.....r...', 'wrr...........',
                          'w.............', 'w.............', 'w.............', 'w.............', 'w.............', 'w.............', 'w.............', 'w.............', 'w.............', 'w.............', 'w.............'),
                   dict(w='#6a4a2a', r='#9a2a2a', g='#d8b048'), '#2a1010')


def spear():
    return _sprite(_rows('..s..', '.sss.', '..h..', '..h..', '..h..', '..h..', '..h..', '..h..', '..h..', '..h..', '..h..', '..h..'), dict(s='#d0d4d8', h='#7a5a38'), '#34383e')


def broken_cart():
    return _sprite(_rows('..bbbbbbbb......', '.bddddddddb.....', 'bbbbbbbbbbbb.rr.', 'bdddddddddbrkkr.', '.bbbbbbbbb.rkkkr', '..w.....w..rkkr.', '.wkw...wkw..rr..', '..w.....w.......'),
                   dict(b='#8a7060', d='#5e4a3c', w='#6a5444', k='#3a2c24', r='#8a7060'), '#2a1e16')


def crater():
    return _bare(['..dddddd..', '.dkkkkkkd.', 'dkkkkkkkkd', '.dkkkkkkd.', '..dddddd..'], dict(d='#8a7a62', k='#2e2620'))
