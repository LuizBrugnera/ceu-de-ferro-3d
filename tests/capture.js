'use strict';
/* Capture, headless and solo: a soldier beside an empty enemy vehicle holds E and takes it; what is not offered; the loss counted once; an AI crew
   killed leaves the hull; an AI soldier beside an empty enemy vehicle takes it for its side */
const H = require('./harness'), C = H.load({ seed: 31 }), $ = C.$, ok = H.ok, dt = 1 / 60;
let S, I;
const game = (era, cls, model) => { S = C.newState(era, model, { cls, mouse: true }); S.over = false; I = S.input; S.units = S.units.filter(u => u === S.my); S.planes = []; S.men = S.men.filter(m => m === S.rider || m === S.my); S.squads = []; S.over = true; C.step(dt); return S; };
const beside = (m, u) => { m.x = u.x + 3; m.z = u.z + 4; m.y = $('manY')(m.x, m.z); };
const CAP = $('CAP'), CQ = $('CQ');

console.log('a soldier takes an empty enemy vehicle');
{
  game('modern', 'inf', 'blueRifle');
  const m = S.my, t = C.addVehicle('trn', 'tigr', 1, m.x + 20, m.z + 10, 0); $('crewPark')(t);
  ok(t.team === 1 && !$('captured')(t), 'a parked Tigr of side 1, not captured');
  beside(m, t); C.run(.3);
  ok(S.capU === t && !S.near, 'beside it the soldier is offered the capture, not a seat');
  const ls = S.cq.lost.map(l => l[1]);
  I.yawR = true; C.run(CAP.hold * .6); ok(S.my === m && t.team === 1 && S.capK > .4 && S.capK < .8, 'E held for part of the time: nothing yet, the bar at ' + S.capK.toFixed(2));
  I.yawR = false; C.run(.2); ok(S.capK === 0, 'E let go: the count starts over');
  I.yawR = true; C.run(CAP.hold + .2); I.yawR = false;
  ok(S.my === t && S.rider === m && m.seat === 0 && t.team === 0 && $('captured')(t), 'E held for ' + CAP.hold + ' s: the soldier is at its wheel and it is side 0\'s');
  ok(S.cq.lost[1][1] === ls[1] + 1 && S.cq.lost[0][1] === ls[0], 'its old side counts the loss once, the new one nothing (' + JSON.stringify(S.cq.lost) + ')');
  const x0 = t.x, z0 = t.z; S.aim.h = t.h; I.up = true; C.run(3); I.up = false; I.brake = true; C.run(2); I.brake = false;
  ok(Math.hypot(t.x - x0, t.z - z0) > 10, 'it drives');
  I.yawR = true; C.step(dt); I.yawR = false; C.run(.5);
  ok(S.my === m && $('parked')(t) && t.left && t.team === 0, 'E: out of it, and it stays parked as side 0\'s');
  beside(m, t); C.run(.3); ok(S.near === t && !S.capU, 'beside it again it is offered as any friendly vehicle');
  const ls2 = S.cq.lost.map(l => l[1]); C.damageUnit(t, 9999, null); C.run(.2);
  ok(t.dead && S.cq.lost[0][1] === ls2[0] + 1 && S.cq.lost[1][1] === ls2[1], 'destroyed later it is side 0\'s loss, and side 1 does not count it again');
}
console.log('what is not offered');
{
  game('modern', 'inf', 'blueRifle');
  const m = S.my, a = C.addUnit('car', 1, m.x + 30, m.z, null, false, 0, 3000);
  a.x = m.x + 3; a.z = m.z + 4; a.rail = false; a.sp = 0; C.step(dt);
  ok(!$('capOk')(a, 0), 'a car with its AI crew in it is not taken');
  const k = C.addUnit('tank', 1, 0, 0, Object.keys($('TANKS')).find(id => $('TANKS')[id].era === 'modern'), false, 0, 3200); ok(!$('capOk')(k, 0), 'a tank is not (no seats)');
  const f = C.addVehicle('trn', 'hmmwv', 0, m.x + 40, m.z, 0); $('crewPark')(f); ok(!$('capOk')(f, 0), 'a friendly one is not');
}
console.log('an AI crew killed leaves the hull');
{
  game('modern', 'inf', 'blueRifle');
  const m = S.my, a = C.addUnit('car', 1, 0, 0, null, false, 0, 3000), D = a.def.parts, ls = S.cq.lost[1][1];
  for (const i of D.pos) $('gone')(a, i, m);
  ok(!a.end && a.nocrew === 1, 'the last of its crew hit: it is not destroyed');
  C.run(.6);
  ok(!a.dead && $('parked')(a) && a.left && D.pos.every(i => a.parts[i].hp > 0) && S.cq.lost[1][1] === ls + 1, 'it stands parked and empty, and its side counted it lost');
  ok($('capOk')(a, 0), 'and it can be taken');
  beside(m, a); C.run(.3); I.yawR = true; C.run(CAP.hold + .2); I.yawR = false;
  ok(S.my === a && a.team === 0 && S.cq.lost[1][1] === ls + 1, 'taken: side 1 does not count it a second time');
}
console.log('an AI soldier takes one');
{
  game('modern', 'inf', 'blueRifle');
  const m = S.my, t = C.addVehicle('trn', 'tigr', 1, m.x + 300, m.z + 10, 0); $('crewPark')(t);
  const q = C.addSquad(0, t.x + 5, t.z + 5, 0, 0); for (const o of q.men) { o.x = t.x + 4; o.z = t.z + 4; }
  S.over = true; let T = 0; for (let i = 0; i < 12 * 60 && t.team === 1; i++) { for (const o of q.men) { o.x = t.x + 4; o.z = t.z + 4; } C.step(dt); T += dt; }
  ok(t.team === 0 && $('parked')(t) && T > CAP.ai - 1, 'a squad of side 0 beside it for ' + T.toFixed(1) + ' s: it is side 0\'s, still parked');
}
ok(!H.nan(S), 'nothing NaN');
H.done();
