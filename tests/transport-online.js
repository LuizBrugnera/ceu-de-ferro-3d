'use strict';
/* transport online, headless, through the real relay server: a host in a truck, a guest soldier, a guest LAV on the other side and, later,
   a second LAV. Seats and boxed squads as each client sees them, a lost vehicle's occupants, kills by LAV and by sniper and who gets
   them, a vehicle swapped for another in mid-match, and the host leaving with a loaded AI truck on the map */
const N = require('./net'), H = require('./harness'), { ok, done } = H;
const all = [], dt = 1 / 60;
async function client(name, cls, model) {
  const c = H.load({ WebSocket: N.WebSocket, host: 'localhost:' + N.PORT, seed: name.length * 97 + name.charCodeAt(0) }), $ = c.$, Net = $('Net');
  c.name = name; c.$ = $; c.Net = Net; c.on = true;
  await new Promise((res, rej) => { Net.ui.welcome = () => { c.newState('modern', model, { net: true, cls, mouse: true, host: Net.host === Net.id }); res(); }; Net.ui.refused = code => rej(new Error(name + ' refused: ' + code)); Net.connect('modern', name, cls, model); });
  Object.defineProperty(c, 'S', { get: () => $('S') }); c.id = Net.id; c.plan = () => {}; c.director = () => {}; all.push(c); return c;
}
async function run(secs, each) {
  for (let i = 0, n = Math.round(secs / dt); i < n; i++) {
    for (const c of all) if (c.on) { if (c.S.cd) c.S.cd = {}; c.step(dt); c.Net.tick(dt); }   // no countdown on a lost model: what is checked here is the return, not the wait
    if (each && each() === false) return false;
    if (i % 2 === 0) await new Promise(r => setImmediate(r));
    if (i % 20 === 0) await N.sleep(1);
  }
  await N.sleep(30); return true;
}
const put = (c, x, z, h) => { const P = c.S.my; P.x = x; P.z = z; P.y = P.man ? c.$('manY')(x, z) : c.hgt(x, z); if (h !== undefined) { P.h = h; if (c.S.aim) c.S.aim.h = h; } P.inv = 0; };
const press = async (c, k) => { c.S.input[k] = true; await run(.05); c.S.input[k] = false; await run(.2); };
const gh = (c, o) => c.Net.ghosts.get(o.id), score = (c, o) => c.Net.players.get(o.id);
const aimAt = (c, t, up) => { const P = c.S.my, e = P.man ? c.$('manEye')(P) : c.$('pivot')(P), d = c.$('vnorm')({ x: t.x - e.x, y: t.y + (up || 0) - e.y, z: t.z - e.z }); c.S.aim.h = Math.atan2(-d.z, d.x); c.S.aim.p = Math.asin(d.y); };
const occ = (c, u) => u.occ.map(m => (m && m !== c.S.rider ? c.Net.ref(m) : 0)).join();   // the driver's own soldier sits in seat 0 on its client alone

