'use strict';
/* vehicle recovery online, headless, through the real relay server on its own port (PAGE=<page>, SERVER=<server>, PORT_T=<port>): the host's
   tank knocked out stays a hulk on the guest's map, the recovery vehicle the host sends rides the AI rows with its own model, and the guest
   sees the hulk follow its tow; the guest's general asks rec of the host. About a minute */
const N = require('./net'), H = require('./harness'), { ok, done } = H;
const all = [], dt = 1 / 60;
async function client(name, cls, model) {
  const c = H.load({ WebSocket: N.WebSocket, host: 'localhost:' + N.PORT, seed: name.length * 97 + 5, eco: true, lg: true, rec: true, mapv: 4 }), $ = c.$, Net = $('Net');
  c.name = name; c.$ = $; c.Net = Net; c.on = true;
  await new Promise((res, rej) => {
    Net.ui.welcome = () => { c.newState('ww2', model, { net: true, cls, mouse: true, host: Net.host === Net.id }); res(); };
    Net.ui.refused = code => rej(new Error(name + ' refused: ' + code)); Net.connect('ww2', name, cls, model);
  });
  Object.defineProperty(c, 'S', { get: () => $('S') }); c.id = Net.id; c.director = () => {}; c.plan = () => {}; all.push(c); return c;
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
  const host = await client('Host', 'tank', 'tiger'), g = await client('Gast', 'inf', 'schutze');
  const REC = host.$('REC'), hd = host.$('hdist'), S = host.S;
  ok(host.Net.rec && g.Net.rec && !!S.rec && !!g.S.rec, 'the server knows recovery (welcome rec 1): host and guest have it');
  S.rec.cmd = [1e9, 1e9]; S.eco.open = false; await run(1);
  const r = S.T.routes[0], s = host.$('lineS')(0, 0) - 1200, p = host.$('routeAt')(r, s), u = host.addUnit('tank', 0, p.x - p.dz * 40, p.z + p.dx * 40, S.E.sides[S.fac[0]].tanks[0], true);
  Object.assign(u, { fixed: false, rail: false }); u.ai.think = 1e9; REC.p = 1; await run(2);
  u.hp = u.max * .4; host.damageUnit(u, u.hp + .01, null); await run(2);
  const gu = g.S.units.find(o => o.aid === u.aid);
  ok(u.imm && gu && !gu.dead && hd(gu, u) < 3, 'the host\'s tank knocked out is still on the guest\'s map, where it stands');
  ok(host.genCmd(0, { c: 'recv', id: u.imm.id }, 'ai').ok, 'the host sends its recovery vehicle');
  const a = S.units.find(o => o.rcv); await run(3);
  const ga = g.S.units.find(o => o.aid === a.aid);
  ok(ga && ga.def.id === 'bergep' && ga.def.svc === 'arv', 'the guest sees it, a Bergepanther, from the AI rows');
  let towed = false, near = 1e9;
  await run(240, () => { if (u.tow) { towed = true; const gh = g.S.units.find(o => o.aid === u.aid), gv = g.S.units.find(o => o.aid === a.aid); if (gh && gv) near = Math.min(near, Math.abs(hd(gh, gv) - hd(u, a))); } return !(towed && hd(u, { x: p.x, z: p.z }) > 150); });
  const gh = g.S.units.find(o => o.aid === u.aid);
  ok(towed && gh && hd(gh, u) < 15 && hd(gh, { x: p.x, z: p.z }) > 100, 'hitched and towed: on the guest\'s map too the hulk has left its place behind the vehicle (' + Math.round(hd(gh || u, { x: p.x, z: p.z })) + ' m)');
  g.Net.send('gclaim', { on: 1 }); await run(1);
  let ans = null;
  const w0 = g.Net.ws; w0.send(JSON.stringify({ t: 'gask', q: { q: 'rec' }, n: 77 }));
  const orig = g.Net.rx.gres; g.Net.rx.gres = m => { if (m.n === 77) ans = m; if (orig) orig(m); };
  await run(2, () => !ans);
  ok(ans && ans.ok && ans.r && ans.r.on === 1 && ans.r.hulks.some(o => o.id === u.imm.id && o.towed), 'the guest\'s general asks rec: the host answers with the hulk under tow');
  for (const c of all) c.Net.ws && c.Net.ws.close();
  N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exitCode = 1; });
