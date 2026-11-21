'use strict';
/* the flight HUD's labels (cf-miras-impl; cf-pol-testes-b and cf-pol-hud found the same two): in a cockpit the weapons list starts under the
   damage panel (it started 16 u inside it, so the panel hid the gun's line), and the enemy aircraft's range labels no longer write over each
   other: tagTxt keeps the first label asked for a place (the lock, then the nearest) and leaves out, or lifts, a later one on it.
   Both live in the view part of the page (after the 3D scene marker): the page's source is read and run alone, with no DOM */
const fs = require('fs'), vm = require('vm'), { PAGE, ok, done } = require('./harness');
const html = fs.readFileSync(PAGE, 'utf8');
const body = name => { const i = html.indexOf('function ' + name + '('); return i < 0 ? '' : html.slice(i, html.indexOf('\n}\n', i) + 3); };
const fly = body('hudFly'), dmg = body('dmgPanel'), hud = body('drawHud');

/* 1. the cockpit's weapons list against the damage panel, from the page's own numbers */
const m = html.match(/const DMGP = (\{[^}]*\})/);
ok(!!m, 'the damage panel keeps its size and cockpit top in one place (DMGP)');
if (m) {
  const D = vm.runInNewContext('(' + m[1] + ')'), at = fly.match(/\} else y = \(([^)]*)\) \* u;/);
  ok(/W = DMGP\.w \* u, H = DMGP\.h \* u/.test(dmg) && /\? DMGP\.y \* u :/.test(dmg), 'dmgPanel draws with DMGP (' + D.w + ' × ' + D.h + ' u, top ' + D.y + ' u in a cockpit)');
  const y0 = at ? vm.runInNewContext(at[1], { DMGP: D }) : NaN;
  ok(y0 >= D.y + D.h, 'in a cockpit hudFly starts the weapons list at ' + y0 + ' u, under the panel\'s bottom at ' + (D.y + D.h) + ' u (it was 170 u)');
}

/* 2. tagTxt on a stub canvas: the first label keeps its place, one over it is left out, or lifted when it may go up */
const ts = html.match(/const HTAG = \{[^\n]*\n/), tt = body('tagTxt');
ok(!!ts && !!tt, 'tagTxt and its list of written labels (HTAG) are in the page');
if (ts && tt) {
  const drawn = [], ctx = vm.createContext({ hx: { font: '', measureText: s => ({ width: s.length * 6 }) }, txt: (s, x, y) => drawn.push([s, x, Math.round(y)]) });
  vm.runInContext(ts[0].replace('const HTAG', 'globalThis.HTAG') + tt, ctx);
  const T = (s, x, y, up) => ctx.tagTxt(s, x, y, 11, '#f00', 'center', up);
  const a = T('14,3 km', 400, 300), b = T('14,9 km', 404, 302), c = T('16,2 km', 520, 300), d = T('15,0 km', 402, 301, 2);
  ok(a && !b, 'a second range label on the first is left out (' + drawn.map(e => e[0]).join(', ') + ')');
  ok(c, 'one clear of it is written');
  ok(d && drawn.some(e => e[0] === '15,0 km' && e[2] < 300), 'with room to go up, an overlapping label is lifted a line instead (' + (drawn.find(e => e[0] === '15,0 km') || []).join(' ') + ')');
  ctx.HTAG.r.length = 0; ok(T('14,9 km', 404, 302), 'a new frame starts with no label written (HTAG.r cleared)');
}
ok(/far\.push\(\[lock \? -1 : rng,/.test(hud) && /far\.sort\(\(a, b\) => a\[0\] - b\[0\]\); for \(const l of far\) tagTxt\(/.test(hud), 'drawHud writes the enemy aircraft\'s ranges through tagTxt, the lock first and then the nearest');
ok(/HTAG\.r\.length = 0/.test(hud), 'drawHud clears the written labels each frame');
done();
