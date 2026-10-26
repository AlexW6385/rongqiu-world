# 绒球世界 — Design

> This document is the frame for the project. Anyone (human or AI) touching the code should read it first and stay inside it. It records *what* this project is, *why* it is built the way it is, and *what we will not do*. It is deliberately short on implementation detail — the code is the detail; this file is the direction.

## 1. What this is

A realistic, real-scale, first-person 3D world of **绒球**, the home planet of 琳 in the novel 《进化的四十六亿重奏》. You stand on the ground as a creature living on 绒球 and explore it: vast natural environments — continents, seas, deserts, forests, mountains — populated by the plants and creatures the novel describes, distributed where the novel says (or implies) they live; and, scattered across them, **concentrated places** — the famous landscapes, landmarks and cities — built with a great density of unique detail.

The novel describes this world richly and at length. The project's ambition is to be as rich: everything the book describes should eventually exist here, looking and behaving as described, in the numbers and places described.

It is a **sightseeing experience**, not a game, not an encyclopedia.

## 2. What this is NOT

- **Not the 展览馆.** [4.6-billion-symphony](https://github.com/AlexW6385/4.6-billion-symphony) covers the whole novel, is lightweight, and is about information and browsing. This project covers 绒球 only and is about realism, detail and visual art. "Look up what X is and which chapter it is in" belongs to the 展览馆, not here.
- **Not a god's-eye view.** Ground view only. Flying exists as a way of moving, not as a different kind of experience.
- **Not era-switching.** Each place shows its single richest / most representative era. Inconsistency between places (snow here, summer there) is acceptable and intended.
- **Not a product for every device.** Targets the author's own computer and phone, both with WebGPU. Broad compatibility is a non-goal.
- **Not a host for the novel's text.** Only names, coordinates and one- or two-sentence summaries ever appear in the repo or on the page. The novel is still the *source* for everything — see §4 and §6.
- **Not invented.** Nothing contradicts the book. Where the book is silent, inference is allowed but must be marked as inference.

## 3. The two things to get right

Everything else is secondary to these two pillars.

### Pillar A — Faithful to the novel, and rich

- Terrain, places, plants and creatures follow the book's actual descriptions: appearance, size, behaviour, habitat, distribution, numbers.
- Richness is the goal, not a nice-to-have: the book has a lot; the world should have a lot.
- Work is **codex-first**: before building a thing, its entry in the design codex (§4) is written from the original text. Building from memory or guesswork is not allowed.
- Content is added in order of importance in the novel.

### Pillar B — As real and as beautiful as possible, as fast as possible

- Realism and natural look first: atmosphere, light, materials, vegetation, water, scale.
- Picture quality is allowed to win over smoothness, within reason: it must not be unplayably laggy. Before lowering quality, look for optimisation, caching, precomputation and acceleration.
- The interface stays **simple and clean**: walk, look, fly, a map to jump to places, a few settings. Nothing else on screen.

## 4. The design codex (世界百科)

The codex is the bridge between the novel and the code. It is the single source of truth for *what* exists and *how it looks*.

- **One entry per thing** — a landscape, a landmark, a city, a plant, a creature, a material, a weather or sky phenomenon. Each entry records, from the text: appearance (shape, size, colour, texture, light), behaviour or motion, where it is found (continent, biome, specific places), how many / how dense, time of day or season it appears, relationships (what eats what, what grows near what), and the chapters it comes from. Each statement is tagged **stated** (from the text) or **inferred** (our reasonable extrapolation).
- **Lives in the private source repo** (`AlexW6385/rongqiu-source`) next to the novel, because it paraphrases the book closely. It never enters this public repo.
- **What crosses into this repo** is only the parameters the code needs: names, coordinates, sizes, counts, biome tags, colour values, placement rules. No prose.
- **Starting point:** the 展览馆's `data/wiki*.js` already indexes most entries with their chapters; use it as the index of what to write, and the novel as the content.
- **Format:** structured text (one Markdown or YAML file per entry) so that both people and AI can read, diff and query it.

## 5. Architecture

- **Single page, no build.** The whole app is `index.html`, served statically from GitHub Pages. three.js is loaded from jsDelivr. (See Open questions on splitting into static ES modules as the project grows.)
- **Renderer: three.js WebGPU only.** Terrain, atmosphere, clouds and vegetation shaders are WGSL connected through TSL. Post chain: scene → GTAO → TAAU → bloom → tone-mapping / grade. Browsers without WebGPU get a short notice, not a fallback renderer (`webgl.html` was removed; it remains in git history).
- **Planet:** cube-sphere quadtree LOD (18 levels, finest ≈ 1.2 m). Tiles generated in Web Workers from one deterministic height function shared by worker and main thread. Camera-relative rendering with double-precision camera position; logarithmic depth.
- **World authoring lives in code and tables.** Continents, mountain belts, landmarks and biomes are carved into the height function and placement tables by coordinates. The tables are derived from the codex.
- **Generated nature.** Vegetation and creature distribution are generated procedurally from codex rules (biome, altitude, moisture, proximity to landmarks), not hand-placed, so the vast areas can be rich without hand work. Hand placement is reserved for landmarks and cities.
- **Concentrated places.** Famous landscapes, landmarks and cities are a separate layer of hand-authored, dense detail on top of the generated world.
- **Cities (planned module).** Cities become fully walkable — streets, squares, building exteriors and eventually interiors — laid out from the codex. They need their own layer: a per-city plan (street network, lots, landmarks), procedural buildings generated from that plan, and city-level collision/navigation. The plan is data; the look is code. This layer stays separate from the terrain code.
- **Vegetation:** procedural recursive trees in three LODs (full / simplified / impostor atlas); GPU-instanced grass driven by a background height sampler.
- **Lighting:** single-scattering Rayleigh+Mie atmosphere, ray-marched volumetric clouds, terrain self-shadow via precomputed horizon angles, two-cascade shadow maps for objects.
- **Audio:** music synthesised in the browser per biome; no audio files.
- **Dev tooling:** `dev/shot.cjs` — headless Chromium screenshots for checking the picture without a GPU.

## 6. Technical decisions and why

| Decision | Why |
|---|---|
| WebGPU only, WebGL removed | Needed for compute-heavy grass/foliage and modern post-processing; author's devices support it. Maintaining a second renderer (separate file, GLSL vs. WGSL, no shared code) would double every change for a version nobody uses. |
| Real planet radius (6371 km), metres | Realism and proper scale; faking scale breaks the feeling of being a creature on the planet. |
| One `index.html`, no bundler | Zero build friction; the page must keep running by just opening it. If it becomes unmanageable, split into ES modules served statically — still no bundler. |
| Procedural geometry, CDN-hosted textures | Keeps the repo tiny and legally clean; no large binaries committed. Photographic textures and scanned models from permissive sources (Poly Haven CC0, ez-tree MIT) are allowed via CDN. |
| Adaptive internal resolution + TAAU | Lets slow hardware keep every effect on rather than turning effects off. |
| Deterministic height function | The same world everywhere, in workers and on the main thread, with no data files to ship. |
| Codex in the private repo, parameters in the public repo | Faithfulness needs close paraphrase of the text; the public repo must stay free of it. |
| Generated distribution from rules, hand-placed landmarks | Only generation can make continents rich; only hand work can make a landmark unique. |

## 7. Constraints and rules

- Units are metres; coordinates are lat/lon on the planet.
- **Codex first.** Do not build or change a plant, creature, landscape or city without a codex entry written from the original text. Inferred details are marked as inferred.
- **The novel never enters this repo.** It is supplied privately to the session via `rongqiu-source`. Nothing from the original text is committed, displayed, or paraphrased at length on the page. `.gitignore` must keep excluding `*.txt`.
- Do not add gameplay (objectives, inventory, combat, NPC dialogue).
- Do not add an overhead/orbital mode or era switching.
- Do not add a build step, framework, or a second renderer.
- Keep the UI minimal: walk, look, fly, map, settings. Any new on-screen element needs a reason in this document.
- A performance change must not lower the default picture quality on the author's machine without being called out. Prefer precomputation, caching and culling to lower quality.
- Content order follows importance in the novel.

## 8. Open questions

1. **Codex scope and pace.** The novel is ~34 MB of text. Writing the full codex before building anything would take a long time; writing one entry at a time is slow but safe. Proposed: do a chapter-by-chapter **index pass** first (what appears where), then write full entries per place as that place is built.
2. **Precomputation vs. pure procedural.** For speed, some things could be baked offline (terrain tiles for the most-visited areas, impostor atlases, lightmaps for cities, distribution maps) and shipped as files. That speeds up loading and rendering but adds binaries and hosting. Decide a size budget and what is allowed to be baked.
3. **Assets for realism.** Procedural-only has a realism ceiling. Allow more CDN-hosted scanned models and PBR materials (CC0) for rocks, ground, bark, water? Proposed: yes, within a documented list of sources and licences.
4. **Splitting `index.html`.** Now ~200 KB and growing with cities and codex-driven content. Proposed: split into static ES modules (no bundler) when the city layer lands.
5. **City plan format.** Hand-written tables vs. a small plan DSL; how interiors load without hurting planet-scale LOD.
6. **Creature behaviour.** How far to go: idle animation and wandering only, or herd behaviour, predator/prey, day/night activity as described? Richness argues for more; cost argues for staging it.
7. **Travel between places.** At real scale, walking between continents is impossible; today there is fast flight and the map. Is that enough, or should there be lore-friendly travel (e.g., following a river, a 巴士 route)?
8. **Water.** Seas and 峡谷之海 are central to the book; current water is basic. Which level of water simulation (shoreline, waves, depth colour, underwater view) is in scope?

## 9. Decisions log

Append-only. One line per decision: date, decision, reason.

- 2026-10 — 绒球世界 split from the 展览馆 as its own repo. Reason: information breadth vs. visual depth pull in opposite directions.
- 2026-10 — Ground-level view only; overhead view dropped. Reason: the experience is "I am a creature on 绒球."
- 2026-10 — No era switching. Reason: pure sightseeing; mixing eras across places is fine.
- 2026-10 — Renderer migrated WebGL → WebGPU. Reason: performance headroom for foliage, grass and post.
- 2026-10 — Target only the author's own devices for now. Reason: not a product; testing done by the author.
- 2026-10-26 — WebGL fallback removed; WebGPU only. Reason: two renderers with no shared code double every change; the fallback serves no device the author uses.
- 2026-10-26 — Cities will be fully walkable, with streets and eventually interiors, refined progressively. Reason: cities are among the novel's most important places.
- 2026-10-26 — The original text is the source of truth and lives in the private repo `rongqiu-source`; it never enters this repo.
- 2026-10-26 — Two pillars adopted: (A) faithful and rich, codex-first; (B) realism, quality and speed with a simple clean UI. Reason: author's stated vision.
- 2026-10-26 — A design codex (世界百科) will be written from the text before building content, kept in `rongqiu-source`; only parameters cross into this repo. Reason: faithfulness and richness need a source of truth; the public repo must stay text-free.
- 2026-10-26 — Nature is generated from codex rules; landmarks and cities are hand-authored. Reason: richness at continent scale vs. uniqueness at landmark scale.

## 10. Roadmap and status

**Done**
- Planet, terrain LOD, atmosphere, clouds, day/night and moon.
- Continents, major 原著 landscapes and landmarks placed (first pass).
- Trees (3 LODs), grass, flowers, rocks, ground detail.
- Creatures by biome (see README), sized per the novel (first pass).
- Map with teleport; mobile controls; procedural music.
- WebGPU post chain; performance pass (Oct 2026).

**Next**
1. Remove `webgl.html` and the fallback redirect; show a WebGPU notice instead.
2. **Codex, index pass:** go through the novel (using the 展览馆's entry index as a checklist) and record, per chapter, which 绒球 places, plants and creatures appear. Output: an index in `rongqiu-source`.
3. **Codex, full entries** for the first batch: the continents and seas; the top landscapes (峡谷之海, 大裂谷, 印加巨坑, 无尽荒漠, 盐地, 结晶之山, 地眼之湖); the top landmarks (家园树, 立蝎之城, 翡翠龙之城); the most important plants and creatures. Then re-check what is already built against the entries and fix discrepancies.
4. **Distribution rules:** turn codex habitat/density statements into generation rules; make the natural world rich (plants, creatures, ground cover) across the continents.
5. **City layer, first pass:** plan format + procedural buildings + collision, applied to one city (立蝎之城 or 翡翠龙之城) with walkable streets and squares, built from its codex entry.
6. **Visual pass:** water and shorelines; material and vegetation realism; any baked/cached acceleration decided in Open question 2.

**Later**
- Remaining cities on the city layer; then interiors.
- Creature behaviour beyond wandering, as the codex describes.
- Weather and biome moods (fog, rain) where the novel describes them.
- Split `index.html` into static ES modules.
- Night sky as described in the novel, if described.
