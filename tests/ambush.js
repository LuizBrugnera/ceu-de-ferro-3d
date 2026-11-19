'use strict';
/* M4 of the general's manoeuvre: ambushes and alternate streets, over the tactical map (M1). P7 emb (the planned ambush on the road the enemy is
   known to use most, reached by the way it sees least, there before the pass its habit predicts, out by its escape way), P9 itd (the same on its
   supply road at the narrowest place, with fire at the hour due), P8 grd (holding a junction or bridge whose loss makes the enemy's way to one of
   our points longer), P11 (the reaction to an enemy on a point's flank goes round the side it sees less, mortars on its way in). Honest: only
   the traffic the side has seen and its own map. Each through genCmd as the AI and as a person.
   SECS (default 240): one AI × AI match per era with M4 on, no exception, no NaN, every manoeuvre over within its Tmax, and the walk's cost */
const H = require('./harness'), { ok, done } = H, { performance } = require('perf_hooks');
const SECS = process.env.SECS === undefined ? 240 : +process.env.SECS;
const hdist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const watch = (o, era) => { const C = H.load(Object.assign({ seed: 9, eco: 1, mapv: 6 }, o)); C.$('globalThis').performance = performance; const S = C.watch(era || 'ww2', { len: 0 }); return { C, S, $: C.$ }; };
const logs = (S, t) => (S.glog ? S.glog.l[t] : []).map(e => e.s), has = (S, t, re) => logs(S, t).some(s => re.test(s));
/* a side's habits from scratch: edge i used u times, passes at the times P */
const habits = (S, Cm, l) => { const E = S.T.net.e; Cm.hu = new Float32Array(E.length); Cm.hp = E.map(() => []); Cm.hl = new WeakMap(); Cm.hk = new Set(); Cm.huT = S.t; for (const [i, u, P] of l) { Cm.hu[i] = u; Cm.hp[i] = P.slice(); } };
const freeOf = ($, S, t) => $('manFree')(S.squads.filter(q => q.team === t && !q.net && q.live > 0 && !q.state));
const Xof = ($, S, Cm) => { Cm.fpT = -1; const sq = S.squads.filter(q => q.team === Cm.t && !q.net && q.live > 0 && !q.state); return { t: Cm.t, C: Cm, sq, free: $('manFree')(sq), room: 9, doc: 'balanced', ds: Cm.t ? 1 : -1, live: Cm.man }; };
/* side 0 ready to plan: its look, its map, nothing else of its own making */
function ready(C, S, $) {
  C.run(2); const Cm = $('cmdOf')(0);
  for (const t of [0, 1]) $('cmdOf')(t).mnT = 1e9;   // no manoeuvre of the commanders' own choosing while a test drives them
  $('cmdSense')(Cm, S.squads.filter(q => q.team === 0 && !q.net && q.live > 0 && !q.state)); $('tmNow')(0);
  return Cm;
}

console.log('-- the tables --');
{
  const { $ } = watch();
  ok(['emb', 'itd', 'grd'].every(k => $('MANORD').includes(k) && $('MANT')[k] && $('GEN').man[k] && $('GEN').mtag[k] && $('GEN').mlg[k]), 'three new kinds in the catalogue: emb (Emboscada planejada), itd (Interdição da logística), grd (Guarda da rua alternativa)');
  const MC = $('MANC'); ok(MC.ambush[0] === 'emb' && MC.interdict[0] === 'itd' && MC.guard[0] === 'grd' && MC.guard[1] === 'def', 'the commands: man k=ambush, interdict (atk), guard (def)');
  ok($('MANT').emb.h === .4 && $('MANT').emb.lead === 60 && $('MANT').emb.max === 2 && $('MANT').emb.out === 60, 'P7 as decided: a habit of .4 or more, there 60 s before the pass, at most 2 a side, out within 60 s');
  ok(!Object.keys($('MANW').balanced).some(k => ['emb', 'itd', 'grd'].includes(k)), 'the random taste of a match is drawn as before (no new key in MANW): the doctrine and the personality weigh inside each kind');
}

