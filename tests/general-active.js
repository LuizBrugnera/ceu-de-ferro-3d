'use strict';
/* the AI general is never idle (the report "o general da IA não está fazendo nada"): with the page's own settings (economy, logistics, recovery, friendly
   fire, analytics, map version 5) and the hangar's defaults (solo: the own side's plain doctrine, the enemy a personality drawn; Normal), within SECS s of a
   conquest start each side's general has produced, fielded units by its Dispatch orders (alive, with that order's mission) and opened at least one
   operation; in both eras, solo and as the net host alone in a room through the real relay server (PORT_T, HOST). Then the guard: a commander's plan
   that throws is told once (console.error and a line in the general log) and the side plans again, instead of a dead plan job; a production step
   that throws on one side leaves the other side fielding. About 2-4 min */
const N = require('./net'), H = require('./harness'), { ok, done } = H;
const SECS = +process.env.SECS || 150, dt = 1 / 60, page = { eco: 1, lg: 1, rec: 1, ff: 1, ana: 1, mapv: 5 };
const park = S => { const P = S.my; if (P) { P.inv = 9; P.dead = false; P.y = Math.max(P.y, 3000); if (P.v) P.v.y = 0; P.hp = P.def.hp; } S.lives = 9; };
/* what each side's general did so far: made (the economy's), dsp (Dispatch orders that fielded something), mis (live units of such an order), ops (ids opened) */
function watcher(S) {
  const ops = [new Set(), new Set()];
  const look = () => { for (const t of [0, 1]) for (const o of S.cmd[t].ops) ops[t].add(o.k + o.id); };
  const of = t => {
    let mis = 0;
    for (const l of [S.units, S.planes, S.squads]) for (const u of l) if (u.team === t && !u.dead && !u.net && u.mis && u.mis.d > 0) mis++;
    return { made: S.eco ? S.eco.d[t].made : 0, dsp: S.dsp ? S.dsp.log[t].length : 0, mis, ops: ops[t].size };
  };
  const busy = t => { const r = of(t); return r.made > 0 && r.dsp > 0 && r.mis > 0 && r.ops > 0; };
  return { look, of, busy };
}
const say = r => 'made ' + r.made + ', orders ' + r.dsp + ', units with a mission ' + r.mis + ', operations ' + r.ops;
function check(tag, S, W, sides) {
  for (const t of sides) {
    const r = W.of(t);
    ok(r.made > 0, tag + ' side ' + t + ': the general produced (' + say(r) + ')');
    ok(r.dsp > 0 && r.mis > 0, tag + ' side ' + t + ': it fielded units by its orders, alive with their missions');
    ok(r.ops > 0, tag + ' side ' + t + ': it opened at least one operation');
  }
  ok(!S.aiErr, tag + ': no error in the general (' + JSON.stringify(S.aiErr || {}) + ')');
}
function solo(era) {
  const c = H.load(Object.assign({ seed: 11 }, page)), $ = c.$;
  const S = c.newState(era, $('ERAS')[era].sides[0].fighter, { cls: 'plane', len: 1, per: [null, 'sort'], dif: ['normal', 'normal'] }), W = watcher(S);
  let t = 0;
  for (let n = Math.round(SECS / dt); n-- > 0;) { c.step(dt); park(S); if (n % 30 === 0) { W.look(); if (W.busy(0) && W.busy(1)) break; } t += dt; }
  W.look(); check(era + ' solo, ' + Math.round(t) + ' s', S, W, [0, 1]);
}
function guard() {
  console.log('-- the guard --');
  const c = H.load(Object.assign({ seed: 5 }, page)), $ = c.$, errs = [], ce = console.error;
  const S = c.newState('ww2', $('ERAS').ww2.sides[0].fighter, { cls: 'plane', len: 1, per: [null, 'sort'], dif: ['normal', 'normal'] });
  c.run(5, () => park(S));
  const posts = c.cmdSense, gp = c.gpStep, pd = $('FIELD').every;
  console.error = (...a) => errs.push(a.map(String).join(' '));
  let threw = null;
  try {
    c.cmdSense = () => { throw new Error('boom in the plan'); };
    try { c.run(pd * 3, () => park(S)); } catch (e) { threw = e; }
    ok(!threw, 'a plan that throws does not escape the step (' + (threw && threw.message) + ')');
    ok(errs.filter(s => s.includes('boom in the plan')).length === 1, 'it is told once on the console, over ' + Math.round(pd * 3) + ' s of planning rounds (' + errs.length + ' lines)');
    ok(S.glog.l.some(L => L.some(e => e.s.includes('Erro interno do general') && e.s.includes('boom in the plan'))), 'and once in the general log');
    c.cmdSense = posts;
    const J = [0, 0];
    c.run(pd * 2, () => { park(S); if (S.planJ) J[S.planK]++; });
    ok(J[0] > 0 && J[1] > 0, 'with the bug gone both sides plan again (plan job live ' + J + ' frames)');
    errs.length = 0;
    c.gpStep = (t, ...a) => { if (t === 0) throw new Error('boom in production'); return gp(t, ...a); };
    const n1 = S.dsp.n;
    let o1 = 0; const n0 = S.dsp.log[1].length;
    try { c.run(60, () => { park(S); }); } catch (e) { threw = e; }
    o1 = S.dsp.log[1].length;
    ok(!threw && errs.filter(s => s.includes('boom in production')).length === 1, 'production that throws on side 0 is told once and does not escape the step');
    ok(S.dsp.n > n1 && (o1 > n0 || S.dsp.log[1].some(o => o.t > S.t - 60)), 'side 1 still fields by its orders meanwhile');
  } finally { console.error = ce; c.cmdSense = posts; c.gpStep = gp; }
}
async function host(era) {
  const c = H.load(Object.assign({ seed: 23, WebSocket: N.WebSocket, host: '127.0.0.1:' + N.PORT }, page)), $ = c.$, Net = $('Net'), side = $('ERAS')[era].sides[0];
  await new Promise((res, rej) => {
    Net.ui.welcome = () => { c.newState(era, side.fighter, { net: true, cls: 'plane', host: Net.host === Net.id, len: 1, per: ['sort', 'sort'], dif: ['normal', 'normal'] }); res(); };
    Net.ui.refused = code => rej(new Error('refused: ' + code)); Net.connect(era, 'Host', 'plane', side.fighter);
  });
  const S = $('S'), W = watcher(S);
  ok(S.net && S.host && Net.host === Net.id, era + ' net host: alone in the room, the page is the host');
  let t = 0;
  for (let i = 0, n = Math.round(SECS / dt); i < n; i++) {
    c.step(dt); Net.tick(dt); park(S); t += dt;
    if (i % 30 === 0) { W.look(); if (W.busy(0) && W.busy(1)) break; }
    if (i % 4 === 0) await new Promise(r => setImmediate(r));
  }
  W.look(); check(era + ' net host, ' + Math.round(t) + ' s', S, W, [0, 1]);
  Net.ws && Net.ws.close(); await N.sleep(100);
}
(async () => {
  console.log('page: ' + H.PAGE);
  for (const era of ['ww2', 'modern']) solo(era);
  guard();
  await N.start(); console.log('server: ' + N.SERVER);
  try { for (const era of ['ww2', 'modern']) await host(era); } finally { N.stop(); }
  done(); setTimeout(() => process.exit(), 200);
})().catch(e => { console.log(e.stack); N.stop(); process.exit(1); });
