'use strict';
/* the ground the scene draws, and what stands on it (cf-pol-cenario). The match stands on hgtT, the four corners of a grid cell blended
   (bilinear); the terrain mesh was a THREE.PlaneGeometry, two flat triangles a cell, which on the hills stood up to 46 m off that blend:
   about 2000 trees a map floated over the drawn ground (up to 18 m) or sank into it, rocks and bushes floated up to 9 m, and on one road
   sample in seven the ribbon laid on hgtT was buried under the drawn ground or flew over it. Checked here without a browser:
   - fanMesh: four triangles a cell round its middle, all facing up, the grid's nodes at their index and height (the bridges sink them by
     index), each middle the mean of its corners; meshT is the drawn ground (the triangles of fanMesh, by barycentric weights, at 20000 points);
   - the drawn ground is much nearer the blend than the two triangles were (worst and share over 0.5 m), so vehicles and soldiers, which stand
     on hgtT, stand nearer what is drawn;
   - the scene stands the trees, rocks and bushes, the grass, the undergrowth, the streets and the marks on the drawn ground (meshH, gndY),
     and meshH is meshT (a scan of the page's scene code: it does not run in Node);
   - the road ribbon's deck is ROADH over the drawn ground away from the river, and over the match's ground in a crossing's channel (the
     causeway the bridge stands on, which the drawn ground dips under), with no step between the two;
   - no building's floor is under the drawn ground, and its footing (4 m) reaches it all round;
   - the cameras keep over the drawn ground as well as over the match's (camG) */
const H = require('./harness');
const { ok, done } = H;
const C = H.load({ seed: 3, mapv: 11 }), $ = C.$, src = H.source();
const html = require('fs').readFileSync(H.PAGE, 'utf8'), scene = html.slice(html.indexOf('/* ---------- 3D scene'));

/* the old mesh, for the comparison: two triangles a cell split from node (i, j + 1) to node (i + 1, j), as PlaneGeometry split it */
const tri2 = (T, x, z) => { const N = T.N, gx = Math.min(Math.max((x - T.x0) / T.cx, 0), N - .001), gz = Math.min(Math.max((z - T.z0) / T.cz, 0), N - .001), i = gx | 0, j = gz | 0, u = gx - i, v = gz - j, k = j * (N + 1) + i, h = T.h;
  const a = h[k], d = h[k + 1], b = h[k + N + 1], c = h[k + N + 2]; return u + v <= 1 ? a + (d - a) * u + (b - a) * v : c + (b - c) * (1 - u) + (d - c) * (1 - v); };
/* the drawn ground from fanMesh's own arrays: the triangle of the four of the point's cell that holds it */
function drawn(F, T, x, z) {
  const N = T.N, i = Math.min(N - 1, Math.max(0, Math.floor((x - T.x0) / T.cx))), j = Math.min(N - 1, Math.max(0, Math.floor((z - T.z0) / T.cz))), P = F.pos, q = j * N + i;
  for (let t = 0; t < 4; t++) {
    const [A, B, D] = [0, 1, 2].map(e => { const k = F.idx[q * 12 + t * 3 + e]; return [P[k * 3], P[k * 3 + 1], P[k * 3 + 2]]; }), d = (B[2] - D[2]) * (A[0] - D[0]) + (D[0] - B[0]) * (A[2] - D[2]);
    const w1 = ((B[2] - D[2]) * (x - D[0]) + (D[0] - B[0]) * (z - D[2])) / d, w2 = ((D[2] - A[2]) * (x - D[0]) + (A[0] - D[0]) * (z - D[2])) / d, w3 = 1 - w1 - w2;
    if (w1 >= -1e-7 && w2 >= -1e-7 && w3 >= -1e-7) return w1 * A[1] + w2 * B[1] + w3 * D[1];
  }
  return NaN;
}

