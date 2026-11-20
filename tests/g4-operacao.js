'use strict';
/* The General 2's operation (G4, cf-g2-g4-operacao): the 1944 map, side 0 holding Travessia, three assault squads of another road some 2 km from an
   assembly of Vila do Moinho (the field of tests/procedures.js) and a garrison in Travessia.
   1. the allocator: the garrison holding Travessia is kept (pass 1); the three come to the pool by their time to the assembly, as many as the odds
      need against what the side believes (a point the enemy holds that nobody looked into: the old guess) and never under three while there are;
   2. the belief remembers: what was seen at a place stays, fading;
   3. fix and flank with the main effort by the flank: one squad fixing (the nearest the axis' assembly), the manoeuvre the other two;
   4. the schedule: each squad's ETA, the deadline 90 s after the slowest;
   5. the gate by strength: two of the three (two thirds of the strength) at their assemblies and the assault goes (fix and flank: the manoeuvre walks, mv);
   6. the deadline with hysteresis: nobody there at the deadline but the late ones closing in: it moves to their new ETA (once), the assault is not cut;
   7. an assembly under fire falls back along its approach once; a second time the forming up is cancelled;
   8. G4.on 0: the pool of before (every free squad within reach), no op.g4.
   About a minute */
const H = require('./harness'), { ok, done } = H, { performance } = require('perf_hooks');

function field(on) {
  const C = H.load({ seed: 9, eco: 1, mapv: 6 }), $ = C.$; C.$('globalThis').performance = performance; $('G4').on = on ? 1 : 0;
  const S = C.watch('ww2', { len: 0 }), nm = p => $('gName')(p), tg = S.cq.p.find(p => /Moinho/.test(nm(p))), st = S.cq.p.find(p => /Travessia/.test(nm(p))); st.hold = 0;
  $('run')(1);
  const Cm = $('cmdOf')(0); $('cmdSense')(Cm, []); $('cmdSense')($('cmdOf')(1), []); $('tmNow')(0); $('tmNow')(1);
  for (const q of S.squads.filter(q => q.team === 0)) for (const m of q.men) m.dead = true;
  S.squads = S.squads.filter(q => q.team !== 0); S.men = S.men.filter(m => !m.dead);
  const R = S.T.routes, A = $('apNow')(Cm, $('cqObj')(tg), -1).A, AP = $('AP'); let at = null, bd = 1e9;
  for (let ri = 0; ri < R.length; ri++) if (ri !== tg.ri) for (let s = 0; s <= R[ri].len; s += 50) {
    const p = $('routeAt')(R[ri], s), a = A.reduce((b, x) => (Math.hypot(p.x - x.asm.x, p.z - x.asm.z) < Math.hypot(p.x - b.asm.x, p.z - b.asm.z) ? x : b)), d = Math.hypot(p.x - a.asm.x, p.z - a.asm.z);
    if (d < bd && p.x < tg.x && $('hgt')(p.x, p.z) > S.T.WL + 2) { bd = d; at = { ri, s, x: p.x, z: p.z, a: a.asm }; }
  }
  if (bd > AP.pool * .85) { const k = 1 - AP.pool * .85 / bd; at.x += (at.a.x - at.x) * k; at.z += (at.a.z - at.z) * k; }
  const mk = (job, k, x, z, ri, s, O) => { const q = $('addSquad')(0, x, z, ri, s); q.job = job; q.jk = k; $('setOrd')(q, O || { k: 'hold', ri, s, x, z, R: 9 }); q.live = q.men.length; return q; };
  Cm.atkT = 0; Cm.ops = Cm.ops.filter(op => op.k !== 'atk'); Cm.apc = null; Cm.apQ = [];
  const sq = [0, 40, 80].map((dx, k) => mk('push', k, at.x + dx, at.z, at.ri, at.s));
  const gar = mk('garr', 0, st.x + 20, st.z, st.ri, st.s, { k: 'hold', ri: st.ri, s: st.s, x: st.x + 20, z: st.z, tw: st, R: 0 });
  const live = () => S.squads.filter(q => q.team === 0 && q.live > 0 && !q.state);
  const PR = $('PR'); PR.expK = 9; PR.expAdd = 100; PR.long = 9; PR.front = 99; PR.env.r = 99; PR.pen.r = 99; PR.rec.n = 99; PR.rec.foe = 99;   // only p1 can be drawn
  $('cmdSense')(Cm, live()); $('tmNow')(0);
  return { C, $, S, Cm, sq, gar, tg, st, live, at };
}
const lead = q => q.men.find(m => !m.dead);
const put = (q, x, z) => { for (const m of q.men) if (!m.dead) { m.x = x; m.z = z; } };

