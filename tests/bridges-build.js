'use strict';
/* building bridges again and pontoons at any narrow stretch of the river (W20b): the rebuild of a fallen bridge (engineers, longer than a
   pontoon, the metal it costs, the bridge whole again and its road carrying), the sites of the river, a pontoon at one (a new crossing the
   network routes over, the deck the ground walks on, its destruction shutting it again), the network put back for the next match, and the
   general: rebuild and cross at a point as commands with their refusals, the AI's choices, and the question brg */
const H = require('./harness'), { ok, done } = H;
const g = H.load({ mapv: 5, seed: 7 }), $ = g.$, dt = 1 / 60;
const BR = $('BR'), FORT = $('FORT'), BLD = $('BLD');
const trip = (S, mode) => $('tripOf')(S.base[0].x, S.base[0].z, S.base[1].x, S.base[1].z, { mode: mode || 'veh' });
const uses = (tp, b) => !!tp && tp.some((p, i) => i && $('segDist')(tp[i - 1].x, tp[i - 1].z, p.x, p.z, b.x, b.z) < 15);
const down = b => $('hitObj')(b.o, 1e5, null);
const T_rx = (S, z) => S.T.rx(z);
const still = S => () => { for (const m of S.men) { m.v.x = m.v.z = 0; m.hitT = -99; } };

console.log('-- rebuilding a fallen bridge --');
{
  const S = g.sandbox('ww2'), L = $('brs()'), T = S.T, b = L[1], e = b.ends[0], tp0 = trip(S);
  ok($('fortWhy')(9, 0, e.x, e.z, 0) === 'up', 'nothing to rebuild at a bridge that stands (up)');
  ok($('fortWhy')(9, 0, e.x + 400, e.z + 400, 0) === 'nobr', 'nor away from a bridge (nobr)');
  for (const c of L) down(c); g.step(dt);
  ok(trip(S) === null, 'every bridge down: no way across');
  ok($('fortWhy')(9, 0, e.x + 5, e.z, 0) === '', 'at the bank end of a fallen one: allowed');
  const f = $('fortStart')(9, 0, e.x + 5, e.z, 0);
  ok(f && f.b === b.i && $('hdist')(f, e) < 1 && f.F === FORT.rebuild && FORT.K[9] === FORT.rebuild, 'it starts at the bank end (the work of kind 9)');
  ok($('fortWhy')(9, 1, b.ends[1].x, b.ends[1].z, 0) === 'reb', 'one rebuild a bridge');
  const sap = $('addMan')('pionier', 0, e.x - 2, e.z + 3), p0 = f.prog, t0 = S.t;
  g.run(10, still(S));
  const T1 = (S.t - t0) / (f.prog - p0);
  ok(Math.abs(T1 - FORT.rebuild.time) < 5 && FORT.rebuild.time > FORT.pont.time, 'one sapper alone builds it in ' + Math.round(T1) + ' s (5 min: longer than a pontoon\'s ' + FORT.pont.time + ' s)');
  for (let i = 0; i < 5; i++) $('addMan')('pionier', 0, e.x + i, e.z + 2);
  const p1 = f.prog, t1 = S.t; g.run(10, still(S));
  const T2 = 1 / ((f.prog - p1) / (S.t - t1));
  ok(Math.abs(T2 - FORT.rebuild.time / (1 + BLD.help * (FORT.rebuild.max - 1))) < 5, 'six builders count as ' + FORT.rebuild.max + ': ' + Math.round(T2) + ' s, never under 2 min');
  ok(!$('brOpen')(b) && S.os[b.id] === 2, 'still down while it is built');
  const p = $('fortStart')(7, 0, e.x + 5, e.z, 0); ok(p && p.b === b.i, 'a pontoon may be laid beside it meanwhile');
  g.run(400, () => { still(S)(); return !f.dead; }); g.step(dt);
  ok(f.dead && S.os[b.id] === 0 && S.oh[b.id] === BR.hp[b.c], 'finished: the bridge stands whole again (stage 0, ' + S.oh[b.id] + ' hp) and the work is gone');
  ok(p.dead && !$('brPont')(b), 'its pontoon is taken up');
  ok($('brOpen')(b) && !S.brk.includes(b.i + 'x') && !S.brk.includes(b.i + 'p') && $('hgt')(b.x, b.z) > T.WL + 1, 'its crossing carries again and the road is over the river (S.brk ' + S.brk + ')');
  const tp = trip(S); ok(tp && uses(tp, b), 'base to base the network goes over it again (' + Math.round(tp.len) + ' m, ' + Math.round(tp0.len) + ' with all six standing)');
  ok($('fortWhy')(9, 0, e.x, e.z, 0) === 'up' && $('fortWhy')(7, 0, e.x, e.z, 0) === 'whole', 'standing again: no rebuild, no pontoon');
  $('brPlant')(Object.assign($('addMan')('schutze', 1, e.x + 1, e.z), { chg: 9 }), b); g.run(BLD.charge.fuse + .5);
  ok(S.oh[b.id] < BR.hp[b.c], 'and it can be blown again');
}
{
  const g2 = H.load({ mapv: 5, seed: 7, eco: 1 }), $2 = g2.$, S = g2.watch('ww2', {}), b = $2('brs()')[0], e = b.ends[0];
  $2('hitObj')(b.o, 1e5, null); g2.step(dt);
  const d = S.eco && S.eco.d[0];
  ok(!!d && $2('ecoSim')(), 'the economy is on in this match (side 0 has a stock)');
  const mt = d.mt, M = $2('FORT').rebuild.cost[1]; d.mt = M - 1;
  ok(M === 40 && $2('fortWhy')(9, 0, e.x + 5, e.z, 0) === 'cost', 'where the economy is on, the rebuild costs ' + M + ' metal: refused at ' + (M - 1));
  d.mt = mt + 500; const m0 = d.mt, f = $2('fortStart')(9, 0, e.x + 5, e.z, 0);
  ok(f && d.mt === m0 - M, 'and pays ' + M + ' when it starts (' + m0 + ' -> ' + d.mt + ' metal)');
}

