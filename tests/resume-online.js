'use strict';
/* suspended matches, headless, through the real relay server on its own port (PAGE=<page>, SERVER=<server>, PORT_T=<port>): a player alone
   in the room plays a while and leaves (an F5); the room is suspended with the clock where it stood; the next player to come in is
   given the match and adopts it (the battle, the clock and tickets, the ruins, the economy) and plays on; "Nova partida" starts again.
   About a minute */
const N = require('./net'), H = require('./harness'), { ok, done } = H;
const all = [], dt = 1 / 60;
async function client(name, cls, model, fresh) {
  const c = H.load({ WebSocket: N.WebSocket, host: 'localhost:' + N.PORT, seed: name.length * 97 + 5, eco: true }), $ = c.$, Net = $('Net');
  c.name = name; c.$ = $; c.Net = Net; c.on = true;
  /* the server sends welcome, the suspended copy and then host in one go, and ws hands over every frame of one read at once: the host
     message may be in before the await below returns. So the guest is judged as welcome left it (atWelcome), and hosted is the host message */
  const rh = Net.rx.host; Net.rx.host = m => { rh(m); if (m.id === Net.id) c.hosted = true; };
  await new Promise((res, rej) => {
    Net.ui.welcome = () => { c.newState('modern', model, { net: true, cls, mouse: true, host: Net.host === Net.id }); c.atWelcome = { host: $('S').host, sus: Net.sus }; res(); };
    Net.ui.refused = code => rej(new Error(name + ' refused: ' + code)); Net.fresh = !!fresh; Net.connect('modern', name, cls, model);
  });
  Object.defineProperty(c, 'S', { get: () => $('S') }); c.id = Net.id; all.push(c); return c;
}
async function run(secs, each) {
  for (let i = 0, n = Math.round(secs / dt); i < n; i++) {
    for (const c of all) if (c.on) { c.step(dt); c.Net.tick(dt); }
    if (each && each() === false) return false;
    if (i % 2 === 0) await new Promise(r => setImmediate(r));
  }
  await N.sleep(40); return true;
}
const leave = async c => { c.on = false; c.Net.close(); await N.sleep(200); };
const partidas = async () => (await fetch('http://localhost:' + N.PORT + '/partidas')).json();
const stages = c => { const l = []; for (const o of c.S.T.objs) if (c.S.os[o.id]) l.push(o.id + ':' + c.S.os[o.id]); return l.join(' '); };
const aids = c => new Set([...c.S.planes, ...c.S.units, ...c.S.men].filter(o => o.aid && !o.dead && !o.gone).map(o => o.aid));
const live = c => ({ planes: c.S.planes.filter(p => p.aid && !p.dead && !p.gone).length, units: c.S.units.filter(u => u.aid && !u.dead).length, men: c.S.men.filter(m => m.aid && !m.dead).length });

(async () => {
  await N.start(); console.log('server: ' + N.SERVER + '\npage:   ' + H.PAGE);
  console.log('-- alone in the room, a while of play --');
  const a = await client('Solo', 'tank', 'abrams');
  ok(a.S.host && a.Net.rs, 'the only player is the host, and the server suspends (welcome rs 1)');
  await run(20);
  const T = a.S.T, hs = T.houses.filter(o => a.S.os[o.id] === 0).slice(0, 2);
  for (const o of hs) a.explode(o.x, o.y + 2, o.z, 60, 900, a.S.my, a.S.my.team);
  await run(4);
  const Q = a.S.cq, was = { T: Q.T, tk: Q.tk.map(Math.round).join(), st: stages(a), live: live(a), ids: aids(a), en: a.S.eco.d[0].en, n: a.Net.cqn, sites: a.S.eco.l.filter(e => !e.dead).length };
  console.log('   at the F5: ' + JSON.stringify(Object.assign({}, was, { st: was.st.split(' ').length + ' objects not intact', ids: was.ids.size })));
  ok(was.st.length > 0 && was.live.units + was.live.men > 10, 'there is a battle to keep: AI on the field, objects damaged');

  console.log('-- the player presses F5: the room is empty --');
  await leave(a);
  const p = (await partidas()).modern;
  ok(p && p.s > 800 && Math.abs(p.T - was.T) < 1.5 && p.n === was.n, 'GET /partidas: the match is suspended, ' + p.s + ' s left to take it up, ' + p.T + ' s on its clock');
  await N.sleep(1500);
  ok(Math.abs((await partidas()).modern.T - was.T) < 1.5, 'and its clock stands still while nobody is there');

  console.log('-- back in: the match goes on where it stopped --');
  const b = await client('Volta', 'inf', 'blueRifle');
  ok(!b.atWelcome.host && b.atWelcome.sus, 'the one who comes back starts as a guest of the match that was');
  const waited = await run(5, () => !b.hosted);   // play on until the server's host message, at most 5 s
  const now = live(b), Qb = b.S.cq;
  ok(!waited && b.S.host && !b.Net.sus && b.Net.host === b.id, 'then it is the host: it adopted the battle');
  ok(b.S.banner && b.S.banner.text === 'Partida retomada', 'and is told so: "' + (b.S.banner && b.S.banner.text) + '"');
  ok(Qb.T < was.T && was.T - Qb.T < 2.5 && Qb.tk.map(Math.round).join() === was.tk, 'the clock goes on from ' + Math.round(was.T) + ' s (now ' + Math.round(Qb.T) + ' s), the tickets are the same (' + was.tk + ')');
  ok(b.Net.cqn === was.n, 'the same match number (' + b.Net.cqn + ')');
  ok(stages(b) === was.st, 'every object is at the stage it was: ' + was.st.split(' ').length + ' not intact');
  const kept = [...was.ids].filter(id => aids(b).has(id)).length;
  ok(kept >= was.ids.size * .95 && now.planes >= was.live.planes - 1 && now.units >= was.live.units - 1 && now.men >= was.live.men - 5, 'the AI is back on the field, the same entities: ' + kept + ' of ' + was.ids.size + ' (now ' + JSON.stringify(now) + ', it was ' + JSON.stringify(was.live) + ')');
  ok(Math.abs(b.S.eco.d[0].en - was.en) < 60 && b.S.eco.l.filter(e => !e.dead).length === was.sites, 'the economy too: ' + Math.round(b.S.eco.d[0].en) + ' energy (it was ' + Math.round(was.en) + '), ' + was.sites + ' sites');
  const T0 = Qb.T; await run(8);
  ok(b.S.cq.T < T0 - 7 && live(b).units + live(b).men > 5 && !H.nan(b.S), 'and plays on: ' + Math.round(b.S.cq.T) + ' s on the clock, the AI live, no NaN');
  ok((await partidas()).modern === null, 'with a player in the room, nothing is suspended');

  console.log('-- "Nova partida" --');
  await leave(b);
  ok(!!(await partidas()).modern, 'the room is suspended again');
  const c = await client('Nova', 'tank', 'abrams', true);
  ok(c.S.host && !c.Net.sus && c.Net.cqn === was.n + 1, 'fresh: the player is host of a new match (number ' + c.Net.cqn + ')');
  await run(1);
  ok(stages(c) === '' && c.S.cq.T > was.T + 10 && c.S.cq.tk.map(Math.round).join() !== was.tk, 'from the start: no ruins, the full clock (' + Math.round(c.S.cq.T) + ' s), fresh tickets');
  for (const o of all) o.Net.close(); N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exit(1); });
