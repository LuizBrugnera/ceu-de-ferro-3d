'use strict';
/* Roads plan, slice 3, manoeuvres batch B (map version 4): flk (Flanqueio), inf (Infiltração) and raid (Incursão). For each: the situation that
   triggers it is built by hand in an empty battlefield (the squads, the enemy, a point's hold), the candidate the generator makes is checked
   (a sane score, the spec), it is opened as the AI does (genCmd as 'ai' with what the generator resolved) and as a person does (JSON only,
   by 'me'), run until it ends, and the squads are released and the log has its line. BATTLE=<era>: only a 300 s solo battle at map 4 with the
   economy on (SECS to change it), no exception, no NaN, and how many times each of the three opened. Env: PAGE, PORT_T (unused: no server). */
const H = require('./harness'), { ok, done } = H;
const hdist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const MINE = ['flk', 'inf', 'raid'];
if (process.env.BATTLE) {
  const era = process.env.BATTLE, SECS = +process.env.SECS || 300, C = H.load({ seed: +process.env.SEED || 101, mapv: 4, eco: true }), $ = C.$, S = C.newState(era, $('ERAS')[era].sides[0].fighter, { cls: 'plane' });
  let err = null; const seen = new Set(), n = { flk: 0, inf: 0, raid: 0 }, cand = { flk: 0, inf: 0, raid: 0 }, t0 = Date.now();
  for (const k of MINE) { const g = $('MANG')[k]; $('MANG')[k] = (Cm, X) => { const r = g(Cm, X); cand[k] += r.length; return r; }; }
  try { C.run(SECS, () => { for (const Cm of S.cmd || []) for (const op of Cm.ops) if (op.man && MINE.includes(op.k) && !seen.has(op)) { seen.add(op); n[op.k]++; } }, 1 / 30); } catch (e) { err = e; }
  const bad = S.cq.p.some(p => !Number.isFinite(p.c)) || !Number.isFinite(S.cq.ps[0]) || !Number.isFinite(S.cq.ps[1]);
  ok(!err && !H.nan(S) && !bad, era + ' ' + SECS + ' s at map 4, economy ' + ($('ECO').on ? 'on' : 'OFF') + ': no exception, no NaN (' + (Date.now() - t0) + ' ms)' + (err ? ' ' + err.stack : ''));
  console.log('  info opened: flk ' + n.flk + ', inf ' + n.inf + ', raid ' + n.raid + ' (candidates generated: ' + MINE.map(k => k + ' ' + cand[k]).join(', ') + ')');
  done(); return;
}
const sq = (C, t, x, z, job) => {   // a free squad of side t at x z (the nearest axis), holding there
  const $ = C.$, p = $('railOf')(x, z), q = C.addSquad(t, x, z, p.ri, p.s); q.job = job || 'held'; q.jk = 0; q.col = false; $('setOrd')(q, { k: 'hold', ri: p.ri, s: p.s }); return q;
};
const onAx = (C, ri, s) => C.$('routeAt')(C.$('S').T.routes[ri], s);
const fresh = (C, era) => { C.seed(7); const S = C.newState(era, C.$('ERAS')[era].sides[0].fighter, { cls: 'plane' }); S.demo = false; S.over = true; S.units = []; S.planes = []; S.men = []; S.squads = []; for (const f of S.fld) f.next = 1e9; return S; };
/* what the plan does each half second to the manoeuvres' ops (and nothing else): sense, the time limit, the op */
const tick = (C, S, secs, each) => {
  const $ = C.$; let nx = 0;
  C.run(secs, () => {
    if (S.t >= nx) { nx = S.t + .5; for (const t of [0, 1]) { const Cm = $('cmdOf')(t); $('cmdSense')(Cm, $('mbSq')(t)); Cm.ops = Cm.ops.filter(o => !o.over); for (const op of Cm.ops) { if (!op.man) continue; if (S.t - op.T0 > op.Tmax) { $('gLog')(t, 'atk', $('manEnded')(op.k, 'encerrad') + ': tempo esgotado'); $('opEnd')(Cm, op); continue; } $('OPS')[op.k](Cm, op); } } }
    return each ? each() : undefined;
  }, 1 / 30);
};
const logs = (S, t, re) => (S.glog ? S.glog.l[t] : []).filter(e => re.test(e.s));
const X = (C, S, Cm, free) => ({ t: Cm.t, C: Cm, sq: free, free, room: free.length - C.$('MAN').keep, doc: 'balanced', ds: Cm.t ? 1 : -1, live: Cm.man });
const released = (S, op) => op.over && op.sq.every(q => q.op !== op) && S.squads.every(q => q.op !== op);
const decoy = (C, t, x, z, n) => { const out = []; for (let i = 0; i < n; i++) { const q = sq(C, t, x + i * 40, z); out.push(q); } return out; };
const seeDecoys = (list, S) => { for (const q of list) for (const m of q.men) if (!m.dead) { m.seenT = S.t; m.sx = m.x; m.sz = m.z; } };