console.log('-- 1. the allocator in two passes --');
const F = field(1), { $, S, Cm, sq, gar, tg } = F, G4 = $('G4');
{
  const P = $('cqObj')(tg), o = { x: tg.x, z: tg.z };
  const keep = $('g4Keep')(Cm, F.live());
  ok(keep.has(gar) && !sq.some(q => keep.has(q)), 'pass 1 keeps the garrison holding Travessia, not the assault squads going by (' + [...keep].map(q => q.job).join(', ') + ')');
  const pool = $('apPool')(Cm, F.live(), P, -1, o, 4), need = Cm.g4P.need;
  ok(pool.length === 3 && sq.every(q => pool.includes(q)) && !pool.includes(gar), 'pass 2: the three assault squads, not the garrison (pool ' + pool.map(q => q.job).join(', ') + '; need ' + need + ' men, the old guess ' + $('CMD').guess + ' x the doctrine x ' + G4.over + ')');
  const L = sq.map(q => Math.round($('hdist')(lead(q), o)));
  ok(Cm.g4P.n === 3, 'their times to the assembly are all within ' + G4.eta + ' s (' + L.join(', ') + ' m from the objective)');
}
console.log('-- 2. the belief remembers --');
{
  const o = { x: F.tg.x + 3000, z: F.tg.z }, k = Math.round(o.x) + ',' + Math.round(o.z), M = Cm.g4M || (Cm.g4M = new Map());
  M.set(k, { v: 20, T: S.t - 120 });
  const v = $('g4Foe')(Cm, null, o);
  ok(Math.abs(v - 20 * G4.mem.k * G4.mem.k) < .01, 'seen 20 there two minutes ago, nothing now: believed ' + Math.round(v * 100) / 100 + ' (' + G4.mem.k + ' a minute)');
}
console.log('-- 3/4. the assault: fix and flank, the main effort by the flank, the schedule --');
$('cmdAttack')(Cm, F.live()); $('aiDrain')($('apWork')(Cm)); $('cmdAttack')(Cm, F.live());
const op = Cm.ops.find(o => o.k === 'atk' && !o.over);
ok(op && op.pr === 'p1', 'the assault opens as fix and flank (' + (op ? op.pr + ', ' + op.sq.length + ' squads' : 'none') + ')');
if (op) {
  const fix = op.sq.filter(q => q.apr === 'fix'), man = op.sq.filter(q => q.apr === 'man');
  ok(fix.length === 1 && man.length === 2, 'one squad fixes, the manoeuvre takes the other two (fix ' + fix.length + ', manoeuvre ' + man.length + ')');
  ok(!!op.g4 && op.g4.eta.size === 3, 'the schedule has the ETA of each squad (' + (op.g4 ? [...op.g4.eta.values()].map(Math.round).join(', ') + ' s' : 'none') + ')');
  const H0 = op.g4 ? op.g4.H - op.g4.T : 0;
  ok(op.g4 && Math.abs(op.formT - Math.min(Math.max(H0 + G4.grace, G4.dl[0]), G4.dl[1])) < 1, 'the deadline is ' + G4.grace + ' s after the slowest: ' + Math.round(op.formT) + ' s (the slowest ' + Math.round(H0) + ' s)');
  console.log('-- 5. the gate by strength --');
  const two = [fix[0], man[0]];
  for (const q of two) put(q, q.fp.x, q.fp.z);
  S.t += 30; $('OPS').atk(Cm, op);
  ok(op.st !== 'form', 'two of three at their assemblies (two thirds of the strength, over ' + G4.go + '): the forming up ends at ' + Math.round(S.t - op.T) + ' s of ' + Math.round(op.formT) + ' (now ' + op.st + ')');
}
console.log('-- 6. the deadline moves while the late ones close in --');
{
  const F2 = field(1), C2 = F2.Cm, $2 = F2.$;
  $2('cmdAttack')(C2, F2.live()); $2('aiDrain')($2('apWork')(C2)); $2('cmdAttack')(C2, F2.live());
  const o2 = C2.ops.find(o => o.k === 'atk' && !o.over);
  if (!o2) ok(false, 'an assault to time');
  else {
    const G = o2.g4; F2.S.t = o2.T + o2.formT - 1; G.remT = F2.S.t - 50;
    for (const q of opLive(o2)) G.rem.set(q, $2('hdist')(lead(q), q.fp) + 200);   // each 200 m nearer than at the last look
    const f0 = o2.formT; $2('OPS').atk(C2, o2);
    ok(!o2.over && o2.st === 'form' && G.ext === 1 && o2.formT > f0, 'at the deadline with nobody there but all closing in: not cut, the deadline moves ' + Math.round(o2.formT - f0) + ' s (extensions ' + G.ext + ')');
    F2.S.t = o2.T + o2.formT + 1; G.remT = F2.S.t - 50;
    for (const q of opLive(o2)) G.rem.set(q, $2('hdist')(lead(q), q.fp));   // standing still now
    $2('OPS').atk(C2, o2);
    ok(o2.over, 'at the new deadline with nobody there and nobody closing in: cancelled (' + (o2.over ? 'over' : o2.st) + ')');
  }
  function opLive(o) { return o.sq.filter(q => q.live > 0 && !q.state); }
}
console.log('-- 7. an assembly under fire --');
{
  const F3 = field(1), C3 = F3.Cm, $3 = F3.$;
  $3('cmdAttack')(C3, F3.live()); $3('aiDrain')($3('apWork')(C3)); $3('cmdAttack')(C3, F3.live());
  const o3 = C3.ops.find(o => o.k === 'atk' && !o.over);
  if (!o3) ok(false, 'an assault under fire');
  else {
    const q = o3.sq[0]; put(q, q.fp.x, q.fp.z); const fp0 = { x: q.fp.x, z: q.fp.z };
    const e = { man: true, dead: false, team: 1, x: q.fp.x + 150, z: q.fp.z, sx: q.fp.x + 150, sz: q.fp.z, seenT: F3.S.t, sn: [[F3.S.t, q.fp.x + 150, q.fp.z], [F3.S.t, q.fp.x + 150, q.fp.z]] };
    C3.known.push(e); lead(q).hitT = F3.S.t;
    $3('OPS').atk(C3, o3);
    ok(o3.g4.fb === 1 && !o3.over && $3('hdist')(q.fp, fp0) > 100, 'hit at its assembly with the enemy 150 m off: the assembly falls back ' + Math.round($3('hdist')(q.fp, fp0)) + ' m along its approach');
    put(q, q.fp.x, q.fp.z); e.sx = q.fp.x + 150; e.sz = q.fp.z; e.sn = [[F3.S.t, e.sx, e.sz], [F3.S.t, e.sx, e.sz]]; lead(q).hitT = F3.S.t;
    $3('OPS').atk(C3, o3);
    ok(o3.over, 'hit again at the new one: the forming up is cancelled (' + (o3.over ? 'over' : o3.st) + ')');
  }
}
console.log('-- 8. G4.on 0: the general of before --');
{
  const F4 = field(0), C4 = F4.Cm, $4 = F4.$;
  const pool = $4('apPool')(C4, F4.live(), $4('cqObj')(F4.tg), -1, { x: F4.tg.x, z: F4.tg.z }, 4);
  ok(pool.length === 3 && !C4.g4P, 'the old pool (the free squads within reach), and no G4 at all (' + pool.map(q => q.job).join(', ') + ')');
  $4('cmdAttack')(C4, F4.live()); $4('aiDrain')($4('apWork')(C4)); $4('cmdAttack')(C4, F4.live());
  const o4 = C4.ops.find(o => o.k === 'atk' && !o.over);
  ok(o4 && !o4.g4 && o4.sq.filter(q => q.apr === 'fix').length === 2, 'the assault of before: no schedule, the fixing element the bigger (' + (o4 ? o4.sq.map(q => q.apr).join(', ') : 'none') + ')');
}
done();
