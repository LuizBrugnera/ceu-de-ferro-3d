'use strict';
/* the economy online, headless, through the real relay server on its own port (PAGE=<page>, SERVER=<server>, PORT_T=<port>): solo is unchanged,
   the host's sites and each side's economy on the guests (and nothing of the other side), a site destroyed and a guest's damage to one, the
   general's claim and commands, a late joiner, the next host keeping the economy through its sealed backup, the sizes of the messages, and a
   page told by an older server (no eco, no gen). BEFORE: the page before the economy layer (default .work/eco/net-before.html; solo
   comparison skipped when missing). About 2 minutes */
const fs = require('fs'), path = require('path');
const N = require('./net'), H = require('./harness'), { ok, done } = H;
const BEFORE = process.env.BEFORE ? path.resolve(process.env.BEFORE) : path.join(H.ROOT, '.work', 'eco', 'net-before.html');
const all = [], dt = 1 / 60;
/* solo, to the last digit (tests/eco.js: print) */
const print = (C, S) => {
  let sum = 0; for (const k of ['men', 'units', 'planes']) for (const o of S[k]) sum += o.x * 1.3 + o.z + (o.hp || 0);
  return [S.men.length, S.units.length, S.squads.length, sum.toFixed(6), S.cq.tk.map(v => v.toFixed(4)).join(','), C.$('Math').random().toFixed(12)].join(' ');
};
const solo = page => { const C = H.load({ seed: 41, eco: false, page }), S = C.newState('ww2', C.$('ERAS').ww2.sides[0].fighter, { cls: 'plane' }); C.run(60); return print(C, S); };
/* a client of the room; keep: its director and plan stay (the host's); pre: a hook before it connects */
async function client(name, cls, model, keep, pre) {
  const c = H.load({ WebSocket: N.WebSocket, host: 'localhost:' + N.PORT, seed: name.length * 97 + 5, eco: true }), $ = c.$, Net = $('Net'), send = Net.send;
  c.name = name; c.$ = $; c.Net = Net; c.sent = {}; c.max = {}; c.last = {}; c.on = true; c.got = { ecs: [], gen: [] };
  Net.send = (t, o) => { const n = JSON.stringify(Object.assign({ t }, o)).length; c.sent[t] = (c.sent[t] || 0) + n; c.max[t] = Math.max(c.max[t] || 0, n); c.last[t] = o; send(t, o); };
  for (const t of ['ecs', 'gen']) { const f = Net.rx[t]; Net.rx[t] = m => { c.got[t].push(m.s); f(m); }; }
  if (pre) pre(c);
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
const J = v => JSON.stringify(v), live = c => c.S.eco.l.filter(e => !e.dead);
const res = d => { const o = {}; for (const k in d.res) if (d.res[k].length) o[k] = d.res[k].length; return o; };

(async () => {
  console.log('-- solo is unchanged (ww2, seed 41, 60 s, economy off: since slice 3 the economy\'s AI scouts, guards and strikes, so with it on the battle differs by design; tests/eco.js holds economy off against the page before the economy) --');
  if (fs.existsSync(BEFORE)) { const A = solo(), B = solo(BEFORE); console.log('   ' + A); ok(A === B, 'this page and ' + path.basename(BEFORE) + ' play the same solo battle'); }
  else console.log('  skip  no ' + BEFORE);

  await N.start(); console.log('server: ' + N.SERVER + '\npage:   ' + H.PAGE);
  const host = await client('Host', 'tank', 'abrams', true), g1 = await client('Azul', 'inf', 'blueRifle'), g2 = await client('Verm', 'inf', 'redRifle');
  const ECO = host.$('ECO'), sites = c => c.S.eco.l.filter(e => !e.dead && !e.gone);
  ok(host.Net.eco && host.Net.gen && g1.Net.eco && g1.Net.gen && !!host.S.eco && !!g1.S.eco && g1.S.eco.sim === false && host.S.eco.sim === true, 'the server knows the economy and the general (welcome eco 1, gen 1); the guest mirrors, the host simulates');

  console.log('-- sites and each side\'s economy on the guests --');
  await run(3);
  const hl = host.S.eco.l, gl = g1.S.eco.l;
  ok(hl.length >= 6 && gl.length === hl.length && hl.every(e => { const r = gl.find(q => q.id === e.id); return r && r.team === e.team && r.k === e.k && Math.hypot(r.x - e.x, r.z - e.z) < .2 && Math.abs(r.prog - e.prog) < .03; }), 'the guest has the host\'s ' + hl.length + ' sites: ids, sides, kinds, places, progress');
  ok(hl.every(e => g1.S.wob[e.id - g1.S.T.nid] && g1.S.os[e.id] === host.S.os[e.id]), 'on the guest they are world objects too');
  const d0 = host.S.eco.d[0], g0 = g1.S.eco.d[0], g1d = g1.S.eco.d[1];
  ok(Math.abs(g0.en - d0.en) < 10 && Math.abs(g0.mt - d0.mt) < 10 && g1.S.eco.ctl[0] === host.S.eco.ctl[0], 'its own side\'s stock is the host\'s (' + Math.round(g0.en) + ' / ' + Math.round(d0.en) + ' energy)');
  ok(g1d.en === ECO.start.en && g1d.mt === ECO.start.mt && g1d.q.length === 0 && Object.keys(g1d.kn).length === 0, 'the other side\'s economy is not on it: the start values, an empty queue');
  ok(g2.got.ecs.length > 0 && g2.got.ecs.every(s => s === 1) && g2.got.gen.length > 0 && g2.got.gen.every(s => s === 1) && g1.got.ecs.every(s => s === 0) && g1.got.gen.every(s => s === 0), 'each guest got only its own side\'s ecs and gen (' + g1.got.ecs.length + ' and ' + g2.got.ecs.length + ' ecs)');
  const rh = host.ecoVM(0).rows, rg = g1.ecoVM(0).rows, inst = r => (r.find(x => x.label === 'Instalações') || {}).value;
  ok(rh.length === rg.length && rh.every((r, i) => r.label === rg[i].label) && inst(rh) === inst(rg) && !!inst(rg), 'ecoVM runs on the guest: the same rows, "Instalações: ' + inst(rg) + '"');
  const pg = g1.S.eco.d[0], ph = host.$('popOf')(0);
  ok(rg.some(r => r.label === 'Plano de produção') && pg.pop && pg.pop.men === ph.men && pg.pop.air === ph.air && Object.keys(pg.pp.f).length >= 7, 'the production plan reaches the guest through the relay (ecs pp, po): ' + (rg.find(r => r.label === 'Teto de população') || {}).value);

  console.log('-- a site goes down; a guest hurts one --');
  const pow = host.S.eco.l.find(e => e.team === 1 && e.k === 'pow'), fab = host.S.eco.l.find(e => e.team === 1 && e.k === 'fab');
  host.hitObj(pow.o, 1e5, null); await run(2);
  const rp = c => c.S.eco.l.find(e => e.id === pow.id);
  ok(pow.dead && rp(g1) && rp(g1).dead && g1.S.os[pow.id] === 2 && rp(g2) && rp(g2).dead && g2.S.os[pow.id] === 2, 'the host destroys side 1\'s usina: dead on both guests (stage 2)');
  const hp0 = host.S.oh[fab.id]; g1.hitObj(g1.S.eco.l.find(e => e.id === fab.id).o, 40, g1.S.my); await run(1);
  const lost = hp0 - host.S.oh[fab.id]; ok(lost > 35 && lost < 45, 'a guest\'s 40 damage to a site reaches the host (' + lost.toFixed(1) + ' hp)');

  console.log('-- the general\'s commands --');
  g1.genClaim(1); await run(1.5);
  const gc0 = host.S.gctl && host.S.gctl[0];
  ok(gc0 && gc0.seat === 'me' && gc0.atk === 'me' && gc0.eco === 'ai' && gc0.def === 'ai' && gc0.sup === 'ai' && host.S.eco.ctl[0] === 'ai' && host.Net.gn[0] === g1.id && g1.Net.gk[0] === 1, 'the claim reaches the host: side 0 is commanded by a player, the AI keeps the economy, defence and support (the default assist)');
  let rc = null; g1.genDo({ c: 'ctl', k2: 'eco', k: 'me' }, r => { rc = r; }); await run(1.5);
  ok(rc && rc.ok && host.S.gctl[0].eco === 'me' && host.S.eco.ctl[0] === 'me', 'the player takes the economy domain: S.eco.ctl follows (' + (rc && rc.why) + ')');
  let r1 = null; g1.genDo({ c: 'make', k: 'tank', n: 1 }, r => { r1 = r; }); await run(2);
  ok(r1 && r1.ok && host.S.eco.d[0].q.some(q => q.k === 'tank'), 'a guest\'s make order is answered ok and the host queues the tank');
  ok(g1.S.glog && g1.S.glog.l[0].some(e => e.s.includes('Produz 1 × carro de combate')), 'its log shows the line the order wrote');
  let r2 = null; g2.genDo({ c: 'make', k: 'tank', n: 1 }, r => { r2 = r; }); await run(.5);
  ok(r2 && !r2.ok && r2.why === 'ctl', 'the other side\'s player is refused (' + (r2 && r2.why) + ')');
  g1.genClaim(0); await run(1.5);
  ok(host.S.eco.ctl[0] === 'ai' && g1.S.eco.ctl[0] === 'ai', 'giving it up puts the AI back');

  console.log('-- a late joiner --');
  const g3 = await client('Tarde', 'inf', 'blueSaw'); await run(2);
  const l3 = g3.S.eco.l, hl2 = host.S.eco.l.filter(e => !e.gone);
  ok(l3.length === hl2.length && hl2.every(e => l3.some(q => q.id === e.id && q.team === e.team && q.k === e.k && q.dead === e.dead)), 'it has the same sites (' + l3.length + ')');
  const t3 = g3.S.glog ? g3.S.glog.l[0].map(e => e.s) : [], th = host.S.glog.l[0].map(e => e.s);
  ok(t3.length > 0 && t3.every(s => th.includes(s)) && Math.abs(g3.S.eco.d[0].en - host.S.eco.d[0].en) < 20 && g3.S.glog.l[1].length === 0, 'and its side\'s economy and log, not the other side\'s (' + t3.length + ' entries)');

  console.log('-- the next host --');
  await run(6);
  const note = [0, 1].map(t => { const d = host.S.eco.d[t]; return { en: d.en, mt: d.mt, q: d.q.map(q => q.id), res: res(d), made: d.made }; }), ids = live(host).map(e => e.id).sort().join(), seq = host.S.eco.seq, kp = host.last.keep;
  ok(!!kp && J(kp).length < 16384 - 20, 'the host sent its backup (' + (kp && J(kp).length) + ' bytes)');
  host.on = false; host.Net.close(); await N.sleep(150); await run(2);
  const eco = g1.S.eco, mg = g2.got.ecs.filter(s => s === 1).length;
  ok(g1.S.host && eco.sim && g1.Net.kept === null, 'the next host is the earliest guest and simulates');
  ok(live(g1).map(e => e.id).sort().join() === ids, 'every site keeps its id');
  ok(eco.d[1].en !== ECO.start.en && eco.d[1].mt !== ECO.start.mt && Math.abs(eco.d[1].en - note[1].en) < 40 && Math.abs(eco.d[0].en - note[0].en) < 40 && Math.abs(eco.d[0].mt - note[0].mt) < 40 && Math.abs(eco.d[1].mt - note[1].mt) < 40, 'both sides\' stocks come from the backup, not the start (' + Math.round(eco.d[1].en) + ' / ' + Math.round(note[1].en) + ' energy of side 1)');
  const known = kp.e.d.map(d => d.q.map(q => q[0]));
  ok([0, 1].every(t => eco.d[t].q.every(q => known[t].includes(q.id) || q.id >= kp.e.seq)), 'the queues are the backup\'s (plus what the AI added since)');
  ok([0, 1].every(t => { const a = res(eco.d[t]), b = note[t].res; return Object.keys(Object.assign({}, a, b)).every(k => Math.abs((a[k] || 0) - (b[k] || 0)) <= 1); }), 'the reserves match within one unit a kind');
  for (let i = 0; i < 12 && !(eco.d[0].made > note[0].made && eco.d[1].made > note[1].made); i++) await run(5);   // a vehicle takes 30-45 s at a side's one factory: up to a minute
  ok(eco.d[0].made > note[0].made && eco.d[1].made > note[1].made && eco.seq > seq && g2.got.ecs.filter(s => s === 1).length > mg, 'within a minute: both sides keep producing (' + eco.d[0].made + ' and ' + eco.d[1].made + ' made) and the guest of side 1 still gets its ecs');

  console.log('-- sizes --');
  const big = host.max; ok(big.eco < 2048 && big.ecs < 2048 && big.keep < 16384, 'largest messages the host sent: eco ' + big.eco + ' B, ecs ' + big.ecs + ' B, gen ' + big.gen + ' B, keep ' + big.keep + ' B');

  console.log('-- an older server (no eco, no gen) --');
  const old = await client('Velho', 'inf', 'blueRifle', false, c => { const w = c.Net.rx.welcome; c.Net.rx.welcome = m => w(Object.assign({}, m, { eco: 0, gen: 0 })); });
  await run(3);
  ok(old.S.eco === null && old.genVM(old.S.me).cmd === false && !old.Net.eco && !old.Net.gen, 'the page is not told eco or gen: no economy, the reduced view, and no exception in 3 s');
  for (const c of all) c.Net.close(); N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exit(1); });
