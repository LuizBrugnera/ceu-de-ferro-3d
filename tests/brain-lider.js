'use strict';
/* CEREBRO: lider (P3, cf-lideres): the squad's leader, headless exercises on the sandbox (P3's "pronto quando" of cf-cerebro-pesquisa, short).
   - an ambush from the left at 150 m by a smaller squad: the squad reacts (the method reagir), its men call the contact with its direction
     and distance within 5 s, and within 30 s one team fires while the other bounds, the bound starting only with the base firing;
   - the leader killed in contact: a vacancy, a new leader within 4 s who says so, a line in the diary, the squad on its mission; with
     LDR.on 0 the first man up takes over at once, as before;
   - the leader knows what he sees and what is reported: a contact off the board and out of his sight leaves the squad's beliefs, and a
     man's report by voice brings it back after the voice's delay;
   - armour with infantry and an anti-tank man (modern): the anti-tank man's team goes with him, the other fixes the infantry, and it is said;
   - the unit card says who leads and what he decided.
   Information (not enforced: P1's soldier): men in cover and firing within 2 s. SEED, ERA as usual */
const H = require('./harness'), ok = H.ok;
const info = (c, msg) => console.log('  ' + (c ? 'info ' : 'falta') + ' ' + msg);

/* a sandbox with squad q0 of side 0 on the middle road; o.foe(C, $, S, r, s0, a) puts the enemy */
function field(era, seed, o) {
  const C = H.load({ seed }), $ = C.$, S = C.sandbox(era), r = S.T.routes[0], s0 = r.len / 2, a = $('routeAt')(r, s0);
  const q0 = C.addSquad(0, a.x, a.z, 0, s0);
  C.setOrd(q0, Object.assign({ k: 'hold', ri: 0, s: s0, x: a.x, z: a.z, R: 8 }, o.o0 && o.o0(r, s0, a, $)));
  const foe = o.foe ? o.foe(C, $, S, r, s0, a) : null;
  return { C, $, S, q0, foe, a };
}
const fl = (F, f) => F.$('FALA').log.filter(e => e.st === 'fala' && f(e));