for (const [era, n] of [['ww2', 2], ['modern', 2], ['modern', 3]]) {
  const T = $('genTerrain')(era, 11, n), F = $('fanMesh')(T), meshT = $('meshT'), hgtT = $('hgtT'), tag = era + (n === 3 ? ' (3 lados)' : ''), N = T.N, N1 = N + 1;
  let up = 0, mid = 0, node = 0;
  for (let t = 0; t < F.idx.length; t += 3) {
    const p = [0, 1, 2].map(e => F.idx[t + e] * 3), ax = F.pos[p[1]] - F.pos[p[0]], az = F.pos[p[1] + 2] - F.pos[p[0] + 2], bx = F.pos[p[2]] - F.pos[p[0]], bz = F.pos[p[2] + 2] - F.pos[p[0] + 2];
    if (az * bx - ax * bz > 0) up++;   // the y of (a × b): the face looks up
  }
  for (let k = 0; k < F.NN; k++) if (F.pos[k * 3 + 1] !== T.h[k] || Math.abs(F.pos[k * 3] - (T.x0 + (k % N1) * T.cx)) > 1e-3 || Math.abs(F.pos[k * 3 + 2] - (T.z0 + Math.floor(k / N1) * T.cz)) > 1e-3) node++;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * N1 + i, m = F.NN + j * N + i; if (Math.abs(F.pos[m * 3 + 1] - (T.h[a] + T.h[a + 1] + T.h[a + N1] + T.h[a + N1 + 1]) / 4) > 1e-3) mid++; }
  ok(F.pos.length / 3 === N1 * N1 + N * N && F.idx.length / 3 === 4 * N * N && up === 4 * N * N && !node && !mid,
    tag + ': fanMesh has ' + F.pos.length / 3 + ' vertices and ' + F.idx.length / 3 + ' triangles, ' + up + ' facing up; nodes off their place ' + node + ', middles off the mean ' + mid);

  let worst = 0, w0 = 0, w1 = 0, o0 = 0, o1 = 0, r = 7;
  for (let q = 0; q < 20000; q++) {
    r = (Math.imul(r, 1664525) + 1013904223) >>> 0; const x = -2000 + (r / 4294967296) * (T.W + 4000);
    r = (Math.imul(r, 1664525) + 1013904223) >>> 0; const z = (r / 4294967296 * 2 - 1) * (T.HW + 2000);
    const m = meshT(T, x, z), b = hgtT(T, x, z);
    worst = Math.max(worst, Math.abs(m - drawn(F, T, x, z)));
    if (b > T.WL + .5) { const e0 = Math.abs(tri2(T, x, z) - b), e1 = Math.abs(m - b); w0 = Math.max(w0, e0); w1 = Math.max(w1, e1); if (e0 > .5) o0++; if (e1 > .5) o1++; }
  }
  ok(worst < 1e-3, tag + ': meshT is the drawn ground (fanMesh\'s triangles) at 20000 points, worst ' + worst.toFixed(5) + ' m');
  ok(w1 <= w0 / 2 && o1 * 5 < o0, tag + ': the drawn ground stays near the match\'s (hgtT): worst ' + w0.toFixed(1) + ' m with two triangles a cell, ' + w1.toFixed(1) + ' m now; off by more than 0.5 m at ' + o0 + ' points of 20000, now ' + o1);

  let trees = [0, 0], bushes = [0, 0];
  for (const o of T.objs) if (o.k === 'tree' || o.k === 'rock' || o.k === 'bush') { const c = o.k === 'tree' ? trees : bushes, e0 = Math.abs(o.y - tri2(T, o.x, o.z)), e1 = Math.abs(o.y - meshT(T, o.x, o.z)); if (e0 > .5) c[0]++; if (e1 > .5) c[1]++; }
  console.log('       ' + tag + ': trees whose match height is more than 0.5 m off the drawn ground: ' + trees[0] + ' before, ' + trees[1] + ' now; rocks and bushes ' + bushes[0] + ', ' + bushes[1] + ' (the scene stands them on the drawn ground: 0 off)');

  /* the road ribbon: its deck on the drawn ground, or the causeway in a channel; no step between two rows */
  const RN = $('RN'), ROADH = $('ROADH'), S = C.sandbox(era === 'modern' && n === 3 ? 'modern' : era);
  if (S.T === T) {
    let off = 0, step = 0, rows = 0, cw = 0, worstStep = 0;
    for (const E of $('roadsOf')(T)) {
      const pos = [], idx = [];
      C.roadRibbon(E, RN.w[E.c], pos, idx);
      for (let v = 2; v < pos.length / 3; v += 5) {
        const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2], g = Math.max(T.WL, meshT(T, x, z)), inCh = (T.br || []).some(b => z > b.z0 && z < b.z1 && Math.abs(x - T.rx(z)) < b.gw);
        rows++; if (inCh) { cw++; if (Math.abs(y - ROADH - Math.max(g, hgtT(T, x, z))) > 1e-3) off++; } else if (y - ROADH < g - 1e-3) off++;
        if (v > 2) { const py = pos[(v - 5) * 3 + 1], px = pos[(v - 5) * 3], pz = pos[(v - 5) * 3 + 2], sl = Math.abs(meshT(T, x, z) - meshT(T, px, pz)), d = Math.abs(y - py) - sl; worstStep = Math.max(worstStep, d); if (d > 2.5) step++; }
      }
    }
    ok(!off && cw > 0, tag + ': the road deck is ROADH over the drawn ground, never under it (' + rows + ' rows), and on the causeway in the ' + cw + ' rows over a channel (' + off + ' off)');
    ok(!step, tag + ': no step in a road between two rows beyond the drawn ground\'s own slope (' + step + ' over 2.5 m, worst ' + worstStep.toFixed(2) + ' m)');
  }

  /* the buildings stand on the match's ground (o.y, their floor, 0.15 m over the highest blend at 9 points of the footprint): the drawn ground
     may rise through a ground floor where the blend does not; counted with the old mesh and the new one, the new no worse */
  let under = [0, 0], wu = [0, 0], hang = 0, wh = 0, nb = 0;
  for (const o of T.objs) if (o.k === 'bld') {
    nb++; const hi = [-1e9, -1e9]; let lo = 1e9;
    for (let e = -o.hw; e <= o.hw + 1e-9; e += o.hw / Math.ceil(o.hw)) for (let f = -o.hd; f <= o.hd + 1e-9; f += o.hd / Math.ceil(o.hd)) {
      const x = o.x + e * o.c + f * o.s, z = o.z - e * o.s + f * o.c, g = Math.max(T.WL, meshT(T, x, z)); hi[1] = Math.max(hi[1], g); lo = Math.min(lo, g); hi[0] = Math.max(hi[0], Math.max(T.WL, tri2(T, x, z)));
    }
    for (const q of [0, 1]) if (hi[q] > o.y + .04) { under[q]++; wu[q] = Math.max(wu[q], hi[q] - o.y); }
    if (lo < o.y - 4) { hang++; wh = Math.max(wh, o.y - lo); }
  }
  ok(nb > 600 && !hang, tag + ': every footing of ' + nb + ' buildings (4 m) reaches the drawn ground (' + hang + ' do not, worst ' + wh.toFixed(2) + ' m)');
  ok(under[1] <= under[0] && wu[1] <= wu[0] + 1e-6, tag + ': the drawn ground rises through the ground floor of ' + under[1] + ' buildings (worst ' + wu[1].toFixed(2) + ' m), with the old mesh ' + under[0] + ' (worst ' + wu[0].toFixed(2) + ' m)');
}

