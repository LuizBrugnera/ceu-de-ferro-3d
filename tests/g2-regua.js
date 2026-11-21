'use strict';
/* the General 2's yardstick (G0, cf-g2-g0-regua): the page's GENERAL 2: régua and tools/balance.js's section "General 2: régua dos exemplos".
   1. the review is a pure function of the events: a made-up match (the header, the g2 counters of both sides, assaults, the general's log,
      points, losses, snapshots with the command net, combats) gives the numbers worked out here by hand; a side's view of a match not over
      leaves the enemy out; every row has a value and a target, with or without data.
   2. one AI × AI match of MIN min (ERA, modern by default: it has domes), played three times on one seed: with the yardstick off, on, and on
      again; at 20 s a squad of side 1 is put 120 m from one of side 0, toward its own, so a combat is sure in so short a match. Off, no g2 anywhere; on, every event but its own is the very same as off (it changes nothing the battle reads, and the cap of the
      analytics does not count its events), it raised no error, both sides have every counter and combats went out, and the two runs with it
      on give the same g2 events to the last digit (the yardstick is stable: the same seed, the same numbers).
   3. tools/balance.js: the section over the two runs with it on, with a reference column, and --combates; and the server takes the kinds of
      event the measurements send (g2, g2c, and the brain's cb: an event of an unknown kind is left out, cf-pol-fluxos).
   MIN the clock of the match in minutes (default 2), SEED (default 3); SECS=0 skips parts 2 and 3. Some minutes on a quiet machine */
const fs = require('fs'), path = require('path'), os = require('os');
const H = require('./harness'), { ok, done } = H;
const B = require('../tools/balance.js');
const MIN = +process.env.MIN || 2, SEED = +process.env.SEED || 3, ERA = process.env.ERA || 'modern', SKIP = process.env.SECS === '0';
console.log('page: ' + H.PAGE);

