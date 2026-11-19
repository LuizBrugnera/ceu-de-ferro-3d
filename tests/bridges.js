'use strict';
/* destructible bridges and pontoons (W20): each crossing of the river is a bridge, what brings one down (charges, artillery, a bomb, not small
   arms), what its fall does (the river shut there for wheels, tracks and feet, what stood on it lost, the ways and the columns round it, the
   vehicles held at the bank and sent by another bridge), the pontoon (engineers, 2 to 4 min, the crossing open again until it too is
   destroyed), the general's two manoeuvres (demolition on the way back, crossing) as commands and as the AI's choice, and the question brg */
const H = require('./harness'), { ok, done } = H;
const g = H.load({ mapv: 5, seed: 7 }), $ = g.$, dt = 1 / 60;
const BR = $('BR'), FORT = $('FORT'), BLD = $('BLD');
/* can anything on the ground get from the west bank to the east one: a flood of 4 m cells over the river's corridor, the whole map long */
function across(S) {
  const T = S.T, st = 4, W = 200, rows = Math.ceil((2 * T.HW - 100) / st), cols = 2 * W + 1, dry = new Uint8Array(rows * cols), seen = new Uint8Array(rows * cols), q = [];
  for (let r = 0; r < rows; r++) { const z = -T.HW + 50 + r * st, x0 = T.rx(z); for (let c = 0; c < cols; c++) dry[r * cols + c] = $('hgt')(x0 + (c - W) * st, z) > T.WL + .3 ? 1 : 0; }
  for (let r = 0; r < rows; r++) if (dry[r * cols]) { seen[r * cols] = 1; q.push(r * cols); }
  while (q.length) {
    const k = q.pop(), r = k / cols | 0, c = k % cols; if (c === cols - 1) return -T.HW + 50 + r * st;
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const rr = r + a, cc = c + b; if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) continue; const n = rr * cols + cc; if (dry[n] && !seen[n]) { seen[n] = 1; q.push(n); } }
  }
  return null;
}
const trip = (S, mode) => $('tripOf')(S.base[0].x, S.base[0].z, S.base[1].x, S.base[1].z, { mode: mode || 'veh' });
const uses = (tp, b) => !!tp && tp.some((p, i) => i && $('segDist')(tp[i - 1].x, tp[i - 1].z, p.x, p.z, b.x, b.z) < 15);
const down = (b, by) => $('hitObj')(b.o, 1e5, by || null);

console.log('-- the bridges --');
for (const era of ['ww2', 'modern']) {
  const S = g.sandbox(era), L = $('brs()'), T = S.T;
  ok(L.length === 6 && L.every((b, i) => b.id === BR.id + i && T.byId[b.id] === b.o && S.oh[b.id] === BR.hp[b.c] && S.os[b.id] === 0 && b.id < T.nid), era + ': six crossings of the river, each a bridge object under ids ' + BR.id + '-' + (BR.id + 5) + ', hp by its road (' + L.map(b => S.oh[b.id]).join(', ') + ')');
  ok(L.filter(b => b.c === 0).length === 2 && L.every(b => b.ends.length === 2 && b.ends.every(e => (e.x < T.rx(e.z)) !== (b.ends[0] === e ? b.ends[1].x < T.rx(b.ends[1].z) : b.ends[0].x < T.rx(b.ends[0].z)))), 'two on the main roads, the rest on the secondary roads and tracks; each has an end on either bank');
  ok([0, 1, 2].every(ri => L.some(b => b.rs.some(r => r[0] === ri))), 'every axis (both main roads and the centre one) crosses the river on one of them');
  ok(!T.objs.includes(L[0].o) && !$('near')(L[0].x, L[0].z, 30).includes(L[0].o), 'a bridge is on no grid: nothing bumps into it and it hides nothing');
  ok(across(S) !== null && trip(S) && L.every(b => $('hgt')(b.x, b.z) > T.WL + 1), 'standing, the river is crossed where the roads cross it, by the network too');
}
{ const g1 = H.load({ mapv: 1 }); g1.sandbox('ww2'); ok(g1.$('brs()').length === 0 && !g1.$('S').gap, 'the first map (no road network) has none: the battle on it is as before'); }

