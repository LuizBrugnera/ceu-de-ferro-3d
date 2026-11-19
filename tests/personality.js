'use strict';
/* Personality and difficulty of the AI general (W17, §13c T8 of the General's design): the five personalities (Retranqueiro, Blitz, Guerrilheiro,
   Artilheiro, Logístico) as a doctrine, a taste for each manoeuvre and a production mix out of the same budget; a person's doctrine is plain and
   the empty chair goes back to the personality; 'sort'; the difficulty only as the plan's cadence (6, 4, 3, 2 s) and its depth (foot paths a tick,
   manoeuvres at once, how much it leans on the enemy's habits), never a resource or a sight; the enemy's habits by road and by time (cmdEdges); the
   view, the host's backup, the analytics; and an AI × AI match per era with personalities (SECS=180; SECS=0 skips it). About four minutes */
const H = require('./harness'), ok = H.ok;
const SECS = process.env.SECS === undefined ? 180 : +process.env.SECS;
const watch = (o, w) => { const C = H.load(Object.assign({ seed: 9, eco: 1, mapv: 4 }, o)), S = C.watch(w.era || 'ww2', Object.assign({ len: 0 }, w)); return { C, S, $: C.$ }; };
const near = (a, b) => Math.abs(a - b) < 1e-9;

console.log('-- the tables --');
{
  const { $ } = watch({}, {}), PERS = $('PERS'), DIF = $('DIF'), DIFK = $('DIFK'), FIELD = $('FIELD'), MAN = $('MAN'), CMD = $('CMD'), MANW = $('MANW');
  ok(Object.values(PERS).map(P => P.nm).join() === 'Retranqueiro,Blitz,Guerrilheiro,Artilheiro,Logístico', 'five personalities: ' + Object.values(PERS).map(P => P.nm).join(', '));
  ok(Object.values(PERS).every(P => CMD.doc[P.dk] && Object.keys(P.doc).every(k => k in CMD.doc.balanced || k === 'mort') && Object.keys(P.w).every(k => k in MANW.balanced)), 'each starts from a doctrine and changes only the doctrine\'s keys and the manoeuvre kinds');
  ok(DIFK.map(k => DIF[k].plan).join() === '6,4,3,2' && DIF.normal.plan === FIELD.every && DIF.normal.fp === MAN.fp && DIF.normal.mx === 0, 'difficulties Fácil, Moderado, Normal, Difícil: the plan every 6, 4, 3, 2 s; Normal is the battle before (FIELD.every, MAN.fp, MAN.max)');
  ok(DIFK.every(k => Object.keys(DIF[k]).sort().join() === 'fp,look,mx,nm,plan'), 'a difficulty is only cadence and depth (plan, fp, mx, look): no resource, sight or aim key');
}

console.log('-- no personality, Normal: the battle before W17 --');
{
  const { S, $ } = watch({}, {}), CMD = $('CMD');
  $('cmdOf')(0);
  ok(S.per.join() === ',' && S.dif.join() === 'normal,normal', 'a match with nothing asked: no personality, Normal on both sides');
  ok(S.cmd.every(C => C.doc === CMD.doc.balanced && C.atkT === CMD.open && C.taste === null && $('docK')(C) === 'balanced'), 'the commanders keep CMD.use\'s doctrine (the same object), CMD.open and no taste drawn yet');
}

