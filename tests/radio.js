'use strict';
/* The radio relay and the gaps of the command net (CNR, on W15's net): a relay that stands is a node of the net and extends it; one destroyed,
   jammed or still being built does not; a busy one is fixed by direction finding, and a spotted one is a target for the enemy's batteries;
   a radio vehicle on the move and an operator are nodes where they are; req radio sends the free radio vehicle (it drives there by the roads
   and holds, its mast up) or an operator's squad to cover a place; fort radio has the general's builder put a relay up (its cap, its cost,
   the field works' cap left aside, an older server refused); the gaps the commander sees, and the AI general closing one, away from the
   enemy's eyes; the view and the state; the cost of it all in an AI battle of SECS s (default 240) in each era */
const H = require('./harness'), ok = H.ok, SECS = +process.env.SECS || 240;
const box = (era, o) => {
  const C = H.load(Object.assign({ seed: 4, mapv: 6 }, o)), $ = C.$;
  /* the economy is only in a match (a conquest that is not a demo): with o.eco a solo conquest emptied as the sandbox is (as tests/posts.js) */
  const S = o && o.eco ? (s => { s.demo = false; s.over = true; s.units = []; s.planes = []; s.men = []; s.squads = []; for (const f of s.forts.slice()) C.fortDrop(f); s.forts = []; return s; })(C.newState(era || 'modern', $('ERAS')[era || 'modern'].sides[0].fighter, { cls: 'plane' })) : C.sandbox(era || 'modern');
  S.cmd = [$('cmdOf')(0), $('cmdOf')(1)]; for (const f of S.fld) f.next = 1e9; for (const Cm of S.cmd) { Cm.mnT = 1e9; Cm.atkT = 1e9; }
  const CN = $('CN'), CNR = $('CNR'), FORT = $('FORT'), W = S.W, b0 = S.base[0];
  const squad = (t, x, z, job, kits) => {
    const p = $('railOf')(x, z), q = C.dispatch(t, { kind: 'defend', why: 'teste' }, () => C.addSquad(t, x, z, p.ri, p.s, kits));
    q.job = job || 'held'; q.jk = 0; q.col = false; $('setOrd')(q, { k: 'hold', ri: p.ri, s: p.s, x, z, R: 12 }); return q;
  };
  const radKits = t => { const E = $('INF')[S.era][S.fac[t]], i = E.findIndex(id => $('KITS')[id].rad); return [0, 0, 0, i]; };
  const car = (t, id, x, z) => { const p = $('railOf')(x, z), u = C.dispatch(t, { why: 'teste' }, () => C.addUnit('car', t, 0, 0, id, false, p.ri, p.s, 5, 9)); if (x !== undefined && !(Math.abs(p.off) < 30)) { u.x = x; u.z = z; } return u; };
  const look = () => { if (S.cn) S.cn.acc = 0; C.cnStep(1e-3); };
  const later = s => { S.t += s; look(); };
  /* a dry place a relay may stand on, near x z */
  const site = (x, z) => { for (let r = 0; r < 900; r += 30) for (let a = 0; a < 6.28; a += .5) { const X = x + Math.cos(a) * r, Z = z + Math.sin(a) * r; if ($('gMapOk')(X, Z) && !C.fortWhy(8, 0, X, Z, 0, true)) return { x: X, z: Z }; } return null; };
  /* a dry place by a road at about d m from side 0's base */
  const road = d => { for (const r of S.T.routes) for (let s = 0; s < r.len; s += 50) { const p = $('routeAt')(r, s), e = Math.hypot(p.x - b0.x, p.z - b0.z); if (Math.abs(e - d) < 60 && $('gMapOk')(p.x, p.z)) return { x: p.x, z: p.z }; } return null; };
  look();
  return { C, $, S, CN, CNR, FORT, W, b0, squad, radKits, car, look, later, site, road };
};
const radio = (S, t) => (S.glog ? S.glog.l[t] : []).filter(e => e.k === 'radio').map(e => e.s);
const lead = q => q.men.find(m => !m.dead && !m.gone);