console.log('-- 1. the review from made-up events --');
const C0 = H.load({ ana: true }), $0 = C0.$, G2R = $0('G2R');
{
  const html = fs.readFileSync(H.PAGE, 'utf8'), a = html.indexOf('/* ---------- GENERAL 2: régua'), b = html.indexOf('/* ---------- 3D scene');
  ok(a > 0 && a < b && html.indexOf('/* ---------- end of GENERAL 2: régua') < b, 'the page has its section GENERAL 2: régua, in the part the simulation runs (before the scene)');
  ok(G2R.on === 1 && typeof $0('g2Rows') === 'function' && typeof $0('g2Sum') === 'function', 'G2R.on 1 by default (the switch), g2Sum and g2Rows');
  const z = { k: 'g2', t: 60, s: 0, inf: [1, 0, 0, 0, 0], snp: [0, 0, 0], at: [0, 0], km: [0, 0], emb: [0, 0], df: [0, 0, 0, 0, 0], dq: [0, 0, 0], dt: [0, 0], sd: [0, 0, 0], hq: [0, 0, 0, 0], dm: [0, -1, 0, 0, -1, -1], fob: [0, 0], pc: Array(11).fill(0), cb: [0, 0] };
  const g0 = { k: 'g2', t: 120, s: 0, inf: [600, 120, 100, 50, 30], snp: [60, 30, 4], at: [5, 3], km: [3000, 1000], emb: [4, 1], df: [200, 2000, 180, 1800, 90], dq: [50, 40, 60], dt: [20, 10],
    sd: [2, 1, 120], hq: [3, 2, 40, 1], dm: [1, 300, 12, 8, 400, 200], fob: [2, 1], pc: [1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1], cb: [2, 0] };
  const g1 = Object.assign({}, z, { t: 120, s: 1 });
  const cn = (i, o, c) => [0, 0, 0, 0, 0, 0, 0, 0, i, o, c];
  const ev = [{ k: 'hdr', v: 2, n: 2, t: 0, era: 'modern', tk: [100, 100], tk0: 100, fac: ['A', 'B'], doc: ['balanced', 'balanced'], pts: [['A', 'Base', 0, 0], ['B', 'Vila', -1, -1], ['C', 'Cidade', -1, 1]], g2: { on: 1, v: 1, u: [0, 1, 1] } },
    Object.assign({}, z, { t: 60 }), g0, g1,
    { k: 'ap', t: 50, s: 0, L: 'B', walk: 0, st: 'go', ok: 1, a: [0, 0, 0, 0, 0, 0], off: 0, mv: [] }, { k: 'ap', t: 70, s: 0, L: 'A', walk: 0, st: 'form', ok: 0, a: [0, 0, 0, 0, 0, 0], off: 0, mv: [] },
    { k: 'ap', t: 80, s: 0, L: 'C', walk: 1, st: 'cons', ok: 1, a: [0, 0, 0, 0, 0, 0], off: 0, mv: [] },
    { k: 'lg', t: 70, s: 0, c: 'atk', x: 'Reunião para Vila demorou demais: assalto cancelado' }, { k: 'lg', t: 71, s: 0, c: 'rf', x: 'Sem força para atacar Cidade' }, { k: 'lg', t: 72, s: 0, c: 'rf', x: 'Sem força para atacar Vila' },
    { k: 'lg', t: 73, s: 1, c: 'rf', x: 'Sem força para atacar Base' },
    { k: 'pt', t: 40, i: 1, L: 'B', from: -1, to: 0, d: [0, 0] }, { k: 'pt', t: 90, i: 1, L: 'B', from: 0, to: 1, d: [0, 0] },
    { k: 'ls', t: 30, s: 1, u: 'tank', by: [0, 'inf'], c: 6 }, { k: 'ls', t: 31, s: 1, u: 'truck', by: [0, 'inf'], c: 2 }, { k: 'ls', t: 32, s: 1, u: 'lav', by: [0, 'tank'], c: 4 }, { k: 'ls', t: 33, s: 0, u: 'tank', by: [1, 'inf'], c: 6 },
    { k: 'sn', t: 10, tk: [100, 100], pt: [1, 1], cn: [cn(8, 1, 1), cn(1, 1, 0)] }, { k: 'sn', t: 20, tk: [100, 100], pt: [1, 1], cn: [cn(8, 2, 0), cn(1, 0, 1)] },
    { k: 'g2c', t: 10, d: 30, x: 0, z: 0, u: 1, p: ['B', -1], sd: [{ s: 0, m0: { rf: 5 }, mj: {}, v0: {}, vj: {}, me: { rf: 3 }, md: { rf: 2 }, ve: {}, vd: {} }, { s: 1, m0: { rf: 4 }, mj: {}, v0: { tank: 1 }, vj: {}, me: { rf: 1 }, md: { rf: 3 }, ve: {}, vd: { tank: 1 } }] },
    { k: 'g2c', t: 50, d: 20, x: 0, z: 0, u: 0, p: null, sd: [] },
    { k: 'end', t: 130, win: 0, why: 0, pl: [0, 1], tk: [90, 80], bl: [0, 0], lost: [[0], [0]], T: 0 }];
  const R = C0.anaReport(ev), X = R.g2 && R.g2.side[0], f = X && X.f, M = f && $0('g2Sum')(f, 1), near = (a, b) => a !== null && Math.abs(a - b) < 1e-9;
  ok(R.g2 && R.g2.on === 1 && R.g2.cb === 2 && X && R.g2.side[1] && X.raw.inf[0] === 600, 'R.g2: on, 2 combats, each side\'s last g2 event (not the first)');
  ok(f.asm === 3 && f.atk === 2 && f.go === 1 && f.canc === 1 && near(M.canc, 1 / 3) && f.want === 2, 'assaults 2 (and an occupation), 1 at H-hour, 1 assembly of 3 cancelled by its deadline (' + Math.round(M.canc * 100) + '%), "sem força" 2 (the other side\'s left out)');
  ok(f.ptLost === 1 && f.ptTook === 1 && f.urbAtk === 1 && f.urbTook === 1 && f.armK === 1, 'points: 1 lost, 1 taken; assaults on an urban point 1, taken 1; armour its infantry killed 1 (a truck is not armour, a lav by a tank is not infantry)');
  ok(near(M.net, .8) && near(M.inB, .2) && near(M.urbB, .5) && near(M.foeT, .5) && near(M.kmESh, .25) && near(M.rode, .25), 'in the net 80% (16 of 20 squads); in a building 20%, 50% in the defence of a town; 0,5 min inside an enemy town; 25% of the km aboard; 1 long walk of 4 ridden');
  ok(near(M.dfD, 10) && near(M.nn, 10) && near(M.nn5, .5) && near(M.dq1, .8) && near(M.dqSq, 1.2) && near(M.dt30, .5), 'defenders 10 m from the centre, nearest mate 10 m (50% at 5 m or more); one squad or none at the centre 80%; tanks apart 50%');
  ok(near(M.sdOpen, 2) && near(M.sdGo, 1) && near(M.sdIn, 2) && near(M.hqAns, 2 / 3) && near(M.hqT, 20), 'the seat: 2 assaults on the enemy\'s (1 at H-hour), 2 squad-min in it; 3 incursions into its own, 2 answered in 20 s on average, 1 not');
  ok(f.dmApp === 1 && f.dmOk === 1 && f.seen === 1 && near(M.imp, 12) && near(M.impB, 8) && f.fobOk === 1 && near(M.fobO, 2), 'the dome up at 300 s, before the 10th round at 400 s, the enemy gun known at 200 s (modern): 1 of 1; 12 rounds near an asset, 8 before it; 2 forward bases ordered, 1 up');
  ok(f.pcN === 4 && near(M.pcOk, .75) && near(M.pcMean, 4) && f.cbN === 2, 'points taken: 4, with ' + G2R.pcN + ' works or more 5 min later 75% (0, 3, 3, 10+: 4 on average)');
  const rows = $0('g2Rows')(M), empty = $0('g2Rows')($0('g2Sum')($0('g2Flat')($0('g2Raw')(null), [], 0, {}), 1));
  ok(rows.length === empty.length && rows.length >= 20 && rows.concat(empty).every(r => r.length === 3 && r.every(c => typeof c === 'string' && c && !/undefined|NaN/.test(c))), rows.length + ' rows [measure, value, target], none undefined or NaN, with data and without');
  const V = C0.anaReport(ev.filter(e => e.k !== 'end'), 1);
  ok(V.g2 && V.g2.side[0] === null && V.g2.side[1] && V.g2.side[1].raw.inf[0] === 1, 'a side\'s view of a match not over: only its own counters');
  const W = $0('g2Where'), u = { x: 500, z: 60, dead: false }, man = (x, o) => Object.assign({ x, z: 0, dead: false, gone: false }, o);
  const w1 = W({ men: [man(10)] }), w2 = W({ men: [man(10, { in: u })] }), w3 = W({ men: [man(10, { gone: true })], rd: { u } }), w4 = W({ men: [man(10, { dead: true })], rd: { u } });
  ok(w1.o.x === 10 && !w1.ab && w2.o === u && w2.ab && w3 && w3.o === u && w3.ab && w4 === null, 'where a squad is (g2Where): its leader on foot; the vehicle he rides; the vehicle of its ride with its men gone aboard (the km aboard); nobody left: none');
  ok(C0.anaReport(ev.filter(e => e.k !== 'g2' && e.k !== 'g2c').map(e => (e.k === 'hdr' ? Object.assign({}, e, { g2: undefined }) : e))).g2 === null, 'a match before the yardstick: R.g2 null');
}

