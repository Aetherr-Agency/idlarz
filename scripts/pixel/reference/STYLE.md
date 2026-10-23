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

## UI kit (windows, dialogs, tooltips, HUD widgets) - approved 2026-10-23
Reference images: `approved-v3-set.png` (all 20 icons incl. equipment + merchant portrait),
`approved-ui-kit.png` (HP/MP flasks + XP medallion art), `approved-v3-fog.png` (current fine fog tile).

- **Font**: Pixelify Sans (self-hosted via `@fontsource-variable/pixelify-sans`, CSS var `--font-pixel`). The Tailwind
  text scale is nudged up one notch in `globals.css` (`@theme`) because the font reads small. Never use sub-12px text.
- **Modal shell** (`PixelModal.tsx`): one bronze 9-slice frame (`public/pixel/ui/frame_modal.png`, 12px slice drawn at 2x)
  over the cracked-stone tile, ornamented title bar, red pixel close button hanging off the corner, Esc/backdrop to
  dismiss. Backdrop sits *under* the header (z-45) so resources stay visible. Sizes: `sm` 440 (confirmations),
  `md` 760 (pickers), `lg` 1080 x full height (Character, Statistics, Merchant, Farm). Do not hand-roll new modals.
- **Panels/cards**: `.px-panel` / `.px-card` (9-slice `frame_panel.png`), headings `.px-h` (gold, uppercase, rule).
- **Buttons/tabs/inputs**: `.px-btn` (+ `-gold/-red/-blue/-gray/-sm`) with stepped corners and a 2px pixel bevel,
  `.px-tab`, `.px-range` (square thumb), `.px-input`. Palette: parchment text `#d8c8a0`, muted `#a89878`, gold `#f0d27a`.
- **Tooltips/toasts**: `.px-tooltip` / `.px-toast` (gold 9-slice `frame_tip.png`), `.px-tip-title`, `.px-tip-muted`.
  Every hover card uses it. Resource icons inside UI text use `ResourceIcon` (20px) rather than emoji.
  Map glyphs (biome/castle emojis) are intentionally still emoji.
- **HP/MP flasks**: glass overlay + mask PNG with CSS liquid (`--p` fill, hard-stop pixel bands, rippling surface,
  rising bubbles). Always an integer scale (`--s`).
- **XP medallion**: bronze ring + 40-segment band; progress is a conic-gradient mask over `medal_fill.png`.
- **Equipment slots**: 8 icons `equip_*` (head kettle hat, neck amulet, chest cuirass, main-hand sword, off-hand round
  shield, legs greaves, feet boots, ring) in the 48px slot frame; empty = dim grayscale silhouette, filled = glow frame.
- **Fog of war**: fine 128px seamless mist tiles (`fog_c`/`fog_d`) at 1x/1.5x, two layers drifting in opposite directions
  and breathing; unexplored tiles are transparent. Drift distance must equal one tile period.
- **Motion rules**: transform/opacity only; integer pixel scales; honour `prefers-reduced-motion`.
- **Tile tap feedback**: cursor popup (lines per resource, lucky header), tile pulse on the *inner* element (the outer
  one carries the grid translate), darkening cooldown overlay.

Generators: `ui_art.py` + `generate_ui.py` (frames, flasks, medallion -> `public/pixel/ui/`), `icons5.py` (equipment +
merchant portrait), `fog.py` (fine fog via `fine=True`). Re-run `generate_v3.py` and `generate_ui.py` after edits.


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
