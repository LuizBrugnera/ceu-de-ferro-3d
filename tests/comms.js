'use strict';
/* The command network (W15, issue #2): the HQ, the radio vehicles and the operators make the net; a unit's link (in it, out of it, cut by a
   jammer); the commander's orders take 2-5 s in the net, 20-60 s out of it and never while cut (the squad keeps its last order and mission,
   and no operation takes it as arrived), a newer order keeps the arrival, one kept too long is lost; reports and sightings wait as orders
   do and the general's map ages; the lost HQ makes the commander plan every 9 s until the reserve; direction finding fixes a busy sender;
   the view, the state and the analytics; nothing drawn from the battle's random numbers. Then AI battles in both eras (SECS, default 240) */
const H = require('./harness'), ok = H.ok, SECS = +process.env.SECS || 240;
const box = (era, seed) => {
  const C = H.load({ seed: seed || 4 }), $ = C.$, S = C.sandbox(era || 'ww2'), r = S.T.routes[0], CN = $('CN');
  S.cmd = [$('cmdOf')(0), $('cmdOf')(1)];
  const at = s => $('routeAt')(r, s);
  const squad = (t, x, z) => {
    const q = C.dispatch(t, { kind: 'defend', why: 'teste' }, () => C.addSquad(t, x, z, 0, r.len / 2));
    if (!q.ord) C.setOrd(q, { k: 'hold', ri: 0, s: q.s });
    return q;
  };
  const put = (o, x, z) => { for (const m of o.men || [o]) { m.x = x; m.z = z; } };
  const car = (t, id, x, z) => { const u = C.dispatch(t, { why: 'teste' }, () => C.addUnit('car', t, 0, 0, id, false, 0, r.len / 2, 5, 9)); u.x = x; u.z = z; return u; };
  const look = () => { if (S.cn) S.cn.acc = 0; C.cnStep(1e-3); };
  const order = (q, O) => { const N = S.cn, was = N.ctx; N.ctx = q.team; try { C.setOrd(q, O); } finally { N.ctx = was; } };
  const later = s => { S.t += s; look(); };
  const b0 = S.base[0], b1 = S.base[1];
  look();
  return { C, $, S, CN, r, at, squad, put, car, look, order, later, b0, b1, W: S.W };
};
const radio = (S, t) => (S.glog ? S.glog.l[t] : []).filter(e => e.k === 'radio').map(e => e.s);

console.log('-- the net: the HQ, the radio vehicle, the operator; who is in, out, cut --');
{
  const { C, $, S, CN, squad, put, car, look, b0, W } = box('ww2');
  const N = S.cn, hq = N.nodes[0].find(n => n.k === 3);
  ok(N.hq[0].st === 'up' && N.hq[0].id >= 0 && S.T.byId[N.hq[0].id].k === 'ctl', 'each side\'s HQ is the control tower of its main base (object ' + N.hq[0].id + '), standing');
  ok(hq && hq.x === b0.x && Math.abs(hq.r - W * CN.hq.r) < 1e-6, 'the HQ reaches half the map\'s width (' + Math.round(hq.r) + ' m) from the base');
  const near = squad(0, b0.x + 800, b0.z), far = squad(0, b0.x + W * CN.hq.r + 600, b0.z); look();
  ok(near.cnL === 2 && near.cnN && near.cnN.k === 3, 'a squad 800 m from its base is in the net, through the HQ');
  ok(far.cnL === 1, 'a squad ' + Math.round(W * CN.hq.r + 600) + ' m out is out of the net');
  const id = S.E.sides[S.fac[0]].rad, u = car(0, id, b0.x + W * CN.hq.r + 300, b0.z); u.dep = 0; look();
  const n1 = N.nodes[0].find(n => n.o === u);
  ok(n1 && Math.abs(n1.r - W * CN.car.r * CN.car.mob) < 1e-6 && far.cnL === 2 && far.cnN === n1, 'a radio vehicle on the move reaches ' + Math.round(n1 && n1.r) + ' m: the squad 300 m from it is in, through it');
  u.dep = 1; look(); ok(Math.abs(N.nodes[0].find(n => n.o === u).r - W * CN.car.r) < 1e-6, '  with its mast up, ' + Math.round(W * CN.car.r) + ' m');
  u.dead = true; const m = far.men[1]; m.def = Object.assign({}, m.def, { rad: 1 }); put(far, b0.x + W * CN.hq.r + 2000, b0.z); look();
  const n2 = N.nodes[0].find(n => n.o === m);
  ok(n2 && n2.k === 0 && Math.abs(n2.r - W * CN.man.r) < 1e-6 && far.cnL === 2, 'a radio operator is a node of ' + Math.round(W * CN.man.r) + ' m: his own squad, far out, keeps its link');
  ok(N.nodes[1].length === 1 && N.nodes[1][0].k === 3, 'the other side\'s net is its own (its HQ only)');
}
{
  const { C, $, S, CN, squad, put, car, look, b0, b1, W } = box('modern');
  const N = S.cn, q = squad(0, b0.x + 900, b0.z), j = car(1, 'tigr', b0.x + 900, b0.z + 100); look();
  ok(N.jam[1].includes(j) && q.cnL === 0, 'an enemy jammer (' + j.def.name + ') 100 m from a squad cuts it, inside its own net');
  j.z = b0.z + CN.jam.r * .7; look();
  ok(q.cnL === 1, 'at 70% of the jammer\'s ' + CN.jam.r + ' m: degraded, out of the net');
  j.z = b0.z + CN.jam.r + 10; look(); ok(q.cnL === 2, 'beyond its reach: in the net again');
  const own = car(0, 'hmmwv', b0.x + 900, b0.z + 50); look(); ok(q.cnL === 2 && N.jam[0].includes(own), 'its own side\'s jammer does not cut it');
  j.x = b0.x; j.z = b0.z; look(); ok(!N.nodes[0].some(n => n.k === 3) && q.cnL === 1, 'a jammer on the HQ takes the HQ out of the net: the squad has no node left');
}

