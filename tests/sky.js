'use strict';
/* day, night and weather (SKY): the light clock and its presets, what the dark leaves of each optic, the muzzle flash, flares, illumination
   rounds and searchlights, rain, low fog and wind, the player's eyes on the side's map, and the AI's lights at night. Clocks are moved by
   hand (S.t) where only the meter is looked at, and the simulation is run where the AI has to act */
const H = require('./harness'), { ok, done } = H, C = H.load(), $ = C.$;
console.log('page: ' + H.PAGE);
if (!$('typeof SKY !== "undefined"')) { console.log('no SKY table: a page before day and night'); process.exit(0); }
let S, B, side;
const fresh = (era, sky, wx) => { C.seed(7); S = C.sandbox(era || 'modern'); $('skyInit')(sky, wx); B = S.base[0]; side = S.E.sides; return S; };
const kit = (era, team) => (era === 'ww2' ? (team ? 'rifleman' : 'schutze') : team ? 'redRifle' : 'blueRifle');
const man = (team, x, z, h) => { const m = C.addMan(kit(S.era, team), team, B.x + x, B.z + z, h || 0); m.ai = $('manBrain')(0); m.ai.gx = m.x; m.ai.gz = m.z; return m; };
function tk(a, t, max, dt, each) { dt = dt || .25; const t0 = S.t; for (; S.t - t0 < (max || 30);) { S.t += dt; if (each) each(); if ($('notice')(a, t)) return S.t - t0; } return Infinity; }
const f1 = v => (Number.isFinite(v) ? v.toFixed(1) : 'never'), near = (a, b, e) => Math.abs(a - b) < (e || 1e-6);

console.log('-- the clock --');
{
  fresh('modern');
  ok(S.sky.pre === 'dia' && S.wx.pre === 'limpo' && S.sky.L === 1 && !S.sky.on && S.wx.wx === 0 && S.wx.wz === 0, 'a match with no choice is a calm clear day, and takes nothing from sight');
  const at = h => { S.sky.h0 = h; S.sky.t0 = S.t; $('skyLight')(); return S.sky.L; };
  const noon = at(12), mid = at(0), dusk = at(18), late = at(19.5);
  ok(noon === 1 && mid === 0 && dusk > 0 && dusk < 1 && late === 0, 'light: noon ' + noon + ', midnight ' + mid + ', 18 h ' + dusk.toFixed(2) + ' (dusk), 19:30 ' + late);
  for (const [p, h, r] of [['dia', 9, 6], ['tarde', 17, 6], ['noite', 23, 6], ['ciclo', 12, 24]]) { fresh('modern', p); ok(S.sky.h0 === h && S.sky.rate === r, p + ' starts at ' + h + ' h and runs ' + r + ' s of day a second'); }
  fresh('modern', 'tarde'); S.over = true; const h0 = $('skyHour()'); C.run(1); S.t += 599; const h1 = $('skyHour()');
  ok(near(h1 - h0, 1, .01), 'ten minutes of play are an hour of the day (' + h0.toFixed(2) + ' h to ' + h1.toFixed(2) + ' h)');
  fresh('modern', 'tarde'); S.t = 1800; $('skyLight')(); ok(S.sky.L === 0 && S.sky.on, 'Entardecer: night has fallen half an hour in');
  fresh('modern', 'noite'); S.t = 3600; $('skyLight')(); ok(S.sky.L === 0, 'Noite: still dark at the end of a long match (' + $('skyHour()').toFixed(1) + ' h)'); S.t = 3600 * 1.3; $('skyLight')(); ok(S.sky.L > 0, 'and dawn comes after that');
  fresh('modern', 'nada', 'nada'); ok(S.sky.pre === 'dia' && S.wx.pre === 'limpo', 'an unknown preset is the default');
}

console.log('-- what the dark leaves of each optic --');
{
  const see = (era, oc, j, L) => { fresh(era); S.sky.L = L; S.sky.on = L < 1; const a = { x: B.x, y: C.hgt(B.x, B.z), z: B.z }, t = { x: B.x + 300, y: C.hgt(B.x + 300, B.z), z: B.z }; return $('skySee')(a, t, oc, j, 300, $('skyLit')(t)); };
  ok(near(see('ww2', 'man', 0, 0), .3) && near(see('ww2', 'tank', 0, 0), .3) && near(see('ww2', 'plane', 0, 0), .3), '1944 at night: every eye sees at x0.3');
  ok(near(see('modern', 'man', 0, 0), .6) && near(see('modern', 'snp', 1, 0), .8) && near(see('modern', 'tank', 0, 0), .8) && near(see('modern', 'heli', 1, 0), .8), 'today: a soldier\'s night vision x0.6, a sniper\'s scope, a tank\'s and a helicopter\'s thermal sights x0.8');
  ok(near(see('modern', 'aa', 0, 0), 1), 'a SAM radar does not care for the dark');
  ok(near(see('modern', 'man', 0, .5), .8) && near(see('ww2', 'man', 0, 1), 1), 'at dusk half way between; by day nothing is lost');
}

