'use strict';
/* trenches and sandbags online, headless, through the real relay server on its own port: what is dug before the match on every client,
   a guest that builds both, a request refused, damage by a guest, a late joiner, the next host carrying a site on, and what a wood shot
   down costs on the wire. With SERVER=<a server that does not know them> see forts-oldserver.js */
const N = require('./net'), H = require('./harness'), { ok, done } = H;
const all = [], dt = 1 / 60;
async function client(name, cls, model) {
  const c = H.load({ WebSocket: N.WebSocket, host: 'localhost:' + N.PORT, seed: name.length * 97 + 5 }), $ = c.$, Net = $('Net'), send = Net.send;
  c.name = name; c.$ = $; c.Net = Net; c.sent = {}; c.msgs = {}; c.on = true;
  Net.send = (t, o) => { c.sent[t] = (c.sent[t] || 0) + JSON.stringify(Object.assign({ t }, o)).length; c.msgs[t] = (c.msgs[t] || 0) + 1; send(t, o); };
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
/* messages cross the real server in real time: step on until what they bring is there, for up to ms */
const until = async (f, ms) => { for (let t = Date.now(); !f() && Date.now() - t < (ms || 4000);) { await run(.1); await N.sleep(25); } return f(); };
const put = (c, x, z, h) => { const P = c.S.my; P.x = x; P.z = z; P.y = c.hgt(x, z); P.inv = 1e9; c.S.aim.h = h || 0; c.S.aim.p = -.25; };
const tap = async (c, k) => { c.S.input[k] = true; await run(.06); c.S.input[k] = false; await run(.06); };
const same = (A, B) => A.length === B.length && A.every((f, i) => f.id === B[i].id && f.k === B[i].k && f.team === B[i].team && Math.abs(f.x - B[i].x) < .11 && Math.abs(f.z - B[i].z) < .11);

(async () => {
  await N.start(); console.log('server: ' + N.SERVER + '\npage:   ' + H.PAGE);
  const host = await client('Host', 'tank', 'abrams'), g1 = await client('Azul', 'inf', 'blueRifle'), g2 = await client('Verm', 'inf', 'redRifle');
  const FORT = host.$('FORT'), TR = FORT.trench, BG = FORT.bags, T = host.S.T, hd = host.$('hdist'), built = c => c.S.forts.filter(f => !f.pre);
  await run(1);
  ok(host.S.host && host.Net.ft && g1.Net.ft && g2.Net.ft, 'the server knows trenches and sandbags (fcap)');
  const pre = host.S.forts.filter(f => f.pre);
  ok(pre.length > 60 && same(pre, g1.S.forts) && same(pre, g2.S.forts) && g1.S.forts.every(f => f.prog === 1 && g1.S.T.byId[f.id] === f.o), pre.length + ' works are dug before the match, the same on the host and on both guests, under the same ids');
  /* level ground where a trench 7 m ahead and a wall 4.5 m to the left are both allowed */
  const r = T.routes[0]; let p = null;
  for (let k = 0; !p && k < 400; k++) { const q = host.$('routeAt')(r, r.len / 2 + 900 + k * 20), x = q.x - q.dz * 120, z = q.z + q.dx * 120; if (!host.fortWhy(1, 0, x + 7, z, 0) && !host.fortWhy(2, 0, x, z - 4.5, Math.PI / 2) && Math.abs(host.hgt(x + 7, z + 7) - host.hgt(x + 7, z - 7)) < .5) p = { x, z }; }

  console.log('-- a guest digs a trench and stacks sandbags; everyone sees them rise --');
  put(g1, p.x, p.z); put(g2, p.x + 500, p.z); await run(1);
  await tap(g1, 'build'); await tap(g1, 'build'); ok(g1.S.fm && g1.S.fm.k === 1 && g1.S.fm.why === '', 'the guest\'s trench outline is valid where it stands');
  await tap(g1, 'fire'); await until(() => built(host)[0] && built(g1)[0] && built(g2)[0]);
  const th = built(host)[0], t1 = built(g1)[0], t2 = built(g2)[0];
  ok(th && t1 && t2 && th.id === t1.id && t1.id === t2.id && th.id >= T.fid + FORT.pre && th.id < T.nid && th.k === 1 && th.team === 0 && hd(th, t2) < .2 && !g1.S.fw === false, 'the host started it under id ' + (th && th.id - T.fid) + ' of the works\' slots, and both guests have it at the same place');
  let seen = [[], []], tDone = null;
  await run(TR.time + 6, () => { [t1, t2].forEach((f, i) => { const s = f.prog >= 1 ? 3 : f.prog > .66 ? 2 : f.prog > .33 ? 1 : 0; if (!seen[i].includes(s)) seen[i].push(s); }); if (tDone === null && th.prog >= 1) tDone = host.S.t; return !(t1.prog >= 1 && t2.prog >= 1); });
  ok(seen[0].join() === '0,1,2,3' && seen[1].join() === '0,1,2,3' && Math.abs(t1.prog - th.prog) < .02, 'both guests saw it deepen and finish (on the host ' + Math.round(tDone) + ' s after the match began, one builder)');
  put(g1, th.x, th.z); await run(1.5); await until(() => { const q = g2.Net.ghosts.get(g1.id), w = host.Net.ghosts.get(g1.id); return q && w && q.dg > TR.depth - .05 && w.dg > TR.depth - .05; });
  const ghost = g2.Net.ghosts.get(g1.id), gh = host.Net.ghosts.get(g1.id);
  ok(g1.S.my.dg > TR.depth - .05 && g1.S.my.fc === t1 && ghost && ghost.dg > TR.depth - .05 && Math.abs(ghost.y - (g2.hgt(ghost.x, ghost.z) - TR.depth)) < .1 && gh.fc === th, 'the guest\'s soldier stands in it, ' + TR.depth + ' m down, on its own client, on the host and on the other guest');
  put(g1, p.x, p.z, Math.PI / 2); await run(.5); await tap(g1, 'build'); const k2 = g1.S.fm && g1.S.fm.k, why2 = g1.S.fm && g1.S.fm.why; await tap(g1, 'fire'); await until(() => built(host)[1]); for (let i = 0; i < 20 && g1.S.fm; i++) await tap(g1, 'build'); await run(BG.time + 1); await until(() => built(g2)[1] && built(g2)[1].prog >= 1 && built(g1)[1].prog >= 1);   // N on through the posts and the engineers' walls (11-13) closes the mode: six taps no longer did, and the next site was a T-wall
  const bh = built(host)[1], b1 = built(g1)[1], b2 = built(g2)[1];
  ok(k2 === 2 && why2 === '' && bh && b1 && b2 && bh.k === 2 && bh.id === b2.id && bh.prog >= 1 && b2.prog >= 1 && !g1.S.fm, 'N again and a click: sandbags, finished ' + (BG.time) + ' s later on everyone');
  ok(g2.pushOut(b2.o, b2.x, b2.z, 1) && !!g2.ray(b2.x + 5 * Math.cos(b2.a), b2.y + .5, b2.z - 5 * Math.sin(b2.a), b2.x - 5 * Math.cos(b2.a), b2.y + .5, b2.z + 5 * Math.sin(b2.a), 0), 'on a guest the wall is solid for a body and for a round');

  console.log('-- a request the host does not accept --');
  g1.Net.fbuild({ k: 1, x: p.x + 300, z: p.z, a: 0 }); g1.S.fw = { k: 1, x: p.x + 300, z: p.z, T: g1.S.t + 2.5 }; await run(3.2);
  ok(built(host).length === 2 && built(g1).length === 2 && !g1.S.fw, 'a trench asked for 300 m from the soldier is not started, and the guest stops waiting');

  console.log('-- damage: a guest breaches the wall and shells a trench dug before the match --');
  g2.hitObj(b2.o, 30, g2.S.my); await until(() => g1.S.os[bh.id] === 1 && g2.S.os[bh.id] === 1); const mid = [host, g1, g2].map(c => c.S.os[bh.id]).join('');
  g2.hitObj(b2.o, 30, g2.S.my); await until(() => built(g1).length === 1 && built(g2).length === 1);
  ok(mid === '111' && built(host).length === 1 && built(g1).length === 1 && built(g2).length === 1 && !host.S.T.byId[bh.id], 'the wall is damaged, then gone, on all three (stages ' + mid + ' on the way)');
  const pd = pre.find(f => f.k === 1 && f.team === 0), g2pd = g2.S.forts.find(f => f.id === pd.id); g2.hitObj(g2pd.o, 100, g2.S.my); await until(() => g1.S.os[pd.id] === 1 && g2.S.os[pd.id] === 1); const st1 = [host, g1, g2].map(c => c.S.os[pd.id]).join('');
  g2.hitObj(g2pd.o, 100, g2.S.my); await until(() => [host, g1, g2].every(c => !c.S.forts.some(f => f.id === pd.id)));
  ok(st1 === '111' && [host, g1, g2].every(c => !c.S.forts.some(f => f.id === pd.id)), 'a pre-dug trench hit by a guest goes through the same stages on all three and is gone');
  const pd2 = pre.find(f => f.k === 1 && f.team === 1); host.hitObj(pd2.o, 90, null); await until(() => g2.S.os[pd2.id] === 1);

  console.log('-- a late joiner --');
  const g3 = await client('Tard', 'inf', 'blueSaw'); await until(() => built(g3).length === 1 && g3.S.os[pd2.id] === 1 && !g3.S.forts.some(f => f.id === pd.id));
  ok(same(host.S.forts, g3.S.forts) && built(g3).length === 1 && built(g3)[0].prog >= 1 && g3.S.os[pd2.id] === 1 && !g3.S.forts.some(f => f.id === pd.id), 'it has every work the host has: the trench that was built, the pre-dug one that was hit at its stage, and not the one that is gone');

  console.log('-- mass tree felling on the wire --');
  const trees = T.objs.filter(o => o.k === 'tree' && o.id >= 30300).slice(0, 1500); for (const c of all) { c.sent = {}; c.msgs = {}; }
  for (const o of trees) host.hitObj(o, 999, null);
  await until(() => [g1, g2, g3].every(c => trees.every(o => c.S.os[o.id] === 2)), 8000);
  const down = c => trees.filter(o => c.S.os[o.id] === 2).length, by = host.sent.obj || 0, n = host.msgs.obj || 0;
  console.log('   1500 trees felled in one step: ' + n + ' obj messages, ' + by + ' bytes from the host (' + (by / 1500).toFixed(1) + ' a tree); felled on the guests: ' + [g1, g2, g3].map(down).join(', '));
  ok(by < 1500 * 12 && n <= 16 && [g1, g2, g3].every(c => down(c) === 1500), 'they go out in a few batched messages and every guest has them all down');
  for (const c of all) { c.sent = {}; c.msgs = {}; }
  const g4 = await client('Quin', 'inf', 'redMG'); await until(() => trees.every(o => g4.S.os[o.id] === 2), 8000);
  console.log('   for someone who joins after that: ' + (host.msgs.obj || 0) + ' obj messages, ' + (host.sent.obj || 0) + ' bytes, and ' + (host.sent.fort || 0) + ' bytes of fort');
  ok(down(g4) === 1500 && (host.sent.obj || 0) < 1500 * 12 + 800, 'the late joiner gets the whole felled wood in ' + (host.sent.obj || 0) + ' bytes');

  console.log('-- the host leaves in the middle of a site --');
  put(g1, p.x + 40, p.z); await run(.5); await tap(g1, 'build'); await tap(g1, 'build'); await tap(g1, 'fire'); await until(() => built(host)[1]); await tap(g1, 'build'); await tap(g1, 'build'); await run(8);
  const s1 = built(g1)[1], sh = built(host)[1], at = s1 && s1.prog, npre = host.S.forts.length;
  host.Net.close(); host.on = false; await N.sleep(150); await until(() => g1.S.host);
  ok(s1 && sh && at > .1 && at < .5 && g1.S.host && !g2.S.host, 'the next host takes over with the site at ' + Math.round(at * 100) + '%');
  await run(TR.time, () => s1.prog < 1); await until(() => built(g2)[1] && built(g2)[1].prog >= 1 && built(g3)[1] && built(g3)[1].prog >= 1);
  const s2 = built(g2)[1];
  ok(s1.prog >= 1 && s2 && s2.prog >= 1 && same(g1.S.forts, g2.S.forts) && same(g1.S.forts, g3.S.forts) && g1.S.forts.length === npre, 'under the new host the trench is finished on everyone, and all the other works are still there (' + g1.S.forts.length + ')');
  for (const c of all) c.Net.close(); N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exit(1); });