console.log('-- whole builders: a sapper in the squad or a truck near (brWhole) --');
{
  const S = g.sandbox('ww2'), b = $('brs()')[1], e = b.ends[0]; down(b); g.step(dt);
  const f = $('fortStart')(9, 0, e.x + 5, e.z, 0), rif = $('addMan')('schutze', 0, e.x - 2, e.z + 3);
  const rate = () => { const p0 = f.prog, t0 = S.t; g.run(6, still(S)); return (S.t - t0) / (f.prog - p0); };
  const T0 = rate();
  ok(Math.abs(T0 - FORT.rebuild.time / (1 + BLD.help * (FORT.rebuild.eng - 1))) < 8 && T0 > FORT.rebuild.time + 60, 'a rifleman alone counts ' + FORT.rebuild.eng + ' of a builder: ' + Math.round(T0) + ' s for the whole');
  const u = $('addUnit')('truck', 0, 0, 0, null, false, 0, 0, 0); u.x = e.x + 40; u.z = e.z + 20; u.v && (u.v.x = u.v.z = 0); u.fixed = true;
  const T1 = rate();
  ok(Math.abs(T1 - FORT.rebuild.time) < 8, 'a truck of its side ' + Math.round($('hdist')(u, f)) + ' m from the work: the rifleman counts whole (' + Math.round(T1) + ' s)');
  u.x = f.x + BR.reb.truck + 60; u.z = f.z; const T2 = rate();
  ok(Math.abs(T2 - T0) < 8, 'the truck beyond ' + BR.reb.truck + ' m: half again (' + Math.round(T2) + ' s)');
  u.dead = true; const sap = $('addMan')('pionier', 0, e.x + 600, e.z); rif.sq = { men: [rif, sap] };
  const T3 = rate();
  ok(Math.abs(T3 - FORT.rebuild.time) < 8 && !$('builds')(sap, f), 'a live sapper in its squad (away from the work): whole (' + Math.round(T3) + ' s)');
  sap.dead = true; const T4 = rate();
  ok(Math.abs(T4 - T0) < 8, 'the squad\'s sapper dead: half again (' + Math.round(T4) + ' s)');
}

console.log('-- the sites of the river --');
for (const era of ['ww2', 'modern']) {
  const S = g.sandbox(era), T = S.T, L = $('brs()'), P = $('brSites()');
  ok(P.length >= 10 && P.every(s => s.ok && s.w <= BR.ps.max && s.ends[0].x < T.rx(s.z) && s.ends[1].x > T.rx(s.z) && L.every(b => Math.abs(b.z - s.z) >= BR.ps.keep)), era + ': ' + P.length + ' narrow stretches along the river (' + Math.min(...P.map(s => s.w)) + ' to ' + Math.max(...P.map(s => s.w)) + ' m of water), none near a bridge');
  ok(P.every(s => s.ends.every(e => $('hgt')(e.x, e.z) > T.WL + .3) && $('hgt')(s.x, s.z) <= T.WL + .3), 'each from dry bank to dry bank over water');
  const why = {}; for (let z = -T.HW + 300; z < T.HW - 300; z += 100) { const s = $('brSite')(z); why[s.why || 'ok'] = (why[s.why || 'ok'] || 0) + 1; }
  ok(why.near > 0 && (why.wide || 0) + (why.bank || 0) > 0, 'and the rest refused: near a bridge, too wide or steep banks (' + JSON.stringify(why) + ')');
}