console.log('-- orders: in the net, out of it, cut, lost; the squad keeps its last order and mission meanwhile --');
{
  const { C, $, S, CN, squad, put, car, look, order, later, b0, W, at, r } = box('modern');
  const N = S.cn, q = squad(0, b0.x + 900, b0.z); look();
  const O0 = q.ord, O = { k: 'assault', ri: 0, s: r.len / 2, x: b0.x + 1500, z: b0.z, R: 12 }; q.at = true;
  order(q, O);
  ok(q.ord === O0 && q.cnP && q.cnP.O === O && q.at === false && q.mis.kind === 'defend', 'the commander\'s order is on its way: the squad keeps its order and mission, and is not "arrived"');
  const eta = q.cnP.at - S.t;
  ok(eta >= CN.in[0] && eta <= CN.in[1], 'in the net it needs ' + eta.toFixed(1) + ' s (2-5)');
  C.squadThink(q); ok(q.at === false, '  its own thinking does not mark it arrived while the order is on its way');
  const O2 = { k: 'hold', ri: 0, s: r.len / 2, x: b0.x + 1200, z: b0.z, R: 12 }, a0 = q.cnP.at; order(q, O2);
  ok(q.cnP.O === O2 && q.cnP.at === a0 && N.st[0].sent === 1, 'a newer order replaces the one on its way and keeps its arrival');
  later(eta - .5); ok(q.cnP && q.ord === O0, 'not yet, half a second before it');
  later(1); ok(!q.cnP && q.ord === O2 && N.st[0].del === 1, 'then it arrives: the squad takes it');
  order(q, O); ok(q.cnP && q.cnP.st === 2, 'the next one goes the same way');
  put(q, b0.x + W * CN.hq.r + 800, b0.z); look(); ok(q.cnP && q.cnL === 1 && q.cnP.at - S.t <= CN.in[1], 'it was sent in the net, the squad has since left it: the order keeps its arrival...');
  later(CN.in[1] + .1); ok(!q.cnP && q.ord === O, '...and arrives (an out squad still hears, later)');
  order(q, O2); const e2 = q.cnP.at - S.t;
  ok(q.cnP.st === 1 && e2 >= CN.out[0] && e2 <= CN.out[1], 'out of the net it needs ' + e2.toFixed(1) + ' s (20-60)');
  later(e2 + 1); ok(!q.cnP && q.ord === O2 && N.st[0].late === 1, '  and arrives then');
  const j = car(1, 'tigr', q.men[0].x, q.men[0].z + 40); look(); ok(q.cnL === 0, 'an enemy jammer beside it: cut');
  order(q, O); ok(q.cnP.at === Infinity, 'an order for a cut squad has no arrival');
  later(30); ok(q.cnP && q.ord === O2, '  30 s later it still has its last order');
  j.dead = true; look(); const e3 = q.cnP.at - S.t; ok(e3 >= CN.out[0] && e3 <= CN.out[1], 'the jammer gone, the link is back: the order arrives in ' + e3.toFixed(1) + ' s');
  later(e3 + 1); ok(q.ord === O, '  and it does');
  const j2 = car(1, 'tigr', q.men[0].x, q.men[0].z + 40); look(); order(q, O2);
  later(CN.lose + 2); ok(!q.cnP && q.ord === O && N.st[0].lost === 1 && radio(S, 0).some(s => /Ordem perdida/.test(s)), 'cut for longer than ' + CN.lose + ' s: the order is lost, and the diary says so');
  j2.dead = true; look();
  const Q = { k: 'hold', ri: 0, s: 100, x: b0.x, z: b0.z, R: 9 }; C.setOrd(q, Q); ok(q.ord === Q && !q.cnP, 'an order from outside the commander (a drill, a call for help) is at once');
  const q2 = C.dispatch(0, { why: 'teste' }, () => C.addSquad(0, b0.x + 500, b0.z, 0, 200)); N.ctx = 0; C.setOrd(q2, Q); N.ctx = -1;
  ok(q2.ord === Q, 'a new squad\'s first order is at once');
  N.ctx = 1; C.setOrd(q, O); N.ctx = -1; ok(q.ord === O && !q.cnP, 'the other side\'s commander does not delay this side\'s squad');
  CN.on = 0; order(q, O2); ok(q.ord === O2, 'CN.on 0: every order at once'); CN.on = 1;
  put(q, b0.x + 900, b0.z); look();
  const g = C.genCmd(0, { c: 'move', ids: [q.id], x: b0.x + 1300, z: b0.z + 200 }, 'sys');
  ok(g.ok && q.cnP && q.cnP.O.k === 'hold' && q.ord === O2, 'a general\'s command (genCmd) goes by radio too: ok at once, the order on its way');
}

