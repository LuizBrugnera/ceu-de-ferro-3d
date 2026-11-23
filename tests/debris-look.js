'use strict';
/* what comes off a plane (debrisMesh, cf-pol-modelos): the part that flies away shows with what it carries (a wing its national marking,
   which is a child of the wing's mesh, INSIG), darkened as the part is, and nothing else of the plane shows. The wing used to fly off
   bare: every mesh of the model was hidden and only the part's own meshes shown again, not their children. Run on a recording model (the
   3D part is not loaded by the harness) with the planes' real part tables */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8'), a = html.indexOf('function debrisMesh(o) {'), b = html.indexOf('\n}\n', a) + 3;
console.log('page: ' + H.PAGE);
if (a < 0) { console.log('no debrisMesh: a page before it'); process.exit(0); }
const vec = () => ({ x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }, setScalar(k) { this.x = this.y = this.z = k; return this; } });
const matOf = () => ({ color: { k: 1, multiplyScalar(v) { this.k *= v; return this; } } });
class Obj { constructor(geometry, material) { this.geometry = geometry; this.material = material; this.children = []; this.visible = true; this.position = vec(); this.scale = vec(); this.userData = {}; this.isMesh = !!material; } add(...c) { this.children.push(...c); return this; } traverse(f) { f(this); for (const c of this.children) c.traverse(f); } }
/* a plane: its hull, each wing with its marking on it, and the tailplane */
function plane() {
  const g = new Obj(), pm = (g.userData.pm = {});
  for (const pid of ['hull', 'wingR', 'wingL', 'stab', 'fin']) { const me = new Obj({}, matOf()); me.pid = pid; g.add(me); (pm[pid] = [me]); if (pid.startsWith('wing')) { const q = new Obj({}, matOf()); q.mark = 1; me.add(q); } }
  return g;
}
const sim = H.load(), PLANES = sim.$('PLANES'), TINT = [1, .8, .55, .3];
const ctx = vm.createContext({ THREE: { Group: Obj, Mesh: Obj, BoxGeometry: function () {} }, mat: matOf, TINT, PLANES, buildPlane: plane, buildUnit: () => new Obj(), kill: () => {}, GS: 1.7 });
vm.runInContext(html.slice(a, b) + '\n;globalThis.$ = s => eval(s);', ctx, { filename: 'debris.js' });
const debrisMesh = ctx.$('debrisMesh');
const seen = (w, o) => { let v = o.visible, p = o; const up = new Map(); w.traverse(x => x.children.forEach(c => up.set(c, x))); while (v && (p = up.get(p)) && p !== w) v = p.visible; return v; };
for (const [id, pt] of [['bf109', 'wingR'], ['bf109', 'tipL'], ['spit', 'wingL'], ['b17', 'tipR']]) {
  const d = PLANES[id].parts, part = d[d.ix[pt]], wing = part.vis ? part.vis[0] : pt, w = debrisMesh({ k: 'part', id, pt }), all = [];
  w.traverse(o => { if (o.isMesh) all.push(o); });
  const shown = all.filter(o => seen(w, o)), mark = all.find(o => o.mark && seen(w, o));
  ok(shown.length === 2 && shown.every(o => o.mark || o.pid === wing) && mark && mark.material.color.k === TINT[2], id + ' ' + pt + ': the ' + wing + ' flies off with its marking, darkened as it is, and nothing else (' + shown.length + ' shown)');
}
done();
