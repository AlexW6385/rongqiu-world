# External assets

Every asset the page loads from outside this repository, with its source and licence. Nothing listed here is committed to the repo; all of it is fetched at runtime from a CDN. Only permissive licences (CC0, MIT, OFL or equivalent) are allowed — see `DESIGN.md` §6.

| Asset | Used for | Source | Licence | URL loaded at runtime |
|---|---|---|---|---|
| Oak bark colour + normal (1k) | Tree trunks and branches | Poly Haven, redistributed in the ez-tree package | CC0 | `https://cdn.jsdelivr.net/npm/@dgreenheck/ez-tree@1.1.0/src/lib/assets/bark/oak_color_1k.jpg`, `…/oak_normal_1k.jpg` |
| Oak and ash leaf sprigs | Tree foliage cards and impostors | ez-tree package (Daniel Greenheck) | MIT | `https://cdn.jsdelivr.net/npm/@dgreenheck/ez-tree@1.1.0/src/lib/assets/leaves/oak_color.png`, `…/ash_color.png` |
| Grass and dirt photos | Ground detail textures | ez-tree package | MIT | `https://cdn.jsdelivr.net/npm/@dgreenheck/ez-tree@1.1.0/src/app/public/grass.jpg`, `…/dirt_color.jpg` |
| Scanned rock (`rock1.glb`) | Boulders | ez-tree package | MIT | `https://cdn.jsdelivr.net/npm/@dgreenheck/ez-tree@1.1.0/src/app/public/rock1.glb` |
| three.js r186.1 (WebGPU build, TSL, addons, Draco decoder) | Renderer and loaders | three.js | MIT | `https://cdn.jsdelivr.net/npm/three@0.186.1/` |
| Noto Serif SC, Noto Sans SC | Interface text | Google Fonts | SIL OFL 1.1 | `https://fonts.googleapis.com/css2?family=Noto+Serif+SC…` |

Code influence (not an asset): the recursive tree generator is modelled on [ez-tree](https://github.com/dgreenheck/ez-tree) (MIT).

When adding an asset: add a row here in the same commit, load it from a CDN (jsDelivr for GitHub/npm-hosted files, or the source's own CDN), and keep it within the load budgets in `DESIGN.md` §6.