console.log('-- the relay: a node of the net while it stands, finished and clear of jammers --');
{
  const { C, $, S, CN, FORT, W, b0, squad, car, look, site } = box('modern');
  const N = S.cn, R = W * CN.rel.r, G = site(b0.x + W * CN.hq.r + 900, b0.z), q = squad(0, G.x, G.z);
  look(); ok(q.cnL === 1, 'a squad ' + Math.round(Math.hypot(G.x - b0.x, G.z - b0.z)) + ' m from its base is out of the net');
  const P = site(G.x - 1500, G.z), f = C.fortStart(8, 0, P.x, P.z, 0);
  ok(f && f.F === FORT.rel && f.F.name === 'Antena de rádio' && FORT.K[8] === FORT.rel, 'a radio relay is the work of kind 8 (' + (f && f.F.name) + ')');
  C.fortAt(f, .5); look(); ok(q.cnL === 1 && !N.nodes[0].some(n => n.k === 4), 'half built it is no node yet');
  C.fortAt(f, 1); look();
  const n = N.nodes[0].find(n => n.k === 4);
  ok(n && n.o === f && Math.abs(n.r - R) < 1e-6 && q.cnL === 2 && q.cnN === n, 'finished, it is a node of ' + Math.round(R) + ' m: the squad 1500 m from it is in the net, through it');
  ok(radio(S, 0).some(s => /Antena de rádio pronta/.test(s)), '  and the diary says it is up');
  ok(!N.nodes[1].some(n => n.k === 4), 'the other side\'s net does not have it');
  const j = car(1, 'tigr', f.x + 100, f.z); look();
  ok(!N.nodes[0].some(n => n.k === 4) && q.cnL === 1, 'an enemy jammer beside it takes it out of the net (' + j.def.name + ')');
  j.dead = true; look(); ok(q.cnL === 2, 'the jammer gone, it serves again');
  C.hitObj(f.o, 999, null); C.fortStep(1 / 60); look();
  ok(f.gone && !S.forts.includes(f) && !N.nodes[0].some(n => n.k === 4) && q.cnL === 1, 'destroyed by a burst it is gone, and the squad is out of the net again');
  ok(radio(S, 0).some(s => /Antena de rádio destruída/.test(s)), '  and the diary says so');
}

console.log('-- found and shelled: direction finding, the enemy\'s eyes, its batteries --');
{
  const { C, $, S, CN, W, b0, squad, car, look, later, site } = box('modern');
  const N = S.cn, G = site(b0.x + W * CN.hq.r + 900, b0.z), q = squad(0, G.x, G.z), P = site(G.x - 1200, G.z), f = C.fortStart(8, 0, P.x, P.z, 0); C.fortAt(f, 1);
  const e = car(1, $('ERAS').modern.sides[S.fac[1]].rad, f.x + W * CN.df.r - 800, f.z + 200); e.dep = 1; look();
  ok(q.cnN && q.cnN.o === f && N.nodes[1].some(n => n.o === e), 'the squad\'s words go through the relay; an enemy radio vehicle listens ' + Math.round(Math.hypot(e.x - f.x, e.z - f.z)) + ' m away');
  for (let i = 0; i < CN.df.n; i++) C.cnTx(q); look();
  ok((f.kn & 2) && f.seenT === S.t && N.st[1].df >= 1 && radio(S, 1).some(s => /Radiogoniometria/.test(s)), 'the relay that passes them on is fixed by direction finding: the enemy knows the work');
  const u = { team: 1, x: f.x + 2000, z: f.z }, all = []; C.fortTargets(u, all);
  ok(all.some(o => o.f === f && o.kind === 'rad' && $('spotted')(o)), 'and it is on its batteries\' list, spotted, worth what a radio is (' + $('GAI').art.val.rad + ')');
  const f2 = C.fortStart(8, 0, site(P.x, P.z + 900).x, site(P.x, P.z + 900).z, 0); C.fortAt(f2, 1); later(1);
  const all2 = []; C.fortTargets(u, all2); ok(!all2.some(o => o.f === f2 && $('spotted')(o)) && !(f2.kn & 2), 'another relay nobody has seen is not');
  const m = squad(1, f2.x + 200, f2.z).men; later(1);
  const seen = !!(f2.kn & 2) && f2.cg && f2.cg.seenT === S.t;
  ok(seen || !$('los')(m[0], $('eyeY')(m[0]), f2.cg || f2, f2.y + 4), 'enemy troops ' + Math.round(Math.hypot(m[0].x - f2.x, m[0].z - f2.z)) + ' m from it with it in sight spot it (' + (seen ? 'spotted' : 'no line of sight here') + ')');
}

