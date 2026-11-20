'use strict';
/* The AI general closes a gap of its command net when its only builder is far (cf-radio-general, the bug: "general sempre ficando sem rede
   e sem expandir a zona de rádio"). Two squads are out of the net, engineers stand far behind them, and there is no radio vehicle and no
   operator: whoever the general names walks kilometres to the relay's site. Before the fix the relay's order was given up after 420 s flat, the engineers walked back, and the
   general sent them again, for ever: no relay ever went up. Now the deadline counts the walk, the relay goes up and both squads are in
   the net, and the diary and the view say what the general is doing. Sandbox only (fast); never run when written (see
   docs/nao-testado/cf-radio-general.md) */
const H = require('./harness'), ok = H.ok;
const C = H.load({ seed: 4, mapv: 6 }), $ = C.$, S = C.sandbox('modern');
S.cmd = [$('cmdOf')(0), $('cmdOf')(1)]; for (const f of S.fld) f.next = 1e9; for (const Cm of S.cmd) { Cm.mnT = 1e9; Cm.atkT = 1e9; }
const CN = $('CN'), CNR = $('CNR'), W = S.W, b0 = S.base[0], Cm = S.cmd[0];
const squad = (t, x, z, job) => { const p = $('railOf')(x, z), q = C.dispatch(t, { kind: 'defend', why: 'teste' }, () => C.addSquad(t, x, z, p.ri, p.s)); q.job = job || 'held'; q.jk = 0; q.col = false; $('setOrd')(q, { k: 'hold', ri: p.ri, s: p.s, x, z, R: 12 }); return q; };
const site = (x, z) => { for (let r = 0; r < 900; r += 30) for (let a = 0; a < 6.28; a += .5) { const X = x + Math.cos(a) * r, Z = z + Math.sin(a) * r; if ($('gMapOk')(X, Z) && !C.fortWhy(8, 0, X, Z, 0, true)) return { x: X, z: Z }; } return null; };
const look = () => { if (S.cn) S.cn.acc = 0; C.cnStep(1e-3); };
look();
const G = site(b0.x + W * CN.hq.r + 1200, b0.z), q = squad(0, G.x, G.z), q2 = squad(0, G.x + 300, G.z + 200);
const B = site(b0.x + W * CN.hq.r - 4500, b0.z), e = squad(0, B.x, B.z, 'eng'); look();
ok(q.cnL === 1 && q2.cnL === 1, 'two squads out of the net, the engineers ' + Math.round(G.x - B.x) + ' m behind them');
C.genCtl(0, 'ai'); Cm.cnT = 0;
const t0 = S.t, rad = () => (S.glog ? S.glog.l[0] : []).filter(x => x.k === 'radio').map(x => x.s);
let inT = -1, note = '';
for (let i = 0; i < 2400 && inT < 0; i++) {
  C.run(1, null, 1 / 20); for (const t of [0, 1]) C.$('plan')(t); look();
  const V = C.genVM(0, false); if (!note && V.cn.gap.length && V.cn.gap[0][5]) note = V.cn.gap[0][5];
  if (q.cnL === 2 && q2.cnL === 2) inT = S.t - t0;
}
const L = rad(), f = S.forts.find(f => f.k === 8 && f.team === 0);
ok(L.some(s => /antena de rádio ordenada .* km de caminhada/.test(s)), 'the general orders the relay and says who walks how far');
ok(!L.some(s => /não ficou pronta a tempo/.test(s)), 'it does not give the relay up while its builders are still walking');
ok(f && f.prog >= 1 && inT >= 0, 'the relay is up and both squads are in the net ' + Math.round(inT) + ' s after the order');
ok(/CONSTRUTORES A|EM OBRA/.test(note), 'the view says what is on its way (' + note + ')');
H.done();
