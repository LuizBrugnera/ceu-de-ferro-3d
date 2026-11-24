'use strict';
/* the player's transport (PTR, cf-transporte-jogador): the side's paratroopers' plane in the hangar and the swap, taking off with its sticks
   drawn from the reserve; B sends a stick out (not too low), the men open, land and become a squad sent to take the nearest capture point;
   the plane empty, then loaded again over its airfield after PTR.cd s; shot down with men aboard, they are lost (the diary). The transport
   helicopter: loaded at the start, G sends the squad down the fast-rope hovering low or by parachute from high, refuses in between; at its
   pad, G takes another squad from the reserve. The Insurgents' captured Mi-8T. Online: the host grants a guest's request (pdl k 0) and lets a
   guest's stick out of his ghost (pdl k 1); the guest takes what the answer grants; the host's men on the rope go out as pdr state 3 */
const H = require('./harness'), ok = H.ok;
const C = H.load({ seed: 7, eco: 1, mapv: 8 }), $ = C.$;
const src = require('fs').readFileSync(H.PAGE, 'utf8');
ok(!/const fleetIds = [^\n]*\.para/.test(src), 'the hangar lists the paratroopers\' transports (fleetIds no longer leaves them out)');
const S = C.newState('ww2', 'c47', { cls: 'plane' }), P = S.my, PTR = $('PTR'), PARA = $('PARA'), SQUAD = $('SQUAD');
const t = P.team, I = S.input, fly = (s, each) => C.run(s, each, 1 / 20), res = () => (S.eco.d[t].res.squad || []).length;
ok(P.def.para && P.def.name === 'C-47 Skytrain', 'a player flies the C-47 (' + P.def.name + ')');
ok($('canSwap')('plane', 'c47'), 'and may swap to it in mid-match');
/* the load: two sticks of a squad, from the reserve */
P.pcg = []; P.pcgT = -1e9; S.eco.d[t].res.squad = ['hq', 'hq', 'hq']; S.popK = 4;
let w = $('ptrLoad')(P);
ok(w === 'in' && P.pcg.length === 2 && P.pcg[0].length === SQUAD.ww2.length && (res() === 1 || S.eco.open || !$('ecoGate')()), 'loaded: ' + P.pcg.length + ' sticks of ' + (P.pcg[0] || []).length + ', the reserve down to ' + res());
ok($('popUse')(t).men >= $('ptrAboard')(P), 'the men aboard count among the side\'s soldiers');
/* over a point the side does not hold: B lets one stick out */
const tg = $('gPts')().filter(p => p.hold !== t && S.base.every(b => Math.hypot(b.x - p.x, b.z - p.z) > 2000))[0];
ok(!!tg, 'a target: ' + (tg && $('gName')(tg)));
const put = (x, z, agl, h) => { P.x = x; P.z = z; P.y = C.hgt(x, z) + agl; const V = P.V; P.q = $('yawQ')(h); $('axes')(P); P.v = { x: Math.cos(h) * V, y: 0, z: -Math.sin(h) * V }; };
put(tg.x - 900, tg.z, 80, 0);
I.ordA = true; fly(.1); I.ordA = false; fly(.1);
ok(P.pcg.length === 2 && /Baixo/.test(S.banner && S.banner.sub), 'too low: refused (' + (S.banner && S.banner.sub) + ')');
put(tg.x - 900, tg.z, 420, 0); P.kdP = false;
const men0 = new Set(S.men);
I.ordA = true; fly(.1); I.ordA = false;
const st1 = S.ptrS[0];
ok(P.pcg.length === 1 && S.ptrS.length === 1, 'B: the first stick goes out, one left aboard');
fly(5); put(S.base[t].x, S.base[t].z + 3000, 900, 0);   // away, high, once they are out
const out = st1.q ? st1.q.men.slice() : [];
ok(out.length === SQUAD.ww2.length && out.every(m => m.para || m.y > C.hgt(m.x, m.z) + 5), out.length + ' men out of the door, in the air');
let chutes = 0; fly(240, () => { chutes = Math.max(chutes, out.filter(m => m.para && m.para.st === 'chute').length); return out.some(m => m.para && !m.dead); });
const q = out[0] && out[0].sq, live = out.filter(m => !m.dead);
ok(chutes >= 3, 'their canopies open (' + chutes + ' at once)');
ok(live.length >= out.length - 1 && live.every(m => !m.para && Math.abs(m.y - $('manY')(m.x, m.z)) < 1), live.length + ' on the ground, on their feet');
ok(q && live.every(m => m.sq === q) && q.ord && q.ord.k === 'hold', 'one squad, holding');
const pt = q && $('gPts')().reduce((b, p) => (!b || Math.hypot(p.x - q.ord.x, p.z - q.ord.z) < Math.hypot(b.x - q.ord.x, b.z - q.ord.z) ? p : b), null);
ok(pt && Math.hypot(pt.x - q.ord.x, pt.z - q.ord.z) < 1 && q.mis && q.mis.kind === 'attack', '  sent to take the nearest point: ' + (pt && $('gName')(pt)) + ' (' + (q && q.mis && q.mis.kind) + ')');
const far = live.map(m => Math.round(Math.hypot(m.x - tg.x, m.z - tg.z)));
ok(Math.max(...far) < 700, '  landed near it: ' + far.join(', ') + ' m');
/* the second, then empty */
put(tg.x - 900, tg.z, 420, 0); P.kdP = false; I.ordA = true; fly(.1); I.ordA = false; fly(4);
ok(!P.pcg.length && !S.ptrS.length, 'the second stick out: empty');
P.kdP = false; I.ordA = true; fly(.1); I.ordA = false; fly(.1);
ok(/Sem paraquedistas/.test(S.banner && S.banner.sub), 'B with nobody aboard: ' + (S.banner && S.banner.sub));
/* over the airfield, after PTR.cd s since the last load: two more */
S.eco.d[t].res.squad.push('hq', 'hq');
const b = S.base[t]; P.pcgT = S.t; put(b.x + 300, b.z, 300, 0); fly(6, () => { put(b.x + 300, b.z, 300, 0); });
ok(!P.pcg.length, 'not before PTR.cd s since the last load');
P.pcgT = S.t - PTR.cd; fly(PTR.fill + 1, () => { put(b.x + 300, b.z, 300, 0); });
ok(P.pcg.length === 2, 'over its airfield, low, it takes on ' + P.pcg.length + ' sticks');
/* shot down with them aboard */
P.inv = 0; $('lose')(P, 1e6, null); fly(1);
const said = $('glogAll')().l[t].find(e => /abatido com \d+ homens a bordo/.test(e.s));
ok(P.dead && !P.pcg, 'shot down: the men aboard are lost with it');
ok(!!said, '  and the side\'s diary says so: ' + (said && said.s));

