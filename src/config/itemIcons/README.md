# Item icon registry

One JSON file per equipment slot (and per weapon type under `mainHand` / `offHand`), **one line per icon**. Read by `src/config/pixelIcons.ts` (sizes, paths) and by the build (`scripts/pixel/item_registry.py`, checked at the start of `python scripts/pixel/build.py`). `tests/catalog/itemIcons.test.ts` guards the rest.

```json
{"icon": "art_wanderer_boots", "item": "wanderer_boots", "file": "feet/wanderer_boots", "slot": "feet", "weapon": null, "grade": "G1", "provenance": "Sprite Fusion prompt 'boots G1', batch 3"}
```

| Field | Meaning |
|---|---|
| `icon` | the name the catalog uses (`ItemDef.icon`). `art_<id>` = supplied 64 px art, `item_<id>` = a 40 px icon the build draws |
| `item` | the catalog item that uses it, or `null` while the art has no item yet |
| `file` | supplied art: path under `public/pixel/items/` without `.png`. `null` = built by `scripts/pixel/sprites_gear.py` into `public/pixel/icons/` |
| `slot`, `weapon` | the equipment slot and weapon type (`WeaponType`); they pick the file this line lives in (`feet.json`, `mainHand-sword.json`) |
| `grade` | `G1`-`G9` or `S1`-`S3` ([equip README](../../../art_style_reference/equip/README.md) section 3); `null` until the item is graded |
| `provenance` | where the picture came from: sheet and region, or Sprite Fusion prompt (art README rules 5 and 8) |

**Adding an icon = one line in the file of its family.** PRs for different families (for example sword vs. boots) touch different files, so they do not conflict. A new slot or weapon type is a new file plus one import in `index.ts`. A file in `public/pixel/items/` that is not registered fails the test; spare art is named `_<name>.png`. `python scripts/pixel/item_registry.py --provenance` prints the lines for the Provenance section of `art_style_reference/equip/README.md`.
