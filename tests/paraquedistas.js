'use strict';
/* paratroopers (cf-paraquedistas): the general's drop (para) from the side's transport of its era, the men out one by one near the point, their
   canopies, the squad on the ground at the target with the drop's mission; the transport home; a transport shot down takes those aboard;
   the limits (one drop of a side in the air, PARA.cd s between drops, no transport for the Insurgents); the AI general's choice (a point it
   does not hold, few enemies known, no known anti-aircraft); the map request (PED 'para') and the player's own jump (PED 'jump': at a
   depot, the ride, E out, Space opens, the canopy steered, a clean landing); online, the guest's jump answer carries the transport's id.
   A real ww2 conquest battle (~1 min), then a modern one */
const H = require('./harness'), ok = H.ok;
const C = H.load({ seed: 7, eco: 1, mapv: 8 }), $ = C.$;
const S = C.newState('ww2', 'schutze', { cls: 'inf' }), P = S.my, PARA = $('PARA'), PLANES = $('PLANES');
C.run(20, null, 1 / 20);
const t = P.team, foe = 1 - t, gen = c => C.genCmd(t, c, 'sys');
const fly = (secs, each) => C.run(secs, each, 1 / 20);

/* the transports: one a side, of the era (a player flies them too since cf-transporte-jogador: tests/transporte-jogador.js) */
ok($('paraType')(0) === 'ju52' && $('paraType')(1) === 'c47', 'ww2: the Luftwaffe drops from the Ju 52, the Allies from the C-47');
ok($('canSwap')('plane', $('paraType')(t)), 'the side\'s own is a player\'s to swap to');

/* a point the side does not hold, far from both bases */
const pts = $('gPts')().filter(p => p.hold !== t && S.base.every(b => Math.hypot(b.x - p.x, b.z - p.z) > 2000));
const tg = pts[0]; ok(!!tg, 'a target: ' + (tg && $('gName')(tg)));
for (const g of S.men.concat(S.units)) if (g.team !== t && g.kind === 'aa') g.seenT = -1e9;   // no anti-aircraft known
S.eco.d[t].res.squad = (S.eco.d[t].res.squad || []).concat(['hq', 'hq']);
const pl0 = new Set(S.planes);
let r = gen({ c: 'para', x: tg.x, z: tg.z, why: 'teste' });
ok(r.ok, 'the command para: ' + JSON.stringify(r));
const D = S.pdr[S.pdr.length - 1], p = S.planes.find(q => !pl0.has(q) && q.role === 'para');
ok(D && p && p.pd === D && p.def.name === PLANES[$('paraType')(t)].name && p.cargo.length === D.n, 'a ' + (p && p.def.name) + ' takes off with ' + (D && D.n) + ' men aboard');
r = gen({ c: 'para', x: tg.x, z: tg.z }); ok(!r.ok && r.why === 'plive', 'a second drop while one is in the air: ' + r.why);

/* the flight: out over the point, the canopies, the squad on the ground */
let firstOut = null, chutes = 0, maxN = 0;
fly(400, () => {
  const air = S.men.filter(m => m.para && m.team === t && !m.dead);
  if (air.length && !firstOut) firstOut = { t: S.t, x: air[0].x, z: air[0].z, y: air[0].y, agl: air[0].y - C.hgt(air[0].x, air[0].z) };
  chutes = Math.max(chutes, air.filter(m => m.para.st === 'chute').length); maxN = Math.max(maxN, air.length);
  return !(D.out >= D.n && !air.length && (p.gone || p.dead));
});
ok(!!firstOut, 'the men go out of the door: the first ' + (firstOut ? Math.round(firstOut.agl) + ' m over the ground, ' + Math.round(Math.hypot(firstOut.x - tg.x, firstOut.z - tg.z)) + ' m from the point' : 'never'));
ok(chutes >= Math.min(3, D.n) && maxN >= 2, 'their canopies open (' + chutes + ' under canopy at once, ' + maxN + ' in the air)');
const q = D.q, men = q ? q.men.filter(m => !m.dead) : [];
ok(q && D.out === D.n && men.length >= D.n - 1, 'a squad of ' + men.length + ' on the ground (' + D.out + ' jumped)');
const far = men.map(m => Math.round(Math.hypot(m.x - tg.x, m.z - tg.z)));
ok(men.length && Math.max(...far) < 420, '  around the point: ' + far.join(', ') + ' m');
ok(men.every(m => !m.para && Math.abs(m.y - $('manY')(m.x, m.z)) < 1), '  on their feet, on the ground');
ok(q.mis && q.mis.kind === 'attack' && Math.hypot(q.mis.area.x - tg.x, q.mis.area.z - tg.z) < 1, '  with the drop\'s mission: ' + (q.mis && q.mis.kind));
$('setOrd')(q, Object.assign({}, q.ord));   // the contact drill (cnStep) sets the squad's hold order again once the contact is over
ok(q.mis && q.mis.kind === 'attack', '  which its hold order set again keeps: ' + (q.mis && q.mis.kind));
ok(p.gone && !p.dead && D.end > 0, 'the transport went home and landed');
r = gen({ c: 'para', x: tg.x, z: tg.z }); ok(!r.ok && r.why === 'pcd', 'another drop before PARA.cd s: ' + r.why);

