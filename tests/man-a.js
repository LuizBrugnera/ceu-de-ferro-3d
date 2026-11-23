'use strict';
/* Roads plan, slice 3 (map version 4), manoeuvres batch A: mres (Reserva móvel), dep (Defesa em profundidade) and gue (Fustigamento). For each: the situation that
   makes it a candidate (a sane score and spec), opened through genCmd 'ai' with the resolved spec and through a person (JSON only), run to its end, its squads
   released, its line in the general's log. Env: PAGE (the page to test), BATTLE=<era> for only a 300 s solo battle at map 4 with the economy on (SECS to change it):
   no exception, no NaN, and how many times each kind opened. */
const H = require('./harness'), { ok, done } = H;
const hdist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z), jsn = o => JSON.parse(JSON.stringify(o));
const KINDS = ['mres', 'dep', 'gue'];
/* an empty battlefield with the points: nothing spawns by itself, no manoeuvre is chosen by the AI (mnT), no assault by side 1 */
const fresh = (C, era) => {
  C.seed(7); const S = C.newState(era, C.$('ERAS')[era].sides[0].fighter, { cls: 'plane' }); S.demo = false; S.over = true; S.units = []; S.planes = []; S.men = []; S.squads = []; S.fld.forEach(f => { f.next = 1e9; });
  for (const t of [0, 1]) { const Cm = C.$('cmdOf')(t); Cm.mnT = 1e9; if (t) Cm.atkT = 1e9; }
  return S;
};
/* s seconds of the sim, the planner of both sides each second; each() may return false to stop; enemy men are seen (known) while `seen` */
const tick = (C, S, secs, each, seen) => {
  for (let i = 0; i < secs; i++) {
    if (seen) for (const m of S.men) if (m.team === 1 && !m.dead) { m.seenT = S.t; m.sx = m.x; m.sz = m.z; }
    C.run(1, null, 1 / 10); for (const t of [0, 1]) C.$('plan')(t);
    if (each && each() === false) break;
  }
};
const logOf = (S, t, re) => ((S.glog && S.glog.l[t]) || []).filter(e => re.test(e.s));
if (process.env.BATTLE) {
  const era = process.env.BATTLE, SECS = +process.env.SECS || 300, C = H.load({ seed: 101, mapv: 4, eco: true }), $ = C.$, S = C.newState(era, $('ERAS')[era].sides[0].fighter, { cls: 'plane' });
  const made = []; let err = null; const t0 = Date.now();
  try { C.run(SECS, () => { for (const Cm of S.cmd || []) for (const op of Cm.ops) if (op.man && !made.includes(op)) made.push(op); }, 1 / 30); } catch (e) { err = e; }
  const bad = S.cq.p.some(p => !Number.isFinite(p.c)) || !Number.isFinite(S.cq.tk[0]) || !Number.isFinite(S.cq.tk[1]);
  const n = Object.fromEntries(['flk', 'inf', 'raid', 'cut', 'blk', 'dep', 'fnt', 'mres', 'gue'].map(k => [k, made.filter(o => o.k === k).length]));
  ok(!err && !H.nan(S) && !bad, era + ' ' + SECS + ' s at map 4, economy ' + ($('ECO').on ? 'on' : 'OFF') + ': no exception, no NaN (' + (Date.now() - t0) + ' ms)' + (err ? ' ' + err.stack : ''));
  console.log('  opened (all kinds): ' + JSON.stringify(n) + '; batch A: ' + KINDS.map(k => k + ' ' + n[k]).join(', ') + '; made ' + made.length + ', over ' + made.filter(o => o.over).length);
  done(); return;
}
for (const era of ['ww2', 'modern']) {
  console.log(era);
  const C = H.load({ seed: 5, mapv: 4 }), $ = C.$, genCmd = $('genCmd'), genCtl = $('genCtl');
  /* ---- mres ---- */
  /* an empty battlefield, the reserve at `pos` (default the base: the map's far nodes are out of a foot trip's reach from it on the larger map, so then a held point) and three free squads */
  const mkRes = pos => {
    const S = fresh(C, era), base = S.base[0], R0 = S.T.routes[0], a = pos || { x: base.x, z: base.z, ri: 0, s: R0.len - 100 }, q = C.addSquad(0, a.x, a.z, a.ri, a.s); q.job = 'base'; q.jk = 0; $('setOrd')(q, pos ? { k: 'hold', ri: a.ri, s: a.s, x: a.x, z: a.z } : $('post')(0, 'base', 0));
    for (let i = 0; i < 3; i++) { const f = C.addSquad(0, base.x, base.z, 0, R0.len - 400 - i * 30); f.job = 'held'; f.jk = i; $('setOrd')(f, { k: 'hold', ri: 0, s: f.s }); }
    return { S, q };
  };
  const at0 = (() => { for (const p of [null].concat(fresh(C, era).cq.p.filter(p => p.hold === 0 && p.base < 0))) { const { S } = mkRes(p), Cm = $('cmdOf')(0); $('cmdSense')(Cm, S.squads.filter(s => s.team === 0)); if ($('MANG').mres(Cm, { t: 0, C: Cm, sq: S.squads, free: [], room: 3, doc: 'balanced', ds: -1, live: Cm.man }).length) return p; } return null; })();
  console.log('  (the reserve starts ' + (at0 ? 'at point ' + at0.L + ' · ' + at0.name : 'at the base') + ')');
  { const { S, q } = mkRes(at0), Cm = $('cmdOf')(0);
    $('cmdSense')(Cm, S.squads.filter(s => s.team === 0));
    const X = { t: 0, C: Cm, sq: S.squads, free: [], room: 3, doc: 'balanced', ds: -1, live: Cm.man }, cs = $('MANG').mres(Cm, X), c = cs[0];
    ok(cs.length === 1 && c.k === 'mres' && c.sc > 0 && c.sc <= 1.5 * ($('stgAct')(Cm) ? $('stgMul')(Cm, $('STG').man, 'mres') : 1) + 1e-9 && c.spec.c === 'reserve' && Number.isFinite(c.spec.x) && c.at && /pontos em até/.test(c.why), 'mres: a candidate when the reserve stands off the best node and the side holds 3 points, score ' + (c && c.sc.toFixed(2)) + ', ' + (c && c.why));
    ok($('MANG').mres(Cm, X).length === 0, 'mres: it looks only every ' + $('MANT').mres.every + ' s');
    Cm.mrT = 0; const r = genCmd(0, { c: 'man', k: c.spec.c === 'reserve' ? 'reserve' : '', x: c.spec.x, z: c.spec.z, why: c.spec.why }, 'ai', { spec: c.spec, res: c.res });
    const op = Cm.man.find(o => o.k === 'mres'), po = $('post')(0, 'base', 0);
    ok(r.ok && !!op && op.man === 1 && op.by === 'ai' && !!Cm.resAt && Math.abs(po.x - Cm.resAt.x) < 1e-6 && po.k === 'hold' && q.ord.x === Cm.resAt.x && !q.op, 'mres: opened through genCmd ai; C.resAt is the base post; the squad keeps q.op free (' + (r.ok ? 'ok' : r.why) + ')');
    ok(logOf(S, 0, /^Reserva móvel posta em .+: alcança \d+ pontos em até [\d,]+ km$/).length === 1, 'mres: the log says where and how far it reaches: ' + (logOf(S, 0, /^Reserva móvel/)[0] || {}).s);
    ok(genCmd(0, { c: 'man', k: 'reserve' }, 'ai').why === 'cd' && $('opNew')(0, { c: 'reserve' }, 'ai').why !== 'ok', 'mres: its cooldown holds (cd)');
    /* the reserve in its place answers a point on another axis by the roads */
    { const q2 = q, a = Cm.resAt, L = q2.men.find(m => !m.dead); for (const m of q2.men) { m.x = a.x; m.z = a.z; } q2.ri = a.ri; q2.s = a.s; q2.tp = null; q2.at = true; $('setOrd')(q2, Object.assign({}, a.o));
      const D = S.cq.p.find(p => p.hold === 0 && p.base < 0 && p.ri !== a.ri && p.tw) || S.cq.p.find(p => p.hold === 0 && p.base < 0 && p.ri !== a.ri);
      if (D) { for (let i = 0; i < 5; i++) { const m = C.addMan($('INF')[S.era][S.fac[1]][0], 1, D.x + i * 6, D.z + 40, 0); m.seenT = S.t; m.sx = m.x; m.sz = m.z; }
        const tp = $('tripSq')(q2, { x: D.x, z: D.z }); let err = null;
        try { tick(C, S, 3, null, true); } catch (e) { err = e; }
        const asked = logOf(S, 0, /^Reserva avança/).length > 0;
        ok(!err && (tp ? asked : !asked), 'mres: with the reserve off the point\'s axis (' + a.ri + ' against ' + D.ri + ') it answers by a trip when the trip is within reach (trip ' + (tp ? (tp.len | 0) + ' m' : 'none') + ', answered ' + asked + ')' + (err ? err.stack : '')); S.men = S.men.filter(m => m.team === 0); }
    }
    /* it ends by its time, releasing the post */
    let err = null; try { tick(C, S, op.Tmax + 20, () => !op.over); } catch (e) { err = e; }
    ok(!err && op.over && !Cm.resAt && !Cm.man.includes(op) && $('post')(0, 'base', 0).x !== undefined && Math.abs($('post')(0, 'base', 0).x - S.base[0].x) < 3000 && logOf(S, 0, /^Reserva móvel encerrada|^Reserva móvel posta/).length >= 1 && logOf(S, 0, /encerrada: tempo esgotado/).length === 1, 'mres: it is over by Tmax (' + op.Tmax + ' s), C.resAt is cleared and the base post is the base again' + (err ? err.stack : ''));
    ok(S.squads.every(s => !s.op || !s.op.over), 'mres: no squad points at an op that is over');
  }
  /* mres, a person (JSON only), cancelled, and refused with no reserve */
  { const { S, q } = mkRes(at0), Cm = $('cmdOf')(0); genCtl(0, 'me'); const pi = S.cq.p.findIndex(p => p.hold === 0 && p.base < 0 && S.T.net.n.some(n => n.k !== 'b' && hdist(n, p) < 150 && hdist(n, q.men[0]) > $('MANT').mres.move && $('mresTrip')(q.men[0], n)));
    const rh = genCmd(0, jsn({ c: 'man', k: 'reserve', pi, why: 'teste' }), 'me'), oh = Cm.man.find(o => o.k === 'mres' && !o.over);
    ok(rh.ok && !!oh && oh.by === 'me' && Cm.resAt && logOf(S, 0, /^General: /).length >= 1, 'mres: a person orders it with JSON (point ' + pi + '): ' + (rh.ok ? 'ok' : rh.why));
    const rc = genCmd(0, jsn({ c: 'man', k: 'cancel', id: oh && oh.id }), 'me'); ok(rc.ok && oh.over && !Cm.resAt && !q.op, 'mres: and cancels it (resAt cleared)');
    genCtl(0, 'ai'); Cm.mcd = {}; q.live = 0; for (const m of q.men) m.dead = true;
    ok(genCmd(0, { c: 'man', k: 'reserve' }, 'ai').why === 'sq', 'mres: with no reserve it is refused (sq)');
  }
  /* ---- dep ---- */
  { const S = fresh(C, era), Cm = $('cmdOf')(0), R = S.T.routes;
    if (era === 'modern') { $('MANT').dep.back = [600, 2600]; $('DEPX').cover = 0; }   // modern's nodes behind the line are farther than the ww2 window and stand on open ground: widened here only
    let ri = -1, b = null; for (const i of [1, 0, 2]) { b = $('depBest')(Cm, 0, i); if (b) { ri = i; break; } }
    ok(!!b, 'dep: a fallback node exists on an axis (' + (b ? 'axis ' + ri + ': ' + b.n.id + ', ' + (b.back | 0) + ' m behind the line, cover ' + b.cover.toFixed(1) : 'none') + ')');
    const ds = -1, sq = [];
    for (let i = 0; i < 5; i++) { const s = b.s - ds * 60 * i - 200, p = $('routeAt')(R[ri], s), f = C.addSquad(0, p.x, p.z, ri, s); f.job = 'held'; f.jk = i; $('setOrd')(f, { k: 'hold', ri, s }); sq.push(f); }
    const eng = sq[3]; eng.men[0].kit = 1;
    $('cmdSense')(Cm, sq); Cm.ratio[ri] = .3; Cm.post[ri] = 'def'; Cm.upos = []; Cm.upos[ri] = { k: 'def', T: 1e9 };
    const X = { t: 0, C: Cm, sq, free: sq, room: 2, doc: 'balanced', ds, live: Cm.man }, cs = $('MANG').dep(Cm, X), c = cs[0];
    ok(cs.length === 1 && c.k === 'dep' && c.sc > 0 && c.sc <= 2 && Math.abs(c.sc - Math.min(2, 1.5 * $('DEPX').press / .3 - 1)) < 1e-9 && c.spec.c === 'depth' && Number.isFinite(c.spec.x), 'dep: a candidate when axis ' + ri + ' is in defence (ratio .3), score ' + (c && c.sc.toFixed(2)) + ', ' + (c && c.why));
    Cm.ratio[ri] = 5; ok($('MANG').dep(Cm, X).length === 0, 'dep: none when the ratio is high'); Cm.ratio[ri] = .3;
    const r = genCmd(0, { c: 'man', k: 'depth', x: c.spec.x, z: c.spec.z, why: c.spec.why }, 'ai', { spec: c.spec, res: c.res }), op = Cm.man.find(o => o.k === 'dep');
    ok(r.ok && !!op && Cm.fb[ri] && Cm.fb[ri] === op.fb && op.ri === ri && Math.abs(op.fb.x - c.spec.x) < 1e-6, 'dep: opened through genCmd ai; C.fb[' + ri + '] set (' + (op && op.fb.nm) + ')');
    ok(op.dig === eng && eng.op === op && eng.ord.dig && eng.ord.dig.k === 1 && eng.ord.k === 'hold' && !sq.some(q => q !== eng && q.op), 'dep: an engineer squad of the axis is taken to dig (O.dig), no other');
    ok(logOf(S, 0, /^Defesa em profundidade na rota \d: linha de recuo em .+ \(relação [\d,]+:1\)$/).length === 1, 'dep: the log says the fallback and the ratio: ' + (logOf(S, 0, /^Defesa em profundidade/)[0] || {}).s);
    ok(genCmd(0, { c: 'man', k: 'depth', ri }, 'ai').why !== 'ok', 'dep: no second one on the axis (cd or max)');
    /* the line post falls back to it (cmdDefend's hook) */
    { const lp = C.addSquad(0, 0, 0, ri, 0); lp.job = 'line'; lp.jk = 0; const s0 = op.fb.s + ds * 600, pp = $('routeAt')(R[ri], s0); for (const m of lp.men) { m.x = pp.x; m.z = pp.z; } lp.s = s0; lp.ri = ri; $('setOrd')(lp, { k: 'hold', ri, s: s0, x: pp.x, z: pp.z }); lp.n0 = 10; lp.live = 3; lp.fd = 100;
      let err0 = null; try { $('cmdDefend')(Cm, [lp]); } catch (e) { err0 = e; }
      ok(!err0 && lp.ord.k === 'withdraw' && lp.ord.x === op.fb.x && lp.ord.z === op.fb.z && lp.ord.s === op.fb.s && logOf(S, 0, /^Posto da linha recua para a linha de recuo em /).length === 1, 'dep: a losing line post falls back to the fallback line, not CMD.wdb m back' + (err0 ? err0.stack : ''));
      const none = C.addSquad(0, pp.x, pp.z, ri === 2 ? 0 : 2, 100); none.job = 'line'; none.n0 = 10; none.live = 3; none.fd = 100; none.ord = { k: 'hold', ri: none.ri, s: 100 }; const L2 = none.men[0];
      ok($('depWithdraw')(Cm, none, L2) === false, 'dep: an axis with no fallback keeps the old retreat'); S.squads = S.squads.filter(s => s !== none); S.men = S.men.filter(m => m.sq !== none); S.squads = S.squads.filter(s => s !== lp); S.men = S.men.filter(m => m.sq !== lp); }
    let n = 0, err = null; try { tick(C, S, 30, () => { n++; }); } catch (e) { err = e; }
    ok(!err && !op.over && Cm.fb[ri] === op.fb, 'dep: it stays while the axis is in defence (30 s)' + (err ? err.stack : ''));
    const FP = S.forts.filter(f => f.team === 0 && !f.pre).length;
    /* the posture passes: called off after MANT.dep.calm s */
    Cm.upos = []; let T0 = null; let err2 = null;
    try { tick(C, S, 200, () => { if (T0 === null && Cm.post[ri] !== 'def') T0 = S.t; return !op.over; }); } catch (e) { err2 = e; }
    ok(!err2 && op.over && T0 !== null && S.t - T0 >= $('MANT').dep.calm - 3 && S.t - T0 < $('MANT').dep.calm + 20 && !Cm.fb[ri] && !Cm.man.includes(op) && !eng.op && logOf(S, 0, /encerrada: a pressão cedeu/).length === 1, 'dep: called off ' + (T0 === null ? '-' : (S.t - T0).toFixed(0)) + ' s after the posture left defence; C.fb cleared, the digger released' + (err2 ? err2.stack : '') + ' (trenches dug by then: ' + FP + ')');
    /* a person */
    Cm.mcd = {}; genCtl(0, 'me'); const rh = genCmd(0, jsn({ c: 'man', k: 'depth', ri, why: 'teste' }), 'me'), oh = Cm.man.find(o => o.k === 'dep' && !o.over);
    ok(rh.ok && !!oh && oh.by === 'me' && Cm.fb[ri], 'dep: a person orders it with JSON, axis only (' + (rh.ok ? 'ok' : rh.why) + ')');
    const rc = genCmd(0, jsn({ c: 'man', k: 'cancel', id: oh && oh.id }), 'me'); ok(rc.ok && oh.over && !Cm.fb[ri], 'dep: and cancels it (C.fb cleared)'); genCtl(0, 'ai');
    ok(genCmd(0, { c: 'man', k: 'depth', ri: 7 }, 'ai').why !== 'ok', 'dep: a bad axis is refused');
  }
  /* ---- gue ---- */
  { const S = fresh(C, era), Cm = $('cmdOf')(0), P = S.cq.p, nPt = P.find(p => p.k === 'n'), b = P.find(p => p.k === 'b' || p.k === 'c'), R = S.T.routes;
    const own = []; for (let i = 0; i < 5; i++) { const s = b.s + 70 * i, p = $('routeAt')(R[b.ri], s), f = C.addSquad(0, p.x, p.z, b.ri, s); f.job = 'held'; f.jk = i; $('setOrd')(f, { k: 'hold', ri: b.ri, s }); own.push(f); }
    for (let i = 0; i < 12; i++) { const a = i * 2.4, f = C.addSquad(1, nPt.x + Math.cos(a) * (20 + 5 * i), nPt.z + Math.sin(a) * (20 + 5 * i), nPt.ri, nPt.s); f.job = 'held'; f.jk = i; $('setOrd')(f, { k: 'hold', ri: nPt.ri, s: nPt.s, x: f.men[0].x, z: f.men[0].z }); }
    for (const m of S.men) if (m.team === 1) { m.seenT = S.t; m.sx = m.x; m.sz = m.z; }
    $('cmdSense')(Cm, own);
    const Rr = $('gueSide')(Cm); ok(Rr < $('MANT').gue.ratio, 'gue: setup is outnumbered, ratio ' + Rr.toFixed(2) + ' (limit ' + $('MANT').gue.ratio + ')');
    const X = { t: 0, C: Cm, sq: own, free: own, room: 2, doc: 'balanced', ds: -1, live: Cm.man };
    ok($('MANG').gue(Cm, X).length === 0 && Cm.gueLo === S.t, 'gue: not at once: it waits MANT.gue.calm s of inferiority first');
    Cm.gueLo = S.t - 100; const cs = $('MANG').gue(Cm, X), c = cs[0];
    ok(cs.length === 1 && c.k === 'gue' && c.sc > 0 && c.sc <= 2 && Math.abs(c.sc - Math.min(2, $('MANT').gue.w * $('MANT').gue.ratio / Rr)) < 1e-6 && c.spec.c === 'harass' && c.spec.n === 2 && /^em inferioridade/.test(c.why), 'gue: a candidate, score ' + (c && c.sc.toFixed(2)) + ', ' + (c && c.why));
    { const T0 = S.cq.tk[0]; S.cq.tk[0] = S.cq.tk0 * .2; const lo = $('gueLow')(Cm); S.cq.tk[0] = T0; ok(lo === 'ratio', 'gue: the reason is the ratio while it is low (' + lo + ')');
      const e = Cm.enemy.slice(); Cm.enemy.fill(0); Cm.own.fill(5); S.cq.tk[0] = S.cq.tk0 * .2; for (const p of P) if (!p.base || p.base < 0) if (p.hold === 0 && p.base < 0) p.hold = 1; const lt = $('gueLow')(Cm); ok(lt === 'tk', 'gue: low tickets with fewer points make it a reason too (' + lt + ')'); S.cq.tk[0] = T0; for (const p of P) if (p.k !== 'base' && p.L <= 'D') p.hold = 0; Cm.enemy = e; $('cmdSense')(Cm, own); }
    const r = genCmd(0, { c: 'man', k: 'harass', n: c.spec.n, why: c.spec.why }, 'ai', { spec: c.spec }), op = Cm.man.find(o => o.k === 'gue');
    ok(r.ok && !!op && Cm.gue && Cm.gue.op === op && op.teams.length === 2 && op.teams.every(T => T.q.op === op), 'gue: opened through genCmd ai: two teams of one squad each, C.gue set');
    ok(logOf(S, 0, /^Em inferioridade \([\d,]+:1\): fustigar e evitar combate decisivo$/).length === 1, 'gue: the log says it: ' + (logOf(S, 0, /fustigar/)[0] || {}).s);
    ok($('cmdPosts')(Cm, S.squads.filter(q => q.team === 0), {}).some(e => e[0] === 'amb' && e[1] >= $('MANT').gue.amb), 'gue: while on, cmdPosts asks at least ' + $('MANT').gue.amb + ' ambushes');
    let err = null, strikes = 0, gate = 0, atk = 0, walks = 0; const seen = new Set(), tmax = op.Tmax;
    Cm.atkT = 0; Cm.upos = R.map(() => ({ k: 'atk', T: 1e9 }));
    try { tick(C, S, tmax + 20, () => { for (const T of op.teams) seen.add(T.st); if (Cm.ev && Cm.ev.some(e => e.why === 'gue')) gate++; if (Cm.ops.some(o => o.k === 'atk' && !o.over && !o.walk)) atk++; if (Cm.ops.some(o => o.k === 'atk' && !o.over && o.walk)) walks++; if (op.over) return false; }, true); } catch (e) { err = e; }
    strikes = logOf(S, 0, /^Fustigamento contra o inimigo/).length;
    ok(!err && op.over && !Cm.gue && !Cm.man.includes(op) && own.every(q => !(q.op && q.op.man)) && !H.nan(S), 'gue: it runs to its end (t ' + (S.t | 0) + ' s, states seen ' + [...seen].join('/') + ', ' + strikes + ' strikes, ' + op.nStrike + ' counted); squads released, C.gue cleared' + (err ? err.stack : ''));
    ok(gate > 0 && atk === 0, 'gue: while on, cmdAttack only walks into empty points (the gate fired ' + gate + ' times, assaults ' + atk + ', walks ' + walks + ')');
    ok(logOf(S, 0, /^Fim do fustigamento|encerrada: tempo esgotado|^Fustigamento encerrado/).length >= 1, 'gue: its end is in the log: ' + (logOf(S, 0, /^Fim do fustigamento|encerrada: tempo esgotado|^Fustigamento encerrado/)[0] || {}).s);
  }
  { /* gue, a person (JSON only), ended by even forces, cancelled: a fresh battlefield with no enemy */
    const S = fresh(C, era), Cm = $('cmdOf')(0), P = S.cq.p, b = P.find(p => p.k === 'b' || p.k === 'c'), R = S.T.routes, own = [];
    for (let i = 0; i < 8; i++) { const s = b.s + 70 * i, p = $('routeAt')(R[b.ri], s), f = C.addSquad(0, p.x, p.z, b.ri, s); f.job = 'held'; f.jk = i; $('setOrd')(f, { k: 'hold', ri: b.ri, s }); own.push(f); }
    $('cmdSense')(Cm, own); genCtl(0, 'me'); const rh = genCmd(0, jsn({ c: 'man', k: 'harass', n: 1, why: 'teste' }), 'me'), oh = Cm.man.find(o => o.k === 'gue' && !o.over);
    ok(rh.ok && !!oh && oh.by === 'me' && oh.teams.length === 1 && logOf(S, 0, /^General: /).length >= 1, 'gue: a person orders it with JSON (' + (rh.ok ? 'ok' : rh.why) + ')'); genCtl(0, 'ai');
    let err3 = null; try { tick(C, S, 150, () => !oh.over); } catch (e) { err3 = e; }
    ok(!err3 && oh.over && !Cm.gue && own.every(q => !(q.op && q.op.man)) && logOf(S, 0, /^Fim do fustigamento: forças equilibradas/).length === 1, 'gue: with forces even it ends [' + [oh.over, !!Cm.gue, own.map(q => !!q.op), logOf(S, 0, /^Fim do fustigamento: forças equilibradas/).length] + '] ' + (S.t | 0) + ' s in (' + ((logOf(S, 0, /^Fim do fustigamento/)[0] || {}).s) + ')' + (err3 ? err3.stack : ''));
    Cm.mcd = {}; genCtl(0, 'me'); const r5 = genCmd(0, { c: 'man', k: 'harass', n: 1 }, 'me'), o5 = Cm.man.find(o => o.k === 'gue' && !o.over), rc = genCmd(0, jsn({ c: 'man', k: 'cancel', id: o5 && o5.id }), 'me');
    ok(r5.ok && rc.ok && o5.over && !Cm.gue && own.every(q => !(q.op && q.op.man)), 'gue: cancelled by a person, squads released (' + [r5.why, rc.why, o5 && o5.over] + ')'); genCtl(0, 'ai');
  }
}
done();
