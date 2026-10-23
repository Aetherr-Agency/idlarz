# Pixel art style guide (idlarz)

Two references live in this folder. **Match the approved v3 set first; the original sheet explains where the look came from.**

| File | What it is |
|---|---|
| `approved-v3-set.png` | **Current target.** The approved, polished icon set (2026-10-23): contact sheet at 6x + real size. |
| `approved-v3-topbar.png` | The approved icons in the game's top bar (2x) - shows scale, spacing and chrome. |
| `approved-v3-gold-shine.png` | 6-frame sparkle strip for coins (40x40 per frame). |
| `style-reference.png` | The user's original inspiration sheet (ores, gems, ingots, tools). Source of the palette/outline rules. |

## The look
- **Canvas**: 40x40 icons (portrait 40x56, level gem 24x24). Artwork fills ~34-36px. Icons float on transparency -
  **no ground shadows**.
- **Outline**: 1px, *coloured*, never pure black - the darkest hue-shifted tone of the object's own material
  (dark brown on gold/wood, deep indigo on coal, deep violet on the gem). Overlapping pieces get an inner contour.
- **Shading**: 5-tone ramp per material, light from top-left. Shadows shift cool/saturated, highlights warm/pale.
  Cel bands with only a whisper of ordered dither (0.2) - clean, not noisy.
- **Rim light** (polish): silhouette pixels facing the light step up one ramp tone, so lit edges read crisp.
- **Highlights**: crisp specular clusters on metal, gold, gems, coal; chipped-edge catches on stone.
- **Sparkles**: gold coins and gems carry 4-point twinkle glints (white core, pale-yellow arms, 1-3px).
  Ship the animated strip for coins; static icons keep one or two glints.
- **Detail**: every shape has internal detail - coin rings/emblems, bark fissures + growth rings, stone cracks,
  bread scores + flour, plank lines, ermine tails, facets. Silhouettes are chunky, never perfect.
- **Composition**: 1-3 pieces per icon (a pile, a pair, a hero object with chips) to suggest quantity.
- **Palette**: saturated, slightly warm; each material is identifiable by hue alone.

## Approved set (what each icon is)
Resources: gold (coin stacks + standing coin), wood (log pile with end rings), stone (cut blocks), coal (dark chunks,
blue sheen), food (baguette + cross-cut boule), meat (roast drumstick).
Menu (polished pass 2): character = plumed great helm with T-visor, rivets and gold trim; merchant = stitched,
gathered coin pouch with tassels and a coin peeking out; farm = shingled red barn with weathervane and hay bale.
Badges: level = faceted amethyst gem. Portrait: **adventurer** - green feathered cap, red scarf, leather vest over a
linen shirt, pack + bedroll, walking staff (regular guy, not royalty; the earlier crowned lord was rejected).
Chrome (sized to 48px slots): bronze/iron edge with rivets, slot frames (normal + glowing active), XP bar
frame/fill, ornamental divider.

## Backgrounds
- **Header**: dark *cracked stone* tile (`topbar_bg.png`, 96px, seamless) - mottled near-black base, branching
  hairline cracks with a lit lower-right lip. Replaced the earlier brick slabs.
- **Map**: *fog of war* mist (`fog_a.png`, `fog_b.png`, 256px seamless RGBA, alpha-banded + dithered). Two layers drift
  in CSS at different speeds (drift distance must equal one tile period so the loop is seamless); the second layer
  also parallaxes with map dragging. Unexplored tiles are transparent so the mist shows through; no checkerboards.
- Reference: `approved-v3-fog.png`.

## UI conventions (header)
Numbers use fixed-width digit cells (`StableNumber`) so ticking counters never change width. Income popups spawn at the
cursor (portalled to body), animate with transform + opacity only. Sprites display at integer scale with
`image-rendering: pixelated`.

## Don'ts
No black outlines, no ground shadows, no smooth gradients, no AI-looking noise dither, no emoji-style flat icons.
New icons need an approval sample before a full batch is rendered.

## How it is produced
`render3d.py` ray-casts small 3D primitives (box / ellipsoid / cylinder), shades with quantised hue-shifted ramps,
adds cast shadows, contours, rim light and coloured outlines. `fx.py` adds sparkles. Icons are lists of primitives:
- `icons2.py` / `icons2_b.py` - v2 resources and legacy menu icons (still used for wood, stone, coal, meat, gold, pouch).
- `icons3.py` - polished v3 set (bread, gem, sparkle wrappers; its helm/barn/lord are superseded by icons4).
- `icons4.py` - second polish pass: adventurer portrait, helm, pouch, barn (overrides icons3 in `generate_v3.py`).
- `fog.py` - seamless textures: fog-of-war mist and cracked stone. `mockup_v2.py` composes the preview top bar.
- `generate_v3.py` renders everything to `public/pixel/v3/` with `render3d.DEFAULTS` set to rim light + 0.2 dither.
  (`generate_v2.py` keeps the older, un-polished look.)

To add an icon: add materials (5-colour ramp + outline) and a function returning a 40x40 `Scene.render()` in
`icons3.py`, register it in `ICONS`, show the user a sample, then run `python scripts/pixel/generate_v3.py <name>`.
