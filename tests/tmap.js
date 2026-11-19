'use strict';
/* The tactical map (M1 of the general's manoeuvre): seven layers on a 200 m grid by side (f enemy strength, v where the enemy sees, o cover, t enemy
   traffic, p own losses, k choke points, l the front), each one only from what the side knows; the ground's part once a terrain and again when a
   bridge falls; the refresh every TM.every s a piece a frame; gask tmap; the battle unchanged by it (nothing chooses by the map yet); its cost.
   SECS (default 60): the length of the AI × AI runs that compare the battle with and without the map and measure the cost. About two minutes */
const H = require('./harness'), ok = H.ok, { performance } = require('perf_hooks');
const SECS = process.env.SECS === undefined ? 60 : +process.env.SECS;
const watch = (o, w) => { const C = H.load(Object.assign({ seed: 9, eco: 1, mapv: 6 }, o)), S = C.watch((w && w.era) || 'ww2', Object.assign({ len: 0 }, w)); return { C, S, $: C.$ }; };
const cellOf = (M, x, z, S) => Math.min(M.nz - 1, Math.max(0, Math.floor((z + S.HW) / M.c))) * M.nx + Math.min(M.nx - 1, Math.max(0, Math.floor(x / M.c)));
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const sum = a => a.reduce((s, v) => s + v, 0);

console.log('-- the tables and the grid --');
{
  const { S, $ } = watch({}, {}), TM = $('TM'), TML = $('TML');
  ok(TML.join() === 'f,v,o,t,p,k,l' && TM.cell === 200 && TM.every === 4 && TML.every(k => typeof TM.nm[k] === 'string'), 'seven layers on a 200 m grid, refreshed every 4 s, each with its name');
  const Z = S.T.tms;
  ok(Z && Z.nx * Z.nz === 4200, 'the 1944 map: ' + Z.nx + ' × ' + Z.nz + ' = ' + Z.nx * Z.nz + ' cells, its ground built at the load (newState)');
  const { S: Sm } = watch({}, { era: 'modern' });
  ok(Sm.T.tms && Sm.T.tms.nx * Sm.T.tms.nz === 9900, 'today\'s map: ' + Sm.T.tms.nx * Sm.T.tms.nz + ' cells');
}

console.log('-- the ground: cover and choke points --');
{
  const { S, $ } = watch({}, {}), Z = S.T.tms, T = S.T, br = $('brs()');
  ok(Z.o.every(v => v >= 0 && v <= 1) && Z.k.every(v => v >= 0 && v <= 1), 'cover and choke points are 0 to 1');
  let wd = 0, wo = 0, op = 0, oo = 0; for (let q = 0; q < Z.o.length; q++) { if (Z.wood[q] > .6) { wd++; wo += Z.o[q]; } else if (Z.wood[q] === 0 && Z.bld[q] === 0 && Z.water[q] === 0) { op++; oo += Z.o[q]; } }
  ok(wd > 0 && wo / wd > .55 && oo / op < .2, 'a wood hides (mean cover ' + (wo / wd).toFixed(2) + ' in ' + wd + ' wooded cells), open ground does not (' + (oo / op).toFixed(2) + ')');
  let hb = 0, hbo = 0; for (let q = 0; q < Z.o.length; q++) if (Z.bld[q] >= .6) { hb++; hbo += Z.o[q]; }
  ok(hb > 0 && hbo / hb >= .6, 'a town\'s houses hide too (' + hb + ' cells, mean ' + (hbo / hb).toFixed(2) + ')');
  ok(br.length === 6 && br.every(b => Z.k[cellOf(Z, b.x, b.z, S)] === 1), 'each of the 6 bridges is a choke point of 1');
  const j = T.net.n.filter(q => q.e.length >= 3);
  ok(j.length > 0 && j.every(q => Z.k[cellOf(Z, q.x, q.z, S)] >= .5), 'each junction of three roads or more is one (' + j.length + ' junctions)');
  ok(Z.k.filter(v => v > 0).length < Z.k.length * .2, 'and most of the map is none (' + Z.k.filter(v => v > 0).length + ' of ' + Z.k.length + ' cells)');
  const b = br[0], q = cellOf(Z, b.x, b.z, S), k0 = Z.k.slice(), down = (x, by) => $('hitObj')(x.o, 1e5, by || null);
  down(b); C_step($, 1 / 60);
  const Z2 = $('tmStatic')(T);
  ok(S.brk === '0x' && Z2.key === '0x' && Z2.k[q] < 1 && Z2.o === Z.o && Z2.hg === Z.hg, 'a bridge falls: the choke points are made again (its cell ' + k0[q] + ' → ' + Z2.k[q].toFixed(2) + '), the cover and the heights kept');
  ok(!same(Z2.k, k0) && sum(Z2.k) !== sum(k0), '  and the roads that are now the only way round weigh otherwise (Σk ' + sum(k0).toFixed(1) + ' → ' + sum(Z2.k).toFixed(1) + ')');
}
function C_step($, dt) { $('step')(dt); }

