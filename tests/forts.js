'use strict';
/* Trenches and sandbags: what is dug before the match, the soldier in a trench (how low it stands, what a round and a burst leave of it by
   direction and stance, a grenade inside), hulls at a trench, what a wall of sandbags stops and what breaches and flattens it, where and
   how fast the two are built, the build mode, and the AI that mans them, digs in, throws into them and shells them */
const H = require('./harness'), ok = H.ok;
let C = H.load({ seed: 53 }), $ = C.$, S, T;
const FORT = $('FORT'), TR = FORT.trench, BG = FORT.bags, MAN = $('MAN'), STANCE = $('STANCE'), BLD = $('BLD'), OBJ = $('OBJ'), HK = $('HK'), SARMS = $('SARMS'), ARMS = $('ARMS'), TANKS = $('TANKS');
const SP = 2 * ($('IAI').sp + SARMS.k98.sp * STANCE[1].sp);   // the spread of a crouched AI rifleman
const DT = .017, hd = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const fresh = era => { S = C.sandbox(era || 'ww2'); T = S.T; for (const f of S.forts.slice()) C.fortDrop(f); S.forts = []; return S; };
const run = (secs, each) => C.run(secs, each, DT);
/* level open ground with nothing within 80 m, x toward +X */
function flat(n) {
  let k = 0;
  for (let z = -S.HW + 600; z < S.HW - 600; z += 97) for (let x = 900; x < S.W - 900; x += 131) {
    const h = C.hgt(x, z); let lv = h > T.WL + 6 && C.routeDist(T, x, z) > 120;
    for (const [a, b] of [[160, 0], [-160, 0], [0, 60], [0, -60], [80, 0], [-80, 0], [30, 0], [-30, 0]]) if (Math.abs(C.hgt(x + a, z + b) - h) > Math.hypot(a, b) * .012 + .15) lv = false;
    if (lv && !C.near(x, z, 170).length && k++ === (n || 0)) return { x, z, y: h };
  }
  throw new Error('no flat ground');
}
let fid = 0;
const work = (k, p, a, prog, team) => C.fortAdd(T.fid + FORT.pre + fid++ % (FORT.slots - FORT.pre), k, team || 0, p.x, p.z, a || 0, prog === undefined ? 1 : prog);
const man = (team, x, z, st, kit) => { const m = C.addMan(kit || (team ? 'rifleman' : 'schutze'), team, x, z, 0); m.st = m.ctl.st = st || 0; return m; };
/* n rounds from d m at angle th off the work's facing, aimed where bodyY says, spread sp: hits and damage on m */
function volley(m, th, d, n, el, at, sp0) {
  const hp0 = (m.hp = 1e6), rnd = H.rng(7 + Math.round(th * 10)); let hits = 0, low = 0;
  const imp = C.impact; C.impact = (o, k, dmg, by, x, y, z, dx, dy, dz, ap) => { const h = imp(o, k, dmg, by, x, y, z, dx, dy, dz, ap); if (o === m && h) { hits++; if (y < m.y + (m.dg || 0)) low++; } return h; };
  for (let i = 0; i < n; i++) {
    const e = el || 0, sx = m.x + Math.cos(th) * Math.cos(e) * d, sz = m.z - Math.sin(th) * Math.cos(e) * d, ty = at === undefined ? $('bodyY')(m) : m.y + at, sy = ty + Math.sin(e) * d + (e ? 0 : 1.2), L = Math.hypot(m.x - sx, ty - sy, m.z - sz), sp = sp0 || SP;
    S.bullets = [{ x: sx, y: sy, z: sz, vx: ((m.x - sx) / L + (rnd() - .5) * sp) * 800, vy: ((ty - sy) / L + (rnd() - .5) * sp) * 800 + 9.81 * L / 800 / 2, vz: ((m.z - sz) / L + (rnd() - .5) * sp) * 800, life: 1.3, team: 1 - m.team, dmg: 10, ap: 0, sa: 1, by: null, tr: 0 }];
    run(.5, () => S.bullets.length > 0);
  }
  C.impact = imp; const dmg = hp0 - m.hp; m.hp = m.max; m.wl = m.wa = 0; m.sup = -9; return { hits, dmg, low };
}
const burst = (m, x, z, r, dmg) => { m.hp = 1e6; C.explode(x, C.hgt(x, z) + .5, z, r, dmg, null, 1 - m.team, false, 0); const d = 1e6 - m.hp; m.hp = m.max; m.sup = -9; return d; };

