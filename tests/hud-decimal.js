'use strict';
/* Numbers on the screen use the decimal comma (cf-pol-hud): every toFixed(1) or toFixed(2) on a line that writes text for the player (txt, gTxt,
   textContent, fillText, a title, a float, the feed, a banner, the general's log) is followed by .replace('.', ','). The HUD showed "16.7 km",
   "G 1.1", "DERIVA 0.0 m/s" beside "5,1 km" and "39,5 contra 0". A static scan of the page, no browser */
const fs = require('fs'), path = require('path'), H = require('./harness'), ok = H.ok;
const lines = fs.readFileSync(process.env.PAGE || path.join(__dirname, '..', 'Céu de Ferro 3D.html'), 'utf8').split('\n');
const out = /\btxt\(|gTxt\(|textContent|fillText|\.title\b|floats\.push|feed\.push|S\.banner|gLog\(/, bad = [];
lines.forEach((l, i) => {
  if (!out.test(l)) return;
  for (const m of l.matchAll(/toFixed\([12]\)/g)) {
    const after = l.slice(m.index + m[0].length, m.index + m[0].length + 20), before = l.slice(Math.max(0, m.index - 12), m.index);
    if (after.startsWith(".replace('.', ',')") || /^\s*\)\s*[*/]/.test(after) || /\+\s*$/.test(before) && /^\)/.test(after)) continue;   // numbers fed back into maths or a unary + are not text
    if (/^[)\]]*\s*[,}]/.test(after) && /\[\s*\+?[\w.]*$|:\s*\+?[\w.]*$/.test(before)) continue;   // a value in a net message or an object
    if (/style\.\w+\s*=\s*\(?[^;]*$/.test(l.slice(0, m.index).split(';').pop())) continue;   // a CSS value (style.left = …%), not text
    bad.push((i + 1) + ': …' + l.slice(Math.max(0, m.index - 40), m.index + 30).trim() + '…');
  }
});
ok(!bad.length, 'every decimal written on the screen uses a comma' + (bad.length ? ' (' + bad.length + '):\n     ' + bad.slice(0, 12).join('\n     ') : ''));
H.done();
