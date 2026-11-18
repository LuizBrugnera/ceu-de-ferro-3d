'use strict';
/* Transport and the sniper, headless: seats (board, cycle, leave), squads called aboard and let off, protection and destruction by vehicle
   and cause, the truck's resupply and material, travel times, the LAV (gun, armour by face, river, smoke), the sniper (ballistics, sway,
   breath, head shot, anti-materiel by part, concealment) and its AI, and the AI's use of cars and LAVs. N: trials of the chance tests */
const H = require('./harness'), N = +process.env.N || 400, C = H.load({ seed: 77 }), $ = C.$, ok = H.ok;
const TRNS = $('TRNS'), ENT = $('ENT'), HK = $('HK'), SNIPE = $('SNIPE'), MAN = $('MAN'), IAI = $('IAI'), ERAS = $('ERAS'), GS = $('GS'), GR = $('GR'), FIELD = $('FIELD'), SPAWN = $('SPAWN'), BLD = $('BLD'), TCOL = $('TCOL'), KITS = $('KITS'), SARMS = $('SARMS');
const pct = v => (100 * v).toFixed(0) + '%', f1 = v => v.toFixed(1);
for (const k of ['headTo', 'endS', 'lineS', 'manEye', 'visR', 'manY', 'paxN', 'roomIn', 'parked', 'canBoard', 'manBrain']) C[k] = $(k);
let S, I, BX = 0, BZ = 0;   // BX BZ: a place on the flat of the home airfield
const box = era => { S = C.sandbox(era); I = S.input; C.step(1 / 60); BX = S.base[0].x - 300; BZ = S.base[0].z - 150; return S; };
const at = (s, off) => { const p = C.routeAt(S.T.routes[0], s); return { x: p.x - p.dz * (off || 0), z: p.z + p.dx * (off || 0), dx: p.dx, dz: p.dz }; };
const tap = k => { I[k] = true; C.step(1 / 60); I[k] = false; C.step(1 / 60); };
const me = (kit, x, z) => { const m = C.addMan(kit, 0, x, z, 0); m.me = 1; S.my = m; S.aim = { h: 0, p: 0, d: { x: 1, y: 0, z: 0 } }; S.mouse = true; return m; };
const park = (kind, team, s, off) => { const p = at(s, off), u = C.addUnit(kind, team, 0, 0, null, false, 0, s, off || 0, 0); u.rail = false; u.x = p.x; u.z = p.z; u.y = C.hgt(p.x, p.z); u.fld = 1; u.ai.park = 1; return u; };
const veh = (id, team, x, z, h) => C.addVehicle('trn', id, team, x, z, h || 0);
const kitOf = (era, side, f) => $('INF')[era][side].find(id => f(KITS[id]));

console.log('tables');
for (const id in TRNS) { const d = TRNS[id]; if (!(d.era && d.parts.length >= 4 && d.lay.length === 1 + (d.seats.gun ? 1 : 0) + d.seats.pax && d.arms.length >= 1)) ok(false, id + ' is incomplete'); }
ok(Object.keys(TRNS).length === 14, 'fourteen vehicles (a radio or command-post vehicle on each side): ' + Object.values(TRNS).map(d => d.name + ' ' + d.kind + ' ' + Math.round(d.spd * 3.6) + ' km/h ' + d.lay.length + ' seats hp ' + d.hp).join('; '));

