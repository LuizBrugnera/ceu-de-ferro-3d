'use strict';
/* online, headless, through the real relay server on its own port: a host and two guests, each a full copy of the page's simulation.
   The host's director is switched off so that only what the test puts on the map is there. */
const N = require('./net'), H = require('./harness'), { ok, done } = H;
const all = [], dt = 1 / 60;
async function client(name, cls, model) {
  const c = H.load({ WebSocket: N.WebSocket, host: 'localhost:' + N.PORT, seed: name.length * 97 + 5 }), $ = c.$, Net = $('Net'), send = Net.send;
  c.name = name; c.$ = $; c.Net = Net; c.sent = {}; c.on = true;
  Net.send = (t, o) => { const k = t === 'ai' ? 'ai' + o.k : t; c.sent[k] = (c.sent[k] || 0) + JSON.stringify(Object.assign({ t }, o)).length; send(t, o); };
  await new Promise((res, rej) => {
    Net.ui.welcome = () => { c.newState('modern', model, { net: true, cls, mouse: true, host: Net.host === Net.id }); res(); };
    Net.ui.refused = code => rej(new Error(name + ' refused: ' + code)); Net.connect('modern', name, cls, model);
  });
  Object.defineProperty(c, 'S', { get: () => $('S') }); c.id = Net.id; c.plan = () => {}; all.push(c); return c;
}
async function run(secs, each) {
  for (let i = 0, n = Math.round(secs / dt); i < n; i++) {
    for (const c of all) if (c.on) { c.step(dt); c.Net.tick(dt); }
    if (each && each() === false) return false;
    if (i % 2 === 0) await new Promise(r => setImmediate(r));
  }
  await N.sleep(30); return true;
}
const aimAt = (c, t, up) => { const P = c.S.my, e = P.man ? c.$('manEye')(P) : { x: P.x, y: P.y + 3, z: P.z }, d = c.$('vnorm')({ x: t.x - e.x, y: c.$('bodyY')(t) + (up || 0) - e.y, z: t.z - e.z }); c.S.aim.h = Math.atan2(-d.z, d.x); c.S.aim.p = Math.asin(d.y); };
const put = (c, x, z) => { const P = c.S.my; P.x = x; P.z = z; P.y = c.hgt(x, z); };
const press = async (c, k) => { c.S.input[k] = true; await run(.05); c.S.input[k] = false; await run(.05); };
const score = (c, id) => c.Net.players.get(id);

