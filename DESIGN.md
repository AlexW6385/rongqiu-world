# 绒球世界 — Design

> **This document is the brief for the whole project.** It is written so that an implementing agent can work from it, alone, from the current state to completion, without further direction from the author. Read it in full before touching anything, follow it, and keep §11 (status) and §10 (decisions) up to date as you go. If something here is unclear, decide in the spirit of §3 and record the decision in §10 — do not stop to ask.

## 1. What this is

A realistic, real-scale, first-person 3D world of **绒球**, the home planet of 琳 in the novel 《进化的四十六亿重奏》. You stand on the ground as a creature living on 绒球 and explore it: vast natural environments — continents, seas, deserts, forests, mountains — populated by the plants and creatures the novel describes, distributed where the novel says (or implies) they live; and, scattered across them, **concentrated places** — the famous landscapes, landmarks and cities — built with a great density of unique detail.

The novel describes this world richly and at length. The project's ambition is to be as rich: everything the book describes of 绒球 should eventually exist here, looking and behaving as described, in the numbers and places described.

It is a **sightseeing experience**, not a game, not a wiki to read — the encyclopedia (§4) is a design tool behind the scenes, never a feature of the page.

**Scope is decided by the novel, not by this document.** This brief names no fixed list of cities, landmarks, plants or creatures; how many there are, what they are, and how important each is comes from reading the text (§4). More is better: there is no point at which the world is "full enough".

**Live site:** https://alexw6385.github.io/rongqiu-world/
**Source of truth for content:** the private repo **https://github.com/AlexW6385/rongqiu-source** — see §4.

## 2. What this is NOT