console.log('-- what is dug before the match --');
for (const era of ['ww2', 'modern']) for (const mode of ['solo', 'online']) {
  const C1 = H.load({ seed: 21 }), C2 = H.load({ seed: 99 }), mk = c => { const s = mode === 'solo' ? c.newState(era, c.$('ERAS')[era].sides[0].fighter, { cls: 'plane' }) : c.newState(era, c.$('ERAS')[era].sides[0].fighter, { net: true, host: true }); return s; };
  const S1 = mk(C1), S2 = mk(C2), T1 = S1.T, F = S1.forts, n = k => F.filter(f => f.k === k).length, R = T1.routes, lineS = C1.$('lineS'), endS = C1.$('endS');
  let posts = 0, postsOk = 0, bad = 0;
  for (let t = 0; t < 2; t++) for (let ri = 0; ri < 2; ri++) for (const s of [lineS(t, ri), endS(t, ri, C1.$('FIELD').base)]) for (const sd of [1, -1]) { const p = C1.routeAt(R[ri], s), x = p.x - p.dz * 30 * sd, z = p.z + p.dx * 30 * sd; posts++; if (F.some(f => f.k === 1 && f.team === t && Math.hypot(f.x - x, f.z - z) < 12)) postsOk++; }
  for (const f of F) { const o = f.o; if (f.prog !== 1 || !f.pre || f.id < T1.fid || f.id >= T1.fid + FORT.pre || T1.byId[f.id] !== o || C1.hgt(f.x, f.z) < T1.WL + .6) bad++; for (const e of [-1, 0, 1]) if (C1.routeDist(T1, f.x + o.c * o.hw * e, f.z - o.s * o.hw * e) < f.F.road) bad++; for (const q of T1.objs) if (Math.abs(q.x - f.x) < 30 && Math.abs(q.z - f.z) < 30 && [-1, -.5, 0, .5, 1].some(e => C1.footD(q, f.x + o.c * o.hw * e, f.z - o.s * o.hw * e) < o.hd)) bad++; }
  const towns = T1.towns.map(w => F.filter(f => f.k === 1 && Math.hypot(f.x - w.x, f.z - w.z) < FORT.dig.town.r + 20).length), bags = T1.towns.map(w => F.filter(f => f.k === 2 && Math.hypot(f.x - w.x, f.z - w.z) < 200).length);
  console.log('   ' + era + ' ' + mode + ': ' + n(1) + ' trench segments and ' + n(2) + ' walls; ' + postsOk + ' of ' + posts + ' line and base posts have theirs, the towns ' + towns.join(' and ') + ' segments and ' + bags.join(' and ') + ' walls, ' + F.filter(f => f.br !== null).length + ' with planks');
  ok(postsOk >= posts - 2 && towns.every(v => v >= 12) && bags.every(v => v >= 2) && !bad && F.length <= FORT.pre, era + ' ' + mode + ': trenches at the line and base posts and round the front of each town, walls at the garrison posts, none on a road, in water or through a house or a tree');
  ok(S2.forts.length === F.length && S2.forts.every((f, i) => f.id === F[i].id && f.k === F[i].k && f.team === F[i].team && f.x === F[i].x && f.z === F[i].z && f.a === F[i].a && f.br === F[i].br), era + ' ' + mode + ': another client with another seed digs the same ones under the same ids');
}

console.log('-- a soldier in a trench --');
fresh('ww2');
{
  const p = flat(), f = work(1, p, 0), m = man(0, p.x, p.z, 0), g = C.hgt(p.x, p.z);
  run(1.2);
  const stand = { y: m.y, top: m.y + STANCE[0].h * MAN.sc - g, eye: $('eyeY')(m) - g, aim: $('bodyY')(m) - g, cv: $('visR')(m) };
  m.ctl.st = 1; run(1.2); const duck = { top: m.y + STANCE[1].h * MAN.sc - g, eye: $('eyeY')(m) - g };
  console.log('   standing it is ' + (g - stand.y).toFixed(2) + ' m down: ' + stand.top.toFixed(2) + ' m of it over the ground, eye at ' + stand.eye.toFixed(2) + ' m, aimed at ' + stand.aim.toFixed(2) + ' m (edge ' + TR.par + '); crouched its top is at ' + duck.top.toFixed(2) + ' m; seen at ' + stand.cv.toFixed(0) + ' m of ' + MAN.see);
  ok(m.fc === f && Math.abs(g - stand.y - TR.depth) < .01 && stand.top > TR.par + .3 && stand.top < 1 && stand.eye > TR.par && stand.aim > TR.par && stand.aim < stand.top && duck.top < 0 && stand.cv < MAN.see * .7, 'it stands ' + TR.depth + ' m lower with only its head over the edge, sees and is aimed at over it, and crouched it is all under the ground');
  m.ctl.st = 0; m.ctl.mx = 1; run(2.5); m.ctl.mx = 0;
  ok(!m.fc && !m.dg && Math.abs(m.y - $('manY')(m.x, m.z)) < .01 && m.x > p.x + 2, 'it walks out of the trench and stands on the ground again');
  const half = work(1, { x: p.x, z: p.z + 40 }, 0, .5), m2 = man(0, p.x, p.z + 40, 0), low = work(1, { x: p.x, z: p.z + 80 }, 0, .2), m3 = man(0, p.x, p.z + 80, 0); run(1.2);
  ok(Math.abs(m2.dg - TR.depth * half.prog) < .01 && half.prog < .6 && m2.dg > 1 && !m3.dg && !m3.fc && low.prog < TR.min, 'a trench half dug shelters half as deep, one barely begun not at all');
}

