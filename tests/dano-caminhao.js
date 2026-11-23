'use strict';
/* cf-dano-caminhao: a soldier's small arms no longer wreck a truck or a car (4 pistol rounds blew a truck up), a .50 still does, and a radio
   vehicle ignores rifle fire. Hits straight into the vehicle with impact, as a soldier's round (ap -1) and as a heavy machine gun's (ap .08) */
const H = require('./harness'), C = H.load({ seed: 7 }), $ = C.$, ok = H.ok, HK = $('HK'), TRNS = $('TRNS');
const shoot = (u, n, dmg, ap) => { for (let i = 0; i < n && !u.dead; i++) C.impact(u, HK.bullet, dmg, null, u.x + (Math.random() - .5) * 4, u.y + 1 + Math.random() * 2, u.z + 3, 0, 0, -1, ap); };
for (const id of ['opel', 'gmc', 'hemtt', 'ural', 'kubel', 'jeep', 'hmmwv', 'tigr', 'sdkfz251', 'm577']) {
  const d = TRNS[id]; C.sandbox(d.era); C.step(1 / 60);
  const mk = () => { const u = C.addVehicle('trn', id, 1, 3000, 0, 0); u.ai = null; return u; };
  const p = mk(); shoot(p, 8, 7, -1);
  const r = mk(); shoot(r, 30, 13, -1);
  ok(!p.dead && !r.dead, d.name + ': 8 pistol rounds and a 30-round rifle burst leave it standing (' + p.hp.toFixed(1) + ' / ' + r.hp.toFixed(1) + ' of ' + d.hp + ' hp)');
  const q = mk(); shoot(q, 60, 6, .08);
  ok(q.dead || q.hp <= 0 || q.end, '  a .50 burst (60 rounds) wrecks it');
  if (d.rad) ok(r.hp === d.hp, '  a radio vehicle takes nothing from the rifle');
}
H.done();