(async () => {
  await N.start(); console.log('server: ' + N.SERVER + '\npage:   ' + H.PAGE);
  const h = await client('Hugo', 'trn', 'hemtt'), a = await client('Ana', 'inf', 'blueRifle'), c = await client('Caio', 'trn', 'btr82');
  const B = h.S.base[0], BX = B.x - 300, BZ = B.z - 150, SQ = h.$('SQUAD').modern, HK = h.$('HK');
  ok(h.Net.trn && a.Net.trn && h.S.host && !a.S.host, 'welcome says trn; Hugo hosts in a HEMTT, Ana is a soldier on his side, Caio a BTR-82A on the other');
  await run(.5); put(h, BX, BZ, 0); put(a, BX + 3, BZ + 6); put(c, BX + 900, BZ, Math.PI); await run(1);
  const T = h.S.my, Tg = gh(a, h), Tc = gh(c, h), Ac = gh(c, a), Ah = gh(h, a);
  ok(Tg && Tc && Ac && Tg.kind === 'truck' && Tc.def.id === 'hemtt' && Tg.occ.length === T.occ.length, 'the truck is a HEMTT on every client, with its ' + T.occ.length + ' seats');
  ok(a.S.near === Tg, 'Ana, beside it, is offered the truck');
  await press(a, 'yawR'); await run(.6);
  const seat = a.S.my.seat;
  ok(a.S.my.in === Tg && Ah.in === T && T.occ[seat] === Ah && seat >= 1, 'E: she asks, Hugo\'s client seats her (a passenger\'s seat, ' + seat + ')');
  ok(Ac.in === Tc && Tc.occ[seat] === Ac && occ(h, T) === occ(c, Tc) && occ(h, T) === occ(a, Tg), 'the third client has her in the same seat: ' + occ(c, Tc));
  /* AI passengers: the host calls a squad aboard */
  const p = h.railOf(BX, BZ), q = h.addSquad(0, BX - 14, BZ + 12, p.ri, p.s); h.setOrd(q, { k: 'hold', ri: p.ri, s: p.s }); q.fd = 1e9; const n = q.live;
  await run(4); await press(h, 'flare'); await run(26);
  ok(T.cargo && T.cargo.length >= n - 1 && Tc.pn === T.cargo.length && Tg.pn === T.cargo.length && c.$('paxN')(Tc) === T.cargo.length, 'F: a squad of ' + n + ' goes aboard, boxed on the host (' + (T.cargo ? T.cargo.length : 0) + '), and both guests count the same');
  ok(c.S.men.filter(m => m.net && m.aid && !m.dead).length <= n - (T.cargo ? T.cargo.length : 0), 'its soldiers are gone from the third client\'s map');
  /* the ride */
  h.S.aim.h = 0; h.S.input.up = true; let worst = 0, far = 0;
  await run(6, () => { const s = c.$('seatAt')(Tc, seat); worst = Math.max(worst, Math.hypot(Ac.x - s.x, Ac.z - s.z)); far = Math.max(far, Math.hypot(a.S.my.x - Tg.x, a.S.my.z - Tg.z)); });
  h.S.input.up = false; h.S.input.brake = true; await run(3); h.S.input.brake = false;
  ok(T.x - BX > 40 && worst < .01 && far < 12 && Math.hypot(Ac.x - Tc.x, Ac.z - Tc.z) < 12, 'Hugo drives ' + Math.round(T.x - BX) + ' m: on the third client she never leaves her seat (' + worst.toFixed(3) + ' m off at most), and her own client rides with the truck');
  /* the truck is lost to Caio: who gets out, the same for everyone */
  const boxed = T.cargo.length; T.lastK = HK.shell; T.hitT = h.S.t; h.S.my.by = c.id; h.ruin(T, 1e6, gh(h, c)); await run(1.5);
  const aDead = a.S.my.dead, hDead = h.S.my.dead, live = h.S.men.filter(m => m.aid && !m.dead).length;
  ok(T.dead && !a.S.my.in && (aDead || a.S.my.hp < a.S.my.max), 'the truck is destroyed: Ana is thrown out, ' + (aDead ? 'dead' : 'hurt (' + a.S.my.hp.toFixed(0) + ' of ' + a.S.my.max + ' hp)'));
  ok(h.S.my.man && !h.S.my.in && score(a, c).ai === 1, 'Hugo, its driver, is a soldier thrown out too (' + (hDead ? 'dead' : 'alive') + '), and the truck counts for Caio as a vehicle destroyed');
  await run(5);
  const seen = c.S.men.filter(m => m.net && m.aid && !m.dead).length;
  ok(Ah.dead === aDead && (Ac.dead === aDead || gh(c, a).dead === aDead) && seen === live, 'every client agrees on her (' + (aDead ? 'dead' : 'alive') + ') and on the boxed squad: ' + live + ' of ' + boxed + ' got out, and the third client sees ' + seen);
  ok(score(a, c).kills === (hDead ? 1 : 0) + (aDead ? 1 : 0) && score(a, h).deaths === (hDead ? 1 : 0), 'the kills are Caio\'s, one for each who died: ' + score(a, c).kills);
  /* LAV against LAV, both ways; the squad has done its part and leaves the field first: its Javelin would take Caio's BTR-82A in the duels */
  for (const m of h.S.men) if (m.aid && !m.dead) { m.inv = 0; h.$('damageMan')(m, 999, null, true, { k: 0, pt: 0 }); }
  const d = await client('Davi', 'trn', 'lav25'); await run(5);
  /* back in the vehicle of the class chosen: a driver who got out alive is put down first */
  const fresh = async x => { const P = x.S.my; if (P.man && !P.dead) { P.inv = 0; x.$('damageMan')(P, 999, null, true, { k: 0, pt: 0 }); } await run(6); return x.S.my.kind === 'lav'; };
  const duel = async (x, y, z) => {   // x fires on y, which stands side on, in lane z: each duel its own, clear of the last one's wreck (a wreck stops rounds)
    if (x.S.my.man) await fresh(x); if (y.S.my.man) await fresh(y);
    put(x, BX, z, 0); put(y, BX + 160, z, Math.PI / 2); await run(.5); const g = gh(x, y), v = y.S.my, k = score(a, x).kills, n = score(a, x).ai, dd = score(a, y).deaths; let t = 0;
    x.S.input.fire = true; await run(40, () => { t += dt; x.S.my.inv = 0; if (!v.dead) v.inv = 0; aimAt(x, g, 2.6); return !v.dead; }); x.S.input.fire = false; await run(1); return { t, v, died: y.S.my.dead, k, n, dd };
  };
  const r1 = await duel(d, c, BZ - 200);
  ok(r1.v.dead && c.S.my.man && score(a, d).ai === r1.n + 1 && score(a, d).kills === r1.k + (r1.died ? 1 : 0) && score(a, c).deaths === r1.dd + (r1.died ? 1 : 0), 'Davi\'s LAV-25 destroys Caio\'s BTR-82A from the side in ' + r1.t.toFixed(1) + ' s: a vehicle to his count, and Caio ' + (r1.died ? 'dies in it, a kill' : 'gets out on foot, no death'));
  ok(await fresh(c) && await fresh(d), 'Caio comes back in a BTR-82A');
  const r2 = await duel(c, d, BZ - 240);
  ok(r2.v.dead && score(a, c).ai === r2.n + 1, 'and it destroys the LAV-25 in ' + r2.t.toFixed(1) + ' s, his');
  /* mid-match: Ana takes a sniper's rifle, Caio leaves his vehicle for a rifle */
  await run(6);
  ok(a.swapTo('inf', 'blueSniper') === '' || a.S.my.dead, 'Ana picks the sniper kit in mid-match'); ok(c.swapTo('inf', 'redRifle') === '', 'Caio leaves the BTR-82A for a rifleman');
  await run(6);
  ok(a.S.my.def.snp && c.S.my.man && gh(a, c) && gh(a, c).man && gh(h, a).def.snp, 'both are back as soldiers on every client, she with the Barrett');
  put(a, BX, BZ - 300, 0); put(c, BX + 500, BZ - 300, Math.PI); a.S.my.ctl.st = 2; await run(3);
  const tg = gh(a, c), w = a.S.my.arms[0].d, kc = score(h, a).kills; let shots = 0;
  a.S.input.ordA = true; a.S.input.thrUp = true;
  for (; shots < 14 && !c.S.my.dead; shots++) { const tt = 500 / w.spd; await run(2.2, () => { aimAt(a, { x: tg.x, y: tg.y + 1.9 + .5 * 9.81 * tt * tt, z: tg.z }); c.S.my.inv = 0; }); a.S.input.thrUp = shots % 2 === 0; await press(a, 'fire'); await run(1); }
  a.S.input.ordA = a.S.input.thrUp = false; await run(1);
  ok(c.S.my.dead && score(h, a).kills === kc + 1, 'Ana kills Caio\'s soldier at 500 m with the Barrett (' + shots + ' rounds, prone, through the scope), and the kill is hers');
  /* Hugo, back in a truck, lets Ana aboard and leaves: host migration with a loaded AI truck */
  for (const x of h.S.units) if (x.left) x.dead = x.gone = true;   // the vehicles their drivers left on the way here: an enemy one beside the truck would make its squad get out
  await run(6); const pr = h.railOf(BX, BZ), u = h.addUnit('truck', 0, 0, 0, null, false, pr.ri, pr.s, 12, 0); u.fld = 1; u.ai.park = 1; u.cargo = SQ.slice(0, 4);
  await run(1); put(a, u.x + 4, u.z + 5); await run(1);
  const ug = a.Net.ai.get(u.aid); ok(ug && a.S.near === ug && ug.pn === 4, 'an AI truck with 4 boxed soldiers: Ana sees it and its load');
  await press(a, 'yawR'); await run(.8);
  const gc = gh(c, a);
  ok(a.S.my === ug && a.S.rider && ug.occ[0] === a.S.rider && !ug.net && gh(h, a) === u && u.net && gc && gc.kind === 'truck' && c.$('paxN')(gc) === 4, 'she takes its wheel, by the host\'s leave: the truck is hers on every client, the same one on the host, still loaded');
  h.Net.close(); h.on = false; await run(3);
  const m0 = a.S.men.filter(m => m.aid && !m.dead).length;
  ok(a.S.host && a.S.my === ug && ug.cargo && ug.cargo.length === 4, 'Hugo leaves: Ana\'s client hosts, she is still at the wheel, and the 4 boxed soldiers are hers to let off');
  await run(2);
  ok(gh(c, a) === gc && gc.pn === 4, 'and Caio still sees her truck loaded');
  await press(a, 'flare'); await run(1); await press(a, 'yawR'); await run(5);
  const cu2 = [...c.Net.ai.values()].find(o => o.kind === 'truck' && Math.hypot(o.x - ug.x, o.z - ug.z) < 5);
  ok(a.S.my.man && !a.S.my.in && !ug.cargo && a.S.men.filter(m => m.aid && !m.dead).length === m0 + 4 && c.S.men.filter(m => m.net && m.aid && !m.dead).length === m0 + 4, 'F and E: the squad is let off, 4 more soldiers on both clients, and she is on foot');
  ok(ug.aid && !ug.net && cu2 === gc && cu2.bye && !cu2.occ.some(Boolean) && cu2.pn === 0 && gh(c, a).man, 'the truck is the host\'s again, parked and empty, the same object on Caio\'s client');
  for (const x of all) if (x.on) x.Net.close(); N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exit(1); });