console.log('-- the tactical walk: round what the enemy sees --');
{
  const { C, S, $ } = watch(), Cm = ready(C, S, $), M = Cm.tm, cell = (x, z) => $('m4Cell')(M, x, z);
  const b = S.base[0], a = { x: b.x + (S.base[1].x > b.x ? 600 : -600), z: b.z }, g = { x: a.x + (S.base[1].x > b.x ? 2400 : -2400), z: a.z };
  const v0 = M.v.slice(); M.v.fill(0);
  const w0 = $('tmWalk')(Cm, a.x, a.z, g.x, g.z), d = $('tmExp')(Cm, $('polyOf')([a, g]));
  ok(w0 && w0.exp === 0 && w0.len < hdist(a, g) * 1.6, 'nobody watching: the walk is near the straight way (' + (w0.len / 1000).toFixed(1) + ' km for ' + (hdist(a, g) / 1000).toFixed(1) + ' km), nothing seen');
  const mx = (a.x + g.x) / 2; for (let j = 0; j < M.nz; j++) for (let i = 0; i < M.nx; i++) { const x = (i + .5) * M.c, z = -S.HW + (j + .5) * M.c; if (Math.abs(x - mx) < 300 && Math.abs(z - a.z) < 1600) M.v[j * M.nx + i] = 1; }   // a watched band across the straight way, 3,2 km long
  const w1 = $('tmWalk')(Cm, a.x, a.z, g.x, g.z), d1 = $('tmExp')(Cm, $('polyOf')([a, g]));
  ok(w1 && d1.exp > .1 && w1.exp < d1.exp && w1.exp <= .1, 'a band the enemy watches across it: the walk goes round (' + Math.round(w1.exp * 100) + '% seen, the straight way ' + Math.round(d1.exp * 100) + '%, ' + (w1.len / 1000).toFixed(1) + ' km)');
  ok(w1.len > w0.len, '  and is longer for it (' + (w0.len / 1000).toFixed(1) + ' → ' + (w1.len / 1000).toFixed(1) + ' km)');
  const wet = $('tmWet')(S.T.tms), Z = S.T.tms;
  let dry = true; for (let s = 0; s <= w1.len; s += 50) { const p = $('routeAt')(w1, s), q = cell(p.x, p.z); if (wet[q] && q !== cell(a.x, a.z) && q !== cell(g.x, g.z)) dry = false; }
  ok(dry && wet.some(Boolean) && $('brs()').every(B => !wet[cell(B.x, B.z)] || !Z.road[cell(B.x, B.z)]), 'never through water: the river is no way but at a standing bridge');
  M.v.set(v0); const n0 = Cm.fpN, F = $('difOf')(0).fp; Cm.fpN = F; Cm.fpT = S.t;
  ok($('tmWalk')(Cm, a.x, a.z, g.x, g.z) === null, 'the difficulty\'s depth: no walk past difOf(t).fp a plan tick (' + F + ' at Normal)'); Cm.fpN = n0;
  let t0 = performance.now(), n = 0; for (let i = 0; i < 20; i++) { Cm.fpT = -1; if ($('tmWalk')(Cm, a.x, a.z + i * 50, g.x, g.z - i * 30)) n++; }
  const per = (performance.now() - t0) / 20; console.log('  cost: a walk of ' + (hdist(a, g) / 1000).toFixed(1) + ' km ' + per.toFixed(2) + ' ms (1944, ' + M.nx * M.nz + ' cells)');
  ok(n === 20 && per < 15, '  a walk costs under 15 ms (' + per.toFixed(2) + ')');
}

/* the edges of the network side 0 could ambush: one with a site and a free squad that reaches it unseen, when the enemy uses it */
function usable($, S, Cm) {
  const E = S.T.net.e, out = [], X = Xof($, S, Cm);
  for (const e of E) { const H = { h: .8, n: 4, per: 150, next: S.t + 400 }; Cm.fpT = -1; const c = $('embCand')(Cm, X, 'emb', e.i, H); if (c) out.push(e.i); }
  return out;
}

