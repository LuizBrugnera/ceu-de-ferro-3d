'use strict';
/* capture online, headless, through the real relay server: a host in an HMMWV (side 0), a guest soldier on its side who watches and a
   guest soldier of the other side. The host gets out; the enemy guest holds E beside it and is given the wheel (drive, grant, crew with
   cap); every client has it on side 1, the loss is counted once, the guest's record carries cap; he gets out and it stays side 1's;
   the host's soldier takes it back the same way (the host's own path); someone who joins later sees it right.
   With SERVER=<an older server.js> welcome has no cap and nobody is offered a capture */
const N = require('./net'), H = require('./harness'), { ok, done } = H;
const all = [], dt = 1 / 60;
async function client(name, cls, model) {
  const c = H.load({ WebSocket: N.WebSocket, host: 'localhost:' + N.PORT, seed: name.length * 97 + name.charCodeAt(0) }), $ = c.$, Net = $('Net');
  c.name = name; c.$ = $; c.Net = Net; c.on = true;
  await new Promise((res, rej) => { Net.ui.welcome = () => { c.newState('modern', model, { net: true, cls, mouse: true, host: Net.host === Net.id }); res(); }; Net.ui.refused = code => rej(new Error(name + ' refused: ' + code)); Net.connect('modern', name, cls, model); });
  Object.defineProperty(c, 'S', { get: () => $('S') }); c.id = Net.id; c.plan = () => {}; c.director = () => {}; $('RAD').ai.n = 0;   // no AI radio vehicle: it would be a requisition
  all.push(c); return c;
}
async function run(secs, each) {
  for (let i = 0, n = Math.round(secs / dt); i < n; i++) {
    for (const c of all) if (c.on) { c.step(dt); c.Net.tick(dt); }
    if (each && each() === false) return false;
    if (i % 2 === 0) await new Promise(r => setImmediate(r));
    if (i % 20 === 0) await N.sleep(1);
  }
  await N.sleep(30); return true;
}
const put = (c, x, z, h) => { const P = c.S.my; P.x = x; P.z = z; P.y = P.man ? c.$('manY')(x, z) : c.hgt(x, z); if (h !== undefined) { P.h = h; if (c.S.aim) c.S.aim.h = h; } P.inv = 1e9; };
const press = async (c, k) => { c.S.input[k] = true; await run(.05); c.S.input[k] = false; await run(.25); };
const hold = async (c, k, s) => { c.S.input[k] = true; await run(s); c.S.input[k] = false; await run(.8); };
const gh = (c, o) => c.Net.ghosts.get(o.id), rec = (c, o) => c.Net.players.get(o.id);

