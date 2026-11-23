'use strict';
/* night vision and thermal in the vehicles (cf-visao-noturna-veiculos): key 6 put only the soldier's goggles on, one switch for the whole match.
   In a vehicle (driver's or gunner's seat: S.my is the vehicle) the vehicle's optics take over: 6 goes naked eye, night vision and, on the
   modern vehicles with a thermal sight (VNV.th), thermal; the vehicle is boarded with the soldier's view and the soldier's own is back when he
   leaves. VNV, vnvTh, vnvVeh, vnvMode and vnvKey run alone here on stub tables; the scene, the HUD and the help read vnvMode */
const fs = require('fs'), vm = require('vm'), { PAGE, ok, done } = require('./harness');
const html = fs.readFileSync(PAGE, 'utf8');
const body = name => { const i = html.indexOf('function ' + name + '('); return i < 0 ? '' : html.slice(i, html.indexOf('\n}\n', i) + 3); };
const cst = html.match(/const VNV = \{[^\n]*\n/), veh = html.match(/const vnvVeh = [^\n]*\n/), th = (html.match(/const vnvTh = [^\n]*\n/) || [''])[0], mode = body('vnvMode'), key = body('vnvKey');
ok(!!cst && !!veh && !!th && !!mode && !!key, 'the optics (VNV, vnvTh, vnvVeh, vnvMode, vnvKey) are in the page');
if (cst && veh && th && mode && key) {
  const d = n => ({ name: n, id: n }), T = { TANKS: {}, TRNS: {}, AAS: {}, PLANES: {}, HELIS: {} };
  for (const [t, ids] of [['TANKS', 'abrams leo2 t90 t72 t55 t62'], ['TRNS', 'lav25 btr82 hmmwv tigr ural'], ['AAS', 'pantsir nasams'], ['PLANES', 'f22 su57 a10 su25 b2 tu160'], ['HELIS', 'ah64 mi28 uh60 mi8']]) for (const id of ids.split(' ')) T[t][id] = d(id);
  const ctx = vm.createContext(Object.assign({ S: null, playMode: 'play' }, T));
  vm.runInContext((cst[0] + th + veh[0]).replace(/^const (\w+)/gm, 'globalThis.$1') + mode + key, ctx);
  const man = { man: 1, dead: false }, S = { modern: true, sky: { nv: false }, my: man }; ctx.S = S;
  const veh1 = { id: 't90', def: T.TANKS.t90, dead: false }, veh2 = { id: 'hmmwv', def: T.TRNS.hmmwv, dead: false }, veh3 = { id: 't55', def: T.TANKS.t55, dead: false };
  const press = () => ctx.vnvKey().text;
  ok(ctx.vnvMode() === 0, 'on foot, goggles off: the naked eye');
  ok(press() === 'Visão noturna ligada' && S.sky.nv && ctx.vnvMode() === 1, 'on foot 6 puts the goggles on, as before');
  S.my = veh1;
  ok(ctx.vnvMode() === 1, 'the soldier with goggles on takes a T-90M: it starts in night vision');
  ok(press() === 'Visão térmica' && ctx.vnvMode() === 2, 'in the T-90M 6 goes on to thermal');
  ok(press() === 'Visão normal' && ctx.vnvMode() === 0, 'and then back to the naked eye');
  ok(press() === 'Visão noturna' && ctx.vnvMode() === 1, 'and to night vision again');
  ok(S.sky.nv === true, 'the vehicle\'s optics leave the soldier\'s goggles as they were');
  ok(ctx.vnvMode() === 1, 'the vehicle keeps its view while the player stays in it');
  S.my = man; S.sky.nv = false;
  ok(ctx.vnvMode() === 0, 'the soldier leaves with goggles off: the naked eye, the vehicle\'s night vision is not his');
  S.my = veh1;
  ok(ctx.vnvMode() === 0, 'boarded again, the T-90M starts with his view (naked eye), not the one it was left with');
  S.my = veh2;
  ok(ctx.vnvMode() === 0, 'a HMMWV boarded with goggles off starts with the naked eye');
  ok(press() === 'Visão noturna' && ctx.vnvMode() === 1, 'in the HMMWV 6 turns night vision on');
  ok(press() === 'Visão normal' && ctx.vnvMode() === 0, 'and off: no thermal sight in a HMMWV');
  S.my = man; S.sky.nv = true; S.my = veh3;
  ok(ctx.vnvMode() === 1, 'the captured T-55 boarded with goggles on: night vision');
  ok(press() === 'Visão normal', 'and 6 turns it off: the T-55 has no thermal sight');
  S.my = man;
  ok(ctx.vnvMode() === 1, 'the soldier with his goggles on leaves: night vision, his own');
  const thermal = ['abrams', 'leo2', 't90', 't72', 'lav25', 'btr82', 'pantsir', 'nasams', 'f22', 'su57', 'a10', 'ah64', 'mi28'];
  for (const t in T) for (const id in T[t]) ok(ctx.vnvTh({ id, def: { ...T[t][id] } }) === thermal.includes(id), id + (thermal.includes(id) ? ' has' : ' has no') + ' thermal sight');
  S.my = veh1; ctx.VNV.m = 2; S.modern = false;
  ok(ctx.vnvMode() === 0, '1944: neither');
  S.modern = true; veh1.dead = true;
  ok(ctx.vnvMode() === 0, 'a dead vehicle: the naked eye');
}
ok(/nv = vnvMode\(\) > 0/.test(body('skyScene')), 'the sky and the lights read the view (vnvMode), on foot and in a vehicle');
ok(/\[vnvMode\(\)\]/.test(body('skyHud')), 'the HUD says the view (VISÃO NOTURNA, TÉRMICA)');
ok(/if \(!thRender\(\)\) renderer\.render\(scene, camera\)/.test(body('render3d')), 'render3d draws the thermal picture when it is on');
ok(/vnvMode\(\) !== 2\) return false/.test(body('thRender')), 'thRender draws only in thermal');
ok(/S\.banner = vnvKey\(\)/.test(html), 'key 6 goes through vnvKey');
done();
