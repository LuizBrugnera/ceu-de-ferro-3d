'use strict';
/* The camouflage nets (CNET, cf-pol2-camuflagem, P31): the two works (kinds 14 and 15: size, time, cost, cap), where they may lie (over a
   supply base, not on another net, not in water, an older server), that they stop nothing and shelter nobody, what they cover (under it,
   still, within 2 m of where it stopped), the reach into a net of each kind of eyes (aircraft 600 m, a helicopter's optics 1.5 times, a
   vehicle 900 m, a tank's optics 1.5 times, a soldier 400 m, a camera drone 60 % of its camera), the side's map from an aircraft, a supply
   base and an economy site under the large net, a shot that shows the whole net for 20 s, moving off the spot, a burst within 12 m that tears
   it down and one that does not, and a sighting from before that is kept */
const H = require('./harness'), ok = H.ok;
const C = H.load({ seed: 31 }), $ = C.$, CN = $('CNET'), FORT = $('FORT'), hid = $('hid'), step = () => C.run(.6);
let S = C.sandbox('modern'); const T = S.T; for (const f of S.forts.slice()) C.fortDrop(f); S.forts = [];
/* level open ground with nothing within 170 m */
function flat(n) {
  let k = 0;
  for (let z = -S.HW + 600; z < S.HW - 600; z += 97) for (let x = 900; x < S.W - 900; x += 131) {
    const h = C.hgt(x, z); let lv = h > T.WL + 6 && C.routeDist(T, x, z) > 120;
    for (const [a, b] of [[60, 0], [-60, 0], [0, 60], [0, -60], [30, 30], [-30, -30]]) if (Math.abs(C.hgt(x + a, z + b) - h) > Math.hypot(a, b) * .05 + .2) lv = false;
    if (lv && !C.near(x, z, 170).length && k++ === (n || 0)) return { x, z, y: h };
  }
  throw new Error('no flat ground');
}
const net = (k, p, t) => { const f = C.fortStart(k, t || 0, p.x, p.z, 0); if (f) $('fortAt')(f, 1); return f; };
const tank = (t, x, z) => { const u = C.addUnit('tank', t, x, z, S.E.sides[S.fac[t]].tanks[0], true); u.ai = null; return u; };
const eye = (o, x, y, z) => Object.assign(o, { x, y, z });

console.log('-- the two works --');
{
  const a = FORT.K[14], b = FORT.K[15];
  ok(a.size[0] === 10 && a.time === 20 && a.cap === 12 && a.cost.join() === '3,6' && b.size[0] === 24 && b.time === 45 && b.cap === 6 && b.cost.join() === '8,16' && a.cam && b.cam,
    'the small net is 10 m, 20 s, 3 energy and 6 metal, 12 a side; the large one 24 m, 45 s, 8 and 16, 6 a side');
}
console.log('-- where a net may lie, and what it is in the world --');
const p0 = flat(0);
{
  const b = C.addSup(T.nid + 5000, 0, p0.x, p0.z, 0, 1); b.prog = 1;
  const why = C.fortWhy(15, 0, p0.x, p0.z, 0), f = net(15, p0);
  ok(why === '' && f && f.k === 15, 'a large net goes over a supply base');
  ok(C.fortWhy(14, 0, p0.x + 4, p0.z + 3, 0) === 'cnet', 'not on another net');
  let wet = null; for (let x = 200; x < S.W - 200 && !wet; x += 50) for (let z = -S.HW + 200; z < S.HW - 200 && !wet; z += 50) if (C.hgt(x, z) < T.WL - 1) wet = { x, z };
  ok(!wet || C.fortWhy(14, 0, wet.x, wet.z, 0) === 'water', 'not in water');
  S.net = true; $('Net').cam = false; const w1 = C.fortWhy(14, 0, p0.x + 60, p0.z, 0); $('Net').cam = true; const w2 = C.fortWhy(14, 0, p0.x + 60, p0.z, 0); S.net = false;
  ok(w1 === 'cserver' && w2 === '', 'online with a server that does not know the nets: none (cserver); with one that does (welcome cam), as solo');
  const o = f.o, R = $('RAY');
  ok(!C.pushOut(o, p0.x + 2, p0.z, 1.5) && o.K.veh() === 1 && !$('fortSlots')(f).length && o.h < 0, 'it pushes nobody, slows no hull, has no places for soldiers and no height');
  const r = C.ray(p0.x - 30, p0.y + 2, p0.z, p0.x + 30, p0.y + 2, p0.z, 0);
  ok(!r || r !== o, 'a round across it is not stopped by it');
  const m = C.addMan(S.E.inf ? 'blueRifle' : 'blueRifle', 0, p0.x + 3, p0.z + 3, 0); C.run(.5);
  ok(m.fc !== f, 'a soldier under it is not at a work (no cover from fire)');
  m.dead = true;
  step();
  ok(b.cnv === f, 'the supply base under it is covered');
  const pl = C.addPlane(S.E.sides[S.fac[1]].fighter, 1, p0.x + 2000, p0.y + 800, p0.z, 0, false); pl.ai = false;
  ok(hid(pl, b), 'an aircraft 2.2 km away does not see the base');
  eye(pl, p0.x + 400, p0.y + 300, p0.z); ok(!hid(pl, b), 'one 500 m away does');
  S.planes = [];
  for (const q of S.forts.slice()) C.fortDrop(q); S.forts = alive(); b.dead = true; S.sup = [];
}
function alive() { return S.forts.filter(f => !f.gone); }

