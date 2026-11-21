'use strict';
/* the towns' names on the maps (cf-mapa-cidades, cf-pol-testes-b): on the General's map a town named after its conquest point was written twice,
   faded by drawTownNames and bright by the point's own label. drawTownNames(…, pts) now leaves those to the point; the other maps (fire control,
   drone, battle), whose point marks are letters, still name every town. The two functions are cut out of the page and run on a stub canvas */
const fs = require('fs'), vm = require('vm'), { PAGE, ok, done } = require('./harness');
const html = fs.readFileSync(PAGE, 'utf8');
const cut = name => { const i = html.indexOf('function ' + name + '('); return i < 0 ? '' : html.slice(i, html.indexOf('\n}\n', i) + 3); };
const src = cut('townLabel') + cut('drawTownNames');
const S = { T: { burgs: [
  { x: 1000, z: 0, k: 'village', ru: 120, rv: 90 },              // the village of point N: named after it
  { x: 5000, z: 0, k: 'town', ru: 300, rv: 200, nm: 'Sede' },     // a town with its own name, no point
  { x: 9000, z: 0, k: 'village', ru: 100, rv: 80 } ] },           // a village with no point: "Aldeia"
  cq: { p: [{ x: 1080, z: 40, name: 'Aldeia do Açude' }] } };
const ctx = vm.createContext({ S, hdist: (a, b) => Math.hypot(a.x - b.x, a.z - b.z), clamp: (v, a, b) => Math.max(a, Math.min(b, v)) });
vm.runInContext(src, ctx);
const draw = pts => {
  const out = [], g = { save() {}, restore() {}, strokeText() {}, fillText: t => out.push(t) };
  ctx.drawTownNames(g, x => x / 10, z => z / 10, 0.2, 1, null, pts); return out;
};
ok(typeof ctx.drawTownNames === 'function' && typeof ctx.townLabel === 'function', 'drawTownNames and townLabel cut out of the page');
const all = draw(false), gen = draw(true);
ok(all.join('|') === 'Aldeia do Açude|Sede|Aldeia', 'a map with letter marks names all three: ' + all.join(', '));
ok(gen.join('|') === 'Sede|Aldeia', 'the General\'s map leaves the point\'s town to the point\'s label: ' + gen.join(', '));
ok(/drawTownNames\(g, P\.X, P\.Y, P\.s, P\.k, \([^)]*\) => [^;]*, true\)/.test(html), 'the General\'s map (gTerrain) asks for it');
ok((html.match(/drawTownNames\(hx, /g) || []).length >= 3 && !/drawTownNames\(hx, [^;\n]*, true\)/.test(html), 'the fire-control, drone and battle maps do not');
done();