console.log('-- rounds at a soldier in a trench, by direction and stance --');
fresh('ww2');
{
  const p = flat(), q = flat(40); work(1, p, 0);
  const m = man(0, p.x, p.z, 0), o = man(0, q.x, q.z, 0); run(1);
  const N = 240, open = volley(o, 0, 120, N), dirs = [['front', 0], ['side', Math.PI / 2], ['rear', Math.PI], ['oblique', .7]], res = dirs.map(([n, th]) => [n, volley(m, th, 120, N)]);
  m.ctl.st = 1; run(1); const duck = volley(m, 0, 120, N); o.st = o.ctl.st = 1; const openC = volley(o, 0, 120, N);
  m.ctl.st = 2; run(1); const prone = volley(m, .7, 120, N);
  m.ctl.st = 0; run(1); const plunge = volley(m, Math.PI / 2, 60, N, 1.0, 1.2, .004), plungeX = volley(m, 0, 60, N, .5, 1.2, .004), close = volley(m, 0, 25, N), closeO = volley(o, 0, 25, N);
  console.log('   ' + N + ' rifle rounds from 120 m, aimed: in the open ' + open.hits + ' hits (' + open.dmg.toFixed(0) + ' damage); standing in the trench ' + res.map(([n, r]) => n + ' ' + r.hits + ' (' + r.dmg.toFixed(0) + ')').join(', ') + '; crouched ' + duck.hits + ' (open, crouched: ' + openC.hits + '), prone ' + prone.hits);
  console.log('   from 25 m: ' + close.hits + ' hits (' + close.dmg.toFixed(0) + '), in the open, crouched ' + closeO.hits + ' (' + closeO.dmg.toFixed(0) + '); aimed at the body, plunging at 57 deg along the trench from 60 m: ' + plunge.hits + ' hits, ' + plunge.low + ' below the ground; at 29 deg across it: ' + plungeX.hits + ' hits, ' + plungeX.low + ' below the ground');
  ok(open.hits > N * .25 && res.every(([n, r]) => r.hits > 2 && r.hits < open.hits * .3 && r.low === 0) && res.every(([n, r]) => r.dmg < open.dmg * .6), 'standing in a trench a soldier is hit far less often than in the open, from every side, and only in what shows');
  ok(duck.hits === 0 && prone.hits === 0 && openC.hits > N * .15, 'crouched or prone in it no level fire reaches it');
  ok(close.hits > 10 && plunge.low > 10 && plungeX.hits === 0, 'it can be hit from close by; fire plunging in along the trench reaches the body, fire coming down across it stops in the edge');
}

console.log('-- bursts outside and inside, and a grenade --');
fresh('ww2');
{
  const p = flat(), q = flat(40), f = work(1, p, 0), m = man(0, p.x, p.z, 0), o = man(0, q.x, q.z, 0); run(1);
  const N = MAN.nade, out = burst(m, p.x + 5, p.z, N.r, N.dmg), outO = burst(o, q.x + 5, q.z, N.r, N.dmg), ins = burst(m, p.x, p.z + 5, N.r, N.dmg), insO = burst(o, q.x, q.z + 5, N.r, N.dmg);
  m.ctl.st = 1; o.st = o.ctl.st = 1; run(1); const outC = burst(m, p.x + 5, p.z, N.r, N.dmg), outOC = burst(o, q.x + 5, q.z, N.r, N.dmg), he = burst(m, p.x + 9, p.z, 28, 100), heO = burst(o, q.x + 9, q.z, 28, 100), heIn = burst(m, p.x, p.z - 4, 28, 100);
  console.log('   a grenade 5 m in front: ' + out.toFixed(1) + ' standing in the trench (' + outO.toFixed(1) + ' in the open), ' + outC.toFixed(1) + ' crouched (' + outOC.toFixed(1) + '); 5 m along inside it: ' + ins.toFixed(1) + ' (' + insO.toFixed(1) + '); a howitzer round 9 m off: ' + he.toFixed(1) + ' crouched (' + heO.toFixed(1) + '), inside: ' + heIn.toFixed(0) + ' (' + MAN.hp + ' hp)');
  ok(out < outO * .35 && outC < outOC * .15 && he < MAN.hp * .5 && heO > MAN.hp, 'a burst that lands outside leaves little for a soldier in the trench, least when it is down');
  ok(ins > insO * 1.4 && ins > MAN.hp && heIn > MAN.hp * 2, 'one that lands inside is worse than in the open, and kills');
  m.ctl.st = 0; run(1); m.hp = m.max; const m2 = man(0, p.x, p.z + 4, 0); run(1);
  const th = man(1, p.x + 18, p.z, 0); th.ai = $('manBrain')(1); th.ai.gx = th.x; th.ai.gz = th.z; let nade = null, land = null;
  run(9, () => { const b = S.bombs.find(b => b.k === 'nade'); if (b) { nade = b; land = { x: b.x, z: b.z }; } return !m.dead || S.bombs.length > 0; });
  console.log('   an enemy soldier 18 m away: ' + (nade ? 'throws, the grenade comes down ' + Math.hypot(land.x - m.x, land.z - m.z).toFixed(1) + ' m from its target, ' + (C.trenchAt(land.x, land.z, .5) === f ? 'inside the trench' : 'outside') : 'does not throw') + '; the two in the trench: ' + [m, m2].map(v => (v.dead ? 'dead' : v.hp.toFixed(0) + ' hp')).join(', '));
  ok(nade && C.trenchAt(land.x, land.z, .5) === f && m.dead && th.nades === MAN.nade.n - 1, 'an AI soldier lobs its grenade into the trench on a high arc and kills the man it was thrown at');
}

