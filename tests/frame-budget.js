'use strict';
/* F0, the AI's frame budget: the meter (AIB), the commander's plan and the look (spot) cut across steps, and the LOD of a soldier's thinking.
   Nothing here times the machine: the cuts are counted in steps and pieces, and the LOD is checked against the same battle without it */
const H = require('./harness'), { performance } = require('perf_hooks'), ok = H.ok;
const battle = (seed, secs, o) => {   // the AI x AI watch as the page plays it: the economy, friendly fire and the road network on
  const C = H.load(Object.assign({ seed, eco: 1, ff: 1, mapv: 4 }, o)); C.performance = performance;
  const S = C.newState('ww2', null, { watch: 1 }); if (secs) C.run(secs); return { C, S: C.$('S'), $: C.$ };
};

console.log('-- the meter: the AI time of each step, the commander apart, against the budget --');
{
  const { C, $ } = battle(5, 12), A = $('AIB'), st = A.stat();
  ok(st.frames >= 12 * 60 - 2 && st.n === A.win, 'it counts every step (' + st.frames + ') and keeps the last ' + A.win);
  ok([st.avg, st.worst, st.gen, st.genWorst, st.max].every(v => Number.isFinite(v) && v >= 0), 'mean ' + st.avg + ' ms, worst ' + st.worst + ' ms, commander ' + st.gen + ' ms (worst ' + st.genWorst + ')');
  ok(st.gen <= st.avg && st.genWorst <= st.worst + 1e-6 && st.worst <= st.max + 1e-6, 'the commander is part of the total, the window part of the whole battle');
  ok(A.avg === 4 && A.worst === 8 && A.gen === 1 && typeof st.ok === 'boolean', 'the budget: 4 ms a step on average, 8 ms at worst, 1 ms for the commander (ok ' + st.ok + ')');
  C.newState('ww2', null, { watch: 1 }); C.run(.1);
  ok(A.stat().frames <= 6, 'a new battle starts the count again');
}

console.log('-- the plan: a piece a step, as the whole plan of before --');
{
  const { C, S, $ } = battle(7, 0), at = {}, spy = n => C.$(n + ' = (f => function (...a) { __at(' + JSON.stringify(n) + '); return f.apply(this, a); })(' + n + ')');
  C.__at = n => (at[n] || (at[n] = [])).push(S.t);
  for (const n of ['cmdSense', 'cmdAttack', 'cmdDefend', 'trnPlan', 'cmdReq']) spy(n);
  C.run(30);
  const n = at.cmdSense ? at.cmdSense.length : 0, gaps = [];
  for (const t0 of at.cmdSense || []) { const t1 = (at.cmdReq || []).find(t => t >= t0); if (t1 !== undefined) gaps.push(t1 - t0); }
  ok(n >= 18, 'both commanders plan, ' + n + ' times in 30 s (every ' + $('FIELD').every / 2 + ' s in turn)');
  ok(gaps.length >= n - 1 && gaps.every(g => g > 0), 'no plan runs whole in one step: from what it knows to its requests, ' + Math.round(Math.min(...gaps) * 60) + ' steps at least');
  ok(gaps.every(g => g < .5), 'each plan is done within ' + Math.round(Math.max(...gaps) * 60) + ' steps, well before the next (' + $('FIELD').every * 30 + ')');
  for (const k in at) at[k] = [];
  const t = S.t, J = S.planJ; C.plan(0);
  ok(['cmdSense', 'cmdAttack', 'cmdDefend', 'trnPlan', 'cmdReq'].every(k => at[k].length === 1 && at[k][0] === t) && S.planJ === J, 'plan(t) called by hand runs all of it at once, as before, and leaves the stepped one alone');
  const ops = []; for (const C2 of S.cmd) for (const op of C2.ops) ops.push(op);
  ok(!H.nan(S) && !S.over, 'the battle goes on (' + S.squads.length + ' squads, ' + ops.length + ' operations)');
}

