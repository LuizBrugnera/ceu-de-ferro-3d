'use strict';
/* Roads plan, slice 3 (map version 4), batch C of the manoeuvres: blk (Bloqueio), cut (Cerco), fnt (Finta). For each kind: the situation that triggers it is built
   by setting state directly, a candidate is generated (sane score and spec), opened through genCmd as the AI and through a human path with JSON only, run until it
   ends, the squads are released and the log has its line. Then one 300 s solo battle per era at map 4 with the economy on, counting how many of each kind opened.
   Env: PAGE, BATTLE=<era> (only the battle), SECS (its length). */
const H = require('./harness'), { ok, done } = H;
const hdist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const fresh = (C, era) => { C.seed(7); const S = C.newState(era, C.$('ERAS')[era].sides[0].fighter, { cls: 'plane' }); S.demo = false; S.over = false; S.units = []; S.planes = []; S.men = []; S.squads = []; for (const t of [0, 1]) C.$('cmdOf')(t).mnT = 1e9; return S; };
const KINDS = ['blk', 'cut', 'fnt'];
/* BATTLE=<era>: a 300 s solo battle at map 4 with the economy on; no exception, no NaN; how many of each kind opened (by the AI's own choice) */
function battle(era, SECS) {
  const C = H.load({ seed: 101, mapv: 4, eco: true }), $ = C.$, S = C.newState(era, $('ERAS')[era].sides[0].fighter, { cls: 'plane' }), made = [], t0 = Date.now();
  const cand = { blk: 0, cut: 0, fnt: 0 }, best = { blk: 0, cut: 0, fnt: 0 }, G = $('MANG');
  for (const k of KINDS) { const f = G[k]; G[k] = (Cm, X) => { const r = f(Cm, X); cand[k] += r.length; for (const c of r) best[k] = Math.max(best[k], c.sc); return r; }; }
  let err = null;
  try { C.run(SECS, () => { for (const Cm of S.cmd || []) for (const op of Cm.ops) if (op.man && !made.includes(op)) made.push(op); }, 1 / 30); } catch (e) { err = e; }
  const bad = S.cq.p.some(p => !Number.isFinite(p.c)) || !Number.isFinite(S.cq.ps[0]) || !Number.isFinite(S.cq.ps[1]), n = k => made.filter(o => o.k === k).length;
  ok(!err && !H.nan(S) && !bad, era + ' ' + SECS + ' s at map 4, economy ' + ($('ECO').on ? 'on' : 'OFF') + ': no exception, no NaN (' + (Date.now() - t0) + ' ms)' + (err ? ' ' + err.stack : ''));
  console.log('  opened in the battle (' + era + '): ' + KINDS.map(k => k + ' ' + n(k)).join(', ') + '; candidates generated ' + KINDS.map(k => k + ' ' + cand[k] + ' (best ' + best[k].toFixed(2) + ')').join(', ') + '; all kinds ' + made.length + ' (' + [...new Set(made.map(o => o.k))].join(',') + ')');
  ok(made.every(op => op.over || S.t - op.T0 <= op.Tmax + 25), 'every manoeuvre of the battle is over within its Tmax');
}
if (process.env.BATTLE) { battle(process.env.BATTLE, +process.env.SECS || 300); done(); return; }
const logs = (S, t) => S.glog.l[t].map(e => e.s);
const has = (S, t, re) => logs(S, t).some(s => re.test(s)), dump = (S, t, n) => process.env.DEBUG && console.log('    log: ' + logs(S, t).slice(-(n || 6)).join(' | '));
for (const era of process.env.ERA ? [process.env.ERA] : ['ww2', 'modern']) {
  console.log(era);
  const C = H.load({ seed: 5, mapv: 4 }), $ = C.$;
  const run = (S, f, secs) => { C.run(secs, () => (f() ? false : undefined), 1 / 10); };
  const dry = (x, z) => { const c = $('clearOf')(x, z, 2, {}); return $('hgt')(c.x, c.z) > S0().T.WL + 1 ? c : null; };
  const S0 = () => $('S');
  const squadAt = (t, x, z, job) => { const c = dry(x, z) || { x, z }, p = $('railOf')(c.x, c.z), q = C.addSquad(t, c.x, c.z, p.ri, p.s); q.job = job || 'held'; q.jk = 0; q.ord = { k: 'hold', ri: p.ri, s: p.s }; return q; };
  const sqOf = (S, t) => S.squads.filter(q => q.team === t && !q.net && q.live > 0 && !q.state);
  const Xof = (Cm, t, sq) => ({ t, C: Cm, sq, free: $('manFree')(sq), room: 9, doc: 'balanced', ds: t ? 1 : -1, live: Cm.man });
  const ctl = t => C.$('genCtl')(t, 'me');
  /* ---- blk: enemy vehicles seen on a road behind their line, a free squad near an ambush site on it ---- */
  const blkSetup = () => {
    const S = fresh(C, era), C0 = $('cmdOf')(0), roads = $('blkRoads')(C0, 1), sites = $('blkSites')();
    let st = null, rd = null;
    for (const r of roads) for (const x of sites) if ($('blkDist')(r, x.x, x.z) < 60 && $('ecoDepth')(1, x.x, x.z) >= 0 && (!st || x.sc > st.sc)) { st = x; rd = r; }
    if (!st) return null;
    const mk = (x, z) => { const u = C.addVehicle('truck', null, 1, x, z, 0); u.seenT = S.t; u.sx = x; u.sz = z; return u; };
    let best = null; for (let s = 0; s < rd.len; s += 25) { const p = $('routeAt')(rd, s), d = hdist(p, st); if (d > 380 && d < 520 && (!best || d < best.d)) best = { p, d }; }
    const far = mk(best ? best.p.x : st.x, best ? best.p.z : st.z), a = S.base[0], d0 = hdist(st, a), p0 = st.pos[0];
    const q = squadAt(0, p0.x + (a.x - p0.x) / d0 * 450, p0.z + (a.z - p0.z) / d0 * 450);
    C.run(1, null, 1 / 30);
    return { S, C0, st, far, q, mk };
  };
  let A = blkSetup();
  ok(!!A, 'blk: a site beside an enemy supply road behind its line exists (' + $('blkSites')().length + ' sites on the network)');
  if (A) {
    const { S, C0, st, far, q } = A;
    const sq = sqOf(S, 0); $('cmdSense')(C0, sq);
    ok($('MANG').blk(C0, { ...Xof(C0, 0, sq), free: [] }).length === 0, 'blk: no free squad, no candidate');
    far.seenT = -999; ok($('MANG').blk(C0, Xof(C0, 0, sq)).length === 0, 'blk: no vehicle seen lately, no candidate'); far.seenT = S.t;
    const cs = $('MANG').blk(C0, Xof(C0, 0, sq));
    ok(cs.length >= 1 && cs.every(c => c.k === 'blk' && c.sc > 0 && c.sc <= 2 && c.spec.c === 'block' && Number.isFinite(c.spec.x) && /veículo/.test(c.why)), 'blk: a candidate with a score in (0, 2] and a spec (' + cs.map(c => c.sc.toFixed(2)) + '; ' + (cs[0] && cs[0].why) + ')');
    const r = $('genCmd')(0, { c: 'man', k: 'block', x: cs[0].spec.x, z: cs[0].spec.z, n: 1 }, 'ai', { spec: cs[0].spec }), op = C0.ops.find(o => o.k === 'blk');
    ok(r.ok && !!op && op.man === 1 && op.by === 'ai' && q.op === op && q.ord.k === 'ambush' && !!q.tp && C0.man.includes(op) && C0.mcd.blk > S.t, 'blk: opened by the AI through genCmd: the squad has an ambush order with a way (' + r.why + '; Tmax ' + (op && op.Tmax | 0) + ')');
    ok(has(S, 0, /^Bloqueio na estrada de suprimento inimiga .*: \d+ veículo\(s\) visto\(s\) ali/), 'blk: the log has its line');
    ok($('opNew')(0, { c: 'block', x: st.x, z: st.z }, 'ai').why === 'max' || $('opNew')(0, { c: 'block', x: st.x, z: st.z }, 'ai').why === 'cd', 'blk: a second one is refused (max or cd)');
    let arr = null, spr = null;
    run(S, () => { if (op.arr && arr === null) { arr = S.t; A.mk(st.x, st.z); A.mk(st.x + 10, st.z); } if (op.sprung && spr === null) spr = S.t; return op.over; }, 900);
    ok(arr !== null, 'blk: the squad arrives at the site (t = ' + (arr === null ? '-' : arr.toFixed(0)) + ' s)');
    ok(spr !== null && has(S, 0, /^Bloqueio disparado na estrada de suprimento inimiga/), 'blk: a vehicle in the kill zone springs it: "Bloqueio disparado" (t = ' + (spr === null ? '-' : spr.toFixed(0)) + ' s)');
    ok(op.over && q.op !== op && (!q.ord.op || q.ord.op !== op) && !C0.man.includes(op) && !C0.ops.some(o => o === op && !o.over) && S.squads.every(s => !s.op || !s.op.over), 'blk: it ends (t = ' + S.t.toFixed(0) + ' s) and releases its squad; no squad points at an over op');
    ok(has(S, 0, /^Bloqueio recolhe/), 'blk: it says why it called itself off');
    ok(!H.nan(S), 'blk: no NaN');
  }
  /* blk: the human path (JSON only), the cancel, and an unsprung one that gives up */
  A = blkSetup();
  if (A) {
    const { S, C0, st, q } = A; ctl(0);
    ok($('genCmd')(0, { c: 'man', k: 'block', x: st.x, z: st.z, n: 1 }, 'ai').why === 'ctl', 'blk: the AI is refused while a person holds the chair');
    const r = $('genCmd')(0, { c: 'man', k: 'block', x: st.x, z: st.z, n: 1, why: 'teste' }, 'me'), op = C0.ops.find(o => o.k === 'blk');
    ok(r.ok && op && op.by === 'me' && q.op === op && has(S, 0, /^Bloqueio na estrada/), 'blk: opened by a person with JSON only (' + r.why + ')');
    const c = $('genCmd')(0, { c: 'man', k: 'cancel', id: op.id }, 'me');
    ok(c.ok && op.over && !q.op && has(S, 0, /Bloqueio cancelado/), 'blk: a person cancels it, the squad is freed');
    C0.mcd = {}; ok($('genCmd')(0, { c: 'man', k: 'block', x: 100, z: 0, n: 1 }, 'me').why === 'at', 'blk: a place with no site on a supply road is refused (at)');
  }
  A = blkSetup();
  if (A) {
    const { S, C0, st, far, q } = A; far.seenT = -999;
    const op = (() => { const sq = sqOf(S, 0); $('cmdSense')(C0, sq); const r = $('opNew')(0, { c: 'block', x: st.x, z: st.z, T: 500 }, 'sys'); return r.ok ? C0.ops.find(o => o.k === 'blk') : null; })();
    ok(!!op, 'blk: opened by sys');
    if (op) { run(S, () => op.over, 700); dump(S, 0); ok(op.over && !q.op && has(S, 0, /Bloqueio recolhe|Bloqueio encerrado: tempo esgotado/), 'blk: with no one seen it ends on its own and frees the squad (t = ' + S.t.toFixed(0) + ' s)'); }
  }
  /* ---- cut: the enemy holds a chain base - Q - R; Q taken cuts R off ---- */
  const cutSetup = () => {
    const S = fresh(C, era), P = S.cq.p, b1 = P.findIndex(p => p.base === 1);
    let Q = null, R = null;
    for (const q of P) { if (q.base >= 0 || !q.links.includes(b1)) continue; for (const j of q.links) { const r = P[j]; if (r.base >= 0 || r === q || r.links.includes(b1)) continue; if (r.links.every(i => i === P.indexOf(q))) continue; if (r.links.filter(i => i !== P.indexOf(q)).some(i => i === b1)) continue; if (q.links.some(i => i !== b1 && i !== j)) { if (!Q) { Q = q; R = r; } } } }
    if (!Q) return null;
    P.forEach(p => { p.hold = p.i === b1 || p === Q || p === R ? 1 : 0; p.c = p.hold ? 1 : -1; });
    const C0 = $('cmdOf')(0), rq = $('routeAt')(S.T.routes[Q.ri], Math.min(S.T.routes[Q.ri].len, Q.s + 400)), qs = [0, 1, 2].map(i => squadAt(0, rq.x + i * 20, rq.z + i * 15));
    qs.forEach(q => { q.ri = Q.ri; q.s = Math.min(S.T.routes[Q.ri].len, Q.s + 400); q.ord = { k: 'hold', ri: Q.ri, s: q.s }; });
    C.run(1, null, 1 / 30);
    return { S, C0, Q, R, qs };
  };
  const CS = cutSetup();
  ok(!!CS, 'cut: a chain base - Q - R exists to build the situation');
  if (CS) {
    const { S, C0, Q, R, qs } = CS, sq = sqOf(S, 0); $('cmdSense')(C0, sq);
    const cs = $('MANG').cut(C0, Xof(C0, 0, sq)), c = cs.find(c => c.at === Q);
    ok(!!c && c.sc > 0 && c.sc <= 2 && c.spec.c === 'encircle' && c.spec.at === S.cq.p.indexOf(Q) && /corta/.test(c.why), 'cut: a candidate for Q cuts R off, score ' + (c && c.sc.toFixed(2)) + ' (' + (c && c.why) + ')');
    ok($('cutLost')(1, Q).length === 1 && $('cutLost')(1, Q)[0] === R, 'cut: only R loses its tie to the enemy base without Q');
    ok($('MANG').cut(C0, { ...Xof(C0, 0, sq), free: [] }).every(x => x.sc <= 2) && !$('MANG').cut(C0, Xof(C0, 0, sq)).some(x => x.at && x.at.hold !== 1), 'cut: only enemy-held points are candidates');
    const r = $('genCmd')(0, { c: 'man', k: 'encircle', pi: c.spec.at, n: 1 }, 'ai', { spec: c.spec }), op = C0.ops.find(o => o.k === 'cut');
    ok(r.ok && op && C0.pref && C0.pref.p === Q && C0.pref.op === op && has(S, 0, /^Cerco: tomar .* corta .* da base inimiga/), 'cut: opened by the AI: C.pref is Q, the log says what it cuts (' + r.why + ')');
    ok($('opNew')(0, { c: 'encircle', at: S.cq.p.indexOf(Q) }, 'ai').why === 'max' || $('opNew')(0, { c: 'encircle', at: S.cq.p.indexOf(Q) }, 'ai').why === 'cd', 'cut: not twice');
    let atk = null; run(S, () => { atk = C0.ops.find(o => o.k === 'atk' && o.O.tw === Q); return !!atk; }, 240);
    ok(!!atk, 'cut: cmdAttack puts Q first: an assault on it is made (t = ' + S.t.toFixed(0) + ' s)');
    dump(S, 0); Q.hold = 0; Q.c = -1; run(S, () => op.over, 30); dump(S, 0);
    ok(op.over && !C0.pref && has(S, 0, /^Cerco fechado: .* isolado\(s\) da base inimiga/) && C0.man.length === 0, 'cut: Q taken: "Cerco fechado", C.pref cleared, the op is over');
    ok(!H.nan(S), 'cut: no NaN');
  }
  { const B = cutSetup(); if (B) { const { S, C0, Q } = B; ctl(0);
      const r = $('genCmd')(0, { c: 'man', k: 'encircle', pi: S.cq.p.indexOf(Q), n: 1, why: 'teste' }, 'me'), op = C0.ops.find(o => o.k === 'cut');
      ok(r.ok && op && op.by === 'me' && C0.pref && has(S, 0, /^Cerco: tomar/), 'cut: opened by a person with JSON only (' + r.why + ')');
      ok($('genCmd')(0, { c: 'man', k: 'cancel', id: op.id }, 'me').ok && op.over && !C0.pref && has(S, 0, /Cerco cancelado/), 'cut: cancelled by a person: C.pref cleared');
      C0.mcd = {}; ok($('genCmd')(0, { c: 'man', k: 'encircle', pi: 0 }, 'me').why === 'at', 'cut: our own base is not a point to cut (at)'); }
    const T = cutSetup(); if (T) { const { S, C0, Q } = T, r = $('opNew')(0, { c: 'encircle', at: S.cq.p.indexOf(Q), T: 20 }, 'sys'), op = C0.ops.find(o => o.k === 'cut');
      run(S, () => op && op.over, 60); ok(r.ok && op.over && !C0.pref && has(S, 0, /Cerco encerrado: tempo esgotado|Cerco desfeito/), 'cut: its life ends it (T 20 s): C.pref cleared'); } }
  /* ---- fnt: an own assault forming on P, a known enemy by it, another enemy point P2 apart, a free squad in reach ---- */
  const fntSetup = () => {
    const S = fresh(C, era), P = S.cq.p, b1 = P.findIndex(p => p.base === 1);
    let P1 = null, P2 = null;
    for (const a of P) for (const b of P) if (!P1 && a !== b && a.base < 0 && b.base < 0 && a.tw && hdist(a, b) >= 2200 && b.links.some(i => i !== b1 && P[i] !== a)) { P1 = a; P2 = b; }
    if (!P1) return null;
    P.forEach(p => { p.hold = p.i === b1 || p === P1 || p === P2 ? 1 : 0; p.c = p.hold ? 1 : -1; });
    const R1 = S.T.routes[P1.ri], fs = Math.min(R1.len, P1.s + 720), rf = $('routeAt')(R1, fs), C0 = $('cmdOf')(0), pool = [0, 1].map(i => squadAt(0, rf.x + i * 25, rf.z + 20 * i, 'push')); pool.forEach(q => { q.ri = P1.ri; q.s = fs; q.ord = { k: 'hold', ri: P1.ri, s: q.s }; });
    const foe = squadAt(1, P1.x + 120, P1.z + 30); foe.job = 'held'; for (const m of foe.men) { m.seenT = S.t; m.sx = m.x; m.sz = m.z; }
    const pos = $('fntPos')(C0, 0, P2), near = pos && dry(pos.x + 500 * (S.base[0].x > pos.x ? 1 : -1), pos.z), fq = squadAt(0, pos ? pos.x + (S.base[0].x - pos.x) * .15 : P2.x, pos ? pos.z + (S.base[0].z - pos.z) * .15 : P2.z);
    C.run(1, null, 1 / 30);
    const op = $('atkOpen')(C0, $('cqObj')(P1), -1, pool, false, 16, 4);
    pool.forEach(q => q.men.forEach((m, i) => { m.x = q.fp.x + i * 2; m.z = q.fp.z + 1; m.y = $('hgt')(m.x, m.z) + 1; m.ai.gx = m.x; m.ai.gz = m.z; }));   // the elements are at their start points: H-hour comes at once
    return { S, C0, P1, P2, pool, fq, foe, op, pos };
  };
  const FS = fntSetup();
  ok(!!FS, 'fnt: two enemy points 2.2 km apart exist to build the situation');
  if (FS) {
    const { S, C0, P1, P2, fq, op: M } = FS, sq = sqOf(S, 0); $('cmdSense')(C0, sq);
    ok(!!FS.pos, 'fnt: a firing place ' + $('MANT').fnt.rng + ' m from P2 on dry land exists (' + (FS.pos && hdist(FS.pos, P2).toFixed(0)) + ' m)');
    const cs = $('MANG').fnt(C0, Xof(C0, 0, sq)), c = cs[0];
    ok(!!c && c.sc > 0 && c.sc <= 1.5 * $('MANT').fnt.w + 1e-9 && c.spec.c === 'feint' && c.spec.at === S.cq.p.indexOf(P2) && /fingir/.test(c.why), 'fnt: a candidate on P2 with a score in (0, 1.5 w] (' + (c && c.sc.toFixed(2)) + '; ' + (c && c.why) + ')');
    M.over = true; ok($('MANG').fnt(C0, Xof(C0, 0, sq)).length === 0, 'fnt: no assault forming, no candidate'); M.over = false;
    const r = $('genCmd')(0, { c: 'man', k: 'feint', pi: c.spec.at, n: 1 }, 'ai', { spec: c.spec }), op = C0.ops.find(o => o.k === 'fnt');
    ok(r.ok && op && op.main === M && op.by === 'ai' && fq.op === op && fq.ord.k === 'overwatch' && fq.ord.ax === P2.x && has(S, 0, /^Finta sobre .* para atrair a reserva antes da hora H em /), 'fnt: opened by the AI: overwatch order on P2, the log says why (' + r.why + ')');
    ok(!M.sq.includes(fq) && M.sq.length === 2, 'fnt: the squad is not the assault\'s (the assault keeps its ' + M.sq.length + ' squads)');
    let fired = null, missions = 0; run(S, () => { if (op.fired && fired === null) { fired = S.t; missions = C0.fm.filter(m => m.op === op).length; } return op.over; }, 900);
    dump(S, 0, 8);
    ok(fired !== null && missions >= 1 && M.H !== undefined && fired >= M.H - $('MANT').fnt.lead - 1, 'fnt: the missions are asked for at H - ' + $('MANT').fnt.lead + ' s (H ' + (M.H || 0).toFixed(0) + ', fired ' + (fired || 0).toFixed(0) + ', ' + missions + ' missions)');
    ok(op.over && fq.op !== op && S.squads.every(s => !s.op || !s.op.over) && !C0.fm.some(m => m.op === op && !m.dead), 'fnt: it ends (t = ' + S.t.toFixed(0) + ' s), the squad is released and its missions are dead');
    ok(has(S, 0, /^Finta encerrada: (atraiu força|o inimigo não reagiu)/) || has(S, 0, /^Finta cancelada/), 'fnt: the log has the end line (' + logs(S, 0).filter(s => /^Finta/.test(s)).slice(-1) + ')');
    ok(!H.nan(S), 'fnt: no NaN');
  }
  { const B = fntSetup(); if (B) { const { S, C0, P2, fq } = B; ctl(0);
      const r = $('genCmd')(0, { c: 'man', k: 'feint', pi: S.cq.p.indexOf(P2), n: 1, why: 'teste' }, 'me'), op = C0.ops.find(o => o.k === 'fnt');
      ok(r.ok && op && op.by === 'me' && fq.op === op, 'fnt: opened by a person with JSON only (' + r.why + ')');
      B.op.over = true; run(S, () => op.over, 30);
      ok(op.over && !fq.op && has(S, 0, /^Finta cancelada: o assalto principal terminou/), 'fnt: the main assault ending calls it off, the squad is freed');
      C0.mcd = {}; ok($('genCmd')(0, { c: 'man', k: 'feint', pi: S.cq.p.indexOf(P2), n: 1 }, 'me').why === 'path', 'fnt: no assault forming: refused (path)'); } }
  if (!process.env.NOBATTLE) battle(era, +process.env.SECS || 300);
}
done();
