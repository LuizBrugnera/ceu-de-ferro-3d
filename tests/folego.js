'use strict';
/* cf-folego: the breath is endless. A soldier holding Shift+W runs at MAN.run the whole time, never winded (m.stam 1, m.wind false); a
   sniper holding his breath in the scope keeps it held and his sway at the held amplitude well past the old 4.5 s, never "out".
   node tests/folego.js */
const { load, ok, done } = require('./harness.js');
const C = load({ seed: 4 }), $ = C.$, MAN = $('MAN'), SNIPE = $('SNIPE'), INF = $('INF'), SNIPERS = $('SNIPERS');
for (const era of ['ww2', 'modern']) {
  const S = C.sandbox(era);
  let at = null;   // level open ground, 160 m of it toward +x
  for (let x = 3000; x < 9000 && !at; x += 150) for (let z = -1500; z < 1500 && !at; z += 150) {
    let flat = true; for (let k = 0; k <= 160; k += 10) if (Math.abs(C.hgt(x + k, z) - C.hgt(x, z)) > 4 || C.hgt(x + k, z) <= S.T.WL + 1) flat = false;
    if (flat && !C.near(x + 80, z, 90).length) at = { x, z };
  }
  /* Shift+W for 20 s */
  const m = C.addMan(INF[era][0][0], 0, at.x, at.z, 0); m.ai = null; m.inv = 1;
  const sp = []; let wind = 0, stam = 1;
  for (let i = 0; i < 20 * 60; i++) {
    m.ctl.run = true; m.ctl.mx = 1; m.ctl.mz = 0; m.ctl.aim = { x: 1, y: 0, z: 0 };
    const x0 = m.x; C.step(1 / 60);
    if (i % 60 === 59) sp.push(Math.abs(m.x - x0) * 60);
    if (m.wind) wind++; stam = Math.min(stam, m.stam);
  }
  const lo = Math.min(...sp.slice(1)), hi = Math.max(...sp.slice(1));
  ok(!wind && stam === 1, era + ': 20 s of sprint, never winded (m.wind ' + wind + ' steps, m.stam at least ' + stam + ')');
  ok(lo > MAN.run * .95 && hi < MAN.run * 1.05, era + ': the run keeps its speed (' + lo.toFixed(2) + '..' + hi.toFixed(2) + ' m/s, MAN.run ' + MAN.run + ')');
  /* a sniper lying still holds his breath 12 s */
  const sn = C.addMan(Object.keys(SNIPERS[era][0])[0], 0, at.x - 40, at.z + 30, 0); sn.ai = null; sn.inv = 1;
  sn.ctl.st = 2; C.run(2);
  let held = 0, n = 0, out = 0, a = 0;
  for (let i = 0; i < 12 * 60; i++) { sn.ctl.hb = true; sn.ctl.mx = sn.ctl.mz = 0; C.step(1 / 60); n++; if (sn.sw.hb) held++; if ($('S').t < sn.sw.out) out++; a = sn.sw.a; }
  ok(held === n && out === 0, era + ': the breath held ' + held + ' of ' + n + ' steps, ' + out + ' steps winded');
  ok(a < SNIPE.sway[2] * SNIPE.hold.k * 1.05, era + ': after 12 s held the sway is the held one (' + a.toExponential(2) + ', lying unheld ' + SNIPE.sway[2].toExponential(2) + ')');
}
done();
