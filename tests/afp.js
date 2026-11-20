'use strict';
/* The AI general's fortification plan (AFP, cf-general-constroi) and the caps it rests on: trenches and walls share one cap (fcap) and each post kind
   has its own (postcap), so the trenches a quiet squad digs no longer block a post; the plan, from AFP.start s on, orders its first work through
   genCmd with a free squad (the nest, a mine field or the AA its places want), logs each decision, the work gets built and its order closes.
   About five minutes */
const H = require('./harness'), { ok, done } = H, { performance } = require('perf_hooks');

function watch() {
  const C = H.load({ seed: 4, eco: 1, mapv: 6 }), $ = C.$; C.$('globalThis').performance = performance;
  const S = C.watch('ww2', { len: 0 }); C.run(2, null, 1 / 20);
  return { C, $, S };
}

console.log('-- caps: trenches and walls together, each post kind its own --');
{
  const { $, S } = watch(), t = 0, cap = $('fortCap'), add = $('fortAdd'), gc = (c) => $('genCmd')(t, c, 'ai');
  const seat = $('aidSeat')(t) || S.base[t], x0 = seat.x, z0 = seat.z;
  const n0 = cap(t, 0); let i = 0;
  for (const f of S.forts.filter(f => f.team === t)) f.gone = true;
  while (S.forts.filter(f => f.team === t && !f.gone && f.k <= 2).length < n0) add(9000 + i, 1, t, x0 + 30 * (i % 6), z0 + 30 * ((i / 6) | 0), 0, 1, false), i++;
  const tr = gc({ c: 'fort', k: 'trench', x: x0 + 300, z: z0 });
  ok(tr.why === 'fcap', n0 + ' trenches: a new trench is refused with fcap (' + tr.why + ')');
  const bk = gc({ c: 'fort', k: 'bunker', x: x0 + 300, z: z0 });
  ok(bk.why !== 'fcap' && bk.why !== 'postcap', '  a nest is not blocked by them (' + (bk.ok ? 'ok' : bk.why) + ')');
  const K = $('W21').dig.bunker, nb = cap(t, K);
  while (S.forts.filter(f => f.team === t && !f.gone && f.k === K).length < nb) add(9100 + i, K, t, x0 - 60 * (i % 5), z0 - 60 * ((i / 5) | 0), 0, 1, false), i++;
  for (const o of $('cmdOf')(t).ops) if (o.k === 'usr') o.over = true;
  const b2 = gc({ c: 'fort', k: 'bunker', x: x0 - 400, z: z0 });
  ok(b2.why === 'postcap', nb + ' nests: another nest is refused with postcap (' + b2.why + ')');
  ok(/postos deste tipo/.test($('gNo')('postcap')), '  and the page names postcap ("' + $('gNo')('postcap') + '")');
}

console.log('-- the plan: its first work ordered after AFP.start, built, the order over --');
{
  const { C, $, S } = watch(), t = 0, A = () => $('afpOf')($('cmdOf')(t)), AFP = $('AFP');
  ok($('afpOn')(t), 'the plan is on for an AI side on the road map');
  $('afpPlan')(t);
  ok(!A().fo.length && !A().fl.length, 'nothing before AFP.start (' + AFP.start + ' s)');
  let first = null, built = null, back = null; const t0 = S.t;
  C.run(AFP.start + 420, () => {
    const a = A();
    if (!first && a.fo.length) first = { t: S.t, o: a.fo[0], q: a.fo[0].q || null, why: a.fl.filter(e => e.ok).slice(-1)[0] };
    if (first && !built && a.have[first.o.key]) built = S.t;
    if (built && !back && !a.fo.some(o => o.key === first.o.key)) back = S.t;
    return !back;
  }, 1 / 20);
  const L = A().fl;
  ok(!!first, 'an order goes by ' + (first ? Math.round(first.t - t0) + ' s' : '-') + ': ' + (first && first.why ? first.why.k + ' — ' + first.why.why : (L.slice(-3).map(e => e.k + ': ' + e.why).join(' | ') || 'no entry')));
  ok(L.length > 0 && L.every(e => typeof e.why === 'string' && e.k), '  each decision in C.afp.fl (' + L.length + '), the log says "Plano de fortificação"');
  ok(((S.glog && S.glog.l[t]) || []).some(e => /^Plano de fortificação: /.test(e.s)), '  and the general\'s log');
  ok(!!built, '  the work stands (' + (built ? Math.round(built - first.t) + ' s after the order' : 'not within ' + (AFP.start + 420) + ' s') + ')');
  ok(!!back, '  the order is over and the builder freed (' + (back ? Math.round(back - built) + ' s after' : '-') + ')');
}
done();
