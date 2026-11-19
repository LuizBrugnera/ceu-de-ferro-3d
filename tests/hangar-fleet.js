'use strict';
/* the hangar's list and the numbers of the diary (from the play-test): fleetIds only gives a model of a side the era has colours for
   (the insurgents' side 2 models, #67, made the Tank class throw "reading 'col'" in the Today era); the diary writes its numbers with gN
   (a comma, one decimal), never raw; the General View's panels start under the bar when it wraps (1280 px). Needs no browser. A second */
const H = require('./harness'), fs = require('fs'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8');
const C = H.load({ seed: 3 });
const src = html.match(/const fleetIds = [^\n]*/)[0];
ok(!!src, 'fleetIds is in the page');
const DEFS = C.$('DEFS'), ERAS = C.$('ERAS');
for (const era of Object.keys(ERAS)) {
  const fleetIds = new Function('DEFS', 'ERAS', 'era', src + '; return fleetIds;')(DEFS, ERAS, era);
  let bad = [];
  for (const k of Object.keys(DEFS)) for (const id of fleetIds(k)) if (!ERAS[era].sides[DEFS[k][id].side]) bad.push(k + ':' + id);
  ok(!bad.length, era + ': every model the hangar lists has its side in ERAS.sides' + (bad.length ? ' (' + bad.join(', ') + ')' : ''));
  ok(fleetIds('tank').length > 0, era + ': the Tank class still lists tanks (' + fleetIds('tank').join(', ') + ')');
}
{   // a page whose era lacks the insurgents' side 2 (the 2-side Today era of the report): the hangar must hide their models, not throw
  const E2 = { modern: { sides: ERAS.modern.sides.slice(0, 2) } }, f = new Function('DEFS', 'ERAS', 'era', src + '; return fleetIds;')(DEFS, E2, 'modern');
  ok(!f('tank').includes('t55') && f('tank').includes('abrams') && !f('art').includes('tec107'), 'with only 2 sides in the era, the hangar lists no side 2 model (t55, t62, tec107) and still lists the others');
}
ok(html.includes("': pede ' + gN(D.push)"), 'the diary rounds "pede N esquadras"');
ok(html.includes("gN(AFP.reach / 1000) + ' km'"), 'the fortification plan writes the reach in km with a comma');
ok(html.includes("gN(a.min) + ' min a pé"), 'the approaches write the walking minutes with a comma');
ok(/\.gen:not\(\[data-seat\]\) \.gen-l[^}]*var\(--gt/.test(html), 'the spectator\'s General View panels start under the bar');
done();