console.log('-- a pontoon at a new point of the river --');
{
  const S = g.sandbox('ww2'), L = $('brs()'), T = S.T, N = T.net, ne = N.e.length, nn = N.n.length;
  const P = $('brSites()'), s = P.reduce((a, s) => (Math.abs(s.z) < Math.abs(a.z) ? s : a)), e = s.ends[0];
  ok($('fortWhy')(7, 0, e.x + 3, e.z, 0) === '', 'at the bank end of a site: allowed (z ' + s.z + ', ' + Math.round(s.w) + ' m of water)');
  const wide = $('brSite')(-T.HW + BR.ps.edge + 1e3); ok(['wide', 'bank', 'near', ''].includes(wide.why), 'a site says why it will not do (' + (wide.why || 'ok') + ')');
  for (const c of L) down(c); g.step(dt);
  ok(trip(S) === null, 'every bridge down: no way across');
  const f = $('fortStart')(7, 0, e.x + 3, e.z, 0);
  ok(f && f.ps === s && f.b === undefined && $('hdist')(f, e) < 1 && Math.abs(f.o.hw - s.len / 2) < 1, 'it starts at the bank end, its object across the river (' + Math.round(s.len) + ' m)');
  ok(N.e.length > ne && N.n.length > nn && S.pe.length === 1 && S.bre[S.pe[0].E] === Infinity, 'the network has its span and links (' + (N.e.length - ne) + ' edges), the span no way while it is laid');
  ok($('fortWhy')(7, 1, s.ends[1].x, s.ends[1].z, 0) === 'pont', 'one pontoon a site');
  ok(trip(S) === null && $('hgt')(s.x, s.z) <= T.WL + .3, 'still shut while it is laid');
  for (let i = 0; i < 3; i++) $('addMan')('pionier', 0, e.x - 2 - i, e.z + 2);
  const t0 = S.t; g.run(300, () => { still(S)(); return f.prog < 1; }); g.step(dt);
  ok(f.prog >= 1 && S.pe[0].op && S.bre[S.pe[0].E] === BR.pslow, 'laid in ' + Math.round(S.t - t0) + ' s by three sappers: the span carries (slowly)');
  ok($('hgt')(s.x, s.z) > T.WL + .3 && $('hgt')(s.x, s.z + BR.pw + 20) <= T.WL + .3, 'its deck is ground to walk and drive on, the river beside it water');
  const tp = trip(S), on = !!tp && tp.some((p, i) => i && Math.abs(p.z - s.z) < 2 && Math.abs(tp[i - 1].z - s.z) < 2 && Math.abs(p.x - tp[i - 1].x) > s.w / 2);
  ok(tp && on, 'base to base the network routes over it: a new crossing (' + Math.round(tp.len) + ' m)');
  ok(trip(S, 'foot') !== null, 'on foot too');
  const u = $('addUnit')('truck', 0, 0, 0, null, false, 0, 0, 0); $('place')(u);
  ok(!!$('tripTo')(u, s.ends[1].x + 300, s.z), 'a truck is given a trip over it');
  const m = $('addMan')('schutze', 1, s.x, s.z); $('hitObj')(f.o, 1e4, null); g.step(dt); g.step(dt);
  ok(f.dead && !S.pe[0].op && m.dead && S.bre[S.pe[0].E] === Infinity && S.brc === 1, 'destroyed: the span is no way again and what stood on it is lost');
  ok(trip(S) === null && $('hgt')(s.x, s.z) <= T.WL + .3, 'the crossing is gone: no way across, water where the deck was');
  ok($('brCut')(s.x - s.w / 2 + 5, s.z) === s, 'a rider bound over it stops at the bank (brCut)');
  const f2 = $('fortStart')(7, 0, e.x + 3, e.z, 0); ok(f2 && f2.ps === s && S.pe.length === 2, 'another may be laid there again');
  const n2 = N.e.length; g.sandbox('ww2');
  ok(N.e.length === ne && N.n.length === nn && N.n.every(q => q.e.every(i => i < ne)) && n2 > ne, 'the next match begins with the network as the terrain made it (' + n2 + ' -> ' + ne + ' edges)');
}
{
  const S = g.sandbox('ww2'), P = $('brSites()');
  for (let i = 0; i < BR.ps.cap; i++) $('fortStart')(7, 0, P[i * 3].ends[0].x, P[i * 3].ends[0].z, 0);
  ok($('brPsOf')(0) === BR.ps.cap && $('fortWhy')(7, 0, P[20].ends[0].x, P[20].ends[0].z, 0) === 'pcap' && $('fortWhy')(7, 1, P[20].ends[1].x, P[20].ends[1].z, 0) === '', BR.ps.cap + ' a side away from the bridges (pcap), the other side still free');
  ok(H.nan(S) === null, 'no NaN');
}