console.log('-- what brings one down --');
{
  const S = g.sandbox('ww2'), L = $('brs()'), b = L[0], e = b.ends[0];
  for (let i = 0; i < 200; i++) $('hitObj')(b.o, $('OBJD').sa * 30 * $('OBJ').bridge.take[0], null);
  ok(S.oh[b.id] === BR.hp[0] && $('OBJ').bridge.take[0] === 0, 'small arms do nothing to it');
  const m = $('addMan')('schutze', 0, e.x + 3, e.z); m.chg = 9;
  const n0 = S.chg.length; ok($('brPlant')(m, b) && S.chg.length === n0 + 1 && m.chg === 8, 'a soldier at a bank end sets a demolition charge on it');
  const far = $('addMan')('schutze', 0, b.x + 300, b.z); far.chg = 1; ok(!$('brPlant')(far, b) && far.chg === 1, 'not from ' + Math.round($('hdist')(far, e)) + ' m away');
  g.run(BLD.charge.fuse + .2);
  ok(Math.abs(S.oh[b.id] - (BR.hp[0] - BR.dmg)) < .01, 'the charge goes off after ' + BLD.charge.fuse + ' s: ' + BR.dmg + ' of its ' + BR.hp[0]);
  for (let k = 0; k < 3; k++) $('brPlant')(m, b);
  g.run(BLD.charge.fuse + .2);
  ok(S.os[b.id] === 2, 'four charges in all bring a main-road bridge down (three a secondary one, two a track\'s)');
  const c = L[2]; let shells = 0;
  while (S.os[c.id] < 2 && shells < 200) { const a = shells * 2.4, r = 6 + (shells % 7) * 4; $('explode')(c.x + Math.cos(a) * r, c.y + .5, c.z + Math.sin(a) * r, 36, 130, null, 1, 1, $('OBJD').he.blast); shells++; }
  ok(shells > 3 && shells < 30, 'a 15 cm howitzer\'s rounds landing on and around a secondary-road bridge bring it down in ' + shells);
  const d = L[1]; $('explode')(d.x + 8, d.y + 1, d.z, 70, 300, null, 1, 1, $('OBJD').bomb.blast); const h1 = S.os[d.id]; $('explode')(d.x - 5, d.y + 1, d.z + 3, 70, 300, null, 1, 1, $('OBJD').bomb.blast);
  ok(h1 === 1 && S.os[d.id] === 2, 'two 500 kg bombs on a main-road bridge: hurt by the first, down at the second');
}

console.log('-- what a fall does --');
{
  const S = g.sandbox('ww2'), L = $('brs()'), T = S.T, b = L[0], E = T.net.e[b.e], tp0 = trip(S);
  const q = $('routeAt')(T.routes[b.rs[0][0]], b.rs[0][1]);
  const tank = $('addUnit')('tank', 1, 0, 0, S.E.sides[S.fac[1]].tanks[0], false, b.rs[0][0], b.rs[0][1], 0); $('place')(tank);
  const man = $('addMan')('schutze', 0, q.x + b.dz * 3, q.z - b.dx * 3);
  const pre = S.units.length;
  down(b); g.step(dt);
  ok(S.os[b.id] === 2 && S.gap && S.brk === '0x' && S.brc === 1, 'down: its stretch of river is open (S.gap), its edge cut (S.brk 0x)');
  ok(tank.dead && man.dead, 'the tank and the soldier standing on it go into the river');
  ok($('hgt')(b.x, b.z) <= T.WL + .3 && S.brn.size > 0, 'where the road ran there is water now (' + S.brn.size + ' nodes of the grid sunk)');
  const tp1 = trip(S);
  ok(tp1 && !uses(tp1, b) && uses(tp0, b) && tp1.len > tp0.len, 'base to base the way goes round, by another bridge: ' + Math.round(tp0.len) + ' m -> ' + Math.round(tp1.len) + ' m');
  ok($('netPath')(E.a, E.b) === null || !$('netPath')(E.a, E.b).e.includes(E.i), 'the cut edge is no way for netPath either');
  for (const c of L) down(c); g.step(dt);
  ok(across(S) === null, 'with every bridge down nothing on the ground gets across the river (a flood over the whole corridor)');
  ok(trip(S) === null && trip(S, 'foot') === null, 'and the network has no way from one base to the other');
}

