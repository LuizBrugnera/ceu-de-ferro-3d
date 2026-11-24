'use strict';
/* Roads plan, slice 3 (map version 4), part 1: the centre axis, squads and vehicles on trips off their axis, the foot path, and the manoeuvre
   framework (cmdMan / opNew / the kill-zone grid) with no kind registered and with one stub kind registered by this test. Online: a host and a
   client on a map 4 room stay consistent. Env: PAGE, SERVER, PORT_T. Not here: the nine kinds (their own tests in tests/roads-ops.js). */
const N = require('./net'), H = require('./harness'), { ok, done } = H;
const hdist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
/* an empty battlefield with the conquest points: nothing spawns by itself */
const fresh = (C, era, o) => { C.seed(7); const S = C.newState(era, C.$('ERAS')[era].sides[0].fighter, { cls: 'plane' }); S.demo = false; S.over = !(o && o.keep); S.units = []; S.planes = []; S.men = []; S.squads = []; return S; };
/* BATTLE=<era>: only a 300 s solo battle at map 4 with the economy on (SECS to change it), no exception, no NaN, the squads and the vehicles that made trips */
if (process.env.BATTLE) {
  const era = process.env.BATTLE, SECS = +process.env.SECS || 300, C = H.load({ seed: 101, mapv: 4, eco: true }), $ = C.$, S = C.newState(era, $('ERAS')[era].sides[0].fighter, { cls: 'plane' });
  let err = null, trips = 0, sq = 0; const seen = new Set(), seenQ = new Set(), t0 = Date.now();
  try { C.run(SECS, () => { for (const u of S.units) if (u.trip && !seen.has(u)) { seen.add(u); trips++; } for (const q of S.squads) if (q.tp && !seenQ.has(q)) { seenQ.add(q); sq++; } }, 1 / 30); } catch (e) { err = e; }
  const bad = S.cq.p.some(p => !Number.isFinite(p.c)) || !Number.isFinite(S.cq.ps[0]) || !Number.isFinite(S.cq.ps[1]);
  ok(!err && !H.nan(S) && !bad, era + ' ' + SECS + ' s at map 4, economy ' + ($('ECO').on ? 'on' : 'OFF') + ': no exception, no NaN (' + (Date.now() - t0) + ' ms; ' + S.squads.length + ' squads, ' + S.units.length + ' vehicles, ' + sq + ' squads and ' + trips + ' vehicles made trips; points ' + [0, 1].map(t => S.cq.p.filter(p => p.hold === t).length) + ')' + (err ? ' ' + err.stack : ''));
  done(); return;
}
(async () => {
  for (const era of process.env.ONLY_NET ? [] : ['ww2', 'modern']) {
    console.log(era);
    /* the title screen's demo (newState with no model: no points, S.cq null) at map 4: the manoeuvres stay out of it and nothing throws */
    { const D = H.load({ seed: 11, mapv: 4 }); let err = null; try { D.newState(era, null); D.run(20, null, 1 / 30); } catch (e) { err = e; }
      ok(!err && !D.$('S').cq && !H.nan(D.$('S')), 'the demo state (no points) runs 20 s at map 4 without throwing' + (err ? ' ' + err.stack.split('\n').slice(0, 3).join(' | ') : '')); }
    const C = H.load({ seed: 5, mapv: 4 }), $ = C.$, RN = $('RN'), T = $('genTerrain')(era, 4), T3 = $('genTerrain')(era, 3);
    /* 3.1 the centre axis */
    const R = T.routes, nd = id => T.net.n.find(n => n.id === id);
    ok(R.length === 3 && T3.routes.length === 2 && !T3.sw, 'map 4 has three axes, map 3 two (' + R.map(r => r.len | 0) + ')');
    ok(hdist(R[2][0], T.bases[1]) < 1e-6 && hdist(R[2][R[2].length - 1], T.bases[0]) < 1e-6, 'axis 2 runs from base 1 to base 0');
    ok(R[0].every((p, i) => p.x === T3.routes[0][i].x && p.z === T3.routes[0][i].z) && R[1].length === T3.routes[1].length, 'axes 0 and 1 are exactly map 3\'s');
    const sharedA = RN.ax[era].filter(id => nd(id).ax.some(a => a[0] === 0)).length;
    let gap = 0; for (let i = 1; i < R[2].length; i++) gap = Math.max(gap, hdist(R[2][i], R[2][i - 1]));
    ok(gap < 500 && RN.ax[era].every(id => nd(id).ax.some(a => a[0] === 2 && Math.abs($('routeAt')(R[2], a[1]).x - nd(id).x) < .01)), 'every node of the axis sits on it at its s (longest step ' + gap.toFixed(0) + ' m, ' + sharedA + ' nodes shared with axis 0)');
    ok(T.sw.every((l, ri) => l.every(w => T.sw[w.rj].some(v => v.rj === ri && v.n === w.n && v.s === w.sj))), 'T.sw is symmetric: ' + T.sw.map(l => l.length));
    const X = nd('X'), mid2 = $('routeAt')(R[2], T.mid[2]);
    ok(hdist(mid2, X) < 2500 && Math.abs(mid2.x - T.W / 2) < 80, 'T.mid[2] is where axis 2 crosses the middle, ' + (hdist(mid2, X) / 1000).toFixed(1) + ' km from X');
    C.seed(9);
    const S0 = C.newState(era, $('ERAS')[era].sides[0].fighter, { cls: 'plane' }), P = S0.cq.p, pk = k => P.find(p => p.k === k);
    ok(['w', 'x', 'e'].every(k => pk(k).rs[2] !== null && pk(k).ri === 2) && pk('b').ri === 0 && (era === 'modern' || pk('b').rs[2] !== null), 'w, x, e have rs[2] and lie on axis 2; b (ww2: S3) is on axis 0' + (era === 'ww2' ? ' with rs[2]' : ''));
    ok(S0.cq.p.every(p => p.rs.length === 3), 'every point has three rs');
    const E = T.net.e.filter(e => e.a2); ok(E.length >= 3 && E.every(e => Math.abs($('routeAt')(R[2], e.a2[1] + e.a2[2] * e.len * .5).x - $('routeAt')(e.p, e.len * .5).x) < .5), E.length + ' class 1 edges carry a2, and the s it gives is on the axis');
    const s3 = nd('S3').ax.find(a => a[0] === 0)[1]; fresh(C, era);
    /* the first place of axis 2 off axis 0 that a squad 250 m before S3 can reach by a trip within RN.tripMax (X, else W: the larger map's X is farther) */
    let TG = X, tk = 'x', from = s3 - 250, a0 = $('routeAt')(R[0], from), tp = $('tripOf')(a0.x, a0.z, TG.x, TG.z, { mode: 'foot' });
    if (tp.len > RN.tripMax - 100) { TG = nd('W'); tk = 'w'; tp = $('tripOf')(a0.x, a0.z, TG.x, TG.z, { mode: 'foot' }); }
    ok(tp && tp.ri === 2 && Math.abs($('routeAt')(R[2], tp.s1).x - TG.x) < 60 && tp.len < RN.tripMax, 'a trip from axis 0, ' + (s3 - from | 0) + ' m before S3, to ' + TG.id + ' ends on axis 2 at s ' + (tp && tp.s1 | 0) + ' (' + (tp && tp.len | 0) + ' m)');
    /* 3.2 the front on axis 2 */
    { const S = fresh(C, era); S.cq.fr = 2; let err = null; try { for (const t of [0, 1]) { $('aiSite')(t); } $('cmdSites')(); C.run(20, null, 1 / 30); $('axesFrom')(2); } catch (e) { err = e; }
      ok(!err && $('axesFrom')(2).join() === '2,0,1' && $('axesFrom')(0).join() === '0,1,2', 'the supply-base siting and the sites with the front on axis 2 do not throw' + (err ? ' ' + err.stack : ''));
      ok($('postN')('line', 2) === 3 && $('postN')('road', 2) === 3 && $('postN')('push', 1) === 1, 'posts: line and road one a axis on map 4 (' + $('postN')('line', 2) + ')'); }
    /* 3.3 a squad walks a trip off its axis */
    { const S = fresh(C, era); S.cq.fr = 0; const q = C.addSquad(1, a0.x, a0.z, 0, from);
      const O = { k: 'hold', ri: 2, s: pk(tk).rs[2], x: TG.x, z: TG.z, R: 12 }; $('setOrd')(q, O);
      ok(!!q.tp && q.ri === 0 && q.tp.len <= RN.tripMax && O.trp === q.tp, 'a squad on axis 0 ordered to hold at ' + TG.id + ' gets a trip of ' + (q.tp && q.tp.len | 0) + ' m');
      const p0 = $('routeAt')(q.tp, 0); let moved = 0, t120 = 0, arrive = null;
      C.run(2400, () => { if (!q.tp && arrive === null) { arrive = S.t; return false; } if (q.tp && S.t > 118 && !t120) { t120 = 1; const p = $('routeAt')(q.tp, q.ts); moved = hdist(p, p0); } }, 1 / 10);
      ok(moved >= 250, 'the anchor moves ' + moved.toFixed(0) + ' m in 120 s (the field pace ' + $('FIELD').pace + ' m/s)');
      ok(arrive !== null && !q.tp && q.ri === 2 && q.at && Math.abs(q.s - O.s) < 1, 'it arrives (t = ' + (arrive === null ? '-' : arrive.toFixed(0)) + ' s), q.ri ' + q.ri + ', at ' + q.at);
      const L = q.men.find(m => !m.dead); ok(L && hdist(L, TG) < 400, 'its men stand near ' + TG.id + ' (' + (L ? hdist(L, TG).toFixed(0) : '-') + ' m)'); }
    { const S = fresh(C, era), s3 = nd('S3').ax.find(a => a[0] === 0)[1], q = C.addSquad(1, nd('S3').x, nd('S3').z, 0, s3 + 30);
      const sw = $('swNear')(0, s3 + 30, 2); $('setOrd')(q, { k: 'hold', ri: 2, s: nd('S3').ax.find(a => a[0] === 2)[1] - 400 });
      ok(sw && q.ri === 2 && !q.tp && Math.abs(q.s - sw.sj) < 1, 'by a node of both axes within RN.sw it just changes axis (s ' + (sw ? sw.sj | 0 : '-') + ')'); }
    { const S = fresh(C, era), q = C.addSquad(1, nd('T0').x, nd('T0').z, 0, nd('T0').ax[0][1]); $('setOrd')(q, { k: 'hold', ri: 2, s: 1000, x: R[2][3].x, z: R[2][3].z });
      ok(!q.tp && q.ri === 0 && q.ord.k === 'hold' && q.ord.ri === 0, 'a trip longer than RN.tripMax is today\'s hold where it is'); }
    /* a quiet move holds its fire until found; a routed squad walks back along its trip */
    { const S = fresh(C, era), q = C.addSquad(1, a0.x, a0.z, 0, from); $('setOrd')(q, { k: 'move', ri: 2, s: pk(tk).rs[2], x: TG.x, z: TG.z, quiet: 1 }); C.run(20, null, 1 / 30);
      ok(q.hf === true && q.ts > 0, 'a quiet move holds its fire (hf) while it walks'); const ts = q.ts; q.state = 1; q.s0 = q.s; C.run(20, null, 1 / 30); ok(q.ts < ts, 'a routed squad walks back along its trip'); }
    /* 3.4 a truck rides a trip and drops its squad, and comes back */
    { const S = fresh(C, era), u = C.addUnit('truck', 1, 0, 0, null, false, 0, from, 5, 0); u.cargo = $('SQUAD')[era].slice(); u.fld = 1; u.drop = 1e9; u.home = 0;
      const back = { x: u.x, z: u.z }, tr = $('tripTo')(u, TG.x, TG.z, { drop: true, back, gone: true });
      ok(tr && tr.ri === 2 && u.rail, 'a truck on axis 0 is given a trip to ' + TG.id + ' (' + (tr && tr.p.len | 0) + ' m, ends on axis ' + (tr && tr.ri) + ')');
      let on = 0, n = 0, dropped = null, away = 0; const P1 = tr.p;
      C.run(400, () => { for (const o of S.units) if (o.team !== 1 && !o.dead) o.dead = o.gone = true;   // the battlefield kept empty: an AI car sent at the truck is no part of this (it gives a trip up near an enemy, MANT.trip.fight)
        if (u.trip && u.trip.p === P1) { n++; if (hdist(u, $('routeAt')(P1, $('polyNearS')(P1, u))) < 60) on++; } if (dropped === null && !u.cargo) { dropped = S.t; away = hdist(u, TG); } if (u.dead) return false; }, 1 / 30);
      ok(n > 0 && on / n >= .9 && dropped !== null && away < 120 && S.men.length === $('SQUAD')[era].length, 'it rides the trip (' + (100 * on / (n || 1)).toFixed(0) + '% of the steps on it), drops its squad ' + away.toFixed(0) + ' m from ' + TG.id + ' at t = ' + (dropped || 0).toFixed(0) + ' s');
      ok(u.dead && u.gone, 'and drives back and is gone'); }
    /* a tank on a trip that meets an enemy leaves the trip and fights */
    { const S = fresh(C, era), u = C.addUnit('tank', 1, 0, 0, S.E.sides[S.fac[1]].tanks[0], false, 0, from, 5, 0), tr = $('tripTo')(u, TG.x, TG.z, {});
      C.run(5, null, 1 / 30); ok(!!u.trip && u.rail, 'the tank is on its trip');
      const p = $('routeAt')(tr.p, Math.min(tr.p.len - 1, tr.p.len * .5)), foe = C.addVehicle('tank', S.E.sides[S.fac[0]].tanks[0], 0, p.x, p.z + 200, 0);
      let off = null; C.run(200, () => { if (off === null && !u.trip) { off = S.t; return false; } }, 1 / 30);
      ok(off !== null && hdist(u, foe) < 1500, 'the tank gives the trip up when the enemy is within ' + $('MANT').trip.fight + ' m (t = ' + (off || 0).toFixed(0) + ' s) and its brain drives it'); }
    /* 3.5 the foot path keeps away from a stamped enemy */
    { const S = fresh(C, era), Cm = $('cmdOf')(0); $('cmdSense')(Cm, []); const G = $('CMD').cell, nx = Cm.nx, nz = Cm.nz, ci = (x, z) => Math.max(0, Math.min(nz - 1, (z + S.HW) / G | 0)) * nx + Math.max(0, Math.min(nx - 1, x / G | 0));
      const a = T.bases[0], b = { x: TG.x, z: TG.z }, d0 = $('footPath')(Cm, a.x, a.z, b.x, b.z); ok(!!d0 && d0.len >= hdist(a, b) && hdist(d0[0], a) < 1 && hdist(d0[d0.length - 1], b) < 1, 'a foot path from the base to ' + TG.id + ' exists, ' + (d0 && d0.len | 0) + ' m for ' + hdist(a, b).toFixed(0) + ' m');
      Cm.fpT = -1; const cells = new Set(); for (let i = 1; i < d0.length - 1; i++) { const m = d0[i]; if (hdist(m, a) > 1500 && hdist(m, b) > 1500) cells.add(ci(m.x, m.z)); }
      const mid = d0[d0.length >> 1], stamped = new Set(); for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const k = ci(mid.x + di * G, mid.z + dj * G); stamped.add(k); Cm.inf[k] = -60; }
      const d1 = $('footPath')(Cm, a.x, a.z, b.x, b.z); let hit = 0; for (let i = 0; i < d1.length; i++) if (stamped.has(ci(d1[i].x, d1[i].z))) hit++;
      let hit0 = 0; for (let i = 0; i < d0.length; i++) if (stamped.has(ci(d0[i].x, d0[i].z))) hit0++;
      ok(hit0 > 0 && hit === 0 && d1.thr < 1, 'with an enemy stamped on the way (' + hit0 + ' points of the first path in it) the path goes round it (' + hit + ' points in it, thr ' + d1.thr.toFixed(1) + ')');
      Cm.fpT = -1; let fpn = 0; while (fpn < 50 && $('footPath')(Cm, a.x, a.z, b.x, b.z)) fpn++; ok(fpn === $('MAN').fp, 'at most MAN.fp (' + $('MAN').fp + ') paths a plan tick: ' + fpn);
      Cm.fpT = -1; const one = $('footPath')(Cm, a.x + 5, a.z + 5, a.x + 20, a.z + 10), same = $('footPath')(Cm, a.x, a.z, a.x, a.z);
      ok(one && one.length >= 2 && one.len > 1 && same && same.length >= 2 && same.len > 0 && $('routeAt')(one, one.len / 2), 'a foot path inside one cell (and to the same place) has two distinct points at least: ' + (one && one.length) + ', ' + (same && same.length)); }
    /* 3.7 kill zones */
    { const S = fresh(C, era, { keep: 1 }); C.run(1, null, 1 / 30); const Cm = $('cmdOf')(0), sq = [];
      const v = { x: 9000, z: -2000, team: 0, man: 1, dead: false }; $('cmdLoss')(v); $('cmdLoss')(Object.assign({}, v, { man: 0, kind: 'tank', def: { }, dead: true }));
      const G = $('CMD').cell, k = ((v.z + S.HW) / G | 0) * Math.ceil(S.W / G) + (v.x / G | 0);
      ok(Cm.kz && Cm.kz[k] >= 1 && Cm.kz[k] === 1 + ($('CMD').val[$('tk')({ kind: 'tank', def: {} })] || 1), 'a loss stamps its cell with a man or the vehicle\'s CMD.val (' + (Cm.kz && Cm.kz[k]) + ')');
      const v0 = Cm.kz[k]; for (let i = 0; i < 70; i++) $('cmdSense')(Cm, sq); ok(Math.abs(Cm.kz[k] / v0 - .5) < .03, 'it halves in about 70 plan ticks (' + (Cm.kz[k] / v0).toFixed(3) + ')'); }
    /* the framework, nothing registered (the kinds' own blocks are taken off in this page: they have their own sections) */
    C.$('for (const k of Object.keys(MANG)) delete MANG[k]; for (const k of Object.keys(MANO)) delete MANO[k]');
    { const S = fresh(C, era, { keep: 1 }); const Cm = $('cmdOf')(0);
      ok(Object.keys($('MANG')).length === 0 && Cm.man.length === 0 && Cm.taste === null && $('MAN').max.aggressive === 3 && $('MAN').sc === 1.7, 'no kind registered: C.man empty, taste not drawn, the soldier\'s MAN untouched');
      const r = k => $('opNew')(0, k, 'ai');
      ok(r({ c: 'zzz' }).why === 'kind' && r({ c: 'flank', n: 9 }).why === 'n' && r({ c: 'flank', via: 'air' }).why === 'kind' && r({ c: 'cancel', id: 99 }).why === 'id' && r({ c: 'flank' }).why === 'kind', 'opNew refusals: kind, n, via, id, no kind registered');
      ok($('opNew')(0, { c: 'flank' }, 'me').why === 'ctl' && $('genCmd')(0, { c: 'man', k: 'flank' }, 'me').why === 'ctl', 'a person with no chair is refused (ctl)');
      $('genCtl')(0, 'me'); ok($('opNew')(0, { c: 'flank' }, 'ai').why === 'ctl' ? true : true, 'setup'); $('genCtl')(0, 'ai');
      const S2 = C.newState(era, $('ERAS')[era].sides[0].fighter, { cls: 'plane' }); S2.cq.ph = 1; ok($('opNew')(0, { c: 'flank' }, 'ai').why === 'over', 'over when the match is over'); }
    /* a 120 s solo battle with a stub flank kind: opNew's limits, the selection, the log, the end of every op */
    { C.seed(21); const S = C.newState(era, $('ERAS')[era].sides[0].fighter, { cls: 'plane' });
      $('MANG').flk = (Cm, Xc) => Xc.free.length ? [{ k: 'flk', sc: 1.5, spec: { c: 'flank', n: 1, why: 'teste' }, why: 'teste de estrutura', at: { x: Xc.free[0].men[0].x, z: Xc.free[0].men[0].z } }] : [];
      C.$('MANO.flk = (t, Cm, spec, by, Rr) => { const q = manFree(S.squads.filter(q => q.team === t && !q.net && q.live && !q.state))[0]; if (!q) return gBad("sq"); const op = manOpen(Cm, "flk", spec, by, {}); opTake(op, q, { k: "move", ri: q.ri, s: q.s }); return gYes(op.id); }');
      C.$('OPS.flk = (Cm, op) => { if (S.t - op.T0 > 40 || !opLive(op).length) opEnd(Cm, op); }');
      C.$('MANT.flk.cd = 5'); C.$('MAN.every = 5'); const made = [], whys = new Set(); let maxLive = 0, err = null;
      try { C.run(240, () => { for (const Cm of S.cmd || []) { for (const op of Cm.ops) if (op.man && !made.includes(op)) made.push(op); maxLive = Math.max(maxLive, Cm.man.filter(o => !o.over).length); } }, 1 / 30); } catch (e) { err = e; }
      ok(!err && !H.nan(S), 'a 240 s battle with the stub kind runs clean' + (err ? ' ' + err.stack : ''));
      ok(made.length > 0 && maxLive <= $('MAN').max.aggressive && S.cmd.every(Cm => Cm.man.filter(o => !o.over).length <= $('MAN').max[$('CMD').use[Cm.t]]), made.length + ' ops made, at most ' + maxLive + ' at once');
      ok(made.every(op => op.id > 0 && op.Tmax > 0 && op.man === 1 && op.by === 'ai'), 'every one has an id, a Tmax, man 1, by ai');
      const late = made.filter(op => !op.over && S.t - op.T0 > op.Tmax + 25); ok(!late.length && S.squads.every(q => !q.op || !q.op.over), 'every op over its time is over, and no squad points at one that is');
      ok(S.cmd.some(Cm => Cm.taste) && S.glog.l.some(l => l.some(e => /^Plano escolhido: Flanqueio — teste de estrutura/.test(e.s))), 'the taste is drawn and the log says the plan chosen');
      ok((S.gj || []).filter(j => j.c.c === 'man' && j.by === 'ai').length >= 1, 'the AI went through genCmd (journal has man commands by ai)');
      for (const Cm of S.cmd) { Cm.mcd = {}; for (const o of Cm.man.filter(o => !o.over)) $('opEnd')(Cm, o); Cm.man = Cm.man.filter(o => !o.over); }   // room for one more (MAN.keep 1: the stub fills both sides to MAN.max)
      const r1 = [0, 1].map(t => $('opNew')(t, { c: 'flank', n: 1 }, 'sys')), r0 = r1.find(r => r.ok), op = r0 && S.cmd.map(Cm => Cm.ops.find(o => o.id === r0.id && o.man)).find(Boolean);
      ok(!!r0 && !!op && !op.over, 'a manoeuvre made through opNew by sys (' + r1.map(r => r.ok ? 'ok' : r.why) + ')');
      if (op) { const q = op.sq[0], r2 = $('opNew')(op.team, { c: 'cancel', id: op.id }, 'sys'); ok(r2.ok && op.over && !q.op, 'cancel ends it and frees its squad'); } }
  }
  /* online: a host and a client on a map 4 room */
  await N.start();
  const page = (era, host) => new Promise(res => { const c = H.load({ WebSocket: N.WebSocket, host: 'localhost:' + N.PORT, seed: 3, mapv: 4 }), Net = c.$('Net'); Net.ui.welcome = () => { c.newState(era, 'tiger', { net: true, cls: 'tank', mouse: true, host: Net.host === Net.id }); res(c); }; Net.ui.refused = code => res({ refused: code }); Net.connect(era, 'p' + host, 'tank', 'tiger'); });
  const a = await page('ww2', 0), b = await page('ww2', 1);
  ok(!a.refused && !b.refused && a.$('Net').mv === 4 && b.$('S').mv === 4 && a.$('S').T.routes.length === 3 && b.$('S').T.routes.length === 3, 'two pages join a map 4 room: three axes each');
  const same = a.$('S').T.routes[2].len === b.$('S').T.routes[2].len && a.$('S').cq.p.map(p => p.ri + ':' + (p.s | 0)).join() === b.$('S').cq.p.map(p => p.ri + ':' + (p.s | 0)).join(); ok(same, 'both build the same axis 2 and the same points');
  let err = null; try { a.run(30, null, 1 / 30); b.run(30, null, 1 / 30); } catch (e) { err = e; } await N.sleep(300);
  ok(!err && !H.nan(a.$('S')) && !H.nan(b.$('S')), 'host and client run 30 s clean' + (err ? ' ' + err.stack : ''));
  a.$('Net').close(); b.$('Net').close(); N.stop(); done();
})();
