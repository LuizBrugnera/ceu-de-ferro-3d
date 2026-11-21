'use strict';
/* hull against hull (VCOL, cf-colisao-veiculos): two hulls of the AI's own side that run into each other are pushed apart and held, with no
   blow. Their drivers see only the hulls of their own lane (scan), so with the collision on, the columns leaving a base rammed each other at
   march speed and the AI lost its own trucks, guns and tanks in the first minute (6 in 60 s, ww2, seed 7, map v6). A hull a person drives,
   or an enemy's, still takes the blow, and a tank still crushes a car. Then the first SECS s of that AI x AI match: no AI hull destroyed by
   a blow of its own side. node tests/vcol.js (PAGE=<page>; SECS=0 skips the match) */
const H = require('./harness'), { ok, done } = H;
const C = H.load({ seed: 3 }), $ = C.$, vehCol = $('vehCol');
const flat = era => { const S = C.sandbox(era); $('hgt = (x, z) => ' + C.hgt(S.base[0].x, S.base[0].z)); S.T.grid.f.fill(0); return S; };
/* two hulls 1 m short of touching end to end, a closing at v m/s on b; nothing else moves (vehCol alone) */
const knock = (era, ka, ia, ta, kb, ib, tb, v, ai) => {
  const S = flat(era), x = S.base[0].x - 1500, z = S.base[0].z;
  const a = C.addVehicle(ka, ia, ta, x, z, 0), b = C.addVehicle(kb, ib, tb, x, z, 0);
  for (const u of [a, b]) { u.rail = false; u.inv = 0; u.trip = null; }
  a.ai = ai[0] ? a.ai || {} : null; b.ai = ai[1] ? b.ai || {} : null;   // an AI's brain, or a person's hands
  const ea = a.def.env, eb = b.def.env; b.x = a.x + (ea[3] + eb[3]) - 1; a.v = { x: v, y: 0, z: 0 }; b.v = { x: 0, y: 0, z: 0 };
  const h0 = [a.hp, b.hp], d0 = b.x - a.x; vehCol(1 / 60);
  return { a: 1 - a.hp / h0[0], b: 1 - b.hp / h0[1], dead: [a.dead, b.dead], apart: b.x - a.x > d0 };
};
const pc = v => (100 * v).toFixed(0) + '%';
for (const era of ['ww2', 'modern']) {
  const TK = era === 'ww2' ? 'sherman' : 'abrams', AR = era === 'ww2' ? 'hummel' : 'pzh';
  let r = knock(era, 'truck', null, 0, 'art', AR, 0, 30, [1, 1]);
  ok(r.a === 0 && r.b === 0 && r.apart, era + ': an AI truck into an AI gun of its side at 30 m/s: pushed apart, no blow (' + pc(r.a) + ', ' + pc(r.b) + ')');
  r = knock(era, 'tank', TK, 0, 'truck', null, 0, 25, [1, 1]);
  ok(r.a === 0 && r.b === 0 && !r.dead[1], era + ': an AI tank into an AI truck of its side at 25 m/s: no blow (' + pc(r.a) + ', ' + pc(r.b) + ')');
  r = knock(era, 'truck', null, 0, 'art', AR, 0, 30, [0, 1]);
  ok(r.a > 0 && r.b > 0, era + ': a truck a person drives into a gun of its side at 30 m/s: both take the blow (' + pc(r.a) + ', ' + pc(r.b) + ')');
  r = knock(era, 'truck', null, 0, 'art', AR, 1, 30, [1, 1]);
  ok(r.a > 0 && r.b > 0, era + ': an AI truck into an enemy AI gun at 30 m/s: both take the blow (' + pc(r.a) + ', ' + pc(r.b) + ')');
  r = knock(era, 'tank', TK, 0, 'car', null, 1, 25, [0, 1]);
  ok(r.dead[1] && r.a < .1, era + ': a tank driven at 25 m/s into an enemy car: the car is destroyed, the tank loses ' + pc(r.a));
}
const SECS = process.env.SECS === undefined ? 20 : +process.env.SECS;
if (SECS) {
  const M = H.load({ seed: 7, mapv: 6 }), S = M.watch('ww2', { len: 0 });
  M.$('globalThis.__k = []; globalThis.__h0 = vcolHit; vcolHit = function (u, o, v, k, x, z, c) { const d = u.dead; globalThis.__h0(u, o, v, k, x, z, c); if (!d && u.dead) globalThis.__k.push(u.kind + (o.team === u.team ? " by its own side" : " by an enemy")); }');
  M.run(SECS);
  const k = M.$('globalThis.__k'), own = k.filter(s => / own /.test(s));
  ok(!own.length, 'ww2 AI x AI, seed 7, map v6, first ' + SECS + ' s: no AI hull destroyed by a blow of its own side (' + (own.join(', ') || 'none') + ')');
}
done();
