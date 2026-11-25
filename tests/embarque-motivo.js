'use strict';
/* Why a vehicle cannot be boarded (P11 of the polish board, cf-pol2-fase1): beside a friendly vehicle the soldier was offered "E ENTRAR",
   and the offer went away with no word when the vehicle rolled or had no seat left for it. Now boardNo names the nearest such vehicle and
   why (move, full), trnKeys keeps it in S.nearNo while no vehicle is offered, and the HUD says NÃO DÁ PARA ENTRAR and why */
const fs = require('fs'), H = require('./harness'), C = H.load({ seed: 31 }), $ = C.$, ok = H.ok, dt = 1 / 60;
const html = fs.readFileSync(H.PAGE, 'utf8');
if (typeof $('boardNo') !== 'function') { console.log('no boardNo: a page before it'); process.exit(0); }
const S = C.newState('modern', 'hmmwv', { cls: 'trn', mouse: true }); S.over = false;
S.units = S.units.filter(u => u === S.my); S.planes = []; S.men = S.men.filter(m => m === S.rider || m === S.my); S.squads = [];
const I = S.input, tap = k => { I[k] = true; C.step(dt); I[k] = false; C.step(dt); };
const u = S.my, m = S.rider, keys = () => $('trnKeys')();
C.run(1); tap('yawR'); C.run(.5);
ok(S.my === m && S.near === u && !S.nearNo, 'out of the HMMWV, stopped beside it: E ENTRAR, no reason');
u.sp = 6; keys();
ok(!S.near && S.nearNo && S.nearNo.o === u && S.nearNo.why === 'move', 'the HMMWV rolling at 6 m/s: not offered, and S.nearNo says it moves');
u.sp = 0; const occ = u.occ.slice(); for (let i = 0; i < u.occ.length; i++) u.occ[i] = u.occ[i] || { dummy: 1 }; keys();
ok(!S.near && S.nearNo && S.nearNo.why === 'full', 'every seat taken: S.nearNo says no seat');
for (let i = 0; i < occ.length; i++) u.occ[i] = occ[i]; u.sp = 0; keys();
ok(S.near === u && !S.nearNo, 'a seat free again: offered');
m.x = u.x + 60; m.z = u.z; keys();
ok(!S.near && !S.nearNo, 'far from it: nothing at all');
const e = C.addMan('redRifle', 1, u.x + 3, u.z + 3, 0); ok($('boardNo')(e) === null, 'an enemy soldier beside it: no reason (it is not its side\'s)');
ok(/NÃO DÁ PARA ENTRAR: ' \+ BOARDNO\[S\.nearNo\.why\]/.test(html) && /move: 'em movimento, espere parar', full: 'sem lugar livre'/.test(html), 'the HUD names the reason in words');
H.done();