console.log('seats, solo');
{
  box('ww2'); const s0 = 3000, p = at(s0, 20), u = park('car', 0, s0, 20), m = me('schutze', p.x + 5, p.z + 3);
  C.run(.5); ok(S.near === u, 'beside a parked ' + u.name + ' the soldier is offered it');
  tap('yawR'); ok(S.my === u && m.in === u && m.seat === 0 && !u.ai, 'E boards: the driver\'s seat of an empty car, and the player has the wheel');
  const x0 = u.x, z0 = u.z; S.aim.h = u.h; I.up = true; C.run(4); I.up = false; I.brake = true; C.run(2.5); I.brake = false;
  const dr = Math.hypot(u.x - x0, u.z - z0);
  ok(dr > 30 && Math.hypot(m.x - u.x, m.z - u.z) < 6, 'it drives (' + f1(dr) + ' m in 4 s) and the soldier rides with it');
  tap('yawL'); ok(S.my === m && m.in === u && m.seat >= 1 && u.ai && u.ai.park, 'Q when stopped: the next seat (' + m.seat + ', a passenger\'s), and the car is parked again');
  const bx = m.x; u.x += 3; C.step(1 / 60); ok(Math.abs(m.x - bx - 3) < .01, 'a passenger\'s position is the seat\'s');
  tap('yawL'); tap('yawL'); tap('yawL'); ok(S.my === u && m.seat === 0, 'cycling comes back to the driver\'s seat');
  tap('yawR'); ok(S.my === m && !m.in && Math.hypot(m.x - u.x, m.z - u.z) < 9 && !u.occ.some(Boolean), 'E leaves: on foot beside it, seats empty');
}
{
  box('ww2'); S.fac = [1, 0];   // the player on the Allied side, whose car has a gun
  const u = park('car', 0, 3000, 20); u.ai.park = 0; u.fld = 0; const p = at(3000, 20), m = me('rifleman', p.x + 4, p.z + 3);
  u.ai.rest = 1e9; C.run(4); tap('yawR');
  if (S.my !== u) console.log('   dbg', u.def.id, S.near && S.near.def.id, Math.abs(u.sp), C.seatFor(u, 0), !!u.ai, u.ai && u.ai.park, u.occ.length);
  ok(u.def.id === 'jeep' && S.my === u && m.seat === 1 && u.gp === m && !!u.ai, 'an AI-driven Jeep: E takes the gunner\'s seat, the AI keeps the wheel');
  const foe = C.addMan('schutze', 1, u.x + 120, u.z + 5, 0); I.fire = true; C.run(6, () => { const e = C.eye(u, S.aim.d), d = Math.hypot(foe.x - e.x, foe.z - e.z); S.aim.h = C.headTo(e.x, e.z, foe.x, foe.z); S.aim.p = Math.atan2(foe.y + 1.5 - e.y, d); }); I.fire = false;
  ok(u.arms[0].n > 10 && (foe.dead || foe.hp < foe.max), 'the player fires its gun (' + u.arms[0].n + ' rounds), and hits a soldier 120 m off');
  tap('yawR'); ok(S.my === m && !u.gp, 'and gets out');
}

console.log('squads aboard');
{
  box('ww2'); const p = at(3000, 14), u = veh('opel', 0, p.x, p.z, 0); u.me = 1; S.my = u; S.aim = { h: 0, p: 0, d: { x: 1, y: 0, z: 0 } };
  const q = C.addSquad(0, p.x + 25, p.z + 10, 0, 3000); C.setOrd(q, { k: 'hold', ri: 0, s: 3000 }); q.fd = 1e9; const n = q.live;
  C.run(1); tap('flare'); ok(!!q.lift, 'F at the wheel of a truck calls the squad 27 m off');
  let t = 0; C.run(30, () => { t += 1 / 60; return !(u.cargo && u.cargo.length === n); });
  ok(u.cargo && u.cargo.length === n && S.men.length === 0, 'all ' + n + ' are aboard in ' + f1(t) + ' s, boxed in u.cargo, no soldier left on the map');
  const far = at(4200, 14); u.x = far.x; u.z = far.z; u.y = C.hgt(u.x, u.z); C.run(1);
  const foe = C.addMan('rifleman', 1, u.x + 200, u.z, 0); C.run(1);
  const q2 = S.squads[0];
  ok(!u.cargo && q2 && q2.live === n && q2.ord.k === 'hold' && Math.hypot(q2.men[0].x - u.x, q2.men[0].z - u.z) < 30, 'an enemy at 200 m: the squad gets out by itself, ' + q2.live + ' men, holding there');
  foe.dead = foe.gone = true; C.run(25); q2.fd = 1e9; tap('flare'); if (!q2.lift) console.log('   dbg2', q2.state, q2.live, q2.fd, C.roomIn(u), S.squads.length, q2.men.filter(m => !m.dead).length, Math.hypot(q2.men[0].x - u.x, q2.men[0].z - u.z)); C.run(25); if (!u.cargo || u.cargo.length < n) console.log('   dbg3', u.cargo && u.cargo.length, !!q2.lift, q2.at, q2.ord.k, q2.men.map(m => Math.round(Math.hypot(m.x - u.x, m.z - u.z)) + (m.dead ? 'd' : '') + ':' + m.st + ':' + (m.sup > S.t ? 'p' : '')).join(' '), S.squads.length); ok(u.cargo && u.cargo.length === n, 'called again, aboard again');
  tap('flare'); ok(!u.cargo && S.squads.some(s => s.live === n), 'F with the squad aboard lets it off');
}

