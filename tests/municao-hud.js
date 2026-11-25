'use strict';
/* The ammunition on the soldier's screen (P9 of the polish board, cf-pol2-fase1). The weapon in hand's rounds were only a 12 px line in the
   list at the top left, and nothing warned of a magazine running low. magLow says low (a quarter of a magazine or less, at least the last
   round) and empty, for weapons that load magazines; ammoHud draws the weapon in hand at the bottom right, its rounds large, in the
   accent while low and red when empty; under the aim, PENTE BAIXO or ÚLTIMO PENTE while low. The view's functions run on a stub canvas */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), ok = H.ok;
const html = fs.readFileSync(H.PAGE, 'utf8');
console.log('page: ' + H.PAGE);
const body = name => { const i = html.indexOf('function ' + name + '('); return i < 0 ? '' : html.slice(i, html.indexOf('\n}\n', i) + 3); };
const line = re => (html.match(re) || [''])[0];
if (!body('magLow')) { console.log('no magLow: a page before it'); process.exit(0); }

const out = [], hx = { font: '', fillStyle: '', fillRect() {}, measureText: s => ({ width: s.length * 6 }) };
const ctx = vm.createContext({ hx, cw: 1280, ch: 800, FOE: 'red', Math, String,
  txt: (s, x, y, size, col) => out.push([s, col, size]), bar: (x, y, w, h, k) => out.push(['bar', k]) });
vm.runInContext(line(/const MAGLOW = [^\n]*\n/).replace('const MAGLOW', 'globalThis.MAGLOW') + body('magLow') + body('ammoHud'), ctx);
const rifle = { name: 'M4A1', mag: 30, rl: 2.5 }, bolt = { name: 'Kar98k', mag: 5, rl: 3 }, nade = { name: 'Granada', mag: 1, k: 'nade' }, lmg = { name: 'M249', mag: 200, lmg: 1, rl: 6 };
const W = (d, mag, res, rl) => ({ d, mag, res, rl: rl || 0 });

console.log('-- magLow --');
ok(ctx.magLow(W(rifle, 30, 7)) === 0 && ctx.magLow(W(rifle, 8, 7)) === 0, 'a rifle with 30 or 8 rounds of 30: enough');
ok(ctx.magLow(W(rifle, 7, 7)) === 1 && ctx.magLow(W(rifle, 1, 0)) === 1, 'with 7 (a quarter) or the last round: low');
ok(ctx.magLow(W(rifle, 0, 3)) === 2, 'with none in the magazine: empty');
ok(ctx.magLow(W(bolt, 2, 4)) === 0 && ctx.magLow(W(bolt, 1, 4)) === 1, 'a 5-round bolt rifle: 2 is enough, the last round is low');
ok(ctx.magLow(W(nade, 1, 1)) === 0 && ctx.magLow(W(nade, 0, 0)) === 0, 'grenades, counted in units: never a magazine warning');

console.log('-- ammoHud --');
const draw = m => { out.length = 0; ctx.ammoHud(m, 1, 'ink', 'acc', 'dim', 'disp'); return out.slice(); };
let o = draw(W(rifle, 24, 7));
ok(o.some(t => t[0] === 'M4A1') && o.some(t => t[0] === '24' && t[1] === 'ink' && t[2] === 24) && o.some(t => t[0] === '  7 pentes'), 'a full-ish rifle: the name, 24 large in the ink, 7 pentes');
o = draw(W(rifle, 5, 7)); ok(o.some(t => t[0] === '5' && t[1] === 'acc'), 'low: the count in the accent');
o = draw(W(rifle, 0, 0)); ok(o.some(t => t[0] === '0' && t[1] === 'red') && o.some(t => t[0] === '  0 pentes' && t[1] === 'red'), 'out of everything: red');
o = draw(W(lmg, 150, 1)); ok(o.some(t => t[0] === '  1 cinta'), 'a belt-fed gun: 1 cinta');
o = draw(W(rifle, 0, 6, 1.2)); ok(o.some(t => t[0] === 'bar'), 'reloading: the bar under it');
o = draw(W(nade, 1, 1)); ok(o.some(t => t[0] === '×2'), 'grenades: ×2');

console.log('-- hudMan --');
const hm = body('hudMan');
ok(/ammoHud\(a, u, ink, acc, dim, disp\)/.test(hm) && /magLow\(a\) === 1\) txt\(a\.res \? 'PENTE BAIXO/.test(hm), 'hudMan draws the readout and the low warning under the aim');
H.done();