console.log('-- a soldier at night: how far, and what gives a target away --');
const rows = [];
{
  const T = (era, sky, x, opt) => { fresh(era, sky); const a = man(1, 0, 0, 0), t = man(0, x, 0, 0); t.ai = null; if (opt) opt(a, t); return tk(a, t, 40); };
  const d300 = T('ww2', 'dia', 300), n300 = T('ww2', 'noite', 300), n120 = T('ww2', 'noite', 120), nv300 = T('modern', 'noite', 300), md300 = T('modern', 'dia', 300);
  rows.push(['1944 soldier, day, 300 m', d300], ['1944 soldier, night, 300 m', n300], ['1944 soldier, night, 120 m', n120], ['today, night vision, 300 m', nv300], ['today, day, 300 m', md300]);
  ok(n300 > d300 * 2, '1944: at night a still soldier at 300 m takes far longer (' + f1(n300) + ' s) than by day (' + f1(d300) + ' s)');
  ok(n120 < 15, 'but one at 120 m is still made out (' + f1(n120) + ' s)');
  ok(nv300 < n300 && nv300 > md300, 'night vision makes it out sooner than the naked eye (' + f1(nv300) + ' s), later than by day (' + f1(md300) + ' s)');
  const fl = T('ww2', 'noite', 300, (a, t) => { t.shotT = 0; }), flash = (() => { fresh('ww2', 'noite'); const a = man(1, 0, 0, 0), t = man(0, 300, 0, 0); t.ai = null; return tk(a, t, 40, .25, () => { t.shotT = S.t - .1; }); })();
  rows.push(['1944 soldier, night, 300 m, firing', flash]);
  ok(flash < n300 / 3, 'the muzzle flash gives a shooter away at night: ' + f1(flash) + ' s firing against ' + f1(n300) + ' s still');
  const lit = T('ww2', 'noite', 300, (a, t) => { $('skyIll')(0, t.x, t.y, t.z, t.x, t.z, 1, 0); });
  rows.push(['1944 soldier, night, 300 m, under a flare', lit]);
  ok(lit < n300 / 2 && lit < d300 * 1.5, 'under a flare it is seen almost as by day: ' + f1(lit) + ' s (day ' + f1(d300) + ' s)');
  const far = T('ww2', 'noite', 300, (a, t) => { $('skyIll')(0, t.x, t.y, t.z, t.x + 1500, t.z, 1, 0); });
  ok(far >= n300 * .9, 'a flare 1.5 km away lights nothing here (' + f1(far) + ' s)');
  fresh('ww2', 'noite'); const i = $('skyIll')(1, B.x, 0, B.z, B.x + 400, B.z, 0, 3); const q = { x: B.x + 400, y: C.hgt(B.x + 400, B.z), z: B.z };
  const before = $('skyLit')(q); S.t += 3.5; const after = $('skyLit')(q);
  ok(before === 0 && after > .85 && i.y > q.y + 300, 'an illumination round bursts high over its target after its flight (' + before + ' then ' + after.toFixed(2) + ')');
  S.t = i.end + 1; C.run(.1); ok(!S.ill.includes(i), 'and burns out');
}

console.log('-- searchlights --');
{
  fresh('ww2', 'noite'); S.over = true;
  const g = C.addUnit('aa', 1, B.x, B.z, side[1].aa, true), y0 = C.hgt(B.x, B.z), pl = C.addPlane(side[0].fighter, 0, B.x + 2000, y0 + 1500, B.z, 0, false);
  g.ty = 0; g.h = 0; g.tp = Math.atan2(1500 - 4, 2000); $('gunDir')(g); C.run(.05);
  ok(S.beams.length === 1, '1944: the AA gun carries a searchlight at night');
  ok($('skyLit')(pl) > .85, 'an aircraft in its beam is lit (' + $('skyLit')(pl).toFixed(2) + ')');
  g.ty = 1; $('gunDir')(g); C.run(.05); ok($('skyLit')(pl) === 0, 'off the beam it is dark');
  fresh('modern', 'noite'); S.over = true; const g2 = C.addUnit('aa', 1, B.x, B.z, side[1].aa, true); $('gunDir')(g2); C.run(.05);
  ok(S.beams.length === 0, 'today there are no searchlights');
  fresh('ww2', 'dia'); S.over = true; C.addUnit('aa', 1, B.x, B.z, side[1].aa, true); C.run(.05); ok(S.beams.length === 0, 'nor by day');
}