if (!SKIP) {
  console.log('-- 2. one AI × AI match of ' + MIN + ' min (' + ERA + ', seed ' + SEED + '), off, on, on --');
  const play = on => {
    const C = H.load({ seed: SEED, eco: 1, lg: 1, rec: 1, mapv: 6, ana: true }); C.$('AIB').now = () => 0; C.$('G2R').on = on;
    const S = C.watch(ERA, { doc: ['balanced', 'aggressive'], len: 0, min: MIN }), t0 = Date.now(), lead = q => q.men.find(m => !m.dead && !m.in);
    let put = false;
    C.run(S.cq.T0 + 120, () => {
      if (!put && S.t >= 20) {   // the contact: the same in the three runs
        put = true;
        const a = S.squads.find(q => q.team === 0 && q.men && lead(q)), b = S.squads.find(q => q.team === 1 && q.men && lead(q));
        if (a && b) { const A = lead(a), Bl = lead(b), d = Math.hypot(Bl.x - A.x, Bl.z - A.z) || 1; b.men.forEach((m, i) => { if (m.dead || m.in) return; m.x = A.x + (Bl.x - A.x) / d * 120 + (i % 3) * 3; m.z = A.z + (Bl.z - A.z) / d * 120 + ((i / 3) | 0) * 3; m.y = C.$('manY')(m.x, m.z); }); }
      }
      return !S.over;
    });
    const G = C.$('G2S');
    return { C, S, ev: C.$('ANA').ev.slice(), err: G && G.err, wall: Math.round((Date.now() - t0) / 1000) };
  };
  const strip = ev => ev.filter(e => e.k !== 'g2' && e.k !== 'g2c').map(e => { if (e.k !== 'hdr' && e.k !== 'rep') return e; const o = Object.assign({}, e); delete o.g2; if (o.k === 'rep') delete o.n; return o; });
  const off = play(0), on = play(1), on2 = play(1);
  console.log('   ' + off.wall + ' s, ' + on.wall + ' s, ' + on2.wall + ' s of this machine; ' + on.ev.length + ' events with it on, ' + off.ev.length + ' off');
  ok(off.S.over && on.S.over, 'the match ended both ways (' + Math.round(on.S.t) + ' s)');
  ok(!off.ev.some(e => e.k === 'g2' || e.k === 'g2c' || (e.k === 'hdr' && e.g2)) && !(off.S.anaRep && off.S.anaRep.g2), 'off: no g2 in the events, the header or the review');
  const a = JSON.stringify(strip(off.ev)), b = JSON.stringify(strip(on.ev));
  let at = 0; while (at < a.length && a[at] === b[at]) at++;
  ok(a === b, 'on: every event but the yardstick\'s is the very same as off (' + strip(on.ev).length + ' events)' + (a === b ? '' : ': they part at …' + a.slice(Math.max(0, at - 120), at + 80) + '… / …' + b.slice(Math.max(0, at - 120), at + 80)));
  ok(!on.err && !on2.err, 'it raised no error of its own' + (on.err ? ': ' + on.err : ''));
  const g2 = on.ev.filter(e => e.k === 'g2'), K = on.C.$('G2K'), last = [0, 1].map(s => g2.filter(e => e.s === s).pop());
  ok(last.every(e => e && K.every(k => Array.isArray(e[k]) && e[k].every(Number.isFinite))), 'both sides have every counter (' + K.join(', ') + ') at the end, all numbers');
  const R = on.S.anaRep, h = on.ev.find(e => e.k === 'hdr'), cb = on.ev.filter(e => e.k === 'g2c');
  ok(R && R.g2 && R.g2.side.every(Boolean) && h.g2 && h.g2.u.length === h.pts.length, 'the review has R.g2 for both sides and the header the urban points');
  ok(cb.length > 0 && cb.every(c => Number.isFinite(c.d) && c.sd.length >= 2 && c.sd.every(x => x.m0 && x.me && x.v0 && x.ve)), cb.length + ' combats went out, each with two sides or more and who was there and who was left');
  const k = JSON.stringify(on.C.$('anaBrief')(R)).length, k0 = JSON.stringify(off.C.$('anaBrief')(off.S.anaRep)).length;
  ok(k < 15000, 'the review sent to the server (rep) is ' + k + ' characters (' + k0 + ' with it off), under the relay\'s 16 KB');
  const mine = r => r.ev.filter(e => e.k === 'g2' || e.k === 'g2c').map(e => JSON.stringify(e)), x = mine(on), y = mine(on2), i = x.findIndex((v, j) => v !== y[j]);
  ok(x.length === y.length && i < 0, 'stable: the same seed played again gives the same ' + x.length + ' g2 and g2c events, to the last digit' + (i < 0 ? '' : ': the ' + i + 'th differs: ' + x[i].slice(0, 300) + ' / ' + String(y[i]).slice(0, 300)));
  const F = R.g2.side[0].f; console.log('   side 0: ' + Object.entries(on.C.$('g2Sum')(F, 1)).filter(([, v]) => v !== null).map(([k, v]) => k + ' ' + (Math.round(v * 100) / 100)).join(', '));

  console.log('-- 3. tools/balance.js --');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'g2-regua-'));
  try {
    const files = [on, on2].map(r => B.save(dir, ERA, r.ev, 'tourney')), C = H.load({ ana: true });
    const reps = files.map(f => { const ev = B.readMatch(f), x = ev.find(e => e.k === 'hdr'); return Object.assign(C.anaReport(ev), { file: f, tour: x.tour || null }); });
    const A = B.aggregate(reps), G = B.g2(C, reps), txt = B.g2Print(C, G, A.mano, { g2: G, mano: A.mano });
    ok(G && G.n === 2 && G.f.n === 4 && G.cb === 2 * cb.length, 'g2: 2 matches, 4 side records added, ' + G.cb + ' combats');
    const rows = txt.split('\n').filter(l => /^\| (?!Medida|---)/.test(l));
    ok(/## General 2: régua dos exemplos/.test(txt) && rows.length >= 22 && rows.every(l => l.split('|').length === 6 && !/undefined|NaN/.test(l)), 'the section: ' + rows.length + ' rows with value, target and reference, none undefined');
    const l = B.combats(files);
    ok(l.length === 2 * cb.length && l.every(s => { const o = JSON.parse(s); return o.k === 'g2c' && o.match && o.era === ERA; }), '--combates: ' + l.length + ' lines, each a combat with its match and era');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
{
  const src = fs.readFileSync(path.join(H.ROOT, 'server.js'), 'utf8'), m = /kinds: new Set\(\[([^\]]*)\]\)/.exec(src), kinds = m ? m[1].split(',').map(s => s.trim().replace(/'/g, '')) : [];
  ok(['g2', 'g2c', 'cb'].every(k => kinds.includes(k)), 'the server keeps the events g2, g2c and cb (ANA.kinds: ' + kinds.join(', ') + ')');
}
done();