console.log('-- the sight: a hill and a wood hide --');
{
  const { $ } = watch({}, {}), look = $('tmLook'), n = 30, hx = 61, hz = 7, hg = new Float32Array(hx * hz), mk = () => ({ c: 200, nx: n, nz: 3, HW: 300, hs: 100, hx, hz, hg, scr: new Float32Array(n * 3), o: new Float32Array(n * 3) });
  const Z = mk(), v = new Float32Array(n * 3), o = { x: 100, z: 0, e: 2, r: 5000 };
  look(Z, o, v);
  ok(v[n + 0] === 1 && v[n + 10] > .5 && v[n + 24] > .5, 'flat open ground: the observer sees its cell (1) and far along the row (' + v[n + 10].toFixed(2) + ' at 2 km, ' + v[n + 24].toFixed(2) + ' at 4,8 km)');
  for (let j = 0; j < hz; j++) hg[j * hx + 20] = 60;   // a ridge 2 km out
  const v2 = new Float32Array(n * 3); look(Z, o, v2);
  ok(v2[n + 9] > 0 && v2[n + 12] === 0 && v2[n + 20] === 0, 'a ridge 60 m high at 2 km: before it seen (' + v2[n + 9].toFixed(2) + '), behind it nothing');
  hg.fill(0); const Zw = mk(); Zw.scr[n + 5] = Zw.scr[n + 6] = 1; const v3 = new Float32Array(n * 3); look(Zw, o, v3);
  ok(v3[n + 4] > .5 && v3[n + 8] === 0, 'two cells of thick wood in the way: up to them seen, beyond them not');
  const Zo = mk(); Zo.o[n + 10] = 1; const v4 = new Float32Array(n * 3); look(Zo, o, v4);
  ok(v4[n + 10] < v[n + 10] * .5, 'a cell that hides itself is seen less (' + v[n + 10].toFixed(2) + ' → ' + v4[n + 10].toFixed(2) + ')');
  const v5 = new Float32Array(n * 3); look(Z, { x: 100, z: 0, e: 2, r: 1500 }, v5);
  ok(v5[n + 7] > 0 && v5[n + 8] === 0, 'nothing past the observer\'s reach (1,5 km)');
}

console.log('-- honest: only what the side knows --');
{
  const { S, $ } = watch({}, {}), C = $('cmdOf')(0), sq = () => S.squads.filter(q => q.team === 0 && !q.net && q.live > 0 && !q.state), sense = () => $('cmdSense')(C, sq());
  S.units.length = 0; S.men.length = 0; S.squads.length = 0;   // an empty field: only the points
  const u = $('addMan')('rifleman', 1, 6000, 1200);
  sense(); const A = $('tmNow')(0), f0 = A.f.slice(), v0 = A.v.slice(), l0 = A.l.slice();
  ok(!C.known.includes(u), 'an enemy soldier nobody has seen is not in what the side knows');
  u.x = 7000; u.z = 2400; sense(); const B = $('tmNow')(0);
  ok(same(B.f, f0) && same(B.v, v0) && same(B.l, l0), 'moving him unseen changes no layer (strength, sight, front)');
  u.seenT = S.t; u.sx = 7000; u.sz = 2400; sense(); const K = $('tmNow')(0), q = cellOf(K, 7000, 2400, S);
  ok(C.known.includes(u) && K.f[q] > 0 && f0[q] === 0, 'seen: his strength is where he was reported (' + K.f[q].toFixed(2) + ')');
  ok(K.v[q] > v0[q] && K.obs > A.obs, 'and he is an observer: the side now knows the enemy sees there (' + v0[q].toFixed(2) + ' → ' + K.v[q].toFixed(2) + ', observers ' + A.obs + ' → ' + K.obs + ')');
  u.x = 2000; u.z = -3000; sense(); const K2 = $('tmNow')(0);
  ok(same(K2.f, K.f) && same(K2.v, K.v), 'he walks off unseen: the map keeps where he was reported, not where he is');
  S.t += $('CMD').mem + 1; sense(); const K3 = $('tmNow')(0);
  ok(K3.f[q] === 0 && same(K3.f, f0), 'and after CMD.mem s unseen he is forgotten (strength back to what it was)');
  const P = $('tmObs')(C);
  ok(P.every(o => (S.cq.p.some(p => p.hold === 1 && Math.hypot(p.x - o.x, p.z - o.z) < 1)) || S.forts.some(f => f.team === 1 && f.pre && Math.hypot(f.x - o.x, f.z - o.z) < 1)), 'the observers left are the points the enemy holds and its works that every side sees (' + P.length + ')');
  const D = $('cmdOf')(1); D.known = [u]; $('tmNow')(1);
  ok(same($('tmNow')(0).f, K3.f), 'what the other side knows never reaches this side\'s map');
}

