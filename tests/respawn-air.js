'use strict';
/* the player shot down in the air is back at once, not when the wreck lands (reported bug: "só deixa spawnar quando o avião destruído cai no chão").
   Solo, for a jet and a helicopter: the death, the ticket and the countdown at the moment of the loss; the next aircraft (the same after its
   wait, or another picked in the swap panel) enters when the countdown ends while the old wreck is still falling; the wreck falls on by itself,
   holds nobody and still crashes. Online, a host and a guest (two copies of the page joined in process, as the relay does): each one's wreck falls on for the other after its owner
   is back, instead of vanishing in the air; and the AI's pilot still ejects */
const H = require('./harness'), { ok, done } = H;
const dt = 1 / 60, f0 = v => v.toFixed(0);
const agl = (c, p) => p.y - c.hgt(p.x, p.z);

/* solo: a player in cls/model, the battle around it emptied, the aircraft put h m over the ground and then shot down */
function solo(cls, model, h, pick) {
  const c = H.load({ seed: 11 }), $ = c.$, S = c.newState('modern', model, { cls, mouse: true });
  S.units = []; S.men = []; S.squads = []; S.planes = S.planes.filter(p => p === S.my); c.director = () => {};
  const P = S.my; P.y = c.hgt(P.x, P.z) + h; P.land = false; P.inv = 0; if (cls === 'heli') { P.v = { x: 30, y: 0, z: 0 }; P.ct = P.ctl.col = .6; }
  c.step(dt);
  const tk = S.cq.tk[0], d0 = S.cq.st.d;
  $('damagePlane')(P, 1e4, null); const tk1 = S.cq.tk[0];
  ok(P.dead && !P.gone && S.my === P && S.cq.tk[0] < tk && S.cq.st.d === d0 + 1 && S.respawn > 0, cls + ': shot down ' + f0(agl(c, P)) + ' m up, the death, the ticket (' + tk + ' → ' + S.cq.tk[0] + ') and the countdown are at once');
  if (pick) ok($('swapTo')(cls, pick) === '' && S.model === pick, cls + ': another one picked in the swap panel while dead');
  else S.cd = {};   // the same model, with no wait on it: what is checked is the return, not the countdown
  let back = -1, t = 0, landed = -1;
  for (; t < 30 && (back < 0 || landed < 0); t += dt) {
    c.step(dt);
    if (back < 0 && S.my !== P) back = t;
    if (landed < 0 && P.gone) landed = t;
  }
  ok(back >= 0 && back < 3.5, cls + ': the next aircraft enters ' + back.toFixed(1) + ' s after the loss (the countdown, 3 s), not when the wreck lands');
  ok(landed > back, cls + ': the old wreck was still falling then, and struck the ground ' + landed.toFixed(1) + ' s after the loss');
  const Q = S.my;
  ok(Q && !Q.dead && Q.me === 1 && P.me === 0 && Q.def.name === c.$('DEFS')[cls][pick || model].name && S.cq.tk[0] === tk1 && S.cq.st.d === d0 + 1, cls + ': the new ' + Q.def.name + ' is the player\'s, the wreck nobody\'s; one death, one ticket, none more when it lands');
  ok(!S.planes.includes(P), cls + ': the wreck is cleared once down');
  return c;
}

/* online, in process: two copies of the page, a host (id 1) and a guest (id 2), each one's messages handed to the other's Net.rx as the relay
   would, with from set. Only what a player's aircraft says to the others: state, hstate, swap and down */