console.log('protection of those aboard (' + N + ' damaging hits each), share of hits that reach a human passenger / a boxed man lost');
{
  const shots = [['rifle', HK.bullet, 12, -1], ['MG', HK.bullet, 4.5, 0], ['.50', HK.bullet, 6, .08], ['25 mm', HK.bullet, 10, .3], ['shell fragments', HK.blast, 20], ['AT rocket', HK.shell, 105], ['tank gun', HK.shell, 62]], out = {};
  for (const id of ['kubel', 'opel', 'lav25']) {
    const d = TRNS[id]; box(d.era); const row = [];
    for (const [name, k, dmg, ap] of shots) {
      let hum = 0, boxed = 0, hurt = 0;
      for (let i = 0; i < N; i++) {
        const u = veh(id, 0, 3000, 0), m = C.addMan(kitOf(d.era, 0, k => !k.sp), 0, 3000, 0, 0), hp = u.hp; u.hp = 1e6; u.cargo = [0, 0, 0, 0];
        C.board(m, u, 1 + (d.seats.gun ? 1 : 0)); for (const pt of u.parts) pt.hp = 1e6;
        C.impact(u, k, dmg, null, u.x, u.y + 3, u.z + 1.5, 0, 0, -1, ap);   // from the right side
        if (u.hp < 1e6) hurt++; if (m.hp < m.max) hum++; if (!u.cargo || u.cargo.length < 4) boxed++;
        u.dead = u.gone = m.dead = m.gone = true; S.units = []; S.men = [];
      }
      row.push(name + ' ' + (hurt ? pct(hum / N) + '/' + pct(boxed / N) : 'stopped')); out[id + name] = [hurt, hum, boxed];
    }
    console.log('    ' + d.name.padEnd(12) + row.join(', '));
  }
  ok(out['lav25rifle'][0] === 0 && out['lav25MG'][0] === 0 && out['lav25shell fragments'][1] < N * .15, 'the LAV stops rifle and machine-gun fire outright and nearly all fragments');
  ok(out['lav25.50'][0] > 0 && out['lav25tank gun'][1] > N * .4, 'a .50 from the side and a tank gun go through it');
  ok(out['kubelrifle'][1] > out['opelrifle'][1] && out['opelrifle'][1] > N * .2, 'an open car protects less than a truck, and a truck only partly');
}

console.log('destruction, share who get out alive (' + N + ' vehicles each, 4 boxed and 1 human aboard)');
{
  const res = {};
  for (const id of ['kubel', 'opel', 'lav25']) {
    const d = TRNS[id]; box(d.era); const row = [];
    for (const [name, k] of [['fire or bullets', HK.bullet], ['shell', HK.shell], ['blast', HK.blast], ['missile', HK.missile]]) {
      let hum = 0, boxed = 0, hurt = 0;
      for (let i = 0; i < N; i++) {
        const u = veh(id, 0, 3000, 0), m = C.addMan(kitOf(d.era, 0, k => !k.sp), 0, 3000, 0, 0); u.cargo = [0, 0, 0, 0]; C.board(m, u, u.occ.length - 1);
        u.lastK = k; u.hitT = S.t; C.ruin(u, 1e6, null);
        if (!m.dead) { hum++; if (m.hp < m.max) hurt++; } boxed += S.men.filter(o => o !== m && !o.dead).length;
        S.units = []; S.men = []; S.squads = []; S.wrecks = []; S.debris = [];
      }
      row.push(name + ' ' + pct(hum / N) + ' human (' + pct(hurt / (hum || 1)) + ' of them hurt), ' + pct(boxed / N / 4) + ' boxed'); res[id + k] = [hum / N, boxed / N / 4];
    }
    console.log('    ' + d.name.padEnd(12) + row.join('; '));
  }
  ok(Math.abs(res.opel0[0] - IAI.spill) < .1 && Math.abs(res.opel0[1] - IAI.spill) < .08, 'a truck lost to fire spills as it always did (IAI.spill ' + IAI.spill + '), humans and boxed men alike');
  ok(res.kubel1[0] < res.kubel0[0] && res.lav253[0] < res.lav252[0], 'a shell or a missile leaves fewer than fire or a near burst');
}

console.log('truck: resupply and material');
{
  box('ww2'); const p = at(3000, 30), u = veh('opel', 0, p.x, p.z, 0), m = me('schutze', p.x + 6, p.z + 4); m.arms[0].res = 0; m.hp = 5; m.nades = 0;
  C.run(MAN.fill + 1); ok(m.arms[0].res === m.arms[0].d.mags && m.hp === m.max && m.nades > 0, 'a soldier beside a driven Opel Blitz is rearmed and dressed in ' + MAN.fill + ' s, as beside the AI\'s trucks');
  const build = truck => {
    box('ww2'); const p = at(3000, 60), b = C.startSite(0, p.x, p.z, 0), w = C.addMan('schutze', 0, b.x + BLD.size[0] / 2 + 3, b.z, 0); let t = 0, u = null;
    if (truck) u = veh('opel', 0, b.x, b.z + BLD.size[1] / 2 + 9, 0);
    C.run(200, () => { t += 1 / 60; return b.prog < 1; }); return [t, u];
  };
  const [t0] = build(false), [t1, u1] = build(true);
  ok(t1 < t0 * .6 && u1.mat < 1, 'a site with one builder: ' + f1(t0) + ' s alone, ' + f1(t1) + ' s with a truck parked beside it (material left ' + pct(u1.mat) + ')');
}

