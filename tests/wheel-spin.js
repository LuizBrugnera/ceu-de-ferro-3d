'use strict';
/* the wheels that roll (WSPIN, cf-pol-modelos). The kit's: every wheel, road wheel, sprocket and idler of the artillery and the AA vehicles
   is drawn as a wheel (K.W: its middle and radius), on its own side, and nothing else is. The pack's (packSpinGeo, on the real
   models/pack/*.glb): the round pieces of the wheels and of the tracks are found as wheels, low on the vehicle, as many as the vehicle
   has, and no long piece (a belt, a fender) ever is. The 3D part is not loaded by the harness: the kit runs against a recording kit
   (tests/vk-kit.js), packSpinGeo against a geometry stub */
const fs = require('fs'), path = require('path'), vm = require('vm'), H = require('./harness'), { ok, done } = H, { blocks, kit, node, html } = require('./vk-kit'), G = require('../tools/pack/glb.js');
console.log('page: ' + H.PAGE);
const a = html.indexOf('/* the pack\'s rolling wheels (cf-pol-modelos'), b = html.indexOf('packSkin = (f => (g, P, d, col, wreck, keepTur) => {', a);
const ARTB = blocks('ARTB'), AAB = blocks('AAB');
if (a < 0 || b < 0 || !ARTB || !AAB) { console.log('no rolling wheels (WSPIN): a page before them'); process.exit(0); }
const sim = H.load(), ARTS = sim.$('ARTS'), AAS = sim.$('AAS');

console.log('-- the kit\'s wheels --');
/* the recording kit, also keeping the wheel each piece belongs to */
function wkit() { const K = kit(), P = K.P; for (const f of ['box', 'cx', 'cz', 'cy', 'dx', 'dz', 'pr']) { const g = K[f]; K[f] = (...x) => { g(...x); P[P.length - 1].W = K.W; P[P.length - 1].f = f; return K; }; } K.W = null; return K; }
for (const [T, B, kind] of [[ARTS, ARTB, 'art'], [AAS, AAB, 'aa']]) for (const id of Object.keys(T)) {
  const d = T[id], K = wkit(), g = node('g'), tur = node('tur'), gun = node('gun');
  B[id](K, g, tur, gun, { P: 1, P2: 2, dk: 3, glass: 4, rk: 5, wh: 6, tl: d.t ? d.t[0] : 0, tw: d.t ? d.t[1] : 0, th: d.t ? d.t[2] : 0, g: d.g, hh: d.hh });
  const W = K.P.filter(p => p.W), round = K.P.filter(p => p.to === g && p.f === 'cz' && p.y - p.hy < .05);   // the round pieces that stand on the ground: wheels, road wheels, sprockets, idlers
  ok(W.length > 0 && round.every(p => p.W) && W.every(p => p.f === 'cz' || p.f === 'dz'), kind + ' ' + id + ': ' + round.length + ' round pieces on the ground, every one a wheel, and only wheels and their hubs');
  ok(W.every(p => Math.abs(p.W[0] - p.x) < 1e-6 && Math.abs(p.W[1] - p.y) < 1e-6 && Math.abs(p.W[3] - p.W[1]) < 1e-6 && Math.sign(p.W[2] || p.z) === Math.sign(p.z)), '  each turns about its own axle, at its own height, on its own side');
}

console.log('-- the pack\'s wheels --');
class Attr { constructor(array, itemSize) { this.array = array; this.itemSize = itemSize; this.count = array.length / itemSize; } getX(i) { return this.array[i * this.itemSize]; } getY(i) { return this.array[i * this.itemSize + 1]; } getZ(i) { return this.array[i * this.itemSize + 2]; } }
class Geo { constructor() { this.attributes = {}; this.index = null; this.userData = {}; } setAttribute(n, at) { this.attributes[n] = at; } }
const ctx = vm.createContext({ THREE: { BufferAttribute: Attr } });
vm.runInContext(html.slice(a, b) + '\n;globalThis.$ = s => eval(s);', ctx, { filename: 'packspin.js' });
const packSpinGeo = ctx.$('packSpinGeo'), PSPIN = ctx.$('PSPIN');
/* the least wheels each should show: a car or a truck its wheels (two a side), a tank whose road wheels are pieces of their own three a side;
   the Quaternius tanks and the T-72 have them one piece with the belt, and none of theirs need roll (0: only that nothing wrong does) */
const want = { pickup: 4, suv: 4, sedan: 4, car_jeep: 4, car_hmmwv: 4, car_scout: 4, trk_m939: 4, trk_hemtt: 4, tk_abrams: 6, tk_leo: 6, tk_sherman: 6, tk_t72: 0, tk_t34: 0, tk_t55: 0, tk_tiger: 0, tk_pz4: 0 };
for (const id in want) {
  const { J, acc } = G.read(path.join(H.ROOT, 'models', 'pack', id + '.glb')), dims = (J.asset.extras || {}).dims || [1, 1, 1], centres = new Set(); let long = 0, high = 0;
  J.nodes.forEach(n => {
    if (n.mesh === undefined || !PSPIN.parts.includes(n.name)) return;
    for (const p of J.meshes[n.mesh].primitives) {
      const g = new Geo(); g.setAttribute('position', new Attr(Float32Array.from(acc(p.attributes.POSITION)), 3)); g.index = { array: Uint32Array.from(acc(p.indices)) };
      if (!packSpinGeo(g, dims[2])) continue;
      const A = g.attributes.aWheel.array, t = n.translation || [0, 0, 0];
      for (let i = 0; i < A.length; i += 4) if (A[i + 3] > 0) {
        centres.add([A[i], A[i + 1], A[i + 2]].map(v => v.toFixed(2)).join());
        if (A[i + 1] + t[1] > .5 * dims[2]) high++;   // a wheel's axle in the upper half of the vehicle: not a wheel (a sprocket or a return roller is lower)
      }
      /* no detected piece is long: every vertex of a wheel lies within its radius (a little more) of its middle across x and y */
      const P = g.attributes.position.array;
      for (let i = 0; i < A.length / 4; i++) if (A[i * 4 + 3] > 0 && Math.hypot(P[i * 3] - A[i * 4], P[i * 3 + 1] - A[i * 4 + 1]) > A[i * 4 + 3] * 1.5) long++;
    }
  });
  ok(centres.size >= want[id] && !long && !high, id + ': ' + centres.size + ' wheels (at least ' + want[id] + '), ' + long + ' vertices of a wheel far from its axle, ' + high + ' wheel vertices with the axle high');
}
done();