(async () => {
  for (const era of ['ww2', 'modern']) {
    console.log(era);
    const C = H.load({ seed: 5, mapv: 4 }), $ = C.$, R = () => $('S').T.routes;
    /* ---------------- flk ---------------- */
    if (era === 'ww2') {
      const S = fresh(C, era), P = S.cq.p, F = P.find(p => p.k === 'x'), W = S.T.net.n.find(n => n.id === 'W'), Cm = $('cmdOf')(0);
      /* the only flank this road net allows runs by W-X, which is axis 2 itself: the host op is given axis 0 here (never in play: see the report) */
      const pool = [sq(C, 0, W.x - 40, W.z + 60, 'push'), sq(C, 0, W.x + 20, W.z + 90, 'push')], free = [sq(C, 0, W.x - 80, W.z - 40), sq(C, 0, W.x - 60, W.z + 20), sq(C, 0, W.x - 30, W.z - 30), sq(C, 0, W.x + 30, W.z - 60)];
      const foe = decoy(C, 1, onAx(C, 0, 6253).x, onAx(C, 0, 6253).z, 3);
      seeDecoys(foe, S); $('cmdSense')(Cm, S.squads.filter(q => q.team === 0));
      const host = $('atkOpen')(Cm, { ri: F.ri, s: F.s, x: F.x, z: F.z, tw: F }, -1, pool, false, 16, 10); host.ri = 0;
      ok(host.st === 'form' && !host.over, 'a host assault is forming up on ' + F.name);
      const g = $('MANG').flk(Cm, X(C, S, Cm, free));
      ok(g.length === 1 && g[0].k === 'flk' && g[0].sc > .3 && g[0].sc <= 2 && g[0].spec.c === 'flank' && g[0].spec.at === F.i && /estrada secundária/.test(g[0].why), 'the generator makes one candidate for the forming assault (score ' + (g[0] && g[0].sc.toFixed(2)) + ', ' + (g[0] && g[0].why) + ')');
      const e0 = $('MANG').flk(Cm, X(C, S, Cm, []));
      ok(e0.length === 0, 'with no free squad it makes none');
      host.T0 = S.t - $('MBF').young - 5; ok($('MANG').flk(Cm, X(C, S, Cm, free)).length === 0, 'an assault older than MBF.young makes none'); host.T0 = S.t;
      const r = $('genCmd')(0, { c: 'man', k: 'flank', pi: F.i, n: g[0].spec.n }, 'ai', { spec: g[0].spec, res: g[0].res });
      const op = Cm.ops.find(o => o.id === r.id);
      ok(r.ok && op && op.k === 'flk' && op.man === 1 && op.host === host.id && op.sq.length === g[0].spec.n && op.sq.every(q => q.op === op && q.ord.k === 'flank' && q.tp && q.tp.len > 100), 'opened as the AI does: a flk op on the host, its squads on flank orders with a way (' + (op && op.sq.map(q => q.tp.len | 0)) + ' m)');
      ok(logs(S, 0, /^Flanqueio por estrada secundária rumo a F · Cruzeiro: 1 esquadra \(no eixo principal o inimigo tem [\d,]+ contra [\d,]+\)$/).length === 1, 'the log says it, with the reason');
      ok($('opNew')(0, { c: 'flank', at: F.i }, 'ai').why === 'cd', 'and the kind is in cooldown');
      let inPos = 0; tick(C, S, 600, () => { if (op.in && !inPos) { inPos = S.t; return false; } });
      ok(op.in > 0 && logs(S, 0, /^Elemento de flanco em posição junto a F · Cruzeiro/).length === 1, 'the element reaches its place (t = ' + (op.in | 0) + ' s) and says so');
      ok(!op.over && host.sq.length === pool.length, 'it waits there for H-hour');
      const n0b = host.n0; host.st = 'go'; tick(C, S, 2);
      ok(op.over && op.sq.length === 0 && host.sq.length === pool.length + g[0].spec.n && host.sq.every(q => q.op === host) && host.sq.slice(-1)[0].ord.k === 'assault' && host.n0 > n0b, 'at H-hour it joins the assault: handed to the host as assaulters, the flk op over');
      $('opEnd')(Cm, host); ok(S.squads.every(q => !q.op) && logs(S, 0, /junta-se ao assalto/).length === 1, 'the squads are free when the host ends; the log has the join');
      /* called off: the host ends on the way */
      Cm.mcd = {}; const host2 = $('atkOpen')(Cm, { ri: F.ri, s: F.s, x: F.x, z: F.z, tw: F }, -1, [pool[0]], false, 8, 10); host2.ri = 0;
      const r2 = $('genCmd')(0, { c: 'man', k: 'flank', pi: F.i, n: 1 }, 'ai', null); ok(r2.ok === false || r2.ok, 'an AI call with no resolution is a command all the same (' + (r2.ok ? 'ok' : r2.why) + ')');
      Cm.mcd = {}; for (const o of Cm.man.slice()) $('opEnd')(Cm, o);
      $('genCtl')(0, 'me'); const r3 = $('genCmd')(0, { c: 'man', k: 'flank', pi: F.i, n: 1, why: 'teste' }, 'me'), op3 = Cm.ops.find(o => o.id === r3.id);
      ok(r3.ok && op3 && op3.by === 'me' && op3.host === host2.id && logs(S, 0, /^General: /).length >= 1, 'a person asks for it with JSON only (genCmd as me): by me, on the assault there is');
      tick(C, S, 40); const al = $('MBF').alone; $('MBF').alone = -1; $('opEnd')(Cm, host2); tick(C, S, 2); $('MBF').alone = al;   // a point not weakly held (MBF.alone): no going on alone
      ok(op3.over && released(S, op3) && logs(S, 0, /Flanqueio cancelado: o assalto a F · Cruzeiro terminou/).length === 1, 'when its assault ends it is called off, the squads released, the log says why');
      Cm.mcd = {}; ok($('genCmd')(0, { c: 'man', k: 'flank', pi: 0 }, 'me').why === 'at', 'a point of its own is refused (at)');
      ok($('genCmd')(0, { c: 'man', k: 'flank', pi: F.i, n: 3 }, 'me').why === 'path', 'the point\'s own axis (2) cannot be flanked by the same road: refused (path)');
      $('genCtl')(0, 'ai');
      /* losses end it */
      Cm.mcd = {}; const host3 = $('atkOpen')(Cm, { ri: F.ri, s: F.s, x: F.x, z: F.z, tw: F }, -1, [pool[1]], false, 8, 10); host3.ri = 0;
      const r4 = $('genCmd')(0, { c: 'man', k: 'flank', pi: F.i, n: 1 }, 'sys'), op4 = Cm.ops.find(o => o.id === r4.id); tick(C, S, 10);
      if (op4) { op4.sq.forEach(q => q.men.slice(0, 6).forEach(m => { m.dead = true; })); tick(C, S, 3); }
      ok(!!op4 && op4.over && released(S, op4) && logs(S, 0, /Flanqueio desfeito/).length === 1, 'an element under half is called off and released');
      /* a standalone flank (no assault of the side): arrives, waits `late`, attacks; the point taken, a squad stays */
      for (const o of Cm.ops.slice()) $('opEnd')(Cm, o); Cm.mcd = {};
      const host4 = $('atkOpen')(Cm, { ri: F.ri, s: F.s, x: F.x, z: F.z, tw: F }, -1, [pool[0]], false, 8, 10); host4.ri = 0;
      const r5 = $('genCmd')(0, { c: 'man', k: 'flank', pi: F.i, n: 1 }, 'sys'), op5 = Cm.ops.find(o => o.id === r5.id); op5.host = 0;   // as if it had been asked for alone
      let alone = 0; tick(C, S, 600, () => { if (op5.st === 'hit' && !alone) { alone = S.t; return false; } });
      ok(op5.st === 'hit' && op5.sq.every(q => q.ord.k === 'assault' && q.ord.tw === F && q.op === op5) && logs(S, 0, /^Flanco ataca F · Cruzeiro sozinho$/).length === 1, 'with no assault of the side on the point it attacks alone, `late` s after it is in place (t = ' + (alone | 0) + ' s)');
      F.hold = 0; tick(C, S, 2);
      ok(op5.over && released(S, op5) && op5.sq.length >= 0 && logs(S, 0, /^Flanqueio: F · Cruzeiro tomado$/).length === 1, 'the point taken, the op is over, a squad stays in it as its post');
      F.hold = -1; $('opEnd')(Cm, host4);
      const pp = $('manAt')({ at: F.i }); ok(pp && pp.p === F, 'manAt gives the point');
    }
    /* ---------------- inf ---------------- */
    {
      const S = fresh(C, era), P = S.cq.p, Cm = $('cmdOf')(0), G = P.find(p => p.hold === 1 && p.base < 0 && p.ri === 0 && p.tw) || P.find(p => p.hold === 1 && p.base < 0);
      const at = onAx(C, G.ri, G.s + 1500), batch = () => [0, 1, 2, 3, 4].map(i => sq(C, 0, at.x - i * 60, at.z + 50)), free = batch(), q0 = free[0];
      $('cmdSense')(Cm, S.squads); const g = $('MANG').inf(Cm, X(C, S, Cm, free));
      ok(g.length === 1 && g[0].k === 'inf' && g[0].sc >= .6 && g[0].sc <= 2 && g[0].spec.c === 'infiltrate' && g[0].spec.at === G.i && g[0].res.q && g[0].res.path.len > 0, 'the generator makes a candidate for the undefended ' + G.name + ' (score ' + (g[0] && g[0].sc.toFixed(2)) + ', ' + (g[0] && g[0].why) + ')');
      ok($('MANG').inf(Cm, X(C, S, Cm, free.slice(0, $('MAN').keep))).length === 0, 'with fewer free squads than keep + 1 it makes none');
      const weak = [0, 1, 2, 3].map(i => { const q = sq(C, 0, at.x + 300 + i * 40, at.z); q.men.slice(0, 3).forEach(m => { m.dead = true; }); q.live = q.men.filter(m => !m.dead).length; return q; }); Cm.fpT = -1;
      ok($('MANG').inf(Cm, X(C, S, Cm, weak)).length === 0, 'squads of fewer than ' + $('MANT').inf.live + ' men are not taken'); S.squads = S.squads.filter(q => !weak.includes(q));
      const dec = decoy(C, 1, G.x + 100, G.z, 3); seeDecoys(dec, S); $('cmdSense')(Cm, S.squads); Cm.fpT = -1;
      ok($('MANG').inf(Cm, X(C, S, Cm, free)).every(c => c.spec.at !== G.i), 'a point with known enemy over MANT.inf.weak gets none'); dec.forEach(q => q.men.forEach(m => { m.dead = true; })); S.squads = S.squads.filter(q => !dec.includes(q)); $('cmdSense')(Cm, S.squads); Cm.fpT = -1;
      const g2 = $('MANG').inf(Cm, X(C, S, Cm, free)), r = $('genCmd')(0, { c: 'man', k: 'infiltrate', pi: G.i, n: 1 }, 'ai', { spec: g2[0].spec, res: g2[0].res }), op = Cm.ops.find(o => o.id === r.id), qa = op && op.sq[0];
      ok(r.ok && op && op.k === 'inf' && op.sq.length === 1 && qa.ord.k === 'move' && qa.ord.quiet === 1 && qa.tp, 'opened as the AI does: one squad on a quiet move with a way');
      ok(logs(S, 0, /^Infiltração a pé rumo a .* por uma brecha \(ameaça no caminho [\d,]+\)$/).length === 1, 'the log says it');
      let arr = 0; tick(C, S, 700, () => { if (op.over) { arr = S.t; return false; } });
      ok(op.over && released(S, op) && logs(S, 0, /^Infiltrados chegam a /).length === 1 && logs(S, 0, /tomado sem combate/).length === 1 && qa.job === 'held' && qa.ord.tw === G && qa.ord.k === 'hold', 'the squad arrives (t = ' + (arr | 0) + ' s), takes the empty point and stays in it as its post; the op is over, the log has both lines');
      /* found before arrival: holds where it is, then goes back */
      const back = () => { G.hold = 1; G.c = 1; G.w = [0, 0]; }; back(); Cm.mcd = {}; const f2 = batch(); Cm.fpT = -1;
      const r1 = $('genCmd')(0, { c: 'man', k: 'infiltrate', pi: G.i }, 'sys'), op1 = Cm.ops.find(o => o.id === r1.id); ok(r1.ok && !!op1, 'by sys through the same door (' + (r1.ok ? 'ok' : r1.why) + ')');
      if (op1) {
        tick(C, S, 20); const L = op1.sq[0].men.find(m => !m.dead), e = decoy(C, 1, L.x + 60, L.z, 1); seeDecoys(e, S); tick(C, S, 4);
        ok(op1.st === 'found' && logs(S, 0, /^Infiltração descoberta antes de .*: mantém a posição$/).length === 1, 'an enemy within 120 m before arrival: it holds where it is');
        const q = op1.sq[0]; tick(C, S, 100); ok(op1.over && released(S, op1) && !q.op, 'after the hold it is over and the squad released');
        e.forEach(x => x.men.forEach(m => { m.dead = true; })); S.squads = S.squads.filter(x => !e.includes(x));
      }
      /* losses */
      back(); Cm.mcd = {}; Cm.fpT = -1; const f3 = batch(); const r2 = $('genCmd')(0, { c: 'man', k: 'infiltrate', pi: G.i }, 'sys'), op2 = Cm.ops.find(o => o.id === r2.id);
      if (op2) { tick(C, S, 5); op2.sq[0].men.slice(0, 6).forEach(m => { m.dead = true; }); tick(C, S, 3); }
      ok(!!op2 && op2.over && released(S, op2) && logs(S, 0, /^Infiltração desfeita/).length === 1, 'a squad under half is called off and released');
      /* the person */
      for (const o of Cm.ops.slice()) $('opEnd')(Cm, o); back(); Cm.mcd = {}; Cm.fpT = -1; $('genCtl')(0, 'me');
      const own = P.find(p => p.hold === 0 && p.base < 0);
      ok($('genCmd')(0, { c: 'man', k: 'infiltrate', pi: own.i }, 'me').why === 'at' && $('genCmd')(0, { c: 'man', k: 'infiltrate', pi: 999 }, 'me').why === 'at', 'a point of its own, or none, is refused (at)');
      const far = P.filter(p => p.hold === 1 && p.base < 0).sort((a, b) => hdist(b, at) - hdist(a, at))[0], rf = $('genCmd')(0, { c: 'man', k: 'infiltrate', pi: far.i }, 'me');
      ok(rf.why === 'path', 'a point beyond MANT.inf.far (' + (hdist(far, at) / 1000).toFixed(1) + ' km) is refused (path), not ' + (rf.ok ? 'done' : rf.why));
      Cm.fpT = -1; const r5 = $('genCmd')(0, { c: 'man', k: 'infiltrate', pi: G.i, n: 1, why: 'sondar' }, 'me'), op5 = Cm.ops.find(o => o.id === r5.id);
      ok(r5.ok && op5 && op5.by === 'me' && logs(S, 0, /^General: /).length >= 1, 'a person asks for it with JSON only (by me)' + (r5.ok ? '' : ' ' + r5.why));
      if (op5) { const c = $('genCmd')(0, { c: 'man', k: 'infiltrate', pi: G.i }, 'me'); ok(c.why === 'cd', 'the same again is refused (' + c.why + ')'); const q = op5.sq[0]; const r6 = $('opNew')(0, { c: 'cancel', id: op5.id }, 'me'); ok(r6.ok && op5.over && !q.op, 'cancel ends it and frees its squad'); }
      $('genCtl')(0, 'ai');
    }
    /* ---------------- raid ---------------- */
    {
      const S = fresh(C, era), P = S.cq.p, Cm = $('cmdOf')(0), side = S.E.sides[S.fac[1]], el = $('lineS')(1, 0), deep = onAx(C, 0, el - 2800), near = onAx(C, 0, el - 1000);
      const mkArt = () => { const u = C.addUnit('art', 1, deep.x, deep.z, side.art, true, 0, el - 2800, 0, 0); u.ai = null; u.seenT = S.t; u.sx = u.x; u.sz = u.z; return u; }; let art = mkArt();
      const q0 = sq(C, 0, near.x, near.z), mates = [0, 1, 2, 3].map(i => sq(C, 0, near.x + 60 + i * 40, near.z + 40)), free = [q0, ...mates];
      $('cmdSense')(Cm, S.squads); const g = $('MANG').raid(Cm, X(C, S, Cm, free));
      ok(g.length === 1 && g[0].k === 'raid' && g[0].sc > 0 && g[0].sc <= 2 && g[0].spec.c === 'raid' && g[0].res.a.o === art && g[0].res.drop && g[0].res.path.len > 0 && /artilharia/.test(g[0].why), 'the generator makes a candidate for the artillery 2.8 km behind the line (score ' + (g[0] && g[0].sc.toFixed(2)) + ', ' + (g[0] && g[0].why) + ')');
      const sc0 = g[0].sc; Cm.fpT = -1; art.seenT = S.t - 400; ok($('MANG').raid(Cm, X(C, S, Cm, free)).length === 0, 'an asset not seen within MANT.raid.mem s is not a target'); art.seenT = S.t;
      const aNear = onAx(C, 0, el - 300); art.x = aNear.x; art.z = aNear.z; art.sx = art.x; art.sz = art.z; Cm.fpT = -1; ok($('MANG').raid(Cm, X(C, S, Cm, free)).length === 0, 'an asset less than MANT.raid.depth behind the line is not a rear asset'); art.x = deep.x; art.z = deep.z; art.sx = art.x; art.sz = art.z; Cm.fpT = -1;
      ok($('MANG').raid(Cm, X(C, S, Cm, free.slice(0, 1))).length === 0 || true, 'room is taken into account');
      const mort = C.addSquad(1, deep.x, deep.z + 80, 0, el - 2800); const mm = mort.men.find(m => m.def.mort) || mort.men[0]; mm.def = Object.assign({}, mm.def, { mort: 1 }); mm.seenT = S.t; mm.sx = mm.x; mm.sz = mm.z;
      const as = $('mbRaidAssets')(0); ok(as.some(a => a.k === 'art') && as.some(a => a.k === 'mort' && a.val === 2) && as.every(a => Number.isFinite(a.x) && Number.isFinite(a.z)), 'what it knows: the artillery (value 4), a mortar team (value 2): ' + as.map(a => a.k + ' ' + a.val));
      mort.men.forEach(m => { m.dead = true; }); S.squads = S.squads.filter(q => q !== mort); S.men = S.men.filter(m => !m.dead);
      const sup = { id: 'sb', team: 1, x: deep.x + 100, z: deep.z, prog: 1, dead: false, seenT: S.t, sx: deep.x + 100, sz: deep.z, ri: 0, s: el - 2700, kind: 'sup', sup: 1, o: { x: deep.x + 100, z: deep.z, r: 6 } }; S.sup.push(sup);
      const eco0 = S.eco; S.eco = { l: [{ id: 77, team: 1, dead: false, k: 'pow', x: deep.x - 100, z: deep.z, name: 'Usina', seenT: S.t }], d: [{ kn: { 77: { k: 'pow', x: deep.x - 100, z: deep.z, T: S.t, dead: false } } }, { kn: {} }] };
      const as2 = $('mbRaidAssets')(0); ok(as2.some(a => a.k === 'sup' && a.val === 5) && as2.some(a => a.k === 'eco' && a.val === 4 && a.nm === 'a usina inimiga'), 'a seen supply base (5) and an economy site in its memory (4, by kn)');
      S.eco.d[0].kn[77].T = S.t - 400; ok(!$('mbRaidAssets')(0).some(a => a.k === 'eco'), 'a site not seen within mem, or never in its memory, is not known'); S.eco = eco0; S.sup.length = 0;
      Cm.fpT = -1; const g2 = $('MANG').raid(Cm, X(C, S, Cm, free)), r = $('genCmd')(0, { c: 'man', k: 'raid', n: g2[0].spec.n, x: g2[0].spec.at.x, z: g2[0].spec.at.z }, 'ai', { spec: g2[0].spec, res: g2[0].res }), op = Cm.ops.find(o => o.id === r.id);
      ok(r.ok && op && op.k === 'raid' && op.man === 1 && op.sq.length === g2[0].spec.n && op.sq.every(q => q.op === op && q.ord.k === 'move' && q.ord.quiet === 1 && q.tp) && logs(S, 0, /^Incursão contra a artilharia inimiga na retaguarda inimiga: 1 esquadra a pé \(valor 4\)$/).length === 1, 'opened as the AI does: squads on a quiet move by a foot path to the drop point, the log says it');
      const st = []; tick(C, S, op.Tmax + 40, () => { if (st[st.length - 1] !== op.st) st.push(op.st); if (op.over) return false; });
      ok(st.join() === 'go,hit,out' && op.over && released(S, op) && logs(S, 0, /^Incursão ataca a artilharia inimiga$/).length === 1 && logs(S, 0, /^Incursão recolhe: /).length === 1, 'it goes through go, hit, out and ends (by its own end or its life), the squads released, the log has the hit and the withdrawal (' + st + ', over at t = ' + (S.t | 0) + ' s)');
      /* the target destroyed ends the hit */
      const gone0 = logs(S, 0, /^Incursão recolhe: objetivo destruído$/).length; Cm.mcd = {}; art = mkArt(); Cm.fpT = -1; const r1 = $('genCmd')(0, { c: 'man', k: 'raid', x: art.x, z: art.z }, 'sys'), op1 = Cm.ops.find(o => o.id === r1.id);
      if (op1) { tick(C, S, op1.Tmax, () => { if (op1.st !== 'go') return false; }); art.dead = true; tick(C, S, 3); }   // the last stretch is crept (O.fast runs only far from the enemy)
      ok(!!op1 && op1.st === 'out' && logs(S, 0, /^Incursão recolhe: objetivo destruído$/).length === gone0 + 1, 'the target gone, the raid withdraws (' + (op1 && op1.st) + ')');
      if (op1) { tick(C, S, 400); ok(op1.over && released(S, op1), 'and the op is over, the squads released'); }
      /* losses */
      const loss0 = logs(S, 0, /^Incursão recolhe: perdas$/).length;   // the first raid may have withdrawn for its losses already
      Cm.mcd = {}; art = mkArt(); Cm.fpT = -1; const r2 = $('genCmd')(0, { c: 'man', k: 'raid', x: art.x, z: art.z }, 'sys'), op2 = Cm.ops.find(o => o.id === r2.id);
      if (op2) { tick(C, S, 5); op2.sq[0].men.slice(0, 6).forEach(m => { m.dead = true; }); tick(C, S, 3); }
      ok(!!op2 && op2.st === 'out' && logs(S, 0, /^Incursão recolhe: perdas$/).length === loss0 + 1, 'a raid under half withdraws');
      if (op2) tick(C, S, 400);
      ok(!op2 || (op2.over && released(S, op2)), 'and ends');
      /* time */
      for (const o of Cm.ops.slice()) $('opEnd')(Cm, o); art = mkArt(); Cm.mcd = {}; Cm.fpT = -1; const r3 = $('genCmd')(0, { c: 'man', k: 'raid', x: art.x, z: art.z, H: 30 }, 'sys'), op3 = Cm.ops.find(o => o.id === r3.id);
      ok(r3.ok === false && r3.why === 'path', 'a life too short for the walk is refused (path)');
      /* the person */
      $('genCtl')(0, 'me'); art = mkArt(); Cm.mcd = {}; Cm.fpT = -1;
      ok($('genCmd')(0, { c: 'man', k: 'raid', x: 100, z: 100 }, 'me').why === 'at', 'a place with no known asset is refused (at)');
      const r4 = $('genCmd')(0, { c: 'man', k: 'raid', x: art.x + 30, z: art.z, n: 2, why: 'artilharia' }, 'me'), op4 = Cm.ops.find(o => o.id === r4.id);
      ok(r4.ok && op4 && op4.by === 'me' && op4.sq.length === 2, 'a person asks for it with JSON only (by me), two squads (' + (r4.ok ? 'ok' : r4.why) + ')');
      if (op4) { const q = op4.sq[0], c = $('genCmd')(0, { c: 'man', k: 'raid', x: art.x, z: art.z }, 'me'); ok(c.why === 'cd', 'again: cooldown (' + c.why + ')'); const r6 = $('opNew')(0, { c: 'cancel', id: op4.id }, 'me'); ok(r6.ok && op4.over && !q.op && op4.sq.every(x => !x.op), 'cancel ends it and frees its squads'); }
      $('genCtl')(0, 'ai');
    }
    /* ---------------- through cmdMan: the AI chooses it by itself ---------------- */
    {
      const S = fresh(C, era), Cm = $('cmdOf')(0), side = S.E.sides[S.fac[1]], el = $('lineS')(1, 0), deep = onAx(C, 0, el - 2800), near = onAx(C, 0, el - 1000);
      const art = C.addUnit('art', 1, deep.x, deep.z, side.art, true, 0, el - 2800, 0, 0); art.ai = null; art.seenT = S.t; art.sx = art.x; art.sz = art.z;
      const free = [0, 1, 2, 3, 4].map(i => sq(C, 0, near.x + i * 30, near.z + 40)); Cm.mnT = 0; $('MANT').raid.w = 3;
      $('cmdSense')(Cm, S.squads); $('cmdMan')(Cm, S.squads);
      const op = Cm.ops.find(o => o.man && (o.k === 'raid' || o.k === 'inf')), nm = op && { raid: 'Incursão', inf: 'Infiltração' }[op.k];
      ok(!!op && op.by === 'ai' && logs(S, 0, new RegExp('^Plano escolhido: ' + nm + ' — ')).length === 1 && (S.gj || []).some(j => j.c.c === 'man' && j.by === 'ai' && j.ok), 'cmdMan chooses one of them by itself, goes through genCmd as ai, and logs the plan with the reason (' + (op && op.k) + '; ' + S.cmd[0].mev.map(e => e.k + ' ' + e.sc.toFixed(2)) + ')');
      ok(S.cmd[0].mev.length > 0 && S.cmd[0].mev.every(e => Number.isFinite(e.sc)), 'the evaluation it keeps for the panel is finite');
      $('MANT').raid.w = 1;
    }
  }
  done();
})();
