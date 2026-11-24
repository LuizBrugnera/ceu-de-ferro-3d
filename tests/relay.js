'use strict';
/* the relay server: every message the infantry phase added or changed, and that the old ones still pass */
const N = require('./net'), { ok, done } = require('./harness');
(async () => {
  await N.start(); console.log('server: ' + N.SERVER);
  const join = async (cls, model, room) => { const c = await N.raw(); c.send({ t: 'join', room: room || 'modern', name: cls, cls, model }); c.w = await c.wait('welcome', 800); c.err = c.w ? null : await c.wait('error', 300); c.id = c.w && c.w.id; return c; };
  const h = await join('tank', 'abrams'), a = await join('inf', 'blueRifle'), b = await join('inf', 'redAT'), bad = await join('inf', 'schutze'), bad2 = await join('inf', 'nope');
  ok(h.w && h.w.inf === 1 && h.w.swap === 1, 'welcome says inf: 1');
  ok(a.w && b.w, 'a soldier of each side joins the modern room');
  ok(h.w.man2 === 1 && a.w.man2 === 1 && b.w.man2 === 1, 'welcome says man2: 1 to a player, so a guest general may order the M7 manoeuvres (they were refused as "the room is old")');
  ok(!bad.w && bad.err && bad.err.code === 'model' && !bad2.w, 'a 1944 kit or an unknown one is refused there');
  const w2 = await join('inf', 'bazookaman', 'ww2'); ok(!!w2.w, 'and a 1944 kit joins the 1944 room');
  const none = async (c, t) => !(await c.wait(t, 150));
  a.send({ t: 'mstate', p: [1, 2, 3], a: [.5, .1], v: [1, 0], s: 5, hp: 20, f: 1 });
  const ms = await h.wait('mstate'); ok(ms && ms.from === a.id && ms.s === 5 && ms.a.length === 2 && ms.f === 1, 'mstate from a soldier is relayed with its sender');
  h.send({ t: 'mstate', p: [1, 2, 3], a: [.5, .1], v: [1, 0], s: 5, hp: 20, f: 1 }); ok(await none(a, 'mstate'), 'mstate from a tank is dropped');
  a.send({ t: 'mstate', p: [1, 2, 3], a: [.5, .1, 0], v: [1, 0], s: 5, hp: 20, f: 1 }); a.send({ t: 'mstate', p: [1, 2, 3], a: [.5, .1], v: [1, 0], s: 9, hp: 20, f: 1 }); a.send({ t: 'mstate', p: [1, 2, 'x'], a: [.5, .1], v: [1, 0], s: 1, hp: 20, f: 1 });
  ok(await none(h, 'mstate'), 'malformed mstate is dropped');
  a.send({ t: 'gstate', p: [1, 2, 3], a: [0, 0, 0], v: [0, 0, 0], hp: 1, f: 0, d: 0 }); ok(await none(h, 'gstate'), 'gstate from a soldier is dropped');
  h.send({ t: 'gstate', p: [1, 2, 3], a: [0, 0, 0], v: [0, 0, 0], hp: 1, f: 0, d: 0 }); ok(!!(await a.wait('gstate')), 'gstate from a tank still passes');
  a.send({ t: 'toss', k: 1, p: [1, 2, 3], v: [4, 5, 6] }); const ts = await h.wait('toss'); ok(ts && ts.from === a.id && ts.k === 1, 'toss from a soldier is relayed');
  await N.sleep(60); b.got.forEach(m => { m.seen = 1; });
  h.send({ t: 'toss', k: 1, p: [1, 2, 3], v: [4, 5, 6] }); a.send({ t: 'toss', k: 5, p: [1, 2, 3], v: [4, 5, 6] }); a.send({ t: 'toss', k: 0, p: [1, 2], v: [4, 5, 6] });
  ok(await none(b, 'toss') , 'toss from a tank, of an unknown kind or malformed is dropped');
  h.send({ t: 'aitoss', id: -3, k: 2, p: [1, 2, 3], v: [4, 5, 6] }); const at = await a.wait('aitoss'); ok(at && at.id === -3 && at.k === 2, 'aitoss from the host is relayed');
  a.send({ t: 'aitoss', id: -3, k: 2, p: [1, 2, 3], v: [4, 5, 6] }); ok(await none(h, 'aitoss'), 'aitoss from a guest is dropped');
  const row = [-5, 2, 1, 22, 1, 100.5, -20.2, 1.57, 9];
  h.send({ t: 'ai', k: 2, e: [row, [-6, 7, 0, 10, 0, 1, 2, 3, 0]] }); const ai = await a.wait('ai'); ok(ai && ai.k === 2 && ai.e.length === 2 && ai.e[0][8] === 9, 'a snapshot of soldiers (k 2) from the host is relayed');
  await N.sleep(60); b.got.forEach(m => { m.seen = 1; });
  for (const e of [[-5, 99, 1, 22, 1, 1, 2, 3, 0], [-5, 2, 1, 22, 1, 1, 2, 3], [5, 2, 1, 22, 1, 1, 2, 3, 0], [-5, 2, 2, 22, 1, 1, 2, 3, 0], [-5, 2, 1, 22, 1, 1, 2, 3, 256], [-5, 'blueAT', 1, 22, 1, 1, 2, 3, 0]]) h.send({ t: 'ai', k: 2, e: [e] });
  a.send({ t: 'ai', k: 2, e: [row] });
  ok(await none(b, 'ai'), 'bad soldier rows (kit index, length, id, team, packed field) and a guest\'s snapshot are dropped');
  h.send({ t: 'ai', k: 2, e: [row.concat(5), [-6, 7, 0, 10, 0, 1, 2, 3, 0, 425983]] }); const say = await a.wait('ai');
  ok(say && say.k === 2 && say.e.length === 2 && say.e[0][9] === 5 && say.e[1][9] === 425983, 'a soldier row with what he calls out (a tenth number, SAY: its kind + 32 × (13 × the line\'s slot + 12), up to 425983) is relayed: with 9 only, the guests saw none of the AI\'s soldiers, and with a cap of 1024 not those with a line spoken (cf-pol-fluxos)');
  await N.sleep(60); b.got.forEach(m => { m.seen = 1; });
  for (const e of [row.concat(-1), row.concat(1.5), row.concat(1 << 19), row.concat(5, 6)]) h.send({ t: 'ai', k: 2, e: [e] });
  ok(await none(b, 'ai'), 'and a tenth number that is not a small whole one, or an eleventh, is still dropped');
  h.send({ t: 'ai', k: 1, e: [[-7, 'truck', 1, 25, 16, 1, 2, 3, 0, 0, 0, 0, 0, 0]] }); const tr = await a.wait('ai'); ok(tr && tr.k === 1 && tr.e[0][4] === 16, 'a vehicle row with the loaded-truck flag passes');
  h.send({ t: 'ai', k: 0, e: [[-8, 'su25', 1, 100, 0, 1, 2, 3, 0, 0, 0, 1, 1, 0, 0, 0]] }); ok((await a.wait('ai') || {}).k === 0, 'a plane row still passes');
  h.send({ t: 'ai', k: 1, e: [[-8, 'su25', 1, 100, 0, 1, 2, 3, 0, 0, 0, 1, 1, 0, 0, 0]] }); ok(await none(a, 'ai'), 'a plane row in a vehicle snapshot is dropped');
  h.send({ t: 'aidown', id: -5, by: a.id, model: 'redAT', det: 0 }); const ad = await b.wait('aidown'), sc = await b.wait('scores');
  ok(ad && ad.model === 'redAT' && sc && sc.players.find(p => p.id === a.id).ai === 1, 'aidown of a soldier is relayed and credited');
  h.send({ t: 'aidown', id: -5, by: a.id, model: 'schutze', det: 0 }); ok(await none(b, 'aidown'), 'aidown with a kit of the other era is dropped');
  a.send({ t: 'ord', i: 0, target: -8, m: a.id * 4096 + 1 }); const od = await h.wait('ord'); ok(od && od.from === a.id && od.m === a.id * 4096 + 1 && od.target === -8, 'a guided launch by a soldier goes as ord, with its missile id');
  a.send({ t: 'msl', id: a.id * 4096 + 1, k: 1, p: [1, 2, 3] }); const sk1 = await h.wait('msl'); ok(sk1 && sk1.id === a.id * 4096 + 1 && sk1.k === 1 && sk1.p.length === 3, 'what a missile\'s seeker did is relayed for its owner');
  a.send({ t: 'msl', id: h.id * 4096 + 1, k: 0 }); a.send({ t: 'msl', id: a.id * 4096 + 1, k: 3, p: [1, 2, 3] }); a.send({ t: 'msl', id: a.id * 4096 + 1, k: 9 }); ok(await none(h, 'msl'), 'not for someone else\'s missile, a place without its heading, or an unknown kind');
  a.send({ t: 'hit', to: h.id, dmg: 50, pt: 1, k: 1 }); const ht = await h.wait('hit'); ok(ht && ht.from === a.id && ht.by === null, 'a soldier\'s hit on a player reaches that player only'); ok(await none(b, 'hit'), '  and nobody else');
  h.send({ t: 'hit', to: a.id, dmg: 5, pt: 2, k: 0, by: -5 }); const h2 = await a.wait('hit'); ok(h2 && h2.by === -5 && h2.pt === 2, 'the host\'s AI hit on a soldier carries the zone and the AI id');
  b.send({ t: 'hit', to: a.id, dmg: 5, pt: 2, k: 0, by: -5 }); const h3 = await a.wait('hit'); ok(h3 && h3.by === null, 'a guest cannot speak for an AI entity');
  a.send({ t: 'aihit', to: -5, dmg: 7, pt: 1, k: 0 }); const ah = await h.wait('aihit'); ok(ah && ah.from === a.id && ah.pt === 1, 'a hit on an AI soldier goes to the host');
  h.send({ t: 'swap', cls: 'inf', model: 'blueAT' }); const s1 = await a.wait('swap'); ok(s1 && s1.id === h.id && s1.cls === 'inf' && !s1.no, 'a tank swaps to a soldier of its side');
  h.send({ t: 'swap', cls: 'inf', model: 'redAT' }); const s2 = await h.wait('swap', 300), s3 = await h.wait('swap', 300); ok((s3 || s2) && (s3 || s2).no === 1 && (s3 || s2).model === 'blueAT', 'and is refused one of the other side');
  h.send({ t: 'mstate', p: [1, 2, 3], a: [.5, .1], v: [1, 0], s: 0, hp: 20, f: 0 }); ok(!!(await a.wait('mstate')), 'after the swap its mstate passes');
  h.send({ t: 'swap', cls: 'tank', model: 'leo2' }); await a.wait('swap'); h.send({ t: 'shot', p: [1, 2, 3], v: [1, 2, 3] }); ok(!!(await a.wait('shot')), 'and back in a tank its shot does');
  a.send({ t: 'smoke', p: [1, 2, 3] }); ok(await none(h, 'smoke'), 'a soldier sends no vehicle smoke (its grenade is a toss)');
  a.send({ t: 'down', by: -5, det: 0 }); const dn = await h.wait('down'); ok(dn && dn.id === a.id && dn.by === -5, 'down by an AI soldier is announced');
  /* world objects: obj from the host to the room, ohit from anyone else to the host alone */
  ok(h.w.obj === 1, 'welcome says obj: 1');
  await N.sleep(60); for (const c of [h, a, b]) c.got.forEach(m => { m.seen = 1; });
  h.send({ t: 'obj', e: [12, 1, 345, 2] }); const o1 = await a.wait('obj'), o2 = await b.wait('obj'); ok(o1 && o2 && o1.e.join() === '12,1,345,2' && !o1.full && !(await h.wait('obj', 120)), 'obj from the host reaches every guest, not the host');
  h.send({ t: 'obj', e: [7, 2], full: 1 }); const o3 = await a.wait('obj'); ok(o3 && o3.full === 1, 'obj with full: 1 keeps the mark');
  await N.sleep(60); for (const c of [h, a, b]) c.got.forEach(m => { m.seen = 1; });
  a.send({ t: 'obj', e: [12, 2] }); ok(await none(b, 'obj') && await none(h, 'obj'), 'obj from a guest is dropped');
  for (const e of [[12], [12, 3], [12, -1], [-1, 1], [70000, 1], [1.5, 1], ['a', 1], [], new Array(202).fill(1)]) h.send({ t: 'obj', e }); h.send({ t: 'obj', e: 5 }); h.send({ t: 'obj' });
  ok(await none(a, 'obj'), 'malformed obj is dropped: odd length, a stage other than 0, 1 or 2, an id out of range, too long, not a list');
  h.send({ t: 'obj', e: new Array(200).fill(1) }); ok(!!(await a.wait('obj')), 'a list of 100 pairs passes');
  /* buildings: bld from the host to the room (states, fallen, storeys, snapshot), bhit from anyone else to the host alone */
  if (h.w.bld === 1) {
    h.send({ t: 'bld', e: [40000, 2, 7, 3], f: [12], m: [5, 20] }); const y1 = await a.wait('bld'), y2 = await b.wait('bld'); ok(y1 && y2 && y1.e.join() === '40000,2,7,3' && y1.f.join() === '12' && y1.m.join() === '5,20' && !y1.full && !(await h.wait('bld', 120)), 'bld from the host reaches every guest, not the host');
    h.send({ t: 'bld', s: [3, 'AQw/+', 9, ''], full: 1 }); const y3 = await a.wait('bld'); await b.wait('bld'); ok(y3 && y3.full === 1 && y3.s[1] === 'AQw/+', 'bld with a snapshot and full: 1 passes as it is');
    a.send({ t: 'bld', e: [1, 2] }); ok(await none(b, 'bld') && await none(h, 'bld'), 'bld from a guest is dropped');
    for (const m of [{ e: [1] }, { e: [1, 4] }, { e: [-1, 1] }, { e: [1.5, 1] }, { e: new Array(202).fill(1) }, { f: [70000] }, { f: 'x' }, { m: [1] }, { s: [1, 5] }, { s: [1, 'a b'] }, { s: [1, 'A'.repeat(401)] }, {}]) h.send(Object.assign({ t: 'bld' }, m));
    ok(await none(a, 'bld'), 'malformed bld is dropped: odd length, a state over 3, an index out of range, too long, text that is not base 64, nothing in it');
    a.send({ t: 'bhit', h: [12, 300, 21.5, 12, 301, -1], b: [100, 60, -200, 38, 130] }); const y4 = await h.wait('bhit'); ok(y4 && y4.from === a.id && y4.h.join() === '12,300,21.5,12,301,-1' && y4.b.join() === '100,60,-200,38,130' && await none(b, 'bhit'), 'bhit from a guest goes to the host alone, with its sender');
    h.send({ t: 'bhit', h: [12, 300, 21.5] }); for (const m of [{ h: [12, 300] }, { h: [12, 5000, 3] }, { h: [12, 3, 0] }, { h: [12, 3, 2000] }, { b: [1, 2, 3, 4] }, { b: [1, 2, 3, 0, 5] }, { b: [1, 2, 3, 300, 5] }, { b: [1, 2, 3, 4, 3000] }, {}]) a.send(Object.assign({ t: 'bhit' }, m));
    ok(await none(h, 'bhit'), 'bhit from the host, or malformed (not in threes or fives, an element or a damage or a radius out of range), is dropped');
  }
  a.send({ t: 'ohit', h: [12, 30.5, 345, 999] }); const h1 = await h.wait('ohit'); ok(h1 && h1.from === a.id && h1.h.join() === '12,30.5,345,999' && await none(b, 'ohit'), 'ohit from a guest goes to the host alone, with its sender');
  h.send({ t: 'ohit', h: [12, 30] }); ok(await none(a, 'ohit') && await none(h, 'ohit'), 'ohit from the host itself goes nowhere');
  for (const e of [[12, 0], [12, -4], [12, 1001], [12, 'x'], [12], [70000, 5], [12, 1 / 0]]) a.send({ t: 'ohit', h: e }); a.send({ t: 'ohit' });
  ok(await none(h, 'ohit'), 'malformed ohit is dropped: no damage, too much, an id out of range');
  /* supply bases: base from the host to the room, build from a soldier to the host alone, at most one a second */
  ok(h.w.sup === 1, 'welcome says sup: 1');
  const brow = [30332, 0, 100.5, -20.5, 1.57, 40, 230, 0];
  await N.sleep(60); for (const c of [h, a, b]) c.got.forEach(m => { m.seen = 1; });
  h.send({ t: 'base', e: [brow, [30333, 1, 5, 6, 0, 100, 12, 2]] }); const s1b = await a.wait('base'), s2b = await b.wait('base'); ok(s1b && s2b && s1b.e.length === 2 && s1b.e[0].join() === brow.join() && !(await h.wait('base', 120)), 'base from the host reaches every guest, not the host');
  h.send({ t: 'base', e: [] }); const s3b = await a.wait('base'); ok(s3b && s3b.e.length === 0, 'an empty list passes: no base is left');
  await N.sleep(60); for (const c of [h, a, b]) c.got.forEach(m => { m.seen = 1; });
  a.send({ t: 'base', e: [brow] }); ok(await none(b, 'base') && await none(h, 'base'), 'base from a guest is dropped');
  for (const e of [[brow.slice(0, 7)], [[...brow.slice(0, 1), 2, ...brow.slice(2)]], [[...brow.slice(0, 5), 101, 230, 0]], [[...brow.slice(0, 7), 3]], [[70000, ...brow.slice(1)]], [[1.5, ...brow.slice(1)]], [['x', ...brow.slice(1)]], [brow, 5], new Array(17).fill(brow)]) h.send({ t: 'base', e }); h.send({ t: 'base', e: 5 }); h.send({ t: 'base' });
  ok(await none(a, 'base'), 'malformed base is dropped: a short row, a side or a stage that is none, more than 100%, an id out of range, more than 16 rows, not a list');
  a.send({ t: 'build', p: [100.5, -20.5], a: 1.57 }); const bd = await h.wait('build'); ok(bd && bd.from === a.id && bd.p.join() === '100.5,-20.5' && bd.a === 1.57 && await none(b, 'build'), 'build from a soldier goes to the host alone, with its sender');
  a.send({ t: 'build', p: [100.5, -20.5], a: 1.57 }); ok(await none(h, 'build'), 'a second one within a second is dropped');
  await N.sleep(1050);
  for (const m of [{ p: [1], a: 0 }, { p: [1, 'x'], a: 0 }, { p: [1, 2] }, { p: [1, 2], a: 1 / 0 }, { p: [1, 2, 3], a: 0 }]) a.send(Object.assign({ t: 'build' }, m));
  ok(await none(h, 'build'), 'malformed build is dropped: no place, no heading');
  h.send({ t: 'build', p: [1, 2], a: 0 }); ok(await none(a, 'build') && await none(h, 'build'), 'build from the host itself goes nowhere: it starts its own');
  const tkp = await N.raw(); tkp.send({ t: 'join', room: 'modern', name: 'T', cls: 'tank', model: 'leo2' }); await tkp.wait('welcome'); tkp.send({ t: 'build', p: [1, 2], a: 0 }); ok(await none(h, 'build'), 'build from a tank is dropped: only soldiers build'); tkp.close();
  /* plane loadouts: lo in join and swap, load, and a release that names its store */
  if (h.w.lo !== 1) console.log('   this server knows no loadouts: lo, load and store numbers are not checked');
  else {
    const pj = async (model, lo) => { const c = await N.raw(); c.send({ t: 'join', room: 'modern', name: 'P', cls: 'plane', model, lo }); c.w = await c.wait('welcome', 800); c.id = c.w && c.w.id; c.me = c.w && c.w.players.find(p => p.id === c.id); return c; };
    await N.sleep(60); for (const c of [h, a, b]) c.got.forEach(m => { m.seen = 1; });
    const L = [['mk82', 6], ['mk82', 6], ['aim9', 2]], p1 = await pj('a10', L), jn = await a.wait('joined');
    ok(p1.me && JSON.stringify(p1.me.lo) === JSON.stringify(L) && jn && JSON.stringify(jn.player.lo) === JSON.stringify(L), 'welcome says lo: 1, and join with a valid loadout keeps it in the record everyone gets');
    const p2 = await pj('a10'), p3 = await pj('a10', [0, ['agm65', 7], 0]), p4 = await pj('su25', [0, ['s8', 30], 0]), p5 = await pj('su25', [0, ['s8', 40], 0]);
    ok(p2.me.lo === null && p3.me.lo === null && p4.me.lo === null && JSON.stringify(p5.me.lo) === '[0,["s8",40],0]', 'join with none, with one over a group\'s limit or with rockets that are not whole pods has the plane\'s own load (null); whole pods pass');
    const tk = await N.raw(); tk.send({ t: 'join', room: 'modern', name: 'T', cls: 'tank', model: 'leo2', lo: L }); const tw = await tk.wait('welcome'); ok(tw.players.find(p => p.id === tw.id).lo === null, 'a loadout on anything but a plane is dropped');
    await N.sleep(60); for (const c of [h, a, b, p1]) c.got.forEach(m => { m.seen = 1; });
    p1.send({ t: 'load', lo: [0, ['agm65', 4], ['aim9', 2]] }); const l1 = await a.wait('load'); ok(l1 && l1.id === p1.id && JSON.stringify(l1.lo) === '[0,["agm65",4],["aim9",2]]' && await none(p1, 'load'), 'load from a plane reaches the others with its id and the loadout');
    p1.send({ t: 'load', lo: [['nuke', 1], 0, 0] }); const l2 = await a.wait('load'); ok(l2 && l2.lo === null, 'a load that is not valid is relayed as the default (null)');
    tk.send({ t: 'load', lo: L }); ok(await none(a, 'load'), 'load from a tank is dropped');
    p1.send({ t: 'swap', cls: 'plane', model: 'f22', lo: [['mk83', 2], ['aim120', 4], 0] }); const sw = await a.wait('swap'); ok(sw && sw.model === 'f22' && JSON.stringify(sw.lo) === '[["mk83",2],["aim120",4],0]', 'swap carries the loadout of the new plane');
    p1.send({ t: 'swap', cls: 'tank', model: 'abrams', lo: L }); const sw2 = await a.wait('swap'); ok(sw2 && sw2.cls === 'tank' && sw2.lo === null, 'and none when the new vehicle is not a plane');
    const nst = Object.keys(require('vm').runInNewContext('(' + require('fs').readFileSync(N.SERVER, 'utf8').match(/const STW = (\{[^;]*\});/)[1] + ')')).length;
    p2.send({ t: 'ord', i: 2 + nst - 1, target: null }); const o1 = await a.wait('ord'); ok(o1 && o1.i === 2 + nst - 1, 'a release naming the last of the ' + nst + ' stores passes');
    for (const i of [2 + nst, -1, 1.5, '2']) p2.send({ t: 'ord', i, target: null }); ok(await none(a, 'ord'), 'one naming a store that does not exist is dropped');
    h.send({ t: 'aiord', id: -9, i: 5, target: null }); ok((await a.wait('aiord') || {}).i === 5, 'and the host\'s AI release names its store too');
    for (const c of [p1, p2, p3, p4, p5, tk]) c.close();
  }
  { /* conquest and requisition */
    const cq = o => Object.assign({ t: 'cq', n: 0, ph: 0, T: 2700, ps: [600, 590], len: 1, p: [0, -100, 10, 0, -1, 0, 0, 0], l: [0, 0, 0, 0, 0, 0] }, o);
    ok(h.w.cq === 1 && h.w.cqn === 0, 'welcome says cq: 1 and the match the room is in');
    h.send(cq()); const c1 = await a.wait('cq'); ok(c1 && c1.ps[1] === 590 && c1.k === undefined && c1.p.length === 8 && c1.r === undefined, 'cq from the host is relayed');
    await N.sleep(40); b.got.forEach(m => { m.seen = 1; }); a.send(cq()); ok(await none(b, 'cq'), 'cq from a guest is dropped');
    for (const o of [{ p: [0, 1, 2] }, { p: [0, 'x', 0, 0] }, { ps: [1] }, { ps: [-1, 0] }, { ph: 2 }, { len: 7 }, { l: [0] }, { n: -1 }]) h.send(cq(o)); ok(await none(a, 'cq'), 'malformed cq is dropped');
    h.send(cq({ ph: 1, r: [1, 2], w: 20 })); const c2 = await a.wait('cq'); ok(c2 && c2.ph === 1 && c2.r[0] === 1 && c2.w === 20, 'the result travels with it');
    a.send({ t: 'down', by: null, det: 0 }); await a.wait('scores'); await N.sleep(40); a.got.forEach(m => { m.seen = 1; });
    h.send(cq({ n: 1, p: [] })); const sc = await a.wait('scores'), c3 = await a.wait('cq'); ok(sc && sc.players.every(p => !p.deaths && !p.kills) && c3 && c3.n === 1, 'a new match number zeroes the room\'s scores');
    const late = await join('inf', 'blueSaw'); ok(late.w && late.w.cqn === 1, 'and whoever joins is told the match number');
    a.send({ t: 'req', cls: 'tank', model: 'abrams' }); const rq = await h.wait('req'); ok(rq && rq.from === a.id && rq.model === 'abrams', 'req from a soldier goes to the host alone');
    ok(await none(b, 'req'), 'and to nobody else');
    await N.sleep(520); a.send({ t: 'req', cls: 'tank', model: 't90' }); a.send({ t: 'req', cls: 'inf', model: 'blueSaw' }); ok(await none(h, 'req'), 'req for the other side\'s vehicle or for a soldier is dropped');
    h.send({ t: 'reqa', to: a.id, cls: 'tank', model: 'abrams', why: '' }); const ra = await a.wait('reqa'); ok(ra && ra.why === '' && ra.model === 'abrams', 'reqa from the host reaches that soldier');
    b.send({ t: 'reqa', to: a.id, cls: 'tank', model: 'abrams', why: '' }); ok(await none(a, 'reqa'), 'reqa from a guest is dropped');
    b.got.forEach(m => { m.seen = 1; }); a.send({ t: 'swap', cls: 'tank', model: 'abrams', rq: 1 }); const sw = await b.wait('swap'); ok(sw && sw.rq === 1 && sw.model === 'abrams', 'a swap by requisition carries rq');
    { /* radios */
      const ro = await join('inf', 'blueRadio'), rv = await join('trn', 'mtlbu'); ok(ro.w && rv.w, 'a radio operator and a radio vehicle join');
      h.send({ t: 'rad', e: [[1, 0, 0, 100, 200, 6, 0], [2, 2, 1, 300, 400, 16, 1]] }); const rr = await ro.wait('rad'); ok(rr && rr.e.length === 2 && rr.e[1][5] === 16, 'rad from the host is relayed');
      await N.sleep(40); rv.got.forEach(m => { m.seen = 1; }); ro.send({ t: 'rad', e: [[1, 0, 0, 1, 2, 6, 0]] }); h.send({ t: 'rad', e: [[1, 3, 0, 1, 2, 6, 0]] }); h.send({ t: 'rad', e: [[1, 0, 0, 1, 2]] }); ok(await none(rv, 'rad'), 'rad from a guest, or malformed, is dropped');
      ro.send({ t: 'rsp', id: 2 }); const rs = await h.wait('rsp'); ok(rs && rs.id === 2 && rs.from === ro.id, 'rsp from a soldier goes to the host');
      ro.send({ t: 'rbe', k: 1, on: 1 }); rv.send({ t: 'rbe', k: 2, on: 1 }); const b1 = await h.wait('rbe'), b2 = await h.wait('rbe'); ok(b1 && b2 && b1.k === 1 && b2.k === 2 && b2.from === rv.id, 'rbe from the operator and from the vehicle go to the host');
      ro.send({ t: 'rbe', k: 2, on: 1 }); rv.send({ t: 'rbe', k: 1, on: 1 }); ro.send({ t: 'rbe', k: 1, on: 3 }); ok(await none(h, 'rbe'), 'rbe of the wrong kind for the sender, or malformed, is dropped');
      ro.close(); rv.close();
    }
    late.close();
  }
  for (const c of [h, a, b, w2]) c.close(); N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exit(1); });
