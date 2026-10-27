# Dev tools

`shot.cjs` takes screenshots with headless Chromium using software WebGPU (SwiftShader on Vulkan), so the picture can be checked without a GPU.

```bash
npm i three@0.186.1 @dgreenheck/ez-tree@1.1.0 playwright
# Point the jsDelivr URLs in index.html (three and ez-tree) at local node_modules, save as test.html, then:
python3 -m http.server 8788 &
OUT=view N=150 node dev/shot.cjs
```

Run one browser at a time: in parallel the tile workers starve and the picture shows unloaded terrain.

Environment variables: `W`/`H` viewport size; `Q` quality (high / mid / low); `N` frames to render (terrain and trees need about 100 frames to finish streaming — fewer gives an empty flat ground); `VIEW` view JSON (`{"lat":..,"lon":..,"heading":..,"pitch":..}`, radians); `HOUR` local time; `MAP=1` also screenshots the map; `PLACE` arrives at a map place by id, as a map jump would; `POST` view JSON applied after the jump (e.g. `{"pitch":0.3}`); `PORT` server port; `DIR` output directory; `F` page file name; `CHROME` path to a Chromium binary (when Playwright's own browser can't be downloaded, the npm package `@sparticuz/chromium` provides one).