console.log('-- mobile cover: the radio vehicle on the move and the operator are nodes where they are --');
{
  const { C, $, S, CN, W, b0, squad, radKits, car, look, site } = box('modern');
  const N = S.cn, G = site(b0.x + W * CN.hq.r + 1500, b0.z), q = squad(0, G.x, G.z); look();
  const u = car(0, $('ERAS').modern.sides[S.fac[0]].rad); u.x = G.x - 600; u.z = G.z; u.dep = 0; look();
  const n = N.nodes[0].find(n => n.o === u);
  ok(n && Math.abs(n.r - W * CN.car.r * CN.car.mob) < 1e-6 && q.cnL === 2, 'a radio vehicle on the move covers ' + Math.round(n.r) + ' m around it: the squad is in');
  u.x = G.x - 4000; look(); const n2 = N.nodes[0].find(n => n.o === u);
  ok(n2 && n2.x === u.x && q.cnL === 1, 'driven on, the cover goes with it and the squad is out again');
  const o = squad(0, G.x - 900, G.z, 'held', radKits(0)), op = o.men.find(m => m.def.rad); look();
  ok(op && q.cnL === 2 && N.nodes[0].some(n => n.o === op && n.k === 0), 'a squad with a radio operator 900 m off brings the net to the squad');
}

console.log('-- req radio: the vehicle or an operator goes to cover a place --');
{
  const { C, $, S, CN, CNR, W, b0, squad, radKits, car, look, road } = box('modern');
  C.genCtl(0, 'me', { eco: 1, atk: 0, def: 0, sup: 0 });
  const cmd = c => C.genCmd(0, c, 'me'), A = road(W * CN.hq.r - 200), Z = road(W * CN.hq.r + 1300), q = squad(0, Z.x, Z.z); look();
  ok(q.cnL === 1 && cmd({ c: 'req', k: 'radio', x: Z.x, z: Z.z }).why === 'nrad', 'no radio vehicle and no operator free: nrad (' + $('gNo')('nrad') + ')');
  const u = car(0, $('ERAS').modern.sides[S.fac[0]].rad, A.x, A.z); u.x = A.x; u.z = A.z;
  const r = cmd({ c: 'req', k: 'radio', x: Z.x, z: Z.z });
  ok(r.ok && u.trip && u.cnG && u.mis.kind === 'support' && S.cmd[0].cnFix.some(x => x.k === 'car' && x.u === u), 'the free radio vehicle is sent with a mission to cover the place (' + (r.why || 'ok') + ')');
  let inT = -1, moved = 0; const t0 = S.t;
  for (let i = 0; i < 400 && !(u.dep === 1 && q.cnL === 2); i++) {
    C.run(1, null, 1 / 20); look(); const n = S.cn.nodes[0].find(n => n.o === u); if (n && n.x === u.x && n.z === u.z) moved++;
    if (inT < 0 && q.cnL === 2) inT = S.t - t0;
  }
  ok(moved > 3 && inT >= 0, 'its cover moves with it, and the squad is in the net ' + Math.round(inT) + ' s after the order');
  ok(!u.trip && u.cnG && u.cnG.T > S.t && u.dep === 1 && Math.hypot(u.x - Z.x, u.z - Z.z) < CNR.near, 'there it holds, mast up (' + Math.round(Math.hypot(u.x - Z.x, u.z - Z.z)) + ' m from the place), for ' + CNR.hold + ' s');
  const x0 = u.x, z0 = u.z; C.run(20, null, 1 / 20); ok(Math.hypot(u.x - x0, u.z - z0) < 5, '  it does not drive on toward the front');
  u.cnG.T = S.t; look(); ok(!u.cnG, 'its time up, it is free again');
  u.dead = true;
  const o = squad(0, A.x + 50, A.z, 'held', radKits(0)), r2 = cmd({ c: 'req', k: 'radio', x: Z.x, z: Z.z }), op = S.cmd[0].ops.find(p => p.id === r2.id);
  ok(r2.ok && op && op.v === 'radio' && op.sq[0] === o && o.mis.kind === 'support' && Math.hypot(o.ord.x - Z.x, o.ord.z - Z.z) < 1, 'with no vehicle a squad with a radio operator goes there and holds');
  const p = squad(0, A.x + 90, A.z); ok(cmd({ c: 'req', k: 'radio', x: Z.x, z: Z.z, ids: [p.id] }).why === 'nrad', 'squads named without an operator: nrad');
}

