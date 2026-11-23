'use strict';
/* cf-foguete-alcance: an unguided rocket of a plane, a helicopter or a vehicle's pod flies about twice as far as before (4 s) before it bursts by
   itself, and still strikes a vehicle out there. node tests/foguete-alcance.js */
const { load, ok, done } = require('./harness.js');
const C = load({ seed: 5 }), $ = C.$, GR = $('GR'), ARMS = $('ARMS');
const LIFE = (() => { try { return $('RKT_LIFE'); } catch (e) { return 4; } })();   // 4 s before cf-foguete-alcance
ok(LIFE >= 8 && ARMS.s5.life >= 6.8 && ARMS.s8.life >= 7.2, 'rocket lifetimes: aircraft ' + LIFE + ' s, S-5 pod ' + ARMS.s5.life + ' s, S-8 pod ' + ARMS.s8.life + ' s');
const x0 = 4000, z0 = 300;
function shooter(kind, id, up) {
  const S = C.sandbox('modern'), y = C.hgt(x0, z0) + up;
  const p = kind === 'heli' ? C.addHeli(id, 0, x0, y, z0, 0, false) : C.addPlane(id, 0, x0, y, z0, 0, false);
  p.inv = 1e9; p.think = 1e9;
  const i = p.def.ord.findIndex(o => o && o.k === 'rocket');
  return { S, p, i };
}
const aimAt = (p, t) => { const d = Math.hypot(t.x - p.x, t.y - p.y, t.z - p.z); p.f = { x: (t.x - p.x) / d, y: (t.y - p.y) / d, z: (t.z - p.z) / d }; };
for (const [kind, id] of [['plane', 'su25'], ['plane', 'p47'], ['heli', 'ah64'], ['heli', 'mi28']]) {
  /* free flight, high above the ground: how far it goes before it bursts */
  let { S, p, i } = shooter(kind, id, 2500);
  if (!ok(i >= 0, id + ': carries rockets')) continue;
  aimAt(p, { x: x0 + 1000, y: p.y, z: z0 });
  const n = S.bombs.length; C.$('useOrd')(p, i); const b = S.bombs[n], v = Math.hypot(b.vx, b.vy, b.vz), bx = b.x;
  let t = 0; C.run(12, dt => { t += dt; return !b.gone; });
  const far = Math.abs(b.x - bx);
  ok(b.k === 'rocket' && t > 7.5 && far > 2 * v * 4 * .95, id + ': the rocket flies ' + t.toFixed(1) + ' s and ' + Math.round(far) + ' m before it bursts (was 4 s, ' + Math.round(v * 4) + ' m)');
  /* a truck past the old reach: the rocket aimed with its drop strikes it */
  ({ S, p, i } = shooter(kind, id, 300));
  const R = v * 6, tx = x0 + R, trk = C.addVehicle('truck', null, 1, tx, z0, 0); trk.inv = 0; const hp0 = trk.hp;
  const tt = Math.hypot(R, trk.y - p.y) / v;
  let ay = trk.y + 1 + .125 * GR * tt * tt;   // the AI's lead for the drop (LO.cas); the pilot walks the next one onto the truck from where the last burst
  for (let k = 0; k < 6 && trk.hp >= hp0 && !trk.dead; k++) {
    aimAt(p, { x: tx, y: ay, z: z0 }); p.ocool[i] = 0; const n = S.bombs.length; C.$('useOrd')(p, i); const b = S.bombs[n];
    C.run(12, () => !b.gone); C.run(.5);
    ay += (tx - b.x) * (p.y - ay) / R;
  }
  ok(trk.hp < hp0 || trk.dead, id + ': a truck ' + Math.round(Math.hypot(R, trk.y - p.y)) + ' m away (' + (R / v / 4 * 100).toFixed(0) + '% of the old reach) is struck (' + hp0 + ' -> ' + Math.max(0, trk.hp).toFixed(1) + ')');
}
/* a vehicle's pod (cf-foguete-tecnica): the same, along the ground */
for (const id of ['s5', 's8']) {
  const S = C.sandbox('modern'), w = ARMS[id], tec = C.addVehicle('truck', null, 1, x0, z0, 0); tec.inv = 1e9;
  const m0 = { x: x0 + 3, y: 0, z: z0 }; m0.y = C.hgt(x0, z0) + 1500; const b = $('ARMK').rkt.fire(tec, w, m0, { x: 1, y: 0, z: 0 });
  let t = 0; C.run(12, dt => { t += dt; return !b.gone; });
  ok(t > w.life - .1 && b.x - m0.x > w.spd * 3.6 * 1.8, id + ': the pod rocket flies ' + t.toFixed(1) + ' s and ' + Math.round(b.x - m0.x) + ' m');
}
done();
