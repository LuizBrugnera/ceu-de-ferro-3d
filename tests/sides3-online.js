'use strict';
/* a room of three sides through the real relay server (PAGE, SERVER, PORT_T): the "online" items of docs/nao-testado/cf-3l-p2/p4/p5.
   A host of the USA (Abrams) asks for three sides (Net.ns0 3, as the hangar's "Três" does), a Russian guest (T-90) and an Insurgent guest (T-55)
   join: the welcome says ns 3, every page builds the match of three sides on the side of its model; a page that asks for two is refused (sides).
   The conquest goes out as cq v2: the guests have the host's points and three point-times; side 2 out (its main base taken) is out for the guests too (they
   deduce it, with the banner for the Insurgent player), and when side 1's main base falls the match ends with the same placing everywhere and
   "Derrota · 2º lugar" for the second. Then, with the room empty, an Insurgent model in a room of two sides is refused (side) */
process.env.SUSPEND = '0';   // an emptied room ends its match (no suspended match in the way of the last check)
const N = require('./net'), H = require('./harness'), { ok, done } = H;
const all = [], dt = 1 / 30;
async function client(name, cls, model, ns) {
  const c = H.load({ WebSocket: N.WebSocket, host: 'localhost:' + N.PORT, seed: name.length * 97 + name.charCodeAt(0), mapv: 9 }), $ = c.$, Net = $('Net');
  c.name = name; c.$ = $; c.Net = Net; c.on = true; Net.ns0 = ns;
  c.refused = await new Promise(res => { Net.ui.welcome = () => { c.newState('modern', model, { net: true, cls, mouse: true, host: Net.host === Net.id }); res(null); }; Net.ui.refused = code => res(code); Net.connect('modern', name, cls, model); });
  if (c.refused) { Net.close(); return c; }
  Object.defineProperty(c, 'S', { get: () => $('S') }); c.id = Net.id; c.plan = () => {}; c.director = () => {};
  all.push(c); return c;
}
async function run(secs, each) {
  for (let i = 0, n = Math.round(secs / dt); i < n; i++) {
    for (const c of all) if (c.on) { c.step(dt); c.Net.tick(dt); }
    if (each && each() === false) return false;
    if (i % 2 === 0) await new Promise(r => setImmediate(r));
    if (i % 10 === 0) await N.sleep(1);
  }
  await N.sleep(60); return true;
}

(async () => {
  await N.start(); console.log('server: ' + N.SERVER + '\npage:   ' + H.PAGE);
  const h = await client('Hugo', 'tank', 'abrams', 3), r = await client('Rita', 'tank', 't90', 3), i = await client('Ivo', 'tank', 't55', 3);
  ok(!h.refused && !r.refused && !i.refused, 'the three pages join (' + [h.refused, r.refused, i.refused] + ')');
  ok([h, r, i].every(c => c.Net.ns === 3 && c.S.N === 3), 'the welcome says ns 3 and every page builds three sides (' + [h, r, i].map(c => c.S && c.S.N) + ')');
  ok(h.S.me === 0 && r.S.me === 1 && i.S.me === 2, 'each page is on its model\'s side: USA 0, Russia 1, Insurgents 2 (' + [h, r, i].map(c => c.S.me) + ')');
  ok(h.Net.host === h.Net.id && r.Net.host === h.Net.id, 'the first one is the host');
  const two = await client('Duda', 'tank', 'abrams', 2);
  ok(two.refused === 'sides', 'a page that asks for two sides is refused: ' + two.refused);
  await run(4);
  const Q = h.S.cq, same = c => c.S.cq.p.every((p, k) => p.hold === Q.p[k].hold) && c.S.cq.ps.length === 3 && c.S.cq.tk === undefined;
  ok(same(r) && same(i), 'cq v2: the guests have the host\'s points and three point-times (' + r.S.cq.ps.map(Math.round) + ')');
  const b2 = Q.p.find(p => p.base === 2); b2.hold = 0; b2.c = 1; await run(1.5);
  ok(Q.out[2] === 3 && !Q.ph, 'the host puts side 2 out (its main base taken) and the match goes on');
  ok(r.S.cq.out[2] === 3 && i.S.cq.out[2] === 3, 'the guests deduce it (out[2] ' + r.S.cq.out[2] + ', ' + i.S.cq.out[2] + ')');
  ok(i.S.banner && /Seu lado foi eliminado/.test(i.S.banner.text), 'the Insurgent player is told: ' + (i.S.banner && i.S.banner.text));
  const b1 = Q.p.find(p => p.base === 1); b1.hold = 0; b1.c = 1; await run(1.5);
  ok(Q.ph === 1 && Q.res[0] === 0 && Q.place.join() === '0,1,2', 'side 1\'s base taken: the host ends it, side 0 wins, placing ' + Q.place);
  ok([r, i].every(c => c.S.cq.ph === 1 && c.S.cq.place.join() === Q.place.join()), 'every guest ends with the same placing (' + [r, i].map(c => c.S.cq.place) + ')');
  ok(h.S.why === 'Vitória' && r.S.why === 'Derrota · 2º lugar' && i.S.why === 'Derrota · 3º lugar', 'the end: ' + [h, r, i].map(c => c.S.why).join(' / '));
  for (const c of all) { c.on = false; c.Net.close(); }
  await N.sleep(400);
  const sd = await client('Sara', 'tank', 't55', 2);
  ok(sd.refused === 'side', 'an Insurgent model in a room of two sides is refused: ' + sd.refused);
  for (const c of all) c.Net.close(); N.stop(); done();
})().catch(e => { console.log('  FAIL ' + (e.stack || e)); N.stop(); process.exitCode = 1; });