console.log('-- fort radio: the general\'s builder puts a relay up --');
{
  const { C, $, S, CN, FORT, W, b0, squad, look, site } = box('modern', { eco: 1 });
  C.genCtl(0, 'me', { eco: 1, atk: 0, def: 0, sup: 0 });
  const cmd = c => C.genCmd(0, c, 'me'), P = site(b0.x + W * CN.hq.r - 600, b0.z), e = squad(0, P.x - 80, P.z - 60, 'eng');
  const fcap = $('fortCap')(0, 0);   // the field works' cap, grown by the side's economy tier and points held (cf-construir-mais)
  for (let i = 0; i < fcap; i++) { const s = site(P.x + 300 + 40 * (i % 8), P.z + 400 + 40 * Math.floor(i / 8)); C.fortStart(1, 0, s.x, s.z, 0); }
  const d = S.eco.d[0], en = d.en; d.en = 0; ok(cmd({ c: 'fort', k: 'radio', x: P.x, z: P.z }).why === 'cost', 'short of energy: cost'); d.en = Math.max(en, 500); d.mt = Math.max(d.mt, 500);
  const e0 = d.en, m0 = d.mt, r = cmd({ c: 'fort', k: 'radio', x: P.x, z: P.z }), op = S.cmd[0].ops.find(o => o.id === r.id), atOrder = [e0 - d.en, m0 - d.mt];
  ok(r.ok && op && op.sq[0] === e && e.ord.dig && e.ord.dig.k === 8 && e.mis.kind === 'build', 'with the side\'s ' + fcap + ' field works up it is still accepted: the engineers go to build it (' + (r.why || 'ok') + ')');
  ok(cmd({ c: 'fort', k: 'trench', x: P.x + 200, z: P.z }).why === 'fcap', '  a trench is refused fcap as before');
  let paid = atOrder[0] > 0 ? atOrder : null;   // what the side's stock dropped by when it was ordered, or else in the step the work began (the income of the minutes it takes to build is no part of it)
  for (let i = 0; i < 160 && !S.forts.some(f => f.k === 8 && f.prog >= 1); i++) { const en = d.en, mt = d.mt; C.run(1, null, 1 / 20); for (const t of [0, 1]) C.$('plan')(t); look(); if (!paid && S.forts.some(f => f.k === 8 && f.team === 0)) paid = [en - d.en, mt - d.mt]; }
  const f = S.forts.find(f => f.k === 8 && f.team === 0);
  ok(f && f.prog >= 1 && Math.hypot(f.x - P.x, f.z - P.z) < 40 && paid && paid[0] >= FORT.rel.cost[0] - 2 && paid[1] >= FORT.rel.cost[1] - 2, 'they build it there, its cost paid when it began (' + FORT.rel.cost.join(' energy, ') + ' metal; the stock fell ' + (paid ? paid.map(Math.round).join(', ') : '-') + ')');
  look(); ok(S.cn.nodes[0].some(n => n.o === f), '  and it is in the net');
  for (let i = 0; i < 2; i++) { const s = site(P.x, P.z - 300 - 200 * i); C.fortAt(C.fortStart(8, 0, s.x, s.z, 0), 1); }
  ok(cmd({ c: 'fort', k: 'radio', x: P.x + 300, z: P.z }).why === 'rcap', 'the side\'s ' + FORT.rel.cap + ' relays up: rcap (' + $('gNo')('rcap') + ')');
  S.net = true; S.host = true; $('Net').crl = false;
  ok(cmd({ c: 'fort', k: 'radio', x: P.x, z: P.z }).why === 'crl' && C.fortWhy(8, 0, P.x, P.z, 0) === 'server', 'online with a server that does not carry it: crl, and nobody starts one (' + $('gNo')('crl') + ')');
  S.net = false;
}

