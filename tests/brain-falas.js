'use strict';
/* The soldiers' speech (CEREBRO: falas, P5 of cf-cerebro-pesquisa), the exercises of its "pronto quando", without a screen:
   (1) every line comes from a decision (a cb event) of the same soldier within the same second; (2) a squad in contact says 2 to 6 lines a
   minute and repeats none within 10 s (a reflex aside); (3) "Granada!" called by one who saw the grenade gets a mate who did not see it away.
   SECS (default 120) is the length of the contact exercise */
const H = require('./harness'), ok = H.ok, SECS = process.env.SECS === undefined ? 120 : +process.env.SECS;
const box = (seed, era) => {
  const C = H.load({ seed: seed || 3 }), $ = C.$, S = C.sandbox(era || 'ww2'), r = S.T.routes[0], mid = r.len / 2;
  S.cmd = [$('cmdOf')(0), $('cmdOf')(1)];
  const at = (s, off) => { const p = $('routeAt')(r, s); return { x: p.x - p.dz * (off || 0), z: p.z + p.dx * (off || 0), s }; };
  const squad = (t, s, off, kits, O) => { const p = at(s, off); const q = C.dispatch(t, { kind: 'defend', why: 'teste' }, () => C.addSquad(t, p.x, p.z, 0, s, kits)); C.setOrd(q, Object.assign({ k: 'hold', ri: 0, s, x: p.x, z: p.z, R: 8 }, O)); return q; };
  return { C, $, S, r, mid, at, squad };
};

console.log('-- words: the fire command in the manual\'s form --');
{
  const { $ } = box(1);
  ok($('flNum(300)') === 'trezentos' && $('flNum(150)') === 'cento e cinquenta' && $('flNum(1200)') === 'mil e duzentos' && $('flDist(312)') === 'trezentos', 'distances in words (300 ' + $('flNum(300)') + ', 150 ' + $('flNum(150)') + ', 1200 ' + $('flNum(1200)') + ')');
  const t = $('FALAS').tiro.v[0]({ H: 'Duas horas', D: 'trezentos', W: 'metralhadora na janela' });
  ok(t === 'Contato! Duas horas, trezentos, metralhadora na janela! Fogo!', 'fire command: ' + t);
}

console.log('-- two squads in contact for ' + SECS + ' s: origin, rate, repetition --');
for (const era of ['ww2', 'modern']) {
  const { C, $, S, mid, squad } = box(7, era), F = $('FALA');
  F.logN = 1e6;
  const a = squad(0, mid, 0), b = squad(1, mid + 220, 0);
  C.run(SECS);
  const L = F.log, lines = L.filter(e => e.st === 'fala');
  const orphan = lines.filter(f => !L.some(e => e.st !== 'fala' && e.m === f.m && e.t <= f.t && f.t - e.t <= 1));
  ok(lines.length > 0 && orphan.length === 0, era + ': ' + lines.length + ' lines, each from a decision of the same soldier within 1 s (' + orphan.length + ' without)' + (orphan.length ? ' ' + JSON.stringify(orphan.slice(0, 3)) : ''));
  const sq = new Map(); for (const q of [a, b]) for (const m of q.men) if (m.flI) sq.set(m.flI, q);
  for (const q of [a, b]) {
    const my = lines.filter(f => sq.get(f.m) === q), Q = q.fala, cont = Q ? Q.cont : -99;
    const first = L.find(e => sq.get(e.m) === q && e.st !== 'fala'), span = Math.max(1, (Math.min(S.t, cont + 30) - (first ? first.t : S.t)) / 60);
    const pm = my.length / span, FL = $('FALAS');
    let rep = 0; my.forEach((f, i) => { if (FL[f.f].p < 3 && my.slice(0, i).some(g => g.x === f.x && f.t - g.t < 10)) rep++; });
    ok(pm >= 2 && pm <= 6.5 && rep === 0, era + ' side ' + q.team + ': ' + my.length + ' lines in ' + span.toFixed(1) + ' min of contact (' + pm.toFixed(1) + '/min), ' + rep + ' repeated within 10 s');
    console.log('     ' + my.slice(0, 8).map(f => f.t.toFixed(1) + ' ' + f.x).join(' | '));
  }
  console.log('     stats ' + JSON.stringify(F.st));
}

console.log('-- "Granada!": a mate who did not see it gets away --');
for (const call of [1, 0]) {
  const { C, $, S, mid, squad } = box(5);
  const q = squad(0, mid, 0), e = squad(1, mid + 200, 0), A = q.men[0], B = q.men[1], T = e.men[0];
  for (const m of q.men.slice(2)) { m.dead = m.gone = true; }
  for (const m of e.men.slice(1)) { m.dead = m.gone = true; }
  if (!call) { A.dead = A.gone = true; }
  C.run(3);
  const put = (m, x, z, h) => { m.x = x; m.z = z; m.y = $('manY')(x, z); m.h = h; m.f = { x: Math.cos(h), y: 0, z: -Math.sin(h) }; m.ln = null; if (m.ai) m.ai.tgt = null; };
  const G = { x: B.x + 10, z: B.z };
  put(B, B.x, B.z, Math.PI);                 // 10 m from where it lands, his back to it
  if (call) put(A, G.x - 2.5, G.z, 0);       // 2.5 m from it, facing it
  const g = $('lobbed')(T, 'nade', $('MAN').nade, G.x, C.hgt(G.x, G.z) + .4, G.z, 0, 0, 0); g.fz = S.t + $('GRN').fuse;   // dropped where it is to land: no roll
  let land = -1, go = -1, gd = 0;
  C.run(3.5, () => { if (land < 0 && g.flP) land = S.t; if (B.rf && B.rf.go && go < 0) { go = S.t; gd = Math.hypot(B.ai.gx - G.x, B.ai.gz - G.z); } });
  const said = $('FALA').log.filter(f => f.st === 'fala' && f.f === 'granada').map(f => f.x);
  if (call) ok(land > 0 && B.rf && B.rf.ouviu && go > 0 && gd > 12, 'called (' + said.join(' ') + '): B, his back to it, heard it and left ' + (go - land).toFixed(2) + ' s after it landed, for a place ' + gd.toFixed(1) + ' m from it');
  else ok(land > 0 && !(B.rf && B.rf.ouviu) && go < 0 && !said.length, 'nobody saw it, nobody called: B does not react');
}
H.done();
