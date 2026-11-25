'use strict';
/* Taking a work down online (OBR, cf-pol2-obras: P17), headless, through the real relay server on its own port: the server says it knows
   it (fnd); a guest that holds V by the trench it dug asks the host (fundo), the host takes it down for everyone and pays part of it back;
   a request for another side's work, or from far off, is refused */
const N = require('./net'), H = require('./harness'), { ok, done } = H;
const all = [], dt = 1 / 60;
async function client(name, cls, model) {
  const c = H.load({ WebSocket: N.WebSocket, host: 'localhost:' + N.PORT, seed: name.length * 97 + 5 }), $ = c.$, Net = $('Net');
  c.name = name; c.$ = $; c.Net = Net; c.on = true;
  await new Promise((res, rej) => {
    Net.ui.welcome = () => { c.newState('modern', model, { net: true, cls, mouse: true, host: Net.host === Net.id }); res(); };
    Net.ui.refused = code => rej(new Error(name + ' refused: ' + code)); Net.connect('modern', name, cls, model);
  });
  Object.defineProperty(c, 'S', { get: () => $('S') }); c.id = Net.id; c.director = () => {}; c.plan = () => {}; all.push(c); return c;
}
async function run(secs, each) {
  for (let i = 0, n = Math.round(secs / dt); i < n; i++) {
    for (const c of all) if (c.on) { c.step(dt); c.Net.tick(dt); }
    if (each && each() === false) return false;
    if (i % 2 === 0) await new Promise(r => setImmediate(r));
  }
  await N.sleep(40); return true;
}
const until = async (f, ms) => { for (let t = Date.now(); !f() && Date.now() - t < (ms || 4000);) { await run(.1); await N.sleep(25); } return f(); };
const put = (c, x, z, h) => { const P = c.S.my; P.x = x; P.z = z; P.y = c.hgt(x, z); P.inv = 1e9; c.S.aim.h = h || 0; c.S.aim.p = -.25; };
const tap = async (c, k) => { c.S.input[k] = true; await run(.06); c.S.input[k] = false; await run(.06); };

(async () => {
  await N.start(); console.log('server: ' + N.SERVER + '\npage:   ' + H.PAGE);
  const host = await client('Host', 'tank', 'abrams'), g1 = await client('Azul', 'inf', 'blueRifle'), g2 = await client('Verm', 'inf', 'redRifle');
  const T = host.S.T, OBR = host.$('OBR'), built = c => c.S.forts.filter(f => !f.pre);
  await run(1);
  ok(host.Net.fnd && g1.Net.fnd && g2.Net.fnd, 'the server says it carries a soldier\'s request to take a work down (fnd)');
  const r = T.routes[0]; let p = null;
  for (let k = 0; !p && k < 400; k++) { const q = host.$('routeAt')(r, r.len / 2 + 900 + k * 20), x = q.x - q.dz * 120, z = q.z + q.dx * 120; if (!host.fortWhy(1, 0, x + 7, z, 0)) p = { x, z }; }
  put(g1, p.x, p.z); put(g2, p.x + 600, p.z); await run(1);
  await tap(g1, 'build'); await tap(g1, 'build'); await tap(g1, 'fire'); await until(() => built(host)[0] && built(g1)[0] && built(g2)[0]);
  for (let i = 0; i < 20 && g1.S.fm; i++) await tap(g1, 'build');
  const th = built(host)[0], t1 = built(g1)[0];
  ok(!!th && !!t1 && th.id === t1.id && th.team === 0, 'the guest dug a trench, the host has it under id ' + (th && th.id - T.fid));
  /* the other side's guest by it, asking: refused */
  g2.Net.send('fundo', { id: th.id, b: 0 }); await run(1.5);
  ok(!th.gone && built(host).includes(th), 'a guest of the other side asking for it: refused');
  put(g1, th.x, th.z + 1); await run(.5);
  g1.S.input.ordB = true; await run(OBR.undo + .5); g1.S.input.ordB = false;
  await until(() => !built(host).includes(th) && !built(g1).some(f => f.id === th.id) && !built(g2).some(f => f.id === th.id), 6000);
  ok(th.gone && !built(host).includes(th) && !built(g1).some(f => f.id === th.id) && !built(g2).some(f => f.id === th.id), 'held V ' + OBR.undo + ' s by it: the host took it down, and it is gone on both guests');
  for (const c of all) c.Net.close(); N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exit(1); });