console.log('-- P7: the ambush on the busiest road the side knows, reached unseen --');
{
  const { C, S, $ } = watch(), Cm = ready(C, S, $), K = $('MANT').emb, E = S.T.net.e;
  const U = usable($, S, Cm);
  ok(U.length >= 2, 'roads side 0 could ambush with a free squad that walks there unseen: ' + U.length + ' of ' + E.length);
  const [A, B] = U, T = S.t;
  habits(S, Cm, []); const X = Xof($, S, Cm);
  ok($('MANG').emb(Cm, X).length === 0, 'no traffic known: no ambush (the side has seen nobody pass)');
  habits(S, Cm, [[A, 2, [T - 400, T - 300]], [B, 9, [T - 360, T - 240, T - 120]]]);
  const hA = $('habOf')(Cm, A), hB = $('habOf')(Cm, B);
  let L = $('MANG').emb(Cm, X);
  ok(hB.h >= K.h && hA.h < K.h && L.length === 1 && L[0].res.site.e === B, 'road ' + B + ' habit ' + hB.h.toFixed(2) + ', road ' + A + ' ' + hA.h.toFixed(2) + ' (under .4): only the habitual one is a candidate');
  habits(S, Cm, [[A, 9, [T - 360, T - 240, T - 120]], [B, 4, [T - 400, T - 250, T - 100]]]);
  L = $('MANG').emb(Cm, X);
  ok(L.length === 2 && L[0].res.site.e === A && L[0].sc > L[1].sc, 'both habits: the busier road first (' + A + ': ' + $('habOf')(Cm, A).h.toFixed(2) + ', note ' + L[0].sc.toFixed(2) + '; ' + B + ': ' + $('habOf')(Cm, B).h.toFixed(2) + ', note ' + (L[1] ? L[1].sc.toFixed(2) : '-') + ')');
  const c = L[0], s = c.res.site, w = c.res.way, hq = S.base[1];
  ok(/rua mais usada pelo inimigo/.test(c.why) && c.spec.c === 'ambush' && c.sc > 0 && c.sc <= 2, '  why: "' + c.why + '"');
  ok(s.pos[0] && (s.f === 'lin' || s.f === 'L') && s.wood >= 0, '  the site: ' + (s.f === 'L' ? 'an L at a bend (' : 'linear on a straight stretch (') + (s.bend * 180 / Math.PI).toFixed(0) + '° over 250 m), the men on the side with more cover (' + s.wood + ' of 5 samples)');
  const direct = $('tmExp')(Cm, $('polyOf')([$('m4Lead')(c.res.q), s.pos[0]])), road = $('tripOf')($('m4Lead')(c.res.q).x, $('m4Lead')(c.res.q).z, s.pos[0].x, s.pos[0].z, { mode: 'foot' }), re = road ? $('tmExp')(Cm, road).exp : 1;
  ok(w.exp <= K.exp && w.exp <= direct.exp + 1e-9 && w.exp <= re + 1e-9, '  reached by the way the enemy sees least: ' + (w.len / 1000).toFixed(1) + ' km, ' + Math.round(w.exp * 100) + '% seen (straight ' + Math.round(direct.exp * 100) + '%, by the road ' + Math.round(re * 100) + '%), ' + Math.round(w.wood * 100) + '% in a wood');
  ok(c.res.Tp >= 0 && c.res.Tp - S.t >= c.res.eta + K.lead, '  the pass it makes: in ' + Math.round(c.res.Tp - S.t) + ' s, the walk ' + Math.round(c.res.eta) + ' s + ' + K.lead + ' s before it');
  const r = $('genCmd')(0, { c: 'man', k: 'ambush', x: c.spec.x, z: c.spec.z, why: c.spec.why }, 'ai', { spec: c.spec, res: c.res }), op = Cm.ops.find(o => o.k === 'emb' && !o.over);
  ok(r.ok && op && op.e === A && op.by === 'ai' && op.nsq >= 2, 'opened through genCmd as the AI: ' + (op ? op.nsq : 0) + ' squads (' + (op ? op.sq.map(q => q.er).join(', ') : '') + ')' + (r.ok ? '' : ' ' + r.why));
  const qs = op.sq, asl = qs.find(q => q.er === 'asl');
  ok(qs.every(q => q.op === op && !!q.tp && (q.er === 'sec' ? q.ord.k === 'observe' && q.ord.quiet : q.ord.k === 'ambush' && q.ord.op === op)), '  each squad on its own hidden way: assault and support to lie in ambush, the pickets to watch, silent');
  ok(has(S, 0, /^Emboscada planejada (linear|em L) na estrada .*: \d esquadras .*à vista \(direto \d+%\), próxima passagem prevista em ~\d+ s/), '  the log: "' + logs(S, 0).find(x => /^Emboscada planejada/.test(x)) + '"');
  ok($('opNew')(0, { c: 'ambush', x: s.x, z: s.z }, 'ai').why === 'busy' || $('opNew')(0, { c: 'ambush', x: s.x, z: s.z }, 'ai').why === 'cd', 'a second on the same road is refused');
  /* run: the squads walk there, it is armed before the pass, two vehicles spring it, it is out within 60 s */
  let set = null, spr = null, back = null;
  const truck = (x, z) => { const u = C.addVehicle('truck', null, 1, x, z, 0); u.seenT = -999; return u; };
  for (let i = 0; i < 9000 && !op.over; i++) {
    C.step(1 / 10);
    if (op.st === 'set' && set === null) { set = S.t; truck(s.x, s.z); truck(s.x + s.dx * 20, s.z + s.dz * 20); }
    if (op.sprung && spr === null) spr = S.t;
    if (op.st === 'back' && back === null) back = S.t;
  }
  ok(set !== null && op.Tp >= 0 && set <= op.Tp - K.lead + 1, 'armed at t = ' + (set === null ? '-' : set.toFixed(0)) + ' s, ' + (set === null ? '-' : Math.round(op.Tp - set)) + ' s before the pass due (' + K.lead + ' s or more)');
  ok(asl && asl.hf === false || spr !== null, '  silent while it waited (held its fire), sprung at t = ' + (spr === null ? '-' : spr.toFixed(0)) + ' s: ' + (logs(S, 0).find(x => /Emboscada planejada disparada/.test(x)) || 'no spring'));
  ok(spr !== null && back !== null && back - spr <= K.out + 3, '  out by its escape way ' + (back === null ? '-' : Math.round(back - spr)) + ' s after the first shot (' + K.out + ' s at most)');
  ok(op.over && qs.every(q => q.op !== op) && has(S, 0, /recuar pela rota de fuga/), '  over, its squads given back');
  ok(!H.nan(S), 'no NaN');
}