(async () => {
  await N.start(); console.log('server: ' + N.SERVER + '\npage:   ' + H.PAGE);
  const h = await client('Hugo', 'trn', 'hmmwv'), a = await client('Ana', 'inf', 'blueSaw'), c = await client('Caio', 'inf', 'redRifle');
  const CAP = h.$('CAP'), CQ = h.$('CQ'), B = h.S.base[0], BX = B.x - 300, BZ = B.z - 150;
  if (!h.Net.cap) {
    ok(!a.Net.cap && !c.Net.cap, 'this server does not know capture: welcome has no cap');
    await run(.5); put(h, BX, BZ, 0); put(a, BX + 40, BZ + 40); put(c, BX + 3, BZ + 6); await run(1); await press(h, 'yawR'); await run(1); put(h, BX - 30, BZ - 30); await run(1);
    await hold(c, 'yawR', CAP.hold + .5);
    ok(c.S.my.man && !c.S.capU && h.S.units.every(u => u.id !== 'hmmwv' || u.team === 0), 'and the enemy soldier beside the empty HMMWV is offered nothing');
    for (const x of all) x.Net.close(); N.stop(); return done();
  }
  ok(h.Net.cap && a.Net.cap && c.Net.cap && h.S.host, 'welcome says cap; Hugo hosts in an HMMWV');
  await run(.5); put(h, BX, BZ, 0); put(a, BX + 40, BZ + 40); put(c, BX + 60, BZ + 40); await run(1);
  const V = h.S.my, hm = h.S.rider; await press(h, 'yawR'); await run(.8); put(h, BX - 30, BZ - 30); await run(.5);
  const Va = a.Net.ai.get(V.aid), Vc = c.Net.ai.get(V.aid);
  ok(h.S.my === hm && V.left && Va && Vc && Vc.bye && Vc.team === 0, 'Hugo steps out and away: the HMMWV is parked, side 0\'s, on every client');
  /* the enemy guest takes it */
  put(c, V.x + 3, V.z + 6); await run(1);
  ok(c.S.capU === Vc && !c.S.near, 'Caio (side 1), beside it, is offered the capture');
  const tk = h.S.cq.lost.map(l => l[1]);
  await hold(c, 'yawR', CAP.hold + .4);
  ok(c.S.my === Vc && c.S.rider && Vc.team === 1 && gh(h, c) === V && V.team === 1 && V.pid === c.id, 'E held: Caio is at its wheel, and on the host it is his, on side 1');
  ok(gh(a, c) === Va && Va.team === 1 && rec(a, c).cap === 1 && rec(h, c).cap === 1 && rec(a, c).model === 'hmmwv' && a.$('pSide')(rec(a, c)) === 1 && h.S.humans[1] === 1 && a.S.humans[1] === 1, 'on the other guest too: the same vehicle, side 1, and his record is an HMMWV under his own flag');
  ok(h.S.cq.lost[0][1] === tk[0] + 1 && h.S.cq.lost[1][1] === tk[1], 'side 0 counts it lost once, side 1 nothing (' + JSON.stringify(h.S.cq.lost) + ')');
  const x0 = Vc.x; c.S.aim.h = Vc.h; c.S.input.up = true; await run(3); c.S.input.up = false; c.S.input.brake = true; await run(2); c.S.input.brake = false; await run(.5);
  ok(Math.abs(Vc.x - x0) + Math.abs(V.x - x0) > 10 && Math.hypot(V.x - Vc.x, V.z - Vc.z) < 8 && Math.hypot(Va.x - Vc.x, Va.z - Vc.z) < 8, 'he drives it, and it moves on every client');
  /* he gets out: it stays his side's */
  await press(c, 'yawR'); await run(1.2);
  const Vc2 = c.S.units.find(u => u.id === 'hmmwv' && !u.dead), Va2 = a.Net.ai.get(V.aid);
  ok(c.S.my.man && !V.net && V.aid < 0 && V.left && V.team === 1 && rec(h, c).cap === 0 && rec(a, c).cls === 'inf' && Vc2 && Vc2.team === 1 && Va2 && Va2.team === 1 && a.$('captured')(Va2), 'Caio gets out: the host owns it, parked, side 1\'s on every client, and his record is a soldier again');
  /* someone who joins later */
  const d = await client('Davi', 'inf', 'blueRifle'); await run(2);
  const Vd = d.Net.ai.get(V.aid);
  ok(Vd && Vd.team === 1 && d.$('captured')(Vd), 'Davi, who came later, has it as a captured vehicle of side 1');
  /* the host's soldier takes it back */
  put(c, V.x + 60, V.z + 60); put(h, V.x + 3, V.z + 6); await run(1);
  ok(h.S.capU === V, 'Hugo, back beside it, is offered the capture');
  const tk2 = h.S.cq.lost.map(l => l[1]);
  await hold(h, 'yawR', CAP.hold + .4);
  ok(h.S.my === V && V.team === 0 && !h.$('captured')(V) && gh(a, h) && gh(a, h).kind === 'car' && gh(a, h).team === 0 && gh(c, h).team === 0 && !rec(a, h).cap, 'E held: it is side 0\'s again on every client, and Hugo\'s record has no cap (it is his side\'s model)');
  ok(h.S.cq.lost[1][1] === tk2[1] + 1 && h.S.cq.lost[0][1] === tk2[0], 'side 1 counts losing it, once');
  for (const x of all) if (x.on) x.Net.close(); N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exit(1); });
