'use strict';
/* the pack's colours mended as each model comes in (packFix, PACK.fix; cf-pol-modelos), on the real models/pack/*.glb: every triangle of a
   colour that goes over to the paint is in a paint primitive (none left in the white 'fixed' one, where it would show grey or white
   whatever the side), the tracks and tyres are a dark neutral (no blue, no brown), the colours mapped are gone, and no triangle is lost.
   The block runs here with a geometry stub in place of three.js; the models are read with the pack's own reader (tools/pack/glb.js) */
const fs = require('fs'), path = require('path'), vm = require('vm'), H = require('./harness'), { ok, done } = H, G = require('../tools/pack/glb.js');
const html = fs.readFileSync(H.PAGE, 'utf8'), a = html.indexOf("/* ---------- the pack's own colours"), b = html.indexOf('/* the model id, or null while it is not here');
console.log('page: ' + H.PAGE);
if (a < 0 || b < 0) { console.log('no pack colour fixes (packFix): a page before them'); process.exit(0); }
class Attr { constructor(array, itemSize, normalized) { this.array = array; this.itemSize = itemSize; this.normalized = !!normalized; this.count = array.length / itemSize; } }
class Geo { constructor() { this.attributes = {}; this.index = null; this.userData = {}; } setAttribute(n, at) { this.attributes[n] = at; } setIndex(at) { this.index = at; } computeBoundingSphere() {} computeBoundingBox() {} }
const ctx = vm.createContext({ console, PACK: {}, THREE: { BufferAttribute: Attr, BufferGeometry: Geo }, packNorm: arr => (arr instanceof Uint8Array ? 255 : arr instanceof Uint16Array ? 65535 : 1) });
vm.runInContext(html.slice(a, b) + '\n;globalThis.$ = s => eval(s);', ctx, { filename: 'packfix.js' });
const PACK = ctx.$('PACK'), packFix = ctx.$('packFix');

/* a model as packRead gives it: nodes, the parts by name, and per mesh its primitives (geometry with position, colour and index; 0 paint, 1 fixed) */
function load(id) {
  const { J, acc } = G.read(path.join(H.ROOT, 'models', 'pack', id + '.glb'));
  const nodes = J.nodes.map(n => ({ name: n.name || '', mesh: n.mesh, skin: n.skin }));
  const meshes = (J.meshes || []).map(m => m.primitives.map(p => {
    const g = new Geo(), pos = acc(p.attributes.POSITION), col = acc(p.attributes.COLOR_0), idx = acc(p.indices);
    g.setAttribute('position', new Attr(Float32Array.from(pos), 3));
    g.setAttribute('color', new Attr(Uint8Array.from(col, v => Math.round(v * 255)), 3, true));
    g.setIndex(new Attr(idx.length / 3 > 65535 ? Uint32Array.from(idx) : Uint16Array.from(idx), 1));
    return { g, mat: p.material || 0 };
  }));
  return { nodes, meshes, parts: Object.fromEntries(nodes.map((n, i) => [n.name, i]).filter(([, i]) => nodes[i].mesh !== undefined && nodes[i].skin === undefined)) };
}
const partOf = (P, part) => (P.parts[part] !== undefined ? P.parts[part] : P.nodes.findIndex(n => n.name === part && n.mesh !== undefined));
const rgb = (A, v) => [A[v * 3] / 255, A[v * 3 + 1] / 255, A[v * 3 + 2] / 255], hexRgb = h => [(h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255];
const near = (c, h, tol) => hexRgb(h).every((x, i) => Math.abs(x - c[i]) <= tol);
const tris = prims => prims.reduce((n, p) => n + p.g.index.array.length / 3, 0);

console.log('-- the models with fixes --');
const ids = Object.keys(PACK.fix);
ok(ids.length > 0 && ids.every(id => fs.existsSync(path.join(H.ROOT, 'models', 'pack', id + '.glb'))), 'each fixed model is in models/pack: ' + ids.join(' '));
const tol = ctx.$('PACKFIX').tol / 255;
for (const id of ids) {
  const P = load(id), F = PACK.fix[id], before = { paint0: {} };
  for (const part in F) { const i = partOf(P, part); if (i >= 0) { before[part] = tris(P.meshes[P.nodes[i].mesh]); before.paint0[part] = P.meshes[P.nodes[i].mesh].filter(p => !p.mat).length; } }
  /* the colours each part had, to know which rules had something to do */
  const had = {};
  for (const part in F) { const i = partOf(P, part); if (i < 0) continue; had[part] = []; for (const pr of P.meshes[P.nodes[i].mesh]) if (pr.mat) { const A = pr.g.attributes.color.array; for (let v = 0; v < A.length / 3; v++) had[part].push(rgb(A, v)); } }
  packFix(id, P);
  console.log(id + ': ' + Object.keys(F).join(', '));
  for (const part in F) {
    const i = partOf(P, part); if (i < 0) { ok(false, part + ': no such part in the model'); continue; }
    const prims = P.meshes[P.nodes[i].mesh], fixed = prims.filter(p => p.mat), paint = prims.filter(p => !p.mat), rules = F[part];
    ok(tris(prims) === before[part] && prims.filter(p => !p.mat).length <= Math.max(1, before.paint0[part]), part + ': no triangle lost (' + before[part] + '), and no paint primitive more where the part had one');
    for (const [cols, to] of rules) {
      const used = had[part].some(c => cols === '*' || cols.some(h => near(c, h, tol)));
      if (!used) { ok(false, part + ': the rule for ' + (cols === '*' ? 'any colour' : cols.map(h => '#' + h.toString(16).padStart(6, '0')).join(' ')) + ' matches nothing in the model'); continue; }
      if (typeof to === 'number' && to <= 1) {
        const left = fixed.reduce((n, p) => { const A = p.g.attributes.color.array, I = p.g.index.array; let m = 0; for (let t = 0; t < I.length; t += 3) if (Math.abs(A[I[t] * 3] / 255 - to) < .01 && Math.abs(A[I[t] * 3 + 2] / 255 - to) < .01) m++; return n + m; }, 0);
        const moved = paint.reduce((n, p) => { const A = p.g.attributes.color.array, I = p.g.index.array; let m = 0; for (let t = 0; t < I.length; t += 3) if (Math.abs(A[I[t] * 3] / 255 - to) < .01) m++; return n + m; }, 0);
        ok(!left && moved > 0, part + ': ' + moved + ' triangles go over to the paint at ' + to + ', none left grey in the fixed colours');
      } else if (to === 'steel') {
        const bad = fixed.some(p => { const A = p.g.attributes.color.array; for (let v = 0; v < A.length / 3; v++) { const c = rgb(A, v); if (cols === '*' || had[part][v]) { if (Math.max(...c) > .42 || Math.max(...c) - Math.min(...c) > .04) return cols === '*' || cols.some(h => near(had[part][v], h, tol)); } } return false; });
        ok(!bad, part + ': ' + (cols === '*' ? 'all of it' : 'that colour') + ' a dark neutral steel');
      } else {
        const gone = fixed.every(p => { const A = p.g.attributes.color.array; for (let v = 0; v < A.length / 3; v++) if (cols.some(h => near(rgb(A, v), h, tol / 2))) return false; return true; });
        ok(gone, part + ': ' + cols.map(h => '#' + h.toString(16).padStart(6, '0')).join(' ') + ' became #' + to.toString(16).padStart(6, '0'));
      }
    }
  }
}
done();
