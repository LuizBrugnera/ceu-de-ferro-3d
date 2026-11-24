'use strict';
/* The Insurgents and the civilians (ICV, cf-insurgente-civis; NOT RUN YET: docs/nao-testado/cf-insurgente-civis.md). A short exercise with no
   screen: an AI × AI match of three sides on the current front (SECS s of it, default 600) and what it should show: the Insurgents recruit or
   gain at least MIN civilians, they get resources from it, the sympathy of a town rises after the regular sides kill its people, and nothing
   of ICV threw. Then a sandbox check of a civilian's death: counted to whoever killed it, and the Insurgents get resources for theirs.
   Not in tests/all.sh (it is slow: a three-sided match). Run: node tests/icv.js (SECS=300 MIN=3 for a shorter one) */
const H = require('./harness'), { ok, done } = H;
const SECS = +(process.env.SECS || 600), MIN = +(process.env.MIN || 4);

console.log('-- a match of three sides: the Insurgents recruit and the towns join them --');
{
  const c = H.load({ seed: 11, eco: 1, mapv: 9, ana: 1 }), $ = c.$;
  const S = c.watch('modern', { n: 3 }), ins = $('icvIns()');
  ok(ins >= 0, 'the match has a side of the Insurgents (' + ins + ')');
  let symUp = 0, regKill = 0;
  const seen = {};
  c.run(SECS, () => {
    const D = S.icv, C = S.civD; if (!D || !C) return;
    for (const bi in C.hits || {}) {
      const h = C.hits[bi], reg = h.reduce((a, n, s) => a + (s !== ins ? n | 0 : 0), 0);
      if (reg > (seen[bi] || 0)) { seen[bi] = reg; regKill++; if (D.mem[bi] > 0) symUp++; }
    }
  });
  const D = S.icv, st = D ? D.st[ins] : null, got = st ? st.rec + st.join : 0;
  console.log('   ' + JSON.stringify(st) + ' · sympathy ' + JSON.stringify(Object.fromEntries(Object.entries(D ? D.sym : {}).map(([k, v]) => [k, Math.round(v * 100)]))));
  ok(got >= MIN, 'the Insurgents recruited or were joined by ' + got + ' civilians in ' + SECS + ' s (want ' + MIN + ' or more)');
  ok(!st || st.en > 0 || got === 0, 'they got resources from it (+' + (st ? st.en : 0) + ' energy, +' + (st ? st.mt : 0) + ' metal)');
  ok(!regKill || symUp > 0, 'a town whose people a regular side killed remembers it in favour of the Insurgents (' + symUp + ' of ' + regKill + ')');
  ok(!S.grlE || !S.grlE.icv, 'nothing of ICV threw');
  const L = (S.glog && S.glog.l[ins] || []).filter(e => /Recrutamento|Adesão|Simpatia|Saque|Terror/.test(e.s));
  console.log('   log: ' + L.slice(-6).map(e => e.s).join(' | '));
}

console.log('-- the toll: the regular side pays, the Insurgents gain --');
{
  const c = H.load({ seed: 5, eco: 1, mapv: 9 }), $ = c.$;
  const S = c.watch('modern', { n: 3 }); c.run(3);
  const ins = $('icvIns()'), reg = ins === 0 ? 1 : 0, vs = S.civs.filter(o => !o.dead && !o.gone && o.g && o.g.b);
  if (vs.length >= 2 && S.eco && S.eco.d[ins]) {
    const n0 = $('civD')().n.slice(), en = S.eco.d[ins].en;
    $('civKill')(vs[0], { team: reg }); $('civKill')(vs[1], { team: ins });
    ok($('civD')().n[reg] === n0[reg] + 1 && $('civD')().n[ins] === n0[ins] + 1 && S.cq.tk === undefined, 'each death is counted to the side that did it, and there are no tickets');
    ok(S.eco.d[ins].en > en || S.eco.d[ins].en >= $('ECO').cap.en, 'and brings them energy (' + Math.round(en) + ' → ' + Math.round(S.eco.d[ins].en) + ')');
  } else ok(false, 'no civilians or economy to try the toll on');
}
done();
