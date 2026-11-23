'use strict';
/* Roads plan, slice 4 (map version 4): the danger on each edge (C.et) and a way that avoids it, columns that pick their axis by the danger on it, the kill-zone trigger of
   the scout, and the ride: a manoeuvre squad on a long walk boards a free truck, is carried by a threat-aware road to a drop point short of its target, gets out as the same
   squad (q.op, q.ord, its id) and walks on, and reaches its target sooner than on foot. Env: PAGE. */
const H = require('./harness'), { ok, done } = H;
const hdist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const fresh = (C, era, o) => { C.seed(7); const S = C.newState(era, C.$('ERAS')[era].sides[0].fighter, { cls: 'plane' }); S.demo = false; S.over = !(o && o.keep); S.units = []; S.planes = []; S.men = []; S.squads = []; return S; };
for (const era of ['ww2', 'modern']) {
  console.log(era);
  const C = H.load({ seed: 5, mapv: 4 }), $ = C.$, RN = $('RN'), MAN = $('MAN');
  /* 4.1 the danger on an edge, and the way that avoids it */
  { const S = fresh(C, era), Cm = $('cmdOf')(0), N = S.T.net, G = $('CMD').cell;
    $('cmdSense')(Cm, []);
    ok(S.T.net.e.every(e => e.smp && e.smp.length === Math.max(1, Math.round(e.len / 200))), 'every edge has a sample every 200 m (' + N.e.length + ' edges, ' + N.e.reduce((a, e) => a + e.smp.length, 0) + ' samples)');
    ok(Cm.et && Cm.et.length === N.e.length && Array.from(Cm.et).every(v => Math.abs(v - $('MANT').thr.fog) < 1e-6), 'with nothing known every edge is only in the fog (' + $('MANT').thr.fog + ')');
    const cell = p => Math.max(0, Math.min(Cm.nz - 1, (p.z + S.HW) / G | 0)) * Cm.nx + Math.max(0, Math.min(Cm.nx - 1, p.x / G | 0));
    /* an edge with a way round: the nearest node pair it joins, the other road of the network between them */
    let pick = null;
    for (const e of N.e) {
      if (e.c > 1 || e.len < 1500) continue;
      const other = $('netPath')(e.a, e.b, x => (x.i === e.i ? 1e9 : x.len), 'veh');
      if (other && other.e.length && other.c < 1e8 && other.c < 3.5 * e.len && !other.e.includes(e.i)) { pick = e; break; }
    }
    ok(!!pick, 'there is an edge of the network with another way round it (' + (pick && pick.a + '-' + pick.b + ', ' + (pick.len | 0) + ' m') + ')');
    const A = N.n[pick.a], B = N.n[pick.b], cmp = (p, e) => p.some(q => e.p.some(w => hdist(q, w) < 5) && hdist(q, A) > 1 && hdist(q, B) > 1);
    const p0 = $('tripOf')(A.x, A.z, B.x, B.z, { mode: 'veh', team: 0 }), pplain = $('tripOf')(A.x, A.z, B.x, B.z, { mode: 'veh' });
    ok(p0 && cmp(p0, pick) && Math.abs(p0.len - pplain.len) < 1, 'without danger the way between its nodes is the edge itself (' + (p0 && p0.len | 0) + ' m)');
    const e0 = Cm.et[pick.i], k0 = Array.from(Cm.et);
    for (const p of pick.smp) Cm.kz = Cm.kz || new Float32Array(Cm.nx * Cm.nz), Cm.kz[cell(p)] += 30;   // losses all along it
    $('cmdSense')(Cm, []);
    const mx = Array.from(Cm.et).reduce((a, v, i) => a + (i !== pick.i && Math.abs(v - k0[i]) > 1e-6 && v > k0[i] + 1 ? 1 : 0), 0);
    ok(Cm.et[pick.i] > e0 + 5 && mx <= 3, 'losses along an edge raise its danger (' + e0.toFixed(2) + ' -> ' + Cm.et[pick.i].toFixed(2) + ') and not much else (' + mx + ' other edges that cross those cells)');
    S.t += 11;   // a way is kept 10 s
    const p1 = $('tripOf')(A.x, A.z, B.x, B.z, { mode: 'veh', team: 0 }), p2 = $('tripOf')(A.x, A.z, B.x, B.z, { mode: 'veh', team: 1 });
    ok(p1 && !cmp(p1, pick) && p1.len > p0.len, 'the way between its nodes now goes round it (' + (p1 && p1.len | 0) + ' m for ' + (p0.len | 0) + ')');
    ok(cmp(p2, pick), 'the other side, which lost nobody there, still takes the edge');
    const p3 = $('tripOf')(A.x, A.z, B.x, B.z, { mode: 'veh', team: 0 }); ok(p3 === p1, 'the way is kept (same object) inside its 10 s');
    for (let i = 0; i < 200; i++) $('cmdSense')(Cm, []);
    ok(Cm.et[pick.i] - $('MANT').thr.fog < .2 * (47 - $('MANT').thr.fog) + 1, 'the danger fades with the kill zone (' + Cm.et[pick.i].toFixed(2) + ' after 200 plan ticks, was about 47)');
    const L = S.T.net.n.find(n => n.id === 'B0') || N.n[0], tmp = $('tripOf')(L.x + 40, L.z, N.n[3].x, N.n[3].z, { mode: 'foot', team: 0 }); ok(!!tmp, 'a foot trip with a team is found too');
  }
  /* 4.2 the axis of a column */
  { const S = fresh(C, era, { keep: 0 }), Cm = $('cmdOf')(0), R = S.T.routes; C.seed(31);
    $('cmdSense')(Cm, []);
    const draw = n => { const c = [0, 0, 0]; for (let i = 0; i < n; i++) c[$('colAxis')(0)]++; return c; };
    const c0 = draw(300);
    ok(c0.every(v => v > 0) && c0[2] < c0[0] && c0[2] < c0[1] && Math.abs(c0[2] / 300 - RN.colW[1] / (2 + RN.colW[1])) < .08, 'with no danger the axes are drawn by RN.colW (' + c0 + ' of 300; the centre axis ' + (c0[2] / 3).toFixed(0) + ' %, expected ' + (100 * RN.colW[1] / (2 + RN.colW[1])).toFixed(0) + ' %)');
    const G = $('CMD').cell, ri = 1, a = $('entryS')(0, ri), b = $('lineS')(0, ri), lo = Math.min(a, b), hi = Math.max(a, b);
    for (let s = lo; s <= hi; s += 100) { const p = $('routeAt')(R[ri], s); Cm.inf[Math.max(0, Math.min(Cm.nz - 1, (p.z + S.HW) / G | 0)) * Cm.nx + Math.max(0, Math.min(Cm.nx - 1, p.x / G | 0))] = -30; }
    C.seed(32); const c1 = draw(20);
    ok(c1[ri] <= 5, '20 column choices with enemy influence between the entry and the line of axis ' + ri + ': ' + c1 + ' (at most 5 on it)');
    const c2 = draw(300); ok(c2[ri] / 300 < .12, 'over 300 draws ' + (100 * c2[ri] / 300).toFixed(0) + ' % go to it');
    /* the director itself, with the commander knowing: a column of each side every few seconds, on the axes the choice gives */
    const D = H.load({ seed: 9, mapv: 4 }), S2 = D.newState(era, D.$('ERAS')[era].sides[0].fighter, { cls: 'plane' }); let err = null; const axes = new Set();
    try { D.run(400, () => { for (const u of S2.units) if (u.ai && !u.dead && u.ri !== undefined && !u.fld) axes.add(u.ri); }, 1 / 20); } catch (e) { err = e; }
    ok(!err && axes.size >= 3, 'a solo battle of 400 s: columns ran on ' + axes.size + ' axes' + (err ? ' ' + err.stack : ''));
  }
  /* 4.3 the scout looks over a stretch where troops died */
  { const S = fresh(C, era), Cm = $('cmdOf')(0), t = 1, ds = 1, ri = 0, R = S.T.routes, s0 = 9000, Cm1 = $('cmdOf')(t); $('cmdSense')(Cm1, []);
    const u = C.addUnit('tank', t, 0, 0, S.E.sides[S.fac[t]].tanks[0], false, ri, s0, 5, 0), G = $('CMD').cell, cell = p => Math.max(0, Math.min(Cm1.nz - 1, (p.z + S.HW) / G | 0)) * Cm1.nx + Math.max(0, Math.min(Cm1.nx - 1, p.x / G | 0));
    ok($('kzSite')(Cm1, ri, u, ds) === null, 'no kill zone ahead: no site');
    Cm1.kz = new Float32Array(Cm1.nx * Cm1.nz); const p = $('routeAt')(R[ri], s0 + 300); Cm1.kz[cell(p)] = 1; ok($('kzSite')(Cm1, ri, u, ds) === null, 'one loss ahead is under the threshold ' + $('MANT').thr.scout);
    Cm1.kz[cell(p)] = 2.5; const st = $('kzSite')(Cm1, ri, u, ds);
    ok(st && Math.abs(st.s - (s0 + 300)) < $('CMD').cell && $('kzSite')(Cm1, ri, u, ds) === null, 'kill zones worth 2.5 within the next 600 m give a site at the worst of them (s ' + (st && st.s | 0) + '), and once a ' + $('MANT').thr.again + ' s');
    Cm1.kzT = []; Cm1.kz.fill(0); Cm1.kz[cell($('routeAt')(R[ri], s0 - 900))] = 9; ok($('kzSite')(Cm1, ri, u, ds) === null, 'a kill zone behind the column does not count');
    for (const s of $('cmdSites')()) Cm1.scd.add(s);   // no ambush site is left to trigger the scout: only the kill zone
    Cm1.kzT = []; Cm1.kz.fill(0); Cm1.kz[cell($('routeAt')(R[ri], s0 + 400))] = 3;
    const q = C.addSquad(t, u.x, u.z, ri, s0 - 20); q.col = true; q.job = 'col'; q.ord = { k: 'escort' }; q.live = 5; u.ai.fd = 1e9;
    $('cmdColumns')(Cm1, [q]);
    ok(Cm1.sc[ri] && Cm1.sc[ri].q === q && q.ord.k === 'scout', 'cmdColumns sends the column\'s squad out in front on the kill zone alone (scout order to s ' + (q.ord.s | 0) + ')');
  }
  /* the ride */
  const run = ride => {
    const C2 = H.load({ seed: 5, mapv: 4 }), $2 = C2.$, S = fresh(C2, era), t = 1, ds = 1, Cm = $2('cmdOf')(t), R = S.T.routes, nd = id => S.T.net.n.find(n => n.id === id);
    $2('MAN').ride.near = ride ? $2('MAN').ride.near : 0;
    const s3 = nd('S3').ax.find(a => a[0] === 0)[1], from = s3 - 250, a0 = $2('routeAt')(R[0], from); let TG = nd('X'), tk = 'x', wp = $2('tripOf')(a0.x, a0.z, TG.x, TG.z, { mode: 'foot' });
    if (wp.len > $2('RN').tripMax - 100) { TG = nd('W'); tk = 'w'; wp = $2('tripOf')(a0.x, a0.z, TG.x, TG.z, { mode: 'foot' }); }
    const q = C2.addSquad(t, a0.x, a0.z, 0, from), id0 = q.id; q.job = 'line'; q.jk = 0;
    const u = C2.addUnit('truck', t, 0, 0, null, false, 0, from + 500, 5, 0), home = { x: u.x, z: u.z };
    $2('MANT').flk.T = 3000;
    const op = $2('manOpen')(Cm, 'flk', { T: 1400 }, 'sys', { P: null, nm: 'alvo', tx: TG.x, tz: TG.z, ri: 2, s: 0, st: 'go', path: wp });
    op.Tmax = 3000;
    const O = { k: 'move', ri: 2, s: $2('railOf')(TG.x, TG.z).s, x: TG.x, z: TG.z, R: 12, wp, quiet: 1, fast: 1 }; $2('opTake')(op, q, O); op.n0 = q.live;
    const T = { wp, q, u, op, O, id0, home, TG, st: [], board: null, land: null, arrive: null, n0: q.live, keep: true, ev: [], S, $: $2, C: C2, Cm };
    let last = ''; const trace = (k) => { if (k !== last) { last = k; T.st.push([k, +S.t.toFixed(0)]); } };
    let nextPlan = 0;
    C2.run(1600, () => {
      if (S.t >= nextPlan) { nextPlan = S.t + 3; $2('manRides')(Cm); }
      trace(q.rd ? q.rd.st : q.tp ? 'walk' : 'there');
      if (q.rd && q.rd.st === 'ride') { if (T.board === null) T.board = S.t; if (q.op !== op || !op.sq.includes(q) || q.ord !== O || q.id !== id0 || !S.squads.includes(q) || $2('manLive')(q) < T.n0) T.keep = false; }
      if (T.board !== null && T.land === null && !q.rd) { T.land = S.t; T.landAt = { x: q.men.find(m => !m.dead).x, z: q.men.find(m => !m.dead).z }; T.liveAfter = $2('manLive')(q); T.men = S.men.filter(m => m.sq === q && !m.dead).length; T.same = q.op === op && op.sq.includes(q) && q.ord === O && q.id === id0 && S.squads.includes(q) && S.squads.filter(o => o.team === t).length === 1; }
      if (q.at && !q.tp && T.arrive === null) { T.arrive = S.t; return false; }
    }, 1 / 10);
    T.mrd = Object.assign({}, S.mrd); return T;
  };
  const foot = run(false), car = run(true);
  ok(foot.arrive !== null && foot.board === null && (!foot.mrd.go), 'on foot (no vehicle within reach) the squad walks its way of ' + (foot.wp.len | 0) + ' m and arrives at t = ' + (foot.arrive || 0).toFixed(0) + ' s, with no ride');
  const T = car;
  ok(T.mrd.go === 1 && T.board !== null && T.land !== null, 'a manoeuvre squad with a free truck near boards (t = ' + (T.board || 0).toFixed(0) + ' s) and is let off (t = ' + (T.land || 0).toFixed(0) + ' s): ' + JSON.stringify(T.st.map(a => a.join('@'))));
  ok(T.keep && T.same, 'it is the same squad throughout: same object, id, order, op (op.sq holds it), all ' + T.n0 + ' men counted aboard, and one squad of the side afterwards');
  ok(T.liveAfter === T.n0 && T.men === T.n0, 'the men are back in the world as soldiers of that squad (' + T.men + ' of ' + T.n0 + ')');
  const wpS = T.q.rd ? 0 : 0; void wpS;
  ok(T.mrd.planned === 1 && T.landAt && hdist($('routeAt')(T.wp, $('polyNearS')(T.wp, T.landAt)), T.landAt) < 120 && hdist(T.landAt, T.wp[T.wp.length - 1]) >= $('MAN').ride.keep - 150, 'it gets out at the planned drop on its own way, ' + (T.landAt ? hdist(T.landAt, T.wp[T.wp.length - 1]).toFixed(0) : '-') + ' m short of its end (keep ' + $('MAN').ride.keep + ')');
  ok(T.arrive !== null && T.arrive < foot.arrive * .8 && T.q.ord === T.O, 'and walks on with the same order and arrives at t = ' + (T.arrive || 0).toFixed(0) + ' s against ' + foot.arrive.toFixed(0) + ' s on foot');
  ok(!T.u.trip && !T.u.mr && !T.u.cargo && !T.u.dead, 'the truck is back to its own business (no trip, no cargo)');
  /* the ride ends early when the op ends, and a squad lost with its vehicle is lost */
  const early = (how) => {
    const C2 = H.load({ seed: 5, mapv: 4 }), $2 = C2.$, S = fresh(C2, era), t = 1, Cm = $2('cmdOf')(t), R = S.T.routes, nd = id => S.T.net.n.find(n => n.id === id);
    const s3 = nd('S3').ax.find(a => a[0] === 0)[1], from = s3 - 250, a0 = $2('routeAt')(R[0], from); let TG = nd('X'), wp = $2('tripOf')(a0.x, a0.z, TG.x, TG.z, { mode: 'foot' });
    if (wp.len > $2('RN').tripMax - 100) { TG = nd('W'); wp = $2('tripOf')(a0.x, a0.z, TG.x, TG.z, { mode: 'foot' }); }
    const q = C2.addSquad(t, a0.x, a0.z, 0, from), u = C2.addUnit('truck', t, 0, 0, null, false, 0, from + 500, 5, 0);
    const op = $2('manOpen')(Cm, 'flk', { T: 1400 }, 'sys', { P: null, nm: 'alvo', tx: TG.x, tz: TG.z, ri: 2, s: 0, st: 'go', path: wp }); op.Tmax = 3000;
    $2('opTake')(op, q, { k: 'move', ri: 2, s: $2('railOf')(TG.x, TG.z).s, x: TG.x, z: TG.z, R: 12, wp, quiet: 1, fast: 1 }); op.n0 = q.live;
    let np = 0, aboard = false; C2.run(300, () => { if (S.t >= np) { np = S.t + 3; $2('manRides')(Cm); } if (q.rd && q.rd.st === 'ride') { aboard = true; return false; } }, 1 / 10);
    const out = { aboard, q, u, S, $: $2, C: C2, Cm, op };
    if (!aboard) return out;
    C2.run(8, null, 1 / 10);
    if (how === 'op') { $2('opEnd')(Cm, op); } else { u.dead = true; u.cargo = null; }
    let np2 = 0; C2.run(10, () => { if (S.t >= np2) { np2 = S.t + 3; $2('manRides')(Cm); } }, 1 / 10);
    return out;
  };
  { const E = early('op'); ok(E.aboard && !E.q.rd && !E.u.mr && !E.u.cargo && E.q.live === E.q.men.filter(m => !m.dead).length && E.q.live > 0 && E.S.squads.includes(E.q) && E.S.men.filter(m => m.sq === E.q).length === E.q.live && !E.q.op, 'an op that ends with its squad aboard lets it off where the vehicle is: the squad is on foot again (' + E.q.live + ' men), free of the op'); }
  { const E = early('dead'); ok(E.aboard && !E.q.rd && E.q.live === 0 && !E.S.squads.includes(E.q) && E.$('S').mrd.lost === 1, 'a vehicle lost with its squad aboard takes the squad with it (counted lost)'); }
  /* the ordinary runs still leave a manoeuvre squad alone, and a squad of an op with no long walk is not given a ride */
  { const S = fresh(C, era), t = 1, Cm = $('cmdOf')(t), q = C.addSquad(t, S.T.bases[1].x, S.T.bases[1].z, 0, 100); const op = $('manOpen')(Cm, 'flk', { T: 100 }, 'sys', {}); q.job = 'line';
    $('opTake')(op, q, { k: 'move', ri: 0, s: 700, x: S.T.bases[1].x, z: S.T.bases[1].z + 300, R: 12, wp: $('polyOf')([{ x: q.men[0].x, z: q.men[0].z }, { x: S.T.bases[1].x, z: S.T.bases[1].z + 300 }]), quiet: 1, fast: 1 });
    const u = C.addUnit('truck', t, 0, 0, null, false, 0, 300, 5, 0); $('manRides')(Cm); ok(!q.rd && !u.trip, 'a short walk gets no ride'); }
  /* a 120 s battle at map 4 with the economy off and the ride on: no exception */
  { const B = H.load({ seed: 77, mapv: 4 }), S = B.newState(era, B.$('ERAS')[era].sides[0].fighter, { cls: 'plane' }); let err = null; try { B.run(120, null, 1 / 20); } catch (e) { err = e; }
    ok(!err && !H.nan(S), 'a 120 s solo battle runs clean' + (err ? ' ' + err.stack : '')); }
}
done();