console.log('-- rain, low fog and wind --');
{
  const T = (wx, x, opt) => { fresh('modern', 'dia', wx); const a = man(1, 0, 0, 0), t = man(0, x, 0, 0); t.ai = null; if (opt) opt(a, t); return tk(a, t, 40); };
  const clear = T('limpo', 300), rain = T('chuva', 300), fog = T('neblina', 300), fog100 = T('neblina', 100);
  rows.push(['soldier 300 m, clear', clear], ['soldier 300 m, rain', rain], ['soldier 300 m, low fog', fog], ['soldier 100 m, low fog', fog100]);
  ok(rain > clear * 1.2, 'rain hides: ' + f1(rain) + ' s against ' + f1(clear) + ' s clear');
  ok(fog > rain && fog100 < fog, 'low fog hides more at range (' + f1(fog) + ' s at 300 m) than close (' + f1(fog100) + ' s at 100 m)');
  fresh('modern', 'dia', 'neblina'); const g0 = C.hgt(B.x, B.z), a = { x: B.x, y: g0, z: B.z }, t = { x: B.x + 600, y: C.hgt(B.x + 600, B.z), z: B.z }, up = { x: B.x + 600, y: g0 + 1500, z: B.z };
  const low = $('skySee')(a, t, 'man', 0, 600, 1), high = $('skySee')(up, { x: B.x + 1200, y: g0 + 1500, z: B.z }, 'plane', 0, 600, 1), down = $('skySee')(up, a, 'plane', 0, 1600, 1), th = $('skySee')(a, t, 'tank', 0, 600, 1);
  ok(low < .35 && high === 1 && down > low && down < 1, 'the fog is low: ground to ground at 600 m ' + low.toFixed(2) + ', above it ' + high + ', looking down through it ' + down.toFixed(2));
  ok(th > low * 1.5, 'a thermal sight sees through it better (' + th.toFixed(2) + ')');
  fresh('modern', 'dia', 'neblina'); ok(near($('skySee')(a, up, 'aa', 0, 1500, 1), 1), 'a radar ignores fog');
  fresh('modern', 'dia', 'chuva'); const ear = $('skyEar()'); ok(ear < 1 && ear > .6, 'rain covers sound: hearing x' + ear.toFixed(2));
  {
    fresh('modern', 'dia', 'chuva'); const a = man(1, 0, 0, 0), t = man(0, -400, 0, 0); t.ai = null; const r = tk(a, t, 10, .25, () => { t.shotT = S.t; });
    fresh('modern', 'dia'); const a2 = man(1, 0, 0, 0), t2 = man(0, -400, 0, 0); t2.ai = null; const c = tk(a2, t2, 10, .25, () => { t2.shotT = S.t; });
    ok(c < Infinity && r >= c, 'a shot from behind at 400 m is heard (' + f1(c) + ' s), no sooner in the rain (' + f1(r) + ' s)');
  }
  fresh('modern', 'dia', 'chuva'); S.over = true; const W = S.wx, ws = Math.hypot(W.wx, W.wz);
  S.smokes.push({ x: B.x, y: C.hgt(B.x, B.z), z: B.z, t0: S.t, r: 30, h: 15, L: 20 }); const s = S.smokes[0]; C.run(10);
  ok(ws > 4 && near(Math.hypot(s.x - B.x, s.z - B.z), ws * 10, .5), 'the wind (' + ws.toFixed(1) + ' m/s) carries a smoke screen ' + Math.hypot(s.x - B.x, s.z - B.z).toFixed(0) + ' m in 10 s');
  fresh('modern', 'dia', 'limpo'); S.over = true; S.smokes.push({ x: B.x, y: 0, z: B.z, t0: S.t, r: 30, h: 15, L: 20 }); C.run(5); ok(S.smokes[0].x === B.x && S.smokes[0].z === B.z, 'a calm day moves nothing');
  fresh('modern', 'dia', 'variavel'); S.over = true; const w0 = JSON.stringify([S.wx.r, S.wx.f, S.wx.wx]); let changed = false;
  for (let i = 0; i < 12 && !changed; i++) { S.t += $('SKY.vary'); C.run(30, null, .5); changed = JSON.stringify([S.wx.r, S.wx.f, S.wx.wx]) !== w0; }
  ok(changed && S.wx.r >= 0 && S.wx.r <= 1 && S.wx.f >= 0 && S.wx.f <= 1, 'Variável changes during the match (now rain ' + S.wx.r.toFixed(2) + ', fog ' + S.wx.f.toFixed(2) + ')');
}