console.log('-- hulls at a trench --');
for (const era of ['ww2', 'modern']) {
  fresh(era);
  const p = flat(), f = work(1, p, 0), id = Object.keys(TANKS).find(k => TANKS[k].era === era), u = C.addVehicle('tank', id, 0, p.x - 45, p.z + 2, 0); u.ctl.drive = 1;
  let v0 = 0, vin = 99; run(14, () => { if (u.x < p.x - 12) v0 = u.sp; if (Math.abs(u.x - p.x) < 1.5) vin = Math.min(vin, u.sp); });
  const tr = C.addVehicle('truck', null, 0, p.x - 45, p.z - 3, 0); tr.ctl.drive = 1; S.units = [tr]; run(10); const held = tr.x;
  const f2 = work(1, { x: p.x, z: p.z + 60 }, 0); f2.br = 0; const tr2 = C.addVehicle('truck', null, 0, p.x - 45, p.z + 60, 0); tr2.ctl.drive = 1; S.units = [tr2]; let vp = 99; run(12, () => { if (Math.abs(tr2.x - p.x) < 1) vp = Math.min(vp, tr2.sp); });
  const tr3 = C.addVehicle('aa', S.E.sides[0].aa, 0, p.x - 45, p.z + 60 + 5.5, 0); tr3.ctl.drive = 1; S.units = [tr3]; run(10);
  console.log('   ' + era + ' ' + u.def.name + ': ' + v0.toFixed(1) + ' m/s before, ' + vin.toFixed(1) + ' over the trench, ' + (u.x - p.x).toFixed(0) + ' m past it, trench stage ' + S.os[f.id] + '; a truck stops ' + (p.x - held).toFixed(1) + ' m short; over the planks it crosses at ' + vp.toFixed(1) + ' m/s; an AA vehicle beside the planks stops ' + (p.x - tr3.x).toFixed(1) + ' m short');
  ok(u.x > p.x + 20 && vin < v0 * .5 && vin > 1 && S.os[f.id] === 0 && S.oh[f.id] === f.o.hp, era + ': a tank crosses a trench slowly and leaves it as it was');
  ok(held < p.x - 2 && tr2.x > p.x + 15 && vp < tr2.def.spd * .8 && tr3.x < p.x - 2, era + ': wheels do not cross it, except over the planks');
}