console.log('-- a new bridge at a stretch of the river (kind 10, W20c) --');
{
  const S = g.sandbox('ww2'), L = $('brs()'), T = S.T, P = $('brSites()'), s = P.reduce((a, s) => (Math.abs(s.z) < Math.abs(a.z) ? s : a)), e = s.ends[0], NB = FORT.nbr;
  for (const c of L) down(c); g.step(dt);
  ok(trip(S) === null && FORT.K[10] === NB && NB.time === 720 && $('fortWhy')(10, 0, e.x + 3, e.z, 0) === '', 'every bridge down, no way across; at the bank end of a site a new bridge is allowed (z ' + s.z + ')');
  ok($('fortWhy')(10, 0, L[0].ends[0].x, L[0].ends[0].z, 0) !== '', 'not at a fallen bridge\'s end: only at a site (' + $('fortWhy')(10, 0, L[0].ends[0].x, L[0].ends[0].z, 0) + ')');
  const f = $('fortStart')(10, 0, e.x + 3, e.z, 0);
  ok(f && f.k === 10 && f.ps === s && S.pe.length === 1 && S.bre[S.pe[0].E] === Infinity, 'it starts at the bank end, its span in the network and no way while it is built');
  ok($('fortWhy')(7, 1, s.ends[1].x, s.ends[1].z, 0) === 'pont' && $('fortWhy')(10, 1, s.ends[1].x, s.ends[1].z, 0) === 'pont', 'one work a site: no pontoon nor a second bridge there (pont)');
  const sap = $('addMan')('pionier', 0, e.x - 2, e.z + 3), p0 = f.prog, t0 = S.t; g.run(10, still(S));
  const T1 = (S.t - t0) / (f.prog - p0);
  ok(Math.abs(T1 - NB.time) < 10, 'one sapper alone builds it in ' + Math.round(T1) + ' s (12 min)');
  for (let i = 0; i < 3; i++) $('addMan')('pionier', 0, e.x - 3 - i, e.z + 2);
  const p1 = f.prog, t1 = S.t; g.run(10, still(S)); const T2 = (S.t - t1) / (f.prog - p1);
  ok(T2 < 300 && Math.abs(T2 - NB.time / (1 + BLD.help * (NB.max - 1))) < 10, 'four builders: ' + Math.round(T2) + ' s, under 5 min');
  g.run(400, () => { still(S)(); return f.prog < 1; }); g.step(dt);
  ok(f.prog >= 1 && S.pe[0].op && S.bre[S.pe[0].E] === 1, 'finished: the span carries as a road (cost 1, a pontoon ' + BR.pslow + ')');
  const tp = trip(S), on = !!tp && tp.some((p, i) => i && Math.abs(p.z - s.z) < 2 && Math.abs(tp[i - 1].z - s.z) < 2 && Math.abs(p.x - tp[i - 1].x) > s.w / 2);
  ok(tp && on, 'every old bridge down: base to base the network routes over the new one (' + (tp ? Math.round(tp.len) : '-') + ' m)');
  const hp = S.oh[f.id], OB = $('OBJ');
  ok(hp === OB.nbridge.hp[0] && f.o.K === OB.nbridge && OB.nbridge.take[0] === 0 && hp > 5 * OB.pont.hp[0], 'sturdy: ' + hp + ' hp (a pontoon ' + OB.pont.hp[0] + '), and small arms do nothing to it');
  const m = $('addMan')('schutze', 1, s.x, s.z); $('hitObj')(f.o, 1e4, null); g.step(dt); g.step(dt);
  ok(f.dead && !S.pe[0].op && S.bre[S.pe[0].E] === Infinity && m.dead && trip(S) === null, 'destroyed: the river shut again and what stood on it is lost');
  const f2 = $('fortStart')(10, 0, e.x + 3, e.z, 0); ok(f2 && f2.k === 10 && f2.ps === s, 'and it can be built again at the same stretch');
  const P2 = P.filter(x => x !== s && Math.abs(x.z - s.z) > 400);
  $('fortStart')(7, 0, P2[0].ends[0].x, P2[0].ends[0].z, 0); $('fortStart')(10, 0, P2[3].ends[0].x, P2[3].ends[0].z, 0);
  ok($('brPsOf')(0) === BR.ps.cap && $('fortWhy')(10, 0, P2[6].ends[0].x, P2[6].ends[0].z, 0) === 'pcap', 'new bridges and free pontoons count together against the cap of ' + BR.ps.cap + ' a side (pcap)');
  ok(H.nan(S) === null, 'no NaN');
}
{
  const g2 = H.load({ mapv: 5, seed: 7, eco: 1 }), $2 = g2.$, S = g2.watch('ww2', {}), s = $2('brSites()').find(s => s.ends.some(e => $2('brHome')(0, e))), e = s.ends.find(e => $2('brHome')(0, e));
  const d = S.eco.d[0], NB = $2('FORT').nbr; d.mt = NB.cost[1] - 1; d.en = 1e3;
  ok($2('fortWhy')(10, 0, e.x, e.z, 0) === 'cost', 'where the economy is on, a new bridge costs ' + NB.cost[1] + ' metal: refused at ' + (NB.cost[1] - 1));
  d.mt = 900; d.en = 900; const f = $2('fortStart')(10, 0, e.x, e.z, 0);
  ok(f && d.mt === 900 - NB.cost[1] && d.en === 900 - NB.cost[0], 'and pays ' + NB.cost[0] + ' energy and ' + NB.cost[1] + ' metal when it starts');
}
{
  const g2 = H.load({ mapv: 5, seed: 11 }), $2 = g2.$, S = g2.watch('ww2', {}), L = $2('brs()'), t = 0, C = $2('cmdOf')(t);
  $2('MAN').max = { cautious: 9, balanced: 9, aggressive: 9 };
  g2.run(30);
  const s = $2('brSites()').find(s => s.ends.some(e => $2('brHome')(t, e)) && L.every(b => Math.abs(b.z - s.z) > 700));
  C.mcd = {}; const r = $2('genCmd')(t, { c: 'man', k: 'bridge', x: s.x + 20, z: s.z + 60 }, 'sys'), op = C.ops.find(o => o.k === 'nbr' && !o.over);
  ok(r.ok && op && Math.abs(op.pz - s.z) <= BR.ps.near && op.sq.length >= 1, 'the general\'s command (man bridge, MCP build_bridge): the nbr manoeuvre takes a squad to the stretch (z ' + (op && op.pz) + ', ' + (r.why || 'ok') + ')');
  const pe = $2('brSite')(op.pz).ends[op.e], q = op.sq[0];
  q.men.forEach((m, i) => { if (!m.dead) { m.x = pe.x - 30 * Math.sign(T_rx(S, pe.z) - pe.x) + i * 2; m.z = pe.z + 3; m.y = $2('manY')(m.x, m.z); } });
  const p = $2('railOf')(pe.x, pe.z); $2('opTake')(op, q, { k: 'move', ri: p.ri, s: p.s, x: pe.x, z: pe.z, R: 4, fast: 1 });
  let tp = null, sk = 0;
  g2.run(600, () => { const f = $2('brPontSite')(op.pz); if (f && f.k === 10 && f.prog > .05 && f.prog < .9 && !sk) { sk = 1; $2('fortAt')(f, .9); } if (S.pe.some(x => x.op && x.f.k === 10) && tp === null) tp = S.t; return tp === null; }); g2.run(25);   // most of the building skipped once it is under way
  ok(tp !== null && sk && op.over, 'its men build it and the new crossing opens; the manoeuvre ends');
  const qb = $2('genQuery')(t, { q: 'brg' }); ok(qb.ps.some(x => x.kind === 'bridge' && x.open === 1 && x.team === 'own'), 'brg lists it as a bridge, own and open');
  C.mcd = {}; const r2 = $2('genCmd')(t, { c: 'man', k: 'bridge', x: $2('brSite')(op.pz).x, z: op.pz }, 'sys');
  ok(!r2.ok && ['pont', 'site'].includes(r2.why), 'a second one there: refused (' + r2.why + ')');
  ok(H.nan(S) === null, 'no NaN');
}
{
  const g3 = H.load({ mapv: 5, seed: 5 }), $3 = g3.$, S = g3.watch('ww2', {}), L = $3('brs()'), C = $3('cmdOf')(0);
  g3.run(60);
  const X = () => ({ t: 0, C, sq: S.squads.filter(q => q.team === 0), free: $3('manFree')(S.squads.filter(q => q.team === 0 && !q.net && q.live > 0 && !q.state)), room: 3 });
  C.known.length = 0;
  ok(!$3('MANG').nbr(C, X()).length, 'every bridge standing: no new bridge');
  for (const b of L) $3('hitObj')(b.o, 1e5, null); g3.step(dt);
  ok(!$3('MANG').nbr(C, X()).length, 'the bridges down but their ends free of the enemy: no new bridge (a rebuild or a pontoon there does)');
  for (const b of L) for (const e of b.ends) C.known.push({ team: 1, kind: 'tank', sx: e.x + 5, sz: e.z, dead: false, seenT: S.t, man: false });
  /* which squads are free at 60 s depends on the seed: a free squad of its own made ready on the home bank of the nearest safe stretch, as the general would have one */
  const hb = L.filter(b => b.rs.length), to = { x: hb.reduce((a, b) => a + b.x, 0) / hb.length, z: hb.reduce((a, b) => a + b.z, 0) / hb.length };
  const st = $3('brSites()').filter(s => !s.ends.some(e => $3('brFoeNear')(C, e))).sort((a, b) => Math.hypot(a.x - to.x, a.z - to.z) - Math.hypot(b.x - to.x, b.z - to.z))[0], se = st.ends.find(e => $3('brHome')(0, e));
  const fq = S.squads.find(q => q.team === 0 && q.live > 0 && !q.net && !q.state && q.job !== 'fpost'), sg = Math.sign(se.x - st.x);
  fq.men.forEach((m, i) => { if (!m.dead) { m.x = se.x + 60 * sg; m.z = se.z + 3 * i; } }); const X2 = Object.assign(X(), { free: [fq] });
  const c = $3('MANG').nbr(C, X2);
  ok(c.length === 1 && c[0].k === 'nbr' && c[0].sc === .7 && c[0].res.ps && L.every(b => Math.abs(b.z - c[0].res.ps.z) >= BR.ps.keep), 'the enemy at the ends of the fallen bridges: a new bridge at a stretch away from them is a candidate (z ' + (c[0] && c[0].res.ps ? c[0].res.ps.z : '-') + ', score ' + (c[0] ? c[0].sc : '-') + ')');
}

