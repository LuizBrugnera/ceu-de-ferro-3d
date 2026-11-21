'use strict';
/* the flight HUD's labels (cf-pol-testes-b, cf-miras-impl): in a cockpit the weapons list starts under the damage panel (it started 16 u inside
   it, so the panel hid the gun's line), and enemy aircraft close together on the screen share one distance label, the nearest with ×n (a flight
   at 15 km was a smear of distances). Both live in the view part of the page (after the 3D scene marker): the page's source is read, no DOM */
const fs = require('fs'), vm = require('vm'), { PAGE, ok, done } = require('./harness');
const html = fs.readFileSync(PAGE, 'utf8');
const body = name => { const i = html.indexOf('function ' + name + '('); return i < 0 ? '' : html.slice(i, html.indexOf('\n}\n', i)); };
const fly = body('hudFly'), dmg = body('dmgPanel'), hud = body('drawHud');

/* 1. the cockpit's weapons list against the damage panel, from the page's own numbers */
const m = html.match(/const DMGP = (\{[^}]*\})/);
ok(!!m, 'the damage panel keeps its size and cockpit top in one place (DMGP)');
if (m) {
  const D = vm.runInNewContext('(' + m[1] + ')'), at = fly.match(/\} else y = \(([^)]*)\) \* u;/);
  ok(/W = DMGP\.w \* u, H = DMGP\.h \* u/.test(dmg) && /\? DMGP\.y \* u :/.test(dmg), 'dmgPanel draws with DMGP (' + D.w + ' × ' + D.h + ' u, top ' + D.y + ' u in a cockpit)');
  const y0 = at ? vm.runInNewContext(at[1], { DMGP: D }) : NaN;
  ok(y0 >= D.y + D.h, 'in a cockpit hudFly starts the weapons list at ' + y0 + ' u, under the panel\'s bottom at ' + (D.y + D.h) + ' u (it was 170 u)');
} else ok(/else y = 170 \* u;/.test(fly) === false, 'the old start at 170 u, inside the panel, is gone');

/* 2. enemy aircraft labels grouped by place on the screen */
ok(/airT\.find\(o => Math\.abs\(o\.x - s\.x\) < 30 \* u && Math\.abs\(o\.y - s\.y\) < 16 \* u\)/.test(hud), 'drawHud groups enemy aircraft within 30 × 16 u of each other');
ok(/for \(const b of airT\) txt\(\(b\.r \/ 1000\)\.toFixed\(1\)\.replace\('\.', ','\) \+ ' km' \+ \(b\.n > 1 \? ' ×' \+ b\.n : ''\)/.test(hud), 'one label a group: the nearest distance, with a decimal comma, and ×n');
ok(!/txt\(\(lock \? lockName \+ ' ' : ''\) \+ \(rng \/ 1000\)/.test(hud), 'no more one distance label for every aircraft');
ok(/if \(lock\) txt\(lockName \+ ' '/.test(hud), 'the locked aircraft keeps its own label with the weapon\'s name');
done();
