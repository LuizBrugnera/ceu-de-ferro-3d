'use strict';
/* The corner map and the blink (P30 of the polish board, cf-pol2-fase1). Friend and foe on the corner map differed only by colour (green
   and red); now mapDot draws a friend as a square and a foe as a diamond, and an enemy aircraft's triangle is hollow. The HUD's blink
   (warnings, a point being taken) ignored "reduzir movimento"; hudBlink holds it lit then. The view's functions run on a stub canvas */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), ok = H.ok;
const html = fs.readFileSync(H.PAGE, 'utf8');
console.log('page: ' + H.PAGE);
const body = name => { const i = html.indexOf('function ' + name + '('); return i < 0 ? '' : html.slice(i, html.indexOf('\n}\n', i) + 3); };
const line = re => (html.match(re) || [''])[0];
if (!body('mapDot')) { console.log('no mapDot: a page before it'); process.exit(0); }

console.log('-- mapDot --');
const calls = [], hx = { fillStyle: '', fillRect() { calls.push('rect'); }, beginPath() {}, moveTo() { calls.push('path'); }, lineTo() {}, closePath() {}, fill() { calls.push('fill:' + this.fillStyle); } };
const ctx = vm.createContext({ hx, Math, reduced: false, S: { t: 0 } });
vm.runInContext(body('mapDot') + line(/const hudBlink = [^\n]*\n/).replace('const hudBlink', 'globalThis.hudBlink'), ctx);
ctx.mapDot(10, 10, 2, 'green', false); const fr = calls.splice(0);
ctx.mapDot(10, 10, 2, 'red', true); const fo = calls.splice(0);
ok(fr.join() === 'rect,rect' && !fo.includes('rect') && fo.filter(c => c === 'path').length === 2 && fo.includes('fill:red'), 'a friend: a square on its edge; a foe: a diamond on its edge, in its colour');
const mm = html.slice(html.indexOf('const mw = Math.min(190 * u, cw * .36)'), html.indexOf('cueMarks(mX, mZ, me, u, false)'));
ok((mm.match(/dot\([^;]*, (t|b\.team|g\.team) !== me\)/g) || []).length === 5, 'every base, supply base, site, vehicle and soldier on the corner map says whether it is a foe');
ok(/if \(q\.team !== me\) tri\(mX\(q\.x\), mZ\(q\.z\), a, 1\.4,/.test(mm), 'an enemy aircraft\'s triangle is hollow');

console.log('-- hudBlink --');
const seq = () => [0, .2, .4, .6, .8].map(t => { ctx.S.t = t; return ctx.hudBlink(5); }).join('');
ok(seq() === '01010', 'motion allowed: it blinks five times a second (' + seq() + ')');
ctx.reduced = true; ok(seq() === '11111', '"reduzir movimento": always lit (' + seq() + ')');
ok(/blink = hudBlink\(5\)/.test(body('drawHud')), 'drawHud takes its blink from hudBlink');
H.done();
