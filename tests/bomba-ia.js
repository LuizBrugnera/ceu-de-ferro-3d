'use strict';
/* The Insurgents' bombs and the AI that takes them to a target (BOMB, cf-insurgentes-conteudo), on a three-sided front with nothing else in
   the field: the suicide bomber runs at a rifleman 150 m off and goes off by him; the car bomb, on the road where a side's column stands
   (on its rail), with a T-72 600 m ahead and inside its seek, leaves the road, drives at it and goes off by it */
const H = require('./harness'), { ok, done } = H, C = H.load({ seed: 9, mapv: 9 }), $ = C.$;
function bare(seed) {
  C.seed(seed); const S = C.watch('modern', { n: 3 }); S.demo = false;
  for (const q of S.squads.slice()) for (const m of q.men) m.gone = true;
  S.squads.length = 0; S.men.length = 0; S.units.length = 0; S.planes.length = 0; if (S.civs) S.civs.length = 0;
  C.plan = () => {}; C.director = () => {};
  return S;
}

console.log('-- the suicide bomber --');
{ const S = bare(3), x = S.W / 2, z = 0;
  const b = C.addMan('insBomber', 2, x, z, 0); b.ai = $('manBrain')(0); b.ai.gx = x; b.ai.gz = z;
  const e = C.addMan($('INF').modern[S.fac[0]][0], 0, x + 150, z, Math.PI); e.ai = null;
  let dMin = 1e9, tB = null;
  C.run(60, () => { dMin = Math.min(dMin, Math.hypot(e.x - b.x, e.z - b.z)); if (b.bGone) { tB = S.t; return false; } });
  ok(tB !== null && dMin <= $('BOMB').man.trig + 1 && e.dead, 'he ran 150 m at the rifleman and went off ' + Math.round(dMin) + ' m from him at ' + (tB === null ? 'never' : tB.toFixed(0) + ' s') + ' (the rifleman ' + (e.dead ? 'dead' : 'alive') + ')'); }

console.log('-- the car bomb --');
{ const S = bare(4), r = S.T.routes[0], p = $('routeAt')(r, r.len / 2), q = $('routeAt')(r, r.len / 2 + 600);
  const v = C.addUnit('car', 2, p.x, p.z, 'vbied', false, 0, r.len / 2), t = C.addVehicle('tank', 't72', 1, q.x, q.z, 0);
  const d0 = Math.hypot(t.x - v.x, t.z - v.z), rail = v.rail; let dMin = d0, tB = null;
  C.run(120, () => { dMin = Math.min(dMin, Math.hypot(t.x - v.x, t.z - v.z)); if (v.bGone) { tB = S.t; return false; } });
  ok(rail && tB !== null && dMin <= $('BOMB').car.trig + 4 && t.dead, 'from the road, ' + Math.round(d0) + ' m off, it drove at the T-72 and went off ' + Math.round(dMin) + ' m from it at ' + (tB === null ? 'never' : tB.toFixed(0) + ' s') + ' (the tank ' + (t.dead ? 'destroyed' : Math.round(t.hp) + '/' + t.max) + ')'); }
done();