console.log('-- the personalities: doctrine, opening, taste, mortars --');
{
  const { S, $ } = watch({}, { per: ['blz', 'ret'] }), CMD = $('CMD'), PERS = $('PERS'), MAN = $('MAN'), Cb = $('cmdOf')(0), Cr = $('cmdOf')(1);
  ok($('docK')(Cb) === 'aggressive' && $('docK')(Cr) === 'cautious', 'Blitz fights by the aggressive doctrine, Retranqueiro by the cautious one');
  ok(Cb.doc.atk === PERS.blz.doc.atk && Cb.doc.prep === 1 && Cb.doc.ops === CMD.doc.aggressive.ops && Cr.doc.atk === 1.8 && Cr.doc.push === CMD.doc.cautious.push, 'the doctrine with the personality\'s changes (Blitz attacks at 0,9 with 1 round of preparation; Retranqueiro at 1,8), the rest the doctrine\'s');
  ok(CMD.doc.aggressive.atk === 1 && CMD.doc.cautious.atk === 1.6, '  the doctrines themselves untouched');
  ok(near(Cb.atkT, CMD.open * .5) && near(Cr.atkT, CMD.open * 2), 'the first assault: Blitz after ' + Cb.atkT + ' s, Retranqueiro after ' + Cr.atkT + ' s (CMD.open ' + CMD.open + ')');
  const inT = (C, P) => Object.keys(C.taste).every(k => { const v = C.taste[k] / (P.w[k] || 1); return v >= MAN.taste[0] - 1e-9 && v <= MAN.taste[1] + 1e-9; });
  ok(inT(Cb, PERS.blz) && inT(Cr, PERS.ret) && Cb.taste.flk > Cb.taste.dep && Cr.taste.blk > Cr.taste.raid, 'the taste for each manoeuvre: the match\'s random taste times the personality\'s (Blitz flanks more than it digs in; Retranqueiro blocks more than it raids)');
  ok($('campN')(Cb) === 5 && $('campN')(Cr) === 3 && $('manMax')(Cb, $('docK')(Cb)) === 3 && $('manMax')(Cr, $('docK')(Cr)) === 1, 'fronts and manoeuvres at once follow the doctrine (5 and 3 fronts; 3 and 1 manoeuvres)');
  const { $: $a } = watch({}, { per: ['art', null] }), Ca = $a('cmdOf')(0), P = $a('cmdPosts')(Ca, [], {});
  ok(P.find(e => e[0] === 'mort')[1] === 2 && $a('cmdPosts')($a('cmdOf')(1), [], {}).find(e => e[0] === 'mort')[1] === $a('CMD').mort.n, 'Artilheiro keeps 2 mortar teams; the plain general ' + $a('CMD').mort.n);
  Ca.pn = { mort: 0 }; ok($a('cmdPosts')(Ca, [], {}).find(e => e[0] === 'mort')[1] === 0, '  a person\'s posts order still decides');
  ok(Ca.doc.prep === 9, 'Artilheiro prepares an assault with 9 rounds');
  void S;
}

console.log('-- the production mix: the same budget, spent otherwise --');
{
  const { S, $ } = watch({}, { per: ['gue', 'art'] });
  $('cmdOf')(0);
  const plain = H.load({ seed: 9, eco: 1, mapv: 4 }), S2 = plain.watch('ww2', { len: 0 }); plain.$('cmdOf')(0);
  for (const t of [0, 1]) { S.cmd[t].ops = []; S.cmd[t].want = null; S.cmd[t].thr = 0; S.cmd[t].post = []; S2.cmd[t].ops = []; S2.cmd[t].want = null; S2.cmd[t].thr = 0; S2.cmd[t].post = []; }
  const a = [0, 1].map(t => $('gpPlan')(t)), b = [0, 1].map(t => plain.$('gpPlan')(t)), sum = (f, ks) => ks.reduce((n, k) => n + (f[k] || 0), 0), GP = $('GP');
  ok(a[0].f.squad === b[0].f.squad + 1 && a[0].f.tank === Math.max(0, b[0].f.tank - 2) && /guerrilheiro/.test(a[0].why.squad), 'Guerrilheiro: one squad more, two tanks fewer (' + b[0].f.tank + ' → ' + a[0].f.tank + '), and the plan says why');
  ok(a[1].f.art >= b[1].f.art && a[1].f.art > 0 && /artilheiro/.test(a[1].why.art), 'Artilheiro: more artillery (' + b[1].f.art + ' → ' + a[1].f.art + ')');
  ok([0, 1].every(t => sum(a[t].f, GP.veh) <= Math.floor($('popOf')(t).veh * GP.gnd) && sum(a[t].f, GP.fly) <= $('popOf')(t).air), 'never over the population budget');
  ok([0, 1].every(t => JSON.stringify($('popOf')(t)) === JSON.stringify(plain.$('popOf')(t))), 'the budget itself is the same with and without a personality: ' + JSON.stringify($('popOf')(0)));
  void S2;
}