/* today: the transport helicopter */
const M = H.load({ seed: 3, eco: 1, mapv: 8 }), S2 = M.newState('modern', 'uh60', { cls: 'heli' }), Q = S2.my, $2 = M.$;
const t2 = Q.team, fly2 = (s, each) => M.run(s, each, 1 / 20);
S2.eco.d[t2].res.squad = ['hq', 'hq', 'hq']; S2.popK = 4; Q.cargo = null; Q.pcgT = -1e9;
w = $2('ptrLoad')(Q);
ok(w === 'in' && Q.cargo && Q.cargo.length === $2('SQUAD').modern.length, 'the UH-60 takes on a squad from the reserve (' + (Q.cargo && Q.cargo.length) + ')');
const hover = agl => { Q.land = false; Q.y = M.hgt(Q.x, Q.z) + Q.def.gh + agl; Q.v = { x: 0, y: 0, z: 0 }; };
const tg2 = $2('gPts')().filter(p => S2.base.every(b => Math.hypot(b.x - p.x, b.z - p.z) > 2000))[0];
Q.x = tg2.x + 60; Q.z = tg2.z + 60; while (M.hgt(Q.x, Q.z) <= S2.T.WL + 1) Q.x += 20;
hover(80); w = $2('heliCargo')(Q);
ok(Q.cargo && /30 m/.test(w), 'G at 80 m: neither the rope nor the parachute (' + w + ')');
hover(20); const m0 = new Set(S2.men); w = $2('heliCargo')(Q);
ok(!Q.cargo && /fast-rope/i.test(w), 'G hovering at 20 m: down the fast-rope (' + w + ')');
const st2 = S2.ptrS[0];
let rope = 0; fly2(12, () => { hover(20); rope = Math.max(rope, S2.men.filter(m => m.para && m.para.st === 'rope').length); return S2.ptrS.length || S2.men.some(m => m.para && m.para.st === 'rope'); });
const down = st2 && st2.q ? st2.q.men.filter(m => !m.dead) : [];
ok(rope >= 1 && down.length === $2('SQUAD').modern.length && down.every(m => !m.para && Math.abs(m.y - $2('manY')(m.x, m.z)) < 1), down.length + ' men down the rope (' + rope + ' on it at once), on the ground');
ok(down[0] && down[0].sq && down.every(m => m.sq === down[0].sq) && down[0].sq.ord.k === 'hold' && Math.hypot(down[0].sq.ord.x - tg2.x, down[0].sq.ord.z - tg2.z) < 1, '  one squad, to take ' + $2('gName')(tg2));
/* at the pad: another from the reserve, after PTR.cd s */
const pad = $2('heliPad')(t2, 0); Q.x = pad.x; Q.z = pad.z; Q.y = M.hgt(pad.x, pad.z) + Q.def.gh; Q.land = true; Q.v = { x: 0, y: 0, z: 0 };
for (const m of S2.men) if (m.team === t2 && Math.hypot(m.x - Q.x, m.z - Q.z) < 60) { m.x += 200; }
w = $2('heliCargo')(Q);
ok(!Q.cargo && /reserva prepara/.test(w), 'G at the pad too soon: ' + w);
Q.pcgT = S2.t - $2('PTR').cd - 1; w = $2('heliCargo')(Q);
ok(Q.cargo && /reserva embarcou/.test(w), 'G at the pad after PTR.cd s: ' + w);
/* high: the parachute */
Q.x = tg2.x; Q.z = tg2.z; hover(400); w = $2('heliCargo')(Q); const st3 = S2.ptrS[0];
ok(!Q.cargo && /paraquedas/.test(w), 'G at 400 m: they jump (' + w + ')');
fly2(150, () => { hover(400); return S2.ptrS.length || (st3 && st3.q && st3.q.men.some(m => m.para && !m.dead)); });
const jm = st3 && st3.q ? st3.q.men.filter(m => !m.dead) : [];
ok(jm.length >= $2('SQUAD').modern.length - 1 && jm.every(m => !m.para), jm.length + ' landed by parachute');

