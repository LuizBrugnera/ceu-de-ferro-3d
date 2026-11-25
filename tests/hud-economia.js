'use strict';
/* The general's economy off the soldier's screen (P19 of the polish board, cf-pol2-fase1, the owner's D6 = A). Under the supply bases, the
   soldier's and the crew's HUD wrote the general's block (bmrHud: GENERAL · SUPRIMENTOS, energy and metal with what comes in and goes out
   a minute, the crates, the works a minute) all match long. Now the HUD has none of it: the side's stock shows in the build mode under the
   bar (obrStock, P14) and on the General's view (ecoVM's rows) */
const fs = require('fs'), H = require('./harness'), ok = H.ok;
const html = fs.readFileSync(H.PAGE, 'utf8');
const body = name => { const i = html.indexOf('function ' + name + '('); return i < 0 ? '' : html.slice(i, html.indexOf('\n}\n', i) + 3); };
const C = H.load({ seed: 78, eco: 1 }), $ = C.$;
if (typeof $('obrStock') !== 'function') { console.log('no obrStock: a page before it'); process.exit(0); }

console.log('-- the soldier\'s screen --');
const dh = body('drawHud');
ok(dh && !/bmrHud\(/.test(dh) && !/GENERAL · SUPRIMENTOS/.test(html), 'drawHud writes no economy block, and no line says GENERAL · SUPRIMENTOS');

console.log('-- where the stock still shows --');
{
  const S = C.newState('ww2', 'schutze', { cls: 'inf', mouse: true }), P = S.my, d = S.eco && S.eco.d[P.team];
  if (!d) ok(false, 'the economy is on in this match');
  else {
    d.en = 311; d.mt = 224;
    const rows = $('ecoVM')(P.team, false).rows, tx = $('ECO').tx.r, en = rows.find(r => r.label === tx.en), mt = rows.find(r => r.label === tx.mt);
    ok(en && /^311 \//.test(en.value) && mt && /^224 \//.test(mt.value), 'the General\'s view: ' + tx.en + ' ' + (en && en.value) + ', ' + tx.mt + ' ' + (mt && mt.value));
    ok($('obrStock')(P, { k: 1 })[0] === 'SEU LADO TEM 311 ENERGIA · 224 METAL', 'the build mode, under the bar');
  }
}
H.done();