const PASS = new Set(['state', 'hstate', 'swap', 'down']);
function pair(cls, mh, mg) {
  const mk = (id, model, host) => {
    const c = H.load({ seed: id * 13 }), $ = c.$, Net = $('Net'); c.$ = $; c.Net = Net; c.id = id; c.name = host ? 'anfitrião' : 'convidado';
    Net.id = id; Net.host = 1; Net.can = true; Net.hl = true;
    c.newState('modern', model, { net: true, cls, mouse: true, host }); const S = $('S'); S.units = []; S.men = []; S.squads = []; S.planes = S.planes.filter(p => p === S.my); c.director = () => {};
    return c;
  };
  const h = mk(1, mh, true), g = mk(2, mg, false), P = (id, model) => ({ id, name: id === 1 ? 'Host' : 'Conv', cls, model, kills: 0, deaths: 0 });
  for (const [a, b] of [[h, g], [g, h]]) {
    a.Net.players.set(a.id, P(a.id, a.$('S').model)); a.Net.players.set(b.id, P(b.id, b.$('S').model));
    a.Net.send = (t, o) => { if (PASS.has(t)) b.q.push(Object.assign({ t, from: a.id }, o, t === 'swap' || t === 'down' ? { id: a.id } : {})); };
    b.q = [];
  }
  const all = [h, g];
  all.run = (secs, each) => { for (let n = Math.round(secs / dt); n-- > 0;) { for (const c of all) { c.step(dt); c.Net.tick(dt); } for (const c of all) { const q = c.q.splice(0); for (const m of q) c.Net.rx[m.t](m); } if (each && each() === false) return; } };
  return all;
}
function online(cls, mh, mg, h) {
  const all = pair(cls, mh, mg), [host, gu] = all;
  all.run(1);
  for (const [who, other] of [[gu, host], [host, gu]]) {
    const W = who.$('S'), P = W.my; P.y = who.hgt(P.x, P.z) + h; P.land = false; P.inv = 0; if (cls === 'heli') { P.v = { x: 30, y: 0, z: 0 }; P.ct = P.ctl.col = .6; }
    all.run(1.5);
    const g0 = other.Net.ghosts.get(who.id);
    ok(g0 && !g0.dead && Math.abs(g0.y - P.y) < 30, cls + ', ' + who.name + ': seen by the ' + other.name + ' in the air (' + (g0 ? f0(agl(other, g0)) : '?') + ' m up)');
    if (!g0) continue;
    who.$('damagePlane')(P, 1e4, null); W.cd = {};
    let back = -1, t = 0; all.run(5, () => { t += dt; if (back < 0 && W.my !== P) back = t; return t < 3.6; });
    const g1 = other.Net.ghosts.get(who.id);
    ok(back > 0 && back < 3.5 && !P.gone, cls + ', ' + who.name + ': back in another aircraft ' + back.toFixed(1) + ' s after the loss, its wreck still ' + f0(agl(who, P)) + ' m up');
    all.run(.3);
    const g2 = other.Net.ghosts.get(who.id);
    ok(g2 && g2 !== g0 && !g2.dead, cls + ', ' + who.name + ': the ' + other.name + ' sees the new aircraft');
    ok(g0.dead && g0.fall && !g0.gone && other.$('S').planes.includes(g0) && agl(other, g0) > 15, cls + ', ' + who.name + ': and the old one still falling there (' + f0(agl(other, g0)) + ' m up), not vanished in the air');
    const y0 = g0.y; all.run(.5);
    ok(g0.gone || g0.y < y0 - 2, cls + ', ' + who.name + ': falling on by itself (' + f0(y0 - g0.y) + ' m in .5 s)');
    all.run(25, () => !(g0.gone && P.gone));
    ok(g0.gone && P.gone && !other.$('S').planes.includes(g0), cls + ', ' + who.name + ': both copies of the wreck strike the ground and are cleared');
  }
  /* shot down, then another class picked while the wreck falls: the swap message lets it fall on, not blow up in the air */
  const W = gu.$('S'), P = W.my; P.y = gu.hgt(P.x, P.z) + h; P.land = false; P.inv = 0; all.run(.3);
  const g0 = host.Net.ghosts.get(gu.id); gu.$('damagePlane')(P, 1e4, null); all.run(.3);
  const other = cls === 'heli' ? ['plane', 'su57'] : ['heli', 'mi28'];
  ok(gu.$('swapTo')(other[0], other[1]) === '', cls + ': the guest, down, picks a ' + other[1] + ' in the swap panel');
  host.Net.players.get(gu.id).cls = cls; all.run(.3);
  ok(g0 && g0.fall && !g0.gone && agl(host, g0) > 15 && !host.Net.ghosts.has(gu.id), cls + ': on the host its wreck falls on (' + (g0 ? f0(agl(host, g0)) : '?') + ' m up) after the swap');
}

(async () => {
  console.log('-- solo: a jet shot down at 600 m, the same jet after its wait --');
  solo('plane', 'f22', 600);
  console.log('-- solo: a jet shot down, another picked in the swap panel --');
  solo('plane', 'f22', 600, 'a10');
  console.log('-- solo: a helicopter shot down at 250 m --');
  solo('heli', 'ah64', 250);
  console.log('-- the AI\'s pilot still ejects from a plane out of control --');
  { const c = H.load({ seed: 5 }), $ = c.$, S = c.newState('modern', 'f22', { cls: 'plane' }); const p = S.planes.find(p => p.ai) || $('addPlane')('su57', 1, S.W / 2, 2000, 0, 0, true, 'fighter');
    p.mod.thrust = 0; p.bail = 1e3; c.step(dt); ok(p.dead && p.end === 3 && !p.gone, 'out of control: the pilot ejects, the plane goes down as a wreck'); }
  console.log('-- online, a host and a guest: jets --');
  online('plane', 'f22', 'su57', 900);
  console.log('-- online, a host and a guest: helicopters --');
  online('heli', 'ah64', 'mi28', 300);
  done(); process.exit(process.exitCode || 0);
})();
