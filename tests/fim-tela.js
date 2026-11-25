'use strict';
/* The end screen (P29 of the polish board, cf-pol2-fase1): the result was a title in the accent whatever it was, and no element had the
   focus (document.activeElement was the body). Now overFill marks the sheet with the result (data-res win, lose or draw), the CSS gives
   the title that colour, and showOver puts the focus on the title (tabindex -1): read first, Tab on to the buttons, and no Space or Enter
   still held from the fight presses "Voltar ao hangar". overFill runs on a stub DOM */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), ok = H.ok;
const html = fs.readFileSync(H.PAGE, 'utf8');
console.log('page: ' + H.PAGE);
const body = name => { const i = html.indexOf('function ' + name + '('); return i < 0 ? '' : html.slice(i, html.indexOf('\n}\n', i) + 3); };
if (!/dataset\.res/.test(body('overFill'))) { console.log('no data-res: a page before it'); process.exit(0); }

console.log('-- the markup and the style --');
ok(/<h2 id="overTitle" tabindex="-1">/.test(html), 'the title can take the focus (tabindex -1)');
ok(/\.over\[data-res="win"\] h2\{color:#6fc3b2\}/.test(html) && /\.over\[data-res="lose"\] h2\{color:#e2604f\}/.test(html) && /\.over\[data-res="draw"\] h2\{color:var\(--fg\)\}/.test(html), 'a win in the own side\'s colour, a defeat in the enemy\'s, a draw plain');
ok(/overEl\.hidden = false;\n  try \{ \$\('#overTitle'\)\.focus\(\{ preventScroll: true \}\); \} catch \(e\) \{\}/.test(body('showOver')), 'showOver focuses the title once the sheet shows');

console.log('-- overFill --');
const el = () => ({ textContent: '', dataset: {}, style: {}, append() {}, className: '' }), els = {}, overEl = el();
const ctx = vm.createContext({ overEl, Math, document: { createElement: el }, $: s => (els[s] = els[s] || el()), mmss: () => '0:03', cqPs: () => 0, cqHeld: () => 5, cqRank: () => ({ place: [0, 1] }), foeCol: () => '', pSide: () => 0, Net: {} });
vm.runInContext(body('overFill'), ctx);
const res = (win, me) => { ctx.S = { me, why: 'x', fac: [0, 1], E: { sides: [{ name: 'EUA' }, { name: 'Rússia' }] }, cq: { res: [win, 2], ps: [0, 0], place: [0, 1], T0: 60, T: 0, st: { k: 0, c: 0, d: 0 }, lost: [[0, 0, 0], [0, 0, 0]], out: [] } }; ctx.overFill(); return overEl.dataset.res; };
ok(res(0, 0) === 'win' && res(1, 0) === 'lose' && res(-1, 0) === 'draw' && res(1, 1) === 'win', 'win, lose and draw by the side that won and mine');
ctx.S.cq = null; ctx.overFill(); ok(overEl.dataset.res === '', 'no result (a match left before its end): no colour');
H.done();