console.log('-- the gaps and the AI general closing them --');
{
  const { C, $, S, CN, CNR, W, b0, squad, look, site } = box('modern');
  const G = site(b0.x + W * CN.hq.r + 1200, b0.z), q = squad(0, G.x, G.z), q2 = squad(0, G.x + 300, G.z + 200);
  const B = site(b0.x + W * CN.hq.r - 900, b0.z), e = squad(0, B.x, B.z, 'eng'); look();
  ok(q.cnL === 1 && q2.cnL === 1 && e.cnL === 2, 'two squads out of the net ' + Math.round(G.x - b0.x) + ' m out, engineers in it behind them');
  const gs = C.cnGaps(0); ok(gs.length === 1 && gs[0].n === 2 && gs[0].ids.includes(q.id) && Math.hypot(gs[0].x - G.x, gs[0].z - G.z) < 400, 'the commander sees one gap with both squads');
  const s0 = C.cnSite(0, gs[0], false);
  ok(s0 && gs[0].m.every(p => Math.hypot(p.x - s0.x, p.z - s0.z) < W * CN.rel.r) && Math.hypot(s0.x - b0.x, s0.z - b0.z) < Math.hypot(G.x - b0.x, G.z - b0.z) - 900, 'its relay site covers both and stands back toward the base (' + Math.round(Math.hypot(s0.x - G.x, s0.z - G.z)) + ' m from the gap)');
  const Cm = S.cmd[0], M = Cm.tm = { nx: Math.ceil(S.W / 200), nz: Math.ceil(2 * S.HW / 200), c: 200 }; M.v = new Float32Array(M.nx * M.nz);
  const cell = (x, z) => Math.max(0, Math.min(M.nz - 1, ((z + S.HW) / 200) | 0)) * M.nx + Math.max(0, Math.min(M.nx - 1, (x / 200) | 0));
  for (let dx = -400; dx <= 400; dx += 200) for (let dz = -400; dz <= 400; dz += 200) M.v[cell(s0.x + dx, s0.z + dz)] = .9;
  const s1 = C.cnSite(0, gs[0], false); ok(s1 && M.v[cell(s1.x, s1.z)] <= CNR.vis, 'where the enemy watches that place, the relay goes elsewhere (' + Math.round(Math.hypot(s1.x - s0.x, s1.z - s0.z)) + ' m off, unwatched)');
  Cm.known.push({ sx: s1.x + 200, sz: s1.z, man: true, dead: false }); const s2 = C.cnSite(0, gs[0], false);
  ok(!s2 || Math.hypot(s2.x - s1.x - 200, s2.z - s1.z) >= CNR.foe, 'nor within ' + CNR.foe + ' m of an enemy it knows of');
  M.v.fill(1); ok(C.cnSite(0, gs[0], false) === null, 'watched everywhere: no site');
  Cm.tm = null; Cm.known.length = 0;
  C.genCtl(0, 'me', { eco: 1, atk: 0, def: 0, sup: 0 }); C.$('plan')(0);
  ok(Cm.cnGap.length === 1 && !(Cm.cnFix || []).length, 'with the support domain the person\'s, the AI sees the gap and leaves it to them');
  const V = C.genVM(0, false); ok(V.cn.gap.length === 1 && V.cn.gap[0][3] === 2 && V.cn.gap[0][4] === 0, 'the view has the gap: 2 squads, nothing on its way');
  const st = C.genState(0); ok(st.cn.gaps.length === 1 && st.cn.gaps[0].squads === 2 && st.cn.gaps[0].fix === null, 'and so does the state (the MCP\'s picture)');
  C.genCtl(0, 'ai'); Cm.cnT = 0;
  const t0 = S.t, e0 = { x: e.men[0].x, z: e.men[0].z }; let fixT = -1, inT = -1;
  for (let i = 0; i < 600 && inT < 0; i++) {
    C.run(1, null, 1 / 20); for (const t of [0, 1]) C.$('plan')(t); look();
    if (fixT < 0 && (Cm.cnFix || []).length) fixT = S.t - t0;
    if (q.cnL === 2 && q2.cnL === 2) inT = S.t - t0;
  }
  const f = S.forts.find(f => f.k === 8 && f.team === 0), L = radio(S, 0), walk = f ? Math.hypot(e0.x - f.x, e0.z - f.z) : 0, due = walk / $('MAN').walk + $('FORT').rel.time + 60;   // its engineers walk there and build it
  ok(fixT >= 0 && fixT <= CNR.every + 1 && L.some(s => /Brecha na rede .*antena de rádio ordenada/.test(s)), 'the AI general orders a relay for it within ' + Math.round(fixT) + ' s, and says why');
  ok(f && f.prog >= 1 && inT >= 0 && inT <= due, 'the relay is up and both squads are in the net ' + Math.round(inT) + ' s after the AI took the chair back (the engineers walk ' + Math.round(walk) + ' m and build it: due in ' + Math.round(due) + ' s)');
  for (let i = 0; i < CNR.every + 1; i++) { S.t += 1; C.$('plan')(0); }
  ok(C.genVM(0, false).cn.gap.length === 0, '  the gap is closed on the view (by the next look at the gaps, every ' + CNR.every + ' s)');
  ok(!e.op && !(Cm.cnFix || []).some(x => x.k === 'rel'), 'the builders are handed back once it is up');
}