console.log('-- sandbags --');
fresh('ww2');
{
  const p = flat(), f = work(2, p, 0), top = BG.size[2], g = C.hgt(p.x, p.z), o = f.o;
  const shot = (y, from) => { S.bullets = [{ x: p.x + from, y: g + y, z: p.z + .4, vx: -Math.sign(from) * 800, vy: 0, vz: 0, life: .4, team: 1, dmg: 10, ap: 0, sa: 1, by: null, tr: 0 }]; const b = S.bullets[0]; run(.3, () => !b.gone); return Math.sign(from) * (p.x - b.x) > 3; };
  const lowS = shot(top - .3, 60), highS = shot(top + .25, 60); let hp1 = S.oh[f.id];
  ok(!lowS && highS && hp1 < o.hp && hp1 > o.hp - .2, 'a round under its top stops in it and one over it flies on; a rifle round takes ' + (o.hp - hp1).toFixed(3) + ' of its ' + o.hp + ' hp');
  const m = man(0, p.x - BG.back, p.z, 1), q = flat(40), ref = man(0, q.x - BG.back, q.z, 1); run(.6);
  const N = 240, beh = volley(m, 0, 120, N), opn = volley(ref, 0, 120, N), rear = volley(m, Math.PI, 120, N); m.ctl.st = 2; run(1); const pr = volley(m, 0, 120, N); m.ctl.st = 0; run(1); const up = volley(m, 0, 120, N);
  console.log('   ' + N + ' rounds from 120 m at a soldier ' + BG.back + ' m behind the wall: crouched ' + beh.hits + ' hits (in the open ' + opn.hits + '), prone ' + pr.hits + ', standing ' + up.hits + ', crouched from behind ' + rear.hits);
  ok(m.fc === f && beh.hits > 0 && beh.hits < opn.hits * .55 && pr.hits === 0 && up.hits > beh.hits && rear.hits > opn.hits * .7, 'behind it a crouched soldier shows only its head and shoulders, a prone one nothing; from behind the wall is no help');
  m.ctl.st = 1; run(1); m.ctl.aim = { x: 1, y: 0, z: 0 }; run(.5); const hp2 = S.oh[f.id]; m.ctl.fire = true; let over = false; run(.4, () => { for (const b of S.bullets) if (b.by === m && b.x > p.x + 6) over = true; }); m.ctl.fire = false;
  ok(over && S.oh[f.id] === hp2, 'crouched behind it the soldier fires over it');
  const N2 = MAN.nade, bf = burst(m, p.x + 5, p.z, N2.r, N2.dmg), bo = burst(ref, q.x + 5 - BG.back, q.z, N2.r, N2.dmg), bb = burst(m, p.x - BG.back - 5, p.z, N2.r, N2.dmg);
  ok(bf < bo * .45 && bb > bo * .8, 'a burst on the far side of the wall leaves ' + bf.toFixed(1) + ' of the ' + bo.toFixed(1) + ' it does in the open; one on the soldier\'s own side ' + bb.toFixed(1));
  S.men = []; S.bullets = [];
  for (const [era, w] of [['ww2', ARMS.ap44], ['modern', ARMS.ap]]) {
    const f3 = work(2, { x: p.x, z: p.z - 40 - (era === 'ww2' ? 0 : 40) }, 0), tk = { team: 1, x: f3.x + 200, y: g + 2, z: f3.z, me: 0 }; let n = 0;
    while (S.os[f3.id] < 2 && n < 6) { C.shell(tk, w, f3.x + 25, C.hgt(f3.x, f3.z) + 1, f3.z, -w.spd, 0, 0); n++; run(.6); }
    console.log('   ' + era + ' tank shells (' + w.dmg + ') to breach a wall of ' + f3.o.hp + ' hp: ' + n); ok(n <= 2 && !S.forts.includes(f3), era + ': one or two tank shells breach it, and it is gone from the list');
  }
  const f4 = work(2, { x: p.x + 60, z: p.z }, 0), rk = man(1, p.x + 110, p.z, 0, 'bazookaman'); C.lobbed(rk, 'heat', SARMS.bazooka, f4.x + 20, C.hgt(f4.x, f4.z) + 1, f4.z, -SARMS.bazooka.spd, 0, 0); run(1.5);
  let ng = 0; const f5 = work(2, { x: p.x + 60, z: p.z + 40 }, 0); while (S.os[f5.id] < 2 && ng < 30) { C.explode(f5.x + 1.5, C.hgt(f5.x, f5.z) + .5, f5.z, N2.r, N2.dmg, null, 1, false, $('OBJD').nade.blast); ng++; run(.1); }
  console.log('   a bazooka rocket leaves a wall at stage ' + S.os[f4.id] + ' with ' + Math.max(0, S.oh[f4.id]).toFixed(0) + ' hp; hand grenades to bring one down: ' + ng);
  ok(S.os[f4.id] >= 1 && ng > 4, 'a rocket breaks or breaches it; hand grenades need many');
  S.men = [];
  const f6 = work(2, { x: p.x - 60, z: p.z }, 0), tank = C.addVehicle('tank', 'sherman', 0, f6.x - 40, f6.z, 0); tank.ctl.drive = 1; let v0 = 0, vmin = 99; run(9, () => { if (tank.x < f6.x - 10) v0 = tank.sp; else if (tank.x < f6.x + 5) vmin = Math.min(vmin, tank.sp); });
  const f7 = work(2, { x: p.x - 60, z: p.z + 40 }, 0), truck = C.addVehicle('truck', null, 0, f7.x - 40, f7.z, 0); truck.ctl.drive = 1; S.units = [truck]; run(8);
  const f8 = work(2, { x: p.x - 60, z: p.z - 40 }, 0), w8 = man(0, f8.x - 12, f8.z, 0); w8.ctl.mx = 1; run(6);
  console.log('   a tank at ' + v0.toFixed(1) + ' m/s drives over a wall: stage ' + S.os[f6.id] + ', ' + vmin.toFixed(1) + ' m/s after; a truck stops ' + (f7.x - truck.x).toFixed(1) + ' m short; a soldier walking at it ends ' + (f8.x - w8.x).toFixed(1) + ' m before it');
  ok(S.os[f6.id] === 2 && tank.x > f6.x + 10 && vmin < v0 * .85 && truck.x < f7.x - 1 && S.os[f7.id] === 0 && w8.x < f8.x, 'a tank flattens it and loses speed; a truck and a soldier are stopped by it');
}