console.log('-- held at the bank, and the way round --');
{
  const S = g.sandbox('modern'), L = $('brs()'), T = S.T, b = L.find(b => b.rs.some(r => r[0] === 0)), ri = 0, sb = b.rs[0][1];
  down(b); g.step(dt);
  const u = $('addUnit')('truck', 0, 0, 0, null, false, ri, sb + 700, 0); $('place')(u);
  ok(u.ds === -1, 'a side-0 truck rides axis 0 toward the river from 700 m');
  let held = null; g.run(60, () => { u.ctl.drive = 1; if (u.brT > S.t - .1 && !held) held = { d: Math.abs(u.s - sb), wet: $('hgt')(u.x, u.z) <= T.WL + .3 }; return !held; });
  ok(held && !u.dead && held.d < b.gw + 60 && !held.wet, 'it stops at the bank (' + Math.round(held ? held.d : -1) + ' m from the middle of the river), not in it'); g.step(dt);
  g.run(BR.step * 2 + .5, () => { u.ctl.drive = 1; });
  ok(!!u.trip && !uses(u.trip.p, b) && L.some(c => c !== b && uses(u.trip.p, c)), 'brStep sends it round by another bridge (a trip of ' + Math.round(u.trip ? u.trip.p.len : 0) + ' m)');
  const v = $('addUnit')('truck', 0, 0, 0, null, false, ri, sb + 600, 0); $('place')(v);
  for (const c of L) down(c); g.step(dt);
  let vh = 0; g.run(40 + BR.step * 2, () => { v.ctl.drive = 1; if (v.brT > S.t - .1) vh++; });
  ok(vh > 0 && !v.trip && !v.dead, 'with no bridge left it holds at the bank and waits');
}

console.log('-- the pontoon --');
{
  const S = g.sandbox('ww2'), L = $('brs()'), T = S.T, b = L[1], e = b.ends[0];
  ok($('fortWhy')(7, 0, e.x, e.z, 0) === 'whole', 'no pontoon at a bridge that stands (whole)');
  ok($('fortWhy')(7, 0, e.x + 400, e.z + 400, 0) === 'nobr', 'nor away from a bridge (nobr)');
  down(b); g.step(dt);
  ok($('fortWhy')(7, 0, e.x + 5, e.z, 0) === '', 'at the bank end of a fallen one: allowed');
  const f = $('fortStart')(7, 0, e.x + 5, e.z, 0);
  ok(f && f.b === b.i && $('hdist')(f, e) < 1 && Math.abs(f.o.hw - b.len / 2) < 1 && f.F === FORT.pont, 'it starts at the bank end, its object spans the river along the road (' + Math.round(b.len) + ' m)');
  ok($('fortWhy')(7, 1, b.ends[1].x, b.ends[1].z, 0) === 'pont', 'one pontoon a bridge');
  const sap = $('addMan')('pionier', 0, e.x - 2, e.z + 3), rif = $('addMan')('schutze', 0, e.x - 3, e.z - 3), p0 = f.prog, t0 = S.t;
  const keep = () => { for (const m of [sap, rif]) { m.v.x = m.v.z = 0; m.hitT = -99; } };
  rif.dead = true; g.run(10, keep);
  const T1 = (S.t - t0) / (f.prog - p0);
  ok(Math.abs(T1 - FORT.pont.time) < 3, 'one sapper alone lays it in ' + Math.round(T1) + ' s (4 min)');
  rif.dead = false; rif.hp = rif.max; const p1 = f.prog, t1 = S.t; g.run(10, keep);
  const T2 = 1 / ((f.prog - p1) / (S.t - t1));
  ok(Math.abs(T2 - FORT.pont.time / (1 + BLD.help * FORT.pont.eng)) < 4, 'a sapper and a rifleman (half a builder) in ' + Math.round(T2) + ' s');
  for (let i = 0; i < 4; i++) $('addMan')('pionier', 0, e.x + i, e.z + 2);
  const p2 = f.prog, t2 = S.t; g.run(10, () => { keep(); for (const m of S.men) { m.v.x = m.v.z = 0; m.hitT = -99; } });
  const T3 = 1 / ((f.prog - p2) / (S.t - t2));
  ok(Math.abs(T3 - FORT.pont.time / (1 + BLD.help * (FORT.pont.max - 1))) < 4, 'six builders count as ' + FORT.pont.max + ': ' + Math.round(T3) + ' s, never under 2 min');
  ok(!$('brOpen')(b) && across(S) !== null, 'still shut while it is laid (the other bridges stand)');
  for (const c of L) if (c !== b) down(c); g.step(dt);
  ok(across(S) === null, 'every other bridge down too: no crossing while it is laid');
  g.run(200, () => { for (const m of S.men) { m.v.x = m.v.z = 0; m.hitT = -99; } return f.prog < 1; });
  g.step(dt);
  ok(f.prog >= 1 && $('brOpen')(b) && S.brk.includes('1p'), 'finished: the crossing carries again (S.brk ' + S.brk + ')');
  ok(across(S) !== null, 'the ground crosses the river again, over the pontoon (every other bridge is down)');
  const tp = trip(S); ok(tp && uses(tp, b), 'and the network: base to base over the pontoon (' + Math.round(tp.len) + ' m)');
  ok($('hgt')(b.x, b.z) > T.WL + 1 && $('hgt')(b.x + b.dz * 30, b.z - b.dx * 30) <= T.WL + .3, 'the deck is the road\'s height, the river beside it water');
  const m = $('addMan')('schutze', 1, b.x, b.z); $('hitObj')(f.o, 1e4, null); g.step(dt); g.step(dt);
  ok(f.dead && !$('brOpen')(b) && m.dead && across(S) === null, 'destroyed in its turn, it shuts the river again and what stood on it is lost');
}