(async () => {
  await N.start(); console.log('server: ' + N.SERVER + '\npage:   ' + H.PAGE);
  const host = await client('Host', 'tank', 'abrams'); host.director = () => {};
  const g1 = await client('Azul', 'inf', 'blueAD'), g2 = await client('Verm', 'inf', 'redAT');
  ok(host.S.host && !g1.S.host && host.Net.inf && g1.Net.inf, 'three players in the room, the first is the host, the server knows infantry');
  const r = host.S.T.routes[0], mid = r.len / 2, at = s => host.$('routeAt')(r, s), hd = host.$('hdist');
  await run(1);
  if (host.Net.sb) { const d = host.$('SPAWN').inf; ok(g1.S.my.man && hd(g1.S.my, at(r.len - d)) < 60 && g2.S.my.man && hd(g2.S.my, at(d)) < 60, 'soldiers enter beside the road out of their main base, ' + d + ' m along it'); }
  else ok(g1.S.my.man && hd(g1.S.my, at(mid + 1000)) < 120 && g2.S.my.man && hd(g2.S.my, at(mid - 1000)) < 120, 'with a server that knows no supply bases, soldiers enter beside the road at the old spawn, each on its own side of the middle');
  ok(!!host.Net.ghosts.get(g1.id) && host.Net.ghosts.get(g1.id).man && host.Net.ghosts.get(g2.id).id === 'redAT' && g1.Net.ghosts.get(host.id).kind === 'tank', 'everyone sees the others as what they are');

  console.log('-- host and guests see the same squads --');
  const p0 = at(mid - 300); let sq = host.addSquad(1, p0.x, p0.z, 0, mid - 300); sq.men.forEach(m => { m.ai = null; });
  host.spawnColumn(0, 0, 0, 1, 0, mid + 3600, 0, 1); const truck = host.S.units.find(u => u.kind === 'truck');
  for (const c of all) c.sent = {};
  await run(6);
  const same = g => host.S.men.filter(m => m.aid).every(m => { const o = g.Net.ai.get(m.aid); return o && o.net && o.id === m.id && o.team === m.team && hd(o, m) < 4 && o.st === m.st; });
  ok(sq.men.length === 6 && same(g1) && same(g2), 'the ' + sq.men.length + ' soldiers of a squad are on both guests, same kits, sides, stances, within 4 m');
  const tg = g1.Net.ai.get(truck.aid); ok(tg && tg.cargo && tg.cargo.length === 6, 'and the truck still carrying its squad is known as loaded');
  const B = c => Object.fromEntries(Object.entries(c.sent).map(([k, v]) => [k, Math.round(v / 6)]));
  const bh = B(host), bg = B(g1), tot = o => Object.values(o).reduce((a, b) => a + b, 0);
  console.log('   host upstream, bytes/s: ' + JSON.stringify(bh) + ' = ' + tot(bh) + ' (before infantry: ' + (tot(bh) - (bh.ai2 || 0)) + ')');
  console.log('   6 AI soldiers cost ' + bh.ai2 + ' B/s: ' + Math.round(bh.ai2 / 6 / (10 / 3)) + ' B a row at 3.3 Hz; at the cap of ' + host.$('IAI').cap + ' soldiers ' + Math.round(bh.ai2 / 6 * host.$('IAI').cap / 1000 * 10) / 10 + ' kB/s to each guest');
  console.log('   a soldier player sends ' + bg.mstate + ' B/s (mstate, 20 Hz); the host\'s tank sends ' + bh.gstate + ' B/s (gstate)');

  console.log('-- a guest kills AI soldiers and is credited --');
  put(g1, sq.men[0].x + 50, sq.men[0].z); g1.S.my.inv = 1e9;
  await run(45, () => { const t = [...g1.Net.ai.values()].find(o => o.man && !o.dead); if (!t) return false; aimAt(g1, t); g1.S.input.fire = true; g1.S.input.reload = g1.S.my.arms[0].mag === 0; });
  g1.S.input.fire = false; await run(1);
  const deadH = sq.men.filter(m => m.dead).length;
  ok(deadH >= 3, deadH + ' of 6 host soldiers are dead by the guest\'s rifle');
  ok(score(host, g1.id).ai === deadH && score(g2, g1.id).ai === deadH, 'and the scoreboard credits the guest with ' + score(host, g1.id).ai + ' AI kills on every client');

  console.log('-- AI soldiers kill a guest only through relayed hits --');
  for (const m of host.S.men) if (m.aid && !m.dead) host.killMan(m, null);
  await run(1); g1.S.my.inv = 0; put(g1, at(mid).x, at(mid).z);
  const DM = g1.damageMan; let local = 0, relayed = 0;
  g1.damageMan = (o, dmg, by, rx, h) => { const hp = o.hp; DM(o, dmg, by, rx, h); if (o === g1.S.my && o.hp < hp) { if (rx) relayed++; else local++; } };
  sq = host.addSquad(1, at(mid - 120).x, at(mid - 120).z, 0, mid - 120);
  const me1 = g1.S.my; await run(60, () => !me1.dead); await run(1);
  ok(me1.dead && relayed > 0 && local === 0, 'the guest died of ' + relayed + ' relayed hits and no local one');
  ok(me1.by < 0 && score(host, g1.id).deaths === 1, 'killed by an AI entity (' + me1.by + '), one death on the scoreboard');
  g1.damageMan = DM; for (const m of host.S.men) if (m.aid && !m.dead) host.killMan(m, null);

  console.log('-- a rocket soldier (player) kills a player tank from the flank --');
  await run(6); const T = host.S.my, w = g2.S.my.arms[1].d; T.inv = 0;
  put(g2, T.x - Math.sin(T.h) * 70, T.z - Math.cos(T.h) * 70); g2.S.my.inv = 1e9; await press(g2, 'yawL'); await run(1);
  const hp0 = T.hp; let shots = 0;
  await run(40, () => { const G = host.Net.ghosts.get(g2.id), d = hd(g2.S.my, T), tt = d / w.spd; aimAt(g2, g2.Net.ghosts.get(host.id), .125 * 9.81 * tt * tt - .6); g2.S.input.fire = (g2.S.t * 2 | 0) % 2 === 0; shots = 4 - g2.S.my.arms[1].mag - g2.S.my.arms[1].res; return !T.dead; });
  g2.S.input.fire = false; await run(1);
  ok(T.dead && T.by === g2.id, 'the host\'s Abrams (' + hp0 + ' hp) is destroyed by ' + shots + ' RPG rounds into its side, and it knows who did it');
  ok(score(g1, g2.id).kills === 1 && score(g1, host.id).deaths === 1, 'one kill for the soldier and one death for the tank on the scoreboard');

  console.log('-- a shoulder SAM (player) shoots down a plane --');
  await run(6); const P1 = g1.S.my; P1.inv = 1e9; await press(g1, 'yawL');
  const pl = host.addPlane('su57', 1, P1.x + 1300, P1.y + 500, P1.z, 0, true, 'fighter'); pl.flares = 0; const y0 = P1.y + 500; let launched = 0;
  await run(40, () => { const a = host.S.t * 150 / 1300; if (!pl.dead) { pl.x = P1.x + Math.cos(a) * 1300; pl.z = P1.z + Math.sin(a) * 1300; pl.y = y0; pl.v = { x: -Math.sin(a) * 150, y: 0, z: Math.cos(a) * 150 }; pl.think = 9; pl.flares = 0; }
    const t = g1.Net.ai.get(pl.aid); if (t) { aimAt(g1, t); g1.S.input.fire = true; } launched = 2 - g1.S.my.arms[1].mag - g1.S.my.arms[1].res; return !pl.dead; });
  g1.S.input.fire = false; await run(1);
  ok(pl.dead && launched >= 1, 'the Su-57 (120 hp) is shot down with ' + launched + ' Stinger(s)');
  ok(score(host, g1.id).ai === deadH + 1, 'credited to the soldier (' + score(host, g1.id).ai + ' AI kills)');

  console.log('-- mid-match: a soldier takes a tank, and goes back on foot --');
  const sw1 = g2.swapTo('tank', 't90'); await run(6);
  ok(sw1 === '' && g2.S.my.kind === 'tank' && g1.Net.ghosts.get(g2.id).kind === 'tank' && score(g1, g2.id).cls === 'tank', 'the soldier is now a T-90 for everyone');
  const sw2 = g2.swapTo('inf', 'redRifle'); await run(6);
  ok(sw2 === '' && g2.S.my.man && g1.Net.ghosts.get(g2.id).man && g1.Net.ghosts.get(g2.id).id === 'redRifle', 'and a rifleman again');
  ok(g2.swapTo('inf', 'blueRifle') === 'no', 'a kit of the other side is not offered');

  console.log('-- host migration with a squad on foot and one still in its truck --');
  sq = host.addSquad(1, at(mid - 400).x, at(mid - 400).z, 0, mid - 400); await run(3);
  const before = host.S.men.filter(m => m.aid && !m.dead && m.team === 1).map(m => m.aid).sort(), loaded = !!truck.cargo && !truck.dead;
  g1.$('CMD').scout.min = 99;   // the new host's commander would send the truck's squad ahead on foot through a stretch it distrusts
  host.on = false; host.Net.close(); await N.sleep(150); await run(3);
  // the new host's own director may already have sent a squad of side 1 out (and side 0 one flown in by a transport helicopter): only the adopted count
  const mine = g1.S.men.filter(m => m.aid && !m.dead && !m.net && m.ai && m.sq && m.team === 1 && before.includes(m.aid)), sq1 = g1.S.squads.filter(q => q.men[0] && q.men[0].team === 1 && before.includes(q.men[0].aid)), q1 = sq1[0];
  ok(g1.S.host && !g2.S.host, 'the earliest guest is the new host');
  ok(mine.length === before.length && mine.map(m => m.aid).sort().join() === before.join() && sq1.length === 1 && q1.men.length === before.length, 'it adopted the ' + mine.length + ' soldiers on foot as one squad with a place on the road');
  const tk = g1.S.units.find(u => u.kind === 'truck'); ok(loaded && tk && !tk.net && tk.ai && tk.cargo && tk.cargo.length === 6, 'and the truck with its squad still aboard');
  const s0 = q1.s, x0 = mine[0].x; await run(20);
  ok(mine.some(m => Math.hypot(m.x - x0, 0) > 1 || m.ctl.fire || m.ai.tgt) && same2(g1, g2), 'the adopted squad goes on with its battle, and the other guest follows it from the new host');
  g1.dismount(tk); await run(3);
  ok(tk.sq && g1.S.squads.includes(tk.sq) && g1.S.squads.includes(q1) && g1.S.men.filter(m => m.aid && !m.dead).every(m => g2.Net.ai.get(m.aid)), 'the truck lets its squad off under the new host, and the guest sees all ' + g1.S.men.filter(m => m.aid && !m.dead).length + ' soldiers');
  function same2(a, b) { return a.S.men.filter(m => m.aid && !m.dead).every(m => { const o = b.Net.ai.get(m.aid); return o && hd(o, m) < 6; }); }
  for (const c of all) c.Net.close(); N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exit(1); });
