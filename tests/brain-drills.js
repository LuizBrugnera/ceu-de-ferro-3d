'use strict';
/* The brain's drills (P6 of cf-cerebro-pesquisa, section 4): short headless exercises on the sandbox, one squad against another, measured with
   the page's own meters (CEREBRO: medicao, S.medD). Two kinds of check:
   - ok: the instrument itself (it counts, it is deterministic, it changes nothing in the battle, the review and the cb event). Always enforced.
   - meta: the targets of section 4 that make each brain package "done" (P1 soldier, P3 leader...). Printed as information while the brain is
     not there; METAS=1 enforces them (a package that claims a target runs its drills with METAS=1).
   BRAIN=0|1 sets BRAIN.on for every drill (default: the page's). ERA=ww2|modern runs one era (default both). SECS scales the drills (default 1). */
const H = require('./harness'), ok = H.ok;
const METAS = process.env.METAS === '1', ERAS = process.env.ERA ? [process.env.ERA] : ['ww2', 'modern'], K = +process.env.SECS > 0 ? +process.env.SECS : 1;
const meta = (c, msg) => { if (METAS) return ok(c, 'meta: ' + msg); console.log('  ' + (c ? 'meta ' : 'falta') + ' ' + msg); return c; };
const between = (v, a, b) => v !== null && v !== undefined && v >= a && v <= b;
const fmt = v => (v === null || v === undefined ? '—' : v === Infinity ? '∞' : Math.round(v * 100) / 100);
const pc = v => (v === null || v === undefined ? '—' : Math.round(v * 100) + '%');

/* a game with the meters on, and two squads on the middle road: side 0 at s0, side 1 gap m up the road, each with its order */
function field(era, seed, o) {
  o = o || {};
  const C = H.load({ seed }), $ = C.$;
  if (process.env.BRAIN === '0' || process.env.BRAIN === '1') $('BRAIN').on = +process.env.BRAIN;
  if (o.med === 0) $('MED').on = 0;
  const S = C.sandbox(era); S.med = 1;
  const r = S.T.routes[0], s0 = r.len / 2, gap = o.gap || 220, a = $('routeAt')(r, s0), b = $('routeAt')(r, s0 + gap);
  const q0 = C.addSquad(0, a.x, a.z, 0, s0), q1 = C.addSquad(1, b.x, b.z, 0, s0 + gap);
  C.setOrd(q0, Object.assign({ k: 'hold', ri: 0, s: s0, x: a.x, z: a.z, R: 8 }, o.o0 && o.o0(b, s0 + gap)));
  C.setOrd(q1, { k: 'hold', ri: 0, s: s0 + gap, x: b.x, z: b.z, R: 8 });
  return { C, $, S, q0, q1, a, b };
}
const sum = (F, s) => F.$('medSum')(F.S.medD && F.S.medD[s] ? F.S.medD[s] : F.$('medNew')(), {}, 1);
const finite = M => Object.values(M).every(v => v === null || v === Infinity || Number.isFinite(v));
const show = (F, s) => F.$('medRows')(sum(F, s)).slice(0, 13).map(r => '      ' + r[0] + ': ' + r[1]).join('\n');

