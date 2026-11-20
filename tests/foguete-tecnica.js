'use strict';
/* cf-foguete-tecnica: the Insurgents' S-5 and S-8 rocket technicals fire real rockets that burst where they strike (the ground near a truck and
   soldiers hurts them). node tests/foguete-tecnica.js */
const { load, ok, done } = require('./harness.js');
const C = load({ seed: 3 }), $ = C.$, ARMS = $('ARMS'), ARMK = $('ARMK'), INF = $('INF');
for (const id of ['s5', 's8']) {
  const S = C.sandbox('modern'), w = ARMS[id], x = 4000, z = 300;
  const tec = C.addVehicle('truck', null, 1, x, z, 0); tec.inv = 0;
  const trk = C.addVehicle('truck', null, 0, x + 200, z, 0); trk.inv = 0;
  const men = []; for (let i = 0; i < 3; i++) { const m = C.addMan(INF.modern[0][0], 0, x + 200 + 4 * i, z + 4, 0); m.ai = null; m.inv = 0; men.push(m); }
  const hp0 = trk.hp, mh0 = men.reduce((a, m) => a + m.hp, 0);
  const g = C.hgt(x + 202, z + 2), m0 = { x: x + 3, y: C.hgt(x, z) + 2.5, z }, dx = 202 - 3, dy = g - m0.y, L = Math.hypot(dx, dy);
  const b = ARMK[w.k].fire(tec, w, m0, { x: dx / L, y: dy / L + .02, z: 0 });
  ok(w.k === 'rkt' && b && b.k === 'rocket' && S.bombs.includes(b), id + ': the pod fires a rocket (S.bombs), not a bullet');
  C.run(2);
  const mh = men.reduce((a, m) => a + Math.max(0, m.hp), 0);
  ok(b.gone, id + ': the rocket struck and burst');
  ok(trk.hp < hp0 || trk.dead, id + ': the truck by the burst is hurt (' + hp0 + ' -> ' + trk.hp.toFixed(1) + ')');
  ok(mh < mh0, id + ': the soldiers by the burst are hurt (' + mh0 + ' -> ' + mh.toFixed(1) + ')');
}
done();