console.log('-- the general: rebuild and cross at a point --');
{
  const g2 = H.load({ mapv: 5, seed: 11 }), $2 = g2.$, S = g2.watch('ww2', {}), L = $2('brs()'), T = S.T, t = 0, C = $2('cmdOf')(t);
  $2('MAN').max = { cautious: 9, balanced: 9, aggressive: 9 };
  g2.run(30);
  const b = L.find(b => b.c === 1 && b.ends.some(e => $2('brHome')(t, e))), e = b.ends.find(e => $2('brHome')(t, e));
  C.mcd = {}; const r0 = $2('genCmd')(t, { c: 'man', k: 'rebuild', x: b.x, z: b.z }, 'sys');
  ok(!r0.ok && r0.why === 'up' && $2('GEN').no.up, 'rebuild at a bridge that stands: refused (up: "' + $2('GEN').no.up + '")');
  $2('hitObj')(b.o, 1e5, null); g2.step(dt);
  const seen = new Set(), watch = () => { for (const x of S.glog.l[t]) seen.add(x.s); };
  const r = $2('genCmd')(t, { c: 'man', k: 'rebuild', x: b.x, z: b.z }, 'sys'), op = C.ops.find(o => o.k === 'reb' && !o.over);
  ok(r.ok && op && op.b === b.i && op.sq.length === 1, 'rebuild (the general\'s command): a squad takes the material to the ' + $2('brName')(b).toLowerCase() + ' (' + (r.why || 'ok') + ')');
  C.mcd = {}; const r2 = $2('genCmd')(t, { c: 'man', k: 'rebuild', x: b.x, z: b.z }, 'sys');
  ok(!r2.ok && r2.why === 'busy', 'a second one there: refused (busy)');
  const q = op.sq[0], ux = (e.x - b.x) / $2('hdist')(e, b), uz = (e.z - b.z) / $2('hdist')(e, b);
  q.men.forEach((m, i) => { if (!m.dead) { m.x = e.x + ux * 100 + uz * (i - 2) * 2; m.z = e.z + uz * 100 - ux * (i - 2) * 2; m.y = $2('manY')(m.x, m.z); } });
  const p = $2('railOf')(e.x, e.z); $2('opTake')(op, q, { k: 'move', ri: p.ri, s: p.s, x: e.x, z: e.z, R: 4, fast: 1 });
  const ts = S.t; let tb = null, w = null, w0 = 0, t0 = 0;
  g2.run(900, () => { watch(); const f = $2('brReb')(b); if (f && !w) { w = f; w0 = f.prog; t0 = S.t; } if (w && S.t - t0 > 30 && w.prog < .9 && !w.dead) { w.rt = (w.prog - w0) / (S.t - t0); $2('fortAt')(w, .9); } if (S.os[b.id] === 0 && tb === null) tb = S.t; return tb === null; }); g2.run(25, watch);   // 30 s of the building watched, then most of the rest skipped
  ok(w && w.rt > 0 && 1 / w.rt > FORT.rebuild.time / (1 + BLD.help * (FORT.rebuild.max - 1)) - 5, 'its men start the work at the bank end and build it (' + (w && w.rt ? Math.round(1 / w.rt) : '-') + ' s for the whole at their pace)');
  ok(tb !== null && op.over, 'the bridge stands ' + (tb === null ? '-' : Math.round(tb - ts)) + ' s after the order; the manoeuvre ends');
  const lg = [...seen];
  ok(lg.some(s => /Reconstrução: esquadra leva o material/.test(s)) && lg.some(s => /Reconstrução: obra começada/.test(s)) && lg.some(s => /reconstruída/.test(s)), 'the log tells it: on its way, the work begun, the bridge built again');
  const qb = $2('genQuery')(t, { q: 'brg' });
  ok(qb.ok && qb.br[b.i].st === 'ok' && qb.br[b.i].open === 1 && qb.br[b.i].reb === null && qb.sites.length > 5 && Array.isArray(qb.ps) && qb.bb === 1, 'the question brg: the bridge ok again, the river\'s sites (' + qb.sites.length + '), the free pontoons (none yet)');
  const s = $2('brSites()').find(s => s.ends.some(e => $2('brHome')(t, e)) && Math.abs(s.z - b.z) > 600), far = { x: s.x + 30, z: s.z + 120 };
  C.mcd = {}; const c1 = $2('genCmd')(t, { c: 'man', k: 'cross', x: far.x, z: far.z }, 'sys'), op2 = C.ops.find(o => o.k === 'tra' && !o.over);
  ok(c1.ok && op2 && op2.pz !== undefined && Math.abs(op2.pz - far.z) <= BR.ps.near, 'cross at a point of the river away from the bridges: a squad takes a pontoon to the nearest narrow stretch (z ' + (op2 && op2.pz) + ')');
  const c2 = $2('genCmd')(t, { c: 'man', k: 'cross', x: $2('S').T.rx(-T.HW + 200), z: -T.HW + 200 }, 'sys');
  ok(!c2.ok && ['site', 'cd', 'max'].includes(c2.why), 'cross where no stretch will do: refused (' + c2.why + ')');
  const ps = $2('brSite')(op2.pz), pe = ps.ends[op2.e], q2 = op2.sq[0];
  q2.men.forEach((m, i) => { if (!m.dead) { m.x = pe.x - 30 * Math.sign(T.rx(pe.z) - pe.x) + i * 2; m.z = pe.z + 3; m.y = $2('manY')(m.x, m.z); } });
  const p2 = $2('railOf')(pe.x, pe.z); $2('opTake')(op2, q2, { k: 'move', ri: p2.ri, s: p2.s, x: pe.x, z: pe.z, R: 4, fast: 1 });
  const tc = S.t; let tp = null, sk = 0;
  g2.run(480, () => { const f = $2('brPontSite')(op2.pz); if (f && f.prog > .1 && f.prog < .9 && !sk) { sk = 1; $2('fortAt')(f, .9); } if (S.pe.some(x => x.op) && tp === null) tp = S.t; return tp === null; }); g2.run(25);   // most of the laying skipped once it is under way
  ok(tp !== null && op2.over && sk, 'the squad lays the pontoon and the new crossing opens ' + (tp === null ? '-' : Math.round(tp - tc)) + ' s after it reaches the bank; the manoeuvre ends');
  const qc = $2('genQuery')(t, { q: 'brg' }); ok(qc.ps.length === 1 && qc.ps[0].open === 1 && qc.ps[0].team === 'own', 'brg lists it: own, open');
  const near = x => $2('brSites()').find(s => !$2('brPontSite')(s.z) && $2('hdist')(s, x) > 300 && $2('hdist')(s, x) < 800);
  const b2 = L.find(x => x !== b && x.ends.some(e => $2('brHome')(t, e)) && near(x)), s2 = near(b2), d2 = $2('hdist')(s2, b2), e2 = b2.ends.find(e => $2('brHome')(t, e));
  $2('hitObj')(b2.o, 1e5, null); g2.step(dt);
  ok($2('brTraAt')({ x: s2.x, z: s2.z }) === null && $2('brTraAt')({ x: b2.x + 200, z: b2.z }) === b2, 'with no pontoon on it: a point at the stretch is the stretch; 200 m from the fallen bridge, every stretch 300 m or more away, the bridge');
  ok($2('fortStart')(7, t, e2.x + 3, e2.z, 0) && $2('brPont')(b2), 'the ' + $2('brName')(b2).toLowerCase() + ' down, with its pontoon');
  C.mcd = {}; const c3 = $2('genCmd')(t, { c: 'man', k: 'cross', x: b2.x, z: b2.z }, 'sys');
  ok(!c3.ok && c3.why === 'pont', 'cross at that bridge itself: still the bridge, refused (pont)');
  C.mcd = {}; const c4 = $2('genCmd')(t, { c: 'man', k: 'cross', x: s2.x, z: s2.z }, 'sys'), op4 = C.ops.find(o => o.k === 'tra' && !o.over);
  ok(d2 > 300 && d2 < 800 && c4.ok && op4 && op4.pz === s2.z && op4.b === -1, 'cross at a narrow stretch ' + Math.round(d2) + ' m from it: the pontoon goes to that stretch, a new crossing to flank by');
  ok(H.nan(S) === null, 'no NaN');
}

