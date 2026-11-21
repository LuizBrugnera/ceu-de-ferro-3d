'use strict';
/* the planes' propeller blades and national markings (PROP, INSIG; cf-pol-modelos) against the planes: every plane named there exists and is
   drawn from its numbers (a textured model, mdl.glb, keeps its own look), each plane with a propeller (mdl.prop) or propeller discs on its
   nacelles (mdl.nac) has its blades counted, each marking is one the page draws, and each side wears its own: the Luftwaffe the
   Balkenkreuz, the Allies the roundel or the star, Russia the red star. The tables live in the 3D part, which the harness does not load:
   they are read here on their own */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8'), a = html.indexOf('/* ---------- the planes drawn from their numbers (cf-pol-modelos)');
console.log('page: ' + H.PAGE);
if (a < 0) { console.log('no propeller blades or markings (PROP, INSIG): a page before them'); process.exit(0); }
const b = html.indexOf('function insigTex(k)', a), ctx = vm.createContext({});
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
done();
