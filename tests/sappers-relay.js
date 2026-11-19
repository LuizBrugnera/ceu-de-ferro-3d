'use strict';
/* the relay server and the sappers, the rocket launchers and the posts: welcome sap 1, the sapper kits and the launchers on their sides,
   mine from the host (each player sees its side's mines and the ones its side knows, a spectator all), mboom to the room, mreq from a
   soldier to the host alone, dint from the host's dome to the room, fort and fbuild with the kinds of the posts, and the mines kept for the next host */
const N = require('./net'), { ok, done } = require('./harness');
(async () => {
  await N.start(); console.log('server: ' + N.SERVER);
  const join = async (room, cls, model) => { const c = await N.raw(); c.send({ t: 'join', room, name: model, cls, model }); c.w = await c.wait('welcome', 800); c.err = c.w ? null : await c.wait('error', 200); c.id = c.w && c.w.id; return c; };
  const none = async (c, t) => !(await c.wait(t, 150));
  const h = await join('modern', 'tank', 'abrams'), a = await join('modern', 'inf', 'blueEng'), b = await join('modern', 'inf', 'redEng'), sp = await N.raw();
  sp.send({ t: 'join', room: 'modern', name: 'spec', cls: 'spec', model: '' }); sp.w = await sp.wait('welcome', 800);
  ok(h.w && h.w.sap === 1 && a.w && b.w, 'welcome says sap: 1, and the sapper kits join');
  const side = c => c.w.players.find(p => p.id === c.id);
  const p = (await (async () => { const c = await join('modern', 'inf', 'blueRifle'); const w = c.w; c.close(); return w; })()).players;
  ok(p.find(o => o.id === a.id).model === 'blueEng' && p.find(o => o.id === b.id).model === 'redEng', 'each sapper kit is on its own side');
  const w2 = await join('ww2', 'inf', 'pionier'), w3 = await join('ww2', 'inf', 'engineer'), r1 = await join('ww2', 'art', 'pzwerfer'), r2 = await join('ww2', 'art', 'bm13'), r3 = await join('modern', 'art', 'm270'), r4 = await join('modern', 'art', 'bm21');
  ok([w2, w3, r1, r2, r3, r4].every(c => c.w), 'the 1944 sappers and the four rocket launchers join');
  const bad = await join('modern', 'inf', 'pionier'); ok(!bad.w && bad.err && bad.err.code === 'model', 'a 1944 sapper is no kit of the modern room');
  for (const c of [w2, w3, r1, r2, r3, r4, bad]) c.close();
  await N.sleep(80); for (const c of [h, a, b, sp]) c.got.forEach(m => { m.seen = 1; });

  const own0 = [11, 0, 0, 100.5, -20.5, 0], own1 = [12, 1, 1, 300, 40, 0], known = [13, 0, 1, 50, 5, 1], both = [14, 1, 0, 60, 6, 3];
  h.send({ t: 'mine', q: 7, i: 0, n: 1, e: [own0, own1, known, both] });
  const ma = await a.wait('mine'), mb = await b.wait('mine'), ms = await sp.wait('mine');
  const ids = m => m ? m.e.map(r => r[0]).join() : 'none';
  console.log('   side 0 gets ' + ids(ma) + ', side 1 ' + ids(mb) + ', the spectator ' + ids(ms));
  ok(ma && ids(ma) === '11,13,14' && mb && ids(mb) === '12,13,14' && ms && ids(ms) === '11,12,13,14' && ma.q === 7 && ma.n === 1 && await none(h, 'mine'),
    'mine: each player gets its side\'s mines and those its side knows; the spectator all of them; the host none back');
  a.send({ t: 'mine', q: 1, i: 0, n: 1, e: [own0] }); ok(await none(b, 'mine'), 'mine from a guest is dropped');
  for (const m of [{ q: 1, i: 0, n: 1, e: [[11, 2, 0, 1, 2, 0]] }, { q: 1, i: 0, n: 1, e: [[0, 0, 0, 1, 2, 0]] }, { q: 1, i: 0, n: 1, e: [[11, 0, 2, 1, 2, 0]] }, { q: 1, i: 0, n: 1, e: [[11, 0, 0, 1, 2, 4]] }, { q: 1, i: 0, n: 1, e: [own0.slice(0, 5)] }, { q: 1, i: 1, n: 1, e: [] }, { q: 1, i: 0, n: 5, e: [] }, { q: 1, i: 0, n: 1, e: new Array(41).fill(own0) }, { i: 0, n: 1, e: [] }])
    h.send(Object.assign({ t: 'mine' }, m));
  ok(await none(a, 'mine') && await none(sp, 'mine'), 'malformed mine is dropped: a kind, an id, a side or a known that is none, a short row, a part outside its count, more than 4 parts or 40 rows, no list number');

  h.send({ t: 'mboom', id: 13, k: 0, s: 1, p: [50, 5] }); const ba = await a.wait('mboom'), bb = await b.wait('mboom');
  ok(ba && bb && ba.id === 13 && ba.p.join() === '50,5' && ba.s === 1 && await none(h, 'mboom'), 'mboom from the host reaches the room');
  a.send({ t: 'mboom', id: 13, k: 0, s: 1, p: [50, 5] }); ok(await none(b, 'mboom'), 'mboom from a guest is dropped');

  a.send({ t: 'mreq', k: 1, p: [10.5, 20.5] }); a.send({ t: 'mreq', k: 2, id: 13 }); const q1 = await h.wait('mreq');   // the second right behind the first: no wait between them for a loaded machine to stretch past 300 ms
  ok(q1 && q1.from === a.id && q1.k === 1 && q1.p.join() === '10.5,20.5' && await none(b, 'mreq'), 'mreq (lay) from a soldier goes to the host alone, with its sender');
  ok(await none(h, 'mreq'), 'a second one within 300 ms is dropped');
  await N.sleep(320); a.send({ t: 'mreq', k: 2, id: 13 }); const q2 = await h.wait('mreq'); ok(q2 && q2.k === 2 && q2.id === 13 && !('p' in q2), 'then a lift passes, with the mine\'s id');
  await N.sleep(320); h.send({ t: 'mreq', k: 3, id: 11 }); ok(await none(a, 'mreq') && await none(h, 'mreq'), 'the host\'s own goes nowhere');
  await N.sleep(320); for (const m of [{ k: 4, id: 1 }, { k: 0 }, { k: 2 }, { k: 3, id: 70000 }, { k: 1, p: [1] }]) { a.send(Object.assign({ t: 'mreq' }, m)); await N.sleep(320); }
  ok(await none(h, 'mreq'), 'malformed mreq is dropped');
  const tk = await join('modern', 'tank', 'leo2'); tk.send({ t: 'mreq', k: 3, id: 11 }); const q3 = await h.wait('mreq'); await N.sleep(320); tk.send({ t: 'mreq', k: 0, p: [1, 2] });
  ok(q3 && q3.k === 3 && await none(h, 'mreq'), 'a vehicle may say it set a mine off, but lays none');

  const row = k => [55100 + k, k, 0, 1234.5, -678.9, 1.57, 42, 150, 0];
  h.send({ t: 'fort', i: 0, n: 1, e: [3, 4, 5, 6].map(row) }); const f1 = await a.wait('fort');
  ok(f1 && f1.e.map(r => r[1]).join() === '3,4,5,6', 'fort carries the posts (kinds 3 to 6)');
  h.send({ t: 'fort', i: 0, n: 1, e: [row(11)] }); ok(await none(a, 'fort'), 'and no kind past them, the pontoon (7), the radio relay (8), the rebuild (9) and the new bridge (10)');
  await N.sleep(720); a.send({ t: 'fbuild', k: 6, p: [1, 2], a: 0 }); const fb = await h.wait('fbuild'); ok(fb && fb.k === 6, 'fbuild asks for one');
  await N.sleep(720); a.send({ t: 'fbuild', k: 11, p: [1, 2], a: 0 }); ok(await none(h, 'fbuild'), 'not for a kind that is none (7 is the pontoon, 8 the radio relay, 9 the rebuild, 10 the new bridge)');

  h.send({ t: 'dint', f: 55106, k: 4000000000, s: 1 }); const da = await a.wait('dint'), db = await b.wait('dint'), ds = await sp.wait('dint');
  ok(da && db && ds && da.f === 55106 && da.k === 4000000000 && da.s === 1 && await none(h, 'dint'), 'dint (the host\'s dome engaged a round) reaches the room and the spectator');
  a.send({ t: 'dint', f: 55106, k: 1, s: 0 }); ok(await none(b, 'dint'), 'dint from a guest is dropped');
  for (const m of [{ f: 55106, k: 1, s: 2 }, { f: -1, k: 1, s: 0 }, { f: 55106, k: 2 ** 32, s: 0 }, { f: 55106, k: 1.5, s: 0 }, { k: 1, s: 0 }]) h.send(Object.assign({ t: 'dint' }, m));
  ok(await none(a, 'dint'), 'malformed dint is dropped: a result that is none, a dome or a key out of range');
  /* the host leaves: the server hands its last whole list, every side's mines with the hidden ones and its last id, to the next host alone */
  h.send({ t: 'mine', q: 20, i: 0, n: 2, e: [own0, own1], s: 77 }); h.send({ t: 'mine', q: 20, i: 1, n: 2, e: [known, both], s: 77 });
  h.send({ t: 'mine', q: 21, i: 0, n: 2, e: [own0], s: 78 });
  await N.sleep(120); for (const c of [a, b, sp, tk]) c.got.forEach(m => { m.seen = 1; });
  h.close(); const nh = await a.wait('host', 1500);
  const kept = a.got.filter(m => m.t === 'mine' && !m.seen), at = m => a.got.indexOf(m);
  console.log('   the next host gets ' + kept.map(m => m.e.map(r => r[0]).join() + ' (s ' + m.s + ')').join('; '));
  ok(nh && nh.id === a.id && kept.length === 1 && ids(kept[0]) === '11,12,13,14' && kept[0].s === 77 && at(kept[0]) < at(nh),
    'the host leaves: the next host is sent the last whole mine list, the other side\'s hidden mine with it, and the last id, before it is named');
  ok(await none(b, 'mine') && await none(sp, 'mine') && await none(tk, 'mine'), 'nobody else is sent the kept list');
  for (const c of [a, b, sp, tk]) c.close(); N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exit(1); });
