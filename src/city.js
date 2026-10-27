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

  // common district: square stone houses on a street grid (a street every fifth lot), the avenue kept clear
  for (let i = -95; i <= 95; i++) for (let j = -95; j <= 95; j++) {
    if (i % 5 === 0 || j % 5 === 0) continue;
    const e = i * 15 + (rnd(i * 191 + j) - 0.5) * 2, n = j * 15 + (rnd(i * 7 + j * 313) - 0.5) * 2;
    const r = Math.hypot(e, n), th = Math.atan2(n, e);
    if (r < 350 || r > wallR(th) - 22 || (Math.abs(e) < 16 && n < 0) || nearBoulder(e, n, 34)) continue;
    if (rnd(i * 53 + j * 97) < 0.12) continue;   // yards and gaps
    put('ecHouse', e, n, 0.8 + 0.5 * rnd(i * 31 + j * 17), 0, (rnd(i + j * 3) < 0.5 ? 0 : Math.PI / 2));
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
export function buildCityGeos({ THREE, merge, M4 }) {
  const B = (w, h, d, x, y, z, c, ry = 0) => ({ g: new THREE.BoxGeometry(w, h, d), m: M4(x, y, z, 0, ry, 0), c });
  const stone = [0.6, 0.58, 0.52], white = [0.88, 0.87, 0.82], dark = [0.1, 0.09, 0.08];
  const G = {};
  // 10 m wall of squared stone blocks (older courses greyer and mossy at the foot)
  G.ecWall = merge([B(12.2, 10, 3, 0, 5, 0, [0.62, 0.6, 0.55]), B(12.2, 1.2, 3.2, 0, 0.6, 0, [0.42, 0.45, 0.34]), B(12.4, 0.7, 3.6, 0, 10.35, 0, [0.7, 0.68, 0.62]),
    B(12.3, 0.15, 3.1, 0, 3.3, 0, [0.52, 0.5, 0.46]), B(12.3, 0.15, 3.1, 0, 6.7, 0, [0.52, 0.5, 0.46])]);
  G.ecGate = merge([B(4.5, 13, 4.5, 0, 6.5, 0, [0.66, 0.64, 0.58]), B(5, 0.8, 5, 0, 13.4, 0, [0.72, 0.7, 0.64])]);
  // square stone house of builders and farmers: flat roof with a low parapet, a dark doorway
  G.ecHouse = merge([B(7, 4.5, 7, 0, 2.25, 0, stone), B(7.3, 0.6, 0.4, 0, 4.8, 3.45, [0.66, 0.63, 0.56]), B(7.3, 0.6, 0.4, 0, 4.8, -3.45, [0.66, 0.63, 0.56]),
    B(0.4, 0.6, 7.3, 3.45, 4.8, 0, [0.66, 0.63, 0.56]), B(0.4, 0.6, 7.3, -3.45, 4.8, 0, [0.66, 0.63, 0.56]), B(1.4, 2.3, 0.12, 0, 1.15, 3.52, dark),
    B(2.6, 0.08, 1.8, 1.2, 4.55, 1.2, [0.5, 0.34, 0.2])]);
  // piled-stone shanty with a hide awning on poles
  {
    const parts = [];
    for (let i = 0; i < 6; i++) parts.push({ g: new THREE.IcosahedronGeometry(0.9 + (i % 3) * 0.2, 0), m: M4(Math.cos(i * 1.1) * 1.3, 0.6 + (i > 3 ? 0.9 : 0), Math.sin(i * 1.1) * 1.0), c: [0.48, 0.46, 0.4] });
    parts.push({ g: new THREE.PlaneGeometry(3.4, 2.6), m: M4(0.4, 2.3, 0.6, -1.2, 0, 0), c: [0.5, 0.36, 0.22] });
    parts.push(B(0.12, 2.4, 0.12, 1.9, 1.2, 1.6, [0.35, 0.26, 0.16]), B(0.12, 2.4, 0.12, -1.1, 1.2, 1.6, [0.35, 0.26, 0.16]));
    G.ecShanty = merge(parts);
  }
  // tall white house of the upper district, a statue on the roof and a hide hung by the door
  {
    const parts = [B(9, 11, 9, 0, 5.5, 0, white), B(9.4, 0.7, 9.4, 0, 11.35, 0, [0.94, 0.93, 0.88]), B(1.6, 2.8, 0.12, 0, 1.4, 4.52, dark),
      B(2.2, 3, 0.06, 2.4, 2.6, 4.55, [0.55, 0.4, 0.25]), B(1.4, 1.2, 1.4, 0, 12.3, 0, [0.8, 0.79, 0.74]),
      { g: new THREE.SphereGeometry(0.7, 10, 8), m: new THREE.Matrix4().makeScale(1, 1.4, 0.8).premultiply(M4(0, 13.9, 0)), c: [0.8, 0.79, 0.74] },
      { g: new THREE.SphereGeometry(0.38, 8, 6), m: M4(0, 15.2, 0.25), c: [0.8, 0.79, 0.74] }];
    G.ecTall = merge(parts);
  }
  // the palace: a very large square hall with a pyramid roof, a 暴君巨蜥 skull over each door; rock-and-sap walls
  {
    const parts = [B(60, 14, 60, 0, 7, 0, [0.8, 0.77, 0.7]), B(61, 1, 61, 0, 14.5, 0, [0.86, 0.84, 0.78]),
      { g: new THREE.ConeGeometry(43, 26, 4), m: M4(0, 28, 0, 0, Math.PI / 4, 0), c: [0.72, 0.68, 0.6] }];
    for (let s = 0; s < 4; s++) {
      const a = s * Math.PI / 2, cx = Math.sin(a), cz = Math.cos(a);
      parts.push(B(6, 8, 0.2, cx * 30.1, 4, cz * 30.1, dark, a));
      parts.push({ g: new THREE.SphereGeometry(2.4, 12, 9), m: new THREE.Matrix4().makeScale(1.3, 0.9, 1).premultiply(M4(cx * 31, 10, cz * 31)), c: [0.9, 0.87, 0.78] });
      parts.push({ g: new THREE.ConeGeometry(0.7, 2.6, 6), m: M4(cx * 32.2 + cz * 1.5, 8.2, cz * 32.2 - cx * 1.5, Math.PI, 0, 0), c: [0.92, 0.9, 0.82] });
      parts.push({ g: new THREE.ConeGeometry(0.7, 2.6, 6), m: M4(cx * 32.2 - cz * 1.5, 8.2, cz * 32.2 + cx * 1.5, Math.PI, 0, 0), c: [0.92, 0.9, 0.82] });
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
  const COLL = { ecWall: 6.3, ecGate: 3, ecHouse: 4.4, ecShanty: 2, ecTall: 5.8, ecPalace: 38, ecHall: 18, ecBasin: 1.7, ecStatue: 4.5 };
  const LM_VIEW = { ecWall: { r: 6, h: 10, v: 80 }, ecGate: { r: 3, h: 13, v: 60 }, ecHouse: { r: 4.4, h: 5, v: 40 }, ecShanty: { r: 2, h: 2.5, v: 25 },
    ecTall: { r: 6, h: 15, v: 60 }, ecPalace: { r: 42, h: 40, v: 220 }, ecHall: { r: 24, h: 13, v: 120 }, ecBasin: { r: 1.6, h: 1.6, v: 15 },
    ecStatue: { r: 4.5, h: 10, v: 45 }, ecPave: { r: 0, h: 0, v: 20 }, ecSand: { r: 0, h: 0, v: 20 }, ecRoost: { r: 0, h: 7, v: 40 } };
  return { GEOS: G, COLL, LM_VIEW, STATIC: Object.keys(G) };
}
