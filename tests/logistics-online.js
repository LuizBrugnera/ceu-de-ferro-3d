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

  console.log('-- a guest\'s requisition refunded, and what is refused (W11: the host checks the crates a guest gives back) --');
  {
    const RQ = host.$('RQ'), hb = () => host.S.sup.find(o => o.id === b.id), stand = (c, x, z) => { const M = c.S.my; M.x = x; M.z = z; M.y = c.$('hgt')(x, z); M.v = { x: 0, y: 0, z: 0 }; M.inv = 1e9; };
    const ask = async () => {   // the guest on foot in base b asks for a truck; the host grants it and takes its crates
      host.S.cq.rq = {}; stand(g, b.x + 6, b.z + 6); await run(1.5, () => stand(g, b.x + 6, b.z + 6));
      const c0 = hb().lc, why = g.$('rqAsk')('trn', 'hemtt'); await run(4);
      return { why, paid: c0 - hb().lc, rq: host.Net.lgRq.get(g.id), truck: g.S.cls === 'trn' && !g.S.my.man };
    };
    const out = async hp => {   // the guest drives a little, comes back to the base and gets out (F)
      const V = g.S.my; V.x = b.x + 12; V.z = b.z + 12; V.y = g.$('hgt')(V.x, V.z); V.v = { x: 0, y: 0, z: 0 }; V.sp = 0;
      await run(1.5); const c0 = hb().lc; if (hp) { V.hp = V.max * hp; await run(.3); V.hp = V.max * hp; }   // hit just before it gets out (a supply base repairs what stands in it)
      g.$('alight')(g.S.rider); for (let i = 0; i < 30 && hb().lc === c0; i++) await run(.2); await run(1);
    };
    const a = await ask(), n = Math.floor(a.paid * RQ.refund);
    ok(a.why === '' && a.truck && a.paid === LG.cost.truck && a.rq && a.rq.c === a.paid, 'a guest in base ' + b.id + ' requisitions a truck: the host grants it, takes ' + a.paid + ' crates and notes what it was paid (Net.lgRq)');
    const c1 = hb().lc; await out(); const c2 = hb().lc;
    ok(c2 === c1 + n && g.S.my.man && !host.Net.lgRq.has(g.id), 'it comes back whole and gets out there: the base gets ' + n + ' crates back (floor(' + a.paid + ' x ' + RQ.refund + '), ' + c1 + ' -> ' + c2 + ') and the record is used up');
    g.Net.send('lsp', { k: 2, id: b.id, n }); await run(3);
    ok(hb().lc === c2, 'the same give-back again (lsp k 2, n ' + n + '): refused, one refund a requisition');
    for (let i = 0; i < 4; i++) { g.Net.send('lsp', { k: 2, id: b.id, n: 20 }); await run(.5); } await run(2);
    ok(hb().lc === c2, 'a cheat sending lsp {k: 2, n: 20} again and again with no requisition: the base does not change (' + hb().lc + ')');
    const a2 = await ask(); const c3 = hb().lc;
    g.Net.send('lsp', { k: 2, id: b.id, n: Math.floor(a2.paid * RQ.refund) }); await run(3);
    ok(a2.why === '' && a2.truck && hb().lc === c3, 'a give-back while still in the truck (no crew row yet): refused');
    { const V = g.S.my; V.x = b.x + 700; V.z = b.z; V.y = g.$('hgt')(V.x, V.z); V.v = { x: 0, y: 0, z: 0 }; V.sp = 0; await run(1.5); g.$('alight')(g.S.rider); await run(1.5); }   // out far from any depot: nothing to give back
    const a3 = await ask(); const c4 = hb().lc;
    await out(.5);
    g.Net.send('lsp', { k: 2, id: b.id, n: Math.floor(a3.paid * RQ.refund) }); await run(3);
    ok(a3.why === '' && a3.truck && hb().lc === c4, 'a truck left at half its hp (under ' + RQ.hp * 100 + '%): no refund, whatever the guest sends (' + (a3.why || 'granted') + ', ' + c4 + ' -> ' + hb().lc + ')');
  }

  console.log('-- the next host keeps the stocks --');
  const keep = { b: b.lc, p: own.map(o => o.lc) }; host.on = false; host.Net.ws.close(); all.splice(all.indexOf(host), 1);
  await run(4);
  const nh = [g, tr].find(c => c.S.host), nb = nh && nh.S.sup.find(o => o.id === b.id);
  ok(nh && nb && nb.lc === keep.b && own.every((o, i) => nh.S.cq.p[o.i].lc === keep.p[i]), 'the new host (' + (nh && nh.name) + ') has the stocks the old one sent: base ' + (nb && nb.lc) + ', points ' + own.map(o => nh && nh.S.cq.p[o.i].lc).join(','));
  for (const c of all) c.Net.ws && c.Net.ws.close();
  N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exitCode = 1; });