console.log('-- the layers --');
{
  const { S, $ } = watch({}, {}), C = $('cmdOf')(0), sense = () => $('cmdSense')(C, S.squads.filter(q => q.team === 0 && !q.net && q.live > 0 && !q.state));
  $('run')(1); sense(); const M = $('tmNow')(0), n = M.nx * M.nz;
  ok(['f', 'fo', 'v', 't', 'nxt', 'p', 'l'].every(k => M[k].constructor.name === 'Float32Array' && M[k].length === n) && M.o === S.T.tms.o && M.k === S.T.tms.k && M.fr.length === n, 'each layer a Float32Array of the grid; cover and choke points the ground\'s own');
  const b1 = S.base[1], b0 = S.base[0];
  ok(M.v[cellOf(M, b1.x, b1.z, S)] > .5 && M.v[cellOf(M, b0.x, b0.z, S)] === 0, 'the enemy sees from its base (' + M.v[cellOf(M, b1.x, b1.z, S)].toFixed(2) + '), not over ours');
  const qo = M.fo.findIndex((v, i) => v > 1 && M.f[i] === 0), qe = M.f.findIndex((v, i) => v > 1 && M.fo[i] === 0);
  ok(qo >= 0 && M.l[qo] > 0 && (qe < 0 || M.l[qe] < 0) && M.l.every((v, i) => !(M.fo[i] === 0 && M.f[i] === 0) || v === 0), 'the front: ours where only we stand (l ' + (qo >= 0 ? M.l[qo].toFixed(2) : '-') + '), theirs where only the enemy we know of stands (' + (qe >= 0 ? M.l[qe].toFixed(2) : 'none known') + '), nobody\'s where neither');
  ok(M.fr.every((v, i) => !v || M.l[i] > 0), '  the line (fr) runs along our edge of it');
  ok(M.l.every(v => v > -1 && v < 1) && M.v.every(v => v >= 0 && v <= 1), 'the front is -1 to 1 and the sight 0 to 1');
  /* traffic: the habits of one edge */
  const E = S.T.net.e, e = E.find(x => x.c > 0) || E[0]; C.hu = new Float32Array(E.length); C.hp = E.map(() => []); C.hl = new WeakMap(); C.hk = new Set(); C.huT = S.t;
  C.hu[e.i] = 6; C.hp[e.i] = [S.t - 200, S.t - 100, S.t]; const Mt = $('tmNow')(0), p = e.smp[e.smp.length >> 1], qt = cellOf(Mt, p.x, p.z, S), H = $('habOf')(C, e.i);
  ok(Mt.t[qt] > .5 && Math.abs(Mt.t[qt] - H.h) < 1e-6 && Math.abs(Mt.nxt[qt] - H.next) < 1e-3, 'traffic: an edge the enemy took three times 100 s apart shows its habit (' + Mt.t[qt].toFixed(2) + ') and when the next pass is due (in ' + (Mt.nxt[qt] - S.t).toFixed(0) + ' s)');
  ok(Mt.t.filter(v => v > 0).length <= e.smp.length && Mt.nxt.filter(v => v >= 0).length <= e.smp.length, '  only on that edge\'s cells');
  /* losses */
  const x = 3000, z = 500, qp = cellOf(M, x, z, S); $('cmdLoss')({ team: 0, man: 1, x, z }); $('cmdLoss')({ team: 0, kind: 'tank', x, z, def: {} });
  const Mp = $('tmNow')(0);
  ok(Math.abs(Mp.p[qp] - 7) < 1e-4 && sum(Mp.p) - Mp.p[qp] < 1e-6, 'losses: a man (1) and a tank (6) lost in one 200 m cell: 7 there, nothing elsewhere');
  S.t += $('TM').half; const Mp2 = $('tmNow')(0);
  ok(Math.abs(Mp2.p[qp] - 3.5) < 1e-3, '  fading by half in TM.half s (' + Mp2.p[qp].toFixed(2) + ')');
  $('cmdLoss')({ team: 1, man: 1, x, z }); ok($('tmNow')(0).p[qp] === Mp2.p[qp] || Math.abs($('tmNow')(0).p[qp] - Mp2.p[qp]) < 1e-6, '  the enemy\'s losses are not ours');
}

