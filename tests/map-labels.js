'use strict';
/* the place names on the General's view (cf-pol-cenario). gLabels wrote every capture point's name under its ring, always: two points 1.6 km
   apart (Travessia and Vila do Moinho, on today's map) wrote theirs over each other at the zoom the view opens with ("Travessiado Moinho").
   Now a name goes under its ring, or above, right or left of it, at the first spot with no text of the map yet (GV.lr). Run here on a stub
   canvas with the page's own gLabels, gTxt and gPut (the view part of the page, after the 3D scene marker) and the real points of each map */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8');
const body = name => { const i = html.indexOf('function ' + name + '('); return i < 0 ? '' : html.slice(i, html.indexOf('\n}\n', i) + 3); };
const src = ['gTxt', 'gPut', 'gLabels'].map(body).join('\n');
ok(src.length > 400, 'gLabels, gTxt and gPut are in the page');

const W = 6.6;   // the stub's width of a character of the 11 px monospace font, a little over the real one
function run(pts, s, pre) {
  const drawn = [], g = { font: '', textAlign: 'left', fillStyle: '', measureText: t => ({ width: t.length * W }), fillText: (t, x, y) => { if (g.fillStyle !== 'rgba(8,12,13,.85)') drawn.push({ t, x, y, al: g.textAlign }); } };
  const GV = { g, lr: (pre || []).slice(), sc: 1, fit: 1 };
  const ctx = vm.createContext({ GV, gMono: n => n + 'px monospace', gOn: () => true, gCol: () => '#fff' });
  vm.runInContext(src, ctx);
  const P = { X: x => 20 + x * s, Y: z => 300 + z * s, k: 1, s };
  ctx.gLabels(g, { pts, u: [] }, P);
  return drawn.map(d => { const w = d.t.length * W + 4, x0 = (d.al === 'center' ? d.x - w / 2 : d.al === 'right' ? d.x - w : d.x) - 2; return Object.assign(d, { r: [x0, d.y - 11, w, 14] }); });
}
const hit = (a, b) => a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1];
const pairs = (L, m) => { const o = [], g = r => [r[0] - (m || 0), r[1], r[2] + 2 * (m || 0), r[3]]; for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) if (hit(g(L[i].r), L[j].r)) o.push(L[i].t + ' × ' + L[j].t); return o; };   // m: the gap two names keep side by side

/* two points 40 px apart, as Travessia and Vila do Moinho at the opening zoom of today's map */
{
  const L = run([{ name: 'Travessia', x: 11159, z: -2647, r: 60 }, { name: 'Vila do Moinho', x: 12760, z: -2700, r: 60 }], .025);
  const old = [{ t: 'Travessia', r: [20 + 11159 * .025 - 31, 300 - 2647 * .025 + 22 - 11, 63.4, 14] }, { t: 'Vila do Moinho', r: [20 + 12760 * .025 - 48, 300 - 2700 * .025 + 22 - 11, 96.4, 14] }];
  ok(pairs(old).length === 1, 'under their rings, the two names were on each other (' + pairs(old).join(', ') + ')');
  ok(L.length === 2 && !pairs(L).length, 'now both are written and apart: ' + L.map(d => d.t + ' ' + d.al + ' at ' + Math.round(d.x) + ',' + Math.round(d.y)).join('; '));
  ok(L[0].al === 'center' && L[0].y > 300 - 2647 * .025, 'the first keeps its place under its ring');
}
/* a town's name already on the map there (GV.lr, written by drawTownNames before the labels): the point's name gives way to it */
{
  const x = 20 + 5000 * .025, y = 300 + 22, L = run([{ name: 'Cruzeiro', x: 5000, z: 0, r: 60 }], .025, [[x - 40, y - 11, 80, 14]]);
  ok(L.length === 1 && L[0].y < 300, 'a name with a town\'s name under its ring goes above it (' + L.map(d => d.al + ' ' + Math.round(d.y)).join() + ')');
}
/* every map's points at the zoom the view opens with (the map 550 px wide at 1280 x 720, 1030 px at 1920 x 1080), in 1944 and today with two and three sides: no two names on each other */
const C = H.load({ seed: 3, mapv: 11 });
for (const [era, n] of [['ww2', 2], ['modern', 2], ['modern', 3]]) {
  const S = C.watch(era, { n }), pts = S.cq.p.map(p => ({ name: p.name, x: p.x, z: p.z, r: p.r }));
  for (const px of [550, 1030]) {
  const s = px / S.W;
  const before = pts.map(p => { const w = p.name.length * W + 4, x = 20 + p.x * s, y = 300 + p.z * s + Math.max(9, (p.r || 60) * s) + 13; return { t: p.name, r: [x - w / 2 - 2, y - 11, w, 14] }; });
  const L = run(pts, s), b = pairs(before), a = pairs(L, 7);
  ok(!a.length && L.length === pts.length, era + (n === 3 ? ' (3 lados)' : '') + ', map ' + px + ' px: ' + pts.length + ' place names, none on another nor touching it, 7 px apart at least (' + (a.join(', ') || 'none') + '; under their rings: ' + (b.join(', ') || 'none') + ')');
  }
}
done();
