# 绒球世界 — Design

> This document is the frame for the project. Anyone (human or AI) touching the code should read it first and stay inside it. It records *what* this project is, *why* it is built the way it is, and *what we will not do*. It is deliberately short on implementation detail — the code is the detail; this file is the direction.

## 1. What this is

A realistic, real-scale, first-person 3D world of **绒球**, the home planet of 琳 in the novel 《进化的四十六亿重奏》. You stand on the ground as if you were a creature living on 绒球, and you walk, run or fly to see its continents, landscapes, landmarks, plants and animals, under its own day/night cycle and moon.

It is a **sightseeing experience**, not a game, not an encyclopedia.

## 2. What this is NOT

- **Not the 展览馆.** [4.6-billion-symphony](https://github.com/AlexW6385/4.6-billion-symphony) covers the whole novel, is lightweight, and is about information and browsing. This project covers 绒球 only and is about image quality, detail and visual art. Content that belongs to "look up what X is and which chapter it appears in" goes to the 展览馆, not here.
- **Not a god's-eye view.** No overhead / orbital camera as the main mode. Ground view only (flying is allowed as a way of moving, not as a different kind of experience).
- **Not era-switching.** Each place shows its single richest / most representative era. Inconsistency between places (snow here, summer there) is acceptable and intended.
- **Not a product for every device.** It targets the author's own computer and phone, both with WebGPU. Broad compatibility is a non-goal.
- **Not a host for the novel's text.** Only place names, coordinates and one- or two-sentence summaries. No original prose in the repo or on the page. (The novel is still the *source* for all content — see §6 on how it is used.)

## 3. Core principles (in priority order)

1. **Faithful to the novel.** Geography, scale, plants, creatures and terrain follow the book's actual descriptions. When the book is specific, the world is specific. When the book is silent, invent in its spirit, but never contradict it.
2. **Realism and proper scale.** Real planet radius, metres as units, real-looking atmosphere, light, vegetation and shadows. The world should feel like a place, not a diorama.
3. **Visual quality over smoothness.** It must not be unplayably laggy, but when quality and frame rate conflict, quality wins. Adaptive resolution is the escape valve, not lowered ambition.
4. **The experience is the point.** Every feature must make standing in the world better. UI, menus and systems are kept minimal; the map exists only to jump to famous places.
5. **Content by importance.** New plants, creatures and terrain are added in the order of their importance in the novel, not in the order they are easy to build.

## 4. Architecture

- **Single page, no build.** The whole app is `index.html`. Served statically from GitHub Pages. three.js is loaded from jsDelivr.
- **Renderer: three.js WebGPU only.** Terrain, atmosphere, clouds and vegetation shaders are WGSL connected through TSL. Post chain: scene → GTAO → TAAU → bloom → tone-mapping / grade. Browsers without WebGPU get a short notice, not a fallback renderer (`webgl.html` was removed; it remains in git history).
- **Planet:** cube-sphere quadtree LOD (18 levels, finest ≈ 1.2 m). Tiles generated in Web Workers from one deterministic height function shared by worker and main thread. Camera-relative rendering with double-precision camera position; logarithmic depth.
- **World authoring lives in code.** Continents, mountain belts, landmarks and biomes are carved into the height function and placement tables by coordinates. There is no external level editor and no asset pipeline beyond CDN-hosted textures (Poly Haven, ez-tree leaves).
- **Vegetation:** procedural recursive trees in three LODs (full / simplified / impostor atlas); GPU-instanced grass driven by a background height sampler.
- **Lighting:** single-scattering Rayleigh+Mie atmosphere, ray-marched volumetric clouds, terrain self-shadow via precomputed horizon angles, two-cascade shadow maps for objects.
- **Cities (planned module).** Cities will become fully walkable — streets, squares, building exteriors and eventually interiors — laid out from the novel's descriptions. The current "height function + place models by coordinate" approach does not cover this; cities need their own layer: a per-city plan (street network, lots, landmarks), procedural buildings generated from that plan, and city-level collision/navigation. The plan is data; the look is code. Keep this layer separate from the terrain code so it can grow without touching the planet.
- **Audio:** music synthesised in the browser per biome; no audio files.
- **Dev tooling:** `dev/shot.cjs` — headless Chromium screenshots for checking the picture without a GPU.

## 5. Technical decisions and why

| Decision | Why |
|---|---|
| WebGPU only, WebGL removed | Needed for compute-heavy grass/foliage and modern post-processing; author's devices support it. Maintaining a second renderer (separate file, GLSL vs. WGSL, no shared code) would double every change for a version nobody uses. |
| Real planet radius (6371 km), metres | Realism and proper scale are principles 2; faking scale breaks the feeling of being a creature on the planet. |
| One `index.html`, no bundler | Zero build friction; the page must keep running by just opening it. If the file becomes unmanageable, split into ES modules served statically — still no bundler. |
| All geometry procedural / CDN textures | Keeps the repo tiny and legally clean; no large binary assets committed. |
| Adaptive internal resolution + TAAU | Lets slow hardware keep every effect on rather than turning effects off. |
| Deterministic height function | The same world everywhere, in workers and on the main thread, with no data files to ship. |

## 6. Constraints and rules

- Units are metres; coordinates are lat/lon on the planet.
- **The novel is the source of truth, but it never enters the repo.** When building anything the book describes (a plant, a creature, a landscape, a city), work from the original text, supplied privately to the session (attached file or connected local folder) — not from memory or guesswork. Nothing from the original text is committed, displayed, or paraphrased at length on the page; the repo holds only names, coordinates and one- or two-sentence summaries. `.gitignore` must keep excluding `*.txt`.
- Do not add gameplay (objectives, inventory, combat, NPC dialogue).
- Do not add an overhead/orbital mode or era switching.
- Do not add a build step or framework.
- Do not add a WebGL (or any second) renderer back.
- Keep the map simple: show famous places, jump to them.
- A performance change must not lower the default picture quality on the author's machine without being called out.

## 7. Open questions

- City layer design: how city plans are expressed (hand-written tables vs. a small plan DSL), and how interiors are loaded without hurting the planet-scale LOD.
- Whether `index.html` (~200 KB) should be split into static ES modules for maintainability — likely yes once the city layer lands.

## 8. Decisions log

Append-only. One line per decision: date, decision, reason.

- 2026-10 — 绒球世界 split from the 展览馆 as its own repo. Reason: the two goals (information breadth vs. visual depth) pull in opposite directions.
- 2026-10 — Ground-level view only; overhead view dropped. Reason: the experience is "I am a creature on 绒球."
- 2026-10 — No era switching. Reason: keep it a pure sightseeing experience; mixing eras across places is fine.
- 2026-10 — Renderer migrated WebGL → WebGPU; WebGL kept as automatic fallback. Reason: performance headroom for foliage, grass and post; author's devices support WebGPU.
- 2026-10 — Target only the author's own devices for now. Reason: not a product; testing done by the author.
- 2026-10-26 — WebGL fallback removed; WebGPU only. Reason: two renderers with no shared code double every change; the fallback serves no device the author uses.
- 2026-10-26 — Cities will be fully walkable, with streets and eventually interiors, refined progressively. Reason: cities are among the novel's most important places; silhouettes alone contradict "the experience is the point."
- 2026-10-26 — The original text is the source of truth for all content and must be supplied privately to the session when building; it never enters the repo.

## 9. Roadmap and status

**Done**
- Planet, terrain LOD, atmosphere, clouds, day/night and moon.
- Continents, major 原著 landscapes and landmarks placed.
- Trees (3 LODs), grass, flowers, rocks, ground detail.
- Creatures by biome (see README for the list), sized per the novel.
- Map with teleport; mobile controls; procedural music.
- WebGPU post chain; performance pass (Oct 2026).

**Next (in order of importance from the novel)**
1. Remove `webgl.html` and the fallback redirect; show a WebGPU notice instead.
2. City layer, first pass: plan format + procedural buildings + collision, applied to one city (立蝎之城 or 翡翠龙之城) with walkable streets and squares.
3. Richer key locations around landmarks: 家园树 surroundings, the pyramids, the 巨蛋石.
4. More creatures and plants from the novel still missing, highest-importance first.
5. Water and shoreline quality (海, 峡谷之海).

**Later**
- Remaining cities (银之城, 创造之城, 翡翠港 …) on the same city layer; then interiors.
- Weather / time-of-day moods per biome (fog, rain) where the novel describes them.
- Split `index.html` into static ES modules.
- Night sky accuracy (constellations as described in the novel, if any).
