'use strict';
/* a host gone quiet (cf-anfitriao-bug). The captain played alone on the preview link, and every vehicle asked for said "O anfitrião não
   respondeu" and every base "O anfitrião recusou a obra": an older tab of the same match, in the background, was still the room's host. A
   tab in the background stops its frame loop, so it simulated and sent nothing, while the browser still answered the heartbeat's ping, and
   the server kept it as host for as long as it stayed open. Here the server lets such a host go after HOSTIDLE ms of silence when someone
   else is in the room: the next player is made host (and adopts the battle), and the quiet page's socket is closed with code 4001 */
process.env.HOSTIDLE = '1500';
const N = require('./net'), { ok, done } = require('./harness');
(async () => {
  await N.start(); console.log('server: ' + N.SERVER);
  const join = async (model, room) => {
    const c = await N.raw(); c.code = 0; c.ws.on('close', code => { c.code = code; });
    c.send({ t: 'join', room: room || 'modern', name: model, cls: 'inf', model }); c.w = await c.wait('welcome', 800); c.id = c.w && c.w.id; return c;
  };
  const talk = (c, ms) => { const iv = setInterval(() => { if (c.ws.readyState === 1) c.send({ t: 'mstate', p: [1, 2, 3], a: [0, 0], v: [0, 0], s: 0, hp: 20, f: 0 }); }, 50); return N.sleep(ms).then(() => clearInterval(iv)); };

  /* the captain's case: the old tab (a) is host and silent, the tab in front (b) plays */
  const a = await join('blueRifle'), b = await join('blueRifle');
  ok(a.w && b.w && a.w.host === a.id && b.w.host === a.id, 'the first page in the room is its host, the second a guest');
  b.send({ t: 'req', cls: 'trn', model: 'hmmwv' }); await N.sleep(200);
  ok(a.has('req').length === 1 && !b.has('reqa').length, 'a guest\'s request for a vehicle goes to the host, which (asleep) never answers: the symptom');
  await talk(b, 3000);
  const h = b.has('host').find(m => m.id === b.id);
  ok(!!h, 'after HOSTIDLE ms of silence from the host the guest is told it is the host now (it adopts the battle)');
  ok(a.code === 4001, 'and the quiet page\'s socket is closed with 4001, for the page to say why (got ' + a.code + ')');
  ok(b.has('left').some(m => m.id === a.id), 'the room is told the quiet page left');
  b.got.forEach(m => { m.seen = 1; });
  const c = await join('redRifle');
  ok(c.w && c.w.host === b.id, 'a player who joins next is welcomed with the new host');
  c.send({ t: 'req', cls: 'trn', model: 'tigr' }); const rq = await b.wait('req', 800);
  ok(rq && rq.from === c.id, 'and his request for a vehicle reaches the new host');
  b.send({ t: 'reqa', to: c.id, cls: 'trn', model: 'tigr', why: '' }); const ra = await c.wait('reqa', 800);
  ok(ra && ra.why === '', 'whose answer reaches him');

  /* a host that talks is never let go, even with a silent guest */
  const d = await join('blueRifle'); await talk(b, 2500);
  ok(b.code === 0 && !c.has('host').some(m => m.id !== b.id), 'a host that keeps sending stays host past HOSTIDLE, with quiet guests in the room');
  c.close(); d.close(); await N.sleep(300);

  /* a host alone in its room is never let go: no one waits on it */
  await N.sleep(2500);
  ok(b.code === 0, 'a silent host alone in its room keeps its socket');
  b.close();

  /* HOSTIDLE 0: never */
  N.stop(); await N.sleep(300);
  process.env.HOSTIDLE = '0'; await N.start();
  const e = await join('blueRifle'), f = await join('blueRifle'); await talk(f, 2500);
  ok(e.code === 0 && !f.has('host').length, 'HOSTIDLE=0 keeps a silent host (the tests\' default, whose pages share one process)');
  e.close(); f.close();
  N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exit(1); });
