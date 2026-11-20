'use strict';
/* RIX (cf-lag-2): railOf reads the main roads' segments through a grid instead of every point of every road, sOn keeps each road's 50 m
   samples, and lsRail no longer asks railOf again for each road. The answers must be the same numbers as before, to the last bit, on the
   maps of every era (a forward base's pick, the depth of a site and the whole plan read them). The reference is the old code, copied here */
const H = require('./harness'), ok = H.ok;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const OLD = {
  railOf(R, x, z) {
    let b = { d: 1e9 };
    for (let ri = 0; ri < R.length; ri++) {
      const r = R[ri];
      for (let i = 1; i < r.length; i++) {
        const a = r[i - 1], ex = r[i].x - a.x, ez = r[i].z - a.z, L = Math.sqrt(ex * ex + ez * ez) || 1, t = clamp(((x - a.x) * ex + (z - a.z) * ez) / (L * L), 0, 1), ox = x - a.x - ex * t, oz = z - a.z - ez * t, d = Math.sqrt(ox * ox + oz * oz);
        if (d < b.d) b = { d, ri, s: a.s + L * t, off: (oz * ex - ox * ez) / L };
      }
    }
    return b;
  },
  sOn(C, R, ri, x, z) {
    const p = OLD.railOf(R, x, z); if (p.ri === ri) return p.s;
    const r = R[ri], routeAt = C.$('routeAt'); let bs = 0, bd = 1e9;
    for (let s = 0; s <= r.len; s += 50) { const q = routeAt(r, s), d = Math.hypot(q.x - x, q.z - z); if (d < bd) { bd = d; bs = s; } }
    return bs;
  },
  lsRail(C, R, t, x, z) {
    const p = OLD.railOf(R, x, z), my = C.$('lsRoutes')(t), routeAt = C.$('routeAt'); if (!my.length || my.includes(p.ri)) return p;
    let b = null;
    for (const ri of my) { const s = OLD.sOn(C, R, ri, x, z), q = routeAt(R[ri], s), d = Math.hypot(q.x - x, q.z - z); if (!b || d < b.d) b = { d, ri, s, off: d }; }
    return b;
  }
};
const same = (a, b) => { const ka = Object.keys(a).sort(), kb = Object.keys(b).sort(); return ka.join() === kb.join() && ka.every(k => Object.is(a[k], b[k])); };
const show = o => JSON.stringify(o, (k, v) => (typeof v === 'number' && !Number.isFinite(v) ? String(v) : v));

for (const [era, mv, N] of [['modern', 11, 3], ['ww2', 11, 2], ['modern', 11, 2], ['modern', 1, 2], ['ww2', 4, 2]]) {
  console.log('-- ' + era + ', map version ' + mv + ', ' + N + ' sides --');
  const C = H.load({ seed: 3, mapv: mv }), S = C.newState(era, null, { N }), R = S.T.routes, railOf = C.$('railOf'), sOn = C.$('sOn'), lsRail = C.$('lsRail'), X = C.$('rixOf')(R), c = C.$('RIX').c;
  const rnd = H.rng(mv * 7 + N), pts = [];
  const W = S.W, HW = S.HW;
  for (let i = 0; i < 3000; i++) pts.push([-2500 + rnd() * (W + 5000), -HW - 2500 + rnd() * (2 * HW + 5000)]);   // over the map and off it
  for (const r of R) for (let i = 0; i < r.length; i++) { pts.push([r[i].x, r[i].z]); if (i) pts.push([(r[i].x + r[i - 1].x) / 2, (r[i].z + r[i - 1].z) / 2]); }   // on the road: a vertex is a tie of two segments
  for (let i = 0; i < 400; i++) { const k = Math.floor(rnd() * X.nx), j = Math.floor(rnd() * X.nz); pts.push([X.x0 + k * c, X.z0 + j * c + rnd() * c], [X.x0 + k * c + rnd() * c, X.z0 + j * c], [X.x0 + k * c, X.z0 + j * c]); }   // on the squares' edges
  pts.push([1e6, 0], [0, -1e6], [-1e7, 1e7], [NaN, 0], [0, NaN], [Infinity, 3]);
  let bad = null, n = 0;
  for (const [x, z] of pts) { const a = railOf(x, z), b = OLD.railOf(R, x, z); n++; if (!same(a, b)) { bad = [x, z, show(a), show(b)]; break; } }
  ok(!bad, 'railOf: the same d, ri, s and off as the loop over every segment at ' + n + ' points (the vertices, the squares\' edges, off the map, not a number)' + (bad ? ': ' + bad.join(' ') : ''));
  // how many segments a point reads now
  let seen = 0; const scan = C.$('rixScan'); C.$('globalThis').__rs = (Xr, k, x, z) => { seen += Xr.at[k + 1] - Xr.at[k]; return scan(Xr, k, x, z); }; C.$('rixScan = globalThis.__rs');
  let q = 0; for (const [x, z] of pts.slice(0, 3000)) { railOf(x, z); q++; }
  C.$('globalThis').__rs = scan; C.$('rixScan = globalThis.__rs');
  const all = R.reduce((a, r) => a + r.length - 1, 0);
  ok(seen / q < all / 4, 'and reads ' + (seen / q).toFixed(0) + ' segments a point on the map instead of all ' + all);
  bad = null; n = 0;
  for (let i = 0; i < 600 && !bad; i++) { const [x, z] = pts[i], ri = i % R.length, a = sOn(ri, x, z), b = OLD.sOn(C, R, ri, x, z); n++; if (!Object.is(a, b)) bad = [x, z, ri, a, b]; }
  ok(!bad, 'sOn: the same s on each road at ' + n + ' points' + (bad ? ': ' + bad.join(' ') : ''));
  bad = null; n = 0;
  for (let i = 0; i < 900 && !bad; i++) { const [x, z] = pts[(i * 7) % pts.length], t = i % N, a = lsRail(t, x, z), b = OLD.lsRail(C, R, t, x, z); n++; if (!same(a, b)) bad = [t, x, z, show(a), show(b)]; }
  ok(!bad, 'lsRail: the same road, s and distance for every side at ' + n + ' points' + (bad ? ': ' + bad.join(' ') : ''));
}

console.log('-- a road added after the first question: the grid is built again --');
{
  const C = H.load({ seed: 3, mapv: 11 }), S = C.newState('modern', null, { N: 2 }), R = S.T.routes, railOf = C.$('railOf');
  railOf(100, 100);
  const r = C.$('polyOf')([{ x: 500, z: -300 }, { x: 900, z: -300 }]); r.ends = [0, 1]; R.push(r);
  const a = railOf(700, -310), b = OLD.railOf(R, 700, -310);
  R.pop();
  ok(same(a, b) && a.ri === R.length, 'railOf finds the new road (' + show(a) + ')');
  const c = railOf(700, -310); ok(same(c, OLD.railOf(R, 700, -310)), 'and forgets it once it is gone');
}
H.done();
