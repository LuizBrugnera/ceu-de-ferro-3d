'use strict';
/* map version 6 through the real relay server (PORT_T, default 8093): the room is map 6, a page of map 5 is refused, every client builds the
   same rocks, bushes and trees under the same ids, and a bush a guest's burst flattens (an id above the older maps') is flat for the host,
   for the guest and for one who joins after */
const N = require('./net'), H = require('./harness'), { ok, done } = H;
const all = [], dt = 1 / 60;
async function client(name, mapv) {
  const c = H.load({ WebSocket: N.WebSocket, host: 'localhost:' + N.PORT, seed: name.length * 97 + 5, mapv }), $ = c.$, Net = $('Net');
  c.$ = $; c.Net = Net; c.on = true;
  const r = await new Promise(res => {
    Net.ui.welcome = () => { c.newState('ww2', 'tiger', { net: true, cls: 'tank', mouse: true, host: Net.host === Net.id }); res(null); };
    Net.ui.refused = code => res(code); Net.connect('ww2', name, 'tank', 'tiger');
  });
  if (r) { c.refused = r; return c; }
  Object.defineProperty(c, 'S', { get: () => $('S') }); all.push(c); return c;
}
async function run(secs, each) {
  for (let i = 0, n = Math.round(secs / dt); i < n; i++) {
    for (const c of all) if (c.on) { c.step(dt); c.Net.tick(dt); }
    if (each && each() === false) return false;
    if (i % 2 === 0) await new Promise(r => setImmediate(r));
  }
  await N.sleep(40); return true;
}
const covers = T => T.objs.filter(o => o.k === 'rock' || o.k === 'bush');

(async () => {
  await N.start(); console.log('server: ' + N.SERVER + '\npage:   ' + H.PAGE);
  if (!H.load().$('typeof COVERS !== "undefined"')) { console.log('no COVERS table: a page before map version 6'); N.stop(); return; }
  const host = await client('Host', 6), g = await client('Azul', 6), old = await client('Velho', 5);
  ok(host.Net.mv === 6 && g.Net.mv === 6 && host.S.mv === 6 && g.S.mv === 6 && host.S.T.cvn > 0, 'the room is map 6, and host and guest build it (' + host.S.T.cvn + ' rocks and bushes)');
  ok(old.refused === 'map', 'a page of map 5 is refused by the map 6 room (code ' + old.refused + ')');
  const a = covers(host.S.T), b = covers(g.S.T), ta = host.S.T.objs.filter(o => o.k === 'tree'), tb = g.S.T.objs.filter(o => o.k === 'tree');
  ok(a.length === b.length && a.every((o, i) => o.id === b[i].id && o.k === b[i].k && o.x === b[i].x && o.z === b[i].z && o.rd === b[i].rd && o.h === b[i].h), 'host and guest have the same rocks and bushes under the same ids');
  ok(ta.length === tb.length && ta.every((o, i) => o.id === tb[i].id && o.sc === tb[i].sc && o.v === tb[i].v), 'and the same trees, grown alike');
  await run(1);
  const bush = a.filter(o => o.k === 'bush').pop(), gb = g.S.T.byId[bush.id], P = g.S.my;
  console.log('   a bush with id ' + bush.id + ' (map 5 ends at ' + (host.S.T.cv0 - 1) + ')');
  if (host.Net.wo) {
    g.$('hitObj')(gb, 60, P);
    await run(3, () => !(host.S.os[bush.id] === 2 && g.S.os[bush.id] === 2));
    ok(host.S.os[bush.id] === 2 && g.S.os[bush.id] === 2, 'a guest\'s hit flattens it on the host and on the guest');
    const late = await client('Tarde', 6); await run(2, () => late.S.os[bush.id] !== 2);
    ok(late.S.os[bush.id] === 2, 'one who joins after finds it flat too');
  } else console.log('   the server does not know the world-object messages: nothing is damaged online');
  for (const c of all) c.Net.close();
  N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exitCode = 1; });
