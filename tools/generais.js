#!/usr/bin/env node
'use strict';
/* tools/generais.js: how each AI general plays a match under the points rule (no tickets since #260: the side with more points when the
   clock runs out wins). Plays headless AI × AI conquest matches on the real simulation (tests/harness.js, economy, logistics and recovery on)
   and records, per side, what its general did with what it had:
     eco      income, how busy each producer was (prod: HQ slots for infantry and aircraft, factories for vehicles), what it spent (on the build queue and outside it: forts, logistics, strikes...), what the cap threw away, the stock it sat
              on, why its queue waited (falta energia / metal, aguardando a vez, sem fábrica, reserva cheia), what it bought and built
     cmd      every command the AI sent through the funnel (genCmd), ok or refused and why
     ops      every operation the general opened (assaults, counter-attacks, QRFs, manoeuvres such as raids, interdictions, envelopments,
              ambushes, campaigns): how many, for how long, how they ended; the assaults' time by stage (reunião, assalto, combate...)
     thr      the threat board (C.thb): each incident it saw, how fast it answered, what it ignored and why, points lost meanwhile
     para     paratrooper drops: sent, men out, shot down, did the point near the drop become theirs; the reserve held for them (paraHold,
              cf-general-reservas: hold the squads held on average, res the share of the match with a squad in reserve, lose the share losing)
     pts      points held over time, taken and lost, point-time at the end; losses (men, vehicles, aircraft)
     jobs     the squads' jobs as a share of squad-time (garrison, line, assault, reserve...)
     pop      the population budget (GP): the share of it out (men, vehicles, aircraft) and of the match at the cap; the production plan's stance
     plan     the manoeuvres its planner weighed (C.mev: every candidate, and those over MAN.min) beside those it ran; each route's posture
              (ataque, manter, defesa) as a share of the match
     log      the general's own log lines, by kind and by template (numbers and names stripped)
   and a time series every 60 s (held, stock, income, losses, squads) for charts.

     node tools/generais.js [--lados 2,3] [--seeds 1,2,3] [--min 20] [--era modern] [--mapv 11] [--jobs 2] [--out dir] [--nice 10]
     node tools/generais.js --agg <dir>        aggregates the match files already in <dir> again (no match played)
     --board <html> also puts the aggregate into that board's data block (docs/generais-analytics.html draws its charts from it)
   Each match is a child process (nice --nice) writing <out>/m-<era>-<n>l-s<seed>.json; then <out>/generais.json (every match and the
   aggregate) and <out>/generais.csv (one row per match and side) so a later run can be diffed against this one. A match that crashes
   (main has a rare routeAt crash in long AI × AI matches) keeps what it measured with err set. PAGE=<page> measures another copy of the page.
   AIB.now is frozen (as balance.js --nobudget does), so the population cap does not depend on how busy the machine is. */
const fs = require('fs'), path = require('path'), os = require('os'), { fork } = require('child_process');
const H = require(path.join(__dirname, '..', 'tests', 'harness.js'));

function args(a) {
  const o = { sides: [2, 3], seeds: [1, 2, 3], min: 20, era: 'modern', mapv: 11, jobs: 2, out: path.join(process.cwd(), 'generais-out'), nice: 10 };
  for (let i = 0; i < a.length; i++) {
    const k = a[i], v = () => a[++i];
    if (k === '--lados' || k === '--sides') o.sides = v().split(',').map(Number);
    else if (k === '--seeds') o.seeds = v().split(',').map(Number);
    else if (k === '--min') o.min = +v();
    else if (k === '--era') o.era = v();
    else if (k === '--mapv') o.mapv = +v();
    else if (k === '--jobs') o.jobs = +v();
    else if (k === '--out') o.out = path.resolve(v());
    else if (k === '--nice') o.nice = +v();
    else if (k === '--agg') o.agg = path.resolve(v());
    else if (k === '--board') o.board = path.resolve(v());
    else if (k === '--one') o.one = JSON.parse(v());
    else throw new Error('unknown argument ' + k);
  }
  return o;
}