console.log('travel from the main base to the line, road 0');
for (const era of ['ww2', 'modern']) {
  box(era); const s0 = C.endS(0, 0, SPAWN.inf), s1 = C.lineS(0, 0), row = [];
  const q = C.addSquad(0, at(s0).x, at(s0).z, 0, s0); C.setOrd(q, { k: 'hold', ri: 0, s: s1 }); let tf = 0;
  C.run(4000, () => { tf += 1 / 20; return !q.at; }, 1 / 20); S.men = []; S.squads = [];
  for (const kind of ['car', 'truck', 'lav']) {
    if (!ERAS[era].sides[0][kind === 'truck' ? 'trk' : kind]) continue;
    const u = C.errand(0, kind, 0, s0, [{ s: s1, k: 'drop' }, { s: s1, k: 'turn' }]); u.cargo = [0, 0, 0]; let t = 0;
    C.run(2000, () => { t += 1 / 30; return !!u.cargo; }, 1 / 30); row.push(u.name + ' ' + f1(t / 60) + ' min');
    ok(!u.cargo && S.squads.length === 1 && t < tf / 2.5, era + ': a squad by ' + u.name + ' is let off at the line in ' + f1(t / 60) + ' min (on foot ' + f1(tf / 60) + ' min, ' + Math.round(Math.abs(s1 - s0)) + ' m)');
    S.units = []; S.men = []; S.squads = [];
  }
}

console.log('LAV');
{
  box('modern'); const A = $('ARMOR').lav, u = veh('lav25', 0, BX, BZ, 0), row = [];
  const faces = [['front', 12, 0, -1, 0], ['side', 0, 5, 0, -1], ['rear', -12, 0, 1, 0]];
  const shots = [['rifle', HK.bullet, 7, -1], ['MG', HK.bullet, 4.5, 0], ['.50', HK.bullet, 6, .08], ['25 mm', HK.bullet, 10, .3], ['AT rocket', HK.shell, 140], ['tank gun', HK.shell, 62]], T = {};
  for (const [nm, k, dmg, ap] of shots) { const r = faces.map(([fn, ox, oz, dx, dz]) => { const h = C.strike(u, k, dmg, null, u.x + ox, u.y + 3.2, u.z + oz, dx, 0, dz, ap); T[nm + fn] = h ? h.dmg : 0; return fn + ' ' + f1(h ? h.dmg : 0); }); row.push(nm + ' (' + dmg + '): ' + r.join(' ')); }
  console.log('    damage let through, hp ' + u.hp + ': ' + row.join('; '));
  ok(!T.riflefront && !T.rifleside && !T.riflerear && !T.MGside && !T.MGrear, 'rifle and machine gun: nothing from any side');
  ok(!T['.50front'] && T['.50side'] > 0 && T['.50rear'] > 0, '.50: nothing on the front, through the sides and the rear');
  ok(T['tank gunfront'] > u.hp * .7 && T['AT rocketside'] > u.hp, 'a tank gun and an AT rocket go through anywhere');
  /* the autocannon against each kind of target, an AI LAV parked 400 m off: seconds to destroy */
  const duel = (mk, secs) => { box('modern'); const l = C.addUnit('lav', 0, BX, BZ, null, true), p = { x: BX + 400, z: BZ }, t = mk(p); l.ai.park = 1; let n = 0; C.run(secs, () => { n += 1 / 60; return !t().dead; }); return [t().dead ? n : 0, t()]; };
  const tk = (kind, id, h) => p => { const o = C.addUnit(kind, 1, p.x, p.z, id, true); o.h = h === undefined ? o.h : h; o.ai = null; return () => o; };
  const r = [['a squad of 6', p => { const q = C.addSquad(1, p.x, p.z, 0, 4600); q.men.forEach(m => { m.ai = null; m.ctl.st = 0; }); return () => ({ dead: q.men.every(m => m.dead) }); }, 60],
    ['Ural truck', tk('truck'), 40], ['Tigr car', tk('car'), 40], ['BTR-82A side on', tk('lav', null, Math.PI / 2), 60], ['Pantsir', tk('aa', 'pantsir'), 60], ['T-90 front', tk('tank', 't90', Math.PI), 30]].map(([nm, mk, secs]) => { const [t, o] = duel(mk, secs); return [nm, t, o]; });
  console.log('    autocannon, 400 m: ' + r.map(([nm, t, o]) => nm + ' ' + (t ? f1(t) + ' s' : 'not in time' + (o.hp !== undefined ? ' (hp ' + f1(o.hp) + '/' + o.max + ')' : ''))).join('; '));
  ok(r.slice(0, 5).every(x => x[1] > 0) && !r[5][1], 'it destroys infantry, truck, car, another LAV and an AA vehicle, and not a tank from the front');
  { box('modern'); const l = C.addUnit('lav', 0, BX, BZ, null, true), p = { x: BX + 300, z: BZ }, pl = C.addPlane('su25', 1, p.x, C.hgt(p.x, p.z) + 150, p.z, 0, true, 'cas'); pl.ai = false; pl.v = { x: 0, y: 0, z: 0 }; l.ai.park = 1; let hp = pl.hp;
    C.run(4, () => { pl.x = p.x; pl.z = p.z; pl.y = C.hgt(p.x, p.z) + 150; pl.v = { x: 0, y: 0, z: 0 }; }); ok(pl.hp < hp || pl.dead, 'and it fires at a low aircraft (a hovering target 300 m off loses ' + f1(hp - Math.max(0, pl.hp)) + ' hp in 4 s)'); }
  /* river */
  const cross = id => { box('modern'); const z = 2000, rx = S.T.rx(z), u = veh(id, 0, rx - 330, z, 0); u.ctl.drive = 1; let wet = 0, t = 0; C.run(400, () => { t += 1 / 30; if (u.wet) wet += 1 / 30; return u.x < rx + 320 && t < 399; }, 1 / 30); return [u, rx, wet, t]; };
  const [l, rx, wet, t] = cross('lav25'), [tr, rx2] = cross('hemtt'), [b] = cross('btr82');
  ok(l.x > rx + 300 && wet > 20 && b.x > rx + 300, 'the LAV-25 and the BTR-82A swim the river (' + f1(wet) + ' s afloat, across in ' + f1(t) + ' s)');
  ok(tr.x < rx2, 'a truck stops at the water (' + Math.round(rx2 - tr.x) + ' m short of the middle)');
  box('modern'); const s = veh('lav25', 0, BX, BZ, 0), n0 = s.smk; C.popSmoke(s); ok(n0 === 2 && s.smk === 1 && S.smokes.length === 1, 'smoke launchers: 2 salvos, one fired puts up a screen');
  ok(s.def.parts.map(p => p.id).join() === 'hull,wFL,wFR,wRL,wRR,steer,engine,trans,fuel,trav,gun,sight,driver,gunner,cmdr', 'parts: ' + s.def.parts.map(p => p.lab).join(', '));
}

