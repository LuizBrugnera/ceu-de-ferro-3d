'use strict';
/* day, night and weather online, headless, through the real relay server on its own port: the host's clock and weather reach a guest
   that chose others, a guest's flare lights the host's battle (its AI sees under it), and the host's AI lights reach the guest */
const N = require('./net'), H = require('./harness'), { ok, done } = H;
const all = [], dt = 1 / 60;
async function client(name, cls, model, sky, wx) {
  const c = H.load({ WebSocket: N.WebSocket, host: 'localhost:' + N.PORT, seed: name.length * 97 + 5 }), $ = c.$, Net = $('Net');
  c.name = name; c.$ = $; c.Net = Net;
  await new Promise((res, rej) => {
    Net.ui.welcome = () => { c.newState('ww2', model, { net: true, cls, mouse: true, host: Net.host === Net.id, sky, wx }); res(); };
    Net.ui.refused = code => rej(new Error(name + ' refused: ' + code)); Net.connect('ww2', name, cls, model);
  });
  Object.defineProperty(c, 'S', { get: () => $('S') }); all.push(c); return c;
}
async function run(secs) {
  for (let i = 0, n = Math.round(secs / dt); i < n; i++) { for (const c of all) { c.step(dt); c.Net.tick(dt); } if (i % 2 === 0) await new Promise(r => setImmediate(r)); }
  await N.sleep(40);
}
const until = async (f, ms) => { for (let t = Date.now(); !f() && Date.now() - t < (ms || 6000);) { await run(.1); await N.sleep(25); } return f(); };

(async () => {
  await N.start(); console.log('server: ' + N.SERVER + '\npage:   ' + H.PAGE);
  const host = await client('Host', 'tank', 'tiger', 'noite', 'chuva'), g = await client('Guest', 'inf', 'rifleman', 'dia', 'limpo');
  await run(1);
  ok(host.Net.sky && g.Net.sky && host.S.host && !g.S.host, 'the server knows the sky (sky)');
  const same = () => Math.abs(g.$('skyHour()') - host.$('skyHour()')) < .02 && g.S.wx.pre === 'chuva' && Math.abs(g.S.wx.r - host.S.wx.r) < .01 && Math.abs(g.S.wx.wx - host.S.wx.wx) < .1;
  ok(await until(same), 'the guest that chose a clear day takes the host\'s night and rain: ' + g.$('skyHour()').toFixed(2) + ' h, rain ' + g.S.wx.r);
  ok(await until(() => g.S.sky.L === 0 && g.S.sky.pre === 'noite'), 'and its light is the night\'s');
  await run(6); ok(Math.abs(g.$('skyHour()') - host.$('skyHour()')) < .02, 'the two clocks keep together');

  const n0 = host.S.ill.length; g.S.aim = g.S.aim || { h: 0, p: 0 };
  ok(g.$('skyFire()'), 'the guest fires a hand flare');
  ok(await until(() => host.S.ill.length > n0 && host.S.ill.some(i => i.team === -1)), 'it goes up in the host\'s battle too');
  const i = host.S.ill.find(i => i.team === -1), gi = g.S.ill[g.S.ill.length - 1];
  ok(Math.abs(i.x - gi.x) < 2 && Math.abs(i.z - gi.z) < 2, 'over the same place');
  await run(2); const q = { x: i.x, y: host.hgt(i.x, i.z), z: i.z, shotT: -99 };
  ok(host.$('skyLit')(q) > .5, 'and the host\'s AI sees what stands under it (light ' + host.$('skyLit')(q).toFixed(2) + ')');

  const m0 = g.S.ill.length; host.$('skyIll')(1, 1000, 50, 0, host.S.W / 2, 0, 1, 2);
  ok(await until(() => g.S.ill.length > m0 && g.S.ill.some(i => i.k === 1)), 'an illumination round of the host\'s AI reaches the guest');
  for (const c of all) c.Net.close && c.Net.close();
  N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exitCode = 1; });