console.log('-- reports and sightings: the commander hears late, the map ages --');
{
  const { C, $, S, CN, squad, put, car, look, later, b0, b1, W } = box('modern');
  const N = S.cn, q = squad(0, b0.x + 900, b0.z), Cm = S.cmd[0]; look();
  C.rep(q, 'contact'); const r1 = S.rep[0][S.rep[0].length - 1];
  ok(r1.cnA - S.t >= CN.in[0] && r1.cnA - S.t <= CN.in[1], 'a report from the net is on its way ' + (r1.cnA - S.t).toFixed(1) + ' s');
  C.misRead(0); ok(!(Cm.rep || []).includes(r1) && S.rep[0].includes(r1), '  the commander reading now does not have it');
  S.t += CN.in[1] + .1; C.misRead(0); ok(Cm.rep.includes(r1) && !S.rep[0].includes(r1), '  and has it once it has arrived');
  const j = car(1, 'tigr', q.men[0].x, q.men[0].z + 30); look(); C.rep(q, 'stuck'); const r2 = S.rep[0][S.rep[0].length - 1];
  ok(r2.cnA === Infinity, 'a cut squad\'s report waits for the link');
  later(CN.lose + 2); ok(!S.rep[0].includes(r2) && N.st[0].lost === 1, '  and is lost after ' + CN.lose + ' s');
  j.dead = true; look();
  const e = squad(1, b0.x + 3000, b0.z), m = e.men[0], spot = squad(0, b0.x + W * CN.hq.r + 500, b0.z); look();
  ok(spot.cnL === 1 && !C.cnSaw(spot.men[0]) && C.cnSaw(q.men[0]), 'cnSaw: a man in the net reports at once, one out of it does not');
  m.seenT = -1e9; C.cnLate(m, spot.men[0]); const w = N.sw.get(m);
  ok(w && w.at - S.t >= CN.out[0] && w.at - S.t <= CN.out[1] && Math.hypot(w.x - m.x, w.z - m.z) <= $('SHARE').err * 1.5, 'what only an out squad saw is on its way (' + (w.at - S.t).toFixed(1) + ' s), a little off');
  const T0 = S.t; later(CN.out[0] - 1); ok(m.seenT < 0, '  not on the map before');
  later(CN.out[1]); ok(m.seenT === T0 && !N.sw.has(m), '  then on it, as it was when seen (' + (S.t - m.seenT).toFixed(0) + ' s old): the map ages');
  const j2 = car(1, 'tigr', spot.men[0].x, spot.men[0].z + 30); look(); m.seenT = -1e9; C.cnLate(m, spot.men[0]);
  ok(!N.sw.has(m), 'what only a cut squad saw never reaches the map'); j2.dead = true; look();
  const x0 = spot.men[0].x; later(1); put(spot, x0 + 600, b0.z); later(10);
  const V = C.genVM(0, false), ve = V.u.find(u => u.sqd && u.id === spot.id);
  ok(ve && Math.abs(ve.x - x0) < 1 && ve.age > 9, 'the general\'s map shows a squad out of the net where it last told (' + Math.round(ve.age) + ' s old), not where it is');
  later(CN.out[0]); const ve2 = C.genVM(0, false).u.find(u => u.sqd && u.id === spot.id);
  ok(Math.abs(ve2.x - (x0 + 600)) < 1, '  its next word, ' + CN.out[0] + ' s on, moves it');
  const vq = C.genVM(0, false).u.find(u => u.sqd && u.id === q.id); ok(vq && vq.age === undefined, 'a squad in the net is where it is');
}

