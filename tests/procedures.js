'use strict';
/* The manoeuvre procedures (M3) and the rest of the general: the states an assault takes before its H-hour that M3 added (mv: the manoeuvre walks to
   its assault position and the fixing element to its base of fire; rec: the recon of p12) count as "before H-hour" wherever the general asks:
   the axis' armour holds back behind the start line (cmdColumns), a campaign waits for a front still in them (campTick), the feints and the aid
   attach to them, and the view names them. And a fix and flank (p1) walked through its states: the elements to their assemblies, the manoeuvre to its
   assault position and the fixing element to its base of fire (mv), H-hour when the manoeuvre is there, the fixing element firing from the base while
   the manoeuvre assaults; and one given up when the manoeuvre is late. About a minute */
const H = require('./harness'), { ok, done } = H, { performance } = require('perf_hooks');

const C0 = H.load({ seed: 2, mapv: 6 }), $ = C0.$, S = C0.watch('ww2', { len: 0 });
C0.run(20, null, 1 / 20);
const pre = (() => { try { return $('atkPreH'); } catch (e) { return null; } })();

console.log('-- before H-hour --');
ok(typeof pre === 'function', 'atkPreH is there');
if (typeof pre === 'function') {
  const st = k => ({ st: k });
  ok(['form', 'mv', 'rec', 'prep', 'screen'].every(k => pre(st(k))) && !['go', 'fight', 'cons', 'back'].some(k => pre(st(k))), 'form, mv, rec, prep and screen are before H-hour; go, fight, cons and back are not');
  ok(['form', 'mv', 'rec'].every(k => pre(st(k), 1)) && !['prep', 'screen'].some(k => pre(st(k), 1)), 'a front still forming up for a campaign: form, mv and rec (not prep or screen)');
}

console.log('-- a campaign waits for a front whose manoeuvre is still walking --');
for (const k of ['form', 'mv', 'rec']) {
  const C = S.cmd[0], O = S.cq.p[0], op = { k: 'atk', id: 9000, st: k, over: false, O, sq: [], n0: 1 };
  const K = { id: 77, by: 'ai', st: 'form', ops: [op], res: [], T0: S.t, H: S.t, sl: 0 }, H0 = K.H;
  const keep = C.camp; C.camp = [K];
  try { $('campTick')(C); } finally { C.camp = keep; }
  ok(K.st === 'form' && K.H > H0, 'a front in ' + k + ' at the campaign\'s H-hour: H-hour put off ' + Math.round(K.H - H0) + ' s (state ' + K.st + ')');
}

console.log('-- the axis\' armour holds behind the start line until H-hour --');
{
  const C = S.cmd[0], u = S.units.find(v => v.team === 0 && v.ai && !v.net && !v.dead && v.kind === 'tank' && v.rail && !v.fixed && v.ri !== undefined);
  ok(!!u, 'side 0 has an AI tank on an axis');
  if (u) {
    const r = S.T.routes[u.ri], sd = 1, O = { x: 0, z: 0, s: Math.min(r.len, u.s + 600) };
    for (const k of ['form', 'mv', 'rec', 'go']) {
      const op = { k: 'atk', id: 9001, st: k, ri: u.ri, fs: u.s - 20, sd, O, T0: S.t, over: false };
      u.ai.rest = 0; C.ops.push(op);
      try { $('cmdColumns')(C, S.squads.filter(q => q.team === 0)); } finally { C.ops.splice(C.ops.indexOf(op), 1); }
      const held = u.ai.rest > S.t;
      ok(k === 'go' ? !held : held, 'an assault in ' + k + ' on its axis: the tank ' + (held ? 'holds' : 'goes on'));
    }
  }
}

console.log('-- the view and the posture name them --');
{
  const G = $('GEN');
  ok(G.st.mv === 'MANOBRA' && G.st.rec === 'RECONHECIMENTO', 'GEN.st names mv and rec');
  const C = S.cmd[0], O = S.cq.p[0], keep = C.ops;
  for (const k of ['mv', 'rec']) {
    C.ops = [{ k: 'atk', st: k, over: false, O, sq: [] }];
    let p = null; try { p = $('genPosture')(C); } finally { C.ops = keep; }
    ok(p && p.k === 'Ofensiva' && /Manobra|Reconhecendo/.test(p.s), 'the posture in ' + k + ': ' + (p && p.s));
  }
}