- **Not the 展览馆.** [4.6-billion-symphony](https://github.com/AlexW6385/4.6-billion-symphony) covers the whole novel, is lightweight, and is about information and browsing. This project covers 绒球 only and is about realism, detail and visual art. "Look up what X is and which chapter it is in" belongs to the 展览馆, not here.
- **Not a god's-eye view.** Ground view only. Flying exists as a way of moving, not as a different kind of experience.
- **Not era-switching.** Each place shows its single richest / most representative era. Inconsistency between places (snow here, summer there) is acceptable and intended.
- **Not a product for every device.** Targets the author's own computer and phone, both with WebGPU. Broad compatibility is a non-goal.
- **Not a host for the novel's text.** Only names, coordinates and one- or two-sentence summaries ever appear in this repo or on the page.
- **Not invented.** Nothing contradicts the book. Where the book is silent, inference is allowed but must be marked as inference in the encyclopedia.

## 3. The two things to get right

Everything else is secondary to these two pillars. When two goals conflict, resolve in this order.

### Pillar A — Faithful to the novel, and rich

- Terrain, places, plants and creatures follow the book's actual descriptions: appearance, size, behaviour, habitat, distribution, numbers.
- Richness is the goal, not a nice-to-have: the book has a lot; the world should have a lot.
- Work is **encyclopedia-first**: before building a thing, its entry in the design encyclopedia (§4) is written from the original text. Building from memory or guesswork is not allowed.
- Content is added in order of importance in the novel.

### Pillar B — As real and as beautiful as possible, as fast as possible

- Realism and natural look first: atmosphere, light, materials, vegetation, water, scale, motion.
- Picture quality is allowed to win over smoothness, within reason: it must not be unplayably laggy on the author's machine. Before lowering quality, look for optimisation, caching, precomputation and acceleration.
- The page stays **light to load** (budgets in §7).
- The interface stays **simple and clean**: walk, look, fly, a map to jump to places, a few settings. Nothing else on screen.

## 4. The design encyclopedia (世界百科) and the source repo

The encyclopedia is the bridge between the novel and the code. It is the single source of truth for *what* exists and *how it looks*.

- **Where the novel is:** `https://github.com/AlexW6385/rongqiu-source` (private). `novel.txt` is the full text (UTF-8, ~34 MB, volumes → chapters). An implementing agent attaches/clones that repo to read it. It is large: read it by volume/chapter ranges, not whole.
- **Where the encyclopedia is:** the same repo, under `encyclopedia/`. One file per entry, Markdown with a YAML front matter: `name`, `kind` (landscape / landmark / city / plant / creature / material / sky-weather), `aliases`, `continent`, `biome`, `places`, `size` (metres), `count_or_density`, `time` (day/night/season), `chapters`; then sections *Appearance*, *Behaviour / motion*, *Habitat and distribution*, *Relationships*, *Notes for implementation*. Every statement is tagged **[stated]** (from the text, with chapter) or **[inferred]** (our extrapolation, with reasoning). Entries are in English; names keep the Chinese original plus a romanised id.
- **Index:** `encyclopedia/index.md` — a chapter-by-chapter list of which 绒球 places, plants and creatures appear, built before full entries. The 展览馆's `data/wiki*.js` is the starting checklist of entries and chapters.
- **Reading the novel efficiently.** The text is far too long to read end to end. Do not. Work search-first: build a list of names and aliases (from the 展览馆 index and from names met along the way), locate every occurrence with text search (`grep -n`, by chapter), and read only the passages around the hits — a few hundred characters each side, more when a description runs long. Read a whole chapter only when it is clearly a set-piece for a place or creature. Keep a per-entry list of the passages used (chapter + approximate position) so they can be re-read later without searching again.
- **What crosses into this repo:** only the parameters the code needs — names, coordinates, sizes, counts, biome tags, colour values, placement and behaviour rules — in code or small data tables. No prose from the encyclopedia or the novel.
- **Rule:** no plant, creature, landscape or city is built or changed without a encyclopedia entry. If an entry is missing, write it first.

## 5. Architecture

- **Single page, no bundler.** The app is `index.html` served statically from GitHub Pages; three.js from jsDelivr. The implementing agent may split it into static ES modules (`src/*.js` loaded by `index.html`) when it becomes unmanageable — expected once the city layer lands. Still no build step.
- **Renderer: three.js WebGPU only.** WGSL shaders connected through TSL. Post chain: scene → GTAO → TAAU → bloom → tone-mapping / grade. Browsers without WebGPU get a short notice, not a fallback (`webgl.html` removed; in git history).
- **Planet:** cube-sphere quadtree LOD (18 levels, finest ≈ 1.2 m). Tiles generated in Web Workers from one deterministic height function shared by worker and main thread. Camera-relative rendering with double-precision camera position; logarithmic depth.
- **World authoring in code and tables.** Continents, mountain belts, landmarks and biomes are carved into the height function and placement tables by coordinates; the tables derive from the encyclopedia.
- **Generated nature.** Vegetation, ground cover and creature distribution are generated from encyclopedia rules (biome, altitude, moisture, proximity to landmarks, time of day), not hand-placed, so vast areas can be rich without hand work.
- **Concentrated places.** Famous landscapes, landmarks and cities are a separate layer of hand-authored dense detail on top of the generated world.
- **City layer.** A per-city plan (street network, lots, landmarks, districts) as data; procedural buildings generated from the plan; city-level collision and navigation; interiors loaded on demand. Separate from terrain code.
- **Vegetation:** procedural recursive trees in three LODs (full / simplified / impostor atlas); GPU-instanced grass driven by a background height sampler.
- **Lighting:** single-scattering Rayleigh+Mie atmosphere, ray-marched volumetric clouds, terrain self-shadow via precomputed horizon angles, two-cascade shadow maps for objects.
- **Travel:** walk, run, fly. Flight speed scales with altitude and is adjustable (keys, wheel, settings); the map lists famous places and jumps straight to them. This is the complete travel model — no vehicles, no fast-travel lore.
- **Sound.** Two systems, both synthesised in the browser with Web Audio (FM / wavetable / simple physical modelling; convolution reverb from synthesised impulses); no audio files.
  - *Soundscape first.* Wind, water, foliage, weather, and the creatures — their calls, wings, footsteps, and the sounds the book gives things (a bursting 爆炸尖球, a 滚雷). Encyclopedia entries record every described sound; creatures are heard before they are seen, positioned by distance and direction. Realism comes from this layer more than from music.
  - *Music, sparingly.* One planet-level motif, varied per continent and biome so the whole world sounds like one world; long silences are allowed; music rises at landmarks and cities. City music is derived from the encyclopedia — what that civilization's bodies and materials could sound like — not borrowed from a human tradition. Adaptive layers by time of day (night slower and lighter), altitude (wider layers when flying), nearby creature groups, and interior spaces (streets, caves: synthesised reverb). Every change of region crossfades; never a hard cut.
- **Dev tooling:** `dev/shot.cjs` — headless Chromium screenshots for checking the picture without a GPU.

## 6. Assets, precomputation and caching

Use whatever makes the picture better, as long as the page stays light to load. The implementing agent chooses sources and techniques itself within these rules.

- **Third-party assets** (PBR materials, scanned rocks and ground, bark, leaves, HDRIs for reference): allowed from permissive sources only — CC0 (Poly Haven, ambientCG), MIT or equivalent. Loaded at runtime from a CDN (jsDelivr for GitHub-hosted packages; the source's own CDN where it offers one). Keep an `ASSETS.md` listing every external asset with its source, licence and URL. Never commit large third-party binaries.
- **Precomputed / baked data** (impostor atlases, distribution maps, baked terrain tiles for landmark areas, city lightmaps, horizon maps): allowed and encouraged where it makes things faster or better. Store under `data/` in this repo, compressed (KTX2/Basis for textures, binary for tables), **streamed per region on demand**, never all at startup.
- **Caching:** use the browser's HTTP cache (immutable, content-hashed file names) and, for generated data that is expensive to compute at runtime, Cache Storage / IndexedDB so a second visit is fast. Cache misses must degrade gracefully (compute on the fly).
- **Budgets** (hard limits unless §10 records a change):
  - Initial load to first frame: **≤ 15 MB** transferred and **≤ 5 s** on the author's desktop.
  - Any single region's on-demand data: **≤ 25 MB**.
  - Any single committed file: **≤ 50 MB** (GitHub's warning threshold); no Git LFS.
  - Whole repository: **≤ 500 MB** (GitHub Pages serves up to 1 GB).
  - Expected final footprint under these rules: a few MB of code, tens of MB of baked atlases and maps, 100–300 MB of per-region baked data in total — only a small slice of it ever loaded in one visit.

### 6a. Techniques worth borrowing

Reference projects on the same stack, to study before designing the relevant systems (study the ideas; do not copy code without checking its licence):

- **False Earth** (Ming Jyun Hung, Codrops, Apr 2026; three.js WebGPU + TSL): over a million GPU-generated grass blades; GPU frustum culling writing visible indices for **indirect draws** so most instances never run the vertex shader; three density tiers with per-instance jitter on the distance test to hide LOD rings; deterministic per-blade seeds from world position; `compileAsync` with timeouts and a FIFO upload queue to avoid stalls on load. Apply the culling/indirect-draw and the shader warm-up ideas to grass, trees and creatures here.
- **Tesseract** (Fyrestar, three.js forum): planet engine at realistic scale — impostors for distant assets, mesh/texture packing, texture arrays with depth-based splatting for many ground materials, cascaded shadows. Useful as a checklist of systems a planet renderer ends up needing.

## 7. Constraints and rules

- Units are metres; coordinates are lat/lon on the planet.
- Encyclopedia first (§4). The novel never enters this repo; `.gitignore` keeps excluding `*.txt`.
- No gameplay (objectives, inventory, combat, NPC dialogue).
- No overhead/orbital mode, no era switching, no second renderer, no build step.
- UI stays minimal: walk, look, fly, map, settings. A new on-screen element needs a reason recorded in §10.
- Picture quality on the author's machine never goes down silently; a change that lowers it must be recorded in §10 with the reason.
- Content order follows importance in the novel.
- Checks are tiered so they do not crowd out the work: per change, one `dev/shot.cjs` screenshot of the thing changed (none for encyclopedia-only work); per task end and before every release, screenshots at a fixed set of landmark viewpoints compared with the previous set, plus the §6 budget check; only for high-risk changes (renderer, LOD, post chain, module split) a full viewpoint comparison after each step. Tool output is summarised, never pasted whole into the working context.
- Commits are authored as the repository owner (Alex Wang <alex119122114@gmail.com>) with no AI co-author trailers; messages in English, saying what changed and why.

## 8. Depth is layered

Rich systems are built in levels, not all at once. Each level must be complete, checked and committed before the next starts. Levels for the main systems:

**Creatures**
- L1 — correct look, size, colour, posture; placed in the right biomes at encyclopedia densities; idle animation.
- L2 — locomotion matching the encyclopedia (gait, flight, swim); wandering within habitat; day/night activity.
- L3 — group behaviour (herds, flocks, swarms); reaction to the player (flee / ignore / approach as the book implies).
- L4 — ecological behaviour: predator/prey, feeding, nesting, seasonal or weather-driven movement, as the encyclopedia describes.

**Water**
- L1 — correct sea level, coastlines, depth colour, shallow-water blocking.
- L2 — surface waves, foam at shorelines, reflections and refraction, sun glitter.
- L3 — rivers, lakes and waterfalls where the encyclopedia places them; wet shore materials.
- L4 — underwater view with light scattering, underwater life where the book describes it; any special seas the book describes with their own look.

**Weather and sky**
- L1 — day/night, moon phases, clear sky (done).
- L2 — cloud cover per biome, fog, haze, sunrise/sunset moods as described.
- L3 — rain, snow, storms, sandstorms where the encyclopedia places them; wet/snowy ground response.

**Cities**
- L1 — correct site, silhouette, walls, main landmark structures at the right scale.
- L2 — street network and squares, walkable, with collision; buildings as exteriors.
- L3 — districts with distinct building types, props, street detail, inhabitants (as creatures/figures, not NPC dialogue).
- L4 — interiors of major buildings, loaded on demand.

**Vegetation and ground**
- L1 — every encyclopedia plant exists with correct form and size, in the right biomes.
- L2 — variation (age, size, damage), seasonal states where applicable, undergrowth and litter.
- L3 — wind, interaction (brushing through grass), bioluminescence and other described effects.

**Sound**
- L1 — environmental soundscape per biome (wind, water, foliage, weather), positioned and distance-attenuated; crossfades between biomes.
- L2 — creature and plant sounds from the encyclopedia, positional, tied to behaviour (calls at dusk, wings when flying over, footsteps of the large ones).
- L3 — adaptive music layers (time, altitude, proximity, interiors); landmark and city themes derived from their entries; synthesised reverb for enclosed spaces.
- L4 — set pieces: storms, herds passing, the night chorus, as the book describes them.

**Landscapes and landmarks**
- L1 — correct position, scale and overall form.
- L2 — unique materials and detail (rock strata, crystal structure, bark of the great trees).
- L3 — surroundings: the ecology and small places around the landmark as the book describes them.

## 9. Decisions delegated to the implementing agent

These are the agent's to make, without asking, within the rules above; record each in §10.

- Which CC0/MIT asset sources to use, and which data to bake vs. compute live.
- When to split `index.html` into static ES modules, and the module layout.
- The city plan format (tables vs. a small DSL) and the building generator design.
- Order of work within a roadmap phase, and the viewpoints used for visual checks.
- Any implementation detail not fixed by this document.

## 10. Decisions log

Append-only. One line per decision: date, decision, reason.

- 2026-10 — 绒球世界 split from the 展览馆 as its own repo. Reason: information breadth vs. visual depth pull in opposite directions.
- 2026-10 — Ground-level view only; overhead view dropped. Reason: the experience is "I am a creature on 绒球."
- 2026-10 — No era switching. Reason: pure sightseeing; mixing eras across places is fine.
- 2026-10 — Renderer migrated WebGL → WebGPU. Reason: performance headroom for foliage, grass and post.
- 2026-10 — Target only the author's own devices for now. Reason: not a product; testing done by the author.
- 2026-10-26 — WebGL fallback removed; WebGPU only. Reason: two renderers with no shared code double every change; the fallback serves no device the author uses.
- 2026-10-26 — Cities will be fully walkable, with streets and eventually interiors, refined progressively. Reason: cities are among the novel's most important places.
- 2026-10-26 — The original text lives in the private repo `rongqiu-source` and never enters this repo. The encyclopedia lives there too.
- 2026-10-26 — Two pillars adopted: (A) faithful and rich, encyclopedia-first; (B) realism, quality and speed with a simple clean UI. Reason: author's stated vision.
- 2026-10-26 — Nature is generated from encyclopedia rules; landmarks and cities are hand-authored. Reason: richness at continent scale vs. uniqueness at landmark scale.
- 2026-10-26 — External CC0/MIT assets and baked data are allowed, chosen by the agent, within the load budgets of §6. Reason: realism ceiling of pure procedural; the page must stay light.
- 2026-10-26 — Creature behaviour, water, weather, cities and vegetation are built in levels (§8), as deep and real as possible over time. Reason: richness without blocking progress.
- 2026-10-26 — Travel is walk/run/fly with adjustable speed plus the map; nothing else. Reason: sufficient; keeps the UI simple.
- 2026-10-26 — This document is the brief for autonomous implementation; the agent decides §9 items itself and records them here.
- 2026-10-26 — Sound is soundscape-first, music sparse and motif-based, all synthesised, in levels (§8). Reason: realism comes from the world's own sounds; one motif keeps the world coherent.
- 2026-10-26 — No fixed content list in the brief; the novel (via the encyclopedia) decides what and how much exists. The project is open-ended: keep adding depth and content indefinitely; release in versions as chunks complete.
- 2026-10-26 — The WebGPU check tests for a real adapter and, after init, for the WebGPU backend. Reason: three.js silently falls back to its WebGL2 backend when `navigator.gpu` exists but no adapter is available, and our WGSL shaders break there (page hung on the loading screen).
- 2026-10-26 — `dev/shot.cjs` renders with software WebGPU (SwiftShader/Vulkan) instead of software WebGL; screenshots use N=120 frames so terrain and trees finish streaming. Reason: WebGPU-only renderer.
- 2026-10-26 — Encyclopedia index scope: volumes 1–5 are 绒球's story and are counted; volumes 6–8 are listed only where several 绒球 places/creatures co-occur (possible on-planet scenes). Importance score = log2(1+mentions) × √chapters × (1 + 0.3 × titled chapters, max 5), adjusted by judgement for the tier list. Reason: from volume 6 "绒球" is mostly 琳's faction off-planet; frequency alone over-ranks common words and under-ranks set-pieces.
- 2026-10-26 — Tier 1 for Phase 2 excludes cell-scale (`micro`) entries and 琳's made units; they stay in the index for later tiers. Reason: they are invisible at ground scale or transient war units, and add little to the sightseeing world per unit of work.
- 2026-10-26 — The scripts that rebuild the index live with it in `rongqiu-source/encyclopedia/tools/` (private), including the hand-curated alias/kind list. Reason: the index will be re-run as new names are found; tools that read the novel stay next to the novel.
- 2026-10-26 — Phase 2 entries were written in parallel by several agents from a shared guide (`rongqiu-source/encyclopedia/WRITING.md`) and a passage reader (`tools/passages.py`); every content line is tagged [stated vN·C] or [inferred: …]. Reason: 70 entries, each needing 20–60 passages; one guide keeps them uniform.
- 2026-10-26 — Conformance findings and fixes are logged in `CONFORMANCE.md` (fixed / open, with the phase each open item belongs to). Reason: §11 Phase 2 asks for a record of discrepancies; a table per pass is easier to check than prose here.
- 2026-10-26 — Landmark items' fifth field is now a compass heading (0 = east, π/2 = north) converted to the instance yaw in the worker. Reason: walls and rows of buildings must line up with the plan; the old value was an arbitrary spin.
- 2026-10-26 — Visual checks with `dev/shot.cjs` run one browser at a time with N≥150. Reason: under software WebGPU, parallel runs starve the tile workers and the screenshots show unloaded terrain.
- 2026-10-26 — Encyclopedia entries gain a *Sound* section (WRITING.md); the 70 tier-1 entries written before it get a sound pass before Sound L2 is built. Reason: the soundscape-first sound design needs every described sound on record.
- 2026-10-26 — v2.0 = the end of Phase 2, recorded in `CHANGELOG.md`. Per the author, no git tags and no GitHub release objects: a release is a CHANGELOG entry plus the live site. Reason: author's instruction.

- 2026-10-26 — Map jumps use per-place viewpoints (`PLACE_VIEW`): a target, a distance, a look-at height and a preferred side; the camera lands where terrain does not hide the target and holds any vantage height until the player moves. Reason: author asked that every jump lands beside the place with it in view.
- 2026-10-26 — Climb and descent speed scale linearly with the speed setting (they scaled with its square root). Reason: author asked that flying speed rise with the speed setting.
- 2026-10-26 — The underworld is placed under the desert from the 印加 pit toward the volcano, west of the canyon, and drawn as its own camera-following cavern with its own light (the surface world is hidden inside it). Reason: the book's underworld collapses into the canyon; showing each in its own era needs them side by side, and a heightfield planet cannot hold a cave.
- 2026-10-26 — Low cloud sheets and caves are meshes in camera-following patches whose shapes come from noise in planet coordinates (rebuilt every 1.5–3 km of travel). Reason: they must be solid to stand under or on and occlude correctly; the volumetric sky is drawn behind the terrain.
- 2026-10-27 — Sound L1 built as a separate synthesised soundscape (wind, leaves, surf, sand hiss, cave hum and drips, night insects) mixed from what surrounds the player; one button and one volume govern it together with the music. Reason: soundscape first (§5); no new UI element.
- 2026-10-27 — Water L2 is shaded in the terrain shader (no separate water mesh): the sea floor shows through the shallows, the sky reflection follows the reflected ray's elevation with a glow round the sun, and surf bands run in to the beaches. Geometric swell is left for later. Reason: the sea is part of the terrain mesh already; this adds the look at no extra draw cost.
- 2026-10-27 — Weather L2 cloud cover varies by region through a bias added to the cover setting (clear over the desert and salt flats, heavier over the jungle, the east and the 骷髅岛 seas), the same in the shader and in the CPU copy used for grass light. Reason: the book's skies differ by land; one global cover setting stays the user's control.
- 2026-10-27 — The east's fog pillar is a single static mesh 50 km across and ~34 km tall with a winding spiral, placed between 银之城, 云中山峰 and 创造之城, with a fog bank inside; the cloud sea now follows a smoothed ground (150 / 370 / 590 m up) instead of fixed altitudes. Reason: encyclopedia east — the pillar is the plateau's landmark; the sheets are described as 100–200 m above the ground.
- 2026-10-27 — Where a city site falls in an unbuildable spot (翡翠港 among islets), the terrain is shaped locally (a low shore terrace) rather than moving the site far from the book's location. Reason: keeps the map position and makes the town stand on land.
- 2026-10-27 — The sky is set in a moon visit, since the world already shows the floating 鸣石 islands that only stay up while the moon is near: the moon is sky-blue, larger than the sun, a sea world with pale islands, and keeps its fast 8-day round so its phase can be seen in one evening; the 1060-cycle year is not shown (no seasons yet). Reason: encyclopedia rongqiu — one consistent sky that fits the places shown.
- 2026-10-27 — Generation rules start from a habitat/density table extracted from the entries (rongqiu-source `encyclopedia/density.md`); first applied to the spire forest (rows on a shared lattice in cube-face coordinates, every 7th point drawn far away and the rest only near, so the 3 m gaps exist where you walk) and to creature group sizes and rarities. Reason: §8 Creatures/Vegetation L1 ask for encyclopedia densities; a lattice keeps the book's neat rows without overlapping pillars across tile levels.
- 2026-10-27 — Module split begins with the city layer: `src/city.js` is the first static ES module, imported by `index.html`. Code that the terrain workers also run (the city generator and the ground shaping under a city) is exported as source text and appended to the shared terrain source; building geometry is built on the main thread. Further parts move out of `index.html` into `src/` as they are reworked, rather than in one risky rewrite. Reason: §5 expects the split once the city layer lands; the worker-shared source makes a one-shot split fragile.
- 2026-10-27 — City plan format: a generator function per city in `src/city.js` (wall ring, gate, avenue, districts, landmark buildings) that emits ordinary landmark items, so cities reuse the landmark pipeline (instancing, placement on terrain, collision circles, map framing). Reason: one placement path for everything hand-authored; the plan stays code a reader can follow.
- 2026-10-27 — First city: 翡翠龙之城, imperial phase (the richest city entry, and the book's best-described street-level layout).
- 2026-10-27 — Lakes above sea level are flat water discs at a fixed level over basins carved into the terrain (the terrain hides the disc past the shore), with their own small water shading (depth colour, Fresnel sky reflection, sun glint). Reason: the sea is shaded in the terrain at height 0 only; discs are the cheapest correct way to put water anywhere else.
- 2026-10-27 — Creatures L2: each spawned group shares a heading that wanders slowly and is leashed to where the group was found (its patch of habitat); members keep their place in the group and turn with it; day animals rest through the night and night animals (阿兹特克虫, moths) leave at dawn; big flyers glide with occasional wingbeats. Reason: §8 Creatures L2, and the herd/band sizes from the density table only read as herds if they move together.
- 2026-10-27 — Rivers are centre lines in the terrain source with a width that grows downstream and a water level that only falls (the lowest ground met so far, then a gentle ramp to the sea). The terrain cuts the channel and a valley down to that level; the water is a ribbon built near the viewer at the same level. Reason: one definition keeps channel, banks, vegetation masks and water in agreement everywhere, in workers and on the main thread.

## 11. Roadmap and status

The implementing agent updates this section at the end of every work session: move items between lists, add dates, and note what was checked. Phases run in order; within a phase, order is the agent's choice. A phase is done when every item in it is built, visually checked, pushed, and the live site works.

**Done**
- Planet, terrain LOD, atmosphere, clouds, day/night and moon.
- Continents, major 原著 landscapes and landmarks placed (first pass, not yet checked against the encyclopedia).
- Trees (3 LODs), grass, flowers, rocks, ground detail.
- Creatures by biome (see README), sized per the novel (first pass, not yet checked against the encyclopedia).
- Map with teleport; mobile controls; procedural music.
- WebGPU post chain; performance pass (Oct 2026).
- `DESIGN.md` (this brief), 2026-10-26.
- Phase 0 — Housekeeping, 2026-10-26: `webgl.html` and the redirect removed; WebGPU notice (also covers "API present, no adapter"); `ASSETS.md` added; README and `dev/` updated. Checked with `dev/shot.cjs` at 家园树, 立蝎之城, 创造之城 and on the no-WebGPU path; picture unchanged from before.
- Phase 1 — Encyclopedia index, 2026-10-26: `rongqiu-source/encyclopedia/index.md` — 303 entries (260 from the 展览馆 data, the rest found in the text), each with kind, region, eras, mention and chapter counts, titled chapters and a one-line note; a ranked list; a chapter-by-chapter map of volumes 1–5; candidate on-planet chapters in volumes 6–8; and the tier-1 list for Phase 2.
- Phase 2 — Encyclopedia first batch and conformance, 2026-10-26: 70 tier-1 entries in `rongqiu-source/encyclopedia/`; conformance pass 1 fixed 20 discrepancies (pit, egg boulders, spire forest, 龙栖木, home trees, frozen giants, 立蝎 pyramids, 银之城 and 创造之城, floating islands, rift width, eastern succulents, spike-ball island, six creatures) — see `CONFORMANCE.md`; the open items there are carried into Phases 3–6. Checked with `dev/shot.cjs` at the pit, spire forest, home tree, 银之城, 立蝎之城, 创造之城, 翡翠龙之城, 龙栖木之林 and the frozen giants.
- Phase 3 — Rich nature, 2026-10-27 (v2.1, v3.0): cloud sea following the ground and lit through; the east's fog pillar; twisted-jungle edge giants and second layer; the underworld L1 with its death-spike wall; peak and crater; glacier; rift fog; fog seas; crystal ring; crystal woodland; southern ice continent; 云中山峰 and the Academy peak; the moon of a visit; home-tree fluff band and waterfall; Phase 2 peoples and creatures placed by their cities; Water L2 (shallows, sky reflection, surf); Weather L2 (cloud cover by region, walk-in fog banks, dawn and dusk mist); Sound L1 plus the waterfall and 骷髅岛's click-eggs. Generation rules from the habitat/density table (`encyclopedia/density.md`): spire-forest lattice, floating archipelago, 骷髅岛 and its 1001 click-eggs, jungle pyramids, blood-ball belt and moss plain, spike-ball line, creature group sizes and rarities. Budget check: initial load 6.05 MB uncompressed. Checked with `dev/shot.cjs` at each place changed. Deferred: placements that need underwater views (古鱿, 三叶虫 — Water L4), caves (晶鳞 hives, 奇布查 — Landscapes L3) or seasons (蔓藤 in spring); baking/caching is not needed yet and is revisited with the first city.
- Phase 4 — First city, 2026-10-27 (v4.0): 翡翠龙之城 in its imperial phase built to Cities L1–L2 from a plan in `src/city.js` — wall and gate, white avenue, statue plaza, palace, hall of worship and school hall, upper district of tall white houses on white-sand lanes, ~14,000 square stone houses on a street grid, lower-district shanties round the egg boulders with 亚龙 roosts, trodden-earth streets, collision, its people in the streets; checked at the gate, the plaza and a common-district street. `index.html` split into ES modules: `src/city.js`, `src/terrain.js`, `src/creatures.js`, `src/music.js`, `src/ambience.js`; the rest moves out as it is reworked.

**Phase 5 — Depth, round one**
- In progress (2026-10-27): Creatures L2 (groups, habitat leash, day/night, gliding); Water L3: the peak's crater lake, 巨龙之河 and the glow forest's stream; map jumps fixed to use their viewpoints (the place id was being dropped); hold-to-lock flight; Vegetation L2 begun (fallen trunks, broken snags and saplings in the forests).
- Creatures L2, Vegetation L2, Water L3, Landscapes L3 for all Phase 2 entries.
- Remaining encyclopedia entries for the next tier of plants and creatures; add them at L1.

**Phase 6 — All cities**
- Remaining cities to L1–L2; first city to L3.

**Phase 7 — Depth, round two**
- Creatures L3, Water L4, Weather L3, Vegetation L3, Cities L3 for all cities.

**Phase 8 — Full depth**
- Creatures L4; Cities L4 (interiors of major buildings); every encyclopedia entry present at its full level; final conformance pass against the encyclopedia; final performance and budget pass; README updated to describe the finished world.

**Phase 9 onward — Keep going**
- There is no final state. After Phase 8, continue in a loop: find what the book describes of 绒球 that is still missing, thin, or shallower than its text (new encyclopedia entries, more individuals, more variation, more behaviour, more detail in places), add it, check it, release it. Prefer the item that adds the most to richness and faithfulness per unit of work. Stop only when the author says so.

**Milestone for the main phases:** every 绒球 entry in the encyclopedia index exists in the world at the deepest level §8 defines for its kind, each checked against its encyclopedia entry; the live site loads within the §6 budgets; the UI is still just walk, look, fly, map, settings. Reaching it starts Phase 9; it does not end the project.

## 12. Releases

Every push to `main` deploys to GitHub Pages, so the live site is always current. On top of that, cut a **release** whenever a meaningful chunk is done — the end of a phase, a new city, a new tier of creatures, a visible quality jump:
- Number it `vMAJOR.MINOR` (MAJOR for a phase, MINOR for a chunk inside it). No git tags or GitHub release objects — the release is its `CHANGELOG.md` entry and the live site.
- Keep `CHANGELOG.md` with one entry per release, newest first, in plain language a reader of the novel would understand (what they can now see), not a list of commits.
- Never release with a known regression in the picture or a budget breach; fix first.
