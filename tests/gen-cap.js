'use strict';
/* the general's view message within the relay's cap (cf-pol-testes-b): server.js drops a gen frame over BIG.gen (8192 bytes) without a
   word, and in a modern AI battle the defence plans (dfp) alone made it 8.9 KB (tests/radio.js), so a guest's General view stopped.
   genMsg fits it: the biggest optional layer is halved or left out first, the squads' rows last, the core always goes */
const fs = require('fs'), path = require('path'), H = require('./harness'), { ok, done } = H;
const C = H.load({ seed: 3, eco: true, mapv: 6 }), $ = C.$;
const has = (() => { try { return typeof $('genMsg') === 'function'; } catch (e) { return false; } })();
ok(has, 'the page fits the general\'s view message (genMsg)');
const srv = fs.readFileSync(path.join(H.ROOT, 'server.js'), 'utf8'), cap = +((/BIG = \{[^}]*gen: (\d+)/.exec(srv) || [])[1]);
ok(cap > 0, 'the relay\'s cap for gen: ' + cap + ' bytes');
const pageSrc = fs.readFileSync(H.PAGE, 'utf8');
ok(/Net\.send\('gen', genMsg\(s, T\)\)/.test(pageSrc), 'the host sends the view through genMsg');
if (has) {
  const S = C.watch('modern', { len: 0 }); C.run(2, null, 1 / 30);
  const bytes = m => Buffer.byteLength(JSON.stringify(Object.assign({ t: 'gen' }, m)), 'utf8');
  /* as it is: a short battle fits untouched */
  const m0 = $('genMsg')(0, 1), v0 = $('genPick')($('genVM')(0, false));
  ok(bytes(m0) <= cap && JSON.stringify(m0.v) === JSON.stringify(v0), 'a battle\'s view that fits goes untouched (' + bytes(m0) + ' bytes)');
  /* defence plans of 7 KB (accents in the names, as Portuguese has): the message is cut to fit, the core stays */
  const plan = i => ({ pi: i, nm: 'Defesa de Vila do Moinho, posição ' + i + ' (ação, coração)', x: 1000 + i, z: 2000, posts: Array.from({ length: 6 }, (_, j) => ({ x: j, z: j, a: .5, w: .7, kx: j, kz: j, ap: 0, sq: 3 })), ap: [{ x: 1, z: 2, kx: 3, kz: 4, w: 1, k: 'estrada' }] });
  C.$('globalThis').__big = Array.from({ length: 16 }, (_, i) => plan(i));
  C.$('genVM = (g => (t, all) => { const V = g(t, all); if (V) V.dfp = __big; return V; })(genVM)');
  const before = bytes({ s: 0, T: 1, v: $('genPick')($('genVM')(0, false)), q: $('gsqOf')(0) }), m = $('genMsg')(0, 1), after = bytes(m);
  ok(before > cap, 'with 16 big defence plans the raw message is ' + before + ' bytes, over the cap');
  ok(after <= cap && after <= $('GENCAP'), 'genMsg fits it: ' + after + ' bytes (GENCAP ' + $('GENCAP') + ')');
  ok(!m.v.dfp || m.v.dfp.length < 16, 'the defence plans were halved or left out (' + (m.v.dfp ? m.v.dfp.length + ' of 16' : 'left out') + ')');
  ok(['doc', 'post', 'road', 'ops'].every(k => JSON.stringify(m.v[k]) === JSON.stringify(v0[k])), 'the core (doc, posts, roads, ops) is whole');
  ok(Array.isArray(m.q) && m.q.length % 6 === 0, 'the squads\' rows stay whole rows of 6');
  ok($('utf8Len')('ação') === 6 && $('utf8Len')('abc') === 3 && $('utf8Len')('€') === 3, 'bytes are counted as UTF-8, as the relay counts the frame');
}
done();