console.log('-- p1\'s gate (cf-manobra-fix): 45° off the axis, exposure up to .8 x the axis\' + 15 points, up to 2.2 x its length --');
{
  const PR = $('PR'), okF = $('prFlankOk'), ax = { ang: 11, exp: 17, len: 1200 };
  ok(PR.flank === 45 && PR.expK === .8 && PR.expAdd === 15 && PR.long === 2.2, 'the table: flank ' + PR.flank + '°, exposure ' + PR.expK + ' x + ' + PR.expAdd + ', length ' + PR.long + ' x');
  ok(okF({ ang: 72, exp: 15, len: 1900 }, ax), '  the flank the measurement saw (72°, 15% in sight, 1.9 km against the axis at 11°, 17%, 1.2 km) passes');
  ok(okF({ ang: 50, exp: 28, len: 2500 }, ax), '  a short map\'s flank: 50°, 28% in sight (the old gate: 20%), 2.08 x the axis\' length (the old: 1.8 x) passes now');
  ok(!okF({ ang: 40, exp: 10, len: 1300 }, ax), '  40° off the axis is no flank');
  ok(!okF({ ang: 90, exp: 30, len: 1300 }, ax), '  more in sight than .8 x the axis\' + 15 (' + (PR.expK * ax.exp + PR.expAdd).toFixed(1) + '%) is refused');
  ok(!okF({ ang: 90, exp: 10, len: 2700 }, ax), '  longer than 2.2 x the axis is refused');
  /* prPick with such a plan: p1 is a candidate, by that gate */
  const C = S.cmd[0], q2 = S.squads.filter(q => q.team === 0 && q.live >= 3).slice(0, 2), o = { x: q2[0].men[0].x + 1500, z: q2[0].men[0].z };
  const ap = (ang, exp, len, s) => ({ ang, exp, len, min: len / 1000 * 12, cost: len, s, br: ang * Math.PI / 180, axis: ang < 30 ? 80 : 10, wood: 0, cells: [], asm: { x: o.x - 800, z: o.z + s * 100, i: 0 }, pos: { x: o.x - 400, z: o.z + s * 100, v: 0 } });
  const keep = [PR.front, PR.pen.r, PR.rec.n, PR.rec.foe, PR.env.r]; PR.front = 99; PR.pen.r = 99; PR.rec.n = 99; PR.rec.foe = 99; PR.env.r = 99;
  let ev = null;
  try { $('prPick')(C, { ri: 0, s: 100, x: o.x, z: o.z }, 1, q2, 20, 10, { A: [ap(11, 17, 1200, 0), ap(50, 28, 2500, 3)], o, nm: 'teste' }); ev = C.prEv; }
  finally { [PR.front, PR.pen.r, PR.rec.n, PR.rec.foe, PR.env.r] = keep; }
  ok(ev && ev.some(x => x.k === 'p1') && !ev.some(x => x.k === 'p6'), 'prPick: the 50° flank of a short map makes fix and flank a candidate, no "sem abordagem de flanco" frontal (' + (ev || []).map(x => x.k).join(', ') + ')');
}

/* the 1944 map, side 0 holding Travessia, three free squads of another road 1.5 to 2.6 km from Vila do Moinho (as tests/approaches.js) */
function field() {
  const C = H.load({ seed: 9, eco: 1, mapv: 6 }), $ = C.$; C.$('globalThis').performance = performance;
  const S = C.watch('ww2', { len: 0 }), nm = p => $('gName')(p), tg = S.cq.p.find(p => /Moinho/.test(nm(p))), st = S.cq.p.find(p => /Travessia/.test(nm(p))); st.hold = 0;
  $('run')(1);
  const Cm = $('cmdOf')(0); $('cmdSense')(Cm, []); $('cmdSense')($('cmdOf')(1), []); $('tmNow')(0); $('tmNow')(1);
  for (const q of S.squads.filter(q => q.team === 0)) for (const m of q.men) m.dead = true;
  S.squads = S.squads.filter(q => q.team !== 0); S.men = S.men.filter(m => !m.dead);
  const R = S.T.routes; let at = null;
  /* the place of another road nearest an assembly of the plan, and out in the field toward it to .85 x AP.pool from it when farther: an assault takes squads within AP.pool m of an assembly */
  const A = $('apNow')(Cm, $('cqObj')(tg), -1).A, AP = $('AP'); let bd = 1e9;
  for (let ri = 0; ri < R.length; ri++) if (ri !== tg.ri) for (let s = 0; s <= R[ri].len; s += 50) { const p = $('routeAt')(R[ri], s), a = A.reduce((b, x) => (Math.hypot(p.x - x.asm.x, p.z - x.asm.z) < Math.hypot(p.x - b.asm.x, p.z - b.asm.z) ? x : b)), d = Math.hypot(p.x - a.asm.x, p.z - a.asm.z); if (d < bd && p.x < tg.x && $('hgt')(p.x, p.z) > S.T.WL + 2) { bd = d; at = { ri, s, x: p.x, z: p.z, a: a.asm }; } }
  if (bd > AP.pool * .85) { const k = 1 - AP.pool * .85 / bd; at.x += (at.a.x - at.x) * k; at.z += (at.a.z - at.z) * k; }
  Cm.apc = null;
  const mk = (k, dx) => { const q = $('addSquad')(0, at.x + dx, at.z, at.ri, at.s); q.job = 'road'; q.jk = k; $('setOrd')(q, { k: 'hold', ri: at.ri, s: at.s, x: at.x + dx, z: at.z, R: 9 }); q.live = q.men.length; return q; };
  Cm.atkT = 0; Cm.ops = Cm.ops.filter(op => op.k !== 'atk'); Cm.apc = null; Cm.apQ = [];
  const sq = [mk(0, 0), mk(1, 40), mk(2, 80)], live = () => S.squads.filter(q => q.team === 0 && q.live > 0 && !q.state);
  /* only p1 can be drawn: the flank's limits opened, the other procedures out of reach */
  const PR = $('PR'); PR.expK = 9; PR.expAdd = 100; PR.long = 9; PR.front = 99; PR.env.r = 99; PR.pen.r = 99; PR.rec.n = 99; PR.rec.foe = 99;
  $('cmdSense')(Cm, live()); $('tmNow')(0); $('cmdAttack')(Cm, live()); $('aiDrain')($('apWork')(Cm)); $('cmdAttack')(Cm, live());
  return { C, $, S, Cm, sq, op: Cm.ops.find(o => o.k === 'atk' && !o.over), PR };
}
const ordOf = q => (q.cnP ? q.cnP.O : q.ord);   // the order a squad has, or the one the radio is bringing it
const put = (q, x, z) => { for (const m of q.men) if (!m.dead) { m.x = x; m.z = z; } };

