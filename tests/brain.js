'use strict';
/* CEREBRO: contrato (P0, cf-lideres): the brain's shared objects and clock change nothing in the battle. The same AI × AI match with BRAIN.on 0,
   with BRAIN.on 1, and with BRAIN.on 1 and a no-op hook on every layer ends the same, to the last digit and the random stream; with it on, every
   squad of the AI has its board, its leader and two fire teams, every soldier his reflex, morale and task; an order, a report by voice and a
   word (fala) go where the contract says; and the brain's clock costs at most 0.1 ms a frame. SECS: the match's length (default 40) */
const H = require('./harness'), ok = H.ok, SECS = +process.env.SECS || 40;
const print = (C, S) => {
  let sum = 0; for (const k of ['men', 'units', 'planes']) for (const o of S[k]) sum += o.x * 1.3 + o.z + (o.hp || 0);
  return [S.men.length, S.units.length, S.squads.length, sum.toFixed(6), S.cq.tk.map(v => v.toFixed(4)).join(','), C.$('Math').random().toFixed(12)].join(' ');
};
const go = (on, hooks, era) => {
  const C = H.load({ seed: 41 }); C.$('BRAIN').on = on;
  const n = { lid: 0, eq: 0, sold: 0 };
  if (hooks) { const B = C.$('brainHook'); B('lid', () => { n.lid++; }); B('eq', () => { n.eq++; }); B('sold', () => { n.sold++; }); }
  const S = C.watch(era || 'ww2', {}); C.run(SECS);
  return { C, S, p: print(C, S), n };
};

console.log('-- the battle is not changed (' + SECS + ' s, AI × AI) --');
for (const era of ['ww2', 'modern']) {
  const a = go(0, false, era), b = go(1, false, era), c = go(1, true, era);
  ok(a.p === b.p, era + ': BRAIN.on 0 and 1 end the same (' + a.p + ')');
  ok(a.p === c.p, era + ': with a no-op hook on every layer too');
  ok(c.n.lid > 0 && c.n.eq > 0, era + ': the leaders\' and the teams\' hooks ran (' + JSON.stringify(c.n) + ')');
  if (era === 'ww2') {
    const S = b.S, $ = b.C.$, sq = S.squads.filter(q => !q.net && q.live > 0 && !q.mil);
    const bad = sq.filter(q => !(q.bb && typeof q.bb.cont.get === 'function' && q.eq.length === 2 && q.men.includes(q.lid) && q.eq.every(e => e.men.every(m => q.men.includes(m) && m !== q.lid))));
    ok(sq.length > 3 && !bad.length, sq.length + ' squads: each with its board, its leader one of its men, and two fire teams of its other men' + (bad.length ? ': not ' + bad.map(q => q.team + '/' + q.id + ' ' + q.job + ' lid ' + (q.lid ? (q.lid.dead ? 'dead' : q.lid.down ? 'down' : 'up') + (q.men.includes(q.lid) ? '' : ' out') : 'none') + ' men ' + q.men.length + ' live ' + q.live).join('; ') : ''));
    ok(sq.every(q => q.eq[0].men.every(m => !(m.ai.i & 1)) && q.eq[1].men.every(m => m.ai.i & 1)), 'team A the even numbers, team B the odd ones');
    ok(S.men.filter(m => m.ai && !m.net).every(m => m.mo && m.rf && m.tar !== undefined), 'every soldier of the AI has his reflex, morale and task');
    ok(a.S.squads.every(q => !q.bb) && a.S.men.every(m => !m.mo), 'with BRAIN.on 0 nothing of it is made');
    const st = $('AIB').stat(), bt = $('brainTick'), now = $('AIB').now; bt(1 / 60);
    let w = 1e9; for (let k = 0; k < 5; k++) { const t0 = now(); for (let i = 0; i < 500; i++) bt(1 / 60); w = Math.min(w, (now() - t0) / 500); }   // the best of five rounds: the brain's own cost, not the machine's load
    ok(w <= .1, 'the brain\'s clock costs ' + w.toFixed(4) + ' ms a step with ' + S.squads.length + ' squads (at most 0.1); in the match, measured with whatever else ran: ' + st.brain + ' ms on average, ' + st.brainMax + ' ms at worst');
  }
}

console.log('-- orders, reports and words --');
{
  const C = H.load({ seed: 3, ana: true }), $ = C.$, S = C.watch('ww2', {}); C.run(2);
  const q = S.squads.find(q => !q.net && q.live >= 4 && q.lid && q.eq[0].men.length && q.eq[1].men.length), L = q.lid, m = q.eq[1].men[0];
  const o = $('ord')('manter', null, { por: 'segurar a ponte', area: { x: L.x, z: L.z, r: 50 } });
  $('brainOrd')(q, o); ok(q.bb.ord === o && o.id > 0 && o.por === 'segurar a ponte', 'an order with its purpose goes on the squad\'s board');
  m.x = L.x + 10; m.z = L.z;
  const r = $('rel')('contato', m, { x: L.x + 300, z: L.z, c: 'mg', g: 2 });
  ok($('brainRel')(q, r) && r.ch === 'voz', 'a report from 10 m goes by voice');
  ok(q.bb.cont.size === 0 || ![...q.bb.cont.values()].some(c => c.de === m), 'it is not on the board before the voice\'s time');
  C.run(1);
  ok([...q.bb.cont.values()].some(c => c.de === m && c.c === 'mg'), 'after it, the contact is on the board, reported by that man');
  const far = q.men.find(n => n !== L && !n.dead); far.x = L.x + 2000; far.z = L.z;
  ok(!$('brainRel')(q, $('rel')('contato', far, { x: 0, z: 0 })) || q.cnL === 2, 'a report from 2 km, out of voice and sign, needs the radio');
  $('fala')(L, 'contato', { h: 2 });
  ok(L.fala && L.fala.k === 'contato' && $('ANA').ev.some(e => e.k === 'cb' && e.c === 'fala' && e.f === 'contato'), 'a word is recorded, and is a brain event for the analytics');
}
H.done();