for (const era of ERAS) {
  console.log('-- ' + era + ': contato em campo aberto, esquadra contra esquadra a 220 m (' + Math.round(90 * K) + ' s) --');
  { const F = field(era, 11); F.C.run(90 * K);
    const D = F.S.medD || [], M = [sum(F, 0), sum(F, 1)];
    ok(D[0] && D[1] && D[0].ct > 0 && D[1].ct > 0, 'os dois lados entraram em contato: ' + fmt(D[0] && D[0].ct) + ' e ' + fmt(D[1] && D[1].ct) + ' soldado-s');
    ok(M[0].inc + M[1].inc > 0 && M[0].rx + M[1].rx > 0, 'tiros recebidos (' + (M[0].inc + M[1].inc) + ') e reações ao 1º tiro (' + (M[0].rx + M[1].rx) + ') contados');
    ok(M.every(finite), 'todas as medidas são números (ou vazias)');
    console.log(show(F, 0));
    for (const s of [0, 1]) {
      meta(M[s].exSh !== null && M[s].exSh <= .5, 'lado ' + s + ': exposto ≤ 50% do tempo em contato (' + pc(M[s].exSh) + ')');
      meta(M[s].nwSh !== null && M[s].nwSh <= .02, 'lado ' + s + ': "bot no meio do nada" ~0 (' + pc(M[s].nwSh) + ')');
      meta(between(M[s].rxC, .3, 1.5) && between(M[s].rxF, 0, 2), 'lado ' + s + ': reação, abrigo em 0,3–1,5 s e fogo em ≤ 2 s (' + fmt(M[s].rxC) + ' s; ' + fmt(M[s].rxF) + ' s)');
      meta(M[s].nn !== null && M[s].nn >= 5, 'lado ' + s + ': vizinho mais perto em contato ≥ 5 m (' + fmt(M[s].nn) + ' m)');
      meta(M[s].incK !== null && M[s].incK <= .2, 'lado ' + s + ': tiros de ameaça conhecida e ignorada ≤ 20% (' + pc(M[s].incK) + ')');
    } }

  console.log('-- ' + era + ': assalto contra uma esquadra parada (' + Math.round(80 * K) + ' s) --');
  { const F = field(era, 23, { gap: 260, o0: (b, s) => ({ k: 'assault', s, x: b.x, z: b.z, R: 12 }) }); F.C.run(80 * K);
    const M = sum(F, 0);
    ok(M.ct > 0 && (F.S.medD[0].mv[0] > 0), 'o assalto se moveu em contato: ' + fmt(F.S.medD[0].mv[0]) + ' soldado-s');
    console.log(show(F, 0));
    meta(M.fm !== null && M.fm >= .7, 'fogo e movimento: ≥ 70% do movimento em contato com a outra equipe atirando (' + pc(M.fm) + ')');
    meta(between(M.bd, 3, 6), 'lances sob fogo: mediana de 3 a 6 s (' + fmt(M.bd) + ' s em ' + M.bdN + ')'); }

  console.log('-- ' + era + ': granada no meio da esquadra --');
  { const F = field(era, 31, { gap: 900 }), $ = F.$; F.C.run(4);
    const live = F.q0.men.filter(m => !m.dead), cx = live.reduce((a, m) => a + m.x, 0) / live.length, cz = live.reduce((a, m) => a + m.z, 0) / live.length;
    const e = F.C.addMan($('INF')[era][F.S.fac[1]][0], 1, cx + 30, cz, 0); e.ai = null; e.inv = 1e9;
    const b = $('lobbed')(e, 'nade', $('MAN').nade, cx, F.C.hgt(cx, cz) + .4, cz, 0, 0, 0); b.fz = F.S.t + $('GRN').fuse;
    F.C.run(8);
    const D = F.S.medD[0], M = sum(F, 0);
    ok(b.gone && D.gr[0] >= 1, 'a granada explodiu e ' + D.gr[0] + ' homens perto dela foram contados, ' + D.gr[1] + ' escaparam; explosões com baixa ' + M.bl + ', com 2 ou mais ' + M.bl2);
    meta(M.grOk !== null && M.grOk >= .7, 'granadas: ≥ 70% dos ameaçados escapam (' + pc(M.grOk) + ')'); }

  console.log('-- ' + era + ': o líder cai no meio do contato (' + Math.round(90 * K) + ' s) --');
  { const F = field(era, 41); F.C.run(15);
    const L = F.$('medLeader')(F.q0); F.C.killMan(L, null); F.C.run(Math.max(70, 75 * K));
    const D = F.S.medD[0], M = sum(F, 0);
    ok(D.ld[0] >= 1 && D.ld[4] >= 1, 'líder perdido contado (' + D.ld[0] + '), sucessões ' + D.ld[2] + ', missão conferida ' + MED60(F) + ' s depois em ' + D.ld[4] + ' esquadra(s)');
    meta(M.ldT !== null && M.ldT <= 4, 'sucessão em até 4 s (' + fmt(M.ldT) + ' s; 0 é a regra de hoje: o primeiro homem de pé assume na hora)');
    meta(M.ldGo !== null && M.ldGo >= .6, 'a esquadra segue a missão depois de perder o líder (' + pc(M.ldGo) + ')'); }

  console.log('-- ' + era + ': um ferido, socorrido --');
  { const F = field(era, 53, { gap: 900 }), W = F.$('WND'), p0 = W.p; F.C.run(3);
    const m = F.q0.men[2]; W.p = 1; F.C.damageMan(m, m.hp + 3, null, false, { k: 0, pt: 0 }); W.p = p0;
    F.C.run(60);
    const D = F.S.medD[0];
    ok(D.wd[0] === 1 && D.wd[1] + D.wd[2] === 1, 'caído contado (' + D.wd[0] + '): socorrido ' + D.wd[1] + ', morto caído ' + D.wd[2]); }
}