console.log('-- a person\'s doctrine is plain; the empty chair goes back to the personality --');
{
  const { S, $ } = watch({}, { per: ['blz', null] }), CMD = $('CMD'), C = $('cmdOf')(0);
  $('genCtl')(0, 'me');
  const r = $('genCmd')(0, { c: 'doc', k: 'cautious' }, 'me');
  ok(r.ok && C.doc === CMD.doc.cautious && $('docK')(C) === 'cautious', 'the general picks cautious: the plain cautious doctrine');
  $('genCtl')(0, 'ai');
  ok(C.dk === undefined && $('docK')(C) === 'aggressive' && C.doc.atk === $('PERS').blz.doc.atk, 'the chair empty again: Blitz\'s own doctrine');
  void S;
}

console.log('-- sort: one of the five, drawn once a side --');
{
  const seen = new Set();
  for (let i = 1; i <= 8; i++) { const { S, $ } = watch({ seed: i }, { per: ['sort', 'sort'] }); for (const k of S.per) seen.add(k); ok(S.per.every(k => Object.hasOwn($('PERS'), k)), '  seed ' + i + ': ' + S.per.join(' × ')); }
  ok(seen.size >= 3, 'eight matches drew ' + seen.size + ' different personalities');
}

console.log('-- the difficulty: the plan\'s cadence (6, 4, 3, 2 s) --');
{
  for (const dif of [['facil', 'dificil'], ['moderado', 'normal']]) {
    const { C, S, $ } = watch({}, { dif }); void S;
    C.__n = [0, 0]; $('planJob = (g => t => { __n[t]++; return g(t); })(planJob)');
    C.run(120, null, 1 / 30);
    const want = dif.map(k => 120 / $('DIF')[k].plan);
    ok([0, 1].every(t => Math.abs(C.__n[t] - want[t]) <= 1), dif.join(' × ') + ': ' + C.__n.join(' and ') + ' plans in 120 s (' + want.join(' and ') + ')');
  }
  const { C, S, $ } = watch({}, {}); C.__n = [0, 0]; $('planJob = (g => t => { __n[t]++; return g(t); })(planJob)');
  const order = []; $('planJob = (g => t => { __o.push(t); return g(t); })(planJob)'); C.__o = order;
  C.run(12, null, 1 / 30);
  ok(order.slice(0, 4).join() === '1,0,1,0' && C.__n.join() === '4,4', 'Normal on both sides as before: side 1 first, then they alternate every ' + $('FIELD').every / 2 + ' s (' + order.join('') + ')');
  S.planT = 1e9; const n0 = C.__n.slice(); C.run(10, null, 1 / 30);
  ok(C.__n.join() === n0.join(), 'a test that sets S.planT far ahead still stops the planner');
}

console.log('-- the difficulty: depth (foot paths a tick, manoeuvres at once) and never a resource or a sight --');
{
  const { S, $ } = watch({}, {}), C = $('cmdOf')(0), DIF = $('DIF'), b = S.base[0], fp = [];
  for (const k of $('DIFK')) {
    S.dif = [k, k]; S.t += 1; let n = 0;
    while (n < 40 && $('footPath')(C, b.x + 300, b.z, b.x + 2500, b.z + 600)) n++;
    fp.push(n);
    ok(n === DIF[k].fp, k + ': ' + n + ' foot paths in one plan tick, then none');
  }
  const mm = $('DIFK').map(k => { S.dif = [k, k]; return $('manMax')(C, 'balanced'); });
  ok(mm.join() === '1,1,2,3', 'manoeuvres at once with the balanced doctrine: ' + mm.join(', ') + ' (never under one)');
  const snap = () => JSON.stringify([$('popOf')(0), $('popOf')(1), $('ECO').ai, $('VIEW'), $('PERC'), $('AIM'), $('GP').pop, $('IAI').cap]);
  S.dif = ['normal', 'normal']; const s0 = snap(); S.dif = ['facil', 'dificil']; const s1 = snap();
  ok(s0 === s1, 'the budget, the economy\'s AI, the perception ladder and the aim are the same at every difficulty');
}