console.log('-- where and how fast they are built --');
fresh('ww2');
{
  const p = flat(), why = (k, x, z, a, t) => C.fortWhy(k, t || 0, x, z, a || 0), r = T.routes[0], rp = C.routeAt(r, r.len / 2), hs = T.houses[5], tree = T.objs.find(o => o.k === 'tree' && o.id >= 30300);
  let wx = 0; for (let x = T.rx(0) - 400; x < T.rx(0) + 400; x += 10) if (C.hgt(x, 0) <= T.WL + .2) { wx = x; break; }
  const R = { road: why(1, rp.x, rp.z, 0), roadB: why(2, rp.x, rp.z, 0), water: why(1, wx, 0), house: why(2, hs.x + (hs.hw + .4) * hs.c, hs.z - (hs.hw + .4) * hs.s), tree: why(1, tree.x + 3, tree.z), ok1: why(1, p.x, p.z), ok2: why(2, p.x, p.z), town: why(2, hs.x + (hs.hw + 2) * hs.c, hs.z - (hs.hw + 2) * hs.s, hs.a), map: why(1, -50, 0) };
  const f = work(1, p, 0), over = why(1, p.x + 1, p.z + 3), cross = why(2, p.x, p.z), end = why(1, p.x, p.z + TR.size[0]), corner = why(1, p.x + TR.size[0] / 2, p.z + TR.size[0] / 2, Math.PI / 2), beside = why(2, p.x + 2.4, p.z);
  const foe = man(1, p.x + 10, p.z + 40, 0), nearFoe = why(1, p.x, p.z + 40); foe.dead = true; S.men = [];
  console.log('   ' + JSON.stringify(R) + '; over another ' + over + ', a wall across a trench ' + cross + ', end to end "' + end + '", at a corner "' + corner + '", a wall on its edge "' + beside + '", an enemy 10 m off ' + nearFoe);
  ok(R.road === 'road' && R.roadB === 'road' && R.water === 'water' && R.house === 'obj' && R.tree === 'obj' && R.ok1 === '' && R.ok2 === '' && R.town === '' && R.map === 'map' && over === 'fort' && cross === 'fort' && end === '' && corner === '' && beside === '' && nearFoe === 'foe', 'not on a road, in water, through a house or a tree, over another work or under an enemy\'s nose; in a town, end to end and wall beside trench it may');
  const time = (k, n, at) => { const s = C.fortStart(k, 0, at.x, at.z, 0), ms = []; for (let i = 0; i < n; i++) ms.push(man(0, at.x - 2.5, at.z + (i - (n - 1) / 2) * 2, 0)); const t0 = S.t; run(FORT.K[k].time + 5, () => s.prog < 1); const t = S.t - t0; for (const m of ms) m.dead = true; S.men = []; return { s, t }; };
  const t1 = time(1, 1, { x: p.x, z: p.z + 60 }), t3 = time(1, 3, { x: p.x, z: p.z + 90 }), b1 = time(2, 1, { x: p.x + 40, z: p.z + 60 });
  console.log('   a trench: ' + t1.t.toFixed(0) + ' s for one soldier, ' + t3.t.toFixed(0) + ' s for three; a wall of sandbags: ' + b1.t.toFixed(0) + ' s for one (a supply base: ' + BLD.time + ' s)');
  ok(Math.abs(t1.t - TR.time * .97) < 1.5 && Math.abs(t3.t - TR.time * .97 / (1 + 2 * BLD.help)) < 1.5 && Math.abs(b1.t - BG.time * .97) < 1 && b1.t < t1.t / 2 && t1.s.prog === 1, 'one builder takes the table\'s time, helpers shorten it, and sandbags go up much faster than a trench is dug');
  const ab = C.fortStart(1, 0, p.x + 40, p.z + 100, 0), m = man(0, p.x + 38, p.z + 100, 0); run(8); const p8 = ab.prog; m.dead = true; S.men = []; run(BLD.decay[0] - 1); const kept = ab.prog; let gone = null; run(60, () => { if (gone === null && !S.forts.includes(ab)) gone = S.t; return gone === null; });
  ok(p8 > .15 && kept === p8 && gone !== null && !T.byId[ab.id] && ![...S.dyn.values()].some(l => l.includes(ab.o)), 'a site left alone holds for ' + BLD.decay[0] + ' s, then fills in and leaves the grid');
  let n = 0, last = ''; for (let i = 0; i < TR.cap + 2; i++) { const s = C.fortStart(1, 1, p.x - 100 - i * 6, p.z + 150, 0); if (s) n++; else last = why(1, p.x - 100 - i * 6, p.z + 150, 0, 1); }
  let nb = 0, lastB = ''; for (let i = 0; i < BG.cap + 2; i++) { const s = C.fortStart(2, 1, p.x - 100 - i * 4, p.z + 190, 0); if (s) nb++; else lastB = why(2, p.x - 100 - i * 4, p.z + 190, 0, 1); }
  ok(n === TR.cap && last === 'tcap' && nb === BG.cap && lastB === 'bcap' && !why(1, p.x, p.z + 200, 0, 0), 'a side may have ' + TR.cap + ' trenches and ' + BG.cap + ' walls of its own building; the other side\'s do not count against it');
}

