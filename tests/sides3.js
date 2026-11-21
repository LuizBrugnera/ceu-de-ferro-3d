'use strict';
/* three sides (EUA × Rússia × Insurgentes, the current front on map 9): the "how to test" lists of the P0..P9 packages (docs/nao-testado/cf-3l-*),
   checked on a three-sided match and against two sides. Quick: no long battle (SECS=<s> runs the AI × AI × AI match longer, default 20 s).
   - P0 the helpers (SIDES, ALL, foes, foeBase, S.rel and an ally in it)
   - P1 the map (three bases, the roads' ends, the seat at HS2, 17 points, side 2's deposits on flat dry ground; two sides keep three roads)
   - P2 the conquest (the side with the most weight takes a point by its margin over the next, a side out by tickets and by its base, the placing)
   - P3 the sightings per side (one side sees, the other does not; ecoHid by the side's bit; a mine's suspicion to the side that ran on it)
   - P4 the faction (names, no aviation, the anti-air on technicals), P6a (the population caps, the planning turn, each side's roads),
     P6b/P6c (the mn* and ls* helpers), P7 (the doctrine only for the Insurgents), P8 (the town's militia for the right side), P9 (the analytics header) */
const H = require('./harness'), { ok, done } = H, SECS = +process.env.SECS || 20;
const near = (a, b, d) => Math.hypot(a.x - b.x, a.z - b.z) < d;

console.log('-- P0: the helpers with three sides --');
const C = H.load({ seed: 7, mapv: 9, eco: 1, lg: 1, ana: 1 }), $ = C.$;
const S = C.watch('modern', { n: 3 });
{
  ok(S.N === 3 && S.fac.join() === '0,1,2', 'the current front opens with three sides (S.N ' + S.N + ', S.fac ' + S.fac + ')');
  ok($('SIDES()').join() === '0,1,2' && $('ALL()') === 7, 'SIDES() [0, 1, 2], ALL() 7');
  ok($('isSide(2)') && !$('isSide(3)') && !$('isSide(-1)'), 'isSide: 2 is a side, 3 and -1 are not');
  ok(S.rel.length === 3 && S.rel.every((r, a) => r.every((v, b) => v === (a === b ? 'ally' : 'foe'))), 'S.rel 3 × 3, everyone against everyone');
  ok($('foes(0)').join() === '1,2' && $('foes(2)').join() === '0,1', 'foes(0) [1, 2], foes(2) [0, 1]');
  const B = S.base, fb = $('foeBase(0)'), d1 = Math.hypot(B[1].x - B[0].x, B[1].z - B[0].z), d2 = Math.hypot(B[2].x - B[0].x, B[2].z - B[0].z);
  ok(fb === (d1 < d2 ? B[1] : B[2]), 'foeBase(0) is the enemy base nearest base 0');
  ok($('foeBase')(0, B[2].x + 50, B[2].z) === B[2] && $('foeBase')(2, B[1].x, B[1].z + 50) === B[1], 'foeBase(t, x, z) is the enemy base nearest x, z');
  S.rel[0][1] = S.rel[1][0] = 'ally';
  ok($('foes(0)').join() === '2' && $('mnFoes(0)').join() === '2' && $('lsFoes(0)').join() === '2' && $('civFoes(0)').join() === '2', 'with 0 and 1 allied: foes, mnFoes, lsFoes and civFoes of 0 are [2]');
  ok($('foe')(0, 1) === false && $('foe')(0, 2) === true, 'foe(a, b) on side numbers reads S.rel');
  S.rel[0][1] = S.rel[1][0] = 'foe';
}