console.log('-- the enemy\'s habits: where and when it passes (cmdEdges) --');
{
  const { S, $ } = watch({}, {}), C = $('cmdOf')(1), HAB = $('HAB'), E = S.T.net.e;
  $('plan')(1);
  const ei = E.findIndex(e => e.len > 1500 && e.smp.length >= 6 && $('habEdge')(e.smp[2].x, e.smp[2].z) === E.indexOf(e) && e.smp.some(o => Math.hypot(o.x - e.smp[2].x, o.z - e.smp[2].z) > 600 && $('habEdge')(o.x, o.z) === E.indexOf(e)));
  const e = E[ei], p = e.smp[2], q = e.smp.find(o => Math.hypot(o.x - p.x, o.z - p.z) > 600 && $('habEdge')(o.x, o.z) === ei);
  ok(ei >= 0 && $('habEdge')(p.x + 40, p.z) === ei && $('habEdge')(p.x + 3000, p.z + 3000) !== ei, 'a point by an edge is on it (' + Math.round(e.len) + ' m long); one far away is not');
  const foe = [0, 1, 2].map(i => ({ team: 0, kind: 'tank', dead: false, seenT: S.t, sx: p.x + i * 8, sz: p.z, x: p.x, z: p.z }));
  C.hu = null; C.hk = new Set();
  const look = () => { C.known = foe.filter(o => !o.dead); $('habSense')(C); };
  look();
  ok(Math.abs(C.hu[ei] - 3) < 1e-6 && C.hp[ei].length === 1 && $('habOf')(C, ei).h === 0, 'a column of three seen on it: use 3, one pass, not a habit yet (one column is not)');
  S.t += 30; for (const o of foe) o.seenT = S.t; look();
  ok(Math.abs(C.hu[ei] - 3 * Math.pow(.5, 30 / HAB.half)) < 1e-3, 'the same three still there 30 s later: not counted again');
  S.t += 200; for (const o of foe) o.seenT = S.t; look();
  ok(C.hp[ei].length === 1, '  nor 200 s later, out of sight in between but where they were (parked by the road is not traffic)');
  const T1 = S.t;
  for (let n = 0; n < 2; n++) { S.t += 180; for (const o of foe) { o.seenT = S.t; o.sx = (n ? p : q).x; o.sz = (n ? p : q).z; } look(); }
  const Hb = $('habOf')(C, ei), lg = (S.glog ? S.glog.l[1] : []).filter(x => /Hábito do inimigo: já passou 3 vezes/.test(x.s));
  ok(C.hp[ei].length === 3 && Hb.h > .6 && Hb.per === 180 && Math.abs(Hb.next - (S.t + 180)) < 1e-6 && S.t - T1 === 360, 'back along the edge every 180 s, out of sight in between: 3 passes, habit ' + Hb.h.toFixed(2) + ', one each ' + Hb.per + ' s, the next due in ' + Math.round(Hb.next - S.t) + ' s');
  ok(lg.length === 1 && C.hk.has(ei), 'the log tells it once: ' + (lg[0] ? lg[0].s : '-'));
  const site = { x: p.x + 30, z: p.z, ri: 0, s: 0, sc: 0, pos: [] }, far = { x: p.x + 4000, z: p.z + 4000, ri: 0, s: 0, sc: 0, pos: [] }, b0 = $('habAmb')(C, site);
  ok(b0 > 2.2 && $('habAmb')(C, far) === 0, 'an ambush site on that road, the next pass due in ' + Math.round(Hb.next - S.t) + ' s: it scores ' + b0.toFixed(2) + ' more; one elsewhere nothing');
  S.t += 170; const b1 = $('habAmb')(C, site);
  ok(b1 > 1.2 && b1 < b0 - .5, 'with the next pass due in ' + Math.round(Hb.next - S.t) + ' s (too soon to lie in wait) only the road\'s habit: ' + b1.toFixed(2) + ' (the time it uses)');
  S.dif = ['normal', 'facil']; ok($('habAmb')(C, site) === 0, 'Fácil does not lean on the enemy\'s habits');
  S.dif = ['normal', 'dificil']; ok($('habAmb')(C, site) > b1, 'Difícil leans on them more (' + $('habAmb')(C, site).toFixed(2) + ')');
  S.dif = ['normal', 'normal'];
  const V = $('genVM')(1, false);
  ok(V.hab.length >= 1 && V.hab[0].n === 3 && V.hab[0].per === 180 && typeof V.hab[0].nm === 'string', 'the view lists it: ' + JSON.stringify(V.hab[0]));
  const { S: S2, $: $2 } = watch({}, { dif: ['normal', 'facil'] }), C2 = $2('cmdOf')(1); $2('plan')(1);
  C2.known = foe; $2('cmdEdges')(C2, []); ok(!C2.hu, 'Fácil does not even keep them'); void S2;
}