console.log('-- P7: honest, only the traffic it saw --');
{
  const { C, S, $ } = watch(), Cm = ready(C, S, $), E = S.T.net.e, U = usable($, S, Cm), A = U[0];
  habits(S, Cm, []);
  const e = E[A], vs = [0, 1, 2].map(i => { const p = e.smp[Math.min(e.smp.length - 1, i)], u = C.addVehicle('truck', null, 1, p.x, p.z, 0); u.seenT = -999; return u; });
  for (let k = 0; k < 4; k++) { S.t += 130; for (const u of vs) { const p = e.smp[(k + 1) % e.smp.length]; u.x = p.x; u.z = p.z; } $('habSense')(Cm); }
  ok(Cm.hu.every(v => v === 0) && $('MANG').emb(Cm, Xof($, S, Cm)).length === 0, 'an enemy column takes the road four times, nobody sees it: no traffic, no ambush');
  const D = $('cmdOf')(1); habits(S, D, [[A, 9, [S.t - 360, S.t - 240, S.t - 120]]]);
  ok($('MANG').emb(Cm, Xof($, S, Cm)).length === 0, 'the other side\'s habits never reach this side');
  for (let k = 0; k < 4; k++) { S.t += 130; for (const u of vs) { const p = e.smp[k % e.smp.length]; u.x = u.sx = p.x; u.z = u.sz = p.z; u.seenT = S.t; if (!Cm.known.includes(u)) Cm.known.push(u); } $('habSense')(Cm); }
  const Hh = $('habOf')(Cm, A), L = $('MANG').emb(Cm, Xof($, S, Cm));
  ok(Hh.h >= .4 && L.length === 1 && L[0].res.site.e === A, 'seen four times: habit ' + Hh.h.toFixed(2) + ', one each ~' + Math.round(Hh.per) + ' s: that road is the ambush\'s');
  const keep = JSON.stringify(L.map(c => [c.res.site.e, c.res.site.s, c.sc.toFixed(4)]));
  for (const u of S.units) if (u.team === 1 && !u.dead && !Cm.known.includes(u)) { u.x += 300; u.z -= 200; }
  ok(JSON.stringify($('MANG').emb(Cm, Xof($, S, Cm)).map(c => [c.res.site.e, c.res.site.s, c.sc.toFixed(4)])) === keep, 'enemy units nobody sees move: the same plan');
}

