'use strict';
/* supply bases online, headless, through the real relay server on its own port: a guest's request, every stage on every client, a late
   joiner, entering at a base, a guest's demolition charge, and construction that goes on under the next host. BW=1 only measures what
   the host sends in a full battle (compare PAGE=<an older page>) */
const N = require('./net'), H = require('./harness'), { ok, done } = H;
const all = [], dt = 1 / 60;
async function client(name, cls, model, keep) {
  const c = H.load({ WebSocket: N.WebSocket, host: 'localhost:' + N.PORT, seed: name.length * 97 + 5 }), $ = c.$, Net = $('Net'), send = Net.send;
  c.name = name; c.$ = $; c.Net = Net; c.sent = {}; c.on = true;
  Net.send = (t, o) => { const k = t === 'ai' ? 'ai' + o.k : t; c.sent[k] = (c.sent[k] || 0) + JSON.stringify(Object.assign({ t }, o)).length; send(t, o); };
  await new Promise((res, rej) => {
    Net.ui.welcome = () => { c.newState('modern', model, { net: true, cls, mouse: true, host: Net.host === Net.id }); res(); };
    Net.ui.refused = code => rej(new Error(name + ' refused: ' + code)); Net.connect('modern', name, cls, model);
  });
  /* !keep: a quiet battle, no AI director, planner or helicopters (theirs would shell the bases under test from a few km off) */
  Object.defineProperty(c, 'S', { get: () => $('S') }); c.id = Net.id; if (!keep) { c.director = () => {}; c.plan = () => {}; Object.assign($('HDIR'), { atk: [0, 0, 0, 0], lift: [0, 0, 0, 0] }); } all.push(c); return c;
}
async function run(secs, each) {
  for (let i = 0, n = Math.round(secs / dt); i < n; i++) {
    for (const c of all) if (c.on) { if (c.S.cd) c.S.cd = {}; c.step(dt); c.Net.tick(dt); }   // no countdown on a lost model: what is checked here is the return, not the wait
    if (each && each() === false) return false;
    if (i % 2 === 0) await new Promise(r => setImmediate(r));
  }
  await N.sleep(40); return true;
}
const put = (c, x, z) => { const P = c.S.my; P.x = x; P.z = z; P.y = c.hgt(x, z); P.inv = 1e9; c.S.aim.h = 0; c.S.aim.p = -.25; };
const tap = async (c, k) => { c.S.input[k] = true; await run(.06); c.S.input[k] = false; await run(.06); };

