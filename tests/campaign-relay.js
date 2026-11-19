'use strict';
/* the relay and campaigns and the threat board (F4): gcmd with the new keys (role, qrf) reaches the host, the question threats too, and the general's
   view keeps the board's rows (thb, at most 6) and the campaigns (camp, at most 4); an older host's view without them still passes */
const N = require('./net'), { ok, done } = require('./harness');
(async () => {
  await N.start(); console.log('server: ' + N.SERVER);
  const join = async (cls, model) => { const c = await N.raw(); c.send({ t: 'join', room: 'modern', name: model, cls, model }); c.w = await c.wait('welcome', 800); c.id = c.w && c.w.id; return c; };
  const none = async (c, t) => !(await c.wait(t, 150));
  const seeAll = cs => cs.forEach(c => c.got.forEach(m => { m.seen = 1; }));
  const h = await join('tank', 'abrams'), a = await join('inf', 'blueRifle'), all = [h, a];
  seeAll(all); a.send({ t: 'gclaim', on: 1 }); await a.wait('gctl');
  const cmds = [{ c: 'camp', H: 90, why: 'duas frentes' }, { c: 'camp', id: 4, op: 7, role: 'main' }, { c: 'dpol', pi: 3, inf: 2, qrf: 2 }, { c: 'triage', id: 9, p: -1 }, { c: 'qrf', id: 9, ids: [3, 4] }];
  for (const [i, c] of cmds.entries()) {
    seeAll(all); a.send({ t: 'gcmd', d: 'cmd', c, n: 40 + i }); const g = await h.wait('gcmd');
    ok(g && JSON.stringify(g.c) === JSON.stringify(c), 'gcmd ' + c.c + ' reaches the host as sent: ' + JSON.stringify(c));
    await N.sleep(270);
  }
  for (const [i, c] of [{ c: 'camp', role: 'MAIN' }, { c: 'dpol', qrf: 1.5 }, { c: 'camp', role: 'x'.repeat(11) }].entries()) {
    seeAll(all); a.send({ t: 'gcmd', d: 'cmd', c, n: 60 + i }); const r = await a.wait('gres'); ok(r && r.why === 'shape', 'a malformed ' + JSON.stringify(c) + ': gres shape');
    await N.sleep(270);
  }
  ok(await none(h, 'gcmd'), 'and none of those reach the host');
  seeAll(all); a.send({ t: 'gask', q: { q: 'threats' }, n: 70 }); const q = await h.wait('gask');
  ok(q && q.q.q === 'threats' && q.s === 0, 'gask threats reaches the host');
  const row = i => ({ id: i, k: 'pt', x: 1, z: 2, kx: 3, kz: 4, nm: 'B · Encruzilhada', val: 4, urg: 1.5, foe: 6, own: 4, sc: 6, st: 'resp', p: 0, why: '', n: 2, H: 30 });
  const gen = v => ({ t: 'gen', s: 0, T: 12.5, v: Object.assign({ doc: 'x', post: { k: 'att', s: 'text' }, road: null, ops: [], fm: [], sc: [], hit: null, focus: null, thr: null, want: null, gate: '', atkT: 0, ev: [], evT: -1 }, v), q: [1, 2, 3, 4, 5, 6] });
  const camp = [{ id: 4, st: 'form', H: 60, why: 'duas frentes', by: 'ai', ops: [{ id: 7, k: 'atk', r: 'main', nm: 'B' }, { id: 8, k: 'atk', r: 'sec', nm: 'C' }] }];
  seeAll(all); h.send(gen({ thb: [1, 2, 3, 4, 5, 6].map(row), camp })); const g1 = await a.wait('gen');
  ok(g1 && g1.v.thb.length === 6 && g1.v.thb[0].nm === 'B · Encruzilhada' && g1.v.camp.length === 1 && g1.v.camp[0].ops[1].r === 'sec', 'gen keeps six rows of the board and the campaigns');
  seeAll(all); h.send(gen({ thb: [1, 2, 3, 4, 5, 6, 7].map(row), camp: 'x' })); const g2 = await a.wait('gen');
  ok(g2 && Array.isArray(g2.v.thb) && !g2.v.thb.length && Array.isArray(g2.v.camp) && !g2.v.camp.length, 'seven rows or a campaign list that is not a list: dropped to empty lists, the rest of the view passes');
  seeAll(all); h.send(gen({})); const g3 = await a.wait('gen');
  ok(g3 && Array.isArray(g3.v.thb) && !g3.v.thb.length, 'an older host (no thb, no camp): the view passes with empty lists');
  for (const c of all) c.close(); N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exit(1); });