console.log('-- P9: the interdiction of the supply, at the narrowest place, fire at the hour due --');
{
  const { C, S, $ } = watch(), Cm = ready(C, S, $), roads = $('blkRoads')(Cm, 1), E = S.T.net.e;
  let A = -1;
  for (const e of E) { const m = e.smp[e.smp.length >> 1]; if ($('ecoDepth')(1, m.x, m.z) >= 0 && roads.some(r => e.smp.some(p => $('blkDist')(r, p.x, p.z) < 70)) && $('embSite')(Cm, e.i)) { A = e.i; break; } }
  ok(A >= 0, 'an enemy supply road behind its line with a place for an ambush (edge ' + A + ')');
  if (A >= 0) {
    const ch = $('itdChoke')(Cm, A), site = $('embSite')(Cm, A, ch.s - 400, ch.s + 400), p0 = site.pos[0], d0 = Math.hypot(S.base[0].x - p0.x, S.base[0].z - p0.z) || 1;
    for (const k of [0, 1]) { const x = p0.x + (S.base[0].x - p0.x) / d0 * (900 + k * 100), z = p0.z + (S.base[0].z - p0.z) / d0 * (900 + k * 100), r = $('railOf')(x, z), q = C.addSquad(0, x, z, r.ri, r.s); q.job = 'held'; q.jk = 0; q.ord = { k: 'hold', ri: r.ri, s: r.s }; }
    $('tmNow')(0); habits(S, Cm, [[A, 3, [S.t - 500, S.t - 200]]]);
    const L = $('MANG').itd(Cm, Xof($, S, Cm));
    ok(L.length >= 1 && L[0].res.site.e === A && L[0].res.Tp >= 0 && /suprimento inimigo passa/.test(L[0].why), 'two passes 300 s apart seen on it: a candidate at its narrowest place (choke ' + ch.k.toFixed(2) + '), the pass due in ' + (L[0] ? Math.round(L[0].res.Tp - S.t) : '-') + ' s: "' + (L[0] && L[0].why) + '"');
    habits(S, Cm, [[A, 3, [S.t - 200]]]); ok($('MANG').itd(Cm, Xof($, S, Cm)).length === 0, '  one pass only (no timetable): none');
    habits(S, Cm, [[A, 3, [S.t - 500, S.t - 200]]]);
    const r = $('genCmd')(0, { c: 'man', k: 'interdict', x: L[0].spec.x, z: L[0].spec.z }, 'ai', { spec: L[0].spec, res: L[0].res }), op = Cm.ops.find(o => o.k === 'itd' && !o.over);
    ok(r.ok && op && op.Tp >= 0 && has(S, 0, /^Interdição da logística (linear|em L) na estrada/), 'opened through genCmd: "' + logs(S, 0).find(x => /^Interdição da logística/.test(x)) + '"');
    op.st = 'set'; op.arr = S.t; S.t = op.Tp - $('MANT').itd.at + 1; $('OPS').itd(Cm, op);
    ok(op.fired > 0 && (Cm.fm.some(M => M.op === op && Math.hypot(M.x - op.kz.x, M.z - op.kz.z) < 1) || !$('gFireSrc')(0, 'he', op.kz.x, op.kz.z)), 'at the hour due the guns are called on the killing ground' + (Cm.fm.some(M => M.op === op) ? ' (' + Cm.fm.filter(M => M.op === op)[0].n + ' rounds)' : ' (no gun in reach: asked, none to fire)'));
    S.t = op.Tp + $('MANT').emb.win + 1; op.waits = $('MANT').emb.waits; $('OPS').itd(Cm, op);
    ok(op.over && has(S, 0, /Interdição na estrada .* recolhe: janela passou/), 'nobody came in the window, the last it waits for: it gives up ("janela passou")');
  }
}