console.log('-- the radio delay: an order through the relay arrives as in the net --');
{
  const { C, S, CN, W, b0, squad, look, later, site } = box('ww2');
  const G = site(b0.x + W * CN.hq.r + 900, b0.z), q = squad(0, G.x, G.z), P = site(G.x - 1000, G.z), f = C.fortStart(8, 0, P.x, P.z, 0); C.fortAt(f, 1); look();
  const N = S.cn, was = N.ctx; N.ctx = 0; try { C.setOrd(q, { k: 'hold', ri: q.ri, s: q.s, x: G.x + 50, z: G.z, R: 9 }); } finally { N.ctx = was; }
  const eta = q.cnP && q.cnP.at - S.t; ok(q.cnP && q.cnP.st === 2 && eta >= CN.in[0] && eta <= CN.in[1], 'in 1944 too: the order reaches the squad through the relay in ' + (eta || 0).toFixed(1) + ' s (2-5)');
  later(CN.in[1] + .1); ok(!q.cnP, '  and arrives');
}

console.log('-- AI battles in both eras (' + SECS + ' s, the economy on): what the net and its gaps cost --');
for (const era of ['modern', 'ww2']) {
  const C = H.load({ seed: 7, eco: true, mapv: 6 }), $ = C.$, S = C.watch(era, { min: 30 }), CNB = $('CNB');
  for (const k of Object.keys(CNB)) if (typeof CNB[k] === 'number') CNB[k] = 0;
  let gaps = 0, fixes = 0, big = 0; const rels = new Set();
  C.run(SECS, () => {
    if (!S.cn || S.t % 5 > 1 / 60) return;
    for (const t of [0, 1]) { const Cm = S.cmd[t]; gaps = Math.max(gaps, (Cm.cnGap || []).length); fixes = Math.max(fixes, (Cm.cnFix || []).length); }
    for (const f of S.forts) if (f.k === 8) rels.add(f);
    for (const s of [0, 1]) big = Math.max(big, Buffer.byteLength(JSON.stringify(Object.assign({ t: 'gen' }, C.genMsg ? C.genMsg(s, 1) : { s, T: 1, v: C.genPick(C.genVM(s, false)), q: [] })), 'utf8'));   // the message as the host sends it (genMsg fits it, cf-pol-testes-b), in bytes as the relay counts
  });
  const st = CNB.stat(), L = [0, 1].map(t => radio(S, t)).flat();
  ok(!H.nan(S), era + ': no NaN');
  ok(st.lookN > 0 && st.fixN > 0, '  gaps seen up to ' + gaps + ' a side, fixes on their way up to ' + fixes + ', relays started ' + rels.size + '; diary: ' + L.filter(s => /Brecha|Antena|Veículo-rádio a caminho|Operador de rádio a caminho/.test(s)).length + ' lines on the gaps');
  ok(st.look < 1 && st.fix < 2, '  the cost: the net\'s look ' + st.look + ' ms a call (worst ' + st.lookWorst + ', ' + st.lookN + ' calls), the gap planner ' + st.fix + ' ms (worst ' + st.fixWorst + ', ' + st.fixN + ' calls)');
  ok(big < 8192, '  the general\'s view message stays under the server\'s cap (' + big + ' bytes)');
}
H.done();
