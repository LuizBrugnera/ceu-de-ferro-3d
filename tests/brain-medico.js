'use strict';
/* CEREBRO: medico (cf-medico; NÃO TESTADO: written with the change and never run, see docs/nao-testado/cf-medico.md). Short exercises with no
   screen, as a measurement more than a gate:
   (a) a man of a squad with its medic goes down 20 m from him: the medic gets there and treats him; the seconds from the fall to him up
       (or stabilized) are printed, and must be under 30;
   (b) honesty (P7): a medic of another squad 100 m off, who neither saw him nor heard him (out of the voice's reach, behind his back), does
       not come; within the voice's reach, after the man's "Médico!", he does;
   (c) the laws of war (W14): an AI rifleman of a regular side with an enemy medic and an enemy rifleman in sight, at the same distance,
       takes the rifleman.
   N seeds (default 6) */
const H = require('./harness'), ok = H.ok, N = +process.env.N || 6;
const box = (seed, era) => {
  const C = H.load({ seed }), $ = C.$, S = C.sandbox(era || 'ww2'), r = S.T.routes[0], mid = r.len / 2;
  S.cmd = [$('cmdOf')(0), $('cmdOf')(1)];
  const at = (s, off) => { const p = $('routeAt')(r, s); return { x: p.x - p.dz * (off || 0), z: p.z + p.dx * (off || 0), s }; };
  const squad = (t, s, off, kits, O) => { const p = at(s, off); const q = C.dispatch(t, { kind: 'defend', why: 'teste' }, () => C.addSquad(t, p.x, p.z, 0, s, kits)); C.setOrd(q, Object.assign({ k: 'hold', ri: 0, s, x: p.x, z: p.z, R: 8 }, O)); return q; };
  $('WND').p = 1;   // every hit that would kill puts the man down instead
  return { C, $, S, mid, at, squad };
};
const down = ($, m) => $('manDown')(m, 10, null);

console.log('-- (a) the squad\'s medic treats a man down 20 m off --');
{
  const ts = []; let n = 0, done = 0;
  for (let k = 0; k < N; k++) {
    const { C, $, S, mid, squad } = box(500 + k, k & 1 ? 'modern' : 'ww2');
    const q = squad(0, mid, 30), med = q.men.find(m => m.def.med);
    if (!ok(!!med, 'the squad has its medic (' + q.men.map(m => m.id).join(' ') + ')')) continue;
    C.run(1);
    const d = q.men.find(m => m !== med && !m.def.med && m.ai.i > 0);
    d.x = med.x + 20; d.z = med.z; d.y = C.hgt(d.x, d.z); d.hitT = S.t - 5;
    n++; if (!down($, d)) { ok(false, 'manDown refused'); continue; }
    const t0 = S.t; let t1 = -1;
    C.run(40, () => { if (!d.dead && (!d.down || d.stab)) { t1 = S.t - t0; return false; } });
    if (t1 >= 0) { done++; ts.push(t1.toFixed(1)); } else ts.push(d.dead ? 'morreu' : '—');
  }
  ok(done === n, 'treated (up or stabilized) by the medic: ' + done + '/' + n + ' (s: ' + ts.join(' ') + ')');
  ok(ts.every(t => +t < 30), 'each in under 30 s');
}

console.log('-- (b) honesty: another squad\'s medic only for a man he saw or heard --');
{
  let quiet = 0, came = 0, n = 0;
  for (let k = 0; k < N; k++) {
    for (const near of [false, true]) {
      const { C, $, S, mid, squad } = box(600 + k, 'ww2');
      const q = squad(0, mid, 30, [0, 0, 1]), q2 = squad(0, mid + (near ? 30 : 100), 30), med = q2.men.find(m => m.def.med);
      for (const o of q.men) o.inv = 1e9;
      C.run(1);
      const d = q.men[2]; for (const o of q.men) if (o !== d) { o.dead = o.gone = true; }   // nobody of his own to fetch him
      for (const o of q2.men) if (o !== med) { o.dead = o.gone = true; }
      med.h = Math.atan2(-(med.z - d.z), med.x - d.x) + Math.PI;   // his back to him
      d.hitT = S.t - 5; down($, d);
      let went = false;
      C.run(6, () => { if (med.ai.rsc === d) went = true; });
      n++; if (near ? went : !went) near ? came++ : quiet++;
    }
  }
  ok(quiet === n / 2, 'out of the voice and of sight: he does not come in ' + quiet + '/' + n / 2);
  ok(came === n / 2, 'within the voice after "Médico!": he comes in ' + came + '/' + n / 2);
}

console.log('-- (c) the red cross --');
{
  let reg = 0, nr = 0;
  for (let k = 0; k < N; k++) {
    const { C, $, S, mid, squad } = box(700 + k, 'modern');
    const a = squad(0, mid, 30, [0]), e = squad(1, mid + 200, 30, [0, $('sanIdx')(1)]), m = a.men[0], [rif, med] = e.men;
    for (const o of e.men) { o.inv = 1e9; o.mis && (o.mis.roe = 'hold'); }
    rif.x = med.x + 3; rif.z = med.z; rif.y = C.hgt(rif.x, rif.z);
    for (const t of [rif, med]) { const x = $('meter')(m, t); Object.assign(x, { kn: true, t: S.t, kt: S.t - 5, rt: .3, v: 1.2, rc: 1, ic: 1, ex: 0, ez: 0 }); }
    C.run(2, () => { for (const o of e.men) o.ctl.fire = false; });
    nr++; if (m.ai.tgt !== med) reg++;
  }
  ok(reg === nr, 'a regular soldier does not take the medic as his target: ' + reg + '/' + nr);
}
H.done();
