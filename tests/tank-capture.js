'use strict';
/* A tank captures as 3 soldiers (the captain's rule, cf-tanque-captura): in a conquest point a tank, AI or the player's, weighs CQ.w.tank = 3,
   so alone it takes a point three times as fast as one soldier, it holds even against 3 enemy soldiers (contested: nothing moves), it beats 2
   and it stops their capture; the other vehicles and the soldiers weigh what they did */
const H = require('./harness'), ok = H.ok;
const C = H.load({ seed: 10 }), $ = C.$, K = $('CQ');
const S = C.newState('ww2', $('ERAS').ww2.sides[0].fighter, { cls: 'plane' }), Q = S.cq, P = Q.p;
C.step(1 / 60);
S.units = []; S.men = []; S.squads = []; S.planes = []; C.director = () => {}; C.plan = () => {};
const n = P.find(p => p.hold < 0 && p.base < 0);
const tank = (t, dx) => { const id = Object.keys($('TANKS')).find(k => $('TANKS')[k].era === 'ww2' && $('TANKS')[k].side === S.fac[t]) || Object.keys($('TANKS')).find(k => $('TANKS')[k].era === 'ww2'); const u = C.addUnit('tank', t, n.x + dx, n.z, id, false, 0, 0); u.x = n.x + dx; u.z = n.z; return u; };
const man = (t, dx) => C.addMan($('INF').ww2[S.fac[t]][0], t, n.x + dx, n.z + 3, 0);
const tick = s => { for (let T = 0; T < s; T += .25) { Q.acc = 0; $('cqStep')(.25); } };   // the point alone: nobody drives or walks off it
const reset = (hold, c) => { S.units = []; S.men = []; n.hold = hold; n.cap = -1; n.c = c; };
const nlinks = n.links; n.links = P.map((q, i) => i).filter(i => i !== n.i);   // linked to both sides: either may take it

console.log('the weights');
ok(K.w.tank === 3 && K.w.inf === 1, 'a tank weighs ' + K.w.tank + ', a soldier ' + K.w.inf);
ok(K.w.lav === 1.5 && K.w.aa === .75 && K.w.car === .5 && K.w.truck === .5, 'the other ground vehicles as before: lav 1,5, aa 0,75, car and truck 0,5');
reset(-1, 0); const t0 = tank(0, 5); tick(.25);
ok(t0.kind === 'tank' && n.w[0] === 3 && n.w[1] === 0, 'an AI tank alone in ' + n.L + ' · ' + n.name + ': weight ' + n.w[0]);

console.log('capture speed');
reset(-1, 0); man(0, 5); let T = 0; while (n.hold !== 0 && T < 200) { tick(.25); T += .25; } const tMan = T;
reset(-1, 0); tank(0, 5); T = 0; while (n.hold !== 0 && T < 200) { tick(.25); T += .25; } const tTank = T;
ok(Math.abs(tMan - K.t) <= .5 && Math.abs(tTank - K.t / 3) <= .5, 'one soldier takes the neutral point in ' + tMan + ' s, one tank in ' + tTank + ' s (3 times as fast)');
reset(-1, 0); for (let i = 0; i < 3; i++) man(0, 5 + i); T = 0; while (n.hold !== 0 && T < 200) { tick(.25); T += .25; }
ok(Math.abs(T - tTank) <= .25, 'three soldiers take it in ' + T + ' s, as the tank');

console.log('the contest');
reset(0, .5); tank(0, 5); for (let i = 0; i < 3; i++) man(1, -5 - i); tick(10);
ok(n.hold === 0 && n.c === .5 && n.w[0] === 3 && n.w[1] === 3, 'a tank against 3 enemy soldiers: contested, nothing moves (' + n.w[0] + ' × ' + n.w[1] + ', c ' + n.c + ')');
reset(0, .5); tank(0, 5); for (let i = 0; i < 2; i++) man(1, -5 - i); tick(10);
ok(n.hold === 0 && n.c > .5, 'against 2 the tank\'s side wins it back (c ' + n.c.toFixed(3) + ')');
reset(0, .5); tank(1, 5); for (let i = 0; i < 2; i++) man(0, -5 - i); tick(10);
ok(n.hold === 0 && n.c < .5, 'an enemy tank against 2 defenders takes it down (c ' + n.c.toFixed(3) + ')');
reset(0, .5); tank(1, 5); for (let i = 0; i < 4; i++) man(0, -5 - i); tick(10);
ok(n.hold === 0 && n.c > .5, 'against 4 defenders it does not (c ' + n.c.toFixed(3) + ')');

console.log('the player\'s tank');
{ const C2 = H.load({ seed: 11 }), $2 = C2.$, id = Object.keys($2('TANKS')).find(k => $2('TANKS')[k].era === 'modern');
  const S2 = C2.newState('modern', id, { cls: 'tank' }), Q2 = S2.cq; C2.step(1 / 60);
  const me = S2.my, p = Q2.p.find(q => q.base < 0);
  S2.units = [me]; S2.men = []; S2.squads = []; S2.planes = []; me.x = p.x; me.z = p.z; Q2.acc = .25; $2('cqStep')(0);
  ok(me.kind === 'tank' && !me.ai && p.w[me.team] === 3, 'the player at the wheel of a ' + me.def.name + ' in ' + p.L + ': weight ' + p.w[me.team]); }

n.links = nlinks;
ok(!H.nan(S), 'nothing NaN');
H.done();
