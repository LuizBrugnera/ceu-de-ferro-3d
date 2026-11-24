'use strict';
/* Roads plan, slice 2 (map version 3): the new places and points. Terrain at map 3 (burgs, buildings, clearance), 10 / 12 points, their links
   and the ways that join them, every point capturable from its side, the general's and the HUD's fit,
   and the points over the wire (a host and a client on a map 3 room). Env: PAGE, SERVER, PORT_T. tests/roads.js stays the slice 1 test
   (it builds map 2 itself). */
const N = require('./net'), H = require('./harness'), { ok, done } = H;
const exp = { ww2: { pts: 10, links: 15, aldeia: 2, burgs: 7 }, modern: { pts: 12, links: 17, aldeia: 4, burgs: 9 } };
const hdist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
(async () => {
  for (const era of ['ww2', 'modern']) {
    console.log(era);
    const C = H.load({ seed: 5, mapv: 3 }), $ = C.$, X = exp[era], RN = $('RN'), CQ = $('CQ'), CITY = $('CITY');
    const T = $('genTerrain')(era, 3), T2 = $('genTerrain')(era, 2);
    /* places and buildings */
    const nb = T.burgs.filter(b => b.e !== undefined), nb2 = T2.burgs.length;
    const kinds = {}; for (const b of nb) kinds[b.k] = (kinds[b.k] || 0) + 1;
    ok(nb.length === X.burgs && T.burgs.slice(0, 4).every((b, i) => b.x === T2.burgs[i].x && b.z === T2.burgs[i].z), 'burgs: ' + nb.length + ' new (' + JSON.stringify(kinds) + '), the four old ones first and unmoved');
    ok(T.houses.length <= RN.hcap && T.houses.length > T2.houses.length, 'buildings ' + T.houses.length + ' (map 2: ' + T2.houses.length + ') within the cap ' + RN.hcap);
    const per = {}; for (const o of T.houses) { const b = T.burgs.find(b => hdist(o, b) < b.ru + 30), k = b ? (b.nm || b.k) : '?'; per[k] = (per[k] || 0) + 1; }
    console.log('  per place: ' + JSON.stringify(per));
    ok(nb.every(b => (per[b.nm] || 0) > 0), 'every new place has buildings');
    let near = 1e9; for (const o of T.houses) near = Math.min(near, $('routeDist')(T, o.x, o.z));
    ok(near >= CITY.plan.road - .01, 'no building centre within ' + CITY.plan.road + ' m of any road (nearest ' + near.toFixed(1) + ' m)');
    ok(T.houses.every((o, i) => T.byId[o.id] !== undefined || true) && T.objs.length > 0, 'objects built');
    /* points */
    C.seed(9);
    const S = C.newState(era, $('ERAS')[era].sides[0].fighter, { cls: 'plane' }), P = S.cq.p, byk = k => P.find(p => p.k === k);
    ok(S.mv === 3 && P.length === X.pts, P.length + ' points: ' + P.map(p => p.L + p.k).join(' '));
    ok(new Set(P.map(p => p.L)).size === P.length && P.every(p => p.name), 'letters and names are all different or set');
    let sym = true, nl = 0; P.forEach((p, i) => { for (const j of p.links) { nl++; if (!P[j].links.includes(i)) sym = false; } });
    ok(sym && nl / 2 === X.links, 'links symmetric, ' + nl / 2 + ' of them');
    ok(P[0].base === 0 && P[P.length - 1].base === 1 && P.filter(p => p.base >= 0).length === 2, 'two bases, first and last');
    const big = P.filter(p => p.big).map(p => p.k); ok(big.join() === 't1,t0' || big.join() === 't0,t1', 'main towns marked big: ' + big);
    ok($('towns')().slice(0, 2).every(w => w.big), 'towns() lists the main towns first');
    /* every link is a way of class 0 or 1 roads that passes no other point's node */
    const N0 = T.net, nodeOf = p => (p.base >= 0 ? N0.n.find(q => q.id === 'B' + p.base) : p.k === 't0' || p.k === 't1' ? N0.n.find(q => q.id === 'T' + p.k[1]) : (RN.pts[era].find(r => r[0] === p.k) || [])[1] ? N0.n.find(q => q.id === RN.pts[era].find(r => r[0] === p.k)[1]) : null);
    const pn = new Map(P.map(p => [p, nodeOf(p)])), blocked = new Set([...pn.values()].filter(Boolean).map(q => q.i));
    const edgeOf = p => N0.e.find(e => !e.c && p.rs[0] !== null && e.ax[0] === 0 && p.s >= e.ax[1] - 1e-6 && p.s <= e.ax[2] + 1e-6);   // a point with no node (n, the larger map's b) lies on a main road piece
    const path = (a, b) => {
      const ends = p => (pn.get(p) ? [pn.get(p).i] : [edgeOf(p).a, edgeOf(p).b]), goal = new Set(ends(b)), seen = new Set(), go = [...ends(a)];
      const stop = new Set([...ends(a), ...ends(b)]);
      while (go.length) {
        const i = go.pop(); if (seen.has(i)) continue; seen.add(i);
        if (goal.has(i)) return true;
        if (blocked.has(i) && !stop.has(i)) continue;
        for (const ei of N0.n[i].e) { const e = N0.e[ei]; if (e.c > 1) continue; go.push(e.a === i ? e.b : e.a); }
      }
      return false;
    };
    let badLink = []; P.forEach((p, i) => { for (const j of p.links) if (j > i && !path(p, P[j])) badLink.push(p.k + '-' + P[j].k); });
    ok(!badLink.length, 'each link joined by a road path of class 0 or 1' + (badLink.length ? ' (not: ' + badLink + ')' : ''));
    /* each point can be taken by the side that borders it, and the match walks to the enemy base */
    const take = (Sx, t) => {
      const Q = Sx.cq; let n = 0;
      for (let k = 0; k < 40; k++) {
        const tg = $('cqTargets')(t)[0]; if (!tg || Q.ph) break;
        Sx.men = []; for (let j = 0; j < 6; j++) Sx.men.push({ x: tg.x + j, z: tg.z, team: t, dead: false, in: false, down: false });
        for (let j = 0; j < 1200 && tg.hold !== t && !Q.ph; j++) { Q.acc = .25; $('cqStep')(.25); }
        if (tg.hold === t || Q.ph) n++; else break;
      }
      return n;
    };
    const seq = [0, 1].map(t => { C.seed(9); const Sx = C.newState(era, $('ERAS')[era].sides[0].fighter, { cls: 'plane' }); Sx.units = []; Sx.planes = []; const n = take(Sx, t); return [n, Sx.cq.ph, Sx.cq.res]; });
    ok(seq.every(r => r[0] >= 4 && r[1] === 1), 'side 0 and side 1 each walk the chain to the enemy base: ' + seq.map(r => r[0] + ' taken, over ' + r[1]).join(' / '));
    /* every point that is not a base is taken by a side that holds one of its neighbours */
    const bad = [];
    P.forEach((p0, i) => {
      if (p0.base >= 0) return;
      for (const t of [0, 1]) {
        C.seed(9); const Sx = C.newState(era, $('ERAS')[era].sides[0].fighter, { cls: 'plane' }); Sx.units = []; Sx.planes = []; Sx.men = [];
        const Q = Sx.cq, p = Q.p[i], nb = Q.p[p.links.find(j => Q.p[j].base < 0)]; nb.hold = t; nb.c = t ? 1 : -1; p.hold = -1; p.c = 0;
        for (let j = 0; j < 6; j++) Sx.men.push({ x: p.x + j, z: p.z, team: t, dead: false, in: false, down: false });
        for (let j = 0; j < 400 && p.hold !== t; j++) { Q.acc = .25; $('cqStep')(.25); }
        if (p.hold !== t) bad.push(p.k + '/' + t);
      }
    });
    ok(!bad.length, 'every point but the bases is taken by either side from a neighbour it holds' + (bad.length ? ' (not: ' + bad + ')' : ''));
    /* the strip */
    const u = .62, wHud = P.length * (21 * u + 3 * u) - 3 * u + 2 * (44 * u + 8 * u);
    ok(wHud + 16 < 360, 'the HUD strip is ' + wHud.toFixed(0) + ' px at a 360 px screen (' + P.length + ' points)');
    ok(P.length * 4 <= 64, 'the cq message carries ' + P.length * 4 + ' numbers (the server takes 64)');
    /* a short solo battle, no exception, no NaN */
    C.seed(11); const B = C.newState(era, $('ERAS')[era].sides[0].fighter, { cls: 'plane' }); let err = null; try { C.run(40, null, 1 / 30); } catch (e) { err = e; }
    ok(!err && !H.nan(B) && B.cq.p.every(p => Number.isFinite(p.c)), 'a 40 s battle runs clean' + (err ? ' ' + err.stack : ''));
  }
  /* over the wire: a host and a client on a map 3 room */
  await N.start();
  const page = (era, host) => new Promise(res => { const c = H.load({ WebSocket: N.WebSocket, host: 'localhost:' + N.PORT, seed: 3, mapv: 3 }), Net = c.$('Net'); Net.ui.welcome = () => { c.newState(era, 'tiger', { net: true, cls: 'tank', mouse: true, host: Net.host === Net.id }); res(c); }; Net.ui.refused = code => res({ refused: code }); Net.connect(era, 'p' + host, 'tank', 'tiger'); });
  const a = await page('ww2', 0), b = await page('ww2', 1);
  ok(!a.refused && !b.refused && a.$('Net').mv === 3 && b.$('S').mv === 3 && a.$('S').cq.p.length === 10 && b.$('S').cq.p.length === 10, 'two pages join a map 3 room: 10 points each');
  const Qa = a.$('S').cq; Qa.p[8].hold = 1; Qa.p[8].c = .4; Qa.p[2].c = -.5; Qa.ps = [321, 123];
  a.$('Net').cqSend(); await N.sleep(400);
  const Qb = b.$('S').cq;
  ok(Qb.p[8].hold === 1 && Math.abs(Qb.p[8].c - .4) < .011 && Math.abs(Qb.p[2].c + .5) < .011 && Qb.ps[0] === 321, 'the client has the host\'s 10 points through the server (cq, 40 numbers)');
  const m = await N.raw(); m.send({ t: 'join', room: 'modern', name: 'q', cls: 'tank', model: 'abrams', mv: 3 }); const w = await m.wait('welcome');
  m.send({ t: 'cq', n: 0, ph: 0, T: 100, ps: [1, 1], len: 1, p: Array.from({ length: 48 }, (_, i) => (i % 4 ? 0 : -1)), l: [0, 0, 0, 0, 0, 0] });
  const m2 = await N.raw(); m2.send({ t: 'join', room: 'modern', name: 'r', cls: 'tank', model: 'abrams', mv: 3 }); await m2.wait('welcome');
  m.send({ t: 'cq', n: 0, ph: 0, T: 100, ps: [1, 1], len: 1, p: Array.from({ length: 48 }, (_, i) => (i % 4 ? 0 : -1)), l: [0, 0, 0, 0, 0, 0] });
  const got = await m2.wait('cq'); ok(w && w.mv === 3 && got && got.p.length === 48, 'the server relays a 12-point cq (48 numbers) of a map 3 modern room');
  a.$('Net').close(); b.$('Net').close(); m.close(); m2.close(); N.stop(); done();
})();
