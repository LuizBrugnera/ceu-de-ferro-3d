'use strict';
/* Field infantry: the opening deployment, the orders (hold, patrol, assault, escort), the side planner's reinforcements, trucks that
   unload under threat, and the wave rule. SECS: how long the battles run (default 240) */
const H = require('./harness'), ok = H.ok, SECS = +process.env.SECS || 240;
const online = (C, era) => { const S = C.newState(era, C.$('ERAS')[era].sides[0].fighter, { net: true, host: true }), N = C.$('Net'); N.inf = N.wo = N.sb = N.cmd = true; N.id = 1; S.humans = [1, 1]; return S; };
const solo = (C, era) => C.newState(era, C.$('ERAS')[era].sides[0].fighter, { cls: 'plane' });
const calm = S => { S.waveTimer = 99; for (const p of S.planes) if (p.team === 1) p.gone = true; for (const u of S.units) if (u.team === 1 && !u.fixed && !u.fld) { u.cargo = null; u.dead = u.gone = true; } for (const m of S.men) if (m.team === 1 && m.sq && m.sq.col && !m.dead) { m.dead = true; m.deadT = S.t; } };
const park = S => { const P = S.my; P.inv = 9; P.dead = false; P.y = 3000; P.v.y = 0; P.hp = P.def.hp; S.lives = 9; S.base[0].hp = 300; };

console.log('-- the opening: who stands where --');
for (const era of ['ww2', 'modern']) for (const mode of ['solo', 'online']) {
  const C = H.load({ seed: 21 }), $ = C.$, S = mode === 'solo' ? solo(C, era) : online(C, era), F = $('FIELD');
  if (mode === 'online') C.step(1 / 60);
  const jobs = t => S.squads.filter(q => q.team === t).map(q => q.job + ':' + q.ord.k).sort().join(' '), n = t => S.men.filter(m => m.team === t).length;
  const want = F.posts.reduce((a, p) => a + p[1], 0), bank = mode === 'solo' || S.squads.every(q => q.job === 'push' || (q.s - S.T.mid[q.ri]) * q.ds < 0);
  ok(S.squads.filter(q => q.team === 0).length === want && S.squads.filter(q => q.team === 1).length === want && n(0) === n(1) && bank,
    era + ' ' + mode + ': ' + want + ' squads a side on foot at t=0, ' + n(0) + ' and ' + n(1) + ' soldiers' + (mode === 'solo' ? '' : ', each on its own side of the middle of its road (the assault squads apart)'));
  if (era === 'ww2') { console.log('   ' + jobs(0));
    for (const q of S.squads.filter(q => q.team === 0)) { const L = q.men[0], w = S.T.towns.map(t => Math.hypot(t.x - L.x, t.z - L.z)), r = $('railOf')(L.x, L.z); console.log('   ' + (mode + ' own ' + q.job + q.jk).padEnd(18) + ' road ' + r.ri + ' at ' + Math.round(S.T.routes[r.ri].len - r.s) + ' m from its base end, ' + Math.round(r.d) + ' m off it, ' + Math.round($('hdist')(L, S.base[0])) + ' m from the base, towns ' + w.map(Math.round).join('/') + ' m' + ($('kindAt')(L.x, L.z) === 1 ? ', in woods' : '')); } }
}