console.log('-- the HQ: lost, the commander plans every 9 s; the reserve --');
{
  const { C, $, S, CN, squad, look, later, b0, W } = box('ww2');
  const N = S.cn, plans = () => { let n = 0; for (let i = 0; i < 30; i++) { if (C.plan(0, true)) n++; S.t += 1; } return n; };
  const n0 = plans(); ok(n0 === 30, 'with its HQ, every call starts a plan (' + n0 + ' of 30)');
  S.os[N.hq[0].id] = 2; look();
  ok(N.hq[0].st === 'down' && !N.nodes[0].some(n => n.k === 3) && radio(S, 0).some(s => /QG destruído/.test(s)), 'the tower falls: the HQ is down, out of the net, and the diary says so');
  const n1 = plans(); ok(n1 === Math.ceil(30 / CN.hq.plan), 'without it a plan starts every ' + CN.hq.plan + ' s (' + n1 + ' of 30)');
  ok(C.plan(1, true) && C.plan(1, true), '  the other side plans as before');
  const V = C.genVM(0, false); ok(V.cn.hq === 'down' && V.cn.every === CN.hq.plan && V.cn.left > 0, 'the view says so: down, plans every ' + V.cn.every + ' s, the reserve in ' + V.cn.left + ' s');
  later(CN.hq.alt); const h = N.nodes[0].find(n => n.k === 3);
  ok(N.hq[0].st === 'alt' && h && Math.abs(h.r - W * CN.hq.altR) < 1e-6 && radio(S, 0).some(s => /QG reserva/.test(s)), 'after ' + CN.hq.alt + ' s the reserve HQ is up, of a shorter reach (' + Math.round(h.r) + ' m)');
  const n2 = plans(); ok(n2 === 30, '  and the commander plans at its pace again');
}

console.log('-- direction finding: a busy sender near an enemy node is fixed --');
{
  const { C, $, S, CN, squad, put, look, later, b1, W } = box('ww2');
  const N = S.cn, q = squad(0, b1.x - W * CN.df.r + 500, b1.z), L = q.men[0]; look(); L.seenT = -1e9;
  for (let i = 0; i < CN.df.n - 1; i++) C.cnTx(q); look(); ok(L.seenT < 0 && N.st[1].df === 0, (CN.df.n - 1) + ' words: not enough');
  C.cnTx(q); look();
  ok(L.seenT === S.t && Math.hypot(L.sx - L.x, L.sz - L.z) <= CN.df.err * 1.5 && N.st[1].df === 1 && radio(S, 1).some(s => /Radiogoniometria/.test(s)), CN.df.n + ': the enemy fixes it ' + Math.round(Math.hypot(L.sx - L.x, L.sz - L.z)) + ' m off, and its diary says so');
  C.cnTx(q); later(1); ok(N.st[1].df === 1, '  not again within ' + CN.df.cool + ' s');
  later(CN.df.half * 4); C.cnTx(q); look(); ok(N.st[1].df === 1, 'the count halves every ' + CN.df.half + ' s: one word after a quiet spell is not enough');
  const far = squad(0, b1.x - W * CN.df.r - 1500, b1.z), F = far.men[0]; look(); F.seenT = -1e9;
  for (let i = 0; i < CN.df.n + 2; i++) C.cnTx(far); look(); ok(F.seenT < 0, 'beyond ' + Math.round(W * CN.df.r) + ' m of every enemy node it is not heard');
}