console.log('-- the general: demolition on the way back and crossing --');
for (const era of ['modern', 'ww2']) {
  const g2 = H.load({ mapv: 5, seed: 11 }), $2 = g2.$, S = g2.watch(era, {}), L = $2('brs()');
  $2('MAN').max = { cautious: 9, balanced: 9, aggressive: 9 };   // the AI's own manoeuvres leave the general room for these
  g2.run(90);
  ok(L.every(b => S.os[b.id] === 0) && !S.cmd.some(C => C.ops.some(o => o.k === 'dem')), era + ': the race for the crossing at the start of a match is no retreat: no bridge goes down in the first 90 s');
  if (era === 'modern') { ok(H.nan(S) === null, 'no NaN'); continue; }   // the whole of both manoeuvres once (1944): an AI battle of a quarter of an hour
  const t = 0, C = $2('cmdOf')(t); C.mcd = {};
  const sq = $2('manFree')(S.squads.filter(q => q.team === t && !q.net && q.live > 0 && !q.state));
  const b = L.find(b => b.c === 1 && b.ends.some(e => $2('brHome')(t, e))), e = b.ends.find(e => $2('brHome')(t, e));
  const ux = (e.x - b.x) / $2('hdist')(e, b), uz = (e.z - b.z) / $2('hdist')(e, b);
  const q0 = sq[0], put = (q, d) => q.men.forEach((m, i) => { if (!m.dead) { m.x = e.x + ux * d + uz * (i - 2) * 2; m.z = e.z + uz * d - ux * (i - 2) * 2; m.y = $2('manY')(m.x, m.z); } });
  put(q0, 150);   // a free squad brought 150 m short of the bridge's end on this bank: the walk is not what is tested here
  const seen = new Set(), watch = () => { for (const e of S.glog.l[t]) seen.add(e.s); };
  const r = $2('genCmd')(t, { c: 'man', k: 'demolish', x: b.x, z: b.z }, 'sys');
  const op = C.ops.find(o => o.k === 'dem' && !o.over);
  ok(r.ok && op && op.b === b.i && op.sq.length === 1, era + ': demolish (the general\'s command): a squad goes to the ' + $2('brName')(b).toLowerCase() + ' (' + (r.why || 'ok') + ')');
  let tf = null; const ts = S.t; g2.run(240, () => { watch(); if (S.os[b.id] === 2 && tf === null) tf = S.t; return tf === null; }); g2.run(8, watch);
  ok(tf !== null && op.over, 'its men set their charges and it falls ' + Math.round(tf - ts) + ' s later; the manoeuvre ends');
  const lg = [...seen];
  ok(lg.some(s => /Demolição: esquadra a caminho/.test(s)) && lg.some(s => /carga\(s\) armada/.test(s)) && lg.some(s => /destruída/.test(s)), 'the log tells it: on its way, charges set, the bridge down');
  const q = $2('genQuery')(t, { q: 'brg' });
  ok(q.ok && q.br.length === 6 && q.br[b.i].st === 'down' && q.br[b.i].open === 0 && q.br.filter(x => x.st === 'ok').length === 5, 'the question brg: six bridges, that one down and shut');
  const r2 = $2('genCmd')(t, { c: 'man', k: 'demolish', x: b.x, z: b.z }, 'sys');
  ok(!r2.ok && r2.why === 'down', 'demolish again: refused (down)');
  const c2 = $2('genCmd')(1 - t, { c: 'man', k: 'cross', x: L[0].x, z: L[0].z }, 'sys');
  ok(!c2.ok && c2.why === 'whole', 'cross at a bridge that stands: refused (whole)');
  C.mcd = {};
  const c3 = $2('genCmd')(t, { c: 'man', k: 'cross', x: b.x, z: b.z }, 'sys'), op2 = C.ops.find(o => o.k === 'tra' && !o.over);
  if (op2 && op2.sq[0]) { put(op2.sq[0], 120); const p = $2('railOf')(e.x, e.z); $2('opTake')(op2, op2.sq[0], { k: 'move', ri: p.ri, s: p.s, x: e.x, z: e.z, R: 4, fast: 1 }); }   // brought near as above
  ok(c3.ok && op2 && op2.b === b.i, 'cross (the general\'s command) at it: a squad takes a pontoon there (' + (c3.why || 'ok') + ')');
  const tc = S.t; let tp = null; g2.run(420, () => { if ($2('brOpen')(b) && tp === null) tp = S.t; return tp === null; }); g2.run(8);
  ok(tp !== null && op2 && op2.over && tp - tc > 120, 'the pontoon is laid and the crossing open ' + (tp === null ? '-' : Math.round(tp - tc)) + ' s later (2 to 4 min of it the laying); the manoeuvre ends');
  ok(H.nan(S) === null, 'no NaN');
}

