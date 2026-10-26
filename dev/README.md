# Dev tools

`shot.cjs` takes screenshots with headless Chromium using software WebGPU (SwiftShader on Vulkan), so the picture can be checked without a GPU.

```bash
npm i three@0.186.1 @dgreenheck/ez-tree@1.1.0 playwright
# Point the jsDelivr URLs in index.html (three and ez-tree) at local node_modules, save as test.html, then:
python3 -m http.server 8788 &
OUT=view N=120 node dev/shot.cjs
```

Environment variables: `W`/`H` viewport size; `Q` quality (high / mid / low); `N` frames to render (terrain and trees need about 100 frames to finish streaming — fewer gives an empty flat ground); `VIEW` view JSON (`{"lat":..,"lon":..,"heading":..,"pitch":..}`, radians); `HOUR` local time; `MAP=1` also screenshots the map; `PORT` server port; `DIR` output directory; `F` page file name; `CHROME` path to a Chromium binary (when Playwright's own browser can't be downloaded, the npm package `@sparticuz/chromium` provides one).