/* ---------- one match (child) */
function one(m) {
  const C = H.load({ seed: m.seed, eco: 1, lg: 1, rec: 1, mapv: m.mapv });
  const $ = C.$;
  $('AIB').now = () => 0;
  const S = C.watch(m.era, { len: 0, n: m.n, min: m.min });
  const N = S.cq.ps.length, sides = [...Array(N).keys()], Q = S.cq, pts = Q.p, ECO = $('ECO'), gName = $('gName'), t0 = Date.now();
  const R1 = v => Math.round(v * 10) / 10, R0 = Math.round;
  const side = t => ({
    t, doc: $('CMD').use[t] || null,
    eco: { inc: { en: 0, mt: 0 }, spentQ: { en: 0, mt: 0 }, other: { en: 0, mt: 0 }, gain: { en: 0, mt: 0 }, waste: { en: 0, mt: 0 }, stock: { en: 0, mt: 0 }, T: 0,
      capT: { en: 0, mt: 0 }, prod: {}, richT: 0, idleT: 0, qT: 0, why: {}, bought: {}, boughtCost: {}, cancel: {}, sites: {}, sitesLost: {}, resAvg: {}, resT: 0, made0: 0 },
    cmd: {}, ops: {}, atkSt: {}, atk: { n: 0, won: 0, end: 0, formMax: 0 },
    thr: { n: 0, byK: {}, resp: 0, respT: [], ign: 0, ignWhy: {}, noWhy: {}, ptLost: 0, ptN: 0 },
    para: { n: 0, men: 0, out: 0, shot: 0, took: 0, res: {}, T: 0, holdT: 0, resT: 0, loseT: 0 },
    pts: { took: 0, lost: 0, neut: 0, heldT: 0, maxHeld: 0 }, sq: { liveT: 0, opT: 0, resT: 0, idleT: 0, n: 0 },
    log: { k: {}, tpl: {} }, post: {}, jobs: {}, mev: {}, mevOk: {}, pop: { men: 0, veh: 0, air: 0, full: 0, T: 0 }, st: {} });
  const R = { seed: m.seed, n: N, era: m.era, min: m.min, mapv: m.mapv, page: path.basename(H.PAGE), sides: sides.map(side), series: [], pts: pts.map(p => ({ nm: gName(p), base: p.base, hold0: p.hold })) };
  const SD = R.sides, add = (o, k, v) => { o[k] = (o[k] || 0) + (v === undefined ? 1 : v); };

  /* the economy, exactly: ecoStep wrapped. Before it: what changed the stock since the last tick (spent or got outside the queue). After a tick:
     income, the cap's waste, what the queue paid; and the queue items that left (bought, or cancelled) */
  const E0 = () => S.eco, last = sides.map(() => null), qSeen = sides.map(() => new Map()), siteSeen = new Map();
  C.__eb = dt => {
    const E = E0(); if (!E) return null;
    return { acc: E.acc + dt, v: sides.map(t => { const d = E.d[t], L = last[t];
      if (L) for (const r of ['en', 'mt']) { const x = d[r] - L[r]; if (x < 0) SD[t].eco.other[r] -= x; else SD[t].eco.gain[r] += x; }
      return { en: d.en, mt: d.mt }; }) };
  };
  C.__ea = b => {
    const E = E0(); if (!E || !b) return;
    const ticked = E.acc < b.acc - 1e-9 && b.acc >= ECO.dt;
    for (const t of sides) {
      const d = E.d[t], s = SD[t].eco;
      if (ticked) {
        const e = b.acc;
        for (const r of ['en', 'mt']) {
          const g = d.inc[r] / 60 * e, top = b.v[t][r] + g, kept = Math.min(ECO.cap[r], top);
          s.inc[r] += g; s.waste[r] += Math.max(0, top - kept); s.spentQ[r] += Math.max(0, kept - d[r]);
          s.stock[r] += d[r] * e; if (d[r] >= ECO.cap[r] - 1) s.capT[r] += e;
        }
        s.T += e;
        if (d.en >= 500 && d.mt >= 500) s.richT += e;
        const pb = {}; for (const q of d.q) if (q.cat !== 'site' && q.at !== null && q.p < 1 && !q.why) pb[q.cat] = 1;   // a producer at work: an order at it, paid as it goes
        for (const c of ['inf', 'veh', 'air']) add(s.prod, c, pb[c] ? e : 0);
        if (!d.q.length) s.idleT += e; else { s.qT += e; for (const q of d.q) add(s.why, q.why || 'ok', e / d.q.length); }
        let rn = 0; for (const k in d.res) { const n = d.res[k].length; rn += n; add(s.resAvg, k, n * e); }
        s.resT += e; add(s, 'resSum', rn * e);
        const seen = qSeen[t], now = new Set(d.q);
        for (const q of d.q) if (!seen.has(q)) seen.set(q, { k: q.k, cat: q.cat });
        for (const [q, r] of seen) if (!now.has(q)) {
          seen.delete(q);
          if (q.p >= 1) { add(s.bought, r.k); add(s.boughtCost, r.k, R0(q.paid.en + q.paid.mt)); } else add(s.cancel, r.k);
        }
      }
      last[t] = { en: d.en, mt: d.mt };
    }
    for (const e of E.l) {
      if (!siteSeen.has(e) && e.prog >= 1) { siteSeen.set(e, 1); if (S.t > 1) add(SD[e.team].eco.sites, e.k); }
      if (siteSeen.get(e) === 1 && e.dead) { siteSeen.set(e, 2); add(SD[e.team].eco.sitesLost, e.k); }
    }
  };
  $('ecoStep = (g => function (dt) { const b = globalThis.__eb(dt); g.apply(this, arguments); globalThis.__ea(b); })(ecoStep)');
  /* every command the AI sends through the funnel */
  C.__gc = (t, c, r, by) => { if (!SD[t] || by === 'player') return; const k = c.c + (c.k && typeof c.k === 'string' ? ':' + c.k : ''), o = SD[t].cmd[k] || (SD[t].cmd[k] = { ok: 0, no: 0, why: {} });
    if (r && r.ok) o.ok++; else { o.no++; add(o.why, (r && r.why) || '?'); } };
  $('genCmd = (g => function (t, c, by) { const r = g.apply(this, arguments); try { globalThis.__gc(t, c || {}, r, by || "ai"); } catch (e) {} return r; })(genCmd)');
  /* the general's log, each line once (gLog drops repeats within GEN.dup s itself) */
  const tpl = s => String(s).replace(/[A-Z]\s·\s[^:,;—(]+/g, '◦').replace(/-?\d+([.,]\d+)?/g, '#').split(/\s+/).slice(0, 7).join(' ');
  C.__gl = (t, k, s) => { if (!SD[t]) return; add(SD[t].log.k, k); add(SD[t].log.tpl, tpl(s)); };
  $('gLog = (g => function (t, k, s) { const L = S.glog && S.glog.l && S.glog.l[t], e0 = L && L[L.length - 1]; g.apply(this, arguments); const L2 = S.glog && S.glog.l && S.glog.l[t]; if (L2 && L2.length && L2[L2.length - 1] !== e0) try { globalThis.__gl(t, k, s); } catch (e) {} })(gLog)');

  /* every 2 s: operations, the threat board, drops, points, squads */
  const mevSeen = sides.map(() => null), opSeen = new Map(), thSeen = new Map(), drSeen = new Map(), hold = pts.map(p => p.hold);
  const nearPt = (x, z, r) => { let b = null, bd = r; for (const p of pts) { const d = Math.hypot(p.x - x, p.z - z); if (d < bd) { bd = d; b = p; } } return b; };
  const popUse = $('popUse'), popOf = $('popOf');
  const opKey = o => (o.man ? 'man:' : '') + o.k;
  function sample(dt) {
    for (const t of sides) {
      const Cc = S.cmd && S.cmd[t], s = SD[t]; if (!Cc) continue;
      for (const [list, pre] of [[Cc.ops, ''], [Cc.amb, 'amb:'], [Cc.camp || [], 'camp:']]) for (const o of list) {
        if (!o) continue;
        let r = opSeen.get(o);
        const key = pre + (pre === 'camp:' ? 'camp' : opKey(o));
        if (!r) { r = { t, key, T: S.t, end: 0, P: o.O ? nearPt(o.O.x, o.O.z, 600) : null, h: 0 }; opSeen.set(o, r); const st = s.ops[key] || (s.ops[key] = { n: 0, T: 0, by: {} }); st.n++; add(st.by, o.by || 'ai'); if (o.k === 'atk' && !pre) s.atk.n++; }
        if (r.end) continue;
        if (r.pass === S.t) continue; r.pass = S.t;
        if (!o.over) { s.ops[r.key].T += dt; if (o.k === 'atk' && !pre) { add(s.atkSt, o.st || '?', dt); if (o.st === 'form') s.atk.formMax = Math.max(s.atk.formMax, R0(S.t - r.T)); } }
        else { r.end = 1; if (o.k === 'atk' && !pre) { s.atk.end++; if (r.P && r.P.hold === t) s.atk.won++; } }
      }
      { const p = s.para, pr = S.prs && S.prs[t]; p.T += dt; if (pr) { p.holdT += pr.n * dt; if (pr.lose) p.loseT += dt; } if (S.eco && (S.eco.d[t].res.squad || []).length) p.resT += dt; }
      if (S.eco) { const U = popUse(t), P = popOf(t), o = s.pop, pp = S.eco.d[t].pp; o.T += dt; for (const k of ['men', 'veh', 'air']) o[k] += (P[k] ? Math.min(1.5, U[k] / P[k]) : 0) * dt;
        if (U.men >= P.men || U.veh >= P.veh) o.full += dt; if (pp) add(s.st, ['atk', 'bal', 'def'][pp.st] || '?', dt); }
      for (const p of Cc.post || []) if (p) add(s.post, p, dt / Math.max(1, (Cc.post || []).length));
      if (Cc.mev && Cc.mev !== mevSeen[t]) { mevSeen[t] = Cc.mev; for (const c of Cc.mev) { add(s.mev, c.k); if (c.ok) add(s.mevOk, c.k); } }
      for (const I of Cc.thb || []) {
        let r = thSeen.get(I);
        if (!r) { r = { t, k: I.k, T0: I.T0, resp: 0, ign: 0, P: I.k === 'pt' ? pts[+String(I.pk).slice(1)] : null }; thSeen.set(I, r); s.thr.n++; add(s.thr.byK, I.k); if (r.P) s.thr.ptN++; }
        if (I.st === 'resp' && !r.resp) { r.resp = 1; s.thr.resp++; s.thr.respT.push(R0(S.t - I.T0)); }
        if (I.st === 'ign' && !r.ign) { r.ign = 1; s.thr.ign++; add(s.thr.ignWhy, String(I.why).replace(/\(.*$/, '').replace(/\d+/g, '#').trim()); }
        if (I.st === 'open' && I.why) r.no = I.why;
        if (r.P && r.P.hold !== t && !r.lost) { r.lost = 1; s.thr.ptLost++; }
      }
    }
    for (const [I, r] of thSeen) if (!r.done && (I.over || !(S.cmd[r.t].thb || []).includes(I))) { r.done = 1; if (!r.resp && !r.ign && r.no) add(SD[r.t].thr.noWhy, String(r.no).replace(/\d+/g, '#')); }
    for (const D of S.pdr || []) {
      let r = drSeen.get(D);
      if (!r) { r = { t: D.t, T: S.t, P: nearPt(D.x, D.z, 1500) }; drSeen.set(D, r); const p = SD[D.t].para; p.n++; p.men += D.n || 0; }
      if (!r.end && D.end) { r.end = 1; const p = SD[D.t].para; p.out += D.out || 0; if (/abatid/i.test(D.res || '')) p.shot++; add(p.res, String(D.res || '?').replace(/\d+/g, '#').slice(0, 60)); }
      if (r.P && !r.took && r.P.hold === D.t && S.t - r.T < 300) { r.took = 1; SD[D.t].para.took++; }
    }
    pts.forEach((p, i) => {
      if (p.hold !== hold[i]) {
        if (hold[i] >= 0 && SD[hold[i]]) SD[hold[i]].pts.lost++;
        if (p.hold >= 0 && SD[p.hold]) SD[p.hold].pts.took++;
        hold[i] = p.hold;
      }
    });
    for (const t of sides) {
      const s = SD[t], h = pts.filter(p => p.hold === t && p.base < 0).length; s.pts.heldT += h * dt; s.pts.maxHeld = Math.max(s.pts.maxHeld, h);
      for (const q of S.squads) if (q.team === t && q.live > 0) { s.sq.liveT += dt; add(s.jobs, q.job || '?', dt); if (q.op) s.sq.opT += dt; else if (q.ord && q.ord.res) s.sq.resT += dt; else if (!q.ord || q.ord.k === 'hold') s.sq.idleT += dt; }
    }
  }
  function series() {
    const E = S.eco;
    R.series.push({ T: R0(S.t), held: sides.map(t => pts.filter(p => p.hold === t).length), ps: Q.ps.map(R0), lost: Q.lost.map(l => l.slice()),
      en: E ? E.d.map(d => R0(d.en)) : null, mt: E ? E.d.map(d => R0(d.mt)) : null, inc: E ? E.d.map(d => R0(d.inc.en + d.inc.mt)) : null,
      q: E ? E.d.map(d => d.q.length) : null, sq: sides.map(t => S.squads.filter(q => q.team === t && q.live > 0).length),
      veh: sides.map(t => S.units.filter(u => u.team === t && !u.dead && u.ai).length) });
  }
  let nS = 0, nT = 0, err = null;
  try {
    C.run(S.cq.T0 + 60, () => {
      if (S.t >= nS) { sample(2); nS = S.t + 2; }
      if (S.t >= nT) { series(); nT = S.t + 60; }
      return !S.cq.ph;
    }, 1 / 30);
  } catch (e) { err = String(e && e.stack || e).split('\n').slice(0, 5).join(' | '); }
  series();
  for (const [I, r] of thSeen) if (!r.done && !r.resp && !r.ign && r.no) add(SD[r.t].thr.noWhy, String(r.no).replace(/\d+/g, '#'));
  const E = S.eco;
  for (const t of sides) {
    const s = SD[t], e = s.eco, T = e.T || 1;
    { const Cc = S.cmd && S.cmd[t]; if (Cc) { s.per = Cc.pk || null; try { s.doc = $('docK')(Cc); } catch (x) {} } }
    for (const r of ['en', 'mt']) { e.stock[r] = R0(e.stock[r] / T); for (const k of ['inc', 'spentQ', 'other', 'gain', 'waste']) e[k][r] = R0(e[k][r]); e.capT[r] = R1(e.capT[r] / T); }
    e.richT = R1(e.richT / T); e.idleT = R1(e.idleT / T); e.qT = R1(e.qT / T);
    for (const k in e.why) e.why[k] = R1(e.why[k] / T);
    for (const k in e.prod) e.prod[k] = R1(e.prod[k] / T);
    for (const k in e.resAvg) e.resAvg[k] = R1(e.resAvg[k] / (e.resT || 1));
    e.resSum = R1((e.resSum || 0) / (e.resT || 1)); delete e.resT; delete e.made0; e.T = R0(e.T);
    e.made = E ? E.d[t].made : 0; e.end = E ? { en: R0(E.d[t].en), mt: R0(E.d[t].mt), res: Object.fromEntries(Object.entries(E.d[t].res).map(([k, v]) => [k, v.length]).filter(a => a[1])) } : null;
    for (const k in s.ops) s.ops[k].T = R0(s.ops[k].T); for (const k in s.atkSt) s.atkSt[k] = R0(s.atkSt[k]);
    const L = s.sq.liveT || 1; for (const k in s.jobs) s.jobs[k] = R1(s.jobs[k] / L); s.sq = { opT: R1(s.sq.opT / L), resT: R1(s.sq.resT / L), idleT: R1(s.sq.idleT / L), avg: R1(s.sq.liveT / (S.t || 1)) };
    s.pts.heldT = R0(s.pts.heldT); s.pts.end = pts.filter(p => p.hold === t).length; s.pts.ps = R0(Q.ps[t]); s.lost = Q.lost[t].slice();
    s.thr.respMed = s.thr.respT.length ? s.thr.respT.slice().sort((a, b) => a - b)[s.thr.respT.length >> 1] : null;
    { const o = s.pop, T = o.T || 1; s.pop = { men: R1(o.men / T), veh: R1(o.veh / T), air: R1(o.air / T), full: R1(o.full / T) }; for (const k in s.st) s.st[k] = R1(s.st[k] / T); }
    { const p = s.para, T = p.T || 1; p.hold = R1(p.holdT / T); p.resHeld = R1(p.resT / T); p.lose = R1(p.loseT / T); delete p.T; delete p.holdT; delete p.resT; delete p.loseT; }
    for (const k in s.post) s.post[k] = R1(s.post[k] / (S.t || 1));
    s.log.tpl = Object.fromEntries(Object.entries(s.log.tpl).sort((a, b) => b[1] - a[1]).slice(0, 25));
  }
  Object.assign(R, { T: R0(S.t), over: !!Q.ph, win: Q.res ? Q.res[0] : null, why: Q.res ? Q.res[1] : null, place: Q.place || null, err, wall: R0((Date.now() - t0) / 1000) });
  return R;
}

/* ---------- the aggregate: one row per match and side, and the means per side count and per side */
const COLS = ['seed', 'n', 't', 'place', 'win', 'ptsEnd', 'ps', 'took', 'lost_pts', 'heldAvg', 'men_lost', 'veh_lost', 'air_lost', 'inc', 'spentQ', 'other', 'waste', 'stockAvg', 'capT', 'richT', 'qIdleT', 'why_en', 'why_mt', 'why_busy', 'why_none', 'why_full',
  'bought', 'resAvg', 'atk', 'atkWon', 'atkFormMax', 'man', 'qrf', 'ctr', 'amb', 'thr', 'thrResp', 'thrRespMed', 'thrIgn', 'thrPtLost', 'para', 'paraTook', 'paraShot', 'paraHold', 'paraRes', 'sqOp', 'sqRes', 'sqIdle', 'popMen', 'popVeh', 'popFull', 'err'];
function rows(M) {
  const out = [];
  for (const m of M) for (const s of m.sides) {
    const e = s.eco, opN = p => Object.entries(s.ops).filter(([k]) => p(k)).reduce((a, [, v]) => a + v.n, 0), sum = o => Object.values(o || {}).reduce((a, b) => a + b, 0);
    out.push({ seed: m.seed, n: m.n, t: s.t, place: m.place ? m.place.indexOf(s.t) + 1 : '', win: m.win === s.t ? 1 : 0, ptsEnd: s.pts.end, ps: s.pts.ps, took: s.pts.took, lost_pts: s.pts.lost, heldAvg: Math.round(s.pts.heldT / (m.T || 1) * 10) / 10,
      men_lost: s.lost[0], veh_lost: s.lost[1], air_lost: s.lost[2], inc: e.inc.en + e.inc.mt, spentQ: e.spentQ.en + e.spentQ.mt, other: e.other.en + e.other.mt, waste: e.waste.en + e.waste.mt, stockAvg: e.stock.en + e.stock.mt,
      capT: Math.max(e.capT.en, e.capT.mt), richT: e.richT, qIdleT: e.idleT, why_en: e.why.en || 0, why_mt: e.why.mt || 0, why_busy: e.why.busy || 0, why_none: e.why.none || 0, why_full: e.why.full || 0,
      bought: sum(e.bought), resAvg: e.resSum, atk: s.atk.n, atkWon: s.atk.won, atkFormMax: s.atk.formMax, man: opN(k => k.startsWith('man:')), qrf: opN(k => k === 'qrf'), ctr: opN(k => k === 'ctr'), amb: opN(k => k.startsWith('amb:')),
      thr: s.thr.n, thrResp: s.thr.resp, thrRespMed: s.thr.respMed === null ? '' : s.thr.respMed, thrIgn: s.thr.ign, thrPtLost: s.thr.ptLost, para: s.para.n, paraTook: s.para.took, paraShot: s.para.shot, paraHold: s.para.hold === undefined ? '' : s.para.hold, paraRes: s.para.resHeld === undefined ? '' : s.para.resHeld,
      sqOp: s.sq.opT, sqRes: s.sq.resT, sqIdle: s.sq.idleT, popMen: s.pop.men, popVeh: s.pop.veh, popFull: s.pop.full, err: m.err ? 1 : 0 });
  }
  return out;
}
function csv(rs) { return COLS.join(',') + '\n' + rs.map(r => COLS.map(c => r[c]).join(',')).join('\n') + '\n'; }
function agg(dir, board) {
  const M = fs.readdirSync(dir).filter(f => /^m-.*\.json$/.test(f)).sort().map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
  const rs = rows(M), by = {};
  for (const r of rs) { const k = r.n + 'l:' + r.t, o = by[k] || (by[k] = { n: 0 }); o.n++; for (const c of COLS) if (typeof r[c] === 'number' && c !== 'seed' && c !== 'n' && c !== 't') o[c] = (o[c] || 0) + r[c]; }
  for (const k in by) for (const c in by[k]) if (c !== 'n') by[k][c] = Math.round(by[k][c] / by[k].n * 100) / 100;
  let commit = ''; try { commit = fs.readFileSync(path.join(dir, 'HEAD.txt'), 'utf8').trim().slice(0, 7); } catch (e) {}
  const doc = { at: new Date().toISOString(), page: M[0] && M[0].page, commit, matches: M, mean: by };
  fs.writeFileSync(path.join(dir, 'generais.json'), JSON.stringify(doc, null, 1));
  if (board) {   // the board (docs/generais-analytics.html) draws its charts from the JSON it carries: put this run's in it
    const html = fs.readFileSync(board, 'utf8'), a = html.indexOf('<script type="application/json" id="gdata">'), b = a < 0 ? -1 : html.indexOf('</script>', a);
    if (b < 0) throw new Error('no gdata block in ' + board);
    const head = '<script type="application/json" id="gdata">';
    fs.writeFileSync(board, html.slice(0, a) + head + JSON.stringify(doc).replace(/</g, '\\u003c') + html.slice(b));
    console.log('board ' + board);
  }
  fs.writeFileSync(path.join(dir, 'generais.csv'), csv(rs));
  console.log(M.length + ' matches → ' + path.join(dir, 'generais.json') + ', generais.csv');
  const show = ['n', 'place', 'ptsEnd', 'took', 'lost_pts', 'men_lost', 'inc', 'spentQ', 'waste', 'stockAvg', 'capT', 'why_full', 'atk', 'atkWon', 'man', 'qrf', 'thr', 'thrResp', 'para', 'paraHold', 'paraRes', 'sqIdle'];
  console.log('side   ' + show.map(c => c.padStart(9)).join(''));
  for (const k of Object.keys(by).sort()) console.log(k.padEnd(7) + show.map(c => String(by[k][c] === undefined ? '' : by[k][c]).padStart(9)).join(''));
  return by;
}

/* ---------- the runner */
async function main() {
  const o = args(process.argv.slice(2));
  if (o.one) { const R = one(o.one); fs.writeFileSync(o.one.out, JSON.stringify(R)); console.log((R.err ? 'ERR ' : 'ok  ') + path.basename(o.one.out) + ' T ' + R.T + ' s, wall ' + R.wall + ' s, win ' + R.win + (R.err ? ' ' + R.err.slice(0, 160) : '')); return; }
  if (o.agg) { agg(o.agg, o.board); return; }
  fs.mkdirSync(o.out, { recursive: true });
  const jobs = [];
  for (const n of o.sides) for (const seed of o.seeds) {
    const out = path.join(o.out, 'm-' + o.era + '-' + n + 'l-s' + seed + '.json');
    if (fs.existsSync(out)) { console.log('have ' + path.basename(out)); continue; }
    jobs.push({ era: o.era, n, seed, min: o.min, mapv: o.mapv, out });
  }
  let i = 0;
  const run = () => new Promise(res => {
    const next = () => {
      if (i >= jobs.length) return res();
      const j = jobs[i++], ch = fork(__filename, ['--one', JSON.stringify(j)], { stdio: 'inherit' });
      try { os.setPriority(ch.pid, o.nice); } catch (e) {}
      ch.on('exit', c => { if (c) console.log('exit ' + c + ' ' + path.basename(j.out)); next(); });
    };
    next();
  });
  await Promise.all(Array.from({ length: Math.max(1, o.jobs) }, run));
  agg(o.out, o.board);
}
main();