console.log('-- the view, the host\'s backup, the analytics --');
{
  const { S, $ } = watch({ ana: true }, { per: ['log', 'gue'], dif: ['moderado', 'dificil'] });
  $('cmdOf')(0);
  const V = $('genVM')(0, false), P = $('genPick')(V);
  ok(V.per.nm === 'Logístico' && V.dif.nm === 'Moderado' && V.dif.plan === 4 && P.per.k === 'log' && P.dif.k === 'moderado' && Array.isArray(P.hab), 'the view and what goes on the wire: per, dif and hab');
  ok($('GENK').includes('per') && $('GENK').includes('dif') && $('GENK').includes('hab'), '  in GENK, so a guest\'s view has them');
  const st = $('genState')(1); ok(st.per.k === 'gue' && st.dif.plan === 2, 'the MCP\'s state: personality and difficulty');
  const lg = S.glog.l[0].filter(x => /General da IA: Logístico/.test(x.s));
  ok(lg.length === 1 && /dificuldade Moderado, plano a cada 4 s/.test(lg[0].s), 'the log says who the general is: ' + (lg[0] ? lg[0].s : '-'));
  const K = $('ecoPack')(); ok(JSON.stringify(K.gp) === JSON.stringify([['log', 'gue'], ['moderado', 'dificil']]), 'the host\'s sealed backup carries both');
  S.per = [null, null]; S.dif = ['normal', 'normal']; $('ecoUnpack')(K);
  ok(S.per.join() === 'log,gue' && S.dif.join() === 'moderado,dificil' && $('docK')(S.cmd[1]) === 'balanced' && S.cmd[1].doc.amb === 3, 'the next host takes them back, and its generals are the same');
  const K2 = JSON.parse(JSON.stringify(K)); K2.gp = [['zz', 'gue'], ['impossivel', 'normal']]; $('ecoUnpack')(K2);
  ok(S.per.join() === ',gue' && S.dif.join() === 'normal,normal', '  an unknown key from the wire becomes none, Normal');
  const { C: Ca, S: Sa, $: $a } = watch({ ana: true }, { per: ['art', 'blz'], dif: ['facil', 'normal'] }); Ca.run(2, null, 1 / 30);
  const h = $a('ANA').ev.find(e => e.k === 'hdr'), R = $a('anaReport') ? $a('anaReport')($a('ANA').ev, -1) : null;
  ok(h && h.per.join() === 'art,blz' && h.dif.join() === 'facil,normal', 'the analytics\' header: ' + JSON.stringify(h && [h.per, h.dif]));
  ok(!R || (R.per.join() === 'art,blz' && R.dif.join() === 'facil,normal'), 'and the review of the match' + (R ? '' : ' (no anaReport)'));
  void Sa;
}

if (SECS > 0) {
  console.log('-- an AI × AI match a era with personalities (' + SECS + ' s) --');
  for (const era of ['ww2', 'modern']) {
    const { C, S, $ } = watch({ seed: 5 }, { era, per: era === 'ww2' ? ['blz', 'ret'] : ['gue', 'art'], dif: ['dificil', 'moderado'] });
    let bad = null; C.run(SECS, () => { bad = bad || H.nan(S); return !bad; }, 1 / 30);
    const ops = S.cmd.map(C => C.ops.length + C.man.length), sq = [0, 1].map(t => S.squads.filter(q => q.team === t && q.live > 0).length), lg = [0, 1].map(t => (S.glog.l[t] || []).length);
    ok(!bad && S.t >= SECS - 1, era + ': ' + Math.round(S.t) + ' s with no NaN (' + S.per.join(' × ') + ', ' + S.dif.join(' × ') + '); squads ' + sq.join('/') + ', operations ' + ops.join('/') + ', log ' + lg.join('/'));
    ok(sq.every(n => n > 0) && lg.every(n => n > 0), '  both generals at work');
  }
}
H.done();