console.log('-- the AI chooses them --');
{
  const g3 = H.load({ mapv: 5, seed: 5 }), $3 = g3.$, S = g3.watch('ww2', {}), L = $3('brs()'), C = $3('cmdOf')(0);
  g3.run(60);
  const b = L.find(b => b.c === 1 && b.ends.some(e => $3('brHome')(0, e)));
  const far = b.ends.find(e => !$3('brHome')(0, e));
  C.known.push(...[0, 1].map(i => ({ team: 1, kind: 'tank', sx: far.x + 60 * i, sz: far.z + 40, dead: false, seenT: S.t, man: false })));
  const X = { t: 0, C, sq: S.squads.filter(q => q.team === 0), free: $3('manFree')(S.squads.filter(q => q.team === 0 && !q.net && q.live > 0 && !q.state)), room: 3 };
  const cand = $3('MANG').dem(C, X).filter(c => c.res.b === b);
  ok(cand.length === 1 && cand[0].sc >= $3('MAN').min, 'two enemy tanks known at the far end, nobody of its own across: demolition is a candidate (score ' + (cand[0] ? cand[0].sc.toFixed(2) : '-') + ')');
  C.known.length = 0;
  ok(!$3('MANG').dem(C, X).some(c => c.res.b === b), 'with the enemy far from the bridge it is not');
  for (const c of L) $3('hitObj')(c.o, 1e5, null); g3.step(dt);
  const tra = $3('MANG').tra(C, Object.assign(X, { free: $3('manFree')(S.squads.filter(q => q.team === 0 && !q.net && q.live > 0 && !q.state)) }));
  ok(tra.length >= 1 && tra[0].sc >= 1.5, 'every bridge down: a crossing is a candidate at once (' + tra.length + ' places, score ' + (tra[0] ? tra[0].sc.toFixed(2) : '-') + ')');
}
done();
