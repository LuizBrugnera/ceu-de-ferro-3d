'use strict';
/* The economy of the general, slice 2: the general produces (the gate is on, units come only from production). Stocks stay in bounds, units
   are made and drawn, every stalled order says why; a starved side fields nothing it cannot pay for; ecoAI is pure; the player's respawn is
   free while ECO.me is 0. RUN: seconds of the normal run (default 180); STARVE: seconds of the starved run (default 240). The harness turns
   ECO.on off unless load({ eco: true }) */
const H = require('./harness'), ok = H.ok, RUN = +process.env.RUN || 180, STARVE = +process.env.STARVE || 240;
const J = v => JSON.stringify(v);
const print = (C, S) => {
  let sum = 0; for (const k of ['men', 'units', 'planes']) for (const o of S[k]) sum += o.x * 1.3 + o.z + (o.hp || 0);
  return [S.men.length, S.units.length, S.squads.length, sum.toFixed(6), S.cq.tk.map(v => v.toFixed(4)).join(','), C.$('Math').random().toFixed(12)].join(' ');
};
const WHY = ['', 'en', 'mt', 'busy', 'none', 'full'];
/* counts what enters the field per side, and the draws that succeeded (as .work/eco/base-probe.js does) */
function probe(C) {
  const made = [{}, {}], draws = [0, 0], add = (t, k) => { if (t === 0 || t === 1) made[t][k] = (made[t][k] || 0) + 1; };
  C.$('globalThis').__add = add; C.$('globalThis').__draw = t => { draws[t]++; };
  C.$('addUnit = (f => function (kind, team, x, z, id, fixed) { globalThis.__add(team, kind + (fixed ? ":fix" : "")); return f.apply(this, arguments); })(addUnit)');
  C.$('addPlane = (f => function (id, team, x, y, z, h, ai, role) { if (ai) globalThis.__add(team, "plane:" + (role || "fighter")); return f.apply(this, arguments); })(addPlane)');
  C.$('addHeli = (f => function (id, team, x, y, z, h, ai) { if (ai) globalThis.__add(team, "heli"); return f.apply(this, arguments); })(addHeli)');
  C.$('ecoCmd = (f => function (t, c, by) { const r = f.apply(this, arguments); if (c.c === "draw" && r.ok) globalThis.__draw(t); return r; })(ecoCmd)');
  return { made, draws };
}

console.log('-- normal (' + RUN + ' s) --');
{
  const C = H.load({ seed: 41, eco: true }), $ = C.$, ECO = $('ECO'), S = C.newState('ww2', $('ERAS').ww2.sides[0].fighter, { cls: 'plane' }), P = probe(C);
  ok(!!S.eco && ECO.gate === 1, 'the economy is on and the gate is on');
  let bad = 0, whyBad = 0, nq = 0;
  C.run(RUN, () => {
    for (const t of [0, 1]) { const d = S.eco.d[t]; if (!(d.en >= 0 && d.en <= ECO.cap.en && d.mt >= 0 && d.mt <= ECO.cap.mt)) bad++; for (const q of d.q) { nq++; if (!WHY.includes(q.why)) whyBad++; } }
  });
  ok(bad === 0, 'the stocks stayed within [0, ' + ECO.cap.en + ']');
  ok(whyBad === 0 && nq > 0, 'every queued order\'s why is one of ' + WHY.join('|') + ' (' + nq + ' order-steps seen)');
  for (const t of [0, 1]) {
    const d = S.eco.d[t];
    ok(d.made >= 5, 'side ' + t + ' finished ' + d.made + ' units');
    ok(P.draws[t] >= 1, 'side ' + t + ' drew ' + P.draws[t] + ' units from its reserve');
    console.log('   side ' + t + ' field: ' + J(P.made[t]) + ' reserve: ' + J(C.ecoView(t).res));
  }
  ok(H.nan(S) === null, 'no NaN in the entities');
  const v = C.genVM(0, false).eco.rows;
  ok(v.some(r => r.label === 'Reserva') && !v.some(r => r.label === 'Custo do que entrou em campo'), 'rows: Reserva, and no field-cost row with the gate on');
}

