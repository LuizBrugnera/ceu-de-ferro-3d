'use strict';
/* Map version 5: the seat town beside each main base (CITY.plan.seat) and its lots, and the economy's sites on them: set there by the
   AI and by a click inside a lot, a fixed AA on the square or on a roof, a supply base on the depot lot, and disguised (ECO.lot): a plain
   building to the other side until an enemy on the ground or in the air sees it within 400 m, or a reconnaissance drone or team passes
   over it; until then it is not spotted, not remembered, not in ecoFoe and not a target. A guest is told in the eco row. Map version 4
   is planned as before. BEFORE=<page> compares version 4 with another copy of the page (default: the page at commit 71157f5, the last
   one before map version 5; skipped when git is missing). PAGE=<page> */
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
const H = require('./harness'), { ok, done } = H;
const hd = (a, b) => Math.hypot(a.x - b.x, a.z - b.z), J = v => JSON.stringify(v);
const fresh = (era, seed) => { const C = H.load({ seed: seed || 41, eco: true, mapv: 5 }), S = C.newState(era, C.$('ERAS')[era].sides[0].fighter, { cls: 'plane' }); return { C, S, $: C.$ }; };
/* a vehicle of side f that sees e from between r0 and r1 m (null if none) */
function seer(C, e, f, r0, r1, kind, model) {
  const sees = C.$('sees');
  for (let r = r0; r <= r1; r += 10) for (let a = 0; a < 6.3; a += .2) {
    const u = C.addVehicle(kind || 'tank', model || 'pz4', f, e.x + Math.cos(a) * r, e.z + Math.sin(a) * r, 0); u.inv = 1e9;
    if (sees(u, e)) return u; u.dead = true;
  }
  return null;
}

console.log('-- the map --');
for (const era of ['ww2', 'modern']) {
  const C = H.load({ seed: 3, mapv: 5 }), $ = C.$, P = $('CITY').plan, Q = P.seat, T = $('genTerrain')(era, 5), T4 = $('genTerrain')(era, 4);
  const seats = T.burgs.filter(b => b.seat !== undefined);
  ok(seats.length === 2 && seats[0].team === 0 && seats[1].team === 1, era + ': a seat town for each base');
  for (const s of seats) {
    const B = T.bases[s.team], q = $('railT')(T, s.x, s.z), r = T.routes[q.ri], along = s.team ? q.s : r.len - q.s, mine = T.houses.filter(o => hd(o, s) < s.ru + 30);
    ok(q.d < 1 && q.ri < 2 && along >= Q.d[0] && along <= Q.d[1], '  side ' + s.team + ': on main road ' + q.ri + ', ' + (along | 0) + ' m along it from the base (' + Q.d.join('-') + ')');
    ok(s.ru === P.town[0] && s.rv === P.town[1] && s.k === 'town', '  the size of a town (' + s.ru + ' x ' + s.rv + ')');
    ok(mine.length >= 60 && mine.length <= Q.cap + 12, '  ' + mine.length + ' buildings (its own share: at most ' + Q.cap + ', a few of a neighbour may stand inside its circle)');
    ok(mine.every(o => Math.min(hd(o, T.bases[0]), hd(o, T.bases[1])) >= Q.base), '  none nearer the bases than ' + Q.base + ' m');
    ok(T.burgs.every(b => b === s || hd(b, s) > b.ru + s.ru), '  clear of every other place');
    const L = T.lots.filter(l => l.team === s.team);
    const open = L.filter(l => !(l.hi >= 0)), roof = L.filter(l => l.hi >= 0);
    ok(L.length === Q.lots.length && ['fab', 'pow', 'aa', 'dep'].every(k => L.some(l => l.k === k)) && L.every(l => hd(l, s) < s.ru), '  ' + L.length + ' lots in it: ' + L.map(l => l.k + (l.hi >= 0 ? ' (roof)' : '')).join(', '));
    ok(open.every(l => !T.houses.some(o => hd(o, l) < o.r + Math.min(l.w, l.d) / 2 - 2)) && L.every(l => !T.objs.some(o => o.k === 'tree' && hd(o, l) < Math.hypot(l.w, l.d) / 2)), '  the lots are empty: no building, no tree');
    ok(roof.length === 1 && roof[0].k === 'aa' && T.houses[roof[0].hi].B.K.roof === 'flat' && hd(T.houses[roof[0].hi], roof[0]) < 1 && T.houses.filter(o => hd(o, roof[0]) < o.r + Math.min(roof[0].w, roof[0].d) / 2 - 2).length === 1, '  the roof lot: one flat-roofed block in its middle');
  }
  const other = T.houses.filter(o => !seats.some(s => hd(o, s) < s.ru + 30));
  ok(other.every(o => Math.min(hd(o, T.bases[0]), hd(o, T.bases[1])) >= P.base), era + ': every other building keeps ' + P.base + ' m from the bases');
  ok(other.length <= $('RN').hcap + 40, era + ': the other places keep their cap (' + other.length + ' buildings, RN.hcap ' + $('RN').hcap + ')');
  ok(!T4.burgs.some(b => b.seat !== undefined) && T4.lots.length === 0, era + ': map version 4 has no seat and no lot');
  const D = H.load({ seed: 9, mapv: 5 }), T2 = D.$('genTerrain')(era, 5);
  ok(J(T2.houses.map(o => [o.x, o.z, o.B.t])) === J(T.houses.map(o => [o.x, o.z, o.B.t])) && J(T2.lots) === J(T.lots), era + ': the same on every client (another load, another random seed)');
}
{ let before = process.env.BEFORE;
  if (!before) try { const f = path.join(os.tmpdir(), 'cdf-seat-before-' + process.pid + '.html'); fs.writeFileSync(f, cp.execSync('git show 71157f5:"Céu de Ferro 3D.html"', { cwd: H.ROOT, maxBuffer: 1 << 26 })); before = f; } catch (e) { before = null; }
  if (before && fs.existsSync(before)) {
    for (const era of ['ww2', 'modern']) {
      const mm = v => Math.round(v * 1000), sig = page => { const C = H.load({ seed: 3, mapv: 4, page }); const T = C.$('genTerrain')(era, 4); return J([T.houses.map(o => [mm(o.x), mm(o.z), o.B.t, o.h]), T.objs.length, T.burgs.length]); };   // to the millimetre: a reordered sum moves a house by 1e-12 m
      ok(sig(before) === sig(undefined), era + ': map version 4 is planned exactly as before (buildings, objects, places)');
    }
    if (!process.env.BEFORE) fs.unlinkSync(before);
  } else console.log('  skip  no page to compare map version 4 with');
}