console.log('-- the player\'s build mode --');
{ C = H.load({ seed: 78 }); $ = C.$; S = C.newState('ww2', 'schutze', { cls: 'inf', mouse: true }); T = S.T; C.plan = () => {}; S.waveTimer = 1e9; S.men = S.men.filter(m => m === S.my); S.squads = []; S.units = [];
  for (const f of S.forts.slice()) C.fortDrop(f); S.forts = [];
  const P = S.my, I = S.input, p = flat(), tap = k => { I[k] = true; C.run(.05); I[k] = false; C.run(.05); }, seq = [];
  P.x = p.x; P.z = p.z; P.inv = 1e9; S.aim.h = 0; S.aim.p = -.25; C.run(.1);
  tap('build'); seq.push(S.bm ? 'base' : S.fm ? 'k' + S.fm.k : 'closed'); tap('build'); seq.push(S.bm ? 'base' : S.fm ? 'k' + S.fm.k : 'closed');
  const B = S.fm, okT = B && B.why === '' && Math.abs(B.x - P.x - (TR.put[0] + TR.put[1]) / 2) < 2.1;
  tap('fire'); const f = S.forts[0], shots = P.arms[0].d.mag - P.arms[0].mag;
  ok(seq.join() === 'base,k1' && okT && f && f.k === 1 && f.team === 0 && Math.abs(f.a - 0) < 1e-9 && Math.abs(f.o.c) < 1e-9 && S.fm && !shots && P.kit === BLD.kit, 'N, N: the trench outline, valid; the click starts it across the line of sight, costs no kit, fires no round and leaves the mode open');
  C.run(.3); const again = S.fm.why; S.aim.h = Math.PI / 2; C.run(.1); const turned = S.fm.why; tap('fire'); const f2 = S.forts[1];
  ok(again === 'fort' && turned === '' && f2 && Math.abs(f2.o.s) < 1e-9, 'on top of the first it is refused (' + again + '); turned a quarter, the next piece goes down along the new facing');
  tap('build'); const k2 = S.fm && S.fm.k; S.aim.h = Math.PI; C.run(.1); tap('fire'); const f3 = S.forts[2]; const ks = []; for (let i = 0; i < 7; i++) { tap('build'); ks.push(S.fm && S.fm.k); } tap('build'); const closed = !S.fm && !S.bm;
  ok(k2 === 2 && f3 && f3.k === 2 && ks.join() === '3,4,5,8,11,12,13' && closed, 'N again: sandbags, started the same way; N goes on through the posts of 1944, the radio relay and the walls (' + ks.join(', ') + ', no anti-rocket dome, no pontoon for a rifleman) and then closes the mode');
  tap('build'); tap('build'); I.ordA = true; C.run(.05); I.ordA = false; ok(!S.fm && !S.bm, 'the right button leaves it');
  S.aim.h = 0; P.x = f.x; P.z = f.z; C.run(TR.time / 1 + 3); ok(f.prog >= 1 && P.fc === f && P.dg > TR.depth - .01, 'standing in its own site the soldier digs it and ends up sheltered in it (m.fc, for ABRIGADO)');
}

console.log('-- the AI mans what is dug --');
for (const era of ['ww2', 'modern']) {
  C = H.load({ seed: 12 }); $ = C.$; S = C.newState(era, $('ERAS')[era].sides[0].fighter, { cls: 'plane' }); T = S.T;
  const park = () => { const P = S.my; P.inv = 9; P.dead = false; P.y = 3000; P.v.y = 0; P.hp = P.def.hp; S.lives = 9; S.base[0].hp = 300; S.waveTimer = 99; };
  for (const p of S.planes) if (p !== S.my) p.gone = true; for (const u of S.units) if (!u.fixed) { u.cargo = null; u.dead = u.gone = true; }
  const garr = S.squads.find(q => q.job === 'garr' && q.team === 0);
  C.director = () => {};   // nothing new comes up the road: a battery that arrives shells a post out of its trench, which is not what this measures
  C.run(40, park);
  const lines = S.squads.filter(q => (q.job === 'line' || q.job === 'base') && q.ord.k === 'hold' && q.at);
  const inT = lines.map(q => q.men.filter(m => !m.dead && m.dg > 1).length + '/' + q.live), all = lines.reduce((a, q) => a + q.men.filter(m => !m.dead && m.dg > 1).length, 0), tot = lines.reduce((a, q) => a + q.live, 0);
  console.log('   ' + era + ': ' + lines.length + ' line and base squads, men standing in their trench after 40 s: ' + inT.join(' '));
  ok(lines.length >= 4 && all >= tot * .8 && lines.every(q => q.men.every(m => m.dead || m.st === 0 || !(m.dg > 0) || (m.ai && m.ai.tgt) || m.sup > S.t))   /* down only between bursts at an enemy in sight, or pinned: the towns reach farther now and a line may be in contact by then */, era + ': the line and base squads stand in the trenches of their posts');
  const gp = garr.ord, e = S.base[1], d = hd(gp, e), fx0 = (e.x - gp.x) / d, fz0 = (e.z - gp.z) / d, foes = [];
  for (let i = 0; i < 4; i++) { const m = C.addMan($('INF')[era][1][0], 1, gp.x + fx0 * 190 + fz0 * i * 5, gp.z + fz0 * 190 - fx0 * i * 5, 0); m.inv = 1e9; foes.push(m); }
  let most = 0, indoors = 0; C.run(45, () => { park(); most = Math.max(most, garr.men.filter(m => !m.dead && m.fc).length); indoors = Math.max(indoors, garr.men.filter(m => !m.dead && m.cbo && m.cbin).length); });
  console.log('   ' + era + ': with enemy soldiers 190 m in front of the garrison, up to ' + most + ' of its ' + garr.live + ' men are at a trench or a wall, up to ' + indoors + ' inside a building');
  ok(most >= 2 || indoors >= 2, era + ': under fire the garrison is in the works near its post or behind the windows of its buildings');
}

