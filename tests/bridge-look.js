'use strict';
/* the bridges' look in one draw call (cf-lag-3): br3Build made a THREE.Mesh for every box of every bridge (parapets, posts, abutments, a
   pontoon's deck and floats, a rebuild's scaffold), ~600 meshes and ~550 draw calls on map 11 whenever the river was in view, about a
   third of the frame's calls in the #170 scene. Now every box is an instance of one InstancedMesh, its colour the instance's. This checks,
   with three.js stood in for, that the instanced mesh carries exactly the boxes the builder asked for (place, size, turn and tilt, colour),
   one mesh for them all, and that it is reused, grown and hidden as the bridges change. The block lives in the 3D part of the page, which
   the harness does not load. A second */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8');
console.log('page: ' + H.PAGE);
const a = html.indexOf('const BLOOK = {'), b = html.indexOf('function br3Scene() {', a);
ok(a > 0 && b > a, 'the bridges\' look block found');
const block = html.slice(a, b);
ok(!/new THREE\.Mesh\(/.test(block), 'no mesh a box in the bridges\' look (one instanced mesh for them all)');

/* three.js, as much of it as the block uses: each matrix keeps what it was composed of, each colour its hex */
class V3 { set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } }
class Eu { set(x, y, z, o) { this.x = x; this.y = y; this.z = z; this.o = o; return this; } }
class Qu { setFromEuler(e) { this.e = [e.x, e.y, e.z, e.o]; return this; } }
class M4 { compose(p, q, s) { this.rec = [p.x, p.y, p.z, s.x, s.y, s.z, q.e[1], q.e[0], q.e[2], q.e[3]]; return this; } }
class Col { constructor(h) { if (h !== undefined) this.setHex(h); } setHex(h) { this.r = (h >> 16 & 255) / 255; this.g = (h >> 8 & 255) / 255; this.b = (h & 255) / 255; return this; }
  multiplyScalar(k) { this.r *= k; this.g *= k; this.b *= k; return this; } getHex() { return (Math.round(this.r * 255) << 16) | (Math.round(this.g * 255) << 8) | Math.round(this.b * 255); } }
class Grp { constructor() { this.children = []; } add(o) { this.children.push(o); return this; } remove(o) { this.children = this.children.filter(c => c !== o); return this; } }
let made = 0;
class IM { constructor(g, m, cap) { made++; this.geometry = g; this.material = m; this.count = cap; this.cap = cap; this.userData = {}; this.visible = true; this.frustumCulled = true; this.instanceMatrix = { needsUpdate: false }; this.M = []; this.C = []; }
  setMatrixAt(i, m) { if (i >= this.cap) throw new Error('instance ' + i + ' past ' + this.cap); this.M[i] = m.rec.slice(); }
  setColorAt(i, c) { this.C[i] = c.getHex(); } }
class IBA { constructor(arr, n) { this.array = arr; this.itemSize = n; this.needsUpdate = false; } }
const THREE = { BoxGeometry: class {}, Group: Grp, InstancedMesh: IM, InstancedBufferAttribute: IBA, Matrix4: M4, Quaternion: Qu, Euler: Eu, Vector3: V3, Color: Col };

