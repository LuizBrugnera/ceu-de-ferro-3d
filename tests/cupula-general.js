'use strict';
/* The captain's bug (cf-cupula-general): the AI generals never built the anti-rocket dome. A modern AI × AI match (two sides, map v8, the
   economy on): each side's general must order a dome within ASK minutes (default 12), by its fortification plan, with the money saved
   for it, and at least one side's builders must begin theirs within MIN minutes (default 20; the match stops once both have; seed 3's
   side 1 sends its reserve from 1.9 km, in contact, and it may not be there yet: printed, not asserted). Before the fix the dome waited
   for 400 + 120 metal in stock, which the AI economy never kept, and nothing ever saved for it: no side asked for one, nothing was
   ordered, nothing logged. SEED picks the match (default 3) */
const H = require('./harness'), ok = H.ok, ASK = +process.env.ASK || 12, MIN = +process.env.MIN || 20, SEED = +process.env.SEED || 3;
const C = H.load({ seed: SEED, mapv: 8, eco: true }), $ = C.$, S = C.watch('modern', {});
const said = [[], []], ord = [null, null], first = [null, null];
C.__said = (t, s) => { if (t === 0 || t === 1) { said[t].push(Math.round(S.t) + ' s: ' + s); if (ord[t] === null && /: ordenado/.test(s)) ord[t] = Math.round(S.t); } };
$("afpSay = (g => (C, A, it, ok, s) => { g(C, A, it, ok, s); if (it.k === 'dome') __said(C.t, it.nm + ': ' + s); })(afpSay)");   // the plan's words on the dome (the general's log keeps only its last lines)
C.run(MIN * 60, () => {
  for (const t of [0, 1]) if (!first[t]) { const f = S.forts.find(f => f.k === 6 && f.team === t); if (f) first[t] = { t: Math.round(S.t), f }; }
  return first[0] && first[1] ? false : undefined;
}, 0.1);
for (const t of [0, 1]) {
  const nm = 'side ' + t + ' (' + S.E.sides[S.fac[t]].name + ')', o = first[t];
  ok(ord[t] !== null && ord[t] <= ASK * 60, nm + ': its general ordered a dome within ' + ASK + ' min' + (ord[t] !== null ? ', at ' + ord[t] + ' s' : ''));
  console.log('   ' + nm + ': ' + (o ? 'its builders began it at ' + o.t + ' s' : 'not begun yet at ' + Math.round(S.t) + ' s'));
  for (const s of said[t]) console.log('   ' + s);
  console.log('   ' + $('bmrLine')(t).replace(/^.*· cúpulas/, 'cúpulas'));
}
ok(first.some(Boolean), 'a dome begun within ' + MIN + ' min (side ' + first.map((o, t) => (o ? t + ' at ' + o.t + ' s' : '')).filter(Boolean).join(', side ') + ')');
ok(!H.nan(S), 'no NaN');
H.done();
