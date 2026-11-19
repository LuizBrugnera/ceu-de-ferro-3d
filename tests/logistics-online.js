'use strict';
/* physical logistics online, headless, through the real relay server on its own port (PAGE=<page>, SERVER=<server>, PORT_T=<port>): the stocks
   of the bases and the points on every guest (base rows, cq sk), a guest's entry at a point paid on the host (lsp), a guest's truck that loads
   at its main base and unloads into a point (lgx), the host's convoys, and the next host keeping the stocks. About a minute */
const N = require('./net'), H = require('./harness'), { ok, done } = H;
const all = [], dt = 1 / 60;
async function client(name, cls, model, keep) {
  const c = H.load({ WebSocket: N.WebSocket, host: 'localhost:' + N.PORT, seed: name.length * 97 + 5, eco: true, lg: true, mapv: 4 }), $ = c.$, Net = $('Net');
  c.name = name; c.$ = $; c.Net = Net; c.on = true;
  await new Promise((res, rej) => {
    Net.ui.welcome = () => { c.newState('modern', model, { net: true, cls, mouse: true, host: Net.host === Net.id }); res(); };
    Net.ui.refused = code => rej(new Error(name + ' refused: ' + code)); Net.connect('modern', name, cls, model);
  });
  Object.defineProperty(c, 'S', { get: () => $('S') }); c.id = Net.id; if (!keep) { c.director = () => {}; c.plan = () => {}; } all.push(c); return c;
}
async function run(secs, each) {
  for (let i = 0, n = Math.round(secs / dt); i < n; i++) {
    for (const c of all) if (c.on) { if (c.S.cd) c.S.cd = {}; c.step(dt); c.Net.tick(dt); }
    if (each && each() === false) return false;
    if (i % 2 === 0) await new Promise(r => setImmediate(r));
  }
  await N.sleep(40); return true;
}
(async () => {
  await N.start(); console.log('server: ' + N.SERVER + '\npage:   ' + H.PAGE);
  const host = await client('Host', 'tank', 'abrams', true), g = await client('Azul', 'inf', 'blueRifle'), tr = await client('Carga', 'trn', 'hemtt');
  const LG = host.$('LG'), hd = host.$('hdist');
  ok(host.Net.lg && g.Net.lg && !!host.S.lg && !!g.S.lg, 'the server knows logistics (welcome lg 1): host and guests have it');
  await run(2);
  const P = host.S.cq.p, own = P.filter(p => p.hold === 0 && p.base < 0);
  own[0].lc = 17; own[1].lc = 4;
  const r1 = host.S.T.routes[1], q = host.$('routeAt')(r1, host.$('lineS')(0, 1) + 900); let b = null;
  for (let k = 0; k < 200 && !b; k++) { const x = q.x - q.dz * 40, z = q.z + q.dx * 40 + k * 20; if (!host.siteWhy(0, x, z, 0)) { b = host.startSite(0, x, z, 0); host.supAt(b, 1); } }
  b.lc = 66; await run(2);
  const gb = g.S.sup.find(o => o.id === b.id), gp = i => g.S.cq.p[i];
  ok(gb && gb.lc === 66 && gp(own[0].i).lc === 17 && gp(own[1].i).lc === 4, 'the guest has the host\'s stocks: the base (' + (gb && gb.lc) + ', base rows) and the points (' + gp(own[0].i).lc + ', ' + gp(own[1].i).lc + ', cq sk)');

  console.log('-- a guest enters at a point: the host takes the crates --');
  const p = own[0]; g.S.spawnAt = p.i + 1; g.killMan(g.S.my, null); await run(6);
  ok(hd(g.S.my, p) < 80 && p.lc === 17 - LG.cost.inf, 'the guest soldier entered at ' + p.L + ' and the host took ' + LG.cost.inf + ' crates (' + p.lc + ')');
  await run(1); ok(gp(p.i).lc === p.lc, 'and the guest sees ' + gp(p.i).lc);

  console.log('-- a guest\'s truck: loads by its base, unloads into a point --');
  const T = tr.S.my, d = host.S.eco.d[T.team]; host.S.eco.ctl[T.team] = 'me'; d.mt = 200; T.inv = 1e9;   // the host's AI economy spends no metal meanwhile
  T.lgc = 0; T.lgD = ''; host.Net.lgCar.delete(tr.id);   // empty: it stood by its base since it entered, and loaded there
  const bx = tr.S.base[0], at = (x, z, go) => { T.x = x; T.z = z; T.y = tr.$('hgt')(x, z); T.v = { x: 0, y: 0, z: 0 }; T.sp = 0; if (go) T.lgT = 0; };   // go: it has just arrived (a stop begins)
  let m0 = d.mt, drop = 0;   // the metal income goes on: the load is the one drop in a step
  at(bx.x + 300, bx.z + 300, 1); await run(LG.load + 2, () => { T.v = { x: 0, y: 0, z: 0 }; T.sp = 0; drop = Math.max(drop, m0 - d.mt); m0 = d.mt; });
  ok(T.lgc === LG.truck && Math.abs(drop - LG.mt) < 1, 'standing by its main base it loaded ' + T.lgc + ' crates; the host took ' + LG.mt + ' metal (' + Math.round(drop) + ')');
  const p2 = own[1]; at(p2.x + 5, p2.z + 5, 1); await run(LG.load + 2, () => { at(p2.x + 5, p2.z + 5); });
  ok(T.lgc === 0 && p2.lc === 4 + LG.truck, 'standing in ' + p2.L + ' it unloaded into it: ' + p2.lc + ' crates on the host');

  console.log('-- the host\'s convoys --');
  const far = own.sort((a, c) => hd(c, host.S.base[0]) - hd(a, host.S.base[0]))[0]; far.lc = 0; d.mt = 200;
  const cw = host.lgConvoy(0, far, 'teste');
  ok(cw === '' && host.S.lg.cv.some(c => c.n === 'p' + far.i), 'the host sends a convoy to ' + far.L);
  const u = host.S.lg.cv[0].u; await run(3); const gu = g.S.units.find(o => o.aid === u.aid);
  ok(gu && hd(gu, u) < 30, 'the guests see its truck on the road');

  console.log('-- the next host keeps the stocks --');
  const keep = { b: b.lc, p: own.map(o => o.lc) }; host.on = false; host.Net.ws.close(); all.splice(all.indexOf(host), 1);
  await run(4);
  const nh = [g, tr].find(c => c.S.host), nb = nh && nh.S.sup.find(o => o.id === b.id);
  ok(nh && nb && nb.lc === keep.b && own.every((o, i) => nh.S.cq.p[o.i].lc === keep.p[i]), 'the new host (' + (nh && nh.name) + ') has the stocks the old one sent: base ' + (nb && nb.lc) + ', points ' + own.map(o => nh && nh.S.cq.p[o.i].lc).join(','));
  for (const c of all) c.Net.ws && c.Net.ws.close();
  N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exitCode = 1; });
