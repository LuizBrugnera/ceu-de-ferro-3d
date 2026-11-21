'use strict';
/* the planes' propeller blades and national markings (PROP, INSIG; cf-pol-modelos) against the planes: every plane named there exists and is
   drawn from its numbers (a textured model, mdl.glb, keeps its own look), each plane with a propeller (mdl.prop) or propeller discs on its
   nacelles (mdl.nac) has its blades counted, each marking is one the page draws, and each side wears its own: the Luftwaffe the
   Balkenkreuz, the Allies the roundel or the star, Russia the red star. The rounded wing tips (WTIP, wingRound): only on the propeller
   planes, only on an outer panel (the Stuka's inner gull panel keeps its square end, which meets the outer one), and within the square
   wing's own outline: the root, the leading edge and the span as they were (the hit boxes are the square wing's), the same extrusion.
   The tables live in the 3D part, which the harness does not load: they are read here on their own */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8'), a = html.indexOf('/* ---------- the planes drawn from their numbers (cf-pol-modelos)');
console.log('page: ' + H.PAGE);
if (a < 0) { console.log('no propeller blades or markings (PROP, INSIG): a page before them'); process.exit(0); }
/* a recording three.js for wingRound: the outline it draws and what is done to the extrusion */
class Shape { constructor() { this.ops = []; } moveTo(x, y) { this.ops.push(['m', x, y]); } lineTo(x, y) { this.ops.push(['l', x, y]); } bezierCurveTo(a, b, c, d, x, y) { this.ops.push(['b', a, b, c, d, x, y]); } closePath() { this.ops.push(['z']); } }
class Extrude { constructor(sh, o) { this.sh = sh; this.o = o; this.ops = []; } translate(...v) { this.ops.push(['t', ...v]); } rotateX(r) { this.ops.push(['rx', r]); } scale(...v) { this.ops.push(['s', ...v]); } }
const b = html.indexOf('function insigTex(k)', a), ctx = vm.createContext({ THREE: { Shape, ExtrudeGeometry: Extrude } });
vm.runInContext(html.slice(html.indexOf('const PROP', a), b) + '\n;globalThis.$ = s => eval(s);', ctx, { filename: 'plane-looks.js' });
const sim = H.load(), PROP = ctx.$('PROP'), INSIG = ctx.$('INSIG'), PLANES = Object.assign({}, sim.$('PLANES'), sim.$('HELIS')), HELIS = sim.$('HELIS'), ERAS = sim.$('ERAS');
const drawn = html.slice(b, html.indexOf('function insigQuads', b)), kinds = ['balk', 'raf', 'us', 'ru'];