console.log('-- ww2: emboscada pela esquerda a 150 m, por uma esquadra menor --');
{
  const F = field('ww2', +process.env.SEED || 5, {
    o0: (r, s0, a, $) => { const b = $('routeAt')(r, s0 + 300); return { k: 'move', s: s0 + 300, x: b.x, z: b.z, R: 12 }; },
    foe: (C, $, S, r, s0, a) => {
      const p = $('routeAt')(r, s0 + 40), x = p.x - p.dz * 150, z = p.z + p.dx * 150, q = C.addSquad(1, x, z, 0, s0 + 40, [0, 0, 1]);
      C.setOrd(q, { k: 'hold', ri: 0, s: s0 + 40, x, z, R: 6 }); return q;
    } });
  const { S, q0 } = F, $ = F.$; let T0 = null, firstFix = null, lance = [], allCov = null;
  for (let i = 0; i < 60 * 60 && S.t < 75; i++) {
    F.C.step(1 / 60);
    const men = q0.men.filter(m => !m.dead && !m.down);
    if (T0 === null && men.some(m => m.pm && [...m.pm].some(([t, e]) => e.kn && t.team === 1) || S.t - m.hitT < .1)) T0 = S.t;
    if (T0 !== null && allCov === null && men.length && men.every(m => (m.cbin || m.fc || $('cover')(m).p >= .3) && S.t - (m.shotT || -99) < 3)) allCov = S.t - T0;
    const P = q0.bb && q0.bb.plano;
    if (P && P.proc === 'reagir' && P.passo === 'flanco' && P.eq[1] === 'lance' && !lance.length) {
      const A = q0.eq[0].men.filter(m => !m.dead && !m.down);
      lance.push({ t: S.t, baseFiring: A.some(m => S.t - (m.shotT || -99) < $('LDR').fix.sync + .1) });
    }
    if (P && P.proc === 'reagir' && firstFix === null && P.passo !== 'abrigo') firstFix = { t: S.t, passo: P.passo, why: P.why };
  }
  ok(T0 !== null, 'contact at ' + (T0 === null ? '—' : T0.toFixed(1)) + ' s');
  const r = $('drCount')().all[0].reagir || 0;
  ok(r >= 1, 'the squad took the method reagir (' + r + ' times)');
  const call = T0 !== null && fl(F, e => e.s === 0 && (e.f === 'tiro' || e.f === 'contato') && /hora/.test(e.x || '') && e.t - T0 <= 5)[0];
  ok(!!call, 'a contact called with its direction and distance within 5 s' + (call ? ': "' + call.x + '" at +' + (call.t - T0).toFixed(1) + ' s' : ''));
  ok(!!firstFix, 'the leader decided after cover: ' + (firstFix ? firstFix.passo + ' (' + firstFix.why + ') at +' + (firstFix.t - T0).toFixed(1) + ' s' : '—'));
  if (firstFix && firstFix.passo === 'flanco') ok(lance.length && lance[0].t - T0 <= 30 && lance[0].baseFiring, 'team B bounded ' + (lance.length ? '+' + (lance[0].t - T0).toFixed(1) + ' s after contact, with team A firing: ' + lance[0].baseFiring : 'never'));
  else info(false, 'no flank in this run (the leader chose ' + (firstFix && firstFix.passo) + '): the bound with the base firing is not exercised');
  info(allCov !== null && allCov <= 2, 'all men in cover and firing ' + (allCov === null ? 'never' : '+' + allCov.toFixed(1) + ' s') + ' (P1)');
  const c = $('genCard')(0, q0.id);
  ok(c && c.lid && /^Sgt\. /.test(c.lid.nm) && /^Líder: Sgt\. /.test(c.decide[0]) && c.decide.some(s => /^Equipes: A /.test(s)), 'the unit card: ' + (c ? c.decide.slice(0, 3).join(' | ') : '—'));
}

console.log('-- ww2: o líder cai no meio do contato --');
for (const on of [1, 0]) {
  const F = field('ww2', 41, { foe: (C, $, S, r, s0) => { const b = $('routeAt')(r, s0 + 220), q = C.addSquad(1, b.x, b.z, 0, s0 + 220); C.setOrd(q, { k: 'hold', ri: 0, s: s0 + 220, x: b.x, z: b.z, R: 8 }); return q; } });
  const { S, q0 } = F, $ = F.$; $('LDR').on = on; F.C.run(12);
  const L = q0.lid, ord = q0.ord && q0.ord.k; F.C.killMan(L, null); const t0 = S.t; let vac = false, tN = null;
  for (let i = 0; i < 60 * 8 && tN === null; i++) { F.C.step(1 / 60); if (!q0.lid) vac = true; else if (q0.lid !== L) tN = S.t - t0; }
  if (on) {
    ok(vac && tN !== null && tN <= 4, 'a vacancy, then ' + (q0.lid ? $('lidQuem')(q0.lid) : 'nobody') + ' leads, ' + (tN === null ? 'never' : tN.toFixed(1) + ' s') + ' after (at most 4)');
    F.C.run(1);
    ok(fl(F, e => e.s === 0 && e.f === 'assumo').length >= 1 || $('FALA').log.some(e => e.f === 'assumo'), 'he says he takes over');
    ok((S.glog && S.glog.l[0] || []).some(e => /assume o comando/.test(e.s)), 'the diary has it');
    F.C.run(2);
    if (q0.live >= q0.n0 / 2) ok(q0.state !== 1 && q0.ord && q0.ord.k === ord && q0.lid && !q0.lid.dead, 'the squad goes on with its order (' + (q0.ord && q0.ord.k) + ' of ' + ord + ') 2 s after, not broken (live ' + q0.live + ', state ' + q0.state + ', leader ' + (q0.lid ? $('lidQuem')(q0.lid) : 'none') + ')');
    else info(false, 'the squad lost half its men in the fight (' + q0.live + ' of ' + q0.n0 + '): the mission after the succession is not exercised');
  } else ok(!vac && tN !== null && tN < .1, 'LDR.on 0: the first man up leads at once, as before (' + (tN === null ? '—' : tN.toFixed(2) + ' s') + ')');
}