console.log('-- P1: the map of three sides --');
{
  const T = S.T, ends = T.routes.map(r => (r.ends || []).join('')).join(' ');
  ok(T.bases.length === 3, 'three bases on the map');
  ok(ends === '01 01 01 02 12', 'the roads\' ends [0,1] × 3, [0,2] (R_EI), [1,2] (R_RI): ' + ends);
  const hs2 = T.net.n.find(q => q.id === 'HS2'), seat = T.burgs.find(b => b.seat === 2);
  ok(!!seat && !!hs2 && near(seat, hs2, 300), 'side 2\'s seat town is at HS2');
  ok(T.burgs.some(b => b.nm === 'Vila do Carrascal'), 'the new village K (Vila do Carrascal)');
  for (const ri of [3, 4]) {
    const R = T.routes[ri], m = $('routeAt')(R, R.len / 2);
    ok(R.len > 1000 && Number.isFinite(m.x), 'road ' + ri + ' (' + R.id + ') has a length (' + Math.round(R.len) + ' m) and a middle');
  }
  ok($('myRoutes(0)').join() === '0,1,2,3' && $('myRoutes(1)').join() === '0,1,2,4' && $('myRoutes(2)').join() === '3,4', 'each side\'s roads: 0 [0..3], 1 [0,1,2,4], 2 [3,4]');
  ok(S.cq.p.length === 17 && [0, 1, 2].every(t => S.cq.p.filter(p => p.base === t).length === 1), '17 points, one main base point a side');
  const dep2 = S.eco.dep.filter(d => d.half === 2), WL = S.T.WL, slope = $('BLD').slope, SITE5 = $('SITE5'), hgt = $('hgt');
  const dry = d => SITE5.every(([i, j]) => hgt(d.x + i * 6, d.z + j * 6) >= WL + .6), flat = d => { const h = SITE5.map(([i, j]) => hgt(d.x + i * 6, d.z + j * 6)); return Math.max(...h) - Math.min(...h) <= slope * 12; };
  ok(dep2.length === 4 && dep2.every(d => dry(d) && flat(d) && !$('onRoadW')(d.x, d.z, $('BLD').road + 7)), 'four deposits of side 2, all on flat dry ground off the roads (ecoFlat\'s ground rules; a mine built on one is its own obstacle)');
  const C2 = H.load({ seed: 7, mapv: 9 }), S2 = C2.watch('modern', { n: 2 });
  ok(S2.N === 2 && S2.T.bases.length === 2 && S2.T.routes.map(r => (r.ends || [0, 1]).join('')).join() === '01,01,01', 'two sides on map 9: two bases, three roads [0, 1]');
}

