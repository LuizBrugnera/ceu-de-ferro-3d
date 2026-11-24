'use strict';
/* Crew, headless and solo: a Transporte player is a soldier at the wheel, gets out, takes another vehicle (wheel, gun, passenger), swaps
   seats alone in an armed car; what a left vehicle keeps and does; the driver killed in the seat; the vehicle lost with the player in it;
   the respawn; the planner's ride reusing a left truck; the cleanup of left vehicles */
const H = require('./harness'), C = H.load({ seed: 31 }), $ = C.$, ok = H.ok, dt = 1 / 60;
let S, I;
const game = (era, cls, model) => { S = C.newState(era, model, { cls, mouse: true }); S.over = false; I = S.input; S.units = S.units.filter(u => u === S.my); S.planes = []; S.men = S.men.filter(m => m === S.rider || m === S.my); S.squads = []; S.over = true; C.step(dt); return S; };
const tap = k => { I[k] = true; C.step(dt); I[k] = false; C.step(dt); };

console.log('a Transporte player is a soldier at the wheel');
{
  game('modern', 'trn', 'hmmwv');
  const u = S.my, m = S.rider;
  ok(u.kind === 'car' && m && m.man && m.in === u && m.seat === 0 && u.occ[0] === m && m.id === 'blueRifle', 'entering as HMMWV: the vehicle is S.my and a rifleman of the side sits at the wheel');
  const x0 = u.x, z0 = u.z; S.aim.h = u.h; I.up = true; C.run(3); I.up = false; I.brake = true; C.run(3); I.brake = false;
  ok(Math.hypot(u.x - x0, u.z - z0) > 15 && Math.hypot(m.x - u.x, m.z - u.z) < 6, 'it drives, the soldier with it');
  u.arms[0].ammo = 123; u.hp = u.max - 9; u.smk = 0; const lost = S.cq.lost[0].join();
  tap('yawR');
  ok(S.my === m && !m.in && !S.rider && !m.dead && Math.hypot(m.x - u.x, m.z - u.z) < 9 && S.aim, 'E, stopped: the player is the soldier on foot beside it');
  ok(!u.dead && $('parked')(u) && u.left && u.arms[0].ammo === 123 && u.hp === u.max - 9 && S.cq.lost[0].join() === lost && !S.respawn, 'the HMMWV stays, parked and empty, with its damage and its 123 rounds; nothing lost');
  C.run(2); ok(!u.ctl.fire[0] && u.sp === 0 && S.near === u && S.nearS === 0, 'nobody in it: the gun is silent, and the soldier beside it is offered the wheel');
  const x1 = m.x; I.up = true; C.run(1.5); I.up = false;
  ok(Math.hypot(m.x - x1, 0) + Math.abs(m.z - u.z) > 1 && S.my === m, 'on foot the soldier walks with the infantry controls');
  m.x = u.x + 3; m.z = u.z + 4; C.run(.3); tap('yawR');
  ok(S.my === u && S.rider === m && m.seat === 0 && !u.left && !u.ai && u.arms[0].ammo === 123, 'E again: back at the wheel, the rounds as they were left');
  tap('yawL');
  ok(S.my === u && m.seat === 1 && u.gp === m && u.arms[0].ammo === 123, 'Q, stopped and alone: from the wheel to the gun');
  S.aim.h = u.h + .6; I.fire = true; C.run(1.5); I.fire = false;
  ok(u.arms[0].ammo < 123 && Math.abs(u.sp) < .5, 'at the gun it aims and fires (' + u.arms[0].ammo + ' rounds left) and the vehicle stays put');
  tap('yawL'); ok(m.seat >= 2 && S.my === m && m.in === u, 'Q: on to a passenger\'s seat (solo)');
  tap('yawL'); tap('yawL'); tap('yawL'); ok(S.my === u && m.seat === 0, 'and round to the wheel again');
  /* another vehicle */
  const t = C.addVehicle('trn', 'hemtt', 0, u.x + 14, u.z + 10, u.h); $('crewPark')(t); t.left = 0;
  tap('yawR'); m.x = t.x + 3; m.z = t.z + 5; m.y = $('manY')(m.x, m.z); C.run(.3);
  ok(S.near === t, 'out of the HMMWV and beside a parked HEMTT: it is offered'); tap('yawR');
  ok(S.my === t && m.in === t && m.seat === 0 && $('parked')(u) && u.left, 'E: the soldier takes the truck, and the HMMWV stays behind');
  /* an enemy soldier is not offered it */
  const e = C.addMan('redRifle', 1, u.x + 3, u.z + 3, 0); ok(!$('canBoard')(e, u), 'an enemy soldier cannot board the HMMWV');
  e.gone = true;
  /* the driver killed in the seat */
  const d0 = S.cq.lost[0].slice(); m.inv = 0; C.killMan(m, null); C.run(.5);
  ok(S.my === m && !t.dead && $('parked')(t) && !t.occ[0] && S.respawn > 0 && S.cq.lost[0][0] === d0[0] + 1 && S.cq.lost[0][1] === d0[1], 'the driver dies in the seat: a soldier lost, and the truck stays, parked');
  S.over = false; C.run(4.5); S.over = true;
  ok(S.my !== m && S.my.kind === 'car' && S.my.def.id === 'hmmwv' && S.rider && S.rider.in === S.my, 'the respawn is the class chosen: an HMMWV with a soldier at the wheel');
}
console.log('the vehicle lost with the player in it');
{
  let out = 0, dead = 0;
  for (let i = 0; i < 30; i++) {
    game('modern', 'trn', 'hemtt'); const u = S.my, m = S.rider, l = S.cq.lost[0].slice(); u.inv = 0; m.inv = 0; u.lastK = $('HK').shell; u.hitT = S.t; C.ruin(u, 1e6, null); C.run(.3);
    if (!u.dead || S.my !== m || m.in) { ok(false, 'trial ' + i + ': the truck is destroyed and the player is its soldier'); break; }
    if (m.dead) { dead++; if (S.cq.lost[0][0] !== l[0] + 1 || S.cq.lost[0][1] !== l[1] + 1) ok(false, 'a dead soldier is a loss with the truck'); } else { out++; if (S.cq.lost[0][0] !== l[0] || S.cq.lost[0][1] !== l[1] + 1 || S.respawn) ok(false, 'a soldier who got out is no loss'); }
  }
  ok(out > 3 && dead > 3, 'a HEMTT destroyed 30 times: the driver gets out hurt ' + out + ' times and dies ' + dead + ' (a life only then)');
}
console.log('infantry takes a vehicle; kit kept');
{
  game('ww2', 'inf', 'mgschutze'); const m = S.my;
  const u = C.addVehicle('trn', 'kubel', 0, m.x + 4, m.z + 4, 0); $('crewPark')(u); C.run(.3); tap('yawR');
  ok(S.my === u && m.seat === 0, 'a machine gunner takes the wheel of a parked Kübelwagen');
  tap('yawR'); ok(S.my === m && u.left > 0, 'and gets out again');
  S.over = false; const r = C.swapTo('trn', 'opel'); C.run(4.5); S.over = true;
  ok(r === '' && S.my.def.id === 'opel' && S.rider && S.rider.id === 'mgschutze', 'switching to an Opel Blitz (H): the soldier at its wheel has the kit last used');
}
console.log('the AI and left vehicles');
{
  game('modern', 'trn', 'hemtt'); const u = S.my, m = S.rider, r = S.T.routes[0], s0 = r.len / 2 + 900, p = C.routeAt(r, s0);
  u.x = p.x - p.dz * 6; u.z = p.z + p.dx * 6; u.y = C.hgt(u.x, u.z); C.run(.2); tap('yawR'); m.x += 40; C.run(.2);
  const q = C.addSquad(0, u.x + 20, u.z + 20, 0, s0 - 30); q.fd = 1e9; C.setOrd(q, { k: 'hold', ri: 0, s: s0 - 30 });
  const n = S.units.length, e = $('errand')(0, 'truck', 0, r.len - 100, [{ s: q.s, k: 'load', q }, { s: s0 - 800, k: 'drop' }, { s: r.len - 100, k: 'bye' }]);
  ok(e === u && S.units.length === n && u.run && !u.left && u.rail && !u.ai.park, 'a ride for a squad near a left HEMTT by the road: the planner takes that one, no new truck');
  const f = $('errand')(0, 'truck', 0, r.len - 100, [{ s: q.s, k: 'load', q }, { s: r.len - 100, k: 'bye' }]);
  ok(f !== u && S.units.length === n + 1, 'the next ride is a new truck');
}
{
  game('modern', 'trn', 'hmmwv'); const u = S.my, m = S.rider, K = $('BODY').keep; tap('yawR');
  C.run(3); ok(!u.gone, 'a left vehicle with its player near stays');
  m.x += K.near + 50; S.t += K.idle - 5; C.run(1); ok(!u.gone, 'far from it, it still stays for a while');
  S.t += 10; C.run(1); ok(u.gone, 'after ' + K.idle + ' s with nobody within ' + K.near + ' m it is taken away');
}
ok(!H.nan(S), 'no NaN');
H.done();
