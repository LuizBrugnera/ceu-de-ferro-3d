'use strict';
/* cf-m0-medicao, "parado primeiro" (cf-pol-testes-b): in the analytics' traffic count (anaMvLook, the tr event), a vehicle that has stood still
   MVA.park s or more counts as parked even when it is on its rail (u.rail) or on a trip (u.trip), and adds nothing to the road traffic.
   One short AI × AI start on map 6, then every AI vehicle of a side made to stand, then made to move */
const H = require('./harness'), ok = H.ok;
const C = H.load({ seed: 2, mapv: 6, ana: true }), $ = C.$;
const S = C.watch('modern', { doc: ['balanced', 'balanced'], min: 2 }); C.run(4, null, 1 / 30);
const MVA = $('MVA'), t = 0;
const veh = S.units.filter(u => u.team === t && !u.dead && !u.gone && u.ai && !u.fixed && !u.net);
ok(veh.length >= 3, veh.length + ' AI vehicles on side ' + t);
const look = () => { MVA.X = $('anaTrNew')(); $('anaMvLook')(); const X = MVA.X; return { v: X.v[t].slice(), road: X.e[t].reduce((a, b) => a + (b || 0), 0) + X.o[t] }; };
const rail = veh.find(u => u.rail && !u.trip) || veh[0];
/* all standing for 10 s; one of them on its rail, one on a trip */
for (const u of veh) u.moveT = S.t - 10;
const trip = veh.find(u => u !== rail);
const keep = { rail: rail.rail, trip: trip.trip };
if (!rail.rail) rail.rail = 1;
if (!trip.trip) trip.trip = { fake: 1 };
const a = look();
ok(a.v[3] === veh.length && a.v[0] + a.v[1] + a.v[2] === 0, 'every vehicle standing 10 s counts as parked, the one on its rail and the one on a trip too (' + a.v.join('/') + ')');
/* the same vehicles moving now: they count by rail, trip or off, and add to the traffic */
for (const u of veh) u.moveT = S.t;
const b = look();
ok(b.v[3] === 0 && b.v[0] + b.v[1] + b.v[2] === veh.length && b.v[0] >= 1 && b.v[1] >= 1, 'moving, they count as rail ' + b.v[0] + ', trip ' + b.v[1] + ', off ' + b.v[2]);
ok(b.road - a.road === veh.length, 'only the moving ones add to the traffic (' + a.road + ' standing, ' + b.road + ' moving: ' + (b.road - a.road) + ' more for ' + veh.length + ' vehicles)');
/* just under MVA.park s still moves */
for (const u of veh) u.moveT = S.t - (MVA.park - .5);
const c = look();
ok(c.v[3] === 0, 'standing ' + (MVA.park - .5) + ' s is not parked yet (' + c.v.join('/') + ')');
rail.rail = keep.rail; trip.trip = keep.trip;
H.done();