(async () => {
  await N.start(); console.log('server: ' + N.SERVER + '\npage:   ' + H.PAGE);
  if (process.env.BW) {
    const host = await client('Host', 'plane', 'f22', true), g = await client('Verm', 'plane', 'su57', true);
    await run(20); for (const c of all) c.sent = {};
    const T = 60; let men = 0, n = 0; await run(T, () => { if (++n % 60 === 0) men += host.S.men.filter(m => m.aid && !m.dead).length; });
    const B = Object.fromEntries(Object.entries(host.sent).map(([k, v]) => [k, Math.round(v / T)])), tot = Object.values(B).reduce((a, b) => a + b, 0);
    console.log('host upstream over ' + T + ' s of a full battle, bytes/s by message: ' + JSON.stringify(B) + ' = ' + tot + ' B/s; AI soldiers alive ' + Math.round(men / T) + ' (mean), planes ' + host.S.planes.filter(p => p.aid).length + ', vehicles ' + host.S.units.filter(u => u.aid).length + ', bases ' + (host.S.sup ? host.S.sup.length : 0) + '; soldiers a guest holds ' + g.S.men.filter(m => m.net && !m.dead).length);
    for (const c of all) c.Net.close(); N.stop(); return;
  }
  const host = await client('Host', 'tank', 'abrams'), g1 = await client('Azul', 'inf', 'blueRifle'), g2 = await client('Verm', 'inf', 'redRifle');
  const BLD = host.$('BLD'), hd = host.$('hdist'), r = host.S.T.routes[0], nid = host.S.T.nid, HP = host.$('OBJ').supply.hp[0];
  ok(host.S.host && host.Net.sb && g1.Net.sb, 'the server knows supply bases (welcome sup: 1)');
  const spot = s0 => { for (let k = 0; ; k++) { const p = host.$('routeAt')(r, s0 + k * 25), x = p.x - p.dz * 70, z = p.z + p.dx * 70; if (!host.siteWhy(0, x, z, 0)) return { x, z }; } };
  await run(1);
  const main = host.$('routeAt')(r, r.len - host.$('SPAWN').inf);
  ok(hd(g1.S.my, main) < 60 && hd(host.S.my, host.$('routeAt')(r, r.len - host.$('SPAWN').tank)) < 60 && hd(g2.S.my, host.$('routeAt')(r, host.$('SPAWN').inf)) < 60, 'everyone on the ground enters at the main base of its side: ' + Math.round(hd(g1.S.my, g1.S.base[0])) + ' m and ' + Math.round(hd(g2.S.my, g2.S.base[1])) + ' m from the airfields');

  console.log('-- a guest builds; the host and the other guest see every stage --');
  const p = spot(r.len / 2 + 1200); put(g1, p.x - 11, p.z); put(g2, p.x + 600, p.z); await run(2.5);
  await tap(g1, 'build'); ok(g1.S.bm && g1.S.bm.why === '', 'the guest\'s outline is valid where it stands');
  await tap(g1, 'fire'); await run(.6);
  const bh = host.S.sup[0], b1 = g1.S.sup[0], b2 = g2.S.sup[0];
  ok(bh && b1 && b2 && bh.id === b1.id && b1.id === b2.id && bh.id >= nid + 32 && bh.team === 0 && hd(bh, b2) < .2 && g1.S.my.kit === 0, 'the host started the site under id ' + (bh && bh.id - nid) + ' of the dynamic slots, and both guests have it at the same place; the kit is spent');
  ok(!!g2.S.wob[b2.id - nid] && g2.pushOut(b2.o, b2.x, b2.z, 1) && g1.near(b1.x, b1.z, 5).includes(b1.o), 'on a guest it is solid too');
  const seen = [[], []]; let tDone = null;
  await run(BLD.time + 6, () => { [b1, b2].forEach((b, i) => { const s = b.prog >= 1 ? 3 : b.prog > .66 ? 2 : b.prog > .33 ? 1 : 0; if (!seen[i].includes(s)) seen[i].push(s); }); if (tDone === null && bh.prog >= 1) tDone = host.S.t; return !(b1.prog >= 1 && b2.prog >= 1); });
  ok(seen[0].join() === '0,1,2,3' && seen[1].join() === '0,1,2,3' && Math.abs(b1.prog - bh.prog) < .02, 'both guests saw it rise through every stage and finish (on the host after ' + Math.round(tDone) + ' s with one builder, the guest\'s soldier)');
  await tap(g1, 'build'); const again = g1.S.bm && g1.S.bm.why; await tap(g1, 'build');
  ok(again === 'obj' || again === 'kit' || again === 'base', 'a second one beside it is refused on the guest itself (' + again + ')');

  console.log('-- a request the host does not accept --');
  g1.S.my.kit = 1; const far = spot(r.len / 2 + 2600); g1.Net.build({ x: far.x, z: far.z, a: 0 }); g1.S.my.kit--; g1.S.bw = { x: far.x, z: far.z, T: g1.S.t + 2.5 }; await run(3.2);
  ok(host.S.sup.length === 1 && g1.S.my.kit === 1, 'a site ' + Math.round(hd(far, g1.S.my)) + ' m from the soldier that asks is not started (table: ' + BLD.far + ' m), and the kit comes back');
  host.send = host.Net.send; g2.S.my.kit = 1; put(g2, p.x + 700, p.z); await run(2.5); const e = g2.S.my; g2.Net.build({ x: e.x + 10, z: e.z, a: 0 }); await run(.5); g2.Net.build({ x: e.x + 10, z: e.z + 500, a: 0 }); await run(.5);
  ok(host.S.sup.filter(b => b.team === 1).length === 1, 'the other side builds its own; a second request within ' + BLD.cool + ' s is ignored');

  console.log('-- someone who joins later --');
  const g3 = await client('Tarde', 'inf', 'blueSaw'); await run(1.5);
  ok(g3.S.sup.length === 2 && g3.S.sup.every(b => host.S.sup.some(h => h.id === b.id && h.team === b.team && Math.abs(h.prog - b.prog) < .03)) && g3.S.sup.some(b => b.prog >= 1) && g3.S.sup.some(b => b.prog < 1), 'gets both bases as they are: ' + g3.S.sup.map(b => 'side ' + b.team + ' ' + Math.round(b.prog * 100) + '%').join(', '));

  console.log('-- entering at a base --');
  ok(g3.$('spawnWhy')(g3.S.sup.find(b => b.team === 0), 0) === '' && g3.$('spawnWhy')(g3.S.sup.find(b => b.team === 1), 0) === 'foe', 'the late guest may choose its side\'s finished base, not the enemy\'s site');
  g3.S.spawnAt = b1.id; g3.killMan(g3.S.my, null); await run(5);
  const gh = host.Net.ghosts.get(g3.id); ok(!g3.S.my.dead && hd(g3.S.my, bh) < BLD.spawn + 6 && gh && hd(gh, bh) < BLD.spawn + 8, 'its next soldier enters ' + Math.round(hd(g3.S.my, bh)) + ' m from the base, and the host sees it there');
  const P3 = g3.S.my; P3.arms[0].res = 0; P3.kit = 0; await run(host.$('MAN').fill + 1); ok(P3.arms[0].res > 0 && P3.kit === 1, 'and is resupplied there, kit included');

  console.log('-- host migration in the middle of a site --');
  const es = host.S.sup.find(b => b.team === 1), e2 = g2.S.sup.find(b => b.team === 1); put(g2, es.x + 9, es.z); await run(10); const before = es.prog, ids = host.S.sup.map(b => b.id + ':' + b.team).sort().join();
  host.on = false; host.Net.close(); await N.sleep(150); await run(2);
  const n1 = g1.S.sup.find(b => b.id === es.id);
  ok(g1.S.host && g1.S.sup.map(b => b.id + ':' + b.team).sort().join() === ids && Math.abs(n1.prog - before) < .06 && before > .1 && before < .9, 'the next host keeps both bases under their ids, the site at ' + Math.round(n1.prog * 100) + '% (it was ' + Math.round(before * 100) + '%)');
  let fin = null; await run(BLD.time, () => { if (fin === null && n1.prog >= 1) fin = 1; return !(n1.prog >= 1 && e2.prog >= 1); });
  ok(n1.prog >= 1 && e2.prog >= 1 && g3.S.sup.find(b => b.id === es.id).prog >= 1, 'construction went on under it and finished for everyone');

  console.log('-- a guest destroys a base --');
  for (const m of g1.S.men) if (m.psq && !m.dead) g1.killMan(m, null);   // the players' own squads (PSQ) would fight at the base too: only the charges here
  const tg = g1.S.sup.find(b => b.id === b1.id); put(g2, tg.x + 8.5, tg.z); await run(2.5);
  g2.S.my.chg = 2; await tap(g2, 'build'); await run(BLD.charge.fuse + .6); const st1 = g1.S.os[tg.id], hp1 = g1.S.oh[tg.id], g3b = g3.S.sup.find(b => b.id === tg.id), st3 = g3.S.os[tg.id];
  ok(st1 === 1 && Math.abs(hp1 - (HP - BLD.charge.dmg)) < 1 && st3 === 1 && g2.S.my.chg === 1, 'its first charge leaves the base damaged on the host (' + Math.round(hp1) + ' hp) and for the others');
  const m3 = g3.S.my; put(g3, tg.x - 9, tg.z); g3.S.my.inv = 0; await run(2); const hp3 = m3.hp;
  await tap(g2, 'build'); await run(BLD.charge.fuse + 1);
  ok(tg.dead && g3b.dead && g2.S.sup.find(b => b.id === tg.id).dead && !g1.S.wob[tg.id - nid] && !g3.S.wob[tg.id - nid], 'the second destroys it: gone on the host and on both guests, and no longer solid');
  ok(m3.hp < hp3 || m3.dead, 'the soldier of the late guest beside it was hurt by its ammunition, on its own client (' + hp3 + ' to ' + m3.hp.toFixed(0) + ' hp)');
  g3.S.spawnAt = tg.id; ok(g3.spawnBase() === null && g3.S.spawnAt === 0, 'and it is no entry any more');
  await run(BLD.ruin + 2); ok(!g1.S.sup.some(b => b.id === tg.id) && !g2.S.sup.some(b => b.id === tg.id) && g1.S.sup.length === 1, 'after ' + BLD.ruin + ' s its wreck is cleared everywhere');
  for (const c of all) c.Net.close(); N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exit(1); });
