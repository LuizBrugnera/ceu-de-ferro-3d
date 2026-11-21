'use strict';
/* loose props cut from the pack's models as they come in (packCut, PACK.cut; cf-pol-testes-b), on the real models/pack/*.glb. The Kar98's
   source carried a stripper clip of five rounds lying beside the receiver: in first person it floated beside the rifle (the Schütze, the
   sniper), and the 1944 sniper's scope, which vmBuild puts on top of the weapon's box, floated 4 cm over the receiver. After the cut: the clip
   and only the clip is gone, its vertices too (the first-person weapon sizes itself by them), and the rifle is whole.
   The page's pack block runs with a geometry stub in place of three.js; the model is read with the pack's own reader (tools/pack/glb.js) */
const fs = require('fs'), path = require('path'), vm = require('vm'), H = require('./harness'), { ok, done } = H, G = require('../tools/pack/glb.js');
const html = fs.readFileSync(H.PAGE, 'utf8'), a = html.indexOf("/* ---------- the pack's own colours"), b = html.indexOf('/* the model id, or null while it is not here');
console.log('page: ' + H.PAGE);
class Attr { constructor(array, itemSize, normalized) { this.array = array; this.itemSize = itemSize; this.normalized = !!normalized; this.count = array.length / itemSize; } }
class Geo { constructor() { this.attributes = {}; this.index = null; this.userData = {}; } setAttribute(n, at) { this.attributes[n] = at; } setIndex(at) { this.index = at; } computeBoundingSphere() {} computeBoundingBox() {} }
const ctx = vm.createContext({ console, PACK: {}, packSkin: () => null, THREE: { BufferAttribute: Attr, BufferGeometry: Geo }, packNorm: arr => (arr instanceof Uint8Array ? 255 : arr instanceof Uint16Array ? 65535 : 1) });
vm.runInContext(html.slice(a, b) + '\n;globalThis.$ = s => eval(s);', ctx, { filename: 'pack.js' });
const has = (() => { try { return typeof ctx.$('packCut') === 'function'; } catch (e) { return false; } })();
ok(has, 'the page cuts loose props from the pack\'s models (packCut, PACK.cut)');
ok(/e\.d = packCut\(id, packFix\(id, packRead\(b\)\)\)/.test(html), 'packGet cuts each model as it comes in, after its colours');
if (has) {
  const load = id => {
    const { J, acc } = G.read(path.join(H.ROOT, 'models', 'pack', id + '.glb'));
    const nodes = J.nodes.map(n => ({ name: n.name || '', mesh: n.mesh }));
    const meshes = (J.meshes || []).map(m => m.primitives.map(p => {
      const g = new Geo(), pos = acc(p.attributes.POSITION), col = acc(p.attributes.COLOR_0), idx = acc(p.indices);
      g.setAttribute('position', new Attr(Float32Array.from(pos), 3)); g.setAttribute('color', new Attr(Uint8Array.from(col, v => Math.round(v * 255)), 3, true));
      g.setIndex(new Attr(Uint16Array.from(idx), 1)); return { g, mat: p.material || 0 };
    }));
    return { nodes, meshes, parts: Object.fromEntries(nodes.map((n, i) => [n.name, i]).filter(([, i]) => nodes[i].mesh !== undefined)) };
  };
  const box = P => { let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9], t = 0; for (const pr of P.meshes[P.nodes[P.parts.hull].mesh]) { const X = pr.g.attributes.position.array; t += pr.g.index.array.length / 3; for (let v = 0; v < X.length; v += 3) for (let c = 0; c < 3; c++) { mn[c] = Math.min(mn[c], X[v + c]); mx[c] = Math.max(mx[c], X[v + c]); } } return { mn, mx, t }; };
  const f = n => n.toFixed(3);
  const P = load('w_kar98'), A = box(P), n0 = P.meshes[P.nodes[P.parts.hull].mesh][0].g.attributes.position.count;
  ctx.$('packCut')('w_kar98', P);
  const B = box(P);
  ok(A.mx[2] > .05 && A.mx[1] > .15, 'the source has the clip beside and over the receiver (z up to ' + f(A.mx[2]) + ', y up to ' + f(A.mx[1]) + ')');
  ok(B.mx[2] < 0 && B.mx[1] < .13, 'after the cut nothing lies beside the receiver: z up to ' + f(B.mx[2]) + ', y up to ' + f(B.mx[1]) + ' (the rifle\'s top)');
  const n1 = P.meshes[P.nodes[P.parts.hull].mesh][0].g.attributes.position.count;
  ok(n0 - n1 === 5 * 25 + 8 && A.t - B.t < A.t / 4, (A.t - B.t) + ' triangles and ' + (n0 - n1) + ' vertices cut: the five rounds (25 each) and their plate (8), nothing else');
  ok(B.mn.every((v, c) => Math.abs(v - A.mn[c]) < 1e-6) && Math.abs(B.mx[0] - A.mx[0]) < 1e-6, 'the rifle is whole: the same length (x ' + f(B.mn[0]) + ' to ' + f(B.mx[0]) + ') and the same underside');
  const g = P.meshes[P.nodes[P.parts.hull].mesh][0].g, n = g.attributes.position.count, used = new Set(g.index.array);
  ok(used.size === n && Math.max(...g.index.array) < n && g.attributes.color.count === n, 'no vertex left unused (' + n + '), the colours cut with them');
  /* the sniper's scope (vmBuild: over the top of the weapon's box) now on the receiver */
  const up = (/sc\.position\.set\(\.06, B\.max\.y \+ ([.0-9]+),/.exec(html) || [, '.03'])[1] * 1;
  ok(B.mx[1] + up - .09 < .06, 'the scope on the receiver: its axis ' + f(B.mx[1] + up) + ' m up, ' + f(B.mx[1] + up - .09) + ' m over the bore (y .09; it was ' + f(A.mx[1] + .03 - .09) + ')');
  /* every other model of the pack is left alone */
  const others = fs.readdirSync(path.join(H.ROOT, 'models', 'pack')).filter(f => /\.glb$/.test(f)).map(f => f.slice(0, -4)).filter(id => !PACK_CUT_IDS().includes(id));
  function PACK_CUT_IDS() { return Object.keys(ctx.$('PACK').cut); }
  ok(others.length > 20 && others.every(id => ctx.$('packCut')(id, { parts: {} }).parts !== undefined), 'the other ' + others.length + ' models have no cut and go through as they are');
}
/* vmBuild puts the scope and the muzzle flash on the weapon's own middle, not on the grip's line (the Kar98's middle is 3.4 cm off it) */
const vb = (() => { const i = html.indexOf('function vmBuild('); return html.slice(i, html.indexOf('\n}\n', i)); })();
ok(/sc\.position\.set\(\.06, B\.max\.y \+ [.0-9]+, \(B\.min\.z \+ B\.max\.z\) \/ 2\)/.test(vb), 'the 1944 sniper\'s scope sits on the rifle\'s middle, over the receiver');
ok(/V\.mz = \[B\.max\.x \+ \.02, B\.min\.y \+ \.73 \* H, \(B\.min\.z \+ B\.max\.z\) \/ 2\]/.test(vb) && /f\.position\.set\(V\.mz\[0\], V\.mz\[1\], V\.mz\[2\] \|\| 0\)/.test(vb), 'the muzzle flash too');
done();