console.log('-- what it covers, and from how far each sees into it --');
const p1 = flat(1);
const f1 = net(14, p1), u = tank(0, p1.x, p1.z), out = tank(0, p1.x + 40, p1.z);
step();
ok(f1 && u.cnv === f1 && !out.cnv, 'a tank standing under a small net is covered; one 40 m off is not');
{
  const R = (o, d, y) => eye(o, p1.x + d, p1.y + (y || 0), p1.z);
  const pl = C.addPlane(S.E.sides[S.fac[1]].fighter, 1, 0, 0, 0, 0, false); pl.ai = false;
  const hl = { def: { vmax: 80 }, heli: 1, team: 1 }, tk = { kind: 'tank', team: 1 }, tr = { kind: 'truck', team: 1 }, mn = { man: true, team: 1, st: 0 }, dr = { drone: 1, def: { cam: 1700 }, team: 1 };
  const L = [
    [pl, 700, 0, true, 'an aircraft at 700 m'], [pl, 450, 300, false, 'an aircraft at 540 m'],
    [hl, 1000, 0, true, 'a helicopter at 1 km'], [hl, 850, 0, false, 'a helicopter at 850 m (its optics: 900 m)'],
    [tr, 1000, 0, true, 'a truck at 1 km'], [tr, 850, 0, false, 'a truck at 850 m'],
    [tk, 1450, 0, true, 'a tank at 1.45 km'], [tk, 1300, 0, false, 'a tank at 1.3 km (its optics: 1.35 km)'],
    [mn, 450, 0, true, 'a soldier at 450 m'], [mn, 350, 0, false, 'a soldier at 350 m'],
    [dr, 1100, 0, true, 'a recon drone at 1.1 km'], [dr, 950, 0, false, 'a recon drone at 950 m (60 % of 1.7 km)']];
  const bad = L.filter(([o, d, y, want]) => { R(o, d, y); return $('camHid')(o, u) !== want; });
  ok(!bad.length, 'the reach into the net: ' + L.map(l => l[4] + (l[3] ? ' does not see it' : ' sees it')).join(', ') + (bad.length ? '; WRONG: ' + bad.map(l => l[4]).join(', ') : ''));
  R(pl, 2000, 900); ok(hid(pl, u) && !hid(pl, out), 'hid(): the aircraft at 2.2 km sees the tank beside the net but not the one under it');
  S.planes = [];
}
console.log('-- the side\'s map --');
{
  const pl = C.addPlane(S.E.sides[S.fac[1]].fighter, 1, p1.x + 2600, p1.y + 1200, p1.z, Math.PI, false); pl.ai = false; pl.v = { x: 0, y: 0, z: 0 };
  u.seenT = out.seenT = -1e9; $('spot')();
  ok(!$('spotted')(u, 1) && $('spotted')(out, 1), 'an aircraft 2.9 km off puts the tank beside the net on its side\'s map, not the one under it');
  u.seenT = S.t; step(); $('spot')();
  ok($('spotted')(u, 1), 'a sighting from before is kept as long as it was (the net hides from new looks)');
  C.run($('SPOT').keep + 1); $('spot')(); ok(!$('spotted')(u, 1), 'and then it is gone');
  S.planes = [];
}
console.log('-- what breaks it --');
{
  const m = C.addMan('blueRifle', 0, p1.x - 3, p1.z - 2, 0); m.ai = null; step();
  ok(m.cnv === f1, 'a soldier standing under the net is covered too');
  u.shotT = S.t; step();
  const pl = { def: { vmax: 200 }, team: 1, x: p1.x + 1500, y: p1.y + 500, z: p1.z };
  ok(!u.cnv && !m.cnv && $('camRev')(f1) && !hid(pl, u), 'the tank fires: the whole net shows, the soldier under it too, for 20 s');
  C.run(CN.fire - 2); ok(!u.cnv, 'still shown after 18 s');
  C.run(3); ok(u.cnv === f1 && m.cnv === f1, 'covered again after 20 s');
  u.x += 3; S.camT = 0; $('camStep')(); const moved = !u.cnv; step();   // the next look after the move, then a few more
  ok(moved && u.cnv === f1, 'moved 3 m under it: uncovered, then covered again once it stands');
  u.x += 1.5; step(); ok(u.cnv === f1, 'within 2 m of where it stopped it stays covered');
  u.x = p1.x + 8; step(); step(); ok(!u.cnv, 'out from under the net it is not');
  u.x = p1.x; step(); step();
  C.explode(p1.x + 25, p1.y + 1, p1.z, 6, 50, null, 1, true, 0); C.explode(p1.x + 2, p1.y + 120, p1.z, 6, 50, null, 1, true, 0); C.run(.1);
  ok(!f1.gone && u.cnv === f1, 'a burst 20 m off its edge, and one 120 m over it, leave it whole');
  C.explode(p1.x + 15, p1.y + 1, p1.z, 6, 50, null, 1, true, 0); C.run(.1); step();
  ok(f1.gone && !u.cnv && !S.forts.includes(f1), 'a burst 10 m off its edge tears it down, and the tank under it is seen again');
}
console.log('-- the large net over an economy site --');
{
  const p = flat(2), f = net(15, p), e = { x: p.x + 6, y: p.y, z: p.z - 5, team: 0, dead: false };
  const E0 = S.eco; S.eco = { l: [e], d: {} }; S.camT = 0; $('camStep')();   // the look alone: the rest of the economy is off in this test
  const pl = { def: { vmax: 200 }, team: 1, x: p.x + 1500, y: p.y + 600, z: p.z };
  ok(f && e.cnv === f && hid(pl, e), 'a site under the large net is covered, and an aircraft 1.6 km off does not see it');
  S.eco = E0;
}
H.done();