console.log('-- P8: the alternate street, a junction whose loss makes the enemy go round --');
{
  const { C, S, $ } = watch(), Cm = ready(C, S, $), N = S.T.net, Q = S.cq.p;
  const L = $('grdSites')(Cm), K = $('MANT').grd;
  ok(L.length >= 1, 'the enemy\'s ways to our points give ' + L.length + ' junctions or bridges worth holding: ' + L.slice(0, 3).map(c => c.nm + ' ×' + c.r.toFixed(1)).join(', '));
  const c = L[0], a = $('mresIdx')(c.O.x, c.O.z), b = $('mresIdx')(c.P.x, c.P.z), len = e => e.len * $('RN').cls.veh[e.c];
  const main = $('netPath')(a, b, len), mset = new Set(main.e), without = $('netPath')(a, b, e => (c.cut.has(e.i) || (c.alt && mset.has(e.i)) ? Infinity : len(e))), base = c.alt ? $('netPath')(a, b, e => (mset.has(e.i) ? Infinity : len(e))) : main;
  const r = without ? without.c / base.c : Infinity;
  ok(r >= K.ratio && Math.abs(Math.min(r, 4) - c.r) < 1e-6, 'held, ' + c.nm + ' forces the enemy\'s way from ' + $('gName')(c.O) + ' to ' + $('gName')(c.P) + ' to ' + (without ? (without.c / 1000).toFixed(1) + ' km instead of ' + (base.c / 1000).toFixed(1) + ' km' : 'none at all') + (c.alt ? ' round our main road (its flank)' : '') + ' (×' + (r === Infinity ? '∞' : r.toFixed(2)) + ', ' + K.ratio + ' or more)');
  ok(L.every(o => hdist(o, o.P) >= K.near[0] && hdist(o, o.P) <= K.near[1] && o.P.hold === 0 && Q.filter(p => p.hold === 1).every(p => hdist(p, o) >= K.enemy)), '  all of them ' + K.near[0] + ' to ' + K.near[1] + ' m from a point we hold, none within ' + K.enemy + ' m of an enemy point');
  const G = $('MANG').grd(Cm, Xof($, S, Cm));
  ok(G.length >= 1 && G[0].spec.c === 'guard' && G[0].sc > 0 && /guardar .* (sem ela o inimigo|pelo flanco)/.test(G[0].why), 'a candidate: "' + (G[0] && G[0].why) + '" (note ' + (G[0] ? G[0].sc.toFixed(2) : '-') + ')');
  const R = $('genCmd')(0, { c: 'man', k: 'guard', x: G[0].spec.x, z: G[0].spec.z }, 'ai', { spec: G[0].spec, res: G[0].res }), op = Cm.ops.find(o => o.k === 'grd' && !o.over), q = op && op.sq[0];
  ok(R.ok && op && q.ord.k === 'hold' && !!q.tp && hdist(q.ord, G[0].res.c) < 1 && has(S, 0, /^Guarda da rua alternativa: esquadra a caminho de/), 'opened through genCmd: a squad walks unseen to hold it (' + (op ? (op.path.len / 1000).toFixed(1) + ' km, ' + Math.round(op.exp * 100) + '% seen' : '-') + ')');
  const P = Q[op.pi]; P.hold = 1; $('OPS').grd(Cm, op);
  ok(op.over && q.op !== op && has(S, 0, /Guarda de .* encerrada: o ponto .* caiu/), 'the point it guards falls: given up, the squad given back');
  P.hold = 0; Cm.m4g = null;
  const r2 = $('genCmd')(0, { c: 'man', k: 'guard', x: G[0].spec.x, z: G[0].spec.z }, 'ai'), op2 = Cm.ops.find(o => o.k === 'grd' && !o.over);
  ok(!r2.ok && r2.why === 'cd', 'the same junction again at once: refused (cd)');
}

