'use strict';
/* the ground vehicles on the ground (cf-veiculos): every vehicle hung 1.5 m over the ground, its model, its hit boxes, its gun's pivot and
   its seats all from a frame at u.y + 1.5. The oracle is the ground itself: tracks and wheels touch it. So the point a hand (0.2 m) over
   the ground in the middle of a track or a wheel is inside that part's hit box (on the old frame the boxes began 1.5 m up and it was in
   none), a point half a metre over the roof is in no box, the gun's pivot (d.mh) stands over the ground within the vehicle and its mount,
   and the AI aims at the body, below the roof. Each point is put in the vehicle's frame and tested against its boxes as the page's hits
   are (toBody, boxDist) */
const H = require('./harness'), { ok, done } = H;
console.log('page: ' + H.PAGE);
const C = H.load({ seed: 3 }), $ = C.$, bodyY = $('bodyY'), toBody = $('toBody'), boxDist = $('boxDist'), HB = $('HB');
let VLIFT = 1.5; try { VLIFT = $('VLIFT'); } catch (e) {}
C.sandbox('modern');
const S = () => $('S');
/* the parts whose box holds the world point (x, y, z) */
const inside = (u, x, y, z) => { toBody(u, x - u.x, y - u.y - VLIFT, z - u.z, 0); return u.def.parts.filter(d => d.box && boxDist(u, d, HB[0], HB[1], HB[2]) === 0).map(d => d.id); };
/* the world point at the middle (x, z) of a part's box, h m over the ground (the vehicle faces +x: heading 0) */
const at = (u, b, h) => [u.x + b[0], u.y + h, u.z + (b.length === 7 ? b[2] + (b[5] + b[6]) / 2 : b[2])];

for (const [kind, id, low] of [['tank', 'abrams', 'trackR'], ['tank', 't90', 'trackL'], ['car', 'hmmwv', 'wFR'], ['truck', 'ural', 'wRL'], ['lav', 'lav25', 'wFL']]) {
  const u = C.addVehicle(kind, id, 0, S().base[0].x - 200 - S().units.length * 30, S().base[0].z, 0), D = u.def.parts, P = D.find(d => d.id === low && d.box);
  if (!P) { ok(false, id + ': has a part ' + low); continue; }
  const got = inside(u, ...at(u, P.box, .2));
  ok(got.includes(low), id + ': 0.2 m over the ground in the middle of its ' + low + ' is inside it (' + (got.join(' ') || 'in no box') + ')');
  const roof = Math.max(...D.filter(d => d.box).map(d => d.box[1] + d.box[4])) + VLIFT, over = inside(u, u.x, u.y + roof + .5, u.z);
  ok(!over.length, id + ': half a metre over its roof (' + (roof + .5).toFixed(2) + ' m over the ground) is in no box' + (over.length ? ' (' + over.join(' ') + ')' : ''));
  ok(u.def.mh > 1 && u.def.mh < roof + 1.5, id + ': the gun\'s pivot ' + u.def.mh.toFixed(2) + ' m over the ground, at most a mount over its roof ' + roof.toFixed(2));
  const by = bodyY(u) - u.y; ok(by > .4 && by < roof, id + ': the AI aims ' + by.toFixed(2) + ' m over the ground, at the body under the roof');
}
done();