console.log('-- the view, the state, online, and no random number --');
{
  const { C, $, S, CN, squad, put, look, order, b0, W, r } = box('ww2');
  const q = squad(0, b0.x + W * CN.hq.r + 600, b0.z); look(); order(q, { k: 'hold', ri: 0, s: 900, x: b0.x + 3000, z: b0.z, R: 9 });
  const V = C.genVM(0, false), row = V.cn.sq.find(e => e[0] === q.id);
  ok(row && row[1] === 1 && row[2] >= CN.out[0] && row[3] === b0.x + 3000, 'the view: the squad out of the net, its order on its way (' + row[2] + ' s) and where to');
  ok(V.cn.nodes.length === 1 && V.cn.n[1] === 1, '  the nodes and the count in, out and cut');
  const st = C.genState(0), sq = st.sq.find(e => e.id === q.id);
  ok(st.cn && st.cn.hq === 'up' && st.cn.nodes[0].k === 3 && sq.link === 1 && sq.eta >= CN.out[0], 'genState (the MCP\'s picture): the net, and each squad\'s link and order on its way');
  ok($('GENK').includes('cn') && C.genPick(V).cn.sq.length === 1, 'the view\'s part goes to the side\'s players online (GENK, gen)');
  const G = H.load({ seed: 4 }), S2 = G.sandbox('ww2'); S2.net = true; S2.host = false; G.$('Net').gen = true;
  S2.gcm = [{ rx: S2.t, v: { cn: { hq: 'down', left: 50, every: 9, nodes: [], jam: [], sq: [], n: [1, 2, 0] } } }, null];
  ok(G.genVM(0, false).cn.hq === 'down', 'a guest\'s view takes the host\'s cn');
  let n = 0; const R0 = Math.random; C.$('Math').random = () => { n++; return .5; };
  for (let i = 0; i < 20; i++) { S.t += 1; look(); C.genVM(0, false); }
  C.$('Math').random = R0; ok(n === 0, 'the net draws no random number (' + n + ')');
}

console.log('-- AI battles in both eras (' + SECS + ' s, the economy and the analytics on) --');
for (const era of ['ww2', 'modern']) {
  const C = H.load({ seed: 7, eco: true, ana: true, mapv: 5 }), $ = C.$, S = C.watch(era, { min: 30 }), CN = $('CN');
  let old = 0, big = 0, pend = 0;
  C.run(SECS, () => {
    if (!S.cn || S.t % 5 > 1 / 60) return;
    for (const q of S.squads) if (q.cnP) { pend++; if (S.t - q.cnP.T0 > CN.lose + 2) old++; }
    for (const s of [0, 1]) big = Math.max(big, JSON.stringify({ t: 'gen', s, T: 1, v: C.genPick(C.genVM(s, false)), q: [] }).length);
  });
  const N = S.cn, st = N.st, sn = $('ANA').ev.filter(e => e.k === 'sn' && e.cn), Rr = C.anaReport($('ANA').ev);
  ok(!H.nan(S), era + ': no NaN');
  ok(st[0].sent + st[1].sent > 0 && st[0].del + st[1].del > 0 && pend > 0, '  the commanders\' orders went by radio: sent ' + (st[0].sent + st[1].sent) + ', delivered ' + (st[0].del + st[1].del) + ', late ' + (st[0].late + st[1].late) + ', lost ' + (st[0].lost + st[1].lost) + ' (mean ' + ((st[0].lat + st[1].lat) / Math.max(1, st[0].del + st[1].del)).toFixed(1) + ' s)');
  ok(old === 0, '  no order stayed on its way past its loss (' + old + ')');
  ok(st[0].rep + st[1].rep > 0 && st[0].inN + st[1].inN > 0, '  reports ' + (st[0].rep + st[1].rep) + '; squads in the net ' + (st[0].inN + st[1].inN) + ', out ' + (st[0].outN + st[1].outN) + ', cut ' + (st[0].cutN + st[1].cutN) + '; fixes ' + (st[0].df + st[1].df));
  ok(sn.length > 0 && sn[sn.length - 1].cn.length === 2 && Rr.comms && Rr.comms[0].sent === sn[sn.length - 1].cn[0][0], '  the analytics: cn in ' + sn.length + ' snapshots, comms in the review (side 0: ' + JSON.stringify(Rr.comms[0]) + ')');
  ok(big < 8192, '  the general\'s view message stays under the server\'s cap (' + big + ' bytes)');
}
H.done();