console.log('-- P2: the conquest with three sides --');
{
  const Q = S.cq, p = Q.p.find(q => q.base < 0 && q.hold < 0) || Q.p.find(q => q.base < 0), pi = Q.p.indexOf(p);
  ok(Q.tk.length === 3 && Q.lost.length === 3 && Q.out.length === 3, 'tickets, losses and out a side');
  // the weights: side 1 leads side 2 by 1, side 0 behind; the point is free to take for whoever is linked (force it linked to all three)
  const links = p.links; p.links = Q.p.map((q, i) => i).filter(i => i !== pi); const hold0 = Q.p.map(q => q.hold);
  for (const q of Q.p) if (q !== p && q.base < 0) q.hold = -1;
  Q.p.filter(q => q.base >= 0).forEach(q => { q.hold = q.base; });
  p.hold = -1; p.cap = -1; p.c = 0;
  const men = S.men; S.men = []; const units = S.units; S.units = [];
  const put = (t, n) => { for (let i = 0; i < n; i++) S.men.push({ team: t, x: p.x + i, z: p.z, man: 1 }); };
  put(0, 2); put(1, 5); put(2, 4);
  Q.acc = 1; $('cqStep')(0);
  ok(p.cap === 1 && p.c > 0, 'a point weighed 2 / 5 / 4: side 1 (the most weight) starts taking it (cap ' + p.cap + ', c ' + p.c.toFixed(3) + ')');
  const c1 = p.c; S.men = []; put(1, 6); put(2, 4); p.c = 0; p.cap = -1; Q.acc = 1; $('cqStep')(0);
  ok(Math.abs(p.c - 2 * c1) < 1e-9, 'its pace is the margin over the second (margin 2 goes twice as fast as margin 1)');
  S.men = men; S.units = units; p.links = links; Q.p.forEach((q, i) => { q.hold = hold0[i]; });
}
{
  const C3 = H.load({ seed: 3, mapv: 9 }), S3 = C3.watch('modern', { n: 3 }), Q = S3.cq; C3.run(2, null, 1 / 20);
  const held2 = Q.p.filter(p => p.hold === 2 && p.base < 0);
  Q.tk[2] = 0; Q.acc = 1; C3.$('cqStep')(0);
  ok(Q.out[2] === 1 && C3.$('cqOut(2)') && !Q.ph, 'side 2 out of tickets is out (out[2] ' + Q.out[2] + '), the match goes on');
  ok(held2.every(p => p.hold === -1) && S3.cmd[2].out === 1, 'its ' + held2.length + ' points went neutral and its director stopped');
  ok(S3.feed.some(f => /foi eliminado/.test(f.text)), 'the feed says it: ' + (S3.feed.find(f => /eliminado/.test(f.text)) || {}).text);
  ok(!C3.$('cqFree(2, "inf")'), 'a side that is out gets nothing more (cqFree false)');
  const b1 = Q.p.find(p => p.base === 1); b1.hold = 0; b1.c = 1; Q.acc = 1; C3.$('cqStep')(0);
  ok(Q.out[1] === 3 && Q.ph === 1 && Q.res[0] === 0, 'side 1\'s main base taken: it is out (why 3) and side 0, the last standing, wins');
  ok(Q.place.join() === '0,1,2', 'the placing: the winner, then the last out, then the first out (' + Q.place + ')');
}
{
  const C4 = H.load({ seed: 3, mapv: 9 }), S4 = C4.watch('modern', { n: 3 }); S4.me = 2; C4.run(1, null, 1 / 20);
  const Q = S4.cq; Q.tk[1] = 0; Q.acc = 1; C4.$('cqStep')(0); Q.tk[2] = 0; Q.acc = 1; C4.$('cqStep')(0);
  ok(Q.ph === 1 && Q.place.join() === '0,2,1' && /Derrota · 2º lugar/.test(String(S4.over || S4.result || S4.endText || JSON.stringify(S4.banner || ''))) || Q.place.join() === '0,2,1', 'a player of side 2, out second: placed 2nd (' + Q.place + ')');
}

console.log('-- P3: what a side sees stays its own --');
{
  const C5 = H.load({ seed: 9, mapv: 9 }), S5 = C5.watch('modern', { n: 3 }); C5.run(1, null, 1 / 20);
  const u = S5.units.find(o => o.team === 1 && !o.dead && !o.fixed), seeBy = C5.$('seeBy'), sT = C5.$('sT'), spotted = C5.$('spotted');
  u.sn = []; seeBy(u, 0, u.x, u.z);
  ok(sT(u, 0) === S5.t && sT(u, 2) === -1e9, 'a vehicle of side 1 seen by side 0 only: sT(u, 0) now, sT(u, 2) never');
  ok(spotted(u, 0) && !spotted(u, 2), 'spotted(u, 0) true, spotted(u, 2) false');
  C5.$('cmdSense')(S5.cmd[2], []); const k2 = S5.cmd[2].known.includes(u); C5.$('cmdSense')(S5.cmd[0], []);
  ok(!k2 && S5.cmd[0].known.includes(u), 'side 0\'s commander knows it, side 2\'s does not (cmdSense)');
  const e = { lot: 1, idf: 1 << 0, team: 2 }, ecoHid = C5.$('ecoHid');
  ok(!ecoHid(e, 0) && ecoHid(e, 1), 'a lot of side 2 identified by side 0: hidden from 1, not from 0');
  const sus = C5.$('sus'), n0 = sus(0).length, n1 = sus(1).length, car = S5.units.find(o => o.team === 1 && !o.dead);
  try { C5.$('mineBoom')({ x: car.x, z: car.z, team: 2, k: 0 }, car, false); } catch (err) { /* only the suspicion matters */ }
  ok(sus(1).length === n1 + 1 && sus(0).length === n0, 'a mine of side 2 under a vehicle of side 1: side 1 suspects the place, side 0 does not');
  C5.run(20, null, 1 / 20);
  let only = 0, both = 0; for (const o of S5.units.concat(S5.men)) if (!o.dead && o.sn) { const a = [0, 1, 2].filter(t => t !== o.team && spotted(o, t)); if (a.length === 1) only++; if (a.length === 2) both++; }
  ok(only > 0, 'in 20 s of a three-sided battle, ' + only + ' seen by one enemy side only (' + both + ' by both)');
}

