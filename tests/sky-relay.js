'use strict';
/* the relay server and day, night and weather: welcome sky 1, sky from the host to the room (and from no one else), ill from anyone to the
   rest of the room (a guest's 400 ms apart), malformed ones dropped */
const N = require('./net'), { ok, done } = require('./harness');
(async () => {
  await N.start(); console.log('server: ' + N.SERVER);
  const join = async (room, cls, model) => { const c = await N.raw(); c.send({ t: 'join', room, name: model, cls, model }); c.w = await c.wait('welcome', 800); c.id = c.w && c.w.id; return c; };
  const none = async (c, t) => !(await c.wait(t, 150));
  const h = await join('ww2', 'tank', 'tiger'), a = await join('ww2', 'inf', 'rifleman'), sp = await N.raw();
  sp.send({ t: 'join', room: 'ww2', name: 'spec', cls: 'spec', model: '' }); sp.w = await sp.wait('welcome', 800);
  ok(h.w && h.w.sky === 1 && a.w && a.w.sky === 1, 'welcome says sky: 1');
  await N.sleep(80); for (const c of [h, a, sp]) c.got.forEach(m => { m.seen = 1; });

  const sky = { h: 23.5, rt: 6, p: 2, w: 1, r: .85, f: 0, wx: 4.1, wz: -5.7 };
  h.send(Object.assign({ t: 'sky' }, sky)); const s1 = await a.wait('sky'), s2 = await sp.wait('sky');
  ok(s1 && s2 && ['h', 'rt', 'p', 'w', 'r', 'f', 'wx', 'wz'].every(k => s1[k] === sky[k]) && await none(h, 'sky'), 'sky from the host reaches the room and the spectators, not the host');
  a.send(Object.assign({ t: 'sky' }, sky)); ok(await none(h, 'sky') && await none(sp, 'sky'), 'sky from a guest is dropped');
  for (const bad of [{ h: 25 }, { h: -1 }, { rt: 601 }, { p: 4 }, { w: -2 }, { r: 1.5 }, { f: -.1 }, { wx: 31 }, { wz: 'x' }, { h: null }])
    h.send(Object.assign({ t: 'sky' }, sky, bad));
  ok(await none(a, 'sky'), 'malformed sky is dropped: an hour past 24, a rate past 600, a preset outside its list, rain or fog outside 0 to 1, a gale, a word');

  const ill = { k: 0, p: [100, 20, -50], q: [380, -50], d: 1.5 };
  a.send(Object.assign({ t: 'ill' }, ill)); const i1 = await h.wait('ill'), i2 = await sp.wait('ill');
  ok(i1 && i2 && i1.k === 0 && i1.p.join() === '100,20,-50' && i1.q.join() === '380,-50' && i1.d === 1.5 && await none(a, 'ill'), 'ill from a guest reaches the host and the spectators, not itself');
  a.send(Object.assign({ t: 'ill' }, ill)); ok(await none(h, 'ill'), 'a guest\'s second within 400 ms is dropped');
  await N.sleep(420); a.send(Object.assign({ t: 'ill' }, ill, { k: 1 })); const i3 = await h.wait('ill'); ok(i3 && i3.k === 1, 'then one passes');
  for (let i = 0; i < 4; i++) h.send(Object.assign({ t: 'ill' }, ill)); await N.sleep(200);
  ok(a.got.filter(m => m.t === 'ill' && !m.seen).length === 4, 'the host\'s go through at once: they carry its AI\'s lights');
  a.got.forEach(m => { m.seen = 1; });
  for (const bad of [{ k: 2 }, { k: -1 }, { p: [1, 2] }, { q: [1, 2, 3] }, { d: 31 }, { d: -1 }, { p: [1, 'a', 3] }, { k: undefined }])
    h.send(Object.assign({ t: 'ill' }, ill, bad));
  ok(await none(a, 'ill'), 'malformed ill is dropped: a kind outside 0 and 1, a short point, a delay outside 0 to 30 s, a word');
  for (const c of [h, a, sp]) c.close();
  N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exitCode = 1; });