console.log('-- propellers --');
for (const id in PLANES) {
  const m = PLANES[id].mdl; if (m.glb || HELIS[id]) continue;
  const props = !!m.prop || (m.nac || []).some(n => n[5]);
  if (props) ok(PROP.blades[id] >= 2, id + ' (' + PLANES[id].name + '): ' + PROP.blades[id] + ' blades a propeller');
}
ok(Object.keys(PROP.blades).every(id => PLANES[id] && !PLANES[id].mdl.glb && (PLANES[id].mdl.prop || (PLANES[id].mdl.nac || []).some(n => n[5]))), 'every plane with blades counted has a propeller');
console.log('-- markings --');
ok(Object.keys(INSIG.kind).every(id => PLANES[id] && !PLANES[id].mdl.glb && (!HELIS[id] || HELIS[id].mdl.boom)), 'every plane or helicopter with a marking is drawn from its numbers (a helicopter wears it on its tail boom): ' + Object.keys(INSIG.kind).join(' '));
ok(Object.keys(HELIS).every(id => INSIG.kind[id]), 'every helicopter wears one');
ok(kinds.every(k => drawn.includes("k === '" + k + "'")) && Object.values(INSIG.kind).every(k => kinds.includes(k)), 'every marking is one the page draws: ' + kinds.join(' '));
const by = {}; for (const id in INSIG.kind) { const d = PLANES[id], s = ERAS[d.era].sides[d.side].name; (by[s] || (by[s] = new Set())).add(INSIG.kind[id]); }
ok(by.Luftwaffe && [...by.Luftwaffe].join() === 'balk', 'the Luftwaffe wears the Balkenkreuz');
ok(by.EUA && [...by.EUA].join() === 'us', 'the USA the star');
ok(by.Aliados && [...by.Aliados].every(k => k === 'raf' || k === 'us'), 'the Allies the roundel or the star');
ok(by['Rússia'] && [...by['Rússia']].join() === 'ru', 'Russia the red star');
ok(!Object.keys(INSIG.kind).some(id => ERAS[PLANES[id].era].sides[PLANES[id].side].name === 'EUA' && INSIG.kind[id] !== 'us'), 'the USA, if any, the star');
console.log('-- wing tips --');
const WTIP = ctx.$('typeof WTIP === "undefined" ? null : WTIP');
if (WTIP) {
  const wingOuter = ctx.$('wingOuter'), wingRound = ctx.$('wingRound'), near = (x, y) => Math.abs(x - y) < 1e-6;
  ok(Object.keys(WTIP).every(id => PROP.blades[id] && PLANES[id] && !PLANES[id].mdl.glb && !HELIS[id]), 'only the propeller planes drawn from their numbers have rounded tips: ' + Object.keys(WTIP).join(' '));
  ok(Object.keys(PLANES).every(id => { const W = PLANES[id].mdl.wings; return !W || wingOuter(PLANES[id].mdl, W[W.length - 1]); }), 'every tailplane is an outer panel');
  const st = PLANES.stuka && PLANES.stuka.mdl;
  if (st) ok(st.wings.length === 3 && !wingOuter(st, st.wings[0]) && wingOuter(st, st.wings[1]), 'the Stuka\'s inner gull panel is not rounded, its outer panel is');
  for (const id in WTIP) {
    const m = PLANES[id].mdl, k = WTIP[id], outer = m.wings.filter(w => wingOuter(m, w)), bad = [];
    for (const w of outer) for (const s of [1, -1]) {
      const g = wingRound(w, s, k), O = g.sh.ops, sp = w.span, t = w.t || .18, lo = Math.min(...w.a), hi = Math.max(...w.a);
      const pts = O.filter(o => o[0] !== 'z').flatMap(o => o.slice(1).reduce((l, v, i, A) => (i % 2 ? l : l.concat([[v, A[i + 1]]])), []));
      const L = O.filter(o => o[0] === 'l'), first = L[0], r = sp - first[2], top = Math.max(...pts.map(p => p[1])), tip = pts.find(p => p[1] === top);
      if (!(O[0][0] === 'm' && near(O[0][1], w.a[0]) && near(O[0][2], 0) && near(L[L.length - 1][1], w.a[1]) && near(L[L.length - 1][2], 0) && O[O.length - 1][0] === 'z')) bad.push('root');
      if (!near((first[1] - w.a[0]) * sp, (w.a[2] - w.a[0]) * first[2])) bad.push('leading edge');
      if (!(near(top, sp) && tip[0] >= Math.min(w.a[2], w.a[3]) - 1e-6 && tip[0] <= Math.max(w.a[2], w.a[3]) + 1e-6)) bad.push('span');
      if (!pts.every(p => p[0] >= lo - 1e-6 && p[0] <= hi + 1e-6 && p[1] >= -1e-6 && p[1] <= sp + 1e-6)) bad.push('outline');
      if (!(r > 0 && r <= .3 * sp + 1e-6)) bad.push('radius ' + r.toFixed(2));
      const tr = JSON.stringify(g.ops), want = JSON.stringify([['t', 0, 0, -t / 2], ['rx', Math.PI / 2]].concat(s < 0 ? [['s', 1, 1, -1]] : []));
      if (!(g.o.depth === t && !g.o.bevelEnabled && tr === want)) bad.push('extrusion');
    }
    ok(outer.length >= 2 && !bad.length, id + ': ' + outer.length + ' outer panels rounded, within the square wing (root, leading edge, span, extrusion)' + (bad.length ? ': ' + [...new Set(bad)].join(', ') : ''));
  }
} else console.log('no rounded wing tips (WTIP): a page before them');
done();