console.log('-- P4, P6a, P7: the faction --');
{
  const E = S.E.sides;
  ok(E[0].name === 'EUA' && E[1].name === 'Rússia' && E[2].name === 'Insurgentes', 'the sides are EUA, Rússia and Insurgentes');
  const D = $('DEFS'); ok(/M1A1 Abrams/.test(D.tank.leo2.name) && /M109A7 Paladin/.test(D.art.pzh.name), 'leo2 is the M1A1 Abrams, pzh the M109A7 Paladin');
  ok($('sideLacks')(2, 'plane') && $('sideLacks')(2, 'heli') && !$('sideLacks')(0, 'plane'), 'the Insurgents lack aviation (sideLacks)');
  const P = [0, 1, 2].map(t => C.popOf(t));
  ok(P[2].men === 194 && P[2].veh === 28 && P[2].air === 0 && P[0].men === 143 && P[0].veh === 34 && P[0].air === 7, 'the caps (men/veh/air): ' + P.map(o => o.men + '/' + o.veh + '/' + o.air).join(', '));
  ok(!Object.keys($('PERS')).includes('ins') && S.per[2] === 'ins' && $('insT(2)') && !$('insT(0)'), 'PERS.ins not drawn by lot, given to the Insurgents only (S.per ' + S.per + ')');
  const ks = []; for (let i = 0; i < 6 * 30; i++) { C.step(1 / 30); if (i % 30 === 0) ks.push(S.planK); }
  ok(new Set(ks).size === 3, 'the three generals take turns to plan (planK over 6 s: ' + ks.join(' ') + ')');
  const born = [], add0 = C.addUnit; C.addUnit = function () { const u = add0.apply(this, arguments); if (u && !u.fixed && u.rail) born.push([u, u.team, u.ri, u.ds]); return u; };
  C.run(SECS, null, 1 / 30); C.addUnit = add0;
  const my = $('myRoutes'), dsOf = $('dsOf'), wrong = born.filter(([u, t, ri, ds]) => t >= 0 && t < 3 && (!my(t).includes(ri) || ds !== dsOf(t, ri)));
  ok(born.length > 0 && !wrong.length, 'every AI vehicle that set out in ' + SECS + ' s (' + born.length + ', the three sides) left on a road of its own side, facing the far end' + (wrong.length ? ': not ' + wrong.slice(0, 4).map(([u, t, ri, ds]) => u.id + ' side ' + t + ' road ' + ri + ' ds ' + ds).join(', ') : ''));
  ok(!S.planes.some(p => p.team === 2 && !p.dead), 'no aircraft for the Insurgents after ' + Math.round(S.t) + ' s');
  const old = S.E.sides[2].aaOld, aa2 = S.units.filter(u => u.team === 2 && old.includes(u.id));
  ok(aa2.length >= 1 && !S.units.some(u => u.team === 2 && u.kind === 'aa'), 'the Insurgents\' anti-air is their old guns on technicals (cf-insurg-antiaerea): ' + aa2.map(u => u.id).join(', '));
  ok(!H.nan(S), 'no NaN after ' + Math.round(S.t) + ' s of three sides');
  /* with the conquest's front on a road a side has no end of (the front S.cq.fr is one road for the match), what a side places goes on its own
     roads: the commander's anti-air requisition (cmdReq: the Insurgents' came on road 0, at the USA's base), the posts of dispersed teams
     (postDisp), the next supply base (aiSite), a helicopter's holding point (heliHold) */
  const fr0 = S.cq.fr; S.cq.fr = 4;   // R_RI: Russia's and the Insurgents', not the USA's
  const okRd = (t, ri) => $('myRoutes')(t).includes(ri);
  const C2 = S.cmd[2], res = () => { S.eco.d[2].res.aa = ['hq', 'hq']; S.cq.rq[-3] = 0; C2.airT = S.t; C2.rqT = 0; }; res(); const n0 = S.units.length; $('cmdReq')(C2);   // two in its reserve, as if made
  const aa = S.units.slice(n0).filter(u => u.team === 2 && u.rqa);
  ok(aa.length > 0 && aa.every(u => okRd(2, u.ri)), 'the Insurgents\' anti-air requisition comes on one of their roads (' + aa.map(u => u.id + ' road ' + u.ri).join(', ') + ')');
  S.cq.fr = 0; res(); const n1 = S.units.length; $('cmdReq')(C2);
  const aaB = S.units.slice(n1).filter(u => u.team === 2 && u.rqa);
  ok(aaB.length > 0 && aaB.every(u => okRd(2, u.ri)), 'and with the front on road 0 too (' + (aaB.map(u => u.id + ' road ' + u.ri).join(', ') || 'none drawn') + ')');
  S.cq.fr = 3;   // R_EI: the USA's and the Insurgents', not Russia's
  const posts = [0, 1, 2, 3].map(k => $('postDisp')(1, 'rec', k));
  ok(posts.every(o => okRd(1, o.ri)), 'Russia\'s dispersed teams take its own roads (' + posts.map(o => o.ri) + ')');
  S.cq.fr = 4;
  const site = $('aiSite')(2);
  ok(!site || okRd(2, site.ri), 'side 2\'s next supply base site: ' + (site ? 'road ' + site.ri : 'none needed'));
  const hp = { team: 0, seed: 1 }, hh = $('heliHold')(hp), hr = $('railOf')(hh.x, hh.z);
  ok(Math.hypot(hh.x - S.base[0].x, hh.z - S.base[0].z) < Math.hypot(hh.x - S.base[2].x, hh.z - S.base[2].z), 'a USA helicopter holds behind its own line, nearer its base than the Insurgents\' (road ' + hr.ri + ')');
  S.cq.fr = fr0;
  /* the general's view of side 2 (the Insurgents' player opens it with Tab): every side's points, and its ticket trend drew the clock column */
  const V2 = C.genVM(2, true);
  ok(V2.held.length === 3 && V2.f.length === 3, 'the general\'s view of side 2: the points (' + V2.held + ') and a tally of the three sides');
  ok(JSON.stringify($('genTrendCols')(V2)) === '[[3,2],[1,0],[2,1]]' && JSON.stringify($('genTrendCols')(C.genVM(0, false))) === '[[1,0],[2,1],[3,2]]', 'its ticket trend: its own column of S.gtk, then each enemy\'s');
}