/* the scene's code: what stands on the ground is drawn on the drawn one */
const has = (re, what) => ok(re.test(scene), what);
has(/function meshH\(x, z\) \{[^\n]*meshT\(T, x, z/, 'the scene\'s meshH is meshT (with the nodes a fallen bridge sank)');
has(/const gndY = \(x, z\) => Math\.max\(S\.T\.WL, meshH\(x, z\)\)/, 'gndY is the drawn ground or the water over it');
has(/function treeAt[\s\S]{0,300}meshH\(o\.x, o\.z\) \+ Math\.cos\(f\) \* 12 \* s/, 'a tree stands (and falls) on the drawn ground');
has(/wo\.cv\[o\.id\][\s\S]{0,300}M\.v\.set\(o\.x, meshH\(o\.x, o\.z\) - \.25, o\.z\)/, 'a rock or a bush stands on the drawn ground');
has(/const y = gndY\(x, z\); if \(y < T\.WL \+ 3\) continue;/, 'the grass on the drawn ground');
has(/z = -HW \+ \(gj \+ h\(2\)\) \* U\.c, y = gndY\(x, z\)/, 'the undergrowth on the drawn ground');
has(/pos\.push\(l\[k\]\.x \+ nx, gndY\(/, 'the streets of the towns on the drawn ground');
has(/userData\.ground = 1/, 'the terrain mesh is marked as the ground (the graphics, the flares and the bridges find it by that, not by its type)');
ok(!/geometry\.type === 'PlaneGeometry'\) (ENV\.terrain|lit\.push)/.test(scene) && !/position\.count === n && o\.material && o\.material\.vertexColors\) K\.ter/.test(scene), 'nothing looks for the ground as a PlaneGeometry or by its vertex count any more');
ok(/roadG\(S\.T, x, z\)/.test(src), 'roadRibbon lays its deck on roadG');
/* the cameras: none goes down under the drawn ground where it rises over the match's (a chase view could sink into a hill) */
{
  const S = C.sandbox('modern'), T = S.T, camG = $('camG'), meshT = $('meshT'), hgt = $('hgt'); let low = 0, r = 11;
  for (let q = 0; q < 5000; q++) { r = (Math.imul(r, 1664525) + 1013904223) >>> 0; const x = (r / 4294967296) * T.W; r = (Math.imul(r, 1664525) + 1013904223) >>> 0; const z = (r / 4294967296 * 2 - 1) * T.HW; const g = camG(x, z); if (g < hgt(x, z) - 1e-9 || g < meshT(T, x, z) - 1e-9) low++; }
  ok(!low, 'camG is never under the match\'s ground nor under the drawn one (' + low + ' of 5000 points)');
  ok(/y: Math\.max\(u\.y \+ u\.def\.mh \+ 6 - d\.y \* 26, camG\(x, z\) \+ 2\.5\)/.test(src), 'the ground vehicle\'s chase eye stays over camG');
  const left = (scene.match(/(cp\.y|SPC\.y) = (clamp\()?Math\.max\((cp\.y|SPC\.y), (Math\.max\()?hgt\(/g) || []).length, used = (scene.match(/camG\(/g) || []).length;
  ok(!left && used >= 8, 'no camera keeps itself over hgt alone (' + left + ' left); ' + used + ' clamps over camG');
}
done();