/* the Insurgents' captured Mi-8T */
const M3 = H.load({ seed: 3, eco: 1, mapv: 11 }), S3 = M3.newState('modern', 'mi8i', { cls: 'heli' });
ok(S3.N === 3 && S3.my.def.name === 'Mi-8T capturado' && S3.fac[S3.my.team] === 2 && S3.my.def.lift, 'the Insurgents fly a captured Mi-8T (side ' + S3.fac[S3.my.team] + ')');
ok(M3.$('canSwap')('heli', 'mi8i') && !M3.$('canSwap')('heli', 'mi8'), '  theirs to swap to, and not the Russians\' Mi-8');
ok(M3.$('paraType')(2) === null, '  and the general still has no paratroopers\' plane for them');

/* online: a guest's request and his stick, at the host; the answer at the guest */
{
  const O = H.load({ seed: 5, eco: 1, mapv: 8 }), S4 = O.newState('ww2', 'schutze', { cls: 'inf' }), Nn = O.$('Net'), out = [];
  O.run(2, null, 1 / 20);
  Nn.send = (k, m) => out.push(Object.assign({ t: k }, m)); S4.net = true; S4.host = true; Nn.ptr = true; Nn.para = true;
  const g = O.$('addPlane')('c47', 1, S4.base[1].x, 900, S4.base[1].z, 0, false); g.net = true; g.pid = 7; g.snap = { x: g.x, y: g.y, z: g.z, q: g.q, age: 0 }; Nn.ghosts.set(7, g);
  S4.eco.d[1].res.squad = ['hq']; S4.popK = 4;
  Nn.rx.pdl({ from: 7, k: 0, w: 2 });
  let a = out.pop();
  ok(a && a.t === 'pdl' && a.to === 7 && a.k === 0 && a.n.length === 1, 'the host grants a guest\'s request what the reserve has: ' + JSON.stringify(a));
  Nn.rx.pdl({ from: 7, k: 0, w: 2 }); a = out.pop();
  ok(a && a.n.length === 0, '  and none once it is empty');
  const n0 = S4.men.length; Nn.rx.pdl({ from: 7, k: 1, n: [0, 0, 1, 2], r: 0 }); O.run(3, null, 1 / 20);
  const gm = S4.men.slice(n0).filter(m => m.team === 1);
  ok(gm.length === 4 && gm.every(m => m.para && Math.hypot(m.x - g.x, m.z - g.z) < 400), 'a guest\'s stick goes out of his ghost on the host (' + gm.length + ' men)');
  Nn.rx.pdl({ from: 8, k: 1, n: [0], r: 0 }); O.run(1, null, 1 / 20); ok(S4.men.length === n0 + 4, '  and nothing from one who is not flying a transport');
  /* the guest */
  S4.host = false; const G = O.$('addPlane')('ju52', 0, 3000, 900, 0, 0, false); S4.my = G; G.pcg = []; G.ptrAsk = S4.t;
  Nn.rx.pdl({ k: 0, n: [[0, 0, 0, 1, 2], [99]] });
  ok(G.pcg.length === 1 && G.pcg[0].length === 5 && !G.ptrAsk, 'the guest takes what the host granted, a bad kit left out');
  out.length = 0; const w2 = O.$('ptrDrop')(G, false);
  ok(w2 === 'out' && out[0] && out[0].t === 'pdl' && out[0].k === 1 && out[0].n.length === 5 && !G.pcg.length, '  and his stick goes to the host: ' + JSON.stringify(out[0]));
  S4.host = true; S4.my = null; G.gone = true; S4.planes.splice(S4.planes.indexOf(G), 1);
  const h = O.$('addHeli')('uh60', 1, 3000, C.hgt(3000, 0) + 30, 0, 0, false); h.net = true; h.pid = 9; h.snap = { x: h.x, y: h.y, z: h.z, q: h.q, age: 0 }; Nn.ghosts.set(9, h);
  Nn.rx.pdl({ from: 9, k: 1, n: [0, 0], r: 1 }); O.run(.3, null, 1 / 20); out.length = 0; Nn.pacc = 1; Nn.paraTick(.3);
  const pr = out.find(m => m.t === 'pdr');
  ok(pr && pr.e.some(e => e[2] === 3), 'the host\'s men on the fast-rope go to the room as pdr state 3');
}
ok(!H.nan(S) && !H.nan(S2), 'no NaN');
H.done();