console.log('-- the AI chooses them --');
{
  const g3 = H.load({ mapv: 5, seed: 5 }), $3 = g3.$, S = g3.watch('ww2', {}), L = $3('brs()'), C = $3('cmdOf')(0);
  const X = () => ({ t: 0, C, sq: S.squads.filter(q => q.team === 0), free: $3('manFree')(S.squads.filter(q => q.team === 0 && !q.net && q.live > 0 && !q.state)), room: 3 });
  const pick = () => L.find(b => b.rs.length && b.ends.some(e => $3('brHome')(0, e)) && $3('brSquad')(X(), b.ends.find(e => $3('brHome')(0, e)), true, true));
  const MG = $3('MANG'), keep = Object.assign({}, MG); for (const k in MG) MG[k] = () => [];   // no manoeuvre in the warm-up: a squad it would take (they reach farther across country, XC) stays free for the bridges
  g3.run(60); Object.assign(MG, keep); let ax = pick();
  while (!ax && S.t < 120) { g3.run(5); ax = pick(); }   // a bridge of its own bank with a free squad within reach
  if (!ok(!!ax, 'a bridge on side 0\'s bank with a free squad within reach (t ' + Math.round(S.t) + ' s)')) { done(); process.exit(); }
  C.known.length = 0;   // what the side knows of the enemy is set by hand below
  ok(!$3('MANG').reb(C, X()).length, 'every bridge standing: nothing to rebuild');
  $3('hitObj')(ax.o, 1e5, null); g3.step(dt);
  const c = $3('MANG').reb(C, X()).filter(c => c.res.b === ax);
  ok(c.length === 1 && c[0].sc >= $3('MAN').min, 'a fallen bridge of one of its axes, no enemy near: a rebuild is a candidate (score ' + (c[0] ? c[0].sc.toFixed(2) : '-') + ')');
  C.known.push({ team: 1, kind: 'tank', sx: ax.ends[0].x + 20, sz: ax.ends[0].z, dead: false, seenT: S.t, man: false });
  ok(!$3('MANG').reb(C, X()).some(c => c.res.b === ax), 'with the enemy at its end it is not');
  C.known.length = 0; S.brd['0:' + ax.i] = S.t;
  ok(!$3('MANG').reb(C, X()).some(c => c.res.b === ax), 'nor one it blew itself a moment ago');
  for (const b of L) $3('hitObj')(b.o, 1e5, null); g3.step(dt);
  for (const b of L) for (const e of b.ends) C.known.push({ team: 1, kind: 'tank', sx: e.x + 5, sz: e.z, dead: false, seenT: S.t, man: false });
  const tra = $3('MANG').tra(C, X());
  ok(tra.length === 1 && tra[0].res.ps && tra[0].sc >= $3('MAN').min, 'every bridge down with the enemy at all of them: the crossing goes to a narrow stretch of the river (z ' + (tra[0] && tra[0].res.ps ? tra[0].res.ps.z : '-') + ', score ' + (tra[0] ? tra[0].sc.toFixed(2) : '-') + ')');
}