console.log('-- the planner digs in --');
for (const era of ['ww2', 'modern']) {
  C = H.load({ seed: 14 }); $ = C.$; fresh(era);
  const p = flat(1), rl = C.railOf(p.x, p.z), q = C.fieldSquad(0, 'held', 0, { k: 'hold', ri: rl.ri, s: rl.s, x: p.x, z: p.z }, p.x, p.z); let t1 = null, tOcc = null, kind = 0;
  q.s = rl.s; let n = 0;
  run(120, () => { if (++n % 90 === 0) C.plan(0); const f = S.forts[0]; if (f) kind = f.k; if (f && f.prog >= 1 && t1 === null) t1 = S.t; if (t1 !== null && tOcc === null && q.men.filter(m => m.dg > 1.5).length >= q.live - 1) tOcc = S.t; return tOcc === null; });
  console.log('   ' + era + ': a squad of ' + q.live + ' holding open ground: ' + (kind ? FORT.K[kind].name + ' started, finished at ' + (t1 === null ? 'never' : t1.toFixed(0) + ' s') + ', manned at ' + (tOcc === null ? 'never' : tOcc.toFixed(0) + ' s') : 'nothing'));
  ok(kind === 1 && t1 !== null && tOcc !== null && S.forts.length === 1, era + ': a squad holding a post with no enemy near digs one trench and gets into it');
  const foe = C.addMan($('INF')[era][1][0], 1, p.x + 300, p.z, 0); foe.inv = 1e9; q.digT = 0; C.fortDrop(S.forts[0]); S.forts = []; run(20, () => { if (++n % 90 === 0) C.plan(0); });
  ok(!S.forts.length, era + ': with an enemy 300 m off it does not start digging'); foe.dead = true; S.men = S.men.filter(m => m !== foe);
  const b = C.addSup(T.nid + 33, 0, p.x + 80, p.z + 80, 0, 1), q2 = C.fieldSquad(0, 'held', 1, { k: 'hold', ri: rl.ri, s: rl.s, x: b.x, z: b.z, R: BLD.ai.guard, b }, b.x + 10, b.z); q2.s = rl.s;
  run(70, () => { if (++n % 90 === 0) C.plan(0); return !S.forts.some(f => f.k === 2 && f.prog >= 1); });
  const w = S.forts.find(f => f.k === 2);
  ok(w && w.prog >= 1 && hd(w, b) < 30 && hd(w, b) > 8, era + ': a squad guarding a supply base stacks sandbags ' + (w ? hd(w, b).toFixed(0) : '?') + ' m in front of it');
}

console.log('-- an assault closes to throw, and a battery shells an occupied trench --');
{
  C = H.load({ seed: 15 }); $ = C.$; fresh('ww2');
  const p = flat(), f = work(1, p, 0, 1, 1), def = [-1, 0, 1].map(i => man(1, p.x, p.z + i * 3, 0, 'rifleman')); run(1);
  const at = man(0, p.x + 110, p.z, 0); at.ai = $('manBrain')(1); at.sq = { ord: { k: 'assault' }, state: 0, team: 0 };
  const sp = C.fortSpot(at, { x: at.x, z: at.z }, def[1]), at2 = man(0, p.x + 110, p.z + 5, 0); at2.ai = $('manBrain')(0); at2.sq = at.sq; const sp2 = C.fortSpot(at2, { x: at2.x, z: at2.z }, def[1]);
  ok(sp && Math.abs(hd(sp, def[1]) - FORT.ai.throw * .8) < .5 && !sp2, 'of an assaulting squad the grenadier is sent to ' + (sp ? hd(sp, def[1]).toFixed(0) : '?') + ' m from a dug-in enemy; the others keep their own cover');
  S.men = S.men.filter(m => def.includes(m)); for (const m of def) m.seenT = S.t;
  const art = C.addVehicle('art', S.E.sides[0].art, 0, p.x - 3000, p.z, 0), w = art.arms[0].d; run(.1);
  for (const m of def) m.seenT = S.t; run(.05);
  const t = C.pickFire(art, w);
  ok(t && t.kind === 'trench' && t.f === f && t.team === 1, 'a battery picks the occupied trench itself (worth ' + $('GAI').art.val.trench + ' plus its men) over any one soldier in it');
  def[0].seenT = def[1].seenT = def[2].seenT = -99; const emp = man(1, p.x + 400, p.z, 0); run(7); S.men = [emp]; run(.2);
  const none = C.pickFire(art, w); ok(!none || none.kind !== 'trench', 'an empty trench is no target');
}
H.done();
