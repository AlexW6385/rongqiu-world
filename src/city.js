/* City layer (DESIGN §5, §8 Cities). A city is a plan — wall, gate, avenue, districts, landmark buildings — turned into
   landmark items by a deterministic generator. The generator and the terrain shaping run inside the shared terrain source
   (main thread and workers), so they are exported as source text; the building geometry is built on the main thread.

   First city: 翡翠龙之城 in its imperial phase (encyclopedia emeraldcity, v4·155–162): an irregular 10 m wall of squared
   stone some 3 km across with a 5 m gate, a white-paved avenue to the centre, a white-sand upper district with tall white
   houses, the palace, the hall of worship and the statue plaza, a common district of square stone houses on a street grid,
   and the lower district's piled-stone shanties wrapped round the egg boulders, which carry timber 亚龙 roosts. */

/* ---- runs inside the terrain source: V, LANDMARKS, CLEARINGS, LMR, sm and angTo are in scope there ---- */

/* the ground under the city: bumps flattened toward the site's mean height (~640 m) */
function cityFlatten(nx, ny, nz, h) {
  // 翡翠龙之城 centre V(12,-88), written out so this works before the rest of the city source has run
  const c0 = 0.034136859, c1 = 0.207911691, c2 = 0.97755174;
  const d = Math.acos(Math.min(1, nx * c0 + ny * c1 + nz * c2));
  const r = d * 6371000;
  if (r > 1900) return h;
  const t = sm(1900, 1500, r);
  return h * (1 - t) + (640 + 0.25 * (h - 640)) * t;
}

/* inside a city's walls: streets of trodden earth, no grass, no wild stones (1 inside, 0 outside) */
function cityInside(nx, ny, nz) {
  const c0 = 0.034136859, c1 = 0.207911691, c2 = 0.97755174;
  const r = Math.hypot(nx - c0, ny - c1, nz - c2) * 6371000;
  return r < 1350 ? 1 : r > 1480 ? 0 : (1480 - r) / 130;
}

