'use strict';
/* the rocks (ROCKS, rockGeo; cf-pol-modelos): each boulder is the old dodecahedron with its corners pushed in or out, and stays whole and in
   the old one's box: every copy of a corner (the geometry repeats it on each face it closes) goes to the same place, so no face parts from
   its neighbour and no crack shows the sky through a rock; as wide as before, its top as high, its foot as far under the ground; no corner
   and no face more; and, if there are several, the boulders differ. The 3D part is not loaded by the harness: the block runs here with a dodecahedron of its own,
   built as three.js builds it (its corners, its faces, each corner copied on each face) */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8'), a = html.indexOf('const ROCKS = '), b = html.indexOf('function buildWorld()', a);
console.log('page: ' + H.PAGE);
if (a < 0 || b < 0) { console.log('no boulders (ROCKS): a page before them'); process.exit(0); }
const t = (1 + Math.sqrt(5)) / 2, r = 1 / t;
const V = [-1, -1, -1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, -1, -1, 1, -1, 1, 1, 1, -1, 1, 1, 1, 0, -r, -t, 0, -r, t, 0, r, -t, 0, r, t, -r, -t, 0, -r, t, 0, r, -t, 0, r, t, 0, -t, 0, -r, t, 0, -r, -t, 0, r, t, 0, r];
const F = [3, 11, 7, 3, 7, 15, 3, 15, 13, 7, 19, 17, 7, 17, 6, 7, 6, 15, 17, 4, 8, 17, 8, 10, 17, 10, 6, 8, 0, 16, 8, 16, 2, 8, 2, 10, 0, 12, 1, 0, 1, 18, 0, 18, 16, 6, 10, 2, 6, 2, 13, 6, 13, 15, 2, 16, 18, 2, 18, 3, 2, 3, 13, 18, 1, 9, 18, 9, 11, 18, 11, 3, 4, 14, 12, 4, 12, 0, 4, 0, 8, 11, 9, 5, 11, 5, 19, 11, 19, 7, 19, 5, 14, 19, 14, 4, 19, 4, 17, 1, 12, 14, 1, 14, 5, 1, 5, 9];
class Dodeca {
  constructor(rad) { const A = []; for (const i of F) { const l = Math.hypot(V[i * 3], V[i * 3 + 1], V[i * 3 + 2]); A.push(V[i * 3] / l * rad, V[i * 3 + 1] / l * rad, V[i * 3 + 2] / l * rad); } this.attributes = { position: { array: Float32Array.from(A), count: A.length / 3 } }; }
  computeBoundingBox() { const A = this.attributes.position.array, mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; for (let i = 0; i < A.length; i++) { mn[i % 3] = Math.min(mn[i % 3], A[i]); mx[i % 3] = Math.max(mx[i % 3], A[i]); } const box = (p, q) => ({ min: { x: p[0], y: p[1], z: p[2] }, max: { x: q[0], y: q[1], z: q[2] }, clone() { return box(p.slice(), q.slice()); } }); this.boundingBox = box(mn, mx); }
  translate(x, y, z) { const A = this.attributes.position.array; for (let i = 0; i < A.length; i += 3) { A[i] += x; A[i + 1] += y; A[i + 2] += z; } return this; }
  scale(x, y, z) { const A = this.attributes.position.array; for (let i = 0; i < A.length; i += 3) { A[i] *= x; A[i + 1] *= y; A[i + 2] *= z; } return this; }
  computeVertexNormals() {}
}
const sim = H.load(), ctx = vm.createContext({ THREE: { DodecahedronGeometry: Dodeca }, hash2: sim.$('hash2') });
vm.runInContext(html.slice(a, b) + '\n;globalThis.$ = s => eval(s);', ctx, { filename: 'rocks.js' });
const ROCKS = ctx.$('ROCKS'), rockGeo = ctx.$('rockGeo'), old = new Dodeca(1); old.computeBoundingBox(); const o = old.boundingBox;

console.log('-- the boulders --');
const shapes = [];
for (let k = 0; k < ROCKS.n; k++) {
  const g = rockGeo(k), A = g.attributes.position.array; g.computeBoundingBox(); const B = g.boundingBox;
  let gap = 0; const at = {};
  F.forEach((c, n) => { const p = [A[n * 3], A[n * 3 + 1], A[n * 3 + 2]]; if (at[c]) gap = Math.max(gap, Math.hypot(p[0] - at[c][0], p[1] - at[c][1], p[2] - at[c][2])); else at[c] = p; });
  ok(A.length === F.length * 3 && gap < 1e-5, 'boulder ' + k + ': ' + F.length / 3 + ' faces as before, every copy of a corner in one place (the widest gap ' + gap.toExponential(1) + ')');
  const w = (B.max.x - B.min.x) / (o.max.x - o.min.x), d = (B.max.z - B.min.z) / (o.max.z - o.min.z);
  ok(Math.abs(w - 1) < 1e-4 && Math.abs(d - 1) < 1e-4 && Math.abs(B.max.y - ROCKS.top) < 1e-4 && Math.abs(B.min.y + ROCKS.bot) < 1e-4 && Math.abs(B.min.x + B.max.x) < 1e-4 && Math.abs(B.min.z + B.max.z) < 1e-4, '  in the old box: as wide (' + w.toFixed(3) + ', ' + d.toFixed(3) + '), its top at ' + B.max.y.toFixed(2) + ', its foot ' + (-B.min.y).toFixed(2) + ' under the ground, on its middle');
  shapes.push(Array.from(Object.values(at)).map(p => p.map(v => v.toFixed(3)).join()).join('|'));
}
ok(ROCKS.n >= 1 && new Set(shapes).size === ROCKS.n, ROCKS.n > 1 ? 'the ' + ROCKS.n + ' boulders all differ' : 'one boulder for every rock (each with its own turn, width and height)');
done();