console.log('-- starved (side 1 loses its factories and income; ' + STARVE + ' s) --');
{
  const C = H.load({ seed: 41, eco: true }), $ = C.$, ECO = $('ECO'), S = C.newState('ww2', $('ERAS').ww2.sides[0].fighter, { cls: 'plane' }), P = probe(C);
  C.run(1);
  ECO.hq.en = ECO.hq.mt = ECO.pt.en = ECO.pt.mt = 0;   // no income at all: the HQ's and the points' (ECO.pt)
  const d1 = S.eco.d[1]; d1.en = d1.mt = 0; d1.res = {};
  for (const e of S.eco.l.filter(e => e.team === 1 && !e.dead)) C.ecoDown(e, -1, true);
  C.run(1);
  const base = J(P.made[1]); let missSeen = 0, whyBad = 0, nq = 0; const seen = {};
  P.made[1] = {};
  C.run(STARVE, () => {
    if (Object.keys(d1.miss).some(k => d1.miss[k].length)) missSeen++;
    for (const q of d1.q) { nq++; seen[q.why] = 1; if (!['none', 'en', 'mt'].includes(q.why) && q.p === 0) whyBad++; }
  });
  const m = P.made[1], bad = Object.keys(m).filter(k => /^(tank|aa|art)$/.test(k) || /^plane:/.test(k) || k === 'heli');
  ok(bad.length === 0, 'side 1 fielded no tank, aa, art or plane while starved: ' + J(m));
  ok(missSeen > 0, 'side 1\'s miss was not empty (seen on ' + missSeen + ' steps)');
  ok(nq > 0 && whyBad === 0, 'its orders stalled with none, en or mt (' + Object.keys(seen).join(',') + ')');
  const m0 = P.made[0], f0 = Object.keys(m0).filter(k => /^(tank|aa|art|squad|truck|car)$/.test(k) || /^plane:/.test(k)).reduce((a, k) => a + m0[k], 0);
  ok(f0 > 0, 'side 0 still fielded units: ' + J(m0));
}

console.log('-- ecoAI is pure --');
{
  const mk = () => { const C = H.load({ seed: 41, eco: true }), S = C.newState('ww2', C.$('ERAS').ww2.sides[0].fighter, { cls: 'plane' }); return { C, S }; };
  const A = mk(), B = mk();
  A.C.run(60); B.C.run(60);
  const V = A.C.ecoView(0), a1 = A.C.ecoAI(0, V), a2 = A.C.ecoAI(0, V), v2 = A.C.ecoView(0);
  ok(J(a1) === J(a2) && J(V) === J(v2), 'two calls on the same view give the same commands (' + a1.length + ') and the view did not change');
  for (let i = 0; i < 5; i++) { A.C.ecoAI(1, A.C.ecoView(1)); A.C.ecoAsk(0, { q: 'spots', k: 'pow' }); }
  ok(print(A.C, A.S) === print(B.C, B.S), 'the battle is the same with and without the calls');
}

console.log('-- ECO.me 0: the player respawns free --');
{
  const C = H.load({ seed: 41, eco: true }), $ = C.$, ECO = $('ECO'), S = C.newState('ww2', $('ERAS').ww2.sides[0].fighter, { cls: 'plane' });
  ok(ECO.me === 0, 'ECO.me is 0');
  C.run(5);
  S.eco.d[0].res = {}; S.eco.d[0].en = S.eco.d[0].mt = 0;
  const P0 = S.my; ok(!!P0 && !P0.dead, 'the player flies');
  P0.hp = 0; P0.dead = true; P0.gone = true; P0.sp = { x: 0, y: 0, z: 0 }; $('cqDead')(P0); $('playerDown')(null);
  ok(S.respawn > 0, 'the player went down, a respawn is counting (' + S.respawn + ')');
  C.run(30, () => !(S.my !== P0 && !S.my.dead));
  ok(S.my !== P0 && !S.my.dead, 'the player is back in the air with side 0\'s reserve empty');
  ok(!S.banner || S.banner.text !== 'Aguardando produção', 'no "Aguardando produção" banner');
}
H.done();