function cityGen() {
  const la0 = 12, lo0 = -88, C = V(la0, lo0);
  const items = {};
  // landmark frame: +x is west and +y is south; a heading h points along west·cos h + south·sin h
  const put = (kind, e, n, sc, lift, heading) => (items[kind] = items[kind] || []).push([-e, -n, sc, lift || 0, heading || 0]);
  const hdg = (de, dn) => Math.atan2(-dn, -de);   // heading of a direction given in east/north
  const rnd = (k) => LMR(k * 1.37 + 9000);
  const wallR = (th) => 1450 * (1 + 0.06 * Math.sin(3 * th + 1) + 0.04 * Math.sin(5 * th + 2));
  const gateTh = -Math.PI / 2;   // the gate faces south, toward the 立蝎 lands

  // egg boulders already placed for the village phase: they stay inside the walls (lower district round each)
  const egg = LANDMARKS.find((L) => L[0] === la0 && L[1] === lo0 && L[2] === 'eggRock');
  const boulders = egg ? egg[3].map(([x, y, sc]) => ({ e: -x, n: -y, sc, r: 26 * sc })) : [];
  const nearBoulder = (e, n, pad) => boulders.some((b) => Math.hypot(e - b.e, n - b.n) < b.r + pad);

  // wall: 12 m blocks round an irregular ring, a 5 m gate with two towers
  const circ = 2 * Math.PI * 1450 * 1.02, nSeg = Math.ceil(circ / 12);
  for (let k = 0; k < nSeg; k++) {
    const th = (k / nSeg) * 2 * Math.PI - Math.PI;
    const dg = Math.atan2(Math.sin(th - gateTh), Math.cos(th - gateTh));
    const r = wallR(th);
    if (Math.abs(dg) * r < 8.5) continue;
    const e = r * Math.cos(th), n = r * Math.sin(th);
    const r2 = wallR(th + 0.001), te = r2 * Math.cos(th + 0.001) - e, tn = r2 * Math.sin(th + 0.001) - n;
    put('ecWall', e, n, 1, 0, hdg(te, tn));
  }
  const rg = wallR(gateTh);
  put('ecGate', -6.5, -rg, 1, 0, 0); put('ecGate', 6.5, -rg, 1, 0, 0);

  // white-paved avenue from the gate to the plaza; the plaza with the statue of 苏苏米
  for (let n = -rg + 3; n < -100; n += 6) for (const e of [-3, 3]) put('ecPave', e, n, 1, 0, 0);
  const plaza = { e: 0, n: -60, r: 42 };
  for (let e = -42; e <= 42; e += 6) for (let n = -102; n <= -18; n += 6) if (Math.hypot(e - plaza.e, n - plaza.n) < plaza.r) put('ecPave', e, n, 1, 0, 0);
  put('ecStatue', 0, -60, 1, 0, Math.PI / 2);

  // upper district: palace to the north of the plaza, hall of worship (fire basin before it) and the school hall to either side
  const big = [{ e: 0, n: 75, r: 48 }, { e: 150, n: -40, r: 30 }, { e: -150, n: -40, r: 24 }, plaza];
  put('ecPalace', 0, 75, 1, 0, 0);
  put('ecHall', 150, -40, 1, 0, Math.PI / 2); put('ecBasin', 150, -80, 1, 0, 0);
  put('ecHall', -150, -40, 0.75, 0, Math.PI / 2);
  // white-sand ring road and lanes
  for (let a = 0; a < 2 * Math.PI; a += 6 / 205) put('ecSand', 205 * Math.cos(a), 205 * Math.sin(a), 1, 0, a);
  for (let q = 0; q < 8; q++) {
    const a = q * Math.PI / 4 + Math.PI / 8;
    for (let r = 110; r < 335; r += 6) put('ecSand', r * Math.cos(a), r * Math.sin(a), 1, 0, a);
  }
  const onLane = (e, n) => { const r = Math.hypot(e, n), a = Math.atan2(n, e); if (Math.abs(r - 205) < 11) return true;
    for (let q = 0; q < 8; q++) { const d = Math.abs(Math.sin(a - (q * Math.PI / 4 + Math.PI / 8))) * r; if (d < 9 && Math.cos(a - (q * Math.PI / 4 + Math.PI / 8)) > 0) return true; } return false; };
  let k = 0;
  for (let r = 130; r < 330; r += 21) {
    const nA = Math.floor(2 * Math.PI * r / 21);
    for (let i = 0; i < nA; i++) {
      const a = (i + (r % 2) * 0.5) / nA * 2 * Math.PI, e = r * Math.cos(a), n = r * Math.sin(a); k++;
      if (onLane(e, n) || Math.abs(e) < 12 && n < 0 || big.some((b) => Math.hypot(e - b.e, n - b.n) < b.r + 10) || nearBoulder(e, n, 12)) continue;
      put('ecTall', e, n, 0.85 + 0.35 * rnd(k), 0, hdg(e, n));
    }
  }

  // common district: square stone houses packed along streets that bend a little (a warped grid), lots 10–12 m, a wider street every
  // fourth lot, houses turned to face their street, here and there a small yard or a well square
  const warp = (i, j) => [7 * Math.sin(j * 0.21 + 1.3) + 4 * Math.sin(i * 0.13 + j * 0.07), 7 * Math.sin(i * 0.19 + 0.4) + 4 * Math.sin(j * 0.11 - i * 0.05)];
  for (let i = -130; i <= 130; i++) for (let j = -130; j <= 130; j++) {
    const si = ((i % 4) + 4) % 4, sj = ((j % 4) + 4) % 4; if (si === 0 || sj === 0) continue;   // streets
    const [wx, wy] = warp(i, j), e = i * 11 + (si > 1 ? 1.5 : 0) + wx + (rnd(i * 191 + j) - 0.5) * 1.2, n = j * 11 + (sj > 1 ? 1.5 : 0) + wy + (rnd(i * 7 + j * 313) - 0.5) * 1.2;
    const r = Math.hypot(e, n), th = Math.atan2(n, e);
    if (r < 350 || r > wallR(th) - 20 || (Math.abs(e) < 16 && n < 0) || nearBoulder(e, n, 34)) continue;
    const q = rnd(i * 53 + j * 97);
    if (q < 0.035) { if (si === 2 && sj === 2) put('ecWell', e, n, 1, 0, 0); continue; }   // a small square with a well
    if (q < 0.09) continue;                                                                  // yards and gaps
    const [wx2, wy2] = warp(i + 1, j), ang = Math.atan2(wy2 - wy, 11 + wx2 - wx);           // along the street
    const face = (si === 1 ? Math.PI : 0) + (sj === 1 ? 0 : 0);
    const vk = rnd(i * 13 + j * 71), kind = vk < 0.45 ? 'ecHouse' : vk < 0.8 ? 'ecHouse2' : 'ecHouse3';
    put(kind, e, n, 1.2 + 0.22 * rnd(i * 31 + j * 17), 0, hdg(Math.cos(ang), Math.sin(ang)) + (sj === 1 ? Math.PI / 2 : -Math.PI / 2) + face * 0);
  }

  // lower district: piled-stone shanties round each egg boulder; a timber 亚龙 roost on top of the boulder
  boulders.forEach((b, bi) => {
    if (Math.hypot(b.e, b.n) > wallR(Math.atan2(b.n, b.e)) - 30) return;
    const n = 26 + Math.floor(rnd(bi * 11) * 18);
    for (let s = 0; s < n; s++) {
      const a = rnd(bi * 101 + s) * 2 * Math.PI, r = b.r + 6 + 30 * Math.sqrt(rnd(bi * 211 + s * 3));
      const e = b.e + r * Math.cos(a), nn = b.n + r * Math.sin(a);
      if (Math.abs(e) < 12 && nn < 0) continue;
      put('ecShanty', e, nn, 0.8 + 0.5 * rnd(bi * 7 + s), 0, a);
    }
    put('ecRoost', b.e, b.n, b.sc, 11.5 * b.sc, rnd(bi) * 6.28);
  });

  for (const kind in items) LANDMARKS.push([la0, lo0, kind, items[kind]]);
  CLEARINGS.push([C, 1760 / 6371000]);   // trees cleared inside the walls (v4·155); the fern jungle stays outside
}