console.log('-- p1, fix and flank, through its states --');
{
  const { $, S, Cm, op, PR } = field();
  ok(op && op.pr === 'p1' && op.ap.length === 2, 'the assault opens as fix and flank (' + (op ? op.pr + ', approaches ' + op.ap.map(a => a.ang + '°').join(' and ') : 'no op') + ')');
  if (op && op.pr === 'p1') {
    const l = $('opLive')(op), man = l.filter(q => q.apr === 'man'), fix = l.filter(q => q.apr === 'fix');
    ok(man.length === 1 && fix.length === 2 && man.every(q => q.ape === 1) && fix.every(q => q.ape === 0), 'roles: 1 manoeuvre by the flank, 2 fixing by the axis');
    for (const q of l) { const o = ordOf(q); put(q, o.x, o.z); q.at = true; }
    $('OPS').atk(Cm, op);
    ok(op.st === 'mv' && op.mvT === S.t, 'formed up: the manoeuvre walks (st ' + op.st + ')');
    const a1 = op.ap[1], a0 = op.ap[0], mo = ordOf(man[0]);
    ok(Math.hypot(mo.x - a1.pos.x, mo.z - a1.pos.z) < 1 && mo.quiet && mo.fast, '  the manoeuvre to the flank\'s assault position, quietly, at a run');
    const bd = fix.map(q => Math.hypot(q.fp.x - op.O.x, q.fp.z - op.O.z));
    ok(fix.every(q => ordOf(q).quiet && ordOf(q).wp) && bd.every(d => d >= PR.base[0] * .8 && d <= PR.base[1] * 1.6), '  the fixing element to its base of fire on the axis approach, quietly (' + bd.map(Math.round).join(', ') + ' m from the objective)');
    $('OPS').atk(Cm, op);
    ok(op.st === 'mv', '  the manoeuvre not there yet: still mv');
    put(man[0], a1.pos.x, a1.pos.z); $('OPS').atk(Cm, op);
    ok(op.st === 'prep' && op.H > S.t, 'the manoeuvre at its assault position: H-hour in ' + Math.round(op.H - S.t) + ' s (st ' + op.st + ')');
    $('OPS').atk(Cm, op); op.H = S.t; op.smk = false; $('OPS').atk(Cm, op);
    ok(op.st === 'go', 'H-hour (st ' + op.st + ')');
    ok(fix.every(q => ordOf(q).k === 'overwatch' && Math.hypot(ordOf(q).x - q.fp.x, ordOf(q).z - q.fp.z) < 1) && man.every(q => ordOf(q).k === 'assault'), '  the fixing element fires from its base, the manoeuvre assaults');
  }
}
console.log('-- p1 given up: the manoeuvre is late --');
{
  const { $, S, Cm, op, PR } = field();
  if (op && op.pr === 'p1') {
    for (const q of $('opLive')(op)) { const o = ordOf(q); put(q, o.x, o.z); q.at = true; }
    $('OPS').atk(Cm, op);
    ok(op.st === 'mv', 'formed up, the manoeuvre walks');
    op.mvT = S.t - op.eta - PR.late - 1; $('OPS').atk(Cm, op);
    ok(op.st === 'back' || op.over, 'late by more than PR.late s with odds under PR.front: the assault is called off (st ' + op.st + (op.over ? ', over' : '') + ')');
    ok(((S.glog && S.glog.l[0]) || []).some(e => /Fixar e flanquear em .* abandonado \(a manobra atrasou\)/.test(e.s)), '  and the log says why');
  } else ok(false, 'the assault opens as fix and flank');
}
done();