/* shot down with men aboard: they are lost with it */
S.pdrT[t] = 0;
const free = () => $('gPts')().filter(p => p.hold !== t && S.base.every(b => Math.hypot(b.x - p.x, b.z - p.z) > 2000) && !$('pedMates')(t, p.x, p.z, 600)).sort((a, b) => Math.hypot(a.x - S.base[t].x, a.z - S.base[t].z) - Math.hypot(b.x - S.base[t].x, b.z - S.base[t].z))[0] || tg;
let tg2 = free(); S.popK = 4; S.eco.d[t].res.squad.push('hq', 'hq', 'hq', 'hq');   // a side at its population cap drops no one (as it dispatches no one): room for the tests' drops
r = gen({ c: 'para', x: tg2.x, z: tg2.z }); ok(r.ok, 'another drop once PARA.cd s are over: ' + JSON.stringify(r));
const D2 = S.pdr[S.pdr.length - 1], p2 = D2.p;
fly(5); $('lose')(p2, 1e6, null); fly(1);
ok(D2.end > 0 && D2.out === 0 && /abatido com \d+ paraquedistas/.test(D2.res), 'a transport shot down: ' + D2.res);

/* a jumper killed under his canopy comes down with it, not hanging in the sky */
S.pdrT[t] = 0; S.eco.d[t].res.squad.push('hq'); tg2 = free();
r = gen({ c: 'para', x: tg2.x, z: tg2.z }); ok(r.ok, 'a third: ' + JSON.stringify(r));
let shot = null, sy = 0; fly(300, () => { const m = S.men.find(m => m.para && m.para.st === 'chute' && m.team === t && !m.dead); if (m && !shot) { shot = m; sy = m.y - $('manY')(m.x, m.z); $('killMan')(m, null); } return !(shot && !shot.para); });
ok(shot && sy > 50 && !shot.para && Math.abs(shot.y - $('manY')(shot.x, shot.z)) < 1, 'a jumper killed in the air falls to the ground' + (shot ? ' (' + (shot.para ? shot.para.st : 'down') + ', ' + Math.round(shot.y - $('manY')(shot.x, shot.z)) + ' m up)' : ': none under a canopy'));

/* the AI general: a point it does not hold, weakly held, not where anti-aircraft is known */
const Cm = S.cmd[t]; S.pdrT[t] = 0; for (const d of S.pdr) d.end = d.end || S.t;
S.eco.d[t].res.squad.push('hq'); Cm.paraT = 0; const n0 = S.pdr.length;
for (const g of S.men.concat(S.units)) if (g.team !== t) g.seenT = -1e9;
const held = new Set($('gPts')().filter(p => p.hold === t)); $('paraAI')(Cm);
const D4 = S.pdr.length === n0 + 1 ? S.pdr[S.pdr.length - 1] : null, pt = D4 && $('gPts')().find(p => Math.hypot(p.x - D4.x, p.z - D4.z) < 1);
ok(D4 && pt && !held.has(pt), 'the AI general drops on a point it does not hold: ' + (pt ? $('gName')(pt) : 'none (' + $('gPts')().map(p => p.L + ':' + p.hold + '/' + $('pedFoes')(t, p.x, p.z, PARA.ai.near) + '/' + ($('pedMates')(t, p.x, p.z, PARA.ai.mates) ? 'm' : '-') + '/aa' + $('pedFoes')(t, p.x, p.z, PARA.ai.aaR, false, true) + '/b' + Math.round(Math.min(...S.base.map(b => Math.hypot(b.x - p.x, b.z - p.z))))).join(' ') + ' live ' + $('paraLive')(t).length + ' cd ' + S.pdrT[t] + ' res ' + S.eco.d[t].res.squad.length + ')'));
S.pdrT[t] = 0; if (D4) D4.end = S.t; Cm.paraT = 0; S.eco.d[t].res.squad.push('hq');
const aa = S.units.find(u => u.team === foe && u.kind === 'aa' && !u.dead);
if (aa) {
  for (const p of $('gPts')()) { if (p.hold === t) continue; const u = $('addUnit')('aa', foe, p.x, p.z, null, true); u.x = p.x + 30; u.z = p.z; u.y = C.hgt(u.x, u.z); u.seenT = S.t; u.sx = u.x; u.sz = u.z; }
  const n1 = S.pdr.length; $('paraAI')(Cm);
  ok(S.pdr.length === n1, 'with enemy anti-aircraft known at every such point, no drop');
}