console.log('-- ww2: o líder sabe o que vê e o que lhe relatam --');
{
  const F = field('ww2', 7, { foe: (C, $, S, r, s0) => { const b = $('routeAt')(r, s0 + 200), q = C.addSquad(1, b.x, b.z, 0, s0 + 200); C.setOrd(q, { k: 'hold', ri: 0, s: s0 + 200, x: b.x, z: b.z, R: 8 }); return q; } });
  const { S, q0 } = F, $ = F.$; F.C.run(10);
  const t = q0.bel && [...q0.bel.keys()].find(o => o.man && !o.dead);
  ok(!!t, 'the squad believes in a contact after 10 s (' + (q0.bel ? q0.bel.size : 0) + ')');
  if (t) {
    const L = q0.lid, id = $('flId')(t), m = q0.men.find(n => n !== L && !n.dead && !n.down && n.pm && n.pm.get(t) && n.pm.get(t).kn);
    const keep = L.pm.get(t); L.pm.delete(t); q0.bb.cont.delete(id); $('belief')(q0);
    ok(!q0.bel.has(t), 'off the board and out of the leader\'s sight, it leaves the squad\'s beliefs');
    if (m) {
      m.lidR = null; m.x = L.x + 8; m.z = L.z; const e = m.pm.get(t); e.t = S.t;
      $('lidReport')(q0, m);
      ok(!q0.bb.cont.has(id) && q0.bb.inq.length > 0, 'a man who sees it reports it by voice: on its way');
      for (let i = 0; i < 50; i++) { $('brainTick')(1 / 60); S.t += 1 / 60; }
      $('belief')(q0); ok(q0.bb.cont.has(id) && q0.bel.has(t), 'after the voice\'s delay it is on the board and believed again');
    } else info(false, 'no other man had it in sight: the report is not exercised');
    if (keep) L.pm.set(t, keep);
  }
}

console.log('-- modern: blindado com infantaria, esquadra com anticarro --');
{
  const F = field('modern', 13, { foe: (C, $, S, r, s0) => {
    const b = $('routeAt')(r, s0 + 300), u = C.addUnit('tank', 1, b.x, b.z, S.E.sides[S.fac[1]].tanks[0], false, 0, s0 + 300); u.ai && (u.ai.hold = 1);
    const q = C.addSquad(1, b.x - b.dz * 25, b.z + b.dx * 25, 0, s0 + 300, [0, 0]); C.setOrd(q, { k: 'hold', ri: 0, s: s0 + 300, x: b.x - b.dz * 25, z: b.z + b.dx * 25, R: 6 }); return { u, q };
  } });
  const { S, q0 } = F, $ = F.$; let seen = null;
  for (let i = 0; i < 60 * 40 && !seen; i++) { F.C.step(1 / 60); const P = q0.bb && q0.bb.plano; if (P && P.proc === 'anticarro' && P.at >= 0) seen = { eq: P.eq.slice(), t: S.t }; }
  const at = q0.men.find(m => m.arms[1] && (m.arms[1].d.k === 'heat' || m.arms[1].d.k === 'atgm'));
  if (seen) {
    const k = at.ai.i & 1;
    ok(seen.eq[k] === 'escolta' && seen.eq[1 - k] === 'prende', 'the anti-tank man\'s team goes with him, the other fixes the infantry (' + seen.eq.join(', ') + ')');
    ok($('FALA').log.some(e => e.f === 'anticarro-flanco'), 'the leader says it');
  } else info(false, 'the drill anticarro was not taken in 40 s (drills taken: ' + JSON.stringify($('drCount')().all[0]) + ')');
}
H.done();