console.log('-- the economy on the lots --');
{ const { C, S, $ } = fresh('ww2'), E = S.eco, ECO = $('ECO'), L = S.T.lots;
  for (const t of [0, 1]) for (const k of ['pow', 'fab']) { const e = E.l.find(e => e.team === t && e.k === k); ok(e && e.lot >= 0 && L[e.lot].k === k && L[e.lot].team === t, 'side ' + t + ' starts with its ' + k + ' on a lot of its seat town'); }
  const free = L.find(l => l.team === 0 && l.k === 'fab' && !E.l.some(e => hd(e, l) < 5)), sp = $('ecoSpot')(0, 'fab');
  ok(sp.some(s => hd(s, free) < 1 && s.why === ECO.tx.why.lot), 'ecoSpot offers the free factory lot, "' + ECO.tx.why.lot + '"');
  ok($('ecoWhy')(0, 'fab', free.x, free.z, free.a) === '' && $('ecoWhy')(0, 'fab', free.x + 30, free.z + 30, free.a) !== '', 'on the lot a factory may stand (60 m from the other one), off it the usual rules refuse');
  ok($('ecoWhy')(1, 'fab', free.x, free.z, free.a) === 'far', 'the other side may not use it');
  const r = C.ecoCmd(0, { c: 'build', k: 'fab', x: free.x + 9, z: free.z - 6 }, 'ai'), s = E.l.find(e => e.id === r.id);
  ok(r.ok && s && hd(s, free) < .01 && Math.abs(s.a - free.a) < 1e-9 && s.lot >= 0, 'a build order inside a free lot is set on the lot, as the block lies');
  const pow = E.l.find(e => e.team === 0 && e.k === 'pow' && e.lot >= 0); pow.gd.aa = 1; const d0 = E.d[0]; (d0.res.aaf || (d0.res.aaf = [])).push('hq');
  C.run(1);
  const aa = S.units.find(u => !u.dead && u.fixed && u.kind === 'aa' && u.team === 0 && u.es === pow), sq = L.find(l => l.team === 0 && l.k === 'aa');
  ok(aa && hd(aa, sq) < 5, 'a fixed AA asked for at a site in the town stands on the town\'s square (' + (aa ? hd(aa, sq).toFixed(1) : '-') + ' m)');
  aa.dead = true; const busy = C.addVehicle('truck', null, 0, sq.x, sq.z, 0); busy.fixed = true; busy.inv = 1e9; d0.res.aaf.push('hq');
  C.run(1);
  const rl = L.find(l => l.team === 0 && l.k === 'aa' && l.hi >= 0), ho = S.T.houses[rl.hi], ra = S.units.find(u => !u.dead && u.fixed && u.kind === 'aa' && u.team === 0 && u.es === pow);
  ok(ra && hd(ra, rl) < 5 && Math.abs(ra.y - (ho.y + ho.hh)) < .01 && ra.y > $('hgt')(ra.x, ra.z) + 5, 'with the square taken, the next one stands on the roof lot\'s block (' + (ra ? (ra.y - $('hgt')(ra.x, ra.z)).toFixed(1) : '-') + ' m up)');
  $('bldDown')(ho, true);
  ok(Math.abs(ra.y - $('hgt')(ra.x, ra.z)) < .01, 'when the block falls, the AA comes down with it');
  ok(H.nan(S) === null, 'no NaN');
}

