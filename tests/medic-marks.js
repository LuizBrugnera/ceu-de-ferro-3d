'use strict';
/* the medic's armband and helmet cross (cf-medico's poseMan wrapper), fixed in cf-pol-modelos: a medic near the eye is drawn as the pack's
   animated model (PM.by has him) and the box rig is never posed for him; when no soldier far off had been posed yet, the rig did not exist
   and rig.san threw inside the scene's frame, so the picture stopped every frame such a medic was near. Now the marks go only on a medic
   the rig posed: none for one the pack draws (with or without a rig), five for one the rig drew. The wrapper runs here on stubs */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8'), a = html.indexOf('/* the look: the armband and the cross on the helmet'), b = html.indexOf('/* the hangar\'s card, keys and briefing */', a);
console.log('page: ' + H.PAGE);
if (a < 0 || b < 0) { console.log('no medic marks: a page before them'); process.exit(0); }
class O3 { constructor() { this.position = { set() {} }; this.scale = { set() {} }; this.children = []; } add(c) { this.children.push(c); } updateMatrixWorld() {} }
const mkRig = () => ({ arms: [new O3(), new O3()], body: new O3() });
function run(rig0, pack, posedByRig) {
  const puts = [], ctx = vm.createContext({ THREE: { Object3D: O3 }, rig: rig0, PM: { by: new Map() }, console });
  ctx.poseMan = (m, put) => { if (posedByRig && !ctx.rig) ctx.rig = mkRig(); };   // the base: the rig is made when it poses a soldier itself
  vm.runInContext(html.slice(a, b), ctx, { filename: 'medic-marks.js' });
  const m = { def: { med: 1 }, dead: false };
  if (pack) ctx.PM.by.set(m, { m });
  let err = null; try { ctx.poseMan(m, (o, c) => puts.push(c)); } catch (e) { err = e; }
  return { err, puts };
}
let r = run(null, true, false);
ok(!r.err && !r.puts.length, 'a medic the pack draws, no rig yet: nothing thrown, no marks' + (r.err ? ' (' + r.err.message + ')' : ''));
r = run(mkRig(), true, false);
ok(!r.err && !r.puts.length, 'a medic the pack draws, a rig from someone else: no marks put with another soldier\'s pose');
r = run(null, false, true);
ok(!r.err && r.puts.length === 5, 'a medic the rig draws (the rig made for him): the armband and the cross, ' + r.puts.length + ' marks');
r = run(mkRig(), false, true);
ok(!r.err && r.puts.length === 5 && r.puts.filter(c => c === 0xc8102e).length === 3, 'with a rig already there: the same five, three of them red');
done();