/* the map: a drop asked of the general, and the player's own jump */
const PED = $('PED'), later = s => { S.t += s; };
for (const u of S.units) if (u.team === foe && u.kind === 'aa') u.seenT = -1e9;
S.pdrT[t] = 0; for (const d of S.pdr) d.end = d.end || S.t; S.eco.d[t].res.squad.push('hq');
later(PED.no + 1); tg2 = free();
r = $('pedDecide')(P, 'para', tg2.x, tg2.z);
ok(r.st === 'ok' && r.eta > 0, 'the map request "paraquedistas": ' + r.st + ' (' + r.why + ', ETA ' + r.eta + ' s)');
later(PED.no + 1); P.x = S.base[t].x + 3000; P.z = S.base[t].z;
r = $('pedDecide')(P, 'jump', tg.x, tg.z);
ok(r.st === 'no' && /base/.test(r.why), 'a jump away from any depot is refused: ' + r.why);
later(PED.no + 1); P.x = S.base[t].x + 200; P.z = S.base[t].z; P.y = $('manY')(P.x, P.z);
r = $('pedDecide')(P, 'jump', tg.x, tg.z);
ok(r.st === 'ok' && P.para && P.para.st === 'ride', 'at the base the player boards a transport: ' + r.why);
const pj = P.para.p; fly(3);
ok(Math.hypot(P.x - pj.x, P.z - pj.z) < 2 && P.y > C.hgt(P.x, P.z) + 300, '  he rides it, high');
ok(P.inv > 0, '  unhurt aboard');
later(PED.gap + 1); r = $('pedDecide')(P, 'jump', tg.x, tg.z); ok(r.st === 'wait', 'another jump before PED.cd.jump s: ' + r.why); later(-(PED.gap + 1));
const I = S.input, press = (k, s) => { I[k] = true; fly(s || .1); I[k] = false; fly(.1); };
fly(6); press('yawR');
ok(P.para && P.para.st === 'fall', 'E: out of the door, falling (' + Math.round(P.y - C.hgt(P.x, P.z)) + ' m over the ground)');
fly(3); const vy = P.para.v.y; press('fire');
ok(vy < -20 && P.para.st === 'chute', 'Space opens the canopy (falling at ' + Math.round(-vy) + ' m/s)');
fly(4); const h0 = P.para.h; I.left = true; fly(2); I.left = false;
ok(Math.abs($('wrap')(P.para.h - h0)) > 1, 'A turns the canopy');
fly(400, () => !!P.para);
ok(!P.para && !P.dead && Math.abs(P.y - $('manY')(P.x, P.z)) < 1 && P.hp > P.max * .9, 'he lands clean, on his feet (' + Math.round(P.hp) + ' of ' + P.max + ' hp, ' + (P.para ? P.para.st + ' ' + Math.round(P.y - $('manY')(P.x, P.z)) + ' m up' : 'down') + (P.dead ? ', dead' : '') + ')');
/* online: the host decides a guest's jump and the answer names the transport */
const Net = $('Net'), sent = []; Net.send = (k, m) => sent.push(Object.assign({ t: k }, m));
S.net = true; S.host = true; Net.para = true;
const g = $('addMan')(P.id, t, S.base[t].x + 150, S.base[t].z, 0); g.pid = 9; g.net = true; g.snap = { x: g.x, z: g.z, h: 0, ap: 0, age: 0 }; Net.ghosts.set(9, g); later(PED.no + 1);
for (const u of S.units) if (u.team === foe && u.kind === 'aa') u.seenT = -1e9; tg2 = free();
Net.rx.gped({ from: 9, k: $('PEDK').indexOf('jump'), p: [Math.round(g.x), Math.round(g.z)], q: [Math.round(tg2.x), Math.round(tg2.z)] });
const a = sent.pop(), pg = a && S.planes.find(q => q.aid === a.v);
ok(a && a.t === 'gpr' && a.s === 0 && a.v < 0 && pg && pg.role === 'para', 'a guest\'s jump: the host launches a transport and answers with its id (' + JSON.stringify(a) + ')');
fly(1); Net.snapshot(); ok(sent.some(m => m.t === 'ai' && m.k === 0 && m.e.some(e => e[0] === a.v)), '  whose rows go to the room');
Net.para = false; sent.length = 0; Net.snapshot(); ok(!sent.some(m => m.t === 'ai' && m.k === 0 && m.e.some(e => PLANES[e[1]].para)), '  but not to a server that does not know them');
S.net = false; S.host = false;

/* today: the C-130J and the Il-76MD; the Insurgents have none */
const M = H.load({ seed: 3, eco: 1, mapv: 8 }), S2 = M.newState('modern', 'blueRifle', { cls: 'inf' });
ok(M.$('paraType')(0) === 'c130' && M.$('paraType')(1) === 'il76', 'today: the C-130J and the Il-76MD');
const M3 = H.load({ seed: 3, eco: 1, mapv: 11 }), S3 = M3.watch('modern', { len: 0, n: 3 });
ok(M3.$('paraType')(2) === null && M3.genCmd(2, { c: 'para', x: S3.W / 2, z: 0 }, 'sys').why === 'pnone', 'the Insurgents have no transport: ' + M3.genCmd(2, { c: 'para', x: S3.W / 2, z: 0 }, 'sys').why);
ok(!H.nan(S) && !H.nan(S2), 'no NaN');
H.done();
