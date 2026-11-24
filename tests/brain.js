'use strict';
/* CEREBRO: contrato (P0, cf-lideres): the brain's shared objects and clock. With BRAIN.on 0 none of it is made and a no-op hook on every layer
   changes nothing (the battle of before: the other brain packages read these objects only when they exist); with BRAIN.on 1 the same no-op
   hooks change nothing either (the clock itself moves no man and draws no random number), every squad of the AI has its board, its leader
   and two fire teams, every soldier his reflex, morale and task; an order, a report by voice and a word (fala, P5's) go where the contract
   says; and the brain's clock costs at most 0.1 ms a step. SECS: the match's length (default 40) */
const H = require('./harness'), ok = H.ok, SECS = +process.env.SECS || 40;
const print = (C, S) => {
  let sum = 0; for (const k of ['men', 'units', 'planes']) for (const o of S[k]) sum += o.x * 1.3 + o.z + (o.hp || 0);
  return [S.men.length, S.units.length, S.squads.length, sum.toFixed(6), S.cq.ps.map(v => v.toFixed(4)).join(','), C.$('Math').random().toFixed(12)].join(' ');
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
  const a = go(0, false, era), a2 = go(0, true, era), b = go(1, false, era), c = go(1, true, era);
  ok(a.p === a2.p && !a2.n.lid && !a2.n.eq && !a2.n.sold, era + ': BRAIN.on 0, with and without hooks, the same (' + a.p + '), and no hook ran');
  ok(b.p === c.p, era + ': BRAIN.on 1, with and without a no-op hook on every layer, the same (' + b.p + ')');
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
  ok(!$('fala')(L, 'contato', { p: 3 }), 'no word without a decision of his own (P5)');
  $('flCb')(L, 'contato', {}); const said = $('fala')(L, 'contato', { p: 3 });
  ok(!!said && $('ANA').ev.some(e => e.k === 'cb' && e.st === 'fala' && e.f === 'contato'), 'after one, the word is said (' + said + ') and is a brain event for the analytics');
  ok($('ANA').ev.some(e => e.k === 'cb' && e.st === 'ord' && e.o === 'manter'), 'the order given is a brain event too');
}
H.done();