console.log('-- P11: the counter-flank --');
{
  const { C, S, $ } = watch(), Cm = ready(C, S, $), Q = S.cq.p;
  const mine = Q.filter(p => p.hold === 0 && p.base < 0), foes = Q.filter(p => p.hold === 1).concat([S.base[1]]);
  let P = null, src = null, best = 0;
  for (const p of mine) { const f = foes.reduce((a, o) => (hdist(o, p) < hdist(a, p) ? o : a), foes[0]); if (!P || hdist(f, p) < best) { P = p; src = f; best = hdist(f, p); } }
  const ax = Math.atan2(src.z - P.z, src.x - P.x), at = a => ({ x: P.x + Math.cos(a) * 420, z: P.z + Math.sin(a) * 420 });
  const qrf = (ang) => {
    for (const o of Cm.ops) if (o.k === 'qrf' && !o.over) $('opEnd')(Cm, o);
    Cm.thb = []; const e = at(ang), u = $('addMan')('rifleman', 1, e.x, e.z); for (let i = 0; i < 4; i++) $('addMan')('rifleman', 1, e.x + i * 6, e.z); for (const m of S.men) if (m.team === 1 && hdist(m, e) < 40) { m.seenT = S.t; m.sx = m.x; m.sz = m.z; }
    $('cmdSense')(Cm, S.squads.filter(q => q.team === 0 && !q.net && q.live > 0 && !q.state)); $('tmNow')(0); $('thbSense')(Cm);
    const I = Cm.thb.find(I => I.k === 'pt' && hdist(I, P) < 50); if (!I) return null;
    const r = $('genCmd')(0, { c: 'qrf', id: I.id }, 'ai'); return r.ok ? Cm.ops.find(o => o.k === 'qrf' && !o.over) : null;
  };
  const n0 = $('M4S')().p11, front = qrf(ax);
  ok(front && !front.p11 && $('M4S')().p11 === n0, 'the enemy straight down the road from its point: the reaction as it was (no counter-flank)');
  const op = qrf(ax + Math.PI / 2);
  const fl = op ? op.sq.filter(q => q.qr === 'flk') : [];
  ok(op && op.p11 && fl.length >= 1 && $('M4S')().p11 === n0 + 1 && has(S, 0, /^Contra-flanco em .*: o inimigo vem pelo flanco \(\d+° do eixo\)/), 'the enemy on the flank (90°): a counter-flank: "' + logs(S, 0).find(x => /^Contra-flanco/.test(x)) + '"');
  if (op && fl.length) {
    const q = fl[0], L = $('m4Lead')(q), I = op.I, look = (sd) => { const ux = (I.x - I.kx) / (hdist(I, { x: I.kx, z: I.kz }) || 1), uz = (I.z - I.kz) / (hdist(I, { x: I.kx, z: I.kz }) || 1), T = $('THB'), x = I.kx + ux * T.stage - uz * sd * T.flank, z = I.kz + uz * T.stage + ux * sd * T.flank; return { x, z, v: $('tmExp')(Cm, $('polyOf')([L, { x, z }])).exp + Cm.tm.v[$('m4Cell')(Cm.tm, x, z)] }; };
    const s1 = look(1), s2 = look(-1), pick = hdist(q.ord, s1) < hdist(q.ord, s2) ? s1 : s2, other = pick === s1 ? s2 : s1;
    ok(pick.v <= other.v + 1e-9 && (!!q.tp || q.ord.wp === undefined), '  the flank goes round the side the enemy sees less (' + pick.v.toFixed(2) + ' against ' + other.v.toFixed(2) + ')' + (q.tp ? ', by the hidden walk' : ''));
    S.t = op.H; const nf = Cm.fm.length; $('OPS').qrf(Cm, op);
    ok(op.p11.f === 1 && (Cm.fm.length > nf || !$('gFireSrc')(0, 'he', op.p11.x, op.p11.z)) && hdist(op.p11, { x: I.kx, z: I.kz }) > 150, '  at H the mortars go on its way in, ' + Math.round(hdist(op.p11, { x: I.kx, z: I.kz })) + ' m behind it' + (Cm.fm.length > nf ? '' : ' (no tube in reach)'));
  }
}

