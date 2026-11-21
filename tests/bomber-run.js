'use strict';
/* the strategic bomber's run (STK, cf-bombardeiro): a B-2 ordered on a point 2.5 km short of the enemy base, whose anti-air radar it meets on
   the way in. Its run is straight and high (stkFly): the aircraft drills (DRILL.air: the radar one dived and turned it) do not steer it while
   it lines up and runs in, so it releases on the first pass and its stick of 8 lands across the target, not 170 m beside it or not at all
   ("arremete e volta (fora da linha)"). Its flares still go. About a minute */
const H = require('./harness'), { ok, done } = H;
const C = H.load({ seed: 3, eco: 1, mapv: 5 }), $ = C.$, S = C.watch('modern', { len: 0 }), side = 0;
S.eco.d[side].res.strat = ['hq'];
const foe = S.base[1], x = foe.x - 2500, z = foe.z;
const r = C.genCmd(side, { c: 'bomb', k: 'strat', x, z }, 'sys');
const p = S.planes.find(q => q.role === 'strat' && q.team === side);
ok(r && r.ok && !!p, 'the B-2 is ordered on the point and takes off (' + (p && p.def.name) + ')');
const said = [], say0 = $('stkSay'); C.stkSay = function (pl, m) { if (pl === p) said.push(m); return say0.apply(this, arguments); };
let steered = 0, st = '', c0 = (S.craters || []).length;
let relT = 0;
for (let i = 0; i < 20 * 100 && !(relT && S.t > relT + 40); i++) {   // until the last bomb has fallen (some 25 s from 4 km)
  C.step(1 / 20);
  if (p.bs && p.bs.st !== st) { st = p.bs.st; if (st === 'out') relT = S.t; }
  if ((st === 'in' || st === 'run') && p.dr && Math.abs(p.ctl.roll) === 1) steered++;   // a drill on and the stick hard over (steer turning it toward the drill's way)
}
const cr = (S.craters || []).slice(c0), near = cr.reduce((m, c) => Math.min(m, Math.hypot(c.x - x, c.z - z)), 1e9);
ok(!said.some(s => /arremete|desiste/.test(s)), 'no going round on the way in: ' + (said.join(' / ') || 'nothing said'));
ok(cr.length === 8, 'the stick of 8 is laid (' + cr.length + ' craters)');
ok(near < 135, 'the stick lands across the target: the nearest crater ' + Math.round(near) + ' m from it (the bomb\'s radius 135 m)');
ok(!steered, 'no drill rolled it off its line on the run');
done();
