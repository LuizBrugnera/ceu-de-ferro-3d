'use strict';
/* The HUD's scale and the arrows toward aircraft off the screen (P24 and P25 of the polish board, cf-pol2-fase1). P24: hudU stopped at 1.25
   (1920 × 1080 drew the HUD of a 1600 px screen) and went down to .62 in a desktop window under 1000 px (11 px text at 6.8 px). Now 1.5 at
   1920 × 1080 and, with a mouse, never under .8; a touch screen keeps .62 (D5: the phone is left alone). P25: the arrow toward an enemy
   aircraft off the screen sat 22 px in from the edge, over the list of weapons at the top left and the panels in the corners; arrowAt puts
   it on an ellipse round the aim, inside them */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), ok = H.ok;
const html = fs.readFileSync(H.PAGE, 'utf8');
console.log('page: ' + H.PAGE);
const body = name => { const i = html.indexOf('function ' + name + '('); return i < 0 ? '' : html.slice(i, html.indexOf('\n}\n', i) + 3); };
const line = re => (html.match(re) || [''])[0];
if (!body('arrowAt')) { console.log('no arrowAt: a page before it'); process.exit(0); }
const ctx = vm.createContext({ cw: 1280, ch: 800, coarse: false, Math, clamp: (v, a, b) => Math.max(a, Math.min(b, v)) });
vm.runInContext([line(/const HUDU = [^\n]*\n/), line(/const hudU = [^\n]*\n/), line(/const ARRW = [^\n]*\n/)].join('').replace(/const (HUDU|hudU|ARRW)/g, 'globalThis.$1') + body('arrowAt'), ctx);
const U = (w, h, c) => { ctx.cw = w; ctx.ch = h; ctx.coarse = !!c; return +ctx.hudU().toFixed(3); };

console.log('-- P24: hudU --');
ok(U(1280, 800) === 1 && U(1100, 700) === 1, '1280 × 800 and 1100 × 700: 1, as before');
ok(U(1920, 1080) === 1.5, '1920 × 1080: 1.5 (it stopped at 1.25)');
ok(U(2560, 1440) === 1.5, '2560 × 1440: 1.5 at most');
ok(U(900, 700) === .9 && U(640, 480) === .8, 'a desktop window of 900 px: .9; of 640 px: .8 (it was .64), never under .8 with a mouse');
ok(U(390, 844, 1) === .62, 'a touch screen of 390 px: .62, as before (D5)');

console.log('-- P25: arrowAt --');
for (const [w, h] of [[1280, 800], [1920, 1080]]) {
  ctx.cw = w; ctx.ch = h; ctx.coarse = false; const u = ctx.hudU(), bad = [];
  for (let d = 0; d < 360; d += 5) {
    const r = d * Math.PI / 180, [x, y, a] = ctx.arrowAt(Math.cos(r) * 5000, Math.sin(r) * 5000);
    const list = x < 14 + 240 * u && y < 230 * u, mini = x > w - 14 - 200 * u && y < 220 * u, estado = x < 14 + 200 * u && y > h - 120 * u, ammo = x > w - 190 * u && y > h - 80 * u, strip = y < 130 * u;
    if (list || mini || estado || ammo || strip || Math.abs(a - Math.atan2(Math.sin(r), Math.cos(r))) > 1e-9) bad.push(d);
  }
  ok(!bad.length, w + ' × ' + h + ': at every bearing the arrow points toward the aircraft and is off the weapons list, the minimap, ESTADO, the ammunition, the top strip' + (bad.length ? ' (bad at ' + bad.join(', ') + '°)' : ''));
}
ok(!/\(cw \/ 2 - 22\) \/ \(Math\.abs\(dx\)/.test(html), 'nothing puts the arrow on the screen\'s edge any more');
H.done();