console.log('sniper');
{
  const shot = (era, kit, R, st, fn) => { box(era); const m = me(kit, BX, BZ); m.st = m.ctl.st = st || 0; m.y = C.manY(m.x, m.z); return m; };
  for (const [era, kit] of [['ww2', 'scharf'], ['modern', 'blueSniper']]) {
    const w = KITS[kit].arms[0], row = [];
    for (const R of [300, 600, 1000]) {
      box(era); const m = me(kit, BX, BZ); m.y = 3000; m.ctl.ads = true; m.sw = { a: 0, x: 0, y: 0 }; m.f = { x: 1, y: 0, z: 0 };
      C.snipe(m, m.arms[0]); const b = S.slugs[0]; b.y = 3000; b.x = m.x; b.vy = 0; b.vx = w.spd; b.vz = 0; let t = 0;
      while (b.x - m.x < R && !b.gone) { C.stepSlugs(1 / 240); t += 1 / 240; }
      const drop = 3000 - b.y, an = .5 * GR * (R / w.spd) ** 2; row.push(R + ' m: ' + f1(t * 1000 / 1000 * 1) + ' s, drop ' + drop.toFixed(2) + ' m');
      if (Math.abs(drop - an) > an * .05 + .05 || Math.abs(t - R / w.spd) > .02) ok(false, w.name + ' at ' + R + ' m: drop ' + drop + ' vs ' + an);
    }
    ok(true, w.name + ' (' + w.spd + ' m/s): ' + row.join('; '));
  }
  /* sway: the spread of 300 rounds, mrad, by stance and breath */
  const spread = (st, hold, move) => {
    box('modern'); const m = me('blueSniper', BX, BZ); m.ctl.st = st; m.ctl.ads = true; S.aim.d = { x: 1, y: 0, z: 0 }; I.ordA = true; C.run(4);
    let sx = 0, n = 0;
    for (let i = 0; i < (hold ? 60 : 300); i++) { I.thrUp = hold; if (move) I.up = true; C.run(hold ? 2.6 : .35); m.arms[0].mag = 5; m.arms[0].cool = 0; C.snipe(m, m.arms[0]); const b = S.slugs[S.slugs.length - 1], a = Math.hypot(Math.atan2(-b.vz, b.vx) - Math.atan2(-m.f.z, m.f.x), Math.asin(b.vy / 853)); sx += a * a; n++; S.slugs = []; if (hold) { I.thrUp = false; C.run(4.5); } }
    return Math.sqrt(sx / n) * 1000;
  };
  const sd = spread(0, false), cr = spread(1, false), pr = spread(2, false), hb = spread(2, true), mv = spread(0, false, true);
  ok(sd > cr && cr > pr && pr > hb * 2 && mv > sd * 1.5, 'spread, mrad: standing ' + sd.toFixed(2) + ', walking ' + mv.toFixed(2) + ', crouched ' + cr.toFixed(2) + ', prone and still ' + pr.toFixed(2) + ', prone with the breath held ' + hb.toFixed(2) + ' (at 600 m: ' + (hb * .6).toFixed(2) + ' m)');
  { box('modern'); const m = me('blueSniper', BX, BZ); m.ctl.st = 2; m.ctl.ads = true; I.ordA = true; I.thrUp = true; let t = 0; C.run(12, () => { t += 1 / 60; return m.sw.hb || t < 1; }); ok(Math.abs(t - SNIPE.hold.t) < .6 && S.t < m.sw.out, 'the breath lasts ' + f1(t) + ' s, then the sniper is out of it for ' + SNIPE.hold.out + ' s'); }
  { box('modern'); const m = me('blueSniper', BX, BZ); C.run(1); const hip = []; for (let i = 0; i < 100; i++) { m.arms[0].mag = 5; C.snipe(m, m.arms[0]); const b = S.slugs.pop(); hip.push(Math.abs(Math.atan2(-b.vz, b.vx))); } ok(Math.max(...hip) > .015, 'unscoped, from the hip: up to ' + (Math.max(...hip) * 1000).toFixed(0) + ' mrad off, weak at close range; ' + (60 / m.arms[0].d.rate).toFixed(0) + ' rounds a minute, reload ' + m.arms[0].d.rl + ' s'); }
  /* a head shot and a body shot at 600 m, the round flown */
  const hitAt = (era, kit, part) => {
    box(era); const m = me(kit, BX, BZ), t = C.addMan(kitOf(era, 1, k => !k.sp), 1, BX + 600, BZ, Math.PI), w = m.arms[0].d; m.ctl.ads = true; m.st = 2; m.sw = { a: 0, x: 0, y: 0 };
    const e = C.manEye(m), ty = t.y + $('STANCE')[0].h * MAN.sc * (part === 'head' ? .925 : part === 'legs' ? .2 : .62), tt = 600 / w.spd, d = C.vnorm({ x: t.x - e.x, y: ty + .5 * GR * tt * tt - e.y, z: t.z - e.z });
    m.f = d; C.snipe(m, m.arms[0]); let n = 0; while (S.slugs.length && n++ < 400) C.step(1 / 120); return t;
  };
  const tally = part => { let k = 0, h = 0; for (let i = 0; i < 40; i++) { const t = hitAt('ww2', 'scharf', part); if (t.hp < t.max) h++; if (t.dead) k++; } return [k, h]; };
  const hd = tally('head'), bd = tally('body'), lg = tally('legs');
  ok(hd[0] === hd[1] && hd[1] > 25 && bd[0] > bd[1] * .6 && !lg[0] && lg[1] > 25, 'Kar 98k ZF39 at 600 m, 40 rounds each: aimed at the head ' + hd[1] + ' hit and ' + hd[0] + ' killed; at the chest ' + bd[1] + ' hit and ' + bd[0] + ' killed (an arm in the way saves the rest); at the legs ' + lg[1] + ' hit, none killed');
  /* anti-materiel: one round on each part of each light vehicle, from the side, and what it does */
  const am = (era, kit, mk, lx, ly, from) => {
    box(era); const m = me(kit, BX, BZ), u = mk(), c = Math.cos(u.h), s = Math.sin(u.h); m.ctl.ads = true; m.sw = { a: 0, x: 0, y: 0 };
    const tx = u.x + c * lx, tz = u.z - s * lx, ty = u.y + 1.5 + ly, k = from === 2 ? -1 : 1, sx = from ? u.x - c * 200 * k : tx - s * 200, sz = from ? u.z + s * 200 * k : tz - c * 200; m.x = sx; m.z = sz; m.y = C.manY(sx, sz);
    const e = C.manEye(m), tt = 200 / m.arms[0].d.spd; m.f = C.vnorm({ x: tx - e.x, y: ty + .5 * GR * tt * tt - e.y, z: tz - e.z });
    const hp = u.hp, parts = u.parts.map(p => p.hp); let lab = null; const F = S.floats.length;
    C.snipe(m, m.arms[0]); let n = 0; while (S.slugs.length && n++ < 200) C.step(1 / 120);
    const i = u.parts.findIndex((p, k) => k && p.hp < parts[k]); return { u, d: hp - u.hp, pt: i > 0 ? u.def.parts[i].id : hp > u.hp ? 'hull' : '-', drive: u.mod.drive, crew: u.def.parts.pos.filter(i => u.parts[i].hp > 0).length };
  };
  const fixed = (kind, id) => () => { const u = C.addUnit(kind, 1, BX + 300, BZ - 100, id, true); u.ai = null; u.h = 0; return u; };
  const row = [];
  for (const [nm, mk, d] of [['Ural', fixed('truck'), TRNS.ural], ['Tigr', fixed('car'), TRNS.tigr], ['BTR-82A', fixed('lav'), TRNS.btr82]]) {
    const eng = am('modern', 'blueSniper', mk, d.l * .34 * GS, (.5 + d.hh / 2) * GS), wh = am('modern', 'blueSniper', mk, d.kind === 'lav' ? 0 : -d.l * .32 * GS, .35 * GS), hull = am('modern', 'blueSniper', mk, -d.l * .2 * GS, (.6 + d.hh * .7) * GS);
    row.push(nm + ': engine shot -> ' + eng.pt + ' -' + f1(eng.d) + ' hp, drive ' + pct(eng.drive) + '; wheel shot -> ' + wh.pt + ', drive ' + pct(wh.drive) + '; body shot -> ' + hull.pt + ' -' + f1(hull.d) + ' hp');
    ok(eng.pt === 'engine' && /^w[FR][LR]$/.test(wh.pt) && hull.d > 0 && eng.drive < 1 && wh.drive < 1, nm + ': the round lands on the part aimed at (engine, wheels, hull) and hurts it');
  }
  console.log('    ' + row.join('\n    '));
  { let crew = 0; for (let i = 0; i < 60; i++) { const r = am('modern', 'blueSniper', fixed('truck'), 0, (.6 + 1.1 * .5) * GS); if (r.crew < 2) crew++; } ok(crew > 8, 'a round through the body of a truck takes one of its crew ' + pct(crew / 60) + ' of the time'); }
  const fr = am('modern', 'blueSniper', fixed('lav'), 0, 1.3 * GS, 2), rr = am('modern', 'blueSniper', fixed('lav'), -2, 1.2 * GS, 1);
  const tk = am('modern', 'blueSniper', fixed('tank', 't90'), 0, 1.6 * GS), aa = am('modern', 'blueSniper', fixed('aa', 'pantsir'), 0, 1.5 * GS), old = am('ww2', 'scharf', () => { const u = C.addUnit('truck', 1, BX + 300, BZ - 100, null, true); u.ai = null; u.h = 0; return u; }, 0, 2.2);
  const pz = am('modern', 'blueSniper', fixed('art', 'msta'), 0, 1.5 * GS), hu = am('ww2', 'scharf', fixed('art', 'priest'), 0, 2);
  ok(fr.d === 0 && rr.d > 0, 'BTR-82A: nothing through the front, ' + f1(rr.d) + ' hp through the rear');
  ok(tk.d === 0 && aa.d > 0 && pz.d === 0 && old.d === 0 && hu.d === 0, 'nothing against a T-90 or a closed 2S19; ' + f1(aa.d) + ' hp on a Pantsir; the scoped rifles of 1944 do nothing to a truck or an open gun');
  { box('modern'); const m = me('blueSniper', BX, BZ), p = C.addPlane('su25', 1, BX + 300, m.y + 60, BZ, 0, true, 'cas'); p.ai = false; m.sw = { a: 0, x: 0, y: 0 }; m.ctl.ads = true; const hp = p.hp, e = C.manEye(m); m.f = C.vnorm({ x: p.x - e.x, y: p.y - e.y + .6, z: p.z - e.z }); p.v = { x: 0, y: 0, z: 0 };
    C.snipe(m, m.arms[0]); for (let i = 0; i < 60 && S.slugs.length; i++) { C.stepSlugs(1 / 120); } ok(p.hp < hp, 'an aircraft that is hit takes it: Su-25 -' + f1(hp - p.hp) + ' hp'); }
  /* concealment */
  { box('modern'); const a = C.addMan('blueSniper', 0, BX, BZ, 0), b = C.addMan('blueRifle', 0, BX, BZ + 40, 0); a.ctl.st = b.ctl.st = 2; C.run(4);
    const va = C.visR(a), vb = C.visR(b); C.run(.1); a.ctl.mx = 1; C.run(1.5); const vm = C.visR(a);
    ok(va < vb * .35 && vm > va * 2, 'a sniper prone and still is made out at ' + Math.round(va) + ' m, a prone rifleman at ' + Math.round(vb) + ' m; crawling, the sniper at ' + Math.round(vm) + ' m'); }
}

