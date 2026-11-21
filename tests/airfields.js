'use strict';
/* the airfields as they are drawn (baseScene, AFL; cf-pol-modelos) against the world objects the simulation placed (genTerrain: BASE[era] for
   sides 0 and 1, BASE.ins for side 2's hideout), on a recording three.js: every building is drawn standing on its own object (its place, its
   ground, and the size the simulation gives it), nothing is drawn where the simulation has no building, and the hideout has no runway. It
   was drawn as an airfield: a runway, three hangars and a tower where nothing stood, and its sheds and bunker, which stop shots and
   vehicles, unseen. The 3D part is not loaded by the harness: the function is read here on its own */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8'), a = html.indexOf('function baseScene(b, t)'), b = html.indexOf('function buildWorld()', a);
console.log('page: ' + H.PAGE);
if (a < 0 || b < 0) { console.log('no baseScene: a page before it'); process.exit(0); }
const src = html.slice(html.lastIndexOf('const AFL', a), b);
/* the recording three.js: a geometry keeps its kind and arguments; an object its children and place; the group its turn */
const vec = () => ({ x: 0, y: 0, z: 0, set(a, b, c) { this.x = a; this.y = b; this.z = c; return this; } });
class Geo { constructor(type, ...args) { this.type = type; this.args = args; } rotateX() { return this; } rotateY() { return this; } rotateZ() { return this; } scale() { return this; } translate() { return this; } }
class Obj { constructor(geometry, material) { this.geometry = geometry; this.material = material; this.children = []; this.userData = {}; this.position = vec(); this.rotation = vec(); } add(...c) { this.children.push(...c); return this; } }
class Shape { moveTo() { return this; } lineTo() { return this; } closePath() { return this; } }
const kind = t => class extends Geo { constructor(...a) { super(t, ...a); } };
const THREE = { Group: Obj, Mesh: Obj, Shape, BoxGeometry: kind('Box'), CylinderGeometry: kind('Cylinder'), TorusGeometry: kind('Torus'), CircleGeometry: kind('Circle'), ExtrudeGeometry: kind('Extrude'), MeshBasicMaterial: class { constructor(o) { Object.assign(this, o); } }, DoubleSide: 2 };

function check(label, sim, S) {
  const hgtT = sim.$('hgtT'), wo = { base: {} };
  const ctx = vm.createContext({ THREE, S, wo, BASE: sim.$('BASE'), headTo: sim.$('headTo'), hgt: (x, z) => hgtT(S.T, x, z), mat: c => ({ c }), vkGeo: list => new Geo('merged', list), FRIEND: '#6fc3b2', foeCol: () => '#e2604f' });
  vm.runInContext(src + '\n;globalThis.$ = s => eval(s);', ctx, { filename: 'airfields.js' });
  const baseScene = ctx.$('baseScene');
  console.log('-- ' + label + ': ' + S.base.length + ' sides --');
  S.base.forEach((bs, t) => {
    const g = baseScene(bs, t), A = g.rotation.y, c = Math.cos(A), s = Math.sin(A), objs = S.T.objs.filter(o => o.base === t), bad = [];
    for (const o of objs) {
      const l = wo.base[o.id], m = l && l[0]; if (!m) { bad.push(o.id + ' ' + o.k + ' not drawn'); continue; }
      const x = g.position.x + m.position.x * c + m.position.z * s, z = g.position.z - m.position.x * s + m.position.z * c, ge = m.geometry;
      const foot = g.position.y + m.position.y - (ge.type === 'Box' ? ge.args[1] / 2 : 0);   // a box stands on its bottom, the old hangar's arch on its axis
      if (Math.hypot(x - o.x, z - o.z) > .5 || Math.abs(foot - o.y) > .5) bad.push(o.id + ' ' + o.k + ' drawn ' + Math.round(Math.hypot(x - o.x, z - o.z)) + ' m away, ' + (foot - o.y).toFixed(1) + ' m off its ground');
      else if (ge.type === 'Box' && o.k !== 'pole' && !(o.k === 'ctl' && t < 2) && (Math.abs(ge.args[0] - 2 * o.hw) > .01 || Math.abs(ge.args[1] - o.h) > .01 || Math.abs(ge.args[2] - 2 * o.hd) > .01)) bad.push(o.id + ' ' + o.k + ' drawn ' + ge.args.slice(0, 3).join('×') + ', ' + 2 * o.hw + '×' + o.h + '×' + 2 * o.hd + ' in the simulation');
    }
    const ghosts = Object.keys(wo.base).map(Number).filter(id => id >= 200 + t * 10 && id < 210 + t * 10 && !objs.some(o => o.id === id));
    const long = g.children.filter(m => m.geometry && m.geometry.type === 'Box' && Math.max(m.geometry.args[0], m.geometry.args[2]) > 200);
    ok(objs.length > 0 && !bad.length && !ghosts.length, 'side ' + t + ': its ' + objs.length + ' buildings (' + objs.map(o => o.k).join(' ') + ') each drawn on its own object' + (bad.length ? ': ' + bad.join('; ') : '') + (ghosts.length ? '; drawn with no object: ' + ghosts.join(' ') : ''));
    ok(t > 1 ? !long.length : long.length === 1, '  ' + (t > 1 ? 'no runway at the hideout' : 'its runway') + ' (' + long.length + ')');
  });
}
const m = H.load({ seed: 5, mapv: 11 }); check('modern, three sides', m, m.watch('modern', { n: 3 }));
const w = H.load({ seed: 5, mapv: 11 }); check('1944, two sides', w, w.watch('ww2'));
done();