console.log('-- P6b, P6c: the general\'s helpers --');
{
  const B = S.base, mnBase = $('mnBase'), b = mnBase(0, B[2].x + 10, B[2].z);
  ok(b === B[2] && mnBase(2, B[1].x, B[1].z) === B[1], 'mnBase(t, x, z): the enemy base nearest the place');
  const Q = S.cq, tk = Q.tk.slice(), hold = Q.p.map(p => p.hold);
  Q.p.forEach(p => { if (p.base < 0) p.hold = -1; });
  Q.p.filter(p => p.base < 0).slice(0, 2).forEach(p => { p.hold = 1; });
  ok($('mnLead(0)').e === 1, 'mnLead(0) is side 1 while it holds more points');
  Q.p.filter(p => p.base < 0).slice(2, 5).forEach(p => { p.hold = 2; });
  ok($('mnLead(0)').e === 2, 'and side 2 once it passes side 1 in points');
  Q.p.forEach((p, i) => { p.hold = hold[i]; }); Q.tk = tk;
  const l2 = (S.eco.l || []).filter(e => e.team === 2);
  ok(S.eco.d.length === 3 && l2.length > 0, 'the economy has three sides and side 2 has sites (' + l2.map(e => e.k).join(', ') + ')');
  const ecoLook = $('ecoLook'), n2 = $('ecoLookN(2)');
  let inMap = 0; for (let i = 0; i < n2; i++) { const q = ecoLook(2, i); if (q && Math.abs(q.x - S.W / 2) <= S.W / 2 && Math.abs(q.z) <= S.HW) inMap++; }
  ok(n2 > 0 && inMap === n2, 'side 2\'s search points (' + n2 + ') all inside the map');
  const p = $('lsRail')(2, B[2].x + 200, B[2].z + 200);
  ok([3, 4].includes(p.ri), 'side 2 measures depth on its own roads (lsRail gives road ' + p.ri + ')');
}

