'use strict';
/* CEREBRO: pelotao (P8, cf-p8-pelotao): the platoon, a short headless exercise on the sandbox (P8's "pronto quando" of cf-cerebro-pesquisa).
   An assault on a village held by an enemy squad, fix and flank (PR p1) by two squads, set up by hand at H-hour (the sandbox has no general):
   - the platoon forms with a leader who is a soldier;
   - at H-hour the manoeuvre does not go: it holds until its leader hears the base firing, and then goes (or the timeout, said and logged);
   - the brain event of the assault carries the flank angle at the objective;
   - the platoon's leader killed: a vacancy, a new leader within PEL.cap s who says so, a line in the diary;
   - the unit card shows the platoon. Not exercised here: the timeout, the apoio method, the defence with a reserve (docs/nao-testado/cf-p8-pelotao.md). SEED as usual */
const H = require('./harness'), ok = H.ok;
const C = H.load({ seed: +process.env.SEED || 9 }), $ = C.$, S = C.sandbox('ww2'), r = S.T.routes[0], s0 = r.len / 2, at = s => $('routeAt')(r, s);
const o = at(s0 + 320), O = { x: o.x, z: o.z, s: s0 + 320 };
const foe = C.addSquad(1, O.x, O.z, 0, O.s); C.setOrd(foe, { k: 'hold', ri: 0, s: O.s, x: O.x, z: O.z, R: 8 });
const b = at(s0 + 40), qB = C.addSquad(0, b.x, b.z, 0, s0 + 40);
const fx = O.x - o.dz * 220, fz = O.z + o.dx * 220, qM = C.addSquad(0, fx, fz, 0, O.s);
const op = { k: 'atk', pr: 'p1', st: 'go', O, ri: 0, fs: s0 + 40, fp: [{ x: b.x, z: b.z }], sq: [qB, qM], T: S.t, n0: qB.live + qM.live, over: false, ap: [], best: 1e9, bT: S.t };
Object.assign(qB, { op, apr: 'fix', fp: { x: b.x, z: b.z } }); Object.assign(qM, { op, apr: 'man', fp: { x: fx, z: fz } });
C.setOrd(qB, { k: 'overwatch', ri: 0, s: s0 + 40, x: b.x, z: b.z, R: 12, ax: O.x, az: O.z, op });
C.setOrd(qM, { k: 'assault', ri: 0, s: O.s, x: O.x, z: O.z, R: 12, rush: 1, ax: O.x, az: O.z, op });
C.run(2);
const P = op.pel; ok(!!P && !!P.lid, 'the platoon formed (' + (P ? P.met + ', leader ' + $('pelQuem')(P, P.lid) : '—') + ')');
$('pelH')(null, op);
ok(P.passo === 'espera' && qM.ord.k === 'hold', 'at H-hour the manoeuvre holds for the base (' + P.passo + ', order ' + qM.ord.k + ')');
let go = null, early = false;
for (let i = 0; i < 60 * 70 && !go; i++) {
  C.step(1 / 60);
  if (P.passo === 'espera' && qM.ord.k === 'assault') early = true;
  if (P.passo !== 'espera') go = { t: S.t - P.H, passo: P.passo, fire: qB.men.some(m => !m.dead && S.t - (m.shotT || -99) < $('PEL').fogo.sync + 1) };
}
ok(!early, 'the assault never went while the platoon waited');
ok(!!go, 'the assault went ' + (go ? '+' + go.t.toFixed(1) + ' s after H-hour, ' + go.passo + ', base firing: ' + go.fire : 'never'));
if (go) ok(go.passo === 'semApoio' || go.fire, 'it went with the base firing, or by the timeout said as such');
const ev = (S.cbN || {})['pel-assalto'] || 0; ok(ev >= 1, 'the brain event pel-assalto (' + ev + ')');
const c = $('genCard')(0, qM.id); ok(!!c && !!c.pel && c.decide.some(s => /^Pelotão /.test(s)), 'the unit card: ' + (c && c.decide ? c.decide.slice(0, 2).join(' | ') : '—'));
const L = P.lid; if (L) {
  C.killMan(L, null); const t0 = S.t; let vac = false, tN = null;
  for (let i = 0; i < 60 * 12 && tN === null; i++) { C.step(1 / 60); if (!P.lid) vac = true; else if (P.lid !== L) tN = S.t - t0; }
  ok(vac && tN !== null && tN <= $('PEL').cap + 1.1, 'the leader killed: a vacancy, then ' + (P.lid ? $('pelQuem')(P, P.lid) : 'nobody') + ' takes the platoon ' + (tN === null ? 'never' : '+' + tN.toFixed(1) + ' s'));
  ok((S.glog && S.glog.l[0] || []).some(e => /assume o pelotão/.test(e.s)), 'the diary has it');
}
H.done && H.done();
