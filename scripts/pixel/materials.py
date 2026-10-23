"""Every material used by the sprites: a 5-tone ramp (dark -> light, hue-shifted), an outline colour and
shading hints. One place so the whole set stays palette-consistent (see reference/STYLE.md)."""
from render3d import Material

MATS = {
    # --- metals, wood, stone
    'gold': Material(['#4b230d', '#8e4a12', '#cf8a1a', '#f5c640', '#fff3a8'], '#3a1708', spec=0.045, shiny=40, spec_col='#fffbe0'),
    'steel': Material(['#262b3c', '#474f68', '#7480a0', '#aab8d0', '#eaf2fc'], '#1a1d2c', spec=0.045, shiny=28, spec_col='#ffffff', gamma=1.1),
    'bark': Material(['#2b170e', '#52301a', '#7e4c27', '#a8723e', '#cc9a5c'], '#25120a', grain=0.45, grain_scale=3.2),
    'wood_cut': Material(['#8a5426', '#bd8546', '#dfae6e', '#f2d094', '#fdebbf'], '#3b2010', grain=0.1, grain_scale=4),
    'stone': Material(['#33282b', '#625249', '#8f7f70', '#bdae95', '#e6dbbc'], '#2a1d1a', grain=0.3, grain_scale=3.0, spec=0.012, shiny=20, spec_col='#f2edd8', gamma=1.55),
    'coal': Material(['#07060e', '#13112a', '#211f3c', '#33385f', '#7088c8'], '#05040a', grain=0.2, grain_scale=3.0, spec=0.04, shiny=30, spec_col='#d8e8ff', gamma=1.5, gain=0.7),
    'dark': Material(['#050408', '#0a0810', '#120f1c', '#1c1830', '#2a2444'], '#050408'),
    # --- food
    'bread': Material(['#46200a', '#7c3c12', '#b2641e', '#da9038', '#f6c56c'], '#3a1708', grain=0.3, grain_scale=3.0, spec=0.02, shiny=18, spec_col='#ffe6a8'),
    'crumb': Material(['#9a6a2c', '#cf9c52', '#eac27c', '#f8dca4', '#fff2d2'], '#3a1708'),
    'wheat': Material(['#6b4710', '#a97a1a', '#dba824', '#f4d25a', '#fff3ac'], '#47290a', grain=0.1),
    'meat': Material(['#3c0d10', '#7c1e1c', '#b93a26', '#e4693a', '#ffb888'], '#2c0808', spec=0.05, shiny=22, spec_col='#fff0d0'),
    'sear': Material(['#240f08', '#4a2610', '#774016', '#a8632a', '#d48d46'], '#2c0808', spec=0.03, shiny=22, spec_col='#ffe0b0'),
    'bone': Material(['#74644f', '#b0a086', '#d9cbac', '#f0e6cc', '#fffaee'], '#3a2c20'),
    # --- cloth, leather, gems
    'leather': Material(['#2c170c', '#58301a', '#845030', '#ae7a4c', '#d4a672'], '#22110a', grain=0.35, grain_scale=3.5),
    'pleather': Material(['#321809', '#68381a', '#98592a', '#c68a48', '#f0c27c'], '#241006', grain=0.12, grain_scale=3.5, spec=0.02, shiny=14, spec_col='#ffe2a8'),
    'cloth': Material(['#2e0a12', '#6a1620', '#a02a2e', '#cf4a3c', '#f4806a'], '#220810', grain=0.2, grain_scale=4),
    'rope': Material(['#32090a', '#6a1a16', '#a2302a', '#cc5240', '#f08c70'], '#240606'),
    'ruby': Material(['#3a0410', '#7a0e24', '#c0243c', '#ee5a6e', '#ffb8c0'], '#260208', spec=0.06, shiny=20, spec_col='#ffffff'),
    'tunic': Material(['#4a3a24', '#82683c', '#b89658', '#dcc08a', '#f6e6b8'], '#2e2214', grain=0.15, grain_scale=4.0),
    'trouser': Material(['#141824', '#262e46', '#3c4a6c', '#586c94', '#8ea2cc'], '#0c0f18', grain=0.15, grain_scale=4.0),
    'cap': Material(['#0c2012', '#1a4222', '#2c6a38', '#4a9650', '#86cc82'], '#08160c', grain=0.15, grain_scale=4.0),
    # --- people
    'skin': Material(['#5a2a1a', '#9a5638', '#d08a5c', '#eeb88a', '#ffe0bc'], '#3a1a10', gain=1.22),
    'hair': Material(['#201106', '#42260e', '#6c3f18', '#9a6228', '#c98d44'], '#180c04', grain=0.2, grain_scale=4.0),
    'beard': Material(['#3a2e28', '#6a5a4e', '#9c8a78', '#cdbfae', '#f2eadc'], '#2a201a', grain=0.3, grain_scale=4.0),
    # --- barn
    'barn': Material(['#2a0a0c', '#5e1618', '#962422', '#c8402e', '#ec7c58'], '#1e0608', grain=0.15, grain_scale=3.0),
    'slate': Material(['#1c1618', '#382c2e', '#58453f', '#7c6552', '#a8906e'], '#140e10', grain=0.25, grain_scale=3.0, gain=0.8),
    'shingle': Material(['#1e1618', '#3c2c30', '#5c4440', '#82665a', '#b09478'], '#140d0f', grain=0.2, grain_scale=3.0, gain=0.9),
    'cream': Material(['#6a5c4c', '#a89878', '#d4c6a2', '#efe4c4', '#fffaec'], '#3a2c1c'),
    'door': Material(['#1c0f08', '#3a2010', '#5e3a1c', '#85582c', '#ad7e48'], '#140a05', grain=0.3, grain_scale=3.0),
    # --- animals
    'feather': Material(['#6a6a78', '#a8a8b8', '#d4d4de', '#f0f0f6', '#ffffff'], '#3a3a48', grain=0.18, grain_scale=4.0),
    'beak': Material(['#7a3a08', '#b8661a', '#e49a2a', '#f8c850', '#fff0a0'], '#4a2204'),
    'pig': Material(['#8a3a4a', '#c8667a', '#ee94a4', '#ffbcc6', '#ffe4e8'], '#5a1e2c', grain=0.12, grain_scale=4.0),
    'snout': Material(['#7a2e3e', '#b05468', '#d8788c', '#f09aaa', '#ffc4cc'], '#4a1824'),
    'hide': Material(['#7a7480', '#b4aebc', '#dcd6e0', '#f2eef4', '#ffffff'], '#3c3844', grain=0.15, grain_scale=4.0),
    'patch': Material(['#0a0810', '#1c1820', '#34303a', '#524c58', '#78727e'], '#06050a', grain=0.15, grain_scale=4.0),
    'fawn': Material(['#3a2010', '#6a4020', '#98622e', '#c68c4a', '#ecc080'], '#2a1608', grain=0.2, grain_scale=4.0),
    'spots': Material(['#a89878', '#d4c6a2', '#efe4c4', '#fff6dc', '#ffffff'], '#6a5c44'),
}