console.log('AI sniper');
{
  const setup = (era, mk) => { box(era); const q = C.addSquad(0, BX, BZ, 0, C.railOf(BX, BZ).s, []); const m = C.addMan(kitOf(era, 0, k => k.snp), 0, BX, BZ, 0); m.ai = C.manBrain(0); m.sq = q; q.men.push(m); q.n0 = q.live = 1; q.ord = { k: 'hold', ri: q.ri, s: q.s, x: BX, z: BZ, R: 1 }; q.at = true; S.squads = [q]; mk(m); return m; };
  const still = o => { o.ai = null; return o; };
  let rf, lm, sn;
  const m = setup('ww2', () => { rf = still(C.addMan('rifleman', 1, BX + 250, BZ + 30, 0)); lm = still(C.addMan('bargunner', 1, BX + 330, BZ - 30, 0)); sn = still(C.addMan('sniper', 1, BX + 420, BZ, 0)); });
  m.sq.ord.k = 'observe'; C.run(20); m.sq.ord.k = 'hold';   // it notices them first (they are made out over time), then picks by worth
  const order = []; C.run(120, () => { for (const [n, o] of [['sniper', sn], ['machine gunner', lm], ['rifleman', rf]]) if (o.dead && !order.includes(n)) order.push(n); return order.length < 3; });
  ok(order[0] === 'sniper' && order[1] === 'machine gunner', 'three targets at 250 to 420 m: it takes them in the order ' + order.join(', ') + ' (' + m.arms[0].t.toFixed(0) + ' s, ' + (m.ai.n || 0) + ' shots since its last move)');
  { const m = setup('ww2', () => { for (let i = 0; i < 12; i++) still(C.addMan('rifleman', 1, BX + 300 + i * 8, BZ - 40 + i * 7, 0)); }); const x0 = m.x, z0 = m.z; let moved = 0, shots = 0, t0 = -9;
    C.run(90, () => { if (m.arms[0].t !== t0) { t0 = m.arms[0].t; shots++; } if (m.ai.rx && !moved) moved = shots; return !moved || Math.hypot(m.x - x0, m.z - z0) < 20; });
    ok(moved >= 2 && moved <= 5 && Math.hypot(m.x - x0, m.z - z0) >= 20, 'after ' + (moved - 1) + ' shots it moves ' + Math.round(Math.hypot(m.x - x0, m.z - z0)) + ' m and goes on from there'); }
  { let t; const m = setup('modern', () => { t = C.addUnit('truck', 1, BX + 400, BZ, null, true); t.ai = null; }); C.run(40); ok(t.hp < t.max || t.dead, 'with an anti-materiel rifle it shoots at a truck 400 m off (' + f1(Math.max(0, t.hp)) + ' of ' + t.max + ' hp left)'); }
  { let t; const m = setup('ww2', () => { t = still(C.addMan('rifleman', 1, BX + 300, BZ, 0)); }); m.sq.ord.k = 'observe'; const n0 = m.arms[0].mag; C.run(30); ok(!t.dead && m.arms[0].mag === n0 && S.t - t.seenT < 2, 'under the order observe it does not fire, and what it sees is reported (spotted)'); }
}