/* a standing bridge, one with a pontoon half laid, and one fallen with its rebuild under way and a free pontoon: every kind of box */
const B = [
  { i: 0, id: 100, x: 1000, z: 0, dx: 0, dz: 1, len: 120, ends: [{ x: 1000, z: -60 }, { x: 1000, z: 60 }], o: { hd: 4 } },
  { i: 1, id: 101, x: 3000, z: 200, dx: .6, dz: .8, len: 90, ends: [{ x: 2973, z: 164 }, { x: 3027, z: 236 }], o: { hd: 5 } },
  { i: 2, id: 102, x: 5000, z: -300, dx: 1, dz: 0, len: 150, ends: [{ x: 4925, z: -300 }, { x: 5075, z: -300 }], o: { hd: 4 } }
];
const forts = [{ k: 7, b: 1, prog: .5, id: 200, e: 0 }, { k: 9, b: 2, prog: .6, id: 201, e: 1 }, { k: 7, id: 202, prog: .7, e: 0, ps: { z: 900, len: 80, ends: [{ x: 7000, y: 4 }, { x: 7080, y: 4 }] } }];
function run(bridges, os, fs2) {
  const ctx = vm.createContext({ Math, THREE, BR: { pw: 7 }, BRDH: 2.2, clamp: (v, l, h) => Math.max(l, Math.min(h, v)),
    S: { T: { WL: 0 }, modern: 1, os: os || {}, forts: fs2 || [] }, brs: () => bridges, hgtT: (T, x, z) => 3 + Math.sin(x * .01) * 2 + z * .001,
    mats: [], mat: hex => { const m = { hex }; ctx.mats.push(m); return m; } });
  ctx.brPont = bb => ctx.S.forts.find(f => f.k === 7 && !f.dead && f.b === bb.i) || null;
  ctx.brReb = bb => ctx.S.forts.find(f => f.k === 9 && !f.dead && f.b === bb.i) || null;
  vm.runInContext(block + '\n;globalThis.$ = s => eval(s);', ctx, { filename: 'br3.js' });
  ctx.$('BR3.box = new THREE.BoxGeometry(); BR3.g = new THREE.Group();');
  return ctx;
}
/* what the builder asks for: br3Box as a recorder (each box's place, size, turn, tilt and colour, the way the old mesh had them) */
function asked(ctx) {
  ctx.__rec = []; ctx.__realB = ctx.$('br3Box'); ctx.__flushB = ctx.$('br3Flush');
  ctx.$('br3Box = (x, y, z, sx, sy, sz, a, hex, tilt) => { globalThis.__rec.push([x, y, z, sx, sy, sz, a, tilt || 0, 0, "YXZ", hex]); }');
  ctx.$('br3Flush = () => { BR3.L = []; }');
  ctx.$('br3Build()');
  ctx.$('br3Box = globalThis.__realB; br3Flush = globalThis.__flushB;');
  return ctx.__rec;
}

console.log('-- every box the builder asks for is one instance of the one mesh --');
{
  const os = { 102: 2, 201: 0 }, ctx = run(B, os, forts);
  const want = asked(ctx);
  ok(want.length > 40, want.length + ' boxes asked for (parapets, posts, abutments, a pontoon, a rebuild, a free pontoon)');
  ok(want.some(w => w[7] !== 0), 'a tilted piece among them (a fallen bridge\'s deck in the water)');
  made = 0; ctx.$('br3Build()');
  const K = ctx.$('BR3'), im = K.im;
  ok(K.g.children.length === 1 && K.g.children[0] === im && made === 1, 'one instanced mesh in the bridges\' group (' + K.g.children.length + ' children)');
  ok(im.count === want.length && im.visible, 'its count is the boxes\' (' + im.count + ' of ' + want.length + ')');
  let bad = 0; for (let i = 0; i < want.length; i++) { const w = want[i], m = im.M[i]; if (!m || m.some((v, k) => (typeof v === 'number' ? Math.abs(v - w[k]) > 1e-9 : v !== w[k])) || im.C[i] !== w[10]) bad++; }
  ok(!bad, 'each instance where its box was, as large, turned and tilted as it, and its colour (' + bad + ' differ)');
  ok(ctx.mats.length === 1 && ctx.mats[0].hex === 0xffffff, 'one white material: the colour is the instance\'s');
  ok(im.instanceColor && im.instanceColor.needsUpdate && im.instanceMatrix.needsUpdate, 'the instances\' matrices and colours sent');
  ok(im.frustumCulled === false, 'not culled by the box at the origin (the instances are all over the map)');
  ok(new Set(want.map(w => w[10])).size >= 4, 'several colours (stone, a hurt one, the pontoon, its floats, the scaffold) in the one mesh');
}

console.log('-- the mesh is kept, grown and hidden as the bridges change --');
{
  const ctx = run([B[0]], {}, []);
  made = 0; ctx.$('br3Build()'); const K = ctx.$('BR3'), im0 = K.im, n0 = im0.count;
  ctx.brs = () => B; ctx.S.forts = forts; ctx.$('br3Build()');
  ok(K.g.children.length === 1 && made === 2, 'one mesh still, a larger one, after the boxes outgrew it (' + K.g.children.length + ' children, ' + made + ' made)');
  ok(K.im.count > im0.userData.cap && K.im.userData.cap >= K.im.count, 'more boxes than it had room for: ' + n0 + ' then ' + K.im.count + ' (room ' + K.im.userData.cap + ')');
  const im1 = K.im; ctx.brs = () => [B[0]]; ctx.S.forts = []; ctx.$('br3Build()');
  ok(K.im === im1 && K.im.count === n0, 'fewer boxes: the same mesh, its count down to ' + K.im.count);
  const m = made; for (let i = 0; i < 5; i++) ctx.$('br3Build()');
  ok(made === m, 'built again and again: no new mesh');
  ctx.brs = () => []; ctx.$('br3Build()');
  ok(K.im.count === 0 && K.im.visible === false, 'no bridge: nothing drawn');
}
done();