console.log('-- the general never stalls at a fallen bridge of its axis (brUrgent) --');
{
  const g5 = H.load({ mapv: 5, seed: 11 }), $5 = g5.$, S = g5.watch('ww2', {}), L = $5('brs()'), C = $5('cmdOf')(0);
  g5.run(30);
  const b = L.find(b => b.rs.length && b.ends.some(e => $5('brHome')(0, e))), e = b.ends.find(e => $5('brHome')(0, e));
  C.known.length = 0; $5('MAN').max = { cautious: 0, balanced: 0, aggressive: 0 };   // no room for a manoeuvre: brUrgent acts past the cap
  /* a free squad of its own on the home bank (which squads are free at 30 s depends on the seed) */
  const free = () => $5('manFree')(S.squads.filter(q => q.team === 0 && !q.net && q.live > 0 && !q.state && q.job !== 'fpost'));
  const q = free()[0], sg = Math.sign(e.x - b.x);
  q.men.forEach((m, i) => { if (!m.dead) { m.x = e.x + 80 * sg; m.z = e.z + 3 * i; m.y = $5('manY')(m.x, m.z); } });
  const u = S.units.find(u => !u.dead && u.team === 0 && !u.fixed); if (u) { u.brB = b.i; u.brT = S.t; u.brW = S.t + 99; }
  $5('hitObj')(b.o, 1e5, null); S.brU = 0; g5.run(1);
  const op = C.ops.find(o => !o.over && (o.k === 'reb' || o.k === 'tra') && (o.b === b.i || o.pz !== undefined));
  const lg = S.glog.l[0].map(x => x.s);
  ok(op && op.k === 'reb' && op.b === b.i, 'the bridge of its axis down, its end clear: the general rebuilds it at once, past the manoeuvres\' cap (' + (op ? op.k : '-') + ')');
  ok(lg.some(s => /o general age já/.test(s)), 'the log says it: "' + (lg.find(s => /o general age já/.test(s)) || '-') + '"');
  ok(!u || u.brW === 0, 'its vehicles held at the bank look for a way round at once');
  const n = C.ops.filter(o => !o.over && (o.k === 'reb' || o.k === 'tra')).length; S.brU = 0; g5.run(BR.reb.urg + 1);
  ok(C.ops.filter(o => !o.over && (o.k === 'reb' || o.k === 'tra')).length === n, 'and does not open a second one there ' + BR.reb.urg + ' s later');
  ok(H.nan(S) === null, 'no NaN');
}
{
  const g6 = H.load({ mapv: 5, seed: 11 }), $6 = g6.$, S = g6.watch('ww2', {}), L = $6('brs()'), C = $6('cmdOf')(0);
  g6.run(30);
  const b = L.find(b => b.rs.length && b.ends.some(e => $6('brHome')(0, e))), e = b.ends.find(e => $6('brHome')(0, e));
  C.known.length = 0; $6('MAN').max = { cautious: 0, balanced: 0, aggressive: 0 };
  C.known.push({ team: 1, kind: 'tank', sx: e.x + 10, sz: e.z, dead: false, seenT: S.t, man: false });
  const q = $6('manFree')(S.squads.filter(q => q.team === 0 && !q.net && q.live > 0 && !q.state && q.job !== 'fpost'))[0], sg = Math.sign(e.x - b.x);
  q.men.forEach((m, i) => { if (!m.dead) { m.x = e.x + 200 * sg; m.z = e.z + 3 * i; m.y = $6('manY')(m.x, m.z); } });
  $6('hitObj')(b.o, 1e5, null); S.brU = 0; g6.run(1);
  const op2 = C.ops.find(o => !o.over && (o.k === 'reb' || o.k === 'tra'));
  ok(op2 && op2.k === 'tra' && op2.pz !== undefined, 'the enemy at its end: no rebuild and no pontoon there, a pontoon at another stretch of the river (' + (op2 ? op2.k + (op2.pz !== undefined ? ' z ' + op2.pz : ' at bridge ' + op2.b) : '-') + ')');
  ok(H.nan(S) === null, 'no NaN');
}

console.log('-- a guest takes the host\'s obj pairs in their order --');
{
  const g4 = H.load({ mapv: 5, seed: 13 }), $4 = g4.$, S = g4.sandbox('ww2'), b = $4('brs()')[2], id = b.id, obj = $4('Net').rx.obj;
  $4('hitObj')(b.o, 1e5, null); g4.step(dt); S.net = true; S.host = false;
  obj({ e: [id, 0, id, 2] });
  ok(S.os[id] === 2 && !$4('brOpen')(b), 'rebuilt and down again within one message (' + id + ',0,' + id + ',2): the guest has it down, as the host');
  obj({ e: [id, 0, id, 1] });
  ok(S.os[id] === 1 && $4('brOpen')(b), 'rebuilt and hit (' + id + ',0,' + id + ',1): the guest has it standing and hurt (stage ' + S.os[id] + ')');
  S.net = false;
}
done();
