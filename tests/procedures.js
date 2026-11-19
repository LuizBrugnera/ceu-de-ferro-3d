'use strict';
/* The manoeuvre procedures (M3) and the rest of the general: the states an assault takes before its H-hour that M3 added (mv: the manoeuvre walks to
   its assault position and the fixing element to its base of fire; rec: the recon of p12) count as "before H-hour" wherever the general asks:
   the axis' armour holds back behind the start line (cmdColumns), a campaign waits for a front still in them (campTick), the feints and the aid
   attach to them, and the view names them. A few seconds */
const H = require('./harness'), { ok, done } = H;

const C0 = H.load({ seed: 2, mapv: 6 }), $ = C0.$, S = C0.watch('ww2', { len: 0 });
C0.run(20, null, 1 / 20);
const pre = (() => { try { return $('atkPreH'); } catch (e) { return null; } })();

console.log('-- before H-hour --');
ok(typeof pre === 'function', 'atkPreH is there');
if (typeof pre === 'function') {
  const st = k => ({ st: k });
  ok(['form', 'mv', 'rec', 'prep', 'screen'].every(k => pre(st(k))) && !['go', 'fight', 'cons', 'back'].some(k => pre(st(k))), 'form, mv, rec, prep and screen are before H-hour; go, fight, cons and back are not');
  ok(['form', 'mv', 'rec'].every(k => pre(st(k), 1)) && !['prep', 'screen'].some(k => pre(st(k), 1)), 'a front still forming up for a campaign: form, mv and rec (not prep or screen)');
}

console.log('-- a campaign waits for a front whose manoeuvre is still walking --');
for (const k of ['form', 'mv', 'rec']) {
  const C = S.cmd[0], O = S.cq.p[0], op = { k: 'atk', id: 9000, st: k, over: false, O, sq: [], n0: 1 };
  const K = { id: 77, by: 'ai', st: 'form', ops: [op], res: [], T0: S.t, H: S.t, sl: 0 }, H0 = K.H;
  const keep = C.camp; C.camp = [K];
  try { $('campTick')(C); } finally { C.camp = keep; }
  ok(K.st === 'form' && K.H > H0, 'a front in ' + k + ' at the campaign\'s H-hour: H-hour put off ' + Math.round(K.H - H0) + ' s (state ' + K.st + ')');
}

console.log('-- the axis\' armour holds behind the start line until H-hour --');
{
  const C = S.cmd[0], u = S.units.find(v => v.team === 0 && v.ai && !v.net && !v.dead && v.kind === 'tank' && v.rail && !v.fixed && v.ri !== undefined);
  ok(!!u, 'side 0 has an AI tank on an axis');
  if (u) {
    const r = S.T.routes[u.ri], sd = 1, O = { x: 0, z: 0, s: Math.min(r.len, u.s + 600) };
    for (const k of ['form', 'mv', 'rec', 'go']) {
      const op = { k: 'atk', id: 9001, st: k, ri: u.ri, fs: u.s - 20, sd, O, T0: S.t, over: false };
      u.ai.rest = 0; C.ops.push(op);
      try { $('cmdColumns')(C, S.squads.filter(q => q.team === 0)); } finally { C.ops.splice(C.ops.indexOf(op), 1); }
      const held = u.ai.rest > S.t;
      ok(k === 'go' ? !held : held, 'an assault in ' + k + ' on its axis: the tank ' + (held ? 'holds' : 'goes on'));
    }
  }
}

console.log('-- the view and the posture name them --');
{
  const G = $('GEN');
  ok(G.st.mv === 'MANOBRA' && G.st.rec === 'RECONHECIMENTO', 'GEN.st names mv and rec');
  const C = S.cmd[0], O = S.cq.p[0], keep = C.ops;
  for (const k of ['mv', 'rec']) {
    C.ops = [{ k: 'atk', st: k, over: false, O, sq: [] }];
    let p = null; try { p = $('genPosture')(C); } finally { C.ops = keep; }
    ok(p && p.k === 'Ofensiva' && /Manobra|Reconhecendo/.test(p.s), 'the posture in ' + k + ': ' + (p && p.s));
  }
}
done();
