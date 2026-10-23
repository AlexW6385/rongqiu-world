# 开发工具

`shot.cjs` 用无头 Chromium（软件 WebGL）截图，用来在没有显卡的环境里检查画面。

```bash
npm i three@0.169.0 playwright
# 把 index.html 里的 CDN 地址换成本地 node_modules，另存为 test.html，然后：
python3 -m http.server 8788 &
OUT=view node dev/shot.cjs
```

环境变量：`W`/`H` 视口尺寸，`Q` 画质（high / mid / low），`N` 渲染帧数，`VIEW` 视角 JSON（`{"lat":..,"lon":..,"heading":..,"pitch":..}`，弧度），`HOUR` 当地时间，`MAP=1` 同时截地图。