console.log('-- a person and the MCP: the same doors --');
{
  const { C, S, $ } = watch(), Cm = ready(C, S, $), U = usable($, S, Cm);
  $('genCtl')(0, 'me');
  const e = S.T.net.e[U[0]], p = e.smp[e.smp.length >> 1];
  ok($('genCmd')(0, { c: 'man', k: 'ambush', x: p.x, z: p.z }, 'ai').why === 'ctl', 'the AI is refused while a person holds the chair');
  const r = $('genCmd')(0, { c: 'man', k: 'ambush', x: p.x, z: p.z, n: 2, why: 'teste' }, 'me'), op = Cm.ops.find(o => o.k === 'emb' && !o.over);
  ok(r.ok && op && op.by === 'me' && op.nsq === 2 && op.Tp === -1, 'man k=ambush x z n 2 by a person: an ambush on the road there, no timetable known (' + r.why + ')');
  ok($('genCmd')(0, { c: 'man', k: 'cancel', id: op.id }, 'me').ok && op.over, '  cancelled as any manoeuvre');
  ok($('genCmd')(0, { c: 'man', k: 'ambush', x: 5, z: S.HW - 5 }, 'me').why === 'at', '  far from any road: refused (at)');
  const G = $('grdSites')(Cm)[0], g = $('genCmd')(0, { c: 'man', k: 'guard', x: G.x + 100, z: G.z }, 'me');
  ok(g.ok && Cm.ops.some(o => o.k === 'grd' && !o.over && o.by === 'me'), 'man k=guard near a junction worth it: held (' + G.nm + ')');
  const V = $('genVM')(0, false), mo = V && V.ops ? V.ops.filter(o => o.k === 'grd') : [];
  ok(mo.length === 1 && mo[0].to && Array.isArray(mo[0].path) && mo[0].path.length >= 4 && /GRD|Guarda/.test($('GEN').mtag.grd + $('GEN').man.grd), 'the view has it: where it goes and its way');
}

console.log('-- off: M4.on 0 or no tactical map --');
{
  const { C, S, $ } = watch(), Cm = ready(C, S, $), U = usable($, S, Cm), T = S.t;
  habits(S, Cm, [[U[0], 9, [T - 360, T - 240, T - 120]]]);
  ok($('MANG').emb(Cm, Xof($, S, Cm)).length === 1, 'on: a candidate');
  $('M4').on = 0; ok($('MANG').emb(Cm, Xof($, S, Cm)).length === 0 && $('MANG').grd(Cm, Xof($, S, Cm)).length === 0 && $('opNew')(0, { c: 'ambush', x: 1, z: 1 }, 'ai').why === 'off', 'M4.on 0: none, and the door says off'); $('M4').on = 1;
  const tm = Cm.tm; Cm.tm = null; ok($('MANG').emb(Cm, Xof($, S, Cm)).length === 0, 'no map yet: none'); Cm.tm = tm;
}

console.log('-- AI × AI: no exception, no NaN, each over within its Tmax --');
if (SECS > 0) for (const era of ['ww2', 'modern']) {
  const C = H.load({ seed: 3, eco: 1, mapv: 6 }); C.$('globalThis').performance = performance;
  const S = C.watch(era, { len: 0 }), made = []; let err = null; const t0 = Date.now();
  try { C.run(SECS, () => { for (const Cm of S.cmd || []) for (const op of Cm.ops) if (op.man && !made.includes(op)) made.push(op); }, 1 / 30); } catch (e) { err = e; }
  const n = k => made.filter(o => o.k === k).length;
  ok(!err && !H.nan(S) && made.every(op => op.over || S.t - op.T0 <= op.Tmax + 25), era + ' ' + SECS + ' s: no exception, no NaN, every manoeuvre over in its time (' + (Date.now() - t0) + ' ms; emb ' + n('emb') + ', itd ' + n('itd') + ', grd ' + n('grd') + ', counter-flanks ' + C.$('M4S')().p11 + ')' + (err ? ' ' + err.stack : ''));
}
done();
