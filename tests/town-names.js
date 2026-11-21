'use strict';
/* the towns' names on the maps (cf-mapa-cidades; cf-pol-testes-b and cf-pol-hud found it): on the General's map a town named after its conquest
   point was written twice, faded by drawTownNames and bright by the point's own label. drawTownNames(…, pt): 'skip' leaves a point's town to the
   point's label, a number moves its name under the point's ring (the battle map), nothing names every town as before (fire control, drone).
   townLabel and drawTownNames are cut out of the page and run on a stub canvas */
const fs = require('fs'), vm = require('vm'), { PAGE, ok, done } = require('./harness');
const html = fs.readFileSync(PAGE, 'utf8');
const cut = name => { const i = html.indexOf('function ' + name + '('); return i < 0 ? '' : html.slice(i, html.indexOf('\n}\n', i) + 3); };
const S = { T: { burgs: [
  { x: 1000, z: 0, k: 'village', ru: 120, rv: 90 },              // the village of point N: named after it
  { x: 5000, z: 0, k: 'town', ru: 300, rv: 200, nm: 'Sede' },     // a town with its own name, no point
  { x: 9000, z: 0, k: 'village', ru: 100, rv: 80 } ] },           // a village with no point: "Aldeia"
  cq: { p: [{ x: 1080, z: 40, name: 'Aldeia do Açude' }] } };
const ctx = vm.createContext({ S, hdist: (a, b) => Math.hypot(a.x - b.x, a.z - b.z), clamp: (v, a, b) => Math.max(a, Math.min(b, v)) });
vm.runInContext(cut('townLabel') + cut('drawTownNames'), ctx);
const draw = pt => {
  const out = [], g = { save() {}, restore() {}, strokeText() {}, fillText: (t, x, y) => out.push([t, Math.round(y)]) };
  ctx.drawTownNames(g, x => x / 10, z => z / 10, 0.2, 1, null, pt); return out;
};
ok(typeof ctx.drawTownNames === 'function' && typeof ctx.townLabel === 'function', 'drawTownNames and townLabel cut out of the page');
const all = draw(), skip = draw('skip'), low = draw(20);
ok(all.map(e => e[0]).join('|') === 'Aldeia do Açude|Sede|Aldeia', 'with nothing asked it names all three: ' + all.map(e => e[0]).join(', '));
ok(skip.map(e => e[0]).join('|') === 'Sede|Aldeia', '\'skip\' leaves the point\'s town to the point\'s label: ' + skip.map(e => e[0]).join(', '));
ok(low[0][0] === 'Aldeia do Açude' && low[0][1] === all[0][1] + 20 && low[1][1] === all[1][1], 'a number moves only the point\'s town under its ring (' + all[0][1] + ' → ' + low[0][1] + ')');
ok(/drawTownNames\(g, P\.X, P\.Y, P\.s, P\.k, [^;]*'skip'/.test(html), 'the General\'s map leaves them to the points\' labels');
done();