{ const { C, S, $ } = fresh('ww2'), dep = S.T.lots.find(l => l.team === 0 && l.k === 'dep'), O = $('aiSite')(0);
  ok(dep && O && hd(O, dep) < .01 && Math.abs(O.a - dep.a) < 1e-9, 'the AI picks the seat town\'s depot lot for its next supply base');
  ok($('supLot')(0, dep.x + 10, dep.z - 6) === dep && !$('supLot')(1, dep.x, dep.z) && !$('supLot')(0, dep.x + 40, dep.z + 40), 'a point inside the lot is on side 0\'s depot lot; side 1 has none there, and outside it there is none');
  let b = null; C.run(30, () => !(b = S.sup.find(b => b.team === 0)));
  ok(b && hd(b, dep) < .01 && Math.abs(b.a - dep.a) < 1e-9, 'its engineers set side 0\'s supply base on the lot, as the block lies');
  ok($('siteWhy')(0, dep.x, dep.z, dep.a) === 'base', 'the lot takes one base');
  ok(H.nan(S) === null, 'no NaN');
}

console.log('-- disguised until identified --');
{ const { C, S, $ } = fresh('ww2'), E = S.eco, fab = E.l.find(e => e.team === 1 && e.k === 'fab'), seen = $('ecoSeen');
  for (const o of S.units.concat(S.men, S.planes)) if (o.team === 0) o.dead = true;
  ok(fab.lot >= 0 && !fab.idf, 'side 1\'s factory is on a lot, not identified');
  const far = seer(C, fab, 0, 440, 560); ok(!!far, 'a tank of side 0 sees it from ' + (far ? hd(far, fab) | 0 : '-') + ' m (inside the 600 m a plain site in town is spotted at)');
  seen();
  const list = []; $('bldTargets')(far, list);
  ok(!fab.idf && !$('spotted')(fab) && !E.d[0].kn[fab.id] && !$('ecoFoe')(0).includes(fab) && !list.includes(fab) && !C.ecoView(0).foe.some(f => f.id === fab.id), 'beyond 400 m it is a building: not identified, not spotted, not remembered, not in ecoFoe, not a target');
  ok(C.ecoCmd(0, { c: 'strike', id: fab.id }, 'ai').why === 'unknown', 'a strike on it is refused: unknown');
  fab.lot = -1; fab.seenT = -1e9; seen(); ok($('spotted')(fab) && !!E.d[0].kn[fab.id], 'the same site off a lot would have been spotted from there');
  fab.lot = 0; delete E.d[0].kn[fab.id]; fab.seenT = -1e9; S.t += 5; far.dead = true;
  const nearT = seer(C, fab, 0, 220, 390); ok(!!nearT, 'a tank of side 0 sees it from ' + (nearT ? hd(nearT, fab) | 0 : '-') + ' m');
  seen();
  const l2 = []; $('bldTargets')(nearT, l2);
  ok(fab.idf && $('spotted')(fab) && !!E.d[0].kn[fab.id] && $('ecoFoe')(0).includes(fab) && l2.includes(fab), 'within 400 m it is identified: spotted, remembered, in ecoFoe, a target');
  ok(S.glog.l[0].some(e => e.s.startsWith('Identificada fábrica disfarçada')), 'side 0\'s log says it was identified');
  const pw = E.l.find(e => e.team === 1 && e.k === 'pow'), pwIn = hd(nearT, pw) < 400 && $('sees')(nearT, pw);
  ok(!$('ecoHid')(fab, 0) && $('ecoHid')(pw, 0) === !pwIn, 'each site is identified on its own: the usina ' + (hd(nearT, pw) | 0) + ' m from the tank is ' + (pwIn ? 'identified too' : 'still hidden'));
  const rows = $('ecoRows')(), row = rows.find(r => r[0] === fab.id), mine = rows.find(r => r[1] === 1 && r[2] === $('ESK').indexOf('mine'));
  ok(row.length === 10 && row[9] === 1 && mine.length === 9, 'the eco row of a site on a lot says whether it is identified; a site off the lots keeps the 9 fields');
  /* a guest: the same map, told by the host */
  const G = fresh('ww2'), GS = G.S; GS.net = true; GS.host = false;
  const hostRows = $('ecoRows')().map(r => r.slice()); hostRows.find(r => r[0] === fab.id)[9] = 0;
  G.$('Net').rx.eco({ e: hostRows }); const gf = GS.eco.l.find(e => e.id === fab.id);
  ok(gf && gf.lot >= 0 && !gf.idf && !G.$('ecoFoe')(0).includes(gf), 'a guest finds the lot itself and keeps it hidden while the host says not identified');
  hostRows.find(r => r[0] === fab.id)[9] = 1; G.$('Net').rx.eco({ e: hostRows });
  ok(gf.idf && G.$('ecoFoe')(0).includes(gf), 'and identified when the host says so');
  ok(H.nan(S) === null, 'no NaN');
}
{ const { C, S, $ } = fresh('ww2'), E = S.eco, fab = E.l.find(e => e.team === 1 && e.k === 'fab'), seen = $('ecoSeen'), sees = $('sees'), dist = $('dist'), hgt = $('hgt');
  for (const o of S.units.concat(S.men, S.planes)) if (o.team === 0) o.dead = true;
  const fly = (lo, hi) => { for (let r = lo; r <= hi; r += 10) for (let a = 0; a < 6.3; a += .3) for (const up of [80, 150, 250]) {
    const x = fab.x + Math.cos(a) * r, z = fab.z + Math.sin(a) * r, p = C.addPlane(C.$('ERAS').ww2.sides[0].fighter, 0, x, hgt(x, z) + up, z, 0, false); p.inv = 1e9;
    if (dist(p, fab) >= lo && dist(p, fab) <= hi && sees(p, fab)) return p; p.dead = true;
  } return null; };
  const hiP = fly(430, 560); ok(!!hiP, 'a plane of side 0 sees side 1\'s factory from ' + (hiP ? dist(hiP, fab) | 0 : '-') + ' m');
  seen(); ok(!fab.idf && !$('ecoFoe')(0).includes(fab), 'beyond 400 m the plane does not identify it');
  hiP.dead = true; S.t += 5; fab.seenT = -1e9;
  const loP = fly(200, 380); ok(!!loP, 'a plane of side 0 sees it from ' + (loP ? dist(loP, fab) | 0 : '-') + ' m, flying low');
  seen(); ok(fab.idf && $('ecoFoe')(0).includes(fab), 'within 400 m the plane identifies it');
}
{ const { C, S, $ } = fresh('modern', 43), E = S.eco, pow = E.l.find(e => e.team === 1 && e.k === 'pow'), fab = E.l.find(e => e.team === 1 && e.k === 'fab'), seen = $('ecoSeen'), hgt = $('hgt');
  for (const o of S.units.concat(S.men)) if (o.team === 0) o.dead = true;
  ok(pow.lot >= 0 && fab.lot >= 0 && !pow.idf && !fab.idf, 'modern: side 1\'s usina and factory on lots, hidden');
  const dr = $('addDrone')('rec', 0, pow.x + 260, hgt(pow.x + 260, pow.z) + 80, pow.z, 0, null, {});
  seen(); ok(!pow.idf, 'a reconnaissance drone 260 m off does not identify it');
  dr.x = pow.x + 90; dr.z = pow.z + 40; seen(); ok(pow.idf && !fab.idf, 'passing over it (' + (hd(dr, pow) | 0) + ' m) it does');
  dr.dead = true;
  const m = S.men.find(o => o.team === 0), sq = { job: 'line', ord: null }, sees = $('sees'); m.dead = false; m.in = null; m.sq = sq;
  let at = null; for (let a = 0; a < 6.3 && !at; a += .1) { m.x = fab.x + Math.cos(a) * 120; m.z = fab.z + Math.sin(a) * 120; m.y = hgt(m.x, m.z); if (!sees(m, fab)) at = a; }
  ok(at !== null, 'a soldier of side 0 stands 120 m from the factory, out of its sight');
  S.t += 5; seen(); const plain = fab.idf;
  sq.job = 'rec'; S.t += 5; seen();
  ok(!plain && fab.idf, 'he identifies it when he is of a reconnaissance team (passing over it), not as a plain rifleman');
  ok(H.nan(S) === null, 'no NaN');
}
done();