console.log('-- gask tmap --');
{
  const { S, $ } = watch({}, {}), A = $('genAnswer'), Q = $('genQuery');
  const r0 = A(0, { q: 'tmap', k: 'v' });
  ok(r0.ok && r0.r.none === 1 && r0.r.k === 'v', 'before the first refresh: answered, none 1');
  $('run')(5); const r = A(0, { q: 'tmap', k: 'v' }), R = r.r;
  ok(r.ok && R.c === 1000 && R.nx === Math.ceil(S.W / 1000) && R.nz === Math.ceil(2 * S.HW / 1000) && R.a.length === R.nx * R.nz && R.x0 === 0 && R.z0 === -S.HW && R.nm === 'Vigilância inimiga', 'a layer at 1 km: ' + R.nx + ' × ' + R.nz + ', from x 0 and z -HW');
  ok(R.a.every(v => Number.isInteger(v) && v >= 0 && v <= 100) && R.a.some(v => v > 0) && R.age >= 0 && R.age <= 4, 'sight in per cent (most ' + Math.max(...R.a) + '), ' + R.age + ' s old');
  const M = S.cmd[0].tm; let w = -1; for (let b = 0; b < 5; b++) for (let a = 0; a < 5; a++) w = Math.max(w, M.v[b * M.nx + a]);
  ok(R.a[0] === Math.round(w * 100), '  a 1 km cell is the highest of its 25 fine cells');
  const sz = ['f', 'v', 'o', 't', 'p', 'k', 'l'].map(k => JSON.stringify(A(0, { q: 'tmap', k })).length), ml = A(0, { q: 'tmap', k: 'l' }).r.a;
  ok(Math.max(...sz) < 15000 && ml.every(v => v >= -100 && v <= 100), 'every layer fits a gres (largest ' + Math.max(...sz) + ' bytes); the front -100 to 100');
  ok(A(0, { q: 'tmap' }).r.k === 'v' && !A(0, { q: 'tmap', k: 'x' }).ok && A(0, { q: 'tmap', k: 'x' }).why === 'kind', 'no k: sight; an unknown layer: refused (kind)');
  ok(JSON.stringify(Q(1, { q: 'tmap', k: 'k' }).a) === JSON.stringify(A(1, { q: 'tmap', k: 'k' }).r.a) && Q(0, { q: 'tmap', k: 'x' }).why === 'kind', 'the MCP\'s local question (genQuery) answers the same');
  ok(!same(A(0, { q: 'tmap', k: 'v' }).r.a, A(1, { q: 'tmap', k: 'v' }).r.a), 'each side gets its own map');
}

console.log('-- the refresh: cadence, slices, the battle unchanged, the cost --');
if (SECS > 0) {
  const run = (on, era) => {
    const C = H.load({ seed: 21, eco: 1, mapv: 6 }); C.$('globalThis').performance = performance; C.$('TM').on = on; C.$('AP').on = 0;   // the approaches (M2) read the map: off, the map alone must change nothing
    const S = C.watch(era, { len: 0 }), TMB = C.$('TMB'), AIB = C.$('AIB'); let maxPer = 0, gen = 0, n = 0;
    C.run(SECS, () => { maxPer = Math.max(maxPer, S.tmJ ? S.tmJ.filter(Boolean).length : 0); const g = AIB.gn[(AIB.i + AIB.win - 1) % AIB.win]; gen += g; n++; });
    const st = S.units.filter(u => !u.dead).map(u => [u.kind, Math.round(u.x), Math.round(u.z)].join()).sort().join(';') + '|' + S.men.filter(m => !m.dead).length + '|' + S.cq.tk.join() + '|' + S.cmd.map(c => c.ops.map(o => o.k).join()).join('/');
    return { S, st, TMB: TMB.stat(), gen: gen / n, maxPer };
  };
  for (const era of ['ww2', 'modern']) {
    const a = run(1, era), b = run(0, era);
    ok(a.st === b.st, era + ': the same match with and without the map (units, men, tickets, operations after ' + SECS + ' s): the map alone changes nothing (the approaches, which read it, off)');
    ok(a.TMB.refreshes.every(n => n >= Math.floor(SECS / 4) - 1) && a.S.cmd.every(C => C.tm && C.tm.n >= Math.floor(SECS / 4) - 1), '  refreshed every 4 s on each side (' + a.TMB.refreshes.join(', ') + ' times)');
    ok(a.maxPer <= 2 && b.TMB.frames === 0 && !b.S.cmd.some(C => C.tm), '  at most one job a side at a time; TM.on 0 runs none');
    console.log('  cost ' + era + ': map ' + a.TMB.avg.toFixed(3) + ' ms a frame (worst ' + a.TMB.worst.toFixed(2) + ' ms), a refresh ' + a.TMB.refresh.join(' / ') + ' ms in all; the commanders\' share (AIB.gen) ' + b.gen.toFixed(3) + ' → ' + a.gen.toFixed(3) + ' ms a frame');
    ok(a.TMB.avg < .3, '  the map costs under 0,3 ms a frame on average (' + a.TMB.avg.toFixed(3) + ')');
  }
}
H.done();
