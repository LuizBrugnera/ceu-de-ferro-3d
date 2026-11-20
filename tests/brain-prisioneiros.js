'use strict';
/* CEREBRO: prisioneiros (P4), the exercise of its "ready when" (report cf-cerebro-pesquisa, 3.2): a surrounded squad in panic surrenders, and
   (1) there are prisoners; (2) an escort of the captors searches them and walks them to the rear (the 5 S); (3) the questioning gives the
   captor's general an information event whose positions were true when the prisoner was taken (within PRIS.err m) and (4) never a position
   the prisoner did not know (a squad of his side 700 m off, out of his sight, is never in it); (5) the general's picture has them (C.known).
   NOT RUN as part of the delivery of cf-p4-prisioneiros (the captain's rule: implement, document what was not tested); see
   docs/nao-testado/cf-p4-prisioneiros.md. N seeds (default 4); nice node tests/brain-prisioneiros.js */
const H = require('./harness'), ok = H.ok, N = +process.env.N || 4;
const box = (seed, era) => {
  const C = H.load({ seed }), $ = C.$, S = C.sandbox(era || 'ww2'), r = S.T.routes[0], mid = r.len / 2;
  S.cmd = [$('cmdOf')(0), $('cmdOf')(1)];
  const at = (s, off) => { const p = $('routeAt')(r, s); return { x: p.x - p.dz * (off || 0), z: p.z + p.dx * (off || 0), s }; };
  const squad = (t, s, off) => { const p = at(s, off); const q = C.dispatch(t, { kind: 'defend', why: 'teste' }, () => C.addSquad(t, p.x, p.z, 0, s)); C.setOrd(q, { k: 'hold', ri: 0, s, x: p.x, z: p.z, R: 8 }); return q; };
  const know = (a, t, g) => { const e = $('meter')(a, t); Object.assign(e, { kn: true, t: S.t, kt: S.t - 5, rt: .3, v: 1.2, rc: g >= 2 ? 1 : 0, ic: g >= 3 ? 1 : 0, ex: 0, ez: 0, told: false }); return e; };
  return { C, $, S, mid, squad, know };
};
let seeds = 0, pris = 0, esc = 0, walked = 0, info = 0, trueAt = 0, items = 0, never = 0, known = 0;
for (let k = 0; k < N; k++) {
  const { C, $, S, mid, squad, know } = box(700 + k, k & 1 ? 'modern' : 'ww2'), P = $('PRIS');
  Object.assign(P, { hand: 12, trip: [1, 2], int: 2, rev: 1 });
  const q = squad(0, mid, 60), seen = squad(0, mid - 120, 60), far = squad(0, mid - 700, -200), foes = [];   // seen: a squad of his side in his sight (he tells it); far: out of it (never)
  for (const o of seen.men) o.inv = 1e9;
  for (let i = 0; i < 3; i++) { const e = squad(1, mid + 40 * (i - 1), 60 + (i === 1 ? 40 : -10)); for (const o of e.men) { o.inv = 1e9; foes.push(o); } }
  for (const m of q.men) { m.inv = 1e9; $('brMo')(m).m = .1; m.mo.s = .5; }
  const G = $('globalThis'); G.__cap = [];
  $('prisTaken = (g => (m, R) => { globalThis.__cap.push({ m, T: S.t, pos: new Map(S.men.concat(S.units).filter(o => o.team === m.team && !o.dead).map(o => [o, { x: o.x, z: o.z }])) }); return g(m, R); })(prisTaken)');
  const pin = new Map(foes.map(o => [o, { x: o.x, z: o.z }])); let sawEsc = false, sawLeva = false;
  C.run(90, () => {
    for (const o of foes) { if (o.ai && o.ai.esc) { sawEsc = true; continue; } const p = pin.get(o); o.x = p.x; o.z = p.z; o.ctl.fire = false; }
    for (const m of q.men) { if (!m.sur) { $('brMo')(m).m = Math.min(m.mo.m, .1); m.mo.s = Math.min(m.mo.s, .5); for (const o of foes) know(m, o, 2); } else if (m.sur.ph === 'leva' || m.sur.ph === 'ret') sawLeva = true; }
    const D = S.prisD; return !(D && D.info.length && S.t > 30);
  });
  seeds++;
  const D = S.prisD || { info: [] };
  if (q.men.some(m => m.sur && m.sur.st === 2) || G.__cap.length) pris++;
  if (sawEsc) esc++; if (sawLeva) walked++;
  if (D.info.length) info++;
  let allTrue = true;
  for (const I of D.info) {
    const cap = G.__cap.find(c => Math.abs(c.T - I.at) < 1e-6);
    for (const it of I.l) {
      items++;
      const p = cap && cap.pos.get(it.u);
      if (!p || Math.hypot(p.x - it.tx, p.z - it.tz) > .01 || Math.hypot(it.x - it.tx, it.z - it.tz) > P.err + .01) allTrue = false;
      if (far.men.includes(it.u)) never++;
    }
  }
  if (D.info.length && allTrue) trueAt++;
  $('cmdSense')(S.cmd[1], S.squads.filter(o => o.team === 1));
  if (D.info.some(I => I.l.some(it => !it.u.dead && S.cmd[1].known.includes(it.u)))) known++;
}
ok(pris === seeds, 'the surrounded squad gave prisoners: ' + pris + '/' + seeds);
ok(esc === seeds && walked === seeds, 'an escort took them and walked them to the rear: escort ' + esc + '/' + seeds + ', walking ' + walked + '/' + seeds);
ok(info === seeds, 'a questioning event reached the captor: ' + info + '/' + seeds);
ok(trueAt === info && items > 0, 'its positions were true at the capture (within PRIS.err): ' + trueAt + '/' + info + ' (' + items + ' positions)');
ok(never === 0, 'never a position he did not know (the squad 700 m off): ' + never);
ok(known === info, 'the captor general\'s picture has them: ' + known + '/' + info);
H.done();
