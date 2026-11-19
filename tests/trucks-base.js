'use strict';
/* The trucks standing at the base (cf-caminhoes-parados): the parked pool vehicles where a side's soldiers enter (POOL) piled up there. A pool
   truck taken for a manoeuvre ride (MAN.ride) left its place, the planner put another there, and the first one came back to the same spot (two
   trucks one inside the other); when the front moved to another road a new pair was parked there and the old one stayed for the match. Here:
   one pool truck away on a trip is no reason for another, it comes back alone; a pair on the road that was the front goes back to the reserve;
   a pool truck left off its place goes back to the reserve; and a ride's vehicle waits for its squad MAN.ride.wait s past when it was due, no
   more. ww2, seed 5, economy and logistics on, map v6. PAGE=<page> */
const H = require('./harness'), ok = H.ok;
const C = H.load({ seed: 5, eco: 1, lg: 1, mapv: 6 }), $ = C.$;
const S = C.watch('ww2', { len: 0 });
C.plan = () => {}; C.director = () => {};
const trnPlan = $('trnPlan'), parked = $('parked'), endS = $('endS'), SPAWN = $('SPAWN'), POOL = $('POOL'), E = S.eco;
E.open = false;
const t = 0, ds = -1, F = S.fld[t];
const pool = k => S.units.filter(u => !u.dead && !u.gone && u.team === t && u.kind === k && parked(u) && !u.left);
const res = k => (E.d[t].res[k] || []).length;
const tick = () => { F.pool = [0, 0]; trnPlan(t, []); };   // the planner's turn with the pool's clock run out
for (const k of ['truck', 'car']) for (let i = 0; i < 4; i++) E.d[t].res[k] = (E.d[t].res[k] || []).concat(['hq']);
S.units = S.units.filter(u => !(u.team === t && (u.kind === 'truck' || u.kind === 'car') && parked(u)));
S.cq.fr = 0;

console.log('-- the pool on the front road --');
tick();
ok(pool('truck').length === 1 && pool('car').length === 1, 'one parked truck and one car where the soldiers enter (' + pool('truck').length + ', ' + pool('car').length + ')');
const tr = pool('truck')[0], s0 = endS(t, 0, SPAWN.inf);
ok(tr.ri === 0 && Math.abs(tr.s - s0) < (POOL.near || 120), 'on road 1, by where the soldiers enter');
tick(); ok(pool('truck').length === 1, 'the next turn adds none');

console.log('-- a pool truck away on a trip, and back --');
const x0 = tr.x, z0 = tr.z, r0 = res('truck');
const go = $('tripTo')(tr, x0 + 600, z0, { why: 'test' });
ok(!!go && !!tr.trip, 'it takes a trip 600 m away (as a ride takes it)');
for (let i = 0; i < 6; i++) { C.run(1); tick(); }
ok(pool('truck').length === 1, 'while it is away the planner parks no other truck there (' + pool('truck').length + ' parked trucks)');
tr.trip = null; tr.ri = 0; tr.s = s0 - ds * 0; $('place')(tr);
tick();
ok(pool('truck').length === 1 && !tr.dead, 'back at its place it is the one there, alone');
/* the bug: two at the place (one came back after another was put there) */
const extra = C.$('addUnit')('truck', t, 0, 0, null, false, 0, s0, -ds * POOL.lane, 0); extra.fld = 1; extra.ai.park = 1; extra.pool = 1;
tick();
ok(pool('truck').length === 1, 'a second pool truck at the place is taken away (' + pool('truck').length + ' left)');
ok(res('truck') === r0 + 1, 'and goes back to the reserve (' + r0 + ' -> ' + res('truck') + ')');

console.log('-- the front moves to another road --');
const was = pool('truck').concat(pool('car')), r1 = res('truck'), c1 = res('car');
S.cq.fr = 1; S.tw = null;
tick();
ok(was.every(u => u.dead && u.gone), 'the pair on the road that was the front is gone');
const now = pool('truck').concat(pool('car'));
ok(now.length === 2 && now.every(u => u.ri === 1), 'one truck and one car parked on the new front road (' + now.map(u => u.kind + '@' + u.ri).join(' ') + ')');
ok(res('truck') === r1 && res('car') === c1, 'the old pair went back to the reserve and the new one came from it (truck ' + r1 + ' -> ' + res('truck') + ', car ' + c1 + ' -> ' + res('car') + ')');

console.log('-- a pool truck left off its place --');
const lost = pool('truck')[0]; lost.ri = 1; lost.s = lost.s + ds * 3000; $('place')(lost);
tick();
ok(lost.dead && lost.gone && pool('truck').length === 1 && pool('truck')[0] !== lost, 'one left 3 km off its place goes back to the reserve and another stands at the place');
const near = pool('truck')[0]; near.s += ds * 2500; $('place')(near);
S.my = { x: near.x + 20, z: near.z, dead: false };
tick();
ok(!near.dead, 'but not with a person of ours within ' + $('BODY').keep.near + ' m (they may take it)');
S.my = null;

console.log('-- a ride waits for its squad, not for ever --');
{
  const K = $('MAN').ride, u = pool('truck').find(u => !u.dead) || pool('truck')[0];
  const q = S.squads.find(q => q.team === t && q.live > 0);
  if (!q) ok(false, 'a squad of side 0 to ride');
  else {
    const far = q.men.find(m => !m.dead); far.x = u.x + 2000; far.z = u.z;   // the squad is far from the meeting place
    const op = { over: false, id: 999 }, O = q.ord || {}; q.op = op; O.wp = O.wp || { len: 1 }; q.ord = O; q.state = 0;
    $('tripTo')(u, u.x + 300, u.z, { why: 'ride' });
    q.rd = { u, st: 'call', wp: O.wp, sP: 0, D: { x: u.x, z: u.z }, sD: 0, T: S.t + 9999, home: { x: u.x, z: u.z }, eta: S.t };
    Object.assign(u.trip, { rq: q, ev: [{ s: 0, k: 'pick' }] });
    $('tripMove')(u, 0);
    ok(q.rd && u.trip && u.trip.ev.length === 1, 'at the meeting place with the squad 2 km off, the truck waits');
    S.t += K.wait + 1;
    $('tripMove')(u, 0);
    ok(!q.rd && !(u.trip && u.trip.rq === q), MAN_WAIT('the truck gave up after MAN.ride.wait s past when the squad was due, and goes home'));
  }
}
function MAN_WAIT(s) { return s + ' (wait ' + $('MAN').ride.wait + ' s)'; }
ok(H.nan(S) === null, 'no NaN');
H.done();
