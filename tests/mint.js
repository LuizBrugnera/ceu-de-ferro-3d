'use strict';
/* Shooting a missile down (MINT, cf-intercepta-missil): a round of 12.7 mm or more aimed at an anti-tank missile flying past strikes it,
   so many hits of each calibre bring it down (8 of a .50, 2 of a 30 mm, 1 of the CIWS) and it bursts in the air; a rifle's round never
   does; on a guest the round only sparks (the host decides). Each round is aimed with the lead at the missile, from 25 m to its side */
const H = require('./harness'), { ok, done } = H, C = H.load({ seed: 3 }), $ = C.$;
const MINT = $('MINT'), calOf = $('calOf');

console.log('-- the calibre of a gun, from its name --');
const cals = { 'M2 .50': 12.7, 'ZU-23-2 (2× 23 mm)': 23, 'AKM 7,62': 7.62, '2 cm Flakvierling 38': 20, 'GAU-8/A': 30, 'M61A2': 20, 'KPV 14,5': 14.5, 'S-5 casulo de foguetes': 0 };
ok(Object.entries(cals).every(([n, c]) => calOf({ name: n }) === c), Object.entries(cals).map(([n, c]) => n + ' ' + calOf({ name: n })).join(', '));

/* a Javelin from 1500 m at a tank; from 1 s on, a round every .12 s at it (40 at most). struck: the hits it took before it fell */
function trial(cal, am, guest) {
  const S = C.sandbox('modern'); S.over = false;
  if (guest) { S.net = true; S.host = false; }
  const tgt = C.addVehicle('tank', 'abrams', 0, 0, 0, 0), by = { x: 1500, y: C.hgt(1500, 0) + 1.5, z: 0, team: 1, v: { x: 0, y: 0, z: 0 } };
  const m = $('MSL').arm({ x: 1499, y: by.y + .3, z: 0, gnd: true, target: tgt, o: $('SARMS').javelin, team: 1, by }, $('vnorm')({ x: -1, y: .35, z: 0 }), by);
  S.missiles.push(m);
  const sh = { x: 800, y: 0, z: 30, team: 0 }; let fired = 0, struck = 0, shotT = 0, hp = undefined;
  C.run(guest ? 2 : 4, () => {
    if (m.hp !== hp) { hp = m.hp; struck++; }
    if (m.gone) return false;
    if (S.t > 1 && S.t - shotT >= .12 && fired < 40) {
      shotT = S.t; fired++;
      const sx = m.x, sy = m.y, sz = m.z + 25, tau = 25 / 900, px = m.x + m.d.x * m.v * tau, py = m.y + m.d.y * m.v * tau, pz = m.z + m.d.z * m.v * tau, L = Math.hypot(px - sx, py - sy, pz - sz);
      S.bullets.push({ x: sx, y: sy, z: sz, vx: (px - sx) / L * 900, vy: (py - sy) / L * 900, vz: (pz - sz) / L * 900, life: 1.3, team: 0, dmg: 10, ap: 0, by: sh, tr: 0, cal, am });
    }
  });
  return { fired, struck, down: !!m.gone && m.hp !== undefined && m.hp <= 0, hp: m.hp };
}

console.log('-- aimed rounds at a Javelin in flight --');
const need = { 12.7: 8, 14.5: 6, 20: 3, 30: 2 };
for (const cal of [12.7, 14.5, 20, 30]) {
  const R = trial(cal);
  ok(R.down && R.fired === need[cal], cal + ' mm: down at round ' + R.fired + ' (want ' + need[cal] + '), each aimed round struck it (' + R.struck + ' struck)');
}
const ciws = trial(30, 1.2);
ok(ciws.down && ciws.fired === 1, 'the CIWS round (am): down with 1');
const rifle = trial(7.62);
ok(!rifle.down && rifle.hp === undefined && rifle.fired >= 20, 'a rifle round never strikes it (' + rifle.fired + ' rounds, missile hp ' + rifle.hp + ')');
const g = trial(30, 0, true);
ok(!g.down && g.hp === undefined && g.fired > 3, 'on a guest the round only sparks: the host decides (' + g.fired + ' rounds, missile hp ' + g.hp + ')');

console.log('-- shot down, it bursts in the air --');
{ const S = C.sandbox('modern'); S.over = false;
  const by = { x: 1500, y: C.hgt(1500, 0) + 1.5, z: 0, team: 1, v: { x: 0, y: 0, z: 0 } }, near = C.addMan($('INF').modern[S.fac[0]][0], 0, 1400, 0, 0);
  const m = $('MSL').arm({ x: 1400, y: C.hgt(1400, 0) + 3, z: 0, gnd: true, target: null, o: $('SARMS').javelin, team: 1, by }, { x: -1, y: 0, z: 0 }, by);
  S.missiles.push(m); near.y = C.hgt(1400, 0); const hp0 = near.hp;
  m.hp = .5; $('mintHit')(m, { cal: 12.7, by: { team: 0 } });
  ok(m.gone && near.hp < hp0, 'its warhead bursts where it is (a man 3 m under it: ' + hp0 + ' → ' + Math.round(near.hp) + ')');
  const at = { gnd: true, by: { team: 1 } }, agm = { gnd: true, by: { q: {}, team: 1 } }, bomb = { gnd: true, bomb: 1, by: { q: {}, team: 1 } }, cw = { cal: 30, am: 1.2 };
  const n = o => Math.ceil($('mintHp')(o) / $('mintDmg')(cw));
  ok(n(at) === 1 && n(agm) === 2 && n(bomb) === 3, 'the CIWS: ' + n(at) + ' round for an anti-tank missile, ' + n(agm) + ' for a plane\'s, ' + n(bomb) + ' for a guided bomb');
}
done();