console.log('-- the look: cut across the steps, the same as whole --');
{
  const { C, S, $ } = battle(9, 60), SP = $('SPOT'), SL = $('SLICE'), aiJob = $('aiJob'), all = () => [...S.units, ...S.men].filter(u => !u.dead);
  let steps = 0, done = -1, pieces = 0, extra = 0;
  C.$('ecoSeen = (f => function () { __x(); return f(); })(ecoSeen)'); C.__x = () => extra++;
  C.run(1, () => !S.spotJ || S.spotT < SP.every - 1e-9); const x0 = extra;   // to the step a look begins
  C.run(1, () => S.spotT < SP.every - 1e-9); const N = S.spotJ && S.spotJ.n;
  ok(!!S.spotJ && S.spotN < N, 'a new look is a job of ' + N + ' pieces, ' + S.spotN + ' a step');
  ok(S.spotN <= Math.ceil(N / (SP.every * 60 / SL.spot)), 'cut to end in ' + SP.every / SL.spot + ' s of steps');
  ok(extra === x0 + 1, 'what wraps the look (the economy\'s) runs once, in the step the look begins, as before');
  C.run(SP.every, () => { steps++; if (!S.spotJ && done < 0) done = steps; });
  ok(done > 1 && done <= Math.ceil(SP.every * 60 / SL.spot) + 1, 'it ends ' + done + ' steps after it began, before the next look');
  const live = all(), mark = () => { for (const u of live) u.seenT = -99; }, seen = () => live.filter(u => u.seenT === S.t).map(u => live.indexOf(u)).join();
  mark(); C.spot(); const whole = seen();
  mark(); let J = $('spotJob')(); while (J) { J = aiJob(J, 7); pieces++; } const cut = seen();
  ok(whole === cut && whole.length > 0, 'cut in ' + pieces + ' parts, the same ' + whole.split(',').length + ' of ' + live.length + ' units are seen as by the whole look');
  ok(!H.nan(S), 'the battle goes on');
  S.units = S.units.slice(0, 10); S.men = S.men.slice(0, 20); S.squads = S.squads.slice(0, 5); C.run(SP.every + .05);
  ok(!S.spotJ, 'a look of ' + SL.min + ' pieces or fewer (here ' + (S.units.length + S.men.length + S.squads.length + 2) + ') is not cut: it runs whole, as before');
}

console.log('-- LOD: a squad holding its post far from anyone thinks every 3 s, and at once when someone comes --');
{
  const one = lod => {
    const C = H.load({ seed: 21 }), $ = C.$, S = C.sandbox('ww2'), r = S.T.routes[0], s = r.len / 2, p = $('routeAt')(r, s);
    S.over = false; S.demo = false; S.waveTimer = S.planT = 1e9; S.base[0].hp = S.base[1].hp = 1e9; S.my = null; $('LOD').on = lod; C.director = () => {};
    C.run(.05); S.units = []; S.men = []; S.squads = []; S.planes = [];   // nobody else on the map
    const q = C.addSquad(0, p.x + 20, p.z, 0, s); q.job = 'held'; C.setOrd(q, { k: 'hold', ri: 0, s, x: p.x, z: p.z, R: 8 });
    let n = 0; C.$('manThink = (f => function (m) { if (m.sq === __q) __n(); return f(m); })(manThink)'); C.__q = q; C.__n = () => n++;
    C.run(40); const n0 = n; C.run(30); return { C, $, S, q, think: (n - n0) / q.live, r, s };
  };
  const a = one(1), b = one(0), pos = o => o.q.men.map(m => [m.x.toFixed(3), m.z.toFixed(3), m.st, m.h.toFixed(3)].join()).join(';');
  ok(a.q.at && a.q.lod === 2, 'at its post with no enemy within ' + a.$('LOD').near + ' m: tier 2 (post)');
  ok(Math.abs(a.think - 30 / 3) <= 1.5 && Math.abs(b.think - 30 / a.$('IAI').think) <= 2, 'a soldier thinks ' + a.think.toFixed(1) + ' times in 30 s (without LOD ' + b.think.toFixed(1) + ')');
  ok(pos(a) === pos(b), 'and the squad stands, faces and lies exactly as without it');
  const { C, $, S, q, r, s } = a, IAI = $('IAI'), p2 = $('routeAt')(r, s - 1200), e = C.addSquad(1, p2.x, p2.z, 0, s - 1200);
  C.setOrd(e, { k: 'hold', ri: 0, s: s - 1200, x: p2.x, z: p2.z, R: 8 });
  C.run($('SPOT').every * 1.01);
  ok(q.lod === 0 && q.men.every(m => m.dead || m.ai.think <= IAI.think), 'an enemy squad 1200 m off: contact, and each man thinks again within ' + IAI.think + ' s');
  C.setOrd(q, { k: 'assault', ri: 0, s: s - 3000 }); for (const m of e.men) m.dead = true; S.men = S.men.filter(m => !m.dead);
  C.run(25);
  ok(q.lod === 1 && $('lodThink')(q.men.find(m => !m.dead)) === IAI.think, 'on the march: tier 1, at the usual pace');
  q.men[0].hitT = S.t; C.setOrd(q, { k: 'hold', ri: 0, s: q.s, R: 8 }); C.run(3);
  ok(q.lod === 0, 'a man of it hit: contact for ' + $('LOD').calm + ' s');
}

H.done();
