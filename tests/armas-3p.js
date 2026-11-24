'use strict';
/* the weapons seen from outside (cf-armas-3p). In third person every Russian weapon was an AK (and every unlisted one the side's rifle):
   PACK.arm named 14 weapons and the rest fell to that; every weapon was drawn at its model's own size; and the muzzle flash stood where
   manFire lets the round go (the eye, then a metre along the aim), in front of the face and nowhere near the weapon, and the rounds'
   streaks reached back past the shooter. Now: every weapon a kit carries has its own row (model, length, what is added); the soldier's
   weapon is that row's; the flash is at the muzzle of the weapon drawn this frame (MZW, written by the pose) and a soldier's round is drawn
   from it. The pack and frame blocks live in the 3D part of the page, which the harness does not load: their pieces run here on their own */
const fs = require('fs'), path = require('path'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8');
console.log('page: ' + H.PAGE);
const C = H.load(), SARMS = C.$('SARMS'), KITS = C.$('KITS');

console.log('-- every weapon a kit carries has a row of its own --');
const pa = html.indexOf('const PACK = {'), pb = html.indexOf('\n};\n', pa);
const PACK = vm.runInNewContext('(' + html.slice(pa + 'const PACK = '.length, pb + 2) + ')');
const key = new Map(Object.keys(SARMS).map(k => [SARMS[k], k]));
const carried = new Set();
const shadow = new Set();   // a def a later table replaced under its key (the Insurgents' old Kornet): no key, drawn by its kind
for (const id in KITS) for (const d of KITS[id].arms || []) if (d && d.k !== 'mort') { if (key.has(d)) carried.add(key.get(d)); else shadow.add(d); }
const missing = [...carried].filter(k => !PACK.arm[k]);
ok(carried.size >= 30 && !missing.length, carried.size + ' weapons carried by the kits, each with its row in PACK.arm' + (missing.length ? ' (missing: ' + missing.join(', ') + ')' : ''));
const models = new Set(fs.readdirSync(path.join(H.ROOT, 'models', 'pack')).filter(f => /^w_.*\.glb$/.test(f)).map(f => f.slice(0, -4)));
const bad = Object.entries(PACK.arm).filter(([, e]) => !Array.isArray(e) || !models.has(e[0]) || !(e[1] > .1 && e[1] < 2) || (e[2] !== undefined && !/^[sba]+$/.test(e[2])));
ok(!bad.length, 'each row a model of the pack (' + [...models].join(', ') + '), a length in m and what is added (s, b, a)' + (bad.length ? ': ' + bad.map(r => r[0]).join(', ') : ''));
const ru = ['ak', 'akm', 'aks74u', 'pkp', 'pkm', 'svd', 'osv96', 'mp443', 'pm', 'vityaz', 'rpg', 'rpg7v', 'igla', 'strela', 'malyutka', 'kornet'];
ok(ru.filter(k => PACK.arm[k][0] === 'w_ak').length === 5 && ['pkp', 'pkm'].every(k => /b/.test(PACK.arm[k][2])), 'of the Russian and the Insurgents\' weapons only the AK family is the AK model, and the machine guns on it carry a bipod');
ok(PACK.arm.mg42[1] > PACK.arm.mp40[1] && PACK.arm.osv96[1] > PACK.arm.svd[1] && PACK.arm.aks74u[1] < PACK.arm.ak[1] && PACK.arm.pm[1] < PACK.arm.m17[1], 'each its own length: the MG 42 longer than the MP 40, the OSV-96 than the SVD, the AKS-74U shorter than the AK-12');

console.log('-- the soldier\'s weapon is his row --');
const fa = html.indexOf('function packArmOf(m) {'), fb = html.indexOf('\n}\n', fa);
ok(fa > 0, 'packArmOf, the row of the weapon in hand');
const pctx = vm.createContext({ PACK, PACK_SARM: key });
vm.runInContext(html.slice(fa, fb + 2) + ';globalThis.packArmOf = packArmOf;', pctx);
let wrong = [], n = 0;
for (const id in KITS) {
  const d = KITS[id]; (d.arms || []).forEach((a, w) => {
    if (!a) return; n++;
    const e = pctx.packArmOf({ civ: false, def: d, w, arms: d.arms.map(x => ({ d: x })) });
    if (a.k === 'mort' ? !(e && /m/.test(e[2])) : shadow.has(a) ? !(e && e[0] === (a.k === 'atgm' || a.k === 'sam' ? 'w_launcher' : 'w_bazooka')) : e !== PACK.arm[key.get(a)]) wrong.push(id + ':' + (key.get(a) || a.name));
  });
}
ok(n > 60 && !wrong.length, 'every weapon of every kit (' + n + ') drawn as its own row, a mortar as its tube, a replaced def (' + [...shadow].map(d => d.name).join(', ') + ') by its kind' + (wrong.length ? ': ' + wrong.join(', ') : ''));
ok(pctx.packArmOf({ civ: true, def: KITS.redRifle, w: 0, arms: [{ d: SARMS.ak }] }) === null, 'a civilian carries none');

console.log('-- the flash at the drawn muzzle, the round from it --');
const ta = html.indexOf('const TRS = {'), tb = html.indexOf('function pjTrail(', ta);
const g = vm.createContext({ Math, WeakMap, STANCE: [{ eye: 1.6 }, { eye: 1.1 }, { eye: .35 }], MAN: { sc: 1 }, frameId: 7 });
vm.runInContext(html.slice(ta, tb) + '\n;globalThis.$ = s => eval(s);', g, { filename: 'gunfire.js' });
const mzAt = g.$('mzAt'), mzSet = g.$('mzSet'), mzRound = g.$('mzRound'), MZ = g.$('MZ');
{
  const cam = { x: 0, y: 10, z: 0 }, m = { x: 100, y: 20, z: 0, st: 0, h: 0, f: { x: 0, y: 0, z: -1 }, shotT: 10 };
  const eye = mzAt(m, 10.02, cam);
  mzSet(m, { x: 100.3, y: 21.4, z: -.8 });
  const at = mzAt(m, 10.02, cam);
  ok(at && at[0] === 100.3 && at[1] === 21.4 && at[2] === -.8 && at[3] === eye[3], 'a soldier posed this frame: the flash at his weapon\'s muzzle (' + at.slice(0, 3) + '), not ' + eye.slice(0, 3).map(v => +v.toFixed(2)));
  g.frameId = 8;
  const old = mzAt(m, 10.02, cam);
  ok(old && Math.abs(old[1] - eye[1]) < 1e-9, 'a muzzle of an earlier frame (not posed now: too far, or in first person) is not used: the eye\'s point');
  ok(mzAt(m, 10 + MZ.t + .01, cam) === null, 'and still only for MZ.t s after the shot');
  g.frameId = 9; mzSet(m, { x: 100.3, y: 21.4, z: -.8 });
  const b = { by: Object.assign(m, { man: true }), x: 100, y: 21.5, z: -1, vx: 0, vy: 0, vz: -800 }, o = mzRound(b);
  ok(o && o[2] === -.8, 'a soldier\'s round keeps the muzzle his weapon showed when it was first drawn');
  m.x = 500; mzSet(m, { x: 500, y: 0, z: 0 });
  ok(mzRound(b)[0] === 100.3, '  and keeps it as he moves on');
  ok(mzRound({ by: { kind: 'tank' }, x: 0, y: 0, z: 0 }) === 0, 'a vehicle\'s round: drawn as before');
  const mzTail = g.$('mzTail'), r = { by: m, x: 100.3, y: 21.4, z: -.8 - 3, vx: 0, vy: 0, vz: -800 };
  g.frameId = 10; m.x = 100; mzSet(m, { x: 100.3, y: 21.4, z: -.8 });
  const t1 = mzTail(r, .028);
  ok(t1 && Math.abs(t1[2] + .8) < 1e-9, 'a round 3 m out of the muzzle: its 22 m streak starts at the muzzle, not behind the shooter (tail z ' + (t1 && t1[2].toFixed(2)) + ')');
  const r2 = { by: m, x: 100.3, y: 21.4, z: -.8 - 40, vx: 0, vy: 0, vz: -800 }, t2 = mzTail(r2, .028);
  ok(t2 && Math.abs(t2[2] - (-40.8 + 22.4)) < 1e-6, 'one 40 m out: its full streak, 22.4 m long');
  const r3 = { by: m, x: 100.3, y: 21.4, z: -.3, vx: 0, vy: 0, vz: -800 };
  ok(mzTail(r3, .028) === null, 'one not yet out of the muzzle (the sim lets it go from the eye, behind it): not drawn');
  const v = { by: { kind: 'tank' }, x: 0, y: 0, z: -10, vx: 0, vy: 0, vz: -800 }, t4 = mzTail(v, .05);
  ok(t4 && Math.abs(t4[2] - 30) < 1e-9, 'a vehicle\'s round: its streak as before');
}

done();