export const CITY_SRC = `${cityFlatten.toString()}\n${cityInside.toString()}\n${cityGen.toString()}\ncityGen();\n`;

/* ---- main thread: building geometry for the city kinds ---- */
/* squared stone walls (encyclopedia emeraldcity: grey-white blocks set with 酱木-sap mortar, moss on old work): a canvas texture of
   block courses 0.5 m high and its normal map, tiled every 4 m on the buildings */
function stoneTextures(THREE, light = false) {
  const S = 1024, PX = S / 4;   // 256 px per metre
  const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  const hgt = new Float32Array(S * S);
  let seed = 7; const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  x.fillStyle = light ? '#b8b4aa' : '#6b665c'; x.fillRect(0, 0, S, S);
  const course = PX * 0.5;
  for (let row = 0; row < S / course; row++) {
    let u = -r() * PX;
    while (u < S) {
      const w = PX * (0.55 + 0.9 * r()), y0 = row * course, g = (light ? 205 : 120) + (light ? 25 : 40) * r(), t = 10 * (r() - 0.5);
      x.fillStyle = `rgb(${g + 8 + t},${g + 4 + t},${g - 6 + t})`; x.fillRect(u + 3, y0 + 3, w - 6, course - 6);
      // weathering: darker lower edge, lighter top, a few chips
      const gr = x.createLinearGradient(0, y0, 0, y0 + course); gr.addColorStop(0, 'rgba(255,255,255,0.06)'); gr.addColorStop(1, 'rgba(0,0,0,0.14)');
      x.fillStyle = gr; x.fillRect(u + 3, y0 + 3, w - 6, course - 6);
      for (let k = 0; k < 4; k++) { x.fillStyle = `rgba(40,36,30,${0.15 + 0.2 * r()})`; x.beginPath(); x.arc(u + 6 + r() * (w - 12), y0 + 6 + r() * (course - 12), 2 + 5 * r(), 0, 6.283); x.fill(); }
      for (let yy = Math.max(0, Math.floor(y0 + 3)); yy < Math.min(S, y0 + course - 3); yy++) for (let xx = Math.max(0, Math.floor(u + 3)); xx < Math.min(S, u + w - 3); xx++) {
        const e = Math.min(xx - u - 3, u + w - 3 - xx, yy - y0 - 3, y0 + course - 3 - yy); hgt[yy * S + xx] = Math.min(1, e / 10) * (0.85 + 0.15 * Math.sin(xx * 0.31 + yy * 0.17));
      }
      u += w;
    }
  }
  // grain
  const id = x.getImageData(0, 0, S, S), d = id.data;
  for (let i = 0; i < S * S; i++) { const n = (r() - 0.5) * 22; d[i * 4] += n; d[i * 4 + 1] += n; d[i * 4 + 2] += n; }
  x.putImageData(id, 0, 0);
  const map = new THREE.CanvasTexture(c); map.wrapS = map.wrapT = THREE.RepeatWrapping; map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  // normal map from the block heights
  const nc = document.createElement('canvas'); nc.width = nc.height = S; const nx = nc.getContext('2d'); const nd = nx.createImageData(S, S);
  for (let yy = 0; yy < S; yy++) for (let xx = 0; xx < S; xx++) {
    const h = (a, b) => hgt[((b + S) % S) * S + ((a + S) % S)];
    const dx = (h(xx + 1, yy) - h(xx - 1, yy)) * 2.2, dy = (h(xx, yy + 1) - h(xx, yy - 1)) * 2.2, l = Math.hypot(dx, dy, 1), o = (yy * S + xx) * 4;
    nd.data[o] = (-dx / l * 0.5 + 0.5) * 255; nd.data[o + 1] = (dy / l * 0.5 + 0.5) * 255; nd.data[o + 2] = (1 / l * 0.5 + 0.5) * 255; nd.data[o + 3] = 255;
  }
  nx.putImageData(nd, 0, 0);
  const nmap = new THREE.CanvasTexture(nc); nmap.wrapS = nmap.wrapT = THREE.RepeatWrapping; nmap.anisotropy = 8;
  return { map, nmap };
}