console.log('-- orders --');
{ const C = H.load({ seed: 5 }), $ = C.$, S = solo(C, 'ww2'), q = t => S.squads.find(q => q.team === 0 && q.job === t), g = q('garr'), pat = q('road'), fd = $('footD'), O = pat.ord;
  $('FREE').road = 0; $('CMD').doc.balanced.bait = 0;   // the commander leaves the patrol to its beat
  let lo = 1e9, hi = -1e9, walls = 0, low = false;
  C.run(170, () => { park(S); for (const m of pat.men) m.inv = 9; lo = Math.min(lo, pat.s); hi = Math.max(hi, pat.s); if (Math.abs(S.t - 60) < .01) { walls = g.men.filter(m => !m.dead && $('near')(m.x, m.z, 6).some(o => o.K.sight && fd(o, m.x, m.z) < 3.5)).length; low = g.men.every(m => m.dead || m.st > 0 || $('hdist')(m, g.ord) > 60); } });
  ok(g.at && walls >= g.live - 1 && low, 'hold: the garrison is at its post, ' + walls + ' of ' + g.live + ' men at the walls of a house or behind its windows, crouched or prone');
  ok(O.k === 'patrol' && hi - lo > 300 && lo >= Math.min(O.a, O.e) - 15 && hi <= Math.max(O.a, O.e) + 15, 'patrol: the road squad walked ' + Math.round(hi - lo) + ' m of its ' + Math.round(Math.abs(O.a - O.e)) + ' m stretch and stayed on it');
  const w = q('wood'); ok(!w || w.men.every(m => m.dead || $('kindAt')(m.x, m.z) === 1 || $('hdist')(m, w.ord) < 60), 'hold: the picket is in its wood' + (w ? ' (' + Math.round($('hdist')(w.men[0], w.ord)) + ' m from its middle)' : ' (no wood near this line)'));
}
for (const era of ['ww2', 'modern']) { const C = H.load({ seed: 6 }), $ = C.$, S = solo(C, era), obj = $('cmdObj')($('cmdOf')(0)), o = obj.x === undefined ? $('routeAt')(S.T.routes[obj.ri], obj.s) : obj, D = $('CMD'); let near = 1e9, st = [], tG = -1;
  C.run(Math.max(SECS, 700), () => { park(S); const op = S.cmd && S.cmd[0].ops.find(o => o.k === 'atk'); if (!op) return; if (st[st.length - 1] !== op.st) st.push(op.st); if (op.st === 'go' && tG < 0) tG = S.t; if (op.st !== 'form') for (const q of op.sq) { const L = q.men.find(m => !m.dead); if (L) near = Math.min(near, Math.hypot(L.x - o.x, L.z - o.z)); } return near > 150; });
  ok(st.includes('go') ? near < D.fup - 300 || st.includes('fight') : st.includes('form'), era + ' assault: the commander ' + (st.includes('go') ? 'went' : 'is forming up') + ' for the enemy ' + (obj.tw ? 'town' : 'line') + ' (' + st.join(', ') + '), off at ' + tG.toFixed(0) + ' s, nearest ' + Math.round(near) + ' m from it'); }
{ const C = H.load({ seed: 7 }), $ = C.$, S = C.sandbox('ww2'), r = S.T.routes[0], s0 = r.len / 2;
  S.over = false; S.demo = true; C.demoKeepAlive = () => {};
  C.spawnColumn(1, 2, 0, 1, 0, s0, 0, 1); const tr = S.units.find(u => u.kind === 'truck'), tk = S.units.filter(u => u.kind === 'tank'); C.unload(tr); const q = tr.sq; let ah = -1e9;
  C.run(120, () => { const lead = Math.max(...tk.map(u => u.s)); ah = Math.max(ah, q.s - lead); });
  ok(q.ord.k === 'escort' && q.col && ah <= $('FIELD').esc + 1 && q.s > s0 + 200, 'escort: the column\'s squad followed its tanks ' + Math.round(q.s - s0) + ' m and never got more than ' + Math.round(ah) + ' m ahead of the foremost'); }

console.log('-- a truck unloads under threat --');
{ const C = H.load({ seed: 8 }), $ = C.$, IAI = $('IAI'); let S, r, tr;
  const fresh = () => { S = C.sandbox('ww2'); r = S.T.routes[0]; C.spawnColumn(1, 0, 0, 1, 0, r.len / 2, 0, 1); tr = S.units[0]; C.run(1); };
  const until = (f, T) => { let t = null; f(); const t0 = S.t; C.run(T || 6, () => { if (t === null && !tr.cargo) t = S.t - t0; return t === null; }); return t; };
  fresh(); let t = until(() => {}, 20); ok(t === null && tr.cargo, 'with nothing near, it drives on loaded');
  fresh(); t = until(() => C.damageUnit(tr, 3, null)); ok(t !== null && t < 1 && S.men.length === 5, 'hit: unloaded in ' + (t || 0).toFixed(1) + ' s');
  fresh(); t = until(() => { const p = C.addPlane('p47', 0, tr.x - 900, tr.y + 500, tr.z, 0, false); p.v = { x: 130, y: -70, z: 0 }; p.V = 148; p.inv = 99; p.ctl.thr = 0; }); ok(t !== null && t < 2, 'a plane diving on it: unloaded in ' + (t || 0).toFixed(1) + ' s');
  fresh(); t = until(() => C.explode(tr.x + 90, tr.y, tr.z, 30, 10, null, 0, true)); ok(t !== null && t < .1, 'a shell bursting 90 m away: unloaded at once');
  fresh(); t = until(() => { const k = C.addUnit('tank', 1, 0, 0, 'tiger', false, 0, tr.s + 60, 5, 0), p = $('routeAt')(r, tr.s + 60 + 1400); C.addVehicle('truck', null, 0, p.x, p.z, 0).inv = 99; }, 10);
  ok(t !== null, 'a tank of its column in contact 1400 m from the enemy: unloaded in ' + (t || 0).toFixed(1) + ' s' + ' (dismount distance ' + IAI.dismount + ' m)');
  const s0 = tr.s; C.run(25); ok((s0 - tr.s) > IAI.away[0] - 40, 'and the empty truck backed ' + Math.round(s0 - tr.s) + ' m away from where it let its squad off'); }   // from there: the tank takes seconds to notice the enemy (PERC), the truck rolls on meanwhile