console.log('-- the same ladder for a player --');
{
  const spotAt = (sky, d, opt) => { fresh('ww2', sky); const me = C.addVehicle('tank', side[0].tanks[0], 0, B.x, B.z, 0), t = C.addVehicle('tank', side[1].tanks[0], 1, B.x + d, B.z, 0); if (opt) opt(me, t); return $('aware')(me, t, 0); };
  ok(spotAt('dia', 1500) && !spotAt('noite', 1500) && spotAt('noite', 500), 'a player\'s own eyes: a tank at 1500 m by day yes, at night no; at 500 m yes');
  ok(spotAt('noite', 1500, (me, t) => { t.shotT = S.t; }), 'at night a tank that fires is seen at 1500 m by its flash');
  ok(spotAt('noite', 1500, (me, t) => { $('skyIll')(1, t.x, 0, t.z, t.x, t.z, 0, 0); }), 'and one under an illumination round');
  fresh('modern', 'noite'); const me = C.addVehicle('tank', side[0].tanks[0], 0, B.x, B.z, 0), t = C.addVehicle('tank', side[1].tanks[0], 1, B.x + 1500, B.z, 0);
  ok($('aware')(me, t, 0), 'today a tank\'s thermal sight still makes one out at 1500 m');
}

console.log('-- the player\'s flare --');
{
  fresh('ww2', 'noite'); S.demo = false; S.my = C.addMan('schutze', 0, B.x, B.z, 0); S.aim = { h: 0, p: 0 };
  ok($('skyFire()') && S.ill.length === 1 && Math.abs(S.ill[0].x - (B.x + $('SKY.ai.reach') * .8)) < 1, 'key 7 fires a hand flare ahead of where the player looks');
  ok(!$('skyFire()'), 'not again before its cool-down');
  for (let i = 0; i < 10; i++) { S.t += 9; $('skyFire()'); }
  ok(S.sky.my === $('SKY.me.n'), 'and no more than ' + $('SKY.me.n') + ' a life');
  fresh('ww2', 'noite'); S.my = C.addPlane(side[0].fighter, 0, B.x, 1500, B.z, 0, false); ok(!$('skyFire()'), 'an aircraft fires none');
}

console.log('-- the AI lights the dark --');
{
  const battle = (era, sky, secs) => { C.seed(11); const s = C.newState(era, null, { watch: 1, sky, wx: 'limpo' }); let n = 0, k = 0, seen = new Set(); C.run(secs || 150, () => { for (const i of s.ill) if (!seen.has(i)) { seen.add(i); n++; if (i.k) k++; } }); return { n, k, s }; };
  const d = battle('ww2', 'dia', 60), n = battle('ww2', 'noite'), m = battle('modern', 'noite');
  console.log('   flares and rounds: 1944 day (60 s) ' + d.n + ', in 150 s 1944 night ' + n.n + ' (' + n.k + ' rounds), today night ' + m.n + ' (' + m.k + ' rounds)');
  ok(d.n === 0, 'by day nobody fires a light');
  ok(n.n > 0 && n.k > 0, '1944 at night: squads fire flares and the guns illumination rounds over what they hear');
  ok(m.n > 0, 'today at night too');
  ok(n.s.ill.every(i => i.end - i.t0 <= 46) && n.n <= 2 * 150 / $('SKY.ai.side') + 2 * 150 / $('SKY.ai.art') + 2, 'within limits: each burns out, no more than a side\'s squads fire one in ' + $('SKY.ai.side') + ' s');
  ok(!H.nan(n.s) && !H.nan(m.s), 'nothing breaks: no NaN in the night battles');
}

console.log('\n  case                                         s to know');
for (const [k, v] of rows) console.log('  ' + k.padEnd(44) + f1(v));
done();