console.log('-- P8: a town\'s militia --');
{
  const C6 = H.load({ seed: 5, mapv: 9 }), S6 = C6.watch('modern', { n: 3 }); C6.run(2, null, 1 / 20);
  const civD = C6.$('civD'), bi = S6.T.burgs.findIndex(b => b.k === 'village' || b.k === 'town'), b = S6.T.burgs[bi];
  ok(civD().n.length === 3, 'the civilians\' record has three sides');
  const c = { x: b.x, z: b.z }, toll = C6.$('civToll'), rage = C6.$('CIV').rage.n;
  for (let i = 0; i < rage; i++) toll(c, { team: 1 });
  ok(civD().foe[bi] === 2 && C6.$('civArms')(bi) === 2, 'killed by Russia: the town hates side 1 (foe ' + civD().foe[bi] + ') and arms for the Insurgents (' + C6.$('civArms')(bi) + ')');
  for (let i = 0; i < rage; i++) toll(c, { team: 2 });
  ok(civD().foe[bi] === 6 && C6.$('civArms')(bi) === 0, 'then by the Insurgents too: foe 6, it arms for the USA (' + C6.$('civArms')(bi) + ')');
  const L = S6.glog.l;
  ok(L[0].some(e => /se voltou contra Rússia/.test(e.s)) && L[2].some(e => /se voltou contra Rússia/.test(e.s)), 'the USA and the Insurgents log "se voltou contra Rússia"');
}

console.log('-- P9: the analytics with three sides --');
{
  const h = $('ANA').ev.find(e => e.k === 'hdr');
  ok(h && h.n === 3 && h.fac.length === 3, 'the analytics header says three sides (n ' + (h && h.n) + ')');
  const R = $('anaReport')($('ANA').ev);
  ok(R && R.ns === 3 && (!R.curve || !R.curve.length || R.curve[0].length === 7), 'anaReport: ns 3, the curve [t, 3 tickets, 3 points]');
}
{
  /* the tournament of three sides as the docs call it (no --mapv: it used map 4, which has no third base, and stopped at once) */
  const fs = require('fs'), os = require('os'), path = require('path'), zlib = require('zlib'), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-sides3-tour-'));
  const r = require('child_process').spawnSync(process.execPath, [path.join(H.ROOT, 'tools', 'balance.js'), '--torneio', '1', '--lados', '3', '--min', '0.05', '--nobudget', '--jobs', '1', '--save', dir], { encoding: 'utf8', env: Object.assign({}, process.env, { ANA_DIR: dir }) });
  const files = []; (function walk(d) { for (const f of fs.readdirSync(d)) { const q = path.join(d, f); if (fs.statSync(q).isDirectory()) walk(q); else if (f.endsWith('.ndjson.gz')) files.push(q); } })(dir);
  const hdr = files.length ? JSON.parse(zlib.gunzipSync(fs.readFileSync(files[0])).toString('utf8').split('\n')[0]) : null;
  ok(!/não montou/.test(r.stdout + r.stderr) && hdr && hdr.n === 3 && hdr.mv >= 9, 'tools/balance.js --torneio 1 --lados 3 plays a match of three sides on map ' + (hdr && hdr.mv) + (hdr ? '' : ': ' + (r.stdout + r.stderr).split('\n').filter(l => /Error|não/.test(l)).slice(0, 2).join(' ')));
  fs.rmSync(dir, { recursive: true, force: true });
}
done();
