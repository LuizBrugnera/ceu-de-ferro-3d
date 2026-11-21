'use strict';
/* the economy's sites as they are drawn (buildEco, lookEco, ECOL; cf-pol-modelos), against a recording three.js: at every stage of the
   build and when destroyed, nothing of a mine shows above its headframe unless the deck it stands on shows (the wheel over the shaft hung
   in the air over a wrecked mine, and over bare posts from half built to the deck), and the headframe's braces lie on its own four faces
   (never out of it). The 3D part is not loaded by the harness: the two functions are read here on their own */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8'), a = html.indexOf('function buildEco(e)'), b = html.indexOf('function buildMen()', a);
console.log('page: ' + H.PAGE);
if (a < 0 || b < 0) { console.log('no economy sites (buildEco): a page before them'); process.exit(0); }
const e0 = html.lastIndexOf('const ECOL', a), src = (e0 > 0 && e0 > a - 2000 ? html.slice(e0, a) : '') + html.slice(a, b);
const sim = H.load();
/* the recording three.js: a geometry keeps its kind and where it was moved to; an object its children, place and visibility */
const vec = (x = 0, y = 0, z = 0) => ({ x, y, z, set(a, b, c) { this.x = a; this.y = b; this.z = c; return this; } });
class Geo { constructor(type, ...args) { this.type = type; this.args = args; this.t = [0, 0, 0]; } rotateX() { return this; } rotateY(r) { this.ry = (this.ry || 0) + r; return this; } rotateZ() { return this; } scale() { return this; } translate(x, y, z) { this.t[0] += x; this.t[1] += y; this.t[2] += z; return this; } }
class Obj { constructor(geometry, material) { this.geometry = geometry; this.material = material; this.children = []; this.userData = {}; this.visible = true; this.position = vec(); this.rotation = vec(); this.scale = vec(1, 1, 1); } add(...c) { this.children.push(...c); return this; } traverse(f) { f(this); for (const c of this.children) c.traverse(f); } }
const kind = t => class extends Geo { constructor(...a) { super(t, ...a); } };
const THREE = { Group: Obj, Mesh: Obj, BoxGeometry: kind('Box'), CylinderGeometry: kind('Cylinder'), TorusGeometry: kind('Torus'), ConeGeometry: kind('Cone') };
const S = { E: { sides: [{ col: 0x556b2f, col2: 0x3b4a20 }] }, fac: [0], me: 0, os: {}, spec: false };
const ctx = vm.createContext({ THREE, S, ECO: sim.$('ECO'), clamp: sim.$('clamp'), ecoHid: () => false, CORN: [[-1, -1], [1, -1], [1, 1], [-1, 1]],
  mat: c => ({ color: { c, multiplyScalar() { return this; } } }), vkGeo: list => ({ type: 'merged', list }) });
vm.runInContext(src + '\n;globalThis.$ = s => eval(s);', ctx, { filename: 'eco-looks.js' });
const buildEco = ctx.$('buildEco'), lookEco = ctx.$('lookEco'), ECO = sim.$('ECO');

console.log('-- the mine: nothing over the headframe without the deck --');
const h = ECO.site.mine.box[2], stages = [.05, .3, .6, .8, .9, 1, 'dead'];
let id = 1, bad = [];
for (const st of stages) {
  const e = { id: id++, k: 'mine', team: 0, x: 0, y: 0, z: 0, a: 0, prog: st === 'dead' ? 1 : st, dead: st === 'dead', lot: -1 };
  if (st === 'dead') S.os[e.id] = 2;
  const m = buildEco(e); lookEco(e, m);
  const U = m.userData, deck = U.roof.find(o => o.geometry.type === 'Box'), high = [];
  m.traverse(o => { if (o !== m && o.geometry && o !== deck && o.visible && o.position.y > h + .3) high.push(o); });
  if (high.length && !(deck && deck.visible)) bad.push(st + ': ' + high.length + ' part(s) over the headframe, the deck hidden');
}
ok(!bad.length, 'at every stage (' + stages.join(' ') + '), what stands over the headframe shows only with the deck under it' + (bad.length ? ': ' + bad.join('; ') : ''));

console.log('-- the headframe --');
const e = { id: id++, k: 'mine', team: 0, x: 0, y: 0, z: 0, a: 0, prog: 1, dead: false, lot: -1 }, m = buildEco(e); lookEco(e, m);
const P = m.userData.posts, pieces = P.length === 1 && P[0].geometry.list ? P[0].geometry.list : null;
if (pieces) {
  const out = pieces.filter(g => Math.abs(g.t[0]) > 2 + 1e-6 || Math.abs(g.t[2]) > 2 + 1e-6 || g.t[1] < .3 - 1e-6 || g.t[1] > h + .3 + 1e-6);
  ok(pieces.length === 20 && !out.length, 'four posts and two crosses on each face, ' + pieces.length + ' pieces, every one within the frame (' + out.length + ' out)');
  const faces = new Set(pieces.slice(4).map(g => [Math.round(g.t[0] * 10), Math.round(g.t[2] * 10)].join()));
  ok(faces.size === 4, 'the crosses on four faces: ' + [...faces].join(' | '));
  /* each brace lies in its face: on a face across x (x = ±2) it runs along z, on one across z along x (a box's length is its x, turned by ry) */
  const across = pieces.slice(4).filter(g => { const alongZ = Math.abs(Math.sin(g.ry || 0)) > .5; return Math.abs(Math.abs(g.t[0]) - 2) < 1e-6 ? !alongZ : Math.abs(Math.abs(g.t[2]) - 2) < 1e-6 ? alongZ : true; });
  ok(!across.length, 'every brace runs along its own face (' + across.length + ' across it, out of the frame)');
} else ok(P.length === 4, 'the headframe: four posts (no braces on this page)');
done();
