'use strict';
/* the models pack: where each model comes from and how build.js turns it into models/pack/<id>.glb.
   sources: poly.pizza id (pid), title, author and licence as the page shows them (build.js --fetch checks the licence again).
   models: src the source; yaw degrees about +y that bring its front to +x (pca: after turning its long axis to x); len: its length in m; paint the materials (names as regexes, or indices) that take the
   side's colour; nodes [regex on the source node name, part]; split rules on the connected pieces left (in 0..1 of the model's box: cx cy cz
   the piece's centre, lo hi its bottom and top, x0 x1 its back and front; long: longer on x than that many times its other sides); def the
   part of whatever is left; rig: a skinned character, anims { source clip: short name }; budget: the triangle cap it is warned over */
module.exports = {
  sources: [
    { pid: 'Btfn3G5Xv4', title: 'SWAT', author: 'Quaternius', lic: 'CC0 1.0' },
    { pid: '4t0RMXCl_Ud', title: 'Tank', author: 'Poly by Google', lic: 'CC-BY 3.0' },
    { pid: '3XAD5t0Djqv', title: 'Military Truck - 2D/3D Collab', author: 'Alex Safayan', lic: 'CC-BY 3.0' }
  ],
  models: {
    soldier: { src: 'Btfn3G5Xv4', rig: 1, yaw: 90, paint: ['^Swat$'], anims: { Idle_Gun: 'idle', Idle_Gun_Pointing: 'aim', Idle_Gun_Shoot: 'fire', Gun_Shoot: 'shot', Walk: 'walk', Run: 'run', Run_Shoot: 'runfire', Death: 'death', Roll: 'roll', HitRecieve: 'hit' } },
    abrams: { src: '4t0RMXCl_Ud', pca: 1, yaw: -16, len: 9.8, paint: [0] },
    hemtt: { src: '3XAD5t0Djqv', yaw: 90, paint: ['^Truck'] }
  }
};
