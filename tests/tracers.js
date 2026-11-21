'use strict';
/* tracers (TRC, cf-pol-armas): a squad machine gun (MG 42, BAR, M249, PKP) fires one tracer every TRC.lmg rounds, the player's and the AI's
   alike; a rifle and a pistol none; the count draws no dice, so the same seed gives the same battle */
const H = require('./harness'), { ok, done } = H;
console.log('page: ' + H.PAGE);
const C0 = H.load(); if (C0.$('typeof TRC') === 'undefined') { console.log('no TRC: a page before it'); process.exit(0); }

/* the rounds a soldier with weapon id fires in secs s at a target 60 m off */
function fire(id, kit, secs) {
  const C = H.load({ seed: 3 }), $ = C.$, S = C.sandbox('modern'), B = S.base[0];
  const m = C.addMan(kit, 0, B.x + 100, B.z + 50, 0); m.ai = null; m.arms[0] = Object.assign({}, m.arms[0], { d: $('SARMS')[id], mag: 1e6, res: 0, cool: 0 });
  m.ctl.aim = { x: 1, y: 0, z: 0 }; m.ctl.fire = true; m.h = 0;
  const seen = new Set(), out = [];
  C.run(secs, () => { m.held = false; for (const b of S.bullets) if (b.by === m && !seen.has(b)) { seen.add(b); out.push(b); } });
  return { out, TRC: $('TRC') };
}
for (const [id, kit] of [['mg42', 'mgschutze'], ['m249', 'blueSaw'], ['pkp', 'redMG'], ['bar', 'bargunner']]) {
  const { out, TRC } = fire(id, kit, 2), tr = out.map((b, i) => (b.tr ? i + 1 : 0)).filter(Boolean);
  ok(out.length >= 12 && tr.length === Math.floor(out.length / TRC.lmg) && tr.every(n => n % TRC.lmg === 0), id + ': ' + out.length + ' rounds, a tracer every ' + TRC.lmg + 'th (' + tr.slice(0, 5).join(', ') + '…)');
}
for (const [id, kit] of [['m4', 'blueRifle'], ['ak', 'redRifle'], ['m1911', 'blueRifle']]) {
  const { out } = fire(id, kit, 2);
  ok(out.length > 0 && out.every(b => !b.tr), id + ': ' + out.length + ' rounds, no tracer');
}
console.log('-- the same battle --');
{
  const fs = require('fs'), os = require('os'), path = require('path'), html = fs.readFileSync(H.PAGE, 'utf8'), NEW = 'tr: w.lmg && a.tn % TRC.lmg === 0 ? 1 : 0';
  const before = path.join(os.tmpdir(), 'cf-tracers-before-' + process.pid + '.html'); fs.writeFileSync(before, html.replace(NEW, 'tr: 0'));
  const run = page => { const C = H.load({ seed: 21, page }), S = C.watch('ww2', { len: 0 }); C.run(40, null, 1 / 20); return S.men.map(m => m.x.toFixed(3) + m.z.toFixed(3) + m.hp.toFixed(2)).join() + '|' + S.units.map(u => u.x.toFixed(3) + u.hp.toFixed(2)).join(); };
  const a = run(H.PAGE), b = run(before); fs.unlinkSync(before);
  ok(html.includes(NEW) && a === b, 'an AI × AI match of 40 s with the same seed, with the tracers and without them: the same soldiers and vehicles in the same places (the count rolls no dice)');
}
done();