console.log('-- o instrumento --');
{ const era = ERAS[0], raw = F => JSON.stringify(F.S.medD), pos = F => F.S.men.map(m => [m.x, m.z, m.hp, m.dead ? 1 : 0].map(v => Math.round(v * 1000)).join(',')).join(';');
  const A = field(era, 11), B = field(era, 11), Z = field(era, 11, { med: 0 }); for (const F of [A, B, Z]) F.C.run(45);
  ok(raw(A) === raw(B), 'mesma semente, mesmos números (nenhum sorteio na medição)');
  ok(pos(A) === pos(Z) && !Z.S.medD, 'a medição não muda a batalha: as mesmas posições, vida e baixas com MED.on 0');
  const X = field(era, 11); X.$('BRAIN').on = X.$('BRAIN').on ? 0 : 1; X.C.run(45);
  console.log('  info BRAIN.on ' + X.$('BRAIN').on + ' contra ' + A.$('BRAIN').on + ' na mesma semente: ' + (raw(X) === raw(A) ? 'a mesma batalha (nenhum código lê BRAIN ainda)' : 'batalhas diferentes (o cérebro novo age)'));
  /* the review from events: a match header with brain, the meters of two sides, a brain event, and a side's view of an unfinished match */
  const C = H.load({ ana: true }), $ = C.$, D0 = $('medNew')(), D1 = $('medNew')();
  D0.ct = 600; D0.ex = 300; D0.nw = 6; D0.inc = [10, 5, 5]; D0.rc[5] = 3; D0.rf[12] = 3; D0.rxN = [3, 0]; D0.ld = [2, 4, 2, 1, 2]; D1.ct = 100;
  const cb = (s, D, t) => Object.assign({ k: 'cb', t, s, c: 'm' }, JSON.parse(JSON.stringify(D)));
  const ev = [{ k: 'hdr', v: 2, n: 2, t: 0, era, fac: ['A', 'B'], tk: [100, 100], tk0: 100, doc: ['', ''], brain: 0 }, cb(0, $('medNew')(), 60), cb(0, D0, 120), cb(1, D1, 120), { k: 'cb', t: 90, s: 1, c: 'rend' }];
  const R = C.anaReport(ev), B0 = R.brain && R.brain.side[0], R1 = C.anaReport(ev, 1);
  ok(R.brain && R.brain.on === 0 && B0 && B0.sum.exSh === .5 && Math.abs(B0.sum.rxC - .55) < 1e-9 && B0.sum.ldT === 2 && B0.sum.ldGo === .5 && R.brain.side[1].ev.rend === 1,
    'a revisão lê o último cb m de cada lado (exposto ' + pc(B0 && B0.sum.exSh) + ', abrigo em ' + fmt(B0 && B0.sum.rxC) + ' s, sucessão ' + fmt(B0 && B0.sum.ldT) + ' s) e conta os outros cb por tipo');
  ok(R1.brain && !R1.brain.side[0] && !!R1.brain.side[1], 'a visão de um lado numa partida em andamento esconde os números do outro');
  const old = C.anaReport(ev.filter(e => e.k !== 'cb').map(e => Object.assign({}, e, { brain: undefined })));
  ok(old.brain === null, 'uma partida de antes da medição não tem seção Cérebro');
  const T = H.load({ seed: 3, ana: true }); T.$('MED').ev = 5; const S = T.watch(era, { min: 2 }); T.run(12);   // the meters every 5 s instead of 60, for a short look
  const cbs = T.$('ANA').ev.filter(e => e.k === 'cb' && e.c === 'm'), hd = T.$('ANA').ev.find(e => e.k === 'hdr');
  ok(hd && (hd.brain === 0 || hd.brain === 1) && cbs.length >= 2 && cbs.every(e => e.s >= 0 && Array.isArray(e.inc)), 'numa partida IA × IA com a analytics: o cabeçalho leva brain (' + (hd && hd.brain) + ') e saem eventos cb m por lado (' + cbs.length + ' em ' + Math.round(S.t) + ' s)');
  T.$('medCb')('pris', 0, { n: 1 });
  ok(T.$('ANA').ev.some(e => e.k === 'cb' && e.c === 'pris' && e.s === 0 && e.n === 1), 'medCb: o evento de um pacote do cérebro entra na analytics'); }
function MED60(F) { return F.$('MED').lead; }
H.done();
