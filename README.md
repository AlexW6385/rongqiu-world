# 绒球世界 · Rongqiu World

In the novel 《进化的四十六亿重奏》, the planet where 琳 is born and grows up is called 绒球. This project makes 绒球 a 3D world you can walk into: real scale, seen from the ground, with day and night and the moon.

It is the counterpart of the [重奏展览馆](https://github.com/AlexW6385/4.6-billion-symphony): the exhibition is light and covers the whole book as information; this project covers only 绒球 and aims at realism, detail and visual art. Everything in it is built from a design encyclopedia written from the novel's text; see [`DESIGN.md`](DESIGN.md) for the brief and [`CHANGELOG.md`](CHANGELOG.md) for what is new.

**Live: <https://alexw6385.github.io/rongqiu-world/>** (a computer with a discrete GPU is best; phones lower the quality automatically)

The whole project is one `index.html` with no build step; serve it from any static server. three.js loads from jsDelivr. It renders with WebGPU only (recent Chrome, Edge, Safari, Firefox); browsers that cannot use WebGPU get a short notice.

## Controls

| Action | Computer | Phone |
|---|---|---|
| Look | drag (double-click locks the mouse, Esc releases) | drag on the right |
| Walk | W A S D | stick, bottom left |
| Run | Shift | push the stick to its edge |
| Fly | hold Space to rise, release to sink; hold it for a second to lock flight at that height (press again to release); the higher you fly, the faster you travel | hold 「飞」 bottom right (same lock) |
| Speed | − / = in steps, 0 resets; wheel or trackpad smoothly (up to ×400); slider in settings — climbing and sinking scale with it too | pinch |
| Map and jumps | M or the map button | map button |

A jump from the map sets you down beside the place, facing it; if the view needs height you hover there until you move. The settings hold the time of day, eye height (1.5–12 m, default 3 m), music, cloud cover and quality.

## What is in the world

- **Geography after the book:** the north continent, the west (dinosaur) continent, the east continent, the ice continent of the south, and islands such as 骷髅岛, 双子岛, the fungus islands and 白骸龙之岛.
- **Landscapes:** the endless desert with the spiral-terraced 印加 pit; the twisted jungle with its 100 m edge giants and dark second layer; the spire forest; the volcano in the jungle's centre; the canyon sea, frozen into a glacier in the north; the great rift, filled with fog; the salt flats; the crystal ring rising out of the polar ice; the fog seas round 骷髅岛.
- **The underworld:** a cavern under the desert, its ceiling glowing like a sun, a fern-tree forest, home trees standing as pillars, and the 死亡尖刺 wall (enter it from the map).
- **Landmarks and cities:** the home tree; the frozen giants; 立蝎之城's pyramids on their grass plain; 翡翠龙之城's egg boulders in the ferns; the floating islands; 翡翠港; 银之城 and 创造之城 behind their metal-bar walls; the 脑袋虫 mounds; the three-layer cloud sea over the east.
- **Plants:** twisted trees, 龙栖木, crystal-barked trees, the east's tree-less succulent jungle, blood-ball trees, spiny explosive balls, fern trees, death spikes, and more.
- **Creatures and peoples:** 骸龙, 翡翠龙, 白骸龙, 银甲龙, 立蝎, 脑袋虫, 阿兹特克虫, 印加 wasps, pterosaurs of four sizes, 飞龙, 亚龙, 毛玉, the 深沙巴士, sky jellyfish and many others — each where the book puts it, at the size the book gives.
- **Time:** a 绒球 day lasts about 24 real minutes. The map shows the night side and the terminator live.
- **Music:** synthesised in the browser.

This repository holds none of the novel's text — only names, coordinates and one- or two-sentence summaries. External assets and their licences are listed in [`ASSETS.md`](ASSETS.md).

## Technical notes

- **A real-scale planet:** radius 6371 km, units in metres. Terrain is a cube-sphere quadtree LOD, 18 levels, finest vertex spacing ≈ 1.2 m, generated in Web Workers. Camera position in double precision; rendering is camera-relative; logarithmic depth.
- **Terrain:** one deterministic height function shared by the workers and the main thread; continents, mountain belts and the book's landscapes are carved into it by coordinates.
- **Light:** single-scattering Rayleigh + Mie atmosphere, ray-marched volumetric clouds, low mist at dawn and dusk, ACES tone mapping and a light grade. Terrain self-shadowing from per-tile horizon angles; two-cascade shadow maps for objects.
- **WebGPU:** three.js WebGPU renderer, WGSL shaders wired through TSL. Post chain: scene → GTAO → TAAU → bloom → tone mapping and grade.
- **Places you stand in or under** — the cloud sea, the rift's fog, the underworld — are meshes in camera-following patches shaped by noise in planet coordinates.
- **Vegetation:** recursively grown trees with real bark and leaf photos in three LODs (full, simplified, and an 8-view impostor atlas); GPU-drawn grass placed from a background height sampler.

## Development

See [`dev/README.md`](dev/README.md).
