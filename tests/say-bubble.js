'use strict';
/* the soldiers' lines (SAY) in their balloons (cf-npc-falas): the HUD's canvas writes with textBaseline 'top' and the balloon put its text
   where an alphabetic baseline would sit, so the line fell under its box, dark on the ground or the night sky. sayBub, run alone on a stub
   canvas, must keep the text centred in the box whatever baseline it finds, give the canvas back its baseline, and put the box on whole
   pixels; drawHud and the commander's map (rtsDraw) both draw through it */
const fs = require('fs'), vm = require('vm'), { PAGE, ok, done } = require('./harness');
const html = fs.readFileSync(PAGE, 'utf8');
const body = name => { const i = html.indexOf('function ' + name + '('); return i < 0 ? '' : html.slice(i, html.indexOf('\n}\n', i) + 3); };
const cst = html.match(/const SAYB = \{[^\n]*\n/), bx = body('sayBox'), bb = body('sayBub');
ok(!!cst && !!bx && !!bb, 'the balloon (SAYB, sayBox, sayBub) is in the page');
if (cst && bx && bb) {
  const ctx = vm.createContext({ Math });
  vm.runInContext(cst[0].replace('const SAYB', 'globalThis.SAYB') + bx + bb, ctx);
  for (const base of ['top', 'alphabetic']) for (const k of [1, 1.25, .62]) {
    const texts = [], g = { textBaseline: base, font: '', measureText: s => ({ width: s.length * 7.3 * k }),
      beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {},
      fillText(s, x, y) { const sz = parseFloat(this.font); texts.push({ s, x, y, base: this.textBaseline, top: this.textBaseline === 'middle' ? y - sz / 2 : this.textBaseline === 'top' ? y : y - sz * .8, bot: this.textBaseline === 'middle' ? y + sz / 2 : this.textBaseline === 'top' ? y + sz : y + sz * .2 }); } };
    const b = ctx.sayBox(g, 400.4, 300.7, 'Tá louco? Lá morreu gente!', k);
    ctx.sayBub(g, 400.4, 300.7, 'Tá louco? Lá morreu gente!', true, k, b);
    const t = texts[0], [x, y, w, h] = b, tag = 'baseline ' + base + ', scale ' + k;
    ok(!!t && t.top >= y && t.bot <= y + h, tag + ': the line is inside its box (text ' + (t && t.top.toFixed(1)) + '-' + (t && t.bot.toFixed(1)) + ', box ' + y + '-' + (y + h) + ')');
    ok(b.every(Number.isInteger), tag + ': the box is on whole pixels (' + b.join(', ') + ')');
    ok(y + h < 300.7 && Math.abs(x + w / 2 - 400.4) <= 1, tag + ': the box is over the tip, centred on it');
    ok(g.textBaseline === base, tag + ': the canvas gets its baseline back');
    ok(parseFloat(g.font) >= 13 * k - .01, tag + ': the text is ' + parseFloat(g.font) + ' px (13 × scale; it was 11)');
  }
}
ok(/sayBub\(hx, s\.x, s\.y, t, g\.team === me, u, b\)/.test(body('drawHud')), 'drawHud draws the lines through sayBub, at the HUD\'s scale');
ok(/sayBub\(g, s\.x, s\.y, t, m\.team === V\.t, 1, b\)/.test(body('rtsDraw')), 'the commander\'s map draws them through sayBub too');
done();