export function buildCityGeos({ THREE, merge, M4, plantMaterial }) {
  const B = (w, h, d, x, y, z, c, ry = 0) => ({ g: new THREE.BoxGeometry(w, h, d), m: M4(x, y, z, 0, ry, 0), c });
  /* a box whose texture coordinates are in metres/4, so the stone courses keep their size on every face */
  const SB = (w, h, d, x, y, z, c, ry = 0) => { const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
    const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, (uv.getX(i) * dims[f][0] + x * 0.37 + z * 0.21) / 4, (uv.getY(i) * dims[f][1] + y) / 4); }
    return { g, m: M4(x, y, z, 0, ry, 0), c }; };
  const { map: stoneMap, nmap: stoneNrm } = stoneTextures(THREE);
  const stoneMat = plantMaterial({ tex: 'rock', sway: false, map: stoneMap, nmap: stoneNrm });
  const lime = stoneTextures(THREE, true), whiteMat = plantMaterial({ tex: 'rock', sway: false, map: lime.map, nmap: lime.nmap });   // the upper district's white stone
  const stone = [0.6, 0.58, 0.52], white = [0.88, 0.87, 0.82], dark = [0.1, 0.09, 0.08];
  const G = {};
  // 10 m wall of squared stone blocks (older courses greyer and mossy at the foot)
  G.ecWall = merge([B(12.2, 10, 3, 0, 5, 0, [0.62, 0.6, 0.55]), B(12.2, 1.2, 3.2, 0, 0.6, 0, [0.42, 0.45, 0.34]), B(12.4, 0.7, 3.6, 0, 10.35, 0, [0.7, 0.68, 0.62]),
    B(12.3, 0.15, 3.1, 0, 3.3, 0, [0.52, 0.5, 0.46]), B(12.3, 0.15, 3.1, 0, 6.7, 0, [0.52, 0.5, 0.46])]);
  G.ecGate = merge([B(4.5, 13, 4.5, 0, 6.5, 0, [0.66, 0.64, 0.58]), B(5, 0.8, 5, 0, 13.4, 0, [0.72, 0.7, 0.64])]);
  // square stone house of builders and farmers: flat roof with a low parapet, a dark doorway
  /* the common district's square stone houses (builders and farmers): squared-block walls on a darker plinth, a projecting lintel over a
     recessed doorway, small dark windows, a parapet round the flat roof with a spout, roof beams poking through the walls, a hide awning
     on poles by the door, clay pots, and on the roof hides drying or a woodpile. Three variants so streets do not repeat. */
  const wood = [0.36, 0.27, 0.17], hide = [0.55, 0.4, 0.26], clay = [0.56, 0.34, 0.22], plinth = [0.42, 0.42, 0.36];
  const house = (w, d, h, opt) => { const p = [SB(w, h, d, 0, h / 2, 0, stone), SB(w + 0.25, 0.45, d + 0.25, 0, 0.22, 0, plinth),
      SB(w + 0.2, 0.55, 0.35, 0, h + 0.27, d / 2 - 0.08, [0.66, 0.63, 0.56]), SB(w + 0.2, 0.55, 0.35, 0, h + 0.27, -d / 2 + 0.08, [0.66, 0.63, 0.56]),
      SB(0.35, 0.55, d - 0.5, w / 2 - 0.08, h + 0.27, 0, [0.66, 0.63, 0.56]), SB(0.35, 0.55, d - 0.5, -w / 2 + 0.08, h + 0.27, 0, [0.66, 0.63, 0.56]),
      B(1.3, 2.3, 0.5, opt.door, 1.15, d / 2 - 0.2, dark), SB(2, 0.4, 0.55, opt.door, 2.5, d / 2 + 0.1, [0.72, 0.69, 0.62])];
    for (const [wx, wy] of opt.win) p.push(B(0.55, 0.45, 0.2, wx, wy, d / 2 + 0.01, dark));
    for (let k = 0; k < Math.floor(w / 1.4); k++) p.push(B(0.18, 0.18, d + 0.9, -w / 2 + 0.7 + k * 1.4, h - 0.35, 0, wood));   // beams through both walls
    p.push(B(0.25, 0.15, 0.7, w / 2 - 0.6, h + 0.1, d / 2 + 0.35, [0.5, 0.48, 0.42]));                                    // rain spout
    if (opt.awning) { p.push({ g: new THREE.PlaneGeometry(2.8, 1.8), m: M4(opt.door, 2.75, d / 2 + 0.95, -1.15, 0, 0), c: hide },
      B(0.1, 2.5, 0.1, opt.door - 1.3, 1.25, d / 2 + 1.7, wood), B(0.1, 2.5, 0.1, opt.door + 1.3, 1.25, d / 2 + 1.7, wood)); }
    for (let k = 0; k < opt.pots; k++) p.push({ g: new THREE.CylinderGeometry(0.22, 0.3, 0.6, 7), m: M4(opt.door + 1.2 + k * 0.55, 0.3, d / 2 + 0.35), c: clay });
    if (opt.roof === 'hides') for (let k = 0; k < 2; k++) p.push({ g: new THREE.PlaneGeometry(1.6, 1.2), m: M4(-1 + k * 1.8, h + 0.08, -0.5, -Math.PI / 2, 0, 0.3 * k), c: [hide[0] * (1 - 0.15 * k), hide[1], hide[2]] });
    if (opt.roof === 'wood') for (let k = 0; k < 6; k++) p.push({ g: new THREE.CylinderGeometry(0.1, 0.1, 1.6, 5), m: M4(1, h + 0.12 + (k % 3) * 0.18, -1 + Math.floor(k / 3) * 0.2, 0, 0, Math.PI / 2), c: wood });
    if (opt.upper) { p.push(SB(w * 0.55, 2.8, d * 0.6, -w * 0.2, h + 1.4, -d * 0.15, stone), B(1, 1.9, 0.3, -w * 0.2, h + 0.95, d * 0.15 + 0.02, dark)); }
    if (opt.stair) for (let k = 0; k < 6; k++) p.push(SB(0.9, 0.35 * (k + 1), 0.6, w / 2 + 0.45, 0.175 * (k + 1), d / 2 - 0.5 - k * 0.6, stone));
    return merge(p); };
  G.ecHouse = house(7, 7, 4.5, { door: -1.2, win: [[1.6, 2.6]], awning: true, pots: 2, roof: 'hides' });
  G.ecHouse2 = house(8, 6.5, 4.2, { door: 1.4, win: [[-1.8, 2.5], [-0.4, 2.5]], awning: false, pots: 3, roof: 'wood', stair: true });
  G.ecHouse3 = house(7.5, 7.5, 4.6, { door: 0, win: [[2.2, 2.7]], awning: true, pots: 1, upper: true });
  for (const k of ['ecHouse', 'ecHouse2', 'ecHouse3', 'ecWall', 'ecGate']) G[k] && (G[k].mat = stoneMat);
  // lower district: a low hut of loosely piled stones (some fallen), a lean-to of poles under a hide, a hearth ring before it
  {
    const parts = [], rs = [0.46, 0.44, 0.38];
    for (let i = 0; i < 26; i++) { const a = i / 26 * 6.283 * 0.8 + 0.6, ring = i % 2, rr = 1.9 + 0.15 * Math.sin(i * 7.1);
      parts.push({ g: new THREE.IcosahedronGeometry(0.42 + 0.18 * ((i * 37) % 5) / 5, 0), m: M4(Math.cos(a) * rr * 1.2, 0.35 + ring * 0.62 + (i % 5 === 0 ? 0.55 : 0), Math.sin(a) * rr), c: rs.map(v => v * (0.85 + 0.25 * ((i * 13) % 7) / 7)) }); }
    for (const [x, z] of [[2.6, 0.9], [2.9, -0.6], [-2.2, 2.1]]) parts.push({ g: new THREE.IcosahedronGeometry(0.4, 0), m: M4(x, 0.25, z), c: rs });   // fallen stones
    for (let k = 0; k < 5; k++) parts.push({ g: new THREE.CylinderGeometry(0.07, 0.09, 3.6, 5), m: M4(-1.6 + k * 0.8, 1.5, -0.2, 0.75, 0, 0), c: [0.35, 0.26, 0.16] });
    parts.push({ g: new THREE.PlaneGeometry(4.2, 3.4), m: M4(0, 1.75, -0.25, -0.8, 0, 0), c: [0.5, 0.37, 0.23] });
    for (let k = 0; k < 7; k++) { const a = k / 7 * 6.283; parts.push({ g: new THREE.IcosahedronGeometry(0.18, 0), m: M4(0.8 + Math.cos(a) * 0.45, 0.1, 2.6 + Math.sin(a) * 0.45), c: [0.25, 0.23, 0.2] }); }
    parts.push({ g: new THREE.CircleGeometry(0.35, 8), m: M4(0.8, 0.06, 2.6, -Math.PI / 2), c: [0.08, 0.06, 0.05] });
    G.ecShanty = merge(parts);
  }
  // upper district: a tall house of white stone 10+ m high with a statue on the roof, dinosaur skins and teeth as ornament
  {
    const wht = [.95, .94, .9], trim = [1.02, 1.01, .97], parts = [SB(9, 11, 9, 0, 5.5, 0, wht), SB(9.6, 0.5, 9.6, 0, 0.25, 0, [0.95, 0.94, 0.88]),
      SB(9.5, 0.6, 9.5, 0, 11.3, 0, trim), SB(9.8, 0.25, 9.8, 0, 6.2, 0, trim), B(1.6, 2.8, 0.4, 0, 1.4, 4.4, dark), SB(2.6, 0.5, 0.7, 0, 3.05, 4.65, trim)];
    for (let k = 0; k < 3; k++) parts.push(SB(2.4, 0.25, 0.6, 0, 0.12 + k * 0.25, 4.9 + (2 - k) * 0.6, [0.98, 0.97, 0.92]));   // steps
    for (const x of [-2.6, 2.6]) for (const y of [4.3, 8.5]) parts.push(B(0.8, 1.1, 0.2, x, y, 4.42, dark));
    for (const y of [4.3, 8.5]) for (const z of [-2, 2]) { parts.push(B(0.2, 1.1, 0.8, 4.42, y, z, dark), B(0.2, 1.1, 0.8, -4.42, y, z, dark)); }
    parts.push({ g: new THREE.PlaneGeometry(2, 3.2), m: M4(2.2, 3.1, 4.53), c: [0.6, 0.45, 0.28] }, { g: new THREE.PlaneGeometry(1.6, 2.6), m: M4(-2.3, 8.6, 4.53), c: [0.45, 0.5, 0.3] });   // hung skins
    for (const [x, z] of [[4.5, 4.5], [-4.5, 4.5], [4.5, -4.5], [-4.5, -4.5]]) parts.push({ g: new THREE.ConeGeometry(0.22, 1.4, 6), m: M4(x, 12.2, z, 0, 0, x > 0 ? -0.35 : 0.35), c: [0.95, 0.92, 0.82] });   // horns at the corners
    parts.push(SB(1.6, 1, 1.6, 0, 12.1, 0, trim), { g: new THREE.SphereGeometry(0.75, 12, 9), m: new THREE.Matrix4().makeScale(1, 1.45, 0.8).premultiply(M4(0, 13.7, 0)), c: [0.86, 0.85, 0.8] },
      { g: new THREE.SphereGeometry(0.42, 10, 8), m: new THREE.Matrix4().makeScale(1, 0.9, 1.25).premultiply(M4(0, 15.05, 0.25)), c: [0.86, 0.85, 0.8] },
      { g: new THREE.ConeGeometry(0.28, 1.5, 7), m: M4(0, 13.1, -0.9, -1.1, 0, 0), c: [0.86, 0.85, 0.8] });
    G.ecTall = merge(parts); G.ecTall.mat = null;
  }
  // the palace: a very large square hall with a pyramid roof, a 暴君巨蜥 skull over each door; walls of rock mixed with 酱木 sap and sand
  {
    const wall = [0.95, 0.9, 0.82], parts = [SB(64, 1.2, 64, 0, 0.6, 0, [0.8, 0.78, 0.72]), SB(62, 1.2, 62, 0, 1.8, 0, [0.85, 0.83, 0.77]),
      SB(60, 14, 60, 0, 9.4, 0, wall), SB(61.2, 1.2, 61.2, 0, 16.9, 0, [1, 0.97, 0.9])];
    for (let k = 0; k < 6; k++) { const w = 60 - k * 10; parts.push(SB(w, 5.4, w, 0, 20 + k * 5.4, 0, [0.82 - k * 0.02, 0.78 - k * 0.02, 0.7 - k * 0.02])); }   // the stepped pyramid roof
    for (let s2 = 0; s2 < 4; s2++) {
      const a = s2 * Math.PI / 2, cx = Math.sin(a), cz = Math.cos(a), at = (f, y, l = 0) => [cx * f + cz * l, y, cz * f - cx * l];
      parts.push({ ...B(6, 8, 1.2, ...at(29.8, 6.4), dark, a) });
      for (const l of [-5, 5]) parts.push({ g: new THREE.CylinderGeometry(0.9, 1.05, 12.5, 12), m: M4(...at(31.2, 8.65, l)), c: [1.02, 0.99, 0.92] });
      parts.push(SB(13, 1.2, 3, ...at(31, 15.4), [1, 0.97, 0.9], a));
      for (let k = 0; k < 4; k++) parts.push(SB(14 - k * 0.5, 0.45, 1.4, ...at(32.6 + (3 - k) * 1.2, 0.23 + k * 0.45), [0.88, 0.86, 0.8], a));
      // the skull: a long head, eye sockets, a jaw lined with teeth
      const sk = [0.9, 0.87, 0.78];
      parts.push({ g: new THREE.SphereGeometry(1, 16, 12), m: new THREE.Matrix4().makeScale(2.2, 1.5, 3.4).premultiply(new THREE.Matrix4().makeRotationY(a)).premultiply(M4(...at(31.6, 12.2))), c: sk });
      for (const l of [-1.1, 1.1]) parts.push({ g: new THREE.SphereGeometry(0.45, 8, 6), m: M4(...at(33.4, 12.8, l)), c: [0.05, 0.04, 0.04] });
      parts.push({ g: new THREE.BoxGeometry(3.4, 0.5, 2.6), m: new THREE.Matrix4().makeRotationY(a).premultiply(M4(...at(32.6, 10.9))), c: sk });
      for (let k = 0; k < 7; k++) parts.push({ g: new THREE.ConeGeometry(0.16, 0.8, 5), m: M4(...at(33.6, 11.2, -1.5 + k * 0.5)), c: [0.97, 0.95, 0.88] });
    }
    G.ecPalace = merge(parts);
  }
  // hall of worship / school hall: a long white hall with a low roof and a front of pillars
  {
    const parts = [B(42, 12, 26, 0, 6, 0, white), B(43, 1.2, 27, 0, 12.6, 0, [0.93, 0.92, 0.87]), B(5, 7, 0.2, 0, 3.5, 13.1, dark)];
    for (let i = 0; i < 8; i++) parts.push({ g: new THREE.CylinderGeometry(0.8, 0.9, 11, 10), m: M4(-17.5 + i * 5, 5.5, 15, 0, 0, 0), c: [0.92, 0.91, 0.86] });
    parts.push(B(43, 0.8, 5, 0, 11.4, 15, [0.9, 0.89, 0.84]));
    G.ecHall = merge(parts);
  }
  // 3 m clay fire basin
  G.ecBasin = merge([{ g: new THREE.CylinderGeometry(1.5, 0.9, 1.1, 18), m: M4(0, 1.15, 0), c: [0.55, 0.32, 0.2] }, B(1.4, 0.6, 1.4, 0, 0.3, 0, [0.45, 0.28, 0.18]),
    { g: new THREE.CircleGeometry(1.35, 18), m: M4(0, 1.62, 0, -Math.PI / 2), c: [1.6, 0.7, 0.2] }]);
  // statue of 苏苏米: chipped stone pieces glued with sap, so it looks cracked; on a plinth
  {
    const c = [0.62, 0.61, 0.56], parts = [B(7, 3, 7, 0, 1.5, 0, [0.7, 0.68, 0.62])];
    parts.push({ g: new THREE.SphereGeometry(1, 10, 8), m: new THREE.Matrix4().makeScale(1.4, 2.2, 1.1).premultiply(M4(0, 6.2, 0)), c });
    parts.push({ g: new THREE.SphereGeometry(0.8, 10, 8), m: new THREE.Matrix4().makeScale(1, 0.85, 1.3).premultiply(M4(0, 9.1, 0.5)), c });
    parts.push({ g: new THREE.ConeGeometry(0.6, 4, 8), m: M4(0, 4.4, -1.8, -1.1, 0, 0), c });
    parts.push({ g: new THREE.CylinderGeometry(0.3, 0.4, 3, 8), m: M4(0.8, 6.3, 0.8, 0.5, 0, -0.4), c }, { g: new THREE.CylinderGeometry(0.3, 0.4, 3, 8), m: M4(-0.8, 6.3, 0.8, 0.5, 0, 0.4), c });
    G.ecStatue = merge(parts);
  }
  // a well: a ring of stones round dark water, a timber frame with a hanging bucket
  G.ecWell = merge([{ g: new THREE.CylinderGeometry(1.4, 1.5, 0.9, 14, 1, true), m: M4(0, 0.45, 0), c: [0.55, 0.53, 0.47] }, { g: new THREE.TorusGeometry(1.45, 0.18, 6, 16), m: M4(0, 0.9, 0, Math.PI / 2, 0, 0), c: [0.62, 0.6, 0.54] },
    { g: new THREE.CircleGeometry(1.35, 14), m: M4(0, 0.3, 0, -Math.PI / 2), c: [0.04, 0.06, 0.07] }, B(0.15, 2.6, 0.15, -1.5, 1.3, 0, [0.36, 0.27, 0.17]), B(0.15, 2.6, 0.15, 1.5, 1.3, 0, [0.36, 0.27, 0.17]),
    B(3.2, 0.15, 0.15, 0, 2.6, 0, [0.36, 0.27, 0.17]), { g: new THREE.CylinderGeometry(0.22, 0.18, 0.35, 8), m: M4(0, 1.6, 0), c: [0.4, 0.3, 0.2] }]);
  // paving: pure white stone (the avenue) and white sand (upper district lanes)
  G.ecPave = merge([B(6.05, 0.3, 6.05, 0, 0.05, 0, [1.12, 1.11, 1.06])], false);
  G.ecSand = merge([B(6.4, 0.2, 6.4, 0, 0.02, 0, [1.05, 1.0, 0.86])], false);
  // timber roost for 亚龙 on top of an egg boulder
  {
    const w = [0.42, 0.31, 0.19], parts = [B(9, 0.5, 6, 0, 4, 0, w)];
    for (const [x, z] of [[-4, -2.6], [4, -2.6], [-4, 2.6], [4, 2.6]]) parts.push(B(0.5, 4, 0.5, x, 2, z, w));
    parts.push(B(0.35, 3.2, 0.35, 0, 5.6, 0, w), B(7, 0.3, 0.3, 0, 7.1, 0, w));
    G.ecRoost = merge(parts);
  }
  G.ecWall = merge([SB(12.2, 10, 3, 0, 5, 0, [0.66, 0.64, 0.58]), SB(12.4, 1.4, 3.4, 0, 0.7, 0, [0.48, 0.5, 0.4]), SB(12.4, 0.7, 3.6, 0, 10.35, 0, [0.72, 0.7, 0.64])]);
  G.ecGate = merge([SB(4.5, 13, 4.5, 0, 6.5, 0, [0.68, 0.66, 0.6]), SB(5, 0.8, 5, 0, 13.4, 0, [0.74, 0.72, 0.66])]);
  for (const k of ['ecHouse', 'ecHouse2', 'ecHouse3', 'ecWall', 'ecGate', 'ecPalace']) G[k].mat = stoneMat;
  G.ecTall.mat = whiteMat;
  const COLL = { ecWell: 1.6, ecHouse2: 4.4, ecHouse3: 4.4, ecWall: 6.3, ecGate: 3, ecHouse: 4.4, ecShanty: 2, ecTall: 5.8, ecPalace: 38, ecHall: 18, ecBasin: 1.7, ecStatue: 4.5 };
  const LM_VIEW = { ecWall: { r: 6, h: 10, v: 80 }, ecGate: { r: 3, h: 13, v: 60 }, ecHouse: { r: 4.4, h: 5, v: 40 }, ecHouse2: { r: 4.4, h: 5, v: 40 }, ecHouse3: { r: 4.4, h: 8, v: 40 }, ecShanty: { r: 2, h: 2.5, v: 25 },
    ecTall: { r: 6, h: 15, v: 60 }, ecPalace: { r: 42, h: 40, v: 220 }, ecHall: { r: 24, h: 13, v: 120 }, ecBasin: { r: 1.6, h: 1.6, v: 15 },
    ecStatue: { r: 4.5, h: 10, v: 45 }, ecPave: { r: 0, h: 0, v: 20 }, ecSand: { r: 0, h: 0, v: 20 }, ecRoost: { r: 0, h: 7, v: 40 }, ecWell: { r: 1.6, h: 2.6, v: 15 } };
  // level of detail: the full houses within ~280 m, plain stone blocks beyond
  const HI = {}, lo = (w, d, h, extra = []) => merge([SB(w, h, d, 0, h / 2, 0, stone), SB(w + 0.2, 0.55, d + 0.2, 0, h + 0.27, 0, [0.66, 0.63, 0.56]), ...extra]);
  const LO = { ecHouse: lo(7, 7, 4.5), ecHouse2: lo(8, 6.5, 4.2), ecHouse3: lo(7.5, 7.5, 4.6, [SB(4.1, 2.8, 4.5, -1.5, 6, -1.1, stone)]), ecTall: lo(9, 9, 11.3) };
  for (const k in LO) { HI[k] = { ...G[k], noImp: true, rHi: 280 }; G[k] = LO[k]; G[k].mat = HI[k].mat; }
  return { GEOS: G, HI, COLL, LM_VIEW, STATIC: Object.keys(G) };
}