console.log('-- the planner refills a post --');
for (const bases of [false, true]) { const C = H.load({ seed: 9 }), $ = C.$; if (!bases) C.planSup = () => {}; const S = solo(C, 'ww2'), F = $('FIELD'), q = S.squads.find(q => q.team === 0 && q.job === 'line' && q.jk === 0), post = { x: q.ord.x, z: q.ord.z };
  C.run(bases ? 60 : 1, () => { park(S); calm(S); });
  for (const m of q.men) C.killMan(m, null);
  if (bases) $('IAI').cap += 10;   // room under the side's cap for the refill: whether other men fall meanwhile (the drills keep more of them alive) is not the point
  const t0 = S.t; let tT = -1, tU = -1, tG = -1, tr = null, far = 0, nq = null;
  C.run(900, () => { park(S); calm(S); if (!nq) nq = S.squads.find(x => x !== q && x.team === 0 && x.job === 'line' && x.jk === 0) || null; if (nq && tU < 0) tU = S.t - t0;
    if (!tr) { tr = S.units.find(u => u.fld && u.team === 0 && u.job === 'line'); if (tr) { tT = S.t - t0; far = Math.abs(tr.s - q.ord.s); } } else if (tG < 0 && tr.gone) tG = S.t - t0; return !(nq && nq.at && (!tr || tG >= 0)); });
  const took = nq && nq.at && nq.men.some(m => !m.dead && $('hdist')(m, post) < 40);
  if (bases) ok(took && !tr && S.sup.some(b => b.team === 0 && b.prog >= 1), 'with the forward supply base standing, the new squad entered at it on foot ' + tU.toFixed(0) + ' s after the loss and held the post at ' + (S.t - t0).toFixed(0) + ' s');
  else ok(took && tT >= 0 && tT <= F.reinf + F.every + 1 && tG > 0, 'with no supply base, a truck left the main base ' + tT.toFixed(0) + ' s after the loss, ' + Math.round(far) + ' m from the post, let the squad off at ' + tU.toFixed(0) + ' s, was back and gone at ' + tG.toFixed(0) + ' s, and the squad held the post'); }

console.log('-- conquest: the director reinforces, losses cost tickets, the points and the end --');
{ const C = H.load({ seed: 10 }), $ = C.$, S = solo(C, 'ww2'), Q = S.cq, K = $('CQ'); C.run(3, () => park(S));
  const col = () => S.units.filter(u => u.team === 1 && !u.fixed && !u.fld && !u.dead).length, n0 = col(), t0 = Q.tk[1];
  for (const u of S.units) if (u.team === 1 && !u.fixed && !u.fld && !u.dead) { u.cargo = null; C.killUnit(u); } C.step(1 / 60); const left = S.men.filter(m => m.team === 1 && !m.dead).length, paid = t0 - Q.tk[1]; C.run($('DIR').col + 5, () => park(S));
  ok(n0 > 0 && paid > 0 && left > 20, 'the enemy column of ' + n0 + ' destroyed cost its side ' + Math.round(paid) + ' tickets, and ' + left + ' field soldiers stay');
  ok(col() >= 2 && !S.units.some(u => u.team === 1 && u.kind === 'tank' && !u.dead), 'the director sent the next column within ' + ($('DIR').col + 5) + ' s (' + col() + ' vehicles), without the tanks, whose replacement waits ' + K.ai.tank + ' s');
  const P = Q.p, n = P.find(p => p.hold < 0), b = P.find(p => p.base === 1), far = P.find(p => p.hold === 1 && p.base < 0 && !p.links.some(i => P[i].hold === 0));
  ok(P.length === 7 && P.filter(p => p.hold === 0).length === 3 && P.filter(p => p.hold === 1).length === 3 && !!n && $('towns')().length === 2, 'seven points in 1944: three a side and ' + n.L + ' ' + n.name + ' neutral; ' + P.map(p => p.L + ' ' + p.name).join(', '));
  S.units = []; S.men = []; S.squads = []; C.director = () => {}; C.plan = () => {};
  const man = (t, p, dx) => C.addMan($('INF').ww2[S.fac[t]][0], t, p.x + dx, p.z, 0); let m = man(0, n, 5); n.c = 0; C.run(K.t + 2, () => park(S));
  ok(n.hold === 0, 'one soldier alone in the neutral point takes it in ' + K.t + ' s');
  const e = man(1, n, -5); C.run(20, () => park(S)); ok(n.hold === 0 && n.c === -1 && n.w[0] === 1 && n.w[1] === 1, 'with one of each side in it nothing moves');
  m.gone = true; const tk = Q.tk[0]; C.run(K.t + 2, () => park(S)); ok(n.hold === -1 && Q.tk[0] <= tk - K.lost, 'the enemy alone takes it back to neutral, and the loss costs ' + K.lost + ' tickets');
  e.gone = true; m = man(0, far, 5); C.run(30, () => park(S)); ok(far.c === 1 && far.hold === 1, 'a point with no link to one of its own cannot be taken (' + far.L + ')');
  m.gone = true; Q.T = 1; C.run(2, () => park(S)); ok(S.over && Q.res && Q.res[1] === 2, 'the clock ends the match: ' + S.why + ', ' + K.why[Q.res[1]]); }
H.done();
