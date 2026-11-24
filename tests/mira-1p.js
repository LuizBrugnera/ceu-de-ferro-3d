'use strict';
/* cf-pol2 P4 (the owner's D1): sighting on foot goes to the first person. Before, the right button in the third person only brought the
   camera closer over the shoulder (helmet and hand in the view, no sights). This runs the page's own adsCam (in the 3D part, which the
   harness does not load) on a soldier: the right button puts the view in the eye seat on the weapon's sights, letting go brings the third
   person back; a first person chosen with C stays; the scope is the same; the dead, a soldier aboard and the mortar do not; and the camera
   switches before the frame reads its seat (updateCamera calls it before curSeat) */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8');
const a = html.indexOf('const sighted = P =>'), b = html.indexOf('function trnCam(', a);
if (a < 0 || b < 0) { console.log('no adsCam: a page before it'); ok(false, 'the page has adsCam'); done(); process.exit(); }
const C = vm.createContext({});
vm.runInContext('var camSt = { mode: 0 };\n' + html.slice(a, b) + '\n;globalThis.T = { sighted, adsCam, camSt };', C);
const { adsCam, camSt } = C.T;
const man = (k, o) => Object.assign({ man: 1, dead: false, in: null, w: 0, arms: [{ d: { k } }], ctl: { ads: false } }, o);
const P = man(0);
adsCam(P); ok(camSt.mode === 0, 'not sighting: the third person (mode ' + camSt.mode + ')');
P.ctl.ads = true; adsCam(P); ok(camSt.mode === 1 && camSt.sm === 1, 'the right button: the first person, from the sights (mode ' + camSt.mode + ')');
P.ctl.ads = false; adsCam(P); ok(camSt.mode === 0 && !camSt.sm, 'letting go: the third person again (mode ' + camSt.mode + ')');
camSt.mode = 1; P.ctl.ads = true; adsCam(P); P.ctl.ads = false; adsCam(P); ok(camSt.mode === 1, 'a first person chosen with C stays after sighting (mode ' + camSt.mode + ')');
camSt.mode = 0; const sn = man(0, { arms: [{ d: { k: 0, snp: 1 } }] }); sn.ctl.ads = true; adsCam(sn); ok(camSt.mode === 1, 'the scope too'); sn.ctl.ads = false; adsCam(sn);
const mo = man('mort'); mo.ctl.ads = true; adsCam(mo); ok(camSt.mode === 0, 'the mortar aims on its own map: no first person from the right button');
const dd = man(0, { dead: true }); dd.ctl.ads = true; adsCam(dd); ok(camSt.mode === 0, 'the dead: no');
const ab = man(0, { in: {} }); ab.ctl.ads = true; adsCam(ab); ok(camSt.mode === 0, 'aboard a vehicle: no');
const u = html.indexOf('function updateCamera('), cam = html.slice(u, html.indexOf('\n}\n', u)), i = cam.indexOf('adsCam(p)'), j = cam.indexOf('curSeat()');
ok(i > 0 && i < j, 'updateCamera switches the view before it reads the seat (no frame of the old view)');
const tr = html.slice(html.indexOf('function trnCam('), html.indexOf('\n}\n', html.indexOf('function trnCam(')));
ok(!/camSt\.mode = 1/.test(tr), 'the scope\'s own switch in trnCam is gone (one rule, adsCam)');
ok(/camSt\.sm = 0; seated = d;/.test(html), 'a vehicle entered forgets a sighting that took the view (camSt.sm)');
done();
