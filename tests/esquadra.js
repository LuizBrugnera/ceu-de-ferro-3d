'use strict';
/* the player's squad (PSQ, cf-pol2 P10, D4): a player on foot comes in with three soldiers of his side (rifleman, machine gunner, anti-tank),
   his own and outside every squad; they follow him, hold where he stood, attack where his aim meets the ground; they fight an enemy near
   where they are to be; a new life makes the squad up again and lets go of one left far away; their kills are listed as his own (KF);
   online the host makes and drives a guest's squad (psq) and tells the room whose soldiers are whose (psql) */
const H = require('./harness'), { ok, done } = H;
console.log('page: ' + H.PAGE);
{ const C = H.load(); try { C.$('PSQ'); } catch (e) { console.log('no player squad (PSQ): a page before it'); process.exit(0); } }

const walk = (C, P, secs, vx) => { for (let i = 0, n = Math.round(secs * 60); i < n; i++) { P.x += vx / 60; P.y = C.$('manY')(P.x, P.z); C.step(1 / 60); } };
console.log('-- the squad comes in with the player --');
{
  const C = H.load({ seed: 3 }), $ = C.$, S = C.newState('modern', 'blueRifle', { cls: 'inf' }), P = S.my, hd = $('hdist'), id = $('Net').id, L = () => $('psqOf')(id), E = $('INF').modern[0];
  ok(S.men.length - 3 > $('IAI').cap, 'the field is full when the match starts (' + (S.men.length - 3) + ' soldiers, cap ' + $('IAI').cap + '): the squad comes over it');
  const q = L();
  ok(q.length === 3 && q.map(m => m.id).join() === [E[0], E[1], E[2]].join(), 'three soldiers of his side: ' + q.map(m => m.name).join(', '));
  ok(q.every(m => m.team === P.team && m.ai && !m.sq && m.own === id && hd(m, P) < 10), '  his own (own), with an AI, in no squad, beside him');
  P.inv = 1e9; walk(C, P, 20, 3);
  ok(L().every(m => hd(m, P) < 25), 'he walks 60 m: they follow (' + L().map(m => Math.round(hd(m, P))).join(', ') + ' m from him)');
  $('psqOrder')(id, 'pos', P.x, P.z); const O = S.pso[id]; walk(C, P, 20, 3);
  ok(O.k === 'pos' && L().every(m => hd(m, O) < 8 && hd(m, P) > 40), 'hold here, and he walks off: they stay (' + L().map(m => Math.round(hd(m, O))).join(', ') + ' m from the spot)');
  const a = $('psqAim')(P, { x: Math.cos(.3), y: -.04, z: -Math.sin(.3) }), r = hd(a, P);
  ok(r > 20 && r < $('PSQ').aim, 'his aim meets the ground ' + Math.round(r) + ' m away');
  $('psqOrder')(id, 'atk', a.x, a.z); C.run(45);
  ok(L().every(m => hd(m, a) < 10), 'attack there: they go to it (' + L().map(m => Math.round(hd(m, a))).join(', ') + ' m from it)');
  ok(!$('psqOrder')(id, 'nope', 0, 0) && S.pso[id].k === 'atk', 'an order that is not one of the three: refused');
  /* a fight: an enemy near where they are to be holds them where they fight */
  $('psqOrder')(id, 'seg', P.x, P.z); C.run(30);
  const m0 = L()[0], foe = C.addMan('redRifle', 1, m0.x + 40, m0.z, Math.PI); foe.inv = 1e9; foe.ai = null;
  let fired = false; C.run(8, () => { if (L().some(m => m.ctl.fire)) fired = true; });
  ok(fired && L().some(m => m.ai.tgt === foe), 'an enemy 40 m off: they take him on and fire');
  foe.inv = 0; C.killMan(foe, m0);
  const kr = S.kf[S.kf.length - 1]; ok(kr && kr.k === m0.name && kr.mine, 'a kill of the squad\'s: in the kill feed as the player\'s own');
  /* a new life: the dead made up for, one far away let go */
  const [d1, far, kept] = L(); C.killMan(d1, null); far.x = P.x + 900; far.z = P.z; far.y = $('manY')(far.x, far.z);
  P.inv = 0; C.killMan(P, null); let n = 0; C.run(12, () => { if (S.my !== P && !S.my.dead) return false; n++; });
  const P2 = S.my, q2 = L();
  ok(P2 !== P && P2.man && q2.length === 3 && !q2.includes(far) && !q2.includes(d1) && q2.includes(kept) && q2.filter(m => m !== kept).every(m => hd(m, P2) < 10), 'he comes in again: three, the dead one made up for and the one 900 m away replaced, beside him; the one ' + Math.round(hd(kept, P2)) + ' m away kept');
  C.run(40); ok(hd(kept, P2) < 30, '  the one kept comes back to him (' + Math.round(hd(kept, P2)) + ' m)');
  ok(!far.psq && far.own === undefined && !far.dead, '  the one far away is let go, a soldier of the side where he stands');
  $('PSQ').on = 0; C.killMan(P2, null); C.run(12, () => { if (S.my !== P2 && !S.my.dead) return false; });
  ok($('psqOf')(id).length === 3, 'with PSQ.on 0 no new squad comes (the old one stays)');
}
console.log('-- in a vehicle or dead, the squad holds where it stands --');
{
  const C = H.load({ seed: 4 }), $ = C.$, S = C.newState('modern', 'blueRifle', { cls: 'inf' }), P = S.my, hd = $('hdist'), id = $('Net').id;
  P.inv = 1e9; C.run(3); const at = $('psqOf')(id).map(m => ({ x: m.x, z: m.z }));
  P.dead = true; P.deadT = S.t; S.respawn = 999; P.x += 80;
  C.run(10); const moved = $('psqOf')(id).map((m, i) => Math.round(hd(m, at[i])));
  ok(moved.every(d => d < 15), 'the player dead: they do not run to his body (' + moved.join(', ') + ' m moved)');
}
console.log('-- a guest\'s squad, made by the host --');
{
  const C = H.load({ seed: 5 }), $ = C.$, S = C.newState('modern', 'blueRifle', { cls: 'inf', net: true, host: true }), Net = $('Net'), hd = $('hdist'), sent = [];
  Net.send = (t, m) => sent.push(Object.assign({ t }, m)); Net.psq = true; Net.id = 1;
  Net.players.set(2, { id: 2, name: 'Caio', cls: 'inf', model: 'blueRifle', kills: 0, deaths: 0, ai: 0 });
  Net.rx.psq({ from: 2, k: 0 }); C.run(1);
  ok(!$('psqOf')(2).length, 'the guest says his soldier came in: nothing yet, his soldier is not here');
  const g = C.addMan('blueRifle', 0, S.my.x + 50, S.my.z, 0); Object.assign(g, { net: true, pid: 2, name: 'Caio', snap: { x: g.x, z: g.z, h: 0, ap: 0, age: 0 } }); Net.ghosts.set(2, g);
  C.run(1); const q = $('psqOf')(2);
  ok(q.length === 3 && q.every(m => m.own === 2 && hd(m, g) < 10), 'once his ghost is here: three soldiers beside it, his (own 2)');
  Net.rx.psq({ from: 2, k: 2, p: [Math.round(g.x + 30), Math.round(g.z)] });
  ok(S.pso[2] && S.pso[2].k === 'pos' && Math.round(S.pso[2].x) === Math.round(g.x + 30), 'his order to hold at a spot reaches the host');
  Net.rx.psq({ from: 2, k: 3, p: ['x', 1] }); ok(S.pso[2].k === 'pos', 'an order with no place: refused');
  C.run(3); const l = sent.filter(m => m.t === 'psql').pop();
  ok(l && q.every(m => { const i = l.e.indexOf(m.aid); return i >= 0 && i % 2 === 0 && l.e[i + 1] === 2; }), 'the host tells the room whose soldiers they are (psql)');
  Net.players.delete(2); Net.ghosts.delete(2); C.run(1);
  ok(q.every(m => !m.psq || m.dead), 'the guest leaves the room: his squad is let go');
}
{
  const C = H.load({ seed: 6 }), $ = C.$, S = C.sandbox('modern'), Net = $('Net'); S.net = true; S.host = false; Net.id = 2;
  const g = C.addMan('blueSaw', 0, 100, 0, 0); Object.assign(g, { net: true, aid: -40 }); Net.ai.set(-40, g);
  Net.rx.psql({ e: [-40, 2, -41, 2] });
  ok(g.psq && g.own === 2 && $('psqOf')(2).length === 1, 'a guest: the ghosts the host names are his squad');
}
done();