console.log('the AI\'s cars and LAVs');
for (const era of ['ww2', 'modern']) {
  C.seed(5 + era.length); const S2 = C.newState(era, ERAS[era].sides[0].tanks[0], { cls: 'tank', mouse: true }); S = S2; S.lives = 99;
  let pat = 0, pool = 0, lav = 0, snp = 0, err = null, lavShots = 0, drops = 0;
  try { C.run(420, () => { if (S.my && S.my.dead) S.lives = 99; }, 1 / 30); } catch (e) { err = e.stack.split('\n').slice(0, 3).join(' | '); }
  for (const u of S.units) { if (u.run && u.run.k === 'patrol') pat++; if (u.ai && u.ai.park) pool++; if (u.kind === 'lav') { lav++; lavShots += u.arms[0].n; } }
  snp = S.men.filter(m => m.def.snp && !m.dead).length;
  ok(!err && pool >= 2 && snp >= 2 && (era === 'ww2' ? !lav : lav >= 1), era + ', 7 min solo: parked vehicles ' + pool + ', patrol cars now ' + pat + ', LAVs ' + lav + (lav ? ' (' + lavShots + ' rounds fired)' : '') + ', snipers alive ' + snp + (err ? ' ' + err : ''));
}
{
  box('modern'); S.over = false; S.demo = false; S.waveTimer = 1e9; S.wave = 1; S.base[0].hp = 1e9;
  const s0 = C.lineS(0, 0) + 2500, p = at(s0, 14), q = C.fieldSquad(0, 'line', 0, { k: 'hold', ri: 0, s: C.lineS(0, 0) }, p.x, p.z), n = q.live; let got = null, t = 0, full = 0, drop = null;
  C.run(600, () => { t += 1 / 30; for (const p of S.planes) p.gone = true; got = got || S.units.find(u => u.run && u.run.q === q); if (got && got.cargo) full = Math.max(full, got.cargo.length); if (got && full && !got.cargo) drop = got.s; return drop === null; }, 1 / 30);
  ok(got && full === n && Math.abs(drop - C.lineS(0, 0)) < 200, 'a squad 2,5 km short of its post is fetched by a ' + (got ? got.name : '?') + ': ' + full + ' of ' + n + ' aboard, let off ' + (drop === null ? '?' : Math.round(Math.abs(drop - C.lineS(0, 0)))) + ' m from the post after ' + f1(t / 60) + ' min (on foot: ' + f1(2500 / FIELD.pace / 60) + ' min)');
}
H.done();
